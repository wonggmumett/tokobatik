import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function Cart() {
  const { items, total, update, remove } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <main className="cart-page empty-cart">
        <div className="empty-icon">NB</div>
        <h1>Keranjang masih kosong.</h1>
        <p>Temukan batik yang ingin kamu bawa pulang.</p>
        <Link className="button dark" to="/products">
          Mulai belanja
        </Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="page-title">
        <span className="eyebrow">YOUR BAG</span>
        <h1>Keranjang belanja</h1>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const image =
              item.product?.image_url ||
              "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80";
            const stock = Number(item.product?.stock || 0);

            return (
              <div className="cart-item" key={item.cartId}>
                <img src={image} alt={item.product?.name || "Produk"} />

                <div className="cart-item-info">
                  <small>
                    {item.product?.categories?.name ||
                      item.product?.category ||
                      "Batik"}{" "}
                    • {item.size}
                  </small>

                  <h3>{item.product?.name}</h3>
                  <strong>{rupiah(item.product?.price)}</strong>

                  <div className="qty">
                    <button
                      type="button"
                      aria-label="Kurangi jumlah"
                      onClick={() => update(item.cartId, item.quantity - 1)}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Tambah jumlah"
                      disabled={stock > 0 && item.quantity >= stock}
                      onClick={() => update(item.cartId, item.quantity + 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="delete"
                  onClick={() => remove(item.cartId)}
                  aria-label={`Hapus ${item.product?.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>

        <aside className="summary">
          <span>Ringkasan</span>

          <div>
            <b>Subtotal</b>
            <b>{rupiah(total)}</b>
          </div>

          <small>Ongkir dihitung saat proses checkout.</small>

          <button
            type="button"
            className="button dark wide"
            onClick={() => navigate("/checkout")}
          >
            Lanjut checkout <ArrowRight size={17} />
          </button>
        </aside>
      </div>
    </main>
  );
}
