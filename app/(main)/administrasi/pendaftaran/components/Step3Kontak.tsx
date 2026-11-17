import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RegistrationFormData } from '../schema';
import { usePerusahaanStore } from '@/store/perusahaan.store';

import { referensiService, RefItem } from '@/services/referensi.service';

interface Step3Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

export default function Step3Kontak({ register, errors, watch }: Step3Props) {
  const jenisPenjamin = watch('jenisPenjamin');
  
  const { perusahaan, isLoading, fetchPerusahaan } = usePerusahaanStore();
  const [penjaminList, setPenjaminList] = React.useState<RefItem[]>([]);

  React.useEffect(() => {
    referensiService.getByType('jenis-penjamin')
      .then((data) => {
        if (data && data.length > 0) setPenjaminList(data);
      })
      .catch((err) => console.error('Failed to load jenis-penjamin referensi', err));
  }, []);

  React.useEffect(() => {
    if (jenisPenjamin === 'Perusahaan' && perusahaan.length === 0) {
      fetchPerusahaan('AKTIF');
    }
  }, [jenisPenjamin, fetchPerusahaan, perusahaan.length]);

  const perusahaanOptions = perusahaan.map(p => ({ label: p.namaPerusahaan, value: p.namaPerusahaan }));

  const defaultPenjaminOptions = [
    { label: 'Umum / Mandiri', value: 'Umum' },
    { label: 'BPJS Kesehatan', value: 'BPJS' },
    { label: 'Asuransi Swasta', value: 'Asuransi' },
    { label: 'Perusahaan', value: 'Perusahaan' },
    { label: 'KIS', value: 'KIS' },
  ];

  const penjaminOptions = penjaminList.length > 0
    ? penjaminList.map(p => ({ label: p.label, value: p.label.toLowerCase().includes('bpjs') ? 'BPJS' : p.label.toLowerCase().includes('umum') ? 'Umum' : p.label.toLowerCase().includes('asuransi') ? 'Asuransi' : p.label }))
    : defaultPenjaminOptions;

  const formatPascalCase = (e: React.ChangeEvent<HTMLInputElement>) => {
    return e;
  };

  const { onChange: onKontakChange, ...kontakRest } = register('kontakDarurat');
  const { onChange: onHubunganChange, ...hubunganRest } = register('hubunganKontakDarurat');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Data Kontak & Penjamin</h2>
        <p className="text-sm text-gray-500 mt-1">Informasi yang dapat dihubungi dan metode pembiayaan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nomor Hp pasien *"
          placeholder="08xxxxxxxxxx"
          {...register('noHp')}
          error={errors.noHp?.message}
        />
        <Input
          label="Email (Opsional)"
          type="email"
          placeholder="email@contoh.com"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Kontak Darurat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nama Kontak Darurat *"
            placeholder="Nama keluarga/kerabat"
            {...kontakRest}
            onChange={(e) => onKontakChange(formatPascalCase(e))}
            error={errors.kontakDarurat?.message}
          />
          <Input
            label="Hubungan dengan Pasien *"
            placeholder="Misal: Ayah / Istri / Anak"
            {...hubunganRest}
            onChange={(e) => onHubunganChange(formatPascalCase(e))}
            error={errors.hubunganKontakDarurat?.message}
          />
          <Input
            label="Nomor HP Darurat *"
            placeholder="08xxxxxxxxxx"
            className="md:col-span-2"
            {...register('noHpDarurat')}
            error={errors.noHpDarurat?.message}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Informasi Pembayaran</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Jenis Pembayaran *"
            {...register('jenisPenjamin')}
            error={errors.jenisPenjamin?.message}
            options={penjaminOptions}
          />

          {jenisPenjamin === 'BPJS' && (
            <>
              <Input
                label="Nomor Kartu BPJS *"
                placeholder="13 digit angka"
                {...register('noBpjs')}
                error={errors.noBpjs?.message}
              />
              <Input
                label="Status Kepesertaan"
                placeholder="Misal: Aktif / Non Aktif"
                {...register('statusKepesertaan')}
                error={errors.statusKepesertaan?.message}
              />
              <Input
                label="Faskes Tingkat I"
                placeholder="Nama Faskes 1"
                {...register('faskesTingkat1')}
                error={errors.faskesTingkat1?.message}
              />
              <Select
                label="Kelas Rawat"
                {...register('kelasRawat')}
                error={errors.kelasRawat?.message}
                options={[
                  { label: 'Kelas 1', value: '1' },
                  { label: 'Kelas 2', value: '2' },
                  { label: 'Kelas 3', value: '3' },
                ]}
              />
              <Input
                label="Nomor SEP (Saat pelayanan)"
                placeholder="Otomatis atau manual"
                className="md:col-span-2"
                {...register('noSep')}
                error={errors.noSep?.message}
              />
            </>
          )}

          {jenisPenjamin === 'Asuransi' && (
            <>
              <Input
                label="Nama Asuransi *"
                placeholder="Contoh: Prudential, AIA..."
                {...register('namaAsuransi')}
                error={errors.namaAsuransi?.message}
              />
              <Input
                label="Nomor Polis *"
                placeholder="Nomor polis asuransi"
                {...register('nomorPolis')}
                error={errors.nomorPolis?.message}
              />
              <Input
                label="Masa Berlaku"
                type="date"
                {...register('masaBerlakuAsuransi')}
                error={errors.masaBerlakuAsuransi?.message}
              />
            </>
          )}

          {jenisPenjamin === 'Perusahaan' && (
            <Select
              label="Pilih Perusahaan Rekanan *"
              {...register('namaPerusahaan' as any)} // Using 'any' just in case schema is strictly typed and namaPerusahaan is nested
              options={
                isLoading 
                ? [{ label: 'Memuat...', value: '' }] 
                : [{ label: '-- Pilih Perusahaan --', value: '' }, ...perusahaanOptions]
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
