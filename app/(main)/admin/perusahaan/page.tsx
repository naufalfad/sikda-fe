'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Building, FileText, CheckCircle, XCircle, X, Mail, Phone, Calendar, Upload, User, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { usePerusahaanStore } from '@/store/perusahaan.store';
import Swal from 'sweetalert2';

export default function MasterPerusahaanPage() {
  const { perusahaan, isLoading, fetchPerusahaan, createPerusahaan } = usePerusahaanStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    kodePerusahaan: '',
    namaPerusahaan: '',
    alamat: '',
    noTelepon: '',
    email: '',
    namaPic: '',
    noHpPic: '',
    noPks: '',
    tanggalMulai: '',
    tanggalBerakhir: '',
    statusKerjasama: 'AKTIF'
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPerusahaan();
  }, [fetchPerusahaan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPerusahaan || !formData.kodePerusahaan) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Nama Perusahaan dan Kode Perusahaan wajib diisi.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (file) {
        submitData.append('fileDokumenPks', file);
      }

      const success = await createPerusahaan(submitData);
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data mitra perusahaan baru berhasil ditambahkan.',
          timer: 1600,
          showConfirmButton: false
        });
        setIsModalOpen(false);
        fetchPerusahaan();
        // Reset form
        setFormData({
          kodePerusahaan: '', namaPerusahaan: '', alamat: '', noTelepon: '', email: '',
          namaPic: '', noHpPic: '', noPks: '', tanggalMulai: '', tanggalBerakhir: '', statusKerjasama: 'AKTIF'
        });
        setFile(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menambahkan',
          text: 'Terjadi kegagalan saat menyimpan data mitra perusahaan.',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: error?.message || 'Terjadi kesalahan sistem',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPerusahaan = perusahaan.filter(p => 
    p.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kodePerusahaan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Building className="w-7 h-7" />
            </span>
            Master Data Perusahaan
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola data mitra kerja sama faskes, PIC penanggung jawab, dan dokumen legal PKS.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Mitra Perusahaan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau kode perusahaan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Mitra Terdaftar: <span className="font-bold text-slate-800">{perusahaan.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <th className="px-5 py-3.5">Kode &amp; Nama Perusahaan</th>
                <th className="px-5 py-3.5">Kontak Kantor</th>
                <th className="px-5 py-3.5">PIC (Penanggung Jawab)</th>
                <th className="px-5 py-3.5">No. PKS &amp; Dokumen</th>
                <th className="px-5 py-3.5 text-center">Periode Kontrak</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data mitra perusahaan...
                  </td>
                </tr>
              ) : filteredPerusahaan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada data perusahaan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPerusahaan.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.namaPerusahaan}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.kodePerusahaan}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800">{item.noTelepon || '-'}</div>
                      <div className="text-xs text-slate-500">{item.email || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{item.namaPic || '-'}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.noHpPic || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-700">{item.noPks || '-'}</div>
                      {item.fileDokumenPks ? (
                        <button 
                          onClick={() => setSelectedPdf(item.fileDokumenPks || null)}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat Dokumen PKS
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-0.5 block italic">Belum ada file</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs">
                      {item.tanggalMulai ? (
                        <div className="text-slate-700">
                          <span>{new Date(item.tanggalMulai).toLocaleDateString('id-ID')}</span>
                          <span className="text-slate-400 mx-1">s/d</span>
                          <span>{item.tanggalBerakhir ? new Date(item.tanggalBerakhir).toLocaleDateString('id-ID') : 'Seterusnya'}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        item.statusKerjasama === 'AKTIF' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.statusKerjasama}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN POP-UP MODAL TAMBAH PERUSAHAAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Tambah Mitra Perusahaan Baru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registrasi profil perusahaan, data PIC, dan dokumen legal kerja sama PKS
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] text-slate-800">
              {/* Section 1: Identitas Perusahaan */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Identitas Badan Usaha / Perusahaan
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="namaPerusahaan" 
                      required 
                      placeholder="Contoh: PT. Medika Utama Sejahtera" 
                      value={formData.namaPerusahaan} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="kodePerusahaan" 
                      required 
                      placeholder="Contoh: CORP-001" 
                      value={formData.kodePerusahaan} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono font-bold text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No Telepon Kantor</label>
                    <input 
                      type="text" 
                      name="noTelepon" 
                      placeholder="Contoh: (021) 1234567" 
                      value={formData.noTelepon} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi Kantor</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="Contoh: hrd@perusahaan.co.id" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kantor Lengkap</label>
                    <textarea 
                      name="alamat" 
                      rows={2} 
                      placeholder="Contoh: Gedung Artha Graha Lt. 12, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan" 
                      value={formData.alamat} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Kontak PIC */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Person In Charge (PIC / Penanggung Jawab)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap PIC</label>
                    <input 
                      type="text" 
                      name="namaPic" 
                      placeholder="Contoh: Budi Santoso, S.H." 
                      value={formData.namaPic} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP PIC</label>
                    <input 
                      type="text" 
                      name="noHpPic" 
                      placeholder="Contoh: 081234567890" 
                      value={formData.noHpPic} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data PKS */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Perjanjian Kerja Sama (PKS) &amp; Berkas
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kontrak PKS</label>
                    <input 
                      type="text" 
                      name="noPks" 
                      placeholder="Contoh: PKS/2026/07/001" 
                      value={formData.noPks} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unggah Berkas PKS (PDF)</label>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleFileChange} 
                      className="w-full border border-slate-300 p-2 text-xs rounded-xl bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai Berlaku</label>
                    <input 
                      type="date" 
                      name="tanggalMulai" 
                      value={formData.tanggalMulai} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berakhir Kontrak</label>
                    <input 
                      type="date" 
                      name="tanggalBerakhir" 
                      value={formData.tanggalBerakhir} 
                      onChange={handleInputChange} 
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Simpan Mitra Perusahaan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODERN POP-UP MODAL PDF VIEWER */}
      {selectedPdf && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3 text-white max-w-5xl mx-auto w-full">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Pratinjau Dokumen Legal PKS
            </h2>
            <button 
              onClick={() => setSelectedPdf(null)}
              className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-w-5xl mx-auto w-full">
            <iframe 
              src={selectedPdf} 
              className="w-full h-full border-0"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
