'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useGisUIStore } from '../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';

// Panels
import LayerPanel from './panels/LayerPanel';
import FaskesPanel from './panels/FaskesPanel';
import DetailPanel from './panels/DetailPanel';
import BasemapPanel from './panels/BasemapPanel';
import StatistikPanel from './panels/StatistikPanel';
import TentangPanel from './panels/TentangPanel';

interface PanelOrchestratorProps {
  faskesList: FaskesItem[];
}

export default function PanelOrchestrator({ faskesList = [] }: PanelOrchestratorProps) {
  const { activePanels, closePanel, closePanelsToTheRight } = useGisUIStore();

  if (!activePanels || activePanels.length === 0) return null;

  const getPanelWidth = (type: string) => {
    if (type === 'detil-faskes') return 430;
    return 360;
  };

  const getPanelCategoryLabel = (type: string) => {
    switch (type) {
      case 'layers':
        return 'LAYER DATA';
      case 'katalog-faskes':
        return 'KATALOG FASKES';
      case 'detil-faskes':
        return 'DETAIL FASILITAS KESEHATAN';
      case 'basemap-gallery':
        return 'PETA DASAR';
      case 'statistik':
        return 'STATISTIK & KAPASITAS';
      case 'tentang':
        return 'INFORMASI SISTEM';
      default:
        return 'PANEL';
    }
  };

  const renderPanelContent = (type: string, data: any) => {
    switch (type) {
      case 'layers':
        return <LayerPanel />;
      case 'katalog-faskes':
        return <FaskesPanel faskesList={faskesList} />;
      case 'detil-faskes':
        return <DetailPanel data={data} />;
      case 'basemap-gallery':
        return <BasemapPanel />;
      case 'statistik':
        return <StatistikPanel faskesList={faskesList} />;
      case 'tentang':
        return <TentangPanel />;
      default:
        return <div className="p-4 text-xs text-slate-400">Modul belum tersedia.</div>;
    }
  };

  return (
    <div className="absolute top-16 bottom-0 left-16 z-30 pointer-events-auto flex items-start">
      {activePanels.map((panel, index) => {
        const isFloating = panel.type === 'detil-faskes';
        const currentWidth = getPanelWidth(panel.type);

        // Hitung offset docked
        let dockedOffset = 0;
        for (let i = 0; i < index; i++) {
          const p = activePanels[i];
          if (p.type !== 'detil-faskes') {
            dockedOffset += getPanelWidth(p.type);
          }
        }

        // Hitung posisi floating jika ada panel docked
        let totalDockedWidth = 0;
        activePanels.forEach((p) => {
          if (p.type !== 'detil-faskes') {
            totalDockedWidth += getPanelWidth(p.type);
          }
        });

        const floatingLeft = totalDockedWidth + 16;

        return (
          <div
            key={panel.id}
            className={`absolute pointer-events-auto transition-all duration-300 ease-in-out bg-white overflow-hidden flex flex-col ${
              isFloating
                ? 'shadow-2xl border border-slate-200 rounded-none'
                : 'border-r border-slate-200 shadow-none rounded-none'
            }`}
            style={
              isFloating
                ? {
                    left: `${floatingLeft}px`,
                    top: '16px',
                    bottom: '16px',
                    width: `${currentWidth}px`,
                    maxWidth: 'calc(100vw - 120px)',
                    zIndex: 50,
                  }
                : {
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${currentWidth}px`,
                    transform: `translateX(${dockedOffset}px)`,
                    zIndex: 40 - index,
                  }
            }
          >
            {/* Header Panel */}
            <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 select-none text-left">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-700 leading-none uppercase tracking-wider">
                  {getPanelCategoryLabel(panel.type)}
                </span>
                <h3 className="text-xs font-bold text-slate-800 truncate max-w-[280px] tracking-tight mt-1 leading-none">
                  {panel.data?.nama || panel.title}
                </h3>
              </div>

              <button
                onClick={() => closePanel(panel.id)}
                className="p-1.5 rounded-none bg-transparent hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"
                title="Tutup Panel"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body Panel */}
            <div
              className={`flex-1 flex flex-col min-h-0 ${isFloating ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}
              onClick={() => !isFloating && closePanelsToTheRight(index)}
            >
              {renderPanelContent(panel.type, panel.data)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
