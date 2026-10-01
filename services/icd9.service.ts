import api from './api';

export const icd9Service = {
  // Mencari master ICD-9 (mengembalikan seluruh master jika query kosong)
  async search(query: string = '') {
    const response = await api.get(`/icd9/search?q=${encodeURIComponent(query.trim())}`);
    return response.data;
  },

  // Mendapatkan semua master ICD-9 (opsional limit)
  async getAll() {
    const response = await api.get(`/icd9`);
    return response.data;
  },

  // Master Data CRUD
  async createICD9(data: any) {
    const response = await api.post('/icd9/master', data);
    return response.data;
  },

  async updateICD9(id: string, data: any) {
    const response = await api.put(`/icd9/master/${id}`, data);
    return response.data;
  },

  async deleteICD9(id: string) {
    const response = await api.delete(`/icd9/master/${id}`);
    return response.data;
  }
};
