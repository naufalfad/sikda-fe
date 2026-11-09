import React, { useState } from 'react';
import { FileText, Eye, X, ExternalLink } from 'lucide-react';
import { radiologiService } from '@/services/radiologi.service';
import Swal from 'sweetalert2';

interface FormEkspertiseModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormEkspertiseModal({ order, onClose, onSuccess }: FormEkspertiseModalProps) {
  const [bacaanNaratif, setBacaanNaratif] = useState(order?.hasil?.bacaanNaratif || '');
  const [kesimpulan, setKesimpulan] = useState(order?.hasil?.kesimpulan || '');
  const [wadoUrl, setWadoUrl] = useState(
    order?.hasil?.wadoUrl || 'https://viewer.ohif.org/viewer?StudyInstanceUIDs=2.16.840.1.114362.1.11972228.22789312658.616067305.306.2'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bacaanNaratif || !kesimpulan) {
      Swal.fire('Peringatan', 'Harap isi Bacaan Naratif dan Kesimpulan Ekspertise!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await radiologiService.submitHasil(order.id, {
        bacaanNaratif,
        kesimpulan,
        wadoUrl,
      });

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Hasil Ekspertise Radiologi Saved & Validated!',
          text: 'Status order diubah ke COMPLETED & siap dikirim ke SATUSEHAT.',
          timer: 2000,
          showConfirmButton: false,
        });
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal menyimpan ekspertise radiologi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 text-white">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Form Input Ekspertise Radiologi — ACSN #{order?.acsn}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-1">
            <X className="w-4 h-4" /> Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* HEADER DETAIL PASIEN */}
          <div className="bg-purple-50 p-4 border border-purple-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-purple-950">
            <div>
              <span className="block text-[10px] text-purple-700 font-bold uppercase">Nama Pasien</span>
              <span className="font-extrabold text-sm">{order?.pasien?.namaLengkap}</span>
            </div>
            <div>
              <span className="block text-[10px] text-purple-700 font-bold uppercase">No. RM</span>
              <span className="font-mono font-extrabold text-sm">{order?.pasien?.noRM}</span>
            </div>
            <div>
              <span className="block text-[10px] text-purple-700 font-bold uppercase">Dokter Pengirim</span>
              <span className="font-bold">{order?.dokter?.namaLengkap || 'Dokter Poli'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-purple-700 font-bold uppercase">Pemeriksaan LOINC</span>
              <span className="font-bold text-purple-900">
                {order?.details?.map((d: any) => d.namaPemeriksaan).join(', ')}
              </span>
            </div>
          </div>

          {/* INPUT WADO URL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              WADO URL NIDR / DICOM Viewer PACS (SATUSEHAT Endpoint)
            </label>
            <input
              type="text"
              value={wadoUrl}
              onChange={(e) => setWadoUrl(e.target.value)}
              placeholder="https://nidr.kemkes.go.id/wado/v1/studies/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-none text-xs font-mono text-gray-900"
            />
          </div>

          {/* EMBEDDED VIEWER / IMAGE PREVIEW */}
          {wadoUrl && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-700" /> Pratinjau Citra Radiologi (WADO / DICOM Viewer)
                </label>
                <a
                  href={wadoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 underline flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Link WADO di Tab Baru
                </a>
              </div>
              <div className="border border-slate-700 bg-slate-950 h-80 overflow-hidden relative flex flex-col items-center justify-center text-white">
                {wadoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ? (
                  <img
                    src={wadoUrl}
                    alt="Foto Rontgen Radiologi"
                    className="max-h-full max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <iframe
                      src={wadoUrl}
                      title="WADO DICOM Viewer"
                      className="w-full h-full border-none absolute inset-0 opacity-20 pointer-events-none"
                    />
                    <div className="z-10 bg-slate-900/90 border border-purple-500/40 p-6 rounded-lg max-w-lg shadow-2xl backdrop-blur">
                      <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                        <Eye className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">OHIF DICOM Web Viewer Ready</h4>
                      <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                        Server Public OHIF memproteksi integrasi <code className="text-yellow-300 bg-black/50 px-1 rounded">iframe</code> lintas domain. Klik tombol di bawah untuk membuka **Full-Screen Interactive DICOM Viewer** (Zoom, Windowing, Measurements):
                      </p>
                      <a
                        href={wadoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 shadow-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> Buka OHIF DICOM Viewer Fullscreen
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEMUAN / BACAAN NARATIF */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Temuan / Bacaan Naratif Ekspertise (Observation Narative) *
            </label>
            <textarea
              rows={4}
              required
              value={bacaanNaratif}
              onChange={(e) => setBacaanNaratif(e.target.value)}
              placeholder="Tuliskan temuan anatomi, corakan paru, impresi organ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-none text-xs text-gray-900 font-mono"
            />
          </div>

          {/* KESIMPULAN / KESAN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Kesimpulan / Kesan Radiologi (DiagnosticReport Conclusion) *
            </label>
            <textarea
              rows={2}
              required
              value={kesimpulan}
              onChange={(e) => setKesimpulan(e.target.value)}
              placeholder="Kesimpulan diagnosa radiologi (misal: Cor dan Pulmo tak tampak kelainan)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-none text-xs font-extrabold text-blue-950 bg-blue-50/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-none hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-800 hover:bg-purple-900 text-white font-extrabold text-xs rounded-none shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Simpan...' : 'Simpan & Validasi Hasil Radiologi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
