'use client';

import React, { useMemo } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useGisUIStore } from '../../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';

// SVG Icons for Marker Pin interior
const HOSPITAL_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 6v4"/>
  <path d="M14 8h-4"/>
  <path d="M18 18V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
  <path d="M18 18H6"/>
  <path d="M10 18v-4h4v4"/>
</svg>
`;

const PUSKESMAS_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  <path d="M12 7v6"/>
  <path d="M9 10h6"/>
</svg>
`;

const PUSTU_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>
</svg>
`;

const LAB_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
  <path d="M8.5 2h7"/>
  <path d="M7 16h10"/>
</svg>
`;

const APOTEK_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
  <path d="m8.5 8.5 7 7"/>
</svg>
`;

const UKBM_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>
`;

// Pin Icon Generator
const createFaskesMarkerIcon = (jenis: string, tingkat: string, isSelected: boolean) => {
  const j = (jenis || '').toLowerCase();
  const t = (tingkat || '').toLowerCase();

  let fillColor = '#059669'; // Default Puskesmas Emerald
  let iconSvg = PUSKESMAS_SVG;

  if (j.includes('rumah sakit') || t.includes('tingkat 2') || t.includes('tingkat 3')) {
    fillColor = '#e11d48'; // Rose
    iconSvg = HOSPITAL_SVG;
  } else if (j.includes('pembantu') || j.includes('pustu')) {
    fillColor = '#0d9488'; // Teal
    iconSvg = PUSTU_SVG;
  } else if (j.includes('laboratorium') || j.includes('lab')) {
    fillColor = '#9333ea'; // Purple
    iconSvg = LAB_SVG;
  } else if (j.includes('apotek') || j.includes('farmasi')) {
    fillColor = '#2563eb'; // Blue
    iconSvg = APOTEK_SVG;
  } else if (j.includes('posyandu') || j.includes('pos lansia')) {
    fillColor = '#d97706'; // Amber
    iconSvg = UKBM_SVG;
  }

  const strokeColor = isSelected ? '#fbbf24' : '#ffffff';
  const strokeWidth = isSelected ? '3' : '2.2';
  const scaleClass = isSelected ? 'scale-115 -translate-y-1' : 'hover:scale-110';

  return L.divIcon({
    html: `
      <div style="position: relative; width: 38px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer;" class="${scaleClass} transition-transform duration-200">
        ${
          isSelected
            ? `<div style="position: absolute; left: 4px; top: 2px; width: 30px; height: 30px; border-radius: 9999px; background: rgba(251, 191, 36, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>`
            : ''
        }

        <svg width="44" height="44" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); overflow: visible; position: relative; z-index: 1;">
          <path d="M16 42 C11.5 33.5 2.5 23 2.5 15 A 13.5 13.5 0 1 1 29.5 15 C 29.5 23 20.5 33.5 16 42 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
          <g transform="translate(7, 6)" color="#ffffff">
            ${iconSvg}
          </g>
        </svg>
      </div>
    `,
    className: 'custom-faskes-marker-pin bg-transparent border-none',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

// Generator Custom Cluster Icon Medis Presisi
const createFaskesClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let sizeClass = 'w-10 h-10 text-xs';
  let bgClass = 'bg-emerald-700';

  if (count > 20) {
    sizeClass = 'w-12 h-12 text-sm';
    bgClass = 'bg-rose-600';
  } else if (count > 7) {
    sizeClass = 'w-11 h-11 text-xs';
    bgClass = 'bg-blue-600';
  }

  return L.divIcon({
    html: `
      <div class="${sizeClass} ${bgClass} text-white rounded-full flex flex-col items-center justify-center border-2 border-white shadow-xl font-black select-none transition-transform hover:scale-110" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <span class="leading-none">${count}</span>
        <span class="text-[7px] font-bold uppercase tracking-tighter -mt-0.5 opacity-90 leading-none">FASKES</span>
      </div>
    `,
    className: 'custom-faskes-cluster-icon bg-transparent border-none',
    iconSize: L.point(44, 44, true),
    iconAnchor: [22, 22],
  });
};

interface FaskesMarkerLayerProps {
  faskesList: FaskesItem[];
  currentZoom: number;
}

export default function FaskesMarkerLayer({ faskesList = [], currentZoom = 12 }: FaskesMarkerLayerProps) {
  const map = useMap();
  const { activeLayers, selectedFaskesId, setSelectedFaskes, openPanel, closePanelsToTheRight } =
    useGisUIStore();

  const filteredFaskes = useMemo(() => {
    return faskesList.filter((f) => {
      // Exclude standalone ambulances from general faskes layer (handled by AmbulanceMarkerLayer)
      const jenis = (f.jenis || '').toLowerCase();
      if (jenis.includes('ambulance') || jenis.includes('jenazah') || jenis.includes('siaga agd')) {
        return false;
      }

      const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
      const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);
      if (isNaN(lat) || isNaN(lng)) return false;

      const tingkat = (f.tingkatFaskes || '').toLowerCase();

      if ((jenis.includes('rumah sakit') || tingkat.includes('tingkat 2') || tingkat.includes('tingkat 3')) && !activeLayers.includes('layer-rs')) {
        return false;
      }
      if (jenis.includes('pembantu') && !activeLayers.includes('layer-pustu')) {
        return false;
      }
      if (jenis.includes('puskesmas') && !jenis.includes('pembantu') && !activeLayers.includes('layer-puskesmas')) {
        return false;
      }
      if ((jenis.includes('laboratorium') || jenis.includes('lab')) && !activeLayers.includes('layer-lab')) {
        return false;
      }
      if ((jenis.includes('apotek') || jenis.includes('farmasi')) && !activeLayers.includes('layer-apotek')) {
        return false;
      }
      if (jenis.includes('posyandu') && !activeLayers.includes('layer-posyandu')) {
        return false;
      }
      if (jenis.includes('pos lansia') && !activeLayers.includes('layer-poslansia')) {
        return false;
      }

      return true;
    });
  }, [faskesList, activeLayers]);

  const handleEntityClick = (f: FaskesItem, e: any) => {
    if (e && e.originalEvent) {
      e.originalEvent.stopPropagation();
    }

    const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
    const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);

    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], Math.max(currentZoom, 16), { duration: 1.5 });
    }

    setSelectedFaskes(f);
    closePanelsToTheRight(-1);
    openPanel('detil-faskes', f.nama || f.namaFaskes || 'Faskes', f);
  };

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createFaskesClusterIcon}
      maxClusterRadius={45}
      disableClusteringAtZoom={16}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
    >
      {filteredFaskes.map((f) => {
        const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
        const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);
        const isSelected = selectedFaskesId === f.id;

        return (
          <Marker
            key={`faskes-marker-${f.id}`}
            position={[lat, lng]}
            icon={createFaskesMarkerIcon(f.jenis || f.jenisFaskes || '', f.tingkatFaskes || '', isSelected)}
            eventHandlers={{ click: (e) => handleEntityClick(f, e) }}
          >
            <Tooltip direction="top" offset={[0, -42]} opacity={0.96}>
              <div className="font-sans text-left text-xs font-bold leading-tight">
                <div className="text-slate-800 uppercase tracking-tight">{f.nama}</div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {f.jenis} • {f.tingkatFaskes || 'FKTP'}
                </div>
                <div className="mt-1">
                  {f.isTerintegrasiSikda ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
                      ● Terintegrasi SIKDA ({f.totalUsers || 0} Staf &amp; Nakes)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                      ○ Belum Terintegrasi SIKDA
                    </span>
                  )}
                </div>
                {f.penanggungJawab && (
                  <div className="text-[9px] text-emerald-700 font-medium mt-0.5">
                    PJ: {f.penanggungJawab}
                  </div>
                )}
                {f.kontakDarurat && (
                  <div className="text-[9px] text-rose-600 font-bold mt-0.5">
                    Hotline: {f.kontakDarurat}
                  </div>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
