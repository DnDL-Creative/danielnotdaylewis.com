"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client"; // 1. CHANGE TO CLIENT
import BlogCard from "./BlogCard";

// 2. REMOVE 'async'
export default function PostsWidget({ currentSlug }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. FETCH DATA IN USEEFFECT
  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();

      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("views", { ascending: false })
        .limit(5);

      if (data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) return null;

  // Filter out the current post
  const relatedPosts = posts
    ? posts.filter((post) => post.slug !== currentSlug).slice(0, 4)
    : [];

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-24 pt-12 border-t border-slate-200 relative z-10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          Popular Reads
        </h3>
        <Link
          href="/blog"
          className="hidden md:inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {relatedPosts.map((post, index) => (
          <BlogCard key={post.slug} post={post} delay={index * 0.1} />
        ))}
      </div>

      <div className="md:hidden text-center">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-slate-100 text-slate-700 font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
        >
          See All Posts
        </Link>
      </div>
    </div>
  );
}
