import Swal from 'sweetalert2';

export const fillDokterDummyDataHelper = (
  setSoapData: React.Dispatch<React.SetStateAction<any>>,
  isUgd: boolean = false
) => {
  if (isUgd) {
    const ugdPs: PrimarySurveyUGDValues = {
      airway: 'Paten, bebas sumbatan, fraktur servikal (-)',
      breathing: 'Spontan reguler, RR 22x/m, pergerakan dada simetris, retraksi (-), vesikuler (+/+), ronki (-/-), wheezing (-/-)',
      circulation: 'Nadi kuat teratur 92x/m, tensi 125/80 mmHg, CRT < 2 detik, akral hangat, perdarahan aktif terkontrol balut tekan',
      disability: 'GCS 15 (E4V5M6) Compos Mentis, pupil isokor 3mm/3mm, refleks cahaya (+/+), defisit neurologis fokal (-)',
      exposure: 'Vulnus laceratum 4cm di regio frontalis (sudah hecting situasi), jejas thoraks/abdomen (-), vulnus ekskoriasi genu dextra',
    };
    const ugdSecondary = 'Status Lokalis: Regio Frontalis sinistra tampak vulnus laceratum ukuran 4x0.5 cm, telah dilakukan debridement, anestesi lidokain 2%, dan penjahitan luka 4 simpul. Ekstremitas inferior dextra terdapat vulnus ekskoriasi tertutup kassa steril.';

    setSoapData({
      keluhanUtama: 'Luka robek berdarah di dahi akibat terbentur stang motor saat kecelakaan lalu lintas 1 jam SMRS.',
      riwayatPenyakitSekarang: 'Pasien datang diantar keluarga setelah kecelakaan tunggal roda dua 1 jam SMRS. Mengenakan helm, pingsan disangkal, mual/muntah disangkal, nyeri kepala ringan.',
      riwayatPenyakitDahulu: 'Tidak ada riwayat hipertensi, diabetes melitus, asma, atau kelainan pembekuan darah.',
      riwayatAlergi: 'Tidak ada riwayat alergi obat antibiotik maupun anestesi lokal.',
      keadaanUmum: 'Tampak Sakit Sedang',
      kesadaran: 'Compos Mentis (Sadar Penuh)',
      primarySurvey: ugdPs,
      secondarySurvey: ugdSecondary,
      pemeriksaanFisik: buildUgdPemeriksaanFisik(ugdPs, ugdSecondary),
      hasilPenunjang: 'GDS Stik Cito: 108 mg/dL. EKG: Sinus Rhythm 88 bpm. Foto Rontgen Cervical: Normal.',
      diagnosisKlinis: 'Vulnus Laceratum Regio Frontalis + Vulnus Ekskoriasi Genu Dextra ec KLL Tunggal',
      rencanaTerapi: '1. Debridement & Hecting vulnus laceratum (4 simpul silk 3-0)\n2. Injeksi ATS / Vaksin TT 0.5 mL IM profilaksis\n3. Cefadroxil 500mg 2x1 tab (5 hari)\n4. Asam Mefenamat 500mg 3x1 tab prn nyeri\n5. Rawat luka berkala & kontrol 3 hari lagi',
      instruksiMedis: 'Edukasi tanda infeksi luka dan red flag cedera kepala (muntah menyemprot, mengantuk berat, kejang). Segera kembali ke UGD jika ada keluhan tersebut.',
      tujuanPerawatan: 'Penyembuhan luka primer tanpa komplikasi infeksi',
      prognosisKode: '170968001',
      prognosisDisplay: 'Sanam / Baik (Bonam)',
      diagnosisArr: [
        {
          icd10Id: 'S01.0',
          kode_icd10: 'S01.0',
          nama_diagnosis: 'Open wound of scalp',
          jenisDiagnosis: 'UTAMA'
        },
        {
          icd10Id: 'T14.0',
          kode_icd10: 'T14.0',
          nama_diagnosis: 'Superficial injury of unspecified body region',
          jenisDiagnosis: 'SEKUNDER'
        }
      ]
    });

    Swal.fire({
      icon: 'success',
      title: 'Data Dummy SOAP UGD Terisi!',
      text: 'Primary Survey ABCDE, Secondary Survey, Anamnesis Kegawatdaruratan, dan Diagnosa Trauma terisi otomatis.',
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  setSoapData({
    keluhanUtama: 'Pasien mengeluh demam tinggi sejak 3 hari yang lalu, disertai pusing, mual, dan badan terasa lemas.',
    riwayatPenyakitSekarang: 'Demam meningkat di sore dan malam hari. Pasien mengaku nafsu makan menurun dan sempat muntah 1x tadi pagi.',
    riwayatPenyakitDahulu: 'Riwayat Maag / Gastritis 1 tahun lalu. Tidak ada riwayat hipertensi atau diabetes.',
    riwayatAlergi: 'Tidak ada alergi obat maupun makanan.',
    keadaanUmum: 'Tampak Sakit Sedang',
    kesadaran: 'Compos Mentis (Sadar Penuh)',
    pemeriksaanFisik: 'Kepala: Normocephal, Mata: Anemis (-/-), Ikterik (-/-). Leher: Pembesaran KGB (-). Thorax: Vesikuler (+/+), Rhonchi (-/-), Wheezing (-/-). Abdomen: Supel, Nyeri tekan epigastrium (+), Bising usus normal. Ekstremitas: Akral hangat, CRT < 2d.',
    hasilPenunjang: 'Laboratorium: Hb 13.5 g/dL, Leukosit 8.400 /uL, Trombosit 210.000 /uL, Widal Typhi O 1/160.',
    diagnosisKlinis: 'Febris ec Susp. Fever / Demam Dengue + Gastritis Akut',
    rencanaTerapi: '1. Istirahat cukup (Bed rest)\n2. Minum air putih 2-3 Liter/hari\n3. Paracetamol 500mg 3x1 tablet bila demam\n4. Antasida Doen 3x1 tablet sebelum makan\n5. Evaluasi darah rutin ulang bila demam > 3 hari',
    instruksiMedis: 'Edukasi tanda bahaya perdarahan (mimisan, gusi berdarah). Segera ke UGD jika lemas berat atau muntah terus menerus.',
    tujuanPerawatan: 'Pemulihan kondisi suhu tubuh normal dan eliminasi keluhan mual/nyeri ulu hati pasien',
    prognosisKode: '170968001',
    prognosisDisplay: 'Sanam / Baik (Bonam)',
    diagnosisArr: [
      {
        icd10Id: 'A90',
        kode_icd10: 'A90',
        nama_diagnosis: 'Dengue fever [classical dengue]',
        jenisDiagnosis: 'UTAMA'
      },
      {
        icd10Id: 'K29.7',
        kode_icd10: 'K29.7',
        nama_diagnosis: 'Gastritis, unspecified',
        jenisDiagnosis: 'SEKUNDER'
      }
    ]
  });

  Swal.fire({
    icon: 'success',
    title: 'Data Dummy Dokter Terisi 100%!',
    text: 'Semua field SOAP (Subjektif, Objektif, Asesmen, Plan/Rencana), Diagnosa ICD-10, & Tujuan Perawatan terisi otomatis.',
    timer: 2000,
    showConfirmButton: false,
  });
};

export const AVAILABLE_LAB_TESTS = [
  { category: 'HEMATOLOGI', defaultOpen: true, tests: ['Hematologi Rutin/CBC', 'Hematologi Lengkap (CBC, LED, Hitung Jenis)', 'Hemoglobin', 'LED', 'Eritrosit', 'Leukosit', 'Trombosit', 'Hematokrit', 'Golongan Darah A,B,O & Rh', 'Gambaran Darah Tepi'] },
  { category: 'URINALISA & FAECES', defaultOpen: true, tests: ['Urine Rutin', 'Protein Total (Urine 24 jam)', 'Faeces Rutin', 'Darah Samar (FIT)'] },
  { category: 'KIMIA DARAH DASAR', defaultOpen: true, tests: ['Glukosa Puasa', 'Glukosa 2 Jam PP', 'Glukosa Sewaktu', 'Ureum', 'Kreatinin', 'Cholesterol Total', 'Trigliserida', 'SGOT', 'SGPT'] },
  { category: 'INFEKSI & HEPATITIS', defaultOpen: true, tests: ['HBsAg', 'Anti-HBs', 'Anti-HCV', 'Anti-HAV IgM', 'Widal', 'Dengue NS1 Antigen', 'Anti-Dengue IgG & IgM', 'Malaria (Mikroskopik)', 'Anti-HIV', 'VDRL/RPR'] },
  { category: 'ANEMIA', defaultOpen: false, tests: ['Hematologi Rutin + Retikulosit', 'Retikulosit', 'Besi', 'UIBC Direk', 'TIBC', 'Ferritin', 'Transferrin'] },
  { category: 'FAAL HEMOSTASIS', defaultOpen: false, tests: ['Waktu Perdarahan', 'Waktu Pembekuan', 'Waktu Protrombin', 'Waktu Trombin', 'APTT', 'Fibrinogen', 'D-Dimer', 'AT III'] },
  { category: 'FAAL HATI (Lanjutan)', defaultOpen: false, tests: ['Gamma GT', 'Fosfatase Alkali', 'CHE', 'Bilirubin Total', 'Bilirubin Direk', 'Protein Total', 'Albumin', 'Globulin'] },
  { category: 'DIABETES (Lanjutan)', defaultOpen: false, tests: ['TTGO', 'HbA1c', 'Insulin'] },
  { category: 'LEMAK (Lanjutan)', defaultOpen: false, tests: ['Cholesterol LDL Direk', 'Cholesterol HDL', 'Apo A1', 'Apo B'] },
  { category: 'JANTUNG', defaultOpen: false, tests: ['CK', 'CK-MB', 'Troponin I', 'hs-Troponin I Kuantitatif', 'LDH', 'NT-Pro BNP'] },
  { category: 'GINJAL - HIPERTENSI (Lanjutan)', defaultOpen: false, tests: ['Asam Urat', 'Cystatin-C', 'Albumin Urine Kuantitatif', 'Rasio Albumin-Kreatinin', 'Renin (PRA)', 'Aldosteron'] },
  { category: 'ELEKTROLIT - GAS DARAH', defaultOpen: false, tests: ['Na, K, Cl', 'Kalsium', 'Fosfor Anorganik', 'Magnesium', 'Analisis Gas Darah'] },
  { category: 'TIROID', defaultOpen: false, tests: ['FT3', 'FT4', 'TSHs', 'T3 (Total)', 'T4 (Total)'] },
  { category: 'TUMOR MARKER', defaultOpen: false, tests: ['AFP', 'CEA', 'PSA', 'CA 125', 'CA 15-3', 'CA 19-9'] },
  { category: 'IMUNOLOGI', defaultOpen: false, tests: ['ASTO', 'RF', 'CRP Kualitatif', 'hs-CRP', 'ANA (IF)', 'Anti-dsDNA'] }
];

export interface QuickLabPackage {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  tests: string[];
}

export const QUICK_LAB_PACKAGES: QuickLabPackage[] = [
  {
    id: 'ANC_TRIPLE',
    name: 'Paket ANC Bumil (Triple Eliminasi)',
    badge: 'Program KIA',
    color: 'border-pink-300 bg-pink-50/80 text-pink-900 hover:bg-pink-100',
    description: 'Skrining K1/K4: Hb, Gol. Darah, Urine Rutin, HIV, Sifilis, HBsAg',
    tests: ['Hemoglobin', 'Golongan Darah A,B,O & Rh', 'Urine Rutin', 'Anti-HIV', 'HBsAg', 'VDRL/RPR']
  },
  {
    id: 'SKRINING_PTM',
    name: 'Paket Skrining PTM / Prolanis',
    badge: 'DM & Hipertensi',
    color: 'border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100',
    description: 'Skrining Metabolik: Glukosa Sewaktu, Kolesterol Total, Asam Urat, Urine Rutin',
    tests: ['Glukosa Sewaktu', 'Cholesterol Total', 'Asam Urat', 'Urine Rutin']
  },
  {
    id: 'FEBRIS_DBD',
    name: 'Paket Febris / Suspek DBD & Tipoid',
    badge: 'Demam Akut',
    color: 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100',
    description: 'Pemeriksaan Demam: Hematologi Lengkap, Dengue NS1, Widal',
    tests: ['Hematologi Lengkap (CBC, LED, Hitung Jenis)', 'Dengue NS1 Antigen', 'Widal']
  },
  {
    id: 'DARAH_RUTIN',
    name: 'Paket Darah Lengkap (CBC)',
    badge: 'Hematologi',
    color: 'border-indigo-300 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100',
    description: 'Skrining Infeksi & Anemia: Hematologi Rutin/CBC',
    tests: ['Hematologi Rutin/CBC']
  }
];

export const isInternalLabTest = (testName: string = ''): boolean => {
  const t = testName.toLowerCase();
  const internalKeywords = [
    'hematologi rutin', 'hematologi lengkap', 'hemoglobin', 'led', 'eritrosit',
    'leukosit', 'trombosit', 'hematokrit', 'golongan darah',
    'urine rutin', 'faeces rutin', 'darah samar',
    'glukosa', 'asam urat', 'cholesterol total', 'trigliserida',
    'widal', 'dengue', 'malaria', 'hiv', 'hbsag', 'vdrl', 'sifilis',
    'sgot', 'sgpt', 'ureum', 'kreatinin'
  ];
  return internalKeywords.some(k => t.includes(k));
};

export interface PrimarySurveyUGDValues {
  airway?: string;
  breathing?: string;
  circulation?: string;
  disability?: string;
  exposure?: string;
}

export const buildUgdPemeriksaanFisik = (
  ps: PrimarySurveyUGDValues = {},
  secondary: string = ''
): string => {
  const parts: string[] = [];
  const hasPrimary = Boolean(
    ps.airway?.trim() || 
    ps.breathing?.trim() || 
    ps.circulation?.trim() || 
    ps.disability?.trim() || 
    ps.exposure?.trim()
  );

  if (hasPrimary) {
    parts.push('=== PRIMARY SURVEY UGD (ABCDE) ===');
    if (ps.airway?.trim()) parts.push(`[A - Airway & Cervical]: ${ps.airway.trim()}`);
    if (ps.breathing?.trim()) parts.push(`[B - Breathing & Ventilasi]: ${ps.breathing.trim()}`);
    if (ps.circulation?.trim()) parts.push(`[C - Circulation & Kontrol Perdarahan]: ${ps.circulation.trim()}`);
    if (ps.disability?.trim()) parts.push(`[D - Disability / GCS & Pupil]: ${ps.disability.trim()}`);
    if (ps.exposure?.trim()) parts.push(`[E - Exposure & Jejas]: ${ps.exposure.trim()}`);
  }

  if (secondary && secondary.trim()) {
    if (hasPrimary) {
      parts.push('\n=== SECONDARY SURVEY & PEMERIKSAAN FISIK LENGKAP ===');
    }
    parts.push(secondary.trim());
  }

  return parts.join('\n');
};

export const parseUgdPemeriksaanFisik = (text: string = ''): {
  primarySurvey: PrimarySurveyUGDValues;
  secondarySurvey: string;
} => {
  if (!text) {
    return {
      primarySurvey: { airway: '', breathing: '', circulation: '', disability: '', exposure: '' },
      secondarySurvey: '',
    };
  }

  const airwayMatch = text.match(/\[A\s*-\s*Airway[^\]]*\]:\s*([^\n]+)/i) || text.match(/\[A-Airway\]\s*([^\n]+)/i);
  const breathingMatch = text.match(/\[B\s*-\s*Breathing[^\]]*\]:\s*([^\n]+)/i) || text.match(/\[B-Breathing\]\s*([^\n]+)/i);
  const circulationMatch = text.match(/\[C\s*-\s*Circulation[^\]]*\]:\s*([^\n]+)/i) || text.match(/\[C-Circulation\]\s*([^\n]+)/i);
  const disabilityMatch = text.match(/\[D\s*-\s*Disability[^\]]*\]:\s*([^\n]+)/i) || text.match(/\[D-E-Neurologis\]\s*([^\n]+)/i);
  const exposureMatch = text.match(/\[E\s*-\s*Exposure[^\]]*\]:\s*([^\n]+)/i);

  let secondary = text;
  if (text.includes('=== SECONDARY SURVEY & PEMERIKSAAN FISIK LENGKAP ===')) {
    secondary = text.split('=== SECONDARY SURVEY & PEMERIKSAAN FISIK LENGKAP ===')[1]?.trim() || '';
  } else if (text.includes('--- SECONDARY SURVEY & PEMERIKSAAN FISIK LENGKAP ---')) {
    secondary = text.split('--- SECONDARY SURVEY & PEMERIKSAAN FISIK LENGKAP ---')[1]?.trim() || '';
  } else if (text.includes('=== PRIMARY SURVEY UGD (ABCDE) ===') || text.includes('--- PRIMARY SURVEY UGD (ABCDE) ---') || airwayMatch || breathingMatch) {
    secondary = text
      .replace(/=== PRIMARY SURVEY UGD \(ABCDE\) ===/gi, '')
      .replace(/--- PRIMARY SURVEY UGD \(ABCDE\) ---/gi, '')
      .replace(/\[A\s*-\s*Airway[^\]]*\]:[^\n]*/gi, '')
      .replace(/\[B\s*-\s*Breathing[^\]]*\]:[^\n]*/gi, '')
      .replace(/\[C\s*-\s*Circulation[^\]]*\]:[^\n]*/gi, '')
      .replace(/\[D\s*-\s*Disability[^\]]*\]:[^\n]*/gi, '')
      .replace(/\[E\s*-\s*Exposure[^\]]*\]:[^\n]*/gi, '')
      .replace(/\[A-Airway\][^\n]*/gi, '')
      .replace(/\[B-Breathing\][^\n]*/gi, '')
      .replace(/\[C-Circulation\][^\n]*/gi, '')
      .replace(/\[D-E-Neurologis\][^\n]*/gi, '')
      .trim();
  }

  return {
    primarySurvey: {
      airway: airwayMatch ? airwayMatch[1].trim() : '',
      breathing: breathingMatch ? breathingMatch[1].trim() : '',
      circulation: circulationMatch ? circulationMatch[1].trim() : '',
      disability: disabilityMatch ? disabilityMatch[1].trim() : '',
      exposure: exposureMatch ? exposureMatch[1].trim() : '',
    },
    secondarySurvey: secondary,
  };
};
