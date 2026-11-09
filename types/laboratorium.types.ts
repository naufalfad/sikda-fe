export interface OrderLaboratoriumItemInput {
  parameter: string;
  isRujukanLuar?: boolean;
  faskesTujuan?: string;
  metodeRujukan?: string;
}

export interface OrderLaboratoriumPayload {
  kunjunganId: string;
  pasienId: string;
  dokterId?: string;
  catatanKlinis: string;
  tests: (string | OrderLaboratoriumItemInput)[];
  faskesTujuan?: string;
  metodeRujukan?: 'KIRIM_PASIEN' | 'KIRIM_SPESIMEN';
}

export interface OrderLaboratoriumDetail {
  id: string;
  orderId: string;
  parameter: string;
  hasil?: string;
  satuan?: string;
  nilaiRujukan?: string;
  kritis: boolean;
  isRujukanLuar?: boolean;
  faskesTujuan?: string;
  metodeRujukan?: string;
}

export interface OrderLaboratorium {
  id: string;
  kunjunganId: string;
  pasienId: string;
  dokterId: string;
  status: string;
  catatanKlinis?: string;
  tanggalOrder: string;
  details: OrderLaboratoriumDetail[];
}
