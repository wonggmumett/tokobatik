import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user, profile } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: profile?.full_name || "",
    phone: "",
    address: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    // ==========================================
    // VALIDASI KERANJANG
    // ==========================================

    if (!items.length) {
      setError("Keranjang masih kosong.");
      return;
    }

    // ==========================================
    // VALIDASI LOGIN
    // ==========================================

    if (!user?.id) {
      setError("Silakan login terlebih dahulu.");
      nav("/login");
      return;
    }

    // ==========================================
    // MULAI PROSES
    // ==========================================

    setBusy(true);
    setError("");

    try {
      // ==========================================
      // AMBIL USER SUPABASE TERBARU
      // ==========================================

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
      }

      // ==========================================
      // VALIDASI FORM
      // ==========================================

      const customerName = form.name.trim();
      const phone = form.phone.trim();
      const address = form.address.trim();

      if (!customerName) {
        throw new Error("Nama penerima wajib diisi.");
      }

      if (!phone) {
        throw new Error("Nomor WhatsApp wajib diisi.");
      }

      if (!address) {
        throw new Error("Alamat lengkap wajib diisi.");
      }

      if (!total || total <= 0) {
        throw new Error("Total pesanan tidak valid.");
      }

      // ==========================================
      // 1. BUAT ORDER
      // ==========================================

      const orderPayload = {
        user_id: currentUser.id,
        customer_name: customerName,
        customer_email: currentUser.email || null,
        phone: phone,
        address: address,
        total: total,

        // Status order
        status: "pending",

        // Sesuai database:
        // unpaid | paid | failed | refunded
        payment_status: "unpaid",

        notes: null,
      };

      console.log("ORDER PAYLOAD:", orderPayload);

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) {
        console.error(
          "ORDER INSERT ERROR:",
          orderError
        );

        throw new Error(
          orderError.message ||
            "Gagal membuat pesanan."
        );
      }

      if (!order?.id) {
        throw new Error(
          "Order berhasil dibuat tetapi ID order tidak ditemukan."
        );
      }

      console.log(
        "ORDER BERHASIL:",
        order
      );

      // ==========================================
      // 2. SIAPKAN ORDER ITEMS
      // ==========================================

      const rows = items.map((x) => ({
        order_id: order.id,
        product_id: x.product.id,
        product_name: x.product.name,
        price: x.product.price,
        size: x.size || null,
        quantity: x.quantity,
      }));

      console.log(
        "ORDER ITEMS:",
        rows
      );

      // ==========================================
      // 3. SIMPAN ORDER ITEMS
      // ==========================================

      const {
        error: itemError,
      } = await supabase
        .from("order_items")
        .insert(rows);

      if (itemError) {
        console.error(
          "ORDER ITEMS INSERT ERROR:",
          itemError
        );

        throw new Error(
          itemError.message ||
            "Gagal menyimpan detail pesanan."
        );
      }

      console.log(
        "ORDER ITEMS BERHASIL"
      );

      // ==========================================
      // 4. KOSONGKAN KERANJANG
      // ==========================================

      clear();

      // ==========================================
      // 5. REDIRECT KE DETAIL ORDER
      // ==========================================

      nav(`/orders/${order.id}`);
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

  return (
    <main className="checkout">
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="page-title">
        <span className="eyebrow">
          CHECKOUT
        </span>

        <h1>
          Selesaikan pesanan
        </h1>
      </div>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <div className="checkout-grid">

        {/* ========================================
            FORM CHECKOUT
        ======================================== */}

        <form
          className="checkout-form"
          onSubmit={submit}
        >
          {/* ERROR */}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* NAMA */}

          <label>
            Nama penerima

            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Masukkan nama penerima"
            />
          </label>

          {/* NOMOR WHATSAPP */}

          <label>
            No. WhatsApp

            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              placeholder="08xxxxxxxxxx"
            />
          </label>

          {/* ALAMAT */}

          <label>
            Alamat lengkap

            <textarea
              required
              rows="5"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
              placeholder="Masukkan alamat lengkap pengiriman"
            />
          </label>

          {/* BUTTON */}

          <button
            type="submit"
            className="button dark wide"
            disabled={busy}
          >
            {busy
              ? "Menyimpan..."
              : "Buat pesanan"}
          </button>
        </form>

        {/* ========================================
            RINGKASAN PESANAN
        ======================================== */}

        <aside className="summary">
          <span>
            Pesanan
          </span>

          {items.map((x) => (
            <div
              className="summary-line"
              key={x.cartId}
            >
              <span>
                {x.product.name} ×{" "}
                {x.quantity}
              </span>

              <b>
                {rupiah(
                  x.product.price *
                    x.quantity
                )}
              </b>
            </div>
          ))}

          <hr />

          <div className="summary-line">
            <b>
              Total
            </b>

            <b>
              {rupiah(total)}
            </b>
          </div>
        </aside>
      </div>
    </main>
  );
}