"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Printer, Loader2 } from 'lucide-react';
import { useRujukanStore } from '@/store/rujukan.store';
import { useAuthStore } from '@/store/auth.store';

function SuratRujukanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kunjunganId = searchParams.get('kunjunganId');

  const { user } = useAuthStore();
  const { rujukanDetail, isLoading, isSendingSS, fetchRujukanDetail, kirimServiceRequest } = useRujukanStore();

  const [formData, setFormData] = useState({
    tujuanRS: '',
    tujuanPoli: '',
    tujuanDokter: '',
    namaPasien: '',
    umur: '',
    jenisKelamin: 'Laki-laki',
    alamat: '',
    anamnesa: '',
    pemeriksaanFisik: '',
    diagnosaSementara: '',
    terapi: '',
  });

  const [satusehatStatus, setSatusehatStatus] = useState<{
    processed: boolean;
    success: boolean;
    serviceRequestId?: string;
    message?: string;
  }>({
    processed: false,
    success: false
  });

  // Load detail rujukan dari database lokal jika kunjunganId disediakan
  useEffect(() => {
    if (kunjunganId) {
      fetchRujukanDetail(kunjunganId);
    }
  }, [kunjunganId, fetchRujukanDetail]);

  // Map data dari database lokal ke form editor
  useEffect(() => {
    if (rujukanDetail) {
      const pasien = rujukanDetail.pasien;
      const rekamMedis = rujukanDetail.rekamMedis;
      const rujukanKeluar = rujukanDetail.rujukanKeluar;

      // Kalkulasi umur sederhana
      let calculatedAge = '';
      if (pasien.tanggalLahir) {
        const birthYear = new Date(pasien.tanggalLahir).getFullYear();
        calculatedAge = String(new Date().getFullYear() - birthYear);
      }

      // Gabungkan diagnosa ICD-10
      const diagnosaStr = rujukanDetail.diagnosis
        ?.map(d => `${d.icd10?.kode_icd10} - ${d.icd10?.nama_diagnosis}`)
        .join(', ') || '';

      setFormData({
        tujuanRS: rujukanKeluar?.faskesTujuan || '',
        tujuanPoli: rujukanKeluar?.poliTujuan || '',
        tujuanDokter: '',
        namaPasien: pasien.namaLengkap || '',
        umur: calculatedAge,
        jenisKelamin: pasien.jenisKelamin || 'Laki-laki',
        alamat: pasien.alamat?.alamatDomisili || '',
        anamnesa: rekamMedis?.keluhanUtama || '',
        pemeriksaanFisik: rekamMedis?.pemeriksaanFisik || '',
        diagnosaSementara: diagnosaStr,
        terapi: rekamMedis?.rencanaTerapi || '',
      });

      if (rujukanKeluar?.satusehatId) {
        setSatusehatStatus({
          processed: true,
          success: true,
          serviceRequestId: rujukanKeluar.satusehatId
        });
      }
    }
  }, [rujukanDetail]);

  const handleProsesDanCetak = async () => {
    if (!kunjunganId) {
      // Fallback jika tidak ada Kunjungan ID (mode manual murni)
      window.print();
      return;
    }

    // Data rujukan sudah tersimpan ke DB lokal oleh DischargePlanning.tsx 
    // (simpanRujukan -> rawatJalan.service.js -> RujukanKeluar + Bundle SATUSEHAT + Tagihan)
    // Halaman ini hanya untuk preview & cetak surat rujukan fisik

    // Buka dialog cetak browser
    window.print();

    // Setelah cetak, arahkan kembali ke antrian dokter
    router.push(user?.role === 'DOKTER' ? '/dokter/rawat-jalan' : '/administrasi');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Memuat data rujukan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Panel Form Editor (Sembunyi saat print) */}
        <div className="w-full md:w-1/3 bg-white p-6 shadow-sm border border-gray-200 print:hidden h-fit">
          <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Form Editor Rujukan</h2>
          
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-3 bg-blue-50 border border-blue-100 space-y-3">
              <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider">Tujuan Rujukan</span>
              
              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">Rumah Sakit Tujuan *</label>
                <input type="text" placeholder="RSUD Kota / RS Siloam" className="w-full border border-blue-200 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-white" 
                  value={formData.tujuanRS} onChange={e => setFormData({...formData, tujuanRS: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">Poliklinik Rujukan *</label>
                <input type="text" placeholder="Poli Penyakit Dalam" className="w-full border border-blue-200 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-white" 
                  value={formData.tujuanPoli} onChange={e => setFormData({...formData, tujuanPoli: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">Dokter Spesialis Tujuan (TS)</label>
                <input type="text" placeholder="dr. Sp.PD (Optional)" className="w-full border border-blue-200 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-white" 
                  value={formData.tujuanDokter} onChange={e => setFormData({...formData, tujuanDokter: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pasien</label>
              <input type="text" className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" readOnly
                value={formData.namaPasien} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Umur (Tahun)</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" readOnly
                  value={formData.umur} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" readOnly
                  value={formData.jenisKelamin} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Alamat</label>
              <textarea className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" rows={2} readOnly
                value={formData.alamat} />
            </div>
            
            <div className="pt-2 border-t border-gray-200 mt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Anamnesa Singkat</label>
              <textarea className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                value={formData.anamnesa} onChange={e => setFormData({...formData, anamnesa: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Hasil Pemeriksaan Fisik</label>
              <textarea className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                value={formData.pemeriksaanFisik} onChange={e => setFormData({...formData, pemeriksaanFisik: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-red-700 mb-1">Diagnosa Sementara (ICD-10)</label>
              <input type="text" className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                value={formData.diagnosaSementara} onChange={e => setFormData({...formData, diagnosaSementara: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Terapi / Tindakan yang Diberikan</label>
              <textarea className="w-full border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                value={formData.terapi} onChange={e => setFormData({...formData, terapi: e.target.value})} />
            </div>
            
            <button 
              onClick={handleProsesDanCetak} 
              disabled={isSendingSS}
              className="w-full bg-blue-600 text-white font-bold py-3 mt-4 flex items-center justify-center gap-2 hover:bg-blue-700 sticky bottom-0 disabled:opacity-50"
            >
              {isSendingSS ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses Rujukan...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Cetak & Selesaikan Rujukan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel Kertas Surat (Print Area) */}
        <div className="w-full md:w-2/3 bg-white shadow-lg p-6 sm:p-12 min-h-[297mm] print:w-full print:shadow-none print:p-0 print:m-0 text-gray-900 flex flex-col justify-between">
          <div>
            {/* Kop Surat */}
            <div className="border-b-4 border-double border-gray-900 pb-4 mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide uppercase">Puskesmas / Fasilitas Kesehatan SIAP-KES</h1>
              <p className="text-sm text-gray-700">Jl. Jendral Sudirman No. 123, Jakarta Pusat</p>
              <p className="text-sm text-gray-700">Telp: (021) 1234567 | Email: info@klinikprima.com</p>
            </div>

            <div className="flex justify-between items-start mb-6 text-sm">
              <div>
                <p>Nomor : SR/{new Date().getFullYear()}/{(new Date().getMonth()+1).toString().padStart(2, '0')}/{rujukanDetail?.rujukanKeluar?.id?.substring(0, 5).toUpperCase() || 'NEW'}</p>
                <p>Lamp. : -</p>
                <p>Hal : <strong>Rujukan Pasien (SATUSEHAT Integrated)</strong></p>
              </div>
              <div className="text-right">
                <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
              </div>
            </div>

            <div className="mb-6 text-sm">
              <p className="mb-1">Kepada Yth. Teman Sejawat,</p>
              <p className="font-bold">{formData.tujuanDokter || 'dr. .................................................'}</p>
              <p>Di Poliklinik: {formData.tujuanPoli || '...........................................'}</p>
              <p>Rumah Sakit: {formData.tujuanRS || '...........................................'}</p>
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
                    <td className="font-bold">{formData.namaPasien || '...................................................'}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Umur / JK</td>
                    <td className="py-1">:</td>
                    <td>{formData.umur ? `${formData.umur} Tahun` : '......'} / {formData.jenisKelamin}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top">Alamat</td>
                    <td className="py-1 align-top">:</td>
                    <td>{formData.alamat || '.........................................................................'}</td>
                  </tr>
                  {rujukanDetail?.pasien?.noIHS && (
                    <tr>
                      <td className="py-1 text-xs font-semibold text-blue-700">SATUSEHAT Patient IHS</td>
                      <td className="py-1 text-blue-700">:</td>
                      <td className="text-xs font-mono text-blue-700">{rujukanDetail.pasien.noIHS}</td>
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
                    <td className="py-2 align-top border-b border-dotted border-gray-400">{formData.anamnesa}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top font-semibold">Pemeriksaan Fisik</td>
                    <td className="py-2 align-top">:</td>
                    <td className="py-2 align-top border-b border-dotted border-gray-400">{formData.pemeriksaanFisik}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top font-semibold">Diagnosa Sementara</td>
                    <td className="py-2 align-top">:</td>
                    <td className="py-2 align-top font-bold text-red-700">{formData.diagnosaSementara}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top font-semibold">Terapi Diberikan</td>
                    <td className="py-2 align-top">:</td>
                    <td className="py-2 align-top border-b border-dotted border-gray-400">{formData.terapi}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-6">
                Demikian surat rujukan ini kami sampaikan, atas bantuan dan kerja sama teman sejawat kami ucapkan terima kasih.
              </p>
            </div>
          </div>

          {/* Tanda Tangan & SATUSEHAT Integration Stamp */}
          <div className="mt-12 flex justify-between items-end border-t pt-4">
            <div className="text-xs text-gray-500 max-w-sm font-mono space-y-1">
              {satusehatStatus.processed && satusehatStatus.serviceRequestId ? (
                <div className="p-2 border border-green-200 bg-green-50 text-green-800 space-y-1">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-green-700">✓ SATUSEHAT INTEGRATED</p>
                  <p className="text-[10px]">ServiceRequest ID: {satusehatStatus.serviceRequestId}</p>
                  <p className="text-[9px]">Encounter: {rujukanDetail?.encounterId}</p>
                </div>
              ) : (
                <div className="p-2 border border-yellow-200 bg-yellow-50 text-yellow-800">
                  <p className="text-[10px] font-bold">⚠️ DRAFT / UNREGISTERED</p>
                  <p className="text-[9px]">Klik "Cetak & Selesaikan Rujukan" untuk mendaftarkan digital rujukan ke SatuSehat.</p>
                </div>
              )}
            </div>
            
            <div className="text-center text-sm w-48">
              <p className="mb-14">Salam Sejawat,</p>
              <p className="font-bold underline underline-offset-4">{rujukanDetail?.dokterTujuan?.namaLengkap || user?.namaLengkap || 'Nama Dokter'}</p>
              <p className="text-xs text-gray-500 mt-1">SIP. {rujukanDetail?.dokterTujuan?.tenagaMedis?.noIHS ? `IHS-${rujukanDetail.dokterTujuan.tenagaMedis.noIHS}` : '123.456.789'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuratRujukanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Memuat modul rujukan...</p>
        </div>
      </div>
    }>
      <SuratRujukanContent />
    </Suspense>
  );
}
