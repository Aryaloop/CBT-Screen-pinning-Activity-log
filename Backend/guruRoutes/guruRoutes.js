import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import guruUjianRoutes from './guruUjian.js';
import guruRekapRoutes from './guruRekap.js'; // IMPORT BARU
const router = express.Router();

// Middleware Khusus GURU
const verifyGuru = (req, res, next) => {
  // Cek apakah role di token adalah 'guru' atau 'admin' (Admin biasanya boleh segalanya)
  if (req.user && (req.user.role === 'guru' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Akses Ditolak: Khusus Guru' });
  }
};

// Pasang Satpam
router.use(protect);    // Wajib Login
router.use(verifyGuru); // Wajib Role Guru

// Pasang Route Pecahan
router.use('/', guruUjianRoutes);
router.use('/', guruRekapRoutes);


export default router;