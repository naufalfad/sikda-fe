"use client";

import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari obat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-none hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Obat
          </button>
          <button 
            onClick={() => setIsKfaModalOpen(true)}
            className="flex items-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-none hover:bg-pink-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Search className="w-4 h-4 mr-2" /> Tarik dari SATUSEHAT
          </button>
        </div>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-sm font-medium text-gray-600 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Gambar</th>
                <th className="px-6 py-4 font-semibold">Obat & Kategori</th>
                <th className="px-6 py-4 font-semibold">Sediaan</th>
                <th className="px-6 py-4 font-semibold">Stok di Faskes</th>
                <th className="px-6 py-4 font-semibold">Harga</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  </td>
                </tr>
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data obat.
                  </td>
                </tr>
              ) : (
                obatList.map((obat) => (
                  <tr key={obat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-none bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                        {obat.gambarUrl ? (
                          <img src={obat.gambarUrl} alt={obat.namaObat} className="w-full h-full object-cover" />
                        ) : (
                          <Pill className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{obat.namaObat}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{obat.kodeObat}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 uppercase border border-blue-200">{obat.kategori}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{obat.sediaan || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 font-mono">{obat.stok ?? 0} {obat.sediaan || 'Unit'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-gray-900 font-medium">Rp {obat.harga.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(obat)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-none transition-colors">
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

      {/* MODAL TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-none shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Obat' : 'Tambah Obat Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kode Obat</label>
                <input required type="text" value={formData.kodeObat} onChange={e => setFormData({...formData, kodeObat: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none" placeholder="Misal: OBT-001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Obat</label>
                <input required type="text" value={formData.namaObat} onChange={e => setFormData({...formData, namaObat: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none" placeholder="Misal: Paracetamol 500mg" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <input required type="text" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none bg-white" placeholder="Misal: Obat Bebas" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sediaan</label>
                  <input required type="text" value={formData.sediaan} onChange={e => setFormData({...formData, sediaan: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none bg-white" placeholder="Misal: Tablet" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Harga (Rp) <span className="font-normal text-gray-500">- Input Manual</span></label>
                <input required type="number" value={formData.harga} onChange={e => setFormData({...formData, harga: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none" />
                {kfaReferencePrice !== null && (
                  <div className="mt-1 text-[10px] text-pink-600 font-medium">
                    Harga Dasar E-Katalog: Rp {kfaReferencePrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gambar Obat</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }} 
                  className="w-full border border-gray-300 p-2 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none bg-white file:mr-4 file:py-1 file:px-3 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer" 
                />
                {previewUrl && (
                  <div className="mt-3 w-24 h-24 border border-gray-200 bg-gray-50 flex items-center justify-center p-1">
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-none font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-none font-bold text-sm transition-colors flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL PENCARIAN KFA */}
      {isKfaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsKfaModalOpen(false)}></div>
          <div className="relative bg-white rounded-none shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-pink-50">
              <h3 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-pink-600" />
                Cari Kamus Farmasi SATUSEHAT
              </h3>
              <button onClick={() => setIsKfaModalOpen(false)} className="text-pink-400 hover:text-pink-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearchKFA} className="flex gap-2">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ketik nama obat (misal: Amoxicillin)..." 
                  value={kfaSearchQuery}
                  onChange={(e) => setKfaSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500 rounded-none"
                />
                <button 
                  type="submit" 
                  disabled={isSearchingKfa}
                  className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-6 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isSearchingKfa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Cari
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-4 flex-1 bg-gray-50/50">
              {kfaResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kfaResults.map((item, idx) => (
                    <div 
                      key={item.kfa_code || item.kfaCode || idx}
                      onClick={() => handleSelectKFA(item)}
                      className="bg-white border border-gray-200 p-4 cursor-pointer hover:border-pink-300 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                        KFA
                      </div>
                      <div className="text-xs font-mono text-gray-500 mb-1">{item.kfa_code || item.kfaCode}</div>
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-pink-700 leading-tight mb-2">
                        {item.name || item.display}
                      </h4>
                      {(item.manufacturer || item.kfa_poa?.name) && (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          Pabrik: {item.manufacturer || item.kfa_poa?.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  {isSearchingKfa ? 'Mencari ke Kemenkes...' : 'Ketik kata kunci dan tekan cari untuk menarik data dari KFA Kemenkes.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
