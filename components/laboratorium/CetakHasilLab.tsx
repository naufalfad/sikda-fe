import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2 } from 'lucide-react';

interface CetakHasilLabProps {
  data: any; // OrderLab beserta relasinya (pasien, dokter, details)
}

export const CetakHasilLab = forwardRef<HTMLDivElement, CetakHasilLabProps>(({ data }, ref) => {
  if (!data) return null;

  const pasien = data.pasien || data.kunjungan?.pasien;
  const dokter = data.dokter || data.kunjungan?.dokterTujuan;
  const details = data.details || [];
  const tanggalOrder = data.tanggalOrder || data.createdAt || new Date();
  const id = data.id || '';

  // Safe formatting helper for Indonesian dates
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

  // Safe formatting helper for address
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

  // Formatting age safely
  let calculatedAge = '';
  if (pasien?.tanggalLahir) {
    try {
      const birthYear = new Date(pasien.tanggalLahir).getFullYear();
      calculatedAge = String(new Date().getFullYear() - birthYear);
    } catch {
      calculatedAge = '';
    }
  }

  const tanggalOrderStr = safeFormatDate(tanggalOrder);

  return (
    <div 
      ref={ref} 
      className="w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-md p-10 font-sans text-xs flex flex-col justify-between mx-auto"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* KOP SURAT RESMI */}
        <div className="border-b-4 border-double border-gray-900 pb-3 mb-6 text-center">
          <h1 className="text-xl font-black text-gray-900 tracking-wide uppercase">
            PEMERINTAH KABUPATEN BOGOR / DINAS KESEHATAN
          </h1>
          <h2 className="text-lg font-black text-gray-900 uppercase mt-0.5">
            INSTALASI LABORATORIUM KLINIK PUSKESMAS
          </h2>
          <p className="text-[11px] text-gray-600">Jl. Pelayanan Sehat No. 10, Kabupaten Bogor | Layanan Laboratorium FKTP &amp; Rujukan Eksternal</p>
          <p className="text-[11px] text-gray-600 font-mono">Standar Akreditasi Kemenkes SATUSEHAT • Layanan Patologi Klinik Terpadu</p>
        </div>

        {/* JUDUL DOKUMEN & NOMOR ORDER */}
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
              LEMBAR PEMERIKSAAN &amp; HASIL LABORATORIUM
            </h3>
            <p className="text-[10px] text-gray-500 font-mono">No. Order : {id ? id.slice(-8).toUpperCase() : '-'}</p>
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
                <td className="font-medium text-gray-800">{dokter?.namaLengkap || 'Dokter Pemeriksa'}</td>
                <td className="py-1 font-semibold text-gray-600 pl-4">Penjamin</td>
                <td className="py-1">:</td>
                <td>{pasien?.penjamin?.jenisPenjamin || 'Umum'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-gray-600">Unit / Poli Asal</td>
                <td className="py-1">:</td>
                <td className="text-gray-800">{data.kunjungan?.poliklinik?.namaPoli || 'Poli Umum'}</td>
                <td className="py-1 font-semibold text-gray-600 pl-4">Alamat</td>
                <td className="py-1">:</td>
                <td className="truncate max-w-[200px]">{formatAlamat(pasien?.alamat)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RINCIAN PEMERIKSAAN LABORATORIUM */}
        <div className="mb-5">
          <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-2 border-b border-gray-300 pb-1">
            1. Jenis Tindakan &amp; Parameter Pemeriksaan Laboratorium
          </h4>
          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-purple-50 text-purple-950 font-bold border-b border-gray-200">
              <tr>
                <th className="p-2 text-left w-10">No</th>
                <th className="p-2 text-left">Nama Pemeriksaan</th>
                <th className="p-2 text-center w-28">Hasil Uji</th>
                <th className="p-2 text-center w-36">Nilai Rujukan</th>
                <th className="p-2 text-left w-28">Status / Ket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {details && details.length > 0 ? (
                details.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-2 font-bold text-gray-900">{item.parameter}</td>
                    <td className="p-2 text-center font-mono font-bold">
                      <span className={item.kritis ? 'text-red-600' : 'text-gray-900'}>
                        {item.hasil || '-'} {item.satuan || ''}
                      </span>
                      {item.kritis && <span className="ml-1 text-[9px] font-bold text-red-600">(*)</span>}
                    </td>
                    <td className="p-2 text-center text-gray-600 font-mono">
                      {item.nilaiRujukan || 'Standar Normal'}
                    </td>
                    <td className="p-2 text-xs">
                      {item.kritis ? (
                        <span className="text-red-700 font-bold">Abnormal</span>
                      ) : item.hasil ? (
                        <span className="text-emerald-700 font-semibold">Normal</span>
                      ) : (
                        <span className="text-gray-500">Tervalidasi</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                    Tidak ada parameter pemeriksaan laboratorium.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CATATAN ANALIS & KESIMPULAN KLINIS */}
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-300 pb-1">
              2. Catatan Klinis &amp; Hasil Analisis Laboratorium
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-line text-gray-800 leading-relaxed min-h-[75px]">
              {data.catatanKlinis || data.catatanHasil || 'Hasil pemeriksaan laboratorium telah divalidasi oleh analis laboratorium.'}
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-300 pb-1">
              3. Kesimpulan / Saran Klinis
            </h4>
            <div className="p-3 bg-purple-50/70 border border-purple-200 text-xs font-bold text-purple-950 whitespace-pre-line leading-relaxed">
              Hasil pemeriksaan harus dikorelasikan dengan kondisi klinis pasien, faktor risiko, dan pemeriksaan diagnostik lainnya.
            </div>
          </div>
        </div>

        {data.catatanKlinis && (
          <div className="mb-6 p-2.5 bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
            <strong>Indikasi / Alasan Pemeriksaan:</strong> {data.catatanKlinis}
          </div>
        )}
      </div>

      {/* FOOTER & TANDA TANGAN */}
      <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end">
        <div className="text-[10px] text-gray-600 max-w-sm space-y-1">
          <div className="p-2.5 border border-purple-300 bg-purple-50 rounded-none flex items-center gap-3">
            <div className="bg-white p-1 border border-purple-300 shadow-xs flex-shrink-0">
              <QRCodeSVG 
                value={`https://satusehat.kemkes.go.id/diagnostic-report/lab/${id || 'LAB'}`}
                size={54}
                level="M"
              />
            </div>
            <div>
              <p className="font-extrabold text-[10px] text-purple-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" /> SATUSEHAT DIAGNOSTIC REPORT
              </p>
              <p className="font-mono text-[9px] text-gray-800 break-all">ID: {id || 'LAB-ORD'}</p>
              <p className="text-[9px] text-gray-500">Scan QR untuk verifikasi keaslian dokumen laboratorium</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs w-52">
          <p className="mb-12 text-gray-700">Penanggung Jawab Lab / Dokter Pemeriksa,</p>
          <p className="font-extrabold underline text-gray-900">{dokter?.namaLengkap || 'dr. Pemeriksa Puskesmas'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">SIP. 446/LAB/1990/2026</p>
        </div>
      </div>

    </div>
  );
});

CetakHasilLab.displayName = 'CetakHasilLab';
