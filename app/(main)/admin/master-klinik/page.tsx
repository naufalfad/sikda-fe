'use client';

import { useEffect, useState } from 'react';
import { useKlinikStore } from '@/store/klinik.store';
import { Plus, Search, CheckCircle, XCircle, Stethoscope, Activity } from 'lucide-react';

export default function MasterKlinikPage() {
  const { polikliniks, layanans, isLoadingPoli, isLoadingLayanan, fetchPoliklinik, createPoliklinik, fetchLayananByPoli, createLayanan, syncLocationIHS } = useKlinikStore();
  
  const [selectedPoliId, setSelectedPoliId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isModalPoliOpen, setIsModalPoliOpen] = useState(false);
  const [isModalLayananOpen, setIsModalLayananOpen] = useState(false);

  // Form Poli
  const [formPoli, setFormPoli] = useState({ kodePoli: '', namaPoli: '', deskripsi: '' });
  
  // Form Layanan
  const [formLayanan, setFormLayanan] = useState({ kodeLayanan: '', namaLayanan: '', tarifDasar: 0, deskripsi: '' });

  useEffect(() => {
    fetchPoliklinik();
  }, [fetchPoliklinik]);

  useEffect(() => {
    if (selectedPoliId) {
      fetchLayananByPoli(selectedPoliId);
    }
  }, [selectedPoliId, fetchLayananByPoli]);

  const handlePoliSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPoliklinik({ ...formPoli, statusAktif: true });
    setIsModalPoliOpen(false);
    setFormPoli({ kodePoli: '', namaPoli: '', deskripsi: '' });
  };

  const handleLayananSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoliId) return;
    await createLayanan({ ...formLayanan, poliklinikId: selectedPoliId, statusAktif: true });
    setIsModalLayananOpen(false);
    setIsModalLayananOpen(false);
    setFormLayanan({ kodeLayanan: '', namaLayanan: '', tarifDasar: 0, deskripsi: '' });
  };

  const handleSyncLocation = async (e: React.MouseEvent, poliId: string) => {
    e.stopPropagation(); // prevent triggering the parent onClick
    setSyncingId(poliId);
    try {
      await syncLocationIHS(poliId);
      alert('Berhasil mendaftarkan lokasi Poliklinik ke SATUSEHAT!');
    } catch (error: any) {
      alert(error.message || 'Gagal sinkronisasi Lokasi IHS');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Master Layanan Klinik
          </h1>
          <p className="text-gray-500 mt-2">Kelola data poliklinik dan layanan tindakan medis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Poliklinik */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 col-span-1">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800">Daftar Poliklinik</h2>
            <button onClick={() => setIsModalPoliOpen(true)} className="p-1.5 bg-blue-600 text-white rounded-none hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {isLoadingPoli ? (
              <div className="p-4 text-center text-gray-500">Memuat...</div>
            ) : polikliniks.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Belum ada data poli.</div>
            ) : (
              polikliniks.map(poli => (
                <div 
                  key={poli.id} 
                  onClick={() => setSelectedPoliId(poli.id)}
                  className={`p-3 cursor-pointer border-l-4 transition-colors ${selectedPoliId === poli.id ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{poli.namaPoli}</div>
                      <div className="text-xs text-gray-500">Kode: {poli.kodePoli}</div>
                      {poli.faskes ? (
                        <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {poli.faskes.namaFaskes}
                        </div>
                      ) : (
                        <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                          Poli Bersama
                        </div>
                      )}
                      {poli.ihsLocationId ? (
                        <div className="mt-1 ml-1 inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
                          IHS: {poli.ihsLocationId}
                        </div>
                      ) : (
                        <div className="mt-1 ml-1 inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          Belum terdaftar di IHS
                        </div>
                      )}
                    </div>
                    {!poli.ihsLocationId && (
                      <button 
                        onClick={(e) => handleSyncLocation(e, poli.id)}
                        disabled={syncingId === poli.id}
                        className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-medium rounded-none border border-emerald-200 disabled:opacity-50 whitespace-nowrap"
                      >
                        {syncingId === poli.id ? 'Sync...' : 'Sync IHS'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Layanan */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 col-span-1 lg:col-span-2 flex flex-col">
          {selectedPoliId ? (
            <>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Layanan / Tindakan
                </h2>
                <button onClick={() => setIsModalLayananOpen(true)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-none hover:bg-green-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Tambah Layanan
                </button>
              </div>
              <div className="flex-1 p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="py-3 px-4 font-medium">Kode</th>
                      <th className="py-3 px-4 font-medium">Nama Layanan</th>
                      <th className="py-3 px-4 font-medium">Tarif Dasar</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLayanan ? (
                      <tr><td colSpan={4} className="p-4 text-center text-gray-500">Memuat layanan...</td></tr>
                    ) : layanans[selectedPoliId]?.length > 0 ? (
                      layanans[selectedPoliId].map(layanan => (
                        <tr key={layanan.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-mono text-gray-600">{layanan.kodeLayanan}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{layanan.namaLayanan}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">Rp {layanan.tarifDasar.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4">
                            {layanan.statusAktif ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-none font-medium">Aktif</span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-none font-medium">Nonaktif</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-500">Pilih poli atau tambahkan layanan baru.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <Stethoscope className="w-16 h-16 mb-4 text-gray-200" />
              <p>Pilih Poliklinik di sebelah kiri untuk melihat layanan</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Poli */}
      {isModalPoliOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-semibold text-gray-900">Tambah Poliklinik</h2>
              <button onClick={() => setIsModalPoliOpen(false)}><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handlePoliSubmit} className="p-4 space-y-4 text-slate-800">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Kode Poli *</label>
                <input required type="text" value={formPoli.kodePoli} onChange={e => setFormPoli({...formPoli, kodePoli: e.target.value})} placeholder="UMUM" className="w-full border p-2 rounded-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Nama Poli *</label>
                <input required type="text" value={formPoli.namaPoli} onChange={e => setFormPoli({...formPoli, namaPoli: e.target.value})} placeholder="Poli Umum" className="w-full border p-2 rounded-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 font-medium rounded-none hover:bg-blue-700">Simpan Poli</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Layanan */}
      {isModalLayananOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-semibold text-gray-900">Tambah Layanan</h2>
              <button onClick={() => setIsModalLayananOpen(false)}><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleLayananSubmit} className="p-4 space-y-4 text-slate-800">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Kode Layanan *</label>
                <input required type="text" value={formLayanan.kodeLayanan} onChange={e => setFormLayanan({...formLayanan, kodeLayanan: e.target.value})} placeholder="LYN-001" className="w-full border p-2 rounded-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Nama Layanan *</label>
                <input required type="text" value={formLayanan.namaLayanan} onChange={e => setFormLayanan({...formLayanan, namaLayanan: e.target.value})} placeholder="Konsultasi Dokter" className="w-full border p-2 rounded-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Tarif Dasar (Rp) *</label>
                <input required type="number" min="0" value={formLayanan.tarifDasar} onChange={e => setFormLayanan({...formLayanan, tarifDasar: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-2 font-medium rounded-none hover:bg-green-700">Simpan Layanan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
