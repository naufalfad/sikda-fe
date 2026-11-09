'use client';

import React from 'react';
import { Map as MapIcon, Sun, Moon, Layers } from 'lucide-react';
import { useGisUIStore } from '../../store/useGisUIStore';

export default function BasemapPanel() {
  const { activeBaseMap, setActiveBaseMap } = useGisUIStore();

  const baseMaps = [
    {
      id: 'dark' as const,
      label: 'Dark Canvas',
      icon: Moon,
      desc: 'Kanvas Gelap (Mode Kontras Tinggi untuk Sebaran Medis)',
    },
    {
      id: 'street' as const,
      label: 'Google Roadmap',
      icon: MapIcon,
      desc: 'Navigasi rute jalan, permukiman, dan fasilitas publik',
    },
    {
      id: 'satellite' as const,
      label: 'Google Satellite',
      icon: Sun,
      desc: 'Citra foto udara satelit resolusi tinggi',
    },
    {
      id: 'esri' as const,
      label: 'Esri World Imagery',
      icon: Sun,
      desc: 'Citra satelit global alternatif dari Esri ArcGIS',
    },
    {
      id: 'osm' as const,
      label: 'OpenStreetMap',
      icon: Layers,
      desc: 'Peta jalan komunitas terbuka global',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white font-sans text-left pb-10 select-none">
      {/* Header Info */}
      <div className="px-5 py-3.5 bg-emerald-50/40 border-b border-slate-100 flex items-start gap-2.5">
        <MapIcon size={14} className="text-emerald-700 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
          Pilih latar peta dasar sesuai kebutuhan visualisasi dan analisis sebaran fasilitas
          kesehatan.
        </p>
      </div>

      {/* List Basemaps */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100 text-slate-700">
          <Layers size={13} className="text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-800">Katalog Peta Dasar</h4>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {baseMaps.map((map) => {
            const isActive = activeBaseMap === map.id;
            const Icon = map.icon;

            return (
              <button
                key={map.id}
                onClick={() => setActiveBaseMap(map.id)}
                className="group flex items-center justify-between px-5 py-3.5 bg-white hover:bg-slate-50/70 transition-colors text-left w-full outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Toggle Indicator */}
                  <div
                    className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                      isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div
                      className={`transition-colors ${
                        isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </div>

                    <div className="flex flex-col">
                      <span
                        className={`text-xs transition-colors ${
                          isActive ? 'text-emerald-900 font-bold' : 'text-slate-700 font-medium'
                        }`}
                      >
                        {map.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-none mt-1">
                        {map.desc}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
