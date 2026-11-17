"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Stethoscope, 
  Pill, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  FileText,
  ShieldCheck,
  Home,
  Activity,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { farmasiService, ResepData } from '@/services/farmasi.service';
import { useApotekerStore } from '@/store/apoteker.store';

export default function ProsesResepPage() {
  const { id } = useParams();
  const router = useRouter();
  const [resep, setResep] = useState<ResepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Modal konfirmasi & sukses
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) fetchResep();
  }, [id]);

  const fetchResep = async () => {
    try {
      const data = await farmasiService.getResepById(id as string);
      setResep(data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data resep. Resep mungkin tidak ditemukan atau sudah selesai.');
    } finally {
      setIsLoading(false);
    }
  };

  // Checklist Telaah Resep apoteker (5 Benar)
  const [telaahChecklist, setTelaahChecklist] = useState({
    tepatPasien: false,
    tepatObat: false,
    tepatDosis: false,
    tepatRute: false,
    tepatWaktu: false
  });

  const allChecked = Object.values(telaahChecklist).every(val => val === true);

  const toggleCheck = (key: keyof typeof telaahChecklist) => {
    setTelaahChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProses = async () => {
    if (!resep) return;

    if (!allChecked) {
      alert('Harap selesaikan dan centang seluruh kriteria Telaah Resep terlebih dahulu!');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeDispense = async () => {
    if (!resep) return;
    setShowConfirmModal(false);
    setIsProcessing(true);
    setError('');

    try {
      // 1. Simpan/proses transaksi obat secara lokal di database SIAP-KES (pemotongan stok FEFO)
      await farmasiService.prosesResep(id as string);

      // 2. Hubungkan ke SatuSehat Store untuk pengiriman QuestionnaireResponse & MedicationDispense
      const patientIhs = resep.pasien.noIHS || '';
      const encounterId = resep.kunjungan.encounterId || '';
      const practitionerIhs = resep.dokter?.tenagaMedis?.noIHS || '';

      const questionnaireData = {
        pasienIhs: patientIhs,
        encounterId: encounterId,
        practitionerIhs: practitionerIhs,
        patientName: resep.pasien.namaLengkap,
        practitionerName: resep.dokter?.namaLengkap || 'Petugas Apotek',
        items: [
          {
            linkId: "1",
            text: "Tepat Pasien",
            answer: [{ valueBoolean: telaahChecklist.tepatPasien }]
          },
          {
            linkId: "2",
            text: "Tepat Obat",
            answer: [{ valueBoolean: telaahChecklist.tepatObat }]
          },
          {
            linkId: "3",
            text: "Tepat Dosis",
            answer: [{ valueBoolean: telaahChecklist.tepatDosis }]
          },
          {
            linkId: "4",
            text: "Tepat Rute",
            answer: [{ valueBoolean: telaahChecklist.tepatRute }]
          },
          {
            linkId: "5",
            text: "Tepat Waktu/Frekuensi",
            answer: [{ valueBoolean: telaahChecklist.tepatWaktu }]
          }
        ]
      };

      const dispenseItems = resep.details.map(d => ({
        resepId: resep.id,
        resepDetailId: d.id,
        kodeObat: d.obat.kodeObat,
        pasienIhs: patientIhs,
        practitionerIhs: practitionerIhs,
        encounterId: encounterId,
        namaObat: d.obat.namaObat,
        sediaan: d.obat.sediaan,
        jumlah: d.jumlah,
        aturanPakai: d.aturanPakai
      }));

      // Submit paralel ke SATUSEHAT
      try {
        await useApotekerStore.getState().submitTelaahDanDispense(questionnaireData, dispenseItems);
      } catch (e) {
        console.warn('[SATUSEHAT Dispense Warning]', e);
      }

      setSuccessMessage('Obat berhasil diserahkan kepada pasien, stok fisik faskes telah terpotong via Auto-FEFO, dan status resep telah diperbarui!');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memproses resep. Pastikan stok obat mencukupi atau status pembayaran telah diverifikasi.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
        <p className="text-gray-500 font-medium text-sm">Memuat detail resep...</p>
      </div>
    );
  }

  if (!resep || error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-4">
        <div className="bg-red-50 text-red-700 p-6 border border-red-200 text-center rounded-2xl shadow-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-bold mb-1">Terjadi Kendala</h3>
          <p className="text-sm text-red-600 mb-4">{error || 'Resep tidak ditemukan'}</p>
          <Link 
            href="/apoteker/antrian" 
            className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Antrian
          </Link>
        </div>
      </div>
    );
  }

  const isObatPulang = resep.details.some(d => d.catatan?.toLowerCase().includes('pulang')) ||
                       resep.kunjungan.jenisPelayanan === 'Rawat Inap';

  const isBpjs = Boolean(resep.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS'));
  const isUkm = resep.kunjungan.jenisPelayanan === 'UKM';
  const isTagihanLunas = resep.kunjungan.tagihan?.statusTagihan === 'LUNAS';
  const isPaid = isTagihanLunas || isBpjs || isUkm;

  const hasInsufficientStock = resep.details.some(d => d.obat.stok < d.jumlah);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link 
            href="/apoteker/antrian" 
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Telaah & Penyerahan Obat
              </h1>
              {isObatPulang ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  <Home className="w-3.5 h-3.5 text-purple-600" />
                  Obat Pulang Rawat Inap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  <Activity className="w-3.5 h-3.5 text-sky-600" />
                  Resep Rawat Jalan
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Verifikasi 5 Benar klinis sebelum obat diserahkan kepada pasien.
            </p>
          </div>
        </div>

        {/* Status Payment Badge */}
        <div>
          {isTagihanLunas ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tagihan Lunas di Kasir
            </span>
          ) : isBpjs || isUkm ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {isUkm ? 'Program UKM (Non-Tagihan)' : 'Dijamin BPJS Kesehatan'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Menunggu Pelunasan Kasir
            </span>
          )}
        </div>
      </div>

      {/* Warning/Info Banners */}
      {!isPaid && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900">Perhatian: Pasien Belum Melunasi Tagihan di Kasir</h4>
            <p className="text-amber-700 text-xs sm:text-sm mt-1">
              Pasien ini terdaftar sebagai pasien Umum dan tagihannya belum dilunasi di loket Kasir.
              Sesuai SOP, mohon arahkan pasien atau keluarga untuk menyelesaikan administrasi di Kasir terlebih dahulu sebelum obat diserahkan. Tombol penyerahan obat dinonaktifkan sampai status pembayaran lunas.
            </p>
          </div>
        </div>
      )}

      {hasInsufficientStock && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-rose-900">Peringatan: Stok Obat Master Tidak Mencukupi</h4>
            <p className="text-rose-700 text-xs sm:text-sm mt-1">
              Terdapat satu atau lebih item obat yang stok fisiknya di faskes kurang dari jumlah yang diminta. Lakukan restok farmasi atau konfirmasi pergantian obat ke dokter perujuk.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Identitas Pasien & Dokter */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-4 h-4 text-teal-600" /> Identitas Pasien
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-medium">No. Rekam Medis</p>
                <p className="text-sm font-mono font-bold text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded mt-0.5">
                  {resep.pasien.noRM}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Nama Lengkap</p>
                <p className="text-base font-bold text-gray-900">{resep.pasien.namaLengkap}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Jenis Kelamin</p>
                  <p className="text-gray-800 font-semibold mt-0.5">
                    {resep.pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Tanggal Lahir</p>
                  <p className="text-gray-800 font-semibold mt-0.5">
                    {new Date(resep.pasien.tanggalLahir).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Penjamin</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">
                  {resep.pasien.penjamin?.jenisPenjamin || 'Pasien Umum / Tunai'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Stethoscope className="w-4 h-4 text-indigo-600" /> Asal Poliklinik & Dokter
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium">Poliklinik / Ruangan</p>
                <p className="font-bold text-gray-900 mt-0.5">{resep.kunjungan.poliklinik.namaPoli}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Dokter Penulis Resep</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {resep.kunjungan.jenisPelayanan === 'UKM' ? 'Petugas UKM: ' : 'Dr. '}
                  {resep.dokter?.namaLengkap || 'Dokter Jaga'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Waktu Resep Diterbitkan</p>
                <p className="text-gray-600 mt-0.5 font-mono text-xs">
                  {new Date(resep.tanggalResep).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Resep & Telaah SATUSEHAT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Rincian Obat */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Rincian Obat Resep
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Siapkan item obat dan periksa kesesuaian dosis serta etiket pemakaian.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold">
                {resep.details.length} Item
              </span>
            </div>

            <div className="p-5 space-y-3">
              {resep.details.map((detail, index) => {
                const isStockSufficient = detail.obat.stok >= detail.jumlah;
                const isPulangItem = detail.catatan?.toLowerCase().includes('pulang');

                return (
                  <div 
                    key={detail.id} 
                    className={`p-4 border rounded-xl transition-all ${
                      isStockSufficient ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-rose-300 bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                            {detail.obat.namaObat}
                          </h4>
                          {isPulangItem && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                              Obat Pulang
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 ml-8">
                          <span className="font-mono">{detail.obat.kodeObat}</span>
                          <span>•</span>
                          <span>{detail.obat.sediaan}</span>
                        </div>

                        <div className="mt-2 ml-8 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs">
                          <span className="font-bold text-indigo-900 uppercase text-[10px] block mb-0.5">
                            Aturan Pakai:
                          </span>
                          <span className="text-indigo-800 font-medium">
                            {detail.aturanPakai}
                          </span>
                          {detail.catatan && (
                            <p className="text-indigo-600 mt-1 pt-1 border-t border-indigo-100 italic">
                              Catatan: {detail.catatan}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-gray-400 font-medium">Qty Disiapkan</div>
                        <div className="text-2xl font-black text-teal-600">{detail.jumlah}</div>
                        <div className={`text-[11px] font-semibold mt-1 px-2 py-0.5 rounded-md inline-block border ${
                          isStockSufficient 
                            ? 'text-gray-600 border-gray-200 bg-gray-50' 
                            : 'text-rose-700 border-rose-300 bg-rose-100'
                        }`}>
                          Stok: {detail.obat.stok}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Checklist Telaah Resep 5 Benar (SATUSEHAT) */}
          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                Kajian Telaah Resep Klinis (5 Benar)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Wajib diverifikasi apoteker sebelum obat diserahkan (sinkronisasi SATUSEHAT).
              </p>
            </div>

            <div className="space-y-2">
              {Object.keys(telaahChecklist).map((key) => {
                const labelMap: Record<string, string> = {
                  tepatPasien: '1. Tepat Pasien (Identitas fisik & nomor rekam medis telah dicocokkan)',
                  tepatObat: '2. Tepat Obat (Nama obat, sediaan, dan instruksi dokter sudah jelas)',
                  tepatDosis: '3. Tepat Dosis (Jumlah dan takaran obat rasional serta aman)',
                  tepatRute: '4. Tepat Rute (Rute pemberian obat oral/topikal/inhalasi tepat)',
                  tepatWaktu: '5. Tepat Waktu / Frekuensi (Jadwal minum dan signa aturan pakai logis)'
                };

                const itemKey = key as keyof typeof telaahChecklist;

                return (
                  <label 
                    key={key} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      telaahChecklist[itemKey] 
                        ? 'bg-teal-50/60 border-teal-300 text-teal-900' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={telaahChecklist[itemKey]} 
                      onChange={() => toggleCheck(itemKey)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs sm:text-sm font-medium">{labelMap[key]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                Kesiapan: {allChecked ? (
                  <span className="text-teal-600 font-bold">5 Kriteria Telaah Lengkap</span>
                ) : (
                  <span className="text-amber-600 font-semibold">Centang seluruh 5 kriteria telaah</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Stok fisik faskes akan otomatis terpotong (Auto-FEFO) saat obat diserahkan.
              </p>
            </div>

            <button
              onClick={handleProses}
              disabled={isProcessing || hasInsufficientStock || !isPaid || !allChecked}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses Penyerahan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai & Serahkan Obat
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-200">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Konfirmasi Penyerahan Obat</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Apakah seluruh item obat telah disiapkan dengan benar dan sesuai etiket? Stok fisik faskes akan dipotong secara Auto-FEFO dan data penyerahan akan disinkronkan ke SATUSEHAT.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDispense}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
              >
                Ya, Serahkan Obat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Penyerahan Obat Berhasil!</h3>
            <p className="text-sm text-gray-600 mt-2">
              {successMessage}
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/apoteker/antrian');
              }}
              className="w-full mt-6 py-2.5 px-4 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
            >
              Kembali ke Antrian Resep
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
