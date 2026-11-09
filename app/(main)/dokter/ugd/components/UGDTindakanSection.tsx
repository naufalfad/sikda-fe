"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Syringe, Search, Plus, Trash2, Check, Loader2, Wrench, Package,
  ExternalLink, Sparkles, AlertCircle, ChevronDown, CheckCircle2,
  X, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { icd9Service } from '@/services/icd9.service';

export interface UGDTindakanItem {
  id?: string;
  id_icd9?: string;
  icd9Id?: string;
  kode_icd9: string;
  nama_prosedur: string;
  pelaksana: string;
  tipePelaksanaan: 'INTERNAL' | 'EKSTERNAL';
  faskesRujukan?: string;
  alasanRujukan?: string;
  catatan?: string;
  bmhpDetails: Array<{
    obatId?: string;
    namaItem: string;
    sediaan?: string;
    jumlah: number;
    hargaSatuan: number;
    subTotal: number;
  }>;
  alkesDetails: Array<{
    asetId?: string;
    namaAset: string;
    kodeAset?: string;
    tarifPemakaian: number;
  }>;
}

interface UGDTindakanSectionProps {
  selectedProsedur: UGDTindakanItem[];
  setSelectedProsedur: React.Dispatch<React.SetStateAction<UGDTindakanItem[]>>;
  availableAlkes: any[];
  availableBmhp: any[];
  canEdit: boolean;
}

