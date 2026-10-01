import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { FileText, Search, X, Plus, Loader2, Check } from 'lucide-react';
import { SOAPPayload, DiagnosaItem } from '@/types/rawatJalan.types';
import { masterService } from '@/services/master.service';

interface TabAsesmenProps {
  soapData: SOAPPayload;
  setSoapData: Dispatch<SetStateAction<SOAPPayload>>;
  setActiveTab: (tab: string) => void;
}

export default function TabAsesmen({
  soapData,
  setSoapData,
  setActiveTab
}: TabAsesmenProps) {
  const [icdSearchTerm, setIcdSearchTerm] = useState('');
  const [icdResults, setIcdResults] = useState<any[]>([]);
  const [isSearchingIcd, setIsSearchingIcd] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState('Utama');
  const [selectedStatusKlinis, setSelectedStatusKlinis] = useState('Aktif');
  const [selectedStatusVerifikasi, setSelectedStatusVerifikasi] = useState('Suspek');

  // Ambil data ICD-10 (jika term kosong, akan mengembalikan seluruh master ICD-10)
  const fetchICD = async (term?: string) => {
    setIsSearchingIcd(true);
    try {
      const res = await masterService.getIcd10(term?.trim() || '');
      if (res && res.data) {
        setIcdResults(res.data);
      } else {
        setIcdResults([]);
      }
    } catch (err) {
      console.error('Error fetching ICD10:', err);
      setIcdResults([]);
    } finally {
      setIsSearchingIcd(false);
    }
  };

  // Muat seluruh daftar ICD-10 secara instan saat tab asesmen dibuka
  useEffect(() => {
    fetchICD('');
  }, []);

  // Filter pencarian otomatis saat dokter mengetik (debounce 250ms), atau reload full saat dikosongkan
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchICD(icdSearchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [icdSearchTerm]);

  const handleAddDiagnosis = (item: any) => {
    const currentArr = soapData.diagnosisArr || [];
    // Check if already exists
    if (currentArr.some(d => d.icd10Id === item.id_icd10)) {
      alert('Diagnosa ini sudah ditambahkan.');
      return;
    }

    const newItem: DiagnosaItem = {
      icd10Id: item.id_icd10,
      kode_icd10: item.kode_icd10,
      nama_diagnosis: item.nama_diagnosis,
      jenisDiagnosis: selectedJenis,
      statusKlinis: selectedStatusKlinis,
      statusVerifikasi: selectedStatusVerifikasi
    };

    setSoapData({
      ...soapData,
      diagnosisArr: [...currentArr, newItem]
    });
  };

  const handleRemoveDiagnosis = (id: string) => {
    const currentArr = soapData.diagnosisArr || [];
    setSoapData({
      ...soapData,
      diagnosisArr: currentArr.filter(d => d.icd10Id !== id)
    });
  };

  const diagnosisArr = soapData.diagnosisArr || [];

  return (
    <div className="p-8 space-y-6">
      <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
        <FileText className="w-6 h-6 text-blue-600" />
        A - Asesmen (Diagnosa Klinis)
      </h3>
      <div className="bg-blue-50/30 p-6 border border-blue-100 rounded-none">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Diagnosa Klinis / Asesmen Dokter (Teks Bebas)</label>
            <textarea rows={3} value={soapData.diagnosisKlinis || ''} onChange={e => setSoapData({...soapData, diagnosisKlinis: e.target.value})} className="w-full px-4 py-3 bg-white border border-blue-200 rounded-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-sm text-gray-900" placeholder="Contoh: Pulpitis Irreversibel pada gigi 46. Suspek periodontitis apikal kronis." />
          </div>

          <div className="border-t border-blue-100 pt-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 text-red-600">Pencatatan Diagnosa ICD-10 (Standar SATUSEHAT)</h4>
            
            <div className="bg-white p-4 border border-blue-200 shadow-sm mb-4">
              <div className="flex flex-col md:flex-row gap-4 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cari Penyakit (Kode ICD-10 / Nama)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      value={icdSearchTerm}
                      onChange={(e) => setIcdSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          fetchICD(icdSearchTerm);
                        }
                      }}
                      placeholder="Cari kode atau nama penyakit (seluruh ICD-10 tampil jika kosong)..."
                      className="w-full pl-9 pr-9 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm rounded-none"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    {icdSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setIcdSearchTerm('')}
                        className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Hapus pencarian"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-1/4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status Diagnosa</label>
                  <select
                    value={selectedJenis}
                    onChange={(e) => setSelectedJenis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Utama">Utama</option>
                    <option value="Sekunder">Sekunder</option>
                    <option value="Komorbid">Komorbid</option>
                    <option value="Komplikasi">Komplikasi</option>
                  </select>
                </div>
                <div className="w-full md:w-1/4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status Klinis</label>
                  <select
                    value={selectedStatusKlinis}
                    onChange={(e) => setSelectedStatusKlinis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Sembuh">Sembuh</option>
                    <option value="Kambuh">Kambuh</option>
                    <option value="Remisi">Remisi</option>
                  </select>
                </div>
                <div className="w-full md:w-1/4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status Verifikasi</label>
                  <select
                    value={selectedStatusVerifikasi}
                    onChange={(e) => setSelectedStatusVerifikasi(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Suspek">Suspek</option>
                    <option value="Kerja">Kerja</option>
                    <option value="Definitif">Definitif</option>
                    <option value="Menyingkirkan">Menyingkirkan (Rule Out)</option>
                  </select>
                </div>
              </div>

              {/* Status Header Informasi ICD-10 */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  {isSearchingIcd ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Memuat data ICD-10...</span>
                    </>
                  ) : icdSearchTerm ? (
                    <span>Menampilkan {icdResults.length} hasil untuk &quot;{icdSearchTerm}&quot;</span>
                  ) : (
                    <span>Menampilkan seluruh master ICD-10 ({icdResults.length} tersedia)</span>
                  )}
                </span>
                <span className="text-gray-400 italic">
                  Klik baris atau tombol + untuk menambahkan ke diagnosa
                </span>
              </div>

              {/* Daftar Master ICD-10 (Selalu Tampil) */}
              <div className="border border-blue-200 bg-white max-h-64 overflow-y-auto divide-y divide-gray-100 shadow-inner">
                {isSearchingIcd && icdResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Memuat daftar ICD-10...</span>
                  </div>
                ) : icdResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    <p>Tidak ditemukan diagnosa ICD-10 yang sesuai &quot;{icdSearchTerm}&quot;.</p>
                    <button
                      type="button"
                      onClick={() => setIcdSearchTerm('')}
                      className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Tampilkan seluruh daftar ICD-10
                    </button>
                  </div>
                ) : (
                  icdResults.map((res: any, idx: number) => {
                    const isSelected = diagnosisArr.some(d => d.icd10Id === res.id_icd10);
                    return (
                      <div 
                        key={res.id_icd10 || idx} 
                        className={`p-3 hover:bg-blue-50 flex justify-between items-center transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !isSelected && handleAddDiagnosis(res)}
                      >
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2 py-0.5 rounded border border-blue-200">
                              {res.kode_icd10}
                            </span>
                            <span className="font-semibold text-gray-900 text-sm">
                              {res.nama_diagnosis}
                            </span>
                          </div>
                          {(res.kategori || res.bab) && (
                            <div className="text-xs text-gray-500 mt-1 pl-1">
                              {res.kategori ? `Kategori: ${res.kategori}` : ''} 
                              {res.kategori && res.bab ? ' | ' : ''}
                              {res.bab ? `Bab: ${res.bab}` : ''}
                            </div>
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
                                handleAddDiagnosis(res);
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
            </div>

            {/* List Diagnosa Terpilih */}
            {diagnosisArr.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-4 bg-gray-50 border border-gray-200 text-center">
                Belum ada diagnosa ICD-10 yang dipilih.
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-bold text-gray-700">Diagnosa Terpilih:</label>
                {diagnosisArr.map((diag, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded-none shadow-sm border-l-4 border-l-green-500">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {diag.kode_icd10} - {diag.nama_diagnosis}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full mr-2">
                          {diag.jenisDiagnosis}
                        </span>
                        <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mr-2">
                          {diag.statusKlinis}
                        </span>
                        <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full mr-2">
                          {diag.statusVerifikasi}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveDiagnosis(diag.icd10Id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50"
                      title="Hapus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Prognosis Penyakit Pasien (SATUSEHAT ClinicalImpression) */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Prognosis Penyakit Pasien (FHIR ClinicalImpression)
              </label>
              <select
                value={soapData.prognosisKode || '170968001'}
                onChange={(e) => {
                  const selIndex = e.target.selectedIndex;
                  const display = e.target.options[selIndex].text;
                  setSoapData({
                    ...soapData,
                    prognosisKode: e.target.value,
                    prognosisDisplay: display
                  });
                }}
                className="w-full px-4 py-2.5 rounded-none border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-900"
              >
                <option value="170968001">Sanam / Baik (Bonam) - Pasien diharapkan sembuh total</option>
                <option value="260413007">Dubia ad Bonam - Ragu-ragu cenderung baik/sembuh</option>
                <option value="260415000">Dubia ad Malam - Ragu-ragu cenderung memburuk</option>
                <option value="170969009">Malam / Buruk - Prognosis penyakit memburuk/kritis</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button onClick={() => { setActiveTab('SOAP_P'); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-none transition-colors shadow-sm text-sm">
          Lanjut ke P (Plan) &rarr;
        </button>
      </div>
    </div>
  );
}
