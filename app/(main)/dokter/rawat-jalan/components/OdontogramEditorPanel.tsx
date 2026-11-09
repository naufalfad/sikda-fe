import React, { useRef, useEffect } from 'react';
import { Info, RefreshCw, X, Check, Search } from 'lucide-react';
import { ToothCondition, ToothSurface, CONDITION_OPTIONS, getSurfaceColor } from './odontogram.types';

interface OdontogramEditorPanelProps {
  selectedTooth: number | null;
  setSelectedTooth: (num: number | null) => void;
  selectedSurface: ToothSurface | 'all';
  setSelectedSurface: (surf: ToothSurface | 'all') => void;
  teethMap: Record<number, ToothCondition>;
  handleMarkMissingTooth: () => void;
  handleResetTooth: (num: number) => void;
  handleClearSurface: (surface: ToothSurface) => void;
  handleApplySurfaceCondition: (code: string) => void;
}

export default function OdontogramEditorPanel({
  selectedTooth,
  setSelectedTooth,
  selectedSurface,
  setSelectedSurface,
  teethMap,
  handleMarkMissingTooth,
  handleResetTooth,
  handleClearSurface,
  handleApplySurfaceCondition,
}: OdontogramEditorPanelProps) {
  const editorPanelRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll ke panel editor saat gigi dipilih
  useEffect(() => {
    if (selectedTooth && editorPanelRef.current) {
      editorPanelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedTooth]);

  if (!selectedTooth) return null;

  const tooth = teethMap[selectedTooth];
  const isMissing = tooth?.condition === 'mis';

  const bukal = getSurfaceColor(teethMap, selectedTooth, 'bukal');
  const distal = getSurfaceColor(teethMap, selectedTooth, 'distal');
  const lingual = getSurfaceColor(teethMap, selectedTooth, 'lingual');
  const mesial = getSurfaceColor(teethMap, selectedTooth, 'mesial');
  const oklusal = getSurfaceColor(teethMap, selectedTooth, 'oklusal');

  const isBottomRow = Number(selectedTooth) >= 30 || (Number(selectedTooth) >= 71 && Number(selectedTooth) <= 85);

  return (
    <div ref={editorPanelRef} className="p-5 bg-slate-900 text-white rounded-none border-2 border-blue-500 animate-in fade-in duration-200 shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-yellow-400" />
          <h4 className="font-extrabold text-base">
            Pengisian Bidang Gigi <span className="text-yellow-400 font-mono text-xl">#{selectedTooth}</span>
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMarkMissingTooth}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-red-400 border border-red-500 font-extrabold text-xs rounded-none transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Tandai Gigi Dicabut / Hilang (mis)
          </button>
          <button
            type="button"
            onClick={() => handleResetTooth(selectedTooth)}
            className="text-xs text-slate-300 hover:text-white underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Gigi Ini
          </button>
          <button
            type="button"
            onClick={() => setSelectedTooth(null)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-none transition-colors ml-2"
            title="Tutup Panel Pengisian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN INPUT CONTAINER WITH SIDE-BY-SIDE LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: LIVE MINIATUR ZOOM PREVIEW (2X SIZE) */}
        <div className="lg:col-span-4 bg-slate-950 p-4 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Live Preview Gigi #{selectedTooth}
          </span>
          
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-none transform scale-125 my-3 shadow-inner">
            <div className="flex flex-col items-center select-none">
              {!isBottomRow && (
                <span className="text-[11px] font-mono font-bold mb-1 text-blue-400">
                  {selectedTooth}
                </span>
              )}
              <svg width="44" height="44" viewBox="0 0 100 100" className="drop-shadow-md">
                <rect x="2" y="2" width="96" height="96" fill="white" stroke="#000000" strokeWidth="4" />
                <polygon points="2,2 98,2 72,28 28,28" fill={bukal.fill} stroke={bukal.stroke} strokeWidth="2.5" />
                <polygon points="98,2 98,98 72,72 72,28" fill={distal.fill} stroke={distal.stroke} strokeWidth="2.5" />
                <polygon points="2,98 98,98 72,72 28,72" fill={lingual.fill} stroke={lingual.stroke} strokeWidth="2.5" />
                <polygon points="2,2 2,98 28,72 28,28" fill={mesial.fill} stroke={mesial.stroke} strokeWidth="2.5" />
                <polygon points="28,28 72,28 72,72 28,72" fill={oklusal.fill} stroke={oklusal.stroke} strokeWidth="2.5" />
                {isMissing && (
                  <g>
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#dc2626" strokeWidth="12" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#dc2626" strokeWidth="12" />
                  </g>
                )}
              </svg>
              {isBottomRow && (
                <span className="text-[11px] font-mono font-bold mt-1 text-blue-400">
                  {selectedTooth}
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight mt-2">
            Grafik di atas menampilkan kondisi *real-time* bidang gigi <strong className="text-white">#{selectedTooth}</strong> saat Anda memilih warna di samping.
          </p>
        </div>

        {/* RIGHT: CONTROLS & CONDITION CHOICES */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. PILIHAN BIDANG GIGI (SURFACE SELECTOR) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Pilih Permukaan / Bidang Gigi yang Ingin Diwarnai:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { code: 'oklusal', name: 'Tengah (Oklusal/Insisal)' },
                { code: 'bukal', name: 'Atas (Bukal/Labial)' },
                { code: 'lingual', name: 'Bawah (Lingual/Palatal)' },
                { code: 'mesial', name: 'Kiri (Mesial)' },
                { code: 'distal', name: 'Kanan (Distal)' },
                { code: 'all', name: 'Seluruh Bidang (1 Gigi Full)' },
              ].map((surf) => {
                const isCurrentSurf = selectedSurface === surf.code;
                const hasColor = surf.code !== 'all' && teethMap[selectedTooth]?.surfaces?.[surf.code as ToothSurface];

                return (
                  <button
                    key={surf.code}
                    type="button"
                    onClick={() => setSelectedSurface(surf.code as any)}
                    className={`px-3 py-2 text-xs font-bold border text-left flex items-center justify-between transition-all ${
                      isCurrentSurf
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md ring-2 ring-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span>{surf.name}</span>
                    {hasColor && <Check className="w-3.5 h-3.5 text-yellow-400 font-extrabold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. PILIHAN KONDISI / WARNA UNTUK BIDANG TERPILIH */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Pilih Kondisi Klinis untuk Bidang:{' '}
                <span className="text-yellow-400 font-extrabold uppercase">{selectedSurface}</span>
              </label>

              {selectedSurface !== 'all' && teethMap[selectedTooth]?.surfaces?.[selectedSurface as ToothSurface] && (
                <button
                  type="button"
                  onClick={() => handleClearSurface(selectedSurface as ToothSurface)}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Hapus Warna Bidang Ini
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleApplySurfaceCondition(opt.code)}
                  className={`px-3 py-2 text-xs font-bold text-left border rounded-none transition-all ${opt.color} hover:brightness-110`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
