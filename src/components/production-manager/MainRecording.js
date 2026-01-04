"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Mic,
  FileAudio,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MainRecording() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'direct', 'roster'

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .in("status", ["production", "approved", "booked"])
      .order("recording_due_date", { ascending: true });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const updateStatus = async (id, newStatus) => {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, production_status: newStatus } : i
      )
    );
    await supabase
      .from("bookings")
      .update({ production_status: newStatus })
      .eq("id", id);
  };

  const updateCRX = async (id, newStatus) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, crx_status: newStatus } : i))
    );
    await supabase
      .from("bookings")
      .update({ crx_status: newStatus })
      .eq("id", id);
  };

  const markComplete = async (id) => {
    if (!confirm("Mark project as 100% Complete & Archived?")) return;
    await supabase
      .from("bookings")
      .update({ status: "archive", end_date: new Date().toISOString() })
      .eq("id", id);
    fetchItems();
  };

  // --- FILTER ---
  const filteredItems =
    filter === "all"
      ? items
      : items.filter((i) => i.client_type?.toLowerCase() === filter);

  // --- RENDERERS ---
  const StatusPill = ({ status, onClick }) => {
    const steps = [
      "pre_production",
      "recording",
      "editing",
      "mastering",
      "done",
    ];
    const labels = {
      pre_production: "Pre-Prod",
      recording: "Recording",
      editing: "Editing",
      mastering: "Mastering",
      done: "Done",
    };
    const colors = {
      pre_production: "bg-slate-100 text-slate-500",
      recording: "bg-red-100 text-red-600 animate-pulse",
      editing: "bg-orange-100 text-orange-600",
      mastering: "bg-indigo-100 text-indigo-600",
      done: "bg-emerald-100 text-emerald-600",
    };

    const cycleStatus = () => {
      const idx = steps.indexOf(status || "pre_production");
      const next = steps[(idx + 1) % steps.length];
      if (next === "done") return;
      onClick(next);
    };

    return (
      <button
        onClick={cycleStatus}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
          colors[status] || colors["pre_production"]
        }`}
      >
        {labels[status] || status}
      </button>
    );
  };

  const CRXPill = ({ status, onClick }) => {
    if (!status || status === "none")
      return (
        <button
          onClick={() => onClick("received")}
          className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-indigo-500 border border-transparent hover:border-indigo-100 px-2 py-0.5 rounded-md transition-all"
        >
          + Add Pickups
        </button>
      );

    const styles = {
      received: "bg-pink-100 text-pink-600 border-pink-200",
      in_progress: "bg-pink-500 text-white border-pink-600 animate-pulse",
      submitted: "bg-slate-100 text-slate-400 line-through",
    };

    const cycleCRX = () => {
      if (status === "received") onClick("in_progress");
      else if (status === "in_progress") onClick("submitted");
      else onClick("none");
    };

    return (
      <button
        onClick={cycleCRX}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}
      >
        <FileAudio size={10} /> CRX: {status.replace("_", " ")}
      </button>
    );
  };

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Syncing Production Board...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <h3 className="font-black uppercase text-slate-800 ml-2">
            Active Projects
          </h3>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex gap-2">
            {["all", "direct", "roster"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">
          {filteredItems.length} In Flight
        </p>
      </div>

      {/* GRID */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 text-slate-400 font-bold uppercase tracking-widest">
          Production Board Clear
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const isRoster = item.client_type === "Roster";
            const daysLeft = item.recording_due_date
              ? Math.ceil(
                  (new Date(item.recording_due_date) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={item.id}
                className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
              >
                {/* TYPE BAR */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    isRoster ? "bg-purple-500" : "bg-blue-500"
                  }`}
                />

                {/* INFO */}
                <div className="flex-grow min-w-[200px] pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isRoster
                          ? "bg-purple-100 text-purple-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {isRoster ? "Roster" : "Direct"}
                    </span>
                    {isRoster && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.roster_producer || "Publisher"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {item.book_title}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {item.client_name}
                  </p>
                </div>

                {/* STATUS CONTROLS */}
                <div className="flex flex-col items-end gap-3 min-w-[160px]">
                  <StatusPill
                    status={item.production_status}
                    onClick={(s) => updateStatus(item.id, s)}
                  />
                  <CRXPill
                    status={item.crx_status}
                    onClick={(s) => updateCRX(item.id, s)}
                  />
                </div>

                {/* DUE DATE */}
                <div className="w-24 text-right">
                  {item.recording_due_date ? (
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                        Due
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          daysLeft < 5 ? "text-red-500" : "text-slate-700"
                        }`}
                      >
                        {new Date(item.recording_due_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-slate-200 uppercase">
                      No Date
                    </p>
                  )}
                </div>

                {/* FINISH */}
                <button
                  onClick={() => markComplete(item.id)}
                  className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-emerald-500 hover:text-white transition-all group"
                  title="Archive"
                >
                  <CheckCircle2 size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
