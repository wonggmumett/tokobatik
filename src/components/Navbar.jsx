import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, UserRound, Menu, X, Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar(){
  const {count}=useCart(); const {user,profile,logout}=useAuth();
  const [open,setOpen]=useState(false); const nav=useNavigate();
  const links=[["Beranda","/"],["Koleksi","/products"],["Cerita Batik","/about"],["Galeri","/gallery"]];
  return <header className="nav-wrap">
    <div className="nav-top">Gratis ongkir untuk pesanan tertentu • Kerajinan Indonesia, dikirim ke seluruh Nusantara</div>
    <nav className="nav">
      <button className="icon-btn mobile" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <Link to="/" className="brand"><span className="brand-mark">NB</span><span>NUSANTARA<br/><b>BATIK</b></span></Link>
      <div className={`nav-links ${open?"show":""}`}>{links.map(([t,p])=><NavLink key={p} to={p} onClick={()=>setOpen(false)}>{t}</NavLink>)}</div>
      <div className="nav-actions">
        <Link to="/products" className="icon-btn"><Search/></Link>
        {user ? <button className="profile-chip" onClick={()=>profile?.role==="admin"?nav("/admin"):logout()}><UserRound/><span>{profile?.role==="admin"?"Admin":"Akun"}</span></button>:<Link to="/login" className="login-link">Masuk</Link>}
        <Link to="/cart" className="cart-btn"><ShoppingBag/><i>{count}</i></Link>
      </div>
    </nav>
  </header>
}