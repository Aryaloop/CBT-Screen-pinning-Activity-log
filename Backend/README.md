gaya penulisan ES Modules (import/export)
cbt-backend/
│
├── adminRoutes/                ← MODUL ADMIN (Manajemen Data Master)
│   ├── adminSiswa.js           ← CRUD Siswa (Logic + Route)
│   ├── adminGuru.js            ← CRUD Guru
│   ├── adminKelas.js           ← Manajemen Kelas (Opsional)
│   └── index.js                ← Router Pengumpul (/api/admin)
│
├── guruRoutes/                 ← MODUL GURU (Manajemen Ujian)
│   ├── guruUjian.js            ← Buat Header Ujian & Status Aktif
│   ├── guruSoal.js             ← CRUD Bank Soal & Bobot
│   ├── guruRekap.js            ← Monitoring Nilai Siswa
│   └── index.js                ← Router Pengumpul (/api/guru)
│
├── siswaRoutes/                ← MODUL SISWA (Pelaksanaan Ujian Hybrid)
│   ├── siswaUjian.js           ← Validasi Token & Download Soal
│   ├── siswaSync.js            ← Sinkronisasi Jawaban & Auto-Resume
│   └── index.js                ← Router Pengumpul (/api/siswa)
│
├── authRoutes/                 ← MODUL AUTH (Global)
│   ├── authController.js       ← Logic Login/Logout/Me
│   └── index.js                ← Router Auth (/api/auth)
│
├── config/
│   └── db.js                   ← Koneksi PostgreSQL
│
├── middleware/                 ← Keamanan
│   ├── authMiddleware.js       ← Cek Token & Role
│   └── rlsMiddleware.js        ← (Opsional) Setup RLS Context
│
├── utils/                      ← Fungsi Bantuan
│   ├── jwtHelper.js            ← Generator Token Cookie
│   └── timeHelper.js           ← Sinkronisasi Waktu Server (NTP)
│
├── node_modules/
├── app.js                      ← Entry Point (Server Utama)
└── package.json