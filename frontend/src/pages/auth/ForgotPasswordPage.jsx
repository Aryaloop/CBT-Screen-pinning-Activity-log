import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2'; 

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); 

  // Logic Timer Mundur
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      
      // SUKSES: Timer Jalan (180 detik / 3 Menit)
      Swal.fire({
        title: 'Link Terkirim!', 
        text: 'Silakan cek inbox/spam email Anda.', 
        icon: 'success'
      });
      setCountdown(180); 
      
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      
      if (status === 429) {
        // KENA RATE LIMIT (Terlalu Sering): Timer Tetap Jalan
        // Backend bilang "Tunggu 3 menit", jadi kita set timer frontend juga
        Swal.fire({
          title: 'Tunggu Dulu!',
          text: msg, // Pesan dari backend: "Tunggu 3 menit..."
          icon: 'warning'
        });
        setCountdown(180); 

      } else if (status === 404) {
        // EMAIL TIDAK DITEMUKAN: Timer JANGAN Jalan
        // Sesuai request: "Kalo gk ada emailnya ya gk usah timer"
        Swal.fire({
          title: 'Gagal',
          text: 'Email tersebut tidak terdaftar.',
          icon: 'error'
        });
        setCountdown(0); // Pastikan timer mati

      } else {
        // Error Lainnya
        Swal.fire('Error', msg, 'error');
        setCountdown(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper format menit:detik
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Lupa Password?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Masukkan email Anda untuk menerima link reset password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Terdaftar</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="nama@sekolah.sch.id"
              // Input dimatikan hanya jika timer sedang berjalan (Cooldown)
              disabled={countdown > 0} 
            />
          </div>

          <button
            type="submit"
            disabled={loading || countdown > 0}
            className={`w-full px-4 py-2 font-bold text-white rounded transition duration-200
              ${(loading || countdown > 0) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading 
              ? 'Memproses...' 
              : countdown > 0 
                ? `Tunggu ${formatTime(countdown)}` 
                : 'Kirim Link Reset'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;