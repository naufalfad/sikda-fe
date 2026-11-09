'use client';

import React from 'react';
import { Building2, ShieldCheck, MapPin, Layers, Radio, CheckCircle2 } from 'lucide-react';

export default function TentangPanel() {
  return (
    <div className="flex flex-col h-full bg-white font-sans text-left pb-10 select-none">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-emerald-900 to-slate-900 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-white">
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">SIKDA GIS ENGINE</h3>
            <span className="text-[9px] text-emerald-300 font-mono tracking-widest uppercase">
              Ver 2.0 • Dinkes Kab. Bogor
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
          Pusat Komando Geospasial Pemetaan Terpadu Fasilitas dan Layanan Kesehatan Kabupaten Bogor.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-600 leading-relaxed">
        {/* Deskripsi */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Tujuan Sistem
          </h4>
          <p className="text-slate-700">
            Modul SIKDA GIS dirancang untuk memberikan visibilitas spasial menyeluruh bagi pimpinan
            dan pemangku kebijakan Dinas Kesehatan Kabupaten Bogor dalam memantau persebaran,
            aksesibilitas, perizinan, dan kesiapsiagaan layanan kesehatan masyarakat.
          </p>
        </div>

        {/* Cakupan Objek */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Objek Spasial yang Dipetakan
          </h4>
          <div className="space-y-2">
            {[
              'Rumah Sakit Rujukan Tingkat 2 & 3 (RSUD Cibinong, Ciawi, Leuwiliang, Cileungsi, RS Swasta)',
              'Puskesmas FKTP (Puskesmas Perawatan, Non-Rawat Inap, & PONED)',
              'Puskesmas Pembantu (PUSTU) jaringan pelayanan tingkat desa',
              'Laboratorium Medis Klinis & UPTD Labkesda Kabupaten Bogor',
              'Apotek Resmi & Fasilitas Distribusi Obat',
              'Upaya Kesehatan Bersumberdaya Masyarakat: Posyandu Balita & Pos Lansia',
              'Armada Ambulans Pasien Siaga 24 Jam (AGD 119) & Mobil Jenazah',
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-700 mt-0.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kemampuan Geospasial */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Kapabilitas Analitik Geospasial
          </h4>
          <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <MapPin size={13} className="text-emerald-700" />
              <span>Inverted Polygon Masking 40 Kecamatan</span>
            </div>
            <p className="text-slate-500 text-[10px] pl-5">
              Fokus eksklusif pada wilayah administratif Kabupaten Bogor dengan peredupan area luar.
            </p>

            <div className="flex items-center gap-2 text-slate-800 font-semibold pt-1">
              <Radio size={13} className="text-rose-600" />
              <span>Analisis Radius Pelayanan (3 KM Buffer)</span>
            </div>
            <p className="text-slate-500 text-[10px] pl-5">
              Simulasi jangkauan respons cepat armada ambulans dan aksesibilitas fasilitas kesehatan.
            </p>

            <div className="flex items-center gap-2 text-slate-800 font-semibold pt-1">
              <Layers size={13} className="text-blue-600" />
              <span>Multi-Source Basemap & Street View 360°</span>
            </div>
            <p className="text-slate-500 text-[10px] pl-5">
              Dukungan citra satelit resolusi tinggi dan verifikasi visual lokasi fasilitas di lapangan.
            </p>
          </div>
        </div>

        {/* Legal & Standar */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-emerald-800 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-emerald-900 uppercase">
              Standar Integrasi Satu Data Kesehatan
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5">
              Sesuai pedoman interoperabilitas Kementerian Kesehatan Republik Indonesia dan Dinas
              Kesehatan Kabupaten Bogor.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
