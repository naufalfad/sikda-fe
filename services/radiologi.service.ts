import api from './api';

export interface DetailOrderRadiologiInput {
  kodeLoinc: string;
  namaPemeriksaan: string;
  bodySiteCode?: string;
  bodySiteDisplay?: string;
}

export interface CreateOrderRadiologiPayload {
  kunjunganId: string;
  dokterId?: string;
  prioritas?: 'routine' | 'stat';
  catatan?: string;
  details: DetailOrderRadiologiInput[];
  isRujukanLuar?: boolean;
  faskesTujuan?: string;
}

export interface InputHasilRadiologiPayload {
  dokterRadiologiId?: string;
  bacaanNaratif: string;
  kesimpulan: string;
  wadoUrl?: string;
}

export interface InputHasilRujukanRadiologiPayload {
  catatanHasil?: string;
  kesimpulan?: string;
  bacaanNaratif?: string;
  dokumenHasilUrl?: string;
  dokterRadiologiNama?: string;
}

export const radiologiService = {
  // 1. POST /api/radiologi/order (Dokter Poli membuat order)
  createOrder: async (payload: CreateOrderRadiologiPayload) => {
    const res = await api.post('/radiologi/order', payload);
    return res.data;
  },

  // 2. GET /api/radiologi/order (Daftar Order Radiologi dengan Filter)
  getOrders: async (params?: { status?: string; kunjunganId?: string; search?: string }) => {
    const res = await api.get('/radiologi/order', { params });
    return res.data;
  },

  // 3. GET /api/radiologi/order/:id (Detail Order Radiologi)
  getOrderById: async (id: string) => {
    const res = await api.get(`/radiologi/order/${id}`);
    return res.data;
  },

  // 4. POST /api/radiologi/order/:id/hasil (Dokter/Petugas Radiologi input ekspertise)
  submitHasil: async (id: string, payload: InputHasilRadiologiPayload) => {
    const res = await api.post(`/radiologi/order/${id}/hasil`, payload);
    return res.data;
  },

  // 5. POST /api/radiologi/order/:id/hasil-rujukan (Input hasil fisik rontgen yang dibawa pasien dari RS luar)
  submitHasilRujukanLuar: async (id: string, payload: InputHasilRujukanRadiologiPayload) => {
    const res = await api.post(`/radiologi/order/${id}/hasil-rujukan`, payload);
    return res.data;
  },
};
