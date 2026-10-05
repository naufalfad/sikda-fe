"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Activity,
  Stethoscope,
  Package,
  Pill,
  Syringe,
  AlertCircle,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Hospital,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface AdminModule {
  id: string;
  title: string;
  href: string;
  category: 'sdm' | 'fasilitas' | 'farmasi' | 'standar';
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
  colorScheme: {
    bg: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    borderHover: string;
  };
  highlight?: string;
}

const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'master-dokter',
    title: 'Master Dokter & Nakes',
    href: '/admin/master-dokter',
    category: 'sdm',
    categoryLabel: 'SDM & Tenaga Medis',
    description: 'Kelola akun dokter, dokter gigi, perawat, jadwal praktik, spesialisasi poli, dan sinkronisasi Practitioner IHS SATUSEHAT.',
    icon: Users,
    colorScheme: {
      bg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      text: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700 border-blue-200',
      borderHover: 'hover:border-blue-500'
    },
    highlight: 'Integrasi IHS NIK'
  },
  {
    id: 'master-pasien',
    title: 'Master Data Pasien',
    href: '/admin/master-pasien',
    category: 'sdm',
    categoryLabel: 'Data Pasien Induk',
    description: 'Pencatatan nomor rekam medis (No RM), identitas NIK kependudukan, sinkronisasi Patient IHS, dan riwayat pasien terdaftar.',
    icon: Users,
    colorScheme: {
      bg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      text: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700 border-indigo-200',
      borderHover: 'hover:border-indigo-500'
    },
    highlight: 'Data Kependudukan'
  },
  {
    id: 'master-klinik',
    title: 'Master Poliklinik & Layanan',
    href: '/admin/master-klinik',
    category: 'fasilitas',
    categoryLabel: 'Layanan Medis',
    description: 'Konfigurasi unit instalasi rawat jalan, daftar poliklinik spesialis, tarif tindakan dasar medis, dan alokasi layanan klinik.',
    icon: Stethoscope,
    colorScheme: {
      bg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      text: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700 border-emerald-200',
      borderHover: 'hover:border-emerald-500'
    },
    highlight: 'Struktur Pelayanan'
  },
  {
    id: 'aset-ruangan',
    title: 'Aset & Ruangan Faskes',
    href: '/admin/aset-ruangan',
    category: 'fasilitas',
    categoryLabel: 'Fasilitas & Sarpras',
    description: 'Inventarisasi alat kesehatan (alkes), kapasitas tempat tidur (TT) rawat inap, log mutasi, jadwal kalibrasi & pemeliharaan berkala.',
    icon: Package,
    colorScheme: {
      bg: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
      text: 'text-teal-600',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700 border-teal-200',
      borderHover: 'hover:border-teal-500'
    },
    highlight: 'Inventaris & Kalibrasi'
  },
  {
    id: 'logistik-apotek',
    title: 'Logistik Obat & Vaksin',
    href: '/apoteker/stok',
    category: 'farmasi',
    categoryLabel: 'Gudang Farmasi',
    description: 'Manajemen ketersediaan stok fisik obat, vaksin, BMHP di depo/gudang, kartu stok opname, dan pelacakan batch kedaluwarsa (ED).',
    icon: Package,
    colorScheme: {
      bg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700 border-amber-200',
      borderHover: 'hover:border-amber-500'
    },
    highlight: 'Stok Opname Real-time'
  },
  {
    id: 'master-obat',
    title: 'Master Katalog Obat',
    href: '/admin/master-obat',
    category: 'farmasi',
    categoryLabel: 'Katalog Medis',
    description: 'Kamus sediaan obat generik & paten, bentuk kemasan sediaan, dosis baku, pabrikan, dan pemetaan kode KFA SatuSehat.',
    icon: Pill,
    colorScheme: {
      bg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
      text: 'text-rose-600',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700 border-rose-200',
      borderHover: 'hover:border-rose-500'
    },
    highlight: 'Katalog KFA Kemenkes'
  },
  {
    id: 'master-vaksin',
    title: 'Master Vaksin (KFA)',
    href: '/admin/master-vaksin',
    category: 'farmasi',
    categoryLabel: 'Program Imunisasi',
    description: 'Katalog sediaan vaksin imunisasi wajib dan pilihan dengan standarisasi kode KFA Kemenkes untuk pelaporan satu data imunisasi.',
    icon: Syringe,
    colorScheme: {
      bg: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
      text: 'text-cyan-600',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700 border-cyan-200',
      borderHover: 'hover:border-cyan-500'
    },
    highlight: 'Kamus Vaksin Nasional'
  },
  {
    id: 'icd10',
    title: 'Kamus Diagnosis ICD-10',
    href: '/admin/icd10',
    category: 'standar',
    categoryLabel: 'Kodifikasi Medis',
    description: 'Basis data klasifikasi diagnosis penyakit berstandar WHO ICD-10 untuk pengisian diagnosis dokter dan klaim BPJS / asuransi.',
    icon: Activity,
    colorScheme: {
      bg: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
      text: 'text-violet-600',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700 border-violet-200',
      borderHover: 'hover:border-violet-500'
    },
    highlight: 'WHO ICD-10'
  },
  {
    id: 'icd9',
    title: 'Kamus Prosedur ICD-9-CM',
    href: '/admin/icd9',
    category: 'standar',
    categoryLabel: 'Kodifikasi Prosedur',
    description: 'Daftar kode prosedur klinis, tindakan bedah minor, dan intervensi medis sesuai acuan International Classification of Diseases (ICD-9).',
    icon: FileText,
    colorScheme: {
      bg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      text: 'text-purple-600',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700 border-purple-200',
      borderHover: 'hover:border-purple-500'
    },
    highlight: 'ICD-9-CM Clinical'
  },
  {
    id: 'master-alergi',
    title: 'Master Alergi SATUSEHAT',
    href: '/admin/master-alergi',
    category: 'standar',
    categoryLabel: 'Patient Safety',
    description: 'Kamus referensi alergi obat, makanan, dan substansi lingkungan bersumber dari SNOMED CT dan KFA untuk keselamatan pasien.',
    icon: AlertCircle,
    colorScheme: {
      bg: 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white',
      text: 'text-red-600',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-700 border-red-200',
      borderHover: 'hover:border-red-500'
    },
    highlight: 'SNOMED-CT Alergen'
  },
  // {
  //   id: 'perusahaan',
  //   title: 'Master Perusahaan Rekanan',
  //   href: '/admin/perusahaan',
  //   category: 'standar',
  //   categoryLabel: 'Kemitraan & PKS',
  //   description: 'Pengelolaan data korporasi mitra, instansi penjamin, asuransi kesehatan swasta, masa berlaku dokumen PKS, dan kontak PIC resmi.',
  //   icon: Building2,
  //   colorScheme: {
  //     bg: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
  //     text: 'text-sky-600',
  //     badgeBg: 'bg-sky-50',
  //     badgeText: 'text-sky-700 border-sky-200',
  //     borderHover: 'hover:border-sky-500'
  //   },
  //   highlight: 'PKS & Penjamin'
  // }
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredModules = useMemo(() => {
    return ADMIN_MODULES.filter((module) => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (module.highlight && module.highlight.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || module.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const faskesName = user?.faskes?.namaFaskes || 'Fasilitas Pelayanan Kesehatan';
  const adminName = user?.namaLengkap || user?.nama_lengkap || user?.username || 'Administrator';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-blue-100 border border-white/20">
              <Hospital className="w-3.5 h-3.5 text-blue-200" />
              <span>{faskesName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Administrator Faskes
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
              Halo <span className="font-semibold text-white">{adminName}</span>, selamat datang di pusat kendali operasional SIKDA. Kelola master data medis, fasilitas faskes, logistik, dan integrasi SATUSEHAT dalam satu pintu.
            </p>
          </div>

          <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-400/30 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Akses Superuser Faskes</span>
            </div>
            <span className="text-xs text-blue-200 hidden md:block">
              {ADMIN_MODULES.length} Modul Terintegrasi
            </span>
          </div>
        </div>

        {/* Quick System Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>SATUSEHAT FHIR Ready</span>
          </div>
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kamus Standar WHO ICD-10</span>
          </div>
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Katalog Farmasi & KFA</span>
          </div>
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Manajemen Sarpras & Alkes</span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul (dokter, poli, alkes, obat, icd10)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Semua ({ADMIN_MODULES.length})
          </button>
          <button
            onClick={() => setSelectedCategory('sdm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'sdm'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            SDM & Pasien
          </button>
          <button
            onClick={() => setSelectedCategory('fasilitas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'fasilitas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Fasilitas & Layanan
          </button>
          <button
            onClick={() => setSelectedCategory('farmasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'farmasi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Farmasi & Logistik
          </button>
          <button
            onClick={() => setSelectedCategory('standar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'standar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Standar Medis & Mitra
          </button>
        </div>
      </div>

      {/* Quick Access Cards Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className={`group bg-white rounded-xl p-5 border border-gray-200/90 shadow-sm hover:shadow-md ${mod.colorScheme.borderHover} transition-all duration-200 flex flex-col justify-between`}
              >
                <div>
                  {/* Card Header: Icon + Category Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${mod.colorScheme.bg}`}>
                      <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${mod.colorScheme.badgeBg} ${mod.colorScheme.badgeText}`}>
                        {mod.categoryLabel}
                      </span>
                      {mod.highlight && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {mod.highlight}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 flex items-center gap-1.5">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Card Footer: Action button */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                  <span>Akses Modul</span>
                  <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Buka</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Modul tidak ditemukan</h3>
          <p className="text-xs text-gray-500 mb-4">
            Tidak ada modul yang cocok dengan kata kunci &quot;{searchQuery}&quot; pada kategori yang dipilih.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  );
}
