import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import JSEncrypt from 'jsencrypt'; 
import api from '../../services/api'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');
  
  // STATE BARU: Untuk mematikan tombol login
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load Public Key
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data } = await api.get('/auth/public-key');
        setPublicKey(data.publicKey);
      } catch (err) {
        console.error("Key Error", err);
      }
    };
    fetchKey();
  }, []);

  // Logic Timer Mundur (Cooldown Login)
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      setIsLocked(true); // Kunci tombol
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setIsLocked(false); // Buka kunci jika 0
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!publicKey) {
      Swal.fire('Error', 'Keamanan belum siap, refresh halaman.', 'error');
      return;
    }

    try {
      const encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);
      const encryptedPassword = encryptor.encrypt(password);

      if (!encryptedPassword) throw new Error("Gagal enkripsi");

      const userData = await login(email, encryptedPassword);
      
      Swal.fire({
        title: 'Berhasil Masuk!',
        text: `Selamat datang, ${userData.nama}!`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      if (userData.peran === 'admin') navigate('/admin/dashboard');
      else if (userData.peran === 'guru') navigate('/guru/dashboard');
      
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Login Gagal';

      // JIKA KENA RATE LIMIT DARI BACKEND (429)
      if (status === 429) {
        Swal.fire({
          title: 'Terlalu Banyak Percobaan',
          text: 'Anda salah password berkali-kali. Silakan tunggu 2 menit.',
          icon: 'warning'
        });
        // Matikan tombol selama 120 detik (2 menit)
        setCountdown(120); 
      } else {
        // Error biasa (Password salah / User tidak ada)
        Swal.fire({
          title: 'Gagal Masuk',
          text: msg,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // Helper format waktu (Menit:Detik)
  const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Login CBT System</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Email..."
              disabled={isLocked} // Input mati kalau kena limit
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="********"
              disabled={isLocked} // Input mati kalau kena limit
            />
          </div>

          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className={`text-sm text-blue-600 hover:text-blue-800 hover:underline ${isLocked ? 'pointer-events-none text-gray-400' : ''}`}
            >
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLocked} // Tombol Mati kalau kena limit
            className={`w-full px-4 py-2 font-bold text-white rounded transition duration-200
              ${isLocked 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {/* Ubah Teks Tombol */}
            {isLocked ? `Tunggu ${formatTime(countdown)}` : 'Masuk'}
          </button>
        </form>
        <div className="text-sm text-center text-gray-500">
          Khusus Guru & Admin (Web)
        </div>
      </div>
    </div>
  );
};

export default LoginPage;