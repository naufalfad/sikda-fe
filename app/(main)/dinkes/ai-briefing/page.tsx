"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Building2,
  Globe2,
  Calendar,
  Filter,
  RefreshCw,
  Copy,
  Printer,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Check,
  Activity,
  BedDouble,
  Pill,
  Wrench,
  Users,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Clock,
  BookOpen,
  LayoutDashboard,
  Eye,
  Bookmark,
  Share2,
  ExternalLink,
  HelpCircle,
  FileDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dinkesService, FaskesItem, AiReportResponse } from '@/services/dinkes.service';
import MermaidDiagram from '@/components/dinkes/MermaidDiagram';
import AcmInfographics from '@/components/dinkes/AcmInfographics';

/**
 * Normalisasi format tabel Markdown agar selalu memiliki baris terpisah
 * dan diawali dengan double newline, sehingga diparsing menjadi HTML table dengan benar.
 */
function normalizeMarkdownTables(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let text = content;

  // 1. Transform any "Sajikan / Berikut Tabel X:" or "- Sajikan Tabel X:" into a clean markdown heading "### Tabel X\n\n|"
  text = text.replace(
    /(?:^|\n)\s*[-*]?\s*(?:(?:Sajikan|Berikut(?: adalah)?)\s+)?(?:\*\*)?(Tabel[^*\n:|]+)(?:\*\*)?:?\s*\|/gi,
    (_match, title) => `\n\n### ${title.trim()}\n\n|`
  );

  // If a heading like "### Tabel ..." is directly followed by "|" without newlines
  text = text.replace(/(###\s*[^\n|]+?)\s*\|/g, '$1\n\n|');

  // 2. Process line by line
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    let line = rawLine;

    // Track code blocks (e.g. ```mermaid) so we don't alter code block lines
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // Check if line contains a table delimiter: |---|---|
    const delimMatch = line.match(/\|(?:\s*:?-{2,}:?\s*\|)+/);

    if (delimMatch) {
      // Extract prefix text before the table if any (e.g. "Catatan: | col1 | col2 |")
      const firstPipeIdx = line.indexOf('|');
      if (firstPipeIdx > 0) {
        const prefix = line.substring(0, firstPipeIdx).trim();
        if (prefix.length > 0) {
          processedLines.push(prefix);
          processedLines.push('');
        }
        line = line.substring(firstPipeIdx);
      }

      // Separate delimiter from previous text/header and subsequent text/data
      line = line.replace(/(\|\s*)(\|(?:\s*:?-+:?\s*\|)+)/g, '$1\n$2\n');
      line = line.replace(/((\|(?:(?:\s*:?-+:?\s*)\|)+)\s*)(\|)/g, '$1\n$3');

      // Separate rows by | | or ||
      line = line.replace(/\|\s*\|/g, '|\n|');

      const splitSubLines = line.split('\n');
      for (const sub of splitSubLines) {
        const trimmedSub = sub.trim();
        if (trimmedSub) {
          processedLines.push(trimmedSub);
        }
      }
    } else {
      // If line doesn't contain delimiter, but contains "| ... | | ... |"
      if (line.includes('|') && line.match(/\|\s*\|/)) {
        line = line.replace(/\|\s*\|/g, '|\n|');
        const splitSubLines = line.split('\n');
        for (const sub of splitSubLines) {
          const trimmedSub = sub.trim();
          if (trimmedSub) {
            processedLines.push(trimmedSub);
          }
        }
      } else {
        processedLines.push(line);
      }
    }
  }

  // 3. Ensure proper spacing around tables for GFM / remark-gfm:
  // - A blank line before the table header
  // - A blank line after the table
  const finalLines: string[] = [];
  inCodeBlock = false;
  for (let i = 0; i < processedLines.length; i++) {
    const cur = processedLines[i];
    const trimmed = cur.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      finalLines.push(cur);
      continue;
    }

    if (inCodeBlock) {
      finalLines.push(cur);
      continue;
    }

    const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');

    if (isTableLine) {
      // Check if previous line is non-table and non-empty
      if (finalLines.length > 0) {
        const prev = finalLines[finalLines.length - 1].trim();
        if (prev.length > 0 && !(prev.startsWith('|') && prev.endsWith('|'))) {
          finalLines.push('');
        }
      }
      finalLines.push(trimmed);

      // Check if next line is non-table and non-empty
      if (i < processedLines.length - 1) {
        const next = processedLines[i + 1].trim();
        if (next.length > 0 && !(next.startsWith('|') && next.endsWith('|'))) {
          finalLines.push('');
        }
      }
    } else {
      finalLines.push(cur);
    }
  }

  // 4. Clean stray "Sajikan" commands at start of lines
  let result = finalLines.join('\n');
  result = result.replace(/^[ \t]*[-*]?\s*Sajikan\s+/gim, '');

  return result.trim();
}

