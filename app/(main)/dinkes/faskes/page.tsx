"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2 
} from 'lucide-react';
import { dinkesService, FaskesItem } from '../../../../services/dinkes.service';

export default function DinkesMasterFaskesPage() {
  const [faskesList, setFaskesList] = useState<FaskesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFaskes, setEditingFaskes] = useState<FaskesItem | null>(null);
  const [formData, setFormData] = useState({
    kodeFaskes: '',
    namaFaskes: '',
    tipeFaskes: 'PUSKESMAS' as const,
    alamat: '',
    wilayahKecamatan: '',
    wilayahKelurahan: '',
    telepon: '',
    email: '',
    kepalaFaskes: '',
    kapasitasRawatInap: 0,
    tersediaIGD: true,
    statusOperasional: 'AKTIF' as const
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFaskes = async () => {
    setLoading(true);
    try {
      const data = await dinkesService.getFaskesList();
      setFaskesList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Gagal memuat faskes:", err);
      setFaskesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaskes();
  }, []);

  const openAddModal = () => {
    setEditingFaskes(null);
    setFormData({
      kodeFaskes: `FSK-${Math.floor(100 + Math.random() * 900)}`,
      namaFaskes: '',
      tipeFaskes: 'PUSKESMAS',
      alamat: '',
      wilayahKecamatan: '',
      wilayahKelurahan: '',
      telepon: '',
      email: '',
      kepalaFaskes: '',
      kapasitasRawatInap: 10,
      tersediaIGD: true,
      statusOperasional: 'AKTIF'
    });
    setShowModal(true);
  };

  const openEditModal = (faskes: FaskesItem) => {
    setEditingFaskes(faskes);
    setFormData({
      kodeFaskes: faskes.kodeFaskes,
      namaFaskes: faskes.namaFaskes,
      tipeFaskes: faskes.tipeFaskes as any,
      alamat: faskes.alamat,
      wilayahKecamatan: faskes.wilayahKecamatan || '',
      wilayahKelurahan: faskes.wilayahKelurahan || '',
      telepon: faskes.telepon || '',
      email: faskes.email || '',
      kepalaFaskes: faskes.kepalaFaskes || '',
      kapasitasRawatInap: faskes.kapasitasRawatInap || 0,
      tersediaIGD: faskes.tersediaIGD,
      statusOperasional: faskes.statusOperasional as any
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingFaskes) {
        await dinkesService.updateFaskes(editingFaskes.id, formData);
        Swal.fire('Berhasil', 'Data Faskes berhasil diperbarui', 'success');
      } else {
        await dinkesService.createFaskes(formData);
        Swal.fire('Berhasil', 'Fasilitas Kesehatan baru berhasil ditambahkan', 'success');
      }
      setShowModal(false);
      fetchFaskes();
    } catch (err: any) {
      Swal.fire('Gagal', err?.response?.data?.message || err?.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faskes: FaskesItem) => {
    const confirm = await Swal.fire({
      title: 'Hapus Fasilitas Kesehatan?',
      text: `Apakah Anda yakin ingin menghapus data faskes ${faskes.namaFaskes}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    });

    if (confirm.isConfirmed) {
      try {
        await dinkesService.deleteFaskes(faskes.id);
        Swal.fire('Dihapus', 'Data Faskes telah dihapus dari sistem', 'success');
        fetchFaskes();
      } catch (err: any) {
        Swal.fire('Gagal', err?.response?.data?.message || 'Tidak dapat menghapus faskes', 'error');
      }
    }
  };

  const listSafe = Array.isArray(faskesList) ? faskesList : [];
  const filteredFaskes = listSafe.filter((f) =>
    (f.namaFaskes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.wilayahKecamatan && f.wilayahKecamatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.kodeFaskes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dinkes"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard Dinkes
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Master Fasilitas Pelayanan Kesehatan (Faskes) Se-Kabupaten
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data referensi Puskesmas, Klinik, dan Rumah Sakit Daerah dalam naungan Dinas Kesehatan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFaskes}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Sinkronkan
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Faskes
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari berdasarkan nama faskes, kode faskes, atau kecamatan..."
          className="w-full text-sm text-slate-800 outline-none bg-transparent"
        />
      </div>

      {/* Grid of Faskes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat daftar fasilitas kesehatan...
          </div>
        ) : filteredFaskes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Tidak ditemukan faskes yang sesuai pencarian.
          </div>
        ) : (
          filteredFaskes.map((faskes) => (
            <div
              key={faskes.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {faskes.kodeFaskes}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      faskes.statusOperasional === 'AKTIF'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {faskes.statusOperasional}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1">{faskes.namaFaskes}</h3>
                <span className="inline-block px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 font-bold rounded mb-3">
                  {faskes.tipeFaskes}
                </span>

                <div className="space-y-2 text-xs text-slate-600 mb-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{faskes.alamat} {faskes.wilayahKecamatan ? `, Kec. ${faskes.wilayahKecamatan}` : ''}</span>
                  </div>
                  {faskes.telepon && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{faskes.telepon}</span>
                    </div>
                  )}
                  {faskes.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{faskes.email}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-center text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kapasitas Inap</span>
                    <span className="font-bold text-slate-800">{faskes.kapasitasRawatInap || 0} Bed</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fasilitas IGD</span>
                    <span className={`font-bold ${faskes.tersediaIGD ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {faskes.tersediaIGD ? 'Tersedia 24 Jam' : 'Tidak Ada'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(faskes)}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(faskes)}
                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingFaskes ? 'Edit Data Faskes' : 'Tambah Fasilitas Kesehatan Baru'}
                </h3>
                <p className="text-xs text-slate-500">Isi formulir pendaftaran faskes di tingkat kabupaten.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Faskes *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kodeFaskes}
                    onChange={(e) => setFormData({ ...formData, kodeFaskes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Faskes *
                  </label>
                  <select
                    value={formData.tipeFaskes}
                    onChange={(e) => setFormData({ ...formData, tipeFaskes: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="PUSKESMAS">PUSKESMAS</option>
                    <option value="KLINIK_PRATAMA">KLINIK PRATAMA</option>
                    <option value="KLINIK_UTAMA">KLINIK UTAMA</option>
                    <option value="RUMAH_SAKIT_DAERAH">RUMAH SAKIT DAERAH</option>
                    <option value="LABKESDA">LABKESDA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Fasilitas Kesehatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Puskesmas Cibinong Raya"
                  value={formData.namaFaskes}
                  onChange={(e) => setFormData({ ...formData, namaFaskes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={formData.wilayahKecamatan}
                    onChange={(e) => setFormData({ ...formData, wilayahKecamatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kepala Faskes
                  </label>
                  <input
                    type="text"
                    placeholder="dr. Nama Lengkap, M.Kes"
                    value={formData.kepalaFaskes}
                    onChange={(e) => setFormData({ ...formData, kepalaFaskes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kapasitas Rawat Inap (Bed)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.kapasitasRawatInap}
                    onChange={(e) => setFormData({ ...formData, kapasitasRawatInap: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Operasional
                  </label>
                  <select
                    value={formData.statusOperasional}
                    onChange={(e) => setFormData({ ...formData, statusOperasional: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                    <option value="RENOVASI">RENOVASI</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tersediaIGD"
                  checked={formData.tersediaIGD}
                  onChange={(e) => setFormData({ ...formData, tersediaIGD: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="tersediaIGD" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Fasilitas memiliki layanan UGD / Gawat Darurat 24 Jam
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Faskes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
