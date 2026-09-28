"use client";

import React, { useEffect, useState } from 'react';
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
  Clock
} from 'lucide-react';
import { farmasiService, StokFaskesItem } from '@/services/farmasi.service';
import { masterService } from '@/services/master.service';

export default function KatalogObatPage() {
  const [stokList, setStokList] = useState<StokFaskesItem[]>([]);
  const [masterList, setMasterList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'fefo' | 'kritis'>('semua');

  // Modal Penerimaan Obat
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formRestock, setFormRestock] = useState({
    obatId: '',
    jumlahMasuk: 100,
    noBatch: '',
    tanggalExpired: '',
    stokMinimum: 25
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resStok, resMaster] = await Promise.all([
        farmasiService.getStokFaskes(),
        masterService.getObat()
      ]);
      setStokList(Array.isArray(resStok?.data) ? resStok.data : []);
      setMasterList(Array.isArray(resMaster?.data) ? resMaster.data : []);
    } catch (error) {
      console.error('Error fetching data farmasi:', error);
      setStokList([]);
      setMasterList([]);
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

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRestock.obatId) {
      Swal.fire('Validasi Gagal', 'Silakan pilih obat yang akan ditambahkan.', 'warning');
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
        title: 'Penerimaan Obat Berhasil',
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

  const fefoItems = stokList.filter(o => o.statusExpired === 'SEGERA_KADALUWARSA' || o.statusExpired === 'KADALUWARSA');
  const kritisItems = stokList.filter(o => o.statusStok === 'KRITIS' || o.statusStok === 'HABIS');

  const filteredObat = stokList.filter(o => {
    const matchSearch = 
      (o.namaObat || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.kodeObat || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.noBatch || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === 'fefo') return o.statusExpired === 'SEGERA_KADALUWARSA' || o.statusExpired === 'KADALUWARSA';
    if (activeTab === 'kritis') return o.statusStok === 'KRITIS' || o.statusStok === 'HABIS';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-gray-200 shadow-xs rounded-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Apotek & Instalasi Farmasi
            </span>
            <span className="text-xs text-gray-400">• Standar FEFO Kemenkes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-teal-600" />
            Manajemen Persediaan & Stok Obat Faskes
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Pencatatan nomor batch, pemantauan tanggal kadaluwarsa (FEFO), dan penambahan stok faskes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            Perbarui
          </button>
          <button
            onClick={() => openRestockModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-none shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Penerimaan Obat Baru (Restock)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-gray-200 shadow-xs rounded-none">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Item Obat di Faskes</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {isLoading ? '...' : `${stokList.length} Item`}
          </div>
          <p className="text-xs text-gray-500 mt-1">Obat yang memiliki catatan stok fisik di faskes ini</p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-xs rounded-none">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Stok Kritis / Menipis</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {isLoading ? '...' : `${kritisItems.length} Item`}
          </div>
          <p className="text-xs text-rose-700 font-medium mt-1">Sisa stok di bawah batas minimum buffer</p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-xs rounded-none">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Perhatian FEFO (&lt; 60 Hari)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {isLoading ? '...' : `${fefoItems.length} Batch`}
          </div>
          <p className="text-xs text-amber-800 font-medium mt-1">Mendekati masa kadaluwarsa (prioritaskan keluar)</p>
        </div>
      </div>

      {/* Info Banner FEFO */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-none flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <span className="font-bold">Prinsip FEFO (First Expired, First Out):</span> Obat dengan masa kadaluwarsa terdekat selalu diletakkan di rak bagian depan dan dikeluarkan terlebih dahulu untuk resep pasien. Jika obat berstatus <span className="font-bold text-amber-800">SEGERA KADALUWARSA</span> dan tergolong lambat keluar (*slow-moving*), koordinasikan dengan Dinas Kesehatan untuk dilakukan <b>redistribusi antar-Puskesmas</b> sebelum obat expired mengendap dan terbuang.
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('semua')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'semua'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Semua Obat ({stokList.length})
          </button>
          <button
            onClick={() => setActiveTab('fefo')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'fefo'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Prioritas FEFO ({fefoItems.length})
          </button>
          <button
            onClick={() => setActiveTab('kritis')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'kritis'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Stok Kritis ({kritisItems.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama, batch, atau kode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-none text-xs focus:ring-1 focus:ring-teal-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Grid of Medicines */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
          <p className="text-gray-500 font-medium text-xs">Memeriksa stok fisik dan nomor batch obat...</p>
        </div>
      ) : filteredObat.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Tidak Ada Data Obat</h3>
          <p className="text-gray-500 text-xs mb-4">Belum ada stok obat pada filter ini atau belum ada penerimaan obat.</p>
          <button
            onClick={() => openRestockModal()}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-none"
          >
            + Tambah Penerimaan Stok Obat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredObat.map((obat) => {
            const isKritis = obat.statusStok === 'KRITIS';
            const isHabis = obat.statusStok === 'HABIS';
            const isSegeraExpired = obat.statusExpired === 'SEGERA_KADALUWARSA';
            const isKadaluwarsa = obat.statusExpired === 'KADALUWARSA';

            return (
              <div 
                key={obat.id} 
                className={`bg-white border shadow-xs rounded-none overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  isKadaluwarsa ? 'border-red-400 ring-1 ring-red-300' :
                  isSegeraExpired ? 'border-amber-400 ring-1 ring-amber-300' :
                  isKritis ? 'border-rose-300' : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Top Image / Placeholder */}
                  <div className="relative h-40 bg-gray-50 border-b border-gray-100 p-3 flex items-center justify-center overflow-hidden">
                    {obat.gambarUrl ? (
                      <img 
                        src={obat.gambarUrl} 
                        alt={obat.namaObat} 
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <Pill className="w-12 h-12 mb-1" />
                        <span className="text-[10px] uppercase font-bold">Katalog Resmi</span>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {isKadaluwarsa ? (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                          KADALUWARSA
                        </span>
                      ) : isSegeraExpired ? (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" /> FEFO: {obat.sisaHariExpired} HARI
                        </span>
                      ) : null}

                      {isHabis ? (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                          STOK HABIS
                        </span>
                      ) : isKritis ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                          STOK KRITIS
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5">{obat.kodeObat}</span>
                      <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 font-bold uppercase">{obat.sediaan}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-teal-700 transition-colors">
                      {obat.namaObat}
                    </h3>

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
                        <p className="text-[10px] text-gray-500">Batas Min. (Dinkes)</p>
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
                  <button
                    onClick={() => openRestockModal(obat.obatId)}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800 underline"
                  >
                    + Tambah Stok
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PENERIMAAN OBAT / RESTOCK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Penerimaan Stok Obat Fisik
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Droping dari Dinkes / Pengadaan PBF Faskes</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="p-6 space-y-4">
              {/* Pilih Obat */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pilih Obat (Dari Formularium Master) *
                </label>
                <select
                  required
                  value={formRestock.obatId}
                  onChange={(e) => setFormRestock({ ...formRestock, obatId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-xs font-medium text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Pilih Obat --</option>
                  {masterList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.namaObat} ({m.kodeObat}) - {m.sediaan}
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
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-sm font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                  placeholder="Contoh: 100"
                />
              </div>

              {/* Nomor Batch & Tanggal Expired */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nomor Batch Pabrik *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRestock.noBatch}
                    onChange={(e) => setFormRestock({ ...formRestock, noBatch: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-xs font-mono font-semibold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                    placeholder="Contoh: BCH-2026-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tanggal Kadaluwarsa (Exp) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formRestock.tanggalExpired}
                    onChange={(e) => setFormRestock({ ...formRestock, tanggalExpired: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-xs font-semibold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Batas Stok Minimum (Buffer) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Batas Stok Minimum Buffer (Pemicu Alert Dinkes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formRestock.stokMinimum}
                  onChange={(e) => setFormRestock({ ...formRestock, stokMinimum: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-xs text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                  placeholder="Standar buffer faskes: 20"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Jika sisa stok di bawah angka ini, Dinas Kesehatan otomatis menerima peringatan defisit obat.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-none shadow-xs disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penerimaan Obat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

