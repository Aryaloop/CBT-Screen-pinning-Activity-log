// File: adminRoutes/adminKelas.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// AMBIL DAFTAR KELAS (Distinct)
// Route: GET /api/admin/kelas
// ==========================================
router.get('/kelas', async (req, res) => {
  try {
    // Mengambil nama kelas yang unik dari data siswa yang sudah ada
    const query = `
      SELECT DISTINCT nama_kelas 
      FROM siswa 
      ORDER BY nama_kelas ASC
    `;
    const result = await pool.query(query);
    
    // Format response agar mudah dipakai dropdown
    const kelasList = result.rows.map(row => row.nama_kelas);
    
    res.json(kelasList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data kelas' });
  }
});

export default router;