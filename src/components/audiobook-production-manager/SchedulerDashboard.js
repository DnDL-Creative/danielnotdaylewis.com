"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Calendar as CalendarIcon,
  Ghost,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Image as ImageIcon,
  UploadCloud,
  Clock,
  Archive,
  ListFilter,
  CheckSquare,
  Square,
  AlertTriangle,
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

// --- HELPER: Format Date to YYYY-MM-DD for Inputs ---
const formatDateForInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- HELPER: Format Numbers with Commas ---
const formatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// --- HELPER: Clean Number String ---
const cleanNumber = (value) => {
  if (!value) return 0;
  return parseInt(String(value).replace(/,/g, ""), 10);
};

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
  const [modalOpen, setModalOpen] = useState(false);

  // Selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Multi-Select State
  const [selectedGhosts, setSelectedGhosts] = useState([]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // info, error, danger
    onConfirm: null,
  });

  // Local Form Data
  const [formData, setFormData] = useState({
    type: "project",
    title: "",
    client: "",
    email: "",
    client_type: "Direct",
    style: "Solo",
    genre: "Fiction",
    notes: "",
    reason: "Personal",
    startDate: "",
    endDate: "",
    word_count: 0,
    word_count_display: "",
    ref_number: "",
    cover_image_url: "",
  });

  // Upload State
  const [uploading, setUploading] = useState(false);

  // Ghost Settings
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // --- CUSTOM ALERT HANDLERS ---
  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  // --- EFFECT: Lock Body Scroll When Modal is Open ---
  useEffect(() => {
    document.body.style.overflow =
      modalOpen || alertConfig.isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, alertConfig.isOpen]);

  // --- CALC PFH ---
  const calcPFH = (words) => (words ? (words / 9300).toFixed(1) : "0.0");

  // =========================================================================
  // 1. FETCH DATA
  // =========================================================================
  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const [requests, bookouts] = await Promise.all([
        supabase
          .from("2_booking_requests")
          .select("*")
          .neq("status", "archived")
          .neq("status", "deleted")
          .neq("status", "postponed"),
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

  // =========================================================================
  // 2. OPEN MODALS
  // =========================================================================

  const openAddModal = (date) => {
    setModalMode("add");
    setSelectedDate(date);
    const dateStr = formatDateForInput(date);

    setFormData({
      type: "project",
      title: "",
      client: "",
      email: "",
      client_type: "Direct",
      style: "Solo",
      genre: "Fiction",
      notes: "",
      reason: "Personal",
      startDate: dateStr,
      endDate: dateStr,
      word_count: 0,
      word_count_display: "",
      ref_number: "",
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
      setFormData({
        type: "project",
        title: item.book_title || "",
        client: item.client_name || "",
        email: item.email || "",
        client_type: item.client_type || "Direct",
        style: item.narration_style || "Solo",
        genre: item.genre || "Fiction",
        notes: item.notes || "",
        reason: "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        word_count: item.word_count || 0,
        word_count_display: formatNumberWithCommas(item.word_count || 0),
        ref_number: item.ref_number || "",
        cover_image_url: item.cover_image_url || "",
      });
    } else {
      setFormData({
        type: item.type === "ghost" ? "ghost" : "block",
        title: "",
        client: "",
        email: "",
        client_type: "Direct",
        style: "Solo",
        genre: "Fiction",
        notes: "",
        reason: item.title || "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        word_count: 0,
        word_count_display: "",
        ref_number: "",
        cover_image_url: "",
      });
    }
    setModalOpen(true);
  };

  // =========================================================================
  // 3. SAVE & ADD LOGIC
  // =========================================================================
  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      return showAlert("Missing Dates", "Please select start and end dates.");
    }

    setLoading(true);

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let error = null;

    if (modalMode === "add") {
      if (formData.type === "project") {
        if (!formData.title) {
          setLoading(false);
          return showAlert("Missing Title", "Project title is required.");
        }
        const { error: err } = await supabase
          .from("2_booking_requests")
          .insert([
            {
              book_title: formData.title,
              client_name: formData.client || "Internal",
              email: formData.email,
              client_type: formData.client_type,
              narration_style: formData.style,
              genre: formData.genre,
              notes: formData.notes,
              start_date: formData.startDate,
              end_date: formData.endDate,
              status: "approved",
              days_needed: diffDays,
              word_count: cleanNumber(formData.word_count_display),
              ref_number: formData.ref_number,
              cover_image_url: formData.cover_image_url,
            },
          ]);
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
          .update({
            book_title: formData.title,
            client_name: formData.client,
            email: formData.email,
            client_type: formData.client_type,
            narration_style: formData.style,
            genre: formData.genre,
            notes: formData.notes,
            start_date: formData.startDate,
            end_date: formData.endDate,
            days_needed: diffDays,
            word_count: cleanNumber(formData.word_count_display),
            ref_number: formData.ref_number,
            cover_image_url: formData.cover_image_url,
          })
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
      showAlert("Error", "Could not save changes.", "error");
    } else {
      setModalOpen(false);
      fetchCalendar();
    }
  };

  // =========================================================================
  // 4. OTHER ACTIONS (Delete, Upload, Ghost)
  // =========================================================================

  const handleStatusChange = async (newStatus) => {
    if (!editingItem) return;

    // Use Custom Alert for confirmation
    showAlert(
      "Confirm Action",
      `Are you sure you want to ${
        newStatus === "deleted" ? "delete" : newStatus
      } this?`,
      "danger",
      async () => {
        setLoading(true);
        let error = null;

        if (editingItem.type === "real") {
          const { error: err } = await supabase
            .from("2_booking_requests")
            .update({ status: newStatus })
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
        if (error) {
          showAlert("Error", "Action failed", "error");
        } else {
          setModalOpen(false);
          closeAlert();
          fetchCalendar();
        }
      }
    );
  };

  const handleImageUpload = async (e, isAddMode = false) => {
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

      setFormData((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      showAlert("Upload Failed", "Could not upload cover image.", "error");
    } finally {
      setUploading(false);
    }
  };

  // --- GHOST: MULTI-SELECT ---

  const toggleSelectGhost = (id) => {
    setSelectedGhosts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllGhosts = () => {
    const allGhostIds = items
      .filter((i) => i.type === "ghost")
      .map((i) => i.id);
    if (selectedGhosts.length === allGhostIds.length) {
      setSelectedGhosts([]);
    } else {
      setSelectedGhosts(allGhostIds);
    }
  };

  const handleDeleteSelectedGhosts = async () => {
    if (selectedGhosts.length === 0) return;

    showAlert(
      "Confirm Delete",
      `Are you sure you want to delete ${selectedGhosts.length} selected ghost entries?`,
      "danger",
      async () => {
        setLoading(true);
        const { error } = await supabase
          .from("7_bookouts")
          .delete()
          .in("id", selectedGhosts);

        setLoading(false);
        if (error) {
          console.error(error);
          closeAlert(); // Keep modal open maybe?
          setTimeout(() => showAlert("Error", "Failed to delete"), 100);
        } else {
          closeAlert();
          setSelectedGhosts([]);
          fetchCalendar();
        }
      }
    );
  };

  // --- GHOST: GENERATE ---
  const handleGhostMode = async () => {
    setLoading(true);

    const [real, bookouts] = await Promise.all([
      supabase
        .from("2_booking_requests")
        .select("start_date, end_date")
        .neq("status", "archived")
        .neq("status", "deleted"),
      supabase.from("7_bookouts").select("start_date, end_date, type"),
    ]);

    let busyRanges = [];
    if (real.data)
      busyRanges = [
        ...busyRanges,
        ...real.data.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];
    if (bookouts.data)
      busyRanges = [
        ...busyRanges,
        ...bookouts.data.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];

    busyRanges.sort((a, b) => a.start - b.start);

    const newGhosts = [];
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(today.getMonth() + parseInt(ghostMonths));

    let gapTolerance = 7;
    let probability = 0.15;

    if (ghostDensity === "medium") {
      gapTolerance = 4;
      probability = 0.4;
    } else if (ghostDensity === "high") {
      gapTolerance = 2;
      probability = 0.75;
    }

    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor < rangeEnd) {
      const conflict = busyRanges.find(
        (r) => cursor >= r.start && cursor <= r.end
      );

      if (conflict) {
        cursor = new Date(conflict.end);
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      const nextBooking = busyRanges.find((r) => r.start > cursor);
      const nextStart = nextBooking ? nextBooking.start : rangeEnd;
      const daysFree = Math.floor((nextStart - cursor) / (1000 * 60 * 60 * 24));

      if (daysFree >= 3) {
        if (Math.random() < probability) {
          const maxDuration = Math.min(daysFree, 10);
          const duration =
            Math.floor(Math.random() * (maxDuration - 3 + 1)) + 3;

          const start = new Date(cursor);
          const end = new Date(start);
          end.setDate(start.getDate() + duration);

          newGhosts.push({
            reason: "Ghost Mode",
            type: "ghost",
            start_date: start.toISOString(),
            end_date: end.toISOString(),
          });

          cursor = new Date(end);
          cursor.setDate(cursor.getDate() + gapTolerance);
        } else {
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    if (newGhosts.length > 0) {
      await supabase.from("7_bookouts").insert(newGhosts);
    }

    setLoading(false);
    fetchCalendar();
  };

  // =========================================================================
  // 5. RENDERERS
  // =========================================================================
  const renderCalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const today = new Date();

    const changeMonth = (offset) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + offset);
      setCurrentDate(d);
    };

    return (
      <div className="animate-fade-in relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Booked
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 text-amber-700">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Pending
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 text-purple-700">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Ghost
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-500">
              <div className="w-2 h-2 rounded-full bg-slate-400" /> Time Off
            </div>
          </div>
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-32 text-center text-xs font-black uppercase text-slate-700">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 select-none">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black text-slate-400 py-2 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-20 md:h-32 bg-slate-50/30 rounded-xl border border-transparent"
            />
          ))}

          {days.map((day, i) => {
            const date = new Date(year, month, day);
            const dateMid = new Date(date).setHours(0, 0, 0, 0);
            const isToday = date.toDateString() === today.toDateString();

            const dayItems = items.filter((item) => {
              if (!item.start || !item.end) return false;
              const s = new Date(item.start).setHours(0, 0, 0, 0);
              const e = new Date(item.end).setHours(0, 0, 0, 0);
              return dateMid >= s && dateMid <= e;
            });

            return (
              <div
                key={i}
                onClick={() => openAddModal(date)}
                className={`h-24 md:h-32 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${
                  isToday
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-slate-100"
                }`}
              >
                <span
                  className={`text-[9px] md:text-[10px] font-bold absolute top-1 right-1 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${
                    isToday ? "bg-blue-500 text-white" : "text-slate-400"
                  }`}
                >
                  {day}
                </span>

                <div className="mt-5 md:mt-6 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] scrollbar-hide">
                  {dayItems.map((item, idx) => {
                    let color =
                      "bg-emerald-100 text-emerald-800 border-emerald-200";
                    if (item.status === "pending")
                      color = "bg-amber-100 text-amber-800 border-amber-200";
                    if (item.status === "postponed")
                      color = "bg-orange-100 text-orange-800 border-orange-200";
                    if (item.type === "ghost")
                      color = "bg-purple-100 text-purple-800 border-purple-200";
                    if (item.type === "personal")
                      color = "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={(e) => handleItemClick(e, item)}
                        className={`w-full text-left text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:brightness-95`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute top-1 left-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus
                    className="text-blue-500 bg-white rounded-full shadow-md p-0.5"
                    size={16}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGhostList = () => {
    // Filter out only ghost items
    const ghostItems = items
      .filter((i) => i.type === "ghost")
      .sort((a, b) => a.start - b.start);

    if (ghostItems.length === 0)
      return (
        <div className="text-center py-8 text-slate-400 text-xs uppercase font-bold">
          No active ghosts
        </div>
      );

    const isAllSelected =
      ghostItems.length > 0 && selectedGhosts.length === ghostItems.length;

    return (
      <div className="mt-4 flex flex-col h-full">
        {/* HEADER & SELECT ALL */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2 px-1">
          <button
            onClick={toggleSelectAllGhosts}
            className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 hover:text-purple-600 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-purple-600" />
            ) : (
              <Square size={16} />
            )}
            Select All
          </button>
          <span className="text-[10px] font-black text-slate-300 uppercase">
            {selectedGhosts.length} Selected
          </span>
        </div>

        {/* LIST */}
        <div className="max-h-[300px] overflow-y-auto space-y-2 px-1 scrollbar-thin flex-grow">
          {ghostItems.map((item) => {
            const isSelected = selectedGhosts.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelectGhost(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm cursor-pointer group ${
                  isSelected
                    ? "bg-purple-50 border-purple-200"
                    : "bg-white border-slate-100 hover:border-purple-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`transition-colors ${
                      isSelected ? "text-purple-600" : "text-slate-300"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Ghost size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase">
                      Ghost Block
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {item.start.toLocaleDateString()} -{" "}
                      {item.end.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 md:px-12 md:py-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      {/* CUSTOM ALERT MODAL */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up text-center border border-slate-100">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                alertConfig.type === "danger"
                  ? "bg-red-50 text-red-500"
                  : "bg-blue-50 text-blue-500"
              }`}
            >
              {alertConfig.type === "danger" ? (
                <AlertTriangle size={32} />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </div>
            <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
              {alertConfig.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {alertConfig.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeAlert}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold uppercase hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              {alertConfig.onConfirm && (
                <button
                  onClick={alertConfig.onConfirm}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase text-white transition-colors shadow-lg ${
                    alertConfig.type === "danger"
                      ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                      : "bg-blue-500 hover:bg-blue-600 shadow-blue-200"
                  }`}
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED EDIT/ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-scale-up my-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-slate-900 mb-1">
                  {modalMode === "add" ? "Add to Schedule" : "Edit Details"}
                </h3>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {modalMode === "add"
                    ? selectedDate?.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : editingItem?.type === "real"
                      ? "Project Entry"
                      : editingItem?.type === "ghost"
                        ? "Ghost Entry"
                        : "Time Off"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selector (Only in Add Mode) */}
            {modalMode === "add" && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  onClick={() => setFormData({ ...formData, type: "project" })}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === "project"
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Project
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: "block" })}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === "block"
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Block
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* LEFT: Cover Image (Projects Only) */}
              {formData.type === "project" && (
                <div className="w-full md:w-40 shrink-0">
                  <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 group mx-auto md:mx-0 max-w-[160px]">
                    {formData.cover_image_url ? (
                      <img
                        src={formData.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={28} className="mb-2" />
                        <span className="text-[8px] font-black uppercase">
                          No Cover
                        </span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <UploadCloud size={20} />
                      )}
                      <span className="text-[8px] font-bold uppercase mt-2">
                        {uploading ? "Uploading" : "Change"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, modalMode === "add")
                        }
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* RIGHT: Form Fields */}
              <div className="flex-grow space-y-4">
                {/* DATES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white p-2 rounded-lg text-xs font-bold border-transparent focus:border-slate-300 transition-all outline-none"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white p-2 rounded-lg text-xs font-bold border-transparent focus:border-slate-300 transition-all outline-none"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {formData.type === "project" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                          Title
                        </label>
                        <input
                          className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Book Title..."
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                          Client
                        </label>
                        <input
                          className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                          placeholder="Author Name..."
                        />
                      </div>
                    </div>
                    {/* ... (Rest of project fields remain same) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                          Word Count
                        </label>
                        <input
                          className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                          value={formData.word_count_display}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              word_count_display: formatNumberWithCommas(
                                e.target.value.replace(/[^0-9]/g, "")
                              ),
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                          Est. PFH
                        </label>
                        <div className="w-full bg-slate-100 p-3 rounded-xl text-sm font-black text-slate-600 flex items-center gap-2">
                          <Clock size={14} />{" "}
                          {calcPFH(cleanNumber(formData.word_count_display))}{" "}
                          hrs
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Reason
                    </label>
                    <input
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder={
                        formData.type === "ghost" ? "Ghost Block" : "Reason..."
                      }
                      disabled={formData.type === "ghost"}
                    />
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-grow py-4 bg-slate-900 text-white rounded-xl font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}{" "}
                    Save Changes
                  </button>

                  {modalMode === "edit" && (
                    <button
                      onClick={() => handleStatusChange("deleted")}
                      className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete"
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

      <div className="min-h-[400px] overflow-x-auto">
        {activeTab === "calendar" && renderCalendarView()}

        {activeTab === "ghost" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GHOST CONTROLS */}
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 h-fit">
              <Ghost className="text-slate-300 mb-4" size={32} />
              <h3 className="text-slate-900 font-black uppercase text-lg mb-1">
                Generator Settings
              </h3>
              <p className="text-slate-400 text-xs mb-6 max-w-sm">
                Automatically fill gaps to appear busier. Ghost bookings are
                strictly visual and do not block real projects.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
                    Density (How Busy?)
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {["low", "medium", "high"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setGhostDensity(d)}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                          ghostDensity === d
                            ? "bg-white shadow-sm text-purple-600"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
                    Lookahead (How Far?)
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setGhostMonths(m)}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                          ghostMonths === m
                            ? "bg-white shadow-sm text-purple-600"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/50">
                  <button
                    onClick={handleGhostMode}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    <Wand2 size={16} /> Generate Ghosts
                  </button>
                </div>
              </div>
            </div>

            {/* GHOST LIST */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <ListFilter size={18} />
                  </div>
                  <h3 className="text-slate-900 font-black uppercase text-lg">
                    Active Ghosts
                  </h3>
                </div>
                <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                  {items.filter((i) => i.type === "ghost").length}
                </span>
              </div>

              {renderGhostList()}

              {/* BULK ACTION BAR */}
              {selectedGhosts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between animate-fade-in-up">
                  <span className="text-xs font-bold text-slate-400">
                    {selectedGhosts.length} items selected
                  </span>
                  <button
                    onClick={handleDeleteSelectedGhosts}
                    className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
