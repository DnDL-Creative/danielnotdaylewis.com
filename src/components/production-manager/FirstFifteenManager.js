"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Mic,
  Headphones,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FirstFifteenManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "f15_production") // Only show items in F15 phase
      .order("f15_due_date", { ascending: true });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const updateDate = async (id, field, value) => {
    const { error } = await supabase
      .from("bookings")
      .update({ [field]: value })
      .eq("id", id);
    if (!error) {
      setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    }
  };

  const toggleRevision = async (id, currentVal) => {
    await supabase
      .from("bookings")
      .update({ f15_revision_req: !currentVal })
      .eq("id", id);
    fetchItems();
  };

  const approveF15 = async (id) => {
    if (!confirm("Approve F15 and move to Full Production?")) return;
    await supabase
      .from("bookings")
      .update({ status: "production", checklist_f15_approved: true })
      .eq("id", id);
    fetchItems();
  };

  const failF15 = async (id) => {
    if (!confirm("Fail F15? This will move client to Booted/Refund status."))
      return;
    await supabase.from("bookings").update({ status: "booted" }).eq("id", id);
    fetchItems();
  };

  // --- RENDER HELPERS ---
  const DateInput = ({ label, value, onChange, highlight }) => (
    <div
      className={`p-3 rounded-xl border flex flex-col gap-1 ${
        highlight
          ? "bg-indigo-50 border-indigo-200"
          : "bg-white border-slate-200"
      }`}
    >
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <input
        type="date"
        className="bg-transparent text-xs font-bold text-slate-700 outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Loading F15 Queue...
      </div>
    );
  if (items.length === 0)
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 text-slate-400 font-bold uppercase tracking-widest">
        No Projects in F15 Review
      </div>
    );

  return (
    <div className="space-y-6">
      {items.map((item) => {
        // Status Logic
        const isLate =
          item.f15_due_date &&
          new Date(item.f15_due_date) < new Date() &&
          !item.f15_sent_date;
        const waitingOnClient =
          item.f15_sent_date && !item.f15_client_feedback_date;
        const inRevision = item.f15_revision_req;

        return (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
          >
            {/* Status Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                inRevision
                  ? "bg-orange-400"
                  : waitingOnClient
                  ? "bg-purple-400"
                  : isLate
                  ? "bg-red-500"
                  : "bg-teal-500"
              }`}
            />

            <div className="flex flex-col xl:flex-row gap-8">
              {/* LEFT: INFO */}
              <div className="w-full xl:w-1/4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {item.ref_number || "NO REF"}
                    </span>
                    {inRevision && (
                      <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Revision Mode
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">
                    {item.book_title}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm">
                    {item.client_name}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm text-indigo-500">
                    <Headphones size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Current Step
                    </p>
                    <p className="text-xs font-bold text-indigo-900">
                      {inRevision
                        ? "Recording Round 2"
                        : waitingOnClient
                        ? "Waiting on Client"
                        : isLate
                        ? "OVERDUE"
                        : "Recording Round 1"}
                    </p>
                  </div>
                </div>
              </div>

              {/* MIDDLE: TIMELINE GRID */}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Round 1 */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-[9px]">
                      1
                    </span>{" "}
                    Round 1
                  </h4>
                  <DateInput
                    label="My Due Date"
                    value={item.f15_due_date}
                    onChange={(val) => updateDate(item.id, "f15_due_date", val)}
                    highlight={isLate}
                  />
                  <DateInput
                    label="Sent On"
                    value={item.f15_sent_date}
                    onChange={(val) =>
                      updateDate(item.id, "f15_sent_date", val)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[9px]">
                      2
                    </span>{" "}
                    Client
                  </h4>
                  <DateInput
                    label="Client Due"
                    value={item.f15_client_due_date}
                    onChange={(val) =>
                      updateDate(item.id, "f15_client_due_date", val)
                    }
                  />
                  <DateInput
                    label="Feedback Recv"
                    value={item.f15_client_feedback_date}
                    onChange={(val) =>
                      updateDate(item.id, "f15_client_feedback_date", val)
                    }
                  />
                </div>

                {/* Revisions (Conditional) */}
                <div
                  className={`space-y-2 transition-opacity ${
                    inRevision ? "opacity-100" : "opacity-30 grayscale"
                  }`}
                >
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[9px]">
                      3
                    </span>{" "}
                    Round 2
                  </h4>
                  <DateInput
                    label="R2 Due"
                    value={item.f15_r2_due_date}
                    onChange={(val) =>
                      updateDate(item.id, "f15_r2_due_date", val)
                    }
                  />
                  <DateInput
                    label="R2 Sent"
                    value={item.f15_r2_sent_date}
                    onChange={(val) =>
                      updateDate(item.id, "f15_r2_sent_date", val)
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-end">
                  <button
                    onClick={() =>
                      toggleRevision(item.id, item.f15_revision_req)
                    }
                    className={`p-3 rounded-xl text-xs font-bold uppercase tracking-widest border flex items-center justify-center gap-2 transition-all ${
                      inRevision
                        ? "bg-orange-50 border-orange-200 text-orange-600"
                        : "bg-white border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500"
                    }`}
                  >
                    <RefreshCw size={14} />{" "}
                    {inRevision ? "Revision Active" : "Trigger Revision"}
                  </button>

                  <button
                    onClick={() => approveF15(item.id)}
                    className="p-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 size={16} /> Approve & Ship
                  </button>

                  <button
                    onClick={() => failF15(item.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-red-500 mt-2 text-center"
                  >
                    Fail / Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
