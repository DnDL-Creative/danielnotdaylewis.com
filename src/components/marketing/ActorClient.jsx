"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Video as VideoIcon,
} from "lucide-react";

/* --- 1. STATS COUNTER --- */
export function StatCard({ number, label, suffix, icon }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = number / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= number) {
        setCount(number);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [number]);

  const displayCount = Number.isInteger(number)
    ? Math.floor(count).toLocaleString()
    : count.toFixed(1);

  return (
    <div className="group relative bg-white/50 backdrop-blur-sm border border-white/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 hover:bg-white/80">
      <div className="mb-3 text-slate-400 group-hover:text-teal-500 transition-colors duration-300 bg-slate-100 p-3 rounded-full group-hover:bg-teal-50">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1 leading-none">
        {displayCount}
        {suffix}
      </div>
      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] group-hover:text-teal-600/70 transition-colors">
        {label}
      </div>
    </div>
  );
}

/* --- 2. VIDEO FACADE (SUPABASE VERTICAL) --- */
export function VideoFacade({ src, poster }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="w-full h-full relative bg-black rounded-2xl overflow-hidden animate-fade-in shadow-inner">
        <video
          className="w-full h-full object-contain"
          src={src}
          controls
          autoPlay
          playsInline
          style={{ aspectRatio: "100 / 140.37" }} // Maintains vertical aspect ratio
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    // Container enforces the vertical aspect ratio (approx 9:13) so layout doesn't jump
    <div
      className="relative w-full bg-black flex items-center justify-center group cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-slate-900/10"
      style={{ aspectRatio: "100 / 140.37" }}
      onClick={() => setIsPlaying(true)}
    >
      <Image
        src={poster}
        alt="Video Thumbnail"
        fill
        className="object-cover opacity-90 group-hover:opacity-80 transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, 400px"
      />

      <div className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md pl-2 pr-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 flex items-center gap-2 pointer-events-none">
        <VideoIcon size={12} /> Video Praise
      </div>

      <div className="absolute z-30 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 transition-transform duration-300">
        <Play size={32} className="text-white fill-white ml-1" />
      </div>
    </div>
  );
}

/* --- 3. BOOK CAROUSEL --- */
export function Carousel() {
  const slides = [
    {
      img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/a-little-crush.webp",
      title: "A Little Crush",
      subtitle: "by Kelsie Rae",
      link: "https://www.audible.com/pd/A-Little-Crush-Audiobook/B0FH5JTBXF",
    },
    {
      img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/never-far.webp",
      title: "Never Far",
      subtitle: "by A.A. Dark",
      link: "https://www.audible.com/pd/Never-Far-The-Foundation-of-Boston-Marks-Audiobook/B0F6GV9HLR",
    },
    {
      img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/dndl-website-rtibw.webp",
      title: "Right There",
      subtitle: "by Jim Christ",
      link: "https://www.audible.com/pd/Right-There-in-Black-and-White-Audiobook/B0FXMY6NMK",
    },
  ];
  const [current, setCurrent] = useState(0);
  const next = () =>
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prev = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="relative w-full max-w-[280px] md:max-w-[320px] perspective-1000 z-10">
      <div className="relative aspect-[2/3] rounded-xl shadow-2xl bg-slate-900 border-[6px] border-white overflow-hidden transform transition-transform duration-500 hover:rotate-0 rotate-1">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              idx === current
                ? "opacity-100 scale-100 z-10 translate-x-0"
                : "opacity-0 scale-95 z-0 translate-x-8"
            }`}
          >
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              sizes="(max-width: 768px) 280px, 320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-100"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white translate-y-2 hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-xl md:text-2xl font-bold leading-none mb-1 shadow-black drop-shadow-md">
                {slide.title}
              </h3>
              <p className="text-slate-300 text-xs md:text-sm mb-4 md:mb-6 uppercase tracking-wider">
                {slide.subtitle}
              </p>
              <a
                href={slide.link}
                target="_blank"
                className="block w-full py-3 md:py-4 bg-white text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-teal-400 hover:text-white transition-colors text-center rounded-lg shadow-lg"
              >
                Listen on Audible
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={prev}
          aria-label="Previous Book"
          className="bg-white text-slate-900 p-3 md:p-4 rounded-full shadow-xl hover:scale-110 hover:text-teal-600 transition-all border border-slate-100"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={next}
          aria-label="Next Book"
          className="bg-white text-slate-900 p-3 md:p-4 rounded-full shadow-xl hover:scale-110 hover:text-teal-600 transition-all border border-slate-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

/* --- 4. STICKY AUDIO PLAYER --- */
export function AudioPlayer() {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const tracks = [
    {
      title: "Emotionally-driven",
      src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_neverfar.mp3",
      explicit: true,
    },
    {
      title: "M/F Dialogue",
      src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_filthy_rich_santas_female_dialogue.mp3",
    },
    {
      title: "Character-driven",
      src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo-rtibw-amos-intro.mp3",
    },
  ];

  const playTrack = (src) => {
    if (activeTrack === src) {
      togglePlay();
    } else {
      setActiveTrack(src);
      setIsPlaying(true);
      setTimeout(() => audioRef.current.play(), 50);
    }
  };

  const togglePlay = () => {
    if (!activeTrack) {
      playTrack(tracks[0].src);
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
  const isExplicit = currentTrackObj?.explicit;

  return (
    <div className="bg-white/80 backdrop-blur-xl p-3 md:py-3 md:px-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/60 ring-1 ring-black/5 animate-fade-in-up z-10">
      <div className="flex items-center gap-3 md:gap-4 mb-3">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
            isPlaying
              ? "bg-teal-500 hover:scale-105 hover:bg-teal-400"
              : "bg-slate-900 hover:scale-105 hover:bg-slate-800"
          }`}
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

              {isExplicit && (
                <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                  <AlertCircle size={8} className="text-red-500" />
                  <span className="text-[6px] md:text-[8px] font-black uppercase text-red-500 tracking-wider">
                    Graphic
                  </span>
                </div>
              )}
            </div>

            <span className="text-[9px] font-mono font-medium text-slate-500 whitespace-nowrap ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

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

      <div className="grid grid-cols-3 gap-2">
        {tracks.map((track) => (
          <button
            key={track.src}
            onClick={() => playTrack(track.src)}
            className={`py-2 px-1 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1
                 ${
                   activeTrack === track.src
                     ? "bg-teal-50 text-teal-900 border-teal-200 shadow-sm"
                     : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                 }
               `}
          >
            {track.title}
            {track.explicit && (
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            )}
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
