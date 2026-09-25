import React from 'react';
import { History, X, ArrowUpRight } from 'lucide-react';

interface RecentSearchesProps {
  history: string[];
  onSelect: (resi: string) => void;
  onClear: () => void;
  onRemoveItem: (resi: string) => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  history,
  onSelect,
  onClear,
  onRemoveItem,
}) => {
  if (history.length === 0) return null;

  return (
    <div id="recent-searches-bar" className="flex items-center gap-2 flex-wrap text-xs text-slate-500 py-1">
      <div className="flex items-center gap-1 font-semibold text-slate-600 mr-1 shrink-0">
        <History className="w-3.5 h-3.5 text-blue-600" />
        <span>Riwayat Pencarian:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
        {history.map((resi) => (
          <span
            key={resi}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono shadow-2xs group hover:border-blue-300 hover:text-blue-700 transition-colors max-w-[220px]"
          >
            <button
              type="button"
              onClick={() => onSelect(resi)}
              className="font-medium hover:underline flex items-center gap-1 truncate max-w-[170px]"
              title={`Cari ulang ${resi}`}
            >
              <span className="truncate">{resi}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveItem(resi);
              }}
              className="p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 shrink-0"
              title="Hapus dari riwayat"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="text-[11px] text-slate-400 hover:text-rose-600 hover:underline shrink-0 ml-auto"
        title="Hapus semua riwayat pencarian"
      >
        Bersihkan Riwayat
      </button>
    </div>
  );
};
