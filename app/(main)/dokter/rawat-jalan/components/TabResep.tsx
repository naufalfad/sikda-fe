"use client";

import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { 
  Pill, 
  Syringe, 
  Search, 
  Loader2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Check, 
  X,
  Layers,
  ShieldCheck,
  Package,
  Info
} from 'lucide-react';
import { masterService } from '@/services/master.service';
import Swal from 'sweetalert2';

interface BatchInfo {
  id: string;
  noBatch: string;
  stok: number;
  stokMinimum: number;
  tanggalExpired: string | null;
  sisaHariExpired: number | null;
  statusExpired: 'KADALUWARSA' | 'SEGERA_KADALUWARSA' | 'WASPADA' | 'AMAN';
  isPrioritasFefo: boolean;
}

interface MedicineItem {
  id: string;
  kodeObat?: string;
  kodeKfa?: string;
  namaObat: string;
  kategori: string;
  sediaan: string;
  harga?: number;
  totalStok: number;
  prioritasFefoBatch?: BatchInfo | null;
  stokFaskes?: BatchInfo[];
  batchVaksin?: BatchInfo[];
  isVaksin?: boolean;
}

interface PrescribedItem {
  obatId: string;
  namaObat: string;
  kategori: string;
  sediaan: string;
  qty: number;
  signa: string;
  catatan?: string;
  noBatch?: string | null;
  batchDetail?: BatchInfo | null;
  isVaksin?: boolean;
}

interface TabResepProps {
  obatQuery: string;
  setObatQuery: Dispatch<SetStateAction<string>>;
  selectedObat: PrescribedItem[];
  setSelectedObat: Dispatch<SetStateAction<PrescribedItem[]>>;
  kunjunganId?: string;
  faskesId?: string;
  onSaveResep?: () => Promise<void>;
  isSaving?: boolean;
}

const SIGNA_PRESETS = [
  '3 x 1 Tablet sesudah makan',
  '2 x 1 Tablet sesudah makan',
  '1 x 1 Tablet pagi hari',
  '1 x 1 Tablet malam hari (sebelum tidur)',
  '3 x 1 Cth (5ml) sesudah makan',
  '1 x 1 Bungkus dilarutkan air',
  'Bila demam / nyeri (prn)',
  'Oleskan tipis 2x sehari (pagi-malam)',
  '1 Dosis Injeksi IM / SC (Imunisasi)'
];

