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
      className={`bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        isFirst ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
      }`}
    >
      {/* Top Banner / Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resi Original
              </span>
              {record.resiOriginal && record.resiOriginal !== 'Tidak ditemukan' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-mono font-bold text-slate-900">
                    {record.resiOriginal}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.resiOriginal, 'original')}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title="Salin Resi Original"
                  >
                    {copiedKey === 'original' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-sm font-mono text-slate-400 italic">
                  Tidak ditemukan
                </span>
              )}

              {matchedField && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                  Cocok di {matchedField}
                </span>
              )}
            </div>

            {/* Sub Resi Retur */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Resi Retur:</span>
              {record.resiRetur ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono font-semibold text-slate-700">
                    {record.resiRetur}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.resiRetur, 'retur')}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title="Salin Resi Retur"
                  >
                    {copiedKey === 'retur' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Tidak ada resi retur</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button & Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {record.status && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                record.status.toLowerCase() === 'done'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {record.status.toUpperCase()}
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              title="Edit data resi ini"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            title="Salin seluruh data rekaman ini"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Ringkasan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Highlight Alert for Update Case if issue detected */}
        {record.updateCase && (
          <div
            className={`p-3.5 rounded-lg flex items-start gap-3 border ${
              hasIssue
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-blue-50/60 border-blue-200 text-blue-900'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              <AlertTriangle
                className={`w-4 h-4 ${hasIssue ? 'text-amber-600' : 'text-blue-600'}`}
              />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-semibold mr-1.5">Kasus / Update:</span>
              <span className="font-medium">{record.updateCase}</span>
              {record.keterangan && (
                <div className="mt-1 text-xs opacity-90">
                  <span className="font-semibold">Keterangan Tambahan:</span> {record.keterangan}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 1: Item & Logistical Details */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Informasi Unit & Logistik
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* DN */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">Nomor DN</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-sm font-semibold text-slate-800 break-all">
                  {record.dn || '-'}
                </span>
                {record.dn && record.dn !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.dn, 'dn')}
                    className="text-slate-400 hover:text-slate-700 ml-1 shrink-0"
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
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">SKU Barang</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800 break-all">
                  {record.sku || '-'}
                </span>
                {record.sku && record.sku !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.sku, 'sku')}
                    className="text-slate-400 hover:text-slate-700 ml-1 shrink-0"
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
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">IMEI / SN</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800 break-all">
                  {record.imei || '-'}
                </span>
                {record.imei && record.imei !== 'Tidak ditemukan' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.imei, 'imei')}
                    className="text-slate-400 hover:text-slate-700 ml-1 shrink-0"
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
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">Sloc (Lokasi)</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-800">
                {record.sloc || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Handover & Sanggahan */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Dokumen Handover & Sanggahan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Doc Handover */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">Doc Handover</div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-slate-800 break-all">
                {record.docHandover || '-'}
              </div>
            </div>

            {/* NO HO */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">No. HO / Urut</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-800">
                {record.noHo || '-'}
              </div>
            </div>

            {/* Doc Sanggahan - FULLY CLICKABLE! */}
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                hasDocSanggahan
                  ? 'bg-blue-50/60 border-blue-200/90 shadow-2xs'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className={hasDocSanggahan ? 'text-blue-900 font-bold' : 'text-slate-500'}>
                    Doc Sanggahan
                  </span>
                </div>
                {hasDocSanggahan && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded flex items-center gap-1">
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

              <div className="mt-1.5">
                {hasDocSanggahan ? (
                  <div className="space-y-1.5">
                    {isDocUrl ? (
                      <div className="space-y-1">
                        {/* Direct Clickable Link to Google Drive / Document */}
                        <a
                          href={docSanggahanVal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left p-2 rounded-md bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/80 transition-all group flex items-start gap-2 shadow-2xs cursor-pointer block"
                          title="Klik untuk membuka dokumen sanggahan di tab baru"
                        >
                          <div className="p-1 rounded bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs font-bold text-blue-700 group-hover:text-blue-900 group-hover:underline break-all block">
                              {docSanggahanVal.includes('drive.google.com')
                                ? 'Tautan Google Drive (Buka Dokumen / Video)'
                                : docSanggahanVal}
                            </span>
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-700 flex items-center gap-1 mt-0.5">
                              <span>Klik untuk buka langsung di tab baru</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </a>

                        {/* Optional button to open inside player modal */}
                        <button
                          type="button"
                          onClick={() => handleOpenVideo(docSanggahanVal, 'sanggahan')}
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-1 py-0.5"
                        >
                          <Play className="w-3 h-3 fill-current" />
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
                        className="w-full text-left p-2 rounded-md bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/80 transition-all group flex items-start gap-2 shadow-2xs cursor-pointer"
                        title="Klik untuk membuka pemutar video / pencarian file di Drive"
                      >
                        <div className="p-1 rounded bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
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
                          <span className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-1 mt-0.5">
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
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Riwayat Packing & Petugas
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Nama Packer</span>
                <span className="font-semibold text-slate-800">{record.namaPacker || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Printer className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Status Print</span>
                <span className="font-semibold text-slate-800">{record.statusPrint || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-slate-500 block text-[10px]">Tgl & Jam Packing</span>
                <span className="font-mono text-slate-800 font-medium truncate block">
                  {record.tglJamPacking || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Tanggal Log / Masuk</span>
                <span className="font-medium text-slate-800">{record.tanggal || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Section (Read-Only / Tidak dapat diubah) */}
        {record.catatan ? (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
            <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-bold mr-1.5 text-amber-900">Catatan:</span>
              <span className="font-medium text-amber-950">{record.catatan}</span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-500 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-600">Catatan:</span>
            <span className="italic text-slate-400 text-[11px]">- (Tidak ada catatan)</span>
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
