'use client';

import React from 'react';
import { Layers, Building2, Map as MapIcon, BarChart3, Info } from 'lucide-react';
import { useGisUIStore } from '../store/useGisUIStore';

export default function GisSidebar() {
  const { openPanel, activePanels, closePanelsToTheRight, closePanel } = useGisUIStore();

  const navigationItems = [
    {
      type: 'layers' as const,
      label: 'Layers',
      icon: Layers,
      title: 'Konfigurasi Layer & Sebaran',
    },
    {
      type: 'katalog-faskes' as const,
      label: 'Faskes',
      icon: Building2,
      title: 'Katalog Fasilitas Kesehatan',
    },
    {
      type: 'basemap-gallery' as const,
      label: 'Basemap',
      icon: MapIcon,
      title: 'Katalog Peta Dasar',
    },
    {
      type: 'statistik' as const,
      label: 'Statistik',
      icon: BarChart3,
      title: 'Statistik & Kapasitas Faskes',
    },
  ];

  const isPanelActive = (type: string) => {
    return activePanels.some((p) => p.type === type);
  };

  const handleNavClick = (item: (typeof navigationItems)[number]) => {
    const active = activePanels.find((p) => p.type === item.type);
    if (active) {
      closePanel(active.id);
    } else {
      closePanelsToTheRight(-1);
      openPanel(item.type, item.title);
    }
  };

  return (
    <aside className="absolute top-16 bottom-0 left-0 w-16 flex flex-col items-center bg-white border-r border-slate-200 z-40 pointer-events-auto select-none">
      {/* Top Navigation Items */}
      <div className="flex-1 flex flex-col items-center w-full">
        {navigationItems.map((item, index) => {
          const isActive = isPanelActive(item.type);
          const Icon = item.icon;

          return (
            <div key={index} className="relative group w-full flex justify-center">
              <button
                onClick={() => handleNavClick(item)}
                className={`w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none cursor-pointer
                  ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-l-[3px] border-emerald-700 font-bold'
                      : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-800 border-l-[3px] border-transparent'
                  }`}
                title={item.title}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[8px] font-bold uppercase tracking-widest ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  {item.label}
                </span>
              </button>

              {/* Tooltip */}
              <div className="absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.title}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Info / Tentang */}
      <div className="flex flex-col items-center w-full mt-auto">
        <div className="w-8 h-px bg-slate-200 mb-1" />

        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => {
              const active = activePanels.find((p) => p.type === 'tentang');
              if (active) closePanel(active.id);
              else {
                closePanelsToTheRight(-1);
                openPanel('tentang', 'Tentang SIKDA GIS');
              }
            }}
            className={`w-full h-16 flex items-center justify-center transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] cursor-pointer
              ${
                isPanelActive('tentang')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-700'
                  : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-800 border-transparent'
              }`}
            title="Tentang SIKDA GIS"
          >
            <Info size={20} strokeWidth={isPanelActive('tentang') ? 2.5 : 2} />
          </button>

          <div className="absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Tentang Sistem
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>
      </div>
    </aside>
  );
}
