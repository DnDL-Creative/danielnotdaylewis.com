"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Check,
  X,
  BookOpen,
  User,
  Mail,
  Undo2,
  CalendarDays,
  FileText,
  Clock,
  Trash2,
  Pencil,
  Save,
  Ban,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Archive,
  ThumbsDown,
  Globe,
  UserCheck,
  Users,
  Copy,
  ExternalLink,
  PlayCircle,
  AlertCircle,
  XCircle,
  CalendarClock,
  DollarSign,
  ListChecks,
  Headphones,
  Rocket,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const TRACKER_TABLE = "3_onboarding_first_15";

// --- HELPERS ---
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const str = String(dateString);
    const [year, month, day] = str.split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return new Date(dateString);
    return new Date(year, month - 1, day);
  } catch (e) {
    return new Date();
  }
};

const formatDateForInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const cleanNumber = (value) => {
  if (!value) return 0;
  return parseInt(String(value).replace(/,/g, ""), 10);
};

// --- TABS CONFIGURATION ---
const TABS = [
  { id: "pending", label: "Pending", icon: BookOpen },
  { id: "approved", label: "Onboarding", icon: ListChecks },
  { id: "f15_production", label: "First 15", icon: Headphones },
  { id: "production", label: "Production", icon: Rocket },
  { id: "f15_holding", label: "Holding Tank", icon: CalendarClock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "paid", label: "Paid", icon: DollarSign },
  { id: "postponed", label: "Postponed", icon: Clock },
  { id: "rejected", label: "Rejected", icon: Ban },
  { id: "archived", label: "Archive", icon: Archive },
];

