import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { setRlsContext } from '../middleware/rlsMiddleware.js'; // Pasang Middleware RLS disini
import siswaUjianRoutes from './siswaUjian.js';
import siswaSyncRoutes from './siswaSync.js';
const router = express.Router();

// Middleware Khusus Siswa
const verifySiswa = (req, res, next) => {
  if (req.user && req.user.role === 'siswa') {
    next();
  } else {
    res.status(403).json({ message: 'Akses Ditolak: Khusus Siswa' });
  }
};

router.use(protect);     // Wajib Login
router.use(verifySiswa); // Wajib Role Siswa
router.use(setRlsContext); // Aktifkan RLS Context tiap request siswa
// Route pecahan
router.use('/', siswaUjianRoutes);
router.use('/', siswaSyncRoutes);

export default router;