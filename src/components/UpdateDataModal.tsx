import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  PlusCircle,
  RotateCcw,
  Download,
  Check,
  AlertCircle,
  Database,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Copy,
  Info
} from 'lucide-react';
import type { ResiRecord } from '../types';

interface UpdateDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: ResiRecord[];
  onUpdateDatabase: (newRecords: ResiRecord[], isMerge?: boolean) => void;
  onResetDefault: () => void;
}

export function convertSheetUrlToCsvUrl(url: string): { csvUrl: string; sheetId?: string; gid?: string } {
  const trimmed = url.trim();
  if (trimmed.includes('output=csv') || trimmed.includes('/export?format=csv')) {
    return { csvUrl: trimmed };
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }
    return {
      csvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      sheetId,
      gid,
    };
  }

  return { csvUrl: trimmed };
}

export const UpdateDataModal: React.FC<UpdateDataModalProps> = ({
  isOpen,
  onClose,
  currentRecords,
  onUpdateDatabase,
  onResetDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'upload' | 'paste' | 'manual'>('link');
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchErrorDetails, setFetchErrorDetails] = useState<string | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ResiRecord[]>([]);
  const [parseStatus, setParseStatus] = useState<{
    success?: boolean;
    message?: string;
    count?: number;
    preview?: ResiRecord[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  // Manual record form state
  const [manualRecord, setManualRecord] = useState<Partial<ResiRecord>>({
    resiOriginal: '',
    resiRetur: '',
    dn: '',
    sku: '',
    imei: '',
    sloc: '',
    updateCase: '',
    keterangan: '',
    docHandover: '',
    noHo: '',
    docSanggahan: '',
    linkVideoSanggahan: '',
    status: 'done',
    namaPacker: '',
    statusPrint: 'Success',
    tglJamPacking: '',
    catatan: '',
    tanggal: new Date().toLocaleDateString('id-ID'),
  });

  if (!isOpen) return null;

  // Intelligent parser for delimited text (CSV or TSV / Tab-Separated)
  const parseDelimitedText = (text: string): ResiRecord[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');
    const separator = isTab ? '\t' : ',';

    const parsedRows: string[][] = [];

    for (const line of lines) {
      if (isTab) {
        parsedRows.push(line.split('\t').map((c) => c.trim()));
      } else {
        const cells: string[] = [];
        let curr = '';
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            insideQuotes = !insideQuotes;
          } else if (ch === separator && !insideQuotes) {
            cells.push(curr.trim());
            curr = '';
          } else {
            curr += ch;
          }
        }
        cells.push(curr.trim());
        parsedRows.push(cells);
      }
    }

    if (parsedRows.length === 0) return [];

    // Inspect headers
    const headerRow = parsedRows[0].map((h) => h.toLowerCase().trim());
    const isHeader = headerRow.some((h) =>
      h.includes('resi') ||
      h.includes('tanggal') ||
      h.includes('original') ||
      h.includes('retur') ||
      h.includes('dn') ||
      h.includes('sku') ||
      h.includes('imei') ||
      h.includes('sanggahan') ||
      h.includes('packer') ||
      h.includes('noted') ||
      h.includes('catatan')
    );

    let startIdx = 0;
    const colMap = {
      tanggal: 0,
      resiRetur: 1,
      dn: 2,
      resiOriginal: 3,
      sku: 4,
      imei: 5,
      sloc: 6,
      docSanggahan: 7,
      updateCase: 8,
      keterangan: 9,
      docHandover: 10,
      noHo: 11,
      linkVideoSanggahan: 12,
      status: 13,
      namaPacker: 14,
      statusPrint: 15,
      tglJamPacking: 16,
      catatan: 17,
    };

    if (isHeader) {
      startIdx = 1;
      const dynamicMap = {
        tanggal: -1,
        resiRetur: -1,
        dn: -1,
        resiOriginal: -1,
        sku: -1,
        imei: -1,
        sloc: -1,
        docSanggahan: -1,
        updateCase: -1,
        keterangan: -1,
        docHandover: -1,
        noHo: -1,
        linkVideoSanggahan: -1,
        status: -1,
        namaPacker: -1,
        statusPrint: -1,
        tglJamPacking: -1,
        catatan: -1,
      };

      headerRow.forEach((col, idx) => {
        // Noted apa kee / Catatan
        if (
          col.includes('noted') ||
          col.includes('catatan') ||
          col.includes('note')
        ) {
          if (dynamicMap.catatan === -1) dynamicMap.catatan = idx;
        }
        // Resi Retur
        else if (col.includes('retur')) {
          if (dynamicMap.resiRetur === -1) dynamicMap.resiRetur = idx;
        }
        // Resi Original
        else if (col.includes('original') || (col.includes('resi') && !col.includes('retur'))) {
          if (dynamicMap.resiOriginal === -1) dynamicMap.resiOriginal = idx;
        }
        // DN
        else if (col.includes('dn') || col.includes('delivery')) {
          if (dynamicMap.dn === -1) dynamicMap.dn = idx;
        }
        // SKU
        else if (col.includes('sku') || col.includes('material') || col.includes('item') || col.includes('barang')) {
          if (dynamicMap.sku === -1) dynamicMap.sku = idx;
        }
        // IMEI / SN
        else if (col.includes('imei') || col.includes('sn') || col.includes('serial')) {
          if (dynamicMap.imei === -1) dynamicMap.imei = idx;
        }
        // Sloc
        else if (col.includes('sloc') || col.includes('storage') || col.includes('lokasi')) {
          if (dynamicMap.sloc === -1) dynamicMap.sloc = idx;
        }
        // Doc Sanggahan
        else if (col.includes('doc sanggahan') || col.includes('dokumen sanggahan') || col.includes('sanggahan')) {
          if (dynamicMap.docSanggahan === -1) dynamicMap.docSanggahan = idx;
          if (dynamicMap.linkVideoSanggahan === -1) dynamicMap.linkVideoSanggahan = idx;
        }
        // Video Sanggahan
        else if (col.includes('video')) {
          if (dynamicMap.linkVideoSanggahan === -1) dynamicMap.linkVideoSanggahan = idx;
          if (dynamicMap.docSanggahan === -1) dynamicMap.docSanggahan = idx;
        }
        // Update Case
        else if (col.includes('case') || col.includes('kasus') || col.includes('kendala') || col.includes('masalah')) {
          if (dynamicMap.updateCase === -1) dynamicMap.updateCase = idx;
        }
        // Keterangan
        else if (col.includes('keterangan') || col.includes('ket')) {
          if (dynamicMap.keterangan === -1) dynamicMap.keterangan = idx;
        }
        // Doc Handover
        else if (col.includes('handover') || col === 'ho' || col.includes('doc ho')) {
          if (dynamicMap.docHandover === -1) dynamicMap.docHandover = idx;
        }
        // No HO
        else if (col.includes('no ho') || col.includes('nomor ho') || col.includes('no. ho')) {
          if (dynamicMap.noHo === -1) dynamicMap.noHo = idx;
        }
        // Packer
        else if (col.includes('packer') || col.includes('petugas')) {
          if (dynamicMap.namaPacker === -1) dynamicMap.namaPacker = idx;
        }
        // Status Print
        else if (col.includes('print')) {
          if (dynamicMap.statusPrint === -1) dynamicMap.statusPrint = idx;
        }
        // Packing time
        else if (col.includes('jam packing') || col.includes('tgl & jam') || col.includes('packing date')) {
          if (dynamicMap.tglJamPacking === -1) dynamicMap.tglJamPacking = idx;
        }
        // Status
        else if (col.includes('status') && !col.includes('print')) {
          if (dynamicMap.status === -1) dynamicMap.status = idx;
        }
        // Tanggal
        else if (col.includes('tanggal') || col.includes('tgl') || col.includes('date')) {
          if (dynamicMap.tanggal === -1) dynamicMap.tanggal = idx;
        }
      });

      // Apply dynamic mapping for mapped keys
      Object.keys(colMap).forEach((key) => {
        const k = key as keyof typeof colMap;
        if (dynamicMap[k] !== -1) {
          colMap[k] = dynamicMap[k];
        }
      });
    }

    const records: ResiRecord[] = [];
    const timestamp = Date.now();

    for (let i = startIdx; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (row.length === 0 || row.every((c) => !c)) continue;

      const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

      const orig = getVal(colMap.resiOriginal);
      const retur = getVal(colMap.resiRetur);
      const dn = getVal(colMap.dn);

      if (!orig && !retur && !dn) continue;

      const docVal = getVal(colMap.docSanggahan) || getVal(colMap.linkVideoSanggahan);

      records.push({
        id: `rec-upd-${timestamp}-${i}`,
        tanggal: getVal(colMap.tanggal) || new Date().toLocaleDateString('id-ID'),
        resiRetur: retur,
        dn: dn || 'Tidak ditemukan',
        resiOriginal: orig || 'Tidak ditemukan',
        sku: getVal(colMap.sku) || 'Tidak ditemukan',
        imei: getVal(colMap.imei) || 'Tidak ditemukan',
        sloc: getVal(colMap.sloc) || 'Tidak ditemukan',
        docSanggahan: docVal,
        updateCase: getVal(colMap.updateCase),
        keterangan: getVal(colMap.keterangan),
        docHandover: getVal(colMap.docHandover) || 'Tidak ditemukan',
        noHo: getVal(colMap.noHo),
        linkVideoSanggahan: docVal,
        status: getVal(colMap.status) || 'done',
        namaPacker: getVal(colMap.namaPacker) || 'Tidak ditemukan',
        statusPrint: getVal(colMap.statusPrint) || 'Tidak ditemukan',
        tglJamPacking: getVal(colMap.tglJamPacking) || 'Tidak ditemukan',
        catatan: getVal(colMap.catatan),
      });
    }

    return records;
  };

  // Handle URL fetch (Google Sheets CSV Export or direct URL)
  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setIsFetchingUrl(true);
    setFetchErrorDetails(null);
    setParseStatus(null);

    const { csvUrl } = convertSheetUrlToCsvUrl(sheetUrl);

    try {
      const res = await fetch(csvUrl, { mode: 'cors' });
      if (!res.ok) {
        throw new Error(`Server merespons status ${res.status}: ${res.statusText}`);
      }
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Data yang diterima kosong');
      }

      const parsed = parseDelimitedText(text);
      if (parsed.length === 0) {
        setParseStatus({
          success: false,
          message: 'Tautan dapat diakses, namun tidak ada baris data resi yang valid ditemukan.',
        });
      } else {
        setParsedRecords(parsed);
        setParseStatus({
          success: true,
          count: parsed.length,
          message: `Berhasil mengambil ${parsed.length} baris data dari link spreadsheet!`,
          preview: parsed.slice(0, 3),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchErrorDetails(msg);
      setParseStatus({
        success: false,
        message: 'Tidak dapat mengunduh data langsung dari link (kemungkinan dibatasi oleh kebijakan akses/CORS Google Sheets).',
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParseStatus({ success: false, message: 'File kosong atau tidak dapat dibaca.' });
        return;
      }
      try {
        const parsed = parseDelimitedText(text);
        if (parsed.length === 0) {
          setParseStatus({ success: false, message: 'Tidak ada baris data yang berhasil terbaca.' });
        } else {
          setParsedRecords(parsed);
          setParseStatus({
            success: true,
            message: `Berhasil memproses ${parsed.length} baris data dari "${file.name}"`,
            count: parsed.length,
            preview: parsed.slice(0, 3),
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setParseStatus({ success: false, message: `Gagal membaca CSV: ${errorMsg}` });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (parsedRecords.length === 0) return;
    onUpdateDatabase(parsedRecords, importMode === 'merge');
    onClose();
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRecord.resiOriginal && !manualRecord.resiRetur) {
      alert('Mohon isi minimal salah satu Resi Original atau Resi Retur!');
      return;
    }

    const newRecord: ResiRecord = {
      id: `manual-${Date.now()}`,
      tanggal: manualRecord.tanggal || new Date().toLocaleDateString('id-ID'),
      resiRetur: manualRecord.resiRetur || '',
      dn: manualRecord.dn || '',
      resiOriginal: manualRecord.resiOriginal || '',
      sku: manualRecord.sku || '',
      imei: manualRecord.imei || '',
      sloc: manualRecord.sloc || '',
      docSanggahan: manualRecord.docSanggahan || '',
      updateCase: manualRecord.updateCase || '',
      keterangan: manualRecord.keterangan || '',
      docHandover: manualRecord.docHandover || '',
      noHo: manualRecord.noHo || '',
      linkVideoSanggahan: manualRecord.linkVideoSanggahan || '',
      status: manualRecord.status || 'done',
      namaPacker: manualRecord.namaPacker || '',
      statusPrint: manualRecord.statusPrint || 'Success',
      tglJamPacking: manualRecord.tglJamPacking || '',
      catatan: manualRecord.catatan || '',
    };

    onUpdateDatabase([newRecord], true);
    alert('1 Data Resi baru berhasil ditambahkan ke database!');
    onClose();
  };

  // Export current database to CSV
  const handleExportCSV = () => {
    const headers = [
      'Tanggal',
      'Resi Retur',
      'DN',
      'Resi Original',
      'SKU',
      'IMEI',
      'Sloc',
      'Doc Sanggahan',
      'Update Case',
      'KETERANGAN',
      'Doc Handover',
      'NO HO',
      'Link Video Sanggahan',
      'Status',
      'Nama Packer',
      'Status Print',
      'Tgl & Jam Packing',
      'catatan',
    ];

    const rows = currentRecords.map((r) => [
      `"${(r.tanggal || '').replace(/"/g, '""')}"`,
      `"${(r.resiRetur || '').replace(/"/g, '""')}"`,
      `"${(r.dn || '').replace(/"/g, '""')}"`,
      `"${(r.resiOriginal || '').replace(/"/g, '""')}"`,
      `"${(r.sku || '').replace(/"/g, '""')}"`,
      `"${(r.imei || '').replace(/"/g, '""')}"`,
      `"${(r.sloc || '').replace(/"/g, '""')}"`,
      `"${(r.docSanggahan || '').replace(/"/g, '""')}"`,
      `"${(r.updateCase || '').replace(/"/g, '""')}"`,
      `"${(r.keterangan || '').replace(/"/g, '""')}"`,
      `"${(r.docHandover || '').replace(/"/g, '""')}"`,
      `"${(r.noHo || '').replace(/"/g, '""')}"`,
      `"${(r.linkVideoSanggahan || '').replace(/"/g, '""')}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${(r.namaPacker || '').replace(/"/g, '""')}"`,
      `"${(r.statusPrint || '').replace(/"/g, '""')}"`,
      `"${(r.tglJamPacking || '').replace(/"/g, '""')}"`,
      `"${(r.catatan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `database_resi_retur_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="update-data-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="update-data-modal-card"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Perbarui / Sinkronisasi Database Resi</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-emerald-300 border border-slate-700">
                  {currentRecords.length} Data Saat Ini
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Impor dari link Google Sheets, upload file CSV, tempel data tabel, atau tambah data baru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('link');
              setParseStatus(null);
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link Google Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setParseStatus(null);
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('paste');
              setParseStatus(null);
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tempel Teks (Excel / Sheets)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setParseStatus(null);
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah 1 Resi Manual</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Link Google Sheets / CSV URL */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <form onSubmit={handleFetchUrl} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Tautan Google Spreadsheet atau Direct Link CSV:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                    required
                    className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isFetchingUrl}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {isFetchingUrl ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengambil Data...</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Ambil Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Status and Fallback Guidance if CORS or Private Sheet */}
              {parseStatus && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    parseStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {parseStatus.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{parseStatus.message}</span>
                  </div>
                </div>
              )}

              {/* Helpful Instructions when link requires manual paste or permissions */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-blue-900">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Petunjuk Sinkronisasi dari Google Sheets:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    <strong>Metode Cepat (Salin & Tempel)</strong>: Buka Google Sheets Anda, tekan{' '}
                    <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+A</kbd> lalu{' '}
                    <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+C</kbd>, kemudian buka tab{' '}
                    <strong>Tempel Teks</strong> di atas dan tekan{' '}
                    <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+V</kbd>.
                  </li>
                  <li>
                    <strong>Metode File CSV</strong>: Di Google Sheets, pilih menu{' '}
                    <strong>File &gt; Download &gt; Comma Separated Values (.csv)</strong>, lalu drag ke tab{' '}
                    <strong>Upload File CSV</strong>.
                  </li>
                  <li>
                    Kolom catatan seperti <em>Noted apa kee</em> atau <em>Catatan</em> akan otomatis dipetakan ke kolom Catatan.
                  </li>
                </ul>

                {sheetUrl && (
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-semibold text-blue-700 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Google Sheet di Tab Baru</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Upload File CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">
                  Tarik & lepas file CSV di sini, atau klik untuk memilih file
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format file: .csv (mendukung file ekspor dari Google Sheets & Excel)
                </p>
                <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
                  <span>Pilih File CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {parseStatus && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    parseStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {parseStatus.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{parseStatus.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Data */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Salin & Tempel Baris dari Microsoft Excel atau Google Spreadsheet:
              </label>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => {
                  const val = e.target.value;
                  setPasteText(val);
                  try {
                    const parsed = parseDelimitedText(val);
                    if (parsed.length > 0) {
                      setParsedRecords(parsed);
                      setParseStatus({
                        success: true,
                        count: parsed.length,
                        message: `Terdeteksi ${parsed.length} baris data resi siap diperbarui`,
                        preview: parsed.slice(0, 3),
                      });
                    } else {
                      setParsedRecords([]);
                      setParseStatus(null);
                    }
                  } catch {
                    setParsedRecords([]);
                  }
                }}
                placeholder="Paste baris data tabel di sini... (otomatis mendeteksi pemisah tab atau koma dan memetakan kolom seperti Resi, DN, Noted apa kee, dll.)"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />

              {parseStatus?.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Siap mengimpor <strong>{parseStatus.count}</strong> baris data resi.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Manual Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManualRecord} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Resi Original <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualRecord.resiOriginal}
                    onChange={(e) => setManualRecord({ ...manualRecord, resiOriginal: e.target.value })}
                    placeholder="Contoh: JX3929722651"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resi Retur</label>
                  <input
                    type="text"
                    value={manualRecord.resiRetur}
                    onChange={(e) => setManualRecord({ ...manualRecord, resiRetur: e.target.value })}
                    placeholder="Contoh: RTCGK26075459345"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor DN</label>
                  <input
                    type="text"
                    value={manualRecord.dn}
                    onChange={(e) => setManualRecord({ ...manualRecord, dn: e.target.value })}
                    placeholder="Contoh: 4177366304"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Barang</label>
                  <input
                    type="text"
                    value={manualRecord.sku}
                    onChange={(e) => setManualRecord({ ...manualRecord, sku: e.target.value })}
                    placeholder="Contoh: X6887-BLU-256/8"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IMEI / SN</label>
                  <input
                    type="text"
                    value={manualRecord.imei}
                    onChange={(e) => setManualRecord({ ...manualRecord, imei: e.target.value })}
                    placeholder="Contoh: 357059530965370"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Update Case / Kendala</label>
                  <input
                    type="text"
                    value={manualRecord.updateCase}
                    onChange={(e) => setManualRecord({ ...manualRecord, updateCase: e.target.value })}
                    placeholder="Contoh: (Isi Tidak Sesuai), Box Rusak..."
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Packer</label>
                  <input
                    type="text"
                    value={manualRecord.namaPacker}
                    onChange={(e) => setManualRecord({ ...manualRecord, namaPacker: e.target.value })}
                    placeholder="Nama petugas packer"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doc Sanggahan (Link / File)</label>
                  <input
                    type="text"
                    value={manualRecord.docSanggahan || manualRecord.linkVideoSanggahan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualRecord({ ...manualRecord, docSanggahan: val, linkVideoSanggahan: val });
                    }}
                    placeholder="Link Drive atau TG356...mp4"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                  <input
                    type="text"
                    value={manualRecord.catatan || ''}
                    onChange={(e) => setManualRecord({ ...manualRecord, catatan: e.target.value })}
                    placeholder="Catatan tambahan (misal: reject SO Retur, wraping ulang by email, dll)"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Simpan 1 Data Resi Ini
                </button>
              </div>
            </form>
          )}

          {/* Import Mode Options (For link / upload / paste) */}
          {activeTab !== 'manual' && parseStatus?.success && parsedRecords.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-700">Metode Pembaruan:</span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-blue-600"
                  />
                  <span>Gantikan Seluruh Database ({parsedRecords.length} data baru)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-blue-600"
                  />
                  <span>Gabungkan (Merge) dengan database yang ada</span>
                </label>
              </div>
            </div>
          )}

          {/* Reset and Export Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                title="Download database saat ini sebagai file CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV Database</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin mereset database kembali ke 1.187 data bawaan awal?')) {
                    onResetDefault();
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
                title="Kembalikan database ke data bawaan awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Awal</span>
              </button>
            </div>

            {activeTab !== 'manual' && parseStatus?.success && parsedRecords.length > 0 && (
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Terapkan Pembaruan Database ({parsedRecords.length} Data)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
