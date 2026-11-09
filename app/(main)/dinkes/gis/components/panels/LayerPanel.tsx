'use client';

import React from 'react';
import {
  Layers,
  Building2,
  HeartPulse,
  Cross,
  FlaskConical,
  Pill,
  Users,
  Siren,
  Truck,
  MapPin,
  Settings2,
  Check,
} from 'lucide-react';
import { useGisUIStore } from '../../store/useGisUIStore';

export default function LayerPanel() {
  const {
    activeLayers,
    toggleLayer,
    setAllLayers,
    mapOpacity,
    setMapOpacity,
    maskOpacity,
    setMaskOpacity,
    activeAdminBoundary,
    setActiveAdminBoundary,
  } = useGisUIStore();

  const faskesLayers = [
    {
      id: 'layer-rs',
      label: 'Rumah Sakit (RSUD & Swasta)',
      desc: 'Fasilitas rujukan lanjutan (Tingkat 2 & 3)',
      icon: Building2,
      color: 'bg-rose-600',
    },
    {
      id: 'layer-puskesmas',
      label: 'Puskesmas (Rawat Inap & Non-RI)',
      desc: 'Fasilitas kesehatan tingkat pertama (FKTP)',
      icon: HeartPulse,
      color: 'bg-emerald-600',
    },
    {
      id: 'layer-pustu',
      label: 'Puskesmas Pembantu (PUSTU)',
      desc: 'Pos pelayanan kesehatan jaringan desa',
      icon: Cross,
      color: 'bg-teal-600',
    },
    {
      id: 'layer-lab',
      label: 'Laboratorium (Labkesda & Swasta)',
      desc: 'Pemeriksaan hematologi, PCR, TCM, kimia darah',
      icon: FlaskConical,
      color: 'bg-purple-600',
    },
    {
      id: 'layer-apotek',
      label: 'Apotek & Distribusi Obat',
      desc: 'Penyedia obat, resep dokter, dan BMHP',
      icon: Pill,
      color: 'bg-blue-600',
    },
    {
      id: 'layer-posyandu',
      label: 'Posyandu Balita & Ibu Hamil',
      desc: 'UKBM pemantauan tumbuh kembang dan imunisasi',
      icon: Users,
      color: 'bg-amber-500',
    },
    {
      id: 'layer-poslansia',
      label: 'Pos Pelayanan Lansia',
      desc: 'Skrining PTM dan pemeriksaan geriatri',
      icon: Users,
      color: 'bg-orange-600',
    },
  ];

  const emergencyLayers = [
    {
      id: 'layer-amb-pasien',
      label: 'Ambulans Pasien (AGD 119 / UGD)',
      desc: 'Armada siaga gawat darurat medis advance/basic',
      icon: Siren,
      color: 'bg-rose-700',
      badge: 'DARURAT',
    },
    {
      id: 'layer-amb-jenazah',
      label: 'Mobil Jenazah Dinkes / Pemkab',
      desc: 'Armada transportasi dan pengantaran jenazah',
      icon: Truck,
      color: 'bg-slate-700',
      badge: 'LOGISTIK',
    },
  ];

  const allLayerIds = [...faskesLayers.map((l) => l.id), ...emergencyLayers.map((l) => l.id)];
  const isAllActive = allLayerIds.every((id) => activeLayers.includes(id));

  const handleToggleAll = () => {
    if (isAllActive) {
      setAllLayers([]);
    } else {
      setAllLayers(allLayerIds);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-left pb-10 select-none">
      {/* Top Banner & Quick Toggle All */}
      <div className="px-5 py-3.5 bg-emerald-50/40 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">Kontrol Visibilitas Layer</span>
        </div>
        <button
          onClick={handleToggleAll}
          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
        >
          {isAllActive ? 'Nonaktifkan Semua' : 'Aktifkan Semua'}
        </button>
      </div>

      {/* SECTION 1: SEBARAN FASILITAS MEDIS */}
      <div className="flex flex-col">
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-slate-700">
          <Building2 size={13} className="text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-800">Fasilitas Layanan Medis</h4>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {faskesLayers.map((layer) => {
            const isActive = activeLayers.includes(layer.id);
            const Icon = layer.icon;

            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className="group flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50/70 transition-colors text-left w-full outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Switch */}
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
                      className={`w-6 h-6 rounded-none ${layer.color} text-white flex items-center justify-center shadow-xs shrink-0`}
                    >
                      <Icon size={13} strokeWidth={2.4} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs ${
                          isActive ? 'text-slate-800 font-semibold' : 'text-slate-500 font-normal'
                        }`}
                      >
                        {layer.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {layer.desc}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ARMADA AMBULANS & TANGGAP DARURAT */}
      <div className="flex flex-col mt-2">
        <div className="px-5 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700">
          <Siren size={13} className="text-rose-700" />
          <h4 className="text-xs font-bold text-slate-800">Layanan Tanggap Darurat & Armada</h4>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {emergencyLayers.map((layer) => {
            const isActive = activeLayers.includes(layer.id);
            const Icon = layer.icon;

            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className="group flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50/70 transition-colors text-left w-full outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                      isActive ? 'bg-rose-600' : 'bg-slate-300'
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
                      className={`w-6 h-6 rounded-none ${layer.color} text-white flex items-center justify-center shadow-xs shrink-0`}
                    >
                      <Icon size={13} strokeWidth={2.4} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs ${
                            isActive ? 'text-slate-800 font-semibold' : 'text-slate-500 font-normal'
                          }`}
                        >
                          {layer.label}
                        </span>
                        <span className="text-[8px] font-bold px-1 bg-rose-100 text-rose-800 tracking-wider">
                          {layer.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {layer.desc}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: BATAS WILAYAH KECAMATAN */}
      <div className="flex flex-col mt-2">
        <div className="px-5 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700">
          <MapPin size={13} className="text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-800">Batas Administrasi Wilayah</h4>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          <button
            onClick={() =>
              setActiveAdminBoundary(activeAdminBoundary === 'kecamatan' ? 'none' : 'kecamatan')
            }
            className="group flex items-center justify-between px-5 py-3.5 bg-white hover:bg-slate-50/70 transition-colors text-left w-full outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                  activeAdminBoundary === 'kecamatan' ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    activeAdminBoundary === 'kecamatan' ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-none shrink-0 bg-indigo-600 border border-slate-200" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700">
                    Batas 40 Wilayah Kecamatan
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none mt-1">
                    Poligon batas dan agregasi jumlah faskes per kecamatan
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 4: KONTROL VISUAL PETA */}
      <div className="flex flex-col mt-2">
        <div className="px-5 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700">
          <Settings2 size={13} className="text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-800">Kontrol Visual Peta</h4>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {/* Slider Transparansi Poligon */}
          <div className="px-5 py-3.5 bg-white space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-700">Transparansi Poligon</span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                {mapOpacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mapOpacity}
              onChange={(e) => setMapOpacity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-none appearance-none cursor-pointer accent-emerald-600 outline-none"
            />
          </div>

          {/* Slider Peredupan Luar Wilayah */}
          <div className="px-5 py-3.5 bg-white space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-700">
                Peredupan Luar Wilayah Kab. Bogor
              </span>
              <span className="text-[10px] font-mono text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-200">
                {maskOpacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={maskOpacity}
              onChange={(e) => setMaskOpacity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-none appearance-none cursor-pointer accent-slate-800 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
