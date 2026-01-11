"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  Ghost,
  RefreshCw,
  Loader2,
  Trash2,
  CheckCircle2,
  X,
  Image as ImageIcon,
  UploadCloud,
  Clock,
  CalendarDays,
  Link as LinkIcon,
  Mail,
  FileText,
} from "lucide-react";

// ✅ IMPORT SHARED
import Modal from "../shared/Modal";
import Toast from "../shared/Toast";

// ✅ IMPORT NEW SUB-COMPONENTS
import SchedulerCalendar from "./SchedulerCalendar";
import GhostGenerator from "./GhostGenerator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const WORDS_PER_PFH = 9300;
const WORDS_PER_DAY = 7000;

// --- UTILS ---
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

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // Modals & UI
  const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ isOpen: false });

  // Selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Ghost Settings
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);
  const [selectedGhosts, setSelectedGhosts] = useState([]);

  // Local Form Data
  const [formData, setFormData] = useState({
    type: "project",
    title: "",
    client: "",
    client_type: "Direct",
    email: "",
    email_thread_link: "",
    is_returning: false,
    ref_number: "",
    word_count: 0,
    word_count_display: "",
    est_pfh: "0.0",
    est_days: 0,
    style: "Solo",
    genre: "Fiction",
    startDate: "",
    endDate: "",
    notes: "",
    reason: "Personal",
    cover_image_url: "",
  });

  const [uploading, setUploading] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const [requests, bookouts] = await Promise.all([
        supabase
          .from("2_booking_requests")
          .select("*")
          .neq("status", "archived")
          .neq("status", "deleted")
          .neq("status", "postponed")
          .neq("status", "cinesonic"),

        supabase
          .from("7_bookouts")
          .select("id, reason, type, start_date, end_date"),
      ]);

      const merged = [];

      if (requests.data) {
        requests.data.forEach((r) => {
          merged.push({
            ...r,
            id: r.id,
            title: r.book_title || r.client_name || "Project",
            start: parseLocalDate(r.start_date),
            end: parseLocalDate(r.end_date),
            type: "real",
            status: r.status,
            sourceTable: "2_booking_requests",
            startStr: r.start_date ? r.start_date.split("T")[0] : "",
            endStr: r.end_date ? r.end_date.split("T")[0] : "",
          });
        });
      }

      if (bookouts.data) {
        bookouts.data.forEach((b) => {
          merged.push({
            id: b.id,
            title: b.reason || "Block",
            start: parseLocalDate(b.start_date),
            end: parseLocalDate(b.end_date),
            type: b.type === "ghost" ? "ghost" : "personal",
            status: "blocked",
            sourceTable: "7_bookouts",
            startStr: b.start_date ? b.start_date.split("T")[0] : "",
            endStr: b.end_date ? b.end_date.split("T")[0] : "",
          });
        });
      }
      setItems(merged);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // --- FORM LOGIC ---
  const handleWordCountChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const numVal = parseInt(rawVal, 10) || 0;
    const pfh = (numVal / WORDS_PER_PFH).toFixed(1);
    const days = Math.ceil(numVal / WORDS_PER_DAY);

    setFormData((prev) => ({
      ...prev,
      word_count_display: formatNumberWithCommas(rawVal),
      word_count: numVal,
      est_pfh: pfh,
      est_days: days,
    }));
  };

  const openAddModal = (date) => {
    setModalMode("add");
    setSelectedDate(date);
    const dateStr = formatDateForInput(date);

    setFormData({
      type: "project",
      title: "",
      client: "",
      client_type: "Direct",
      email: "",
      email_thread_link: "",
      is_returning: false,
      ref_number: "",
      word_count: 0,
      word_count_display: "",
      est_pfh: "0.0",
      est_days: 0,
      style: "Solo",
      genre: "Fiction",
      notes: "",
      reason: "Personal",
      startDate: dateStr,
      endDate: dateStr,
      cover_image_url: "",
    });
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingItem(item);

    if (item.type === "real") {
      const wc = item.word_count || 0;
      setFormData({
        type: "project",
        title: item.book_title || "",
        client: item.client_name || "",
        client_type: item.client_type || "Direct",
        email: item.email || "",
        email_thread_link: item.email_thread_link || "",
        is_returning: item.is_returning || false,
        ref_number: item.ref_number || "",
        word_count: wc,
        word_count_display: formatNumberWithCommas(wc),
        est_pfh: (wc / WORDS_PER_PFH).toFixed(1),
        est_days: Math.ceil(wc / WORDS_PER_DAY),
        style: item.narration_style || "Solo",
        genre: item.genre || "Fiction",
        notes: item.notes || "",
        reason: "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        cover_image_url: item.cover_image_url || "",
      });
    } else {
      setFormData({
        type: item.type === "ghost" ? "ghost" : "block",
        title: "",
        client: "",
        email: "",
        reason: item.title || "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        cover_image_url: "",
        word_count: 0,
        word_count_display: "",
        est_pfh: "0.0",
        est_days: 0,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      showToast("Missing dates", "error");
      return;
    }

    setLoading(true);
    let error = null;

    const projectPayload = {
      book_title: formData.title,
      client_name: formData.client || "Internal",
      email: formData.email,
      client_type: formData.client_type,
      narration_style: formData.style,
      genre: formData.genre,
      notes: formData.notes,
      start_date: formData.startDate,
      end_date: formData.endDate,
      word_count: formData.word_count,
      ref_number: formData.ref_number,
      email_thread_link: formData.email_thread_link,
      is_returning: formData.is_returning,
      cover_image_url: formData.cover_image_url,
      days_needed: formData.est_days || 1,
    };

    if (modalMode === "add") {
      if (formData.type === "project") {
        if (!formData.title) {
          setLoading(false);
          showToast("Title is required", "error");
          return;
        }
        const { error: err } = await supabase
          .from("2_booking_requests")
          .insert([{ ...projectPayload, status: "approved" }]);
        error = err;
      } else {
        const { error: err } = await supabase.from("7_bookouts").insert([
          {
            reason: formData.reason,
            type: formData.type === "ghost" ? "ghost" : "personal",
            start_date: formData.startDate,
            end_date: formData.endDate,
          },
        ]);
        error = err;
      }
    } else {
      if (formData.type === "project" && editingItem.type === "real") {
        const { error: err } = await supabase
          .from("2_booking_requests")
          .update(projectPayload)
          .eq("id", editingItem.id);
        error = err;
      } else if (editingItem.type !== "real") {
        const { error: err } = await supabase
          .from("7_bookouts")
          .update({
            reason: formData.reason,
            start_date: formData.startDate,
            end_date: formData.endDate,
          })
          .eq("id", editingItem.id);
        error = err;
      }
    }

    setLoading(false);

    if (error) {
      console.error("Save error:", error);
      showToast("Could not save", "error");
    } else {
      setModalOpen(false);
      fetchCalendar();
      showToast("Saved successfully");
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("admin").getPublicUrl(fileName);
      setFormData((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const triggerDelete = () => {
    setModal({
      isOpen: true,
      title: "Delete Item?",
      message: "Are you sure you want to delete this? This cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: handleDelete,
    });
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    setLoading(true);
    let error = null;
    if (editingItem.type === "real") {
      const { error: err } = await supabase
        .from("2_booking_requests")
        .delete()
        .eq("id", editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("7_bookouts")
        .delete()
        .eq("id", editingItem.id);
      error = err;
    }
    setLoading(false);
    setModal({ isOpen: false });
    if (error) {
      showToast("Delete failed", "error");
    } else {
      setModalOpen(false);
      fetchCalendar();
      showToast("Item deleted", "error"); // Red toast for delete
    }
  };

  // --- GHOST LOGIC ---
  const handleGhostMode = async () => {
    setLoading(true);
    const count =
      ghostDensity === "high" ? 12 : ghostDensity === "medium" ? 8 : 4;
    const itemsToInsert = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const futureDays = Math.floor(Math.random() * (ghostMonths * 30));
      const dur = Math.floor(Math.random() * 5) + 2; // 2-7 days
      const start = new Date(today);
      start.setDate(today.getDate() + futureDays);
      const end = new Date(start);
      end.setDate(start.getDate() + dur);

      itemsToInsert.push({
        type: "ghost",
        reason: "Ghost Block",
        start_date: formatDateForInput(start),
        end_date: formatDateForInput(end),
      });
    }

    try {
      const { error } = await supabase.from("7_bookouts").insert(itemsToInsert);
      if (error) throw error;
      fetchCalendar();
      showToast(`Generated ${count} ghost blocks`);
    } catch (e) {
      console.error(e);
      showToast("Generation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectGhost = (id) => {
    setSelectedGhosts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllGhosts = () => {
    const allGhosts = items.filter((i) => i.type === "ghost").map((i) => i.id);
    if (selectedGhosts.length === allGhosts.length) {
      setSelectedGhosts([]);
    } else {
      setSelectedGhosts(allGhosts);
    }
  };

  const handleDeleteSelectedGhosts = async () => {
    if (selectedGhosts.length === 0) return;
    setLoading(true);
    const { error } = await supabase
      .from("7_bookouts")
      .delete()
      .in("id", selectedGhosts);
    setLoading(false);
    if (error) {
      showToast("Delete failed", "error");
    } else {
      setSelectedGhosts([]);
      fetchCalendar();
      showToast("Ghosts deleted");
    }
  };

  return (
    <div className="bg-white p-4 md:px-12 md:py-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      {/* SHARED COMPONENTS */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Modal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- ADD/EDIT MODAL (Local because it's a complex form) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white rounded-[2rem] p-6 md:p-8 max-w-3xl w-full shadow-2xl animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-1">
                  {modalMode === "add" ? "Manual Entry" : "Edit Project"}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {selectedDate?.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selector */}
            {modalMode === "add" && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  onClick={() => setFormData({ ...formData, type: "project" })}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === "project" ? "bg-white shadow text-slate-900" : "text-slate-400"}`}
                >
                  Project
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: "block" })}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === "block" ? "bg-white shadow text-slate-900" : "text-slate-400"}`}
                >
                  Block
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* LEFT COL: Cover Image */}
              {formData.type === "project" && (
                <div className="w-full md:w-48 shrink-0">
                  <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 group mx-auto md:mx-0">
                    {formData.cover_image_url ? (
                      <img
                        src={formData.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <UploadCloud size={24} />
                      )}
                      <span className="text-[9px] font-bold uppercase mt-2">
                        {uploading ? "Uploading" : "Change"}
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
                </div>
              )}

              {/* RIGHT COL: The Form */}
              <div className="flex-grow space-y-5">
                {/* 1. CORE INFO */}
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    Core Info
                  </h4>
                  {formData.type === "project" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                          placeholder="Book Title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                          placeholder="Author / Client"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                          value={formData.client_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              client_type: e.target.value,
                            })
                          }
                        >
                          <option value="Direct">Direct Client</option>
                          <option value="Publisher">Publisher</option>
                          <option value="Roster">Roster</option>
                        </select>
                        <input
                          className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                          placeholder="Invoice Ref #"
                          value={formData.ref_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ref_number: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="relative">
                        <Mail
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <input
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200"
                          placeholder="Client Email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="relative">
                        <LinkIcon
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <input
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200 text-blue-600"
                          placeholder="Email Thread URL"
                          value={formData.email_thread_link}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email_thread_link: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="relative">
                        <FileText
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <textarea
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200 resize-none h-20"
                          placeholder="Project notes, specs, or details..."
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={formData.is_returning}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_returning: e.target.checked,
                            })
                          }
                          className="accent-teal-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-500">
                          Returning Client?
                        </span>
                      </div>
                    </>
                  ) : (
                    <input
                      className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                      placeholder="Block Reason..."
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                    />
                  )}
                </div>

                {/* 2. PRODUCTION MATH (Only for Projects) */}
                {formData.type === "project" && (
                  <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Production Math
                    </h4>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Word Count
                        </label>
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-black border border-slate-200"
                          placeholder="0"
                          value={formData.word_count_display}
                          onChange={handleWordCountChange}
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Est. PFH
                        </label>
                        <div className="text-sm font-black text-slate-700 flex items-center gap-1">
                          <Clock size={14} /> {formData.est_pfh}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Est. Days
                        </label>
                        <div className="text-sm font-black text-slate-700 flex items-center gap-1">
                          <CalendarIcon size={14} /> {formData.est_days}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                        value={formData.style}
                        onChange={(e) =>
                          setFormData({ ...formData, style: e.target.value })
                        }
                      >
                        <option value="Solo">Solo</option>
                        <option value="Duet">Duet</option>
                        <option value="Dual">Dual</option>
                        <option value="Multicast">Multicast</option>
                      </select>
                      <input
                        className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                        placeholder="Genre"
                        value={formData.genre}
                        onChange={(e) =>
                          setFormData({ ...formData, genre: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 3. DATES & SAVE */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="bg-slate-100 p-3 rounded-xl text-xs font-bold border-transparent"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="bg-slate-100 p-3 rounded-xl text-xs font-bold border-transparent"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-grow py-4 bg-slate-900 text-white rounded-xl font-black uppercase hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}{" "}
                    Save Project
                  </button>
                  {modalMode === "edit" && (
                    <button
                      onClick={triggerDelete}
                      className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900">
            Scheduler Ops
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Manage Availability
          </p>
        </div>
        <button
          onClick={fetchCalendar}
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all self-start md:self-auto"
        >
          <RefreshCw
            size={20}
            className={calendarLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="flex p-1 bg-slate-50 rounded-2xl mb-8 border border-slate-100 overflow-x-auto w-full md:w-fit">
        {[
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "ghost", label: "Ghost Gen", icon: Ghost },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "calendar" && (
          <SchedulerCalendar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            items={items}
            openAddModal={openAddModal}
            handleItemClick={handleItemClick}
          />
        )}

        {activeTab === "ghost" && (
          <GhostGenerator
            ghostDensity={ghostDensity}
            setGhostDensity={setGhostDensity}
            ghostMonths={ghostMonths}
            setGhostMonths={setGhostMonths}
            handleGhostMode={handleGhostMode}
            items={items}
            selectedGhosts={selectedGhosts}
            toggleSelectGhost={toggleSelectGhost}
            toggleSelectAllGhosts={toggleSelectAllGhosts}
            handleDeleteSelectedGhosts={handleDeleteSelectedGhosts}
          />
        )}
      </div>
    </div>
  );
}
