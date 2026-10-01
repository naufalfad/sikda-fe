'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, FileText, CheckCircle, Trash2, Edit, RefreshCw, Baby, X } from 'lucide-react';
import { usePasienStore } from '@/store/pasien.store';
import Link from 'next/link';

export default function MasterPasienAdminPage() {
  const { pasiens, isLoading, fetchPasiens, deletePasien, syncPasienIHS } = usePasienStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | number | null>(null);
  const [expandedMotherId, setExpandedMotherId] = useState<number | string | null>(null);

  const toggleExpandMother = (id: number | string) => {
    setExpandedMotherId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    fetchPasiens();
  }, [fetchPasiens]);

  const handleDelete = async (id: string | number, nama: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pasien ${nama}?`)) {
      try {
        await deletePasien(id);
        alert('Data pasien berhasil dihapus');
      } catch (error) {
        alert('Gagal menghapus data pasien (mungkin ada data kunjungan yang terikat)');
      }
    }
  };

  const handleSyncIHS = async (id: string | number, nik: string | null) => {
    if (!nik) {
      alert('NIK pasien kosong, tidak bisa sinkronisasi dengan SATUSEHAT');
      return;
    }
    
    setSyncingId(id);
    try {
      await syncPasienIHS(nik);
      alert('Berhasil sinkronisasi IHS Number dengan SATUSEHAT');
    } catch (error: any) {
      alert(error.message || 'Gagal sinkronisasi dengan SATUSEHAT');
    } finally {
      setSyncingId(null);
    }
  };

  const filteredPasiens = pasiens.filter(p => {
    // Sembunyikan pasien bayi dari daftar utama (karena sudah berada di dalam dropdown ibunya)
    const isBayiChild = Boolean(p.dataBayi && p.dataBayi.nikIbu);
    if (isBayiChild) return false;

    return (
      p.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nik && p.nik.includes(searchQuery))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Master Data Pasien (Admin)
          </h1>
          <p className="text-gray-500 mt-2">Kelola seluruh data rekam medis pasien klinik.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari No RM / Nama / NIK..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link 
            href="/administrasi/master-pasien/baru-satusehat"
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-none shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Pasien Baru
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-medium border-b border-gray-200">
                <th className="py-4 px-6">No. RM & NIK</th>
                <th className="py-4 px-6">Nama Lengkap</th>
                <th className="py-4 px-6">Kontak</th>
                <th className="py-4 px-6">Tgl Lahir / Usia</th>
                <th className="py-4 px-6">Penjamin</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredPasiens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada data pasien.'}
                  </td>
                </tr>
              ) : (
                filteredPasiens.map((p) => {
                  const kontakUtama = p.kontak ? p.kontak.noHp : '-';
                  const penjaminUtama = p.penjamin ? p.penjamin.jenisPenjamin : 'UMUM / MANDIRI';
                  const isExpanded = expandedMotherId === p.id;
                  const anakList = pasiens.filter(a => a.dataBayi && a.dataBayi.nikIbu && p.nik && a.dataBayi.nikIbu === p.nik);
                  
                  // Hitung usia
                  const birthDate = new Date(p.tanggalLahir);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`border-b border-gray-100 text-slate-800 transition-colors ${isExpanded ? 'bg-purple-50/40' : 'hover:bg-gray-50'}`}>
                        <td className="py-4 px-6">
                          <div className="font-bold text-blue-700">{p.noRM}</div>
                          <div className="text-xs text-gray-500">NIK: {p.nik || 'Kosong'}</div>
                          {p.noIHS ? (
                            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                              <CheckCircle className="w-3 h-3 mr-1" /> IHS: {p.noIHS}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-600 mt-1 italic">Belum Sync IHS</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {p.namaLengkap}
                            {p.faskes && (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-none border border-emerald-200 flex-shrink-0">
                                {p.faskes.namaFaskes}
                              </span>
                            )}
                            {p.dataBayi && (
                              <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-sm border border-sky-200 flex-shrink-0">
                                Bayi
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{p.jenisKelamin}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">{kontakUtama}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-700">{new Date(p.tanggalLahir).toLocaleDateString('id-ID')}</div>
                          <div className="text-xs text-gray-500">{age} Tahun</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 text-xs font-medium rounded-none ${penjaminUtama.includes('BPJS') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                            {penjaminUtama}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {/* Tombol Dropdown Lihat Anak jika pasien ini memiliki anak terdaftar */}
                          {anakList.length > 0 && (
                            <button 
                              onClick={() => toggleExpandMother(p.id)}
                              className={`px-3 py-1.5 font-bold text-xs rounded-none border transition-colors inline-flex items-center gap-1.5 ${isExpanded ? 'bg-purple-700 text-white border-purple-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'}`}
                              title="Tampilkan / Sembunyikan Anak"
                            >
                              <Baby className="w-3.5 h-3.5" />
                              {isExpanded ? 'Sembunyikan Anak' : `Lihat Anak (${anakList.length})`}
                              <span className="text-[10px] ml-0.5">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          )}

                          {!p.noIHS && p.nik && (
                            <button 
                              onClick={() => handleSyncIHS(p.id, p.nik)}
                              disabled={syncingId === p.id}
                              className={`px-3 py-1.5 ${syncingId === p.id ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'} font-medium text-xs rounded-none transition-colors inline-flex items-center`}
                              title="Sync SATUSEHAT"
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncingId === p.id ? 'animate-spin' : ''}`} />
                              Sync IHS
                            </button>
                          )}
                          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-none transition-colors" title="Edit Data">
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id, p.namaLengkap)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs rounded-none transition-colors" 
                            title="Hapus Data"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>

                      {/* Dropdown Row Anak */}
                      {isExpanded && (
                        <tr className="bg-purple-50/60 border-b-2 border-purple-200">
                          <td colSpan={6} className="p-4 px-8">
                            <div className="bg-white border border-purple-200 rounded-none shadow-sm p-4 space-y-3">
                              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                                  <Baby className="w-4 h-4 text-purple-600" />
                                  Daftar Anak dari Ny. {p.namaLengkap} ({anakList.length} Anak)
                                </div>
                                <span className="text-[11px] text-purple-600 italic">Terhubung via NIK Ibu ({p.nik})</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {anakList.map((child) => (
                                  <div key={child.id} className="p-3 bg-slate-50 border border-slate-200 rounded-none flex items-start justify-between gap-3 hover:border-purple-300 transition-all">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-xs">{child.namaLengkap}</span>
                                        <span className="bg-sky-100 text-sky-700 text-[9px] font-bold px-1.5 py-0.2 rounded-none border border-sky-200">
                                          {child.jenisKelamin}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-600 flex items-center gap-3">
                                        <span>RM: <strong className="text-blue-700">{child.noRM}</strong></span>
                                        <span>Lahir: {new Date(child.tanggalLahir).toLocaleDateString('id-ID')}</span>
                                      </div>
                                      {child.dataBayi && (
                                        <div className="text-[10px] text-slate-500 pt-1 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-slate-200/60 mt-1">
                                          <span>BB: <strong>{child.dataBayi.beratLahir || '-'} gr</strong></span>
                                          <span>PB: <strong>{child.dataBayi.panjangLahir || '-'} cm</strong></span>
                                          <span>Jam: <strong>{child.dataBayi.jamLahir || '-'}</strong></span>
                                          <span>Urutan: <strong>{child.dataBayi.urutanKelahiran ?? 0}</strong></span>
                                        </div>
                                      )}
                                    </div>

                                    {child.noIHS ? (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 border border-emerald-200 rounded-none flex-shrink-0">
                                        IHS: {child.noIHS}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 border border-amber-200 rounded-none flex-shrink-0">
                                        Belum Sync IHS
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
