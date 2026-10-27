"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BedDouble, Stethoscope, Activity, ClipboardCheck, Clock, User, LogOut, CheckCircle, Save, Plus, Loader2, DollarSign, Calendar, AlertTriangle, Building, FileText, RotateCcw, Sparkles, ExternalLink, RefreshCw, Pill, Trash2, CheckCircle2, Droplets, X, Search, Check, ShieldCheck, HeartPulse } from 'lucide-react';
import { asetRuanganService } from '../../../../services/asetRuangan.service';
import { rawatJalanService } from '../../../../services/rawatJalan.service';
import { masterService } from '../../../../services/master.service';
import { kasirService } from '../../../../services/kasir.service';
import { useAuthStore } from '../../../../store/auth.store';
import Swal from 'sweetalert2';

// Mock Data cadangan untuk Kamar / Bed Management
const MOCK_WARDS = [
  { room: 'Ruang Rawat Inap Melati (Dewasa)', beds: [
      { id: 'BED-MELATI-01', patient: 'Ahmad Dahlan', noRM: 'RM-00102', days: 3, status: 'occupied', diagnosis: 'Typhoid Fever' },
      { id: 'BED-MELATI-02', patient: null, noRM: null, days: 0, status: 'empty', diagnosis: null }
  ]},
  { room: 'Ruang Rawat Inap Mawar (Isolasi)', beds: [
      { id: 'BED-MAWAR-01', patient: null, noRM: null, days: 0, status: 'empty', diagnosis: null }
  ]}
];

const OCCUPIED_BEDS = MOCK_WARDS.flatMap(w => w.beds).filter(b => b.status !== 'empty');

