import { create } from 'zustand';
import { AntrianDokter, RekamMedis, SOAPPayload, DiagnosaItem, DiagnosisPasien, TindakanPasien } from '../types/rawatJalan.types';
import { rawatJalanService } from '../services/rawatJalan.service';
import { Screening } from '../types/screening.types';
import { screeningService } from '../services/screening.service';
import { laboratoriumService } from '../services/laboratorium.service';
import { OrderLaboratoriumPayload } from '../types/laboratorium.types';

interface RawatJalanState {
  // Data
  antrian: AntrianDokter[];
  selectedKunjungan: AntrianDokter | null;
  rekamMedis: RekamMedis | null;
  screeningData: Screening | null;
  diagnosaList: DiagnosisPasien[];
  tindakanList: TindakanPasien[];
  alergiList: any[];

  // UI State
  fase: 1 | 2; // 1 = Pemeriksaan Klinis, 2 = Tindak Lanjut (Resep/Rujukan)
  isLoadingAntrian: boolean;
  isLoadingRekamMedis: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchAntrian: () => Promise<void>;
  pilihPasien: (kunjungan: AntrianDokter) => Promise<void>;
  simpanSOAP: (payload: SOAPPayload) => Promise<void>;
  simpanDiagnosa: (diagnosa: DiagnosaItem[]) => Promise<void>;
  simpanAlergi: (alergiArr: any[]) => Promise<void>;
  simpanTindakan: (tindakan: any[]) => Promise<void>;
  simpanOrderLab: (payload: OrderLaboratoriumPayload) => Promise<void>;
  selesaikanPemeriksaan: () => Promise<void>;
  tundaPemeriksaan: (payload: SOAPPayload) => Promise<void>;

  // Fase Tindak Lanjut
  setFase: (fase: 1 | 2) => void;
  simpanResep: (resep: any[]) => Promise<void>;
  simpanRujukan: (rujukan: any) => Promise<void>;
  assignRawatInap: (payload: { tempatTidurId: string; alasanRawatInap?: string; instruksiMedis?: string }) => Promise<void>;
  dischargeRawatInap: (kunjunganId: string, payload?: { caraKeluar?: string; kondisiDischarge?: string; edukasiPulang?: string; rencanaKontrol?: string }) => Promise<void>;
  pulang: () => Promise<void>;
  catatMeninggal: (catatan?: string) => Promise<void>;

  clearSelection: () => void;
  clearError: () => void;
}

