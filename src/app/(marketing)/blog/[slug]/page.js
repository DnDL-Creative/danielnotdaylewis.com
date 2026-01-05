// app/blog/[slug]/page.jsx (or wherever your file is located)

import { createClient } from "../../../../utils/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Tag,
  ChevronLeft,
  ArrowRight,
  Clock,
  Mail,
} from "lucide-react";
import PopularPosts from "../../../../components/marketing/PostsWidget";
import ViewCounter from "./ViewCounter";

// --- NEW IMPORTS FOR THE HANDLER ---
import parse, { domToReact } from "html-react-parser";

// 1. STATIC PARAMS
export async function generateStaticParams() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: posts } = await supabase.from("posts").select("slug");
  return posts?.map(({ slug }) => ({ slug })) || [];
}

// 2. DYNAMIC METADATA
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: post } = await supabase
    .from("posts")
    .select("title, tag")
    .eq("slug", slug)
    .single();

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: `Read about ${post.tag} and more on Dan Lewis's blog.`,
    openGraph: {
      title: post.title,
      description: `A new post by Dan Lewis about ${post.tag}.`,
      type: "article",
    },
  };
}

// --- THE ROBUST FIX: RECURSIVE TEXT FINDER ---
const contentParserOptions = {
  replace: (domNode) => {
    // 1. Target Paragraphs (<p>)
    if (domNode.name === "p") {
      // Helper function to extract text from any nested structure (spans, bold, etc.)
      const extractText = (node) => {
        if (node.type === "text") return node.data;
        if (node.children) return node.children.map(extractText).join("");
        return "";
      };

      // 2. Get the clean text content of the paragraph
      const textContent = extractText(domNode).trim();

      // 3. Check if it matches the Shortcode pattern
      if (textContent.startsWith("[[image:") && textContent.endsWith("]]")) {
        const url = textContent.replace("[[image:", "").replace("]]", "");

        // 4. Return the FIGURE (Replacing the entire <p> tag)
        return (
          <figure className="my-8 w-full md:w-2/3 mx-auto group">
            <img
              src={url}
              alt="blog-content"
              className="rounded-xl shadow-lg w-full h-auto object-cover"
            />
            {/* Note: Since this is a shortcode, the caption is static here. 
                If you want a specific caption, write it in the paragraph BELOW this code in your editor. */}
            <figcaption className="text-center text-sm text-gray-500 mt-2 font-mono tracking-wide uppercase">
              Write Caption Here
            </figcaption>
          </figure>
        );
      }
    }
  },
};

// 4. BLOG POST COMPONENT
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!post) {
    notFound();
  }

  const { wordCount, readTime } = calculateReadingStats(post.content);

  return (
    <div className="min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 overflow-hidden">
      <ViewCounter slug={slug} />

      {/* --- GLOBAL DREAMY BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-teal-50/40" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative z-0 pt-24 pb-4 px-4 md:px-6">
        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-up">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 text-[10px] md:text-xs font-black uppercase tracking-widest group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/60 flex items-center justify-center group-hover:bg-teal-100 transition-all border border-slate-100 shadow-sm">
              <ChevronLeft size={14} />
            </div>
            All posts
          </Link>

          {/* MAIN HERO IMAGE */}
          <figure className="relative w-full mb-6 group md:max-w-4xl md:mx-auto">
            <div className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/10 border-4 border-white">
              {/* Ensure you have this domain in next.config.js for this to work */}
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {post.image_caption && (
              <figcaption className="mt-2 text-center text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-widest">
                {post.image_caption}
              </figcaption>
            )}
          </figure>

          {/* META DATA */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-4">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
              <Calendar size={10} className="text-teal-500" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {post.date}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
              <Tag size={10} className="text-indigo-500" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {post.tag}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
              <Clock size={10} className="text-amber-500" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {readTime} min
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight px-2 max-w-4xl mx-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500 animate-gradient-x">
              {post.title}
            </span>
          </h1>
        </div>
      </div>

      {/* --- MAIN CONTENT WITH PARSER --- */}
      <article className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8 animate-fade-in">
        {/* We replaced dangerouslySetInnerHTML with the parse function.
            We also added specific CSS overrides for the prose class. 
        */}
        <div className="blog-content prose prose-lg prose-slate max-w-none mx-auto prose-img:rounded-xl prose-headings:text-teal-900 prose-a:text-indigo-600">
          {post.content ? (
            parse(post.content, contentParserOptions)
          ) : (
            <p className="text-center text-slate-400 italic">
              No content found.
            </p>
          )}
        </div>
      </article>

      {/* --- POPULAR POSTS WIDGET --- */}
      <div className="w-full px-4 md:px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">
              More to Read
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <PopularPosts currentSlug={slug} />
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 pb-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 text-center shadow-xl shadow-teal-900/5 border border-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform duration-300">
              <Mail size={32} strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="relative z-10 text-xl md:text-2xl font-black uppercase text-slate-900 mb-2">
            Project in mind?
          </h3>
          <Link
            href="/contact"
            className="relative z-10 inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-teal-600 hover:scale-105 transition-all shadow-lg hover:shadow-teal-500/20"
          >
            Get in Touch <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- HELPER FUNCTION ---
function calculateReadingStats(htmlContent) {
  if (!htmlContent) return { wordCount: 0, readTime: 0 };
  const textWithoutScripts = htmlContent.replace(
    /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  const text = textWithoutScripts.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerMinute = 225;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return {
    wordCount,
    readTime: readTime < 1 ? 1 : readTime,
  };
}
