const images = [
  {
    url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
    title: "Motif Nusantara",
  },
  {
    url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=1200&q=85",
    title: "Detail Kain",
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
    title: "Tekstur & Warna",
  },
  {
    url: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85",
    title: "Gaya Kontemporer",
  },
];

export default function Gallery() {
  return (
    <main className="gallery">
      <div className="page-title">
        <span className="eyebrow">VISUAL JOURNAL</span>
        <h1>Potongan cerita.</h1>
        <p>Eksplorasi visual tentang kain, motif, tekstur, dan gaya Nusantara.</p>
      </div>

      <div className="gallery-grid">
        {images.map((image, index) => (
          <figure key={image.url}>
            <img src={image.url} alt={image.title} loading="lazy" />
            <figcaption>
              Frame {String(index + 1).padStart(2, "0")} — {image.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
