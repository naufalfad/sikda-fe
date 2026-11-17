'use client';

import { useEffect, useState } from 'react';
import { useKlinikStore } from '@/store/klinik.store';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  X,
  Stethoscope,
  Activity,
  Building,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MasterKlinikPage() {
  const {
    polikliniks,
    layanans,
    isLoadingPoli,
    isLoadingLayanan,
    fetchPoliklinik,
    createPoliklinik,
    fetchLayananByPoli,
    createLayanan,
    syncLocationIHS
  } = useKlinikStore();
  
  const [selectedPoliId, setSelectedPoliId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isModalPoliOpen, setIsModalPoliOpen] = useState(false);
  const [isModalLayananOpen, setIsModalLayananOpen] = useState(false);
  const [isSubmittingPoli, setIsSubmittingPoli] = useState(false);
  const [isSubmittingLayanan, setIsSubmittingLayanan] = useState(false);

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
    setIsSubmittingPoli(true);
    try {
      await createPoliklinik({ ...formPoli, statusAktif: true });
      Swal.fire({
        icon: 'success',
        title: 'Poliklinik Ditambahkan',
        text: `Poli ${formPoli.namaPoli} (${formPoli.kodePoli}) berhasil didaftarkan.`,
        timer: 1600,
        showConfirmButton: false,
      });
      setIsModalPoliOpen(false);
      setFormPoli({ kodePoli: '', namaPoli: '', deskripsi: '' });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Gagal menyimpan poliklinik', 'error');
    } finally {
      setIsSubmittingPoli(false);
    }
  };

  const handleLayananSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoliId) return;
    setIsSubmittingLayanan(true);
    try {
      await createLayanan({ ...formLayanan, poliklinikId: selectedPoliId, statusAktif: true });
      Swal.fire({
        icon: 'success',
        title: 'Layanan Ditambahkan',
        text: `Layanan ${formLayanan.namaLayanan} berhasil disimpan.`,
        timer: 1600,
        showConfirmButton: false,
      });
      setIsModalLayananOpen(false);
      setFormLayanan({ kodeLayanan: '', namaLayanan: '', tarifDasar: 0, deskripsi: '' });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Gagal menyimpan layanan', 'error');
    } finally {
      setIsSubmittingLayanan(false);
    }
  };

  const handleSyncLocation = async (e: React.MouseEvent, poliId: string) => {
    e.stopPropagation();
    setSyncingId(poliId);
    try {
      await syncLocationIHS(poliId);
      Swal.fire({
        icon: 'success',
        title: 'Tersinkronisasi',
        text: 'Lokasi Poliklinik berhasil didaftarkan ke SATUSEHAT Kemenkes RI.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire('Error Sinkronisasi', error.message || 'Gagal sinkronisasi Lokasi IHS', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const selectedPoli = polikliniks.find(p => p.id === selectedPoliId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Stethoscope className="w-6 h-6" />
              </div>
              Master Layanan & Poliklinik
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola unit poliklinik faskes, integrasi Location IHS SATUSEHAT, dan tarif layanan tindakan medis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalPoliOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Poliklinik</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: POLIKLINIK & LAYANAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Poliklinik */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 col-span-1 overflow-hidden flex flex-col">
          <div className="p-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
            <div>
              <h2 className="font-bold text-slate-800">Daftar Poliklinik</h2>
              <p className="text-xs text-slate-500">{polikliniks.length} unit terdaftar</p>
            </div>
            <button
              onClick={() => setIsModalPoliOpen(true)}
              className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition border border-blue-200"
              title="Tambah Poliklinik"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-2 flex-1 max-h-[640px] overflow-y-auto">
            {isLoadingPoli ? (
              <div className="p-6 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                Memuat poliklinik...
              </div>
            ) : polikliniks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Belum ada poliklinik terdaftar.</div>
            ) : (
              polikliniks.map(poli => {
                const isSelected = selectedPoliId === poli.id;

                return (
                  <div 
                    key={poli.id} 
                    onClick={() => setSelectedPoliId(poli.id)}
                    className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{poli.namaPoli}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">Kode: {poli.kodePoli}</div>
                        
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {poli.ihsLocationId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>IHS: {poli.ihsLocationId}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Belum Sync IHS
                            </span>
                          )}
                        </div>
                      </div>

                      {!poli.ihsLocationId && (
                        <button 
                          onClick={(e) => handleSyncLocation(e, poli.id)}
                          disabled={syncingId === poli.id}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg shadow-2xs disabled:opacity-50 whitespace-nowrap transition"
                        >
                          {syncingId === poli.id ? 'Sync...' : 'Sync IHS'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Layanan & Tarif Tindakan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
          {selectedPoliId ? (
            <>
              <div className="p-4.5 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50/80 gap-3">
                <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <span>Layanan & Tindakan &bull; {selectedPoli?.namaPoli}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar tindakan medis dan tarif dasar poliklinik</p>
                </div>
                
                <button
                  onClick={() => setIsModalLayananOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Layanan</span>
                </button>
              </div>

              <div className="flex-1 p-0 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100/70 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Kode Layanan</th>
                      <th className="py-3 px-5">Nama Tindakan</th>
                      <th className="py-3 px-5">Tarif Dasar</th>
                      <th className="py-3 px-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingLayanan ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                          Memuat layanan poli...
                        </td>
                      </tr>
                    ) : layanans[selectedPoliId]?.length > 0 ? (
                      layanans[selectedPoliId].map(layanan => (
                        <tr key={layanan.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-700 font-semibold">
                            {layanan.kodeLayanan}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {layanan.namaLayanan}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-slate-700">
                            Rp {layanan.tarifDasar.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            {layanan.statusAktif ? (
                              <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                                Aktif
                              </span>
                            ) : (
                              <span className="text-[11px] bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                                Nonaktif
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400">
                          Belum ada tindakan medis yang didaftarkan untuk poli ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 space-y-3">
              <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                <Stethoscope className="w-12 h-12" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Pilih poliklinik di sebelah kiri untuk mengelola daftar layanan dan tarif.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH POLIKLINIK BARU                                           */}
      {/* ========================================================================= */}
      {isModalPoliOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Poliklinik Baru</h3>
                  <p className="text-xs text-slate-500">Daftarkan unit poli baru di puskesmas.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalPoliOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePoliSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Poliklinik <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formPoli.kodePoli}
                  onChange={e => setFormPoli({ ...formPoli, kodePoli: e.target.value.toUpperCase() })}
                  placeholder="Contoh: UMUM, GIGI, KIA"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Poliklinik <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formPoli.namaPoli}
                  onChange={e => setFormPoli({ ...formPoli, namaPoli: e.target.value })}
                  placeholder="Contoh: Poli Gigi & Mulut"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formPoli.deskripsi}
                  onChange={e => setFormPoli({ ...formPoli, deskripsi: e.target.value })}
                  placeholder="Keterangan unit layanan..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalPoliOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoli}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingPoli && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Simpan Poliklinik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH LAYANAN MEDIS                                             */}
      {/* ========================================================================= */}
      {isModalLayananOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Layanan Medis</h3>
                  <p className="text-xs text-slate-500">Unit: {selectedPoli?.namaPoli}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalLayananOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLayananSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Layanan / Tindakan <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formLayanan.kodeLayanan}
                  onChange={e => setFormLayanan({ ...formLayanan, kodeLayanan: e.target.value.toUpperCase() })}
                  placeholder="Contoh: LYN-GIGI-001"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Layanan / Tindakan <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formLayanan.namaLayanan}
                  onChange={e => setFormLayanan({ ...formLayanan, namaLayanan: e.target.value })}
                  placeholder="Contoh: Pembersihan Karang Gigi (Scaling)"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarif Dasar Pelayanan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formLayanan.tarifDasar}
                    onChange={e => setFormLayanan({ ...formLayanan, tarifDasar: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalLayananOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLayanan}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingLayanan && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Simpan Layanan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
