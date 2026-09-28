export interface MasterRuangan {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
  lantai?: string | null;
  gedung?: string | null;
  kategoriRuangan: string;
  deskripsi?: string | null;
  statusAktif: boolean;
  poliklinikId?: string | null;
  poliklinik?: { id: string; kodePoli: string; namaPoli: string } | null;
  penanggungJawabId?: string | null;
  penanggungJawab?: { id: string; username: string; namaLengkap: string; role: string } | null;
  ihsLocationId?: string | null;
  physicalType?: string;
  partOfLocationId?: string | null;
  _count?: {
    tempatTidurs: number;
    asets: number;
  };
  tempatTidurs?: TempatTidur[];
  asets?: AsetRuangan[];
}

export interface TempatTidur {
  id: string;
  ruanganId: string;
  nomorBed: string;
  kelasKamar: string;
  statusBed: 'TERSEDIA' | 'TERISI' | 'PERBAIKAN' | 'DIBERSIHKAN';
  kunjunganAktifId?: string | null;
  kunjunganAktif?: any;
  ihsLocationId?: string | null;
  operationalStatus?: string | null;
  ruangan?: { id: string; kodeRuangan: string; namaRuangan: string; gedung?: string | null; kategoriRuangan: string };
}

export interface BedStats {
  total: number;
  tersedia: number;
  terisi: number;
  perbaikan: number;
  dibersihkan: number;
  occupancyRate: number;
}

export interface AsetRuangan {
  id: string;
  kodeAset: string;
  namaAset: string;
  ruanganId: string;
  kategoriAset: string;
  merk?: string | null;
  tipeModel?: string | null;
  nomorSeri?: string | null;
  tahunPerolehan?: number | null;
  sumberAnggaran?: string | null;
  hargaPerolehan?: number | null;
  kondisiAset: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | 'AFKIR';
  statusOperasional: 'AKTIF_DIGUNAKAN' | 'DALAM_PERBAIKAN' | 'DALAM_KALIBRASI' | 'NON_AKTIF';
  ihsDeviceId?: string | null;
  kodeAspak?: string | null;
  kodeSnomed?: string | null;
  catatan?: string | null;
  ruangan?: { id: string; kodeRuangan: string; namaRuangan: string; gedung?: string | null };
  riwayatPemeliharaan?: RiwayatPemeliharaanAset[];
  riwayatMutasi?: RiwayatMutasiAset[];
  _count?: {
    riwayatPemeliharaan: number;
    riwayatMutasi: number;
  };
}

export interface AsetStats {
  total: number;
  alkesCount: number;
  nonMedisCount: number;
  kondisiBaik: number;
  kondisiRusakRingan: number;
  kondisiRusakBerat: number;
  kondisiAfkir: number;
  totalNilaiPerolehan: number;
}

export interface RiwayatPemeliharaanAset {
  id: string;
  asetId: string;
  jenisKegiatan: string;
  tanggalJadwal: string;
  tanggalPelaksanaan?: string | null;
  tanggalKalibrasiExpired?: string | null;
  pelaksanaVendor?: string | null;
  biayaPemeliharaan?: number | null;
  nomorSertifikatKalibrasi?: string | null;
  hasilKegiatan?: string | null;
  catatan?: string | null;
  status: 'TERJADWAL' | 'SELESAI' | 'TERLAMBAT';
  aset?: AsetRuangan;
  isExpired?: boolean;
  isUpcoming?: boolean;
  urgency?: 'KRITIS' | 'PERINGATAN' | 'NORMAL';
}

export interface RiwayatMutasiAset {
  id: string;
  asetId: string;
  ruanganAsalId: string;
  ruanganTujuanId: string;
  tanggalMutasi: string;
  alasanMutasi?: string | null;
  petugasAdminId?: string | null;
  aset?: { id: string; kodeAset: string; namaAset: string };
  ruanganAsal?: { id: string; kodeRuangan: string; namaRuangan: string };
  ruanganTujuan?: { id: string; kodeRuangan: string; namaRuangan: string };
  petugasAdmin?: { id: string; namaLengkap?: string | null; username: string };
}
