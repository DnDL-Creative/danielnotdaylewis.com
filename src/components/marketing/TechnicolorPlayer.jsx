"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Loader2, AlertCircle } from "lucide-react";

export default function TechnicolorPlayer({ url }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 1. ROBUST LOADING CHECK
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state on URL change
    setIsLoading(true);
    setError(false);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);

    // If browser already cached it, unblock immediately
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
      setIsLoading(false);
    }
  }, [url]);

  // Toggle Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Event Handlers
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration)) {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = (audio.duration / 100) * e.target.value;
    audio.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full relative h-36 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-xl border border-white/20 group">
      {/* 1. TECHNICOLOR WAVE BACKGROUND */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-400 animate-gradient-x"
        style={{ backgroundSize: "400% 400%" }}
      />

      {/* 2. OVERLAY GRAIN */}
      <div className="absolute inset-0 bg-white/10 opacity-30 mix-blend-overlay" />

      {/* 3. HIDDEN AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* 4. GLASS PLAYER UI */}
      <div className="relative z-10 w-[90%] bg-white/20 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl p-4 flex items-center gap-4 transition-transform duration-500 hover:scale-[1.02]">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading || error}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white text-rose-500 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          ) : error ? (
            <AlertCircle size={20} className="text-red-500" />
          ) : isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* Progress & Time */}
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="flex justify-between text-[10px] font-bold text-white uppercase tracking-widest opacity-90 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{error ? "Error" : formatTime(duration)}</span>
          </div>

          <div className="relative w-full h-2 rounded-full bg-black/20 overflow-hidden">
            {/* Played Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-white/90 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            {/* Seek Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              disabled={isLoading || error}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Volume Icon Decoration */}
        <Volume2 size={18} className="text-white opacity-70 flex-shrink-0" />
      </div>
    </div>
  );
}
