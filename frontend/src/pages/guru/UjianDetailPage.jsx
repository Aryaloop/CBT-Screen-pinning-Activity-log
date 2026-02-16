import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';

const UjianDetailPage = () => {
  const { id } = useParams(); // ID Ujian
  const navigate = useNavigate();
  
  const [ujian, setUjian] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [tipeSoal, setTipeSoal] = useState('pilihan_ganda'); // Default
  const [pertanyaan, setPertanyaan] = useState('');
  const [bobot, setBobot] = useState(1); // Default Bobot 1
  
  // State Pilihan Ganda
  const [opsiA, setOpsiA] = useState('');
  const [opsiB, setOpsiB] = useState('');
  const [opsiC, setOpsiC] = useState('');
  const [opsiD, setOpsiD] = useState('');
  const [opsiE, setOpsiE] = useState('');
  const [kunci, setKunci] = useState('A');

  // Load Data
  const fetchData = async () => {
    try {
      const { data } = await api.get(`/guru/ujian/${id}`);
      setUjian(data.ujian);
      setSoalList(data.soal || []);
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat detail ujian', 'error');
      navigate('/guru/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmitSoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_ujian: id,
        tipe_soal: tipeSoal,
        pertanyaan,
        bobot_nilai: parseInt(bobot), // Kirim Bobot ke Backend
        jawaban_benar: kunci,
        // Opsi (Hanya dikirim jika Pilihan Ganda)
        opsi_a: tipeSoal === 'pilihan_ganda' ? opsiA : '',
        opsi_b: tipeSoal === 'pilihan_ganda' ? opsiB : '',
        opsi_c: tipeSoal === 'pilihan_ganda' ? opsiC : '',
        opsi_d: tipeSoal === 'pilihan_ganda' ? opsiD : '',
        opsi_e: tipeSoal === 'pilihan_ganda' ? opsiE : '',
      };

      await api.post('/guru/ujian/soal', payload);
      
      Swal.fire({
        icon: 'success', title: 'Tersimpan', text: 'Soal berhasil ditambahkan',
        timer: 1000, showConfirmButton: false
      });
      
      // Reset Form
      setPertanyaan(''); setBobot(1);
      setOpsiA(''); setOpsiB(''); setOpsiC(''); setOpsiD(''); setOpsiE('');
      fetchData(); 
      
    } catch (err) {
      Swal.fire('Gagal', 'Gagal menyimpan soal', 'error');
    }
  };

  const handleHapusSoal = async (idSoal) => {
    try {
      await api.delete(`/guru/ujian/soal/${idSoal}`);
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Gagal hapus soal', 'error');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !ujian.apakah_aktif;
      await api.patch(`/guru/ujian/${id}/status`, { apakah_aktif: newStatus });
      Swal.fire('Sukses', `Ujian berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      fetchData(); // Refresh halaman agar status berubah
    } catch (err) {
      Swal.fire('Error', 'Gagal merubah status ujian', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto pb-10">
{/* Header Ujian */}
      <div className="bg-white p-6 rounded-lg shadow mb-8 border-l-4 border-blue-600 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">{ujian?.judul}</h1>
            <p className="text-gray-500 mt-1">
            Token: <span className="font-mono font-bold text-black bg-yellow-200 px-2 rounded">{ujian?.kode_token}</span> 
            {' • '} {ujian?.durasi_menit} Menit
            {' • '} Status: <span className={ujian?.apakah_aktif ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                {ujian?.apakah_aktif ? "AKTIF" : "TIDAK AKTIF"}
            </span>
            </p>
        </div>
        
        {/* Tombol Aktifkan Ujian */}
        <button 
            onClick={handleToggleStatus}
            className={`px-4 py-2 font-bold rounded text-white shadow transition ${ujian?.apakah_aktif ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
            {ujian?.apakah_aktif ? 'Matikan Ujian' : 'Aktifkan Ujian'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Input Soal (Kiri) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Tambah Soal</h3>
            <form onSubmit={handleSubmitSoal} className="space-y-3">
              
              {/* Pilihan Tipe Soal */}
              <div>
                <label className="text-sm font-semibold text-gray-600">Tipe Soal</label>
                <select 
                  value={tipeSoal} onChange={(e) => setTipeSoal(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="pilihan_ganda">Pilihan Ganda</option>
                  <option value="essay">Essay / Uraian</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Pertanyaan</label>
                <textarea 
                  value={pertanyaan} onChange={e => setPertanyaan(e.target.value)}
                  className="w-full border rounded p-2 h-24 focus:ring-2 focus:ring-blue-500"
                  placeholder="Tulis pertanyaan..." required
                />
              </div>

              {/* Input Bobot Nilai */}
              <div>
                <label className="text-sm font-semibold text-gray-600">Bobot Nilai (Poin)</label>
                <input 
                  type="number" min="1"
                  value={bobot} onChange={e => setBobot(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Contoh: 1, 5, 10" required
                />
              </div>
              
              {/* Opsi Jawaban (Hanya Muncul Jika Pilihan Ganda) */}
              {tipeSoal === 'pilihan_ganda' && (
                <>
                  {['A','B','C','D','E'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <span className="font-bold text-gray-500 w-6">{opt}.</span>
                      <input 
                        type="text" 
                        className="flex-1 border rounded p-1.5 text-sm"
                        placeholder={`Opsi ${opt}`}
                        value={opt === 'A' ? opsiA : opt === 'B' ? opsiB : opt === 'C' ? opsiC : opt === 'D' ? opsiD : opsiE}
                        onChange={e => {
                            const val = e.target.value;
                            if(opt==='A') setOpsiA(val);
                            if(opt==='B') setOpsiB(val);
                            if(opt==='C') setOpsiC(val);
                            if(opt==='D') setOpsiD(val);
                            if(opt==='E') setOpsiE(val);
                        }}
                        required
                      />
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-600">Kunci Jawaban</label>
                    <select 
                      value={kunci} onChange={e => setKunci(e.target.value)}
                      className="w-full border rounded p-2 mt-1 bg-green-50 border-green-300"
                    >
                      {['A','B','C','D','E'].map(k => <option key={k} value={k}>Opsi {k}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Jika Essay, Kunci Jawaban adalah teks referensi */}
              {tipeSoal === 'essay' && (
                <div>
                   <label className="text-sm font-semibold text-gray-600">Kunci Jawaban (Referensi Guru)</label>
                   <textarea 
                      value={kunci} onChange={e => setKunci(e.target.value)}
                      className="w-full border rounded p-2 h-20 bg-green-50"
                      placeholder="Jawaban singkat yang benar..."
                   />
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded mt-4 hover:bg-blue-700 transition">
                Simpan Soal
              </button>
            </form>
          </div>
        </div>

        {/* List Soal (Kanan) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-700">Daftar Soal ({soalList.length})</h3>
          
          {soalList.map((soal, index) => (
            <div key={soal.id_soal} className="bg-white p-4 rounded shadow border border-gray-100 relative group">
              <div className="flex justify-between">
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-bold text-sm">
                  No. {index + 1}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                  {soal.tipe_soal === 'pilihan_ganda' ? 'PG' : 'ESSAY'} • {soal.bobot_nilai} Poin
                </span>
              </div>

              <div className="mt-3">
                <p className="font-medium text-gray-800 mb-3 whitespace-pre-wrap">{soal.pertanyaan}</p>
                
                {soal.tipe_soal === 'pilihan_ganda' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className={soal.jawaban_benar === 'A' ? 'text-green-600 font-bold' : ''}>A. {soal.opsi_a}</div>
                    <div className={soal.jawaban_benar === 'B' ? 'text-green-600 font-bold' : ''}>B. {soal.opsi_b}</div>
                    <div className={soal.jawaban_benar === 'C' ? 'text-green-600 font-bold' : ''}>C. {soal.opsi_c}</div>
                    <div className={soal.jawaban_benar === 'D' ? 'text-green-600 font-bold' : ''}>D. {soal.opsi_d}</div>
                    <div className={soal.jawaban_benar === 'E' ? 'text-green-600 font-bold' : ''}>E. {soal.opsi_e}</div>
                  </div>
                ) : (
                  <div className="text-sm bg-gray-50 p-2 rounded border">
                    <span className="font-bold text-gray-500">Kunci Jawaban:</span> {soal.jawaban_benar}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end border-t pt-3">
                <button 
                  onClick={() => handleHapusSoal(soal.id_soal)}
                  className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  title="Hapus Soal"
                >
                  <span>Hapus Soal</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default UjianDetailPage;