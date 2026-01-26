import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Koneksi Database GAGAL:', err.message);
  } else {
    console.log('✅ Koneksi Database BERHASIL');
  }
});

export default pool; // Gunakan export default