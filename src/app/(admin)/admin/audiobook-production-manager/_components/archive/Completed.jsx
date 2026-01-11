"use client";

import { Trophy, User, BookOpen, CalendarDays, Undo2 } from "lucide-react";

export default function Completed({ items, onRestore }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          No completed projects found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {items.map((r) => {
        // Safe date parsing
        const dateObj = r.end_date ? new Date(r.end_date) : new Date();

        return (
          <div
            key={r.id}
            className="relative border border-slate-200 rounded-sm shadow-sm transition-all duration-300 overflow-hidden hover:shadow-md bg-white group"
          >
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_100px] h-full">
              {/* IMAGE */}
              <div className="bg-slate-100/50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/60 overflow-hidden h-[120px] md:h-auto relative">
                {r.cover_image_url ? (
                  <img
                    src={r.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-90 grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <Trophy size={32} className="text-yellow-400" />
                )}
              </div>

              {/* CONTENT */}
              <div className="p-6 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    {r.book_title || "Untitled Project"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] uppercase font-black text-emerald-600">
                      Complete
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <User size={12} /> {r.client_name || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />{" "}
                    {r.word_count ? Number(r.word_count).toLocaleString() : 0}{" "}
                    Words
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} /> {dateObj.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="p-4 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/50 justify-center">
                <button
                  onClick={() => onRestore(r)}
                  className="w-full py-2 bg-white border border-slate-200 text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <Undo2 size={14} /> Restore
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
