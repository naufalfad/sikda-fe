'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { screeningSchema, type ScreeningFormData } from '../schema';

// Steps Components
import Step1Umum from './Step1Umum';
import Step2Triage from './Step2Triage';
import Step3RisikoPTM from './Step3RisikoPTM';
import Step4InfeksiJiwa from './Step4InfeksiJiwa';
import StepHeadToToe from './StepHeadToToe';
import Step5Hasil from './Step5Hasil';

import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useScreeningStore } from '@/store/screening.store';
import { CreateScreeningPayload } from '@/types/screening.types';
import { Kunjungan } from '@/types/kunjungan.types';
import { rawatJalanService } from '@/services/rawatJalan.service';

export default function ScreeningForm({ kunjungan }: { kunjungan: Kunjungan }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const { createScreening, isSubmitting, error: storeError, clearError } = useScreeningStore();

  const calculatedAge = (() => {
    if (!kunjungan?.pasien?.tanggalLahir) return 30;
    const birth = new Date(kunjungan.pasien.tanggalLahir);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  })();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(screeningSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      nomorRegistrasi: kunjungan.noAntrian || '1',
      jenisKedatangan: 'Poli',
      usia: calculatedAge,
      golonganDarah: kunjungan.pasien?.golonganDarah || '',
      rhesus: kunjungan.pasien?.rhesus === '+' || kunjungan.pasien?.rhesus === 'Positif (+)' ? '+' : (kunjungan.pasien?.rhesus === '-' || kunjungan.pasien?.rhesus === 'Negatif (-)' ? '-' : ''),
      statusKehamilan: kunjungan.pasien?.jenisKelamin === 'L' ? 'Tidak Berlaku' : '',
      riwayatKeluarga: [],
      faktorRisikoLain: [],
      ptmJantung: [],
      ptmStroke: [],
      ptmKanker: [],
      gejalaTB: [],
      riwayatTB: [],
      faktorRisikoTB: [],
      jiwaEmosional: [],
      jiwaSosial: [],
      jiwaPsikologis: [],
      jiwaBunuhDiri: [],
      jiwaZat: [],
      jiwaRiwayat: [],
      tindakLanjut: [],
      gulaDarahSewaktu: undefined,
    } as any
  });

  const jenisKedatangan = watch('jenisKedatangan');
  const usia = watch('usia');

  useEffect(() => {
    if (kunjungan?.pasien?.tanggalLahir) {
      setValue('usia', calculatedAge);
    }
  }, [kunjungan?.pasien?.tanggalLahir, calculatedAge, setValue]);

  // Conditional Logic for Steps
  const shouldSkipTriage = false;
  const shouldSkipPTM = usia !== undefined && usia < 15;

  const stepsDef = [
    { id: 1, title: 'Umum & Vital', skipped: false },
    { id: 2, title: 'Triage Pasien', skipped: shouldSkipTriage },
    { id: 3, title: 'Risiko & PTM', skipped: shouldSkipPTM },
    { id: 4, title: 'Infeksi & Jiwa', skipped: false },
    { id: 5, title: 'Head to Toe', skipped: false },
    { id: 6, title: 'Hasil & Rujukan', skipped: false },
  ];

  // Helper to find the next valid step
  const getNextStepId = (currentId: number) => {
    let nextId = currentId + 1;
    while (nextId <= 6 && stepsDef.find(s => s.id === nextId)?.skipped) {
      nextId++;
    }
    return Math.min(nextId, 6);
  };

  // Helper to find the previous valid step
  const getPrevStepId = (currentId: number) => {
    let prevId = currentId - 1;
    while (prevId >= 1 && stepsDef.find(s => s.id === prevId)?.skipped) {
      prevId--;
    }
    return Math.max(prevId, 1);
  };

  const nextStep = async () => {
    // Validasi sementara dimatikan untuk memudahkan pengetesan
    setCurrentStep(getNextStepId(currentStep));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(getPrevStepId(currentStep));
    window.scrollTo(0, 0);
  };


  const toTitleCase = (str: string | undefined | null): string | undefined => {
    if (!str) return undefined;
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  };

  const onSubmit = async (data: any) => {
    const payload: CreateScreeningPayload = {
      pasienId: kunjungan.pasienId,
      kunjunganId: kunjungan.id,
      // Step 1: Umum & Vital
      jenisKedatangan: data.jenisKedatangan,
      usia: data.usia ?? calculatedAge,
      keluhanUtama: toTitleCase(data.keluhanUtama),
      lamaKeluhan: toTitleCase(data.lamaKeluhan),
      riwayatPenyakitSekarang: toTitleCase(data.riwayatPenyakitSekarang),
      riwayatPenyakitDahulu: toTitleCase(data.riwayatPenyakitDahulu),
      riwayatAlergi: toTitleCase(data.riwayatAlergi),
      riwayatOperasi: toTitleCase(data.riwayatOperasi),
      riwayatRawatInap: toTitleCase(data.riwayatRawatInap),
      riwayatTransfusi: toTitleCase(data.riwayatTransfusi),
      riwayatPengobatan: toTitleCase(data.riwayatPengobatan),
      tinggiBadan: data.tinggiBadan,
      beratBadan: data.beratBadan,
      lingkarPerut: data.lingkarPerut,
      imt: data.imt,
      tekananDarahSistolik: data.tekananDarahSistolik,
      tekananDarahDiastolik: data.tekananDarahDiastolik,
      nadi: data.nadi,
      frekuensiNapas: data.pernapasan,
      suhuTubuh: data.suhuTubuh,
      saturasiOksigen: data.saturasiOksigen,
      skalaNyeri: data.skalaNyeri,
      // Step 2: Triage
      kategoriTriage: data.kategoriTriage || 'Hijau',
      jalanNapas: data.jalanNapas,
      sirkulasi: data.sirkulasi,
      kesadaran: data.kesadaran,
      // Step 3: PTM & Faktor Risiko
      riwayatKeluarga: data.riwayatKeluarga || [],
      merokok: data.merokok,
      lamaMerokok: data.lamaMerokok,
      jumlahBatang: data.jumlahBatang,
      alkohol: data.alkohol,
      narkoba: data.narkoba,
      aktivitasFisik: data.aktivitasFisik,
      polaMakan: data.polaMakan,
      konsumsiBuah: data.konsumsiBuah,
      konsumsiSayur: data.konsumsiSayur,
      konsumsiGaram: data.konsumsiGaram,
      konsumsiGula: data.konsumsiGula,
      tidur: data.tidur,
      faktorRisikoLain: data.faktorRisikoLain || [],
      ptmJantung: data.ptmJantung || [],
      ptmStroke: data.ptmStroke || [],
      ptmKanker: data.ptmKanker || [],
      gulaDarahSewaktu: data.gulaDarahSewaktu,
      catatanPenyakitKeluarga: toTitleCase(data.catatanPenyakitKeluarga),
      catatanGayaHidup: toTitleCase(data.catatanGayaHidup),
      catatanRisikoLain: toTitleCase(data.catatanRisikoLain),
      catatanPtmKhusus: toTitleCase(data.catatanPtmKhusus),
      catatanPengukuran: toTitleCase(data.catatanPengukuran),
      // Step 4: TB & Jiwa
      gejalaTB: data.gejalaTB || [],
      kontakTB: data.kontakTB,
      riwayatTB: data.riwayatTB || [],
      faktorRisikoTB: data.faktorRisikoTB || [],
      hasilTB: data.hasilTB,
      jiwaEmosional: data.jiwaEmosional || [],
      jiwaSosial: data.jiwaSosial || [],
      jiwaPsikologis: data.jiwaPsikologis || [],
      jiwaBunuhDiri: data.jiwaBunuhDiri || [],
      jiwaZat: data.jiwaZat || [],
      jiwaRiwayat: data.jiwaRiwayat || [],
      catatanSkriningTB: toTitleCase(data.catatanSkriningTB),
      catatanKesehatanJiwa: toTitleCase(data.catatanKesehatanJiwa),
      // Step 5: Hasil & Head to Toe
      headToToe: data.headToToe,
      statusKesehatan: data.statusKesehatan,
      prioritasPelayanan: data.prioritasPelayanan,
      tindakLanjut: data.tindakLanjut || [],
      catatanPetugas: toTitleCase(data.catatanPetugas),
      // Poli Gigi & Mulut Fields (SATUSEHAT & OHIS)
      golonganDarah: data.golonganDarah,
      rhesus: data.rhesus,
      statusKehamilan: data.statusKehamilan,
      debrisIndex: data.debrisIndex,
      kalkulusIndex: data.kalkulusIndex,
      skorOhis: data.skorOhis,
      interpretasiOhis: data.interpretasiOhis,
      riwayatAlergiAnestesi: toTitleCase(data.riwayatAlergiAnestesi),
      riwayatPengencerDarah: toTitleCase(data.riwayatPengencerDarah),
    };

    try {
      await createScreening(payload);
      
      // Save alergi if added
      if (data.alergiArr && data.alergiArr.length > 0) {
        await rawatJalanService.simpanAlergi(kunjungan.id, data.alergiArr);
      }

      setIsSuccess(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err?.response?.data?.message || storeError || 'Terjadi kesalahan sistem',
      });
    }
  };


  const fillDummyData = () => {
    // Step 1: Umum & Vital
    setValue('nomorRegistrasi', kunjungan.noAntrian || '1');
    setValue('jenisKedatangan', 'Poli');
    setValue('usia', new Date().getFullYear() - new Date(kunjungan.pasien.tanggalLahir).getFullYear() || 30);
    setValue('keluhanUtama', 'Demam tinggi naik turun sejak 3 hari yang lalu disertai batuk dan lemas.');
    setValue('lamaKeluhan', '3 hari');
    setValue('riwayatPenyakitSekarang', 'Pasien mengeluhkan demam menggigil disertai pusing dan nyeri tenggorokan.');
    setValue('riwayatPenyakitDahulu', 'Hipertensi ringan sejak 1 tahun yang lalu.');
    setValue('riwayatAlergi', 'Alergi obat Amoxicillin.');
    setValue('riwayatOperasi', 'Tidak ada riwayat operasi.');
    setValue('riwayatRawatInap', 'Pernah dirawat inap karena Thypoid 2 tahun lalu.');
    setValue('riwayatTransfusi', 'Tidak pernah transfusi darah.');
    setValue('riwayatPengobatan', 'Paracetamol 500mg 3x1 tablet (membeli bebas di apotek 2 hari lalu)');
    
    // Poli Gigi Dummy Fields
    setValue('golonganDarah', kunjungan.pasien?.golonganDarah || 'O');
    setValue('rhesus', kunjungan.pasien?.rhesus || 'Positif (+)');
    setValue('statusKehamilan', 'Tidak Hamil');
    setValue('debrisIndex', 1.2);
    setValue('kalkulusIndex', 0.8);
    setValue('skorOhis', 2.0);
    setValue('interpretasiOhis', 'Sedang');
    setValue('riwayatAlergiAnestesi', 'Tidak Ada');
    setValue('riwayatPengencerDarah', 'Tidak Ada');

    setValue('tinggiBadan', 168);
    setValue('beratBadan', 65);
    setValue('lingkarPerut', 78);
    setValue('imt', 23.0);
    setValue('tekananDarahSistolik', 120);
    setValue('tekananDarahDiastolik', 80);
    setValue('suhuTubuh', 37.2);
    setValue('nadi', 82);
    setValue('pernapasan', 18);
    setValue('saturasiOksigen', 98);
    setValue('skalaNyeri', 2);
    setValue('catatanPengukuran', 'Tanda vital dalam rentang stabil.');

    // Step 2: Triage
    setValue('kategoriTriage', 'Hijau');
    setValue('jalanNapas', 'Bebas / Normal');
    setValue('sirkulasi', 'Nadi teraba kuat, akral hangat, CRT < 2 detik');
    setValue('kesadaran', 'Alert / Compos Mentis');

    // Step 3: PTM & Gaya Hidup
    setValue('riwayatKeluarga', ['Hipertensi', 'Diabetes Mellitus']);
    setValue('catatanPenyakitKeluarga', 'Ayah riwayat Hipertensi, Ibu riwayat DM tipe 2.');
    setValue('merokok', 'Tidak');
    setValue('lamaMerokok', '0 tahun');
    setValue('jumlahBatang', '0');
    setValue('alkohol', 'Tidak');
    setValue('narkoba', 'Tidak');
    setValue('aktivitasFisik', 'Ya, ≥ 30 menit per hari');
    setValue('polaMakan', 'Teratur (3x sehari)');
    setValue('konsumsiBuah', 'Cukup (setiap hari)');
    setValue('konsumsiSayur', 'Cukup (setiap hari)');
    setValue('konsumsiGaram', 'Sedang');
    setValue('konsumsiGula', 'Sedang');
    setValue('tidur', 'Cukup (7-8 jam)');
    setValue('catatanGayaHidup', 'Pola makan dan jam tidur teratur.');
    setValue('faktorRisikoLain', ['Kurang Olahraga']);
    setValue('catatanRisikoLain', 'Bekerja kantoran dengan durasi duduk lama.');
    setValue('ptmJantung', []);
    setValue('ptmStroke', []);
    setValue('ptmKanker', []);
    setValue('gulaDarahSewaktu', 110);
    setValue('catatanPtmKhusus', 'GDS Puasa / Sewaktu normal.');

    // Step 4: Infeksi TB & Jiwa
    setValue('gejalaTB', ['Batuk ≥ 2 minggu']);
    setValue('kontakTB', 'Tidak ada');
    setValue('riwayatTB', []);
    setValue('faktorRisikoTB', []);
    setValue('hasilTB', 'Bukan Suspek');
    setValue('catatanSkriningTB', 'Batuk akut < 2 minggu, bukan indikasi TB paru.');
    setValue('jiwaEmosional', []);
    setValue('jiwaSosial', []);
    setValue('jiwaPsikologis', []);
    setValue('jiwaBunuhDiri', []);
    setValue('jiwaZat', []);
    setValue('jiwaRiwayat', []);
    setValue('catatanKesehatanJiwa', 'Status emosional dan psikologis stabil.');

    // Step 5: 28 Organ Physical Exam (Head to Toe)
    const organs = [
      'kepala', 'mata', 'telinga', 'hidung', 'rambut', 'bibir', 'gigiGeligi', 'lidah', 'langitLangit',
      'leher', 'tenggorokan', 'tonsil', 'dada', 'payudara', 'punggung',
      'perut', 'genital', 'anusDubur', 'lenganAtas', 'lenganBawah', 'jariTangan', 'kukuTangan',
      'persendianTangan', 'tungkaiAtas', 'tungkaiBawah', 'jariKaki', 'kukuKaki', 'persendianKaki'
    ];
    organs.forEach(key => {
      setValue(`headToToe.${key}.status`, 'Normal');
      setValue(`headToToe.${key}.catatan`, 'Simetris, tidak ada kelainan atau deformitas');
    });

    // Step 6: Hasil & Rujukan
    setValue('statusKesehatan', 'Rendah');
    setValue('prioritasPelayanan', 'Rutin');
    setValue('tindakLanjut', ['Pemeriksaan Dokter Umum']);
    setValue('catatanPetugas', 'Pasien tenang dan koperatif. Siap dilakukan pemeriksaan dokter poli.');
    
    Swal.fire({
      icon: 'success',
      title: 'Data Dummy Terisi 100%!',
      text: 'Seluruh kolom (Termasuk 28 Organ Head to Toe, Triage, PTM, & TB) telah terisi lengkap.',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  if (isSuccess) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Screening Berhasil Disimpan!</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Data klinis pasien telah di-input ke Rekam Medis Elektronik (RME) dan rujukan internal telah dikirimkan.
        </p>
        <button 
          onClick={() => router.push('/perawat/screening')}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
        >
          Screening Pasien Lain
        </button>
      </div>
    );
  }

  // Filter steps that are not skipped for the Stepper UI
  const visibleSteps = stepsDef;

  return (
    <div className="w-full">
      {/* Action Header for Testing */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 flex justify-between items-center rounded-none">
        <div className="text-sm text-blue-800">
          <strong>Mode Testing:</strong> Ingin mengisi form dengan cepat untuk pengetesan?
        </div>
        <button
          type="button"
          onClick={fillDummyData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors rounded-none"
        >
          Isi Data Dummy Otomatis
        </button>
      </div>

      {/* Stepper UI */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
          
          {visibleSteps.map((step) => {
            const isCurrent = currentStep === step.id;
            const isPast = currentStep > step.id;
            const isSkipped = step.skipped;
            
            let circleColor = 'bg-gray-100 border-gray-200 text-gray-400';
            if (isCurrent) circleColor = 'bg-blue-600 border-white text-white shadow-md ring-4 ring-blue-100';
            else if (isSkipped) circleColor = 'bg-gray-50 border-gray-200 text-gray-300 opacity-50 border-dashed';
            else if (isPast) circleColor = 'bg-blue-600 border-white text-white';

            return (
              <div key={step.id} className={`flex flex-col items-center ${isSkipped ? 'opacity-50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300 ${circleColor}`}>
                  {isSkipped ? '-' : (isPast ? <CheckCircle2 className="w-5 h-5" /> : step.id)}
                </div>
                <span className={`mt-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-center hidden sm:block ${isCurrent || isPast ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.title}
                </span>
                {isSkipped && <span className="text-[10px] text-gray-400 hidden sm:block italic">(Bypass)</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Area */}
      <form 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && currentStep < 6 && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            nextStep();
          }
        }}
        onSubmit={handleSubmit(onSubmit, (err) => {
          const errList = Object.keys(err).map(k => `${k}: ${err[k]?.message || 'Wajib diisi / Tidak valid'}`);
          console.error('Validation Errors keys:', Object.keys(err));
          console.error('Validation Errors messages:', errList);
          Swal.fire({
            icon: 'warning',
            title: 'Form Belum Lengkap',
            html: `<div class="text-left"><p class="font-bold">Harap periksa kembali isian form Anda:</p><ul class="list-disc pl-5 text-xs mt-2 max-h-40 overflow-y-auto">${errList.map(e => `<li>${e}</li>`).join('')}</ul></div>`,
          });
        })}>
        <div className="min-h-[400px]">
          <div className={currentStep === 1 ? 'block' : 'hidden'}>
            <Step1Umum 
              register={register} 
              errors={errors} 
              watch={watch} 
              setValue={setValue} 
              isPoliGigi={Boolean(kunjungan?.poliklinik?.namaPoli?.toLowerCase().includes('gigi'))}
            />
          </div>
          <div className={currentStep === 2 && !shouldSkipTriage ? 'block' : 'hidden'}>
            <Step2Triage register={register} errors={errors} watch={watch} setValue={setValue} />
          </div>
          <div className={currentStep === 3 && !shouldSkipPTM ? 'block' : 'hidden'}>
            <Step3RisikoPTM register={register} errors={errors} watch={watch} />
          </div>
          <div className={currentStep === 4 ? 'block' : 'hidden'}>
            <Step4InfeksiJiwa register={register} errors={errors} watch={watch} setValue={setValue} />
          </div>
          <div className={currentStep === 5 ? 'block' : 'hidden'}>
            <StepHeadToToe register={register} watch={watch} setValue={setValue} />
          </div>
          <div className={currentStep === 6 ? 'block' : 'hidden'}>
            <Step5Hasil register={register} errors={errors} watch={watch} />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`inline-flex items-center px-5 py-2.5 rounded-none font-medium text-sm transition-colors ${
              currentStep === 1 
                ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Kembali
          </button>
          
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2.5 rounded-none font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Selanjutnya
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-2.5 rounded-none font-medium text-sm text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Screening'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
