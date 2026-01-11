"use client";
import {
  Ghost,
  Wand2,
  ListFilter,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

export default function GhostGenerator({
  ghostDensity,
  setGhostDensity,
  ghostMonths,
  setGhostMonths,
  handleGhostMode,
  items,
  selectedGhosts,
  toggleSelectGhost,
  toggleSelectAllGhosts,
  handleDeleteSelectedGhosts,
}) {
  const ghostItems = items.filter((i) => i.type === "ghost");
  const allSelected =
    ghostItems.length > 0 && selectedGhosts.length === ghostItems.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
      {/* Generator Settings */}
      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 h-fit">
        <Ghost className="text-slate-300 mb-4" size={32} />
        <h3 className="text-slate-900 font-black uppercase text-lg mb-1">
          Generator Settings
        </h3>
        <p className="text-slate-400 text-xs mb-6 max-w-sm">
          Automatically fill gaps to appear busier. Ghost bookings are strictly
          visual.
        </p>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
              Density
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["low", "medium", "high"].map((d) => (
                <button
                  key={d}
                  onClick={() => setGhostDensity(d)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    ghostDensity === d
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
              Lookahead
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setGhostMonths(m)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    ghostMonths === m
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/50">
            <button
              onClick={handleGhostMode}
              className="w-full py-4 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <Wand2 size={16} /> Generate Ghosts
            </button>
          </div>
        </div>
      </div>

      {/* Ghost List */}
      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
              <ListFilter size={18} />
            </div>
            <h3 className="text-slate-900 font-black uppercase text-lg">
              Active Ghosts
            </h3>
          </div>
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
            {items.filter((i) => i.type === "ghost").length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 custom-scrollbar">
          {ghostItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Ghost size={48} className="mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No active ghosts
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-2">
                <button
                  onClick={toggleSelectAllGhosts}
                  className="text-[10px] font-bold uppercase text-slate-400 hover:text-purple-600 flex items-center gap-2"
                >
                  {allSelected ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}{" "}
                  Select All
                </button>
              </div>
              {ghostItems.map((item) => {
                const isSelected = selectedGhosts.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-purple-50 border-purple-200"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleSelectGhost(item.id)}
                      className={`shrink-0 ${
                        isSelected ? "text-purple-600" : "text-slate-300"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold uppercase ${
                            isSelected ? "text-purple-900" : "text-slate-700"
                          }`}
                        >
                          Ghost Block
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.startStr}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {selectedGhosts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between animate-fade-in-up">
            <span className="text-xs font-bold text-slate-400">
              {selectedGhosts.length} items selected
            </span>
            <button
              onClick={handleDeleteSelectedGhosts}
              className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
