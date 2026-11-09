'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Building2, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';
import { useGisUIStore } from '../store/useGisUIStore';

interface GisNavbarProps {
  onRefresh: () => void;
  loading: boolean;
  totalFaskes: number;
}

export default function GisNavbar({ onRefresh, loading, totalFaskes }: GisNavbarProps) {
  const router = useRouter();
  const { clearPanels, resetMapContext } = useGisUIStore();

  const handleBackClick = () => {
    router.push('/dinkes');
  };

  const handleLogoClick = () => {
    clearPanels();
    resetMapContext();
  };

  return (
    <nav className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 z-50 pointer-events-auto select-none shadow-sm">
      {/* Left: Back Button & SIKDA GIS Branding */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBackClick}
          className="group flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-all rounded-none outline-none cursor-pointer"
          title="Kembali ke Dashboard Eksekutif Dinkes"
        >
          <div className="p-1.5 group-hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">
            Dashboard Dinkes
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 active:scale-95 transition-transform group rounded-none outline-none text-left cursor-pointer"
        >
          <div className="w-9 h-9 bg-emerald-700 flex items-center justify-center text-white rounded-none shadow-sm group-hover:bg-emerald-800 transition-colors">
            <Building2 size={19} />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-lg tracking-tight text-slate-800">
                SIKDA <span className="text-emerald-700">GIS</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                KAB. BOGOR
              </span>
            </div>
            <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5">
              Command Center Sebaran Faskes & Layanan Kesehatan
            </span>
          </div>
        </button>
      </div>

      {/* Right: Telemetri & Aksi */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Total Faskes Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
          <Activity size={14} className="text-emerald-600 animate-pulse" />
          <span>{totalFaskes} Titik Fasilitas Terpantau</span>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-all active:scale-95 rounded-none outline-none cursor-pointer border border-slate-200"
          title="Sinkronisasi Data Spasial Faskes"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">
            Sync Data
          </span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-all active:scale-95 rounded-none outline-none cursor-pointer border border-slate-200"
          title="Reset Tampilan Peta ke Titik Awal"
        >
          <Layers size={14} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">
            Reset Peta
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile Badge */}
        <div className="flex items-center gap-2.5 pl-2 py-1 cursor-default">
          <div className="w-8 h-8 bg-emerald-700 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
            <ShieldCheck size={16} />
          </div>
          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
              Dinas Kesehatan
            </span>
            <span className="text-[8px] text-emerald-700 font-bold uppercase tracking-widest">
              Administrator Kab. Bogor
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
