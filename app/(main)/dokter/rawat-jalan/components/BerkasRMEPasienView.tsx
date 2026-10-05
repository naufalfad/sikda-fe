"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  FileText, Clock, Calendar, Activity, Pill, Syringe, TestTubes, 
  Stethoscope, AlertCircle, ShieldAlert, CheckCircle2, ChevronDown, 
  ChevronUp, Search, Filter, Printer, Maximize2, Minimize2, 
  X, ArrowLeft, User, MapPin, Phone, CreditCard, Sparkles, 
  Heart, Thermometer, RefreshCw, Loader2, Info, ChevronRight,
  Eye, Check, Copy
} from 'lucide-react';
import { rawatJalanService } from '@/services/rawatJalan.service';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BerkasRMEPasienViewProps {
  noRM: string;
  namaPasien?: string;
  onClose?: () => void;
  onMulaiPeriksa?: (kunjungan?: any) => void;
  kunjunganSaatIni?: any;
  isEmbeddedTab?: boolean;
  isSidePanel?: boolean;
}

export default function BerkasRMEPasienView({
  noRM,
  namaPasien = '',
  onClose,
  onMulaiPeriksa,
  kunjunganSaatIni,
  isEmbeddedTab = false,
  isSidePanel = false,
}: BerkasRMEPasienViewProps) {
  const [pasienData, setPasienData] = useState<any>(null);
  const [kunjungans, setKunjungans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoli, setSelectedPoli] = useState('ALL');
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>({});
  const [isFullWidth, setIsFullWidth] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch full patient history
  const fetchPatientHistory = async () => {
    if (!noRM) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await rawatJalanService.getRiwayatPasienByRM(noRM);
      if (res.success && res.data) {
        setPasienData(res.data);
        const visitList = res.data.kunjungans || [];
        setKunjungans(visitList);
        // By default expand the most recent visit, or all if 1-2 visits
        const initialExpanded: Record<string, boolean> = {};
        visitList.forEach((k: any, idx: number) => {
          initialExpanded[k.id] = idx === 0; // expand latest by default
        });
        setExpandedVisits(initialExpanded);
      } else {
        setError(res.message || 'Gagal mengambil berkas rekam medis.');
      }
    } catch (err: any) {
      console.error('Error fetching RME:', err);
      setError(err.response?.data?.message || err.message || 'Terjadi gangguan koneksi saat mengambil berkas RME.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientHistory();
  }, [noRM]);

  // Extract unique polikliniks for filter
  const poliklinikOptions = useMemo(() => {
    const set = new Set<string>();
    kunjungans.forEach((k) => {
      const name = k.poliklinik?.namaPoli || k.poliTujuan;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [kunjungans]);

  // Filtered visits
  const filteredKunjungans = useMemo(() => {
    return kunjungans.filter((k) => {
      // Poli Filter
      if (selectedPoli !== 'ALL') {
        const poliName = k.poliklinik?.namaPoli || k.poliTujuan || '';
        if (poliName !== selectedPoli) return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const poliMatch = (k.poliklinik?.namaPoli || k.poliTujuan || '').toLowerCase().includes(q);
        const dokterMatch = (k.dokterTujuan?.namaLengkap || '').toLowerCase().includes(q);
        const keluhanMatch = (k.rekamMedis?.keluhanUtama || k.screening?.keluhanUtama || '').toLowerCase().includes(q);
        const diagKlinisMatch = (k.rekamMedis?.diagnosisKlinis || '').toLowerCase().includes(q);
        const icd10Match = (k.diagnosis || []).some((d: any) => 
          (d.icd10?.kode_icd10 || '').toLowerCase().includes(q) || 
          (d.icd10?.nama_diagnosis || '').toLowerCase().includes(q)
        );
        const icd9Match = (k.tindakans || []).some((t: any) => 
          (t.icd9?.kode || t.icd9?.kode_icd9 || '').toLowerCase().includes(q) || 
          (t.icd9?.deskripsi || t.icd9?.nama_prosedur || '').toLowerCase().includes(q)
        );
        const obatMatch = (k.resep || []).some((r: any) => 
          (r.details || []).some((d: any) => (d.obat?.namaObat || '').toLowerCase().includes(q))
        );

        return poliMatch || dokterMatch || keluhanMatch || diagKlinisMatch || icd10Match || icd9Match || obatMatch;
      }

      return true;
    });
  }, [kunjungans, selectedPoli, searchQuery]);

  // Toggle single visit accordion
  const toggleVisit = (id: string) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand / Collapse all
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredKunjungans.forEach((k) => {
      next[k.id] = true;
    });
    setExpandedVisits(next);
  };

  const collapseAll = () => {
    setExpandedVisits({});
  };

  // Calculate age helper
  const calculateAge = (dob: string | Date | undefined) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} Tahun`;
  };

  // Format date helper
  const formatDateIndo = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: id });
    } catch {
      return String(dateStr);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const effectivePatient = pasienData || {
    namaLengkap: namaPasien || 'Pasien',
    noRM: noRM,
  };

  const isFemale = effectivePatient.jenisKelamin?.toLowerCase().startsWith('p') || effectivePatient.jenisKelamin?.toLowerCase().startsWith('f');

  return (
    <div className={`flex flex-col h-full bg-slate-100 text-slate-800 ${isFullWidth ? 'fixed inset-0 z-50 overflow-y-auto' : 'overflow-hidden'}`}>
      
      {/* ─── TOP DOSSIER ACTION BAR & BANNER (Only when standalone view) ─── */}
      {!isEmbeddedTab && (
        <>
          <div className="bg-indigo-900 text-white px-5 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 shrink-0 border-b-2 border-indigo-700">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-none transition-colors border border-indigo-600 flex items-center gap-1.5 text-xs font-bold"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-700/80 rounded-none flex items-center justify-center border border-indigo-500 shadow-inner">
              <FileText className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-white flex items-center gap-2">
                  Berkas Rekam Medis Elektronik (RME)
                </h2>
                <span className="bg-indigo-600/80 text-indigo-200 font-mono text-[10px] font-bold px-2 py-0.5 border border-indigo-500">
                  DOSSIER PASIEN
                </span>
              </div>
              <p className="text-[11px] text-indigo-200">
                Pemeriksaan Historis Komprehensif Antar-Poli & Tenaga Medis
              </p>
            </div>
          </div>
        </div>

        {/* Action Right */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Start Examination CTA if patient is currently in queue */}
          {onMulaiPeriksa && (
            <button
              type="button"
              onClick={() => onMulaiPeriksa(kunjunganSaatIni)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-1.5 text-xs shadow-md border border-emerald-400 flex items-center gap-2 transition-transform active:scale-95 animate-pulse"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Mulai Pemeriksaan Sekarang</span>
            </button>
          )}

          {/* Toggle Fullscreen / Wide mode */}
          {!isEmbeddedTab && (
            <button
              type="button"
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="p-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-none transition-colors border border-indigo-600 text-xs flex items-center gap-1 font-bold"
              title={isFullWidth ? "Kecilkan Layar" : "Maksimalkan Layar"}
            >
              {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullWidth ? "Normalkan" : "Layar Penuh"}</span>
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchPatientHistory}
            disabled={isLoading}
            className="p-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-none transition-colors border border-indigo-600 text-xs flex items-center gap-1 font-bold"
            title="Muat Ulang Berkas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── PATIENT IDENTITY BANNER (COMPREHENSIVE) ─── */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Identity info */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className={`w-13 h-13 p-3 rounded-none flex items-center justify-center font-black text-xl shadow-sm border shrink-0 ${
              isFemale 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <User className="w-7 h-7" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {effectivePatient.namaLengkap}
                </h1>
                <span className="bg-slate-800 text-white font-mono font-bold text-xs px-2 py-0.5 border border-slate-900 shadow-sm">
                  RM: {effectivePatient.noRM}
                </span>
                {effectivePatient.nik && (
                  <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold px-2 py-0.5 border border-slate-300">
                    NIK: {effectivePatient.nik}
                  </span>
                )}
                {effectivePatient.penjamin?.namaPenjamin && (
                  <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 border border-blue-200 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    {effectivePatient.penjamin.namaPenjamin} ({effectivePatient.penjamin.noKartu || 'Aktif'})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                <span>{calculateAge(effectivePatient.tanggalLahir)}</span>
                <span className="text-slate-300">•</span>
                <span>{effectivePatient.jenisKelamin === 'L' ? 'Laki-laki' : effectivePatient.jenisKelamin === 'P' ? 'Perempuan' : effectivePatient.jenisKelamin || '-'}</span>
                <span className="text-slate-300">•</span>
                <span>Gol. Darah: <strong className="text-slate-900">{effectivePatient.golonganDarah || '-'}</strong></span>
                {effectivePatient.kontak?.noHp && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {effectivePatient.kontak.noHp}
                    </span>
                  </>
                )}
                {effectivePatient.alamat?.alamatLengkap && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-xs" title={effectivePatient.alamat.alamatLengkap}>
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {effectivePatient.alamat.alamatLengkap}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Kunjungan</span>
              <span className="text-lg font-black text-slate-800 font-mono">{kunjungans.length}</span>
            </div>

            {/* Riwayat Alergi Alert */}
            {effectivePatient.riwayatAlergi ? (
              <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 text-left max-w-xs">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Waspada Alergi
                </span>
                <p className="text-xs font-bold text-rose-900 truncate" title={effectivePatient.riwayatAlergi}>
                  {effectivePatient.riwayatAlergi}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-left">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Status Alergi
                </span>
                <span className="text-xs font-bold text-emerald-800">Tidak Ada Alergi Tercatat</span>
              </div>
            )}
          </div>

        </div>
      </div>
      </>
      )}

      {/* ─── DOSSIER CONTROLS & FILTER TOOLBAR ─── */}
      <div className="bg-slate-200/90 border-b border-slate-300 px-5 py-2.5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Search bar & filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari keluhan, diagnosa ICD-10, tindakan, obat, atau dokter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-none pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Poli selector */}
            <div className="flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedPoli}
                onChange={(e) => setSelectedPoli(e.target.value)}
                className="bg-white border border-slate-300 rounded-none py-1.5 px-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-inner"
              >
                <option value="ALL">Semua Poliklinik ({kunjungans.length})</option>
                {poliklinikOptions.map((poli) => (
                  <option key={poli} value={poli}>{poli}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Expand / Collapse controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold hidden sm:inline">
              Menampilkan <strong>{filteredKunjungans.length}</strong> dari {kunjungans.length} kunjungan
            </span>
            <div className="flex items-center gap-1 border-l border-slate-300 pl-3">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-sm"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-sm"
              >
                Ciutkan Semua
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── MAIN DOSSIER SCROLLABLE CONTENT ─── */}
      <div className={`flex-1 overflow-y-auto ${isSidePanel ? 'p-2.5 sm:p-3' : 'p-4 sm:p-6'} bg-slate-100`}>
        <div className="max-w-7xl mx-auto space-y-5" ref={printAreaRef}>
          
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white border border-slate-200 p-8 shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <h4 className="font-black text-slate-800 text-base uppercase tracking-wider mb-1">
                Memuat Berkas Rekam Medis...
              </h4>
              <p className="text-xs text-slate-500">
                Menghimpun seluruh catatan kunjungan, SOAP, diagnosa ICD-10, tindakan, dan resep farmasi
              </p>
            </div>
          ) : error ? (
            <div className="bg-white border-2 border-red-200 p-8 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h4 className="font-black text-slate-800 text-base mb-1">Gagal Membuka Berkas RME</h4>
              <p className="text-xs text-red-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchPatientHistory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 uppercase tracking-wider inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
              </button>
            </div>
          ) : kunjungans.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-none flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">
                Belum Ada Riwayat Kunjungan Terdahulu
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                Ini merupakan kunjungan perdana pasien di sistem elektronik atau belum ada rekam medis sebelumnya yang telah diselesaikan.
              </p>
              {onMulaiPeriksa && (
                <button
                  type="button"
                  onClick={() => onMulaiPeriksa(kunjunganSaatIni)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 text-xs shadow-md inline-flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" /> Mulai Pemeriksaan Pertama
                </button>
              )}
            </div>
          ) : filteredKunjungans.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 text-center shadow-sm">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tidak ada riwayat yang cocok dengan kata kunci &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedPoli('ALL'); }}
                className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
              >
                Reset Pencarian & Filter
              </button>
            </div>
          ) : (
            // ─── TIMELINE CARDS ───
            filteredKunjungans.map((kunjungan, index) => {
              const isExpanded = Boolean(expandedVisits[kunjungan.id]);
              const poliName = kunjungan.poliklinik?.namaPoli || kunjungan.poliTujuan || 'Poliklinik';
              const isGigi = poliName.toLowerCase().includes('gigi');
              const tglStr = formatDateIndo(kunjungan.tanggalRegistrasi || kunjungan.createdAt);
              const screening = kunjungan.screening;
              const soap = kunjungan.rekamMedis;
              const diagnoses = kunjungan.diagnosis || [];
              const tindakans = kunjungan.tindakans || [];
              const resepList = (kunjungan.resep || []).flatMap((r: any) => r.details || []);
              const labOrders = kunjungan.orderLab?.details || [];

              return (
                <div
                  key={kunjungan.id}
                  className="bg-white border-2 border-slate-200 shadow-sm transition-all hover:border-slate-300"
                >
                  {/* Card Header (Clickable Accordion) */}
                  <div
                    onClick={() => toggleVisit(kunjungan.id)}
                    className={`${isSidePanel ? 'p-3 sm:p-4' : 'p-4 sm:p-5'} cursor-pointer bg-white hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Badge Urutan / Icon */}
                      <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border ${
                        index === 0 
                          ? 'bg-indigo-600 text-white border-indigo-700' 
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        {index === 0 ? <Sparkles className="w-5 h-5 text-indigo-200" /> : `#${filteredKunjungans.length - index}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-700 font-mono">
                            {tglStr}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {kunjungan.jamRegistrasi || '08:00'} WIB
                          </span>
                          {index === 0 && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-300 uppercase">
                              Kunjungan Terakhir
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-indigo-600" />
                            {poliName}
                          </h3>
                          <span className="text-slate-300">|</span>
                          <span className="text-xs text-slate-600 font-medium">
                            Dokter: <strong className="text-slate-800">{kunjungan.dokterTujuan?.namaLengkap || 'dr. Pemeriksa'}</strong>
                          </span>
                        </div>

                        {/* Quick preview snippet when collapsed */}
                        {!isExpanded && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            {(soap?.keluhanUtama || screening?.keluhanUtama) && (
                              <span className="italic truncate max-w-md">
                                &quot;{soap?.keluhanUtama || screening?.keluhanUtama}&quot;
                              </span>
                            )}
                            {diagnoses.length > 0 && (
                              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 font-mono text-[11px]">
                                {diagnoses[0].icd10?.kode_icd10} - {diagnoses[0].icd10?.nama_diagnosis}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side status & toggle */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Status</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          {kunjungan.statusKunjungan}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-none bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Card Expanded Detail Body */}
                  {isExpanded && (
                    <div className={`${isSidePanel ? 'p-3 sm:p-4 space-y-4' : 'p-5 sm:p-6 space-y-6'} bg-slate-50/70 border-t border-slate-200`}>
                      
                      {/* 1. TTV & VITAL SIGNS (Screening) */}
                      {screening && (
                        <div className="bg-white border border-slate-200 p-4 shadow-sm">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            Tanda-Tanda Vital & Triase (Screening Perawat)
                          </h4>

                          <div className={`grid gap-2.5 text-center ${
                            isSidePanel 
                              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                              : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
                          }`}>
                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">Tekanan Darah</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.tekananDarahSistolik && screening.tekananDarahDiastolik
                                  ? `${screening.tekananDarahSistolik}/${screening.tekananDarahDiastolik}`
                                  : '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">mmHg</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">Detak Jantung</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.detakJantung || screening.nadi || '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">bpm</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">Pernapasan (RR)</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.pernapasan || '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">x/menit</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">Suhu Tubuh</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.suhuTubuh ? `${screening.suhuTubuh}°C` : '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">Celsius</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">SpO2</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.saturasiO2 ? `${screening.saturasiO2}%` : '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">Oksigen</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">BB / TB</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.beratBadan || '-'} kg / {screening.tinggiBadan || '-'} cm
                              </strong>
                              <span className="block text-[9px] text-slate-400">Antropometri</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase">Skala Nyeri</span>
                              <strong className="text-sm font-black text-slate-800 font-mono">
                                {screening.skalaNyeri !== undefined && screening.skalaNyeri !== null ? `${screening.skalaNyeri}/10` : '-'}
                              </strong>
                              <span className="block text-[9px] text-slate-400">NRS</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. CATATAN SOAP (SPACIOUS 4 QUADRANTS) */}
                      <div className="bg-white border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Catatan Klinis Terpadu (SOAP Dokter)
                          </h4>
                          {kunjungan.dokterTujuan?.namaLengkap && (
                            <span className="text-xs font-bold text-slate-500">
                              Ditulis oleh: {kunjungan.dokterTujuan.namaLengkap}
                            </span>
                          )}
                        </div>

                        {soap ? (
                          <div className={`grid gap-4 ${isSidePanel ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                            
                            {/* SUBJEKTIF (S) */}
                            <div className="border border-blue-200 bg-blue-50/20 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-blue-600" /> S - Subjektif (Anamnesis)
                                </span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Keluhan Utama</span>
                                  <p className="font-extrabold text-slate-900 bg-white p-2 border border-slate-200 shadow-inner">
                                    {soap.keluhanUtama || screening?.keluhanUtama || '-'}
                                  </p>
                                </div>
                                {soap.riwayatPenyakitSekarang && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Riwayat Penyakit Sekarang (RPS)</span>
                                    <p className="text-slate-700 bg-white p-2 border border-slate-200 shadow-inner whitespace-pre-wrap">
                                      {soap.riwayatPenyakitSekarang}
                                    </p>
                                  </div>
                                )}
                                {soap.riwayatPenyakitDahulu && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Riwayat Penyakit Dahulu (RPD)</span>
                                    <p className="text-slate-700 bg-white p-2 border border-slate-200 shadow-inner">
                                      {soap.riwayatPenyakitDahulu}
                                    </p>
                                  </div>
                                )}
                                {soap.riwayatAlergi && (
                                  <div>
                                    <span className="text-[10px] font-bold text-rose-500 uppercase block">Riwayat Alergi</span>
                                    <p className="text-rose-900 font-bold bg-rose-50/50 p-2 border border-rose-200">
                                      {soap.riwayatAlergi}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* OBJEKTIF (O) */}
                            <div className="border border-emerald-200 bg-emerald-50/20 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> O - Objektif (Pemeriksaan Fisik)
                                </span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white p-2 border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Keadaan Umum</span>
                                    <span className="font-bold text-slate-800">{soap.keadaanUmum || '-'}</span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kesadaran</span>
                                    <span className="font-bold text-slate-800">{soap.kesadaran || '-'}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pemeriksaan Fisik Terperinci</span>
                                  <p className="text-slate-800 bg-white p-2.5 border border-slate-200 shadow-inner min-h-[70px] whitespace-pre-wrap leading-relaxed">
                                    {soap.pemeriksaanFisik || 'Tidak ada catatan khusus.'}
                                  </p>
                                </div>
                                {isGigi && soap.dmft && (
                                  <div className="bg-amber-50 border border-amber-200 p-2 text-xs">
                                    <span className="font-bold text-amber-900 block mb-1">Skor Indeks DMF-T:</span>
                                    <span className="font-mono text-slate-800">
                                      D: {soap.dmft.d || 0} | M: {soap.dmft.m || 0} | F: {soap.dmft.f || 0} | Total: {soap.dmft.total || 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ASESMEN (A) */}
                            <div className="border border-amber-200 bg-amber-50/20 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5 text-amber-600" /> A - Asesmen & Diagnosa
                                </span>
                              </div>
                              <div className="space-y-2.5 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Diagnosis Klinis / Ringkasan</span>
                                  <p className="font-extrabold text-slate-900 bg-white p-2 border border-slate-200 shadow-inner">
                                    {soap.diagnosisKlinis || '-'}
                                  </p>
                                </div>

                                {/* ICD-10 List */}
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Kode Diagnosa ICD-10 ({diagnoses.length})
                                  </span>
                                  {diagnoses.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {diagnoses.map((d: any) => (
                                        <div key={d.id} className="bg-white p-2 border border-slate-200 shadow-sm flex items-start justify-between gap-2">
                                          <div>
                                            <span className="font-mono font-black text-rose-600 text-xs mr-2">
                                              {d.icd10?.kode_icd10}
                                            </span>
                                            <span className="font-bold text-slate-800 text-xs">
                                              {d.icd10?.nama_diagnosis}
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 shrink-0 ${
                                            d.jenisDiagnosis === 'PRIMER' 
                                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                                          }`}>
                                            {d.jenisDiagnosis || 'PRIMER'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic block bg-white p-2 border border-slate-200">
                                      Tidak ada kode ICD-10 tersimpan.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* PLAN (P) */}
                            <div className="border border-purple-200 bg-purple-50/20 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-purple-600" /> P - Plan & Rencana Terapi
                                </span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rencana Terapi / Edukasi Pasien</span>
                                  <p className="text-slate-800 bg-white p-2.5 border border-slate-200 shadow-inner min-h-[60px] whitespace-pre-wrap leading-relaxed">
                                    {soap.rencanaTerapi || 'Tidak ada rencana tertulis.'}
                                  </p>
                                </div>
                                {soap.instruksiMedis && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Instruksi Medis / Anjuran Dokter</span>
                                    <p className="text-slate-800 bg-white p-2 border border-slate-200 shadow-inner whitespace-pre-wrap">
                                      {soap.instruksiMedis}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-400 text-xs italic">
                            Catatan SOAP tidak tersedia untuk kunjungan ini.
                          </div>
                        )}
                      </div>

                      {/* 3. TINDAKAN MEDIS (ICD-9-CM) & LABORATORIUM */}
                      <div className={`grid gap-4 ${isSidePanel ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                        
                        {/* Tindakan (ICD-9) */}
                        <div className="bg-white border border-slate-200 p-4 shadow-sm">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Syringe className="w-3.5 h-3.5 text-blue-600" />
                              Tindakan Medis (ICD-9-CM)
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 font-bold">
                              {tindakans.length} Prosedur
                            </span>
                          </h4>

                          {tindakans.length > 0 ? (
                            <div className="space-y-2">
                              {tindakans.map((t: any) => (
                                <div key={t.id} className="p-2.5 bg-slate-50 border border-slate-200 text-xs">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono font-black text-blue-700">
                                      {t.icd9?.kode || t.icd9?.kode_icd9}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      Pelaksana: {t.pelaksanaTeks || 'Dokter'}
                                    </span>
                                  </div>
                                  <p className="font-bold text-slate-800 mt-1">
                                    {t.icd9?.deskripsi || t.icd9?.nama_prosedur}
                                  </p>
                                  {t.catatanTindakan && (
                                    <p className="text-[11px] text-slate-500 italic mt-1 bg-white p-1 border border-slate-200">
                                      Catatan: {t.catatanTindakan}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 border border-slate-200">
                              Tidak ada tindakan medis / prosedur yang dilakukan.
                            </p>
                          )}
                        </div>

                        {/* Order Laboratorium */}
                        <div className="bg-white border border-slate-200 p-4 shadow-sm">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <TestTubes className="w-3.5 h-3.5 text-amber-600" />
                              Pemeriksaan Laboratorium
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 font-bold">
                              {labOrders.length} Parameter
                            </span>
                          </h4>

                          {labOrders.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {labOrders.map((d: any, idx: number) => (
                                <div key={idx} className="p-2 bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800">{d.parameter}</span>
                                    {d.satuan && <span className="text-slate-400 text-[10px] ml-1">({d.satuan})</span>}
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-mono font-black ${d.statusKritis ? 'text-red-600' : 'text-slate-800'}`}>
                                      {d.nilaiHasil || 'Menunggu Hasil'}
                                    </span>
                                    {d.nilaiRujukan && (
                                      <span className="block text-[9px] text-slate-400">Ruj: {d.nilaiRujukan}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 border border-slate-200">
                              Tidak ada pemeriksaan laboratorium pada kunjungan ini.
                            </p>
                          )}
                        </div>

                      </div>

                      {/* 4. RESEP OBAT & BMHP */}
                      <div className="bg-white border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-teal-600" />
                            Terapi Obat & BMHP yang Diresepkan ({resepList.length} Item)
                          </h4>
                        </div>

                        {resepList.length > 0 ? (
                          <div className={`grid gap-3 ${isSidePanel ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                            {resepList.map((item: any, i: number) => (
                              <div key={i} className="bg-slate-50 border border-slate-200 p-3 shadow-inner text-xs flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <h5 className="font-black text-slate-800 leading-snug">
                                      {item.obat?.namaObat || 'Obat'}
                                    </h5>
                                    <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 border border-teal-200 shrink-0 font-mono">
                                      {item.jumlah} {item.obat?.satuan || 'Pcs'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-bold bg-white p-1.5 border border-slate-200 mb-1.5">
                                    Signa: {item.aturanPakai || 'Sesuai petunjuk dokter'}
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-200 pt-1 mt-1">
                                  <span>{item.obat?.sediaan || 'Sediaan'}</span>
                                  {item.noBatch && <span>Batch: {item.noBatch}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 border border-slate-200">
                            Tidak ada resep obat yang diterbitkan pada kunjungan ini.
                          </p>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      </div>

    </div>
  );
}
