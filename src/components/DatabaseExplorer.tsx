import React, { useState, useMemo } from 'react';
import {
  Database,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Video,
  Play,
  FileText,
  ExternalLink
} from 'lucide-react';
import type { ResiRecord } from '../types';

interface DatabaseExplorerProps {
  records: ResiRecord[];
  onSelectRecord: (resi: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenUpdateModal?: () => void;
  isAdmin?: boolean;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  records,
  onSelectRecord,
  isOpen,
  onToggle,
  onOpenUpdateModal,
  isAdmin = false,
}) => {
  const [filterText, setFilterText] = useState('');
  const [selectedPacker, setSelectedPacker] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Extract unique packers
  const packers = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.namaPacker && r.namaPacker !== 'Tidak ditemukan') {
        set.add(r.namaPacker);
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter records
  const filtered = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    return records.filter((r) => {
      if (selectedPacker !== 'all' && r.namaPacker !== selectedPacker) {
        return false;
      }
      if (selectedIssue === 'issue') {
        const u = (r.updateCase || '').toLowerCase();
        if (
          !u.includes('tidak') &&
          !u.includes('rusak') &&
          !u.includes('kosong') &&
          !u.includes('batu') &&
          !u.includes('sampah')
        ) {
          return false;
        }
      }

      if (!q) return true;
      return (
        r.resiOriginal.toLowerCase().includes(q) ||
        r.resiRetur.toLowerCase().includes(q) ||
        r.dn.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.imei.toLowerCase().includes(q) ||
        r.updateCase.toLowerCase().includes(q) ||
        r.namaPacker.toLowerCase().includes(q) ||
        r.linkVideoSanggahan.toLowerCase().includes(q) ||
        (r.docSanggahan || '').toLowerCase().includes(q) ||
        (r.catatan || '').toLowerCase().includes(q)
      );
    });
  }, [records, filterText, selectedPacker, selectedIssue]);

  // Pagination math
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Drawer Header */}
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Database Lengkap Resi Retur</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {records.length.toLocaleString('id-ID')} Total Data
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isOpen ? 'Klik untuk menutup tabel browser database' : 'Klik untuk membuka & melihat seluruh isi data database'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isAdmin && onOpenUpdateModal && (
            <button
              type="button"
              onClick={onOpenUpdateModal}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="Perbarui data database via Link Google Sheets / CSV / Teks (Khusus Pengelola)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Update Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isOpen ? 'Tutup Database' : 'Buka Database'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 space-y-4">
          {/* Controls / Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari dalam tabel..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Packer:</span>
              </div>
              <select
                value={selectedPacker}
                onChange={(e) => {
                  setSelectedPacker(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Packer ({packers.length})</option>
                {packers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={selectedIssue}
                onChange={(e) => {
                  setSelectedIssue(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="issue">Hanya Kasus / Rusak / Tidak Sesuai</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Resi Original</th>
                  <th className="py-2.5 px-3">Resi Retur</th>
                  <th className="py-2.5 px-3">DN</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Kasus / Masalah</th>
                  <th className="py-2.5 px-3">Doc Sanggahan</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3">Packer</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pageRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang cocok dengan filter tabel
                    </td>
                  </tr>
                ) : (
                  pageRecords.map((r) => {
                    const docVal = (
                      r.docSanggahan && r.docSanggahan !== 'Tidak ditemukan'
                        ? r.docSanggahan
                        : r.linkVideoSanggahan && r.linkVideoSanggahan !== 'Tidak ditemukan'
                        ? r.linkVideoSanggahan
                        : ''
                    ).trim();
                    const hasDoc = Boolean(docVal && docVal !== 'Tidak ditemukan');
                    const isDocUrl = docVal.startsWith('http://') || docVal.startsWith('https://');

                    return (
                      <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-2 px-3 font-sans">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(r.resiOriginal || r.resiRetur)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors text-[11px] font-medium"
                            title="Lihat Detail Resi Ini"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Pilih</span>
                          </button>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {r.resiOriginal || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.resiRetur || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.dn || '-'}</td>
                        <td className="py-2 px-3 text-slate-600">{r.sku || '-'}</td>
                        <td className="py-2 px-3 font-sans text-slate-800 max-w-xs truncate">
                          {r.updateCase || '-'}
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {hasDoc ? (
                            isDocUrl ? (
                              <a
                                href={docVal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors text-[11px] font-medium shadow-2xs group"
                                title={`Buka Dokumen Sanggahan: ${docVal}`}
                              >
                                <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                <span>Buka Doc</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectRecord(r.resiOriginal || r.resiRetur)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors text-[11px] font-medium shadow-2xs group max-w-[140px]"
                                title={`Klik untuk melihat detail: ${docVal}`}
                              >
                                <FileText className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate font-mono">{docVal}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {r.catatan ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/70 text-[11px] font-medium max-w-[160px] truncate"
                              title={r.catatan}
                            >
                              {r.catatan}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700">
                          {r.namaPacker || '-'}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-500">
                          {r.tanggal || r.tglJamPacking || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-500">
            <div>
              Menampilkan {pageRecords.length} dari {filtered.length.toLocaleString('id-ID')} data
              (Halaman {currentPage} dari {totalPages})
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
