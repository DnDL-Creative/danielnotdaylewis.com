import { Feather } from "lucide-react";
import { createClient } from "@/src/utils/supabase/server";
import BlogGrid from "./_components/BlogGrid";

export const metadata = {
  title: "Blog | Daniel Lewis",
  description: "Lessons from exploring the alternatives space.",
};

export default async function BlogIndexPage() {
  const supabase = await createClient();

  // Fetch ALL posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true);

  return (
    <div className="pt-24 md:pt-40 relative min-h-screen w-full bg-slate-50 pb-24 px-4 overflow-hidden">
      {/* ATMOSPHERE */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-100/40 blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[80px] md:blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto">
        <header className="text-center mb-10 max-w-2xl mx-auto animate-fade-in relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
            <Feather size={12} className="text-teal-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              100% Human-written words
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black pb-6 tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-slate-200 via-teal-600 to-slate-800 drop-shadow-md">
            Blog
          </h1>

          <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Lessons from exploring the alternatives space.
          </p>
        </header>

        {/* Client Component for Sorting */}
        <BlogGrid initialPosts={posts || []} />
      </div>
    </div>
  );
}
