export interface MasterTarifFee {
  id?: string;
  faskesId?: string;
  feeKehadiranDokter: number;
  feeKehadiranPerawat: number;
  feePerPasienDokter: number;
  feePerTindakanDokter: number;
  statusAktif?: boolean;
  keterangan?: string | null;
}

export interface PresensiNakesItem {
  id: string;
  faskesId: string;
  userId: string;
  profesi: 'DOKTER' | 'PERAWAT';
  tanggal: string;
  shift: string;
  jamMasuk: string;
  jamKeluar?: string | null;
  statusKehadiran: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
  statusVerifikasi: 'VERIFIED' | 'PENDING';
  catatan?: string | null;
  nominalFee: number;
  statusPembayaran: 'PENDING' | 'DIBAYAR';
  tanggalBayar?: string | null;
  user?: {
    id: string;
    namaLengkap: string;
    username: string;
    role: string;
    poliklinik?: { id: string; namaPoli: string } | null;
  };
  faskes?: { id: string; namaFaskes: string } | null;
}

export interface LogFeeDokterItem {
  id: string;
  dokterId: string;
  kunjunganId: string;
  tanggalPelayanan: string;
  jenisLayanan: string;
  namaPasien: string;
  noRM?: string | null;
  nominalFee: number;
  statusPembayaran: 'PENDING' | 'DIBAYAR';
  tanggalBayar?: string | null;
  catatan?: string | null;
  kunjungan?: {
    id: string;
    noAntrian: string;
    jenisPelayanan: string;
    statusKunjungan: string;
    poliklinik?: { namaPoli: string } | null;
  };
}

export interface RekapDokterItem {
  dokter: {
    id: string;
    namaLengkap: string;
    username: string;
    role: string;
    poliklinik?: { id: string; namaPoli: string } | null;
  };
  kehadiran: {
    totalHadir: number;
    totalFee: number;
    daftarPresensi: PresensiNakesItem[];
  };
  penangananPasien: {
    totalPasien: number;
    totalFee: number;
    daftarPasien: LogFeeDokterItem[];
  };
  rekap: {
    totalFeeKehadiran: number;
    totalFeePenanganan: number;
    totalFeeKumulatif: number;
    totalBelumDibayar: number;
    totalSudahDibayar: number;
  };
}

export interface RekapPerawatItem {
  perawat: {
    id: string;
    namaLengkap: string;
    username: string;
    role: string;
    poliklinik?: { id: string; namaPoli: string } | null;
  };
  kehadiran: {
    totalHadir: number;
    totalFee: number;
    daftarPresensi: PresensiNakesItem[];
  };
  rekap: {
    totalFeeKehadiran: number;
    totalFeeKumulatif: number;
    totalBelumDibayar: number;
    totalSudahDibayar: number;
  };
}

export interface DashboardSummaryResponse {
  periode: {
    bulan: number;
    tahun: number;
  };
  tarifAktif: MasterTarifFee;
  metrik: {
    totalFeeDokter: number;
    totalFeeDokterKehadiran: number;
    totalFeeDokterPenanganan: number;
    totalPasienDitangani: number;
    totalFeePerawat: number;
    totalShiftPerawatHadir: number;
    grandTotalRemunerasi: number;
  };
}

