"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Stethoscope,
  Menu,
  X,
  Activity,
  Building,
  Pill,
  ClipboardList,
  Package,
  History,
  TestTubes,
  Wallet,
  HeartPulse,
  AlertCircle,
  Radio,
  BedDouble
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '../../store/auth.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<'ADMINISTRASI' | 'PERAWAT' | 'DOKTER' | 'ADMIN' | 'APOTEKER' | 'LABORATORIUM' | 'RADIOLOGI' | 'KASIR' | 'PETUGAS_UKM' | 'DINKES_ADMIN' | 'DINKES_MONITORING'>('ADMINISTRASI');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, checkSession, logout } = useAuthStore();

  React.useEffect(() => {
    checkSession().then(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.push('/login');
        return;
      }
      
      if (state.user?.role) {
        setRole(state.user.role as any);
      }
    });
  }, [checkSession, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar Placeholder (Reserves horizontal space for the mini sidebar on desktop) */}
      <div className="w-20 flex-shrink-0 hidden md:block print:hidden"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden transition-opacity print:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mini-to-Full Collapsible Sidebar (Desktop) & Off-canvas Drawer (Mobile) */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-sm md:hover:shadow-2xl group print:hidden
        ${isMobileMenuOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64'} 
        md:translate-x-0 md:w-20 md:hover:w-64`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 min-w-[16rem] flex-shrink-0 justify-between">
          <div className="flex items-center">
            <Stethoscope className="w-8 h-8 text-blue-600 flex-shrink-0 transition-transform md:group-hover:scale-110 duration-300" />
            <span className="text-xl font-bold text-gray-900 tracking-tight ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300">SIKDA</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-600 p-1" onClick={closeMobileMenu}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 py-6 space-y-2 min-w-[16rem] overflow-y-auto overflow-x-hidden">
          {/* Menu Khusus Admin (Petugas Loket) */}
          {role === 'ADMINISTRASI' && (
            <>
              <Link href="/administrasi" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Antrian</span>
              </Link>
              
              <Link href="/administrasi/pendaftaran" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi/pendaftaran' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <UserPlus className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi/pendaftaran' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Pendaftaran Pasien</span>
              </Link>

              <Link href="/administrasi/master-pasien" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi/master-pasien' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Users className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi/master-pasien' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Data Pasien</span>
              </Link>

              <Link href="/administrasi/monitoring-encounter" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi/monitoring-encounter' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi/monitoring-encounter' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Monitoring FHIR</span>
              </Link>

              <Link href="/administrasi/antrian-rujukan" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi/antrian-rujukan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi/antrian-rujukan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Antrean Rujukan</span>
              </Link>

              <Link href="#" className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <FileText className="w-7 h-7 text-gray-400 md:group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Laporan Kunjungan</span>
              </Link>
            </>
          )}

          {/* Menu Khusus ADMIN (Superuser / HRD) */}
          {role === 'ADMIN' && (
            <>
              <Link href="/admin" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Admin</span>
              </Link>

              <Link href="/admin/perusahaan" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/perusahaan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Building className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/perusahaan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Perusahaan</span>
              </Link>
              
              <Link href="/admin/master-klinik" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/master-klinik' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Stethoscope className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/master-klinik' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Klinik & Poli</span>
              </Link>

              <Link href="/admin/aset-ruangan" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname.startsWith('/admin/aset-ruangan') ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Package className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname.startsWith('/admin/aset-ruangan') ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Aset & Ruangan</span>
              </Link>

              <Link href="/admin/master-dokter" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/master-dokter' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Users className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/master-dokter' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Dokter</span>
              </Link>

              <Link href="/admin/master-pasien" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/master-pasien' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Users className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/master-pasien' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Data Pasien</span>
              </Link>

              <Link href="/admin/icd10" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/icd10' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/icd10' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Data ICD-10</span>
              </Link>

              <Link href="/admin/icd9" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/icd9' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Stethoscope className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/icd9' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Data ICD-9</span>
              </Link>

              <Link href="/admin/master-obat" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/master-obat' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Pill className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/master-obat' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Obat</span>
              </Link>

              <Link href="/admin/master-alergi" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/admin/master-alergi' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <AlertCircle className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/admin/master-alergi' ? 'text-red-600' : 'text-gray-400 md:group-hover:text-red-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Alergi</span>
              </Link>

              <Link href="/administrasi/monitoring-encounter" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/administrasi/monitoring-encounter' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/administrasi/monitoring-encounter' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Monitoring FHIR</span>
              </Link>
            </>
          )}

          {/* Menu Khusus Perawat / Medis */}
          {role === 'PERAWAT' && (
            <>
              <Link href="/perawat" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/perawat' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/perawat' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Antrian Pemeriksaan</span>
              </Link>

              <Link href="/perawat/screening" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/perawat/screening' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/perawat/screening' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Screening & Triage</span>
              </Link>

              <Link href="/dokter/rawat-jalan" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter/rawat-jalan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Stethoscope className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter/rawat-jalan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Input RME Dokter</span>
              </Link>

              <Link href="#" className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Users className="w-7 h-7 text-gray-400 md:group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Jadwal Poliklinik</span>
              </Link>
            </>
          )}

          {/* Menu Khusus Dokter */}
          {role === 'DOKTER' && (
            <>
              <Link href="/dokter" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Poli</span>
              </Link>

              {(!user?.poliklinik?.namaPoli?.toUpperCase().includes('IGD') && 
                !user?.poliklinik?.namaPoli?.toUpperCase().includes('UGD') && 
                !user?.poliklinik?.namaPoli?.toUpperCase().includes('INAP')) && (
                <Link href="/dokter/rawat-jalan" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter/rawat-jalan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                  <Stethoscope className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter/rawat-jalan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                  <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Rawat Jalan</span>
                </Link>
              )}

              {(user?.poliklinik?.namaPoli?.toUpperCase().includes('IGD') || 
                user?.poliklinik?.namaPoli?.toUpperCase().includes('UGD')) && (
                <Link href="/dokter/ugd" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter/ugd' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                  <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter/ugd' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                  <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">UGD / Gawat Darurat</span>
                </Link>
              )}
              
              {(user?.poliklinik?.namaPoli?.toUpperCase().includes('INAP')) && (
                <Link href="/dokter/rawatinap" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter/rawatinap' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                  <Users className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter/rawatinap' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                  <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Visit Rawat Inap</span>
                </Link>
              )}

              <Link href="/dokter/rme-dokter" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dokter/rme-dokter' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dokter/rme-dokter' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Rekam Medis (RME)</span>
              </Link>

              <div className="mt-4 mb-1 px-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Surat & Dokumen</span>
              </div>
              <Link href="/dokter/surat-sakit" onClick={closeMobileMenu} className={`flex items-center px-6 py-2.5 text-sm font-medium transition-colors ${pathname === '/dokter/surat-sakit' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-6 h-6 flex-shrink-0 ml-1 transition-colors ${pathname === '/dokter/surat-sakit' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Surat Ket. Sakit</span>
              </Link>
              <Link href="/dokter/surat-sehat" onClick={closeMobileMenu} className={`flex items-center px-6 py-2.5 text-sm font-medium transition-colors ${pathname === '/dokter/surat-sehat' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-6 h-6 flex-shrink-0 ml-1 transition-colors ${pathname === '/dokter/surat-sehat' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Surat Ket. Sehat</span>
              </Link>
              <Link href="/dokter/surat-rujukan" onClick={closeMobileMenu} className={`flex items-center px-6 py-2.5 text-sm font-medium transition-colors ${pathname === '/dokter/surat-rujukan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-6 h-6 flex-shrink-0 ml-1 transition-colors ${pathname === '/dokter/surat-rujukan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Surat Rujukan</span>
              </Link>
            </>
          )}

          {/* Menu Khusus APOTEKER */}
          {role === 'APOTEKER' && (
            <>
              <Link href="/apoteker" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/apoteker' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/apoteker' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Apoteker</span>
              </Link>
              
              <Link href="/apoteker/antrian" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/apoteker/antrian' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <ClipboardList className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/apoteker/antrian' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Antrian Resep</span>
              </Link>
              
              <Link href="/apoteker/stok" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/apoteker/stok' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Package className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/apoteker/stok' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Stok Obat</span>
              </Link>
              
              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/apoteker/riwayat' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <History className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/apoteker/riwayat' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Riwayat Obat Keluar</span>
              </Link>
            </>
          )}

          {/* Menu Khusus LABORATORIUM */}
          {role === 'LABORATORIUM' && (
            <>
              <Link href="/laboratorium" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/laboratorium' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/laboratorium' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Visual</span>
              </Link>
              
              <Link href="/laboratorium/antrian" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/laboratorium/antrian' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <ClipboardList className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/laboratorium/antrian' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Antrean Uji Lab</span>
              </Link>
            </>
          )}

          {/* Menu Khusus RADIOLOGI */}
          {(role === 'ADMIN' || role === 'DOKTER' || role === 'RADIOLOGI') && (
            <Link href="/radiologi" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/radiologi' ? 'text-purple-700 bg-purple-50 border-r-4 border-purple-600' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
              <Radio className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/radiologi' ? 'text-purple-600' : 'text-gray-400 md:group-hover:text-purple-600'}`} />
              <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Unit Radiologi</span>
            </Link>
          )}

          {/* Menu Khusus KASIR */}
          {role === 'KASIR' && (
            <>
              <Link href="/kasir" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/kasir' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Wallet className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/kasir' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Kasir</span>
              </Link>
              
              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/kasir/pendapatan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/kasir/pendapatan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Laporan Pendapatan</span>
              </Link>
              
              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/kasir/piutang' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <ClipboardList className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/kasir/piutang' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Piutang Pasien</span>
              </Link>

              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/kasir/klaim-bpjs' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Building className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/kasir/klaim-bpjs' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Klaim BPJS</span>
              </Link>
            </>
          )}

          {user?.role === 'PETUGAS_UKM' && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              
              <Link href="/ukm" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/ukm' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/ukm' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard UKM</span>
              </Link>

              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/ukm/p2p' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <HeartPulse className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/ukm/p2p' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">P2P (HIV, TB, dsb)</span>
              </Link>

              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/ukm/kia' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Users className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/ukm/kia' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Posyandu & KIA</span>
              </Link>

              <Link href="#" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/ukm/laporan' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <FileText className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/ukm/laporan' ? 'text-blue-600' : 'text-gray-400 md:group-hover:text-blue-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Laporan Bulanan UKM</span>
              </Link>
            </div>
          )}

          {/* Menu Khusus DINAS KESEHATAN */}
          {(role === 'DINKES_ADMIN' || role === 'DINKES_MONITORING') && (
            <div className="space-y-1">
              <div className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-emerald-600 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                Dinas Kesehatan
              </div>
              <Link href="/dinkes" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <LayoutDashboard className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Dashboard Eksekutif</span>
              </Link>

              <Link href="/dinkes/workload" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes/workload' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <Activity className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes/workload' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Beban Kerja & Nakes</span>
              </Link>

              <Link href="/dinkes/beds" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes/beds' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <BedDouble className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes/beds' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Monitoring BOR & Bed</span>
              </Link>

              <Link href="/dinkes/assets" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes/assets' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <Package className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes/assets' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Aset & Alkes Daerah</span>
              </Link>

              <Link href="/dinkes/medicines" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes/medicines' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <Pill className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes/medicines' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Stok Obat Faskes</span>
              </Link>

              <Link href="/dinkes/faskes" onClick={closeMobileMenu} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/dinkes/faskes' ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <Building className={`w-7 h-7 flex-shrink-0 transition-colors ${pathname === '/dinkes/faskes' ? 'text-emerald-600' : 'text-gray-400 md:group-hover:text-emerald-600'}`} />
                <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Master Faskes Kab.</span>
              </Link>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-100">
            <Link href="#" className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <Settings className="w-7 h-7 text-gray-400 md:group-hover:text-blue-600 flex-shrink-0 transition-colors" />
              <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Pengaturan</span>
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 min-w-[16rem] flex-shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <LogOut className="w-7 h-7 flex-shrink-0" />
            <span className="ml-4 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 whitespace-nowrap">Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0 print:hidden">
          <div className="flex-1 flex items-center gap-3">
            
            {/* Hamburger Menu (Mobile/Tablet Only) */}
            <button 
              className="md:hidden mr-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Active Faskes / Dinkes Context Indicator */}
            {user?.faskes?.namaFaskes ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 text-xs font-semibold rounded-lg">
                <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-xs">{user.faskes.namaFaskes}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded uppercase font-bold tracking-wider">
                  {user.faskes.tipeFaskes || 'PUSKESMAS'}
                </span>
              </div>
            ) : (role === 'DINKES_ADMIN' || role === 'DINKES_MONITORING') ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 text-xs font-semibold rounded-lg">
                <Building className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Dinas Kesehatan Kabupaten</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded uppercase font-bold tracking-wider">
                  DINKES
                </span>
              </div>
            ) : null}

          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors hidden sm:block">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center sm:border-l sm:border-gray-200 sm:pl-4 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded-md transition-colors">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                {role === 'ADMINISTRASI' ? 'A' : role === 'PERAWAT' ? 'P' : role === 'APOTEKER' ? 'F' : role === 'LABORATORIUM' ? 'L' : role === 'KASIR' ? 'K' : role === 'DOKTER' ? 'D' : role === 'RADIOLOGI' ? 'R' : 'DK'}
              </div>
              <div className="ml-3 hidden sm:block text-sm text-left">
                <p className="font-bold text-gray-900 leading-none">
                  {user?.namaLengkap || user?.nama_lengkap || 'Petugas'}
                </p>
                <p className="text-gray-500 mt-1 text-xs uppercase tracking-wide">
                  {role}{user?.poliklinik?.namaPoli ? ` - ${user.poliklinik.namaPoli}` : user?.poliklinikId ? ` - ${user.poliklinikId}` : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
