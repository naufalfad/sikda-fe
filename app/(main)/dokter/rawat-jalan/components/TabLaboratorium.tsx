import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { TestTubes, ChevronDown, ChevronRight, Loader2, Sparkles, Building2, CheckCircle2, AlertCircle, Check, ExternalLink, ArrowRight, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import { QUICK_LAB_PACKAGES, isInternalLabTest, QuickLabPackage } from '../rawatJalan.constants';
import { klinikService } from '@/services/klinik.service';
import SuratRujukanSpesimenModal from '@/components/laboratorium/SuratRujukanSpesimenModal';

interface TabLaboratoriumProps {
  availableLabTests: any[];
  openLabCategories: string[];
  handleToggleLabCategory: (category: string) => void;
  labOrders: string[];
  handleToggleLab: (test: string) => void;
  labNote: string;
  setLabNote: Dispatch<SetStateAction<string>>;
  isSaving: boolean;
  selectedKunjungan: any;
  simpanOrderLab: (data: any) => Promise<any>;
  clearSelection: () => void;
  fetchAntrian: () => void;
  setActiveTab: (tab: string) => void;
  existingLabCount?: number;
  onViewExistingLab?: () => void;
}

export default function TabLaboratorium({
  availableLabTests,
  openLabCategories,
  handleToggleLabCategory,
  labOrders,
  handleToggleLab,
  labNote,
  setLabNote,
  isSaving,
  selectedKunjungan,
  simpanOrderLab,
  clearSelection,
  fetchAntrian,
  setActiveTab,
  existingLabCount = 0,
  onViewExistingLab,
}: TabLaboratoriumProps) {
  const [isSuratRujukanOpen, setIsSuratRujukanOpen] = useState(false);
  const [rujukanOrderData, setRujukanOrderData] = useState<any | null>(null);
  const [faskesLabParams, setFaskesLabParams] = useState<string[] | null>(null);
  const [defaultLabTarget, setDefaultLabTarget] = useState<string>('UPT Labkesda Kabupaten / RSUD Terdekat');
  const [faskesInfo, setFaskesInfo] = useState<any>(null);

  useEffect(() => {
    const fetchCap = async () => {
      try {
        const res = await klinikService.getFaskesKapabilitas();
        if (res?.data?.faskes) {
          setFaskesInfo(res.data.faskes);
          if (Array.isArray(res.data.faskes.labInternalParams) && res.data.faskes.labInternalParams.length > 0) {
            setFaskesLabParams(res.data.faskes.labInternalParams);
          }
          if (res.data.faskes.defaultLabRujukan) {
            setDefaultLabTarget(res.data.faskes.defaultLabRujukan);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kapabilitas faskes di RME Lab:', err);
      }
    };
    fetchCap();
  }, [selectedKunjungan?.faskesId]);

  const checkIsInternal = (testName: string = ''): boolean => {
    if (faskesLabParams && faskesLabParams.length > 0) {
      const lower = testName.toLowerCase().trim();
      return faskesLabParams.some(p => lower.includes(p.toLowerCase()) || p.toLowerCase().includes(lower));
    }
    return isInternalLabTest(testName);
  };
  
  const handleApplyPackage = (pkg: QuickLabPackage) => {
    const isAllIncluded = pkg.tests.every(t => labOrders.includes(t));
    if (isAllIncluded) {
      // Toggle off jika sudah tercentang semua
      pkg.tests.forEach(t => {
        if (labOrders.includes(t)) handleToggleLab(t);
      });
    } else {
      // Centang semua tes dalam paket
      pkg.tests.forEach(t => {
        if (!labOrders.includes(t)) handleToggleLab(t);
      });
    }
  };

  const internalCount = labOrders.filter(t => checkIsInternal(t)).length;
  const externalCount = labOrders.filter(t => !checkIsInternal(t)).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <TestTubes className="w-6 h-6 text-indigo-600" />
            Order Pemeriksaan Laboratorium
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Faskes: <strong>{faskesInfo?.namaFaskes || selectedKunjungan?.faskes?.namaFaskes || 'Puskesmas'}</strong> ({faskesLabParams ? `${faskesLabParams.length} Uji Internal` : 'Standar Lab Internal Tersedia'})
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Faskes Internal
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Rujukan Labkesda/RS
          </span>
        </div>
      </div>

      {/* RIWAYAT LAB TERSEDIA NOTIFICATION BANNER */}
      {Boolean(existingLabCount && existingLabCount > 0) && (
        <div className="p-4 bg-amber-50/90 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <TestTubes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950 uppercase tracking-tight">
                Tersedia {existingLabCount} Berkas Hasil Pemeriksaan Laboratorium Pasien Ini
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Pasien telah memiliki hasil lab selesai (hasil asinkron / riwayat terdahulu). Anda dapat langsung membuka dan meninjau lembar hasilnya saat pasien kontrol.
              </p>
            </div>
          </div>
          {onViewExistingLab && (
            <button
              type="button"
              onClick={onViewExistingLab}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-start sm:self-center"
            >
              <TestTubes className="w-4 h-4" />
              <span>Tinjau Lembar Hasil Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* QUICK PACKAGES (1-KLIK) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-none space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Paket Pemeriksaan Cepat Puskesmas (1-Klik)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LAB_PACKAGES.map((pkg) => {
            const isAllSelected = pkg.tests.every(t => labOrders.includes(t));
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handleApplyPackage(pkg)}
                className={`p-3 text-left border-2 transition-all rounded-none relative flex flex-col justify-between ${
                  isAllSelected
                    ? 'border-indigo-600 bg-indigo-50/90 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700">
                      {pkg.badge}
                    </span>
                    {isAllSelected && (
                      <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terpilih
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{pkg.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{pkg.tests.length} Parameter Uji</span>
                  <span className="font-semibold text-indigo-600">{isAllSelected ? 'Klik Batal' : '+ Pilih Paket'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* KATALOG LENGKAP SEMUA KATEGORI */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
          Daftar Parameter Uji Lengkap (Pilihan Mandiri):
        </h4>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {availableLabTests.map((cat, idx) => {
            const isOpen = openLabCategories.includes(cat.category);
            const selectedInCat = cat.tests.filter((t: string) => labOrders.includes(t)).length;

            return (
              <div key={idx} className="bg-white border-[1.5px] border-slate-800 break-inside-avoid shadow-xs">
                <h4 
                  onClick={() => handleToggleLabCategory(cat.category)}
                  className="font-extrabold text-[11px] text-slate-900 bg-yellow-300 hover:bg-yellow-400 px-2.5 py-2 uppercase tracking-tight border-b-[1.5px] border-slate-800 cursor-pointer flex justify-between items-center transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{cat.category}</span>
                    {selectedInCat > 0 && (
                      <span className="px-1.5 py-0.2 bg-slate-900 text-yellow-300 text-[10px] rounded-none font-bold">
                        {selectedInCat}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </h4>
                {isOpen && (
                  <div className="p-2 space-y-1 bg-yellow-50/10 divide-y divide-slate-100">
                    {cat.tests.map((test: string, i: number) => {
                      const isInternal = checkIsInternal(test);
                      const isChecked = labOrders.includes(test);

                      return (
                        <label key={i} className={`pt-1 flex items-start justify-between gap-2 cursor-pointer p-1 rounded-none transition-colors group ${isChecked ? 'bg-yellow-100/70' : 'hover:bg-yellow-50'}`}>
                          <div className="flex items-start gap-2">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 mt-[2px] text-slate-800 border-slate-400 rounded-none focus:ring-slate-800 cursor-pointer" 
                              checked={isChecked}
                              onChange={() => handleToggleLab(test)}
                            />
                            <span className="text-[11px] font-semibold text-slate-700 leading-tight group-hover:text-slate-900">
                              {test}
                            </span>
                          </div>
                          
                          <span className={`flex-shrink-0 text-[9px] px-1 py-0.2 font-bold border rounded-none ${
                            isInternal 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {isInternal ? 'Internal' : 'Rujukan'}
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
      </div>

      {/* CATATAN KLINIS */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Catatan Klinis / Indikasi Pemeriksaan Dokter
        </label>
        <textarea 
          rows={2} 
          value={labNote} 
          onChange={e => setLabNote(e.target.value)} 
          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-xs text-gray-900" 
          placeholder="Contoh: Skrining ANC Trimester 1, Cek Glukosa karena riwayat keluarga, CITO/Segera..." 
        />
      </div>

      {/* SUMMARY & SUBMIT */}
      <div className="p-4 bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-700 font-bold uppercase tracking-wider">Total Pemeriksaan Dipilih:</p>
            <span className="text-lg font-extrabold text-slate-900 font-mono">{labOrders.length} Parameter</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> {internalCount} Uji Internal Faskes
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-700 inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3 text-slate-500" /> {externalCount} Rujukan Eksternal (Labkesda/RSUD)
            </span>
          </div>

          {externalCount > 0 && (
            <p className="text-[11px] text-sky-800 mt-1.5 italic flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Terdapat pemeriksaan rujukan luar. Pasien boleh dipulangkan, hasil lab akan menyusul masuk ke RME pasien.
            </p>
          )}
        </div>

        <button 
          disabled={labOrders.length === 0 || isSaving}
          onClick={async () => {
            if (!selectedKunjungan) return;
            try {
              const res = await simpanOrderLab({
                kunjunganId: selectedKunjungan.id,
                pasienId: selectedKunjungan.pasien.id,
                dokterId: selectedKunjungan.dokterTujuan?.id || 'dummy-dokter-id',
                catatanKlinis: labNote,
                tests: labOrders
              });

              const isAllExternal = internalCount === 0 && externalCount > 0;
              const hasExternal = externalCount > 0;

              if (hasExternal) {
                const externalTestNames = labOrders.filter(t => !checkIsInternal(t));
                const orderDataForModal = {
                  ...(res || {}),
                  pasien: selectedKunjungan.pasien,
                  dokter: selectedKunjungan.dokterTujuan || { namaLengkap: 'dr. Dokter Pemeriksa' },
                  catatanKlinis: labNote,
                  tanggalOrder: new Date(),
                  details: labOrders.map((test) => ({
                    parameter: test,
                    isRujukanLuar: !checkIsInternal(test),
                    faskesTujuan: defaultLabTarget,
                  })),
                };

                const confirmPrint = await Swal.fire({
                  icon: 'success',
                  title: isAllExternal ? 'Rujukan Lab Eksternal Dibuat!' : 'Order Lab Berhasil Disimpan!',
                  html: `
                    <div class="text-left text-xs space-y-2 mt-2">
                      ${isAllExternal ? `
                        <p class="font-bold text-slate-900">Seluruh ${externalCount} pemeriksaan dirujuk keluar (Labkesda/RSUD) karena keterbatasan alat di faskes ini.</p>
                        <p class="text-emerald-700 font-bold bg-emerald-50 p-2 border border-emerald-200">
                          Pasien tidak perlu mengantre di lab faskes ini dan order tidak masuk ke antrean analis internal.
                        </p>
                      ` : `
                        <p><strong>${internalCount} Uji Internal:</strong> Masuk antrean lab faskes ini.</p>
                        <p><strong>${externalCount} Rujukan Luar:</strong> (${externalTestNames.join(', ')}) dirujuk ke Labkesda/RSUD dan tidak mengotori antrean internal.</p>
                      `}
                      <p class="font-bold text-slate-800 pt-1">Cetak Surat Pengantar Rujukan Lab untuk dibawa pasien sekarang?</p>
                    </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: 'Cetak Surat Pengantar',
                  cancelButtonText: 'Lanjut ke Tindakan',
                  confirmButtonColor: '#0284c7',
                });

                if (confirmPrint.isConfirmed) {
                  setRujukanOrderData(orderDataForModal);
                  setIsSuratRujukanOpen(true);
                } else {
                  setActiveTab('TINDAKAN');
                }
              } else {
                Swal.fire({
                  icon: 'success',
                  title: 'Order Lab Internal Berhasil Dikirim!',
                  text: 'Permintaan lab telah diteruskan ke antrean analis lab internal faskes.',
                  timer: 2000,
                  showConfirmButton: false,
                });
                setActiveTab('TINDAKAN');
              }
            } catch (error) {
              // Error ditangani oleh store
            }
          }}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-none shadow-sm transition-colors flex items-center justify-center gap-2 text-xs"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTubes className="w-4 h-4" />}
          {isSaving ? 'Menyimpan Order...' : (
            <>
              <span>Simpan Order Lab & Lanjut Tindakan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      
      <div className="flex justify-end pt-3 border-t border-gray-200">
        <button onClick={() => { setActiveTab('TINDAKAN'); }} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-none transition-colors shadow-sm text-xs">
          Lewati & Lanjut ke Tindakan &rarr;
        </button>
      </div>

      {/* MODAL CETAK SURAT RUJUKAN LAB DOKTER */}
      {isSuratRujukanOpen && rujukanOrderData && (
        <SuratRujukanSpesimenModal
          isOpen={isSuratRujukanOpen}
          onClose={() => {
            setIsSuratRujukanOpen(false);
            setActiveTab('TINDAKAN');
          }}
          order={rujukanOrderData}
        />
      )}
    </div>
  );
}
