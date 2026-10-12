"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Syringe, 
  ClipboardList, 
  CheckCircle2, 
  Search, 
  Loader2, 
  ArrowLeft, 
  Printer, 
  BedDouble, 
  Building, 
  Layers, 
  AlertCircle,
  ThermometerSnowflake,
  ShieldCheck,
  Check,
  Clock,
  Plus,
  Info,
  Calendar
} from 'lucide-react';
import { useRawatJalanStore } from '@/store/rawatJalan.store';
import { asetRuanganService } from '@/services/asetRuangan.service';
import { imunisasiService, VaksinItem, BatchVaksinItem } from '@/services/imunisasi.service';
import Swal from 'sweetalert2';

const LOKASI_SUNTIK_OPTIONS = [
  'Deltoid Kanan',
  'Deltoid Kiri',
  'Paha Anterolateral Kanan',
  'Paha Anterolateral Kiri',
  'Lengan Atas Kanan',
  'Lengan Atas Kiri',
  'Gluteal / Pantat',
  'Oral / Mulut'
];

const RUTE_SUNTIK_OPTIONS = [
  'Intramuskular (IM)',
  'Subkutan (SC)',
  'Intrakutan (IC)',
  'Oral'
];

const DOSIS_KE_OPTIONS = [
  { value: 1, label: 'Dosis 1 (Primer 1)' },
  { value: 2, label: 'Dosis 2 (Primer 2)' },
  { value: 3, label: 'Dosis 3 (Primer 3)' },
  { value: 4, label: 'Dosis 4 (Booster 1)' },
  { value: 5, label: 'Dosis 5 (Booster 2)' }
];

