import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  UserRound,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
    =========================================================
    AMBIL DATA OTOMATIS DARI PROFIL LOGIN
    =========================================================
  */
  useEffect(() => {
    setForm((current) => ({
      ...current,

      // Nama dari profiles
      name: profile?.full_name || current.name || "",

      // Nomor WhatsApp dari profiles
      phone: profile?.phone || current.phone || "",

      // Email dari akun Supabase Auth
      email: user?.email || current.email || "",

      // Alamat dari profiles
      address: profile?.address || current.address || "",
    }));
  }, [profile, user]);

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!items.length) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (!user?.id) {
      navigate("/login", {
        state: {
          from: {
            pathname: "/checkout",
          },
        },
      });

      return;
    }

    const customerName = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const notes = form.notes.trim();

    if (!customerName) {
      return setError(
        "Nama penerima belum tersedia. Lengkapi profil terlebih dahulu."
      );
    }

    if (!phone) {
      return setError(
        "Nomor WhatsApp belum tersedia. Lengkapi profil terlebih dahulu."
      );
    }

    if (!email) {
      return setError(
        "Email akun tidak ditemukan. Silakan login kembali."
      );
    }

    if (!address) {
      return setError(
        "Alamat belum tersedia. Lengkapi alamat di halaman profil terlebih dahulu."
      );
    }

    if (!total || total <= 0) {
      return setError("Total pesanan tidak valid.");
    }

    setBusy(true);

    try {
      /*
        =======================================================
        VERIFIKASI USER LOGIN
        =======================================================
      */

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
      }

      /*
        =======================================================
        AMBIL DATA PRODUK TERBARU
        =======================================================
      */

      const productIds = items.map(
        (item) => item.product.id
      );

      const {
        data: freshProducts,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          "id,name,price,stock,image_url,is_active"
        )
        .in("id", productIds);

      if (productsError) {
        throw productsError;
      }

      const freshMap = new Map(
        (freshProducts || []).map((product) => [
          product.id,
          product,
        ])
      );

      /*
        =======================================================
        CEK PRODUK & STOK
        =======================================================
      */

      for (const item of items) {
        const fresh = freshMap.get(
          item.product.id
        );

        if (!fresh || !fresh.is_active) {
          throw new Error(
            `${item.product.name} sudah tidak tersedia.`
          );
        }

        if (
          Number(fresh.stock) <
          Number(item.quantity)
        ) {
          throw new Error(
            `Stok ${fresh.name} tidak mencukupi. Tersedia ${fresh.stock} item.`
          );
        }
      }

      /*
        =======================================================
        HITUNG TOTAL BERDASARKAN HARGA TERBARU
        =======================================================
      */

      const verifiedTotal = items.reduce(
        (sum, item) => {
          const fresh = freshMap.get(
            item.product.id
          );

          return (
            sum +
            Number(fresh.price || 0) *
              Number(item.quantity || 0)
          );
        },
        0
      );

      /*
        =======================================================
        BUAT ORDER
        =======================================================
      */

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: currentUser.id,

          customer_name: customerName,

          customer_email:
            currentUser.email || email || null,

          phone,

          address,

          total: verifiedTotal,

          status: "pending",

          payment_status: "unpaid",

          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      /*
        =======================================================
        ORDER ITEMS
        =======================================================
      */

      const rows = items.map((item) => {
        const fresh = freshMap.get(
          item.product.id
        );

        return {
          order_id: order.id,

          product_id: fresh.id,

          product_name: fresh.name,

          price: Number(
            fresh.price || 0
          ),

          quantity: Number(
            item.quantity || 1
          ),

          size:
            item.size === "All"
              ? null
              : item.size || null,

          color:
            item.color || null,

          image_url:
            fresh.image_url || null,
        };
      });

      const { error: itemsError } =
        await supabase
          .from("order_items")
          .insert(rows);

      if (itemsError) {
        throw itemsError;
      }

      /*
        =======================================================
        SELESAI
        =======================================================
      */

      clear();

      setSuccess(
        "Pesanan berhasil dibuat."
      );

      navigate(
        `/orders/${order.id}`
      );
    } catch (err) {
      console.error(
        "CHECKOUT ERROR:",
        err
      );

      setError(
        err?.message ||
          "Checkout gagal. Silakan coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  /*
    =========================================================
    KERANJANG KOSONG
    =========================================================
  */

  if (!items.length && !success) {
    return (
      <main className="checkout">
        <div className="empty">
          <h2>Keranjang kosong.</h2>

          <Link
            to="/products"
            className="button dark"
          >
            Kembali belanja
          </Link>
        </div>
      </main>
    );
  }

  /*
    =========================================================
    CHECKOUT
    =========================================================
  */

  return (
    <main className="checkout">
      <div className="page-title">
        <span className="eyebrow">
          CHECKOUT
        </span>

        <h1>
          Selesaikan pesanan
        </h1>
      </div>

      <div className="checkout-grid">
        <form
          className="checkout-form"
          onSubmit={submit}
        >
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {success && (
            <div className="success">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {/* =================================================
              INFO PROFIL
          ================================================= */}

          <div className="checkout-profile-note">
            <div className="checkout-profile-icon">
              <UserRound size={18} />
            </div>

            <div>
              <strong>
                Data akun otomatis
              </strong>

              <span>
                Nama, WhatsApp, email, dan alamat
                diambil dari profil akunmu.
              </span>
            </div>

            <Link to="/profile">
              Ubah profil
            </Link>
          </div>

          {/* =================================================
              NAMA
          ================================================= */}

          <label>
            <span className="checkout-label">
              <UserRound size={15} />
              Nama penerima
            </span>

            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                change(
                  "name",
                  e.target.value
                )
              }
              placeholder="Nama penerima"
            />
          </label>

          {/* =================================================
              WHATSAPP
          ================================================= */}

          <label>
            <span className="checkout-label">
              <Phone size={15} />
              No. WhatsApp
            </span>

            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) =>
                change(
                  "phone",
                  e.target.value
                )
              }
              placeholder="08xxxxxxxxxx"
            />
          </label>

          {/* =================================================
              EMAIL
          ================================================= */}

          <label>
            <span className="checkout-label">
              <Mail size={15} />
              Email
            </span>

            <input
              type="email"
              required
              value={form.email}
              readOnly
              disabled
              autoComplete="email"
            />

            <small className="checkout-readonly">
              Email mengikuti akun yang sedang login.
            </small>
          </label>

          {/* =================================================
              ALAMAT
          ================================================= */}

          <label>
            <span className="checkout-label">
              <MapPin size={15} />
              Alamat lengkap
            </span>

            <textarea
              required
              rows="5"
              value={form.address}
              onChange={(e) =>
                change(
                  "address",
                  e.target.value
                )
              }
              placeholder="Alamat lengkap pengiriman"
            />
          </label>

          {/* =================================================
              CATATAN
          ================================================= */}

          <label>
            Catatan pesanan{" "}
            <span className="optional">
              (opsional)
            </span>

            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) =>
                change(
                  "notes",
                  e.target.value
                )
              }
              placeholder="Contoh: patokan rumah, permintaan khusus, dll."
            />
          </label>

          {/* =================================================
              BUTTON
          ================================================= */}

          <button
            type="submit"
            className="button dark wide"
            disabled={busy}
          >
            {busy
              ? "Menyimpan pesanan..."
              : "Buat pesanan"}
          </button>
        </form>

        {/* ===================================================
            ORDER SUMMARY
        =================================================== */}

        <aside className="summary">
          <span>Pesanan</span>

          {items.map((item) => (
            <div
              className="summary-line"
              key={item.cartId}
            >
              <span>
                {item.product.name} ×{" "}
                {item.quantity}
              </span>

              <b>
                {rupiah(
                  Number(
                    item.product.price
                  ) *
                    item.quantity
                )}
              </b>
            </div>
          ))}

          <hr />

          <div className="summary-line">
            <b>Total</b>

            <b>
              {rupiah(total)}
            </b>
          </div>
        </aside>
      </div>
    </main>
  );
}