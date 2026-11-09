"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Printer, X, Loader2, CheckCircle2, FileText, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { useRujukanStore } from '@/store/rujukan.store';

interface CetakSuratRujukanModalProps {
  isOpen: boolean;
  onClose: () => void;
  kunjunganId: string;
  kunjunganData?: any;
}

export default function CetakSuratRujukanModal({
  isOpen,
  onClose,
  kunjunganId,
  kunjunganData
}: CetakSuratRujukanModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { rujukanDetail, isLoading, fetchRujukanDetail } = useRujukanStore();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && kunjunganId) {
      setDataLoaded(false);
      fetchRujukanDetail(kunjunganId).finally(() => setDataLoaded(true));
    }
  }, [isOpen, kunjunganId, fetchRujukanDetail]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Rujukan_${rujukanDetail?.pasien?.namaLengkap ? String(rujukanDetail.pasien.namaLengkap).replace(/[^a-zA-Z0-9]/g, '_') : 'Pasien'}_${kunjunganId?.slice(-6) || ''}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        html, body {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .rujukan-print-container {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
    `
  });

  if (!isOpen) return null;

  // Resolusi data dari store atau fallback dari props
  const effectiveData = rujukanDetail || kunjunganData;
  const pasien = effectiveData?.pasien;
  const rekamMedis = effectiveData?.rekamMedis;
  const rujukanKeluar = effectiveData?.rujukanKeluar;
  const dokter = effectiveData?.dokterTujuan || effectiveData?.rujukanKeluar?.dokter;

  // Umur
  let calculatedAge = '';
  if (pasien?.tanggalLahir) {
    const birthYear = new Date(pasien.tanggalLahir).getFullYear();
    calculatedAge = String(new Date().getFullYear() - birthYear);
  }

  // Diagnosa ICD-10
  const diagnosaStr = effectiveData?.diagnosis
    ?.map((d: any) => `${d.icd10?.kode_icd10} - ${d.icd10?.nama_diagnosis}`)
    .join(', ') || effectiveData?.rekamMedis?.diagnosisKlinis || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-300">
        
        {/* Top Header Controls */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-extrabold leading-tight">Cetak Surat Rujukan Keluar Faskes</h2>
              <p className="text-xs text-slate-300">Penyerahan Dokumen Rujukan Resmi ke Rumah Sakit / Faskes Lanjutan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePrint()}
              disabled={isLoading && !effectiveData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Surat Rujukan
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          {isLoading && !effectiveData ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium">Memuat data rujukan pasien...</p>
            </div>
          ) : (
            <div 
              ref={printRef}
              className="rujukan-print-container w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-md p-10 font-sans text-xs flex flex-col justify-between"
              style={{ boxSizing: 'border-box' }}
            >
              <div>
                {/* KOP SURAT RESMI */}
                <div className="border-b-4 border-double border-gray-900 pb-3 mb-6 text-center">
                  <h1 className="text-xl font-black text-gray-900 tracking-wide uppercase">
                    PEMERINTAH KABUPATEN BOGOR / DINAS KESEHATAN
                  </h1>
                  <h2 className="text-lg font-black text-gray-900 uppercase mt-0.5">
                    PUSKESMAS KELAS FKTP RAWAT INAP & UGD
                  </h2>
                  <p className="text-[11px] text-gray-600">Jl. Pelayanan Sehat No. 10, Wilayah Kerja Dinkes Kabupaten Bogor</p>
                  <p className="text-[11px] text-gray-600 font-mono">Telp: (021) 87654321 | Bridging SATUSEHAT & BPJS Kesehatan</p>
                </div>

                {/* NOMOR & TANGGAL */}
                <div className="flex justify-between items-start mb-6 text-xs">
                  <div>
                    <p>Nomor : SR/{new Date().getFullYear()}/{(new Date().getMonth() + 1).toString().padStart(2, '0')}/{rujukanKeluar?.id?.substring(0, 6).toUpperCase() || 'REF-FKTP'}</p>
                    <p>Lamp. : 1 (Satu) Berkas Rekam Medis & Hasil Penunjang</p>
                    <p>Hal : <strong>Rujukan Pasien Eksternal (Integrated)</strong></p>
                  </div>
                  <div className="text-right">
                    <p>Kab. Bogor, {new Date(rujukanKeluar?.tanggalRujukan || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* TUJUAN RUJUKAN */}
                <div className="mb-5 text-xs bg-slate-50 p-3.5 border border-slate-200">
                  <p className="mb-1 text-gray-700">Kepada Yth. Teman Sejawat Dokter Spesialis,</p>
                  <p className="font-extrabold text-gray-900">{rujukanKeluar?.dokterTujuan || 'dr. Spesialis Terkait'}</p>
                  <p className="text-gray-800">Poliklinik / Instalasi Tujuan: <strong className="text-gray-900">{rujukanKeluar?.poliTujuan || 'Poliklinik Rujukan RS'}</strong></p>
                  <p className="text-gray-800">Faskes Rumah Sakit Rujukan: <strong className="text-blue-900 font-bold">{rujukanKeluar?.faskesTujuan || 'Rumah Sakit Rujukan'}</strong></p>
                </div>

                {/* ISI DATA PASIEN */}
                <div className="leading-relaxed space-y-4">
                  <p>Dengan hormat,</p>
                  <p>Mohon pemeriksaan, evaluasi diagnostik, dan penanganan spesialis lebih lanjut terhadap pasien kami:</p>
                  
                  <table className="w-full text-xs ml-2">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="w-36 py-1.5 font-semibold text-gray-700">Nama Lengkap Pasien</td>
                        <td className="w-4 py-1.5">:</td>
                        <td className="font-bold text-gray-900 text-sm">{pasien?.namaLengkap || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-700">No. Rekam Medis (RM)</td>
                        <td className="py-1.5">:</td>
                        <td className="font-mono font-bold text-gray-900">{pasien?.noRM || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-700">NIK (KTP)</td>
                        <td className="py-1.5">:</td>
                        <td className="font-mono">{pasien?.nik || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-700">Umur / Jenis Kelamin</td>
                        <td className="py-1.5">:</td>
                        <td>{calculatedAge ? `${calculatedAge} Tahun` : '-'} / {pasien?.jenisKelamin || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 font-semibold text-gray-700 align-top">Alamat Domisili</td>
                        <td className="py-1.5 align-top">:</td>
                        <td>{pasien?.alamat?.alamatDomisili || pasien?.alamat?.alamatKtp || '-'}</td>
                      </tr>
                      {pasien?.noIHS && (
                        <tr className="border-b border-gray-100">
                          <td className="py-1.5 font-semibold text-blue-700">No. SATUSEHAT IHS</td>
                          <td className="py-1.5 text-blue-700">:</td>
                          <td className="font-mono text-blue-800 font-bold">{pasien.noIHS}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <p className="font-bold text-gray-900 mt-4">Ringkasan Klinis & Indikasi Rujukan:</p>
                  <table className="w-full text-xs ml-2 border border-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-40 p-2.5 bg-gray-50 font-bold text-gray-700 align-top">Anamnesa / Keluhan</td>
                        <td className="p-2.5 text-gray-900 align-top">{rekamMedis?.keluhanUtama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-gray-50 font-bold text-gray-700 align-top">Pemeriksaan Fisik</td>
                        <td className="p-2.5 text-gray-900 align-top whitespace-pre-line">{rekamMedis?.pemeriksaanFisik || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-gray-50 font-bold text-gray-700 align-top">Diagnosa Kerja / ICD-10</td>
                        <td className="p-2.5 font-extrabold text-red-700 align-top">{diagnosaStr}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-gray-50 font-bold text-gray-700 align-top">Terapi & Alasan Rujuk</td>
                        <td className="p-2.5 text-gray-900 align-top">{rekamMedis?.rencanaTerapi || rujukanKeluar?.alasanRujukan || 'Kebutuhan pemeriksaan penunjang/fasilitas rujukan lanjutan'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="mt-4 text-[11px] text-gray-700 leading-normal">
                    Demikian surat rujukan ini kami buat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya. Atas bantuan dan kerja sama teman sejawat, kami sampaikan terima kasih.
                  </p>
                </div>
              </div>

              {/* TANDA TANGAN & CAP VERIFIKASI DOKTER */}
              <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end">
                <div className="text-[10px] text-gray-600 max-w-sm space-y-1">
                  {rujukanKeluar?.satusehatId ? (
                    <div className="p-2.5 border border-emerald-300 bg-emerald-50 rounded-none flex items-center gap-3">
                      <div className="bg-white p-1 border border-emerald-300 shadow-xs flex-shrink-0">
                        <QRCodeSVG 
                          value={`https://satusehat.kemkes.go.id/verify/servicerequest/${rujukanKeluar.satusehatId}`}
                          size={54}
                          level="M"
                        />
                      </div>
                      <div>
                        <p className="font-extrabold text-[10px] text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SATUSEHAT VERIFIED
                        </p>
                        <p className="font-mono text-[9px] text-gray-800 break-all">ID: {rujukanKeluar.satusehatId}</p>
                        <p className="text-[9px] text-gray-500">Scan QR untuk verifikasi bridging rujukan Kemenkes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border border-gray-200 bg-gray-50 text-[10px] text-gray-600">
                      <p className="font-bold">DOKUMEN RUJUKAN RESMI FKTP</p>
                      <p className="text-[9px]">Telah disahkan oleh Loket Administrasi &amp; Kasir Faskes</p>
                    </div>
                  )}
                </div>

                <div className="text-center text-xs w-52">
                  <p className="mb-12 text-gray-700">Dokter Perujuk,</p>
                  <p className="font-extrabold underline text-gray-900">{dokter?.namaLengkap || 'dr. Dokter Pemeriksa'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">SIP / NIP. 19850101 201001 1 001</p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
