import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';

// ISO 9241-110: Self-descriptiveness (UI yang menjelaskan dirinya sendiri)
const GuruDashboard = () => {
  const [ujianList, setUjianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUjian = async () => {
    try {
      const { data } = await api.get('/guru/ujian');
      setUjianList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUjian();
  }, []);

  // ISO 25010: User Error Protection (Validasi Input Awal)
  const handleBuatUjian = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Buat Paket Ujian Baru',
      html:
        '<input id="swal-judul" class="swal2-input" placeholder="Nama Mata Pelajaran / Ujian">' +
        '<input id="swal-durasi" type="number" class="swal2-input" placeholder="Durasi (Menit)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Buat Sekarang',
      preConfirm: () => {
        const judul = document.getElementById('swal-judul').value;
        const durasi = document.getElementById('swal-durasi').value;
        if (!judul || !durasi) {
          Swal.showValidationMessage('Judul dan Durasi wajib diisi');
        }
        return { judul, durasi_menit: durasi };
      }
    });

    if (formValues) {
      try {
        await api.post('/guru/ujian', formValues);
        Swal.fire('Sukses', 'Paket ujian berhasil dibuat', 'success');
        fetchUjian();
      } catch (err) {
        Swal.fire('Gagal', 'Terjadi kesalahan server', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Paket Ujian?',
      text: "Semua soal & nilai siswa di ujian ini akan ikut terhapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus Permanen'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/guru/ujian/${id}`);
        Swal.fire('Terhapus', 'Paket ujian dihapus.', 'success');
        fetchUjian();
      } catch (err) {
        Swal.fire('Error', 'Gagal menghapus ujian', 'error');
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bank Soal & Ujian</h2>
          <p className="text-gray-500">Kelola paket ujian untuk siswa Anda.</p>
        </div>
        <button 
          onClick={handleBuatUjian}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition"
        >
          + Buat Ujian Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Memuat data...</p> : ujianList.map((ujian) => (
          <div key={ujian.id_ujian} className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-800">{ujian.judul}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${ujian.apakah_aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {ujian.apakah_aktif ? 'AKTIF' : 'DRAFT'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Kode Token: <span className="font-mono bg-yellow-100 px-1 rounded text-black font-bold">{ujian.kode_token}</span>
              </p>
              <p className="text-gray-500 text-sm">Durasi: {ujian.durasi_menit} Menit</p>
            </div>
            
            <div className="mt-6 flex space-x-2">
              <button 
                onClick={() => navigate(`/guru/ujian/${ujian.id_ujian}`)}
                className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded font-medium text-sm transition"
              >
                Kelola Soal
              </button>
              <button 
                onClick={() => handleDelete(ujian.id_ujian)}
                className="px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuruDashboard;