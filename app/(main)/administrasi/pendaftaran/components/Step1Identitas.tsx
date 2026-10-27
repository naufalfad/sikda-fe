import React, { useState, useEffect, useRef } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue, UseFormReset } from 'react-hook-form';
import {
  Search, ShieldCheck, Loader2, Baby, AlertTriangle, CheckCircle2,
  X, User, MapPin, Calendar, CreditCard, RotateCcw, Sparkles, Building2,
  UserCheck, ArrowRight, Info
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RegistrationFormData } from '../schema';
import { pasienService } from '@/services/pasien.service';
import { satusehatService } from '@/services/satusehat.service';
import { useSearchParams } from 'next/navigation';

interface Step1Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  reset: UseFormReset<RegistrationFormData>;
}

export default function Step1Identitas({ register, errors, watch, setValue, reset }: Step1Props) {
  const isBayi = watch('isBayi');
  const statusPasien = watch('statusPasien');
  const namaLengkapValue = watch('namaLengkap');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const [selectedPasien, setSelectedPasien] = useState<any | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [satusehatNotFound, setSatusehatNotFound] = useState(false);
  const [detectedBooking, setDetectedBooking] = useState<any>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Pastikan noRekamMedis selalu ada untuk pendaftaran pasien baru jika belum diisi
  useEffect(() => {
    if (!statusPasien) {
      setValue('statusPasien', 'Baru');
    }
    const currentRm = watch('noRekamMedis');
    if (!currentRm && statusPasien !== 'Lama') {
      setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
    }
  }, [statusPasien, setValue, watch]);

  // Handle URL query parameters (e.g. dari dashboard loket atau antrean loket)
  useEffect(() => {
    const nikParam = searchParams.get('nik');
    const rmParam = searchParams.get('noRM');
    const namaParam = searchParams.get('nama');
    const query = nikParam || rmParam || namaParam;

    if (query) {
      setSearchQuery(query);
      (async () => {
        setIsSearching(true);
        try {
          const list = await pasienService.getPasienSuggestions(query, 10);
          if (list && list.length > 0) {
            // Jika ada kecocokan tepat atau hasil tunggal, langsung pilih
            const exactMatch = list.find((p: any) => p.nik === query || p.noRM === query || p.namaLengkap?.toLowerCase() === query.toLowerCase());
            if (exactMatch) {
              handleSelectPasien(exactMatch);
            } else if (list.length === 1) {
              handleSelectPasien(list[0]);
            } else {
              setSuggestions(list);
              setIsOpenSuggestions(true);
            }
          }
        } catch (e) {
          console.error('Error auto-searching query params:', e);
        } finally {
          setIsSearching(false);
        }
      })();
    }
  }, [searchParams]);

  // Debounced search saat petugas mengetik nama pasien (Look-Like match)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpenSuggestions(false);
      return;
    }

    // Jika teks pencarian sama persis dengan nama pasien yang saat ini dipilih, tidak perlu fetch ulang
    if (selectedPasien && searchQuery.trim().toLowerCase() === selectedPasien.namaLengkap?.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const list = await pasienService.getPasienSuggestions(searchQuery.trim(), 15);
        setSuggestions(list || []);
        setIsOpenSuggestions(true);
      } catch (err) {
        console.error('Gagal mencari saran pasien:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPasien]);

  // Tutup dropdown jika klik di luar area pencarian
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format ringkas alamat untuk preview
  const formatAlamatRingkas = (alamat: any) => {
    if (!alamat) return 'Alamat belum tercatat di sistem';
    const parts = [
      alamat.alamatKtp || alamat.alamatDomisili,
      alamat.rtRw ? `RT/RW ${alamat.rtRw}` : null,
      alamat.desaKelurahan ? `Kel. ${alamat.desaKelurahan}` : null,
      alamat.kecamatan ? `Kec. ${alamat.kecamatan}` : null,
      alamat.kabupatenKota
    ].filter(Boolean);
    return parts.join(', ') || 'Alamat belum lengkap';
  };

  // Format usia pasien
  const formatUsia = (p: any) => {
    if (p.umurText) return p.umurText;
    if (!p.tanggalLahir) return '-';
    const birth = new Date(p.tanggalLahir);
    if (isNaN(birth.getTime())) return '-';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    years = Math.max(0, years);
    return `${years} thn${years < 5 && months > 0 ? ` ${months} bln` : ''}`;
  };

  // Format tanggal Indonesia
  const formatTanggalIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Memilih Pasien Lama dari hasil Look-Like Suggestions
  const handleSelectPasien = (p: any) => {
    setSelectedPasien(p);
    setIsOpenSuggestions(false);
    setSearchQuery(p.namaLengkap || '');

    // Set Status Pasien & Pasien ID
    setValue('statusPasien', 'Lama');
    setValue('pasienId', p.id);
    setValue('isBayi', false);

    // Data Identitas Utama
    setValue('namaLengkap', p.namaLengkap || '', { shouldValidate: true });
    setValue('nik', p.nik || '', { shouldValidate: true });
    setValue('noRekamMedis', p.noRM || '', { shouldValidate: true });
    setValue('noIHS', p.noIHS || '');
    setValue('tempatLahir', p.tempatLahir || '', { shouldValidate: true });
    if (p.tanggalLahir) {
      setValue('tanggalLahir', new Date(p.tanggalLahir).toISOString().split('T')[0], { shouldValidate: true });
    }

    if (p.jenisKelamin) {
      const normGender = p.jenisKelamin.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';
      setValue('jenisKelamin', normGender, { shouldValidate: true });
    }

    setValue('agama', p.agama || 'Islam', { shouldValidate: true });
    setValue('pekerjaan', p.pekerjaan || '', { shouldValidate: true });
    setValue('statusPerkawinan', p.statusPerkawinan || 'Belum Kawin', { shouldValidate: true });
    setValue('kewarganegaraan', p.kewarganegaraan || 'WNI', { shouldValidate: true });

    setValue('noKk', p.noKk || '');
    setValue('pendidikan', p.pendidikan || '');
    setValue('golonganDarah', p.golonganDarah || '');
    setValue('rhesus', p.rhesus || '');

    // Alamat
    if (p.alamat) {
      const a = p.alamat;
      setValue('alamatKtp', a.alamatKtp || '', { shouldValidate: true });
      setValue('alamatDomisili', a.alamatDomisili || a.alamatKtp || '', { shouldValidate: true });
      setValue('rtRw', a.rtRw || '001/001', { shouldValidate: true });
      setValue('desaKelurahan', a.desaKelurahan || '', { shouldValidate: true });
      setValue('kecamatan', a.kecamatan || '', { shouldValidate: true });
      setValue('kabupatenKota', a.kabupatenKota || '', { shouldValidate: true });
      setValue('provinsi', a.provinsi || '', { shouldValidate: true });
      setValue('kodePos', a.kodePos || '', { shouldValidate: true });
      setValue('titikGps', a.titikGps || '');
    }

    // Kontak
    if (p.kontak) {
      setValue('noHp', p.kontak.noHp || '', { shouldValidate: true });
      setValue('email', p.kontak.email || '');
      setValue('kontakDarurat', p.kontak.kontakDarurat || '');
      setValue('hubunganKontakDarurat', p.kontak.hubunganKontakDarurat || '');
      setValue('noHpDarurat', p.kontak.noHpDarurat || '');
    }

    // Penjamin
    if (p.penjamin) {
      setValue('jenisPenjamin', p.penjamin.jenisPenjamin || 'Umum', { shouldValidate: true });
      setValue('noBpjs', p.penjamin.noBpjs || '');
      setValue('statusKepesertaan', p.penjamin.statusKepesertaan || '');
      setValue('faskesTingkat1', p.penjamin.faskesTingkat1 || '');
      setValue('kelasRawat', p.penjamin.kelasRawat || '');
      setValue('namaAsuransi', p.penjamin.namaAsuransi || '');
      setValue('nomorPolis', p.penjamin.nomorPolis || '');
      setValue('masaBerlakuAsuransi', p.penjamin.masaBerlakuAsuransi || '');
    }

    // Persetujuan / Consent Sebelumnya
    if (p.hasPersetujuanSebelumnya || p.fotoWajah || p.noRM) {
      setValue('persetujuanPengobatan', true);
      setValue('persetujuanRekamMedis', true);
      setValue('persetujuanSatusehat', true);
      setValue('fotoWajah', p.fotoWajah || 'PREVIOUS_CONSENT_VERIFIED');
      setValue('metodePersetujuan', 'Tanda Tangan');
      setValue('tandaTangan', p.persetujuanSebelumnya?.tandaTangan || 'PREVIOUS_CONSENT_VERIFIED');
    }

    // Antrean Online Aktif
    if (p.bookingAktif) {
      setDetectedBooking(p.bookingAktif);
      if (p.bookingAktif.poliklinikId) setValue('poliTujuan', p.bookingAktif.poliklinikId, { shouldValidate: true });
      if (p.bookingAktif.dokterId) setValue('dokterTujuan', p.bookingAktif.dokterId, { shouldValidate: true });
      if (p.bookingAktif.noAntrian) setValue('noAntrian', p.bookingAktif.noAntrian);
      if (p.bookingAktif.keluhan) setValue('diagnosaAwal', p.bookingAktif.keluhan);
      setValue('jenisPelayanan', 'Rawat Jalan', { shouldValidate: true });
      setValue('caraDatang', 'Datang sendiri', { shouldValidate: true });
    } else {
      setDetectedBooking(null);
    }
  };

  // Reset Formulir jika Loket ingin beralih mendaftarkan Pasien Baru
  const handleResetToPasienBaru = () => {
    reset();
    setSelectedPasien(null);
    setSearchQuery('');
    setSuggestions([]);
    setIsOpenSuggestions(false);
    setDetectedBooking(null);

    setValue('statusPasien', 'Baru');
    setValue('pasienId', '');
    setValue('isBayi', false);
    setValue('kewarganegaraan', 'WNI');
    setValue('agama', 'Islam');
    setValue('statusPerkawinan', 'Belum Kawin');
    setValue('rtRw', '001/001');
    setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
  };

  // Menggunakan nama yang diketik sebagai nama Pasien Baru
  const handleUseQueryForNewPatient = () => {
    setValue('statusPasien', 'Baru');
    setValue('pasienId', '');
    setSelectedPasien(null);
    setValue('namaLengkap', searchQuery);
    setIsOpenSuggestions(false);
  };

  const handleValidasiSatusehat = async () => {
    const nik = watch('nik');
    if (!nik || nik.length !== 16) {
      alert("Masukkan 16 digit NIK terlebih dahulu");
      return;
    }
    
    setIsValidating(true);
    
    const currentRm = watch('noRekamMedis');
    if (!currentRm) {
      setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
    }

    try {
      const response = await satusehatService.checkPatientNIK(nik);
      if (response.success && response.data) {
        setValue('noIHS', response.data.ihsNumber || '');
        if (response.data.pasienName) setValue('namaLengkap', response.data.pasienName);
        if (response.data.gender) setValue('jenisKelamin', response.data.gender === 'male' ? 'Laki-laki' : 'Perempuan');
        if (response.data.birthDate) setValue('tanggalLahir', response.data.birthDate);
        
        setSatusehatNotFound(false);
        alert("Data Kemenkes berhasil ditemukan dan diisikan otomatis!");
      } else {
        setSatusehatNotFound(true);
      }
    } catch (error: any) {
      setSatusehatNotFound(true);
    } finally {
      setIsValidating(false);
    }
  };

  const formatPascalCase = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    return e;
  };

  const { onChange: onNamaChange, ...namaRest } = register('namaLengkap');
  const { onChange: onTempatChange, ...tempatRest } = register('tempatLahir');
  const { onChange: onKerjaChange, ...kerjaRest } = register('pekerjaan');
  
  const { onChange: onNamaIbuChange, ...namaIbuRest } = register('namaIbu');
  const { onChange: onNamaAyahChange, ...namaAyahRest } = register('namaAyah');
  const { onChange: onJenisPersalinanChange, ...jenisPersalinanRest } = register('jenisPersalinan');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION PENCARIAN PINTAR PASIEN (LOOK-LIKE SEARCH) */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 p-5 md:p-6 border border-blue-200/80 shadow-sm relative" ref={searchContainerRef}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-md shadow-sm">
                <Search className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Pencarian Pasien (Look-Like Match)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Ketik nama pasien (depan, tengah, belakang), NIK, atau No. RM. Jika pasien terdaftar, pilih untuk <b>auto-fill</b> data. Jika pasien baru, biarkan kosong dan isi formulir di bawah secara manual.
            </p>
          </div>

          {/* Toggle Kasus Bayi Baru Lahir */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white/90 px-3 py-1.5 border border-slate-200 text-xs shadow-xs">
            <input 
              type="checkbox"
              id="isBayiToggle"
              checked={Boolean(isBayi)}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue('isBayi', checked);
                if (checked) {
                  setValue('statusPasien', 'Baru');
                }
              }}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isBayiToggle" className="cursor-pointer font-medium text-slate-700 flex items-center gap-1.5 select-none">
              <Baby className="w-4 h-4 text-indigo-600" />
              Bayi Baru Lahir (Tanpa NIK)
            </label>
          </div>
        </div>

        {/* Input Box Pencarian */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpenSuggestions(true);
              }}
              placeholder="Ketik potongan nama (misal: 'Budi' atau 'Santoso'), NIK, atau No. Rekam Medis..."
              className="w-full pl-11 pr-24 py-3 bg-white border-2 border-blue-300 focus:border-blue-600 focus:outline-none text-slate-900 placeholder-slate-400 font-medium text-sm transition-all shadow-inner"
            />

            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setIsOpenSuggestions(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                Look Like
              </span>
            </div>
          </div>

          {/* DROPDOWN PREVIEW HASIL PENCARIAN LIVE */}
          {isOpenSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 shadow-2xl z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
              {suggestions.length > 0 ? (
                <>
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Ditemukan {suggestions.length} Pasien yang Sesuai:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik salah satu untuk mengonfirmasi & memuat data
                    </span>
                  </div>

                  {suggestions.map((p) => {
                    const usia = formatUsia(p);
                    const alamatStr = formatAlamatRingkas(p.alamat);
                    const isGenderP = p.jenisKelamin?.toLowerCase().startsWith('p');

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPasien(p)}
                        className="p-3.5 hover:bg-blue-50/70 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-blue-600 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          {/* Nama Lengkap & Badge Identitas */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {p.namaLengkap}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border ${isGenderP ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {p.jenisKelamin || 'N/A'} • {usia}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              RM: {p.noRM || '-'}
                            </span>
                          </div>

                          {/* Action Hint */}
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Pilih Data</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Detail NIK & TTL */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-mono text-slate-800">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            NIK: {p.nik ? p.nik : <span className="italic text-slate-400">Belum ada NIK</span>}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Lahir: {p.tempatLahir ? `${p.tempatLahir}, ` : ''}{formatTanggalIndo(p.tanggalLahir)}
                          </span>
                          {p.faskes?.namaFaskes && (
                            <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              Faskes: {p.faskes.namaFaskes}
                            </span>
                          )}
                        </div>

                        {/* Tempat Tinggal / Alamat */}
                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-700 bg-slate-50/80 p-1.5 rounded-none border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{alamatStr}</span>
                        </div>

                        {/* Booking Antrean Online Terdeteksi */}
                        {p.bookingAktif && (
                          <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 border border-emerald-200 flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Terdaftar Antrean Online: Poli {p.bookingAktif.namaPoli} (No. {p.bookingAktif.noAntrian})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                /* KONDISI HASIL TIDAK DITEMUKAN / PASIEN BARU */
                <div className="p-6 text-center">
                  <div className="mx-auto w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-2.5">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Tidak Ditemukan Pasien dengan Nama "{searchQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Nama ini belum terdaftar di database rekam medis faskes. Kemungkinan pasien ini adalah <b>Pasien Baru</b>. Silakan lanjutkan pengisian formulir di bawah secara manual.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleUseQueryForNewPatient}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-none shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Gunakan "{searchQuery}" untuk Pasien Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpenSuggestions(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-none transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NOTIFIKASI PASIEN LAMA BERHASIL DIPILIH */}
        {selectedPasien && (
          <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-none animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-600 text-white rounded-none flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-950 text-base">
                      {selectedPasien.namaLengkap}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Pasien Lama Terverifikasi
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300">
                      No. RM: {selectedPasien.noRM}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    NIK: <b>{selectedPasien.nik || '-'}</b> • Usia: <b>{formatUsia(selectedPasien)}</b> • TTL: <b>{selectedPasien.tempatLahir ? `${selectedPasien.tempatLahir}, ` : ''}{formatTanggalIndo(selectedPasien.tanggalLahir)}</b>
                    <br />
                    Alamat: <b>{formatAlamatRingkas(selectedPasien.alamat)}</b>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1.5 italic">
                    ✓ Seluruh data identitas, alamat, kontak, dan penjamin telah terisi otomatis. Petugas dapat melanjutkan atau mengedit data bila ada perubahan.
                  </p>
                </div>
              </div>

              {/* Tombol Batalkan / Kembali ke Pasien Baru */}
              <button
                type="button"
                onClick={handleResetToPasienBaru}
                className="self-start md:self-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs rounded-none flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Ganti Pasien / Reset Form
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM DATA KHUSUS BAYI (KONDISIONAL) */}
      {isBayi && (
        <div className="p-6 bg-indigo-50/60 border border-indigo-200 rounded-none animate-in fade-in slide-in-from-top-2">
          <h3 className="text-md font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Baby className="w-5 h-5 text-indigo-600" /> Data Khusus Bayi & Orang Tua
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nama Ibu Kandung *" 
              placeholder="Nama kandung ibu" 
              {...namaIbuRest} 
              onChange={(e) => onNamaIbuChange(formatPascalCase(e))} 
              error={errors.namaIbu?.message} 
            />
            <Input 
              label="NIK Ibu Kandung *" 
              placeholder="16 digit NIK ibu" 
              maxLength={16}
              {...register('nikIbu')} 
              error={errors.nikIbu?.message} 
            />
            <Input 
              label="Nama Ayah Kandung *" 
              placeholder="Nama ayah kandung" 
              {...namaAyahRest} 
              onChange={(e) => onNamaAyahChange(formatPascalCase(e))} 
              error={errors.namaAyah?.message} 
            />
            <Input 
              label="Jenis Persalinan" 
              placeholder="Normal / Caesar..." 
              {...jenisPersalinanRest} 
              onChange={(e) => onJenisPersalinanChange(formatPascalCase(e))} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Berat Lahir (gram)" placeholder="Misal: 3200" {...register('beratLahir')} />
              <Input label="Panjang Lahir (cm)" placeholder="Misal: 50" {...register('panjangLahir')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Jam Lahir" type="time" {...register('jamLahir')} />
              <Select 
                label="Urutan Kelahiran (Kembar) *" 
                {...register('urutanKelahiran', { valueAsNumber: true })}
                error={errors.urutanKelahiran?.message}
                options={[
                  { label: 'Tunggal (Nilai: 0)', value: '0' },
                  { label: 'Anak Ke-1 (Kembar 1)', value: '1' },
                  { label: 'Anak Ke-2 (Kembar 2)', value: '2' },
                  { label: 'Anak Ke-3 (Kembar 3)', value: '3' },
                  { label: 'Anak Ke-4 (Kembar 4)', value: '4' },
                ]} 
              />
            </div>
          </div>
        </div>
      )}

      {/* CORE IDENTITY FORM */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Data Identitas Utama</h3>
          <span className="text-xs text-slate-500">
            Status: <b className={statusPasien === 'Lama' ? 'text-blue-700' : 'text-emerald-700'}>{statusPasien === 'Lama' ? 'Pasien Lama' : 'Pasien Baru'}</b>
          </span>
        </div>
        
        {detectedBooking && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-none flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">
                Pasien Terdaftar Antrean Online (Kode Booking: {detectedBooking.kodeBooking})
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Tujuan <strong>{detectedBooking.namaPoli}</strong>, dokter <strong>{detectedBooking.namaDokter || 'Dokter Jaga'}</strong>, dan nomor antrean <strong>{detectedBooking.noAntrian}</strong> telah diisi otomatis. Loket dapat langsung memverifikasi atau melengkapi data.
              </p>
            </div>
          </div>
        )}

        {satusehatNotFound && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-none flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Pasien belum terdaftar di SATUSEHAT</h4>
              <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                Sistem akan otomatis mendaftarkan identitas ini ke Kemenkes saat Anda mengklik tombol Simpan. 
                Silakan <b>lanjutkan pengisian form secara manual</b> hingga lengkap.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="md:col-span-2 flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <Input 
                label={isBayi ? "NIK Pasien (Belum Ada - NIK Ibu Digunakan di SATUSEHAT)" : "NIK (Nomor Induk Kependudukan)"} 
                placeholder={isBayi ? "Kosong / Belum memiliki NIK" : "16 digit angka (opsional bila belum ada)"} 
                maxLength={16} 
                readOnly={Boolean(isBayi)} 
                className={isBayi ? 'bg-gray-50' : ''} 
                {...register('nik')} 
                error={errors.nik?.message} 
              />
            </div>
            {!isBayi && (
              <button 
                type="button"
                onClick={handleValidasiSatusehat}
                disabled={isValidating}
                className="h-10 px-6 w-full md:w-auto bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors mt-[22px] rounded-none shadow-sm"
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Validasi SATUSEHAT
              </button>
            )}
          </div>

          <Input 
            label="Nomor KK (Opsional)" 
            placeholder="16 digit angka (opsional)" 
            maxLength={16} 
            {...register('noKk')} 
            error={errors.noKk?.message} 
          />

          <Input 
            label="Nama Lengkap *" 
            placeholder="Sesuai KTP / Dokumen Identitas" 
            {...namaRest} 
            onChange={(e) => onNamaChange(formatPascalCase(e))} 
            error={errors.namaLengkap?.message} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tempat Lahir *" 
              placeholder="Kota kelahiran" 
              {...tempatRest} 
              onChange={(e) => onTempatChange(formatPascalCase(e))} 
              error={errors.tempatLahir?.message} 
            />
            <Input 
              label="Tanggal Lahir *" 
              type="date" 
              {...register('tanggalLahir')} 
              error={errors.tanggalLahir?.message} 
            />
          </div>
          
          <Select 
            label="Jenis Kelamin *" 
            {...register('jenisKelamin')} 
            error={errors.jenisKelamin?.message} 
            options={[
              { label: '- Pilih Jenis Kelamin -', value: '' },
              { label: 'Laki-laki', value: 'Laki-laki' }, 
              { label: 'Perempuan', value: 'Perempuan' }
            ]} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Golongan Darah (Opsional)" 
              {...register('golonganDarah')} 
              error={errors.golonganDarah?.message} 
              options={[
                { label: '- Belum Diketahui / Kosong -', value: '' },
                { label: 'A', value: 'A' }, 
                { label: 'B', value: 'B' }, 
                { label: 'AB', value: 'AB' }, 
                { label: 'O', value: 'O' }
              ]} 
            />
            <Select 
              label="Rhesus (Opsional)" 
              {...register('rhesus')} 
              error={errors.rhesus?.message} 
              options={[
                { label: '- Belum Diketahui / Kosong -', value: '' },
                { label: 'Positif (+)', value: '+' }, 
                { label: 'Negatif (-)', value: '-' }
              ]} 
            />
          </div>

          <Select 
            label="Agama *" 
            {...register('agama')} 
            error={errors.agama?.message} 
            options={[
              { label: '- Pilih Agama -', value: '' },
              { label: 'Islam', value: 'Islam' }, 
              { label: 'Kristen', value: 'Kristen' }, 
              { label: 'Katolik', value: 'Katolik' }, 
              { label: 'Hindu', value: 'Hindu' }, 
              { label: 'Buddha', value: 'Buddha' }, 
              { label: 'Konghucu', value: 'Konghucu' }
            ]} 
          />
          
          <Input 
            label="Nomor Rekam Medis (No. RM) *" 
            readOnly 
            className="bg-gray-50 text-blue-700 font-mono font-semibold" 
            {...register('noRekamMedis')} 
            error={errors.noRekamMedis?.message} 
          />
          <Input 
            label="Nomor SATUSEHAT / IHS (Opsional)" 
            placeholder="Kosongkan jika belum ada / disinkronkan nanti" 
            className="bg-white text-blue-700 font-mono" 
            {...register('noIHS')} 
            error={errors.noIHS?.message} 
          />
          <Select 
            label="Pendidikan (Opsional)" 
            {...register('pendidikan')} 
            error={errors.pendidikan?.message} 
            options={[
              { label: '- Pilih Pendidikan -', value: '' },
              { label: 'Tidak Sekolah', value: 'Tidak Sekolah' }, 
              { label: 'SD', value: 'SD' }, 
              { label: 'SMP', value: 'SMP' }, 
              { label: 'SMA/SMK', value: 'SMA/SMK' }, 
              { label: 'D3', value: 'D3' }, 
              { label: 'S1', value: 'S1' }, 
              { label: 'S2', value: 'S2' }, 
              { label: 'S3', value: 'S3' }
            ]} 
          />
          <Input 
            label="Pekerjaan *" 
            placeholder="Pekerjaan saat ini" 
            {...kerjaRest} 
            onChange={(e) => onKerjaChange(formatPascalCase(e))} 
            error={errors.pekerjaan?.message} 
          />
          <Select 
            label="Status Perkawinan *" 
            {...register('statusPerkawinan')} 
            error={errors.statusPerkawinan?.message} 
            options={[
              { label: '- Pilih Status -', value: '' },
              { label: 'Belum Kawin', value: 'Belum Kawin' }, 
              { label: 'Kawin', value: 'Kawin' }, 
              { label: 'Cerai Hidup', value: 'Cerai Hidup' }, 
              { label: 'Cerai Mati', value: 'Cerai Mati' }
            ]} 
          />
          <Select 
            label="Kewarganegaraan *" 
            {...register('kewarganegaraan')} 
            error={errors.kewarganegaraan?.message} 
            options={[
              { label: 'WNI (Warga Negara Indonesia)', value: 'WNI' }, 
              { label: 'WNA (Warga Negara Asing)', value: 'WNA' }
            ]} 
          />
        </div>
      </div>

    </div>
  );
}
