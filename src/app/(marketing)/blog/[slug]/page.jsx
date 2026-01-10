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
  Headphones,
} from "lucide-react";
import parse from "html-react-parser";

// --- CLIENT COMPONENTS ---
import PopularPosts from "@/src/app/(marketing)/blog/[slug]/_components/PostsWidget";
import ViewTracker from "@/src/app/(marketing)/blog/[slug]/_components/ViewTracker";
import GalleryCarousel from "@/src/app/(marketing)/blog/[slug]/_components/GalleryCarousel";
import MusicEqualizer from "@/src/app/(marketing)/blog/[slug]/_components/MusicEqualizer";
import TechnicolorPlayer from "@/src/app/(marketing)/blog/[slug]/_components/TechnicolorPlayer";

// --- HELPERS ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes(",")) return dateString;

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

  const suffix = getOrdinalSuffix(day);
  return `${month} ${day}${suffix}, ${year}`;
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

// --- CONSTANTS ---
const BORDER_GRADIENT =
  "bg-[linear-gradient(90deg,#0d9488_0%,#2dd4bf_70%,#6366f1_100%)]";

// --- CONTENT PARSER ---
const contentParserOptions = {
  replace: (domNode) => {
    if (
      domNode.name === "p" ||
      domNode.name === "span" ||
      domNode.name === "a"
    ) {
      if (domNode.attribs?.class) delete domNode.attribs.class;
      if (domNode.attribs?.style) delete domNode.attribs.style;
    }

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

        // 1. VIDEO
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
              <div
                className={`relative aspect-video rounded-3xl p-[2px] ${BORDER_GRADIENT} shadow-2xl`}
              >
                <div className="relative w-full h-full rounded-[calc(1.5rem-2px)] overflow-hidden bg-black">
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title="Embedded Video"
                    loading="lazy"
                  />
                </div>
              </div>
            </figure>
          );
        }

        // 2. AUDIO
        if (innerContent.startsWith("audio:")) {
          const rawUrl = innerContent.replace("audio:", "").trim();
          if (rawUrl.includes("spotify.com")) {
            const embedUrl = rawUrl.includes("/embed/")
              ? rawUrl
              : rawUrl.replace(".com/", ".com/embed/");
            return (
              <figure className="my-10 w-full md:w-2/3 mx-auto clear-both !block">
                <div
                  className={`rounded-[18px] p-[2px] ${BORDER_GRADIENT} shadow-xl`}
                >
                  <iframe
                    style={{ borderRadius: "16px", display: "block" }}
                    src={embedUrl}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </figure>
            );
          }
          return (
            <figure className="my-10 w-full md:w-2/3 mx-auto clear-both !block">
              <div
                className={`${BORDER_GRADIENT} p-[2px] rounded-full shadow-lg`}
              >
                <div className="bg-slate-50 dark:bg-slate-900 rounded-full p-2">
                  <audio key={rawUrl} controls className="w-full h-10 block">
                    <source src={rawUrl} type="audio/mpeg" />
                    <source src={rawUrl} type="audio/mp3" />
                  </audio>
                </div>
              </div>
            </figure>
          );
        }

        // 3. GALLERY (DUO/TRIO)
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

        // 4. IMAGE - FIXED: NO ZOOM, NO GREY LINE
        if (innerContent.startsWith("image:")) {
          const parts = innerContent.replace("image:", "").split("|");
          let url = parts[0].trim();

          if (url.match(/\.(mp3|wav|ogg|m4a)($|\?)/i)) {
            return (
              <figure className="my-8 w-full md:w-2/3 mx-auto clear-both !block">
                <div
                  className={`${BORDER_GRADIENT} p-[2px] rounded-full shadow-lg`}
                >
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-full p-2">
                    <audio key={url} controls className="w-full h-10 block">
                      <source src={url} type="audio/mpeg" />
                      <source src={url} type="audio/mp3" />
                    </audio>
                  </div>
                </div>
              </figure>
            );
          }

          let caption = null;
          parts.slice(1).forEach((part) => {
            const [key, val] = part.split("=").map((s) => (s ? s.trim() : ""));
            if (key === "caption") caption = val;
          });

          return (
            <figure className="my-12 w-full mx-auto clear-both block group">
              <div
                className={`relative w-full rounded-3xl p-[2px] ${BORDER_GRADIENT} shadow-2xl`}
              >
                <div className="relative w-full h-full rounded-[calc(1.5rem-2px)] overflow-hidden bg-white flex flex-col">
                  <div className="relative w-full aspect-[3/2] md:aspect-[16/9]">
                    <Image
                      src={url}
                      alt={caption || "blog image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover transition-opacity duration-300"
                    />
                  </div>
                  {caption && (
                    <figcaption className="hero-caption">{caption}</figcaption>
                  )}
                </div>
              </div>
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

  const { wordCount, readTime } = calculateReadingStats(post.content);
  const hasMusic = !!post.music_embed;
  const hasBlogcast = !!post.blogcast_url;
  const hasBoth = hasMusic && hasBlogcast;

  const safeBlogcastUrl = getBlogcastEmbed(post.blogcast_url);
  const isDirectFile =
    safeBlogcastUrl &&
    (safeBlogcastUrl.includes(".mp3") ||
      safeBlogcastUrl.includes(".wav") ||
      safeBlogcastUrl.includes(".m4a") ||
      safeBlogcastUrl.includes("supabase.co"));
  const isIframeBlogcast = safeBlogcastUrl && !isDirectFile;

  const CIRCLE_IMAGE_URL =
    "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/blog-images/no-ai-pledge-100-percent-human-written-blog-daniel-not-day-lewis.png";

  return (
    <div className="min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      {/* --- INJECT VIEW TRACKER HERE --- */}
      <ViewTracker slug={slug} />

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-white to-indigo-50/20 md:bg-white" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        <div className="hidden md:block absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-pulse-slow" />
        <div className="hidden md:block absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-pulse-slow delay-700" />
      </div>

      {/* HERO SECTION */}
      <div className="relative z-0 pt-4 md:pt-10 pb-2 md:pb-6 px-4 md:px-6">
        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-up">
          <figure className="relative w-full mb-0 group md:max-w-3xl mx-auto">
            {/* Outer Wrapper with Gradient Border */}
            <div
              className={`relative w-full rounded-3xl md:rounded-[2.5rem] p-[2px] ${BORDER_GRADIENT} shadow-2xl`}
            >
              {/* Inner Wrapper - Flex Column to Stack Image + Caption */}
              <div className="relative w-full h-full rounded-[calc(1.5rem-2px)] md:rounded-[calc(2.5rem-2px)] overflow-hidden bg-white flex flex-col">
                {/* Image Container with Aspect Ratio */}
                <div className="relative w-full aspect-video">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Caption Inside the Card - No extra borders */}
                {post.image_caption && (
                  <figcaption className="hero-caption">
                    {post.image_caption}
                  </figcaption>
                )}
              </div>
            </div>
          </figure>

          {/* HERO TITLE */}
          <h1 className="hero-title mt-8 md:mt-12">
            <span className="hero-text-gradient">{post.title}</span>
          </h1>

          {/* TAGS SECTION */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-6 md:mb-12">
            <div className="flex items-center gap-1.5 md:gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Calendar size={10} className="md:w-3 md:h-3 text-teal-600" />
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-600">
                {formatDate(post.date)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Tag size={10} className="md:w-3 md:h-3 text-indigo-600" />
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-600">
                {post.tag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Clock size={10} className="md:w-3 md:h-3 text-rose-500" />
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-600">
                {wordCount} words | ~{readTime}{" "}
                {hasBlogcast ? "min blogcast" : "min read"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MEDIA DASHBOARD --- */}
      {(hasMusic || hasBlogcast) && (
        <div
          className={`mx-auto px-4 md:px-6 mb-8 md:mb-16 relative z-10 animate-fade-in-up delay-100 ${hasBoth ? "max-w-7xl" : "max-w-3xl"}`}
        >
          <div
            className={`grid gap-5 ${hasBoth ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* MUSIC CARD */}
            {hasMusic && (
              <div
                className={`relative group rounded-[2rem] p-[2px] ${BORDER_GRADIENT} shadow-xl`}
              >
                <div className="absolute inset-0 bg-white/95 rounded-[calc(2rem-2px)]" />
                <div className="relative h-full bg-white/50 backdrop-blur-xl rounded-[calc(2rem-2px)] overflow-hidden p-5 md:p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                        <Disc
                          size={22}
                          className="animate-spin-slow"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="mb-2 flex h-2 w-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
                          <h3 className="text-base md:text-lg font-bold text-slate-900 leading-none tracking-tight">
                            Background Music
                          </h3>
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 pl-4">
                          Inspiration
                        </h4>
                      </div>
                    </div>
                    <div className="hidden sm:block scale-75 origin-right">
                      <MusicEqualizer color="teal" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
                    Music fuels my writing. Here's the track that fueled this
                    one. Hit play, (login to Spotify), and listen-read along.
                  </p>

                  <div className="mt-auto w-full">
                    <div className="w-full rounded-xl overflow-hidden shadow-sm min-h-[152px] bg-slate-50 border border-slate-100">
                      <div
                        className="w-full [&>iframe]:w-full [&>iframe]:block"
                        dangerouslySetInnerHTML={{ __html: post.music_embed }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BLOGCAST CARD */}
            {hasBlogcast && (
              <div
                className={`relative group rounded-[2rem] p-[2px] ${BORDER_GRADIENT} shadow-xl`}
              >
                <div className="absolute inset-0 bg-white/95 rounded-[calc(2rem-2px)]" />
                <div className="relative h-full bg-white/50 backdrop-blur-xl rounded-[calc(2rem-2px)] overflow-hidden p-5 md:p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                        <Mic2 size={22} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="mb-2 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                          <h3 className="text-base md:text-lg font-bold text-slate-900 leading-none tracking-tight">
                            Blogcast Enabled
                          </h3>
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 pl-4">
                          Audio Version
                        </h4>
                      </div>
                    </div>
                    <div className="hidden sm:block scale-75 origin-right">
                      <MusicEqualizer color="rose" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
                    Prefer listening? I’ve recorded a narration of this post.
                    Think of it as a solo, personal podcast.
                  </p>

                  <div className="mt-auto w-full">
                    {isIframeBlogcast ? (
                      <div className="w-full rounded-xl overflow-hidden shadow-sm min-h-[152px] bg-black">
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
                      <TechnicolorPlayer url={safeBlogcastUrl} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ARTICLE CONTENT */}
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-2 md:py-8 animate-fade-in relative z-10">
        <div className="blog-content flow-root max-w-none mx-auto">
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

      {/* --- CIRCLE IMAGE SECTION --- */}
      <div className="w-full max-w-[250px] mx-auto px-4 mb-6 relative z-10">
        <div
          className={`aspect-square rounded-full overflow-hidden shadow-2xl p-[2px] ${BORDER_GRADIENT} relative mx-auto`}
        >
          <div className="w-full h-full rounded-full overflow-hidden relative bg-white">
            <Image
              src={CIRCLE_IMAGE_URL}
              alt="Author Circle"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </div>
      </div>

      {/* POPULAR POSTS */}
      <div className="w-full px-4 md:px-6 pt-8 pb-24 clear-both relative z-10">
        <PopularPosts currentSlug={slug} />
      </div>

      {/* CTA FOOTER */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-24 relative z-10">
        <div className="bg-white rounded-[3rem] p-12 md:p-16 text-center shadow-2xl shadow-indigo-900/10 border border-slate-100 relative overflow-hidden group">
          <div
            className={`absolute top-0 left-0 w-full h-2 ${BORDER_GRADIENT}`}
          />
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
            href="/collab"
            className="relative z-10 inline-flex items-center gap-4 bg-slate-900 text-white pl-10 pr-8 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-teal-600 transition-all shadow-xl hover:shadow-teal-500/20 group-hover:-translate-y-1"
          >
            Get in Touch <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

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
