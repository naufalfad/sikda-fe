"use client";

import React, { useRef } from 'react';
import { Printer, FileDown, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';

interface CetakKwitansiPembayaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagihanData: any;
  kunjunganData?: any;
}

// Helper Terbilang Bahasa Indonesia
function terbilangRupiah(n: number): string {
  if (!n || n === 0) return 'Nol Rupiah';
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  const toWords = (num: number): string => {
    if (num < 12) return huruf[num];
    if (num < 20) return toWords(num - 10) + ' Belas';
    if (num < 100) return toWords(Math.floor(num / 10)) + ' Puluh' + (num % 10 !== 0 ? ' ' + toWords(num % 10) : '');
    if (num < 200) return 'Seratus' + (num % 100 !== 0 ? ' ' + toWords(num % 100) : '');
    if (num < 1000) return toWords(Math.floor(num / 100)) + ' Ratus' + (num % 100 !== 0 ? ' ' + toWords(num % 100) : '');
    if (num < 2000) return 'Seribu' + (num % 1000 !== 0 ? ' ' + toWords(num % 1000) : '');
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 !== 0 ? ' ' + toWords(num % 1000) : '');
    if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 !== 0 ? ' ' + toWords(num % 1000000) : '');
    if (num < 1000000000000) return toWords(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 !== 0 ? ' ' + toWords(num % 1000000000) : '');
    return '';
  };

  const words = toWords(Math.floor(Math.abs(n))).trim();
  return words ? `${words} Rupiah` : 'Nol Rupiah';
}

