-- ==========================================
-- PERSIAPAN: BERSIHKAN TABEL LAMA (RESET)
-- ==========================================
DROP TABLE IF EXISTS log_pelanggaran CASCADE;
DROP TABLE IF EXISTS jawaban_siswa CASCADE;
DROP TABLE IF EXISTS sesi_ujian CASCADE;
DROP TABLE IF EXISTS butir_soal CASCADE;
DROP TABLE IF EXISTS paket_ujian CASCADE;
DROP TABLE IF EXISTS guru CASCADE;
DROP TABLE IF EXISTS siswa CASCADE;
DROP TABLE IF EXISTS pengguna CASCADE;
DROP TYPE IF EXISTS status_ujian CASCADE;
DROP TYPE IF EXISTS peran_pengguna CASCADE;

-- 1. Pengaturan Ekstensi untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- BAGIAN A: FUNGSI PENGGANTI auth.uid()
-- ==========================================
CREATE OR REPLACE FUNCTION id_pengguna_saat_ini() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- BAGIAN B: STRUKTUR TABEL (SKEMA)
-- ==========================================

CREATE TYPE peran_pengguna AS ENUM ('admin', 'guru', 'siswa');
CREATE TYPE status_ujian AS ENUM ('berjalan', 'selesai');

-- 1. Tabel Pengguna (Pusat Otentikasi)
CREATE TABLE pengguna (
    id_pengguna UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_pengguna VARCHAR(50) UNIQUE NOT NULL, -- Username sistem (bisa sama dengan NIS/NIP)
    kata_sandi_hash TEXT NOT NULL,
    peran peran_pengguna NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Siswa (Profil Detail Siswa)
CREATE TABLE siswa (
    id_siswa UUID PRIMARY KEY REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    nis VARCHAR(20) UNIQUE NOT NULL, -- [UPDATE] Kolom NIS ditambahkan eksplisit
    nama_lengkap VARCHAR(100) NOT NULL,
    nama_kelas VARCHAR(20) NOT NULL,
    id_perangkat VARCHAR(100) 
);

-- 3. Tabel Guru (Profil Detail Guru)
CREATE TABLE guru (
    id_guru UUID PRIMARY KEY REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL, -- [UPDATE] Kolom NIP ditambahkan eksplisit
    nama_lengkap VARCHAR(100) NOT NULL
);

-- 4. Tabel Paket Ujian
CREATE TABLE paket_ujian (
    id_ujian UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dibuat_oleh UUID REFERENCES guru(id_guru),
    judul VARCHAR(200) NOT NULL,
    kode_token VARCHAR(6) UNIQUE NOT NULL,
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
    opsi_jawaban JSONB NOT NULL, 
    kunci_jawaban VARCHAR(5),
    bobot_nilai INT DEFAULT 1
);

-- 6. Tabel Sesi Ujian (RLS TARGET)
CREATE TABLE sesi_ujian (
    id_sesi UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ujian UUID REFERENCES paket_ujian(id_ujian),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL,
    waktu_mulai TIMESTAMP DEFAULT NOW(),
    waktu_selesai TIMESTAMP,
    status status_ujian DEFAULT 'berjalan',
    nilai_akhir DECIMAL(5,2) DEFAULT 0
);

-- 7. Tabel Jawaban Siswa (RLS TARGET)
CREATE TABLE jawaban_siswa (
    id_jawaban UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesi UUID REFERENCES sesi_ujian(id_sesi) ON DELETE CASCADE,
    id_soal UUID REFERENCES butir_soal(id_soal),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL,
    opsi_dipilih VARCHAR(5),
    waktu_klien TIMESTAMP,
    sudah_sinkron BOOLEAN DEFAULT TRUE,
    UNIQUE(id_sesi, id_soal) 
);

-- 8. Tabel Log Pelanggaran (RLS TARGET)
CREATE TABLE log_pelanggaran (
    id_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesi UUID REFERENCES sesi_ujian(id_sesi),
    id_siswa UUID REFERENCES siswa(id_siswa) NOT NULL,
    jenis_pelanggaran VARCHAR(50) NOT NULL,
    waktu_kejadian TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- BAGIAN C: KEAMANAN TINGKAT BARIS (RLS)
-- ==========================================

ALTER TABLE sesi_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_pelanggaran ENABLE ROW LEVEL SECURITY;

-- Policy 1: Sesi Ujian
CREATE POLICY isolasi_sesi_siswa ON sesi_ujian
    FOR ALL TO public
    USING (id_siswa = id_pengguna_saat_ini());

-- Policy 2: Jawaban Siswa
CREATE POLICY isolasi_jawaban_siswa ON jawaban_siswa
    FOR ALL TO public
    USING (id_siswa = id_pengguna_saat_ini())
    WITH CHECK (id_siswa = id_pengguna_saat_ini());

-- Policy 3: Log Pelanggaran
CREATE POLICY isolasi_log_siswa ON log_pelanggaran
    FOR INSERT TO public
    WITH CHECK (id_siswa = id_pengguna_saat_ini());