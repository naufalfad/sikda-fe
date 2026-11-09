"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DollarSign,
  Users,
  Stethoscope,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Settings,
  ChevronRight,
  Eye,
  Plus,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  X,
  Sliders,
  Wallet
} from 'lucide-react';
import { remunerasiService } from '@/services/remunerasi.service';
import { dokterService } from '@/services/dokter.service';
import { useAuthStore } from '@/store/auth.store';
import {
  RekapDokterItem,
  RekapPerawatItem,
  PresensiNakesItem,
  MasterTarifFee,
  DashboardSummaryResponse
} from '@/types/remunerasi.types';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

export default function RemunerasiAdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rekap-dokter' | 'rekap-perawat' | 'presensi' | 'tarif'>('rekap-dokter');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [tanggalAwal, setTanggalAwal] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [tanggalAkhir, setTanggalAkhir] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [rekapDokterData, setRekapDokterData] = useState<{
    ringkasan: any;
    dokterList: RekapDokterItem[];
  } | null>(null);
  const [rekapPerawatData, setRekapPerawatData] = useState<{
    ringkasan: any;
    perawatList: RekapPerawatItem[];
  } | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiNakesItem[]>([]);
  const [masterTarif, setMasterTarif] = useState<MasterTarifFee>({
    feeKehadiranDokter: 150000,
    feeKehadiranPerawat: 75000,
    feePerPasienDokter: 15000,
    feePerTindakanDokter: 20000,
    statusAktif: true,
  });

  // Modal Detail Pasien Dokter
  const [selectedDokterDetail, setSelectedDokterDetail] = useState<RekapDokterItem | null>(null);
  const [selectedPerawatDetail, setSelectedPerawatDetail] = useState<RekapPerawatItem | null>(null);

  // Modal Input Presensi Manual
  const [isPresensiModalOpen, setIsPresensiModalOpen] = useState<boolean>(false);
  const [allNakesList, setAllNakesList] = useState<any[]>([]);
  const [formPresensi, setFormPresensi] = useState<{
    userId: string;
    tanggal: string;
    shift: string;
    statusKehadiran: string;
    catatan: string;
    nominalFee: string;
  }>({
    userId: '',
    tanggal: new Date().toISOString().split('T')[0],
    shift: 'PAGI',
    statusKehadiran: 'HADIR',
    catatan: '',
    nominalFee: '',
  });

  // Modal Cetak Slip
  const [printNakes, setPrintNakes] = useState<{
    tipe: 'DOKTER' | 'PERAWAT';
    data: RekapDokterItem | RekapPerawatItem;
  } | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

  const handlePrintSlip = useReactToPrint({
    contentRef: printSlipRef,
    documentTitle: `Slip_Remunerasi_${printNakes?.tipe}_${new Date().toISOString().split('T')[0]}`,
  });

  // Fetch Semua Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, dokterRes, perawatRes, presensiRes, tarifRes] = await Promise.all([
        remunerasiService.getDashboardSummary(),
        remunerasiService.getRekapDokter({ tanggalAwal, tanggalAkhir }),
        remunerasiService.getRekapPerawat({ tanggalAwal, tanggalAkhir }),
        remunerasiService.getPresensiList({ tanggalAwal, tanggalAkhir }),
        remunerasiService.getMasterTarif(),
      ]);

      setDashboardData(summaryRes);
      setRekapDokterData(dokterRes);
      setRekapPerawatData(perawatRes);
      setPresensiList(presensiRes || []);
      if (tarifRes) setMasterTarif(tarifRes);
    } catch (err: any) {
      console.error('Gagal memuat data remunerasi:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: err?.response?.data?.message || 'Terjadi kesalahan saat memuat data remunerasi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tanggalAwal, tanggalAkhir]);

  // Fetch nakes for manual attendance
  const openInputPresensiModal = async () => {
    try {
      const dokters = await dokterService.getAllDokter();
      setAllNakesList(dokters || []);
      setIsPresensiModalOpen(true);
    } catch (e) {
      console.error(e);
      setIsPresensiModalOpen(true);
    }
  };

  // Submit Presensi Manual
  const handleSavePresensi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPresensi.userId) {
      Swal.fire('Peringatan', 'Silakan pilih tenaga medis!', 'warning');
      return;
    }
    try {
      await remunerasiService.adminInputPresensi({
        userId: formPresensi.userId,
        tanggal: formPresensi.tanggal,
        shift: formPresensi.shift,
        statusKehadiran: formPresensi.statusKehadiran,
        catatan: formPresensi.catatan,
        nominalFee: formPresensi.nominalFee ? Number(formPresensi.nominalFee) : undefined,
      });
      Swal.fire('Berhasil', 'Presensi tenaga medis berhasil disimpan', 'success');
      setIsPresensiModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal', err?.response?.data?.message || 'Gagal menyimpan presensi', 'error');
    }
  };

  // Simpan Master Tarif
  const handleSaveTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await remunerasiService.updateMasterTarif(masterTarif);
      Swal.fire('Berhasil', 'Pengaturan tarif remunerasi berhasil diperbarui!', 'success');
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal', err?.response?.data?.message || 'Gagal memperbarui tarif', 'error');
    }
  };

  // Sync Kunjungan Lampau
  const handleSyncKunjungan = async () => {
    const confirm = await Swal.fire({
      title: 'Sinkronisasi Fee Pasien?',
      text: 'Sistem akan memeriksa semua kunjungan pasien selesai pada periode ini dan mencatatkan fee penanganan ke dokter yang bertugas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sinkronkan',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        Swal.showLoading();
        const res = await remunerasiService.syncFeeDokter({ tanggalAwal, tanggalAkhir });
        Swal.fire('Berhasil', `Disinkronkan ${res.data?.totalDisinkronkan || 0} kunjungan pasien.`, 'success');
        fetchData();
      } catch (err: any) {
        Swal.fire('Gagal', err?.response?.data?.message || 'Gagal sinkronisasi fee', 'error');
      }
    }
  };

  // Tandai Dibayar
  const handleBayarFee = async (presensiIds: string[], feeDokterIds: string[], namaNakes: string) => {
    const totalCount = presensiIds.length + feeDokterIds.length;
    if (totalCount === 0) {
      Swal.fire('Info', 'Semua fee nakes ini sudah berstatus LUNAS.', 'info');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Konfirmasi Pembayaran Fee?',
      text: `Tandai ${totalCount} transaksi fee milik ${namaNakes} sebagai DIBAYAR/LUNAS?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tandai Lunas',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await remunerasiService.bayarFeeNakes({ presensiIds, feeDokterIds });
        Swal.fire('Berhasil', 'Status pembayaran fee berhasil ditandai Lunas!', 'success');
        fetchData();
        if (selectedDokterDetail) setSelectedDokterDetail(null);
        if (selectedPerawatDetail) setSelectedPerawatDetail(null);
      } catch (err: any) {
        Swal.fire('Gagal', err?.response?.data?.message || 'Gagal memperbarui status bayar', 'error');
      }
    }
  };

  // Filter dokter berdasarkan search
  const filteredDokter = useMemo(() => {
    if (!rekapDokterData?.dokterList) return [];
    if (!searchQuery.trim()) return rekapDokterData.dokterList;
    const q = searchQuery.toLowerCase();
    return rekapDokterData.dokterList.filter(
      d =>
        d.dokter.namaLengkap?.toLowerCase().includes(q) ||
        d.dokter.username?.toLowerCase().includes(q) ||
        d.dokter.poliklinik?.namaPoli?.toLowerCase().includes(q)
    );
  }, [rekapDokterData, searchQuery]);

  // Filter perawat berdasarkan search
  const filteredPerawat = useMemo(() => {
    if (!rekapPerawatData?.perawatList) return [];
    if (!searchQuery.trim()) return rekapPerawatData.perawatList;
    const q = searchQuery.toLowerCase();
    return rekapPerawatData.perawatList.filter(
      p =>
        p.perawat.namaLengkap?.toLowerCase().includes(q) ||
        p.perawat.username?.toLowerCase().includes(q)
    );
  }, [rekapPerawatData, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Sistem Informasi Manajemen Remunerasi Faskes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Doctor Fee & Fee Perawat
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            Perhitungan transparan jasa medis: <strong>Dokter</strong> (Kehadiran shift & Penanganan pasien), dan <strong>Perawat</strong> (Kehadiran shift saja).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={openInputPresensiModal}
            className="flex items-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Input Presensi
          </button>
          <button
            onClick={handleSyncKunjungan}
            className="flex items-center px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 border border-white/20"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Sinkron Pasien
          </button>
        </div>
      </div>

      {/* KPI & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Grand Remunerasi */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Remunerasi Nakes</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">
              Rp {(dashboardData?.metrik?.grandTotalRemunerasi || 0).toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-blue-600 font-medium mt-0.5">Akumulasi Bulan Berjalan</div>
          </div>
        </div>

        {/* Doctor Fee */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Doctor Fee</div>
            <div className="text-xl font-extrabold text-indigo-900 mt-0.5">
              Rp {(dashboardData?.metrik?.totalFeeDokter || 0).toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Hadir: Rp {(dashboardData?.metrik?.totalFeeDokterKehadiran || 0).toLocaleString('id-ID')} | Pasien: Rp {(dashboardData?.metrik?.totalFeeDokterPenanganan || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Fee Perawat */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Fee Perawat</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">
              Rp {(dashboardData?.metrik?.totalFeePerawat || 0).toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">
              {dashboardData?.metrik?.totalShiftPerawatHadir || 0} Shift Kehadiran (Flat)
            </div>
          </div>
        </div>

        {/* Pasien Dilayani */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pasien Dilayani Dokter</div>
            <div className="text-xl font-extrabold text-purple-900 mt-0.5">
              {dashboardData?.metrik?.totalPasienDitangani || 0} Pasien
            </div>
            <div className="text-xs text-purple-600 font-medium mt-0.5">
              Tarif: Rp {(masterTarif.feePerPasienDokter || 15000).toLocaleString('id-ID')} / Pasien
            </div>
          </div>
        </div>
      </div>

      {/* Bar Filter & Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('rekap-dokter')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'rekap-dokter'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Doctor Fee ({rekapDokterData?.dokterList?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('rekap-perawat')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'rekap-perawat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Fee Perawat ({rekapPerawatData?.perawatList?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('presensi')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'presensi'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Presensi Nakes ({presensiList.length})
            </button>

            <button
              onClick={() => setActiveTab('tarif')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'tarif'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Master Tarif Jasa & Fee
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>

        {/* Filter Bar (Tanggal & Search) */}
        {activeTab !== 'tarif' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Periode:</span>
                <input
                  type="date"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                  className="bg-transparent text-gray-800 text-xs font-semibold focus:outline-none"
                />
                <span className="text-gray-400 text-xs">s/d</span>
                <input
                  type="date"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                  className="bg-transparent text-gray-800 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama tenaga medis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* CONTENT TAB 1: DOCTOR FEE (KEHADIRAN + PENANGANAN PASIEN) */}
      {activeTab === 'rekap-dokter' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <Stethoscope className="w-5 h-5 text-blue-600 mr-2" />
                Daftar Perolehan Doctor Fee
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Formula: (Jumlah Kehadiran × Rp {masterTarif.feeKehadiranDokter.toLocaleString('id-ID')}) + (Jumlah Pasien Ditangani × Rp {masterTarif.feePerPasienDokter.toLocaleString('id-ID')})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-500">Grand Total Fee Dokter:</span>
              <div className="text-lg font-black text-blue-700">
                Rp {(rekapDokterData?.ringkasan?.grandTotalFeeDokter || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Dokter & Poli</th>
                  <th className="px-6 py-3.5 text-center">Kehadiran (Shift)</th>
                  <th className="px-6 py-3.5 text-center">Pasien Ditangani</th>
                  <th className="px-6 py-3.5 text-right">Fee Kehadiran</th>
                  <th className="px-6 py-3.5 text-right">Fee Penanganan</th>
                  <th className="px-6 py-3.5 text-right font-black text-blue-900">Total Doctor Fee</th>
                  <th className="px-6 py-3.5 text-center">Status Bayar</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="inline-flex items-center space-x-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Memuat rincian fee dokter...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDokter.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      Tidak ada data dokter ditemukan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredDokter.map((item) => {
                    const isAllPaid = item.rekap.totalBelumDibayar === 0 && item.rekap.totalFeeKumulatif > 0;
                    const isZero = item.rekap.totalFeeKumulatif === 0;

                    return (
                      <tr key={item.dokter.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                              {item.dokter.namaLengkap ? item.dokter.namaLengkap[0] : 'D'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{item.dokter.namaLengkap || item.dokter.username}</div>
                              <div className="text-xs text-blue-600">{item.dokter.poliklinik?.namaPoli || 'Poli Umum'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {item.kehadiran.totalHadir} Shift
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {item.penangananPasien.totalPasien} Pasien
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                          Rp {item.rekap.totalFeeKehadiran.toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-purple-700">
                          Rp {item.rekap.totalFeePenanganan.toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-right font-extrabold text-blue-900 text-base">
                          Rp {item.rekap.totalFeeKumulatif.toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isZero ? (
                            <span className="text-xs text-gray-400 font-medium">-</span>
                          ) : isAllPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending (Rp {item.rekap.totalBelumDibayar.toLocaleString('id-ID')})
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedDokterDetail(item)}
                              title="Lihat Daftar Pasien & Presensi"
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setPrintNakes({ tipe: 'DOKTER', data: item });
                                setTimeout(() => handlePrintSlip(), 300);
                              }}
                              title="Cetak Slip Doctor Fee"
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isZero && !isAllPaid && (
                              <button
                                onClick={() => {
                                  const presensiIds = item.kehadiran.daftarPresensi.filter(p => p.statusPembayaran === 'PENDING').map(p => p.id);
                                  const feeIds = item.penangananPasien.daftarPasien.filter(l => l.statusPembayaran === 'PENDING').map(l => l.id);
                                  handleBayarFee(presensiIds, feeIds, item.dokter.namaLengkap || item.dokter.username);
                                }}
                                title="Tandai Sudah Dibayar (Lunas)"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
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

      {/* CONTENT TAB 2: FEE PERAWAT (KEHADIRAN SAJA!) */}
      {activeTab === 'rekap-perawat' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <Users className="w-5 h-5 text-emerald-600 mr-2" />
                Daftar Perolehan Fee Perawat
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Formula: (Jumlah Kehadiran Shift × Rp {masterTarif.feeKehadiranPerawat.toLocaleString('id-ID')}) — <em>Sesuai aturan: Fee Perawat dihitung dari kehadiran saja.</em>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-500">Grand Total Fee Perawat:</span>
              <div className="text-lg font-black text-emerald-700">
                Rp {(rekapPerawatData?.ringkasan?.grandTotalFeePerawat || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Perawat</th>
                  <th className="px-6 py-3.5 text-center">Kehadiran (Shift)</th>
                  <th className="px-6 py-3.5 text-center">Tarif Per Shift</th>
                  <th className="px-6 py-3.5 text-right font-black text-emerald-900">Total Fee Kehadiran</th>
                  <th className="px-6 py-3.5 text-center">Status Bayar</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="inline-flex items-center space-x-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Memuat rincian fee perawat...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPerawat.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Tidak ada data perawat ditemukan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredPerawat.map((item) => {
                    const isAllPaid = item.rekap.totalBelumDibayar === 0 && item.rekap.totalFeeKumulatif > 0;
                    const isZero = item.rekap.totalFeeKumulatif === 0;

                    return (
                      <tr key={item.perawat.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                              {item.perawat.namaLengkap ? item.perawat.namaLengkap[0] : 'P'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{item.perawat.namaLengkap || item.perawat.username}</div>
                              <div className="text-xs text-emerald-600">Tenaga Keperawatan / Skrining</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {item.kehadiran.totalHadir} Shift
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                          Rp {masterTarif.feeKehadiranPerawat.toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-right font-extrabold text-emerald-900 text-base">
                          Rp {item.rekap.totalFeeKumulatif.toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isZero ? (
                            <span className="text-xs text-gray-400 font-medium">-</span>
                          ) : isAllPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending (Rp {item.rekap.totalBelumDibayar.toLocaleString('id-ID')})
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedPerawatDetail(item)}
                              title="Lihat Riwayat Presensi"
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setPrintNakes({ tipe: 'PERAWAT', data: item });
                                setTimeout(() => handlePrintSlip(), 300);
                              }}
                              title="Cetak Slip Fee Perawat"
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isZero && !isAllPaid && (
                              <button
                                onClick={() => {
                                  const presensiIds = item.kehadiran.daftarPresensi.filter(p => p.statusPembayaran === 'PENDING').map(p => p.id);
                                  handleBayarFee(presensiIds, [], item.perawat.namaLengkap || item.perawat.username);
                                }}
                                title="Tandai Sudah Dibayar (Lunas)"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
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

      {/* CONTENT TAB 3: LOG PRESENSI HARIAN NAKES */}
      {activeTab === 'presensi' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center">
              <UserCheck className="w-5 h-5 text-blue-600 mr-2" />
              Riwayat Presensi & Absensi Tenaga Medis
            </h2>
            <button
              onClick={openInputPresensiModal}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Input Presensi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Tenaga Medis</th>
                  <th className="px-6 py-3.5">Profesi</th>
                  <th className="px-6 py-3.5 text-center">Shift</th>
                  <th className="px-6 py-3.5 text-center">Jam Masuk</th>
                  <th className="px-6 py-3.5 text-center">Kehadiran</th>
                  <th className="px-6 py-3.5 text-right">Fee Kehadiran</th>
                  <th className="px-6 py-3.5 text-center">Status Bayar</th>
                  <th className="px-6 py-3.5 text-center">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {presensiList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      Belum ada data presensi tercatat untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  presensiList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        {new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-800">
                        {p.user?.namaLengkap || p.user?.username || 'Nakes'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.profesi === 'DOKTER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.profesi}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-gray-700">
                        {p.shift}
                      </td>
                      <td className="px-6 py-3.5 text-center text-xs text-gray-500">
                        {p.jamMasuk ? new Date(p.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.statusKehadiran === 'HADIR' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.statusKehadiran}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-extrabold text-gray-900">
                        Rp {p.nominalFee.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.statusPembayaran === 'DIBAYAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.statusPembayaran === 'DIBAYAR' ? 'LUNAS' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-500 italic max-w-xs truncate">
                        {p.catatan || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT TAB 4: MASTER TARIF FEE & REMUNERASI */}
      {activeTab === 'tarif' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-3xl">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 text-blue-600 mr-2" />
              Pengaturan Master Tarif Jasa & Remunerasi Nakes
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Atur besaran nominal kompensasi fee kehadiran dokter, fee penanganan pasien, dan fee kehadiran perawat per faskes.
            </p>
          </div>

          <form onSubmit={handleSaveTarif} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fee Kehadiran Dokter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Stethoscope className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Fee Kehadiran Dokter (Per Shift)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                  <input
                    type="number"
                    value={masterTarif.feeKehadiranDokter}
                    onChange={(e) => setMasterTarif({ ...masterTarif, feeKehadiranDokter: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400">Nominal dasar kompensasi kehadiran dokter per shift bertugas.</p>
              </div>

              {/* Fee Penanganan Pasien Dokter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Fee Penanganan Pasien Dokter (Per Pasien)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                  <input
                    type="number"
                    value={masterTarif.feePerPasienDokter}
                    onChange={(e) => setMasterTarif({ ...masterTarif, feePerPasienDokter: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400">Insentif per pasien yang diperiksa dan diselesaikan oleh dokter.</p>
              </div>

              {/* Fee Kehadiran Perawat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Fee Kehadiran Perawat (Per Shift)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                  <input
                    type="number"
                    value={masterTarif.feeKehadiranPerawat}
                    onChange={(e) => setMasterTarif({ ...masterTarif, feeKehadiranPerawat: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400">Fee kehadiran flat per shift (Perawat hanya fee kehadiran saja).</p>
              </div>

              {/* Fee Tambahan Tindakan Medis */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Fee Tindakan Medis Dokter (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                  <input
                    type="number"
                    value={masterTarif.feePerTindakanDokter || 20000}
                    onChange={(e) => setMasterTarif({ ...masterTarif, feePerTindakanDokter: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-400">Kompensasi jika dokter melakukan tindakan medis minor.</p>
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Catatan / Dasar SK Direktur / Peraturan Faskes
              </label>
              <textarea
                rows={3}
                value={masterTarif.keterangan || ''}
                onChange={(e) => setMasterTarif({ ...masterTarif, keterangan: e.target.value })}
                placeholder="Contoh: Berdasarkan SK Kepala Puskesmas No. 12/2026 tentang Remunerasi Tenaga Kesehatan..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                Simpan Perubahan Tarif
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DETAIL PASIEN & PRESENSI DOKTER */}
      {selectedDokterDetail && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Rincian Kinerja & Fee: {selectedDokterDetail.dokter.namaLengkap}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {selectedDokterDetail.dokter.poliklinik?.namaPoli || 'Poli'} • Total Fee: Rp {selectedDokterDetail.rekap.totalFeeKumulatif.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDokterDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Ringkasan Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-600 font-semibold uppercase">Fee Kehadiran ({selectedDokterDetail.kehadiran.totalHadir} Shift)</div>
                  <div className="text-lg font-black text-blue-900 mt-1">
                    Rp {selectedDokterDetail.rekap.totalFeeKehadiran.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-600 font-semibold uppercase">Fee Penanganan ({selectedDokterDetail.penangananPasien.totalPasien} Pasien)</div>
                  <div className="text-lg font-black text-purple-900 mt-1">
                    Rp {selectedDokterDetail.rekap.totalFeePenanganan.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-600 font-semibold uppercase">Total Remunerasi Dokter</div>
                  <div className="text-lg font-black text-emerald-900 mt-1">
                    Rp {selectedDokterDetail.rekap.totalFeeKumulatif.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Daftar Pasien yang Ditangani */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <Activity className="w-4 h-4 text-purple-600 mr-2" />
                  Daftar Pasien yang Ditangani ({selectedDokterDetail.penangananPasien.totalPasien})
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5">Waktu Pelayanan</th>
                        <th className="px-4 py-2.5">Nama Pasien</th>
                        <th className="px-4 py-2.5">No RM</th>
                        <th className="px-4 py-2.5">Layanan</th>
                        <th className="px-4 py-2.5 text-right">Fee Dokter</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedDokterDetail.penangananPasien.daftarPasien.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">
                            Belum ada pasien yang diselesaikan pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        selectedDokterDetail.penangananPasien.daftarPasien.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-600">
                              {new Date(p.tanggalPelayanan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}{' '}
                              {new Date(p.tanggalPelayanan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-2 font-bold text-gray-900">{p.namaPasien}</td>
                            <td className="px-4 py-2 text-gray-500">{p.noRM || '-'}</td>
                            <td className="px-4 py-2 text-purple-700 font-medium">{p.jenisLayanan}</td>
                            <td className="px-4 py-2 text-right font-extrabold text-gray-900">
                              Rp {p.nominalFee.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.statusPembayaran === 'DIBAYAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.statusPembayaran === 'DIBAYAR' ? 'LUNAS' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daftar Presensi Shift */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <UserCheck className="w-4 h-4 text-blue-600 mr-2" />
                  Riwayat Presensi Shift ({selectedDokterDetail.kehadiran.totalHadir})
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5">Tanggal</th>
                        <th className="px-4 py-2.5 text-center">Shift</th>
                        <th className="px-4 py-2.5 text-center">Jam Masuk</th>
                        <th className="px-4 py-2.5 text-center">Kehadiran</th>
                        <th className="px-4 py-2.5 text-right">Fee Kehadiran</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedDokterDetail.kehadiran.daftarPresensi.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">
                            Belum ada riwayat kehadiran shift.
                          </td>
                        </tr>
                      ) : (
                        selectedDokterDetail.kehadiran.daftarPresensi.map((pr) => (
                          <tr key={pr.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-700">
                              {new Date(pr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-2 text-center font-bold text-blue-700">{pr.shift}</td>
                            <td className="px-4 py-2 text-center text-gray-500">
                              {pr.jamMasuk ? new Date(pr.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {pr.statusKehadiran}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-extrabold text-gray-900">
                              Rp {pr.nominalFee.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pr.statusPembayaran === 'DIBAYAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {pr.statusPembayaran === 'DIBAYAR' ? 'LUNAS' : 'PENDING'}
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

            {/* Footer Modal */}
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-xs text-gray-500">
                Sisa Belum Dibayar:{' '}
                <strong className="text-amber-700 font-bold">
                  Rp {selectedDokterDetail.rekap.totalBelumDibayar.toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="flex items-center space-x-2">
                {selectedDokterDetail.rekap.totalBelumDibayar > 0 && (
                  <button
                    onClick={() => {
                      const presensiIds = selectedDokterDetail.kehadiran.daftarPresensi.filter(p => p.statusPembayaran === 'PENDING').map(p => p.id);
                      const feeIds = selectedDokterDetail.penangananPasien.daftarPasien.filter(l => l.statusPembayaran === 'PENDING').map(l => l.id);
                      handleBayarFee(presensiIds, feeIds, selectedDokterDetail.dokter.namaLengkap || selectedDokterDetail.dokter.username);
                    }}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    Tandai Semua Lunas
                  </button>
                )}
                <button
                  onClick={() => setSelectedDokterDetail(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT PRESENSI MANUAL OLEH ADMIN */}
      {isPresensiModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
              <h3 className="font-bold text-gray-900 text-base flex items-center">
                <UserCheck className="w-5 h-5 text-emerald-600 mr-2" />
                Catat Presensi Tenaga Medis
              </h3>
              <button
                onClick={() => setIsPresensiModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePresensi} className="p-6 space-y-4">
              {/* Pilih Nakes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Tenaga Medis (Dokter / Perawat)</label>
                <select
                  value={formPresensi.userId}
                  onChange={(e) => setFormPresensi({ ...formPresensi, userId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Pilih Dokter / Perawat --</option>
                  {allNakesList.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.namaLengkap || n.username} ({n.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Shift */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase">Tanggal</label>
                  <input
                    type="date"
                    value={formPresensi.tanggal}
                    onChange={(e) => setFormPresensi({ ...formPresensi, tanggal: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase">Shift</label>
                  <select
                    value={formPresensi.shift}
                    onChange={(e) => setFormPresensi({ ...formPresensi, shift: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PAGI">Pagi (08:00 - 14:00)</option>
                    <option value="SIANG">Siang (14:00 - 20:00)</option>
                    <option value="MALAM">Malam (20:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              {/* Status Kehadiran */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Status Kehadiran</label>
                <select
                  value={formPresensi.statusKehadiran}
                  onChange={(e) => setFormPresensi({ ...formPresensi, statusKehadiran: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HADIR">HADIR (Berhak Fee Kehadiran)</option>
                  <option value="IZIN">IZIN (Tanpa Fee)</option>
                  <option value="SAKIT">SAKIT (Tanpa Fee)</option>
                  <option value="ALPA">ALPA (Tanpa Fee)</option>
                </select>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Catatan</label>
                <input
                  type="text"
                  placeholder="Misal: Bertugas di Poli Umum shift pagi"
                  value={formPresensi.catatan}
                  onChange={(e) => setFormPresensi({ ...formPresensi, catatan: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPresensiModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT SLIP CONTAINER */}
      <div className="hidden">
        <div ref={printSlipRef} className="p-8 text-black bg-white font-sans max-w-2xl mx-auto">
          {printNakes && (
            <div>
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h1 className="text-xl font-black uppercase tracking-wider">SLIP REMUNERASI & JASA PELAYANAN</h1>
                <p className="text-xs uppercase">{user?.faskes?.namaFaskes || 'PUSKESMAS INDUK KABUPATEN'}</p>
                <p className="text-xs text-gray-600">
                  Periode: {tanggalAwal} s/d {tanggalAkhir}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <div>Nama Tenaga Medis: <strong>{(printNakes.data as any).dokter?.namaLengkap || (printNakes.data as any).perawat?.namaLengkap}</strong></div>
                  <div>Profesi: <strong>{printNakes.tipe}</strong></div>
                  <div>Unit / Poli: <strong>{(printNakes.data as any).dokter?.poliklinik?.namaPoli || 'Poli Umum / Rawat Jalan'}</strong></div>
                </div>
                <div className="text-right">
                  <div>Tanggal Cetak: <strong>{new Date().toLocaleDateString('id-ID')}</strong></div>
                  <div>Status Dokumen: <strong>VERIFIED OFFICIAL</strong></div>
                </div>
              </div>

              <table className="w-full text-xs border border-black mb-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-bold">
                    <th className="p-2 text-left">Komponen Remunerasi</th>
                    <th className="p-2 text-center">Kuantitas</th>
                    <th className="p-2 text-right">Tarif Satuan</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-2">Jasa Kehadiran (Presensi Shift)</td>
                    <td className="p-2 text-center">{printNakes.data.kehadiran.totalHadir} Shift</td>
                    <td className="p-2 text-right">
                      Rp {(printNakes.tipe === 'DOKTER' ? masterTarif.feeKehadiranDokter : masterTarif.feeKehadiranPerawat).toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 text-right font-bold">
                      Rp {printNakes.data.rekap.totalFeeKehadiran.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {printNakes.tipe === 'DOKTER' && (
                    <tr>
                      <td className="p-2">Jasa Penanganan Pasien (Jaspel Pelayanan)</td>
                      <td className="p-2 text-center">{(printNakes.data as RekapDokterItem).penangananPasien.totalPasien} Pasien</td>
                      <td className="p-2 text-right">Rp {masterTarif.feePerPasienDokter.toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right font-bold">
                        Rp {(printNakes.data as RekapDokterItem).rekap.totalFeePenanganan.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-gray-100 font-black text-sm">
                    <td colSpan={3} className="p-2.5 text-right uppercase">TOTAL REMUNERASI BERSIH:</td>
                    <td className="p-2.5 text-right">
                      Rp {printNakes.data.rekap.totalFeeKumulatif.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12">
                <div>
                  <p>Penerima,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{(printNakes.data as any).dokter?.namaLengkap || (printNakes.data as any).perawat?.namaLengkap}</p>
                </div>
                <div>
                  <p>Bendahara / Kepala Puskesmas,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">(..................................................)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

