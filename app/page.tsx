"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  LogIn,
  HeartPulse,
  Search,
  Heart,
  Ambulance,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  CreditCard,
  User,
  Baby,
  TestTube,
  Pill,
  Apple,
  Smartphone,
  Sparkles,
  Bot,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Building2,
  Users,
  Compass,
  Award,
  Video,
  ExternalLink
} from 'lucide-react';
import VirtualAssistantWidget from '@/components/landing/VirtualAssistantWidget';

interface BannerVideoItem {
  id: string;
  title: string;
  subtitle: string;
  videoSrc: string;
  altSrc?: string;
  badge: string;
  category: string;
}

const BANNER_VIDEOS: BannerVideoItem[] = [
  {
    id: 'video-1',
    title: 'Pelayanan Klinis Primer & Ramah Keluarga',
    subtitle: 'Dokter berdedikasi dan tenaga medis profesional siap memberikan pelayanan rawat jalan terbaik untuk seluruh masyarakat.',
    videoSrc: '/videos/video1.mp4',
    altSrc: '/videos/banner1.mp4',
    badge: 'Video 1: Layanan Puskesmas',
    category: 'Rawat Jalan & Pemeriksaan Dokter'
  },
  {
    id: 'video-2',
    title: 'Fasilitas Medis, Laboratorium & Farmasi Modern',
    subtitle: 'Didukung sistem rekam medis elektronik terpadu dan pengawasan mutu logistik obat berstandar nasional.',
    videoSrc: '/videos/video2.mp4',
    altSrc: '/videos/banner2.mp4',
    badge: 'Video 2: Fasilitas & Teknologi',
    category: 'Laboratorium & Farmasi Terpadu'
  },
  {
    id: 'video-3',
    title: 'Jejaring Pelayanan Kesehatan Se-Kabupaten',
    subtitle: 'Integrasi 101 puskesmas dan fasilitas kesehatan daerah dalam satu komando data terpadu Dinas Kesehatan.',
    videoSrc: '/videos/video3.mp4',
    altSrc: '/videos/banner3.mp4',
    badge: 'Video 3: Jejaring Faskes',
    category: 'Pusat Komando & Surveilans Dinkes'
  }
];

