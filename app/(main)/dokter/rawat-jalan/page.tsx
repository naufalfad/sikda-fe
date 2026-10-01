"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Stethoscope, User, FileText, Activity, Syringe, Pill, 
  ClipboardList, CheckCircle2, Clock, Users, Search, Loader2, RefreshCw, TestTubes, Printer,
  FileDown, AlertTriangle, Radio
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
import RiwayatRMEModal from './components/RiwayatRMEModal';
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
  
  // Riwayat RME modal
  const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);

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
            pilihPasien(kunjungan);
          } catch {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menunda pemeriksaan pasien sebelumnya.' });
          }
        }
      });
      return;
    }

    // 2. Jika pasien baru (MENUNGGU_DOKTER), minta konfirmasi
    if (kunjungan.statusKunjungan === 'MENUNGGU_DOKTER' || kunjungan.statusKunjungan === 'MENUNGGU') {
      Swal.fire({
        title: 'Mulai Pemeriksaan?',
        text: `Anda akan memulai pemeriksaan untuk ${kunjungan.pasien.namaLengkap}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#d1d5db',
        confirmButtonText: 'Ya, Mulai',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          pilihPasien(kunjungan);
        }
      });
      return;
    }

    // 3. Bypass untuk pasien yang sudah pernah DIPERIKSA, MENUNGGU_LAB, dll
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
      // Selesaikan
      await selesaikanPemeriksaan();
      setActiveTab('SOAP_S');
      Swal.fire({ icon: 'success', title: 'Pemeriksaan Berhasil Disimpan!', text: 'Data rekam medis tersimpan. Pasien diteruskan ke antrian Farmasi / Selesai.', timer: 2500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyelesaikan pemeriksaan' });
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
      />

      {/* RIGHT PANEL: MAIN FORM */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden min-w-0">
        {selectedKunjungan ? (
          <>
            {/* Header Pasien */}
            <PatientHeader 
              selectedKunjungan={selectedKunjungan} 
              screeningData={screeningData}
              alergiList={alergiList}
              getAge={getAge} 
              setIsScreeningModalOpen={setIsScreeningModalOpen} 
              setIsRiwayatModalOpen={setIsRiwayatModalOpen}
            />

            {/* Status Banner Penunjang & Loading Overlay Component */}
            <SupportOverlayBanner 
              isLoadingRekamMedis={isLoadingRekamMedis}
              selectedKunjungan={selectedKunjungan}
              isViewingLabOverlay={isViewingLabOverlay}
              setIsViewingLabOverlay={setIsViewingLabOverlay}
              fetchAntrian={fetchAntrian}
            />

            {!isLoadingRekamMedis && selectedKunjungan.statusKunjungan !== 'MENUNGGU_LAB' && fase === 2 && (
              <DischargePlanning />
            )}

            {!isLoadingRekamMedis && 
             (selectedKunjungan.statusKunjungan !== 'MENUNGGU_LAB' && selectedKunjungan.statusKunjungan !== 'MENUNGGU_RADIOLOGI' || !isViewingLabOverlay) && 
             fase === 1 && (
              <>
                {/* Form Tabs Component */}
                <SoapTabBar 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  scrollContainerRef={scrollContainerRef} 
                />

                {/* Tab Content */}
                <fieldset disabled={selectedKunjungan.statusKunjungan === 'MENUNGGU_LAB'} className="contents">
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="max-w-5xl mx-auto bg-white shadow-sm border border-gray-200 rounded-none overflow-hidden">
                    
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
                      />
                    )}

                    {/* TAB RUJUKAN */}
                    {activeTab === 'RUJUKAN' && (
                      <TabRujukan rujukanData={rujukanData} setRujukanData={setRujukanData} />
                    )}

                  </div>
                </div>
              </fieldset>

                {/* Bottom Footer Actions Component */}
                <DoctorActionBar 
                  fillDummyData={fillDokterDummyData}
                  handleTundaPemeriksaan={handleTundaPemeriksaan}
                  handleSaveSOAP={handleSaveSOAP}
                  handleSelesaikan={handleSelesaikan}
                  isSaving={isSaving}
                  isMenungguLab={selectedKunjungan.statusKunjungan === 'MENUNGGU_LAB'}
                />
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-semibold">Pilih pasien dari daftar antrian sebelah kiri</p>
          </div>
        )}
      </div>

      {/* SCREENING MODAL */}
      <ScreeningModal 
        isScreeningModalOpen={isScreeningModalOpen} 
        setIsScreeningModalOpen={setIsScreeningModalOpen} 
        screeningData={screeningData} 
      />

      {/* RIWAYAT RME MODAL */}
      <RiwayatRMEModal
        isOpen={isRiwayatModalOpen}
        onClose={() => setIsRiwayatModalOpen(false)}
        noRM={selectedKunjungan?.pasien?.noRM || ''}
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
