import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';

// --- SUB KOMPONEN: TIMER HITUNG MUNDUR REALTIME ---
const ServerSyncedTimer = ({ waktuMulai, durasiMenit, waktuServer }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // 1. Hitung kapan ujian selesai (waktu_mulai + durasi_menit)
    const startTime = new Date(waktuMulai).getTime();
    const durationMs = durasiMenit * 60 * 1000;
    const endTime = startTime + durationMs;
    
    // 2. Ambil waktu server saat data di-fetch
    const serverNow = new Date(waktuServer).getTime();

    // 3. Sisa waktu (Selisih)
    let remaining = endTime - serverNow;
    setTimeLeft(remaining);

    // 4. Hitung mundur visual di sisi client setiap 1 detik
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [waktuMulai, durasiMenit, waktuServer]); // Akan ter-reset otomatis setiap polling 5 detik

  if (timeLeft <= 0) {
    return <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs animate-pulse">HABIS</span>;
  }

  // Konversi Milidetik ke Menit & Detik
  const m = Math.floor(timeLeft / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded">
      {m}m {s}s
    </span>
  );
};

const GuruMonitoringPage = () => {
  const [ujianList, setUjianList] = useState([]);
  const [selectedUjian, setSelectedUjian] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUjian = async () => {
      try {
        const { data } = await api.get('/guru/ujian');
        setUjianList(data);
      } catch (err) {
        console.error("Gagal load ujian", err);
      }
    };
    fetchUjian();
  }, []);

  const fetchRekapData = async (idUjian, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data } = await api.get(`/guru/rekap/${idUjian}`);
      setRekapData(data);
    } catch (err) {
      if (!isBackground) Swal.fire('Error', 'Gagal memuat data rekap', 'error');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handlePilihUjian = async (idUjian) => {
    setSelectedUjian(idUjian);
    if (!idUjian) {
      setRekapData([]);
      return;
    }
    await fetchRekapData(idUjian, false);
  };

  // POLLING 5 DETIK
  useEffect(() => {
    let intervalId;
    if (selectedUjian) {
      intervalId = setInterval(() => {
        fetchRekapData(selectedUjian, true); 
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [selectedUjian]);

  const formatWaktu = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Live Monitoring Ujian</h2>
        <p className="text-gray-500 text-sm mt-1">Pantau aktivitas, sisa waktu, dan pelanggaran siswa secara realtime.</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pilih Paket Ujian</label>
          <select 
            className="w-full md:w-2/3 border-gray-300 rounded-lg bg-gray-50 p-2.5 text-gray-700 focus:ring-blue-500 focus:border-blue-500 transition"
            value={selectedUjian}
            onChange={(e) => handlePilihUjian(e.target.value)}
          >
            <option value="">-- Silakan Pilih Ujian --</option>
            {ujianList.map((u) => (
              <option key={u.id_ujian} value={u.id_ujian}>
                {u.judul} (Token: {u.kode_token})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Profil Siswa</th>
                <th className="p-4 font-semibold text-center">Mulai</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Sisa Waktu</th>
                <th className="p-4 font-semibold text-center">Pelanggaran</th>
                <th className="p-4 font-semibold text-center">Nilai Akhir</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {!selectedUjian ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-400">Pilih paket ujian di atas</td></tr>
              ) : loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-500">Memuat data secara live...</td></tr>
              ) : rekapData.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-500">Belum ada siswa yang bergabung.</td></tr>
              ) : (
                rekapData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{row.nama_lengkap}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{row.nis} • {row.nama_kelas}</p>
                    </td>
                    <td className="p-4 text-center text-gray-600">{formatWaktu(row.waktu_mulai)}</td>
                    
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 animate-pulse'
                      }`}>
                        {row.status === 'selesai' ? 'SELESAI' : 'MENGERJAKAN'}
                      </span>
                    </td>

                    {/* SISA WAKTU REALTIME (Hanya jika status berjalan) */}
                    <td className="p-4 text-center">
                      {row.status === 'selesai' ? (
                        <span className="text-gray-400 text-xs">Berakhir: {formatWaktu(row.waktu_selesai)}</span>
                      ) : (
                        <ServerSyncedTimer 
                          waktuMulai={row.waktu_mulai} 
                          durasiMenit={row.durasi_menit} 
                          waktuServer={row.waktu_server_sekarang} 
                        />
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {parseInt(row.jumlah_pelanggaran) > 0 ? (
                        <span className="inline-flex gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                          ⚠️ {row.jumlah_pelanggaran} Kali
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">Aman ✓</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${row.status === 'selesai' ? 'text-blue-600' : 'text-gray-300'}`}>
                        {row.status === 'selesai' ? row.nilai_akhir : '-'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {row.status === 'selesai' ? (
                        <button 
                          onClick={() => navigate(`/guru/monitoring/${row.id_sesi}`)}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-semibold text-xs hover:bg-indigo-100 transition border border-indigo-200"
                        >
                          Detail
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuruMonitoringPage;