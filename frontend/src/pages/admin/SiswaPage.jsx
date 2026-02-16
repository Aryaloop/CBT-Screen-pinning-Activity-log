import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';

const SiswaPage = () => {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const fetchSiswa = async () => {
    try {
      const { data } = await api.get('/admin/siswa');
      setSiswa(data);
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat data siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  // Handle Hapus
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Yakin hapus?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/siswa/${id}`);
        Swal.fire('Terhapus!', 'Data siswa berhasil dihapus.', 'success');
        fetchSiswa(); // Refresh table
      } catch (err) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus', 'error');
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow">
          + Tambah Siswa
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIS</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center py-4">Memuat Data...</td></tr>
            ) : siswa.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-4 text-gray-500">Belum ada data siswa.</td></tr>
            ) : (
              siswa.map((s) => (
                <tr key={s.id_siswa} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">{s.nis}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">{s.nama_lengkap}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">{s.nama_kelas}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                    <button 
                      onClick={() => handleDelete(s.id_siswa)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiswaPage;