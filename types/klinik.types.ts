export interface Poliklinik {
  id: string;
  faskesId?: string | null;
  faskes?: {
    id: string;
    kodeFaskes: string;
    namaFaskes: string;
    tipeFaskes?: string;
  } | null;
  kodePoli: string;
  namaPoli: string;
  deskripsi?: string | null;
  statusAktif: boolean;
  ihsLocationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LayananKlinik {
  id: string;
  poliklinikId: string;
  kodeLayanan: string;
  namaLayanan: string;
  deskripsi?: string | null;
  tarifDasar: number;
  statusAktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PoliklinikPayload = Omit<Poliklinik, 'id' | 'createdAt' | 'updatedAt'>;
export type LayananKlinikPayload = Omit<LayananKlinik, 'id' | 'createdAt' | 'updatedAt'>;

export interface DokterByPoli {
  id: string;
  username: string;
  namaLengkap?: string | null;
  nama_lengkap?: string | null;
  role?: string;
  isBertugasHariIni?: boolean;
  isShiftAktifSaatIni?: boolean;
  shiftStatus?: 'AKTIF' | 'BELUM_DIMULAI' | 'SELESAI' | 'LIBUR' | 'CUTI';
  shiftKeterangan?: string;
  isPengganti?: boolean;
  statusKehadiran?: string;
  statusKeterangan?: string;
  jadwalDetail?: {
    id?: string;
    hari?: string;
    shift?: string;
    jamMulai?: string;
    jamSelesai?: string;
    kuotaPasien?: number;
  } | null;
  cutiDetail?: {
    tipeIzin?: string;
    keterangan?: string | null;
    tanggalMulai?: string;
    tanggalSelesai?: string;
    pengganti?: {
      id: string;
      namaLengkap: string | null;
    } | null;
  } | null;
}
