"use client";

import React, { useState, useEffect } from 'react';
import { User, ClipboardList, Activity, HeartPulse, AlertTriangle, AlertOctagon, Send, Clock, Plus, Syringe } from 'lucide-react';
import { asetRuanganService } from '../../../../services/asetRuangan.service';

// Mock Data
const MOCK_QUEUE = [
  { id: '1', noRM: 'RM-00991', name: 'Joko Anwar', age: 54, status: 'Kritis', triage: 'Merah', time: '10:05', diagnosis: 'Suspek Serangan Jantung' },
  { id: '2', noRM: 'RM-00812', name: 'Maya Sari', age: 24, status: 'Observasi', triage: 'Kuning', time: '10:20', diagnosis: 'Trauma Tumpul Abdomen' },
  { id: '3', noRM: 'RM-00125', name: 'Dedi Irawan', age: 34, status: 'Menunggu', triage: 'Hijau', time: '10:45', diagnosis: 'Luka Robek Tangan' },
];

export default function UGDDashboard() {
  const [activeTab, setActiveTab] = useState<'triage' | 'pemeriksaan' | 'observasi' | 'keputusan'>('triage');
  const [selectedPatient, setSelectedPatient] = useState<any>(MOCK_QUEUE[0]);
  const [inapRooms, setInapRooms] = useState<any[]>([]);

  useEffect(() => {
    asetRuanganService.getRuangans({ kategoriRuangan: 'RAWAT_INAP' })
      .then(setInapRooms)
      .catch(() => {});
  }, []);

  // Helper for Triage Colors
  const getTriageColor = (color: string) => {
    switch (color) {
      case 'Merah': return 'bg-red-600 text-white border-red-700';
      case 'Kuning': return 'bg-yellow-400 text-black border-yellow-500';
      case 'Hijau': return 'bg-green-500 text-white border-green-600';
      case 'Hitam': return 'bg-gray-900 text-white border-black';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: UGD QUEUE */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-4 border-b border-gray-200 bg-red-50/50">
          <h2 className="text-lg font-bold text-red-700 flex items-center">
            <AlertOctagon className="w-5 h-5 mr-2 text-red-600" />
            Pasien IGD / UGD
          </h2>
          <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
            <span>Diurutkan berdasarkan prioritas medis</span>
            <span className="font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">Resusitasi: 1</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {MOCK_QUEUE.map((patient) => (
            <div 
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`p-3 border-l-4 cursor-pointer transition-all ${
                selectedPatient?.id === patient.id 
                  ? 'border-l-blue-600 bg-blue-50 shadow-md border-y border-r border-blue-200' 
                  : 'border-l-transparent border-y border-r border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono font-bold text-gray-500">{patient.time} • {patient.noRM}</span>
                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase shadow-sm ${getTriageColor(patient.triage)}`}>
                  {patient.triage}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{patient.name}</h3>
              <p className="text-xs text-gray-600 mt-1 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                {patient.diagnosis}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: MAIN FORM */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Header Pasien UGD */}
            <div className={`p-4 border-b border-gray-200 shadow-sm flex justify-between items-center text-white ${
              selectedPatient.triage === 'Merah' ? 'bg-red-700' :
              selectedPatient.triage === 'Kuning' ? 'bg-yellow-500 text-black' :
              selectedPatient.triage === 'Hijau' ? 'bg-green-600' : 'bg-gray-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-12 h-12 flex items-center justify-center font-bold text-2xl mr-4 border-2 border-white/30 bg-black/10`}>
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{selectedPatient.name}</h1>
                  <div className="text-sm opacity-90 flex items-center mt-1 font-medium">
                    <span className="font-mono bg-black/20 px-1.5 py-0.5 mr-2">{selectedPatient.noRM}</span>
                    <span>{selectedPatient.age} Tahun</span>
                    <span className="mx-2">•</span>
                    <span className="uppercase tracking-wider font-bold">PRIORITAS {selectedPatient.triage}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Waktu Kedatangan</div>
                <div className="text-2xl font-mono font-bold flex items-center">
                  <Clock className="w-5 h-5 mr-2 opacity-70" />
                  {selectedPatient.time}
                </div>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-gray-200 bg-white shadow-sm z-10">
              <button 
                onClick={() => setActiveTab('triage')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'triage' ? 'border-red-600 text-red-700 bg-red-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                1. Triage & ABCDE
              </button>
              <button 
                onClick={() => setActiveTab('pemeriksaan')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pemeriksaan' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                2. Pemeriksaan Medis
              </button>
              <button 
                onClick={() => setActiveTab('observasi')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'observasi' ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                3. Tabel Observasi
              </button>
              <button 
                onClick={() => setActiveTab('keputusan')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'keputusan' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                4. Keputusan & Rujukan
              </button>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              
              {/* TAB 1: TRIAGE */}
              {activeTab === 'triage' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-3">
                      <Activity className="w-5 h-5 mr-2 text-red-600" />
                      Penilaian Awal (Primary Survey)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* GCS Section */}
                      <div className="bg-gray-50 p-4 border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Tingkat Kesadaran (GCS)</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">Eye (Mata)</span>
                            <select className="border border-gray-300 p-1.5 text-sm w-48 rounded-none text-gray-900">
                              <option>4 - Spontan</option>
                              <option>3 - Terhadap Suara</option>
                              <option>2 - Terhadap Nyeri</option>
                              <option>1 - Tidak Ada Respon</option>
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">Verbal (Suara)</span>
                            <select className="border border-gray-300 p-1.5 text-sm w-48 rounded-none text-gray-900">
                              <option>5 - Orientasi Baik</option>
                              <option>4 - Bingung</option>
                              <option>3 - Kata Tidak Jelas</option>
                              <option>2 - Suara Mengerang</option>
                              <option>1 - Tidak Ada Respon</option>
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">Motorik (Gerak)</span>
                            <select className="border border-gray-300 p-1.5 text-sm w-48 rounded-none text-gray-900">
                              <option>6 - Mengikuti Perintah</option>
                              <option>5 - Melokalisir Nyeri</option>
                              <option>4 - Menghindar Nyeri</option>
                              <option>3 - Fleksi Abnormal</option>
                              <option>2 - Ekstensi Abnormal</option>
                              <option>1 - Tidak Ada Respon</option>
                            </select>
                          </div>
                          <div className="pt-2 border-t border-gray-300 flex justify-between items-center font-bold text-lg">
                            <span className="text-gray-800">Total GCS:</span>
                            <span className="text-red-600">15 (Compos Mentis)</span>
                          </div>
                        </div>
                      </div>

                      {/* ABCDE Section */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">A - Airway (Jalan Napas)</label>
                          <input type="text" className="w-full border-gray-300 p-2 text-sm rounded-none focus:ring-red-500 focus:border-red-500 text-black" defaultValue="Bebas, tidak ada sumbatan" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">B - Breathing (Pernapasan)</label>
                          <input type="text" className="w-full border-gray-300 p-2 text-sm rounded-none focus:ring-red-500 focus:border-red-500 text-black" defaultValue="Spontan, RR 24x/mnt, SpO2 96%" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">C - Circulation (Sirkulasi)</label>
                          <input type="text" className="w-full border-gray-300 p-2 text-sm rounded-none focus:ring-red-500 focus:border-red-500 text-black" defaultValue="Nadi kuat 110x/mnt, CRT < 2 dtk" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">D - Disability (Neurologis)</label>
                          <input type="text" className="w-full border-gray-300 p-2 text-sm rounded-none focus:ring-red-500 focus:border-red-500 text-black" defaultValue="Pupil isokor, reflex cahaya +" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PEMERIKSAAN */}
              {activeTab === 'pemeriksaan' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <Syringe className="w-5 h-5 mr-2 text-blue-600" />
                      Instruksi Medis & Tindakan IGD
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Pemeriksaan Fisik Lanjutan (Secondary Survey)</label>
                        <textarea rows={4} className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-sm rounded-none p-3 placeholder:text-gray-400" placeholder="Pemeriksaan fisik menyeluruh (Head to toe)..."></textarea>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Diagnosa Awal (ICD-10)</label>
                          <input type="text" className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black p-3 text-sm rounded-none" defaultValue={selectedPatient.diagnosis} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Tindakan Kegawatdaruratan</label>
                          <input type="text" className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black p-3 text-sm rounded-none placeholder:text-gray-400" placeholder="Contoh: Pasang O2 3Lpm, IV Line, EKG" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Obat Life-Saving (Injeksi / Infus)</label>
                        <textarea rows={3} className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black p-3 text-sm rounded-none placeholder:text-gray-400" placeholder="Instruksi obat untuk perawat..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OBSERVASI */}
              {activeTab === 'observasi' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="bg-white shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <HeartPulse className="w-5 h-5 mr-2 text-orange-500" />
                        Tabel Observasi Tanda Vital
                      </h3>
                      <button className="flex items-center text-sm bg-orange-500 text-white px-3 py-1.5 hover:bg-orange-600 transition-colors font-bold shadow-sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah Pengukuran
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold border-b border-gray-300">
                          <tr>
                            <th className="px-4 py-3">Waktu</th>
                            <th className="px-4 py-3">Tensi (TD)</th>
                            <th className="px-4 py-3">Nadi (HR)</th>
                            <th className="px-4 py-3">Napas (RR)</th>
                            <th className="px-4 py-3">Suhu</th>
                            <th className="px-4 py-3">SpO2</th>
                            <th className="px-4 py-3">GCS</th>
                            <th className="px-4 py-3">Petugas</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono font-bold text-gray-900">10:20</td>
                            <td className="px-4 py-3 text-red-600 font-bold">160/90</td>
                            <td className="px-4 py-3 text-gray-800">110 x/m</td>
                            <td className="px-4 py-3 text-red-600 font-bold">28 x/m</td>
                            <td className="px-4 py-3 text-gray-800">36.5 °C</td>
                            <td className="px-4 py-3 text-red-600 font-bold">92%</td>
                            <td className="px-4 py-3 text-gray-800">14 (A)</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">Ns. Ani</td>
                          </tr>
                          <tr className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono font-bold text-gray-900">10:35</td>
                            <td className="px-4 py-3 text-gray-800">145/85</td>
                            <td className="px-4 py-3 text-gray-800">98 x/m</td>
                            <td className="px-4 py-3 text-gray-800">22 x/m</td>
                            <td className="px-4 py-3 text-gray-800">36.5 °C</td>
                            <td className="px-4 py-3 text-green-600 font-bold">96% (O2)</td>
                            <td className="px-4 py-3 text-gray-800">15 (CM)</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">Ns. Ani</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KEPUTUSAN */}
              {activeTab === 'keputusan' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-2">
                      <Send className="w-5 h-5 mr-2 text-emerald-600" />
                      Discharge & Keputusan Akhir
                    </h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Tindak Lanjut Pasien IGD</label>
                      <div className="grid grid-cols-4 gap-3">
                        <label className="border border-gray-300 p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-all text-center">
                          <input type="radio" name="keputusan" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mb-2" />
                          <span className="font-bold text-sm text-gray-800">Boleh Pulang</span>
                          <span className="text-xs text-gray-500">(Rawat Jalan)</span>
                        </label>
                        <label className="border border-blue-500 bg-blue-50 p-4 flex flex-col items-center justify-center cursor-pointer shadow-sm text-center">
                          <input type="radio" name="keputusan" defaultChecked className="w-4 h-4 text-blue-600 focus:ring-blue-500 mb-2" />
                          <span className="font-bold text-sm text-blue-800">Rawat Inap</span>
                          <span className="text-xs text-blue-600">(Opname / ICU)</span>
                        </label>
                        <label className="border border-gray-300 p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-500 transition-all text-center">
                          <input type="radio" name="keputusan" className="w-4 h-4 text-orange-600 focus:ring-orange-500 mb-2" />
                          <span className="font-bold text-sm text-gray-800">Dirujuk</span>
                          <span className="text-xs text-gray-500">(RS Lain)</span>
                        </label>
                        <label className="border border-gray-300 p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-500 transition-all text-center">
                          <input type="radio" name="keputusan" className="w-4 h-4 text-red-600 focus:ring-red-500 mb-2" />
                          <span className="font-bold text-sm text-gray-800">Meninggal</span>
                          <span className="text-xs text-gray-500">(DOA / IGD)</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                      <label className="block text-sm font-bold text-blue-800 mb-2">Permintaan Kamar Rawat Inap</label>
                      <select className="w-full border-gray-300 p-3 text-sm rounded-none text-black mb-2">
                        <option value="">Pilih Ruangan Rawat Inap...</option>
                        {inapRooms.length > 0 ? (
                          inapRooms.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.namaRuangan} ({r.gedung || 'Utama'} - {r.lantai || 'Lt 1'}) - {r._count?.tempatTidurs || 0} Bed
                            </option>
                          ))
                        ) : (
                          <>
                            <option>Ruang Rawat Inap Melati (Dewasa)</option>
                            <option>Ruang Rawat Inap Mawar (Isolasi)</option>
                          </>
                        )}
                      </select>
                      <textarea rows={2} className="w-full border-gray-300 p-3 text-sm rounded-none text-black placeholder:text-gray-400" placeholder="Catatan instruksi untuk perawat bangsal..."></textarea>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Footer Actions */}
            <div className="bg-white p-4 border-t border-gray-200 flex justify-end space-x-3 shadow-lg z-20 relative">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm rounded-none">
                Cetak Lembar IGD
              </button>
              <button className="px-6 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center text-sm rounded-none shadow-sm">
                <AlertOctagon className="w-4 h-4 mr-2" />
                Kunci Rekam Medis & Selesai
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-semibold">Pilih pasien IGD dari daftar sebelah kiri</p>
          </div>
        )}
      </div>

    </div>
  );
}
