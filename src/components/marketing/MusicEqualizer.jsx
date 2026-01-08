"use client";

export default function MusicEqualizer({ color = "teal" }) {
  const bgClass = color === "rose" ? "bg-rose-400" : "bg-teal-400";

  return (
    <div className="flex gap-1 h-3 items-end">
      <div
        className={`w-1 ${bgClass} rounded-full h-full animate-music-bar-1`}
      />
      <div
        className={`w-1 ${bgClass} rounded-full h-2/3 animate-music-bar-2`}
      />
      <div
        className={`w-1 ${bgClass} rounded-full h-full animate-music-bar-3`}
      />

      <style jsx>{`
        @keyframes music-bar-1 {
          0%,
          100% {
            height: 100%;
          }
          50% {
            height: 40%;
          }
        }
        @keyframes music-bar-2 {
          0%,
          100% {
            height: 60%;
          }
          50% {
            height: 100%;
          }
        }
        @keyframes music-bar-3 {
          0%,
          100% {
            height: 80%;
          }
          50% {
            height: 30%;
          }
        }
        .animate-music-bar-1 {
          animation: music-bar-1 0.8s ease-in-out infinite;
        }
        .animate-music-bar-2 {
          animation: music-bar-2 0.9s ease-in-out infinite;
        }
        .animate-music-bar-3 {
          animation: music-bar-3 0.7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
