import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { CetakHasilLab } from '@/components/laboratorium/CetakHasilLab';

interface LabModalProps {
  showLabSurat: boolean;
  setShowLabSurat: (show: boolean) => void;
  selectedVisit: any;
  pasienData: any;
  handlePrintLab: () => void;
  labPrintRef: React.RefObject<HTMLDivElement | null>;
}

export function LabModal({
  showLabSurat,
  setShowLabSurat,
  selectedVisit,
  pasienData,
  handlePrintLab,
  labPrintRef
}: LabModalProps) {
  if (!showLabSurat || !selectedVisit?.orderLab) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" /> Dokumen Hasil Laboratorium
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintLab}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF
            </button>
            <button 
              onClick={() => setShowLabSurat(false)}
              className="text-slate-400 hover:text-slate-600 font-bold px-3 py-1 bg-slate-200 hover:bg-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-4 md:p-8 bg-slate-300 flex-1 flex justify-center items-start">
          <div className="relative w-full max-w-[210mm] shadow-lg flex-shrink-0">
             {/* OVERRIDE HIDDEN CLASS OF REACT-TO-PRINT SO IT IS VISIBLE IN PREVIEW */}
             <style dangerouslySetInnerHTML={{__html: `
                @media screen {
                   .print-preview-container .print\\:hidden { display: block !important; }
                   .print-preview-container .hidden { display: block !important; }
                }
             `}} />
             <div className="print-preview-container bg-white">
                <CetakHasilLab 
                  ref={labPrintRef} 
                  data={{
                    ...selectedVisit.orderLab,
                    id: selectedVisit.orderLab.id || '-',
                    tanggalOrder: selectedVisit.orderLab.tanggalOrder || selectedVisit.tanggalRegistrasi || selectedVisit.createdAt,
                    pasien: selectedVisit.orderLab.pasien || pasienData,
                    dokter: selectedVisit.orderLab.dokter || selectedVisit.dokterTujuan || { namaLengkap: 'dr. Pemeriksa' },
                    kunjungan: selectedVisit,
                    details: selectedVisit.orderLab.details || []
                  }}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
