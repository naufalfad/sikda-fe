"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BedDouble, 
  ArrowLeft, 
  RefreshCw, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { dinkesService, FaskesBedStatus } from '../../../../services/dinkes.service';

export default function DinkesBedsPage() {
  const [beds, setBeds] = useState<FaskesBedStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const data = await dinkesService.getBedMonitoring();
      setBeds(data || []);
    } catch (err) {
      console.error("Gagal memuat monitoring tempat tidur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const bedList = Array.isArray(beds) ? beds : [];
  const totalKapasitas = bedList.reduce((acc, curr) => acc + (curr.totalKapasitas || 0), 0);
  const totalTerisi = bedList.reduce((acc, curr) => acc + (curr.terisi || 0), 0);
  const totalTersedia = bedList.reduce((acc, curr) => acc + (curr.tersedia || 0), 0);
  const averageBOR = totalKapasitas > 0 ? Math.round((totalTerisi / totalKapasitas) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dinkes"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard Dinkes
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-emerald-600" />
            Monitoring Tempat Tidur & Bed Occupancy Rate (BOR)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengawasan ketersediaan tempat tidur rawat inap dan IGD seluruh Puskesmas di Kabupaten.
          </p>
        </div>

        <button
          onClick={fetchBeds}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          Perbarui Status
        </button>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Kapasitas Bed</span>
          <span className="text-2xl font-black text-slate-900">{totalKapasitas} Unit</span>
          <p className="text-xs text-slate-500 mt-1">Seluruh Puskesmas & RS Daerah</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">Bed Tersedia</span>
          <span className="text-2xl font-black text-emerald-600">{totalTersedia} Unit</span>
          <p className="text-xs text-slate-500 mt-1">Siap untuk rujukan pasien baru</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">Bed Terisi</span>
          <span className="text-2xl font-black text-blue-600">{totalTerisi} Unit</span>
          <p className="text-xs text-slate-500 mt-1">Pasien sedang dirawat</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Rerata BOR Daerah</span>
          <span className="text-2xl font-black text-purple-600">{averageBOR}%</span>
          <p className="text-xs text-slate-500 mt-1">Standar ideal Kemenkes: 60-85%</p>
        </div>
      </div>

      {/* Table of Faskes Bed Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-base">Ketersediaan Bed per Faskes di Wilayah Kabupaten</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Faskes</th>
                <th className="py-3 px-4 text-center">Total Bed</th>
                <th className="py-3 px-4 text-center">Tersedia</th>
                <th className="py-3 px-4 text-center">Terisi</th>
                <th className="py-3 px-4 text-center">Pemeliharaan</th>
                <th className="py-3 px-4 text-center">BOR (%)</th>
                <th className="py-3 px-6 text-center">Status Kapasitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat status tempat tidur faskes...
                  </td>
                </tr>
              ) : bedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data tempat tidur faskes.
                  </td>
                </tr>
              ) : (
                bedList.map((item) => (
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
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {item.totalKapasitas}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-600">
                      {item.tersedia}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-blue-600">
                      {item.terisi}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-500">
                      {item.pemeliharaan}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-900">
                      {item.borPersen}%
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                          item.statusKapasitas === 'PENUH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.statusKapasitas === 'WASPADA'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.statusKapasitas}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
