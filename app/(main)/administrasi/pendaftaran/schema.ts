import { z } from 'zod';

export const registrationSchema = z.object({
  // Identitas & Alamat
  noRekamMedis: z.string().min(1, 'Nomor Rekam Medis wajib diisi'),
  noIHS: z.string().optional().or(z.literal('')),
  nik: z.string().optional().or(z.literal('')),
  noKk: z.string().optional().or(z.literal('')),
  namaLengkap: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  tempatLahir: z.string().min(2, 'Tempat Lahir wajib diisi'),
  tanggalLahir: z.string().min(1, 'Tanggal Lahir wajib diisi'),
  jenisKelamin: z.enum(['Laki-laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
  golonganDarah: z.enum(['A', 'B', 'AB', 'O']).optional().or(z.literal('')),
  rhesus: z.enum(['+', '-']).optional().or(z.literal('')),
  agama: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'], { message: 'Pilih agama' }),
  pendidikan: z.enum(['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']).optional().or(z.literal('')),
  pekerjaan: z.string().min(1, 'Pekerjaan wajib diisi'),
  statusPerkawinan: z.enum(['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'], { message: 'Pilih status perkawinan' }),
  kewarganegaraan: z.enum(['WNI', 'WNA'], { message: 'Pilih kewarganegaraan' }),
  alamatKtp: z.string().min(5, 'Alamat KTP wajib diisi'),
  alamatDomisili: z.string().min(5, 'Alamat domisili wajib diisi'),
  rtRw: z.string().min(3, 'RT/RW wajib diisi'),
  desaKelurahan: z.string().min(2, 'Desa/Kelurahan wajib diisi'),
  kecamatan: z.string().min(2, 'Kecamatan wajib diisi'),
  kabupatenKota: z.string().min(2, 'Kabupaten/Kota wajib diisi'),
  provinsi: z.string().min(2, 'Provinsi wajib diisi'),
  kodePos: z.string().min(4, 'Kode pos wajib diisi'),
  titikGps: z.string().optional().or(z.literal('')),
  
  // Data Sosial
  statusDisabilitas: z.string().optional().or(z.literal('')),
  programSosial: z.string().optional().or(z.literal('')),
  
  // Data Khusus Bayi (Kondisional)
  isBayi: z.boolean().optional(),
  namaIbu: z.string().optional().or(z.literal('')),
  nikIbu: z.string().optional().or(z.literal('')),
  namaAyah: z.string().optional().or(z.literal('')),
  beratLahir: z.string().optional().or(z.literal('')),
  panjangLahir: z.string().optional().or(z.literal('')),
  jamLahir: z.string().optional().or(z.literal('')),
  jenisPersalinan: z.string().optional().or(z.literal('')),
  urutanKelahiran: z.number().optional(),
  
  // Kontak & Penjamin
  noHp: z.string().min(10, 'Nomor HP minimal 10 digit').regex(/^\d+$/, 'Nomor HP hanya boleh berisi angka'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  kontakDarurat: z.string().min(3, 'Nama kontak darurat wajib diisi'),
  hubunganKontakDarurat: z.string().min(2, 'Hubungan kontak darurat wajib diisi'),
  noHpDarurat: z.string().min(10, 'Nomor HP minimal 10 digit').regex(/^\d+$/, 'Nomor HP hanya boleh berisi angka'),
  jenisPenjamin: z.string().min(1, 'Pilih jenis penjamin'),
  
  // Data BPJS (Kondisional)
  noBpjs: z.string().optional().or(z.literal('')),
  statusKepesertaan: z.string().optional().or(z.literal('')),
  faskesTingkat1: z.string().optional().or(z.literal('')),
  kelasRawat: z.string().optional().or(z.literal('')),
  noSep: z.string().optional().or(z.literal('')),

  // Data Asuransi (Kondisional)
  namaAsuransi: z.string().optional().or(z.literal('')),
  nomorPolis: z.string().optional().or(z.literal('')),
  masaBerlakuAsuransi: z.string().optional().or(z.literal('')),

  // Administrasi & Medis
  poliTujuan: z.string().min(1, 'Poli tujuan wajib dipilih'),
  layananTujuan: z.string().optional().or(z.literal('')),
  dokterTujuan: z.string().min(1, 'Dokter tujuan wajib dipilih'),
  jenisPelayanan: z.string().min(1, 'Pilih jenis pelayanan'),
  statusPasien: z.enum(['Baru', 'Lama'], { message: 'Pilih status pasien' }),
  noAntrian: z.string().optional().or(z.literal('')),
  tanggalRegistrasi: z.string().min(1, 'Tanggal registrasi wajib diisi'),
  jamRegistrasi: z.string().min(1, 'Jam registrasi wajib diisi'),
  caraDatang: z.string().min(1, 'Pilih cara datang'),
  prioritas: z.string().min(1, 'Pilih prioritas pasien'),
  
  // Data Rujukan (Kondisional)
  asalRujukan: z.string().optional().or(z.literal('')),
  noRujukan: z.string().optional().or(z.literal('')),
  tanggalRujukan: z.string().optional().or(z.literal('')),
  fasilitasPerujuk: z.string().optional().or(z.literal('')),
  diagnosaAwal: z.string().optional().or(z.literal('')),
  jenisRujukan: z.string().optional().or(z.literal('')),
  
  // Persetujuan (Consent) - Cukup dilakukan sekali saja
  persetujuanPengobatan: z.boolean().optional(),
  persetujuanRekamMedis: z.boolean().optional(),
  persetujuanSatusehat: z.boolean().optional(),
  persetujuanReminder: z.boolean().optional(), // Opsional untuk notif
  metodePersetujuan: z.enum(['Tanda Tangan', 'Cap Jari']).optional(),
  tandaTangan: z.string().optional().or(z.literal('')),
  capJari: z.string().optional().or(z.literal('')),
  fotoWajah: z.string().optional().or(z.literal('')),
  
  // Metadata Sistem
  userPendaftar: z.string().optional().or(z.literal('')),
  loketPendaftaran: z.string().optional().or(z.literal('')),
  device: z.string().optional().or(z.literal('')),
  ipAddress: z.string().optional().or(z.literal('')),
  timestamp: z.string().optional().or(z.literal('')),
  auditTrail: z.string().optional().or(z.literal('')),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
