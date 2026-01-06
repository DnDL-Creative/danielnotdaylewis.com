"use client";

import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings2,
  Video,
  Music,
  Plus,
  Code,
  X,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Images,
} from "lucide-react";

export default function AssetSidebar({
  images,
  onUpload,
  onManualInput,
  onOpenStudio,
  onReorder,
  uploadingSlot,
  isDark,
}) {
  const fileInputRefs = useRef({});

  // UI States
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState(null);
  const [manualUrl, setManualUrl] = useState("");

  // CONTENT SLOTS
  const contentSlots = ["img2", "img3", "img4", "img5", "img6"];
  const nextEmptySlot = contentSlots.find((key) => !images[key]);
  const isFull = !nextEmptySlot;

  // --- ACTIONS ---
  const handleCloseMenu = () => {
    setIsAddMenuOpen(false);
    setActiveInputMode(null);
    setManualUrl("");
  };

  const triggerUpload = (key) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key].click();
    }
    handleCloseMenu();
  };

  const handleManualSubmit = () => {
    if (!manualUrl) return;
    if (isFull) return;
    onManualInput(manualUrl, nextEmptySlot);
    handleCloseMenu();
  };

  // --- REORDER HANDLERS ---
  const moveAsset = (currentIndex, direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= contentSlots.length) return;
    onReorder(currentIndex, newIndex);
  };

  // --- ASSET TYPE HELPER ---
  const getAssetType = (url) => {
    if (!url) return "empty";
    if (
      url.includes("youtube") ||
      url.includes("youtu.be") ||
      url.includes("vimeo")
    )
      return "video";
    if (url.includes("spotify") || url.endsWith(".mp3")) return "audio";
    return "image";
  };

  // --- CARD COMPONENT ---
  const AssetCard = ({ assetKey, label, index }) => {
    const url = images[assetKey];
    if (!url) return null;

    const type = getAssetType(url);

    return (
      <div
        className={`group relative flex items-center gap-2 p-2 rounded-xl border mb-3 transition-all animate-in fade-in slide-in-from-bottom-2 ${
          isDark
            ? "bg-black/40 border-white/5 hover:border-teal-500/30"
            : "bg-white border-slate-200 hover:border-teal-500/30"
        }`}
      >
        {/* REORDER ARROWS */}
        <div className="flex flex-col gap-1 items-center justify-center pr-2 border-r border-white/5">
          <button
            onClick={() => moveAsset(index, -1)}
            disabled={index === 0}
            className={`p-1 rounded hover:bg-white/10 ${index === 0 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-white"}`}
          >
            <ChevronUp size={10} />
          </button>
          <button
            onClick={() => moveAsset(index, 1)}
            disabled={index === 4}
            className={`p-1 rounded hover:bg-white/10 ${index === 4 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-white"}`}
          >
            <ChevronDown size={10} />
          </button>
        </div>

        {/* THUMBNAIL */}
        <div
          className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center relative ${isDark ? "bg-black border-white/10" : "bg-slate-100 border-slate-200"}`}
        >
          {type === "image" && (
            <img
              src={url}
              alt="asset"
              className="w-full h-full object-cover pointer-events-none"
            />
          )}
          {type === "video" && <Video size={20} className="text-red-500" />}
          {type === "audio" && <Music size={20} className="text-emerald-500" />}
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0 ml-1">
          <p
            className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {type === "image" ? label : type.toUpperCase()}
          </p>
          <div className="text-[10px] truncate font-mono opacity-50 pr-2">
            {url}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => onOpenStudio(url)}
            className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-teal-500/10 hover:text-teal-400 text-slate-500" : "hover:bg-teal-50 hover:text-teal-600 text-slate-400"}`}
            title="Get Shortcode / Open Gallery"
          >
            <Code size={14} />
          </button>

          <button
            onClick={() => {
              if (confirm("Remove this asset?")) onManualInput("", assetKey);
            }}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-red-500/10 hover:text-red-500 text-slate-600" : "hover:bg-red-50 hover:text-red-500 text-slate-300"}`}
            title="Delete Asset"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      // 🚨 RESPONSIVE FIX:
      // Mobile: h-[500px] (Enough for ~5-6 cards + add button)
      // Desktop (lg): h-[750px] (Enough for 8+ cards + add button)
      // This keeps the sidebar strictly sized "like 7-8 slots worth" on larger screens.
      className={`w-full h-[500px] lg:h-[750px] rounded-[2.5rem] border-2 overflow-hidden flex flex-col ${
        isDark
          ? "bg-black/20 backdrop-blur-md border-white/10"
          : "bg-white border-slate-200"
      }`}
    >
      <div
        className={`p-6 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}
      >
        <h3
          className={`font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
        >
          <Settings2 size={16} className="text-teal-500" />
          Media Stream
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {contentSlots.map((key, i) => (
          <AssetCard
            key={key}
            assetKey={key}
            label={`Asset ${i + 1}`}
            index={i}
          />
        ))}

        {/* --- ADD BUTTON --- */}
        <div className="mt-4">
          {!isAddMenuOpen ? (
            <button
              onClick={() =>
                isFull ? alert("Max assets reached") : setIsAddMenuOpen(true)
              }
              disabled={isFull}
              className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group ${
                isFull
                  ? "opacity-50 cursor-not-allowed border-slate-700 text-slate-700"
                  : isDark
                    ? "border-white/10 text-slate-500 hover:border-teal-500/50 hover:text-teal-400 hover:bg-teal-500/5"
                    : "border-slate-200 text-slate-400 hover:border-teal-500/50 hover:text-teal-600 hover:bg-teal-50"
              }`}
            >
              {isFull ? (
                "Stream Full"
              ) : (
                <>
                  <Plus
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />{" "}
                  Add To Stream
                </>
              )}
            </button>
          ) : (
            <div
              className={`rounded-xl border p-2 animate-in zoom-in-95 duration-200 ${isDark ? "bg-black/40 border-teal-500/30" : "bg-white border-slate-200 shadow-lg"}`}
            >
              <div className="flex justify-between items-center mb-3 px-2 pt-1">
                <div className="flex items-center gap-2">
                  {activeInputMode && (
                    <button
                      onClick={() => setActiveInputMode(null)}
                      className="hover:text-white text-slate-500 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-teal-500" : "text-teal-600"}`}
                  >
                    {activeInputMode ? `Add ${activeInputMode}` : "Select Type"}
                  </span>
                </div>
                <button
                  onClick={handleCloseMenu}
                  className={`hover:text-red-500 transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <X size={14} />
                </button>
              </div>

              {!activeInputMode ? (
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => triggerUpload(nextEmptySlot)}
                    className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                  >
                    <Images size={18} />
                    <span className="text-[10px] font-bold uppercase">
                      Add Image or Gallery
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveInputMode("video")}
                      className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                    >
                      <Video size={18} />
                      <span className="text-[8px] font-bold uppercase">
                        Add Video
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveInputMode("audio")}
                      className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                    >
                      <Music size={18} />
                      <span className="text-[8px] font-bold uppercase">
                        Add Track
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              {(activeInputMode === "video" || activeInputMode === "audio") && (
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder={
                      activeInputMode === "video"
                        ? "https://youtube.com/..."
                        : "Spotify/MP3 Link..."
                    }
                    className={`w-full p-3 rounded-lg text-xs outline-none border transition-all ${isDark ? "bg-black/50 border-white/10 focus:border-teal-500 text-white" : "bg-slate-50 border-slate-200 focus:border-teal-500 text-slate-900"}`}
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualUrl}
                    className={`w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      !manualUrl
                        ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                        : isDark
                          ? "bg-teal-500 text-black hover:bg-teal-400"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Confirm Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hidden">
        {contentSlots.map((key) => (
          <input
            key={key}
            type="file"
            ref={(el) => (fileInputRefs.current[key] = el)}
            onChange={(e) => {
              onUpload(e, key);
              e.target.value = null;
            }}
            className="hidden"
          />
        ))}
      </div>
    </div>
  );
}
