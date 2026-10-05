import React, { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, CheckCircle2, Clock, FileText, AlertCircle, Eye, Search } from 'lucide-react';
import { radiologiService } from '@/services/radiologi.service';
import Swal from 'sweetalert2';

interface TabRadiologiProps {
  kunjunganId: string;
  isPoliGigi?: boolean;
  setActiveTab?: (tab: string) => void;
}

const MASTER_RADIOLOGI_LOINC = [
  { kodeLoinc: '39051-8', namaPemeriksaan: 'Rontgen Thorax AP/PA (XR Thorax AP/PA)', modalitas: 'XR', bodySiteCode: '51185008', bodySiteDisplay: 'Thoracic structure' },
  { kodeLoinc: '26122-2', namaPemeriksaan: 'Rontgen Femur (XR Femur - Right/Left)', modalitas: 'XR', bodySiteCode: '29836001', bodySiteDisplay: 'Hip structure' },
  { kodeLoinc: '24558-9', namaPemeriksaan: 'USG Abdomen (Ultrasonography Abdomen)', modalitas: 'US', bodySiteCode: '80581009', bodySiteDisplay: 'Upper abdomen structure' },
  { kodeLoinc: '36424-0', namaPemeriksaan: 'CT Scan Abdomen (CT Abdomen WO/W Contrast)', modalitas: 'CT', bodySiteCode: '818983003', bodySiteDisplay: 'Abdomen structure' },
  { kodeLoinc: '36442-2', namaPemeriksaan: 'MRI Dada/Thorax (MR Chest WO/W Contrast)', modalitas: 'MR', bodySiteCode: '51185008', bodySiteDisplay: 'Thoracic structure' },
  { kodeLoinc: '95611-0', namaPemeriksaan: 'Rontgen Panoramic / Dental Occlusal (XR Teeth Occlusal)', modalitas: 'XR', bodySiteCode: '39481002', bodySiteDisplay: 'Upper dental arch structure' },
];

