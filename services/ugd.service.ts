import api from './api';

export interface BedUGD {
  id: string;
  nomorBed: string;
  statusBed: 'TERSEDIA' | 'TERISI' | 'DIPESAN' | 'PERBAIKAN';
  kategori: string;
  ruanganId: string;
  ruangan: {
    id: string;
    namaRuangan: string;
    kodeRuangan: string;
    kategoriRuangan: string;
    lantai?: string;
  };
  kunjunganAktif?: {
    id: string;
    noAntrian: string;
    triase?: string;
    statusAdministrasi?: string;
    isAnonim?: boolean;
    namaAnonim?: string;
    pasien: {
      id: string;
      namaLengkap: string;
      noRekamMedis: string;
      nik?: string;
      jenisKelamin: string;
      tanggalLahir: string;
    };
    screening?: any[];
  } | null;
}

export interface KunjunganUGD {
  id: string;
  noAntrian: string;
  tanggalRegistrasi: string;
  jamRegistrasi: string;
  jenisPelayanan: string;
  statusKunjungan: string;
  statusAdministrasi: 'PENDING' | 'LENGKAP';
  triase: 'MERAH' | 'KUNING' | 'HIJAU' | 'HITAM';
  isAnonim: boolean;
  namaAnonim?: string;
  prioritas: string;
  caraDatang?: string;
  kondisiTiba?: string;
  keluhanUtama?: string;
  pasienId: string;
  pasien: {
    id: string;
    noRekamMedis: string;
    namaLengkap: string;
    nik?: string;
    jenisKelamin: string;
    tanggalLahir: string;
    tempatLahir?: string;
    pekerjaan?: string;
    statusPerkawinan?: string;
    alamat?: {
      alamatKtp?: string;
      desaKelurahan?: string;
      kecamatan?: string;
    };
    kontak?: {
      noHp?: string;
      kontakDarurat?: string;
      hubunganKontakDarurat?: string;
      noHpDarurat?: string;
    };
    penjamin?: {
      jenisPenjamin: string;
      noBpjs?: string;
    };
  };
  tempatTidurs?: Array<{
    id: string;
    nomorBed: string;
    ruangan: {
      namaRuangan: string;
      kategoriRuangan: string;
    };
  }>;
  screening?: {
    id: string;
    keluhanUtama?: string;
    kategoriTriage?: string;
    jenisKedatangan?: string;
    tekananDarahSistolik?: number;
    tekananDarahDiastolik?: number;
    nadi?: number;
    frekuensiNapas?: number;
    suhuTubuh?: number;
    saturasiOksigen?: number;
    skalaNyeri?: number;
    dataTambahan?: any;
    tandaVital?: any;
    petugas?: string;
    waktuPemeriksaan?: string;
    tanggalScreening?: string;
  } | Array<any> | null;
  rekamMedis?: {
    id: string;
    dokterId?: string;
    keluhanUtama?: string;
    riwayatPenyakitSekarang?: string;
    pemeriksaanFisik?: string;
    rencanaTerapi?: string;
    instruksiMedis?: string;
    statusPemeriksaan?: string;
  } | Array<any> | null;
  dokterTujuanId?: string;
  dokterTujuan?: {
    id: string;
    namaLengkap?: string;
    username?: string;
    role?: string;
  } | null;
  userPendaftarId?: string;
  userPendaftar?: {
    id: string;
    namaLengkap?: string;
    username?: string;
    role?: string;
  } | null;
}

export interface AdmitPasienUGDPayload {
  tempatTidurId: string;
  triase: 'MERAH' | 'KUNING' | 'HIJAU' | 'HITAM';
  keluhanUtama: string;
  caraDatang?: string;
  kondisiTiba?: string;
  isAnonim?: boolean;
  namaPasien?: string;
  existingPasienId?: string;
  jenisKelamin?: string;
  perkiraanUmur?: number;
  tanggalLahir?: string;
  nik?: string;
  dokterId?: string;
  tandaVital?: {
    sistole?: string | number;
    diastole?: string | number;
    nadi?: string | number;
    suhu?: string | number;
    pernapasan?: string | number;
    spo2?: string | number;
    kesadaran?: string;
    tingkatNyeri?: string | number;
  };
}

