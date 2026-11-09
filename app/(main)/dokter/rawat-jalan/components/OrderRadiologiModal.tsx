import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  X, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle, 
  Loader2,
  Building2,
  Printer,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { radiologiService } from '@/services/radiologi.service';
import CetakRadiologiModal from '@/components/kasir/CetakRadiologiModal';

interface OrderRadiologiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKunjungan: any;
  onSuccess?: () => void;
}

const MASTER_RADIOLOGI_LOINC = [
  { kodeLoinc: '39051-8', namaPemeriksaan: 'Rontgen Thorax AP/PA (XR Thorax AP/PA)', modalitas: 'XR', bodySiteCode: '51185008', bodySiteDisplay: 'Thoracic structure' },
  { kodeLoinc: '26122-2', namaPemeriksaan: 'Rontgen Femur (XR Femur - Right/Left)', modalitas: 'XR', bodySiteCode: '29836001', bodySiteDisplay: 'Hip structure' },
  { kodeLoinc: '36563-5', namaPemeriksaan: 'Rontgen Ekstremitas Atas / Antebrachii / Wrist', modalitas: 'XR', bodySiteCode: '53120007', bodySiteDisplay: 'Upper limb structure' },
  { kodeLoinc: '36571-8', namaPemeriksaan: 'Rontgen Pelvis / Panggul AP', modalitas: 'XR', bodySiteCode: '12921003', bodySiteDisplay: 'Pelvis structure' },
  { kodeLoinc: '36572-6', namaPemeriksaan: 'Rontgen Sinus Paranasal (XR Waters View)', modalitas: 'XR', bodySiteCode: '2095001', bodySiteDisplay: 'Nasal sinus structure' },
  { kodeLoinc: '95611-0', namaPemeriksaan: 'Rontgen Panoramic / Dental Occlusal (XR Teeth Occlusal)', modalitas: 'XR', bodySiteCode: '39481002', bodySiteDisplay: 'Upper dental arch structure' },
  { kodeLoinc: '24558-9', namaPemeriksaan: 'USG Abdomen (Ultrasonography Abdomen)', modalitas: 'US', bodySiteCode: '80581009', bodySiteDisplay: 'Upper abdomen structure' },
  { kodeLoinc: '24627-2', namaPemeriksaan: 'USG Kebidanan / Kandungan (Obstetric Ultrasound)', modalitas: 'US', bodySiteCode: '280397003', bodySiteDisplay: 'Fetal structure' },
  { kodeLoinc: '36424-0', namaPemeriksaan: 'CT Scan Abdomen (CT Abdomen WO/W Contrast)', modalitas: 'CT', bodySiteCode: '818983003', bodySiteDisplay: 'Abdomen structure' },
  { kodeLoinc: '36442-2', namaPemeriksaan: 'MRI Dada/Thorax (MR Chest WO/W Contrast)', modalitas: 'MR', bodySiteCode: '51185008', bodySiteDisplay: 'Thoracic structure' },
];

