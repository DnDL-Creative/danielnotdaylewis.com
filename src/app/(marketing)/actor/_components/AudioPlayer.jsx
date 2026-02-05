"use client";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, ChevronDown, Music, X } from "lucide-react";

export default function AudioPlayer({ tracks }) {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef(null);

  // --- 1. PLAY / PAUSE LOGIC ---
  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (!activeTrack && tracks.length > 0) {
      setActiveTrack(tracks[0].src);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
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
  useEffect(() => {
    if (activeTrack && isPlaying && audioRef.current) {
      const timeout = setTimeout(() => {
        audioRef.current.play().catch((e) => {
          console.error("Playback error:", e);
          setIsPlaying(false);
        });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [activeTrack, isPlaying]);

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

  return (
    <div className="relative w-full pointer-events-auto flex flex-col items-end">
      {/* 1. STICKY TRIGGER TAB (When Collapsed) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPlaying ? 'bg-teal-500' : 'bg-slate-800'}`}>
            <Music size={14} className={isPlaying ? 'animate-pulse' : ''} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Listen to Demos
          </span>
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
        className={`bg-white/90 backdrop-blur-2xl p-4 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] border border-white/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-72 md:w-96 ${isExpanded
          ? "translate-y-0 opacity-100 scale-100 h-auto"
          : "translate-y-20 opacity-0 scale-95 h-0 pointer-events-none"
          }`}
      >
        {/* Header / Collapse logic */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Demo Reels
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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlay}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isPlaying ? "bg-teal-500" : "bg-slate-900"
              }`}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
                {currentTitle}
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>
        </div>

        {/* Selection Pills */}
        <div className="flex flex-wrap gap-2">
          {tracks.map((track) => (
            <button
              key={track.src}
              onClick={(e) => playTrack(track.src, e)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${activeTrack === track.src
                ? "bg-teal-500 border-teal-500 text-white shadow-md"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-900"
                }`}
            >
              {track.title}
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
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}
