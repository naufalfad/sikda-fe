import api from './api';
import {
  MasterRuangan,
  TempatTidur,
  BedStats,
  AsetRuangan,
  AsetStats,
  RiwayatPemeliharaanAset,
  RiwayatMutasiAset
} from '../types/asetRuangan.types';

export const asetRuanganService = {
  // 1. Ruangan
  getRuangans: async (params?: any): Promise<MasterRuangan[]> => {
    const res = await api.get('/aset-ruangan/ruangan', { params });
    return res.data.data;
  },

  getRuanganById: async (id: string): Promise<MasterRuangan> => {
    const res = await api.get(`/aset-ruangan/ruangan/${id}`);
    return res.data.data;
  },

  createRuangan: async (data: Partial<MasterRuangan>): Promise<MasterRuangan> => {
    const res = await api.post('/aset-ruangan/ruangan', data);
    return res.data.data;
  },

  updateRuangan: async (id: string, data: Partial<MasterRuangan>): Promise<MasterRuangan> => {
    const res = await api.put(`/aset-ruangan/ruangan/${id}`, data);
    return res.data.data;
  },

  deleteRuangan: async (id: string): Promise<void> => {
    await api.delete(`/aset-ruangan/ruangan/${id}`);
  },

  syncRuanganSatuSehat: async (id: string): Promise<MasterRuangan> => {
    const res = await api.post(`/aset-ruangan/ruangan/${id}/sync-satusehat`);
    return res.data.data;
  },

  // 2. Tempat Tidur (Bed Management)
  getBeds: async (params?: any): Promise<TempatTidur[]> => {
    const res = await api.get('/aset-ruangan/bed', { params });
    return res.data.data;
  },

  getBedStats: async (): Promise<BedStats> => {
    const res = await api.get('/aset-ruangan/bed/stats');
    return res.data.data;
  },

  createBed: async (data: Partial<TempatTidur>): Promise<TempatTidur> => {
    const res = await api.post('/aset-ruangan/bed', data);
    return res.data.data;
  },

  updateBed: async (id: string, data: Partial<TempatTidur>): Promise<TempatTidur> => {
    const res = await api.put(`/aset-ruangan/bed/${id}`, data);
    return res.data.data;
  },

  deleteBed: async (id: string): Promise<void> => {
    await api.delete(`/aset-ruangan/bed/${id}`);
  },

  syncBedSatuSehat: async (id: string): Promise<TempatTidur> => {
    const res = await api.post(`/aset-ruangan/bed/${id}/sync-satusehat`);
    return res.data.data;
  },

  // 3. Aset Ruangan (Alkes & Sarpras)
  getAsets: async (params?: any): Promise<AsetRuangan[]> => {
    const res = await api.get('/aset-ruangan/aset', { params });
    return res.data.data;
  },

  getAsetById: async (id: string): Promise<AsetRuangan> => {
    const res = await api.get(`/aset-ruangan/aset/${id}`);
    return res.data.data;
  },

  getAsetStats: async (): Promise<AsetStats> => {
    const res = await api.get('/aset-ruangan/aset/stats');
    return res.data.data;
  },

  createAset: async (data: Partial<AsetRuangan>): Promise<AsetRuangan> => {
    const res = await api.post('/aset-ruangan/aset', data);
    return res.data.data;
  },

  updateAset: async (id: string, data: Partial<AsetRuangan>): Promise<AsetRuangan> => {
    const res = await api.put(`/aset-ruangan/aset/${id}`, data);
    return res.data.data;
  },

  deleteAset: async (id: string): Promise<void> => {
    await api.delete(`/aset-ruangan/aset/${id}`);
  },

  syncDeviceSatuSehat: async (id: string): Promise<AsetRuangan> => {
    const res = await api.post(`/aset-ruangan/aset/${id}/sync-satusehat`);
    return res.data.data;
  },

  // 4. Pemeliharaan & Kalibrasi
  getPemeliharaans: async (params?: any): Promise<RiwayatPemeliharaanAset[]> => {
    const res = await api.get('/aset-ruangan/pemeliharaan', { params });
    return res.data.data;
  },

  getKalibrasiAlerts: async (): Promise<RiwayatPemeliharaanAset[]> => {
    const res = await api.get('/aset-ruangan/pemeliharaan/alerts');
    return res.data.data;
  },

  createPemeliharaan: async (data: Partial<RiwayatPemeliharaanAset>): Promise<RiwayatPemeliharaanAset> => {
    const res = await api.post('/aset-ruangan/pemeliharaan', data);
    return res.data.data;
  },

  updatePemeliharaan: async (id: string, data: Partial<RiwayatPemeliharaanAset>): Promise<RiwayatPemeliharaanAset> => {
    const res = await api.put(`/aset-ruangan/pemeliharaan/${id}`, data);
    return res.data.data;
  },

  // 5. Mutasi Aset
  getMutasiHistory: async (asetId?: string): Promise<RiwayatMutasiAset[]> => {
    const res = await api.get('/aset-ruangan/mutasi', { params: { asetId } });
    return res.data.data;
  },

  mutasiAset: async (payload: { asetId: string; ruanganTujuanId: string; alasanMutasi?: string }): Promise<any> => {
    const res = await api.post('/aset-ruangan/mutasi', payload);
    return res.data.data;
  }
};
