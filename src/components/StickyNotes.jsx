"use client";

import { useState } from "react";
import { PenLine, X, Minimize2, StickyNote } from "lucide-react";
import NotePad from "./NotePad";

export default function StickyNotes() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* EXPANDED NOTE PAD */}
      {isOpen && (
        <div className="w-[450px] h-[600px] bg-[#0f172a] rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
          {/* Header */}
          <div className="bg-slate-900/80 p-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-xs tracking-widest pl-2">
              <StickyNote size={14} /> Studio Notes
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* RENDER THE COMPLEX NOTEPAD HERE */}
          <div className="flex-grow overflow-hidden">
            <NotePad />
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-slate-700 text-white rotate-90"
            : "bg-indigo-600 text-white hover:bg-indigo-500 rotate-0"
        }`}
      >
        {isOpen ? <X size={24} /> : <PenLine size={24} />}
      </button>
    </div>
  );
}
