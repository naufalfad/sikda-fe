"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, CalendarCheck, ChevronRight, CheckCircle2, 
  AlertCircle, Clock, User, ShieldCheck, ArrowLeft,
  Smartphone, KeyRound, UserCheck, Plus, Check, 
  Printer, LogOut, RefreshCw, Send, Users, QrCode,
  MapPin, Stethoscope, FileText, ChevronDown, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { portalPasienService, PasienKeluarga, BookingAntrean } from '@/services/portalPasien.service';

export default function BookingPortalPage() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP_SET_PIN' | 'ENTER_PIN' | 'FORGOT_PIN'>('PHONE');
  const [nomorWa, setNomorWa] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Portal view state
  const [activeTab, setActiveTab] = useState<'BOOKING' | 'HISTORY' | 'FAMILY'>('BOOKING');

  // Master data
  const [faskesList, setFaskesList] = useState<any[]>([]);
  const [poliList, setPoliList] = useState<any[]>([]);
  const [dokterList, setDokterList] = useState<any[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  // Booking Form State
  const [selectedFaskesId, setSelectedFaskesId] = useState('');
  const [selectedPoliId, setSelectedPoliId] = useState('');
  const [selectedDokterId, setSelectedDokterId] = useState('');
  const [selectedKeluargaId, setSelectedKeluargaId] = useState<string>('NEW');
  
  // Patient Identity Form
  const [nik, setNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [hubunganKeluarga, setHubunganKeluarga] = useState('Diri Sendiri');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [tanggalKunjungan, setTanggalKunjungan] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [keluhan, setKeluhan] = useState('');

  // Patient Status Match in Faskes (Lama vs Baru)
  const [isCheckingPasien, setIsCheckingPasien] = useState(false);
  const [pasienStatus, setPasienStatus] = useState<any>(null);

  // Form Demografi Pasien Baru Lengkap (Sesuai Formulir Loket)
  const [noKk, setNoKk] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [golonganDarah, setGolonganDarah] = useState('');
  const [rhesus, setRhesus] = useState('');
  const [agama, setAgama] = useState('Islam');
  const [pendidikan, setPendidikan] = useState('SMA/SMK');
  const [pekerjaan, setPekerjaan] = useState('Wiraswasta');
  const [statusPerkawinan, setStatusPerkawinan] = useState('Belum Kawin');
  const [kewarganegaraan, setKewarganegaraan] = useState('WNI');
  
  // Alamat Kependudukan
  const [alamatKtp, setAlamatKtp] = useState('');
  const [alamatDomisili, setAlamatDomisili] = useState('');
  const [isDomisiliSamaKtp, setIsDomisiliSamaKtp] = useState(true);
  const [rtRw, setRtRw] = useState('001/001');
  const [desaKelurahan, setDesaKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('Kabupaten Bogor');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [kodePos, setKodePos] = useState('16911');

  // Kontak & Penjamin
  const [kontakDarurat, setKontakDarurat] = useState('');
  const [hubunganKontakDarurat, setHubunganKontakDarurat] = useState('Keluarga');
  const [noHpDarurat, setNoHpDarurat] = useState('');
  const [jenisPenjamin, setJenisPenjamin] = useState('Umum');
  const [noBpjs, setNoBpjs] = useState('');

  // Persetujuan Medis (Consent Sekali Saja)
  const [persetujuanPengobatan, setPersetujuanPengobatan] = useState(true);
  const [persetujuanRekamMedis, setPersetujuanRekamMedis] = useState(true);
  const [persetujuanSatusehat, setPersetujuanSatusehat] = useState(true);

  // Submission & Ticket State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingAntrean | null>(null);

  // New Family Member Modal
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamilyForm, setNewFamilyForm] = useState({
    nik: '',
    namaLengkap: '',
    tanggalLahir: '',
    hubunganKeluarga: 'Anak',
    jenisKelamin: 'Laki-laki'
  });
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('siapkes_pasien_token');
    if (savedToken) {
      setToken(savedToken);
      loadProfile(savedToken);
    }
    loadMasterFaskes();
  }, []);

  const loadProfile = async (authToken: string) => {
    try {
      const res = await portalPasienService.getProfile(authToken);
      if (res.success && res.data) {
        setUserProfile(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat profil akun:', err?.message || err);
      // Hanya logout jika token sudah kadaluarsa / 401 tidak valid
      if (err?.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const loadMasterFaskes = async () => {
    setIsLoadingMaster(true);
    try {
      const res = await portalPasienService.getMasterData();
      if (res.success && res.data?.faskesList) {
        setFaskesList(res.data.faskesList);
        if (res.data.faskesList.length > 0) {
          setSelectedFaskesId(res.data.faskesList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load master faskes:', err);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // When selected Faskes changes, reload Poli
  useEffect(() => {
    if (selectedFaskesId) {
      loadPoli(selectedFaskesId);
    }
  }, [selectedFaskesId]);

  // When selected Poli changes, reload Dokter for that poli
  useEffect(() => {
    if (selectedFaskesId && selectedPoliId) {
      loadDokter(selectedFaskesId, selectedPoliId);
    } else {
      setDokterList([]);
      setSelectedDokterId('');
    }
  }, [selectedFaskesId, selectedPoliId]);

  const loadPoli = async (faskesId: string) => {
    try {
      const res = await portalPasienService.getMasterData(faskesId);
      if (res.success && res.data) {
        const polis = res.data.poliList || [];
        setPoliList(polis);
        if (polis.length > 0) {
          setSelectedPoliId(polis[0].id);
        } else {
          setSelectedPoliId('');
          setDokterList([]);
          setSelectedDokterId('');
        }
      }
    } catch (err) {
      console.error('Failed to load poli:', err);
    }
  };

  const loadDokter = async (faskesId: string, poliId: string) => {
    try {
      const res = await portalPasienService.getMasterData(faskesId, poliId);
      if (res.success && res.data) {
        const doctors = res.data.dokterList || [];
        setDokterList(doctors);
        if (doctors.length > 0) {
          setSelectedDokterId(doctors[0].id);
        } else {
          setSelectedDokterId('');
        }
      }
    } catch (err) {
      console.error('Failed to load dokter:', err);
    }
  };

  // Check Patient Status (Lama vs Baru) whenever NIK or Faskes changes
  useEffect(() => {
    if (nik.length >= 16 && selectedFaskesId) {
      checkPatient(nik, selectedFaskesId);
    } else {
      setPasienStatus(null);
    }
  }, [nik, selectedFaskesId]);

  const checkPatient = async (nikVal: string, faskesIdVal: string) => {
    setIsCheckingPasien(true);
    try {
      const res = await portalPasienService.checkPasienFaskes(nikVal, faskesIdVal);
      if (res.success) {
        setPasienStatus(res);
        if (res.namaLengkap && !namaLengkap) {
          setNamaLengkap(res.namaLengkap);
        }
        if (res.dataPasien) {
          const dp = res.dataPasien;
          if (dp.namaLengkap) setNamaLengkap(dp.namaLengkap);
          if (dp.tempatLahir) setTempatLahir(dp.tempatLahir);
          if (dp.tanggalLahir) setTanggalLahir(new Date(dp.tanggalLahir).toISOString().split('T')[0]);
          if (dp.jenisKelamin) setJenisKelamin(dp.jenisKelamin);
          if (dp.noKk) setNoKk(dp.noKk);
          if (dp.golonganDarah) setGolonganDarah(dp.golonganDarah);
          if (dp.rhesus) setRhesus(dp.rhesus);
          if (dp.agama) setAgama(dp.agama);
          if (dp.pendidikan) setPendidikan(dp.pendidikan);
          if (dp.pekerjaan) setPekerjaan(dp.pekerjaan);
          if (dp.statusPerkawinan) setStatusPerkawinan(dp.statusPerkawinan);
          if (dp.kewarganegaraan) setKewarganegaraan(dp.kewarganegaraan);
          if (dp.alamat) {
            if (dp.alamat.alamatKtp) setAlamatKtp(dp.alamat.alamatKtp);
            if (dp.alamat.alamatDomisili) setAlamatDomisili(dp.alamat.alamatDomisili);
            if (dp.alamat.rtRw) setRtRw(dp.alamat.rtRw);
            if (dp.alamat.desaKelurahan) setDesaKelurahan(dp.alamat.desaKelurahan);
            if (dp.alamat.kecamatan) setKecamatan(dp.alamat.kecamatan);
            if (dp.alamat.kabupatenKota) setKabupatenKota(dp.alamat.kabupatenKota);
            if (dp.alamat.provinsi) setProvinsi(dp.alamat.provinsi);
            if (dp.alamat.kodePos) setKodePos(dp.alamat.kodePos);
          }
          if (dp.kontak) {
            if (dp.kontak.kontakDarurat) setKontakDarurat(dp.kontak.kontakDarurat);
            if (dp.kontak.hubunganKontakDarurat) setHubunganKontakDarurat(dp.kontak.hubunganKontakDarurat);
            if (dp.kontak.noHpDarurat) setNoHpDarurat(dp.kontak.noHpDarurat);
          }
          if (dp.penjamin) {
            if (dp.penjamin.jenisPenjamin) setJenisPenjamin(dp.penjamin.jenisPenjamin);
            if (dp.penjamin.noBpjs) setNoBpjs(dp.penjamin.noBpjs);
          }
        }
      }
    } catch (err) {
      console.error('Check patient error:', err);
    } finally {
      setIsCheckingPasien(false);
    }
  };

  // Auth Action 1: Submit Phone Number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setDevOtpHint(null);

    if (!nomorWa || nomorWa.length < 10) {
      setAuthError('Nomor WhatsApp minimal 10 digit angka');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await portalPasienService.requestOtp(nomorWa);
      if (res.exists) {
        // Nomor sudah terdaftar -> Langsung minta PIN (Hemat OTP)
        setAuthStep('ENTER_PIN');
        setAuthSuccess(res.message);
      } else {
        // Nomor baru -> Minta OTP & buat PIN
        setAuthStep('OTP_SET_PIN');
        setAuthSuccess(res.message);
        if (res.debugOtp) {
          setDevOtpHint(res.debugOtp);
        }
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'Gagal memproses nomor WhatsApp');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Auth Action 2: Verify OTP and Create PIN
  const handleVerifyOtpAndSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!otpCode || otpCode.length !== 6) {
      setAuthError('Kode OTP harus 6 digit');
      return;
    }

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setAuthError('PIN harus berupa 6 digit angka');
      return;
    }

    if (pin !== confirmPin) {
      setAuthError('Konfirmasi PIN tidak cocok');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await portalPasienService.verifyOtpAndSetPin(nomorWa, otpCode, pin);
      if (res.success && res.token) {
        localStorage.setItem('siapkes_pasien_token', res.token);
        setToken(res.token);
        setUserProfile(res.user);
        loadProfile(res.token);
        setAuthSuccess('Nomor WhatsApp dan PIN berhasil didaftarkan!');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'Verifikasi OTP gagal');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Auth Action 3: Login with PIN
  const handleLoginPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!pin || pin.length !== 6) {
      setAuthError('Masukkan 6-digit PIN Anda');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await portalPasienService.loginWithPin(nomorWa, pin);
      if (res.success && res.token) {
        localStorage.setItem('siapkes_pasien_token', res.token);
        setToken(res.token);
        setUserProfile(res.user);
        loadProfile(res.token);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'PIN salah');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Auth Action 4: Forgot PIN Request OTP
  const handleForgotPinRequest = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setDevOtpHint(null);
    setIsLoadingAuth(true);
    try {
      const res = await portalPasienService.forgotPinRequestOtp(nomorWa);
      setAuthStep('OTP_SET_PIN');
      setAuthSuccess('Kode OTP baru telah dikirimkan ke WhatsApp Anda untuk mengatur ulang PIN.');
      if (res.debugOtp) {
        setDevOtpHint(res.debugOtp);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'Gagal mengirim OTP reset');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('siapkes_pasien_token');
    setToken(null);
    setUserProfile(null);
    setAuthStep('PHONE');
    setPin('');
    setConfirmPin('');
    setOtpCode('');
    setBookingResult(null);
  };

  // Select Family Member from Saved List
  const handleSelectKeluarga = (k: PasienKeluarga) => {
    setSelectedKeluargaId(k.id);
    setNik(k.nik);
    setNamaLengkap(k.namaLengkap);
    setTanggalLahir(new Date(k.tanggalLahir).toISOString().split('T')[0]);
    setHubunganKeluarga(k.hubunganKeluarga);
    setJenisKelamin(k.jenisKelamin || 'Laki-laki');
  };

  const handleSelectNewPatient = () => {
    setSelectedKeluargaId('NEW');
    setNik('');
    setNamaLengkap('');
    setTanggalLahir('');
    setHubunganKeluarga('Diri Sendiri');
    setJenisKelamin('Laki-laki');
    setPasienStatus(null);
    setNoKk('');
    setTempatLahir('');
    setGolonganDarah('');
    setRhesus('');
    setAgama('Islam');
    setPendidikan('SMA/SMK');
    setPekerjaan('Wiraswasta');
    setStatusPerkawinan('Belum Kawin');
    setKewarganegaraan('WNI');
    setAlamatKtp('');
    setAlamatDomisili('');
    setIsDomisiliSamaKtp(true);
    setRtRw('001/001');
    setDesaKelurahan('');
    setKecamatan('');
    setKabupatenKota('Kabupaten Bogor');
    setProvinsi('Jawa Barat');
    setKodePos('16911');
    setKontakDarurat('');
    setHubunganKontakDarurat('Keluarga');
    setNoHpDarurat('');
    setJenisPenjamin('Umum');
    setNoBpjs('');
  };

  // Save new family member to account
  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingFamily(true);
    try {
      const res = await portalPasienService.addKeluarga(newFamilyForm, token);
      if (res.success) {
        await loadProfile(token);
        setShowAddFamilyModal(false);
        setNewFamilyForm({
          nik: '',
          namaLengkap: '',
          tanggalLahir: '',
          hubunganKeluarga: 'Anak',
          jenisKelamin: 'Laki-laki'
        });
        alert('Anggota keluarga berhasil ditambahkan ke akun WhatsApp Anda!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan anggota keluarga');
    } finally {
      setIsSavingFamily(false);
    }
  };

  // Submit Online Queue Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!selectedFaskesId || !selectedPoliId || !selectedDokterId || selectedDokterId === 'Bebas' || !nik || !namaLengkap || !tanggalLahir || !tanggalKunjungan) {
      alert('Mohon lengkapi seluruh formulir pendaftaran utama (Faskes, Poli, Dokter Bertugas, NIK, Nama, Tanggal Lahir & Kunjungan).');
      return;
    }

    if (nik.length < 16) {
      alert('NIK harus 16 digit angka');
      return;
    }

    // Validasi untuk Pasien Baru jika mendaftar mandiri
    if (!pasienStatus?.isLama) {
      if (!tempatLahir || !alamatKtp) {
        alert('Mohon lengkapi Tempat Lahir dan Alamat KTP untuk pendaftaran Pasien Baru.');
        return;
      }
      if (jenisPenjamin === 'BPJS Kesehatan' && !noBpjs) {
        alert('Mohon masukkan Nomor Kartu BPJS / KIS Anda.');
        return;
      }
      if (!persetujuanPengobatan || !persetujuanRekamMedis) {
        alert('Mohon setujui Persetujuan Pengobatan Umum & Rekam Medis Elektronik.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        faskesId: selectedFaskesId,
        poliklinikId: selectedPoliId,
        dokterId: selectedDokterId,
        nik,
        namaLengkap,
        tanggalLahir,
        tanggalKunjungan,
        keluhan,
        hubunganKeluarga,
        jenisKelamin,
        // Data demografi Pasien Baru
        noKk: noKk || undefined,
        tempatLahir: tempatLahir || undefined,
        golonganDarah: golonganDarah || undefined,
        rhesus: rhesus || undefined,
        agama: agama || 'Islam',
        pendidikan: pendidikan || undefined,
        pekerjaan: pekerjaan || 'Wiraswasta',
        statusPerkawinan: statusPerkawinan || 'Belum Kawin',
        kewarganegaraan: kewarganegaraan || 'WNI',
        alamatKtp: alamatKtp || undefined,
        alamatDomisili: isDomisiliSamaKtp ? (alamatKtp || undefined) : (alamatDomisili || alamatKtp || undefined),
        rtRw: rtRw || '001/001',
        desaKelurahan: desaKelurahan || undefined,
        kecamatan: kecamatan || undefined,
        kabupatenKota: kabupatenKota || 'Kabupaten Bogor',
        provinsi: provinsi || 'Jawa Barat',
        kodePos: kodePos || '16911',
        noHp: userProfile?.nomorWa || nomorWa || undefined,
        kontakDarurat: kontakDarurat || namaLengkap,
        hubunganKontakDarurat: hubunganKontakDarurat || 'Keluarga',
        noHpDarurat: noHpDarurat || userProfile?.nomorWa || nomorWa || undefined,
        jenisPenjamin: jenisPenjamin || 'Umum',
        noBpjs: jenisPenjamin === 'BPJS Kesehatan' ? noBpjs : undefined,
        persetujuanPengobatan,
        persetujuanRekamMedis,
        persetujuanSatusehat
      };

      const res = await portalPasienService.createBooking(payload, token);
      if (res.success && res.data) {
        setBookingResult(res.data);
        await loadProfile(token);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Pendaftaran antrean gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-none flex items-center justify-center font-black text-white text-lg">
              S
            </div>
            <div>
              <div className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                SIAP-KES <span className="text-emerald-400 text-xs font-semibold">PORTAL PASIEN</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Pendaftaran Antrean Online dari Rumah</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {token && userProfile ? (
              <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 border border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-200">+{userProfile.nomorWa}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 ml-2 transition-colors"
                  title="Keluar dari akun WhatsApp ini"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
            ) : (
              <Link 
                href="/" 
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Beranda
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER SECTION */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-8 px-4 sm:px-6 shadow-inner relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-widest border border-emerald-400/30 mb-3">
              <ShieldCheck className="w-4 h-4" /> Layanan Resmi Dinkes Daerah
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pendaftaran Berobat & Antrean Mandiri
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Daftar dari rumah menggunakan akun WhatsApp. Satu nomor WhatsApp dapat digunakan untuk mendaftarkan beberapa NIK anggota keluarga sekaligus.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex items-center gap-4 text-xs font-medium self-start md:self-auto">
            <Smartphone className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-white font-bold">Verifikasi WhatsApp & PIN</div>
              <div className="text-blue-200 text-[11px]">Bebas biaya, tiket otomatis terkirim ke WA</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        
        {/* ============================================================ */}
        {/* STATE A: BELUM LOGIN / AUTENTIKASI WHATSAPP & PIN */}
        {/* ============================================================ */}
        {!token ? (
          <div className="max-w-md mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Card Header */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/40 rounded-none flex items-center justify-center text-emerald-400 mb-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {authStep === 'PHONE' && 'Masuk / Daftar Portal Pasien'}
                  {authStep === 'OTP_SET_PIN' && 'Verifikasi OTP & Buat PIN'}
                  {authStep === 'ENTER_PIN' && 'Masukkan PIN Keamanan'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  {authStep === 'PHONE' && 'Masukkan nomor WhatsApp Anda untuk pendaftaran antrean faskes.'}
                  {authStep === 'OTP_SET_PIN' && `Kode OTP 6-digit telah dikirimkan via WhatsApp ke nomor ${nomorWa}.`}
                  {authStep === 'ENTER_PIN' && `Nomor ${nomorWa} sudah terdaftar. Masukkan PIN Anda.`}
                </p>
              </div>

              {/* Card Body Form */}
              <div className="p-6">
                
                {/* Alerts */}
                {authError && (
                  <div className="mb-5 bg-rose-50 border-l-4 border-rose-500 p-3 flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}
                {authSuccess && (
                  <div className="mb-5 bg-emerald-50 border-l-4 border-emerald-500 p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Dev Hint if OTP generated in development */}
                {devOtpHint && (
                  <div className="mb-5 bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1">
                      <span>⚡ BANTUAN DEVELOPMENT (OTP):</span>
                    </div>
                    <div className="mt-1 text-base font-black tracking-widest text-amber-800">
                      {devOtpHint}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Pesan juga dicatat di console WhatsApp Gateway backend.
                    </div>
                  </div>
                )}

                {/* STEP 1: INPUT NOMOR WHATSAPP */}
                {authStep === 'PHONE' && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Nomor WhatsApp Aktif
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-bold border-r border-slate-200 pr-2">
                          🇮🇩 +62
                        </div>
                        <input
                          type="tel"
                          required
                          value={nomorWa}
                          onChange={(e) => setNomorWa(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="81234567890"
                          className="w-full pl-20 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all rounded-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Contoh: 08123456789 atau 8123456789 (awalan 0 otomatis dikonversi).
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoadingAuth}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-md disabled:bg-slate-300"
                      >
                        {isLoadingAuth ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Memeriksa Nomor...
                          </>
                        ) : (
                          <>
                            Lanjutkan <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 mt-4 text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Hemat OTP & Aman
                      </div>
                      <div>
                        Jika nomor sudah pernah terdaftar, Anda cukup memasukkan PIN tanpa perlu menunggu kode OTP lagi.
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 2A: NOMOR BARU -> INPUT OTP & BUAT PIN */}
                {authStep === 'OTP_SET_PIN' && (
                  <form onSubmit={handleVerifyOtpAndSetPin} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Kode OTP (6 Digit)
                        </label>
                        <button
                          type="button"
                          onClick={() => setAuthStep('PHONE')}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Ganti Nomor
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        className="w-full text-center tracking-[0.5em] text-xl font-black py-2.5 bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Buat PIN 6-Digit Baru
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.4em] text-xl font-black py-2 bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none rounded-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        PIN ini digunakan untuk login cepat berikutnya tanpa kirim OTP.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Konfirmasi PIN 6-Digit
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.4em] text-xl font-black py-2 bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none rounded-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoadingAuth}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-md disabled:bg-slate-300"
                      >
                        {isLoadingAuth ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Memvalidasi...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Simpan PIN & Masuk
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2B: NOMOR SUDAH ADA -> CUKUP MASUKKAN PIN */}
                {authStep === 'ENTER_PIN' && (
                  <form onSubmit={handleLoginPin} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          PIN Keamanan 6-Digit
                        </label>
                        <button
                          type="button"
                          onClick={() => setAuthStep('PHONE')}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Ganti Nomor
                        </button>
                      </div>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        autoFocus
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.4em] text-2xl font-black py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none rounded-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoadingAuth}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-md disabled:bg-slate-300"
                      >
                        {isLoadingAuth ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi PIN...
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" /> Masuk ke Antrean
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleForgotPinRequest}
                        disabled={isLoadingAuth}
                        className="text-xs text-slate-500 hover:text-blue-600 font-medium underline"
                      >
                        Lupa PIN? Kirim OTP ke WhatsApp
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </div>
        ) : (
          
          /* ============================================================ */
          /* STATE B: SUDAH LOGIN DENGAN WHATSAPP + PIN */
          /* ============================================================ */
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* TICKET POPUP / MODAL IF JUST CREATED */}
            {bookingResult && (
              <div className="bg-emerald-900 text-white p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl relative mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 text-slate-900 rounded-none flex items-center justify-center font-black">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                        PENDAFTARAN ANTREAN ONLINE BERHASIL!
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        Tiket Antrean Puskesmas Digital
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                    >
                      <Printer className="w-4 h-4" /> Cetak Tiket
                    </button>
                    <button
                      onClick={() => setBookingResult(null)}
                      className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-emerald-800 text-emerald-200 hover:bg-emerald-700 font-semibold text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  {/* Left Column: Big Queue Number */}
                  <div className="bg-emerald-950/70 p-6 border border-emerald-700/50 flex flex-col items-center justify-center text-center">
                    <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Nomor Antrean Anda</div>
                    <div className="text-5xl font-black tracking-tight text-white mb-2">{bookingResult.noAntrian}</div>
                    <div className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 font-mono font-bold tracking-widest border border-emerald-400/40">
                      {bookingResult.kodeBooking}
                    </div>
                    <div className="text-[11px] text-emerald-300/80 mt-3">
                      Status: <span className="font-bold text-white uppercase">{bookingResult.jenisPasien === 'LAMA' ? 'Pasien Lama' : 'Pasien Baru'}</span>
                    </div>
                  </div>

                  {/* Middle Column: Details */}
                  <div className="space-y-3 text-xs md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-950/40 p-3 border border-emerald-800">
                        <div className="text-emerald-400 font-bold">FASILITAS KESEHATAN TUJUAN:</div>
                        <div className="text-white text-sm font-black mt-0.5">{bookingResult.faskes?.namaFaskes}</div>
                        <div className="text-emerald-200/70 text-[11px]">{bookingResult.faskes?.alamat || 'Kabupaten'}</div>
                      </div>
                      <div className="bg-emerald-950/40 p-3 border border-emerald-800">
                        <div className="text-emerald-400 font-bold">POLIKLINIK & DOKTER:</div>
                        <div className="text-white text-sm font-black mt-0.5">{bookingResult.poliklinik?.namaPoli}</div>
                        <div className="text-emerald-200/70 text-[11px]">{bookingResult.dokter?.namaLengkap || 'Dokter Jaga Poli'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-950/40 p-3 border border-emerald-800">
                        <div className="text-emerald-400 font-bold">DATA PASIEN:</div>
                        <div className="text-white font-bold">{bookingResult.namaLengkap}</div>
                        <div className="text-emerald-200/70">NIK: {bookingResult.nik}</div>
                        {bookingResult.noRM && (
                          <div className="text-amber-300 font-semibold mt-0.5">No. RM: {bookingResult.noRM}</div>
                        )}
                      </div>
                      <div className="bg-emerald-950/40 p-3 border border-emerald-800">
                        <div className="text-emerald-400 font-bold">JADWAL KEDATANGAN:</div>
                        <div className="text-white font-bold">
                          {new Date(bookingResult.tanggalKunjungan).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-emerald-300 text-[11px] mt-0.5">Hadir 15 menit sebelum layanan. Menuju Ruang Pemeriksaan Awal (Perawat) setelah konfirmasi loket.</div>
                      </div>
                    </div>

                    <div className="bg-emerald-800/40 p-3 border border-emerald-600/50 flex items-center gap-2.5 text-xs text-emerald-200">
                      <Send className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                      <span>
                        Pesan konfirmasi & ringkasan tiket ini juga telah dikirimkan ke nomor WhatsApp Anda (*+{userProfile?.nomorWa}*).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WELCOME / USER INFO BAR */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sesi Pasien Terhubung:</span>
                    <span className="text-sm font-black text-emerald-400">+{userProfile?.nomorWa || nomorWa}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">AKTIF</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Silakan isi formulir di bawah untuk mendaftarkan antrean berobat diri sendiri atau anggota keluarga.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Ganti Nomor / Keluar
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-200 bg-white">
              <button
                onClick={() => setActiveTab('BOOKING')}
                className={`py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === 'BOOKING'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> Ambil Antrean Baru
              </button>

              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === 'HISTORY'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" /> Riwayat Antrean ({userProfile?.bookings?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('FAMILY')}
                className={`py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === 'FAMILY'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" /> NIK Keluarga Tersimpan ({userProfile?.keluarga?.length || 0})
              </button>
            </div>

            {/* ============================================================ */}
            {/* TAB 1: FORMULIR PENDAFTARAN ANTREAN */}
            {/* ============================================================ */}
            {activeTab === 'BOOKING' && (
              <form onSubmit={handleBookingSubmit} className="bg-white shadow-sm border border-slate-200 p-6 sm:p-8 space-y-8">
                
                {/* BAGIAN 1: PILIH FASILITAS KESEHATAN */}
                <div>
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                    <div className="w-7 h-7 bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Pilih Puskesmas / Faskes Tujuan
                      </h3>
                      <p className="text-xs text-slate-500">Pilih faskes terdekat di wilayah domisili Anda</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {faskesList.map((faskes) => {
                      const isSelected = selectedFaskesId === faskes.id;
                      return (
                        <div
                          key={faskes.id}
                          onClick={() => setSelectedFaskesId(faskes.id)}
                          className={`p-4 border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-bold text-slate-900 text-sm">{faskes.namaFaskes}</div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Kecamatan {faskes.kecamatan}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{faskes.alamat || 'Puskesmas Kabupaten'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BAGIAN 2: POLIKLINIK & DOKTER */}
                <div>
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                    <div className="w-7 h-7 bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Pilih Poliklinik & Dokter
                      </h3>
                      <p className="text-xs text-slate-500">Layanan poliklinik spesifik dan dokter penanggung jawab</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Poliklinik Tujuan *
                      </label>
                      <select
                        required
                        value={selectedPoliId}
                        onChange={(e) => {
                          setSelectedPoliId(e.target.value);
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none rounded-none"
                      >
                        <option value="">-- Pilih Poliklinik * --</option>
                        {poliList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.namaPoli}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Pilihan Dokter Bertugas *
                      </label>
                      <select
                        required
                        value={selectedDokterId}
                        onChange={(e) => setSelectedDokterId(e.target.value)}
                        disabled={!selectedPoliId || dokterList.length === 0}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none rounded-none disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">
                          {!selectedPoliId
                            ? '-- Pilih Poliklinik Terlebih Dahulu --'
                            : dokterList.length === 0
                            ? '-- Tidak Ada Dokter Bertugas --'
                            : '-- Pilih Dokter Bertugas * --'}
                        </option>
                        {dokterList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.namaLengkap}
                          </option>
                        ))}
                      </select>
                      {selectedPoliId && dokterList.length === 0 && (
                        <p className="text-xs text-amber-600 font-semibold mt-1">
                          Belum ada dokter yang bertugas di poli ini. Silakan pilih poli lain atau hubungi faskes.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* BAGIAN 3: IDENTITAS PASIEN & PENCOCOKAN LAMA VS BARU */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        3
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Identitas Pasien (Pilih NIK Keluarga)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Satu akun WhatsApp dapat menyimpan NIK Anda dan seluruh anggota keluarga
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowAddFamilyModal(true)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 border border-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Anggota Keluarga
                    </button>
                  </div>

                  {/* List NIK Keluarga Tersimpan */}
                  {userProfile?.keluarga && userProfile.keluarga.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Pilih Cepat NIK Tersimpan di Nomor Ini:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {userProfile.keluarga.map((k: PasienKeluarga) => {
                          const isSelected = selectedKeluargaId === k.id;
                          return (
                            <div
                              key={k.id}
                              onClick={() => handleSelectKeluarga(k)}
                              className={`p-3 border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-xs">{k.namaLengkap}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-1.5 py-0.5 text-slate-700">
                                  {k.hubunganKeluarga}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">NIK: {k.nik}</div>
                            </div>
                          );
                        })}
                        <div
                          onClick={handleSelectNewPatient}
                          className={`p-3 border border-dashed cursor-pointer transition-all flex items-center justify-center text-center ${
                            selectedKeluargaId === 'NEW'
                              ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs">+ Input NIK Lainnya</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Data Pasien Form */}
                  <div className="bg-slate-50 p-4 border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          NIK Pasien (16 Digit KTP/KK) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          value={nik}
                          onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="320101xxxxxxxxxx"
                          className="w-full p-2.5 bg-white border border-slate-300 font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nama Lengkap Sesuai KTP *
                        </label>
                        <input
                          type="text"
                          required
                          value={namaLengkap}
                          onChange={(e) => setNamaLengkap(e.target.value)}
                          placeholder="Contoh: Rahmat Susanto"
                          className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tanggal Lahir *
                        </label>
                        <input
                          type="date"
                          required
                          value={tanggalLahir}
                          onChange={(e) => setTanggalLahir(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Hubungan Keluarga
                        </label>
                        <select
                          value={hubunganKeluarga}
                          onChange={(e) => setHubunganKeluarga(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                        >
                          <option value="Diri Sendiri">Diri Sendiri</option>
                          <option value="Kepala Keluarga">Kepala Keluarga</option>
                          <option value="Suami">Suami</option>
                          <option value="Istri">Istri</option>
                          <option value="Anak">Anak</option>
                          <option value="Orang Tua">Orang Tua</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Jenis Kelamin
                        </label>
                        <select
                          value={jenisKelamin}
                          onChange={(e) => setJenisKelamin(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    {/* LIVE PENCOCOKAN LAMA VS BARU */}
                    {isCheckingPasien ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Mencocokkan riwayat rekam medis pasien di faskes ini...</span>
                      </div>
                    ) : pasienStatus ? (
                      pasienStatus.isLama ? (
                        <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-900 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-800 uppercase tracking-wide">
                              ✓ PASIEN LAMA TERIDENTIFIKASI
                            </span>
                            <div className="mt-0.5">
                              Pasien telah memiliki Nomor Rekam Medis: <span className="font-bold font-mono text-emerald-900">{pasienStatus.noRM}</span> di faskes ini.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-sky-50 border-l-4 border-sky-500 text-xs text-sky-900 flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-sky-800 uppercase tracking-wide">
                              ℹ PENDAFTARAN PASIEN BARU ONLINE
                            </span>
                            <div className="mt-0.5">
                              {pasienStatus.message || 'Kunjungan pertama kali di Puskesmas ini. Mohon lengkapi formulir pendaftaran di bawah agar data Anda langsung tersinkronkan dengan loket.'}
                            </div>
                          </div>
                        </div>
                      )
                    ) : null}

                    {/* KHUSUS PASIEN BARU: FORMULIR LENGKAP DISINKRONKAN DENGAN LOKET */}
                    {!pasienStatus?.isLama && (
                      <div className="pt-4 border-t border-slate-200 space-y-6 animate-in fade-in duration-300">
                        <div className="bg-blue-50/80 border-l-4 border-blue-600 p-4">
                          <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                            Formulir Kelengkapan Pasien Baru (Standar Loket Faskes)
                          </h4>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Data di bawah ini disinkronkan langsung ke Master Pasien Puskesmas. Saat Anda tiba di loket, seluruh data ini langsung tersedia sehingga loket dapat memproses kunjungan Anda secara instan.
                          </p>
                        </div>

                        {/* SUB-BAGIAN A: DATA DEMOGRAFI LANJUTAN */}
                        <div>
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600"></span> Data Kependudukan & Sosial
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                No. Kartu Keluarga (KK)
                              </label>
                              <input
                                type="text"
                                maxLength={16}
                                value={noKk}
                                onChange={(e) => setNoKk(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="16 Digit No. KK (Opsional)"
                                className="w-full p-2 bg-white border border-slate-300 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Tempat Lahir *
                              </label>
                              <input
                                type="text"
                                required
                                value={tempatLahir}
                                onChange={(e) => setTempatLahir(e.target.value)}
                                placeholder="Contoh: Bogor"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                  Gol. Darah
                                </label>
                                <select
                                  value={golonganDarah}
                                  onChange={(e) => setGolonganDarah(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                                >
                                  <option value="">-</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="AB">AB</option>
                                  <option value="O">O</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                  Rhesus
                                </label>
                                <select
                                  value={rhesus}
                                  onChange={(e) => setRhesus(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                                >
                                  <option value="">-</option>
                                  <option value="+">+</option>
                                  <option value="-">-</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Agama
                              </label>
                              <select
                                value={agama}
                                onChange={(e) => setAgama(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              >
                                <option value="Islam">Islam</option>
                                <option value="Kristen">Kristen</option>
                                <option value="Katolik">Katolik</option>
                                <option value="Hindu">Hindu</option>
                                <option value="Buddha">Buddha</option>
                                <option value="Konghucu">Konghucu</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Pendidikan Terakhir
                              </label>
                              <select
                                value={pendidikan}
                                onChange={(e) => setPendidikan(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              >
                                <option value="SD">SD Sederajat</option>
                                <option value="SMP">SMP Sederajat</option>
                                <option value="SMA/SMK">SMA / SMK Sederajat</option>
                                <option value="D3">Diploma (D3)</option>
                                <option value="S1">Sarjana (S1)</option>
                                <option value="S2">Magister (S2)</option>
                                <option value="S3">Doktor (S3)</option>
                                <option value="Tidak Sekolah">Tidak Sekolah</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Pekerjaan
                              </label>
                              <input
                                type="text"
                                value={pekerjaan}
                                onChange={(e) => setPekerjaan(e.target.value)}
                                placeholder="Contoh: Karyawan Swasta"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Status Perkawinan
                              </label>
                              <select
                                value={statusPerkawinan}
                                onChange={(e) => setStatusPerkawinan(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              >
                                <option value="Belum Kawin">Belum Kawin</option>
                                <option value="Kawin">Kawin</option>
                                <option value="Cerai Hidup">Cerai Hidup</option>
                                <option value="Cerai Mati">Cerai Mati</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* SUB-BAGIAN B: ALAMAT KTP & DOMISILI */}
                        <div>
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600"></span> Alamat Tempat Tinggal (Sesuai KTP)
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Alamat Jalan / Gang / No. Rumah *
                              </label>
                              <input
                                type="text"
                                required
                                value={alamatKtp}
                                onChange={(e) => setAlamatKtp(e.target.value)}
                                placeholder="Contoh: Jl. Raya Cibinong No. 45"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                RT / RW
                              </label>
                              <input
                                type="text"
                                value={rtRw}
                                onChange={(e) => setRtRw(e.target.value)}
                                placeholder="001/002"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Desa / Kelurahan
                              </label>
                              <input
                                type="text"
                                value={desaKelurahan}
                                onChange={(e) => setDesaKelurahan(e.target.value)}
                                placeholder="Kelurahan"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Kecamatan
                              </label>
                              <input
                                type="text"
                                value={kecamatan}
                                onChange={(e) => setKecamatan(e.target.value)}
                                placeholder="Kecamatan"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Kabupaten / Kota
                              </label>
                              <input
                                type="text"
                                value={kabupatenKota}
                                onChange={(e) => setKabupatenKota(e.target.value)}
                                placeholder="Kabupaten Bogor"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Kode Pos
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={kodePos}
                                onChange={(e) => setKodePos(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="16911"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* SUB-BAGIAN C: KONTAK DARURAT & PENJAMIN */}
                        <div>
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600"></span> Kontak Darurat & Penjamin Pembayaran
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Nama Kontak Darurat (Keluarga)
                              </label>
                              <input
                                type="text"
                                value={kontakDarurat}
                                onChange={(e) => setKontakDarurat(e.target.value)}
                                placeholder="Nama kerabat / keluarga"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Hubungan Keluarga
                              </label>
                              <select
                                value={hubunganKontakDarurat}
                                onChange={(e) => setHubunganKontakDarurat(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              >
                                <option value="Keluarga">Keluarga</option>
                                <option value="Suami">Suami</option>
                                <option value="Istri">Istri</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Anak">Anak</option>
                                <option value="Saudara">Saudara</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                No. HP Darurat
                              </label>
                              <input
                                type="tel"
                                value={noHpDarurat}
                                onChange={(e) => setNoHpDarurat(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="08xxxxxxxxxx"
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Jenis Pembayaran / Penjamin *
                              </label>
                              <select
                                value={jenisPenjamin}
                                onChange={(e) => setJenisPenjamin(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-600 outline-none rounded-none"
                              >
                                <option value="Umum">Umum (Bayar Mandiri / Retribusi)</option>
                                <option value="BPJS Kesehatan">BPJS Kesehatan / KIS</option>
                                <option value="Asuransi Lain">Asuransi Swasta / Lainnya</option>
                              </select>
                            </div>

                            {jenisPenjamin === 'BPJS Kesehatan' && (
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                  Nomor Kartu BPJS / KIS (13 Digit) *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={13}
                                  value={noBpjs}
                                  onChange={(e) => setNoBpjs(e.target.value.replace(/[^0-9]/g, ''))}
                                  placeholder="000xxxxxxxxxx"
                                  className="w-full p-2 bg-emerald-50/50 border border-emerald-300 font-mono text-emerald-900 font-bold text-xs focus:ring-2 focus:ring-emerald-600 outline-none rounded-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SUB-BAGIAN D: PERSETUJUAN MEDIS (GENERAL CONSENT ONLINE) */}
                        <div className="p-4 bg-slate-100/70 border border-slate-300 space-y-2">
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Persetujuan Pasien (General Consent) — Cukup Dilakukan Sekali Saja
                          </div>
                          
                          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={persetujuanPengobatan}
                              onChange={(e) => setPersetujuanPengobatan(e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded-none border-slate-300"
                            />
                            <span>
                              <strong>Persetujuan Pengobatan Umum:</strong> Saya menyetujui untuk dilakukan tindakan medis dasar dan pemeriksaan rawat jalan di fasilitas kesehatan tujuan.
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={persetujuanRekamMedis}
                              onChange={(e) => setPersetujuanRekamMedis(e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded-none border-slate-300"
                            />
                            <span>
                              <strong>Rekam Medis Elektronik (RME) & SATUSEHAT:</strong> Saya menyetujui pencatatan data kesehatan saya secara elektronik dan pengintegrasiannya sesuai ketentuan Kementerian Kesehatan RI.
                            </span>
                          </label>

                          <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                            ✓ Persetujuan ini disimpan secara digital. Saat kunjungan berikutnya, Anda tidak perlu mengisi persetujuan ulang.
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                </div>

                {/* BAGIAN 4: JADWAL & KELUHAN */}
                <div>
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                    <div className="w-7 h-7 bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      4
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Tanggal Kunjungan & Keluhan
                      </h3>
                      <p className="text-xs text-slate-500">Pilih waktu berobat dan sampaikan keluhan utama</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rencana Tanggal Kunjungan *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={tanggalKunjungan}
                        onChange={(e) => setTanggalKunjungan(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Keluhan Singkat Pasien
                      </label>
                      <input
                        type="text"
                        value={keluhan}
                        onChange={(e) => setKeluhan(e.target.value)}
                        placeholder="Contoh: Demam, flu, batuk berdahak 3 hari"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    * Tiket antrean online akan otomatis tersimpan dan dikirimkan ke WhatsApp Anda.
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3.5 text-xs sm:text-sm uppercase tracking-wider rounded-none shadow-md transition-all flex items-center gap-2 disabled:bg-slate-300"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Menerbitkan Tiket...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Konfirmasi & Ambil Antrean
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* ============================================================ */}
            {/* TAB 2: RIWAYAT BOOKING & TIKET SAYA */}
            {/* ============================================================ */}
            {activeTab === 'HISTORY' && (
              <div className="bg-white shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-4">
                  Daftar Pendaftaran Antrean Online Anda
                </h3>

                {(!userProfile?.bookings || userProfile.bookings.length === 0) ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Belum ada riwayat antrean online yang dibuat.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProfile.bookings.map((b: BookingAntrean) => (
                      <div
                        key={b.id}
                        className="p-4 sm:p-5 border border-slate-200 hover:border-blue-400 bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-blue-700">{b.kodeBooking}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-none uppercase">
                              {b.statusBooking}
                            </span>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-none uppercase">
                              {b.jenisPasien === 'LAMA' ? 'Pasien Lama' : 'Pasien Baru'}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">
                            {b.namaLengkap} <span className="font-normal text-slate-500 text-xs">(NIK: {b.nik})</span>
                          </div>
                          <div className="text-xs text-slate-600">
                            🏢 {b.faskes?.namaFaskes} • 🩺 {b.poliklinik?.namaPoli} • 👨‍⚕️ {b.dokter?.namaLengkap || 'Dokter Jaga'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            📅 Kunjungan: {new Date(b.tanggalKunjungan).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">No. Antrean</div>
                          <div className="text-3xl font-black text-slate-900">{b.noAntrian}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: DAFTAR NIK KELUARGA TERSIMPAN */}
            {/* ============================================================ */}
            {activeTab === 'FAMILY' && (
              <div className="bg-white shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                      Daftar Anggota Keluarga Tersimpan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seluruh NIK yang Anda daftarkan otomatis terikat ke nomor WhatsApp ini untuk pendaftaran instan.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddFamilyModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah NIK
                  </button>
                </div>

                {(!userProfile?.keluarga || userProfile.keluarga.length === 0) ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Belum ada anggota keluarga tersimpan. NIK akan otomatis tersimpan saat Anda melakukan pendaftaran antrean.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {userProfile.keluarga.map((k: PasienKeluarga) => (
                      <div key={k.id} className="p-4 border border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-slate-900 text-sm">{k.namaLengkap}</div>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 uppercase tracking-wider">
                            {k.hubunganKeluarga}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-600 font-bold mt-1">NIK: {k.nik}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Lahir: {new Date(k.tanggalLahir).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {k.jenisKelamin || 'Laki-laki'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL: TAMBAH ANGGOTA KELUARGA */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full shadow-2xl border border-slate-300 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base uppercase tracking-wider">
                Tambah NIK Anggota Keluarga
              </h3>
              <button
                onClick={() => setShowAddFamilyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NIK (16 Digit) *</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={newFamilyForm.nik}
                  onChange={(e) => setNewFamilyForm({ ...newFamilyForm, nik: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="320101xxxxxxxxxx"
                  className="w-full p-2 bg-slate-50 border border-slate-300 text-sm font-bold font-mono outline-none rounded-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap (Sesuai KTP/KK) *</label>
                <input
                  type="text"
                  required
                  value={newFamilyForm.namaLengkap}
                  onChange={(e) => setNewFamilyForm({ ...newFamilyForm, namaLengkap: e.target.value })}
                  placeholder="Nama lengkap"
                  className="w-full p-2 bg-slate-50 border border-slate-300 text-sm font-bold outline-none rounded-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    required
                    value={newFamilyForm.tanggalLahir}
                    onChange={(e) => setNewFamilyForm({ ...newFamilyForm, tanggalLahir: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 text-sm outline-none rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hubungan</label>
                  <select
                    value={newFamilyForm.hubunganKeluarga}
                    onChange={(e) => setNewFamilyForm({ ...newFamilyForm, hubunganKeluarga: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 text-sm outline-none rounded-none"
                  >
                    <option value="Diri Sendiri">Diri Sendiri</option>
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Suami">Suami</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jenis Kelamin</label>
                <select
                  value={newFamilyForm.jenisKelamin}
                  onChange={(e) => setNewFamilyForm({ ...newFamilyForm, jenisKelamin: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 text-sm outline-none rounded-none"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingFamily}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase text-white shadow-sm flex items-center gap-1.5"
                >
                  {isSavingFamily ? 'Menyimpan...' : 'Simpan NIK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-200">SIAP-KES</span> © 2026 Dinas Kesehatan Daerah. Hak Cipta Dilindungi.
          </div>
          <div className="text-[11px] text-slate-400">
            Terhubung dengan Gateway WhatsApp & SatuSehat Kemenkes RI
          </div>
        </div>
      </footer>

    </div>
  );
}
