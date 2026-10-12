"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BedDouble, Stethoscope, Activity, ClipboardCheck, Clock, User, LogOut, CheckCircle, Save, Plus, Loader2, DollarSign, Calendar, AlertTriangle, Building, FileText, RotateCcw, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { asetRuanganService } from '../../../../services/asetRuangan.service';
import { rawatJalanService } from '../../../../services/rawatJalan.service';
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

  // Simpan CPPT ke Database & Sinkronkan ke RME
  const handleSimpanCPPT = async () => {
    const kunjunganId = selectedBed?.kunjunganAktif?.id;
    if (!kunjunganId) {
      Swal.fire('Perhatian', 'Kunjungan pasien aktif tidak ditemukan pada bed ini.', 'warning');
      return;
    }

    if (!subjektif && !objektif && !asesmen && !plan) {
      Swal.fire('Perhatian', 'Harap isi setidaknya salah satu komponen SOAP sebelum menyimpan.', 'warning');
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
      });

      await Swal.fire({
        icon: 'success',
        title: 'CPPT Berhasil Disimpan!',
        text: 'Catatan perkembangan visit berhasil disimpan dan otomatis terintegrasi ke Rekam Medis (RME) Pasien.',
        timer: 2000,
        showConfirmButton: false,
      });

      // Muat ulang riwayat CPPT dan bed state
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
      loadCpptAndPrevRM(selectedBed.kunjunganAktif.id);
    }
  }, [selectedBed?.kunjunganAktif?.id]);

  useEffect(() => {
    loadBeds();
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
                  <div className="bg-white shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50/50">
                      <h3 className="text-lg font-bold text-indigo-800 flex items-center">
                        <ClipboardCheck className="w-5 h-5 mr-2 text-indigo-600" />
                        Tabel Monitoring Harian (Shift Perawat)
                      </h3>
                      <button className="flex items-center text-sm bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700 transition-colors font-bold shadow-sm">
                        <Plus className="w-4 h-4 mr-1" />
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
                            <th className="px-4 py-3">Perawat</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900">Hari ini</div>
                              <div className="text-xs text-gray-500 font-mono">Pagi (07:00)</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800">110/70</td>
                            <td className="px-4 py-3 text-gray-800">88 x/m</td>
                            <td className="px-4 py-3 text-gray-800">37.2 °C</td>
                            <td className="px-4 py-3 text-gray-800">500 cc (Oral+IV)</td>
                            <td className="px-4 py-3 text-gray-800">400 cc</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">Ns. Siska</td>
                          </tr>
                          <tr className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900">Kemarin</div>
                              <div className="text-xs text-gray-500 font-mono">Malam (22:00)</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800">115/75</td>
                            <td className="px-4 py-3 text-gray-800">92 x/m</td>
                            <td className="px-4 py-3 text-red-600 font-bold">38.5 °C</td>
                            <td className="px-4 py-3 text-gray-800">400 cc</td>
                            <td className="px-4 py-3 text-gray-800">200 cc</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">Ns. Budi</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Catatan Obat */}
                  <div className="bg-white shadow-sm border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">Ceklis Pemberian Terapi Obat</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <input type="checkbox" className="w-5 h-5 text-indigo-600 border-gray-300 rounded" />
                        <div>
                          <div className="font-bold text-gray-900 text-sm">Paracetamol Infus 1000mg / 8 Jam</div>
                          <div className="text-xs text-gray-500">Jadwal: 08:00 WIB</div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <input type="checkbox" className="w-5 h-5 text-indigo-600 border-gray-300 rounded" defaultChecked />
                        <div>
                          <div className="font-bold text-gray-900 text-sm line-through">Pantoprazole IV 40mg</div>
                          <div className="text-xs text-green-600 font-bold">Diberikan pada 07:15 oleh Ns. Siska</div>
                        </div>
                      </label>
                    </div>
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
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Edukasi & Obat Pulang</label>
                        <textarea 
                          rows={3} 
                          value={edukasiPulang}
                          onChange={(e) => setEdukasiPulang(e.target.value)}
                          className="w-full border-gray-300 p-3 text-sm rounded-none text-black placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500" 
                          placeholder="Instruksi perawatan lanjutan di rumah dan resep obat jalan..."
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
                        const estimasiBiaya = lamaHari * 50000;

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
                              <p>Biaya Tempat Tidur: <strong>Rp ${estimasiBiaya.toLocaleString('id-ID')}</strong> (Rp 50.000/hari)</p>
                              ${isRujuk ? `<p class="text-purple-700 font-semibold bg-purple-50 p-2 border border-purple-200">Rujukan Tujuan: <strong>${faskesTujuan}</strong></p>` : ''}
                              <hr class="my-2"/>
                              <p class="text-orange-700 font-semibold">Tempat tidur akan otomatis KOSONG/TERSEDIA dan tagihan final diteruskan ke Loket Kasir.</p>
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
                          });

                          await Swal.fire({
                            title: isRujuk ? 'Rujukan Berhasil Diterbitkan!' : 'Berhasil Dipulangkan!',
                            text: isRujuk 
                              ? `Rujukan ke ${faskesTujuan} berhasil disimpan. Tempat tidur ${selectedBed.id} kini telah TERSEDIA kembali dan rincian biaya rawat inap diteruskan ke antrean Loket Kasir.`
                              : `Tempat tidur ${selectedBed.id} kini telah TERSEDIA kembali dan rincian biaya rawat inap telah masuk ke antrean Loket Kasir.`,
                            icon: 'success',
                          });

                          setEdukasiPulang('');
                          setRencanaKontrol('');
                          setAlasanRujukan('');
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

    </div>
  );
}