export default function DinkesAiBriefingPage() {
  const searchParams = useSearchParams();
  const initialFaskesId = searchParams.get('faskesId') || '';

  // Tab Scope State: 'WILAYAH' | 'FASKES'
  const [scope, setScope] = useState<'WILAYAH' | 'FASKES'>(initialFaskesId ? 'FASKES' : 'WILAYAH');

  // Filter States
  const [faskesList, setFaskesList] = useState<FaskesItem[]>([]);
  const [selectedFaskesId, setSelectedFaskesId] = useState<string>(initialFaskesId);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('ALL');
  const [periode, setPeriode] = useState<'HARI_INI' | '7_HARI' | '30_HARI'>('30_HARI');

  // View Mode: 'COMPREHENSIVE' | 'REPORT_ONLY' | 'VISUAL_ONLY'
  const [viewMode, setViewMode] = useState<'COMPREHENSIVE' | 'REPORT_ONLY' | 'VISUAL_ONLY'>('COMPREHENSIVE');

  // Report & Loading States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [reportData, setReportData] = useState<AiReportResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawMetrics, setShowRawMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load list of Faskes for selection
  useEffect(() => {
    const loadFaskes = async () => {
      try {
        const list = await dinkesService.getFaskesList();
        setFaskesList(list);
        if (!selectedFaskesId && list.length > 0) {
          setSelectedFaskesId(list[0].id);
        }
      } catch (err) {
        console.error('Gagal memuat daftar faskes:', err);
      }
    };
    loadFaskes();
  }, []);

  // Sync initial query param if present
  useEffect(() => {
    if (initialFaskesId) {
      setScope('FASKES');
      setSelectedFaskesId(initialFaskesId);
    }
  }, [initialFaskesId]);

  // Unique Kecamatans
  const kecamatanList = Array.from(
    new Set(faskesList.map((f) => f.wilayahKecamatan).filter((k) => k && k !== '-'))
  ).sort();

  // Calculate start/end date strings based on selected period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (periode === 'HARI_INI') {
      start.setHours(0, 0, 0, 0);
    } else if (periode === '7_HARI') {
      start.setDate(end.getDate() - 7);
    } else {
      start.setDate(end.getDate() - 30);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setError(null);
    setLoading(true);
    setReportData(null);

    const dates = getDateRange();

    try {
      if (scope === 'WILAYAH') {
        setLoadingStep('Mengagregasi indikator makro se-kabupaten...');
        await new Promise((r) => setTimeout(r, 500));
        setLoadingStep('Menganalisis matriks logistik FEFO & jejaring rotasi dokter...');
        const res = await dinkesService.getWilayahAiSitRep({
          startDate: dates.startDate,
          endDate: dates.endDate,
          kecamatan: selectedKecamatan === 'ALL' ? undefined : selectedKecamatan
        });
        setReportData(res);
      } else {
        if (!selectedFaskesId) {
          setError('Silakan pilih fasilitas kesehatan terlebih dahulu.');
          setLoading(false);
          return;
        }
        setLoadingStep('Menghimpun data operasional & kelaikan sarpras alkes...');
        await new Promise((r) => setTimeout(r, 500));
        setLoadingStep('Menganalisis indikator pelayanan & menyusun laporan audit mendalam...');
        const res = await dinkesService.getFaskesAiReport(selectedFaskesId, {
          startDate: dates.startDate,
          endDate: dates.endDate
        });
        setReportData(res);
      }
    } catch (err: any) {
      console.error('Error generating AI report:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kendala saat menghasilkan laporan AI. Pastikan server terhubung ke layanan AI.'
      );
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopy = () => {
    if (!reportData?.reportMarkdown) return;
    const textToCopy = normalizeMarkdownTables(reportData.reportMarkdown);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentFaskesObj = faskesList.find((f) => f.id === selectedFaskesId);
  const activeFaskesName = currentFaskesObj?.namaFaskes || 'Puskesmas Terpilih';
  const activeDocTitle =
    scope === 'WILAYAH'
      ? 'LAPORAN SITUASI KESEHATAN MAKRO WILAYAH (REGIONAL HEALTH SITREP)'
      : `LAPORAN AUDIT OPERASIONAL & KELAIKAN FASILITAS: ${activeFaskesName.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800 antialiased">

      {/* ─── PRINT-ONLY OFFICIAL MASTHEAD ─── */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-800 uppercase tracking-wider">
          <span>PEMERINTAH KABUPATEN BOGOR • DINAS KESEHATAN</span>
          <span>DOKUMEN RESMI AUDIT OPERASIONAL FASILITAS</span>
        </div>
        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
          Sistem Informasi Kesehatan Daerah (SIKDA) Terpadu • Pusat Analitika & Pengendalian Mutu Fasilitas
        </div>
      </div>

      {/* ─── HEADER BANNER (EXECUTIVE DINKES THEME) ─── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white pt-8 pb-14 px-6 lg:px-8 border-b border-slate-700 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 text-slate-950 mt-1 shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 text-[11px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Modul Pengambil Kebijakan Dinkes
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Zero PII • Standar Privasi Terlindungi
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Audit Eksekutif Faktual
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
                  AI Automated Executive Briefing & Facility Audit
                </h1>
                <p className="text-slate-300 text-sm font-medium mt-1 max-w-2xl leading-relaxed">
                  Laporan intelijen operasional komprehensif untuk pengambil kebijakan Dinas Kesehatan. Menyajikan audit mendalam beban kerja nakes, ketersediaan tempat tidur (BOR), kelaikan sarpras alkes, tata kelola logistik farmasi FEFO, dan surveilans morbiditas ICD-10 berbasis data aktual database.
                </p>
              </div>
            </div>

            {/* Scope Toggle Tabs */}
            <div className="bg-slate-800/80 p-1.5 border border-slate-700 inline-flex self-start md:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setScope('WILAYAH')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                  scope === 'WILAYAH'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Globe2 className="w-4 h-4" />
                SitRep Wilayah Makro
              </button>
              <button
                type="button"
                onClick={() => setScope('FASKES')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                  scope === 'FASKES'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Audit Faskes Tunggal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTROL TOOLBAR & FILTER CARD ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 print:hidden">
        <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Context Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* If Faskes scope: Dropdown Faskes */}
              {scope === 'FASKES' && (
                <div className="min-w-[260px] flex-1 max-w-md">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pilih Fasilitas Kesehatan
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedFaskesId}
                      onChange={(e) => setSelectedFaskesId(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                    >
                      {faskesList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.namaFaskes} ({f.kodeFaskes}) — Kec. {f.wilayahKecamatan}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* If Wilayah scope: Dropdown Kecamatan filter */}
              {scope === 'WILAYAH' && (
                <div className="min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Wilayah Kecamatan
                  </label>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedKecamatan}
                      onChange={(e) => setSelectedKecamatan(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                    >
                      <option value="ALL">Semua Kecamatan (Se-Kabupaten)</option>
                      {kecamatanList.map((kec) => (
                        <option key={kec} value={kec}>
                          Kecamatan {kec}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Periode Waktu */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Periode Observasi
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setPeriode('HARI_INI')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      periode === 'HARI_INI'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriode('7_HARI')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      periode === '7_HARI'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriode('30_HARI')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      periode === '30_HARI'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    30 Hari Terakhir
                  </button>
                </div>
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{reportData ? 'Analisis Ulang AI' : 'Hasilkan Laporan Eksekutif'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Context Summary Tag */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Fokus Aktif:</span>
              {scope === 'WILAYAH' ? (
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 border border-emerald-200">
                  Kabupaten Bogor •{' '}
                  {selectedKecamatan === 'ALL'
                    ? 'Seluruh Puskesmas'
                    : `Kecamatan ${selectedKecamatan}`}
                </span>
              ) : (
                <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 border border-blue-200">
                  {currentFaskesObj?.namaFaskes || 'Puskesmas Terpilih'} • Kode:{' '}
                  {currentFaskesObj?.kodeFaskes || '-'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Sistem Analitika Internal Terpadu Dinkes • Tanpa Integrasi Luar.
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT DISPLAY ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900">Gagal Menghasilkan Laporan AI</h4>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <div className="bg-white border border-slate-200 shadow-sm p-12 text-center">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1 font-serif">
              Menyusun Laporan Audit Operasional Eksekutif...
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-md mx-auto mb-6">
              {loadingStep ||
                'Menganalisis rasio nakes, BOR tempat tidur, peringatan obat FEFO, dan tren ICD-10...'}
            </p>
            <div className="w-64 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Empty State (Before First Generate) */}
        {!loading && !reportData && !error && (
          <div className="bg-white border border-slate-200 shadow-sm p-10 lg:p-14 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Sparkles className="w-8 h-8 text-emerald-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 font-serif">
              Asisten AI Pengambil Keputusan & Audit Fasilitas Kesehatan
            </h2>
            <p className="text-slate-600 text-sm font-medium max-w-xl mx-auto mb-8 leading-relaxed">
              Laporan briefing eksekutif berstandar audit resmi Dinas Kesehatan. Menampilkan analisis mendalam, rincian faktual dari database, pemetaan beban dokter, keterisian tempat tidur, status kelaikan alkes, serta rekomendasi aksi manajerial terarah.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4" /> Telemetri & Infografis Riil
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Dilengkapi visualisasi data riil: beban kerja SDMK, BOR keterisian tempat tidur,
                  peringatan stok obat, dan distribusi 10 besar penyakit.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <Pill className="w-4 h-4" /> Tabel Rapor Data Terinci
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Penyajian indikator operasional terstruktur dengan angka numerik presisi, inventaris alkes,
                  dan perhitungan defisit stok obat.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" /> Rencana Aksi Cito 1x24 Jam
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Rekomendasi taktis darurat langsung dapat ditindaklanjuti oleh Kepala Puskesmas
                  maupun Kepala Dinas Kesehatan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateReport}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-700/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Laporan Eksekutif Sekarang</span>
            </button>
          </div>
        )}

        {/* ─── REPORT OUTPUT CONTAINER ─── */}
        {!loading && reportData && (
          <div className="space-y-6">
            {/* Quick Metrics KPI Bar (Snapshot Agregat) */}
            {reportData.rawMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
                {/* Metric 1 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {reportData.scope === 'WILAYAH' ? 'Total Puskesmas' : 'Tipe Fasilitas'}
                  </span>
                  <div className="text-lg font-black text-slate-800 mt-1 truncate font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? `${reportData.rawMetrics.ringkasanMakro?.totalPuskesmas || 0} Faskes`
                      : reportData.rawMetrics.profilFaskes?.jenisFaskes || 'Puskesmas'}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {reportData.scope === 'WILAYAH'
                      ? 'Se-Kabupaten'
                      : reportData.rawMetrics.profilFaskes?.kecamatan}
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Trafik Kunjungan
                  </span>
                  <div className="text-lg font-black text-slate-800 mt-1 font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? reportData.rawMetrics.ringkasanMakro?.kunjunganBulanIni ||
                        reportData.rawMetrics.ringkasanMakro?.kunjunganHariIni ||
                        0
                      : reportData.rawMetrics.bebanKerjaSDMK?.kunjunganBulanIni ||
                        reportData.rawMetrics.bebanKerjaSDMK?.kunjunganHariIni ||
                        0}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600">Pasien Terlayani</span>
                </div>

                {/* Metric 3 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Rasio Beban Dokter
                  </span>
                  <div className="text-lg font-black text-slate-800 mt-1 font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? `${reportData.rawMetrics.ringkasanMakro?.rasioBebanKabupaten || 0}:1`
                      : `${reportData.rawMetrics.bebanKerjaSDMK?.rasioPasienPerDokter || 0}:1`}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Pasien per Dokter</span>
                </div>

                {/* Metric 4 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    BOR Tempat Tidur
                  </span>
                  <div className="text-lg font-black text-slate-800 mt-1 font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? reportData.rawMetrics.ringkasanMakro?.borRataRataKabupaten || '0%'
                      : reportData.rawMetrics.tempatTidurBOR?.bor || '0%'}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Keterisian Rawat</span>
                </div>

                {/* Metric 5 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Alkes Kritis
                  </span>
                  <div className="text-lg font-black text-amber-700 mt-1 font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? `${reportData.rawMetrics.asetMedisDanKelaikan?.faskesAlkesKritis?.length || 0} Faskes`
                      : `${reportData.rawMetrics.asetSarprasAlkes?.alkesKritisRusak?.length || 0} Unit`}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600">Perlu Penanganan</span>
                </div>

                {/* Metric 6 */}
                <div className="bg-white border border-slate-200 p-3.5 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Obat Kritis
                  </span>
                  <div className="text-lg font-black text-rose-700 mt-1 font-serif">
                    {reportData.scope === 'WILAYAH'
                      ? `${reportData.rawMetrics.logistikFarmasiFEFO?.sampelObatKritisDefisit?.length || 0} Item`
                      : `${reportData.rawMetrics.farmasiVaksin?.obatKritisCount || 0} Item`}
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">Stok Defisit/Habis</span>
                </div>
              </div>
            )}

            {/* Document Header & View Mode Switcher */}
            <div className="bg-white border border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-amber-400 border border-slate-800 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    {reportData.scope === 'WILAYAH'
                      ? 'Laporan Situasi Kesehatan Makro Se-Kabupaten (Regional SitRep)'
                      : `Laporan Audit Operasional Fasilitas: ${activeFaskesName}`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(reportData.generatedAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WIB
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-sans">
                      Terverifikasi Database SIKDA
                    </span>
                  </div>
                </div>
              </div>

              {/* View Switcher & Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Buttons */}
                <div className="bg-slate-100 p-0.5 border border-slate-300 flex items-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('COMPREHENSIVE')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'COMPREHENSIVE'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilkan Laporan Lengkap beserta Infografis Visual"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Lengkap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('REPORT_ONLY')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'REPORT_ONLY'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Hanya Tampilkan Naskah Laporan Audit"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Naskah Laporan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('VISUAL_ONLY')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'VISUAL_ONLY'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Hanya Tampilkan Infografis & Telemetri Visual"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Infografis</span>
                  </button>
                </div>

                <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                  title="Salin isi laporan format Markdown"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Cetak Dokumen Resmi / Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRawMetrics(!showRawMetrics)}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-colors border flex items-center gap-1 cursor-pointer ${
                    showRawMetrics
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Lihat data metrik mentah yang dianalisis oleh AI"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{showRawMetrics ? 'Metrik ON' : 'Metrik'}</span>
                </button>
              </div>
            </div>

            {/* Optional Raw Metrics Drawer / Inspection */}
            {showRawMetrics && reportData.rawMetrics && (
              <div className="bg-slate-900 text-slate-200 p-5 border border-slate-800 shadow-inner font-mono text-xs overflow-x-auto max-h-96 print:hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Data Agregat Ter-Sanitasi (Bebas PII - Sesuai Regulasi Privasi)
                  </span>
                  <span className="text-[10px]">Format: JSON Agregat</span>
                </div>
                <pre>{JSON.stringify(reportData.rawMetrics, null, 2)}</pre>
              </div>
            )}

            {/* ─── COMPANION INFOGRAPHICS & DIAGRAM VISUALIZERS (DATA AKTUAL) ─── */}
            {(viewMode === 'COMPREHENSIVE' || viewMode === 'VISUAL_ONLY') && (
              <AcmInfographics rawMetrics={reportData.rawMetrics} scope={reportData.scope} />
            )}

            {/* ─── OFFICIAL EXECUTIVE AUDIT REPORT CONTAINER (SINGLE-COLUMN NORMAL FORMAT) ─── */}
            {(viewMode === 'COMPREHENSIVE' || viewMode === 'REPORT_ONLY') && (
              <div
                ref={printAreaRef}
                className="bg-white border border-slate-200 shadow-sm p-8 sm:p-14 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none"
              >
                {/* 1. Official Header & Identification */}
                <header className="mb-8 border-b-2 border-slate-900 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                        SIKDA KABUPATEN BOGOR
                      </span>
                      <span className="font-semibold text-slate-700">Dinas Kesehatan • Pusat Audit Mutu Pelayanan</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      Status: <span className="font-bold text-emerald-700">Terverifikasi Database</span>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase leading-snug">
                    {activeDocTitle}
                  </h1>

                  {/* Sub-Metadata Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Sasaran Fasilitas</span>
                      <span className="font-bold text-slate-800 truncate block">{activeFaskesName}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Wilayah Kecamatan</span>
                      <span className="font-bold text-slate-800">{currentFaskesObj?.wilayahKecamatan || 'Se-Kabupaten'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Kode Faskes / Jenis</span>
                      <span className="font-bold text-slate-800">
                        {currentFaskesObj?.kodeFaskes || '-'} • {currentFaskesObj?.tipeFaskes || '-'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Waktu Audit</span>
                      <span className="font-bold text-slate-800">
                        {new Date(reportData.generatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </header>

                {/* 2. Article Body Rendered via ReactMarkdown with Normal Single-Column Layout */}
                <main className="executive-report-body text-slate-800 text-sm leading-relaxed space-y-5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom Code Renderer: Renders Mermaid Diagrams as SVG!
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isMermaid = match && match[1] === 'mermaid';
                        const codeContent = String(children).replace(/\n$/, '');

                        if (isMermaid) {
                          return (
                            <div className="my-6">
                              <MermaidDiagram
                                chart={codeContent}
                                figureNumber={1}
                                caption={
                                  reportData.scope === 'WILAYAH'
                                    ? 'Bagan 1: Jejaring Pemindahan Logistik Obat FEFO Berdasarkan Data Riil Antar-Puskesmas.'
                                    : 'Bagan 1: Visualisasi Data Operasional & Kapasitas Faskes.'
                                }
                              />
                            </div>
                          );
                        }

                        return (
                          <code
                            className={`font-mono text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 border border-slate-200 ${className || ''}`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },

                      // Booktabs Style Table Elements
                      table({ children }) {
                        return (
                          <div className="my-6 overflow-x-auto border-t-2 border-b-2 border-slate-900 bg-white">
                            <table className="w-full text-left text-xs font-sans border-collapse">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return (
                          <thead className="border-b border-slate-700 text-slate-950 font-bold uppercase tracking-wider text-[11px] bg-slate-50">
                            {children}
                          </thead>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="py-2.5 px-3.5 font-bold text-slate-900 border-none">
                            {children}
                          </th>
                        );
                      },
                      tbody({ children }) {
                        return <tbody className="divide-y divide-slate-100">{children}</tbody>;
                      },
                      tr({ children }) {
                        return <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>;
                      },
                      td({ children }) {
                        return (
                          <td className="py-2.5 px-3.5 text-slate-800 text-xs font-medium border-none align-top">
                            {children}
                          </td>
                        );
                      },

                      // Headings
                      h1({ children }) {
                        const text = String(children);
                        if (
                          text.toUpperCase().includes('LAPORAN AUDIT OPERASIONAL') ||
                          text.toUpperCase().includes('LAPORAN SITUASI EKSEKUTIF')
                        ) {
                          return null;
                        }
                        return (
                          <h1 className="text-xl font-bold tracking-tight text-slate-950 mt-8 mb-3 pb-2 border-b-2 border-slate-800">
                            {children}
                          </h1>
                        );
                      },
                      h2({ children }) {
                        return (
                          <h2 className="text-base font-bold tracking-tight text-slate-900 mt-7 mb-2 pb-1.5 border-b border-slate-200">
                            {children}
                          </h2>
                        );
                      },
                      h3({ children }) {
                        return (
                          <h3 className="text-sm font-bold text-slate-800 mt-5 mb-1.5">
                            {children}
                          </h3>
                        );
                      },

                      // Paragraphs
                      p({ children }) {
                        return (
                          <p className="my-3 text-sm text-slate-800 leading-relaxed">
                            {children}
                          </p>
                        );
                      },

                      // Executive Summary Blockquote
                      blockquote({ children }) {
                        return (
                          <div className="my-6 p-5 sm:p-6 bg-emerald-50/60 border-l-4 border-emerald-600 border-y border-r border-emerald-100 rounded-r shadow-xs">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Ringkasan Eksekutif Manajerial
                            </div>
                            <div className="text-sm text-slate-800 leading-relaxed space-y-2">
                              {children}
                            </div>
                          </div>
                        );
                      },

                      // Lists
                      ul({ children }) {
                        return <ul className="my-3 ml-5 list-disc space-y-1.5 text-sm text-slate-800 leading-relaxed">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="my-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-800 leading-relaxed">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-relaxed">{children}</li>;
                      },

                      // Divider
                      hr() {
                        return <hr className="my-6 border-slate-200" />;
                      }
                    }}
                  >
                    {normalizeMarkdownTables(reportData.reportMarkdown)}
                  </ReactMarkdown>
                </main>

                {/* 3. Official Sign-off Block */}
                <footer className="mt-12 pt-6 border-t-2 border-slate-900 text-xs text-slate-600">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Dinas Kesehatan Kabupaten Bogor • SIKDA Operational Audit
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Kompleks Perkantoran Pemda Cibinong, Jl. Tegar Beriman, Bogor, Jawa Barat.
                      </p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400">
                      <div>Waktu Audit: {new Date(reportData.generatedAt).toLocaleString('id-ID')} WIB</div>
                      <div>Status: Dokumen Resmi Eksekutif • Terverifikasi SIKDA</div>
                    </div>
                  </div>
                </footer>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
