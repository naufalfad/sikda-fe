'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronRight, ChevronLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { registrationSchema, type RegistrationFormData } from '../schema';
import { TicketPrint } from '@/components/ui/TicketPrint';
import { useKlinikStore } from '@/store/klinik.store';

// Steps Components
import Step1Identitas from './Step1Identitas';
import Step2Alamat from './Step2Alamat';
import Step3Kontak from './Step3Kontak';
import Step4Administrasi from './Step4Administrasi';
import Step5Persetujuan from './Step5Persetujuan';

import { pasienService } from '@/services/pasien.service';

const steps = [
  { id: 1, title: 'Identitas Dasar' },
  { id: 2, title: 'Alamat & Sosial' },
  { id: 3, title: 'Data Kontak' },
  { id: 4, title: 'Administrasi' },
  { id: 5, title: 'Persetujuan' },
];

export default function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generatedNoAntrian, setGeneratedNoAntrian] = useState<string>('');
  
  const ticketRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: 'Nomor Antrean Pasien',
    pageStyle: `
      @page { size: 58mm 120mm; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
  });

  const { polikliniks } = useKlinikStore();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onSubmit',
  });


  const nextStep = async () => {
    // Validasi dimatikan sementara agar bisa melihat seluruh halaman
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (currentStep < 5) {
      // Jika menekan Enter di step 1-4, lanjut ke step berikutnya alih-alih submit
      nextStep();
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);

    // Pastikan ID Rekam Medis di-generate untuk Pasien Baru (jika belum ada)
    const randomId = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const finalData = {
      ...data,
      noRekamMedis: data.noRekamMedis || `RM-2026-${randomId}`,
      nik: data.nik // Gunakan NIK asli dari form
    };

    try {
      const response = await pasienService.register(finalData);
      console.log('API Response:', response);
      if (response && response.data && response.data.kunjungan) {
        setGeneratedNoAntrian(response.data.kunjungan.noAntrian);
      }
      setIsSuccess(true);
    } catch (error: any) {
      console.error('API Submission Failed:', error);
      setApiError(error.message || 'Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error('Form Validation Failed:', errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = errorKeys[0];
      alert(`Validasi gagal pada field: ${firstError}. Pesan: ${errors[firstError].message}\n\nMohon lengkapi data yang wajib diisi (seperti Foto Wajah atau Form di step sebelumnya) sebelum menyimpan.`);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-16 text-center">
        {/* Komponen Cetak (Hanya Muncul Saat di-Print) */}
        <div className="hidden">
          <TicketPrint 
            ref={ticketRef}
            noAntrian={generatedNoAntrian || 'A-001'}
            namaPasien={watch('namaLengkap') || 'Pasien Baru'}
            poliTujuan={polikliniks.find(p => p.id === watch('poliTujuan'))?.namaPoli || 'Poli Umum'}
            tanggal={watch('tanggalRegistrasi') || new Date().toISOString().split('T')[0]}
            jam={watch('jamRegistrasi') || '08:00'}
          />
        </div>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-gray-600 mb-2 max-w-md mx-auto">
          Data pasien telah berhasil disimpan. Nomor antrean: <strong>{generatedNoAntrian || 'A-001'}</strong>
        </p>

        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 max-w-md mx-auto rounded-none text-xs my-4 text-left shadow-sm">
          <p className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
            🏥 Petunjuk Alur Pasien:
          </p>
          <p className="text-blue-800">
            Arahkan pasien menuju <strong>Ruang Pemeriksaan Awal / Perawat (Screening & TTV)</strong> terlebih dahulu untuk pengukuran tanda-tanda vital sebelum dipanggil ke ruang dokter.
          </p>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all w-full sm:w-auto"
          >
            <Printer className="w-5 h-5 mr-2" />
            Cetak Struk Antrean
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all w-full sm:w-auto"
          >
            Pendaftaran Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stepper UI */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500 ease-in-out" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
          
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors duration-300 ${
                  currentStep >= step.id ? 'bg-blue-600 border-white text-white shadow-md' : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <span className={`mt-3 text-xs font-semibold uppercase tracking-wider ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={(e) => { e.preventDefault(); }}>
        {/* Form Steps */}
        <div className="mt-8">
          {currentStep === 1 && <Step1Identitas register={register} errors={errors} watch={watch} setValue={setValue} reset={reset} />}
          {currentStep === 2 && <Step2Alamat register={register} errors={errors} watch={watch} setValue={setValue} />}
          {currentStep === 3 && <Step3Kontak register={register} errors={errors} watch={watch} />}
          {currentStep === 4 && <Step4Administrasi register={register} errors={errors} watch={watch} setValue={setValue} />}
          {currentStep === 5 && <Step5Persetujuan register={register} errors={errors} setValue={setValue} watch={watch} />}
        </div>

      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-bold text-red-700">Gagal Mendaftarkan Pasien</p>
          <p className="text-sm text-red-600 mt-1">{apiError}</p>
        </div>
      )}

        {/* Navigation Buttons */}
        <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`inline-flex items-center px-5 py-2.5 rounded-none font-medium text-sm transition-colors ${
              currentStep === 1 
                ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-xs'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Kembali
          </button>
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2.5 rounded-none font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Selanjutnya
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-2.5 rounded-none font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Data Pasien'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