export interface LengkapiAdministrasiPayload {
  existingPasienId?: string;
  nik?: string;
  namaLengkap?: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  kewarganegaraan?: string;
  alamatKtp?: string;
  alamatDomisili?: string;
  noHp?: string;
  jenisPenjamin?: string;
  noBpjs?: string;
  kontakDarurat?: string;
  hubunganKontakDarurat?: string;
  noHpDarurat?: string;
}

export interface SimpanPemeriksaanUGDPayload {
  keluhanUtama?: string;
  riwayatPenyakit?: string;
  pemeriksaanFisik?: string;
  rencanaTerapi?: string;
  instruksiMedis?: string;
  diagnosaList?: Array<{
    icd10Id: string;
    isPrimary?: boolean;
    catatan?: string;
  }>;
  tindakanList?: Array<{
    icd9Id: string;
    catatan?: string;
  }>;
  resepList?: Array<{
    obatId: string;
    jumlah: number;
    dosis: string;
    aturanPakai: string;
  }>;
  keputusan: 'PULANG' | 'RAWAT_INAP' | 'DIRUJUK' | 'MENINGGAL';
  alasanKeputusan?: string;
  tempatTidurInapId?: string;
  catatanBangsal?: string;
  rujukanData?: {
    faskesTujuan?: string;
    poliTujuan?: string;
    alasanRujukan?: string;
  };
}

const ugdService = {
  // Mendapatkan daftar Bed UGD
  getBeds: async (): Promise<BedUGD[]> => {
    const res = await api.get('/ugd/beds');
    return res.data?.data || [];
  },

  // Mendapatkan antrean aktif pasien UGD
  getAntrean: async (): Promise<KunjunganUGD[]> => {
    const res = await api.get('/ugd/antrean');
    return res.data?.data || [];
  },

  // Mendapatkan pasien UGD yang pending kelengkapan administrasi
  getPendingAdministrasi: async (): Promise<KunjunganUGD[]> => {
    const res = await api.get('/ugd/pending-administrasi');
    return res.data?.data || [];
  },

  // Perawat / Nakes melakukan Quick Triage & Admit ke Bed UGD
  admitPasien: async (payload: AdmitPasienUGDPayload): Promise<any> => {
    const res = await api.post('/ugd/admit', payload);
    return res.data?.data;
  },

  // Loket Pendaftaran melengkapi identitas resmi pasien UGD
  lengkapiAdministrasi: async (kunjunganId: string, payload: LengkapiAdministrasiPayload): Promise<any> => {
    const res = await api.post(`/ugd/${kunjunganId}/lengkapi-administrasi`, payload);
    return res.data?.data;
  },

  // Perawat UGD mengupdate hasil triase dan observasi tanda vital berkala
  updateTriase: async (kunjunganId: string, payload: {
    triase?: string;
    keluhanUtama?: string;
    tandaVital?: {
      sistole?: string | number;
      diastole?: string | number;
      nadi?: string | number;
      suhu?: string | number;
      pernapasan?: string | number;
      spo2?: string | number;
      kesadaran?: string;
      tingkatNyeri?: string | number;
    };
    dokterId?: string;
  }): Promise<any> => {
    const res = await api.put(`/ugd/${kunjunganId}/triase`, payload);
    return res.data?.data;
  },

  // Dokter UGD menyimpan pemeriksaan SOAP & discharge / keputusan akhir
  simpanPemeriksaan: async (kunjunganId: string, payload: SimpanPemeriksaanUGDPayload): Promise<any> => {
    const res = await api.post(`/ugd/${kunjunganId}/pemeriksaan`, payload);
    return res.data?.data;
  }
};

export default ugdService;
