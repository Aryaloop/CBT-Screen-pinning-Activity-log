import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// 1. TAMBAH GURU (POST) - Sudah Ada Sebelumnya
// ==========================================
router.post('/guru', async (req, res) => {
  const { email, nama_lengkap, nip } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Generate Password Sementara
    const tempPassword = crypto.randomBytes(3).toString('hex'); 
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Insert Pengguna
    const userRes = await client.query(
      `INSERT INTO pengguna (nama_pengguna, email, kata_sandi_hash, peran) 
       VALUES ($1, $2, $3, 'guru') RETURNING id_pengguna`,
      [nip, email, passwordHash]
    );
    const newUserId = userRes.rows[0].id_pengguna;

    // Insert Profil Guru
    await client.query(
      `INSERT INTO guru (id_guru, nip, nama_lengkap) VALUES ($1, $2, $3)`,
      [newUserId, nip, nama_lengkap]
    );

    await client.query('COMMIT');

    // RESPONSE DENGAN PASSWORD SEMENTARA (Agar bisa dicatat admin)
    res.status(201).json({ 
      message: 'Guru berhasil ditambahkan',
      data: { nip, nama_lengkap, email, temp_password: tempPassword } 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ message: 'NIP atau Email sudah terdaftar' });
    res.status(500).json({ message: 'Gagal menambah guru' });
  } finally {
    client.release();
  }
});

// ==========================================
// 2. LIHAT DAFTAR GURU (GET) - BARU
// ==========================================
router.get('/guru', async (req, res) => {
  try {
    const query = `
      SELECT g.id_guru, g.nip, g.nama_lengkap, p.email 
      FROM guru g
      JOIN pengguna p ON g.id_guru = p.id_pengguna
      ORDER BY g.nama_lengkap ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data guru' });
  }
});

// ==========================================
// 3. HAPUS GURU (DELETE) - BARU
// ==========================================
router.delete('/guru/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Hapus di tabel pengguna (Cascade ke tabel guru)
    const result = await pool.query('DELETE FROM pengguna WHERE id_pengguna = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Guru tidak ditemukan' });
    
    res.json({ message: 'Data guru berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus guru' });
  }
});

export default router;