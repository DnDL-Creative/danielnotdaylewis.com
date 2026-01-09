"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Tag, Clock } from "lucide-react";

// --- DATE FORMATTER (Added this helper) ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Check if invalid date
  if (isNaN(date.getTime())) return dateString;

  const month = date.toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
};

// --- HELPER FUNCTION ---
function calculateReadingStats(htmlContent) {
  if (!htmlContent) return { wordCount: 0, readTime: 0 };
  const textWithoutScripts = htmlContent.replace(
    /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  const text = textWithoutScripts.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerMinute = 9500 / 60;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readTime: readTime < 1 ? 1 : readTime };
}

export default function BlogCard({ post, delay = 0, priority = false }) {
  const { wordCount, readTime } = calculateReadingStats(post.content);
  const hasBlogcast = !!post.blogcast_url;

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* OUTER CONTAINER */}
        <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden p-[2px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] bg-white transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.25)] hover:-translate-y-2">
          {/* SNAKE BORDER (Hidden on Mobile) */}
          <div
            className="hidden md:block absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #0d9488 360deg)`,
            }}
          />

          {/* INNER CARD */}
          <div className="relative h-full flex flex-col bg-white rounded-[1.4rem] overflow-hidden">
            {/* IMAGE AREA */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority={priority}
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />

              {/* TAG BADGE */}
              <div className="absolute top-3 left-3">
                <span className="bg-white/95 backdrop-blur-sm text-teal-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-teal-100">
                  <Tag size={9} className="text-teal-600" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-5 flex flex-col flex-grow bg-white border-t border-slate-100">
              {/* --- META ROW (FIXED: ALWAYS ONE LINE) --- */}
              <div className="flex items-center gap-2 mb-3 w-full overflow-hidden">
                {/* Date: Shrink-0 ensures date never gets crushed */}
                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase text-slate-500">
                  <Calendar size={10} className="text-indigo-500" />
                  {/* APPLIED FIX HERE: Wrapped post.date in formatDate() */}
                  <span className="whitespace-nowrap">
                    {formatDate(post.date)}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="h-3 w-[1px] bg-slate-200 shrink-0"></div>

                {/* Stats: min-w-0 allows truncate to work inside flex */}
                <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold uppercase text-slate-500">
                  <Clock size={10} className="text-rose-500 shrink-0" />
                  <span className="truncate tracking-tight">
                    {/* Compacted text slightly to ensure fit on small screens */}
                    {wordCount} words • {readTime}{" "}
                    {hasBlogcast ? "min listen" : "min read"}
                  </span>
                </div>
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-black leading-snug text-slate-800 group-hover:text-teal-600 transition-colors duration-300 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* FOOTER */}
              <div className="mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                    Read Post
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight
                      size={12}
                      className="-ml-0.5 group-hover:ml-0 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        @keyframes border-spin {
          100% {
            transform: rotate(-360deg);
          }
        }
        .animate-border-spin {
          animation: border-spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
