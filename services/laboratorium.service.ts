import api from './api';
import { OrderLaboratoriumPayload, OrderLaboratorium } from '@/types/laboratorium.types';

export const laboratoriumService = {
  createOrder: async (data: OrderLaboratoriumPayload): Promise<OrderLaboratorium> => {
    try {
      const response = await api.post('/laboratorium/order', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAntrian: async (): Promise<any> => {
    const res = await api.get('/laboratorium/antrian');
    return res.data;
  },

  simpanHasil: async (orderId: string, details: any[]): Promise<any> => {
    const res = await api.put(`/laboratorium/order/${orderId}/hasil`, { details });
    return res.data;
  },

  getOrderByKunjungan: async (kunjunganId: string): Promise<any> => {
    const res = await api.get(`/laboratorium/order/kunjungan/${kunjunganId}`);
    return res.data;
  },

  getDashboardStats: async (): Promise<any> => {
    const res = await api.get('/laboratorium/dashboard-stats');
    return res.data;
  },

  getRiwayatLabByPasien: async (pasienId: string): Promise<any> => {
    const res = await api.get(`/laboratorium/riwayat-pasien/${pasienId}`);
    return res.data;
  }
};
