import React from 'react';
import { Loader2, TestTubes, Radio, RefreshCw } from 'lucide-react';

interface SupportOverlayBannerProps {
  isLoadingRekamMedis: boolean;
  selectedKunjungan: any;
  isViewingLabOverlay?: boolean;
  setIsViewingLabOverlay?: (show: boolean) => void;
  fetchAntrian: () => void;
  openLabModal?: () => void;
}

export default function SupportOverlayBanner({
  isLoadingRekamMedis,
  selectedKunjungan,
  fetchAntrian,
  openLabModal,
}: SupportOverlayBannerProps) {
  if (isLoadingRekamMedis) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-xs">Memuat rekam medis...</p>
        </div>
      </div>
    );
  }

  const isMenungguPenunjang = selectedKunjungan?.statusKunjungan === 'MENUNGGU_LAB' || selectedKunjungan?.statusKunjungan === 'MENUNGGU_RADIOLOGI';

  if (isMenungguPenunjang) {
    const isRadiologi = selectedKunjungan?.statusKunjungan === 'MENUNGGU_RADIOLOGI';

    return (
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs select-none transition-colors ${
        isRadiologi 
          ? 'bg-purple-50 border-purple-200 text-purple-900' 
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2">
          {isRadiologi ? (
            <Radio className="w-4 h-4 text-purple-600 animate-pulse flex-shrink-0" />
          ) : (
            <TestTubes className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
          )}
          <span className="leading-tight">
            <strong>Permintaan Rujukan {isRadiologi ? 'Radiologi' : 'Laboratorium'} Aktif:</strong> Pasien memiliki lembar rujukan penunjang. Anda dapat tetap melanjutkan SOAP, tindakan, resep obat, dan menyelesaikan pemeriksaan.
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isRadiologi && openLabModal && (
            <button 
              type="button"
              onClick={() => openLabModal()}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-2.5 rounded-none text-[11px] transition-colors shadow-xs"
            >
              <TestTubes className="w-3 h-3 text-amber-200" />
              Cetak / Tinjau Lembar Lab
            </button>
          )}
          <button 
            type="button"
            onClick={() => fetchAntrian()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-1 px-2.5 rounded-none text-[11px] transition-colors shadow-xs"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            Sinkron Data
          </button>
        </div>
      </div>
    );
  }

  return null;
}
