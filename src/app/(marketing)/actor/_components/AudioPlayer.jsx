"use client";
import { useState, useRef } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";

export default function AudioPlayer({ tracks }) {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // ... (Keep existing play/pause/seek logic exactly as is) ...
  // Re-paste your logic functions (playTrack, togglePlay, etc) here
  const playTrack = (src) => {
    /*...*/
  };
  const togglePlay = () => {
    /*...*/
  };
  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
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
    <div className="bg-white/80 backdrop-blur-xl p-3 md:py-3 md:px-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/60 ring-1 ring-black/5 animate-fade-in-up z-10">
      <div className="flex items-center gap-3 md:gap-4 mb-3">
        {/* ... Play Button ... */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isPlaying ? "bg-teal-500 hover:scale-105 hover:bg-teal-400" : "bg-slate-900 hover:scale-105 hover:bg-slate-800"}`}
        >
          {isPlaying ? (
            <Pause size={18} className="md:w-6 md:h-6" fill="currentColor" />
          ) : (
            <Play
              size={18}
              className="ml-1 md:w-6 md:h-6"
              fill="currentColor"
            />
          )}
        </button>

        <div className="flex-1 flex flex-col justify-center pl-2 md:pl-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-900 truncate max-w-[120px] md:max-w-none">
                {currentTitle}
              </span>
              {/* Explicit tag logic */}
            </div>
            {/* Contrast FIX: Changed text-slate-500 to text-slate-600 */}
            <span className="text-[9px] font-mono font-medium text-slate-600 whitespace-nowrap ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          {/* Slider input */}
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek time"
            className="w-full h-1 md:h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all block"
          />
        </div>
      </div>
      {/* Track Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {tracks.map((track) => (
          <button
            key={track.src}
            onClick={() => playTrack(track.src)}
            className={`py-2 px-1 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1 ${activeTrack === track.src ? "bg-teal-50 text-teal-900 border-teal-200 shadow-sm" : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
          >
            {track.title}
          </button>
        ))}
      </div>
      <audio
        ref={audioRef}
        src={activeTrack}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
