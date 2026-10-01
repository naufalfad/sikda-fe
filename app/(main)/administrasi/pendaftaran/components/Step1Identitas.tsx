import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue, UseFormReset } from 'react-hook-form';
import { Search, ShieldCheck, Loader2, UserPlus, History, Baby, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RegistrationFormData } from '../schema';
import { pasienService } from '@/services/pasien.service';
import { satusehatService } from '@/services/satusehat.service';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [satusehatNotFound, setSatusehatNotFound] = useState(false);
  const [detectedBooking, setDetectedBooking] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto check URL query params (e.g. from Loket dashboard "Proses" button)
  useEffect(() => {
    const nikParam = searchParams.get('nik');
    const rmParam = searchParams.get('noRM');
    const skenarioParam = searchParams.get('skenario');

    if (skenarioParam === 'Lama' || nikParam || rmParam) {
      setValue('statusPasien', 'Lama');
      setValue('isBayi', false);
      const query = nikParam || rmParam || '';
      if (query) {
        setSearchQuery(query);
        handleSearchPasienLama(query);
      }
    }
  }, [searchParams]);

  // By default, if nothing is selected, we assume 'Baru'
  const currentSkenario = isBayi ? 'Bayi' : (statusPasien === 'Lama' ? 'Lama' : 'Baru');

  // Auto generate RM Number if empty on mount or scenario change
  useEffect(() => {
    if (!statusPasien) {
      setValue('statusPasien', 'Baru');
    }
    const currentRm = watch('noRekamMedis');
    if (!currentRm && currentSkenario !== 'Lama') {
      setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
    }
  }, [statusPasien, currentSkenario, setValue, watch]);

  const setSkenario = (type: 'Baru' | 'Lama' | 'Bayi') => {
    // Reset seluruh field terlebih dahulu agar bersih
    reset();

    // Kembalikan nilai skenario karena reset() menghapus semuanya
    if (type === 'Bayi') {
      setValue('statusPasien', 'Baru'); // Technically a new patient
      setValue('isBayi', true);
      setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
    } else if (type === 'Baru') {
      setValue('statusPasien', 'Baru');
      setValue('isBayi', false);
      setValue('noRekamMedis', 'RM-' + Math.floor(Math.random() * 1000000));
    } else {
      setValue('statusPasien', 'Lama');
      setValue('isBayi', false);
    }
  };

  const handleSearchPasienLama = async (overrideQuery?: string) => {
    const q = overrideQuery || searchQuery;
    if (!q) return;
    setIsSearching(true);
    try {
      const res = await pasienService.searchPasien(q);
      if (res.success && res.data) {
        const p = res.data;
        setValue('namaLengkap', p.namaLengkap || '', { shouldValidate: true });
        setValue('nik', p.nik || '', { shouldValidate: true });
        setValue('noRekamMedis', p.noRM || '', { shouldValidate: true });
        setValue('noIHS', p.noIHS || '');
        setValue('tempatLahir', p.tempatLahir || '', { shouldValidate: true });
        if (p.tanggalLahir) {
          setValue('tanggalLahir', new Date(p.tanggalLahir).toISOString().split('T')[0], { shouldValidate: true });
        }

        // Normalisasi Jenis Kelamin (Laki-laki / Perempuan)
        if (p.jenisKelamin) {
          const normGender = p.jenisKelamin.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';
          setValue('jenisKelamin', normGender, { shouldValidate: true });
        }
        
        setValue('agama', p.agama || 'Islam', { shouldValidate: true });
        setValue('pekerjaan', p.pekerjaan || '', { shouldValidate: true });
        setValue('statusPerkawinan', p.statusPerkawinan || 'Belum Kawin', { shouldValidate: true });
        setValue('kewarganegaraan', p.kewarganegaraan || 'WNI', { shouldValidate: true });
        
        // Nomor KK, Pendidikan, Golongan Darah, Rhesus
        setValue('noKk', p.noKk || '');
        setValue('pendidikan', p.pendidikan || '');
        setValue('golonganDarah', p.golonganDarah || '');
        setValue('rhesus', p.rhesus || '');
        
        if (p.alamat) {
          const a = p.alamat;
          setValue('alamatKtp', a.alamatKtp || '', { shouldValidate: true });
          setValue('alamatDomisili', a.alamatDomisili || '', { shouldValidate: true });
          setValue('rtRw', a.rtRw || '001/001', { shouldValidate: true });
          setValue('desaKelurahan', a.desaKelurahan || '', { shouldValidate: true });
          setValue('kecamatan', a.kecamatan || '', { shouldValidate: true });
          setValue('kabupatenKota', a.kabupatenKota || '', { shouldValidate: true });
          setValue('provinsi', a.provinsi || '', { shouldValidate: true });
          setValue('kodePos', a.kodePos || '', { shouldValidate: true });
          setValue('titikGps', a.titikGps || '');
        }

        if (p.kontak) {
          setValue('noHp', p.kontak.noHp || '', { shouldValidate: true });
          setValue('email', p.kontak.email || '');
          setValue('kontakDarurat', p.kontak.kontakDarurat || '');
          setValue('hubunganKontakDarurat', p.kontak.hubunganKontakDarurat || '');
          setValue('noHpDarurat', p.kontak.noHpDarurat || '');
        }

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

        // Deteksi apakah pasien sudah pernah memiliki persetujuan medis sebelumnya
        if (p.hasPersetujuanSebelumnya || p.fotoWajah || p.noRM) {
          setValue('persetujuanPengobatan', true);
          setValue('persetujuanRekamMedis', true);
          setValue('persetujuanSatusehat', true);
          setValue('fotoWajah', p.fotoWajah || 'PREVIOUS_CONSENT_VERIFIED');
          setValue('metodePersetujuan', 'Tanda Tangan');
          setValue('tandaTangan', p.persetujuanSebelumnya?.tandaTangan || 'PREVIOUS_CONSENT_VERIFIED');
        }

        // Deteksi apakah pasien memiliki Antrean Online aktif
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
      } else {
        alert('Pasien tidak ditemukan');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan saat mencari pasien');
    } finally {
      setIsSearching(false);
    }
  };

  const handleValidasiSatusehat = async () => {
    const nik = watch('nik');
    if (!nik || nik.length !== 16) {
      alert("Masukkan 16 digit NIK terlebih dahulu");
      return;
    }
    
    setIsValidating(true);
    
    // Generate No RM if empty regardless of SATUSEHAT result
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
      
      {/* HEADER & SCENARIO SELECTION */}
      <div className="pb-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipe Pendaftaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setSkenario('Baru')}
            className={`cursor-pointer p-4 border-2 rounded-none transition-all duration-200 ${currentSkenario === 'Baru' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-none ${currentSkenario === 'Baru' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Pasien Baru</div>
                <div className="text-xs text-gray-500 mt-1">Belum pernah berobat</div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setSkenario('Lama')}
            className={`cursor-pointer p-4 border-2 rounded-none transition-all duration-200 ${currentSkenario === 'Lama' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-none ${currentSkenario === 'Lama' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Pasien Lama</div>
                <div className="text-xs text-gray-500 mt-1">Sudah memiliki No. RM</div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setSkenario('Bayi')}
            className={`cursor-pointer p-4 border-2 rounded-none transition-all duration-200 ${currentSkenario === 'Bayi' ? 'border-indigo-600 bg-indigo-50/60 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-none ${currentSkenario === 'Bayi' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Bayi Baru Lahir</div>
                <div className="text-xs text-slate-500 mt-1">Kasus belum punya NIK</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC TOP SECTION */}
      {currentSkenario === 'Lama' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">Pencarian Data Pasien Lama</h3>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Input 
                label="Masukkan NIK atau Nomor RM"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: 3171... atau RM-2023..." 
                maxLength={16}
              />
            </div>
            <button 
              type="button" 
              onClick={() => handleSearchPasienLama()}
              disabled={isSearching}
              className="h-10 px-8 w-full md:w-auto bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors rounded-none shadow-sm"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cari & Tarik Data
            </button>
          </div>
        </div>
      )}

      {currentSkenario === 'Bayi' && (
        <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-none animate-in fade-in slide-in-from-top-2">
          <h3 className="text-md font-semibold text-indigo-900 mb-4 flex items-center gap-2"><Baby className="w-5 h-5 text-indigo-600" /> Data Khusus Bayi & Orang Tua</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Ibu *" placeholder="Nama kandung ibu" {...namaIbuRest} onChange={(e) => onNamaIbuChange(formatPascalCase(e))} error={errors.namaIbu?.message} />
            <Input label="NIK Ibu *" placeholder="16 digit NIK ibu" {...register('nikIbu')} error={errors.nikIbu?.message} />
            <Input label="Nama Ayah *" placeholder="Nama ayah kandung" {...namaAyahRest} onChange={(e) => onNamaAyahChange(formatPascalCase(e))} error={errors.namaAyah?.message} />
            <Input label="Jenis Persalinan" placeholder="Normal / Caesar..." {...jenisPersalinanRest} onChange={(e) => onJenisPersalinanChange(formatPascalCase(e))} />
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">Data Identitas Utama</h3>
        
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
                label={currentSkenario === 'Bayi' ? "NIK Pasien (Belum Ada - NIK Ibu Digunakan di SATUSEHAT)" : "NIK (Nomor Induk Kependudukan) *"} 
                placeholder={currentSkenario === 'Bayi' ? "Kosong / Belum memiliki NIK" : "16 digit angka"} 
                maxLength={16} 
                readOnly={currentSkenario === 'Lama' || currentSkenario === 'Bayi'} 
                className={currentSkenario === 'Lama' || currentSkenario === 'Bayi' ? 'bg-gray-50' : ''} 
                {...register('nik')} 
                error={errors.nik?.message} 
              />
            </div>
            {currentSkenario === 'Baru' && (
              <button 
                type="button"
                onClick={handleValidasiSatusehat}
                disabled={isValidating}
                className="h-10 px-6 w-full md:w-auto bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors mt-[22px] rounded-none"
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
            placeholder="Sesuai KTP" 
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
            label="Nomor Rekam Medis (Otomatis) *" 
            readOnly 
            className="bg-gray-50 text-blue-700 font-mono" 
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
