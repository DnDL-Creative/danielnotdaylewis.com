import { createClient } from "@/src/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Tag,
  Clock,
  Mail,
  ArrowRight,
  Disc,
  Mic2,
  PlayCircle,
  Headphones,
  Volume2,
} from "lucide-react";
import parse from "html-react-parser";

// --- CLIENT COMPONENTS ---
import PopularPosts from "@/src/components/marketing/PostsWidget";
import ViewCounter from "./ViewCounter";
import GalleryCarousel from "@/src/components/vibe-writer/GalleryCarousel";
import MusicEqualizer from "@/src/components/marketing/MusicEqualizer";

// --- HELPERS ---

const formatDate = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes(",")) return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const getBlogcastEmbed = (url) => {
  if (!url) return null;
  if (url.includes("soundcloud.com") && !url.includes("w.soundcloud.com")) {
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
  }
  if (url.includes("spotify.com") && !url.includes("/embed")) {
    return url
      .replace("/track/", "/embed/track/")
      .replace("/episode/", "/embed/episode/");
  }
  return url;
};

// --- CONTENT PARSER ---
const contentParserOptions = {
  replace: (domNode) => {
    if (domNode.name === "p") {
      const extractText = (node) => {
        if (node.type === "text") return node.data;
        if (node.children) return node.children.map(extractText).join("");
        return "";
      };

      const textContent = extractText(domNode);
      const cleanText = textContent ? textContent.trim() : "";

      if (cleanText.startsWith("[[") && cleanText.endsWith("]]")) {
        const innerContent = cleanText.substring(2, cleanText.length - 2);

        // VIDEO
        if (innerContent.startsWith("video:")) {
          const rawUrl = innerContent.replace("video:", "").trim();
          let embedUrl = rawUrl;
          if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
            const videoId =
              rawUrl.split("v=")[1]?.split("&")[0] || rawUrl.split("/").pop();
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          } else if (rawUrl.includes("vimeo.com")) {
            const videoId = rawUrl.split("/").pop();
            embedUrl = `https://player.vimeo.com/video/${videoId}`;
          }
          return (
            <figure className="my-12 w-full md:w-5/6 mx-auto clear-both !block group">
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-slate-100 dark:border-slate-800 ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.01]">
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title="Embedded Video"
                  loading="lazy"
                />
              </div>
            </figure>
          );
        }

        // AUDIO
        if (innerContent.startsWith("audio:")) {
          const rawUrl = innerContent.replace("audio:", "").trim();
          if (rawUrl.includes("spotify.com")) {
            const embedUrl = rawUrl.includes("/embed/")
              ? rawUrl
              : rawUrl.replace(".com/", ".com/embed/");
            return (
              <figure className="my-10 w-full md:w-2/3 mx-auto clear-both !block">
                <iframe
                  style={{ borderRadius: "16px" }}
                  src={embedUrl}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allowFullScreen
                  loading="lazy"
                  className="shadow-xl"
                />
              </figure>
            );
          }
          return (
            <figure className="my-10 w-full md:w-2/3 mx-auto clear-both !block">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-3 shadow-lg">
                <audio key={rawUrl} controls className="w-full">
                  <source src={rawUrl} type="audio/mpeg" />
                  <source src={rawUrl} type="audio/mp3" />
                </audio>
              </div>
            </figure>
          );
        }

        // GALLERY
        if (
          innerContent.startsWith("duo:") ||
          innerContent.startsWith("trio:")
        ) {
          const type = innerContent.startsWith("duo:") ? "duo" : "trio";
          const content = innerContent.replace(`${type}:`, "");
          const [urlsPart, ...params] = content.split("|caption=");
          let caption = params.length ? params[0].trim() : null;
          const urls = urlsPart
            .split("|")
            .map((u) => u.trim())
            .filter(Boolean);
          return <GalleryCarousel images={urls} caption={caption} />;
        }

        // IMAGE
        if (innerContent.startsWith("image:")) {
          const parts = innerContent.replace("image:", "").split("|");
          let url = parts[0].trim();
          // Fallback for accidental audio file in image tag
          if (url.match(/\.(mp3|wav|ogg|m4a)($|\?)/i)) {
            return (
              <figure className="my-8 w-full md:w-2/3 mx-auto clear-both !block">
                <audio
                  key={url}
                  controls
                  className="w-full border border-teal-500/20 rounded-full bg-slate-100 dark:bg-slate-900"
                >
                  <source src={url} type="audio/mpeg" />
                  <source src={url} type="audio/mp3" />
                </audio>
              </figure>
            );
          }
          let sizeClass = "w-full md:w-3/4";
          let alignClass = "!block mx-auto";
          let caption = null;
          parts.slice(1).forEach((part) => {
            const [key, val] = part.split("=").map((s) => (s ? s.trim() : ""));
            if (key === "size") {
              if (val === "small") sizeClass = "!w-full md:!w-1/3";
              if (val === "medium") sizeClass = "!w-full md:!w-1/2";
              if (val === "large") sizeClass = "!w-full md:!w-3/4";
              if (val === "full") sizeClass = "!w-full";
            }
            if (key === "align") {
              if (val === "left") alignClass = "!float-left !mr-8 !mb-4";
              else if (val === "right") alignClass = "!float-right !ml-8 !mb-4";
              else alignClass = "!block !mx-auto !clear-both";
            }
            if (key === "caption") caption = val;
          });
          return (
            <figure
              className={`group relative ${alignClass} ${sizeClass} my-12`}
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] transition-all duration-500 leading-none w-full bg-gray-100 relative border border-slate-100">
                <Image
                  src={url}
                  alt={caption || "blog image"}
                  width={1200}
                  height={800}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="block w-full h-auto object-cover"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              {caption && (
                <figcaption className="mt-4 text-center text-xs text-slate-500 font-bold tracking-widest uppercase !w-full">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }
      }
    }
  },
};

