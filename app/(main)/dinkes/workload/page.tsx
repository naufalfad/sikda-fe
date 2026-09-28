"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { 
  Activity, 
  ArrowLeft, 
  Users, 
  RefreshCw, 
  ArrowLeftRight, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  FileCheck2,
  Stethoscope,
  Info
} from 'lucide-react';
import { dinkesService, FaskesWorkload, FaskesItem } from '../../../../services/dinkes.service';

export default function DinkesWorkloadPage() {
  const [workloads, setWorkloads] = useState<FaskesWorkload[]>([]);
  const [faskesList, setFaskesList] = useState<FaskesItem[]>([]);
  const [mutasiHistory, setMutasiHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analisis' | 'riwayat'>('analisis');

  // Modal State
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [submittingMutasi, setSubmittingMutasi] = useState(false);
  const [mutasiForm, setMutasiForm] = useState({
    tenagaMedisId: '',
    faskesAsalId: '',
    faskesTujuanId: '',
    alasanMutasi: '',
    nomorSkDinkes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wlData, fData, mHistory] = await Promise.all([
        dinkesService.getWorkloadAnalytics(),
        dinkesService.getFaskesList(),
        dinkesService.getMutasiHistory()
      ]);
      setWorkloads(Array.isArray(wlData?.list) ? wlData.list : []);
      setFaskesList(Array.isArray(fData) ? fData : []);
      setMutasiHistory(Array.isArray(mHistory) ? mHistory : []);
    } catch (err: any) {
      console.error("Gagal memuat analitik beban kerja:", err);
      setWorkloads([]);
      setFaskesList([]);
      setMutasiHistory([]);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const wlList = Array.isArray(workloads) ? workloads : [];
  const fList = Array.isArray(faskesList) ? faskesList : [];
  const mList = Array.isArray(mutasiHistory) ? mutasiHistory : [];

  const openMutasiForFaskes = (targetFaskesId: string) => {
    setMutasiForm({
      tenagaMedisId: '',
      faskesAsalId: '',
      faskesTujuanId: targetFaskesId,
      alasanMutasi: 'Pemerataan beban kerja nakes karena lonjakan traffic pasien faskes penerima.',
      nomorSkDinkes: `SK-DINKES/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    });
    setShowMutasiModal(true);
  };

  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiForm.faskesTujuanId) {
      Swal.fire('Validasi Gagal', 'Pilih faskes tujuan mutasi.', 'warning');
      return;
    }

    setSubmittingMutasi(true);
    try {
      await dinkesService.createMutasiNakes({
        tenagaMedisId: mutasiForm.tenagaMedisId || 'cm00nakes0001dummy',
        faskesAsalId: mutasiForm.faskesAsalId,
        faskesTujuanId: mutasiForm.faskesTujuanId,
        alasanMutasi: mutasiForm.alasanMutasi,
        nomorSkDinkes: mutasiForm.nomorSkDinkes
      });

      Swal.fire({
        icon: 'success',
        title: 'Mutasi Berhasil Diterbitkan',
        text: 'SK Mutasi Dinas Kesehatan telah tercatat dan tenaga medis telah dialokasikan.',
      });
      setShowMutasiModal(false);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses Mutasi',
        text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan'
      });
    } finally {
      setSubmittingMutasi(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dinkes"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard Dinkes
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            Analisis Beban Kerja & Redistribusi Tenaga Medis
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Algoritma deteksi ketimpangan tenaga medis: faskes dengan traffic tinggi vs dokter terbatas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Sinkronkan
          </button>
          <button
            onClick={() => setShowMutasiModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Terbitkan SK Mutasi Nakes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('analisis')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'analisis'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Analisis Beban Kerja Faskes
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'riwayat'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Riwayat Mutasi Dinas ({mList.length})
        </button>
      </div>

      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">Standar Beban Kerja Dinas Kesehatan:</span> Rasio ideal pelayanan adalah maksimal 30 pasien per dokter per shift kerja. Faskes dengan rasio di atas 40 pasien/dokter dikategorikan <span className="font-bold text-rose-700">KRITIS TINGGI</span> dan membutuhkan penambahan tenaga medis atau BKO dari Puskesmas yang memiliki beban rendah.
            </div>
          </div>

          {/* Cards Grid of Faskes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                Menganalisis traffic dan dokter di seluruh faskes...
              </div>
            ) : wlList.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                Tidak ada data faskes.
              </div>
            ) : (
              wlList.map((item) => {
                const isOverloaded = item.bebanKerjaStatus === 'KRITIS_TINGGI' || item.bebanKerjaStatus === 'TINGGI';
                return (
                  <div
                    key={item.faskesId}
                    className={`bg-white rounded-xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                      isOverloaded ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.tipeFaskes}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.bebanKerjaStatus === 'KRITIS_TINGGI'
                              ? 'bg-rose-100 text-rose-800'
                              : item.bebanKerjaStatus === 'TINGGI'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.bebanKerjaStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-lg">{item.namaFaskes}</h3>
                      <p className="text-xs text-slate-500 mb-4">{item.wilayahKecamatan || 'Wilayah Terdaftar'}</p>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg mb-4 text-center">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Trafic Pasien</p>
                          <p className="text-lg font-black text-slate-900">{item.totalPasien}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Dokter Bertugas</p>
                          <p className="text-lg font-black text-slate-900">{item.totalDokter}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Rasio Beban:</span>
                          <span className="font-mono font-bold text-slate-900">{item.rasioPasienPerDokter} : 1</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.rasioPasienPerDokter > 40
                                ? 'bg-rose-600'
                                : item.rasioPasienPerDokter > 25
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.rasioPasienPerDokter / 50) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 mb-4">
                        <span className="font-bold text-slate-700 block mb-0.5">Analisis Rekomendasi:</span>
                        {item.rekomendasi}
                      </div>
                    </div>

                    {item.mutasiDibutuhkan && (
                      <button
                        onClick={() => openMutasiForFaskes(item.faskesId)}
                        className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Tugaskan Dokter ke Faskes Ini
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Daftar Surat Keputusan (SK) Mutasi Tenaga Medis</h3>
            <p className="text-xs text-slate-500">Log perpindahan atau penugasan dokter dan perawat antar faskes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Nomor SK Dinkes</th>
                  <th className="py-3 px-4">Nama Tenaga Medis</th>
                  <th className="py-3 px-4">Faskes Asal</th>
                  <th className="py-3 px-4">Faskes Tujuan</th>
                  <th className="py-3 px-4">Alasan Mutasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6">Tanggal SK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada riwayat mutasi tenaga medis yang tercatat.
                    </td>
                  </tr>
                ) : (
                  mList.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {m.nomorSkDinkes || '-'}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {m.tenagaMedis?.namaLengkap || 'Tenaga Medis Terdaftar'}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {m.faskesAsal?.namaFaskes || '-'}
                      </td>
                      <td className="py-4 px-4 font-semibold text-emerald-700">
                        {m.faskesTujuan?.namaFaskes || '-'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 max-w-xs">
                        {m.alasanMutasi}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                          {m.statusMutasi || 'SELESAI'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Mutasi */}
      {showMutasiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Penerbitan SK Mutasi Tenaga Medis</h3>
                <p className="text-xs text-slate-500">Alokasikan dokter/perawat untuk mengatasi ketimpangan beban kerja.</p>
              </div>
              <button
                onClick={() => setShowMutasiModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMutasi} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor SK Dinas Kesehatan
                </label>
                <input
                  type="text"
                  required
                  value={mutasiForm.nomorSkDinkes}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, nomorSkDinkes: e.target.value })}
                  placeholder="Contoh: SK-DINKES/2026/0891"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faskes Asal (Pemberi Tugas / BKO)
                </label>
                <select
                  value={mutasiForm.faskesAsalId}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, faskesAsalId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="">Pilih Faskes Asal (Opsional jika perekrutan baru)...</option>
                  {fList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.namaFaskes} ({f.tipeFaskes})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faskes Tujuan (Penerima Penambahan Nakes) *
                </label>
                <select
                  required
                  value={mutasiForm.faskesTujuanId}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, faskesTujuanId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="">Pilih Faskes Tujuan...</option>
                  {fList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.namaFaskes} ({f.tipeFaskes})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alasan & Dasar Mutasi Dinas
                </label>
                <textarea
                  rows={3}
                  required
                  value={mutasiForm.alasanMutasi}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, alasanMutasi: e.target.value })}
                  placeholder="Deskripsikan alasan mutasi / penugasan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMutasiModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingMutasi}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors disabled:opacity-60"
                >
                  {submittingMutasi ? 'Menerbitkan...' : 'Terbitkan SK Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
