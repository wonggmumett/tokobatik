import { useEffect,useMemo,useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

export default function Products(){
 const [products,setProducts]=useState([]),[cats,setCats]=useState([]),[q,setQ]=useState(""),[cat,setCat]=useState("Semua");
 useEffect(()=>{Promise.all([supabase.from("products").select("*").order("created_at",{ascending:false}),supabase.from("categories").select("*").order("name")]).then(([a,b])=>{setProducts(a.data||[]);setCats(b.data||[])})},[]);
 const filtered=useMemo(()=>products.filter(p=>{const text=`${p.name} ${p.description||""} ${p.category||p.categories?.name||""}`.toLowerCase(); return text.includes(q.toLowerCase())&&(cat==="Semua"||(p.category||p.categories?.name)===cat)}),[products,q,cat]);
 const names=cats.map(c=>c.name).filter(Boolean);
 return <main className="shop-page"><div className="shop-hero"><span className="eyebrow">THE COLLECTION</span><h1>Temukan motifmu.</h1><p>Batik tulis, cap, dan kombinasi kontemporer dalam koleksi yang terus bertumbuh.</p></div>
 <div className="shop-toolbar"><div className="search"><Search size={18}/><input placeholder="Cari produk atau motif..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="filters"><SlidersHorizontal size={17}/><button className={cat==="Semua"?"active":""} onClick={()=>setCat("Semua")}>Semua</button>{names.map(x=><button className={cat===x?"active":""} key={x} onClick={()=>setCat(x)}>{x}</button>)}</div></div>
 <div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>{!filtered.length&&<div className="empty">Produk tidak ditemukan.</div>}</main>
}