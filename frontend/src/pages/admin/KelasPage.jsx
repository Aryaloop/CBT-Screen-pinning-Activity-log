import { useState, useEffect } from 'react';
import api from '../../services/api';

const KelasPage = () => {
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const { data } = await api.get('/admin/kelas');
        setKelas(data); // Data berupa array string ["X-RPL", "XI-TKJ"]
      } catch (err) {
        console.error("Gagal load kelas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKelas();
  }, []);

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Kelas Terdaftar</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          Daftar kelas ini diambil otomatis dari data siswa yang sudah diinput.
        </p>
        
        {loading ? (
          <div>Loading...</div>
        ) : kelas.length === 0 ? (
          <div className="text-gray-500">Belum ada data kelas.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kelas.map((k, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 p-4 rounded text-center font-semibold text-blue-800 hover:bg-blue-100 transition">
                {k}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KelasPage;