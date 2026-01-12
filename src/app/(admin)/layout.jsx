import Link from "next/link";
import { LogOut, Home } from "lucide-react"; // ✅ Changed to Home
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* 🚨 VERTICAL STACK - BOTTOM LEFT */}
      <div className="fixed bottom-14 left-4 z-[100] flex flex-col gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700/50 shadow-2xl opacity-40 hover:opacity-100 transition-all duration-300">
        {/* BUTTON 1: Back to Home (Keep Session) */}
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-teal-600 transition-all"
          title="Back to Home"
        >
          <Home size={16} />
        </Link>

        {/* Divider */}
        <div className="h-px w-4 bg-white/10 mx-auto"></div>

        {/* BUTTON 2: Log Out (Kill Session) */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-red-600 transition-all"
            title="Log Out"
          >
            <LogOut size={16} className="translate-x-0.5" />
          </button>
        </form>
      </div>

      <main className="w-full">{children}</main>
    </div>
  );
}
