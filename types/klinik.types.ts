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
}
