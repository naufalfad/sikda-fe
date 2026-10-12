import api from './api';

export interface VaksinItem {
  id: string;
  kodeKfa: string;
  namaVaksin: string;
  targetPenyakit?: string;
  statusAktif: boolean;
  batchVaksin?: BatchVaksinItem[];
}

export interface BatchVaksinItem {
  id: string;
  vaksinId: string;
  faskesId?: string;
  noBatch: string;
  tanggalExpired: string;
  stok: number;
  stokMinimum: number;
  suhuPenyimpanan?: string;
  statusAktif: boolean;
}

export interface CatatImunisasiPayload {
  pasienId: string;
  kunjunganId: string;
  batchVaksinId: string;
  isRiwayatLuar?: boolean;
  dosisKe: number;
  dosisJumlah?: number;
  lokasiSuntik: string;
  ruteSuntik: string;
  catatan?: string;
  tanggalSuntik?: string;
}

export const imunisasiService = {
  getMasterVaksin: async (faskesId?: string) => {
    const params = faskesId ? { faskesId } : {};
    const res = await api.get('/imunisasi/vaksin', { params });
    return res.data;
  },

  getBatchByVaksin: async (vaksinId: string, faskesId?: string) => {
    const params = faskesId ? { faskesId } : {};
    const res = await api.get(`/imunisasi/vaksin/${vaksinId}/batch`, { params });
    return res.data;
  },

  catatRiwayat: async (data: CatatImunisasiPayload) => {
    const res = await api.post('/imunisasi/riwayat', data);
    return res.data;
  },

  getRiwayatPasien: async (pasienId: string) => {
    const res = await api.get(`/imunisasi/riwayat/pasien/${pasienId}`);
    return res.data;
  },
};
