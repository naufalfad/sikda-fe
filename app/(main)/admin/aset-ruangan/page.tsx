"use client";

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Building2, 
  Bed, 
  Wrench, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  Activity, 
  Layers, 
  Edit3, 
  Trash2, 
  Calendar, 
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Send
} from 'lucide-react';
import { asetRuanganService } from '../../../../services/asetRuangan.service';
import { 
  MasterRuangan, 
  TempatTidur, 
  BedStats, 
  AsetRuangan, 
  AsetStats, 
  RiwayatPemeliharaanAset, 
  RiwayatMutasiAset 
} from '../../../../types/asetRuangan.types';

const getAsetImageUrl = (aset?: any) => {
  if (aset?.gambarUrl) return aset.gambarUrl;
  const name = ((aset?.namaAset || '') + ' ' + (aset?.kodeAset || '')).toLowerCase();
  if (name.includes('tensi') || name.includes('tns')) return '/images/aset/tensimeter.jpg';
  if (name.includes('dental') || name.includes('dnt') || name.includes('autoclave') || name.includes('strl')) return '/images/aset/dental.jpg';
  if (name.includes('ekg')) return '/images/aset/ekg.jpg';
  if (name.includes('aed') || name.includes('defibrillator') || name.includes('suct') || name.includes('pump')) return '/images/aset/defibrillator.jpg';
  if (name.includes('kulk') || name.includes('vaksin')) return '/images/aset/kulkas.jpg';
  if (name.includes('usg') || name.includes('cent') || name.includes('dop')) return '/images/aset/usg.jpg';
  return '/images/aset/usg.jpg';
};

