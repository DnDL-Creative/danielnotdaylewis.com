"use client";

import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { Type as TypeIcon, Clock } from "lucide-react";

export default function VibeStatsFooter() {
  const [editor] = useLexicalComposerContext();
  const [stats, setStats] = useState({ words: 0, minutes: 0 });

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        const words = textContent
          .trim()
          .split(/\s+/)
          .filter((w) => w !== "").length;
        const wordsPerMinute = 9500 / 60; // Blogcast Rule
        const minutes = Math.ceil(words / wordsPerMinute);
        setStats({ words, minutes });
      });
    });
  }, [editor]);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t theme-border-dim rounded-b-[1.9rem] bg-[var(--bg-toolbar)] text-xs font-bold uppercase tracking-widest theme-text-dim">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Word Count">
          <TypeIcon size={12} className="opacity-70" />
          <span>{stats.words.toLocaleString()} words</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div
          className="flex items-center gap-1.5"
          title="Blogcast Reading Time"
        >
          <Clock size={12} className="opacity-70" />
          <span>~{stats.minutes} min cast</span>
        </div>
      </div>
      <div className="opacity-50 hidden sm:block">VibeWriter 2.0</div>
    </div>
  );
}
