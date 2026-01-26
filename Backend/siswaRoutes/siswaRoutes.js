import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import siswaUjianRoutes from './siswaUjian.js';

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

// Route pecahan
router.use('/', siswaUjianRoutes);

export default router;