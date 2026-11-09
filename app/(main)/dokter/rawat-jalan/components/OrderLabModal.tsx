import React, { useState, useEffect } from 'react';
import { 
  TestTubes, 
  X, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle,
  Building2,
  Check,
  ExternalLink,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  AVAILABLE_LAB_TESTS, 
  QUICK_LAB_PACKAGES, 
  isInternalLabTest, 
  QuickLabPackage 
} from '../rawatJalan.constants';
import { laboratoriumService } from '@/services/laboratorium.service';
import CetakLaboratoriumModal from '@/components/kasir/CetakLaboratoriumModal';

interface OrderLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKunjungan: any;
  existingOrder?: any;
  onSuccess?: () => void;
}

export default function OrderLabModal({
  isOpen,
  onClose,
  selectedKunjungan,
  existingOrder,
  onSuccess,
}: OrderLabModalProps) {
  const [labOrders, setLabOrders] = useState<string[]>([]);
  const [labNote, setLabNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faskesTujuan, setFaskesTujuan] = useState('UPT Labkesda Kabupaten / RSUD Terdekat');
  const [metodeRujukan, setMetodeRujukan] = useState<'KIRIM_PASIEN' | 'KIRIM_SPESIMEN'>('KIRIM_PASIEN');
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);

  // Initialize or prefill from existing order
  useEffect(() => {
    if (isOpen) {
      if (existingOrder?.details && Array.isArray(existingOrder.details)) {
        setLabOrders(existingOrder.details.map((d: any) => d.parameter));
        setLabNote(existingOrder.catatanKlinis || '');
      } else {
        setLabOrders([]);
        setLabNote('');
      }
      setSearchQuery('');
    }
  }, [isOpen, existingOrder]);

  const [openLabCategories, setOpenLabCategories] = useState<string[]>(
    AVAILABLE_LAB_TESTS.map(c => c.category)
  );

  if (!isOpen || !selectedKunjungan) return null;

  const handleToggleLabCategory = (category: string) => {
    if (openLabCategories.includes(category)) {
      setOpenLabCategories(openLabCategories.filter(c => c !== category));
    } else {
      setOpenLabCategories([...openLabCategories, category]);
    }
  };

  const handleExpandAll = () => {
    setOpenLabCategories(AVAILABLE_LAB_TESTS.map(c => c.category));
  };

  const handleCollapseAll = () => {
    setOpenLabCategories([]);
  };

  const handleToggleLab = (test: string) => {
    if (labOrders.includes(test)) {
      setLabOrders(labOrders.filter(t => t !== test));
    } else {
      setLabOrders([...labOrders, test]);
    }
  };

  const handleApplyPackage = (pkg: QuickLabPackage) => {
    const isAllIncluded = pkg.tests.every(t => labOrders.includes(t));
    if (isAllIncluded) {
      setLabOrders(labOrders.filter(t => !pkg.tests.includes(t)));
    } else {
      const merged = Array.from(new Set([...labOrders, ...pkg.tests]));
      setLabOrders(merged);
    }
  };

  const internalCount = labOrders.filter(t => isInternalLabTest(t)).length;
  const externalCount = labOrders.filter(t => !isInternalLabTest(t)).length;

  const handleSubmit = async () => {
    if (labOrders.length === 0) {
      Swal.fire('Peringatan', 'Pilih minimal 1 parameter pemeriksaan laboratorium!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadTests = labOrders.map((t) => {
        const isLuar = !isInternalLabTest(t);
        return {
          parameter: t,
          isRujukanLuar: isLuar,
          faskesTujuan: isLuar ? faskesTujuan : undefined,
          metodeRujukan: isLuar ? metodeRujukan : undefined,
        };
      });

      const resOrder = await laboratoriumService.createOrder({
        kunjunganId: selectedKunjungan.id,
        pasienId: selectedKunjungan.pasien?.id,
        dokterId: selectedKunjungan.dokterTujuan?.id || selectedKunjungan.dokterId || 'dummy-dokter-id',
        catatanKlinis: labNote,
        faskesTujuan: externalCount > 0 ? faskesTujuan : undefined,
        metodeRujukan: externalCount > 0 ? metodeRujukan : undefined,
        tests: payloadTests,
      });

      setLastSavedOrder(resOrder);

      if (externalCount > 0) {
        const confirmPrint = await Swal.fire({
          icon: 'success',
          title: 'Permintaan Lab Berhasil Disimpan!',
          html: `
            <div class="text-left text-xs space-y-2 mt-2">
              <p>✅ <strong>${internalCount} Uji Internal:</strong> Diteruskan ke analis lab Puskesmas & masuk kasir.</p>
              <p>🟠 <strong>${externalCount} Uji Rujukan Luar:</strong> Otomatis <strong>Rp 0 di Kasir Puskesmas</strong> (pasien bayar di ${faskesTujuan}).</p>
              <p class="font-bold text-slate-800 mt-2">Cetak 1 Lembar Surat Pengantar Rujukan Lab sekarang?</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '🖨️ Cetak Surat Pengantar Lab',
          cancelButtonText: 'Selesai Tanpa Cetak',
          confirmButtonColor: '#2563eb',
        });

        if (confirmPrint.isConfirmed) {
          setIsCetakModalOpen(true);
          if (onSuccess) onSuccess();
          return;
        }
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Permintaan Lab Internal Terkirim!',
          text: `Total ${internalCount} parameter uji telah diteruskan ke analis laboratorium & tersinkron ke kasir faskes.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal mengirim order laboratorium.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories and tests based on search query
  const filteredCategories = AVAILABLE_LAB_TESTS.map(cat => {
    const matchingTests = cat.tests.filter(t => 
      t.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      matchingTests,
    };
  }).filter(cat => cat.matchingTests.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center border border-white/20">
              <TestTubes className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold uppercase tracking-wide">
                  Formulir Permintaan Pemeriksaan Laboratorium
                </h3>
                {existingOrder && (
                  <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                    Perbarui Order ({existingOrder.status || 'Terkirim'})
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200 mt-0.5 font-medium">
                Pasien: <strong className="text-white">{selectedKunjungan.pasien?.namaLengkap}</strong> • No. RM: <strong className="text-white">{selectedKunjungan.pasien?.noRM}</strong> • Poli: {selectedKunjungan.poliklinik?.namaPoli || 'Rawat Jalan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] bg-black/20 px-3 py-1 border border-white/10">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 🟢 Internal Puskesmas (Tersedia)
              </span>
              <span className="text-white/40">|</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> 🟠 Rujuk Lab Luar / Labkesda (Rp 0)
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MODAL SEARCH & QUICK PACKAGES BAR */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pemeriksaan lab (misal: Gula Darah, Hemoglobin, Kolesterol, Widal, Urin...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-none text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition-colors"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition-colors"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {/* Quick Packages Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Paket Cepat 1-Klik:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {QUICK_LAB_PACKAGES.map((pkg) => {
                const isAllSelected = pkg.tests.every(t => labOrders.includes(t));
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleApplyPackage(pkg)}
                    className={`p-2 text-left border transition-all text-xs flex flex-col justify-between ${
                      isAllSelected
                        ? 'border-amber-600 bg-amber-50 shadow-xs'
                        : 'border-slate-300 bg-white hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold px-1 bg-slate-100 text-slate-600">
                          {pkg.badge}
                        </span>
                        {isAllSelected && (
                          <span className="text-[10px] font-bold text-slate-800 flex items-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1">{pkg.name}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{pkg.tests.length} Uji</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE LAB CATALOGUE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/50">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredCategories.map((cat, idx) => {
              const isOpen = openLabCategories.includes(cat.category) || searchQuery.length > 0;
              const selectedInCat = cat.tests.filter((t: string) => labOrders.includes(t)).length;

              return (
                <div key={idx} className="bg-white border border-slate-300 shadow-xs break-inside-avoid">
                  {/* Category Header */}
                  <div 
                    onClick={() => handleToggleLabCategory(cat.category)}
                    className="font-extrabold text-xs text-slate-900 bg-amber-100/70 hover:bg-amber-200/80 px-3 py-2.5 uppercase tracking-wide border-b border-slate-300 cursor-pointer flex justify-between items-center transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat.category}</span>
                      {selectedInCat > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-700 text-white text-[10px] font-mono font-bold">
                          {selectedInCat}
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-4 h-4 text-slate-700" />}
                  </div>

                  {/* Tests List */}
                  {isOpen && (
                    <div className="p-2.5 space-y-1 divide-y divide-slate-100">
                      {cat.matchingTests.map((test: string, i: number) => {
                        const isInternal = isInternalLabTest(test);
                        const isChecked = labOrders.includes(test);

                        return (
                          <label 
                            key={i} 
                            className={`pt-1.5 flex items-start justify-between gap-2 cursor-pointer p-1.5 transition-colors ${
                              isChecked ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 mt-0.5 text-amber-700 border-slate-400 focus:ring-amber-600 cursor-pointer" 
                                checked={isChecked}
                                onChange={() => handleToggleLab(test)}
                              />
                              <span className="text-xs text-slate-800 leading-snug">
                                {test}
                              </span>
                            </div>
                            
                            <span className={`shrink-0 text-[10px] px-1.5 py-0.2 font-extrabold border ${
                              isInternal 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {isInternal ? '🟢 Tersedia Internal' : '🟠 Rujuk Lab Luar'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-10 bg-white border border-slate-200 p-6">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tidak ada pemeriksaan laboratorium yang cocok dengan kata kunci &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-amber-700 underline"
              >
                Reset Pencarian
              </button>
            </div>
          )}

          {/* PENGATURAN RUJUKAN LAB LUAR (MUNCUL OTOMATIS JIKA ADA ITEM EKSTERNAL) */}
          {externalCount > 0 && (
            <div className="bg-amber-50/80 border-2 border-amber-300 p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-950">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <span>Pengaturan Rujukan Lab Luar / Labkesda ({externalCount} Parameter Terpilih):</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5">
                  Tarif di Puskesmas: Rp 0
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Faskes Lab Tujuan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Faskes / Laboratorium Rujukan Tujuan: *
                  </label>
                  <select
                    value={faskesTujuan}
                    onChange={(e) => setFaskesTujuan(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="UPT Labkesda Kabupaten / RSUD Terdekat">UPT Labkesda Kabupaten / RSUD Terdekat</option>
                    <option value="RSUD Kabupaten / RS Rujukan Utama">RSUD Kabupaten / RS Rujukan Utama</option>
                    <option value="Laboratorium Kesehatan Daerah (Labkesda) Provinsi">Labkesda Provinsi</option>
                    <option value="Laboratorium Klinik Prodia / Rekanan Swasta">Laboratorium Klinik Rekanan Swasta</option>
                  </select>
                </div>

                {/* Metode Rujukan Lab */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Metode Pengiriman / Rujukan: *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      onClick={() => setMetodeRujukan('KIRIM_PASIEN')}
                      className={`p-2 border text-center cursor-pointer transition-colors ${
                        metodeRujukan === 'KIRIM_PASIEN'
                          ? 'border-amber-600 bg-amber-100 font-bold text-amber-950'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodeRujukan"
                        checked={metodeRujukan === 'KIRIM_PASIEN'}
                        onChange={() => setMetodeRujukan('KIRIM_PASIEN')}
                        className="sr-only"
                      />
                      <div className="text-[11px] font-bold">🚶‍♂️ Kirim Pasien</div>
                      <div className="text-[9px] text-slate-500">Pasien datang sendiri ke lab luar</div>
                    </label>

                    <label
                      onClick={() => setMetodeRujukan('KIRIM_SPESIMEN')}
                      className={`p-2 border text-center cursor-pointer transition-colors ${
                        metodeRujukan === 'KIRIM_SPESIMEN'
                          ? 'border-amber-600 bg-amber-100 font-bold text-amber-950'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodeRujukan"
                        checked={metodeRujukan === 'KIRIM_SPESIMEN'}
                        onChange={() => setMetodeRujukan('KIRIM_SPESIMEN')}
                        className="sr-only"
                      />
                      <div className="text-[11px] font-bold">🧪 Kirim Spesimen</div>
                      <div className="text-[9px] text-slate-500">Sampel diambil Puskesmas & kurir</div>
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 border border-amber-200">
                💡 Seluruh parameter rujukan luar ini akan otomatis digabungkan dalam <strong>1 Lembar Surat Pengantar Rujukan Lab</strong> (tanpa dipisah-pisah per item).
              </p>
            </div>
          )}

          {/* CATATAN KLINIS */}
          <div className="bg-white p-4 border border-slate-300 space-y-1.5">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
              Catatan Klinis / Indikasi Pemeriksaan untuk Petugas Lab:
            </label>
            <textarea 
              rows={2} 
              value={labNote} 
              onChange={e => setLabNote(e.target.value)} 
              className="w-full px-3 py-2 bg-white border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="Contoh: Skrining ANC Trimester 1, Cek Glukosa karena riwayat keluarga, CITO/Segera..." 
            />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Total Terpilih:</span>
              <span className="text-base font-black text-amber-900 font-mono">{labOrders.length} Parameter</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
              <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> {internalCount} Uji Internal Faskes
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3 text-slate-500" /> {externalCount} Rujukan Luar (Labkesda/RS)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={labOrders.length === 0 || isSubmitting}
              className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Permintaan Lab...</span>
                </>
              ) : (
                <>
                  <TestTubes className="w-4 h-4" />
                  <span>Kirim Permintaan Lab ke Analis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* MODAL CETAK SURAT PENGANTAR RUJUKAN LAB EKSTERNAL */}
      {isCetakModalOpen && (
        <CetakLaboratoriumModal
          isOpen={isCetakModalOpen}
          onClose={() => {
            setIsCetakModalOpen(false);
            onClose();
          }}
          pasienData={selectedKunjungan?.pasien}
          orderLabData={{
            ...(lastSavedOrder || existingOrder || {}),
            details: labOrders.map((t) => ({
              parameter: t,
              isRujukanLuar: !isInternalLabTest(t),
              faskesTujuan: !isInternalLabTest(t) ? faskesTujuan : undefined,
              metodeRujukan: !isInternalLabTest(t) ? metodeRujukan : undefined,
            })),
            catatanKlinis: labNote,
            faskesTujuan,
            metodeRujukan,
          }}

        />
      )}
    </div>
  );
}
