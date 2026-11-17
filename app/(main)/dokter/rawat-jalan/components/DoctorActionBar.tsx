import React from 'react';
import { FileText, Clock, CheckCircle2, Save, Sparkles, ArrowRight } from 'lucide-react';

interface DoctorActionBarProps {
  fillDummyData: () => void;
  handleTundaPemeriksaan: () => void;
  handleSaveSOAP: () => void;
  handleSelesaikan: () => void;
  isSaving: boolean;
  isMenungguLab?: boolean;
}

export default function DoctorActionBar({
  fillDummyData,
  handleTundaPemeriksaan,
  handleSaveSOAP,
  handleSelesaikan,
  isSaving,
  isMenungguLab = false,
}: DoctorActionBarProps) {
  return (
    <div className="shrink-0 bg-white border-t-2 border-slate-200 px-4 sm:px-6 py-3 shadow-lg z-30 flex flex-wrap justify-between items-center gap-3">
      {/* LEFT: TESTING & DRAFT ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={fillDummyData} 
          type="button" 
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all text-xs rounded-none shadow-sm flex items-center gap-1.5"
          title="Isi form otomatis untuk testing"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Isi Dummy Data</span>
        </button>

        <button 
          onClick={handleTundaPemeriksaan} 
          disabled={isSaving} 
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-xs rounded-none shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tunda Pemeriksaan</span>
        </button>

        <button 
          onClick={handleSaveSOAP} 
          disabled={isSaving} 
          className="px-3.5 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 font-bold transition-all text-xs rounded-none shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          title="Simpan Draf Pemeriksaan (Shortcut: Ctrl + S)"
        >
          <Save className="w-3.5 h-3.5 text-blue-600" />
          <span>Simpan Draf</span>
          <kbd className="hidden sm:inline-block text-[10px] bg-gray-100 border border-gray-300 px-1 py-0.2 rounded text-gray-500 font-mono ml-0.5">Ctrl+S</kbd>
        </button>
      </div>

      {/* RIGHT: PRIMARY COMPLETION ACTION */}
      <button 
        onClick={handleSelesaikan} 
        disabled={isSaving} 
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-none shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
        title="Simpan Pemeriksaan & Buka Alur Tindak Lanjut"
      >
        <CheckCircle2 className="w-4 h-4 text-white" />
        <span>Simpan & Tindak Lanjut (Discharge)</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
