import { Mail, MessageCircle, MapPin, ArrowUpRight } from "lucide-react";

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const whatsappUrl = whatsappNumber
  ? `https://wa.me/${whatsappNumber}`
  : "https://wa.me/";

export default function Contact() {
  return (
    <main className="contact">
      <div className="page-title">
        <span className="eyebrow">SAY HELLO</span>
        <h1>Mari berbincang.</h1>
        <p>
          Ada pertanyaan tentang ukuran, motif, atau pesanan? Kami siap membantu.
        </p>
      </div>

      <div className="contact-grid">
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle />
          <b>WhatsApp</b>
          <span>{whatsappNumber ? "Chat dengan tim kami" : "Tambahkan nomor WhatsApp di .env"}</span>
          <ArrowUpRight size={15} />
        </a>

        <a href="mailto:hello@nusantarabatik.id">
          <Mail />
          <b>Email</b>
          <span>hello@nusantarabatik.id</span>
          <ArrowUpRight size={15} />
        </a>

        <div>
          <MapPin />
          <b>Workshop</b>
          <span>Indonesia</span>
        </div>
      </div>
    </main>
  );
}
