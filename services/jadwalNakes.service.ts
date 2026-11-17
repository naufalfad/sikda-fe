import api from './api';

export interface JadwalNakes {
  id: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    namaLengkap: string | null;
    role: string;
  };
  poliklinikId: string | null;
  poliklinik?: {
    id: string;
    kodePoli: string;
    namaPoli: string;
  } | null;
  faskesId: string | null;
  faskes?: {
    id: string;
    kodeFaskes: string;
    namaFaskes: string;
  } | null;
  hari: string; // 'SENIN' .. 'MINGGU'
  shift: string; // 'PAGI', 'SIANG', 'MALAM'
  jamMulai: string;
  jamSelesai: string;
  kuotaPasien: number;
  statusAktif: boolean;
  catatan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IzinCutiNakes {
  id: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    namaLengkap: string | null;
    role: string;
    poliklinik?: {
      id: string;
      namaPoli: string;
    } | null;
  };
  faskesId: string | null;
  faskes?: {
    id: string;
    namaFaskes: string;
  } | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  tipeIzin: string; // 'CUTI', 'IZIN', 'SAKIT', 'TUGAS_LUAR', 'PELATIHAN'
  keterangan?: string | null;
  penggantiId?: string | null;
  pengganti?: {
    id: string;
    username: string;
    namaLengkap: string | null;
    role: string;
  } | null;
  statusPersetujuan: string;
  catatanPersetujuan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DokterBertugasItem {
  id: string;
  username: string;
  namaLengkap: string | null;
  role: string;
  poliklinikId: string | null;
  faskesId: string | null;
  tenagaMedis?: {
    nik?: string;
    noIHS?: string | null;
    nomorSip?: string | null;
    spesialis?: string | null;
  } | null;
  isBertugasHariIni: boolean;
  isShiftAktifSaatIni?: boolean;
  shiftStatus?: 'AKTIF' | 'BELUM_DIMULAI' | 'SELESAI' | 'LIBUR' | 'CUTI';
  shiftKeterangan?: string;
  isPengganti: boolean;
  statusKehadiran: string; // 'BERTUGAS', 'LIBUR', 'CUTI', 'IZIN', 'SAKIT', 'PELATIHAN', 'PENGGANTI'
  statusKeterangan: string;
  jadwalDetail?: {
    id?: string;
    hari?: string;
    shift: string;
    jamMulai: string;
    jamSelesai: string;
    kuotaPasien: number;
  } | null;
  cutiDetail?: {
    tipeIzin: string;
    keterangan?: string | null;
    tanggalMulai: string;
    tanggalSelesai: string;
    pengganti?: {
      id: string;
      namaLengkap: string | null;
    } | null;
  } | null;
}

export interface DokterBertugasResponse {
  hari: string;
  tanggal: string;
  totalDokter: number;
  totalBertugas: number;
  dokters: DokterBertugasItem[];
}

export interface NakesOption {
  id: string;
  username: string;
  namaLengkap: string | null;
  role: string;
  poliklinikId: string | null;
  poliklinik?: {
    id: string;
    kodePoli: string;
    namaPoli: string;
  } | null;
  faskesId: string | null;
}

export interface PublicDoctorDirectoryItem {
  id: string;
  name: string;
  spesialis: string;
  poli: string;
  poliklinikId: string | null;
  faskes: string;
  faskesId: string | null;
  days: string[];
  daysText: string;
  hours: string;
  status: string;
  statusBadge: 'success' | 'warning' | 'neutral';
  isBertugasHariIni: boolean;
  avatar: string;
  schedules: Array<{
    id: string;
    hari: string;
    hariRaw: string;
    shift: string;
    jamMulai: string;
    jamSelesai: string;
    kuotaPasien: number;
  }>;
}

