import api from './api';
import {
  MasterTarifFee,
  PresensiNakesItem,
  RekapDokterItem,
  RekapPerawatItem,
  DashboardSummaryResponse,
} from '../types/remunerasi.types';

export const remunerasiService = {
  // 1. Master Tarif Fee
  getMasterTarif: async (): Promise<MasterTarifFee> => {
    const response = await api.get('/remunerasi/tarif');
    return response.data.data;
  },

  updateMasterTarif: async (data: Partial<MasterTarifFee>): Promise<MasterTarifFee> => {
    const response = await api.put('/remunerasi/tarif', data);
    return response.data.data;
  },

  // 2. Presensi Mandiri
  checkInMandiri: async (data: { shift?: string; catatan?: string }): Promise<PresensiNakesItem> => {
    const response = await api.post('/remunerasi/presensi/check-in', data);
    return response.data.data;
  },

  getTodayPresensi: async (): Promise<{ tanggal: string; presensi: PresensiNakesItem[]; hasCheckedIn: boolean }> => {
    const response = await api.get('/remunerasi/presensi/today');
    return response.data.data;
  },

  // 3. Manajemen Presensi
  getPresensiList: async (params?: {
    tanggalAwal?: string;
    tanggalAkhir?: string;
    profesi?: string;
    userId?: string;
    statusKehadiran?: string;
    statusPembayaran?: string;
  }): Promise<PresensiNakesItem[]> => {
    const response = await api.get('/remunerasi/presensi', { params });
    return response.data.data;
  },

  adminInputPresensi: async (data: {
    userId: string;
    tanggal: string;
    shift: string;
    statusKehadiran: string;
    catatan?: string;
    nominalFee?: number;
  }): Promise<PresensiNakesItem> => {
    const response = await api.post('/remunerasi/presensi/admin', data);
    return response.data.data;
  },

  deletePresensi: async (id: string): Promise<void> => {
    await api.delete(`/remunerasi/presensi/${id}`);
  },

  // 4. Rekapitulasi Doctor Fee
  getRekapDokter: async (params?: {
    tanggalAwal?: string;
    tanggalAkhir?: string;
    dokterId?: string;
  }): Promise<{
    periode: { tanggalAwal: string; tanggalAkhir: string };
    ringkasan: {
      totalDokter: number;
      totalPasienDitangani: number;
      totalFeeKehadiran: number;
      totalFeePenanganan: number;
      grandTotalFeeDokter: number;
    };
    dokterList: RekapDokterItem[];
  }> => {
    const response = await api.get('/remunerasi/rekap-dokter', { params });
    return response.data.data;
  },

  // 5. Rekapitulasi Fee Perawat (Kehadiran saja)
  getRekapPerawat: async (params?: {
    tanggalAwal?: string;
    tanggalAkhir?: string;
    perawatId?: string;
  }): Promise<{
    periode: { tanggalAwal: string; tanggalAkhir: string };
    ringkasan: {
      totalPerawat: number;
      totalShiftHadir: number;
      grandTotalFeePerawat: number;
    };
    perawatList: RekapPerawatItem[];
  }> => {
    const response = await api.get('/remunerasi/rekap-perawat', { params });
    return response.data.data;
  },

  // 6. Dashboard Summary
  getDashboardSummary: async (params?: { bulan?: number; tahun?: number }): Promise<DashboardSummaryResponse> => {
    const response = await api.get('/remunerasi/dashboard', { params });
    return response.data.data;
  },

  // 7. Pembayaran / Tandai Lunas
  bayarFeeNakes: async (data: { presensiIds?: string[]; feeDokterIds?: string[] }): Promise<any> => {
    const response = await api.post('/remunerasi/bayar', data);
    return response.data;
  },

  // 8. Sinkronisasi Kunjungan Lampau
  syncFeeDokter: async (params?: { tanggalAwal?: string; tanggalAkhir?: string }): Promise<any> => {
    const response = await api.post('/remunerasi/sync-fee-dokter', params);
    return response.data;
  },
};

