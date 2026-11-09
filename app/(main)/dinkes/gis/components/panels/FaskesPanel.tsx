'use client';

import React, { useMemo } from 'react';
import {
  Search,
  Building2,
  HeartPulse,
  Cross,
  FlaskConical,
  Pill,
  Users,
  Siren,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Bed,
  CheckCircle2,
} from 'lucide-react';
import { useGisUIStore } from '../../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';

interface FaskesPanelProps {
  faskesList: FaskesItem[];
}

export default function FaskesPanel({ faskesList = [] }: FaskesPanelProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubdistrict,
    setSelectedSubdistrict,
    selectedFaskesId,
    setSelectedFaskes,
    openPanel,
    closePanelsToTheRight,
    setMapCenter,
    setMapZoom,
  } = useGisUIStore();

  // Ekstraksi daftar kecamatan unik
  const subdistricts = useMemo(() => {
    const setKec = new Set<string>();
    faskesList.forEach((f) => {
      const kec = f.wilayahKecamatan || f.kecamatan;
      if (kec) setKec.add(kec.trim());
    });
    return Array.from(setKec).sort();
  }, [faskesList]);

  // Filtering fasilitas
  const filteredList = useMemo(() => {
    return faskesList.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        f.nama?.toLowerCase().includes(q) ||
        f.kode?.toLowerCase().includes(q) ||
        f.alamat?.toLowerCase().includes(q) ||
        f.penanggungJawab?.toLowerCase().includes(q) ||
        f.wilayahKecamatan?.toLowerCase().includes(q) ||
        f.kecamatan?.toLowerCase().includes(q);

      // Kategori filter
      let matchCat = true;
      if (selectedCategory !== 'ALL') {
        const jenis = f.jenis?.toLowerCase() || '';
        const tingkat = f.tingkatFaskes?.toLowerCase() || '';

        if (selectedCategory === 'RS') {
          matchCat = jenis.includes('rumah sakit') || tingkat.includes('tingkat 2') || tingkat.includes('tingkat 3');
        } else if (selectedCategory === 'PUSKESMAS') {
          matchCat = jenis === 'puskesmas' || jenis.includes('puskesmas');
        } else if (selectedCategory === 'PUSTU') {
          matchCat = jenis.includes('pembantu') || jenis.includes('pustu');
        } else if (selectedCategory === 'LAB') {
          matchCat = jenis.includes('laboratorium') || jenis.includes('lab');
        } else if (selectedCategory === 'APOTEK') {
          matchCat = jenis.includes('apotek') || jenis.includes('farmasi');
        } else if (selectedCategory === 'UKBM') {
          matchCat = jenis.includes('posyandu') || jenis.includes('pos lansia');
        } else if (selectedCategory === 'AMBULANCE') {
          matchCat = f.ketersediaanAmbulance === true || Boolean(f.jenisAmbulance);
        }
      }

      // Kecamatan filter
      let matchKec = true;
      if (selectedSubdistrict !== 'ALL') {
        const kec = (f.wilayahKecamatan || f.kecamatan || '').toLowerCase();
        matchKec = kec.includes(selectedSubdistrict.toLowerCase());
      }

      return matchQuery && matchCat && matchKec;
    });
  }, [faskesList, searchQuery, selectedCategory, selectedSubdistrict]);

  const handleItemClick = (f: FaskesItem) => {
    setSelectedFaskes(f);

    const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
    const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);

    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMapZoom(16);
    }

    closePanelsToTheRight(-1);
    openPanel('detil-faskes', f.nama || f.namaFaskes || 'Faskes', f);
  };

  const getFacilityIcon = (jenis: string) => {
    const j = (jenis || '').toLowerCase();
    if (j.includes('rumah sakit')) return <Building2 size={14} className="text-rose-600" />;
    if (j.includes('laboratorium') || j.includes('lab')) return <FlaskConical size={14} className="text-purple-600" />;
    if (j.includes('apotek') || j.includes('farmasi')) return <Pill size={14} className="text-blue-600" />;
    if (j.includes('pembantu') || j.includes('pustu')) return <Cross size={14} className="text-teal-600" />;
    if (j.includes('posyandu') || j.includes('pos lansia')) return <Users size={14} className="text-amber-600" />;
    if (j.includes('ambulance') || j.includes('jenazah')) return <Siren size={14} className="text-rose-600" />;
    return <HeartPulse size={14} className="text-emerald-600" />;
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-left pb-10 select-none">
      {/* SEARCH & DUAL FILTER TOOLBAR */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-2.5">
        {/* Search Input */}
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors"
            size={14}
          />
          <input
            type="text"
            placeholder="Cari faskes, kode, PJ, kecamatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all rounded-none"
          />
        </div>

        {/* Category & Subdistrict Filters */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 rounded-none cursor-pointer"
          >
            <option value="ALL">Semua Jenis Faskes</option>
            <option value="RS">Rumah Sakit</option>
            <option value="PUSKESMAS">Puskesmas</option>
            <option value="PUSTU">Pustu (Pustu Desa)</option>
            <option value="LAB">Laboratorium</option>
            <option value="APOTEK">Apotek</option>
            <option value="UKBM">Posyandu & Pos Lansia</option>
            <option value="AMBULANCE">Layanan Ambulans</option>
          </select>

          <select
            value={selectedSubdistrict}
            onChange={(e) => setSelectedSubdistrict(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 rounded-none cursor-pointer"
          >
            <option value="ALL">Semua Kecamatan ({subdistricts.length})</option>
            {subdistricts.map((kec) => (
              <option key={kec} value={kec}>
                Kec. {kec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULT METRICS */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">
          Ditemukan <strong className="text-slate-800">{filteredList.length}</strong> Faskes
        </span>
        {filteredList.length !== faskesList.length && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedSubdistrict('ALL');
            }}
            className="text-emerald-700 hover:text-emerald-800 font-bold uppercase text-[9px] tracking-wider cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* FACILITY LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredList.length > 0 ? (
          filteredList.map((f) => {
            const isSelected = selectedFaskesId === f.id;
            const icon = getFacilityIcon(f.jenis || f.jenisFaskes || '');
            const kec = f.wilayahKecamatan || f.kecamatan || 'Kabupaten Bogor';

            return (
              <div
                key={f.id}
                onClick={() => handleItemClick(f)}
                className={`p-4 transition-colors cursor-pointer group relative ${
                  isSelected
                    ? 'bg-emerald-50/70 border-l-[3px] border-emerald-700'
                    : 'bg-white hover:bg-slate-50 border-l-[3px] border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 p-1.5 bg-slate-100 border border-slate-200 shrink-0">
                      {icon}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          {f.kode || 'FASKES'}
                        </span>
                        {f.tingkatFaskes && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            {f.tingkatFaskes}
                          </span>
                        )}
                        {f.akreditasi && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 uppercase tracking-wider flex items-center gap-0.5">
                            <ShieldCheck size={9} />
                            {f.akreditasi}
                          </span>
                        )}
                        {f.isTerintegrasiSikda ? (
                          <span className="text-[8px] font-black px-1.5 py-0.2 bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                            <CheckCircle2 size={8} /> SIKDA
                          </span>
                        ) : (
                          <span className="text-[8px] font-semibold px-1.5 py-0.2 bg-slate-200 text-slate-600 uppercase tracking-wider">
                            Non-SIKDA
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 mt-1 truncate group-hover:text-emerald-700 transition-colors">
                        {f.nama}
                      </h4>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">Kec. {kec}</span>
                      </div>

                      {/* Info badge row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-[9px] text-slate-500">
                        {f.kapasitasBed && (
                          <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                            <Bed size={10} className="text-slate-600" />
                            {f.kapasitasBed}
                          </span>
                        )}
                        {f.ketersediaanAmbulance && (
                          <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-1.5 py-0.5 border border-rose-200 font-semibold">
                            <Siren size={10} />
                            Siaga Ambulans
                          </span>
                        )}
                        {f.penanggungJawab && (
                          <span className="truncate max-w-[140px] text-slate-400">
                            PJ: {f.penanggungJawab}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-emerald-700 transition-colors shrink-0 mt-2"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 px-4 text-center">
            <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak ada faskes ditemukan</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau reset filter kategori.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
