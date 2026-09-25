import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Check, X, ShieldCheck, Upload, Database, Trash2 } from 'lucide-react';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenUpdateModal?: () => void;
  onClearAllData?: () => void;
  totalRecords?: number;
}

const DEFAULT_PIN = '1234';
const PIN_STORAGE_KEY = 'resi_admin_custom_pin_v1';

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout,
  onOpenUpdateModal,
  onClearAllData,
  totalRecords = 0,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');

  if (!isOpen) return null;

  const getCurrentPin = () => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getCurrentPin();
    if (pinInput.trim() === correctPin.trim()) {
      setErrorMsg('');
      setPinInput('');
      onLogin();
    } else {
      setErrorMsg('PIN salah. Silakan coba lagi.');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = getCurrentPin();
    if (oldPinInput.trim() !== currentPin.trim()) {
      setErrorMsg('PIN lama tidak sesuai.');
      return;
    }
    if (newPinInput.trim().length < 4) {
      setErrorMsg('PIN baru minimal 4 karakter.');
      return;
    }

    try {
      localStorage.setItem(PIN_STORAGE_KEY, newPinInput.trim());
      setChangeSuccessMsg('PIN berhasil diperbarui!');
      setErrorMsg('');
      setOldPinInput('');
      setNewPinInput('');
      setTimeout(() => {
        setIsChangingPin(false);
        setChangeSuccessMsg('');
      }, 1500);
    } catch {
      setErrorMsg('Gagal menyimpan PIN baru ke browser.');
    }
  };

  return (
    <div
      id="admin-access-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="admin-access-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Colorful Gradient */}
        <div className={`px-6 py-4 border-b flex items-center justify-between text-white ${
          isAdmin
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-500/50'
            : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 border-indigo-500/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shadow-xs">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-emerald-200" /> : <Lock className="w-5 h-5 text-cyan-200" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isAdmin ? 'Menu Akses Pengelola' : 'Akses Khusus Pengelola'}
              </h3>
              <p className="text-xs text-white/80 font-medium">
                {isAdmin ? 'Pusat kontrol pembaruan database & pengaturan sistem' : 'Masukkan PIN untuk mengakses menu Update Data & Pengelola'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              {/* Feature Utama: Update Data Resi */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-300 text-emerald-950 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span>Update Data Database Resi</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                    Khusus Pengelola
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Perbarui atau sinkronkan seluruh database resi via <strong>Link Google Sheets</strong>, unggah <strong>File CSV</strong>, salin-tempel baris spreadsheet, atau tambah resi manual.
                </p>
                {onOpenUpdateModal && (
                  <button
                    type="button"
                    id="btn-admin-open-update-modal"
                    onClick={() => {
                      onOpenUpdateModal();
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Buka Menu Update & Sinkronisasi Data</span>
                  </button>
                )}
              </div>

              {/* Status Info */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akses Pengelola Sedang Aktif</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tombol <strong>Update Data</strong> pada bilah pencarian dan tombol <strong>Edit Resi</strong> kini dapat diakses di peramban ini.
                </p>
              </div>

              {!isChangingPin ? (
                <>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(true)}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                    >
                      Ganti PIN Akses
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Kunci Akses
                    </button>
                  </div>

                  {onClearAllData && totalRecords > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {totalRecords.toLocaleString('id-ID')} rekaman database
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('PERINGATAN: Yakin ingin MENGHAPUS SEMUA DATA di database? Semua catatan dan nomor resi akan dikosongkan.')) {
                            onClearAllData();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua Data</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleChangePin} className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">Ubah PIN Pengelola</h4>
                  {changeSuccessMsg && (
                    <div className="text-xs p-2 rounded bg-emerald-100 text-emerald-800 font-medium">
                      {changeSuccessMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-xs p-2 rounded bg-rose-100 text-rose-800 font-medium">
                      {errorMsg}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-slate-600">PIN Lama</label>
                    <input
                      type="password"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value)}
                      placeholder="Masukkan PIN saat ini"
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">PIN Baru</label>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="Minimal 4 karakter/angka"
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Simpan PIN Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(false);
                        setErrorMsg('');
                      }}
                      className="py-1.5 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs space-y-1.5 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fitur Update Data Khusus Pengelola</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Fitur pembaruan database via <strong>Link Google Sheets</strong>, unggah CSV, dan edit rekaman resi hanya dapat diakses oleh Pengelola. Masukkan PIN untuk membuka menu ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  PIN Keamanan Pengelola
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="input-admin-pin"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Ketik PIN (Bawaan: 1234)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm tracking-wider"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                {errorMsg && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  PIN bawaan pertama kali: <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">1234</code> (dapat diganti setelah masuk).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-admin-pin"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  Buka Akses Pengelola
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
