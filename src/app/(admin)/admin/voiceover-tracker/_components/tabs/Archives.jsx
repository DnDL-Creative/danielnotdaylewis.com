"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import ProjectCard from "../ProjectCard";

export default function Archives({ items, onAction, onEdit }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} onEdit={onEdit}>
          <button
            onClick={(e) => onAction(item.id, "recover", e)}
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all"
            title="Recover to Inbox"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={(e) => onAction(item.id, "delete", e)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
            title="Permanently Delete"
          >
            <Trash2 size={16} />
          </button>
        </ProjectCard>
      ))}
    </div>
  );
}
