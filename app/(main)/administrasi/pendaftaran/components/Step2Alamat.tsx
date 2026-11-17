import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select as CustomSelect } from '@/components/ui/Select';
import { RegistrationFormData } from '../schema';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { useKodePosStore } from '@/store/kodepos.store';

const MapPickerModal = dynamic(() => import('@/components/ui/MapPickerModal'), { ssr: false });

interface Step2Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
}

export default function Step2Alamat({ register, errors, watch, setValue }: Step2Props) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSosialLainnya, setIsSosialLainnya] = useState(false);

  // Zustand Store for Kode Pos
  const { fetchKodePos } = useKodePosStore();

  // We need to watch the values to trigger fetching of the next level
  const selectedProvName = watch('provinsi');
  const selectedKabName = watch('kabupatenKota');
  const selectedKecName = watch('kecamatan');
  const selectedDesaName = watch('desaKelurahan');

  const handleDesaChange = async (val: string) => {
    setValue('desaKelurahan', val);
    if (val && selectedKecName) {
      const code = await fetchKodePos(val, selectedKecName);
      if (code) {
        setValue('kodePos', code);
      }
    }
  };

  useEffect(() => {
    if (selectedDesaName && selectedKecName) {
      fetchKodePos(selectedDesaName, selectedKecName).then((code) => {
        if (code) setValue('kodePos', code);
      });
    }
  }, [selectedDesaName, selectedKecName, fetchKodePos, setValue]);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  };

  // API Wilayah (Ibnux)
  const API_BASE = 'https://ibnux.github.io/data-indonesia';

  useEffect(() => {
    fetch(`${API_BASE}/provinsi.json`)
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedProvName) {
      const prov = provinces.find(p => p.nama === selectedProvName);
      if (prov) {
        fetch(`${API_BASE}/kabupaten/${prov.id}.json`)
          .then(res => res.json())
          .then(data => {
            setRegencies(data);
            // Reset lower levels
            if (selectedKabName && !data.find((d: any) => d.nama.toUpperCase() === selectedKabName.toUpperCase())) {
              setValue('kabupatenKota', '');
              setValue('kecamatan', '');
              setValue('desaKelurahan', '');
            }
          })
          .catch(err => console.error(err));
      }
    } else {
      setRegencies([]);
    }
  }, [selectedProvName, provinces, setValue, selectedKabName, regencies.length]);

  useEffect(() => {
    if (selectedKabName) {
      const reg = regencies.find(r => r.nama === selectedKabName);
      if (reg) {
        fetch(`${API_BASE}/kecamatan/${reg.id}.json`)
          .then(res => res.json())
          .then(data => {
            setDistricts(data);
            // Reset lower levels
            if (selectedKecName && !data.find((d: any) => d.nama.toUpperCase() === selectedKecName.toUpperCase())) {
              setValue('kecamatan', '');
              setValue('desaKelurahan', '');
            }
          })
          .catch(err => console.error(err));
      }
    } else {
      setDistricts([]);
    }
  }, [selectedKabName, regencies, setValue, selectedKecName, districts.length]);

  useEffect(() => {
    if (selectedKecName) {
      const dist = districts.find(d => d.nama === selectedKecName);
      if (dist) {
        fetch(`${API_BASE}/kelurahan/${dist.id}.json`)
          .then(res => res.json())
          .then(data => {
            setVillages(data);
            const selectedDesaName = watch('desaKelurahan');
            if (selectedDesaName && !data.find((d: any) => d.nama.toUpperCase() === selectedDesaName.toUpperCase())) {
              setValue('desaKelurahan', '');
            }
          })
          .catch(err => console.error(err));
      }
    } else {
      setVillages([]);
    }
  }, [selectedKecName, districts]);

  // Auto-Fetch Kode Pos diproses secara terpusat oleh useKodePosStore
  const rtRwValue = watch('rtRw') || '';
  const [rtVal = '', rwVal = ''] = rtRwValue.split('/');

  const handleRtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setValue('rtRw', `${val}/${rwVal}`);
  };

  const handleRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setValue('rtRw', `${rtVal}/${val}`);
  };
  const formatPascalCase = (e: React.ChangeEvent<HTMLInputElement>) => {
    return e;
  };

  const { onChange: onAlamatKtpChange, ...alamatKtpRest } = register('alamatKtp');
  const { onChange: onAlamatDomisiliChange, ...alamatDomisiliRest } = register('alamatDomisili');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Data Alamat & Demografi</h2>
        <p className="text-sm text-gray-500 mt-1">Informasi tempat tinggal dan latar belakang sosial pasien.</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Data Alamat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Alamat Sesuai KTP *" placeholder="Nama jalan / kampung" className="md:col-span-2" {...alamatKtpRest} onChange={(e) => onAlamatKtpChange(formatPascalCase(e))} error={errors.alamatKtp?.message} />
          <Input label="Alamat Domisili *" placeholder="Sama dengan KTP atau alamat lain" className="md:col-span-2" {...alamatDomisiliRest} onChange={(e) => onAlamatDomisiliChange(formatPascalCase(e))} error={errors.alamatDomisili?.message} />

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Provinsi *</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500"
              {...register('provinsi')}
              value={selectedProvName || ""}
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => (
                <option key={p.id} value={p.nama}>{toTitleCase(p.nama)}</option>
              ))}
            </select>
            {errors.provinsi && <p className="text-red-500 text-xs mt-1">{errors.provinsi.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Kabupaten/Kota *</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              {...register('kabupatenKota')}
              value={selectedKabName || ""}
              disabled={!selectedProvName}
            >
              <option value="">Pilih Kabupaten/Kota</option>
              {regencies.map(r => (
                <option key={r.id} value={r.nama}>{toTitleCase(r.nama)}</option>
              ))}
            </select>
            {errors.kabupatenKota && <p className="text-red-500 text-xs mt-1">{errors.kabupatenKota.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Kecamatan *</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              {...register('kecamatan')}
              value={selectedKecName || ""}
              disabled={!selectedKabName}
            >
              <option value="">Pilih Kecamatan</option>
              {districts.map(d => (
                <option key={d.id} value={d.nama}>{toTitleCase(d.nama)}</option>
              ))}
            </select>
            {errors.kecamatan && <p className="text-red-500 text-xs mt-1">{errors.kecamatan.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Desa/Kelurahan *</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              {...register('desaKelurahan')}
              value={watch('desaKelurahan') || ""}
              disabled={!selectedKecName}
              onChange={(e) => handleDesaChange(e.target.value)}
            >
              <option value="">Pilih Desa/Kelurahan</option>
              {villages.map(v => (
                <option key={v.id} value={v.nama}>{toTitleCase(v.nama)}</option>
              ))}
            </select>
            {errors.desaKelurahan && <p className="text-red-500 text-xs mt-1">{errors.desaKelurahan.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">RT / RW *</label>
            <div className="flex items-center gap-3">
              <input 
                className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500 text-center" 
                placeholder="001" 
                maxLength={3} 
                value={rtVal}
                onChange={handleRtChange}
              />
              <span className="font-bold text-slate-400 text-xl">/</span>
              <input 
                className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500 text-center" 
                placeholder="002" 
                maxLength={3} 
                value={rwVal}
                onChange={handleRwChange}
              />
            </div>
            {errors.rtRw && <p className="text-red-500 text-xs mt-1">{errors.rtRw.message}</p>}
          </div>

          <Input label="Kode Pos *" placeholder="12345" {...register('kodePos')} error={errors.kodePos?.message} />
          
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 mb-2">Titik GPS (Opsional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                placeholder="-6.200000, 106.816666"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-none bg-slate-50 text-slate-700 focus:outline-none"
                {...register('titikGps')}
              />
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 transition-colors flex items-center gap-2 border border-blue-200"
              >
                <MapPin className="w-4 h-4" />
                Pilih dari Peta
              </button>
            </div>
            {errors.titikGps && <p className="text-red-500 text-xs mt-1">{errors.titikGps.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Data Sosial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomSelect label="Status Disabilitas" {...register('statusDisabilitas')} options={[{ label: 'Tidak Disabilitas', value: 'Tidak' }, { label: 'Disabilitas Fisik', value: 'Fisik' }, { label: 'Disabilitas Sensorik', value: 'Sensorik' }, { label: 'Disabilitas Mental', value: 'Mental' }]} />
          
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Kepesertaan Program Sosial</label>
            {!isSosialLainnya ? (
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.target.value === 'Lainnya') {
                    setIsSosialLainnya(true);
                    setValue('programSosial', '');
                  } else {
                    setValue('programSosial', e.target.value);
                  }
                }}
                value={watch('programSosial') !== 'Tidak ada' && watch('programSosial') && !isSosialLainnya ? 'Lainnya' : (watch('programSosial') || '')}
              >
                <option value="">Pilih...</option>
                <option value="Tidak ada">Tidak ada</option>
                <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Misal: PKH, KIS, BSU..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-none bg-white focus:ring-2 focus:ring-blue-500"
                  {...register('programSosial')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSosialLainnya(false);
                    setValue('programSosial', 'Tidak ada');
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectLocation={(lat, lng) => {
          setValue('titikGps', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }}
      />
    </div>
  );
}
