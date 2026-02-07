import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan'; // <--- 1. IMPORT INI

// Import Router Utama per Modul
import authRoutes from './authRoutes/index.js';
import adminMainRoutes from './adminRoutes/index.js';
import guruMainRoutes from './guruRoutes/guruRoutes.js'; // <--- Import modul Guru
import siswaMainRoutes from './siswaRoutes/siswaRoutes.js';
import timeRouter from './utils/timeHelper.js'; 
dotenv.config();
const app = express();

// CORS
app.use(cors({
  // Kita izinkan port 5173 (Vite Default) DAN port 3000 (React Custom)
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  credentials: true, // WAJIB: Agar cookie token bisa lewat
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// ==========================================
// LOGGER (DEBUGGING TOOLS)
// ==========================================

// 1. Morgan: Mencatat Method, URL, Status, & Waktu Response
// Contoh output: POST /api/auth/login 200 15.345 ms - 54
app.use(morgan('dev')); 

// 2. Body Logger: bisa liat data apa yang dikirim Frontend
// Sangat berguna buat ngecek salah ketik field
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`📦 [BODY]:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routing Modular
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminMainRoutes); 
app.use('/api/guru', guruMainRoutes); 
app.use('/api/siswa', siswaMainRoutes);
// Time Sync Service: Agar Frontend menggunakan waktu server, bukan waktu device client
app.use('/api/time', timeRouter); // <--- Route Waktu
app.get('/', (req, res) => res.json({ message: 'API CBT Ready' }));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});