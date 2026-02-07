// File: siswaRoutes/siswaSync.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ==========================================
// SYNC JAWABAN (Background Worker)
// Route: POST /api/siswa/sync
// ==========================================
router.post('/sync', async (req, res) => {
  const { id_sesi, jawaban } = req.body;
  const id_siswa = req.user.id;

  if (!jawaban || !Array.isArray(jawaban)) {
    return res.status(400).json({ message: 'Format data salah' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Optimasi: Gunakan Batch Insert jika memungkinkan, tapi loop aman untuk integritas
    for (const jwb of jawaban) {
      await client.query(
        `INSERT INTO jawaban_siswa (id_sesi, id_soal, id_siswa, opsi_dipilih, waktu_klien)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_sesi, id_soal) 
         DO UPDATE SET 
            opsi_dipilih = EXCLUDED.opsi_dipilih,
            waktu_klien = EXCLUDED.waktu_klien,
            sudah_sinkron = true`,
        [id_sesi, jwb.id_soal, id_siswa, jwb.opsi_dipilih, jwb.waktu_klien]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Sync OK' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Sync Error:", err);
    res.status(500).json({ message: 'Gagal sinkronisasi' });
  } finally {
    client.release();
  }
});

export default router;