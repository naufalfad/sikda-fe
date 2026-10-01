import { z } from 'zod';

// Helper to preprocess optional numbers (handles "", NaN, undefined)
const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null || isNaN(val as any) ? undefined : Number(val)),
  z.number().optional()
);

// Helper to preprocess arrays (handles false, undefined, empty string by turning them into [])
const checkboxArray = z.preprocess(
  (val) => (Array.isArray(val) ? val : []),
  z.array(z.string()).optional()
);

export const screeningSchema = z.object({
  // STEP 1: UMUM
  nomorRegistrasi: z.string().min(1, 'Nomor Registrasi wajib diisi'),
  jenisKedatangan: z.enum(['IGD', 'Poli', 'Lainnya']),
  usia: optionalNumber.default(0),
  
  // Keluhan Utama Lengkap
  keluhanUtama: z.string().min(1, 'Keluhan utama wajib diisi'),
  lamaKeluhan: z.string().optional(),
  riwayatPenyakitSekarang: z.string().optional(),
  riwayatPenyakitDahulu: z.string().optional(),
  riwayatAlergi: z.string().optional(),
  alergiArr: z.array(z.any()).optional(),
  riwayatOperasi: z.string().optional(),
  riwayatRawatInap: z.string().optional(),
  riwayatTransfusi: z.string().optional(),
  riwayatPengobatan: z.string().optional(),

  // SKRINING KHUSUS POLI GIGI (SATUSEHAT & OHIS)
  golonganDarah: z.string().optional(),
  rhesus: z.string().optional(),
  statusKehamilan: z.string().optional(),
  debrisIndex: optionalNumber,
  kalkulusIndex: optionalNumber,
  skorOhis: optionalNumber,
  interpretasiOhis: z.string().optional(),
  riwayatAlergiAnestesi: z.string().optional(),
  riwayatPengencerDarah: z.string().optional(),

  // Tanda Vital Lengkap (Wajib)
  tinggiBadan: z.number().min(1, 'Tinggi badan wajib diisi'),
  beratBadan: z.number().min(1, 'Berat badan wajib diisi'),
  lingkarPerut: optionalNumber,
  imt: optionalNumber,
  tekananDarahSistolik: z.number().min(1, 'Sistolik wajib diisi'),
  tekananDarahDiastolik: z.number().min(1, 'Diastolik wajib diisi'),
  suhuTubuh: z.number().min(30, 'Suhu tubuh wajib diisi'),
  nadi: z.number().min(1, 'Nadi wajib diisi'),
  pernapasan: z.number().min(1, 'Pernapasan wajib diisi'),
  saturasiOksigen: optionalNumber,
  skalaNyeri: optionalNumber,
  luasPermukaanTubuh: optionalNumber,
  statusPsikologis: z.string().optional(),

  // STEP 2: TRIAGE (Conditional for IGD)
  kategoriTriage: z.enum(['Merah', 'Kuning', 'Hijau', 'Hitam', '']).optional(),
  jalanNapas: z.string().optional(),
  sirkulasi: z.string().optional(),
  kesadaran: z.string().optional(), // AVPU/GCS untuk Triage

  // Head to Toe Physical Exam Object (SATUSEHAT 28 Organs)
  headToToe: z.record(z.string(), z.any()).optional(),

  // STEP 3: PTM & FAKTOR RISIKO (Conditional for Usia >= 15)
  riwayatKeluarga: checkboxArray,
  
  // Gaya Hidup
  merokok: z.string().optional(),
  lamaMerokok: z.string().optional(),
  jumlahBatang: z.string().optional(),
  alkohol: z.string().optional(),
  narkoba: z.string().optional(),
  aktivitasFisik: z.string().optional(),
  polaMakan: z.string().optional(),
  text: z.string().optional(),
  konsumsiBuah: z.string().optional(),
  konsumsiSayur: z.string().optional(),
  konsumsiGaram: z.string().optional(),
  konsumsiGula: z.string().optional(),
  tidur: z.string().optional(),

  // Faktor Risiko Lain
  faktorRisikoLain: checkboxArray,

  // PTM Lanjutan (Jantung, Stroke, Kanker)
  ptmJantung: checkboxArray,
  ptmStroke: checkboxArray,
  ptmKanker: checkboxArray,

  gulaDarahSewaktu: optionalNumber,

  // STEP 4: TB & JIWA
  gejalaTB: checkboxArray,
  kontakTB: z.string().optional(),
  riwayatTB: checkboxArray,
  faktorRisikoTB: checkboxArray,
  hasilTB: z.string().optional(),
  
  // Jiwa
  jiwaEmosional: checkboxArray,
  jiwaSosial: checkboxArray,
  jiwaPsikologis: checkboxArray,
  jiwaBunuhDiri: checkboxArray,
  jiwaZat: checkboxArray,
  jiwaRiwayat: checkboxArray,

  // CATATAN OBSERVASI (STEP 3 & 4)
  catatanPenyakitKeluarga: z.string().optional(),
  catatanGayaHidup: z.string().optional(),
  catatanRisikoLain: z.string().optional(),
  catatanPtmKhusus: z.string().optional(),
  catatanPengukuran: z.string().optional(),
  catatanSkriningTB: z.string().optional(),
  catatanKesehatanJiwa: z.string().optional(),

  // STEP 5: HASIL
  statusKesehatan: z.string().optional(),
  prioritasPelayanan: z.string().optional(),
  tindakLanjut: checkboxArray,
  catatanPetugas: z.string().optional(),
});

export type ScreeningFormData = z.infer<typeof screeningSchema>;
