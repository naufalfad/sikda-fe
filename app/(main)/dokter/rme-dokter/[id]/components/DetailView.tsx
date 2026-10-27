import React from 'react';
import { Activity, Stethoscope, AlertCircle, Pill, TestTube2, FileText } from 'lucide-react';
import FotoObjektifViewer from '@/app/(main)/dokter/rawat-jalan/components/FotoObjektifViewer';

interface DetailViewProps {
  selectedVisit: any;
  getTriageColor: (triage: string | undefined | null) => string;
  setShowLabSurat: (show: boolean) => void;
}

export function DetailView({
  selectedVisit,
  getTriageColor,
  setShowLabSurat
}: DetailViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* KOLOM KIRI: SCREENING PERAWAT */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-300 px-5 py-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" /> Data Screening Perawat
            </h3>
          </div>
          
          <div className="p-5 space-y-6 bg-white">
            {selectedVisit.screening ? (
              <>
                {/* Tanda Vital */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Tanda Vital (Vital Signs)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tekanan Darah</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.tekananDarahSistolik ? `${selectedVisit.screening.tekananDarahSistolik}/${selectedVisit.screening.tekananDarahDiastolik}` : '-'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Nadi / Detak</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.nadi || '-'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Suhu Tubuh</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.suhuTubuh || '-'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Saturasi Oksigen</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.saturasiOksigen || '-'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Napas / Resp</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.frekuensiNapas || '-'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Skala Nyeri</p>
                      <p className="font-black text-gray-900 text-lg">{selectedVisit.screening.skalaNyeri !== null ? selectedVisit.screening.skalaNyeri : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Antropometri */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Antropometri</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 p-3 text-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tinggi</p>
                      <p className="font-black text-gray-900 text-base">{selectedVisit.screening.tinggiBadan || '-'} cm</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 text-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Berat</p>
                      <p className="font-black text-gray-900 text-base">{selectedVisit.screening.beratBadan || '-'} kg</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 text-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Lingkar Perut</p>
                      <p className="font-black text-gray-900 text-base">{selectedVisit.screening.lingkarPerut || '-'} cm</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 text-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">IMT</p>
                      <p className="font-black text-gray-900 text-base">{selectedVisit.screening.imt || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Keluhan & Triase */}
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Triase & Keluhan</p>
                    {selectedVisit.screening.kategoriTriage && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-widest ${getTriageColor(selectedVisit.screening.kategoriTriage)}`}>
                        {selectedVisit.screening.kategoriTriage}
                      </span>
                    )}
                  </div>
                  <div className="bg-red-50 p-4 border-l-4 border-red-500">
                    <p className="text-sm font-bold text-gray-900">"{selectedVisit.screening.keluhanUtama || '-'}"</p>
                  </div>
                </div>
                
                {/* Riwayat */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Riwayat & Kebiasaan</p>
                  <div className="bg-white space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-600">Riwayat Alergi</span>
                      <span className={`font-black flex items-center gap-1 ${selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi && selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi !== 'Tidak ada' && selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi !== '-' ? 'text-red-600' : 'text-slate-900'}`}>
                        {selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi && selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi !== 'Tidak ada' && selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi !== '-' && <AlertCircle className="w-3 h-3"/>} 
                        {selectedVisit.screening.dataTambahan?.riwayat?.riwayatAlergi || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-600">Riwayat Penyakit Dahulu</span>
                      <span className="font-bold text-slate-900 text-right max-w-[60%]">{selectedVisit.screening.dataTambahan?.riwayat?.riwayatPenyakitDahulu || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-600">Riwayat Operasi/Rawat Inap</span>
                      <span className="font-bold text-slate-900 text-right max-w-[60%]">{selectedVisit.screening.dataTambahan?.riwayat?.riwayatOperasi || selectedVisit.screening.dataTambahan?.riwayat?.riwayatRawatInap || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Catatan */}
                {selectedVisit.screening.catatanPetugas && (
                  <div>
                    <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Catatan Tambahan Perawat</p>
                    <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
                      <p className="text-sm font-semibold text-yellow-900 italic">
                        "{selectedVisit.screening.catatanPetugas}"
                      </p>
                      <p className="text-[10px] text-yellow-700 font-bold mt-2 text-right">Oleh: Perawat</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p className="font-medium text-sm">Data skrining perawat tidak tersedia untuk kunjungan ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KOLOM KANAN: PEMERIKSAAN DOKTER */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* KOTAK SOAP BESAR */}
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-blue-900 border-b border-blue-950 px-5 py-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-300" /> Hasil Pemeriksaan Dokter (SOAP)
            </h3>
          </div>
          
          <div className="p-5 space-y-4 bg-slate-50">
            {selectedVisit.rekamMedis ? (
              <>
                {/* Kotak S */}
                <div className="bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row">
                  <div className="md:w-16 bg-blue-100 border-b md:border-b-0 md:border-r border-blue-200 flex items-center justify-center p-3">
                    <span className="text-2xl font-black text-blue-700">S</span>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Subjektif (Anamnesis Tambahan)</h4>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">{selectedVisit.rekamMedis.keluhanUtama || '-'}</p>
                    
                    {selectedVisit.rekamMedis.riwayatPenyakitSekarang && (
                       <div className="mt-3">
                         <span className="text-xs font-semibold text-slate-600">RPS: </span>
                         <span className="text-sm text-slate-800">{selectedVisit.rekamMedis.riwayatPenyakitSekarang}</span>
                       </div>
                    )}
                  </div>
                </div>

                {/* Kotak O */}
                <div className="bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row">
                  <div className="md:w-16 bg-blue-100 border-b md:border-b-0 md:border-r border-blue-200 flex items-center justify-center p-3">
                    <span className="text-2xl font-black text-blue-700">O</span>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Objektif (Pemeriksaan Fisik)</h4>
                    {selectedVisit.rekamMedis.keadaanUmum && (
                       <div className="mb-2">
                         <span className="text-xs font-semibold text-slate-600">Keadaan Umum: </span>
                         <span className="text-sm font-bold text-slate-900">{selectedVisit.rekamMedis.keadaanUmum} (Kesadaran: {selectedVisit.rekamMedis.kesadaran || '-'})</span>
                       </div>
                    )}
                    <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">{selectedVisit.rekamMedis.pemeriksaanFisik || '-'}</p>
                    {selectedVisit.rekamMedis.fotoObjektif && Array.isArray(selectedVisit.rekamMedis.fotoObjektif) && selectedVisit.rekamMedis.fotoObjektif.length > 0 && (
                      <FotoObjektifViewer fotoList={selectedVisit.rekamMedis.fotoObjektif} />
                    )}
                  </div>
                </div>

                {/* Kotak A */}
                <div className="bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row">
                  <div className="md:w-16 bg-blue-100 border-b md:border-b-0 md:border-r border-blue-200 flex items-center justify-center p-3">
                    <span className="text-2xl font-black text-blue-700">A</span>
                  </div>
                  <div className="p-4 flex-1 bg-blue-50/30">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Asesmen (Diagnosis Klinis)</h4>
                    <p className="text-lg font-black text-slate-900 leading-snug whitespace-pre-wrap">{selectedVisit.rekamMedis.diagnosisKlinis || '-'}</p>
                  </div>
                </div>

                {/* Kotak P */}
                <div className="bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row">
                  <div className="md:w-16 bg-blue-100 border-b md:border-b-0 md:border-r border-blue-200 flex items-center justify-center p-3">
                    <span className="text-2xl font-black text-blue-700">P</span>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Plan (Rencana Terapi & Tindakan)</h4>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">{selectedVisit.rekamMedis.rencanaTerapi || '-'}</p>
                    {selectedVisit.rekamMedis.instruksiMedis && (
                       <div className="mt-3 bg-yellow-50 p-2 border-l-2 border-yellow-400">
                         <span className="text-xs font-semibold text-yellow-800">Instruksi Medis: </span>
                         <span className="text-sm text-yellow-900 italic">{selectedVisit.rekamMedis.instruksiMedis}</span>
                       </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p className="font-medium text-sm">Rekam medis (SOAP) belum diisi oleh dokter.</p>
              </div>
            )}
          </div>
        </div>

        {/* CATATAN PERKEMBANGAN PASIEN TERINTEGRASI (CPPT RAWAT INAP) */}
        {selectedVisit.catatanPerkembangans && selectedVisit.catatanPerkembangans.length > 0 && (
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Catatan Perkembangan Pasien Terintegrasi (CPPT Rawat Inap)
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5">
                {selectedVisit.catatanPerkembangans.length} Catatan Perkembangan
              </span>
            </div>
            <div className="p-5 space-y-4 bg-slate-50">
              {selectedVisit.catatanPerkembangans.map((cppt: any, idx: number) => (
                <div key={cppt.id || idx} className="bg-white border border-slate-200 border-l-4 border-l-blue-600 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-700">
                      📅 {new Date(cppt.tanggalCatatan || cppt.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${cppt.profesi === 'DOKTER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {cppt.profesi}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {cppt.petugas?.namaLengkap || 'Tenaga Medis'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {cppt.subjektif && (
                      <div className="bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1">Subjektif (S):</span>
                        <p className="text-slate-700 leading-relaxed italic">{cppt.subjektif}</p>
                      </div>
                    )}
                    {cppt.objektif && (
                      <div className="bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1">Objektif (O):</span>
                        <p className="text-slate-700 leading-relaxed">{cppt.objektif}</p>
                      </div>
                    )}
                    {cppt.asesmen && (
                      <div className="bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1">Asesmen (A):</span>
                        <p className="text-slate-800 font-semibold">{cppt.asesmen}</p>
                      </div>
                    )}
                    {cppt.plan && (
                      <div className="bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1">Plan (P):</span>
                        <p className="text-slate-700">{cppt.plan}</p>
                      </div>
                    )}
                  </div>
                  {cppt.instruksiMedis && (
                    <div className="mt-3 bg-amber-50 p-2.5 border-l-2 border-amber-400 text-xs text-amber-900">
                      <span className="font-bold">Instruksi Medis: </span>
                      <span className="italic">{cppt.instruksiMedis}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIAGNOSIS ICD & TINDAKAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box ICD-10 */}
          <div className="bg-white border border-slate-300 shadow-sm h-full flex flex-col">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">Diagnosis (ICD-10)</h3>
            </div>

            <div className="p-4 flex-1 bg-slate-50 space-y-3">
              {selectedVisit.diagnosis && selectedVisit.diagnosis.length > 0 ? (
                selectedVisit.diagnosis.map((d: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-300 p-3 shadow-sm flex items-start gap-3">
                    <div className="bg-slate-800 text-white font-mono font-bold text-xs px-2 py-1 flex-shrink-0">
                      {d.icd10?.kode_icd10 || 'Unknown'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{d.icd10?.nama_diagnosis || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Status: {d.jenisDiagnosis}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-dashed border-slate-300 p-4 text-center h-full flex items-center justify-center">
                  <p className="text-sm font-medium text-slate-400">Tidak ada diagnosa ICD-10</p>
                </div>
              )}
            </div>
          </div>

          {/* Box ICD-9 */}
          <div className="bg-white border border-slate-300 shadow-sm h-full flex flex-col">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">Tindakan (ICD-9)</h3>
            </div>
            <div className="p-4 flex-1 bg-slate-50 space-y-3">
              {selectedVisit.tindakans && selectedVisit.tindakans.length > 0 ? (
                selectedVisit.tindakans.map((t: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-300 p-3 shadow-sm flex items-start gap-3">
                    <div className="bg-slate-800 text-white font-mono font-bold text-xs px-2 py-1 flex-shrink-0">
                      {t.icd9?.kode_icd9 || 'Unknown'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{t.icd9?.nama_prosedur || 'Unknown'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-dashed border-slate-300 p-4 text-center h-full flex items-center justify-center">
                  <p className="text-sm font-medium text-slate-400">Tidak ada tindakan ICD-9</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOTAK E-RESEP */}
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-emerald-800 border-b border-emerald-900 px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-300" /> E-Resep Farmasi
            </h3>
            {selectedVisit.resep?.[0]?.status && (
              <span className="text-[10px] font-black text-emerald-900 bg-emerald-400 px-2 py-1 uppercase tracking-widest shadow-sm">
                {selectedVisit.resep[0].status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="overflow-x-auto min-h-[100px]">
            {selectedVisit.resep?.[0]?.details && selectedVisit.resep[0].details.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100">
                    <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Nama Obat</th>
                    <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px] text-center w-24">Jml</th>
                    <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Aturan Pakai</th>
                    <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {selectedVisit.resep[0].details.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-black text-slate-900">{r.obat?.namaObat || 'Unknown Obat'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-mono font-bold bg-slate-800 text-white px-2 py-1 text-xs">
                          {r.jumlah}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-700">{r.aturanPakai}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{r.catatan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-400 border-t border-slate-100">
                 <Pill className="w-8 h-8 mb-2 opacity-50" />
                 <p className="text-sm font-medium">Tidak ada resep obat untuk kunjungan ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* KOTAK LABORATORIUM */}
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-cyan-800 border-b border-cyan-900 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <TestTube2 className="w-4 h-4 text-cyan-300" /> Hasil Laboratorium
              </h3>
            </div>
            {selectedVisit.orderLab && (
              <button 
                onClick={() => setShowLabSurat(true)}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 border border-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Lihat Surat Lab
              </button>
            )}
          </div>
          <div className="overflow-x-auto min-h-[100px]">
            {selectedVisit.orderLab?.details && selectedVisit.orderLab.details.length > 0 ? (
              <div className="p-0">
                {selectedVisit.orderLab.catatanKlinis && (
                  <div className="p-4 bg-cyan-50 border-b border-cyan-100 text-sm">
                    <span className="font-bold text-cyan-800">Catatan Klinis:</span>
                    <p className="text-cyan-900 mt-1">{selectedVisit.orderLab.catatanKlinis}</p>
                  </div>
                )}
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100">
                      <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Parameter Uji</th>
                      <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Hasil</th>
                      <th className="px-5 py-3 font-bold text-slate-600 uppercase text-[10px]">Nilai Rujukan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedVisit.orderLab.details.map((lab: any, i: number) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${lab.kritis ? 'bg-red-50/50' : ''}`}>
                        <td className="px-5 py-3 font-black text-slate-900">{lab.parameter}</td>
                        <td className="px-5 py-3">
                          {lab.hasil ? (
                            <span className={`font-mono font-bold px-2 py-1 text-xs ${lab.kritis ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
                              {lab.hasil} {lab.satuan}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Menunggu Hasil</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{lab.nilaiRujukan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-400 border-t border-slate-100">
                 <TestTube2 className="w-8 h-8 mb-2 opacity-50" />
                 <p className="text-sm font-medium">Tidak ada rujukan laboratorium untuk kunjungan ini.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
