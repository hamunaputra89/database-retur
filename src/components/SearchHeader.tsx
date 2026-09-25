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
    <div id="search-header-container" className="relative w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 border-b border-indigo-600/60 shadow-lg py-6 px-4 sm:px-6 lg:px-8 text-white overflow-hidden">
      {/* Ambient background light bursts */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-4">
        {/* Title and Database Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30">
                <ScanBarcode className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Pencarian Database Resi Retur
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-cyan-100/90 mt-1 font-medium">
              Sistem pelacakan status klaim retur, sanggahan, handover, dan riwayat packing
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${totalDatabaseRecords > 0 ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-amber-400 shadow-sm shadow-amber-400'}`} />
              <span>Database: <strong>{totalDatabaseRecords.toLocaleString('id-ID')} Data</strong></span>
            </div>

            {/* Update Data Button (Hanya jika Akses Pengelola Aktif) */}
            {isAdmin && onOpenUpdateModal && (
              <button
                type="button"
                id="btn-open-update-data"
                onClick={onOpenUpdateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/30 border border-emerald-200 transition-all cursor-pointer"
                title="Buka menu perbarui / sinkronisasi data dari Google Sheets atau file CSV (Khusus Pengelola)"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>Update Data</span>
              </button>
            )}

            {/* Admin / Pengelola Access Button */}
            {isAdmin ? (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-200 border border-cyan-400/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Akses Pengelola Aktif - Klik untuk kelola / buka Update Data"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>Akses Pengelola</span>
              </button>
            ) : (
              onOpenAdminModal && (
                <button
                  type="button"
                  onClick={onOpenAdminModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-blue-100 text-xs font-semibold border border-white/25 transition-all shadow-sm cursor-pointer"
                  title="Masuk ke Akses Pengelola untuk Update Data (PIN: 1234)"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Akses Pengelola</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Search Input Box Form */}
        <form onSubmit={handleSubmit} className="relative mt-2">
          <div className="relative flex items-center rounded-2xl shadow-2xl border-2 border-indigo-300/80 bg-white transition-all focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-300/30 overflow-hidden">
            <div className="pl-4 pr-2 text-indigo-600">
              <Search className="w-6 h-6" />
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
                className="p-2 mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              id="btn-search-resi"
              className="inline-flex items-center gap-2 px-5 sm:px-7 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 active:from-cyan-600 active:to-indigo-700 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-blue-700/30 whitespace-nowrap cursor-pointer"
            >
              <span>Cari Resi</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Scope Filters and Quick Sample Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Scope selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider mr-1">
              Kolom:
            </span>
            <button
              type="button"
              id="scope-all-resi"
              onClick={() => onScopeChange('all_resi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                searchScope === 'all_resi'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-white/50 scale-102'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/15'
              }`}
            >
              Semua Resi (Original & Retur)
            </button>
            <button
              type="button"
              id="scope-original"
              onClick={() => onScopeChange('original')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                searchScope === 'original'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-white/50 scale-102'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/15'
              }`}
            >
              Hanya Resi Original
            </button>
            <button
              type="button"
              id="scope-retur"
              onClick={() => onScopeChange('retur')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                searchScope === 'retur'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-white/50 scale-102'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/15'
              }`}
            >
              Hanya Resi Retur
            </button>
            <button
              type="button"
              id="scope-dn-imei"
              onClick={() => onScopeChange('dn_imei')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                searchScope === 'dn_imei'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-white/50 scale-102'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/15'
              }`}
            >
              Resi / DN / IMEI
            </button>
          </div>

          {/* Quick Samples or Empty Indicator */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {totalDatabaseRecords > 0 ? (
              <>
                <span className="text-xs font-semibold text-cyan-200">Contoh Resi:</span>
                {SAMPLE_RESI.slice(0, 4).map((sample, sIdx) => {
                  const colors = [
                    'hover:bg-cyan-500/30 border-cyan-300/40 text-cyan-100',
                    'hover:bg-amber-500/30 border-amber-300/40 text-amber-100',
                    'hover:bg-emerald-500/30 border-emerald-300/40 text-emerald-100',
                    'hover:bg-violet-500/30 border-violet-300/40 text-violet-100'
                  ];
                  const colorClass = colors[sIdx % colors.length];
                  return (
                    <button
                      key={sample.label}
                      type="button"
                      id={`sample-resi-${sample.label}`}
                      onClick={() => {
                        onQueryChange(sample.label);
                        onSearch(sample.label);
                      }}
                      className={`px-2 py-0.5 text-xs font-mono bg-white/10 border rounded-lg transition-all cursor-pointer ${colorClass}`}
                      title={`${sample.desc}: Klik untuk mencari`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </>
            ) : (
              <span className="text-xs text-cyan-100 flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                <span className="font-medium">Database siap menerima impor data resi</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
