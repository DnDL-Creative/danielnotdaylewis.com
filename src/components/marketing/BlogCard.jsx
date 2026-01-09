"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react"; // <--- ADDED IMPORTS
import { Calendar, ArrowRight, Tag, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";

// --- DATE FORMATTER ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
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

export default function BlogCard({
  post,
  delay = 0,
  priority = false,
  isNew = false,
}) {
  const { wordCount, readTime } = calculateReadingStats(post.content);
  const hasBlogcast = !!post.blogcast_url;

  // --- 1. SETUP AUTH CHECK STATE ---
  // We use a ref so we can check it instantly inside the click handler
  // without triggering re-renders or waiting for async calls.
  const isAdmin = useRef(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isAdmin.current = true; // Mark as admin if logged in
      }
    };
    checkUser();
  }, []);

  // --- 2. VIEW COUNTING LOGIC ---
  const handlePostClick = () => {
    // A. CHECK FOR BOTS
    if (typeof navigator !== "undefined") {
      const isBot =
        /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex|spider|crawl|curl/i.test(
          navigator.userAgent
        );
      if (isBot) return;
    }

    // B. CHECK IF ADMIN (LOGGED IN)
    if (isAdmin.current) {
      // console.log("Admin click ignored.");
      return;
    }

    // C. FIRE AND FORGET
    const supabase = createClient();
    supabase
      .rpc("increment_view", { page_slug: post.slug })
      .then(({ error }) => {
        if (error) console.error("Error tracking view:", error);
      });
  };

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="block h-full"
        onClick={handlePostClick} // <--- TRACKER ATTACHED
      >
        {/* OUTER CONTAINER */}
        <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden p-[2px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] bg-white transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.25)] hover:-translate-y-2">
          {/* SNAKE BORDER */}
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
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-white/95 backdrop-blur-sm text-teal-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-teal-100">
                  <Tag size={9} className="text-teal-600" />
                  {post.tag}
                </span>
              </div>

              {/* --- NEW POST SHINY BADGE --- */}
              {isNew && (
                <div className="absolute top-3 right-3 z-20">
                  <div className="relative bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-yellow-200 flex items-center gap-1 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] w-[80%] -translate-x-[200%] animate-[shine_3s_infinite]" />
                    <Sparkles size={10} className="text-yellow-700" />
                    <span>New Post</span>
                  </div>
                </div>
              )}
            </div>

            {/* CONTENT AREA */}
            <div className="p-5 flex flex-col flex-grow bg-white border-t border-slate-100">
              {/* META ROW */}
              <div className="flex items-center gap-2 mb-3 w-full overflow-hidden">
                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase text-slate-500">
                  <Calendar size={10} className="text-indigo-500" />
                  <span className="whitespace-nowrap">
                    {formatDate(post.date)}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-slate-200 shrink-0"></div>
                <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold uppercase text-slate-500">
                  <Clock size={10} className="text-rose-500 shrink-0" />
                  <span className="truncate tracking-tight">
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
        @keyframes shine {
          0% {
            transform: translateX(-200%) skewX(-20deg);
          }
          40% {
            transform: translateX(300%) skewX(-20deg);
          }
          100% {
            transform: translateX(300%) skewX(-20deg);
          }
        }
        .animate-border-spin {
          animation: border-spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
