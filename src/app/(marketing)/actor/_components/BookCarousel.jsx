"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Headphones } from "lucide-react";

export default function BookCarousel({ slides }) {
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
            aria-hidden={idx !== current}
          >
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              unoptimized={slide.unoptimized || false}
              sizes="(max-width: 768px) 280px, 320px"
              className="object-cover"
              priority={idx === 0}
            />

            {/* --- RESPONSIVE TAG FIX (CENTERED & FULL TEXT RESTORED) --- */}
            {slide.tag && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center px-1">
                <div className="flex items-center justify-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md text-slate-900 rounded-full shadow-xl border border-white/50 cursor-default py-1.5 px-3 md:py-2 md:px-4 max-w-[95%] shadow-black/20">
                  <Headphones className="text-teal-600 w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />

                  {/* FULL TEXT ON ALL SCREENS */}
                  {/* Using whitespace-nowrap to keep it one line, and text-[8px] on mobile to make it fit */}
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                    {slide.tag}
                  </span>
                </div>
              </div>
            )}
            {/* --------------------------------------------------------- */}

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
                aria-label={`Listen to ${slide.title} on Audible`}
                className="block w-full py-3 md:py-4 bg-white text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-teal-400 hover:text-white transition-colors text-center rounded-lg shadow-lg"
              >
                Listen on Audible
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
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
