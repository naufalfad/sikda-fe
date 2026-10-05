'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Stethoscope, FileText, 
  Activity, Eye, CheckCircle2, Loader2, AlertCircle, Search, ChevronRight
} from 'lucide-react';
import { rawatJalanService } from '@/services/rawatJalan.service';

interface RiwayatKedatanganTabProps {
  noRM: string;
}

export default function RiwayatKedatanganTab({ noRM }: RiwayatKedatanganTabProps) {
  const [riwayatData, setRiwayatData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        setIsLoading(true);
        const res = await rawatJalanService.getRiwayatPasienByRM(noRM);
        if (res.success) {
          setRiwayatData(res.data);
        } else {
          setError(res.message || 'Gagal mengambil riwayat kunjungan.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan jaringan.');
      } finally {
        setIsLoading(false);
      }
    };

    if (noRM) fetchRiwayat();
  }, [noRM]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getTriageBadge = (triage: string | undefined | null) => {
    const t = triage?.toUpperCase() || 'HIJAU';
    if (t === 'MERAH') return <span className="px-2.5 py-0.5 text-xs font-black bg-red-100 text-red-700 border border-red-200">MERAH</span>;
    if (t === 'KUNING') return <span className="px-2.5 py-0.5 text-xs font-black bg-yellow-100 text-yellow-800 border border-yellow-200">KUNING</span>;
    if (t === 'HITAM') return <span className="px-2.5 py-0.5 text-xs font-black bg-slate-800 text-white border border-slate-900">HITAM</span>;
    return <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">HIJAU</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Memuat Riwayat Kedatangan Pasien...</p>
      </div>
    );
  }

  if (error || !riwayatData) {
    return (
      <div className="bg-white p-8 text-center border border-gray-200 shadow-sm">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 className="font-bold text-gray-800 text-base">Belum Ada Riwayat Kedatangan</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">{error || 'Pasien belum memiliki catatan kunjungan sebelumnya di sistem.'}</p>
      </div>
    );
  }

  const visits = riwayatData.kunjungans || [];

  return (
    <div className="space-y-6">
      {/* Overview Info Header */}
      <div className="bg-blue-50/60 border border-blue-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-blue-900 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Riwayat Berobat Pasien (No. RM: {noRM})
          </h3>
          <p className="text-xs text-blue-700 mt-0.5">
            Total Kunjungan Tercatat: <span className="font-bold">{visits.length} Kali</span>
          </p>
        </div>
      </div>

      {/* Visits List */}
      {visits.length === 0 ? (
        <div className="bg-white p-8 text-center border border-gray-200">
          <p className="text-sm text-gray-500">Tidak ada kunjungan sebelumnya.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((v: any) => {
            const sc = v.screening || {};
            const rm = v.rekamMedis || {};
            const diagUtama = v.diagnosis?.find((d: any) => d.jenisDiagnosis === 'Utama')?.diagnosisKlinis || v.diagnosis?.[0]?.diagnosisKlinis || rm.diagnosisKlinis || '-';

            return (
              <div 
                key={v.id} 
                className="bg-white border border-gray-200 hover:border-blue-300 transition-all p-5 shadow-sm space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1">
                      {formatDate(v.tanggalRegistrasi)}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Jam: {v.jamRegistrasi} WIB
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700">
                      {v.poliklinik?.namaPoli || 'Poli'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getTriageBadge(v.screening?.kategoriTriage)}
                    <button
                      type="button"
                      onClick={() => setSelectedVisit(v)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail Skrining
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Dokpol */}
                  <div>
                    <span className="text-gray-400 font-semibold block uppercase">Dokter Penanggung Jawab</span>
                    <span className="font-bold text-gray-900">{v.dokterTujuan?.namaLengkap || 'Dokter'}</span>
                  </div>

                  {/* Keluhan */}
                  <div className="md:col-span-2">
                    <span className="text-gray-400 font-semibold block uppercase">Keluhan Utama</span>
                    <span className="font-medium text-gray-800">{sc.keluhanUtama || rm.keluhanUtama || '-'}</span>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <span className="text-gray-400 font-semibold block uppercase">Diagnosis Utama</span>
                    <span className="font-extrabold text-blue-800">{diagUtama}</span>
                  </div>
                </div>

                {/* TTV Highlights Row */}
                {(sc.tekananDarahSistolik || sc.suhuTubuh || sc.nadi) && (
                  <div className="bg-gray-50 p-3 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Tekanan Darah:</span>{' '}
                      <span className="font-bold text-gray-900">
                        {sc.tekananDarahSistolik && sc.tekananDarahDiastolik ? `${sc.tekananDarahSistolik}/${sc.tekananDarahDiastolik} mmHg` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nadi:</span>{' '}
                      <span className="font-bold text-gray-900">{sc.nadi ? `${sc.nadi} x/mnt` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Suhu:</span>{' '}
                      <span className="font-bold text-gray-900">{sc.suhuTubuh ? `${sc.suhuTubuh} °C` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Napas:</span>{' '}
                      <span className="font-bold text-gray-900">{sc.frekuensiNapas ? `${sc.frekuensiNapas} x/mnt` : '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Skrining Masa Lalu */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-blue-700 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Detail Skrining - {formatDate(selectedVisit.tanggalRegistrasi)}</h3>
                <p className="text-xs text-blue-200 mt-0.5">Poli: {selectedVisit.poliklinik?.namaPoli} | Dokter: {selectedVisit.dokterTujuan?.namaLengkap}</p>
              </div>
              <button 
                onClick={() => setSelectedVisit(null)}
                className="text-white hover:bg-blue-800 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
              {/* Vital Signs */}
              <div className="border border-gray-200 p-4 bg-gray-50">
                <h4 className="font-bold text-gray-900 mb-2 uppercase text-[11px] tracking-wide text-blue-700">Tanda Vital & Antropometri</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-gray-500">Tinggi / Berat:</span> <p className="font-bold">{selectedVisit.screening?.tinggiBadan || '-'} cm / {selectedVisit.screening?.beratBadan || '-'} kg</p></div>
                  <div><span className="text-gray-500">IMT / BSA:</span> <p className="font-bold">{selectedVisit.screening?.imt || '-'} / {selectedVisit.screening?.dataTambahan?.antropometri?.luasPermukaanTubuh || '-'} m²</p></div>
                  <div><span className="text-gray-500">Tensi:</span> <p className="font-bold">{selectedVisit.screening?.tekananDarahSistolik}/{selectedVisit.screening?.tekananDarahDiastolik} mmHg</p></div>
                  <div><span className="text-gray-500">Nadi / Napas:</span> <p className="font-bold">{selectedVisit.screening?.nadi || '-'} x/mnt / {selectedVisit.screening?.frekuensiNapas || '-'} x/mnt</p></div>
                  <div><span className="text-gray-500">Suhu / SpO2:</span> <p className="font-bold">{selectedVisit.screening?.suhuTubuh || '-'} °C / {selectedVisit.screening?.saturasiOksigen || '-'} %</p></div>
                  <div><span className="text-gray-500">Skala Nyeri:</span> <p className="font-bold">{selectedVisit.screening?.skalaNyeri ?? '-'}</p></div>
                </div>
              </div>

              {/* Keluhan & Skrining Special */}
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Keluhan Utama:</span>
                  <p className="p-3 bg-white border border-gray-200 font-medium">{selectedVisit.screening?.keluhanUtama || '-'}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Status Psikologis:</span>
                  <p className="p-2 bg-purple-50 border border-purple-200 text-purple-900 font-bold">{selectedVisit.screening?.dataTambahan?.jiwa?.statusPsikologis || 'Tenang / Normal'}</p>
                </div>
                {selectedVisit.screening?.headToToe && (
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Catatan Head to Toe Terdaftar:</span>
                    <div className="p-3 bg-gray-50 border border-gray-200 text-[11px] font-mono max-h-32 overflow-y-auto">
                      {JSON.stringify(selectedVisit.screening.headToToe, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 p-4 flex justify-end border-t border-gray-200">
              <button 
                onClick={() => setSelectedVisit(null)}
                className="px-5 py-2 bg-gray-700 text-white font-bold text-xs hover:bg-gray-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