export default function AllProjectsManager({ onUpdate }) {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("pending");

  // EDITING & UPLOAD STATE
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);

  // UI NOTIFICATIONS
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const triggerConfirm = (title, message, action) => {
    setModal({ show: true, title, message, action });
  };

  const closeModal = () => {
    setModal({ show: false, title: "", message: "", action: null });
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      showToast("Sync failed", "error");
    } else {
      setAllRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  const handleApprove = async (item) => {
    const isRoster = item.client_type === "Roster";
    const targetStatus = isRoster ? "f15_production" : "approved";

    triggerConfirm(
      `Approve "${item.book_title}"?`,
      `Client Type: ${item.client_type}\nDestination: ${
        isRoster ? "First 15 Pipeline" : "Onboarding Checklist"
      }`,
      async () => {
        try {
          // 1. Optimistic Update
          setAllRequests((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, status: targetStatus } : r
            )
          );

          // 2. Ensure Tracker Exists
          const { data: existing } = await supabase
            .from(TRACKER_TABLE)
            .select("id")
            .eq("request_id", item.id)
            .single();
          if (!existing)
            await supabase
              .from(TRACKER_TABLE)
              .insert([{ request_id: item.id }]);

          // 3. Update Status
          const { error } = await supabase
            .from("2_booking_requests")
            .update({ status: targetStatus })
            .eq("id", item.id);
          if (error) throw error;

          if (onUpdate) setTimeout(onUpdate, 100);
          showToast(`Project moved to ${isRoster ? "First 15" : "Onboarding"}`);
          fetchRequests();
        } catch (error) {
          showToast(error.message, "error");
          fetchRequests();
        } finally {
          closeModal();
        }
      }
    );
  };

  const updateGenericStatus = async (item, newStatus) => {
    const doUpdate = async () => {
      try {
        setAllRequests((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r))
        );
        const { error } = await supabase
          .from("2_booking_requests")
          .update({ status: newStatus })
          .eq("id", item.id);
        if (error) throw error;
        if (onUpdate) setTimeout(onUpdate, 100);
        showToast(`Project marked as ${newStatus}`);
        fetchRequests();
      } catch (error) {
        showToast(error.message, "error");
        fetchRequests();
      } finally {
        closeModal();
      }
    };

    if (newStatus === "rejected")
      triggerConfirm(
        "Reject Request?",
        "This will move the project to the Rejected tab.",
        doUpdate
      );
    else if (newStatus === "pending")
      triggerConfirm(
        "Restart Project?",
        "This will move the project back to the Pending queue.",
        doUpdate
      );
    else doUpdate();
  };

  const toggleClientType = async (item) => {
    const newType = item.client_type === "Roster" ? "Direct" : "Roster";
    setAllRequests((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, client_type: newType } : r))
    );
    await supabase
      .from("2_booking_requests")
      .update({ client_type: newType })
      .eq("id", item.id);
    showToast(`Switched to ${newType}`);
  };

  const deleteRequest = async (id) => {
    triggerConfirm(
      "Delete Permanently?",
      "This action cannot be undone.",
      async () => {
        setAllRequests((prev) => prev.filter((r) => r.id !== id));
        await supabase
          .from("2_booking_requests")
          .update({ status: "deleted" })
          .eq("id", id);
        showToast("Project deleted");
        closeModal();
      }
    );
  };

  // ... [Image/Edit/Copy logic identical to previous] ...
  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("book-covers")
        .getPublicUrl(filePath);
      setEditForm((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
      showToast("Cover uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (request) => {
    setEditingId(request.id);
    const s = parseLocalDate(request.start_date);
    const e = parseLocalDate(request.end_date);
    setEditForm({
      ...request,
      word_count_display: formatNumberWithCommas(request.word_count || ""),
      startStr: formatDateForInput(s),
      endStr: formatDateForInput(e),
      client_type: request.client_type || "Direct",
    });
  };

  const saveEdits = async () => {
    const updates = {
      book_title: editForm.book_title,
      client_name: editForm.client_name,
      email: editForm.email,
      email_secondary: editForm.email_secondary,
      email_tertiary: editForm.email_tertiary,
      email_thread_link: editForm.email_thread_link,
      client_type: editForm.client_type,
      genre: editForm.genre,
      word_count: cleanNumber(editForm.word_count_display),
      narration_style: editForm.narration_style,
      notes: editForm.notes,
      start_date: editForm.startStr,
      end_date: editForm.endStr,
      cover_image_url: editForm.cover_image_url,
    };

    setAllRequests((prev) =>
      prev.map((r) => (r.id === editingId ? { ...r, ...updates } : r))
    );
    await supabase
      .from("2_booking_requests")
      .update(updates)
      .eq("id", editingId);
    showToast("Changes saved");
    setEditingId(null);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  // --- FILTER ---
  const getCount = (tabId) =>
    allRequests.filter((r) => r.status === tabId).length;
  const displayedRequests = allRequests.filter(
    (r) => r.status === activeSubTab
  );

  return (
    <div className="space-y-8 relative">
      <div
        className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
            toast.type === "error"
              ? "bg-red-50/90 border-red-200 text-red-600"
              : "bg-slate-900/90 border-slate-800 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      </div>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {modal.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6 whitespace-pre-line">
              {modal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={modal.action}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW TABS SCROLLER */}
      <div className="flex items-center justify-between bg-white p-1.5 rounded-full border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full">
          {TABS.map((tab) => {
            const count = getCount(tab.id);
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            if (tab.id === "archived" && count === 0 && !isActive) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} /> {tab.label}{" "}
                {count > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs">
          Syncing Database...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="text-center py-24 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {activeSubTab.replace("_", " ")} projects found
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {displayedRequests.map((r) => {
            const isEditing = editingId === r.id;
            const startDate = parseLocalDate(r.start_date);
            const endDate = parseLocalDate(r.end_date);
            const coverImage = isEditing
              ? editForm.cover_image_url
              : r.cover_image_url;
            const isRoster =
              (isEditing ? editForm.client_type : r.client_type) === "Roster";

            // Status Styling
            let statusColor = "border-slate-200 hover:border-slate-300";
            let bgTint = "bg-white";
            if (
              ["approved", "f15_production", "production"].includes(r.status)
            ) {
              statusColor = "border-emerald-200 hover:border-emerald-300";
              bgTint = "bg-emerald-50/20";
            } else if (r.status === "f15_holding") {
              statusColor = "border-blue-200 hover:border-blue-300";
              bgTint = "bg-blue-50/20";
            } else if (r.status === "postponed") {
              statusColor = "border-orange-200 hover:border-orange-300";
              bgTint = "bg-orange-50/20";
            } else if (r.status === "paid") {
              statusColor = "border-teal-200 hover:border-teal-300";
              bgTint = "bg-teal-50/20";
            } else if (r.status === "rejected") {
              statusColor = "border-red-100 hover:border-red-200";
              bgTint = "bg-red-50/10";
            }

            if (isEditing) {
              bgTint =
                "bg-white ring-4 ring-slate-100 shadow-2xl z-10 scale-[1.01]";
              statusColor = "border-slate-300";
            }

            return (
              <div
                key={r.id}
                className={`group relative rounded-[2rem] border ${statusColor} ${bgTint} shadow-sm transition-all duration-300 overflow-hidden`}
              >
                <div className="flex flex-col lg:flex-row min-h-[180px]">
                  {/* --- LEFT: COVER --- */}
                  <div className="w-full lg:w-48 relative flex flex-col items-center justify-center bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 overflow-hidden">
                    {isEditing && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <label className="cursor-pointer flex flex-col items-center text-white">
                          {uploading ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <UploadCloud size={24} />
                          )}
                          <span className="text-[10px] font-bold uppercase mt-1">
                            Change Cover
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    )}
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : isEditing ? (
                      <div className="flex flex-col items-center text-slate-300">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-[10px] font-black uppercase">
                          No Cover
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                          {startDate.toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-5xl font-black text-slate-900 leading-none mb-3">
                          {startDate.getDate()}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          {r.days_needed} Days
                        </span>
                      </div>
                    )}
                  </div>

                  {/* --- MIDDLE: CONTENT --- */}
                  <div className="flex-grow p-6 lg:p-8 flex flex-col justify-center">
                    {isEditing ? (
                      /* EDIT FORM */
                      <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="w-full space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Project Title
                          </label>
                          <input
                            className="w-full text-3xl font-black text-slate-900 bg-transparent border-b-2 border-slate-100 focus:border-slate-900 outline-none pb-2"
                            value={editForm.book_title || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                book_title: e.target.value,
                              })
                            }
                            placeholder="UNTITLED PROJECT"
                            autoFocus
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Client & Emails
                              </label>
                              <input
                                className="w-full p-4 bg-slate-50 rounded-xl text-sm font-bold outline-none"
                                value={editForm.client_name || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    client_name: e.target.value,
                                  })
                                }
                                placeholder="Client Name"
                              />
                              <input
                                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium outline-none"
                                value={editForm.email || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Primary Email"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="date"
                                className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none"
                                value={editForm.startStr}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    startStr: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="date"
                                className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none"
                                value={editForm.endStr}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    endStr: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 block mb-1">
                                Source
                              </label>
                              <select
                                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none"
                                value={editForm.client_type}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    client_type: e.target.value,
                                  })
                                }
                              >
                                <option value="Direct">Direct Client</option>
                                <option value="Roster">Roster</option>
                              </select>
                            </div>
                            <input
                              className="w-full p-4 bg-slate-50 rounded-xl text-lg font-bold text-slate-900 outline-none font-mono"
                              value={editForm.word_count_display || ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(
                                  /[^0-9,]/g,
                                  ""
                                );
                                const raw = val.replace(/,/g, "");
                                const formatted = formatNumberWithCommas(raw);
                                setEditForm({
                                  ...editForm,
                                  word_count_display: formatted,
                                });
                              }}
                              placeholder="Word Count"
                            />
                          </div>
                        </div>
                        <textarea
                          className="w-full bg-slate-50 rounded-xl p-6 text-sm outline-none resize-none h-32"
                          value={editForm.notes || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, notes: e.target.value })
                          }
                          placeholder="Notes..."
                        />
                        <div className="flex gap-4 pt-4">
                          <button
                            onClick={() => saveEdits()}
                            className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 shadow-md flex items-center justify-center gap-2"
                          >
                            <Save size={16} /> Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({});
                            }}
                            className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                              {r.book_title || "Untitled Project"}
                            </h3>
                            <button
                              onClick={() => toggleClientType(r)}
                              disabled={activeSubTab !== "pending"}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                isRoster
                                  ? "bg-purple-100 border-purple-200 text-purple-700 hover:bg-purple-200"
                                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isRoster ? (
                                <Globe size={14} />
                              ) : (
                                <UserCheck size={14} />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {isRoster ? "Roster Client" : "Direct Client"}
                              </span>
                              {activeSubTab === "pending" && (
                                <span className="text-[9px] opacity-50 ml-1">
                                  (Click to Swap)
                                </span>
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => startEditing(r)}
                            className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs font-medium text-slate-500">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 flex justify-center">
                                <User size={16} className="text-slate-300" />
                              </div>
                              <span className="font-bold text-slate-700 uppercase tracking-wide">
                                {r.client_name || "Unknown"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 pl-9">
                              {r.email && (
                                <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => copyToClipboard(r.email)}
                                >
                                  <Mail size={12} className="text-slate-400" />
                                  <span className="text-slate-600">
                                    {r.email}
                                  </span>
                                </div>
                              )}
                              {r.email_thread_link && (
                                <a
                                  href={r.email_thread_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 hover:underline w-fit mt-1"
                                >
                                  <ExternalLink size={10} /> Open Thread
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 flex justify-center">
                                <CalendarDays
                                  size={16}
                                  className="text-slate-300"
                                />
                              </div>
                              <span className="font-mono text-slate-600">
                                {startDate.toLocaleDateString()} —{" "}
                                {endDate.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 flex justify-center">
                                <BookOpen
                                  size={16}
                                  className="text-slate-300"
                                />
                              </div>
                              <span>
                                <span className="font-bold text-slate-700">
                                  {r.word_count
                                    ? Number(r.word_count).toLocaleString()
                                    : 0}
                                </span>{" "}
                                Words • {r.narration_style} • {r.genre}
                              </span>
                            </div>
                          </div>
                        </div>
                        {r.notes && (
                          <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
                            <div className="w-6 flex justify-center pt-1">
                              <FileText size={14} className="text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                              {r.notes}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* --- RIGHT: ACTIONS --- */}
                  <div className="w-full lg:w-72 shrink-0 p-6 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col gap-3 justify-center">
                    {/* 1. Pending (Inbox) */}
                    {activeSubTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(r)}
                          className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                            isRoster
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-slate-900 text-white hover:bg-emerald-500"
                          }`}
                        >
                          <PlayCircle size={16} /> Approve & Start
                        </button>
                        <button
                          onClick={() => updateGenericStatus(r, "postponed")}
                          className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Clock size={16} /> Postpone
                        </button>
                        <button
                          onClick={() => updateGenericStatus(r, "rejected")}
                          className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Ban size={16} /> Reject
                        </button>
                      </>
                    )}

                    {/* 2. Onboarding / F15 / Holding / Prod / Completed (Active Pipelines) */}
                    {[
                      "approved",
                      "f15_production",
                      "f15_holding",
                      "production",
                      "completed",
                    ].includes(activeSubTab) && (
                      <>
                        <div className="flex flex-col items-center gap-2 text-center mb-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Currently In:
                          </span>
                          <div
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              r.status === "f15_holding"
                                ? "text-blue-600 bg-blue-50"
                                : r.status === "production"
                                ? "text-emerald-600 bg-emerald-50"
                                : r.status === "completed"
                                ? "text-blue-600 bg-blue-50"
                                : r.status === "approved"
                                ? "text-slate-600 bg-slate-100"
                                : "text-purple-600 bg-purple-50"
                            }`}
                          >
                            {r.status === "approved"
                              ? "Onboarding"
                              : r.status === "f15_production"
                              ? "First 15"
                              : r.status === "f15_holding"
                              ? "Holding Tank"
                              : r.status === "production"
                              ? "Production"
                              : "Completed"}
                          </div>
                        </div>

                        {/* Specific Actions based on Tab */}
                        {activeSubTab === "completed" && (
                          <button
                            onClick={() => updateGenericStatus(r, "paid")}
                            className="w-full py-4 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <DollarSign size={16} /> Mark Paid
                          </button>
                        )}

                        <button
                          onClick={() => updateGenericStatus(r, "pending")}
                          className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Undo2 size={16} /> Restart
                        </button>
                      </>
                    )}

                    {/* 3. Paid */}
                    {activeSubTab === "paid" && (
                      <button
                        onClick={() => updateGenericStatus(r, "archived")}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Archive size={16} /> Archive Project
                      </button>
                    )}

                    {/* 4. Postponed / Rejected / Archive */}
                    {["postponed", "rejected", "archived"].includes(
                      activeSubTab
                    ) && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => updateGenericStatus(r, "pending")}
                          className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500"
                        >
                          <Undo2 size={16} className="inline mr-2" /> Revive
                        </button>
                        <button
                          onClick={() => deleteRequest(r.id)}
                          className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                        >
                          <Trash2 size={16} className="inline mr-2" /> Delete
                        </button>
                      </div>
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
