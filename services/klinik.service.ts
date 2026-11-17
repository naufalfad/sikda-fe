import api from './api';
import { Poliklinik, LayananKlinik, PoliklinikPayload, LayananKlinikPayload } from '../types/klinik.types';

export const klinikService = {
  // Poliklinik
  getPoliklinik: async (): Promise<Poliklinik[]> => {
    const response = await api.get('/klinik/poli');
    return response.data;
  },

  createPoliklinik: async (data: PoliklinikPayload): Promise<Poliklinik> => {
    const response = await api.post('/klinik/poli', data);
    return response.data;
  },

  updatePoliklinik: async (id: string, data: Partial<PoliklinikPayload>): Promise<Poliklinik> => {
    const response = await api.put(`/klinik/poli/${id}`, data);
    return response.data;
  },

  // Dokter
  getDokterByPoli: async (poliId: string): Promise<{id: string, username: string, namaLengkap?: string}[]> => {
    const response = await api.get(`/klinik/dokter/${poliId}`);
    return response.data;
  },

  // Layanan Klinik
  getLayananByPoli: async (poliId: string): Promise<LayananKlinik[]> => {
    const response = await api.get(`/klinik/layanan/${poliId}`);
    return response.data;
  },

  createLayanan: async (data: LayananKlinikPayload): Promise<LayananKlinik> => {
    const response = await api.post('/klinik/layanan', data);
    return response.data;
  },

  updateLayanan: async (id: string, data: Partial<LayananKlinikPayload>): Promise<LayananKlinik> => {
    const response = await api.put(`/klinik/layanan/${id}`, data);
    return response.data;
  },

  // Kapabilitas Penunjang Faskes (Terisolasi Otomatis sesuai Sesi Akun)
  getFaskesKapabilitas: async (): Promise<any> => {
    const response = await api.get('/klinik/kapabilitas');
    return response.data;
  },

  updateFaskesKapabilitas: async (data: any): Promise<any> => {
    const response = await api.put('/klinik/kapabilitas', data);
    return response.data;
  },
};
