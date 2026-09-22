import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user?.id) return;

      const { data, error: queryError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) setError(queryError.message);
      setOrders(data || []);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  return (
    <main className="orders">
      <div className="page-title">
        <span className="eyebrow">ORDER HISTORY</span>
        <h1>Pesanan saya</h1>
        <p>Riwayat pesanan yang dibuat dari akun ini.</p>
      </div>

      {loading ? (
        <div className="screen-loading compact">Memuat pesanan...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !orders.length ? (
        <div className="empty">
          <Package size={28} />
          <h3>Belum ada pesanan.</h3>
          <p>Pesanan yang kamu buat akan muncul di sini.</p>
          <Link className="button dark" to="/products">Mulai belanja</Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link
              className="order-row"
              to={`/orders/${order.id}`}
              key={order.id}
            >
              <div>
                <small>{new Date(order.created_at).toLocaleString("id-ID")}</small>
                <h3>{order.customer_name}</h3>
                <span>#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div>
                <span className={`status ${order.status}`}>{order.status}</span>
                <b>{rupiah(order.total)}</b>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
