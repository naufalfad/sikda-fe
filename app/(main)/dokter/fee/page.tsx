"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  DollarSign,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  RefreshCw,
  UserCheck,
  Wallet,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { remunerasiService } from '@/services/remunerasi.service';
import { useAuthStore } from '@/store/auth.store';
import { RekapDokterItem, MasterTarifFee } from '@/types/remunerasi.types';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const DAFTAR_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DoctorFeePersonalPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dokterRekap, setDokterRekap] = useState<RekapDokterItem | null>(null);
  const [todayPresensi, setTodayPresensi] = useState<any>(null);
  const [masterTarif, setMasterTarif] = useState<MasterTarifFee | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>('PAGI');
  const [activeTab, setActiveTab] = useState<'pasien' | 'kehadiran'>('pasien');
  const [selectedBulan, setSelectedBulan] = useState<number>(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());

  const printSlipRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printSlipRef,
    documentTitle: `Slip_Fee_Dokter_${user?.username || 'Dokter'}`,
  });

  const fetchData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const formatYMD = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startOfMonth = new Date(selectedTahun, selectedBulan - 1, 1);
      const endOfMonth = new Date(selectedTahun, selectedBulan, 0);
      const awal = formatYMD(startOfMonth);
      const akhir = formatYMD(endOfMonth);

      const [rekapRes, todayRes, tarifRes] = await Promise.all([
        remunerasiService.getRekapDokter({
          tanggalAwal: awal,
          tanggalAkhir: akhir,
          dokterId: String(user.id),
        }),
        remunerasiService.getTodayPresensi(),
        remunerasiService.getMasterTarif(),
      ]);

      if (rekapRes?.dokterList && rekapRes.dokterList.length > 0) {
        const myRekap = rekapRes.dokterList.find((d: any) => d.dokter.id === user.id) || rekapRes.dokterList[0];
        setDokterRekap(myRekap);
      }
      setTodayPresensi(todayRes);
      setMasterTarif(tarifRes);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.warn('Sesi login telah kedaluwarsa atau tidak valid.');
        Swal.fire({
          icon: 'warning',
          title: 'Sesi Telah Berakhir',
          text: 'Sesi login Anda telah berakhir. Silakan login kembali untuk melanjutkan.',
          confirmButtonText: 'Login Ulang',
        }).then(() => {
          logout();
          router.push('/login');
        });
        return;
      }
      console.error('Error fetching doctor fee data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, selectedBulan, selectedTahun]);

  const handleClockIn = async () => {
    try {
      await remunerasiService.checkInMandiri({ shift: selectedShift });
      Swal.fire({
        icon: 'success',
        title: 'Presensi Shift Berhasil!',
        text: `Kehadiran shift ${selectedShift} berhasil dicatat. Fee kehadiran telah ditambahkan ke akun Anda.`,
      });
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal', err?.response?.data?.message || 'Gagal melakukan presensi', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Banner Dokter */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Portal Remunerasi Dokter Spesialis & Umum</span>
          </div>
          <h1 className="text-2xl font-black">
            Doctor Fee & Jaspel Saya
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            dr. {user?.namaLengkap || user?.username} • Unit: {user?.poliklinik?.namaPoli || 'Poli Umum / Rawat Jalan'}
          </p>
        </div>

        {/* Action Clock-in Button */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex flex-col sm:flex-row items-center gap-2">
          <div className="text-xs text-blue-100 flex items-center gap-1.5 flex-wrap">
            {todayPresensi?.hasCheckedIn ? (
              <span className="flex items-center text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Presensi Hari Ini:
              </span>
            ) : (
              <span>Presensi Kehadiran Shift Hari Ini:</span>
            )}
            {todayPresensi?.presensi?.map((p: any) => (
              <span key={p.shift} className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded text-[10px] font-bold">
                Shift {p.shift}
              </span>
            ))}
          </div>
          {(() => {
            const checkedShifts = (todayPresensi?.presensi || []).map((p: any) => p.shift);
            const availableShifts = ['PAGI', 'SIANG', 'MALAM'].filter((s: string) => !checkedShifts.includes(s));
            if (availableShifts.length === 0) return null;
            return (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="bg-blue-900/60 text-white text-xs font-bold rounded-lg px-2.5 py-2 border border-blue-400 focus:outline-none"
                >
                  {availableShifts.map((s: string) => (
                    <option key={s} value={s} className="bg-gray-800 text-white">Shift {s}</option>
                  ))}
                </select>
                <button
                  onClick={handleClockIn}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow transition-all active:scale-95 whitespace-nowrap"
                >
                  Clock-In
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filter Periode Bulan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Periode Laporan Akumulasi:</span>
          <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {DAFTAR_BULAN[selectedBulan - 1]} {selectedTahun}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(Number(e.target.value))}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DAFTAR_BULAN.map((b, idx) => (
              <option key={idx} value={idx + 1}>{b}</option>
            ))}
          </select>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Fee Bulan Ini (Akumulasi)</div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            Rp {(dokterRekap?.rekap.totalFeeKumulatif || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Pending: Rp {(dokterRekap?.rekap.totalBelumDibayar || 0).toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs text-blue-600 uppercase font-semibold flex items-center justify-between">
            <span>Fee Kehadiran</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Akumulasi Bulan Ini</span>
          </div>
          <div className="text-xs text-blue-600 uppercase font-semibold hidden">
            Fee Kehadiran ({dokterRekap?.kehadiran.totalHadir || 0} Shift)
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            Rp {(dokterRekap?.rekap.totalFeeKehadiran || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Rp {(masterTarif?.feeKehadiranDokter || 150000).toLocaleString('id-ID')} / shift
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs text-purple-600 uppercase font-semibold">
            Fee Penanganan ({dokterRekap?.penangananPasien.totalPasien || 0} Pasien)
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            Rp {(dokterRekap?.rekap.totalFeePenanganan || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Rp {(masterTarif?.feePerPasienDokter || 15000).toLocaleString('id-ID')} / pasien selesai
          </div>
        </div>
      </div>

      {/* Tabel Pasien yang Ditangani */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 text-purple-600 mr-2" />
            Riwayat Penanganan Pasien Saya
          </h2>
          <button
            onClick={() => handlePrint()}
            className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak Slip Fee Saya
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Waktu Pelayanan</th>
                <th className="px-6 py-3">Nama Pasien</th>
                <th className="px-6 py-3">No RM</th>
                <th className="px-6 py-3">Jenis Layanan</th>
                <th className="px-6 py-3 text-right">Fee Penanganan</th>
                <th className="px-6 py-3 text-center">Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Memuat data pemeriksaan...
                  </td>
                </tr>
              ) : !dokterRekap || dokterRekap.penangananPasien.daftarPasien.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Belum ada pasien yang selesai ditangani pada bulan ini.
                  </td>
                </tr>
              ) : (
                dokterRekap.penangananPasien.daftarPasien.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-xs font-medium text-gray-700">
                      {new Date(p.tanggalPelayanan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}{' '}
                      {new Date(p.tanggalPelayanan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">{p.namaPasien}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{p.noRM || '-'}</td>
                    <td className="px-6 py-3 text-xs text-purple-700 font-semibold">{p.jenisLayanan}</td>
                    <td className="px-6 py-3 text-right font-black text-gray-900">
                      Rp {p.nominalFee.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.statusPembayaran === 'DIBAYAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.statusPembayaran === 'DIBAYAR' ? 'LUNAS' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden printable slip */}
      <div className="hidden">
        <div ref={printSlipRef} className="p-8 text-black bg-white font-sans max-w-xl mx-auto">
          <div className="text-center border-b-2 border-black pb-3 mb-4">
            <h1 className="text-lg font-black uppercase">SLIP DOCTOR FEE PRIBADI</h1>
            <p className="text-xs">{user?.faskes?.namaFaskes || 'PUSKESMAS INDUK KABUPATEN'}</p>
          </div>
          <div className="text-xs space-y-1 mb-4">
            <div>Dokter: <strong>{user?.namaLengkap || user?.username}</strong></div>
            <div>Poli: <strong>{user?.poliklinik?.namaPoli || 'Poli Umum'}</strong></div>
            <div>Total Pasien: <strong>{dokterRekap?.penangananPasien.totalPasien || 0} Pasien</strong></div>
            <div>Total Shift Hadir: <strong>{dokterRekap?.kehadiran.totalHadir || 0} Shift</strong></div>
          </div>
          <div className="border border-black p-3 text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span>Fee Kehadiran:</span>
              <span>Rp {(dokterRekap?.rekap.totalFeeKehadiran || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Penanganan Pasien:</span>
              <span>Rp {(dokterRekap?.rekap.totalFeePenanganan || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-black pt-2 text-sm">
              <span>TOTAL DOCTOR FEE:</span>
              <span>Rp {(dokterRekap?.rekap.totalFeeKumulatif || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <p>Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

