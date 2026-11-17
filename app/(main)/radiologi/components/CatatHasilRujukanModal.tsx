'use client';

import React, { useState } from 'react';
import { FileText, X, Building2, UploadCloud, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { radiologiService } from '@/services/radiologi.service';
import Swal from 'sweetalert2';

interface CatatHasilRujukanModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CatatHasilRujukanModal({ order, onClose, onSuccess }: CatatHasilRujukanModalProps) {
  const [kesimpulan, setKesimpulan] = useState(order?.catatanHasil || order?.hasil?.kesimpulan || '');
  const [bacaanNaratif, setBacaanNaratif] = useState(order?.hasil?.bacaanNaratif || '');
  const [faskesTujuan, setFaskesTujuan] = useState(order?.faskesTujuan || 'Instalasi Radiologi RSUD Terdekat');
  const [dokterRadiologiNama, setDokterRadiologiNama] = useState(
    order?.hasil?.dokterRadiologi?.namaLengkap || ''
  );
  const [dokumenHasilUrl, setDokumenHasilUrl] = useState(order?.dokumenHasilUrl || order?.hasil?.wadoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kesimpulan.trim() || !bacaanNaratif.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Harap isi Kesimpulan/Kesan dan Deskripsi Naratif dari lembar hasil RS rujukan!',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await radiologiService.submitHasilRujukanLuar(order.id, {
        kesimpulan,
        bacaanNaratif,
        catatanHasil: kesimpulan,
        dokumenHasilUrl: dokumenHasilUrl || undefined,
        dokterRadiologiNama: dokterRadiologiNama || undefined,
      });

      if (res.success || res.data) {
        Swal.fire({
          icon: 'success',
          title: 'Hasil Rujukan Radiologi Berhasil Dicatat!',
          text: 'Status rujukan diperbarui menjadi COMPLETED dan lembar hasil otomatis terhubung ke Rekam Medis Elektronik (RME) pasien.',
          timer: 2000,
          showConfirmButton: false,
        });
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal menyimpan hasil rujukan radiologi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center p-5 border-b border-sky-950 bg-sky-900 text-white">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-sky-300" />
            <div>
              <h3 className="text-base font-extrabold leading-tight">
                Catat Hasil Rujukan Radiologi Eksternal (RS Luar)
              </h3>
              <p className="text-xs text-sky-200">
                No. Rujukan / ACSN: <span className="font-mono font-bold text-white">{order?.acsn || order?.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-300 hover:text-white font-bold text-sm flex items-center gap-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTICE EXPLANATION */}
        <div className="bg-sky-50 border-b border-sky-200 p-4 flex items-start gap-3 text-xs text-sky-950">
          <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Pemeriksaan Dilakukan di Faskes Rujukan Lanjutan</p>
            <p className="text-sky-800 text-[11px] mt-0.5 leading-relaxed">
              Formulir ini digunakan untuk merekam hasil ekspertise fisik / foto rontgen yang dibawa kembali oleh pasien dari rumah sakit rujukan ({order?.faskesTujuan || 'RSUD'}). Bukan merupakan ekspertise alat internal faskes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* DETAIL PASIEN & PEMERIKSAAN */}
          <div className="bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-800">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Nama Pasien</span>
              <span className="font-extrabold text-sm text-slate-900">{order?.pasien?.namaLengkap}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">No. RM</span>
              <span className="font-mono font-extrabold text-sm text-slate-900">{order?.pasien?.noRM}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Dokter Pengirim</span>
              <span className="font-bold text-slate-900">{order?.dokter?.namaLengkap || 'Dokter Poli'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Pemeriksaan Diminta</span>
              <span className="font-bold text-sky-900">
                {order?.details?.map((d: any) => d.namaPemeriksaan).join(', ') || 'Rontgen / Radiologi'}
              </span>
            </div>
          </div>

          {/* RUMAH SAKIT & DOKTER RADIOLOGI RS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rumah Sakit / Lab Rujukan Pelaksana
              </label>
              <input
                type="text"
                value={faskesTujuan}
                onChange={(e) => setFaskesTujuan(e.target.value)}
                placeholder="misal: RSUD Terdekat / Balai Labkesda"
                className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dokter Spesialis Radiologi RS Pemeriksa (Sp.Rad)
              </label>
              <input
                type="text"
                value={dokterRadiologiNama}
                onChange={(e) => setDokterRadiologiNama(e.target.value)}
                placeholder="misal: dr. H. Ahmad Fauzi, Sp.Rad"
                className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* KESIMPULAN / KESAN RADIOLOGI RS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Kesimpulan / Kesan Rontgen RS <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={kesimpulan}
              onChange={(e) => setKesimpulan(e.target.value)}
              placeholder="misal: Cor dan Pulmo dalam batas normal, tidak tampak infiltrat/kardiomegali"
              className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* BACAAN NARATIF EKSPERTISE RS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deskripsi Bacaan Naratif Lengkap dari Lembar RS <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={bacaanNaratif}
              onChange={(e) => setBacaanNaratif(e.target.value)}
              placeholder="Salin atau ketikkan ringkasan bacaan dari kertas hasil RS rujukan:&#10;- Trakea di tengah, aorta normal&#10;- Cor: CTR < 50%&#10;- Pulmo: Corakan bronkovaskular normal, sinus kostofrenikus tajam..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-mono"
            />
          </div>

          {/* TAUTAN / URL DOKUMEN SCAN (OPSIONAL) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tautan / URL Berkas Digital / Foto Rontgen (Opsional)
            </label>
            <div className="relative">
              <UploadCloud className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={dokumenHasilUrl}
                onChange={(e) => setDokumenHasilUrl(e.target.value)}
                placeholder="https://... atau nomor arsip berkas fisik"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-none text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-600"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Dapat diisi URL scan surat hasil rujukan, cloud storage, atau nomor lemari arsip fisik.
            </p>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-none shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Rujukan ke Rekam Medis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
