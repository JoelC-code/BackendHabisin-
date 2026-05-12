import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Pastikan kamu bikin folder 'public/uploads' di root backend kamu ya!
    cb(null, 'public/uploads/'); 
  },
  filename: function (req, file, cb) {
    // Bikin nama file unik biar gak bentrok kalau ada gambar yang namanya sama
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });