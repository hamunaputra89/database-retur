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
      <div className="flex items-center gap-1.5 font-bold text-indigo-950 mr-1 shrink-0">
        <span className="p-1 rounded-lg bg-indigo-100 text-indigo-600 shadow-2xs">
          <History className="w-3.5 h-3.5" />
        </span>
        <span>Riwayat Pencarian:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
        {history.map((resi, rIdx) => {
          const colors = [
            'bg-blue-50/80 border-blue-200 text-blue-950 hover:border-blue-400',
            'bg-indigo-50/80 border-indigo-200 text-indigo-950 hover:border-indigo-400',
            'bg-emerald-50/80 border-emerald-200 text-emerald-950 hover:border-emerald-400',
            'bg-purple-50/80 border-purple-200 text-purple-950 hover:border-purple-400',
            'bg-amber-50/80 border-amber-200 text-amber-950 hover:border-amber-400'
          ];
          const chipColor = colors[rIdx % colors.length];

          return (
            <span
              key={resi}
              className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg border font-mono shadow-2xs group transition-all max-w-[220px] ${chipColor}`}
            >
              <button
                type="button"
                onClick={() => onSelect(resi)}
                className="font-bold hover:underline flex items-center gap-1 truncate max-w-[170px] cursor-pointer"
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
                className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-white/80 transition-colors shrink-0 cursor-pointer"
                title="Hapus dari riwayat"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="text-[11px] text-slate-400 hover:text-rose-600 hover:underline font-medium shrink-0 ml-auto cursor-pointer"
        title="Hapus semua riwayat pencarian"
      >
        Bersihkan Riwayat
      </button>
    </div>
  );
};
