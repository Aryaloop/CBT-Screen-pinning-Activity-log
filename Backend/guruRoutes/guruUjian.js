import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

// Fungsi bantuan generate Token Ujian (6 karakter Uppercase)
const generateExamToken = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); 
};

// ==========================================
// 1. BUAT PAKET UJIAN BARU (HEADER)
// Route: POST /api/guru/ujian
// ==========================================
router.post('/ujian', async (req, res) => {
  const { judul, durasi_menit } = req.body;
  const id_guru = req.user.id; 

  try {
    let kode_token = generateExamToken();
    let isUnique = false;

    while (!isUnique) {
      const check = await pool.query('SELECT 1 FROM paket_ujian WHERE kode_token = $1', [kode_token]);
      if (check.rowCount === 0) isUnique = true;
      else kode_token = generateExamToken();
    }

    const result = await pool.query(
      `INSERT INTO paket_ujian (dibuat_oleh, judul, kode_token, durasi_menit, apakah_aktif) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING *`,
      [id_guru, judul, kode_token, durasi_menit]
    );

    res.status(201).json({ message: 'Paket ujian berhasil dibuat', data: result.rows[0] });
  } catch (err) {
    console.error("Buat Ujian Error:", err);
    res.status(500).json({ message: 'Gagal membuat paket ujian' });
  }
});

// ==========================================
// 2. LIHAT SEMUA UJIAN (List Dashboard)
// Route: GET /api/guru/ujian
// ==========================================
router.get('/ujian', async (req, res) => {
  const id_guru = req.user.id;
  try {
    const query = `
      SELECT id_ujian, judul, kode_token, durasi_menit, apakah_aktif, dibuat_pada 
      FROM paket_ujian 
      WHERE dibuat_oleh = $1 
      ORDER BY dibuat_pada DESC
    `;
    const result = await pool.query(query, [id_guru]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat daftar ujian' });
  }
});

// ==========================================
// 3. GET DETAIL UJIAN & SOALNYA
// Route: GET /api/guru/ujian/:id
// ==========================================
router.get('/ujian/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ujianRes = await pool.query('SELECT * FROM paket_ujian WHERE id_ujian = $1', [id]);
    if (ujianRes.rowCount === 0) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

    const soalRes = await pool.query('SELECT * FROM butir_soal WHERE id_ujian = $1 ORDER BY id_soal ASC', [id]);

    // Format ulang data untuk frontend
    const formattedSoal = soalRes.rows.map(soal => ({
      ...soal,
      // Jika tipe essay, opsi mungkin null/kosong
      opsi_a: soal.opsi_jawaban?.A || '',
      opsi_b: soal.opsi_jawaban?.B || '',
      opsi_c: soal.opsi_jawaban?.C || '',
      opsi_d: soal.opsi_jawaban?.D || '',
      opsi_e: soal.opsi_jawaban?.E || '',
      pertanyaan: soal.teks_soal, 
      jawaban_benar: soal.kunci_jawaban,
      bobot_nilai: soal.bobot_nilai // Pastikan bobot terkirim
    }));

    res.json({
      ujian: ujianRes.rows[0],
      soal: formattedSoal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data ujian' });
  }
});

// ==========================================
// 4. TAMBAH BUTIR SOAL BARU (Support Bobot & Tipe)
// Route: POST /api/guru/ujian/soal
// ==========================================
router.post('/ujian/soal', async (req, res) => {
  const { 
    id_ujian, 
    tipe_soal, // 'pilihan_ganda' atau 'essay'
    pertanyaan, 
    opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, 
    jawaban_benar,
    bobot_nilai // TAMBAHAN: Input Bobot Nilai
  } = req.body;

  try {
    if (!id_ujian || !pertanyaan) {
      return res.status(400).json({ message: 'Data soal tidak lengkap' });
    }

    // Default tipe soal jika tidak dikirim
    const jenis = tipe_soal || 'pilihan_ganda';
    
    // Default bobot jika tidak dikirim
    const bobot = bobot_nilai || 1; 

    // Jika Essay, opsi boleh kosong (null) atau {}
    let opsiJson = {};
    if (jenis === 'pilihan_ganda') {
        opsiJson = { A: opsi_a, B: opsi_b, C: opsi_c, D: opsi_d, E: opsi_e };
    }

    const query = `
      INSERT INTO butir_soal 
      (id_ujian, tipe_soal, teks_soal, opsi_jawaban, kunci_jawaban, bobot_nilai)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      id_ujian, 
      jenis, 
      pertanyaan, 
      opsiJson,   
      jawaban_benar, // Untuk Essay, ini bisa jadi "Kunci Jawaban Guru" (Text)
      bobot
    ];

    const result = await pool.query(query, values);
    
    res.status(201).json({ message: 'Soal berhasil ditambahkan', data: result.rows[0] });

  } catch (err) {
    console.error("Tambah Soal Error:", err);
    res.status(500).json({ message: 'Gagal menyimpan soal' });
  }
});

// ==========================================
// 5. HAPUS BUTIR SOAL
// Route: DELETE /api/guru/ujian/soal/:id
// ==========================================
router.delete('/ujian/soal/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM butir_soal WHERE id_soal = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Soal tidak ditemukan' });
    res.json({ message: 'Soal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus soal' });
  }
});

// ==========================================
// 6. HAPUS PAKET UJIAN
// Route: DELETE /api/guru/ujian/:id
// ==========================================
router.delete('/ujian/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM paket_ujian WHERE id_ujian = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Ujian tidak ditemukan' });
    res.json({ message: 'Paket ujian berhasil dihapus permanen' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus ujian' });
  }
});
// ==========================================
// 7. UBAH STATUS AKTIF UJIAN
// Route: PATCH /api/guru/ujian/:id/status
// ==========================================
router.patch('/ujian/:id/status', async (req, res) => {
  const { id } = req.params;
  const { apakah_aktif } = req.body; // Menerima true / false dari frontend

  try {
    const result = await pool.query(
      'UPDATE paket_ujian SET apakah_aktif = $1 WHERE id_ujian = $2 RETURNING *',
      [apakah_aktif, id]
    );
    res.json({ message: 'Status ujian diperbarui', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update status' });
  }
});
export default router;