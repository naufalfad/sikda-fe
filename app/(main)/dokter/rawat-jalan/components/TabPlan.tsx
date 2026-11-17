"use client";

import React, { Dispatch, SetStateAction, useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Syringe, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  Stethoscope, 
  Wrench, 
  Package, 
  TestTubes, 
  Radio, 
  FileText, 
  Sparkles, 
  Printer, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Building2,
  Building
} from 'lucide-react';
import { SOAPPayload, TindakanItem, BmhpTindakanItem, AlkesTindakanItem } from '@/types/rawatJalan.types';
import { icd9Service } from '@/services/icd9.service';
import { asetRuanganService } from '@/services/asetRuangan.service';
import { masterService } from '@/services/master.service';
import { AsetRuangan } from '@/types/asetRuangan.types';
import Swal from 'sweetalert2';
import OrderLabModal from './OrderLabModal';
import OrderRadiologiModal from './OrderRadiologiModal';
import CetakPengantarPenunjangModal from '@/components/penunjang/CetakPengantarPenunjangModal';
import { laboratoriumService } from '@/services/laboratorium.service';
import { radiologiService } from '@/services/radiologi.service';

interface TabPlanProps {
  soapData: SOAPPayload;
  setSoapData: Dispatch<SetStateAction<SOAPPayload>>;
  setActiveTab: (tab: string) => void;
  selectedProsedur: any[];
  setSelectedProsedur: Dispatch<SetStateAction<any[]>>;
  handleRemoveProsedur: (kode: string) => void;
  selectedKunjungan?: any;
  onOpenHasilLabModal?: () => void;
  orderLabData?: any;
  onRefreshOrderLab?: () => void;
  orderRadiologiList?: any[];
  onRefreshOrderRadiologi?: () => void;
}

