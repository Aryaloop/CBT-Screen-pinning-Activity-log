import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// LOGIC: TAMBAH SISWA
// Route: POST /api/admin/siswa
// ==========================================
router.post('/siswa', async (req, res) => {
  const { nama, nis, kelas, password, id_perangkat } = req.body;
  
  // Ambil koneksi client untuk transaction
  const client = await pool.connect(); 

  try {
    await client.query('BEGIN'); // Mulai Transaksi

    // 1. Cek apakah NIS sudah ada (Validasi manual biar error rapi)
    const checkNis = await client.query('SELECT 1 FROM pengguna WHERE nama_pengguna = $1', [nis]);
    if (checkNis.rowCount > 0) {
      throw new Error('NIS_DUPLICATE');
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert ke Tabel PENGGUNA
    const userResult = await client.query(
      `INSERT INTO pengguna (nama_pengguna, kata_sandi_hash, peran) 
       VALUES ($1, $2, 'siswa') 
       RETURNING id_pengguna`,
      [nis, passwordHash]
    );
    const newUserId = userResult.rows[0].id_pengguna;

    // 4. Insert ke Tabel SISWA
    await client.query(
      `INSERT INTO siswa (id_siswa, nis, nama_lengkap, nama_kelas, id_perangkat) 
       VALUES ($1, $2, $3, $4, $5)`,
      [newUserId, nis, nama, kelas, id_perangkat || null]
    );

    await client.query('COMMIT'); // Simpan Permanen

    res.status(201).json({ 
      message: 'Siswa berhasil didaftarkan',
      data: { id: newUserId, nis, nama }
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Batalkan jika error
    console.error("Error Tambah Siswa:", err);
    
    if (err.message === 'NIS_DUPLICATE') {
      return res.status(400).json({ message: 'NIS sudah terdaftar sebagai pengguna lain' });
    }
    res.status(500).json({ message: 'Gagal menambahkan siswa' });
  } finally {
    client.release();
  }
});

// ==========================================
// LOGIC: AMBIL DAFTAR SISWA
// Route: GET /api/admin/siswa
// ==========================================
router.get('/siswa', async (req, res) => {
  try {
    const query = `
      SELECT s.id_siswa, s.nis, s.nama_lengkap, s.nama_kelas, p.nama_pengguna
      FROM siswa s
      JOIN pengguna p ON s.id_siswa = p.id_pengguna
      ORDER BY s.nama_kelas ASC, s.nama_lengkap ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data siswa' });
  }
});

// ==========================================
// LOGIC: HAPUS SISWA
// Route: DELETE /api/admin/siswa/:id
// ==========================================
router.delete('/siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus di tabel pengguna, otomatis cascade ke tabel siswa
    const result = await pool.query('DELETE FROM pengguna WHERE id_pengguna = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    }
    res.json({ message: 'Data siswa berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus siswa' });
  }
});

export default router;