'use client';

import React, { useState } from 'react';
import { Camera, ZoomIn, X, ChevronLeft, ChevronRight, Image as ImageIcon, Calendar } from 'lucide-react';
import { FotoObjektifItem } from '@/types/rawatJalan.types';
import { getFileUrl } from '@/lib/fileUrl';

interface FotoObjektifViewerProps {
  fotoList?: FotoObjektifItem[] | null;
  title?: string;
  compact?: boolean;
}

export default function FotoObjektifViewer({
  fotoList,
  title = 'Dokumentasi Foto Objektif / Klinis (Luka/Lesi)',
  compact = false,
}: FotoObjektifViewerProps) {
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);

  if (!fotoList || fotoList.length === 0) {
    return null;
  }

  const activePhoto = activePreviewIndex !== null ? fotoList[activePreviewIndex] : null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePreviewIndex !== null) {
      setActivePreviewIndex((activePreviewIndex + 1) % fotoList.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePreviewIndex !== null) {
      setActivePreviewIndex((activePreviewIndex - 1 + fotoList.length) % fotoList.length);
    }
  };

  return (
    <div className={`mt-3 border border-emerald-300 bg-emerald-50/40 ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-emerald-600" /> {title}
          <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-200 text-emerald-800 text-[10px] font-bold">
            {fotoList.length} Foto
          </span>
        </span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'} gap-2.5`}>
        {fotoList.map((foto, idx) => {
          const fullUrl = getFileUrl(foto.url);
          return (
            <div
              key={foto.id || foto.url || idx}
              onClick={() => setActivePreviewIndex(idx)}
              className="group relative cursor-pointer overflow-hidden border border-slate-300 bg-white shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-150"
            >
              {/* Thumbnail Container */}
              <div className="aspect-[4/3] bg-slate-900/5 relative overflow-hidden flex items-center justify-center">
                <img
                  src={fullUrl}
                  alt={foto.keterangan || foto.namaFile || `Foto ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    // Fallback jika gagal muat gambar
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden absolute inset-0 items-center justify-center bg-slate-100 text-slate-400 text-xs flex-col gap-1">
                  <ImageIcon className="w-6 h-6" />
                  <span>Gambar tidak dapat dimuat</span>
                </div>

                {/* Overlay Hover */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                  <ZoomIn className="w-4 h-4" />
                  <span>Lihat Detail</span>
                </div>
              </div>

              {/* Caption & Info */}
              <div className="p-2 bg-white">
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                  {foto.keterangan ? foto.keterangan : (foto.namaFile || `Foto ${idx + 1}`)}
                </p>
                {foto.waktuAmbil && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(foto.waktuAmbil).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LIGHTBOX MODAL PREVIEW DETAIL */}
      {activePreviewIndex !== null && activePhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePreviewIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wide">
                  Foto Klinis #{activePreviewIndex + 1} dari {fotoList.length}
                </span>
                {activePhoto.namaFile && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    ({activePhoto.namaFile})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewIndex(null)}
                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gambar Utama */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-auto min-h-[350px] p-2">
              <img
                src={getFileUrl(activePhoto.url)}
                alt={activePhoto.keterangan || 'Detail Foto Klinis'}
                className="max-h-[65vh] w-auto max-w-full object-contain select-none"
              />

              {/* Tombol Navigasi Prev/Next */}
              {fotoList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-full shadow-lg border border-slate-700 transition-colors"
                    title="Foto Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-full shadow-lg border border-slate-700 transition-colors"
                    title="Foto Berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Footer Keterangan Klinis */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-slate-200">
              <div className="text-xs">
                <span className="font-bold text-emerald-400 block mb-0.5 uppercase tracking-wide text-[10px]">
                  Keterangan Klinis / Catatan Dokter:
                </span>
                <p className="text-sm font-medium leading-relaxed text-white">
                  {activePhoto.keterangan || <span className="text-slate-400 italic">Tidak ada catatan keterangan klinis pada foto ini.</span>}
                </p>
                {activePhoto.waktuAmbil && (
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Waktu Ambil: {new Date(activePhoto.waktuAmbil).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