export default function OrderRadiologiModal({
  isOpen,
  onClose,
  selectedKunjungan,
  onSuccess,
}: OrderRadiologiModalProps) {
  const [prioritas, setPrioritas] = useState<'routine' | 'stat'>('routine');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalitas, setSelectedModalitas] = useState<string>('ALL');
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faskesTujuan, setFaskesTujuan] = useState('Instalasi Radiologi RSUD Kabupaten / Faskes Rujukan');
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);
  const [isInputHasilOpen, setIsInputHasilOpen] = useState(false);
  const [isSubmittingHasil, setIsSubmittingHasil] = useState(false);
  const [hasilForm, setHasilForm] = useState({
    kesimpulan: '',
    bacaanNaratif: '',
    dokumenHasilUrl: '',
    dokterRadiologiNama: ''
  });

  const fetchOrders = async () => {
    if (!selectedKunjungan?.id) return;
    setIsLoadingOrders(true);
    try {
      const res = await radiologiService.getOrders({ kunjunganId: selectedKunjungan.id });
      if (res.success) {
        setExistingOrders(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch existing radiologi orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedKunjungan?.id) {
      fetchOrders();
      setSelectedDetails([]);
      setCatatan('');
      setPrioritas('routine');
      setSearchQuery('');
    }
  }, [isOpen, selectedKunjungan?.id]);

  if (!isOpen || !selectedKunjungan) return null;

  const handleSimpanHasilRujukan = async (orderId: string) => {
    if (!hasilForm.kesimpulan && !hasilForm.bacaanNaratif) {
      Swal.fire('Peringatan', 'Ketikkan minimal kesimpulan/kesan radiologi dari berkas hasil luar!', 'warning');
      return;
    }

    setIsSubmittingHasil(true);
    try {
      await radiologiService.submitHasilRujukanLuar(orderId, hasilForm);
      await Swal.fire({
        icon: 'success',
        title: 'Hasil Rujukan Radiologi Disimpan!',
        text: 'Kesimpulan ekspertise rontgen luar telah tercatat di rekam medis pasien.',
        timer: 2000,
        showConfirmButton: false
      });
      setIsInputHasilOpen(false);
      fetchOrders();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Swal.fire('Gagal', err?.response?.data?.message || 'Gagal menyimpan hasil radiologi luar', 'error');
    } finally {
      setIsSubmittingHasil(false);
    }
  };

  const handleAddItem = (item: any) => {
    if (selectedDetails.some((d) => d.kodeLoinc === item.kodeLoinc)) return;
    setSelectedDetails([...selectedDetails, item]);
  };

  const handleRemoveItem = (kodeLoinc: string) => {
    setSelectedDetails(selectedDetails.filter((d) => d.kodeLoinc !== kodeLoinc));
  };

  const handleSubmitOrder = async () => {
    if (selectedDetails.length === 0) {
      Swal.fire('Peringatan', 'Pilih minimal 1 jenis pemeriksaan radiologi LOINC!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kunjunganId: selectedKunjungan.id,
        dokterId: selectedKunjungan.dokterTujuan?.id || selectedKunjungan.dokterId,
        prioritas,
        catatan,
        isRujukanLuar: true,
        faskesTujuan,
        details: selectedDetails.map((d) => ({
          kodeLoinc: d.kodeLoinc,
          namaPemeriksaan: d.namaPemeriksaan,
          bodySiteCode: d.bodySiteCode,
          bodySiteDisplay: d.bodySiteDisplay,
        })),
      };

      const res = await radiologiService.createOrder(payload);
      if (res.success || res.data) {
        const createdOrder = res.data || res;
        setLastSavedOrder(createdOrder);

        const confirmPrint = await Swal.fire({
          icon: 'success',
          title: 'Surat Pengantar Radiologi Dibuat!',
          html: `
            <div class="text-left text-xs space-y-2 mt-2">
              <p>✅ Permintaan <strong>${selectedDetails.length} Foto Radiologi</strong> berhasil didaftarkan.</p>
              <p>🏥 <strong>RS Tujuan:</strong> ${faskesTujuan}</p>
              <p>💰 <strong>Tarif Puskesmas:</strong> <strong class="text-emerald-700">Rp 0 (Rujukan Eksternal)</strong>.</p>
              <p class="font-bold text-slate-800 mt-2">Cetak 1 Lembar Surat Pengantar Radiologi sekarang?</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '🖨️ Cetak Surat Pengantar Radiologi',
          cancelButtonText: 'Selesai Tanpa Cetak',
          confirmButtonColor: '#4f46e5',
        });

        if (confirmPrint.isConfirmed) {
          setIsCetakModalOpen(true);
          if (onSuccess) onSuccess();
          return;
        }

        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error: any) {
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal mengirim order radiologi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoincList = MASTER_RADIOLOGI_LOINC.filter((item) => {
    const matchQuery =
      item.namaPemeriksaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeLoinc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModalitas = selectedModalitas === 'ALL' || item.modalitas === selectedModalitas;
    return matchQuery && matchModalitas;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center border border-white/20">
              <Radio className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold uppercase tracking-wide">
                  Surat Pengantar Radiologi (Rujukan Eksternal RSUD)
                </h3>
                <span className="px-2 py-0.5 bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider">
                  Tarif Rp 0 di Puskesmas
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Pasien: <strong className="text-white">{selectedKunjungan.pasien?.namaLengkap}</strong> • No. RM: <strong className="text-white">{selectedKunjungan.pasien?.noRM}</strong> • Poli: {selectedKunjungan.poliklinik?.namaPoli || 'Rawat Jalan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* RIWAYAT ORDER RADIOLOGI SEBELUMNYA JIKA SUDAH ADA */}
        {existingOrders.length > 0 && (
          <div className="bg-purple-50/90 border-b border-purple-200 p-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
              <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                Order Radiologi Aktif Terdaftar ({existingOrders.length}):
              </span>
              <span className="text-xs font-mono font-bold text-purple-800 bg-white px-2 py-0.5 border border-purple-300">
                ACSN: {existingOrders[0]?.acsn}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-purple-700">
                Status: {existingOrders[0]?.status || 'REQUESTED'}
              </span>
              <button
                type="button"
                onClick={() => setIsCetakModalOpen(true)}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Surat Pengantar
              </button>
              <button
                type="button"
                onClick={() => setIsInputHasilOpen(true)}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" /> 📥 Input Hasil Kertas RS
              </button>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50">
          
          {/* BANNER INFORMASI RUJUKAN EKSTERNAL FKTP */}
          <div className="bg-purple-50 border-l-4 border-purple-600 p-3.5 flex items-start gap-3 text-xs text-purple-950">
            <Building2 className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wide">Rujukan Parsial Penunjang Radiologi (FKTP Puskesmas)</p>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Puskesmas tidak memiliki instalasi radiologi mandiri. Seluruh permintaan foto rontgen digabungkan dalam <strong>1 Lembar Surat Pengantar Radiologi Eksternal</strong> (Tarif di Kasir Puskesmas otomatis Rp 0). Pasien membawa hasil foto kembali ke dokter Puskesmas.
              </p>
            </div>
          </div>

          {/* INPUT RS / FASKES TUJUAN */}
          <div className="bg-white p-4 border border-slate-300">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
              Rumah Sakit / Instalasi Radiologi Rujukan Tujuan: *
            </label>
            <input
              type="text"
              value={faskesTujuan}
              onChange={(e) => setFaskesTujuan(e.target.value)}
              placeholder="Misal: Instalasi Radiologi RSUD Cibinong / RS PMI Bogor / Lab Rekanan..."
              className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* KOLOM KIRI: KATALOG LOINC & FILTER */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                  1. Pilih Jenis Pemeriksaan Radiologi (LOINC)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Standar Kemenkes</span>
              </div>

              {/* Filter Modalitas Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', label: 'Semua Modalitas' },
                  { id: 'XR', label: 'XR (Rontgen)' },
                  { id: 'US', label: 'US (USG)' },
                  { id: 'CT', label: 'CT (CT-Scan)' },
                  { id: 'MR', label: 'MR (MRI)' },
                ].map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModalitas(mod.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors border ${
                      selectedModalitas === mod.id
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>

              {/* Search LOINC */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Rontgen Thorax, Femur, USG, CT-Scan, Panoramic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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

              {/* Master List Scrollable */}
              <div className="max-h-64 overflow-y-auto border border-slate-300 bg-white divide-y divide-slate-100 shadow-xs">
                {filteredLoincList.map((item) => {
                  const isAdded = selectedDetails.some((d) => d.kodeLoinc === item.kodeLoinc);
                  return (
                    <div
                      key={item.kodeLoinc}
                      className={`p-3 flex items-center justify-between transition-colors ${
                        isAdded ? 'bg-purple-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="pr-3">
                        <span className="font-bold text-xs text-slate-900 block leading-snug">
                          {item.namaPemeriksaan}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-mono font-bold">
                            LOINC: {item.kodeLoinc}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-600">Modalitas: {item.modalitas}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{item.bodySiteDisplay}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 font-bold text-xs shrink-0 flex items-center gap-1 transition-colors ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ditambahkan
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> + Pilih
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                {filteredLoincList.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ditemukan pemeriksaan radiologi yang cocok.
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: LIST DIPILIH, PRIORITAS & CATATAN */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Prioritas */}
              <div className="bg-white p-4 border border-slate-300 space-y-2">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                  2. Prioritas Pemeriksaan:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-2.5 border cursor-pointer flex items-center gap-2 text-xs font-bold transition-colors ${
                    prioritas === 'routine' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-300 bg-white text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="prioritas"
                      value="routine"
                      checked={prioritas === 'routine'}
                      onChange={() => setPrioritas('routine')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Routine (Biasa)</span>
                  </label>

                  <label className={`p-2.5 border cursor-pointer flex items-center gap-2 text-xs font-bold transition-colors ${
                    prioritas === 'stat' ? 'border-red-600 bg-red-50 text-red-900' : 'border-slate-300 bg-white text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="prioritas"
                      value="stat"
                      checked={prioritas === 'stat'}
                      onChange={() => setPrioritas('stat')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>STAT / CITO (Urgent)</span>
                  </label>
                </div>
              </div>

              {/* Catatan / Indikasi Klinis */}
              <div className="bg-white p-4 border border-slate-300 space-y-1.5">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                  3. Indikasi Klinis Dokter / Catatan:
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Batuk kronis > 2 minggu susp. KP Duplex, riwayat trauma dada..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* List Item Radiologi Terpilih */}
              <div className="bg-white p-4 border border-slate-300 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Pemeriksaan Dipilih ({selectedDetails.length}):
                  </h4>
                  {selectedDetails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDetails([])}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                {selectedDetails.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Belum ada pemeriksaan radiologi dipilih. Klik &quot;+ Pilih&quot; di daftar sebelah kiri.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedDetails.map((item) => (
                      <div
                        key={item.kodeLoinc}
                        className="flex justify-between items-center bg-purple-50/80 p-2.5 border border-purple-200"
                      >
                        <div>
                          <span className="text-xs font-bold text-purple-950 block leading-tight">
                            {item.namaPemeriksaan}
                          </span>
                          <span className="font-mono text-[10px] text-purple-700">
                            {item.kodeLoinc} • Modalitas {item.modalitas}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.kodeLoinc)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors ml-2"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Total Pemeriksaan:</span>
            <span className="text-base font-black text-purple-900 font-mono">{selectedDetails.length} Modalitas</span>
            <span className="text-xs text-slate-400">•</span>
            <span className={`text-xs font-extrabold ${prioritas === 'stat' ? 'text-red-600' : 'text-slate-600'}`}>
              Prioritas: {prioritas === 'stat' ? 'STAT / CITO' : 'Routine'}
            </span>
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
              onClick={handleSubmitOrder}
              disabled={selectedDetails.length === 0 || isSubmitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Order Radiologi...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Kirim Order Radiologi (Generate ACSN)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* MODAL CETAK SURAT PENGANTAR RADIOLOGI */}
      {isCetakModalOpen && (
        <CetakRadiologiModal
          isOpen={isCetakModalOpen}
          onClose={() => {
            setIsCetakModalOpen(false);
            onClose();
          }}
          pasienData={selectedKunjungan?.pasien}
          orderRadiologiData={lastSavedOrder || existingOrders[0]}

        />
      )}

      {/* MODAL INPUT HASIL KERTAS DARI RS LUAR */}
      {isInputHasilOpen && existingOrders.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase">
                📥 Input Hasil Ekspertise Rontgen dari RS Luar
              </h4>
              <button onClick={() => setIsInputHasilOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ketikkan ringkasan hasil bacaan atau kesimpulan yang tertulis pada lembar amplop rontgen RSUD.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Kesan / Kesimpulan Radiologi: *
                </label>
                <textarea
                  rows={2}
                  value={hasilForm.kesimpulan}
                  onChange={(e) => setHasilForm({ ...hasilForm, kesimpulan: e.target.value })}
                  placeholder="Contoh: Cor dan pulmo dalam batas normal / Tidak tampak fraktur..."
                  className="w-full p-2 border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Bacaan Naratif / Temuan Ekspertise (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={hasilForm.bacaanNaratif}
                  onChange={(e) => setHasilForm({ ...hasilForm, bacaanNaratif: e.target.value })}
                  placeholder="Deskripsi apeks paru, hilus, sinus kostofrenikus, diafragma..."
                  className="w-full p-2 border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Link / Foto Dokumen Berkas Rontgen (Opsional):
                </label>
                <input
                  type="text"
                  value={hasilForm.dokumenHasilUrl}
                  onChange={(e) => setHasilForm({ ...hasilForm, dokumenHasilUrl: e.target.value })}
                  placeholder="https://... atau path scan dokumen"
                  className="w-full p-2 border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsInputHasilOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingHasil}
                onClick={() => handleSimpanHasilRujukan(existingOrders[0].id)}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingHasil ? 'Menyimpan...' : 'Simpan Hasil Rujukan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
