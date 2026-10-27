'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  Filter, 
  Printer, 
  Package, 
  Pill, 
  Syringe, 
  Layers, 
  Clock, 
  User, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { farmasiService, MutasiStokItem } from '@/services/farmasi.service';

export default function RiwayatMutasiStokPage() {
  const [logs, setLogs] = useState<MutasiStokItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<'semua' | 'OBAT' | 'BMHP' | 'VAKSIN'>('semua');
  const [jenisFilter, setJenisFilter] = useState<'semua' | 'MASUK' | 'KELUAR' | 'PENYESUAIAN'>('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryToday, setSummaryToday] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail Modal Kartu Stok
  const [selectedItemForKartu, setSelectedItemForKartu] = useState<{ id: string; nama: string; jenis: 'OBAT' | 'VAKSIN' } | null>(null);
  const [kartuStokLogs, setKartuStokLogs] = useState<MutasiStokItem[]>([]);
  const [loadingKartu, setLoadingKartu] = useState(false);

  const fetchMutasiLogs = async () => {
    setLoading(true);
    try {
      const res = await farmasiService.getRiwayatMutasi({
        kategori: kategoriFilter !== 'semua' ? kategoriFilter : undefined,
        jenisMutasi: jenisFilter !== 'semua' ? jenisFilter : undefined,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 30,
      });

      if (res && res.status === 'success') {
        setLogs(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalItems(res.meta?.total || 0);
        setSummaryToday(res.summaryToday || []);
      }
    } catch (err) {
      console.error('Error fetching riwayat mutasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMutasiLogs();
  }, [kategoriFilter, jenisFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMutasiLogs();
  };

  const handleResetFilter = () => {
    setSearch('');
    setKategoriFilter('semua');
    setJenisFilter('semua');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Hitung ringkasan hari ini
  const stats = useMemo(() => {
    let masukHariIni = 0;
    let keluarHariIni = 0;
    let bmhpKeluar = 0;
    let vaksinKeluar = 0;

    summaryToday.forEach((s) => {
      if (s.jenisMutasi === 'MASUK') {
        masukHariIni += Math.abs(s._sum?.jumlahPerubahan || 0);
      } else if (s.jenisMutasi === 'KELUAR') {
        const qty = Math.abs(s._sum?.jumlahPerubahan || 0);
        keluarHariIni += qty;
        if (s.kategoriItem === 'BMHP') bmhpKeluar += qty;
        if (s.kategoriItem === 'VAKSIN') vaksinKeluar += qty;
      }
    });

    return { masukHariIni, keluarHariIni, bmhpKeluar, vaksinKeluar };
  }, [summaryToday]);

  // Buka Modal Kartu Stok
  const handleOpenKartuStok = async (item: MutasiStokItem) => {
    const isVaksin = item.kategoriItem === 'VAKSIN';
    const itemId = isVaksin ? item.vaksinId : item.obatId;
    if (!itemId) return;

    setSelectedItemForKartu({
      id: itemId,
      nama: item.namaItem,
      jenis: isVaksin ? 'VAKSIN' : 'OBAT',
    });

    setLoadingKartu(true);
    try {
      const res = await farmasiService.getKartuStokItem(itemId, isVaksin ? 'VAKSIN' : 'OBAT');
      if (res && res.data) {
        setKartuStokLogs(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil kartu stok item:', err);
    } finally {
      setLoadingKartu(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href="/apoteker/stok" 
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Logistik Faskes
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Audit Trail Farmasi
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-teal-600" />
            Log Riwayat Keluar-Masuk (Mutasi Stok)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Pantau arus mutasi keluar-masuk obat, vaksin, dan BMHP (resep pasien, pelayanan imunisasi, pengadaan, dan pemakaian unit).
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={() => window.print()}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Jurnal</span>
          </button>

          <button
            onClick={fetchMutasiLogs}
            disabled={loading}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Masuk Hari Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            +{stats.masukHariIni.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Unit/Dosis</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Penerimaan & droping logistik</p>
        </div>

        <div className="bg-white p-4 border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Keluar Hari Ini</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 font-mono">
            -{stats.keluarHariIni.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Unit/Dosis</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Resep, imunisasi & pemakaian</p>
        </div>

        <div className="bg-white p-4 border border-purple-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BMHP Terpakai</span>
            <Syringe className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 font-mono">
            {stats.bmhpKeluar.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Item</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Spuit, infus, kassa, plester</p>
        </div>

        <div className="bg-white p-4 border border-cyan-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vaksin Diberikan</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-cyan-700 font-mono">
            {stats.vaksinKeluar.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Dosis</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Pelayanan imunisasi pasien</p>
        </div>
      </div>

      {/* ── FILTER SECTION ── */}
      <div className="bg-white p-5 border border-slate-200 shadow-sm space-y-4 print:hidden">
        {/* TAB KATEGORI ITEM */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => { setKategoriFilter('semua'); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              kategoriFilter === 'semua'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Logistik ({totalItems})
          </button>

          <button
            type="button"
            onClick={() => { setKategoriFilter('OBAT'); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              kategoriFilter === 'OBAT'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            Khusus Obat
          </button>

          <button
            type="button"
            onClick={() => { setKategoriFilter('BMHP'); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              kategoriFilter === 'BMHP'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            Khusus BMHP (Habis Pakai)
          </button>

          <button
            type="button"
            onClick={() => { setKategoriFilter('VAKSIN'); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              kategoriFilter === 'VAKSIN'
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Khusus Vaksin (Cold-Chain)
          </button>
        </div>

        {/* FORM FILTER PENCARIAN & TANGGAL */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama item, batch, no resep, pasien..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Jenis Mutasi
            </label>
            <select
              value={jenisFilter}
              onChange={(e) => { setJenisFilter(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-teal-600 bg-white"
            >
              <option value="semua">Semua Transaksi</option>
              <option value="MASUK">Masuk (Penerimaan)</option>
              <option value="KELUAR">Keluar (Pemakaian / Resep)</option>
              <option value="PENYESUAIAN">Penyesuaian / Opname</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-teal-600 bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-teal-600 bg-white"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors text-center"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-300 transition-colors"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* ── LOGS TABLE ── */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tabel Mutasi Arus Logistik ({totalItems} Transaksi Ditemukan)
          </span>
          <span className="text-xs text-slate-400">
            Halaman {page} dari {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Waktu & Tanggal</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3">Batch & Exp</th>
                <th className="p-3 text-center">Jenis</th>
                <th className="p-3 text-right">Perubahan</th>
                <th className="p-3 text-right">Saldo Stok</th>
                <th className="p-3">Referensi & Keterangan</th>
                <th className="p-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    <span>Memuat riwayat mutasi stok...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Belum ada catatan log mutasi keluar-masuk</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                      Catatan mutasi akan otomatis tercatat saat resep ditebus, vaksinasi diberikan, atau saat penambahan/pengurangan stok manual dilakukan.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((item, idx) => {
                  const isMasuk = item.jenisMutasi === 'MASUK';
                  const isKeluar = item.jenisMutasi === 'KELUAR';

                  const badgeKategoriClass = 
                    item.kategoriItem === 'VAKSIN' 
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                      : item.kategoriItem === 'BMHP'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200';

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                        {(page - 1) * 30 + idx + 1}
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700">
                        <div className="font-bold text-slate-900">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black border uppercase tracking-wider ${badgeKategoriClass}`}>
                          {item.kategoriItem === 'VAKSIN' && <Clock className="w-3 h-3" />}
                          {item.kategoriItem === 'BMHP' && <Syringe className="w-3 h-3" />}
                          {item.kategoriItem === 'OBAT' && <Pill className="w-3 h-3" />}
                          {item.kategoriItem}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleOpenKartuStok(item)}
                          className="text-left font-bold text-teal-800 hover:text-teal-950 hover:underline leading-tight"
                          title="Klik untuk melihat Kartu Stok lengkap barang ini"
                        >
                          {item.namaItem}
                        </button>
                        {item.sediaan && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {item.sediaan}
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap text-[11px] font-mono">
                        <span className="text-slate-800 font-semibold">{item.noBatch}</span>
                        {item.tanggalExpired && (
                          <span className="block text-[10px] text-slate-400">
                            Exp: {new Date(item.tanggalExpired).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${
                            isMasuk
                              ? 'bg-emerald-100 text-emerald-800'
                              : isKeluar
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isMasuk && <ArrowDownRight className="w-3 h-3" />}
                          {isKeluar && <ArrowUpRight className="w-3 h-3" />}
                          {item.jenisMutasi}
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span className={item.jumlahPerubahan > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {item.jumlahPerubahan > 0 ? `+${item.jumlahPerubahan}` : item.jumlahPerubahan}
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div className="text-[10px] text-slate-400">
                          {item.stokAwal} &rarr;
                        </div>
                        <div className="font-bold text-slate-900 text-xs">
                          {item.stokAkhir}
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        {item.referensi && (
                          <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold mb-0.5">
                            {item.referensi}
                          </span>
                        )}
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {item.keterangan || '-'}
                        </p>
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-600 text-[11px]">
                        <span className="font-medium text-slate-800 block">
                          {item.petugasNama || 'Sistem'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs print:hidden">
            <span className="text-slate-500">
              Menampilkan {logs.length} dari {totalItems} log transaksi
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-slate-700 px-2 font-mono">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL KARTU STOK ITEM ── */}
      {selectedItemForKartu && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedItemForKartu(null)}
        >
          <div 
            className="bg-white border border-slate-300 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                  Kartu Stok Barang
                </span>
                <h3 className="text-sm font-bold tracking-wide">
                  {selectedItemForKartu.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForKartu(null)}
                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-auto p-4">
              {loadingKartu ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                  <span>Memuat riwayat kartu stok...</span>
                </div>
              ) : kartuStokLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Belum ada log pergerakan stok untuk item ini.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase">
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Jenis</th>
                      <th className="p-2.5 text-right">Mutasi</th>
                      <th className="p-2.5 text-right">Saldo Akhir</th>
                      <th className="p-2.5">Referensi & Keterangan</th>
                      <th className="p-2.5">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {kartuStokLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-600">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}{' '}
                          {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2.5 text-slate-800 font-bold">{log.noBatch}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold ${log.jenisMutasi === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {log.jenisMutasi}
                          </span>
                        </td>
                        <td className={`p-2.5 text-right font-bold ${log.jumlahPerubahan > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {log.jumlahPerubahan > 0 ? `+${log.jumlahPerubahan}` : log.jumlahPerubahan}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{log.stokAkhir}</td>
                        <td className="p-2.5 text-slate-600 font-sans max-w-[180px] truncate" title={log.keterangan || ''}>
                          {log.referensi && <span className="font-bold mr-1">[{log.referensi}]</span>}
                          {log.keterangan || '-'}
                        </td>
                        <td className="p-2.5 text-slate-500 font-sans">{log.petugasNama || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemForKartu(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
