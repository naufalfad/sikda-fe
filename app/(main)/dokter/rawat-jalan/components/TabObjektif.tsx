import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { FileText, Stethoscope, AlertCircle, Heart, Thermometer, Activity, ShieldAlert, Zap, RotateCcw, Info } from 'lucide-react';
import { SOAPPayload } from '@/types/rawatJalan.types';
import OdontogramChart from './OdontogramChart';
import { buildUgdPemeriksaanFisik, parseUgdPemeriksaanFisik, PrimarySurveyUGDValues } from '../rawatJalan.constants';

interface TabObjektifProps {
  soapData: SOAPPayload;
  setSoapData: Dispatch<SetStateAction<SOAPPayload>>;
  setActiveTab: (tab: string) => void;
  openLabModal: () => void;
  isPoliGigi?: boolean;
  screeningData?: any;
  selectedKunjungan?: any;
}

export default function TabObjektif({
  soapData,
  setSoapData,
  setActiveTab,
  openLabModal,
  isPoliGigi,
  screeningData,
  selectedKunjungan,
}: TabObjektifProps) {
  const isUgd = Boolean(
    selectedKunjungan?.jenisPelayanan === 'UGD' || 
    selectedKunjungan?.triase || 
    selectedKunjungan?.poliklinik?.namaPoli?.toUpperCase().includes('UGD') ||
    selectedKunjungan?.poliklinik?.namaPoli?.toUpperCase().includes('IGD') ||
    (selectedKunjungan?.tempatTidurs && selectedKunjungan?.tempatTidurs.length > 0)
  );

  const ttv = screeningData;

  // Active Primary Survey data (from soapData or parsed from existing raw pemeriksaanFisik)
  const currentPs: PrimarySurveyUGDValues = useMemo(() => {
    if (soapData.primarySurvey && Object.keys(soapData.primarySurvey).length > 0) {
      return soapData.primarySurvey;
    }
    if (soapData.pemeriksaanFisik) {
      return parseUgdPemeriksaanFisik(soapData.pemeriksaanFisik).primarySurvey;
    }
    return { airway: '', breathing: '', circulation: '', disability: '', exposure: '' };
  }, [soapData.primarySurvey, soapData.pemeriksaanFisik]);

  // Active Secondary Survey data (from soapData or parsed from existing raw pemeriksaanFisik)
  const currentSecondary: string = useMemo(() => {
    if (soapData.secondarySurvey !== undefined) {
      return soapData.secondarySurvey;
    }
    if (soapData.pemeriksaanFisik) {
      return parseUgdPemeriksaanFisik(soapData.pemeriksaanFisik).secondarySurvey;
    }
    return '';
  }, [soapData.secondarySurvey, soapData.pemeriksaanFisik]);

  const updatePrimarySurvey = (field: keyof PrimarySurveyUGDValues, value: string) => {
    const updatedPs: PrimarySurveyUGDValues = {
      airway: currentPs.airway || '',
      breathing: currentPs.breathing || '',
      circulation: currentPs.circulation || '',
      disability: currentPs.disability || '',
      exposure: currentPs.exposure || '',
      [field]: value,
    };
    const newPemeriksaanFisik = buildUgdPemeriksaanFisik(updatedPs, currentSecondary);
    setSoapData((prev) => ({
      ...prev,
      primarySurvey: updatedPs,
      pemeriksaanFisik: newPemeriksaanFisik,
    }));
  };

  const handleBadgeClick = (field: keyof PrimarySurveyUGDValues, badgeText: string) => {
    const currentVal = currentPs[field] || '';
    if (!currentVal.trim()) {
      updatePrimarySurvey(field, badgeText);
    } else if (currentVal.toLowerCase().includes(badgeText.toLowerCase())) {
      // Already present
      return;
    } else {
      updatePrimarySurvey(field, `${currentVal}, ${badgeText}`);
    }
  };

  const updateSecondarySurvey = (value: string) => {
    const newPemeriksaanFisik = isUgd
      ? buildUgdPemeriksaanFisik(currentPs, value)
      : value;
    setSoapData((prev) => ({
      ...prev,
      secondarySurvey: value,
      pemeriksaanFisik: newPemeriksaanFisik,
    }));
  };

  const handleSetNormalAbcde = () => {
    const normalPs: PrimarySurveyUGDValues = {
      airway: 'Paten, bebas sumbatan, fraktur servikal (-)',
      breathing: 'Spontan reguler, pergerakan dinding dada simetris, retraksi (-), wheezing (-), rhonki (-)',
      circulation: 'Nadi kuat reguler, CRT < 2 detik, akral hangat kering merah, perdarahan aktif (-)',
      disability: 'GCS 15 (E4V5M6) Compos Mentis, pupil isokor 3mm/3mm (+/+), defisit neurologis (-)',
      exposure: 'Tidak tampak jejas/deformitas mayor, luka terbuka (-), suhu terkontrol normal',
    };
    const newPemeriksaanFisik = buildUgdPemeriksaanFisik(normalPs, currentSecondary);
    setSoapData((prev) => ({
      ...prev,
      primarySurvey: normalPs,
      pemeriksaanFisik: newPemeriksaanFisik,
    }));
  };

  const handleClearAbcde = () => {
    const emptyPs: PrimarySurveyUGDValues = {
      airway: '',
      breathing: '',
      circulation: '',
      disability: '',
      exposure: '',
    };
    const newPemeriksaanFisik = buildUgdPemeriksaanFisik(emptyPs, currentSecondary);
    setSoapData((prev) => ({
      ...prev,
      primarySurvey: emptyPs,
      pemeriksaanFisik: newPemeriksaanFisik,
    }));
  };

  return (
    <div className="p-8 space-y-6">
      <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
        <FileText className="w-6 h-6 text-blue-600" />
        O - Objektif {isUgd ? '(Pemeriksaan Fisik & Primary Survey UGD)' : '(Pemeriksaan Fisik & Penunjang)'}
      </h3>

      {/* CARD KHUSUS UGD: HASIL TRIASE & TTV AWAL PERAWAT */}
      {isUgd && (
        <div className="bg-rose-50 border-2 border-rose-600 p-5 rounded-none space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
            <h4 className="font-black text-rose-950 text-sm flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-700" />
              Tanda Vital & Triase Masuk Pasien UGD (Diukur oleh Perawat Triase)
            </h4>
            <span className={`text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider rounded-none ${
              selectedKunjungan?.triase === 'MERAH' ? 'bg-red-600 text-white animate-pulse' :
              selectedKunjungan?.triase === 'KUNING' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              TRIASE: {selectedKunjungan?.triase || ttv?.kategoriTriage || 'MERAH'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Tekanan Darah</span>
              <span className="font-extrabold text-rose-950 text-base font-mono">
                {ttv?.tekananDarahSistolik && ttv?.tekananDarahDiastolik ? `${ttv.tekananDarahSistolik}/${ttv.tekananDarahDiastolik}` : '-'}
              </span>
              <span className="text-[9px] text-gray-400 block">mmHg</span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Frekuensi Nadi</span>
              <span className="font-extrabold text-rose-950 text-base font-mono">
                {ttv?.nadi || '-'}
              </span>
              <span className="text-[9px] text-gray-400 block">x/menit</span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Pernapasan (RR)</span>
              <span className="font-extrabold text-rose-950 text-base font-mono">
                {ttv?.pernapasan || '-'}
              </span>
              <span className="text-[9px] text-gray-400 block">x/menit</span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Suhu Tubuh</span>
              <span className="font-extrabold text-rose-950 text-base font-mono">
                {ttv?.suhuTubuh || '-'}
              </span>
              <span className="text-[9px] text-gray-400 block">°C</span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">SpO2 (Saturasi)</span>
              <span className="font-extrabold text-blue-900 text-base font-mono">
                {ttv?.saturasiO2 ? `${ttv.saturasiO2}%` : '-'}
              </span>
              <span className="text-[9px] text-gray-400 block">Pulse Oximetry</span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Kesadaran</span>
              <span className="font-bold text-gray-900 text-xs block truncate mt-1">
                {ttv?.kesadaran || soapData.kesadaran || 'Compos Mentis'}
              </span>
            </div>

            <div className="bg-white p-2.5 border border-rose-200 text-center">
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Skala Nyeri</span>
              <span className={`font-black text-base font-mono ${
                (ttv?.tingkatNyeri || 0) >= 7 ? 'text-red-600' : (ttv?.tingkatNyeri || 0) >= 4 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {ttv?.tingkatNyeri ?? '-'} / 10
              </span>
              <span className="text-[9px] text-gray-400 block">VAS Score</span>
            </div>
          </div>
        </div>
      )}

      {/* ODONTOGRAM CHART UNTUK POLI GIGI & MULUT */}
      {isPoliGigi && (
        <div className="mb-6">
          <OdontogramChart
            value={soapData.odontogram}
            oralFindings={soapData.oralFindings}
            onChange={(odontogramMap, dmft) => {
              setSoapData((prev) => ({
                ...prev,
                odontogram: odontogramMap,
                dmft: dmft,
              }));
            }}
            onOralFindingsChange={(findings) => {
              setSoapData((prev) => ({
                ...prev,
                oralFindings: findings,
              }));
            }}
          />
        </div>
      )}

      {/* PRIMARY SURVEY UGD (ABCDE) KHUSUS UGD */}
      {isUgd && (
        <div className="bg-white p-6 border-2 border-red-500 rounded-none space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-red-200 pb-3 gap-2">
            <div>
              <h4 className="font-black text-red-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                Primary Survey Kegawatdaruratan (ABCDE)
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Evaluasi dan stabilisasi cepat fungsi vital pasien gawat darurat (Standar ATLS / ACLS).
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetNormalAbcde}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded shadow-sm flex items-center gap-1 transition-colors"
                title="Isi otomatis semua parameter ABCDE dengan nilai normal stabil"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                ⚡ Set Normal ABCDE
              </button>
              <button
                type="button"
                onClick={handleClearAbcde}
                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] rounded border border-gray-300 flex items-center gap-1 transition-colors"
                title="Kosongkan form ABCDE"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* A - AIRWAY */}
            <div className="bg-red-50/40 p-4 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-red-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">A</span>
                  Airway & Cervical Spine Control
                </label>
                <span className="text-[10px] text-red-700 font-semibold">Jalan Napas</span>
              </div>
              
              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Paten (Bebas)',
                  'Gargling',
                  'Stridor',
                  'Snoring',
                  'Terpasang OPA/NPA',
                  'Intubasi / ETT',
                  'Cervical Collar (+)',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleBadgeClick('airway', chip)}
                    className="px-1.5 py-0.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-[10px] font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input 
                type="text"
                value={currentPs.airway || ''}
                onChange={e => updatePrimarySurvey('airway', e.target.value)}
                className="w-full bg-white border border-red-300 p-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 placeholder:text-gray-400 font-medium"
                placeholder="Paten / Bebas / Gargling / Stridor / Fraktur Servikal (+/-)..."
              />
            </div>

            {/* B - BREATHING */}
            <div className="bg-red-50/40 p-4 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-red-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">B</span>
                  Breathing & Ventilasi
                </label>
                <span className="text-[10px] text-red-700 font-semibold">Pernapasan</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Spontan & Simetris',
                  'Retraksi Dada (+)',
                  'Takipnea',
                  'Wheezing (+/+)',
                  'Rhonki (+/+)',
                  'O2 Nasal 3-4 lpm',
                  'O2 NRM 10-15 lpm',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleBadgeClick('breathing', chip)}
                    className="px-1.5 py-0.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-[10px] font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input 
                type="text"
                value={currentPs.breathing || ''}
                onChange={e => updatePrimarySurvey('breathing', e.target.value)}
                className="w-full bg-white border border-red-300 p-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 placeholder:text-gray-400 font-medium"
                placeholder="Spontan / Retraksi Dada (+/-) / Wheezing / Rhonki / O2 Terpasang..."
              />
            </div>

            {/* C - CIRCULATION */}
            <div className="bg-red-50/40 p-4 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-red-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">C</span>
                  Circulation & Kontrol Perdarahan
                </label>
                <span className="text-[10px] text-red-700 font-semibold">Sirkulasi & Nadi</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Nadi Kuat Reguler',
                  'Nadi Cepat & Lemah',
                  'Akral Hangat',
                  'Akral Dingin & Pucat',
                  'CRT < 2 dtk',
                  'CRT > 2 dtk',
                  'Perdarahan Aktif (-)',
                  'Perdarahan Aktif (+)',
                  'IV Line Terpasang (RL)',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleBadgeClick('circulation', chip)}
                    className="px-1.5 py-0.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-[10px] font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input 
                type="text"
                value={currentPs.circulation || ''}
                onChange={e => updatePrimarySurvey('circulation', e.target.value)}
                className="w-full bg-white border border-red-300 p-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 placeholder:text-gray-400 font-medium"
                placeholder="Nadi Kuat/Lemah, Akral Hangat/Dingin, CRT < 2 dtk, Perdarahan Aktif (+/-)..."
              />
            </div>

            {/* D - DISABILITY */}
            <div className="bg-red-50/40 p-4 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-red-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">D</span>
                  Disability (Neurologis, GCS & Pupil)
                </label>
                <span className="text-[10px] text-red-700 font-semibold">Neurologis</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  'GCS 15 (E4V5M6)',
                  'GCS 12-14 (Apatis)',
                  'GCS ≤ 8 (Kritis)',
                  'Pupil Isokor 3mm/3mm (+/+)',
                  'Pupil Anisokor',
                  'Lateralisasi (-)',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleBadgeClick('disability', chip)}
                    className="px-1.5 py-0.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-[10px] font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input 
                type="text"
                value={currentPs.disability || ''}
                onChange={e => updatePrimarySurvey('disability', e.target.value)}
                className="w-full bg-white border border-red-300 p-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 placeholder:text-gray-400 font-medium"
                placeholder="GCS: E4V5M6, Pupil Isokor (+/+), Defisit neurologis (-)..."
              />
            </div>

            {/* E - EXPOSURE */}
            <div className="bg-red-50/40 p-4 border border-red-200 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-red-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">E</span>
                  Exposure & Kontrol Lingkungan (Jejas, Deformitas & Hipotermia)
                </label>
                <span className="text-[10px] text-red-700 font-semibold">Cedera Tubuh / Jejas</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Tidak Ada Jejas Mayor',
                  'Vulnus Laceratum (Robek)',
                  'Vulnus Ekskoriasi (Lecet)',
                  'Hematoma / Jejas Dada',
                  'Deformitas Ekstremitas (+)',
                  'Hipotermia (-)',
                  'Selimut Penghangat Terpasang',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleBadgeClick('exposure', chip)}
                    className="px-1.5 py-0.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-[10px] font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input 
                type="text"
                value={currentPs.exposure || ''}
                onChange={e => updatePrimarySurvey('exposure', e.target.value)}
                className="w-full bg-white border border-red-300 p-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 placeholder:text-gray-400 font-medium"
                placeholder="Deformitas (-), Jejas thoraks/abdomen (-), Vulnus luka robek/lecet, Suhu terkontrol..."
              />
            </div>
          </div>
        </div>
      )}

      {/* KEADAAN UMUM, KESADARAN & SECONDARY SURVEY */}
      <div className="bg-blue-50/30 p-6 border border-blue-100 rounded-none space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Keadaan Umum</label>
            <select 
              value={soapData.keadaanUmum || 'Tampak Sakit Sedang'} 
              onChange={e => setSoapData({...soapData, keadaanUmum: e.target.value})} 
              className="w-full px-4 py-2 bg-white border border-blue-200 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900"
            >
              <option>Tampak Sakit Ringan</option>
              <option>Tampak Sakit Sedang</option>
              <option>Tampak Sakit Berat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tingkat Kesadaran</label>
            <select 
              value={soapData.kesadaran || 'Compos Mentis (Sadar Penuh)'} 
              onChange={e => setSoapData({...soapData, kesadaran: e.target.value})} 
              className="w-full px-4 py-2 bg-white border border-blue-200 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900"
            >
              <option>Compos Mentis (Sadar Penuh)</option>
              <option>Apatis</option>
              <option>Somnolen</option>
              <option>Sopor</option>
              <option>Koma</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {isUgd ? 'Secondary Survey / Pemeriksaan Fisik Lanjutan UGD' : 'Pemeriksaan Fisik Spesifik / Lokalis'}
          </label>
          <textarea 
            rows={4} 
            value={isUgd ? currentSecondary : (soapData.pemeriksaanFisik || '')} 
            onChange={e => {
              if (isUgd) {
                updateSecondarySurvey(e.target.value);
              } else {
                setSoapData({ ...soapData, pemeriksaanFisik: e.target.value });
              }
            }} 
            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900 font-medium" 
            placeholder={isUgd ? "Status lokalis luka, auskultasi thorax/cor/pulmo, palpasi abdomen, ekstremitas..." : "Contoh: Gigi 46 karies profunda, perkusi (+), palpasi (+)..."} 
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-bold text-gray-700">Hasil Penunjang (Lab Cito / Radiologi / EKG)</label>
            <button onClick={openLabModal} type="button" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1">
              <FileText className="w-3 h-3" /> Lihat Kertas Hasil Lab
            </button>
          </div>
          <textarea 
            rows={3} 
            value={soapData.hasilPenunjang || ''} 
            onChange={e => setSoapData({...soapData, hasilPenunjang: e.target.value})} 
            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900 font-medium" 
            placeholder="Hasil EKG 12 Lead, GDS stik cito, rontgen thoraks cito..." 
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button 
          onClick={() => { setActiveTab('SOAP_A'); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-none transition-colors shadow-sm text-sm flex items-center gap-2"
        >
          Lanjut ke A (Asesmen) &rarr;
        </button>
      </div>
    </div>
  );
}
