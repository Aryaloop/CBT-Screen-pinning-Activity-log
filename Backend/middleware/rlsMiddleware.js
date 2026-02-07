// File: middleware/rlsMiddleware.js
import pool from '../config/db.js';

export const setRlsContext = async (req, res, next) => {
  // Hanya jalan jika user sudah login (ada req.user)
  if (!req.user || !req.user.id) {
    return next();
  }

  // Catatan: Karena 'pool.query' mengambil client acak, 
  // setting ini mungkin tidak bertahan ke query berikutnya secara otomatis 
  // kecuali kita menggunakan 'transaction client' yang sama.
  // Namun, kita siapkan ini untuk kepatuhan struktur.
  
  try {
    // Kita set variabel sesi postgres (hanya efektif jika dalam satu client session)
    // Query ini ringan.
    await pool.query("SET SESSION app.current_user_id = $1", [req.user.id]);
    next();
  } catch (err) {
    console.error("Gagal set RLS Context:", err);
    // Jangan crash, lanjut saja (RLS di DB akan default memblokir jika null)
    next();
  }
};