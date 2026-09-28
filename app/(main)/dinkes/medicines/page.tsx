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
  Info
} from 'lucide-react';
import { dinkesService, MedicineStockAlert } from '../../../../services/dinkes.service';
import { masterService } from '../../../../services/master.service';

export default function DinkesMedicinesPage() {
  const [activeTab, setActiveTab] = useState<'alert' | 'katalog'>('alert');
  const [alerts, setAlerts] = useState<MedicineStockAlert[]>([]);
  const [masterObat, setMasterObat] = useState<any[]>([]);
  const [searchKatalog, setSearchKatalog] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertData, masterData] = await Promise.all([
        dinkesService.getMedicineAlerts(),
        masterService.getObat()
      ]);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setMasterObat(Array.isArray(masterData?.data) ? masterData.data : []);
    } catch (err) {
      console.error("Gagal memuat data logistik obat:", err);
      setAlerts([]);
      setMasterObat([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const alertList = Array.isArray(alerts) ? alerts : [];
  const masterList = Array.isArray(masterObat) ? masterObat : [];

  const filteredMaster = masterList.filter(o => 
    (o.namaObat || '').toLowerCase().includes(searchKatalog.toLowerCase()) ||
    (o.kodeObat || '').toLowerCase().includes(searchKatalog.toLowerCase()) ||
    (o.kategori || '').toLowerCase().includes(searchKatalog.toLowerCase())
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
            Monitoring Stok Obat & Logistik Farmasi Daerah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengawasan logistik terpadu: sistem deteksi dini kelangkaan obat di faskes dan formularium obat daerah se-Kabupaten.
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

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Formularium Obat Daerah</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : `${masterList.length} Jenis`}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total katalog master obat aktif di seluruh faskes</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Obat Kritis / Menipis</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {loading ? '...' : `${alertList.length} Item`}
          </div>
          <p className="text-xs text-rose-700 font-medium mt-1">Stok faskes berada di bawah batas minimum</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tingkat Ketahanan Stok</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {loading ? '...' : `${Math.max(0, masterList.length - alertList.length)} Jenis Aman`}
          </div>
          <p className="text-xs text-slate-500 mt-1">Persediaan faskes dalam status memadai</p>
        </div>
      </div>

      {/* Info Banner Penjelasan */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <span className="font-bold">Informasi Data Obat:</span> Tab <span className="font-semibold text-rose-800">Peringatan Stok Kritis</span> secara khusus hanya menampilkan obat yang sisa stok fisiknya di faskes sudah mencapai batas minimum/defisit untuk dasar intervensi logistik Dinas Kesehatan. Untuk melihat seluruh katalog master data obat yang ada di sistem (sama seperti tampilan di faskes), Anda dapat berpindah ke tab <span className="font-semibold text-emerald-800">Katalog Master Obat Daerah</span>.
        </div>
      </div>

      {/* Tabs Navigasi */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('alert')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'alert'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Peringatan Stok Kritis ({alertList.length})
        </button>
        <button
          onClick={() => setActiveTab('katalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'katalog'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Katalog Master Formularium Daerah ({masterList.length})
        </button>
      </div>

      {/* TAB 1: DAFTAR OBAT KRITIS */}
      {activeTab === 'alert' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Obat Mencapai Batas Minimum / Kritis ({alertList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Peringatan dini otomatis dari faskes yang memerlukan bantuan droping atau redistribusi obat.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full w-fit">
              Prioritas Tindakan Dinas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Nama Obat & Sediaan</th>
                  <th className="py-3 px-4">Fasilitas Kesehatan</th>
                  <th className="py-3 px-4 text-center">Stok Fisik Saat Ini</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">Kekurangan / Defisit</th>
                  <th className="py-3 px-6 text-center">Status Pasokan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Memeriksa stok obat faskes...
                    </td>
                  </tr>
                ) : alertList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-emerald-600">
                      <PackageCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      Semua stok obat di seluruh faskes berada pada tingkat persediaan aman.
                    </td>
                  </tr>
                ) : (
                  alertList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KATALOG MASTER OBAT DAERAH */}
      {activeTab === 'katalog' && (
        <div className="space-y-4">
          {/* Search Bar Katalog */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKatalog}
              onChange={(e) => setSearchKatalog(e.target.value)}
              placeholder="Cari berdasarkan nama obat, kode obat, atau kategori sediaan..."
              className="w-full text-sm text-slate-800 outline-none bg-transparent"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Seluruh Formularium Master Obat Terdaftar ({filteredMaster.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Data master obat baku yang tersinkronisasi di sistem dan digunakan oleh seluruh faskes se-Kabupaten.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Kode Obat</th>
                    <th className="py-3 px-4">Nama Obat</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Bentuk Sediaan</th>
                    <th className="py-3 px-4 text-right">Harga Standar (Rp)</th>
                    <th className="py-3 px-6 text-center">Status Formularium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Memuat master data obat...
                      </td>
                    </tr>
                  ) : filteredMaster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada data obat yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMaster.map((obat) => (
                      <tr key={obat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {obat.kodeObat}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {obat.namaObat}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-xs">
                          {obat.kategori || 'Obat Bebas'}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {obat.sediaan || 'Tablet'}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">
                          {obat.harga ? Number(obat.harga).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Aktif Terdaftar
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
    </div>
  );
}

