"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Check,
  X,
  BookOpen,
  Mic2,
  Zap,
  User,
  Undo2,
  CalendarDays,
  FileText,
  Clock,
  Trash2,
  Pencil,
  Save,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- HELPER: Fixes "Day Behind" Error ---
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

export default function BookingRequests({ onUpdate }) {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("pending");

  // EDITING STATE
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch ALL items
  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching requests:", error);
    else setAllRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- ACTIONS ---

  const updateStatus = async (id, newStatus) => {
    if (newStatus === "archived" && !confirm("Reject this request?")) return;

    setAllRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    const { error } = await supabase
      .from("2_booking_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      fetchRequests();
      if (onUpdate) setTimeout(onUpdate, 100);
      // Auto-trigger onboarding if approved
      if (newStatus === "approved") {
        // Check if exists first to prevent duplicates (optional safety)
        const { data } = await supabase
          .from("3_onboarding")
          .select("id")
          .eq("request_id", id)
          .single();
        if (!data) {
          await supabase.from("3_onboarding").insert([{ request_id: id }]);
        }
      }
    } else {
      fetchRequests();
    }
  };

  // --- FIXED DELETE FUNCTION ---
  const deleteRequest = async (id) => {
    if (!confirm("Permanently delete this project? This cannot be undone."))
      return;

    // Optimistic Update
    setAllRequests((prev) => prev.filter((r) => r.id !== id));

    // 1. FIRST: Delete any linked Onboarding records to prevent DB errors
    await supabase.from("3_onboarding").delete().eq("request_id", id);

    // 2. THEN: Delete the Project
    const { error } = await supabase
      .from("2_booking_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting:", error);
      alert("Delete failed. See console.");
      fetchRequests(); // Revert UI on failure
    } else if (onUpdate) {
      setTimeout(onUpdate, 100);
    }
  };

  // --- EDIT LOGIC ---

  const startEditing = (request) => {
    setEditingId(request.id);
    setEditForm({ ...request });
  };

  const saveEdits = async () => {
    const { error } = await supabase
      .from("2_booking_requests")
      .update({
        book_title: editForm.book_title,
        client_name: editForm.client_name,
        email: editForm.email,
        notes: editForm.notes,
        word_count: editForm.word_count,
      })
      .eq("id", editingId);

    if (!error) {
      setAllRequests((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...editForm } : r))
      );
      setEditingId(null);
    } else {
      alert("Failed to save changes");
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  // --- HELPERS ---
  const getCount = (status) =>
    allRequests.filter((r) => r.status === status).length;
  const displayedRequests = allRequests.filter(
    (r) => r.status === activeSubTab
  );

  return (
    <div className="space-y-6">
      {/* --- SUB-TABS --- */}
      <div className="flex items-center justify-between">
        <div className="flex p-1 bg-white rounded-full border border-slate-200 shadow-sm overflow-x-auto">
          {["pending", "approved", "postponed", "archived"].map((tab) => {
            const count = getCount(tab);
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "archived" ? "Rejected" : tab}
                {count > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[9px] ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
          {displayedRequests.length} Projects
        </div>
      </div>

      {/* --- CONTENT --- */}
      {loading ? (
        <div className="text-center py-20 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs">
          Syncing...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {activeSubTab} items
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedRequests.map((r) => {
            const isEditing = editingId === r.id;

            // Fix Date Rendering using Helper
            const startDate = parseLocalDate(r.start_date);
            const endDate = parseLocalDate(r.end_date);

            return (
              <div
                key={r.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {/* LEFT: DATE BLOCK */}
                  <div className="bg-slate-50 p-6 w-full md:w-32 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">
                      {startDate.toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-3xl font-black text-slate-900 leading-none mb-2">
                      {startDate.getDate()}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded-full border border-slate-200">
                      {r.days_needed} Days
                    </span>
                  </div>

                  {/* CENTER: DETAILS */}
                  <div className="p-6 flex-grow">
                    {/* Title Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-full">
                        {isEditing ? (
                          <input
                            className="text-lg font-black text-slate-900 w-full border-b border-slate-300 focus:border-slate-900 outline-none bg-transparent"
                            value={editForm.book_title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                book_title: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-black text-slate-900">
                              {r.book_title}
                            </h3>
                            {r.is_returning && (
                              <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                                Returning
                              </span>
                            )}
                            {r.client_type && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                                {r.client_type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Edit Toggle */}
                      {!isEditing ? (
                        <button
                          onClick={() => startEditing(r)}
                          className="text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdits}
                            className="text-emerald-500 hover:text-emerald-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-xs text-slate-500 font-medium mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-300" />
                        {isEditing ? (
                          <div className="flex gap-2 w-full">
                            <input
                              className="w-1/2 border-b border-slate-200 outline-none text-slate-900"
                              value={editForm.client_name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  client_name: e.target.value,
                                })
                              }
                            />
                            <input
                              className="w-1/2 border-b border-slate-200 outline-none"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                        ) : (
                          <span>
                            <span className="font-bold text-slate-700">
                              {r.client_name}
                            </span>{" "}
                            • {r.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-slate-300" />
                        <span className="font-mono text-[11px]">
                          {startDate.toLocaleDateString()} —{" "}
                          {endDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-slate-300" />
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-24 border-b border-slate-200 outline-none"
                            value={editForm.word_count}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                word_count: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <span>
                            {r.word_count
                              ? Number(r.word_count).toLocaleString()
                              : 0}{" "}
                            Words
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic2 size={14} className="text-slate-300" />
                        <span>{r.narration_style || "Solo"}</span>
                      </div>
                    </div>

                    {/* Notes Section */}
                    {(r.notes || isEditing) && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2 items-start">
                        <FileText
                          size={12}
                          className="text-slate-400 mt-0.5 shrink-0"
                        />
                        {isEditing ? (
                          <textarea
                            className="w-full bg-transparent text-xs text-slate-600 outline-none resize-none h-16"
                            value={editForm.notes || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Add notes..."
                          />
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            {r.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: ACTIONS */}
                  <div className="bg-slate-50 p-4 w-full md:w-auto flex md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100">
                    {activeSubTab === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(r.id, "approved")}
                          title="Approve"
                          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-500 shadow-md transition-all"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "postponed")}
                          title="Postpone"
                          className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-orange-500 hover:border-orange-200 transition-all"
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "archived")}
                          title="Reject"
                          className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {activeSubTab === "postponed" && (
                      <>
                        <button
                          onClick={() => updateStatus(r.id, "pending")}
                          title="Revive"
                          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-500 shadow-md transition-all"
                        >
                          <Undo2 size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "archived")}
                          title="Reject"
                          className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {activeSubTab === "approved" && (
                      <button
                        onClick={() => updateStatus(r.id, "pending")}
                        title="Revert to Pending"
                        className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-orange-500 hover:border-orange-200 transition-all"
                      >
                        <Undo2 size={16} />
                      </button>
                    )}
                    {activeSubTab === "archived" && (
                      <>
                        <button
                          onClick={() => updateStatus(r.id, "pending")}
                          title="Restore"
                          className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-emerald-500 hover:border-emerald-200 transition-all"
                        >
                          <Undo2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteRequest(r.id)}
                          title="Delete Forever"
                          className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
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
