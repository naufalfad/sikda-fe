'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  Building2, 
  User, 
  RefreshCw, 
  TestTubes, 
  Radio, 
  Activity,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useRujukanStore } from '@/store/rujukan.store';
import CetakLaboratoriumModal from '@/components/kasir/CetakLaboratoriumModal';
import CetakRadiologiModal from '@/components/kasir/CetakRadiologiModal';
import CetakPengantarPenunjangModal from '@/components/penunjang/CetakPengantarPenunjangModal';

export default function AntrianRujukanPage() {
  const { 
    antrianList, 
    antrianPenunjangList,
    isLoading, 
    isLoadingPenunjang,
    fetchAntrian, 
    fetchAntrianPenunjang 
  } = useRujukanStore();

  const [activeTab, setActiveTab] = useState<'RUJUKAN_RS' | 'RUJUKAN_PENUNJANG'>('RUJUKAN_RS');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPenunjangType, setFilterPenunjangType] = useState<'ALL' | 'LABORATORIUM' | 'RADIOLOGI'>('ALL');

  // Modal State untuk Cetak Penunjang
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [selectedLabOrder, setSelectedLabOrder] = useState<any>(null);

  const [isRadModalOpen, setIsRadModalOpen] = useState(false);
  const [selectedRadOrder, setSelectedRadOrder] = useState<any>(null);
  const [isPenunjangModalOpen, setIsPenunjangModalOpen] = useState(false);
  const [selectedPenunjangItem, setSelectedPenunjangItem] = useState<any>(null);

  useEffect(() => {
    fetchAntrian();
    fetchAntrianPenunjang();
  }, [fetchAntrian, fetchAntrianPenunjang]);

  const handleRefreshAll = () => {
    fetchAntrian();
    fetchAntrianPenunjang();
  };

  // Filter Tab 1: Rujukan Pasien ke RS
  const filteredAntrianRS = antrianList.filter((item) => {
    const term = searchTerm.toLowerCase();
    const namaPasien = item.pasien?.namaLengkap?.toLowerCase() || '';
    const noRM = item.pasien?.noRM?.toLowerCase() || '';
    const faskes = item.faskesTujuan?.toLowerCase() || '';
    const poli = item.poliTujuan?.toLowerCase() || '';
    return namaPasien.includes(term) || noRM.includes(term) || faskes.includes(term) || poli.includes(term);
  });

  // Filter Tab 2: Rujukan Penunjang (Lab & Radiologi)
  const filteredAntrianPenunjang = antrianPenunjangList.filter((item) => {
    const matchType = filterPenunjangType === 'ALL' || item.jenisPenunjang === filterPenunjangType;
    const term = searchTerm.toLowerCase();
    const namaPasien = item.pasien?.namaLengkap?.toLowerCase() || '';
    const noRM = item.pasien?.noRM?.toLowerCase() || '';
    const noReg = item.nomorRegistrasi?.toLowerCase() || '';
    const tindakan = item.summaryTindakan?.toLowerCase() || '';
    const matchSearch = namaPasien.includes(term) || noRM.includes(term) || noReg.includes(term) || tindakan.includes(term);
    return matchType && matchSearch;
  });

  const handleOpenPrintPenunjang = (item: any) => {
    if (item.jenisPenunjang === 'LABORATORIUM') {
      setSelectedLabOrder(item.rawOrder || item);
      setIsLabModalOpen(true);
    } else {
      setSelectedRadOrder(item.rawOrder || item);
      setIsRadModalOpen(true);
    }

  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-none shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-600" />
            Antrean Rujukan Keluar &amp; Penunjang Luar
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pusat cetak surat rujukan pasien ke Rumah Sakit dan pengantar pemeriksaan penunjang (Laboratorium Luar &amp; Radiologi) di Loket Administrasi.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isLoading || isLoadingPenunjang}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-none flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingPenunjang) ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('RUJUKAN_RS'); setSearchTerm(''); }}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'RUJUKAN_RS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Rujukan Pasien (RS / FKRTL)</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-bold">
            {antrianList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('RUJUKAN_PENUNJANG'); setSearchTerm(''); }}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'RUJUKAN_PENUNJANG'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Rujukan Penunjang (Lab Luar &amp; Radiologi)</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {antrianPenunjangList.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: RUJUKAN PASIEN KE RUMAH SAKIT (FKRTL) ─── */}
      {activeTab === 'RUJUKAN_RS' && (
        <div className="space-y-6">
          {/* Filter & Search */}
          <div className="bg-white p-4 rounded-none shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari pasien, no. RM, faskes tujuan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total Rujukan RS: <strong className="text-slate-900">{filteredAntrianRS.length}</strong> Pasien
            </div>
          </div>

          {/* Tabel Antrean Rujukan RS */}
          <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Tgl Rujukan</th>
                    <th className="py-3 px-4">Pasien</th>
                    <th className="py-3 px-4">Dokter Perujuk</th>
                    <th className="py-3 px-4">Poli Asal</th>
                    <th className="py-3 px-4">Faskes &amp; Poli Tujuan</th>
                    <th className="py-3 px-4 text-center">Status Kasir</th>
                    <th className="py-3 px-4 text-center">Status SATUSEHAT</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Memuat antrean rujukan rumah sakit...
                      </td>
                    </tr>
                  ) : filteredAntrianRS.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Belum ada antrean rujukan keluar rumah sakit.
                      </td>
                    </tr>
                  ) : (
                    filteredAntrianRS.map((item) => {
                      const tglStr = new Date(item.tanggalRujukan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      const isLunas = item.isLunas || item.statusPembayaran === 'LUNAS' || item.kunjungan?.statusKunjungan === 'SELESAI';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {tglStr}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.pasien?.namaLengkap}</div>
                            <div className="text-xs text-slate-500 font-mono">RM: {item.pasien?.noRM}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {item.dokter?.namaLengkap}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-none">
                              {item.kunjungan?.poliklinik?.namaPoli || 'Poli Umum'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              {item.faskesTujuan}
                            </div>
                            <div className="text-xs text-slate-500">Poli: {item.poliTujuan}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-none">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                LUNAS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 rounded-none" title="Pasien harus melunasi tagihan Kasir sebelum surat rujukan dapat dicetak">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                BELUM BAYAR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.satusehatId ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Terintegrasi
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 mt-0.5">ID: {item.satusehatId.substring(0, 8)}...</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending Sync
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLunas ? (
                              <Link
                                href={`/administrasi/antrian-rujukan/cetak?kunjunganId=${item.kunjunganId}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 rounded-none transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak Surat
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed rounded-none"
                                title="Lunasi tagihan di Kasir untuk mencetak surat rujukan"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak Surat
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: RUJUKAN PENUNJANG (LABORATORIUM & RADIOLOGI) ─── */}
      {activeTab === 'RUJUKAN_PENUNJANG' && (
        <div className="space-y-6">
          
          {/* Banner Info Alur */}
          <div className="p-4 bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
            <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">
                Pusat Cetak Berkas Rujukan Penunjang Diagnostik Eksternal
              </p>
              <p className="text-slate-600 mt-0.5">
                Dokumen ini merupakan surat pengantar resmi yang dibuat dokter untuk pemeriksaan spesimen laboratorium rujukan luar (Labkesda/RS) atau pemeriksaan radiologi (Rontgen, USG). Pasien membawa surat ini ke faskes rujukan untuk diperiksa dan mengembalikan hasilnya ke dokter poli.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-none shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari pasien, no. RM, no. reg/ACSN, tindakan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-none text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Jenis:
              </span>
              <button
                type="button"
                onClick={() => setFilterPenunjangType('ALL')}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  filterPenunjangType === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({antrianPenunjangList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPenunjangType('LABORATORIUM')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  filterPenunjangType === 'LABORATORIUM'
                    ? 'bg-sky-700 text-white'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                <TestTubes className="w-3.5 h-3.5" />
                Lab Eksternal ({antrianPenunjangList.filter(i => i.jenisPenunjang === 'LABORATORIUM').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPenunjangType('RADIOLOGI')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  filterPenunjangType === 'RADIOLOGI'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Radiologi ({antrianPenunjangList.filter(i => i.jenisPenunjang === 'RADIOLOGI').length})
              </button>
            </div>
          </div>

          {/* Tabel Antrean Penunjang */}
          <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Tgl &amp; No. Registrasi</th>
                    <th className="py-3 px-4">Pasien</th>
                    <th className="py-3 px-4">Jenis Penunjang</th>
                    <th className="py-3 px-4">Dokter &amp; Poli Asal</th>
                    <th className="py-3 px-4">Pemeriksaan yang Diminta</th>
                    <th className="py-3 px-4 text-center">Status Kasir</th>
                    <th className="py-3 px-4 text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {isLoadingPenunjang ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Memuat data order rujukan penunjang...
                      </td>
                    </tr>
                  ) : filteredAntrianPenunjang.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada antrean order rujukan penunjang (laboratorium/radiologi).
                      </td>
                    </tr>
                  ) : (
                    filteredAntrianPenunjang.map((item) => {
                      const tglStr = new Date(item.tanggalOrder).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      const isLab = item.jenisPenunjang === 'LABORATORIUM';
                      const isLunas = item.isLunas;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {tglStr}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">
                              {item.nomorRegistrasi}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.pasien?.namaLengkap}</div>
                            <div className="text-xs text-slate-500 font-mono">RM: {item.pasien?.noRM}</div>
                          </td>
                          <td className="py-3 px-4">
                            {isLab ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-none">
                                <TestTubes className="w-3.5 h-3.5 text-sky-600" />
                                Laboratorium Luar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-none">
                                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                                Radiologi Eksternal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {item.dokter?.namaLengkap || '-'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.poliAsal}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-xs font-semibold text-slate-900 truncate" title={item.summaryTindakan}>
                              {item.summaryTindakan}
                            </div>
                            {item.catatanKlinis && (
                              <div className="text-[11px] text-slate-500 italic truncate mt-0.5" title={item.catatanKlinis}>
                                &ldquo;{item.catatanKlinis}&rdquo;
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-none">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                LUNAS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 rounded-none" title="Pasien harus menyelesaikan administrasi kasir">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                BELUM BAYAR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPrintPenunjang(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors rounded-none"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-200" />
                              <span>Cetak {isLab ? 'Rujukan Lab' : 'Radiologi'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── MODAL CETAK RUJUKAN LABORATORIUM SPESIMEN ─── */}
      {selectedLabOrder && (
        <CetakLaboratoriumModal
          isOpen={isLabModalOpen}
          onClose={() => setIsLabModalOpen(false)}
          orderLabData={selectedLabOrder}
          pasienData={selectedLabOrder?.pasien}
        />
      )}

      {/* ─── MODAL CETAK RADIOLOGI & ACSN LOINC ─── */}
      {selectedRadOrder && (
        <CetakRadiologiModal
          isOpen={isRadModalOpen}
          onClose={() => setIsRadModalOpen(false)}
          orderRadiologiData={selectedRadOrder}
          pasienData={selectedRadOrder?.pasien}
        />
      )}

      {/* ─── MODAL CETAK SURAT PENGANTAR PENUNJANG (LAB & RADIOLOGI) ─── */}
      {isPenunjangModalOpen && selectedPenunjangItem && (
        <CetakPengantarPenunjangModal
          isOpen={isPenunjangModalOpen}
          onClose={() => {
            setIsPenunjangModalOpen(false);
            setSelectedPenunjangItem(null);
          }}
          kunjunganData={selectedPenunjangItem.kunjungan || selectedPenunjangItem.rawOrder?.kunjungan || selectedPenunjangItem}
          orderLabData={selectedPenunjangItem.jenisPenunjang === 'LABORATORIUM' ? (selectedPenunjangItem.rawOrder || selectedPenunjangItem) : undefined}
          orderRadiologiData={selectedPenunjangItem.jenisPenunjang === 'RADIOLOGI' ? (selectedPenunjangItem.rawOrder || selectedPenunjangItem) : undefined}
          defaultTab={selectedPenunjangItem.jenisPenunjang === 'LABORATORIUM' ? 'LAB' : 'RADIOLOGI'}
        />
      )}

    </div>
  );
}
