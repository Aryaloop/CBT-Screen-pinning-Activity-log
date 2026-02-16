import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GuruAnalisisPage = () => {
  const { id_sesi } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/guru/rekap/detail/${id_sesi}`);
        setData(res.data);
      } catch (err) {
        console.error("Gagal muat detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id_sesi]);

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat analisis jawaban...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Data tidak ditemukan.</div>;

  const { info, jawaban } = data;
  
  // Kalkulasi statistik singkat
  const totalBenar = jawaban.filter(j => j.is_benar).length;
  const totalSalah = jawaban.filter(j => !j.is_benar).length;

  return (
    <div className="container mx-auto pb-10">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline flex items-center gap-1 font-medium">
        &larr; Kembali ke Monitoring
      </button>

      {/* Header Info Siswa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{info.nama_lengkap} <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">{info.nis}</span></h2>
          <p className="text-gray-500 mt-1">{info.judul} • Kelas {info.nama_kelas}</p>
        </div>
        <div className="flex gap-4 text-center">
           <div className="bg-green-50 p-3 rounded-lg min-w-[100px] border border-green-100">
              <span className="block text-green-600 text-xs font-bold uppercase mb-1">Benar</span>
              <span className="text-2xl font-black text-green-700">{totalBenar}</span>
           </div>
           <div className="bg-red-50 p-3 rounded-lg min-w-[100px] border border-red-100">
              <span className="block text-red-600 text-xs font-bold uppercase mb-1">Salah</span>
              <span className="text-2xl font-black text-red-700">{totalSalah}</span>
           </div>
           <div className="bg-blue-50 p-3 rounded-lg min-w-[120px] border border-blue-100">
              <span className="block text-blue-600 text-xs font-bold uppercase mb-1">Nilai Akhir</span>
              <span className="text-3xl font-black text-blue-700">{info.nilai_akhir}</span>
           </div>
        </div>
      </div>

      {/* Daftar Analisis Soal */}
      <h3 className="text-lg font-bold text-gray-700 mb-4">Rincian Jawaban ({jawaban.length} Soal)</h3>
      <div className="space-y-4">
        {jawaban.map((jwb, idx) => (
          <div key={idx} className={`p-5 rounded-lg border-l-4 shadow-sm bg-white ${jwb.is_benar ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded font-bold text-sm">No. {idx + 1}</span>
              {jwb.is_benar ? (
                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-xs">✔ BENAR (+{jwb.bobot_nilai} Poin)</span>
              ) : (
                <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-xs">✘ SALAH (0 Poin)</span>
              )}
            </div>
            
            <p className="text-gray-800 font-medium mb-4 whitespace-pre-wrap">{jwb.teks_soal}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs font-bold text-gray-500 mb-1">Jawaban Siswa ({jwb.opsi_dipilih || 'Kosong'}) :</span>
                <span className={jwb.is_benar ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
                   {jwb.opsi_jawaban[jwb.opsi_dipilih] || 'Tidak Menjawab'}
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <span className="block text-xs font-bold text-blue-500 mb-1">Kunci Jawaban ({jwb.kunci_jawaban}) :</span>
                <span className="text-blue-800 font-semibold">
                   {jwb.opsi_jawaban[jwb.kunci_jawaban]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuruAnalisisPage;