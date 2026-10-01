import React, { forwardRef } from 'react';


interface CetakHasilLabProps {
  data: any; // OrderLab beserta relasinya (pasien, dokter, details)
}

export const CetakHasilLab = forwardRef<HTMLDivElement, CetakHasilLabProps>(({ data }, ref) => {
  if (!data) return null;

  const { pasien, dokter, details, tanggalOrder, id } = data;

  // Formatting date and age
  const tglLahir = new Date(pasien?.tanggalLahir);
  const now = new Date();
  const ageYears = now.getFullYear() - tglLahir.getFullYear();
  const ageMonths = now.getMonth() - tglLahir.getMonth();
  const displayAge = ageMonths < 0 
    ? `${ageYears - 1} Tahun ${12 + ageMonths} Bulan`
    : `${ageYears} Tahun ${ageMonths} Bulan`;

  return (
    <div 
      ref={ref} 
      className="bg-white w-[210mm] min-h-[297mm] mx-auto text-black p-0 shadow-lg print:shadow-none print:w-full print:h-auto overflow-hidden relative font-sans text-[11pt]"
      style={{ boxSizing: 'border-box' }}
    >
      {/* ── HEADER KOP SURAT (MIRIP TEMPLATE KUNING) ── */}
      <div className="relative overflow-hidden pt-8 pb-10 px-10">
        {/* Latar Belakang Lengkung Kuning */}
        <div 
          className="absolute top-0 left-0 w-[150%] h-48 bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400"
          style={{
            borderBottomLeftRadius: '50% 15%',
            borderBottomRightRadius: '50% 30%',
            transform: 'translateX(-10%)'
          }}
        ></div>

        {/* Konten Header */}
        <div className="relative z-10 flex justify-between items-start">
          {/* Kiri: Logo & Nama Klinik */}
          <div className="flex items-center gap-4">
            {/* Dummy Logo Lingkaran */}
            <div className="w-16 h-16 border-4 border-black rounded-full flex flex-col justify-center items-center font-black leading-none bg-white">
              <span className="text-xl">KLINIK</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">Laboratorium Klinik</p>
              <h1 className="text-4xl font-serif italic font-black">SIAP-KES Laboratorium</h1>
            </div>
          </div>

          {/* Kanan: Alamat & Kontak */}
          <div className="text-right text-[9pt] leading-tight mt-2">
            <p className="font-semibold">Jl. Ardipura, Ruko Polimak No.20-21,</p>
            <p className="font-semibold">Kelurahan Ardipura, Jayapura</p>
            <p>Telp. : 0967-5162008</p>
            <p>Faks : 0967-5162008</p>
            
            <div className="mt-4">
              <p className="italic">Penanggung Jawab :</p>
              <p className="font-bold">dr. Juliwati, SpPK</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-12 py-6">
        {/* ── INFO DOKTER & PASIEN ── */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-[10pt]">
          {/* Kolom Kiri Keterangan */}
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-24 py-0.5">Dokter</td>
                  <td className="w-4 text-center">:</td>
                  <td className="font-bold">{dokter?.namaLengkap}</td>
                </tr>
                <tr>
                  <td className="w-24 py-0.5 align-top">Alamat</td>
                  <td className="w-4 text-center align-top">:</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div></div>

          {/* Kolom Detail Pasien (Bawah) Kiri */}
          <div className="mt-4">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-24 py-0.5">No.Lab/Tgl.</td>
                  <td className="w-4 text-center">:</td>
                  <td>{id?.slice(-8).toUpperCase()} / {new Date(tanggalOrder).toLocaleDateString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="w-24 py-0.5">ID Pasien</td>
                  <td className="w-4 text-center">:</td>
                  <td>{pasien?.noRM}</td>
                </tr>
                <tr>
                  <td className="w-24 py-0.5">Nama Pasien</td>
                  <td className="w-4 text-center">:</td>
                  <td className="font-bold">{pasien?.namaLengkap}</td>
                </tr>
                <tr>
                  <td className="w-24 py-0.5 align-top">Alamat</td>
                  <td className="w-4 text-center align-top">:</td>
                  <td className="leading-snug">{pasien?.alamat || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom Detail Pasien Kanan */}
          <div className="mt-4">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-28 py-0.5">Jenis Kelamin</td>
                  <td className="w-4 text-center">:</td>
                  <td>{pasien?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                </tr>
                <tr>
                  <td className="w-28 py-0.5">Tgl.Lahir/Umur</td>
                  <td className="w-4 text-center">:</td>
                  <td>{new Date(pasien?.tanggalLahir).toLocaleDateString('id-ID')} / {displayAge}</td>
                </tr>
                <tr>
                  <td className="w-28 py-0.5">Telepon</td>
                  <td className="w-4 text-center">:</td>
                  <td>{pasien?.nomorTelepon || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TABEL HASIL LAB ── */}
        <div className="border-t-[3px] border-black mt-2 pt-1 pb-1 border-b border-black mb-4">
          <table className="w-full text-[10pt]">
            <thead>
              <tr className="font-bold text-left">
                <th className="py-1 w-1/3">Nama Pemeriksaan</th>
                <th className="py-1 w-1/4 text-center">Hasil</th>
                <th className="py-1 w-1/4 text-center">Nilai Rujukan Satuan</th>
                <th className="py-1 w-1/6">Keterangan</th>
              </tr>
            </thead>
          </table>
        </div>

        <table className="w-full text-[10pt] mb-8">
          <tbody>
            {/* Group Header Contoh (IMUNO SEROLOGI) */}
            <tr>
              <td colSpan={4} className="font-bold py-2">HASIL PEMERIKSAAN</td>
            </tr>

            {details?.map((item: any, index: number) => (
              <tr key={item.id || index}>
                <td className="py-1.5 pl-4 w-1/3">{item.parameter}</td>
                <td className="py-1.5 w-1/4 text-center">
                  <span className={item.kritis ? 'font-bold' : ''}>
                    {item.hasil || '-'}
                  </span>
                  {item.kritis && <span className="ml-1 text-[8pt] font-bold">(*)</span>}
                </td>
                <td className="py-1.5 w-1/4 text-center">{item.nilaiRujukan || '-'} {item.satuan}</td>
                <td className="py-1.5 w-1/6 text-xs">{item.kritis ? 'Abnormal' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Saran / Catatan */}
        {data.catatanKlinis && (
          <div className="flex gap-4 mt-12 text-[10pt]">
            <div className="w-24">Catatan Klinis:</div>
            <div className="flex-1">
              <p className="italic text-gray-700">{data.catatanKlinis}</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 mt-8 text-[10pt]">
          <div className="w-24">Saran :</div>
          <div className="flex-1">
            <p>Hasil pemeriksaan harus dikorelasikan dengan kondisi klinis, faktor risiko dan hasil laboratorium lainnya.</p>
          </div>
        </div>

      </div>

      {/* FOOTER HALAMAN */}
      <div className="absolute bottom-10 w-full px-12 text-center text-[8pt] text-gray-500">
        <p>Dokumen ini dicetak secara otomatis oleh sistem Rekam Medis Elektronik (RME) SIAP-KES.</p>
      </div>

    </div>
  );
});

CetakHasilLab.displayName = 'CetakHasilLab';
