import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Checkbox } from '@/components/ui/Checkbox';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { WebcamCapture } from '@/components/ui/WebcamCapture';
import { RegistrationFormData } from '../schema';
import { AlertCircle, Check, CheckCircle2, ChevronRight, Fingerprint } from 'lucide-react';

interface Step5Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

export default function Step5Persetujuan({ register, errors, setValue, watch }: Step5Props) {
  const metodePersetujuan = watch('metodePersetujuan') || 'Tanda Tangan';
  const fotoWajah = watch('fotoWajah');
  
  const statusPasien = watch('statusPasien');
  const isConsentAlreadyGiven = statusPasien === 'Lama' || fotoWajah === 'PREVIOUS_CONSENT_VERIFIED' || (Boolean(fotoWajah) && !fotoWajah?.startsWith('data:image'));
  const [showReverify, setShowReverify] = useState(false);
  
  // State 2-Step Inner Wizard (Step 1: Foto Wajah -> Step 2: Bukti Persetujuan)
  const [innerStep, setInnerStep] = useState<1 | 2>(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Persetujuan & Verifikasi Kehadiran (Consent)</h2>
        <p className="text-sm text-gray-500 mt-1">Lengkapi verifikasi foto wajah dan bukti persetujuan pasien.</p>
      </div>

      {/* BANNER JIKA PASIEN LAMA SUDAH MEMILIKI PERSETUJUAN */}
      {isConsentAlreadyGiven && !showReverify ? (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Persetujuan Pasien Terverifikasi
              </div>
              <h3 className="text-base font-black text-emerald-950 mt-0.5">
                Persetujuan RME & General Consent Telah Aktif Sebelumnya
              </h3>
              <p className="text-xs text-emerald-700 mt-1 max-w-xl">
                Pasien telah menandatangani persetujuan medis pada pendaftaran sebelumnya. Sesuai kebijakan faskes, persetujuan cukup dilakukan sekali saja sehingga loket tidak perlu mengambil foto wajah atau meminta tanda tangan ulang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReverify(true)}
            className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 border border-slate-300 transition-colors whitespace-nowrap self-end sm:self-center"
          >
            Perbarui Foto / Persetujuan (Opsional)
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-none p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Dengan menyetujui formulir ini, data identitas dan medis Anda akan dikelola dalam 
            Rekam Medis Elektronik (RME) yang aman.
          </p>
        </div>
      )}

      {showReverify && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowReverify(false)}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            ← Gunakan Persetujuan Sebelumnya (Batal Perbarui)
          </button>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="bg-white border border-gray-200 rounded-none p-5 shadow-sm hover:border-blue-300 transition-colors">
          <Checkbox
            label="Persetujuan Pengobatan Umum (General Consent)"
            description="Saya menyetujui untuk dilakukan tindakan medis dasar dan perawatan di fasilitas kesehatan ini."
            {...register('persetujuanPengobatan')}
            error={errors.persetujuanPengobatan?.message}
          />
        </div>
        
        <div className="bg-white border border-gray-200 rounded-none p-5 shadow-sm hover:border-blue-300 transition-colors">
          <Checkbox
            label="Persetujuan Rekam Medis Elektronik"
            description="Saya menyetujui data kesehatan saya dicatat secara elektronik sesuai standar Kementerian Kesehatan."
            {...register('persetujuanRekamMedis')}
            error={errors.persetujuanRekamMedis?.message}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-none p-5 shadow-sm hover:border-blue-300 transition-colors">
          <Checkbox
            label="Integrasi SATUSEHAT"
            description="Saya menyetujui data kunjungan dan rekam medis saya dikirimkan ke platform SATUSEHAT Kemenkes RI."
            {...register('persetujuanSatusehat')}
            error={errors.persetujuanSatusehat?.message}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-none p-5 shadow-sm hover:border-blue-300 transition-colors">
          <Checkbox
            label="Persetujuan Pengingat via SMS/WhatsApp (Opsional)"
            description="Saya bersedia menerima notifikasi jadwal kunjungan, obat, atau informasi kesehatan lainnya via WhatsApp."
            {...register('persetujuanReminder')}
            error={errors.persetujuanReminder?.message}
          />
        </div>
      </div>

      {/* === STEPPER BAR ALUR VERIFIKASI (Step 1 -> Step 2) Hanya Ditampilkan Jika Belum Ada Persetujuan Atau Ingin Re-verify === */}
      {(!isConsentAlreadyGiven || showReverify) && (
      <div className="pt-6 border-t border-gray-100 space-y-6">
        <div className="bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {/* Step 1 Tab Indicator */}
            <button
              type="button"
              onClick={() => setInnerStep(1)}
              className={`flex items-center gap-3 transition-all ${
                innerStep === 1 ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                innerStep === 1 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs' 
                  : fotoWajah 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
              }`}>
                {fotoWajah ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Langkah 1</span>
                <span className="text-sm">Foto Wajah Pasien</span>
              </div>
            </button>

            <ChevronRight className="w-5 h-5 text-slate-300" />

            {/* Step 2 Tab Indicator */}
            <button
              type="button"
              onClick={() => {
                if (fotoWajah) setInnerStep(2);
              }}
              disabled={!fotoWajah}
              className={`flex items-center gap-3 transition-all ${
                innerStep === 2 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
              } ${!fotoWajah ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-800 cursor-pointer'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                innerStep === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Langkah 2</span>
                <span className="text-sm">Tanda Tangan / Cap Jari</span>
              </div>
            </button>
          </div>
        </div>

        {/* === CONTENT INNER STEP 1: FOTO WAJAH PASIEN (Lebar Presisi Sejajar Header) === */}
        {innerStep === 1 && (
          <div className="bg-white border border-slate-200 p-6 shadow-xs w-full flex flex-col items-center animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                Langkah 1: Foto Wajah Pasien
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Wajib melampirkan foto wajah pasien secara real-time untuk verifikasi kehadiran RME.
              </p>
            </div>

            <div className="w-full flex flex-col items-center justify-center">
              <input type="hidden" {...register('fotoWajah')} />
              <div className="w-full">
                <WebcamCapture 
                  onCapture={(base64) => setValue('fotoWajah', base64 || '', { shouldValidate: true })}
                  error={errors.fotoWajah?.message}
                />
              </div>
            </div>

            {/* Action Bar Lanjut ke Step 2 */}
            <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInnerStep(2)}
                disabled={!fotoWajah}
                className={`px-5 py-2.5 text-sm font-semibold text-white flex items-center gap-2 transition-all rounded-none shadow-xs ${
                  fotoWajah ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Lanjut ke Langkah 2 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* === CONTENT INNER STEP 2: BUKTI PERSETUJUAN (TANDA TANGAN / CAP JARI) === */}
        {innerStep === 2 && (
          <div className="bg-white border border-slate-200 p-6 shadow-xs w-full flex flex-col items-center animate-in fade-in duration-300">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Langkah 2: Bukti Persetujuan Pasien
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih metode bukti persetujuan digital pasien atau wali pasien.
              </p>
            </div>

            <div className="flex justify-center gap-3 my-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2 hover:bg-slate-100 transition-colors">
                <input 
                  type="radio" 
                  value="Tanda Tangan" 
                  {...register('metodePersetujuan')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                Tanda Tangan Digital
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2 hover:bg-slate-100 transition-colors">
                <input 
                  type="radio" 
                  value="Cap Jari" 
                  {...register('metodePersetujuan')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                Cap Jari
              </label>
            </div>

            <div className="w-full flex justify-center mt-2">
              <div className="w-full max-w-sm">
                {metodePersetujuan === 'Tanda Tangan' ? (
                  <>
                    <input type="hidden" {...register('tandaTangan')} />
                    <SignaturePad 
                      onEnd={(dataUrl) => {
                        setValue('tandaTangan', dataUrl, { shouldValidate: true, shouldDirty: true });
                      }}
                      error={errors.tandaTangan?.message}
                    />
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-2">
                    <div className="flex flex-row gap-4 w-full h-48">
                      <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100">
                        <Fingerprint className="w-10 h-10 text-blue-500 animate-pulse mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Telunjuk Kanan</p>
                        <p className="text-xs text-slate-500 mb-4">Posisikan jari di alat scan</p>
                        <button type="button" className="bg-blue-600 text-white text-xs px-4 py-2 hover:bg-blue-700 transition-colors shadow-2xs">
                          Mulai Scan
                        </button>
                      </div>
                      <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100">
                        <Fingerprint className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Telunjuk Kiri</p>
                        <p className="text-xs text-slate-500 mb-4">Scan opsional (cadangan)</p>
                        <button type="button" className="bg-slate-200 text-slate-600 text-xs px-4 py-2 hover:bg-slate-300 transition-colors shadow-2xs">
                          Mulai Scan
                        </button>
                      </div>
                    </div>
                    <input type="hidden" {...register('capJari')} value="scanned_mock" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar Kembali ke Step 1 */}
            <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInnerStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                ← Kembali ke Langkah 1 (Foto Wajah)
              </button>

              <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Siap Disimpan
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Metadata Sistem */}
      <div className="pt-6 mt-6 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Metadata Sistem (Otomatis)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400 bg-gray-50 p-4 rounded-none">
          <div>
            <span className="block font-medium mb-1">User / Petugas:</span>
            <span>Self-Service (Pasien)</span>
          </div>
          <div>
            <span className="block font-medium mb-1">Loket:</span>
            <span>Pendaftaran Online</span>
          </div>
          <div>
            <span className="block font-medium mb-1">Device & IP:</span>
            <span>Recorded in system</span>
          </div>
          <div>
            <span className="block font-medium mb-1">Audit Trail:</span>
            <span>Created on submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
