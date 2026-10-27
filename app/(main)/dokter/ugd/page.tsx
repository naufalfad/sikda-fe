"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User, ClipboardList, Activity, HeartPulse, AlertTriangle, AlertOctagon,
  Send, Clock, Plus, Syringe, BedDouble, CheckCircle2, RefreshCw,
  Search, ShieldAlert, Sparkles, UserCheck, Stethoscope, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import ugdService, { BedUGD, KunjunganUGD } from '../../../../services/ugd.service';
import { asetRuanganService } from '../../../../services/asetRuangan.service';
import { useAuthStore } from '../../../../store/auth.store';
import { useRouter } from 'next/navigation';
import { dokterService, Dokter } from '../../../../services/dokter.service';

// Helper aman untuk membaca data screening (baik bertipe object maupun array)
const getScreeningData = (patient?: KunjunganUGD | null) => {
  if (!patient || !patient.screening) return null;
  if (Array.isArray(patient.screening)) {
    return patient.screening.length > 0 ? patient.screening[0] : null;
  }
  return patient.screening;
};

// Helper aman untuk membaca data rekam medis
const getRekamMedisData = (patient?: KunjunganUGD | null) => {
  if (!patient || !patient.rekamMedis) return null;
  if (Array.isArray(patient.rekamMedis)) {
    return patient.rekamMedis.length > 0 ? patient.rekamMedis[0] : null;
  }
  return patient.rekamMedis;
};

