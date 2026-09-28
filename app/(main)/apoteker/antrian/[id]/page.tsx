"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Stethoscope, Pill, CheckCircle, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { farmasiService, ResepData } from '@/services/farmasi.service';
import { useApotekerStore } from '@/store/apoteker.store';

export default function ProsesResepPage() {
  const { id } = useParams();
  const router = useRouter();
  const [resep, setResep] = useState<ResepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchResep();
  }, [id]);

  const fetchResep = async () => {
    try {
      const data = await farmasiService.getResepById(id as string);
      setResep(data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data resep. Resep mungkin tidak ditemukan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Checklist Telaah Resep apoteker
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

    if (!confirm('Apakah Anda yakin obat sudah disiapkan dengan benar? Data telaah kuesioner dan penyerahan obat akan disinkronisasikan ke SATUSEHAT.')) {
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      // 1. Simpan/proses transaksi obat secara lokal di database SIKDA
      await farmasiService.prosesResep(id as string);

      // 2. Hubungkan ke SatuSehat Store untuk pengiriman QuestionnaireResponse & MedicationDispense
      const patientIhs = resep.pasien.noIHS || '';
      const encounterId = resep.kunjungan.encounterId || '';
      
      // Mengambil practitionerIhs langsung dari data dokter lokal
      const practitionerIhs = resep.dokter?.tenagaMedis?.noIHS || '';

      const questionnaireData = {
        pasienIhs: patientIhs,
        encounterId: encounterId,
        practitionerIhs: practitionerIhs,
        patientName: resep.pasien.namaLengkap,
        practitionerName: resep.dokter?.namaLengkap || 'drg. Anisa Rahmawati, Sp.KG',
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

      // Panggil store apoteker untuk submit paralel ke SATUSEHAT
      const ssSuccess = await useApotekerStore.getState().submitTelaahDanDispense(questionnaireData, dispenseItems);

      if (ssSuccess) {
        alert('Resep berhasil diproses dan disinkronkan ke SATUSEHAT! Pasien diarahkan ke Kasir.');
      } else {
        alert('Resep diproses secara lokal tetapi terjadi kendala saat sinkronisasi ke SATUSEHAT.');
      }

      router.push('/apoteker/antrian');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memproses resep. Pastikan stok obat mencukupi.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
        <p className="text-gray-500">Memuat detail resep...</p>
      </div>
    );
  }

  if (!resep || error) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 border border-red-200 text-center rounded-none shadow-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Terjadi Kesalahan</h3>
          <p>{error}</p>
          <Link href="/apoteker/antrian" className="mt-4 inline-block px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
            Kembali ke Antrian
          </Link>
        </div>
      </div>
    );
  }

  // Hitung apakah ada obat yang stoknya kurang
  const hasInsufficientStock = resep.details.some(d => d.obat.stok < d.jumlah);
  
  // Cek apakah sudah dibayar di kasir
  const isPaid = resep.kunjungan.jenisPelayanan === 'UKM' || 
                 (resep.kunjungan.tagihan && resep.kunjungan.tagihan.statusTagihan === 'LUNAS');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto p-8 pb-20">
      <Link href="/apoteker/antrian" className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 group">
        <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
        Kembali ke Daftar Antrian
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Kolom Kiri: Data Pasien & Dokter */}
        <div className="md:w-1/3 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-none">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-teal-600" /> Identitas Pasien
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-medium">No. Rekam Medis</p>
                <p className="text-sm font-mono font-bold text-slate-900">{resep.pasien.noRM}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nama Lengkap</p>
                <p className="text-base font-bold text-slate-900">{resep.pasien.namaLengkap}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Jenis Kelamin</p>
                  <p className="text-sm text-slate-900">{resep.pasien.jenisKelamin}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Tanggal Lahir</p>
                  <p className="text-sm text-slate-900">{new Date(resep.pasien.tanggalLahir).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-none">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Stethoscope className="w-4 h-4 text-indigo-600" /> Dokter Perujuk
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-medium">Nama Dokter</p>
                <p className="text-sm font-bold text-slate-900">
                  {resep.kunjungan.jenisPelayanan === 'UKM' ? 'Petugas UKM: ' : 'Dr. '}
                  {resep.dokter?.namaLengkap || 'Sistem'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Asal Poliklinik</p>
                <p className="text-sm text-slate-900">{resep.kunjungan.poliklinik.namaPoli}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Waktu Resep Dibuat</p>
                <p className="text-sm text-slate-900">{new Date(resep.tanggalResep).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Obat & Telaah Resep */}
        <div className="md:w-2/3 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" />
                Rincian Resep Obat
              </h2>
              <p className="text-sm text-slate-500 mt-1">Harap siapkan obat sesuai dengan daftar berikut ini.</p>
            </div>

            <div className="p-6 overflow-auto space-y-4">
              {hasInsufficientStock && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-rose-500 mr-2" />
                    <p className="text-sm text-rose-700 font-bold">
                      Peringatan: Terdapat obat dengan stok tidak mencukupi. Anda tidak dapat menyelesaikan resep ini.
                    </p>
                  </div>
                </div>
              )}

              {!isPaid && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    <div>
                      <p className="text-sm text-amber-800 font-bold">
                        Menunggu Pembayaran Kasir
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Pasien belum menyelesaikan pembayaran di Kasir. Tombol "Selesai Siapkan Obat" akan terkunci sampai pembayaran lunas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {resep.details.map((detail, index) => {
                  const isStockSufficient = detail.obat.stok >= detail.jumlah;
                  
                  return (
                    <div key={detail.id} className={`p-4 border ${isStockSufficient ? 'border-slate-200 bg-white' : 'border-rose-300 bg-rose-50'} shadow-sm relative overflow-hidden`}>
                      {/* Badge Number */}
                      <div className="absolute top-0 left-0 bg-teal-600 text-white w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="ml-4 pl-2 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base text-slate-900">{detail.obat.namaObat}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-slate-500">{detail.obat.kodeObat}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-xs text-slate-600">{detail.obat.sediaan}</span>
                          </div>
                          
                          <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 inline-block">
                            <p className="text-[10px] font-bold text-indigo-800 uppercase mb-1">Aturan Pakai:</p>
                            <p className="text-sm text-indigo-900 font-medium">{detail.aturanPakai}</p>
                            {detail.catatan && (
                              <p className="text-sm text-indigo-700 mt-1 border-t border-indigo-200 pt-1">Catatan: {detail.catatan}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-medium mb-1">Jumlah Disiapkan</div>
                          <div className="text-2xl font-black text-teal-600">{detail.jumlah}</div>
                          
                          <div className={`mt-3 text-xs font-medium px-2 py-1 inline-block border ${isStockSufficient ? 'text-slate-600 border-slate-200 bg-slate-50' : 'text-rose-700 border-rose-300 bg-rose-100'}`}>
                            Stok Master: {detail.obat.stok}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PANEL TELAAH RESEP APOTEKER (QuestionnaireResponse) */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-none space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                Checklist Telaah & Kajian Resep (SATUSEHAT)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Lakukan verifikasi klinis berikut ini sebelum obat diserahkan ke pasien.</p>
            </div>

            <div className="space-y-2">
              {Object.keys(telaahChecklist).map((key) => {
                const labelMap: Record<string, string> = {
                  tepatPasien: 'Tepat Pasien (Identitas fisik & berkas rekam medis sesuai)',
                  tepatObat: 'Tepat Obat (Nama obat, jenis sediaan, dan instruksi jelas)',
                  tepatDosis: 'Tepat Dosis (Jumlah dan dosis masuk akal)',
                  tepatRute: 'Tepat Rute (Rute pemberian obat aman dan dipahami)',
                  tepatWaktu: 'Tepat Waktu/Frekuensi (Frekuensi pemakaian obat logis)'
                };

                const itemKey = key as keyof typeof telaahChecklist;

                return (
                  <label 
                    key={key} 
                    className={`flex items-center gap-3 p-3 border transition-colors cursor-pointer ${telaahChecklist[itemKey] ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={telaahChecklist[itemKey]} 
                      onChange={() => toggleCheck(itemKey)}
                      className="w-4.5 h-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-500 rounded-none"
                    />
                    <span className="text-sm font-medium text-slate-700">{labelMap[key]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-none flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Item Obat: <span className="font-bold text-slate-900">{resep.details.length}</span></p>
              <p className="text-xs text-slate-500 mt-1">Harap pastikan semua indikator telaah resep di atas telah dicentang.</p>
            </div>
            
            <button
              onClick={handleProses}
              disabled={isProcessing || hasInsufficientStock || !isPaid || !allChecked}
              className="flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengirim data...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Selesai & Serahkan Obat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
