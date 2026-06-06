import dotenv from "dotenv"

dotenv.config()

// Wajib ada — tanpa secret yang konsisten, token nggak portable antar restart/
// instance. Fail-fast biar ketauan langsung pas start, bukan diam-diam pakai
// fallback yang bikin token lama invalid.
if (!process.env.JWT_SECRET_KEY) {
    throw new Error(
        "JWT_SECRET_KEY belum di-set di .env. Tambahkan JWT_SECRET_KEY=<string acak panjang> sebelum menjalankan server."
    )
}
export const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY
export const PORT = process.env.PORT

// ─── Monetisasi / pembayaran ──────────────────────────────
// PAYMENTS_ENABLED=false (default) → gate subscription di-bypass, semua user
// diperlakukan sebagai "pro". Bikin temen-temen bisa demo lokal tanpa
// Midtrans/ngrok. Set true kalau mau jalanin flow bayar beneran.
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true"

// Cap generate resep AI per user per hari. Ini COST-CONTROL (biar tagihan
// Gemini gak jebol), bukan paywall — limitnya sama buat semua user.
export const DAILY_GENERATE_LIMIT =
    Number(process.env.DAILY_GENERATE_LIMIT) || 15

// ─── Notifikasi / kadaluarsa ──────────────────────────────
// Default H-berapa hari makanan dianggap "akan expired" (bisa di-override
// per request lewat query ?days=N).
export const EXPIRY_THRESHOLD_DAYS =
    Number(process.env.EXPIRY_THRESHOLD_DAYS) || 3

// ─── AI ───────────────────────────────────────────────────
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"