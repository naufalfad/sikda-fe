import { Screening } from './screening.types';
import { OrderLaboratorium } from './laboratorium.types';

// ─────────────────────────────────────────────────────────
// Tipe data untuk modul Dokter Rawat Jalan
// ─────────────────────────────────────────────────────────

/** Pasien dalam antrian dokter (kunjungan + pasien + screening) */
export interface AntrianDokter {
  id: string;
  pasienId: string;
  pasien: {
    id: string;
    noRM: string;
    namaLengkap: string;
    tanggalLahir: string;
    jenisKelamin: string;
    golonganDarah?: string | null;
  };
  poliklinik: {
    id: string;
    namaPoli: string;
    faskesId?: string;
  };
  dokterTujuan?: {
    id: string;
    namaLengkap: string;
  } | null;
  screening?: Screening | null;
  rekamMedis?: RekamMedis | null;
  orderLab?: OrderLaboratorium | null;
  diagnosis?: DiagnosisPasien[];
  resep?: any[];

  tanggalRegistrasi: string;
  jamRegistrasi: string;
  noAntrian: string;
  jenisPelayanan: string;
  statusPasien: string;
  prioritas: string;
  statusKunjungan: string;
  noSep?: string | null;
}

/** Rekam Medis Elektronik (SOAP) */
export interface RekamMedis {
  id: string;
  kunjunganId: string;
  pasienId: string;
  dokterId: string;

  // S - Subjektif
  keluhanUtama?: string | null;
  riwayatPenyakitSekarang?: string | null;
  riwayatPenyakitDahulu?: string | null;
  riwayatAlergi?: string | null;

  // O - Objektif
  keadaanUmum?: string | null;
  kesadaran?: string | null;
  pemeriksaanFisik?: string | null;
  hasilPenunjang?: string | null;
  odontogram?: any;
  dmft?: any;
  oralFindings?: any;

  // A - Asesmen
  diagnosisKlinis?: string | null;

  // P - Plan
  rencanaTerapi?: string | null;
  instruksiMedis?: string | null;

  statusPemeriksaan: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload untuk simpan SOAP */
export interface SOAPPayload {
  keluhanUtama?: string;
  riwayatPenyakitSekarang?: string;
  riwayatPenyakitDahulu?: string;
  riwayatAlergi?: string;
  alergiArr?: AlergiItem[];
  keadaanUmum?: string;
  kesadaran?: string;
  pemeriksaanFisik?: string;
  hasilPenunjang?: string;
  diagnosisKlinis?: string;
  diagnosisArr?: DiagnosaItem[];
  prognosisKode?: string;
  prognosisDisplay?: string;
  rencanaTerapi?: string;
  instruksiMedis?: string;
  tujuanPerawatan?: string;
  
  // Poli Gigi Fields (Odontogram & DMF-T)
  odontogram?: Record<number, any>;
  dmft?: { d: number; m: number; f: number; total: number };
  oralFindings?: {
    occlusi?: string;
    torusPalatinus?: string;
    torusMandibularis?: string;
    palatum?: string;
    diastema?: string;
    gigiAnomali?: string;
    kondisiLain?: string;
  };
}

/** Alergi yang dipilih dokter */
export interface AlergiItem {
  alergiId: string;
  nama_alergi: string;
  manifestasiKode: string;
  manifestasiNama: string;
  tingkatKeparahan: string;
}

/** Diagnosa ICD-10 yang dipilih dokter */
export interface DiagnosaItem {
  icd10Id: string;
  kode_icd10: string;
  nama_diagnosis: string;
  jenisDiagnosis: string; // Utama, Sekunder, Komorbid, Komplikasi
  diagnosisKlinis?: string;
  statusKlinis?: string;
  statusVerifikasi?: string;
}

/** Diagnosa dari DB (include ICD-10 detail) */
export interface DiagnosisPasien {
  id: string;
  pasienId: string;
  kunjunganId: string;
  icd10Id: string;
  icd10: {
    id_icd10: string;
    kode_icd10: string;
    nama_diagnosis: string;
    kategori?: string;
    bab?: string;
  };
  dokterId?: string;
  jenisDiagnosis: string;
  diagnosisKlinis?: string | null;
  statusDiagnosis: string;
  createdAt: string;
}

/** Response standar API */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Tindakan ICD-9 yang dipilih dokter */
export interface TindakanItem {
  icd9Id: string;
  kode_icd9: string;
  nama_prosedur: string;
  pelaksana: string; // Dokter, Perawat, dll
  catatan?: string;
}

/** Tindakan dari DB */
export interface TindakanPasien {
  id: string;
  pasienId: string;
  kunjunganId: string;
  icd9Id: string;
  icd9: {
    id_icd9: string;
    kode: string;
    deskripsi: string;
  };
  pelaksanaId?: string;
  pelaksanaTeks: string;
  catatanTindakan?: string;
  waktuTindakan: string;
}

export interface MasterObat {
  id: string;
  kodeObat: string;
  namaObat: string;
  kategori: string;
  sediaan: string;
  harga: number;
  stok: number;
  gambarUrl?: string;
}

export interface ResepPayloadItem {
  obatId: string;
  qty: number;
  signa: string;
  catatan?: string;
  noBatch?: string;
}

export interface RujukanPayload {
  faskesTujuan: string;
  poliTujuan: string;
  alasanRujukan: string;
}
