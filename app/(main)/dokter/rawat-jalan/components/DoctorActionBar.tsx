import React from 'react';
import { FileText, Clock, CheckCircle2, Save, Sparkles } from 'lucide-react';

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
    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-6 py-3.5 border-t border-gray-200 shadow-2xl z-30 flex flex-wrap justify-between items-center gap-3">
      {/* LEFT: TESTING & DRAFT ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={fillDummyData} 
          type="button" 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all text-xs rounded-none shadow-sm flex items-center gap-1.5"
          title="Isi form otomatis untuk testing"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          Isi Dummy Data
        </button>

        <button 
          onClick={handleTundaPemeriksaan} 
          disabled={isSaving} 
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-xs rounded-none shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          Tunda Pemeriksaan
        </button>

        <button 
          onClick={handleSaveSOAP} 
          disabled={isSaving} 
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold transition-all text-xs rounded-none shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-gray-500" />
          Simpan Draf
        </button>
      </div>

      {/* RIGHT: PRIMARY COMPLETION ACTION */}
      <button 
        onClick={handleSelesaikan} 
        disabled={isSaving} 
        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-none shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        Selesaikan Pemeriksaan ➔
      </button>
    </div>
  );
}
