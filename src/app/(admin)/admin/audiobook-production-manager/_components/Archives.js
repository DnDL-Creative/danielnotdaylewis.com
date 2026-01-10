"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Skull,
  Undo2,
  Trash2,
  ShieldAlert,
  Trophy,
  Loader2,
  CalendarDays,
  User,
  Mail,
  BookOpen,
  Briefcase,
  AlertOctagon,
  Ban,
  X,
  AlertTriangle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- HELPERS ---
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const str = String(dateString);
    const [year, month, day] = str.split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return new Date(dateString);
    return new Date(year, month - 1, day);
  } catch (e) {
    console.error("Date error:", e);
    return new Date();
  }
};

export default function Archives() {
  const [bootedItems, setBootedItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("completed"); // completed | booted | deleted

  // --- MODAL STATE ---
  const [modal, setModal] = useState({
    isOpen: false,
    type: null, // 'trash' | 'wipe' | 'restore' | 'dnc' | 'dnc-remove'
    item: null,
  });
  const [dncReason, setDncReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // --- FETCH ---
  const fetchArchives = async () => {
    setLoading(true);
    try {
      // 1. GET BOOTED (From Table 6_archive based on Schema)
      const { data: bootedData } = await supabase
        .from("6_archive")
        .select("*")
        .order("archived_at", { ascending: false });

      const mappedBooted = (bootedData || []).map((row) => {
        // Handle nested or flat structure depending on how it was saved
        const details = row.original_data?.request || row.original_data || {};
        return {
          ...details,
          ...row,
          archive_id: row.id, // CRITICAL: This is the ID for table 6
          request_id: details.id || row.original_data?.id, // ID for table 2
          status: "booted",
        };
      });
      setBootedItems(mappedBooted);

      // 2. GET COMPLETED
      const { data: completedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .in("status", ["archived", "completed"])
        .order("end_date", { ascending: false });

      // Filter out items that are physically in the archive table to avoid dupes
      const bootedIds = mappedBooted.map((b) => b.request_id);
      const cleanCompleted = (completedData || []).filter(
        (c) => !bootedIds.includes(c.id)
      );
      setCompletedItems(cleanCompleted);

      // 3. GET DELETED
      const { data: deletedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .eq("status", "deleted")
        .order("created_at", { ascending: false });

      setDeletedItems(deletedData || []);
    } catch (error) {
      console.error("Error fetching archives:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // --- MODAL HANDLERS ---
  const openModal = (type, item) => {
    setModal({ isOpen: true, type, item });
    setDncReason("");
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, item: null });
    setDncReason("");
    setActionLoading(false);
  };

  // --- EXECUTIONS (Called from Modal) ---

  const executeTrash = async () => {
    const item = modal.item;
    setActionLoading(true);

    // 1. OPTIMISTIC UPDATE: Remove from UI immediately
    setBootedItems((prev) =>
      prev.filter((i) => i.archive_id !== item.archive_id)
    );
    closeModal();

    try {
      // 2. UPSERT into 2_booking_requests as deleted
      // CHANGED FROM INSERT TO UPSERT to handle existing records
      const requestData = item.original_data.request || item.original_data;
      const payload = { ...requestData, status: "deleted" };

      const { error: upsertError } = await supabase
        .from("2_booking_requests")
        .upsert([payload]);

      if (upsertError) throw upsertError;

      // 3. DELETE FROM 6_archive
      const { error: deleteError } = await supabase
        .from("6_archive")
        .delete()
        .eq("id", item.archive_id);

      if (deleteError) throw deleteError;

      fetchArchives();
    } catch (err) {
      console.error("Error trashing item:", err);
      fetchArchives(); // Revert optimism on error
    }
  };

  const executeWipe = async () => {
    const item = modal.item;
    setActionLoading(true);

    // Optimistic
    setDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
    closeModal();

    try {
      await supabase
        .from("3_onboarding_first_15")
        .delete()
        .eq("request_id", item.id);
      await supabase.from("2_booking_requests").delete().eq("id", item.id);
      fetchArchives();
    } catch (error) {
      console.error("Wipe failed", error);
    }
  };

  const executeRestore = async () => {
    const item = modal.item;
    setActionLoading(true);

    // Optimistic removal
    if (view === "booted") {
      setBootedItems((prev) =>
        prev.filter((i) => i.archive_id !== item.archive_id)
      );
    } else {
      setDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
    closeModal();

    try {
      if (view === "booted") {
        // --- FIX IS HERE: CHANGED INSERT TO UPSERT ---
        // 1. Prepare Data: Ensure we grab the core request data, stripped of join artifacts
        const requestData = item.original_data.request || item.original_data;
        const payload = { ...requestData, status: "pending" };

        // 2. Upsert (Update if exists, Insert if not)
        const { error: restoreError } = await supabase
          .from("2_booking_requests")
          .upsert([payload]);

        if (restoreError) throw restoreError;

        // 3. Remove from Archive Table
        await supabase.from("6_archive").delete().eq("id", item.archive_id);
      } else {
        // Restoring from Trash/Deleted
        await supabase
          .from("2_booking_requests")
          .update({ status: "pending" })
          .eq("id", item.id);
      }
      fetchArchives();
    } catch (error) {
      console.error("Restore failed:", error);
      fetchArchives(); // Revert
    }
  };

  const executeDNC = async () => {
    const item = modal.item;

    // Toggle OFF logic
    if (modal.type === "dnc-remove") {
      setActionLoading(true);
      const updatedOriginal = { ...item.original_data, is_blacklisted: false };
      await supabase
        .from("6_archive")
        .update({ is_blacklisted: false, original_data: updatedOriginal })
        .eq("id", item.archive_id);
      closeModal();
      fetchArchives();
      return;
    }

    // Toggle ON logic
    if (!dncReason.trim()) return;
    setActionLoading(true);

    try {
      // 1. Insert into Table 8_do_not_contact
      const { error: dncError } = await supabase
        .from("8_do_not_contact")
        .insert([
          {
            full_name: item.client_name,
            email: item.email,
            indie_or_company: item.client_type || "Unknown",
            lead_type: "Archived/Booted",
            reason: dncReason,
            date_last_contacted: new Date().toISOString(),
          },
        ]);

      if (dncError) throw dncError;

      // 2. Update Local Archive (Table 6)
      const updatedOriginal = {
        ...item.original_data,
        is_blacklisted: true,
        dnc_reason: dncReason,
      };
      await supabase
        .from("6_archive")
        .update({ is_blacklisted: true, original_data: updatedOriginal })
        .eq("id", item.archive_id);

      closeModal();
      fetchArchives();
    } catch (err) {
      console.error("Error adding to DNC:", err);
      setActionLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const getItems = () => {
    if (view === "booted") return bootedItems;
    if (view === "deleted") return deletedItems;
    return completedItems;
  };

  const items = getItems();

  return (
    <div className="space-y-8 pb-20 relative">
      {/* --- TABS --- */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-center justify-between bg-white p-1.5 rounded-sm border border-slate-200 shadow-sm min-w-max mx-auto md:mx-0 w-fit">
          <div className="flex gap-1">
            <button
              onClick={() => setView("completed")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === "completed"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Trophy
                size={14}
                className={view === "completed" ? "text-yellow-400" : ""}
              />{" "}
              Completed
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] ${
                  view === "completed"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {completedItems.length}
              </span>
            </button>

            <button
              onClick={() => setView("booted")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === "booted"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Skull size={14} /> Booted
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] ${
                  view === "booted"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {bootedItems.length}
              </span>
            </button>

            <button
              onClick={() => setView("deleted")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === "deleted"
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Trash2 size={14} /> Trash
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] ${
                  view === "deleted"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {deletedItems.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      {loading ? (
        <div className="text-center py-24 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" /> Syncing Archives...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {view} projects found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.map((r) => {
            const startDate = parseLocalDate(r.start_date);
            const isBooted = view === "booted";
            const isDeleted = view === "deleted";

            // Style Logic
            let containerClass = "bg-white border-slate-200";
            if (isBooted) containerClass = "bg-orange-50/30 border-orange-100";
            if (isDeleted)
              containerClass =
                "bg-slate-50 border-slate-200 opacity-60 grayscale-[0.8]";
            if (view === "completed")
              containerClass = "bg-emerald-50/20 border-emerald-100";

            return (
              <div
                key={r.id || r.archive_id}
                className={`relative rounded-sm border shadow-sm transition-all duration-300 overflow-hidden ${containerClass}`}
              >
                <div className="flex flex-col lg:flex-row min-h-[160px]">
                  {/* --- LEFT: IMAGE OR DATE --- */}
                  <div className="w-full h-40 lg:h-auto lg:w-40 relative flex flex-col items-center justify-center bg-slate-100/50 border-b lg:border-b-0 lg:border-r border-slate-200/60 shrink-0 overflow-hidden">
                    {r.cover_image_url ? (
                      <img
                        src={r.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
                        {isBooted ? (
                          <Ban size={32} />
                        ) : isDeleted ? (
                          <Trash2 size={32} />
                        ) : (
                          <Trophy size={32} className="text-yellow-400" />
                        )}
                        <span className="mt-2 text-[9px] font-black uppercase tracking-widest">
                          {isBooted ? "Booted" : isDeleted ? "Deleted" : "Done"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* --- MIDDLE: INFO --- */}
                  <div className="flex-grow p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">
                          {r.book_title || "Untitled Project"}
                        </h3>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white border border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                            <Briefcase size={10} /> {r.client_type || "Direct"}
                          </span>
                          {isBooted && r.is_blacklisted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                              <AlertOctagon size={10} /> DNC LISTED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs font-medium text-slate-500">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="font-bold text-slate-700 uppercase tracking-wide">
                            {r.client_name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{r.email || "-"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400" />
                          <span>
                            {r.word_count
                              ? Number(r.word_count).toLocaleString()
                              : 0}{" "}
                            Words
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          <span>{startDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- RIGHT: ACTIONS (Rectangular Buttons) --- */}
                  <div className="w-full lg:w-48 p-4 bg-white/50 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-row lg:flex-col gap-2 justify-center">
                    {/* Restore Button */}
                    <button
                      onClick={() => openModal("restore", r)}
                      className="flex-1 lg:flex-none w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-sm text-[10px] font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Undo2 size={14} /> Restore
                    </button>

                    {/* DNC Button (Booted Only) */}
                    {isBooted && (
                      <button
                        onClick={() =>
                          openModal(r.is_blacklisted ? "dnc-remove" : "dnc", r)
                        }
                        className={`flex-1 lg:flex-none w-full py-3 border rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          r.is_blacklisted
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <ShieldAlert size={14} />{" "}
                        <span className="hidden md:inline">
                          {r.is_blacklisted ? "Listed" : "Do Not Contact"}
                        </span>
                        <span className="md:hidden">
                          {r.is_blacklisted ? "DNC" : "Ban"}
                        </span>
                      </button>
                    )}

                    {/* BOOTED: TRASH (Rectangular) */}
                    {isBooted && (
                      <button
                        onClick={() => openModal("trash", r)}
                        className="flex-1 lg:flex-none w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Trash
                      </button>
                    )}

                    {/* TRASH: WIPE (Rectangular) */}
                    {isDeleted && (
                      <button
                        onClick={() => openModal("wipe", r)}
                        className="flex-1 lg:flex-none w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Wipe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CUSTOM MODAL (NO ALERT/CONFIRM) --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                {modal.type === "dnc" && (
                  <>
                    <ShieldAlert size={16} className="text-red-600" /> Do Not
                    Contact List
                  </>
                )}
                {modal.type === "dnc-remove" && (
                  <>
                    <ShieldAlert size={16} className="text-emerald-600" />{" "}
                    Remove from List
                  </>
                )}
                {modal.type === "trash" && (
                  <>
                    <Trash2 size={16} className="text-orange-500" /> Move to
                    Trash
                  </>
                )}
                {modal.type === "wipe" && (
                  <>
                    <AlertTriangle size={16} className="text-red-600" />{" "}
                    Permanent Delete
                  </>
                )}
                {modal.type === "restore" && (
                  <>
                    <Undo2 size={16} className="text-emerald-600" /> Restore
                    Project
                  </>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {modal.type === "dnc" ? (
                <div className="space-y-4">
                  <p className="text-slate-600 text-sm">
                    Adding <strong>{modal.item?.client_name}</strong> to the Do
                    Not Contact database.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Reason Required
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={dncReason}
                      onChange={(e) => setDncReason(e.target.value)}
                      placeholder="e.g. Unsubscribed, Rude, Spam..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-300"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-sm">
                  {modal.type === "trash" &&
                    "Move this project to Trash? It will be removed from the Booted list immediately."}
                  {modal.type === "wipe" &&
                    "Permanently delete this record? This action cannot be undone."}
                  {modal.type === "restore" &&
                    "Restore this project to the active Pending list?"}
                  {modal.type === "dnc-remove" &&
                    "Remove this client from the Do Not Contact visual status? (Note: Manually check DB if needed)"}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modal.type === "trash") executeTrash();
                  if (modal.type === "wipe") executeWipe();
                  if (modal.type === "restore") executeRestore();
                  if (modal.type === "dnc" || modal.type === "dnc-remove")
                    executeDNC();
                }}
                disabled={modal.type === "dnc" && !dncReason.trim()}
                className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all flex items-center gap-2
                        ${modal.type === "dnc" && !dncReason.trim() ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-black"}
                        ${modal.type === "wipe" ? "bg-red-600 hover:bg-red-700" : ""}
                    `}
              >
                {actionLoading && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                {modal.type === "dnc" ? "Confirm & Add" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
