import api from './api';
import { Tagihan } from '../types/kasir.types';

export const kasirService = {
  getAntrian: async () => {
    const response = await api.get('/kasir/antrian');
    return response.data;
  },

  getRiwayat: async () => {
    const response = await api.get('/kasir/riwayat');
    return response.data;
  },

  generateTagihan: async (kunjunganId: string) => {
    const response = await api.post('/kasir/generate', { kunjunganId });
    return response.data;
  },

  previewTagihan: async (kunjunganId: string, options: any = {}) => {
    const response = await api.post('/kasir/preview', { kunjunganId, ...options });
    return response.data;
  },

  prosesPembayaran: async (tagihanId: string, metodePembayaran: string, jumlahBayar: number) => {
    const response = await api.post(`/kasir/${tagihanId}/bayar`, {
      metodePembayaran,
      jumlahBayar
    });
    return response.data;
  }
};
