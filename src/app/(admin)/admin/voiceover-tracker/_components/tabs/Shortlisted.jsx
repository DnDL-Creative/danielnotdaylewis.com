"use client";

import { Trophy, ArrowLeft, Archive, RotateCcw } from "lucide-react";
import ProjectCard from "../ProjectCard";

export default function Shortlisted({ items, onAction, onEdit }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} onEdit={onEdit}>
          <div className="flex gap-2">
            <button
              onClick={(e) => onAction(item.id, "book", e)}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Trophy size={14} /> Book
            </button>
            <button
              onClick={(e) => onAction(item.id, "demote", e)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
              title="Move Back"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={(e) => onAction(item.id, "archive", e)}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
              title="Archive"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={(e) => onAction(item.id, "recover", e)}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700 transition-all"
              title="Recover to Inbox"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </ProjectCard>
      ))}
    </div>
  );
}
