import { create } from 'zustand';
import { rujukanService, RujukanData } from '../services/rujukan.service';

interface RujukanState {
  antrianList: any[];
  antrianPenunjangList: any[];
  rujukanDetail: RujukanData | null;
  isLoading: boolean;
  isLoadingPenunjang: boolean;
  isSendingSS: boolean;
  error: string | null;

  fetchAntrian: () => Promise<void>;
  fetchAntrianPenunjang: () => Promise<void>;
  fetchRujukanDetail: (kunjunganId: string) => Promise<void>;
  kirimServiceRequest: (kunjunganId: string) => Promise<boolean>;
}

export const useRujukanStore = create<RujukanState>((set, get) => ({
  antrianList: [],
  antrianPenunjangList: [],
  rujukanDetail: null,
  isLoading: false,
  isLoadingPenunjang: false,
  isSendingSS: false,
  error: null,

  fetchAntrian: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await rujukanService.getAntrian();
      set({ antrianList: data });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil antrean rujukan' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAntrianPenunjang: async () => {
    set({ isLoadingPenunjang: true, error: null });
    try {
      const data = await rujukanService.getAntrianPenunjang();
      set({ antrianPenunjangList: data });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil antrean rujukan penunjang' });
    } finally {
      set({ isLoadingPenunjang: false });
    }
  },

  fetchRujukanDetail: async (kunjunganId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await rujukanService.getRujukanDetail(kunjunganId);
      set({ rujukanDetail: data });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil detail rujukan' });
    } finally {
      set({ isLoading: false });
    }
  },

  kirimServiceRequest: async (kunjunganId) => {
    set({ isSendingSS: true, error: null });
    try {
      const result = await rujukanService.kirimServiceRequestSatuSehat(kunjunganId);
      if (result.status === 'success') {
        // Refresh data untuk mendapatkan satusehatId terbaru
        await get().fetchRujukanDetail(kunjunganId);
      }
      set({ isSendingSS: false });
      return result.status === 'success';
    } catch (err: any) {
      set({
        error: err.message || 'Gagal mengirim ServiceRequest ke SATUSEHAT',
        isSendingSS: false
      });
      return false;
    }
  }
}));
