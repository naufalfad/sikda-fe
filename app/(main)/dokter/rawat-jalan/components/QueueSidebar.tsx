import React, { Dispatch, SetStateAction, useState } from 'react';
import { Users, RefreshCw, Loader2, CheckCircle2, Search, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface QueueSidebarProps {
  sidebarWidth: number;
  setSidebarWidth: Dispatch<SetStateAction<number>>;
  antrian: any[];
  fetchAntrian: () => void;
  isLoadingAntrian: boolean;
  selectedKunjungan: any;
  pilihPasien: (k: any) => void;
  getAge: (dob: string) => number;
  onIntipRme?: (noRM: string, namaPasien: string, kunjungan?: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function QueueSidebar({
  sidebarWidth,
  setSidebarWidth,
  antrian,
  fetchAntrian,
  isLoadingAntrian,
  selectedKunjungan,
  pilihPasien,
  getAge,
  onIntipRme,
  isCollapsed = false,
  onToggleCollapse
}: QueueSidebarProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter Antrean
  const filteredAntrian = antrian.filter((item) => {
    // Filter Search
    const matchesSearch = 
      item.pasien?.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pasien?.noRM?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noAntrian?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter Status Tab
    if (filterStatus === 'MENUNGGU') return item.statusKunjungan === 'MENUNGGU_DOKTER' || item.statusKunjungan === 'ANTRI_POLI';
    if (filterStatus === 'DIPERIKSA') return item.statusKunjungan === 'DIPERIKSA';
    if (filterStatus === 'PENUNJANG') return item.statusKunjungan === 'MENUNGGU_LAB' || item.statusKunjungan === 'MENUNGGU_RADIOLOGI';

    return true;
  });

  if (isCollapsed) {
    return (
      <div className="bg-white border-r border-slate-200 flex flex-col items-center py-3 h-full shadow-sm z-10 w-12 flex-shrink-0 transition-all select-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-none bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center justify-center border border-blue-200 transition-colors shadow-sm mb-3"
          title="Tampilkan Panel Antrean Pasien"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="w-6 h-6 rounded-none bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-sm">
            {antrian.length}
          </div>
          <span className="text-[9px] font-bold text-slate-400">Total</span>
        </div>

        <div className="flex-1 flex items-center justify-center my-auto">
          <span 
            onClick={onToggleCollapse}
            className="cursor-pointer rotate-90 whitespace-nowrap text-[11px] font-black tracking-widest uppercase text-slate-500 hover:text-blue-700 transition-colors"
          >
            Antrean Pasien
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchAntrian()}
          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors rounded-none mt-auto"
          title="Muat Ulang Antrean"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAntrian ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 relative flex-shrink-0 max-w-sm transition-all"
      style={{ width: sidebarWidth }}
    >
      {/* RESIZER HANDLE */}
      <div 
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-300 active:bg-blue-500 z-50 transition-colors"
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          
          const doDrag = (dragEvent: MouseEvent) => {
            let newWidth = startWidth + (dragEvent.clientX - startX);
            if (newWidth > 384) newWidth = 384; 
            if (newWidth < 200) newWidth = 200; 
            setSidebarWidth(newWidth);
          };
          
          const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
          };
          
          document.addEventListener('mousemove', doDrag);
          document.addEventListener('mouseup', stopDrag);
        }}
      />

      {/* HEADER SIDEBAR */}
      <div className="p-4 border-b border-gray-200 bg-blue-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-none shadow-sm transition-colors"
                title="Sembunyikan Antrean (Perlebar Ruang Periksa)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <h2 className="text-xs sm:text-sm font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5 truncate">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              Antrian Rawat Jalan
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-none font-bold text-[10px]">
              Total: {antrian.length}
            </span>
            <button 
              onClick={() => fetchAntrian()} 
              className="p-1 hover:bg-blue-100 rounded-none transition-colors text-blue-600"
              title="Refresh Antrean"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAntrian ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama / No RM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-none pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
          />
        </div>

        {/* SEGMENTED STATUS TABS */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-none border border-gray-200 text-[10px] font-bold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`py-1 rounded-none text-center transition-all ${filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('MENUNGGU')}
            className={`py-1 rounded-none text-center transition-all ${filterStatus === 'MENUNGGU' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Antri
          </button>
          <button
            onClick={() => setFilterStatus('DIPERIKSA')}
            className={`py-1 rounded-none text-center transition-all ${filterStatus === 'DIPERIKSA' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Poli
          </button>
          <button
            onClick={() => setFilterStatus('PENUNJANG')}
            className={`py-1 rounded-none text-center transition-all ${filterStatus === 'PENUNJANG' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Lab/Rad
          </button>
        </div>
      </div>
      
      {/* QUEUE ITEM LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoadingAntrian && antrian.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
            <p className="text-xs font-medium">Memuat antrian...</p>
          </div>
        ) : filteredAntrian.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
            <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
            <p className="text-xs font-medium">Belum ada pasien sesuai filter</p>
          </div>
        ) : (
          filteredAntrian.map((k) => {
            const isSelected = selectedKunjungan?.id === k.id;
            const triage = k.screening?.kategoriTriage?.toLowerCase();

            return (
              <div 
                key={k.id}
                onClick={() => pilihPasien(k)}
                className={`p-3 border-l-4 cursor-pointer transition-all rounded-none ${
                  isSelected 
                    ? 'border-l-blue-600 bg-blue-50/80 shadow-sm border-y border-r border-blue-200' 
                    : triage === 'merah'
                      ? 'border-l-red-600 bg-red-50/50 hover:bg-red-50 border-y border-r border-red-200'
                      : triage === 'kuning'
                        ? 'border-l-amber-500 bg-amber-50/50 hover:bg-amber-50 border-y border-r border-amber-200'
                        : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap justify-between items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500">
                    {k.jamRegistrasi} • {k.pasien.noRM}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Action button: Intip RME */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onIntipRme) {
                          onIntipRme(k.pasien.noRM, k.pasien.namaLengkap, k);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-sm transition-all"
                      title={`Intip Rekam Medis (RME) Lalu: ${k.pasien.namaLengkap}`}
                    >
                      <FileText className="w-3 h-3 text-indigo-600" />
                      <span>RME Lalu</span>
                    </button>

                    {/* Status Badge */}
                    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded-none shadow-sm border ${
                      k.statusKunjungan === 'DIPERIKSA' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : k.statusKunjungan === 'MENUNGGU_LAB'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : k.statusKunjungan === 'MENUNGGU_RADIOLOGI'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : k.statusKunjungan === 'MENUNGGU_DOKTER'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {k.statusKunjungan === 'DIPERIKSA' 
                        ? 'DIPERIKSA' 
                        : k.statusKunjungan === 'MENUNGGU_LAB'
                          ? 'LAB'
                          : k.statusKunjungan === 'MENUNGGU_RADIOLOGI'
                            ? 'RADIOLOGI'
                            : k.statusKunjungan === 'MENUNGGU_DOKTER'
                              ? 'SIAP DOKTER'
                              : 'ANTRI'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  {/* Circle Antrean */}
                  <div className={`w-8 h-8 rounded-none font-bold flex flex-shrink-0 items-center justify-center text-xs ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {k.noAntrian?.split('-').pop()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-bold text-xs text-gray-900 leading-tight truncate">
                        {k.pasien.namaLengkap}
                      </h3>
                      {triage === 'merah' && (
                        <span className="animate-pulse bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-none shadow-sm">GAWAT</span>
                      )}
                      {triage === 'kuning' && (
                        <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-none shadow-sm">URGENT</span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-gray-600 flex items-center gap-1.5 flex-wrap">
                      <span>{getAge(k.pasien.tanggalLahir)} Thn</span>
                      <span>•</span>
                      <span>{k.pasien.jenisKelamin}</span>
                      {k.poliklinik?.namaPoli && (
                        <>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold truncate">{k.poliklinik.namaPoli}</span>
                        </>
                      )}
                    </div>

                    {k.screening?.keluhanUtama && (
                      <div className="text-[10px] text-slate-500 italic truncate mt-1 bg-white/70 px-1.5 py-0.5 border border-slate-200/60">
                        &quot;{k.screening.keluhanUtama}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
