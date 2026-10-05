"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Search, User, Clock, CheckCircle2, Calendar, Eye, Filter, Loader2, ShieldCheck
} from 'lucide-react';
import { rawatJalanService } from '@/services/rawatJalan.service';
import { AntrianDokter } from '@/types/rawatJalan.types';

export default function RMEDaftarRiwayatPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riwayatData, setRiwayatData] = useState<AntrianDokter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPoli, setSelectedPoli] = useState<string>('ALL');

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const res = await rawatJalanService.getRiwayat();
        if (res.success) {
          setRiwayatData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch riwayat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiwayat();
  }, []);

  const availablePolis = Array.from(
    new Set(riwayatData.map((item) => item.poliklinik?.namaPoli).filter(Boolean))
  );

  const filteredData = riwayatData.filter((item) => {
    const matchSearch =
      item.pasien?.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pasien?.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.poliklinik?.namaPoli || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.dokterTujuan?.namaLengkap || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchPoli = selectedPoli === 'ALL' || item.poliklinik?.namaPoli === selectedPoli;

    return matchSearch && matchPoli;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pt-8 pb-16 px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-none border border-white/20 backdrop-blur-sm">
              <FileText className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Daftar Riwayat RME Pasien Anda</h1>
              <p className="text-slate-300 mt-1 text-sm font-medium">Arsip rekam medis pasien yang pernah Anda tangani dalam pelayanan faskes ini</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Privasi Terlindungi: Khusus Pasien yang Pernah Anda Rawat
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-none shadow-xl shadow-slate-200/50 border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari Nama Pasien, No. RM, atau Poliklinik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
            
            {/* Filter Poli Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedPoli('ALL')}
                className={`px-3 py-2 text-xs font-bold transition-all ${
                  selectedPoli === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua Poli ({riwayatData.length})
              </button>
              {availablePolis.map((poli) => {
                const count = riwayatData.filter((item) => item.poliklinik?.namaPoli === poli).length;
                return (
                  <button
                    key={poli}
                    onClick={() => setSelectedPoli(poli as string)}
                    className={`px-3 py-2 text-xs font-bold transition-all ${
                      selectedPoli === poli
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {poli} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs font-bold text-gray-500 bg-gray-50/80 border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pasien</th>
                  <th className="px-6 py-4">Poliklinik &amp; Dokter</th>
                  <th className="px-6 py-4">Waktu Selesai</th>
                  <th className="px-6 py-4">Diagnosis Utama</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Memuat data riwayat...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada riwayat RME yang cocok dengan filter atau pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {item.pasien?.namaLengkap}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1 ml-6">{item.pasien?.noRM}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {item.poliklinik?.namaPoli || 'Poli Umum'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Dr: <span className="font-semibold text-gray-700">{item.dokterTujuan?.namaLengkap || '-'}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" /> {new Date(item.tanggalRegistrasi).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 ml-0.5">
                          <Clock className="w-3 h-3 text-gray-400" /> Jam {item.jamRegistrasi}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-none text-xs font-medium border border-gray-200 inline-block truncate max-w-[250px]">
                          {item.diagnosis && item.diagnosis.length > 0
                            ? (() => {
                                const utama = item.diagnosis.find((d: any) => d.jenisDiagnosis === 'Utama') || item.diagnosis[0];
                                return utama.icd10?.nama_diagnosis || utama.diagnosisKlinis || 'Diagnosis Utama';
                              })()
                            : 'Belum ada diagnosa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-none text-xs font-bold border border-emerald-200">
                          {item.statusKunjungan === 'SELESAI' ? 'SELESAI' : 'DI FARMASI'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dokter/rme-dokter/${item.pasien?.noRM}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 font-medium text-xs rounded-none border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          Buka RME
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Dummy */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">Menampilkan {filteredData.length} data riwayat</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 bg-white text-gray-400 rounded-none text-sm cursor-not-allowed">Sebelumnya</button>
              <button className="px-3 py-1 border border-gray-200 bg-white text-blue-600 rounded-none text-sm hover:bg-blue-50">Selanjutnya</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
