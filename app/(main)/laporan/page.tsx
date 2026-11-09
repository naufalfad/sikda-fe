"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Users,
  Activity,
  Package,
  Wrench,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
  Building2,
  Stethoscope,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  History,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { laporanService } from '@/services/laporan.service';
import { klinikService } from '@/services/klinik.service';
import { Poliklinik } from '@/types/klinik.types';
import { exportTableToCsv } from '@/lib/exportCsv';
import CetakDokumenLaporanModal from '@/components/laporan/CetakDokumenLaporanModal';

type ActiveTab = 'kunjungan' | 'morbiditas' | 'bmhp' | 'alkes' | 'kinerja_nakes';
type PeriodType = 'hari_ini' | 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'custom';

export default function PusatLaporanFaskesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kunjungan');
  const [periodType, setPeriodType] = useState<PeriodType>('bulan_ini');
  
  // Date range states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Additional filter states
  const [selectedPoli, setSelectedPoli] = useState('');
  const [bmhpSearch, setBmhpSearch] = useState('');
  const [bmhpStatus, setBmhpStatus] = useState('SEMUA');
  const [bmhpFilterMode, setBmhpFilterMode] = useState<'bermutasi' | 'semua' | 'kritis'>('bermutasi');
  const [alkesKondisi, setAlkesKondisi] = useState('');
  const [alkesFilterMode, setAlkesFilterMode] = useState<'digunakan' | 'semua'>('digunakan');
  const [nakesProfesi, setNakesProfesi] = useState('');
  const [nakesSearch, setNakesSearch] = useState('');
  const [nakesFilterMode, setNakesFilterMode] = useState<'aktif' | 'semua'>('aktif');
  
  // Master data
  const [poliList, setPoliList] = useState<Poliklinik[]>([]);
  
  // Data reports
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  // Modal Cetak Dokumen Resmi
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  
  // Sub-view untuk Tab Kunjungan: 'rekap' | 'detail'
  const [kunjunganSubTab, setKunjunganSubTab] = useState<'rekap' | 'detail'>('rekap');

  // Helper Init Tanggal berdasarkan Preset (Local Timezone Safe)
  const applyPeriodPreset = useCallback((preset: PeriodType) => {
    const now = new Date();
    let s = '';
    let e = '';

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'hari_ini') {
      s = formatDate(now);
      e = formatDate(now);
    } else if (preset === 'bulan_ini') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'bulan_lalu') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'tahun_ini') {
      s = `${now.getFullYear()}-01-01`;
      e = `${now.getFullYear()}-12-31`;
    }

    if (s && e) {
      setStartDate(s);
      setEndDate(e);
    }
  }, []);

  // Set default date range on mount
  useEffect(() => {
    applyPeriodPreset('bulan_ini');
    // Load poliklinik
    klinikService.getPoliklinik().then(res => {
      if (Array.isArray(res)) setPoliList(res);
    }).catch(() => {});
  }, [applyPeriodPreset]);

  // Load Data Report saat Tab atau Filter berubah
  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      if (activeTab === 'kunjungan') {
        const res = await laporanService.getLaporanKunjungan({
          startDate,
          endDate,
          poliklinikId: selectedPoli || undefined,
          periode: periodType === 'hari_ini' ? 'harian' : (periodType === 'tahun_ini' ? 'tahunan' : 'bulanan')
        });
        if (res.success) setReportData(res.data);
      } else if (activeTab === 'morbiditas') {
        const res = await laporanService.getLaporanMorbiditas({
          startDate,
          endDate,
          poliklinikId: selectedPoli || undefined,
          limit: 20
        });
        if (res.success) setReportData(res.data);
      } else if (activeTab === 'bmhp') {
        const res = await laporanService.getLaporanBMHP({
          startDate,
          endDate,
          search: bmhpSearch || undefined,
          statusStok: bmhpStatus !== 'SEMUA' ? bmhpStatus : undefined,
          filterMode: bmhpFilterMode
        });
        if (res.success) setReportData(res.data);
      } else if (activeTab === 'alkes') {
        const res = await laporanService.getLaporanAlkes({
          startDate,
          endDate,
          kondisiAset: alkesKondisi || undefined,
          filterMode: alkesFilterMode
        });
        if (res.success) setReportData(res.data);
      } else if (activeTab === 'kinerja_nakes') {
        const res = await laporanService.getLaporanKinerjaNakes({
          startDate,
          endDate,
          poliklinikId: selectedPoli || undefined,
          profesi: nakesProfesi || undefined,
          filterMode: nakesFilterMode
        });
        if (res.success) setReportData(res.data);
      }
    } catch (err: any) {
      console.error('Gagal memuat data laporan:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Laporan',
        text: err?.response?.data?.message || 'Terjadi kesalahan saat menarik data pelaporan.'
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, selectedPoli, periodType, bmhpSearch, bmhpStatus, bmhpFilterMode, alkesKondisi, alkesFilterMode, nakesProfesi, nakesFilterMode]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [fetchReport]);

  const handlePeriodChange = (val: PeriodType) => {
    setPeriodType(val);
    if (val !== 'custom') {
      applyPeriodPreset(val);
    }
  };

  // Helper Ekspor Excel/CSV Terstruktur
  const handleExportExcel = () => {
    if (!reportData) {
      Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'Tidak ada data untuk diekspor.' });
      return;
    }

    if (activeTab === 'kunjungan') {
      const headers = ['Tanggal', 'Pasien Baru', 'Pasien Lama', 'Laki-Laki', 'Perempuan', 'BPJS', 'Umum', 'Total Pasien'];
      const rows = (reportData.rekapTabelHarian || []).map((r: any) => [
        r.tanggal,
        r.baru,
        r.lama,
        r.lakiLaki,
        r.perempuan,
        r.bpjs,
        r.umum,
        r.total
      ]);
      exportTableToCsv(`Laporan_Kunjungan_Pasien_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'morbiditas') {
      const headers = ['Peringkat', 'Kode ICD-10', 'Nama Diagnosis Penyakit', 'Kasus Primer', 'Kasus Sekunder', 'Total Kasus', 'Proporsi (%)'];
      const rows = (reportData.topPenyakit || []).map((r: any) => [
        r.peringkat,
        r.kodeIcd10,
        r.namaDiagnosis,
        r.kasusPrimer,
        r.kasusSekunder,
        r.totalKasus,
        `${r.persentase}%`
      ]);
      exportTableToCsv(`Laporan_Morbiditas_LB1_Penyakit_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'bmhp') {
      const headers = ['Kode Item', 'Nama Barang BMHP', 'Kategori', 'Satuan', 'Stok Awal', 'Jumlah Masuk', 'Jumlah Keluar', 'Sisa Stok Akhir', 'Ada Transaksi', 'Status'];
      const rows = (reportData.daftarBMHP || []).map((r: any) => [
        r.kodeItem,
        r.namaItem,
        r.kategori,
        r.sediaan,
        r.stokAwal,
        r.jumlahMasuk,
        r.jumlahKeluar,
        r.sisaStokAkhir,
        r.adaTransaksi ? 'Ya (Aktif)' : 'Tidak Ada Mutasi',
        r.status
      ]);
      exportTableToCsv(`Laporan_Penggunaan_Stok_BMHP_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'alkes') {
      const headers = ['Kode Aset', 'Nama Alat Medis', 'Ruangan / Unit', 'Kategori', 'Kondisi', 'Frekuensi Pemakaian', 'Tarif Satuan (Rp)', 'Total Nilai Utilisasi (Rp)'];
      const rows = (reportData.daftarAlkes || []).map((r: any) => [
        r.kodeAset,
        r.namaAset,
        r.ruangan,
        r.kategori,
        r.kondisi,
        `${r.frekuensiPakai || 0} Kali`,
        r.tarifPemakaian || 0,
        r.totalNilaiUtilisasi || 0
      ]);
      exportTableToCsv(`Laporan_Penggunaan_Alat_Medis_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'kinerja_nakes') {
      const headers = [
        'No',
        'Nama Tenaga Medis',
        'Profesi / Jabatan',
        'SIP / STR',
        'Unit / Poliklinik',
        'Konsultasi RME',
        'Tindakan Klinis',
        'Resep Obat',
        'Skrining & Triase',
        'Total Aktivitas Klinis'
      ];
      const rows = (reportData.daftarKinerjaNakes || [])
        .filter((r: any) => nakesFilterMode === 'semua' || r.adaTransaksi || r.totalAktivitas > 0)
        .map((r: any, idx: number) => [
          idx + 1,
          r.nama,
          r.profesi,
          r.nomorSip !== '-' ? r.nomorSip : (r.nomorStr !== '-' ? r.nomorStr : '-'),
          r.poli,
          r.jumlahRme,
          r.jumlahTindakan,
          r.jumlahResep,
          r.jumlahScreening,
          r.totalAktivitas
        ]);
      exportTableToCsv(`Laporan_Kinerja_Tenaga_Medis_${startDate}_sd_${endDate}`, headers, rows);
    }
  };

  const getPoliName = () => {
    if (!selectedPoli) return 'Semua Poliklinik';
    const p = poliList.find(x => x.id === selectedPoli);
    return p?.namaPoli || 'Poliklinik';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ── HEADER HALAMAN UTAMA ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
              Modul SP2TP &amp; Akreditasi Faskes
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-500">Multi-Kategori Laporan Resmi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Pusat Laporan &amp; Rekapitulasi Faskes
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sistem agregasi data terpadu untuk pencatatan kunjungan, morbiditas 10 besar penyakit (LB1), mutasi logistik BMHP, dan utilisasi inventaris alkes.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-300 shadow-xs cursor-pointer"
            title="Muat ulang data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || !reportData}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            title="Unduh tabel data dalam format Microsoft Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button
            onClick={() => setIsCetakModalOpen(true)}
            disabled={loading || !reportData}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            title="Buka dokumen laporan resmi siap cetak / simpan ke PDF"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen Resmi (A4)
          </button>
        </div>
      </div>

      {/* ── 5 TAB UTAMA LAPORAN ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('kunjungan')}
          className={`p-4 border text-left transition-all cursor-pointer ${
            activeTab === 'kunjungan'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className={`w-6 h-6 ${activeTab === 'kunjungan' ? 'text-white' : 'text-blue-600'}`} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'kunjungan' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
            }`}>
              Tab 1
            </span>
          </div>
          <h2 className="text-sm font-extrabold leading-tight">Kunjungan Pasien</h2>
          <p className={`text-[11px] mt-1 ${activeTab === 'kunjungan' ? 'text-blue-100' : 'text-slate-500'}`}>
            Trafik harian, bulanan, tahunan, gender &amp; penjamin.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('morbiditas')}
          className={`p-4 border text-left transition-all cursor-pointer ${
            activeTab === 'morbiditas'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className={`w-6 h-6 ${activeTab === 'morbiditas' ? 'text-white' : 'text-indigo-600'}`} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'morbiditas' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
            }`}>
              Tab 2
            </span>
          </div>
          <h2 className="text-sm font-extrabold leading-tight">Diagnosis &amp; LB1</h2>
          <p className={`text-[11px] mt-1 ${activeTab === 'morbiditas' ? 'text-indigo-100' : 'text-slate-500'}`}>
            10 &amp; 20 Besar Penyakit Terbanyak (ICD-10).
          </p>
        </button>

        <button
          onClick={() => setActiveTab('bmhp')}
          className={`p-4 border text-left transition-all cursor-pointer ${
            activeTab === 'bmhp'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Package className={`w-6 h-6 ${activeTab === 'bmhp' ? 'text-white' : 'text-amber-600'}`} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'bmhp' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
            }`}>
              Tab 3
            </span>
          </div>
          <h2 className="text-sm font-extrabold leading-tight">Logistik &amp; BMHP</h2>
          <p className={`text-[11px] mt-1 ${activeTab === 'bmhp' ? 'text-amber-100' : 'text-slate-500'}`}>
            Penggunaan, mutasi stok masuk-keluar &amp; sisa barang.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('alkes')}
          className={`p-4 border text-left transition-all cursor-pointer ${
            activeTab === 'alkes'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Wrench className={`w-6 h-6 ${activeTab === 'alkes' ? 'text-white' : 'text-teal-600'}`} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'alkes' ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700'
            }`}>
              Tab 4
            </span>
          </div>
          <h2 className="text-sm font-extrabold leading-tight">Alat Medis &amp; Alkes</h2>
          <p className={`text-[11px] mt-1 ${activeTab === 'alkes' ? 'text-teal-100' : 'text-slate-500'}`}>
            Utilisasi tindakan, kondisi alat &amp; jadwal kalibrasi.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('kinerja_nakes')}
          className={`p-4 border text-left transition-all cursor-pointer ${
            activeTab === 'kinerja_nakes'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <UserCheck className={`w-6 h-6 ${activeTab === 'kinerja_nakes' ? 'text-white' : 'text-purple-600'}`} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'kinerja_nakes' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700'
            }`}>
              Tab 5
            </span>
          </div>
          <h2 className="text-sm font-extrabold leading-tight">Kinerja Nakes</h2>
          <p className={`text-[11px] mt-1 ${activeTab === 'kinerja_nakes' ? 'text-purple-100' : 'text-slate-500'}`}>
            Dokter &amp; perawat: RME, tindakan, resep &amp; skrining.
          </p>
        </button>
      </div>

      {/* ── FILTER BAR DINAMIS ── */}
      <div className="bg-white p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Preset Periode Cepat */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-600 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Periode:
          </span>
          {(['hari_ini', 'bulan_ini', 'bulan_lalu', 'tahun_ini', 'custom'] as PeriodType[]).map((p) => {
            const labels: Record<PeriodType, string> = {
              hari_ini: 'Hari Ini',
              bulan_ini: 'Bulan Ini',
              bulan_lalu: 'Bulan Lalu',
              tahun_ini: 'Tahun Ini',
              custom: 'Kustom'
            };
            return (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  periodType === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Date Inputs & Dropdown Filter Khusus */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-300 px-2 py-1.5">
            <span className="text-gray-500">Tgl:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodType('custom');
              }}
              className="bg-transparent font-mono text-xs focus:outline-hidden"
            />
            <span className="text-gray-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodType('custom');
              }}
              className="bg-transparent font-mono text-xs focus:outline-hidden"
            />
          </div>

          {/* Filter Khusus Tab Kunjungan & Morbiditas: Poliklinik */}
          {(activeTab === 'kunjungan' || activeTab === 'morbiditas') && (
            <select
              value={selectedPoli}
              onChange={(e) => setSelectedPoli(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="">Semua Poliklinik</option>
              {poliList.map(p => (
                <option key={p.id} value={p.id}>{p.namaPoli}</option>
              ))}
            </select>
          )}

          {/* Filter Khusus Tab BMHP: Mode Tampilan, Search & Status */}
          {activeTab === 'bmhp' && (
            <>
              {/* Toggle Mode: Default Hanya Yang Bermutasi (Terjadi Transaksi) */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setBmhpFilterMode('bermutasi')}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bmhpFilterMode === 'bermutasi'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Barang Terjadi Transaksi ({reportData?.ringkasan?.itemBermutasi || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setBmhpFilterMode('semua')}
                  className={`px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    bmhpFilterMode === 'semua'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lihat Seluruh Katalog ({reportData?.ringkasan?.totalItemBMHP || 0})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama BMHP..."
                  value={bmhpSearch}
                  onChange={(e) => setBmhpSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-hidden w-44"
                />
              </div>
              <select
                value={bmhpStatus}
                onChange={(e) => setBmhpStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="AMAN">Stok Aman</option>
                <option value="KRITIS">Stok Kritis</option>
                <option value="HABIS">Stok Habis</option>
              </select>
            </>
          )}

          {/* Filter Khusus Tab Alkes: Mode & Kondisi */}
          {activeTab === 'alkes' && (
            <>
              {/* Toggle Mode Alkes: Digunakan vs Semua */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setAlkesFilterMode('digunakan')}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    alkesFilterMode === 'digunakan'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Alat Yang Digunakan ({reportData?.ringkasan?.alatDigunakanCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAlkesFilterMode('semua')}
                  className={`px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    alkesFilterMode === 'semua'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lihat Seluruh Aset ({reportData?.ringkasan?.totalAlatTerdaftar || 0})
                </button>
              </div>

              <select
                value={alkesKondisi}
                onChange={(e) => setAlkesKondisi(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="">Semua Kondisi Alkes</option>
                <option value="BAIK">Kondisi Baik</option>
                <option value="RUSAK_RINGAN">Rusak Ringan</option>
                <option value="RUSAK_BERAT">Rusak Berat</option>
                <option value="AFKIR">Afkir</option>
              </select>
            </>
          )}

          {/* Filter Khusus Tab Kinerja Nakes: Mode, Search, Profesi & Poliklinik */}
          {activeTab === 'kinerja_nakes' && (
            <>
              {/* Toggle Mode Nakes: Aktif vs Semua */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setNakesFilterMode('aktif')}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    nakesFilterMode === 'aktif'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Nakes Aktif Melayani ({reportData?.ringkasan?.nakesAktifCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setNakesFilterMode('semua')}
                  className={`px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    nakesFilterMode === 'semua'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lihat Seluruh Tenaga ({reportData?.ringkasan?.totalNakesTerdaftar || 0})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama tenaga medis..."
                  value={nakesSearch}
                  onChange={(e) => setNakesSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-hidden w-48"
                />
              </div>

              <select
                value={nakesProfesi}
                onChange={(e) => setNakesProfesi(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="">Semua Profesi</option>
                <option value="DOKTER">Dokter (Umum/Spesialis)</option>
                <option value="DOKTER_UGD">Dokter UGD</option>
                <option value="PERAWAT">Perawat &amp; Bidan</option>
              </select>

              <select
                value={selectedPoli}
                onChange={(e) => setSelectedPoli(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="">Semua Poliklinik</option>
                {poliList.map(p => (
                  <option key={p.id} value={p.id}>{p.namaPoli}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ── KONTEN AREA UTAMA BERDASARKAN TAB ── */}
      {loading ? (
        <div className="bg-white border border-slate-200 p-16 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Menghitung Agregasi Data Laporan...</h3>
          <p className="text-xs text-gray-500 mt-1">Sistem sedang merangkum rekapitulasi database faskes sesuai filter terpilih.</p>
        </div>
      ) : !reportData ? (
        <div className="bg-white border border-slate-200 p-16 text-center text-gray-400 shadow-xs">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold">Pilih rentang periode untuk memuat berkas laporan.</p>
        </div>
      ) : (
        <>
          {/* =========================================================================
              TAB 1: KUNJUNGAN PASIEN
             ========================================================================= */}
          {activeTab === 'kunjungan' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Kunjungan</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-mono font-black text-slate-900">{reportData.ringkasan?.totalKunjungan || 0}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Rata-rata: <strong className="text-blue-700">{reportData.ringkasan?.rataRataPerHari || 0}</strong> pasien/hari
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Pasien Baru vs Lama</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1">
                    <span className="text-emerald-700">{reportData.ringkasan?.pasienBaru || 0}</span>
                    <span className="text-gray-400 mx-2">/</span>
                    <span className="text-blue-700">{reportData.ringkasan?.pasienLama || 0}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Baru: {reportData.ringkasan?.totalKunjungan ? Math.round((reportData.ringkasan.pasienBaru / reportData.ringkasan.totalKunjungan) * 100) : 0}% dari total
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Rasio Gender (L / P)</span>
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1">
                    <span>{reportData.ringkasan?.lakiLaki || 0} L</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span>{reportData.ringkasan?.perempuan || 0} P</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Demografi kunjungan pasien
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Penjamin (BPJS / Umum)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1">
                    <span className="text-emerald-700">{reportData.ringkasan?.penjamin?.BPJS || 0}</span>
                    <span className="text-gray-400 mx-2">/</span>
                    <span className="text-slate-700">{reportData.ringkasan?.penjamin?.Umum || 0}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Asuransi: {reportData.ringkasan?.penjamin?.Asuransi || 0} pasien
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Rekap Harian vs Daftar Pasien */}
              <div className="bg-white border border-slate-200 shadow-xs">
                <div className="flex border-b border-slate-200 px-4 pt-3 gap-4">
                  <button
                    onClick={() => setKunjunganSubTab('rekap')}
                    className={`pb-3 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                      kunjunganSubTab === 'rekap' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Tabel Rekapitulasi Per Tanggal
                  </button>
                  <button
                    onClick={() => setKunjunganSubTab('detail')}
                    className={`pb-3 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                      kunjunganSubTab === 'detail' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Daftar Transaksi Kunjungan ({reportData.daftarKunjungan?.length || 0})
                  </button>
                </div>

                {kunjunganSubTab === 'rekap' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-center">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 text-left">Tanggal Kunjungan</th>
                          <th className="py-3 px-4 w-28">Pasien Baru</th>
                          <th className="py-3 px-4 w-28">Pasien Lama</th>
                          <th className="py-3 px-4 w-24">Laki-laki</th>
                          <th className="py-3 px-4 w-24">Perempuan</th>
                          <th className="py-3 px-4 w-28">BPJS</th>
                          <th className="py-3 px-4 w-28">Umum / Tunai</th>
                          <th className="py-3 px-4 w-32 text-right">Total Pasien</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.rekapTabelHarian || []).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 text-center">
                            <td className="py-2.5 px-4 font-mono text-gray-400">{idx + 1}</td>
                            <td className="py-2.5 px-4 text-left font-mono font-bold text-slate-900">{row.tanggal}</td>
                            <td className="py-2.5 px-4 font-mono">{row.baru}</td>
                            <td className="py-2.5 px-4 font-mono">{row.lama}</td>
                            <td className="py-2.5 px-4 font-mono">{row.lakiLaki}</td>
                            <td className="py-2.5 px-4 font-mono">{row.perempuan}</td>
                            <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">{row.bpjs}</td>
                            <td className="py-2.5 px-4 font-mono">{row.umum}</td>
                            <td className="py-2.5 px-4 font-mono font-black text-right text-blue-900">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Waktu Registrasi</th>
                          <th className="py-3 px-4">No. Antrian</th>
                          <th className="py-3 px-4">No RM &amp; Pasien</th>
                          <th className="py-3 px-4">Poli Tujuan</th>
                          <th className="py-3 px-4">Penjamin</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.daftarKunjungan || []).map((k: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 text-center font-mono text-gray-400">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-mono text-gray-600">
                              {new Date(k.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-blue-800">{k.noAntrian}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-mono text-gray-500 mr-1.5">[{k.noRM}]</span>
                              <strong className="text-slate-900">{k.namaPasien}</strong>
                              <span className="text-[10px] text-gray-400 ml-1.5">({k.jenisKelamin})</span>
                            </td>
                            <td className="py-2.5 px-4 font-medium">{k.poli}</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-800">{k.penjamin}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {k.statusPasien}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: MORBIDITAS & 10 BESAR PENYAKIT (LB1)
             ========================================================================= */}
          {activeTab === 'morbiditas' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Kasus Terdiagnosa</div>
                  <div className="text-3xl font-mono font-black text-slate-900">{reportData.ringkasan?.totalKasus || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Seluruh diagnosis terinput dokter</div>
                </div>
                <div className="bg-white p-5 border border-slate-200 shadow-xs md:col-span-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Penyakit Terbanyak Nomor 1</div>
                  <div className="text-xl font-bold text-indigo-900 mt-1 truncate">
                    {reportData.ringkasan?.penyakitNomorSatu || '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Mendominasi tren kasus morbiditas pada periode ini</div>
                </div>
              </div>

              {/* Tabel 10/20 Besar Penyakit */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Peringkat 20 Besar Penyakit Puskesmas (Formulir LB1 SP2TP)
                  </h3>
                  <span className="text-xs text-slate-500">Standar Klasifikasi WHO ICD-10</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3 px-4 w-14 text-center">Rank</th>
                        <th className="py-3 px-4 w-28">Kode ICD-10</th>
                        <th className="py-3 px-4">Nama Diagnosis Penyakit</th>
                        <th className="py-3 px-4 w-28 text-center">Kasus Primer</th>
                        <th className="py-3 px-4 w-28 text-center">Kasus Sekunder</th>
                        <th className="py-3 px-4 w-28 text-center">Total Kasus</th>
                        <th className="py-3 px-4 w-44">Proporsi (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {(reportData.topPenyakit || []).map((row: any) => (
                        <tr key={row.peringkat} className="hover:bg-indigo-50/40">
                          <td className="py-3 px-4 text-center font-mono font-extrabold text-slate-900">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                              row.peringkat <= 3 ? 'bg-indigo-600 text-white font-black' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {row.peringkat}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-800">{row.kodeIcd10}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.namaDiagnosis}</td>
                          <td className="py-3 px-4 text-center font-mono">{row.kasusPrimer}</td>
                          <td className="py-3 px-4 text-center font-mono">{row.kasusSekunder}</td>
                          <td className="py-3 px-4 text-center font-mono font-black text-slate-900">{row.totalKasus}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(row.persentase * 3, 100)}%` }}></div>
                              </div>
                              <span className="font-mono text-xs font-bold text-slate-700 w-12 text-right">{row.persentase}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: LOGISTIK & BMHP
             ========================================================================= */}
          {activeTab === 'bmhp' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Barang Terjadi Transaksi
                  </div>
                  <div className="text-3xl font-mono font-black text-amber-800">{reportData.ringkasan?.itemBermutasi || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Jenis BMHP mengalami pergerakan stok</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Total Unit Terpakai (Keluar)</div>
                  <div className="text-3xl font-mono font-black text-red-700">-{reportData.ringkasan?.totalPemakaianUnit || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Pemakaian kasir, resep, atau tindakan medis</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Total Unit Masuk (Penerimaan)</div>
                  <div className="text-3xl font-mono font-black text-emerald-700">+{reportData.ringkasan?.totalMasukUnit || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Penambahan barang restock logistik</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Total Riwayat Mutasi
                  </div>
                  <div className="text-3xl font-mono font-black text-blue-800">{reportData.ringkasan?.totalMutasiTransaksi || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Catatan transaksi di jurnal fisik faskes</div>
                </div>
              </div>

              {/* Tabel Stok & Mutasi BMHP */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-600" />
                      Daftar Log Transaksi Mutasi Penggunaan BMHP
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {bmhpFilterMode === 'bermutasi'
                        ? 'Hanya menampilkan barang-barang medis yang benar-benar mengalami transaksi penambahan atau pengurangan pada periode ini'
                        : 'Menampilkan seluruh katalog inventaris stok BMHP faskes'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 font-mono">
                      {(reportData.daftarBMHP || []).length} Barang Terlibat Transaksi
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Standar LPLPO Gudang Farmasi</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {(reportData.daftarBMHP || []).length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-700">Tidak ada transaksi mutasi BMHP pada rentang tanggal terpilih</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tidak ada barang yang bertambah atau berkurang di periode ini. Pilih rentang tanggal lain atau gunakan tombol periode cepat di atas.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 w-28 text-left">Kode Item</th>
                          <th className="py-3 px-4 text-left">Nama Barang BMHP &amp; Kategori</th>
                          <th className="py-3 px-4 w-20">Satuan</th>
                          <th className="py-3 px-4 w-24">Stok Awal</th>
                          <th className="py-3 px-4 w-24">Masuk (+)</th>
                          <th className="py-3 px-4 w-24">Keluar (-)</th>
                          <th className="py-3 px-4 w-28">Sisa Akhir</th>
                          <th className="py-3 px-4 w-24">Status</th>
                          <th className="py-3 px-4 w-28">Aktivitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.daftarBMHP || []).map((row: any, idx: number) => {
                          const hasTrx = row.adaTransaksi || row.jumlahMasuk > 0 || row.jumlahKeluar > 0;
                          return (
                            <tr
                              key={row.id}
                              className={`text-center transition-colors ${
                                hasTrx ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono text-gray-400">{idx + 1}</td>
                              <td className="py-2.5 px-4 text-left font-mono font-bold text-slate-700">{row.kodeItem}</td>
                              <td className="py-2.5 px-4 text-left">
                                <div className="font-bold text-slate-900">{row.namaItem}</div>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  {row.kategori} &bull; Batch: <span className="font-mono">{row.noBatch}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-gray-600">{row.sediaan}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-700">{row.stokAwal}</td>
                              <td className="py-2.5 px-4 font-mono font-bold">
                                {row.jumlahMasuk > 0 ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">+{row.jumlahMasuk}</span>
                                ) : (
                                  <span className="text-gray-300">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold">
                                {row.jumlahKeluar > 0 ? (
                                  <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded">-{row.jumlahKeluar}</span>
                                ) : (
                                  <span className="text-gray-300">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-black text-slate-900 text-sm">{row.sisaStokAkhir}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                  row.status === 'AMAN'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.status === 'KRITIS'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px]">
                                {hasTrx ? (
                                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                                    <TrendingDown className="w-3 h-3" />
                                    {row.transaksiCount || 1} Mutasi
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-normal">Tidak Ada Mutasi</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* JURNAL TRANSAKSI FISIK MUTASI BMHP (AUDIT TRAIL LOGS) */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-600" />
                      Jurnal Catatan Mutasi Fisik BMHP (Granular Audit Logs)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rincian setiap transaksi penambahan (masuk) dan pengeluaran (tindakan/pelayanan) barang habis pakai
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1">
                    {(reportData.logMutasiTerbaru || []).length} Catatan Transaksi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {(reportData.logMutasiTerbaru || []).length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-medium">
                      Belum ada catatan mutasi fisik BMHP pada rentang tanggal terpilih.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-4 w-36">Waktu Transaksi</th>
                          <th className="py-2.5 px-4 w-24 text-center">Jenis</th>
                          <th className="py-2.5 px-4">Nama Barang BMHP</th>
                          <th className="py-2.5 px-4 w-24 text-center">Volume</th>
                          <th className="py-2.5 px-4 w-32 text-center">Stok (Awal &rarr; Akhir)</th>
                          <th className="py-2.5 px-4 w-36 font-mono">No. Referensi</th>
                          <th className="py-2.5 px-4">Keterangan / Kegiatan Pelayanan</th>
                          <th className="py-2.5 px-4 w-32">Petugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.logMutasiTerbaru || []).map((log: any) => (
                          <tr key={log.id} className="hover:bg-blue-50/30">
                            <td className="py-2 px-4 font-mono text-[11px] text-gray-600">
                              {new Date(log.tanggal).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </td>
                            <td className="py-2 px-4 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                log.jenisMutasi === 'MASUK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {log.jenisMutasi}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-slate-900">{log.namaItem}</td>
                            <td className="py-2 px-4 text-center font-mono font-bold">
                              {log.jenisMutasi === 'MASUK' ? (
                                <span className="text-emerald-700">+{log.jumlah}</span>
                              ) : (
                                <span className="text-red-700">-{log.jumlah}</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-center font-mono text-[11px] text-gray-600">
                              {log.stokAwal !== undefined && log.stokAkhir !== undefined
                                ? `${log.stokAwal} → ${log.stokAkhir}`
                                : '-'}
                            </td>
                            <td className="py-2 px-4 font-mono text-[11px] text-blue-800 font-semibold">{log.referensi}</td>
                            <td className="py-2 px-4 text-gray-600">{log.keterangan}</td>
                            <td className="py-2 px-4 text-gray-500 font-medium">{log.petugas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: ALAT MEDIS & ALKES
             ========================================================================= */}
          {activeTab === 'alkes' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-teal-600" />
                    Alat Medis Digunakan
                  </div>
                  <div className="text-3xl font-mono font-black text-teal-800">{reportData.ringkasan?.alatDigunakanCount || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Jenis alat aktif dalam tindakan klinis</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Total Frekuensi Pemakaian</div>
                  <div className="text-3xl font-mono font-black text-blue-800">{reportData.ringkasan?.totalFrekuensiPakai || 0} Kali</div>
                  <div className="text-xs text-gray-500 mt-1">Total pemakaian pada pasien periode ini</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Total Nilai Utilisasi</div>
                  <div className="text-2xl font-mono font-black text-emerald-800">
                    Rp {(reportData.ringkasan?.totalNilaiUtilisasi || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Pendapatan tarif pemakaian alkes</div>
                </div>

                <div className="bg-white p-5 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Kondisi Alat Digunakan</div>
                  <div className="text-2xl font-mono font-black text-slate-800">
                    <span className="text-emerald-700">{reportData.ringkasan?.kondisiBaik || 0} Siap</span>
                    <span className="text-gray-400 mx-1.5">/</span>
                    <span className="text-amber-700">{reportData.ringkasan?.kondisiRusakRingan || 0} Cek</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Status kelayakan sarpras medis</div>
                </div>
              </div>

              {/* Tabel Log Penggunaan & Utilisasi Alkes */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-teal-600" />
                      Daftar Log Penggunaan &amp; Utilisasi Alat Medis
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {alkesFilterMode === 'digunakan'
                        ? 'Hanya menampilkan alat-alat medis yang memiliki riwayat pemakaian dalam tindakan medis pada periode ini'
                        : 'Menampilkan seluruh inventaris aset alat medis faskes'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-900 font-mono">
                      {(reportData.daftarAlkes || []).length} Alat Digunakan
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Standar Sarpras Kemenkes RI</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {(reportData.daftarAlkes || []).length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Wrench className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-700">Tidak ada alat medis yang digunakan pada periode terpilih</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Pilih tombol <strong className="text-blue-600 cursor-pointer" onClick={() => setAlkesFilterMode('semua')}>"Lihat Seluruh Aset"</strong> untuk melihat semua inventaris, atau sesuaikan filter tanggal di atas.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 w-32 text-left">Kode Aset</th>
                          <th className="py-3 px-4 text-left">Nama Alat Kesehatan &amp; ASPAK</th>
                          <th className="py-3 px-4 text-left">Ruangan / Poli</th>
                          <th className="py-3 px-4 w-28 text-center">Frekuensi Pakai</th>
                          <th className="py-3 px-4 w-28 text-right">Tarif Satuan</th>
                          <th className="py-3 px-4 w-32 text-right">Total Utilisasi</th>
                          <th className="py-3 px-4 w-24">Kondisi</th>
                          <th className="py-3 px-4 w-32">Status Operasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.daftarAlkes || []).map((row: any, idx: number) => {
                          const isUsed = row.frekuensiPakai > 0;
                          return (
                            <tr
                              key={row.id}
                              className={`text-center transition-colors ${
                                isUsed ? 'bg-teal-50/40 hover:bg-teal-100/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono text-gray-400">{idx + 1}</td>
                              <td className="py-2.5 px-4 text-left font-mono font-bold text-slate-700">{row.kodeAset}</td>
                              <td className="py-2.5 px-4 text-left">
                                <div className="font-bold text-slate-900">{row.namaAset}</div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  ASPAK: {row.kodeAspak || '-'} &bull; Kategori: {row.kategori}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-left text-slate-600">{row.ruangan}</td>
                              <td className="py-2.5 px-4 text-center">
                                {isUsed ? (
                                  <span className="inline-flex items-center gap-1 text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full font-bold">
                                    <Wrench className="w-3 h-3" />
                                    {row.frekuensiPakai} Kali Pakai
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-normal">Belum Digunakan</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-right text-slate-700">
                                Rp {(row.tarifPemakaian || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-black text-right text-teal-900">
                                Rp {(row.totalNilaiUtilisasi || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold ${
                                  row.kondisi === 'BAIK'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {row.kondisi}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-gray-700">{row.statusOperasional}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* JURNAL LOG PENGGUNAAN ALAT MEDIS (AUDIT TRAIL LOGS) */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-teal-600" />
                      Jurnal Catatan Pemakaian Alat Medis dalam Pelayanan Klinis (Audit Trail)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rincian setiap tindakan medis di mana dokter atau tenaga medis menggunakan alat kesehatan ini pada pasien
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-teal-100 text-teal-800 px-2.5 py-1">
                    {(reportData.logPenggunaanAlkes || []).length} Log Tindakan
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {(reportData.logPenggunaanAlkes || []).length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-medium">
                      Belum ada catatan pemakaian alat medis dalam tindakan pada rentang tanggal terpilih.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-4 w-36">Waktu Tindakan</th>
                          <th className="py-2.5 px-4 w-32 font-mono">Kode Aset</th>
                          <th className="py-2.5 px-4">Nama Alat Medis</th>
                          <th className="py-2.5 px-4">Prosedur / Tindakan Medis</th>
                          <th className="py-2.5 px-4">Pasien (No. RM)</th>
                          <th className="py-2.5 px-4 w-32">Unit / Poli</th>
                          <th className="py-2.5 px-4 w-36">Petugas Pelaksana</th>
                          <th className="py-2.5 px-4 w-28 text-right">Tarif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.logPenggunaanAlkes || []).map((log: any) => (
                          <tr key={log.id} className="hover:bg-teal-50/30">
                            <td className="py-2 px-4 font-mono text-[11px] text-gray-600">
                              {new Date(log.waktu).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </td>
                            <td className="py-2 px-4 font-mono font-bold text-teal-800">{log.kodeAset}</td>
                            <td className="py-2 px-4 font-bold text-slate-900">{log.namaAset}</td>
                            <td className="py-2 px-4 text-slate-700 font-medium">{log.prosedur}</td>
                            <td className="py-2 px-4 font-semibold text-slate-900">
                              {log.pasien} <span className="font-mono text-gray-400 font-normal">({log.noRM})</span>
                            </td>
                            <td className="py-2 px-4 text-slate-600">{log.poli}</td>
                            <td className="py-2 px-4 text-gray-500 font-medium">{log.pelaksana}</td>
                            <td className="py-2 px-4 font-mono font-bold text-right text-emerald-800">
                              Rp {(log.tarif || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: KINERJA DOKTER & PERAWAT (PELAYANAN KLINIS)
             ========================================================================= */}
          {activeTab === 'kinerja_nakes' && (
            <div className="space-y-6">
              {/* 4 Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nakes Aktif Melayani</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {reportData.ringkasan?.nakesAktifCount || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      / {reportData.ringkasan?.totalNakesTerdaftar || 0} Tenaga
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Dokter &amp; perawat yang memiliki catatan layanan pada periode ini
                  </p>
                </div>

                <div className="bg-white p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pelayanan Klinis</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-700 font-mono">
                      {reportData.ringkasan?.totalLayananKlinis || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Aktivitas</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Akumulasi RME, tindakan medis, resep farmasi &amp; skrining
                  </p>
                </div>

                <div className="bg-white p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Konsultasi &amp; RME Dokter</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-700 font-mono">
                      {reportData.ringkasan?.totalPemeriksaanRme || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Pasien</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Pemeriksaan klinis dan pengisian rekam medis elektronik oleh dokter
                  </p>
                </div>

                <div className="bg-white p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tindakan &amp; Skrining</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                    <span className="text-lg font-black text-emerald-700">
                      {reportData.ringkasan?.totalTindakanMedis || 0}
                    </span>
                    <span className="text-xs text-gray-400">Tdk /</span>
                    <span className="text-lg font-black text-teal-700">
                      {reportData.ringkasan?.totalSkriningPerawat || 0}
                    </span>
                    <span className="text-xs text-gray-400">Skr</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Prosedur klinis medis dan skrining tanda-tanda vital oleh perawat
                  </p>
                </div>
              </div>

              {/* TABEL BUKU REKAPITULASI KINERJA PELAYANAN KLINIS */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 bg-slate-50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      Buku Rekapitulasi Kinerja Pelayanan Klinis Tenaga Medis
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {nakesFilterMode === 'aktif'
                        ? 'Menampilkan HANYA tenaga medis yang memiliki kontribusi/transaksi pelayanan pada rentang tanggal terpilih'
                        : 'Menampilkan seluruh daftar tenaga medis terdaftar di fasilitas kesehatan'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2.5 py-1">
                      {(reportData.daftarKinerjaNakes || [])
                        .filter((r: any) => !nakesSearch || r.nama.toLowerCase().includes(nakesSearch.toLowerCase()))
                        .length} Tenaga Ditampilkan
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {((reportData.daftarKinerjaNakes || [])
                    .filter((r: any) => !nakesSearch || r.nama.toLowerCase().includes(nakesSearch.toLowerCase()))
                  ).length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-xs font-medium">
                      <UserCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      Tidak ada tenaga medis yang memenuhi kriteria filter atau memiliki riwayat pelayanan pada periode ini.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Tenaga Medis &amp; Kredensial</th>
                          <th className="py-3 px-4 w-32">Profesi</th>
                          <th className="py-3 px-4 w-36">Unit / Poli</th>
                          <th className="py-3 px-4 w-28 text-center">Konsultasi RME</th>
                          <th className="py-3 px-4 w-28 text-center">Tindakan Klinis</th>
                          <th className="py-3 px-4 w-24 text-center">Resep Obat</th>
                          <th className="py-3 px-4 w-28 text-center">Skrining &amp; TTV</th>
                          <th className="py-3 px-4 w-32 text-right">Total Aktivitas</th>
                          <th className="py-3 px-4 w-28 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.daftarKinerjaNakes || [])
                          .filter((r: any) => !nakesSearch || r.nama.toLowerCase().includes(nakesSearch.toLowerCase()))
                          .map((row: any, idx: number) => {
                            const isAktif = row.adaTransaksi || row.totalAktivitas > 0;
                            return (
                              <tr key={row.id} className={isAktif ? 'hover:bg-purple-50/40 bg-white' : 'hover:bg-slate-50 bg-slate-50/40 text-gray-500'}>
                                <td className="py-3 px-4 text-center font-mono font-medium text-gray-500">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="font-extrabold text-slate-900 text-xs">{row.nama}</div>
                                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    {row.nomorSip !== '-' ? `SIP: ${row.nomorSip}` : (row.nomorStr !== '-' ? `STR: ${row.nomorStr}` : row.statusKepegawaian)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                                    row.role === 'DOKTER' || row.role === 'DOKTER_UGD'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {row.profesi}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{row.poli}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-blue-900">
                                  {row.jumlahRme > 0 ? (
                                    <span className="inline-block bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                                      {row.jumlahRme} Pasien
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 font-normal">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-900">
                                  {row.jumlahTindakan > 0 ? (
                                    <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                      {row.jumlahTindakan} Prosedur
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 font-normal">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-amber-900">
                                  {row.jumlahResep > 0 ? (
                                    <span className="inline-block bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold">
                                      {row.jumlahResep} Resep
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 font-normal">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-indigo-900">
                                  {row.jumlahScreening > 0 ? (
                                    <span className="inline-block bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-bold">
                                      {row.jumlahScreening} Pasien
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 font-normal">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-sm text-purple-950">
                                  {row.totalAktivitas}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isAktif ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" /> Aktif
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">Belum Ada Layanan</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* JURNAL LOG AKTIVITAS PELAYANAN MEDIS (AUDIT TRAIL) */}
              <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-purple-600" />
                      Jurnal Catatan Log Aktivitas Klinis Pasien (Audit Trail Pelayanan)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Catatan kronologis setiap tindakan konsultasi RME, prosedur klinis, resep, dan skrining tanda-tanda vital oleh nakes
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2.5 py-1">
                    {(reportData.logAktivitasNakes || []).length} Log Pelayanan
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {(reportData.logAktivitasNakes || []).length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-medium">
                      Belum ada catatan aktivitas pelayanan klinis pada rentang tanggal terpilih.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-4 w-36">Waktu Layanan</th>
                          <th className="py-2.5 px-4 w-32">Kategori Layanan</th>
                          <th className="py-2.5 px-4 w-48">Tenaga Medis</th>
                          <th className="py-2.5 px-4 w-44">Pasien (No. RM)</th>
                          <th className="py-2.5 px-4 w-32">Poliklinik / Unit</th>
                          <th className="py-2.5 px-4">Rincian Aktivitas Klinis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(reportData.logAktivitasNakes || []).map((log: any) => (
                          <tr key={log.id} className="hover:bg-purple-50/30">
                            <td className="py-2 px-4 font-mono text-[11px] text-gray-600">
                              {new Date(log.waktu).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                log.jenis === 'PEMERIKSAAN_DOKTER'
                                  ? 'bg-blue-100 text-blue-800'
                                  : log.jenis === 'TINDAKAN_MEDIS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.jenis === 'PENULISAN_RESEP'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {log.labelJenis}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-slate-900">{log.nakesNama}</td>
                            <td className="py-2 px-4 font-semibold text-slate-900">
                              {log.pasien} <span className="font-mono text-gray-400 font-normal">({log.noRM})</span>
                            </td>
                            <td className="py-2 px-4 text-slate-600">{log.poli}</td>
                            <td className="py-2 px-4 text-slate-700 font-medium">{log.keterangan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL CETAK DOKUMEN LAPORAN RESMI (A4) ── */}
      {isCetakModalOpen && reportData && (
        <CetakDokumenLaporanModal
          isOpen={isCetakModalOpen}
          onClose={() => setIsCetakModalOpen(false)}
          activeTab={activeTab}
          data={reportData}
          filterParams={{
            periode: periodType,
            startDate,
            endDate,
            poliklinikName: getPoliName()
          }}
        />
      )}

    </div>
  );
}

