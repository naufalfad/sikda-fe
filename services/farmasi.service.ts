import api from './api';

export interface ResepDetail {
  id: string;
  resepId: string;
  obatId: string;
  jumlah: number;
  aturanPakai: string;
  catatan?: string;
  obat: {
    kodeObat: string;
    namaObat: string;
    sediaan: string;
    stok: number;
    kategori: string;
    gambarUrl?: string;
  };
}

export interface ResepData {
  id: string;
  kunjunganId: string;
  pasienId: string;
  dokterId: string;
  status: string;
  tanggalResep: string;
  pasien: {
    noRM: string;
    namaLengkap: string;
    tanggalLahir: string;
    jenisKelamin: string;
    noIHS?: string | null;
  };
  dokter: {
    namaLengkap: string;
    tenagaMedis?: {
      noIHS?: string | null;
    } | null;
  };
  kunjungan: {
    noAntrian?: string;
    jenisPelayanan?: string;
    encounterId?: string | null;
    poliklinik: {
      namaPoli: string;
    };
    tagihan?: {
      statusTagihan: string;
    };
  };
  details: ResepDetail[];
}

export interface StokFaskesItem {
  id: string;
  faskesId: string;
  namaFaskes?: string;
  obatId: string;
  kodeObat: string;
  namaObat: string;
  kategori: string;
  sediaan: string;
  harga: number;
  gambarUrl?: string;
  stok: number;
  stokMinimum: number;
  noBatch: string;
  tanggalExpired?: string;
  sisaHariExpired?: number | null;
  statusExpired: 'AMAN' | 'WASPADA' | 'SEGERA_KADALUWARSA' | 'KADALUWARSA';
  statusStok: 'AMAN' | 'KRITIS' | 'HABIS';
  prioritasFEFO: number;
}

export interface StokVaksinItem {
  id: string;
  faskesId: string;
  namaFaskes?: string;
  vaksinId: string;
  kodeKfa: string;
  namaVaksin: string;
  targetPenyakit: string;
  noBatch: string;
  tanggalExpired: string;
  sisaHariExpired?: number | null;
  statusExpired: 'AMAN' | 'WASPADA' | 'SEGERA_KADALUWARSA' | 'KADALUWARSA';
  stok: number;
  stokMinimum: number;
  suhuPenyimpanan: string;
  statusStok: 'AMAN' | 'KRITIS' | 'HABIS';
  prioritasFEFO: number;
}

export const farmasiService = {
  getAntrian: async (): Promise<ResepData[]> => {
    const response = await api.get('/farmasi/antrian');
    return response.data.data;
  },

  getResepById: async (id: string): Promise<ResepData> => {
    const response = await api.get(`/farmasi/resep/${id}`);
    return response.data.data;
  },

  prosesResep: async (id: string) => {
    const response = await api.post(`/farmasi/resep/${id}/proses`);
    return response.data;
  },

  getStokFaskes: async (): Promise<{ data: StokFaskesItem[]; ringkasan: any }> => {
    const response = await api.get('/farmasi/stok');
    return response.data;
  },

  tambahStokMasuk: async (payload: {
    obatId: string;
    jumlahMasuk: number;
    noBatch?: string;
    tanggalExpired?: string;
    stokMinimum?: number;
  }) => {
    const response = await api.post('/farmasi/stok/masuk', payload);
    return response.data;
  },

  getStokVaksin: async (): Promise<{ data: StokVaksinItem[]; ringkasan: any }> => {
    const response = await api.get('/farmasi/vaksin/stok');
    return response.data;
  },

  tambahStokVaksinMasuk: async (payload: {
    vaksinId: string;
    jumlahMasuk: number;
    noBatch: string;
    tanggalExpired: string;
    stokMinimum?: number;
    suhuPenyimpanan?: string;
  }) => {
    const response = await api.post('/farmasi/vaksin/masuk', payload);
    return response.data;
  },

  kurangiStokKeluar: async (payload: {
    obatId: string;
    jumlahKeluar: number;
    alasanKeluar: string;
    catatan?: string;
  }) => {
    const response = await api.post('/farmasi/stok/keluar', payload);
    return response.data;
  },

  kurangiStokVaksinKeluar: async (payload: {
    vaksinId: string;
    noBatch: string;
    jumlahKeluar: number;
    alasanKeluar: string;
    catatan?: string;
  }) => {
    const response = await api.post('/farmasi/vaksin/keluar', payload);
    return response.data;
  }
};
