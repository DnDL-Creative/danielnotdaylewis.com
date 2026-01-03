"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Mic2, Check, X, Calendar, ArrowRight } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuditionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("client_type", "Audition")
      .eq("status", "pending") // Only show active auditions
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const bookAudition = async (id, type) => {
    const producer = prompt("Producer / Publisher Name (Optional):") || "";

    await supabase
      .from("bookings")
      .update({
        status: "production", // Moves to Combined View
        client_type: type, // 'Direct' or 'Roster'
        roster_producer: producer,
        production_status: "pre_production",
      })
      .eq("id", id);

    fetchItems();
  };

  const archiveAudition = async (id) => {
    if (!confirm("Archive this audition?")) return;
    await supabase.from("bookings").update({ status: "archive" }).eq("id", id);
    fetchItems();
  };

  // --- ADD NEW AUDITION (Simple form) ---
  const addAudition = async () => {
    const title = prompt("Book Title:");
    if (!title) return;
    const author = prompt("Author / Client:");

    await supabase.from("bookings").insert([
      {
        book_title: title,
        client_name: author,
        client_type: "Audition",
        status: "pending",
        start_date: new Date().toISOString(), // Default
        end_date: new Date().toISOString(),
      },
    ]);
    fetchItems();
  };

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Loading Auditions...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h3 className="font-black uppercase text-slate-800 text-xl">
            Audition Log
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {items.length} Pending
          </p>
        </div>
        <button
          onClick={addAudition}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
        >
          <Mic2 size={16} /> Log Audition
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-48"
          >
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 line-clamp-2">
                {item.book_title}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                {item.client_name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => bookAudition(item.id, "Direct")}
                  className="py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                >
                  Book Direct
                </button>
                <button
                  onClick={() => bookAudition(item.id, "Roster")}
                  className="py-2 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-colors"
                >
                  Book Roster
                </button>
              </div>
              <button
                onClick={() => archiveAudition(item.id)}
                className="w-full py-2 border border-slate-100 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-red-400 hover:border-red-100 transition-colors"
              >
                Reject / Archive
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