export default function ClevelandLandingPage() {
  // Video Banner Carousel State
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Search State
  const [searchTab, setSearchTab] = useState<'ALL' | 'POLI' | 'DOKTER' | 'FASKES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Schedule Filter
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [selectedPoliFilter, setSelectedPoliFilter] = useState<string>('ALL');

  // Video Navigation: Auto next and prev
  const handleNextVideo = () => {
    setVideoProgress(0);
    setCurrentVideoIdx((prev) => (prev + 1) % BANNER_VIDEOS.length);
  };

  const handlePrevVideo = () => {
    setVideoProgress(0);
    setCurrentVideoIdx((prev) => (prev - 1 + BANNER_VIDEOS.length) % BANNER_VIDEOS.length);
  };

  // When current video ends, automatically play next video
  const handleVideoEnded = () => {
    handleNextVideo();
  };

  // Real-time progress update for the active video bar
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(pct);
    }
  };

  // Handle video autoplay & change
  useEffect(() => {
    setVideoError(false);
    setVideoProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [currentVideoIdx]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const activeVideo = BANNER_VIDEOS[currentVideoIdx];

  const doctorsList = [
    {
      name: 'dr. Andi Pratama',
      poli: 'Poli Umum',
      faskes: 'Puskesmas Cibinong',
      days: ['Senin', 'Selasa', 'Rabu'],
      daysText: 'Senin - Rabu',
      hours: '08:00 - 14:00',
      status: 'Aktif Praktik',
      avatar: 'AP'
    },
    {
      name: 'dr. Budi Santoso',
      poli: 'Poli Umum',
      faskes: 'Puskesmas Cibinong',
      days: ['Kamis', 'Jumat', 'Sabtu'],
      daysText: 'Kamis - Sabtu',
      hours: '08:00 - 14:00',
      status: 'Aktif Praktik',
      avatar: 'BS'
    },
    {
      name: 'drg. Clara Wijaya',
      poli: 'Poli Gigi',
      faskes: 'Puskesmas Sukamakmur',
      days: ['Senin', 'Rabu', 'Jumat'],
      daysText: 'Senin, Rabu, Jumat',
      hours: '08:30 - 13:00',
      status: 'Aktif Praktik',
      avatar: 'CW'
    },
    {
      name: 'dr. Dini Amalia, Sp.A',
      poli: 'Poli KIA & Anak',
      faskes: 'Puskesmas Cibinong',
      days: ['Selasa', 'Kamis'],
      daysText: 'Selasa & Kamis',
      hours: '09:00 - 13:30',
      status: 'Konsultan Anak',
      avatar: 'DA'
    },
    {
      name: 'dr. Eko Purnomo',
      poli: 'UGD 24 Jam',
      faskes: 'Puskesmas Cibinong Rawat Inap',
      days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      daysText: 'Setiap Hari',
      hours: 'Shift Pagi / Malam',
      status: 'Siaga 24 Jam',
      avatar: 'EP'
    },
    {
      name: 'dr. Siti Rahmawati',
      poli: 'Poli Lansia & PTM',
      faskes: 'Puskesmas Ciawi',
      days: ['Senin', 'Selasa', 'Kamis'],
      daysText: 'Senin, Selasa, Kamis',
      hours: '08:00 - 12:30',
      status: 'Aktif Praktik',
      avatar: 'SR'
    }
  ];

  const filteredDoctors = doctorsList.filter((doc) => {
    const matchPoli = selectedPoliFilter === 'ALL' || doc.poli === selectedPoliFilter;
    const matchDay = selectedDayFilter === 'ALL' || doc.days.includes(selectedDayFilter);
    const matchSearch =
      searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.poli.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.faskes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPoli && matchDay && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-600 selection:text-white">

      {/* ─── 1. TOP EMERGENCY & UTILITY ALERT BAR (CLEVELAND CLINIC RED/NAVY BANNER) ─── */}
      <div className="bg-[#0A2540] text-white border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col md:flex-row items-center justify-between gap-2">

          {/* Emergency Alert Hotline */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-rose-300 uppercase tracking-wider text-[11px]">
              Gawat Darurat Medis:
            </span>
            <span className="text-slate-200">
              Hubungi <strong className="text-white font-bold tracking-wide">Call Center 119</strong> (Bebas Pulsa) atau IGD 24 Jam Terdekat.
            </span>
          </div>

          {/* Quick External Portals */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-300">
            <Link
              href="/#locations"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Lokasi Puskesmas</span>
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/login?portal=faskes"
              className="hover:text-white transition-colors flex items-center gap-1 text-blue-300"
            >
              <LogIn className="w-3 h-3" />
              <span>Portal Tenaga Medis</span>
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/login?portal=dinkes"
              className="hover:text-white transition-colors flex items-center gap-1 text-emerald-300"
            >
              <Activity className="w-3 h-3" />
              <span>Command Center Dinkes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN NAVIGATION (CLEVELAND CLINIC CLEAN HEALTHCARE HEADER) ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-950 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/10 group-hover:scale-105 transition-transform border border-slate-700/50">
              <HeartPulse className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 leading-none">
                  SIKDA
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                  KAB. BOGOR
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 tracking-tight block mt-0.5">
                Sistem Informasi Kesehatan &amp; Layanan Terpadu
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Link href="#find-care" className="hover:text-emerald-700 transition-colors">
              Cari Dokter
            </Link>
            <Link href="#services" className="hover:text-emerald-700 transition-colors">
              Layanan Poliklinik
            </Link>
            <Link href="#doctor-schedule" className="hover:text-emerald-700 transition-colors">
              Jadwal Praktik
            </Link>
            <Link href="#why-choose" className="hover:text-emerald-700 transition-colors">
              Standar Mutu
            </Link>
            <Link href="#education" className="hover:text-emerald-700 transition-colors">
              Edukasi Kesehatan
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>Daftar Antrean Online</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 3. HERO SECTION WITH AMBIENT VIDEO BANNER & CLEVELAND CLINIC SEARCH ─── */}
      <section className="relative min-h-[600px] lg:min-h-[680px] bg-slate-950 text-white overflow-hidden flex flex-col justify-between">

        {/* Ambient Video Player Background */}
        <div className="absolute inset-0 z-0">
          {!videoError ? (
            <video
              ref={videoRef}
              key={activeVideo.videoSrc}
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover object-center opacity-95 transition-opacity duration-700"
            >
              <source src={activeVideo.videoSrc} type="video/mp4" />
              {activeVideo.altSrc && <source src={activeVideo.altSrc} type="video/mp4" />}
            </video>
          ) : (
            // Fallback High-Quality Medical Backdrop if videos are not yet placed
            <div
              className="w-full h-full bg-cover bg-center opacity-40"
              style={{ backgroundImage: "url('/doctor_hero_bg.png')" }}
            ></div>
          )}

          {/* Reduced Lighting Overlays - Preserves authentic, vivid video colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/20 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20 z-10 pointer-events-none"></div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10 flex-1 flex flex-col justify-center">
          <div className="max-w-3xl bg-slate-950/40 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">

            {/* Active Video Badge / Indicator */}
            {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold mb-4">
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeVideo.badge}</span>
              <span className="text-white/40">•</span>
              <span className="text-slate-200 font-medium">{activeVideo.category}</span>
            </div> */}

            {/* Main Reassuring Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight mb-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Setiap Pasien Adalah <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text text-white">
                Prioritas Utama Kami.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-100 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl font-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Akses pelayanan kesehatan berstandar unggul, dokter terpercaya, dan pendaftaran mandiri cepat dari rumah untuk seluruh keluarga di Kabupaten Bogor.
            </p>

            {/* ─── CLEVELAND CLINIC "FIND CARE" FLOATING SEARCH BOX ─── */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/40 text-slate-800 max-w-2xl">

              {/* Search Category Tabs */}
              <div className="flex items-center gap-1 mb-3 border-b border-slate-200/80 pb-2 overflow-x-auto text-[11px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setSearchTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${searchTab === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  Semua Layanan
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('POLI')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${searchTab === 'POLI'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  Poliklinik
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('DOKTER')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${searchTab === 'DOKTER'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  Dokter
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('FASKES')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${searchTab === 'FASKES'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  Puskesmas
                </button>
              </div>

              {/* Input & Search Action */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari keluhan, poli (Umum, Gigi, KIA), atau nama dokter..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>
                <Link
                  href="/booking"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Cari &amp; Daftar</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-medium">Pilihan Cepat:</span>
                {['Poli Umum', 'Poli Gigi', 'KIA & Imunisasi', 'UGD 24 Jam', 'Puskesmas Cibinong'].map(
                  (tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-semibold transition-colors cursor-pointer border border-slate-200/80"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ─── VIDEO CONTROLS & AUTO-CAROUSEL SELECTOR BAR ─── */}
        <div className="relative z-20 bg-slate-950/90 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Video Slide Tabs with Auto-advance Progress Line */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrevVideo}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Video Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {BANNER_VIDEOS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setVideoProgress(0);
                    setCurrentVideoIdx(idx);
                  }}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 overflow-hidden border ${currentVideoIdx === idx
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{item.title}</span>

                  {/* Realtime progress bar filling as video plays */}
                  {currentVideoIdx === idx && (
                    <span
                      className="absolute bottom-0 left-0 h-1 bg-amber-400 transition-all duration-150"
                      style={{ width: `${videoProgress}%` }}
                    />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={handleNextVideo}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Video Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Video Playback Tools */}
            <div className="flex items-center gap-2">
              {/* <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Auto-Putar Berurutan</span>
              </span> */}

              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Jeda Video' : 'Putar Video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 4. CLEVELAND CLINIC "NEED CARE NOW?" 4-COLUMN ACTION GATEWAY ─── */}
      <section id="find-care" className="relative z-20 py-12 lg:py-16 bg-slate-50 border-b border-slate-200/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header: Clean separation from banner above */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
                Akses Cepat &amp; Kedaruratan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Layanan Utama &amp; Pendaftaran Cepat
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-sm sm:text-right">
              Pilih layanan mandiri dari rumah atau cari jadwal dokter di fasilitas kesehatan terdekat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Action 1: Booking Online */}
            <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-t-emerald-600 border-x border-b border-slate-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">
                  Daftar Online dari Rumah
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Ambil nomor antrean puskesmas via WhatsApp &amp; PIN. Tiket digital langsung terkirim tanpa antre di loket.
                </p>
              </div>
              <Link
                href="/booking"
                className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1.5 mt-2"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Action 2: Cari Jadwal Dokter */}
            <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-t-blue-600 border-x border-b border-slate-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">
                  Cari Dokter &amp; Jadwal
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Informasi jadwal dokter umum, dokter gigi, dan spesialis di seluruh fasilitas kesehatan daerah.
                </p>
              </div>
              <Link
                href="#doctor-schedule"
                className="text-xs font-bold text-blue-700 group-hover:text-blue-800 flex items-center gap-1.5 mt-2"
              >
                <span>Lihat Jadwal Dokter</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Action 3: Asisten AI SIKDA */}
            <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">
                  Tanya Asisten AI SIKDA
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Konsultasikan informasi poli yang tepat, syarat berobat BPJS, dan panduan gawat darurat secara interaktif.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const launcher = document.querySelector('button[aria-label="Buka Asisten Virtual SIKDA"]') as HTMLButtonElement;
                  launcher?.click();
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 mt-2 cursor-pointer text-left"
              >
                <span>Mulai Obrolan AI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Action 4: Akses Portal Faskes / Dinkes */}
            <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-t-slate-800 border-x border-b border-slate-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">
                  Portal Tenaga Medis &amp; Dinkes
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Pintu masuk aman untuk staf pendaftaran, RME dokter, apotek, lab, radiologi, dan pengawasan pimpinan.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                <Link href="/login?portal=faskes" className="text-blue-700 hover:underline">
                  Faskes
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/login?portal=dinkes" className="text-emerald-700 hover:underline">
                  Dinkes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CLINICAL INSTITUTES & SERVICES (LAYANAN UNGGULAN SPESIALISTIK) ─── */}
      <section id="services" className="py-20 bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">

          {/* Section Header */}
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-2">
              Layanan Spesialisasi &amp; Poliklinik
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Pelayanan Komprehensif Berstandar Mutu Nasional
            </h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Disediakan di seluruh puskesmas terakreditasi di Kabupaten Bogor dengan dukungan dokter, perawat, bidan, dan apoteker tersertifikasi.
            </p>
          </div>

          {/* Clinical Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Poliklinik Umum & Dewasa',
                desc: 'Pemeriksaan kesehatan menyeluruh, penanganan keluhan infeksi, demam, ISPA, dan penyakit umum.',
                icon: <User className="w-6 h-6" />,
                badge: 'Rawat Jalan Utama'
              },
              {
                title: 'Kesehatan Gigi & Mulut',
                desc: 'Penambalan gigi estetik, pencabutan, pembersihan karang gigi (scaling), dan konsultasi periodonsia.',
                icon: <Activity className="w-6 h-6" />,
                badge: 'Spesialis Gigi'
              },
              {
                title: 'Kesehatan Ibu, Anak & KB',
                desc: 'Pemeriksaan kehamilan terpadu (ANC), konsultasi laktasi, imunisasi dasar lengkap, dan program KB.',
                icon: <Baby className="w-6 h-6" />,
                badge: 'Prioritas Keluarga'
              },
              {
                title: 'Layanan Lansia & Prolanis',
                desc: 'Pengawasan berkala penyakit kronis (Hipertensi & Diabetes Mellitus) dengan bimbingan pola hidup.',
                icon: <Heart className="w-6 h-6" />,
                badge: 'Program Kronis'
              },
              {
                title: 'Instalasi Gawat Darurat (24 Jam)',
                desc: 'Penanganan kedaruratan trauma, henti napas, luka akut, dan rujukan ambulans siaga 24 jam.',
                icon: <Ambulance className="w-6 h-6 text-rose-600" />,
                badge: 'Siaga 24 Jam'
              },
              {
                title: 'Laboratorium Klinik Terpadu',
                desc: 'Pemeriksaan darah lengkap, tes urin, profil lipid, gula darah, tes dahak TB TCM, dan tes cepat infeksi.',
                icon: <TestTube className="w-6 h-6" />,
                badge: 'Hasil Cepat'
              },
              {
                title: 'Instalasi Farmasi & FEFO',
                desc: 'Penyediaan obat berformularium nasional dengan pengawasan ketat First-Expired First-Out.',
                icon: <Pill className="w-6 h-6" />,
                badge: 'Obat Terjamin'
              },
              {
                title: 'Gizi & Pencegahan Stunting',
                desc: 'Konsultasi diet klinis, pemantauan tumbuh kembang balita, dan intervensi gizi terpadu.',
                icon: <Apple className="w-6 h-6" />,
                badge: 'Nutrisi Sehat'
              }
            ].map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 transition-colors flex items-center justify-center">
                      {service.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-emerald-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {service.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href="/booking"
                    className="font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Daftar Poli</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 6. WHY PATIENTS TRUST SIKDA (KEUNGGULAN MUTU & TRANSPARANSI) ─── */}
      <section id="why-choose" className="py-20 bg-white px-4 sm:px-6 lg:px-8 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-2">
              Keunggulan Sistem SIKDA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Mengapa Masyarakat Mempercayakan Kesehatannya kepada Kami?
            </h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Transformasi digital fasilitas kesehatan daerah menghadirkan pengalaman berobat yang transparan, minim antrean, dan berorientasi penuh pada kenyamanan pasien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-emerald-500 transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-3">
                Rekam Medis Elektronik Terpadu
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Riwayat pemeriksaan, resep obat, diagnosis ICD-10, dan hasil lab Anda tersimpan aman dan terintegrasi antar faskes tanpa risiko dokumen hilang.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-emerald-500 transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-3">
                Notifikasi WhatsApp Real-Time
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Cukup satu nomor WhatsApp untuk mendaftarkan seluruh keluarga. Tiket antrean dan pengingat jadwal langsung terkirim ke ponsel Anda.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-emerald-500 transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-3">
                Pelayanan BPJS &amp; Umum Bebas Ribet
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Pasien BPJS Kesehatan terdaftar dilayani 100% bebas biaya dengan verifikasi otomatis, sementara pasien umum mendapatkan kejelasan tarif resmi daerah.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 7. INTERACTIVE DOCTOR & CLINIC SCHEDULE DIRECTORY ─── */}
      <section id="doctor-schedule" className="py-20 bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-2">
                Direktori Praktik Dokter
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Jadwal Praktik Dokter Terpercaya
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                Periksa ketersediaan dokter umum, dokter gigi, dan dokter spesialis sebelum Anda berkunjung.
              </p>
            </div>

            {/* Filter Day Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
              {[
                { label: 'Semua Hari', val: 'ALL' },
                { label: 'Senin', val: 'Senin' },
                { label: 'Selasa', val: 'Selasa' },
                { label: 'Rabu', val: 'Rabu' },
                { label: 'Kamis', val: 'Kamis' },
                { label: 'Jumat', val: 'Jumat' },
                { label: 'Sabtu', val: 'Sabtu' }
              ].map((day) => (
                <button
                  key={day.val}
                  type="button"
                  onClick={() => setSelectedDayFilter(day.val)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedDayFilter === day.val
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 border-2 border-slate-800">
                      {doc.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950 text-base leading-tight">
                        {doc.name}
                      </h3>
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                        {doc.poli}
                      </span>
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.faskes}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Hari Praktik:</span>
                      <span className="font-bold text-slate-800">{doc.daysText}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jam Layanan:</span>
                      <span className="font-bold text-slate-800">{doc.hours}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status Praktik:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/booking"
                    className="w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center transition-colors shadow-xs"
                  >
                    Daftar ke Dokter Ini
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-base">Tidak ada dokter yang cocok</h4>
              <p className="text-slate-500 text-xs mt-1">
                Silakan ganti filter hari atau kata kunci pencarian Anda.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ─── 8. HEALTH & WELLNESS (EDUKASI KESEHATAN MASYARAKAT) ─── */}
      <section id="education" className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-2">
              Pusat Edukasi &amp; Info Kesehatan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Panduan Praktis Hidup Sehat untuk Warga
            </h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Materi penyuluhan resmi Dinas Kesehatan Kabupaten Bogor untuk pencegahan penyakit menular dan pengelolaan kesehatan keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Pentingnya Imunisasi Dasar Lengkap untuk Balita',
                desc: 'Lindungi si kecil dari bahaya Polio, Campak, dan Difteri. Cek jadwal imunisasi berkala di Posyandu dan Puskesmas terdekat.',
                tag: 'Kesehatan Anak',
                readTime: '4 Menit Baca'
              },
              {
                title: 'Kendalikan Tekanan Darah dengan Pola Hidup CERDIK',
                desc: 'Hipertensi kerap tanpa gejala. Rutin cek tensi darah bulanan di Posbindu dan batasi konsumsi garam harian Anda.',
                tag: 'Penyakit Tidak Menular',
                readTime: '3 Menit Baca'
              },
              {
                title: 'Kesiapsiagaan Hadapi Musim Pancaroba & Siklus DBD',
                desc: 'Terapkan 3M Plus di lingkungan rumah dan segera bawa ke IGD jika mengalami demam tinggi mendadak dengan bintik merah.',
                tag: 'Pencegahan Wabah',
                readTime: '5 Menit Baca'
              }
            ].map((article, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      {article.tag}
                    </span>
                    <span className="text-slate-400 font-medium">{article.readTime}</span>
                  </div>
                  <h3 className="font-bold text-slate-950 text-base leading-snug mb-2 hover:text-emerald-700 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {article.desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200/70">
                  <Link
                    href="/booking"
                    className="text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center gap-1.5"
                  >
                    <span>Konsultasi dengan Dokter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 9. EMERGENCY CALLOUT BANNER ─── */}
      <section className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-y-4 border-rose-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/30 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <Ambulance className="w-8 h-8 text-rose-300" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Memerlukan Bantuan Medis Kritis &amp; Ambulans Cepat?
              </h3>
              <p className="text-rose-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Layanan ambulans gawat darurat dan rujukan cito beroperasi 24 jam nonstop tanpa libur. Hubungi nomor darurat terpadu sekarang juga.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:119"
              className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Telepon 119 Sekarang</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── 10. COMPREHENSIVE HEALTHCARE FOOTER (CLEVELAND CLINIC STYLE) ─── */}
      <footer id="locations" className="bg-[#0A2540] text-slate-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">

          {/* Col 1: Identity & Dinas */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 text-white">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight block">SIKDA KABUPATEN BOGOR</span>
                <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase block">
                  Dinas Kesehatan • Pemerintah Kabupaten Bogor
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-6 max-w-md">
              Sistem Informasi Kesehatan Daerah (SIKDA) adalah platform terpadu untuk pelayanan rekam medis elektronik puskesmas, antrean online WhatsApp, dan pusat komando pengendalian mutu fasilitas kesehatan masyarakat.
            </p>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Kompleks Perkantoran Pemda Cibinong, Jl. Tegar Beriman, Kabupaten Bogor, Jawa Barat 16914</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Call Center: (021) 875-1234 / Emergency 119</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>dinkes@bogorkab.go.id • layanan@sikda.bogorkab.go.id</span>
              </div>
            </div>
          </div>

          {/* Col 2: Pasien & Pengunjung */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">
              Layanan Pasien
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/booking" className="hover:text-emerald-400 transition-colors">Daftar Online dari Rumah</Link></li>
              <li><Link href="#doctor-schedule" className="hover:text-emerald-400 transition-colors">Jadwal Poliklinik &amp; Dokter</Link></li>
              <li><Link href="#services" className="hover:text-emerald-400 transition-colors">Pelayanan Rawat Inap &amp; UGD</Link></li>
              <li><Link href="#why-choose" className="hover:text-emerald-400 transition-colors">Ketentuan Pasien BPJS</Link></li>
              <li><Link href="#education" className="hover:text-emerald-400 transition-colors">Panduan Hak Pasien</Link></li>
            </ul>
          </div>

          {/* Col 3: Fasilitas & Faskes */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">
              Jejaring Fasilitas
            </h4>
            <ul className="space-y-2.5">
              <li><span className="text-slate-300">101 Puskesmas Pembina</span></li>
              <li><span className="text-slate-300">Puskesmas Rawat Inap PONED</span></li>
              <li><span className="text-slate-300">Instalasi Farmasi Kabupaten</span></li>
              <li><span className="text-slate-300">Laboratorium Kesehatan Daerah (Labkesda)</span></li>
              <li><span className="text-slate-300">RSUD Rujukan Wilayah</span></li>
            </ul>
          </div>

          {/* Col 4: Portal Internal */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">
              Portal Khusus Staf
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login?portal=faskes" className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 font-bold">
                  <LogIn className="w-3.5 h-3.5" /> Portal Pelayanan Faskes
                </Link>
              </li>
              <li>
                <Link href="/login?portal=dinkes" className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5" /> Command Center Dinkes
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Akses Administrasi Loket
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Akses Dokter &amp; Perawat
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal & Copyright */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Pemerintah Kabupaten Bogor • Dinas Kesehatan. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">Kebijakan Privasi Data Medis</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Standar Pelayanan Publik</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Aksesibilitas</Link>
          </div>
        </div>
      </footer>

      {/* ─── 11. VIRTUAL AGENT FLOATING AI CHATBOT WIDGET ─── */}
      <VirtualAssistantWidget />

    </div>
  );
}
