import api from './api';
import { PasienPayload, PasienResponse } from '../types/pasien.types';

export const pasienService = {
  register: async (data: PasienPayload): Promise<PasienResponse> => {
    try {
      const response = await api.post<PasienResponse>('/pasien', data);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Pendaftaran pasien gagal');
      }
      throw new Error('Terjadi kesalahan pada server saat mendaftarkan pasien');
    }
  },

  searchPasien: async (query: string): Promise<any> => {
    try {
      const response = await api.get('/pasien/search', { params: { query } });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Pencarian pasien gagal');
      }
      throw new Error('Terjadi kesalahan pada server saat mencari pasien');
    }
  },

  getAllPasien: async () => {
    try {
      const response = await api.get('/pasien');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePasien: async (id: string | number, data: any) => {
    try {
      const response = await api.put(`/pasien/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deletePasien: async (id: string | number) => {
    try {
      const response = await api.delete(`/pasien/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
