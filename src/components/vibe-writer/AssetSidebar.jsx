"use client";

import React, { useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings2,
  Copy,
  Trash2,
  Video,
  Music,
} from "lucide-react";

export default function AssetSidebar({
  images,
  onUpload,
  onOpenStudio,
  uploadingSlot,
  isDark,
}) {
  const fileInputRefs = useRef({});

  // Helper to trigger hidden file input
  const triggerUpload = (key) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key].click();
    }
  };

  // Helper for consistent button styling
  const btnClass = `flex-1 p-2 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all`;
  const studioBtnClass = isDark
    ? "border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:shadow-[0_0_10px_rgba(45,212,191,0.2)]"
    : "border-teal-600/30 text-teal-700 hover:bg-teal-50";
  const uploadBtnClass = isDark
    ? "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
    : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700";

  // Render a single asset card
  const renderAssetSlot = (key, label, isHero = false) => {
    const hasImage = !!images[key];

    return (
      <div
        key={key}
        className={`relative group rounded-xl border transition-all duration-300 ${
          isDark
            ? "bg-black/40 border-white/5 hover:border-white/10"
            : "bg-white border-slate-200 hover:border-slate-300"
        } ${isHero ? "p-4 mb-6" : "p-3 mb-3"}`}
      >
        {/* Label & Status */}
        <div className="flex justify-between items-center mb-3">
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {label}
          </span>
          {hasImage && (
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ACTIVE
            </span>
          )}
        </div>

        {/* Input Field (Read Only) */}
        <div className="relative mb-3">
          <ImageIcon
            size={14}
            className={`absolute left-3 top-3 ${
              isDark ? "text-slate-600" : "text-slate-400"
            }`}
          />
          <input
            value={images[key] || ""}
            placeholder="No asset uploaded..."
            readOnly
            className={`w-full py-2.5 pl-9 pr-3 rounded-lg text-[10px] font-mono outline-none border transition-colors ${
              isDark
                ? "bg-black/50 border-white/10 text-slate-300 placeholder-slate-700 focus:border-teal-500/50"
                : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-teal-500/50"
            }`}
          />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* STUDIO BUTTON (Always visible if image exists, or disabled style) */}
          <button
            onClick={() => onOpenStudio(images[key])}
            disabled={!hasImage}
            className={`${btnClass} ${studioBtnClass} ${
              !hasImage && "opacity-50 cursor-not-allowed grayscale"
            }`}
            title="Open in Vibe Studio"
          >
            <Settings2 size={14} />
            Studio
          </button>

          {/* UPLOAD BUTTON */}
          <button
            onClick={() => triggerUpload(key)}
            className={`${btnClass} ${uploadBtnClass}`}
          >
            {uploadingSlot === key ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {hasImage ? "Replace" : "Upload"}
          </button>
        </div>

        {/* Hidden Input */}
        <input
          type="file"
          ref={(el) => (fileInputRefs.current[key] = el)}
          onChange={(e) => onUpload(e, key)}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div
      className={`h-full rounded-[2.5rem] border-2 overflow-hidden flex flex-col ${
        isDark
          ? "bg-black/20 backdrop-blur-md border-white/10"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 border-b ${
          isDark ? "border-white/10" : "border-slate-100"
        }`}
      >
        <h3
          className={`font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 ${
            isDark ? "text-white" : "text-slate-800"
          }`}
        >
          <Settings2 size={16} className="text-teal-500" />
          Asset Manager
        </h3>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* GLOBAL STUDIO BUTTONS (For Video/Audio independent of images) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => onOpenStudio(null, "video")} // Pass specific mode
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${isDark ? "bg-black/40 border-white/10 hover:border-teal-500/50 hover:bg-teal-500/10" : "bg-slate-50 border-slate-200 hover:border-teal-500/50"}`}
          >
            <Video
              size={20}
              className="text-teal-500 group-hover:scale-110 transition-transform"
            />
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Add Video
            </span>
          </button>
          <button
            onClick={() => onOpenStudio(null, "audio")} // Pass specific mode
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${isDark ? "bg-black/40 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10" : "bg-slate-50 border-slate-200 hover:border-indigo-500/50"}`}
          >
            <Music
              size={20}
              className="text-indigo-500 group-hover:scale-110 transition-transform"
            />
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Add Audio
            </span>
          </button>
        </div>

        <div
          className={`h-px w-full mb-8 ${isDark ? "bg-white/10" : "bg-slate-200"}`}
        />

        {/* HERO SECTION */}
        {renderAssetSlot("main", "Hero / Main Image", true)}

        {/* CONTENT ASSETS */}
        <div className="space-y-1">
          {["img2", "img3", "img4", "img5", "img6"].map((key, i) =>
            renderAssetSlot(key, `Content Asset 0${i + 1}`)
          )}
        </div>

        {/* FOOTER HINT */}
        <div className="mt-8 text-center">
          <p
            className={`text-[9px] uppercase tracking-widest opacity-40 ${
              isDark ? "text-white" : "text-slate-500"
            }`}
          >
            VibeWriter v2.4
          </p>
        </div>
      </div>
    </div>
  );
}
