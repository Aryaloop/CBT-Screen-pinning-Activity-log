import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // Timer dalam detik

  // Efek untuk menjalankan Timer mundur
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    // Cleanup function (Race Condition Handler: Matikan timer jika komponen dicopot)
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Link reset telah dikirim ke email Anda.');
      
      // Set Timer 3 Menit (180 detik) setelah sukses
      setCountdown(180); 
      
    } catch (err) {
      // PERBAIKAN DISINI (Hapus 'Hz')
      // Jika kena Rate Limit dari backend (429 Too Many Requests)
      if (err.response && err.response.status === 429) {
        toast.error('Mohon tunggu sebentar sebelum meminta ulang.');
        setCountdown(180); // Paksa timer jalan juga di frontend
      } else {
        toast.error(err.response?.data?.message || 'Gagal memproses permintaan');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format detik ke Menit:Detik (misal 180 -> 03:00)
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
              className="w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500"
              required
              disabled={countdown > 0} // Kunci input jika timer jalan
            />
          </div>

          <button
            type="submit"
            disabled={loading || countdown > 0}
            className={`w-full px-4 py-2 font-bold text-white rounded transition-colors
              ${(loading || countdown > 0) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Memproses...' : countdown > 0 ? `Tunggu ${formatTime(countdown)}` : 'Kirim Link Reset'}
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