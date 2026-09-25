import React, { useState } from 'react';
import {
  Package,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Printer,
  FileText,
  Clock,
  Video,
  Share2,
  Play,
  Edit3,
  Search,
  X
} from 'lucide-react';
import type { ResiRecord } from '../types';
import { VideoSanggahanModal } from './VideoSanggahanModal';

interface RecordDetailCardProps {
  record: ResiRecord;
  matchedField?: string;
  isFirst?: boolean;
  onUpdateRecord?: (updated: ResiRecord) => void;
  isAdmin?: boolean;
}

export const RecordDetailCard: React.FC<RecordDetailCardProps> = ({
  record,
  matchedField,
  isFirst = false,
  onUpdateRecord,
  isAdmin = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoText, setActiveVideoText] = useState('');
  const [activeVideoType, setActiveVideoType] = useState<'sanggahan' | 'unboxing' | 'packing'>('sanggahan');

  // Edit Record State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<ResiRecord>({ ...record });

  const copyToClipboard = (text: string, key: string) => {
    if (!text || text === 'Tidak ditemukan') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopySummary = () => {
    const summary = `=== LAPORAN DATA RESI RETUR ===
• Resi Original: ${record.resiOriginal || '-'}
• Resi Retur: ${record.resiRetur || '-'}
• No. DN: ${record.dn || '-'}
• SKU: ${record.sku || '-'}
• IMEI: ${record.imei || '-'}
• Sloc: ${record.sloc || '-'}
• Kasus / Update: ${record.updateCase || '-'}
• Keterangan: ${record.keterangan || '-'}
• Status: ${record.status || '-'}
• Handover: ${record.docHandover || '-'} (No HO: ${record.noHo || '-'})
• Doc Sanggahan: ${docSanggahanVal || '-'}
• Packer: ${record.namaPacker || '-'}
• Jam Packing: ${record.tglJamPacking || '-'}
• Catatan: ${record.catatan || '-'}`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Open video / doc modal helper
  const handleOpenVideo = (videoText: string, type: 'sanggahan' | 'unboxing' | 'packing' = 'sanggahan') => {
    setActiveVideoText(videoText);
    setActiveVideoType(type);
    setIsVideoModalOpen(true);
  };

  // Determine if there is an issue or anomaly in updateCase
  const caseLower = (record.updateCase || '').toLowerCase();
  const hasIssue =
    caseLower.includes('tidak sesuai') ||
    caseLower.includes('rusak') ||
    caseLower.includes('kosong') ||
    caseLower.includes('tidak segel') ||
    caseLower.includes('batu') ||
    caseLower.includes('sampah') ||
    caseLower.includes('sobek') ||
    caseLower.includes('hilang');

  // Check Doc Sanggahan (fallback to linkVideoSanggahan if docSanggahan is empty or 'Tidak ditemukan')
  const docSanggahanVal = (
    record.docSanggahan && record.docSanggahan !== 'Tidak ditemukan'
      ? record.docSanggahan
      : record.linkVideoSanggahan && record.linkVideoSanggahan !== 'Tidak ditemukan'
      ? record.linkVideoSanggahan
      : ''
  ).trim();

  const hasDocSanggahan = Boolean(docSanggahanVal && docSanggahanVal !== 'Tidak ditemukan');
  const isDocUrl = docSanggahanVal.startsWith('http://') || docSanggahanVal.startsWith('https://');
  const docIsVideo =
    docSanggahanVal.toLowerCase().endsWith('.mp4') ||
    docSanggahanVal.toLowerCase().includes('unboxing') ||
    docSanggahanVal.toLowerCase().endsWith('.mkv') ||
    docSanggahanVal.toLowerCase().endsWith('.mov');

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateRecord) {
      onUpdateRecord({
        ...editFormData,
        catatan: record.catatan, // Catatan tidak dapat diubah
      });
    }
    setIsEditModalOpen(false);
  };

  return (
    <div
      id={`record-card-${record.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-lg overflow-hidden ${
        isFirst ? 'border-indigo-400 ring-2 ring-indigo-200/60' : 'border-slate-200/90'
      }`}
    >
      {/* Top Banner / Header with Vibrant Gradient */}
      <div className="p-4 sm:p-5 border-b border-indigo-600/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/30 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-200">
                Resi Original:
              </span>
              {record.resiOriginal && record.resiOriginal !== 'Tidak ditemukan' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-mono font-extrabold text-white tracking-wide">
                    {record.resiOriginal}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.resiOriginal, 'original')}
                    className="p-1 rounded-md text-cyan-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Salin Resi Original"
                  >
                    {copiedKey === 'original' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-sm font-mono text-cyan-200/70 italic">
                  Tidak ditemukan
                </span>
              )}

              {matchedField && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-sm">
                  Cocok di {matchedField}
                </span>
              )}
            </div>

            {/* Sub Resi Retur */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-semibold text-emerald-200">Resi Retur:</span>
              {record.resiRetur ? (
                <div className="flex items-center gap-1 bg-emerald-500/25 border border-emerald-300/40 px-2 py-0.5 rounded-lg">
                  <span className="text-xs font-mono font-bold text-emerald-100">
                    {record.resiRetur}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.resiRetur, 'retur')}
                    className="p-0.5 rounded text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    title="Salin Resi Retur"
                  >
                    {copiedKey === 'retur' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-blue-200/70 italic">Tidak ada resi retur</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button & Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {record.status && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md ${
                record.status.toLowerCase() === 'done'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/30'
                  : record.status.toLowerCase().includes('reject')
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{record.status}</span>
            </span>
          )}

          {/* Quick Edit Button: Only visible to admin */}
          {isAdmin && onUpdateRecord && (
            <button
              type="button"
              onClick={() => {
                setEditFormData({ ...record });
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              title="Edit data resi ini"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-200" />
              <span>Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
            title="Salin seluruh data rekaman ini"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300 font-extrabold">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-200" />
                <span>Salin Ringkasan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 sm:p-5 space-y-5 bg-gradient-to-b from-white via-indigo-50/15 to-white">
        {/* Highlight Alert for Update Case if issue detected */}
        {record.updateCase && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border-2 shadow-sm ${
              hasIssue
                ? 'bg-gradient-to-r from-amber-50 via-rose-50/60 to-orange-50 border-amber-400 text-amber-950'
                : 'bg-gradient-to-r from-blue-50 via-cyan-50/60 to-indigo-50 border-blue-400 text-blue-950'
            }`}
          >
            <div className={`p-1.5 rounded-xl mt-0.5 shrink-0 ${hasIssue ? 'bg-amber-500 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-extrabold mr-1.5 text-slate-900">Kasus / Update:</span>
              <span className={`font-bold ${hasIssue ? 'text-amber-950' : 'text-blue-950'}`}>{record.updateCase}</span>
              {record.keterangan && (
                <div className="mt-1 text-xs opacity-95 text-slate-700">
                  <span className="font-bold">Keterangan Tambahan:</span> {record.keterangan}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 1: Item & Logistical Details */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs shadow-blue-400" />
            <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
              Informasi Unit & Logistik
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* DN */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50/50 border-2 border-sky-200/90 hover:border-sky-400 transition-colors shadow-2xs">
              <div className="text-[11px] font-extrabold text-sky-900">Nomor DN</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-sm font-bold text-slate-900 break-all">
                  {record.dn || '-'}
                </span>
                {record.dn && record.dn !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.dn, 'dn')}
                    className="p-1 rounded-md text-sky-600 hover:text-sky-900 hover:bg-sky-100 transition-colors shrink-0 cursor-pointer"
                    title="Salin DN"
                  >
                    {copiedKey === 'dn' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* SKU */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50/50 border-2 border-violet-200/90 hover:border-violet-400 transition-colors shadow-2xs">
              <div className="text-[11px] font-extrabold text-purple-900">SKU Barang</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 break-all">
                  {record.sku || '-'}
                </span>
                {record.sku && record.sku !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.sku, 'sku')}
                    className="p-1 rounded-md text-purple-600 hover:text-purple-900 hover:bg-purple-100 transition-colors shrink-0 cursor-pointer"
                    title="Salin SKU"
                  >
                    {copiedKey === 'sku' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* IMEI */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50/50 border-2 border-pink-200/90 hover:border-pink-400 transition-colors shadow-2xs">
              <div className="text-[11px] font-extrabold text-pink-900">IMEI / SN</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 break-all">
                  {record.imei || '-'}
                </span>
                {record.imei && record.imei !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.imei, 'imei')}
                    className="p-1 rounded-md text-pink-600 hover:text-pink-900 hover:bg-pink-100 transition-colors shrink-0 cursor-pointer"
                    title="Salin IMEI"
                  >
                    {copiedKey === 'imei' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sloc */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50/50 border-2 border-emerald-200/90 hover:border-emerald-400 transition-colors shadow-2xs">
              <div className="text-[11px] font-extrabold text-teal-900">Sloc (Lokasi)</div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                {record.sloc || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Handover & Sanggahan */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-400" />
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              Dokumen Handover & Sanggahan
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Doc Handover */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20 border border-indigo-200/90 shadow-2xs">
              <div className="text-[11px] font-bold text-indigo-900">Doc Handover</div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-800 break-all">
                {record.docHandover || '-'}
              </div>
            </div>

            {/* NO HO */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 border border-cyan-200/90 shadow-2xs">
              <div className="text-[11px] font-bold text-cyan-900">No. HO / Urut</div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-800">
                {record.noHo || '-'}
              </div>
            </div>

            {/* Doc Sanggahan - FULLY CLICKABLE! */}
            <div
              className={`p-3 rounded-xl border-2 transition-all ${
                hasDocSanggahan
                  ? 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50/60 border-cyan-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className={hasDocSanggahan ? 'text-blue-900 font-extrabold' : 'text-slate-500'}>
                    Doc Sanggahan
                  </span>
                </div>
                {hasDocSanggahan && (
                  <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    {isDocUrl ? (
                      <>
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Link Aktif</span>
                      </>
                    ) : docIsVideo ? (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Video</span>
                      </>
                    ) : (
                      <span>Bisa Diklik</span>
                    )}
                  </span>
                )}
              </div>

              <div className="mt-2">
                {hasDocSanggahan ? (
                  <div className="space-y-1.5">
                    {isDocUrl ? (
                      <div className="space-y-1">
                        {/* Direct Clickable Link to Google Drive / Document */}
                        <a
                          href={docSanggahanVal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left p-2.5 rounded-xl bg-white border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50/80 transition-all group flex items-start gap-2 shadow-xs cursor-pointer block"
                          title="Klik untuk membuka dokumen sanggahan di tab baru"
                        >
                          <div className="p-1 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs font-bold text-blue-700 group-hover:text-blue-900 group-hover:underline break-all block">
                              {docSanggahanVal.includes('drive.google.com')
                                ? 'Tautan Google Drive (Buka Dokumen / Video)'
                                : docSanggahanVal}
                            </span>
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-700 flex items-center gap-1 mt-0.5 font-medium">
                              <span>Klik untuk buka langsung di tab baru</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </a>

                        {/* Optional button to open inside player modal */}
                        <button
                          type="button"
                          onClick={() => handleOpenVideo(docSanggahanVal, 'sanggahan')}
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-1 py-0.5 font-medium cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current text-blue-600" />
                          <span>Buka opsi pemutar & salin tautan</span>
                        </button>
                      </div>
                    ) : (
                      /* File name like TG...mp4 or file name */
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenVideo(docSanggahanVal, docIsVideo ? 'unboxing' : 'sanggahan')
                        }
                        className="w-full text-left p-2.5 rounded-xl bg-white border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50/80 transition-all group flex items-start gap-2 shadow-xs cursor-pointer"
                        title="Klik untuk membuka pemutar video / pencarian file di Drive"
                      >
                        <div className="p-1 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                          {docIsVideo ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-700 break-all block">
                            {docSanggahanVal}
                          </span>
                          <span className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-1 mt-0.5 font-medium">
                            <span>Klik untuk buka file / cari di Drive</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic font-mono">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Packing & Operator History */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-xs shadow-teal-400" />
            <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider">
              Riwayat Packing & Petugas
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-slate-500 block text-[10px] font-medium">Nama Packer</span>
                <span className="font-bold text-slate-800 truncate block">{record.namaPacker || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50/50 border border-purple-200/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-slate-500 block text-[10px] font-medium">Status Print</span>
                <span className="font-bold text-slate-800 truncate block">{record.statusPrint || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-slate-500 block text-[10px] font-medium">Tgl & Jam Packing</span>
                <span className="font-mono text-slate-800 font-bold truncate block">
                  {record.tglJamPacking || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-slate-500 block text-[10px] font-medium">Tanggal Log / Masuk</span>
                <span className="font-bold text-slate-800 truncate block">{record.tanggal || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Section (Read-Only / Tidak dapat diubah) */}
        {record.catatan ? (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5 shrink-0 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold mr-1.5 text-amber-950">Catatan Khusus:</span>
              <span className="font-medium text-amber-950 leading-relaxed">{record.catatan}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600">Catatan:</span>
            <span className="italic text-slate-400 text-[11px]">- (Tidak ada catatan khusus)</span>
          </div>
        )}
      </div>

      {/* Video Sanggahan Modal */}
      <VideoSanggahanModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoText={activeVideoText}
        record={record}
        videoType={activeVideoType}
      />

      {/* Edit Record Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Edit Data Resi: {record.resiOriginal || record.resiRetur}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <input
                  type="text"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kasus / Update Case</label>
                <input
                  type="text"
                  value={editFormData.updateCase}
                  onChange={(e) => setEditFormData({ ...editFormData, updateCase: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={editFormData.keterangan}
                  onChange={(e) => setEditFormData({ ...editFormData, keterangan: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doc Sanggahan (Link Google Drive / Nama File)</label>
                <input
                  type="text"
                  value={editFormData.docSanggahan || editFormData.linkVideoSanggahan || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFormData({
                      ...editFormData,
                      docSanggahan: val,
                      linkVideoSanggahan: val,
                    });
                  }}
                  placeholder="URL Google Drive atau nama file (misal: TG356...mp4)"
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              {record.catatan ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan (Terkunci / Tidak Dapat Diubah)
                  </label>
                  <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium cursor-not-allowed select-none">
                    {record.catatan}
                  </div>
                </div>
              ) : null}

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
