"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Stethoscope, User, FileText, Activity, Syringe, Pill, 
  ClipboardList, CheckCircle2, Clock, Users, Search, Loader2, RefreshCw, TestTubes, Printer,
  FileDown, AlertTriangle, Radio, X
} from 'lucide-react';
import { laboratoriumService } from '@/services/laboratorium.service';
import { kunjunganService } from '@/services/kunjungan.service';
import { useRawatJalanStore } from '@/store/rawatJalan.store';
import { SOAPPayload } from '@/types/rawatJalan.types';
import { AVAILABLE_LAB_TESTS, fillDokterDummyDataHelper } from './rawatJalan.constants';
import Swal from 'sweetalert2';
import QueueSidebar from './components/QueueSidebar';
import PatientHeader from './components/PatientHeader';
import TabSubjektif from './components/TabSubjektif';
import TabObjektif from './components/TabObjektif';
import TabAsesmen from './components/TabAsesmen';
import TabPlan from './components/TabPlan';
import TabLaboratorium from './components/TabLaboratorium';
import TabRadiologi from './components/TabRadiologi';
import TabTindakan from './components/TabTindakan';
import TabResep from './components/TabResep';
import TabRujukan from './components/TabRujukan';
import ScreeningModal from './components/ScreeningModal';
import BerkasRMEPasienView from './components/BerkasRMEPasienView';
import LabResultModal from './components/LabResultModal';
import DoctorActionBar from './components/DoctorActionBar';
import DischargePlanning from './components/DischargePlanning';
import SupportOverlayBanner from './components/SupportOverlayBanner';
import SoapTabBar from './components/SoapTabBar';
import { useReactToPrint } from 'react-to-print';
import { CetakHasilLab } from '@/components/laboratorium/CetakHasilLab';

