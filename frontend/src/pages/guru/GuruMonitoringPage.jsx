import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Pastikan ini di-import
import api from '../../services/api';
import Swal from 'sweetalert2';

const GuruMonitoringPage = () => {
  const [ujianList, setUjianList] = useState([]);
  const [selectedUjian, setSelectedUjian] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Panggil fungsi navigate

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

  const handlePilihUjian = async (idUjian) => {
    setSelectedUjian(idUjian);
    if (!idUjian) {
      setRekapData([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/guru/rekap/${idUjian}`);
      setRekapData(data);
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat data rekap', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-gray-500 text-sm mt-1">Pantau aktivitas, nilai, dan indikasi kecurangan siswa secara real-time.</p>
      </div>

      {/* Filter Card */}
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
        
        {selectedUjian && (
          <button 
            onClick={() => handlePilihUjian(selectedUjian)} 
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh Data
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Profil Siswa</th>
                <th className="p-4 font-semibold text-center">Kelas</th>
                <th className="p-4 font-semibold text-center">Waktu Mulai</th>
                <th className="p-4 font-semibold text-center">Waktu Selesai</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Pelanggaran</th>
                <th className="p-4 font-semibold text-center">Nilai Akhir</th>
                {/* TAMBAHAN HEADER AKSI */}
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {!selectedUjian ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="inline-flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-3 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path></svg>
                      Pilih paket ujian di atas untuk melihat rekap siswa
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">Memuat data secara live...</td>
                </tr>
              ) : rekapData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">Belum ada siswa yang bergabung dalam sesi ujian ini.</td>
                </tr>
              ) : (
                rekapData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{row.nama_lengkap}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">NIS: {row.nis}</p>
                    </td>
                    <td className="p-4 text-center text-gray-600 font-medium">{row.nama_kelas}</td>
                    <td className="p-4 text-center text-gray-600">{formatWaktu(row.waktu_mulai)}</td>
                    <td className="p-4 text-center text-gray-600">{formatWaktu(row.waktu_selesai)}</td>
                    
                    {/* Status Ujian */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 animate-pulse'
                      }`}>
                        {row.status === 'selesai' ? 'SELESAI' : 'MENGERJAKAN'}
                      </span>
                    </td>

                    {/* Sensor Pelanggaran */}
                    <td className="p-4 text-center">
                      {parseInt(row.jumlah_pelanggaran) > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                          ⚠️ {row.jumlah_pelanggaran} Kali
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">Aman ✓</span>
                      )}
                    </td>

                    {/* Nilai Akhir */}
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${
                        row.status === 'selesai' ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        {row.status === 'selesai' ? row.nilai_akhir : '-'}
                      </span>
                    </td>

                    {/* KOLOM AKSI (Dipindah ke dalam perulangan map) */}
                    <td className="p-4 text-center">
                      {row.status === 'selesai' ? (
                        <button 
                          onClick={() => navigate(`/guru/monitoring/${row.id_sesi}`)}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-semibold text-xs hover:bg-indigo-100 transition border border-indigo-200"
                        >
                          Detail Jawaban
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Menunggu</span>
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