import React, { Dispatch, SetStateAction, useState, useEffect, useRef } from 'react';
import { Syringe, Search, Loader2, X, Plus, Check } from 'lucide-react';
import { icd9Service } from '@/services/icd9.service';

interface TabTindakanProps {
  selectedProsedur: any[];
  setSelectedProsedur: Dispatch<SetStateAction<any[]>>;
  handleRemoveProsedur: (kode: string) => void;
  // Optional props for backwards compatibility
  isSearchingICD9?: boolean;
  icd9Query?: string;
  handleSearchICD9?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icd9Results?: any[];
  handleSelectICD9?: (icd: any) => void;
}

export default function TabTindakan({
  selectedProsedur,
  setSelectedProsedur,
  handleRemoveProsedur,
  ...props
}: TabTindakanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil data ICD-9 (seluruh master jika query kosong)
  const fetchICD9 = async (term: string = '') => {
    setIsLoading(true);
    try {
      const res = await icd9Service.search(term);
      if (res && res.status === 'success' && res.data) {
        setResults(res.data);
      } else if (Array.isArray(res)) {
        setResults(res);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching ICD-9:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Muat seluruh daftar ICD-9 secara instan saat komponen dimount
  useEffect(() => {
    fetchICD9('');
  }, []);

  // Filter pencarian saat dokter mengetik (debounce 200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchICD9(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (item: any) => {
    const exists = selectedProsedur.some(
      (p) => p.kode_icd9 === item.kode_icd9 || p.id_icd9 === item.id_icd9
    );
    if (!exists) {
      setSelectedProsedur([
        ...selectedProsedur,
        {
          id_icd9: item.id_icd9,
          icd9Id: item.id_icd9,
          kode_icd9: item.kode_icd9,
          nama_prosedur: item.nama_prosedur,
          pelaksana: 'Dokter',
          catatan: ''
        }
      ]);
    }
    if (props.handleSelectICD9) {
      props.handleSelectICD9(item);
    }
  };

  return (
    <div className="p-8">
      <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
        <Syringe className="w-6 h-6 text-blue-500" />
        Tindakan Medis (ICD-9-CM)
      </h3>
      
      {/* Kolom Pencarian & Dropdown ICD-9 */}
      <div className="relative mb-6" ref={dropdownRef}>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Cari & Pilih Tindakan Medis (ICD-9-CM)
        </label>
        
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => {
              setIsOpen(true);
              if (results.length === 0) {
                fetchICD9('');
              }
            }}
            onFocus={() => {
              setIsOpen(true);
              if (results.length === 0) {
                fetchICD9('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                fetchICD9(searchTerm);
              }
            }}
            placeholder="Klik di sini untuk melihat seluruh ICD-9, atau ketik nama/kode tindakan..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm text-gray-900"
          />

          <div className="absolute left-3 pointer-events-none text-gray-400">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchICD9('');
                setIsOpen(true);
              }}
              className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Bersihkan pencarian (tampilkan semua)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Seluruh / Hasil Pencarian ICD-9 */}
        {isOpen && (
          <div className="absolute z-30 w-full mt-1.5 bg-white border border-blue-200 shadow-xl rounded-none max-h-72 overflow-y-auto divide-y divide-gray-100">
            {/* Header Dropdown */}
            <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex justify-between items-center text-xs text-gray-600 sticky top-0 z-10 backdrop-blur-sm">
              <span className="font-semibold flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Memuat tindakan ICD-9...
                  </>
                ) : searchTerm ? (
                  `Ditemukan ${results.length} tindakan untuk "${searchTerm}"`
                ) : (
                  `Daftar Seluruh Master ICD-9 (${results.length} tindakan tersedia)`
                )}
              </span>
              <span className="text-gray-400 text-[11px] italic">
                Klik baris atau tombol + untuk memilih
              </span>
            </div>

            {/* List Items */}
            {isLoading && results.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Memuat master ICD-9...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                <p>Tidak ditemukan tindakan medis ICD-9 yang cocok dengan &quot;{searchTerm}&quot;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    fetchICD9('');
                  }}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Tampilkan seluruh daftar tindakan ICD-9
                </button>
              </div>
            ) : (
              results.map((icd, idx) => {
                const isSelected = selectedProsedur.some(
                  (p) => p.kode_icd9 === icd.kode_icd9 || p.id_icd9 === icd.id_icd9
                );
                return (
                  <div
                    key={icd.id_icd9 || idx}
                    onClick={() => !isSelected && handleSelect(icd)}
                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors ${
                      isSelected ? 'bg-blue-50/40 cursor-default' : ''
                    }`}
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-bold border border-blue-200">
                          {icd.kode_icd9}
                        </span>
                        <p className="text-sm font-bold text-gray-900">
                          {icd.nama_prosedur}
                        </p>
                      </div>
                      {icd.kategori && (
                        <p className="text-xs text-gray-500 mt-1 pl-1">
                          Kategori: <span className="font-medium">{icd.kategori}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                          <Check className="w-3.5 h-3.5" />
                          Terpilih
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(icd);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-2.5 py-1 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Pilih
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Tabel Tindakan Terpilih */}
      <div className="border border-gray-200 rounded-none overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-sm font-bold text-gray-700">Tindakan Terpilih</h4>
          <span className="text-xs text-gray-500 font-medium">
            Total: {selectedProsedur.length} tindakan
          </span>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kode ICD-9</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Tindakan</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelaksana</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm bg-white">
            {selectedProsedur.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                  Belum ada tindakan yang ditambahkan. Klik kolom pencarian di atas untuk melihat seluruh pilihan tindakan.
                </td>
              </tr>
            ) : (
              selectedProsedur.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold text-slate-800">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 text-xs border border-blue-200 font-mono">
                      {p.kode_icd9}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{p.nama_prosedur}</td>
                  <td className="px-6 py-4 text-slate-800">
                    <select
                      className="bg-white border border-gray-300 text-sm py-1.5 px-3 rounded-none focus:ring-2 focus:ring-blue-500"
                      value={p.pelaksana || 'Dokter'}
                      onChange={(e) => {
                        const newP = [...selectedProsedur];
                        newP[idx].pelaksana = e.target.value;
                        setSelectedProsedur(newP);
                      }}
                    >
                      <option value="Dokter">Dokter</option>
                      <option value="Perawat">Perawat</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleRemoveProsedur(p.kode_icd9)}
                      className="text-red-600 hover:text-red-800 font-bold hover:underline text-xs"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
