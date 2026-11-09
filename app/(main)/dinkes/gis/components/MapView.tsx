'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  Popup,
  GeoJSON,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useGisUIStore } from '../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';
import { createInvertedMask, calculateFaskesPerKecamatan } from '../lib/spatialHelper';

import FaskesMarkerLayer from './layers/FaskesMarkerLayer';
import AmbulanceMarkerLayer from './layers/AmbulanceMarkerLayer';

// Controller Eksternal untuk Pemusatan Kamera Peta secara Reaktif
function ExternalMapController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useGisUIStore();

  useEffect(() => {
    if (mapCenter && mapCenter.length === 2) {
      map.flyTo(mapCenter, mapZoom || 12, { duration: 1.5 });
    }
  }, [mapCenter, mapZoom, map]);

  return null;
}

// Handler Dekopel Event Navigasi Peta (Zoom & Reset)
function MapEventsHandler() {
  const map = useMap();

  useEffect(() => {
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleResetView = () => map.flyTo([-6.4889, 106.8432], 12, { duration: 1.5 });

    window.addEventListener('map-zoom-in', handleZoomIn);
    window.addEventListener('map-zoom-out', handleZoomOut);
    window.addEventListener('map-reset-view', handleResetView);

    return () => {
      window.removeEventListener('map-zoom-in', handleZoomIn);
      window.removeEventListener('map-zoom-out', handleZoomOut);
      window.removeEventListener('map-reset-view', handleResetView);
    };
  }, [map]);

  return null;
}

// Listener Perubahan Zoom Level Peta
function MapZoomListener({ onChange }: { onChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onChange(map.getZoom());
    },
  });

  useEffect(() => {
    onChange(map.getZoom());
  }, [map, onChange]);

  return null;
}

interface MapViewProps {
  faskesList: FaskesItem[];
}

export default function MapView({ faskesList = [] }: MapViewProps) {
  const [currentZoom, setCurrentZoom] = useState(12);
  const [kecData, setKecData] = useState<any>(null);

  const {
    activeBaseMap,
    mapOpacity,
    maskOpacity,
    activeAdminBoundary,
    showImpactRadius,
    selectedFaskes,
  } = useGisUIStore();

  // Load GeoJSON Batas Kecamatan Kabupaten Bogor
  useEffect(() => {
    fetch('/geojson/bogor-kecamatan.json')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat batas kecamatan');
        return res.json();
      })
      .then((data) => setKecData(data))
      .catch((err) => console.error('Error loading GeoJSON:', err));
  }, []);

  // Hitung Inverted Mask (Area di luar Kabupaten Bogor)
  const invertedBogorMask = useMemo(() => {
    if (!kecData) return null;
    return createInvertedMask(kecData);
  }, [kecData]);

  // Hitung jumlah faskes per kecamatan untuk Choropleth
  const faskesPerKecamatan = useMemo(() => {
    if (!kecData) return {};
    return calculateFaskesPerKecamatan(faskesList, kecData);
  }, [faskesList, kecData]);

  // Center radius pelayanan
  const impactCenter = useMemo((): [number, number] | null => {
    if (!selectedFaskes) return null;
    const lat = selectedFaskes.latitude ?? (selectedFaskes.titikGps ? parseFloat(selectedFaskes.titikGps.split(',')[0]) : NaN);
    const lng = selectedFaskes.longitude ?? (selectedFaskes.titikGps ? parseFloat(selectedFaskes.titikGps.split(',')[1]) : NaN);
    return !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;
  }, [selectedFaskes]);

  // URL Tile Provider
  const getTileUrl = () => {
    switch (activeBaseMap) {
      case 'dark':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      case 'esri':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}';
      case 'osm':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'satellite':
        return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      case 'street':
      default:
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
  };

  // GeoJSON style kecamatan
  const geoJsonKecStyle = () => ({
    color: '#4f46e5',
    weight: 1.5,
    fillColor: '#6366f1',
    fillOpacity: (mapOpacity / 100) * 0.22,
    dashArray: '4, 4',
  });

  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <MapContainer
        center={[-6.4889, 106.8432]}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        maxZoom={19}
      >
        <ExternalMapController />
        <MapEventsHandler />
        <MapZoomListener onChange={setCurrentZoom} />

        {/* Tile Layer Sesuai Basemap Aktif */}
        <TileLayer
          key={activeBaseMap}
          url={getTileUrl()}
          attribution="&copy; Google Maps / OpenStreetMap / SIKDA GIS"
        />

        {/* INVERTED BOUNDARY MASKING (Area Luar Wilayah Kabupaten Bogor) */}
        {invertedBogorMask && (
          <Polygon
            positions={invertedBogorMask as any}
            pathOptions={{
              color: '#0f172a',
              fillColor: '#0f172a',
              fillOpacity: maskOpacity / 100,
              weight: 1.5,
              opacity: 0.3,
              interactive: false,
            }}
          />
        )}

        {/* BATAS ADMINISTRASI KECAMATAN */}
        {activeAdminBoundary === 'kecamatan' && kecData && (
          <GeoJSON
            key={`kec-${mapOpacity}-${faskesList.length}`}
            data={kecData}
            style={geoJsonKecStyle}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.WADMKC || 'Kecamatan';
              const count = faskesPerKecamatan[name] || 0;
              layer.bindTooltip(
                `<div class="font-sans text-xs"><strong>Kec. ${name}</strong><br/><span class="text-emerald-700 font-bold">${count} Faskes Terdata</span></div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* RADIUS PELAYANAN FASKES (3 KM BUFFER) */}
        {showImpactRadius && impactCenter && (
          <Circle
            center={impactCenter}
            radius={3000}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.16,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="text-xs font-bold text-rose-700">
                Radius Jangkauan Pelayanan Medis 3 KM
              </div>
            </Popup>
          </Circle>
        )}

        {/* LAYER SEBARAN FASILITAS KESEHATAN */}
        <FaskesMarkerLayer faskesList={faskesList} currentZoom={currentZoom} />

        {/* LAYER ARMADA AMBULANS & GAWAT DARURAT */}
        <AmbulanceMarkerLayer faskesList={faskesList} currentZoom={currentZoom} />
      </MapContainer>
    </div>
  );
}
