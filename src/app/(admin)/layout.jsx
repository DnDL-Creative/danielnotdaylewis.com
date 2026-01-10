import Link from "next/link";
import { LogOut, LayoutGrid } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server"; // Updated path to match your structure

export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* 🚨 VERTICAL STACK - BOTTOM LEFT (Above Next.js Badge) */}
      <div className="fixed bottom-14 left-4 z-[100] flex flex-col gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl opacity-40 hover:opacity-100 transition-all duration-300">
        {/* Admin Home */}
        <Link
          href="/admin"
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-teal-600 transition-all"
          title="Mission Control"
        >
          <LayoutGrid size={16} />
        </Link>

        {/* Divider */}
        <div className="h-px w-4 bg-white/10 mx-auto"></div>

        {/* Exit to Site */}
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-red-600 transition-all"
          title="Exit to Public Site"
        >
          <LogOut size={16} />
        </Link>
      </div>

      <main className="w-full">{children}</main>
    </div>
  );
}
