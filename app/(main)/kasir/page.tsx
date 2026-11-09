"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Users, Search, Loader2, RefreshCw, CheckCircle2,
  Receipt, Wallet, Banknote, Printer, FileText, Download, X, ArrowRight,
  TestTube, Radio
} from 'lucide-react';
import { useKasirStore } from '@/store/kasir.store';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import CetakLaboratoriumModal from '@/components/kasir/CetakLaboratoriumModal';
import CetakKwitansiPembayaranModal from '@/components/kasir/CetakKwitansiPembayaranModal';
import CetakSuratRujukanModal from '@/components/kasir/CetakSuratRujukanModal';
import CetakRadiologiModal from '@/components/kasir/CetakRadiologiModal';

export default function KasirPage() {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [bayarAmount, setBayarAmount] = useState<string>('');
  const [metodeBayar, setMetodeBayar] = useState<string>('Tunai');
  const printRef = useRef<HTMLDivElement>(null);

  // Modal State untuk Berkas Penyerahan Pasien (Opsi 1)
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isRadiologiModalOpen, setIsRadiologiModalOpen] = useState(false);
  const [isRujukanModalOpen, setIsRujukanModalOpen] = useState(false);
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);

  const {
    antrian, selectedKunjungan, tagihanAktif,
    isLoadingAntrian, isLoadingTagihan, isProcessing,
    fetchAntrian, pilihPasien, prosesPembayaran, clearSelection
  } = useKasirStore();

  useEffect(() => {
    fetchAntrian();
    return () => {
      clearSelection();
    };
  }, []);

  useEffect(() => {
    if (selectedKunjungan) {
      const penjamin = selectedKunjungan.pasien?.penjamin?.jenisPenjamin?.toUpperCase() || 'UMUM';
      if (penjamin.includes('BPJS') || penjamin.includes('KIS')) {
        setMetodeBayar('BPJS');
        setBayarAmount('0');
      } else {
        setMetodeBayar('Tunai');
        setBayarAmount('');
      }
    }
  }, [selectedKunjungan]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Struk_Pembayaran_${tagihanAktif?.id}`,
  });

  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handleBayar = async () => {
    if (!tagihanAktif) return;
    
    let nominal = 0;
    if (metodeBayar !== 'BPJS') {
      nominal = parseInt(bayarAmount.replace(/[^0-9]/g, ''));
      if (isNaN(nominal) || nominal < tagihanAktif.totalBiaya) {
        Swal.fire('Error', 'Nominal bayar tidak valid atau kurang dari total tagihan', 'error');
        return;
      }
    }

    const success = await prosesPembayaran(tagihanAktif.id, metodeBayar, nominal);
    if (success) {
      setBayarAmount('');
    }
  };

  // Data turunan untuk dokumen pasien (Opsi 1: Satu Pintu Kasir)
  const effectiveKunjungan = tagihanAktif?.kunjungan || selectedKunjungan;
  const activeOrderLab = effectiveKunjungan?.orderLab || selectedKunjungan?.orderLab;
  const activeOrderRadiologi = effectiveKunjungan?.orderRadiologi || selectedKunjungan?.orderRadiologi;
  const activeRujukan = effectiveKunjungan?.rujukanKeluar || selectedKunjungan?.rujukanKeluar;
  const isDirujuk = effectiveKunjungan?.rekamMedis?.statusPulang === 'Dirujuk' || !!activeRujukan;
  const hasDocuments = Boolean(activeOrderLab || activeOrderRadiologi || activeRujukan || isDirujuk);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: QUEUE */}
      <div 
        className="bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 relative flex-shrink-0 max-w-sm"
        style={{ width: sidebarWidth }}
      >
        {/* RESIZER HANDLE */}
        <div 
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-300 active:bg-emerald-500 z-50 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            
            const doDrag = (dragEvent: MouseEvent) => {
              let newWidth = startWidth + (dragEvent.clientX - startX);
              if (newWidth > 384) newWidth = 384; 
              if (newWidth < 200) newWidth = 200; 
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
        <div className="p-4 border-b border-gray-200 bg-emerald-50/50">
          <h2 className="text-lg font-bold text-emerald-800 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
            Antrian Pembayaran
          </h2>
          <div className="mt-3 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
            <span className="truncate flex-1 min-w-[120px]">Menunggu pembayaran</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-none font-bold">Total: {antrian.length}</span>
              <button onClick={() => fetchAntrian()} className="p-1 hover:bg-emerald-100 rounded-none transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoadingAntrian ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingAntrian && antrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm font-medium">Memuat antrian...</p>
            </div>
          ) : antrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-300" />
              <p className="text-sm font-medium">Belum ada tagihan baru</p>
            </div>
          ) : (
            antrian.map((k) => (
              <div 
                key={k.id}
                onClick={() => pilihPasien(k)}
                className={`p-3 border-l-4 cursor-pointer transition-all ${
                  selectedKunjungan?.id === k.id 
                    ? 'border-l-emerald-600 bg-emerald-50 shadow-md border-y border-r border-emerald-200' 
                    : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap justify-between items-start gap-1.5 mb-2">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-500 break-all">{k.jamRegistrasi} • {k.pasien.noRM}</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-bold uppercase shadow-sm whitespace-nowrap rounded-none bg-orange-100 text-orange-800">
                    BELUM LUNAS
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-600 font-bold flex flex-shrink-0 items-center justify-center text-xs mt-0.5">
                    {k.noAntrian.split('-').pop()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 leading-tight truncate" title={k.pasien.namaLengkap}>{k.pasien.namaLengkap}</h3>
                    <div className="text-[10px] sm:text-xs text-gray-600 flex flex-wrap items-center gap-x-1 mt-0.5">
                      <span className="text-emerald-600 font-semibold truncate">{k.poliklinik?.namaPoli}</span>
                    </div>

                    {/* BADGES BERKAS PENUNJANG / RUJUKAN DI DAFTAR ANTREAN */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {k.orderLab && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                          <TestTube className="w-2.5 h-2.5 text-slate-600" /> Lab
                        </span>
                      )}
                      {k.orderRadiologi && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                          <Radio className="w-2.5 h-2.5 text-slate-600" /> Rad
                        </span>
                      )}
                      {(k.rujukanKeluar || k.rekamMedis?.statusPulang === 'Dirujuk') && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                          <FileText className="w-2.5 h-2.5 text-slate-600" /> Rujuk
                        </span>
                      )}
                    </div>

                    {k.tagihan && (
                      <div className="text-[11px] font-bold text-slate-700 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1">
                        <span className="text-slate-400 text-[10px]">{k.tagihan.details?.length || 0} Layanan/Obat</span>
                        <span className="text-emerald-700 font-mono font-black">{formatRupiah(k.tagihan.totalBiaya)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: MAIN FORM */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden min-w-0">
        {selectedKunjungan ? (
          <>
            {/* Header Pasien */}
            <div className="p-4 border-b border-gray-200 shadow-sm flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-none flex items-center justify-center font-bold text-2xl mr-4 bg-emerald-100 text-emerald-700">
                  {selectedKunjungan.pasien.namaLengkap.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedKunjungan.pasien.namaLengkap}</h1>
                    
                    {/* CHIPS BERKAS SIAP SERAH DI HEADER */}
                    {hasDocuments && (
                      <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                        {activeOrderLab && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                            <TestTube className="w-3 h-3 text-slate-600" /> Ada Hasil Lab
                          </span>
                        )}
                        {activeOrderRadiologi && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                            <Radio className="w-3 h-3 text-slate-600" /> Ada Radiologi
                          </span>
                        )}
                        {(activeRujukan || isDirujuk) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                            <FileText className="w-3 h-3 text-slate-600" /> Rujukan Keluar
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 flex items-center mt-1 font-medium">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 mr-2 text-gray-800 rounded-none">{selectedKunjungan.pasien.noRM}</span>
                    <span>{getAge(selectedKunjungan.pasien.tanggalLahir)} Tahun</span>
                    <span className="mx-2">•</span>
                    <span className="text-emerald-600 font-bold">{selectedKunjungan.jenisPelayanan}</span>
                    {selectedKunjungan.pasien?.penjamin?.namaPenjamin ? (
                      <>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-0.5 text-xs font-bold ${
                          selectedKunjungan.pasien.penjamin.namaPenjamin.toUpperCase().includes('BPJS')
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {selectedKunjungan.pasien.penjamin.namaPenjamin}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mx-2">•</span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                          Pasien Umum
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nomor Antrian</div>
                  <div className="text-2xl font-mono font-bold text-gray-900">
                    {selectedKunjungan.noAntrian}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => clearSelection()}
                  className="p-2 ml-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 hover:border-rose-300 transition-colors"
                  title="Tutup / Batal Pilih Pasien Ini"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Loading Overlay */}
            {isLoadingTagihan && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Mengkalkulasi tagihan...</p>
                </div>
              </div>
            )}
            
            {!isLoadingTagihan && tagihanAktif && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
                
                {/* Kolom Kiri: Rincian Biaya & Berkas Penyerahan */}
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" /> Rincian Biaya
                      </h3>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button" 
                          onClick={() => setIsKwitansiModalOpen(true)} 
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors" 
                          title="Cetak Kwitansi Pembayaran Layanan Kesehatan (Format Resmi A4)"
                        >
                          <FileText className="w-3.5 h-3.5" /> Kwitansi Resmi (A4)
                        </button>
                        <span className="text-xs font-mono text-gray-500">ID: {tagihanAktif.id.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 text-sm">
                        {(tagihanAktif.details || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-800">{item.namaItem}</div>
                              <div className="mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide ${
                                  item.kategori === 'Potongan / DP' 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {item.kategori}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">{item.jumlah}</td>
                            <td className="px-6 py-4 text-right text-gray-600">{formatRupiah(item.hargaSatuan)}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatRupiah(item.subTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-emerald-50/50">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right font-extrabold text-gray-900 uppercase text-sm">Total Tagihan</td>
                          <td className="px-6 py-4 text-right font-extrabold text-emerald-700 text-xl">{formatRupiah(tagihanAktif.totalBiaya)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* PANEL DOKUMEN & BERKAS PENYERAHAN PASIEN (OPSI 1: SATU PINTU KASIR) */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold flex items-center gap-2 text-sm sm:text-base">
                          <FileText className="w-5 h-5 text-emerald-400" /> Berkas & Dokumen Penyerahan Pasien
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Cetak langsung berkas klinis di loket kasir saat pembayaran selesai untuk mempermudah pasien
                        </p>
                      </div>
                      {hasDocuments ? (
                        <span className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 font-bold uppercase tracking-wider">
                          Dokumen Tersedia
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 font-semibold uppercase tracking-wider">
                          Tidak Ada Berkas
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      {hasDocuments ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          
                          {/* KARTU 1: HASIL LABORATORIUM */}
                          {activeOrderLab && (
                            <div className="border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200">
                                    <TestTube className="w-3.5 h-3.5 text-slate-600" /> Laboratorium
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                                    {activeOrderLab.status || 'DIPROSES'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Lembar Hasil Uji Lab</h4>
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                  {activeOrderLab.noOrder || `ORDER-${activeOrderLab.id?.substring(0, 8)}`}
                                </p>
                                <div className="mt-2 text-xs text-gray-600 space-y-1 border-t border-slate-100 pt-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Pemeriksaan:</span>
                                    <span className="font-bold text-gray-800">{activeOrderLab.details?.length || 0} Parameter</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Dokter:</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[120px]">
                                      {activeOrderLab.dokter?.namaLengkap || effectiveKunjungan?.dokterTujuan?.namaLengkap || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsLabModalOpen(true)}
                                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
                              >
                                <Printer className="w-3.5 h-3.5" /> Cetak Hasil Lab
                              </button>
                            </div>
                          )}

                          {/* KARTU 2: HASIL RADIOLOGI */}
                          {activeOrderRadiologi && (
                            <div className="border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200">
                                    <Radio className="w-3.5 h-3.5 text-slate-600" /> Radiologi
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                                    {activeOrderRadiologi.hasil ? 'Selesai' : (activeOrderRadiologi.status || 'Order Masuk')}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Lembar Hasil / Pengantar</h4>
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                  ACSN: {activeOrderRadiologi.acsn || 'ACSN-RAD'}
                                </p>
                                <div className="mt-2 text-xs text-gray-600 space-y-1 border-t border-slate-100 pt-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Layanan:</span>
                                    <span className="font-bold text-gray-800">
                                      {activeOrderRadiologi.details?.[0]?.namaTindakan || activeOrderRadiologi.jenisPemeriksaan || 'Foto Rontgen'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Dokter:</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[120px]">
                                      {activeOrderRadiologi.dokter?.namaLengkap || effectiveKunjungan?.dokterTujuan?.namaLengkap || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsRadiologiModalOpen(true)}
                                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
                              >
                                <Printer className="w-3.5 h-3.5" /> Cetak Radiologi
                              </button>
                            </div>
                          )}

                          {/* KARTU 3: SURAT RUJUKAN KELUAR */}
                          {(activeRujukan || isDirujuk) && (
                            <div className="border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200">
                                    <FileText className="w-3.5 h-3.5 text-slate-600" /> Rujukan Luar
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                                    Faskes Lanjutan
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Surat Rujukan Keluar</h4>
                                <p className="text-xs text-slate-700 mt-1 font-semibold truncate" title={activeRujukan?.faskesTujuan || activeRujukan?.rumahSakitTujuan || 'Rumah Sakit Rujukan'}>
                                  Tujuan: {activeRujukan?.faskesTujuan || activeRujukan?.rumahSakitTujuan || 'Faskes Rujukan / RS'}
                                </p>
                                <div className="mt-2 text-xs text-gray-600 space-y-1 border-t border-slate-100 pt-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Poli Tujuan:</span>
                                    <span className="font-bold text-gray-800 truncate max-w-[120px]">
                                      {activeRujukan?.poliTujuan || '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Diagnosa:</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[120px]" title={effectiveKunjungan?.diagnosis?.[0]?.icd10?.nama_diagnosis || '-'}>
                                      {effectiveKunjungan?.diagnosis?.[0]?.icd10?.kode_icd10 || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsRujukanModalOpen(true)}
                                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
                              >
                                <Printer className="w-3.5 h-3.5" /> Cetak Surat Rujukan
                              </button>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <span>
                            Pasien tidak memiliki order penunjang laboratorium, radiologi, atau rujukan keluar faskes. Kasir cukup menyerahkan struk pembayaran dan resep/obat (jika ada).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Pembayaran */}
                <div className="w-full lg:w-96 flex-shrink-0">
                  {tagihanAktif.statusTagihan === 'LUNAS' ? (
                     <div className="bg-white border border-emerald-200 shadow-sm p-6 text-center space-y-4 relative overflow-hidden">
                       <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto relative z-10" />
                       <div>
                         <h3 className="text-xl font-extrabold text-emerald-800">LUNAS</h3>
                         <p className="text-sm text-gray-500 mt-1">Pembayaran telah berhasil diproses.</p>
                       </div>
                       
                       <div className="bg-emerald-50 p-4 text-left text-sm space-y-2 border border-emerald-100">
                         <div className="flex justify-between"><span className="text-gray-500">Metode</span><span className="font-bold text-gray-900">{tagihanAktif.pembayaran?.metodePembayaran}</span></div>
                         {tagihanAktif.pembayaran?.metodePembayaran !== 'BPJS' && (
                           <>
                             <div className="flex justify-between"><span className="text-gray-500">Dibayar</span><span className="font-bold text-gray-900">{formatRupiah(tagihanAktif.pembayaran?.jumlahBayar || 0)}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-bold text-emerald-600">{formatRupiah(tagihanAktif.pembayaran?.kembalian || 0)}</span></div>
                           </>
                         )}
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                         <button onClick={handlePrint} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 shadow-md transition-colors flex justify-center items-center gap-1.5 text-xs">
                           <Printer className="w-4 h-4" /> Cetak Struk
                         </button>
                         <button 
                           onClick={() => { 
                             clearSelection(); 
                             fetchAntrian(); 
                           }} 
                           className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 shadow-md transition-colors flex justify-center items-center gap-1.5 text-xs"
                         >
                           <CheckCircle2 className="w-4 h-4" /> Selesai
                         </button>
                       </div>

                       {/* BAGIAN CETAK DOKUMEN PENYERAHAN PASIEN SETELAH LUNAS */}
                       {hasDocuments && (
                         <div className="pt-4 border-t border-emerald-200 text-left space-y-2.5">
                           <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                             <span>Dokumen Siap Serah:</span>
                             <span className="text-[10px] text-slate-600 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5">One-Stop Print</span>
                           </div>
                           
                           <div className="space-y-1.5">
                             {activeOrderLab && (
                               <button
                                 type="button"
                                 onClick={() => setIsLabModalOpen(true)}
                                 className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold py-2 px-3 transition-colors flex items-center justify-between text-xs"
                               >
                                 <span className="flex items-center gap-1.5">
                                   <TestTube className="w-3.5 h-3.5 text-slate-600" /> Cetak Hasil Lab
                                 </span>
                                 <Printer className="w-3.5 h-3.5 text-slate-500" />
                               </button>
                             )}

                             {activeOrderRadiologi && (
                               <button
                                 type="button"
                                 onClick={() => setIsRadiologiModalOpen(true)}
                                 className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold py-2 px-3 transition-colors flex items-center justify-between text-xs"
                               >
                                 <span className="flex items-center gap-1.5">
                                   <Radio className="w-3.5 h-3.5 text-slate-600" /> Cetak Radiologi
                                 </span>
                                 <Printer className="w-3.5 h-3.5 text-slate-500" />
                               </button>
                             )}

                             {(activeRujukan || isDirujuk) && (
                               <button
                                 type="button"
                                 onClick={() => setIsRujukanModalOpen(true)}
                                 className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold py-2 px-3 transition-colors flex items-center justify-between text-xs"
                               >
                                 <span className="flex items-center gap-1.5">
                                   <FileText className="w-3.5 h-3.5 text-slate-600" /> Cetak Surat Rujukan
                                 </span>
                                 <Printer className="w-3.5 h-3.5 text-slate-500" />
                               </button>
                             )}
                           </div>
                         </div>
                       )}

                       {/* Hidden Print Component */}
                       <div className="hidden">
                         <div ref={printRef} className="p-8 text-black bg-white max-w-[80mm] mx-auto font-mono text-sm" style={{ width: '80mm' }}>
                            <div className="text-center mb-6 border-b border-dashed border-gray-400 pb-4">
                              <h2 className="font-bold text-lg">KLINIK KESEHATAN</h2>
                              <p className="text-xs">Jl. Contoh No. 123, Kota</p>
                              <p className="text-xs">Telp: 021-1234567</p>
                            </div>
                            
                            <div className="mb-4 text-xs space-y-1">
                              <div className="flex justify-between"><span>No.</span><span>{tagihanAktif.id.substring(0,8).toUpperCase()}</span></div>
                              <div className="flex justify-between"><span>Tgl.</span><span>{new Date().toLocaleDateString('id-ID')}</span></div>
                              <div className="flex justify-between"><span>Pasien</span><span>{selectedKunjungan.pasien.namaLengkap.substring(0,15)}</span></div>
                            </div>

                            <div className="border-t border-b border-dashed border-gray-400 py-3 mb-4 space-y-2">
                              {tagihanAktif.details.map((item, i) => (
                                <div key={i} className="text-xs">
                                  <div className="truncate">{item.namaItem}</div>
                                  <div className="flex justify-between pl-4">
                                    <span>{item.jumlah} x {item.hargaSatuan}</span>
                                    <span>{item.subTotal}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="text-xs space-y-1 mb-6">
                              <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatRupiah(tagihanAktif.totalBiaya)}</span></div>
                              <div className="flex justify-between"><span>BAYAR ({tagihanAktif.pembayaran?.metodePembayaran})</span><span>{formatRupiah(tagihanAktif.pembayaran?.jumlahBayar || 0)}</span></div>
                              <div className="flex justify-between"><span>KEMBALI</span><span>{formatRupiah(tagihanAktif.pembayaran?.kembalian || 0)}</span></div>
                            </div>

                            <div className="text-center text-xs">
                              <p>Terima Kasih</p>
                              <p>Semoga Lekas Sembuh</p>
                            </div>
                         </div>
                       </div>

                     </div>
                  ) : (
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-900 text-white">
                        <h3 className="font-extrabold flex items-center gap-2">
                          <Banknote className="w-5 h-5" /> Proses Pembayaran
                        </h3>
                      </div>
                      <div className="p-6 space-y-5">
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pembayaran</label>
                          <select 
                            value={metodeBayar}
                            onChange={(e) => setMetodeBayar(e.target.value)}
                            disabled={selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS') || selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('KIS')}
                            className="w-full px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            {(() => {
                              const penjamin = selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase() || 'UMUM';
                              const isBpjs = penjamin.includes('BPJS') || penjamin.includes('KIS');
                              
                              if (isBpjs) {
                                return <option value="BPJS">Ditanggung {selectedKunjungan?.pasien?.penjamin?.jenisPenjamin || 'BPJS/KIS'}</option>;
                              } else {
                                return (
                                  <>
                                    <option value="Tunai">Tunai (Cash)</option>
                                    <option value="Transfer">Transfer / QRIS</option>
                                    <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
                                  </>
                                );
                              }
                            })()}
                          </select>
                        </div>

                        {metodeBayar !== 'BPJS' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Uang Diterima</label>
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-gray-500 font-bold">Rp</span>
                              <input 
                                type="text"
                                value={bayarAmount}
                                onChange={(e) => {
                                  // Format angka
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setBayarAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-emerald-500 shadow-sm font-bold text-lg text-gray-900"
                                placeholder="0"
                              />
                            </div>
                            
                            {/* Hitung Kembalian Live */}
                            {bayarAmount && parseInt(bayarAmount.replace(/[^0-9]/g, '')) >= tagihanAktif.totalBiaya && (
                              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-100 flex justify-between">
                                <span>Kembalian:</span>
                                <span className="font-bold">{formatRupiah(parseInt(bayarAmount.replace(/[^0-9]/g, '')) - tagihanAktif.totalBiaya)}</span>
                              </div>
                            )}
                            {bayarAmount && parseInt(bayarAmount.replace(/[^0-9]/g, '')) > 0 && parseInt(bayarAmount.replace(/[^0-9]/g, '')) < tagihanAktif.totalBiaya && (
                              <div className="mt-3 p-2 text-red-600 text-xs font-medium">
                                Jumlah uang kurang dari total tagihan!
                              </div>
                            )}
                          </div>
                        )}

                        {metodeBayar === 'BPJS' && (
                          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                            <p className="font-bold mb-1">Pasien BPJS</p>
                            <p>Seluruh tagihan ditanggung oleh BPJS. Lanjutkan proses untuk menutup tagihan dengan nominal Rp 0.</p>
                          </div>
                        )}

                        <button 
                          onClick={handleBayar}
                          disabled={isProcessing || (metodeBayar !== 'BPJS' && parseInt(bayarAmount.replace(/[^0-9]/g, '')) < tagihanAktif.totalBiaya)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 shadow-md transition-colors flex justify-center items-center gap-2 mt-6"
                        >
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                        </button>

                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Wallet className="w-20 h-20 mb-6 text-gray-200" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Modul Kasir</h2>
            <p className="text-lg font-medium max-w-md">Pilih pasien dari daftar antrian sebelah kiri untuk memproses tagihan pembayaran layanan medis.</p>
          </div>
        )}
      </div>

      {/* MODAL CETAK HASIL LAB (OPSI 1) */}
      {activeOrderLab && (
        <CetakLaboratoriumModal
          isOpen={isLabModalOpen}
          onClose={() => setIsLabModalOpen(false)}
          orderLabData={activeOrderLab}
          pasienData={effectiveKunjungan?.pasien}
        />
      )}

      {/* MODAL CETAK LEMBAR RADIOLOGI (OPSI 1) */}
      {activeOrderRadiologi && (
        <CetakRadiologiModal
          isOpen={isRadiologiModalOpen}
          onClose={() => setIsRadiologiModalOpen(false)}
          orderRadiologiData={activeOrderRadiologi}
          pasienData={effectiveKunjungan?.pasien}
        />
      )}

      {/* MODAL CETAK SURAT RUJUKAN KELUAR (OPSI 1) */}
      {(activeRujukan || isDirujuk) && (
        <CetakSuratRujukanModal
          isOpen={isRujukanModalOpen}
          onClose={() => setIsRujukanModalOpen(false)}
          kunjunganId={effectiveKunjungan?.id || ''}
          kunjunganData={effectiveKunjungan}
        />
      )}

      {/* MODAL CETAK KWITANSI RESMI (FORMAT A4 SEPERTI GAMBAR) */}
      {isKwitansiModalOpen && tagihanAktif && (
        <CetakKwitansiPembayaranModal
          isOpen={isKwitansiModalOpen}
          onClose={() => setIsKwitansiModalOpen(false)}
          tagihanData={tagihanAktif}
          kunjunganData={effectiveKunjungan}
        />
      )}

    </div>
  );
}