export default function UGDDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isPerawat = user?.role === 'PERAWAT';
  const isDokter = user?.role === 'DOKTER' || user?.role === 'DOKTER_UGD' || (user?.role as string) === 'SUPERADMIN' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'triage' | 'pemeriksaan' | 'keputusan'>('triage');
  const [queue, setQueue] = useState<KunjunganUGD[]>([]);
  // Filter tab antrean UGD: 'my' (Pasien Saya) vs 'all' (Semua Pasien UGD)
  const [queueFilter, setQueueFilter] = useState<'my' | 'all'>('my');
  const [beds, setBeds] = useState<BedUGD[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<KunjunganUGD | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [draftsByPatient, setDraftsByPatient] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Set default tab antrean: Dokter melihat 'my' (Pasien Saya), Perawat melihat 'all' (Semua Pasien)
  useEffect(() => {
    if (isPerawat) {
      setQueueFilter('all');
    } else if (isDokter) {
      setQueueFilter('my');
    }
  }, [isPerawat, isDokter]);

  // Antrean pasien yang di-assign ke user dokter yang sedang login
  const myQueue = useMemo(() => {
    if (!user?.id) return [];
    const userIdStr = String(user.id);
    return queue.filter(k => k.dokterTujuanId === userIdStr || k.dokterTujuan?.id === userIdStr);
  }, [queue, user?.id]);

  const displayedQueue = queueFilter === 'my' ? myQueue : queue;

  // Daftar Dokter Jaga UGD / DPJP
  const [dokterList, setDokterList] = useState<Dokter[]>([]);

  // Urutkan dokter: Dokter Jaga UGD diprioritaskan di atas
  const sortedDokterList = useMemo(() => {
    return [...dokterList].sort((a, b) => {
      if (a.role === 'DOKTER_UGD' && b.role !== 'DOKTER_UGD') return -1;
      if (a.role !== 'DOKTER_UGD' && b.role === 'DOKTER_UGD') return 1;
      return (a.namaLengkap || a.username).localeCompare(b.namaLengkap || b.username);
    });
  }, [dokterList]);

  // Refs untuk mencegah stale closure di background polling interval
  const activePatientIdRef = useRef<string | null>(null);
  const selectedPatientRef = useRef<KunjunganUGD | null>(null);
  const draftsByPatientRef = useRef<Record<string, any>>({});
  const pemeriksaanFormRef = useRef({
    keluhanUtama: '',
    riwayatPenyakit: '',
    pemeriksaanFisik: '',
    rencanaTerapi: '',
    diagnosaAwal: '',
    tindakanKegawatdaruratan: '',
    instruksiMedis: ''
  });

  // Sinkronisasi ref dengan state
  useEffect(() => {
    activePatientIdRef.current = activePatientId;
  }, [activePatientId]);

  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
  }, [selectedPatient]);

  useEffect(() => {
    draftsByPatientRef.current = draftsByPatient;
  }, [draftsByPatient]);

  // Rawat Inap Beds untuk rujukan internal
  const [inapBeds, setInapBeds] = useState<any[]>([]);

  // State Quick Triage Modal (Perawat melakukan Triage & Assign DPJP)
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isSubmittingAdmit, setIsSubmittingAdmit] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    tempatTidurId: '',
    triase: 'MERAH' as 'MERAH' | 'KUNING' | 'HIJAU' | 'HITAM',
    isAnonim: true,
    namaPasien: 'Mr. X (Laki-laki, ~30 th)',
    jenisKelamin: 'Laki-laki',
    perkiraanUmur: 30,
    caraDatang: 'Ambulans',
    keluhanUtama: '',
    dokterId: '',
    tandaVital: {
      sistole: '120',
      diastole: '80',
      nadi: '90',
      suhu: '36.8',
      pernapasan: '20',
      spo2: '98',
      kesadaran: 'Compos Mentis',
      tingkatNyeri: '3'
    }
  });

  // State Form Observasi Triase Perawat UGD (untuk update tanda vital berkala)
  const [triageEditForm, setTriageEditForm] = useState({
    triase: 'MERAH' as 'MERAH' | 'KUNING' | 'HIJAU' | 'HITAM',
    keluhanUtama: '',
    dokterId: '',
    tandaVital: {
      sistole: '',
      diastole: '',
      nadi: '',
      suhu: '',
      pernapasan: '',
      spo2: '',
      kesadaran: 'Compos Mentis',
      tingkatNyeri: '0'
    }
  });
  const [isSavingTriase, setIsSavingTriase] = useState(false);

  // State Form Pemeriksaan Medis Dokter UGD (SOAP)
  const [pemeriksaanForm, setPemeriksaanForm] = useState({
    keluhanUtama: '',
    riwayatPenyakit: '',
    pemeriksaanFisik: '',
    rencanaTerapi: '',
    diagnosaAwal: '',
    tindakanKegawatdaruratan: '',
    instruksiMedis: ''
  });

  // Handler perubahan input form yang aman dan langsung tersimpan ke ref & draft
  const handleFormChange = (field: string, value: string) => {
    setPemeriksaanForm(prev => {
      const updated = { ...prev, [field]: value };
      pemeriksaanFormRef.current = updated;
      const curId = activePatientIdRef.current;
      if (curId) {
        draftsByPatientRef.current = {
          ...draftsByPatientRef.current,
          [curId]: updated
        };
        setDraftsByPatient(draftsByPatientRef.current);
      }
      return updated;
    });
  };

  // Fungsi memilih pasien sekaligus menyimpan & memulihkan draft input tanpa reset
  const selectPatientWithDraft = (patient: KunjunganUGD) => {
    const prevId = activePatientIdRef.current;
    // Simpan draft pasien sebelumnya jika berpindah pasien
    if (prevId && prevId !== patient.id) {
      draftsByPatientRef.current = {
        ...draftsByPatientRef.current,
        [prevId]: pemeriksaanFormRef.current
      };
      setDraftsByPatient(draftsByPatientRef.current);
    }

    setSelectedPatient(patient);
    selectedPatientRef.current = patient;
    setActivePatientId(patient.id);
    activePatientIdRef.current = patient.id;

    // Sinkronisasi data triase & observasi untuk perawat
    const scr = getScreeningData(patient);
    setTriageEditForm({
      triase: (patient.triase || scr?.kategoriTriage || 'MERAH') as any,
      keluhanUtama: scr?.keluhanUtama || patient.keluhanUtama || patient.kondisiTiba || '',
      dokterId: patient.dokterTujuanId || (patient.rekamMedis as any)?.dokterId || '',
      tandaVital: {
        sistole: scr?.tekananDarahSistolik ? String(scr.tekananDarahSistolik) : '',
        diastole: scr?.tekananDarahDiastolik ? String(scr.tekananDarahDiastolik) : '',
        nadi: scr?.nadi ? String(scr.nadi) : '',
        suhu: scr?.suhuTubuh ? String(scr.suhuTubuh) : '',
        pernapasan: scr?.frekuensiNapas ? String(scr.frekuensiNapas) : '',
        spo2: scr?.saturasiOksigen ? String(scr.saturasiOksigen) : '',
        kesadaran: (scr?.dataTambahan as any)?.kesadaran || 'Compos Mentis',
        tingkatNyeri: scr?.skalaNyeri !== undefined ? String(scr.skalaNyeri) : '0'
      }
    });

    // Jika sudah ada draft tersimpan di memory untuk pasien ini, pakai draft itu
    if (draftsByPatientRef.current[patient.id]) {
      const saved = draftsByPatientRef.current[patient.id];
      setPemeriksaanForm(saved);
      pemeriksaanFormRef.current = saved;
    } else {
      // Ambil data awal dari rekam medis / screening pasien
      const rm = getRekamMedisData(patient);
      const initialData = {
        keluhanUtama: rm?.keluhanUtama || scr?.keluhanUtama || patient.keluhanUtama || patient.kondisiTiba || '',
        riwayatPenyakit: rm?.riwayatPenyakitSekarang || '',
        pemeriksaanFisik: rm?.pemeriksaanFisik || (scr ? `TD: ${scr.tekananDarahSistolik || '-'}/${scr.tekananDarahDiastolik || '-'} mmHg, Nadi: ${scr.nadi || '-'} bpm, RR: ${scr.frekuensiNapas || '-'}x/mnt, Suhu: ${scr.suhuTubuh || '-'}°C, SpO2: ${scr.saturasiOksigen || '-'}%` : ''),
        rencanaTerapi: rm?.rencanaTerapi || '',
        diagnosaAwal: '',
        tindakanKegawatdaruratan: '',
        instruksiMedis: rm?.instruksiMedis || ''
      };
      setPemeriksaanForm(initialData);
      pemeriksaanFormRef.current = initialData;
      draftsByPatientRef.current = {
        ...draftsByPatientRef.current,
        [patient.id]: initialData
      };
      setDraftsByPatient(draftsByPatientRef.current);
    }
  };

  // State Keputusan Akhir / Discharge (Dokter UGD)
  const [keputusan, setKeputusan] = useState<'PULANG' | 'RAWAT_INAP' | 'DIRUJUK' | 'MENINGGAL'>('PULANG');
  const [selectedInapBedId, setSelectedInapBedId] = useState('');
  const [catatanBangsal, setCatatanBangsal] = useState('');
  const [faskesRujukan, setFaskesRujukan] = useState('');
  const [alasanRujukan, setAlasanRujukan] = useState('');
  const [isSavingPemeriksaan, setIsSavingPemeriksaan] = useState(false);

  // Fetch data antrean dan bed (dengan parameter isBackground untuk polling)
  const fetchData = async (isBackground = false) => {
    try {
      const [antreanData, bedsData] = await Promise.all([
        ugdService.getAntrean(),
        ugdService.getBeds()
      ]);
      const queueList = antreanData || [];
      setQueue(queueList);
      setBeds(bedsData || []);

      const curId = activePatientIdRef.current;

      // Jika ada pasien yang sedang dibuka/diedit
      if (curId) {
        const found = queueList.find(p => p.id === curId);
        if (found) {
          // Hanya update data metadata pasien, JANGAN PERNAH timpa form input yang sedang diketik
          setSelectedPatient(found);
          selectedPatientRef.current = found;
        } else if (!isBackground) {
          // Pasien sudah tidak ada di antrean (misal setelah discharge) -> Bersihkan pilihan pasien
          setSelectedPatient(null);
          selectedPatientRef.current = null;
          setActivePatientId(null);
          activePatientIdRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to load UGD data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData(false);

    // Fetch daftar dokter jaga UGD / Poli untuk DPJP
    dokterService.getAllDokter()
      .then(docs => {
        setDokterList(docs || []);
      })
      .catch(err => console.error('Failed to load dokter list:', err));

    // Fetch Bed Rawat Inap jika ada keputusan mondok
    asetRuanganService.getBeds({ statusBed: 'TERSEDIA' })
      .then(bList => {
        setInapBeds(bList || []);
        if (bList && bList.length > 0) setSelectedInapBedId(bList[0].id);
      })
      .catch(() => { });

    // Polling setiap 20 detik tanpa mereset form input
    const timer = setInterval(() => {
      fetchData(true);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Helper warna triase
  const getTriageColor = (color?: string) => {
    switch (color?.toUpperCase()) {
      case 'MERAH': return 'bg-red-600 text-white border-red-700';
      case 'KUNING': return 'bg-yellow-400 text-black border-yellow-500';
      case 'HIJAU': return 'bg-green-600 text-white border-green-700';
      case 'HITAM': return 'bg-gray-950 text-white border-black';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // Buka Modal Quick Triage
  const handleOpenAdmitModal = () => {
    const firstAvailableBed = beds.find(b => b.statusBed === 'TERSEDIA');
    const ugdDoctor = dokterList.find(d => d.role === 'DOKTER_UGD');
    const defaultDocId = (user?.role === 'DOKTER_UGD' || user?.role === 'DOKTER')
      ? String(user.id)
      : (ugdDoctor ? ugdDoctor.id : (dokterList.length > 0 ? String(dokterList[0].id) : ''));

    setAdmitForm({
      tempatTidurId: firstAvailableBed ? firstAvailableBed.id : '',
      triase: 'MERAH',
      isAnonim: true,
      namaPasien: 'Mr. X (Laki-laki, ~30 th)',
      jenisKelamin: 'Laki-laki',
      perkiraanUmur: 30,
      caraDatang: 'Ambulans',
      keluhanUtama: '',
      dokterId: defaultDocId,
      tandaVital: {
        sistole: '120',
        diastole: '80',
        nadi: '90',
        suhu: '36.8',
        pernapasan: '20',
        spo2: '98',
        kesadaran: 'Compos Mentis',
        tingkatNyeri: '3'
      }
    });
    setIsAdmitModalOpen(true);
  };

  // Submit Quick Triage Admit Pasien (Oleh Perawat UGD)
  const handleSubmitAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.tempatTidurId) {
      Swal.fire({ icon: 'warning', title: 'Pilih Bed UGD', text: 'Silakan pilih tempat tidur UGD yang tersedia.' });
      return;
    }
    if (!admitForm.dokterId) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Dokter DPJP',
        text: 'Perawat wajib meng-assign Dokter Jaga UGD yang bertugas memeriksa pasien ini.'
      });
      return;
    }
    if (!admitForm.namaPasien) {
      Swal.fire({ icon: 'warning', title: 'Nama Pasien Wajib', text: 'Silakan isi nama pasien atau nama anonim sementara.' });
      return;
    }

    setIsSubmittingAdmit(true);
    try {
      const res = await ugdService.admitPasien(admitForm);
      const assignedDoc = dokterList.find(d => d.id === admitForm.dokterId);
      await Swal.fire({
        icon: 'success',
        title: 'Pasien Berhasil Di-Admit ke Bed UGD!',
        html: `
          <div class="text-left text-sm space-y-2 mt-2">
            <p><strong>Nama:</strong> ${res.pasien?.namaLengkap}</p>
            <p><strong>Nomor Antrean:</strong> <span class="text-rose-600 font-mono font-black text-lg">${res.kunjungan?.noAntrian}</span></p>
            <p><strong>Tempat Tidur:</strong> <span class="bg-blue-100 text-blue-800 px-2 py-0.5 font-bold">${res.bed?.nomorBed}</span></p>
            <p><strong>Kategori Triase:</strong> <span class="font-bold text-red-600">${res.kunjungan?.triase}</span></p>
            <p><strong>Dokter DPJP:</strong> <span class="font-bold text-indigo-700">${assignedDoc?.namaLengkap || 'Dokter Jaga UGD'}</span></p>
            <div class="bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900 mt-2">
              ✓ Triase perawat awal selesai.<br/>
              ✓ Pasien dialihkan ke antrean <strong>Pemeriksaan Medis Dokter (SOAP & Rencana Tindak Lanjut)</strong>.<br/>
              ✓ Petugas pendaftaran dapat melengkapi administrasi resmi.
            </div>
          </div>
        `
      });
      setIsAdmitModalOpen(false);

      // Ambil antrean terbaru dan otomatis buka pasien yang baru di-admit
      const updatedQueue = await ugdService.getAntrean();
      setQueue(updatedQueue || []);
      const newPatient = (updatedQueue || []).find(p => p.id === res?.kunjungan?.id);
      if (newPatient) {
        selectPatientWithDraft(newPatient);
      } else if (updatedQueue && updatedQueue.length > 0) {
        selectPatientWithDraft(updatedQueue[0]);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Admit Pasien UGD',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsSubmittingAdmit(false);
    }
  };

  // Submit Update Observasi Triase oleh Perawat UGD
  const handleSimpanObservasiTriase = async () => {
    if (!selectedPatient) return;

    setIsSavingTriase(true);
    try {
      await ugdService.updateTriase(selectedPatient.id, triageEditForm);
      await Swal.fire({
        icon: 'success',
        title: 'Observasi Triase Diperbarui',
        text: 'Data tanda vital observasi berhasil disimpan. Pasien tetap berada dalam antrean pemeriksaan dokter DPJP.',
        timer: 2000,
        showConfirmButton: false
      });
      await fetchData(false);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memperbarui Triase',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsSavingTriase(false);
    }
  };

  // Submit Pemeriksaan & Discharge Pasien UGD (Hanya oleh Dokter DPJP)
  const handleSimpanPemeriksaan = async () => {
    if (!selectedPatient) return;

    if (isPerawat) {
      Swal.fire({
        icon: 'warning',
        title: 'Wewenang Dokter DPJP',
        text: 'Perawat hanya melakukan triase dan observasi tanda vital. Keputusan tindak lanjut/discharge dan penyelesaian penanganan pasien merupakan wewenang Dokter DPJP.'
      });
      return;
    }

    if (keputusan === 'RAWAT_INAP' && !selectedInapBedId && inapBeds.length > 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Bed Inap', text: 'Silakan pilih kamar dan tempat tidur rawat inap tujuan.' });
      return;
    }
    if (keputusan === 'DIRUJUK' && !faskesRujukan) {
      Swal.fire({ icon: 'warning', title: 'Faskes Rujukan Wajib', text: 'Silakan isi nama Rumah Sakit / Faskes tujuan rujukan.' });
      return;
    }

    const confirmRes = await Swal.fire({
      title: 'Konfirmasi Selesai Penanganan UGD?',
      text: `Pasien ${selectedPatient.namaAnonim || selectedPatient.pasien?.namaLengkap} akan diselesaikan dengan keputusan: ${keputusan}. Tempat tidur UGD akan otomatis dibebaskan kembali.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan & Discharge',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    });

    if (!confirmRes.isConfirmed) return;

    setIsSavingPemeriksaan(true);
    try {
      await ugdService.simpanPemeriksaan(selectedPatient.id, {
        keluhanUtama: pemeriksaanForm.keluhanUtama,
        riwayatPenyakit: pemeriksaanForm.riwayatPenyakit,
        pemeriksaanFisik: pemeriksaanForm.pemeriksaanFisik,
        rencanaTerapi: pemeriksaanForm.rencanaTerapi,
        instruksiMedis: pemeriksaanForm.instruksiMedis,
        keputusan,
        alasanKeputusan: catatanBangsal || alasanRujukan || '',
        tempatTidurInapId: keputusan === 'RAWAT_INAP' ? selectedInapBedId : undefined,
        catatanBangsal: keputusan === 'RAWAT_INAP' ? catatanBangsal : undefined,
        rujukanData: keputusan === 'DIRUJUK' ? {
          faskesTujuan: faskesRujukan,
          alasanRujukan: alasanRujukan || 'Kebutuhan fasilitas rujukan lanjutan'
        } : undefined
      });

      await Swal.fire({
        icon: 'success',
        title: 'Penanganan UGD Selesai!',
        text: `Pasien berhasil di-discharge (${keputusan}) oleh Dokter DPJP. Tempat tidur UGD kini berstatus TERSEDIA kembali.`
      });

      // Bersihkan draft pasien yang selesai
      if (selectedPatient.id) {
        delete draftsByPatientRef.current[selectedPatient.id];
        setDraftsByPatient({ ...draftsByPatientRef.current });
      }
      setSelectedPatient(null);
      selectedPatientRef.current = null;
      setActivePatientId(null);
      activePatientIdRef.current = null;

      await fetchData(false);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Rekam Medis',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsSavingPemeriksaan(false);
    }
  };

  // Otorisasi Kepemilikan DPJP Pasien UGD:
  const isMyPatient = Boolean(
    user?.id && selectedPatient && (
      selectedPatient.dokterTujuanId === String(user.id) ||
      selectedPatient.dokterTujuan?.id === String(user.id)
    )
  );

  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'SUPERADMIN';
  const canEditMedis = isDokter && (isMyPatient || isAdmin);
  const isReadOnlyForOtherDoctor = isDokter && !isMyPatient && !isAdmin;

  // Handler operan jaga / alihkan DPJP ke dokter yang sedang aktif
  const handleTakeOverPatient = async () => {
    if (!selectedPatient) return;
    const result = await Swal.fire({
      title: 'Alihkan Pasien ke Anda?',
      text: `Pasien ${selectedPatient.namaAnonim || selectedPatient.pasien?.namaLengkap} akan dialihkan ke Anda sebagai Dokter DPJP. Akses pengisian SOAP medis akan dibuka untuk Anda.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Ambil Alih Pasien',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await ugdService.updateTriase(selectedPatient.id, {
          dokterId: String(user?.id)
        });
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Dialihkan',
          text: 'Anda sekarang resmi menjadi Dokter DPJP untuk pasien ini. Silakan lanjutkan pemeriksaan SOAP.',
          timer: 1800,
          showConfirmButton: false
        });
        await fetchData(false);
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengalihkan Pasien',
          text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem'
        });
      }
    }
  };

  const availableUGDBeds = beds.filter(b => b.statusBed === 'TERSEDIA');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ============================================================ */}
      {/* LEFT PANEL: UGD QUEUE & BED STATUS */}
      {/* ============================================================ */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">

        {/* Header Panel */}
        <div className="p-4 border-b border-gray-200 bg-rose-50/70">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-black text-rose-800 flex items-center gap-1.5">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              UGD / Gawat Darurat
            </h2>
            <button
              onClick={() => fetchData(false)}
              title="Segarkan Antrean"
              className="p-1 text-gray-500 hover:text-rose-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
            </button>
          </div>

          {/* Quick Admit Button */}
          <button
            onClick={handleOpenAdmitModal}
            className="w-full mt-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm rounded-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Quick Triage Pasien Darurat
          </button>

          {/* Status Bed Ringkas */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 border border-gray-200 text-gray-700 flex justify-between items-center">
              <span>Bed Tersedia:</span>
              <strong className="text-emerald-600 text-xs">{availableUGDBeds.length}</strong>
            </div>
            <div className="bg-white p-2 border border-gray-200 text-gray-700 flex justify-between items-center">
              <span>Bed Terisi:</span>
              <strong className="text-rose-600 text-xs">{beds.length - availableUGDBeds.length}</strong>
            </div>
          </div>
        </div>

        {/* Tab Filter Antrean: Pasien Saya vs Semua Pasien UGD */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setQueueFilter('my')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${queueFilter === 'my'
                ? 'border-rose-600 text-rose-700 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
          >
            <span>Pasien Saya</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${queueFilter === 'my' ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-gray-200 text-gray-600'
              }`}>
              {myQueue.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('all')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${queueFilter === 'all'
                ? 'border-rose-600 text-rose-700 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
          >
            <span>Semua UGD</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${queueFilter === 'all' ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-gray-200 text-gray-600'
              }`}>
              {queue.length}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {displayedQueue.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id;
            const currentBed = patient.tempatTidurs?.[0];
            const scr = getScreeningData(patient);
            const triageColor = patient.triase || scr?.kategoriTriage || 'MERAH';
            const isAssignedToMe = Boolean(user?.id && (patient.dokterTujuanId === String(user.id) || patient.dokterTujuan?.id === String(user.id)));

            return (
              <div
                key={patient.id}
                onClick={() => selectPatientWithDraft(patient)}
                className={`p-3.5 border-l-4 cursor-pointer transition-all ${isSelected
                    ? 'border-l-rose-600 bg-rose-50/60 shadow-md border-y border-r border-rose-200'
                    : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5">
                      {patient.noAntrian}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">{patient.jamRegistrasi}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 font-black uppercase rounded shadow-sm ${getTriageColor(triageColor)}`}>
                    {triageColor}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {patient.namaAnonim || patient.pasien?.namaLengkap}
                  </h3>
                  {patient.isAnonim && (
                    <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded">
                      Anonim
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-blue-700 font-semibold flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-blue-500" />
                    {currentBed ? currentBed.nomorBed : 'Bed UGD'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${patient.statusAdministrasi === 'LENGKAP'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                    {patient.statusAdministrasi === 'LENGKAP' ? 'Admin Lengkap' : 'Pending Loket'}
                  </span>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className={`flex items-center gap-1 truncate max-w-[170px] ${isAssignedToMe ? 'text-emerald-700 font-black' : 'text-indigo-700 font-semibold'}`} title={patient.dokterTujuan?.namaLengkap || 'Belum di-assign'}>
                    <Stethoscope className={`w-3 h-3 flex-shrink-0 ${isAssignedToMe ? 'text-emerald-600' : 'text-indigo-500'}`} />
                    {isAssignedToMe ? '⭐ Pasien Anda' : `DPJP: ${patient.dokterTujuan?.namaLengkap || 'Belum di-assign'}`}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isAssignedToMe
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : patient.statusKunjungan === 'MENUNGGU_DOKTER'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    {isAssignedToMe ? 'Perlu Diperiksa' : (patient.statusKunjungan === 'MENUNGGU_DOKTER' ? 'Menunggu DPJP' : patient.statusKunjungan)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                  {scr?.keluhanUtama || patient.keluhanUtama || patient.kondisiTiba || 'Kondisi kegawatdaruratan'}
                </p>

                <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dokter/rawat-jalan?kunjunganId=${patient.id}`);
                    }}
                    className="w-full py-1 px-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-[11px] font-bold rounded-none flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Buka SOAP di RME Dokter ➔
                  </button>
                </div>
              </div>
            );
          })}

          {displayedQueue.length === 0 && !isLoading && (
            <div className="py-16 text-center text-gray-400 px-4">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-gray-700 text-sm">
                {queueFilter === 'my' ? 'Tidak Ada Pasien yang Di-assign ke Anda' : 'Tidak Ada Pasien Aktif di UGD'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {queueFilter === 'my'
                  ? 'Pasien baru akan muncul setelah perawat melakukan triase awal dan memilih Anda sebagai DPJP.'
                  : 'Gunakan tombol Quick Triage jika pasien gawat darurat baru tiba.'}
              </p>
              {queueFilter === 'my' && queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQueueFilter('all')}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Lihat Semua Pasien UGD ({queue.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANEL: MAIN FORM & EXAMINATION */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Header Pasien UGD Terpilih */}
            {(() => {
              const activeScr = getScreeningData(selectedPatient);
              const activeTriage = selectedPatient.triase || activeScr?.kategoriTriage || 'MERAH';
              return (
                <div className={`p-4 border-b border-gray-200 shadow-sm flex justify-between items-center text-white ${activeTriage === 'MERAH' ? 'bg-red-700' :
                    activeTriage === 'KUNING' ? 'bg-yellow-500 text-black' :
                      activeTriage === 'HIJAU' ? 'bg-green-700' : 'bg-gray-900'
                  }`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center font-black text-xl mr-4 border-2 border-white/40 bg-black/15">
                      {(selectedPatient.namaAnonim || selectedPatient.pasien?.namaLengkap || 'X').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-black">
                          {selectedPatient.namaAnonim || selectedPatient.pasien?.namaLengkap}
                        </h1>
                        {selectedPatient.isAnonim && (
                          <span className="text-[10px] bg-black/30 text-white font-bold uppercase px-2 py-0.5 rounded">
                            Pasien Anonim (Mr./Mrs. X)
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-90 flex items-center mt-1 font-medium gap-3 flex-wrap">
                        <span className="font-mono bg-black/20 px-1.5 py-0.5">
                          Antrean: {selectedPatient.noAntrian}
                        </span>
                        <span>
                          Bed: {selectedPatient.tempatTidurs?.[0]?.nomorBed || 'UGD'}
                        </span>
                        <span>
                          Gender: {selectedPatient.pasien?.jenisKelamin || '-'}
                        </span>
                        <span className="font-bold uppercase tracking-wider">
                          TRIASE: {activeTriage}
                        </span>
                        <span className="bg-black/25 px-2 py-0.5 rounded font-bold text-yellow-200 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5" />
                          DPJP: dr. {selectedPatient.dokterTujuan?.namaLengkap || 'Belum di-assign'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-80 font-mono">
                        Tiba: {selectedPatient.jamRegistrasi || '-'}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-black uppercase rounded shadow-sm ${selectedPatient.statusAdministrasi === 'LENGKAP'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-black animate-pulse'
                        }`}>
                        {selectedPatient.statusAdministrasi === 'LENGKAP' ? '✓ BERKAS LENGKAP' : '⚠ PENDING DI LOKET'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {/* Tombol Akses Cepat ke RME Dokter SOAP */}
                      <button
                        type="button"
                        onClick={() => router.push(`/dokter/rawat-jalan?kunjunganId=${selectedPatient.id}`)}
                        className="px-3.5 py-1.5 bg-white text-rose-900 hover:bg-rose-50 font-black text-xs uppercase tracking-wider rounded shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Stethoscope className="w-4 h-4 text-rose-600" />
                        Buka Pemeriksaan SOAP di RME Dokter ➔
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          selectedPatientRef.current = null;
                          setActivePatientId(null);
                          activePatientIdRef.current = null;
                        }}
                        className="p-1.5 bg-black/25 hover:bg-black/40 text-white rounded shadow transition-colors"
                        title="Tutup Pasien Ini (Kembali ke Antrean Kosong)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Alert Banner jika dibuka oleh Dokter Lain yang BUKAN DPJP */}
            {isReadOnlyForOtherDoctor && (
              <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-200" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block">Bukan Pasien DPJP Anda (Mode Hanya Lihat)</span>
                    <span className="opacity-95">
                      Pasien ini di-assign ke <strong>{selectedPatient.dokterTujuan?.namaLengkap || 'Dokter Lain'}</strong>. Anda tidak dapat mengisi pemeriksaan SOAP atau memutuskan discharge kecuali dilakukan operan jaga.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTakeOverPatient}
                  className="px-3 py-1.5 bg-white text-amber-900 font-bold text-xs uppercase tracking-wider shadow hover:bg-amber-50 transition-colors whitespace-nowrap flex items-center gap-1.5 ml-4"
                >
                  <UserCheck className="w-4 h-4" />
                  Operan Jaga / Alihkan ke Saya
                </button>
              </div>
            )}

            {/* Notification / Context Banner Pemisahan Wewenang */}
            <div className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${isPerawat
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : isReadOnlyForOtherDoctor
                  ? 'bg-amber-50/80 text-amber-950 border-amber-300'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] ${isPerawat ? 'bg-amber-600 text-white' : isReadOnlyForOtherDoctor ? 'bg-amber-700 text-white' : 'bg-blue-600 text-white'
                  }`}>
                  {isPerawat ? 'Perawat UGD' : isReadOnlyForOtherDoctor ? 'Dokter Konsulen / Non-DPJP' : 'Dokter DPJP'}
                </span>
                <span className="font-medium">
                  {isPerawat
                    ? 'Wewenang Perawat: Melakukan Quick Triage, observasi tanda vital, dan assign Dokter DPJP. Pasien selanjutnya diperiksa oleh dokter untuk SOAP dan keputusan tindak lanjut.'
                    : isReadOnlyForOtherDoctor
                      ? `Status Akses: Anda sedang melihat pasien milik dr. ${selectedPatient.dokterTujuan?.namaLengkap || 'DPJP lain'}. Form SOAP terkunci untuk mencegah tumpang tindih rekam medis.`
                      : 'Wewenang Anda (DPJP): Meninjau Triase Perawat, mengisi SOAP Medis, Diagnosa ICD-10, Terapi, serta memutuskan Rencana Tindak Lanjut / Discharge.'}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-600">
                Alur Pasien: <strong className={selectedPatient.statusKunjungan === 'MENUNGGU_DOKTER' ? 'text-amber-700' : 'text-blue-700'}>
                  {selectedPatient.statusKunjungan === 'MENUNGGU_DOKTER' ? 'Menunggu Pemeriksaan Dokter DPJP' : selectedPatient.statusKunjungan}
                </strong>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-gray-200 bg-white shadow-sm z-10">
              <button
                onClick={() => setActiveTab('triage')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'triage'
                    ? 'border-red-600 text-red-700 bg-red-50/40'
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
              >
                1. Triage & Tanda Vital Awal
              </button>
              <button
                onClick={() => setActiveTab('pemeriksaan')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'pemeriksaan'
                    ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
              >
                2. Pemeriksaan Medis (SOAP)
              </button>
              <button
                onClick={() => setActiveTab('keputusan')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'keputusan'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
              >
                3. Keputusan & Discharge
              </button>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">

              {/* TAB 1: TRIAGE & VITAL SIGNS */}
              {activeTab === 'triage' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-red-600" />
                        Hasil Triase Cepat Saat Pasien Tiba di UGD
                      </h3>
                      {isDokter && (
                        <button
                          onClick={() => router.push(`/dokter/rawat-jalan?kunjunganId=${selectedPatient.id}`)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Stethoscope className="w-4 h-4" />
                          Buka SOAP di RME Dokter ➔
                        </button>
                      )}
                    </div>

                    {(() => {
                      const s = getScreeningData(selectedPatient);
                      if (!s) {
                        return (
                          <div className="p-8 bg-gray-50 border border-gray-200 text-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-700">Data triase awal belum tercatat lengkap.</p>
                            <p className="text-xs text-gray-500 mt-1">Belum ada data pemeriksaan triase & vital signs untuk kunjungan ini.</p>
                          </div>
                        );
                      }

                      const kesadaran = (s.dataTambahan as any)?.kesadaran || (s as any).kesadaran || 'Compos Mentis';
                      const triageCat = s.kategoriTriage || selectedPatient.triase || 'MERAH';

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 border border-gray-200 space-y-3">
                              <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                                Tanda-Tanda Vital Saat Pasien Tiba
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-500 block">Tekanan Darah:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {s.tekananDarahSistolik || '-'}/{s.tekananDarahDiastolik || '-'} mmHg
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Denyut Nadi:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {s.nadi ? `${s.nadi} x/mnt` : '-'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Frekuensi Pernapasan:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {s.frekuensiNapas ? `${s.frekuensiNapas} x/mnt` : '-'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Suhu Tubuh:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {s.suhuTubuh ? `${s.suhuTubuh} °C` : '-'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">SpO2 (Saturasi O2):</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {s.saturasiOksigen ? `${s.saturasiOksigen}%` : '-'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Tingkat Kesadaran:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    {kesadaran}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Tingkat Nyeri:</span>
                                  <strong className="text-sm text-gray-900 font-mono">
                                    Skala {s.skalaNyeri ?? '0'} / 10
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Kategori Triase:</span>
                                  <span className={`inline-block text-[10px] px-2 py-0.5 font-black uppercase rounded shadow-sm ${getTriageColor(triageCat)}`}>
                                    {triageCat}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 border border-gray-200 space-y-3">
                              <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                                Kedatangan & Penugasan Medis
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-500 block">Petugas Perawat Triase:</span>
                                  <span className="font-semibold text-gray-800">{s.petugas || selectedPatient.userPendaftar?.namaLengkap || 'Perawat UGD'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Dokter DPJP yang Di-assign:</span>
                                  <span className="font-bold text-indigo-700 flex items-center gap-1 mt-0.5">
                                    <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
                                    dr. {selectedPatient.dokterTujuan?.namaLengkap || 'Belum di-assign'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Cara Kedatangan:</span>
                                  <span className="font-semibold text-gray-800">{s.jenisKedatangan || selectedPatient.caraDatang || 'Ambulans'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Waktu Triase:</span>
                                  <span className="font-semibold text-gray-800 font-mono">
                                    {s.tanggalScreening ? new Date(s.tanggalScreening).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : selectedPatient.jamRegistrasi || '-'} WIB
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Keluhan Utama Saat Masuk:</span>
                                  <p className="font-medium text-rose-700 bg-white p-2 border border-gray-200 mt-1">
                                    {s.keluhanUtama || selectedPatient.keluhanUtama || selectedPatient.kondisiTiba || '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Form Observasi Tanda Vital Lanjutan Khusus Perawat UGD */}
                          {isPerawat && (
                            <div className="mt-6 pt-5 border-t border-gray-200 bg-amber-50/50 p-4 border border-amber-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                    <HeartPulse className="w-4 h-4 text-amber-600" />
                                    Update Observasi Tanda Vital Berkala & Triase (Perawat UGD)
                                  </h4>
                                  <p className="text-[11px] text-amber-700 mt-0.5">
                                    Perbarui tanda vital berkala jika ada perubahan kondisi selama observasi di Bed UGD
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleSimpanObservasiTriase}
                                  disabled={isSavingTriase}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                                >
                                  <HeartPulse className="w-4 h-4" />
                                  {isSavingTriase ? 'Menyimpan...' : 'Simpan Observasi'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Sistole (mmHg)</label>
                                  <input
                                    type="number"
                                    value={triageEditForm.tandaVital.sistole}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, sistole: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Diastole (mmHg)</label>
                                  <input
                                    type="number"
                                    value={triageEditForm.tandaVital.diastole}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, diastole: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Nadi (bpm)</label>
                                  <input
                                    type="number"
                                    value={triageEditForm.tandaVital.nadi}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, nadi: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">SpO2 (%)</label>
                                  <input
                                    type="number"
                                    value={triageEditForm.tandaVital.spo2}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, spo2: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Pernapasan (x/mnt)</label>
                                  <input
                                    type="number"
                                    value={triageEditForm.tandaVital.pernapasan}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, pernapasan: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Suhu (°C)</label>
                                  <input
                                    type="text"
                                    value={triageEditForm.tandaVital.suhu}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, suhu: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Tingkat Kesadaran</label>
                                  <select
                                    value={triageEditForm.tandaVital.kesadaran}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, kesadaran: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5"
                                  >
                                    <option value="Compos Mentis">Compos Mentis</option>
                                    <option value="Apatis">Apatis</option>
                                    <option value="Somnolen">Somnolen</option>
                                    <option value="Sopor">Sopor</option>
                                    <option value="Koma">Koma</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Skala Nyeri (0-10)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={triageEditForm.tandaVital.tingkatNyeri}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      tandaVital: { ...triageEditForm.tandaVital, tingkatNyeri: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Kategori Triase</label>
                                  <select
                                    value={triageEditForm.triase}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      triase: e.target.value as any
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-bold"
                                  >
                                    <option value="MERAH">MERAH - Kritis / Resusitasi</option>
                                    <option value="KUNING">KUNING - Urgent</option>
                                    <option value="HIJAU">HIJAU - Non-Urgent</option>
                                    <option value="HITAM">HITAM - Meninggal (DOA)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">Dokter DPJP yang Di-assign</label>
                                  <select
                                    value={triageEditForm.dokterId}
                                    onChange={e => setTriageEditForm({
                                      ...triageEditForm,
                                      dokterId: e.target.value
                                    })}
                                    className="w-full bg-white border border-gray-300 p-1.5 font-medium"
                                  >
                                    <option value="">-- Tetapkan Dokter DPJP --</option>
                                    {sortedDokterList.map(d => (
                                      <option key={d.id} value={d.id}>
                                        {d.namaLengkap || d.username} {d.role === 'DOKTER_UGD' ? '⭐ (Dokter Jaga UGD)' : `(Poli: ${d.poliklinik?.namaPoli || 'Umum'})`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: PEMERIKSAAN MEDIS SOAP */}
              {activeTab === 'pemeriksaan' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Banner Alur Terintegrasi RME Dokter */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-md flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 border border-white/20">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide">
                          Pemeriksaan SOAP UGD di RME Dokter Terintegrasi
                        </h4>
                        <p className="text-xs text-blue-100 mt-0.5">
                          Sesuai standar operasional, pemeriksaan SOAP UGD (Primary Survey ABCDE, ICD-10, E-Resep, Lab Cito, & Keputusan Discharge) dilakukan di halaman RME Dokter.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/dokter/rawat-jalan?kunjunganId=${selectedPatient.id}`)}
                      className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-105 whitespace-nowrap ml-4"
                    >
                      <Stethoscope className="w-4 h-4 text-blue-700" />
                      Buka di RME Dokter ➔
                    </button>
                  </div>

                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center border-b pb-3">
                      <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                      Pemeriksaan Medis & Tindakan Dokter UGD
                    </h3>

                    {/* Banner Wewenang Dokter jika dilihat oleh Perawat */}
                    {isPerawat && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-5 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                            Wewenang Khusus Dokter DPJP (Mode Hanya Lihat)
                          </h4>
                          <p className="text-xs text-amber-800 mt-1">
                            Pengisian Rekam Medis SOAP (Anamnesis Medis, Pemeriksaan Fisik Lanjutan, Diagnosa Medis ICD-10, Tindakan UGD, dan Resep Obat) merupakan kewenangan Dokter DPJP ({selectedPatient.dokterTujuan?.namaLengkap ? `dr. ${selectedPatient.dokterTujuan.namaLengkap}` : 'Dokter Jaga UGD'}). Akun Perawat berada pada mode <strong>Hanya Lihat (Read-Only)</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Banner Wewenang Dokter jika dilihat oleh Dokter Lain yang BUKAN DPJP */}
                    {isReadOnlyForOtherDoctor && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                              Pasien Di-assign ke Dokter DPJP Lain (Mode Hanya Lihat)
                            </h4>
                            <p className="text-xs text-amber-800 mt-1">
                              Pemeriksaan SOAP medis dan tindakan pada pasien ini merupakan kewenangan <strong>{selectedPatient.dokterTujuan?.namaLengkap ? `dr. ${selectedPatient.dokterTujuan.namaLengkap}` : 'Dokter DPJP lain'}</strong>. Anda tidak dapat mengubah data pemeriksaan pasien ini kecuali dilakukan operan jaga.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleTakeOverPatient}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <UserCheck className="w-4 h-4" />
                          Alihkan ke Saya
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Keluhan Utama Pasien
                        </label>
                        <input
                          type="text"
                          disabled={!canEditMedis}
                          value={pemeriksaanForm.keluhanUtama}
                          onChange={(e) => handleFormChange('keluhanUtama', e.target.value)}
                          className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                          placeholder="Keluhan utama kegawatdaruratan..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Riwayat Penyakit Sekarang & Mekanisme Trauma
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canEditMedis}
                          value={pemeriksaanForm.riwayatPenyakit}
                          onChange={(e) => handleFormChange('riwayatPenyakit', e.target.value)}
                          className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                          placeholder="Kronologi kejadian, onset waktu, gejala yang menyertai..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Pemeriksaan Fisik Lengkap (Secondary Survey / GCS)
                        </label>
                        <textarea
                          rows={3}
                          disabled={!canEditMedis}
                          value={pemeriksaanForm.pemeriksaanFisik}
                          onChange={(e) => handleFormChange('pemeriksaanFisik', e.target.value)}
                          className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                          placeholder="Status lokalis, luka, auskultasi jantung/paru, abdomen, ekstremitas..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Diagnosa Medis
                          </label>
                          <input
                            type="text"
                            disabled={!canEditMedis}
                            value={pemeriksaanForm.diagnosaAwal}
                            onChange={(e) => handleFormChange('diagnosaAwal', e.target.value)}
                            className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                            placeholder="Contoh: Cedera Kepala Ringan, Fraktur Humerus..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Tindakan Kegawatdaruratan
                          </label>
                          <input
                            type="text"
                            disabled={!canEditMedis}
                            value={pemeriksaanForm.tindakanKegawatdaruratan}
                            onChange={(e) => handleFormChange('tindakanKegawatdaruratan', e.target.value)}
                            className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                            placeholder="Contoh: Debridement & Hecting, Pasang IV Line, Oksigen..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Rencana Terapi & Terapi Obat UGD
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canEditMedis}
                          value={pemeriksaanForm.rencanaTerapi}
                          onChange={(e) => handleFormChange('rencanaTerapi', e.target.value)}
                          className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                          placeholder="Analgetik, antibiotik profilaksis, infus cairan..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Instruksi Medis Khusus / Pesan Dokter
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canEditMedis}
                          value={pemeriksaanForm.instruksiMedis}
                          onChange={(e) => handleFormChange('instruksiMedis', e.target.value)}
                          className={`w-full text-xs border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                          placeholder="Instruksi observasi tanda vital berkala, posisi tirah baring..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KEPUTUSAN & DISCHARGE */}
              {activeTab === 'keputusan' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Banner Alur Terintegrasi RME Dokter */}
                  <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 shadow-md flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 border border-white/20">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide">
                          Discharge Planning & Keputusan Akhir di RME Dokter
                        </h4>
                        <p className="text-xs text-emerald-100 mt-0.5">
                          Dokter DPJP dapat menetapkan tindak lanjut (Boleh Pulang, Rawat Inap, Rujuk RS, atau Kematian UGD) dan membebaskan Tempat Tidur UGD melalui alur Discharge Planning di RME Dokter.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/dokter/rawat-jalan?kunjunganId=${selectedPatient.id}`)}
                      className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-105 whitespace-nowrap ml-4"
                    >
                      <Stethoscope className="w-4 h-4 text-emerald-700" />
                      Buka di RME Dokter ➔
                    </button>
                  </div>

                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center border-b pb-3">
                      <Send className="w-5 h-5 mr-2 text-emerald-600" />
                      Discharge & Keputusan Akhir Pasien UGD
                    </h3>

                    {/* Banner Wewenang Rencana Tindak Lanjut jika dilihat oleh Perawat */}
                    {isPerawat && (
                      <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-5 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                            Rencana Tindak Lanjut Diputuskan oleh Dokter DPJP
                          </h4>
                          <p className="text-xs text-rose-800 mt-1">
                            Perawat bertugas melakukan triase dan observasi tanda vital. Proses penanganan pasien UGD <strong>belum selesai sampai tahap triase saja</strong>. Pasien wajib menjalani proses pemeriksaan oleh Dokter DPJP yang di-assign ({selectedPatient.dokterTujuan?.namaLengkap ? `dr. ${selectedPatient.dokterTujuan.namaLengkap}` : 'Dokter Jaga UGD'}), dan Dokter yang berwenang menetapkan rencana tindak lanjut (discharge) serta membebaskan Bed UGD.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Banner Wewenang jika dilihat oleh Dokter Lain */}
                    {isReadOnlyForOtherDoctor && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                              Keputusan Tindak Lanjut Pasien Bukan DPJP Anda (Terkunci)
                            </h4>
                            <p className="text-xs text-amber-800 mt-1">
                              Penetapan discharge/keputusan akhir pasien ini merupakan wewenang <strong>{selectedPatient.dokterTujuan?.namaLengkap ? `dr. ${selectedPatient.dokterTujuan.namaLengkap}` : 'Dokter DPJP'}</strong>. Anda tidak dapat menyelesaikan atau membebaskan bed pasien ini.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleTakeOverPatient}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <UserCheck className="w-4 h-4" />
                          Alihkan ke Saya
                        </button>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                        Pilih Keputusan Akhir Pasien:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <label
                          onClick={() => { if (canEditMedis) setKeputusan('PULANG'); }}
                          className={`p-4 flex flex-col items-center justify-center transition-all text-center border ${!canEditMedis ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${keputusan === 'PULANG'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <input type="radio" disabled={!canEditMedis} checked={keputusan === 'PULANG'} onChange={() => setKeputusan('PULANG')} className="w-4 h-4 text-emerald-600 mb-2" />
                          <span className="font-bold text-sm">Boleh Pulang</span>
                          <span className="text-xs text-gray-500">Pasien Sembuh / Rawat Jalan</span>
                        </label>

                        <label
                          onClick={() => { if (canEditMedis) setKeputusan('RAWAT_INAP'); }}
                          className={`p-4 flex flex-col items-center justify-center transition-all text-center border ${!canEditMedis ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${keputusan === 'RAWAT_INAP'
                              ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <input type="radio" disabled={!canEditMedis} checked={keputusan === 'RAWAT_INAP'} onChange={() => setKeputusan('RAWAT_INAP')} className="w-4 h-4 text-teal-600 mb-2" />
                          <span className="font-bold text-sm">Rawat Inap</span>
                          <span className="text-xs text-teal-600">Pindah ke Bangsal Puskesmas</span>
                        </label>

                        <label
                          onClick={() => { if (canEditMedis) setKeputusan('DIRUJUK'); }}
                          className={`p-4 flex flex-col items-center justify-center transition-all text-center border ${!canEditMedis ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${keputusan === 'DIRUJUK'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <input type="radio" disabled={!canEditMedis} checked={keputusan === 'DIRUJUK'} onChange={() => setKeputusan('DIRUJUK')} className="w-4 h-4 text-indigo-600 mb-2" />
                          <span className="font-bold text-sm">Rujuk ke Luar</span>
                          <span className="text-xs text-indigo-600">Rumah Sakit Lanjutan</span>
                        </label>

                        <label
                          onClick={() => { if (canEditMedis) setKeputusan('MENINGGAL'); }}
                          className={`p-4 flex flex-col items-center justify-center transition-all text-center border ${!canEditMedis ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${keputusan === 'MENINGGAL'
                              ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <input type="radio" disabled={!canEditMedis} checked={keputusan === 'MENINGGAL'} onChange={() => setKeputusan('MENINGGAL')} className="w-4 h-4 text-red-600 mb-2" />
                          <span className="font-bold text-sm">Meninggal Dunia</span>
                          <span className="text-xs text-red-600">DOA / Meninggal di UGD</span>
                        </label>
                      </div>
                    </div>

                    {/* Form Kondisional Sesuai Keputusan */}
                    {keputusan === 'RAWAT_INAP' && (
                      <div className="bg-teal-50/60 border border-teal-200 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                          <BedDouble className="w-4 h-4 text-teal-600" />
                          Alokasi Tempat Tidur Bangsal Rawat Inap
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Pilih Bed Rawat Inap Tersedia *
                          </label>
                          {inapBeds.length > 0 ? (
                            <select
                              disabled={!canEditMedis}
                              value={selectedInapBedId}
                              onChange={e => setSelectedInapBedId(e.target.value)}
                              className={`w-full border border-teal-300 p-2.5 text-xs text-black focus:ring-teal-500 rounded-none font-medium ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            >
                              <option value="">-- Pilih Bed Inap Tersedia --</option>
                              {inapBeds.map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.nomorBed} - {b.ruangan?.namaRuangan || 'Ruang Inap'} ({b.ruangan?.gedung || 'Gedung Utama'}) [Kelas: {b.kelasKamar || 'Reguler'}]
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                              Seluruh bed rawat inap saat ini penuh. Pertimbangkan untuk merujuk pasien ke Rumah Sakit.
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Instruksi Khusus untuk Perawat Bangsal Inap
                          </label>
                          <textarea
                            rows={3}
                            disabled={!canEditMedis}
                            value={catatanBangsal}
                            onChange={e => setCatatanBangsal(e.target.value)}
                            className={`w-full border border-teal-200 p-2.5 text-xs text-black rounded-none focus:ring-teal-500 ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            placeholder="Instruksi cairan, diet, pemantauan tanda vital berkala..."
                          />
                        </div>
                      </div>
                    )}

                    {keputusan === 'DIRUJUK' && (
                      <div className="bg-indigo-50/60 border border-indigo-200 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                          <ClipboardList className="w-4 h-4 text-indigo-600" />
                          Data Rujukan Rumah Sakit / Faskes Lanjutan
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Rumah Sakit Tujuan *
                            </label>
                            <input
                              type="text"
                              disabled={!canEditMedis}
                              value={faskesRujukan}
                              onChange={e => setFaskesRujukan(e.target.value)}
                              placeholder="Misal: RSUD Cibinong / RS PMI Bogor"
                              className={`w-full border border-indigo-200 p-2.5 text-xs text-black rounded-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Alasan Rujukan *
                            </label>
                            <input
                              type="text"
                              disabled={!canEditMedis}
                              value={alasanRujukan}
                              onChange={e => setAlasanRujukan(e.target.value)}
                              placeholder="Kebutuhan ICU, bedah darurat, CT Scan..."
                              className={`w-full border border-indigo-200 p-2.5 text-xs text-black rounded-none ${!canEditMedis ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {keputusan === 'PULANG' && (
                      <div className="bg-emerald-50/60 border border-emerald-200 p-5 text-xs text-emerald-900 space-y-1">
                        <p className="font-bold text-sm">Pasien Dinilai Stabil untuk Rawat Jalan</p>
                        <p>Pasien akan dipindahkan ke status <strong>Menunggu Kasir</strong> untuk penebusan obat / penyelesaian biaya. Tempat tidur UGD akan segera dikosongkan.</p>
                      </div>
                    )}

                    {keputusan === 'MENINGGAL' && (
                      <div className="bg-red-50/60 border border-red-200 p-5 text-xs text-red-900 space-y-1">
                        <p className="font-bold text-sm">Pasien Dinyatakan Meninggal Dunia (Death On Arrival / UGD)</p>
                        <p>Status rekam medis akan dikunci permanen. Bed UGD akan segera disterilisasi.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Footer Action */}
            <div className="bg-white p-4 border-t border-gray-200 flex justify-between items-center shadow-lg z-20">
              <div className="text-xs text-gray-500">
                Bed saat ini: <strong className="text-blue-700">{selectedPatient.tempatTidurs?.[0]?.nomorBed || 'UGD'}</strong> (Otomatis menjadi TERSEDIA setelah discharge)
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    Swal.fire({
                      icon: 'info',
                      title: 'Cetak Lembar UGD',
                      text: `Lembar ringkasan rekam medis gawat darurat pasien ${selectedPatient.namaAnonim || selectedPatient.pasien?.namaLengkap} disiapkan.`
                    });
                  }}
                  className="px-5 py-2 border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 text-xs rounded-none"
                >
                  Cetak Lembar UGD
                </button>

                {/* Tombol aksi khusus Dokter DPJP untuk menyelesaikan / discharge pasien */}
                {canEditMedis ? (
                  <button
                    onClick={handleSimpanPemeriksaan}
                    disabled={isSavingPemeriksaan}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center text-xs uppercase tracking-wider rounded-none shadow-sm transition-all"
                  >
                    <AlertOctagon className="w-4 h-4 mr-2" />
                    {isSavingPemeriksaan ? 'Menyimpan...' : 'Selesaikan & Bebaskan Bed UGD'}
                  </button>
                ) : isReadOnlyForOtherDoctor ? (
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>DPJP: dr. {selectedPatient.dokterTujuan?.namaLengkap || 'Lain'} (Akses Simpan Terkunci)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTakeOverPatient}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-none shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Alihkan ke Saya
                    </button>
                  </div>
                ) : (
                  <div className="text-xs bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Menunggu Pemeriksaan & Keputusan DPJP (dr. {selectedPatient.dokterTujuan?.namaLengkap || 'Jaga UGD'})</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-600">Pilih Pasien UGD dari Daftar Sebelah Kiri</p>
            <p className="text-xs text-gray-400 mt-1">Atau klik tombol "Quick Triage Pasien Darurat" jika pasien baru saja tiba.</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL QUICK TRIAGE & ADMIT PASIEN DARURAT (ANONIM) */}
      {/* ============================================================ */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-none shadow-2xl max-w-3xl w-full border border-gray-300 overflow-hidden my-8">
            <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-200" />
                  Quick Triage: Admit Pasien Gawat Darurat ke Bed UGD
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Input cepat triase perawat / dokter agar pasien segera mendapatkan penanganan di Bed UGD
                </p>
              </div>
              <button
                onClick={() => setIsAdmitModalOpen(false)}
                className="text-rose-200 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Bagian 1: Alokasi Bed, Triase & Penugasan Dokter DPJP */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Pilih Tempat Tidur UGD *
                  </label>
                  {availableUGDBeds.length > 0 ? (
                    <select
                      required
                      value={admitForm.tempatTidurId}
                      onChange={(e) => setAdmitForm({ ...admitForm, tempatTidurId: e.target.value })}
                      className="w-full text-xs border border-rose-300 p-2.5 font-bold text-blue-900 bg-white focus:outline-none focus:border-rose-600"
                    >
                      <option value="">-- Pilih Bed UGD --</option>
                      {availableUGDBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nomorBed} ({b.ruangan?.namaRuangan || 'UGD'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                      Semua Bed UGD sedang terisi!
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Kategori Triase Pasien *
                  </label>
                  <select
                    value={admitForm.triase}
                    onChange={(e) => setAdmitForm({ ...admitForm, triase: e.target.value as any })}
                    className="w-full text-xs border border-rose-300 p-2.5 font-bold bg-white focus:outline-none focus:border-rose-600"
                  >
                    <option value="MERAH">MERAH - Kritis / Resusitasi (Emergency)</option>
                    <option value="KUNING">KUNING - Urgent / Gawat Tidak Darurat</option>
                    <option value="HIJAU">HIJAU - Non-Urgent / Tidak Gawat</option>
                    <option value="HITAM">HITAM - Meninggal Dunia (DOA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Dokter DPJP yang Di-assign *
                  </label>
                  <select
                    required
                    value={admitForm.dokterId}
                    onChange={(e) => setAdmitForm({ ...admitForm, dokterId: e.target.value })}
                    className="w-full text-xs border border-rose-300 p-2.5 font-bold text-indigo-900 bg-white focus:outline-none focus:border-rose-600"
                  >
                    <option value="">-- Pilih Dokter Jaga (DPJP) --</option>
                    {sortedDokterList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.namaLengkap || doc.username} {doc.role === 'DOKTER_UGD' ? '⭐ (Dokter Jaga UGD)' : `(Poli: ${doc.poliklinik?.namaPoli || 'Umum'})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Banner Penjelasan Alur Kerja */}
              <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Alur Pelayanan Gawat Darurat: </span>
                  Perawat UGD melakukan penerimaan, asesmen triase awal, dan meng-assign Dokter DPJP. Pasien kemudian akan diperiksa secara medis oleh Dokter DPJP untuk penegakan SOAP, tindakan medis, dan penetapan rencana tindak lanjut (discharge).
                </div>
              </div>

              {/* Bagian 2: Identitas Pasien (Mendukung Anonim) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Identitas Kedatangan Pasien
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 border border-rose-200">
                    <input
                      type="checkbox"
                      checked={admitForm.isAnonim}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAdmitForm({
                          ...admitForm,
                          isAnonim: checked,
                          namaPasien: checked ? 'Mr. X (Laki-laki, ~30 th)' : ''
                        });
                      }}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Pasien Anonim (Mr. / Mrs. X)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nama Pasien (Sementara / Asli) *
                    </label>
                    <input
                      type="text"
                      required
                      value={admitForm.namaPasien}
                      onChange={(e) => setAdmitForm({ ...admitForm, namaPasien: e.target.value })}
                      placeholder="Contoh: Tn. X / Joko..."
                      className="w-full text-xs border border-gray-300 p-2.5 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={admitForm.jenisKelamin}
                      onChange={(e) => setAdmitForm({ ...admitForm, jenisKelamin: e.target.value })}
                      className="w-full text-xs border border-gray-300 p-2.5 focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Perkiraan Umur (Tahun)
                    </label>
                    <input
                      type="number"
                      value={admitForm.perkiraanUmur}
                      onChange={(e) => setAdmitForm({ ...admitForm, perkiraanUmur: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-gray-300 p-2.5 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Cara Kedatangan Pasien
                    </label>
                    <select
                      value={admitForm.caraDatang}
                      onChange={(e) => setAdmitForm({ ...admitForm, caraDatang: e.target.value })}
                      className="w-full text-xs border border-gray-300 p-2.5 focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Ambulans">Ambulans</option>
                      <option value="Polisi / Lalu Lintas">Polisi / Lalu Lintas</option>
                      <option value="Datang sendiri / Diantar Keluarga">Datang sendiri / Diantar Keluarga</option>
                      <option value="Rujukan Faskes Lain">Rujukan Faskes Lain</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Keluhan Utama & Tanda Vital Awal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                  Tanda Vital & Keluhan Awal
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Keluhan Utama / Alasan Masuk UGD *
                  </label>
                  <input
                    type="text"
                    required
                    value={admitForm.keluhanUtama}
                    onChange={(e) => setAdmitForm({ ...admitForm, keluhanUtama: e.target.value })}
                    placeholder="Contoh: Penurunan kesadaran, kecelakaan lalu lintas, sesak berat..."
                    className="w-full text-xs border border-gray-300 p-2.5 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 border border-gray-200 text-xs">
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">TD Sistole (mmHg)</label>
                    <input
                      type="number"
                      value={admitForm.tandaVital.sistole}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, sistole: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">TD Diastole (mmHg)</label>
                    <input
                      type="number"
                      value={admitForm.tandaVital.diastole}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, diastole: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">Nadi (bpm)</label>
                    <input
                      type="number"
                      value={admitForm.tandaVital.nadi}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, nadi: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">SpO2 (%)</label>
                    <input
                      type="number"
                      value={admitForm.tandaVital.spo2}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, spo2: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">Napas (x/mnt)</label>
                    <input
                      type="number"
                      value={admitForm.tandaVital.pernapasan}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, pernapasan: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-0.5">Suhu (°C)</label>
                    <input
                      type="text"
                      value={admitForm.tandaVital.suhu}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, suhu: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-gray-600 mb-0.5">Tingkat Kesadaran</label>
                    <select
                      value={admitForm.tandaVital.kesadaran}
                      onChange={(e) => setAdmitForm({
                        ...admitForm,
                        tandaVital: { ...admitForm.tandaVital, kesadaran: e.target.value }
                      })}
                      className="w-full border border-gray-300 p-1.5"
                    >
                      <option value="Compos Mentis">Compos Mentis (Sadar Penuh)</option>
                      <option value="Apatis">Apatis</option>
                      <option value="Somnolen">Somnolen (Mengantuk)</option>
                      <option value="Sopor">Sopor / Stupor</option>
                      <option value="Koma">Koma</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmit || availableUGDBeds.length === 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmittingAdmit ? 'Memproses Admit...' : 'Admit Pasien ke Bed UGD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
