"use client";

import { Send, Ban } from "lucide-react";
import ProjectCard from "../ProjectCard";

export default function Auditions({ items, onAction, onEdit }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} onEdit={onEdit}>
          <button
            onClick={(e) => onAction(item.id, "skip", e)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-all"
            title="Skip Audition"
          >
            <Ban size={16} />
          </button>
          <div className="p-1">
            <button
              onClick={(e) => onAction(item.id, "submit", e)}
              className="group/btn relative px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <span>Submit</span>
              <Send
                size={12}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </ProjectCard>
      ))}
    </div>
  );
}
