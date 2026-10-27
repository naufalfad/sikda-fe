"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Activity, 
  FileText, 
  AlertCircle,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  Brain,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

import { kunjunganService } from '@/services/kunjungan.service';

export default function PerawatDashboardPage() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({
    stats: { totalAntrean: 0, belumSkrining: 0, sudahSkrining: 0 },
    triage: { merah: 0, kuning: 0, hijau: 0, hitam: 0 },
    antrean: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const data = await kunjunganService.getPerawatDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch perawat dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto refresh every 30 seconds
    const intervalStats = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(intervalStats);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-none bg-amber-100 text-amber-800 border border-amber-200">Menunggu Skrining</span>;
      case 'DIPROSES_SCREENING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-none bg-blue-100 text-blue-800 border border-blue-200">Sedang Skrining</span>;
      case 'MENUNGGU_DOKTER':
      case 'DIPERIKSA':
      case 'SELESAI':
      case 'MENUNGGU_FARMASI':
      case 'MENUNGGU_KASIR':
      case 'PULANG':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-none bg-emerald-100 text-emerald-800 border border-emerald-200">Selesai Skrining</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-none bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const getTriageBadge = (triage: string) => {
    switch (triage) {
      case 'Merah':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">Merah</span>;
      case 'Kuning':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-400 text-yellow-900 rounded">Kuning</span>;
      case 'Hijau':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded">Hijau</span>;
      case 'Hitam':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-800 text-white rounded">Hitam</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded border border-gray-200">Belum Ada</span>;
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 animate-in fade-in duration-500">
      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white rounded-full translate-y-1/2" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dashboard Perawat</h1>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Ns. {user?.nama_lengkap || user?.username} (Poli Umum / IGD)
                <span className="mx-1 text-blue-300">•</span>
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-1 text-blue-300">•</span>
                <Clock className="w-4 h-4" />{currentTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">

            <div className="absolute top-6 right-6 w-10 h-10 bg-blue-100 flex items-center justify-center rounded-none">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Antrean Masuk</p>
              <h3 className="text-4xl font-extrabold text-gray-900">{dashboardData.stats.totalAntrean}</h3>
              <p className="text-sm text-gray-500 mt-1">Pasien hari ini</p>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{dashboardData.stats.sudahSkrining} pasien sudah diskrining</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-6 right-6 w-10 h-10 bg-amber-100 flex items-center justify-center rounded">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Menunggu Skrining</p>
              <h3 className="text-4xl font-extrabold text-gray-900">{dashboardData.stats.belumSkrining}</h3>
              <p className="text-sm text-gray-500 mt-1">Perlu pemeriksaan awal</p>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span>Segera lakukan Tanda Vital</span>
            </div>
          </div>

          {/* Card 3 (Triage Summary) */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-6 right-6 w-10 h-10 bg-red-100 flex items-center justify-center rounded">
              <HeartPulse className="w-5 h-5 text-red-600" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pasien Gawat Darurat</p>
              <h3 className="text-4xl font-extrabold text-gray-900">{dashboardData.triage.merah}</h3>
              <p className="text-sm text-gray-500 mt-1">Triage Merah (Resusitasi)</p>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-3 text-xs font-semibold">
              <span className="text-yellow-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> {dashboardData.triage.kuning} Kuning</span>
              <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> {dashboardData.triage.hijau} Hijau</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN COLUMN - QUEUE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Antrean Skrining Perawat
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Daftar pasien yang baru didaftarkan dan perlu pemeriksaan awal.</p>
                </div>
                <Link href="/perawat/screening" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Lihat Semua <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs font-medium text-gray-500 bg-white border-b border-gray-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">No. Antrean</th>
                      <th className="px-6 py-3">Pasien</th>
                      <th className="px-6 py-3">Poli Tujuan</th>
                      <th className="px-6 py-3">Triage</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardData.antrean.map((item: any) => {
                      // Calculate age
                      let age = 0;
                      if (item.pasien?.tanggalLahir) {
                        const today = new Date();
                        const birthDate = new Date(item.pasien.tanggalLahir);
                        age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                      }
                      
                      const genderStr = item.pasien?.jenisKelamin?.toLowerCase().startsWith('l') ? 'L' : 'P';
                      
                      return (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1">{item.noAntrian}</span>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.jamRegistrasi}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.pasien?.namaLengkap}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{genderStr}, {age} thn • RM: {item.pasien?.noRM || 'Baru'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700 font-medium">{item.poliklinik?.namaPoli || item.poliTujuan || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTriageBadge(item.screening?.kategoriTriage || '-')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.statusKunjungan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link 
                            href={`/perawat/screening/${item.id}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-none hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Mulai Skrining
                          </Link>
                        </td>
                      </tr>
                      );
                    })}
                    {dashboardData.antrean.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          Tidak ada antrean saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDE COLUMN - QUICK LINKS */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-none">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Akses Cepat Modul Skrining</h2>
              </div>
              <div className="p-2 grid grid-cols-2 gap-2">
                <Link href="/perawat/screening/umum" className="p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 group flex flex-col items-center justify-center text-center transition-all h-24">
                  <Stethoscope className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700">Skrining Umum & Vital Sign</span>
                </Link>
                <Link href="/perawat/screening/ptm" className="p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 group flex flex-col items-center justify-center text-center transition-all h-24">
                  <Activity className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700">Skrining PTM & Risiko</span>
                </Link>
                <Link href="/perawat/screening/jiwa" className="p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 group flex flex-col items-center justify-center text-center transition-all h-24">
                  <Brain className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700">Kesehatan Jiwa</span>
                </Link>
                <Link href="/perawat/screening/tb" className="p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 group flex flex-col items-center justify-center text-center transition-all h-24">
                  <FileText className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700">Skrining TB Paru</span>
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 shadow-sm rounded-none p-5 relative overflow-hidden">
              <AlertCircle className="w-24 h-24 text-blue-100 absolute -right-4 -bottom-4 opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-blue-900 mb-1">Status IGD & Rujukan</h3>
                <p className="text-xs text-blue-700 mb-3">Terdapat 1 pasien IGD yang masuk dalam 30 menit terakhir dan butuh Triage.</p>
                <Link href="/perawat/igd" className="inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-900">
                  Lihat Monitor IGD <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
