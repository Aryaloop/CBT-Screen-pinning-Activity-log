-- 1. Pengaturan Ekstensi untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- BAGIAN A: FUNGSI PENGGANTI auth.uid()
-- ==========================================
-- Fungsi ini akan membaca variabel sesi yang dikirim oleh Node.js (Backend)
CREATE OR REPLACE FUNCTION id_pengguna_saat_ini() RETURNS UUID AS $$
BEGIN
    -- Mengambil nilai dari variabel konfigurasi lokal 'app.current_user_id'
    -- NULLIF digunakan jika variabel belum diset (misal saat login awal)
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- BAGIAN B: STRUKTUR TABEL (SKEMA)
-- ==========================================

-- Enum untuk Peran dan Status agar data konsisten
CREATE TYPE peran_pengguna AS ENUM ('admin', 'guru', 'siswa');
CREATE TYPE status_ujian AS ENUM ('berjalan', 'selesai');

-- 1. Tabel Pengguna (Pusat Otentikasi)
-- Menyimpan data login untuk semua aktor (Admin, Guru, Siswa)
CREATE TABLE pengguna (
    id_pengguna UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_pengguna VARCHAR(50) UNIQUE NOT NULL, -- Bisa diisi NIS atau NIP
    kata_sandi_hash TEXT NOT NULL,
    peran peran_pengguna NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Siswa (Profil Detail Siswa)
-- Relasi One-to-One dengan tabel pengguna
CREATE TABLE siswa (
    id_siswa UUID PRIMARY KEY REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    nama_lengkap VARCHAR(100) NOT NULL,
    nama_kelas VARCHAR(20) NOT NULL,
    id_perangkat VARCHAR(100) -- Menyimpan ID HP untuk fitur Screen Pinning / Locking
);

-- 3. Tabel Guru (Profil Detail Guru)
-- Relasi One-to-One dengan tabel pengguna
CREATE TABLE guru (
    id_guru UUID PRIMARY KEY REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    nama_lengkap VARCHAR(100) NOT NULL
);

-- 4. Tabel Paket Ujian (Manajemen Bank Soal - Sesuai FR-W-01)
CREATE TABLE paket_ujian (
    id_ujian UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dibuat_oleh UUID REFERENCES guru(id_guru),
    judul VARCHAR(200) NOT NULL,
    kode_token VARCHAR(6) UNIQUE NOT NULL, -- Token untuk siswa masuk ujian
    durasi_menit INT NOT NULL,
    apakah_aktif BOOLEAN DEFAULT FALSE,
    dibuat_pada TIMESTAMP DEFAULT NOW()
);

-- 5. Tabel Butir Soal
CREATE TABLE butir_soal (
    id_soal UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ujian UUID REFERENCES paket_ujian(id_ujian) ON DELETE CASCADE,
    teks_soal TEXT NOT NULL,
    tipe_soal VARCHAR(20) DEFAULT 'pilihan_ganda',
    opsi_jawaban JSONB NOT NULL, -- Menyimpan opsi A,B,C,D,E (Format JSON agar dinamis)
    kunci_jawaban VARCHAR(5), -- Contoh: 'A'
    bobot_nilai INT DEFAULT 1 -- Mendukung pembobotan nilai variabel
);

-- 6. Tabel Sesi Ujian (Monitoring Siswa)
-- Tabel ini mencatat saat siswa mulai mengerjakan dan nilai akhirnya
CREATE TABLE sesi_ujian (
    id_sesi UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ujian UUID REFERENCES paket_ujian(id_ujian),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL,
    waktu_mulai TIMESTAMP DEFAULT NOW(),
    waktu_selesai TIMESTAMP, -- Diisi saat tombol 'Selesai' ditekan
    status status_ujian DEFAULT 'berjalan',
    nilai_akhir DECIMAL(5,2) DEFAULT 0
);

-- 7. Tabel Jawaban Siswa (Data Kritis)
-- Mendukung Penyimpanan Lokal & Sinkronisasi (Sesuai FR-M-04)
CREATE TABLE jawaban_siswa (
    id_jawaban UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesi UUID REFERENCES sesi_ujian(id_sesi) ON DELETE CASCADE,
    id_soal UUID REFERENCES butir_soal(id_soal),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL, -- Kolom ini WAJIB untuk fitur keamanan RLS
    opsi_dipilih VARCHAR(5), -- Jawaban siswa (misal: 'B')
    waktu_klien TIMESTAMP, -- Waktu saat dijawab di HP (untuk audit)
    sudah_sinkron BOOLEAN DEFAULT TRUE,
    
    -- Kendala: Satu soal hanya boleh ada satu jawaban per sesi ujian
    UNIQUE(id_sesi, id_soal) 
);

-- 8. Tabel Log Pelanggaran (Keamanan)
-- Mencatat deteksi kecurangan (Sesuai FR-M-05 Activity Lifecycle)
CREATE TABLE log_pelanggaran (
    id_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesi UUID REFERENCES sesi_ujian(id_sesi),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL,
    jenis_pelanggaran VARCHAR(50) NOT NULL, -- Contoh: 'LAYAR_TERBELAH', 'TOMBOL_HOME'
    waktu_kejadian TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- BAGIAN C: KEAMANAN TINGKAT BARIS (RLS)
-- ==========================================
-- Implementasi NFR-SEC-01 (Row Level Security)
-- Mencegah siswa melihat data siswa lain

-- Aktifkan RLS pada tabel transaksi sensitif
ALTER TABLE sesi_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_pelanggaran ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan untuk Sesi Ujian
-- "Siswa hanya bisa melihat sesi ujian miliknya sendiri"
CREATE POLICY isolasi_sesi_siswa ON sesi_ujian
    FOR ALL
    TO public
    USING (id_siswa = id_pengguna_saat_ini());

-- 2. Kebijakan untuk Jawaban Siswa
-- "Siswa hanya bisa melihat atau mengisi jawaban miliknya sendiri"
CREATE POLICY isolasi_jawaban_siswa ON jawaban_siswa
    FOR ALL
    TO public
    USING (id_siswa = id_pengguna_saat_ini())
    WITH CHECK (id_siswa = id_pengguna_saat_ini());

-- 3. Kebijakan untuk Log Pelanggaran
-- "Siswa hanya bisa memasukkan log pelanggaran atas namanya sendiri"
CREATE POLICY isolasi_log_siswa ON log_pelanggaran
    FOR INSERT
    TO public
    WITH CHECK (id_siswa = id_pengguna_saat_ini());