export default function TabResep({
  obatQuery,
  setObatQuery,
  selectedObat,
  setSelectedObat,
  kunjunganId,
  faskesId,
  onSaveResep,
  isSaving = false
}: TabResepProps) {
  // Mode Tab: 'SEMUA' | 'OBAT' | 'BMHP' | 'VAKSIN'
  const [filterKategori, setFilterKategori] = useState<'SEMUA' | 'OBAT' | 'BMHP' | 'VAKSIN'>('SEMUA');
  
  // Data states
  const [obatList, setObatList] = useState<MedicineItem[]>([]);
  const [vaksinList, setVaksinList] = useState<MedicineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Active Selected Item for Configuration Form
  const [selectedForConfig, setSelectedForConfig] = useState<MedicineItem | null>(null);
  const [chosenBatch, setChosenBatch] = useState<BatchInfo | null>(null);
  const [inputQty, setInputQty] = useState<number>(1);
  const [inputSigna, setInputSigna] = useState<string>('3 x 1 Tablet sesudah makan');
  const [inputCatatan, setInputCatatan] = useState<string>('');

  // Fetch Master Obat & Master Vaksin
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const [resObat, resVaksin] = await Promise.allSettled([
          masterService.getObat('', faskesId),
          masterService.getVaksin(faskesId)
        ]);

        if (isMounted) {
          if (resObat.status === 'fulfilled' && resObat.value?.data) {
            setObatList(resObat.value.data);
          }
          if (resVaksin.status === 'fulfilled' && resVaksin.value?.data) {
            const mappedVaksin = (resVaksin.value.data || []).map((v: any) => ({
              ...v,
              namaObat: v.namaVaksin,
              kategori: 'Vaksin Cold-Chain',
              sediaan: 'Vial',
              isVaksin: true,
              stokFaskes: v.batchVaksin || []
            }));
            setVaksinList(mappedVaksin);
          }
        }
      } catch (err) {
        console.error('Gagal memuat katalog obat/vaksin:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [faskesId]);

  // Unified Catalog
  const fullCatalog = useMemo(() => {
    return [...obatList, ...vaksinList];
  }, [obatList, vaksinList]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return fullCatalog.filter((item) => {
      // 1. Kategori filter
      if (filterKategori === 'OBAT') {
        if (item.isVaksin || item.kategori === 'BMHP') return false;
      } else if (filterKategori === 'BMHP') {
        if (item.kategori !== 'BMHP') return false;
      } else if (filterKategori === 'VAKSIN') {
        if (!item.isVaksin) return false;
      }

      // 2. Query search
      if (!obatQuery.trim()) return true;
      const q = obatQuery.toLowerCase();
      const namaMatch = item.namaObat?.toLowerCase().includes(q);
      const kodeMatch = (item.kodeObat || item.kodeKfa || '')?.toLowerCase().includes(q);
      const katMatch = item.kategori?.toLowerCase().includes(q);
      const batchMatch = (item.stokFaskes || []).some(b => b.noBatch?.toLowerCase().includes(q));

      return namaMatch || kodeMatch || katMatch || batchMatch;
    });
  }, [fullCatalog, filterKategori, obatQuery]);

  // Handle select medicine to configure
  const handleSelectMedicine = (item: MedicineItem) => {
    setSelectedForConfig(item);
    
    // Auto-select FEFO Priority batch by default
    const batches = item.stokFaskes || [];
    const fefoBatch = batches.find(b => b.isPrioritasFefo && b.stok > 0) || 
                     batches.find(b => b.stok > 0 && b.statusExpired !== 'KADALUWARSA') || 
                     batches[0] || null;

    setChosenBatch(fefoBatch);
    setInputQty(1);
    
    if (item.isVaksin) {
      setInputSigna('1 Dosis Injeksi IM / SC (Imunisasi)');
    } else if (item.kategori === 'BMHP') {
      setInputSigna('Gunakan untuk tindakan klinis / ganti balut');
    } else if (item.sediaan?.toLowerCase().includes('sirup')) {
      setInputSigna('3 x 1 Cth (5ml) sesudah makan');
    } else if (item.sediaan?.toLowerCase().includes('salep') || item.sediaan?.toLowerCase().includes('krim')) {
      setInputSigna('Oleskan tipis 2x sehari (pagi-malam)');
    } else {
      setInputSigna('3 x 1 Tablet sesudah makan');
    }

    setInputCatatan('');
  };

  // Add configured item to prescription table
  const handleAddPrescription = () => {
    if (!selectedForConfig) return;

    if (!inputQty || inputQty <= 0) {
      Swal.fire({ icon: 'warning', title: 'Jumlah Tidak Valid', text: 'Jumlah obat minimal 1.' });
      return;
    }

    // Check batch stock
    if (chosenBatch && chosenBatch.stok < inputQty) {
      Swal.fire({
        icon: 'warning',
        title: 'Stok Batch Kurang',
        text: `Stok pada batch ${chosenBatch.noBatch} hanya tersisa ${chosenBatch.stok} unit. Kurangi jumlah atau pilih batch lain.`
      });
      return;
    }

    // Check if batch is expired
    if (chosenBatch && chosenBatch.statusExpired === 'KADALUWARSA') {
      Swal.fire({
        icon: 'error',
        title: 'Batch Kadaluwarsa!',
        text: `Batch ${chosenBatch.noBatch} telah melewati tanggal kedaluwarsa dan dilarang untuk diresepkan.`
      });
      return;
    }

    const newItem: PrescribedItem = {
      obatId: selectedForConfig.id,
      namaObat: selectedForConfig.namaObat,
      kategori: selectedForConfig.kategori,
      sediaan: selectedForConfig.sediaan,
      qty: inputQty,
      signa: inputSigna,
      catatan: inputCatatan,
      noBatch: chosenBatch?.noBatch || null,
      batchDetail: chosenBatch,
      isVaksin: selectedForConfig.isVaksin
    };

    // Replace if exact same obatId and batch already exists, or append
    const existingIndex = selectedObat.findIndex(
      o => o.obatId === newItem.obatId && o.noBatch === newItem.noBatch
    );

    if (existingIndex >= 0) {
      const updated = [...selectedObat];
      updated[existingIndex].qty += newItem.qty;
      updated[existingIndex].signa = newItem.signa;
      updated[existingIndex].catatan = newItem.catatan;
      setSelectedObat(updated);
    } else {
      setSelectedObat([...selectedObat, newItem]);
    }

    // Reset config card
    setSelectedForConfig(null);
    setChosenBatch(null);
    setObatQuery('');
  };

  // Remove item
  const handleRemove = (index: number) => {
    setSelectedObat(selectedObat.filter((_, idx) => idx !== index));
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50">
      {/* ─── HEADER & FEFO GUARANTEE ─── */}
      <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-600 text-white rounded-none shadow-sm">
              <Pill className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              e-Resep Berbasis Prioritas FEFO
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Sistem menampilkan seluruh lot/batch obat, BMHP, dan vaksin yang tersedia di faskes dengan indikator 
            <span className="font-bold text-amber-700 bg-amber-50 px-1 mx-1 border border-amber-200">⚡ Prioritas FEFO</span> 
            agar dokter dapat memprioritaskan batch yang harus segera dikeluarkan terlebih dahulu.
          </p>
        </div>

        {onSaveResep && (
          <button
            type="button"
            onClick={onSaveResep}
            disabled={isSaving || selectedObat.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
              selectedObat.length === 0 || isSaving
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Draf Resep ({selectedObat.length})
          </button>
        )}
      </div>

      {/* ─── SEARCH & CATALOG PICKER SECTION ─── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">Cari Obat, BMHP, atau Vaksin Tersedia di Faskes</span>
          </div>

          {/* Category Tabs Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterKategori('SEMUA')}
              className={`px-3 py-1.5 transition-all ${
                filterKategori === 'SEMUA' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({fullCatalog.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori('OBAT')}
              className={`px-3 py-1.5 transition-all flex items-center gap-1 ${
                filterKategori === 'OBAT' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              Obat Oral/Topikal
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori('BMHP')}
              className={`px-3 py-1.5 transition-all flex items-center gap-1 ${
                filterKategori === 'BMHP' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              BMHP
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori('VAKSIN')}
              className={`px-3 py-1.5 transition-all flex items-center gap-1 ${
                filterKategori === 'VAKSIN' ? 'bg-white text-cyan-800 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Syringe className="w-3.5 h-3.5" />
              Vaksin Cold-Chain ({vaksinList.length})
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={obatQuery}
            onChange={(e) => setObatQuery(e.target.value)}
            placeholder="Ketik nama obat, vaksin, BMHP, atau nomor lot batch (misal: Paracetamol, Spuit, Campak)..."
            className="w-full bg-slate-50 border border-slate-300 px-4 py-3 pl-11 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          {obatQuery && (
            <button
              type="button"
              onClick={() => setObatQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Grid */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Memuat katalog stok & batch logistik Puskesmas...
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Tidak ditemukan obat atau vaksin yang cocok dengan pencarian &quot;{obatQuery}&quot;.
            </div>
          ) : (
            filteredCatalog.slice(0, 10).map((item) => {
              const batches = item.stokFaskes || [];
              const fefoBatch = batches.find(b => b.isPrioritasFefo && b.stok > 0);
              const isSelected = selectedForConfig?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectMedicine(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{item.namaObat}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                        {item.kategori}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Sediaan: {item.sediaan || '-'}
                      </span>
                    </div>

                    {/* Batches Pill Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {batches.length === 0 ? (
                        <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Stok Habis di Faskes Ini
                        </span>
                      ) : (
                        batches.map((b) => {
                          const isFefo = b.isPrioritasFefo && b.stok > 0;
                          const isExpired = b.statusExpired === 'KADALUWARSA';
                          const isNearExpired = b.statusExpired === 'SEGERA_KADALUWARSA';

                          return (
                            <div
                              key={b.id || b.noBatch}
                              className={`text-[11px] px-2.5 py-1 border flex items-center gap-1.5 ${
                                isExpired
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 line-through opacity-60'
                                  : isFefo
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold shadow-sm ring-1 ring-amber-300'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {isFefo && <span className="text-amber-600">⚡ FEFO (Keluarkan Dulu):</span>}
                              <span className="font-mono font-bold">{b.noBatch}</span>
                              <span className="text-slate-400">|</span>
                              <span>Stok: <strong>{b.stok}</strong></span>
                              <span className="text-slate-400">|</span>
                              <span>
                                ED: {b.tanggalExpired ? new Date(b.tanggalExpired).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                                {b.sisaHariExpired !== null && (
                                  <span className={`ml-1 font-bold ${b.sisaHariExpired <= 60 ? 'text-amber-700' : 'text-slate-500'}`}>
                                    ({b.sisaHariExpired} hr)
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`text-xs px-3.5 py-1.5 font-bold uppercase tracking-wider border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {isSelected ? 'Sedang Dipilih' : 'Pilih Obat'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── ACTIVE CONFIGURATION CARD ─── */}
      {selectedForConfig && (
        <div className="bg-blue-50/50 border-2 border-blue-500 p-6 space-y-6 shadow-md transition-all">
          <div className="flex justify-between items-start border-b border-blue-200/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider">
                  Konfigurasi Peresepan
                </span>
                <h4 className="text-lg font-black text-slate-900">{selectedForConfig.namaObat}</h4>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Kategori: <strong>{selectedForConfig.kategori}</strong> • Sediaan: <strong>{selectedForConfig.sediaan}</strong> • Total Stok: <strong>{selectedForConfig.totalStok}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedForConfig(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Batch Selector with Explicit FEFO Warnings */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Pilih Batch Logistik (Rekomendasi FEFO Diutamakan):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(selectedForConfig.stokFaskes || []).map((batch) => {
                const isSelected = chosenBatch?.noBatch === batch.noBatch;
                const isFefo = batch.isPrioritasFefo && batch.stok > 0;
                const isExpired = batch.statusExpired === 'KADALUWARSA';

                return (
                  <div
                    key={batch.id || batch.noBatch}
                    onClick={() => {
                      if (!isExpired) setChosenBatch(batch);
                    }}
                    className={`p-3.5 border transition-all cursor-pointer relative ${
                      isExpired
                        ? 'bg-rose-50/60 border-rose-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500 shadow-sm'
                        : isFefo
                        ? 'bg-amber-50/60 border-amber-300 hover:bg-amber-50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isFefo && (
                      <span className="absolute -top-2.5 right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider shadow-sm flex items-center gap-1">
                        ⚡ Prioritas FEFO (Keluarkan Dulu)
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-900">{batch.noBatch}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>

                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Sisa Stok:</span>
                        <strong className={batch.stok <= batch.stokMinimum ? 'text-amber-700' : 'text-slate-900'}>
                          {batch.stok} unit
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Kedaluwarsa:</span>
                        <span className="font-semibold text-slate-800">
                          {batch.tanggalExpired ? new Date(batch.tanggalExpired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                      {batch.sisaHariExpired !== null && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500">Masa Simpan:</span>
                          <span className={`text-[11px] font-black ${batch.sisaHariExpired <= 60 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {batch.sisaHariExpired < 0 ? 'Kedaluwarsa' : `${batch.sisaHariExpired} hari lagi`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {chosenBatch?.isPrioritasFefo && (
              <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Batch <strong>{chosenBatch.noBatch}</strong> otomatis dipilih karena memiliki tanggal kedaluwarsa paling dekat.
              </p>
            )}
          </div>

          {/* Form Fields: Qty, Signa, Catatan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Qty */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Jumlah / Qty ({selectedForConfig.sediaan || 'unit'}):
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setInputQty(Math.max(1, inputQty - 1))}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 font-black text-slate-700 border border-slate-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={chosenBatch?.stok || 9999}
                  value={inputQty}
                  onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                  className="w-20 bg-white border-y border-slate-300 py-2 text-center text-sm font-black text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setInputQty(inputQty + 1)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 font-black text-slate-700 border border-slate-300"
                >
                  +
                </button>
              </div>
              {chosenBatch && (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Maks. tersedia di batch: <strong>{chosenBatch.stok}</strong>
                </span>
              )}
            </div>

            {/* Signa / Aturan Pakai */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Aturan Pakai (Signa):
              </label>
              <input
                type="text"
                value={inputSigna}
                onChange={(e) => setInputSigna(e.target.value)}
                placeholder="Contoh: 3 x 1 Tablet sesudah makan"
                className="w-full bg-white border border-slate-300 px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {/* Fast Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-center mr-1">Preset Cepat:</span>
                {SIGNA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInputSigna(preset)}
                    className="text-[10px] px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-medium transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Dokter */}
            <div className="md:col-span-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Catatan Tambahan untuk Pasien / Apoteker (Opsional):
              </label>
              <input
                type="text"
                value={inputCatatan}
                onChange={(e) => setInputCatatan(e.target.value)}
                placeholder="Contoh: Habiskan antibiotik, simpan di tempat kering dan sejuk..."
                className="w-full bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-blue-200">
            <button
              type="button"
              onClick={() => setSelectedForConfig(null)}
              className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddPrescription}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambahkan ke e-Resep Pasien
            </button>
          </div>
        </div>
      )}

      {/* ─── SELECTED PRESCRIBED ITEMS TABLE ─── */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Daftar Terapi & e-Resep Pasien ({selectedObat.length} Item)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Resep akan langsung diteruskan ke antrean farmasi Puskesmas
          </span>
        </div>

        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-100/70 text-[11px] font-black text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Nama Item Terapi</th>
              <th className="px-4 py-3.5">Alokasi Batch (FEFO)</th>
              <th className="px-4 py-3.5 text-center w-28">Jumlah</th>
              <th className="px-5 py-3.5">Aturan Pakai (Signa)</th>
              <th className="px-4 py-3.5">Catatan</th>
              <th className="px-4 py-3.5 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm bg-white">
            {selectedObat.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium space-y-1">
                  <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Belum ada obat, BMHP, atau vaksin yang dimasukkan ke resep ini.</p>
                  <p className="text-xs text-slate-400">Gunakan pencarian di atas untuk memilih obat dan menentukan prioritas batch FEFO.</p>
                </td>
              </tr>
            ) : (
              selectedObat.map((item, idx) => {
                const isFefo = item.batchDetail?.isPrioritasFefo;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.namaObat}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-[10px] font-bold">
                          {item.kategori}
                        </span>
                        <span>Sediaan: {item.sediaan}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.noBatch ? (
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold border ${
                            isFefo 
                              ? 'bg-amber-50 text-amber-900 border-amber-300' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {isFefo && <span>⚡</span>}
                            {item.noBatch}
                          </span>
                          {isFefo && (
                            <span className="block text-[10px] font-black text-amber-700 tracking-wider">
                              PRIORITAS FEFO
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Auto-FEFO Farmasi</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...selectedObat];
                          updated[idx].qty = parseInt(e.target.value) || 1;
                          setSelectedObat(updated);
                        }}
                        className="w-16 bg-white border border-slate-300 text-sm py-1.5 text-center font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={item.signa}
                        onChange={(e) => {
                          const updated = [...selectedObat];
                          updated[idx].signa = e.target.value;
                          setSelectedObat(updated);
                        }}
                        className="w-full bg-white border border-slate-300 text-xs py-1.5 px-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        placeholder="Catatan..."
                        value={item.catatan || ''}
                        onChange={(e) => {
                          const updated = [...selectedObat];
                          updated[idx].catatan = e.target.value;
                          setSelectedObat(updated);
                        }}
                        className="w-full bg-white border border-slate-200 text-xs py-1.5 px-2 text-slate-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-none transition-all"
                        title="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