// Helper Usia Terperinci: Tahun Bulan Hari
function getDetailedAge(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const birth = new Date(dateString);
    const now = new Date();
    if (isNaN(birth.getTime())) return '-';

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} Tahun ${months} Bulan ${days} Hari`;
  } catch {
    return '-';
  }
}

// Format Angka Ribuan
function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

export default function CetakKwitansiPembayaranModal({
  isOpen,
  onClose,
  tagihanData,
  kunjunganData
}: CetakKwitansiPembayaranModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kwitansi_Pembayaran_${tagihanData?.id?.slice(-8) || 'Tagihan'}`,
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
          color-adjust: exact !important;
        }
        .kwitansi-print-container {
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

  const handleSimpanPdf = () => {
    Swal.fire({
      icon: 'info',
      title: 'Cetak / Simpan Sebagai PDF',
      html: `
        <div class="text-left text-xs text-slate-700 space-y-2">
          <p>Dialog pencetakan browser akan segera terbuka untuk menghasilkan dokumen PDF A4 resmi beresolusi tinggi.</p>
          <div class="bg-blue-50 border border-blue-200 p-2.5 rounded text-blue-900 mt-2">
            <p class="font-bold mb-1">💡 Cara Simpan PDF di Browser:</p>
            <ol class="list-decimal ml-4 space-y-1">
              <li>Pada menu <b>Tujuan (Destination)</b>, pilih <b>"Simpan sebagai PDF" (Save as PDF)</b>.</li>
              <li>Pastikan ukuran kertas: <b>A4</b>.</li>
              <li>Pastikan centang opsi <b>"Grafik latar belakang" (Background graphics)</b> agar kop dan warna tabel tercetak tajam.</li>
              <li>Klik tombol <b>Simpan (Save)</b> untuk menyimpan file PDF ke komputer Anda.</li>
            </ol>
          </div>
        </div>
      `,
      confirmButtonText: 'Buka Dialog Cetak / Simpan PDF',
      confirmButtonColor: '#059669',
      showCancelButton: true,
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        handlePrint();
      }
    });
  };

  if (!isOpen || !tagihanData) return null;

  const tagihan = tagihanData;
  const kunjungan = kunjunganData || tagihan.kunjungan || {};
  const pasien = kunjungan.pasien || tagihan.pasien || {};
  const faskes = kunjungan.faskes || { namaFaskes: 'RUMAH SAKIT MITRA MEDIKA CENTER' };
  const details = tagihan.details || [];
  const pembayaran = tagihan.pembayaran || {};

  // 1. Tindakan & BMHP
  const tindakanItems = details.filter((d: any) => 
    d.kategori === 'Tindakan' || d.kategori === 'Pendaftaran' || d.kategori === 'BMHP' || d.kategori === 'Administrasi'
  );

  // 2. Farmasi / Obat (termasuk Obat Pulang & Rawat Inap)
  const obatItems = details.filter((d: any) => 
    d.kategori === 'Obat' || (d.kategori || '').toLowerCase().includes('obat')
  );

  // 3. Akomodasi Tempat Tidur (Rawat Inap / Observasi UGD)
  const akomodasiItems = details.filter((d: any) => 
    d.kategori === 'Akomodasi' || (d.namaItem || '').toLowerCase().includes('akomodasi') || (d.namaItem || '').toLowerCase().includes('tempat tidur')
  );

  // 4. Pemakaian & Sewa Alat Kesehatan (Alkes Non-BMHP: EKG, Nebulizer, Monitor, USG, dsb.)
  const alkesItems = details.filter((d: any) => 
    d.kategori === 'Alat Kesehatan' || (d.namaItem || '').toLowerCase().includes('alkes') || (d.namaItem || '').toLowerCase().includes('alat kesehatan')
  );

  // 5. Penunjang Medis (Laboratorium & Radiologi)
  const labItems = details.filter((d: any) => d.kategori === 'Laboratorium');
  const radiologiItems = details.filter((d: any) => d.kategori === 'Radiologi');

  // Perhitungan Subtotal per Kategori
  const totalTindakan = tindakanItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  const totalObat = obatItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  const totalAkomodasi = akomodasiItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  const totalAlkes = alkesItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  const totalLab = labItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  const totalRadiologi = radiologiItems.reduce((acc: number, item: any) => acc + (item.subTotal || 0), 0);
  
  const totalKeseluruhan = tagihan.totalBiaya || (totalTindakan + totalObat + totalAkomodasi + totalAlkes + totalLab + totalRadiologi);

  // Ambil Data Diagnosa dari Kunjungan
  const rawDiagnosis = kunjungan.diagnosis || [];
  const diagnosisList: Array<{ jenis: string; nama: string; kode: string }> = [];

  if (rawDiagnosis && rawDiagnosis.length > 0) {
    rawDiagnosis.forEach((d: any, idx: number) => {
      let jenisLabel = 'Diagnosa Sekunder';
      if (d.jenisDiagnosis === 'PRIMER' || idx === 0) {
        jenisLabel = 'Diagnosa Utama';
      } else if (d.jenisDiagnosis === 'KOMPLIKASI') {
        jenisLabel = 'Diagnosa Komplikasi';
      }
      diagnosisList.push({
        jenis: jenisLabel,
        nama: d.icd10?.nama_diagnosis || d.icd10?.nama || d.namaDiagnosis || 'Pemeriksaan Klinis',
        kode: d.icd10?.kode_icd10 || d.kodeIcd10 || '-'
      });
    });
  } else if (kunjungan.rekamMedis?.diagnosisKlinis) {
    diagnosisList.push({
      jenis: 'Diagnosa Utama',
      nama: kunjungan.rekamMedis.diagnosisKlinis,
      kode: '-'
    });
  } else {
    diagnosisList.push({
      jenis: 'Diagnosa Utama',
      nama: 'Evaluasi Kesehatan & Rawat Jalan',
      kode: '-'
    });
  }

  // Format Tanggal Kunjungan
  const tanggalKunjunganStr = new Date(kunjungan.waktuDaftar || kunjungan.createdAt || Date.now()).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-');

  const noKunjungan = kunjungan.noAntrian || kunjungan.nomorKunjungan || `REG/${new Date().getFullYear()}/${kunjungan.id?.slice(-6).toUpperCase() || '00001'}`;
  const noSEP = pasien.penjamin?.noKartu || pasien.noBPJS || `R${String(Date.now()).slice(-10)}`;
  const metodePembayaran = pembayaran.metodePembayaran || (pasien.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS') ? 'BPJS' : 'Tunai');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-gray-300">
        
        {/* Modal Top Header Controls */}
        <div className="flex justify-between items-center px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-extrabold leading-tight">Kwitansi Pembayaran Layanan Kesehatan (Format Resmi)</h2>
              <p className="text-xs text-slate-300">
                No. Kunjungan: <span className="font-mono font-bold text-white">{noKunjungan}</span> • Standar Billing RS / FKTP
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              title="Cetak langsung ke printer kasir atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" /> Cetak Kwitansi
            </button>
            <button
              onClick={handleSimpanPdf}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Simpan dokumen kwitansi sebagai file PDF resmi A4"
            >
              <FileDown className="w-4 h-4" /> Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center">
          <div 
            ref={printRef}
            className="kwitansi-print-container w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-md p-10 font-sans text-xs flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* ── KOP SURAT BERLOGO HIJAU SEPERTI DI GAMBAR ── */}
              <div className="flex items-center gap-4 mb-3">
                {/* Logo Medis Hijau Simbolis */}
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-14 h-14 text-emerald-800 fill-current">
                    <path d="M50 15 C48 15 46 17 46 19 L46 36 L29 36 C27 36 25 38 25 40 L25 60 C25 62 27 64 29 64 L46 64 L46 81 C46 83 48 85 50 85 C52 85 54 83 54 81 L54 64 L71 64 C73 64 75 62 75 60 L75 40 C75 38 73 36 71 36 L54 36 L54 19 C54 17 52 15 50 15 Z" fill="#047857" />
                    <circle cx="50" cy="50" r="10" fill="#ffffff" />
                    <path d="M47 38 L53 38 L53 62 L47 62 Z" fill="#047857" />
                    <path d="M38 47 L62 47 L62 53 L38 53 Z" fill="#047857" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-wide text-emerald-900 uppercase font-serif">
                    {faskes.namaFaskes || 'RUMAH SAKIT MITRA MEDIKA CENTER'}
                  </h1>
                  <p className="text-[10px] text-gray-600 tracking-wider uppercase font-semibold">
                    INSTALASI PELAYANAN RAWAT JALAN &amp; PENUNJANG MEDIS
                  </p>
                </div>
              </div>

              {/* Garis Pemisah Tipis Atas */}
              <div className="border-b border-gray-400 mb-3"></div>

              {/* JUDUL DOKUMEN (Centered & Underlined) */}
              <div className="text-center my-3">
                <h2 className="text-xs font-black tracking-widest uppercase underline text-gray-900">
                  KWITANSI PEMBAYARAN LAYANAN KESEHATAN
                </h2>
              </div>

              {/* ── METADATA KUNJUNGAN & PASIEN (2 KOLOM RAPI) ── */}
              <div className="grid grid-cols-2 gap-x-6 text-[11px] mb-3 leading-relaxed">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-28 py-0.5 text-gray-700 font-medium">No Kunjungan</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="font-mono font-bold text-gray-900">{noKunjungan}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700 font-medium">No RM</td>
                      <td className="py-0.5">:</td>
                      <td className="font-mono font-bold text-gray-900">{pasien.noRM || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700 font-medium">No SEP</td>
                      <td className="py-0.5">:</td>
                      <td className="font-mono text-gray-900">{noSEP}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-32 py-0.5 text-gray-700 font-medium">Tanggal Kunjungan</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="text-gray-900 font-mono">{tanggalKunjunganStr}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700 font-medium">Nama Pasien</td>
                      <td className="py-0.5">:</td>
                      <td className="font-bold text-gray-900">{pasien.namaLengkap || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700 font-medium">Umur</td>
                      <td className="py-0.5">:</td>
                      <td className="text-gray-900">{getDetailedAge(pasien.tanggalLahir)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Garis Dotted Pembatas Bagian */}
              <div className="border-b border-dotted border-gray-400 mb-4"></div>

              {/* ── SECTION 1: PERINCIAN BIAYA TINDAKAN MEDIS DOKTER ── */}
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-900 mb-2">
                  Perincian Biaya Tindakan Medis Dokter
                </h3>

                {/* Sub-Tabel 1: Diagnosa Pasien */}
                <table className="w-full border-collapse border border-gray-800 text-[10px] mb-3">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800">
                      <th className="border-r border-gray-800 px-2.5 py-1 text-left w-36 font-bold">Jenis Diagnosa</th>
                      <th className="px-2.5 py-1 text-left font-bold">Diagnosa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosisList.map((diag, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="border-r border-gray-800 px-2.5 py-1 font-semibold text-gray-800">{diag.jenis}</td>
                        <td className="px-2.5 py-1 text-gray-900">
                          {diag.nama} {diag.kode && diag.kode !== '-' ? `| ${diag.kode}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sub-Tabel 2: Tindakan Medis & Prosedur */}
                <table className="w-full border-collapse border border-gray-800 text-[10px] mb-3">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800 text-center font-bold">
                      <th className="border-r border-gray-800 px-2 py-1 w-24">Tindakan Kode</th>
                      <th className="border-r border-gray-800 px-2 py-1 text-left">Tindakan</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-24">Jumlah Tindakan</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-24 text-right">Jasa Sarana</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-24 text-right">Jasa Pelayanan</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-24 text-right">Tarif Pelayanan</th>
                      <th className="px-2 py-1 w-24 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tindakanItems.length > 0 ? (
                      tindakanItems.map((item: any, idx: number) => {
                        const jasaSarana = Math.round(item.hargaSatuan * 0.4);
                        const jasaPelayanan = item.hargaSatuan - jasaSarana;
                        return (
                          <tr key={idx} className="border-b border-gray-300">
                            <td className="border-r border-gray-800 px-2 py-1 text-center font-mono text-gray-600">
                              {item.id ? `TND-${item.id.slice(-4).toUpperCase()}` : `TND-${idx + 1}`}
                            </td>
                            <td className="border-r border-gray-800 px-2 py-1 font-medium text-gray-900">{item.namaItem}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-center">{item.jumlah || 1} kali</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaSarana)}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaPelayanan)}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(item.hargaSatuan)}</td>
                            <td className="px-2 py-1 text-right font-mono font-bold text-gray-900">{formatNumber(item.subTotal)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-800 px-2 py-1 text-center font-mono">-</td>
                        <td className="border-r border-gray-800 px-2 py-1 text-gray-700">Pemeriksaan &amp; Konsultasi Dokter Poli</td>
                        <td className="border-r border-gray-800 px-2 py-1 text-center">1 kali</td>
                        <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">0</td>
                        <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">0</td>
                        <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">0</td>
                        <td className="px-2 py-1 text-right font-mono font-bold">0</td>
                      </tr>
                    )}
                    {/* Baris Total Tindakan */}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                      <td colSpan={6} className="border-r border-gray-800 px-3 py-1 text-right">Total</td>
                      <td className="px-2 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalTindakan)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub-Tabel 3: Farmasi / Obat */}
                <table className="w-full border-collapse border border-gray-800 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800 text-center font-bold">
                      <th className="border-r border-gray-800 px-3 py-1 text-left">Nama Obat</th>
                      <th className="border-r border-gray-800 px-3 py-1 w-28 text-right">Harga</th>
                      <th className="border-r border-gray-800 px-3 py-1 w-24">Jumlah</th>
                      <th className="px-3 py-1 w-28 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obatItems.length > 0 ? (
                      obatItems.map((obat: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="border-r border-gray-800 px-3 py-1 font-medium">{obat.namaItem}</td>
                          <td className="border-r border-gray-800 px-3 py-1 text-right font-mono">{formatNumber(obat.hargaSatuan)}</td>
                          <td className="border-r border-gray-800 px-3 py-1 text-center">{obat.jumlah}</td>
                          <td className="px-3 py-1 text-right font-mono font-bold">{formatNumber(obat.subTotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-gray-300">
                        <td colSpan={4} className="px-3 py-1 text-center font-bold text-gray-700">
                          Pasien membeli obat diluar
                        </td>
                      </tr>
                    )}
                    {/* Baris Total Obat */}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                      <td colSpan={3} className="border-r border-gray-800 px-3 py-1 text-right">Total</td>
                      <td className="px-3 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalObat)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Garis Dotted Pembatas Bagian */}
              <div className="border-b border-dotted border-gray-400 mb-4"></div>

              {/* ── SECTION 2: AKOMODASI TEMPAT TIDUR & PEMAKAIAN ALAT KESEHATAN ── */}
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-900 mb-2">
                  Perincian Biaya Akomodasi Tempat Tidur &amp; Pemakaian Alat Kesehatan
                </h3>

                {/* Sub-Tabel 1: Akomodasi Tempat Tidur / Ruang Rawat Inap */}
                <table className="w-full border-collapse border border-gray-800 text-[10px] mb-3">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800">
                      <th colSpan={4} className="py-1 text-center font-bold uppercase tracking-wider">
                        Akomodasi Tempat Tidur &amp; Ruangan
                      </th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-800 text-center font-bold">
                      <th className="border-r border-gray-800 px-2.5 py-1 text-left">Fasilitas / Ruangan &amp; Nomor Bed</th>
                      <th className="border-r border-gray-800 px-2.5 py-1 w-28 text-center">Durasi / Hari</th>
                      <th className="border-r border-gray-800 px-2.5 py-1 w-28 text-right">Tarif per Hari</th>
                      <th className="px-2.5 py-1 w-28 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {akomodasiItems.length > 0 ? (
                      akomodasiItems.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="border-r border-gray-800 px-2.5 py-1 font-medium text-gray-900">{item.namaItem}</td>
                          <td className="border-r border-gray-800 px-2.5 py-1 text-center">{item.jumlah || 1} hari</td>
                          <td className="border-r border-gray-800 px-2.5 py-1 text-right font-mono">{formatNumber(item.hargaSatuan)}</td>
                          <td className="px-2.5 py-1 text-right font-mono font-bold text-gray-900">{formatNumber(item.subTotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-800 px-2.5 py-1 text-gray-600 italic">Pasien Rawat Jalan (Tidak Menginap / Tanpa Akomodasi Bed)</td>
                        <td className="border-r border-gray-800 px-2.5 py-1 text-center font-mono">0 hari</td>
                        <td className="border-r border-gray-800 px-2.5 py-1 text-right font-mono">0</td>
                        <td className="px-2.5 py-1 text-right font-mono font-bold">0</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                      <td colSpan={3} className="border-r border-gray-800 px-3 py-1 text-right">Total Akomodasi</td>
                      <td className="px-2.5 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalAkomodasi)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub-Tabel 2: Pemakaian & Sewa Alat Kesehatan (Alkes) */}
                <table className="w-full border-collapse border border-gray-800 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800">
                      <th colSpan={5} className="py-1 text-center font-bold uppercase tracking-wider">
                        Pemakaian &amp; Sewa Alat Kesehatan (Alkes)
                      </th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-800 text-center font-bold">
                      <th className="border-r border-gray-800 px-2 py-1 w-20">Kode</th>
                      <th className="border-r border-gray-800 px-2.5 py-1 text-left">Nama Alat Kesehatan / Fasilitas Medis</th>
                      <th className="border-r border-gray-800 px-2.5 py-1 w-28 text-center">Jumlah Pemakaian</th>
                      <th className="border-r border-gray-800 px-2.5 py-1 w-28 text-right">Tarif Pemakaian</th>
                      <th className="px-2.5 py-1 w-28 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alkesItems.length > 0 ? (
                      alkesItems.map((alkes: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="border-r border-gray-800 px-2 py-1 text-center font-mono text-gray-600">
                            {alkes.id ? `ALK-${alkes.id.slice(-4).toUpperCase()}` : `ALKES-${idx + 1}`}
                          </td>
                          <td className="border-r border-gray-800 px-2.5 py-1 font-medium text-gray-900">{alkes.namaItem}</td>
                          <td className="border-r border-gray-800 px-2.5 py-1 text-center">{alkes.jumlah || 1} kali</td>
                          <td className="border-r border-gray-800 px-2.5 py-1 text-right font-mono">{formatNumber(alkes.hargaSatuan)}</td>
                          <td className="px-2.5 py-1 text-right font-mono font-bold text-gray-900">{formatNumber(alkes.subTotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-800 px-2 py-1 text-center font-mono">-</td>
                        <td className="border-r border-gray-800 px-2.5 py-1 text-gray-600 italic">Tidak Ada Pemakaian Alat Kesehatan Khusus</td>
                        <td className="border-r border-gray-800 px-2.5 py-1 text-center font-mono">0 kali</td>
                        <td className="border-r border-gray-800 px-2.5 py-1 text-right font-mono">0</td>
                        <td className="px-2.5 py-1 text-right font-mono font-bold">0</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                      <td colSpan={4} className="border-r border-gray-800 px-3 py-1 text-right">Total Sewa Alkes</td>
                      <td className="px-2.5 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalAlkes)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Garis Dotted Pembatas Bagian */}
              <div className="border-b border-dotted border-gray-400 mb-4"></div>

              {/* ── SECTION 3: PERINCIAN BIAYA TUNJANGAN MEDIS (LAB & RADIOLOGI) ── */}
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-900 mb-2">
                  Perincian Biaya Tunjangan Medis
                </h3>

                {/* Sub-Tabel Laboratorium */}
                <table className="w-full border-collapse border border-gray-800 text-[10px] mb-3">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800">
                      <th colSpan={5} className="py-1 text-center font-bold uppercase tracking-wider">
                        Laboratorium
                      </th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-800 text-center font-bold">
                      <th className="border-r border-gray-800 px-2 py-1 w-20">Kode</th>
                      <th className="border-r border-gray-800 px-2 py-1 text-left">Tindakan / Pelayanan</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-28 text-right">Jasa Sarana</th>
                      <th className="border-r border-gray-800 px-2 py-1 w-28 text-right">Jasa Layanan</th>
                      <th className="px-2 py-1 w-28 text-right">Tarif Pelayanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labItems.length > 0 ? (
                      labItems.map((lab: any, idx: number) => {
                        const jasaSarana = Math.round(lab.subTotal * 0.5);
                        const jasaLayanan = lab.subTotal - jasaSarana;
                        return (
                          <tr key={idx} className="border-b border-gray-300">
                            <td className="border-r border-gray-800 px-2 py-1 text-center font-mono text-gray-600">
                              {lab.id ? `LAB-${lab.id.slice(-4).toUpperCase()}` : ''}
                            </td>
                            <td className="border-r border-gray-800 px-2 py-1 font-medium">{lab.namaItem}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaSarana)}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaLayanan)}</td>
                            <td className="px-2 py-1 text-right font-mono font-bold text-gray-900">{formatNumber(lab.subTotal)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-b border-gray-300">
                        <td colSpan={5} className="px-2 py-1 text-center text-gray-500 italic">
                          Tidak ada tindakan laboratorium
                        </td>
                      </tr>
                    )}
                    {/* Baris Total Laboratorium */}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                      <td colSpan={4} className="border-r border-gray-800 px-3 py-1 text-right">Total</td>
                      <td className="px-2 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalLab)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub-Tabel Radiologi (Bila Ada) */}
                {radiologiItems.length > 0 && (
                  <table className="w-full border-collapse border border-gray-800 text-[10px] mb-3">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800">
                        <th colSpan={5} className="py-1 text-center font-bold uppercase tracking-wider">
                          Radiologi &amp; Imaging
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-800 text-center font-bold">
                        <th className="border-r border-gray-800 px-2 py-1 w-20">Kode</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Tindakan / Pelayanan</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-28 text-right">Jasa Sarana</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-28 text-right">Jasa Layanan</th>
                        <th className="px-2 py-1 w-28 text-right">Tarif Pelayanan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {radiologiItems.map((rad: any, idx: number) => {
                        const jasaSarana = Math.round(rad.subTotal * 0.5);
                        const jasaLayanan = rad.subTotal - jasaSarana;
                        return (
                          <tr key={idx} className="border-b border-gray-300">
                            <td className="border-r border-gray-800 px-2 py-1 text-center font-mono text-gray-600">
                              {rad.id ? `RAD-${rad.id.slice(-4).toUpperCase()}` : ''}
                            </td>
                            <td className="border-r border-gray-800 px-2 py-1 font-medium">{rad.namaItem}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaSarana)}</td>
                            <td className="border-r border-gray-800 px-2 py-1 text-right font-mono">{formatNumber(jasaLayanan)}</td>
                            <td className="px-2 py-1 text-right font-mono font-bold text-gray-900">{formatNumber(rad.subTotal)}</td>
                          </tr>
                        );
                      })}
                      {/* Baris Total Radiologi */}
                      <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                        <td colSpan={4} className="border-r border-gray-800 px-3 py-1 text-right">Total</td>
                        <td className="px-2 py-1 text-right font-mono font-black text-gray-900">{formatNumber(totalRadiologi)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Garis Dotted Pembatas Bagian */}
              <div className="border-b border-dotted border-gray-400 mb-3"></div>

              {/* ── SECTION 4: REKAPITULASI TOTAL & TERBILANG ── */}
              <div className="bg-slate-50 border border-slate-300 p-3 mb-4 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-sm uppercase text-gray-900">Total Keseluruhan Tagihan:</span>
                  <span className="font-mono text-base font-black text-gray-900">
                    Rp {formatNumber(totalKeseluruhan)}
                  </span>
                </div>
                <div className="text-[11px] text-gray-700 italic border-t border-slate-200 pt-1.5 flex gap-2">
                  <span className="font-semibold not-italic text-gray-800">Terbilang:</span>
                  <span className="font-bold text-gray-900">({terbilangRupiah(totalKeseluruhan)})</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-1 flex gap-2">
                  <span>Metode Pembayaran:</span>
                  <strong className="text-emerald-800">{metodePembayaran}</strong>
                  <span>• Status:</span>
                  <strong className="text-emerald-800">LUNAS / DITERIMA</strong>
                </div>
              </div>
            </div>

            {/* ── FOOTER & TANDA TANGAN ── */}
            <div className="pt-2 text-xs">
              <div className="flex justify-between items-end">
                <div className="text-center w-52">
                  <p className="mb-14 text-gray-700">Pasien / Keluarga Pasien,</p>
                  <p className="font-extrabold underline text-gray-900">{pasien.namaLengkap || 'Pasien'}</p>
                </div>

                <div className="text-center w-56">
                  <p className="text-gray-600 text-[10px] mb-1">
                    Kab. Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="mb-14 text-gray-700 font-medium">Petugas Kasir / Keuangan,</p>
                  <p className="font-extrabold underline text-gray-900">
                    {pembayaran.kasir?.namaLengkap || 'Petugas Kasir Faskes'}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">NIP. 19890412.201502.1.003</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-400">
                Dokumen ini merupakan bukti pembayaran sah yang dikeluarkan oleh Sistem Informasi Kesehatan Daerah (SIKDA).
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
