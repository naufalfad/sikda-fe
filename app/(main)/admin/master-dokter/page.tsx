'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
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
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    password: '',
    poliklinikId: '',
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
      poliklinikId: '',
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
      password: '', // Leave blank unless they want to change it
      poliklinikId: dokter.poliklinikId || '',
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
          poliklinikId: formData.poliklinikId,
          nik: formData.nik
        });
      } else {
        await createDokter(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus dokter ini?')) {
      try {
        await deleteDokter(id);
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus dokter');
      }
    }
  };

  const handleSyncIHS = async (userId: string, existingNik?: string) => {
    const nik = window.prompt("Masukkan NIK Dokter (16 digit):", existingNik || "");
    if (!nik) return; // User cancelled
    
    if (nik.length !== 16) {
      alert('NIK harus terdiri dari 16 digit angka!');
      return;
    }
    
    setSyncingId(userId);
    try {
      const store = useDokterStore.getState();
      await store.syncDokterIHS(nik, userId);
      alert('Berhasil sinkronisasi IHS Dokter!');
    } catch (error: any) {
      alert(error.message || 'Gagal sinkronisasi IHS');
    } finally {
      setSyncingId(null);
    }
  };

  const handleCheckNik = async () => {
    if (formData.nik.length !== 16) {
      alert("NIK harus 16 digit");
      return;
    }
    
    try {
      const data = await checkIHSNik(formData.nik);
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          namaLengkap: data.data.practitionerName,
          noIHS: data.data.ihsNumber 
        }));
        alert("Berhasil menarik data dari SATUSEHAT!");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menarik data dari SATUSEHAT");
    }
  };

  const filteredDokters = dokters.filter(d => 
    d.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {user?.faskes?.namaFaskes && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              {user.faskes.namaFaskes}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Master Dokter
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola data dokter, akses login, dan penugasan poliklinik {user?.faskes?.namaFaskes ? `di ${user.faskes.namaFaskes}` : 'faskes'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dokter..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-none hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Dokter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-sm font-medium text-gray-600 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Lengkap & Gelar</th>
                <th className="px-6 py-4 font-semibold">Username Login</th>
                <th className="px-6 py-4 font-semibold">Poliklinik Penugasan</th>
                <th className="px-6 py-4 font-semibold">Identitas SATUSEHAT</th>
                <th className="px-6 py-4 font-semibold text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && dokters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Memuat data dokter...
                  </td>
                </tr>
              ) : filteredDokters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada dokter yang cocok dengan pencarian.' : 'Belum ada data dokter.'}
                  </td>
                </tr>
              ) : (
                filteredDokters.map((dokter) => (
                  <tr key={dokter.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{dokter.namaLengkap || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{dokter.username}</td>
                    <td className="px-6 py-4">
                      {dokter.poliklinik ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-blue-100 text-blue-800">
                          {dokter.poliklinik.namaPoli}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-gray-100 text-gray-800">
                          Belum Ditugaskan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {dokter.tenagaMedis?.noIHS ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            IHS: {dokter.tenagaMedis.noIHS}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">NIK: {dokter.tenagaMedis.nik}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Belum Tersinkronisasi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {!dokter.tenagaMedis?.noIHS && (
                          <button 
                            onClick={() => handleSyncIHS(dokter.id, dokter.tenagaMedis?.nik)}
                            disabled={syncingId === dokter.id}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium text-xs rounded-none transition-colors w-full sm:w-auto text-center"
                            title="Sync IHS Kemenkes"
                          >
                            {syncingId === dokter.id ? 'Sync...' : 'Sync IHS'}
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(dokter)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-none transition-colors flex-1"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(dokter.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs rounded-none transition-colors flex-1"
                          title="Hapus"
                        >
                          Hapus
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-none shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode ? 'Edit Dokter' : 'Tambah Dokter Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Dokter * <span className="text-xs font-normal text-gray-500">(Wajib 16 digit untuk sinkronisasi IHS)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="nik"
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({...prev, nik: e.target.value.replace(/[^0-9]/g, '')}))}
                    placeholder="Masukkan 16 digit NIK"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCheckNik}
                    disabled={isLoading || formData.nik.length !== 16}
                    className="px-3 py-2 bg-blue-100 text-blue-700 font-medium text-sm rounded-none border border-blue-200 hover:bg-blue-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isLoading ? 'Mengecek...' : 'Cek SATUSEHAT'}
                  </button>
                </div>
              </div>
              
              {formData.noIHS && (
                <div className="bg-green-50 p-3 rounded-none border border-green-200 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-green-700 font-medium">Data Kemenkes Ditemukan!</span>
                    <br />
                    <span className="text-gray-600 font-mono mt-1 inline-block">ID IHS: {formData.noIHS}</span>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  name="namaLengkap"
                  required={!isEditMode}
                  value={formData.namaLengkap}
                  onChange={handleInputChange}
                  placeholder="Bisa dikosongkan (Akan otomatis dari Kemenkes)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Contoh: dr.budi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Login {isEditMode ? '(Kosongkan jika tidak diubah)' : '* (Akan di-set ke "dokter123" jika kosong)'}
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isEditMode ? "Tulis password baru" : "dokter123"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tugaskan ke Poliklinik</label>
                <select
                  name="poliklinikId"
                  value={formData.poliklinikId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Tidak Ditugaskan / Bebas --</option>
                  {polikliniks.map(poli => (
                    <option key={poli.id} value={poli.id}>{poli.namaPoli}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? 'Memvalidasi ke SATUSEHAT...' : 'Simpan Data'}
                </button>
              </div>
              
              {isLoading && (
                <div className="text-xs text-blue-600 mt-2 text-right flex items-center justify-end gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Sedang mengecek NIK ke server Kemenkes...
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
