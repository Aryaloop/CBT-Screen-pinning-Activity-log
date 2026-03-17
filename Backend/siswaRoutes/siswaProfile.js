import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// ==========================================
// 1. GET RIWAYAT UJIAN
// Route: GET /api/siswa/riwayat
// ==========================================
router.get('/riwayat', async (req, res) => {
  const id_siswa = req.user.id;
  try {
    const query = `
      SELECT p.judul, s.waktu_mulai, s.waktu_selesai, s.nilai_akhir, s.status
      FROM sesi_ujian s
      JOIN paket_ujian p ON s.id_ujian = p.id_ujian
      WHERE s.id_siswa = $1
      ORDER BY s.waktu_mulai DESC
    `;
    const { rows } = await pool.query(query, [id_siswa]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil riwayat' });
  }
});

// ==========================================
// 2. GANTI KATA SANDI
// Route: PUT /api/siswa/password
// ==========================================
router.put('/password', async (req, res) => {
  const id_pengguna = req.user.id;
  const { password_lama, password_baru } = req.body;

  try {
    // 1. Ambil password lama (hash) dari database
    const userRes = await pool.query('SELECT kata_sandi_hash FROM pengguna WHERE id_pengguna = $1', [id_pengguna]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    // 2. Cocokkan password lama
    const isValid = await bcrypt.compare(password_lama, userRes.rows[0].kata_sandi_hash);
    if (!isValid) return res.status(400).json({ message: 'Kata sandi lama Anda salah!' });

    // 3. Hash password baru & Update
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password_baru, salt);

    await pool.query('UPDATE pengguna SET kata_sandi_hash = $1 WHERE id_pengguna = $2', [newHash, id_pengguna]);
    
    res.json({ message: 'Kata sandi berhasil diubah' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah kata sandi' });
  }
});

export default router;