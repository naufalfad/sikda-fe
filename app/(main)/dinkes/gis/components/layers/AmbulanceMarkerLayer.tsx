'use client';

import React, { useMemo } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useGisUIStore } from '../../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';

const SIREN_AMBULANCE_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 10H6"/>
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 7H14"/>
  <circle cx="17" cy="18" r="2"/>
  <circle cx="7" cy="18" r="2"/>
</svg>
`;

const JENAZAH_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
  <path d="M15 18H9"/>
  <path d="M19 18h2a1 1 0 0 0 1-1v-5h-7"/>
  <circle cx="7" cy="18" r="2"/>
  <circle cx="17" cy="18" r="2"/>
</svg>
`;

const createAmbulanceMarkerIcon = (isJenazah: boolean, isSelected: boolean) => {
  const fillColor = isJenazah ? '#334155' : '#be123c'; // Slate-700 or Rose-700
  const radarColor = isJenazah ? 'rgba(71, 85, 105, 0.45)' : 'rgba(244, 63, 94, 0.6)';
  const strokeColor = isSelected ? '#fbbf24' : '#ffffff';
  const strokeWidth = isSelected ? '3' : '2.2';
  const scaleClass = isSelected ? 'scale-120 -translate-y-1' : 'hover:scale-110';
  const iconSvg = isJenazah ? JENAZAH_SVG : SIREN_AMBULANCE_SVG;

  return L.divIcon({
    html: `
      <div style="position: relative; width: 44px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: pointer;" class="${scaleClass} transition-transform duration-200">
        <!-- Beacon Radar Halo -->
        <div style="position: absolute; left: 5px; top: 1px; width: 34px; height: 34px; border-radius: 9999px; background: ${radarColor}; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>

        <svg width="46" height="46" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7)); overflow: visible; position: relative; z-index: 1;">
          <path d="M16 42 C11.5 33.5 2.5 23 2.5 15 A 13.5 13.5 0 1 1 29.5 15 C 29.5 23 20.5 33.5 16 42 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
          <g transform="translate(6, 5)" color="#ffffff">
            ${iconSvg}
          </g>

          <!-- Top Siren Emergency Badge -->
          <g transform="translate(19, -4)">
            <circle cx="7" cy="7" r="7" fill="${isJenazah ? '#64748b' : '#ef4444'}" stroke="#ffffff" stroke-width="1.5"/>
            <text x="7" y="10" fill="#ffffff" font-size="8" font-weight="900" font-family="sans-serif" text-anchor="middle">!</text>
          </g>
        </svg>
      </div>
    `,
    className: 'custom-ambulance-marker-pin bg-transparent border-none',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  });
};

const createAmbulanceClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div class="w-10 h-10 bg-rose-700 text-white rounded-full flex flex-col items-center justify-center border-2 border-white shadow-xl font-black text-xs select-none hover:scale-110" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <span class="leading-none">${count}</span>
        <span class="text-[7px] font-bold uppercase tracking-tighter -mt-0.5 opacity-90 leading-none">ARMADA</span>
      </div>
    `,
    className: 'custom-ambulance-cluster-icon bg-transparent border-none',
    iconSize: L.point(40, 40, true),
    iconAnchor: [20, 20],
  });
};

interface AmbulanceMarkerLayerProps {
  faskesList: FaskesItem[];
  currentZoom: number;
}

export default function AmbulanceMarkerLayer({
  faskesList = [],
  currentZoom = 12,
}: AmbulanceMarkerLayerProps) {
  const map = useMap();
  const { activeLayers, selectedFaskesId, setSelectedFaskes, openPanel, closePanelsToTheRight } =
    useGisUIStore();

  const ambulanceFleet = useMemo(() => {
    return faskesList.filter((f) => {
      const jenis = (f.jenis || '').toLowerCase();
      const nama = (f.nama || '').toLowerCase();
      const isJenazah = jenis.includes('jenazah') || nama.includes('jenazah');
      const isAmbulance =
        jenis.includes('ambulance') ||
        nama.includes('ambulance') ||
        jenis.includes('siaga agd') ||
        isJenazah;

      if (!isAmbulance) return false;

      const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
      const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);
      if (isNaN(lat) || isNaN(lng)) return false;

      if (isJenazah && !activeLayers.includes('layer-amb-jenazah')) return false;
      if (!isJenazah && !activeLayers.includes('layer-amb-pasien')) return false;

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
    openPanel('detil-faskes', f.nama || f.namaFaskes || 'Ambulans', f);
  };

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createAmbulanceClusterIcon}
      maxClusterRadius={40}
      disableClusteringAtZoom={16}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
    >
      {ambulanceFleet.map((f) => {
        const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
        const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);
        const isSelected = selectedFaskesId === f.id;
        const isJenazah = (f.jenis || '').toLowerCase().includes('jenazah') || (f.nama || '').toLowerCase().includes('jenazah');

        return (
          <Marker
            key={`ambulance-marker-${f.id}`}
            position={[lat, lng]}
            icon={createAmbulanceMarkerIcon(isJenazah, isSelected)}
            eventHandlers={{ click: (e) => handleEntityClick(f, e) }}
          >
            <Tooltip direction="top" offset={[0, -46]} opacity={0.96}>
              <div className="font-sans text-left text-xs font-bold leading-tight">
                <div className="text-rose-700 uppercase tracking-tight">{f.nama}</div>
                <div className="text-[10px] text-slate-700 font-semibold mt-0.5">
                  {f.jenisAmbulance || 'Siaga Darurat Medis 24 Jam'}
                </div>
                {f.kontakDarurat && (
                  <div className="text-[9px] text-white bg-rose-600 px-1 py-0.2 font-mono font-bold mt-1 inline-block">
                    HOTLINE: {f.kontakDarurat}
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
