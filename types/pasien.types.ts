import { RegistrationFormData } from '../app/(main)/administrasi/pendaftaran/schema';

export interface PasienResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    noRM: string;
    namaLengkap: string;
    kunjungan?: {
      noAntrian: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface Pasien {
  id: string | number;
  faskesId?: string | null;
  faskes?: {
    id: string;
    namaFaskes: string;
    kodeFaskes: string;
  } | null;
  noRM: string;
  noIHS: string | null;
  nik: string | null;
  noKk: string | null;
  namaLengkap: string;
  tempatLahir: string | null;
  tanggalLahir: string;
  jenisKelamin: string;
  golonganDarah: string | null;
  rhesus: string | null;
  agama: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  statusPerkawinan: string | null;
  kewarganegaraan: string | null;
  fotoWajah: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  
  // Relations
  alamat?: {
    alamatKtp: string;
    alamatDomisili: string;
    rtRw: string;
    desaKelurahan: string;
    kecamatan: string;
    kabupatenKota: string;
    provinsi: string;
    kodePos: string;
    titikGps: string;
  };
  kontak?: {
    noHp: string;
    email: string;
    kontakDarurat: string;
    hubunganKontakDarurat: string;
    noHpDarurat: string;
  };
  penjamin?: {
    jenisPenjamin: string;
    noBpjs: string;
    statusKepesertaan: string;
    faskesTingkat1: string;
    kelasRawat: string;
    namaAsuransi: string;
    nomorPolis: string;
    masaBerlakuAsuransi: string;
  };
  dataBayi?: any;
}

export type PasienPayload = RegistrationFormData;