function DokterRawatJalanContent() {
  const searchParams = useSearchParams();
  const kunjunganIdParam = searchParams.get('kunjunganId');
  const [activeTab, setActiveTab] = useState('SOAP_S');
  const [showSideRmePanel, setShowSideRmePanel] = useState<boolean>(false);
  const [isQueueCollapsed, setIsQueueCollapsed] = useState<boolean>(false);
  const [sideRmeSplitRatio, setSideRmeSplitRatio] = useState<'default' | 'equal' | 'focusRme'>('default');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store
  const {
    antrian, selectedKunjungan, rekamMedis, screeningData, diagnosaList, tindakanList, alergiList, fase,
    isLoadingAntrian, isLoadingRekamMedis, isSaving,
    fetchAntrian, pilihPasien, simpanSOAP, simpanDiagnosa, simpanTindakan, simpanOrderLab, simpanAlergi, selesaikanPemeriksaan, tundaPemeriksaan,
    setFase, simpanResep, simpanRujukan, pulang, clearSelection,
  } = useRawatJalanStore();

  // SOAP local form state
  const [soapData, setSoapData] = useState<SOAPPayload>({});

  // Removed separate ICD10 states since TabAsesmen handles it now
  
  // Tindakan (ICD-9) - Tab Tindakan/Prosedur
  const [selectedProsedur, setSelectedProsedur] = useState<any[]>([]);

  // Resep State (Frontend Only)
  const [obatQuery, setObatQuery] = useState('');
  const [obatResults, setObatResults] = useState<any[]>([]);
  const [selectedObat, setSelectedObat] = useState<any[]>([]);

  // Rujukan State (Frontend Only)
  const [rujukanData, setRujukanData] = useState({
    faskesTujuan: '',
    poliTujuan: '',
    alasanRujukan: '',
  });

  // Screening modal
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  
  // Riwayat RME Dossier View state (Full Workspace)
  const [previewRmePatient, setPreviewRmePatient] = useState<{
    noRM: string;
    namaPasien: string;
    kunjungan?: any;
  } | null>(null);

  const handleOpenRmePreview = (noRM: string, namaPasien: string = '', kunjungan?: any) => {
    // If the currently examined patient is this one, simply switch to RIWAYAT_RME tab!
    if (selectedKunjungan && selectedKunjungan.pasien?.noRM === noRM) {
      setActiveTab('RIWAYAT_RME');
      return;
    }
    // Auto-collapse queue sidebar to give doctor 100% spacious room to inspect dossier
    setIsQueueCollapsed(true);
    setPreviewRmePatient({
      noRM,
      namaPasien,
      kunjungan: kunjungan || antrian.find((k: any) => k.pasien?.noRM === noRM),
    });
  };

  const handleToggleSideRmePanel = () => {
    const next = !showSideRmePanel;
    setShowSideRmePanel(next);
    if (next) {
      // Auto-collapse queue so active examination form & RME panel have maximum width
      setIsQueueCollapsed(true);
      // If doctor was viewing full-tab RME, switch back to clinical examination SOAP_S so left is exam and right is RME
      if (activeTab === 'RIWAYAT_RME') {
        setActiveTab('SOAP_S');
      }
    }
  };

  const handleMulaiPeriksaDariRme = (kunjungan?: any) => {
    const targetKunjungan = kunjungan || antrian.find((k: any) => k.pasien?.noRM === previewRmePatient?.noRM);
    setPreviewRmePatient(null);
    if (targetKunjungan) {
      handlePilihPasien(targetKunjungan);
    }
  };

  // Lab Modal & Print Ref
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [orderLabData, setOrderLabData] = useState<any>(null);
  const [isLoadingLab, setIsLoadingLab] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Hasil_Lab_${selectedKunjungan?.pasien?.namaLengkap || 'Pasien'}`,
  });

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      const opt = {
        margin: 0,
        filename: `Hasil_Lab_${selectedKunjungan?.pasien?.namaLengkap || 'Pasien'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  const openLabModal = async () => {
    if (!selectedKunjungan) return;
    setIsLabModalOpen(true);
    setIsLoadingLab(true);
    try {
      const res = await laboratoriumService.getOrderByKunjungan(selectedKunjungan.id);
      if (res.success && res.data) {
        setOrderLabData(res.data);
      } else {
        setOrderLabData(null);
      }
    } catch (error) {
      console.error('Failed to fetch order lab', error);
      setOrderLabData(null);
    } finally {
      setIsLoadingLab(false);
    }
  };

  // Menunggu Lab Read-Only state
  const [isViewingLabOverlay, setIsViewingLabOverlay] = useState(true);

  useEffect(() => {
    setIsViewingLabOverlay(true);
  }, [selectedKunjungan]);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(384);

  // Fetch antrian on mount
  useEffect(() => {
    fetchAntrian();
  }, [fetchAntrian]);

  // Auto-select kunjungan jika ada parameter kunjunganId (dari Dashboard Dokter)
  useEffect(() => {
    if (kunjunganIdParam && (!selectedKunjungan || selectedKunjungan.id !== kunjunganIdParam)) {
      if (antrian.length > 0) {
        const found = antrian.find((k: any) => k.id === kunjunganIdParam);
        if (found) {
          pilihPasien(found);
          return;
        }
      }

      // Jika belum ditemukan di antrian lokal, ambil langsung via API
      kunjunganService.getKunjunganById(kunjunganIdParam).then((k) => {
        if (k) {
          pilihPasien(k as any);
        }
      }).catch(console.error);
    }
  }, [kunjunganIdParam, antrian, selectedKunjungan, pilihPasien]);

  // Order Lab State
  const [labOrders, setLabOrders] = useState<string[]>([]);
  const [labNote, setLabNote] = useState('');
  
  const handleToggleLab = (test: string) => {
    if (labOrders.includes(test)) {
      setLabOrders(labOrders.filter(t => t !== test));
    } else {
      setLabOrders([...labOrders, test]);
    }
  };

  const availableLabTests = AVAILABLE_LAB_TESTS;

  const [openLabCategories, setOpenLabCategories] = useState<string[]>(
    availableLabTests.filter(c => c.defaultOpen).map(c => c.category)
  );

  const handleToggleLabCategory = (category: string) => {
    if (openLabCategories.includes(category)) {
      setOpenLabCategories(openLabCategories.filter(c => c !== category));
    } else {
      setOpenLabCategories([...openLabCategories, category]);
    }
  };

  // Reset local prescription & procedure state when patient changes
  useEffect(() => {
    setSelectedObat([]);
    setSelectedProsedur([]);
    setObatQuery('');
    setRujukanData({ faskesTujuan: '', poliTujuan: '', alasanRujukan: '' });
  }, [selectedKunjungan?.id]);

  // Sync SOAP data when rekamMedis or screeningData is loaded
  useEffect(() => {
    if (rekamMedis || screeningData) {
      setSoapData(prev => ({
        ...prev,
        keluhanUtama: rekamMedis?.keluhanUtama || screeningData?.keluhanUtama || prev.keluhanUtama || '',
        riwayatPenyakitSekarang: rekamMedis?.riwayatPenyakitSekarang || screeningData?.dataTambahan?.riwayat?.riwayatPenyakitSekarang || prev.riwayatPenyakitSekarang || '',
        riwayatPenyakitDahulu: rekamMedis?.riwayatPenyakitDahulu || screeningData?.dataTambahan?.riwayat?.riwayatPenyakitDahulu || prev.riwayatPenyakitDahulu || '',
        riwayatAlergi: rekamMedis?.riwayatAlergi || screeningData?.dataTambahan?.riwayat?.riwayatAlergi || prev.riwayatAlergi || '',
        alergiArr: (alergiList && alergiList.length > 0) 
          ? alergiList.map(a => ({
              alergiId: a.alergiId,
              nama_alergi: a.alergiMaster?.nama_alergi || a.manifestasiNama,
              manifestasiKode: a.manifestasiKode,
              manifestasiNama: a.manifestasiNama,
              tingkatKeparahan: a.tingkatKeparahan
            }))
          : (prev.alergiArr || []),
        keadaanUmum: rekamMedis?.keadaanUmum || 'Tampak Sakit Ringan',
        kesadaran: rekamMedis?.kesadaran || screeningData?.dataTambahan?.triage?.kesadaran || 'Compos Mentis (Sadar Penuh)',
        pemeriksaanFisik: rekamMedis?.pemeriksaanFisik || prev.pemeriksaanFisik || '',
        diagnosisKlinis: rekamMedis?.diagnosisKlinis || prev.diagnosisKlinis || '',
        rencanaTerapi: rekamMedis?.rencanaTerapi || prev.rencanaTerapi || '',
        instruksiMedis: rekamMedis?.instruksiMedis || prev.instruksiMedis || '',
        odontogram: rekamMedis?.odontogram || prev.odontogram || {},
        dmft: rekamMedis?.dmft || prev.dmft || undefined,
        oralFindings: rekamMedis?.oralFindings || prev.oralFindings || {},
      }));
    }
  }, [rekamMedis, screeningData, alergiList]);

  // Sync order lab data when loaded
  useEffect(() => {
    if (selectedKunjungan?.orderLab) {
      setLabOrders(selectedKunjungan.orderLab.details.map((d: any) => d.parameter));
      setLabNote(selectedKunjungan.orderLab.catatanKlinis || '');
    } else {
      setLabOrders([]);
      setLabNote('');
    }

    // Sync Resep
    if (selectedKunjungan?.resep && Array.isArray(selectedKunjungan.resep)) {
      const activeResep = selectedKunjungan.resep[selectedKunjungan.resep.length - 1];
      if (activeResep?.details) {
        setSelectedObat(activeResep.details.map((d: any) => ({
          obatId: d.obatId,
          namaObat: d.obat?.namaObat || 'Obat',
          kategori: d.obat?.kategori || 'Obat',
          sediaan: d.obat?.sediaan || 'Tablet',
          qty: d.jumlah,
          signa: d.aturanPakai,
          catatan: d.catatan || '',
          noBatch: d.noBatch || null,
        })));
      }
    } else {
      setSelectedObat([]);
    }
  }, [selectedKunjungan]);

  // Sync diagnosa from store when loaded (put it into soapData.diagnosisArr instead of selectedDiagnoses)
  useEffect(() => {
    if (diagnosaList.length > 0) {
      setSoapData(prev => ({
        ...prev,
        diagnosisArr: diagnosaList.map(d => ({
          icd10Id: d.icd10.id_icd10,
          kode_icd10: d.icd10.kode_icd10,
          nama_diagnosis: d.icd10.nama_diagnosis,
          jenisDiagnosis: d.jenisDiagnosis,
        }))
      }));
    }
  }, [diagnosaList]);

  // Sync tindakan from store when loaded
  useEffect(() => {
    if (tindakanList && tindakanList.length > 0) {
      setSelectedProsedur(tindakanList.map(t => ({
        icd9Id: t.icd9Id,
        kode_icd9: t.icd9.kode,
        nama_prosedur: t.icd9.deskripsi,
        pelaksana: t.pelaksanaTeks || 'Dokter',
        catatan: t.catatanTindakan || '',
      })));
    } else {
      setSelectedProsedur([]);
    }
  }, [tindakanList]);

  // Auto-scroll tab
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const fillDokterDummyData = () => fillDokterDummyDataHelper(setSoapData);

  // ─── Handlers ───
  const handlePilihPasien = (kunjungan: any) => {
    // 1. Cek apakah ada pasien lain yang sedang DIPERIKSA (kecuali diri sendiri)
    const isExaminingOther = selectedKunjungan && selectedKunjungan.id !== kunjungan.id;
    
    if (isExaminingOther) {
      Swal.fire({
        icon: 'warning',
        title: 'Beralih Pasien?',
        text: `Anda sedang memeriksa ${selectedKunjungan.pasien.namaLengkap}. Simpan sebagai draf dan alihkan ke ${kunjungan.pasien.namaLengkap}?`,
        showCancelButton: true,
        confirmButtonText: 'Ya, Alihkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#f59e0b'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await tundaPemeriksaan(soapData);
            setPreviewRmePatient(null);
            setIsQueueCollapsed(true);
            pilihPasien(kunjungan);
          } catch {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menunda pemeriksaan pasien sebelumnya.' });
          }
        }
      });
      return;
    }

    // 2. Jika pasien baru (MENUNGGU_DOKTER), minta konfirmasi dengan opsi buka berkas RME
    if (kunjungan.statusKunjungan === 'MENUNGGU_DOKTER' || kunjungan.statusKunjungan === 'MENUNGGU') {
      Swal.fire({
        title: 'Mulai Pemeriksaan?',
        html: `
          <div style="font-size: 13px; text-align: left; line-height: 1.5; color: #334155;">
            <p>Anda akan memulai pemeriksaan untuk <strong>${kunjungan.pasien.namaLengkap}</strong> (No. RM: <code>${kunjungan.pasien.noRM}</code>).</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 8px;">
              💡 <em>Anda dapat meninjau riwayat kunjungan & rekam medis sebelumnya secara leluasa terlebih dahulu jika diperlukan.</em>
            </p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#2563eb',
        denyButtonColor: '#4f46e5',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, Mulai Periksa',
        denyButtonText: '📂 Buka Berkas RME Lengkap',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          setPreviewRmePatient(null);
          setIsQueueCollapsed(true);
          pilihPasien(kunjungan);
        } else if (result.isDenied) {
          handleOpenRmePreview(kunjungan.pasien.noRM, kunjungan.pasien.namaLengkap, kunjungan);
        }
      });
      return;
    }

    // 3. Bypass untuk pasien yang sudah pernah DIPERIKSA, MENUNGGU_LAB, dll
    setPreviewRmePatient(null);
    setIsQueueCollapsed(true);
    pilihPasien(kunjungan);
  };

  const handleRemoveProsedur = (kode: string) => {
    setSelectedProsedur(selectedProsedur.filter(p => p.kode_icd9 !== kode));
  };

  const handleSaveSOAP = async () => {
    try {
      await simpanSOAP(soapData);
      Swal.fire({ icon: 'success', title: 'SOAP Disimpan!', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan data SOAP' });
    }
  };

  const handleSaveDiagnosa = async () => {
    if (!soapData.diagnosisArr || soapData.diagnosisArr.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Pilih minimal satu diagnosa ICD-10.' });
      return;
    }
    try {
      const payload = soapData.diagnosisArr.map(d => ({
        icd10Id: d.icd10Id,
        kode_icd10: d.kode_icd10,
        nama_diagnosis: d.nama_diagnosis,
        jenisDiagnosis: d.jenisDiagnosis,
      }));
      await simpanDiagnosa(payload);
      Swal.fire({ icon: 'success', title: 'Diagnosa Disimpan!', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan diagnosa' });
    }
  };

  const handleSelesaikan = async () => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan Pemeriksaan?',
      text: 'Pastikan semua data SOAP dan diagnosa sudah lengkap.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5',
    });
    if (!confirm.isConfirmed) return;

    try {
      // Save SOAP terlebih dahulu
      await simpanSOAP(soapData);
      
      // Save alergi jika ada
      if (soapData.alergiArr) {
        await simpanAlergi(soapData.alergiArr);
      }

      // Save diagnosa jika ada
      if (soapData.diagnosisArr && soapData.diagnosisArr.length > 0) {
        const payload = soapData.diagnosisArr.map(d => ({
          icd10Id: d.icd10Id,
          kode_icd10: d.kode_icd10,
          nama_diagnosis: d.nama_diagnosis,
          jenisDiagnosis: d.jenisDiagnosis,
        }));
        await simpanDiagnosa(payload);
      }
      // Save tindakan jika ada
      if (selectedProsedur.length > 0) {
        const tPayload = selectedProsedur.map(p => ({
          icd9Id: p.id_icd9 || p.icd9Id, // bisa datang dari search (id_icd9) atau DB (icd9Id)
          pelaksana: p.pelaksana,
          catatan: p.catatan,
        }));
        await simpanTindakan(tPayload);
      }
      // Save e-Resep dengan alokasi Batch FEFO
      if (selectedObat.length > 0) {
        const rPayload = selectedObat.map(o => ({
          obatId: o.obatId,
          qty: parseInt(String(o.qty)) || 1,
          signa: o.signa || '3 x 1 Tablet sesudah makan',
          catatan: o.catatan || '',
          noBatch: o.noBatch || null,
        }));
        await simpanResep(rPayload);
      }
      // Selesaikan
      await selesaikanPemeriksaan();
      setSelectedObat([]);
      setSelectedProsedur([]);
      setSoapData({});
      setActiveTab('SOAP_S');
      setIsQueueCollapsed(false);
      setShowSideRmePanel(false);
      Swal.fire({ icon: 'success', title: 'Pemeriksaan Berhasil Disimpan!', text: 'Data rekam medis tersimpan. Pasien diteruskan ke antrian Kasir & Farmasi.', timer: 2500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyelesaikan pemeriksaan' });
    }
  };

  const handleSaveResepOnly = async () => {
    if (!selectedObat || selectedObat.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Pilih minimal satu obat untuk disimpan ke resep.' });
      return;
    }
    try {
      const rPayload = selectedObat.map(o => ({
        obatId: o.obatId,
        qty: parseInt(String(o.qty)) || 1,
        signa: o.signa || '3 x 1 Tablet sesudah makan',
        catatan: o.catatan || '',
        noBatch: o.noBatch || null,
      }));
      await simpanResep(rPayload);
      Swal.fire({ icon: 'success', title: 'Resep Tersimpan!', text: 'e-Resep pasien berhasil diteruskan ke Farmasi.', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan e-resep.' });
    }
  };

  const handleTundaPemeriksaan = async () => {
    Swal.fire({
      title: 'Tunda Pemeriksaan?',
      text: 'Rekam medis akan disimpan sebagai draf dan pasien akan dikembalikan ke antrean.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tunda',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#f59e0b',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await tundaPemeriksaan(soapData);
          setIsQueueCollapsed(false);
          setShowSideRmePanel(false);
          Swal.fire({ icon: 'success', title: 'Ditunda', text: 'Pemeriksaan berhasil ditunda.', timer: 1500, showConfirmButton: false });
        } catch {
          Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menunda pemeriksaan.' });
        }
      }
    });
  };

  // Hitung usia
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  // ─── Tabs ───
  const tabs = [
    { id: 'SOAP_S', label: 'S (Subjektif)', icon: <User className="w-4 h-4 mr-2" /> },
    { id: 'SOAP_O', label: 'O (Objektif)', icon: <Stethoscope className="w-4 h-4 mr-2" /> },
    { id: 'SOAP_A', label: 'A (Asesmen & Diagnosa)', icon: <FileText className="w-4 h-4 mr-2" /> },
    { id: 'SOAP_P', label: 'P (Plan)', icon: <ClipboardList className="w-4 h-4 mr-2" /> },
    { id: 'LABORATORIUM', label: 'Laboratorium', icon: <TestTubes className="w-4 h-4 mr-2" /> },
    { id: 'RADIOLOGI', label: 'Radiologi', icon: <Radio className="w-4 h-4 mr-2" /> },
    { id: 'TINDAKAN', label: 'Tindakan Medis', icon: <Activity className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: QUEUE */}
      <QueueSidebar 
        sidebarWidth={sidebarWidth} 
        setSidebarWidth={setSidebarWidth} 
        antrian={antrian} 
        fetchAntrian={fetchAntrian} 
        isLoadingAntrian={isLoadingAntrian} 
        selectedKunjungan={selectedKunjungan} 
        pilihPasien={handlePilihPasien} 
        getAge={getAge}
        onIntipRme={handleOpenRmePreview}
        isCollapsed={isQueueCollapsed}
        onToggleCollapse={() => setIsQueueCollapsed(!isQueueCollapsed)}
      />

      {/* RIGHT PANEL: MAIN FORM OR DOSSIER VIEW */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden min-w-0">
        {previewRmePatient ? (
          <BerkasRMEPasienView
            noRM={previewRmePatient.noRM}
            namaPasien={previewRmePatient.namaPasien}
            kunjunganSaatIni={previewRmePatient.kunjungan}
            onClose={() => setPreviewRmePatient(null)}
            onMulaiPeriksa={previewRmePatient.kunjungan ? handleMulaiPeriksaDariRme : undefined}
          />
        ) : selectedKunjungan ? (
          <>
            {/* Header Pasien */}
            <PatientHeader 
              selectedKunjungan={selectedKunjungan} 
              screeningData={screeningData}
              alergiList={alergiList}
              getAge={getAge} 
              setIsScreeningModalOpen={setIsScreeningModalOpen} 
              onOpenRiwayatTab={() => {
                setShowSideRmePanel(false);
                setActiveTab('RIWAYAT_RME');
              }}
              showSideRmePanel={showSideRmePanel}
              onToggleSideRmePanel={handleToggleSideRmePanel}
              isQueueCollapsed={isQueueCollapsed}
              onToggleQueue={() => setIsQueueCollapsed(!isQueueCollapsed)}
              queueCount={antrian.length}
            />

            {/* Status Banner Penunjang & Loading Overlay Component */}
            <SupportOverlayBanner 
              isLoadingRekamMedis={isLoadingRekamMedis}
              selectedKunjungan={selectedKunjungan}
              isViewingLabOverlay={isViewingLabOverlay}
              setIsViewingLabOverlay={setIsViewingLabOverlay}
              fetchAntrian={fetchAntrian}
              openLabModal={openLabModal}
            />

            {!isLoadingRekamMedis && fase === 2 && (
              <DischargePlanning />
            )}

            {!isLoadingRekamMedis && fase === 1 && (
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* LEFT PANE: ACTIVE CLINICAL EXAMINATION FORM */}
                <div className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
                  showSideRmePanel
                    ? sideRmeSplitRatio === 'equal'
                      ? 'w-full lg:w-1/2 border-r-2 border-slate-300'
                      : sideRmeSplitRatio === 'focusRme'
                        ? 'w-full lg:w-5/12 border-r-2 border-slate-300'
                        : 'w-full lg:w-7/12 border-r-2 border-slate-300'
                    : 'w-full'
                }`}>
                  {/* Form Tabs Component */}
                <SoapTabBar 
                  activeTab={activeTab} 
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    if (tab === 'RIWAYAT_RME') {
                      setShowSideRmePanel(false);
                    }
                  }} 
                  scrollContainerRef={scrollContainerRef} 
                />

                {/* Tab Content */}
                <fieldset className="contents">
                {activeTab === 'RIWAYAT_RME' ? (
                  <div className="flex-1 overflow-hidden h-full">
                    <BerkasRMEPasienView 
                      noRM={selectedKunjungan.pasien.noRM}
                      namaPasien={selectedKunjungan.pasien.namaLengkap}
                      isEmbeddedTab={true}
                    />
                  </div>
                ) : (
                  <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all ${showSideRmePanel ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}`}>
                    <div className={`mx-auto bg-white shadow-sm border border-gray-200 rounded-none overflow-hidden transition-all ${showSideRmePanel ? 'w-full' : 'max-w-5xl'}`}>
                      
                      {/* TAB S: Subjektif */}
                      {activeTab === 'SOAP_S' && (
                        <TabSubjektif soapData={soapData} setSoapData={setSoapData} setActiveTab={setActiveTab} screeningData={screeningData} />
                      )}

                      {/* TAB O: Objektif */}
                      {activeTab === 'SOAP_O' && (
                        <TabObjektif 
                          soapData={soapData} 
                          setSoapData={setSoapData} 
                          setActiveTab={setActiveTab} 
                          openLabModal={openLabModal} 
                        isPoliGigi={Boolean(selectedKunjungan?.poliklinik?.namaPoli?.toLowerCase().includes('gigi'))}
                      />
                    )}

                    {/* TAB A: Asesmen */}
                    {activeTab === 'SOAP_A' && (
                      <TabAsesmen soapData={soapData} setSoapData={setSoapData} setActiveTab={setActiveTab} />
                    )}

                    {/* TAB P: Plan */}
                    {activeTab === 'SOAP_P' && (
                      <TabPlan soapData={soapData} setSoapData={setSoapData} setActiveTab={setActiveTab} />
                    )}

                    {/* Removed TabDiagnosa Component from here since it's merged into TabAsesmen */}

                    {/* TAB: Order Laboratorium */}
                    {activeTab === 'LABORATORIUM' && (
                      <TabLaboratorium 
                        availableLabTests={availableLabTests} 
                        openLabCategories={openLabCategories} 
                        handleToggleLabCategory={handleToggleLabCategory} 
                        labOrders={labOrders} 
                        handleToggleLab={handleToggleLab} 
                        labNote={labNote} 
                        setLabNote={setLabNote} 
                        isSaving={isSaving} 
                        selectedKunjungan={selectedKunjungan} 
                        simpanOrderLab={simpanOrderLab} 
                        clearSelection={clearSelection} 
                        fetchAntrian={fetchAntrian} 
                        setActiveTab={setActiveTab} 
                      />
                    )}

                    {/* TAB: Order Radiologi */}
                    {activeTab === 'RADIOLOGI' && (
                      <TabRadiologi 
                        kunjunganId={selectedKunjungan.id}
                        isPoliGigi={Boolean(selectedKunjungan?.poliklinik?.namaPoli?.toLowerCase().includes('gigi'))}
                        setActiveTab={setActiveTab}
                      />
                    )}

                    {/* TAB: Tindakan ICD-9 */}
                    {activeTab === 'TINDAKAN' && (
                      <TabTindakan 
                        selectedProsedur={selectedProsedur} 
                        setSelectedProsedur={setSelectedProsedur} 
                        handleRemoveProsedur={handleRemoveProsedur} 
                      />
                    )}

                    {/* TAB RESEP OBAT */}
                    {activeTab === 'RESEP' && (
                      <TabResep 
                        obatQuery={obatQuery} 
                        setObatQuery={setObatQuery} 
                        selectedObat={selectedObat} 
                        setSelectedObat={setSelectedObat}
                        kunjunganId={selectedKunjungan?.id}
                        faskesId={selectedKunjungan?.poliklinik?.faskesId}
                        onSaveResep={handleSaveResepOnly}
                        isSaving={isSaving}
                      />
                    )}

                    {/* TAB RUJUKAN */}
                    {activeTab === 'RUJUKAN' && (
                      <TabRujukan rujukanData={rujukanData} setRujukanData={setRujukanData} />
                    )}

                  </div>
                </div>
                )}
              </fieldset>

                {/* Bottom Footer Actions Component */}
                <DoctorActionBar 
                  fillDummyData={fillDokterDummyData}
                  handleTundaPemeriksaan={handleTundaPemeriksaan}
                  handleSaveSOAP={handleSaveSOAP}
                  handleSelesaikan={handleSelesaikan}
                  isSaving={isSaving}
                  isMenungguLab={false}
                />
              </div>

              {/* RIGHT PANE: SIDE-BY-SIDE RME DOSSIER PANEL (COLLAPSIBLE / HIDEABLE) */}
              {showSideRmePanel && (
                <div className={`hidden lg:flex ${
                  sideRmeSplitRatio === 'equal'
                    ? 'lg:w-1/2'
                    : sideRmeSplitRatio === 'focusRme'
                      ? 'lg:w-7/12'
                      : 'lg:w-5/12'
                } h-full flex-col overflow-hidden bg-slate-100 shadow-xl border-l-2 border-indigo-200 animate-in slide-in-from-right duration-200`}>
                  {/* Header Panel Samping */}
                  <div className="bg-indigo-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b-2 border-indigo-700 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-indigo-300 shrink-0" />
                      <div className="truncate">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
                          Riwayat Medis Pasien (Berdampingan)
                        </h4>
                        <span className="text-[10px] text-indigo-200 font-mono">
                          No. RM: {selectedKunjungan.pasien.noRM}
                        </span>
                      </div>
                    </div>

                    {/* Width ratio toggles & Close button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="hidden xl:flex items-center bg-indigo-950 p-0.5 border border-indigo-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setSideRmeSplitRatio('default')}
                          className={`px-2 py-0.5 transition-colors ${sideRmeSplitRatio === 'default' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'}`}
                          title="Fokus Input Pemeriksaan (60% Form : 40% RME)"
                        >
                          60:40
                        </button>
                        <button
                          type="button"
                          onClick={() => setSideRmeSplitRatio('equal')}
                          className={`px-2 py-0.5 transition-colors ${sideRmeSplitRatio === 'equal' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'}`}
                          title="Proporsi Seimbang (50% Form : 50% RME)"
                        >
                          50:50
                        </button>
                        <button
                          type="button"
                          onClick={() => setSideRmeSplitRatio('focusRme')}
                          className={`px-2 py-0.5 transition-colors ${sideRmeSplitRatio === 'focusRme' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'}`}
                          title="Fokus Baca Riwayat RME (40% Form : 60% RME)"
                        >
                          40:60
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSideRmePanel(false)}
                        className="p-1 px-2.5 bg-indigo-800 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-600 shadow-sm"
                        title="Sembunyikan Panel RME (Kembali ke Tampilan Penuh)"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tutup</span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    <BerkasRMEPasienView 
                      noRM={selectedKunjungan.pasien.noRM}
                      namaPasien={selectedKunjungan.pasien.namaLengkap}
                      isEmbeddedTab={true}
                      isSidePanel={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-16 h-16 bg-blue-100/70 text-blue-600 flex items-center justify-center rounded-none mb-4 shadow-sm border border-blue-200">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1.5">
              Pelayanan Rawat Jalan & Poliklinik
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Silakan pilih pasien di panel antrean sebelah kiri untuk memulai pemeriksaan, atau gunakan tombol <strong>RME Lalu</strong> untuk meninjau berkas rekam medis pasien secara leluasa sebelum memanggil.
            </p>

            {antrian.length > 0 && (
              <div className="bg-white border border-slate-200 p-5 shadow-sm max-w-md w-full text-left space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Pasien Antrean Terdepan
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                    No. {antrian[0].noAntrian}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{antrian[0].pasien?.namaLengkap}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    No. RM: {antrian[0].pasien?.noRM} • {antrian[0].poliklinik?.namaPoli || 'Poli'} • {getAge(antrian[0].pasien?.tanggalLahir)} Thn ({antrian[0].pasien?.jenisKelamin})
                  </p>
                  {antrian[0].screening?.keluhanUtama && (
                    <p className="text-xs text-slate-600 italic mt-1.5 bg-slate-50 p-2 border border-slate-200">
                      &quot;{antrian[0].screening.keluhanUtama}&quot;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenRmePreview(antrian[0].pasien?.noRM, antrian[0].pasien?.namaLengkap, antrian[0])}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Buka Berkas RME Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePilihPasien(antrian[0])}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Mulai Periksa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCREENING MODAL */}
      <ScreeningModal 
        isScreeningModalOpen={isScreeningModalOpen} 
        setIsScreeningModalOpen={setIsScreeningModalOpen} 
        screeningData={screeningData} 
      />

      {/* LAB RESULT MODAL COMPONENT */}
      <LabResultModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        isLoading={isLoadingLab}
        orderLabData={orderLabData}
        handlePrint={handlePrint}
        handleDownloadPdf={handleDownloadPdf}
        printRef={printRef}
      />
    </div>
  );
}

export default function DokterRawatJalanPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-gray-600">Memuat Modul Rawat Jalan...</p>
        </div>
      </div>
    }>
      <DokterRawatJalanContent />
    </Suspense>
  );
}
