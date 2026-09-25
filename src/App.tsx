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

const STORAGE_HISTORY_KEY = 'resi_search_history_v1';
const STORAGE_DB_KEY = 'resi_user_custom_database_v1';
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

  // Active database state initialized from localStorage if customized, or default RESI_DATABASE
  const [databaseRecords, setDatabaseRecords] = useState<ResiRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If default RESI_DATABASE has more records than what was previously cached in localStorage,
          // merge the new default records so the user automatically gets the full updated dataset
          if (RESI_DATABASE.length > parsed.length) {
            const existingKeys = new Set<string>();
            parsed.forEach((r: ResiRecord) => {
              if (r.resiOriginal && r.resiOriginal !== 'Tidak ditemukan') existingKeys.add(r.resiOriginal.toLowerCase().trim());
              if (r.resiRetur && r.resiRetur !== 'Tidak ditemukan') existingKeys.add(r.resiRetur.toLowerCase().trim());
              if (r.dn && r.dn !== 'Tidak ditemukan') existingKeys.add(r.dn.toLowerCase().trim());
            });

            const toAdd = RESI_DATABASE.filter(r => {
              const orig = (r.resiOriginal || '').toLowerCase().trim();
              const ret = (r.resiRetur || '').toLowerCase().trim();
              const dn = (r.dn || '').toLowerCase().trim();
              const hasOrig = orig && orig !== 'tidak ditemukan' && existingKeys.has(orig);
              const hasRet = ret && ret !== 'tidak ditemukan' && existingKeys.has(ret);
              const hasDn = dn && dn !== 'tidak ditemukan' && existingKeys.has(dn);
              return !hasOrig && !hasRet && !hasDn;
            });

            const merged = [...parsed, ...toAdd];
            try {
              localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(merged));
            } catch {
              // Ignore storage limit errors
            }
            return merged;
          }
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

  // Reset to original default 1,056 records
  const handleResetDefault = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_DB_KEY);
    } catch {
      // Ignore
    }
    setDatabaseRecords(RESI_DATABASE);
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-200">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500">Hasil pencarian resi:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-sm">
                  "{submittedQuery}"
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    searchResults.length > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {searchResults.length} Data Ditemukan
                </span>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium self-end sm:self-auto"
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
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Nomor Resi Tidak Ditemukan
                  </h3>
                  <p className="text-sm text-slate-500">
                    Nomor resi <span className="font-mono font-semibold text-slate-800">"{submittedQuery}"</span> belum tercatat dalam database {databaseRecords.length.toLocaleString('id-ID')} rekaman ini.
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-500 max-w-md mx-auto bg-slate-50 p-4 rounded-lg border border-slate-100 text-left space-y-2">
                  <div className="font-semibold text-slate-700">Saran Pencarian:</div>
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
                        className="text-blue-600 underline font-medium"
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
                        className="text-blue-600 underline font-medium"
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
                          className="text-emerald-700 font-semibold underline cursor-pointer"
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
                          className="text-blue-600 font-semibold underline cursor-pointer"
                        >
                          Akses Pengelola
                        </button>{' '}
                        untuk melakukan pembaruan database.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  {['JX3929722651', 'TG3588235649', 'RTCGK26075459345', 'TG3565844935'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setQuery(sample);
                        handleSearch(sample);
                      }}
                      className="px-3 py-1 text-xs font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-colors"
                    >
                      Coba Resi {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View 2: Initial Landing State with Database Overview */
          <div className="space-y-6">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Total Database</span>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
                  {databaseStats.total.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400">Baris data resi siap cari</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Resi Original</span>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
                  {databaseStats.withOriginal.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400">Resi pengiriman awal</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Resi Retur</span>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
                  {databaseStats.withRetur.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400">Resi pengembalian retur</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Kasus / Anomali</span>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
                  {databaseStats.issues.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400">Kerusakan / tidak sesuai</span>
              </div>
            </div>

            {/* Centered Action Banner */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Siap Mencari Data Resi
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ketik nomor resi di kolom atas atau pilih salah satu contoh resi di bawah ini untuk melihat detail informasi logistik secara instan.
                </p>
              </div>

              {/* Sample resi pills */}
              <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap max-w-xl mx-auto">
                {[
                  { id: 'JX3929722651', desc: 'Klaim Terima Tidak Sesuai' },
                  { id: 'TG3588235649', desc: 'Isi Tidak Sesuai' },
                  { id: 'RTCGK26075459345', desc: 'Resi Retur' },
                  { id: 'TG3566161556', desc: 'Box Kosong' },
                  { id: 'JX9303569819', desc: 'Box Rusak' },
                  { id: 'SPXID068862297704', desc: 'SPX Retur' },
                ].map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setQuery(sample.id);
                      handleSearch(sample.id);
                    }}
                    className="group px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all shadow-2xs"
                  >
                    <div className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      {sample.id}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-blue-600">
                      {sample.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Update Data CTA Button: Only for Admin */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 max-w-md mx-auto flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Update / Import Data CSV Baru</span>
                  </button>
                </div>
              )}
            </div>
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
              className="text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1.5 text-[11px]"
              title="Akses Pengelola (Shortcut: Ctrl+Shift+U)"
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Mode Pengelola</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-slate-300" />
                  <span>Pengelola</span>
                </>
              )}
            </button>
          </div>

          {/* Signature: Handcraft by Hery */}
          <div className="pt-2 border-t border-slate-100 w-full max-w-xs mx-auto flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <span className="font-normal text-slate-400">Handcraft by</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Hery</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
