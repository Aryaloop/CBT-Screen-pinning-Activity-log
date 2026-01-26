import express from 'express';
// Kita import router yang sudah berisi logic dari file authController
import authRoutes from './authController.js'; 

const router = express.Router();

// Pasang Route Auth
// Karena di dalam authController sudah didefinisikan path lengkapnya (misal: '/login/web'),
// maka di sini kita cukup pakai '/' agar tidak double slash.
router.use('/', authRoutes);

export default router;