export const useRawatJalanStore = create<RawatJalanState>((set, get) => ({
  antrian: [],
  selectedKunjungan: null,
  rekamMedis: null,
  screeningData: null,
  diagnosaList: [],
  tindakanList: [],
  alergiList: [],

  fase: 1,
  isLoadingAntrian: false,
  isLoadingRekamMedis: false,
  isSaving: false,
  error: null,

  /** Fetch antrian pasien yang menunggu dokter */
  fetchAntrian: async () => {
    set({ isLoadingAntrian: true, error: null });
    try {
      const res = await rawatJalanService.getAntrian();
      if (res.success) {
        set({ antrian: res.data, isLoadingAntrian: false });
      }
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal memuat antrian',
        isLoadingAntrian: false,
      });
    }
  },

  /** Pilih pasien → mulai pemeriksaan + load screening + load diagnosa */
  pilihPasien: async (kunjungan: AntrianDokter) => {
    set({ selectedKunjungan: kunjungan, isLoadingRekamMedis: true, error: null });
    try {
      // 1. Mulai pemeriksaan (buat/ambil RekamMedis)
      const rmRes = await rawatJalanService.mulaiPemeriksaan(kunjungan.id);
      if (rmRes.success) {
        set({ rekamMedis: rmRes.data });
      }

      // 2. Load screening perawat
      try {
        const scrRes = await screeningService.getScreeningByKunjungan(kunjungan.id);
        if (scrRes.success) {
          set({ screeningData: scrRes.data });
        }
      } catch {
        set({ screeningData: null });
      }

      // 3. Load diagnosa yang sudah ada
      try {
        const diagRes = await rawatJalanService.getDiagnosa(kunjungan.id);
        if (diagRes.success) {
          set({ diagnosaList: diagRes.data });
        }
      } catch (e) {
        console.error('Gagal load diagnosa:', e);
      }

      // 4. Load Tindakan
      try {
        const tindRes = await rawatJalanService.getTindakan(kunjungan.id);
        if (tindRes.success) {
          set({ tindakanList: tindRes.data });
        }
      } catch (e) {
        console.error('Gagal load tindakan:', e);
      }

      // 5. Load Alergi
      try {
        const alRes = await rawatJalanService.getAlergi(kunjungan.id);
        if (alRes.success) {
          set({ alergiList: alRes.data });
        }
      } catch (e) {
        console.error('Gagal load alergi:', e);
      }

      // 6. Refresh antrian agar status terupdate
      get().fetchAntrian();

      set({ isLoadingRekamMedis: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal memulai pemeriksaan',
        isLoadingRekamMedis: false,
      });
    }
  },

  /** Simpan SOAP ke database */
  simpanSOAP: async (payload: SOAPPayload) => {
    const rm = get().rekamMedis;
    if (!rm) return;

    set({ isSaving: true, error: null });
    try {
      const res = await rawatJalanService.simpanSOAP(rm.id, payload);
      if (res.success) {
        set({ rekamMedis: res.data, isSaving: false });
      }
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menyimpan SOAP',
        isSaving: false,
      });
      throw err;
    }
  },

  /** Simpan Alergi */
  simpanAlergi: async (alergiArr: any[]) => {
    const kunjungan = get().selectedKunjungan;
    if (!kunjungan) return;

    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.simpanAlergi(kunjungan.id, alergiArr);
      
      const alRes = await rawatJalanService.getAlergi(kunjungan.id);
      if (alRes.success) {
        set({ alergiList: alRes.data });
      }

      set({ isSaving: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menyimpan alergi',
        isSaving: false,
      });
      throw err;
    }
  },

  /** Simpan diagnosa ICD-10 (bulk replace) */
  simpanDiagnosa: async (diagnosa: DiagnosaItem[]) => {
    const kunjungan = get().selectedKunjungan;
    if (!kunjungan) return;

    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.simpanDiagnosa(kunjungan.id, diagnosa);

      // Reload diagnosa dari DB
      const diagRes = await rawatJalanService.getDiagnosa(kunjungan.id);
      if (diagRes.success) {
        set({ diagnosaList: diagRes.data });
      }
      set({ isSaving: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menyimpan diagnosa',
        isLoadingAntrian: false,
      });
    }
  },

  /** Simpan Tindakan (ICD-9) secara bulk */
  simpanTindakan: async (tindakan: any[]) => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;

    set({ isSaving: true, error: null });
    try {
      const res = await rawatJalanService.simpanTindakan(selectedKunjungan.id, tindakan);
      if (res.success) {
        // reload tindakan list
        const tindRes = await rawatJalanService.getTindakan(selectedKunjungan.id);
        set({ isSaving: false, tindakanList: tindRes.data || [] });
      }
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menyimpan tindakan',
        isSaving: false,
      });
    }
  },

  /** Simpan Order Laboratorium */
  simpanOrderLab: async (payload: OrderLaboratoriumPayload) => {
    set({ isSaving: true, error: null });
    try {
      await laboratoriumService.createOrder(payload);
      set({ isSaving: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || 'Gagal menyimpan order laboratorium',
        isSaving: false,
      });
      throw err;
    }
  },

  /** Selesaikan Pemeriksaan (Status -> SELESAI, tapi masuk Fase 2) */
  selesaikanPemeriksaan: async () => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;

    set({ isSaving: true, error: null });
    try {
      const res = await rawatJalanService.selesaikanPemeriksaan(selectedKunjungan.id);
      if (res.success) {
        set({ isSaving: false, fase: 2 });
      }
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menyelesaikan pemeriksaan',
        isSaving: false,
      });
      throw err;
    }
  },

  /** Tunda Pemeriksaan (Kedaruratan) */
  tundaPemeriksaan: async (payload: SOAPPayload) => {
    const { selectedKunjungan, rekamMedis } = get();
    if (!selectedKunjungan || !rekamMedis) return;

    set({ isSaving: true, error: null });
    try {
      // Simpan SOAP draft dulu
      await rawatJalanService.simpanSOAP(rekamMedis.id, payload);
      
      // Ubah status ke ditunda (MENUNGGU)
      await rawatJalanService.tundaPemeriksaan(selectedKunjungan.id);
      
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Gagal menunda pemeriksaan',
        isSaving: false,
      });
      throw err;
    }
  },

  setFase: (fase) => set({ fase }),

  simpanResep: async (resep: any[]) => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.simpanResep(selectedKunjungan.id, resep);
      set({ isSaving: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal menyimpan resep', isSaving: false });
      throw err;
    }
  },

  simpanRujukan: async (rujukan: any) => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.simpanRujukan(selectedKunjungan.id, rujukan);
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal menyimpan rujukan', isSaving: false });
      throw err;
    }
  },

  assignRawatInap: async (payload: { tempatTidurId: string; alasanRawatInap?: string; instruksiMedis?: string }) => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.assignRawatInap(selectedKunjungan.id, payload);
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal mengalihkan pasien ke rawat inap', isSaving: false });
      throw err;
    }
  },

  dischargeRawatInap: async (kunjunganId: string, payload = {}) => {
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.dischargeRawatInap(kunjunganId, payload);
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal memulangkan pasien rawat inap', isSaving: false });
      throw err;
    }
  },

  pulang: async () => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.pulang(selectedKunjungan.id);
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal mengakhiri kunjungan', isSaving: false });
      throw err;
    }
  },

  catatMeninggal: async (catatan?: string) => {
    const { selectedKunjungan } = get();
    if (!selectedKunjungan) return;
    set({ isSaving: true, error: null });
    try {
      await rawatJalanService.catatMeninggal(selectedKunjungan.id, catatan);
      set({ isSaving: false });
      get().clearSelection();
      get().fetchAntrian();
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Gagal mencatat status meninggal', isSaving: false });
      throw err;
    }
  },

  clearSelection: () =>
    set({ selectedKunjungan: null, rekamMedis: null, screeningData: null, diagnosaList: [], fase: 1 }),

  clearError: () => set({ error: null }),
}));
