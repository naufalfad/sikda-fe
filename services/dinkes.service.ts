import api from './api';

export interface DinkesSummary {
  totalFaskes: number;
  totalNakes: number;
  totalKunjunganBulanIni: number;
  totalBed: number;
  totalBedTerisi: number;
  borPersen: number;
  totalAsetKritisRusak: number;
  totalObatMenipis: number;
}

export interface FaskesWorkload {
  faskesId: string;
  namaFaskes: string;
  tipeFaskes: string;
  wilayahKecamatan: string;
  totalPasien: number;
  totalDokter: number;
  rasioPasienPerDokter: number;
  bebanKerjaStatus: 'KRITIS_TINGGI' | 'TINGGI' | 'NORMAL' | 'RENDAH';
  rekomendasi: string;
  mutasiDibutuhkan: boolean;
}

export interface FaskesBedStatus {
  faskesId: string;
  namaFaskes: string;
  tipeFaskes: string;
  totalKapasitas: number;
  tersedia: number;
  terisi: number;
  pemeliharaan: number;
  borPersen: number;
  statusKapasitas: 'PENUH' | 'WASPADA' | 'AMAN';
}

export interface CriticalAssetAlert {
  id: string;
  kodeAset: string;
  namaAset: string;
  merk: string;
  kategoriAset: string;
  kondisiAset: string;
  statusOperasional: string;
  ruangan: {
    namaRuangan: string;
  };
  faskes: {
    id: string;
    namaFaskes: string;
  };
}

export interface MedicineStockAlert {
  id: string;
  faskesId: string;
  namaFaskes: string;
  obatId: string;
  namaObat: string;
  satuan: string;
  stokFaskes: number;
  stokMinimum: number;
  statusStok: 'HABIS' | 'KRITIS' | 'AMAN';
}

export interface FaskesItem {
  id: string;
  kodeFaskes: string;
  namaFaskes: string;
  tipeFaskes: 'PUSKESMAS' | 'KLINIK_PRATAMA' | 'KLINIK_UTAMA' | 'RUMAH_SAKIT_DAERAH' | 'LABKESDA';
  statusOperasional: 'AKTIF' | 'NONAKTIF' | 'RENOVASI';
  alamat: string;
  wilayahKecamatan?: string;
  wilayahKelurahan?: string;
  telepon?: string;
  email?: string;
  kepalaFaskes?: string;
  kapasitasRawatInap: number;
  tersediaIGD: boolean;
  latitude?: number;
  longitude?: number;
}

