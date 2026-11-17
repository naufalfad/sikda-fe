import { create } from 'zustand';
import { laboratoriumService } from '@/services/laboratorium.service';

interface LaboratoriumState {
  antrian: any[];
  isLoadingAntrian: boolean;
  selectedOrder: any | null;
  error: string | null;
  
  fetchAntrian: (params?: { tipe?: string; status?: string; search?: string }) => Promise<void>;
  pilihOrder: (order: any) => void;
  clearSelection: () => void;
  simpanHasil: (orderId: string, details: any[]) => Promise<{ success: boolean; message?: string }>;
}

export const useLaboratoriumStore = create<LaboratoriumState>((set, get) => ({
  antrian: [],
  isLoadingAntrian: false,
  selectedOrder: null,
  error: null,

  fetchAntrian: async (params?: { tipe?: string; status?: string; search?: string }) => {
    set({ isLoadingAntrian: true, error: null });
    try {
      const res = await laboratoriumService.getAntrian(params);
      if (res.success) {
        set({ antrian: res.data });
      }
    } catch (error: any) {
      set({ error: error.message || 'Gagal mengambil antrian lab' });
    } finally {
      set({ isLoadingAntrian: false });
    }
  },

  pilihOrder: (order) => {
    set({ selectedOrder: order });
  },

  clearSelection: () => {
    set({ selectedOrder: null });
  },

  simpanHasil: async (orderId, details) => {
    try {
      const res = await laboratoriumService.simpanHasil(orderId, details);
      if (res.success) {
        // Refresh antrian dan bersihkan seleksi
        await get().fetchAntrian();
        set({ selectedOrder: null });
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menyimpan hasil lab' };
    }
  }
}));
