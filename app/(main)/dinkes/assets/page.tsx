"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  Building2, 
  Wrench, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { dinkesService, CriticalAssetAlert } from '../../../../services/dinkes.service';

export default function DinkesAssetsPage() {
  const [criticalAssets, setCriticalAssets] = useState<CriticalAssetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await dinkesService.getCriticalAssets();
      setCriticalAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat aset kritis:", err);
      setCriticalAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const assetList = Array.isArray(criticalAssets) ? criticalAssets : [];

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
            <Package className="w-7 h-7 text-emerald-600" />
            Monitoring Aset & Alat Kesehatan (Alkes) Daerah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengawasan status operasional, kalibrasi, dan kerusakan alat kesehatan di seluruh Puskesmas.
          </p>
        </div>

        <button
          onClick={fetchAssets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          Perbarui Aset
        </button>
      </div>

      {/* Warning Card */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900 text-sm">Peringatan Kesiapan Alkes Pelayanan Publik</h3>
          <p className="text-xs text-amber-800 leading-relaxed mt-1">
            Alat kesehatan dengan kondisi rusak berat atau dalam perbaikan dapat melumpuhkan layanan gawat darurat dan rawat inap. Dinas Kesehatan dapat memberikan instruksi bantuan teknis atau peminjaman alkes antar-faskes.
          </p>
        </div>
      </div>

      {/* Table of Critical Assets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Daftar Alkes Kritis Membutuhkan Tindakan ({assetList.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Kode Aset</th>
                <th className="py-3 px-4">Nama Alat Medis</th>
                <th className="py-3 px-4">Fasilitas Kesehatan</th>
                <th className="py-3 px-4">Ruangan</th>
                <th className="py-3 px-4">Kategori Aset</th>
                <th className="py-3 px-4 text-center">Kondisi Fisik</th>
                <th className="py-3 px-6 text-center">Status Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data aset alkes...
                  </td>
                </tr>
              ) : assetList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-emerald-600">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    Semua alat kesehatan di seluruh faskes dalam kondisi baik dan beroperasi normal.
                  </td>
                </tr>
              ) : (
                assetList.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {asset.kodeAset}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {asset.namaAset}
                      {asset.merk && (
                        <span className="text-xs text-slate-400 block font-normal">
                          Merk: {asset.merk}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{asset.faskes?.namaFaskes || 'Puskesmas Terdata'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {asset.ruangan?.namaRuangan || '-'}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {asset.kategoriAset}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
                        {asset.kondisiAset}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                        {asset.statusOperasional.replace('_', ' ')}
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
  );
}
