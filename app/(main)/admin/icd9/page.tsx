"use client";

import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Trash2, 
  Edit3, 
  Package, 
  Cpu, 
  FlaskConical, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  icd9Service, 
  MasterICD9Item, 
  TemplateBmhpItem, 
  TemplateAlkesItem, 
  TemplatePenunjangItem 
} from '@/services/icd9.service';
import { masterService } from '@/services/master.service';
import { asetRuanganService } from '@/services/asetRuangan.service';
import Swal from 'sweetalert2';

export default function MasterICD9Page() {
  const [icdList, setIcdList] = useState<MasterICD9Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [isLoading, setIsLoading] = useState(true);

  // Master Data Auxiliary for Bundle Selectors
  const [availableObat, setAvailableObat] = useState<any[]>([]);
  const [availableAlkes, setAvailableAlkes] = useState<any[]>([]);
  const [availableLab, setAvailableLab] = useState<any[]>([]);
  const [availableModality, setAvailableModality] = useState<any[]>([]);
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'BMHP' | 'ALKES' | 'PENUNJANG'>('INFO');

  // Form State
  const [formData, setFormData] = useState<{
    kode_icd9: string;
    nama_prosedur: string;
    kategori: string;
    tarifTindakan: number;
    templateBmhp: TemplateBmhpItem[];
    templateAlkes: TemplateAlkesItem[];
    templatePenunjang: TemplatePenunjangItem[];
  }>({
    kode_icd9: '',
    nama_prosedur: '',
    kategori: 'Umum',
    tarifTindakan: 0,
    templateBmhp: [],
    templateAlkes: [],
    templatePenunjang: [],
  });

  // Auxiliary inputs for adding items into bundle
  const [addBmhpObatId, setAddBmhpObatId] = useState('');
  const [addBmhpQty, setAddBmhpQty] = useState<number>(1);

  const [addAlkesAsetId, setAddAlkesAsetId] = useState('');
  const [addAlkesTarif, setAddAlkesTarif] = useState<number>(0);

  const [addPenunjangJenis, setAddPenunjangJenis] = useState<'LAB' | 'RADIOLOGI'>('LAB');
  const [addPenunjangItemId, setAddPenunjangItemId] = useState('');
  const [addPenunjangCatatan, setAddPenunjangCatatan] = useState('');

  // Fetch ICD-9 data
  const fetchICD = async () => {
    setIsLoading(true);
    try {
      if (searchQuery.trim() === '') {
        const res = await icd9Service.getAll();
        if (res.status === 'success') {
          setIcdList(res.data);
        }
      } else {
        const res = await icd9Service.search(searchQuery);
        if (res.status === 'success') {
          setIcdList(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch auxiliary master data (Obat, Alkes, Lab, Modality)
  const fetchMasterDataAux = async () => {
    try {
      const [resObat, resAset, resLab, resModality] = await Promise.allSettled([
        masterService.getObat(),
        asetRuanganService.getAsets(),
        masterService.getLaboratorium(),
        masterService.getModality()
      ]);

      if (resObat.status === 'fulfilled' && resObat.value?.data) {
        setAvailableObat(resObat.value.data);
      }
      if (resAset.status === 'fulfilled' && Array.isArray(resAset.value)) {
        setAvailableAlkes(resAset.value);
      } else if (resAset.status === 'fulfilled' && (resAset.value as any)?.data) {
        setAvailableAlkes((resAset.value as any).data);
      }
      if (resLab.status === 'fulfilled' && resLab.value?.data) {
        setAvailableLab(resLab.value.data);
      }
      if (resModality.status === 'fulfilled' && resModality.value?.data) {
        setAvailableModality(resModality.value.data);
      }
      setIsMasterDataLoaded(true);
    } catch (err) {
      console.error('Gagal memuat data master pendukung paket:', err);
    }
  };

  useEffect(() => {
    fetchMasterDataAux();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchICD();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Open Modal Handler
  const handleOpenModal = (icd?: MasterICD9Item) => {
    if (icd) {
      setEditingId(icd.id_icd9);
      setFormData({
        kode_icd9: icd.kode_icd9,
        nama_prosedur: icd.nama_prosedur,
        kategori: icd.kategori || 'Umum',
        tarifTindakan: Number(icd.tarifTindakan) || 0,
        templateBmhp: Array.isArray(icd.templateBmhp) ? [...icd.templateBmhp] : [],
        templateAlkes: Array.isArray(icd.templateAlkes) ? [...icd.templateAlkes] : [],
        templatePenunjang: Array.isArray(icd.templatePenunjang) ? [...icd.templatePenunjang] : [],
      });
    } else {
      setEditingId(null);
      setFormData({
        kode_icd9: '',
        nama_prosedur: '',
        kategori: 'Umum',
        tarifTindakan: 0,
        templateBmhp: [],
        templateAlkes: [],
        templatePenunjang: [],
      });
    }
    setActiveTab('INFO');
    setAddBmhpObatId('');
    setAddBmhpQty(1);
    setAddAlkesAsetId('');
    setAddAlkesTarif(0);
    setAddPenunjangItemId('');
    setAddPenunjangCatatan('');
    setIsModalOpen(true);
  };

  // --- Handlers Tab BMHP ---
  const handleAddBmhpItem = () => {
    if (!addBmhpObatId) {
      Swal.fire('Perhatian', 'Silakan pilih item BMHP/Obat terlebih dahulu', 'info');
      return;
    }
    const selected = availableObat.find(o => o.id === addBmhpObatId);
    if (!selected) return;

    // Check if already in list
    const exists = formData.templateBmhp.some(b => b.obatId === selected.id);
    if (exists) {
      Swal.fire('Info', `${selected.namaObat} sudah ada di dalam paket BMHP tindakan ini.`, 'info');
      return;
    }

    const harga = Number(selected.harga) || 0;
    const newItem: TemplateBmhpItem = {
      obatId: selected.id,
      namaItem: selected.namaObat,
      sediaan: selected.sediaan || 'Pcs',
      jumlah: Number(addBmhpQty) > 0 ? Number(addBmhpQty) : 1,
      hargaSatuan: harga,
    };

    setFormData({
      ...formData,
      templateBmhp: [...formData.templateBmhp, newItem],
    });
    setAddBmhpObatId('');
    setAddBmhpQty(1);
  };

  const handleUpdateBmhpQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...formData.templateBmhp];
    updated[index].jumlah = newQty;
    setFormData({ ...formData, templateBmhp: updated });
  };

  const handleRemoveBmhpItem = (index: number) => {
    const updated = [...formData.templateBmhp];
    updated.splice(index, 1);
    setFormData({ ...formData, templateBmhp: updated });
  };

  // --- Handlers Tab Alkes ---
  const handleSelectAlkes = (asetId: string) => {
    setAddAlkesAsetId(asetId);
    const selected = availableAlkes.find(a => a.id === asetId);
    if (selected) {
      setAddAlkesTarif(Number(selected.tarifPemakaian) || 0);
    }
  };

  const handleAddAlkesItem = () => {
    if (!addAlkesAsetId) {
      Swal.fire('Perhatian', 'Silakan pilih alat kesehatan terlebih dahulu', 'info');
      return;
    }
    const selected = availableAlkes.find(a => a.id === addAlkesAsetId);
    if (!selected) return;

    const exists = formData.templateAlkes.some(a => a.asetId === selected.id);
    if (exists) {
      Swal.fire('Info', `${selected.namaAset} sudah ada di dalam paket Alkes tindakan ini.`, 'info');
      return;
    }

    const newItem: TemplateAlkesItem = {
      asetId: selected.id,
      namaAset: selected.namaAset,
      kodeAset: selected.kodeAset || '',
      tarifPemakaian: Number(addAlkesTarif) >= 0 ? Number(addAlkesTarif) : 0,
    };

    setFormData({
      ...formData,
      templateAlkes: [...formData.templateAlkes, newItem],
    });
    setAddAlkesAsetId('');
    setAddAlkesTarif(0);
  };

  const handleRemoveAlkesItem = (index: number) => {
    const updated = [...formData.templateAlkes];
    updated.splice(index, 1);
    setFormData({ ...formData, templateAlkes: updated });
  };

  // --- Handlers Tab Penunjang ---
  const handleAddPenunjangItem = () => {
    if (!addPenunjangItemId) {
      Swal.fire('Perhatian', 'Silakan pilih nama pemeriksaan penunjang terlebih dahulu', 'info');
      return;
    }

    let nama = '';
    let kode = '';

    if (addPenunjangJenis === 'LAB') {
      const selected = availableLab.find(l => l.id === addPenunjangItemId);
      if (selected) {
        nama = selected.parameter || selected.nama || 'Pemeriksaan Lab';
        kode = selected.kodePanelLab || '';
      }
    } else {
      const selected = availableModality.find(m => m.id === addPenunjangItemId);
      if (selected) {
        nama = selected.namaModality || selected.nama || 'Pemeriksaan Radiologi';
        kode = selected.kodeDicom || '';
      }
    }

    const newItem: TemplatePenunjangItem = {
      jenis: addPenunjangJenis,
      id: addPenunjangItemId,
      nama,
      kode,
      catatan: addPenunjangCatatan.trim(),
    };

    setFormData({
      ...formData,
      templatePenunjang: [...formData.templatePenunjang, newItem],
    });
    setAddPenunjangItemId('');
    setAddPenunjangCatatan('');
  };

  const handleRemovePenunjangItem = (index: number) => {
    const updated = [...formData.templatePenunjang];
    updated.splice(index, 1);
    setFormData({ ...formData, templatePenunjang: updated });
  };

  // Save ICD-9 Data & Bundles
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_icd9.trim() || !formData.nama_prosedur.trim()) {
      Swal.fire('Perhatian', 'Kode ICD-9 dan Nama Prosedur wajib diisi!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kode_icd9: formData.kode_icd9.trim(),
        nama_prosedur: formData.nama_prosedur.trim(),
        kategori: formData.kategori,
        tarifTindakan: Number(formData.tarifTindakan) || 0,
        templateBmhp: formData.templateBmhp,
        templateAlkes: formData.templateAlkes,
        templatePenunjang: formData.templatePenunjang,
      };

      if (editingId) {
        await icd9Service.updateICD9(editingId, payload);
        Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil Disimpan', 
          text: `Data ICD-9 ${payload.kode_icd9} dan paket terintegrasi berhasil diperbarui!`, 
          timer: 1800, 
          showConfirmButton: false 
        });
      } else {
        await icd9Service.createICD9(payload);
        Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil Ditambahkan', 
          text: `Data ICD-9 ${payload.kode_icd9} baru beserta paket berhasil didaftarkan!`, 
          timer: 1800, 
          showConfirmButton: false 
        });
      }
      setIsModalOpen(false);
      fetchICD();
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', err?.response?.data?.message || 'Terjadi kesalahan sistem saat menyimpan data ICD-9', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete ICD-9
  const handleDelete = async (id: string, kode: string, nama: string) => {
    const confirm = await Swal.fire({
      title: `Hapus Prosedur ${kode}?`,
      text: `Apakah Anda yakin ingin menghapus "${nama}"? Data riwayat pasien yang sudah tersimpan tidak akan terhapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (confirm.isConfirmed) {
      try {
        await icd9Service.deleteICD9(id);
        Swal.fire({ icon: 'success', title: 'Terhapus', text: `ICD-9 ${kode} telah dihapus.`, timer: 1200, showConfirmButton: false });
        fetchICD();
      } catch (err: any) {
        Swal.fire('Gagal Menghapus', err?.response?.data?.message || 'Data tidak dapat dihapus', 'error');
      }
    }
  };

  // Filter Categories
  const categoryOptions = [
    'SEMUA',
    'Umum',
    'Bedah Minor',
    'Tindakan Keperawatan',
    'Tindakan Respirasi',
    'Kesehatan Gigi',
    'Kebidanan & KIA',
    'Pemeriksaan Penunjang',
    'Laboratorium',
    'Radiologi',
  ];

  const filteredIcdList = icdList.filter(item => {
    if (selectedCategory !== 'SEMUA') {
      const kat = (item.kategori || '').toLowerCase();
      if (!kat.includes(selectedCategory.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate live totals for the modal footer
  const totalBmhpEst = formData.templateBmhp.reduce((sum, b) => sum + (Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1), 0);
  const totalAlkesEst = formData.templateAlkes.reduce((sum, a) => sum + (Number(a.tarifPemakaian) || 0), 0);
  const totalTindakanEst = (Number(formData.tarifTindakan) || 0) + totalBmhpEst + totalAlkesEst;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700">
              <Stethoscope className="w-7 h-7" />
            </div>
            Master ICD-9 & Paket Prosedur
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 max-w-2xl">
            Kelola kodifikasi ICD-9-CM, tarif tindakan klinis, serta <strong>paket otomatis BMHP farmasi terpakai, alat kesehatan (alkes), dan rekomendasi penunjang</strong> saat dokter melakukan pemeriksaan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Prosedur ICD-9
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-gray-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari kode ICD-9 atau nama prosedur klinis (misal: 86.59, Jahit Luka, Nebulisasi, EKG)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-teal-600 focus:border-teal-600 w-full outline-none"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{filteredIcdList.length}</span> prosedur
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-gray-400 font-semibold uppercase text-[10px] mr-1">Kategori:</span>
          {categoryOptions.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === cat 
                  ? 'bg-teal-600 text-white border-teal-600' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left text-gray-600">
          <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-700 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3.5 w-36">Kode & Kategori</th>
              <th className="px-4 py-3.5">Nama Prosedur / Tindakan</th>
              <th className="px-4 py-3.5 w-28 text-right">Tarif Jasa</th>
              <th className="px-4 py-3.5 w-60">Paket Klinis Terintegrasi</th>
              <th className="px-4 py-3.5 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
                    <span className="text-xs font-medium">Memuat master ICD-9...</span>
                  </div>
                </td>
              </tr>
            ) : filteredIcdList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                  <p className="text-sm font-semibold text-gray-700">Tidak ada data prosedur yang cocok.</p>
                  <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau tambahkan prosedur baru dengan tombol di atas.</p>
                </td>
              </tr>
            ) : (
              filteredIcdList.map((icd) => {
                const bmhpCount = Array.isArray(icd.templateBmhp) ? icd.templateBmhp.length : 0;
                const alkesCount = Array.isArray(icd.templateAlkes) ? icd.templateAlkes.length : 0;
                const penunjangCount = Array.isArray(icd.templatePenunjang) ? icd.templatePenunjang.length : 0;
                const hasAnyPackage = bmhpCount > 0 || alkesCount > 0 || penunjangCount > 0;

                return (
                  <tr key={icd.id_icd9} className="hover:bg-teal-50/20 transition-colors">
                    {/* 1. KODE & KATEGORI */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono font-extrabold text-teal-900 text-sm">
                        {icd.kode_icd9}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-tight">
                        {icd.kategori || 'Umum'}
                      </span>
                    </td>

                    {/* 2. NAMA PROSEDUR */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                        {icd.nama_prosedur}
                      </div>
                    </td>

                    {/* 3. TARIF JASA */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="font-mono font-bold text-gray-900">
                        {Number(icd.tarifTindakan) > 0 
                          ? `Rp ${Number(icd.tarifTindakan).toLocaleString('id-ID')}` 
                          : <span className="text-gray-400 font-normal">Rp 0</span>}
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Jasa Tindakan</span>
                    </td>

                    {/* 4. INTEGRASI PAKET (BMHP / ALKES / PENUNJANG) */}
                    <td className="px-4 py-3.5 align-top">
                      {hasAnyPackage ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {bmhpCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title={(icd.templateBmhp || []).map(b => `${b.namaItem} (${b.jumlah} ${b.sediaan || 'Pcs'})`).join(', ')}
                            >
                              <Package className="w-3 h-3 text-amber-600 shrink-0" />
                              {bmhpCount} BMHP
                            </span>
                          )}
                          {alkesCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                              title={(icd.templateAlkes || []).map(a => a.namaAset).join(', ')}
                            >
                              <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
                              {alkesCount} Alkes
                            </span>
                          )}
                          {penunjangCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200"
                              title={(icd.templatePenunjang || []).map(p => `[${p.jenis}] ${p.nama}`).join(', ')}
                            >
                              <FlaskConical className="w-3 h-3 text-purple-600 shrink-0" />
                              {penunjangCount} Penunjang
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">- Belum ada paket -</span>
                      )}
                    </td>

                    {/* 5. AKSI (EDIT & HAPUS) */}
                    <td className="px-4 py-3.5 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => handleOpenModal(icd)}
                          title="Edit Prosedur & Paket Template"
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(icd.id_icd9, icd.kode_icd9, icd.nama_prosedur)}
                          title="Hapus Prosedur ICD-9"
                          className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH / EDIT ICD-9 & BUNDLE BUILDER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingId ? `Edit Prosedur ICD-9: ${formData.kode_icd9}` : 'Tambah Master ICD-9 & Konfigurasi Paket'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Integrasikan tindakan dengan tarif klinik, paket BMHP farmasi terpakai, alkes, dan penunjang diagnostik.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="flex border-b border-gray-200 bg-white px-6 gap-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('INFO')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'INFO'
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                1. Info Prosedur & Tarif
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BMHP')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'BMHP'
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Package className="w-4 h-4 text-amber-600" />
                2. Paket BMHP & Obat
                {formData.templateBmhp.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full">
                    {formData.templateBmhp.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALKES')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'ALKES'
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Cpu className="w-4 h-4 text-blue-600" />
                3. Alat Kesehatan (Alkes)
                {formData.templateAlkes.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full">
                    {formData.templateAlkes.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PENUNJANG')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'PENUNJANG'
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-purple-600" />
                4. Rekomendasi Penunjang
                {formData.templatePenunjang.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] rounded-full">
                    {formData.templatePenunjang.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-gray-700">
              
              {/* TAB 1: INFORMASI PROSEDUR & TARIF */}
              {activeTab === 'INFO' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Kode ICD-9-CM <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={formData.kode_icd9} 
                        onChange={e => setFormData({ ...formData, kode_icd9: e.target.value })} 
                        className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-teal-600 font-mono" 
                        placeholder="Misal: 86.59" 
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Standar WHO / ICD-9-CM</span>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nama Prosedur / Tindakan Medis <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={formData.nama_prosedur} 
                        onChange={e => setFormData({ ...formData, nama_prosedur: e.target.value })} 
                        className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-teal-600" 
                        placeholder="Misal: Penjahitan Luka Terbuka (Hecting)" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Pelayanan</label>
                      <select 
                        required 
                        value={formData.kategori} 
                        onChange={e => setFormData({ ...formData, kategori: e.target.value })} 
                        className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-teal-600 bg-white"
                      >
                        <option value="Umum">Umum / Poliklinik</option>
                        <option value="Bedah Minor">Bedah Minor</option>
                        <option value="Tindakan Keperawatan">Tindakan Keperawatan</option>
                        <option value="Tindakan Respirasi">Tindakan Respirasi</option>
                        <option value="Kesehatan Gigi">Kesehatan Gigi & Mulut</option>
                        <option value="Kebidanan & KIA">Kebidanan & KIA</option>
                        <option value="Pemeriksaan Penunjang">Pemeriksaan Penunjang</option>
                        <option value="Laboratorium">Laboratorium</option>
                        <option value="Radiologi">Radiologi</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tarif Tindakan / Jasa Klinik (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">Rp</span>
                        <input 
                          type="number" 
                          min={0}
                          value={formData.tarifTindakan} 
                          onChange={e => setFormData({ ...formData, tarifTindakan: parseFloat(e.target.value) || 0 })} 
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 text-sm font-mono outline-none focus:border-teal-600" 
                          placeholder="0" 
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">Biaya jasa tindakan dokter / klinik (belum termasuk BMHP & Alkes)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50/70 border border-teal-200 mt-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-teal-900 text-xs">Integrasi Otomatis dengan Pemeriksaan Klinis</h4>
                        <p className="text-[11px] text-teal-800 leading-relaxed mt-0.5">
                          Setelah Anda menyimpan data prosedur ini, dokter yang memilih kode <strong>{formData.kode_icd9 || '[Kode]'}</strong> pada saat penginputan SOAP / Rawat Jalan / UGD akan secara otomatis memuat paket BMHP, Alkes, dan rekomendasi penunjang yang sudah Anda konfigurasi di tab berikutnya.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PAKET BMHP & OBAT TERPAKAI */}
              {activeTab === 'BMHP' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Pemotongan Otomatis Stok Farmasi:</strong> Item BMHP dan obat yang Anda tambahkan di bawah ini akan otomatis disiapkan di lembar tindakan dokter, dan stok logistik farmasi faskes akan otomatis terpotong saat tindakan dikonfirmasi atau dibayar di kasir.
                    </div>
                  </div>

                  {/* Form Tambah Item BMHP */}
                  <div className="p-3.5 bg-gray-50 border border-gray-200 space-y-2.5">
                    <span className="font-bold text-gray-700 text-xs block">
                      + Tambah Item BMHP / Obat ke Paket:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-8">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Pilih BMHP / Obat dari Inventori:
                        </label>
                        <select
                          value={addBmhpObatId}
                          onChange={(e) => setAddBmhpObatId(e.target.value)}
                          className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-amber-600 bg-white"
                        >
                          <option value="">-- Pilih Obat / BMHP --</option>
                          {availableObat.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.namaObat} ({o.sediaan || 'Pcs'}) - Rp {Number(o.harga || 0).toLocaleString('id-ID')} [{o.kategori || 'BMHP'}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Jumlah Standar:
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={addBmhpQty}
                          onChange={(e) => setAddBmhpQty(parseInt(e.target.value) || 1)}
                          className="w-full border border-gray-300 p-2 text-xs font-mono outline-none focus:border-amber-600 text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddBmhpItem}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Masukkan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Daftar BMHP Paket */}
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-[11px] font-bold text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5">Nama BMHP / Obat</th>
                          <th className="px-4 py-2.5 w-24">Sediaan</th>
                          <th className="px-4 py-2.5 w-28 text-center">Jumlah (Qty)</th>
                          <th className="px-4 py-2.5 w-28 text-right">Harga Satuan</th>
                          <th className="px-4 py-2.5 w-28 text-right">Subtotal</th>
                          <th className="px-4 py-2.5 w-16 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.templateBmhp.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                              Belum ada BMHP yang dimasukkan ke dalam paket tindakan ini.
                            </td>
                          </tr>
                        ) : (
                          formData.templateBmhp.map((item, idx) => {
                            const subTotal = (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 1);
                            return (
                              <tr key={idx} className="hover:bg-amber-50/20">
                                <td className="px-4 py-2.5 font-bold text-gray-900">
                                  {item.namaItem}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">
                                  {item.sediaan || 'Pcs'}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <div className="inline-flex items-center gap-1 border border-gray-300 px-1 py-0.5 bg-white">
                                    <button 
                                      type="button" 
                                      onClick={() => handleUpdateBmhpQty(idx, item.jumlah - 1)}
                                      className="px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-mono font-bold">{item.jumlah}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => handleUpdateBmhpQty(idx, item.jumlah + 1)}
                                      className="px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono">
                                  Rp {Number(item.hargaSatuan || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                                  Rp {subTotal.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBmhpItem(idx)}
                                    className="p-1 text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {formData.templateBmhp.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-900">
                          <tr>
                            <td colSpan={4} className="px-4 py-2.5 text-right">
                              Total Estimasi BMHP Paket:
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                              Rp {totalBmhpEst.toLocaleString('id-ID')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ALAT KESEHATAN (ALKES) */}
              {activeTab === 'ALKES' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                    <Cpu className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Pemakaian Alkes & Instrumen Medis:</strong> Alat kesehatan atau instrumen yang Anda daftarkan di sini akan langsung terhubung ke tindakan klinis, dan tarif pemakaiannya akan otomatis masuk ke dalam rincian tagihan kasir.
                    </div>
                  </div>

                  {/* Form Tambah Item Alkes */}
                  <div className="p-3.5 bg-gray-50 border border-gray-200 space-y-2.5">
                    <span className="font-bold text-gray-700 text-xs block">
                      + Tambah Alat Kesehatan ke Paket:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-7">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Pilih Alkes dari Master Aset Ruangan:
                        </label>
                        <select
                          value={addAlkesAsetId}
                          onChange={(e) => handleSelectAlkes(e.target.value)}
                          className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-blue-600 bg-white"
                        >
                          <option value="">-- Pilih Alat Kesehatan --</option>
                          {availableAlkes.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.namaAset} ({a.kodeAset || 'No Kode'}) - Tarif: Rp {Number(a.tarifPemakaian || 0).toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Tarif Pemakaian (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={addAlkesTarif}
                          onChange={(e) => setAddAlkesTarif(parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 p-2 text-xs font-mono outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddAlkesItem}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Masukkan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Daftar Alkes */}
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-[11px] font-bold text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5">Nama Alat Kesehatan / Aset</th>
                          <th className="px-4 py-2.5 w-40">Kode Aset</th>
                          <th className="px-4 py-2.5 w-36 text-right">Tarif Pemakaian</th>
                          <th className="px-4 py-2.5 w-16 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.templateAlkes.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                              Belum ada alat kesehatan yang dimasukkan ke dalam paket tindakan ini.
                            </td>
                          </tr>
                        ) : (
                          formData.templateAlkes.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/20">
                              <td className="px-4 py-2.5 font-bold text-gray-900">
                                {item.namaAset}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-gray-600">
                                {item.kodeAset || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-900">
                                Rp {Number(item.tarifPemakaian || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAlkesItem(idx)}
                                  className="p-1 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {formData.templateAlkes.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-900">
                          <tr>
                            <td colSpan={2} className="px-4 py-2.5 text-right">
                              Total Tarif Pemakaian Alkes:
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-blue-700">
                              Rp {totalAlkesEst.toLocaleString('id-ID')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: REKOMENDASI PENUNJANG (LAB & RADIOLOGI) */}
              {activeTab === 'PENUNJANG' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
                    <FlaskConical className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Integrasi Rekomendasi Diagnostik:</strong> Hubungkan tindakan ini dengan pemeriksaan laboratorium atau radiologi yang wajib atau direkomendasikan saat tindakan ini dipilih (misal: Rontgen pada reposisi fraktur, Lab GDS pada operasi kecil).
                    </div>
                  </div>

                  {/* Form Tambah Penunjang */}
                  <div className="p-3.5 bg-gray-50 border border-gray-200 space-y-2.5">
                    <span className="font-bold text-gray-700 text-xs block">
                      + Hubungkan Pemeriksaan Penunjang:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Jenis Pemeriksaan:
                        </label>
                        <select
                          value={addPenunjangJenis}
                          onChange={(e) => {
                            setAddPenunjangJenis(e.target.value as 'LAB' | 'RADIOLOGI');
                            setAddPenunjangItemId('');
                          }}
                          className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-purple-600 bg-white"
                        >
                          <option value="LAB">Laboratorium</option>
                          <option value="RADIOLOGI">Radiologi</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Pilih Parameter {addPenunjangJenis === 'LAB' ? 'Laboratorium' : 'Radiologi'}:
                        </label>
                        <select
                          value={addPenunjangItemId}
                          onChange={(e) => setAddPenunjangItemId(e.target.value)}
                          className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-purple-600 bg-white"
                        >
                          <option value="">-- Pilih Pemeriksaan --</option>
                          {addPenunjangJenis === 'LAB' ? (
                            availableLab.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.parameter} [{l.kategori || 'Lab'}] - Rp {Number(l.hargaTarif || 0).toLocaleString('id-ID')}
                              </option>
                            ))
                          ) : (
                            availableModality.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.namaModality} ({m.kodeDicom || 'RAD'})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Catatan / Indikasi Klinis (Opsional):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={addPenunjangCatatan}
                            onChange={(e) => setAddPenunjangCatatan(e.target.value)}
                            placeholder="Contoh: Evaluasi pra-tindakan"
                            className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-purple-600"
                          />
                          <button
                            type="button"
                            onClick={handleAddPenunjangItem}
                            className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Daftar Penunjang */}
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-[11px] font-bold text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 w-28">Jenis</th>
                          <th className="px-4 py-2.5">Nama Pemeriksaan</th>
                          <th className="px-4 py-2.5">Catatan / Indikasi Default</th>
                          <th className="px-4 py-2.5 w-16 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.templatePenunjang.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                              Belum ada rekomendasi pemeriksaan penunjang yang dihubungkan.
                            </td>
                          </tr>
                        ) : (
                          formData.templatePenunjang.map((item, idx) => (
                            <tr key={idx} className="hover:bg-purple-50/20">
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  item.jenis === 'LAB' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {item.jenis}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-bold text-gray-900">
                                {item.nama}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {item.catatan || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePenunjangItem(idx)}
                                  className="p-1 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LIVE SUMMARY BANNER */}
              <div className="pt-2">
                <div className="p-3 bg-gray-100 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-gray-500">
                      Jasa Tindakan: <strong className="text-gray-900 font-mono">Rp {(Number(formData.tarifTindakan) || 0).toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">
                      Total BMHP ({formData.templateBmhp.length} item): <strong className="text-amber-800 font-mono">Rp {totalBmhpEst.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">
                      Tarif Alkes ({formData.templateAlkes.length} alat): <strong className="text-blue-800 font-mono">Rp {totalAlkesEst.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 font-semibold mr-2">Estimasi Total Paket:</span>
                    <span className="text-sm font-extrabold text-teal-700 font-mono">
                      Rp {totalTindakanEst.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 font-bold text-xs transition-colors disabled:bg-teal-300 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Prosedur & Paket Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
