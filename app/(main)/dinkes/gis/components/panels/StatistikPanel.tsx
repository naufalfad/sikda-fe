'use client';

import React, { useMemo } from 'react';
import {
  BarChart3,
  Building2,
  HeartPulse,
  Cross,
  FlaskConical,
  Pill,
  Users,
  Siren,
  Bed,
  MapPin,
  CheckCircle2,
  Network,
} from 'lucide-react';
import { FaskesItem } from '@/services/dinkes.service';
import { useGisUIStore } from '../../store/useGisUIStore';

interface StatistikPanelProps {
  faskesList: FaskesItem[];
}

export default function StatistikPanel({ faskesList = [] }: StatistikPanelProps) {
  const { setMapCenter, setMapZoom } = useGisUIStore();

  const stats = useMemo(() => {
    let rsCount = 0;
    let puskesmasCount = 0;
    let pustuCount = 0;
    let labCount = 0;
    let apotekCount = 0;
    let ukbmCount = 0;
    let ambulanceCount = 0;
    let totalBedEstimated = 0;

    const kecMap: Record<string, { total: number; rs: number; pkm: number; amb: number; lat: number; lng: number }> = {};

    faskesList.forEach((f) => {
      const jenis = (f.jenis || '').toLowerCase();
      const tingkat = (f.tingkatFaskes || '').toLowerCase();
      const kec = f.wilayahKecamatan || f.kecamatan || 'Kabupaten Bogor';

      const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
      const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);

      if (!kecMap[kec]) {
        kecMap[kec] = { total: 0, rs: 0, pkm: 0, amb: 0, lat, lng };
      }
      kecMap[kec].total += 1;
      if (!isNaN(lat) && !isNaN(lng)) {
        kecMap[kec].lat = lat;
        kecMap[kec].lng = lng;
      }

      if (jenis.includes('rumah sakit') || tingkat.includes('tingkat 2') || tingkat.includes('tingkat 3')) {
        rsCount++;
        kecMap[kec].rs += 1;
      } else if (jenis.includes('pembantu') || jenis.includes('pustu')) {
        pustuCount++;
      } else if (jenis.includes('puskesmas')) {
        puskesmasCount++;
        kecMap[kec].pkm += 1;
      } else if (jenis.includes('laboratorium') || jenis.includes('lab')) {
        labCount++;
      } else if (jenis.includes('apotek') || jenis.includes('farmasi')) {
        apotekCount++;
      } else if (jenis.includes('posyandu') || jenis.includes('pos lansia')) {
        ukbmCount++;
      }

      if (f.ketersediaanAmbulance === true || Number(f.ketersediaanAmbulance) > 0) {
        ambulanceCount++;
        kecMap[kec].amb += 1;
      }

      if (f.kapasitasBed != null) {
        if (typeof f.kapasitasBed === 'number') {
          totalBedEstimated += f.kapasitasBed;
        } else {
          const num = parseInt(String(f.kapasitasBed).replace(/\D/g, ''));
          if (!isNaN(num)) totalBedEstimated += num;
        }
      }
    });

    const sortedKec = Object.entries(kecMap).sort((a, b) => b[1].total - a[1].total);
    const terintegrasiCount = faskesList.filter((f) => f.isTerintegrasiSikda).length;
    const nonSikdaCount = faskesList.length - terintegrasiCount;

    return {
      total: faskesList.length,
      rsCount,
      puskesmasCount,
      pustuCount,
      labCount,
      apotekCount,
      ukbmCount,
      ambulanceCount,
      totalBedEstimated,
      kecamatanList: sortedKec,
      terintegrasiCount,
      nonSikdaCount,
    };
  }, [faskesList]);

  const handleKecClick = (lat: number, lng: number) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMapZoom(14);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-left pb-10 select-none">
      {/* Top Banner */}
      <div className="px-5 py-3.5 bg-emerald-50/40 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">Ringkasan Kapasitas Faskes</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800">
          Kab. Bogor
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Total Faskes Terdata
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {stats.total}
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
              Fasilitas Aktif
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 flex flex-col">
            <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
              Kapasitas Tempat Tidur
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 flex items-baseline gap-1">
              {stats.totalBedEstimated} <span className="text-xs font-normal">TT</span>
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Bed size={10} /> Ruang Perawatan
            </span>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-200 flex flex-col">
            <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider">
              Armada Ambulans Siaga
            </span>
            <span className="text-2xl font-bold font-mono text-rose-900 mt-1">
              {stats.ambulanceCount}
            </span>
            <span className="text-[9px] text-rose-700 font-semibold mt-0.5 flex items-center gap-1">
              <Siren size={10} /> AGD 119 & Jenazah
            </span>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 flex flex-col">
            <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider">
              Puskesmas & Pustu
            </span>
            <span className="text-2xl font-bold font-mono text-blue-900 mt-1">
              {stats.puskesmasCount + stats.pustuCount}
            </span>
            <span className="text-[9px] text-blue-700 font-semibold mt-0.5">
              Jaringan Layanan Desa
            </span>
          </div>
        </div>

        {/* STATUS INTEGRASI SIKDA DI KABUPATEN BOGOR */}
        <div className="p-3.5 bg-slate-900 text-white rounded-none border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Network size={12} />
              Interoperabilitas Sistem SIKDA
            </span>
            <span className="text-[10px] font-mono font-bold text-white bg-slate-800 px-2 py-0.5">
              {stats.total > 0 ? ((stats.terintegrasiCount / stats.total) * 100).toFixed(0) : 0}% Adopsi
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">{stats.terintegrasiCount}</span>
              <span className="text-[10px] text-slate-300">Faskes Terintegrasi SIKDA</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-amber-400">{stats.nonSikdaCount}</span>
              <span className="text-[10px] text-slate-400">Belum Terkoneksi</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.terintegrasiCount / stats.total) * 100 : 0}%` }}
            />
            <div
              className="bg-amber-500/60 h-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.nonSikdaCount / stats.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">
            Puskesmas Cibinong Raya &amp; Sukamakmur telah aktif menggunakan SIKDA. Faskes lainnya masih dalam tahap pemetaan master wilayah Dinkes.
          </p>
        </div>

        {/* Breakdown List */}
        <div className="flex flex-col border border-slate-200 divide-y divide-slate-100">
          <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Distribusi per Kategori Faskes
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <Building2 size={13} className="text-rose-600" /> Rumah Sakit Rujukan (RSUD & Swasta)
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.rsCount}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <HeartPulse size={13} className="text-emerald-600" /> Puskesmas Induk (FKTP)
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.puskesmasCount}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <Cross size={13} className="text-teal-600" /> Puskesmas Pembantu (PUSTU)
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.pustuCount}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <FlaskConical size={13} className="text-purple-600" /> Laboratorium Medis & Labkesda
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.labCount}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <Pill size={13} className="text-blue-600" /> Apotek & Sarana Kefarmasian
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.apotekCount}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <Users size={13} className="text-amber-600" /> UKBM (Posyandu & Pos Lansia)
            </span>
            <span className="font-mono font-bold text-slate-900">{stats.ukbmCount}</span>
          </div>
        </div>

        {/* Tabel Sebaran per Kecamatan */}
        <div className="flex flex-col border border-slate-200">
          <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sebaran Wilayah Kecamatan</span>
            <span>Total Faskes</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {stats.kecamatanList.map(([kec, info]) => (
              <div
                key={kec}
                onClick={() => handleKecClick(info.lat, info.lng)}
                className="px-3.5 py-2 flex items-center justify-between hover:bg-emerald-50/50 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={11} className="text-emerald-700 shrink-0" />
                  <span className="truncate text-slate-800 font-medium">Kec. {kec}</span>
                </div>
                <div className="flex items-center gap-2">
                  {info.rs > 0 && (
                    <span className="text-[8px] font-bold px-1 bg-rose-100 text-rose-800">
                      {info.rs} RS
                    </span>
                  )}
                  {info.amb > 0 && (
                    <span className="text-[8px] font-bold px-1 bg-amber-100 text-amber-800">
                      {info.amb} Amb
                    </span>
                  )}
                  <span className="font-mono font-bold text-emerald-800">{info.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
