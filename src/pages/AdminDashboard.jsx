import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit3,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const money = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const emptyForm = {
  name: "",
  category_id: "",
  price: "",
  compare_price: "",
  description: "",
  sizes: "S,M,L,XL",
  colors: "",
  stock: "0",
  sku: "",
  image_url: "",
  is_active: true,
  is_featured: false,
};

function slugify(value) {
  return value
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminDashboard() {
  const { profile, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");

  async function loadData() {
    setLoading(true);

    const [productsResult, ordersResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(id,name,slug)")
        .order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (productsResult.error) setError(productsResult.error.message);
    if (ordersResult.error) setError(ordersResult.error.message);
    if (categoriesResult.error) setError(categoriesResult.error.message);

    setProducts(productsResult.data || []);
    setOrders(ordersResult.data || []);
    setCategories(categoriesResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(
    () =>
      orderFilter === "all"
        ? orders
        : orders.filter((order) => order.status === orderFilter),
    [orders, orderFilter]
  );

  const sales = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category_id: product.category_id || "",
      price: product.price ?? "",
      compare_price: product.compare_price ?? "",
      description: product.description || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : "",
      colors: Array.isArray(product.colors) ? product.colors.join(",") : "",
      stock: product.stock ?? 0,
      sku: product.sku || "",
      image_url: product.image_url || "",
      is_active: product.is_active !== false,
      is_featured: product.is_featured === true,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Nama produk wajib diisi.");
      setSaving(false);
      return;
    }

    if (!form.category_id) {
      setError("Pilih kategori produk.");
      setSaving(false);
      return;
    }

    const baseSlug = slugify(form.name);
    let slug = baseSlug;

    // Saat edit, slug lama dipertahankan jika nama tidak berubah.
    if (editingId) {
      const current = products.find((item) => item.id === editingId);
      slug = current?.name === form.name ? current.slug : `${baseSlug}-${editingId.slice(0, 6)}`;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      category_id: form.category_id,
      description: form.description.trim() || null,
      price: Number(form.price || 0),
      compare_price: form.compare_price === "" ? null : Number(form.compare_price),
      stock: Math.max(0, Number(form.stock || 0)),
      sku: form.sku.trim() || null,
      image_url: form.image_url.trim() || null,
      is_active: Boolean(form.is_active),
      is_featured: Boolean(form.is_featured),
      sizes: form.sizes
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    const result = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(editingId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
      resetForm();
      await loadData();
    }

    setSaving(false);
  }

  async function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!window.confirm(`Hapus produk "${product?.name || ""}"?`)) return;

    const { error: deleteError } = await supabase.from("products").delete().eq("id", id);

    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Produk dihapus.");
      await loadData();
    }
  }

  async function updateOrderStatus(id, status) {
    setError("");
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) setError(updateError.message);
    else {
      setMessage("Status pesanan diperbarui.");
      await loadData();
    }
  }

  async function updatePaymentStatus(id, payment_status) {
    setError("");
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) setError(updateError.message);
    else {
      setMessage("Status pembayaran diperbarui.");
      await loadData();
    }
  }

  if (profile?.role !== "admin") {
    return (
      <main className="admin-denied">
        <h1>Akses admin diperlukan.</h1>
        <button className="button dark" onClick={logout}>
          Keluar
        </button>
      </main>
    );
  }

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <span className="eyebrow">NUSANTARA BATIK / ADMIN</span>
          <h1>Dashboard</h1>
          <p>Kelola katalog, stok, dan pesanan dari satu tempat.</p>
        </div>

        <div className="admin-actions">
          <button type="button" onClick={loadData} title="Muat ulang">
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" onClick={logout}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      {message && <div className="notice success"><Check size={15} /> {message}</div>}
      {error && <div className="notice error"><X size={15} /> {error}</div>}

      <section className="admin-stats">
        <div><Package /><span>Produk</span><b>{products.length}</b></div>
        <div><ShoppingBag /><span>Pesanan</span><b>{orders.length}</b></div>
        <div><span>Penjualan tercatat</span><b>{money(sales)}</b></div>
      </section>

      <div className="admin-grid">
        <form className="admin-form" onSubmit={saveProduct}>
          <div className="admin-form-head">
            <h2>{editingId ? "Edit produk" : "Tambah produk"}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-button">
                Batal
              </button>
            )}
          </div>

          <label>
            Nama produk
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Kemeja Batik Parang"
            />
          </label>

          <label>
            Kategori
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <div className="form-two">
            <label>Harga<input type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label>Harga coret<input type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} /></label>
          </div>

          <div className="form-two">
            <label>Stok<input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
            <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
          </div>

          <label>Ukuran<input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S,M,L,XL" /></label>
          <label>Warna<input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Hitam,Putih" /></label>
          <label>URL gambar<input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></label>
          <label>Deskripsi<textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>

          <div className="check-group">
            <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Produk aktif</label>
            <label className="check"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Produk pilihan</label>
          </div>

          <button className="button dark wide" disabled={saving}>
            {saving ? "Menyimpan..." : editingId ? <><Edit3 size={16} /> Simpan perubahan</> : <><Plus size={16} /> Tambah produk</>}
          </button>
        </form>

        <section className="admin-products">
          <div className="admin-section-head">
            <h2>Produk</h2>
            <span>{products.length} item</span>
          </div>

          {loading ? (
            <div className="empty">Memuat data...</div>
          ) : !products.length ? (
            <div className="empty">Belum ada produk.</div>
          ) : (
            products.map((product) => (
              <article className="admin-product" key={product.id}>
                <img src={product.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80"} alt="" />
                <div>
                  <b>{product.name}</b>
                  <span>{product.categories?.name || "Tanpa kategori"} • {money(product.price)}</span>
                  <small>Stok {product.stock} {product.is_featured ? "• Pilihan" : ""}</small>
                </div>
                <button type="button" onClick={() => editProduct(product)} title="Edit"><Edit3 size={15} /></button>
                <button type="button" onClick={() => deleteProduct(product.id)} title="Hapus"><Trash2 size={15} /></button>
              </article>
            ))
          )}
        </section>
      </div>

      <section className="admin-orders">
        <div className="admin-section-head">
          <div>
            <span className="eyebrow">ORDER MANAGEMENT</span>
            <h2>Pesanan pelanggan</h2>
          </div>
          <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
            <option value="all">Semua status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {!filteredOrders.length ? (
          <div className="empty">Belum ada pesanan untuk filter ini.</div>
        ) : (
          <div className="admin-order-list">
            {filteredOrders.map((order) => (
              <article className="admin-order-row" key={order.id}>
                <div>
                  <b>#{order.id.slice(0, 8).toUpperCase()}</b>
                  <span>{order.customer_name} • {order.phone}</span>
                  <small>{new Date(order.created_at).toLocaleString("id-ID")}</small>
                </div>

                <strong>{money(order.total)}</strong>

                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={order.payment_status}
                  onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
