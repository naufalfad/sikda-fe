"use client";

import React from 'react';
import { 
  MapPin, Phone, Mail, LogIn, HeartPulse, Search, 
  Heart, Ambulance, Activity, ArrowRight, ChevronLeft, ChevronRight,
  FileText, ShieldCheck, CreditCard, User, Baby, TestTube, Pill, Apple
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* TOP BAR */}
      <div className="bg-slate-900 text-white text-[11px] font-medium flex justify-between items-center z-50 relative h-10 border-b border-slate-800">
        <div className="flex items-center gap-6 md:gap-10 h-full pl-6 md:pl-72 lg:pl-80">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">Dinas Kesehatan Kabupaten / Kota</span>
          </div>
          <div className="flex items-center gap-2 hidden sm:flex">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">Call Center: (021) 555-1234</span>
          </div>
          <div className="flex items-center gap-2 hidden md:flex">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">kontak@sikda-kesehatan.go.id</span>
          </div>
        </div>
        <div className="flex items-center h-full">
          <Link 
            href="/login?portal=faskes" 
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 h-full px-4 sm:px-6 transition-colors font-bold text-[11px] uppercase tracking-wider text-white"
          >
            <LogIn className="w-3.5 h-3.5" /> Portal Faskes
          </Link>
          <Link 
            href="/login?portal=dinkes" 
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-full px-4 sm:px-6 transition-colors font-bold text-[11px] uppercase tracking-wider text-white border-l border-emerald-500"
          >
            <Activity className="w-3.5 h-3.5" /> Command Center Dinkes
          </Link>
        </div>
      </div>

      {/* MAIN NAVBAR - WITH DROOPING LOGO */}
      <nav className="bg-white/95 backdrop-blur-sm h-20 flex items-center justify-end md:justify-between z-40 relative shadow-sm px-6">
        
        {/* HANGING LOGO CONTAINER */}
        <div className="absolute top-0 left-6 md:left-24 lg:left-32 bg-white px-8 pb-8 pt-6 shadow-md z-50 flex flex-col items-center justify-center border-t-0">
          <div className="relative mb-2">
            <HeartPulse className="w-12 h-12 text-blue-500" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full" style={{clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}}></div>
          </div>
          <span className="text-xl font-black tracking-widest uppercase text-slate-800 leading-none">SIKDA</span>
          <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-1">KESEHATAN DAERAH</span>
        </div>

        <div className="w-[200px] md:w-[300px]"></div> {/* Spacer for absolute logo */}

        {/* LINKS */}
        <div className="hidden lg:flex items-center gap-7 pr-4">
          <Link href="#" className="text-[11px] font-black text-slate-900 uppercase tracking-widest">BERANDA</Link>
          <Link href="#portal-gateway" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors">PORTAL AKSES</Link>
          <Link href="#services" className="text-[11px] font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">LAYANAN POLIKLINIK</Link>
          <Link href="/login?portal=faskes" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">PORTAL FASKES</Link>
          <Link href="/login?portal=dinkes" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors">DASHBOARD DINKES</Link>
          <Link href="/booking" className="text-[11px] font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">DAFTAR ONLINE</Link>
          <button className="text-blue-500 hover:text-blue-700 transition-colors ml-2">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative flex-1 flex flex-col min-h-[520px] xl:min-h-[640px] z-10 bg-slate-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-[position:50%_20%] bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/doctor_hero_bg.png')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-20 pb-36 flex flex-col justify-center h-full">
          <div className="max-w-2xl pl-6 md:pl-20">
            {/* ANGLED BADGES */}
            <div className="flex items-center mb-6 drop-shadow-md">
              <div 
                className="bg-blue-600 text-white font-black px-6 py-2 uppercase tracking-widest text-xs"
                style={{ clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)' }}
              >
                SIKDA TERPADU
              </div>
              <div 
                className="bg-emerald-600 text-white font-black px-6 py-2 uppercase tracking-widest text-xs -ml-2 pl-8"
                style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 0% 100%)' }}
              >
                KABUPATEN
              </div>
            </div>

            {/* HEADLINE */}
            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight">
              SISTEM INFORMASI <br className="hidden sm:inline"/>KESEHATAN DAERAH
            </h1>
            
            {/* SUBTITLE */}
            <p className="text-slate-300 mb-8 text-sm md:text-base leading-relaxed font-medium pr-6">
              Satu ekosistem digital terpadu untuk pelayanan klinis fasilitas kesehatan (Puskesmas & Klinik) dan pusat komando pengawasan eksekutif Dinas Kesehatan Kabupaten.
            </p>
            
            {/* HERO DUAL PORTAL BUTTONS */}
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/login?portal=faskes" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Masuk Portal Faskes
              </Link>
              <Link 
                href="/login?portal=dinkes" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4" /> Command Center Dinkes
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* SECTION: DUAL PORTAL ACCESS GATEWAY */}
      <section id="portal-gateway" className="relative z-20 -mt-20 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Portal Pelayanan Faskes */}
          <div className="bg-white p-8 md:p-10 border-t-4 border-t-blue-600 shadow-2xl rounded-none flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-black text-[11px] uppercase tracking-wider border border-blue-200">
                  Pelayanan Fasilitas Kesehatan
                </span>
                <span className="text-xs font-bold text-slate-400">Puskesmas / Klinik</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Portal Pelayanan Faskes
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Akses khusus tenaga operasional medis dan administrasi untuk pelayanan pasien, rekam medis elektronik (RME), farmasi, dan loket.
              </p>

              <div className="space-y-3 mb-8 text-xs text-slate-700 font-medium border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Pendaftaran Pasien, Antrean Poliklinik & Bridging BPJS / SATUSEHAT</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Input Rekam Medis (RME), Diagnosa ICD-10 & Prosedur Tindakan ICD-9</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Pelayanan Resep Farmasi, Laboratorium, Radiologi & Kasir</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Pengelolaan Sarana Ruangan, Bed Rawat Inap & Aset Alkes Puskesmas</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?portal=faskes"
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest text-center shadow-md hover:shadow-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-700"
            >
              Masuk Portal Layanan Faskes <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 2: Command Center Dinas Kesehatan */}
          <div className="bg-white p-8 md:p-10 border-t-4 border-t-emerald-600 shadow-2xl rounded-none flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-black text-[11px] uppercase tracking-wider border border-emerald-200">
                  Pusat Komando Wilayah
                </span>
                <span className="text-xs font-bold text-slate-400">Pemerintah Kabupaten</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Command Center Dinas Kesehatan
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Akses eksekutif Kepala Dinas & jajaran untuk memantau indikator makro, kesiapan sarpras, dan ketimpangan tenaga medis antar-faskes.
              </p>

              <div className="space-y-3 mb-8 text-xs text-slate-700 font-medium border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Analisis Beban Kerja & Rasio Dokter per Pasien Se-Kabupaten</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Monitoring BOR Keterisian Kamar & Kesiapan Bed IGD 24 Jam</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Deteksi Dini Kelangkaan Stok Obat & Logistik Farmasi Daerah</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
                  <span>Pengawasan Alkes Kritis Rusak & Penerbitan SK Mutasi Nakes</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?portal=dinkes"
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest text-center shadow-md hover:shadow-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-700"
            >
              Masuk Command Center Dinkes <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>



      {/* SECTION 2: FITUR UNGGULAN (Why Choose Us) */}
      <section className="py-24 bg-slate-50 border-t border-slate-200 px-6 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-6">Mengapa Memilih Kami?</h2>
            <div className="w-24 h-1.5 bg-blue-500 mx-auto mb-8"></div>
            <p className="text-slate-600 max-w-2xl mx-auto text-base leading-relaxed">
              SIKDA Terpadu didukung oleh ekosistem digital terintegrasi untuk memberikan pelayanan kesehatan yang lebih cepat, akurat, dan sepenuhnya bebas kertas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-10 border-t-4 border-t-blue-500 hover:-translate-y-3 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-slate-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors flex items-center justify-center rounded-none mb-8 shadow-inner">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Rekam Medis Elektronik</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Riwayat kesehatan Anda tersimpan aman dan terpusat dalam sistem elektronik tanpa risiko kehilangan atau kerusakan fisik.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-10 border-t-4 border-t-blue-500 hover:-translate-y-3 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-slate-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors flex items-center justify-center rounded-none mb-8 shadow-inner">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Terintegrasi SATUSEHAT</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Data kesehatan Anda terhubung langsung ke aplikasi SATUSEHAT Kemenkes RI di smartphone Anda secara real-time dan transparan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-10 border-t-4 border-t-blue-500 hover:-translate-y-3 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-slate-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors flex items-center justify-center rounded-none mb-8 shadow-inner">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Pelayanan BPJS & Umum</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Akses pendaftaran antrean secara online yang sangat mudah bagi pasien BPJS maupun pasien Umum tanpa harus antre berlama-lama di loket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LAYANAN POLIKLINIK */}
      <section id="services" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-6">Layanan Poliklinik</h2>
              <div className="w-24 h-1.5 bg-blue-500 mb-6"></div>
              <p className="text-slate-500 max-w-2xl text-base leading-relaxed">
                Fasilitas pelayanan super lengkap dengan dukungan tenaga medis profesional yang siap menangani keluhan kesehatan Anda setiap saat.
              </p>
            </div>
            <Link href="/booking" className="bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-none transition-colors whitespace-nowrap shadow-sm">
              Lihat Semua Layanan
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Poli Umum', icon: <User className="w-8 h-8" /> },
              { title: 'Poli Gigi', icon: <Activity className="w-8 h-8" /> },
              { title: 'Poli KIA & KB', icon: <Baby className="w-8 h-8" /> },
              { title: 'Poli Lansia', icon: <Heart className="w-8 h-8" /> },
              { title: 'UGD 24 Jam', icon: <Ambulance className="w-8 h-8" /> },
              { title: 'Laboratorium', icon: <TestTube className="w-8 h-8" /> },
              { title: 'Farmasi', icon: <Pill className="w-8 h-8" /> },
              { title: 'Gizi & PTM', icon: <Apple className="w-8 h-8" /> },
            ].map((service, index) => (
              <div key={index} className="bg-white border-2 border-slate-100 p-8 hover:bg-blue-600 hover:border-blue-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group flex flex-col items-center justify-center text-center min-h-[180px] cursor-pointer relative overflow-hidden">
                {/* Background Hover Accent */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rotate-45 z-0"></div>
                
                <div className="relative z-10 w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-colors flex items-center justify-center mb-6 rounded-none shadow-sm">
                  {service.icon}
                </div>
                <h4 className="font-bold text-slate-700 text-sm md:text-base uppercase tracking-widest group-hover:text-white transition-colors relative z-10">{service.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PROGRAM KESEHATAN MASYARAKAT (UKM) */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400 opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase tracking-widest mb-6">Program Kesehatan Masyarakat</h2>
            <div className="w-24 h-1.5 bg-yellow-400 mx-auto mb-8"></div>
            <p className="text-blue-100 max-w-2xl mx-auto text-base leading-relaxed">
              Kami proaktif membangun komunitas sehat dengan upaya promotif dan preventif secara berkelanjutan ke tengah-tengah masyarakat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-10 border border-white/20 hover:bg-white/20 transition-colors shadow-2xl group">
              <h4 className="text-xl font-black mb-4 text-yellow-400 group-hover:text-white transition-colors">Posyandu Digital</h4>
              <p className="text-blue-100 text-sm leading-relaxed">Pelayanan ibu hamil, balita, imunisasi yang datanya terintegrasi penuh secara elektronik.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 border border-white/20 hover:bg-white/20 transition-colors shadow-2xl group">
              <h4 className="text-xl font-black mb-4 text-yellow-400 group-hover:text-white transition-colors">Skrining PTM</h4>
              <p className="text-blue-100 text-sm leading-relaxed">Pemeriksaan Penyakit Tidak Menular (Hipertensi, Diabetes, Obesitas) di wilayah kerja.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 border border-white/20 hover:bg-white/20 transition-colors shadow-2xl group">
              <h4 className="text-xl font-black mb-4 text-yellow-400 group-hover:text-white transition-colors">Home Care</h4>
              <p className="text-blue-100 text-sm leading-relaxed">Kunjungan rumah intensif oleh tenaga kesehatan khusus untuk lansia dan penyakit kronis.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 border border-white/20 hover:bg-white/20 transition-colors shadow-2xl group">
              <h4 className="text-xl font-black mb-4 text-yellow-400 group-hover:text-white transition-colors">Deteksi Dini TB</h4>
              <p className="text-blue-100 text-sm leading-relaxed">Program pelacakan kontak erat dan pengobatan Tuberkulosis berstandar operasional WHO.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ALUR PELAYANAN */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-6">Alur Pelayanan Digital</h2>
            <div className="w-24 h-1.5 bg-blue-500 mx-auto mb-6"></div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start relative gap-10 md:gap-0">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-300 z-0"></div>

            {[
              { step: '01', title: 'Booking Online', desc: 'Daftar dari rumah menggunakan NIK/BPJS. Dapatkan QR Code.' },
              { step: '02', title: 'Check-in Kiosk', desc: 'Scan QR Code di Puskesmas dan lakukan pengukuran tanda vital.' },
              { step: '03', title: 'Periksa Medis', desc: 'Konsultasi dengan Dokter. Rekam medis langsung tersimpan di sistem.' },
              { step: '04', title: 'Ambil Obat', desc: 'Resep terkirim otomatis. Ambil obat di farmasi tanpa kertas resep.' }
            ].map((flow, index) => (
              <div key={index} className="flex flex-col items-center text-center relative z-10 w-full md:w-1/4 px-6 group">
                <div className="w-24 h-24 bg-white border-4 border-blue-50 text-blue-600 font-black text-3xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all duration-300 rounded-none transform rotate-3 group-hover:rotate-0">
                  {flow.step}
                </div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4 group-hover:text-blue-600 transition-colors">{flow.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{flow.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: JADWAL DOKTER */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-6">Jadwal Dokter Spesialis & Umum</h2>
            <div className="w-24 h-1.5 bg-blue-500 mx-auto mb-6"></div>
          </div>

          <div className="overflow-x-auto p-2 border-4 border-slate-100 shadow-xl bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white text-xs lg:text-sm uppercase tracking-widest border-b-4 border-blue-700">
                  <th className="p-6 font-black whitespace-nowrap">Nama Dokter</th>
                  <th className="p-6 font-black whitespace-nowrap">Poliklinik</th>
                  <th className="p-6 font-black whitespace-nowrap">Hari Praktik</th>
                  <th className="p-6 font-black whitespace-nowrap text-right">Jam Praktik</th>
                </tr>
              </thead>
              <tbody className="text-sm lg:text-base text-slate-700">
                {[
                  { name: 'dr. Andi Pratama', poli: 'Poli Umum', days: 'Senin - Rabu', hours: '08:00 - 14:00' },
                  { name: 'dr. Budi Santoso', poli: 'Poli Umum', days: 'Kamis - Sabtu', hours: '08:00 - 14:00' },
                  { name: 'drg. Clara Wijaya', poli: 'Poli Gigi', days: 'Senin, Rabu, Jumat', hours: '08:00 - 12:00' },
                  { name: 'dr. Dini Amalia, Sp.A', poli: 'Poli Anak (KIA)', days: 'Selasa & Kamis', hours: '09:00 - 13:00' },
                  { name: 'dr. Eko Purnomo', poli: 'UGD 24 Jam', days: 'Setiap Hari', hours: 'Shift 1 & 2' },
                ].map((doc, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-blue-50 transition-colors group">
                    <td className="p-6 font-bold text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap">{doc.name}</td>
                    <td className="p-6 whitespace-nowrap"><span className="bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors rounded-none">{doc.poli}</span></td>
                    <td className="p-6 font-medium whitespace-nowrap">{doc.days}</td>
                    <td className="p-6 font-black text-right text-slate-900 whitespace-nowrap">{doc.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 7: FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-20 pb-10 px-6 border-t-[6px] border-blue-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          
          {/* Logo & About */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6 text-white">
              <HeartPulse className="w-8 h-8 text-blue-500" />
              <div>
                <span className="text-xl font-black tracking-widest uppercase leading-none block">SIKDA</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-blue-400 uppercase">KESEHATAN DAERAH</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-6">
              Sistem Informasi Kesehatan Daerah terpadu untuk pelayanan kesehatan faskes dan pengawasan dinas kesehatan yang akurat, transparan, dan terintegrasi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Tautan Cepat</h4>
            <ul className="space-y-3 text-xs">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Beranda</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Tentang Kami</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Layanan Poliklinik</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Jadwal Dokter</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Pendaftaran Online</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Kontak Kami</h4>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <p>Jl. Kesehatan No. 123, Kelurahan Bahagia, Kecamatan Sehat, Kota Medika, Provinsi Harmoni 12345</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-500" />
                <p>(021) 555-1234 / 0812-3456-7890 (UGD 24 Jam)</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-500" />
                <p>info@sikda-kesehatan.go.id</p>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest">
          <p>© 2026 SIKDA Kesehatan Daerah. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
