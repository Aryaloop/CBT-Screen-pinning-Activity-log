// File: guruRoutes/guruRekap.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// MONITORING / REKAP NILAI
// Route: GET /api/guru/rekap/:id
// ==========================================
router.get('/rekap/:id', async (req, res) => {
  const { id } = req.params; // ID Ujian
  try {
    const query = `
      SELECT 
        s.nama_lengkap, 
        s.nis,
        s.nama_kelas, 
        sesi.waktu_mulai, 
        sesi.waktu_selesai, 
        sesi.nilai_akhir,
        sesi.status
      FROM sesi_ujian sesi
      JOIN siswa s ON sesi.id_siswa = s.id_siswa
      WHERE sesi.id_ujian = $1
      ORDER BY sesi.nilai_akhir DESC
    `;
    const result = await pool.query(query, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil rekap nilai' });
  }
});

export default router;