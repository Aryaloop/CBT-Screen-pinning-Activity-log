import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// 1. CEK STATUS UJIAN (Auto Resume)
// Route: GET /api/siswa/ujian/status
// ==========================================
router.get('/ujian/status', async (req, res) => {
  const id_siswa = req.user.id;
  try {
    // Cek apakah siswa punya sesi yang statusnya masih 'berjalan'
    const query = `
      SELECT s.id_sesi, s.id_ujian, s.waktu_mulai, p.judul, p.durasi_menit
      FROM sesi_ujian s
      JOIN paket_ujian p ON s.id_ujian = p.id_ujian
      WHERE s.id_siswa = $1 AND s.status = 'berjalan'
    `;
    const result = await pool.query(query, [id_siswa]);

    if (result.rowCount > 0) {
      res.json({ status: 'ada_sesi', sesi: result.rows[0] });
    } else {
      res.json({ status: 'idle', message: 'Tidak ada ujian aktif' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cek status' });
  }
});

// ==========================================
// 2. MULAI UJIAN (Validasi Token)
// Route: POST /api/siswa/ujian/mulai
// ==========================================
router.post('/ujian/mulai', async (req, res) => {
  const { kode_token } = req.body;
  const id_siswa = req.user.id;

  try {
    // A. Cek Paket Ujian berdasarkan Token
    const paketRes = await pool.query(
      'SELECT * FROM paket_ujian WHERE kode_token = $1 AND apakah_aktif = true', 
      [kode_token]
    );

    if (paketRes.rowCount === 0) {
      return res.status(404).json({ message: 'Token salah atau ujian tidak aktif' });
    }
    const paket = paketRes.rows[0];

    // B. Cek apakah sudah pernah mulai (Resume)
    const cekSesi = await pool.query(
      "SELECT * FROM sesi_ujian WHERE id_siswa = $1 AND id_ujian = $2 AND status = 'berjalan'",
      [id_siswa, paket.id_ujian]
    );

    if (cekSesi.rowCount > 0) {
      return res.json({ 
        message: 'Melanjutkan sesi ujian', 
        id_sesi: cekSesi.rows[0].id_sesi,
        id_ujian: paket.id_ujian
      });
    }

    // C. Buat Sesi Baru
    const newSesi = await pool.query(
      `INSERT INTO sesi_ujian (id_ujian, id_siswa, status) 
       VALUES ($1, $2, 'berjalan') RETURNING id_sesi`,
      [paket.id_ujian, id_siswa]
    );

    res.status(201).json({
      message: 'Ujian dimulai',
      id_sesi: newSesi.rows[0].id_sesi,
      id_ujian: paket.id_ujian
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memulai ujian' });
  }
});

// ==========================================
// 3. DOWNLOAD SOAL (Pre-Load)
// Route: GET /api/siswa/ujian/:id/soal
// PENTING: Kunci Jawaban DIHAPUS dari response
// ==========================================
router.get('/ujian/:id/soal', async (req, res) => {
  const { id } = req.params; // ID Ujian
  
  try {
    // Ambil soal tapi HANYA kolom yang aman
    const query = `
      SELECT id_soal, tipe_soal, teks_soal, opsi_jawaban, bobot_nilai 
      FROM butir_soal 
      WHERE id_ujian = $1
    `;
    const result = await pool.query(query, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengunduh soal' });
  }
});

// ==========================================
// 5. LAPOR PELANGGARAN (Log Security)
// Route: POST /api/siswa/ujian/log
// ==========================================
router.post('/ujian/log', async (req, res) => {
  const { id_sesi, jenis_pelanggaran } = req.body;
  const id_siswa = req.user.id;

  try {
    await pool.query(
      `INSERT INTO log_pelanggaran (id_sesi, id_siswa, jenis_pelanggaran)
       VALUES ($1, $2, $3)`,
      [id_sesi, id_siswa, jenis_pelanggaran]
    );
    res.json({ message: 'Log tercatat' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging' });
  }
});

// ==========================================
// 6. SELESAI UJIAN
// Route: POST /api/siswa/ujian/selesai
// ==========================================
router.post('/ujian/selesai', async (req, res) => {
  const { id_sesi } = req.body;
  
  try {
    // Update status sesi jadi selesai
    await pool.query(
      "UPDATE sesi_ujian SET status = 'selesai', waktu_selesai = NOW() WHERE id_sesi = $1",
      [id_sesi]
    );

    // TODO: Hitung Nilai Otomatis di sini (Nanti bisa ditambahkan)
    
    res.json({ message: 'Ujian selesai. Terima kasih.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyelesaikan ujian' });
  }
});

export default router;