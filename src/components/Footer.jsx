import { Link } from "react-router-dom";
export default function Footer(){
 return <footer className="footer">
  <div className="footer-main">
   <div><div className="footer-brand">NUSANTARA BATIK</div><p>Mempertemukan motif warisan Indonesia dengan gaya hidup masa kini.</p></div>
   <div><h4>Jelajah</h4><Link to="/products">Koleksi</Link><Link to="/about">Cerita Batik</Link><Link to="/gallery">Galeri</Link></div>
   <div><h4>Bantuan</h4><Link to="/contact">Kontak</Link><Link to="/orders">Pesanan</Link><Link to="/cart">Keranjang</Link></div>
   <div><h4>Ikuti kami</h4><p>Instagram • TikTok • WhatsApp</p></div>
  </div>
  <div className="footer-bottom">© {new Date().getFullYear()} Nusantara Batik. Dibuat untuk merayakan karya Indonesia.</div>
 </footer>
}