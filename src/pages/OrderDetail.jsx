import { useEffect,useState } from "react";
import { Link,useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
export default function OrderDetail(){
 const {id}=useParams();const [order,setOrder]=useState(null),[items,setItems]=useState([]);
 useEffect(()=>{Promise.all([supabase.from("orders").select("*").eq("id",id).single(),supabase.from("order_items").select("*").eq("order_id",id)]).then(([a,b])=>{setOrder(a.data);setItems(b.data||[])})},[id]);
 if(!order)return <div className="screen-loading">Memuat pesanan...</div>;
 return <main className="order-detail"><Link to="/orders">← Semua pesanan</Link><div className="detail-order-head"><div><span className="eyebrow">ORDER</span><h1>#{order.id.slice(0,8).toUpperCase()}</h1></div><span className={`status ${order.status}`}>{order.status}</span></div><div className="order-box">{items.map(x=><div className="order-item" key={x.id}><img src={x.image} alt=""/><div><b>{x.product_name}</b><span>{x.size} × {x.quantity}</span></div><strong>{rupiah(x.price*x.quantity)}</strong></div>)}<div className="order-total"><span>Total</span><b>{rupiah(order.total)}</b></div></div><div className="address-box"><b>Dikirim ke</b><p>{order.customer_name}<br/>{order.phone}<br/>{order.address}</p></div></main>
}