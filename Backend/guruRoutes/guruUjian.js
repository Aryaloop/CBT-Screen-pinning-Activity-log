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
  const id_guru = req.user.id; // Didapat dari token JWT

  try {
    // Generate Token Unik
    let kode_token = generateExamToken();
    let isUnique = false;

    // Pastikan token belum dipakai (Looping cek sederhana)
    while (!isUnique) {
      const check = await pool.query('SELECT 1 FROM paket_ujian WHERE kode_token = $1', [kode_token]);
      if (check.rowCount === 0) {
        isUnique = true;
      } else {
        kode_token = generateExamToken();
      }
    }

    const result = await pool.query(
      `INSERT INTO paket_ujian (dibuat_oleh, judul, kode_token, durasi_menit, apakah_aktif) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING *`,
      [id_guru, judul, kode_token, durasi_menit]
    );

    res.status(201).json({
      message: 'Paket ujian berhasil dibuat',
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Buat Ujian Error:", err);
    res.status(500).json({ message: 'Gagal membuat paket ujian' });
  }
});

// ==========================================
// 2. TAMBAH BUTIR SOAL KE UJIAN
// Route: POST /api/guru/ujian/:id/soal
// ==========================================
router.post('/ujian/:id/soal', async (req, res) => {
  const { id } = req.params; // ID Ujian
  const { teks_soal, tipe_soal, opsi_jawaban, kunci_jawaban, bobot_nilai } = req.body;
  
  // Security: Pastikan ujian ini milik guru yang sedang login
  // (Optional tapi disarankan)

  try {
    // Insert Soal
    // opsi_jawaban dikirim dalam bentuk JSON Object { A: "...", B: "..." }
    // PostgreSQL JSONB akan otomatis menangani object JS
    const result = await pool.query(
      `INSERT INTO butir_soal (id_ujian, teks_soal, tipe_soal, opsi_jawaban, kunci_jawaban, bobot_nilai)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, teks_soal, tipe_soal || 'pilihan_ganda', opsi_jawaban, kunci_jawaban, bobot_nilai || 1]
    );

    res.status(201).json({
      message: 'Soal berhasil ditambahkan',
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Tambah Soal Error:", err);
    res.status(500).json({ message: 'Gagal menambahkan soal' });
  }
});

// ==========================================
// 3. GET DETAIL UJIAN & SOALNYA (Untuk Preview Guru)
// Route: GET /api/guru/ujian/:id
// ==========================================
router.get('/ujian/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil Header
    const ujianRes = await pool.query('SELECT * FROM paket_ujian WHERE id_ujian = $1', [id]);
    if (ujianRes.rowCount === 0) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

    // Ambil Soal-soalnya
    const soalRes = await pool.query('SELECT * FROM butir_soal WHERE id_ujian = $1 ORDER BY id_soal ASC', [id]);

    res.json({
      ujian: ujianRes.rows[0],
      soal: soalRes.rows
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data ujian' });
  }
});

// ==========================================
// 4. AKTIFKAN / NON-AKTIFKAN UJIAN
// Route: PATCH /api/guru/ujian/:id/status
// ==========================================
router.patch('/ujian/:id/status', async (req, res) => {
  const { id } = req.params;
  const { apakah_aktif } = req.body; // boolean true/false

  try {
    const result = await pool.query(
      'UPDATE paket_ujian SET apakah_aktif = $1 WHERE id_ujian = $2 RETURNING *',
      [apakah_aktif, id]
    );
    res.json({ message: 'Status ujian diperbarui', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update status' });
  }
});
// 5. EDIT BUTIR SOAL
// Route: PUT /api/guru/ujian/soal/:id
// ==========================================
router.put('/ujian/soal/:id', async (req, res) => {
  const { id } = req.params; // ID Soal
  const { teks_soal, opsi_jawaban, kunci_jawaban, bobot_nilai } = req.body;

  try {
    // Kita gunakan COALESCE di SQL atau logic JS agar field yang tidak dikirim tidak berubah jadi NULL
    // Tapi cara paling gampang di Node.js seperti ini:
    
    // 1. Cek dulu soalnya ada gak
    const oldSoal = await pool.query('SELECT * FROM butir_soal WHERE id_soal = $1', [id]);
    if (oldSoal.rowCount === 0) return res.status(404).json({ message: 'Soal tidak ditemukan' });

    // 2. Update
    const result = await pool.query(
      `UPDATE butir_soal 
       SET teks_soal = COALESCE($1, teks_soal),
           opsi_jawaban = COALESCE($2, opsi_jawaban),
           kunci_jawaban = COALESCE($3, kunci_jawaban),
           bobot_nilai = COALESCE($4, bobot_nilai)
       WHERE id_soal = $5
       RETURNING *`,
      [teks_soal, opsi_jawaban, kunci_jawaban, bobot_nilai, id]
    );

    res.json({ message: 'Soal berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    console.error("Edit Soal Error:", err);
    res.status(500).json({ message: 'Gagal update soal' });
  }
});

// ==========================================
// 6. HAPUS BUTIR SOAL
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
// 7. HAPUS PAKET UJIAN (Hati-hati: Cascade Delete)
// Route: DELETE /api/guru/ujian/:id
// ==========================================
router.delete('/ujian/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Karena di database kita set ON DELETE CASCADE, 
    // maka soal & sesi ujian terkait akan otomatis terhapus.
    const result = await pool.query('DELETE FROM paket_ujian WHERE id_ujian = $1', [id]);
    
    if (result.rowCount === 0) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

    res.json({ message: 'Paket ujian berhasil dihapus permanen' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus ujian' });
  }
});

// ==========================================
// 8. MONITORING / REKAP NILAI
// Route: GET /api/guru/ujian/:id/rekap
// Deskripsi: Melihat siswa siapa saja yang sudah mengerjakan ujian ini
// ==========================================
router.get('/ujian/:id/rekap', async (req, res) => {
  const { id } = req.params; // ID Ujian
  try {
    const query = `
      SELECT 
        s.nama_lengkap, 
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