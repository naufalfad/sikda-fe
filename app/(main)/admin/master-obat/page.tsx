"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pill, Search, Plus, Edit2, Trash2, Loader2, X, Package, ExternalLink, Info, Check, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { masterService } from '@/services/master.service';
import { satusehatService } from '@/services/satusehat.service';
import Swal from 'sweetalert2';

export default function MasterObatPage() {
  const [obatList, setObatList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // KFA Search States
  const [isKfaModalOpen, setIsKfaModalOpen] = useState(false);
  const [kfaSearchQuery, setKfaSearchQuery] = useState('');
  const [kfaResults, setKfaResults] = useState<any[]>([]);
  const [isSearchingKfa, setIsSearchingKfa] = useState(false);
  const [kfaReferencePrice, setKfaReferencePrice] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    kodeObat: '',
    namaObat: '',
    kategori: 'Obat Bebas',
    sediaan: 'Tablet',
    harga: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchObat = async () => {
    setIsLoading(true);
    try {
      const res = await masterService.getObat(searchQuery);
      if (res.success) {
        setObatList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchObat();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleOpenModal = (obat?: any) => {
    if (obat) {
      setEditingId(obat.id);
      setFormData({
        kodeObat: obat.kodeObat,
        namaObat: obat.namaObat,
        kategori: obat.kategori,
        sediaan: obat.sediaan,
        harga: obat.harga,
      });
      setPreviewUrl(obat.gambarUrl || null);
    } else {
      setEditingId(null);
      setFormData({
        kodeObat: '',
        namaObat: '',
        kategori: 'Obat Bebas',
        sediaan: 'Tablet',
        harga: 0,
      });
      setPreviewUrl(null);
    }
    setKfaReferencePrice(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();
    payload.append('kodeObat', formData.kodeObat);
    payload.append('namaObat', formData.namaObat);
    payload.append('kategori', formData.kategori);
    payload.append('sediaan', formData.sediaan);
    payload.append('harga', formData.harga.toString());
    if (imageFile) {
      payload.append('gambar', imageFile);
    }

    try {
      if (editingId) {
        await masterService.updateObat(editingId, payload as any);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data obat diubah!', timer: 1500, showConfirmButton: false });
      } else {
        await masterService.createObat(payload as any);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Obat baru ditambahkan!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchObat();
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Gagal menyimpan data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchKFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kfaSearchQuery.trim()) return;
    setIsSearchingKfa(true);
    try {
      const res = await satusehatService.searchKFA(kfaSearchQuery);
      if (res.success && res.data.items?.data) {
        setKfaResults(res.data.items.data);
      } else if (res.success && res.data.items) {
        setKfaResults(res.data.items);
      } else if (res.success && Array.isArray(res.data)) {
        setKfaResults(res.data);
      } else {
        setKfaResults([]);
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err?.response?.data?.message || 'Gagal mencari obat di SATUSEHAT', 'error');
    } finally {
      setIsSearchingKfa(false);
    }
  };

  const handleSelectKFA = (item: any) => {
    // Extract price if available (fix_price or het_price from products/all)
    let refPrice = null;
    if (item.het_price) {
      refPrice = item.het_price;
    } else if (item.fix_price) {
      refPrice = item.fix_price;
    } else if (item.packaging_ids && item.packaging_ids.length > 0) {
      refPrice = item.packaging_ids[0].pack_price || null;
    }
    setKfaReferencePrice(refPrice);

    // Kategori & Sediaan
    let kategoriStr = formData.kategori;
    if (item.generik !== undefined) {
      kategoriStr = item.generik ? 'Obat Generik' : 'Obat Paten';
    } else if (item.farmalkes_type?.name) {
      kategoriStr = item.farmalkes_type.name;
    }

    let sediaanStr = formData.sediaan;
    if (item.dosage_form?.name) {
      sediaanStr = item.dosage_form.name;
    }

    setFormData({
      ...formData,
      kodeObat: item.kfa_code || item.kfaCode || '',
      namaObat: item.name || item.display || '',
      kategori: kategoriStr,
      sediaan: sediaanStr,
      harga: refPrice ? refPrice : formData.harga // pre-fill harga modal
    });
    setIsKfaModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Obat?',
      text: `Yakin ingin menghapus ${nama}? Data ini mungkin terkait dengan resep yang sudah ada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444'
    });

    if (confirm.isConfirmed) {
      try {
        await masterService.deleteObat(id);
        Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1000, showConfirmButton: false });
        fetchObat();
      } catch (err: any) {
        Swal.fire('Error', err?.response?.data?.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Pill className="w-8 h-8 text-blue-600" />
            Master Obat
          </h1>
          <p className="text-gray-500 mt-2">Kelola data master obat dan sediaan farmasi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari obat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-60"
            />
          </div>
          <Link
            href="/apoteker/stok"
            className="flex items-center px-4 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold rounded-xl hover:bg-teal-100 transition-colors shadow-xs whitespace-nowrap"
          >
            <Package className="w-4 h-4 mr-2 text-teal-600" />
            Kelola Stok Fisik
            <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-teal-500" />
          </Link>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Daftarkan Obat Baru
          </button>
          <button 
            onClick={() => setIsKfaModalOpen(true)}
            className="flex items-center px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-xl hover:bg-pink-700 transition-colors shadow-md whitespace-nowrap"
          >
            <Search className="w-4 h-4 mr-1.5" /> Tarik dari SATUSEHAT
          </button>
        </div>
      </div>

      {/* Info Alert: Penjelasan Master vs Stok Fisik */}
      <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-bold text-blue-950">
            Modul Master / Formularium Obat &amp; KFA SATUSEHAT (Bukan Pencatatan Stok Fisik)
          </p>
          <p className="text-blue-800 leading-relaxed">
            Halaman ini digunakan untuk mendaftarkan nama/katalog obat yang tampil di sistem resep dokter dan integrasi Kemenkes SATUSEHAT.
            Jika Anda ingin <strong>menambah stok fisik persediaan masuk</strong> (dropping Dinkes / PBF) lengkap dengan nomor batch dan tanggal kadaluwarsa (FEFO), silakan gunakan modul{' '}
            <Link href="/apoteker/stok" className="font-bold underline text-blue-900 hover:text-blue-950">
              Logistik Obat &amp; Vaksin Faskes
            </Link>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs font-semibold text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold w-16">Gambar</th>
                <th className="px-6 py-3.5 font-semibold">Obat &amp; Kategori</th>
                <th className="px-6 py-3.5 font-semibold">Sediaan</th>
                <th className="px-6 py-3.5 font-semibold">Harga Satuan (E-Katalog)</th>
                <th className="px-6 py-3.5 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  </td>
                </tr>
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data obat.
                  </td>
                </tr>
              ) : (
                obatList.map((obat) => (
                  <tr key={obat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-2xs">
                        <img 
                          src={obat.gambarUrl || (obat.kategori === 'BMHP' ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg')} 
                          alt={obat.namaObat} 
                          className="w-full h-full object-cover" 
                        />
                        {!obat.gambarUrl && (
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[8px] text-white text-center py-0.5 font-medium leading-none">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{obat.namaObat}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{obat.kodeObat}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 uppercase border border-blue-200 rounded-md">{obat.kategori}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">{obat.sediaan || '-'}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-slate-900 font-bold">Rp {obat.harga.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(obat)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors">
                          Edit
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

      {/* MODERN POP-UP MODAL TAMBAH / EDIT OBAT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-pink-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-600 text-white rounded-xl shadow-md">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingId ? 'Edit Master Obat / BMHP' : 'Tambah Obat / BMHP Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Katalog farmasi faskes terintegrasi E-Katalog &amp; SATUSEHAT
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
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Obat / KFA <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.kodeObat} 
                    onChange={e => setFormData({...formData, kodeObat: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all" 
                    placeholder="Misal: OBT-001 atau 9300010" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Obat / BMHP <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.namaObat} 
                    onChange={e => setFormData({...formData, namaObat: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all" 
                    placeholder="Misal: Paracetamol 500mg" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kategori</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.kategori} 
                    onChange={e => setFormData({...formData, kategori: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all" 
                    placeholder="Misal: Obat Generik, BMHP" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sediaan</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.sediaan} 
                    onChange={e => setFormData({...formData, sediaan: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all" 
                    placeholder="Misal: Tablet, Sirup, Ampul" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harga Jual Satuan (Rp) <span className="font-normal text-slate-400 capitalize">- Faskes</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input 
                    required 
                    type="number" 
                    value={formData.harga} 
                    onChange={e => setFormData({...formData, harga: parseInt(e.target.value) || 0})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all" 
                  />
                </div>
                {kfaReferencePrice !== null && (
                  <div className="mt-1.5 text-xs text-pink-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Harga Dasar E-Katalog SATUSEHAT: Rp {kfaReferencePrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Foto Kemasan Obat / BMHP
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }} 
                  className="w-full border border-slate-300 p-2 text-xs rounded-xl bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 cursor-pointer" 
                />
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img 
                      src={previewUrl || (formData.kategori === 'BMHP' ? '/images/logistik/bmhp.jpg' : '/images/logistik/obat.jpg')} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {previewUrl ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto terpasang &amp; siap diunggah
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Menggunakan gambar default sistem. Unggah kemasan fisik asli untuk memudahkan kasir/apoteker mengidentifikasi produk.
                      </span>
                    )}
                  </div>
                </div>
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
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingId ? 'Simpan Perubahan' : 'Simpan Obat Baru'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODERN POP-UP MODAL PENCARIAN KFA */}
      {isKfaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
            onClick={() => setIsKfaModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-pink-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-600 text-white rounded-xl shadow-md">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Cari Kamus Farmasi Alkes (KFA) SATUSEHAT
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tarik langsung spesifikasi resmi, sediaan, dan harga e-katalog Kemenkes
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsKfaModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={handleSearchKFA} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Ketik nama obat atau zat aktif (misal: Amoxicillin, Paracetamol)..." 
                    value={kfaSearchQuery}
                    onChange={(e) => setKfaSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all font-medium text-slate-800"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSearchingKfa}
                  className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  {isSearchingKfa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {isSearchingKfa ? 'Mencari...' : 'Cari di KFA'}
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-5 flex-1 bg-slate-50/30">
              {kfaResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {kfaResults.map((item, idx) => (
                    <div 
                      key={item.kfa_code || item.kfaCode || idx}
                      onClick={() => handleSelectKFA(item)}
                      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-pink-500 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-2.5 right-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        KFA Kemenkes
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-500 mb-1">{item.kfa_code || item.kfaCode}</div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-pink-600 transition-colors leading-snug mb-1.5 pr-14">
                          {item.name || item.display}
                        </h4>
                        {(item.manufacturer || item.kfa_poa?.name) && (
                          <div className="text-xs text-slate-500 line-clamp-1 mb-2">
                            Pabrik: <span className="font-medium text-slate-700">{item.manufacturer || item.kfa_poa?.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-pink-600">
                        <span>Pilih Obat Ini</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm">
                  {isSearchingKfa ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-3" />
                      <p className="font-medium text-slate-600">Menghubungkan ke basis data SATUSEHAT Kemenkes...</p>
                    </div>
                  ) : (
                    <div>
                      <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Pencarian Standar Farmasi SATUSEHAT</p>
                      <p className="text-xs text-slate-400 mt-1">Ketik kata kunci nama obat lalu tekan Cari untuk memilih dari katalog nasional.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
