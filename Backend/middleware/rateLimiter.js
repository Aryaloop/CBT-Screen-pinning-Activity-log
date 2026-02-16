import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 Menit
  max: 10, // Maksimal 10 request per IP
  message: {
    message: 'Terlalu banyak percobaan login gagal. Silakan tunggu 2 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});