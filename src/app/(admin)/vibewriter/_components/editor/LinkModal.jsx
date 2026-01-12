"use client";
import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

export default function VibeLinkModal({ isOpen, onClose, onConfirm }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[90%] max-w-[400px] bg-[var(--bg-toolbar)] border rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl"
        style={{
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold uppercase tracking-widest text-sm theme-text-primary">
            Insert Hyperlink
          </h3>
          <button onClick={onClose} className="theme-text-dim hover:text-white">
            <X size={16} />
          </button>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(value)}
          placeholder="https://..."
          className="w-full bg-black/10 border theme-border-dim rounded-lg p-3 theme-text-body outline-none focus:border-[var(--theme-color)] transition-colors mb-6 font-mono text-sm placeholder:opacity-50"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold uppercase theme-text-dim hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 rounded bg-white/10 border text-xs font-bold uppercase hover:bg-white/20 transition-all theme-text-primary"
            style={{ borderColor: "var(--theme-border)" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