export default function UGDTindakanSection({
  selectedProsedur,
  setSelectedProsedur,
  availableAlkes,
  availableBmhp,
  canEdit
}: UGDTindakanSectionProps) {
  // ICD-9 Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [icd9Results, setIcd9Results] = useState<any[]>([]);
  const [isLoadingIcd9, setIsLoadingIcd9] = useState(false);
  const [isIcd9DropdownOpen, setIsIcd9DropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // BMHP add selector states per procedure
  const [activeBmhpSearch, setActiveBmhpSearch] = useState<{ [procIndex: number]: string }>({});
  const [openBmhpDropdown, setOpenBmhpDropdown] = useState<{ [procIndex: number]: boolean }>({});

  // Search ICD-9 with debouncing
  const fetchICD9 = async (term: string = '') => {
    setIsLoadingIcd9(true);
    try {
      const res = await icd9Service.search(term);
      const data = res?.data || res || [];
      setIcd9Results(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching ICD-9 UGD:', err);
      setIcd9Results([]);
    } finally {
      setIsLoadingIcd9(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchICD9(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener for ICD-9 dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsIcd9DropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper resolusi item BMHP dari database faskes
  const resolveBmhp = (
    keyword: string,
    fallback: { obatId: string; namaItem: string; sediaan: string; jumlah: number; hargaSatuan: number }
  ) => {
    const match = availableBmhp.find((b: any) =>
      (b.kodeObat && b.kodeObat.toLowerCase() === keyword.toLowerCase()) ||
      (b.namaObat && b.namaObat.toLowerCase().includes(fallback.namaItem.toLowerCase().slice(0, 10))) ||
      (b.namaObat && b.namaObat.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (match) {
      const harga = Number(match.hargaJual || match.harga || match.hargaBeli) || fallback.hargaSatuan;
      return {
        obatId: match.id,
        namaItem: match.namaObat,
        sediaan: match.sediaan || fallback.sediaan,
        jumlah: fallback.jumlah,
        hargaSatuan: harga,
        subTotal: harga * fallback.jumlah
      };
    }
    return {
      ...fallback,
      subTotal: fallback.hargaSatuan * fallback.jumlah
    };
  };

  // Helper resolusi Alkes dari database ruangan UGD
  const resolveAlkes = (keyword: string, fallbackTarif: number = 25000) => {
    const match = availableAlkes.find((a: any) =>
      (a.namaAset && a.namaAset.toLowerCase().includes(keyword.toLowerCase())) ||
      (a.kodeAset && a.kodeAset.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (match) {
      return {
        asetId: match.id,
        namaAset: match.namaAset,
        kodeAset: match.kodeAset,
        tarifPemakaian: Number(match.tarifPemakaian) || fallbackTarif
      };
    }
    return null;
  };

  // Tambah Prosedur ke list
  const addProcedureItem = (
    item: any,
    alkes: any[] = [],
    bmhp: any[] = [],
    tipePelaksanaan: 'INTERNAL' | 'EKSTERNAL' = 'INTERNAL'
  ) => {
    setSelectedProsedur(prev => [
      ...prev,
      {
        id_icd9: item.id_icd9 || item.id,
        icd9Id: item.id_icd9 || item.id,
        kode_icd9: item.kode_icd9,
        nama_prosedur: item.nama_prosedur,
        pelaksana: tipePelaksanaan === 'EKSTERNAL' ? 'Rujukan Luar' : 'Dokter',
        catatan: '',
        tipePelaksanaan,
        faskesRujukan: tipePelaksanaan === 'EKSTERNAL' ? 'RSUD Rujukan Lanjutan' : '',
        alasanRujukan: '',
        alkesDetails: tipePelaksanaan === 'EKSTERNAL' ? [] : alkes,
        bmhpDetails: tipePelaksanaan === 'EKSTERNAL' ? [] : bmhp
      }
    ]);
  };

  // Handler Pilih ICD-9 dari Search
  const handleSelectICD9 = (item: any) => {
    if (!canEdit) return;
    const exists = selectedProsedur.some(
      p => p.kode_icd9 === item.kode_icd9 || p.id_icd9 === (item.id_icd9 || item.id)
    );
    if (exists) {
      Swal.fire({
        icon: 'info',
        title: 'Tindakan Sudah Ada',
        text: `Prosedur ${item.nama_prosedur} (${item.kode_icd9}) sudah ada dalam daftar.`,
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const kode = item.kode_icd9 || '';
    const namaLower = (item.nama_prosedur || '').toLowerCase();

    // Deteksi pemeriksaan penunjang lab / radiologi (87.xx, 88.xx, 90.xx, 91.xx)
    if (kode.startsWith('87.') || kode.startsWith('88.') || kode.startsWith('90.') || kode.startsWith('91.')) {
      Swal.fire({
        icon: 'question',
        title: 'Pemeriksaan Penunjang / Diagnostik UGD',
        html: `
          <div class="text-left text-xs text-slate-700 space-y-2.5">
            <p>Prosedur <strong>${kode}</strong> - <em>${item.nama_prosedur}</em> merupakan pemeriksaan diagnostik.</p>
            <p class="font-bold text-slate-800">Tentukan lokasi pelaksanaannya:</p>
            <div class="p-2.5 bg-blue-50 border border-blue-200 text-blue-950">
              <strong>🏢 Dikerjakan Internal UGD/Faskes:</strong> Jika faskes memiliki fasilitas sendiri. Pasien dikenakan tarif tindakan & alat di Kasir.
            </div>
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950">
              <strong>🏥 Rujukan Eksternal (Rp 0):</strong> Faskes belum memadai dan pasien dirujuk ke faskes luar (RSUD/Labkesda). Pasien <strong>tidak dikenakan biaya (Rp 0)</strong> di sini.
            </div>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '🏢 Dikerjakan Internal',
        denyButtonText: '🏥 Rujuk Eksternal (Rp 0)',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#2563eb',
        denyButtonColor: '#059669'
      }).then(res => {
        if (res.isConfirmed) {
          addProcedureItem(item, [], [], 'INTERNAL');
          setIsIcd9DropdownOpen(false);
          setSearchTerm('');
        } else if (res.isDenied) {
          addProcedureItem(item, [], [], 'EKSTERNAL');
          setIsIcd9DropdownOpen(false);
          setSearchTerm('');
        }
      });
      return;
    }

    // Default smart presets jika ada
    let presetAlkes: any[] = [];
    let presetBmhp: any[] = [];

    if (namaLower.includes('jahit') || namaLower.includes('hecting') || namaLower.includes('suture') || namaLower.includes('luka')) {
      const minor = resolveAlkes('minor', 20000) || resolveAlkes('jahit', 20000);
      if (minor) presetAlkes.push(minor);
      presetBmhp = [
        resolveBmhp('spuit', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000 }),
        resolveBmhp('lidocaine', { obatId: 'BMHP-LID-2', namaItem: 'Lidocaine HCl 2% Ampul', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 5000 }),
        resolveBmhp('benang', { obatId: 'BMHP-BNG-SLK', namaItem: 'Benang Jahit Silk 3-0 with Needle', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 12000 }),
        resolveBmhp('kasa', { obatId: 'BMHP-KSA-STR', namaItem: 'Kasa Steril 16x16', sediaan: 'Lembar', jumlah: 2, hargaSatuan: 2000 }),
        resolveBmhp('povidone', { obatId: 'BMHP-PVI-60ML', namaItem: 'Povidone Iodine 10%', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000 })
      ];
    } else if (namaLower.includes('infus') || namaLower.includes('iv line') || namaLower.includes('intravena')) {
      const infPump = resolveAlkes('infusion pump', 25000);
      if (infPump) presetAlkes.push(infPump);
      presetBmhp = [
        resolveBmhp('abocath', { obatId: 'BMHP-ABO-20G', namaItem: 'Abocath / IV Catheter 20G', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 8000 }),
        resolveBmhp('infus set', { obatId: 'BMHP-INF-SET', namaItem: 'Infus Set Dewasa Makro', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000 }),
        resolveBmhp('ringer', { obatId: 'BMHP-CRL-500', namaItem: 'Cairan Ringer Lactate 500ml', sediaan: 'Kolf', jumlah: 1, hargaSatuan: 12000 }),
        resolveBmhp('plester', { obatId: 'BMHP-PLS-MED', namaItem: 'Plester Hipafix Medis', sediaan: 'Roll', jumlah: 1, hargaSatuan: 10000 }),
        resolveBmhp('alkohol', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 2, hargaSatuan: 1000 })
      ];
    } else if (namaLower.includes('nebul') || namaLower.includes('inhalasi')) {
      const neb = resolveAlkes('nebulizer', 25000);
      if (neb) presetAlkes.push(neb);
      presetBmhp = [
        resolveBmhp('nebulizer', { obatId: 'BMHP-MSK-NEB', namaItem: 'Masker Nebulizer Dewasa Kit', sediaan: 'Set', jumlah: 1, hargaSatuan: 15000 }),
        resolveBmhp('nacl', { obatId: 'BMHP-NCL-100', namaItem: 'Cairan NaCl 0.9% 100ml', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000 })
      ];
    } else if (namaLower.includes('ekg') || namaLower.includes('elektrokardiograf')) {
      const ekg = resolveAlkes('ekg', 35000);
      if (ekg) presetAlkes.push(ekg);
      presetBmhp = [
        resolveBmhp('ekg', { obatId: 'BMHP-KTS-EKG', namaItem: 'Kertas Thermal EKG & Gel', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000 })
      ];
    } else if (namaLower.includes('kateter') || namaLower.includes('catheter') || namaLower.includes('foley')) {
      presetBmhp = [
        resolveBmhp('kateter', { obatId: 'BMHP-FLY-16', namaItem: 'Foley Catheter 2-Way No 16', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 18000 }),
        resolveBmhp('urine bag', { obatId: 'BMHP-URN-BAG', namaItem: 'Urine Bag 2000ml', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 10000 }),
        resolveBmhp('spuit 10', { obatId: 'BMHP-SPU-10CC', namaItem: 'Spuit 10cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 4000 }),
        resolveBmhp('aquabidest', { obatId: 'BMHP-AQB-25', namaItem: 'Aquabidest 25ml', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 5000 }),
        resolveBmhp('gel', { obatId: 'BMHP-JLY-LUB', namaItem: 'Jelly Lubricant Medis', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 8000 })
      ];
    } else if (namaLower.includes('oksigen') || namaLower.includes('o2') || namaLower.includes('kanul')) {
      const o2Tank = resolveAlkes('oksigen', 20000) || resolveAlkes('regulator', 20000);
      if (o2Tank) presetAlkes.push(o2Tank);
      presetBmhp = [
        resolveBmhp('kanul', { obatId: 'BMHP-KNL-O2', namaItem: 'Nasal Canula O2 Dewasa', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 10000 })
      ];
    } else if (namaLower.includes('injeksi') || namaLower.includes('suntik')) {
      presetBmhp = [
        resolveBmhp('spuit', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000 }),
        resolveBmhp('alkohol', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 1, hargaSatuan: 1000 })
      ];
    }

    addProcedureItem(item, presetAlkes, presetBmhp, 'INTERNAL');
    setIsIcd9DropdownOpen(false);
    setSearchTerm('');
  };

  // Quick Action Presets Gawat Darurat UGD
  const applyQuickPresetUGD = (presetKey: string) => {
    if (!canEdit) return;
    switch (presetKey) {
      case 'INFUS': {
        const item = { id_icd9: 'ICD9-99.18', kode_icd9: '99.18', nama_prosedur: 'Pemasangan Infus / Intravena Line (IV Line)' };
        const pump = resolveAlkes('infusion pump', 25000);
        const bmhp = [
          resolveBmhp('abocath', { obatId: 'BMHP-ABO-20G', namaItem: 'Abocath / IV Catheter 20G', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 8000 }),
          resolveBmhp('infus set', { obatId: 'BMHP-INF-SET', namaItem: 'Infus Set Dewasa Makro', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000 }),
          resolveBmhp('ringer', { obatId: 'BMHP-CRL-500', namaItem: 'Cairan Ringer Lactate 500ml', sediaan: 'Kolf', jumlah: 1, hargaSatuan: 12000 }),
          resolveBmhp('plester', { obatId: 'BMHP-PLS-MED', namaItem: 'Plester Hipafix Medis', sediaan: 'Roll', jumlah: 1, hargaSatuan: 10000 }),
          resolveBmhp('alkohol', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 2, hargaSatuan: 1000 })
        ];
        addProcedureItem(item, pump ? [pump] : [], bmhp);
        break;
      }
      case 'OKSIGEN': {
        const item = { id_icd9: 'ICD9-93.96', kode_icd9: '93.96', nama_prosedur: 'Oksigenasi Nasal Kanul / Masker UGD' };
        const o2Tank = resolveAlkes('oksigen', 20000) || resolveAlkes('tabung', 20000);
        const bmhp = [
          resolveBmhp('kanul', { obatId: 'BMHP-KNL-O2', namaItem: 'Nasal Canula O2 Dewasa', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 10000 })
        ];
        addProcedureItem(item, o2Tank ? [o2Tank] : [], bmhp);
        break;
      }
      case 'NEBULIZER': {
        const item = { id_icd9: 'ICD9-93.94', kode_icd9: '93.94', nama_prosedur: 'Terapi Inhalasi / Nebulisasi Darurat UGD' };
        const neb = resolveAlkes('nebulizer', 25000);
        const bmhp = [
          resolveBmhp('nebulizer', { obatId: 'BMHP-MSK-NEB', namaItem: 'Masker Nebulizer Dewasa Kit', sediaan: 'Set', jumlah: 1, hargaSatuan: 15000 }),
          resolveBmhp('nacl', { obatId: 'BMHP-NCL-100', namaItem: 'Cairan NaCl 0.9% 100ml', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000 })
        ];
        addProcedureItem(item, neb ? [neb] : [], bmhp);
        break;
      }
      case 'EKG': {
        const item = { id_icd9: 'ICD9-89.52', kode_icd9: '89.52', nama_prosedur: 'Perekaman Elektrokardiografi (EKG 12-Lead)' };
        const ekg = resolveAlkes('ekg', 35000);
        const bmhp = [
          resolveBmhp('ekg', { obatId: 'BMHP-KTS-EKG', namaItem: 'Kertas Thermal EKG & Gel', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000 })
        ];
        addProcedureItem(item, ekg ? [ekg] : [], bmhp);
        break;
      }
      case 'HECTING': {
        const item = { id_icd9: 'ICD9-86.59', kode_icd9: '86.59', nama_prosedur: 'Penjahitan Luka Terbuka (Hecting UGD)' };
        const minor = resolveAlkes('minor', 20000) || resolveAlkes('jahit', 20000);
        const bmhp = [
          resolveBmhp('spuit', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000 }),
          resolveBmhp('lidocaine', { obatId: 'BMHP-LID-2', namaItem: 'Lidocaine HCl 2% Ampul', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 5000 }),
          resolveBmhp('benang', { obatId: 'BMHP-BNG-SLK', namaItem: 'Benang Jahit Silk 3-0 with Needle', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 12000 }),
          resolveBmhp('kasa', { obatId: 'BMHP-KSA-STR', namaItem: 'Kasa Steril 16x16', sediaan: 'Lembar', jumlah: 2, hargaSatuan: 2000 }),
          resolveBmhp('povidone', { obatId: 'BMHP-PVI-60ML', namaItem: 'Povidone Iodine 10%', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000 })
        ];
        addProcedureItem(item, minor ? [minor] : [], bmhp);
        break;
      }
      case 'KATETER': {
        const item = { id_icd9: 'ICD9-57.94', kode_icd9: '57.94', nama_prosedur: 'Pemasangan Kateter Urine UGD (Foley Catheter)' };
        const bmhp = [
          resolveBmhp('kateter', { obatId: 'BMHP-FLY-16', namaItem: 'Foley Catheter 2-Way No 16', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 18000 }),
          resolveBmhp('urine bag', { obatId: 'BMHP-URN-BAG', namaItem: 'Urine Bag 2000ml', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 10000 }),
          resolveBmhp('spuit 10', { obatId: 'BMHP-SPU-10CC', namaItem: 'Spuit 10cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 4000 }),
          resolveBmhp('aquabidest', { obatId: 'BMHP-AQB-25', namaItem: 'Aquabidest 25ml', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 5000 }),
          resolveBmhp('gel', { obatId: 'BMHP-JLY-LUB', namaItem: 'Jelly Lubricant Medis', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 8000 })
        ];
        addProcedureItem(item, [], bmhp);
        break;
      }
      case 'INJEKSI': {
        const item = { id_icd9: 'ICD9-99.29', kode_icd9: '99.29', nama_prosedur: 'Injeksi Obat Terapi Darurat UGD (IV/IM/SC)' };
        const bmhp = [
          resolveBmhp('spuit', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000 }),
          resolveBmhp('alkohol', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 1, hargaSatuan: 1000 })
        ];
        addProcedureItem(item, [], bmhp);
        break;
      }
      case 'DEBRIDEMENT': {
        const item = { id_icd9: 'ICD9-86.22', kode_icd9: '86.22', nama_prosedur: 'Perawatan Luka / Debridement Luka Kotor UGD' };
        const minor = resolveAlkes('minor', 20000);
        const bmhp = [
          resolveBmhp('kasa', { obatId: 'BMHP-KSA-STR', namaItem: 'Kasa Steril 16x16', sediaan: 'Lembar', jumlah: 3, hargaSatuan: 2000 }),
          resolveBmhp('nacl', { obatId: 'BMHP-NCL-500', namaItem: 'Cairan NaCl 0.9% 500ml', sediaan: 'Kolf', jumlah: 1, hargaSatuan: 12000 }),
          resolveBmhp('povidone', { obatId: 'BMHP-PVI-60ML', namaItem: 'Povidone Iodine 10%', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000 }),
          resolveBmhp('plester', { obatId: 'BMHP-PLS-MED', namaItem: 'Plester Hipafix Medis', sediaan: 'Roll', jumlah: 1, hargaSatuan: 10000 })
        ];
        addProcedureItem(item, minor ? [minor] : [], bmhp);
        break;
      }
      default:
        break;
    }
  };

  // Toggle tipe pelaksanaan
  const handleToggleTipePelaksanaan = (procIndex: number, tipe: 'INTERNAL' | 'EKSTERNAL') => {
    if (!canEdit) return;
    setSelectedProsedur(prev => {
      const updated = [...prev];
      updated[procIndex] = {
        ...updated[procIndex],
        tipePelaksanaan: tipe,
        pelaksana: tipe === 'EKSTERNAL' ? 'Rujukan Luar' : 'Dokter',
        faskesRujukan: tipe === 'EKSTERNAL' ? (updated[procIndex].faskesRujukan || 'RSUD Rujukan Lanjutan') : '',
        alkesDetails: tipe === 'EKSTERNAL' ? [] : updated[procIndex].alkesDetails,
        bmhpDetails: tipe === 'EKSTERNAL' ? [] : updated[procIndex].bmhpDetails
      };
      return updated;
    });
  };

  // Toggle Alkes pada tindakan
  const handleToggleAlkes = (procIndex: number, alkes: any) => {
    if (!canEdit) return;
    setSelectedProsedur(prev => {
      const updated = [...prev];
      const proc = { ...updated[procIndex] };
      const currentAlkes = [...(proc.alkesDetails || [])];
      const existingIdx = currentAlkes.findIndex(a => a.asetId === alkes.id || a.namaAset === alkes.namaAset);

      if (existingIdx >= 0) {
        currentAlkes.splice(existingIdx, 1);
      } else {
        currentAlkes.push({
          asetId: alkes.id,
          namaAset: alkes.namaAset,
          kodeAset: alkes.kodeAset,
          tarifPemakaian: Number(alkes.tarifPemakaian) || 25000
        });
      }
      proc.alkesDetails = currentAlkes;
      updated[procIndex] = proc;
      return updated;
    });
  };

  // Tambah BMHP dari dropdown
  const handleAddBmhpItem = (procIndex: number, obat: any) => {
    if (!canEdit) return;
    setSelectedProsedur(prev => {
      const updated = [...prev];
      const proc = { ...updated[procIndex] };
      const currentBmhp = [...(proc.bmhpDetails || [])];

      const existing = currentBmhp.find(b => b.obatId === obat.id || b.namaItem === obat.namaObat);
      if (existing) {
        existing.jumlah += 1;
        existing.subTotal = existing.jumlah * existing.hargaSatuan;
      } else {
        const harga = Number(obat.hargaJual || obat.harga || obat.hargaBeli) || 3000;
        currentBmhp.push({
          obatId: obat.id,
          namaItem: obat.namaObat,
          sediaan: obat.sediaan || 'Pcs',
          jumlah: 1,
          hargaSatuan: harga,
          subTotal: harga
        });
      }
      proc.bmhpDetails = currentBmhp;
      updated[procIndex] = proc;
      return updated;
    });

    setOpenBmhpDropdown(prev => ({ ...prev, [procIndex]: false }));
    setActiveBmhpSearch(prev => ({ ...prev, [procIndex]: '' }));
  };

  // Update BMHP Qty
  const handleUpdateBmhpQty = (procIndex: number, bmhpIndex: number, delta: number) => {
    if (!canEdit) return;
    setSelectedProsedur(prev => {
      const updated = [...prev];
      const proc = { ...updated[procIndex] };
      const currentBmhp = [...(proc.bmhpDetails || [])];

      if (currentBmhp[bmhpIndex]) {
        const newQty = Math.max(1, currentBmhp[bmhpIndex].jumlah + delta);
        currentBmhp[bmhpIndex] = {
          ...currentBmhp[bmhpIndex],
          jumlah: newQty,
          subTotal: newQty * currentBmhp[bmhpIndex].hargaSatuan
        };
      }
      proc.bmhpDetails = currentBmhp;
      updated[procIndex] = proc;
      return updated;
    });
  };

  // Hapus item BMHP
  const handleRemoveBmhpItem = (procIndex: number, bmhpIndex: number) => {
    if (!canEdit) return;
    setSelectedProsedur(prev => {
      const updated = [...prev];
      const proc = { ...updated[procIndex] };
      const currentBmhp = [...(proc.bmhpDetails || [])];
      currentBmhp.splice(bmhpIndex, 1);
      proc.bmhpDetails = currentBmhp;
      updated[procIndex] = proc;
      return updated;
    });
  };

  // Hapus Prosedur
  const handleRemoveProsedur = (kode: string) => {
    if (!canEdit) return;
    setSelectedProsedur(prev => prev.filter(p => p.kode_icd9 !== kode));
  };

  // Total Estimasi Biaya
  const totalSummary = useMemo(() => {
    let totalAlkes = 0;
    let totalBmhp = 0;
    let totalTindakan = 0;

    selectedProsedur.forEach(p => {
      if (p.tipePelaksanaan === 'EKSTERNAL') return;
      totalTindakan += 25000; // Standar jasa tindakan UGD (estimasi)
      (p.alkesDetails || []).forEach(a => {
        totalAlkes += Number(a.tarifPemakaian) || 0;
      });
      (p.bmhpDetails || []).forEach(b => {
        totalBmhp += Number(b.subTotal) || 0;
      });
    });

    return {
      totalTindakan,
      totalAlkes,
      totalBmhp,
      grandTotal: totalTindakan + totalAlkes + totalBmhp
    };
  }, [selectedProsedur]);

  return (
    <div className="space-y-4">
      {/* Header Bagian Tindakan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-2">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
            <Syringe className="w-4 h-4 text-rose-600" />
            Tindakan Medis, Alkes & Pemakaian BMHP UGD (ICD-9-CM)
          </h4>
          <p className="text-[11px] text-gray-500">
            Pemakaian BMHP otomatis memotong stok logistik farmasi, sewa Alkes & tindakan tercatat di Kasir.
          </p>
        </div>
        <div className="text-[11px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-2 py-1 font-bold">
          {selectedProsedur.length} Tindakan Terpilih
        </div>
      </div>

      {/* Quick Action Presets Gawat Darurat UGD */}
      <div>
        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Preset Cepat Tindakan Gawat Darurat (1-Klik Tambah + Alkes & BMHP):
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('INFUS')}
            className="text-[11px] px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            💉 Pasang Infus / IV Line
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('OKSIGEN')}
            className="text-[11px] px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            💨 Oksigenasi Kanul/Masker
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('NEBULIZER')}
            className="text-[11px] px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            🫁 Nebulisasi Darurat
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('EKG')}
            className="text-[11px] px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            📈 Rekam EKG 12-Lead
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('HECTING')}
            className="text-[11px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            🧵 Hecting & Jahit Luka
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('KATETER')}
            className="text-[11px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            💧 Pasang Kateter Urine
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('INJEKSI')}
            className="text-[11px] px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            💉 Injeksi Obat Darurat
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => applyQuickPresetUGD('DEBRIDEMENT')}
            className="text-[11px] px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            🩹 Rawat Luka / Debridement
          </button>
        </div>
      </div>

      {/* Input Pencarian ICD-9 */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Cari & Tambah Tindakan Medis ICD-9-CM:
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            disabled={!canEdit}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setIsIcd9DropdownOpen(true);
            }}
            onClick={() => {
              if (canEdit) {
                setIsIcd9DropdownOpen(true);
                if (icd9Results.length === 0) fetchICD9('');
              }
            }}
            placeholder="Ketik kode atau nama tindakan ICD-9 (cth: 99.18, 93.96, jahit, infus, nebulizer, ekg)..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-none bg-white focus:border-rose-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <div className="absolute left-2.5 text-gray-400 pointer-events-none">
            {isLoadingIcd9 ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Search className="w-4 h-4" />}
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchICD9('');
              }}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Hasil Pencarian ICD-9 */}
        {isIcd9DropdownOpen && canEdit && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
            <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100 flex justify-between items-center text-[11px] text-rose-900 font-bold sticky top-0 z-10">
              <span>{searchTerm ? `Hasil untuk "${searchTerm}"` : 'Master ICD-9 Tindakan Medis'}</span>
              <span className="text-gray-500 text-[10px]">{icd9Results.length} tersedia</span>
            </div>

            {isLoadingIcd9 && icd9Results.length === 0 ? (
              <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>Memuat master ICD-9...</span>
              </div>
            ) : icd9Results.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Tidak ada tindakan ICD-9 yang cocok.
              </div>
            ) : (
              icd9Results.map((item, idx) => {
                const isSelected = selectedProsedur.some(
                  p => p.kode_icd9 === item.kode_icd9 || p.id_icd9 === (item.id_icd9 || item.id)
                );
                return (
                  <div
                    key={item.id_icd9 || idx}
                    onClick={() => !isSelected && handleSelectICD9(item)}
                    className={`p-2.5 hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-rose-50/50 cursor-default' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 text-[10px] border border-rose-200">
                        {item.kode_icd9}
                      </span>
                      <span className="font-semibold text-gray-800">{item.nama_prosedur}</span>
                      {item.kategori && (
                        <span className="text-[10px] text-gray-400">({item.kategori})</span>
                      )}
                    </div>
                    <div>
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectICD9(item);
                          }}
                          className="text-[10px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 px-2 py-0.5 border border-rose-200 hover:border-rose-600 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Daftar Kartu Tindakan & Rincian BMHP/Alkes Terpilih */}
      {selectedProsedur.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-gray-300 p-6 text-center text-gray-400">
          <Syringe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-bold text-gray-600">Belum ada tindakan medis / pemakaian BMHP yang dipilih</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Gunakan tombol preset darurat di atas atau ketik pencarian ICD-9 untuk mencatat tindakan, pemakaian BMHP, dan sewa Alkes UGD.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedProsedur.map((proc, procIdx) => {
            const isEksternal = proc.tipePelaksanaan === 'EKSTERNAL';
            const subtotalAlkes = (proc.alkesDetails || []).reduce((acc, a) => acc + (Number(a.tarifPemakaian) || 0), 0);
            const subtotalBmhp = (proc.bmhpDetails || []).reduce((acc, b) => acc + (Number(b.subTotal) || 0), 0);

            // Filter BMHP untuk dropdown "+ Tambah BMHP" pada kartu ini
            const bmhpSearch = (activeBmhpSearch[procIdx] || '').toLowerCase();
            const filteredBmhpOptions = availableBmhp.filter((b: any) =>
              (b.namaObat || '').toLowerCase().includes(bmhpSearch) ||
              (b.kodeObat || '').toLowerCase().includes(bmhpSearch)
            ).slice(0, 15);

            return (
              <div
                key={proc.kode_icd9 || procIdx}
                className={`border shadow-sm p-3.5 transition-all ${
                  isEksternal
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-gray-200 bg-white hover:border-rose-300'
                }`}
              >
                {/* Header Kartu Tindakan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 text-xs border border-rose-300">
                      {proc.kode_icd9}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{proc.nama_prosedur}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pelaksana Dropdown */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-gray-500">Pelaksana:</span>
                      <select
                        disabled={!canEdit || isEksternal}
                        value={proc.pelaksana}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedProsedur(prev => {
                            const u = [...prev];
                            u[procIdx] = { ...u[procIdx], pelaksana: val };
                            return u;
                          });
                        }}
                        className="text-xs border border-gray-300 bg-white px-2 py-1 focus:outline-none"
                      >
                        <option value="Dokter">Dokter DPJP</option>
                        <option value="Perawat">Perawat UGD</option>
                        <option value="Bersama">Dokter & Perawat</option>
                        {isEksternal && <option value="Rujukan Luar">Rujukan Luar</option>}
                      </select>
                    </div>

                    {/* Toggle Internal vs Eksternal */}
                    <div className="flex border border-gray-300 text-[10px] font-bold overflow-hidden">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleTipePelaksanaan(procIdx, 'INTERNAL')}
                        className={`px-2 py-1 transition-colors ${
                          !isEksternal
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Internal Faskes
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleTipePelaksanaan(procIdx, 'EKSTERNAL')}
                        className={`px-2 py-1 transition-colors ${
                          isEksternal
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Rujukan Luar (Rp 0)
                      </button>
                    </div>

                    {/* Hapus Prosedur Button */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProsedur(proc.kode_icd9)}
                        title="Hapus Tindakan Ini"
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Kondisional Tipe Eksternal vs Internal */}
                {isEksternal ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Tindakan / Pemeriksaan Dialihkan ke Faskes Luar (Tarif Rp 0 di Faskes Ini)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                          Rumah Sakit / Lab Rujukan:
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={proc.faskesRujukan || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setSelectedProsedur(prev => {
                              const u = [...prev];
                              u[procIdx] = { ...u[procIdx], faskesRujukan: val };
                              return u;
                            });
                          }}
                          placeholder="RSUD Cibinong / RS PMI..."
                          className="w-full text-xs p-1.5 border border-emerald-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                          Indikasi / Alasan Rujukan:
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={proc.alasanRujukan || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setSelectedProsedur(prev => {
                              const u = [...prev];
                              u[procIdx] = { ...u[procIdx], alasanRujukan: val };
                              return u;
                            });
                          }}
                          placeholder="Fasilitas internal belum memadai..."
                          className="w-full text-xs p-1.5 border border-emerald-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Panel Kiri: Pemakaian / Sewa Alat Kesehatan (Alkes) */}
                    <div className="bg-slate-50 border border-slate-200 p-2.5 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          Sewa / Pemakaian Alat Medis (Alkes):
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 font-bold">
                          Subtotal: Rp {subtotalAlkes.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {availableAlkes.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">Tidak ada master alkes tindakan terdaftar di faskes ini.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                          {availableAlkes.map(alkes => {
                            const isChecked = (proc.alkesDetails || []).some(
                              a => a.asetId === alkes.id || a.namaAset === alkes.namaAset
                            );
                            return (
                              <button
                                key={alkes.id}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleToggleAlkes(procIdx, alkes)}
                                className={`text-[10px] px-2 py-1 border transition-colors flex items-center gap-1 ${
                                  isChecked
                                    ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                                <span>{alkes.namaAset}</span>
                                <span className={`text-[9px] ${isChecked ? 'text-blue-100' : 'text-gray-400'}`}>
                                  (Rp {(Number(alkes.tarifPemakaian) || 0).toLocaleString('id-ID')})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Panel Kanan: Pemakaian BMHP & Logistik Farmasi */}
                    <div className="bg-amber-50/50 border border-amber-200 p-2.5 space-y-2">
                      <div className="flex justify-between items-center border-b border-amber-200 pb-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          Pemakaian BMHP / Bahan Medis Habis Pakai:
                        </span>
                        <span className="font-mono text-[10px] text-amber-800 font-bold">
                          Subtotal: Rp {subtotalBmhp.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Tabel BMHP Terpakai */}
                      {(proc.bmhpDetails || []).length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">Belum ada BMHP yang ditambahkan.</p>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {(proc.bmhpDetails || []).map((bmhp, bIdx) => (
                            <div
                              key={bIdx}
                              className="bg-white border border-amber-200 p-1.5 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex-1 pr-2 truncate">
                                <span className="font-bold text-gray-800">{bmhp.namaItem}</span>
                                <span className="text-gray-400 text-[10px] ml-1">
                                  (@ Rp {bmhp.hargaSatuan.toLocaleString('id-ID')})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Stepper Qty */}
                                <div className="flex items-center border border-gray-300">
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => handleUpdateBmhpQty(procIdx, bIdx, -1)}
                                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-50"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 font-mono font-bold text-gray-800">{bmhp.jumlah}</span>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => handleUpdateBmhpQty(procIdx, bIdx, 1)}
                                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-50"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-[10px] text-gray-500 w-8">{bmhp.sediaan || 'Pcs'}</span>
                                <span className="font-mono font-bold text-gray-800 w-16 text-right">
                                  Rp {bmhp.subTotal.toLocaleString('id-ID')}
                                </span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBmhpItem(procIdx, bIdx)}
                                    className="text-gray-400 hover:text-rose-600 p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dropdown Tambah BMHP Terpakai */}
                      {canEdit && (
                        <div className="relative pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenBmhpDropdown(prev => ({ ...prev, [procIdx]: !prev[procIdx] }))
                            }
                            className="w-full text-left px-2 py-1.5 bg-white border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center justify-between hover:bg-amber-50/60"
                          >
                            <span className="flex items-center gap-1">
                              <Plus className="w-3.5 h-3.5" /> Tambah BMHP dari Stok Farmasi
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          {openBmhpDropdown[procIdx] && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 shadow-xl p-2 text-xs space-y-1.5">
                              <input
                                type="text"
                                placeholder="Cari BMHP (kassa, spuit, infus, jarum, plester...)"
                                value={activeBmhpSearch[procIdx] || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setActiveBmhpSearch(prev => ({ ...prev, [procIdx]: val }));
                                }}
                                className="w-full text-xs p-1.5 border border-gray-300 focus:outline-none focus:border-amber-500"
                              />

                              <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                                {filteredBmhpOptions.length === 0 ? (
                                  <div className="p-2 text-center text-gray-400 text-[11px]">
                                    Tidak ada item BMHP yang cocok.
                                  </div>
                                ) : (
                                  filteredBmhpOptions.map((o: any) => (
                                    <div
                                      key={o.id}
                                      onClick={() => handleAddBmhpItem(procIdx, o)}
                                      className="p-1.5 hover:bg-amber-50 cursor-pointer flex justify-between items-center text-[11px]"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-800">{o.namaObat}</p>
                                        <p className="text-[10px] text-gray-400">
                                          Sediaan: {o.sediaan || '-'} | Stok: {o.stok ?? o.stokTotal ?? '-'}
                                        </p>
                                      </div>
                                      <span className="font-mono font-bold text-amber-800 text-[11px]">
                                        Rp {(Number(o.hargaJual || o.harga || o.hargaBeli) || 3000).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ringkasan Estimasi Biaya Seluruh Tindakan & BMHP UGD */}
      {selectedProsedur.length > 0 && (
        <div className="bg-slate-900 text-white p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-rose-400">
              Estimasi Masuk Billing Kasir:
            </span>
            <div className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap gap-x-4">
              <span>Jasa Tindakan: <strong>Rp {totalSummary.totalTindakan.toLocaleString('id-ID')}</strong></span>
              <span>Sewa Alkes: <strong>Rp {totalSummary.totalAlkes.toLocaleString('id-ID')}</strong></span>
              <span>BMHP Logistik: <strong>Rp {totalSummary.totalBmhp.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Biaya UGD</span>
            <span className="text-lg font-mono font-black text-emerald-400">
              Rp {totalSummary.grandTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
