import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { ScreeningFormData } from '../schema';
import { AlertTriangle, Clock, User, FileText, Activity, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { masterService } from '@/services/master.service';

const MANIFESTASI_OPTIONS = [
  { kode: '126485001', nama: 'Urticaria (Gatal-gatal)' },
  { kode: '271807003', nama: 'Ruam Kulit (Eruption of skin)' },
  { kode: '267036007', nama: 'Sesak Napas (Dyspnea)' },
  { kode: '39579001',  nama: 'Syok Anafilaktik (Anaphylaxis)' },
  { kode: '419076005', nama: 'Reaksi Alergi Ringan (Allergic reaction)' },
  { kode: '422587007', nama: 'Mual (Nausea)' },
  { kode: '422400008', nama: 'Muntah (Vomiting)' }
];

interface Step1Props {
  register: UseFormRegister<ScreeningFormData>;
  errors: FieldErrors<ScreeningFormData>;
  watch: UseFormWatch<ScreeningFormData>;
  setValue: UseFormSetValue<ScreeningFormData>;
  isPoliGigi?: boolean;
}

export default function Step1Umum({ register, errors, watch, setValue, isPoliGigi }: Step1Props) {
  const toTitleCase = (str: string) => {
    if (!str) return str;
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  };

  const handleTitleCaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: keyof ScreeningFormData) => {
    e.target.value = toTitleCase(e.target.value);
    register(fieldName).onChange(e);
  };

  const [masterAlergis, setMasterAlergis] = useState<any[]>([]);
  const [selectedAlergenId, setSelectedAlergenId] = useState('');
  const [selectedManifestasiKode, setSelectedManifestasiKode] = useState('');

  useEffect(() => {
    masterService.getAlergi().then(res => {
      if (Array.isArray(res)) setMasterAlergis(res);
      else if (res.success) setMasterAlergis(res.data);
    }).catch(console.error);
  }, []);

  const alergiArr = watch('alergiArr') || [];

  const handleAddAlergi = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedAlergenId || !selectedManifestasiKode) return;

    const alergen = masterAlergis.find(a => a.id_alergi === selectedAlergenId);
    const manifestasi = MANIFESTASI_OPTIONS.find(m => m.kode === selectedManifestasiKode);

    if (!alergen || !manifestasi) return;

    const newItem = {
      alergiId: alergen.id_alergi,
      nama_alergi: alergen.nama_alergi,
      manifestasiKode: manifestasi.kode,
      manifestasiNama: manifestasi.nama,
      tingkatKeparahan: 'low'
    };

    setValue('alergiArr', [...alergiArr, newItem], { shouldValidate: true, shouldDirty: true });
    setSelectedAlergenId('');
    setSelectedManifestasiKode('');
  };

  const handleRemoveAlergi = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const arr = [...alergiArr];
    arr.splice(index, 1);
    setValue('alergiArr', arr, { shouldValidate: true, shouldDirty: true });
  };

  // Watch values for dynamic alerts
  const sistolik = watch('tekananDarahSistolik');
  const diastolik = watch('tekananDarahDiastolik');
  const suhu = watch('suhuTubuh');
  
  // Watch for IMT calculation
  const tb = watch('tinggiBadan');
  const bb = watch('beratBadan');

  // Watch for Nyeri
  const skalaNyeri = watch('skalaNyeri') || 0;

  // Watch for OHIS calculation
  const di = watch('debrisIndex');
  const ci = watch('kalkulusIndex');

  useEffect(() => {
    if (di !== undefined && ci !== undefined && !isNaN(di) && !isNaN(ci)) {
      const total = parseFloat((di + ci).toFixed(1));
      setValue('skorOhis', total);

      let status = 'Baik';
      if (total > 3.0) status = 'Buruk';
      else if (total > 1.2) status = 'Sedang';

      setValue('interpretasiOhis', status);
    }
  }, [di, ci, setValue]);

  const skorOhis = watch('skorOhis');
  const interpretasiOhis = watch('interpretasiOhis');

  const isTensiTinggi = Boolean(
    (sistolik && !isNaN(sistolik) && sistolik >= 140) || 
    (diastolik && !isNaN(diastolik) && diastolik >= 90)
  );
  const isSuhuTinggi = Boolean(suhu && !isNaN(suhu) && suhu >= 38);

  useEffect(() => {
    if (tb && bb && tb > 0 && !isNaN(tb) && !isNaN(bb)) {
      const tbMeter = tb / 100;
      const calcImt = bb / (tbMeter * tbMeter);
      setValue('imt', parseFloat(calcImt.toFixed(1)));

      // Formula Mosteller: sqrt((TB_cm * BB_kg) / 3600)
      const calcBsa = Math.sqrt((tb * bb) / 3600);
      setValue('luasPermukaanTubuh', parseFloat(calcBsa.toFixed(2)));
    } else {
      setValue('imt', undefined as any);
      setValue('luasPermukaanTubuh', undefined as any);
    }
  }, [tb, bb, setValue]);

  const imt = watch('imt');
  const bsa = watch('luasPermukaanTubuh');
  let imtStatus = '';
  if (imt) {
    if (imt < 18.5) imtStatus = 'Kurus';
    else if (imt < 25) imtStatus = 'Normal';
    else if (imt < 27) imtStatus = 'Gemuk';
    else imtStatus = 'Obesitas';
  }

  return (
    <div className="space-y-8">
      
      {/* SKRINING KHUSUS POLI GIGI (MUNCUL OTOMATIS JIKA POLI GIGI) */}
      {isPoliGigi && (
        <div className="bg-blue-50/60 p-6 border-2 border-blue-600 rounded-none space-y-6">
          <div className="flex items-center justify-between border-b border-blue-200 pb-3">
            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-700" />
              Skrining Khusus Poli Gigi & Mulut (Standar Kemenkes SATUSEHAT)
            </h3>
            <span className="px-2.5 py-1 bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-none">
              Poli Gigi Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Golongan Darah */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Golongan Darah (LOINC 883-9)</label>
              <select {...register('golonganDarah')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-sm font-bold focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih Gol. Darah --</option>
                <option value="A">Group A</option>
                <option value="B">Group B</option>
                <option value="AB">Group AB</option>
                <option value="O">Group O</option>
              </select>
            </div>

            {/* Rhesus */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Rhesus (LOINC 10331-7)</label>
              <select {...register('rhesus')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-sm font-bold focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih Rhesus --</option>
                <option value="+">Positive (+)</option>
                <option value="-">Negative (-)</option>
              </select>
            </div>

            {/* Status Kehamilan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Kehamilan (LOINC 82810-3)</label>
              <select {...register('statusKehamilan')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-sm font-bold focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih Status Kehamilan --</option>
                <option value="Tidak Hamil">Not Pregnant (Tidak Hamil)</option>
                <option value="Hamil">Pregnancy (Hamil)</option>
                <option value="Tidak Berlaku">Tidak Berlaku (Pria)</option>
              </select>
            </div>
          </div>

          {/* Form Oral Hygiene Index Simplified (OHIS) */}
          <div className="bg-white p-5 border border-blue-200 rounded-none space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Pengukuran Oral Hygiene Index Simplified (OHIS - Permenkes 30/2022)</span>
              <span className="text-xs text-blue-600 font-mono">SATUSEHAT OC000058</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Debris Indeks / DI (0.0 - 3.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="3" 
                  {...register('debrisIndex', { valueAsNumber: true })} 
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-none text-sm font-bold text-gray-900" 
                  placeholder="Misal: 1.2" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Kalkulus Indeks / CI (0.0 - 3.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="3" 
                  {...register('kalkulusIndex', { valueAsNumber: true })} 
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-none text-sm font-bold text-gray-900" 
                  placeholder="Misal: 0.8" 
                />
              </div>

              <div className="bg-slate-100 p-2.5 border border-slate-200 text-center">
                <span className="block text-[11px] font-bold text-gray-500 uppercase">Total Skor OHIS</span>
                <span className="text-xl font-black text-slate-900">{skorOhis !== undefined ? skorOhis : '-'}</span>
              </div>

              <div className="bg-slate-100 p-2.5 border border-slate-200 text-center">
                <span className="block text-[11px] font-bold text-gray-500 uppercase">Interpretasi OHIS</span>
                {interpretasiOhis ? (
                  <span className={`inline-block px-3 py-0.5 text-xs font-black uppercase rounded-none mt-0.5 text-white ${
                    interpretasiOhis === 'Baik' ? 'bg-emerald-600' :
                    interpretasiOhis === 'Sedang' ? 'bg-amber-600' : 'bg-red-600'
                  }`}>
                    {interpretasiOhis === 'Sedang' ? 'Sedang / Cukup Baik' : interpretasiOhis}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-bold">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Riwayat Alergi Anestesi & Pengencer Darah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Riwayat Alergi Bius Lokal / Anestesi Gigi</label>
              <input 
                type="text" 
                {...register('riwayatAlergiAnestesi')} 
                onChange={(e) => handleTitleCaseChange(e, 'riwayatAlergiAnestesi')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-xs text-gray-900" 
                placeholder="Misal: Alergi Lidocaine / Pehacain (atau ketik 'Tidak Ada')" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Riwayat Konsumsi Obat Pengencer Darah</label>
              <input 
                type="text" 
                {...register('riwayatPengencerDarah')} 
                onChange={(e) => handleTitleCaseChange(e, 'riwayatPengencerDarah')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-none text-xs text-gray-900" 
                placeholder="Misal: Aspirin, Warfarin, Clopidogrel (atau ketik 'Tidak Ada')" 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* ANAMNESIS (KELUHAN) & PENCATATAN ALERGI (DITARUH DI ATAS) */}
      <div className="bg-white p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Anamnesis (Keluhan Utama) & Riwayat Penyakit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Keluhan Utama <span className="text-red-500">*</span></label>
            <textarea 
              {...register('keluhanUtama')}
              onChange={(e) => handleTitleCaseChange(e, 'keluhanUtama')}
              rows={2}
              className={`w-full px-4 py-2.5 rounded-none border ${errors.keluhanUtama ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900`}
              placeholder="Keluhan utama pasien saat ini..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lama Keluhan</label>
            <input type="text" {...register('lamaKeluhan')} onChange={(e) => handleTitleCaseChange(e, 'lamaKeluhan')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Misal: 3 hari" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Penyakit Sekarang</label>
            <input type="text" {...register('riwayatPenyakitSekarang')} onChange={(e) => handleTitleCaseChange(e, 'riwayatPenyakitSekarang')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Detail penyakit sekarang..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Penyakit Dahulu</label>
            <input type="text" {...register('riwayatPenyakitDahulu')} onChange={(e) => handleTitleCaseChange(e, 'riwayatPenyakitDahulu')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Penyakit yang pernah dialami..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Operasi</label>
            <input type="text" {...register('riwayatOperasi')} onChange={(e) => handleTitleCaseChange(e, 'riwayatOperasi')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Kapan & Jenis operasi..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Rawat Inap</label>
            <input type="text" {...register('riwayatRawatInap')} onChange={(e) => handleTitleCaseChange(e, 'riwayatRawatInap')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Pernah dirawat karena..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Transfusi Darah</label>
            <input type="text" {...register('riwayatTransfusi')} onChange={(e) => handleTitleCaseChange(e, 'riwayatTransfusi')} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Pernah transfusi (Ya/Tidak, Kapan)..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Riwayat Pengobatan (MedicationStatement FHIR)</label>
            <textarea {...register('riwayatPengobatan' as any)} onChange={(e) => handleTitleCaseChange(e, 'riwayatPengobatan' as any)} rows={2} className="w-full px-4 py-2.5 rounded-none border border-gray-300 placeholder-gray-400 text-gray-900" placeholder="Tuliskan nama obat/suplemen yang rutin atau pernah dikonsumsi pasien..." />
          </div>

          {/* Pencatatan Alergi Standar SATUSEHAT */}
          <div className="md:col-span-2 mt-4 border-t border-blue-100 pt-6">
            <h4 className="text-md font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pencatatan Alergi (Standar SATUSEHAT)
            </h4>
            
            <div className="flex gap-2 items-end mb-4 bg-red-50/50 p-4 border border-red-100">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Zat / Alergen (Wajib)</label>
                <select 
                  value={selectedAlergenId} 
                  onChange={e => setSelectedAlergenId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-red-200 rounded-none text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Pilih Alergen --</option>
                  {masterAlergis.map(m => (
                    <option key={m.id_alergi} value={m.id_alergi}>{m.nama_alergi} ({m.kategori})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Gejala Reaksi (Wajib)</label>
                <select 
                  value={selectedManifestasiKode} 
                  onChange={e => setSelectedManifestasiKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-red-200 rounded-none text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Pilih Reaksi --</option>
                  {MANIFESTASI_OPTIONS.map(m => (
                    <option key={m.kode} value={m.kode}>{m.nama}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleAddAlergi}
                disabled={!selectedAlergenId || !selectedManifestasiKode}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-none h-[38px] flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {/* List Alergi Terpilih */}
            {alergiArr && alergiArr.length > 0 && (
              <div className="space-y-2">
                {alergiArr.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 border border-red-200 border-l-4 border-l-red-500 shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{item.nama_alergi}</p>
                      <p className="text-xs text-red-600">Reaksi: {item.manifestasiNama} (Keparahan: {item.tingkatKeparahan})</p>
                    </div>
                    <button onClick={(e) => handleRemoveAlergi(e, idx)} className="text-gray-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {(!alergiArr || alergiArr.length === 0) && (
              <p className="text-sm text-gray-500 italic">Belum ada alergi yang ditambahkan untuk kunjungan ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* PEMERIKSAAN FISIK (ANTROPOMETRI) */}
      <div className="bg-white p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Pemeriksaan Fisik (Antropometri)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="col-span-2 md:col-span-1 bg-emerald-50/70 p-2 border border-emerald-200 text-center flex flex-col justify-center">
            <label className="block text-xs font-bold text-emerald-800 uppercase">Usia Pasien</label>
            <div className="mt-1 font-black text-lg text-emerald-900">
              {watch('usia') !== undefined && watch('usia') !== null ? `${watch('usia')} Thn` : '-'}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">Otomatis dari Tgl Lahir</div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tinggi Badan (cm)</label>
            <input type="number" {...register('tinggiBadan', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="160" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Berat Badan (kg)</label>
            <input type="number" step="0.1" {...register('beratBadan', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="60" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Lingkar Perut (cm)</label>
            <input type="number" {...register('lingkarPerut', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="80" />
          </div>
          <div className="col-span-2 md:col-span-1 bg-gray-50 p-2 border border-gray-200 text-center flex flex-col justify-center">
            <label className="block text-xs font-semibold text-gray-500 uppercase">IMT (Otomatis)</label>
            <div className="mt-1 font-bold text-lg text-blue-700">{imt || '-'}</div>
            <div className="text-xs text-gray-500">{imtStatus}</div>
          </div>
          <div className="col-span-2 md:col-span-1 bg-blue-50/50 p-2 border border-blue-200 text-center flex flex-col justify-center">
            <label className="block text-xs font-extrabold text-blue-800 uppercase">BSA (Luas Tubuh)</label>
            <div className="mt-1 font-black text-lg text-blue-800">{bsa ? `${bsa} m²` : '-'}</div>
            <div className="text-[10px] text-blue-600 font-semibold">SATUSEHAT 8277-6</div>
          </div>
        </div>
      </div>

      {/* TANDA VITAL LENGKAP */}
      <div className="bg-white p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Tanda Vital
        </h3>
        
        {/* Alerts for Abnormalities */}
        {(isTensiTinggi || isSuhuTinggi) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Peringatan Klinis:</h4>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                {isTensiTinggi && <li>Tekanan Darah Tinggi (≥ 140/90)</li>}
                {isSuhuTinggi && <li>Demam Tinggi (≥ 38°C)</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tensi Sistolik</label>
            <input type="number" {...register('tekananDarahSistolik', { valueAsNumber: true })} className={`mt-1 w-full px-4 py-2 border ${isTensiTinggi ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-none placeholder-gray-400 text-gray-900`} placeholder="120" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tensi Diastolik</label>
            <input type="number" {...register('tekananDarahDiastolik', { valueAsNumber: true })} className={`mt-1 w-full px-4 py-2 border ${isTensiTinggi ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-none placeholder-gray-400 text-gray-900`} placeholder="80" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Nadi (x/mnt)</label>
            <input type="number" {...register('nadi', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="80" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Napas (x/mnt)</label>
            <input type="number" {...register('pernapasan', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="20" />
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Suhu (°C)</label>
            <input type="number" step="0.1" {...register('suhuTubuh', { valueAsNumber: true })} className={`mt-1 w-full px-4 py-2 border ${isSuhuTinggi ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-none placeholder-gray-400 text-gray-900`} placeholder="36.5" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">SpO2 (%)</label>
            <input type="number" {...register('saturasiOksigen', { valueAsNumber: true })} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-none placeholder-gray-400 text-gray-900" placeholder="98" />
          </div>
          <div className="col-span-2 md:col-span-2 bg-gray-50 p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Skala Nyeri (0-10)</label>
              <span className={`px-2 py-0.5 text-xs font-bold text-white shadow-sm ${
                skalaNyeri === 0 ? 'bg-blue-500' : 
                skalaNyeri <= 3 ? 'bg-green-500' : 
                skalaNyeri <= 6 ? 'bg-yellow-500' : 
                skalaNyeri <= 8 ? 'bg-orange-500' : 'bg-red-600'
              }`}>
                {skalaNyeri} - {skalaNyeri === 0 ? 'Tidak Nyeri' : skalaNyeri <= 3 ? 'Ringan' : skalaNyeri <= 6 ? 'Sedang' : skalaNyeri <= 8 ? 'Berat' : 'Sangat Hebat'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="10" 
              defaultValue={0} 
              {...register('skalaNyeri', { valueAsNumber: true })} 
              className={`mt-2 w-full h-2 rounded-lg appearance-none cursor-pointer ${
                skalaNyeri === 0 ? 'accent-blue-500 bg-blue-200' : 
                skalaNyeri <= 3 ? 'accent-green-500 bg-green-200' : 
                skalaNyeri <= 6 ? 'accent-yellow-500 bg-yellow-200' : 
                skalaNyeri <= 8 ? 'accent-orange-500 bg-orange-200' : 'accent-red-600 bg-red-200'
              }`} 
            />
            <div className="flex justify-between text-xs font-medium mt-2">
              <span className={skalaNyeri === 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}>0</span>
              <span className={skalaNyeri > 0 && skalaNyeri <= 3 ? 'text-green-600 font-bold' : 'text-gray-400'}>3</span>
              <span className={skalaNyeri > 3 && skalaNyeri <= 6 ? 'text-yellow-600 font-bold' : 'text-gray-400'}>6</span>
              <span className={skalaNyeri > 6 && skalaNyeri <= 8 ? 'text-orange-600 font-bold' : 'text-gray-400'}>8</span>
              <span className={skalaNyeri > 8 ? 'text-red-600 font-bold' : 'text-gray-400'}>10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
