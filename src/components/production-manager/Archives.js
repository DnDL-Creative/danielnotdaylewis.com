"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Skull,
  Ban,
  Undo2,
  Trash2,
  ShieldAlert,
  AlertOctagon,
  Trophy,
  Star,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Archives() {
  const [bootedItems, setBootedItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("completed");

  // --- MODAL STATE ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // --- FETCH ---
  const fetchArchives = async () => {
    setLoading(true);
    try {
      // 1. GET BOOTED
      const { data: bootedData } = await supabase
        .from("7_archive")
        .select("*")
        .order("archived_at", { ascending: false });

      const mappedBooted = (bootedData || []).map((row) => {
        const details = row.original_data?.request || row.original_data || {};
        return {
          ...row,
          ...details,
          archive_id: row.id,
          request_id: details.id,
        };
      });
      setBootedItems(mappedBooted);

      // 2. GET COMPLETED
      const { data: completedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .eq("status", "archived")
        .order("end_date", { ascending: false });

      const bootedIds = mappedBooted.map((b) => b.request_id);
      const cleanCompleted = (completedData || []).filter(
        (c) => !bootedIds.includes(c.id)
      );

      setCompletedItems(cleanCompleted);
    } catch (error) {
      console.error("Error fetching archives:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // --- ACTIONS ---
  const toggleBlacklist = async (item) => {
    const newVal = !item.is_blacklisted;
    const updatedOriginal = { ...item.original_data, is_blacklisted: newVal };

    await supabase
      .from("7_archive")
      .update({ original_data: updatedOriginal })
      .eq("id", item.archive_id);

    fetchArchives();

    if (newVal)
      showAlert("Blacklisted", `Client marked as persona non grata.`, "error");
  };

  const reviveProject = (item) => {
    showAlert(
      "Revive Project",
      `Restore "${item.book_title}" to active status?`,
      "confirm",
      async () => {
        // Reset status in Table 2
        await supabase
          .from("2_booking_requests")
          .update({ status: "pending" })
          .eq("id", item.request_id || item.id);
        // If booted, delete from graveyard
        if (view === "booted") {
          await supabase.from("7_archive").delete().eq("id", item.archive_id);
        }
        fetchArchives();
        closeModal();
      }
    );
  };

  const deleteForever = (id, table) => {
    showAlert(
      "Delete Forever",
      "This action cannot be undone. Are you sure?",
      "confirm",
      async () => {
        await supabase.from(table).delete().eq("id", id);
        fetchArchives();
        closeModal();
      }
    );
  };

  // --- RENDER ---
  const displayedItems = view === "booted" ? bootedItems : completedItems;

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse flex flex-col items-center gap-4">
        <Loader2 className="animate-spin" size={32} /> Syncing History...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* --- CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up border border-slate-100 ring-1 ring-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  modal.type === "error"
                    ? "bg-red-50 text-red-500"
                    : "bg-indigo-50 text-indigo-500"
                }`}
              >
                {modal.type === "error" ? <AlertTriangle /> : <CheckCircle2 />}
              </div>
              <h3 className="text-lg font-black uppercase text-slate-900">
                {modal.title}
              </h3>
            </div>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {modal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-slate-50 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              {modal.type === "confirm" && (
                <button
                  onClick={modal.onConfirm}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs hover:bg-indigo-600"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200 pb-6">
        <button
          onClick={() => setView("completed")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            view === "completed"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2"
              : "bg-white text-slate-400 border border-slate-200"
          }`}
        >
          <Trophy
            size={16}
            className={view === "completed" ? "text-yellow-300" : ""}
          />{" "}
          Completed ({completedItems.length})
        </button>
        <button
          onClick={() => setView("booted")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            view === "booted"
              ? "bg-red-600 text-white shadow-lg shadow-red-200 ring-2 ring-red-600 ring-offset-2"
              : "bg-white text-slate-400 border border-slate-200"
          }`}
        >
          <Skull size={16} /> Booted ({bootedItems.length})
        </button>
      </div>

      {/* LIST */}
      {displayedItems.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">
            No {view} projects
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedItems.map((item) => {
            const isBooted = view === "booted";
            return (
              <div
                key={item.id || item.archive_id}
                className={`bg-white border rounded-[2.5rem] p-6 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row gap-6 items-center ${
                  isBooted ? "border-red-100" : "border-slate-100"
                }`}
              >
                <div
                  className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                    isBooted
                      ? "bg-red-50 text-red-500"
                      : "bg-emerald-50 text-emerald-500"
                  }`}
                >
                  {isBooted ? (
                    <Ban size={24} />
                  ) : (
                    <Star fill="currentColor" size={24} />
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                    {item.book_title || "Untitled"}
                  </h3>
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-2">
                    {item.client_name}
                  </p>
                  {isBooted && item.is_blacklisted && (
                    <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                      <AlertOctagon size={10} /> Blacklisted
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isBooted && (
                    <button
                      onClick={() => toggleBlacklist(item)}
                      className={`p-3 rounded-xl border transition-all ${
                        item.is_blacklisted
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-300 border-slate-200 hover:border-red-400 hover:text-red-500"
                      }`}
                      title="Toggle Blacklist"
                    >
                      <ShieldAlert size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => reviveProject(item)}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      deleteForever(
                        item.id || item.archive_id,
                        isBooted ? "7_archive" : "2_booking_requests"
                      )
                    }
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
