import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import JSEncrypt from 'jsencrypt'; // WAJIB: Library Enkripsi

const ResetPasswordPage = () => {
  const { token } = useParams(); // Ambil token dari URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Ambil Public Key saat halaman dimuat
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data } = await api.get('/auth/public-key');
        setPublicKey(data.publicKey);
      } catch (err) {
        toast.error("Gagal memuat kunci keamanan server.");
      }
    };
    fetchKey();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok");
    }
    if (!publicKey) {
      return toast.error("Kunci keamanan belum siap. Refresh halaman.");
    }

    setLoading(true);

    try {
      // 2. ENKRIPSI PASSWORD BARU (RSA)
      const encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);
      const encryptedPassword = encryptor.encrypt(password);

      if (!encryptedPassword) throw new Error("Enkripsi gagal");

      // 3. Kirim ke Backend
      await api.post(`/auth/reset-password/${token}`, {
        password_baru: encryptedPassword // Kirim yang sudah terenkripsi
      });

      toast.success("Password berhasil diubah! Silakan login.");
      
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Buat Password Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password Baru</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;