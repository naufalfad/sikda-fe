'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Building2, 
  Printer, 
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { radiologiService } from '@/services/radiologi.service';
import FormEkspertiseModal from './components/FormEkspertiseModal';
import CatatHasilRujukanModal from './components/CatatHasilRujukanModal';
import CetakRadiologiModal from '@/components/kasir/CetakRadiologiModal';

export default function RadiologiDashboardPage() {
  const [activeTab, setActiveTab] = useState<'INTERNAL' | 'EKSTERNAL'>('EKSTERNAL');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [selectedOrderForInput, setSelectedOrderForInput] = useState<any | null>(null);
  const [selectedOrderForRujukan, setSelectedOrderForRujukan] = useState<any | null>(null);
  const [selectedOrderForCetak, setSelectedOrderForCetak] = useState<any | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await radiologiService.getOrders({
        tipe: activeTab,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      });
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch radiologi queue', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-purple-700" />
            Unit Pelayanan Radiologi & Rujukan Penunjang Medis
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pemisahan tegas antara Pemeriksaan Radiologi Internal Faskes dengan Surat Rujukan Penunjang Eksternal (RSUD/Balai).
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-none shadow-sm flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* DUA TAB UTAMA: INTERNAL vs EKSTERNAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-2 border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('INTERNAL');
            setFilterStatus('');
          }}
          className={`p-3.5 text-left border-2 transition-all flex items-start gap-3 rounded-none ${
            activeTab === 'INTERNAL'
              ? 'border-purple-700 bg-purple-50 text-purple-950 shadow-xs'
              : 'border-transparent hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className={`p-2 rounded-none ${activeTab === 'INTERNAL' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-tight">1. Antrean Radiologi Internal</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300">
                Alat Faskes Sendiri
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dikerjakan langsung oleh radiografer / dokter faskes ini (Rontgen Gigi, USG, dsb).
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('EKSTERNAL');
            setFilterStatus('');
          }}
          className={`p-3.5 text-left border-2 transition-all flex items-start gap-3 rounded-none ${
            activeTab === 'EKSTERNAL'
              ? 'border-sky-700 bg-sky-50 text-sky-950 shadow-xs'
              : 'border-transparent hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className={`p-2 rounded-none ${activeTab === 'EKSTERNAL' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-tight">2. Rujukan Radiologi Eksternal</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-100 text-sky-800 border border-sky-300">
                Dirujuk ke RSUD / Lab Luar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pemeriksaan dirujuk ke faskes lanjutan karena faskes tidak memiliki alat (Cetak surat & catat hasil RS).
            </p>
          </div>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama Pasien, No RM, atau No ACSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-none text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-none hover:bg-slate-900"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-slate-600 uppercase">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-900 rounded-none"
          >
            <option value="">Semua Status</option>
            {activeTab === 'INTERNAL' ? (
              <>
                <option value="REQUESTED">REQUESTED (Menunggu Foto)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Diproses)</option>
                <option value="COMPLETED">COMPLETED (Selesai & Ekspertise)</option>
              </>
            ) : (
              <>
                <option value="MENUNGGU_HASIL_RUJUKAN">MENUNGGU HASIL RUJUKAN RS</option>
                <option value="COMPLETED">COMPLETED (Hasil RS Diterima)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* NOTICE UNTUK TAB AKTIF */}
      {activeTab === 'INTERNAL' ? (
        <div className="bg-purple-50/70 border border-purple-200 p-4 flex items-start gap-3 text-xs text-purple-950">
          <AlertCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase">Unit Radiologi Mandiri Internal</span>
            <p className="text-purple-800 text-[11px] mt-0.5">
              Hanya menampilkan order rontgen/USG yang dikerjakan langsung oleh petugas faskes ini. Pemeriksaan yang dirujuk ke RSUD karena ketiadaan mesin rontgen <strong>tidak muncul di sini</strong> dan dikelola di tab <em>Rujukan Radiologi Eksternal</em>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-sky-50/70 border border-sky-200 p-4 flex items-start gap-3 text-xs text-sky-950">
          <Building2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase">Daftar Surat Rujukan Penunjang Radiologi ke RSUD / Labkesda</span>
            <p className="text-sky-800 text-[11px] mt-0.5">
              Pasien pada daftar ini dirujuk keluar faskes karena keterbatasan modalitas/alat. Pasien membawa <strong>Surat Pengantar Rujukan</strong> ke rumah sakit tujuan. Saat pasien kontrol membawa lembar fisik/CD rontgen, klik <strong>Catat / Unggah Hasil RS</strong> agar kesimpulan tercatat di RME.
            </p>
          </div>
        </div>
      )}

      {/* TABEL DATA */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`${activeTab === 'INTERNAL' ? 'bg-purple-900 text-white' : 'bg-sky-900 text-white'} font-extrabold uppercase tracking-wider`}>
                <th className="p-3.5">No. ACSN / Surat</th>
                <th className="p-3.5">Pasien & No. RM</th>
                <th className="p-3.5">Poli & Dokter Pengirim</th>
                <th className="p-3.5">Pemeriksaan Diminta (LOINC)</th>
                {activeTab === 'EKSTERNAL' && <th className="p-3.5">Rumah Sakit / Lab Tujuan</th>}
                <th className="p-3.5 text-center">Prioritas</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi / Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'EKSTERNAL' ? 8 : 7} className="p-8 text-center text-slate-500 font-bold">
                    Memuat data antrean radiologi...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-extrabold text-slate-900">{ord.acsn || ord.id}</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 block text-sm">{ord.pasien?.namaLengkap}</span>
                      <span className="font-mono text-[10px] text-slate-500">{ord.pasien?.noRM}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">
                        {ord.kunjungan?.poliklinik?.namaPoli || 'Poli Rawat Jalan'}
                      </span>
                      <span className="text-[11px] text-slate-500">{ord.dokter?.namaLengkap || 'Dokter Pengirim'}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 block">
                        {ord.details?.map((d: any) => d.namaPemeriksaan).join(', ') || 'Radiologi'}
                      </span>
                      {ord.catatanKlinis && (
                        <span className="text-[10px] text-amber-800 italic block mt-0.5">
                          Indikasi: {ord.catatanKlinis}
                        </span>
                      )}
                    </td>
                    {activeTab === 'EKSTERNAL' && (
                      <td className="p-3.5">
                        <span className="font-bold text-sky-900 block flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-sky-600" />
                          {ord.faskesTujuan || 'Instalasi Radiologi RSUD Terdekat'}
                        </span>
                        <span className="text-[10px] text-slate-500">Tarif Faskes: Rp 0 (Rujukan Luar)</span>
                      </td>
                    )}
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-none ${
                          ord.prioritas === 'stat' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {ord.prioritas}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black uppercase border ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : ord.status === 'MENUNGGU_HASIL_RUJUKAN'
                              ? 'bg-sky-100 text-sky-800 border-sky-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {ord.status === 'MENUNGGU_HASIL_RUJUKAN' ? 'Dirujuk ke RS' : ord.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {activeTab === 'INTERNAL' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForInput(ord)}
                          className={`px-3 py-1.5 font-extrabold text-xs rounded-none shadow-sm flex items-center gap-1 mx-auto transition-colors ${
                            ord.status === 'COMPLETED'
                              ? 'bg-slate-700 hover:bg-slate-800 text-white'
                              : 'bg-purple-700 hover:bg-purple-800 text-white'
                          }`}
                        >
                          {ord.status === 'COMPLETED' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Edit Hasil Internal
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" /> Input Ekspertise Internal
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForCetak(ord)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                            title="Cetak Surat Pengantar Rujukan Radiologi untuk Pasien"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cetak Surat
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForRujukan(ord)}
                            className={`px-2.5 py-1.5 font-bold text-xs flex items-center gap-1 transition-colors ${
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-sky-700 hover:bg-sky-800 text-white'
                            }`}
                            title={ord.status === 'COMPLETED' ? 'Lihat / Edit Hasil Rujukan RS' : 'Input Hasil Kertas / CD dari RS'}
                          >
                            {ord.status === 'COMPLETED' ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Hasil RS
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5" /> Catat Hasil RS
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'EKSTERNAL' ? 8 : 7} className="p-12 text-center text-slate-400 font-medium">
                    {activeTab === 'INTERNAL' ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">Tidak ada antrean pemeriksaan radiologi internal.</p>
                        <p className="text-xs text-slate-500">
                          Karena faskes ini merujuk pemeriksaan radiologi (Rontgen/CT-Scan) ke faskes lanjutan, seluruh order rujukan penunjang dapat dilihat pada tab <strong>Rujukan Radiologi Eksternal</strong>.
                        </p>
                      </div>
                    ) : (
                      <p>Tidak ada rujukan radiologi eksternal yang ditemukan.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT EKSPERTISE INTERNAL (Hanya untuk Internal) */}
      {selectedOrderForInput && (
        <FormEkspertiseModal
          order={selectedOrderForInput}
          onClose={() => setSelectedOrderForInput(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* MODAL CATAT HASIL RUJUKAN RS EKSTERNAL */}
      {selectedOrderForRujukan && (
        <CatatHasilRujukanModal
          order={selectedOrderForRujukan}
          onClose={() => setSelectedOrderForRujukan(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* MODAL CETAK SURAT PENGANTAR RUJUKAN */}
      {selectedOrderForCetak && (
        <CetakRadiologiModal
          isOpen={Boolean(selectedOrderForCetak)}
          onClose={() => setSelectedOrderForCetak(null)}
          orderRadiologiData={selectedOrderForCetak}
          pasienData={selectedOrderForCetak?.pasien}
        />
      )}
    </div>
  );
}
