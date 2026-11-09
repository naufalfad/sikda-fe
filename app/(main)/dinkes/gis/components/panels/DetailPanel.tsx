'use client';

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  Bed,
  Siren,
  Sparkles,
  Radio,
  Eye,
  ExternalLink,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Network,
} from 'lucide-react';
import { useGisUIStore } from '../../store/useGisUIStore';
import { FaskesItem } from '@/services/dinkes.service';

interface DetailPanelProps {
  data: FaskesItem;
}

export default function DetailPanel({ data }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'profil' | 'layanan' | 'armada'>('profil');
  const { showImpactRadius, setShowImpactRadius } = useGisUIStore();

  if (!data) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        Pilih salah satu fasilitas kesehatan untuk melihat detail profil.
      </div>
    );
  }

  const lat = data.latitude ?? (data.titikGps ? parseFloat(data.titikGps.split(',')[0]) : NaN);
  const lng = data.longitude ?? (data.titikGps ? parseFloat(data.titikGps.split(',')[1]) : NaN);

  const openGoogleMapsPin = (latitude: number, longitude: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
  };

  const openSmartStreetView = (latitude: number, longitude: number) => {
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`, '_blank');
  };

  const kec = data.wilayahKecamatan || data.kecamatan || 'Kabupaten Bogor';
  const desa = data.kelurahanDesa || '-';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white font-sans text-left select-none flex flex-col relative min-h-0">
      {/* PHOTO HEADER */}
      <div className="relative w-full h-48 bg-slate-900 overflow-hidden shrink-0">
        {data.fotoUrl ? (
          <img
            src={data.fotoUrl}
            alt={data.nama}
            className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              // fallback if broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Building2 size={36} className="text-slate-600 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Dokumentasi Gedung
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

        {/* Badges on Top Photo */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900/80 text-white uppercase tracking-wider backdrop-blur-xs border border-white/20">
              {data.tingkatFaskes || 'FKTP'}
            </span>
            {data.isTerintegrasiSikda ? (
              <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500 text-white uppercase tracking-wider flex items-center gap-1 shadow-xs border border-emerald-400">
                <CheckCircle2 size={11} className="text-white" />
                SIKDA AKTIF
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/90 text-white uppercase tracking-wider flex items-center gap-1 shadow-xs border border-amber-400">
                <AlertCircle size={11} className="text-white" />
                NON-SIKDA
              </span>
            )}
          </div>
          {data.akreditasi && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <ShieldCheck size={11} />
              Akreditasi {data.akreditasi}
            </span>
          )}
        </div>

        {/* Title on Bottom Photo */}
        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
            {data.kode || 'KODE FASKES'} • {data.jenis}
          </span>
          <h2 className="text-sm font-bold text-white tracking-tight leading-snug drop-shadow-sm mt-0.5 truncate">
            {data.nama}
          </h2>
        </div>
      </div>

      {/* SIKDA INTEGRATION STATUS CARD BANNER */}
      {data.isTerintegrasiSikda ? (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-700" />
                Terintegrasi Sistem SIKDA
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-sm">
              {data.totalUsers || 0} Akun Staf &amp; Nakes
            </span>
          </div>
          <p className="text-[10px] text-emerald-800 mt-1 leading-relaxed">
            Faskes ini aktif terhubung ke ekosistem SIKDA Kab. Bogor dengan {data.totalUsers || 0} akun staf operasional (Dokter, Perawat, Loket Pendaftaran, Farmasi, Kasir &amp; Lab).
          </p>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/90 border-b border-amber-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-600 shrink-0" />
              <span className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
                Belum Terintegrasi SIKDA
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-sm">
              0 Akun Terdaftar
            </span>
          </div>
          <p className="text-[10px] text-amber-800 mt-1 leading-relaxed">
            Fasilitas ini terdaftar dalam basis data pemetaan wilayah Dinas Kesehatan, namun belum mengaktifkan akun operasional atau melakukan bridging ke aplikasi SIKDA.
          </p>
        </div>
      )}

      {/* TABS NAVIGATION (STICKY GOOGLE MAPS STYLE) */}
      <div className="sticky top-0 z-20 flex border-y border-slate-200 bg-white/95 backdrop-blur-md shadow-xs shrink-0">
        <button
          onClick={() => setActiveTab('profil')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
            activeTab === 'profil'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Profil &amp; Izin
        </button>
        <button
          onClick={() => setActiveTab('layanan')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
            activeTab === 'layanan'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Layanan &amp; Bed
        </button>
        <button
          onClick={() => setActiveTab('armada')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
            activeTab === 'armada'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Armada &amp; Darurat
        </button>
      </div>

      {/* TAB CONTENT 1: PROFIL & IZIN OPERASIONAL */}
      {activeTab === 'profil' && (
        <div className="divide-y divide-slate-100 flex-1">
          <DetailRow
            icon={Network}
            label="Status Integrasi SIKDA"
            value={data.isTerintegrasiSikda ? 'Terintegrasi Penuh (Online SIKDA)' : 'Belum Terkoneksi ke SIKDA'}
            subvalue={
              data.isTerintegrasiSikda
                ? `Terdaftar ${data.totalUsers || 0} akun staf operasional faskes (Dokter, Perawat/Bidan, Loket Pendaftaran, Farmasi, Kasir, dan Laboratorium).`
                : 'Fasilitas belum memiliki akun operasional aktif di platform SIKDA. Menunggu aktivasi oleh Dinas Kesehatan.'
            }
            highlight={Boolean(data.isTerintegrasiSikda)}
            badge={data.isTerintegrasiSikda ? 'AKTIF ONLINE' : 'BELUM TERDAFTAR'}
          />

          <DetailRow
            icon={UserCheck}
            label="Penanggung Jawab Medis / Kepala"
            value={data.penanggungJawab || '-'}
            subvalue={data.sipPenanggungJawab ? `SIP/STR: ${data.sipPenanggungJawab}` : undefined}
          />

          <DetailRow
            icon={FileText}
            label="Surat Izin Operasional"
            value={data.nomorIzinOperasional || 'Izin Resmi Dinas Kesehatan'}
            subvalue={
              data.tanggalIzinOperasional
                ? `Berlaku sejak: ${new Date(data.tanggalIzinOperasional).toLocaleDateString('id-ID')}`
                : undefined
            }
          />

          <DetailRow
            icon={Clock}
            label="Jam Operasional Layanan"
            value={data.jamOperasional || '24 Jam Non-Stop'}
            highlight={Boolean(data.jamOperasional?.toLowerCase().includes('24 jam'))}
          />

          <DetailRow
            icon={MapPin}
            label="Alamat Lengkap"
            value={data.alamat || '-'}
            subvalue={`Kec. ${kec}, Kel./Desa: ${desa}`}
          />

          <DetailRow
            icon={Phone}
            label="Kontak Kantor / Telepon"
            value={data.telepon || '-'}
            link={data.telepon ? `tel:${data.telepon}` : undefined}
          />

          {data.kontakDarurat && (
            <DetailRow
              icon={Siren}
              label="Hotline Gawat Darurat 24 Jam"
              value={data.kontakDarurat}
              link={`tel:${data.kontakDarurat}`}
              badge="SIAGA 24 JAM"
              highlight
            />
          )}

          {data.email && (
            <DetailRow
              icon={Mail}
              label="Email Resmi"
              value={data.email}
              link={`mailto:${data.email}`}
            />
          )}

          <DetailRow
            icon={MapPin}
            label="Titik Koordinat GPS"
            value={!isNaN(lat) && !isNaN(lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '-'}
          />

          {/* RADIUS TOGGLE BUTTON */}
          <div className="p-4 bg-slate-50/70 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700">Radius Jangkauan Pelayanan (3 KM)</span>
              <span className="text-[10px] text-slate-400">
                Visualisasikan zona layanan utama di sekeliling fasilitas
              </span>
            </div>
            <button
              onClick={() => setShowImpactRadius(!showImpactRadius)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-1 ${
                showImpactRadius
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Radio size={12} />
              {showImpactRadius ? 'Aktif' : 'Tampilkan'}
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LAYANAN & FASILITAS */}
      {activeTab === 'layanan' && (
        <div className="p-4 space-y-4 flex-1">
          {/* Layanan Unggulan */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Sparkles size={12} className="text-emerald-700" />
              Layanan Unggulan & Poli Spesialis
            </span>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 text-xs text-slate-800 leading-relaxed font-medium">
              {data.layananUnggulan ||
                'UGD 24 Jam, Poli Umum, Poli Gigi, Poli KIA/KB, Laboratorium Klinis, Farmasi'}
            </div>
          </div>

          {/* Kapasitas Tempat Tidur (Bed) */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Bed size={12} className="text-emerald-700" />
              Kapasitas Rawat Inap & Tempat Tidur
            </span>
            <div className="p-3.5 bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800">
                  {data.kapasitasBed || 'Non-Rawat Inap / Rawat Jalan'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Ketersediaan fasilitas perawatan pasien
                </span>
              </div>
              <div className="w-8 h-8 bg-slate-200 flex items-center justify-center text-slate-700">
                <Bed size={16} />
              </div>
            </div>
          </div>

          {/* Status Akreditasi & Mutu */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <ShieldCheck size={12} className="text-blue-700" />
              Status Akreditasi Kemenkes RI
            </span>
            <div className="p-3 bg-blue-50/50 border border-blue-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-900">
                  Akreditasi {data.akreditasi || 'Paripurna'}
                </span>
                <span className="text-[10px] text-blue-600">
                  Standar mutu pelayanan dan keselamatan pasien
                </span>
              </div>
              <ShieldCheck size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ARMADA AMBULANS & DARURAT */}
      {activeTab === 'armada' && (
        <div className="p-4 space-y-4 flex-1">
          <div className="p-3 bg-rose-50/60 border border-rose-200 flex items-start gap-3">
            <Siren size={20} className="text-rose-600 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-rose-900">
                {data.ketersediaanAmbulance ? 'Armada Ambulans Siaga' : 'Tidak Ada Armada Ambulans Mandiri'}
              </span>
              <span className="text-[10px] text-rose-700 mt-0.5 leading-snug">
                {data.jenisAmbulance || 'Pelayanan evakuasi terhubung dengan Unit Siaga AGD 119 Dinas Kesehatan Kab. Bogor.'}
              </span>
            </div>
          </div>

          {data.kontakDarurat && (
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                  Hotline Panggilan Cepat 24 Jam
                </span>
                <span className="text-sm font-bold font-mono mt-0.5 tracking-wider">
                  {data.kontakDarurat}
                </span>
              </div>
              <a
                href={`tel:${data.kontakDarurat}`}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                Hubungi
              </a>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800 block mb-1">Protokol Evakuasi Medis:</span>
            Armada siap diterjunkan untuk penanganan henti jantung, trauma kecelakaan lalu lintas, rujukan PONED maternal-neonatal, serta pemindahan pasien kritis ke RS rujukan tingkat 2 dan 3.
          </div>
        </div>
      )}

      {/* BOTTOM ACTION BUTTONS (STICKY AT BOTTOM) */}
      <div className="sticky bottom-0 z-20 mt-auto p-3.5 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-md space-y-2 shrink-0">
        {!isNaN(lat) && !isNaN(lng) && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openSmartStreetView(lat, lng)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Buka Google Street View 360 derajat di lokasi ini"
            >
              <Eye size={13} />
              <span>Street View</span>
            </button>
            <button
              onClick={() => openGoogleMapsPin(lat, lng)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Buka Google Maps dengan pin lokasi asli"
            >
              <MapPin size={13} className="text-rose-600" />
              <span>Peta Google</span>
            </button>
          </div>
        )}

        <button
          onClick={() => {
            if (data.telepon) {
              window.location.href = `tel:${data.telepon}`;
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none"
        >
          <Phone size={13} />
          <span>Hubungi Fasilitas ({data.telepon || 'Call Center'})</span>
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  subvalue,
  highlight = false,
  badge,
  link,
}: {
  icon: any;
  label: string;
  value: string;
  subvalue?: string;
  highlight?: boolean;
  badge?: string;
  link?: string;
}) {
  return (
    <div className="flex flex-col px-5 py-2.5 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
          <Icon size={12} className="text-emerald-700" />
          {label}
        </span>
        {badge && (
          <span className="text-[8px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>

      {link ? (
        <a
          href={link}
          className={`text-xs mt-0.5 leading-snug break-words hover:underline ${
            highlight ? 'font-bold text-rose-700' : 'text-emerald-700 font-medium'
          }`}
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-xs mt-0.5 leading-snug break-words ${
            highlight ? 'font-bold text-slate-900 font-mono' : 'text-slate-800 font-normal'
          }`}
        >
          {value}
        </span>
      )}

      {subvalue && (
        <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{subvalue}</span>
      )}
    </div>
  );
}
