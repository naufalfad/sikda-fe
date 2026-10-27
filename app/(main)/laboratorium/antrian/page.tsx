'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLaboratoriumStore } from '@/store/laboratorium.store';
import { 
  Users, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  TestTubes, 
  ClipboardList,
  AlertTriangle,
  Save,
  Printer,
  FileText,
  Building2,
  ExternalLink,
  Search,
  Filter,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import { isInternalLabTest } from '@/app/(main)/dokter/rawat-jalan/rawatJalan.constants';
import SuratRujukanSpesimenModal from '@/components/laboratorium/SuratRujukanSpesimenModal';
import LabResultModal from '@/app/(main)/dokter/rawat-jalan/components/LabResultModal';

export default function LaboratoriumDashboard() {
  const { antrian, isLoadingAntrian, selectedOrder, fetchAntrian, pilihOrder, clearSelection, simpanHasil } = useLaboratoriumStore();
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [hasilData, setHasilData] = useState<Record<string, { hasil: string, satuan: string, nilaiRujukan: string, kritis: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Search states
  const [filterType, setFilterType] = useState<'SEMUA' | 'INTERNAL' | 'RUJUKAN'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSuratRujukanOpen, setIsSuratRujukanOpen] = useState(false);
  const [isPratinjauHasilOpen, setIsPratinjauHasilOpen] = useState(false);

  useEffect(() => {
    fetchAntrian();
  }, [fetchAntrian]);

  // Sync state dengan selectedOrder
  useEffect(() => {
    if (selectedOrder) {
      const initialData: any = {};
      selectedOrder.details.forEach((d: any) => {
        initialData[d.id] = {
          hasil: d.hasil || '',
          satuan: d.satuan || '',
          nilaiRujukan: d.nilaiRujukan || '',
          kritis: d.kritis || false
        };
      });
      setHasilData(initialData);
    } else {
      setHasilData({});
    }
  }, [selectedOrder]);

  // Klasifikasi order: apakah ada tes rujukan atau seluruhnya internal
  const getOrderClassification = (order: any) => {
    const details = order.details || [];
    if (details.length === 0) return { type: 'INTERNAL', label: 'Internal', color: 'emerald' };
    const hasExternal = details.some((d: any) => !isInternalLabTest(d.parameter));
    const hasInternal = details.some((d: any) => isInternalLabTest(d.parameter));

    if (hasExternal && hasInternal) {
      return { type: 'CAMPURAN', label: 'Internal + Rujukan', color: 'indigo' };
    }
    if (hasExternal) {
      return { type: 'RUJUKAN', label: 'Rujukan Luar', color: 'sky' };
    }
    return { type: 'INTERNAL', label: 'Internal Faskes', color: 'emerald' };
  };

  // Filtered antrian list
  const filteredAntrian = useMemo(() => {
    return antrian.filter((order) => {
      // 1. Tipe Filter
      if (filterType === 'INTERNAL') {
        const details = order.details || [];
        const hasExternal = details.some((d: any) => !isInternalLabTest(d.parameter));
        if (hasExternal) return false;
      } else if (filterType === 'RUJUKAN') {
        const details = order.details || [];
        const hasExternal = details.some((d: any) => !isInternalLabTest(d.parameter));
        if (!hasExternal) return false;
      }

      // 2. Query Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = order.pasien?.namaLengkap?.toLowerCase() || '';
        const noRM = order.pasien?.noRM?.toLowerCase() || '';
        const dokter = order.dokter?.namaLengkap?.toLowerCase() || '';
        return nama.includes(q) || noRM.includes(q) || dokter.includes(q);
      }

      return true;
    });
  }, [antrian, filterType, searchQuery]);

  // Metrics count
  const countInternalOnly = useMemo(() => {
    return antrian.filter(o => (o.details || []).every((d: any) => isInternalLabTest(d.parameter))).length;
  }, [antrian]);

  const countHasExternal = useMemo(() => {
    return antrian.filter(o => (o.details || []).some((d: any) => !isInternalLabTest(d.parameter))).length;
  }, [antrian]);

  const handleKirimHasil = async () => {
    if (!selectedOrder) return;
    
    setIsSaving(true);
    
    // Format payload
    const details = Object.entries(hasilData).map(([id, data]) => ({
      id,
      ...data
    }));

    const res = await simpanHasil(selectedOrder.id, details);
    
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Hasil Lab Berhasil Disimpan & Dikirim!',
        text: 'Hasil otomatis terintegrasi ke Rekam Medis Elektronik (RME) pasien dan dapat langsung ditinjau oleh dokter poli.',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Hasil',
        text: res.message || 'Terjadi kesalahan sistem saat menyimpan hasil.',
      });
    }
    
    setIsSaving(false);
  };

  // Selected Order Analysis
  const selectedClassification = selectedOrder ? getOrderClassification(selectedOrder) : null;
  const selectedExternalTests = selectedOrder 
    ? (selectedOrder.details || []).filter((d: any) => !isInternalLabTest(d.parameter)) 
    : [];
  const selectedInternalTests = selectedOrder 
    ? (selectedOrder.details || []).filter((d: any) => isInternalLabTest(d.parameter)) 
    : [];

  // Order with updated results for preview
  const previewOrderData = useMemo(() => {
    if (!selectedOrder) return null;
    return {
      ...selectedOrder,
      details: selectedOrder.details.map((d: any) => ({
        ...d,
        hasil: hasilData[d.id]?.hasil || d.hasil || '',
        satuan: hasilData[d.id]?.satuan || d.satuan || '',
        nilaiRujukan: hasilData[d.id]?.nilaiRujukan || d.nilaiRujukan || '',
        kritis: hasilData[d.id]?.kritis || d.kritis || false,
      }))
    };
  }, [selectedOrder, hasilData]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR ANTREAN */}
      <div 
        style={{ width: sidebarWidth }} 
        className="flex flex-col bg-white border-r border-gray-200 shadow-sm relative flex-shrink-0 z-20"
      >
        {/* Resizer */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 hover:bg-indigo-300 cursor-col-resize z-30 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            
            const doDrag = (dragEvent: MouseEvent) => {
              let newWidth = startWidth + (dragEvent.clientX - startX);
              if (newWidth > 550) newWidth = 550; 
              if (newWidth < 280) newWidth = 280; 
              setSidebarWidth(newWidth);
            };
            
            const stopDrag = () => {
              document.removeEventListener('mousemove', doDrag);
              document.removeEventListener('mouseup', stopDrag);
            };
            
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
          }}
        />

        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-200 bg-indigo-50/50">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-indigo-900 flex items-center">
              <TestTubes className="w-5 h-5 mr-2 text-indigo-600" />
              Antrean Laboratorium
            </h2>
            <button 
              onClick={() => fetchAntrian()} 
              className="p-1 hover:bg-indigo-100 rounded-none transition-colors" 
              title="Perbarui Antrean"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${isLoadingAntrian ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search box */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pasien / no. RM..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 text-xs focus:ring-1 focus:ring-indigo-500 rounded-none placeholder-gray-400"
            />
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 grid grid-cols-3 gap-1 bg-indigo-100/70 p-0.5 border border-indigo-200">
            <button
              onClick={() => setFilterType('SEMUA')}
              className={`py-1 text-[11px] font-bold transition-all text-center ${
                filterType === 'SEMUA' 
                  ? 'bg-white text-indigo-900 shadow-xs' 
                  : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              Semua ({antrian.length})
            </button>
            <button
              onClick={() => setFilterType('INTERNAL')}
              className={`py-1 text-[11px] font-bold transition-all text-center ${
                filterType === 'INTERNAL' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-indigo-700 hover:text-emerald-800'
              }`}
              title="Pemeriksaan internal laboratorium Puskesmas"
            >
              Internal ({countInternalOnly})
            </button>
            <button
              onClick={() => setFilterType('RUJUKAN')}
              className={`py-1 text-[11px] font-bold transition-all text-center ${
                filterType === 'RUJUKAN' 
                  ? 'bg-white text-sky-800 shadow-xs' 
                  : 'text-indigo-700 hover:text-sky-800'
              }`}
              title="Pemeriksaan rujukan spesimen eksternal (Labkesda/RS)"
            >
              Rujukan ({countHasExternal})
            </button>
          </div>
        </div>

        {/* List Antrean */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingAntrian && antrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
              <p className="text-xs font-medium">Memuat antrean...</p>
            </div>
          ) : filteredAntrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center px-4">
              <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
              <p className="text-xs font-bold text-gray-700">Tidak ada antrean laboratorium</p>
              <p className="text-[11px] text-gray-500 mt-1">
                {searchQuery ? 'Tidak ada hasil yang cocok dengan kata kunci pencarian.' : 'Seluruh permintaan lab telah diproses.'}
              </p>
            </div>
          ) : (
            filteredAntrian.map((order) => {
              const classification = getOrderClassification(order);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div 
                  key={order.id}
                  onClick={() => pilihOrder(order)}
                  className={`p-3 border-l-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-l-indigo-600 bg-indigo-50 shadow-sm border-y border-r border-indigo-200' 
                      : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-600">
                      {order.kunjungan?.jamRegistrasi || '08:00'} • {order.pasien?.noRM}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 font-black uppercase tracking-wider ${
                      classification.type === 'RUJUKAN' 
                        ? 'bg-sky-100 text-sky-800 border border-sky-300' 
                        : classification.type === 'CAMPURAN'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {classification.label}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs text-gray-900 truncate uppercase">
                      {order.pasien?.namaLengkap}
                    </h3>
                    <div className="text-[11px] text-gray-500 space-y-0.5 mt-1">
                      <p className="truncate">Dokter: {order.dokter?.namaLengkap || 'Dokter Poli'}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span>Total: {order.details.length} Tes</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-1 border border-amber-200 uppercase">
                          {order.status === 'MENUNGGU_SAMPEL' ? 'Menunggu Sampel' : 'Diproses'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {selectedOrder ? (
          <>
            {/* Header Selected Order */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-xs z-10 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                  {selectedOrder.pasien?.namaLengkap?.charAt(0) || 'P'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight truncate">
                      {selectedOrder.pasien?.namaLengkap}
                    </h1>
                    <span className="bg-slate-800 text-white font-mono text-[11px] font-bold px-2 py-0.5">
                      RM: {selectedOrder.pasien?.noRM}
                    </span>
                    {selectedClassification && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                        selectedClassification.type === 'RUJUKAN'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : selectedClassification.type === 'CAMPURAN'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {selectedClassification.label}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-3 gap-y-0.5 mt-1 font-medium">
                    <span>Dokter: <strong className="text-gray-700">{selectedOrder.dokter?.namaLengkap}</strong></span>
                    <span>•</span>
                    <span>Unit: <strong className="text-gray-700">{selectedOrder.kunjungan?.poliklinik?.namaPoli || 'Poli'}</strong></span>
                    <span>•</span>
                    <span>Tgl: {new Date(selectedOrder.tanggalOrder).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')} WIB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedExternalTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSuratRujukanOpen(true)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Cetak Surat Pengantar Rujukan Spesimen ke Labkesda / RSUD"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>Cetak Pengantar Rujukan Spesimen</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsPratinjauHasilOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Lihat Pratinjau Kertas Cetak Hasil Laboratorium"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pratinjau Lembar Cetak</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
              <div className="max-w-5xl mx-auto space-y-5 pb-20">
                
                {/* Notice Spesimen Rujukan Luar */}
                {selectedExternalTests.length > 0 && (
                  <div className="bg-sky-50 border-2 border-sky-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 bg-sky-500 text-white flex items-center justify-center font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sky-950 text-xs uppercase tracking-tight">
                          Terdapat {selectedExternalTests.length} Pemeriksaan yang Dirujuk ke Labkesda / RSUD
                        </h4>
                        <p className="text-[11px] text-sky-800 mt-0.5 leading-relaxed">
                          Spesimen dikirim ke laboratorium rujukan luar. Pasien boleh dipulangkan hari ini oleh dokter dengan terapi simtomatik; hasil lab dari faskes rujukan dapat diinputkan menyusul ketika lembar hasil diterima.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSuratRujukanOpen(true)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0 self-start sm:self-center"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Surat Pengantar
                    </button>
                  </div>
                )}

                {/* Catatan Klinis dari Dokter */}
                {selectedOrder.catatanKlinis && (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 flex gap-3 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 mb-0.5">Catatan Klinis Dokter Pemeriksa:</h4>
                      <p className="text-amber-800 italic">{selectedOrder.catatanKlinis}</p>
                    </div>
                  </div>
                )}

                {/* Form Input Hasil */}
                <div className="bg-white shadow-xs border border-gray-200">
                  <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                        Input Hasil Analisis Laboratorium ({selectedOrder.details.length} Parameter)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="text-emerald-700 font-bold">✓ {selectedInternalTests.length} Internal</span>
                      <span>•</span>
                      <span className="text-sky-700 font-bold">↗ {selectedExternalTests.length} Rujukan Luar</span>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-gray-700 font-bold border-y border-gray-200">
                          <tr>
                            <th className="px-3 py-2.5 min-w-[220px]">Pemeriksaan & Jenis Layanan</th>
                            <th className="px-3 py-2.5 min-w-[160px]">Nilai Hasil</th>
                            <th className="px-3 py-2.5 min-w-[120px]">Satuan</th>
                            <th className="px-3 py-2.5 min-w-[150px]">Nilai Rujukan Normal</th>
                            <th className="px-3 py-2.5 w-24 text-center">Abnormal?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOrder.details.map((detail: any) => {
                            const isInternal = isInternalLabTest(detail.parameter);

                            return (
                              <tr key={detail.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{detail.parameter}</span>
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 border ${
                                      isInternal
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-sky-50 text-sky-800 border-sky-300'
                                    }`}>
                                      {isInternal ? 'Internal' : 'Rujukan Luar'}
                                    </span>
                                  </div>
                                  {!isInternal && (
                                    <span className="block text-[10px] text-sky-700 mt-0.5 italic">
                                      Dirujuk ke Labkesda/RS. Hasil dapat diinput saat lembar rujukan diterima.
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={hasilData[detail.id]?.hasil || ''}
                                    onChange={(e) => setHasilData(prev => ({
                                      ...prev, 
                                      [detail.id]: { ...prev[detail.id], hasil: e.target.value }
                                    }))}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs"
                                    placeholder={isInternal ? "Ketik hasil uji..." : "Menunggu hasil rujukan..."}
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={hasilData[detail.id]?.satuan || ''}
                                    onChange={(e) => setHasilData(prev => ({
                                      ...prev, 
                                      [detail.id]: { ...prev[detail.id], satuan: e.target.value }
                                    }))}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs"
                                    placeholder="misal: g/dL, mg/dL"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={hasilData[detail.id]?.nilaiRujukan || ''}
                                    onChange={(e) => setHasilData(prev => ({
                                      ...prev, 
                                      [detail.id]: { ...prev[detail.id], nilaiRujukan: e.target.value }
                                    }))}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs"
                                    placeholder="misal: 12-16, Negatif"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={hasilData[detail.id]?.kritis || false}
                                    onChange={(e) => setHasilData(prev => ({
                                      ...prev, 
                                      [detail.id]: { ...prev[detail.id], kritis: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-red-600 rounded-none border-gray-300 focus:ring-red-500 cursor-pointer"
                                    title="Tandai jika nilai di luar batas normal / kritis"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="bg-white p-4 border-t border-gray-200 flex flex-wrap items-center justify-between shadow-lg z-20 relative gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Hasil yang disimpan otomatis mengalir ke RME pasien & modul Kasir faskes.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPratinjauHasilOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  Pratinjau Kertas Hasil
                </button>

                <button 
                  onClick={handleKirimHasil} 
                  disabled={isSaving} 
                  className="px-6 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center text-xs rounded-none shadow-xs disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan & Terbitkan Hasil ke RME Dokter
                </button>
              </div>
            </div>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <TestTubes className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-base font-bold text-gray-700">Pilih Permintaan Lab</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Silakan pilih salah satu pasien dari daftar antrean sebelah kiri untuk menginputkan hasil analisis atau mencetak surat pengantar rujukan spesimen.
            </p>
          </div>
        )}
      </div>

      {/* MODAL SURAT RUJUKAN SPESIMEN */}
      {selectedOrder && (
        <SuratRujukanSpesimenModal
          isOpen={isSuratRujukanOpen}
          onClose={() => setIsSuratRujukanOpen(false)}
          order={selectedOrder}
        />
      )}

      {/* MODAL PRATINJAU HASIL LAB */}
      {previewOrderData && (
        <LabResultModal
          isOpen={isPratinjauHasilOpen}
          onClose={() => setIsPratinjauHasilOpen(false)}
          orderLabData={previewOrderData}
          pasienData={selectedOrder?.pasien}
        />
      )}

    </div>
  );
}
