import api from './api';
import {
  AntrianDokter,
  RekamMedis,
  SOAPPayload,
  DiagnosaItem,
  DiagnosisPasien,
  TindakanItem,
  TindakanPasien,
  ApiResponse,
  MasterObat,
  ResepPayloadItem,
  RujukanPayload,
  FotoObjektifItem,
} from '../types/rawatJalan.types';

export const rawatJalanService = {
  /** POST /rawat-jalan/upload-foto-klinis — Upload foto klinis / luka (multipart atau kamera) */
  uploadFotoKlinis: async (payload: FormData | { base64Image: string; namaFile?: string; keterangan?: string }): Promise<ApiResponse<FotoObjektifItem[]>> => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.post('/rawat-jalan/upload-foto-klinis', payload, { headers });
    return response.data;
  },
  /** GET /rawat-jalan/antrian — Ambil antrian pasien untuk dokter */
  getAntrian: async (): Promise<ApiResponse<AntrianDokter[]>> => {
    const response = await api.get('/rawat-jalan/antrian');
    return response.data;
  },

  /** GET /rawat-jalan/riwayat — Ambil riwayat selesai untuk dokter */
  getRiwayat: async (): Promise<ApiResponse<AntrianDokter[]>> => {
    const response = await api.get('/rawat-jalan/riwayat');
    return response.data;
  },

  /** GET /rawat-jalan/riwayat/pasien/:noRM — Ambil detail timeline satu pasien */
  getRiwayatPasienByRM: async (noRM: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/rawat-jalan/riwayat/pasien/${noRM}`);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/mulai — Mulai pemeriksaan */
  mulaiPemeriksaan: async (kunjunganId: string): Promise<ApiResponse<RekamMedis>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/mulai`);
    return response.data;
  },

  /** PUT /rawat-jalan/:rekamMedisId/soap — Simpan SOAP */
  simpanSOAP: async (rekamMedisId: string, payload: SOAPPayload): Promise<ApiResponse<RekamMedis>> => {
    const response = await api.put(`/rawat-jalan/${rekamMedisId}/soap`, payload);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/diagnosa — Simpan diagnosa bulk */
  simpanDiagnosa: async (kunjunganId: string, diagnosa: DiagnosaItem[]): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/diagnosa`, { diagnosa });
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/rekam-medis — Get rekam medis */
  getRekamMedis: async (kunjunganId: string): Promise<ApiResponse<RekamMedis>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/rekam-medis`);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/tindakan — Simpan tindakan bulk */
  simpanTindakan: async (kunjunganId: string, tindakan: TindakanItem[]): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/tindakan`, { tindakan });
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/alergi — Simpan alergi bulk */
  simpanAlergi: async (kunjunganId: string, alergiArr: any[]): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/alergi`, { alergiArr });
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/tindakan — Get tindakan */
  getTindakan: async (kunjunganId: string): Promise<ApiResponse<TindakanPasien[]>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/tindakan`);
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/diagnosa — Get diagnosa */
  getDiagnosa: async (kunjunganId: string): Promise<ApiResponse<DiagnosisPasien[]>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/diagnosa`);
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/alergi — Get alergi */
  getAlergi: async (kunjunganId: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/alergi`);
    return response.data;
  },

  /** Selesaikan Pemeriksaan (Fase 1) */
  selesaikanPemeriksaan: async (kunjunganId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/selesai`);
    return response.data;
  },

  /** Tunda Pemeriksaan (Kedaruratan) */
  tundaPemeriksaan: async (kunjunganId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/tunda`);
    return response.data;
  },

  /** GET /farmasi/stok — Cari obat dari inventaris logistik faskes dokter yang bertugas */
  searchObat: async (search: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/farmasi/stok', { params: { search, hanyaObat: 'true' } });
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/resep — Simpan resep */
  simpanResep: async (kunjunganId: string, resep: ResepPayloadItem[]): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/resep`, { resep });
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/rujukan — Simpan rujukan */
  simpanRujukan: async (kunjunganId: string, payload: RujukanPayload): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/rujukan`, payload);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/rawat-inap — Assign pasien ke Bed Rawat Inap */
  assignRawatInap: async (kunjunganId: string, payload: { tempatTidurId: string; alasanRawatInap?: string; instruksiMedis?: string }): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/rawat-inap`, payload);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/pulang — Pasien pulang */
  pulang: async (kunjunganId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/pulang`);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/meninggal — Pasien meninggal dunia (UGD / Kedaruratan) */
  catatMeninggal: async (kunjunganId: string, catatan?: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/meninggal`, { catatan });
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/discharge-rawat-inap — Pulangkan pasien rawat inap & finalisasi kasir */
  dischargeRawatInap: async (
    kunjunganId: string, 
    payload: { 
      caraKeluar?: string; 
      kondisiDischarge?: string; 
      edukasiPulang?: string; 
      rencanaKontrol?: string; 
      faskesTujuan?: string; 
      alasanRujukan?: string; 
      poliTujuan?: string;
      resepPulang?: ResepPayloadItem[];
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/discharge-rawat-inap`, payload);
    return response.data;
  },

  /** POST /rawat-jalan/:kunjunganId/cppt — Simpan Catatan Perkembangan (CPPT) & sinkronkan ke Rekam Medis (RME) */
  simpanCPPT: async (
    kunjunganId: string,
    payload: {
      profesi?: string;
      tanggalCatatan?: string;
      subjektif?: string;
      objektif?: string;
      tandaVital?: any;
      asesmen?: string;
      plan?: string;
      instruksiMedis?: string;
      resep?: ResepPayloadItem[];
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/rawat-jalan/${kunjunganId}/cppt`, payload);
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/cppt — Ambil riwayat seluruh CPPT kunjungan rawat inap */
  getRiwayatCPPT: async (kunjunganId: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/cppt`);
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/rekam-medis-sebelumnya — Ambil rekam medis sebelumnya untuk preview & basis CPPT */
  getRekamMedisSebelumnya: async (kunjunganId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/rekam-medis-sebelumnya`);
    return response.data;
  },

  /** GET /rawat-jalan/:kunjunganId/resep — Ambil riwayat resep obat untuk kunjungan */
  getResepByKunjungan: async (kunjunganId: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/rawat-jalan/${kunjunganId}/resep`);
    return response.data;
  },
};


