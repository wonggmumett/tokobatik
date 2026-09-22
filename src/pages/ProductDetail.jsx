import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: queryError } = await supabase
        .from("products")
        .select("*, categories(id,name,slug)")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (queryError) {
        console.error("PRODUCT DETAIL ERROR:", queryError);
        setError("Produk tidak ditemukan.");
      } else {
        setProduct(data);
        const sizes = Array.isArray(data?.sizes) ? data.sizes : [];
        setSize(sizes[0] || "All");
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <div className="screen-loading">Memuat produk...</div>;

  if (error || !product) {
    return (
      <main className="detail">
        <Link to="/products" className="back">
          <ArrowLeft size={16} /> Kembali ke koleksi
        </Link>
        <div className="empty">{error || "Produk tidak ditemukan."}</div>
      </main>
    );
  }

  const image =
    product.image_url ||
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80";
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const stock = Number(product.stock || 0);
  const category = product.categories?.name || "Batik";

  function addToCart() {
    const result = addItem(product, size || "All", quantity);
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  }

  return (
    <main className="detail">
      <Link to="/products" className="back">
        <ArrowLeft size={16} /> Kembali ke koleksi
      </Link>

      <div className="detail-grid">
        <div className="detail-image">
          <img src={image} alt={product.name} />
        </div>

        <div className="detail-copy">
          <span className="eyebrow">{category}</span>
          <h1>{product.name}</h1>
          <div className="price">{rupiah(product.price)}</div>

          <p>
            {product.description ||
              "Koleksi batik pilihan Nusantara dengan sentuhan modern."}
          </p>

          {sizes.length > 0 && (
            <div className="option">
              <label>Ukuran</label>
              <div>
                {sizes.map((item) => (
                  <button
                    type="button"
                    className={size === item ? "selected" : ""}
                    key={item}
                    onClick={() => setSize(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="stock-note">
            {stock > 0 ? `${stock} item tersedia` : "Stok habis"}
          </div>

          <div className="quantity">
            <label>Jumlah</label>
            <div>
              <button
                type="button"
                disabled={stock <= 0 || quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus size={15} />
              </button>
              <b>{quantity}</b>
              <button
                type="button"
                disabled={stock <= 0 || quantity >= stock}
                onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="button dark wide"
            disabled={stock <= 0}
            onClick={addToCart}
          >
            <ShoppingBag size={18} />
            {added ? "Ditambahkan ✓" : stock > 0 ? "Tambahkan ke keranjang" : "Stok habis"}
          </button>

          {stock > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/cart")}
            >
              Lihat keranjang →
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
