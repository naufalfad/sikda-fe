"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Users, Search, Loader2, RefreshCw, CheckCircle2,
  Receipt, Wallet, Banknote, Printer, FileText, Download
} from 'lucide-react';
import { useKasirStore } from '@/store/kasir.store';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

export default function KasirPage() {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [bayarAmount, setBayarAmount] = useState<string>('');
  const [metodeBayar, setMetodeBayar] = useState<string>('Tunai');
  const printRef = useRef<HTMLDivElement>(null);

  const {
    antrian, selectedKunjungan, tagihanAktif,
    isLoadingAntrian, isLoadingTagihan, isProcessing,
    fetchAntrian, pilihPasien, prosesPembayaran, clearSelection
  } = useKasirStore();

  useEffect(() => {
    fetchAntrian();
  }, []);

  useEffect(() => {
    if (selectedKunjungan) {
      const penjamin = selectedKunjungan.pasien?.penjamin?.jenisPenjamin?.toUpperCase() || 'UMUM';
      if (penjamin.includes('BPJS') || penjamin.includes('KIS')) {
        setMetodeBayar('BPJS');
        setBayarAmount('0');
      } else {
        setMetodeBayar('Tunai');
        setBayarAmount('');
      }
    }
  }, [selectedKunjungan]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Struk_Pembayaran_${tagihanAktif?.id}`,
  });

  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handleBayar = async () => {
    if (!tagihanAktif) return;
    
    let nominal = 0;
    if (metodeBayar !== 'BPJS') {
      nominal = parseInt(bayarAmount.replace(/[^0-9]/g, ''));
      if (isNaN(nominal) || nominal < tagihanAktif.totalBiaya) {
        Swal.fire('Error', 'Nominal bayar tidak valid atau kurang dari total tagihan', 'error');
        return;
      }
    }

    const success = await prosesPembayaran(tagihanAktif.id, metodeBayar, nominal);
    if (success) {
      setBayarAmount('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: QUEUE */}
      <div 
        className="bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 relative flex-shrink-0 max-w-sm"
        style={{ width: sidebarWidth }}
      >
        {/* RESIZER HANDLE */}
        <div 
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-300 active:bg-emerald-500 z-50 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            
            const doDrag = (dragEvent: MouseEvent) => {
              let newWidth = startWidth + (dragEvent.clientX - startX);
              if (newWidth > 384) newWidth = 384; 
              if (newWidth < 200) newWidth = 200; 
              setSidebarWidth(newWidth);
            };
            
            const stopDrag = () => {
              document.removeEventListener('mousemove', doDrag);
              document.removeEventListener('mouseup', stopDrag);
            };
            
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
          }}
        />
        <div className="p-4 border-b border-gray-200 bg-emerald-50/50">
          <h2 className="text-lg font-bold text-emerald-800 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
            Antrian Pembayaran
          </h2>
          <div className="mt-3 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
            <span className="truncate flex-1 min-w-[120px]">Menunggu pembayaran</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-none font-bold">Total: {antrian.length}</span>
              <button onClick={() => fetchAntrian()} className="p-1 hover:bg-emerald-100 rounded-none transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoadingAntrian ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingAntrian && antrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm font-medium">Memuat antrian...</p>
            </div>
          ) : antrian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-300" />
              <p className="text-sm font-medium">Belum ada tagihan baru</p>
            </div>
          ) : (
            antrian.map((k) => (
              <div 
                key={k.id}
                onClick={() => pilihPasien(k)}
                className={`p-3 border-l-4 cursor-pointer transition-all ${
                  selectedKunjungan?.id === k.id 
                    ? 'border-l-emerald-600 bg-emerald-50 shadow-md border-y border-r border-emerald-200' 
                    : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap justify-between items-start gap-1.5 mb-2">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-500 break-all">{k.jamRegistrasi} • {k.pasien.noRM}</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-bold uppercase shadow-sm whitespace-nowrap rounded-none bg-orange-100 text-orange-800">
                    BELUM LUNAS
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-600 font-bold flex flex-shrink-0 items-center justify-center text-xs mt-0.5">
                    {k.noAntrian.split('-').pop()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 leading-tight truncate" title={k.pasien.namaLengkap}>{k.pasien.namaLengkap}</h3>
                    <div className="text-[10px] sm:text-xs text-gray-600 flex flex-wrap items-center gap-x-1 mt-0.5">
                      <span className="text-emerald-600 font-semibold truncate">{k.poliklinik?.namaPoli}</span>
                    </div>
                    {k.tagihan && (
                      <div className="text-[11px] font-bold text-slate-700 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1">
                        <span className="text-slate-400 text-[10px]">{k.tagihan.details?.length || 0} Layanan/Obat</span>
                        <span className="text-emerald-700 font-mono font-black">{formatRupiah(k.tagihan.totalBiaya)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: MAIN FORM */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden min-w-0">
        {selectedKunjungan ? (
          <>
            {/* Header Pasien */}
            <div className="p-4 border-b border-gray-200 shadow-sm flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-none flex items-center justify-center font-bold text-2xl mr-4 bg-emerald-100 text-emerald-700">
                  {selectedKunjungan.pasien.namaLengkap.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedKunjungan.pasien.namaLengkap}</h1>
                  <div className="text-sm text-gray-600 flex items-center mt-1 font-medium">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 mr-2 text-gray-800 rounded-none">{selectedKunjungan.pasien.noRM}</span>
                    <span>{getAge(selectedKunjungan.pasien.tanggalLahir)} Tahun</span>
                    <span className="mx-2">•</span>
                    <span className="text-emerald-600 font-bold">{selectedKunjungan.jenisPelayanan}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nomor Antrian</div>
                <div className="text-2xl font-mono font-bold text-gray-900">
                  {selectedKunjungan.noAntrian}
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {isLoadingTagihan && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Mengkalkulasi tagihan...</p>
                </div>
              </div>
            )}
            
            {!isLoadingTagihan && tagihanAktif && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
                
                {/* Kolom Kiri: Rincian Biaya */}
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" /> Rincian Biaya
                      </h3>
                      <span className="text-xs font-mono text-gray-500">ID: {tagihanAktif.id.toUpperCase()}</span>
                    </div>
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 text-sm">
                        {(tagihanAktif.details || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-800">{item.namaItem}</div>
                              <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{item.kategori}</div>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">{item.jumlah}</td>
                            <td className="px-6 py-4 text-right text-gray-600">{formatRupiah(item.hargaSatuan)}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatRupiah(item.subTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-emerald-50/50">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right font-extrabold text-gray-900 uppercase text-sm">Total Tagihan</td>
                          <td className="px-6 py-4 text-right font-extrabold text-emerald-700 text-xl">{formatRupiah(tagihanAktif.totalBiaya)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Kolom Kanan: Pembayaran */}
                <div className="w-full lg:w-96 flex-shrink-0">
                  {tagihanAktif.statusTagihan === 'LUNAS' ? (
                     <div className="bg-white border border-emerald-200 shadow-sm p-6 text-center space-y-4 relative overflow-hidden">
                       <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto relative z-10" />
                       <div>
                         <h3 className="text-xl font-extrabold text-emerald-800">LUNAS</h3>
                         <p className="text-sm text-gray-500 mt-1">Pembayaran telah berhasil diproses.</p>
                       </div>
                       
                       <div className="bg-emerald-50 p-4 text-left text-sm space-y-2 border border-emerald-100">
                         <div className="flex justify-between"><span className="text-gray-500">Metode</span><span className="font-bold text-gray-900">{tagihanAktif.pembayaran?.metodePembayaran}</span></div>
                         {tagihanAktif.pembayaran?.metodePembayaran !== 'BPJS' && (
                           <>
                             <div className="flex justify-between"><span className="text-gray-500">Dibayar</span><span className="font-bold text-gray-900">{formatRupiah(tagihanAktif.pembayaran?.jumlahBayar || 0)}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-bold text-emerald-600">{formatRupiah(tagihanAktif.pembayaran?.kembalian || 0)}</span></div>
                           </>
                         )}
                       </div>

                       <button onClick={handlePrint} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 shadow-md transition-colors flex justify-center items-center gap-2 mt-4">
                         <Printer className="w-5 h-5" /> Cetak Struk
                       </button>

                       {/* Hidden Print Component */}
                       <div className="hidden">
                         <div ref={printRef} className="p-8 text-black bg-white max-w-[80mm] mx-auto font-mono text-sm" style={{ width: '80mm' }}>
                            <div className="text-center mb-6 border-b border-dashed border-gray-400 pb-4">
                              <h2 className="font-bold text-lg">KLINIK KESEHATAN</h2>
                              <p className="text-xs">Jl. Contoh No. 123, Kota</p>
                              <p className="text-xs">Telp: 021-1234567</p>
                            </div>
                            
                            <div className="mb-4 text-xs space-y-1">
                              <div className="flex justify-between"><span>No.</span><span>{tagihanAktif.id.substring(0,8).toUpperCase()}</span></div>
                              <div className="flex justify-between"><span>Tgl.</span><span>{new Date().toLocaleDateString('id-ID')}</span></div>
                              <div className="flex justify-between"><span>Pasien</span><span>{selectedKunjungan.pasien.namaLengkap.substring(0,15)}</span></div>
                            </div>

                            <div className="border-t border-b border-dashed border-gray-400 py-3 mb-4 space-y-2">
                              {tagihanAktif.details.map((item, i) => (
                                <div key={i} className="text-xs">
                                  <div className="truncate">{item.namaItem}</div>
                                  <div className="flex justify-between pl-4">
                                    <span>{item.jumlah} x {item.hargaSatuan}</span>
                                    <span>{item.subTotal}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="text-xs space-y-1 mb-6">
                              <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatRupiah(tagihanAktif.totalBiaya)}</span></div>
                              <div className="flex justify-between"><span>BAYAR ({tagihanAktif.pembayaran?.metodePembayaran})</span><span>{formatRupiah(tagihanAktif.pembayaran?.jumlahBayar || 0)}</span></div>
                              <div className="flex justify-between"><span>KEMBALI</span><span>{formatRupiah(tagihanAktif.pembayaran?.kembalian || 0)}</span></div>
                            </div>

                            <div className="text-center text-xs">
                              <p>Terima Kasih</p>
                              <p>Semoga Lekas Sembuh</p>
                            </div>
                         </div>
                       </div>

                     </div>
                  ) : (
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-900 text-white">
                        <h3 className="font-extrabold flex items-center gap-2">
                          <Banknote className="w-5 h-5" /> Proses Pembayaran
                        </h3>
                      </div>
                      <div className="p-6 space-y-5">
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pembayaran</label>
                          <select 
                            value={metodeBayar}
                            onChange={(e) => setMetodeBayar(e.target.value)}
                            disabled={selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('BPJS') || selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase().includes('KIS')}
                            className="w-full px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            {(() => {
                              const penjamin = selectedKunjungan?.pasien?.penjamin?.jenisPenjamin?.toUpperCase() || 'UMUM';
                              const isBpjs = penjamin.includes('BPJS') || penjamin.includes('KIS');
                              
                              if (isBpjs) {
                                return <option value="BPJS">Ditanggung {selectedKunjungan?.pasien?.penjamin?.jenisPenjamin || 'BPJS/KIS'}</option>;
                              } else {
                                return (
                                  <>
                                    <option value="Tunai">Tunai (Cash)</option>
                                    <option value="Transfer">Transfer / QRIS</option>
                                    <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
                                  </>
                                );
                              }
                            })()}
                          </select>
                        </div>

                        {metodeBayar !== 'BPJS' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Uang Diterima</label>
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-gray-500 font-bold">Rp</span>
                              <input 
                                type="text"
                                value={bayarAmount}
                                onChange={(e) => {
                                  // Format angka
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setBayarAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-emerald-500 shadow-sm font-bold text-lg text-gray-900"
                                placeholder="0"
                              />
                            </div>
                            
                            {/* Hitung Kembalian Live */}
                            {bayarAmount && parseInt(bayarAmount.replace(/[^0-9]/g, '')) >= tagihanAktif.totalBiaya && (
                              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-100 flex justify-between">
                                <span>Kembalian:</span>
                                <span className="font-bold">{formatRupiah(parseInt(bayarAmount.replace(/[^0-9]/g, '')) - tagihanAktif.totalBiaya)}</span>
                              </div>
                            )}
                            {bayarAmount && parseInt(bayarAmount.replace(/[^0-9]/g, '')) > 0 && parseInt(bayarAmount.replace(/[^0-9]/g, '')) < tagihanAktif.totalBiaya && (
                              <div className="mt-3 p-2 text-red-600 text-xs font-medium">
                                Jumlah uang kurang dari total tagihan!
                              </div>
                            )}
                          </div>
                        )}

                        {metodeBayar === 'BPJS' && (
                          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                            <p className="font-bold mb-1">Pasien BPJS</p>
                            <p>Seluruh tagihan ditanggung oleh BPJS. Lanjutkan proses untuk menutup tagihan dengan nominal Rp 0.</p>
                          </div>
                        )}

                        <button 
                          onClick={handleBayar}
                          disabled={isProcessing || (metodeBayar !== 'BPJS' && parseInt(bayarAmount.replace(/[^0-9]/g, '')) < tagihanAktif.totalBiaya)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 shadow-md transition-colors flex justify-center items-center gap-2 mt-6"
                        >
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                        </button>

                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Wallet className="w-20 h-20 mb-6 text-gray-200" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Modul Kasir</h2>
            <p className="text-lg font-medium max-w-md">Pilih pasien dari daftar antrian sebelah kiri untuk memproses tagihan pembayaran layanan medis.</p>
          </div>
        )}
      </div>

    </div>
  );
}