export default function AsetRuanganPage() {
  const [activeTab, setActiveTab] = useState<'ruangan' | 'bed' | 'aset' | 'pemeliharaan' | 'mutasi'>('ruangan');
  const [loading, setLoading] = useState(false);

  // Data states
  const [ruangans, setRuangans] = useState<MasterRuangan[]>([]);
  const [beds, setBeds] = useState<TempatTidur[]>([]);
  const [bedStats, setBedStats] = useState<BedStats | null>(null);
  const [asets, setAsets] = useState<AsetRuangan[]>([]);
  const [asetStats, setAsetStats] = useState<AsetStats | null>(null);
  const [pemeliharaans, setPemeliharaans] = useState<RiwayatPemeliharaanAset[]>([]);
  const [kalibrasiAlerts, setKalibrasiAlerts] = useState<RiwayatPemeliharaanAset[]>([]);
  const [mutasiHistory, setMutasiHistory] = useState<RiwayatMutasiAset[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuanganFilter, setSelectedRuanganFilter] = useState('');
  const [selectedKategoriAset, setSelectedKategoriAset] = useState('');

  // Modals state
  const [showRuanganModal, setShowRuanganModal] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState<MasterRuangan | null>(null);
  const [ruanganForm, setRuanganForm] = useState({
    kodeRuangan: '',
    namaRuangan: '',
    gedung: 'Gedung Utama',
    lantai: 'Lantai 1',
    kategoriRuangan: 'RAWAT_JALAN',
    deskripsi: '',
    physicalType: 'ro'
  });

  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<TempatTidur | null>(null);
  const [bedForm, setBedForm] = useState({
    ruanganId: '',
    nomorBed: '',
    kelasKamar: 'NON_KELAS_IGD',
    statusBed: 'TERSEDIA' as const,
    gambarUrl: ''
  });

  const [showAsetModal, setShowAsetModal] = useState(false);
  const [editingAset, setEditingAset] = useState<AsetRuangan | null>(null);
  const [asetForm, setAsetForm] = useState({
    kodeAset: '',
    namaAset: '',
    ruanganId: '',
    kategoriAset: 'MEDIS_DIAGNOSTIK',
    merk: '',
    tipeModel: '',
    nomorSeri: '',
    gambarUrl: '',
    tahunPerolehan: new Date().getFullYear(),
    sumberAnggaran: 'APBD',
    hargaPerolehan: 0,
    kondisiAset: 'BAIK' as const,
    statusOperasional: 'AKTIF_DIGUNAKAN' as const,
    kodeAspak: '',
    kodeSnomed: '',
    catatan: ''
  });

  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [mutasiForm, setMutasiForm] = useState({
    asetId: '',
    ruanganTujuanId: '',
    alasanMutasi: ''
  });

  const [showPemeliharaanModal, setShowPemeliharaanModal] = useState(false);
  const [pemeliharaanForm, setPemeliharaanForm] = useState({
    asetId: '',
    jenisKegiatan: 'KALIBRASI_BFPK_EKSTERNAL',
    tanggalJadwal: new Date().toISOString().split('T')[0],
    pelaksanaVendor: '',
    biayaPemeliharaan: 0,
    catatan: ''
  });

  // Load All Data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [rData, bData, bStats, aData, aStats, pAlerts] = await Promise.all([
        asetRuanganService.getRuangans(),
        asetRuanganService.getBeds(),
        asetRuanganService.getBedStats(),
        asetRuanganService.getAsets(),
        asetRuanganService.getAsetStats(),
        asetRuanganService.getKalibrasiAlerts()
      ]);
      setRuangans(rData);
      setBeds(bData);
      setBedStats(bStats);
      setAsets(aData);
      setAsetStats(aStats);
      setKalibrasiAlerts(pAlerts);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      if (activeTab === 'ruangan') {
        const data = await asetRuanganService.getRuangans({ search: searchTerm });
        setRuangans(data);
      } else if (activeTab === 'bed') {
        const [data, stats] = await Promise.all([
          asetRuanganService.getBeds({ ruanganId: selectedRuanganFilter }),
          asetRuanganService.getBedStats()
        ]);
        setBeds(data);
        setBedStats(stats);
      } else if (activeTab === 'aset') {
        const [data, stats] = await Promise.all([
          asetRuanganService.getAsets({ 
            search: searchTerm, 
            ruanganId: selectedRuanganFilter,
            kategoriAset: selectedKategoriAset 
          }),
          asetRuanganService.getAsetStats()
        ]);
        setAsets(data);
        setAsetStats(stats);
      } else if (activeTab === 'pemeliharaan') {
        const [data, alerts] = await Promise.all([
          asetRuanganService.getPemeliharaans(),
          asetRuanganService.getKalibrasiAlerts()
        ]);
        setPemeliharaans(data);
        setKalibrasiAlerts(alerts);
      } else if (activeTab === 'mutasi') {
        const data = await asetRuanganService.getMutasiHistory();
        setMutasiHistory(data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab, searchTerm, selectedRuanganFilter, selectedKategoriAset]);

  // Handlers Ruangan
  const handleSaveRuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRuangan) {
        await asetRuanganService.updateRuangan(editingRuangan.id, ruanganForm);
        Swal.fire('Berhasil', 'Ruangan berhasil diperbarui', 'success');
      } else {
        await asetRuanganService.createRuangan(ruanganForm);
        Swal.fire('Berhasil', 'Ruangan baru berhasil didaftarkan', 'success');
      }
      setShowRuanganModal(false);
      setEditingRuangan(null);
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const handleSyncRuangan = async (id: string, nama: string) => {
    try {
      Swal.fire({ title: 'Menyinkronkan...', text: `Mengirim ${nama} ke SATUSEHAT Location`, didOpen: () => Swal.showLoading() });
      const res = await asetRuanganService.syncRuanganSatuSehat(id);
      Swal.fire('Tersinkronisasi!', `ID Location: ${res.ihsLocationId}`, 'success');
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal Sinkronisasi', err.response?.data?.message || err.message, 'error');
    }
  };

  // Handlers Bed
  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBed) {
        await asetRuanganService.updateBed(editingBed.id, bedForm);
        Swal.fire('Berhasil', 'Status tempat tidur berhasil diperbarui', 'success');
      } else {
        await asetRuanganService.createBed(bedForm);
        Swal.fire('Berhasil', 'Tempat tidur berhasil ditambahkan', 'success');
      }
      setShowBedModal(false);
      setEditingBed(null);
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const handleQuickStatusBed = async (id: string, statusBed: 'TERSEDIA' | 'TERISI' | 'DIBERSIHKAN' | 'PERBAIKAN') => {
    try {
      await asetRuanganService.updateBed(id, { statusBed });
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.message, 'error');
    }
  };

  const handleSyncBed = async (id: string, nomor: string) => {
    try {
      Swal.fire({ title: 'Menyinkronkan Bed...', text: `Mengirim Bed ${nomor} ke SATUSEHAT`, didOpen: () => Swal.showLoading() });
      const res = await asetRuanganService.syncBedSatuSehat(id);
      Swal.fire('Tersinkronisasi!', `ID Location Bed: ${res.ihsLocationId}`, 'success');
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal Sinkronisasi', err.response?.data?.message || err.message, 'error');
    }
  };

  // Handlers Aset
  const handleSaveAset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAset) {
        await asetRuanganService.updateAset(editingAset.id, asetForm);
        Swal.fire('Berhasil', 'Data aset berhasil diperbarui', 'success');
      } else {
        await asetRuanganService.createAset(asetForm);
        Swal.fire('Berhasil', 'Aset baru berhasil didaftarkan', 'success');
      }
      setShowAsetModal(false);
      setEditingAset(null);
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const handleSyncDevice = async (id: string, nama: string) => {
    try {
      Swal.fire({ title: 'Menyinkronkan Device...', text: `Mendaftarkan ${nama} ke SATUSEHAT Device`, didOpen: () => Swal.showLoading() });
      const res = await asetRuanganService.syncDeviceSatuSehat(id);
      Swal.fire('Tersinkronisasi!', `IHS Device ID: ${res.ihsDeviceId}`, 'success');
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal Sinkronisasi', err.response?.data?.message || err.message, 'error');
    }
  };

  // Handlers Mutasi
  const handleSaveMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await asetRuanganService.mutasiAset(mutasiForm);
      Swal.fire('Berhasil', 'Aset berhasil dimutasikan ke ruangan baru', 'success');
      setShowMutasiModal(false);
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  // Handlers Pemeliharaan
  const handleSavePemeliharaan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await asetRuanganService.createPemeliharaan(pemeliharaanForm);
      Swal.fire('Berhasil', 'Kegiatan pemeliharaan/kalibrasi berhasil dijadwalkan', 'success');
      setShowPemeliharaanModal(false);
      loadTabData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Pengelolaan Aset & Ruangan Puskesmas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Standar ASPAK Kemenkes & Interoperabilitas SATUSEHAT FHIR (Resource Location & Device)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadInitialData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ruangan */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Ruangan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{ruangans.length}</p>
            <span className="text-xs text-blue-600 font-medium">9 Master Ruang Aktif</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Bed Management */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kapasitas Tempat Tidur</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{bedStats?.total || 0} Bed</p>
            <span className="text-xs text-green-600 font-medium">
              {bedStats?.tersedia || 0} Tersedia • {bedStats?.occupancyRate || 0}% BOR
            </span>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Aset Alkes */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aset & Alkes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{asetStats?.total || 0} Unit</p>
            <span className="text-xs text-purple-600 font-medium">
              {asetStats?.alkesCount || 0} Alat Kesehatan Medis
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Kalibrasi & Servis */}
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between ${
          kalibrasiAlerts.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
        }`}>
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Peringatan Kalibrasi</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{kalibrasiAlerts.length} Perhatian</p>
            <span className="text-xs text-amber-700 font-medium">Uji Tera & Servis Alkes</span>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('ruangan')}
          className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'ruangan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Daftar Ruangan ({ruangans.length})
        </button>

        <button
          onClick={() => setActiveTab('bed')}
          className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'bed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bed className="w-4 h-4" />
          Bed Management ({beds.length})
        </button>

        <button
          onClick={() => setActiveTab('aset')}
          className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'aset'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Inventaris Aset & Alkes ({asets.length})
        </button>

        <button
          onClick={() => setActiveTab('pemeliharaan')}
          className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'pemeliharaan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Pemeliharaan & Kalibrasi
          {kalibrasiAlerts.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
              {kalibrasiAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'mutasi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Log Mutasi Barang
        </button>
      </div>

      {/* TAB CONTENT 1: DAFTAR RUANGAN */}
      {activeTab === 'ruangan' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama ruangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              />
            </div>
            <button
              onClick={() => {
                setEditingRuangan(null);
                setRuanganForm({
                  kodeRuangan: `R-${Math.floor(100 + Math.random() * 900)}`,
                  namaRuangan: '',
                  gedung: 'Gedung Utama',
                  lantai: 'Lantai 1',
                  kategoriRuangan: 'RAWAT_JALAN',
                  deskripsi: '',
                  physicalType: 'ro'
                });
                setShowRuanganModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Ruangan
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Kode Ruangan</th>
                  <th className="py-3 px-4">Nama Ruangan</th>
                  <th className="py-3 px-4">Lokasi Gedung / Lantai</th>
                  <th className="py-3 px-4">Kategori Ruang</th>
                  <th className="py-3 px-4 text-center">Tempat Tidur</th>
                  <th className="py-3 px-4 text-center">Jumlah Aset</th>
                  <th className="py-3 px-4">SATUSEHAT Location</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ruangans.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{r.kodeRuangan}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{r.namaRuangan}</p>
                      {r.deskripsi && <p className="text-xs text-gray-400">{r.deskripsi}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-800 font-medium">{r.gedung || '-'}</span>
                      <span className="text-xs text-gray-500 block">{r.lantai || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        {r.kategoriRuangan.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                      {r._count?.tempatTidurs || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                      {r._count?.asets || 0}
                    </td>
                    <td className="py-3 px-4">
                      {r.ihsLocationId ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-mono truncate max-w-[130px]">{r.ihsLocationId}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSyncRuangan(r.id, r.namaRuangan)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                        >
                          <Send className="w-3 h-3" /> Sinkron FHIR
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRuangan(r);
                            setRuanganForm({
                              kodeRuangan: r.kodeRuangan,
                              namaRuangan: r.namaRuangan,
                              gedung: r.gedung || '',
                              lantai: r.lantai || '',
                              kategoriRuangan: r.kategoriRuangan,
                              deskripsi: r.deskripsi || '',
                              physicalType: r.physicalType || 'ro'
                            });
                            setShowRuanganModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Ruangan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BED MANAGEMENT */}
      {activeTab === 'bed' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedRuanganFilter}
                onChange={(e) => setSelectedRuanganFilter(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Ruangan / Bangsal</option>
                {ruangans.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.namaRuangan} ({r.kodeRuangan})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Tersedia</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Terisi</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pembersihan</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400"></span> Perbaikan</span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingBed(null);
                setBedForm({
                  ruanganId: ruangans[0]?.id || '',
                  nomorBed: `BED-${Math.floor(10 + Math.random() * 90)}`,
                  kelasKamar: 'NON_KELAS_IGD',
                  statusBed: 'TERSEDIA'
                });
                setShowBedModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Tempat Tidur
            </button>
          </div>

          {/* Grid Visual Bed Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {beds.map((b) => {
              const statusColors = {
                TERSEDIA: 'border-green-300 bg-green-50/50 hover:border-green-500',
                TERISI: 'border-red-300 bg-red-50/50 hover:border-red-500',
                DIBERSIHKAN: 'border-amber-300 bg-amber-50/50 hover:border-amber-500',
                PERBAIKAN: 'border-gray-300 bg-gray-50/50 hover:border-gray-500'
              };
              const badgeColors = {
                TERSEDIA: 'bg-green-100 text-green-800',
                TERISI: 'bg-red-100 text-red-800',
                DIBERSIHKAN: 'bg-amber-100 text-amber-800',
                PERBAIKAN: 'bg-gray-200 text-gray-800'
              };

              return (
                <div 
                  key={b.id}
                  className={`rounded-xl border-2 transition shadow-sm overflow-hidden flex flex-col justify-between ${statusColors[b.statusBed] || 'border-gray-200 bg-white'}`}
                >
                  <div>
                    {/* Bed Image Banner */}
                    <div className="relative h-32 w-full bg-slate-100 overflow-hidden group">
                      <img 
                        src={b.gambarUrl || "/images/aset/bed.jpg"} 
                        alt={b.nomorBed}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/aset/bed.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                      
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold shadow-xs">
                        <Bed className="w-3.5 h-3.5 text-blue-300" />
                        {b.nomorBed}
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${badgeColors[b.statusBed]}`}>
                          {b.statusBed}
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                        <span className="text-[11px] font-medium text-slate-200 line-clamp-1">{b.ruangan?.namaRuangan}</span>
                      </div>
                    </div>

                    <div className="p-3.5 text-xs text-gray-600 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Kelas:</span>
                        <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                          {b.kelasKamar.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {b.kunjunganAktif ? (
                        <div className="bg-red-50 border border-red-200 p-2 rounded text-[11px] text-red-900 mt-1">
                          <p className="font-bold truncate">👤 {b.kunjunganAktif.pasien?.namaLengkap}</p>
                          <p className="text-[10px] text-red-600 font-mono">RM: {b.kunjunganAktif.pasien?.noRM}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Siap digunakan pasien
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <div className="flex gap-1">
                      {b.statusBed !== 'TERSEDIA' && (
                        <button
                          onClick={() => handleQuickStatusBed(b.id, 'TERSEDIA')}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                          title="Set Tersedia"
                        >
                          Siap
                        </button>
                      )}
                      {b.statusBed !== 'DIBERSIHKAN' && (
                        <button
                          onClick={() => handleQuickStatusBed(b.id, 'DIBERSIHKAN')}
                          className="px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 font-semibold"
                          title="Set Pembersihan"
                        >
                          Bersihkan
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleSyncBed(b.id, b.nomorBed)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      title="Sinkron Bed Location SATUSEHAT"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> FHIR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INVENTARIS ASET & ALKES */}
      {activeTab === 'aset' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode aset, nama alat, merk, SN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedRuanganFilter}
                onChange={(e) => setSelectedRuanganFilter(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Ruangan</option>
                {ruangans.map((r) => (
                  <option key={r.id} value={r.id}>{r.namaRuangan}</option>
                ))}
              </select>

              <select
                value={selectedKategoriAset}
                onChange={(e) => setSelectedKategoriAset(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kategori</option>
                <option value="MEDIS_DIAGNOSTIK">Medis Diagnostik</option>
                <option value="MEDIS_TERAPETIK">Medis Terapetik</option>
                <option value="NON_MEDIS_ELEKTRONIK">Non-Medis Elektronik</option>
                <option value="MEBELAIR">Mebelair</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingAset(null);
                setAsetForm({
                  kodeAset: `AST-ALK-${Math.floor(100 + Math.random() * 900)}`,
                  namaAset: '',
                  ruanganId: ruangans[0]?.id || '',
                  kategoriAset: 'MEDIS_DIAGNOSTIK',
                  merk: '',
                  tipeModel: '',
                  nomorSeri: '',
                  gambarUrl: '',
                  tahunPerolehan: new Date().getFullYear(),
                  sumberAnggaran: 'APBD',
                  hargaPerolehan: 0,
                  kondisiAset: 'BAIK',
                  statusOperasional: 'AKTIF_DIGUNAKAN',
                  kodeAspak: '',
                  kodeSnomed: '',
                  catatan: ''
                });
                setShowAsetModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Aset Baru
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Foto</th>
                  <th className="py-3 px-4">Kode Aset</th>
                  <th className="py-3 px-4">Nama Barang &amp; Spesifikasi</th>
                  <th className="py-3 px-4">Lokasi Ruangan</th>
                  <th className="py-3 px-4">Kondisi Fisik</th>
                  <th className="py-3 px-4">Tahun &amp; Harga</th>
                  <th className="py-3 px-4">SATUSEHAT Device</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {asets.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-center">
                      <div className="w-13 h-13 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 shadow-2xs mx-auto group">
                        <img 
                          src={getAsetImageUrl(a)} 
                          alt={a.namaAset}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/aset/usg.jpg";
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{a.kodeAset}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{a.namaAset}</p>
                      <p className="text-xs text-gray-500">
                        {a.merk || '-'} {a.tipeModel || ''} • SN: {a.nomorSeri || '-'}
                      </p>
                      {a.kodeAspak && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          ASPAK: {a.kodeAspak}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 font-medium">{a.ruangan?.namaRuangan}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        a.kondisiAset === 'BAIK' ? 'bg-green-100 text-green-800' :
                        a.kondisiAset === 'RUSAK_RINGAN' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {a.kondisiAset}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-gray-900">Th. {a.tahunPerolehan || '-'}</p>
                      <p className="text-gray-500">Rp {(a.hargaPerolehan || 0).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="py-3 px-4">
                      {a.ihsDeviceId ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-mono truncate max-w-[120px]">{a.ihsDeviceId}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSyncDevice(a.id, a.namaAset)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                        >
                          <Send className="w-3 h-3" /> Sinkron Device
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setMutasiForm({
                              asetId: a.id,
                              ruanganTujuanId: ruangans.find(r => r.id !== a.ruanganId)?.id || '',
                              alasanMutasi: ''
                            });
                            setShowMutasiModal(true);
                          }}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Pindahkan / Mutasi ke Ruangan Lain"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPemeliharaanForm({
                              asetId: a.id,
                              jenisKegiatan: 'KALIBRASI_BFPK_EKSTERNAL',
                              tanggalJadwal: new Date().toISOString().split('T')[0],
                              pelaksanaVendor: '',
                              biayaPemeliharaan: 0,
                              catatan: ''
                            });
                            setShowPemeliharaanModal(true);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                          title="Jadwalkan Kalibrasi / Servis"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PEMELIHARAAN & KALIBRASI */}
      {activeTab === 'pemeliharaan' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          {/* Banner Peringatan Uji Tera / Kalibrasi */}
          {kalibrasiAlerts.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    Peringatan Kalibrasi Alat Kesehatan ({kalibrasiAlerts.length} Perangkat)
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Alat kesehatan berikut wajib menjalani pengujian berkala BPFK / Kalibrasi internal demi menjaga keselamatan pasien dan akreditasi faskes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Jadwal & Riwayat Uji Kalibrasi Alkes</h2>
            <button
              onClick={() => {
                setPemeliharaanForm({
                  asetId: asets[0]?.id || '',
                  jenisKegiatan: 'KALIBRASI_BFPK_EKSTERNAL',
                  tanggalJadwal: new Date().toISOString().split('T')[0],
                  pelaksanaVendor: 'BPFK Surabaya',
                  biayaPemeliharaan: 0,
                  catatan: ''
                });
                setShowPemeliharaanModal(true);
              }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Catat Jadwal Kalibrasi / Pemeliharaan
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Alat Kesehatan</th>
                  <th className="py-3 px-4">Ruangan</th>
                  <th className="py-3 px-4">Jenis Kegiatan</th>
                  <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                  <th className="py-3 px-4">Expired Kalibrasi</th>
                  <th className="py-3 px-4">Vendor / Teknisi</th>
                  <th className="py-3 px-4">Hasil & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pemeliharaans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 shadow-2xs group">
                          <img 
                            src={getAsetImageUrl(p.aset)} 
                            alt={p.aset?.namaAset}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/aset/usg.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.aset?.namaAset}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.aset?.kodeAset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{p.aset?.ruangan?.namaRuangan || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{p.jenisKegiatan.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {p.tanggalPelaksanaan ? new Date(p.tanggalPelaksanaan).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-amber-700">
                      {p.tanggalKalibrasiExpired ? new Date(p.tanggalKalibrasiExpired).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4">{p.pelaksanaVendor || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        p.status === 'SELESAI' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: MUTASI BARANG */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Riwayat Mutasi & Pemindahan Aset</h2>
              <p className="text-xs text-gray-500">Log audit pemindahan sarana prasarana antar ruangan puskesmas</p>
            </div>
            <button
              onClick={() => {
                setMutasiForm({
                  asetId: asets[0]?.id || '',
                  ruanganTujuanId: ruangans[1]?.id || '',
                  alasanMutasi: ''
                });
                setShowMutasiModal(true);
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Pindahkan Aset Sekarang
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Waktu Mutasi</th>
                  <th className="py-3 px-4">Nama Aset</th>
                  <th className="py-3 px-4">Ruangan Asal</th>
                  <th className="py-3 px-4">Ruangan Tujuan</th>
                  <th className="py-3 px-4">Alasan Pemindahan</th>
                  <th className="py-3 px-4">Petugas Eksekutor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mutasiHistory.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-xs font-mono">
                      {new Date(m.tanggalMutasi).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-gray-50 border border-gray-200 overflow-hidden shrink-0 shadow-2xs">
                          <img 
                            src={getAsetImageUrl(m.aset)} 
                            alt={m.aset?.namaAset}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/aset/usg.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{m.aset?.namaAset}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{m.aset?.kodeAset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-red-700 font-medium">
                      {m.ruanganAsal?.namaRuangan}
                    </td>
                    <td className="py-3 px-4 text-green-700 font-bold">
                      {m.ruanganTujuan?.namaRuangan}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{m.alasanMutasi || '-'}</td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-500">
                      {m.petugasAdmin?.namaLengkap || m.petugasAdmin?.username || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL RUANGAN */}
      {showRuanganModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingRuangan ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
            </h3>
            <form onSubmit={handleSaveRuangan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Ruang</label>
                  <input
                    type="text"
                    required
                    value={ruanganForm.kodeRuangan}
                    onChange={(e) => setRuanganForm({ ...ruanganForm, kodeRuangan: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={ruanganForm.kategoriRuangan}
                    onChange={(e) => setRuanganForm({ ...ruanganForm, kategoriRuangan: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="RAWAT_JALAN">Rawat Jalan / Poli</option>
                    <option value="RAWAT_INAP">Rawat Inap / Bangsal</option>
                    <option value="IGD">Gawat Darurat (IGD)</option>
                    <option value="PENUNJANG_MEDIS">Penunjang Medis (Lab/Rad/Apotek)</option>
                    <option value="ADMINISTRASI">Administrasi</option>
                    <option value="GUDANG">Gudang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Ruangan</label>
                <input
                  type="text"
                  required
                  value={ruanganForm.namaRuangan}
                  onChange={(e) => setRuanganForm({ ...ruanganForm, namaRuangan: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Contoh: Ruang Tindakan Gigi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gedung</label>
                  <input
                    type="text"
                    value={ruanganForm.gedung}
                    onChange={(e) => setRuanganForm({ ...ruanganForm, gedung: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lantai</label>
                  <input
                    type="text"
                    value={ruanganForm.lantai}
                    onChange={(e) => setRuanganForm({ ...ruanganForm, lantai: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Ruangan</label>
                <textarea
                  rows={2}
                  value={ruanganForm.deskripsi}
                  onChange={(e) => setRuanganForm({ ...ruanganForm, deskripsi: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowRuanganModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Simpan Ruangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BED */}
      {showBedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingBed ? 'Edit Tempat Tidur' : 'Tambah Tempat Tidur'}
            </h3>
            <form onSubmit={handleSaveBed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ruangan / Kamar</label>
                <select
                  required
                  value={bedForm.ruanganId}
                  onChange={(e) => setBedForm({ ...bedForm, ruanganId: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  <option value="">Pilih Ruangan...</option>
                  {ruangans.map((r) => (
                    <option key={r.id} value={r.id}>{r.namaRuangan} ({r.kodeRuangan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Bed</label>
                  <input
                    type="text"
                    required
                    value={bedForm.nomorBed}
                    onChange={(e) => setBedForm({ ...bedForm, nomorBed: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                    placeholder="BED-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kelas Kamar</label>
                  <select
                    value={bedForm.kelasKamar}
                    onChange={(e) => setBedForm({ ...bedForm, kelasKamar: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="NON_KELAS_IGD">Non-Kelas (IGD)</option>
                    <option value="KELAS_1">Kelas 1</option>
                    <option value="KELAS_2">Kelas 2</option>
                    <option value="KELAS_3">Kelas 3</option>
                    <option value="VIP">VIP</option>
                    <option value="ISOLASI">Isolasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status Ketersediaan</label>
                <select
                  value={bedForm.statusBed}
                  onChange={(e: any) => setBedForm({ ...bedForm, statusBed: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  <option value="TERSEDIA">Tersedia (Kosong)</option>
                  <option value="TERISI">Terisi Pasien</option>
                  <option value="DIBERSIHKAN">Sedang Dibersihkan</option>
                  <option value="PERBAIKAN">Dalam Perbaikan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Foto / URL Gambar Tempat Tidur (Opsional)</label>
                <input
                  type="text"
                  value={bedForm.gambarUrl}
                  onChange={(e) => setBedForm({ ...bedForm, gambarUrl: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Default: /images/aset/bed.jpg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowBedModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Simpan Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASET */}
      {showAsetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingAset ? 'Edit Aset / Alkes' : 'Daftarkan Aset / Alkes Baru'}
            </h3>
            <form onSubmit={handleSaveAset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Aset (NUP / Barcode)</label>
                  <input
                    type="text"
                    required
                    value={asetForm.kodeAset}
                    onChange={(e) => setAsetForm({ ...asetForm, kodeAset: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Aset</label>
                  <select
                    value={asetForm.kategoriAset}
                    onChange={(e) => setAsetForm({ ...asetForm, kategoriAset: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="MEDIS_DIAGNOSTIK">Medis Diagnostik</option>
                    <option value="MEDIS_TERAPETIK">Medis Terapetik</option>
                    <option value="MEDIS_LABORATORIUM">Medis Laboratorium</option>
                    <option value="NON_MEDIS_ELEKTRONIK">Non-Medis Elektronik</option>
                    <option value="MEBELAIR">Mebelair</option>
                    <option value="KENDARAAN">Kendaraan (Ambulans)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Aset / Alat</label>
                <input
                  type="text"
                  required
                  value={asetForm.namaAset}
                  onChange={(e) => setAsetForm({ ...asetForm, namaAset: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Contoh: USG Mindray DP-50 Expert"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Merk</label>
                  <input
                    type="text"
                    value={asetForm.merk}
                    onChange={(e) => setAsetForm({ ...asetForm, merk: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipe / Model</label>
                  <input
                    type="text"
                    value={asetForm.tipeModel}
                    onChange={(e) => setAsetForm({ ...asetForm, tipeModel: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Seri (SN)</label>
                  <input
                    type="text"
                    value={asetForm.nomorSeri}
                    onChange={(e) => setAsetForm({ ...asetForm, nomorSeri: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Ruangan Penempatan</label>
                  <select
                    required
                    value={asetForm.ruanganId}
                    onChange={(e) => setAsetForm({ ...asetForm, ruanganId: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="">Pilih Ruangan...</option>
                    {ruangans.map((r) => (
                      <option key={r.id} value={r.id}>{r.namaRuangan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kondisi Fisik</label>
                  <select
                    value={asetForm.kondisiAset}
                    onChange={(e: any) => setAsetForm({ ...asetForm, kondisiAset: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                    <option value="AFKIR">Afkir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tahun Perolehan</label>
                  <input
                    type="number"
                    value={asetForm.tahunPerolehan}
                    onChange={(e) => setAsetForm({ ...asetForm, tahunPerolehan: parseInt(e.target.value) || 2024 })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sumber Dana</label>
                  <select
                    value={asetForm.sumberAnggaran}
                    onChange={(e) => setAsetForm({ ...asetForm, sumberAnggaran: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  >
                    <option value="APBD">APBD</option>
                    <option value="APBN">APBN</option>
                    <option value="BOK">BOK</option>
                    <option value="BLUD">BLUD</option>
                    <option value="HIBAH">Hibah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    value={asetForm.hargaPerolehan}
                    onChange={(e) => setAsetForm({ ...asetForm, hargaPerolehan: parseFloat(e.target.value) || 0 })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode ASPAK (Kemenkes)</label>
                  <input
                    type="text"
                    value={asetForm.kodeAspak}
                    onChange={(e) => setAsetForm({ ...asetForm, kodeAspak: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                    placeholder="Contoh: ALKES-USG-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode SNOMED-CT / GMDN</label>
                  <input
                    type="text"
                    value={asetForm.kodeSnomed}
                    onChange={(e) => setAsetForm({ ...asetForm, kodeSnomed: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                    placeholder="Contoh: 466238007"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Aset / Alkes (Opsional)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={asetForm.gambarUrl}
                    onChange={(e) => setAsetForm({ ...asetForm, gambarUrl: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                    placeholder="Contoh: /images/aset/usg.jpg atau URL gambar https://..."
                  />
                  {asetForm.gambarUrl && (
                    <div className="w-10 h-10 rounded border overflow-hidden shrink-0">
                      <img 
                        src={asetForm.gambarUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/aset/usg.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Biarkan kosong untuk menggunakan template foto otomatis sesuai kategori/nama alat kesehatan.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAsetModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI ASET */}
      {showMutasiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              Mutasi / Pemindahan Aset
            </h3>
            <form onSubmit={handleSaveMutasi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Aset</label>
                <select
                  required
                  value={mutasiForm.asetId}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, asetId: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  {asets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaAset} ({a.kodeAset}) - Lokasi: {a.ruangan?.namaRuangan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ruangan Tujuan Baru</label>
                <select
                  required
                  value={mutasiForm.ruanganTujuanId}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, ruanganTujuanId: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  {ruangans.map((r) => (
                    <option key={r.id} value={r.id}>{r.namaRuangan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Pemindahan</label>
                <textarea
                  rows={2}
                  required
                  value={mutasiForm.alasanMutasi}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, alasanMutasi: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Kebutuhan rotasi alat, tindakan darurat, perbaikan, dll."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowMutasiModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-semibold hover:bg-purple-700"
                >
                  Proses Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PEMELIHARAAN */}
      {showPemeliharaanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              Jadwal Pemeliharaan & Kalibrasi
            </h3>
            <form onSubmit={handleSavePemeliharaan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Alat Kesehatan</label>
                <select
                  required
                  value={pemeliharaanForm.asetId}
                  onChange={(e) => setPemeliharaanForm({ ...pemeliharaanForm, asetId: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  {asets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaAset} ({a.kodeAset})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kegiatan</label>
                <select
                  value={pemeliharaanForm.jenisKegiatan}
                  onChange={(e) => setPemeliharaanForm({ ...pemeliharaanForm, jenisKegiatan: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                >
                  <option value="KALIBRASI_BFPK_EKSTERNAL">Kalibrasi Eksternal (BPFK)</option>
                  <option value="KALIBRASI_INTERNAL">Kalibrasi Internal Faskes</option>
                  <option value="PEMELIHARAAN_RUTIN">Pemeliharaan / Servis Berkala</option>
                  <option value="PERBAIKAN_KERUSAKAN">Perbaikan Kerusakan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Rencana</label>
                  <input
                    type="date"
                    required
                    value={pemeliharaanForm.tanggalJadwal}
                    onChange={(e) => setPemeliharaanForm({ ...pemeliharaanForm, tanggalJadwal: e.target.value })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={pemeliharaanForm.biayaPemeliharaan}
                    onChange={(e) => setPemeliharaanForm({ ...pemeliharaanForm, biayaPemeliharaan: parseFloat(e.target.value) || 0 })}
                    className="w-full border p-2 rounded text-sm text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vendor / Teknisi Pelaksana</label>
                <input
                  type="text"
                  value={pemeliharaanForm.pelaksanaVendor}
                  onChange={(e) => setPemeliharaanForm({ ...pemeliharaanForm, pelaksanaVendor: e.target.value })}
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Contoh: Balai Pengamanan Fasilitas Kesehatan (BPFK)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPemeliharaanModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700"
                >
                  Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
