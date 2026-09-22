import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
export default function Orders(){
 const [orders,setOrders]=useState([]);
 useEffect(()=>{supabase.from("orders").select("*").order("created_at",{ascending:false}).then(({data})=>setOrders(data||[]))},[]);
 return <main className="orders"><div className="page-title"><span className="eyebrow">ORDER HISTORY</span><h1>Pesanan saya</h1></div>{!orders.length?<div className="empty">Belum ada pesanan.</div>:<div className="order-list">{orders.map(o=><Link className="order-row" to={`/orders/${o.id}`} key={o.id}><div><small>{new Date(o.created_at).toLocaleDateString("id-ID")}</small><h3>{o.customer_name}</h3></div><div><span className={`status ${o.status}`}>{o.status}</span><b>{rupiah(o.total)}</b></div></Link>)}</div>}</main>
}