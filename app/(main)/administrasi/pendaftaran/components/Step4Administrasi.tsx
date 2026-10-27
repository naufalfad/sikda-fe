import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RegistrationFormData } from '../schema';
import { useKlinikStore } from '@/store/klinik.store';

import { referensiService, RefItem } from '@/services/referensi.service';
import ugdService, { BedUGD } from '@/services/ugd.service';

interface Step4Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  setValue?: UseFormSetValue<RegistrationFormData>;
}

export default function Step4Administrasi({ register, errors, watch, setValue }: Step4Props) {
  const caraDatang = watch('caraDatang');
  const poliTujuan = watch('poliTujuan');
  const jenisPelayanan = watch('jenisPelayanan');
  const { polikliniks, layanans, dokters, fetchPoliklinik, fetchLayananByPoli, fetchDokterByPoli, isLoadingDokter } = useKlinikStore();

  const [caraDatangList, setCaraDatangList] = React.useState<RefItem[]>([]);
  const [jenisPelayananList, setJenisPelayananList] = React.useState<RefItem[]>([]);
  const [prioritasList, setPrioritasList] = React.useState<RefItem[]>([]);
  const [bedUgdList, setBedUgdList] = React.useState<BedUGD[]>([]);

  useEffect(() => {
    referensiService.getByType('cara-datang').then(data => data && data.length > 0 && setCaraDatangList(data)).catch(() => { });
    referensiService.getByType('jenis-pelayanan').then(data => data && data.length > 0 && setJenisPelayananList(data)).catch(() => { });
    referensiService.getByType('prioritas').then(data => data && data.length > 0 && setPrioritasList(data)).catch(() => { });

    // Ambil Bed UGD
    ugdService.getBeds().then(beds => {
      setBedUgdList(beds || []);
    }).catch(() => { });
  }, []);

  const defaultCaraDatang = [
    { label: 'Datang sendiri', value: 'Datang sendiri' },
    { label: 'Ambulans', value: 'Ambulans' },
    { label: 'Rujukan', value: 'Rujukan' },
  ];
  const caraDatangOptions = caraDatangList.length > 0
    ? caraDatangList.map(c => ({ label: c.label, value: c.label }))
    : defaultCaraDatang;

  const defaultJenisPelayanan = [
    { label: 'Rawat Jalan (Puskesmas FKTP)', value: 'Rawat Jalan' },
    { label: 'UGD / Gawat Darurat (Emergency)', value: 'UGD' },
  ];
  const jenisPelayananOptions = defaultJenisPelayanan;

  const defaultPrioritas = [
    { label: 'Umum', value: 'Umum' },
    { label: 'Lansia', value: 'Lansia' },
    { label: 'Disabilitas', value: 'Disabilitas' },
    { label: 'Ibu Hamil', value: 'Ibu Hamil' },
  ];
  const prioritasOptions = prioritasList.length > 0
    ? prioritasList.map(p => ({ label: p.label, value: p.label.split(' ')[0] }))
    : defaultPrioritas;

  const formatPascalCase = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    return e;
  };

  const { onChange: onAsalRujukanChange, ...asalRujukanRest } = register('asalRujukan');
  const { onChange: onFasilitasChange, ...fasilitasRest } = register('fasilitasPerujuk');
  const { onChange: onDiagnosaChange, ...diagnosaRest } = register('diagnosaAwal');

  useEffect(() => {
    fetchPoliklinik();
  }, [fetchPoliklinik]);

  useEffect(() => {
    if (poliTujuan) {
      fetchLayananByPoli(poliTujuan);
      fetchDokterByPoli(poliTujuan);
    }
  }, [poliTujuan, fetchLayananByPoli, fetchDokterByPoli]);

  // Hanya tampilkan poli reguler Rawat Jalan (hindari poli UGD dan INAP)
  const filteredPolikliniks = polikliniks.filter(p => p.kodePoli !== 'UGD' && p.kodePoli !== 'INAP');

  useEffect(() => {
    const currentPoli = polikliniks.find(p => p.id === poliTujuan);
    if (currentPoli && (currentPoli.kodePoli === 'UGD' || currentPoli.kodePoli === 'INAP')) {
      if (setValue) setValue('poliTujuan', '');
    }
  }, [polikliniks, setValue, poliTujuan]);

  // Set current date & time on mount for Tanggal & Jam Registrasi
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // Format HH:MM

  // Default field values on mount
  useEffect(() => {
    if (!watch('jenisPelayanan') && setValue) {
      setValue('jenisPelayanan', 'Rawat Jalan');
    }
    if (!watch('caraDatang') && setValue) {
      setValue('caraDatang', 'Datang sendiri');
    }
    if (!watch('prioritas') && setValue) {
      setValue('prioritas', 'Umum');
    }
    if (!watch('tanggalRegistrasi') && setValue) {
      setValue('tanggalRegistrasi', today);
    }
    if (!watch('jamRegistrasi') && setValue) {
      setValue('jamRegistrasi', currentTime);
    }
  }, [setValue, watch, today, currentTime]);

  // Auto-select dokter jika poli dipilih dan dokter tersedia
  useEffect(() => {
    if (poliTujuan && dokters[poliTujuan] && dokters[poliTujuan].length > 0 && setValue) {
      const currentDokter = watch('dokterTujuan');
      const isValid = dokters[poliTujuan].some(d => d.id === currentDokter);
      if (!currentDokter || !isValid || currentDokter === 'Bebas') {
        setValue('dokterTujuan', dokters[poliTujuan][0].id, { shouldValidate: true });
      }
    }
  }, [poliTujuan, dokters, setValue, watch]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Data Administrasi Medis</h2>
        <p className="text-sm text-gray-500 mt-1">Tujuan pelayanan, dokter, dan penentuan antrian.</p>
      </div>

      {watch('noAntrian') && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓ Terhubung dengan Antrean Online / Booking:</span>
            <span className="bg-emerald-600 text-white font-mono px-2 py-0.5 font-bold">{watch('noAntrian')}</span>
          </div>
          <span className="text-emerald-700 italic">Poli & dokter tujuan terisi otomatis</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Tanggal Registrasi *"
          type="date"
          {...register('tanggalRegistrasi')}
          error={errors.tanggalRegistrasi?.message}
        />
        <Input
          label="Jam Registrasi *"
          type="time"
          {...register('jamRegistrasi')}
          error={errors.jamRegistrasi?.message}
        />

        <Select
          label="Cara Datang *"
          {...register('caraDatang')}
          error={errors.caraDatang?.message}
          options={caraDatangOptions}
        />

        <Select
          label="Jenis Pelayanan *"
          {...register('jenisPelayanan')}
          error={errors.jenisPelayanan?.message}
          options={jenisPelayananOptions}
        />

        {jenisPelayanan === 'UGD' ? (
          <>
            <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
              <span className="font-bold text-red-600 uppercase tracking-wider">Layanan UGD:</span>
              <span>Pasien Gawat Darurat langsung dialokasikan ke Bed UGD tanpa harus memilih poliklinik rawat jalan. Antrean EMG-XXX akan dibuat secara otomatis dan ditangani oleh Dokter UGD.</span>
            </div>

            <Select
              label="Alokasi Tempat Tidur UGD *"
              {...register('tempatTidurId')}
              error={errors.tempatTidurId?.message}
              options={[
                { label: '-- Pilih Bed UGD Tersedia --', value: '' },
                ...bedUgdList
                  .filter(b => b.statusBed === 'TERSEDIA')
                  .map(b => ({
                    label: `${b.nomorBed} (${b.ruangan?.namaRuangan || 'UGD'})`,
                    value: b.id
                  }))
              ]}
            />

            <Select
              label="Kategori Triase Awal *"
              {...register('triase')}
              error={errors.triase?.message}
              options={[
                { label: 'MERAH - Kritis / Resusitasi', value: 'MERAH' },
                { label: 'KUNING - Urgent / Gawat Tidak Darurat', value: 'KUNING' },
                { label: 'HIJAU - Non-Urgent / Tidak Gawat', value: 'HIJAU' },
                { label: 'HITAM - Meninggal Dunia (DOA)', value: 'HITAM' }
              ]}
            />
          </>
        ) : (
          <>
            <Select
              label="Poli/Unit Tujuan *"
              {...register('poliTujuan')}
              error={errors.poliTujuan?.message}
              options={[
                { label: '-- Pilih Unit/Poli --', value: '' },
                ...filteredPolikliniks.map(p => ({ label: p.namaPoli, value: p.id }))
              ]}
            />

            <div>
              <Select
                label="Dokter Tujuan *"
                {...register('dokterTujuan')}
                error={errors.dokterTujuan?.message}
                disabled={!poliTujuan || isLoadingDokter}
                options={[
                  { label: isLoadingDokter ? 'Memuat Dokter...' : (poliTujuan ? '-- Pilih Dokter Bertugas * --' : '-- Pilih Poli Terlebih Dahulu --'), value: '' },
                  ...(poliTujuan && dokters[poliTujuan] ? dokters[poliTujuan].map(d => ({ label: d.namaLengkap || d.username, value: d.id })) : [])
                ]}
              />
              {poliTujuan && (!dokters[poliTujuan] || dokters[poliTujuan].length === 0) && !isLoadingDokter && (
                <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                  Belum ada dokter yang bertugas di poli/unit ini.
                </p>
              )}
            </div>
          </>
        )}

        <Select
          label="Prioritas Pasien *"
          {...register('prioritas')}
          error={errors.prioritas?.message}
          options={prioritasOptions}
        />
      </div>

      {caraDatang === 'Rujukan' && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Data Rujukan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Asal Rujukan" placeholder="Nama faskes perujuk" {...asalRujukanRest} onChange={(e) => onAsalRujukanChange(formatPascalCase(e))} />
            <Input label="Nomor Rujukan" placeholder="Nomor surat rujukan" {...register('noRujukan')} />
            <Input label="Tanggal Rujukan" type="date" {...register('tanggalRujukan')} />
            <Input label="Fasilitas Perujuk" placeholder="Misal: Puskesmas / RSUD" {...fasilitasRest} onChange={(e) => onFasilitasChange(formatPascalCase(e))} />
            <Input label="Diagnosa Awal" placeholder="Diagnosa dokter sebelumnya" className="md:col-span-2" {...diagnosaRest} onChange={(e) => onDiagnosaChange(formatPascalCase(e))} />
            <Select
              label="Jenis Rujukan"
              {...register('jenisRujukan')}
              options={[
                { label: 'Parsial', value: 'Parsial' },
                { label: 'Penuh', value: 'Penuh' }
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
