'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Stethoscope,
  Building,
  Key,
  IdCard,
  RefreshCw,
  Sparkles,
  AlertCircle,
  UserPlus,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useDokterStore } from '@/store/dokter.store';
import { useKlinikStore } from '@/store/klinik.store';
import { useAuthStore } from '@/store/auth.store';
import { Dokter } from '@/services/dokter.service';

export default function MasterDokterPage() {
  const { user } = useAuthStore();
  const { dokters, isLoading, fetchDokters, createDokter, updateDokter, deleteDokter, checkIHSNik } = useDokterStore();
  const { polikliniks, fetchPoliklinik } = useKlinikStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isCheckingNik, setIsCheckingNik] = useState<boolean>(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    namaLengkap: string;
    username: string;
    password: string;
    poliklinikId: string;
    role: 'DOKTER' | 'DOKTER_UGD';
    nik: string;
    noIHS: string;
  }>({
    namaLengkap: '',
    username: '',
    password: '',
    poliklinikId: '',
    role: 'DOKTER',
    nik: '',
    noIHS: ''
  });

  useEffect(() => {
    fetchDokters();
    fetchPoliklinik();
  }, [fetchDokters, fetchPoliklinik]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      namaLengkap: '',
      username: '',
      password: '',
      poliklinikId: polikliniks.length > 0 ? polikliniks[0].id : '',
      role: 'DOKTER',
      nik: '',
      noIHS: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dokter: Dokter) => {
    setIsEditMode(true);
    setSelectedId(dokter.id);
    setFormData({
      namaLengkap: dokter.namaLengkap || '',
      username: dokter.username,
      password: '', // Leave blank unless changing
      poliklinikId: dokter.poliklinikId || '',
      role: dokter.role === 'DOKTER_UGD' ? 'DOKTER_UGD' : 'DOKTER',
      nik: dokter.tenagaMedis?.nik || '',
      noIHS: dokter.tenagaMedis?.noIHS || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedId) {
        await updateDokter(selectedId, {
          namaLengkap: formData.namaLengkap,
          username: formData.username,
          password: formData.password ? formData.password : undefined,
          poliklinikId: formData.role === 'DOKTER_UGD' ? undefined : formData.poliklinikId,
          role: formData.role,
          nik: formData.nik
        });
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: `Data dokter ${formData.namaLengkap || formData.username} berhasil disimpan.`,
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await createDokter({
          ...formData,
          poliklinikId: formData.role === 'DOKTER_UGD' ? undefined : formData.poliklinikId,
        });
        Swal.fire({
          icon: 'success',
          title: 'Dokter Ditambahkan',
          text: `Dokter ${formData.namaLengkap || formData.username} berhasil terdaftar di faskes.`,
          timer: 1800,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Data',
        text: error.message || 'Terjadi kesalahan saat menyimpan data dokter.',
      });
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Dokter?',
      text: `Apakah Anda yakin ingin menghapus akun dokter ${nama}? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDokter(id);
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data dokter berhasil dihapus.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire('Error', error.message || 'Gagal menghapus dokter', 'error');
      }
    }
  };

  const handleSyncIHS = async (userId: string, existingNik?: string) => {
    const { value: nik } = await Swal.fire({
      title: 'Sinkronisasi SATUSEHAT',
      input: 'text',
      inputLabel: 'Masukkan 16 Digit NIK Dokter:',
      inputValue: existingNik || '',
      inputPlaceholder: 'Contoh: 3201010101900001',
      showCancelButton: true,
      confirmButtonText: 'Tarik Data IHS',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      inputValidator: (value) => {
        if (!value || value.length !== 16 || !/^\d+$/.test(value)) {
          return 'NIK harus terdiri dari tepat 16 digit angka!';
        }
        return null;
      }
    });

    if (!nik) return;
    
    setSyncingId(userId);
    try {
      const store = useDokterStore.getState();
      await store.syncDokterIHS(nik, userId);
      Swal.fire({
        icon: 'success',
        title: 'Tersinkronisasi',
        text: 'Nomor IHS Dokter berhasil ditarik dari SATUSEHAT Kemenkes RI.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire('Error Sinkronisasi', error.message || 'Gagal sinkronisasi IHS', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleCheckNik = async () => {
    if (formData.nik.length !== 16) {
      Swal.fire('Peringatan', 'NIK dokter harus terdiri dari 16 digit angka.', 'warning');
      return;
    }
    
    setIsCheckingNik(true);
    try {
      const data = await checkIHSNik(formData.nik);
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          namaLengkap: data.data.practitionerName || prev.namaLengkap,
          noIHS: data.data.ihsNumber 
        }));
        Swal.fire({
          icon: 'success',
          title: 'Data Kemenkes Ditemukan!',
          text: `Nama Resmi: ${data.data.practitionerName} (IHS: ${data.data.ihsNumber})`,
          timer: 2200,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'warning',
        title: 'Verifikasi SATUSEHAT',
        text: err.message || 'Data tenaga medis tidak ditemukan di SATUSEHAT. Anda tetap dapat memasukkan data secara manual.',
      });
    } finally {
      setIsCheckingNik(false);
    }
  };

  const filteredDokters = dokters.filter(d => 
    d.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.poliklinik?.namaPoli.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {user?.faskes?.namaFaskes && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{user.faskes.namaFaskes}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Users className="w-6 h-6" />
              </div>
              Master Dokter Faskes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola data tenaga medis dokter, hak akses login, dan penugasan poliklinik faskes terintegrasi SATUSEHAT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari dokter, poli, username..."
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button 
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Dokter</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Lengkap & Gelar</th>
                <th className="px-6 py-4">Username Login</th>
                <th className="px-6 py-4">Poliklinik Penugasan</th>
                <th className="px-6 py-4">Identitas SATUSEHAT</th>
                <th className="px-6 py-4 text-center min-w-[140px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && dokters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat data dokter faskes...
                  </td>
                </tr>
              ) : filteredDokters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    {searchQuery ? 'Tidak ada dokter yang cocok dengan pencarian.' : 'Belum ada data dokter terdaftar di faskes ini.'}
                  </td>
                </tr>
              ) : (
                filteredDokters.map((dokter) => (
                  <tr key={dokter.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{dokter.namaLengkap || '-'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {dokter.id.substring(0, 10)}...</div>
                    </td>

                    {/* Username */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 font-semibold">
                      @{dokter.username}
                    </td>

                    {/* Penugasan */}
                    <td className="px-6 py-4">
                      {dokter.role === 'DOKTER_UGD' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>Dokter Emergency UGD</span>
                        </span>
                      ) : dokter.poliklinik ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          <span>{dokter.poliklinik.namaPoli}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500">
                          Lintas Unit / Belum Ditugaskan
                        </span>
                      )}
                    </td>

                    {/* Identitas SATUSEHAT */}
                    <td className="px-6 py-4">
                      {dokter.tenagaMedis?.noIHS ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>IHS: {dokter.tenagaMedis.noIHS}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            NIK: {dokter.tenagaMedis.nik}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Belum Terhubung IHS</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {!dokter.tenagaMedis?.noIHS && (
                          <button 
                            onClick={() => handleSyncIHS(dokter.id, dokter.tenagaMedis?.nik)}
                            disabled={syncingId === dokter.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs rounded-lg transition"
                            title="Sinkronisasi IHS Kemenkes"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingId === dokter.id ? 'animate-spin' : ''}`} />
                            <span>Sync</span>
                          </button>
                        )}

                        <button 
                          onClick={() => openEditModal(dokter)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Data Dokter"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleDelete(dokter.id, dokter.namaLengkap || dokter.username)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Dokter"
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

      {/* ========================================================================= */}
      {/* MODAL MODERN: TAMBAH / EDIT DOKTER BARU                                   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                  {isEditMode ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {isEditMode ? 'Edit Profil Dokter' : 'Tambah Dokter Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pendaftaran nakes dokter faskes terintegrasi SATUSEHAT Kemenkes RI.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
              {/* SECTION 1: NIK & SINKRONISASI SATUSEHAT */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 text-blue-600" />
                    <span>NIK Dokter Kemenkes <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-slate-400">16 digit KTP</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    name="nik"
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="Contoh: 3201010101900001"
                    className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCheckNik}
                    disabled={isCheckingNik || formData.nik.length !== 16}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50 transition"
                  >
                    {isCheckingNik ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengecek...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Cek SATUSEHAT</span>
                      </>
                    )}
                  </button>
                </div>

                {formData.noIHS ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Data Resmi SATUSEHAT Ditemukan</span>
                      </div>
                      <div className="text-xs text-slate-600 font-mono mt-0.5">
                        Practitioner IHS: <strong className="text-emerald-900">{formData.noIHS}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                      Terverifikasi
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Tips: Klik <strong>"Cek SATUSEHAT"</strong> untuk menarik otomatis nama resmi dan nomor IHS dokter dari Kemenkes.
                  </p>
                )}
              </div>

              {/* SECTION 2: IDENTITAS & AKUN LOGIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  required={!isEditMode}
                  value={formData.namaLengkap}
                  onChange={handleInputChange}
                  placeholder="Contoh: dr. Budi Santoso, Sp.A"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Contoh: dr.budi"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Akun {isEditMode ? '(Kosongkan jika tetap)' : '*'}
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isEditMode ? 'Tulis jika ingin ganti' : 'Default: dokter123'}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* SECTION 3: PENUGASAN POLIKLINIK / UGD */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Unit Penugasan di Faskes <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer text-xs font-bold transition ${
                    formData.role === 'DOKTER'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="DOKTER"
                      checked={formData.role === 'DOKTER'}
                      onChange={() => setFormData(prev => ({ ...prev, role: 'DOKTER' }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span>Poliklinik (Rawat Jalan)</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer text-xs font-bold transition ${
                    formData.role === 'DOKTER_UGD'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="DOKTER_UGD"
                      checked={formData.role === 'DOKTER_UGD'}
                      onChange={() => setFormData(prev => ({ ...prev, role: 'DOKTER_UGD', poliklinikId: '' }))}
                      className="w-4 h-4 text-rose-600"
                    />
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Dokter Jaga UGD</span>
                    </div>
                  </label>
                </div>
              </div>

              {formData.role === 'DOKTER' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pilih Poliklinik Penugasan Utama</span>
                  </label>
                  <select
                    name="poliklinikId"
                    value={formData.poliklinikId}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="">-- Lintas Unit / Belum Ditugaskan --</option>
                    {polikliniks.map(poli => (
                      <option key={poli.id} value={poli.id}>{poli.namaPoli} ({poli.kodePoli})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Penugasan Otomatis UGD: </span>
                    Dokter ini akan bertugas menangani pasien gawat darurat dan triase DPJP UGD puskesmas.
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Data Dokter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
