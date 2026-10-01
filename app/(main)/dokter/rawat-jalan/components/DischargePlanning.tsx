"use client";

import React, { useState, useEffect } from 'react';
import { Pill, ClipboardList, CheckCircle2, Search, X, Loader2, ArrowLeft, Printer } from 'lucide-react';
import { useRawatJalanStore } from '@/store/rawatJalan.store';
import { rawatJalanService } from '@/services/rawatJalan.service';
import Swal from 'sweetalert2';

export default function DischargePlanning() {
  const {
    selectedKunjungan, rekamMedis, diagnosaList, setFase,
    simpanResep, simpanRujukan, pulang
  } = useRawatJalanStore();

  const [activeMenu, setActiveMenu] = useState<'HOME' | 'RESEP' | 'RUJUKAN'>('HOME');

  // RESEP STATE
  const [obatQuery, setObatQuery] = useState('');
  const [obatResults, setObatResults] = useState<any[]>([]);
  const [isSearchingObat, setIsSearchingObat] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // RUJUKAN STATE
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  const [rujukanData, setRujukanData] = useState({
    tujuanDokter: '',
    tujuanPoli: '',
    tujuanRS: '',
    namaPasien: selectedKunjungan?.pasien?.namaLengkap || '',
    umur: selectedKunjungan?.pasien?.tanggalLahir ? getAge(selectedKunjungan.pasien.tanggalLahir).toString() : '',
    jenisKelamin: selectedKunjungan?.pasien?.jenisKelamin || 'Laki-laki',
    alamat: (selectedKunjungan?.pasien as any)?.alamat || '',
    anamnesa: rekamMedis ? `${rekamMedis.keluhanUtama || ''}\n${rekamMedis.riwayatPenyakitSekarang || ''}`.trim() : '',
    pemeriksaanFisik: rekamMedis?.pemeriksaanFisik || '',
    diagnosaSementara: diagnosaList ? diagnosaList.map(d => `${d.icd10.kode_icd10} - ${d.icd10.nama_diagnosis}`).join(', ') : '',
    terapi: rekamMedis?.rencanaTerapi || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedKunjungan) return null;

  const handleSearchObat = async (query = obatQuery) => {
    setIsSearchingObat(true);
    try {
      const res = await rawatJalanService.searchObat(query);
      if (res.success) {
        setObatResults(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingObat(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'RESEP' && obatResults.length === 0) {
      handleSearchObat('');
    }
  }, [activeMenu]);

  const addToCart = (obat: any) => {
    const targetObatId = obat.obatId || obat.id;
    const exists = cart.find(c => c.obatId === targetObatId);
    if (exists) {
      Swal.fire('Sudah Ditambahkan', 'Obat ini sudah ada dalam keranjang resep.', 'info');
      return;
    }
    if (obat.stok !== undefined && obat.stok <= 0) {
      Swal.fire('Stok Habis', `Stok ${obat.namaObat} sedang kosong di gudang farmasi faskes ini.`, 'warning');
      return;
    }
    setCart([...cart, {
      obatId: targetObatId,
      namaObat: obat.namaObat,
      stok: obat.stok,
      harga: obat.harga,
      qty: 1,
      signa: '',
      catatan: ''
    }]);
  };

  const submitResep = async () => {
    if (cart.length === 0) {
      Swal.fire('Keranjang Kosong', 'Tambahkan obat terlebih dahulu', 'warning');
      return;
    }
    const invalid = cart.find(c => !c.signa);
    if (invalid) {
      Swal.fire('Incomplete', 'Semua obat harus memiliki Aturan Pakai (Signa)', 'warning');
      return;
    }

    const overStock = cart.find(c => c.stok !== undefined && c.stok !== null && c.qty > c.stok);
    if (overStock) {
      Swal.fire('Melebihi Stok', `Jumlah peresepan ${overStock.namaObat} (${overStock.qty}) melebihi stok yang tersedia di gudang farmasi faskes (${overStock.stok}).`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await simpanResep(cart);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Resep dikirim ke Farmasi. Kunjungan Selesai!', timer: 2000, showConfirmButton: false });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRujukan = async () => {
    if (!rujukanData.tujuanRS || !rujukanData.tujuanPoli) {
      Swal.fire('Incomplete', 'Faskes Tujuan dan Poli Tujuan wajib diisi', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      // Simpan data rujukan ke DB lokal (tabel RujukanKeluar) + generate tagihan + kirim Bundle SATUSEHAT
      await simpanRujukan({
        faskesTujuan: rujukanData.tujuanRS,
        poliTujuan: rujukanData.tujuanPoli,
        dokterTujuan: rujukanData.tujuanDokter,
        alasanRujukan: rujukanData.anamnesa + '\n' + rujukanData.diagnosaSementara,
      });

      // Tampilkan pesan sukses — cetak surat dilakukan oleh Administrasi di loket
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Rujukan berhasil disimpan. Pasien silakan menuju loket administrasi untuk cetak surat rujukan.', timer: 3000, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Gagal menyimpan data rujukan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePulang = async () => {
    const confirm = await Swal.fire({
      title: 'Akhiri Kunjungan?',
      text: "Pasien akan pulang tanpa resep atau rujukan.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Pulangkan',
      confirmButtonColor: '#4f46e5',
    });

    if (confirm.isConfirmed) {
      setIsSubmitting(true);
      try {
        await pulang();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pasien telah dipulangkan. Kunjungan Selesai!', timer: 2000, showConfirmButton: false });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // -------------------------------------------------------------
  // RENDER: HOME MENU
  // -------------------------------------------------------------
  if (activeMenu === 'HOME') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 h-full">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Tindak Lanjut Pasien</h2>
            <p className="text-gray-500">Pemeriksaan medis selesai. Pilih tindakan selanjutnya untuk <strong className="text-gray-800">{selectedKunjungan.pasien.namaLengkap}</strong>.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beri Resep */}
            <button 
              onClick={() => setActiveMenu('RESEP')}
              className="bg-white border border-gray-200 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 p-8 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-none flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Pill className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Beri Resep Obat</h3>
              <p className="text-sm text-gray-500">Buka katalog obat dan kirim resep ke Farmasi.</p>
            </button>

            {/* Buat Rujukan */}
            <button 
              onClick={() => setActiveMenu('RUJUKAN')}
              className="bg-white border border-gray-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 p-8 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-none flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Buat Rujukan</h3>
              <p className="text-sm text-gray-500">Rujuk pasien ke Fasilitas Kesehatan lain.</p>
            </button>

            {/* Pulang */}
            <button 
              onClick={handlePulang}
              disabled={isSubmitting}
              className="bg-white border border-gray-200 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 p-8 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-none flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pasien Pulang</h3>
              <p className="text-sm text-gray-500">Akhiri kunjungan tanpa resep atau rujukan tambahan.</p>
            </button>
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setFase(1)}
              className="text-gray-400 hover:text-gray-700 font-medium text-sm flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Rekam Medis (Batal Selesai)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: RESEP (E-COMMERCE CATALOG)
  // -------------------------------------------------------------
  if (activeMenu === 'RESEP') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 h-full w-full">
        {/* Header E-Commerce */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveMenu('HOME')} className="p-2 hover:bg-gray-100 rounded-none text-gray-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" /> Katalog Resep Obat
              </h2>
              <p className="text-xs text-gray-500">Pilih obat untuk {selectedKunjungan.pasien.namaLengkap}</p>
            </div>
          </div>
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Cari obat (nama atau kode)..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={obatQuery}
              onChange={e => setObatQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchObat()}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* KIRI: KATALOG LIST */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSearchingObat ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : obatResults.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Pill className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p>Data obat kosong.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {obatResults.map((obat) => (
                  <div key={obat.id} className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-32 bg-gray-100 flex items-center justify-center p-0 overflow-hidden border-b border-gray-200">
                      <img 
                        src={obat.gambarUrl || "/images/obat/placeholder.png"} 
                        alt={obat.namaObat}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/images/obat/placeholder.png"; }}
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{obat.kategori}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{obat.namaObat}</h3>
                      <div className="text-xs text-gray-500 mb-4">{obat.sediaan} • Kode: {obat.kodeObat}</div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-gray-900">Rp {Number(obat.harga || 0).toLocaleString('id-ID')}</div>
                          <div className={`text-xs font-bold ${obat.stok > 10 ? 'text-emerald-600' : obat.stok > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {obat.stok !== undefined ? (obat.stok > 0 ? `Sisa Stok: ${obat.stok} ${obat.sediaan || ''}` : 'Stok Habis (0)') : 'Stok Tersedia'}
                          </div>
                          {obat.noBatch && obat.noBatch !== '-' && (
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              Batch: {obat.noBatch}
                            </div>
                          )}
                        </div>
                        <button 
                          disabled={obat.stok !== undefined && obat.stok <= 0}
                          onClick={() => addToCart(obat)}
                          className={`px-3 py-1.5 rounded-none text-sm font-bold transition-colors ${
                            obat.stok !== undefined && obat.stok <= 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200'
                          }`}
                        >
                          {obat.stok !== undefined && obat.stok <= 0 ? 'Habis' : '+ Keranjang'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KANAN: KERANJANG RESEP */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900">Daftar Resep</h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-none">{cart.length} Obat</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Keranjang resep masih kosong.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-none p-3 bg-white relative">
                    <button 
                      onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-gray-900 text-sm pr-6">{item.namaObat}</h4>
                    <div className="flex gap-2 mt-3">
                      <div className="w-20">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jumlah</label>
                        <input 
                          type="number" min="1" 
                          value={item.qty}
                          onChange={(e) => { const newC = [...cart]; newC[idx].qty = parseInt(e.target.value) || 1; setCart(newC); }}
                          className="w-full border border-gray-300 rounded-none px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Signa (Aturan Pakai)</label>
                        <input 
                          type="text" placeholder="3 x 1 Tablet" 
                          value={item.signa}
                          onChange={(e) => { const newC = [...cart]; newC[idx].signa = e.target.value; setCart(newC); }}
                          className="w-full border border-gray-300 rounded-none px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={submitResep}
                disabled={isSubmitting || cart.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-none flex items-center justify-center transition-colors shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim ke Farmasi & Selesai'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: RUJUKAN
  // -------------------------------------------------------------
  if (activeMenu === 'RUJUKAN') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 overflow-y-auto">
        <div className="p-4 bg-white border-b shadow-sm flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveMenu('HOME')} className="p-2 hover:bg-gray-100 rounded-none">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" /> Form Surat Rujukan
            </h2>
          </div>
        </div>

        <div className="max-w-6xl w-full mx-auto flex gap-6 p-6 items-start h-full pb-20">
          {/* Panel Form Editor (Sembunyi saat print) */}
          <div className="w-1/3 bg-white p-6 shadow-md border border-gray-200 print:hidden h-fit rounded-none sticky top-6">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="p-3 bg-blue-50 border border-blue-100 mb-2 rounded-none">
                <label className="block text-xs font-bold text-blue-800 mb-1">Kepada Yth. Teman Sejawat (TS)</label>
                <input type="text" placeholder="dr. Spesialis / Nama RS" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none mb-2" 
                  value={rujukanData.tujuanDokter} onChange={e => setRujukanData({...rujukanData, tujuanDokter: e.target.value})} />
                
                <label className="block text-xs font-bold text-blue-800 mb-1">Di Poliklinik / Bagian</label>
                <input type="text" placeholder="Poli Penyakit Dalam" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none mb-2" 
                  value={rujukanData.tujuanPoli} onChange={e => setRujukanData({...rujukanData, tujuanPoli: e.target.value})} />
                  
                <label className="block text-xs font-bold text-blue-800 mb-1">Rumah Sakit Tujuan</label>
                <input type="text" placeholder="RSUD Kota / RS Siloam" className="w-full border border-blue-200 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.tujuanRS} onChange={e => setRujukanData({...rujukanData, tujuanRS: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pasien</label>
                <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.namaPasien} onChange={e => setRujukanData({...rujukanData, namaPasien: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Umur</label>
                  <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                    value={rujukanData.umur} onChange={e => setRujukanData({...rujukanData, umur: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none bg-white" 
                    value={rujukanData.jenisKelamin} onChange={e => setRujukanData({...rujukanData, jenisKelamin: e.target.value})}>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.alamat} onChange={e => setRujukanData({...rujukanData, alamat: e.target.value})} />
              </div>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Anamnesa Singkat</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.anamnesa} onChange={e => setRujukanData({...rujukanData, anamnesa: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hasil Pemeriksaan Fisik</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.pemeriksaanFisik} onChange={e => setRujukanData({...rujukanData, pemeriksaanFisik: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">Diagnosa Sementara</label>
                <input type="text" className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" 
                  value={rujukanData.diagnosaSementara} onChange={e => setRujukanData({...rujukanData, diagnosaSementara: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Terapi / Tindakan yang Diberikan</label>
                <textarea className="w-full border border-gray-300 rounded-none p-2 text-sm text-gray-900 focus:border-blue-500 outline-none" rows={2}
                  value={rujukanData.terapi} onChange={e => setRujukanData({...rujukanData, terapi: e.target.value})} />
              </div>
            </div>
            <button 
              onClick={submitRujukan} 
              disabled={isSubmitting || !rujukanData.tujuanRS || !rujukanData.tujuanPoli}
              className="w-full bg-indigo-600 text-white font-bold py-3 mt-4 rounded-none flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Printer className="w-5 h-5" /> Cetak & Selesai</>}
            </button>
          </div>

          {/* Panel Kertas Surat (Print Area) */}
          <div className="w-2/3 bg-white shadow-lg p-12 min-h-[297mm] print:w-full print:shadow-none print:p-0 print:m-0 text-gray-900 rounded-none">
            {/* Kop Surat */}
            <div className="border-b-4 border-double border-gray-900 pb-4 mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide uppercase">Klinik Kesehatan Prima</h1>
              <p className="text-sm text-gray-700">Jl. Jendral Sudirman No. 123, Jakarta Pusat</p>
              <p className="text-sm text-gray-700">Telp: (021) 1234567 | Email: info@klinikprima.com</p>
            </div>

            <div className="flex justify-between items-start mb-8 text-base">
              <div>
                <p>Nomor : SR/{new Date().getFullYear()}/{(new Date().getMonth()+1).toString().padStart(2, '0')}/003</p>
                <p>Lamp. : -</p>
                <p>Hal : <strong>Rujukan Pasien</strong></p>
              </div>
              <div className="text-right">
                <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-1">Kepada Yth. Teman Sejawat,</p>
              <p className="font-bold">{rujukanData.tujuanDokter || 'dr. .................................................'}</p>
              <p>Di Poliklinik: {rujukanData.tujuanPoli || '...........................................'}</p>
              <p>Rumah Sakit: {rujukanData.tujuanRS || '...........................................'}</p>
            </div>

            {/* Isi Surat */}
            <div className="text-base text-gray-900 leading-relaxed space-y-4">
              <p>Dengan hormat,</p>
              <p>Mohon bantuan pemeriksaan dan penanganan lebih lanjut terhadap penderita:</p>
              
              <table className="w-full ml-4 mb-4">
                <tbody>
                  <tr>
                    <td className="w-1/4 py-1">Nama Pasien</td>
                    <td className="w-4 py-1">:</td>
                    <td className="font-bold">{rujukanData.namaPasien || '...................................................'}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Umur / JK</td>
                    <td className="py-1">:</td>
                    <td>{rujukanData.umur ? `${rujukanData.umur} Tahun` : '......'} / {rujukanData.jenisKelamin}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top">Alamat</td>
                    <td className="py-1 align-top">:</td>
                    <td>{rujukanData.alamat || '.........................................................................'}</td>
                  </tr>
                </tbody>
              </table>

              <p>Berdasarkan pemeriksaan kami, didapatkan temuan klinis sebagai berikut:</p>
              <table className="w-full ml-4">
                <tbody>
                  <tr>
                    <td className="w-1/3 py-1 align-top font-semibold">Anamnesa Singkat</td>
                    <td className="w-4 py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.anamnesa}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top font-semibold">Pemeriksaan Fisik</td>
                    <td className="py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.pemeriksaanFisik}</td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top font-semibold">Diagnosa Sementara</td>
                    <td className="py-2 align-top">:</td>
                    <td className="py-2 align-top font-bold">{rujukanData.diagnosaSementara}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top font-semibold">Terapi Diberikan</td>
                    <td className="py-1 align-top">:</td>
                    <td className="py-1 align-top min-h-12 border-b border-dotted border-gray-400">{rujukanData.terapi}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-8">
                Demikian surat rujukan ini kami sampaikan, atas bantuan dan kerja sama teman sejawat kami ucapkan terima kasih.
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="mt-16 flex justify-end text-gray-900 text-center">
              <div>
                <p className="mb-16">Salam Sejawat,</p>
                <p className="font-bold underline underline-offset-4">dr. {selectedKunjungan.dokterTujuan?.namaLengkap || 'Dokter Anda'}</p>
                <p className="text-sm mt-1">SIP. 123.456.789</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
