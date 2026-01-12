"use client";
import { useState } from "react";
import Image from "next/image";
import { Play, Video as VideoIcon } from "lucide-react";

export default function VideoFacade({ src, poster }) {
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
          style={{ aspectRatio: "100 / 140.37" }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div
      className="relative w-full bg-black flex items-center justify-center group cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-slate-900/10"
      style={{ aspectRatio: "100 / 140.37" }}
      onClick={() => setIsPlaying(true)}
      role="button"
      aria-label="Play video testimonial"
    >
      <Image
        src={poster}
        alt="Video Thumbnail"
        fill
        className="object-cover opacity-90 group-hover:opacity-80 transition-opacity duration-300"
        // LCP FIX: Accurate sizes for mobile vs desktop column
        sizes="(max-width: 768px) 90vw, 400px"
      />

      <div className="absolute z-30 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 transition-transform duration-300">
        <Play size={32} className="text-white fill-white ml-1" />
      </div>
    </div>
  );
}
