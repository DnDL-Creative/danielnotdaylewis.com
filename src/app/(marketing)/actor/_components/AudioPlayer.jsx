"use client";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, ChevronDown, Music, X, AlertCircle } from "lucide-react";

export default function AudioPlayer({ tracks }) {
  // Default to the first track so the player isn't empty on load
  const [activeTrack, setActiveTrack] = useState(tracks[0]?.src || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef(null);

  // --- 1. PLAY / PAUSE LOGIC ---
  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Small promise safety check
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => console.error("Playback failed:", error));
      }
    }
  };

  // --- 2. SELECT SPECIFIC TRACK LOGIC ---
  const playTrack = (src, e) => {
    if (e) e.stopPropagation();
    if (activeTrack === src) {
      togglePlay();
    } else {
      setActiveTrack(src);
      setIsPlaying(true);
    }
  };

  // --- 3. EFFECT: AUTO-PLAY ON TRACK CHANGE ---
  // Only auto-play if the user has already interacted/is playing
  useEffect(() => {
    if (activeTrack && isPlaying && audioRef.current) {
      // Small delay to allow DOM to update source
      const timeout = setTimeout(() => {
        audioRef.current.play().catch((e) => {
          console.error("Playback error:", e);
          setIsPlaying(false);
        });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [activeTrack]);

  // --- 4. AUDIO EVENT HANDLERS ---
  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const currentTrackObj = tracks.find((t) => t.src === activeTrack);
  const currentTitle = currentTrackObj?.title || "Select a Demo";
  const isExplicit = currentTrackObj?.explicit || false;

  return (
    <div className="relative w-full pointer-events-auto flex flex-col items-end">
      {/* 1. STICKY TRIGGER TAB (When Collapsed) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-full shadow-2xl hover:scale-105 hover:bg-teal-950 transition-all duration-300 animate-fade-in-up"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? "bg-teal-500 text-slate-900" : "bg-slate-800 text-white"}`}
          >
            <Music size={14} className={isPlaying ? "animate-pulse" : ""} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-teal-400 transition-colors">
              Listen to Demos
            </span>
          </div>
          {isPlaying && (
            <div className="flex gap-0.5 ml-2">
              <div className="w-0.5 h-3 bg-teal-400 animate-[music-bar_1s_ease-in-out_infinite]" />
              <div className="w-0.5 h-3 bg-teal-400 animate-[music-bar_1s_ease-in-out_infinite_0.2s]" />
              <div className="w-0.5 h-3 bg-teal-400 animate-[music-bar_1s_ease-in-out_infinite_0.4s]" />
            </div>
          )}
        </button>
      )}

      {/* 2. COMPACT POPUP PLAYER (When Expanded) */}
      <div
        className={`bg-white/95 backdrop-blur-2xl p-5 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] border border-white/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-full md:w-[420px] ${
          isExpanded
            ? "translate-y-0 opacity-100 scale-100 h-auto"
            : "translate-y-20 opacity-0 scale-95 h-0 pointer-events-none"
        }`}
      >
        {/* Header / Collapse logic */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Audiobook Demos
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronDown size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Player Core */}
        <div className="flex items-center gap-4 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <button
            onClick={togglePlay}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
              isPlaying
                ? "bg-teal-500 hover:bg-teal-600"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-1" />
            )}
          </button>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
                  {currentTitle}
                </span>
                {isExplicit && (
                  <span className="flex-shrink-0 text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded animate-pulse">
                    E
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400 whitespace-nowrap ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Custom Range Slider */}
            <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Selection Grid (Even Buttons) */}
        <div className="grid grid-cols-2 gap-2">
          {tracks.map((track) => (
            <button
              key={track.src}
              onClick={(e) => playTrack(track.src, e)}
              className={`
                relative group flex flex-col items-start justify-between p-3 rounded-xl border transition-all duration-200 h-full text-left
                ${
                  activeTrack === track.src
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                    : "bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:bg-teal-50/50 hover:text-slate-900"
                }
              `}
            >
              <span className="text-[10px] font-black uppercase tracking-wider leading-tight pr-4">
                {track.title}
              </span>

              {/* Explicit Warning in Grid */}
              {track.explicit && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`flex h-1.5 w-1.5 rounded-full ${activeTrack === track.src ? "bg-red-500" : "bg-red-400"}`}
                  >
                    <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75"></span>
                  </span>
                  <span
                    className={`text-[8px] font-bold tracking-widest ${activeTrack === track.src ? "text-red-400" : "text-red-400"}`}
                  >
                    EXPLICIT
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={activeTrack}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      />

      <style jsx>{`
        @keyframes music-bar {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
}