export const dinkesService = {
  getExecutiveSummary: async (): Promise<DinkesSummary> => {
    const res = await api.get('/dinkes/summary');
    const raw = res.data?.data || {};
    return {
      totalFaskes: raw.totalFaskes ?? raw.ringkasanFaskes?.total ?? 0,
      totalNakes: raw.totalNakes ?? raw.tenagaMedis?.totalNakes ?? 0,
      totalKunjunganBulanIni: raw.totalKunjunganBulanIni ?? raw.trafikKunjungan?.bulanIni ?? 0,
      totalBed: raw.totalBed ?? raw.tempatTidur?.totalBed ?? 0,
      totalBedTerisi: raw.totalBedTerisi ?? raw.tempatTidur?.bedTerisi ?? 0,
      borPersen: raw.borPersen ?? parseFloat(String(raw.tempatTidur?.borKabupaten || '0').replace('%', '')) ?? 0,
      totalAsetKritisRusak: raw.totalAsetKritisRusak ?? raw.peringatanDini?.alkesKritisRusak ?? 0,
      totalObatMenipis: raw.totalObatMenipis ?? raw.peringatanDini?.obatMenipis ?? 0,
    };
  },

  getWorkloadAnalytics: async (): Promise<{ list: FaskesWorkload[]; agregatBeban: any }> => {
    const res = await api.get('/dinkes/workload');
    const raw = res.data?.data || {};
    const rawList = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.list) ? raw.list : (Array.isArray(raw) ? raw : []));
    const list: FaskesWorkload[] = rawList.map((item: any) => ({
      faskesId: item.faskesId,
      namaFaskes: item.namaFaskes,
      tipeFaskes: item.jenisFaskes || item.tipeFaskes || 'PUSKESMAS',
      wilayahKecamatan: item.kecamatan || item.wilayahKecamatan || '-',
      totalPasien: item.totalPasien ?? item.statistikKunjungan?.totalPasien ?? 0,
      totalDokter: item.totalDokter ?? item.sdmk?.totalDokter ?? 0,
      rasioPasienPerDokter: item.rasioPasienPerDokter ?? item.indikatorBebanKerja?.rasioPasienPerDokter ?? 0,
      bebanKerjaStatus: item.bebanKerjaStatus ?? item.indikatorBebanKerja?.statusBeban ?? 'NORMAL',
      rekomendasi: item.rekomendasi ?? item.indikatorBebanKerja?.rekomendasiDinkes ?? 'Pelayanan optimal.',
      mutasiDibutuhkan: item.mutasiDibutuhkan ?? (item.indikatorBebanKerja?.levelUrgensi === 'HIGH' || item.indikatorBebanKerja?.levelUrgensi === 'CRITICAL'),
    }));
    return { list, agregatBeban: raw };
  },

  getBedMonitoring: async (): Promise<FaskesBedStatus[]> => {
    const res = await api.get('/dinkes/beds');
    const raw = res.data?.data;
    const rawList = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    return rawList.map((item: any) => {
      const borNum = item.borAngka ?? parseFloat(String(item.bor || '0').replace('%', '')) ?? 0;
      return {
        faskesId: item.faskesId,
        namaFaskes: item.namaFaskes,
        tipeFaskes: item.tipeFaskes || 'PUSKESMAS',
        totalKapasitas: item.totalKapasitas ?? item.totalBed ?? 0,
        tersedia: item.tersedia ?? item.bedTersedia ?? 0,
        terisi: item.terisi ?? item.bedTerisi ?? 0,
        pemeliharaan: item.pemeliharaan ?? item.bedPerbaikan ?? 0,
        borPersen: Math.round(borNum),
        statusKapasitas: item.statusKapasitas === 'KRITIS_PENUH' ? 'PENUH' : (borNum >= 60 ? 'WASPADA' : 'AMAN'),
      };
    });
  },

  getCriticalAssets: async (): Promise<CriticalAssetAlert[]> => {
    const res = await api.get('/dinkes/assets');
    const raw = res.data?.data;
    if (Array.isArray(raw)) return raw;
    const faskesList = Array.isArray(raw?.data) ? raw.data : [];
    const list: CriticalAssetAlert[] = [];
    faskesList.forEach((faskes: any) => {
      if (Array.isArray(faskes.daftarAlkesRusakKritis) && faskes.daftarAlkesRusakKritis.length > 0) {
        faskes.daftarAlkesRusakKritis.forEach((a: any) => {
          list.push({
            id: a.id || a.kodeAset,
            kodeAset: a.kodeAset,
            namaAset: a.namaAset,
            merk: a.merk || '-',
            kategoriAset: a.kategoriAset || 'Alat Kesehatan',
            kondisiAset: a.kondisi || a.kondisiAset || 'RUSAK_BERAT',
            statusOperasional: a.statusOperasional || 'DALAM_PERBAIKAN',
            ruangan: {
              namaRuangan: a.ruangan || 'Ruangan Tindakan'
            },
            faskes: {
              id: faskes.faskesId,
              namaFaskes: faskes.namaFaskes
            }
          });
        });
      }
    });
    return list;
  },

  getMedicineAlerts: async (): Promise<MedicineStockAlert[]> => {
    const res = await api.get('/dinkes/medicines');
    const raw = res.data?.data;
    if (Array.isArray(raw)) return raw;
    const faskesList = Array.isArray(raw?.data) ? raw.data : [];
    const list: MedicineStockAlert[] = [];
    faskesList.forEach((faskes: any) => {
      if (Array.isArray(faskes.obatMenipis)) {
        faskes.obatMenipis.forEach((o: any, idx: number) => {
          list.push({
            id: `${faskes.faskesId}-${o.obatId || idx}`,
            faskesId: faskes.faskesId,
            namaFaskes: faskes.namaFaskes,
            obatId: o.obatId || o.kodeObat,
            namaObat: o.namaObat,
            satuan: o.satuan || 'Tablet/Botol',
            stokFaskes: o.sisaStok ?? o.stok ?? 0,
            stokMinimum: o.stokMinimum ?? 10,
            statusStok: (o.sisaStok ?? 0) === 0 ? 'HABIS' : 'KRITIS'
          });
        });
      }
    });
    return list;
  },

  getFaskesList: async (params?: { tipeFaskes?: string; status?: string }): Promise<FaskesItem[]> => {
    const res = await api.get('/dinkes/faskes', { params });
    const raw = res.data?.data;
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    return list.map((f: any) => ({
      id: f.id,
      kodeFaskes: f.kodeFaskes,
      namaFaskes: f.namaFaskes,
      tipeFaskes: f.jenisFaskes || f.tipeFaskes || 'PUSKESMAS',
      statusOperasional: f.statusAktif ? 'AKTIF' : 'NONAKTIF',
      alamat: f.alamat || '-',
      wilayahKecamatan: f.kecamatan || '-',
      wilayahKelurahan: f.desaKelurahan || '-',
      telepon: f.telepon || '-',
      email: f.email || '-',
      kepalaFaskes: f.kepalaFaskes || '-',
      kapasitasRawatInap: f.targetKunjunganHarian || 0,
      tersediaIGD: true,
      latitude: f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : undefined,
      longitude: f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : undefined,
    }));
  },

  createFaskes: async (data: Partial<FaskesItem>): Promise<FaskesItem> => {
    const res = await api.post('/dinkes/faskes', data);
    return res.data?.data;
  },

  updateFaskes: async (id: string, data: Partial<FaskesItem>): Promise<FaskesItem> => {
    const res = await api.put(`/dinkes/faskes/${id}`, data);
    return res.data?.data;
  },

  deleteFaskes: async (id: string): Promise<void> => {
    await api.delete(`/dinkes/faskes/${id}`);
  },

  getMutasiHistory: async (): Promise<any[]> => {
    const res = await api.get('/dinkes/mutasi-nakes');
    const raw = res.data?.data;
    return Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  },

  createMutasiNakes: async (data: {
    tenagaMedisId: string;
    faskesAsalId: string;
    faskesTujuanId: string;
    alasanMutasi: string;
    nomorSkDinkes?: string;
  }): Promise<any> => {
    const res = await api.post('/dinkes/mutasi-nakes', {
      tenagaMedisId: data.tenagaMedisId,
      faskesAsalId: data.faskesAsalId,
      faskesTujuanId: data.faskesTujuanId,
      alasan: data.alasanMutasi,
      nomorSk: data.nomorSkDinkes
    });
    return res.data?.data;
  },
};
