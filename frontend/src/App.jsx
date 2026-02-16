import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- IMPORT HALAMAN AUTH ---
import LoginPage from './pages/auth/LoginPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// --- IMPORT LAYOUT ---
import MainLayout from './layouts/MainLayout.jsx';

// --- IMPORT HALAMAN ADMIN ---
import SiswaPage from './pages/admin/SiswaPage.jsx';
import GuruPage from './pages/admin/GuruPage.jsx';
import KelasPage from './pages/admin/KelasPage.jsx';

// --- IMPORT HALAMAN GURU ---
import GuruDashboard from './pages/guru/GuruDashboard'; 
import UjianDetailPage from './pages/guru/UjianDetailPage'; 
import GuruMonitoringPage from './pages/guru/GuruMonitoringPage'; 
import GuruAnalisisPage from './pages/guru/GuruAnalisisPage';

// --- KOMPONEN DUMMY DASHBOARD ADMIN (Masih dipakai sementara) ---
const AdminDashboard = () => (
  <div className="bg-white p-6 rounded shadow">
    <h1 className="text-2xl font-bold mb-4">👑 Dashboard Admin</h1>
    <p>Selamat datang di panel Administrator. Silakan pilih menu di samping untuk mengelola data.</p>
  </div>
);

// --- MIDDLEWARE PROTEKSI ROUTE ---
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  // 1. Tampilkan Loading biar gak langsung redirect ke login saat refresh page
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Memuat Data Pengguna...</div>;
  }
  
  // 2. Jika tidak ada user -> Tendang ke Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Cek Role (Jika role user tidak ada di daftar allowedRoles)
  if (allowedRoles && !allowedRoles.includes(user.peran)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">403</h1>
          <h2 className="text-xl font-semibold text-gray-800">Akses Ditolak!</h2>
          <p className="text-gray-600 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }
  
  return children;
};

// --- APP UTAMA ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* === PUBLIC ROUTES (AUTH) === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* === ADMIN ROUTES === */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <MainLayout />
              </PrivateRoute>
            } 
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="siswa" element={<SiswaPage />} />
            <Route path="guru" element={<GuruPage />} />
            <Route path="kelas" element={<KelasPage />} />
          </Route>

          {/* === GURU ROUTES === */}
          <Route 
            path="/guru" 
            element={
              <PrivateRoute allowedRoles={['guru', 'admin']}>
                <MainLayout />
              </PrivateRoute>
            } 
          >
                    {/* Redirect index ke dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            
            {/* 1. Dashboard Guru (Isinya juga List Ujian) */}
            <Route path="dashboard" element={<GuruDashboard />} />

            {/* 2. Route Bank Soal (INI YANG KURANG TADI) */}
            {/* Kita pakai GuruDashboard juga karena isinya memang tabel ujian */}
            <Route path="ujian" element={<GuruDashboard />} />

            {/* 3. Detail/Edit Soal */}
            <Route path="ujian/:id" element={<UjianDetailPage />} /> 
            
            {/* 4. Monitoring */}
            <Route path="monitoring" element={<GuruMonitoringPage />} />

            <Route path="monitoring/:id_sesi" element={<GuruAnalisisPage />} />
          </Route>
                
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;