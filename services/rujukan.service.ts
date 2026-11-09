import api from './api';

export interface RujukanData {
  id: string;
  pasienId: string;
  encounterId: string | null;
  statusKunjungan: string;
  tanggalRegistrasi: string;
  tagihan?: {
    statusPembayaran: string;
    isLunas?: boolean;
  } | null;
  pasien: {
    noRM: string;
    namaLengkap: string;
    tanggalLahir: string;
    jenisKelamin: string;
    noIHS?: string | null;
    alamat?: {
      alamatDomisili: string;
    } | null;
  };
  dokterTujuan: {
    namaLengkap: string;
    tenagaMedis?: {
      noIHS?: string | null;
    } | null;
  };
  rekamMedis: {
    id: string;
    keluhanUtama: string;
    pemeriksaanFisik: string;
    rencanaTerapi: string;
  } | null;
  rujukanKeluar: {
    id: string;
    faskesTujuan: string;
    poliTujuan: string;
    dokterTujuan?: string | null;
    alasanRujukan: string;
    tanggalRujukan?: string;
    satusehatId?: string | null;
  } | null;
  diagnosis: Array<{
    icd10: {
      kode_icd10: string;
      nama_diagnosis: string;
    };
  }>;
}

export const rujukanService = {
  /** GET /api/rujukan/antrian - Ambil daftar antrean rujukan keluar */
  getAntrian: async (): Promise<any[]> => {
    const response = await api.get('/rujukan/antrian');
    return response.data.data;
  },

  /** GET /api/rujukan/antrian-penunjang - Ambil daftar antrean rujukan penunjang (Lab & Radiologi) */
  getAntrianPenunjang: async (): Promise<any[]> => {
    const response = await api.get('/rujukan/antrian-penunjang');
    return response.data.data;
  },

  /** GET /api/rujukan/kunjungan/:kunjunganId - Ambil detail untuk preview surat */
  getRujukanDetail: async (kunjunganId: string): Promise<RujukanData> => {
    const response = await api.get(`/rujukan/kunjungan/${kunjunganId}`);
    return response.data.data;
  },

  /** POST /api/rujukan/kunjungan/:kunjunganId/kirim-satusehat - Kirim ServiceRequest ke SATUSEHAT */
  kirimServiceRequestSatuSehat: async (kunjunganId: string): Promise<any> => {
    const response = await api.post(`/rujukan/kunjungan/${kunjunganId}/kirim-satusehat`);
    return response.data;
  }
};
