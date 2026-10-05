"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, Clock, Calendar, Activity, FileText, Pill, AlertCircle, Syringe,
  Stethoscope, Loader2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { rawatJalanService } from '@/services/rawatJalan.service';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface RiwayatRMEModalProps {
  isOpen: boolean;
  onClose: () => void;
  noRM: string;
  namaPasien?: string;
}

function KunjunganCard({ kunjungan }: { kunjungan: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      {/* Timeline Marker */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mt-4">
        <Calendar className="w-4 h-4" />
      </div>

      {/* Card Content */}
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
        
        {/* Card Header (Clickable) */}
        <div 
          className="p-4 bg-white flex justify-between items-start cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">
              {format(new Date(kunjungan.tanggalRegistrasi || kunjungan.createdAt || new Date()), 'dd MMMM yyyy', { locale: id })}
              {kunjungan.jamRegistrasi ? `, ${kunjungan.jamRegistrasi}` : ', 00:00'}
            </div>
            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-slate-400" />
              {kunjungan.poliTujuan || kunjungan.poliklinik?.namaPoli || 'Poliklinik'}
            </h4>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Pemeriksa: <span className="font-bold text-slate-700">{kunjungan.dokterTujuan?.namaLengkap || 'Belum Diatur'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
              Selesai
            </span>
            <div className="text-slate-400">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Expandable Content (RME, Diagnosa, Tindakan, Resep) */}
        {isExpanded && (
          <div className="p-4 border-t border-slate-200 bg-slate-100 animate-in slide-in-from-top-2 duration-200">
            
            {/* SOAP Details (Grid 2 Columns) */}
            {kunjungan.rekamMedis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-6">
                <div>
                  <strong className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-1 text-blue-600">S (Subjektif)</strong>
                  <p className="bg-white p-2 border border-slate-200 min-h-[60px] shadow-sm">{kunjungan.rekamMedis.keluhanUtama || '-'}</p>
                </div>
                <div>
                  <strong className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-1 text-emerald-600">O (Objektif)</strong>
                  <p className="bg-white p-2 border border-slate-200 min-h-[60px] shadow-sm whitespace-pre-wrap">{kunjungan.rekamMedis.pemeriksaanFisik || '-'}</p>
                </div>
                <div>
                  <strong className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-1 text-orange-600">A (Asesmen)</strong>
                  <p className="bg-white p-2 border border-slate-200 min-h-[60px] shadow-sm whitespace-pre-wrap">{kunjungan.rekamMedis.diagnosisKlinis || '-'}</p>
                </div>
                <div>
                  <strong className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-1 text-purple-600">P (Plan)</strong>
                  <p className="bg-white p-2 border border-slate-200 min-h-[60px] shadow-sm whitespace-pre-wrap">{kunjungan.rekamMedis.rencanaTerapi || '-'}</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic mb-6">Catatan SOAP tidak ditemukan.</div>
            )}

            {/* Diagnosa, Tindakan, Obat (Grid 3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
              
              {/* Diagnosa */}
              <div>
                <strong className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" /> Diagnosa
                </strong>
                {kunjungan.diagnosis && kunjungan.diagnosis.length > 0 ? (
                  <ul className="space-y-1">
                    {kunjungan.diagnosis.map((d: any) => (
                      <li key={d.id} className="text-xs flex flex-col bg-white p-2 border border-slate-200 shadow-sm">
                        <span className="font-mono font-bold text-rose-600">{d.icd10?.kode_icd10}</span>
                        <span className="text-slate-700 leading-tight mt-0.5">{d.icd10?.nama_diagnosis}</span>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-xs text-slate-400 italic">Tidak ada diagnosa.</span>}
              </div>

              {/* Tindakan */}
              <div>
                <strong className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-indigo-500" /> Tindakan
                </strong>
                {kunjungan.tindakans && kunjungan.tindakans.length > 0 ? (
                  <ul className="space-y-1">
                    {kunjungan.tindakans.map((t: any) => (
                      <li key={t.id} className="text-xs flex flex-col bg-white p-2 border border-slate-200 shadow-sm">
                        <span className="font-mono font-bold text-indigo-600">{t.icd9?.kode_icd9}</span>
                        <span className="text-slate-700 leading-tight mt-0.5">{t.icd9?.nama_prosedur}</span>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-xs text-slate-400 italic">Tidak ada tindakan.</span>}
              </div>

              {/* Obat/Resep */}
              <div>
                <strong className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-500" /> Obat
                </strong>
                {kunjungan.resep && kunjungan.resep.length > 0 ? (
                  <ul className="space-y-1">
                    {kunjungan.resep.flatMap((r: any) => r.details).map((d: any, i: number) => (
                      <li key={i} className="text-xs bg-white p-2 border border-slate-200 shadow-sm flex flex-col">
                        <span className="font-bold text-slate-700">{d.obat?.namaObat}</span>
                        <span className="font-mono text-slate-500 mt-0.5">{d.jumlah} {d.obat?.satuan} - {d.aturanPakai}</span>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-xs text-slate-400 italic">Tidak ada obat.</span>}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RiwayatRMEModal({ isOpen, onClose, noRM, namaPasien }: RiwayatRMEModalProps) {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!noRM) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await rawatJalanService.getRiwayatPasienByRM(noRM);
      if (res.success) {
        setHistoryData(res.data?.kunjungans || []);
      } else {
        setError(res.message || 'Gagal mengambil riwayat medis.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat riwayat medis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && noRM) {
      fetchHistory();
    } else {
      setHistoryData([]);
      setError('');
    }
  }, [isOpen, noRM]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-5xl rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-indigo-700 text-white p-6 flex justify-between items-center border-b-4 border-indigo-500 shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-300" />
              Riwayat Rekam Medis (RME)
            </h3>
            <p className="text-indigo-200 text-sm font-mono mt-1 font-bold flex items-center gap-2 flex-wrap">
              {namaPasien && (
                <span className="bg-indigo-800 text-white px-2 py-0.5 font-sans font-extrabold text-xs">
                  {namaPasien}
                </span>
              )}
              <span>No. RM: <strong className="text-white">{noRM}</strong></span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-indigo-800 hover:bg-indigo-900 flex items-center justify-center rounded-none transition-colors shadow-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="font-bold tracking-widest uppercase text-sm">Mengambil Data Historis...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="font-bold text-slate-700 text-lg mb-2">Terjadi Kesalahan</p>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={fetchHistory} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-none font-bold text-sm uppercase tracking-wider transition-colors shadow-sm">
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <FileText className="w-16 h-16 text-slate-200 mb-4" />
              <p className="font-bold text-slate-700 text-lg uppercase tracking-widest">Belum Ada Riwayat Kunjungan</p>
              <p className="text-sm text-slate-500 mt-2">Ini adalah kunjungan pertama pasien atau data sebelumnya belum direkam secara elektronik.</p>
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              
              {historyData.map((kunjungan, index) => (
                <KunjunganCard key={kunjungan.id} kunjungan={kunjungan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
