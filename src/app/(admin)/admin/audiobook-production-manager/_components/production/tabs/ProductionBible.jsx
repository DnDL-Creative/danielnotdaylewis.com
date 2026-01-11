"use client";
import { BookOpen, X, Plus } from "lucide-react";

export default function ProductionBible({ characters, onChange }) {
  const modifyArray = (idx, field, val) => {
    const arr = [...(characters || [])];
    if (field === null) arr.splice(idx, 1);
    else arr[idx][field] = val;
    onChange("characters", arr);
  };

  const addCharacter = () => {
    onChange("characters", [
      ...(characters || []),
      { name: "", voice: "", page: "", time: "" },
    ]);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-100">
        <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
          <BookOpen size={16} /> Character List
        </h4>
        <button
          onClick={addCharacter}
          className="text-[10px] font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-300 shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={12} /> Add Character
        </button>
      </div>
      <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {(characters || []).map((char, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
            {/* Name */}
            <div className="col-span-3">
              <input
                placeholder="Name"
                value={char.name}
                onChange={(e) => modifyArray(idx, "name", e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-transparent focus:bg-white focus:border-indigo-200 border outline-none transition-all"
              />
            </div>
            {/* Voice Description */}
            <div className="col-span-4">
              <input
                placeholder="Voice Desc"
                value={char.voice}
                onChange={(e) => modifyArray(idx, "voice", e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none transition-all"
              />
            </div>
            {/* Page # */}
            <div className="col-span-2">
              <input
                placeholder="Pg 12"
                value={char.page}
                onChange={(e) => modifyArray(idx, "page", e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none transition-all"
              />
            </div>
            {/* Timestamp */}
            <div className="col-span-2">
              <input
                placeholder="00:00"
                value={char.time}
                onChange={(e) => modifyArray(idx, "time", e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none transition-all"
              />
            </div>
            {/* Delete */}
            <div className="col-span-1 text-right">
              <button
                onClick={() => modifyArray(idx, null, null)}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!characters || characters.length === 0) && (
          <div className="text-center py-8 text-slate-300 text-xs italic">
            No characters logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
