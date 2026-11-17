'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  Sliders,
  FileText,
  Building
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  jadwalNakesService,
  JadwalNakes,
  IzinCutiNakes,
  NakesOption,
  DokterBertugasItem,
  DokterBertugasResponse
} from '@/services/jadwalNakes.service';
import { useKlinikStore } from '@/store/klinik.store';
import { useAuthStore } from '@/store/auth.store';

const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'] as const;

export default function JadwalNakesAdminPage() {
  const { user } = useAuthStore();
  const { polikliniks, fetchPoliklinik } = useKlinikStore();

  const [activeTab, setActiveTab] = useState<'roster' | 'izin-cuti' | 'monitoring'>('roster');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Master Data Nakes & Poliklinik
  const [nakesList, setNakesList] = useState<NakesOption[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalNakes[]>([]);
  const [izinCutiList, setIzinCutiList] = useState<IzinCutiNakes[]>([]);

  // Filters Roster
  const [filterPoli, setFilterPoli] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters Izin Cuti
  const [filterTipeIzin, setFilterTipeIzin] = useState<string>('');
  const [filterStatusCuti, setFilterStatusCuti] = useState<string>('');

  // Monitoring Hari Ini
  const [selectedMonitoringDate, setSelectedMonitoringDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [monitoringPoli, setMonitoringPoli] = useState<string>('');
  const [monitoringData, setMonitoringData] = useState<DokterBertugasResponse | null>(null);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState<boolean>(false);

  // Modal State: Atur Roster Mingguan Nakes
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [selectedNakesForRoster, setSelectedNakesForRoster] = useState<NakesOption | null>(null);
  const [rosterFormMatrix, setRosterFormMatrix] = useState<
    Record<
      string,
      {
        enabled: boolean;
        shift: string;
        jamMulai: string;
        jamSelesai: string;
        kuotaPasien: number;
        catatan?: string;
      }
    >
  >({});
  const [isSavingRoster, setIsSavingRoster] = useState<boolean>(false);

  // Modal State: Tambah / Edit Izin Cuti
  const [isCutiModalOpen, setIsCutiModalOpen] = useState<boolean>(false);
  const [isEditCutiMode, setIsEditCutiMode] = useState<boolean>(false);
  const [selectedCutiId, setSelectedCutiId] = useState<string | null>(null);
  const [cutiFormData, setCutiFormData] = useState<{
    userId: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    tipeIzin: string;
    keterangan: string;
    penggantiId: string;
    statusPersetujuan: string;
  }>({
    userId: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    tipeIzin: 'CUTI',
    keterangan: '',
    penggantiId: '',
    statusPersetujuan: 'DISETUJUI',
  });
  const [isSavingCuti, setIsSavingCuti] = useState<boolean>(false);

  // Load Initial Data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await fetchPoliklinik();
      const [nakesData, allJadwal, allCuti] = await Promise.all([
        jadwalNakesService.getNakesOptions(),
        jadwalNakesService.getJadwalList(),
        jadwalNakesService.getIzinCutiList(),
      ]);
      setNakesList(nakesData || []);
      setJadwalList(allJadwal || []);
      setIzinCutiList(allCuti || []);
    } catch (err: any) {
      console.error('Gagal mengambil data jadwal nakes:', err);
      Swal.fire('Error', err.message || 'Gagal memuat data jadwal nakes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Set default monitoring poli saat polikliniks loaded
  useEffect(() => {
    if (polikliniks && polikliniks.length > 0 && !monitoringPoli) {
      const defaultPoli = polikliniks.find((p) => p.kodePoli === 'UMUM') || polikliniks[0];
      setMonitoringPoli(defaultPoli.id);
    }
  }, [polikliniks, monitoringPoli]);

  // Load Monitoring Data saat poli atau tanggal berubah
  const loadMonitoringData = async (poliId: string, tanggalStr: string) => {
    if (!poliId) return;
    setIsLoadingMonitoring(true);
    try {
      const data = await jadwalNakesService.getDokterBertugasByPoli(poliId, tanggalStr);
      setMonitoringData(data);
    } catch (err: any) {
      console.error('Gagal memuat data monitoring nakes:', err);
    } finally {
      setIsLoadingMonitoring(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monitoring' && monitoringPoli) {
      loadMonitoringData(monitoringPoli, selectedMonitoringDate);
    }
  }, [activeTab, monitoringPoli, selectedMonitoringDate]);

  // Map Jadwal per Nakes (UserId -> Hari -> JadwalNakes)
  const jadwalByNakesMap = useMemo(() => {
    const map = new Map<string, Record<string, JadwalNakes>>();
    for (const item of jadwalList) {
      if (!map.has(item.userId)) {
        map.set(item.userId, {});
      }
      const userObj = map.get(item.userId)!;
      userObj[item.hari] = item;
    }
    return map;
  }, [jadwalList]);

  // Filtered Nakes List for Roster
  const filteredNakes = useMemo(() => {
    return nakesList.filter((nakes) => {
      if (filterPoli && nakes.poliklinikId !== filterPoli) return false;
      if (filterRole && nakes.role !== filterRole) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNama = (nakes.namaLengkap || '').toLowerCase().includes(q);
        const matchUser = (nakes.username || '').toLowerCase().includes(q);
        const matchPoli = (nakes.poliklinik?.namaPoli || '').toLowerCase().includes(q);
        if (!matchNama && !matchUser && !matchPoli) return false;
      }
      return true;
    });
  }, [nakesList, filterPoli, filterRole, searchQuery]);

  // Filtered Izin Cuti List
  const filteredIzinCuti = useMemo(() => {
    return izinCutiList.filter((item) => {
      if (filterTipeIzin && item.tipeIzin !== filterTipeIzin) return false;
      if (filterStatusCuti && item.statusPersetujuan !== filterStatusCuti) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNama = (item.user?.namaLengkap || '').toLowerCase().includes(q);
        const matchKet = (item.keterangan || '').toLowerCase().includes(q);
        const matchPengganti = (item.pengganti?.namaLengkap || '').toLowerCase().includes(q);
        if (!matchNama && !matchKet && !matchPengganti) return false;
      }
      return true;
    });
  }, [izinCutiList, filterTipeIzin, filterStatusCuti, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalNakes = nakesList.length;
    const totalDokter = nakesList.filter((n) => n.role === 'DOKTER' || n.role === 'DOKTER_UGD').length;
    const totalPerawat = nakesList.filter((n) => n.role === 'PERAWAT').length;
    const totalCutiAktif = izinCutiList.filter((item) => {
      const today = new Date().toISOString().split('T')[0];
      const start = item.tanggalMulai.split('T')[0];
      const end = item.tanggalSelesai.split('T')[0];
      return item.statusPersetujuan === 'DISETUJUI' && start <= today && end >= today;
    }).length;
    const totalSlotJadwal = jadwalList.filter((j) => j.statusAktif).length;

    return { totalNakes, totalDokter, totalPerawat, totalCutiAktif, totalSlotJadwal };
  }, [nakesList, izinCutiList, jadwalList]);

  // ==========================================
  // HANDLERS: MODAL ATUR ROSTER
  // ==========================================
  const handleOpenRosterModal = (nakes: NakesOption) => {
    setSelectedNakesForRoster(nakes);
    const existingSchedule = jadwalByNakesMap.get(nakes.id) || {};

    const matrix: Record<string, any> = {};
    for (const h of HARI_LIST) {
      const ex = existingSchedule[h];
      if (ex && ex.statusAktif) {
        matrix[h] = {
          enabled: true,
          shift: ex.shift || 'PAGI',
          jamMulai: ex.jamMulai || '08:00',
          jamSelesai: ex.jamSelesai || '14:00',
          kuotaPasien: ex.kuotaPasien || 40,
          catatan: ex.catatan || '',
        };
      } else {
        matrix[h] = {
          enabled: false,
          shift: 'PAGI',
          jamMulai: '08:00',
          jamSelesai: '14:00',
          kuotaPasien: 40,
          catatan: '',
        };
      }
    }

    setRosterFormMatrix(matrix);
    setIsRosterModalOpen(true);
  };

  const handleApplyPreset = (type: 'weekdays' | 'full' | 'clear') => {
    setRosterFormMatrix((prev) => {
      const next = { ...prev };
      for (const h of HARI_LIST) {
        if (type === 'weekdays') {
          next[h] = {
            ...next[h],
            enabled: h !== 'SABTU' && h !== 'MINGGU',
          };
        } else if (type === 'full') {
          next[h] = {
            ...next[h],
            enabled: h !== 'MINGGU',
          };
        } else {
          next[h] = {
            ...next[h],
            enabled: false,
          };
        }
      }
      return next;
    });
  };

  const handleSaveRoster = async () => {
    if (!selectedNakesForRoster) return;
    setIsSavingRoster(true);

    try {
      const rosterPayload: any[] = [];
      for (const h of HARI_LIST) {
        const item = rosterFormMatrix[h];
        rosterPayload.push({
          hari: h,
          shift: item.shift,
          jamMulai: item.jamMulai,
          jamSelesai: item.jamSelesai,
          kuotaPasien: item.kuotaPasien,
          statusAktif: item.enabled,
          catatan: item.catatan,
        });
      }

      await jadwalNakesService.saveBulkRoster({
        userId: selectedNakesForRoster.id,
        poliklinikId: selectedNakesForRoster.poliklinikId || undefined,
        roster: rosterPayload,
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Roster dinas mingguan ${selectedNakesForRoster.namaLengkap} berhasil diperbarui.`,
        timer: 1800,
        showConfirmButton: false,
      });

      setIsRosterModalOpen(false);
      // Refresh list jadwal
      const allJadwal = await jadwalNakesService.getJadwalList();
      setJadwalList(allJadwal || []);
      if (monitoringPoli) {
        loadMonitoringData(monitoringPoli, selectedMonitoringDate);
      }
    } catch (err: any) {
      console.error('Gagal menyimpan roster:', err);
      Swal.fire('Error', err.message || 'Gagal menyimpan roster dinas', 'error');
    } finally {
      setIsSavingRoster(false);
    }
  };

  // ==========================================
  // HANDLERS: MODAL IZIN / CUTI
  // ==========================================
  const handleOpenAddCutiModal = () => {
    setIsEditCutiMode(false);
    setSelectedCutiId(null);
    setCutiFormData({
      userId: nakesList.length > 0 ? nakesList[0].id : '',
      tanggalMulai: new Date().toISOString().split('T')[0],
      tanggalSelesai: new Date().toISOString().split('T')[0],
      tipeIzin: 'CUTI',
      keterangan: '',
      penggantiId: '',
      statusPersetujuan: 'DISETUJUI',
    });
    setIsCutiModalOpen(true);
  };

  const handleOpenEditCutiModal = (item: IzinCutiNakes) => {
    setIsEditCutiMode(true);
    setSelectedCutiId(item.id);
    setCutiFormData({
      userId: item.userId,
      tanggalMulai: item.tanggalMulai.split('T')[0],
      tanggalSelesai: item.tanggalSelesai.split('T')[0],
      tipeIzin: item.tipeIzin,
      keterangan: item.keterangan || '',
      penggantiId: item.penggantiId || '',
      statusPersetujuan: item.statusPersetujuan,
    });
    setIsCutiModalOpen(true);
  };

  const handleSaveCuti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutiFormData.userId) {
      Swal.fire('Peringatan', 'Silakan pilih tenaga medis yang mengajukan izin/cuti.', 'warning');
      return;
    }
    if (cutiFormData.tanggalMulai > cutiFormData.tanggalSelesai) {
      Swal.fire('Peringatan', 'Tanggal mulai cuti tidak boleh lebih besar dari tanggal selesai.', 'warning');
      return;
    }

    setIsSavingCuti(true);
    try {
      const payload: any = {
        userId: cutiFormData.userId,
        tanggalMulai: cutiFormData.tanggalMulai,
        tanggalSelesai: cutiFormData.tanggalSelesai,
        tipeIzin: cutiFormData.tipeIzin,
        keterangan: cutiFormData.keterangan || null,
        penggantiId: cutiFormData.penggantiId || null,
        statusPersetujuan: cutiFormData.statusPersetujuan,
      };

      if (isEditCutiMode && selectedCutiId) {
        await jadwalNakesService.updateIzinCuti(selectedCutiId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: 'Data izin/cuti nakes berhasil diupdate.',
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await jadwalNakesService.createIzinCuti(payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Dicatat',
          text: 'Data izin/cuti nakes berhasil disimpan.',
          timer: 1600,
          showConfirmButton: false,
        });
      }

      setIsCutiModalOpen(false);
      const allCuti = await jadwalNakesService.getIzinCutiList();
      setIzinCutiList(allCuti || []);
      if (monitoringPoli) {
        loadMonitoringData(monitoringPoli, selectedMonitoringDate);
      }
    } catch (err: any) {
      console.error('Gagal menyimpan cuti:', err);
      Swal.fire('Error', err.message || 'Gagal menyimpan izin/cuti nakes', 'error');
    } finally {
      setIsSavingCuti(false);
    }
  };

  const handleDeleteCuti = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Izin/Cuti?',
      text: `Apakah Anda yakin ingin menghapus data cuti/izin untuk ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await jadwalNakesService.deleteIzinCuti(id);
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data izin/cuti berhasil dihapus.',
          timer: 1500,
          showConfirmButton: false,
        });
        const allCuti = await jadwalNakesService.getIzinCutiList();
        setIzinCutiList(allCuti || []);
        if (monitoringPoli) {
          loadMonitoringData(monitoringPoli, selectedMonitoringDate);
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Gagal menghapus izin/cuti', 'error');
      }
    }
  };

  // Helper badge warna tipe izin
  const getTipeIzinBadge = (tipe: string) => {
    switch (tipe) {
      case 'CUTI':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SAKIT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'IZIN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PELATIHAN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TUGAS_LUAR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Manajemen Jadwal Dinas & Cuti Nakes
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Pengaturan jadwal dinas mingguan dokter & perawat, penugasan dokter pengganti, dan pencatatan cuti/izin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/master-dokter"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition"
              title="Tambah / Kelola Master Dokter Faskes"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Kelola Master Dokter</span>
            </Link>

            <button
              onClick={() => {
                loadInitialData();
                if (monitoringPoli) loadMonitoringData(monitoringPoli, selectedMonitoringDate);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenAddCutiModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition"
            >
              <UserX className="w-4 h-4" />
              <span>+ Catat Izin / Cuti</span>
            </button>
          </div>
        </div>

        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tenaga Medis</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalNakes}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats.totalDokter} Dokter &bull; {stats.totalPerawat} Perawat
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Shift Aktif Mingguan</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{stats.totalSlotJadwal}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total penugasan aktif / minggu</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sedang Cuti / Izin</p>
              <p className="text-2xl font-bold text-rose-700 mt-0.5">{stats.totalCutiAktif}</p>
              <p className="text-xs text-slate-400 mt-0.5">Nakes berhalangan hadir hari ini</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Poliklinik Aktif</p>
              <p className="text-2xl font-bold text-indigo-800 mt-0.5">{polikliniks.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Unit layanan puskesmas</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-4 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Matriks Roster Mingguan</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
            {filteredNakes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('izin-cuti')}
          className={`py-4 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'izin-cuti'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Izin, Cuti & Pengganti</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
            {filteredIzinCuti.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`py-4 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Live Monitoring Loket</span>
        </button>
      </div>

      {/* TAB CONTENT 1: MATRIKS ROSTER MINGGUAN */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 p-6 space-y-5">
          {/* FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nakes / username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Poli */}
              <select
                value={filterPoli}
                onChange={(e) => setFilterPoli(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Poliklinik</option>
                {polikliniks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPoli} ({p.kodePoli})
                  </option>
                ))}
              </select>

              {/* Filter Role */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Profesi</option>
                <option value="DOKTER">Dokter</option>
                <option value="DOKTER_UGD">Dokter UGD</option>
                <option value="PERAWAT">Perawat</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredNakes.length} tenaga medis
            </div>
          </div>

          {/* TABLE GRID ROSTER MINGGUAN */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 min-w-[220px]">Tenaga Medis</th>
                  <th className="py-3.5 px-3 min-w-[130px]">Poli & Profesi</th>
                  {HARI_LIST.map((h) => (
                    <th key={h} className="py-3.5 px-2 text-center min-w-[110px]">
                      {h}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center min-w-[110px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Memuat matriks roster dinas...
                    </td>
                  </tr>
                ) : filteredNakes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      Tidak ada tenaga medis yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredNakes.map((nakes) => {
                    const schedules = jadwalByNakesMap.get(nakes.id) || {};

                    return (
                      <tr key={nakes.id} className="hover:bg-slate-50 transition">
                        {/* Nakes Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{nakes.namaLengkap}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">@{nakes.username}</div>
                        </td>

                        {/* Poli & Role */}
                        <td className="py-3.5 px-3">
                          <div className="text-xs font-medium text-slate-700">
                            {nakes.poliklinik?.namaPoli || 'Lintas Unit'}
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md mt-1 ${
                              nakes.role === 'DOKTER' || nakes.role === 'DOKTER_UGD'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {nakes.role}
                          </span>
                        </td>

                        {/* 7 Kolom Hari */}
                        {HARI_LIST.map((hari) => {
                          const sched = schedules[hari];
                          const isAktif = sched && sched.statusAktif;

                          return (
                            <td key={hari} className="py-2.5 px-2 text-center">
                              {isAktif ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 transition hover:shadow-xs">
                                  <div className="text-[10px] font-bold text-emerald-800 tracking-wide">
                                    {sched.shift}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                                    {sched.jamMulai} - {sched.jamSelesai}
                                  </div>
                                  <div className="text-[9px] text-slate-500 mt-0.5">
                                    Kuota: {sched.kuotaPasien}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-2 text-slate-300 text-xs font-light">
                                  &bull; Libur &bull;
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenRosterModal(nakes)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                            title="Atur Roster 7 Hari"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Atur Roster</span>
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
      )}

      {/* TAB CONTENT 2: IZIN, CUTI & PENGGANTI */}
      {activeTab === 'izin-cuti' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 p-6 space-y-5">
          {/* FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nakes / keterangan / pengganti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Tipe Izin */}
              <select
                value={filterTipeIzin}
                onChange={(e) => setFilterTipeIzin(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Tipe Izin</option>
                <option value="CUTI">Cuti</option>
                <option value="SAKIT">Sakit</option>
                <option value="IZIN">Izin</option>
                <option value="PELATIHAN">Pelatihan</option>
                <option value="TUGAS_LUAR">Tugas Luar</option>
              </select>

              {/* Filter Status Persetujuan */}
              <select
                value={filterStatusCuti}
                onChange={(e) => setFilterStatusCuti(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="PENDING">Pending</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddCutiModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Izin / Cuti</span>
            </button>
          </div>

          {/* TABLE IZIN CUTI */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 min-w-[180px]">Tenaga Medis</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Tipe & Periode</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Alasan / Keterangan</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nakes Pengganti</th>
                  <th className="py-3.5 px-3 text-center min-w-[120px]">Persetujuan</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Memuat daftar permohonan izin & cuti...
                    </td>
                  </tr>
                ) : filteredIzinCuti.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Belum ada data izin/cuti nakes yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredIzinCuti.map((item) => {
                    const tMulai = item.tanggalMulai.split('T')[0];
                    const tSelesai = item.tanggalSelesai.split('T')[0];

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        {/* Nakes */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {item.user?.namaLengkap || 'Nakes'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.user?.poliklinik?.namaPoli || item.user?.role}
                          </div>
                        </td>

                        {/* Periode & Tipe */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border ${getTipeIzinBadge(
                              item.tipeIzin
                            )}`}
                          >
                            {item.tipeIzin}
                          </span>
                          <div className="text-xs font-semibold text-slate-700 mt-1.5">
                            {tMulai === tSelesai ? tMulai : `${tMulai} s.d ${tSelesai}`}
                          </div>
                        </td>

                        {/* Keterangan */}
                        <td className="py-3.5 px-4">
                          <div className="text-sm text-slate-700">
                            {item.keterangan || <span className="text-slate-400 italic">Tidak ada catatan</span>}
                          </div>
                          {item.catatanPersetujuan && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                              Catatan: {item.catatanPersetujuan}
                            </div>
                          )}
                        </td>

                        {/* Pengganti */}
                        <td className="py-3.5 px-4">
                          {item.pengganti ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-semibold">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{item.pengganti.namaLengkap}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada pengganti</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                              item.statusPersetujuan === 'DISETUJUI'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : item.statusPersetujuan === 'PENDING'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.statusPersetujuan}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditCutiModal(item)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Data Cuti"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCuti(item.id, item.user?.namaLengkap || '')}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Izin/Cuti"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LIVE MONITORING BERTUGAS HARI INI */}
      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Simulasi Tampilan Loket Pendaftaran Pasien
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tampilan status real-time dokter bertugas yang akan muncul di dropdown pendaftaran antrean faskes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Pilih Tanggal:
                </label>
                <input
                  type="date"
                  value={selectedMonitoringDate}
                  onChange={(e) => setSelectedMonitoringDate(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Pilih Poliklinik:
                </label>
                <select
                  value={monitoringPoli}
                  onChange={(e) => setMonitoringPoli(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {polikliniks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPoli}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* HASIL MONITORING DOKTER DI POLI TERPILIH */}
          {isLoadingMonitoring ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Menghitung status ketersediaan dokter...
            </div>
          ) : monitoringData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    Dokter Poliklinik &bull; Hari {monitoringData.hari} ({monitoringData.tanggal})
                  </h4>
                  <p className="text-xs text-slate-500">
                    {monitoringData.totalBertugas} dari {monitoringData.totalDokter} dokter berstatus bertugas hari ini.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monitoringData.dokters.map((doc: DokterBertugasItem) => {
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-xl border p-4.5 transition relative ${
                        doc.isBertugasHariIni
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-slate-800">{doc.namaLengkap}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">@{doc.username}</div>
                          {doc.tenagaMedis?.nomorSip && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              SIP: {doc.tenagaMedis.nomorSip}
                            </div>
                          )}
                        </div>

                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            doc.isBertugasHariIni
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {doc.isBertugasHariIni ? 'BERTUGAS' : 'TIDAK BERTUGAS'}
                        </span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{doc.statusKeterangan}</span>
                        </div>

                        {doc.jadwalDetail && (
                          <div className="text-[11px] text-slate-500">
                            Shift {doc.jadwalDetail.shift} &bull; Kuota: {doc.jadwalDetail.kuotaPasien} pasien
                          </div>
                        )}

                        {doc.cutiDetail && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                            <strong>Alasan:</strong> {doc.cutiDetail.keterangan || doc.cutiDetail.tipeIzin}
                            {doc.cutiDetail.pengganti && (
                              <div className="mt-1 text-blue-700 font-medium">
                                Pengganti: {doc.cutiDetail.pengganti.namaLengkap}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">Silakan pilih poliklinik untuk melihat status dokter.</div>
          )}
        </div>
      )}

      {/* MODAL 1: ATUR ROSTER MINGGUAN (7 HARI MATRIX) */}
      {isRosterModalOpen && selectedNakesForRoster && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Atur Roster Mingguan &bull; {selectedNakesForRoster.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unit: {selectedNakesForRoster.poliklinik?.namaPoli || 'Lintas Unit'} &bull; Profesi: {selectedNakesForRoster.role}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Presets Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preset Cepat Hari Bertugas:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('weekdays')}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                  >
                    Senin - Jumat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('full')}
                    className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                  >
                    Senin - Sabtu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('clear')}
                    className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
                  >
                    Kosongkan Semua
                  </button>
                </div>
              </div>

              {/* 7 Hari Checklist Rows */}
              <div className="space-y-3">
                {HARI_LIST.map((hari) => {
                  const item = rosterFormMatrix[hari] || {
                    enabled: false,
                    shift: 'PAGI',
                    jamMulai: '08:00',
                    jamSelesai: '14:00',
                    kuotaPasien: 40,
                    catatan: '',
                  };

                  return (
                    <div
                      key={hari}
                      className={`p-3.5 rounded-xl border transition ${
                        item.enabled
                          ? 'bg-blue-50/40 border-blue-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Checkbox & Hari */}
                        <label className="flex items-center gap-3 cursor-pointer sm:min-w-[140px]">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRosterFormMatrix((prev) => ({
                                ...prev,
                                [hari]: { ...prev[hari], enabled: checked },
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-bold ${item.enabled ? 'text-blue-900' : 'text-slate-600'}`}>
                            {hari}
                          </span>
                        </label>

                        {/* Controls (Shift, Jam, Kuota) */}
                        {item.enabled ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                                Shift
                              </label>
                              <select
                                value={item.shift}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRosterFormMatrix((prev) => ({
                                    ...prev,
                                    [hari]: { ...prev[hari], shift: val },
                                  }));
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              >
                                <option value="PAGI">Pagi</option>
                                <option value="SIANG">Siang</option>
                                <option value="MALAM">Malam</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                                Jam Mulai
                              </label>
                              <input
                                type="time"
                                value={item.jamMulai}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRosterFormMatrix((prev) => ({
                                    ...prev,
                                    [hari]: { ...prev[hari], jamMulai: val },
                                  }));
                                }}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                                Jam Selesai
                              </label>
                              <input
                                type="time"
                                value={item.jamSelesai}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRosterFormMatrix((prev) => ({
                                    ...prev,
                                    [hari]: { ...prev[hari], jamSelesai: val },
                                  }));
                                }}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                                Kuota Pasien
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="200"
                                value={item.kuotaPasien}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setRosterFormMatrix((prev) => ({
                                    ...prev,
                                    [hari]: { ...prev[hari], kuotaPasien: val },
                                  }));
                                }}
                                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-1">Tidak Bertugas (Libur)</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRoster}
                disabled={isSavingRoster}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSavingRoster && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Simpan Jadwal Roster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT / EDIT IZIN CUTI NAKES */}
      {isCutiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <form onSubmit={handleSaveCuti}>
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-600 text-white rounded-xl">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {isEditCutiMode ? 'Edit Izin / Cuti Tenaga Medis' : 'Catat Izin / Cuti Tenaga Medis'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pengajuan cuti, sakit, izin, atau penugasan luar dinas puskesmas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCutiModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Pilih Nakes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenaga Medis yang Berhalangan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cutiFormData.userId}
                    onChange={(e) => setCutiFormData((prev) => ({ ...prev, userId: e.target.value }))}
                    disabled={isEditCutiMode}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    required
                  >
                    <option value="">Pilih Tenaga Medis...</option>
                    {nakesList.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.namaLengkap} ({n.poliklinik?.namaPoli || n.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipe Izin & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipe Izin / Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={cutiFormData.tipeIzin}
                      onChange={(e) => setCutiFormData((prev) => ({ ...prev, tipeIzin: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="CUTI">Cuti Tahunan</option>
                      <option value="SAKIT">Sakit</option>
                      <option value="IZIN">Izin Pribadi</option>
                      <option value="PELATIHAN">Pelatihan / Workshop</option>
                      <option value="TUGAS_LUAR">Tugas Luar Faskes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Persetujuan
                    </label>
                    <select
                      value={cutiFormData.statusPersetujuan}
                      onChange={(e) =>
                        setCutiFormData((prev) => ({ ...prev, statusPersetujuan: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="DISETUJUI">Disetujui</option>
                      <option value="PENDING">Pending (Menunggu)</option>
                      <option value="DITOLAK">Ditolak</option>
                    </select>
                  </div>
                </div>

                {/* Tanggal Mulai & Tanggal Selesai */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={cutiFormData.tanggalMulai}
                      onChange={(e) => setCutiFormData((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={cutiFormData.tanggalSelesai}
                      onChange={(e) => setCutiFormData((prev) => ({ ...prev, tanggalSelesai: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Pilih Dokter / Nakes Pengganti */}
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Dokter / Tenaga Medis Pengganti (Opsional):
                  </label>
                  <p className="text-[11px] text-blue-700 mb-2">
                    Jika diisi, nakes pengganti otomatis akan tersedia di loket pendaftaran menggantikan nakes yang cuti.
                  </p>
                  <select
                    value={cutiFormData.penggantiId}
                    onChange={(e) => setCutiFormData((prev) => ({ ...prev, penggantiId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Tanpa Tenaga Medis Pengganti --</option>
                    {nakesList
                      .filter((n) => n.id !== cutiFormData.userId)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.namaLengkap} ({n.poliklinik?.namaPoli || n.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan / Keterangan Cuti
                  </label>
                  <textarea
                    rows={2}
                    value={cutiFormData.keterangan}
                    onChange={(e) => setCutiFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
                    placeholder="Contoh: Mengikuti Bimtek Rekam Medis Elektronik di Dinkes..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsCutiModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCuti}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSavingCuti && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isEditCutiMode ? 'Simpan Perubahan' : 'Catat Izin / Cuti'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
