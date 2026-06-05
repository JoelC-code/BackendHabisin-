# Habisin — Backend

API untuk aplikasi **Habisin!** (pelacak isi kulkas): catat bahan makanan,
ingatkan sebelum kadaluarsa, dan kasih rekomendasi resep dari bahan yang ada.

Stack: **Node + Express 5 + TypeScript + Prisma (PostgreSQL) + Gemini (AI resep) + Midtrans (opsional)**.

---

## Setup cepat (untuk demo lokal)

> Untuk demo, **tidak perlu** Midtrans/ngrok. Premium otomatis terbuka karena
> `PAYMENTS_ENABLED=false`.

1. **Clone & install**
   ```bash
   npm install
   ```

2. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   ```
   Lalu isi minimal 3 hal di `.env`:
   - `DATABASE_URL` — Supabase (disarankan, tinggal pakai string bersama) atau Postgres lokal.
   - `JWT_SECRET_KEY` — string acak panjang.
   - `GEMINI_API_KEY` — gratis dari https://aistudio.google.com/app/apikey

3. **Siapkan database** (jalankan migrasi + isi data contoh)
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npx prisma db seed
   ```
   Seed membuat akun uji: **chef@gmail.com / password123**, beberapa bahan di
   kulkas, dan 16 resep katalog Indonesia.

4. **Jalankan**
   ```bash
   npm run dev
   ```
   Server di `http://localhost:3000`. Cek `GET /health`.

### Catatan untuk tim (run di banyak laptop)

- Pakai **satu `DATABASE_URL` Supabase yang sama** → semua orang berbagi DB,
  tidak perlu install Postgres. Masing-masing cukup `npm run dev` di laptopnya.
- Emulator Android mengakses backend laptop yang sama lewat `http://10.0.2.2:3000`.
- Mau coba flow bayar sungguhan? Set `PAYMENTS_ENABLED=true`, isi key Midtrans,
  dan jalankan ngrok untuk webhook (`/api/payment/notification`). Ini hanya
  perlu di satu laptop yang sudah setup Midtrans.

---

## Ringkasan endpoint

Semua butuh header `Authorization: Bearer <token>` kecuali auth & webhook.

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Daftar, balikin token |
| POST | `/api/auth/login` | Login, balikin token |
| GET | `/api/foods/all` | Daftar bahan di kulkas |
| GET | `/api/foods/:id` | Detail bahan |
| POST | `/api/foods/create` | Tambah bahan (JSON atau multipart `image` untuk foto) |
| DELETE | `/api/foods/remove/:id` | Hapus bahan |
| GET | `/api/categories` | Daftar kategori bahan (PRODUCE, DAIRY, MEAT, OTHER) |
| GET | `/api/dashboard` | Ringkasan home (total + yang akan expired) |
| GET | `/api/notifications?days=N` | Feed reminder: bahan expired & akan expired (N opsional) |
| POST | `/api/resep/generate` | Generate resep AI dari isi kulkas (preview). Body: `{ saveToHistory?, category? }` |
| POST | `/api/resep` | Simpan resep (hasil generate / manual) |
| GET | `/api/resep/all` | Daftar resep tersimpan milik user |
| GET | `/api/resep/:id` | Detail resep milik user |
| DELETE | `/api/resep/remove/:id` | Hapus resep |
| GET | `/api/catalog?page=&limit=&category=&search=` | Browse katalog resep (paginated) |
| GET | `/api/catalog/categories` | Daftar kategori katalog |
| GET | `/api/catalog/:id` | Detail resep katalog (premium terkunci untuk free) |
| POST | `/api/payment/subscribe` | Mulai langganan (butuh `PAYMENTS_ENABLED=true`) |
| GET | `/api/payment/status` | Status langganan user |
| POST | `/api/payment/notification` | Webhook Midtrans (tanpa auth) |

### Monetisasi (MVP)

- **Gratis:** tracking kulkas, notifikasi, generate AI (dibatasi `DAILY_GENERATE_LIMIT`/hari), katalog non-premium.
- **PRO:** buka semua resep katalog "exclusive". Tanpa iklan.
- Saat `PAYMENTS_ENABLED=false`, semua user diperlakukan PRO (untuk demo).
