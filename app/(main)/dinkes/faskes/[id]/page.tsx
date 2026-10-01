"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  RefreshCw,
  Activity,
  Users,
  BedDouble,
  Stethoscope,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ThermometerSnowflake,
  Pill,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Wrench,
  Layers,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  HelpCircle,
  Box,
  Flame,
  Check
} from 'lucide-react';
import { dinkesService, FaskesDetailData } from '../../../../../services/dinkes.service';

const getAsetImageUrl = (asset: any) => {
  if (asset.gambarUrl) return asset.gambarUrl;
  const name = (asset.namaAset || '').toLowerCase();
  const code = (asset.kodeAset || '').toLowerCase();
  if (name.includes('tensi') || code.includes('tns')) return '/images/aset/tensimeter.jpg';
  if (name.includes('ekg') || name.includes('ecg')) return '/images/aset/ekg.jpg';
  if (name.includes('dental') || name.includes('gigi') || name.includes('autoclave')) return '/images/aset/dental.jpg';
  if (name.includes('defibril') || name.includes('aed') || name.includes('suct')) return '/images/aset/defibrillator.jpg';
  if (name.includes('kulk') || name.includes('refrig') || name.includes('tcw') || name.includes('cold')) return '/images/aset/kulkas.jpg';
  return '/images/aset/usg.jpg';
};

