"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { rawatJalanService } from '@/services/rawatJalan.service';

// Import newly created components
import { HeaderBanner } from './components/HeaderBanner';
import { IdentitasPasien } from './components/IdentitasPasien';
import { TimelineView } from './components/TimelineView';
import { DetailView } from './components/DetailView';
import { LabModal } from './components/LabModal';

export default function RMEDokterViewerPage() {
  const params = useParams();
  const noRM = params.id as string;
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'DETAIL'>('TIMELINE');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [pasienData, setPasienData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showLabSurat, setShowLabSurat] = useState(false);
  const labPrintRef = useRef<HTMLDivElement>(null);
  const rmePrintRef = useRef<HTMLDivElement>(null);

  const handlePrintRME = useReactToPrint({
    contentRef: rmePrintRef,
    documentTitle: `Rekam_Medis_${pasienData?.noRM || ''}`,
  });

  const handlePrintLab = useReactToPrint({
    contentRef: labPrintRef,
    documentTitle: `Surat_Hasil_Lab_${pasienData?.noRM || ''}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await rawatJalanService.getRiwayatPasienByRM(noRM);
        if (res.success) {
          setPasienData(res.data);
        } else {
          setError(res.message || 'Gagal memuat data riwayat');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setIsLoading(false);
      }
    };
    if (noRM) fetchData();
  }, [noRM]);

  const getMonthAbbr = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { month: 'short' });
  };

  const getYear = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const getDay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getDate().toString().padStart(2, '0');
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970) + ' Tahun';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getTriageColor = (triage: string | undefined | null) => {
    const t = triage?.toLowerCase() || '';
    if (t === 'merah') return 'bg-red-100 text-red-800 border-red-200';
    if (t === 'kuning') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (t === 'hijau') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (t === 'hitam') return 'bg-slate-800 text-white border-slate-900';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pb-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat Riwayat Rekam Medis...</p>
      </div>
    );
  }

  if (error || !pasienData) {
    const isForbidden = error.toLowerCase().includes('akses ditolak') || error.toLowerCase().includes('403') || error.toLowerCase().includes('wewenang');
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pb-20 p-6 text-center">
        <div className="bg-white p-8 rounded-none shadow-sm border border-slate-200 max-w-lg w-full">
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isForbidden ? 'text-amber-500' : 'text-red-500'}`} />
          <h2 className="text-xl font-black text-slate-800 mb-2">
            {isForbidden ? 'Akses Dibatasi: Privasi Rekam Medis' : 'Data Tidak Ditemukan'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            {error || 'Pasien ini mungkin belum memiliki riwayat kunjungan yang selesai.'}
          </p>
          <Link href="/dokter/rme-dokter" className="inline-block px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors">
            Kembali ke Daftar Riwayat
          </Link>
        </div>
      </div>
    );
  }

  const visits = pasienData.kunjungans || [];

  return (
    <div ref={rmePrintRef} className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-800 print:bg-white print:min-h-0 print:pb-0">
      
      <HeaderBanner 
        viewMode={viewMode}
        setViewMode={setViewMode}
        pasienData={pasienData}
        selectedVisit={selectedVisit}
        formatDate={formatDate}
        handlePrintRME={handlePrintRME}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-6">
        <IdentitasPasien 
          viewMode={viewMode}
          pasienData={pasienData}
          selectedVisit={selectedVisit}
          calculateAge={calculateAge}
          formatDate={formatDate}
        />

        {viewMode === 'TIMELINE' && (
          <TimelineView 
            visits={visits}
            pasienData={pasienData}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            setSelectedVisit={setSelectedVisit}
            setViewMode={setViewMode}
            getDay={getDay}
            getMonthAbbr={getMonthAbbr}
            getYear={getYear}
          />
        )}

        {viewMode === 'DETAIL' && selectedVisit && (
          <DetailView 
            selectedVisit={selectedVisit}
            getTriageColor={getTriageColor}
            setShowLabSurat={setShowLabSurat}
          />
        )}
      </div>

      <LabModal 
        showLabSurat={showLabSurat}
        setShowLabSurat={setShowLabSurat}
        selectedVisit={selectedVisit}
        pasienData={pasienData}
        handlePrintLab={handlePrintLab}
        labPrintRef={labPrintRef}
      />

    </div>
  );
}
