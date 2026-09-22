import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Leaf, HandHeart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("HOME PRODUCTS ERROR:", error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <main>
      <section className="hero-batik">
        <div className="hero-copy">
          <span className="eyebrow">WARISAN • TEKSTIL • CERITA</span>
          <h1>
            Batik yang <em>bercerita</em>, dipakai setiap hari.
          </h1>
          <p>
            Eksplorasi motif Nusantara dalam siluet modern. Dibuat untuk kamu
            yang ingin memakai budaya dengan cara yang personal.
          </p>
          <Link className="button dark" to="/products">
            Lihat koleksi <ArrowRight size={18} />
          </Link>
        </div>

        <div className="hero-art" aria-label="Motif batik">
          <div className="batik-circle" />
          <div className="hero-card">
            <span>01</span>
            <b>Motif Parang</b>
            <small>Yogyakarta</small>
          </div>
        </div>
      </section>

      <section className="manifesto">
        <div>
          <Sparkles />
          <h2>
            Motif lama.
            <br />
            Rasa baru.
          </h2>
        </div>
        <p>
          Kami memilih batik bukan sekadar sebagai corak, tetapi sebagai bahasa
          visual. Setiap koleksi membawa karakter daerah, ketelitian pengrajin,
          dan potongan yang relevan untuk kehidupan sekarang.
        </p>
      </section>

      <section className="values">
        <div>
          <Leaf />
          <b>Material terpilih</b>
          <span>Nyaman untuk iklim tropis.</span>
        </div>
        <div>
          <HandHeart />
          <b>Dibuat dengan hati</b>
          <span>Mendukung karya pengrajin lokal.</span>
        </div>
        <div>
          <Sparkles />
          <b>Desain kontemporer</b>
          <span>Warisan tanpa terasa kuno.</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">KOLEKSI TERBARU</span>
            <h2>Produk pilihan</h2>
          </div>
          <Link to="/products">
            Lihat semua <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="screen-loading compact">Memuat koleksi...</div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty">
            Belum ada produk pilihan. Tambahkan produk dari Dashboard Admin.
          </div>
        )}
      </section>
    </main>
  );
}
