import React from 'react';
import { Search, X, ScanBarcode, ArrowRight, Database, Upload, ShieldCheck, Lock, Unlock } from 'lucide-react';
import type { SearchScope } from '../types';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q?: string) => void;
  onClear: () => void;
  searchScope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  totalDatabaseRecords: number;
  onOpenUpdateModal?: () => void;
  isAdmin?: boolean;
  onOpenAdminModal?: () => void;
  onLogoutAdmin?: () => void;
}

const SAMPLE_RESI = [
  { label: 'JX3929722651', desc: 'Resi Original' },
  { label: 'TG3588235649', desc: 'Isi Tidak Sesuai' },
  { label: 'RTCGK26075459345', desc: 'Resi Retur' },
  { label: 'TG3566161556', desc: 'Box Kosong' },
  { label: 'SPXID068862297704', desc: 'SPX Retur' },
  { label: 'TG3565844935', desc: 'Isi Sirup Botol' },
];

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  searchScope,
  onScopeChange,
  totalDatabaseRecords,
  onOpenUpdateModal,
  isAdmin = false,
  onOpenAdminModal,
  onLogoutAdmin,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div id="search-header-container" className="w-full bg-white border-b border-slate-200 shadow-sm py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Title and Database Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
                <ScanBarcode className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Pencarian Database Resi Retur
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Input nomor resi untuk memeriksa status klaim, sanggahan, handover, dan riwayat packing
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Database: <strong>{totalDatabaseRecords.toLocaleString('id-ID')} Data</strong></span>
            </div>

            {/* Update Data Button (Hanya jika Akses Pengelola Aktif) */}
            {isAdmin && onOpenUpdateModal && (
              <button
                type="button"
                id="btn-open-update-data"
                onClick={onOpenUpdateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Buka menu perbarui / sinkronisasi data dari Google Sheets atau file CSV (Khusus Pengelola)"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Update Data</span>
              </button>
            )}

            {/* Admin / Pengelola Access Button */}
            {isAdmin ? (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors shadow-2xs"
                title="Akses Pengelola Aktif - Klik untuk kelola / buka Update Data"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Akses Pengelola</span>
              </button>
            ) : (
              onOpenAdminModal && (
                <button
                  type="button"
                  onClick={onOpenAdminModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition-colors"
                  title="Masuk ke Akses Pengelola untuk Update Data (PIN: 1234)"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Akses Pengelola</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Search Input Box Form */}
        <form onSubmit={handleSubmit} className="relative mt-2">
          <div className="relative flex items-center rounded-xl shadow-md border-2 border-blue-500/80 bg-white transition-all focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 overflow-hidden">
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <input
              id="input-resi"
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                // If pasted content is multi-line, multi-column (tab-separated), or over 40 chars
                if (text && (text.includes('\n') || text.includes('\r') || text.includes('\t') || text.length > 40)) {
                  e.preventDefault();
                  // Extract first valid resi token (alphanumeric, 6-35 chars, not common column words)
                  const tokens = text.split(/[\s,\t\r\n]+/).map((t) => t.trim()).filter(Boolean);
                  const candidate = tokens.find(
                    (t) =>
                      t.length >= 6 &&
                      t.length <= 35 &&
                      /^[A-Za-z0-9_-]+$/.test(t) &&
                      !['tanggal', 'tidak', 'ditemukan', 'status', 'done', 'original'].includes(t.toLowerCase())
                  );
                  if (candidate) {
                    onQueryChange(candidate);
                  } else {
                    onQueryChange(text.slice(0, 40).trim());
                  }
                }
              }}
              placeholder="Ketik atau paste nomor resi di sini (contoh: JX3929722651, TG3588235649)..."
              className="w-full py-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-mono font-medium tracking-wide"
            />
            {query && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={onClear}
                className="p-2 mr-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              id="btn-search-resi"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base tracking-wide transition-colors whitespace-nowrap"
            >
              <span>Cari Resi</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </form>

        {/* Scope Filters and Quick Sample Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Scope selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Kolom Pencarian:
            </span>
            <button
              type="button"
              id="scope-all-resi"
              onClick={() => onScopeChange('all_resi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                searchScope === 'all_resi'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Resi (Original & Retur)
            </button>
            <button
              type="button"
              id="scope-original"
              onClick={() => onScopeChange('original')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                searchScope === 'original'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hanya Resi Original
            </button>
            <button
              type="button"
              id="scope-retur"
              onClick={() => onScopeChange('retur')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                searchScope === 'retur'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hanya Resi Retur
            </button>
            <button
              type="button"
              id="scope-dn-imei"
              onClick={() => onScopeChange('dn_imei')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                searchScope === 'dn_imei'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resi / DN / IMEI
            </button>
          </div>

          {/* Quick Samples */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400">Contoh Resi:</span>
            {SAMPLE_RESI.slice(0, 4).map((sample) => (
              <button
                key={sample.label}
                type="button"
                id={`sample-resi-${sample.label}`}
                onClick={() => {
                  onQueryChange(sample.label);
                  onSearch(sample.label);
                }}
                className="px-2 py-0.5 text-xs font-mono bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 rounded transition-colors"
                title={`${sample.desc}: Klik untuk mencari`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
