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
  },

  /** GET /farmasi/mutasi — Ambil daftar log riwayat mutasi stok keluar-masuk (Obat, Vaksin, BMHP) */
  getRiwayatMutasi: async (params?: {
    kategori?: string;
    jenisMutasi?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    status: string;
    data: MutasiStokItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
    summaryToday?: any[];
  }> => {
    const response = await api.get('/farmasi/mutasi', { params });
    return response.data;
  },

  /** GET /farmasi/mutasi/kartu-stok/:itemId — Ambil kartu stok spesifik 1 item */
  getKartuStokItem: async (itemId: string, jenis: 'OBAT' | 'VAKSIN' = 'OBAT'): Promise<{
    status: string;
    data: MutasiStokItem[];
  }> => {
    const response = await api.get(`/farmasi/mutasi/kartu-stok/${itemId}`, { params: { jenis } });
    return response.data;
  }
};

export interface MutasiStokItem {
  id: string;
  faskesId: string;
  kategoriItem: 'OBAT' | 'BMHP' | 'VAKSIN';
  obatId?: string | null;
  vaksinId?: string | null;
  namaItem: string;
  sediaan?: string | null;
  noBatch: string;
  tanggalExpired?: string | null;
  jenisMutasi: 'MASUK' | 'KELUAR' | 'PENYESUAIAN' | 'OPNAME';
  jumlahPerubahan: number;
  stokAwal: number;
  stokAkhir: number;
  referensi?: string | null;
  keterangan?: string | null;
  petugasId?: string | null;
  petugasNama?: string | null;
  createdAt: string;
  updatedAt: string;
  faskes?: { namaFaskes: string; kodeFaskes: string };
  obat?: { kodeObat: string; kategori: string; sediaan: string };
  vaksin?: { kodeKfa: string; namaVaksin: string };
}

