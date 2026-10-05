"use client";

import React from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Pill,
  BedDouble,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Info,
  Check
} from 'lucide-react';

interface AcmInfographicsProps {
  rawMetrics: any;
  scope: 'WILAYAH' | 'FASKES';
}

export default function AcmInfographics({ rawMetrics, scope }: AcmInfographicsProps) {
  if (!rawMetrics) return null;

  // 1. Data Surveilans ICD-10
  const top10 =
    scope === 'WILAYAH'
      ? rawMetrics.surveilansEpidemiologi?.top10PenyakitKabupaten || []
      : rawMetrics.surveilansPenyakit?.top10ICD10 || [];

  const maxCases = top10.length > 0 ? Math.max(...top10.map((p: any) => p.jumlahKasus || 0), 1) : 1;

  // 2. Data SDMK & Beban Kerja
  const sdmk =
    scope === 'WILAYAH'
      ? {
          totalDokter: rawMetrics.ringkasanMakro?.totalDokterKabupaten || 0,
          rasioPasienPerDokter: rawMetrics.ringkasanMakro?.rasioBebanKabupaten || 0,
          statusBebanKerja:
            (rawMetrics.ringkasanMakro?.rasioBebanKabupaten || 0) > 40
              ? 'WASPADA'
              : 'NORMAL'
        }
      : rawMetrics.bebanKerjaSDMK || {};

  const rasioDokter = Number(sdmk.rasioPasienPerDokter) || 0;
  // Threshold standard: <30 Aman (Hijau), 30-50 Waspada (Kuning/Amber), >50 Overload Kritis (Merah)
  let workloadColor = 'bg-emerald-500';
  let workloadBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let workloadLabel = 'Rasio Beban Aman';
  if (rasioDokter > 50) {
    workloadColor = 'bg-rose-500';
    workloadBadge = 'bg-rose-50 text-rose-800 border-rose-300';
    workloadLabel = 'Beban Sangat Kritis';
  } else if (rasioDokter > 30) {
    workloadColor = 'bg-amber-500';
    workloadBadge = 'bg-amber-50 text-amber-800 border-amber-300';
    workloadLabel = 'Waspada Kelelahan Nakes';
  }

  // 3. Data Tempat Tidur & BOR
  const borRaw =
    scope === 'WILAYAH'
      ? rawMetrics.ringkasanMakro?.borRataRataKabupaten || '0%'
      : rawMetrics.tempatTidurBOR?.bor || '0%';
  const borNum = parseFloat(String(borRaw).replace('%', '')) || 0;

  // Standar Depkes/Permenkes RI: BOR ideal 60% - 85%
  let borStatusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  let borStatusText = 'BOR Ideal (Kemenkes)';
  if (borNum > 85) {
    borStatusColor = 'text-rose-700 bg-rose-50 border-rose-300';
    borStatusText = 'Kelebihan Kapasitas (>85%)';
  } else if (borNum < 40) {
    borStatusColor = 'text-blue-700 bg-blue-50 border-blue-300';
    borStatusText = 'Under-utilized (<40%)';
  }

  // 4. Data FEFO Farmasi & Vaksin
  const obatKritis =
    scope === 'WILAYAH'
      ? rawMetrics.logistikFarmasiFEFO?.sampelObatKritisDefisit || []
      : rawMetrics.farmasiVaksin?.daftarObatKritis || [];

  const obatExpired =
    scope === 'WILAYAH'
      ? rawMetrics.logistikFarmasiFEFO?.sampelObatSegeraExpired || []
      : rawMetrics.farmasiVaksin?.daftarObatMendekatiExpired || [];

  return (
    <div className="my-8 space-y-6 print:hidden">

      {/* ─── SECTION HEADER ─── */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-none"></span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Executive Visual Intelligence & Live Diagnostics (Infografis Rinci)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Data-Driven • Sanitized Metrics
        </span>
      </div>

      {/* ─── GRID METRICS GAUGES ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Doctor Workload Meter */}
        <div className="bg-white border border-slate-300 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-700" />
              Beban Kerja Tenaga Medis (SDMK)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${workloadBadge}`}>
              {workloadLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 font-serif">
              {rasioDokter}
            </span>
            <span className="text-xs font-bold text-slate-500">Pasien / Dokter / Hari</span>
          </div>

          {/* Visual Gauge Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2.5 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${workloadColor}`}
                style={{ width: `${Math.min((rasioDokter / 60) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0 (Rendah)</span>
              <span className="text-emerald-600 font-bold">30 (Batas Aman Kemenkes)</span>
              <span className="text-rose-600 font-bold">50+ (Kritis)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed border-t border-slate-100 pt-2">
            Total Dokter: <strong className="text-slate-800">{sdmk.totalDokter || sdmk.jumlahDokter || 1} orang</strong>. 
            {rasioDokter > 40
              ? ' Dianjurkan BKO rotasi dari faskes surplus untuk menjaga mutu layanan.'
              : ' Beban kerja dokter berada dalam batas wajar pemeriksaan medis.'}
          </p>
        </div>

        {/* 2. Inpatient BOR Meter */}
        <div className="bg-white border border-slate-300 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-slate-700" />
              Bed Occupancy Rate (BOR)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${borStatusColor}`}>
              {borStatusText}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 font-serif">
              {borRaw}
            </span>
            <span className="text-xs font-bold text-slate-500">Keterisian Tempat Tidur</span>
          </div>

          {/* Visual Gauge Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2.5 overflow-hidden flex">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.min(borNum, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0%</span>
              <span className="text-emerald-700 font-bold">60% - 85% (Target Ideal)</span>
              <span>100%</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed border-t border-slate-100 pt-2">
            {scope === 'WILAYAH' ? (
              <>Kapasitas Agregat: <strong className="text-slate-800">{rawMetrics.ringkasanMakro?.totalBedKabupaten || 0} Bed</strong> di faskes rawat inap se-wilayah.</>
            ) : (
              <>Kapasitas: <strong className="text-slate-800">{rawMetrics.tempatTidurBOR?.bedTerisi || 0} Terisi</strong> dari {rawMetrics.tempatTidurBOR?.totalBed || 0} Bed total ({rawMetrics.tempatTidurBOR?.bedTersedia || 0} Siap Pakai).</>
            )}
          </p>
        </div>

        {/* 3. Logistik FEFO Urgency */}
        <div className="bg-white border border-slate-300 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-slate-700" />
              Pengawasan Logistik FEFO
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 border bg-amber-50 text-amber-800 border-amber-300">
              Kedaluwarsa & Kritis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Stok Kritis / Habis</span>
              <span className="text-2xl font-black text-rose-900 font-serif">
                {obatKritis.length}
              </span>
              <span className="text-[10px] text-rose-600 block">Item Defisit</span>
            </div>

            <div className="p-2 bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Expired &lt;90 Hari</span>
              <span className="text-2xl font-black text-amber-900 font-serif">
                {obatExpired.length}
              </span>
              <span className="text-[10px] text-amber-600 block">Perlu Redistribusi</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed border-t border-slate-100 pt-2">
            Terapkan skema <em>First-Expired, First-Out</em> untuk mencegah potensi pemborosan anggaran obat faskes.
          </p>
        </div>

      </div>

      {/* ─── SURVEILANS MORBIDITAS: TOP 10 ICD-10 HORIZONTAL BAR CHART ─── */}
      {top10.length > 0 && (
        <div className="bg-white border border-slate-300 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Distribusi Morbiditas 10 Besar Diagnosis (ICD-10 Surveillance)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Frekuensi kasus berdasarkan rekam medis klinis yang terverifikasi dalam periode observasi aktif.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-600" />
                Wajib Lapor / KLB
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Menular
              </span>
            </div>
          </div>

          {/* Interactive Bars */}
          <div className="space-y-2.5">
            {top10.map((penyakit: any, idx: number) => {
              const code = penyakit.kode || penyakit.kodeIcd10 || '-';
              const name = penyakit.diagnosis || penyakit.namaDiagnosis || 'Diagnosis';
              const cases = penyakit.jumlahKasus || 0;
              const pct = penyakit.persentase || `${Math.round((cases / maxCases) * 100)}%`;
              const barWidth = Math.max((cases / maxCases) * 100, 3);

              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 h-5 flex items-center justify-center font-mono text-[10px] font-black bg-slate-200 text-slate-800 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 text-[10px] border border-emerald-200 shrink-0">
                        {code}
                      </span>
                      <span className="font-bold text-slate-800 truncate" title={name}>
                        {name}
                      </span>
                      {penyakit.isWajibLapor && (
                        <span className="shrink-0 px-1 py-0.2 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                          KLB
                        </span>
                      )}
                      {penyakit.isPenyakitMenular && (
                        <span className="shrink-0 px-1 py-0.2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider">
                          Menular
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-slate-700">
                      <span>{cases} Kasus</span>
                      <span className="text-slate-400 text-[10px] ml-1.5 font-normal">({pct})</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        penyakit.isWajibLapor
                          ? 'bg-rose-500'
                          : penyakit.isPenyakitMenular
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
