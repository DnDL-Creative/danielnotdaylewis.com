"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Skull,
  Ban,
  DollarSign,
  Undo2,
  Trash2,
  FileX,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  X,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLE_NAME = "3_onboarding_first_15";

export default function BootedManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("rejected"); // 'rejected' (Booted) or 'archived'
  const [searchQuery, setSearchQuery] = useState("");

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch rejected/archived projects joined with their tracker data
      const { data, error } = await supabase
        .from("2_booking_requests")
        .select(
          `
          *,
          tracker:3_onboarding_first_15 (
            id,
            deposit_paid,
            refund_percentage,
            refund_date,
            refund_status,
            refund_amount,
            refund_link
          )
        `
        )
        .in("status", ["rejected", "archived"])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching graveyard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---

  const updateTrackerField = async (requestId, trackerId, field, value) => {
    // Optimistic Update
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === requestId) {
          return {
            ...item,
            tracker:
              item.tracker && item.tracker.length > 0
                ? [{ ...item.tracker[0], [field]: value }]
                : [], // Handle case where tracker might be missing
          };
        }
        return item;
      })
    );

    if (trackerId) {
      await supabase
        .from(TABLE_NAME)
        .update({ [field]: value })
        .eq("id", trackerId);
    }
  };

  // Blacklist is on the parent request table usually, or we can use notes
  // Assuming you might add an 'is_blacklisted' column to 2_booking_requests or 8_do_not_contact
  // For now, let's toggle it on the request object if you have the column, otherwise we'll mock it or use notes
  const toggleBlacklist = async (item) => {
    // Check if column exists in your schema first.
    // If not, we can tag it in the 'notes' field or add the column.
    // I will assume you add 'is_blacklisted' boolean to 2_booking_requests for this to work perfectly.
    const newVal = !item.is_blacklisted;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_blacklisted: newVal } : i))
    );

    await supabase
      .from("2_booking_requests")
      .update({ is_blacklisted: newVal })
      .eq("id", item.id);

    if (newVal) {
      // Also add to Do Not Contact table for safety
      await supabase.from("8_do_not_contact").insert([
        {
          full_name: item.client_name,
          email: item.email,
          reason: "Booted/Blacklisted",
          date_last_contacted: new Date().toISOString().split("T")[0],
        },
      ]);
    }
  };

  const reviveProject = async (id) => {
    if (!confirm("Revive this project? It will move back to Pending.")) return;

    setItems((prev) => prev.filter((i) => i.id !== id));

    await supabase
      .from("2_booking_requests")
      .update({ status: "pending" })
      .eq("id", id);
  };

  const deleteForever = async (id, trackerId) => {
    if (
      !confirm(
        "PERMANENTLY DELETE? This destroys all records and cannot be undone."
      )
    )
      return;

    setItems((prev) => prev.filter((i) => i.id !== id));

    // Delete parent (cascade should handle tracker, but let's be safe)
    await supabase.from("2_booking_requests").delete().eq("id", id);
  };

  // --- FILTERS ---
  const filteredItems = items.filter((item) => {
    const matchesView = item.status === view;
    const matchesSearch = searchQuery
      ? item.book_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesView && matchesSearch;
  });

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest gap-4 animate-pulse">
        <Skull size={32} />
        Loading Graveyard...
      </div>
    );

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
        <div className="flex gap-2 bg-slate-100/50 p-1 rounded-xl">
          <button
            onClick={() => setView("rejected")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              view === "rejected"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Skull size={16} /> The Boot (
            {items.filter((i) => i.status === "rejected").length})
          </button>
          <button
            onClick={() => setView("archived")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              view === "archived"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileX size={16} /> Archive (
            {items.filter((i) => i.status === "archived").length})
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 w-full md:w-64 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search graveyard..."
            className="bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={14} className="text-slate-400 hover:text-red-500" />
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {view === "rejected" ? "booted" : "archived"} projects found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredItems.map((item) => {
            const tracker = item.tracker?.[0] || {};
            const isBooted = item.status === "rejected";
            // Refund is needed if they paid a deposit AND were booted
            const needsRefund = tracker.deposit_paid && isBooted;
            const refundStatus = tracker.refund_status || "needed"; // needed, processing, completed

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-[2.5rem] p-8 shadow-sm transition-all group relative overflow-hidden ${
                  isBooted
                    ? "border-red-100 hover:border-red-200"
                    : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                }`}
              >
                {/* BLACKLIST BANNER */}
                {item.is_blacklisted && (
                  <div className="absolute top-0 left-0 right-0 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center flex items-center justify-center gap-2">
                    <AlertOctagon size={12} /> Client Blacklisted
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* INFO BLOCK */}
                  <div className="w-full lg:w-1/3">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                          isBooted
                            ? "bg-red-50 text-red-500"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isBooted ? <Skull size={32} /> : <FileX size={32} />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none mb-2 mt-1">
                          {item.book_title}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          {item.client_name}
                        </p>
                        <div className="flex gap-2 mt-3">
                          {tracker.refund_percentage > 0 && (
                            <span className="bg-orange-100 text-orange-700 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                              {tracker.refund_percentage}% Refund Due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REFUND TRACKER (The "Money" Section) */}
                  <div className="flex-grow border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                    {needsRefund ? (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <DollarSign
                              size={14}
                              className={
                                refundStatus === "completed"
                                  ? "text-emerald-500"
                                  : "text-slate-400"
                              }
                            />
                            Refund Status
                          </span>

                          {/* STATUS PILL */}
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              refundStatus === "completed"
                                ? "bg-emerald-100 text-emerald-600"
                                : refundStatus === "processing"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600 animate-pulse"
                            }`}
                          >
                            {refundStatus === "completed" ? (
                              <CheckCircle2 size={12} />
                            ) : refundStatus === "processing" ? (
                              <Clock size={12} />
                            ) : (
                              <ShieldAlert size={12} />
                            )}
                            {refundStatus}
                          </div>
                        </div>

                        {/* INPUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                              Status
                            </label>
                            <select
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-400 transition-colors"
                              value={refundStatus}
                              onChange={(e) =>
                                updateTrackerField(
                                  item.id,
                                  tracker.id,
                                  "refund_status",
                                  e.target.value
                                )
                              }
                            >
                              <option value="needed">Needs Refund</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Paid & Closed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                              Amount ($)
                            </label>
                            <input
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-400 transition-colors"
                              value={tracker.refund_amount || ""}
                              onChange={(e) =>
                                updateTrackerField(
                                  item.id,
                                  tracker.id,
                                  "refund_amount",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                            Transaction Link / Notes
                          </label>
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-slate-400 transition-colors">
                            <ExternalLink
                              size={12}
                              className="text-slate-300 mr-2"
                            />
                            <input
                              placeholder="Paste Stripe/PayPal link here..."
                              className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none"
                              value={tracker.refund_link || ""}
                              onChange={(e) =>
                                updateTrackerField(
                                  item.id,
                                  tracker.id,
                                  "refund_link",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 p-6 border-2 border-dashed border-slate-100 rounded-2xl">
                        <CheckCircle2 size={32} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          No Refund Required
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="w-full lg:w-32 flex flex-row lg:flex-col gap-2 justify-center lg:justify-start">
                    {isBooted && (
                      <button
                        onClick={() => toggleBlacklist(item)}
                        className={`flex-1 lg:flex-none py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          item.is_blacklisted
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                        }`}
                        title="Toggle Blacklist"
                      >
                        <Ban size={14} />{" "}
                        {item.is_blacklisted ? "Banned" : "Ban"}
                      </button>
                    )}

                    <button
                      onClick={() => reviveProject(item.id)}
                      className="flex-1 lg:flex-none py-3 px-2 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-xl hover:bg-indigo-100 hover:border-indigo-200 flex items-center justify-center gap-2 transition-all"
                      title="Revive Project"
                    >
                      <Undo2 size={16} />
                    </button>

                    <button
                      onClick={() => deleteForever(item.id, tracker.id)}
                      className="flex-1 lg:flex-none py-3 px-2 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center gap-2 transition-all"
                      title="Delete Forever"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
