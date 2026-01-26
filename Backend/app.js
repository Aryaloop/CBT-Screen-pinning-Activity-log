import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import Router Utama per Modul
import authRoutes from './authRoutes/index.js'; // Asumsi kamu pindahkan auth ke folder sendiri juga
import adminMainRoutes from './adminRoutes/index.js';
import guruMainRoutes from './guruRoutes/guruRoutes.js'; // <--- Import modul Guru
import siswaMainRoutes from './siswaRoutes/siswaRoutes.js';
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Routing Modular
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminMainRoutes); 
app.use('/api/guru', guruMainRoutes); // Nanti
app.use('/api/siswa', siswaMainRoutes);
app.get('/', (req, res) => res.json({ message: 'API CBT Ready' }));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});