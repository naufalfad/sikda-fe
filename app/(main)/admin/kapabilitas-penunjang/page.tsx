"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  TestTubes,
  Radio,
  Building2,
  Check,
  ExternalLink,
  Save,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import Swal from 'sweetalert2';
import { klinikService } from '@/services/klinik.service';
import { useAuthStore } from '@/store/auth.store';

export default function KapabilitasPenunjangPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'LAB' | 'RAD'>('LAB');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data faskes terisolasi akun yang sedang login
  const [faskes, setFaskes] = useState<any>(null);
  const [masterLab, setMasterLab] = useState<any[]>([]);
  const [standardRad, setStandardRad] = useState<any[]>([]);

  // Local state for capabilities
  const [selectedLabParams, setSelectedLabParams] = useState<string[]>([]);
  const [selectedRadLoinc, setSelectedRadLoinc] = useState<string[]>([]);
  const [defaultLabRujukan, setDefaultLabRujukan] = useState('');
  const [defaultRadRujukan, setDefaultRadRujukan] = useState('');

  // Search & Filter
  const [searchLab, setSearchLab] = useState('');
  const [selectedLabCategory, setSelectedLabCategory] = useState<string>('SEMUA');

  // Load capability data milik faskes sendiri
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await klinikService.getFaskesKapabilitas();
      if (res && res.data) {
        const d = res.data;
        setFaskes(d.faskes);
        if (d.faskes) {
          setSelectedLabParams(d.faskes.labInternalParams || []);
          setSelectedRadLoinc(d.faskes.radiologiInternalLoinc || []);
          setDefaultLabRujukan(d.faskes.defaultLabRujukan || 'UPT Labkesda Kabupaten / RSUD Terdekat');
          setDefaultRadRujukan(d.faskes.defaultRadRujukan || 'Instalasi Radiologi RSUD Terdekat');
        }
        setMasterLab(d.masterLab || []);
        setStandardRad(d.standardRadiologiLoinc || []);
      }
    } catch (err: any) {
      console.error('Gagal memuat kapabilitas faskes:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lab Categories
  const labCategories = useMemo(() => {
    const cats = Array.from(new Set(masterLab.map(m => m.kategori).filter(Boolean)));
    return ['SEMUA', ...cats];
  }, [masterLab]);

  // Filtered Lab Items
  const filteredLab = useMemo(() => {
    return masterLab.filter(item => {
      const matchSearch = (item.parameter || '').toLowerCase().includes(searchLab.toLowerCase()) ||
                          (item.kategori || '').toLowerCase().includes(searchLab.toLowerCase());
      const matchCat = selectedLabCategory === 'SEMUA' || item.kategori === selectedLabCategory;
      return matchSearch && matchCat;
    });
  }, [masterLab, searchLab, selectedLabCategory]);

  // Lab Toggle
  const handleToggleLabParam = (paramName: string) => {
    setSelectedLabParams(prev => {
      if (prev.includes(paramName)) {
        return prev.filter(p => p !== paramName);
      } else {
        return [...prev, paramName];
      }
    });
  };

  // Rad Toggle
  const handleToggleRadLoinc = (kodeLoinc: string) => {
    setSelectedRadLoinc(prev => {
      if (prev.includes(kodeLoinc)) {
        return prev.filter(k => k !== kodeLoinc);
      } else {
        return [...prev, kodeLoinc];
      }
    });
  };

  // Presets Lab
  const applyPresetLab = (type: 'ALL' | 'NONE' | 'RAWAT_INAP' | 'POCT_NON_RAWAT_INAP') => {
    if (type === 'ALL') {
      setSelectedLabParams(masterLab.map(m => m.parameter));
    } else if (type === 'NONE') {
      setSelectedLabParams([]);
    } else if (type === 'RAWAT_INAP') {
      // Standar Rawat Inap
      const allowedKeywords = [
        'hematologi', 'hemoglobin', 'leukosit', 'trombosit', 'hematokrit', 'eritrosit', 'led',
        'golongan darah', 'glukosa', 'asam urat', 'cholesterol', 'trigliserida', 'ureum', 'kreatinin',
        'sgot', 'sgpt', 'urine rutin', 'faeces', 'darah samar', 'kehamilan', 'widal', 'dengue', 'hiv', 'hbsag'
      ];
      const selected = masterLab
        .filter(m => allowedKeywords.some(k => (m.parameter || '').toLowerCase().includes(k)))
        .map(m => m.parameter);
      setSelectedLabParams(Array.from(new Set(selected)));
    } else if (type === 'POCT_NON_RAWAT_INAP') {
      // Standar Non-Rawat Inap / POCT Dasar
      const poctKeywords = ['glukosa sewaktu', 'asam urat', 'cholesterol total', 'urine rutin', 'kehamilan', 'golongan darah', 'hemoglobin'];
      const selected = masterLab
        .filter(m => poctKeywords.some(k => (m.parameter || '').toLowerCase().includes(k)))
        .map(m => m.parameter);
      setSelectedLabParams(Array.from(new Set(selected)));
    }
  };

  // Presets Rad
  const applyPresetRad = (type: 'ALL' | 'NONE' | 'USG_ONLY') => {
    if (type === 'ALL') {
      setSelectedRadLoinc(standardRad.map(r => r.kodeLoinc));
    } else if (type === 'NONE') {
      setSelectedRadLoinc([]);
    } else if (type === 'USG_ONLY') {
      setSelectedRadLoinc(['24558-9', '24627-2']); // USG Abdomen & USG Kebidanan (Standar FKTP/Puskesmas)
    }
  };

  // Save changes (Terkunci Mutlak pada Faskes Sendiri)
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        labInternalParams: selectedLabParams,
        radiologiInternalLoinc: selectedRadLoinc,
        defaultLabRujukan,
        defaultRadRujukan
      };

      const res = await klinikService.updateFaskesKapabilitas(payload);
      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Pengaturan Disimpan',
          text: `Kapabilitas diagnostik ${faskes?.namaFaskes || 'faskes Anda'} berhasil diperbarui. Dokter di faskes ini akan otomatis menggunakan aturan baru.`,
          timer: 2500,
          showConfirmButton: false
        });
        setFaskes(res.data);
      }
    } catch (err: any) {
      console.error('Gagal menyimpan kapabilitas:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-28">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Kendali Diagnostik Mandiri Faskes
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Pengaturan Kapabilitas Penunjang Medis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Atur parameter Laboratorium & Radiologi yang sanggup dikerjakan secara mandiri di faskes ini versus yang harus otomatis dibuatkan rujukan ke Labkesda/RSUD.
          </p>
        </div>

        {/* Status Faskes Terkunci (Tanpa Dropdown) */}
        {faskes && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-950 font-bold text-xs shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span>{faskes.namaFaskes}</span>
          </div>
        )}
      </div>

      {/* FASKES BADGE & INFO BANNER */}
      {faskes && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {faskes.kodeFaskes ? faskes.kodeFaskes.slice(0, 3) : 'FSK'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900">{faskes.namaFaskes}</h2>
                <span className={`px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  faskes.jenisFaskes === 'PUSKESMAS_RAWAT_INAP'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {faskes.jenisFaskes === 'PUSKESMAS_RAWAT_INAP' ? 'Puskesmas Rawat Inap' : 'Puskesmas Non-Rawat Inap'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Kode Faskes Kemenkes: <strong>{faskes.kodeFaskes}</strong> • Seluruh konfigurasi alat mandiri di halaman ini berlaku mutlak hanya untuk faskes Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <div className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 shadow-2xs">
              Lab Mandiri: <strong className="text-emerald-600">{selectedLabParams.length}</strong> Param
            </div>
            <div className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 shadow-2xs">
              Radiologi Mandiri: <strong className="text-indigo-600">{selectedRadLoinc.length}</strong> Modality
            </div>
          </div>
        </div>
      )}

      {/* TABS SWITCHER */}
      <div className="border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('LAB')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'LAB'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <TestTubes className="w-4 h-4 text-indigo-600" />
          Kapabilitas Laboratorium ({selectedLabParams.length}/{masterLab.length} Aktif Internal)
        </button>

        <button
          onClick={() => setActiveTab('RAD')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'RAD'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <Radio className="w-4 h-4 text-indigo-600" />
          Kapabilitas Radiologi ({selectedRadLoinc.length}/{standardRad.length} Aktif Internal)
        </button>
      </div>

      {/* TAB CONTENT: LABORATORIUM */}
      {activeTab === 'LAB' && (
        <div className="space-y-6">
          {/* Quick Presets & Referral Target */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Preset Cepat Kapabilitas Lab
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Terapkan konfigurasi standar faskes dengan 1-klik, atau centang mandiri pada daftar parameter di bawah.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetLab('RAWAT_INAP')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                >
                  Rawat Inap Lengkap
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetLab('POCT_NON_RAWAT_INAP')}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-colors"
                >
                  Non-Rawat Inap / POCT Saja
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetLab('ALL')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetLab('NONE')}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 text-xs font-bold transition-colors"
                >
                  Rujuk Semua Keluar
                </button>
              </div>
            </div>

            {/* Input Default Faskes Rujukan Lab */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Faskes Tujuan Rujukan Lab Default:
              </label>
              <input
                type="text"
                value={defaultLabRujukan}
                onChange={e => setDefaultLabRujukan(e.target.value)}
                placeholder="Contoh: UPT Labkesda Kabupaten / RSUD Terdekat"
                className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 focus:bg-white focus:border-indigo-600 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchLab}
                onChange={e => setSearchLab(e.target.value)}
                placeholder="Cari parameter lab..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-300 focus:border-indigo-600 focus:outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {labCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedLabCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedLabCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table Parameters */}
          <div className="bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-extrabold text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Parameter Pemeriksaan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Satuan & Nilai Rujukan</th>
                    <th className="py-3 px-4">Tarif Retribusi</th>
                    <th className="py-3 px-4 text-center">Alur Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredLab.map(item => {
                    const isInternal = selectedLabParams.includes(item.parameter);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleToggleLabParam(item.parameter)}
                        className={`cursor-pointer transition-colors ${
                          isInternal ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={() => handleToggleLabParam(item.parameter)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded-sm focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {item.parameter}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {item.satuan ? `${item.satuan} • ` : ''}
                          <span className="italic">{item.nilaiRujukan || 'Normal'}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          Rp {(item.hargaTarif || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isInternal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                              <Check className="w-3 h-3 text-emerald-700" />
                              Dikerjakan Mandiri Faskes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 text-[11px] font-bold">
                              <ExternalLink className="w-3 h-3 text-sky-700" />
                              Dirujuk ke Labkesda/RS
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLab.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Tidak ada parameter lab yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RADIOLOGI */}
      {activeTab === 'RAD' && (
        <div className="space-y-6">
          {/* Quick Presets & Referral Target */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Preset Cepat Kapabilitas Radiologi
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sesuaikan dengan kepemilikan alat instalasi radiologi faskes Anda (USG, X-Ray, dll).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetRad('USG_ONLY')}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors"
                >
                  Hanya USG Mandiri
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRad('ALL')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                >
                  Lengkap (X-Ray + USG)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRad('NONE')}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-colors"
                >
                  Rujuk Semua ke RSUD
                </button>
              </div>
            </div>

            {/* Input Default Faskes Rujukan Radiologi */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Faskes Tujuan Rujukan Radiologi Default:
              </label>
              <input
                type="text"
                value={defaultRadRujukan}
                onChange={e => setDefaultRadRujukan(e.target.value)}
                placeholder="Contoh: Instalasi Radiologi RSUD Terdekat"
                className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 focus:bg-white focus:border-indigo-600 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Cards of Standard LOINC Radiologi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardRad.map(rad => {
              const isInternal = selectedRadLoinc.includes(rad.kodeLoinc);
              return (
                <div
                  key={rad.kodeLoinc}
                  onClick={() => handleToggleRadLoinc(rad.kodeLoinc)}
                  className={`p-5 border-2 cursor-pointer transition-all ${
                    isInternal
                      ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] uppercase tracking-wider">
                      LOINC: {rad.kodeLoinc} • {rad.modalitas}
                    </span>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={() => handleToggleRadLoinc(rad.kodeLoinc)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mt-2">
                    {rad.namaPemeriksaan}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Kategori: {rad.kategori} • Target Anatomi: {rad.bodySiteDisplay}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500">Status Alur:</span>
                    {isInternal ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Tersedia Internal Faskes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-200">
                        <ExternalLink className="w-3 h-3 text-sky-600" />
                        Rujuk ke RSUD Terdekat
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Standar FKTP Kemenkes untuk Radiologi:</p>
              <p className="mt-1">
                Puskesmas Non-Rawat Inap umumnya belum memiliki alat radiografi stasioner, sehingga pemeriksaan X-Ray/CT-Scan otomatis dibuatkan surat rujukan ke RSUD. Puskesmas Rawat Inap atau PONED dapat melayani USG Obstetri/Abdomen internal jika telah memiliki probe dan dokter terlatih.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM SAVE ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xs border-t border-gray-200 py-3.5 px-6 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Perubahan pada <strong>{faskes?.namaFaskes}</strong> akan langsung mengontrol tampilan order dokter RME & modul Kasir faskes ini.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Pengaturan Kapabilitas Penunjang
          </button>
        </div>
      </div>
    </div>
  );
}
