"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  HeartPulse, 
  Building2, 
  Stethoscope, 
  Activity,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();

  const portalParam = searchParams.get('portal');
  const [activePortal, setActivePortal] = useState<'faskes' | 'dinkes'>('faskes');
  const [activeFaskesTab, setActiveFaskesTab] = useState<'cibinong' | 'sukamakmur'>('cibinong');

  useEffect(() => {
    if (portalParam === 'dinkes') {
      setActivePortal('dinkes');
    } else {
      setActivePortal('faskes');
    }
  }, [portalParam]);

  const handleSwitchPortal = (portal: 'faskes' | 'dinkes') => {
    setActivePortal(portal);
    if (error) clearError();
    router.replace(`/login?portal=${portal}`, { scroll: false });
  };

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) clearError();
  };

  const handleQuickFill = (username: string) => {
    setFormData({ username, password: 'password123' });
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      
      // Ambil user dari store setelah berhasil login
      const user = useAuthStore.getState().user;
      
      // Routing cerdas otomatis mendeteksi role terdaftar
      if (user?.role === 'DINKES_ADMIN' || user?.role === 'DINKES_MONITORING') {
        router.push('/dinkes');
      } else if (user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (user?.role === 'ADMINISTRASI') {
        router.push('/administrasi');
      } else if (user?.role === 'PERAWAT') {
        router.push('/perawat');
      } else if (user?.role === 'DOKTER') {
        router.push('/dokter');
      } else if (user?.role === 'APOTEKER') {
        router.push('/apoteker');
      } else if (user?.role === 'LABORATORIUM') {
        router.push('/laboratorium');
      } else if (user?.role === 'RADIOLOGI') {
        router.push('/radiologi');
      } else if (user?.role === 'KASIR') {
        router.push('/kasir');
      } else if (user?.role === 'PETUGAS_UKM') {
        router.push('/ukm');
      } else {
        router.push('/administrasi');
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const isDinkes = activePortal === 'dinkes';

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-white">
      
      {/* LEFT SIDE - BRANDING */}
      <div className={`hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden p-12 transition-colors duration-500 ${
        isDinkes ? 'bg-slate-950' : 'bg-slate-900'
      }`}>
        {/* Background Decor */}
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" 
          style={{ backgroundImage: "url('/doctor_hero_bg.png')" }}
        ></div>
        <div className={`absolute inset-0 mix-blend-multiply z-0 transition-colors duration-500 ${
          isDinkes ? 'bg-emerald-950/90' : 'bg-blue-950/90'
        }`}></div>
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0" 
          style={{ 
            backgroundImage: `radial-gradient(${isDinkes ? '#10b981' : '#3b82f6'} 1px, transparent 1px)`, 
            backgroundSize: '32px 32px' 
          }}
        ></div>

        <div className="relative z-10">
          <Link 
            href="/" 
            className={`inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors ${
              isDinkes ? 'text-emerald-400 hover:text-emerald-300' : 'text-blue-400 hover:text-blue-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform hover:-translate-x-1" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="relative z-10 my-auto">
          <div className="flex items-center gap-3 mb-8 text-white">
            <div className={`w-14 h-14 flex items-center justify-center rounded-none shadow-lg border-2 transition-colors ${
              isDinkes ? 'bg-emerald-600 border-emerald-400' : 'bg-blue-600 border-blue-400'
            }`}>
              {isDinkes ? (
                <Building2 className="w-8 h-8 text-white" />
              ) : (
                <HeartPulse className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <span className="text-4xl font-black tracking-widest uppercase leading-none block">SIKDA</span>
              <span className={`text-[10px] font-bold tracking-[0.35em] uppercase ${
                isDinkes ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {isDinkes ? 'PUSAT KOMANDO DINKES' : 'PELAYANAN FASKES'}
              </span>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            {isDinkes ? (
              <>Pusat Komando Eksekutif <br/><span className="text-emerald-400">Dinas Kesehatan Kabupaten</span></>
            ) : (
              <>Portal Pelayanan Medis <br/><span className="text-blue-400">Puskesmas & Fasilitas Kesehatan</span></>
            )}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-md border-l-4 pl-4 mb-8 border-current transition-colors">
            {isDinkes ? (
              'Platform pengawasan terpadu untuk monitoring lalu lintas pasien, beban kerja nakes, ketersediaan tempat tidur, dan logistik se-Kabupaten.'
            ) : (
              'Platform digital operasional untuk pendaftaran pasien, rekam medis elektronik (RME), resep obat, laboratorium, dan administrasi faskes.'
            )}
          </p>

          <div className="space-y-2 text-xs text-slate-300">
            {isDinkes ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Monitoring Indikator Makro Kesehatan Daerah</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Analisis Beban Kerja & Rekomendasi Mutasi Dokter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Pantauan BOR Tempat Tidur & Alkes Kritis Se-Kabupaten</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Antrean Loket & Pendaftaran Pasien Terintegrasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Pemeriksaan RME Dokter & Kode ICD-10 / ICD-9</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Pelayanan Farmasi, Obat, Lab, Radiologi & Kasir</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
          © 2026 SIKDA Kesehatan Daerah. Seluruh Hak Cipta Dilindungi.
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center p-4 sm:p-8 lg:p-10 relative bg-slate-50 overflow-y-auto">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="lg:hidden w-full max-w-md pt-2 pb-4 flex items-center justify-between text-slate-900 flex-shrink-0">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-500 uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-1" /> Beranda
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isDinkes ? 'DINKES KABUPATEN' : 'PELAYANAN FASKES'}
          </span>
        </div>

        <div className="w-full max-w-md my-auto py-4 sm:py-6">
          
          {/* PORTAL SWITCHER TABS - SELALU TAMPAK JELAS DI ATAS KARTU LOGIN */}
          <div className="bg-slate-200/90 p-1.5 rounded-xl flex mb-6 border border-slate-300 shadow-sm">
            <button
              type="button"
              id="tab-petugas-faskes"
              onClick={() => handleSwitchPortal('faskes')}
              className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition-all ${
                !isDinkes
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              Petugas Faskes
            </button>
            <button
              type="button"
              id="tab-dinas-kesehatan"
              onClick={() => handleSwitchPortal('dinkes')}
              className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition-all ${
                isDinkes
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Dinas Kesehatan
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {isDinkes ? 'Command Center Dinkes' : 'Portal Pelayanan Faskes'}
            </h2>
            <div className={`w-14 h-1.5 mb-3 transition-colors ${isDinkes ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
              {isDinkes ? (
                'Masuk dengan kredensial Administrator atau Pejabat Dinas Kesehatan untuk memantau data agregat wilayah se-Kabupaten.'
              ) : (
                'Masuk dengan kredensial dokter, perawat, loket, apoteker, atau admin faskes untuk mengelola layanan pasien.'
              )}
            </p>
          </div>

          <div className={`bg-white p-6 sm:p-8 border-t-4 shadow-xl rounded-none relative transition-colors ${
            isDinkes ? 'border-t-emerald-600' : 'border-t-blue-600'
          }`}>
            
            <div className="mb-5 flex items-center justify-between bg-slate-50 py-2 px-3 border border-slate-200">
              <div className="flex items-center">
                <ShieldCheck className={`w-4 h-4 mr-2 ${isDinkes ? 'text-emerald-600' : 'text-blue-600'}`} />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {isDinkes ? 'Akses Eksekutif Dinkes' : 'Akses Operasional Faskes'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                isDinkes ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isDinkes ? 'Global Scope' : 'Multi-Tenant'}
              </span>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3.5">
                <p className="text-xs font-bold text-red-700">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-sm text-slate-900 font-medium outline-none rounded-none"
                  placeholder={isDinkes ? 'Contoh: admin_dinkes / kadinkes' : 'Contoh: dr_cibinong / dr_sukamakmur'}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-sm text-slate-900 font-medium outline-none rounded-none"
                  placeholder="Masukkan password Anda"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-3.5 px-4 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed rounded-none ${
                    isDinkes ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      MEMPROSES...
                    </>
                  ) : isDinkes ? (
                    'MASUK COMMAND CENTER DINKES'
                  ) : (
                    'MASUK PORTAL LAYANAN FASKES'
                  )}
                </button>
              </div>
            </form>

            {/* QUICK DEMO ACCOUNTS HELPER */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <UserCheck className={`w-3.5 h-3.5 ${isDinkes ? 'text-emerald-600' : 'text-blue-600'}`} />
                  Akun Demo (Klik untuk Isi Otomatis)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">pwd: password123</span>
              </div>

              {isDinkes ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin_dinkes')}
                    className="text-left p-2.5 rounded border border-emerald-200 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all group"
                  >
                    <span className="font-bold text-slate-800 text-xs block group-hover:text-emerald-700">admin_dinkes</span>
                    <span className="text-[10px] text-emerald-700 block">Administrator Dinkes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('kadinkes')}
                    className="text-left p-2.5 rounded border border-emerald-200 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all group"
                  >
                    <span className="font-bold text-slate-800 text-xs block group-hover:text-emerald-700">kadinkes</span>
                    <span className="text-[10px] text-emerald-700 block">dr. Hendra (Kepala Dinas)</span>
                  </button>
                </div>
              ) : (
                <div>
                  {/* SUB-TABS PILIH FASKES */}
                  <div className="flex gap-1.5 mb-2.5 bg-slate-100 p-1 rounded">
                    <button
                      type="button"
                      onClick={() => setActiveFaskesTab('cibinong')}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        activeFaskesTab === 'cibinong'
                          ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🏥 Cibinong Raya
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFaskesTab('sukamakmur')}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        activeFaskesTab === 'sukamakmur'
                          ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ⛰️ Sukamakmur
                    </button>
                  </div>

                  {activeFaskesTab === 'cibinong' ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('admin_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="admin_cibinong (Administrator)"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('dr_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="dr_cibinong (dr. Sarah - Poli Umum)"
                      >
                        dr_cibinong
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('drg_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="drg_cibinong (drg. Tri - Poli Gigi)"
                      >
                        drg_cibinong
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('perawat_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="perawat_cibinong (Ns. Ratna)"
                      >
                        Perawat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('loket_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="loket_cibinong (Pendaftaran)"
                      >
                        Loket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('apoteker_cibinong')}
                        className="py-1.5 px-2 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="apoteker_cibinong (Apt. Rudi)"
                      >
                        Apoteker
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('admin_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="admin_sukamakmur (Admin Sukamakmur)"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('dr_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="dr_sukamakmur (dr. Dimas - Poli Umum)"
                      >
                        dr_sukamakmur
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('drg_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="drg_sukamakmur (drg. Maya - Poli Gigi)"
                      >
                        drg_sukamakmur
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('perawat_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="perawat_sukamakmur (Bdn. Dewi - Bidan/Perawat)"
                      >
                        Bidan/Perawat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('loket_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="loket_sukamakmur (Pendaftaran)"
                      >
                        Loket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('apoteker_sukamakmur')}
                        className="py-1.5 px-2 rounded border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 text-center transition-all truncate"
                        title="apoteker_sukamakmur (Apt. Linda)"
                      >
                        Apoteker
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
              Sistem Informasi Kesehatan Daerah Terpadu.<br/>
              Khusus petugas berwenang dan jajaran Dinas Kesehatan.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white font-sans text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-blue-500" />
        Memuat Portal SIKDA...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
