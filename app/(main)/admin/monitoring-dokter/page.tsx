"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  ChevronDown,
  Building2,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { kunjunganService } from '@/services/kunjungan.service';
import { klinikService } from '@/services/klinik.service';
import { useAuthStore } from '@/store/auth.store';
import Swal from 'sweetalert2';

interface PasienSelesai {
  id: string;
  noAntrian: string;
  noRM: string;
  namaPasien: string;
  poliklinik: string;
  jenisPelayanan: string;
  jamMulai?: string | null;
  jamSelesai: string;
  durasiMenit?: number | null;
  shift: string;
  diagnosaUtama: string;
  statusKunjungan: string;
  statusPulang: string;
}

interface DokterMonitoringItem {
  dokter: {
    id: string;
    namaLengkap: string;
    username: string;
    role: string;
    poliklinik: string;
  };
  totalSelesai: number;
  totalSelesaiShiftIni: number;
  shiftBreakdown: {
    pagi: number;
    siang: number;
    malam: number;
  };
  sedangDiperiksa: number;
  antre: number;
  rataRataWaktuMenit: number;
  statusBebanKerja: 'NORMAL' | 'OPTIMAL' | 'TINGGI';
  isAktifHariIni: boolean;
  daftarPasienSelesai: PasienSelesai[];
}