export default function RawatInapDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'admission' | 'visit' | 'askep' | 'discharge'>('admission');
  const [wards, setWards] = useState<any[]>(MOCK_WARDS);
  const [selectedBed, setSelectedBed] = useState<any>(OCCUPIED_BEDS[0]);

  // State Form Discharge (Rencana Pulang / Rujukan)
  const [keadaanKeluar, setKeadaanKeluar] = useState<'SEMBUH' | 'PULANG_PAKSA' | 'MENINGGAL' | 'RUJUK'>('SEMBUH');
  const [faskesTujuan, setFaskesTujuan] = useState('RSUD Cibinong');
  const [alasanRujukan, setAlasanRujukan] = useState('');
  const [edukasiPulang, setEdukasiPulang] = useState('');
  const [rencanaKontrol, setRencanaKontrol] = useState('');
  const [isDischarging, setIsDischarging] = useState(false);

  // State E-Resep Obat Pulang (Take-Home Prescription)
  const [obatPulangList, setObatPulangList] = useState<any[]>([]);
  const [searchObatPulang, setSearchObatPulang] = useState('');
  const [isObatPulangDropdownOpen, setIsObatPulangDropdownOpen] = useState(false);
  const [selectedObatPulangItem, setSelectedObatPulangItem] = useState<any>(null);
  const [selectedObatPulangQty, setSelectedObatPulangQty] = useState<number>(1);
  const [selectedObatPulangSigna, setSelectedObatPulangSigna] = useState('3 x 1 Tablet sesudah makan');
  const [selectedObatPulangRute, setSelectedObatPulangRute] = useState('Oral');
  const [selectedObatPulangCatatan, setSelectedObatPulangCatatan] = useState('');

  // State Preview Billing Kasir Kumulatif (Single Source of Truth)
  const [previewBilling, setPreviewBilling] = useState<any>(null);
  const [loadingPreviewBilling, setLoadingPreviewBilling] = useState(false);

  // State Form Visit CPPT & Integrasi Rekam Medis
  const [prevRekamMedis, setPrevRekamMedis] = useState<any>(null);
  const [loadingPrevRM, setLoadingPrevRM] = useState(false);
  const [riwayatCpptList, setRiwayatCpptList] = useState<any[]>([]);
  const [loadingCppt, setLoadingCppt] = useState(false);
  const [isSavingCppt, setIsSavingCppt] = useState(false);

  // Field Input SOAP Hari Ini
  const [subjektif, setSubjektif] = useState('');
  const [objektif, setObjektif] = useState('');
  const [tandaVital, setTandaVital] = useState({
    tdSistolik: '',
    tdDiastolik: '',
    nadi: '',
    suhu: '',
    rr: '',
    spo2: '',
  });
  const [asesmen, setAsesmen] = useState('');
  const [plan, setPlan] = useState('');
  const [instruksiMedis, setInstruksiMedis] = useState('');

  // State Terapi Obat & E-Resep Visit CPPT Dokter
  const [obatCatalog, setObatCatalog] = useState<any[]>([]);
  const [loadingObatCatalog, setLoadingObatCatalog] = useState(false);
  const [searchObatQuery, setSearchObatQuery] = useState('');
  const [isObatDropdownOpen, setIsObatDropdownOpen] = useState(false);
  const [selectedObatItem, setSelectedObatItem] = useState<any>(null);
  const [selectedObatQty, setSelectedObatQty] = useState<number>(1);
  const [selectedObatSigna, setSelectedObatSigna] = useState('3 x 1 Tablet');
  const [selectedObatRute, setSelectedObatRute] = useState('Oral');
  const [selectedObatCatatan, setSelectedObatCatatan] = useState('');
  const [prescribedMedicines, setPrescribedMedicines] = useState<any[]>([]);

  // State Resep Kunjungan Aktif & Ceklis Pemberian Obat (MAR - Medication Administration Record)
  const [resepKunjunganList, setResepKunjunganList] = useState<any[]>([]);
  const [loadingResepKunjungan, setLoadingResepKunjungan] = useState(false);
  const [ceklisObatState, setCeklisObatState] = useState<{ [key: string]: { diberikan: boolean; waktu: string; petugas: string } }>({});

  // State Modal Input Tanda Vital Shift (Perawat)
  const [isModalTtvShiftOpen, setIsModalTtvShiftOpen] = useState(false);
  const [isSavingTtvShift, setIsSavingTtvShift] = useState(false);
  const [modalTtvData, setModalTtvData] = useState({
    shift: 'Pagi',
    tdSistolik: '',
    tdDiastolik: '',
    nadi: '',
    suhu: '',
    rr: '',
    spo2: '',
    intake: '',
    output: '',
    catatanPerawat: '',
  });

  const loadBeds = async () => {
    try {
      const [ruangans, beds] = await Promise.all([
        asetRuanganService.getRuangans({ kategoriRuangan: 'RAWAT_INAP' }),
        asetRuanganService.getBeds()
      ]);

      if (beds && beds.length > 0) {
        // Filter bed rawat inap
        const rawatInapBeds = beds.filter((b: any) => 
          !b.ruangan || b.ruangan.kategoriRuangan === 'RAWAT_INAP' || b.ruangan.namaRuangan.toLowerCase().includes('inap')
        );
        const targetBeds = rawatInapBeds.length > 0 ? rawatInapBeds : beds;

        const grouped: { [key: string]: any[] } = {};
        targetBeds.forEach((b: any) => {
          const roomKey = b.ruangan?.namaRuangan || 'Ruang Rawat Inap';
          if (!grouped[roomKey]) grouped[roomKey] = [];
          const isTerisi = b.statusBed === 'TERISI';
          const kunjungan = b.kunjunganAktif;
          const pasien = kunjungan?.pasien;

          // Hitung durasi hari menginap
          let days = 1;
          if (kunjungan) {
            const waktuMasuk = kunjungan.waktuMasukRawatInap || kunjungan.tanggalRegistrasi || new Date();
            const start = new Date(waktuMasuk);
            start.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const diff = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            days = Math.max(1, diff <= 0 ? 1 : diff);
          }

          let usia = 'Dewasa';
          if (pasien?.tanggalLahir) {
            const birth = new Date(pasien.tanggalLahir);
            const diffYears = Math.floor((new Date().getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (diffYears > 0) usia = `${diffYears} Tahun`;
          }

          const dokterDPJP = kunjungan?.dokterTujuan?.namaLengkap || kunjungan?.rekamMedis?.dokter?.namaLengkap || 'dr. DPJP Rawat Inap';
          const penjamin = kunjungan?.pasien?.penjamin?.jenisPenjamin || kunjungan?.jenisPembayaran || 'BPJS / Umum';
          const asalMasuk = kunjungan?.jenisPelayanan === 'UGD' ? 'IGD / Kedaruratan' : (kunjungan?.poliklinik?.namaPoli || 'Poliklinik Rawat Jalan');
          const alasanRawatInap = kunjungan?.alasanRawatInap || kunjungan?.rekamMedis?.keluhanUtama || kunjungan?.screening?.keluhanUtama || (kunjungan?.rekamMedis?.diagnosisKlinis ? `Observasi dan penanganan ${kunjungan.rekamMedis.diagnosisKlinis}` : 'Observasi klinis rawat inap');

          grouped[roomKey].push({
            id: b.nomorBed,
            rawId: b.id,
            ruangan: b.ruangan,
            kunjunganAktif: kunjungan,
            patient: isTerisi ? (pasien?.namaLengkap || 'Pasien Rawat Inap') : null,
            noRM: isTerisi ? (pasien?.noRM || 'RM-INAP') : null,
            usia,
            penjamin,
            dokterDPJP,
            asalMasuk,
            alasanRawatInap,
            tanggalMasuk: kunjungan?.waktuMasukRawatInap || kunjungan?.tanggalRegistrasi,
            days,
            status: isTerisi ? 'occupied' : (b.statusBed === 'PERBAIKAN' ? 'critical' : (b.statusBed === 'DIBERSIHKAN' ? 'discharge_plan' : 'empty')),
            diagnosis: isTerisi ? (kunjungan?.rekamMedis?.diagnosisKlinis || 'Observasi Klinis Rawat Inap') : null,
            kelas: b.kelasKamar,
            rawBed: b,
          });
        });

        const newWards = Object.keys(grouped).map(roomName => ({
          room: roomName,
          beds: grouped[roomName]
        }));

        setWards(newWards);

        setSelectedBed((prev: any) => {
          if (prev) {
            const found = newWards.flatMap(w => w.beds).find(b => b.rawId === prev.rawId);
            if (found && found.status !== 'empty') return found;
          }
          const firstOccupied = newWards.flatMap(w => w.beds).find(b => b.status !== 'empty');
          return firstOccupied || newWards[0]?.beds[0] || null;
        });
      }
    } catch (err) {
      console.warn('Gagal memuat data dinamis bed, menggunakan template lokal', err);
    }
  };

  // Ambil katalog obat untuk e-Resep dokter
  const fetchObatCatalog = async () => {
    setLoadingObatCatalog(true);
    try {
      const res = await masterService.getObat();
      const data = res?.data || res || [];
      setObatCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Gagal mengambil katalog obat:', err);
    } finally {
      setLoadingObatCatalog(false);
    }
  };

  // Ambil seluruh resep resmi untuk kunjungan rawat inap ini
  const loadResepKunjungan = async (kunjunganId: string) => {
    if (!kunjunganId) return;
    setLoadingResepKunjungan(true);
    try {
      const res = await rawatJalanService.getResepByKunjungan(kunjunganId);
      const list = res?.data || [];
      setResepKunjunganList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Gagal memuat resep kunjungan:', err);
      setResepKunjunganList([]);
    } finally {
      setLoadingResepKunjungan(false);
    }
  };

  // Ambil preview tagihan kasir resmi yang sinkron dengan backend
  const loadBillingPreview = async (kunjId?: string, listObatPulang?: any[]) => {
    const targetKunjId = kunjId || selectedBed?.kunjunganAktif?.id;
    if (!targetKunjId) {
      setPreviewBilling(null);
      return;
    }
    setLoadingPreviewBilling(true);
    try {
      const res = await kasirService.previewTagihan(targetKunjId, {
        resepPulang: listObatPulang || obatPulangList,
        bedInfo: selectedBed,
        lamaHari: selectedBed?.days || 1,
      });
      if (res?.data) {
        setPreviewBilling(res.data);
      }
    } catch (err) {
      console.warn('Gagal memuat preview tagihan:', err);
    } finally {
      setLoadingPreviewBilling(false);
    }
  };

  // Ambil rekam medis sebelumnya dan riwayat CPPT
  const loadCpptAndPrevRM = async (kunjunganId: string) => {
    if (!kunjunganId) return;
    setLoadingPrevRM(true);
    setLoadingCppt(true);
    try {
      const [resPrev, resHistory] = await Promise.all([
        rawatJalanService.getRekamMedisSebelumnya(kunjunganId),
        rawatJalanService.getRiwayatCPPT(kunjunganId),
      ]);

      const prevData = resPrev?.data || null;
      setPrevRekamMedis(prevData);

      const histData = resHistory?.data || [];
      setRiwayatCpptList(histData);

      // Auto-prefill form hari ini dari rekam medis sebelumnya jika field masih kosong
      if (prevData) {
        setSubjektif(prev => prev || prevData.subjektif || '');
        setObjektif(prev => prev || prevData.objektif || '');
        setAsesmen(prev => prev || prevData.asesmen || '');
        setPlan(prev => prev || prevData.plan || '');
        setInstruksiMedis(prev => prev || prevData.instruksiMedis || '');
        if (prevData.tandaVital) {
          setTandaVital(prev => ({
            tdSistolik: prev.tdSistolik || prevData.tandaVital.tdSistolik || '',
            tdDiastolik: prev.tdDiastolik || prevData.tandaVital.tdDiastolik || '',
            nadi: prev.nadi || prevData.tandaVital.nadi || '',
            suhu: prev.suhu || prevData.tandaVital.suhu || '',
            rr: prev.rr || prevData.tandaVital.rr || '',
            spo2: prev.spo2 || prevData.tandaVital.spo2 || '',
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat rekam medis sebelumnya / riwayat CPPT:', err);
    } finally {
      setLoadingPrevRM(false);
      setLoadingCppt(false);
    }
  };

  // Salin manual seluruh data rekam medis sebelumnya ke form hari ini
  const handleApplyPreviousData = () => {
    if (!prevRekamMedis) return;
    setSubjektif(prevRekamMedis.subjektif || '');
    setObjektif(prevRekamMedis.objektif || '');
    setAsesmen(prevRekamMedis.asesmen || '');
    setPlan(prevRekamMedis.plan || '');
    setInstruksiMedis(prevRekamMedis.instruksiMedis || '');
    if (prevRekamMedis.tandaVital) {
      setTandaVital({
        tdSistolik: prevRekamMedis.tandaVital.tdSistolik || '',
        tdDiastolik: prevRekamMedis.tandaVital.tdDiastolik || '',
        nadi: prevRekamMedis.tandaVital.nadi || '',
        suhu: prevRekamMedis.tandaVital.suhu || '',
        rr: prevRekamMedis.tandaVital.rr || '',
        spo2: prevRekamMedis.tandaVital.spo2 || '',
      });
    }
    Swal.fire({
      icon: 'info',
      title: 'Data Sebelumnya Diterapkan',
      text: 'Formulir CPPT berhasil diisi dari catatan sebelumnya. Silakan lakukan penyesuaian untuk hari ini.',
      timer: 1800,
      showConfirmButton: false,
    });
  };

  // Tambah Obat ke Daftar e-Resep Visit Dokter
  const handleAddMedicine = () => {
    if (!selectedObatItem) {
      Swal.fire('Perhatian', 'Silakan pilih obat dari katalog terlebih dahulu.', 'warning');
      return;
    }

    if (prescribedMedicines.some(p => p.obatId === selectedObatItem.id)) {
      Swal.fire('Info', 'Obat ini sudah ditambahkan dalam daftar terapi visit hari ini.', 'info');
      return;
    }

    setPrescribedMedicines(prev => [
      ...prev,
      {
        obatId: selectedObatItem.id,
        namaObat: selectedObatItem.namaObat,
        sediaan: selectedObatItem.sediaan || 'Tablet',
        kategori: selectedObatItem.kategori || 'Obat',
        qty: Number(selectedObatQty) || 1,
        signa: selectedObatSigna || '3 x 1 Tablet',
        rute: selectedObatRute || 'Oral',
        catatan: selectedObatCatatan || ''
      }
    ]);

    // Reset pilihan obat
    setSelectedObatItem(null);
    setSearchObatQuery('');
    setSelectedObatQty(1);
    setSelectedObatSigna('3 x 1 Tablet');
    setSelectedObatRute('Oral');
    setSelectedObatCatatan('');
    setIsObatDropdownOpen(false);
  };

  const handleRemoveMedicine = (obatId: string) => {
    setPrescribedMedicines(prev => prev.filter(p => p.obatId !== obatId));
  };

  const handleAddObatPulang = () => {
    if (!selectedObatPulangItem) {
      Swal.fire('Perhatian', 'Pilih item obat pulang terlebih dahulu dari daftar katalog obat.', 'warning');
      return;
    }

    if (obatPulangList.some(o => o.obatId === selectedObatPulangItem.id)) {
      Swal.fire('Info', 'Obat ini sudah ada dalam daftar obat pulang.', 'info');
      return;
    }

    setObatPulangList(prev => [
      ...prev,
      {
        obatId: selectedObatPulangItem.id,
        namaObat: selectedObatPulangItem.namaObat,
        sediaan: selectedObatPulangItem.sediaan || 'Tablet',
        kategori: selectedObatPulangItem.kategori || 'Obat',
        harga: selectedObatPulangItem.harga !== undefined && selectedObatPulangItem.harga !== null ? Number(selectedObatPulangItem.harga) : 10000,
        qty: Number(selectedObatPulangQty) || 1,
        signa: selectedObatPulangSigna || '3 x 1 Tablet sesudah makan',
        rute: selectedObatPulangRute || 'Oral',
        catatan: selectedObatPulangCatatan || ''
      }
    ]);

    setSelectedObatPulangItem(null);
    setSearchObatPulang('');
    setSelectedObatPulangQty(1);
    setSelectedObatPulangSigna('3 x 1 Tablet sesudah makan');
    setSelectedObatPulangRute('Oral');
    setSelectedObatPulangCatatan('');
    setIsObatPulangDropdownOpen(false);
  };

  const handleRemoveObatPulang = (obatId: string) => {
    setObatPulangList(prev => prev.filter(o => o.obatId !== obatId));
  };

  // Ceklis Pemberian Terapi Obat (MAR) oleh Perawat
  const toggleCeklisObat = (detailId: string, namaObat: string) => {
    const kunjId = selectedBed?.kunjunganAktif?.id;
    const currentState = ceklisObatState[detailId]?.diberikan;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const namaPetugas = user?.namaLengkap || 'Ns. Perawat Bangsal';

    const updated = {
      ...ceklisObatState,
      [detailId]: {
        diberikan: !currentState,
        waktu: !currentState ? nowTime : '',
        petugas: !currentState ? namaPetugas : ''
      }
    };

    setCeklisObatState(updated);
    if (kunjId) {
      try {
        localStorage.setItem(`sikda_mar_${kunjId}`, JSON.stringify(updated));
      } catch (_) {}
    }
  };

  // Simpan Tanda Vital Shift oleh Perawat
  const handleSimpanTtvShift = async () => {
    const kunjId = selectedBed?.kunjunganAktif?.id;
    if (!kunjId) {
      Swal.fire('Perhatian', 'Kunjungan pasien aktif tidak ditemukan pada bed ini.', 'warning');
      return;
    }

    if (!modalTtvData.tdSistolik && !modalTtvData.nadi && !modalTtvData.suhu && !modalTtvData.catatanPerawat && !modalTtvData.intake && !modalTtvData.output) {
      Swal.fire('Perhatian', 'Harap isi setidaknya tanda vital, intake/output cairan, atau catatan shift perawat.', 'warning');
      return;
    }

    setIsSavingTtvShift(true);
    try {
      await rawatJalanService.simpanCPPT(kunjId, {
        profesi: 'PERAWAT',
        tanggalCatatan: new Date().toISOString(),
        tandaVital: {
          shift: modalTtvData.shift,
          tdSistolik: modalTtvData.tdSistolik || undefined,
          tdDiastolik: modalTtvData.tdDiastolik || undefined,
          nadi: modalTtvData.nadi || undefined,
          suhu: modalTtvData.suhu || undefined,
          rr: modalTtvData.rr || undefined,
          spo2: modalTtvData.spo2 || undefined,
          intake: modalTtvData.intake || undefined,
          output: modalTtvData.output || undefined,
        },
        subjektif: modalTtvData.catatanPerawat || `Observasi Shift ${modalTtvData.shift}`,
        objektif: `Shift ${modalTtvData.shift}: TD ${modalTtvData.tdSistolik || '-'}/${modalTtvData.tdDiastolik || '-'}, Nadi ${modalTtvData.nadi || '-'} x/m, Suhu ${modalTtvData.suhu || '-'}°C, RR ${modalTtvData.rr || '-'} x/m, SpO2 ${modalTtvData.spo2 || '-'}%`,
        plan: (modalTtvData.intake || modalTtvData.output) ? `Keseimbangan Cairan: Intake ${modalTtvData.intake || '-'} cc, Output ${modalTtvData.output || '-'} cc` : undefined,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Observasi Shift Berhasil Disimpan!',
        text: `Tanda vital shift ${modalTtvData.shift} berhasil dicatat dan disinkronkan ke rekam medis pasien.`,
        timer: 1800,
        showConfirmButton: false,
      });

      setModalTtvData({
        shift: 'Pagi',
        tdSistolik: '',
        tdDiastolik: '',
        nadi: '',
        suhu: '',
        rr: '',
        spo2: '',
        intake: '',
        output: '',
        catatanPerawat: '',
      });
      setIsModalTtvShiftOpen(false);

      // Refresh riwayat CPPT dan bed state
      await loadCpptAndPrevRM(kunjId);
    } catch (err: any) {
      console.error('Gagal menyimpan TTV shift:', err);
      Swal.fire('Gagal Menyimpan', err.response?.data?.message || err.message || 'Terjadi kesalahan sistem saat menyimpan TTV.', 'error');
    } finally {
      setIsSavingTtvShift(false);
    }
  };

  // Simpan CPPT ke Database & Sinkronkan ke RME
  const handleSimpanCPPT = async () => {
    const kunjunganId = selectedBed?.kunjunganAktif?.id;
    if (!kunjunganId) {
      Swal.fire('Perhatian', 'Kunjungan pasien aktif tidak ditemukan pada bed ini.', 'warning');
      return;
    }

    if (!subjektif && !objektif && !asesmen && !plan && prescribedMedicines.length === 0) {
      Swal.fire('Perhatian', 'Harap isi setidaknya salah satu komponen SOAP atau resep terapi obat sebelum menyimpan.', 'warning');
      return;
    }

    setIsSavingCppt(true);
    try {
      await rawatJalanService.simpanCPPT(kunjunganId, {
        subjektif,
        objektif,
        tandaVital: {
          tdSistolik: tandaVital.tdSistolik || undefined,
          tdDiastolik: tandaVital.tdDiastolik || undefined,
          nadi: tandaVital.nadi || undefined,
          suhu: tandaVital.suhu || undefined,
          rr: tandaVital.rr || undefined,
          spo2: tandaVital.spo2 || undefined,
        },
        asesmen,
        plan,
        instruksiMedis,
        resep: prescribedMedicines.length > 0 ? prescribedMedicines.map(m => ({
          obatId: m.obatId,
          namaObat: m.namaObat,
          qty: m.qty,
          signa: `${m.signa}${m.rute ? ` (${m.rute})` : ''}`,
          catatan: m.catatan || null
        })) : undefined
      });

      await Swal.fire({
        icon: 'success',
        title: 'CPPT & Terapi Berhasil Disimpan!',
        text: prescribedMedicines.length > 0
          ? `${prescribedMedicines.length} item terapi obat berhasil diterbitkan ke Farmasi (mengurangi stok faskes) dan disinkronkan ke Rekam Medis (RME).`
          : 'Catatan perkembangan visit berhasil disimpan dan otomatis terintegrasi ke Rekam Medis (RME) Pasien.',
        timer: 2200,
        showConfirmButton: false,
      });

      // Reset obat yang baru diresepkan & muat ulang resep aktif
      setPrescribedMedicines([]);
      await loadResepKunjungan(kunjunganId);
      await loadCpptAndPrevRM(kunjunganId);
      await loadBeds();
    } catch (err: any) {
      console.error('Gagal menyimpan CPPT:', err);
      Swal.fire('Gagal Menyimpan', err.response?.data?.message || err.message || 'Terjadi kesalahan sistem saat menyimpan CPPT.', 'error');
    } finally {
      setIsSavingCppt(false);
    }
  };

  useEffect(() => {
    if (selectedBed?.kunjunganAktif?.id) {
      const kunjId = selectedBed.kunjunganAktif.id;
      loadCpptAndPrevRM(kunjId);
      loadResepKunjungan(kunjId);
      try {
        const savedMar = localStorage.getItem(`sikda_mar_${kunjId}`);
        if (savedMar) {
          setCeklisObatState(JSON.parse(savedMar));
        } else {
          setCeklisObatState({});
        }
      } catch (_) {}
    }
  }, [selectedBed?.kunjunganAktif?.id]);

  useEffect(() => {
    if (activeTab === 'discharge' && selectedBed?.kunjunganAktif?.id) {
      loadBillingPreview(selectedBed.kunjunganAktif.id, obatPulangList);
    }
  }, [activeTab, selectedBed?.kunjunganAktif?.id, selectedBed?.days, obatPulangList]);

  useEffect(() => {
    loadBeds();
    fetchObatCatalog();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: WARD MANAGEMENT */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-4 border-b border-gray-200 bg-teal-50/50">
          <h2 className="text-lg font-bold text-teal-800 flex items-center">
            <BedDouble className="w-5 h-5 mr-2 text-teal-600" />
            Manajemen Kamar & Bed
          </h2>
          <div className="mt-3 flex gap-2 text-xs font-medium text-gray-500">
            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-teal-500 mr-1"></div> Terisi</span>
            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div> Kritis</span>
            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-orange-400 mr-1"></div> Rencana Pulang</span>
            <span className="flex items-center"><div className="w-2 h-2 rounded-full border border-gray-300 mr-1"></div> Kosong</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {wards.map((ward, wardIdx) => (
            <div key={wardIdx} className="border border-gray-200 shadow-sm">
              <div className="bg-gray-100 p-2 font-bold text-sm text-gray-700 border-b border-gray-200">
                {ward.room}
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                {ward.beds.map((bed: any) => {
                  const isSelected = selectedBed?.id === bed.id;
                  const isEmpty = bed.status === 'empty';
                  
                  let bgClass = "bg-white hover:bg-gray-50 cursor-pointer";
                  let borderClass = "border-transparent";
                  
                  if (isSelected) {
                    bgClass = "bg-teal-50";
                    borderClass = "border-teal-500 z-10 shadow-md";
                  } else if (isEmpty) {
                    bgClass = "bg-gray-50/50 cursor-default opacity-60";
                  }

                  let statusBadge = "";
                  if (bed.status === 'occupied') statusBadge = "bg-teal-500";
                  if (bed.status === 'critical') statusBadge = "bg-red-500 animate-pulse";
                  if (bed.status === 'discharge_plan') statusBadge = "bg-orange-400";
                  if (isEmpty) statusBadge = "border border-gray-300 bg-transparent";

                  return (
                    <div 
                      key={bed.id}
                      onClick={() => !isEmpty && setSelectedBed(bed)}
                      className={`p-3 border-2 transition-all relative h-24 flex flex-col justify-between ${bgClass} ${borderClass}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-bold text-gray-500">{bed.id}</span>
                        <div className={`w-2.5 h-2.5 rounded-full ${statusBadge}`}></div>
                      </div>
                      
                      {isEmpty ? (
                        <div className="text-center text-xs text-gray-400 font-medium">Kosong</div>
                      ) : (
                        <div>
                          <div className="font-bold text-sm text-gray-900 truncate" title={bed.patient || undefined}>{bed.patient}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">{bed.noRM}</span>
                            <span className="text-[10px] bg-white border border-gray-200 px-1 font-bold text-gray-600 shadow-sm">Hari {bed.days}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: MAIN FORM */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
        {selectedBed ? (
          <>
            {/* Header Pasien Inap */}
            <div className={`p-4 border-b border-gray-200 shadow-sm flex justify-between items-center text-white ${
              selectedBed.status === 'critical' ? 'bg-red-700' :
              selectedBed.status === 'discharge_plan' ? 'bg-orange-600' : 'bg-teal-700'
            }`}>
              <div className="flex items-center">
                <div className={`w-12 h-12 flex items-center justify-center font-bold text-2xl mr-4 border-2 border-white/30 bg-black/10`}>
                  {selectedBed.patient?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold mr-3">{selectedBed.patient}</h1>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-none font-mono border border-white/30 shadow-sm">
                      {selectedBed.id}
                    </span>
                  </div>
                  <div className="text-sm opacity-90 flex items-center mt-1 font-medium">
                    <span className="font-mono bg-black/20 px-1.5 py-0.5 mr-2">{selectedBed.noRM}</span>
                    <span>{selectedBed.usia || 'Dewasa'}</span>
                    <span className="mx-2">•</span>
                    <span className="font-bold">Perawatan Hari Ke-{selectedBed.days}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {selectedBed.noRM && (
                  <Link
                    href={`/dokter/rme-dokter?noRM=${selectedBed.noRM}`}
                    target="_blank"
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Buka Rekam Medis Elektronik (RME) Lengkap Pasien Ini di Tab Baru"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buka RME Lengkap</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Link>
                )}
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Diagnosa (ICD-10)</div>
                  <div className="text-lg font-bold flex items-center">
                    <Activity className="w-4 h-4 mr-1 opacity-70" />
                    {selectedBed.diagnosis}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-gray-200 bg-white shadow-sm z-10">
              <button 
                onClick={() => setActiveTab('admission')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'admission' ? 'border-teal-600 text-teal-700 bg-teal-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                1. Admission & Profil
              </button>
              <button 
                onClick={() => setActiveTab('visit')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'visit' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                2. Visit Dokter (CPPT)
              </button>
              <button 
                onClick={() => setActiveTab('askep')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'askep' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                3. Askep & Monitoring
              </button>
              <button 
                onClick={() => setActiveTab('discharge')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'discharge' ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                4. Rencana Pulang
              </button>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              
              {/* TAB 1: ADMISSION */}
              {activeTab === 'admission' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-3">
                      <User className="w-5 h-5 mr-2 text-teal-600" />
                      Ringkasan Masuk (Admission Summary)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Masuk (Admission Date)</label>
                          <div className="font-medium text-gray-800">
                            {selectedBed.tanggalMasuk ? new Date(selectedBed.tanggalMasuk).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Tanggal Registrasi Inap'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asal Masuk</label>
                          <div className="font-medium text-gray-800">{selectedBed.asalMasuk || 'IGD (Rujukan Internal)'}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dokter Penanggung Jawab Pelayanan (DPJP)</label>
                          <div className="font-bold text-teal-700">{selectedBed.dokterDPJP || 'dr. DPJP Bangsal'}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Penjamin / Asuransi</label>
                          <div className="inline-block bg-green-100 text-green-800 px-2 py-1 text-sm font-bold border border-green-200">
                            {selectedBed.penjamin || 'BPJS Kesehatan'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ruangan & Nomor Bed</label>
                          <div className="font-mono text-gray-800 font-bold">
                            {selectedBed.ruangan?.namaRuangan} • {selectedBed.id}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 border border-gray-200">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alasan Dirawat (Indikasi Opname)</label>
                      <p className="text-gray-800 text-sm leading-relaxed">{selectedBed.alasanRawatInap}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VISIT DOKTER (CPPT) */}
              {activeTab === 'visit' && (
                <div className="space-y-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
                  
                  {/* Left: Preview Rekam Medis Sebelumnya & Form Input SOAP Hari ini */}
                  <div className="flex-1 space-y-5">
                    
                    {/* PANEL PREVIEW REKAM MEDIS SEBELUMNYA */}
                    {loadingPrevRM ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-medium">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menarik data Rekam Medis sebelumnya...
                      </div>
                    ) : prevRekamMedis ? (
                      <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-300 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
                              Preview Rekam Medis / Asesmen Sebelumnya
                            </span>
                            <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5">
                              {prevRekamMedis.labelSumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-600 font-medium">
                            <span>🕒 {prevRekamMedis.tanggal ? new Date(prevRekamMedis.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                            <span>👨‍⚕️ {prevRekamMedis.petugas}</span>
                            <button
                              onClick={handleApplyPreviousData}
                              type="button"
                              className="ml-1 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 transition-colors shadow-sm"
                              title="Salin ulang data ini ke formulir hari ini"
                            >
                              <RotateCcw className="w-3 h-3" /> Salin ke Form Hari Ini
                            </button>
                          </div>
                        </div>

                        {/* S-O-A-P Ringkasan Sebelumnya */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white/90 p-3 border border-blue-100 shadow-xs">
                            <span className="font-extrabold text-blue-900 block mb-1">Subjektif (S):</span>
                            <p className="text-gray-700 leading-relaxed italic">{prevRekamMedis.subjektif || 'Tidak ada catatan subjektif'}</p>
                          </div>
                          <div className="bg-white/90 p-3 border border-blue-100 shadow-xs">
                            <span className="font-extrabold text-blue-900 block mb-1">Objektif (O):</span>
                            <p className="text-gray-700 leading-relaxed">{prevRekamMedis.objektif || 'Tidak ada pemeriksaan fisik'}</p>
                            {prevRekamMedis.tandaVital && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                                {prevRekamMedis.tandaVital.tdSistolik && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 font-mono font-bold">
                                    TD: {prevRekamMedis.tandaVital.tdSistolik}/{prevRekamMedis.tandaVital.tdDiastolik || '-'}
                                  </span>
                                )}
                                {prevRekamMedis.tandaVital.nadi && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 font-mono font-bold">
                                    HR: {prevRekamMedis.tandaVital.nadi}x/m
                                  </span>
                                )}
                                {prevRekamMedis.tandaVital.suhu && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 font-mono font-bold">
                                    T: {prevRekamMedis.tandaVital.suhu}°C
                                  </span>
                                )}
                                {prevRekamMedis.tandaVital.rr && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 font-mono font-bold">
                                    RR: {prevRekamMedis.tandaVital.rr}x/m
                                  </span>
                                )}
                                {prevRekamMedis.tandaVital.spo2 && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 font-mono font-bold">
                                    SpO2: {prevRekamMedis.tandaVital.spo2}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="bg-white/90 p-3 border border-blue-100 shadow-xs">
                            <span className="font-extrabold text-blue-900 block mb-1">Asesmen (A):</span>
                            <p className="text-gray-800 font-semibold">{prevRekamMedis.asesmen || '-'}</p>
                          </div>
                          <div className="bg-white/90 p-3 border border-blue-100 shadow-xs">
                            <span className="font-extrabold text-blue-900 block mb-1">Plan & Terapi (P):</span>
                            <p className="text-gray-700">{prevRekamMedis.plan || '-'}</p>
                            {prevRekamMedis.instruksiMedis && (
                              <div className="mt-1.5 bg-amber-50 p-1.5 border-l-2 border-amber-400 text-[11px] text-amber-800">
                                <span className="font-bold">Instruksi:</span> {prevRekamMedis.instruksiMedis}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>Form di bawah telah terisi data acuan ini. Dokter cukup mengedit perubahan hari ini tanpa perlu menanyakan dari awal.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-gray-200 text-gray-500 text-xs italic flex items-center justify-between">
                        <span>Belum ada catatan rekam medis sebelumnya untuk pasien ini. Silakan input catatan visit pertama di bawah.</span>
                      </div>
                    )}

                    {/* FORM INPUT SOAP HARI INI */}
                    <div className="bg-white p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                          <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                          Visit Dokter Hari Ini (Input CPPT & Sinkron RME)
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1">
                          DPJP: {selectedBed.dokterDPJP || 'Dokter'}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Subjektif */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase">Subjektif (S) - Perkembangan Keluhan Hari Ini</label>
                            <span className="text-[11px] text-gray-400">Anamnesis / respon terapi</span>
                          </div>
                          <textarea 
                            rows={2} 
                            value={subjektif}
                            onChange={(e) => setSubjektif(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400" 
                            placeholder="Keluhan pasien saat divisit (misal: demam mulai turun, mual berkurang, nyeri ulu hati membaik)..."
                          />
                        </div>

                        {/* Objektif & TTV */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Objektif (O) - Tanda Vital & Pemeriksaan Fisik Terarah</label>
                          
                          {/* Mini Vital Signs Grid */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2 p-2 bg-slate-50 border border-slate-200 text-xs">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">TD Sistolik</span>
                              <input 
                                type="text" 
                                placeholder="120"
                                value={tandaVital.tdSistolik}
                                onChange={(e) => setTandaVital({ ...tandaVital, tdSistolik: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">TD Diastolik</span>
                              <input 
                                type="text" 
                                placeholder="80"
                                value={tandaVital.tdDiastolik}
                                onChange={(e) => setTandaVital({ ...tandaVital, tdDiastolik: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">Nadi (HR)</span>
                              <input 
                                type="text" 
                                placeholder="80"
                                value={tandaVital.nadi}
                                onChange={(e) => setTandaVital({ ...tandaVital, nadi: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">Suhu (°C)</span>
                              <input 
                                type="text" 
                                placeholder="36.5"
                                value={tandaVital.suhu}
                                onChange={(e) => setTandaVital({ ...tandaVital, suhu: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">RR (x/m)</span>
                              <input 
                                type="text" 
                                placeholder="20"
                                value={tandaVital.rr}
                                onChange={(e) => setTandaVital({ ...tandaVital, rr: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold">SpO2 (%)</span>
                              <input 
                                type="text" 
                                placeholder="98"
                                value={tandaVital.spo2}
                                onChange={(e) => setTandaVital({ ...tandaVital, spo2: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-1"
                              />
                            </div>
                          </div>

                          <textarea 
                            rows={2} 
                            value={objektif}
                            onChange={(e) => setObjektif(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400" 
                            placeholder="Pemeriksaan fisik terarah, status lokalis, hasil lab harian (misal: trombosit serial, leukosit)..."
                          />
                        </div>

                        {/* Asesmen */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Asesmen (A) - Evaluasi Diagnosis & Status Klinis</label>
                          <textarea 
                            rows={2} 
                            value={asesmen}
                            onChange={(e) => setAsesmen(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400" 
                            placeholder="Kesimpulan medis hari ini (misal: DHF Grade I hari ke-4 perbaikan klinis)..."
                          />
                        </div>

                        {/* Plan */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plan & Terapi Harian (P)</label>
                          <textarea 
                            rows={2} 
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400" 
                            placeholder="Cairan infus, terapi obat oral/injeksi, rencana cek darah rutin besok, diet..."
                          />
                        </div>

                        {/* E-Resep & Terapi Farmasi Rawat Inap */}
                        <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
                              <Pill className="w-4 h-4 text-blue-600" />
                              Terapi Obat & e-Resep Visit (Otomatis Kurangi Stok Farmasi)
                            </label>
                            <span className="text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 font-bold">
                              {prescribedMedicines.length} Obat Ditambahkan
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-800 mb-3">
                            Pilih obat dari katalog faskes untuk diterbitkan ke modul Farmasi dan dicatat pada lembar observasi pemberian obat perawat (MAR).
                          </p>

                          {/* Form Input Item Obat */}
                          <div className="bg-white p-3 border border-blue-200 shadow-xs mb-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              {/* Cari / Pilih Obat */}
                              <div className="sm:col-span-6 relative">
                                <span className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Pilih Obat (Katalog Master)</span>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={selectedObatItem ? `${selectedObatItem.namaObat} (${selectedObatItem.sediaan || 'Tablet'})` : searchObatQuery}
                                    onChange={(e) => {
                                      setSearchObatQuery(e.target.value);
                                      setSelectedObatItem(null);
                                      setIsObatDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsObatDropdownOpen(true)}
                                    placeholder="Ketik nama obat (misal: Paracetamol, Ceftriaxone)..."
                                    className="w-full text-xs text-gray-900 border border-gray-300 p-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  {selectedObatItem ? (
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedObatItem(null); setSearchObatQuery(''); }}
                                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
                                  )}
                                </div>

                                {/* Dropdown Hasil Pencarian Obat */}
                                {isObatDropdownOpen && !selectedObatItem && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-lg max-h-48 overflow-y-auto z-30 text-xs">
                                    {loadingObatCatalog ? (
                                      <div className="p-3 text-center text-gray-400 flex items-center justify-center gap-1.5">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Memuat obat...
                                      </div>
                                    ) : (
                                      obatCatalog
                                        .filter((item: any) =>
                                          !searchObatQuery ||
                                          item.namaObat?.toLowerCase().includes(searchObatQuery.toLowerCase()) ||
                                          item.kodeObat?.toLowerCase().includes(searchObatQuery.toLowerCase())
                                        )
                                        .slice(0, 15)
                                        .map((item: any) => (
                                          <div
                                            key={item.id}
                                            onClick={() => {
                                              setSelectedObatItem(item);
                                              setIsObatDropdownOpen(false);
                                              if (item.sediaan?.toLowerCase().includes('injeksi') || item.sediaan?.toLowerCase().includes('infus')) {
                                                setSelectedObatRute(item.sediaan?.toLowerCase().includes('infus') ? 'Drip Infus' : 'Injeksi IV');
                                                setSelectedObatSigna(item.sediaan?.toLowerCase().includes('infus') ? '20 Tetes/Menit' : '1 x 1 Ampul');
                                              } else {
                                                setSelectedObatRute('Oral');
                                                setSelectedObatSigna('3 x 1 Tablet');
                                              }
                                            }}
                                            className="p-2 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                          >
                                            <div>
                                              <span className="font-bold text-gray-900">{item.namaObat}</span>
                                              <span className="text-[10px] text-gray-500 ml-1.5">({item.sediaan || 'Sediaan Umum'})</span>
                                            </div>
                                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 border border-blue-200">
                                              {item.kategori || 'Obat'}
                                            </span>
                                          </div>
                                        ))
                                    )}
                                    {obatCatalog.filter((item: any) =>
                                      !searchObatQuery ||
                                      item.namaObat?.toLowerCase().includes(searchObatQuery.toLowerCase())
                                    ).length === 0 && !loadingObatCatalog && (
                                      <div className="p-2 text-center text-gray-400">Obat tidak ditemukan</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Jumlah / Qty */}
                              <div className="sm:col-span-2">
                                <span className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Jumlah (Qty)</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={selectedObatQty}
                                  onChange={(e) => setSelectedObatQty(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2"
                                />
                              </div>

                              {/* Rute Pemberian */}
                              <div className="sm:col-span-4">
                                <span className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Rute Pemberian</span>
                                <select
                                  value={selectedObatRute}
                                  onChange={(e) => setSelectedObatRute(e.target.value)}
                                  className="w-full text-xs font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                                >
                                  <option value="Oral">Oral (Minum)</option>
                                  <option value="Injeksi IV">Injeksi IV (Intravena)</option>
                                  <option value="Injeksi IM">Injeksi IM (Intramuskular)</option>
                                  <option value="Drip Infus">Drip Infus</option>
                                  <option value="Subkutan (SC)">Subkutan (SC)</option>
                                  <option value="Topikal / Luar">Topikal / Salep Luar</option>
                                  <option value="Inhalasi / Nebu">Inhalasi / Nebulizer</option>
                                  <option value="Rektal / Supositoria">Rektal / Supositoria</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              {/* Aturan Pakai / Signa */}
                              <div className="sm:col-span-5">
                                <span className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Aturan Pakai / Frekuensi</span>
                                <input
                                  type="text"
                                  value={selectedObatSigna}
                                  onChange={(e) => setSelectedObatSigna(e.target.value)}
                                  placeholder="Contoh: 3 x 1 Tablet, Tiap 8 Jam..."
                                  className="w-full text-xs text-gray-900 border border-gray-300 p-2"
                                />
                              </div>

                              {/* Catatan / Keterangan */}
                              <div className="sm:col-span-5">
                                <span className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Catatan Tambahan (Opsional)</span>
                                <input
                                  type="text"
                                  value={selectedObatCatatan}
                                  onChange={(e) => setSelectedObatCatatan(e.target.value)}
                                  placeholder="Contoh: Sesudah makan, Jika demam > 38.5C..."
                                  className="w-full text-xs text-gray-900 border border-gray-300 p-2"
                                />
                              </div>

                              {/* Tombol Tambah */}
                              <div className="sm:col-span-2 flex items-end">
                                <button
                                  type="button"
                                  onClick={handleAddMedicine}
                                  className="w-full py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center text-xs shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Tabel Obat yang Ditambahkan untuk Visit Hari Ini */}
                          {prescribedMedicines.length > 0 ? (
                            <div className="bg-white border border-blue-200 overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-blue-100/70 text-blue-900 font-bold border-b border-blue-200">
                                  <tr>
                                    <th className="p-2">Nama Obat</th>
                                    <th className="p-2">Rute</th>
                                    <th className="p-2">Jumlah</th>
                                    <th className="p-2">Aturan Pakai / Jadwal</th>
                                    <th className="p-2">Catatan</th>
                                    <th className="p-2 text-center">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prescribedMedicines.map((m, idx) => (
                                    <tr key={m.obatId || idx} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="p-2 font-bold text-gray-900 flex items-center gap-1.5">
                                        <Pill className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                        <span>{m.namaObat}</span>
                                        <span className="text-[10px] text-gray-500 font-normal">({m.sediaan})</span>
                                      </td>
                                      <td className="p-2">
                                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-none font-bold text-[10px]">
                                          {m.rute}
                                        </span>
                                      </td>
                                      <td className="p-2 font-mono font-bold text-gray-900">{m.qty}</td>
                                      <td className="p-2 font-medium text-gray-800">{m.signa}</td>
                                      <td className="p-2 text-gray-500 text-[11px]">{m.catatan || '-'}</td>
                                      <td className="p-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMedicine(m.obatId)}
                                          className="text-red-500 hover:text-red-700 p-1"
                                          title="Hapus Obat"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/70 border border-dashed border-blue-200 text-center text-gray-500 text-xs">
                              Belum ada obat yang ditambahkan untuk visit hari ini. Pilih obat di atas untuk menerbitkan resep terapi baru.
                            </div>
                          )}
                        </div>

                        {/* Instruksi Medis Perawat */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Instruksi Medis Khusus (Untuk Perawat Jaga Shift Bangsal)</label>
                          <textarea 
                            rows={2} 
                            value={instruksiMedis}
                            onChange={(e) => setInstruksiMedis(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400 bg-amber-50/50" 
                            placeholder="Instruksi ke perawat (misal: lapor jika tensi < 90/60, pantau diuresis/jam, berikan paracetamol drip jika T > 38.5C)..."
                          />
                        </div>
                        
                        <button 
                          onClick={handleSimpanCPPT}
                          disabled={isSavingCppt}
                          className="w-full py-3.5 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex justify-center items-center text-sm shadow-sm disabled:opacity-50"
                        >
                          {isSavingCppt ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Menyimpan Catatan & Menyelaraskan ke Rekam Medis (RME)...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Simpan Catatan Visit & Terintegrasi ke RME
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: History CPPT */}
                  <div className="lg:w-80 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-bold text-gray-700 text-sm uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600" /> Riwayat CPPT Pasien
                      </h4>
                      <span className="text-xs bg-gray-200 text-gray-700 font-mono px-2 py-0.5 font-bold">
                        {riwayatCpptList.length} Catatan
                      </span>
                    </div>

                    {loadingCppt ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-600" />
                        Memuat riwayat CPPT...
                      </div>
                    ) : riwayatCpptList.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-4 text-center text-gray-400 text-xs">
                        <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-600 mb-1">Belum Ada Catatan CPPT</p>
                        <p>Catatan visit dokter atau perawat yang disimpan akan muncul secara kronologis di sini.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                        {riwayatCpptList.map((item, idx) => (
                          <div key={item.id || idx} className={`bg-white border-l-4 shadow-sm p-3 text-xs ${item.profesi === 'DOKTER' ? 'border-blue-500' : 'border-emerald-500'}`}>
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1.5">
                              <span className="text-[11px] font-bold text-gray-500">
                                {new Date(item.tanggalCatatan || item.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 font-bold ${item.profesi === 'DOKTER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {item.petugas?.namaLengkap || (item.profesi === 'DOKTER' ? 'Dokter DPJP' : 'Perawat')}
                              </span>
                            </div>
                            <div className="text-gray-700 space-y-1">
                              {item.subjektif && <p><span className="font-bold text-gray-900">S:</span> {item.subjektif}</p>}
                              {item.objektif && <p><span className="font-bold text-gray-900">O:</span> {item.objektif}</p>}
                              {item.tandaVital && (
                                <div className="text-[10px] text-gray-500 flex flex-wrap gap-1 font-mono">
                                  {item.tandaVital.tdSistolik && <span>TD: {item.tandaVital.tdSistolik}/{item.tandaVital.tdDiastolik || '-'}</span>}
                                  {item.tandaVital.nadi && <span>N: {item.tandaVital.nadi}</span>}
                                  {item.tandaVital.suhu && <span>S: {item.tandaVital.suhu}°C</span>}
                                </div>
                              )}
                              {item.asesmen && <p><span className="font-bold text-gray-900">A:</span> {item.asesmen}</p>}
                              {item.plan && <p><span className="font-bold text-gray-900">P:</span> {item.plan}</p>}
                              {item.instruksiMedis && (
                                <div className="mt-1 bg-amber-50 p-1.5 border-l border-amber-300 text-[11px] text-amber-800">
                                  <span className="font-bold">Instruksi:</span> {item.instruksiMedis}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: ASKEP & MONITORING */}
              {activeTab === 'askep' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Tabel Monitoring Harian Shift Perawat */}
                  <div className="bg-white shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50/50">
                      <div>
                        <h3 className="text-lg font-bold text-indigo-800 flex items-center">
                          <ClipboardCheck className="w-5 h-5 mr-2 text-indigo-600" />
                          Tabel Monitoring Harian (Shift Perawat)
                        </h3>
                        <p className="text-xs text-indigo-600/80 mt-0.5">
                          Pencatatan tanda-tanda vital berkala dan keseimbangan cairan per shift jaga.
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsModalTtvShiftOpen(true)}
                        className="flex items-center text-sm bg-indigo-600 text-white px-3.5 py-2 hover:bg-indigo-700 transition-colors font-bold shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Isi Tanda Vital Shift
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold border-b border-gray-300">
                          <tr>
                            <th className="px-4 py-3">Tgl & Shift</th>
                            <th className="px-4 py-3">Tensi (TD)</th>
                            <th className="px-4 py-3">Nadi (HR)</th>
                            <th className="px-4 py-3">Suhu</th>
                            <th className="px-4 py-3">Intake (Cairan)</th>
                            <th className="px-4 py-3">Output (Urine)</th>
                            <th className="px-4 py-3">Perawat / Petugas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const shiftList = riwayatCpptList.filter(item => 
                              item.profesi === 'PERAWAT' || item.tandaVital?.shift || item.tandaVital?.tdSistolik
                            );

                            if (shiftList.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 bg-white">
                                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="font-bold text-gray-600 text-xs mb-1">Belum Ada Catatan Tanda Vital Shift</p>
                                    <p className="text-xs text-gray-400">Klik tombol <strong>&quot;Isi Tanda Vital Shift&quot;</strong> di atas untuk memulai pencatatan observasi keperawatan.</p>
                                  </td>
                                </tr>
                              );
                            }

                            return shiftList.map((item, idx) => {
                              const tgl = item.tanggalCatatan || item.createdAt;
                              const formattedDate = new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                              const formattedTime = new Date(tgl).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                              const shiftName = item.tandaVital?.shift || (item.profesi === 'PERAWAT' ? 'Perawat' : 'Visit');
                              const suhuNum = parseFloat(item.tandaVital?.suhu || '0');
                              const isFever = suhuNum >= 38.0;

                              return (
                                <tr key={item.id || idx} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-gray-900">{formattedDate}</div>
                                    <div className="text-xs text-indigo-600 font-mono font-medium">Shift {shiftName} ({formattedTime})</div>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-gray-800">
                                    {item.tandaVital?.tdSistolik ? `${item.tandaVital.tdSistolik}/${item.tandaVital.tdDiastolik || '-'}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-800 font-mono">
                                    {item.tandaVital?.nadi ? `${item.tandaVital.nadi} x/m` : '-'}
                                  </td>
                                  <td className={`px-4 py-3 font-mono ${isFever ? 'text-red-600 font-bold' : 'text-gray-800'}`}>
                                    {item.tandaVital?.suhu ? `${item.tandaVital.suhu} °C` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-800 font-mono text-xs">
                                    {item.tandaVital?.intake ? `${item.tandaVital.intake} cc` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-800 font-mono text-xs">
                                    {item.tandaVital?.output ? `${item.tandaVital.output} cc` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700 font-medium">
                                    <div className="text-xs font-bold text-gray-800">
                                      {item.petugas?.namaLengkap || (item.profesi === 'PERAWAT' ? 'Perawat Bangsal' : 'Dokter DPJP')}
                                    </div>
                                    {item.subjektif && (
                                      <div className="text-[10px] text-gray-500 italic truncate max-w-xs" title={item.subjektif}>
                                        {item.subjektif}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ceklis Pemberian Terapi Obat (MAR - Medication Administration Record) */}
                  <div className="bg-white shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 flex items-center text-base">
                          <Pill className="w-5 h-5 mr-2 text-indigo-600" />
                          Ceklis Pemberian Terapi Obat (Medication Administration Record)
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Diambil langsung dari e-Resep dokter DPJP. Centang saat obat telah diberikan kepada pasien di bangsal.
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {resepKunjunganList.flatMap(r => r.details || []).length} Item Obat Terdaftar
                      </span>
                    </div>

                    {loadingResepKunjungan ? (
                      <div className="py-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Memuat data terapi obat pasien...
                      </div>
                    ) : (() => {
                      const allDetails = resepKunjunganList.flatMap(r => 
                        (r.details || []).map((d: any) => ({
                          ...d,
                          resepStatus: r.status,
                          tanggalResep: r.tanggalResep || r.createdAt,
                          dokterNama: r.dokter?.namaLengkap || 'Dokter DPJP'
                        }))
                      );

                      if (allDetails.length === 0) {
                        return (
                          <div className="p-6 bg-gray-50 border border-dashed border-gray-300 text-center text-gray-400 text-xs">
                            <Pill className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="font-bold text-gray-600 text-sm mb-1">Belum Ada Terapi Obat yang Diresepkan</p>
                            <p className="max-w-md mx-auto">
                              Dokter DPJP dapat menginput terapi obat melalui tab <strong>Visit Dokter (CPPT)</strong>. Setiap obat yang diresepkan otomatis terhubung ke modul Farmasi dan muncul di sini.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {allDetails.map((detail: any) => {
                            const isGiven = Boolean(ceklisObatState[detail.id]?.diberikan);
                            const adminInfo = ceklisObatState[detail.id];

                            return (
                              <label 
                                key={detail.id}
                                className={`flex items-start space-x-3.5 p-3.5 border transition-all cursor-pointer ${
                                  isGiven 
                                    ? 'border-green-300 bg-green-50/50' 
                                    : 'border-gray-200 bg-gray-50/70 hover:bg-gray-100/70'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isGiven}
                                  onChange={() => toggleCeklisObat(detail.id, detail.obat?.namaObat || 'Obat')}
                                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5 cursor-pointer" 
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold text-sm ${isGiven ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                                        {detail.obat?.namaObat || 'Obat'}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        ({detail.obat?.sediaan || 'Sediaan'}) • Jumlah: {detail.jumlah}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                                      detail.resepStatus === 'SELESAI'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}>
                                      {detail.resepStatus === 'SELESAI' ? 'Obat Siap di Bangsal' : 'Menunggu Farmasi'}
                                    </span>
                                  </div>

                                  <div className="text-xs text-gray-700 font-medium mt-1">
                                    <span>Aturan: {detail.aturanPakai || 'Sesuai instruksi'}</span>
                                    {detail.catatan && (
                                      <span className="text-gray-500 ml-2 italic">({detail.catatan})</span>
                                    )}
                                  </div>

                                  <div className="mt-1.5 flex items-center justify-between text-xs">
                                    {isGiven ? (
                                      <div className="text-green-700 font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span>Diberikan pada {adminInfo?.waktu} WIB oleh {adminInfo?.petugas}</span>
                                      </div>
                                    ) : (
                                      <div className="text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Jadwal: Sesuai Instruksi Medis ({detail.dokterNama})</span>
                                      </div>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      Tgl Resep: {new Date(detail.tanggalResep).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 4: DISCHARGE */}
              {activeTab === 'discharge' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200 border-t-4 border-t-orange-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center justify-between border-b pb-2">
                      <span className="flex items-center">
                        <LogOut className="w-5 h-5 mr-2 text-orange-600" />
                        Rencana Pulang & Finalisasi Tagihan (Discharge Planning)
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {selectedBed.ruangan?.namaRuangan} • {selectedBed.id}
                      </span>
                    </h3>
                    
                    {/* INFO RETRIBUSI & AKOMODASI TEMPAT TIDUR PUSKESMAS */}
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-none shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-indigo-700" />
                          <h4 className="font-bold text-slate-800 text-sm">Biaya Penggunaan Tempat Tidur Puskesmas</h4>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-none border border-amber-300">
                          STATUS LOKET KASIR: DITAHAN (ON-HOLD)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-white p-3.5 border border-blue-100 shadow-sm">
                          <span className="text-gray-500 block mb-1">Durasi Rawat Inap</span>
                          <span className="font-extrabold text-base text-slate-900">{selectedBed.days} Hari</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Dihitung dari waktu masuk inap</span>
                        </div>
                        <div className="bg-white p-3.5 border border-blue-100 shadow-sm">
                          <span className="text-gray-500 block mb-1">Tarif Tempat Tidur Puskesmas</span>
                          <span className="font-extrabold text-base text-emerald-700">Rp 50.000 / Hari</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Flat rate seragam tanpa kelas</span>
                        </div>
                        <div className="bg-white p-3.5 border border-blue-100 shadow-sm">
                          <span className="text-gray-500 block mb-1">Total Biaya Tempat Tidur</span>
                          <span className="font-extrabold text-base text-indigo-700 font-mono">
                            Rp {(selectedBed.days * 50000).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Otomatis masuk ke loket kasir</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-700 mt-3.5 flex items-start gap-2 bg-white/70 p-2.5 border border-blue-100">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                          Pasien rawat inap <strong>belum dapat melakukan pembayaran di loket Kasir</strong> selama masih dirawat karena biaya tempat tidur belum final. Setelah Anda menekan tombol di bawah, tempat tidur ini otomatis berstatus <strong>TERSEDIA</strong> kembali dan tagihan final diteruskan ke loket Kasir.
                        </span>
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Keadaan Keluar (Discharge Disposition)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <label 
                            onClick={() => setKeadaanKeluar('SEMBUH')}
                            className={`border p-3 flex flex-col items-center justify-center cursor-pointer shadow-sm text-center transition-all ${
                              keadaanKeluar === 'SEMBUH' ? 'border-blue-500 bg-blue-50 font-bold text-blue-800' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="discharge" 
                              checked={keadaanKeluar === 'SEMBUH'} 
                              onChange={() => setKeadaanKeluar('SEMBUH')} 
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 mb-1" 
                            />
                            <span className="text-sm">Sembuh / Perbaikan</span>
                          </label>

                          <label 
                            onClick={() => setKeadaanKeluar('PULANG_PAKSA')}
                            className={`border p-3 flex flex-col items-center justify-center cursor-pointer shadow-sm text-center transition-all ${
                              keadaanKeluar === 'PULANG_PAKSA' ? 'border-orange-500 bg-orange-50 font-bold text-orange-800' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="discharge" 
                              checked={keadaanKeluar === 'PULANG_PAKSA'} 
                              onChange={() => setKeadaanKeluar('PULANG_PAKSA')} 
                              className="w-4 h-4 text-orange-600 focus:ring-orange-500 mb-1" 
                            />
                            <span className="text-sm">Pulang Permintaan Sendiri</span>
                          </label>

                          <label 
                            onClick={() => setKeadaanKeluar('RUJUK')}
                            className={`border p-3 flex flex-col items-center justify-center cursor-pointer shadow-sm text-center transition-all ${
                              keadaanKeluar === 'RUJUK' ? 'border-purple-500 bg-purple-50 font-bold text-purple-800' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="discharge" 
                              checked={keadaanKeluar === 'RUJUK'} 
                              onChange={() => setKeadaanKeluar('RUJUK')} 
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 mb-1" 
                            />
                            <span className="text-sm">Rujuk ke RS Lanjutan</span>
                          </label>

                          <label 
                            onClick={() => setKeadaanKeluar('MENINGGAL')}
                            className={`border p-3 flex flex-col items-center justify-center cursor-pointer shadow-sm text-center transition-all ${
                              keadaanKeluar === 'MENINGGAL' ? 'border-red-500 bg-red-50 font-bold text-red-800' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="discharge" 
                              checked={keadaanKeluar === 'MENINGGAL'} 
                              onChange={() => setKeadaanKeluar('MENINGGAL')} 
                              className="w-4 h-4 text-red-600 focus:ring-red-500 mb-1" 
                            />
                            <span className="text-sm">Meninggal Dunia</span>
                          </label>
                        </div>

                        {keadaanKeluar === 'RUJUK' && (
                          <div className="mt-3.5 bg-purple-50 border border-purple-200 p-4 space-y-3">
                            <div className="font-semibold text-purple-900 text-sm flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-purple-600" />
                              Informasi Rujukan Rumah Sakit / Faskes Lanjutan
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Rumah Sakit / Faskes Tujuan</label>
                              <input 
                                type="text" 
                                value={faskesTujuan}
                                onChange={(e) => setFaskesTujuan(e.target.value)}
                                className="w-full border-gray-300 p-2.5 text-sm bg-white text-black focus:ring-purple-500 focus:border-purple-500" 
                                placeholder="Contoh: RSUD Cibinong / RS Sentra Medika"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan & Indikasi Rujukan Medis</label>
                              <textarea 
                                rows={2}
                                value={alasanRujukan}
                                onChange={(e) => setAlasanRujukan(e.target.value)}
                                className="w-full border-gray-300 p-2.5 text-sm bg-white text-black placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500" 
                                placeholder="Kondisi pasien memerlukan fasilitas ICU / Penanganan Dokter Spesialis Bedah / Hemodialisa lanjutan..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* BAGIAN E-RESEP OBAT PULANG (TAKE-HOME MEDICATION) */}
                      <div className="border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-200 pb-3">
                          <div>
                            <h4 className="font-bold text-emerald-900 text-base flex items-center gap-2">
                              <Pill className="w-5 h-5 text-emerald-600" />
                              Resep Obat Pulang (Take-Home Medication)
                            </h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              Obat yang dibawa pulang oleh pasien untuk perawatan di rumah. Otomatis masuk ke tagihan Kasir & memotong stok faskes via Auto-FEFO.
                            </p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {obatPulangList.length} Item Obat Pulang
                          </span>
                        </div>

                        {/* Formulir Tambah Obat Pulang */}
                        <div className="bg-white p-3.5 border border-emerald-200 shadow-xs space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            {/* Autocomplete Cari Obat */}
                            <div className="md:col-span-5 relative">
                              <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Obat dari Katalog</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={searchObatPulang}
                                  onChange={(e) => {
                                    setSearchObatPulang(e.target.value);
                                    setIsObatPulangDropdownOpen(true);
                                  }}
                                  onFocus={() => {
                                    if (obatCatalog.length === 0) fetchObatCatalog();
                                    setIsObatPulangDropdownOpen(true);
                                  }}
                                  placeholder={loadingObatCatalog ? "Memuat katalog obat..." : "Ketik nama obat (contoh: Amoxicillin)..."}
                                  className="w-full border-gray-300 p-2 text-xs bg-white text-black pl-8 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                              </div>

                              {/* Dropdown Hasil Pencarian */}
                              {isObatPulangDropdownOpen && (
                                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl max-h-56 overflow-y-auto">
                                  {obatCatalog
                                    .filter(o => !searchObatPulang || o.namaObat.toLowerCase().includes(searchObatPulang.toLowerCase()) || o.kodeObat?.toLowerCase().includes(searchObatPulang.toLowerCase()))
                                    .slice(0, 15)
                                    .map(o => (
                                      <div
                                        key={o.id}
                                        onClick={() => {
                                          setSelectedObatPulangItem(o);
                                          setSearchObatPulang(o.namaObat);
                                          setIsObatPulangDropdownOpen(false);
                                        }}
                                        className="p-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 flex justify-between items-center text-xs"
                                      >
                                        <div>
                                          <div className="font-bold text-gray-900">{o.namaObat}</div>
                                          <div className="text-[10px] text-gray-500">{o.sediaan || 'Tablet'} • {o.kategori || 'Obat Bebas'}</div>
                                        </div>
                                        <div className="text-right font-mono font-semibold text-emerald-700">
                                          Rp {(o.harga || 10000).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {selectedObatPulangItem && (
                                <div className="mt-1 text-[11px] font-semibold text-emerald-800 flex items-center justify-between bg-emerald-50 p-1.5 border border-emerald-200">
                                  <span>Terpilih: <strong>{selectedObatPulangItem.namaObat}</strong> ({selectedObatPulangItem.sediaan})</span>
                                  <span className="font-mono text-emerald-700">Rp {(selectedObatPulangItem.harga || 10000).toLocaleString('id-ID')} / unit</span>
                                </div>
                              )}
                            </div>

                            {/* Qty */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah (Qty)</label>
                              <input
                                type="number"
                                min={1}
                                value={selectedObatPulangQty}
                                onChange={(e) => setSelectedObatPulangQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border-gray-300 p-2 text-xs bg-white text-black font-mono text-center focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            {/* Aturan Pakai (Signa) */}
                            <div className="md:col-span-3">
                              <label className="block text-xs font-bold text-gray-700 mb-1">Aturan Pakai (Signa)</label>
                              <input
                                type="text"
                                value={selectedObatPulangSigna}
                                onChange={(e) => setSelectedObatPulangSigna(e.target.value)}
                                placeholder="Contoh: 3 x 1 Tablet sesudah makan"
                                className="w-full border-gray-300 p-2 text-xs bg-white text-black focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            {/* Tombol Tambah */}
                            <div className="md:col-span-2 flex items-end">
                              <button
                                type="button"
                                onClick={handleAddObatPulang}
                                className="w-full py-2 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                Tambah
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Rute Pemberian</label>
                              <select
                                value={selectedObatPulangRute}
                                onChange={(e) => setSelectedObatPulangRute(e.target.value)}
                                className="w-full border-gray-300 p-1.5 text-xs bg-white text-black"
                              >
                                <option value="Oral">Oral (Diminum)</option>
                                <option value="Topikal">Topikal (Salep/Oles)</option>
                                <option value="Sublingual">Sublingual (Bawah Lidah)</option>
                                <option value="Inhalasi">Inhalasi (Dihisap)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Catatan Minum di Rumah (Opsional)</label>
                              <input
                                type="text"
                                value={selectedObatPulangCatatan}
                                onChange={(e) => setSelectedObatPulangCatatan(e.target.value)}
                                placeholder="Contoh: Habiskan antibiotik / Diminum hanya saat nyeri"
                                className="w-full border-gray-300 p-1.5 text-xs bg-white text-black placeholder:text-gray-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tabel Daftar Resep Obat Pulang */}
                        {obatPulangList.length > 0 ? (
                          <div className="overflow-x-auto border border-emerald-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                              <thead className="bg-emerald-100/60 font-bold text-emerald-900">
                                <tr>
                                  <th className="px-3 py-2 text-left">Nama Obat Pulang</th>
                                  <th className="px-3 py-2 text-center">Jumlah</th>
                                  <th className="px-3 py-2 text-left">Aturan Pakai & Catatan</th>
                                  <th className="px-3 py-2 text-right">Harga Satuan</th>
                                  <th className="px-3 py-2 text-right">Subtotal</th>
                                  <th className="px-2 py-2 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {obatPulangList.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-emerald-50/50">
                                    <td className="px-3 py-2">
                                      <div className="font-bold text-gray-900">{item.namaObat}</div>
                                      <div className="text-[10px] text-gray-500">{item.sediaan} • {item.rute}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center font-bold text-gray-800">
                                      {item.qty} {item.sediaan}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="font-semibold text-gray-800">{item.signa}</div>
                                      {item.catatan && <div className="text-[10px] text-orange-700 italic">{item.catatan}</div>}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-gray-600">
                                      Rp {(item.harga || 10000).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                                      Rp {((item.harga || 10000) * item.qty).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveObatPulang(item.obatId)}
                                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 transition-colors"
                                        title="Hapus obat"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-emerald-50/70 font-bold border-t border-emerald-200">
                                  <td colSpan={4} className="px-3 py-2 text-right text-emerald-900">
                                    Total Biaya Obat Pulang:
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-black text-emerald-800">
                                    Rp {obatPulangList.reduce((acc, o) => acc + ((o.harga || 10000) * o.qty), 0).toLocaleString('id-ID')}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3 bg-white border border-dashed border-emerald-300 text-center text-xs text-gray-500">
                            Belum ada obat pulang yang ditambahkan. Jika pasien memerlukan obat jalan di rumah, pilih obat pada kolom di atas.
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Edukasi & Petunjuk Perawatan di Rumah</label>
                        <textarea 
                          rows={3} 
                          value={edukasiPulang}
                          onChange={(e) => setEdukasiPulang(e.target.value)}
                          className="w-full border-gray-300 p-3 text-sm rounded-none text-black placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500" 
                          placeholder="Instruksi perawatan luka di rumah, anjuran istirahat, tanda bahaya yang mengharuskan segera kembali ke faskes..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Rencana Kontrol Poliklinik</label>
                        <input 
                          type="date" 
                          value={rencanaKontrol}
                          onChange={(e) => setRencanaKontrol(e.target.value)}
                          className="w-full border-gray-300 p-3 text-sm rounded-none text-black focus:ring-orange-500 focus:border-orange-500" 
                        />
                      </div>

                      {/* CARD ESTIMASI RINCIAN TAGIHAN KASIR */}
                      <div className="border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5 mt-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-indigo-200 pb-2.5">
                          <h4 className="font-bold text-indigo-900 text-sm sm:text-base flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-indigo-600" />
                            Estimasi Rincian Tagihan Kasir Pasien
                          </h4>
                          <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 border border-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            SINKRON DENGAN KASIR
                          </span>
                        </div>

                        {loadingPreviewBilling ? (
                          <div className="py-6 flex flex-col items-center justify-center text-indigo-600 text-xs gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Mengkalkulasi tagihan riil dari sistem Kasir...</span>
                          </div>
                        ) : previewBilling && previewBilling.details && previewBilling.details.length > 0 ? (
                          <div className="space-y-2 text-xs sm:text-sm">
                            {previewBilling.details.map((item: any, idx: number) => {
                              let dotColor = 'bg-gray-400';
                              if (item.kategori === 'Pendaftaran') dotColor = 'bg-blue-500';
                              else if (item.kategori === 'Akomodasi') dotColor = 'bg-purple-500';
                              else if (item.kategori === 'Tindakan') dotColor = 'bg-rose-500';
                              else if (item.kategori === 'Laboratorium') dotColor = 'bg-cyan-500';
                              else if (item.kategori === 'Vaksin') dotColor = 'bg-indigo-500';
                              else if (item.kategori === 'Obat Pulang') dotColor = 'bg-emerald-500';
                              else if (item.kategori === 'Obat') dotColor = 'bg-amber-500';
                              else if (item.kategori === 'Potongan / DP') dotColor = 'bg-red-500';

                              const isMinus = item.subTotal < 0;

                              return (
                                <div key={idx} className="flex justify-between items-center text-gray-700 py-1.5 border-b border-gray-100">
                                  <span className="flex items-center gap-1.5 min-w-0 pr-2">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}></span>
                                    <span className="truncate font-medium">{item.namaItem}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-none bg-gray-100 text-gray-600 font-mono flex-shrink-0">
                                      {item.kategori}
                                    </span>
                                  </span>
                                  <span className={`font-mono font-semibold flex-shrink-0 ${isMinus ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                    {isMinus ? `- Rp ${Math.abs(item.subTotal).toLocaleString('id-ID')}` : `Rp ${item.subTotal.toLocaleString('id-ID')}`}
                                  </span>
                                </div>
                              );
                            })}

                            <div className="flex justify-between items-center pt-2.5 font-bold text-gray-900 border-t-2 border-indigo-200">
                              <div>
                                <span className="text-sm font-extrabold text-indigo-950 block">
                                  Total Estimasi Tagihan Akhir Pasien di Loket Kasir:
                                </span>
                                <span className="text-[10px] text-gray-500 font-normal">
                                  Terhitung otomatis dari Karcis, Bed, Tindakan Medis, Lab, dan Resep Obat
                                </span>
                              </div>
                              <span className="text-xl font-mono font-black text-emerald-700">
                                Rp {(previewBilling.totalBiaya ?? 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between text-gray-700 py-1 border-b border-gray-100">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Biaya Pendaftaran & Karcis Awal
                              </span>
                              <span className="font-mono font-semibold">Rp 15.000</span>
                            </div>
                            <div className="flex justify-between text-gray-700 py-1 border-b border-gray-100">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Akomodasi Tempat Tidur ({selectedBed?.ruangan?.namaRuangan || 'Rawat Inap'} - {selectedBed?.id}) [{selectedBed?.days || 1} Hari]
                              </span>
                              <span className="font-mono font-semibold">Rp {((selectedBed?.days || 1) * 50000).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 font-bold text-gray-900 border-t border-indigo-200">
                              <span className="text-sm font-extrabold text-indigo-950">
                                Total Estimasi Tagihan:
                              </span>
                              <span className="text-lg font-mono font-black text-emerald-700">
                                Rp {(15000 + ((selectedBed?.days || 1) * 50000)).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        if (!selectedBed || selectedBed.status === 'empty') {
                          Swal.fire('Info', 'Pilih tempat tidur yang terisi pasien terlebih dahulu', 'info');
                          return;
                        }

                        const kunjunganId = selectedBed.kunjunganAktif?.id;
                        if (!kunjunganId) {
                          Swal.fire('Peringatan', 'Data kunjungan aktif pasien tidak ditemukan pada bed ini', 'warning');
                          return;
                        }

                        const lamaHari = selectedBed.days || 1;
                        const finalTotal = previewBilling?.totalBiaya !== undefined
                          ? previewBilling.totalBiaya
                          : (15000 + (lamaHari * 50000));

                        const detailsHtml = previewBilling?.details && previewBilling.details.length > 0
                          ? previewBilling.details.map((d: any) => `
                              <div class="flex justify-between py-0.5">
                                <span class="truncate pr-2">${d.namaItem}</span>
                                <span class="font-mono font-semibold ${d.subTotal < 0 ? 'text-red-600' : ''}">
                                  ${d.subTotal < 0 ? '-' : ''}Rp ${Math.abs(d.subTotal).toLocaleString('id-ID')}
                                </span>
                              </div>
                            `).join('')
                          : `
                              <div class="flex justify-between"><span>Biaya Karcis Awal:</span><span class="font-mono">Rp 15.000</span></div>
                              <div class="flex justify-between"><span>Biaya Tempat Tidur:</span><span class="font-mono">Rp ${(lamaHari * 50000).toLocaleString('id-ID')}</span></div>
                            `;

                        const isRujuk = keadaanKeluar === 'RUJUK';
                        const titleModal = isRujuk ? 'Rujuk Pasien ke RS Lanjutan?' : 'Pulangkan Pasien Rawat Inap?';
                        const confirmBtnText = isRujuk ? 'Ya, Rujuk & Teruskan ke Kasir' : 'Ya, Pulangkan & Teruskan ke Kasir';

                        const result = await Swal.fire({
                          title: titleModal,
                          html: `
                            <div class="text-left text-sm space-y-2">
                              <p>Pasien: <strong>${selectedBed.patient}</strong> (${selectedBed.noRM})</p>
                              <p>Kamar & Bed: <strong>${selectedBed.ruangan?.namaRuangan || ''} - ${selectedBed.id}</strong></p>
                              <p>Lama Menginap: <strong>${lamaHari} Hari</strong></p>
                              <div class="bg-gray-50 p-2.5 border border-gray-200 text-xs space-y-1 max-h-48 overflow-y-auto">
                                ${detailsHtml}
                                <hr class="my-1"/>
                                <div class="flex justify-between font-bold text-emerald-800">
                                  <span>Total Tagihan di Kasir:</span>
                                  <span class="font-mono font-black text-sm">Rp ${finalTotal.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                              ${isRujuk ? `<p class="text-purple-700 font-semibold bg-purple-50 p-2 border border-purple-200">Rujukan Tujuan: <strong>${faskesTujuan}</strong></p>` : ''}
                              <hr class="my-2"/>
                              <p class="text-orange-700 font-semibold text-xs">Tempat tidur akan otomatis TERSEDIA kembali dan seluruh akumulasi tagihan langsung masuk ke antrean Loket Kasir dengan nominal yang sama persis.</p>
                            </div>
                          `,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonColor: isRujuk ? '#7e22ce' : '#ea580c',
                          cancelButtonColor: '#64748b',
                          confirmButtonText: confirmBtnText,
                          cancelButtonText: 'Batal'
                        });

                        if (!result.isConfirmed) return;

                        setIsDischarging(true);
                        try {
                          await rawatJalanService.dischargeRawatInap(kunjunganId, {
                            caraKeluar: keadaanKeluar,
                            kondisiDischarge: keadaanKeluar === 'MENINGGAL' ? 'MENINGGAL' : (keadaanKeluar === 'SEMBUH' ? 'SEMBUH' : 'BELUM_SEMBUH'),
                            edukasiPulang,
                            rencanaKontrol,
                            faskesTujuan: isRujuk ? faskesTujuan : undefined,
                            alasanRujukan: isRujuk ? (alasanRujukan || edukasiPulang) : undefined,
                            resepPulang: obatPulangList.map(o => ({
                              obatId: o.obatId,
                              namaObat: o.namaObat,
                              qty: o.qty,
                              signa: o.signa,
                              rute: o.rute,
                              catatan: o.catatan,
                            })),
                          });

                          await Swal.fire({
                            title: isRujuk ? 'Rujukan Berhasil Diterbitkan!' : 'Berhasil Dipulangkan!',
                            text: isRujuk 
                              ? `Rujukan ke ${faskesTujuan} berhasil disimpan. Tempat tidur ${selectedBed.id} kini telah TERSEDIA kembali dan rincian biaya kumulatif telah masuk ke Loket Kasir.`
                              : `Tempat tidur ${selectedBed.id} kini telah TERSEDIA kembali dan rincian biaya rawat inap lengkap (akomodasi, obat inap, dan obat pulang) telah masuk ke antrean Loket Kasir.`,
                            icon: 'success',
                          });

                          setEdukasiPulang('');
                          setRencanaKontrol('');
                          setAlasanRujukan('');
                          setObatPulangList([]);
                          await loadBeds();
                        } catch (err: any) {
                          Swal.fire('Error', err?.response?.data?.message || 'Gagal memulangkan pasien rawat inap', 'error');
                        } finally {
                          setIsDischarging(false);
                        }
                      }}
                      disabled={isDischarging || selectedBed.status === 'empty'}
                      className="w-full py-4 bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex justify-center items-center shadow-md cursor-pointer"
                    >
                      {isDischarging ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Memproses Kepulangan & Sinkronisasi Kasir...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-6 h-6 mr-2" />
                          Finalisasi & Pulangkan Pasien (Teruskan ke Loket Kasir)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <BedDouble className="w-20 h-20 mb-4 text-gray-200" />
            <p className="text-xl font-bold text-gray-400">Silakan pilih Bed yang terisi di panel sebelah kiri</p>
            <p className="text-sm mt-2">Pilih kasur dengan indikator warna biru, merah, atau oranye</p>
          </div>
        )}
      </div>

      {/* MODAL INPUT TANDA VITAL SHIFT PERAWAT */}
      {isModalTtvShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-6 h-6 text-indigo-200" />
                <div>
                  <h3 className="text-base font-bold text-white">Input Tanda Vital Shift Perawat</h3>
                  <p className="text-xs text-indigo-200">
                    Pasien: <span className="font-bold text-white">{selectedBed?.patient || 'Pasien Rawat Inap'}</span> • Bed: <span className="font-bold text-white">{selectedBed?.id}</span> ({selectedBed?.ruangan?.namaRuangan || 'Bangsal'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalTtvShiftOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Pilihan Shift Jaga */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Pilih Shift Jaga Perawat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Pagi', label: 'Shift Pagi (07:00 - 14:00)' },
                    { id: 'Siang', label: 'Shift Siang/Sore (14:00 - 21:00)' },
                    { id: 'Malam', label: 'Shift Malam (21:00 - 07:00)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setModalTtvData({ ...modalTtvData, shift: s.id })}
                      className={`p-2.5 border text-center font-bold transition-all cursor-pointer ${
                        modalTtvData.shift === s.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanda-tanda Vital */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Observasi Tanda Vital
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-200">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">TD Sistolik (mmHg)</span>
                    <input
                      type="text"
                      placeholder="120"
                      value={modalTtvData.tdSistolik}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, tdSistolik: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">TD Diastolik (mmHg)</span>
                    <input
                      type="text"
                      placeholder="80"
                      value={modalTtvData.tdDiastolik}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, tdDiastolik: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">Nadi (x/menit)</span>
                    <input
                      type="text"
                      placeholder="80"
                      value={modalTtvData.nadi}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, nadi: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">Suhu Tubuh (°C)</span>
                    <input
                      type="text"
                      placeholder="36.5"
                      value={modalTtvData.suhu}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, suhu: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">Pernapasan RR (x/menit)</span>
                    <input
                      type="text"
                      placeholder="20"
                      value={modalTtvData.rr}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, rr: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-0.5">Saturasi O2 SpO2 (%)</span>
                    <input
                      type="text"
                      placeholder="98"
                      value={modalTtvData.spo2}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, spo2: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Keseimbangan Cairan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Keseimbangan Cairan (Intake & Output)
                </label>
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 border border-blue-200">
                  <div>
                    <span className="block text-[11px] font-bold text-blue-900 mb-0.5">Intake Cairan (cc)</span>
                    <input
                      type="text"
                      placeholder="Contoh: 500 (Oral + IV Infus)"
                      value={modalTtvData.intake}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, intake: e.target.value })}
                      className="w-full text-xs font-mono text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Total cairan masuk (minum, makan, infus)</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-blue-900 mb-0.5">Output Cairan (cc)</span>
                    <input
                      type="text"
                      placeholder="Contoh: 400 (Urine / Drain)"
                      value={modalTtvData.output}
                      onChange={(e) => setModalTtvData({ ...modalTtvData, output: e.target.value })}
                      className="w-full text-xs font-mono text-gray-900 border border-gray-300 p-2 bg-white"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Total cairan keluar (urin, NGT, drain)</span>
                  </div>
                </div>
              </div>

              {/* Catatan Observasi Perawat */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Catatan Observasi / Keluhan Pasien pada Shift Ini
                </label>
                <textarea
                  rows={2}
                  value={modalTtvData.catatanPerawat}
                  onChange={(e) => setModalTtvData({ ...modalTtvData, catatanPerawat: e.target.value })}
                  placeholder="Catatan perkembangan pasien (misal: infus RL lancar 20 tpm, pasien BAK 1x jernih, keluhan mual berkurang)..."
                  className="w-full border-gray-300 p-2.5 text-xs text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalTtvShiftOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpanTtvShift}
                disabled={isSavingTtvShift}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingTtvShift ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan Observasi...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Simpan Observasi Shift
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
