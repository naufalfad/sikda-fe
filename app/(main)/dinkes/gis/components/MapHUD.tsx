'use client';

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Maximize,
  Building2,
  Cross,
  HeartPulse,
  FlaskConical,
  Pill,
  Siren,
  Truck,
  Users,
} from 'lucide-react';
import { useGisUIStore } from '../store/useGisUIStore';

interface LegendItem {
  label: string;
  desc: string;
  color?: string;
  icon?: any;
  layerId?: string;
  isEws?: boolean;
  isBoundary?: boolean;
}

interface LegendSection {
  title: string;
  items: LegendItem[];
}

export default function MapHUD() {
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const { activeLayers } = useGisUIStore();

  const triggerZoomIn = () => window.dispatchEvent(new CustomEvent('map-zoom-in'));
  const triggerZoomOut = () => window.dispatchEvent(new CustomEvent('map-zoom-out'));
  const triggerResetView = () => window.dispatchEvent(new CustomEvent('map-reset-view'));

  const legendSections: LegendSection[] = [
    {
      title: 'Fasilitas Layanan Rujukan & Rawat Inap',
      items: [
        {
          label: 'Rumah Sakit (RSUD & Swasta)',
          desc: 'Faskes Rujukan Lanjutan (Tk. 2 & 3)',
          color: 'bg-rose-600',
          icon: Building2,
          layerId: 'layer-rs',
        },
        {
          label: 'Puskesmas (Rawat Inap & PONED)',
          desc: 'Faskes Tingkat Pertama (FKTP)',
          color: 'bg-emerald-600',
          icon: HeartPulse,
          layerId: 'layer-puskesmas',
        },
        {
          label: 'Puskesmas Pembantu (PUSTU)',
          desc: 'Jaringan Pelayanan Desa',
          color: 'bg-teal-600',
          icon: Cross,
          layerId: 'layer-pustu',
        },
      ],
    },
    {
      title: 'Penunjang Medis & Kefarmasian',
      items: [
        {
          label: 'Laboratorium (Labkesda & Swasta)',
          desc: 'Pemeriksaan Klinis & PCR/TCM',
          color: 'bg-purple-600',
          icon: FlaskConical,
          layerId: 'layer-lab',
        },
        {
          label: 'Apotek & Farmasi',
          desc: 'Apotek Resmi & Distribusi Obat',
          color: 'bg-blue-600',
          icon: Pill,
          layerId: 'layer-apotek',
        },
      ],
    },
    {
      title: 'Upaya Kesehatan Bersumberdaya Masyarakat',
      items: [
        {
          label: 'Posyandu Balita & Ibu Hamil',
          desc: 'Pemantauan Tumbuh Kembang & Imunisasi',
          color: 'bg-amber-500',
          icon: Users,
          layerId: 'layer-posyandu',
        },
        {
          label: 'Pos Pelayanan Lansia',
          desc: 'Skrining PTM & Kesehatan Geriatri',
          color: 'bg-orange-600',
          icon: Users,
          layerId: 'layer-poslansia',
        },
      ],
    },
    {
      title: 'Armada Tanggap Darurat Medis',
      items: [
        {
          label: 'Ambulans Pasien (AGD 119 / UGD)',
          desc: 'Siaga Gawat Darurat Medis 24 Jam',
          color: 'bg-rose-700',
          icon: Siren,
          layerId: 'layer-amb-pasien',
          isEws: true,
        },
        {
          label: 'Mobil Jenazah Dinkes / Pemkab',
          desc: 'Layanan Pengantaran Jenazah',
          color: 'bg-slate-700',
          icon: Truck,
          layerId: 'layer-amb-jenazah',
        },
      ],
    },
    {
      title: 'Batas Administrasi Wilayah',
      items: [
        {
          label: 'Batas 40 Kecamatan Kab. Bogor',
          desc: 'Agregasi Kepadatan & Wilayah Kerja',
          isBoundary: true,
        },
      ],
    },
  ];

  return (
    <div className="absolute right-6 bottom-6 z-30 pointer-events-auto flex items-end gap-3 select-none">
      {/* CARD LEGENDA PETA */}
      <div className="w-80 bg-white/95 backdrop-blur-md border border-slate-300 shadow-xl rounded-none overflow-hidden transition-all duration-300">
        {/* Header Legenda */}
        <div
          onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
          className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-800">
            <Layers size={13} className="text-emerald-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Legenda Simbol Medis
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 outline-none">
            {isLegendCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Body Legenda */}
        {!isLegendCollapsed && (
          <div className="flex flex-col py-1 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 text-left">
            {legendSections.map((sec, sIdx) => (
              <div key={sIdx} className="py-1.5">
                <div className="px-3.5 pb-1 pt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {sec.title}
                </div>

                <div className="flex flex-col divide-y divide-slate-50">
                  {sec.items.map((item, idx) => {
                    let isLayerActive = true;
                    if (item.layerId) {
                      isLayerActive = activeLayers.includes(item.layerId);
                    }
                    const IconComp = item.icon;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-slate-50/60 transition-all duration-200 ${
                          isLayerActive ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                          {item.isBoundary ? (
                            <div className="w-5 h-2.5 border-2 border-indigo-600 border-dashed" />
                          ) : (
                            <div className="relative">
                              {item.isEws && isLayerActive && (
                                <span className="absolute -inset-1 rounded-md opacity-60 bg-rose-400 animate-ping" />
                              )}
                              <div
                                className={`relative w-5 h-5 rounded-none ${item.color} text-white flex items-center justify-center shadow-xs border border-white`}
                              >
                                {IconComp && <IconComp size={11} strokeWidth={2.4} />}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-[11px] font-semibold leading-tight truncate ${
                              isLayerActive ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.desc && (
                            <span className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">
                              {item.desc}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAVIGASI ZOOM & RESET KONTROL */}
      <div className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-300 shadow-xl rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
        <button
          onClick={triggerZoomIn}
          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none cursor-pointer"
          title="Perbesar Peta (Zoom In)"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <button
          onClick={triggerResetView}
          className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 group rounded-none outline-none cursor-pointer"
          title="Pusatkan Ulang Peta (Reset View)"
        >
          <Maximize
            size={14}
            strokeWidth={2.5}
            className="group-hover:scale-110 transition-transform"
          />
        </button>
        <button
          onClick={triggerZoomOut}
          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none cursor-pointer"
          title="Perkecil Peta (Zoom Out)"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
