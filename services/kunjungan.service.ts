import api from './api';
import { Kunjungan } from '../types/kunjungan.types';

export const kunjunganService = {
  getKunjunganScreening: async (): Promise<Kunjungan[]> => {
    const response = await api.get('/kunjungan/screening');
    return response.data.data;
  },
  
  getKunjunganById: async (id: string): Promise<Kunjungan> => {
    const response = await api.get(`/kunjungan/${id}`);
    return response.data.data;
  },
  
  panggilKunjungan: async (id: string): Promise<any> => {
    const response = await api.post(`/kunjungan/${id}/panggil`);
    return response.data.data;
  },

  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/kunjungan/dashboard-stats');
    return response.data.data;
  },

  getPerawatDashboardStats: async (): Promise<any> => {
    const response = await api.get('/kunjungan/perawat/dashboard-stats');
    return response.data.data;
  },

  getDokterDashboardStats: async (): Promise<any> => {
    const response = await api.get('/kunjungan/dokter/dashboard-stats');
    return response.data.data;
  },

  getDokterKinerjaHarian: async (params?: { tanggal?: string; dokterId?: string }): Promise<any> => {
    const response = await api.get('/kunjungan/dokter/kinerja-harian', { params });
    return response.data.data;
  },

  getAdminMonitoringDokter: async (params?: { tanggal?: string; poliklinikId?: string }): Promise<any> => {
    const response = await api.get('/kunjungan/admin/monitoring-dokter', { params });
    return response.data.data;
  }
};
