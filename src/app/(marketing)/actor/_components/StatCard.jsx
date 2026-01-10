"use client";
import { useState, useEffect } from "react";

export default function StatCard({ number, label, suffix, icon }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    // Simplified increment logic for better mobile performance
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
      <div
        className="mb-3 text-slate-400 group-hover:text-teal-500 transition-colors duration-300 bg-slate-100 p-3 rounded-full group-hover:bg-teal-50"
        aria-hidden="true" // A11y Fix
      >
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1 leading-none">
        {displayCount}
        {suffix}
      </div>
      <div className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] group-hover:text-teal-600/70 transition-colors">
        {/* Changed text-slate-400 to 500 for Contrast Fix */}
        {label}
      </div>
    </div>
  );
}
