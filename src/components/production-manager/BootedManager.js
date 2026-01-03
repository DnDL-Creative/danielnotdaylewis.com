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
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BootedManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("booted"); // 'booted' or 'archive'

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .in("status", ["booted", "archive"])
      .order("boot_date", { ascending: false });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const updateField = async (id, field, value) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    await supabase
      .from("bookings")
      .update({ [field]: value })
      .eq("id", id);
  };

  const toggleBlacklist = async (id, currentVal) => {
    const newVal = !currentVal;
    setItems(
      items.map((i) => (i.id === id ? { ...i, is_blacklisted: newVal } : i))
    );
    await supabase
      .from("bookings")
      .update({ is_blacklisted: newVal })
      .eq("id", id);
    if (newVal) alert("Client Blacklisted. Do not contact.");
  };

  const reviveProject = async (id) => {
    if (!confirm("Bring this project back to the Inbox?")) return;
    await supabase
      .from("bookings")
      .update({ status: "pending", boot_date: null })
      .eq("id", id);
    fetchItems();
  };

  const deleteForever = async (id) => {
    if (!confirm("PERMANENTLY DELETE? This cannot be undone.")) return;
    await supabase.from("bookings").delete().eq("id", id);
    fetchItems();
  };

  // --- FILTERS ---
  const bootedItems = items.filter((i) => i.status === "booted");
  const archivedItems = items.filter((i) => i.status === "archive");
  const displayedItems = view === "booted" ? bootedItems : archivedItems;

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Loading Graveyard...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* TOGGLE HEADER */}
      <div className="flex gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={() => setView("booted")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === "booted"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "text-slate-400 hover:bg-slate-100"
          }`}
        >
          <Skull size={16} /> The Boot ({bootedItems.length})
        </button>
        <button
          onClick={() => setView("archive")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === "archive"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-100"
          }`}
        >
          <FileX size={16} /> Archive ({archivedItems.length})
        </button>
      </div>

      {displayedItems.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 text-slate-400 font-bold uppercase tracking-widest">
          No {view} projects found
        </div>
      ) : (
        displayedItems.map((item) => {
          const isBooted = item.status === "booted";
          const needsRefund = item.checklist_deposit_paid && isBooted;

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-[2rem] p-6 shadow-sm transition-all group ${
                isBooted
                  ? "border-red-100 ring-1 ring-red-50"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                {/* ICON & INFO */}
                <div className="flex items-center gap-4 w-full lg:w-1/3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                      isBooted
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {item.is_blacklisted ? (
                      <AlertOctagon size={28} />
                    ) : isBooted ? (
                      <Skull size={28} />
                    ) : (
                      <FileX size={28} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none mb-1">
                      {item.book_title}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {item.client_name}
                    </p>

                    {isBooted && (
                      <div className="flex gap-2 mt-2">
                        <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          Booted
                        </span>
                        {item.is_blacklisted && (
                          <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Ban size={8} /> Blacklisted
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* REFUND CONTROLS (Only if Booted + Deposit Paid) */}
                <div className="flex-grow w-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                  {needsRefund ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                          <DollarSign size={12} /> Refund Required
                        </span>
                        <select
                          className={`border-none text-xs font-bold uppercase rounded-lg p-1 outline-none cursor-pointer ${
                            item.refund_status === "completed"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                          value={item.refund_status || "needed"}
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "refund_status",
                              e.target.value
                            )
                          }
                        >
                          <option value="needed">Refund Needed</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Refunded</option>
                        </select>
                      </div>

                      {item.refund_status !== "completed" && (
                        <div className="flex gap-2">
                          <input
                            placeholder="$$$"
                            className="w-20 bg-slate-50 p-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-red-200"
                            value={item.refund_amount || ""}
                            onChange={(e) =>
                              updateField(
                                item.id,
                                "refund_amount",
                                e.target.value
                              )
                            }
                          />
                          <input
                            placeholder="Refund Link / Notes"
                            className="flex-grow bg-slate-50 p-2 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-red-200"
                            value={item.refund_link || ""}
                            onChange={(e) =>
                              updateField(
                                item.id,
                                "refund_link",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                      {isBooted ? "No Refund Owed" : "Archived Project"}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="w-full lg:w-auto flex lg:flex-col gap-2 justify-end min-w-[120px]">
                  {isBooted && (
                    <button
                      onClick={() =>
                        toggleBlacklist(item.id, item.is_blacklisted)
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        item.is_blacklisted
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500"
                      }`}
                    >
                      <ShieldAlert size={14} />{" "}
                      {item.is_blacklisted ? "Blacklisted" : "Blacklist"}
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => reviveProject(item.id)}
                      className="flex-1 p-2 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-100 flex justify-center"
                      title="Revive"
                    >
                      <Undo2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteForever(item.id)}
                      className="flex-1 p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex justify-center"
                      title="Delete Forever"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
