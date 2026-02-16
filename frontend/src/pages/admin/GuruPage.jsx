import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';

const GuruPage = () => {
  const [guru, setGuru] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  const fetchGuru = async () => {
    try {
      const { data } = await api.get('/admin/guru');
      setGuru(data);
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat data guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  // 2. Tambah Guru (Modal Form)
  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Guru Baru',
      html:
        '<input id="swal-nip" class="swal2-input" placeholder="NIP">' +
        '<input id="swal-nama" class="swal2-input" placeholder="Nama Lengkap">' +
        '<input id="swal-email" class="swal2-input" placeholder="Email">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        return {
          nip: document.getElementById('swal-nip').value,
          nama_lengkap: document.getElementById('swal-nama').value,
          email: document.getElementById('swal-email').value
        };
      }
    });

    if (formValues) {
      try {
        const { data } = await api.post('/admin/guru', formValues);
        
        // Tampilkan Password Sementara (PENTING)
        Swal.fire({
          title: 'Berhasil!',
          html: `Akun Guru dibuat.<br><b>Password Sementara:</b> <span style="color:red; font-size:1.2em">${data.data.temp_password}</span><br>Harap dicatat!`,
          icon: 'success'
        });
        fetchGuru(); // Refresh tabel
      } catch (err) {
        Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan', 'error');
      }
    }
  };

  // 3. Hapus Guru
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Guru?',
      text: "Akses login guru ini akan hilang.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/guru/${id}`);
        Swal.fire('Terhapus!', 'Data guru berhasil dihapus.', 'success');
        fetchGuru();
      } catch (err) {
        Swal.fire('Gagal', 'Tidak bisa menghapus data ini.', 'error');
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Guru</h2>
        <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow">
          + Tambah Guru
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIP</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center py-4">Memuat Data...</td></tr>
            ) : guru.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-4 text-gray-500">Belum ada data guru.</td></tr>
            ) : (
              guru.map((g) => (
                <tr key={g.id_guru} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">{g.nip}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">{g.nama_lengkap}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">{g.email}</td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                    <button onClick={() => handleDelete(g.id_guru)} className="text-red-600 hover:text-red-900 font-medium">
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

export default GuruPage;