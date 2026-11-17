import { create } from 'zustand';
import { Poliklinik, LayananKlinik, PoliklinikPayload, LayananKlinikPayload, DokterByPoli } from '../types/klinik.types';
import { klinikService } from '../services/klinik.service';
import { satusehatService } from '../services/satusehat.service';
import { jadwalNakesService } from '../services/jadwalNakes.service';

interface KlinikState {
  polikliniks: Poliklinik[];
  layanans: Record<string, LayananKlinik[]>; // Key = poliklinikId
  dokters: Record<string, DokterByPoli[]>; // Key = poliklinikId
  isLoadingPoli: boolean;
  isLoadingLayanan: boolean;
  isLoadingDokter: boolean;
  error: string | null;

  fetchPoliklinik: () => Promise<void>;
  createPoliklinik: (data: PoliklinikPayload) => Promise<void>;
  
  fetchLayananByPoli: (poliId: string) => Promise<void>;
  createLayanan: (data: LayananKlinikPayload) => Promise<void>;

  fetchDokterByPoli: (poliId: string, tanggal?: string, jam?: string) => Promise<void>;
  syncLocationIHS: (poliId: string) => Promise<any>;
}

export const useKlinikStore = create<KlinikState>((set, get) => ({
  polikliniks: [],
  layanans: {},
  dokters: {},
  isLoadingPoli: false,
  isLoadingLayanan: false,
  isLoadingDokter: false,
  error: null,

  fetchPoliklinik: async () => {
    set({ isLoadingPoli: true, error: null });
    try {
      const data = await klinikService.getPoliklinik();
      set({ polikliniks: data });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil data poliklinik' });
    } finally {
      set({ isLoadingPoli: false });
    }
  },

  createPoliklinik: async (data) => {
    set({ isLoadingPoli: true, error: null });
    try {
      await klinikService.createPoliklinik(data);
      await get().fetchPoliklinik(); // refresh
    } catch (err: any) {
      set({ error: err.message || 'Gagal menyimpan poliklinik' });
      throw err;
    } finally {
      set({ isLoadingPoli: false });
    }
  },

  fetchLayananByPoli: async (poliId) => {
    set({ isLoadingLayanan: true, error: null });
    try {
      const data = await klinikService.getLayananByPoli(poliId);
      set((state) => ({
        layanans: {
          ...state.layanans,
          [poliId]: data,
        },
      }));
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil data layanan' });
    } finally {
      set({ isLoadingLayanan: false });
    }
  },

  createLayanan: async (data) => {
    set({ isLoadingLayanan: true, error: null });
    try {
      await klinikService.createLayanan(data);
      await get().fetchLayananByPoli(data.poliklinikId); // refresh for that poli
    } catch (error: any) {
      set({ error: (error as any).message });
    } finally {
      set({ isLoadingLayanan: false });
    }
  },

  fetchDokterByPoli: async (poliId, tanggal, jam) => {
    set({ isLoadingDokter: true, error: null });
    try {
      // Prioritaskan query dokter bertugas terintegrasi dengan jadwal dan cuti/izin
      const res = await jadwalNakesService.getDokterBertugasByPoli(poliId, tanggal, false, jam);
      if (res && res.dokters) {
        set((state) => ({
          dokters: {
            ...state.dokters,
            [poliId]: res.dokters,
          },
        }));
        return;
      }

      const dokters = await klinikService.getDokterByPoli(poliId);
      set((state) => ({
        dokters: {
          ...state.dokters,
          [poliId]: dokters,
        },
      }));
    } catch (error) {
      try {
        const dokters = await klinikService.getDokterByPoli(poliId);
        set((state) => ({
          dokters: {
            ...state.dokters,
            [poliId]: dokters,
          },
        }));
      } catch (err: any) {
        set({ error: err.message || (error as any).message });
      }
    } finally {
      set({ isLoadingDokter: false });
    }
  },

  syncLocationIHS: async (poliId: string) => {
    set({ isLoadingPoli: true, error: null });
    try {
      const response = await satusehatService.syncPoliklinikLocation(poliId);
      if (response.success) {
        await get().fetchPoliklinik();
        return response;
      }
      return response;
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal sinkronisasi Lokasi IHS', 
        isLoadingPoli: false 
      });
      throw error;
    }
  }
}));
