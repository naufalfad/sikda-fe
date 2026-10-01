"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Printer, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRujukanStore } from '@/store/rujukan.store';

function CetakSuratRujukanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kunjunganId = searchParams.get('kunjunganId');

  const { rujukanDetail, isLoading, fetchRujukanDetail } = useRujukanStore();

  useEffect(() => {
    if (kunjunganId) {
      fetchRujukanDetail(kunjunganId);
    }
  }, [kunjunganId, fetchRujukanDetail]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Memuat Surat Rujukan...</p>
        </div>
      </div>
    );
  }

  const pasien = rujukanDetail?.pasien;
  const rekamMedis = rujukanDetail?.rekamMedis;
  const rujukanKeluar = rujukanDetail?.rujukanKeluar;
  const dokter = rujukanDetail?.dokterTujuan;
  const tagihan = rujukanDetail?.tagihan;

  const isLunas = tagihan?.statusPembayaran === 'LUNAS' || tagihan?.isLunas === true || rujukanDetail?.statusKunjungan === 'SELESAI';

  if (rujukanDetail && !isLunas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 shadow-md border border-red-200 text-center space-y-4 rounded-none">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Printer className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Pembayaran Belum Dilunasi</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Pasien <strong className="text-gray-900">{pasien?.namaLengkap}</strong> belum melunasi tagihan kunjungan di Kasir. Mohon arahkan pasien ke loket Kasir terlebih dahulu untuk pencetakan Surat Rujukan.
          </p>
          <button
            onClick={() => router.push('/administrasi/antrian-rujukan')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-none transition-colors"
          >
            Kembali ke Antrean Rujukan
          </button>
        </div>
      </div>
    );
  }

  // Hitung Umur Sederhana
  let calculatedAge = '';
  if (pasien?.tanggalLahir) {
    const birthYear = new Date(pasien.tanggalLahir).getFullYear();
    calculatedAge = String(new Date().getFullYear() - birthYear);
  }

  // Gabungkan Diagnosa ICD-10
  const diagnosaStr = rujukanDetail?.diagnosis
    ?.map(d => `${d.icd10?.kode_icd10} - ${d.icd10?.nama_diagnosis}`)
    .join(', ') || '-';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex flex-col items-center">
      {/* CSS Cetak Khusus Halaman A4 & Paksa Hilangkan Header/Footer Default Browser */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important; /* Margin 0 di @page secara otomatis MEMATIKAN Header & Footer bawaan browser (Tanggal, Judul, URL) */
          }
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          main {
            overflow: visible !important;
          }
          .printable-paper {
            padding: 15mm 20mm !important; /* Memberikan margin kertas fisik di dalam elemen kertas */
            box-shadow: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Top Navigation Control Bar (Sembunyi saat print) */}
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center bg-white p-4 shadow-sm border border-gray-200 print:hidden">
        <button
          onClick={() => router.push('/administrasi/antrian-rujukan')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2 rounded-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Antrean Rujukan
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 rounded-none transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Cetak Dokumen Rujukan
        </button>
      </div>

      {/* Panel Kertas Surat (Print Area) - Sama persis seperti /dokter/surat-rujukan */}
      <div className="printable-paper w-full max-w-4xl bg-white shadow-lg p-8 sm:p-12 min-h-[297mm] print:w-full print:shadow-none print:p-0 print:m-0 text-gray-900 flex flex-col justify-between">
        <div>
          {/* Kop Surat */}
          <div className="border-b-4 border-double border-gray-900 pb-4 mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide uppercase">Puskesmas / Fasilitas Kesehatan SIAP-KES</h1>
            <p className="text-sm text-gray-700">Jl. Jendral Sudirman No. 123, Jakarta Pusat</p>
            <p className="text-sm text-gray-700">Telp: (021) 1234567 | Email: info@klinikprima.com</p>
          </div>

          {/* Nomor & Tanggal */}
          <div className="flex justify-between items-start mb-6 text-sm">
            <div>
              <p>Nomor : SR/{new Date().getFullYear()}/{(new Date().getMonth()+1).toString().padStart(2, '0')}/{rujukanKeluar?.id?.substring(0, 5).toUpperCase() || 'REF'}</p>
              <p>Lamp. : -</p>
              <p>Hal : <strong>Rujukan Pasien (SATUSEHAT Integrated)</strong></p>
            </div>
            <div className="text-right">
              <p>Jakarta, {new Date(rujukanKeluar?.tanggalRujukan || Date.now()).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
            </div>
          </div>

          {/* Tujuan */}
          <div className="mb-6 text-sm">
            <p className="mb-1">Kepada Yth. Teman Sejawat,</p>
            <p className="font-bold">{rujukanKeluar?.dokterTujuan ? rujukanKeluar.dokterTujuan : 'dr. .................................................'}</p>
            <p>Di Poliklinik: <strong className="text-gray-900">{rujukanKeluar?.poliTujuan || '...........................................'}</strong></p>
            <p>Rumah Sakit: <strong className="text-blue-900">{rujukanKeluar?.faskesTujuan || '...........................................'}</strong></p>
          </div>

          {/* Isi Surat */}
          <div className="text-sm text-gray-900 leading-relaxed space-y-4">
            <p>Dengan hormat,</p>
            <p>Mohon bantuan pemeriksaan dan penanganan lebih lanjut terhadap penderita:</p>
            
            <table className="w-full ml-4 mb-4 border-none text-sm">
              <tbody>
                <tr>
                  <td className="w-1/4 py-1">Nama Pasien</td>
                  <td className="w-4 py-1">:</td>
                  <td className="font-bold">{pasien?.namaLengkap || '...................................................'}</td>
                </tr>
                <tr>
                  <td className="py-1">No. Rekam Medis</td>
                  <td className="py-1">:</td>
                  <td className="font-mono">{pasien?.noRM || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1">Umur / JK</td>
                  <td className="py-1">:</td>
                  <td>{calculatedAge ? `${calculatedAge} Tahun` : '......'} / {pasien?.jenisKelamin || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 align-top">Alamat</td>
                  <td className="py-1 align-top">:</td>
                  <td>{pasien?.alamat?.alamatDomisili || '.........................................................................'}</td>
                </tr>
                {pasien?.noIHS && (
                  <tr>
                    <td className="py-1 text-xs font-semibold text-blue-700">SATUSEHAT Patient IHS</td>
                    <td className="py-1 text-blue-700">:</td>
                    <td className="text-xs font-mono text-blue-700">{pasien.noIHS}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <p>Berdasarkan pemeriksaan kami, didapatkan temuan klinis sebagai berikut:</p>
            <table className="w-full ml-4 text-sm">
              <tbody>
                <tr>
                  <td className="w-1/3 py-2 align-top font-semibold">Anamnesa Singkat</td>
                  <td className="w-4 py-2 align-top">:</td>
                  <td className="py-2 align-top border-b border-dotted border-gray-400">{rekamMedis?.keluhanUtama || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 align-top font-semibold">Pemeriksaan Fisik</td>
                  <td className="py-2 align-top">:</td>
                  <td className="py-2 align-top border-b border-dotted border-gray-400">{rekamMedis?.pemeriksaanFisik || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 align-top font-semibold">Diagnosa Sementara</td>
                  <td className="py-2 align-top">:</td>
                  <td className="py-2 align-top font-bold text-red-700">{diagnosaStr}</td>
                </tr>
                <tr>
                  <td className="py-2 align-top font-semibold">Terapi Diberikan</td>
                  <td className="py-2 align-top">:</td>
                  <td className="py-2 align-top border-b border-dotted border-gray-400">{rekamMedis?.rencanaTerapi || rujukanKeluar?.alasanRujukan || '-'}</td>
                </tr>
              </tbody>
            </table>

            <p className="mt-6">
              Demikian surat rujukan ini kami sampaikan, atas bantuan dan kerja sama teman sejawat kami ucapkan terima kasih.
            </p>
          </div>
        </div>

        {/* Tanda Tangan & SATUSEHAT Integration Stamp dengan QR Code */}
        <div className="mt-12 flex justify-between items-end border-t pt-4">
          <div className="text-xs text-gray-500 max-w-sm font-mono space-y-1">
            {rujukanKeluar?.satusehatId ? (
              <div className="p-3 border border-green-300 bg-green-50 text-green-900 rounded-none flex items-start gap-3">
                {/* Visual QR Code Generator */}
                <div className="bg-white p-1 border border-green-300 shadow-xs flex-shrink-0">
                  <QRCodeSVG 
                    value={`https://satusehat.kemkes.go.id/verify/servicerequest/${rujukanKeluar.satusehatId}`}
                    size={68}
                    level="M"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> SATUSEHAT INTEGRATED
                  </p>
                  <p className="text-[10px] font-mono break-all leading-tight text-gray-800">
                    ID: {rujukanKeluar.satusehatId}
                  </p>
                  <p className="text-[9px] text-gray-600 font-sans leading-tight">
                    Encounter: {rujukanDetail?.encounterId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-none">
                <p className="text-[10px] font-bold">DOKUMEN RUJUKAN INTERNAL</p>
                <p className="text-[9px]">Sistem Integrasi Aset &amp; Pelayanan Kesehatan Daerah (SIAP-KES)</p>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm w-48">
            <p className="mb-14">Salam Sejawat,</p>
            <p className="font-bold underline underline-offset-4">{dokter?.namaLengkap || 'Nama Dokter'}</p>
            <p className="text-xs text-gray-500 mt-1">SIP. {dokter?.tenagaMedis?.noIHS ? `IHS-${dokter.tenagaMedis.noIHS}` : '123.456.789'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakSuratRujukanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Memuat Dokumen Rujukan...</p>
        </div>
      </div>
    }>
      <CetakSuratRujukanContent />
    </Suspense>
  );
}
