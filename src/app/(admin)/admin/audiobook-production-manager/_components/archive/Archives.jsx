"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Skull, Trash2, Trophy, Loader2, ShieldAlert } from "lucide-react";

import Modal from "../shared/Modal";
import Toast from "../shared/Toast";
import Completed from "./Completed";
import Booted from "./Booted";
import Trash from "./Trash";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Archives() {
  // --- STATE ---
  const [bootedItems, setBootedItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("completed"); // completed | booted | deleted

  // --- UI STATE ---
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ isOpen: false });
  const [dncModalOpen, setDncModalOpen] = useState(false);
  const [dncItem, setDncItem] = useState(null);
  const [dncReason, setDncReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // --- FETCHING ---
  const fetchArchives = async () => {
    setLoading(true);
    try {
      // 1. Booted
      const { data: bootedData } = await supabase
        .from("6_archive")
        .select("*")
        .order("archived_at", { ascending: false });

      const mappedBooted = (bootedData || []).map((row) => {
        const details = row.original_data?.request || row.original_data || {};
        return {
          ...details,
          ...row,
          archive_id: row.id,
          request_id: details.id || row.original_data?.id,
        };
      });
      setBootedItems(mappedBooted);

      // 2. Completed
      const { data: completedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .in("status", ["archived", "completed"])
        .order("end_date", { ascending: false });

      // Filter out items that are in booted table to avoid dupes
      const bootedIds = mappedBooted.map((b) => b.request_id);
      const cleanCompleted = (completedData || []).filter(
        (c) => !bootedIds.includes(c.id)
      );
      setCompletedItems(cleanCompleted);

      // 3. Deleted
      const { data: deletedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .eq("status", "deleted")
        .order("created_at", { ascending: false });

      setDeletedItems(deletedData || []);
    } catch (error) {
      console.error("Error fetching archives:", error);
      showToast("Sync Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // --- ACTIONS: TRASH (Move from Booted to Deleted) ---
  const handleTrash = (item) => {
    setModal({
      isOpen: true,
      title: "Move to Trash?",
      message: `Move "${item.book_title}" to Trash?`,
      confirmText: "Trash It",
      type: "danger",
      onConfirm: async () => {
        setBootedItems((prev) =>
          prev.filter((i) => i.archive_id !== item.archive_id)
        );
        setModal({ isOpen: false });
        try {
          const requestData = item.original_data.request || item.original_data;
          // Set status to deleted in main table
          await supabase
            .from("2_booking_requests")
            .upsert([{ ...requestData, status: "deleted" }]);
          // Remove from archive table
          await supabase.from("6_archive").delete().eq("id", item.archive_id);
          showToast("Moved to Trash");
          fetchArchives();
        } catch (err) {
          showToast("Action Failed", "error");
        }
      },
    });
  };

  // --- ACTIONS: WIPE (Permanent Delete) ---
  const handleWipe = (item) => {
    setModal({
      isOpen: true,
      title: "Permanent Delete?",
      message: `Permanently delete "${item.book_title}"? Cannot be undone.`,
      confirmText: "Wipe Forever",
      type: "danger",
      onConfirm: async () => {
        setDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
        setModal({ isOpen: false });
        try {
          await supabase
            .from("3_onboarding_first_15")
            .delete()
            .eq("request_id", item.id);
          await supabase.from("2_booking_requests").delete().eq("id", item.id);
          showToast("Record Wiped");
        } catch (error) {
          showToast("Wipe Failed", "error");
        }
      },
    });
  };

  // --- ACTIONS: RESTORE (Move back to Pending) ---
  const handleRestore = (item, source) => {
    setModal({
      isOpen: true,
      title: "Restore Project?",
      message: `Move "${item.book_title}" back to Pending?`,
      confirmText: "Restore",
      type: "success",
      onConfirm: async () => {
        // Optimistic Update
        if (source === "booted")
          setBootedItems((prev) =>
            prev.filter((i) => i.archive_id !== item.archive_id)
          );
        else if (source === "deleted")
          setDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
        else setCompletedItems((prev) => prev.filter((i) => i.id !== item.id));

        setModal({ isOpen: false });

        try {
          if (source === "booted") {
            const requestData =
              item.original_data.request || item.original_data;
            await supabase
              .from("2_booking_requests")
              .upsert([{ ...requestData, status: "pending" }]);
            await supabase.from("6_archive").delete().eq("id", item.archive_id);
          } else {
            await supabase
              .from("2_booking_requests")
              .update({ status: "pending" })
              .eq("id", item.id);
          }
          showToast("Project Restored");
          fetchArchives();
        } catch (error) {
          showToast("Restore Failed", "error");
        }
      },
    });
  };

  // --- ACTIONS: DNC (Blacklist) ---
  const handleToggleDNC = (item) => {
    if (item.is_blacklisted) {
      // Remove DNC
      setModal({
        isOpen: true,
        title: "Remove Blacklist?",
        message: "Remove this client from the Do Not Contact list?",
        confirmText: "Remove",
        type: "neutral",
        onConfirm: async () => {
          const updatedOriginal = {
            ...item.original_data,
            is_blacklisted: false,
          };
          await supabase
            .from("6_archive")
            .update({ is_blacklisted: false, original_data: updatedOriginal })
            .eq("id", item.archive_id);
          setModal({ isOpen: false });
          showToast("Blacklist Removed");
          fetchArchives();
        },
      });
    } else {
      // Add DNC (Open Modal)
      setDncItem(item);
      setDncReason("");
      setDncModalOpen(true);
    }
  };

  const executeDNCAdd = async () => {
    if (!dncReason.trim()) return;
    setActionLoading(true);
    try {
      await supabase.from("8_do_not_contact").insert([
        {
          full_name: dncItem.client_name,
          email: dncItem.email,
          indie_or_company: dncItem.client_type || "Unknown",
          lead_type: "Archived/Booted",
          reason: dncReason,
          date_last_contacted: new Date().toISOString(),
        },
      ]);

      const updatedOriginal = {
        ...dncItem.original_data,
        is_blacklisted: true,
        dnc_reason: dncReason,
      };
      await supabase
        .from("6_archive")
        .update({ is_blacklisted: true, original_data: updatedOriginal })
        .eq("id", dncItem.archive_id);

      setDncModalOpen(false);
      showToast("Client Blacklisted", "error");
      fetchArchives();
    } catch (err) {
      showToast("Action Failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      {/* GLOBAL TOAST & MODAL */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Modal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* CUSTOM DNC MODAL */}
      {dncModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="text-red-600" /> Blacklist Client
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Adding <strong>{dncItem?.client_name}</strong> to Do Not Contact.
            </p>
            <input
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold mb-6 focus:ring-2 focus:ring-red-200 outline-none"
              placeholder="Reason (Required)"
              value={dncReason}
              onChange={(e) => setDncReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setDncModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={executeDNCAdd}
                disabled={!dncReason.trim() || actionLoading}
                className="flex-1 py-3 rounded-xl font-bold text-xs uppercase text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex justify-center"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TABS --- */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-center justify-between bg-white p-1.5 rounded-sm border border-slate-200 shadow-sm min-w-max mx-auto md:mx-0 w-fit">
          <div className="flex gap-1">
            <TabButton
              active={view === "completed"}
              onClick={() => setView("completed")}
              icon={
                <Trophy
                  size={14}
                  className={view === "completed" ? "text-yellow-400" : ""}
                />
              }
              label="Completed"
              count={completedItems.length}
              activeClass="bg-slate-900 text-white shadow-md"
            />
            <TabButton
              active={view === "booted"}
              onClick={() => setView("booted")}
              icon={<Skull size={14} />}
              label="Booted"
              count={bootedItems.length}
              activeClass="bg-orange-600 text-white shadow-md shadow-orange-200"
            />
            <TabButton
              active={view === "deleted"}
              onClick={() => setView("deleted")}
              icon={<Trash2 size={14} />}
              label="Trash"
              count={deletedItems.length}
              activeClass="bg-red-600 text-white shadow-md shadow-red-200"
            />
          </div>
        </div>
      </div>

      {/* --- VIEW RENDERING --- */}
      {loading ? (
        <div className="text-center py-24 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" /> Syncing Archives...
        </div>
      ) : (
        <>
          {view === "completed" && (
            <Completed
              items={completedItems}
              onRestore={(item) => handleRestore(item, "completed")}
            />
          )}
          {view === "booted" && (
            <Booted
              items={bootedItems}
              onRestore={(item) => handleRestore(item, "booted")}
              onTrash={handleTrash}
              onDNC={handleToggleDNC}
            />
          )}
          {view === "deleted" && (
            <Trash
              items={deletedItems}
              onRestore={(item) => handleRestore(item, "deleted")}
              onWipe={handleWipe}
            />
          )}
        </>
      )}
    </div>
  );
}

// Small sub-component for the tabs to keep main cleaner
function TabButton({ active, onClick, icon, label, count, activeClass }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
        active
          ? activeClass
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon} {label}
      <span
        className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
      >
        {count}
      </span>
    </button>
  );
}