export default function AdminMonitoringDokterPage() {
  const { user } = useAuthStore();
  const [selectedTanggal, setSelectedTanggal] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedPoli, setSelectedPoli] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [poliklinikList, setPoliklinikList] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<{
    ringkasanFaskes: {
      totalDokter: number;
      dokterAktifHariIni: number;
      totalPasienSelesai: number;
      rataRataPasienPerDokter: number;
      statusBebanFaskes: string;
      shiftBreakdown: { pagi: number; siang: number; malam: number };
    };
    currentShift: { id: string; label: string; timeRange: string };
    dokterList: DokterMonitoringItem[];
  } | null>(null);

  // Modal Detail Pasien Dokter
  const [selectedDokterDetail, setSelectedDokterDetail] = useState<DokterMonitoringItem | null>(null);

  // Fetch Daftar Poliklinik
  useEffect(() => {
    const fetchPoli = async () => {
      try {
        const res = await klinikService.getPoliklinik();
        setPoliklinikList(res || []);
      } catch (err) {
        console.error('Gagal mengambil master poli:', err);
      }
    };
    fetchPoli();
  }, []);

  // Fetch Data Monitoring Kinerja Dokter
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await kunjunganService.getAdminMonitoringDokter({
        tanggal: selectedTanggal,
        poliklinikId: selectedPoli || undefined
      });
      setMonitoringData(data);
    } catch (err: any) {
      console.error('Gagal mengambil data monitoring dokter:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: err?.response?.data?.message || 'Terjadi kesalahan saat memuat monitoring kinerja dokter.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTanggal, selectedPoli]);

  // Filter Dokter berdasarkan pencarian nama
  const filteredDokterList = useMemo(() => {
    if (!monitoringData?.dokterList) return [];
    if (!searchQuery.trim()) return monitoringData.dokterList;
    const q = searchQuery.toLowerCase();
    return monitoringData.dokterList.filter(
      d =>
        d.dokter.namaLengkap?.toLowerCase().includes(q) ||
        d.dokter.username?.toLowerCase().includes(q) ||
        d.dokter.poliklinik?.toLowerCase().includes(q)
    );
  }, [monitoringData, searchQuery]);

  // Shortcut Tanggal
  const setDateShortcut = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setSelectedTanggal(d.toISOString().split('T')[0]);
  };

  const getBebanBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Normal (≤30)
          </span>
        );
      case 'OPTIMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-none bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Optimal (31-40)
          </span>
        );
      case 'TINGGI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-none bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Beban Tinggi (&gt;40)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── HEADER TITLE & CONTROLS ── */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Monitoring Manajemen & Kinerja SDM Medis</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-7 h-7 text-blue-600" />
                Monitoring Kinerja & Beban Kerja Dokter
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Pantau jumlah pasien yang ditangani per hari dan per shift oleh dokter di faskes sesuai standar Kemenkes RI.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                title="Muat Ulang Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                title="Cetak Laporan Kinerja Dokter"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
            {/* Filter Tanggal */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Tanggal Pelayanan
              </label>
              <input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs px-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setDateShortcut('today')}
                  className={`text-[10px] font-bold px-2 py-0.5 border ${
                    selectedTanggal === new Date().toISOString().split('T')[0]
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setDateShortcut('yesterday')}
                  className="text-[10px] font-bold px-2 py-0.5 border bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                >
                  Kemarin
                </button>
              </div>
            </div>

            {/* Filter Poliklinik */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Unit / Poliklinik
              </label>
              <select
                value={selectedPoli}
                onChange={(e) => setSelectedPoli(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs px-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
              >
                <option value="">Semua Poliklinik / Layanan</option>
                {poliklinikList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPoli}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input Dokter */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Cari Dokter
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik nama dokter atau username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs pl-9 pr-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pasien Selesai */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Pasien Selesai
              </span>
              <div className="w-9 h-9 rounded-none bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? '...' : monitoringData?.ringkasanFaskes?.totalPasienSelesai ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Pasien telah selesai diperiksa pada tanggal ini
              </p>
            </div>
          </div>

          {/* Card 2: Dokter Bertugas */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Dokter Aktif Bertugas
              </span>
              <div className="w-9 h-9 rounded-none bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? '...' : `${monitoringData?.ringkasanFaskes?.dokterAktifHariIni ?? 0} / ${monitoringData?.ringkasanFaskes?.totalDokter ?? 0}`}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Dokter aktif melayani pasien pada tanggal ini
              </p>
            </div>
          </div>

          {/* Card 3: Rata-rata Beban Dokter */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Rata-rata Beban / Dokter
              </span>
              <div className="w-9 h-9 rounded-none bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {isLoading ? '...' : monitoringData?.ringkasanFaskes?.rataRataPasienPerDokter ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">pasien / dokter</span>
              </div>
              <div className="mt-2">
                {getBebanBadge(monitoringData?.ringkasanFaskes?.statusBebanFaskes || 'NORMAL')}
              </div>
            </div>
          </div>

          {/* Card 4: Distribusi Shift */}
          <div className="bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Distribusi Shift Pelayanan
              </span>
              <div className="w-9 h-9 rounded-none bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">Pagi (07:00-14:00):</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5">
                  {monitoringData?.ringkasanFaskes?.shiftBreakdown?.pagi ?? 0} Pasien
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">Siang (14:00-21:00):</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5">
                  {monitoringData?.ringkasanFaskes?.shiftBreakdown?.siang ?? 0} Pasien
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">Malam (21:00-07:00):</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5">
                  {monitoringData?.ringkasanFaskes?.shiftBreakdown?.malam ?? 0} Pasien
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABEL UTAMA MONITORING BEBAN KERJA DOKTER ── */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Daftar Kinerja Beban Kerja Dokter
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian capaian pemeriksaan per dokter dan per shift pada {selectedTanggal}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 self-start sm:self-auto">
              Total Dokter: {filteredDokterList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Dokter & Nakes</th>
                  <th className="py-3 px-4">Poliklinik / Unit</th>
                  <th className="py-3 px-4 text-center bg-blue-50/40">Shift Pagi</th>
                  <th className="py-3 px-4 text-center bg-amber-50/40">Shift Siang</th>
                  <th className="py-3 px-4 text-center bg-purple-50/40">Shift Malam</th>
                  <th className="py-3 px-4 text-center font-black text-slate-900 bg-emerald-50/40">Total Selesai</th>
                  <th className="py-3 px-4 text-center">Sedang Periksa</th>
                  <th className="py-3 px-4 text-center">Antrean</th>
                  <th className="py-3 px-4 text-center">Rata-rata Waktu</th>
                  <th className="py-3 px-4 text-center">Status Beban</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500 font-medium">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      Memuat data kinerja dokter...
                    </td>
                  </tr>
                ) : filteredDokterList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500 font-medium">
                      Tidak ada data dokter ditemukan untuk kriteria filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredDokterList.map((item, idx) => {
                    return (
                      <tr
                        key={item.dokter.id}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          item.isAktifHariIni ? 'bg-white' : 'bg-slate-50/50 opacity-80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {item.dokter.namaLengkap}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{item.dokter.username} • {item.dokter.role}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-200">
                            {item.dokter.poliklinik}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-blue-50/20">
                          {item.shiftBreakdown.pagi}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-amber-50/20">
                          {item.shiftBreakdown.siang}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-purple-50/20">
                          {item.shiftBreakdown.malam}
                        </td>
                        <td className="py-3.5 px-4 text-center bg-emerald-50/30">
                          <span className="text-base font-black text-emerald-700 font-mono">
                            {item.totalSelesai}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.sedangDiperiksa > 0 ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-xs border border-blue-200">
                              {item.sedangDiperiksa}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.antre > 0 ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-mono font-bold text-xs border border-amber-200">
                              {item.antre}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {item.rataRataWaktuMenit > 0 ? (
                            <span className="font-semibold text-slate-700">
                              {item.rataRataWaktuMenit} mnt
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getBebanBadge(item.statusBebanKerja)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedDokterDetail(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors shadow-xs"
                            title="Lihat Daftar Pasien Selesai"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat Pasien ({item.totalSelesai})</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MODAL DRILLDOWN: DAFTAR PASIEN YANG DITANGANI DOKTER ── */}
        {selectedDokterDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
            <div className="bg-white border border-slate-300 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-1">
                    <UserCheck className="w-4 h-4" />
                    <span>Rekap Pasien Selesai Ditangani</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedDokterDetail.dokter.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unit / Poli: {selectedDokterDetail.dokter.poliklinik} • Tanggal: {selectedTanggal} • Total Selesai: {selectedDokterDetail.totalSelesai} Pasien
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDokterDetail(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body: Table of Patients */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {selectedDokterDetail.daftarPasienSelesai.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-medium">
                    Belum ada pasien yang selesai ditangani oleh dokter ini pada tanggal {selectedTanggal}.
                  </div>
                ) : (
                  <div className="border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Antrean</th>
                          <th className="py-2.5 px-3">No RM</th>
                          <th className="py-2.5 px-3">Nama Pasien</th>
                          <th className="py-2.5 px-3 text-center">Shift</th>
                          <th className="py-2.5 px-3 text-center">Jam Selesai</th>
                          <th className="py-2.5 px-3 text-center">Durasi</th>
                          <th className="py-2.5 px-3">Diagnosa Utama</th>
                          <th className="py-2.5 px-3 text-center">Status / Lanjut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDokterDetail.daftarPasienSelesai.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.noAntrian}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.noRM}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.namaPasien}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                                p.shift === 'Pagi'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : p.shift === 'Siang'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                Shift {p.shift}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                              {p.jamSelesai}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {p.durasiMenit ? `${p.durasiMenit} mnt` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium max-w-xs truncate" title={p.diagnosaUtama}>
                              {p.diagnosaUtama}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {p.statusKunjungan === 'MENUNGGU_FARMASI' ? 'Farmasi Obat' : p.statusKunjungan === 'MENUNGGU_KASIR' ? 'Kasir' : p.statusPulang}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total {selectedDokterDetail.daftarPasienSelesai.length} catatan pasien tercatat dalam audit trail medis.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDokterDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
