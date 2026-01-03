"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Calendar as CalendarIcon,
  Ghost,
  ShieldBan,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Briefcase,
  X,
  User,
  Mail,
  BookOpen,
  Mic2,
  Tags,
  FileText,
  Clock,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // "Quick Add" Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [addType, setAddType] = useState("project"); // 'project' | 'block'

  // FULL PROJECT FORM DATA
  const [newItemData, setNewItemData] = useState({
    title: "",
    client: "",
    email: "",
    client_type: "Direct",
    is_returning: false,
    style: "Solo",
    genre: "Fiction",
    notes: "",
    duration: 1,
    reason: "Personal", // For blocks
  });

  // Ghost / Global Form State
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // Alerts
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

  // =========================================================================
  // 1. DATA FETCHING
  // =========================================================================
  const fetchCalendar = async () => {
    setCalendarLoading(true);

    const [requests, bookouts] = await Promise.all([
      supabase
        .from("2_booking_requests")
        .select("id, client_name, book_title, start_date, end_date, status")
        .neq("status", "archived"),
      supabase
        .from("8_bookouts")
        .select("id, reason, type, start_date, end_date"),
    ]);

    const merged = [];

    if (requests.data) {
      requests.data.forEach((r) => {
        merged.push({
          id: r.id,
          title: r.book_title || r.client_name || "Project",
          start: new Date(r.start_date),
          end: new Date(r.end_date),
          type: "real",
          status: r.status,
          sourceTable: "2_booking_requests",
        });
      });
    }

    if (bookouts.data) {
      bookouts.data.forEach((b) => {
        merged.push({
          id: b.id,
          title: b.reason || "Block",
          start: new Date(b.start_date),
          end: new Date(b.end_date),
          type: b.type === "ghost" ? "ghost" : "personal",
          status: "blocked",
          sourceTable: "8_bookouts",
        });
      });
    }

    setItems(merged);
    setCalendarLoading(false);
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // =========================================================================
  // 2. QUICK ADD (FULL PROJECT SUPPORT)
  // =========================================================================
  const openAddModal = (date) => {
    setSelectedDate(date);
    // Reset to defaults
    setNewItemData({
      title: "",
      client: "",
      email: "",
      client_type: "Direct",
      is_returning: false,
      style: "Solo",
      genre: "Fiction",
      notes: "",
      duration: 1,
      reason: "Personal",
    });
    setAddModalOpen(true);
  };

  const handleQuickAdd = async () => {
    if (!newItemData.duration || newItemData.duration < 1)
      return alert("Duration needed");

    setLoading(true);

    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (parseInt(newItemData.duration) - 1));

    let error = null;

    if (addType === "project") {
      if (!newItemData.title) {
        setLoading(false);
        return alert("Title required");
      }

      // INSERT INTO 2_BOOKING_REQUESTS (The "Real" Table)
      const { error: dbError } = await supabase
        .from("2_booking_requests")
        .insert([
          {
            book_title: newItemData.title,
            client_name: newItemData.client || "Internal Entry",
            email: newItemData.email,
            client_type: newItemData.client_type,
            is_returning: newItemData.is_returning,
            narration_style: newItemData.style,
            genre: newItemData.genre,
            notes: newItemData.notes,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: "approved", // Auto-approve manual entries
            days_needed: newItemData.duration,
            word_count: 0, // Placeholder
          },
        ]);
      error = dbError;
    } else {
      // Block (Vacation/Personal)
      const { error: dbError } = await supabase.from("8_bookouts").insert([
        {
          reason: newItemData.reason,
          type: "personal",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      ]);
      error = dbError;
    }

    setLoading(false);

    if (error) {
      console.error(error);
      showAlert("Error", "Failed to create item.", "error");
    } else {
      setAddModalOpen(false);
      fetchCalendar(); // Refresh calendar immediately
    }
  };

  // =========================================================================
  // 3. GHOST MODE
  // =========================================================================
  const handleGhostMode = async () => {
    setLoading(true);
    // ... (Keep existing logic)
    const [real, blocks] = await Promise.all([
      supabase
        .from("2_booking_requests")
        .select("start_date, end_date")
        .neq("status", "archived"),
      supabase.from("8_bookouts").select("start_date, end_date"),
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
    if (blocks.data)
      busyRanges = [
        ...busyRanges,
        ...blocks.data.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];
    busyRanges.sort((a, b) => a.start - b.start);

    const newGhosts = [];
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(today.getMonth() + parseInt(ghostMonths));

    let gapTolerance =
      ghostDensity === "high" ? 2 : ghostDensity === "medium" ? 4 : 7;
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
        const maxDuration = Math.min(daysFree, 10);
        const duration = Math.floor(Math.random() * (maxDuration - 3 + 1)) + 3;
        if (Math.random() > (ghostDensity === "low" ? 0.6 : 0.1)) {
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
        }
      }
      cursor.setDate(cursor.getDate() + gapTolerance);
    }

    if (newGhosts.length > 0) {
      await supabase.from("8_bookouts").insert(newGhosts);
      fetchCalendar();
      showAlert("Success", `Added ${newGhosts.length} ghosts.`);
    } else {
      showAlert("Full", "No gaps found.");
    }
    setLoading(false);
  };

  // =========================================================================
  // 4. DELETION
  // =========================================================================
  const deleteSingleItem = (id, table, title) => {
    showAlert("Delete Item", `Delete "${title}"?`, "confirm", async () => {
      await supabase.from(table).delete().eq("id", id);
      fetchCalendar();
      closeModal();
    });
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
        {/* Controls */}
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
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-28 text-center text-xs font-black uppercase text-slate-700">
              {currentDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 select-none">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black text-slate-300 py-2 uppercase"
            >
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-16 md:h-24 bg-slate-50/30 rounded-lg border border-transparent"
            />
          ))}

          {days.map((day, i) => {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const isToday = date.toDateString() === today.toDateString();

            const dayItems = items.filter((i) => {
              const s = new Date(i.start).setHours(0, 0, 0, 0);
              const e = new Date(i.end).setHours(0, 0, 0, 0);
              return date >= s && date <= e;
            });

            return (
              <div
                key={i}
                onClick={() => openAddModal(date)}
                className={`h-16 md:h-24 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer hover:border-blue-300 hover:shadow-md
                    ${
                      isToday
                        ? "bg-blue-50/50 border-blue-200"
                        : "bg-white border-slate-100"
                    }
                `}
              >
                <span
                  className={`text-[10px] font-bold absolute top-1 right-2 flex items-center justify-center w-5 h-5 rounded-full ${
                    isToday ? "bg-blue-500 text-white" : "text-slate-300"
                  }`}
                >
                  {day}
                </span>

                <div className="mt-5 space-y-1 overflow-y-auto max-h-[50px] md:max-h-[70px] scrollbar-hide">
                  {dayItems.map((item, idx) => {
                    let color =
                      "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (item.status === "pending")
                      color = "bg-amber-50 text-amber-700 border-amber-100";
                    if (item.type === "ghost")
                      color = "bg-purple-50 text-purple-700 border-purple-100";
                    if (item.type === "personal")
                      color = "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingleItem(
                            item.id,
                            item.sourceTable,
                            item.title
                          );
                        }}
                        className={`w-full text-left text-[8px] md:text-[9px] px-1 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:opacity-75`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Plus
                    className="text-slate-300 bg-white rounded-full shadow-sm p-1"
                    size={24}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGhostMode = () => (
    <div className="max-w-xl mx-auto py-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2 relative z-10">
          <Ghost className="text-teal-400" /> Smart Ghost Generator
        </h3>
        <p className="text-slate-400 text-sm mb-8 relative z-10">
          Automatically finds gaps and fills them with fake "NDA Projects".
        </p>
        <div className="space-y-6 relative z-10">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Density
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {["low", "medium", "high"].map((d) => (
                <button
                  key={d}
                  onClick={() => setGhostDensity(d)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostDensity === d
                      ? "bg-teal-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Lookahead
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setGhostMonths(m)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostMonths === m
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGhostMode}
            disabled={loading}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-teal-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Wand2 size={18} /> Populate Ghosts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
      {/* --- ADD ITEM MODAL (EXPANDED) --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-1">
                  Add to Schedule
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                onClick={() => setAddType("project")}
                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  addType === "project"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Project
              </button>
              <button
                onClick={() => setAddType("block")}
                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  addType === "block"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Block
              </button>
            </div>

            <div className="space-y-6 mb-8">
              {/* --- PROJECT FORM --- */}
              {addType === "project" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <BookOpen size={12} /> Title
                      </label>
                      <input
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 focus:border-slate-400 outline-none"
                        value={newItemData.title}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            title: e.target.value,
                          })
                        }
                        placeholder="Book Title..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <User size={12} /> Client
                      </label>
                      <input
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 focus:border-slate-400 outline-none"
                        value={newItemData.client}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            client: e.target.value,
                          })
                        }
                        placeholder="Author Name..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                      <Mail size={12} /> Email
                    </label>
                    <input
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 focus:border-slate-400 outline-none"
                      value={newItemData.email}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          email: e.target.value,
                        })
                      }
                      placeholder="client@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <Briefcase size={12} /> Type
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                        value={newItemData.client_type}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            client_type: e.target.value,
                          })
                        }
                      >
                        <option>Direct</option>
                        <option>Publisher</option>
                        <option>Roster</option>
                        <option>Audition</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <Tags size={12} /> Genre
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                        value={newItemData.genre}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            genre: e.target.value,
                          })
                        }
                      >
                        <option>Fiction</option>
                        <option>Non-Fic</option>
                        <option>Sci-Fi</option>
                        <option>Romance</option>
                        <option>Thriller</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <Mic2 size={12} /> Style
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                        value={newItemData.style}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            style: e.target.value,
                          })
                        }
                      >
                        <option>Solo</option>
                        <option>Dual</option>
                        <option>Duet</option>
                        <option>Multicast</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                        <Clock size={12} /> Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                        value={newItemData.duration}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            duration: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-2">
                      <FileText size={12} /> Notes
                    </label>
                    <textarea
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-medium border border-slate-200 focus:border-slate-400 outline-none resize-none h-20"
                      value={newItemData.notes}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Project details..."
                    />
                  </div>
                </>
              ) : (
                /* --- BLOCK FORM --- */
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                      Reason
                    </label>
                    <select
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                      value={newItemData.reason}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          reason: e.target.value,
                        })
                      }
                    >
                      <option>Vacation</option>
                      <option>Personal</option>
                      <option>Travel</option>
                      <option>Admin Work</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                      value={newItemData.duration}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          duration: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <CheckCircle2 size={16} /> Save to Schedule
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- ALERT MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm"
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-slate-900">
            Scheduler Ops
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Manage Availability
          </p>
        </div>
        <button
          onClick={fetchCalendar}
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors w-fit"
        >
          <RefreshCw
            size={20}
            className={calendarLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-slate-50 rounded-2xl mb-8 border border-slate-100 overflow-x-auto">
        {[
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "ghost", label: "Ghost Gen", icon: Ghost },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
        {activeTab === "calendar" && renderCalendarView()}
        {activeTab === "ghost" && renderGhostMode()}
      </div>
    </div>
  );
}