export default function TabRadiologi({ kunjunganId, setActiveTab }: TabRadiologiProps) {
  const [prioritas, setPrioritas] = useState<'routine' | 'stat'>('routine');
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHasilModal, setSelectedHasilModal] = useState<any | null>(null);

  const fetchOrders = async () => {
    if (!kunjunganId) return;
    setIsLoading(true);
    try {
      const res = await radiologiService.getOrders({ kunjunganId });
      if (res.success) {
        setExistingOrders(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch radiologi orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [kunjunganId]);

  const handleAddItem = (item: any) => {
    if (selectedDetails.some((d) => d.kodeLoinc === item.kodeLoinc)) return;
    setSelectedDetails([...selectedDetails, item]);
  };

  const handleRemoveItem = (kodeLoinc: string) => {
    setSelectedDetails(selectedDetails.filter((d) => d.kodeLoinc !== kodeLoinc));
  };

  const handleSubmitOrder = async () => {
    if (selectedDetails.length === 0) {
      Swal.fire('Peringatan', 'Pilih minimal 1 pemeriksaan radiologi LOINC!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kunjunganId,
        prioritas,
        catatan,
        details: selectedDetails.map((d) => ({
          kodeLoinc: d.kodeLoinc,
          namaPemeriksaan: d.namaPemeriksaan,
          bodySiteCode: d.bodySiteCode,
          bodySiteDisplay: d.bodySiteDisplay,
        })),
      };

      const res = await radiologiService.createOrder(payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Radiologi Berhasil!',
          text: `Nomor ACSN: ${res.data.acsn}. Permintaan rujukan radiologi tercatat untuk diserahkan ke pasien.`,
          timer: 2000,
          showConfirmButton: false,
        });
        setSelectedDetails([]);
        setCatatan('');
        fetchOrders();
        if (setActiveTab) {
          setActiveTab('RESEP');
        }
      }
    } catch (error: any) {
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal mengirim order radiologi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoincList = MASTER_RADIOLOGI_LOINC.filter(
    (item) =>
      item.namaPemeriksaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeLoinc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
        <Radio className="w-6 h-6 text-purple-600" />
        Order Pemeriksaan Radiologi (SATUSEHAT LOINC Radiologi)
      </h3>

      {/* FORM ORDER RADIOLOGI */}
      <div className="bg-slate-50 p-6 border border-slate-200 rounded-none space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KOLOM KIRI: PENCARIAN MASTER LOINC */}
          <div className="lg:col-span-7 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              1. Pilih Jenis Pemeriksaan Radiologi (LOINC Standar Kemenkes)
            </label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari Rontgen Thorax, Femur, USG, CT-Scan, Kode LOINC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-none text-xs text-gray-900 font-bold focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 bg-white divide-y">
              {filteredLoincList.map((item) => (
                <div
                  key={item.kodeLoinc}
                  className="p-2.5 flex items-center justify-between hover:bg-purple-50 transition-colors"
                >
                  <div>
                    <span className="font-extrabold text-xs text-gray-900 block">{item.namaPemeriksaan}</span>
                    <span className="text-[10px] text-purple-700 font-mono font-bold">
                      LOINC: {item.kodeLoinc} | Modalitas: {item.modalitas}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-none transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pilih
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* KOLOM KANAN: LIST DIPILIH & PRIORITAS */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                2. Prioritas Pemeriksaan
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
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
                <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer">
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Catatan / Indikasi Klinis Dokter
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Evaluasi efusi pleura, susp. fraktur..."
                className="w-full px-3 py-2 border border-gray-300 rounded-none text-xs text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* LIST ITEM TERPILIH */}
        {selectedDetails.length > 0 && (
          <div className="bg-white p-4 border border-purple-200 space-y-2">
            <h4 className="text-xs font-extrabold text-purple-900 uppercase">Pemeriksaan Ditambahkan:</h4>
            <div className="space-y-1.5">
              {selectedDetails.map((item) => (
                <div key={item.kodeLoinc} className="flex justify-between items-center bg-purple-50 p-2 border border-purple-100">
                  <span className="text-xs font-extrabold text-purple-950">
                    {item.namaPemeriksaan} <span className="font-mono text-[10px] text-purple-700">({item.kodeLoinc})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.kodeLoinc)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || selectedDetails.length === 0}
            className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-none shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Radio className="w-4 h-4" /> Kirim Order Radiologi
          </button>
        </div>
      </div>

      {/* RIWAYAT & STATUS ORDER RADIOLOGI */}
      <div className="space-y-3">
        <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600" />
          Status Order Radiologi Pasien Kunjungan Ini
        </h4>

        {isLoading ? (
          <p className="text-xs text-gray-500">Memuat status order...</p>
        ) : existingOrders.length > 0 ? (
          <div className="space-y-3">
            {existingOrders.map((ord) => (
              <div key={ord.id} className="bg-white border border-gray-200 p-4 space-y-2 shadow-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 text-slate-800">
                      ACSN: {ord.acsn || ord.id}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                        ord.prioritas === 'stat' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {ord.prioritas}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-none ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {ord.status === 'COMPLETED' ? 'SELESAI / COMPLETED' : ord.status}
                  </span>
                </div>

                <div className="text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">
                    Pemeriksaan:{' '}
                    {ord.details?.map((d: any) => `${d.namaPemeriksaan} (${d.kodeLoinc})`).join(', ') || '-'}
                  </p>
                  {ord.catatanKlinis && <p className="text-gray-500 italic">Indikasi: {ord.catatanKlinis}</p>}
                </div>

                {ord.status === 'COMPLETED' && ord.hasil && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedHasilModal(ord)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-none shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat Hasil Ekspertise & Foto WADO
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-500">
            Belum ada order radiologi untuk kunjungan ini.
          </div>
        )}
      </div>

      {/* MODAL PRATINJAU HASIL BACAAN EKSPERTISE & WADO VIEWER */}
      {selectedHasilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-none shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-purple-900 text-white">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                Hasil Ekspertise Radiologi — ACSN #{selectedHasilModal.acsn}
              </h3>
              <button
                onClick={() => setSelectedHasilModal(null)}
                className="text-white hover:text-gray-300 transition-colors font-bold text-sm"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="bg-purple-50 p-4 border border-purple-200 text-xs text-purple-950 space-y-1">
                <p>
                  <strong>Pemeriksaan:</strong>{' '}
                  {selectedHasilModal.details?.map((d: any) => d.namaPemeriksaan).join(', ')}
                </p>
                <p>
                  <strong>Dokter Spesialis Radiologi:</strong>{' '}
                  {selectedHasilModal.hasil?.dokterRadiologi?.namaLengkap || 'Spesialis Radiologi'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  1. Temuan / Bacaan Naratif Ekspertise:
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 text-xs text-gray-900 whitespace-pre-line min-h-[80px]">
                  {selectedHasilModal.hasil?.bacaanNaratif || 'Tidak ada catatan bacaan naratif.'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  2. Kesan / Kesimpulan Radiologi:
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 text-xs font-bold text-blue-950 whitespace-pre-line">
                  {selectedHasilModal.hasil?.kesimpulan || 'Kesan dalam batas normal.'}
                </div>
              </div>

              {selectedHasilModal.hasil?.wadoUrl && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-purple-700" /> Pratinjau Citra Radiologi (WADO / DICOM Viewer)
                    </label>
                    <a
                      href={selectedHasilModal.hasil.wadoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
                    >
                      🔗 Buka Link WADO di Tab Baru ↗
                    </a>
                  </div>
                  <div className="border border-gray-300 bg-slate-950 h-96 flex flex-col items-center justify-center relative overflow-hidden text-white">
                    {selectedHasilModal.hasil.wadoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ? (
                      <img
                        src={selectedHasilModal.hasil.wadoUrl}
                        alt="Foto Rontgen Radiologi"
                        className="max-h-full max-w-full object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                        <iframe
                          src={selectedHasilModal.hasil.wadoUrl || 'https://viewer.ohif.org/viewer?StudyInstanceUIDs=2.16.840.1.114362.1.11972228.22789312658.616067305.306.2'}
                          title="OHIF DICOM Viewer"
                          className="w-full h-full border-none absolute inset-0 opacity-20 pointer-events-none"
                        />
                        <div className="z-10 bg-slate-900/90 border border-purple-500/40 p-6 rounded-lg max-w-lg shadow-2xl backdrop-blur">
                          <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                            <Eye className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">OHIF DICOM Web Viewer Ready</h4>
                          <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                            Server Public OHIF memproteksi integrasi <code className="text-yellow-300 bg-black/50 px-1 rounded">iframe</code> lintas domain. Klik tombol di bawah untuk membuka **Full-Screen Interactive DICOM Viewer** (Zoom, Windowing, Measurements):
                          </p>
                          <a
                            href={selectedHasilModal.hasil.wadoUrl || 'https://viewer.ohif.org/viewer?StudyInstanceUIDs=2.16.840.1.114362.1.11972228.22789312658.616067305.306.2'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded shadow-lg transition-transform hover:scale-105"
                          >
                            🚀 Buka OHIF DICOM Viewer Fullscreen ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedHasilModal(null)}
                className="px-6 py-2 bg-gray-800 text-white font-bold text-xs rounded-none hover:bg-gray-900 shadow-sm transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
