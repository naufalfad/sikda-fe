"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Pill, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  PackageCheck, 
  Search, 
  Layers, 
  ShieldAlert, 
  Info,
  Syringe,
  Snowflake,
  Clock,
  Sparkles,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { 
  dinkesService, 
  MedicineStockAlert, 
  VaccineMonitoringResponse, 
  VaccineStockItem 
} from '../../../../services/dinkes.service';
import { masterService } from '../../../../services/master.service';

export default function DinkesMedicinesPage() {
  const [activeTab, setActiveTab] = useState<'alert' | 'vaksin' | 'katalog'>('alert');
  const [kategoriFilterAlert, setKategoriFilterAlert] = useState<'semua' | 'obat' | 'bmhp'>('semua');
  const [kategoriFilterKatalog, setKategoriFilterKatalog] = useState<'semua' | 'obat' | 'bmhp'>('semua');
  
  const [alerts, setAlerts] = useState<MedicineStockAlert[]>([]);
  const [vaccineData, setVaccineData] = useState<VaccineMonitoringResponse | null>(null);
  const [masterObat, setMasterObat] = useState<any[]>([]);
  const [searchKatalog, setSearchKatalog] = useState('');
  const [searchVaksin, setSearchVaksin] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertData, masterData, vacData] = await Promise.all([
        dinkesService.getMedicineAlerts(),
        masterService.getObat(),
        dinkesService.getVaccineMonitoring().catch(() => null)
      ]);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setMasterObat(Array.isArray(masterData?.data) ? masterData.data : []);
      setVaccineData(vacData);
    } catch (err) {
      console.error("Gagal memuat data logistik farmasi, BMHP, & vaksin:", err);
      setAlerts([]);
      setMasterObat([]);
      setVaccineData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const alertList = Array.isArray(alerts) ? alerts : [];
  const masterList = Array.isArray(masterObat) ? masterObat : [];

  // Filter Alert Kritis (Obat vs BMHP)
  const filteredAlerts = alertList.filter(item => {
    const isBmhp = item.kategori === 'BMHP';
    if (kategoriFilterAlert === 'obat') return !isBmhp;
    if (kategoriFilterAlert === 'bmhp') return isBmhp;
    return true;
  });

  const obatAlertCount = alertList.filter(a => a.kategori !== 'BMHP').length;
  const bmhpAlertCount = alertList.filter(a => a.kategori === 'BMHP').length;

  // Filter Master Data (Obat vs BMHP)
  const filteredMaster = masterList.filter(o => {
    const matchSearch = 
      (o.namaObat || '').toLowerCase().includes(searchKatalog.toLowerCase()) ||
      (o.kodeObat || '').toLowerCase().includes(searchKatalog.toLowerCase()) ||
      (o.kategori || '').toLowerCase().includes(searchKatalog.toLowerCase());
    
    if (!matchSearch) return false;
    const isBmhp = o.kategori === 'BMHP';
    if (kategoriFilterKatalog === 'obat') return !isBmhp;
    if (kategoriFilterKatalog === 'bmhp') return isBmhp;
    return true;
  });

  // Filter Vaksin Se-Kabupaten
  const faskesVaksinList = vaccineData?.data || [];
  const filteredFaskesVaksin = faskesVaksinList.filter(f => 
    f.namaFaskes.toLowerCase().includes(searchVaksin.toLowerCase()) ||
    f.kecamatan.toLowerCase().includes(searchVaksin.toLowerCase()) ||
    f.vaksinList.some(v => v.namaVaksin.toLowerCase().includes(searchVaksin.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dinkes"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard Dinkes
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-7 h-7 text-emerald-600" />
            Monitoring Logistik Obat, BMHP & Vaksin Daerah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengawasan logistik terpadu: deteksi dini kelangkaan obat, bahan medis habis pakai (BMHP), dan ketahanan rantai dingin (cold chain) vaksin se-Kabupaten.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          Perbarui Data
        </button>
      </div>

      {/* KPI Cards Ringkasan 4 Pilar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Formularium Obat & BMHP */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Katalog Obat & BMHP</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : `${masterList.length} Item`}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-semibold text-blue-700">{masterList.filter(m => m.kategori !== 'BMHP').length} Obat</span>
            <span>•</span>
            <span className="font-semibold text-purple-700">{masterList.filter(m => m.kategori === 'BMHP').length} BMHP</span>
          </div>
        </div>

        {/* Card 2: Defisit / Alert Kritis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Peringatan Kritis</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {loading ? '...' : `${alertList.length} Item`}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-rose-700 font-medium">
            <span>{obatAlertCount} Obat</span>
            <span>•</span>
            <span>{bmhpAlertCount} BMHP Kritis</span>
          </div>
        </div>

        {/* Card 3: Logistik Vaksin Cold-Chain */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">Total Dosis Vaksin</span>
            <Snowflake className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700">
            {loading ? '...' : `${vaccineData?.ringkasan?.totalDosisKabupaten || 0} Dosis`}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-cyan-800 font-medium">
            <span>❄️ Cold-Chain 2-8°C</span>
            <span>•</span>
            <span>{vaccineData?.ringkasan?.totalPuskesmas || 0} Puskesmas</span>
          </div>
        </div>

        {/* Card 4: Vaksin Kritis / FEFO */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Perhatian FEFO Vaksin</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {loading ? '...' : `${vaccineData?.ringkasan?.vaksinSegeraExpiredCount || 0} Batch`}
          </div>
          <p className="text-xs text-amber-800 font-medium mt-1">Batch vaksin mendekati kedaluwarsa (&lt; 60 hari)</p>
        </div>
      </div>

      {/* Info Banner Integrasi */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <span className="font-bold">Pemantauan Terpadu Tiga Komponen:</span> Sistem SIAP-KES memisahkan pengawasan menjadi <span className="font-bold text-blue-800">Obat-Obatan</span> (peresepan pasien), <span className="font-bold text-purple-800">BMHP</span> (spuit, kasa, infus habis pakai untuk tindakan), dan <span className="font-bold text-cyan-900">Vaksin Cold-Chain</span> (pelayanan imunisasi). Peringatan dini di bawah ini menjadi dasar Dinas Kesehatan menerbitkan Surat Bukti Barang Keluar (SBBK) untuk droping atau redistribusi logistik antar-Puskesmas.
        </div>
      </div>

      {/* Tabs Navigasi Utama */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('alert')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'alert'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Peringatan Stok Kritis ({alertList.length})
        </button>

        <button
          onClick={() => setActiveTab('vaksin')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vaksin'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Snowflake className="w-4 h-4" />
          Logistik Vaksin & Cold Chain Daerah ({vaccineData?.ringkasan?.totalDosisKabupaten || 0} Dosis)
        </button>

        <button
          onClick={() => setActiveTab('katalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'katalog'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Formularium Obat & BMHP ({masterList.length})
        </button>
      </div>

      {/* TAB 1: PERINGATAN STOK KRITIS (OBAT & BMHP) */}
      {activeTab === 'alert' && (
        <div className="space-y-4">
          {/* Sub-filter Kategori Alert */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <span>Filter Kategori Defisit:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKategoriFilterAlert('semua')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  kategoriFilterAlert === 'semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Alert ({alertList.length})
              </button>
              <button
                onClick={() => setKategoriFilterAlert('obat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  kategoriFilterAlert === 'obat'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Khusus Obat ({obatAlertCount})
              </button>
              <button
                onClick={() => setKategoriFilterAlert('bmhp')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  kategoriFilterAlert === 'bmhp'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                Khusus BMHP ({bmhpAlertCount})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Daftar Pasokan Mencapai Batas Minimum / Kritis ({filteredAlerts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Data real-time dari faskes yang memerlukan bantuan droping atau redistribusi obat &amp; BMHP.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full w-fit">
                Prioritas Intervensi Logistik
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Jenis &amp; Kategori</th>
                    <th className="py-3 px-4">Nama Barang &amp; Sediaan</th>
                    <th className="py-3 px-4">Fasilitas Kesehatan</th>
                    <th className="py-3 px-4 text-center">Stok Fisik</th>
                    <th className="py-3 px-4 text-center">Batas Buffer</th>
                    <th className="py-3 px-4 text-center">Defisit</th>
                    <th className="py-3 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Memeriksa stok logistik faskes...
                      </td>
                    </tr>
                  ) : filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-emerald-600">
                        <PackageCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                        Seluruh stok logistik dalam kategori ini berada pada tingkat persediaan aman.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((item) => {
                      const isBmhp = item.kategori === 'BMHP';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                                isBmhp
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {isBmhp ? <Syringe className="w-3 h-3" /> : <Pill className="w-3 h-3" />}
                              {isBmhp ? 'BMHP' : 'OBAT'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-900">
                            {item.namaObat}
                            <span className="text-xs text-slate-400 block font-normal">
                              Satuan: {item.satuan}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{item.namaFaskes}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-rose-600 font-mono">
                            {item.stokFaskes} {item.satuan}
                          </td>
                          <td className="py-4 px-4 text-center text-slate-500 font-mono">
                            {item.stokMinimum} {item.satuan}
                          </td>
                          <td className="py-4 px-4 text-center text-rose-600 font-bold font-mono">
                            -{Math.max(0, item.stokMinimum - item.stokFaskes)} {item.satuan}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                                item.statusStok === 'HABIS'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
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
        </div>
      )}

      {/* TAB 2: MONITORING VAKSIN & COLD-CHAIN SE-KABUPATEN */}
      {activeTab === 'vaksin' && (
        <div className="space-y-6">
          {/* Search Bar Vaksin */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchVaksin}
              onChange={(e) => setSearchVaksin(e.target.value)}
              placeholder="Cari nama vaksin, target imunisasi, atau nama Puskesmas..."
              className="w-full text-sm text-slate-800 outline-none bg-transparent"
            />
          </div>

          {/* Cards per Puskesmas */}
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
                Memuat data kulkas &amp; stok vaksin daerah...
              </div>
            ) : filteredFaskesVaksin.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Tidak ada data vaksin yang sesuai dengan pencarian.
              </div>
            ) : (
              filteredFaskesVaksin.map((faskes) => (
                <div key={faskes.faskesId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Faskes Header */}
                  <div className="p-5 bg-gradient-to-r from-cyan-50/50 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Snowflake className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          {faskes.namaFaskes}
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono">
                            {faskes.kodeFaskes}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Wilayah Kecamatan {faskes.kecamatan} • Kulkas Cold-Chain Vaksin Terstandar
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block">Total Persediaan:</span>
                        <span className="font-black text-cyan-700 text-sm font-mono">{faskes.totalDosis} Dosis</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block">Batch Aktif:</span>
                        <span className="font-bold text-slate-800 text-sm">{faskes.jumlahBatch} Batch</span>
                      </div>
                      {faskes.kritisBatchCount > 0 && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                          {faskes.kritisBatchCount} Kritis
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vaccine Batch Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-6">Nama Vaksin &amp; Target Imunisasi</th>
                          <th className="py-3 px-4 font-mono">No. Lot / Batch Pabrik</th>
                          <th className="py-3 px-4 text-center">Suhu Cold-Chain</th>
                          <th className="py-3 px-4 text-center">Stok Dosis</th>
                          <th className="py-3 px-4 text-center">Buffer Min</th>
                          <th className="py-3 px-4 text-center">Tanggal Expired</th>
                          <th className="py-3 px-6 text-center">Status Pasokan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {faskes.vaksinList.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-900 block">{v.namaVaksin}</span>
                              <span className="text-xs text-cyan-700 font-medium block">
                                Target: {v.targetPenyakit || 'Imunisasi Rutin'}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-700 text-xs">
                              {v.noBatch}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                                <Snowflake className="w-3 h-3 text-cyan-600" />
                                {v.suhuPenyimpanan}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-slate-900 font-mono">
                              {v.stok} Dosis
                            </td>
                            <td className="py-4 px-4 text-center text-slate-500 font-mono text-xs">
                              {v.stokMinimum} Dosis
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="text-xs font-medium text-slate-700">
                                {v.tanggalExpired ? new Date(v.tanggalExpired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </div>
                              {v.sisaHari !== null && (
                                <span
                                  className={`inline-block mt-0.5 px-2 py-0.2 text-[10px] font-bold rounded-full ${
                                    v.statusExpired === 'KADALUWARSA'
                                      ? 'bg-rose-100 text-rose-800'
                                      : v.statusExpired === 'SEGERA_KADALUWARSA'
                                      ? 'bg-orange-100 text-orange-800'
                                      : v.statusExpired === 'WASPADA'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {v.sisaHari < 0 ? 'KADALUWARSA' : `${v.sisaHari} Hari (FEFO)`}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                                  v.statusStok === 'HABIS'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : v.statusStok === 'KRITIS'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {v.statusStok}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KATALOG FORMULARIUM & BMHP DAERAH */}
      {activeTab === 'katalog' && (
        <div className="space-y-4">
          {/* Search & Filter Kategori */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-full sm:w-1/2 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKatalog}
                onChange={(e) => setSearchKatalog(e.target.value)}
                placeholder="Cari nama barang, kode, atau sediaan..."
                className="w-full text-sm text-slate-800 outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setKategoriFilterKatalog('semua')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  kategoriFilterKatalog === 'semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({masterList.length})
              </button>
              <button
                onClick={() => setKategoriFilterKatalog('obat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  kategoriFilterKatalog === 'obat'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Obat ({masterList.filter(m => m.kategori !== 'BMHP').length})
              </button>
              <button
                onClick={() => setKategoriFilterKatalog('bmhp')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  kategoriFilterKatalog === 'bmhp'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                BMHP ({masterList.filter(m => m.kategori === 'BMHP').length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Seluruh Formularium Master Obat &amp; BMHP Daerah ({filteredMaster.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Data master obat dan bahan medis habis pakai yang disinkronisasi ke seluruh Puskesmas se-Kabupaten.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Tipe Barang</th>
                    <th className="py-3 px-4">Kode Barang</th>
                    <th className="py-3 px-4">Nama Item &amp; Spesifikasi</th>
                    <th className="py-3 px-4">Kategori Sistem</th>
                    <th className="py-3 px-4">Bentuk Kemasan</th>
                    <th className="py-3 px-4 text-right">Harga Standar (Rp)</th>
                    <th className="py-3 px-6 text-center">Status Katalog</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Memuat master data...
                      </td>
                    </tr>
                  ) : filteredMaster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada data yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMaster.map((item) => {
                      const isBmhp = item.kategori === 'BMHP';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                                isBmhp
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {isBmhp ? <Syringe className="w-3 h-3" /> : <Pill className="w-3 h-3" />}
                              {isBmhp ? 'BMHP' : 'OBAT'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-900">
                            {item.kodeObat}
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            {item.namaObat}
                          </td>
                          <td className="py-4 px-4 text-slate-600 text-xs">
                            {item.kategori || 'Obat Bebas'}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {item.sediaan || 'Pcs'}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">
                            {item.harga ? Number(item.harga).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Aktif Terdaftar
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
        </div>
      )}
    </div>
  );
}
