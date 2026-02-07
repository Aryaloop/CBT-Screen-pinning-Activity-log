import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import JSEncrypt from 'jsencrypt'; // Import Library RSA
import api from '../../services/api'; // Import axios instance

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState(''); // State simpan kunci
  const { login } = useAuth();
  const navigate = useNavigate();

  // 1. Ambil Public Key dari Server saat Halaman Dimuat
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data } = await api.get('/auth/public-key');
        setPublicKey(data.publicKey);
      } catch (err) {
        console.error("Gagal mengambil kunci enkripsi", err);
        toast.error("Gagal inisialisasi keamanan");
      }
    };
    fetchKey();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!publicKey) {
      toast.error("Kunci keamanan belum siap, coba refresh halaman");
      return;
    }

    try {
      // 2. ENKRIPSI PASSWORD SEBELUM DIKIRIM
      const encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);
      const encryptedPassword = encryptor.encrypt(password);

      if (!encryptedPassword) {
        throw new Error("Gagal mengenkripsi password");
      }

      // 3. Kirim Password Terenkripsi (Bukan password asli)
      const userData = await login(email, encryptedPassword);
      
      toast.success(`Selamat datang, ${userData.nama_pengguna}!`);
      
      if (userData.peran === 'admin') navigate('/admin/dashboard');
      else if (userData.peran === 'guru') navigate('/guru/dashboard');
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login Gagal');
    }
  };
  
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
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Masuk
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