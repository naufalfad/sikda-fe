"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Search, Plus, Loader2, X, CheckCircle2, ShieldAlert, AlertTriangle, Sparkles } from 'lucide-react';
import { icd10Service } from '@/services/icd10.service';
import Swal from 'sweetalert2';

export default function MasterICD10Page() {
  const [icdList, setIcdList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kode_icd10: '',
    nama_diagnosis: '',
    penyakit_menular: false,
    penyakit_kronis: false,
    wajib_lapor: false,
    kode_program: '',
    status_aktif: true,
  });

  const fetchICD = async () => {
    setIsLoading(true);
    try {
      const res = await icd10Service.search(searchQuery);
      if (res.status === 'success') {
        setIcdList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchICD();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleOpenModal = (icd?: any) => {
    if (icd) {
      setEditingId(icd.id_icd10);
      setFormData({
        kode_icd10: icd.kode_icd10,
        nama_diagnosis: icd.nama_diagnosis,
        penyakit_menular: icd.penyakit_menular || false,
        penyakit_kronis: icd.penyakit_kronis || false,
        wajib_lapor: icd.wajib_lapor || false,
        kode_program: icd.kode_program || '',
        status_aktif: icd.status_aktif !== false, // default true
      });
    } else {
      setEditingId(null);
      setFormData({
        kode_icd10: '',
        nama_diagnosis: '',
        penyakit_menular: false,
        penyakit_kronis: false,
        wajib_lapor: false,
        kode_program: '',
        status_aktif: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await icd10Service.updateICD10(editingId, formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data ICD-10 diubah!', timer: 1500, showConfirmButton: false });
      } else {
        await icd10Service.createICD10(formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data ICD-10 ditambahkan!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchICD();
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Gagal menyimpan data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, kode: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus ICD-10?',
      text: `Yakin ingin menghapus ${kode}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444'
    });

    if (confirm.isConfirmed) {
      try {
        await icd10Service.deleteICD10(id);
        Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1000, showConfirmButton: false });
        fetchICD();
      } catch (err: any) {
        Swal.fire('Error', err?.response?.data?.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Master Data ICD-10
          </h1>
          <p className="text-gray-500 mt-2">Kelola data master diagnosis penyakit.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kode atau nama..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah ICD-10
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs font-semibold text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Kode ICD-10</th>
                <th className="px-6 py-3.5 w-1/2">Diagnosis</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  </td>
                </tr>
              ) : icdList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data diagnosis.
                  </td>
                </tr>
              ) : (
                icdList.map((icd) => (
                  <tr key={icd.id_icd10} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-slate-900 font-bold text-xs">{icd.kode_icd10}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">{icd.nama_diagnosis}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${icd.status_aktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {icd.status_aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(icd)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN POP-UP MODAL ICD-10 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingId ? 'Edit Diagnosis ICD-10' : 'Tambah Diagnosis ICD-10'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klasifikasi Statistik Internasional Penyakit &amp; Masalah Kesehatan WHO
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
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode ICD-10 <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.kode_icd10} 
                  onChange={e => setFormData({...formData, kode_icd10: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  placeholder="Misal: A00.0, I10, J06.9" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Diagnosis Penyakit <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.nama_diagnosis} 
                  onChange={e => setFormData({...formData, nama_diagnosis: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  placeholder="Misal: Cholera due to Vibrio cholerae 01, biovar cholerae" 
                />
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pengaturan Karakteristik &amp; Pelaporan
                </label>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.penyakit_menular} 
                      onChange={e => setFormData({...formData, penyakit_menular: e.target.checked})} 
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-800">Penyakit Menular</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-orange-50 hover:border-orange-200 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.penyakit_kronis} 
                      onChange={e => setFormData({...formData, penyakit_kronis: e.target.checked})} 
                      className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-800">Penyakit Kronis</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-200 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.wajib_lapor} 
                      onChange={e => setFormData({...formData, wajib_lapor: e.target.checked})} 
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-800">Wajib Lapor Dinkes</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.status_aktif} 
                      onChange={e => setFormData({...formData, status_aktif: e.target.checked})} 
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-800">Status Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode Program Nasional Dinkes <span className="font-normal text-slate-400 capitalize">(Opsional)</span>
                </label>
                <input 
                  type="text" 
                  value={formData.kode_program} 
                  onChange={e => setFormData({...formData, kode_program: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  placeholder="Misal: PRG-TB, PRG-DBD, PRG-HIV" 
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingId ? 'Simpan Perubahan' : 'Tambah ICD-10'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
