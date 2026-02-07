import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import generateToken from '../utils/jwtHelper.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendEmail } from '../utils/emailService.js';
import { forgotPassLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ==========================================
// 0. SETUP KUNCI RSA (Enkripsi)
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan folder 'keys' dan file 'private.pem' / 'public.pem' sudah digenerate sebelumnya
const privateKeyPath = path.join(__dirname, '../keys/private.pem');
const publicKeyPath = path.join(__dirname, '../keys/public.pem');

// Baca kunci jika file ada
let privateKey, publicKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  publicKey = fs.readFileSync(publicKeyPath, 'utf8');
} catch (err) {
  console.error("⚠️  PERINGATAN: Kunci RSA tidak ditemukan. Jalankan 'node utils/generateKeys.js' dulu.");
}

// Fungsi Bantuan: Dekripsi Data (Password)
const decryptData = (encryptedData) => {
  try {
    if (!privateKey) throw new Error("Private Key missing");
    
    // PERBAIKAN DISINI:
    // Ganti OAEP menjadi PKCS1_PADDING agar cocok dengan JSEncrypt Frontend
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING, 
        // Hapus baris oaepHash karena tidak dipakai di PKCS1
      },
      Buffer.from(encryptedData, 'base64')
    );
    return decrypted.toString('utf8');
  } catch (error) {
    console.error("Gagal dekripsi:", error.message);
    return null; 
  }
};

// ==========================================
// ENDPOINT: GET PUBLIC KEY
// URL: GET /api/auth/public-key
// ==========================================
router.get('/public-key', (req, res) => {
  if (!publicKey) {
    return res.status(500).json({ message: 'Kunci keamanan server belum siap.' });
  }
  res.json({ publicKey });
});

// ==========================================
// 1. LOGIN KHUSUS WEB (Admin & Guru)
// URL: POST /api/auth/login/web
// ==========================================
router.post('/login/web', async (req, res) => {
  const { email, kata_sandi } = req.body; // kata_sandi disini TERENKRIPSI (RSA)

  try {
    // A. Dekripsi Password
    const passwordAsli = decryptData(kata_sandi);
    if (!passwordAsli) {
      return res.status(400).json({ message: 'Gagal mendekripsi password (Security Error)' });
    }

    if (!email || !passwordAsli) {
      return res.status(400).json({ message: 'Email dan Password wajib diisi' });
    }

    // B. Cari User di DB
    const userQuery = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const user = userQuery.rows[0];

    // C. Validasi User & Role
    if (!user || user.peran === 'siswa') {
      return res.status(401).json({ message: 'Email tidak ditemukan atau Anda bukan Admin/Guru' });
    }

    // D. Bandingkan Password Asli vs Hash DB
    if (await bcrypt.compare(passwordAsli, user.kata_sandi_hash)) {
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
  const { nis, kata_sandi } = req.body; // kata_sandi disini TERENKRIPSI (RSA)

  try {
    // A. Dekripsi Password
    const passwordAsli = decryptData(kata_sandi);
    if (!passwordAsli) {
      return res.status(400).json({ message: 'Gagal mendekripsi password (Security Error)' });
    }

    if (!nis || !passwordAsli) {
      return res.status(400).json({ message: 'NIS dan Password wajib diisi' });
    }

    // B. Cari User
    const userQuery = await pool.query(
      "SELECT * FROM pengguna WHERE nama_pengguna = $1 AND peran = 'siswa'", 
      [nis]
    );
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'NIS tidak ditemukan' });
    }

    // C. Bandingkan Password
    if (await bcrypt.compare(passwordAsli, user.kata_sandi_hash)) {
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
// 5. FORGOT PASSWORD (DENGAN RATE LIMITER)
// URL: POST /api/auth/forgot-password
// ==========================================
// Perhatikan: forgotPassLimiter diselipkan di parameter kedua
router.post('/forgot-password', forgotPassLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Email tidak terdaftar' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    await pool.query(
      'UPDATE pengguna SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry, email]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <h3>Permintaan Reset Password</h3>
      <p>Klik tombol di bawah untuk mereset password akun Anda:</p>
      <a href="${resetUrl}" style="background:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>Atau buka link ini: ${resetUrl}</p>
      <p>Link kadaluwarsa dalam 1 jam.</p>
    `;

    await sendEmail(user.email, 'Reset Password - Ujian Sekolah', message);

    res.json({ message: 'Link reset password telah dikirim ke email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memproses permintaan' });
  }
});

// ==========================================
// 6. RESET PASSWORD (DENGAN RSA)
// URL: POST /api/auth/reset-password/:token
// ==========================================
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password_baru } = req.body; // Ini diharapkan TERENKRIPSI dari Frontend

  try {
    // 1. DEKRIPSI PASSWORD BARU DULU (Tambahan Security)
    const passwordAsli = decryptData(password_baru);
    
    if (!passwordAsli) {
      return res.status(400).json({ message: 'Gagal mendekripsi password (Security Error)' });
    }

    // 2. Cari user dengan token valid
    const userQuery = await pool.query(
      `SELECT * FROM pengguna WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluwarsa' });
    }

    // 3. Hash Password yang sudah didekripsi
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(passwordAsli, salt); // Hash passwordAsli, bukan password_baru (enkripsi)

    // 4. Update Database
    await pool.query(
      `UPDATE pengguna SET kata_sandi_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id_pengguna = $2`,
      [newHash, user.id_pengguna]
    );

    res.json({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (err) {
    console.error("Reset Pass Error:", err); // Log error biar tau kenapa
    res.status(500).json({ message: 'Gagal mereset password' });
  }
});

export default router;