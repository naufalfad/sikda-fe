"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Syringe, Search, Plus, Edit2, Trash2, Loader2, X, Snowflake, ExternalLink, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { masterService } from '@/services/master.service';
import Swal from 'sweetalert2';

export default function MasterVaksinPage() {
  const [vaksinList, setVaksinList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kodeKfa: '',
    namaVaksin: '',
    targetPenyakit: '',
    statusAktif: true
  });

  const fetchVaksin = async () => {
    setIsLoading(true);
    try {
      const res = await masterService.getVaksin();
      if (res?.data && Array.isArray(res.data)) {
        setVaksinList(res.data);
      } else if (Array.isArray(res)) {
        setVaksinList(res);
      } else {
        setVaksinList([]);
      }
    } catch (e) {
      console.error('Error fetching master vaksin:', e);
      setVaksinList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaksin();
  }, []);

  const handleOpenModal = (vaksin?: any) => {
    if (vaksin) {
      setEditingId(vaksin.id);
      setFormData({
        kodeKfa: vaksin.kodeKfa || '',
        namaVaksin: vaksin.namaVaksin || '',
        targetPenyakit: vaksin.targetPenyakit || '',
        statusAktif: vaksin.statusAktif !== undefined ? vaksin.statusAktif : true
      });
    } else {
      setEditingId(null);
      setFormData({
        kodeKfa: '',
        namaVaksin: '',
        targetPenyakit: '',
        statusAktif: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeKfa || !formData.namaVaksin) {
      Swal.fire('Validasi Gagal', 'Kode KFA dan Nama Vaksin wajib diisi.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await masterService.updateVaksin(editingId, formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data master vaksin berhasil diperbarui!', timer: 1500, showConfirmButton: false });
      } else {
        await masterService.createVaksin(formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Master vaksin baru berhasil ditambahkan!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchVaksin();
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Master Vaksin?',
      text: `Yakin ingin menghapus ${nama}? Penghapusan dibatalkan jika sudah memiliki batch stok faskes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await masterService.deleteVaksin(id);
        Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1200, showConfirmButton: false });
        fetchVaksin();
      } catch (err: any) {
        Swal.fire('Error', err?.response?.data?.message || 'Gagal menghapus data master vaksin', 'error');
      }
    }
  };

  const filteredList = vaksinList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.namaVaksin || '').toLowerCase().includes(q) ||
      (item.kodeKfa || '').toLowerCase().includes(q) ||
      (item.targetPenyakit || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-100 text-cyan-800 uppercase tracking-wider">
              Katalog Nasional KFA SATUSEHAT
            </span>
            <span className="text-xs text-gray-400">• Standar Imunisasi Kemenkes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Syringe className="w-8 h-8 text-cyan-600" />
            Master Data Vaksin
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Katalog referensi vaksin, kode KFA (Kamus Farmasi &amp; Alat Kesehatan), serta target pencegahan penyakit menular.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/apoteker/stok?tab=vaksin"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-colors"
          >
            <Snowflake className="w-4 h-4 text-sky-600" />
            Lihat Stok Fisik Vaksin (Cold-Chain)
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Jenis Vaksin Baru
          </button>
        </div>
      </div>

      {/* Info Alert: Penjelasan Master vs Stok Fisik Vaksin */}
      <div className="bg-cyan-50/80 border border-cyan-200 p-4 text-xs text-cyan-950 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-bold text-cyan-950">
            Modul Kamus Master Vaksin KFA Kemenkes (Bukan Pencatatan Stok Kulkas)
          </p>
          <p className="text-cyan-800 leading-relaxed">
            Halaman ini digunakan untuk mendaftarkan nama/kategori vaksin nasional untuk rekam medis dan imunisasi.
            Jika Anda ingin <strong>mencatat penerimaan batch fisik vaksin di kulkas</strong> (dropping Dinkes / Bio Farma) lengkap dengan nomor lot batch, tanggal expired, dan suhu penyimpanan (2-8°C), silakan gunakan modul{' '}
            <Link href="/apoteker/stok?tab=vaksin" className="font-bold underline text-cyan-900 hover:text-cyan-950">
              Logistik Obat &amp; Vaksin Faskes
            </Link>.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-gray-200 shadow-xs">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama vaksin, KFA, target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:bg-white focus:border-cyan-600 outline-none transition-colors"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Menampilkan <span className="font-bold text-gray-900">{filteredList.length}</span> dari {vaksinList.length} jenis vaksin
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5">Kode KFA</th>
                <th className="p-3.5">Nama Vaksin</th>
                <th className="p-3.5">Target Penyakit / Indikasi</th>
                <th className="p-3.5 text-center">Batch Faskes</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
                    Memuat katalog master vaksin...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Tidak ditemukan master vaksin yang cocok dengan kata kunci.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[11px]">
                        {item.kodeKfa || '-'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-gray-900 block text-sm">{item.namaVaksin}</span>
                      <span className="text-[10px] text-gray-400">ID: {item.id}</span>
                    </td>
                    <td className="p-3.5 font-medium text-gray-700">
                      {item.targetPenyakit ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {item.targetPenyakit}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/apoteker/stok?tab=vaksin`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                      >
                        <Snowflake className="w-3 h-3 text-cyan-600" />
                        {Array.isArray(item.batchVaksin) ? item.batchVaksin.length : 0} Lot Batch
                      </Link>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.statusAktif !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.statusAktif !== false ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-gray-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                          title="Edit Master Vaksin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.namaVaksin)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Master Vaksin"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modern Pop-up Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 via-slate-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-md">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingId ? 'Edit Master Vaksin' : 'Tambah Master Vaksin Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standarisasi Kamus Farmasi Alkes (KFA) SATUSEHAT Kemenkes RI
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode KFA (Kamus Farmasi Alkes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 9300101"
                  value={formData.kodeKfa}
                  onChange={(e) => setFormData({ ...formData, kodeKfa: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Kode identitas resmi vaksin dari Kemenkes SATUSEHAT</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Vaksin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Vaksin BCG Kering (Bio Farma)"
                  value={formData.namaVaksin}
                  onChange={(e) => setFormData({ ...formData, namaVaksin: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Penyakit / Indikasi Imunisasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tuberkulosis (TBC) / Polio / Campak"
                  value={formData.targetPenyakit}
                  onChange={(e) => setFormData({ ...formData, targetPenyakit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    id="statusAktif"
                    checked={formData.statusAktif}
                    onChange={(e) => setFormData({ ...formData, statusAktif: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Vaksin Aktif &amp; Siap Digunakan</span>
                    <span className="text-[11px] text-slate-500">Tersedia untuk peresepan imunisasi nakes dan pendaftaran batch faskes</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingId ? 'Simpan Perubahan' : 'Tambah Vaksin'}
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
