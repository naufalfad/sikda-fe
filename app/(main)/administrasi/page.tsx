"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Clock, CheckCircle2, Search, UserPlus, Volume2,
  ClipboardEdit, Activity, AlertTriangle, TrendingUp,
  Heart, Shield, Baby, ChevronRight, Calendar, Printer,
  BarChart2, ArrowUpRight, ArrowDownRight, RefreshCw,
  Smartphone, UserCheck, QrCode, Sparkles, CheckCheck
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

import { kunjunganService } from '@/services/kunjungan.service';
import { portalPasienService } from '@/services/portalPasien.service';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Menunggu': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Dilayani': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Selesai': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getPrioritasBadge = (prioritas: string) => {
  switch (prioritas) {
    case 'Lansia': return 'bg-purple-100 text-purple-700';
    case 'Hamil': return 'bg-pink-100 text-pink-700';
    case 'Disabilitas': return 'bg-orange-100 text-orange-700';
    default: return 'hidden';
  }
};

const getBayarStyle = (bayar: string) => {
  switch (bayar) {
    case 'BPJS': return 'bg-green-100 text-green-700';
    case 'Umum': return 'bg-blue-100 text-blue-700';
    case 'Asuransi': return 'bg-violet-100 text-violet-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHariIni: 0,
    totalBulanIni: 0,
    menunggu: 0,
    sedangDilayani: 0,
    selesai: 0,
    pembayaranList: [] as { label: string, value: number }[],
    prioritas: { lansia: 0, disabilitas: 0, hamilMenyusui: 0 }
  });
  const [antrean, setAntrean] = useState<any[]>([]);
  const [grafik, setGrafik] = useState<any[]>([]);
  const [poli, setPoli] = useState<any[]>([]);

  // State Pendaftaran Antrean Online (WhatsApp)
  const [onlineBookings, setOnlineBookings] = useState<any[]>([]);
  const [activeQueueTab, setActiveQueueTab] = useState<'LOKET' | 'ONLINE'>('LOKET');
  const [quickCheckInKode, setQuickCheckInKode] = useState('');
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);
  const [onlineSearch, setOnlineSearch] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const data = await kunjunganService.getDashboardStats();
      setStats(data.stats);
      setAntrean(data.antrean);
      setGrafik(data.grafik);
      setPoli(data.poli);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOnlineBookings = async () => {
    try {
      const res = await portalPasienService.getFaskesBookings({ faskesId: user?.faskesId || undefined });
      if (res.success && res.data) {
        setOnlineBookings(res.data);
      }
    } catch (err) {
      console.warn('Gagal memuat booking online:', err);
    }
  };

  const handleCheckIn = async (bookingIdentifier: string) => {
    if (!bookingIdentifier) return;
    setIsProcessingCheckIn(true);
    try {
      const res = await portalPasienService.checkInBooking(bookingIdentifier);
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Check-In Pasien Berhasil!',
          html: `
            <div class="text-left text-sm space-y-2 mt-2">
              <p><strong>Nama Pasien:</strong> ${res.pasien?.namaLengkap || '-'}</p>
              <p><strong>No. Rekam Medis:</strong> <span class="bg-blue-100 text-blue-800 px-2 py-0.5 font-bold">${res.pasien?.noRM || '-'}</span></p>
              <p><strong>Poli Tujuan:</strong> ${res.kunjungan?.poliklinik?.namaPoli || '-'}</p>
              <p><strong>Nomor Antrean:</strong> <span class="text-xl font-black text-emerald-600">${res.kunjungan?.noAntrian || '-'}</span></p>
              <div class="bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 mt-2">
                ✓ Pasien resmi tersimpan di <strong>Master Pasien</strong> faskes.<br/>
                ✓ Kunjungan aktif diterbitkan & langsung masuk ke antrean dokter.<br/>
                ✓ Notifikasi WhatsApp terkirim ke pasien.
              </div>
            </div>
          `,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'Tutup & Lanjutkan'
        });
        setQuickCheckInKode('');
        await Promise.all([fetchDashboardStats(), fetchOnlineBookings()]);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Check-In',
          text: res.message || 'Terjadi kesalahan saat memproses check-in.'
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Check-In Gagal',
        text: err.response?.data?.message || err.message || 'Gagal menghubungi server'
      });
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchOnlineBookings();
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardStats();
      fetchOnlineBookings();
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const getAge = (dob: string) => {
    if (!dob) return 0;
    const diff = new Date().getTime() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const mapStatus = (st: string) => {
    if (st === 'MENUNGGU' || st === 'MENUNGGU_DOKTER') return 'Menunggu';
    if (st === 'DIPROSES_SCREENING' || st === 'DIPERIKSA') return 'Dilayani';
    return 'Selesai';
  };

  const filtered = antrean.filter(p => {
    const nama = p.pasien?.namaLengkap || '';
    const noAntrian = p.noAntrian || '';
    const noRm = p.pasien?.noRM || '';
    const matchSearch = nama.toLowerCase().includes(search.toLowerCase()) || 
                        noAntrian.toLowerCase().includes(search.toLowerCase()) || 
                        noRm.toLowerCase().includes(search.toLowerCase());
    
    const mappedSt = mapStatus(p.statusKunjungan);
    const matchStatus = filterStatus === 'Semua' || mappedSt === filterStatus;
    
    return matchSearch && matchStatus;
  });

  if (!isClient) return null;

  const maxGrafik = Math.max(...grafik.map(g => g.jumlah), 1); // Avoid division by zero

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white rounded-full translate-y-1/2" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* LEFT: Info */}
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dashboard Loket Pendaftaran</h1>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-1 text-blue-300">•</span>
                <Clock className="w-4 h-4" />{currentTime}
              </p>
            </div>
          </div>

          {/* RIGHT: Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveQueueTab('ONLINE');
                const el = document.getElementById('antrean-table-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors shadow-md relative"
            >
              <Smartphone className="w-4 h-4" />
              <span>Antrean Online (WA)</span>
              {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length > 0 && (
                <span className="w-5 h-5 bg-white text-emerald-700 font-extrabold text-[11px] rounded-full flex items-center justify-center">
                  {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length}
                </span>
              )}
            </button>
            <Link href="/administrasi/pendaftaran"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors shadow-md">
              <UserPlus className="w-4 h-4" />
              Daftar Pasien Baru
            </Link>
            <Link href="/administrasi/master-pasien"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800/60 border border-blue-400 text-white font-bold text-sm hover:bg-blue-800/80 transition-colors">
              <ClipboardEdit className="w-4 h-4" />
              Master Pasien
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── ROW 1: STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Kunjungan</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalHariIni}</p>
                <p className="text-xs text-gray-500 mt-1">Hari ini</p>
              </div>
              <div className="p-2.5 bg-blue-100 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12% vs kemarin</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Antrian Aktif</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.menunggu}</p>
                <p className="text-xs text-gray-500 mt-1">Menunggu panggilan poli</p>
              </div>
              <div className="p-2.5 bg-amber-100 text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span>{stats.sedangDilayani} pasien sedang dilayani</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selesai Hari Ini</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.selesai}</p>
                <p className="text-xs text-gray-500 mt-1">Sudah dilayani</p>
              </div>
              <div className="p-2.5 bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{Math.round((stats.selesai / (stats.totalHariIni || 1)) * 100)}% dari total kunjungan</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-200 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioritas Khusus</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.prioritas.lansia + stats.prioritas.disabilitas + stats.prioritas.hamilMenyusui}</p>
                <p className="text-xs text-gray-500 mt-1">Lansia, Hamil, Disabilitas</p>
              </div>
              <div className="p-2.5 bg-purple-100 text-purple-600">
                <Heart className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 font-medium">Lansia: {stats.prioritas.lansia}</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 font-medium">Hamil: {stats.prioritas.hamilMenyusui}</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 font-medium">Disabilitas: {stats.prioritas.disabilitas}</span>
            </div>
          </div>
        </div>

        {/* ── ROW 2: GRAFIK + KOMPOSISI BAYAR + STATUS POLI ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* GRAFIK KUNJUNGAN 7 HARI */}
          <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Tren Kunjungan Mingguan</h2>
                <p className="text-xs text-gray-500 mt-0.5">Jumlah pendaftaran 7 hari terakhir</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-blue-500 inline-block" />Total Kunjungan
                </span>
              </div>
            </div>

            {/* Chart Bars */}
            <div className="flex items-end gap-3 flex-1" style={{ minHeight: '120px' }}>
              {grafik.map((item, idx) => {
                const isToday = idx === grafik.length - 1;
                const barH = Math.round((item.jumlah / maxGrafik) * 120);
                const bpjsH = Math.round((item.bpjs / maxGrafik) * 120);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0">
                    <span className={`text-xs font-bold mb-2 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                      {item.jumlah}
                    </span>
                    <div className="w-full flex justify-center items-end" style={{ height: '110px' }}>
                      <div
                        className={`w-5 sm:w-8 flex flex-col justify-end overflow-hidden rounded-t-sm ${isToday ? 'bg-blue-600' : 'bg-blue-300 hover:bg-blue-400'} transition-colors relative group/bar`}
                        style={{ height: `${barH}px` }}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute opacity-0 group-hover/bar:opacity-100 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                          Total: {item.jumlah}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold mt-1 ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                      {item.hari}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Stats */}
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-extrabold text-gray-900">{stats.totalBulanIni.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Bulan Ini</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900">{Math.round(stats.totalBulanIni / 26)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata / Hari</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-emerald-600">↑ 8%</p>
                <p className="text-xs text-gray-500 mt-0.5">vs Bulan Lalu</p>
              </div>
            </div>
          </div>

          {/* KOMPOSISI JENIS BAYAR */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Jenis Pembayaran</h2>
              <p className="text-xs text-gray-500 mb-5">Komposisi pasien hari ini</p>

              {stats.pembayaranList.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Belum ada data pembayaran</p>
              ) : (
                stats.pembayaranList.map((item, idx) => {
                  const totalPembayaran = stats.pembayaranList.reduce((acc, curr) => acc + curr.value, 0);
                  const persen = totalPembayaran === 0 ? 0 : Math.round((item.value / totalPembayaran) * 100);
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div key={item.label} className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal text-xs">({persen}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5">
                        <div className={`h-2.5 ${color} transition-all duration-700`} style={{ width: `${persen}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 3: STATUS POLI + TABEL ANTRIAN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* STATUS POLI */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Status Poli</h2>
            <div className="space-y-2.5">
              {poli.map((p, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 border ${p.status === 'Buka' ? 'border-gray-200 bg-white hover:bg-blue-50/50' : 'border-gray-100 bg-gray-50'} transition-colors`}>
                  <div>
                    <p className={`text-sm font-semibold ${p.status === 'Tutup' ? 'text-gray-400' : 'text-gray-800'}`}>{p.nama}</p>
                    <p className={`text-xs mt-0.5 ${p.status === 'Tutup' ? 'text-gray-400' : 'text-gray-500'}`}>{p.dokter}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2 py-0.5 ${p.status === 'Buka' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{p.status}</span>
                    {p.status === 'Buka' && <span className="text-xs text-blue-600 font-bold">{p.jumlah} pasien</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TABEL ANTRIAN */}
          <div id="antrean-table-section" className="lg:col-span-3 bg-white border border-gray-200 shadow-sm flex flex-col">
            
            {/* TAB TOGGLE: LOKET vs ONLINE WHATSAPP */}
            <div className="flex border-b border-gray-200 bg-gray-50/70">
              <button
                type="button"
                onClick={() => setActiveQueueTab('LOKET')}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                  activeQueueTab === 'LOKET'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Antrean Loket Faskes ({filtered.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveQueueTab('ONLINE')}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                  activeQueueTab === 'ONLINE'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Antrean Online WhatsApp ({onlineBookings.length})</span>
                {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                    {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length} Menunggu Check-In
                  </span>
                )}
              </button>
            </div>

            {/* ============================================================ */}
            {/* VIEW 1: TABEL ANTREAN LOKET FISIK */}
            {/* ============================================================ */}
            {activeQueueTab === 'LOKET' && (
              <>
                <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Daftar Antrian Loket</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Pantau dan kelola antrian pasien</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Filter Status */}
                    <div className="flex border border-gray-200 text-xs font-semibold">
                      {['Semua', 'Menunggu', 'Dilayani', 'Selesai'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                          className={`px-3 py-1.5 transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="text" placeholder="Cari pasien / no antrian..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 text-gray-900" />
                    </div>
                  </div>
                </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">No. Antrian</th>
                    <th className="px-5 py-3">Pasien</th>
                    <th className="px-5 py-3">Poli Tujuan</th>
                    <th className="px-5 py-3">Pembayaran</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-800 text-sm">{p.noAntrian}</span>
                          <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {p.pasien?.namaLengkap}
                          {p.prioritas !== 'Umum' && (
                            <span className={`text-xs px-1.5 py-0.5 font-bold ${getPrioritasBadge(p.prioritas)}`}>{p.prioritas}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>{getAge(p.pasien?.tanggalLahir)} th, {p.pasien?.jenisKelamin === 'Laki-Laki' ? 'L' : 'P'}</span>
                          <span className={`px-1.5 py-0.5 text-xs font-medium ${p.statusPasien === 'Baru' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
                            {p.statusPasien}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{p.pasien?.noRM || 'Pasien Baru'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700 font-medium text-sm">{p.poliklinik?.namaPoli || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBayarStyle(p.pasien?.penjamin?.jenisPenjamin || 'Umum')}`}>
                          {p.pasien?.penjamin?.jenisPenjamin || 'Umum'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(mapStatus(p.statusKunjungan))}`}>
                          {mapStatus(p.statusKunjungan)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {mapStatus(p.statusKunjungan) === 'Menunggu' && (
                            <>
                              <button className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors" title="Panggil Pasien">
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <Link 
                                href={`/administrasi/pendaftaran?nik=${p.pasien?.nik || ''}&noRM=${p.pasien?.noRM || ''}&skenario=Lama`} 
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <ClipboardEdit className="w-3.5 h-3.5" />
                                Proses
                              </Link>
                            </>
                          )}
                          {mapStatus(p.statusKunjungan) === 'Selesai' && (
                            <button className="p-2 text-gray-500 hover:bg-gray-100 transition-colors" title="Cetak Bukti">
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Search className="w-8 h-8" />
                          <p className="font-medium">Tidak ada data yang ditemukan</p>
                          <p className="text-xs">Coba ubah kata kunci pencarian atau filter status</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

                {/* Footer Table */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Menampilkan <strong className="text-gray-700">{filtered.length}</strong> dari <strong className="text-gray-700">{antrean.length}</strong> antrean</span>
                  <button onClick={fetchDashboardStats} className="flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700">
                    <RefreshCw className="w-3.5 h-3.5" />Refresh Data
                  </button>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: TABEL ANTREAN BOOKING ONLINE (WHATSAPP) */}
            {/* ============================================================ */}
            {activeQueueTab === 'ONLINE' && (
              <div className="p-5 space-y-4">
                
                {/* QUICK SCAN / INPUT KODE BOOKING BAR */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">Check-In Cepat Pasien Online</h3>
                      <p className="text-xs text-emerald-700">Scan QR Code tiket atau masukkan Kode Booking / NIK pasien saat tiba di loket</p>
                    </div>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCheckIn(quickCheckInKode);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input 
                      type="text"
                      placeholder="Kode Booking (e.g. BK-...) atau NIK..."
                      value={quickCheckInKode}
                      onChange={(e) => setQuickCheckInKode(e.target.value)}
                      className="px-3 py-2 border border-emerald-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={isProcessingCheckIn || !quickCheckInKode.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider disabled:bg-gray-300 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      {isProcessingCheckIn ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Check-In
                    </button>
                  </form>
                </div>

                {/* SEARCH & REFRESH BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter nama, NIK, kode booking..."
                      value={onlineSearch}
                      onChange={(e) => setOnlineSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64 text-gray-900"
                    />
                  </div>

                  <button
                    onClick={fetchOnlineBookings}
                    className="text-xs text-gray-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Segarkan Data
                  </button>
                </div>

                {/* TABLE OF ONLINE BOOKINGS */}
                <div className="overflow-x-auto border border-gray-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">No. Antrean & Booking</th>
                        <th className="px-5 py-3">Data Pasien</th>
                        <th className="px-5 py-3">Poli & Dokter Tujuan</th>
                        <th className="px-5 py-3">Keluhan Pasien</th>
                        <th className="px-5 py-3">Status Kedatangan</th>
                        <th className="px-5 py-3 text-right">Aksi Loket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {onlineBookings
                        .filter(b => {
                          const q = onlineSearch.toLowerCase();
                          const nama = b.namaLengkap?.toLowerCase() || '';
                          const nik = b.nik || '';
                          const kode = b.kodeBooking?.toLowerCase() || '';
                          const noAntrian = b.noAntrian?.toLowerCase() || '';
                          return !q || nama.includes(q) || nik.includes(q) || kode.includes(q) || noAntrian.includes(q);
                        })
                        .map((b) => {
                          const isCheckedIn = b.statusBooking === 'CHECKED_IN';
                          return (
                            <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-extrabold text-base text-gray-900">{b.noAntrian}</div>
                                <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 inline-block mt-1">
                                  {b.kodeBooking}
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-gray-900 text-sm">{b.namaLengkap}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">NIK: {b.nik}</div>
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                  <span>{getAge(b.tanggalLahir)} th</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold">+{b.akunPasien?.nomorWa}</span>
                                </div>
                                <div className="mt-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 ${
                                    b.jenisPasien === 'LAMA' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {b.jenisPasien === 'LAMA' ? `Pasien Lama (${b.noRM || 'Ada RM'})` : 'Pasien Baru'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-gray-900 text-xs">{b.poliklinik?.namaPoli || 'Poli Umum'}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{b.dokter?.namaLengkap || 'Dokter Jaga Poli'}</div>
                                <div className="text-[11px] text-gray-400 mt-1">{b.faskes?.namaFaskes}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="text-xs text-gray-700 max-w-xs line-clamp-2" title={b.keluhan || '-'}>
                                  {b.keluhan || '-'}
                                </p>
                              </td>
                              <td className="px-5 py-3.5">
                                {isCheckedIn ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold border border-emerald-300">
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Sudah Check-In
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-bold border border-amber-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Kedatangan
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {isCheckedIn ? (
                                  <span className="text-xs text-gray-400 italic">Telah Masuk Poli</span>
                                ) : (
                                  <button
                                    onClick={() => handleCheckIn(b.id)}
                                    disabled={isProcessingCheckIn}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Check-In
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {onlineBookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                            <Smartphone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="font-medium">Belum ada pasien yang mendaftar online melalui WhatsApp hari ini.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>Total <strong className="text-gray-700">{onlineBookings.length}</strong> pendaftaran online tercatat</span>
                  <span className="text-emerald-700 font-bold">Terintegrasi otomatis ke Rekam Medis & Poli Dokter</span>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
