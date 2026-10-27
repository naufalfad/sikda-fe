import React from 'react';
import { Printer, Eye, Check, ChevronUp, ChevronDown, Building2 } from 'lucide-react';

interface TimelineViewProps {
  visits: any[];
  pasienData: any;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  setSelectedVisit: (visit: any) => void;
  setViewMode: (mode: 'TIMELINE' | 'DETAIL') => void;
  getDay: (date: string) => string;
  getMonthAbbr: (date: string) => string;
  getYear: (date: string) => string;
}

export function TimelineView({
  visits,
  pasienData,
  expandedId,
  setExpandedId,
  setSelectedVisit,
  setViewMode,
  getDay,
  getMonthAbbr,
  getYear
}: TimelineViewProps) {
  return (
    <div className="max-w-5xl mx-auto pt-6">
      <div className="relative border-l-[3px] border-slate-300 ml-4 md:ml-10 py-4">
        
        {visits.length === 0 ? (
          <div className="ml-10 p-8 text-center text-slate-500 bg-white border border-slate-200 shadow-sm">
            <p className="font-medium">Belum ada riwayat kunjungan yang selesai.</p>
          </div>
        ) : (
          visits.map((item: any) => {
            const isDone = item.statusKunjungan === 'SELESAI' || item.statusKunjungan === 'PULANG';
            const isExpanded = expandedId === item.id;
            
            const diagnosisUtama = item.diagnosis?.find((d: any) => d.jenisDiagnosis === 'Utama')?.diagnosisKlinis 
                                || item.diagnosis?.[0]?.diagnosisKlinis 
                                || 'Belum ada diagnosa tercatat.';
                                
            const keluhanUtama = item.rekamMedis?.keluhanUtama || item.screening?.keluhanUtama || 'Tidak ada keluhan tercatat.';
            
            return (
              <div key={item.id} className="relative mb-8 last:mb-0">
                {/* Timeline Dot */}
                <div className={`absolute -left-[11px] top-6 w-5 h-5 rounded-full border-4 border-[#F8FAFC] shadow-sm flex items-center justify-center
                  ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                ></div>

                {/* Card Content */}
                <div className="ml-8 md:ml-10 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    
                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                      <span className="text-3xl font-light text-slate-800 leading-none">{getDay(item.tanggalRegistrasi)}</span>
                      <span className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-widest">{getMonthAbbr(item.tanggalRegistrasi)} {getYear(item.tanggalRegistrasi)}</span>
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">
                          {item.poliklinik?.namaPoli || 'Poli'} dengan <span className="text-blue-600 font-semibold">{item.dokterTujuan?.namaLengkap || 'Dokter'}</span>
                        </p>
                        {item.faskes?.namaFaskes && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 border border-sky-200">
                            <Building2 className="w-3 h-3 text-sky-600" />
                            {item.faskes.namaFaskes}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        Penjamin: <span className="font-semibold text-slate-700">{pasienData?.jenisPenjamin || 'Umum'}</span>
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2 uppercase tracking-wider font-semibold">
                        {item.jamRegistrasi} WIB — {isDone ? 'Pemeriksaan Selesai' : 'Sedang Berlangsung / Farmasi'}
                      </p>
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center gap-3 self-end md:self-center mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-700 transition-colors" title="Cetak Ringkasan">
                          <Printer className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedVisit(item);
                            setViewMode('DETAIL');
                          }} 
                          className="text-slate-400 hover:text-blue-600 transition-colors" 
                          title="Buka RME Lengkap"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <div className={`px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 text-white
                          ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                          {isDone ? 'DONE' : 'ENGAGED'} {isDone && <Check className="w-4 h-4"/>}
                        </div>
                        
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 transition-colors border border-slate-200"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Expanded Content (Diagnosis Summary) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-5 bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Diagnosis Utama</p>
                           <p className="text-sm font-bold text-slate-900 bg-white p-3 border border-slate-200">
                              {diagnosisUtama}
                           </p>
                         </div>
                         <div>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Keluhan Utama (Triage)</p>
                           <p className="text-sm font-medium text-slate-700 bg-white p-3 border border-slate-200">
                              {keluhanUtama}
                           </p>
                         </div>
                      </div>
                      <div className="mt-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedVisit(item);
                            setViewMode('DETAIL');
                          }}
                          className="inline-block px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors"
                        >
                          Buka RME Lengkap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