export default function DischargePlanning() {
  const {
    selectedKunjungan, rekamMedis, diagnosaList, setFase,
    simpanRujukan, assignRawatInap, pulang, catatMeninggal
  } = useRawatJalanStore();

  const isUgd = selectedKunjungan?.jenisPelayanan === 'UGD' || 
                selectedKunjungan?.poliklinik?.namaPoli?.toUpperCase().includes('UGD') || 
                selectedKunjungan?.poliklinik?.namaPoli?.toUpperCase().includes('IGD');
  const ugdBed = (selectedKunjungan as any)?.tempatTidurs?.[0];

  const [activeMenu, setActiveMenu] = useState<'HOME' | 'VAKSIN' | 'RUJUKAN' | 'RAWAT_INAP'>('HOME');

  // ==========================================
  // VAKSIN & IMUNISASI STATE
  // ==========================================
  const [vaksinList, setVaksinList] = useState<any[]>([]);
  const [isLoadingVaksin, setIsLoadingVaksin] = useState(false);
  const [searchVaksin, setSearchVaksin] = useState('');
  const [selectedVaksin, setSelectedVaksin] = useState<any | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isSubmittingVaksin, setIsSubmittingVaksin] = useState(false);
  const [riwayatVaksin, setRiwayatVaksin] = useState<any[]>([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);

  const [vaksinForm, setVaksinForm] = useState({
    dosisKe: 1,
    dosisJumlah: '0.5',
    lokasiSuntik: 'Deltoid Kanan',
    ruteSuntik: 'Intramuskular (IM)',
    catatan: ''
  });

  // ==========================================
  // RAWAT INAP STATE
  // ==========================================
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [isLoadingBeds, setIsLoadingBeds] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [rawatInapForm, setRawatInapForm] = useState({
    alasanRawatInap: '',
    instruksiMedis: '',
  });

  // ==========================================
  // RUJUKAN STATE
  // ==========================================
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  const [rujukanData, setRujukanData] = useState({
    tujuanDokter: '',
    tujuanPoli: '',
    tujuanRS: '',
    namaPasien: selectedKunjungan?.pasien?.namaLengkap || '',
    umur: selectedKunjungan?.pasien?.tanggalLahir ? getAge(selectedKunjungan.pasien.tanggalLahir).toString() : '',
    jenisKelamin: selectedKunjungan?.pasien?.jenisKelamin || 'Laki-laki',
    alamat: (selectedKunjungan?.pasien as any)?.alamat || '',
    anamnesa: rekamMedis ? `${rekamMedis.keluhanUtama || ''}\n${rekamMedis.riwayatPenyakitSekarang || ''}`.trim() : '',
    pemeriksaanFisik: rekamMedis?.pemeriksaanFisik || '',
    diagnosaSementara: diagnosaList ? diagnosaList.map(d => `${d.icd10.kode_icd10} - ${d.icd10.nama_diagnosis}`).join(', ') : '',
    terapi: rekamMedis?.rencanaTerapi || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedKunjungan) return null;

  // -------------------------------------------------------------
  // VAKSIN LOGIC & HANDLERS
  // -------------------------------------------------------------
  const fetchVaksin = async () => {
    setIsLoadingVaksin(true);
    try {
      const faskesId = selectedKunjungan?.poliklinik?.faskesId || (selectedKunjungan as any)?.faskesId;
      const res = await imunisasiService.getMasterVaksin(faskesId);
      const list = res.data || res || [];
      setVaksinList(list);
      if (list.length > 0 && !selectedVaksin) {
        handleSelectVaksin(list[0]);
      }
    } catch (err) {
      console.error('Failed to load master vaksin:', err);
    } finally {
      setIsLoadingVaksin(false);
    }
  };

  const fetchRiwayatPasien = async () => {
    if (!selectedKunjungan?.pasienId) return;
    setIsLoadingRiwayat(true);
    try {
      const res = await imunisasiService.getRiwayatPasien(selectedKunjungan.pasienId);
      setRiwayatVaksin(res.data || res || []);
    } catch (err) {
      console.error('Failed to load patient immunization history:', err);
    } finally {
      setIsLoadingRiwayat(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'VAKSIN') {
      fetchVaksin();
      fetchRiwayatPasien();
    }
  }, [activeMenu]);

  const handleSelectVaksin = (v: any) => {
    setSelectedVaksin(v);
    const availableBatches = (v.batchVaksin || []).filter((b: any) => b.stok > 0);
    if (availableBatches.length > 0) {
      setSelectedBatchId(availableBatches[0].id);
    } else {
      setSelectedBatchId('');
    }

    // Default dosis & rute berdasarkan jenis sediaan vaksin
    const namaLower = (v.namaVaksin || '').toLowerCase();
    let defaultRute = 'Intramuskular (IM)';
    let defaultLokasi = 'Deltoid Kanan';
    let defaultDosisJumlah = '0.5';

    if (namaLower.includes('polio oral') || namaLower.includes('bopv') || namaLower.includes('rotavirus')) {
      defaultRute = 'Oral';
      defaultLokasi = 'Oral / Mulut';
      defaultDosisJumlah = '2'; // 2 tetes
    } else if (namaLower.includes('bcg')) {
      defaultRute = 'Intrakutan (IC)';
      defaultLokasi = 'Deltoid Kanan';
      defaultDosisJumlah = '0.05';
    } else if (namaLower.includes('campak') || namaLower.includes('rubella') || namaLower.includes('mr')) {
      defaultRute = 'Subkutan (SC)';
      defaultLokasi = 'Deltoid Kiri';
      defaultDosisJumlah = '0.5';
    } else if (namaLower.includes('dpt') || namaLower.includes('pentabio') || namaLower.includes('hepatitis')) {
      defaultRute = 'Intramuskular (IM)';
      defaultLokasi = 'Paha Anterolateral Kanan';
      defaultDosisJumlah = '0.5';
    }

    // Hitung riwayat dosis ke untuk jenis vaksin ini
    const pastVaksinCount = riwayatVaksin.filter(r => 
      r.batchVaksin?.vaksinId === v.id || 
      (r.batchVaksin?.vaksin?.namaVaksin && r.batchVaksin.vaksin.namaVaksin.toLowerCase() === namaLower)
    ).length;

    setVaksinForm(prev => ({
      ...prev,
      dosisKe: pastVaksinCount + 1,
      dosisJumlah: defaultDosisJumlah,
      lokasiSuntik: defaultLokasi,
      ruteSuntik: defaultRute,
      catatan: ''
    }));
  };

  const submitVaksin = async () => {
    if (!selectedVaksin) {
      Swal.fire('Pilih Vaksin', 'Silakan pilih sediaan vaksin terlebih dahulu.', 'warning');
      return;
    }
    if (!selectedBatchId) {
      Swal.fire('Pilih Batch', 'Silakan pilih nomor batch vaksin cold-chain yang tersedia.', 'warning');
      return;
    }
    if (!vaksinForm.lokasiSuntik || !vaksinForm.ruteSuntik) {
      Swal.fire('Incomplete', 'Lokasi dan rute penyuntikan wajib diisi.', 'warning');
      return;
    }

    const batch = (selectedVaksin.batchVaksin || []).find((b: any) => b.id === selectedBatchId);
    if (batch && batch.stok <= 0) {
      Swal.fire('Stok Kosong', `Stok batch ${batch.noBatch} sudah habis.`, 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Konfirmasi Penyuntikan Vaksin',
      html: `
        <div class="text-left text-sm space-y-1.5 p-2 bg-gray-50 border border-gray-200">
          <p><strong>Vaksin:</strong> ${selectedVaksin.namaVaksin}</p>
          <p><strong>Batch:</strong> <span class="font-mono">${batch?.noBatch || '-'}</span> (ED: ${batch?.tanggalExpired ? new Date(batch.tanggalExpired).toLocaleDateString('id-ID') : '-'})</p>
          <p><strong>Dosis:</strong> Ke-${vaksinForm.dosisKe} (${vaksinForm.dosisJumlah} ${vaksinForm.ruteSuntik === 'Oral' ? 'tetes' : 'mL'})</p>
          <p><strong>Rute & Lokasi:</strong> ${vaksinForm.ruteSuntik} • ${vaksinForm.lokasiSuntik}</p>
          <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-teal-800 font-semibold">
            ✓ 1 vial dipotong dari Cold-Chain<br/>
            ✓ Layanan vaksinasi (Rp 25.000) otomatis masuk ke kasir
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Suntik & Catat Imunisasi',
      confirmButtonColor: '#0d9488',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsSubmittingVaksin(true);
    try {
      await imunisasiService.catatRiwayat({
        pasienId: selectedKunjungan.pasienId,
        kunjunganId: selectedKunjungan.id,
        batchVaksinId: selectedBatchId,
        dosisKe: Number(vaksinForm.dosisKe) || 1,
        dosisJumlah: parseFloat(vaksinForm.dosisJumlah) || 0.5,
        lokasiSuntik: vaksinForm.lokasiSuntik,
        ruteSuntik: vaksinForm.ruteSuntik,
        catatan: vaksinForm.catatan || '',
        isRiwayatLuar: false
      });

      await Swal.fire({
        icon: 'success',
        title: 'Vaksinasi Berhasil Dicatat!',
        text: `Pemberian ${selectedVaksin.namaVaksin} telah dicatat. Stok Cold-Chain terpotong dan rincian kasir telah diperbarui.`,
        timer: 2500,
        showConfirmButton: false
      });

      // Refresh master list & riwayat
      await Promise.all([fetchVaksin(), fetchRiwayatPasien()]);
    } catch (err: any) {
      console.error('Error saat mencatat imunisasi:', err);
      Swal.fire('Gagal', err?.response?.data?.message || err?.message || 'Gagal mencatat pemberian vaksin', 'error');
    } finally {
      setIsSubmittingVaksin(false);
    }
  };

  const filteredVaksin = useMemo(() => {
    if (!searchVaksin.trim()) return vaksinList;
    const q = searchVaksin.toLowerCase();
    return vaksinList.filter(v => 
      v.namaVaksin?.toLowerCase().includes(q) ||
      v.targetPenyakit?.toLowerCase().includes(q) ||
      v.kodeKfa?.toLowerCase().includes(q)
    );
  }, [vaksinList, searchVaksin]);

  const riwayatKunjunganIni = useMemo(() => {
    return riwayatVaksin.filter(r => r.kunjunganId === selectedKunjungan?.id);
  }, [riwayatVaksin, selectedKunjungan?.id]);

  // -------------------------------------------------------------
  // RUJUKAN & RAWAT INAP LOGIC
  // -------------------------------------------------------------
  const submitRujukan = async () => {
    if (!rujukanData.tujuanRS || !rujukanData.tujuanPoli) {
      Swal.fire('Incomplete', 'Faskes Tujuan dan Poli Tujuan wajib diisi', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await simpanRujukan({
        faskesTujuan: rujukanData.tujuanRS,
        poliTujuan: rujukanData.tujuanPoli,
        dokterTujuan: rujukanData.tujuanDokter,
        alasanRujukan: rujukanData.anamnesa + '\n' + rujukanData.diagnosaSementara,
      });

      Swal.fire({ 
        icon: 'success', 
        title: 'Berhasil', 
        text: 'Rujukan berhasil disimpan. Pasien silakan menuju loket administrasi untuk cetak surat rujukan.', 
        timer: 3000, 
        showConfirmButton: false 
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Gagal menyimpan data rujukan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAvailableBeds = async () => {
    setIsLoadingBeds(true);
    try {
      const beds = await asetRuanganService.getBeds({ statusBed: 'TERSEDIA' });
      setAvailableBeds(beds || []);
      if (beds && beds.length > 0 && !selectedBedId) {
        setSelectedBedId(beds[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch beds', error);
    } finally {
      setIsLoadingBeds(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'RAWAT_INAP') {
      fetchAvailableBeds();
      if (!rawatInapForm.alasanRawatInap && rekamMedis) {
        setRawatInapForm(prev => ({
          ...prev,
          alasanRawatInap: `Indikasi rawat inap: ${rekamMedis.keluhanUtama || ''} ${diagnosaList?.length ? '- ' + diagnosaList.map(d => `${d.icd10.kode_icd10} ${d.icd10.nama_diagnosis}`).join(', ') : ''}`.trim(),
          instruksiMedis: rekamMedis.rencanaTerapi || ''
        }));
      }
    }
  }, [activeMenu]);

  const submitRawatInap = async () => {
    if (!selectedBedId) {
      Swal.fire('Pilih Tempat Tidur', 'Silakan pilih kamar dan tempat tidur yang tersedia terlebih dahulu.', 'warning');
      return;
    }

    const bed = availableBeds.find(b => b.id === selectedBedId);
    const confirm = await Swal.fire({
      title: 'Konfirmasi Rawat Inap',
      text: `Pasien akan dialihkan ke ${bed?.ruangan?.namaRuangan || 'Ruang Inap'} - Bed ${bed?.nomorBed || ''}. Lanjutkan?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Masukkan Rawat Inap',
      confirmButtonColor: '#0d9488',
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    try {
      await assignRawatInap({
        tempatTidurId: selectedBedId,
        alasanRawatInap: rawatInapForm.alasanRawatInap,
        instruksiMedis: rawatInapForm.instruksiMedis,
      });

      Swal.fire({
        icon: 'success',
        title: 'Pasien Berhasil Masuk Rawat Inap',
        text: `Pasien telah dialihkan ke ${bed?.ruangan?.namaRuangan || 'Ruangan'} - Bed ${bed?.nomorBed}. Status tagihan kasir ditahan sementara hingga masa rawat inap selesai.`,
        timer: 4000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err?.response?.data?.message || 'Gagal mengalihkan pasien ke rawat inap', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePulang = async () => {
    const confirm = await Swal.fire({
      title: 'Akhiri Kunjungan?',
      text: "Pasien akan dialihkan ke antrean Kasir & Farmasi untuk penyelesaian administrasi dan pembayaran.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan & Pulangkan',
      confirmButtonColor: '#059669',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      setIsSubmitting(true);
      try {
        await pulang();
        Swal.fire({ 
          icon: 'success', 
          title: 'Kunjungan Selesai!', 
          text: 'Pasien telah dipulangkan dan diteruskan ke loket Kasir & Farmasi.', 
          timer: 2000, 
          showConfirmButton: false 
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleMeninggal = async () => {
    const { value: catatan, isConfirmed } = await Swal.fire({
      title: 'Pernyataan Meninggal Dunia',
      text: 'Pasien dinyatakan meninggal dunia di UGD (DOA / Henti Jantung-Napas Tidak Tertolong). Masukkan resume kematian / waktu kematian:',
      input: 'textarea',
      inputPlaceholder: 'Contoh: Pasien dinyatakan meninggal pukul 10:15 WIB setelah dilakukan RJP 3 siklus. Asistol pada monitor EKG.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Konfirmasi Meninggal Dunia',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Batal'
    });

    if (isConfirmed) {
      setIsSubmitting(true);
      try {
        await catatMeninggal(catatan);
        await Swal.fire({
          icon: 'success',
          title: 'Status Pasien Disimpan',
          text: 'Status pasien dicatat meninggal dunia. Tempat tidur UGD telah otomatis dibebaskan menjadi TERSEDIA.',
          timer: 2500,
          showConfirmButton: false
        });
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', err?.response?.data?.message || 'Gagal mencatat status meninggal', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // -------------------------------------------------------------
  // RENDER: HOME MENU (4 PILIHAN SEJAJAR)
  // -------------------------------------------------------------
  if (activeMenu === 'HOME') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 h-full">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            {isUgd && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Discharge Planning & Keputusan UGD
              </div>
            )}
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              {isUgd ? 'Keputusan Tindak Lanjut Pasien UGD' : 'Tindak Lanjut Pasien'}
            </h2>
            <p className="text-gray-500">
              Pemeriksaan medis {isUgd ? 'kegawatdaruratan' : ''} selesai. Pilih tindakan selanjutnya untuk{' '}
              <strong className="text-gray-800">{selectedKunjungan.pasien.namaLengkap}</strong>
              {ugdBed ? ` (${ugdBed.ruangan?.namaRuangan || 'IGD'} - ${ugdBed.nomorBed})` : ''}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isUgd ? (
              <>
                {/* 1. UGD: Pasien Pulang / Selesai */}
                <button 
                  onClick={handlePulang}
                  disabled={isSubmitting}
                  className="bg-white border border-emerald-200 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-emerald-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Kondisi Stabil
                  </div>
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Boleh Pulang (Stabil)</h3>
                  <p className="text-xs text-gray-500">Kondisi gawat darurat teratasi, pasien boleh pulang. Tempat tidur UGD otomatis dibebaskan.</p>
                </button>

                {/* 2. UGD: Rawat Inap Puskesmas */}
                <button 
                  onClick={() => setActiveMenu('RAWAT_INAP')}
                  className="bg-white border border-teal-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-teal-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Observasi Inap
                  </div>
                  <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <BedDouble className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Pindah Rawat Inap</h3>
                  <p className="text-xs text-gray-500">Pindahkan ke bangsal rawat inap puskesmas dan pilih bed inap. Bed UGD otomatis dibebaskan.</p>
                </button>

                {/* 3. UGD: Rujuk ke RS */}
                <button 
                  onClick={() => setActiveMenu('RUJUKAN')}
                  className="bg-white border border-indigo-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-indigo-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Emergency Referral
                  </div>
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Rujuk ke Rumah Sakit</h3>
                  <p className="text-xs text-gray-500">Rujuk pasien gawat darurat ke fasilitas tingkat lanjutan (RS Rujukan). Bed UGD dibebaskan.</p>
                </button>

                {/* 4. UGD: Pasien Meninggal */}
                <button 
                  onClick={handleMeninggal}
                  disabled={isSubmitting}
                  className="bg-white border border-red-200 hover:border-red-600 hover:ring-1 hover:ring-red-600 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-red-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Kematian UGD
                  </div>
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-red-600 mb-1">Pasien Meninggal Dunia</h3>
                  <p className="text-xs text-gray-500">Catat kematian (DOA / resusitasi gagal). Rekam medis selesai dan bed UGD otomatis dibebaskan.</p>
                </button>
              </>
            ) : (
              <>
                {/* 1. Pemberian Vaksin */}
                <button 
                  onClick={() => setActiveMenu('VAKSIN')}
                  className="bg-white border border-teal-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-teal-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Cold-Chain
                  </div>
                  <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Syringe className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Pemberian Vaksin</h3>
                  <p className="text-xs text-gray-500">Pemberian vaksin cold-chain dan pencatatan riwayat imunisasi pasien.</p>
                </button>

                {/* 2. Rawat Inap Puskesmas */}
                <button 
                  onClick={() => setActiveMenu('RAWAT_INAP')}
                  className="bg-white border border-teal-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-teal-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Internal
                  </div>
                  <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <BedDouble className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Rawat Inap Puskesmas</h3>
                  <p className="text-xs text-gray-500">Assign pasien ke kamar & bed rawat inap yang tersedia.</p>
                </button>

                {/* 3. Buat Rujukan */}
                <button 
                  onClick={() => setActiveMenu('RUJUKAN')}
                  className="bg-white border border-gray-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-indigo-600 text-[10px] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    Eksternal
                  </div>
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Rujuk ke Luar Faskes</h3>
                  <p className="text-xs text-gray-500">Rujuk pasien ke Rumah Sakit / Faskes tingkat lanjutan.</p>
                </button>

                {/* 4. Pulang */}
                <button 
                  onClick={handlePulang}
                  disabled={isSubmitting}
                  className="bg-white border border-gray-200 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 p-6 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-none flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Pasien Pulang</h3>
                  <p className="text-xs text-gray-500">Akhiri kunjungan. Pasien menyelesaikan pembayaran kasir dan pengambilan obat di farmasi.</p>
                </button>
              </>
            )}
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setFase(1)}
              className="text-gray-400 hover:text-gray-700 font-medium text-sm flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Rekam Medis (Batal Selesai)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: VAKSINASI / IMUNISASI (COLD-CHAIN)
  // -------------------------------------------------------------
  if (activeMenu === 'VAKSIN') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 h-full w-full">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveMenu('HOME')} 
              className="p-2 hover:bg-gray-100 rounded-none text-gray-500 transition-colors"
              title="Kembali ke Menu Pilihan"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Syringe className="w-5 h-5 text-teal-600" />
                Pemberian Vaksin & Imunisasi (Cold-Chain)
              </h2>
              <p className="text-xs text-gray-500">
                Pilih sediaan vaksin dan catat administrasi suntikan untuk{' '}
                <strong className="text-gray-800">{selectedKunjungan.pasien.namaLengkap}</strong> ({selectedKunjungan.pasien.noRM})
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePulang}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none transition-colors shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesai & Pulangkan Pasien ➔
            </button>
          </div>
        </div>

        {/* Content Body: Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* KOLOM KIRI: KATALOG SEDIAAN VAKSIN COLD-CHAIN */}
          <div className="w-full lg:w-5/12 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden">
            {/* Search & Info Banner */}
            <div className="p-4 border-b border-gray-200 bg-slate-50 space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari vaksin (nama, target penyakit, KFA)..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-none focus:ring-1 focus:ring-teal-500 text-xs text-gray-900"
                  value={searchVaksin}
                  onChange={e => setSearchVaksin(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-3 py-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
                  Kulkas Cold-Chain Puskesmas (2°C – 8°C)
                </span>
                <span className="font-semibold text-teal-700">
                  {filteredVaksin.length} Sediaan Aktif
                </span>
              </div>
            </div>

            {/* List Vaksin */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingVaksin ? (
                <div className="py-20 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
                  <p className="text-xs font-semibold">Memuat katalog vaksin cold-chain...</p>
                </div>
              ) : filteredVaksin.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Syringe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">Tidak ada vaksin yang cocok</p>
                  <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci pencarian yang berbeda.</p>
                </div>
              ) : (
                filteredVaksin.map((vaksin) => {
                  const isSelected = selectedVaksin?.id === vaksin.id;
                  const totalStok = (vaksin.batchVaksin || []).reduce((acc: number, b: any) => acc + (b.stok || 0), 0);
                  const prioritasBatch = (vaksin.batchVaksin || []).find((b: any) => b.stok > 0);

                  return (
                    <div
                      key={vaksin.id}
                      onClick={() => handleSelectVaksin(vaksin)}
                      className={`p-3.5 border transition-all cursor-pointer rounded-none relative ${
                        isSelected 
                          ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-1 ring-teal-500' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight pr-4">
                          {vaksin.namaVaksin}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-wider rounded-none ${
                          totalStok > 10 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : totalStok > 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {totalStok > 0 ? `${totalStok} Vial` : 'Stok Habis'}
                        </span>
                      </div>

                      <div className="text-xs text-teal-700 font-medium mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        Target: {vaksin.targetPenyakit || 'Pencegahan Infeksi'}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Kode KFA: <strong className="font-mono text-gray-700">{vaksin.kodeKfa || '-'}</strong></span>
                        {prioritasBatch && (
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            Batch: {prioritasBatch.noBatch}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN: FORM PENYUNTIKAN & RIWAYAT SESI INI */}
          <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-y-auto p-6 space-y-6">
            {/* CARD 1: FORMULIR PENYUNTIKAN VAKSIN */}
            <div className="bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-teal-600" />
                    Formulir Pemberian Vaksinasi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pastikan batch cold-chain dan dosis sesuai standar prosedur operasional imunisasi.
                  </p>
                </div>
                {selectedVaksin && (
                  <span className="bg-teal-100 text-teal-800 font-bold text-xs px-2.5 py-1">
                    {selectedVaksin.namaVaksin}
                  </span>
                )}
              </div>

              {!selectedVaksin ? (
                <div className="py-12 text-center text-gray-400">
                  <Syringe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold">Silakan pilih sediaan vaksin di panel sebelah kiri.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pilihan Batch Vaksin */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Pilih Nomor Batch Cold-Chain (FEFO) *</span>
                      <span className="text-[11px] text-teal-600 font-semibold">
                        Suhu: {selectedVaksin.batchVaksin?.[0]?.suhuPenyimpanan || '2-8°C'}
                      </span>
                    </label>

                    {(!selectedVaksin.batchVaksin || selectedVaksin.batchVaksin.length === 0) ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        Belum ada stok batch vaksin yang tercatat di gudang/kulkas faskes ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedVaksin.batchVaksin.map((batch: any) => {
                          const isBatchSelected = selectedBatchId === batch.id;
                          const isExpired = new Date(batch.tanggalExpired) < new Date();
                          const isOut = batch.stok <= 0;
                          const isDisabled = isExpired || isOut;

                          return (
                            <div
                              key={batch.id}
                              onClick={() => !isDisabled && setSelectedBatchId(batch.id)}
                              className={`p-3 border rounded-none text-xs transition-all ${
                                isDisabled 
                                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                                  : isBatchSelected 
                                    ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-500 cursor-pointer' 
                                    : 'bg-white border-gray-300 hover:border-gray-400 cursor-pointer'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-bold text-gray-900">{batch.noBatch}</span>
                                <span className={`font-bold text-[10px] px-1.5 py-0.5 ${
                                  batch.stok > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  Stok: {batch.stok} Vial
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 flex justify-between">
                                <span>ED: {new Date(batch.tanggalExpired).toLocaleDateString('id-ID')}</span>
                                {isBatchSelected && <span className="text-teal-700 font-bold">✓ Terpilih</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Grid Input: Dosis, Rute, Lokasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Dosis Ke */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Dosis Ke- *
                      </label>
                      <select
                        value={vaksinForm.dosisKe}
                        onChange={e => setVaksinForm({ ...vaksinForm, dosisKe: parseInt(e.target.value) || 1 })}
                        className="w-full p-2 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900"
                      >
                        {DOSIS_KE_OPTIONS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dosis Jumlah (mL / tetes) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Volume Dosis ({vaksinForm.ruteSuntik === 'Oral' ? 'Tetes' : 'mL'}) *
                      </label>
                      <input
                        type="text"
                        value={vaksinForm.dosisJumlah}
                        onChange={e => setVaksinForm({ ...vaksinForm, dosisJumlah: e.target.value })}
                        placeholder="Contoh: 0.5 atau 2"
                        className="w-full p-2 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900"
                      />
                    </div>

                    {/* Rute Suntik */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Rute Administrasi *
                      </label>
                      <select
                        value={vaksinForm.ruteSuntik}
                        onChange={e => setVaksinForm({ ...vaksinForm, ruteSuntik: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900"
                      >
                        {RUTE_SUNTIK_OPTIONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Lokasi Suntik & Catatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Lokasi Anatomi Penyuntikan *
                      </label>
                      <select
                        value={vaksinForm.lokasiSuntik}
                        onChange={e => setVaksinForm({ ...vaksinForm, lokasiSuntik: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900"
                      >
                        {LOKASI_SUNTIK_OPTIONS.map(lok => (
                          <option key={lok} value={lok}>{lok}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Catatan Khusus / Observasi KIPI
                      </label>
                      <input
                        type="text"
                        value={vaksinForm.catatan}
                        onChange={e => setVaksinForm({ ...vaksinForm, catatan: e.target.value })}
                        placeholder="Misal: Spuit ADS 0.5 mL, tidak ada kontraindikasi..."
                        className="w-full p-2 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Tombol Simpan Vaksinasi */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={submitVaksin}
                      disabled={isSubmittingVaksin || !selectedBatchId}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-none shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmittingVaksin ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses Penyuntikan & Sinkronisasi Kasir...
                        </>
                      ) : (
                        <>
                          <Syringe className="w-4 h-4" />
                          Suntik & Catat Imunisasi (Potong 1 Vial & Tagih Kasir)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: RIWAYAT VAKSIN DIBERIKAN PADA KUNJUNGAN INI */}
            <div className="bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Vaksin Yang Diberikan Pada Kunjungan Ini
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Daftar vaksin yang berhasil disuntikkan selama sesi konsultasi saat ini.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5">
                  {riwayatKunjunganIni.length} Vaksin
                </span>
              </div>

              {riwayatKunjunganIni.length === 0 ? (
                <div className="p-6 border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                  Belum ada vaksin yang disuntikkan pada sesi kunjungan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {riwayatKunjunganIni.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3.5 bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">
                            {item.batchVaksin?.vaksin?.namaVaksin || 'Vaksinasi'}
                          </h4>
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5">
                            Dosis {item.dosisKe}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Batch: <strong className="font-mono text-gray-800">{item.batchVaksin?.noBatch || '-'}</strong></span>
                          <span>Volume: <strong>{item.dosisJumlah || '0.5'} mL</strong></span>
                          <span>Rute: <strong>{item.ruteSuntik}</strong></span>
                          <span>Lokasi: <strong>{item.lokasiSuntik}</strong></span>
                        </div>
                        {item.catatan && (
                          <div className="text-[11px] text-gray-500 mt-1 italic">
                            Catatan: {item.catatan}
                          </div>
                        )}
                      </div>

                      <div className="text-right sm:shrink-0">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 inline-block">
                          Tagihan Kasir: Rp 25.000
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(item.tanggalSuntik).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Informational Banner Kasir */}
                  <div className="p-3 bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Integrasi Pembayaran Kasir & Farmasi:</strong>
                      <p className="mt-0.5 text-blue-800">
                        Resep obat yang telah ditulis di fase pemeriksaan serta tindakan vaksinasi di atas otomatis masuk ke rincian tagihan kasir.
                        Silakan klik tombol di bawah untuk menyelesaikan sesi dan memulangkan pasien.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePulang}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-none shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Selesai & Pulangkan Pasien ke Kasir & Farmasi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: RUJUKAN
  // -------------------------------------------------------------
  if (activeMenu === 'RUJUKAN') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 overflow-y-auto">
        <div className="p-4 bg-white border-b shadow-sm flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveMenu('HOME')} className="p-2 hover:bg-gray-100 rounded-none">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" /> Form Surat Rujukan
            </h2>
          </div>
        </div>

        <div className="max-w-6xl w-full mx-auto flex gap-6 p-6 items-start h-full pb-20">
          {/* Panel Form Editor (Sembunyi saat print) */}
          <div className="w-1/3 bg-white p-6 shadow-md border border-gray-200 print:hidden h-fit rounded-none sticky top-6">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="p-3 bg-blue-50 border border-blue-100 mb-2 rounded-none">
                <label className="block text-xs font-bold text-blue-800 mb-1">Kepada Yth. Teman Sejawat (TS)</label>
                <input type="text" placeholder="dr. Spesialis / Nama RS" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none mb-2" 
                  value={rujukanData.tujuanDokter} onChange={e => setRujukanData({...rujukanData, tujuanDokter: e.target.value})} />
                
                <label className="block text-xs font-bold text-blue-800 mb-1">Di Poliklinik / Bagian</label>
                <input type="text" placeholder="Poli Penyakit Dalam" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none mb-2" 
                  value={rujukanData.tujuanPoli} onChange={e => setRujukanData({...rujukanData, tujuanPoli: e.target.value})} />
                  
                <label className="block text-xs font-bold text-blue-800 mb-1">Rumah Sakit Tujuan</label>
                <input type="text" placeholder="RSUD Kota / RS Siloam" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.tujuanRS} onChange={e => setRujukanData({...rujukanData, tujuanRS: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pasien</label>
                <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.namaPasien} onChange={e => setRujukanData({...rujukanData, namaPasien: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Umur</label>
                  <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                    value={rujukanData.umur} onChange={e => setRujukanData({...rujukanData, umur: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-white" 
                    value={rujukanData.jenisKelamin} onChange={e => setRujukanData({...rujukanData, jenisKelamin: e.target.value})}>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.alamat} onChange={e => setRujukanData({...rujukanData, alamat: e.target.value})} />
              </div>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Anamnesa Singkat</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.anamnesa} onChange={e => setRujukanData({...rujukanData, anamnesa: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hasil Pemeriksaan Fisik</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.pemeriksaanFisik} onChange={e => setRujukanData({...rujukanData, pemeriksaanFisik: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">Diagnosa Sementara</label>
                <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.diagnosaSementara} onChange={e => setRujukanData({...rujukanData, diagnosaSementara: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Terapi / Tindakan yang Diberikan</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.terapi} onChange={e => setRujukanData({...rujukanData, terapi: e.target.value})} />
              </div>
            </div>
            <button 
              onClick={submitRujukan} 
              disabled={isSubmitting || !rujukanData.tujuanRS || !rujukanData.tujuanPoli}
              className="w-full bg-indigo-600 text-white font-bold py-3 mt-4 rounded-none flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Printer className="w-5 h-5" /> Cetak & Selesai</>}
            </button>
          </div>

          {/* Panel Kertas Surat (Print Area) */}
          <div className="w-2/3 bg-white shadow-lg p-12 min-h-[297mm] print:w-full print:shadow-none print:p-0 print:m-0 text-gray-900 rounded-none">
            {/* Kop Surat */}
            <div className="border-b-4 border-double border-gray-900 pb-4 mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide uppercase">Klinik Kesehatan Prima</h1>
              <p className="text-sm text-gray-700">Jl. Jendral Sudirman No. 123, Jakarta Pusat</p>
              <p className="text-sm text-gray-700">Telp: (021) 1234567 | Email: info@klinikprima.com</p>
            </div>

            <div className="flex justify-between items-start mb-8 text-base">
              <div>
                <p>Nomor : SR/{new Date().getFullYear()}/{(new Date().getMonth()+1).toString().padStart(2, '0')}/003</p>
                <p>Lamp. : -</p>
                <p>Hal : <strong>Rujukan Pasien</strong></p>
              </div>
              <div className="text-right">
                <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-1">Kepada Yth. Teman Sejawat,</p>
              <p className="font-bold">{rujukanData.tujuanDokter || 'dr. .................................................'}</p>
              <p>Di Poliklinik: {rujukanData.tujuanPoli || '...........................................'}</p>
              <p>Rumah Sakit: {rujukanData.tujuanRS || '...........................................'}</p>
            </div>

            {/* Isi Surat */}
            <div className="text-base text-gray-900 leading-relaxed space-y-4">
              <p>Dengan hormat,</p>
              <p>Mohon bantuan pemeriksaan dan penanganan lebih lanjut terhadap penderita:</p>
              
              <table className="w-full ml-4 mb-4">
                <tbody>
                  <tr>
                    <td className="w-1/4 py-1">Nama Pasien</td>
                    <td className="w-4 py-1">:</td>
                    <td className="font-bold">{rujukanData.namaPasien || '...................................................'}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Umur / JK</td>
                    <td className="py-1">:</td>
                    <td>{rujukanData.umur ? `${rujukanData.umur} Tahun` : '......'} / {rujukanData.jenisKelamin}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top">Alamat</td>
                    <td className="py-1 align-top">:</td>
                    <td>{rujukanData.alamat || '.........................................................................'}</td>
                  </tr>
                </tbody>
              </table>

              <p>Berdasarkan pemeriksaan kami, didapatkan temuan klinis sebagai berikut:</p>
              <table className="w-full ml-4">
                <tbody>
                  <tr>
                    <td className="w-1/3 py-1 align-top font-semibold">Anamnesa Singkat</td>
                    <td className="w-4 py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.anamnesa}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top font-semibold">Pemeriksaan Fisik</td>
                    <td className="py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.pemeriksaanFisik}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top font-semibold">Diagnosa Sementara</td>
                    <td className="py-2 align-top">:</td>
                    <td className="py-2 align-top font-bold">{rujukanData.diagnosaSementara}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top font-semibold">Terapi Diberikan</td>
                    <td className="py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.terapi}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-8">
                Demikian surat rujukan ini kami sampaikan, atas bantuan dan kerja sama teman sejawat kami ucapkan terima kasih.
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="mt-16 flex justify-end text-gray-900 text-center">
              <div>
                <p className="mb-16">Salam Sejawat,</p>
                <p className="font-bold underline underline-offset-4">dr. {selectedKunjungan.dokterTujuan?.namaLengkap || 'Dokter Anda'}</p>
                <p className="text-sm mt-1">SIP. 123.456.789</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: RAWAT INAP (BED ASSIGNMENT)
  // -------------------------------------------------------------
  if (activeMenu === 'RAWAT_INAP') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 h-full w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveMenu('HOME')} className="p-2 hover:bg-gray-100 rounded-none text-gray-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-teal-600" />
                Rawat Inap Puskesmas (Bed Assignment)
              </h2>
              <p className="text-xs text-gray-500">
                Pilih kamar & bed yang tersedia untuk pasien <strong>{selectedKunjungan.pasien.namaLengkap}</strong> ({selectedKunjungan.pasien.noRM})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMenu('HOME')}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-xs rounded-none"
            >
              Batal
            </button>
            <button
              onClick={submitRawatInap}
              disabled={isSubmitting || !selectedBedId || availableBeds.length === 0}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold transition-colors text-xs rounded-none shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Assign ke Rawat Inap & Selesaikan ➔
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Pilihan Bed (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    Pilihan Kamar & Tempat Tidur Tersedia
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hanya menampilkan bed yang berstatus <strong>TERSEDIA</strong> di Puskesmas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAvailableBeds}
                  className="text-xs text-teal-600 hover:underline font-bold flex items-center gap-1"
                >
                  Refresh Bed
                </button>
              </div>

              {isLoadingBeds ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
                  <p className="text-sm font-medium">Memuat ketersediaan tempat tidur...</p>
                </div>
              ) : availableBeds.length === 0 ? (
                <div className="p-6 border border-amber-200 bg-amber-50 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-gray-900 text-sm">Tidak Ada Bed Tersedia</h4>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Seluruh tempat tidur rawat inap di Puskesmas saat ini sedang terisi penuh atau dalam perbaikan. Jika pasien memerlukan penanganan lanjutan, silakan rujuk pasien ke Rumah Sakit di menu Buat Rujukan.
                  </p>
                  <button
                    onClick={() => setActiveMenu('RUJUKAN')}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-none hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ClipboardList className="w-4 h-4" /> Beralih ke Menu Rujuk ke Luar Faskes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {availableBeds.map((bed) => {
                    const isSelected = selectedBedId === bed.id;
                    return (
                      <div
                        key={bed.id}
                        onClick={() => setSelectedBedId(bed.id)}
                        className={`p-4 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 shadow-md ring-1 ring-teal-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-black text-sm text-gray-900">{bed.nomorBed}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 uppercase tracking-wide">
                            Tersedia
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-gray-500" />
                            {bed.ruangan?.namaRuangan || 'Ruangan Rawat Inap'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {bed.ruangan?.gedung || 'Gedung Utama'} • {bed.ruangan?.lantai || 'Lantai 1'}
                          </div>
                          <div className="text-[11px] font-semibold text-teal-700">
                            Kelas: {bed.kelasKamar || 'NON_KELAS_IGD'}
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${isSelected ? 'text-teal-700' : 'text-gray-400'}`}>
                            {isSelected ? '✓ Terpilih' : 'Klik untuk Pilih'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Ringkasan & Instruksi (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3">
                Instruksi & Asuhan Rawat Inap
              </h3>

              {/* Ringkasan Pasien */}
              <div className="bg-gray-50 p-3 border border-gray-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pasien:</span>
                  <span className="font-bold text-gray-900">{selectedKunjungan.pasien.namaLengkap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">No. RM:</span>
                  <span className="font-mono text-gray-800">{selectedKunjungan.pasien.noRM}</span>
                </div>
                {isUgd && ugdBed && (
                  <div className="flex justify-between text-blue-800 font-semibold pt-1 border-t border-gray-200 mt-1">
                    <span>Bed UGD Saat Ini:</span>
                    <span>{ugdBed.ruangan?.namaRuangan || 'IGD'} - {ugdBed.nomorBed} (Otomatis dilepas)</span>
                  </div>
                )}
                {diagnosaList && diagnosaList.length > 0 && (
                  <div className="pt-1 border-t border-gray-200 mt-1">
                    <span className="text-gray-500 block mb-0.5">Diagnosa Medis:</span>
                    <span className="font-semibold text-gray-900">
                      {diagnosaList.map(d => `${d.icd10.kode_icd10} - ${d.icd10.nama_diagnosis}`).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Input Indikasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alasan / Indikasi Rawat Inap *
                </label>
                <textarea
                  rows={3}
                  value={rawatInapForm.alasanRawatInap}
                  onChange={e => setRawatInapForm({ ...rawatInapForm, alasanRawatInap: e.target.value })}
                  placeholder="Misal: Observasi demam hari ke-4, dehidrasi sedang, curiga DHF..."
                  className="w-full p-2.5 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Input Instruksi Perawat Bangsal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Instruksi Medis untuk Perawat Bangsal
                </label>
                <textarea
                  rows={4}
                  value={rawatInapForm.instruksiMedis}
                  onChange={e => setRawatInapForm({ ...rawatInapForm, instruksiMedis: e.target.value })}
                  placeholder="Instruksi cairan IVFD (misal: RL 20 tpm), diet lunak, pantau tanda vital tiap 4 jam..."
                  className="w-full p-2.5 bg-white border border-gray-300 text-xs rounded-none focus:ring-1 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={submitRawatInap}
                  disabled={isSubmitting || !selectedBedId || availableBeds.length === 0}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-none shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Assign Pasien ke Rawat Inap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
