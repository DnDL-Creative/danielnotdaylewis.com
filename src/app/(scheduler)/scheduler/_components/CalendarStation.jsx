"use client";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Music,
  Mic2,
  Layers,
  Box,
  Wifi,
  Plus,
} from "lucide-react";
import styles from "../Scheduler.module.css";

// --- CONFIGURATION ---

const DISCOUNT_TIERS = [
  { days: 120, label: "8%", color: "bg-purple-500" },
  { days: 90, label: "7%", color: "bg-indigo-500" },
  { days: 60, label: "6%", color: "bg-blue-500" },
  { days: 30, label: "5%", color: "bg-teal-500" },
];

const WORDS_PER_DAY = 6975;

const DEMO_TRACKS = [
  {
    title: "Romcom",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/audiobook-demo-sweat-like-teammates-daniel-lewis.mp3",
    explicit: true,
  },
  {
    title: "Emotionally-driven",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_neverfar.mp3",
    explicit: true,
  },
  {
    title: "M/F Dialogue",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_filthy_rich_santas_female_dialogue.mp3",
    explicit: false,
  },
  {
    title: "Character-driven",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo-rtibw-amos-intro.mp3",
    explicit: false,
  },
];

const SPECS_LIST = [
  { icon: Mic2, title: "TZ Stellar X2", sub: "Vintage Warmth" },
  { icon: Layers, title: "Focusrite Scarlett", sub: "High Fidelity" },
  { icon: Box, title: "SnapStudio® Booth", sub: "-70dB Floor" },
  { icon: Wifi, title: "Source-Connect", sub: "Remote Ready" },
];

