"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Pill, 
  Loader2, 
  Info, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  X,
  Clock,
  Syringe,
  Snowflake,
  ThermometerSnowflake,
  ShieldCheck,
  MinusCircle
} from 'lucide-react';
import { farmasiService, StokFaskesItem, StokVaksinItem } from '@/services/farmasi.service';
import { masterService } from '@/services/master.service';

function KatalogObatContent() {
  const searchParams = useSearchParams();
  const [stokList, setStokList] = useState<StokFaskesItem[]>([]);
  const [vaksinList, setVaksinList] = useState<StokVaksinItem[]>([]);
  const [masterList, setMasterList] = useState<any[]>([]);
  const [masterVaksinList, setMasterVaksinList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Kategori Utama: 'semua' | 'obat' | 'bmhp' | 'vaksin'
  const [kategoriTab, setKategoriTab] = useState<'semua' | 'obat' | 'bmhp' | 'vaksin'>('semua');
  // Filter Status Operasional: 'tersedia' | 'semua' | 'fefo' | 'kritis' | 'habis'
  const [statusTab, setStatusTab] = useState<'tersedia' | 'semua' | 'fefo' | 'kritis' | 'habis'>('tersedia');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'vaksin' || tab === 'obat' || tab === 'bmhp' || tab === 'semua') {
      setKategoriTab(tab);
    }
  }, [searchParams]);

  // Modal Penerimaan Obat / BMHP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFilterKat, setModalFilterKat] = useState<'semua' | 'obat' | 'bmhp'>('semua');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formRestock, setFormRestock] = useState({
    obatId: '',
    jumlahMasuk: 100,
    noBatch: '',
    tanggalExpired: '',
    stokMinimum: 25
  });

  // Modal Penerimaan Vaksin
  const [isVaksinModalOpen, setIsVaksinModalOpen] = useState(false);
  const [formVaksin, setFormVaksin] = useState({
    vaksinId: '',
    jumlahMasuk: 50,
    noBatch: '',
    tanggalExpired: '',
    stokMinimum: 15,
    suhuPenyimpanan: '2-8°C'
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resStok, resMaster, resVaksin, resMasterVaksin] = await Promise.all([
        farmasiService.getStokFaskes(),
        masterService.getObat(),
        farmasiService.getStokVaksin().catch(() => ({ data: [] })),
        masterService.getVaksin().catch(() => ({ data: [] }))
      ]);
      setStokList(Array.isArray(resStok?.data) ? resStok.data : []);
      setMasterList(Array.isArray(resMaster?.data) ? resMaster.data : []);
      setVaksinList(Array.isArray(resVaksin?.data) ? resVaksin.data : []);
      setMasterVaksinList(Array.isArray(resMasterVaksin?.data) ? resMasterVaksin.data : []);
    } catch (error) {
      console.error('Error fetching data farmasi & vaksin:', error);
      setStokList([]);
      setMasterList([]);
      setVaksinList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRestockModal = (obatId?: string) => {
    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 2)).toISOString().split('T')[0];
    
    setFormRestock({
      obatId: obatId || (masterList[0]?.id || ''),
      jumlahMasuk: 100,
      noBatch: `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      tanggalExpired: nextYear,
      stokMinimum: 25
    });
    setIsModalOpen(true);
  };

  const openVaksinModal = (vaksinId?: string) => {
    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];
    
    setFormVaksin({
      vaksinId: vaksinId || (masterVaksinList[0]?.id || (vaksinList[0]?.vaksinId || '')),
      jumlahMasuk: 50,
      noBatch: `BIO-VAK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      tanggalExpired: nextYear,
      stokMinimum: 15,
      suhuPenyimpanan: '2-8°C'
    });
    setIsVaksinModalOpen(true);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRestock.obatId) {
      Swal.fire('Validasi Gagal', 'Silakan pilih obat / BMHP yang akan ditambahkan.', 'warning');
      return;
    }
    if (formRestock.jumlahMasuk <= 0) {
      Swal.fire('Validasi Gagal', 'Jumlah penambahan stok harus lebih dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await farmasiService.tambahStokMasuk(formRestock);
      Swal.fire({
        icon: 'success',
        title: 'Penerimaan Berhasil',
        text: res.message || 'Stok fisik faskes telah diperbarui.',
        timer: 1800,
        showConfirmButton: false
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal Menambah Stok', err?.response?.data?.message || err?.message || 'Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVaksinRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVaksin.vaksinId) {
      Swal.fire('Validasi Gagal', 'Silakan pilih jenis vaksin yang diterima.', 'warning');
      return;
    }
    if (formVaksin.jumlahMasuk <= 0) {
      Swal.fire('Validasi Gagal', 'Jumlah dosis masuk harus lebih dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await farmasiService.tambahStokVaksinMasuk(formVaksin);
      Swal.fire({
        icon: 'success',
        title: 'Penerimaan Vaksin Berhasil',
        text: res.message || 'Batch vaksin dan stok kulkas cold-chain telah diperbarui.',
        timer: 1800,
        showConfirmButton: false
      });
      setIsVaksinModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal Menambah Stok Vaksin', err?.response?.data?.message || err?.message || 'Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal Pengeluaran / Pengurangan Stok
  const [isKeluarModalOpen, setIsKeluarModalOpen] = useState(false);
  const [formKeluar, setFormKeluar] = useState({
    tipe: 'obat' as 'obat' | 'vaksin',
    itemId: '',
    noBatch: '',
    jumlahKeluar: 1,
    alasanKeluar: 'PEMAKAIAN_RUANGAN',
    catatan: ''
  });

  const openKeluarModal = (type: 'obat' | 'vaksin' = 'obat', id?: string, noBatch?: string) => {
    setFormKeluar({
      tipe: type,
      itemId: id || (type === 'vaksin' ? (vaksinList[0]?.vaksinId || '') : (stokList[0]?.obatId || '')),
      noBatch: noBatch || (type === 'vaksin' ? (vaksinList[0]?.noBatch || '') : ''),
      jumlahKeluar: 1,
      alasanKeluar: type === 'vaksin' ? 'DISTRIBUSI_POSYANDU' : 'PEMAKAIAN_RUANGAN',
      catatan: ''
    });
    setIsKeluarModalOpen(true);
  };

  const handleSaveKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeluar.itemId) {
      Swal.fire('Validasi Gagal', 'Silakan pilih barang yang akan dikeluarkan.', 'warning');
      return;
    }
    if (formKeluar.jumlahKeluar <= 0) {
      Swal.fire('Validasi Gagal', 'Jumlah pengeluaran harus lebih dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formKeluar.tipe === 'vaksin') {
        const res = await farmasiService.kurangiStokVaksinKeluar({
          vaksinId: formKeluar.itemId,
          noBatch: formKeluar.noBatch,
          jumlahKeluar: formKeluar.jumlahKeluar,
          alasanKeluar: formKeluar.alasanKeluar,
          catatan: formKeluar.catatan
        });
        Swal.fire({
          icon: 'success',
          title: 'Pengeluaran Vaksin Berhasil',
          text: res.message,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const res = await farmasiService.kurangiStokKeluar({
          obatId: formKeluar.itemId,
          jumlahKeluar: formKeluar.jumlahKeluar,
          alasanKeluar: formKeluar.alasanKeluar,
          catatan: formKeluar.catatan
        });
        Swal.fire({
          icon: 'success',
          title: 'Pengeluaran Stok Berhasil',
          text: res.message,
          timer: 2000,
          showConfirmButton: false
        });
      }
      setIsKeluarModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal Mengurangi Stok', err?.response?.data?.message || err?.message || 'Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalItemCount = stokList.length;
  const obatList = stokList.filter(o => o.kategori !== 'BMHP');
  const bmhpList = stokList.filter(o => o.kategori === 'BMHP');

  const kritisObatBmhp = stokList.filter(o => o.statusStok === 'KRITIS' && o.stok > 0);
  const habisObatBmhp = stokList.filter(o => o.stok === 0);
  const fefoObatBmhp = stokList.filter(o => o.statusExpired === 'SEGERA_KADALUWARSA' || o.statusExpired === 'KADALUWARSA');

  const totalDosisVaksin = vaksinList.reduce((acc, v) => acc + v.stok, 0);
  const kritisVaksin = vaksinList.filter(v => v.statusStok === 'KRITIS' && v.stok > 0);
  const habisVaksin = vaksinList.filter(v => v.stok === 0);
  const fefoVaksin = vaksinList.filter(v => v.statusExpired === 'SEGERA_KADALUWARSA' || v.statusExpired === 'KADALUWARSA');

  // Filter List for Obat/BMHP
  const filteredObatBmhp = stokList.filter(o => {
    const matchSearch = 
      (o.namaObat || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.kodeObat || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.noBatch || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    // Filter Kategori
    if (kategoriTab === 'obat' && o.kategori === 'BMHP') return false;
    if (kategoriTab === 'bmhp' && o.kategori !== 'BMHP') return false;

    // Filter Status
    if (statusTab === 'tersedia') return o.stok > 0;
    if (statusTab === 'fefo') return o.statusExpired === 'SEGERA_KADALUWARSA' || o.statusExpired === 'KADALUWARSA';
    if (statusTab === 'kritis') return o.statusStok === 'KRITIS' && o.stok > 0;
    if (statusTab === 'habis') return o.stok === 0;

    return true;
  });

  // Filter List for Vaksin
  const filteredVaksin = vaksinList.filter(v => {
    const matchSearch = 
      (v.namaVaksin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.targetPenyakit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.noBatch || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (statusTab === 'tersedia') return v.stok > 0;
    if (statusTab === 'fefo') return v.statusExpired === 'SEGERA_KADALUWARSA' || v.statusExpired === 'KADALUWARSA';
    if (statusTab === 'kritis') return v.statusStok === 'KRITIS' && v.stok > 0;
    if (statusTab === 'habis') return v.stok === 0;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Apotek &amp; Gudang Farmasi Faskes
            </span>
            <span className="text-xs text-gray-400">• Standar FEFO &amp; Cold-Chain Kemenkes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-teal-600" />
            Manajemen Logistik Obat, BMHP &amp; Vaksin Faskes
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Pencatatan nomor batch, pemantauan tanggal kadaluwarsa (FEFO), kontrol suhu kulkas vaksin, dan penerimaan stok fisik faskes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            Perbarui
          </button>

          <button
            onClick={() => openKeluarModal(kategoriTab === 'vaksin' ? 'vaksin' : 'obat')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all shadow-xs"
          >
            <MinusCircle className="w-4 h-4 text-rose-600" />
            - Catat Pengeluaran Stok
          </button>
          
          {kategoriTab === 'vaksin' ? (
            <button
              onClick={() => openVaksinModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Snowflake className="w-4 h-4" />
              + Penerimaan Vaksin Baru (Cold-Chain)
            </button>
          ) : (
            <button
              onClick={() => openRestockModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              + Penerimaan Obat / BMHP Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Obat & BMHP */}
        <div className="bg-white p-4 border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Persediaan Obat Aktif</p>
            <p className="text-xl font-black text-gray-900 font-mono">{obatList.length} <span className="text-xs font-normal text-gray-500">Jenis</span></p>
            <p className="text-[11px] text-gray-500 mt-0.5">Katalog obat peresepan pasien</p>
          </div>
        </div>

        {/* Card 2: BMHP */}
        <div className="bg-white p-4 border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BMHP (Habis Pakai)</p>
            <p className="text-xl font-black text-gray-900 font-mono">{bmhpList.length} <span className="text-xs font-normal text-gray-500">Item</span></p>
            <p className="text-[11px] text-gray-500 mt-0.5">Spuit, kasa, infus, abocath</p>
          </div>
        </div>

        {/* Card 3: Vaksin Cold-Chain */}
        <div className="bg-white p-4 border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-700">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Vaksin Cold-Chain</p>
            <p className="text-xl font-black text-cyan-700 font-mono">{totalDosisVaksin} <span className="text-xs font-normal text-gray-500">Dosis</span></p>
            <p className="text-[11px] text-cyan-800 font-medium mt-0.5">❄️ 2-8°C • {vaksinList.length} Batch Lot</p>
          </div>
        </div>

        {/* Card 4: Peringatan Kritis / FEFO */}
        <div className="bg-white p-4 border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stok Kritis &amp; Habis</p>
            <p className="text-xl font-black text-rose-600 font-mono">
              {kritisObatBmhp.length + kritisVaksin.length} <span className="text-xs font-normal text-gray-500">Kritis</span>
              {(habisObatBmhp.length + habisVaksin.length) > 0 && (
                <span className="text-xs font-bold text-red-600 ml-1.5">• {habisObatBmhp.length + habisVaksin.length} Habis</span>
              )}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              {fefoObatBmhp.length + fefoVaksin.length} Batch &lt; 60 Hari FEFO
            </p>
          </div>
        </div>
      </div>

      {/* FILTER 1: TAB KATEGORI UTAMA */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setKategoriTab('semua')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            kategoriTab === 'semua'
              ? 'border-teal-600 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Semua Obat &amp; BMHP ({stokList.length})
        </button>

        <button
          onClick={() => setKategoriTab('obat')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            kategoriTab === 'obat'
              ? 'border-blue-600 text-blue-800 bg-blue-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Pill className="w-4 h-4 text-blue-600" />
          Khusus Obat-Obatan ({obatList.length})
        </button>

        <button
          onClick={() => setKategoriTab('bmhp')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            kategoriTab === 'bmhp'
              ? 'border-purple-600 text-purple-800 bg-purple-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Syringe className="w-4 h-4 text-purple-600" />
          Khusus BMHP Habis Pakai ({bmhpList.length})
        </button>

        <button
          onClick={() => setKategoriTab('vaksin')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            kategoriTab === 'vaksin'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Snowflake className="w-4 h-4 text-cyan-600" />
          Logistik Vaksin (Cold-Chain) ({vaksinList.length} Batch)
        </button>
      </div>

      {/* FILTER 2: STATUS & PENCARIAN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-gray-200 shadow-xs">
        <div className="w-full sm:w-1/2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              kategoriTab === 'vaksin'
                ? "Cari nama vaksin, target imunisasi, nomor lot batch..."
                : "Cari nama barang, kode, nomor batch..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusTab('tersedia')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusTab === 'tersedia'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tersedia (Ready)
          </button>
          <button
            onClick={() => setStatusTab('fefo')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusTab === 'fefo'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            Prioritas FEFO (&lt; 60 Hari)
          </button>
          <button
            onClick={() => setStatusTab('kritis')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusTab === 'kritis'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Stok Kritis
          </button>
          <button
            onClick={() => setStatusTab('habis')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusTab === 'habis'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            Stok Habis ({kategoriTab === 'vaksin' ? habisVaksin.length : habisObatBmhp.length})
          </button>
          <button
            onClick={() => setStatusTab('semua')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              statusTab === 'semua'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua Batch
          </button>
        </div>
      </div>

      {/* CONTENT: JIKA TAB VAKSIN AKTIF */}
      {kategoriTab === 'vaksin' ? (
        <div>
          {isLoading ? (
            <div className="py-20 text-center text-gray-400 bg-white border border-gray-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
              Memuat data kulkas cold-chain vaksin...
            </div>
          ) : filteredVaksin.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-white border border-gray-200">
              <Snowflake className="w-10 h-10 mx-auto text-cyan-400 mb-2" />
              <p className="font-bold text-gray-800">Tidak ada batch vaksin yang sesuai filter</p>
              <p className="text-xs text-gray-400 mt-1">Gunakan tombol &quot;+ Penerimaan Vaksin Baru&quot; untuk mencatat droping Bio Farma / Dinkes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaksin.map((vaksin) => {
                const isKritis = vaksin.statusStok === 'KRITIS';
                const isHabis = vaksin.statusStok === 'HABIS';
                const isKadaluwarsa = vaksin.statusExpired === 'KADALUWARSA';
                const isSegeraExpired = vaksin.statusExpired === 'SEGERA_KADALUWARSA';

                return (
                  <div
                    key={vaksin.id}
                    className={`bg-white border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                      isHabis || isKadaluwarsa
                        ? 'border-red-300 ring-1 ring-red-100'
                        : isKritis || isSegeraExpired
                        ? 'border-amber-300 ring-1 ring-amber-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-4 space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                          <Snowflake className="w-3 h-3 text-cyan-600" />
                          {vaksin.suhuPenyimpanan || '2-8°C'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {isKadaluwarsa ? (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">KADALUWARSA</span>
                          ) : isSegeraExpired ? (
                            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> FEFO: {vaksin.sisaHariExpired} HARI
                            </span>
                          ) : null}

                          {isHabis ? (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">HABIS</span>
                          ) : isKritis ? (
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">KRITIS</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Thumbnail & Nama Vaksin */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg bg-cyan-50 border border-cyan-200 overflow-hidden shrink-0 shadow-2xs group">
                          <img 
                            src="/images/logistik/vaksin.jpg" 
                            alt={vaksin.namaVaksin}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-0 right-0 p-0.5 bg-cyan-600/90 text-white rounded-tl">
                            <Snowflake className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug truncate" title={vaksin.namaVaksin}>
                            {vaksin.namaVaksin}
                          </h3>
                          <p className="text-[11px] text-cyan-700 font-medium truncate mt-0.5">
                            Target: {vaksin.targetPenyakit || 'Imunisasi Dasar'}
                          </p>
                        </div>
                      </div>

                      {/* Batch & ED */}
                      <div className="bg-gray-50 p-2.5 border border-gray-100 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">No. Lot Batch:</span>
                          <span className="font-mono font-bold text-gray-800">{vaksin.noBatch}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Tanggal Expired:</span>
                          <span className={`font-semibold ${
                            isKadaluwarsa ? 'text-red-600 font-bold' :
                            isSegeraExpired ? 'text-amber-700 font-bold' : 'text-gray-700'
                          }`}>
                            {vaksin.tanggalExpired ? new Date(vaksin.tanggalExpired).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Sisa Dosis & Buffer */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                        <div>
                          <p className="text-[10px] text-gray-500">Sisa Dosis (Kulkas)</p>
                          <p className={`text-lg font-black font-mono ${
                            isHabis ? 'text-red-600' : isKritis ? 'text-rose-600' : 'text-cyan-700'
                          }`}>
                            {vaksin.stok} <span className="text-[11px] font-normal text-gray-500">Dosis</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Batas Min. Pengaman</p>
                          <p className="text-sm font-bold text-gray-700 font-mono mt-1">
                            {vaksin.stokMinimum} Dosis
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Kode KFA: {vaksin.kodeKfa || '-'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openKeluarModal('vaksin', vaksin.vaksinId, vaksin.noBatch)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline"
                          title="Keluarkan dosis untuk posyandu / rusak"
                        >
                          - Catat Keluar
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          onClick={() => openVaksinModal(vaksin.vaksinId)}
                          className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 underline"
                        >
                          + Tambah Dosis
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CONTENT: JIKA TAB OBAT / BMHP AKTIF */
        <div>
          {isLoading ? (
            <div className="py-20 text-center text-gray-400 bg-white border border-gray-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
              Memuat katalog persediaan faskes...
            </div>
          ) : filteredObatBmhp.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-white border border-gray-200">
              <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-800">Tidak ada item yang sesuai dengan filter pencarian</p>
              <p className="text-xs text-gray-400 mt-1">Gunakan tombol &quot;+ Penerimaan Obat / BMHP Baru&quot; untuk menambah stok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObatBmhp.map((obat) => {
                const isKritis = obat.statusStok === 'KRITIS';
                const isHabis = obat.statusStok === 'HABIS';
                const isKadaluwarsa = obat.statusExpired === 'KADALUWARSA';
                const isSegeraExpired = obat.statusExpired === 'SEGERA_KADALUWARSA';
                const isBmhp = obat.kategori === 'BMHP';

                return (
                  <div 
                    key={obat.id}
                    className={`bg-white border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                      isHabis || isKadaluwarsa
                        ? 'border-red-300 ring-1 ring-red-100'
                        : isKritis || isSegeraExpired
                        ? 'border-amber-300 ring-1 ring-amber-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="p-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isBmhp
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isBmhp ? <Syringe className="w-3 h-3" /> : <Pill className="w-3 h-3" />}
                          {isBmhp ? 'BMHP' : 'OBAT'}
                        </span>

                        <div className="flex items-center gap-1">
                          {isKadaluwarsa ? (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">KADALUWARSA</span>
                          ) : isSegeraExpired ? (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> FEFO: {obat.sisaHariExpired} HARI
                            </span>
                          ) : null}

                          {isHabis ? (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">HABIS</span>
                          ) : isKritis ? (
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">KRITIS</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5">{obat.kodeObat}</span>
                          <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 font-bold uppercase">{obat.sediaan}</span>
                        </div>

                        {/* Thumbnail & Nama Obat / BMHP */}
                        <div className="flex items-center gap-3">
                          <div className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border shadow-2xs group ${
                            isBmhp ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <img 
                              src={obat.gambarUrl || (isBmhp ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg')} 
                              alt={obat.namaObat}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = isBmhp ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg';
                              }}
                            />
                            <div className={`absolute bottom-0 right-0 p-0.5 text-white rounded-tl ${
                              isBmhp ? 'bg-purple-600/90' : 'bg-blue-600/90'
                            }`}>
                              {isBmhp ? <Syringe className="w-2.5 h-2.5" /> : <Pill className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2" title={obat.namaObat}>
                              {obat.namaObat}
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                              Kategori: {obat.kategori}
                            </p>
                          </div>
                        </div>

                        {/* Batch & Expiry Info (FEFO Details) */}
                        <div className="bg-gray-50 p-2.5 border border-gray-100 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">No. Batch:</span>
                            <span className="font-mono font-bold text-gray-800">{obat.noBatch}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Kadaluwarsa:</span>
                            <span className={`font-semibold ${
                              isKadaluwarsa ? 'text-red-600 font-bold' :
                              isSegeraExpired ? 'text-amber-700 font-bold' : 'text-gray-700'
                            }`}>
                              {obat.tanggalExpired ? new Date(obat.tanggalExpired).toLocaleDateString('id-ID') : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Stock & Buffer */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                          <div>
                            <p className="text-[10px] text-gray-500">Stok Tersedia</p>
                            <p className={`text-lg font-black font-mono ${
                              isHabis ? 'text-red-600' : isKritis ? 'text-rose-600' : 'text-teal-600'
                            }`}>
                              {obat.stok} <span className="text-[11px] font-normal text-gray-500">{obat.sediaan}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500">Batas Min. Buffer</p>
                            <p className="text-sm font-bold text-gray-700 font-mono mt-1">
                              {obat.stokMinimum} {obat.sediaan}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Rp {obat.harga?.toLocaleString('id-ID')} / {obat.sediaan}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openKeluarModal('obat', obat.obatId)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline"
                          title="Keluarkan stok untuk amprahan ruangan / rusak / opname"
                        >
                          - Catat Keluar
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          onClick={() => openRestockModal(obat.obatId)}
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-800 underline"
                        >
                          + Tambah Stok
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PENERIMAAN OBAT & BMHP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Penerimaan Stok Obat &amp; BMHP
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Droping dari Dinkes / Pengadaan PBF Faskes</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="p-6 space-y-4">
              {/* Filter Cepat Modal */}
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Tipe:</span>
                <button
                  type="button"
                  onClick={() => setModalFilterKat('semua')}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded ${modalFilterKat === 'semua' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilterKat('obat')}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded ${modalFilterKat === 'obat' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}
                >
                  Obat
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilterKat('bmhp')}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded ${modalFilterKat === 'bmhp' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700'}`}
                >
                  BMHP
                </button>
              </div>

              {/* Pilih Obat */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pilih Item Master *
                  </label>
                  <Link 
                    href="/admin/master-obat" 
                    target="_blank" 
                    className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 underline"
                  >
                    + Daftarkan Katalog Baru
                  </Link>
                </div>
                <select
                  required
                  value={formRestock.obatId}
                  onChange={(e) => setFormRestock({ ...formRestock, obatId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Pilih Barang --</option>
                  {masterList
                    .filter(m => {
                      if (modalFilterKat === 'obat') return m.kategori !== 'BMHP';
                      if (modalFilterKat === 'bmhp') return m.kategori === 'BMHP';
                      return true;
                    })
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.kategori === 'BMHP' ? 'BMHP' : 'OBAT'}] {m.namaObat} ({m.kodeObat}) - {m.sediaan}
                      </option>
                    ))}
                </select>
              </div>

              {/* Jumlah Masuk */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Jumlah Stok Masuk (Fisik) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formRestock.jumlahMasuk}
                  onChange={(e) => setFormRestock({ ...formRestock, jumlahMasuk: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                  placeholder="Contoh: 100"
                />
              </div>

              {/* Nomor Batch */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nomor Batch Pabrik / Kemasan *
                </label>
                <input
                  type="text"
                  required
                  value={formRestock.noBatch}
                  onChange={(e) => setFormRestock({ ...formRestock, noBatch: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 font-mono text-xs font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                  placeholder="Contoh: BCH-2026-901"
                />
              </div>

              {/* Tanggal Kadaluwarsa (FEFO) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tanggal Kadaluwarsa (Expiry Date) *
                </label>
                <input
                  type="date"
                  required
                  value={formRestock.tanggalExpired}
                  onChange={(e) => setFormRestock({ ...formRestock, tanggalExpired: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              {/* Buffer Minimum */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ambang Batas Peringatan Minimum (Buffer Stock)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formRestock.stokMinimum}
                  onChange={(e) => setFormRestock({ ...formRestock, stokMinimum: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PENERIMAAN VAKSIN (COLD-CHAIN) */}
      {isVaksinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" onClick={() => setIsVaksinModalOpen(false)}></div>
          <div className="relative bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-cyan-50">
              <div>
                <h3 className="text-base font-bold text-cyan-950 flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-cyan-600" />
                  Penerimaan Vaksin (Cold-Chain)
                </h3>
                <p className="text-xs text-cyan-800 mt-0.5">Droping Bio Farma / Dinas Kesehatan Daerah</p>
              </div>
              <button onClick={() => setIsVaksinModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVaksinRestock} className="p-6 space-y-4">
              {/* Pilih Vaksin */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pilih Jenis Vaksin *
                  </label>
                  <Link 
                    href="/admin/master-vaksin" 
                    target="_blank" 
                    className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900 underline"
                  >
                    + Daftarkan Katalog Baru
                  </Link>
                </div>
                <select
                  required
                  value={formVaksin.vaksinId}
                  onChange={(e) => setFormVaksin({ ...formVaksin, vaksinId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:border-cyan-600 outline-none"
                >
                  <option value="">-- Pilih Jenis Vaksin --</option>
                  {(masterVaksinList.length > 0 ? masterVaksinList : vaksinList.map(v => ({ id: v.vaksinId, namaVaksin: v.namaVaksin, targetPenyakit: v.targetPenyakit }))).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.namaVaksin} {v.targetPenyakit ? `(Target: ${v.targetPenyakit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah Dosis Masuk */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Jumlah Dosis Masuk *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formVaksin.jumlahMasuk}
                  onChange={(e) => setFormVaksin({ ...formVaksin, jumlahMasuk: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:bg-white focus:border-cyan-600 outline-none"
                  placeholder="Contoh: 50"
                />
              </div>

              {/* Nomor Lot / Batch Pabrik */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nomor Lot / Batch Bio Farma *
                </label>
                <input
                  type="text"
                  required
                  value={formVaksin.noBatch}
                  onChange={(e) => setFormVaksin({ ...formVaksin, noBatch: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 font-mono text-xs font-bold text-gray-900 focus:bg-white focus:border-cyan-600 outline-none"
                  placeholder="Contoh: BIO-PENT-2026A"
                />
              </div>

              {/* Tanggal Kadaluwarsa */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tanggal Kadaluwarsa *
                </label>
                <input
                  type="date"
                  required
                  value={formVaksin.tanggalExpired}
                  onChange={(e) => setFormVaksin({ ...formVaksin, tanggalExpired: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:border-cyan-600 outline-none"
                />
              </div>

              {/* Suhu Penyimpanan Cold Chain */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Suhu Cold-Chain
                  </label>
                  <select
                    value={formVaksin.suhuPenyimpanan}
                    onChange={(e) => setFormVaksin({ ...formVaksin, suhuPenyimpanan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-xs font-bold text-cyan-800 outline-none"
                  >
                    <option value="2-8°C">❄️ 2-8°C (Kulkas Standar)</option>
                    <option value="-20°C">🧊 -20°C (Freezer Khusus)</option>
                    <option value="-70°C">⚡ -70°C (Ultra Cold)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Batas Buffer Min.
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formVaksin.stokMinimum}
                    onChange={(e) => setFormVaksin({ ...formVaksin, stokMinimum: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsVaksinModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Penerimaan Vaksin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGELUARAN / PENGURANGAN STOK */}
      {isKeluarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 shadow-2xl max-w-lg w-full p-6 text-left relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsKeluarModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600">
                <MinusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Catat Pengeluaran / Pengurangan Stok
                </h3>
                <p className="text-xs text-gray-500">
                  Amprahan ke ruangan, rusak, kadaluwarsa, atau penyesuaian stok opname.
                </p>
              </div>
            </div>

            {/* Toggle Tipe Barang */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setFormKeluar({ ...formKeluar, tipe: 'obat', itemId: stokList[0]?.obatId || '', noBatch: '' })}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  formKeluar.tipe === 'obat'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Obat &amp; BMHP
              </button>
              <button
                type="button"
                onClick={() => setFormKeluar({ ...formKeluar, tipe: 'vaksin', itemId: vaksinList[0]?.vaksinId || '', noBatch: vaksinList[0]?.noBatch || '' })}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  formKeluar.tipe === 'vaksin'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Vaksin (Cold-Chain)
              </button>
            </div>

            <form onSubmit={handleSaveKeluar} className="space-y-4">
              {formKeluar.tipe === 'obat' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilih Item Obat / BMHP <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formKeluar.itemId}
                    onChange={(e) => setFormKeluar({ ...formKeluar, itemId: e.target.value })}
                    required
                    className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white"
                  >
                    <option value="">-- Pilih Obat / BMHP --</option>
                    {stokList.map((item) => (
                      <option key={item.id} value={item.obatId}>
                        {item.namaObat} ({item.kategori}) — Stok: {item.stok} {item.sediaan} (Batch: {item.noBatch})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Pilih Vaksin <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formKeluar.itemId}
                      onChange={(e) => {
                        const vId = e.target.value;
                        const vBatch = vaksinList.find(v => v.vaksinId === vId)?.noBatch || '';
                        setFormKeluar({ ...formKeluar, itemId: vId, noBatch: vBatch });
                      }}
                      required
                      className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white"
                    >
                      <option value="">-- Pilih Vaksin --</option>
                      {vaksinList.map((item) => (
                        <option key={item.id} value={item.vaksinId}>
                          {item.namaVaksin} — Sisa: {item.stok} Dosis (Batch: {item.noBatch})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nomor Batch Vaksin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formKeluar.noBatch}
                      onChange={(e) => setFormKeluar({ ...formKeluar, noBatch: e.target.value })}
                      placeholder="Nomor batch vaksin"
                      className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Jumlah Dikeluarkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formKeluar.jumlahKeluar}
                    onChange={(e) => setFormKeluar({ ...formKeluar, jumlahKeluar: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Alasan Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formKeluar.alasanKeluar}
                    onChange={(e) => setFormKeluar({ ...formKeluar, alasanKeluar: e.target.value })}
                    required
                    className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white"
                  >
                    {formKeluar.tipe === 'vaksin' ? (
                      <>
                        <option value="DISTRIBUSI_POSYANDU">Distribusi ke Posyandu / Bidan Desa</option>
                        <option value="RUSAK_COLD_CHAIN">Kerusakan Suhu / Cold Chain</option>
                        <option value="KADALUWARSA">Kadaluwarsa / Expired (Pemusnahan)</option>
                        <option value="PENYESUAIAN_OPNAME">Koreksi Stok Opname Fisik</option>
                        <option value="RETUR_DINKES">Retur ke Gudang Farmasi Dinkes</option>
                      </>
                    ) : (
                      <>
                        <option value="PEMAKAIAN_RUANGAN">Amprahan Ruangan (Poli Gigi/IGD/Inap/Lab)</option>
                        <option value="RUSAK_PECAH">Barang Rusak / Pecah / Terkontaminasi</option>
                        <option value="KADALUWARSA">Kadaluwarsa / Expired (Pemusnahan)</option>
                        <option value="PENYESUAIAN_OPNAME">Koreksi Stok Opname Fisik</option>
                        <option value="RETUR_DINKES">Retur ke Gudang Farmasi Dinkes</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan / Keterangan Ruangan Penerima
                </label>
                <input
                  type="text"
                  value={formKeluar.catatan}
                  onChange={(e) => setFormKeluar({ ...formKeluar, catatan: e.target.value })}
                  placeholder="Contoh: Amprahan spuit & kassa untuk Poli Gigi & Tindakan UGD"
                  className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-rose-500 text-black bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsKeluarModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Konfirmasi Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KatalogObatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat logistik faskes...</div>}>
      <KatalogObatContent />
    </Suspense>
  );
}
