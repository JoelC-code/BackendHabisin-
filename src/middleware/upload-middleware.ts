import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Folder tujuan upload. Dibikin otomatis kalau belum ada biar gak ENOENT
// pas dijalanin di laptop temen yang fresh clone.
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    // Nama file unik biar gak bentrok kalau ada gambar dengan nama sama
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Hanya terima file gambar, maksimal 5MB
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan'));
    }
  },
});
