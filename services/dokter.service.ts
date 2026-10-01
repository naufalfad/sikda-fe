import api from './api';
import { Poliklinik } from '../types/klinik.types';

export interface Dokter {
  id: string;
  namaLengkap: string | null;
  username: string;
  role: string;
  poliklinikId: string | null;
  poliklinik?: Poliklinik | null;
  faskesId?: string | null;
  faskes?: {
    id: string;
    kodeFaskes: string;
    namaFaskes: string;
  } | null;
  tenagaMedis?: {
    nik: string;
    noIHS: string | null;
  } | null;
  createdAt: string;
}

export interface DokterPayload {
  namaLengkap?: string;
  username: string;
  password?: string;
  poliklinikId?: string;
  nik?: string;
}

export const dokterService = {
  getAllDokter: async (): Promise<Dokter[]> => {
    const response = await api.get('/dokter');
    return response.data;
  },

  createDokter: async (data: DokterPayload): Promise<Dokter> => {
    const response = await api.post('/dokter', data);
    return response.data;
  },

  updateDokter: async (id: string, data: Partial<DokterPayload>): Promise<Dokter> => {
    const response = await api.put(`/dokter/${id}`, data);
    return response.data;
  },

  deleteDokter: async (id: string): Promise<void> => {
    await api.delete(`/dokter/${id}`);
  },
};
