# Nusantara Batik

Versi toko batik dengan frontend baru yang tidak memakai layout visual WS Fashion.

## Stack
- React 19 + Vite
- Supabase Auth + PostgreSQL + Storage
- React Router
- Framer Motion / Lucide tersedia untuk pengembangan lanjutan
- Vercel

## Backend yang dipertahankan
Nama tabel: `categories`, `products`, `profiles`, `orders`, `order_items`.
Storage bucket: `product-images`.
Environment variable: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Jalankan
1. `npm install`
2. Salin `.env.example` menjadi `.env`
3. Isi URL dan publishable key Supabase milikmu.
4. Jalankan `supabase/schema.sql` jika membuat database baru.
5. `npm run dev`

## Catatan
Jangan masukkan `service_role` key ke frontend. Untuk database milikmu yang sudah memiliki tabel produk versi lebih baru, pertahankan tabel tersebut dan sesuaikan mapping kolom produk jika diperlukan.
