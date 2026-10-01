import { create } from 'zustand';
import { Pasien } from '../types/pasien.types';
import { pasienService } from '../services/pasien.service';
import { satusehatService } from '../services/satusehat.service';

interface PasienState {
  pasiens: Pasien[];
  isLoading: boolean;
  error: string | null;
  fetchPasiens: () => Promise<void>;
  deletePasien: (id: string | number) => Promise<void>;
  clearError: () => void;
  syncPasienIHS: (nik: string) => Promise<any>;
}

export const usePasienStore = create<PasienState>((set, get) => ({
  pasiens: [],
  isLoading: false,
  error: null,

  fetchPasiens: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await pasienService.getAllPasien();
      if (response.success) {
        set({ pasiens: response.data, isLoading: false });
      } else {
        set({ error: 'Gagal memuat data pasien', isLoading: false });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Terjadi kesalahan sistem', 
        isLoading: false 
      });
    }
  },

  deletePasien: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pasienService.deletePasien(id);
      if (response.success) {
        const currentPasiens = get().pasiens;
        set({ 
          pasiens: currentPasiens.filter((p: Pasien) => p.id !== id),
          isLoading: false 
        });
      } else {
        set({ error: 'Gagal menghapus data pasien', isLoading: false });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Terjadi kesalahan saat menghapus', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  syncPasienIHS: async (nik: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import dynamically or at top level. I will use the imported service.
      const response = await satusehatService.syncPatientIHS(nik);
      if (response.success) {
        // Refresh the list to get updated IHS number
        await get().fetchPasiens();
        return response;
      }
      return response;
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal sinkronisasi IHS', 
        isLoading: false 
      });
      throw error;
    }
  }
}));