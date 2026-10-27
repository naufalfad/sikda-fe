'use client';

import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  SwitchCamera,
  Maximize2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { SOAPPayload, FotoObjektifItem } from '@/types/rawatJalan.types';
import { rawatJalanService } from '@/services/rawatJalan.service';
import { getFileUrl } from '@/lib/fileUrl';

interface FotoObjektifSectionProps {
  soapData: SOAPPayload;
  setSoapData: Dispatch<SetStateAction<SOAPPayload>>;
}

export default function FotoObjektifSection({ soapData, setSoapData }: FotoObjektifSectionProps) {
  const fotoList: FotoObjektifItem[] = Array.isArray(soapData.fotoObjektif) ? soapData.fotoObjektif : [];

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedKeterangan, setCapturedKeterangan] = useState('');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [isSavingCamera, setIsSavingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Zoom lightbox state
  const [previewFoto, setPreviewFoto] = useState<FotoObjektifItem | null>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Start camera
  const startCamera = async (facing: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      // Fallback: coba mode kamera tanpa facingMode spesifik
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr: any) {
        setCameraError(err.message || 'Gagal mengakses perangkat kamera. Pastikan izin kamera aktif.');
      }
    }
  };

  // Open camera modal
  const handleOpenCameraModal = () => {
    setCapturedImage(null);
    setCapturedKeterangan('');
    setCameraError(null);
    setIsCameraOpen(true);
    startCamera(cameraFacing);
  };

  // Close camera modal
  const handleCloseCameraModal = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedImage(null);
    setCapturedKeterangan('');
    setCameraError(null);
  };

  // Toggle switch camera
  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture snapshot from video feed
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      stopCameraStream();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(cameraFacing);
  };

  // Save captured photo to server & soapData
  const handleSaveCapturedPhoto = async () => {
    if (!capturedImage) return;
    setIsSavingCamera(true);
    setCameraError(null);
    try {
      const res = await rawatJalanService.uploadFotoKlinis({
        base64Image: capturedImage,
        namaFile: `Foto Klinis ${new Date().toLocaleTimeString('id-ID')}`,
        keterangan: capturedKeterangan.trim(),
      });

      if (res.success && res.data && res.data.length > 0) {
        const savedItems: FotoObjektifItem[] = res.data.map((item: any) => ({
          ...item,
          keterangan: capturedKeterangan.trim() || item.keterangan || '',
        }));

        setSoapData((prev) => ({
          ...prev,
          fotoObjektif: [...(prev.fotoObjektif || []), ...savedItems],
        }));

        handleCloseCameraModal();
      } else {
        throw new Error(res.message || 'Gagal menyimpan foto');
      }
    } catch (err: any) {
      console.error('Error saving captured photo:', err);
      setCameraError(err.message || 'Gagal mengunggah foto ke server');
    } finally {
      setIsSavingCamera(false);
    }
  };

  // Handle file upload input change (multiple)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('fotos', files[i]);
      }

      const res = await rawatJalanService.uploadFotoKlinis(formData);
      if (res.success && res.data && res.data.length > 0) {
        setSoapData((prev) => ({
          ...prev,
          fotoObjektif: [...(prev.fotoObjektif || []), ...res.data],
        }));
      } else {
        throw new Error(res.message || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Gagal mengunggah foto. Pastikan ukuran file tidak melebihi 10MB.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update keterangan foto klinis
  const handleUpdateKeterangan = (index: number, newKeterangan: string) => {
    setSoapData((prev) => {
      const current = [...(prev.fotoObjektif || [])];
      if (current[index]) {
        current[index] = { ...current[index], keterangan: newKeterangan };
      }
      return { ...prev, fotoObjektif: current };
    });
  };

  // Delete foto
  const handleDeleteFoto = (index: number) => {
    if (confirm('Hapus foto klinis ini dari rekam medis pemeriksaan saat ini?')) {
      setSoapData((prev) => {
        const current = [...(prev.fotoObjektif || [])];
        current.splice(index, 1);
        return { ...prev, fotoObjektif: current };
      });
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <div className="bg-emerald-50/40 p-5 border border-emerald-200 space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
        <div>
          <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            Dokumentasi Foto Objektif / Klinis (Luka & Lesi Pasien)
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Ambil atau unggah foto kondisi fisik pasien (luka, jahitan, fraktur, lesi kulit). Foto ini akan tersimpan permanen di RME untuk rujukan dan kolaborasi antar dokter.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Upload File Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unggah Foto</span>
              </>
            )}
          </button>

          {/* Ambil Kamera Button */}
          <button
            type="button"
            onClick={handleOpenCameraModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ambil Foto (Kamera)</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE IF ANY */}
      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PHOTO GALLERY LIST */}
      {fotoList.length === 0 ? (
        <div className="border border-dashed border-emerald-300 bg-white/60 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-2">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">Belum ada foto objektif/klinis yang ditambahkan</p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
            Klik tombol <span className="font-semibold text-emerald-800">Unggah Foto</span> untuk memilih foto dari perangkat atau <span className="font-semibold text-emerald-800">Ambil Foto (Kamera)</span> untuk memotret langsung dengan webcam/kamera HP.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotoList.map((foto, index) => {
            const fullUrl = getFileUrl(foto.url);
            return (
              <div
                key={foto.id || foto.url || index}
                className="bg-white border border-slate-300 shadow-sm flex flex-col justify-between overflow-hidden group hover:border-emerald-500 transition-colors"
              >
                {/* Image Thumbnail with Overlay */}
                <div className="relative aspect-[4/3] bg-slate-900/5 overflow-hidden flex items-center justify-center">
                  <img
                    src={fullUrl}
                    alt={foto.keterangan || foto.namaFile || `Foto ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center bg-slate-100 text-slate-400 text-xs flex-col gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span>Gambar rusak</span>
                  </div>

                  {/* Badges / Controls Top */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="bg-slate-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-none font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Zoom Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewFoto(foto)}
                      className="p-1.5 bg-white text-slate-800 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"
                      title="Perbesar / Lihat Penuh"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFoto(index)}
                      className="p-1.5 bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                      title="Hapus Foto Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Caption / Keterangan Edit Area */}
                <div className="p-2.5 bg-white flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Keterangan / Catatan Klinis:
                    </label>
                    <textarea
                      rows={2}
                      value={foto.keterangan || ''}
                      onChange={(e) => handleUpdateKeterangan(index, e.target.value)}
                      placeholder="Contoh: Luka robek paha kanan 4cm, tepi rata..."
                      className="w-full text-xs p-1.5 border border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-900 font-medium leading-tight"
                    />
                  </div>

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px]" title={foto.namaFile}>
                      {foto.namaFile || 'Foto Klinis'}
                    </span>
                    {foto.waktuAmbil && (
                      <span className="font-mono">
                        {new Date(foto.waktuAmbil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CAMERA MODAL VIEW */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-wide">
                  {capturedImage ? 'Konfirmasi Foto Klinis' : 'Ambil Foto Klinis Pasien'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal if any */}
            {cameraError && (
              <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Viewfinder or Captured Preview */}
            <div className="relative bg-black aspect-[4/3] max-h-[55vh] flex items-center justify-center overflow-hidden">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Grid overlay for medical alignment */}
                  <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3 opacity-30" />
                  
                  {/* Switch Camera Button (Mobile/Tablet/Webcam) */}
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 shadow-lg text-xs flex items-center gap-1"
                    title="Ganti Kamera (Depan / Belakang)"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Modal Controls / Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-white space-y-3">
              {capturedImage && (
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">
                    Keterangan Foto Klinis (Luka / Kondisi):
                  </label>
                  <input
                    type="text"
                    value={capturedKeterangan}
                    onChange={(e) => setCapturedKeterangan(e.target.value)}
                    placeholder="Contoh: Vulnus laceratum regio antebrachii 5cm, perdarahan aktif..."
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                {!capturedImage ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseCameraModal}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wide uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      Jepret Foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSavingCamera}
                      onClick={handleRetake}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Foto Ulang
                    </button>
                    <button
                      type="button"
                      disabled={isSavingCamera}
                      onClick={handleSaveCapturedPhoto}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSavingCamera ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Foto Ini</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PHOTO LIGHTBOX PREVIEW */}
      {previewFoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setPreviewFoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-bold text-slate-200">
                Detail Foto Klinis ({previewFoto.namaFile || 'Foto Klinis'})
              </span>
              <button
                type="button"
                onClick={() => setPreviewFoto(null)}
                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center p-2 min-h-[350px]">
              <img
                src={getFileUrl(previewFoto.url)}
                alt="Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-white">
              <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Keterangan Klinis:</p>
              <p className="text-sm font-medium text-slate-200">
                {previewFoto.keterangan || <span className="text-slate-500 italic">Belum ada keterangan klinis.</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
