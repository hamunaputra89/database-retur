import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchHeader } from './components/SearchHeader';
import { RecordDetailCard } from './components/RecordDetailCard';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { RecentSearches } from './components/RecentSearches';
import { UpdateDataModal } from './components/UpdateDataModal';
import { AdminAccessModal } from './components/AdminAccessModal';
import { RESI_DATABASE } from './data/database';
import type { ResiRecord, SearchScope } from './types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Upload,
  Database,
  Lock,
  Unlock
} from 'lucide-react';

const STORAGE_HISTORY_KEY = 'resi_search_history_v2';
const STORAGE_DB_KEY = 'resi_user_custom_database_v2';
const STORAGE_ADMIN_KEY = 'resi_admin_authenticated_v1';

export default function App() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all_resi');
  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Admin access state: only authorized manager/admin can see & use Update Data
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true' || params.get('admin') === '1') {
          return true;
        }
      }
      return localStorage.getItem(STORAGE_ADMIN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Active database state initialized from localStorage if customized, or default RESI_DATABASE (empty)
  const [databaseRecords, setDatabaseRecords] = useState<ResiRecord[]>(() => {
    try {
      // Purge old custom database key from previous sessions to ensure clean state
      localStorage.removeItem('resi_user_custom_database_v1');
      localStorage.removeItem('resi_search_history_v1');
      const saved = localStorage.getItem(STORAGE_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return RESI_DATABASE;
  });

  // Load search history from localStorage and sanitize corrupted / oversized data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly keep only clean, reasonable resi queries (<= 40 chars, single-line)
          const valid = parsed
            .filter(
              (item) =>
                typeof item === 'string' &&
                item.trim().length > 0 &&
                item.trim().length <= 40 &&
                !item.includes('\n') &&
                !item.includes('\r') &&
                !item.includes('\t')
            )
            .map((item) => item.trim())
            .slice(0, 10);

          setRecentHistory(valid);
          // Overwrite localStorage with the cleaned array immediately to purge broken data
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(valid));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Save history helper (strictly validates term)
  const addToHistory = useCallback((term: string) => {
    const clean = term.trim();
    // Do not save terms that are empty, too long (>40 chars), or contain newlines/tabs
    if (!clean || clean.length > 40 || clean.includes('\n') || clean.includes('\r') || clean.includes('\t')) return;
    setRecentHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage write errors
      }
      return updated;
    });
  }, []);

  const handleClearHistory = () => {
    setRecentHistory([]);
    try {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
    } catch {
      // Ignore
    }
  };

  const handleRemoveHistoryItem = (item: string) => {
    setRecentHistory((prev) => {
      const updated = prev.filter((h) => h !== item);
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Perform search with smart extraction for accidental multi-column paste
  const handleSearch = useCallback(
    (customQuery?: string) => {
      let targetQuery = (customQuery !== undefined ? customQuery : query).trim();

      // If user pasted a multi-line or multi-column spreadsheet text, extract the resi
      if (targetQuery.length > 40 || targetQuery.includes('\t') || targetQuery.includes('\n')) {
        const tokens = targetQuery.split(/[\s,\t\r\n]+/).map((t) => t.trim()).filter(Boolean);
        // Find first token that looks like a resi (alphanumeric, 6-35 chars, not header words)
        const candidate = tokens.find(
          (t) =>
            t.length >= 6 &&
            t.length <= 35 &&
            /^[A-Za-z0-9_-]+$/.test(t) &&
            !['tanggal', 'tidak', 'ditemukan', 'status', 'done', 'original'].includes(t.toLowerCase())
        );
        if (candidate) {
          targetQuery = candidate;
          setQuery(candidate);
        } else {
          targetQuery = targetQuery.slice(0, 40).trim();
        }
      }

      setSubmittedQuery(targetQuery);
      if (targetQuery) {
        addToHistory(targetQuery);
      }
    },
    [query, addToHistory]
  );

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
  };

  // Keyboard shortcut listener:
  // - Press "/" to focus search input
  // - Press "Esc" to clear
  // - Press "Ctrl + Shift + U" or "Alt + U" to open Admin Access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('input-resi')?.focus();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (
        (e.ctrlKey && e.shiftKey && (e.key === 'U' || e.key === 'u')) ||
        (e.altKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdminLogin = useCallback(() => {
    setIsAdmin(true);
    try {
      localStorage.setItem(STORAGE_ADMIN_KEY, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_ADMIN_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Update Database Handler (Upload CSV / Paste / Add Record)
  const handleUpdateDatabase = useCallback((newRecords: ResiRecord[], isMerge = false) => {
    setDatabaseRecords((prev) => {
      let updated: ResiRecord[];
      if (isMerge) {
        // Merge without duplicate IDs
        const existingMap = new Map<string, ResiRecord>();
        prev.forEach((r) => existingMap.set(r.id, r));
        newRecords.forEach((r) => existingMap.set(r.id, r));
        updated = Array.from(existingMap.values());
      } else {
        updated = newRecords;
      }

      try {
        localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not persist full database to localStorage:', err);
      }
      return updated;
    });
  }, []);

  // Clear / Reset All Data
  const handleClearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_DB_KEY);
      localStorage.removeItem('resi_user_custom_database_v1');
    } catch {
      // Ignore
    }
    setDatabaseRecords([]);
  }, []);

  const handleResetDefault = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_DB_KEY);
      localStorage.removeItem('resi_user_custom_database_v1');
    } catch {
      // Ignore
    }
    setDatabaseRecords([]);
  }, []);

  // Single Record Update (Edit form on RecordDetailCard)
  const handleUpdateSingleRecord = useCallback((updatedRecord: ResiRecord) => {
    setDatabaseRecords((prev) => {
      const updated = prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
      try {
        localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Filter matching records based on submittedQuery from databaseRecords
  const searchResults = useMemo(() => {
    const q = submittedQuery.toLowerCase().trim();
    if (!q) return [];

    const exactMatches: { record: ResiRecord; matchedField: string }[] = [];
    const partialMatches: { record: ResiRecord; matchedField: string }[] = [];

    databaseRecords.forEach((item) => {
      const orig = (item.resiOriginal || '').toLowerCase().trim();
      const retur = (item.resiRetur || '').toLowerCase().trim();
      const dn = (item.dn || '').toLowerCase().trim();
      const imei = (item.imei || '').toLowerCase().trim();
      const sku = (item.sku || '').toLowerCase().trim();

      if (searchScope === 'all_resi') {
        if (orig === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Original (Cocok Persis)' });
        } else if (retur === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Retur (Cocok Persis)' });
        } else if (orig.includes(q)) {
          partialMatches.push({ record: item, matchedField: 'Resi Original' });
        } else if (retur.includes(q)) {
          partialMatches.push({ record: item, matchedField: 'Resi Retur' });
        }
      } else if (searchScope === 'original') {
        if (orig === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Original (Cocok Persis)' });
        } else if (orig.includes(q)) {
          partialMatches.push({ record: item, matchedField: 'Resi Original' });
        }
      } else if (searchScope === 'retur') {
        if (retur === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Retur (Cocok Persis)' });
        } else if (retur.includes(q)) {
          partialMatches.push({ record: item, matchedField: 'Resi Retur' });
        }
      } else if (searchScope === 'dn_imei') {
        if (orig === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Original' });
        } else if (retur === q) {
          exactMatches.push({ record: item, matchedField: 'Resi Retur' });
        } else if (dn === q) {
          exactMatches.push({ record: item, matchedField: 'Nomor DN' });
        } else if (imei === q) {
          exactMatches.push({ record: item, matchedField: 'IMEI / SN' });
        } else if (orig.includes(q) || retur.includes(q) || dn.includes(q) || imei.includes(q) || sku.includes(q)) {
          partialMatches.push({ record: item, matchedField: 'Kecocokan Bagian' });
        }
      }
    });

    return [...exactMatches, ...partialMatches];
  }, [databaseRecords, submittedQuery, searchScope]);

  // Overall database stats
  const databaseStats = useMemo(() => {
    const total = databaseRecords.length;
    let withRetur = 0;
    let withOriginal = 0;
    let issues = 0;
    let withVideo = 0;

    databaseRecords.forEach((r) => {
      if (r.resiRetur && r.resiRetur !== 'Tidak ditemukan') withRetur++;
      if (r.resiOriginal && r.resiOriginal !== 'Tidak ditemukan') withOriginal++;
      if (r.linkVideoSanggahan && r.linkVideoSanggahan !== 'Tidak ditemukan') withVideo++;
      const u = (r.updateCase || '').toLowerCase();
      if (
        u.includes('tidak') ||
        u.includes('rusak') ||
        u.includes('kosong') ||
        u.includes('batu') ||
        u.includes('sampah')
      ) {
        issues++;
      }
    });

    return { total, withRetur, withOriginal, issues, withVideo };
  }, [databaseRecords]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/40 to-indigo-50/30 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white relative">
      {/* Subtle colorful ambient light accents */}
      <div className="fixed top-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Search Header Component */}
      <SearchHeader
        query={query}
        onQueryChange={(val) => {
          setQuery(val);
          if (!val) setSubmittedQuery('');
        }}
        onSearch={handleSearch}
        onClear={handleClear}
        searchScope={searchScope}
        onScopeChange={(scope) => {
          setSearchScope(scope);
          if (query.trim()) {
            handleSearch(query);
          }
        }}
        totalDatabaseRecords={databaseRecords.length}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main Body Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Recent Searches Bar */}
        <RecentSearches
          history={recentHistory}
          onSelect={(resi) => {
            setQuery(resi);
            handleSearch(resi);
          }}
          onClear={handleClearHistory}
          onRemoveItem={handleRemoveHistoryItem}
        />

        {/* View 1: When user has searched for a Resi */}
        {submittedQuery ? (
          <div className="space-y-4">
            {/* Search Results Summary Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/60 px-4 py-3 rounded-xl border-2 border-indigo-200/80 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-700">Hasil pencarian resi:</span>
                <span className="font-mono font-extrabold text-blue-950 bg-white px-2.5 py-1 rounded-lg text-sm border border-indigo-200 shadow-2xs">
                  "{submittedQuery}"
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-extrabold shadow-2xs ${
                    searchResults.length > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
                  }`}
                >
                  {searchResults.length} Data Ditemukan
                </span>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-bold self-end sm:self-auto px-2.5 py-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pencarian</span>
              </button>
            </div>

            {/* If Results Found */}
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map(({ record, matchedField }, idx) => (
                  <RecordDetailCard
                    key={`${record.id}-${idx}`}
                    record={record}
                    matchedField={matchedField}
                    isFirst={idx === 0}
                    onUpdateRecord={handleUpdateSingleRecord}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              /* If No Result Found */
              <div className="bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30 rounded-2xl border-2 border-rose-200 p-8 text-center shadow-md space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-md shadow-rose-500/25">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Nomor Resi Tidak Ditemukan
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Nomor resi <span className="font-mono font-bold text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">"{submittedQuery}"</span> belum tercatat dalam database {databaseRecords.length.toLocaleString('id-ID')} rekaman ini.
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-600 max-w-md mx-auto bg-white/90 p-4 rounded-xl border border-rose-200/80 text-left space-y-2 shadow-2xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Saran & Langkah Pencarian:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Pastikan tidak ada salah ketik atau spasi tersembunyi.</li>
                    <li>
                      Ganti filter kolom menjadi{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSearchScope('all_resi');
                          handleSearch();
                        }}
                        className="text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
                      >
                        Semua Resi (Original & Retur)
                      </button>{' '}
                      atau{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSearchScope('dn_imei');
                          handleSearch();
                        }}
                        className="text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
                      >
                        Resi / DN / IMEI
                      </button>
                      .
                    </li>
                    {isAdmin ? (
                      <li>
                        Ingin menambahkan nomor resi ini? Klik{' '}
                        <button
                          type="button"
                          onClick={() => setIsUpdateModalOpen(true)}
                          className="text-emerald-700 hover:text-emerald-900 font-extrabold underline cursor-pointer"
                        >
                          Update / Tambah Data Resi
                        </button>
                      </li>
                    ) : (
                      <li>
                        Perlu memperbarui atau menambah data resi? Masuk ke{' '}
                        <button
                          type="button"
                          onClick={() => setIsAdminModalOpen(true)}
                          className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                        >
                          Akses Pengelola
                        </button>{' '}
                        untuk melakukan pembaruan database.
                      </li>
                    )}
                  </ul>
                </div>

                {databaseRecords.length > 0 && (
                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    {databaseRecords.slice(0, 4).map((rec) => {
                      const sampleResi = rec.resiOriginal || rec.resiRetur;
                      if (!sampleResi) return null;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setQuery(sampleResi);
                            handleSearch(sampleResi);
                          }}
                          className="px-3 py-1 text-xs font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-colors cursor-pointer"
                        >
                          Coba Resi {sampleResi}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* View 2: Landing State */
          <div>
            {databaseRecords.length === 0 ? (
              /* Dedicated Empty State Template with Colorful Accent */
              <div className="space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 rounded-2xl border border-blue-200/90 p-8 sm:p-12 text-center shadow-md">
                  {/* Subtle color ambient orbs */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                    <Database className="w-8 h-8" />
                  </div>
                  <div className="relative z-10 max-w-xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-900 bg-indigo-50/80 px-3.5 py-1 rounded-full border border-indigo-200/80 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Database Bersih • Siap Menerima Data Baru</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Portal Database Resi Retur Logistik
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Sistem siap digunakan untuk pelacakan status klaim, dokumen sanggahan, bukti video unboxing, dan riwayat serah terima (handover). Mulai dengan mengimpor data resi melalui menu Pengelola.
                    </p>
                  </div>

                  {/* Primary CTA */}
                  <div className="relative z-10 pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                    {isAdmin ? (
                      <button
                        type="button"
                        id="btn-landing-update-data"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Buka Menu Update & Sinkronisasi Data</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="btn-landing-login-admin"
                        onClick={() => setIsAdminModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-700/25 transition-all cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-cyan-300" />
                        <span>Masuk Akses Pengelola untuk Impor Data</span>
                      </button>
                    )}
                  </div>
                  <p className="relative z-10 text-xs text-slate-400 mt-3 font-medium">
                    {isAdmin
                      ? 'Mode pengelola aktif: Anda dapat langsung menambahkan atau mengunggah data.'
                      : 'PIN bawaan pengelola: 1234 (dapat diubah setelah masuk).'}
                  </p>
                </div>

                {/* 4 Feature Colorful Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/15 via-indigo-500/5 to-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-blue-500/25">
                      01
                    </div>
                    <h3 className="font-extrabold text-sm text-blue-950">Akses Pengelola</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Masuk menggunakan PIN keamanan untuk mengaktifkan wewenang pembaruan database dan mode editing resi.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-emerald-500/25">
                      02
                    </div>
                    <h3 className="font-extrabold text-sm text-emerald-950">Spreadsheet & CSV</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Tempelkan tautan Google Sheets, unggah file CSV, atau salin-tempel baris tabel dari Excel untuk sinkronisasi otomatis.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-500/15 via-purple-500/5 to-white p-5 rounded-2xl border-2 border-purple-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-purple-500/25">
                      03
                    </div>
                    <h3 className="font-extrabold text-sm text-purple-950">Video & Handover</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Akses cepat link Google Drive dokumen sanggahan, pemutar video bukti unboxing, dan nomor surat serah terima.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-white p-5 rounded-2xl border-2 border-amber-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-amber-500/25">
                      04
                    </div>
                    <h3 className="font-extrabold text-sm text-amber-950">Pencarian Multi-Kolom</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Pencarian super instan berdasarkan Resi Retur, Resi Original, DN, atau nomor IMEI lengkap dengan penanda kasus.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Dashboard View when database has records */
              <div className="space-y-6">
                {/* Colorful KPI Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-white p-4 sm:p-5 rounded-2xl border-2 border-blue-200/90 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">Total Database</span>
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/25">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-blue-950">
                      {databaseStats.total.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] text-blue-700/80 font-bold">Baris data resi aktif</span>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-200/90 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Resi Original</span>
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-indigo-950">
                      {databaseStats.withOriginal.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] text-indigo-700/80 font-bold">Resi pengiriman awal</span>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-200/90 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Resi Retur</span>
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950">
                      {databaseStats.withRetur.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] text-emerald-700/80 font-bold">Resi pengembalian retur</span>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Kasus / Anomali</span>
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-amber-950">
                      {databaseStats.issues.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] text-amber-700/80 font-bold">Kerusakan / tidak sesuai</span>
                  </div>
                </div>

                {/* Ready to Search Banner with Dynamic Sample Resi */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/40 rounded-2xl border-2 border-indigo-200/90 p-8 sm:p-10 text-center shadow-lg space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                    <Search className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      Siap Mencari Data Resi
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Ketik nomor resi di kolom atas atau pilih salah satu contoh resi yang tersedia di database di bawah ini.
                    </p>
                  </div>

                  {/* Dynamic sample resi buttons */}
                  <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap max-w-xl mx-auto">
                    {databaseRecords.slice(0, 6).map((rec, rIdx) => {
                      const sampleId = rec.resiOriginal || rec.resiRetur;
                      if (!sampleId) return null;
                      const borders = [
                        'border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/60 text-cyan-900',
                        'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-indigo-900',
                        'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 text-emerald-900',
                        'border-purple-200 hover:border-purple-400 hover:bg-purple-50/60 text-purple-900',
                        'border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 text-amber-900',
                        'border-teal-200 hover:border-teal-400 hover:bg-teal-50/60 text-teal-900',
                      ];
                      const bClass = borders[rIdx % borders.length];

                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setQuery(sampleId);
                            handleSearch(sampleId);
                          }}
                          className={`group px-3.5 py-2.5 rounded-xl border-2 bg-white text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer ${bClass}`}
                        >
                          <div className="font-mono text-xs font-extrabold">
                            {sampleId}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px] font-semibold mt-0.5">
                            {rec.updateCase || rec.status || 'Data Resi'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t border-indigo-100 max-w-md mx-auto flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Update / Impor Data Baru</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Database Explorer Drawer (Always accessible) */}
        <DatabaseExplorer
          records={databaseRecords}
          onSelectRecord={(resi) => {
            setQuery(resi);
            handleSearch(resi);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isOpen={isDbExplorerOpen}
          onToggle={() => setIsDbExplorerOpen(!isDbExplorerOpen)}
          onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
          isAdmin={isAdmin}
        />
      </main>

      {/* Modal Update Data */}
      <UpdateDataModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentRecords={databaseRecords}
        onUpdateDatabase={handleUpdateDatabase}
        onResetDefault={handleResetDefault}
      />

      {/* Modal Akses Khusus Pengelola */}
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onOpenUpdateModal={() => {
          setIsAdminModalOpen(false);
          setIsUpdateModalOpen(true);
        }}
        onClearAllData={handleClearAllData}
        totalRecords={databaseRecords.length}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        <div className="flex flex-col items-center justify-center gap-3 max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-500">
            <p>
              Database Resi Logistik Retur • {databaseRecords.length.toLocaleString('id-ID')} Data Aktif • Gunakan shortcut{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[11px] font-mono font-medium text-slate-600">/</kbd> untuk mencari resi
            </p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1.5 text-[11px] cursor-pointer"
              title="Akses Pengelola (Shortcut: Ctrl+Shift+U)"
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Mode Pengelola Aktif</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Akses Pengelola</span>
                </>
              )}
            </button>
          </div>

          {/* Signature: Handcraft by Hery */}
          <div className="pt-2 border-t border-slate-100 w-full max-w-xs mx-auto flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <span className="font-normal text-slate-400">Handcraft by</span>
            <span className="font-semibold text-slate-700 tracking-wide">
              Hery
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
