import { create } from 'zustand';
import Swal from 'sweetalert2';
import { kasirService } from '../services/kasir.service';
import { KasirState, Tagihan } from '../types/kasir.types';

export const useKasirStore = create<KasirState>((set, get) => ({
  antrian: [],
  riwayat: [],
  selectedKunjungan: null,
  tagihanAktif: null,

  isLoadingAntrian: false,
  isLoadingTagihan: false,
  isProcessing: false,

  fetchAntrian: async () => {
    set({ isLoadingAntrian: true });
    try {
      const res = await kasirService.getAntrian();
      set({ antrian: res.data, isLoadingAntrian: false });
    } catch (error) {
      set({ isLoadingAntrian: false });
      console.error('Failed to fetch antrian kasir', error);
    }
  },

  fetchRiwayat: async () => {
    try {
      const res = await kasirService.getRiwayat();
      set({ riwayat: res.data });
    } catch (error) {
      console.error('Failed to fetch riwayat kasir', error);
    }
  },

  pilihPasien: async (kunjungan) => {
    set({ selectedKunjungan: kunjungan, isLoadingTagihan: true, tagihanAktif: null });
    try {
      const res = await kasirService.generateTagihan(kunjungan.id);
      set({ tagihanAktif: res.data, isLoadingTagihan: false });
    } catch (error: any) {
      set({ isLoadingTagihan: false });
      Swal.fire('Error', error.response?.data?.message || 'Gagal mengambil data tagihan', 'error');
    }
  },

  prosesPembayaran: async (tagihanId, metode, jumlahBayar) => {
    set({ isProcessing: true });
    try {
      const res = await kasirService.prosesPembayaran(tagihanId, metode, jumlahBayar);
      
      set({ isProcessing: false });
      
      // Update antrian & tagihan aktif
      get().fetchAntrian();
      const returnedTagihan = res?.data || res;
      const tagihanState = get().tagihanAktif;
      const selectedKunj = get().selectedKunjungan;

      const mergedTagihan: Tagihan = { 
        ...(tagihanState || {}),
        ...(returnedTagihan || {}),
        statusTagihan: 'LUNAS', 
        pembayaran: returnedTagihan?.pembayaran || { 
          jumlahBayar, 
          metodePembayaran: metode, 
          kembalian: (metode === 'BPJS' ? 0 : jumlahBayar - (tagihanState?.totalBiaya || 0)) 
        },
        kunjungan: returnedTagihan?.kunjungan || tagihanState?.kunjungan || selectedKunj
      };
      set({ tagihanAktif: mergedTagihan });

      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil Diproses!',
        text: 'Tagihan telah LUNAS. Struk kasir, hasil lab, hasil radiologi, dan surat rujukan keluar kini siap dicetak.',
        timer: 2000,
        showConfirmButton: false
      });
      return true;
    } catch (error: any) {
      set({ isProcessing: false });
      Swal.fire('Gagal', error.response?.data?.message || 'Gagal memproses pembayaran', 'error');
      return false;
    }
  },

  clearSelection: () => {
    set({ selectedKunjungan: null, tagihanAktif: null });
  }
}));
