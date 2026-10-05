import api from './api';

export const masterService = {
  // Master Obat
  getObat: async (search?: string, faskesId?: string) => {
    const params: any = {};
    if (search) params.search = search;
    if (faskesId) params.faskesId = faskesId;
    const res = await api.get('/master/obat', { params });
    return res.data;
  },

  createObat: async (data: FormData) => {
    const res = await api.post('/master/obat', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  updateObat: async (id: string, data: FormData) => {
    const res = await api.put(`/master/obat/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  deleteObat: async (id: string) => {
    const res = await api.delete(`/master/obat/${id}`);
    return res.data;
  },

  // Master Laboratorium
  getLaboratorium: async (search?: string) => {
    const params = search ? { search } : {};
    const res = await api.get('/master/laboratorium', { params });
    return res.data;
  },

  createLaboratorium: async (data: any) => {
    const res = await api.post('/master/laboratorium', data);
    return res.data;
  },

  updateLaboratorium: async (id: string, data: any) => {
    const res = await api.put(`/master/laboratorium/${id}`, data);
    return res.data;
  },

  deleteLaboratorium: async (id: string) => {
    const res = await api.delete(`/master/laboratorium/${id}`);
    return res.data;
  },

  // Master Modality Radiologi
  getModality: async () => {
    const res = await api.get('/master/modality');
    return res.data;
  },

  createModality: async (data: any) => {
    const res = await api.post('/master/modality', data);
    return res.data;
  },

  updateModality: async (id: string, data: any) => {
    const res = await api.put(`/master/modality/${id}`, data);
    return res.data;
  },

  deleteModality: async (id: string) => {
    const res = await api.delete(`/master/modality/${id}`);
    return res.data;
  },

  // Master Vaksin
  getVaksin: async (faskesId?: string) => {
    const params: any = {};
    if (faskesId) params.faskesId = faskesId;
    const res = await api.get('/master/vaksin', { params });
    return res.data;
  },

  createVaksin: async (data: any) => {
    const res = await api.post('/master/vaksin', data);
    return res.data;
  },

  updateVaksin: async (id: string, data: any) => {
    const res = await api.put(`/master/vaksin/${id}`, data);
    return res.data;
  },

  deleteVaksin: async (id: string) => {
    const res = await api.delete(`/master/vaksin/${id}`);
    return res.data;
  },

  getAlergi: async () => {
    const res = await api.get('/master-alergi');
    return res.data;
  },

  getIcd10: async (search?: string) => {
    const params = search ? { q: search } : {};
    const res = await api.get('/icd10/search', { params });
    return res.data;
  }
};
