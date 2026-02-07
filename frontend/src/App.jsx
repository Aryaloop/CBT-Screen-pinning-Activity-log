import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Komponen Dummy untuk Dashboard (Nanti kita pisah)
const AdminDashboard = () => <div className="p-10 text-2xl font-bold">👑 Halaman Admin</div>;
const GuruDashboard = () => <div className="p-10 text-2xl font-bold">🎓 Halaman Guru</div>;

// Component untuk Proteksi Route (Middleware Frontend)
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.peran)) {
    return <div className="p-10 text-red-500">Akses Ditolak!</div>;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Route AUTH */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* :token adalah parameter dinamis */}
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Route Admin */}
          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Route Guru */}
          <Route 
            path="/guru/*" 
            element={
              <PrivateRoute allowedRoles={['guru', 'admin']}>
                <GuruDashboard />
              </PrivateRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;