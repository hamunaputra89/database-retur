export interface ResiRecord {
  id: string;
  tanggal: string;
  resiRetur: string;
  dn: string;
  resiOriginal: string;
  sku: string;
  imei: string;
  sloc: string;
  docSanggahan: string;
  updateCase: string;
  keterangan: string;
  docHandover: string;
  noHo: string;
  linkVideoSanggahan: string;
  status: string;
  namaPacker: string;
  statusPrint: string;
  tglJamPacking: string;
  catatan: string;
}

export type SearchScope = 'all_resi' | 'original' | 'retur' | 'dn_imei';

export interface SearchStats {
  totalRecords: number;
  totalWithRetur: number;
  totalWithOriginal: number;
  totalIssues: number;
}