export const jadwalNakesService = {
  /**
   * Mengambil daftar dokter bertugas di poliklinik untuk tanggal tertentu
   */
  getDokterBertugasByPoli: async (
    poliId: string,
    tanggal?: string,
    hanyaBertugas: boolean = false,
    jam?: string
  ): Promise<DokterBertugasResponse> => {
    const params = new URLSearchParams();
    if (tanggal) params.append('tanggal', tanggal);
    if (hanyaBertugas) params.append('hanyaBertugas', 'true');
    if (jam) params.append('jam', jam);

    const res = await api.get(`/jadwal-nakes/dokter-bertugas/${poliId}?${params.toString()}`);
    return res.data?.data;
  },

  /**
   * Mengambil semua jadwal dinas (Admin Roster)
   */
  getJadwalList: async (filters: Record<string, any> = {}): Promise<JadwalNakes[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const res = await api.get(`/jadwal-nakes?${params.toString()}`);
    return res.data?.data;
  },

  /**
   * Mengambil jadwal per nakes (UserId)
   */
  getJadwalByUserId: async (userId: string): Promise<JadwalNakes[]> => {
    const res = await api.get(`/jadwal-nakes/user/${userId}`);
    return res.data?.data;
  },

  /**
   * Simpan / perbarui jadwal dinas satuan
   */
  upsertJadwal: async (data: Partial<JadwalNakes>): Promise<JadwalNakes> => {
    const res = await api.post('/jadwal-nakes', data);
    return res.data?.data;
  },

  /**
   * Simpan jadwal mingguan sekaligus (Bulk Matrix Roster)
   */
  saveBulkRoster: async (payload: {
    userId: string;
    poliklinikId?: string;
    faskesId?: string;
    roster: Array<{
      hari: string;
      shift: string;
      jamMulai: string;
      jamSelesai: string;
      kuotaPasien: number;
      statusAktif: boolean;
      catatan?: string;
    }>;
  }): Promise<JadwalNakes[]> => {
    const res = await api.post('/jadwal-nakes/bulk', payload);
    return res.data?.data;
  },

  /**
   * Hapus jadwal dinas
   */
  deleteJadwal: async (id: string): Promise<void> => {
    await api.delete(`/jadwal-nakes/${id}`);
  },

  /**
   * Mengambil daftar izin / cuti nakes
   */
  getIzinCutiList: async (filters: Record<string, any> = {}): Promise<IzinCutiNakes[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const res = await api.get(`/jadwal-nakes/izin-cuti?${params.toString()}`);
    return res.data?.data;
  },

  /**
   * Buat / ajukan izin atau cuti
   */
  createIzinCuti: async (data: Partial<IzinCutiNakes>): Promise<IzinCutiNakes> => {
    const res = await api.post('/jadwal-nakes/izin-cuti', data);
    return res.data?.data;
  },

  /**
   * Perbarui izin atau cuti
   */
  updateIzinCuti: async (id: string, data: Partial<IzinCutiNakes>): Promise<IzinCutiNakes> => {
    const res = await api.put(`/jadwal-nakes/izin-cuti/${id}`, data);
    return res.data?.data;
  },

  /**
   * Hapus izin atau cuti
   */
  deleteIzinCuti: async (id: string): Promise<void> => {
    await api.delete(`/jadwal-nakes/izin-cuti/${id}`);
  },

  /**
   * Ambil daftar nakes untuk opsi dropdown
   */
  getNakesOptions: async (filters: Record<string, any> = {}): Promise<NakesOption[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const res = await api.get(`/jadwal-nakes/options/nakes?${params.toString()}`);
    return res.data?.data;
  },

  /**
   * Mengambil direktori dokter & jadwal publik untuk Landing Page & Pasien Online (Public)
   */
  getPublicDoctorDirectory: async (filters: Record<string, any> = {}): Promise<PublicDoctorDirectoryItem[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/jadwal-nakes/public-directory?${params.toString()}`);
    const json = await res.json();
    return json.data || [];
  },
};
