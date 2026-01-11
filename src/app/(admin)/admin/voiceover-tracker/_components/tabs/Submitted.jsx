"use client";

import { ArrowLeft, Star, Trophy, Archive } from "lucide-react";
import ProjectCard from "../ProjectCard";

export default function Submitted({ items, onAction, onEdit }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} onEdit={onEdit}>
          <div className="flex gap-2">
            <button
              onClick={(e) => onAction(item.id, "revert", e)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
              title="Revert to Audition"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={(e) => onAction(item.id, "shortlist", e)}
              className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 transition-all"
              title="Shortlist"
            >
              <Star size={16} />
            </button>
            <button
              onClick={(e) => onAction(item.id, "book", e)}
              className="p-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20 transition-all"
              title="Book Project"
            >
              <Trophy size={16} />
            </button>
            <div className="w-px h-8 bg-slate-700 mx-1" />
            <button
              onClick={(e) => onAction(item.id, "archive", e)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
              title="Archive"
            >
              <Archive size={16} />
            </button>
          </div>
        </ProjectCard>
      ))}
    </div>
  );
}
