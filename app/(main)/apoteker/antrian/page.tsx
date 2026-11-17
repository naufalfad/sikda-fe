"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Pill, 
  Clock, 
  Search, 
  Loader2, 
  ArrowUpRight, 
  ClipboardList, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Home,
  Activity
} from 'lucide-react';
import { farmasiService, ResepData } from '@/services/farmasi.service';

export default function ApotekerAntrianPage() {
  const [antrian, setAntrian] = useState<ResepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<'ALL' | 'RAWAT_JALAN' | 'OBAT_PULANG'>('ALL');

  useEffect(() => {
    fetchAntrian();
  }, []);

  const fetchAntrian = async () => {
    try {
      const data = await farmasiService.getAntrian();
      setAntrian(data);
    } catch (error) {
      console.error('Error fetching antrian:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResepCategory = (resep: ResepData): 'OBAT_PULANG' | 'RAWAT_JALAN' => {
    const isPulang = resep.details.some(d => d.catatan?.toLowerCase().includes('pulang')) ||
                     resep.kunjungan.jenisPelayanan === 'Rawat Inap';
    return isPulang ? 'OBAT_PULANG' : 'RAWAT_JALAN';
  };

  const isResepReadyForDispense = (resep: ResepData): boolean => {
    const isPaid = resep.kunjungan.tagihan?.statusTagihan === 'LUNAS';
    const isBpjs = resep.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS') || false;
    const isUkm = resep.kunjungan.jenisPelayanan === 'UKM';
    return isPaid || isBpjs || isUkm;
  };

  const filteredAntrian = useMemo(() => {
    return antrian.filter(resep => {
      const matchesSearch = 
        resep.pasien.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resep.pasien.noRM.includes(searchQuery);

      if (!matchesSearch) return false;

      if (kategoriFilter === 'ALL') return true;
      return getResepCategory(resep) === kategoriFilter;
    });
  }, [antrian, searchQuery, kategoriFilter]);

  const stats = useMemo(() => {
    const total = antrian.length;
    const obatPulang = antrian.filter(r => getResepCategory(r) === 'OBAT_PULANG').length;
    const rawatJalan = total - obatPulang;
    const siapLayani = antrian.filter(r => isResepReadyForDispense(r)).length;
    return { total, obatPulang, rawatJalan, siapLayani };
  }, [antrian]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-200">
              <ClipboardList className="w-7 h-7" />
            </div>
            Antrian Resep Farmasi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Penyiapan obat resep rawat jalan dan obat pulang pasien rawat inap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama pasien / No RM..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full sm:w-72 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setKategoriFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            kategoriFilter === 'ALL'
              ? 'bg-teal-50/70 border-teal-300 shadow-sm ring-2 ring-teal-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semua Antrian</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total resep menunggu</div>
        </button>

        <button
          onClick={() => setKategoriFilter('RAWAT_JALAN')}
          className={`p-4 rounded-xl border text-left transition-all ${
            kategoriFilter === 'RAWAT_JALAN'
              ? 'bg-sky-50/70 border-sky-300 shadow-sm ring-2 ring-sky-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Resep Rawat Jalan</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.rawatJalan}</div>
          <div className="text-xs text-gray-500 mt-0.5">Poli reguler & konsultasi</div>
        </button>

        <button
          onClick={() => setKategoriFilter('OBAT_PULANG')}
          className={`p-4 rounded-xl border text-left transition-all ${
            kategoriFilter === 'OBAT_PULANG'
              ? 'bg-purple-50/70 border-purple-300 shadow-sm ring-2 ring-purple-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Obat Pulang Inap</span>
            <Home className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.obatPulang}</div>
          <div className="text-xs text-gray-500 mt-0.5">Take-home discharge pasien</div>
        </button>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Siap Diserahkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2">{stats.siapLayani}</div>
          <div className="text-xs text-emerald-700 mt-0.5">Lunas di kasir / BPJS</div>
        </div>
      </div>

      {/* Table Antrian */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Waktu Masuk</th>
                <th className="px-5 py-3.5 font-semibold">Pasien</th>
                <th className="px-5 py-3.5 font-semibold">Kategori Resep</th>
                <th className="px-5 py-3.5 font-semibold">Poli & Dokter</th>
                <th className="px-5 py-3.5 font-semibold">Status Kasir</th>
                <th className="px-5 py-3.5 font-semibold text-center">Rincian</th>
                <th className="px-5 py-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    </div>
                    <p className="text-sm">Memuat data antrian resep...</p>
                  </td>
                </tr>
              ) : filteredAntrian.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">
                      {searchQuery ? 'Tidak ada antrian yang cocok dengan kata kunci pencarian.' : 'Tidak ada antrian resep saat ini.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Semua resep telah selesai dilayani atau belum ada resep baru.</p>
                  </td>
                </tr>
              ) : (
                filteredAntrian.map((resep) => {
                  const category = getResepCategory(resep);
                  const isPaid = resep.kunjungan.tagihan?.statusTagihan === 'LUNAS';
                  const isBpjs = resep.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS') || false;
                  const isUkm = resep.kunjungan.jenisPelayanan === 'UKM';

                  return (
                    <tr key={resep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center text-orange-600 font-bold text-sm">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {new Date(resep.tanggalResep).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(resep.tanggalResep).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-sm">{resep.pasien.namaLengkap}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">RM: {resep.pasien.noRM}</span>
                          <span>•</span>
                          <span>{resep.pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {category === 'OBAT_PULANG' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Home className="w-3.5 h-3.5 text-purple-600" />
                            Obat Pulang (Inap)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <Activity className="w-3.5 h-3.5 text-sky-600" />
                            Resep Rawat Jalan
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800 text-sm">{resep.kunjungan.poliklinik.namaPoli}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {resep.kunjungan.jenisPelayanan === 'UKM' ? 'Petugas UKM: ' : 'Dr. '}
                          {resep.dokter?.namaLengkap || 'Sistem'}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Lunas di Kasir
                          </span>
                        ) : isBpjs || isUkm ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            {isUkm ? 'Program UKM (Gratis)' : 'Jaminan BPJS'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Menunggu Kasir
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {resep.details.length} Item Obat
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link 
                          href={`/apoteker/antrian/${resep.id}`}
                          className="inline-flex items-center justify-center px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors group"
                        >
                          Telaah & Proses
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
