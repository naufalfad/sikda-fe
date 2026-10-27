import React, { useRef } from 'react';
import { Printer, FileDown, X, Building2, TestTubes, AlertCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { isInternalLabTest } from '@/app/(main)/dokter/rawat-jalan/rawatJalan.constants';

interface SuratRujukanSpesimenModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function SuratRujukanSpesimenModal({
  isOpen,
  onClose,
  order,
}: SuratRujukanSpesimenModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Rujukan_Spesimen_${order?.pasien?.namaLengkap || 'Pasien'}`,
  });

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      const opt = {
        margin: 0,
        filename: `Surat_Rujukan_Spesimen_${order?.pasien?.namaLengkap || 'Pasien'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  if (!isOpen || !order) return null;

  const pasien = order.pasien;
  const dokter = order.dokter;
  const externalTests = (order.details || []).filter((d: any) => !isInternalLabTest(d.parameter));

  const formatAlamat = (alamat: any) => {
    if (!alamat) return '-';
    if (typeof alamat === 'string') return alamat;
    if (typeof alamat === 'object') {
      if (alamat.alamatLengkap) return String(alamat.alamatLengkap);
      const street = alamat.alamatDomisili || alamat.alamatKtp || alamat.jalan;
      const parts = [
        street,
        alamat.rtRw ? `RT/RW ${alamat.rtRw}` : '',
        alamat.desaKelurahan,
        alamat.kecamatan,
        alamat.kabupatenKota,
        alamat.provinsi
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '-';
    }
    return '-';
  };

  const safeFormatDate = (val: any) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  let displayAge = '-';
  if (pasien?.tanggalLahir) {
    try {
      const tglLahir = new Date(pasien.tanggalLahir);
      if (!isNaN(tglLahir.getTime())) {
        const now = new Date();
        const ageYears = now.getFullYear() - tglLahir.getFullYear();
        const ageMonths = now.getMonth() - tglLahir.getMonth();
        displayAge = ageMonths < 0 
          ? `${ageYears - 1} Tahun ${12 + ageMonths} Bulan`
          : `${ageYears} Tahun ${ageMonths} Bulan`;
      }
    } catch {
      displayAge = '-';
    }
  }

  const tanggalOrderStr = safeFormatDate(order.tanggalOrder || new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[96vh] border border-slate-300">
        
        {/* Modal Top Bar */}
        <div className="flex flex-wrap justify-between items-center p-4 border-b border-indigo-100 bg-indigo-50/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TestTubes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-indigo-950">
                Surat Pengantar Rujukan Spesimen Laboratorium
              </h3>
              <p className="text-xs text-indigo-700">
                Dokumen resmi rujukan uji spesimen ke Laboratorium Kesehatan Daerah (Labkesda) / RS Rujukan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Cetak Surat
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200 flex justify-center">
          <div 
            ref={printRef}
            className="shadow-2xl overflow-hidden bg-white max-w-full text-black font-sans text-[10pt] p-8 sm:p-12 leading-relaxed"
            style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
          >
            {/* KOP RESMI */}
            <div className="border-b-2 border-black pb-4 mb-6 text-center relative">
              <h2 className="text-base font-bold uppercase tracking-wider">PEMERINTAH KABUPATEN / KOTA</h2>
              <h1 className="text-xl font-extrabold uppercase tracking-wide">DINAS KESEHATAN</h1>
              <h3 className="text-sm font-semibold uppercase">PUSAT KESEHATAN MASYARAKAT (PUSKESMAS)</h3>
              <p className="text-xs text-gray-600 mt-1">
                Jl. Kesehatan No. 01, Wilayah Kerja Faskes Tingkat 1 • Telp: (021) 1234567 • Email: lab.puskesmas@sikda.local
              </p>
            </div>

            {/* JUDUL SURAT */}
            <div className="text-center mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider underline">
                SURAT PENGANTAR RUJUKAN SPESIMEN LABORATORIUM
              </h2>
              <p className="text-xs font-mono text-gray-600 mt-0.5">
                No: {order.id ? `LAB/RUJ/${order.id.slice(-6).toUpperCase()}/${new Date().getFullYear()}` : '-'}
              </p>
            </div>

            {/* TUJUAN RUJUKAN */}
            <div className="mb-6 text-xs">
              <p>Kepada Yth.</p>
              <p className="font-bold">Kepala Laboratorium Kesehatan Daerah (Labkesda) / RS Rujukan</p>
              <p>di Tempat</p>
            </div>

            <p className="text-xs mb-4">
              Dengan hormat, bersama ini kami kirimkan spesimen klinis dari pasien berikut untuk dilakukan pemeriksaan laboratorium penunjang:
            </p>

            {/* DATA PASIEN */}
            <div className="bg-slate-50 border border-slate-300 p-4 mb-6 text-xs space-y-1.5">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Nama Pasien</span>
                <span className="col-span-2 font-bold text-gray-900">: {pasien?.namaLengkap}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">No. Rekam Medis (RM)</span>
                <span className="col-span-2 font-mono font-bold text-gray-900">: {pasien?.noRM}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">NIK</span>
                <span className="col-span-2 font-mono text-gray-900">: {pasien?.nik || '-'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Jenis Kelamin / Usia</span>
                <span className="col-span-2 text-gray-900">: {pasien?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} / {displayAge}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Alamat Lengkap</span>
                <span className="col-span-2 text-gray-900">: {formatAlamat(pasien?.alamat)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Dokter Pengirim</span>
                <span className="col-span-2 text-gray-900">: {dokter?.namaLengkap || 'dr. Pemeriksa'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Poli / Unit Asal</span>
                <span className="col-span-2 text-gray-900">: {order.kunjungan?.poliklinik?.namaPoli || 'Poli Umum'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-600">Catatan Klinis / Indikasi</span>
                <span className="col-span-2 text-gray-900 italic">: {order.catatanKlinis || 'Pemeriksaan rujukan penunjang diagnosis faskes 1'}</span>
              </div>
            </div>

            {/* TABEL SPESIMEN & PEMERIKSAAN YANG DIRUJUK */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase mb-2">
                Daftar Permintaan Pemeriksaan yang Dirujuk ({externalTests.length > 0 ? externalTests.length : (order.details || []).length} Item):
              </h4>
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 font-bold text-left">
                    <th className="border border-black p-2 w-10 text-center">No</th>
                    <th className="border border-black p-2">Nama Parameter Uji</th>
                    <th className="border border-black p-2 w-32">Jenis Spesimen</th>
                    <th className="border border-black p-2 w-44">Keterangan / Alasan Rujuk</th>
                  </tr>
                </thead>
                <tbody>
                  {(externalTests.length > 0 ? externalTests : (order.details || [])).map((detail: any, idx: number) => (
                    <tr key={detail.id || idx}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-bold">{detail.parameter}</td>
                      <td className="border border-black p-2">Darah / Serum / Swab</td>
                      <td className="border border-black p-2 text-gray-700">Fasilitas lab tingkat lanjut (Labkesda/RS)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs mb-8">
              Mohon lembar hasil uji dapat dikirimkan kembali kepada kami atau diteruskan kepada pasien untuk integrasi berkas Rekam Medis Elektronik (RME). Atas bantuan dan kerjasamanya, kami sampaikan terima kasih.
            </p>

            {/* TANDA TANGAN */}
            <div className="grid grid-cols-2 text-xs pt-4">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-bold">Dokter Pemeriksa,</p>
                <div className="h-20 flex items-end justify-center">
                  <span className="border-b border-black w-48 inline-block font-bold">
                    {dokter?.namaLengkap || '( .......................................... )'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">SIP Dokter</p>
              </div>

              <div className="text-center">
                <p>{tanggalOrderStr}</p>
                <p className="font-bold">Petugas Pengirim Spesimen,</p>
                <div className="h-20 flex items-end justify-center">
                  <span className="border-b border-black w-48 inline-block font-bold">
                    ( Petugas / Analis Lab Puskesmas )
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">NIP/NRPK</p>
              </div>
            </div>

            {/* TANDA TERIMA BAWAH */}
            <div className="mt-12 pt-4 border-t border-dashed border-gray-400 text-[10px] text-gray-600">
              <div className="flex justify-between items-center">
                <span>Bukti Pengiriman Spesimen Rujukan • Lembar Arsip Faskes</span>
                <span>Tgl Terima Faskes Rujukan: .................... / Petugas: ....................</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-gray-200 bg-white flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
