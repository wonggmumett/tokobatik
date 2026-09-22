import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user?.id || !id) return;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (orderError) {
        setError("Pesanan tidak ditemukan atau tidak dapat diakses.");
        setLoading(false);
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("created_at");

      if (itemError) setError(itemError.message);

      setOrder(orderData);
      setItems(itemData || []);
      setLoading(false);
    }

    load();
  }, [id, user?.id]);

  if (loading) return <div className="screen-loading">Memuat pesanan...</div>;

  if (error || !order) {
    return (
      <main className="order-detail">
        <Link to="/orders" className="back">
          <ArrowLeft size={16} /> Semua pesanan
        </Link>
        <div className="error">{error || "Pesanan tidak ditemukan."}</div>
      </main>
    );
  }

  return (
    <main className="order-detail">
      <Link to="/orders" className="back">
        <ArrowLeft size={16} /> Semua pesanan
      </Link>

      <div className="detail-order-head">
        <div>
          <span className="eyebrow">ORDER</span>
          <h1>#{order.id.slice(0, 8).toUpperCase()}</h1>
          <small>{new Date(order.created_at).toLocaleString("id-ID")}</small>
        </div>

        <div className="order-status-stack">
          <span className={`status ${order.status}`}>{order.status}</span>
          <span className={`payment-status ${order.payment_status}`}>
            Pembayaran: {order.payment_status}
          </span>
        </div>
      </div>

      <div className="order-box">
        {items.map((item) => (
          <div className="order-item" key={item.id}>
            <img
              src={
                item.image_url ||
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80"
              }
              alt=""
            />

            <div>
              <b>{item.product_name}</b>
              <span>
                {item.size || "All"} {item.color ? `• ${item.color}` : ""} × {item.quantity}
              </span>
              <small>{rupiah(item.price)} / item</small>
            </div>

            <strong>{rupiah(item.price * item.quantity)}</strong>
          </div>
        ))}

        <div className="order-total">
          <span>Total</span>
          <b>{rupiah(order.total)}</b>
        </div>
      </div>

      <div className="address-box">
        <b>Dikirim ke</b>
        <p>
          {order.customer_name}
          <br />
          {order.phone}
          <br />
          {order.address}
        </p>

        {order.notes && (
          <>
            <b>Catatan</b>
            <p>{order.notes}</p>
          </>
        )}
      </div>

      <a
        className="button dark"
        href={`https://wa.me/?text=${encodeURIComponent(
          `Halo, saya ingin menanyakan pesanan #${order.id.slice(0, 8).toUpperCase()}`
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={17} /> Hubungi WhatsApp
      </a>
    </main>
  );
}
