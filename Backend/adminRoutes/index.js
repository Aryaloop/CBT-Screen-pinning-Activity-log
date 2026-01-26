import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import adminSiswaRoutes from './adminSiswa.js';
import adminGuruRoutes from './adminGuru.js'; // Nanti jika sudah dibuat

const router = express.Router();

  // Middleware Khusus Admin (Bisa dipasang disini agar semua sub-route kena)
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Akses Ditolak: Khusus Admin' });
  }
};

  // Pasang Satpam (Middleware)
router.use(protect);     // Harus Login
router.use(verifyAdmin); // Harus Role Admin

  // Pasang Route Pecahan
  // Perhatikan: di adminSiswa.js kita definisikan '/siswa', jadi disini cukup use()
router.use(adminSiswaRoutes); 
router.use(adminGuruRoutes); // <-- Pasang modul baru

export default router;