export default function TabPlan({
  soapData,
  setSoapData,
  setActiveTab,
  selectedProsedur,
  setSelectedProsedur,
  handleRemoveProsedur,
  selectedKunjungan,
  onOpenHasilLabModal,
  orderLabData,
  onRefreshOrderLab,
  orderRadiologiList,
  onRefreshOrderRadiologi,
}: TabPlanProps) {
  // ─── Modal Order Penunjang State ───
  const [isOrderLabModalOpen, setIsOrderLabModalOpen] = useState(false);
  const [isOrderRadiologiModalOpen, setIsOrderRadiologiModalOpen] = useState(false);

  // ─── ICD-9 Search State ───
  const [searchTerm, setSearchTerm] = useState('');
  const [icd9Results, setIcd9Results] = useState<any[]>([]);
  const [isLoadingIcd9, setIsLoadingIcd9] = useState(false);
  const [isIcd9DropdownOpen, setIsIcd9DropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Master Alkes & BMHP ───
  const [availableAlkes, setAvailableAlkes] = useState<AsetRuangan[]>([]);
  const [availableBmhp, setAvailableBmhp] = useState<any[]>([]);
  const [isLoadingAlkes, setIsLoadingAlkes] = useState(false);

  // ─── Modal Cetak Surat Pengantar Penunjang Resmi (Lab & Radiologi Terintegrasi Order) ───
  const [isCetakPengantarModalOpen, setIsCetakPengantarModalOpen] = useState(false);
  const [cetakDefaultTab, setCetakDefaultTab] = useState<'LAB' | 'RADIOLOGI'>('LAB');

  // ─── Deteksi Otomatis Rujukan Keluar Faskes Berdasar Order Nyata ───
  const externalLabItems = useMemo(() => {
    return (orderLabData?.details || []).filter((d: any) => d.isRujukanLuar === true);
  }, [orderLabData]);

  const hasExternalLab = externalLabItems.length > 0;
  const hasExternalRadiologi = Boolean(
    orderRadiologiList && 
    orderRadiologiList.length > 0 && 
    orderRadiologiList[0]?.isRujukanLuar === true
  );
  const externalProcedures = useMemo(() => {
    return (selectedProsedur || []).filter(p => p.tipePelaksanaan === 'EKSTERNAL');
  }, [selectedProsedur]);
  const hasExternalProc = externalProcedures.length > 0;

  const hasAnyRujukan = hasExternalLab || hasExternalRadiologi || hasExternalProc;

  // ─── Reset / Batalkan Order Penunjang State & Handlers ───
  const [isDeletingLab, setIsDeletingLab] = useState(false);
  const [isDeletingRadiologi, setIsDeletingRadiologi] = useState(false);

  const handleResetOrderLab = async () => {
    if (!orderLabData) return;

    // Cek apakah status sudah diproses oleh analis
    if (['DIPROSES', 'SELESAI'].includes(orderLabData.status)) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak Dapat Dibatalkan',
        text: 'Permintaan lab ini sedang atau sudah selesai diproses oleh analis laboratorium dan tidak dapat dibatalkan.',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Batalkan Permintaan Lab?',
      text: 'Seluruh parameter uji laboratorium untuk kunjungan ini akan dibatalkan dan dihapus dari antrean laboratorium.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan Order',
      cancelButtonText: 'Kembali',
    });

    if (confirm.isConfirmed) {
      setIsDeletingLab(true);
      try {
        await laboratoriumService.deleteOrder(orderLabData.id || selectedKunjungan?.id);
        Swal.fire({
          icon: 'success',
          title: 'Order Dibatalkan',
          text: 'Permintaan laboratorium berhasil dibatalkan dan dihapus dari antrean.',
          timer: 1600,
          showConfirmButton: false,
        });
        if (onRefreshOrderLab) onRefreshOrderLab();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan Order',
          text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem saat membatalkan order.',
        });
      } finally {
        setIsDeletingLab(false);
      }
    }
  };

  const handleResetOrderRadiologi = async () => {
    const activeOrder = orderRadiologiList && orderRadiologiList.length > 0 ? orderRadiologiList[0] : null;
    if (!activeOrder) return;

    if (['IN_PROGRESS', 'COMPLETED'].includes(activeOrder.status)) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak Dapat Dibatalkan',
        text: 'Pemeriksaan radiologi ini sedang atau sudah selesai diproses dan tidak dapat dibatalkan.',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Batalkan Order Radiologi?',
      text: 'Seluruh permintaan foto radiologi untuk kunjungan ini akan dibatalkan dan dihapus dari antrean.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan Order',
      cancelButtonText: 'Kembali',
    });

    if (confirm.isConfirmed) {
      setIsDeletingRadiologi(true);
      try {
        await radiologiService.deleteOrder(activeOrder.id || selectedKunjungan?.id);
        Swal.fire({
          icon: 'success',
          title: 'Order Dibatalkan',
          text: 'Permintaan radiologi berhasil dibatalkan dan dihapus dari antrean.',
          timer: 1600,
          showConfirmButton: false,
        });
        if (onRefreshOrderRadiologi) onRefreshOrderRadiologi();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan Order',
          text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem saat membatalkan order.',
        });
      } finally {
        setIsDeletingRadiologi(false);
      }
    }
  };

  // Load active medical devices for procedure selection
  const fetchMasterData = async () => {
    setIsLoadingAlkes(true);
    try {
      const alkesData = await asetRuanganService.getAsets({ isAlkesTindakan: true });
      const freshAlkes = alkesData || [];
      setAvailableAlkes(freshAlkes);

      // Sinkronkan tarif alkes yang sudah terlanjur dipilih pada tindakan
      setSelectedProsedur(prevProsedur => {
        return prevProsedur.map(proc => {
          if (!proc.alkesDetails || proc.alkesDetails.length === 0) return proc;
          const updatedAlkes = proc.alkesDetails.map((a: any) => {
            const master = freshAlkes.find((m: any) => m.id === a.asetId);
            return master ? { ...a, tarifPemakaian: master.tarifPemakaian || 0, namaAset: master.namaAset } : a;
          });
          return { ...proc, alkesDetails: updatedAlkes };
        });
      });

      const obatData = await masterService.getObat();
      const rawObat = obatData?.data || obatData || [];
      // Filter BMHP items or supplies
      const bmhpFiltered = rawObat.filter((o: any) => 
        (o.kategori && o.kategori.toUpperCase().includes('BMHP')) ||
        (o.sediaan && ['Spuit', 'Kasa', 'Jarum', 'Plester', 'Benang', 'Infus', 'Ampul', 'Vial', 'Pcs'].some(s => o.sediaan.includes(s))) ||
        ['spuit', 'kasa', 'jarum', 'lidocaine', 'benang', 'infus', 'abocath', 'catheter', 'masker'].some(k => (o.namaObat || '').toLowerCase().includes(k))
      );
      setAvailableBmhp(bmhpFiltered.length > 0 ? bmhpFiltered : rawObat.slice(0, 30));
    } catch (err) {
      console.error('Failed to load master alkes/bmhp:', err);
    } finally {
      setIsLoadingAlkes(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, [selectedKunjungan?.id]);

  // Fetch ICD-9 procedures
  const fetchICD9 = async (term: string = '') => {
    setIsLoadingIcd9(true);
    try {
      const res = await icd9Service.search(term);
      const data = res?.data || res || [];
      // Saring agar tindakan diagnostik radiologi murni (87.xx) & lab murni (90.xx) diberi penanda jelas
      setIcd9Results(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching ICD-9:', err);
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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsIcd9DropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select ICD-9 and auto-apply intelligent smart preset
  const handleSelectICD9 = (item: any) => {
    const exists = selectedProsedur.some(
      (p) => p.kode_icd9 === item.kode_icd9 || p.id_icd9 === item.id_icd9 || p.icd9Id === item.id_icd9
    );
    if (exists) {
      Swal.fire({
        icon: 'info',
        title: 'Tindakan Sudah Terpilih',
        text: `Prosedur ${item.nama_prosedur} sudah ada dalam daftar rencana tindakan.`,
        timer: 1600,
        showConfirmButton: false,
      });
      return;
    }

    const namaLower = (item.nama_prosedur || '').toLowerCase();
    const kode = item.kode_icd9 || '';

    // Deteksi jika ini adalah prosedur penunjang Radiologi (87.xx, 88.xx) atau Lab (90.xx, 91.xx)
    if (kode.startsWith('87.') || kode.startsWith('88.') || kode.startsWith('90.') || kode.startsWith('91.')) {
      Swal.fire({
        icon: 'question',
        title: 'Pemeriksaan Penunjang / Diagnostik',
        html: `
          <div class="text-left text-xs text-slate-700 space-y-2.5">
            <p>Prosedur <strong>${kode}</strong> - <em>${item.nama_prosedur}</em> merupakan pemeriksaan diagnostik penunjang.</p>
            <p class="font-bold text-slate-800">Tentukan lokasi pelaksanaannya:</p>
            <div class="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-950">
              <strong>Pelaksanaan Internal:</strong> Jika faskes memiliki fasilitas sendiri. Pasien akan dikenakan tarif tindakan, alat, & BMHP internal di kasir.
            </div>
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950">
              <strong>Rujukan Eksternal (Rp 0):</strong> Jika faskes belum memadai dan pasien dirujuk ke faskes luar (RSUD/Labkesda). Pasien <strong>tidak dikenakan biaya (Rp 0)</strong> di faskes ini dan surat pengantar rujukan dapat dicetak.
            </div>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Dikerjakan Internal',
        denyButtonText: 'Rujuk Eksternal (Rp 0)',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#4f46e5',
        denyButtonColor: '#059669',
      }).then((result) => {
        if (result.isConfirmed) {
          addProcedureItem(item, [], [], 'INTERNAL');
          setIsIcd9DropdownOpen(false);
          setSearchTerm('');
        } else if (result.isDenied) {
          addProcedureItem(item, [], [], 'EKSTERNAL');
          setIsIcd9DropdownOpen(false);
          setSearchTerm('');
        }
      });
      return;
    }

    // 1. Prioritas: Ambil dari Paket Template Master ICD-9 jika sudah dikonfigurasi di Master Data
    let presetAlkes: AlkesTindakanItem[] = [];
    let presetBmhpRaw: BmhpTindakanItem[] = [];

    if (Array.isArray(item.templateAlkes) && item.templateAlkes.length > 0) {
      presetAlkes = item.templateAlkes.map((a: any) => ({
        asetId: a.asetId,
        namaAset: a.namaAset,
        kodeAset: a.kodeAset,
        tarifPemakaian: (a.tarifPemakaian !== undefined && a.tarifPemakaian !== null) ? Number(a.tarifPemakaian) : 0,
      }));
    }

    if (Array.isArray(item.templateBmhp) && item.templateBmhp.length > 0) {
      presetBmhpRaw = item.templateBmhp.map((b: any) => {
        const qty = Number(b.jumlah) || 1;
        const harga = Number(b.hargaSatuan) || 0;
        return {
          obatId: b.obatId,
          namaItem: b.namaItem,
          sediaan: b.sediaan || 'Pcs',
          jumlah: qty,
          hargaSatuan: harga,
          subTotal: harga * qty,
        };
      });
    }

    // 2. Fallback smart preset jika belum dikonfigurasi secara kustom di Master Data
    if (presetAlkes.length === 0 && presetBmhpRaw.length === 0) {
      // Helper resolusi item BMHP langsung ke ID database master
      const resolveBmhp = (kode: string, fallback: BmhpTindakanItem): BmhpTindakanItem => {
        const match = availableBmhp.find((b: any) => 
          (b.kodeObat && b.kodeObat === kode) ||
          (b.namaObat && b.namaObat.toLowerCase().includes(fallback.namaItem.toLowerCase().slice(0, 12)))
        );
        if (match) {
          const harga = Number(match.harga) || fallback.hargaSatuan;
          return {
            obatId: match.id,
            namaItem: match.namaObat,
            sediaan: match.sediaan || fallback.sediaan,
            jumlah: fallback.jumlah,
            hargaSatuan: harga,
            subTotal: harga * fallback.jumlah,
          };
        }
        return fallback;
      };

      if (namaLower.includes('jahit') || namaLower.includes('suture') || namaLower.includes('hecting') || namaLower.includes('luka')) {
        const minorSet = availableAlkes.find(a => a.namaAset.toLowerCase().includes('minor') || a.namaAset.toLowerCase().includes('jahit'));
        if (minorSet) {
          presetAlkes.push({
            asetId: minorSet.id,
            namaAset: minorSet.namaAset,
            kodeAset: minorSet.kodeAset,
            tarifPemakaian: (minorSet.tarifPemakaian !== undefined && minorSet.tarifPemakaian !== null) ? Number(minorSet.tarifPemakaian) : 15000,
          });
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-SPU-3CC', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000, subTotal: 3000 }),
          resolveBmhp('BMHP-LID-2', { obatId: 'BMHP-LID-2', namaItem: 'Lidocaine HCl 2% Ampul', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 5000, subTotal: 5000 }),
          resolveBmhp('BMHP-BNG-SLK', { obatId: 'BMHP-BNG-SLK', namaItem: 'Benang Jahit Silk 3-0 with Needle', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 12000, subTotal: 12000 }),
          resolveBmhp('BMHP-KSA-STR', { obatId: 'BMHP-KSA-STR', namaItem: 'Kasa Steril 16x16', sediaan: 'Lembar', jumlah: 2, hargaSatuan: 2000, subTotal: 4000 }),
          resolveBmhp('BMHP-PVI-60ML', { obatId: 'BMHP-PVI-60ML', namaItem: 'Povidone Iodine 10%', sediaan: 'Botol', jumlah: 1, hargaSatuan: 8000, subTotal: 8000 }),
        ];
      } else if (namaLower.includes('nebul') || namaLower.includes('inhalasi')) {
        const nebMachine = availableAlkes.find(a => a.namaAset.toLowerCase().includes('nebul'));
        if (nebMachine) {
          presetAlkes.push({
            asetId: nebMachine.id,
            namaAset: nebMachine.namaAset,
            kodeAset: nebMachine.kodeAset,
            tarifPemakaian: (nebMachine.tarifPemakaian !== undefined && nebMachine.tarifPemakaian !== null) ? Number(nebMachine.tarifPemakaian) : 20000,
          });
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-MSK-NEB', { obatId: 'BMHP-MSK-NEB', namaItem: 'Masker Nebulizer Dewasa Kit', sediaan: 'Set', jumlah: 1, hargaSatuan: 15000, subTotal: 15000 }),
        ];
      } else if (namaLower.includes('ekg') || namaLower.includes('elektrokardiograf')) {
        const ekgMachine = availableAlkes.find(a => a.namaAset.toLowerCase().includes('ekg'));
        if (ekgMachine) {
          presetAlkes.push({
            asetId: ekgMachine.id,
            namaAset: ekgMachine.namaAset,
            kodeAset: ekgMachine.kodeAset,
            tarifPemakaian: (ekgMachine.tarifPemakaian !== undefined && ekgMachine.tarifPemakaian !== null) ? Number(ekgMachine.tarifPemakaian) : 30000,
          });
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-KTS-EKG', { obatId: 'BMHP-KTS-EKG', namaItem: 'Kertas Thermal EKG & Gel', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000, subTotal: 10000 }),
        ];
      } else if (namaLower.includes('infus') || namaLower.includes('38.93') || namaLower.includes('intravena')) {
        const infMachine = availableAlkes.find(a => a.namaAset.toLowerCase().includes('infusion pump'));
        if (infMachine) {
          presetAlkes.push({
            asetId: infMachine.id,
            namaAset: infMachine.namaAset,
            kodeAset: infMachine.kodeAset,
            tarifPemakaian: Number(infMachine.tarifPemakaian) || 25000,
          });
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-INF-SET', { obatId: 'BMHP-INF-SET', namaItem: 'Infus Set Dewasa Makro', sediaan: 'Set', jumlah: 1, hargaSatuan: 10000, subTotal: 10000 }),
          resolveBmhp('BMHP-ABO-20G', { obatId: 'BMHP-ABO-20G', namaItem: 'Abocath / IV Catheter 20G', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 8000, subTotal: 8000 }),
          resolveBmhp('BMHP-CRL-500', { obatId: 'BMHP-CRL-500', namaItem: 'Cairan Ringer Lactate 500ml', sediaan: 'Kolf', jumlah: 1, hargaSatuan: 12000, subTotal: 12000 }),
          resolveBmhp('BMHP-PLS-MED', { obatId: 'BMHP-PLS-MED', namaItem: 'Plester Hipafix Medis', sediaan: 'Roll', jumlah: 1, hargaSatuan: 12000, subTotal: 12000 }),
          resolveBmhp('BMHP-ALK-SWB', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 2, hargaSatuan: 1000, subTotal: 2000 }),
        ];
      } else if (namaLower.includes('gigi') || namaLower.includes('dental') || namaLower.includes('cabut') || namaLower.includes('tambal') || namaLower.includes('scaler')) {
        const dentalChair = availableAlkes.find(a => a.namaAset.toLowerCase().includes('dental chair'));
        if (dentalChair) {
          presetAlkes.push({
            asetId: dentalChair.id,
            namaAset: dentalChair.namaAset,
            kodeAset: dentalChair.kodeAset,
            tarifPemakaian: Number(dentalChair.tarifPemakaian) || 25000,
          });
        }
        if (namaLower.includes('scaler') || namaLower.includes('karang')) {
          const scaler = availableAlkes.find(a => a.namaAset.toLowerCase().includes('scaler'));
          if (scaler) {
            presetAlkes.push({
              asetId: scaler.id,
              namaAset: scaler.namaAset,
              kodeAset: scaler.kodeAset,
              tarifPemakaian: Number(scaler.tarifPemakaian) || 20000,
            });
          }
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-LID-ADR', { obatId: 'BMHP-LID-ADR', namaItem: 'Pehacain Dental Ampul', sediaan: 'Ampul', jumlah: 1, hargaSatuan: 7500, subTotal: 7500 }),
          resolveBmhp('BMHP-NDL-27G', { obatId: 'BMHP-NDL-27G', namaItem: 'Jarum Dental 27G', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 2000, subTotal: 2000 }),
          resolveBmhp('BMHP-DNT-COT', { obatId: 'BMHP-DNT-COT', namaItem: 'Cotton Roll Gigi Steril', sediaan: 'Pcs', jumlah: 2, hargaSatuan: 1000, subTotal: 2000 }),
        ];
      } else if (namaLower.includes('iud') || namaLower.includes('implan') || namaLower.includes('anc') || namaLower.includes('kb')) {
        const doppler = availableAlkes.find(a => a.namaAset.toLowerCase().includes('doppler'));
        if (doppler) {
          presetAlkes.push({
            asetId: doppler.id,
            namaAset: doppler.namaAset,
            kodeAset: doppler.kodeAset,
            tarifPemakaian: Number(doppler.tarifPemakaian) || 15000,
          });
        }
        presetBmhpRaw = [
          resolveBmhp('BMHP-GLV-ST-70', { obatId: 'BMHP-GLV-ST-70', namaItem: 'Handscoon Steril No 7.0', sediaan: 'Pasang', jumlah: 1, hargaSatuan: 7000, subTotal: 7000 }),
          resolveBmhp('BMHP-KSA-STR', { obatId: 'BMHP-KSA-STR', namaItem: 'Kasa Steril 16x16', sediaan: 'Lembar', jumlah: 2, hargaSatuan: 2000, subTotal: 4000 }),
        ];
      } else if (namaLower.includes('injeksi') || namaLower.includes('suntik')) {
        presetBmhpRaw = [
          resolveBmhp('BMHP-SPU-3CC', { obatId: 'BMHP-SPU-3CC', namaItem: 'Spuit 3cc Disposable', sediaan: 'Pcs', jumlah: 1, hargaSatuan: 3000, subTotal: 3000 }),
          resolveBmhp('BMHP-ALK-SWB', { obatId: 'BMHP-ALK-SWB', namaItem: 'Alcohol Swab Antiseptik', sediaan: 'Sachet', jumlah: 1, hargaSatuan: 1000, subTotal: 1000 }),
        ];
      }
    }

    addProcedureItem(item, presetAlkes, presetBmhpRaw);
    setIsIcd9DropdownOpen(false);
    setSearchTerm('');

    // Rekomendasi penunjang diagnostik terhubung dari template master
    if (Array.isArray(item.templatePenunjang) && item.templatePenunjang.length > 0) {
      const penunjangList = item.templatePenunjang.map((p: any) => `• [${p.jenis}] <strong>${p.nama}</strong>${p.catatan ? ` <em>(${p.catatan})</em>` : ''}`).join('<br/>');
      Swal.fire({
        icon: 'info',
        title: 'Rekomendasi Penunjang Terintegrasi',
        html: `
          <div class="text-left text-xs text-slate-700 space-y-2">
            <p>Prosedur <strong>${item.nama_prosedur}</strong> memiliki rekomendasi pemeriksaan diagnostik terhubung:</p>
            <div class="p-2.5 bg-purple-50 border border-purple-200 text-purple-900 leading-relaxed">
              ${penunjangList}
            </div>
            <p class="text-slate-500 text-[11px]">Silakan buka modal <strong>Order Lab</strong> atau <strong>Order Radiologi</strong> di samping jika ingin melakukan order pemeriksaan di atas.</p>
          </div>
        `,
        timer: 4500,
        showConfirmButton: true,
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#0d9488'
      });
    }
  };

  const addProcedureItem = (
    item: any,
    alkes: AlkesTindakanItem[] = [],
    bmhp: BmhpTindakanItem[] = [],
    tipePelaksanaan: 'INTERNAL' | 'EKSTERNAL' = 'INTERNAL'
  ) => {
    setSelectedProsedur([
      ...selectedProsedur,
      {
        id_icd9: item.id_icd9,
        icd9Id: item.id_icd9,
        kode_icd9: item.kode_icd9,
        nama_prosedur: item.nama_prosedur,
        pelaksana: tipePelaksanaan === 'EKSTERNAL' ? 'Rujukan Luar' : 'Dokter',
        catatan: '',
        tipePelaksanaan,
        tarifTindakan: Number(item.tarifTindakan) || 0,
        templatePenunjang: item.templatePenunjang || [],
        faskesRujukan: tipePelaksanaan === 'EKSTERNAL' ? 'RSUD Kabupaten / Lab Rujukan Rekanan' : '',
        alasanRujukan: '',
        alkesDetails: tipePelaksanaan === 'EKSTERNAL' ? [] : alkes,
        bmhpDetails: tipePelaksanaan === 'EKSTERNAL' ? [] : bmhp,
      }
    ]);
  };

  // Toggle tipe pelaksanaan tindakan: Internal vs Rujukan Eksternal
  const handleToggleTipePelaksanaan = (procIndex: number, tipe: 'INTERNAL' | 'EKSTERNAL') => {
    const updated = [...selectedProsedur];
    updated[procIndex].tipePelaksanaan = tipe;
    if (tipe === 'EKSTERNAL') {
      if (!updated[procIndex].faskesRujukan) {
        updated[procIndex].faskesRujukan = 'RSUD Kabupaten / Lab Rujukan Rekanan';
      }
      updated[procIndex].pelaksana = 'Rujukan Luar';
    } else {
      if (updated[procIndex].pelaksana === 'Rujukan Luar') {
        updated[procIndex].pelaksana = 'Dokter';
      }
    }
    setSelectedProsedur(updated);
  };

  const handleUpdateRujukanProc = (procIndex: number, field: string, value: string) => {
    const updated = [...selectedProsedur];
    updated[procIndex][field] = value;
    setSelectedProsedur(updated);
  };

  // Toggle Alat Kesehatan pada tindakan tertentu
  const handleToggleAlkes = (procIndex: number, alkes: AsetRuangan) => {
    const newProsedur = [...selectedProsedur];
    const proc = newProsedur[procIndex];
    const currentAlkes: AlkesTindakanItem[] = Array.isArray(proc.alkesDetails) ? proc.alkesDetails : [];

    const existingIndex = currentAlkes.findIndex(a => a.asetId === alkes.id);
    if (existingIndex >= 0) {
      currentAlkes.splice(existingIndex, 1);
    } else {
      currentAlkes.push({
        asetId: alkes.id,
        namaAset: alkes.namaAset,
        kodeAset: alkes.kodeAset,
        tarifPemakaian: alkes.tarifPemakaian || 0,
      });
    }

    proc.alkesDetails = [...currentAlkes];
    setSelectedProsedur(newProsedur);
  };

  // Tambah BMHP manual pada tindakan tertentu
  const handleAddBmhpItem = (procIndex: number, obat: any) => {
    const newProsedur = [...selectedProsedur];
    const proc = newProsedur[procIndex];
    const currentBmhp: BmhpTindakanItem[] = Array.isArray(proc.bmhpDetails) ? proc.bmhpDetails : [];

    const existing = currentBmhp.find(b => b.obatId === obat.id || b.namaItem === obat.namaObat);
    if (existing) {
      existing.jumlah += 1;
      existing.subTotal = existing.jumlah * existing.hargaSatuan;
    } else {
      const harga = Number(obat.harga) || 3000;
      currentBmhp.push({
        obatId: obat.id,
        namaItem: obat.namaObat,
        sediaan: obat.sediaan || 'Pcs',
        jumlah: 1,
        hargaSatuan: harga,
        subTotal: harga,
      });
    }

    proc.bmhpDetails = [...currentBmhp];
    setSelectedProsedur(newProsedur);
  };

  // Ubah kuantiti BMHP
  const handleUpdateBmhpQty = (procIndex: number, bmhpIndex: number, qty: number) => {
    const newProsedur = [...selectedProsedur];
    const proc = newProsedur[procIndex];
    if (qty <= 0) {
      proc.bmhpDetails.splice(bmhpIndex, 1);
    } else {
      proc.bmhpDetails[bmhpIndex].jumlah = qty;
      proc.bmhpDetails[bmhpIndex].subTotal = qty * proc.bmhpDetails[bmhpIndex].hargaSatuan;
    }
    setSelectedProsedur(newProsedur);
  };

  // Hapus BMHP
  const handleRemoveBmhpItem = (procIndex: number, bmhpIndex: number) => {
    const newProsedur = [...selectedProsedur];
    newProsedur[procIndex].bmhpDetails.splice(bmhpIndex, 1);
    setSelectedProsedur(newProsedur);
  };

  // Kalkulasi total perkiraan biaya tindakan (hanya tindakan INTERNAL)
  const totalEstimasiTindakan = useMemo(() => {
    return selectedProsedur.reduce((acc, p) => {
      if (p.tipePelaksanaan === 'EKSTERNAL') return acc;
      let jasa = 50000; // Standar jasa tindakan internal
      let alkesTotal = (p.alkesDetails || []).reduce((sum: number, a: any) => sum + (Number(a.tarifPemakaian) || 0), 0);
      let bmhpTotal = (p.bmhpDetails || []).reduce((sum: number, b: any) => sum + (Number(b.subTotal) || 0), 0);
      return acc + jasa + alkesTotal + bmhpTotal;
    }, 0);
  }, [selectedProsedur]);

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50/50">
      
      {/* ─── HEADER SECTION ─── */}
      <div className="bg-white p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              P - Plan (Rencana Penanganan & Prosedur Medis)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Edukasi klinis, prosedur tindakan fisik (ICD-9), penggunaan alkes & BMHP, serta pemeriksaan penunjang.
            </p>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('SOAP_A')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            &larr; Kembali ke Asesmen
          </button>
        </div>
      </div>

      {/* ─── BAGIAN 1: RENCANA TERAPI & EDUKASI PASIEN ─── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          1. Rencana Terapi Medis & Edukasi Pasien
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Rencana Terapi / Intervensi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Rencana Terapi Medis / Protokol Penanganan
            </label>
            <textarea
              rows={3}
              value={soapData.rencanaTerapi || ''}
              onChange={(e) => setSoapData({ ...soapData, rencanaTerapi: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-900 transition-all placeholder:text-slate-400"
              placeholder="Contoh: Rencana pembersihan luka dan jahit sederhana, hidrasi oral bertahap, observasi suhu..."
            />
          </div>

          {/* Instruksi Medis / Edukasi Pasien */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Instruksi Medis & Edukasi Pasien
            </label>
            <textarea
              rows={3}
              value={soapData.instruksiMedis || ''}
              onChange={(e) => setSoapData({ ...soapData, instruksiMedis: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-900 transition-all placeholder:text-slate-400"
              placeholder="Contoh: Jaga luka tetap kering selama 3 hari, kontrol kembali jika demam > 38.5°C atau nyeri bertambah..."
            />
          </div>
        </div>

        {/* Target Perawatan (SATUSEHAT FHIR Goal) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Target Pengobatan Pasien (FHIR Goal SATUSEHAT)
          </label>
          <input
            type="text"
            value={soapData.tujuanPerawatan || ''}
            onChange={(e) => setSoapData({ ...soapData, tujuanPerawatan: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 transition-all placeholder:text-slate-400"
            placeholder="Contoh: Tekanan darah terkontrol < 130/80 mmHg dalam 2 minggu, luka menutup sempurna tanpa infeksi sekunder"
          />
        </div>
      </div>

      {/* ─── BAGIAN 2: TINDAKAN MEDIS (ICD-9) DENGAN INTEGRASI ALKES & BMHP ─── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Syringe className="w-4 h-4 text-blue-600" />
              2. Tindakan Medis (ICD-9) Terintegrasi Alkes & BMHP
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih tindakan medis fisik. Setiap tindakan dapat dikaitkan dengan alat kesehatan & bahan habis pakai yang dipotong otomatis dari stok logistik faskes.
            </p>
          </div>

          {selectedProsedur.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedProsedur.some(p => p.tipePelaksanaan === 'EKSTERNAL') && (
                <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedProsedur.filter(p => p.tipePelaksanaan === 'EKSTERNAL').length} Rujukan Eksternal (Bebas Biaya Rp 0)</span>
                </div>
              )}
              <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 flex items-center gap-2">
                <span className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider">
                  Estimasi Billing Faskes:
                </span>
                <span className="text-xs font-black text-indigo-900 font-mono">
                  Rp {totalEstimasiTindakan.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Pencarian ICD-9 Cepat */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Cari & Tambah Prosedur Tindakan Medis (ICD-9-CM)
          </label>

          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsIcd9DropdownOpen(true);
              }}
              onFocus={() => {
                setIsIcd9DropdownOpen(true);
                if (icd9Results.length === 0) fetchICD9('');
              }}
              placeholder="Ketik nama atau kode tindakan (contoh: Jahit Luka, 86.59, Nebulisasi, 93.94, EKG, 89.52)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-900 shadow-sm"
            />
            <div className="absolute left-3.5 pointer-events-none text-slate-400">
              {isLoadingIcd9 ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchICD9('');
                }}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Pencarian ICD-9 */}
          {isIcd9DropdownOpen && (
            <div className="absolute z-40 w-full mt-1.5 bg-white border border-indigo-200 shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex justify-between items-center text-xs text-slate-600 sticky top-0 z-10 backdrop-blur-sm">
                <span className="font-bold flex items-center gap-1.5">
                  {isLoadingIcd9 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Memuat data ICD-9...
                    </>
                  ) : (
                    `Ditemukan ${icd9Results.length} tindakan ICD-9`
                  )}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Klik baris untuk memilih & pasang preset
                </span>
              </div>

              {isLoadingIcd9 && icd9Results.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Mencari master tindakan...</span>
                </div>
              ) : icd9Results.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ditemukan tindakan medis yang cocok dengan &quot;{searchTerm}&quot;.
                </div>
              ) : (
                icd9Results.map((item, idx) => {
                  const isSelected = selectedProsedur.some(
                    (p) => p.kode_icd9 === item.kode_icd9 || p.id_icd9 === item.id_icd9 || p.icd9Id === item.id_icd9
                  );
                  const isPenunjang = (item.kode_icd9 || '').startsWith('87.') || (item.kode_icd9 || '').startsWith('90.');

                  return (
                    <div
                      key={item.id_icd9 || idx}
                      onClick={() => !isSelected && handleSelectICD9(item)}
                      className={`px-4 py-3 hover:bg-indigo-50/60 cursor-pointer flex justify-between items-center transition-colors ${
                        isSelected ? 'bg-indigo-50/30 opacity-60 cursor-default' : ''
                      }`}
                    >
                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-bold border border-indigo-200">
                            {item.kode_icd9}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.nama_prosedur}
                          </span>
                          {isPenunjang && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 border border-amber-200">
                              Penunjang Lab/Rad
                            </span>
                          )}
                        </div>
                        {item.kategori && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Kategori: {item.kategori}
                          </p>
                        )}
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                            <Check className="w-3.5 h-3.5" />
                            Terpilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-2.5 py-1 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Pilih
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Daftar Tindakan yang Terpilih */}
        {selectedProsedur.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <Syringe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Belum ada tindakan medis yang ditambahkan pada kunjungan ini.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan kolom pencarian di atas untuk menambahkan prosedur fisik seperti jahit luka, injeksi, nebulisasi, atau EKG.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {selectedProsedur.map((proc, pIdx) => {
              const procAlkes: AlkesTindakanItem[] = Array.isArray(proc.alkesDetails) ? proc.alkesDetails : [];
              const procBmhp: BmhpTindakanItem[] = Array.isArray(proc.bmhpDetails) ? proc.bmhpDetails : [];

              const totalAlkes = procAlkes.reduce((sum, a) => sum + (Number(a.tarifPemakaian) || 0), 0);
              const totalBmhp = procBmhp.reduce((sum, b) => sum + (Number(b.subTotal) || 0), 0);
              const subtotalItem = 50000 + totalAlkes + totalBmhp;

              return (
                <div
                  key={proc.kode_icd9 || pIdx}
                  className={`border shadow-sm overflow-hidden transition-all ${
                    proc.tipePelaksanaan === 'EKSTERNAL'
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Tindakan Header */}
                  <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                    proc.tipePelaksanaan === 'EKSTERNAL' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-100/80 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono px-2 py-0.5 text-xs font-black shadow-sm ${
                        proc.tipePelaksanaan === 'EKSTERNAL' ? 'bg-emerald-700 text-white' : 'bg-indigo-700 text-white'
                      }`}>
                        {proc.kode_icd9}
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {proc.nama_prosedur}
                        </h5>
                        {proc.tipePelaksanaan === 'EKSTERNAL' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 border border-emerald-300 inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-emerald-700" />
                            <span>Prosedur Rujukan Eksternal</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Segmented Button: INTERNAL vs EKSTERNAL */}
                      <div className="inline-flex rounded-sm p-0.5 bg-slate-200/90 border border-slate-300">
                        <button
                          type="button"
                          onClick={() => handleToggleTipePelaksanaan(pIdx, 'INTERNAL')}
                          className={`px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                            proc.tipePelaksanaan !== 'EKSTERNAL'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Internal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTipePelaksanaan(pIdx, 'EKSTERNAL')}
                          className={`px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                            proc.tipePelaksanaan === 'EKSTERNAL'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Rujuk Luar (Rp 0)</span>
                        </button>
                      </div>

                      {/* Pelaksana (only for Internal) */}
                      {proc.tipePelaksanaan !== 'EKSTERNAL' && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-500">Pelaksana:</span>
                          <select
                            value={proc.pelaksana || 'Dokter'}
                            onChange={(e) => {
                              const updated = [...selectedProsedur];
                              updated[pIdx].pelaksana = e.target.value;
                              setSelectedProsedur(updated);
                            }}
                            className="bg-white border border-slate-300 text-xs py-1 px-2 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Dokter">Dokter</option>
                            <option value="Perawat">Perawat</option>
                            <option value="Bidan">Bidan</option>
                          </select>
                        </div>
                      )}

                      {/* Subtotal Badge */}
                      {proc.tipePelaksanaan === 'EKSTERNAL' ? (
                        <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-1 border border-emerald-300 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Rp 0 (Bebas Tarif)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 border border-slate-300 font-mono">
                          Subtotal: Rp {subtotalItem.toLocaleString('id-ID')}
                        </span>
                      )}

                      {/* Hapus Prosedur */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProsedur(proc.kode_icd9)}
                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 transition-colors"
                        title="Hapus Tindakan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tindakan Body */}
                  {proc.tipePelaksanaan === 'EKSTERNAL' ? (
                    <div className="p-5 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-slate-50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-emerald-200">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-emerald-950">
                              Pemeriksaan Penunjang Dirujuk ke Faskes Eksternal
                            </h6>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Fasilitas internal belum memadai. Tindakan ini <strong>tidak dikenakan tarif jasa, sewa alat, maupun BMHP (Rp 0)</strong> di kasir faskes ini.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const isLab = (proc.kode_icd9 || '').startsWith('90.') || (proc.kode_icd9 || '').startsWith('91.');
                            setCetakDefaultTab(isLab ? 'LAB' : 'RADIOLOGI');
                            setIsCetakPengantarModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak Surat Pengantar Rujukan
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Faskes Rujukan Tujuan *
                          </label>
                          <input
                            type="text"
                            value={proc.faskesRujukan || ''}
                            onChange={(e) => handleUpdateRujukanProc(pIdx, 'faskesRujukan', e.target.value)}
                            placeholder="Contoh: Instalasi Radiologi RSUD Cibinong / Labkesda"
                            className="w-full p-2 bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:ring-1 focus:ring-emerald-500"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['RSUD Kabupaten', 'Labkesda', 'Lab Kimia Farma / Pramita', 'RS Hermina'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleUpdateRujukanProc(pIdx, 'faskesRujukan', opt)}
                                className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-600 font-medium"
                              >
                                + {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Alasan Klinis / Diagnosa Kerja Rujukan *
                          </label>
                          <input
                            type="text"
                            value={proc.alasanRujukan || ''}
                            onChange={(e) => handleUpdateRujukanProc(pIdx, 'alasanRujukan', e.target.value)}
                            placeholder="Contoh: Batuk berdahak > 2 minggu, curiga KP / Evaluasi Fraktur"
                            className="w-full p-2 bg-white border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Catatan Tambahan untuk Petugas / Berkas RME
                        </label>
                        <input
                          type="text"
                          value={proc.catatan || ''}
                          onChange={(e) => {
                            const updated = [...selectedProsedur];
                            updated[pIdx].catatan = e.target.value;
                            setSelectedProsedur(updated);
                          }}
                          placeholder="Contoh: Bawa hasil foto kembali saat kunjungan kontrol berikutnya"
                          className="w-full p-2 bg-white border border-slate-300 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Tindakan Body: Sub-Grid Alkes & BMHP (Internal) */
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                      
                      {/* KOLOM KIRI: ALAT KESEHATAN (NON-BMHP) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                            Pemakaian Alat Kesehatan (Tarif Sewa Alat)
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fetchMasterData()}
                              disabled={isLoadingAlkes}
                              className="text-[10px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 transition"
                              title="Sinkronkan data & tarif alkes terbaru dari master aset"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingAlkes ? 'animate-spin' : ''}`} />
                              Sync Tarif
                            </button>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {procAlkes.length} dipilih
                            </span>
                          </div>
                        </div>

                        {availableAlkes.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Tidak ada alat kesehatan aktif yang terdata di master aset.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                            {availableAlkes.map((alkes) => {
                              const isSelected = procAlkes.some(a => a.asetId === alkes.id);
                              return (
                                <button
                                  key={alkes.id}
                                  type="button"
                                  onClick={() => handleToggleAlkes(pIdx, alkes)}
                                  className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">
                                      {alkes.namaAset}
                                    </p>
                                    <p className="text-[10px] text-indigo-700 font-mono font-semibold">
                                      Tarif: Rp {(alkes.tarifPemakaian || 0).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-indigo-700 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* KOLOM KANAN: BMHP (BAHAN MEDIS HABIS PAKAI) */}
                      <div className="lg:pl-6 space-y-3 pt-4 lg:pt-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            Penggunaan BMHP (Potong Stok Logistik)
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {procBmhp.length} item BMHP
                          </span>
                        </div>

                        {/* List BMHP Terpakai */}
                        {procBmhp.length === 0 ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 text-center text-xs text-slate-400 italic">
                            Belum ada BMHP yang dicatat untuk tindakan ini.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {procBmhp.map((b, bIdx) => (
                              <div
                                key={b.obatId || bIdx}
                                className="bg-emerald-50/40 border border-emerald-200 p-2 text-xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 truncate">{b.namaItem}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    @ Rp {b.hargaSatuan.toLocaleString('id-ID')} | Subtotal: Rp {b.subTotal.toLocaleString('id-ID')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBmhpQty(pIdx, bIdx, b.jumlah - 1)}
                                    className="w-6 h-6 bg-white border border-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 text-slate-700"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold font-mono text-slate-900">
                                    {b.jumlah}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBmhpQty(pIdx, bIdx, b.jumlah + 1)}
                                    className="w-6 h-6 bg-white border border-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 text-slate-700"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBmhpItem(pIdx, bIdx)}
                                    className="text-rose-500 hover:text-rose-700 p-1 ml-1"
                                    title="Hapus BMHP"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dropdown Cepat Tambah BMHP */}
                        <div className="pt-1">
                          <select
                            className="w-full bg-white border border-slate-300 text-xs py-1.5 px-3 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const found = availableBmhp.find(o => o.id === e.target.value);
                              if (found) handleAddBmhpItem(pIdx, found);
                              e.target.value = '';
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>+ Tambah Item BMHP dari Stok Farmasi...</option>
                            {availableBmhp.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.namaObat} ({item.sediaan || 'unit'}) — Rp {(Number(item.harga) || 3000).toLocaleString('id-ID')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── BAGIAN 3: PEMERIKSAAN PENUNJANG (LAB & RADIOLOGI) ─── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="border-b pb-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <TestTubes className="w-4 h-4 text-amber-600" />
            3. Rencana Pemeriksaan Penunjang (Laboratorium & Radiologi)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih dan buat order pemeriksaan laboratorium terstandar atau order radiologi LOINC SATUSEHAT langsung dari lembar pemeriksaan.
          </p>
        </div>

        {/* ─── PENGATURAN RUJUKAN KELUAR FASKES / STATUS DETEKSI RUJUKAN OTOMATIS ─── */}
        {hasAnyRujukan ? (
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-amber-50/70 border-2 border-indigo-300 shadow-sm p-4 sm:p-5 animate-in fade-in duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-200 pb-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-600 text-white shadow-sm shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
                      Rujukan Keluar Faskes Terdeteksi Otomatis
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 shadow-2xs">
                      Order Siap Dicetak
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900/80 mt-0.5">
                    Pemeriksaan eksternal otomatis terdeteksi dari order yang Anda pilih. Surat pengantar rujukan resmi ter-generate otomatis lengkap dengan daftar pemeriksaan tanpa perlu input manual.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCetakDefaultTab(hasExternalLab ? 'LAB' : 'RADIOLOGI');
                    setIsCetakPengantarModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
                  title="Buka Lembar Cetak Surat Pengantar Rujukan Resmi Lengkap"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat Pengantar Rujukan Lengkap</span>
                </button>
              </div>
            </div>

            {/* Rincian Order yang Terdeteksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* 1. Radiologi Eksternal */}
              {hasExternalRadiologi && (
                <div className="bg-white p-3 border border-purple-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-purple-600" />
                      Radiologi LOINC ({orderRadiologiList?.[0]?.details?.length || 0} Foto)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCetakDefaultTab('RADIOLOGI');
                        setIsCetakPengantarModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-0.5"
                    >
                      <Printer className="w-3 h-3" /> Cetak
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    Tujuan: <strong className="text-slate-900">{orderRadiologiList?.[0]?.faskesTujuan || 'RSUD Kabupaten'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                    {orderRadiologiList?.[0]?.details?.map((d: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-purple-50 text-purple-900 text-[10px] font-bold border border-purple-200">
                        {d.namaPemeriksaan} ({d.kodeLoinc})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Laboratorium Eksternal */}
              {hasExternalLab && (
                <div className="bg-white p-3 border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <TestTubes className="w-3.5 h-3.5 text-amber-600" />
                      Laboratorium Eksternal ({externalLabItems.length} Uji)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCetakDefaultTab('LAB');
                        setIsCetakPengantarModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-amber-800 hover:underline flex items-center gap-0.5"
                    >
                      <Printer className="w-3 h-3" /> Cetak
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    Tujuan: <strong className="text-slate-900">{orderLabData?.faskesTujuan || 'UPT Labkesda Kabupaten'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                    {externalLabItems.map((d: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                        {d.parameter}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Prosedur Eksternal */}
              {hasExternalProc && (
                <div className="bg-white p-3 border border-emerald-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      Tindakan ICD-9 Rujuk ({externalProcedures.length} Prosedur)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                    {externalProcedures.map((p: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200">
                        {p.kode_icd9} - {p.nama_prosedur}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Jika belum ada order rujukan dipilih, tampilkan panduan ringkas rujukan keluar faskes */
          <div className="bg-slate-50 border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white border border-slate-200 text-indigo-700 shrink-0 shadow-2xs">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    Pengaturan Rujukan Keluar Faskes / Pemeriksaan Penunjang
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pilih pemeriksaan laboratorium atau radiologi eksternal pada kartu order di bawah. Sistem akan <strong>otomatis mendeteksi</strong> rincian order yang dipilih dan langsung menyediakan tombol cetak surat pengantar rujukan resmi berdasar order tersebut.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOrderLabModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <TestTubes className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Order Lab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrderRadiologiModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Radio className="w-3.5 h-3.5 text-purple-700" />
                  <span>+ Order Radiologi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* KARTU 1: LABORATORIUM PUSKESMAS & RUJUKAN */}
          <div className="border border-slate-200 p-5 bg-white flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                  <TestTubes className="w-3.5 h-3.5 text-slate-600" />
                  Laboratorium Puskesmas & Rujukan
                </span>
                {orderLabData ? (
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Aktif: {orderLabData.status || 'REQUESTED'} ({orderLabData.details?.length || 0} Uji)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5">
                    Belum Ada Order
                  </span>
                )}
              </div>

              <h5 className="text-sm font-extrabold text-slate-900">
                Pemeriksaan Laboratorium Sederhana & Skrining
              </h5>
              
              {orderLabData && orderLabData.details && orderLabData.details.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-600 font-semibold">Parameter Uji Telah Dipesan:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {orderLabData.details.map((d: any, idx: number) => (
                      <span key={idx} className={`px-2 py-0.5 border text-[11px] font-bold inline-flex items-center gap-1 ${
                        d.isRujukanLuar
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      }`}>
                        <span>{d.parameter}</span>
                        <span className="text-[9px] font-normal opacity-75">
                          ({d.isRujukanLuar ? 'Rujuk' : 'Internal'})
                        </span>
                      </span>
                    ))}
                  </div>
                  {orderLabData.catatanKlinis && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 border border-slate-200">
                      &quot;{orderLabData.catatanKlinis}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gula Darah (GDS/GDP), Profil Lipid (Kolesterol, Trigliserida), Asam Urat, Hemoglobin, Urin Rutin, Golongan Darah, Tes Kehamilan, dan Widal. Tersedia paket cepat ANC & Skrining Penyakit.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderLabModalOpen(true)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <TestTubes className="w-4 h-4" />
                  {orderLabData ? 'Ubah / Tambah Permintaan Lab' : 'Buka Formulir Permintaan Lab'}
                </button>
                {orderLabData && (
                  <button
                    type="button"
                    onClick={handleResetOrderLab}
                    disabled={isDeletingLab}
                    title="Batalkan dan hapus seluruh permintaan lab untuk kunjungan ini"
                    className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isDeletingLab ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>Batalkan Order</span>
                  </button>
                )}
              </div>

              {hasExternalLab && (
                <button
                  type="button"
                  onClick={() => {
                    setCetakDefaultTab('LAB');
                    setIsCetakPengantarModalOpen(true);
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-amber-900 font-bold text-xs border border-amber-300 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  Cetak Surat Pengantar Rujukan Lab ({externalLabItems.length} Parameter)
                </button>
              )}

              {onOpenHasilLabModal && (
                <button
                  type="button"
                  onClick={onOpenHasilLabModal}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  Lihat / Cetak Lembar Hasil Lab
                </button>
              )}
            </div>
          </div>

          {/* KARTU 2: PEMERIKSAAN RADIOLOGI LOINC & RUJUKAN EKSTERNAL */}
          <div className="border border-slate-200 p-5 bg-white flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                  <Radio className="w-3.5 h-3.5 text-slate-600" />
                  Pemeriksaan Radiologi (LOINC)
                </span>
                {orderRadiologiList && orderRadiologiList.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 border ${
                      orderRadiologiList[0]?.isRujukanLuar
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {orderRadiologiList[0]?.isRujukanLuar ? 'Rujukan RS' : 'Internal Faskes'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5">
                      {orderRadiologiList[0]?.acsn}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5">
                    Belum Ada Order
                  </span>
                )}
              </div>

              <h5 className="text-sm font-extrabold text-slate-900">
                Pemeriksaan Radiologi & Rujukan Eksternal
              </h5>
              
              {orderRadiologiList && orderRadiologiList.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Pemeriksaan Terdaftar:</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] font-bold">
                      {orderRadiologiList[0]?.prioritas === 'stat' ? 'STAT / CITO' : 'ROUTINE'}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {orderRadiologiList[0]?.details?.map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between px-2.5 py-1 bg-slate-50 border border-slate-200 text-[11px]">
                        <span className="font-bold text-slate-900">{d.namaPemeriksaan}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                            orderRadiologiList[0]?.isRujukanLuar
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {orderRadiologiList[0]?.isRujukanLuar ? 'Rujukan RS' : 'Internal'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600">{d.kodeLoinc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {orderRadiologiList[0]?.catatanKlinis && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 border border-slate-200">
                      &quot;{orderRadiologiList[0]?.catatanKlinis}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pilih pemeriksaan radiologi LOINC standar SATUSEHAT (Rontgen Thorax, XR Femur/Ekstremitas, USG Abdomen, CT Scan, Panoramic Dental) atau cetak surat pengantar penunjang ke faskes rujukan.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderRadiologiModalOpen(true)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Radio className="w-4 h-4" />
                  {orderRadiologiList && orderRadiologiList.length > 0 ? 'Tambah / Ubah Order Radiologi' : 'Pilih Pemeriksaan & Order Radiologi'}
                </button>
                {orderRadiologiList && orderRadiologiList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetOrderRadiologi}
                    disabled={isDeletingRadiologi}
                    title="Batalkan dan hapus seluruh permintaan radiologi untuk kunjungan ini"
                    className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isDeletingRadiologi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>Batalkan Order</span>
                  </button>
                )}
              </div>

              {orderRadiologiList && orderRadiologiList.length > 0 && hasExternalRadiologi && (
                <button
                  type="button"
                  onClick={() => {
                    setCetakDefaultTab('RADIOLOGI');
                    setIsCetakPengantarModalOpen(true);
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-purple-800 font-bold text-xs border border-purple-300 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-700" />
                  Cetak Surat Pengantar Radiologi ({orderRadiologiList[0]?.details?.length || 0} Foto)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL CETAK SURAT PENGANTAR RUJUKAN RESMI (TERINTEGRASI ORDER) ─── */}
      <CetakPengantarPenunjangModal
        isOpen={isCetakPengantarModalOpen}
        onClose={() => setIsCetakPengantarModalOpen(false)}
        kunjunganData={selectedKunjungan}
        orderLabData={orderLabData}
        orderRadiologiData={orderRadiologiList && orderRadiologiList.length > 0 ? orderRadiologiList[0] : null}
        defaultTab={cetakDefaultTab}
      />

      {/* ─── MODAL ORDER LABORATORIUM ─── */}
      <OrderLabModal
        isOpen={isOrderLabModalOpen}
        onClose={() => setIsOrderLabModalOpen(false)}
        selectedKunjungan={selectedKunjungan}
        existingOrder={orderLabData}
        onSuccess={onRefreshOrderLab}
      />

      {/* ─── MODAL ORDER RADIOLOGI (LOINC) ─── */}
      <OrderRadiologiModal
        isOpen={isOrderRadiologiModalOpen}
        onClose={() => setIsOrderRadiologiModalOpen(false)}
        selectedKunjungan={selectedKunjungan}
        onSuccess={onRefreshOrderRadiologi}
      />

    </div>
  );
}