export default function CalendarStation({
  initialBookedRanges,
  wordCount,
  setWordCount,
  daysNeeded,
  setDaysNeeded,
  onDateSelect,
  showToast,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [playingDemo, setPlayingDemo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Helper: Format seconds into MM:SS
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Audio Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingDemo !== null) {
      const track = DEMO_TRACKS[playingDemo];
      const newAudio = new Audio(track.url);

      setCurrentTime(0);
      setDuration(0);

      newAudio.addEventListener("loadedmetadata", () => {
        setDuration(newAudio.duration);
      });

      newAudio.addEventListener("timeupdate", () => {
        setCurrentTime(newAudio.currentTime);
      });

      newAudio.addEventListener("ended", () => {
        setPlayingDemo(null);
        setCurrentTime(0);
      });

      newAudio.play().catch((e) => {
        console.error("Playback failed", e);
        setPlayingDemo(null);
      });

      audioRef.current = newAudio;
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [playingDemo]);

  // Scrubbing Handler
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleWordCountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(rawValue)) {
      const formatted =
        rawValue === "" ? "" : Number(rawValue).toLocaleString();
      setWordCount(formatted);
      if (rawValue > 0) {
        setDaysNeeded(Math.ceil(rawValue / WORDS_PER_DAY));
      } else {
        setDaysNeeded(0);
      }
    }
  };

  const toggleDemo = (index) =>
    setPlayingDemo(playingDemo === index ? null : index);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getDateStatus = (date) => {
    const time = date.getTime();
    const found = initialBookedRanges.find(
      (r) => time >= r.start && time <= r.end,
    );
    return found ? "booked" : "free";
  };

  const getDiscountForDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return DISCOUNT_TIERS.find((tier) => diffDays >= tier.days) || null;
  };

  const handleDateClick = (day) => {
    const rawCount = parseInt(wordCount.replace(/,/g, ""));
    if (!rawCount || rawCount <= 0) {
      showToast("Enter Word Count first", "error");
      return;
    }
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (start < today) return;

    let isBlocked = false;
    for (let i = 0; i < daysNeeded; i++) {
      const checkDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day + i,
      );
      if (getDateStatus(checkDay) !== "free") {
        isBlocked = true;
        break;
      }
    }

    if (isBlocked) {
      showToast("Not enough consecutive days.", "error");
      return;
    }
    onDateSelect(start);
  };

  // Render Calendar Helper
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return (
      <div className="grid grid-cols-7 gap-1 md:gap-3 h-full">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] md:text-[10px] font-black text-slate-300 py-2"
          >
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);

          const status = getDateStatus(date);
          const isPast = date < today;
          const isToday = date.getTime() === today.getTime();
          const discount = getDiscountForDate(date);

          // UPDATED: Increased Height (h-14 md:h-32) to take up more space
          let base =
            "relative h-14 md:h-32 rounded-lg md:rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 group overflow-hidden shadow-sm";
          let look =
            "bg-white/40 border-white/60 hover:bg-white hover:border-brand-start hover:shadow-xl hover:-translate-y-1 cursor-pointer";
          let content;

          if (isPast) {
            look =
              "bg-slate-100/60 border-slate-200 opacity-50 cursor-not-allowed";
            content = (
              <span className="text-slate-400 text-xs absolute top-2 left-2">
                {day}
              </span>
            );
          } else if (status === "booked") {
            look = "bg-red-50/80 border-red-100 cursor-not-allowed";
            content = (
              <>
                <span className="text-red-300/50 text-[10px] absolute top-2 left-2">
                  {day}
                </span>
                <span className="text-red-400/90 text-[8px] md:text-xs font-black uppercase -rotate-12 tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  Booked
                </span>
              </>
            );
          } else {
            content = (
              <span className="text-sm md:text-3xl font-bold text-slate-700 group-hover:text-primary-dark transition-transform group-hover:scale-110">
                {day}
              </span>
            );
          }

          if (isToday) {
            look += " ring-4 ring-brand-start/20 ring-offset-2 z-20";
            if (isPast) look = look.replace("opacity-50", "opacity-100");
            if (status !== "booked") look += " bg-white shadow-lg";
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast || status !== "free"}
              className={`${base} ${look}`}
            >
              {content}
              {!isPast && status === "free" && discount && (
                <div
                  className={`absolute top-2 right-2 w-2 h-2 md:w-3 md:h-3 rounded-full ${discount.color} z-10 shadow-sm ring-2 ring-white`}
                />
              )}
              {!isPast && status === "free" && (
                <Plus
                  size={16}
                  className="hidden md:block absolute bottom-2 right-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in relative z-10 px-4 md:px-0">
      <div className="lg:col-span-3 flex flex-col gap-4 h-full order-2 lg:order-1">
        {/* 1. WORD COUNT CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <label
            className={styles.inputLabel}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div className="w-1 h-3 bg-brand-start rounded-full" /> Word Count
          </label>
          <input
            type="text"
            value={wordCount}
            onChange={handleWordCountChange}
            placeholder="50,000"
            className={styles.inputField}
            style={{ fontSize: "1.875rem" }}
          />
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="h4-label text-[10px] mb-0">Est. Timeline</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {daysNeeded}
              </span>
              <span className="text-sm font-bold text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* 2. DEMOS CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <label
            className={styles.inputLabel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div className="w-1 h-3 bg-brand-mid rounded-full" /> Listen to
            Demos
          </label>
          <div className="space-y-3">
            {DEMO_TRACKS.map((track, i) => {
              const isPlaying = playingDemo === i;
              const cardClasses = isPlaying
                ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]"
                : "bg-white border-slate-200 text-slate-700 hover:border-brand-mid hover:shadow-md";

              return (
                <div
                  key={i}
                  className={`relative rounded-xl border p-3 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${cardClasses}`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                      onClick={() => toggleDemo(i)}
                    >
                      <button
                        className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm ${isPlaying ? "bg-teal-500 text-slate-900" : "bg-slate-100 text-slate-500 group-hover:bg-brand-mid group-hover:text-white"}`}
                      >
                        {isPlaying ? (
                          <Pause size={12} fill="currentColor" />
                        ) : (
                          <Play
                            size={12}
                            fill="currentColor"
                            className="ml-0.5"
                          />
                        )}
                      </button>
                      <div className="min-w-0 flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold truncate ${isPlaying ? "text-white" : "text-slate-800"}`}
                          >
                            {track.title}
                          </span>
                          {track.explicit && (
                            <span
                              className={`text-[8px] font-black px-1 rounded border ${isPlaying ? "text-white bg-red-600 border-red-500" : "text-red-500 bg-red-50 border-red-200"}`}
                            >
                              E
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isPlaying && (
                      <Music
                        size={14}
                        className="text-slate-300 flex-shrink-0"
                      />
                    )}
                  </div>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isPlaying ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
                        />
                        <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap min-w-[60px] text-right">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. SPECS TICKER (New Horizontal Layout) */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xl shadow-slate-200 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-8 whitespace-nowrap animate-[marquee_20s_linear_infinite] group-hover:[animation-play-state:paused] w-max">
            {/* Double the list for seamless loop */}
            {[...SPECS_LIST, ...SPECS_LIST, ...SPECS_LIST].map((spec, i) => (
              <div key={i} className="flex items-center gap-3 px-2">
                <div className="p-2 bg-white/10 rounded-lg text-brand-start">
                  <spec.icon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-none mb-0.5">
                    {spec.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-none">
                    {spec.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-9 bg-white/50 backdrop-blur-2xl border border-white/50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm h-full flex flex-col order-1 lg:order-2">
        <div className="flex items-center justify-between mb-6 px-1 md:px-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 md:p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50 transition-transform hover:scale-110"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">
              {currentDate.toLocaleDateString("en-US", { month: "long" })}
            </h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-1">
              {currentDate.getFullYear()}
            </p>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 md:p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50 transition-transform hover:scale-110"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex-grow">{renderCalendar()}</div>

        <div className="mt-8 grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-3 border-t border-slate-200/30 pt-8">
          {DISCOUNT_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center md:justify-start gap-2 bg-white/40 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/40"
            >
              <div
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${tier.color}`}
              />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-500">
                {tier.label} Off
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Keyframes */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          } /* Shift 1/3 because we tripled the list */
        }
      `}</style>
    </div>
  );
}
