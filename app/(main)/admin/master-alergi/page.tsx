"use client";

import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, Edit2, Trash2, X, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface Alergi {
  id_alergi: string;
  kode_snomed: string;
  nama_alergi: string;
  kategori: string;
  status_aktif: boolean;
}

export default function MasterAlergiPage() {
  const [alergi, setAlergi] = useState<Alergi[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingData, setEditingData] = useState<Alergi | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    kode_snomed: '',
    nama_alergi: '',
    kategori: 'food',
    status_aktif: true
  });

  // KFA Search State
  const [kfaSearchTerm, setKfaSearchTerm] = useState('');
  const [isSearchingKfa, setIsSearchingKfa] = useState(false);
  const [kfaResults, setKfaResults] = useState<any[]>([]);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchAlergi();
  }, []);

  const fetchAlergi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/master-alergi`);
      const data = await res.json();
      if(Array.isArray(data)) setAlergi(data);
    } catch (error) {
      console.error('Failed to fetch alergi', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_snomed || !formData.nama_alergi) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Kode SNOMED/KFA dan Nama Alergen wajib diisi.',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingData 
        ? `${API_URL}/master-alergi/${editingData.id_alergi}` 
        : `${API_URL}/master-alergi`;
      const method = editingData ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchAlergi();
        setFormData({ kode_snomed: '', nama_alergi: '', kategori: 'food', status_aktif: true });
        setEditingData(null);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: editingData ? 'Data alergi berhasil diperbarui.' : 'Master data alergi baru berhasil ditambahkan.',
          timer: 1600,
          showConfirmButton: false
        });
      } else {
        const err = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: err.error || err.message || 'Terjadi kesalahan pada server.',
          confirmButtonColor: '#dc2626'
        });
      }
    } catch (error: any) {
      console.error('Failed to save', error);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: error.message || 'Gagal menghubungi server.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Master Alergi?',
      text: `Apakah Anda yakin ingin menghapus data alergen "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/master-alergi/${id}`, { method: 'DELETE' });
        if(res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Terhapus',
            text: 'Data master alergi berhasil dihapus.',
            timer: 1400,
            showConfirmButton: false
          });
          fetchAlergi();
        } else {
          const err = await res.json();
          Swal.fire('Gagal Menghapus', err.error || 'Terjadi kesalahan', 'error');
        }
      } catch (error) {
        console.error('Failed to delete', error);
        Swal.fire('Gagal Menghapus', 'Tidak dapat terhubung ke server', 'error');
      }
    }
  };

  const openEdit = (data: Alergi) => {
    setEditingData(data);
    setFormData({
      kode_snomed: data.kode_snomed,
      nama_alergi: data.nama_alergi,
      kategori: data.kategori,
      status_aktif: data.status_aktif
    });
    setKfaSearchTerm('');
    setKfaResults([]);
    setIsModalOpen(true);
  };

  const handleSearchKFA = async () => {
    if (kfaSearchTerm.length < 3) {
      Swal.fire({
        icon: 'info',
        title: 'Pencarian KFA',
        text: 'Masukkan minimal 3 huruf untuk mencari obat di SATUSEHAT.',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    setIsSearchingKfa(true);
    try {
      const res = await fetch(`${API_URL}/master-alergi/kfa?keyword=${kfaSearchTerm}`);
      const result = await res.json();
      if (result.success && result.data && result.data.items) {
        setKfaResults(result.data.items.data || result.data.items);
      } else {
        setKfaResults([]);
      }
    } catch (err) {
      console.error('Error search KFA:', err);
    } finally {
      setIsSearchingKfa(false);
    }
  };

  const selectKFA = (item: any) => {
    setFormData({
      ...formData,
      kode_snomed: item.kfa_code || item.kfaCode || '',
      nama_alergi: item.name || item.nama_dagang || '',
      kategori: 'medication'
    });
    setKfaResults([]);
    setKfaSearchTerm('');
  };

  const filteredData = alergi.filter(a => 
    a.nama_alergi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.kode_snomed.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </span>
            Master Data Alergi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Kelola master alergen pasien terstandar SNOMED CT dan Kamus Farmasi SATUSEHAT Kemenkes RI.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingData(null);
            setFormData({ kode_snomed: '', nama_alergi: '', kategori: 'food', status_aktif: true });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Alergi Baru
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama alergen atau kode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Alergen Terdaftar: <span className="font-bold text-slate-800">{alergi.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <th className="px-5 py-3.5">Kode SNOMED / KFA</th>
                <th className="px-5 py-3.5">Nama Alergen (Zat / Obat)</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                    Memuat data master alergi...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada data alergi yang cocok dengan kata kunci.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id_alergi} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                      {item.kode_snomed}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {item.nama_alergi}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg ${
                        item.kategori === 'food' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        item.kategori === 'medication' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                        item.kategori === 'environment' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {item.kategori.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        item.status_aktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status_aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEdit(item)} 
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Alergi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id_alergi, item.nama_alergi)} 
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Alergi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN POP-UP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-red-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingData ? 'Edit Master Alergi' : 'Tambah Master Alergi'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standarisasi SNOMED CT &amp; Kamus Farmasi Alkes SATUSEHAT
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Alergen
                </label>
                <select 
                  value={formData.kategori}
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition-all font-medium text-slate-800"
                >
                  <option value="food">Makanan (Food)</option>
                  <option value="medication">Obat-obatan (Medication) - Integrasi KFA</option>
                  <option value="environment">Lingkungan (Environment - Debu, Bulu, Cuaca)</option>
                  <option value="biologic">Biologis (Biologic - Serum, Bisa, Racun)</option>
                </select>
              </div>

              {/* KFA Integration Box when category is medication */}
              {formData.kategori === 'medication' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-xl border border-blue-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      Pencarian Cepat KFA SATUSEHAT
                    </label>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                      Kemenkes
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={kfaSearchTerm}
                      onChange={(e) => setKfaSearchTerm(e.target.value)}
                      placeholder="Ketik nama obat (misal: Amoxicillin)..."
                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchKFA())}
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchKFA}
                      disabled={isSearchingKfa}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      {isSearchingKfa ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Mencari...</span>
                        </>
                      ) : (
                        'Cari KFA'
                      )}
                    </button>
                  </div>
                  
                  {kfaResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-white border border-blue-200 rounded-xl shadow-xs divide-y divide-slate-100">
                      {kfaResults.map((res: any, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => selectKFA(res)}
                          className="p-2.5 hover:bg-blue-50/80 cursor-pointer text-xs transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{res.name || res.display}</div>
                            <div className="text-[11px] text-blue-600 font-mono mt-0.5">Kode KFA: {res.kfa_code || res.kfaCode}</div>
                          </div>
                          <span className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                            Pilih <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode SNOMED CT / KFA <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.kode_snomed}
                  onChange={(e) => setFormData({...formData, kode_snomed: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none font-mono text-slate-800 transition-all"
                  placeholder="Contoh: 372687004 atau 9300010"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Alergen (Zat / Alergen Fisik) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.nama_alergi}
                  onChange={(e) => setFormData({...formData, nama_alergi: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800 transition-all font-medium"
                  placeholder="Contoh: Amoxicillin, Udang, Debu Tungau"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input 
                    type="checkbox" 
                    id="status_aktif"
                    checked={formData.status_aktif}
                    onChange={(e) => setFormData({...formData, status_aktif: e.target.checked})}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Status Aktif</span>
                    <span className="text-[11px] text-slate-500">Tampilkan alergen ini dalam pencarian rekam medis klinisi</span>
                  </div>
                </label>
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingData ? 'Simpan Perubahan' : 'Simpan Master Alergi'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
