import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [productResult, categoryResult] = await Promise.all([
        supabase
          .from("products")
          .select("*, categories(id,name,slug)")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (productResult.error) console.error("PRODUCTS ERROR:", productResult.error);
      if (categoryResult.error) console.error("CATEGORIES ERROR:", categoryResult.error);

      setProducts(productResult.data || []);
      setCategories(categoryResult.data || []);
      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return products.filter((product) => {
      const category = product.categories?.name || "";
      const text = `${product.name} ${product.description || ""} ${category}`.toLowerCase();

      return (
        (!keyword || text.includes(keyword)) &&
        (categoryId === "all" || product.category_id === categoryId)
      );
    });
  }, [products, q, categoryId]);

  return (
    <main className="shop-page">
      <div className="shop-hero">
        <span className="eyebrow">THE COLLECTION</span>
        <h1>Temukan motifmu.</h1>
        <p>
          Batik tulis, cap, dan kombinasi kontemporer dalam koleksi yang terus
          bertumbuh.
        </p>
      </div>

      <div className="shop-toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Cari produk"
            placeholder="Cari produk atau motif..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>

        <div className="filters">
          <SlidersHorizontal size={17} />
          <button
            type="button"
            className={categoryId === "all" ? "active" : ""}
            onClick={() => setCategoryId("all")}
          >
            Semua
          </button>

          {categories.map((category) => (
            <button
              type="button"
              className={categoryId === category.id ? "active" : ""}
              key={category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="screen-loading compact">Memuat produk...</div>
      ) : filtered.length ? (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty">Produk tidak ditemukan.</div>
      )}
    </main>
  );
}
