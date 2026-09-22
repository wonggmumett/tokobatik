import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

export default function ProductCard({product}){
 const {addItem}=useCart();
 const image=product.image||product.image_url||"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80";
 const sizes=Array.isArray(product.sizes)?product.sizes:[];
 return <article className="product-card">
   <Link to={`/products/${product.id}`} className="product-image"><img src={image} alt={product.name}/>{(product.featured||product.is_featured)&&<span className="badge">Pilihan</span>}</Link>
   <div className="product-info">
    <div className="product-cat">{product.category||product.categories?.name||"Batik"}</div>
    <Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link>
    <div className="product-bottom"><strong>{rupiah(product.price)}</strong><button onClick={()=>addItem(product,sizes[0]||"All")} aria-label="Tambah ke keranjang"><ShoppingBag size={17}/></button></div>
   </div>
 </article>
}