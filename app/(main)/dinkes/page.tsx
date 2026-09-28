"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Activity, 
  BedDouble, 
  AlertTriangle, 
  Pill, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { dinkesService, DinkesSummary, FaskesWorkload } from '../../../services/dinkes.service';

export default function DinkesDashboardPage() {
  const [summary, setSummary] = useState<DinkesSummary | null>(null);
  const [workloads, setWorkloads] = useState<FaskesWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, workloadData] = await Promise.all([
        dinkesService.getExecutiveSummary(),
        dinkesService.getWorkloadAnalytics()
      ]);
      setSummary(sumData);
      setWorkloads(workloadData?.list || []);
    } catch (err: any) {
      console.error("Gagal memuat analitik Dinkes:", err);
      setError(err?.response?.data?.message || err?.message || "Gagal menghubungi server analitik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
              Pusat Komando Wilayah
            </span>
            <span className="text-xs text-slate-400">• Realtime Sync</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Eksekutif Dinas Kesehatan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoring lalu lintas pasien, rasio beban tenaga medis, ketersediaan tempat tidur, dan logistik se-Kabupaten.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Perbarui Data
          </button>
          <Link
            href="/dinkes/workload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            Analisis Mutasi Nakes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={fetchData} className="text-xs font-bold text-red-700 underline hover:text-red-900">
            Coba Lagi
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Faskes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Faskes</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (summary?.totalFaskes ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Puskesmas & Klinik Aktif</p>
        </div>

        {/* Total Nakes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tenaga Medis</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (summary?.totalNakes ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Dokter & Perawat Tersebar</p>
        </div>

        {/* Trafic Pasien */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kunjungan</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (summary?.totalKunjunganBulanIni ?? 0)}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Pasien Bulan Berjalan</p>
        </div>

        {/* BOR Tempat Tidur */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rerata BOR</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : `${summary?.borPersen ?? 0}%`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.totalBedTerisi ?? 0} dari {summary?.totalBed ?? 0} Bed Terisi
          </p>
        </div>

        {/* Aset Kritis Rusak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aset Rusak</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {loading ? '...' : (summary?.totalAsetKritisRusak ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Alkes Kritis Perlu Servis</p>
        </div>

        {/* Obat Menipis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stok Obat Kritis</span>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-600">
            {loading ? '...' : (summary?.totalObatMenipis ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Item Obat di Bawah Batas</p>
        </div>
      </div>

      {/* Main Analysis Section: Traffic Pasien & Beban Nakes per Faskes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Monitoring Beban Kerja & Rasio Dokter per Faskes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Data otomatis mengidentifikasi faskes dengan traffic pasien tinggi namun dokter terbatas untuk dasar mutasi dinas.
            </p>
          </div>
          <Link
            href="/dinkes/workload"
            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-wider"
          >
            Lihat Analisis Rinci <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Nama Fasilitas Kesehatan</th>
                <th className="py-3 px-4">Wilayah / Kec.</th>
                <th className="py-3 px-4 text-center">Trafic Pasien</th>
                <th className="py-3 px-4 text-center">Jumlah Dokter</th>
                <th className="py-3 px-4 text-center">Rasio Beban (Pasien/Dokter)</th>
                <th className="py-3 px-4 text-center">Status Beban</th>
                <th className="py-3 px-6">Rekomendasi Dinas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data faskes se-Kabupaten...
                  </td>
                </tr>
              ) : workloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data faskes yang tercatat dalam sistem.
                  </td>
                </tr>
              ) : (
                workloads.map((item) => {
                  const isKritis = item.bebanKerjaStatus === 'KRITIS_TINGGI' || item.bebanKerjaStatus === 'TINGGI';
                  return (
                    <tr key={item.faskesId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{item.namaFaskes}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block pl-6">
                          {item.tipeFaskes}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.wilayahKecamatan || 'Kecamatan Terdata'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {item.totalPasien}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        <div className="inline-flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.totalDokter}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-900">
                        {item.rasioPasienPerDokter} : 1
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full ${
                            item.bebanKerjaStatus === 'KRITIS_TINGGI'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.bebanKerjaStatus === 'TINGGI'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : item.bebanKerjaStatus === 'NORMAL'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.bebanKerjaStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{item.rekomendasi}</p>
                        {item.mutasiDibutuhkan && (
                          <Link
                            href={`/dinkes/workload?faskesId=${item.faskesId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 mt-1"
                          >
                            Tindakan Mutasi Nakes <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link 
          href="/dinkes/workload"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Analisis Mutasi Nakes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pindahkan atau tugaskan dokter & perawat dari faskes surplus ke faskes defisit.
          </p>
        </Link>

        <Link 
          href="/dinkes/beds"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BedDouble className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Monitoring BOR Kamar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pantau tingkat keterisian bed rawat inap dan IGD seluruh Puskesmas.
          </p>
        </Link>

        <Link 
          href="/dinkes/assets"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Aset & Alkes Kritis</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Identifikasi alat medis rusak atau perlu kalibrasi di faskes binaan.
          </p>
        </Link>

        <Link 
          href="/dinkes/medicines"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Logistik Obat Faskes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deteksi kelangkaan stok obat dan redistribusi antar apotek faskes.
          </p>
        </Link>
      </div>
    </div>
  );
}
