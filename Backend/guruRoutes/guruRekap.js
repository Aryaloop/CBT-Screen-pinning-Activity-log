// File: guruRoutes/guruRekap.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// 1. DAFTAR REKAP NILAI SISWA PER UJIAN
// Route: GET /api/guru/rekap/:id
// ==========================================
router.get('/rekap/:id', async (req, res) => {
  const { id } = req.params; 
  try {
    const query = `
      SELECT 
        sesi.id_sesi,
        s.nama_lengkap, 
        s.nis,
        s.nama_kelas, 
        sesi.waktu_mulai, 
        sesi.waktu_selesai, 
        sesi.nilai_akhir,
        sesi.status,
        (SELECT COUNT(*) FROM log_pelanggaran lp WHERE lp.id_sesi = sesi.id_sesi) as jumlah_pelanggaran
      FROM sesi_ujian sesi
      JOIN siswa s ON sesi.id_siswa = s.id_siswa
      WHERE sesi.id_ujian = $1
      ORDER BY sesi.status ASC, sesi.nilai_akhir DESC
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil rekap nilai' });
  }
});

// ==========================================
// 2. DETAIL ANALISIS JAWABAN SISWA
// Route: GET /api/guru/rekap/detail/:id_sesi
// ==========================================
router.get('/rekap/detail/:id_sesi', async (req, res) => {
  const { id_sesi } = req.params;

  try {
    // A. Ambil Info Siswa & Sesi
    const infoSesi = await pool.query(`
      SELECT s.nama_lengkap, s.nis, s.nama_kelas, p.judul, su.nilai_akhir, su.waktu_selesai
      FROM sesi_ujian su
      JOIN siswa s ON su.id_siswa = s.id_siswa
      JOIN paket_ujian p ON su.id_ujian = p.id_ujian
      WHERE su.id_sesi = $1
    `, [id_sesi]);

    if (infoSesi.rowCount === 0) {
      return res.status(404).json({ message: 'Sesi tidak ditemukan' });
    }

    // B. Ambil Detail Jawaban
    const queryJawaban = `
      SELECT 
        b.teks_soal, 
        b.tipe_soal, 
        b.opsi_jawaban, 
        b.kunci_jawaban, 
        b.bobot_nilai,
        j.opsi_dipilih,
        (j.opsi_dipilih = b.kunci_jawaban) as is_benar
      FROM jawaban_siswa j
      JOIN butir_soal b ON j.id_soal = b.id_soal
      WHERE j.id_sesi = $1
      ORDER BY b.id_soal
    `;
    const detailJawaban = await pool.query(queryJawaban, [id_sesi]);

    res.json({
      info: infoSesi.rows[0],
      jawaban: detailJawaban.rows
    });
  } catch (err) {
    console.error("Gagal get detail jawaban:", err);
    res.status(500).json({ message: 'Gagal mengambil detail jawaban' });
  }
});

export default router;