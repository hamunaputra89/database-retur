import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  ExternalLink,
  Copy,
  Check,
  Upload,
  FolderOpen,
  Film,
  Info,
  Calendar,
  User,
  Package,
  AlertTriangle
} from 'lucide-react';
import type { ResiRecord } from '../types';

interface VideoSanggahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoText: string;
  record: ResiRecord | null;
  videoType?: 'sanggahan' | 'unboxing' | 'packing';
}

const DRIVE_FOLDER_STORAGE_KEY = 'resi_drive_base_folder_url';

export const VideoSanggahanModal: React.FC<VideoSanggahanModalProps> = ({
  isOpen,
  onClose,
  videoText,
  record,
  videoType = 'sanggahan',
}) => {
  const [copied, setCopied] = useState(false);
  const [localVideoSrc, setLocalVideoSrc] = useState<string | null>(null);
  const [customFolderUrl, setCustomFolderUrl] = useState<string>('');
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [folderInput, setFolderInput] = useState('');

  // Extract direct URL and filename
  const urlMatch = videoText.match(/https?:\/\/[^\s]+/);
  const directUrl = urlMatch ? urlMatch[0] : null;
  const rawFileName = videoText.replace(/https?:\/\/[^\s]+/, '').trim() || (directUrl ? '' : videoText.trim());

  // Load custom folder URL from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRIVE_FOLDER_STORAGE_KEY);
      if (saved) {
        setCustomFolderUrl(saved);
        setFolderInput(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Clean up object URL when modal closes or changes
  useEffect(() => {
    return () => {
      if (localVideoSrc) {
        URL.revokeObjectURL(localVideoSrc);
      }
    };
  }, [localVideoSrc]);

  if (!isOpen) return null;

  const handleCopyName = () => {
    const textToCopy = rawFileName || directUrl || videoText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (localVideoSrc) {
        URL.revokeObjectURL(localVideoSrc);
      }
      const url = URL.createObjectURL(file);
      setLocalVideoSrc(url);
    }
  };

  const handleSaveCustomFolder = () => {
    const trimmed = folderInput.trim();
    setCustomFolderUrl(trimmed);
    setIsEditingFolder(false);
    try {
      if (trimmed) {
        localStorage.setItem(DRIVE_FOLDER_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(DRIVE_FOLDER_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  };

  // Construct Google Drive Search URL
  const searchDriveUrl = rawFileName
    ? `https://drive.google.com/drive/search?q=${encodeURIComponent(rawFileName)}`
    : directUrl || '#';

  // Construct Google Drive Embed URL if directUrl is a Google Drive file link
  const getGoogleDriveEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }
    return null;
  };

  const driveEmbedUrl = getGoogleDriveEmbedUrl(directUrl);

  const getTitle = () => {
    if (videoType === 'unboxing') return 'Video Unboxing Sanggahan';
    if (videoType === 'packing') return 'Video Rekaman Packing';
    return 'Video Rekaman Sanggahan';
  };

  return (
    <div
      id="video-sanggahan-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="video-sanggahan-modal-card"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Colorful Gradient */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white flex items-center justify-between border-b border-indigo-600/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{getTitle()}</span>
                {rawFileName && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white border border-white/30">
                    MP4
                  </span>
                )}
              </h3>
              <p className="text-xs text-cyan-100/90 font-medium">
                Bukti dokumentasi video sanggahan klaim resi retur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Tutup Modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* File & Link Highlights */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nama File / Tautan Video:
              </span>
              <button
                type="button"
                onClick={handleCopyName}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nama File</span>
                  </>
                )}
              </button>
            </div>

            <div className="font-mono text-sm font-bold text-slate-900 bg-white p-3 rounded-lg border border-slate-200 break-all select-all">
              {rawFileName || directUrl || videoText}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {directUrl ? (
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Buka Tautan Video (Google Drive)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href={searchDriveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Cari File di Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {customFolderUrl && (
                <a
                  href={customFolderUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Buka Folder Drive Utama</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Video Player Display Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Pemutar Video</span>
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Putar File MP4 dari Komputer</span>
                <input
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Embedded Video Player */}
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center relative shadow-inner">
              {localVideoSrc ? (
                <video
                  src={localVideoSrc}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : driveEmbedUrl ? (
                <iframe
                  src={driveEmbedUrl}
                  title="Google Drive Video Preview"
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      File: {rawFileName || 'Video Sanggahan'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik tombol <strong>"Cari File di Google Drive"</strong> di atas untuk membuka video di cloud, atau gunakan tombol <strong>"Putar File MP4 dari Komputer"</strong> jika file ada di perangkat Anda.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connected Record Info */}
          {record && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Informasi Resi Terkait:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Resi Original</span>
                  <span className="font-mono font-bold text-slate-800">{record.resiOriginal || '-'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Resi Retur</span>
                  <span className="font-mono font-bold text-slate-800">{record.resiRetur || '-'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Nama Packer</span>
                  <span className="font-semibold text-slate-800">{record.namaPacker || '-'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Kasus / Update</span>
                  <span className="font-semibold text-slate-800 truncate block">{record.updateCase || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Folder Setting Accordion */}
          <div className="pt-2 border-t border-slate-200">
            {!isEditingFolder ? (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {customFolderUrl ? (
                    <span className="text-emerald-700">
                      Folder Drive terhubung: <code className="text-slate-700">{customFolderUrl.substring(0, 45)}...</code>
                    </span>
                  ) : (
                    'Ingin menautkan folder Google Drive bersama tim Anda?'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingFolder(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  {customFolderUrl ? 'Ubah Folder' : 'Atur Folder Drive'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2 text-xs">
                <div className="font-semibold text-blue-900">
                  Pengaturan Folder Google Drive Tim
                </div>
                <p className="text-blue-700">
                  Masukkan link folder Google Drive tempat penyimpanan video rekaman sanggahan (misal: <code>https://drive.google.com/drive/folders/xxxx</code>).
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-blue-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomFolder}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingFolder(false)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tips: Klik nama file untuk menyalin atau buka pencarian drive otomatis.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
