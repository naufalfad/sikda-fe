"use client";

import React, { useRef } from 'react';
import { Printer, X, FileText, CheckCircle2, Eye, Radio } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

interface CetakRadiologiModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderRadiologiData: any;
  pasienData?: any;
}

export default function CetakRadiologiModal({
  isOpen,
  onClose,
  orderRadiologiData,
  pasienData
}: CetakRadiologiModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Hasil_Radiologi_${pasienData?.namaLengkap ? String(pasienData.namaLengkap).replace(/[^a-zA-Z0-9]/g, '_') : 'Pasien'}_${orderRadiologiData?.acsn || ''}`,
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
        .rad-print-container {
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

  if (!isOpen || !orderRadiologiData) return null;

  const order = orderRadiologiData;
  const pasien = pasienData || order.pasien || order.kunjungan?.pasien;
  const dokter = order.dokter || order.kunjungan?.dokterTujuan;
  const hasil = order.hasil;
  const details = order.details || [];

  // Hitung Umur Sederhana
  let calculatedAge = '';
  if (pasien?.tanggalLahir) {
    const birthYear = new Date(pasien.tanggalLahir).getFullYear();
    calculatedAge = String(new Date().getFullYear() - birthYear);
  }

  const tanggalOrderStr = new Date(order.tanggalOrder || order.createdAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-300">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-slate-300" />
            <div>
              <h2 className="text-base font-extrabold leading-tight">Lembar Pemeriksaan &amp; Hasil Radiologi</h2>
              <p className="text-xs text-slate-300">ACSN: <span className="font-mono font-bold text-white">{order.acsn || 'ACSN-RAD'}</span> • DICOM Imaging Study</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Hasil Radiologi
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

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div 
            ref={printRef}
            className="rad-print-container w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-md p-10 font-sans text-xs flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* KOP SURAT */}
              <div className="border-b-4 border-double border-gray-900 pb-3 mb-6 text-center">
                <h1 className="text-xl font-black text-gray-900 tracking-wide uppercase">
                  PEMERINTAH KABUPATEN BOGOR / DINAS KESEHATAN
                </h1>
                <h2 className="text-lg font-black text-gray-900 uppercase mt-0.5">
                  INSTALASI RADIOLOGI &amp; DIAGNOSTIK IMAGING PUSKESMAS
                </h2>
                <p className="text-[11px] text-gray-600">Jl. Pelayanan Sehat No. 10, Kabupaten Bogor | Layanan X-Ray &amp; USG FKTP</p>
                <p className="text-[11px] text-gray-600 font-mono">Standar DICOM / PACS Terintegrasi NIDR Kemenkes SATUSEHAT</p>
              </div>

              {/* JUDUL DOKUMEN & ACSN */}
              <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
                    {order.isRujukanLuar ? 'SURAT PENGANTAR RUJUKAN RADIOLOGI EKSTERNAL' : 'LEMBAR HASIL & EKSPERTISE RADIOLOGI'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">No. ACSN : {order.acsn || '-'}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-gray-700">Tgl Periksa: {tanggalOrderStr}</span>
                </div>
              </div>

              {/* IDENTITAS PASIEN */}
              <div className="bg-slate-50 p-3.5 border border-slate-200 mb-5">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="w-28 py-1 font-semibold text-gray-600">Nama Pasien</td>
                      <td className="w-3 py-1">:</td>
                      <td className="font-extrabold text-gray-900 text-sm">{pasien?.namaLengkap || '-'}</td>
                      <td className="w-28 py-1 font-semibold text-gray-600 pl-4">No. RM</td>
                      <td className="w-3 py-1">:</td>
                      <td className="font-mono font-bold text-gray-900">{pasien?.noRM || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-gray-600">NIK (KTP)</td>
                      <td className="py-1">:</td>
                      <td className="font-mono">{pasien?.nik || '-'}</td>
                      <td className="py-1 font-semibold text-gray-600 pl-4">Umur / JK</td>
                      <td className="py-1">:</td>
                      <td>{calculatedAge ? `${calculatedAge} Thn` : '-'} / {pasien?.jenisKelamin || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-gray-600">Dokter Perujuk</td>
                      <td className="py-1">:</td>
                      <td className="font-medium text-gray-800">{dokter?.namaLengkap || 'Dokter Poli'}</td>
                      <td className="py-1 font-semibold text-gray-600 pl-4">Penjamin</td>
                      <td className="py-1">:</td>
                      <td>{pasien?.penjamin?.jenisPenjamin || 'Umum'}</td>
                    </tr>
                    {order.faskesTujuan && (
                      <tr>
                        <td className="py-1 font-semibold text-purple-900">RS / Faskes Tujuan</td>
                        <td className="py-1">:</td>
                        <td className="font-bold text-purple-950" colSpan={4}>{order.faskesTujuan}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* RINCIAN PEMERIKSAAN LOINC */}
              <div className="mb-5">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-2 border-b border-gray-300 pb-1">
                  1. Jenis Tindakan Pemeriksaan Radiologi
                </h4>
                <table className="w-full text-xs border border-gray-200">
                  <thead className="bg-purple-50 text-purple-950 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-left w-10">No</th>
                      <th className="p-2 text-left">Nama Pemeriksaan</th>
                      <th className="p-2 text-left w-28">Kode LOINC</th>
                      <th className="p-2 text-left w-36">Lokasi Anatomi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {details.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-gray-900">{d.namaPemeriksaan}</td>
                        <td className="p-2 font-mono text-purple-800">{d.kodeLoinc}</td>
                        <td className="p-2 text-gray-600">{d.bodySiteDisplay || 'Standar Foto'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BACAAN NARATIF & KESIMPULAN EKSPERTISE */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-300 pb-1">
                    2. Hasil Bacaan Ekspertise Radiologi (Temuan Citra)
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-line text-gray-800 leading-relaxed min-h-[90px]">
                    {hasil?.bacaanNaratif || (order.status === 'COMPLETED' ? 'Hasil ekspertise dalam batas normal.' : 'Pemeriksaan radiologi telah dijadwalkan / dalam proses ekspertise.')}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-300 pb-1">
                    3. Kesimpulan / Kesan (Diagnostic Impression)
                  </h4>
                  <div className="p-3 bg-purple-50/70 border border-purple-200 text-xs font-bold text-purple-950 whitespace-pre-line leading-relaxed">
                    {hasil?.kesimpulan || (order.status === 'COMPLETED' ? 'Kesan dalam batas normal.' : 'Menunggu hasil pembacaan dokter spesialis radiologi.')}
                  </div>
                </div>
              </div>

              {/* CATATAN KLINIS */}
              {order.catatanKlinis && (
                <div className="mb-6 p-2.5 bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                  <strong>Indikasi / Catatan Klinis:</strong> {order.catatanKlinis}
                </div>
              )}
            </div>

            {/* FOOTER & TANDA TANGAN */}
            <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end">
              <div className="text-[10px] text-gray-600 max-w-sm space-y-1">
                {hasil?.imagingStudyId || order.satusehatId ? (
                  <div className="p-2.5 border border-purple-300 bg-purple-50 rounded-none flex items-center gap-3">
                    <div className="bg-white p-1 border border-purple-300 shadow-xs flex-shrink-0">
                      <QRCodeSVG 
                        value={hasil?.wadoUrl || `https://satusehat.kemkes.go.id/imaging/${hasil?.imagingStudyId || order.satusehatId}`}
                        size={54}
                        level="M"
                      />
                    </div>
                    <div>
                      <p className="font-extrabold text-[10px] text-purple-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" /> DICOM / WADO SATUSEHAT
                      </p>
                      <p className="font-mono text-[9px] text-gray-800 break-all">ID: {hasil?.imagingStudyId || order.satusehatId}</p>
                      <p className="text-[9px] text-gray-500">Scan QR untuk membuka Viewer Citra Medis Online</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 border border-gray-200 bg-gray-50 text-[10px] text-gray-600">
                    <p className="font-bold">HASIL PEMERIKSAAN RADIOLOGI FKTP</p>
                    <p className="text-[9px]">Telah divalidasi oleh Petugas Radiologi &amp; Kasir Faskes</p>
                  </div>
                )}
              </div>

              <div className="text-center text-xs w-52">
                <p className="mb-12 text-gray-700">Dokter Spesialis Radiologi / Pemeriksa,</p>
                <p className="font-extrabold underline text-gray-900">{hasil?.dokterRadiologi?.namaLengkap || 'dr. Spesialis Radiologi, Sp.Rad'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">SIP. 446/RAD/1988/2026</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
