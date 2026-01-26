import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';

const router = express.Router();

// @desc    Tambah Guru Baru (Oleh Admin)
// @route   POST /api/admin/guru
router.post('/guru', async (req, res) => {
  const { email, nama_lengkap, nip } = req.body;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Generate Password Sementara (Random 6 digit)
    const tempPassword = crypto.randomBytes(3).toString('hex'); // misal: a1b2c3
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // 2. Insert ke PENGGUNA (Pakai Email)
    // Username kita samakan dengan NIP biar rapi
    const userRes = await client.query(
      `INSERT INTO pengguna (nama_pengguna, email, kata_sandi_hash, peran) 
       VALUES ($1, $2, $3, 'guru') RETURNING id_pengguna`,
      [nip, email, passwordHash]
    );
    const newUserId = userRes.rows[0].id_pengguna;

    // 3. Insert ke Profil GURU
    await client.query(
      `INSERT INTO guru (id_guru, nip, nama_lengkap) VALUES ($1, $2, $3)`,
      [newUserId, nip, nama_lengkap]
    );

    await client.query('COMMIT');

    // 4. Simulasi Kirim Email Password
    console.log(`[EMAIL SEND] To: ${email} | Password: ${tempPassword}`);

    res.status(201).json({ 
      message: 'Akun Guru berhasil dibuat',
      temp_password: tempPassword 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    // Handle error duplicate email
    if (err.constraint === 'pengguna_email_key') {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat guru' });
  } finally {
    client.release();
  }
});

export default router;