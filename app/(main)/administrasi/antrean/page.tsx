"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Smartphone, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Volume2, 
  UserCheck, 
  QrCode, 
  ClipboardEdit, 
  Building2, 
  Sparkles, 
  CheckCheck, 
  Loader2, 
  Filter, 
  ArrowRight, 
  ExternalLink, 
  ShieldAlert, 
  Phone, 
  Calendar, 
  UserPlus,
  Heart,
  Eye,
  Layers,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { kunjunganService } from '@/services/kunjungan.service';
import { portalPasienService } from '@/services/portalPasien.service';
import ugdService, { KunjunganUGD } from '@/services/ugd.service';
import { pasienService } from '@/services/pasien.service';
import { useAuthStore } from '@/store/auth.store';
import Swal from 'sweetalert2';

function PusatAntreanContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab state: LOKET | ONLINE | UGD_PENDING
  const initialTab = (searchParams.get('tab') as 'LOKET' | 'ONLINE' | 'UGD_PENDING') || 'LOKET';
  const [activeTab, setActiveTab] = useState<'LOKET' | 'ONLINE' | 'UGD_PENDING'>(initialTab);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as 'LOKET' | 'ONLINE' | 'UGD_PENDING';
    if (tabFromUrl && ['LOKET', 'ONLINE', 'UGD_PENDING'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: 'LOKET' | 'ONLINE' | 'UGD_PENDING') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/administrasi/antrean?${params.toString()}`);
  };

  // Live Clock & Loading State
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [antreanLoket, setAntreanLoket] = useState<any[]>([]);
  const [onlineBookings, setOnlineBookings] = useState<any[]>([]);
  const [pendingUgdList, setPendingUgdList] = useState<KunjunganUGD[]>([]);
  const [masterPoli, setMasterPoli] = useState<any[]>([]);
  const [statsSummary, setStatsSummary] = useState({
    totalHariIni: 0,
    menunggu: 0,
    sedangDilayani: 0,
    selesai: 0,
    prioritasLansia: 0,
    prioritasHamil: 0,
    prioritasDisabilitas: 0
  });

  // Filters for Tab 1 (Loket Walk-in)
  const [searchLoket, setSearchLoket] = useState('');
  const [filterStatusLoket, setFilterStatusLoket] = useState('Semua');
  const [filterPoliLoket, setFilterPoliLoket] = useState('Semua');
  const [filterPrioritasLoket, setFilterPrioritasLoket] = useState('Semua');

  // Filters for Tab 2 (Online WhatsApp)
  const [onlineSearch, setOnlineSearch] = useState('');
  const [quickCheckInKode, setQuickCheckInKode] = useState('');
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);

  // Filters & Modal for Tab 3 (Pending UGD)
  const [pendingUgdSearch, setPendingUgdSearch] = useState('');
  const [selectedUgdKunjungan, setSelectedUgdKunjungan] = useState<KunjunganUGD | null>(null);
  const [isModalLengkapiOpen, setIsModalLengkapiOpen] = useState(false);
  const [isSubmittingLengkapi, setIsSubmittingLengkapi] = useState(false);
  const [isSearchingNik, setIsSearchingNik] = useState(false);
  const [nikLookupStatus, setNikLookupStatus] = useState<{
    status: 'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND';
    message: string;
    noRM?: string;
    pasienName?: string;
  }>({ status: 'IDLE', message: '' });
  const [existingPasienId, setExistingPasienId] = useState<string | null>(null);

  // Modal Cetak Karcis Antrean
  const [karcisPrintData, setKarcisPrintData] = useState<any | null>(null);

  const [formDataLengkapi, setFormDataLengkapi] = useState({
    nik: '',
    noRM: '',
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '1995-01-01',
    alamatKtp: '',
    noHp: '',
    jenisPenjamin: 'Umum',
    noBpjs: '',
    kontakDarurat: '',
    hubunganKontakDarurat: 'Keluarga',
    noHpDarurat: ''
  });

  // Fetch All Modules Data
  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [dashRes, onlineRes, ugdRes] = await Promise.allSettled([
        kunjunganService.getDashboardStats(),
        portalPasienService.getFaskesBookings({ faskesId: user?.faskesId || undefined }),
        ugdService.getPendingAdministrasi()
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const val = dashRes.value;
        setAntreanLoket(val.antrean || []);
        setMasterPoli(val.poli || []);
        if (val.stats) {
          setStatsSummary({
            totalHariIni: val.stats.totalHariIni || 0,
            menunggu: val.stats.menunggu || 0,
            sedangDilayani: val.stats.sedangDilayani || 0,
            selesai: val.stats.selesai || 0,
            prioritasLansia: val.stats.prioritas?.lansia || 0,
            prioritasHamil: val.stats.prioritas?.hamilMenyusui || 0,
            prioritasDisabilitas: val.stats.prioritas?.disabilitas || 0
          });
        }
      }

      if (onlineRes.status === 'fulfilled' && onlineRes.value?.success) {
        setOnlineBookings(onlineRes.value.data || []);
      }

      if (ugdRes.status === 'fulfilled' && ugdRes.value) {
        setPendingUgdList(ugdRes.value || []);
      }
    } catch (err) {
      console.error('Error fetching antrean data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh interval 20 detik
    const autoRefresh = setInterval(() => {
      fetchData(true);
    }, 20000);
    return () => clearInterval(autoRefresh);
  }, []);

  // -------------------------------------------------------------------------
  // VOICE CALLER (Text to Speech Panggilan Antrean)
  // -------------------------------------------------------------------------
  const [isCallingVoice, setIsCallingVoice] = useState(false);

  const panggilSuara = async (noAntrian: string, namaPasien: string, namaPoli: string, kunjunganId?: string) => {
    if (!('speechSynthesis' in window)) {
      Swal.fire({
        icon: 'info',
        title: `Panggilan Pasien ${noAntrian}`,
        text: `Memanggil ${namaPasien} menuju ${namaPoli}.`,
        timer: 2000
      });
      return;
    }

    try {
      setIsCallingVoice(true);
      window.speechSynthesis.cancel(); // Hentikan ucapan sebelumnya jika ada

      const pesan = `Nomor antrean. ${noAntrian.split('').join(' ')}. Pasien ${namaPasien}. Silakan menuju ${namaPoli}.`;
      const utterance = new SpeechSynthesisUtterance(pesan);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Cari suara bahasa Indonesia jika tersedia
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;

      utterance.onend = () => setIsCallingVoice(false);
      utterance.onerror = () => setIsCallingVoice(false);

      window.speechSynthesis.speak(utterance);

      // Panggil endpoint backend jika ada kunjunganId
      if (kunjunganId) {
        kunjunganService.panggilKunjungan(kunjunganId).catch(() => {});
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Memanggil: ${noAntrian} (${namaPasien})`,
        text: `Menuju ${namaPoli}`,
        showConfirmButton: false,
        timer: 3500
      });
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsCallingVoice(false);
    }
  };

  // -------------------------------------------------------------------------
  // CHECK-IN ONLINE HANDLER
  // -------------------------------------------------------------------------
  const handleCheckInOnline = async (bookingIdentifier: string) => {
    if (!bookingIdentifier) return;
    setIsProcessingCheckIn(true);
    try {
      const res = await portalPasienService.checkInBooking(bookingIdentifier);
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Check-In Pasien Berhasil!',
          html: `
            <div class="text-left text-sm space-y-2 mt-2">
              <p><strong>Nama Pasien:</strong> ${res.pasien?.namaLengkap || '-'}</p>
              <p><strong>No. Rekam Medis:</strong> <span class="bg-blue-100 text-blue-800 px-2 py-0.5 font-bold font-mono">${res.pasien?.noRM || '-'}</span></p>
              <p><strong>Poli Tujuan:</strong> ${res.kunjungan?.poliklinik?.namaPoli || '-'}</p>
              <p><strong>Nomor Antrean:</strong> <span class="text-2xl font-black text-emerald-600">${res.kunjungan?.noAntrian || '-'}</span></p>
              <div class="bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 mt-2 rounded">
                ✓ Pasien resmi tercatat di <strong>Master Pasien</strong> faskes.<br/>
                ✓ Kunjungan aktif diterbitkan & langsung terhubung ke dokter poli.<br/>
                ✓ Notifikasi WhatsApp terkirim ke pasien.
              </div>
            </div>
          `,
          confirmButtonColor: '#059669',
          confirmButtonText: 'Tutup & Lanjutkan'
        });
        setQuickCheckInKode('');
        await fetchData(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Check-In',
          text: res.message || 'Terjadi kesalahan saat memproses check-in.'
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Check-In Gagal',
        text: err.response?.data?.message || err.message || 'Gagal menghubungi server'
      });
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  // -------------------------------------------------------------------------
  // UGD PENDING MODAL & HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenLengkapiModal = (item: KunjunganUGD) => {
    setSelectedUgdKunjungan(item);
    setExistingPasienId(null);
    setNikLookupStatus({ status: 'IDLE', message: '' });

    const currentNik = item.pasien?.nik || '';
    const currentRM = item.pasien?.noRM && !item.pasien.noRM.startsWith('RM-EMG-') ? item.pasien.noRM : '';
    setFormDataLengkapi({
      nik: currentNik,
      noRM: currentRM,
      namaLengkap: item.isAnonim ? '' : (item.pasien?.namaLengkap || ''),
      jenisKelamin: item.pasien?.jenisKelamin || 'Laki-laki',
      tempatLahir: item.pasien?.tempatLahir || '',
      tanggalLahir: item.pasien?.tanggalLahir ? item.pasien.tanggalLahir.split('T')[0] : '1995-01-01',
      alamatKtp: item.pasien?.alamat?.alamatKtp || '',
      noHp: item.pasien?.kontak?.noHp || '',
      jenisPenjamin: item.pasien?.penjamin?.jenisPenjamin || 'Umum',
      noBpjs: item.pasien?.penjamin?.noBpjs || '',
      kontakDarurat: item.pasien?.kontak?.kontakDarurat || '',
      hubunganKontakDarurat: item.pasien?.kontak?.hubunganKontakDarurat || 'Keluarga',
      noHpDarurat: item.pasien?.kontak?.noHpDarurat || ''
    });

    const existingRM = item.pasien?.noRM || (item.pasien as any)?.noRekamMedis;
    if (!item.isAnonim && existingRM && !existingRM.startsWith('RM-EMG-') && existingRM !== '-') {
      setExistingPasienId(item.pasien.id);
      setNikLookupStatus({
        status: 'FOUND',
        message: 'Data pasien terdaftar di rekam medis faskes.',
        noRM: existingRM,
        pasienName: item.pasien.namaLengkap
      });
    }

    setIsModalLengkapiOpen(true);
  };

  const handleLookupNik = async (queryInput?: string) => {
    const q = (queryInput !== undefined ? queryInput : formDataLengkapi.nik || '').trim();
    if (!q) {
      Swal.fire({
        icon: 'warning',
        title: 'NIK / No. RM Diperlukan',
        text: 'Silakan ketik NIK (16 digit) atau Nomor Rekam Medis pasien terlebih dahulu untuk menarik data.'
      });
      return;
    }

    setIsSearchingNik(true);
    setNikLookupStatus({ status: 'SEARCHING', message: 'Mencari data pasien di sistem...' });

    try {
      const res = await pasienService.searchPasien(q);
      if (res && res.success && res.data) {
        const p = res.data;
        setExistingPasienId(p.id);

        let tglLahir = '1995-01-01';
        if (p.tanggalLahir) {
          try {
            tglLahir = new Date(p.tanggalLahir).toISOString().split('T')[0];
          } catch (_) {
            tglLahir = p.tanggalLahir;
          }
        }

        let normGender = 'Laki-laki';
        if (p.jenisKelamin) {
          normGender = p.jenisKelamin.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';
        }

        setFormDataLengkapi(prev => ({
          ...prev,
          nik: p.nik || q,
          namaLengkap: p.namaLengkap || '',
          jenisKelamin: normGender,
          tempatLahir: p.tempatLahir || '',
          tanggalLahir: tglLahir,
          alamatKtp: p.alamat?.alamatKtp || p.alamat?.alamatDomisili || '',
          noHp: p.kontak?.noHp || '',
          jenisPenjamin: p.penjamin?.jenisPenjamin || 'Umum',
          noBpjs: p.penjamin?.noBpjs || '',
          kontakDarurat: p.kontak?.kontakDarurat || '',
          hubunganKontakDarurat: p.kontak?.hubunganKontakDarurat || 'Keluarga',
          noHpDarurat: p.kontak?.noHpDarurat || ''
        }));

        setNikLookupStatus({
          status: 'FOUND',
          message: `Data pasien lama ditemukan. Field administrasi berhasil diisi otomatis.`,
          noRM: p.noRM || '-',
          pasienName: p.namaLengkap || ''
        });
      } else {
        setExistingPasienId(null);
        setNikLookupStatus({
          status: 'NOT_FOUND',
          message: 'Pasien belum terdaftar di faskes (Pasien Baru). Silakan lengkapi formulir administrasi secara manual.'
        });
      }
    } catch (err) {
      console.warn('Gagal mencari data pasien:', err);
      setExistingPasienId(null);
      setNikLookupStatus({
        status: 'NOT_FOUND',
        message: 'Pasien belum terdaftar di faskes (Pasien Baru). Silakan lengkapi formulir administrasi secara manual.'
      });
    } finally {
      setIsSearchingNik(false);
    }
  };

  const handleSubmitLengkapi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUgdKunjungan) return;
    if (!formDataLengkapi.namaLengkap) {
      Swal.fire({ icon: 'warning', title: 'Nama Lengkap Wajib', text: 'Silakan isi nama resmi pasien sesuai KTP.' });
      return;
    }

    setIsSubmittingLengkapi(true);
    try {
      const res: any = await ugdService.lengkapiAdministrasi(selectedUgdKunjungan.id, {
        ...formDataLengkapi,
        existingPasienId: existingPasienId || undefined
      });
      const generatedRM = res?.pasien?.noRM || res?.data?.pasien?.noRM || (nikLookupStatus.status === 'FOUND' && nikLookupStatus.noRM ? nikLookupStatus.noRM : formDataLengkapi.noRM || null);
      await Swal.fire({
        icon: 'success',
        title: 'Administrasi Pasien UGD Selesai!',
        html: `
          <div class="text-left text-sm space-y-2 mt-2">
            <p>Pasien di Bed <strong>${selectedUgdKunjungan.tempatTidurs?.[0]?.nomorBed || 'UGD'}</strong> telah diverifikasi identitas resminya.</p>
            <p><strong>Nama Resmi:</strong> ${formDataLengkapi.namaLengkap}</p>
            <p><strong>NIK:</strong> ${formDataLengkapi.nik || '-'}</p>
            ${generatedRM ? `<p><strong>No. Rekam Medis Resmi:</strong> <span class="bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded border border-blue-200">${generatedRM}</span></p>` : ''}
            <p><strong>Penjamin:</strong> ${formDataLengkapi.jenisPenjamin} ${formDataLengkapi.noBpjs ? `(${formDataLengkapi.noBpjs})` : ''}</p>
            <div class="bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 mt-2">
              ✓ Berkas administrasi kini berstatus <strong>LENGKAP</strong>.<br/>
              ✓ Data pasien otomatis terdaftar sebagai <strong>Pasien Terverifikasi Resmi</strong> di Master Data Faskes.<br/>
              ✓ Rekam Medis & Kasir telah tersinkronisasi.
            </div>
          </div>
        `
      });
      setIsModalLengkapiOpen(false);
      await fetchData(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Administrasi',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.'
      });
    } finally {
      setIsSubmittingLengkapi(false);
    }
  };

  // -------------------------------------------------------------------------
  // HELPER FORMATTERS
  // -------------------------------------------------------------------------
  const mapStatusLoket = (st: string) => {
    if (st === 'MENUNGGU' || st === 'MENUNGGU_DOKTER') return 'Menunggu';
    if (st === 'DIPROSES_SCREENING' || st === 'DIPERIKSA') return 'Dilayani';
    return 'Selesai';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Menunggu':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Dilayani':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPrioritasBadge = (prioritas: string) => {
    switch (prioritas) {
      case 'Lansia':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Ibu Hamil':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Disabilitas':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getAge = (dob: string) => {
    if (!dob) return 0;
    const diff = new Date().getTime() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  // Filtered List for Tab 1 (Loket)
  const filteredAntreanLoket = useMemo(() => {
    return antreanLoket.filter(p => {
      const nama = (p.pasien?.namaLengkap || '').toLowerCase();
      const noAntrian = (p.noAntrian || '').toLowerCase();
      const noRm = (p.pasien?.noRM || '').toLowerCase();
      const nik = (p.pasien?.nik || '').toLowerCase();
      const q = searchLoket.toLowerCase();
      const matchSearch = !q || nama.includes(q) || noAntrian.includes(q) || noRm.includes(q) || nik.includes(q);

      const mappedSt = mapStatusLoket(p.statusKunjungan);
      const matchStatus = filterStatusLoket === 'Semua' || mappedSt === filterStatusLoket;
      const matchPoli = filterPoliLoket === 'Semua' || p.poliklinik?.namaPoli === filterPoliLoket;
      const matchPrioritas = filterPrioritasLoket === 'Semua' || p.prioritas === filterPrioritasLoket;

      return matchSearch && matchStatus && matchPoli && matchPrioritas;
    });
  }, [antreanLoket, searchLoket, filterStatusLoket, filterPoliLoket, filterPrioritasLoket]);

  // Filtered List for Tab 2 (Online)
  const filteredOnlineBookings = useMemo(() => {
    return onlineBookings.filter(b => {
      const q = onlineSearch.toLowerCase();
      const nama = (b.namaLengkap || '').toLowerCase();
      const nik = (b.nik || '').toLowerCase();
      const kode = (b.kodeBooking || '').toLowerCase();
      const noAntrian = (b.noAntrian || '').toLowerCase();
      return !q || nama.includes(q) || nik.includes(q) || kode.includes(q) || noAntrian.includes(q);
    });
  }, [onlineBookings, onlineSearch]);

  // Filtered List for Tab 3 (UGD Pending)
  const filteredPendingUgd = useMemo(() => {
    return pendingUgdList.filter(item => {
      const q = pendingUgdSearch.toLowerCase();
      const nama = (item.pasien?.namaLengkap || '').toLowerCase();
      const anonim = (item.namaAnonim || '').toLowerCase();
      const bed = (item.tempatTidurs?.[0]?.nomorBed || '').toLowerCase();
      const noAntrian = (item.noAntrian || '').toLowerCase();
      return !q || nama.includes(q) || anonim.includes(q) || bed.includes(q) || noAntrian.includes(q);
    });
  }, [pendingUgdList, pendingUgdSearch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── TOP HERO COMMAND HEADER ── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-md border-b border-blue-700/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded">
                Role Petugas Loket Faskes
              </span>
              <span className="text-xs text-blue-300">• Live Desk Operation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-blue-400" />
              Pusat Antrean & Manajemen Loket
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-2xl">
              Ruang kendali terpadu tanpa hambatan scroll untuk memproses antrean fisik, check-in pasien online WhatsApp, dan penyelesaian berkas pending darurat UGD secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-blue-950/60 border border-blue-700/60 px-3.5 py-2 rounded text-right hidden sm:block">
              <div className="text-[10px] text-blue-300 font-medium">Waktu Sistem Realtime</div>
              <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {currentTime} WIB
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-blue-700/80 hover:bg-blue-600 text-white font-bold text-xs rounded border border-blue-500/50 shadow-xs flex items-center gap-1.5 transition-colors"
              title="Perbarui Data Antrean"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-200' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
            </button>

            <Link
              href="/administrasi/pendaftaran"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Pasien Baru</span>
            </Link>

            <Link
              href="/administrasi"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded border border-white/20 transition-colors flex items-center gap-1.5"
              title="Lihat Dashboard Statistik & Grafik"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Ke Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── TOP KPI EXECUTIVE STATS BAR ── */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: Antrean Loket Menunggu */}
          <div 
            onClick={() => handleTabChange('LOKET')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'LOKET' 
                ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20' 
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Antrean Loket Aktif</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{statsSummary.menunggu}</span>
              <span className="text-xs text-slate-500">Menunggu Poli</span>
            </div>
            <div className="text-[10px] text-blue-700 font-semibold mt-1">
              Total Hari Ini: {statsSummary.totalHariIni} Pasien
            </div>
          </div>

          {/* Card 2: Pasien Online Siap Check-in */}
          <div 
            onClick={() => handleTabChange('ONLINE')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'ONLINE' 
                ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' 
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Booking Online (WA)</span>
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length}
              </span>
              <span className="text-xs text-slate-500">Menunggu Check-In</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">
              Total Booking: {onlineBookings.length} Terdata
            </div>
          </div>

          {/* Card 3: Pending Administrasi UGD (Penting / Alert) */}
          <div 
            onClick={() => handleTabChange('UGD_PENDING')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              pendingUgdList.length > 0 
                ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/30' 
                : (activeTab === 'UGD_PENDING' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50')
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                {pendingUgdList.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />}
                Pending Berkas UGD
              </span>
              <AlertTriangle className={`w-4 h-4 ${pendingUgdList.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${pendingUgdList.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {pendingUgdList.length}
              </span>
              <span className="text-xs text-rose-700 font-semibold">Butuh Tindak Lanjut</span>
            </div>
            <div className="text-[10px] text-rose-600 font-bold mt-1">
              {pendingUgdList.length > 0 ? '⚠️ Jangan sampai terabaikan!' : '✓ Semua berkas lengkap'}
            </div>
          </div>

          {/* Card 4: Sedang Dilayani di Poli */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sedang Diperiksa</span>
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600">{statsSummary.sedangDilayani}</span>
              <span className="text-xs text-slate-500">Di Ruang Dokter</span>
            </div>
            <div className="text-[10px] text-indigo-700 font-semibold mt-1">
              Pemeriksaan & Screening
            </div>
          </div>

          {/* Card 5: Selesai Dilayani Hari Ini */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Selesai Dilayani</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{statsSummary.selesai}</span>
              <span className="text-xs text-slate-500">Pasien Selesai</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Prioritas: {statsSummary.prioritasLansia + statsSummary.prioritasHamil + statsSummary.prioritasDisabilitas} Khusus
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE SECTION ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex-1 flex flex-col w-full space-y-4">
        
        {/* TABS SELECTOR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-1.5 flex flex-wrap gap-2">
          {/* TAB 1 */}
          <button
            type="button"
            onClick={() => handleTabChange('LOKET')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${
              activeTab === 'LOKET'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Antrean Loket Faskes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'LOKET' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredAntreanLoket.length}
            </span>
          </button>

          {/* TAB 2 */}
          <button
            type="button"
            onClick={() => handleTabChange('ONLINE')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${
              activeTab === 'ONLINE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Antrean Online WhatsApp</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'ONLINE' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {onlineBookings.length}
            </span>
            {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                activeTab === 'ONLINE' ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-800'
              }`}>
                {onlineBookings.filter(b => b.statusBooking === 'TERKONFIRMASI').length} Butuh Check-In
              </span>
            )}
          </button>

          {/* TAB 3 */}
          <button
            type="button"
            onClick={() => handleTabChange('UGD_PENDING')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${
              activeTab === 'UGD_PENDING'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${pendingUgdList.length > 0 ? (activeTab === 'UGD_PENDING' ? 'text-white' : 'text-rose-600 animate-bounce') : ''}`} />
            <span>Pending Administrasi UGD</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'UGD_PENDING' 
                ? 'bg-white text-rose-700' 
                : (pendingUgdList.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700')
            }`}>
              {pendingUgdList.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: ANTREAN LOKET FASKES (WALK-IN) */}
        {/* ========================================================================= */}
        {activeTab === 'LOKET' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 flex flex-col">
            {/* Filter & Search Header Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari pasien / no antrian / RM / NIK..."
                    value={searchLoket}
                    onChange={(e) => setSearchLoket(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                {/* Filter Status */}
                <select
                  value={filterStatusLoket}
                  onChange={(e) => setFilterStatusLoket(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium text-slate-700 shadow-2xs"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Dilayani">Dilayani</option>
                  <option value="Selesai">Selesai</option>
                </select>

                {/* Filter Poli */}
                <select
                  value={filterPoliLoket}
                  onChange={(e) => setFilterPoliLoket(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium text-slate-700 shadow-2xs"
                >
                  <option value="Semua">Semua Poliklinik</option>
                  {masterPoli.map((p: any, idx) => (
                    <option key={idx} value={p.nama}>{p.nama}</option>
                  ))}
                </select>

                {/* Filter Prioritas */}
                <select
                  value={filterPrioritasLoket}
                  onChange={(e) => setFilterPrioritasLoket(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium text-slate-700 shadow-2xs"
                >
                  <option value="Semua">Semua Prioritas</option>
                  <option value="Umum">Umum</option>
                  <option value="Lansia">Lansia</option>
                  <option value="Ibu Hamil">Ibu Hamil</option>
                  <option value="Disabilitas">Disabilitas</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 self-end lg:self-auto">
                <span>Ditemukan: <strong className="text-slate-900">{filteredAntreanLoket.length}</strong> pasien</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 font-semibold">Tersinkronisasi otomatis dengan Ruang Poli</span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">No. Antrean & Jam</th>
                    <th className="py-3 px-4">Identitas Pasien</th>
                    <th className="py-3 px-4">Poliklinik Tujuan</th>
                    <th className="py-3 px-4">Dokter Bertugas</th>
                    <th className="py-3 px-4">Penjamin</th>
                    <th className="py-3 px-4 text-center">Status Pelayanan</th>
                    <th className="py-3 px-4 text-right">Aksi Loket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Memuat data antrean loket...
                      </td>
                    </tr>
                  ) : filteredAntreanLoket.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">Tidak ada antrean yang sesuai filter</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Ubah kata kunci pencarian atau reset filter untuk melihat data lain.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAntreanLoket.map((p) => {
                      const stMapped = mapStatusLoket(p.statusKunjungan);
                      const regTime = p.jamRegistrasi || (p.createdAt ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-');
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/40 transition-colors group">
                          {/* No Antrean */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded block w-max">
                              {p.noAntrian || '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" /> {regTime} WIB
                            </span>
                          </td>

                          {/* Pasien */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{p.pasien?.namaLengkap || 'Pasien Anonim'}</span>
                              {p.prioritas && p.prioritas !== 'Umum' && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPrioritasBadge(p.prioritas)}`}>
                                  {p.prioritas}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-700 font-medium">RM: {p.pasien?.noRM || '-'}</span>
                              <span>•</span>
                              <span>{getAge(p.pasien?.tanggalLahir)} thn, {p.pasien?.jenisKelamin?.toLowerCase().startsWith('l') ? 'L' : 'P'}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                                p.statusPasien === 'Baru' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {p.statusPasien || 'Lama'}
                              </span>
                            </div>
                            {p.pasien?.nik && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                NIK: {p.pasien.nik}
                              </div>
                            )}
                          </td>

                          {/* Poli */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] inline-block">
                              {p.poliklinik?.namaPoli || 'Poli Umum'}
                            </span>
                          </td>

                          {/* Dokter */}
                          <td className="py-3 px-4 text-slate-700">
                            <span className="font-medium block">{p.dokterTujuan?.namaLengkap || 'Dokter Jaga Poli'}</span>
                          </td>

                          {/* Pembayaran */}
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              p.pasien?.penjamin?.jenisPenjamin?.toUpperCase() === 'BPJS'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {p.pasien?.penjamin?.jenisPenjamin || 'Umum'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(stMapped)}`}>
                              {stMapped === 'Menunggu' && <Clock className="w-3 h-3" />}
                              {stMapped === 'Dilayani' && <Activity className="w-3 h-3" />}
                              {stMapped === 'Selesai' && <CheckCircle2 className="w-3 h-3" />}
                              {stMapped}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Tombol Panggil Suara */}
                              <button
                                type="button"
                                onClick={() => panggilSuara(p.noAntrian || '001', p.pasien?.namaLengkap || 'Pasien', p.poliklinik?.namaPoli || 'Poli Umum', p.id)}
                                disabled={isCallingVoice}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-colors"
                                title="Panggil Antrean Suara (Text-to-Speech)"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Panggil</span>
                              </button>

                              {/* Tombol Proses / Edit Identitas */}
                              <Link
                                href={`/administrasi/pendaftaran?nik=${p.pasien?.nik || ''}&noRM=${p.pasien?.noRM || ''}&skenario=Lama`}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-colors"
                                title="Proses Pendaftaran & Buka Rekam Medis"
                              >
                                <ClipboardEdit className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Proses</span>
                              </Link>

                              {/* Cetak Slip Antrean */}
                              <button
                                type="button"
                                onClick={() => setKarcisPrintData(p)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                                title="Cetak Karcis Antrean"
                              >
                                <Printer className="w-3.5 h-3.5" />
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

            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
              <span>Menampilkan <strong>{filteredAntreanLoket.length}</strong> dari total <strong>{antreanLoket.length}</strong> kunjungan loket terdaftar</span>
              <span className="italic text-slate-400">Auto-refresh aktif setiap 20 detik</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ANTREAN ONLINE (WHATSAPP & WEB BOOKING) */}
        {/* ========================================================================= */}
        {activeTab === 'ONLINE' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 flex flex-col space-y-4 p-5">
            {/* Quick Scanner Bar */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xs rounded-lg flex items-center justify-center font-bold">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Check-In Cepat Pasien Online</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Scan tiket QR Code atau masukkan Kode Booking (misal: BK-...) / NIK saat pasien tiba di loket faskes.
                  </p>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckInOnline(quickCheckInKode);
                }}
                className="flex items-center gap-2"
              >
                <input 
                  type="text"
                  placeholder="Ketik Kode Booking / NIK..."
                  value={quickCheckInKode}
                  onChange={(e) => setQuickCheckInKode(e.target.value)}
                  className="px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-mono font-bold rounded-lg border-2 border-emerald-300 focus:border-white outline-none w-64 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isProcessingCheckIn || !quickCheckInKode.trim()}
                  className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 disabled:bg-emerald-800/60 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  {isProcessingCheckIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Check-In
                </button>
              </form>
            </div>

            {/* Filter Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pasien / kode booking / NIK..."
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="text-xs text-slate-500">
                Total Pendaftaran Online: <strong className="text-slate-900">{filteredOnlineBookings.length}</strong> Pasien
              </div>
            </div>

            {/* Online Bookings Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">No. Antrean & Booking</th>
                    <th className="py-3 px-4">Identitas Pasien</th>
                    <th className="py-3 px-4">Poli & Dokter Tujuan</th>
                    <th className="py-3 px-4">Keluhan Utama</th>
                    <th className="py-3 px-4 text-center">Status Kedatangan</th>
                    <th className="py-3 px-4 text-right">Aksi Loket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOnlineBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">Belum ada pasien booking online WhatsApp hari ini</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Setiap pasien yang mendaftar via bot WA faskes otomatis muncul di tabel ini.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOnlineBookings.map((b) => {
                      const isCheckedIn = b.statusBooking === 'CHECKED_IN';
                      return (
                        <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-base text-slate-900 block">
                              {b.noAntrian || '-'}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block mt-1">
                              {b.kodeBooking}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{b.namaLengkap}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIK: {b.nik}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span>{getAge(b.tanggalLahir)} thn</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold font-mono">+{b.akunPasien?.nomorWa}</span>
                            </div>
                            <div className="mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                b.jenisPasien === 'LAMA' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.jenisPasien === 'LAMA' ? `Pasien Lama (${b.noRM || 'Ada RM'})` : 'Pasien Baru'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block text-xs">{b.poliklinik?.namaPoli || 'Poli Umum'}</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{b.dokter?.namaLengkap || 'Dokter Jaga Poli'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <p className="text-slate-700 text-xs max-w-xs line-clamp-2" title={b.keluhan || '-'}>
                              {b.keluhan || '-'}
                            </p>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded text-xs font-bold border border-emerald-200">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Sudah Check-In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded text-xs font-bold border border-amber-300">
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Kedatangan
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isCheckedIn ? (
                              <span className="text-xs text-slate-400 italic">Telah Masuk Poli</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCheckInOnline(b.id)}
                                disabled={isProcessingCheckIn}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-2xs transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Check-In
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PENDING ADMINISTRASI UGD (PERINGATAN KRITIS) */}
        {/* ========================================================================= */}
        {activeTab === 'UGD_PENDING' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 flex flex-col">
            {/* Header Alert Banner */}
            <div className="p-5 border-b border-rose-200 bg-rose-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded">
                    Unit Gawat Darurat (UGD)
                  </span>
                  <span className="text-xs text-rose-800 font-bold">• Wajib Diselesaikan Petugas Loket</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Daftar Pasien Darurat Menunggu Kelengkapan Berkas
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                  Pasien masuk dalam kondisi cito/kegawatdaruratan dan langsung ditangani di Bed UGD terlebih dahulu. Petugas Loket bertugas melengkapi identitas resmi (KTP, NIK, Penjamin BPJS, dan Kontak Darurat) agar status administrasi menjadi <strong>LENGKAP</strong> dan rekam medis terhubung permanen.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari pasien / nomor bed / antrian..."
                    value={pendingUgdSearch}
                    onChange={(e) => setPendingUgdSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:border-rose-600 font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">No. Antrean & Jam Tiba</th>
                    <th className="py-3 px-4">Lokasi Bed Terkini</th>
                    <th className="py-3 px-4">Kategori Triase</th>
                    <th className="py-3 px-4">Identitas Awal / Sementara</th>
                    <th className="py-3 px-4">Tanda Vital Triase</th>
                    <th className="py-3 px-4 text-right">Aksi Tindak Lanjut Loket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPendingUgd.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                        <p className="font-bold text-slate-800 text-sm">Semua Pasien UGD Telah Lengkap Administrasinya</p>
                        <p className="text-slate-500 text-xs mt-0.5">Tidak ada antrean pending administrasi UGD yang tertahan saat ini.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingUgd.map((item) => {
                      const bed = item.tempatTidurs?.[0];
                      const scr = (Array.isArray(item.screening) ? item.screening[0] : item.screening) as any;
                      return (
                        <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded block w-max">
                              {item.noAntrian || '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" /> {item.jamRegistrasi || '-'} WIB
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-blue-900 font-bold text-xs">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                              <span>{bed ? `${bed.nomorBed}` : 'Bed UGD'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {bed?.ruangan?.namaRuangan || 'Ruang Tindakan Gawat Darurat'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border shadow-2xs ${
                              item.triase === 'MERAH' ? 'bg-red-600 text-white border-red-700' :
                              item.triase === 'KUNING' ? 'bg-yellow-400 text-slate-900 border-yellow-500' :
                              item.triase === 'HIJAU' ? 'bg-green-600 text-white border-green-700' :
                              'bg-slate-900 text-white border-black'
                            }`}>
                              {item.triase || 'MERAH'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{item.namaAnonim || item.pasien?.namaLengkap}</span>
                              {item.isAnonim && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded">
                                  Anonim
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.pasien?.jenisKelamin || '-'} • Tiba via: {item.caraDatang || 'Ambulans'}
                            </div>
                            <div className="text-[11px] text-rose-600 font-medium mt-0.5 line-clamp-1" title={scr?.keluhanUtama || item.keluhanUtama || ''}>
                              {scr?.keluhanUtama || item.keluhanUtama || 'Kondisi gawat darurat cito'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[11px] text-slate-600">
                            {scr ? (
                              <div className="space-y-0.5">
                                <div>TD: <span className="font-semibold text-slate-900">{scr.tekananDarahSistolik || '-'}/{scr.tekananDarahDiastolik || '-'} mmHg</span></div>
                                <div>Nadi: <span className="font-semibold text-slate-900">{scr.nadi || '-'} bpm</span> | SpO2: <span className="font-semibold text-slate-900">{scr.saturasiOksigen || '-'}%</span></div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pemeriksaan di bed...</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenLengkapiModal(item)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 ml-auto rounded-lg"
                            >
                              <ClipboardEdit className="w-3.5 h-3.5" />
                              Lengkapi Administrasi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Total <strong>{pendingUgdList.length}</strong> pasien UGD menunggu verifikasi administrasi loket</span>
              <span className="text-rose-700 font-bold">Terhubung ke RME & Bed Monitoring UGD</span>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL LENGKAPI ADMINISTRASI UGD */}
      {/* ========================================================================= */}
      {isModalLengkapiOpen && selectedUgdKunjungan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-rose-700 to-rose-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <ClipboardEdit className="w-5 h-5 text-rose-200" />
                  Lengkapi Administrasi Pasien UGD
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Verifikasi identitas resmi pasien yang sedang dirawat di Bed UGD
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalLengkapiOpen(false)}
                className="text-rose-200 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Bed & Current Status Info */}
            <div className="bg-rose-50/70 p-4 border-b border-rose-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nomor Bed:</span>
                <span className="font-extrabold text-blue-700 text-sm">
                  {selectedUgdKunjungan.tempatTidurs?.[0]?.nomorBed || 'BED-UGD'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Antrean UGD:</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {selectedUgdKunjungan.noAntrian}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Kategori Triase:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase text-white ${
                  selectedUgdKunjungan.triase === 'MERAH' ? 'bg-red-600' :
                  selectedUgdKunjungan.triase === 'KUNING' ? 'bg-yellow-500 text-black' : 'bg-green-600'
                }`}>
                  {selectedUgdKunjungan.triase}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Nama Sementara:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {selectedUgdKunjungan.namaAnonim || selectedUgdKunjungan.pasien?.namaLengkap}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitLengkapi} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Box Penarikan Data NIK (Pasien Lama vs Pasien Baru) */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 text-white rounded">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Penarikan Data Pasien Otomatis (NIK / No. RM)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Cek data pasien di master faskes untuk auto-fill seluruh formulir
                      </p>
                    </div>
                  </div>
                  {nikLookupStatus.status === 'FOUND' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pasien Lama Ditemukan
                    </span>
                  )}
                  {nikLookupStatus.status === 'NOT_FOUND' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                      <UserPlus className="w-3.5 h-3.5 text-amber-600" /> Pasien Baru (Manual)
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      maxLength={16}
                      value={formDataLengkapi.nik}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormDataLengkapi({ ...formDataLengkapi, nik: val });
                        if (nikLookupStatus.status !== 'IDLE') {
                          setNikLookupStatus({ status: 'IDLE', message: '' });
                          setExistingPasienId(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupNik();
                        }
                      }}
                      placeholder="Masukkan 16 digit NIK atau Nomor RM pasien..."
                      className="w-full text-xs font-mono font-medium border border-blue-300 p-2.5 rounded-lg focus:border-blue-600 focus:outline-none bg-white shadow-2xs"
                    />
                    {formDataLengkapi.nik && (
                      <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-mono">
                        {formDataLengkapi.nik.length}/16
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isSearchingNik || !formDataLengkapi.nik}
                    onClick={() => handleLookupNik()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                  >
                    {isSearchingNik ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Menarik Data...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Tarik Data Pasien</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Messages */}
                {nikLookupStatus.status === 'FOUND' && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-emerald-950 text-sm">{nikLookupStatus.pasienName}</strong>
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          No. RM: {nikLookupStatus.noRM}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        ✓ Pasien lama terverifikasi. Formulir di bawah telah terisi otomatis. Anda tetap dapat memperbarui alamat atau nomor HP bila diperlukan.
                      </p>
                    </div>
                  </div>
                )}

                {nikLookupStatus.status === 'NOT_FOUND' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-950 block text-xs">Pasien Baru (Belum Terdaftar)</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Data tidak ditemukan di master pasien faskes. Silakan lengkapi formulir di bawah secara manual untuk pendaftaran baru.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Resmi Pasien Sesuai KTP *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDataLengkapi.namaLengkap}
                      onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, namaLengkap: e.target.value })}
                      placeholder="Nama lengkap resmi pasien"
                      className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. Rekam Medis
                    </label>
                    <input
                      type="text"
                      value={formDataLengkapi.noRM}
                      onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, noRM: e.target.value })}
                      placeholder="Auto (Otomatis Faskes)"
                      className="w-full text-xs font-mono border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none bg-slate-50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                      * Otomatis dibuat jika kosong
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formDataLengkapi.tempatLahir}
                    onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, tempatLahir: e.target.value })}
                    placeholder="Kota / Tempat Lahir"
                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formDataLengkapi.tanggalLahir}
                    onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, tanggalLahir: e.target.value })}
                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={formDataLengkapi.jenisKelamin}
                    onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, jenisKelamin: e.target.value })}
                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP / WhatsApp Pasien</label>
                  <input
                    type="text"
                    value={formDataLengkapi.noHp}
                    onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, noHp: e.target.value })}
                    placeholder="08..."
                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat KTP / Domisili</label>
                  <textarea
                    rows={2}
                    value={formDataLengkapi.alamatKtp}
                    onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, alamatKtp: e.target.value })}
                    placeholder="Alamat tempat tinggal pasien"
                    className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Data Penjamin */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Penjamin Biaya</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penjamin</label>
                      <select
                        value={formDataLengkapi.jenisPenjamin}
                        onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, jenisPenjamin: e.target.value })}
                        className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                      >
                        <option value="Umum">Umum / Mandiri</option>
                        <option value="BPJS">BPJS Kesehatan</option>
                        <option value="Asuransi">Asuransi Lain</option>
                        <option value="Jaminan Daerah">Jamkesda</option>
                      </select>
                    </div>

                    {formDataLengkapi.jenisPenjamin === 'BPJS' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu BPJS (13 Digit)</label>
                        <input
                          type="text"
                          maxLength={13}
                          value={formDataLengkapi.noBpjs}
                          onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, noBpjs: e.target.value })}
                          placeholder="0001..."
                          className="w-full text-xs border border-slate-300 p-2.5 rounded-lg font-mono focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Kontak Darurat */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Penanggung Jawab / Kontak Keluarga</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Keluarga / Pengantar</label>
                      <input
                        type="text"
                        value={formDataLengkapi.kontakDarurat}
                        onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, kontakDarurat: e.target.value })}
                        placeholder="Contoh: Siti"
                        className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan</label>
                      <select
                        value={formDataLengkapi.hubunganKontakDarurat}
                        onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, hubunganKontakDarurat: e.target.value })}
                        className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                      >
                        <option value="Keluarga">Keluarga</option>
                        <option value="Suami">Suami</option>
                        <option value="Istri">Istri</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Anak">Anak</option>
                        <option value="Kerabat">Kerabat / Teman</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">No. HP Keluarga</label>
                      <input
                        type="text"
                        value={formDataLengkapi.noHpDarurat}
                        onChange={(e) => setFormDataLengkapi({ ...formDataLengkapi, noHpDarurat: e.target.value })}
                        placeholder="08..."
                        className="w-full text-xs border border-slate-300 p-2.5 rounded-lg focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalLengkapiOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLengkapi}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSubmittingLengkapi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Berkas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Tandai Lengkap</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK KARCIS ANTREAN LOKET */}
      {/* ========================================================================= */}
      {karcisPrintData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 shadow-2xl rounded-xl border border-slate-200 text-center space-y-4">
            <div className="border-b-2 border-dashed border-slate-300 pb-3">
              <h4 className="font-extrabold text-sm uppercase text-slate-800">Fasilitas Kesehatan SIAP-KES</h4>
              <p className="text-[10px] text-slate-500">Tiket Pendaftaran Loket Pasien</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Nomor Antrean Anda:</p>
              <div className="text-4xl font-black text-blue-700 font-mono tracking-tight my-2">
                {karcisPrintData.noAntrian || '-'}
              </div>
              <p className="text-sm font-bold text-slate-800">{karcisPrintData.poliklinik?.namaPoli || 'Poli Umum'}</p>
              <p className="text-xs text-slate-500">{karcisPrintData.pasien?.namaLengkap}</p>
            </div>

            <div className="text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-3 space-y-0.5">
              <p>Waktu: {new Date(karcisPrintData.createdAt || Date.now()).toLocaleDateString('id-ID')} {karcisPrintData.jamRegistrasi || ''}</p>
              <p>Mohon menunggu panggilan petugas loket / perawat poli.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKarcisPrintData(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setKarcisPrintData(null);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PusatAntreanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Menyiapkan Pusat Antrean Loket...</p>
        </div>
      </div>
    }>
      <PusatAntreanContent />
    </Suspense>
  );
}
