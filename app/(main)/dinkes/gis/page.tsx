'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { dinkesService, FaskesItem } from '@/services/dinkes.service';

// Komponen GIS SIKDA
import GisNavbar from './components/GisNavbar';
import GisSidebar from './components/GisSidebar';
import PanelOrchestrator from './components/PanelOrchestrator';
import MapHUD from './components/MapHUD';

// Dynamic import MapView (Wajib ssr: false untuk Leaflet di Next.js)
const DynamicMapView = dynamic(() => import('./components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-white select-none">
      <Loader2 className="animate-spin mb-3 text-emerald-500" size={42} />
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
        Menginisialisasi Kanvas Geospasial SIKDA...
      </span>
    </div>
  ),
});

export default function DinkesGisPage() {
  const [faskesList, setFaskesList] = useState<FaskesItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGisData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dinkesService.getFaskesList();
      setFaskesList(data || []);
    } catch (err) {
      console.error('Gagal mengambil data spasial faskes SIKDA:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGisData();
  }, [fetchGisData]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900 select-none">
      {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA LEAFLET FULL-SCREEN)
      ====================================================================== */}
      <DynamicMapView faskesList={faskesList} />

      {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS FRAMELESS)
      ====================================================================== */}
      <GisNavbar onRefresh={fetchGisData} loading={loading} totalFaskes={faskesList.length} />

      {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI 64px)
      ====================================================================== */}
      <GisSidebar />

      {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR)
      ====================================================================== */}
      <PanelOrchestrator faskesList={faskesList} />

      {/* =====================================================================
          LAYER 4: MAP HUD & CONTROLS (KANAN BAWAH)
      ====================================================================== */}
      <MapHUD />

      {/* =====================================================================
          LOADING OVERLAY
      ====================================================================== */}
      {loading && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none">
          <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
          <p className="text-xs font-bold uppercase tracking-[0.3em]">
            Memuat Data Spasial Fasilitas Kesehatan...
          </p>
        </div>
      )}
    </main>
  );
}
