import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';

const SiswaPage = () => {
  const [siswa, setSiswa] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Siswa & Daftar Kelas
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSiswa, resKelas] = await Promise.all([
        api.get('/admin/siswa'),
        api.get('/admin/kelas')
      ]);
      setSiswa(resSiswa.data);
      setKelasList(resKelas.data); // Array string nama kelas
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Tambah Siswa Baru
  const handleAdd = async () => {
    // Buat opsi dropdown kelas dari API
    const classOptions = kelasList.map(k => `<option value="${k}">${k}</option>`).join('');
    
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Siswa Baru',
      html: `
        <input id="swal-nis" class="swal2-input" placeholder="NIS Siswa">
        <input id="swal-nama" class="swal2-input" placeholder="Nama Lengkap">
        <div style="margin-top: 15px; text-align: left; padding: 0 1rem;">
          <label style="font-size: 14px; color: #666;">Pilih/Ketik Kelas Baru:</label>
          <input list="kelas-options" id="swal-kelas" class="swal2-input" style="margin-top: 5px;" placeholder="Kelas (Misal: XII-RPL)">
          <datalist id="kelas-options">${classOptions}</datalist>
        </div>
        <input id="swal-password" type="password" class="swal2-input" placeholder="Kata Sandi">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        const nis = document.getElementById('swal-nis').value;
        const nama = document.getElementById('swal-nama').value;
        const kelas = document.getElementById('swal-kelas').value;
        const password = document.getElementById('swal-password').value;

        if (!nis || !nama || !kelas || !password) {
          Swal.showValidationMessage('Semua kolom wajib diisi!');
          return false;
        }
        return { nis, nama, kelas, password };
      }
    });

    if (formValues) {
      try {
        await api.post('/admin/siswa', formValues);
        Swal.fire('Sukses', 'Siswa berhasil ditambahkan', 'success');
        fetchData(); // Refresh data
      } catch (err) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menambahkan siswa', 'error');
      }
    }
  };

  // 3. Edit Data Siswa (Hanya Nama & Kelas)
  const handleEdit = async (s) => {
    const classOptions = kelasList.map(k => `<option value="${k}">${k}</option>`).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Edit Data Siswa',
      html: `
        <div style="text-align: left; padding: 0 1rem; margin-bottom: 10px;">
          <label style="font-size: 14px; color: #666;">NIS (Tidak dapat diubah)</label>
          <input class="swal2-input" value="${s.nis}" disabled style="background: #f3f4f6; margin-top: 5px;">
        </div>
        <div style="text-align: left; padding: 0 1rem;">
          <label style="font-size: 14px; color: #666;">Nama Lengkap</label>
          <input id="swal-edit-nama" class="swal2-input" value="${s.nama_lengkap}" style="margin-top: 5px;">
        </div>
        <div style="margin-top: 15px; text-align: left; padding: 0 1rem;">
          <label style="font-size: 14px; color: #666;">Kelas</label>
          <input list="kelas-options" id="swal-edit-kelas" class="swal2-input" value="${s.nama_kelas}" style="margin-top: 5px;">
          <datalist id="kelas-options">${classOptions}</datalist>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const nama = document.getElementById('swal-edit-nama').value;
        const kelas = document.getElementById('swal-edit-kelas').value;
        if (!nama || !kelas) {
          Swal.showValidationMessage('Nama dan Kelas tidak boleh kosong!');
          return false;
        }
        return { nama, kelas };
      }
    });

    if (formValues) {
      try {
        await api.put(`/admin/siswa/${s.id_siswa}`, formValues);
        Swal.fire('Sukses', 'Data siswa diperbarui', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Gagal', 'Gagal mengupdate data', 'error');
      }
    }
  };

  // 4. Hapus Siswa
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Yakin hapus?',
      text: "Seluruh riwayat ujian siswa ini juga akan terhapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/siswa/${id}`);
        Swal.fire('Terhapus!', 'Data siswa berhasil dihapus.', 'success');
        fetchData(); 
      } catch (err) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus', 'error');
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Data Siswa</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola akun, kelas, dan data peserta ujian.</p>
        </div>
        
        {/* Tombol Tambah Siswa */}
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center shadow-sm transition"
        >
          <span className="mr-2 text-lg">+</span> Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NIS</th>
              <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kelas</th>
              <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500 font-medium">Memuat Data...</td></tr>
            ) : siswa.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500 font-medium">Belum ada data siswa terdaftar.</td></tr>
            ) : (
              siswa.map((s) => (
                <tr key={s.id_siswa} className="hover:bg-blue-50/50 transition duration-150">
                  <td className="px-5 py-4 border-b border-gray-100 text-sm font-mono text-gray-600">{s.nis}</td>
                  <td className="px-5 py-4 border-b border-gray-100 text-sm font-bold text-gray-800">{s.nama_lengkap}</td>
                  <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2.5 py-1 rounded text-xs font-semibold">{s.nama_kelas}</span>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-100 text-sm text-center flex justify-center gap-2">
                    
                    {/* Tombol Edit */}
                    <button 
                      onClick={() => handleEdit(s)}
                      className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-1.5 rounded font-medium text-xs border border-yellow-200 transition"
                    >
                      Edit
                    </button>

                    {/* Tombol Hapus */}
                    <button 
                      onClick={() => handleDelete(s.id_siswa)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded font-medium text-xs border border-red-200 transition"
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