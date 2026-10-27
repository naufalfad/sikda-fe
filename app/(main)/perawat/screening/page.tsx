'use client';

import React, { useState, useEffect } from 'react';
import { kunjunganService } from '@/services/kunjungan.service';
import { Kunjungan } from '@/types/kunjungan.types';
import { 
  Activity, 
  Search, 
  RefreshCw,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function ScreeningPage() {
  const router = useRouter();
  const [kunjungans, setKunjungans] = useState<Kunjungan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchKunjungan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kunjunganService.getKunjunganScreening();
      setKunjungans(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data antrean');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKunjungan();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchKunjungan, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredKunjungan = kunjungans.filter(k => 
    k.pasien?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.noAntrian?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.poliklinik?.namaPoli?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handlePanggil = async (kunjunganId: string) => {
    try {
      await kunjunganService.panggilKunjungan(kunjunganId);
      // Jika berhasil, arahkan ke halaman form screening
      router.push(`/perawat/screening/${kunjunganId}`);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err?.response?.data?.message || 'Gagal memanggil pasien. Mungkin sudah dipanggil perawat lain.',
      });
      // Refresh list to remove the already called patient
      fetchKunjungan();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-none shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-none">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Antrean Screening & Triage</h1>
            <p className="text-sm text-gray-500 mt-1">Daftar pasien menunggu pemeriksaan awal</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari pasien / no antrean..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-none text-sm focus:ring-2 focus:ring-blue-100 transition-shadow"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <button 
            onClick={fetchKunjungan}
            className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-none transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-none flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && kunjungans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Memuat daftar antrean...</p>
        </div>
      ) : filteredKunjungan.length === 0 ? (
        <div className="bg-white rounded-none shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-none flex items-center justify-center mb-6">
            <Activity className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tidak ada antrean</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Saat ini tidak ada pasien yang menunggu untuk dilakukan screening awal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKunjungan.map((k) => (
            <div 
              key={k.id} 
              className="bg-white rounded-none shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {/* Prioritas Badge (Optional) */}
              {k.prioritas !== 'Umum' && (
                <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-none">
                  {k.prioritas}
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-blue-600 mb-1">{k.noAntrian}</div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{k.pasien?.namaLengkap}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1 gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>{k.pasien?.jenisKelamin?.toLowerCase().startsWith('l') ? 'L' : 'P'}, {calculateAge(k.pasien?.tanggalLahir)} Thn</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-none">
                  <Stethoscope className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{k.poliklinik?.namaPoli}</span>
                  {k.dokterTujuan && (
                    <span className="text-gray-500 ml-1">
                      - {k.dokterTujuan.namaLengkap || k.dokterTujuan.username}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded-none">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Masuk: {k.jamRegistrasi} WIB</span>
                </div>
              </div>

              <button 
                onClick={() => handlePanggil(k.id)}
                className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center gap-2 py-2.5 rounded-none text-sm font-medium transition-colors group"
              >
                Panggil & Periksa
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