export default function DinkesFaskesDetailPage() {
  const params = useParams();
  const faskesId = params?.id as string;

  const [data, setData] = useState<FaskesDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sarpras' | 'sdmk' | 'kunjungan' | 'surveilans' | 'ruangan' | 'farmasi'>('sarpras');

  // Filter/Search states inside tabs
  const [assetSearch, setAssetSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'MEDIS' | 'NON_MEDIS' | 'RUSAK' | 'KALIBRASI'>('ALL');
  const [sdmkSearch, setSdmkSearch] = useState('');
  const [vaksinSearch, setVaksinSearch] = useState('');
  const [kunjunganSearch, setKunjunganSearch] = useState('');
  const [kunjunganPoliFilter, setKunjunganPoliFilter] = useState('ALL');
  const [kunjunganStatusFilter, setKunjunganStatusFilter] = useState('ALL');
  const [expandedKunjunganDiag, setExpandedKunjunganDiag] = useState<Record<string, boolean>>({});

  // Logistics Tab Filters
  const [logistikTab, setLogistikTab] = useState<'ALL' | 'OBAT' | 'BMHP' | 'VAKSIN'>('ALL');
  const [logistikSearch, setLogistikSearch] = useState('');
  const [logistikKritisOnly, setLogistikKritisOnly] = useState(false);

  const toggleDiagnosisExpand = (kunjunganId: string) => {
    setExpandedKunjunganDiag(prev => ({
      ...prev,
      [kunjunganId]: !prev[kunjunganId]
    }));
  };

  const fetchDetail = async () => {
    if (!faskesId) return;
    try {
      setLoading(true);
      const res = await dinkesService.getFaskesDetailById(faskesId);
      setData(res);
    } catch (err) {
      console.error('Gagal mengambil data detail faskes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [faskesId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <Building2 className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">Menyiapkan Dossier & Profil Faskes</h2>
          <p className="text-xs text-slate-500">Mengagregasi data sarpras, SDMK, BOR, farmasi, dan surveilans...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.profil) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Fasilitas Kesehatan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6">
          Data faskes dengan identifikasi ID ini tidak ditemukan atau belum terdaftar dalam sistem daerah.
        </p>
        <Link
          href="/dinkes/faskes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Master Faskes
        </Link>
      </div>
    );
  }

  const { profil, ringkasanEksekutif, asetAlkes, sdmk, tempatTidurRuangan, pelayananKlinis, logistik, surveilans } = data;

  // Filtered Assets
  const filteredAssets = (asetAlkes?.daftarAset || []).filter((item: any) => {
    const matchSearch =
      item.namaAset?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      item.kodeAset?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      item.ruangan?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      item.merk?.toLowerCase().includes(assetSearch.toLowerCase());

    if (!matchSearch) return false;
    if (assetFilter === 'MEDIS') return item.kategoriAset?.startsWith('MEDIS_');
    if (assetFilter === 'NON_MEDIS') return !item.kategoriAset?.startsWith('MEDIS_');
    if (assetFilter === 'RUSAK') return item.kondisiAset === 'RUSAK_BERAT' || item.statusOperasional === 'DALAM_PERBAIKAN';
    if (assetFilter === 'KALIBRASI') return item.kalibrasiExpired !== null;
    return true;
  });

  // Filtered SDMK
  const filteredSdmk = (sdmk?.daftarNakes || []).filter((item: any) => {
    return (
      item.namaLengkap?.toLowerCase().includes(sdmkSearch.toLowerCase()) ||
      item.profesi?.toLowerCase().includes(sdmkSearch.toLowerCase()) ||
      item.noSip?.toLowerCase().includes(sdmkSearch.toLowerCase())
    );
  });

  // Filtered Logistics (Obat, BMHP, Vaksin)
  const allObatList = logistik?.daftarObat || [];
  const allBmhpList = logistik?.daftarBmhp || [];
  const allVaksinList = logistik?.daftarVaksin || [];

  const filteredObatBmhp = [...allObatList, ...allBmhpList].filter((item: any) => {
    const matchSearch =
      item.namaObat?.toLowerCase().includes(logistikSearch.toLowerCase()) ||
      item.kodeObat?.toLowerCase().includes(logistikSearch.toLowerCase()) ||
      item.noBatch?.toLowerCase().includes(logistikSearch.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(logistikSearch.toLowerCase());

    if (!matchSearch) return false;
    if (logistikTab === 'OBAT' && item.kategori === 'BMHP') return false;
    if (logistikTab === 'BMHP' && item.kategori !== 'BMHP') return false;
    if (logistikKritisOnly && item.statusStok === 'AMAN') return false;
    return true;
  });

  const filteredVaksin = allVaksinList.filter((item: any) => {
    const matchSearch =
      item.namaVaksin?.toLowerCase().includes((logistikSearch || vaksinSearch).toLowerCase()) ||
      item.noBatch?.toLowerCase().includes((logistikSearch || vaksinSearch).toLowerCase()) ||
      item.targetPenyakit?.toLowerCase().includes((logistikSearch || vaksinSearch).toLowerCase());

    if (!matchSearch) return false;
    if (logistikKritisOnly && item.statusStok === 'AMAN') return false;
    return true;
  });

  // Filtered Kunjungan Pasien
  const filteredKunjungan = (pelayananKlinis?.daftarKunjungan || []).filter((item: any) => {
    const matchSearch =
      item.namaPasien?.toLowerCase().includes(kunjunganSearch.toLowerCase()) ||
      item.noRM?.toLowerCase().includes(kunjunganSearch.toLowerCase()) ||
      item.noAntrian?.toLowerCase().includes(kunjunganSearch.toLowerCase()) ||
      item.namaDokter?.toLowerCase().includes(kunjunganSearch.toLowerCase()) ||
      item.namaPoli?.toLowerCase().includes(kunjunganSearch.toLowerCase());

    if (!matchSearch) return false;
    if (kunjunganPoliFilter !== 'ALL' && item.poliId !== kunjunganPoliFilter && item.kodePoli !== kunjunganPoliFilter) {
      return false;
    }
    if (kunjunganStatusFilter !== 'ALL' && item.statusKunjungan !== kunjunganStatusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link href="/dinkes" className="hover:text-emerald-700 transition-colors">
              Dashboard Dinkes
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/dinkes/faskes" className="hover:text-emerald-700 transition-colors">
              Master Faskes
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">{profil.namaFaskes}</span>
          </div>

          <Link
            href="/dinkes/faskes"
            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 tracking-wide transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Daftar Faskes
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDetail}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            Perbarui Data
          </button>
        </div>
      </div>

      {/* 1. KARTU RINGKASAN CEPAT (HEADER SUMMARY) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Strip Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-mono font-black tracking-wider bg-white/15 text-emerald-100 rounded-md backdrop-blur-xs border border-white/20">
                  KODE FASKES: {profil.kodeFaskes}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-extrabold rounded-md flex items-center gap-1.5 shadow-xs ${
                    profil.statusAktif
                      ? 'bg-emerald-400 text-emerald-950 ring-2 ring-emerald-300/40'
                      : 'bg-rose-400 text-rose-950 ring-2 ring-rose-300/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  IZIN OPERASIONAL: {profil.statusAktif ? 'AKTIF BEROPERASI' : 'NON-AKTIF / DICABUT'}
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-teal-500/25 text-teal-100 rounded-md border border-teal-300/30">
                  {profil.jenisFaskes?.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/25 text-amber-100 rounded-md border border-amber-300/30">
                  WILAYAH {profil.kategoriWilayah}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-emerald-300 shrink-0" />
                  {profil.namaFaskes}
                </h1>
                <p className="text-emerald-100/90 text-sm mt-1 max-w-3xl flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                  {profil.alamat || 'Alamat belum diisi'}, Kec. {profil.kecamatan}
                  {profil.desaKelurahan ? `, Kel. ${profil.desaKelurahan}` : ''}, {profil.kabupatenKota || 'Kabupaten Bogor'}
                </p>
              </div>

              {/* Administrative Identity Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-emerald-100/90 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase text-emerald-200 block font-semibold">Kepala Puskesmas</span>
                    <span className="font-bold text-white">{profil.kepalaPuskesmas || '-'}</span>
                    <span className="block text-[10px] text-emerald-200/80">
                      {profil.nipKepala ? `NIP: ${profil.nipKepala}` : 'NIP: -'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase text-emerald-200 block font-semibold">Kontak Layanan</span>
                    <span className="font-semibold text-white">{profil.noTelepon || '-'}</span>
                    <span className="block text-[10px] text-emerald-200/80">{profil.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase text-emerald-200 block font-semibold">SATUSEHAT IHS Org ID</span>
                    <span className="font-mono font-bold text-white tracking-wide">
                      {profil.ihsOrganizationId || 'Belum Terhubung'}
                    </span>
                    <span className="block text-[10px] text-emerald-200/80">Kemenkes RI Interoperable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick KPI Overview Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[260px] text-xs space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-emerald-200 font-medium">Beban Kerja SDMK</span>
                <span
                  className={`px-2 py-0.5 rounded font-black text-[11px] ${
                    ringkasanEksekutif.statusBebanKerja === 'KRITIS_TINGGI'
                      ? 'bg-rose-500 text-white'
                      : ringkasanEksekutif.statusBebanKerja === 'TINGGI'
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-emerald-400 text-emerald-950'
                  }`}
                >
                  {ringkasanEksekutif.statusBebanKerja}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-emerald-200 font-medium">Bed Occupancy Rate (BOR)</span>
                <span className="font-black text-white text-sm">{ringkasanEksekutif.bor}</span>
              </div>

              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    ringkasanEksekutif.borAngka > 85
                      ? 'bg-rose-400'
                      : ringkasanEksekutif.borAngka > 60
                      ? 'bg-amber-400'
                      : 'bg-emerald-300'
                  }`}
                  style={{ width: `${Math.min(ringkasanEksekutif.borAngka, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center">
                <div>
                  <span className="text-[10px] text-emerald-200 block">Kunjungan Bulan Ini</span>
                  <span className="font-extrabold text-white text-base">{ringkasanEksekutif.totalPasienBulanIni}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200 block">Dosis Cold-Chain</span>
                  <span className="font-extrabold text-white text-base">{ringkasanEksekutif.totalDosisVaksin}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Tenaga Medis</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-slate-900">{ringkasanEksekutif.totalNakes}</span>
              <span className="text-slate-500 font-medium">Nakes</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{ringkasanEksekutif.totalDokter} Dokter Aktif</span>
          </div>

          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kapasitas Rawat Inap</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-slate-900">{ringkasanEksekutif.totalBed}</span>
              <span className="text-slate-500 font-medium">Bed Fisik</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              {ringkasanEksekutif.bedTersedia} Bed Siap Pakai
            </span>
          </div>

          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kesiapan Aset & Alkes</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-slate-900">{ringkasanEksekutif.totalAset}</span>
              <span className="text-slate-500 font-medium">Unit</span>
            </div>
            <span className={`text-[10px] font-bold mt-0.5 block ${ringkasanEksekutif.alkesKritisRusakCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {ringkasanEksekutif.alkesKritisRusakCount} Rusak Berat
            </span>
          </div>

          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kalibrasi BPFK</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-black ${ringkasanEksekutif.kalibrasiExpiredCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {ringkasanEksekutif.kalibrasiExpiredCount}
              </span>
              <span className="text-slate-500 font-medium">Kadaluwarsa</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Kepatuhan Kemenkes</span>
          </div>

          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Stok Obat & BMHP Kritis</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-black ${ringkasanEksekutif.obatKritisCount + ringkasanEksekutif.bmhpKritisCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {ringkasanEksekutif.obatKritisCount + ringkasanEksekutif.bmhpKritisCount}
              </span>
              <span className="text-slate-500 font-medium">Item</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {ringkasanEksekutif.obatKritisCount} Obat • {ringkasanEksekutif.bmhpKritisCount} BMHP
            </span>
          </div>

          <div className="p-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kulkas Cold-Chain</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-blue-600">{ringkasanEksekutif.totalDosisVaksin}</span>
              <span className="text-slate-500 font-medium">Dosis</span>
            </div>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">❄️ 2°C - 8°C Stabil</span>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sarpras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'sarpras'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Kesiapan Aset, Sarpras & Kelaikan Alkes
          {ringkasanEksekutif.alkesKritisRusakCount > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black">
              {ringkasanEksekutif.alkesKritisRusakCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sdmk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'sdmk'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Sumber Daya Manusia Kesehatan (SDMK)
          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px]">
            {sdmk?.totalNakes || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kunjungan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'kunjungan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Trafik Kunjungan & Poli
        </button>

        <button
          onClick={() => setActiveTab('surveilans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'surveilans'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          Surveilans & Deteksi KLB
        </button>

        <button
          onClick={() => setActiveTab('ruangan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'ruangan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          Kapasitas Bed & BOR ({ringkasanEksekutif.bor})
        </button>

        <button
          onClick={() => setActiveTab('farmasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'farmasi'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          Logistik Farmasi & Vaksin
          {ringkasanEksekutif.obatKritisCount + ringkasanEksekutif.bmhpKritisCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
              {ringkasanEksekutif.obatKritisCount + ringkasanEksekutif.bmhpKritisCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: KESIAPAN ASET, SARPRAS & KELAIKAN ALKES */}
      {activeTab === 'sarpras' && (
        <div className="space-y-6">
          {/* Critical Patient Safety Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block">Patient Safety Compliance & Standar ASPAK Kemenkes</span>
              Kelaikan alat medis wajib diuji berkala melalui sertifikasi kalibrasi BPFK. Alkes berstatus Rusak Berat
              atau Melebihi Batas Kalibrasi dilarang digunakan untuk prosedur klinis langsung ke pasien.
            </div>
          </div>

          {/* Cards Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Kategori Alkes</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-slate-900">{asetAlkes?.totalAlkesMedis || 0}</span>
                <span className="text-xs text-slate-500">Medis</span>
                <span className="text-slate-300">/</span>
                <span className="text-lg font-bold text-slate-700">{asetAlkes?.totalNonMedis || 0}</span>
                <span className="text-xs text-slate-500">Non-Medis</span>
              </div>
              <div className="mt-3 flex gap-1">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                  ASPAK Terdaftar
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Kondisi Fisik</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-emerald-600">{asetAlkes?.kondisi?.baik || 0}</span>
                <span className="text-xs text-emerald-700 font-semibold mr-2">Baik</span>
                <span className="text-lg font-bold text-amber-600">{asetAlkes?.kondisi?.rusakRingan || 0}</span>
                <span className="text-xs text-amber-700 font-semibold mr-2">Ringan</span>
                <span className="text-lg font-bold text-rose-600">{asetAlkes?.kondisi?.rusakBerat || 0}</span>
                <span className="text-xs text-rose-700 font-semibold">Berat</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                Afkir: <span className="font-bold text-slate-800">{asetAlkes?.kondisi?.afkir || 0} unit</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Status Operasional</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-blue-600">{asetAlkes?.statusOperasional?.aktif || 0}</span>
                <span className="text-xs text-slate-500">Aktif Digunakan</span>
              </div>
              <div className="mt-3 flex gap-2 text-[11px]">
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                  {asetAlkes?.statusOperasional?.dalamPerbaikan || 0} Dalam Servis
                </span>
                <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                  {asetAlkes?.statusOperasional?.dalamKalibrasi || 0} Kalibrasi
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Peringatan Kalibrasi BPFK</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-black ${(asetAlkes?.kalibrasiAlerts || []).length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(asetAlkes?.kalibrasiAlerts || []).length}
                </span>
                <span className="text-xs text-slate-500">Perlu Tindakan</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                {(asetAlkes?.kalibrasiAlerts || []).length > 0 ? (
                  <span className="text-rose-600 font-bold">Segera ajukan kalibrasi ke BPFK</span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Seluruh sertifikat valid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Kalibrasi Alerts Table (If any) */}
          {(asetAlkes?.kalibrasiAlerts || []).length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h4 className="font-bold text-rose-900 text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Daftar Alkes yang Membutuhkan Kalibrasi Ulang (Critical)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-rose-100/70 text-rose-900 font-bold">
                    <tr>
                      <th className="p-2.5">Kode Aset</th>
                      <th className="p-2.5">Nama Alkes</th>
                      <th className="p-2.5">Ruangan</th>
                      <th className="p-2.5">Status Kalibrasi</th>
                      <th className="p-2.5">Tanggal Berakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-200">
                    {asetAlkes.kalibrasiAlerts.map((k: any, idx: number) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-2.5 font-mono font-bold">{k.kodeAset}</td>
                        <td className="p-2.5 font-bold text-slate-900">{k.namaAset}</td>
                        <td className="p-2.5 text-slate-600">{k.ruangan || '-'}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {k.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono">
                          {new Date(k.expiredDate).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Asset Inventory Filter & Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Inventaris Sarana, Prasarana & Alkes</h3>
                <p className="text-xs text-slate-500">Seluruh aset teregistrasi dalam master inventaris faskes.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari aset / merk..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value as any)}
                  className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-semibold"
                >
                  <option value="ALL">Semua Aset</option>
                  <option value="MEDIS">Alkes Medis</option>
                  <option value="NON_MEDIS">Non-Medis</option>
                  <option value="RUSAK">Rusak / Servis</option>
                  <option value="KALIBRASI">Ada Jadwal Kalibrasi</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3 w-16 text-center">Foto</th>
                    <th className="p-3">Kode Aset</th>
                    <th className="p-3">Nama Alat & Spesifikasi</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Ruangan / Penempatan</th>
                    <th className="p-3">Kondisi</th>
                    <th className="p-3">Status Operasional</th>
                    <th className="p-3">Kode ASPAK / IHS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada aset yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset: any) => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 mx-auto shadow-2xs group">
                            <img
                              src={getAsetImageUrl(asset)}
                              alt={asset.namaAset}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/aset/usg.jpg';
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">{asset.kodeAset}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{asset.namaAset}</span>
                          <span className="text-[11px] text-slate-500">
                            {asset.merk ? `Merk: ${asset.merk} ` : ''}{asset.tipeModel ? `• Model: ${asset.tipeModel} ` : ''}
                            {asset.nomorSeri ? `• SN: ${asset.nomorSeri}` : ''}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asset.kategoriAset?.startsWith('MEDIS_')
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {asset.kategoriAset?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{asset.ruangan || '-'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asset.kondisiAset === 'BAIK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : asset.kondisiAset === 'RUSAK_RINGAN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {asset.kondisiAset?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asset.statusOperasional === 'AKTIF_DIGUNAKAN'
                                ? 'bg-blue-50 text-blue-700'
                                : asset.statusOperasional === 'DALAM_PERBAIKAN'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {asset.statusOperasional?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {asset.kodeAspak ? (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                              ASPAK: {asset.kodeAspak}
                            </span>
                          ) : (
                            <span className="text-slate-400">Belum dipetakan</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUMBER DAYA MANUSIA KESEHATAN (SDMK) */}
      {activeTab === 'sdmk' && (
        <div className="space-y-6">
          {/* SDMK Aggregate Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Dokter Umum / Gigi</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{sdmk?.totalDokter || 0}</span>
                <span className="text-xs text-slate-500">Orang</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-2 block">Pemberi Layanan Klinis</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Perawat</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{sdmk?.totalPerawat || 0}</span>
                <span className="text-xs text-slate-500">Orang</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">Asuhan Keperawatan</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Bidan</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{sdmk?.totalBidan || 0}</span>
                <span className="text-xs text-slate-500">Orang</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">KIA / KB & Persalinan</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Apoteker & Farmasi</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{sdmk?.totalApoteker || 0}</span>
                <span className="text-xs text-slate-500">Orang</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">Pengelolaan Obat & BMHP</span>
            </div>
          </div>

          {/* Workload Ratio Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">Analisis Rasio Pelayanan Pasien per Dokter</h4>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-black ${
                    ringkasanEksekutif.statusBebanKerja === 'KRITIS_TINGGI'
                      ? 'bg-rose-100 text-rose-800'
                      : ringkasanEksekutif.statusBebanKerja === 'TINGGI'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  STATUS: {ringkasanEksekutif.statusBebanKerja}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dihitung dari total kunjungan bulan berjalan ({ringkasanEksekutif.totalPasienBulanIni} pasien) dibagi jumlah dokter aktif ({sdmk?.totalDokter || 1} dokter).
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Rasio Saat Ini</span>
                <span className="text-2xl font-black text-slate-900">
                  1 : {ringkasanEksekutif.rasioPasienPerDokter}
                </span>
                <span className="text-[10px] text-slate-500 block">pasien/dokter</span>
              </div>

              <div className="w-px h-10 bg-slate-200" />

              <div className="text-xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Rekomendasi Dinas:</span>
                <span className="font-semibold text-slate-800">
                  {ringkasanEksekutif.statusBebanKerja === 'KRITIS_TINGGI'
                    ? '⚠️ Perlu penambahan atau mutasi dokter tambahan.'
                    : ringkasanEksekutif.statusBebanKerja === 'TINGGI'
                    ? '⚠️ Beban kerja padat, pantau jam operasional poli.'
                    : '✅ Kapasitas pelayanan dalam kondisi optimal.'}
                </span>
              </div>
            </div>
          </div>

          {/* Medical Staff Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Roster & Profil Tenaga Medis Faskes</h3>
                <p className="text-xs text-slate-500">Daftar dokter, perawat, dan tenaga kesehatan bersertifikat.</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nakes / profesi..."
                  value={sdmkSearch}
                  onChange={(e) => setSdmkSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Nama Lengkap & NIK</th>
                    <th className="p-3">Profesi / Keahlian</th>
                    <th className="p-3">Nomor SIP (Surat Izin Praktik)</th>
                    <th className="p-3">SATUSEHAT IHS Number</th>
                    <th className="p-3">Status Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSdmk.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Tidak ada data tenaga medis yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredSdmk.map((nakes: any) => (
                      <tr key={nakes.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{nakes.namaLengkap}</span>
                          <span className="text-[11px] text-slate-400 font-mono">NIK: {nakes.nik || '-'}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                            {nakes.profesi?.replace(/_/g, ' ')}
                          </span>
                          {nakes.spesialis && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">Spesialisasi: {nakes.spesialis}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {nakes.noSip ? nakes.noSip : (nakes.nomorStr ? `STR: ${nakes.nomorStr}` : '-')}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {nakes.noIhs ? (
                            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {nakes.noIhs}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" /> Bertugas Aktif
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
      )}

      {/* TAB 3: TRAFIK KUNJUNGAN & POLIKLINIK */}
      {activeTab === 'kunjungan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Kunjungan Hari Ini</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{pelayananKlinis?.totalPasienHariIni || 0}</span>
                <span className="text-xs text-slate-500">Pasien</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                Target Harian: {profil.targetKunjunganHarian || 100} Pasien
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Kunjungan Bulan Berjalan</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600">{pelayananKlinis?.totalPasienBulanIni || 0}</span>
                <span className="text-xs text-slate-500">Pasien</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">
                Tercatat pada Rekam Medis Elektronik
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Akumulasi Sepanjang Waktu</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{pelayananKlinis?.totalKunjunganAllTime || 0}</span>
                <span className="text-xs text-slate-500">Total Kunjungan</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">Basis Data SIKDA Kabupaten</span>
            </div>
          </div>

          {/* Poliklinik Utilization Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Utilisasi Layanan Berdasarkan Poliklinik</h3>
                <p className="text-xs text-slate-500">Distribusi beban kerja pelayanan poliklinik di faskes ini. Klik kartu poli untuk memfilter tabel kunjungan di bawah.</p>
              </div>
              {kunjunganPoliFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setKunjunganPoliFilter('ALL')}
                  className="text-xs text-emerald-600 font-bold hover:underline self-start sm:self-auto"
                >
                  ✕ Reset Filter Poli
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {(pelayananKlinis?.polikliniks || []).length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  Belum ada poliklinik terdaftar pada faskes ini.
                </div>
              ) : (
                pelayananKlinis.polikliniks.map((poli: any) => {
                  const isFiltered = kunjunganPoliFilter === poli.id || kunjunganPoliFilter === poli.kodePoli;
                  return (
                    <div
                      key={poli.id}
                      onClick={() => setKunjunganPoliFilter(isFiltered ? 'ALL' : poli.id)}
                      className={`p-4 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                        isFiltered
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200/90 bg-slate-50 hover:bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {poli.kodePoli && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {poli.kodePoli}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 text-sm">{poli.namaPoli}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                          poli.totalKunjungan > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {poli.totalKunjungan} Pasien
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {poli.deskripsi || 'Layanan pemeriksaan kesehatan rawat jalan dan penanganan medis poli.'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TABEL DETAIL DAFTAR KUNJUNGAN PASIEN DI FASKES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Daftar Pasien & Riwayat Kunjungan Faskes
                </h3>
                <p className="text-xs text-slate-500">
                  Data log registrasi dan riwayat pemeriksaan pasien untuk monitoring mutu, alur rujukan & pelaporan Dinkes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari pasien / RM / antrean..."
                    value={kunjunganSearch}
                    onChange={(e) => setKunjunganSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 w-44 sm:w-52"
                  />
                </div>

                {/* Filter Poli */}
                <select
                  value={kunjunganPoliFilter}
                  onChange={(e) => setKunjunganPoliFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-medium text-slate-700"
                >
                  <option value="ALL">Semua Poli</option>
                  {(pelayananKlinis?.polikliniks || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPoli} ({p.totalKunjungan})
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={kunjunganStatusFilter}
                  onChange={(e) => setKunjunganStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-medium text-slate-700"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SELESAI">Selesai</option>
                  <option value="DIPERIKSA">Sedang Diperiksa</option>
                  <option value="MENUNGGU_DOKTER">Menunggu Dokter</option>
                  <option value="MENUNGGU">Menunggu</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">No. Antrean & Waktu</th>
                    <th className="p-3">Identitas Pasien</th>
                    <th className="p-3">Poliklinik Tujuan</th>
                    <th className="p-3">Dokter Pemeriksa</th>
                    <th className="p-3">Diagnosis (ICD-10)</th>
                    <th className="p-3">Jaminan</th>
                    <th className="p-3 text-center">Status Pelayanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKunjungan.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada data kunjungan pasien yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKunjungan.map((k: any) => {
                      const waktuReg = k.tanggalRegistrasi ? new Date(k.tanggalRegistrasi) : null;
                      const waktuFormatted = waktuReg
                        ? waktuReg.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-';

                      return (
                        <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs block w-max">
                              {k.noAntrian || '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {waktuFormatted}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block text-sm">
                              {k.namaPasien || 'Pasien Anonim'}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-medium text-slate-700">RM: {k.noRM || '-'}</span>
                              {k.jenisKelamin && (
                                <>
                                  <span>•</span>
                                  <span>{k.jenisKelamin === 'L' || k.jenisKelamin?.toLowerCase().startsWith('l') ? 'Laki-laki' : 'Perempuan'}</span>
                                </>
                              )}
                              {k.usia !== null && (
                                <>
                                  <span>•</span>
                                  <span>{k.usia} thn</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 rounded text-[11px] inline-block">
                              {k.namaPoli}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-800 block">
                              {k.namaDokter}
                            </span>
                          </td>
                          <td className="p-3">
                            {(() => {
                              // Deduplikasi diagnosis secara defensif
                              const uniqueList: any[] = [];
                              const seen = new Set();
                              (k.diagnosis || []).forEach((d: any) => {
                                if (d.kode && !seen.has(d.kode)) {
                                  seen.add(d.kode);
                                  uniqueList.push(d);
                                }
                              });

                              if (uniqueList.length === 0) {
                                return <span className="text-[11px] text-slate-400 italic">Belum ada diagnosis</span>;
                              }

                              const isExpanded = !!expandedKunjunganDiag[k.id];
                              const listToRender = isExpanded ? uniqueList : uniqueList.slice(0, 2);

                              return (
                                <div className="space-y-1.5 min-w-[200px]">
                                  {listToRender.map((d: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded shrink-0">
                                        {d.kode}
                                      </span>
                                      <span className="text-[11px] text-slate-700 truncate max-w-[190px]" title={d.nama}>
                                        {d.nama}
                                      </span>
                                      {d.jenis && (
                                        <span className={`text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ${
                                          String(d.jenis).toUpperCase() === 'UTAMA'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {d.jenis}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {uniqueList.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleDiagnosisExpand(k.id)}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition cursor-pointer mt-0.5 shadow-2xs"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span>Tutup diagnosis</span>
                                          <ChevronUp className="w-3 h-3 text-sky-600" />
                                        </>
                                      ) : (
                                        <>
                                          <span>+{uniqueList.length - 2} diagnosis lainnya</span>
                                          <ChevronDown className="w-3 h-3 text-sky-600" />
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                k.jenisPembayaran?.toUpperCase() === 'BPJS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {k.jenisPembayaran || 'UMUM'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold ${
                                k.statusKunjungan === 'SELESAI'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : k.statusKunjungan === 'DIPERIKSA'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : k.statusKunjungan === 'MENUNGGU_DOKTER'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {k.statusKunjungan === 'SELESAI' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {k.statusKunjungan === 'DIPERIKSA' && <Activity className="w-3 h-3 text-blue-600 animate-pulse" />}
                              {k.statusKunjungan === 'MENUNGGU_DOKTER' && <Clock className="w-3 h-3 text-amber-600" />}
                              {k.statusKunjungan?.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Menampilkan {filteredKunjungan.length} dari {(pelayananKlinis?.daftarKunjungan || []).length} total kunjungan faskes</span>
              <span className="italic">Data real-time tersinkronisasi dengan RME faskes</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SURVEILANS EPIDEMIOLOGI & DETEKSI DINI WABAH */}
      {activeTab === 'surveilans' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-900 to-amber-900 text-white rounded-xl p-5 shadow-xs flex items-start gap-4">
            <Flame className="w-6 h-6 text-amber-300 shrink-0 mt-1" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm tracking-tight">Sistem Kewaspadaan Dini & Respon (SKDR) Dinkes</h4>
              <p className="text-xs text-amber-100/90">
                Peringatan dini penyebaran penyakit potensial Kejadian Luar Biasa (KLB). Penyakit menular atau wajib lapor
                diberikan tanda khusus untuk investigasi epidemiologi lapangan segera.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">10 Besar Penyakit Terbanyak (Top 10 Morbiditas ICD-10)</h3>
                <p className="text-xs text-slate-500">Berdasarkan diagnosis resmi dokter yang diinput ke rekam medis.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                Total Kasus Tercatat: {surveilans?.totalKasusFaskes || 0}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">Kode ICD-10</th>
                    <th className="p-3">Nama Diagnosis / Penyakit</th>
                    <th className="p-3">Klasifikasi Epidemiologi</th>
                    <th className="p-3 text-center">Jumlah Kasus</th>
                    <th className="p-3 text-right">Proporsi Kasus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(surveilans?.topPenyakit || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Belum ada data diagnosis pasien yang tercatat untuk faskes ini.
                      </td>
                    </tr>
                  ) : (
                    surveilans.topPenyakit.map((item: any) => (
                      <tr key={item.peringkat} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{item.peringkat}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{item.kodeIcd10}</td>
                        <td className="p-3 font-bold text-slate-900">{item.namaDiagnosis}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {item.isPenyakitMenular && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                ⚠️ MENULAR
                              </span>
                            )}
                            {item.isWajibLapor && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                WAJIB LAPOR SKDR
                              </span>
                            )}
                            {!item.isPenyakitMenular && !item.isWajibLapor && (
                              <span className="text-slate-400 text-[10px]">Non-Menular</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.jumlahKasus}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">{item.persentase}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KAPASITAS RUANGAN & TEMPAT TIDUR (BOR) */}
      {activeTab === 'ruangan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Total Bed Fisik</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{tempatTidurRuangan?.totalBed || 0}</span>
                <span className="text-xs text-slate-500">Unit</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {tempatTidurRuangan?.totalRuangan || 0} Ruangan Terdaftar
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Bed Terisi Saat Ini</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-blue-600">{tempatTidurRuangan?.bedTerisi || 0}</span>
                <span className="text-xs text-slate-500">Pasien Inap</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold mt-2 block">Sedang Dirawat</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Bed Kosong (Tersedia)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600">{tempatTidurRuangan?.bedTersedia || 0}</span>
                <span className="text-xs text-slate-500">Bed Siap Pakai</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">Dapat menerima pasien</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-bold uppercase block">Tingkat Okupansi (BOR)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-black ${
                    tempatTidurRuangan?.borAngka > 85
                      ? 'text-rose-600'
                      : tempatTidurRuangan?.borAngka > 60
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {tempatTidurRuangan?.bor || '0%'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">Standar Ideal Kemenkes: 60 - 85%</span>
            </div>
          </div>

          {/* Rooms and Beds Visualization */}
          <div className="space-y-4">
            {(tempatTidurRuangan?.daftarRuangan || []).length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada data ruangan atau tempat tidur rawat inap di faskes ini (Faskes Non-Rawat Inap).
              </div>
            ) : (
              tempatTidurRuangan.daftarRuangan.map((ruangan: any) => (
                <div key={ruangan.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{ruangan.namaRuangan}</h4>
                      <p className="text-xs text-slate-500">
                        {ruangan.gedung || 'Gedung Utama'} {ruangan.lantai ? `• Lantai ${ruangan.lantai}` : ''} • Kategori: {ruangan.kategoriRuangan}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg w-max">
                      Total: {ruangan.tempatTidurs?.length || 0} Tempat Tidur
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(ruangan.tempatTidurs || []).map((bed: any) => (
                      <div
                        key={bed.id}
                        className={`rounded-xl border overflow-hidden text-xs transition-all shadow-2xs hover:shadow-md bg-white group ${
                          bed.statusBed === 'TERISI'
                            ? 'border-blue-200 ring-1 ring-blue-100'
                            : bed.statusBed === 'PERBAIKAN'
                            ? 'border-rose-200 ring-1 ring-rose-100'
                            : 'border-emerald-200 ring-1 ring-emerald-100'
                        }`}
                      >
                        {/* Bed Photo Banner */}
                        <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={bed.gambarUrl || '/images/aset/bed.jpg'}
                            alt={bed.nomorBed}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/aset/bed.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                            <span className="font-black text-sm drop-shadow">{bed.nomorBed}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shadow-xs ${
                                bed.statusBed === 'TERISI'
                                  ? 'bg-blue-600 text-white'
                                  : bed.statusBed === 'PERBAIKAN'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {bed.statusBed}
                            </span>
                          </div>
                        </div>

                        {/* Bed Detail Info */}
                        <div className="p-3 text-[11px] space-y-1.5">
                          <div className="text-slate-600 font-medium">Kelas: {bed.kelasKamar || 'Kelas III'}</div>
                          {bed.pasienNama ? (
                            <div className="pt-1.5 border-t border-blue-100 font-bold text-slate-900">
                              Pasien: {bed.pasienNama}
                              <span className="block text-[10px] font-mono text-slate-500 font-normal">
                                RM: {bed.pasienNoRM}
                              </span>
                            </div>
                          ) : bed.statusBed === 'TERISI' ? (
                            <div className="pt-1.5 text-[10px] text-blue-700 font-semibold border-t border-slate-100">
                              Terisi (Rekam Medis belum terhubung)
                            </div>
                          ) : bed.statusBed === 'PERBAIKAN' ? (
                            <div className="pt-1.5 text-[10px] text-rose-700 font-semibold border-t border-slate-100">
                              Dalam pemeliharaan/perbaikan
                            </div>
                          ) : (
                            <div className="pt-1.5 text-[10px] text-emerald-700 font-semibold border-t border-slate-100">
                              Siap menerima pasien baru
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: LOGISTIK FARMASI, BMHP & RANTAI DINGIN VAKSIN */}
      {activeTab === 'farmasi' && (
        <div className="space-y-6">
          {/* Critical Warnings Banner */}
          {(logistik?.obatKritis?.length > 0 || logistik?.bmhpKritis?.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Peringatan Stok Kritis Farmasi & BMHP</span>
                Terdapat {logistik?.obatKritis?.length || 0} obat dan {logistik?.bmhpKritis?.length || 0} BMHP dengan sisa stok
                di bawah batas minimum safety stock. Dinkes dapat menginstruksikan droping buffer stock kabupaten.
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase block">Persediaan Obat Aktif</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-900">{allObatList.length}</span>
                    <span className="text-xs text-slate-500 font-medium">Jenis Obat</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 block ${logistik?.obatKritis?.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {logistik?.obatKritis?.length || 0} item kritis/menipis
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase block">BMHP (Bahan Habis Pakai)</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-900">{allBmhpList.length}</span>
                    <span className="text-xs text-slate-500 font-medium">Item BMHP</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 block ${logistik?.bmhpKritis?.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {logistik?.bmhpKritis?.length || 0} item kritis/menipis
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
                  <ThermometerSnowflake className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase block">Vaksin Cold-Chain</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-cyan-700">{logistik?.totalDosisVaksin || 0}</span>
                    <span className="text-xs text-slate-500 font-medium">Dosis Fisik</span>
                  </div>
                  <span className="text-[10px] text-cyan-800 font-semibold mt-1 block">
                    {allVaksinList.length} Batch Lot • Kulkas 2°C - 8°C
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Logistics Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setLogistikTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logistikTab === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Logistik ({allObatList.length + allBmhpList.length + allVaksinList.length})
              </button>
              <button
                onClick={() => setLogistikTab('OBAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logistikTab === 'OBAT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Obat ({allObatList.length})
              </button>
              <button
                onClick={() => setLogistikTab('BMHP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logistikTab === 'BMHP'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                BMHP ({allBmhpList.length})
              </button>
              <button
                onClick={() => setLogistikTab('VAKSIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logistikTab === 'VAKSIN'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vaksin Cold-Chain ({allVaksinList.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={logistikKritisOnly}
                  onChange={(e) => setLogistikKritisOnly(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className={logistikKritisOnly ? 'text-rose-600' : 'text-slate-600'}>
                  Hanya Stok Kritis
                </span>
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari obat, BMHP, batch..."
                  value={logistikSearch}
                  onChange={(e) => setLogistikSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* TABLE 1: KATALOG OBAT & BMHP */}
          {logistikTab !== 'VAKSIN' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Katalog Inventaris Persediaan Obat &amp; BMHP Faskes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar seluruh item obat dan bahan medis habis pakai yang tercatat pada master gudang faskes.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {filteredObatBmhp.length} Item Ditampilkan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3 w-16 text-center">Foto</th>
                      <th className="p-3">Kode &amp; Nama Barang</th>
                      <th className="p-3">Kategori &amp; Sediaan</th>
                      <th className="p-3">No. Batch</th>
                      <th className="p-3">Tanggal Expired</th>
                      <th className="p-3 text-right">Sisa Stok</th>
                      <th className="p-3 text-right">Safety Buffer</th>
                      <th className="p-3 text-center">Status Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObatBmhp.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Tidak ada obat atau BMHP yang sesuai kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredObatBmhp.map((item: any) => {
                        const isBmhp = item.kategori === 'BMHP';
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center">
                              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 mx-auto shadow-2xs group">
                                <img
                                  src={item.gambarUrl || (isBmhp ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg')}
                                  alt={item.namaObat}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = isBmhp ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg';
                                  }}
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{item.namaObat}</span>
                              <span className="text-[10px] font-mono text-slate-500">{item.kodeObat || '-'}</span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isBmhp
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {item.kategori}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">{item.sediaan || '-'}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{item.noBatch || '-'}</td>
                            <td className="p-3 font-mono text-slate-700">
                              {item.tanggalExpired ? new Date(item.tanggalExpired).toLocaleDateString('id-ID') : '-'}
                              {item.statusExpired === 'KADALUWARSA' && (
                                <span className="block text-[10px] font-bold text-red-600">KADALUWARSA</span>
                              )}
                              {item.statusExpired === 'SEGERA_KADALUWARSA' && (
                                <span className="block text-[10px] font-bold text-amber-600">FEFO: Segera Expired</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                              <span className={item.statusStok === 'KRITIS' || item.statusStok === 'HABIS' ? 'text-rose-600' : 'text-slate-900'}>
                                {item.stok}
                              </span>{' '}
                              <span className="text-xs font-normal text-slate-500">{item.sediaan || 'Pcs'}</span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-500">
                              {item.stokMinimum || 10} {item.sediaan || 'Pcs'}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                  item.statusStok === 'HABIS'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : item.statusStok === 'KRITIS'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {item.statusStok}
                              </span>
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

          {/* TABLE 2: KATALOG VAKSIN COLD-CHAIN */}
          {(logistikTab === 'ALL' || logistikTab === 'VAKSIN') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
                    Ketersediaan Vaksin &amp; Monitoring Suhu Cold-Chain (2°C - 8°C)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pelacakan FEFO (First Expired First Out) untuk menjamin potensi vaksin anak &amp; imunisasi rutin.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800">
                  {filteredVaksin.length} Batch Terdata
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3 w-16 text-center">Foto</th>
                      <th className="p-3">Nama Vaksin &amp; KFA</th>
                      <th className="p-3">Target Penyakit</th>
                      <th className="p-3">Nomor Batch</th>
                      <th className="p-3">Suhu Simpan</th>
                      <th className="p-3 text-right">Sisa Stok</th>
                      <th className="p-3">Tanggal Expired</th>
                      <th className="p-3 text-center">Status FEFO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVaksin.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Tidak ada persediaan vaksin yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredVaksin.map((vaksin: any) => (
                        <tr key={vaksin.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center">
                            <div className="w-12 h-12 rounded-lg bg-cyan-50 border border-cyan-200 overflow-hidden shrink-0 mx-auto shadow-2xs group relative">
                              <img
                                src={vaksin.gambarUrl || '/images/logistik/vaksin.jpg'}
                                alt={vaksin.namaVaksin}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/images/logistik/vaksin.jpg';
                                }}
                              />
                              <div className="absolute bottom-0 right-0 p-0.5 bg-cyan-600/90 text-white rounded-tl">
                                <ThermometerSnowflake className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{vaksin.namaVaksin}</span>
                            <span className="text-[10px] font-mono text-slate-400">KFA: {vaksin.kodeKfa || '-'}</span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{vaksin.targetPenyakit || '-'}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{vaksin.noBatch}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              ❄️ {vaksin.suhuPenyimpanan || '2-8°C'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                            <span className={vaksin.stok <= vaksin.stokMinimum ? 'text-rose-600' : 'text-slate-900'}>
                              {vaksin.stok}
                            </span>{' '}
                            <span className="text-xs font-normal text-slate-500">Dosis</span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {vaksin.tanggalExpired ? new Date(vaksin.tanggalExpired).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                vaksin.statusExpired === 'KADALUWARSA'
                                  ? 'bg-rose-100 text-rose-800'
                                  : vaksin.statusExpired === 'SEGERA_KADALUWARSA'
                                  ? 'bg-amber-100 text-amber-800'
                                  : vaksin.statusExpired === 'WASPADA'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {vaksin.statusExpired?.replace(/_/g, ' ')}
                              {vaksin.sisaHari !== null && vaksin.sisaHari > 0 ? ` (${vaksin.sisaHari} hari)` : ''}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
