import api from './api';

export interface LaporanKunjunganParams {
  periode?: 'harian' | 'bulanan' | 'tahunan' | 'custom';
  startDate?: string;
  endDate?: string;
  poliklinikId?: string;
  jenisPenjamin?: string;
  faskesId?: string;
}

export interface LaporanMorbiditasParams {
  startDate?: string;
  endDate?: string;
  poliklinikId?: string;
  limit?: number;
  faskesId?: string;
}

export interface LaporanBMHPParams {
  startDate?: string;
  endDate?: string;
  search?: string;
  statusStok?: string;
  filterMode?: 'semua' | 'bermutasi' | 'kritis';
  hanyaBermutasi?: boolean;
  faskesId?: string;
}

export interface LaporanAlkesParams {
  startDate?: string;
  endDate?: string;
  ruanganId?: string;
  kategoriAset?: string;
  kondisiAset?: string;
  filterMode?: 'digunakan' | 'semua';
  faskesId?: string;
}

export interface LaporanKinerjaNakesParams {
  startDate?: string;
  endDate?: string;
  poliklinikId?: string;
  profesi?: string;
  search?: string;
  filterMode?: 'aktif' | 'semua';
  faskesId?: string;
}

export const laporanService = {
  getLaporanKunjungan: async (params?: LaporanKunjunganParams) => {
    const res = await api.get('/laporan/kunjungan', { params });
    return res.data;
  },
  getLaporanMorbiditas: async (params?: LaporanMorbiditasParams) => {
    const res = await api.get('/laporan/morbiditas', { params });
    return res.data;
  },
  getLaporanBMHP: async (params?: LaporanBMHPParams) => {
    const res = await api.get('/laporan/bmhp', { params });
    return res.data;
  },
  getLaporanAlkes: async (params?: LaporanAlkesParams) => {
    const res = await api.get('/laporan/alkes', { params });
    return res.data;
  },
  getLaporanKinerjaNakes: async (params?: LaporanKinerjaNakesParams) => {
    const res = await api.get('/laporan/kinerja-nakes', { params });
    return res.data;
  }
};

