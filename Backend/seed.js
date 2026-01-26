import bcrypt from 'bcrypt';
import pool from './config/db.js';

const seedData = async () => {
  try {
    console.log('🌱 Mulai Seeding Data...');
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Buat ADMIN (Login via Email)
    console.log('...Membuat akun Admin');
    await pool.query(
      `INSERT INTO pengguna (nama_pengguna, email, kata_sandi_hash, peran) 
       VALUES ($1, $2, $3, 'admin') 
       ON CONFLICT (email) DO UPDATE SET kata_sandi_hash = EXCLUDED.kata_sandi_hash`,
      ['admin_arya', 'aryaabdulmughni18@gmail.com', passwordHash]
    );

    // 2. Buat GURU (Login via Email)
    console.log('...Membuat akun Guru');
    const guruRes = await pool.query(
      `INSERT INTO pengguna (nama_pengguna, email, kata_sandi_hash, peran) 
       VALUES ($1, $2, $3, 'guru') 
       ON CONFLICT (email) DO UPDATE SET kata_sandi_hash = EXCLUDED.kata_sandi_hash
       RETURNING id_pengguna`,
      ['guru_cintya', 'cintyaajdh@gmail.com', passwordHash]
    );

    // Masukkan ke tabel profil guru
    if (guruRes.rows.length > 0) {
      const idGuru = guruRes.rows[0].id_pengguna;
      await pool.query(
        `INSERT INTO guru (id_guru, nip, nama_lengkap)
         VALUES ($1, $2, $3) 
         ON CONFLICT (id_guru) DO NOTHING`,
        [idGuru, '19902020', 'Ibu Guru Cintya']
      );
    }

    // 3. Buat SISWA (Login via NIS - Tidak butuh email)
    console.log('...Membuat akun Siswa');
    const siswaRes = await pool.query(
      `INSERT INTO pengguna (nama_pengguna, kata_sandi_hash, peran) 
       VALUES ($1, $2, 'siswa') 
       ON CONFLICT (nama_pengguna) DO UPDATE SET kata_sandi_hash = EXCLUDED.kata_sandi_hash
       RETURNING id_pengguna`,
      ['101112', passwordHash] // NIS Siswa
    );

    if (siswaRes.rows.length > 0) {
      const idSiswa = siswaRes.rows[0].id_pengguna;
      await pool.query(
        `INSERT INTO siswa (id_siswa, nis, nama_lengkap, nama_kelas, id_perangkat)
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id_siswa) DO NOTHING`,
        [idSiswa, '101112', 'Siswa Android', 'XII-RPL-1', 'DEVICE_TEST_001']
      );
    }

    console.log('✅ Seeding Selesai! Login Admin/Guru pakai Email, Siswa pakai NIS.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Gagal:', err);
    process.exit(1);
  }
};

seedData();