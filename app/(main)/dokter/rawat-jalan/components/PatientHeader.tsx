import { User, Clock, Heart, Activity, Thermometer, ShieldAlert, Sparkles, Columns, Users } from 'lucide-react';

interface PatientHeaderProps {
  selectedKunjungan: any;
  screeningData?: any;
  alergiList?: any[];
  getAge: (dob: string) => number;
  setIsScreeningModalOpen: (isOpen: boolean) => void;
  setIsRiwayatModalOpen?: (isOpen: boolean) => void;
  onOpenRiwayatTab?: () => void;
  showSideRmePanel?: boolean;
  onToggleSideRmePanel?: () => void;
  isQueueCollapsed?: boolean;
  onToggleQueue?: () => void;
  queueCount?: number;
}

export default function PatientHeader({
  selectedKunjungan,
  screeningData,
  alergiList = [],
  getAge,
  setIsScreeningModalOpen,
  setIsRiwayatModalOpen,
  onOpenRiwayatTab,
  showSideRmePanel = false,
  onToggleSideRmePanel,
  isQueueCollapsed = false,
  onToggleQueue,
  queueCount = 0,
}: PatientHeaderProps) {
  if (!selectedKunjungan) return null;

  const pasien = selectedKunjungan.pasien;
  const isFemale = pasien?.jenisKelamin?.toLowerCase().startsWith('p') || pasien?.jenisKelamin?.toLowerCase().startsWith('f');
  
  // Extract TTV Quick View
  const td = screeningData?.tekananDarahSistolik && screeningData?.tekananDarahDiastolik 
    ? `${screeningData.tekananDarahSistolik}/${screeningData.tekananDarahDiastolik}` 
    : null;
  const nadi = screeningData?.nadi;
  const suhu = screeningData?.suhuTubuh;

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* PASIEN INFO & BADGES */}
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-none flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm border ${
            isFemale 
              ? 'bg-pink-50 text-pink-700 border-pink-200' 
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {pasien?.namaLengkap?.charAt(0) || 'P'}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                {pasien?.namaLengkap}
              </h1>

              {/* Status Badge */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-none uppercase border ${
                selectedKunjungan.statusKunjungan === 'DIPERIKSA'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : selectedKunjungan.statusKunjungan === 'MENUNGGU_LAB'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : selectedKunjungan.statusKunjungan === 'MENUNGGU_RADIOLOGI'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {selectedKunjungan.statusKunjungan === 'DIPERIKSA' 
                  ? '• SEDANG DIPERIKSA' 
                  : selectedKunjungan.statusKunjungan === 'MENUNGGU_LAB'
                    ? '• MENUNGGU LAB'
                    : selectedKunjungan.statusKunjungan === 'MENUNGGU_RADIOLOGI'
                      ? '• MENUNGGU RADIOLOGI'
                      : '• MENUNGGU'}
              </span>

              {/* Alergi Alert */}
              {alergiList.length > 0 && (
                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  Alergi: {alergiList.map(a => a.alergiMaster?.nama_alergi || a.manifestasiNama).join(', ')}
                </span>
              )}
            </div>

            {/* Sub Detail Info */}
            <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2 font-medium">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-none border border-gray-200 text-gray-800 font-bold">
                RM: {pasien?.noRM}
              </span>
              <span>{getAge(pasien?.tanggalLahir)} Thn</span>
              <span className="text-gray-400">•</span>
              <span>{pasien?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-700 font-bold">{selectedKunjungan.poliklinik?.namaPoli || 'Poli Umum'}</span>
              {pasien?.noIHS && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-emerald-700 font-mono text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> IHS Terdaftar
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS & ANTREAN */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">

          {/* Quick Action Modal Buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle Panel Antrean Pasien */}
            {onToggleQueue && (
              <button 
                type="button"
                onClick={onToggleQueue}
                className={`px-3 py-1.5 rounded-none font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm border ${
                  !isQueueCollapsed 
                    ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title={!isQueueCollapsed ? "Sembunyikan Antrean (Perlebar Ruang Periksa)" : "Buka Panel Antrean Pasien"}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Antrean ({queueCount})</span>
              </button>
            )}

            <button 
              onClick={() => setIsScreeningModalOpen(true)}
              className="bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-none font-bold text-xs flex items-center transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Screening Triage
            </button>
            {/* Toggle Panel RME Berdampingan (Side-by-Side) */}
            {onToggleSideRmePanel && (
              <button 
                type="button"
                onClick={onToggleSideRmePanel}
                className={`px-3 py-1.5 rounded-none font-bold text-xs flex items-center transition-all shadow-sm border ${
                  showSideRmePanel 
                    ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                }`}
                title={showSideRmePanel ? "Sembunyikan Panel RME Bersisian" : "Buka Panel RME Berdampingan (Side-by-Side)"}
              >
                <Columns className="w-3.5 h-3.5 mr-1.5" />
                {showSideRmePanel ? 'Sembunyikan RME' : 'RME Berdampingan'}
              </button>
            )}

            <button 
              onClick={() => {
                if (onOpenRiwayatTab) {
                  onOpenRiwayatTab();
                } else if (setIsRiwayatModalOpen) {
                  setIsRiwayatModalOpen(true);
                }
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-none font-bold text-xs flex items-center transition-colors shadow-sm"
              title="Buka Tab Berkas Riwayat RME Pasien Penuh"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              Tab RME Penuh
            </button>
          </div>

          {/* Antrian Card */}
          <div className="bg-blue-600 text-white px-3 py-1 rounded-none text-center shadow-sm border border-blue-700 min-w-[70px]">
            <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">Antrean</span>
            <span className="text-base font-black font-mono leading-none">{selectedKunjungan.noAntrian}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
