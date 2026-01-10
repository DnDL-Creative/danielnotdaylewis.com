import React, { useState } from "react";
import {
  CloudHail,
  Radar,
  X,
  ThermometerSnowflake,
  CloudRain,
  ArrowRightLeft,
  Ghost,
} from "lucide-react";

export default function MeteorologicalEffect({
  isOpen,
  onClose,
  weatherMode,
  setWeatherMode,
  intensity,
  setIntensity,
  windVector,
  setWindVector,
  bgOpacity,
  setBgOpacity,
  isDark,
}) {
  // State to track if user is actively adjusting opacity
  const [isPeeking, setIsPeeking] = useState(false);

  if (!isOpen) return null;

  // Normal State Styles
  const bgClass = isDark
    ? "bg-[#050505]/95 border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.9)]"
    : "bg-white/95 border-slate-300 text-slate-800 shadow-2xl";

  const rangeTrackClass = isDark ? "bg-slate-800" : "bg-slate-200";

  const getWindLabel = (val) => {
    if (val === 0) return "CALM";
    const dir = val < 0 ? "WEST" : "EAST";
    return `${dir} [${Math.abs(val).toFixed(1)}]`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300">
      {/* BACKDROP 
         - Fades out completely when peeking so you see the canvas clearly 
      */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isPeeking
            ? "bg-black/0 backdrop-blur-none"
            : "bg-black/60 backdrop-blur-sm"
        }`}
        onClick={onClose}
      />

      {/* CONTROL PANEL 
         - PEEK MODE LOGIC:
           1. BG becomes nearly transparent (black/10)
           2. Border becomes bright TEAL (Active state)
           3. Inner content fades to 30%
      */}
      <div
        className={`
          relative w-full max-w-sm p-6 rounded-2xl border-2
          transition-all duration-200 ease-out
          ${
            isPeeking
              ? "bg-black/10 border-teal-400 shadow-none backdrop-blur-none scale-100"
              : `${bgClass} scale-100`
          }
        `}
      >
        {/* INNER CONTENT WRAPPER 
            This allows us to fade the text/icons while keeping the 
            outer border solid and visible.
        */}
        <div
          className={`transition-opacity duration-200 ${isPeeking ? "opacity-30 hover:opacity-100" : "opacity-100"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-current/10">
            <div className="flex items-center gap-2.5">
              <Radar
                size={20}
                className={
                  isDark ? "text-teal-400 animate-spin-slow" : "text-blue-600"
                }
              />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em]">
                  Atmosphere
                </div>
                <div className="text-[9px] opacity-50 uppercase tracking-widest font-mono">
                  Visual Control System
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTROLS */}
          <div className="space-y-6">
            {/* WEATHER MODE TOGGLES */}
            <div className="flex bg-current/5 rounded-xl p-1 gap-1 border border-current/5">
              <button
                onClick={() => setWeatherMode("snow")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider ${
                  weatherMode === "snow"
                    ? "bg-teal-500/20 text-teal-400 shadow-sm border border-teal-500/20"
                    : "opacity-50 hover:opacity-100 hover:bg-current/5"
                }`}
              >
                <ThermometerSnowflake size={14} /> Cryo
              </button>
              <button
                onClick={() => setWeatherMode("rain")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider ${
                  weatherMode === "rain"
                    ? "bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20"
                    : "opacity-50 hover:opacity-100 hover:bg-current/5"
                }`}
              >
                <CloudRain size={14} /> Acid
              </button>
            </div>

            <div className="h-px bg-current/5 w-full my-4" />

            {/* 1. DENSITY */}
            <div className="group">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-3 opacity-70">
                <span className="flex items-center gap-2">
                  <CloudHail size={12} /> Precip. Density
                </span>
                <span className="font-mono">
                  {Math.round(intensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${rangeTrackClass} accent-teal-400`}
              />
            </div>

            {/* 2. WIND */}
            <div className="group">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-3 opacity-70">
                <span className="flex items-center gap-2">
                  <ArrowRightLeft size={12} /> Wind Vector
                </span>
                <span className="font-mono">{getWindLabel(windVector)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={windVector}
                  onChange={(e) => setWindVector(parseFloat(e.target.value))}
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${rangeTrackClass} accent-blue-400`}
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-current/30 pointer-events-none" />
              </div>
            </div>

            {/* 3. EDITOR OPACITY (PEEK MODE ENABLED) */}
            <div className="group">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-3 opacity-70">
                <span className="flex items-center gap-2">
                  <Ghost size={12} /> UI Transparency
                </span>
                <span className="font-mono">{bgOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(e.target.value)}
                // Events to trigger Peek Mode
                onPointerDown={() => setIsPeeking(true)}
                onPointerUp={() => setIsPeeking(false)}
                onTouchStart={() => setIsPeeking(true)}
                onTouchEnd={() => setIsPeeking(false)}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${rangeTrackClass} accent-purple-400 relative z-50`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
