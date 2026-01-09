"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import BlogCard from "./BlogCard";

export default function PostsWidget({ currentSlug }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();

      // Fetch more than needed so we can sort and filter correctly
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true);

      if (data) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const sorted = data.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          const isANew = dateA > twoWeeksAgo;
          const isBNew = dateB > twoWeeksAgo;

          if (isANew && isBNew) return dateB - dateA; // Both new? Date desc
          if (isANew) return -1; // A is new? Top
          if (isBNew) return 1; // B is new? Top
          return (b.views || 0) - (a.views || 0); // Else Views desc
        });

        setPosts(sorted);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="flex justify-between items-end mb-14">
          <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
          <div className="hidden md:block h-10 w-32 bg-slate-100 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-slate-100 rounded-[2rem]"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out current post
  const relatedPosts = posts
    ? posts.filter((post) => post.slug !== currentSlug).slice(0, 3)
    : [];

  if (relatedPosts.length === 0) return null;

  // Helper for "isNew" check in the loop
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return (
    <div className="relative z-10 w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 translate-y-[-2px]">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Read more
            </span>
          </div>

          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-200"></span>

          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Popular{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-gradient-x">
              Reads
            </span>
          </h3>
        </div>

        <Link
          href="/blog"
          className="group hidden md:inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-slate-900">
            View Archive
          </span>
          <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500 transition-all">
            <ArrowRight size={12} />
          </div>
        </Link>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {relatedPosts.map((post, index) => {
          const isNew = new Date(post.date) > twoWeeksAgo;
          return (
            <BlogCard
              key={post.slug}
              post={post}
              delay={index * 0.1}
              isNew={isNew}
            />
          );
        })}
      </div>

      {/* MOBILE BUTTON */}
      <div className="md:hidden mt-10">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center gap-3 w-full py-5 rounded-[1.5rem] bg-slate-900 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 hover:bg-teal-600 hover:scale-[1.02] transition-all duration-300"
        >
          Explore All Posts <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
