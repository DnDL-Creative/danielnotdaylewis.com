"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";

export default function Countdown({ date }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState("normal");

  useEffect(() => {
    if (!date) return;

    const calculate = () => {
      const now = new Date();
      const due = new Date(date);
      const diff = due - now;

      // 1. Handle Expiration
      if (diff <= 0) {
        setTimeLeft(<span className="text-[10px] tracking-wider">DUE</span>);
        setStatus("expired");
        return;
      }

      // 2. Calculate Units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // 3. Determine Color/Status
      if (days > 2) setStatus("chill");
      else if (days > 0) setStatus("normal");
      else if (hours < 3)
        setStatus("critical"); // < 3 hours = Red Pulse
      else setStatus("urgent"); // < 24 hours = Orange

      // 4. Render Layout
      if (days > 0) {
        // > 24 Hours: Show Days
        setTimeLeft(
          <>
            <span className="text-sm font-black -mb-1">{days}</span>
            <span className="text-[8px] font-bold text-opacity-80">DAYS</span>
          </>
        );
      } else if (hours > 0) {
        // 1-23 Hours: Show Hours
        setTimeLeft(
          <>
            <span className="text-sm font-black -mb-1">{hours}</span>
            <span className="text-[8px] font-bold text-opacity-80">HRS</span>
          </>
        );
      } else {
        // < 1 Hour: Show MM:SS Ticker
        // Pad numbers (e.g. 5 -> 05)
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");

        setTimeLeft(
          <>
            <span className="text-xs font-black -mb-0.5 tracking-tighter">
              {m}:{s}
            </span>
            <span className="text-[7px] font-bold text-opacity-80">MIN</span>
          </>
        );
      }
    };

    calculate();
    // 5. High-speed interval for smooth second ticking
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!date || !timeLeft) return null;

  const styles = {
    chill:
      "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/20",
    normal:
      "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
    urgent:
      "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/20",
    critical: "bg-red-500 border-red-400 text-white animate-pulse",
    expired:
      "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,1)] animate-pulse",
  };

  const icons = {
    chill: <CheckCircle2 size={12} />,
    normal: <Clock size={12} />,
    urgent: <Flame size={12} />,
    critical: <AlertTriangle size={12} />,
    expired: <AlertOctagon size={14} className="animate-bounce" />,
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center 
        w-12 h-12 shrink-0 aspect-square rounded-xl border-2 transition-all duration-300
        leading-none gap-0.5 shadow-md
        ${styles[status]}
      `}
    >
      <div className="opacity-80 -mt-0.5">{icons[status]}</div>
      <div className="flex flex-col items-center">{timeLeft}</div>
    </div>
  );
}
