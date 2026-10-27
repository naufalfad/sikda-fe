'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TestTubes, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Clock,
  Calendar,
  ClipboardList,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { laboratoriumService } from '@/services/laboratorium.service';

export default function LaboratoriumDashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data riil dari backend
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      totalHariIni: number;
      menunggu: number;
      sedangDilayani: number;
      selesai: number;
    };
    chartData: { day: string; date: string; count: number }[];
    selesaiTerakhir: any[];
  }>({
    stats: {
      totalHariIni: 0,
      menunggu: 0,
      sedangDilayani: 0,
      selesai: 0,
    },
    chartData: [],
    selesaiTerakhir: [],
  });

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await laboratoriumService.getDashboardStats();
      if (res && res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard laboratorium:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    fetchStats();
    return () => clearInterval(interval);
  }, []);

  const stats = dashboardData.stats;
  const chartData = dashboardData.chartData;
  const rawMax = Math.max(...chartData.map(d => d.count), 0);
  const maxCount = rawMax > 0 ? rawMax : 5; // Default skala 5 jika masih 0 agar grafik rapi

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 animate-in fade-in duration-500">
      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white rounded-full translate-y-1/2" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dashboard Laboratorium</h1>
              <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {user?.namaLengkap || user?.username || 'Analis Laboratorium'}
                <span className="mx-1 text-indigo-300">•</span>
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-1 text-indigo-300">•</span>
                <Clock className="w-4 h-4" />{currentTime}
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 bg-indigo-600/70 hover:bg-indigo-600 text-white text-xs font-semibold rounded-none border border-indigo-400/40 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between rounded-none">
            <div className="absolute top-6 right-6 w-10 h-10 bg-indigo-100 flex items-center justify-center rounded-none">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Order Uji Lab</p>
              <h3 className="text-4xl font-extrabold text-gray-900">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-600" /> : stats.totalHariIni}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Hari ini dari rawat jalan / IGD</p>
            </div>
            
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>{stats.totalHariIni > 0 ? `${stats.totalHariIni} pasien terdaftar hari ini` : 'Belum ada order masuk hari ini'}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between rounded-none">
            <div className="absolute top-6 right-6 w-10 h-10 bg-amber-100 flex items-center justify-center rounded-none">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Antrean Aktif</p>
              <h3 className="text-4xl font-extrabold text-gray-900">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-amber-600" /> : stats.menunggu}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Menunggu diambil sampel</p>
            </div>
            
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <div className="w-2 h-2 rounded-none bg-amber-400"></div>
              <span>{stats.sedangDilayani} spesimen sedang diproses analis</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between rounded-none">
            <div className="absolute top-6 right-6 w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-none">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Selesai Diuji</p>
              <h3 className="text-4xl font-extrabold text-gray-900">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-600" /> : stats.selesai}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Hasil telah dikirim ke dokter</p>
            </div>
            
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span>
                {stats.totalHariIni > 0 
                  ? `${Math.round((stats.selesai / stats.totalHariIni) * 100)}% dari total order hari ini` 
                  : 'Siap melayani pemeriksaan baru'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAIN COLUMN - CHARTS & TABLE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart 7 Hari Terakhir */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Statistik Pemeriksaan (7 Hari Terakhir)
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Data Nyata Database</span>
              </div>

              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-64 flex items-end justify-between gap-2">
                  {chartData.map((d, i) => {
                    const heightPercentage = rawMax > 0 ? (d.count / maxCount) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group h-full">
                        <div className="w-full relative flex justify-center h-full items-end pb-2">
                          {/* Value Label */}
                          <div className={`absolute -top-6 text-xs font-bold ${d.count > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {d.count}
                          </div>
                          {/* Bar */}
                          <div 
                            className={`w-full max-w-[40px] rounded-none transition-all duration-300 ${
                              d.count > 0 
                                ? 'bg-indigo-500 group-hover:bg-indigo-600' 
                                : 'bg-gray-100 h-1.5'
                            }`}
                            style={{ height: d.count > 0 ? `${Math.max(heightPercentage, 8)}%` : '6px' }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase mt-2">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <span>Belum ada data riwayat pemeriksaan 7 hari terakhir.</span>
                </div>
              )}
            </div>

            {/* Tabel Ringkasan Terakhir */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    Pemeriksaan Selesai Terakhir
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Daftar spesimen yang telah selesai diuji dan dikirim ke dokter.</p>
                </div>
                <Link href="/laboratorium/antrian" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  Lihat Antrean <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs font-medium text-gray-500 bg-white border-b border-gray-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Waktu Selesai</th>
                      <th className="px-6 py-3">Nama Pasien</th>
                      <th className="px-6 py-3">Dokter Pengirim</th>
                      <th className="px-6 py-3">Pemeriksaan</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardData.selesaiTerakhir.length > 0 ? (
                      dashboardData.selesaiTerakhir.map((order) => {
                        const finishTime = order.updatedAt 
                          ? new Date(order.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                          : '-';
                        return (
                          <tr key={order.id} className="hover:bg-indigo-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">{finishTime}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{order.pasien?.namaLengkap || '-'}</div>
                              <div className="text-[11px] font-mono text-gray-400">RM: {order.pasien?.noRM || '-'}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{order.dokter?.namaLengkap || 'Dokter Pemeriksa'}</td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-indigo-700">
                                {order.details?.length || 0} Parameter Uji
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-none text-xs font-bold">
                                SELESAI
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-xs">
                          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                          <span>Belum ada pemeriksaan laboratorium yang selesai.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* SIDE COLUMN - QUICK LINKS & STATUS */}
          <div className="space-y-6">
            
            {/* Quick Links */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-none">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Akses Cepat Laboratorium</h2>
              </div>
              <div className="p-3 grid grid-cols-1 gap-2">
                <Link href="/laboratorium/antrian" className="p-4 border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/60 group flex items-center gap-3.5 transition-all rounded-none">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 group-hover:text-indigo-700">Antrean Uji Lab</h4>
                    <p className="text-xs text-gray-500">Buka antrean sampel & input hasil lab</p>
                  </div>
                </Link>

                <div className="p-4 border border-gray-100 bg-gray-50/50 flex items-center gap-3.5 rounded-none">
                  <div className="p-2.5 bg-slate-200 text-slate-600">
                    <TestTubes className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Alur Pemeriksaan</h4>
                    <p className="text-xs text-gray-500">Dokter buat order lab → Analis input hasil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Operasional */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-none">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Status Operasional Lab</h2>
                <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-none">Aktif</span>
              </div>
              <div className="p-5 text-xs text-gray-600 space-y-3 leading-relaxed">
                <p>
                  Unit Laboratorium siap menerima spesimen medis. Semua rujukan uji laboratorium yang diorder oleh Dokter Poli Rawat Jalan atau UGD akan otomatis muncul di menu <b>Antrean Uji Lab</b>.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                  <strong>💡 Catatan Alur:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-blue-800">
                    <li>Dokter memilih parameter uji di tab <em>Laboratorium</em> saat periksa pasien.</li>
                    <li>Order masuk ke Lab → Petugas input hasil & klik <em>Kirim Hasil</em>.</li>
                    <li>Hasil lab langsung muncul di rekam medis dokter secara real-time.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
