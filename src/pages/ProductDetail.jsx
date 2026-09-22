import { useEffect,useState } from "react";
import { useParams,Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

export default function ProductDetail(){
 const {id}=useParams(),{addItem}=useCart(); const [p,setP]=useState(null),[size,setSize]=useState(""),[qty,setQty]=useState(1);
 useEffect(()=>{supabase.from("products").select("*").eq("id",id).single().then(({data})=>{setP(data);if(data?.sizes?.[0])setSize(data.sizes[0])})},[id]);
 if(!p)return <div className="screen-loading">Memuat produk...</div>;
 const image=p.image||p.image_url||"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80";
 const sizes=Array.isArray(p.sizes)?p.sizes:[];
 return <main className="detail"><Link to="/products" className="back"><ArrowLeft size={16}/> Kembali ke koleksi</Link><div className="detail-grid"><div className="detail-image"><img src={image} alt={p.name}/></div><div className="detail-copy"><span className="eyebrow">{p.category||"BATIK"}</span><h1>{p.name}</h1><div className="price">{rupiah(p.price)}</div><p>{p.description||"Koleksi batik pilihan Nusantara dengan sentuhan modern."}</p>{sizes.length>0&&<div className="option"><label>Ukuran</label><div>{sizes.map(s=><button className={size===s?"selected":""} key={s} onClick={()=>setSize(s)}>{s}</button>)}</div></div>}<div className="quantity"><label>Jumlah</label><div><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={15}/></button><b>{qty}</b><button onClick={()=>setQty(qty+1)}><Plus size={15}/></button></div></div><button className="button dark wide" onClick={()=>addItem(p,size||"All",qty)}><ShoppingBag size={18}/> Tambahkan ke keranjang</button></div></div></main>
}