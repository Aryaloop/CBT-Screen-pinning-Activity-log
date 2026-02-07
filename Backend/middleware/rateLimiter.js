import rateLimit from 'express-rate-limit';

export const forgotPassLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 Menit
  max: 1, // Limit setiap IP cuma boleh 1 request per windowMs
  message: {
    message: 'Terlalu banyak permintaan. Silakan tunggu 3 menit sebelum mencoba lagi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});