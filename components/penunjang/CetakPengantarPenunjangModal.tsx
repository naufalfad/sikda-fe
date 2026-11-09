"use client";

import React, { useRef, useState, useEffect } from 'react';
import {
  Printer, FileDown, X, TestTubes, Radio, Building2,
  FileText, CheckCircle2, User, Calendar, MapPin
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface CetakPengantarPenunjangModalProps {
  isOpen: boolean;
  onClose: () => void;
  kunjunganData: any;
  orderLabData?: any;
  orderRadiologiData?: any;
  defaultTab?: 'LAB' | 'RADIOLOGI';
}

export default function CetakPengantarPenunjangModal({
  isOpen,
  onClose,
  kunjunganData,
  orderLabData,
  orderRadiologiData,
  defaultTab
}: CetakPengantarPenunjangModalProps) {
  // Saring item lab yang berstatus rujukan eksternal
  const externalLabItems = (orderLabData?.details || []).filter((d: any) =>
    d.isRujukanLuar === true || (d.isRujukanLuar === undefined && !['darah rutin', 'gds', 'gula darah', 'urinalisa', 'bta', 'tcm', 'plano'].some(k => (d.parameter || '').toLowerCase().includes(k)))
  );

  const hasLabRujukan = externalLabItems.length > 0;
  const hasRadiologiRujukan = Boolean(orderRadiologiData && (orderRadiologiData.details?.length > 0 || orderRadiologiData.id));

  const [activeTab, setActiveTab] = useState<'LAB' | 'RADIOLOGI'>('LAB');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (hasLabRujukan) {
      setActiveTab('LAB');
    } else if (hasRadiologiRujukan) {
      setActiveTab('RADIOLOGI');
    }
  }, [isOpen, defaultTab, hasLabRujukan, hasRadiologiRujukan]);

  const labPrintRef = useRef<HTMLDivElement>(null);
  const radPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintLab = useReactToPrint({
    contentRef: labPrintRef,
    documentTitle: `Surat_Pengantar_Lab_${kunjunganData?.pasien?.namaLengkap || 'Pasien'}`,
  });

  const handlePrintRadiologi = useReactToPrint({
    contentRef: radPrintRef,
    documentTitle: `Surat_Pengantar_Radiologi_${kunjunganData?.pasien?.namaLengkap || 'Pasien'}`,
  });

  const handleDownloadPdf = async (type: 'LAB' | 'RADIOLOGI') => {
    const targetRef = type === 'LAB' ? labPrintRef.current : radPrintRef.current;
    if (!targetRef) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 8,
        filename: `Surat_Pengantar_${type}_${kunjunganData?.pasien?.namaLengkap || 'Pasien'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(targetRef).save();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  if (!isOpen || !kunjunganData) return null;

  const pasien = kunjunganData.pasien || {};
  const dokter = kunjunganData.dokterTujuan || orderLabData?.dokter || orderRadiologiData?.dokter || {};
  const faskesTujuanLab = externalLabItems[0]?.faskesTujuan || orderLabData?.faskesTujuan || 'UPT Labkesda Kabupaten / RSUD Rujukan Terdekat';
  const metodeRujukanLab = externalLabItems[0]?.metodeRujukan || orderLabData?.metodeRujukan || 'KIRIM_PASIEN';
  const faskesTujuanRad = orderRadiologiData?.faskesTujuan || 'Instalasi Radiologi RSUD Kabupaten / Faskes Rujukan';

  const formatTanggal = (val: any) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  let umurStr = '-';
  if (pasien.tanggalLahir) {
    try {
      const now = new Date();
      const birth = new Date(pasien.tanggalLahir);
      const age = now.getFullYear() - birth.getFullYear();
      umurStr = `${age} Tahun`;
    } catch {
      umurStr = '-';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        
        {/* HEADER CONTROLS */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                Surat Pengantar Pemeriksaan Penunjang Luar (Rujukan Parsial)
              </h3>
              <p className="text-xs text-slate-300">
                Pasien: <strong className="text-white">{pasien.namaLengkap}</strong> • No. RM: <strong className="text-white">{pasien.noRM || pasien.noRekamMedis || '-'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'LAB') handlePrintLab();
                else handlePrintRadiologi();
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak Lembar Ini
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf(activeTab)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB SELECTOR: MAKSIMAL 2 LEMBAR (LABORATORIUM & RADIOLOGI) */}
        <div className="bg-slate-100 border-b border-slate-300 px-6 pt-2 flex gap-2 shrink-0">
          <button
            type="button"
            disabled={!hasLabRujukan}
            onClick={() => setActiveTab('LAB')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'LAB'
                ? 'border-rose-600 text-rose-700 bg-white shadow-xs'
                : hasLabRujukan
                ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <TestTubes className="w-4 h-4 text-amber-600" />
            <span>Lembar 1: Rujukan Laboratorium</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
              {externalLabItems.length} Parameter
            </span>
          </button>

          <button
            type="button"
            disabled={!hasRadiologiRujukan}
            onClick={() => setActiveTab('RADIOLOGI')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'RADIOLOGI'
                ? 'border-rose-600 text-rose-700 bg-white shadow-xs'
                : hasRadiologiRujukan
                ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-600" />
            <span>Lembar 2: Rujukan Radiologi / Rontgen</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 text-[10px] font-mono font-bold">
              {orderRadiologiData?.details?.length || 0} Foto
            </span>
          </button>
        </div>

        {/* PAPER PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-300 flex justify-center">
          
          {/* ======================================================== */}
          {/* LEMBAR 1: SURAT PENGANTAR RUJUKAN LABORATORIUM */}
          {/* ======================================================== */}
          {activeTab === 'LAB' && (
            <div
              ref={labPrintRef}
              className="bg-white shadow-2xl p-8 sm:p-12 text-slate-900 font-sans text-[10pt] leading-relaxed w-full max-w-3xl min-h-[297mm] box-border my-auto"
            >
              {/* KOP RESMI PUSKESMAS */}
              <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center relative">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">PEMERINTAH DAERAH KABUPATEN / KOTA</h3>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">DINAS KESEHATAN</h2>
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">PUSAT KESEHATAN MASYARAKAT (PUSKESMAS)</h1>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Fasilitas Kesehatan Tingkat Pertama (FKTP) • Wilayah Kerja Dinas Kesehatan Kabupaten
                </p>
              </div>

              {/* JUDUL LEMBAR */}
              <div className="text-center mb-5">
                <h2 className="text-sm font-black uppercase tracking-wider underline">
                  SURAT PENGANTAR PEMERIKSAAN LABORATORIUM EKSTERNAL
                </h2>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                  Nomor: REF-LAB/{new Date().getFullYear()}/{orderLabData?.id?.slice(-6).toUpperCase() || '001'}
                </p>
              </div>

              {/* TUJUAN RUJUKAN & METODE */}
              <div className="bg-slate-50 border border-slate-300 p-3 mb-4 text-xs space-y-1">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">Faskes Lab Tujuan</span>
                  <span className="w-4">:</span>
                  <span className="font-extrabold text-slate-900">{faskesTujuanLab}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">Metode Penyerahan</span>
                  <span className="w-4">:</span>
                  <span className="font-bold text-slate-800">
                    {metodeRujukanLab === 'KIRIM_SPESIMEN'
                      ? '🧪 Pengiriman Sampel / Spesimen (Sampel diambil di Puskesmas dan dikirim via kurir faskes)'
                      : '🚶‍♂️ Pengantar Pasien Langsung (Pasien datang langsung ke Labkesda/RS tujuan untuk pengambilan & uji)'}
                  </span>
                </div>
              </div>

              {/* IDENTITAS PASIEN */}
              <div className="border border-slate-300 p-3 mb-4 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-700 border-b pb-1 mb-2">
                  Identitas Pasien:
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-600">Nama Lengkap</span>
                    <span className="w-3">:</span>
                    <strong className="text-slate-900">{pasien.namaLengkap}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">No. Rekam Medis</span>
                    <span className="w-3">:</span>
                    <strong className="font-mono text-slate-900">{pasien.noRM || pasien.noRekamMedis || '-'}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">NIK Pasien</span>
                    <span className="w-3">:</span>
                    <span className="font-mono text-slate-900">{pasien.nik || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Jenis Kelamin / Usia</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900">{pasien.jenisKelamin || '-'} / {umurStr}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Jenis Penjamin</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900">{pasien.penjamin?.jenisPenjamin || 'Umum'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Alamat Pasien</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900 truncate">{pasien.alamat?.alamatKtp || pasien.alamat?.desaKelurahan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* TABEL SELURUH PARAMETER UJI LAB LUAR (1 TABEL DIGABUNG) */}
              <div className="mb-4">
                <h4 className="font-bold uppercase tracking-wider text-xs text-slate-800 mb-1.5">
                  Daftar Pemeriksaan Laboratorium yang Diminta:
                </h4>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-400 px-3 py-1.5 text-center w-10">No</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-left">Parameter Pemeriksaan Uji</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-left w-36">Kategori Spesimen</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-center w-28">Tarif di Puskesmas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalLabItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 px-3 py-1.5 font-bold text-slate-900">{item.parameter}</td>
                        <td className="border border-slate-400 px-3 py-1.5 text-slate-600">Darah / Serum / Urin</td>
                        <td className="border border-slate-400 px-3 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                          Rp 0 (Rujukan)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INDIKASI MEDIS & CATATAN KLINIS */}
              <div className="border border-slate-300 p-3 mb-6 text-xs bg-slate-50">
                <span className="font-bold text-slate-800 block mb-0.5">Diagnosa Klinis / Indikasi Permintaan:</span>
                <p className="text-slate-700 italic">
                  {orderLabData?.catatanKlinis || kunjunganData?.rekamMedis?.keluhanUtama || 'Kebutuhan pemeriksaan diagnostik penunjang lanjutan'}
                </p>
              </div>

              {/* TANDA TANGAN DOKTER */}
              <div className="flex justify-between items-end text-xs pt-4">
                <div className="text-slate-500 text-[10px]">
                  <p>Catatan:</p>
                  <p>• Lembar asli diserahkan ke loket faskes lab rujukan.</p>
                  <p>• Hasil dibawa kembali ke dokter Puskesmas pengirim.</p>
                </div>

                <div className="text-center w-56">
                  <p className="text-slate-700">{formatTanggal(orderLabData?.tanggalOrder || new Date())}</p>
                  <p className="text-slate-800 font-bold mt-0.5">Dokter Pemeriksa,</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-mono italic">[Tanda Tangan & Cap]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 border-t border-slate-800 pt-1">
                    dr. {dokter.namaLengkap || 'Dokter Puskesmas'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">SIP: {dokter.sip || '19820315.201001.1.002'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* LEMBAR 2: SURAT PENGANTAR PEMERIKSAAN RADIOLOGI */}
          {/* ======================================================== */}
          {activeTab === 'RADIOLOGI' && (
            <div
              ref={radPrintRef}
              className="bg-white shadow-2xl p-8 sm:p-12 text-slate-900 font-sans text-[10pt] leading-relaxed w-full max-w-3xl min-h-[297mm] box-border my-auto"
            >
              {/* KOP RESMI PUSKESMAS */}
              <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center relative">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">PEMERINTAH DAERAH KABUPATEN / KOTA</h3>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">DINAS KESEHATAN</h2>
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">PUSAT KESEHATAN MASYARAKAT (PUSKESMAS)</h1>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Instalasi Rawat Jalan & Gawat Darurat • Surat Pengantar Radiologi Rujukan Luar
                </p>
              </div>

              {/* JUDUL LEMBAR */}
              <div className="text-center mb-5">
                <h2 className="text-sm font-black uppercase tracking-wider underline">
                  SURAT PENGANTAR PEMERIKSAAN RADIOLOGI / IMAGING EKSTERNAL
                </h2>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                  Nomor Aksesi: <strong className="text-slate-900">{orderRadiologiData?.acsn || 'ACSN-2026-001'}</strong>
                </p>
              </div>

              {/* TUJUAN RUJUKAN */}
              <div className="bg-slate-50 border border-slate-300 p-3 mb-4 text-xs space-y-1">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">Faskes / RS Tujuan</span>
                  <span className="w-4">:</span>
                  <span className="font-extrabold text-slate-900">{faskesTujuanRad}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-700">Instalasi Tujuan</span>
                  <span className="w-4">:</span>
                  <span className="font-bold text-slate-800">Instalasi Radiologi / Unit Diagnostic Imaging</span>
                </div>
              </div>

              {/* IDENTITAS PASIEN */}
              <div className="border border-slate-300 p-3 mb-4 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-700 border-b pb-1 mb-2">
                  Identitas Pasien:
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-600">Nama Lengkap</span>
                    <span className="w-3">:</span>
                    <strong className="text-slate-900">{pasien.namaLengkap}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">No. Rekam Medis</span>
                    <span className="w-3">:</span>
                    <strong className="font-mono text-slate-900">{pasien.noRM || pasien.noRekamMedis || '-'}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">NIK Pasien</span>
                    <span className="w-3">:</span>
                    <span className="font-mono text-slate-900">{pasien.nik || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Jenis Kelamin / Usia</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900">{pasien.jenisKelamin || '-'} / {umurStr}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Jenis Penjamin</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900">{pasien.penjamin?.jenisPenjamin || 'Umum'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Alamat Pasien</span>
                    <span className="w-3">:</span>
                    <span className="text-slate-900 truncate">{pasien.alamat?.alamatKtp || pasien.alamat?.desaKelurahan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* TABEL SELURUH PERMINTAAN FOTO RADIOLOGI (1 TABEL DIGABUNG) */}
              <div className="mb-4">
                <h4 className="font-bold uppercase tracking-wider text-xs text-slate-800 mb-1.5">
                  Permintaan Pemeriksaan Foto Radiologi / Imaging:
                </h4>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-400 px-3 py-1.5 text-center w-10">No</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-left">Pemeriksaan Foto (LOINC)</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-left w-36">Lokasi Anatomis</th>
                      <th className="border border-slate-400 px-3 py-1.5 text-center w-28">Tarif di Puskesmas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orderRadiologiData?.details || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 px-3 py-1.5 font-bold text-slate-900">
                          {item.namaPemeriksaan}{' '}
                          <span className="font-mono text-[10px] text-slate-500 font-normal">({item.kodeLoinc})</span>
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-slate-700">
                          {item.bodySiteDisplay || 'Sesuai Indikasi'}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                          Rp 0 (Rujukan)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DIAGNOSA KERJA & KETERANGAN KLINIS */}
              <div className="border border-slate-300 p-3 mb-6 text-xs bg-slate-50">
                <span className="font-bold text-slate-800 block mb-0.5">Diagnosa Klinis / Indikasi Permintaan:</span>
                <p className="text-slate-700 italic">
                  {orderRadiologiData?.catatanKlinis || kunjunganData?.rekamMedis?.keluhanUtama || 'Evaluasi radiologis organ terkait'}
                </p>
              </div>

              {/* TANDA TANGAN DOKTER */}
              <div className="flex justify-between items-end text-xs pt-4">
                <div className="text-slate-500 text-[10px]">
                  <p>Catatan:</p>
                  <p>• Lembar ini asli diserahkan ke Loket Radiologi RS tujuan.</p>
                  <p>• Pasien membawa kembali hasil cetak/foto ke Puskesmas.</p>
                </div>

                <div className="text-center w-56">
                  <p className="text-slate-700">{formatTanggal(orderRadiologiData?.tanggalOrder || new Date())}</p>
                  <p className="text-slate-800 font-bold mt-0.5">Dokter Pengirim,</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-mono italic">[Tanda Tangan & Cap]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 border-t border-slate-800 pt-1">
                    dr. {dokter.namaLengkap || 'Dokter Puskesmas'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">SIP: {dokter.sip || '19820315.201001.1.002'}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
