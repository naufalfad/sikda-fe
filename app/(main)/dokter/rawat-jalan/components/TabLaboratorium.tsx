import React, { Dispatch, SetStateAction } from 'react';
import { TestTubes, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface TabLaboratoriumProps {
  availableLabTests: any[];
  openLabCategories: string[];
  handleToggleLabCategory: (category: string) => void;
  labOrders: string[];
  handleToggleLab: (test: string) => void;
  labNote: string;
  setLabNote: Dispatch<SetStateAction<string>>;
  isSaving: boolean;
  selectedKunjungan: any;
  simpanOrderLab: (data: any) => Promise<void>;
  clearSelection: () => void;
  fetchAntrian: () => void;
  setActiveTab: (tab: string) => void;
}

export default function TabLaboratorium({
  availableLabTests,
  openLabCategories,
  handleToggleLabCategory,
  labOrders,
  handleToggleLab,
  labNote,
  setLabNote,
  isSaving,
  selectedKunjungan,
  simpanOrderLab,
  clearSelection,
  fetchAntrian,
  setActiveTab
}: TabLaboratoriumProps) {
  return (
    <div className="p-8">
      <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
        <TestTubes className="w-6 h-6 text-blue-600" />
        Order Pemeriksaan Laboratorium
      </h3>
      
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mb-6 space-y-4">
        {availableLabTests.map((cat, idx) => {
          const isOpen = openLabCategories.includes(cat.category);
          return (
          <div key={idx} className="bg-white border-[1.5px] border-slate-800 break-inside-avoid shadow-sm">
            <h4 
              onClick={() => handleToggleLabCategory(cat.category)}
              className="font-extrabold text-[11px] text-slate-900 bg-yellow-300 hover:bg-yellow-400 px-2 py-1.5 uppercase tracking-tight border-b-[1.5px] border-slate-800 cursor-pointer flex justify-between items-center transition-colors"
            >
              <span>{cat.category}</span>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </h4>
            {isOpen && (
              <div className="p-2 space-y-0.5 bg-yellow-50/10">
                {cat.tests.map((test: string, i: number) => (
                  <label key={i} className="flex items-start gap-2 cursor-pointer hover:bg-yellow-100 p-0.5 rounded-sm transition-colors group">
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 mt-[1px] text-slate-800 border-slate-400 rounded-sm focus:ring-slate-800 cursor-pointer" 
                      checked={labOrders.includes(test)}
                      onChange={() => handleToggleLab(test)}
                    />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight group-hover:text-slate-900">{test}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )})}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Klinis / Indikasi Pemeriksaan</label>
        <textarea 
          rows={3} 
          value={labNote} 
          onChange={e => setLabNote(e.target.value)} 
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900" 
          placeholder="Contoh: Cek gula darah sewaktu karena riwayat DM keluarga, mohon segera (CITO)..." 
        />
      </div>

      <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 mb-6">
        <div>
          <p className="text-sm text-blue-800 font-medium">Total Pemeriksaan Dipilih:</p>
          <p className="text-2xl font-bold text-blue-900">{labOrders.length} Pemeriksaan</p>
        </div>
        <button 
          disabled={labOrders.length === 0 || isSaving}
          onClick={async () => {
            if (!selectedKunjungan) return;
            try {
              await simpanOrderLab({
                kunjunganId: selectedKunjungan.id,
                pasienId: selectedKunjungan.pasien.id,
                dokterId: selectedKunjungan.dokterTujuan?.id || 'dummy-dokter-id',
                catatanKlinis: labNote,
                tests: labOrders
              });
              Swal.fire({
                icon: 'success',
                title: 'Permintaan Lab Tersimpan!',
                text: 'Permintaan rujukan lab berhasil dicatat. Lembar rujukan dapat diserahkan ke pasien dan Anda dapat melanjutkan pemeriksaan.',
                timer: 2000,
                showConfirmButton: false,
              });
              setActiveTab('TINDAKAN');
            } catch (error) {
              // Error ditangani oleh store
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-none shadow-sm transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <TestTubes className="w-5 h-5" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Permintaan Lab & Lanjut ➔'}
        </button>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button onClick={() => { setActiveTab('TINDAKAN'); }} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-8 rounded-none transition-colors shadow-sm text-sm">
          Lewati & Lanjut ke Tindakan &rarr;
        </button>
      </div>
    </div>
  );
}
