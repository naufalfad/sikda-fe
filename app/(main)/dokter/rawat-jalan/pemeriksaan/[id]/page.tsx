"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PemeriksaanRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id;
    if (id) {
      router.replace(`/dokter/rawat-jalan?kunjunganId=${id}`);
    } else {
      router.replace('/dokter/rawat-jalan');
    }
  }, [params, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-gray-600">Membuka pemeriksaan pasien...</p>
      </div>
    </div>
  );
}
