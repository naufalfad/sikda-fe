import React, { useRef, useState, useEffect } from 'react';
import { FileText, Printer, FileDown, Loader2, AlertTriangle, Calendar, ChevronRight, CheckCircle2, History } from 'lucide-react';
import { CetakHasilLab } from '@/components/laboratorium/CetakHasilLab';
import { useReactToPrint } from 'react-to-print';

interface LabResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  orderLabData?: any;
  orderList?: any[]; // Riwayat hasil lab pasien (mendukung hasil menyusul & antar-kunjungan)
  pasienData?: any;  // Fallback data pasien jika order belum menyertakan relasi pasien
  handlePrint?: () => void;
  handleDownloadPdf?: () => void;
  printRef?: React.RefObject<HTMLDivElement | null>;
}

export default function LabResultModal({
  isOpen,
  onClose,
  isLoading = false,
  orderLabData,
  orderList = [],
  pasienData,
  handlePrint: propHandlePrint,
  handleDownloadPdf: propHandleDownloadPdf,
  printRef: propPrintRef,
}: LabResultModalProps) {
  const localPrintRef = useRef<HTMLDivElement>(null);
  const effectivePrintRef = propPrintRef || localPrintRef;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Initialize selected order: default to orderLabData id or first item in orderList
  useEffect(() => {
    if (orderLabData?.id) {
      setSelectedOrderId(orderLabData.id);
    } else if (orderList && orderList.length > 0) {
      setSelectedOrderId(orderList[0].id);
    } else {
      setSelectedOrderId(null);
    }
  }, [orderLabData, orderList, isOpen]);

  // Determine active data to render with safe enrichment
  const activeOrder = React.useMemo(() => {
    let order: any = null;
    if (orderList && orderList.length > 0) {
      if (selectedOrderId) {
        order = orderList.find((o) => o.id === selectedOrderId) || orderList[0];
      } else {
        order = orderList[0];
      }
    } else {
      order = orderLabData;
    }

    if (!order) return null;

    const resolvedPasien = order.pasien || pasienData || order.kunjungan?.pasien;
    const resolvedDokter = order.dokter || order.kunjungan?.dokterTujuan || { namaLengkap: 'dr. Pemeriksa' };

    return {
      ...order,
      pasien: resolvedPasien,
      dokter: resolvedDokter,
    };
  }, [orderList, selectedOrderId, orderLabData, pasienData]);

  // Self-contained Print
  const internalPrint = useReactToPrint({
    contentRef: effectivePrintRef,
    documentTitle: `Hasil_Lab_${activeOrder?.pasien?.namaLengkap ? String(activeOrder.pasien.namaLengkap).replace(/[^a-zA-Z0-9]/g, '_') : 'Pasien'}_${activeOrder?.id?.slice(-6) || ''}`,
  });

  const onPrint = () => {
    if (propHandlePrint) {
      propHandlePrint();
    } else {
      internalPrint();
    }
  };

  // Self-contained Download PDF
  const onDownloadPdf = async () => {
    if (propHandleDownloadPdf) {
      propHandleDownloadPdf();
      return;
    }
    if (!effectivePrintRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = effectivePrintRef.current;
      const opt = {
        margin: 0,
        filename: `Hasil_Lab_${activeOrder?.pasien?.namaLengkap ? String(activeOrder.pasien.namaLengkap).replace(/[^a-zA-Z0-9]/g, '_') : 'Pasien'}_${activeOrder?.id?.slice(-6) || ''}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[96vh] border border-slate-300">
        
        {/* Modal Top Bar */}
        <div className="flex flex-wrap justify-between items-center p-4 sm:p-5 border-b border-indigo-100 bg-indigo-50/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-indigo-950 flex items-center gap-2">
                Lembar Hasil Laboratorium Pasien
              </h3>
              <p className="text-xs text-indigo-700">
                {activeOrder?.pasien?.namaLengkap 
                  ? `Pasien: ${activeOrder.pasien.namaLengkap} (No. RM: ${activeOrder.pasien.noRM || '-'})`
                  : 'Dokumen Rekam Medis Laboratorium Terintegrasi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button 
              onClick={onPrint} 
              disabled={isLoading || !activeOrder}
              className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
              title="Cetak Fisik Hasil Laboratorium"
            >
              <Printer className="w-4 h-4" /> Cetak (Printer)
            </button>
            <button 
              onClick={onDownloadPdf} 
              disabled={isLoading || !activeOrder}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
              title="Unduh Berkas PDF Hasil Laboratorium"
            >
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-700 p-1.5 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Multi-Order Selector (Jika pasien punya lebih dari 1 riwayat hasil lab) */}
        {orderList && orderList.length > 1 && (
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <History className="w-3.5 h-3.5 text-indigo-600" /> Pilih Tanggal Order:
            </span>
            <div className="flex items-center gap-1.5">
              {orderList.map((order, idx) => {
                const isActive = (selectedOrderId === order.id) || (!selectedOrderId && idx === 0);
                let orderDate = '-';
                try {
                  const rawDate = order.tanggalOrder || order.createdAt;
                  if (rawDate) {
                    const parsed = new Date(rawDate);
                    if (!isNaN(parsed.getTime())) {
                      orderDate = parsed.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                    }
                  }
                } catch {
                  orderDate = '-';
                }
                const testCount = order.details?.length || 0;
                const poliName = order.kunjungan?.poliklinik?.namaPoli || 'Poli';

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`px-3 py-1.5 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-xs border ${
                      isActive 
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{orderDate}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded-xs ${isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                      {poliName} • {testCount} Tes
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Body / Paper Sheet */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200 flex justify-center">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
              <p className="font-medium text-sm">Memuat dokumen hasil laboratorium...</p>
            </div>
          ) : activeOrder ? (
            <div className="shadow-2xl overflow-hidden bg-white max-w-full my-auto" style={{ width: '210mm', minHeight: '297mm' }}>
              <CetakHasilLab ref={effectivePrintRef} data={activeOrder} />
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center text-gray-500 max-w-md text-center">
              <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
              <p className="font-bold text-base text-gray-800 mb-1">Belum Ada Hasil Laboratorium</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pasien ini belum memiliki order pemeriksaan laboratorium, atau pemeriksaan masih dalam proses di laboratorium / rujukan eksternal.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Terintegrasi Rekam Medis Elektronik (RME) & Siap Cetak</span>
          </div>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
