import api from './api';

export interface AkunPasienOnline {
  id: string;
  nomorWa: string;
  role: string;
  keluarga?: PasienKeluarga[];
  bookings?: BookingAntrean[];
}

export interface PasienKeluarga {
  id: string;
  nik: string;
  namaLengkap: string;
  tanggalLahir: string;
  hubunganKeluarga: string;
  jenisKelamin?: string | null;
}

export interface BookingAntrean {
  id: string;
  kodeBooking: string;
  noAntrian: string;
  statusBooking: string;
  jenisPasien: string;
  noRM?: string | null;
  nik: string;
  namaLengkap: string;
  tanggalKunjungan: string;
  keluhan?: string | null;
  faskes?: {
    id: string;
    namaFaskes: string;
    kodeFaskes: string;
    alamat?: string | null;
  };
  poliklinik?: {
    id: string;
    namaPoli: string;
    kodePoli: string;
  };
  dokter?: {
    id: string;
    namaLengkap: string;
  } | null;
  createdAt: string;
}

export const portalPasienService = {
  // 1. Request OTP
  requestOtp: async (nomorWa: string) => {
    const res = await api.post('/portal-pasien/request-otp', { nomorWa });
    return res.data;
  },

  // 2. Verify OTP & Set PIN (Nomor Baru)
  verifyOtpAndSetPin: async (nomorWa: string, otpCode: string, pin: string) => {
    const res = await api.post('/portal-pasien/verify-otp', { nomorWa, otpCode, pin });
    return res.data;
  },

  // 3. Login PIN (Nomor Lama)
  loginWithPin: async (nomorWa: string, pin: string) => {
    const res = await api.post('/portal-pasien/login-pin', { nomorWa, pin });
    return res.data;
  },

  // 4. Lupa PIN - Request OTP
  forgotPinRequestOtp: async (nomorWa: string) => {
    const res = await api.post('/portal-pasien/forgot-pin', { nomorWa });
    return res.data;
  },

  // 5. Reset PIN
  resetPinWithOtp: async (nomorWa: string, otpCode: string, newPin: string) => {
    const res = await api.post('/portal-pasien/reset-pin', { nomorWa, otpCode, newPin });
    return res.data;
  },

  // 6. Get Profil Akun & Data Tersimpan
  getProfile: async (token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.get('/portal-pasien/me', config);
    return res.data;
  },

  // 7. Tambah NIK Keluarga
  addKeluarga: async (data: {
    nik: string;
    namaLengkap: string;
    tanggalLahir: string;
    hubunganKeluarga: string;
    jenisKelamin?: string;
  }, token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.post('/portal-pasien/keluarga', data, config);
    return res.data;
  },

  // 8. Cek Status Pasien di Faskes (Lama vs Baru)
  checkPasienFaskes: async (nik: string, faskesId: string) => {
    const res = await api.post('/portal-pasien/check-pasien', { nik, faskesId });
    return res.data;
  },

  // 9. Buat Booking Antrean
  createBooking: async (data: {
    faskesId: string;
    poliklinikId: string;
    dokterId?: string | null;
    nik: string;
    namaLengkap: string;
    tanggalLahir: string;
    tanggalKunjungan: string;
    keluhan?: string;
    hubunganKeluarga?: string;
    jenisKelamin?: string;
    // Demografi Lengkap Pasien Baru (Sesuai Loket)
    noKk?: string;
    tempatLahir?: string;
    golonganDarah?: string;
    rhesus?: string;
    agama?: string;
    pendidikan?: string;
    pekerjaan?: string;
    statusPerkawinan?: string;
    kewarganegaraan?: string;
    alamatKtp?: string;
    alamatDomisili?: string;
    rtRw?: string;
    desaKelurahan?: string;
    kecamatan?: string;
    kabupatenKota?: string;
    provinsi?: string;
    kodePos?: string;
    noHp?: string;
    kontakDarurat?: string;
    hubunganKontakDarurat?: string;
    noHpDarurat?: string;
    jenisPenjamin?: string;
    noBpjs?: string;
    persetujuanPengobatan?: boolean;
    persetujuanRekamMedis?: boolean;
    persetujuanSatusehat?: boolean;
  }, token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.post('/portal-pasien/booking', data, config);
    return res.data;
  },

  // 10. Ambil Master Data (Faskes, Poli, Dokter)
  getMasterData: async (faskesId?: string, poliklinikId?: string) => {
    const res = await api.get('/portal-pasien/master-data', {
      params: { faskesId, poliklinikId }
    });
    return res.data;
  },

  // 11. Ambil Antrean Booking Online untuk Petugas Loket Faskes
  getFaskesBookings: async (params?: { faskesId?: string; tanggal?: string; search?: string; status?: string }) => {
    const res = await api.get('/portal-pasien/faskes-bookings', { params });
    return res.data;
  },

  // 12. Check-in / Konfirmasi Kedatangan Booking Online di Loket
  checkInBooking: async (bookingIdentifier: string) => {
    const res = await api.post('/portal-pasien/check-in', {
      bookingId: bookingIdentifier,
      kodeBooking: bookingIdentifier
    });
    return res.data;
  }
};