// --- STATIC PARAMS ---
export async function generateStaticParams() {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: posts } = await supabase.from("posts").select("slug");
  return posts?.map(({ slug }) => ({ slug })) || [];
}

// --- METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: post } = await supabase
    .from("posts")
    .select("title, tag, music_embed, blogcast_url")
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

// --- MAIN PAGE COMPONENT ---
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!post) notFound();

  // Helper used below
  const { wordCount, readTime } = calculateReadingStats(post.content);

  const hasMusic = !!post.music_embed;
  const hasBlogcast = !!post.blogcast_url;
  const hasBoth = hasMusic && hasBlogcast;
  const safeBlogcastUrl = getBlogcastEmbed(post.blogcast_url);
  const isIframeBlogcast =
    safeBlogcastUrl &&
    (safeBlogcastUrl.includes("http") || safeBlogcastUrl.includes("player"));

  return (
    <div className="min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      <ViewCounter slug={slug} />

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        <div className="hidden md:block absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-pulse-slow" />
        <div className="hidden md:block absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-pulse-slow delay-700" />
      </div>

      {/* HERO SECTION */}
      <div className="relative z-0 pt-8 md:pt-24 pb-8 px-4 md:px-6">
        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-up">
          <figure className="relative w-full mb-12 group md:max-w-5xl md:mx-auto">
            <div className="relative w-full aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10 border-[8px] border-white/80 backdrop-blur-md">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {post.image_caption && (
              <figcaption className="mt-5 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                {post.image_caption}
              </figcaption>
            )}
          </figure>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight px-2 max-w-5xl mx-auto mb-8 text-slate-900">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Calendar size={14} className="text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {formatDate(post.date)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Tag size={14} className="text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {post.tag}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Clock size={14} className="text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {wordCount} words | ~{readTime} min read
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- REDESIGNED MEDIA DASHBOARD --- */}
      {(hasMusic || hasBlogcast) && (
        <div
          className={`mx-auto px-4 md:px-6 mb-20 relative z-10 animate-fade-in-up delay-100 ${hasBoth ? "max-w-7xl" : "max-w-3xl"}`}
        >
          <div
            className={`grid gap-8 ${hasBoth ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* MUSIC CARD - HIGH IMPACT */}
            {hasMusic && (
              <div className="relative group rounded-[2.5rem] p-[3px] bg-gradient-to-br from-teal-400 via-emerald-300 to-transparent shadow-2xl shadow-teal-900/10">
                <div className="absolute inset-0 bg-white/90 rounded-[2.3rem]" />
                <div className="relative h-full bg-white/50 backdrop-blur-xl rounded-[2.3rem] overflow-hidden p-6 md:p-8 flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <Disc
                          size={28}
                          className="animate-spin-slow"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">
                            Blog Background Music
                          </h3>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-none">
                          Inspiration
                        </h4>
                      </div>
                    </div>
                    {/* Equalizer Visual */}
                    <div className="hidden sm:block">
                      <MusicEqualizer color="teal" />
                    </div>
                  </div>

                  {/* Description Text - LARGE AND READABLE */}
                  <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed mb-6">
                    Music fuels my writing. So here's the track that fueled this
                    one. Hit play and read along.
                  </p>

                  {/* Embed Container */}
                  <div className="mt-auto w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-50">
                    <div
                      className="w-full [&>iframe]:w-full [&>iframe]:block"
                      dangerouslySetInnerHTML={{ __html: post.music_embed }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BLOGCAST CARD - HIGH IMPACT */}
            {hasBlogcast && (
              <div className="relative group rounded-[2.5rem] p-[3px] bg-gradient-to-br from-rose-400 via-orange-300 to-transparent shadow-2xl shadow-rose-900/10">
                <div className="absolute inset-0 bg-white/90 rounded-[2.3rem]" />
                <div className="relative h-full bg-white/50 backdrop-blur-xl rounded-[2.3rem] overflow-hidden p-6 md:p-8 flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                        <Mic2 size={28} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
                            "Blogcast" Enabled Post
                          </h3>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-none">
                          Blogcast
                        </h4>
                      </div>
                    </div>
                    {/* Audio Visual */}
                    <div className="hidden sm:block">
                      <MusicEqualizer color="rose" />
                    </div>
                  </div>

                  {/* Description Text - LARGE AND READABLE */}
                  <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed mb-6">
                    Prefer listening? I’ve recorded a narration of this post.
                    Think of it as a solo, personal podcast.
                  </p>

                  {/* Embed Container */}
                  <div className="mt-auto w-full">
                    {isIframeBlogcast ? (
                      <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black min-h-[152px]">
                        <iframe
                          src={safeBlogcastUrl}
                          width="100%"
                          height="100%"
                          className="min-h-[152px] w-full block"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center gap-3 shadow-inner">
                        <div className="w-full flex items-center justify-between px-2 opacity-40">
                          <Volume2 size={16} className="text-rose-500" />
                          <div className="h-1 w-full mx-4 bg-slate-300 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-slate-400"></div>
                          </div>
                          <span className="text-[10px] font-mono">00:00</span>
                        </div>
                        <audio
                          controls
                          className="w-full h-12"
                          style={{
                            filter:
                              "sepia(20%) saturate(150%) hue-rotate(-10deg)",
                          }}
                        >
                          <source src={safeBlogcastUrl} type="audio/mpeg" />
                          <source src={safeBlogcastUrl} type="audio/mp3" />
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ARTICLE CONTENT */}
      <article className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8 animate-fade-in relative z-10">
        <div className="blog-content flow-root prose prose-lg md:prose-xl prose-slate max-w-none mx-auto prose-p:text-slate-700 prose-headings:text-slate-900 prose-headings:font-black prose-a:text-indigo-600 prose-a:font-bold prose-a:no-underline hover:prose-a:text-teal-600 prose-img:rounded-3xl prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-slate-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-slate-800">
          {post.content ? (
            parse(post.content, contentParserOptions)
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Headphones size={32} className="opacity-40" />
              </div>
              <p className="text-lg font-medium">
                Content is currently unavailable.
              </p>
            </div>
          )}
        </div>
      </article>

      {/* POPULAR POSTS */}
      <div className="w-full px-4 md:px-6 py-32 clear-both relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-8 mb-20">
            <div className="h-px bg-slate-200 flex-1" />
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">
                Read Next
              </span>
              <div className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <PopularPosts currentSlug={slug} />
        </div>
      </div>

      {/* CTA FOOTER */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-24 relative z-10">
        <div className="bg-white rounded-[3rem] p-12 md:p-16 text-center shadow-2xl shadow-indigo-900/10 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 flex justify-center mb-8">
            <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Mail size={40} strokeWidth={1.5} />
            </div>
          </div>

          <h3 className="relative z-10 text-3xl md:text-4xl font-black uppercase text-slate-900 mb-4 tracking-tight">
            Project in mind?
          </h3>
          <p className="relative z-10 text-lg text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
            I'm always looking for interesting problems to solve. Let's create
            something meaningful.
          </p>

          <Link
            href="/contact"
            className="relative z-10 inline-flex items-center gap-4 bg-slate-900 text-white pl-10 pr-8 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-teal-600 transition-all shadow-xl hover:shadow-teal-500/20 group-hover:-translate-y-1"
          >
            Get in Touch <ArrowRight size={18} />
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
  const wordsPerMinute = 160;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readTime: readTime < 1 ? 1 : readTime };
}
