"use client";

import React, { useRef } from 'react';
import { Printer, FileDown, X, ShieldCheck } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/auth.store';

interface CetakDokumenLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'kunjungan' | 'morbiditas' | 'bmhp' | 'alkes' | 'kinerja_nakes';
  data: any;
  filterParams: {
    periode?: string;
    startDate?: string;
    endDate?: string;
    poliklinikName?: string;
  };
}

export default function CetakDokumenLaporanModal({
  isOpen,
  onClose,
  activeTab,
  data,
  filterParams
}: CetakDokumenLaporanModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Resmi_${activeTab.toUpperCase()}_${new Date().toISOString().split('T')[0]}`,
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
        .report-print-container {
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
      title: 'Simpan Dokumen Laporan (PDF A4)',
      html: `
        <div class="text-left text-xs text-slate-700 space-y-2">
          <p>Dialog pencetakan dokumen resmi akan segera terbuka.</p>
          <div class="bg-blue-50 border border-blue-200 p-2.5 rounded text-blue-900 mt-2">
            <p class="font-bold mb-1">💡 Petunjuk Menyimpan PDF Vektor Resmi:</p>
            <ol class="list-decimal ml-4 space-y-1">
              <li>Pada menu <b>Tujuan (Destination)</b>, pilih <b>"Simpan sebagai PDF" (Save as PDF)</b>.</li>
              <li>Ukuran kertas otomatis terkunci ke <b>A4</b>.</li>
              <li>Centang opsi <b>"Grafik latar belakang" (Background graphics)</b> agar kop resmi dan garis tabel tercetak tajam.</li>
              <li>Klik tombol <b>Simpan (Save)</b> untuk menyimpan file PDF.</li>
            </ol>
          </div>
        </div>
      `,
      confirmButtonText: 'Buka Dialog Cetak PDF',
      confirmButtonColor: '#059669',
      showCancelButton: true,
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        handlePrint();
      }
    });
  };

  if (!isOpen || !data) return null;

  const faskesName = user?.faskes?.namaFaskes || 'UPTD PUSKESMAS KECAMATAN';
  const faskesCode = user?.faskes?.kodeFaskes || 'PKM-320101';
  const userName = user?.namaLengkap || user?.nama_lengkap || user?.username || 'Petugas Administrasi';

  const tglMulaiStr = filterParams.startDate ? new Date(filterParams.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const tglAkhirStr = filterParams.endDate ? new Date(filterParams.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const tglCetakStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Judul Dokumen Formal berdasarkan Tab
  const getDocTitle = () => {
    switch (activeTab) {
      case 'kunjungan':
        return 'REKAPITULASI LAPORAN KUNJUNGAN PASIEN & PELAYANAN FASKES';
      case 'morbiditas':
        return 'LAPORAN DATA KESAKITAN & 10 BESAR PENYAKIT PUSKESMAS (FORM LB1)';
      case 'bmhp':
        return 'LAPORAN PENGGUNAAN & KARTU STOK BAHAN MEDIS HABIS PAKAI (BMHP)';
      case 'alkes':
        return 'LAPORAN INVENTARIS & UTILISASI ALAT KESEHATAN (ASPAK KEMENKES)';
      case 'kinerja_nakes':
        return 'REKAPITULASI KINERJA & LOG AKTIVITAS PELAYANAN MEDIS TENAGA KESEHATAN';
      default:
        return 'LAPORAN RESMI PELAYANAN KESEHATAN';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-gray-300">
        
        {/* Modal Top Header Controls */}
        <div className="flex justify-between items-center px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-extrabold leading-tight">Preview Dokumen Laporan Resmi A4</h2>
              <p className="text-xs text-slate-300">
                Format Standar SP2TP Dinas Kesehatan • Berkas Legal &amp; Siap Cetak / Unduh PDF
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              title="Cetak langsung ke printer fisik"
            >
              <Printer className="w-4 h-4" /> Cetak Dokumen
            </button>
            <button
              onClick={handleSimpanPdf}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Simpan dokumen sebagai file PDF A4 resmi"
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
            className="report-print-container w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-md p-10 font-sans text-xs flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* ── KOP SURAT RESMI PEMDA / FASKES ── */}
              <div className="border-b-4 border-double border-gray-900 pb-3 mb-4 text-center">
                <h1 className="text-base font-black text-gray-900 tracking-wide uppercase">
                  PEMERINTAH DAERAH KABUPATEN BOGOR
                </h1>
                <h2 className="text-sm font-extrabold text-gray-900 uppercase">
                  DINAS KESEHATAN • {faskesName}
                </h2>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Jl. Pelayanan Kesehatan Masyarakat No. 10, Kabupaten Bogor, Jawa Barat | Kode Faskes: <span className="font-mono font-bold">{faskesCode}</span>
                </p>
                <p className="text-[9px] text-gray-500 font-mono">
                  Sistem Informasi Kesehatan Daerah (SIKDA) Terintegrasi Platform SATUSEHAT Kemenkes RI
                </p>
              </div>

              {/* JUDUL DOKUMEN LAPORAN */}
              <div className="text-center my-3">
                <h2 className="text-xs font-black tracking-wider uppercase underline text-gray-900">
                  {getDocTitle()}
                </h2>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Periode Data: <span className="font-semibold text-gray-900">{tglMulaiStr} s/d {tglAkhirStr}</span>
                </p>
              </div>

              {/* METADATA LAPORAN (2 Kolom Rapi) */}
              <div className="grid grid-cols-2 gap-x-6 text-[10px] bg-slate-50 p-2.5 border border-slate-300 mb-4 leading-relaxed">
                <table>
                  <tbody>
                    <tr>
                      <td className="w-28 text-gray-600 font-medium">Instansi / Unit</td>
                      <td className="w-2">:</td>
                      <td className="font-bold text-gray-900">{faskesName}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-600 font-medium">Poliklinik / Bagian</td>
                      <td>:</td>
                      <td className="font-semibold text-gray-900">{filterParams.poliklinikName || 'Semua Poliklinik'}</td>
                    </tr>
                  </tbody>
                </table>
                <table>
                  <tbody>
                    <tr>
                      <td className="w-28 text-gray-600 font-medium">Tanggal Dicetak</td>
                      <td className="w-2">:</td>
                      <td className="font-mono text-gray-900">{tglCetakStr}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-600 font-medium">Petugas Pencetak</td>
                      <td>:</td>
                      <td className="font-semibold text-gray-900">{userName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── KONTEN TABEL BERDASARKAN KATEGORI LAPORAN ── */}

              {/* 1. KONTEN TAB KUNJUNGAN PASIEN */}
              {activeTab === 'kunjungan' && (
                <div>
                  {/* Ringkasan Angka Kunci */}
                  <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Kunjungan</span>
                      <strong className="text-sm font-mono font-black text-gray-900">{data.ringkasan?.totalKunjungan || 0}</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Pasien Baru / Lama</span>
                      <strong className="text-xs font-mono font-bold text-gray-900">{data.ringkasan?.pasienBaru || 0} / {data.ringkasan?.pasienLama || 0}</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Gender (L / P)</span>
                      <strong className="text-xs font-mono font-bold text-gray-900">{data.ringkasan?.lakiLaki || 0} / {data.ringkasan?.perempuan || 0}</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Penjamin (BPJS / Umum)</span>
                      <strong className="text-xs font-mono font-bold text-gray-900">{data.ringkasan?.penjamin?.BPJS || 0} / {data.ringkasan?.penjamin?.Umum || 0}</strong>
                    </div>
                  </div>

                  {/* Tabel Agregat Harian */}
                  <h3 className="text-[10px] font-bold text-gray-800 mb-1">Tabel Rincian Kunjungan Per Tanggal:</h3>
                  <table className="w-full border-collapse border border-gray-800 text-[9px] mb-4">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800 text-center font-bold text-gray-900">
                        <th className="border-r border-gray-800 px-2 py-1 w-8">No</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Tanggal</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Pasien Baru</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Pasien Lama</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-12">L</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-12">P</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">BPJS</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">Umum</th>
                        <th className="px-2 py-1 w-16 text-right">Total Pasien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.rekapTabelHarian || []).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-300 text-center">
                          <td className="border-r border-gray-800 px-1 py-1 font-mono">{idx + 1}</td>
                          <td className="border-r border-gray-800 px-2 py-1 text-left font-mono font-semibold">{row.tanggal}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.baru}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.lama}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.lakiLaki}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.perempuan}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.bpjs}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.umum}</td>
                          <td className="px-2 py-1 font-mono font-bold text-right text-gray-900">{row.total}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-800 font-bold bg-gray-100 text-center">
                        <td colSpan={2} className="border-r border-gray-800 px-2 py-1 text-right">Total Keseluruhan</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.pasienBaru || 0}</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.pasienLama || 0}</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.lakiLaki || 0}</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.perempuan || 0}</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.penjamin?.BPJS || 0}</td>
                        <td className="border-r border-gray-800 px-2 py-1 font-mono">{data.ringkasan?.penjamin?.Umum || 0}</td>
                        <td className="px-2 py-1 font-mono font-black text-right text-gray-900">{data.ringkasan?.totalKunjungan || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. KONTEN TAB MORBIDITAS / 10 BESAR PENYAKIT */}
              {activeTab === 'morbiditas' && (
                <div>
                  <div className="bg-gray-50 border border-gray-400 p-2.5 mb-3 flex justify-between items-center text-[10px]">
                    <span>Total Kasus Terdiagnosa: <strong className="font-mono text-gray-900 text-xs">{data.ringkasan?.totalKasus || 0}</strong></span>
                    <span>Penyakit No. 1 Terbanyak: <strong className="text-gray-900 font-bold">{data.ringkasan?.penyakitNomorSatu || '-'}</strong></span>
                  </div>

                  <table className="w-full border-collapse border border-gray-800 text-[9px] mb-4">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900 text-center">
                        <th className="border-r border-gray-800 px-2 py-1 w-10">Peringkat</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20 text-left">Kode ICD-10</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Nama Penyakit / Diagnosis</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20">Kasus Primer</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20">Kasus Sekunder</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20">Total Kasus</th>
                        <th className="px-2 py-1 w-16 text-right">Proporsi (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.topPenyakit || []).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="border-r border-gray-800 px-2 py-1 text-center font-mono font-bold">{row.peringkat}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-blue-900">{row.kodeIcd10}</td>
                          <td className="border-r border-gray-800 px-2 py-1 font-medium text-gray-900">{row.namaDiagnosis}</td>
                          <td className="border-r border-gray-800 px-2 py-1 text-center font-mono">{row.kasusPrimer}</td>
                          <td className="border-r border-gray-800 px-2 py-1 text-center font-mono">{row.kasusSekunder}</td>
                          <td className="border-r border-gray-800 px-2 py-1 text-center font-mono font-bold text-gray-900">{row.totalKasus}</td>
                          <td className="px-2 py-1 font-mono font-bold text-right text-gray-900">{row.persentase}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. KONTEN TAB LOGISTIK & BMHP */}
              {activeTab === 'bmhp' && (
                <div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Barang Terjadi Transaksi</span>
                      <strong className="text-sm font-mono font-bold text-amber-800">{data.ringkasan?.itemBermutasi || 0} Item</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Unit Terpakai (Keluar)</span>
                      <strong className="text-sm font-mono font-bold text-red-700">-{data.ringkasan?.totalPemakaianUnit || 0}</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Unit Masuk (Penerimaan)</span>
                      <strong className="text-sm font-mono font-bold text-emerald-700">+{data.ringkasan?.totalMasukUnit || 0}</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Frekuensi Mutasi</span>
                      <strong className="text-sm font-mono font-bold text-blue-800">{data.ringkasan?.totalMutasiTransaksi || 0} Log</strong>
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-gray-800 text-[9px] mb-4">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900 text-center">
                        <th className="border-r border-gray-800 px-2 py-1 w-8">No</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20 text-left">Kode</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Nama Barang BMHP &amp; Kategori</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Satuan</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">Stok Awal</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Masuk</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Keluar</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">Sisa Akhir</th>
                        <th className="px-2 py-1 w-16 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data.daftarBMHP || []).filter((r: any) => r.adaTransaksi || r.jumlahMasuk > 0 || r.jumlahKeluar > 0)).length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-4 text-center text-gray-500 font-medium">
                            Tidak ada pergerakan / transaksi mutasi BMHP pada rentang tanggal laporan ini.
                          </td>
                        </tr>
                      ) : (
                        (data.daftarBMHP || [])
                          .filter((r: any) => r.adaTransaksi || r.jumlahMasuk > 0 || r.jumlahKeluar > 0)
                          .map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-300 text-center bg-amber-50/30">
                              <td className="border-r border-gray-800 px-1 py-1 font-mono">{idx + 1}</td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left font-mono font-semibold">{row.kodeItem}</td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left">
                                <span className="font-semibold text-gray-900 block">{row.namaItem}</span>
                                <span className="text-[8px] text-gray-500 font-mono">{row.kategori} &bull; Batch: {row.noBatch}</span>
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1">{row.sediaan}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono">{row.stokAwal}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono text-emerald-800 font-bold">
                                {row.jumlahMasuk > 0 ? `+${row.jumlahMasuk}` : '0'}
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono text-red-800 font-bold">
                                {row.jumlahKeluar > 0 ? `-${row.jumlahKeluar}` : '0'}
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-gray-900">{row.sisaStokAkhir}</td>
                              <td className="px-2 py-1 font-bold font-mono">
                                <span className={row.status === 'AMAN' ? 'text-emerald-700' : 'text-red-700'}>{row.status}</span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>

                  {/* Ringkasan Jurnal Transaksi Granular */}
                  {(data.logMutasiTerbaru || []).length > 0 && (
                    <div className="mt-4 pt-2 border-t border-gray-400">
                      <div className="font-bold text-[10px] text-gray-800 mb-1">
                        Lampiran: Catatan Jurnal Mutasi Fisik BMHP Periode Berjalan (Audit Trail)
                      </div>
                      <table className="w-full border-collapse border border-gray-600 text-[8px]">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-600 font-bold text-center">
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">Waktu</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-14">Jenis</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Nama Barang BMHP</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-12">Qty</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">No Referensi</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Keterangan</th>
                            <th className="px-1 py-0.5 w-20">Petugas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.logMutasiTerbaru.slice(0, 25).map((log: any, lIdx: number) => (
                            <tr key={lIdx} className="border-b border-gray-200">
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono">
                                {new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-bold">
                                <span className={log.jenisMutasi === 'MASUK' ? 'text-emerald-800' : 'text-red-800'}>
                                  {log.jenisMutasi}
                                </span>
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 font-medium text-left">{log.namaItem}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono font-bold">
                                {log.jenisMutasi === 'MASUK' ? `+${log.jumlah}` : `-${log.jumlah}`}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono">{log.referensi}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-left text-gray-700">{log.keterangan}</td>
                              <td className="px-1 py-0.5 text-center text-gray-600">{log.petugas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. KONTEN TAB ALAT KESEHATAN (ALKES) */}
              {activeTab === 'alkes' && (
                <div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Alat Medis Digunakan</span>
                      <strong className="text-sm font-mono font-bold text-teal-800">{data.ringkasan?.alatDigunakanCount || 0} Item</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Frekuensi Pakai</span>
                      <strong className="text-sm font-mono font-bold text-blue-800">{data.ringkasan?.totalFrekuensiPakai || 0} Kali</strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Total Nilai Utilisasi</span>
                      <strong className="text-sm font-mono font-bold text-emerald-800">
                        Rp {(data.ringkasan?.totalNilaiUtilisasi || 0).toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Kondisi Siap Pakai</span>
                      <strong className="text-sm font-mono font-bold text-gray-900">{data.ringkasan?.kondisiBaik || 0} Unit</strong>
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-gray-800 text-[9px] mb-4">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900 text-center">
                        <th className="border-r border-gray-800 px-2 py-1 w-8">No</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20 text-left">Kode Aset</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Nama Alat Kesehatan &amp; ASPAK</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Ruangan / Instalasi</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20 text-center">Frekuensi Pakai</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-20 text-right">Tarif Satuan</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-24 text-right">Total Nilai</th>
                        <th className="px-2 py-1 w-16 text-center">Kondisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data.daftarAlkes || []).filter((r: any) => r.adaTransaksi || r.frekuensiPakai > 0)).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-gray-500 font-medium">
                            Tidak ada catatan penggunaan alat medis pada rentang tanggal laporan ini.
                          </td>
                        </tr>
                      ) : (
                        (data.daftarAlkes || [])
                          .filter((r: any) => r.adaTransaksi || r.frekuensiPakai > 0)
                          .map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-300 text-center bg-teal-50/20">
                              <td className="border-r border-gray-800 px-1 py-1 font-mono">{idx + 1}</td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left font-mono font-semibold">{row.kodeAset}</td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left font-bold text-gray-900">
                                <div>{row.namaAset}</div>
                                <div className="text-[8px] text-gray-500 font-mono font-normal">ASPAK: {row.kodeAspak || '-'}</div>
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left">{row.ruangan}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-teal-800 text-center">
                                {row.frekuensiPakai} kali
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono text-right text-gray-700">
                                Rp {(row.tarifPemakaian || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-right text-teal-900">
                                Rp {(row.totalNilaiUtilisasi || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="px-2 py-1 font-semibold">{row.kondisi}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>

                  {/* Lampiran Log Penggunaan Alkes dalam Tindakan */}
                  {(data.logPenggunaanAlkes || []).length > 0 && (
                    <div className="mt-4 pt-2 border-t border-gray-400">
                      <div className="font-bold text-[10px] text-gray-800 mb-1">
                        Lampiran: Catatan Log Pemakaian Alat Medis dalam Pelayanan Pasien (Audit Trail)
                      </div>
                      <table className="w-full border-collapse border border-gray-600 text-[8px]">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-600 font-bold text-center">
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">Waktu</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-20">Kode Aset</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Nama Alat Medis</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Tindakan / Prosedur Medis</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Pasien (No. RM)</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-20">Poli / Unit</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">Pelaksana</th>
                            <th className="px-1 py-0.5 w-16 text-right">Tarif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.logPenggunaanAlkes.slice(0, 25).map((log: any, lIdx: number) => (
                            <tr key={lIdx} className="border-b border-gray-200">
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono">
                                {new Date(log.waktu).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono">{log.kodeAset}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 font-bold text-left">{log.namaAset}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-left text-gray-800">{log.prosedur}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-left">
                                {log.pasien} <span className="font-mono text-gray-500">({log.noRM})</span>
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center text-gray-600">{log.poli}</td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center text-gray-600">{log.pelaksana}</td>
                              <td className="px-1 py-0.5 text-right font-mono font-bold text-emerald-800">
                                Rp {(log.tarif || 0).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. KONTEN TAB KINERJA DOKTER & PERAWAT */}
              {activeTab === 'kinerja_nakes' && (
                <div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Nakes Aktif Melayani</span>
                      <strong className="text-sm font-mono font-bold text-purple-800">
                        {data.ringkasan?.nakesAktifCount || 0} / {data.ringkasan?.totalNakesTerdaftar || 0} Tenaga
                      </strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Konsultasi &amp; RME Dokter</span>
                      <strong className="text-sm font-mono font-bold text-blue-800">
                        {data.ringkasan?.totalPemeriksaanRme || 0} Pasien
                      </strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Tindakan Klinis &amp; ICD-9</span>
                      <strong className="text-sm font-mono font-bold text-emerald-800">
                        {data.ringkasan?.totalTindakanMedis || 0} Prosedur
                      </strong>
                    </div>
                    <div className="border border-gray-400 p-2 text-center bg-gray-50">
                      <span className="text-gray-500 block">Skrining &amp; Resep Farmasi</span>
                      <strong className="text-xs font-mono font-bold text-gray-900">
                        {data.ringkasan?.totalSkriningPerawat || 0} Skrining / {data.ringkasan?.totalResepDiterbitkan || 0} Resep
                      </strong>
                    </div>
                  </div>

                  {/* Tabel Rekap Kinerja Tenaga Medis */}
                  <h3 className="text-[10px] font-bold text-gray-800 mb-1">
                    Buku Rekapitulasi Pelayanan Klinis Tenaga Medis (Hanya Nakes Aktif Bertugas):
                  </h3>
                  <table className="w-full border-collapse border border-gray-800 text-[9px] mb-4">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900 text-center">
                        <th className="border-r border-gray-800 px-2 py-1 w-8">No</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left">Nama Tenaga Medis</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left w-24">Profesi / Jabatan</th>
                        <th className="border-r border-gray-800 px-2 py-1 text-left w-24">Unit / Poliklinik</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">RME Pasien</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-16">Tindakan</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Resep</th>
                        <th className="border-r border-gray-800 px-2 py-1 w-14">Skrining</th>
                        <th className="px-2 py-1 w-18 font-mono font-bold text-right">Total Aktivitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data.daftarKinerjaNakes || []).filter((r: any) => r.adaTransaksi || r.totalAktivitas > 0)).length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-4 text-center text-gray-500 font-medium">
                            Tidak ada aktivitas pelayanan klinis tenaga medis pada rentang tanggal laporan ini.
                          </td>
                        </tr>
                      ) : (
                        (data.daftarKinerjaNakes || [])
                          .filter((r: any) => r.adaTransaksi || r.totalAktivitas > 0)
                          .map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-300 text-center bg-purple-50/20">
                              <td className="border-r border-gray-800 px-1 py-1 font-mono">{idx + 1}</td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left">
                                <div className="font-bold text-gray-900">{row.nama}</div>
                                <div className="text-[8px] text-gray-500 font-mono">
                                  {row.nomorSip !== '-' ? `SIP: ${row.nomorSip}` : (row.nomorStr !== '-' ? `STR: ${row.nomorStr}` : row.statusKepegawaian)}
                                </div>
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left font-semibold text-gray-700">
                                {row.profesi}
                              </td>
                              <td className="border-r border-gray-800 px-2 py-1 text-left text-gray-600">{row.poli}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-blue-900">{row.jumlahRme}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-emerald-900">{row.jumlahTindakan}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-amber-900">{row.jumlahResep}</td>
                              <td className="border-r border-gray-800 px-2 py-1 font-mono font-bold text-indigo-900">{row.jumlahScreening}</td>
                              <td className="px-2 py-1 font-mono font-black text-right text-purple-900">
                                {row.totalAktivitas} Layanan
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>

                  {/* Lampiran Log Audit Trail Aktivitas Klinis */}
                  {(data.logAktivitasNakes || []).length > 0 && (
                    <div className="mt-4 pt-2 border-t border-gray-400">
                      <div className="font-bold text-[10px] text-gray-800 mb-1">
                        Lampiran: Catatan Log Jurnal Pelayanan Klinis Pasien (Audit Trail Pelayanan)
                      </div>
                      <table className="w-full border-collapse border border-gray-600 text-[8px]">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-600 font-bold text-center">
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">Waktu</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-24">Kategori Layanan</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Tenaga Medis</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 text-left">Pasien (No. RM)</th>
                            <th className="border-r border-gray-600 px-1 py-0.5 w-20">Unit / Poli</th>
                            <th className="px-1 py-0.5 text-left">Rincian Aktivitas Klinis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.logAktivitasNakes.slice(0, 30).map((log: any, lIdx: number) => (
                            <tr key={lIdx} className="border-b border-gray-200">
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-mono">
                                {new Date(log.waktu).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center font-bold">
                                {log.labelJenis}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 font-bold text-left text-gray-900">
                                {log.nakesNama}
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-left">
                                {log.pasien} <span className="font-mono text-gray-500">({log.noRM})</span>
                              </td>
                              <td className="border-r border-gray-600 px-1 py-0.5 text-center text-gray-600">{log.poli}</td>
                              <td className="px-1 py-0.5 text-left text-gray-700">{log.keterangan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── FOOTER & LEGALITAS DUA TANDA TANGAN (STANDARD SP2TP) ── */}
            <div className="pt-4 text-xs">
              <div className="flex justify-between items-end">
                <div className="text-center w-56">
                  <p className="text-gray-600 text-[10px] mb-1">Petugas Pelapor / Tata Usaha,</p>
                  <p className="mb-14 text-gray-500 italic text-[9px]">(Tanda Tangan &amp; Cap Faskes)</p>
                  <p className="font-extrabold underline text-gray-900">{userName}</p>
                  <p className="text-[10px] text-gray-500 font-mono">NIP. 19920815.201903.1.002</p>
                </div>

                <div className="text-center w-60">
                  <p className="text-gray-600 text-[10px] mb-1">
                    Kab. Bogor, {tglCetakStr}
                  </p>
                  <p className="text-gray-600 text-[10px]">Mengetahui,</p>
                  <p className="font-bold text-gray-800 text-[10px] mb-1">Kepala UPTD Puskesmas,</p>
                  <p className="mb-12 text-gray-500 italic text-[9px]">(Tanda Tangan &amp; Cap Faskes)</p>
                  <p className="font-extrabold underline text-gray-900">
                    dr. Hj. Siti Nurhasanah, M.Kes
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">NIP. 19780512.200604.2.008</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-300 text-center text-[9px] text-gray-400">
                Dokumen resmi ini digenerate secara otomatis oleh SIKDA (Sistem Informasi Kesehatan Daerah) dan sah sebagai lampiran pelaporan SP2TP / Akreditasi Faskes.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

