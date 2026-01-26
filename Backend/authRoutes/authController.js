import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';
import generateToken from '../utils/jwtHelper.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendEmail } from '../utils/emailService.js';
const router = express.Router();

// ==========================================
// 1. LOGIN KHUSUS WEB (Admin & Guru)
// URL: POST /api/auth/login/web
// ==========================================
router.post('/login/web', async (req, res) => {
  const { email, kata_sandi } = req.body;

  try {
    if (!email || !kata_sandi) {
      return res.status(400).json({ message: 'Email dan Password wajib diisi' });
    }

    const userQuery = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const user = userQuery.rows[0];

    if (!user || user.peran === 'siswa') {
      return res.status(401).json({ message: 'Email tidak ditemukan atau Anda bukan Admin/Guru' });
    }

    if (await bcrypt.compare(kata_sandi, user.kata_sandi_hash)) {
      generateToken(res, user.id_pengguna, user.peran);
      res.json({
        id: user.id_pengguna,
        nama: user.nama_pengguna,
        email: user.email,
        peran: user.peran,
        message: 'Login Web Berhasil'
      });
    } else {
      res.status(401).json({ message: 'Password salah' });
    }
  } catch (err) {
    console.error("Login Web Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
// 2. LOGIN KHUSUS MOBILE (Siswa)
// URL: POST /api/auth/login/mobile
// ==========================================
router.post('/login/mobile', async (req, res) => {
  const { nis, kata_sandi } = req.body;

  try {
    if (!nis || !kata_sandi) {
      return res.status(400).json({ message: 'NIS dan Password wajib diisi' });
    }

    const userQuery = await pool.query(
      "SELECT * FROM pengguna WHERE nama_pengguna = $1 AND peran = 'siswa'", 
      [nis]
    );
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'NIS tidak ditemukan' });
    }

    if (await bcrypt.compare(kata_sandi, user.kata_sandi_hash)) {
      generateToken(res, user.id_pengguna, user.peran);
      res.json({
        id: user.id_pengguna,
        nama: user.nama_pengguna,
        peran: user.peran,
        message: 'Login Siswa Berhasil'
      });
    } else {
      res.status(401).json({ message: 'Password salah' });
    }
  } catch (err) {
    console.error("Login Mobile Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
// 3. LOGOUT
// URL: POST /api/auth/logout
// ==========================================
router.post('/logout', (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Berhasil Logout' });
});

// ==========================================
// 4. CHECK SESSION (ME) - PRIVATE
// URL: GET /api/auth/me
// Perhatikan: Middleware 'protect' dipasang langsung di sini
// ==========================================
router.get('/me', protect, async (req, res) => {
  try {
    const userQuery = await pool.query(
      'SELECT id_pengguna, nama_pengguna, email, peran FROM pengguna WHERE id_pengguna = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.json(userQuery.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data user' });
  }
});

// ==========================================
// 5. FORGOT PASSWORD
// URL: POST /api/auth/forgot-password
// ==========================================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Email tidak terdaftar' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 Jam

    await pool.query(
      'UPDATE pengguna SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry, email]
    );

    // Link yang mengarah ke Frontend React
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // HTML Email Template
    const message = `
      <h3>Permintaan Reset Password</h3>
      <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
      <p>Silakan klik tombol di bawah ini:</p>
      <a href="${resetUrl}" style="background:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>Atau copy link ini: ${resetUrl}</p>
      <p>Link ini akan kadaluwarsa dalam 1 jam.</p>
    `;

    // KIRIM EMAIL ASLI
    await sendEmail(user.email, 'Reset Password - Ujian Sekolah', message);

    res.json({ message: 'Link reset password telah dikirim ke email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memproses permintaan' });
  }
});

// ==========================================
// 6. RESET PASSWORD
// URL: POST /api/auth/reset-password/:token
// ==========================================
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password_baru } = req.body;

  try {
    const userQuery = await pool.query(
      `SELECT * FROM pengguna WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid/expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password_baru, salt);

    await pool.query(
      `UPDATE pengguna SET kata_sandi_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id_pengguna = $2`,
      [newHash, user.id_pengguna]
    );

    res.json({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mereset password' });
  }
});

export default router;