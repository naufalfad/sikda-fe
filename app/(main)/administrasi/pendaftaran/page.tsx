import React, { Suspense } from 'react';
import RegistrationForm from './components/RegistrationForm';

export default function PendaftaranPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pendaftaran Pasien</h1>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto">
            Lengkapi data di bawah ini untuk pendaftaran antrian, sinkronisasi SATUSEHAT, dan rekam medis.
          </p>
        </div>
        <div className="bg-white shadow-sm rounded-none p-6 sm:p-10 border border-gray-200">
          <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat Formulir Pendaftaran...</div>}>
            <RegistrationForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
