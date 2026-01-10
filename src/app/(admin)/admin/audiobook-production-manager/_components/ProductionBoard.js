"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  Save,
  X,
  User,
  BookOpen,
  Clock,
  Mic,
  AlertTriangle,
  PauseCircle,
  CheckCircle2,
  Search,
  LayoutDashboard,
  FileText,
  ListTodo,
  StickyNote,
  Activity,
  Check,
  RefreshCw,
  XCircle,
  Trash2,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ArrowLeftCircle,
  Archive,
  Ban,
  Timer,
  CalendarDays,
  Skull,
  ArrowLeft,
  ArrowUpDown,
  CreditCard,
  Trophy,
  Play,
  Square,
  Pause,
  Pencil,
} from "lucide-react";

import ProductionFinances from "./ProductionFinances";
import AllProductionFinances from "./AllProductionFinances";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 1. CONFIGURATION ---
const WORDS_PER_FH = 9300;
const DEFAULT_PFH_RATE = 250;
const DEFAULT_POZOTRON_RATE = 14;

const ACTIVE_PRODUCTION_STATUSES = [
  "pre_production",
  "recording",
  "editing",
  "review",
  "mastering",
  "done",
];

const STATUS_MAP = {
  pre_production: {
    label: "Text Prep",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: FileText,
  },
  recording: {
    label: "Recording",
    color: "bg-red-50 text-red-600 border-red-200 animate-pulse",
    icon: Mic,
  },
  editing: {
    label: "Editing",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    icon: Activity,
  },
  review: {
    label: "CRX Review",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: Clock,
  },
  mastering: {
    label: "Mastering",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    icon: Activity,
  },
  done: {
    label: "Complete",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Clock,
  },
  postponed: {
    label: "Postponed",
    color: "bg-pink-50 text-pink-600 border-pink-200",
    icon: Ban,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-slate-100 text-slate-500 border-slate-300",
    icon: PauseCircle,
  },
  completed: {
    label: "Archived",
    color: "bg-emerald-600 text-white border-emerald-700",
    icon: Trophy,
  },
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "work_log", label: "Work Log", icon: Timer },
  { id: "crx", label: "CRX Matrix", icon: CalendarDays },
  { id: "bible", label: "Bible", icon: BookOpen },
  { id: "tasks", label: "Checklists", icon: ListTodo },
  { id: "notes", label: "Notes", icon: StickyNote },
];

// --- 2. UTILS ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const fixedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return fixedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatSeconds = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-5">
      <div
        className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${type === "error" ? "bg-red-50/95 border-red-200 text-red-600" : type === "celebrate" ? "bg-emerald-900/95 border-emerald-700 text-white" : "bg-slate-900/95 border-slate-800 text-white"}`}
      >
        {type === "error" ? (
          <XCircle size={18} />
        ) : type === "celebrate" ? (
          <Trophy size={18} className="text-yellow-400" />
        ) : (
          <CheckCircle2 size={18} />
        )}
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
  type = "neutral",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-900"}`}
        >
          {type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertTriangle size={24} />
          )}
        </div>
        <h3 className="text-lg font-black uppercase text-slate-900 mb-2 text-center">
          {title}
        </h3>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed text-center">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase text-white shadow-lg ${type === "danger" ? "bg-red-600 hover:bg-red-700" : type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---
export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("due_asc");
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [manualTime, setManualTime] = useState({ h: "00", m: "00" });
  const [editingLogId, setEditingLogId] = useState(null);
  const [tempLogData, setTempLogData] = useState({});
  const [modal, setModal] = useState({ isOpen: false });
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    duration_hrs: "",
    activity: "Recording",
    notes: "",
  });
  const [timerNow, setTimerNow] = useState(Date.now());
  const tickerRef = useRef(null);

  // TRIGGER STATE TO REFRESH GLOBAL FINANCIALS
  const [financialUpdateTrigger, setFinancialUpdateTrigger] = useState(0);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data: claims } = await supabase
        .from("2_booking_requests")
        .select("id, status")
        .in("status", ACTIVE_PRODUCTION_STATUSES);
      if (claims && claims.length > 0) {
        const { data: actuals } = await supabase
          .from("4_production")
          .select("request_id");
        const existingIds = new Set(actuals?.map((a) => a.request_id) || []);
        const orphans = claims.filter((c) => !existingIds.has(c.id));
        if (orphans.length > 0) {
          const newRecords = orphans.map((o) => ({
            request_id: o.id,
            status: o.status,
            pfh_rate: DEFAULT_PFH_RATE,
            pozotron_rate: DEFAULT_POZOTRON_RATE,
            other_expenses: [],
          }));
          await supabase.from("4_production").insert(newRecords);
        }
      }
    } catch (err) {
      console.error("Auto-heal failed", err);
    }

    const { data: prodData, error } = await supabase
      .from("4_production")
      .select(
        `*, request:2_booking_requests!inner (id, book_title, client_name, client_type, cover_image_url, word_count, status, email, ref_number)`
      )
      .neq("request.status", "deleted")
      .neq("request.status", "archived")
      .neq("request.status", "pending")
      .neq("request.status", "on_hold")
      .neq("request.status", "postponed")
      .neq("request.status", "completed");

    if (error) {
      showToast("Sync Error", "error");
    } else {
      const { data: logData } = await supabase
        .from("10_session_logs")
        .select("*")
        .order("date", { ascending: false });
      setLogs(logData || []);
      const unique = (prodData || []).map((i) => ({
        ...i,
        crx_batches: Array.isArray(i.crx_batches) ? i.crx_batches : [],
        characters: Array.isArray(i.characters) ? i.characters : [],
        checklist:
          Array.isArray(i.checklist) && i.checklist.length > 0
            ? i.checklist
            : [{ id: 1, label: "Script Pre-read", checked: false }],
        other_expenses: Array.isArray(i.other_expenses) ? i.other_expenses : [],
        pfh_rate: i.pfh_rate || DEFAULT_PFH_RATE,
        pozotron_rate: i.pozotron_rate || DEFAULT_POZOTRON_RATE,
        active_timer_elapsed: i.active_timer_elapsed || 0,
        active_timer_start: i.active_timer_start || null,
        active_timer_activity: i.active_timer_activity || "Recording",
      }));
      setItems(unique);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    tickerRef.current = setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);
    return () => clearInterval(tickerRef.current);
  }, []);

  const activeTimerDuration = useMemo(() => {
    if (!editForm.id) return 0;
    const baseSeconds = parseFloat(editForm.active_timer_elapsed || 0);
    if (editForm.active_timer_start) {
      const start = new Date(editForm.active_timer_start).getTime();
      const diffSeconds = Math.max(0, (timerNow - start) / 1000);
      return baseSeconds + diffSeconds;
    }
    return baseSeconds;
  }, [editForm.active_timer_start, editForm.active_timer_elapsed, timerNow]);

  const handleToggleTimer = async () => {
    const isRunning = !!editForm.active_timer_start;
    let payload = isRunning
      ? { active_timer_elapsed: activeTimerDuration, active_timer_start: null }
      : {
          active_timer_start: new Date().toISOString(),
          active_timer_activity: newLog.activity,
        };
    setEditForm((prev) => ({ ...prev, ...payload }));
    await supabase.from("4_production").update(payload).eq("id", editForm.id);
  };

  const handleStopTimer = async () => {
    const finalSeconds = activeTimerDuration;
    if (finalSeconds < 10) {
      const payload = { active_timer_elapsed: 0, active_timer_start: null };
      setEditForm((prev) => ({ ...prev, ...payload }));
      await supabase.from("4_production").update(payload).eq("id", editForm.id);
      showToast("Timer cleared (too short)");
      return;
    }
    const hrs = (finalSeconds / 3600).toFixed(2);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("10_session_logs")
      .insert([
        {
          project_id: editForm.request.id,
          date: today,
          activity: editForm.active_timer_activity,
          duration_hrs: parseFloat(hrs),
          notes: "Session Timer Auto-Log",
        },
      ])
      .select();
    if (data) setLogs((prev) => [data[0], ...prev]);
    const payload = { active_timer_elapsed: 0, active_timer_start: null };
    setEditForm((prev) => ({ ...prev, ...payload }));
    await supabase.from("4_production").update(payload).eq("id", editForm.id);
    showToast(`Saved ${hrs} hrs`);
  };

  const startTimerEdit = async () => {
    const currentTotal = activeTimerDuration;
    const h = Math.floor(currentTotal / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((currentTotal % 3600) / 60)
      .toString()
      .padStart(2, "0");
    setManualTime({ h, m });
    setIsEditingTimer(true);
    if (editForm.active_timer_start) {
      const payload = {
        active_timer_elapsed: currentTotal,
        active_timer_start: null,
      };
      setEditForm((prev) => ({ ...prev, ...payload }));
      await supabase.from("4_production").update(payload).eq("id", editForm.id);
    }
  };
  const saveManualTime = async () => {
    const newTotalSeconds =
      (parseInt(manualTime.h) || 0) * 3600 + (parseInt(manualTime.m) || 0) * 60;
    const payload = {
      active_timer_elapsed: newTotalSeconds,
      active_timer_start: null,
    };
    setEditForm((prev) => ({ ...prev, ...payload }));
    await supabase.from("4_production").update(payload).eq("id", editForm.id);
    setIsEditingTimer(false);
  };

  const handleSave = async () => {
    // Only saving config things here. Financials are saved in ProductionFinances
    const payload = {
      status: editForm.status,
      recording_due_date: editForm.recording_due_date,
      characters: editForm.characters,
      crx_batches: editForm.crx_batches,
      checklist: editForm.checklist,
      strikes: editForm.strikes,
      internal_notes: editForm.internal_notes,
    };
    await supabase.from("4_production").update(payload).eq("id", editForm.id);
    setItems((prev) =>
      prev.map((i) => (i.id === editForm.id ? { ...i, ...payload } : i))
    );
    showToast("Project Config Saved");
  };

  const handleAddLog = async () => {
    if (!newLog.duration_hrs) return;
    const { data } = await supabase
      .from("10_session_logs")
      .insert([{ project_id: editForm.request.id, ...newLog }])
      .select();
    if (data) {
      setLogs((prev) => [data[0], ...prev]);
      showToast("Log Added");
      setNewLog({ ...newLog, duration_hrs: "", notes: "" });
    }
  };
  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };
  const handleUpdateLog = async () => {
    await supabase
      .from("10_session_logs")
      .update({ ...tempLogData })
      .eq("id", editingLogId);
    setLogs((prev) =>
      prev.map((l) => (l.id === editingLogId ? tempLogData : l))
    );
    setEditingLogId(null);
  };
  const handleCancelEditLog = () => {
    setEditingLogId(null);
    setTempLogData({});
  };
  const handleEditLogClick = (log) => {
    setEditingLogId(log.id);
    setTempLogData({ ...log });
  };

  const executeEjection = async (target) => {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    if (target === "archived")
      await supabase
        .from("6_archive")
        .insert([{ original_data: item, reason: "Booted" }]);
    const up = { status: target };
    if (target === "completed") up.end_date = new Date().toISOString();
    await supabase
      .from("2_booking_requests")
      .update(up)
      .eq("id", item.request.id);
    await supabase.from("4_production").delete().eq("id", item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedId(null);
    setModal({ isOpen: false });
    showToast("Project Moved");
  };

  useEffect(() => {
    if (selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (item) setEditForm(JSON.parse(JSON.stringify(item)));
    }
  }, [selectedId, items]);

  const processedItems = useMemo(() => {
    let result = items;
    if (searchQuery)
      result = result.filter((i) =>
        i.request.book_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (statusFilter !== "All")
      result = result.filter(
        (i) => STATUS_MAP[i.status]?.label === statusFilter
      );
    result.sort(
      (a, b) =>
        new Date(a.recording_due_date || "9999-01-01") -
        new Date(b.recording_due_date || "9999-01-01")
    );
    return result;
  }, [items, searchQuery, statusFilter]);

  const modifyArray = (key, idx, field, val) => {
    const arr = [...(editForm[key] || [])];
    if (field === null) arr.splice(idx, 1);
    else arr[idx][field] = val;
    setEditForm((prev) => ({ ...prev, [key]: arr }));
  };
  const addArrayItem = (key, val) =>
    setEditForm((prev) => ({ ...prev, [key]: [...(prev[key] || []), val] }));

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Modal
        {...modal}
        onClose={() => setModal({ isOpen: false })}
        onConfirm={modal.onConfirm}
      />

      <div
        className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white border-r border-slate-200 flex-col z-20 shadow-xl h-full`}
      >
        <div className="p-5 border-b border-slate-100 bg-white/95 sticky top-0 z-10">
          <h2 className="text-lg font-black text-slate-900">Production OS</h2>
          <div className="mt-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              placeholder="Find project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {processedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedId === item.id ? "bg-slate-900 text-white shadow-lg" : "bg-white hover:border-indigo-200"}`}
            >
              <div className="flex justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${STATUS_MAP[item.status]?.color}`}
                >
                  {STATUS_MAP[item.status]?.label}
                </span>
                {item.active_timer_start && (
                  <Mic size={12} className="animate-pulse text-red-500" />
                )}
              </div>
              <h3 className="text-sm font-bold truncate">
                {item.request.book_title}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div
        className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col h-full overflow-hidden relative bg-slate-50`}
      >
        {/* GLOBAL PIPELINE - Always Visible at Top */}
        <div className="p-8 pb-0">
          <AllProductionFinances key={financialUpdateTrigger} />
        </div>

        {!selectedId ? (
          <div className="m-auto text-slate-300 font-black uppercase text-sm">
            Select a Project
          </div>
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-md border-b px-8 py-5 flex justify-between items-center sticky top-0 z-30">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden"
                >
                  <ArrowLeft />
                </button>
                <div>
                  <h1 className="text-2xl font-black">
                    {editForm.request?.book_title}
                  </h1>
                  <div className="text-xs font-bold text-slate-500 uppercase flex gap-4">
                    <span>
                      <User size={12} className="inline mr-1" />{" "}
                      {editForm.request?.client_name}
                    </span>
                    <span>
                      <Clock size={12} className="inline mr-1" /> Due:{" "}
                      {formatDate(editForm.recording_due_date)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-xl shadow-lg hover:bg-indigo-700 flex gap-2 items-center"
              >
                <Save size={14} /> Save
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex gap-1 mb-8 border-b pb-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-6 py-3 text-xs font-bold uppercase border-b-2 transition-all flex gap-2 items-center ${activeTab === t.id ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-slate-400"}`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="max-w-6xl mx-auto pb-24">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 space-y-6">
                      {/* NEW FINANCIAL MODULE */}
                      <ProductionFinances
                        project={
                          items.find((i) => i.id === selectedId)?.request
                        }
                        productionDefaults={{
                          pfh_rate: editForm.pfh_rate,
                          pozotron_rate: editForm.pozotron_rate,
                        }}
                        onUpdate={() =>
                          setFinancialUpdateTrigger((prev) => prev + 1)
                        } // REFRESH TRIGGER
                      />

                      {/* DANGER ZONE & CONFIG */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border shadow-sm">
                          <h4 className="text-xs font-black uppercase text-slate-400 mb-4">
                            Project Config
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400">
                                Phase
                              </label>
                              <select
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    status: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100"
                              >
                                {ACTIVE_PRODUCTION_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUS_MAP[s].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400">
                                Recording Due
                              </label>
                              <input
                                type="date"
                                value={editForm.recording_due_date || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    recording_due_date: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                          <h4 className="text-xs font-black uppercase text-red-400 mb-4">
                            Danger Zone
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() =>
                                setModal({
                                  isOpen: true,
                                  title: "Complete?",
                                  message: "Mark paid and archive?",
                                  onConfirm: () => executeEjection("completed"),
                                  confirmText: "Complete",
                                  type: "success",
                                })
                              }
                              className="col-span-2 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase"
                            >
                              Mark Paid & Complete
                            </button>
                            <button
                              onClick={() =>
                                setModal({
                                  isOpen: true,
                                  title: "Kick Back?",
                                  message: "Return to First 15?",
                                  onConfirm: () => executeEjection("first_15"),
                                  confirmText: "Kick Back",
                                })
                              }
                              className="py-3 bg-white border text-slate-500 rounded-xl text-xs font-bold uppercase"
                            >
                              Kick Back
                            </button>
                            <button
                              onClick={() =>
                                setModal({
                                  isOpen: true,
                                  title: "Archive?",
                                  message: "Boot to Archive?",
                                  onConfirm: () => executeEjection("archived"),
                                  confirmText: "Archive",
                                  type: "danger",
                                })
                              }
                              className="py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase"
                            >
                              Boot
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WORK LOG */}
                {activeTab === "work_log" && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Clock size={200} />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                              Session Timer
                            </h3>
                            {!isEditingTimer ? (
                              <button
                                onClick={startTimerEdit}
                                className="text-slate-500 hover:text-white"
                              >
                                <Pencil size={14} />
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={saveManualTime}
                                  className="text-emerald-400 text-[10px] uppercase font-bold border border-emerald-400 px-2 rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setIsEditingTimer(false)}
                                  className="text-slate-400 text-[10px] uppercase font-bold border border-slate-400 px-2 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {!isEditingTimer ? (
                            <div className="text-8xl font-black tabular-nums tracking-tighter leading-none">
                              {formatSeconds(activeTimerDuration)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-8xl font-black leading-none">
                              <input
                                type="number"
                                value={manualTime.h}
                                onChange={(e) =>
                                  setManualTime({
                                    ...manualTime,
                                    h: e.target.value,
                                  })
                                }
                                className="w-32 bg-transparent border-b-2 text-center outline-none"
                                placeholder="00"
                              />
                              <span className="text-4xl text-slate-600">:</span>
                              <input
                                type="number"
                                value={manualTime.m}
                                onChange={(e) =>
                                  setManualTime({
                                    ...manualTime,
                                    m: e.target.value,
                                  })
                                }
                                className="w-32 bg-transparent border-b-2 text-center outline-none"
                                placeholder="00"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2 bg-white/10 p-2 rounded-xl">
                            {["Prep", "Recording", "Editing", "Mastering"].map(
                              (a) => (
                                <button
                                  key={a}
                                  onClick={() => {
                                    setNewLog((p) => ({ ...p, activity: a }));
                                    if (editForm.active_timer_start) {
                                      setEditForm((p) => ({
                                        ...p,
                                        active_timer_activity: a,
                                      }));
                                      supabase
                                        .from("4_production")
                                        .update({ active_timer_activity: a })
                                        .eq("id", editForm.id);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded text-[10px] uppercase font-bold ${editForm.active_timer_activity === a || newLog.activity === a ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/10"}`}
                                >
                                  {a}
                                </button>
                              )
                            )}
                          </div>
                          <div className="flex gap-3">
                            {!editForm.active_timer_start ? (
                              <button
                                onClick={handleToggleTimer}
                                className="flex-1 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm shadow-lg hover:bg-emerald-400"
                              >
                                <Play fill="currentColor" /> Start
                              </button>
                            ) : (
                              <button
                                onClick={handleToggleTimer}
                                className="flex-1 h-16 bg-amber-500 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm shadow-lg animate-pulse"
                              >
                                <Pause fill="currentColor" /> Pause
                              </button>
                            )}
                            <button
                              onClick={handleStopTimer}
                              disabled={activeTimerDuration < 1}
                              className="h-16 w-20 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50"
                            >
                              <Square fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                          <ListTodo size={16} /> History & Manual Entry
                        </h4>
                      </div>
                      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1 w-full md:w-32">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={newLog.date}
                            onChange={(e) =>
                              setNewLog({ ...newLog, date: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1 w-full md:w-40">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                            Activity
                          </label>
                          <select
                            value={newLog.activity}
                            onChange={(e) =>
                              setNewLog({ ...newLog, activity: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                          >
                            <option>Prep</option>
                            <option>Recording</option>
                            <option>Editing</option>
                            <option>Mastering</option>
                            <option>Admin</option>
                          </select>
                        </div>
                        <div className="space-y-1 flex-1 w-full">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. First 15..."
                            value={newLog.notes}
                            onChange={(e) =>
                              setNewLog({ ...newLog, notes: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-1 w-full md:w-24">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                            Hours
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            placeholder="0.0"
                            value={newLog.duration_hrs}
                            onChange={(e) =>
                              setNewLog({
                                ...newLog,
                                duration_hrs: e.target.value,
                              })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                          />
                        </div>
                        <button
                          onClick={handleAddLog}
                          className="w-full md:w-auto h-[38px] px-6 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800 shadow-lg"
                        >
                          Add
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Activity</th>
                              <th className="px-6 py-4 w-full">Notes</th>
                              <th className="px-6 py-4">Hours</th>
                              <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {logs
                              .filter(
                                (l) => l.project_id === editForm.request?.id
                              )
                              .map((log) => (
                                <tr
                                  key={log.id}
                                  className="hover:bg-slate-50 text-xs font-bold text-slate-700"
                                >
                                  {editingLogId === log.id ? (
                                    <>
                                      <td className="px-4 py-3">
                                        <input
                                          type="date"
                                          value={tempLogData.date}
                                          onChange={(e) =>
                                            setTempLogData({
                                              ...tempLogData,
                                              date: e.target.value,
                                            })
                                          }
                                          className="w-full p-1 border rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <select
                                          value={tempLogData.activity}
                                          onChange={(e) =>
                                            setTempLogData({
                                              ...tempLogData,
                                              activity: e.target.value,
                                            })
                                          }
                                          className="w-full p-1 border rounded bg-white"
                                        >
                                          <option>Prep</option>
                                          <option>Recording</option>
                                          <option>Editing</option>
                                          <option>Mastering</option>
                                          <option>Admin</option>
                                        </select>
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="text"
                                          value={tempLogData.notes || ""}
                                          onChange={(e) =>
                                            setTempLogData({
                                              ...tempLogData,
                                              notes: e.target.value,
                                            })
                                          }
                                          className="w-full p-1 border rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          step="0.25"
                                          value={tempLogData.duration_hrs}
                                          onChange={(e) =>
                                            setTempLogData({
                                              ...tempLogData,
                                              duration_hrs: e.target.value,
                                            })
                                          }
                                          className="w-20 p-1 border rounded"
                                        />
                                      </td>
                                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                          onClick={handleUpdateLog}
                                          className="text-emerald-500"
                                        >
                                          <Check size={16} />
                                        </button>
                                        <button
                                          onClick={handleCancelEditLog}
                                          className="text-slate-400"
                                        >
                                          <X size={16} />
                                        </button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-6 py-4">
                                        {formatDate(log.date)}
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] uppercase tracking-wide">
                                          {log.activity}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 italic font-medium">
                                        {log.notes || "-"}
                                      </td>
                                      <td className="px-6 py-4">
                                        {log.duration_hrs} hrs
                                      </td>
                                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button
                                          onClick={() =>
                                            handleEditLogClick(log)
                                          }
                                          className="text-slate-300 hover:text-indigo-500"
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteLog(log.id)
                                          }
                                          className="text-slate-300 hover:text-red-500"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            {logs.filter(
                              (l) => l.project_id === editForm.request?.id
                            ).length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-8 text-center text-slate-400 text-xs font-medium italic"
                                >
                                  No work logged yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* CRX, BIBLE, TASKS, NOTES Tabs... (Standard logic preserved) */}
                {/* CRX */}
                {activeTab === "crx" && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                          <Activity size={16} /> File Flow Tracker
                        </h4>
                        <button
                          onClick={() =>
                            addArrayItem("crx_batches", {
                              name: `Batch ${(editForm.crx_batches || []).length + 1}`,
                              sent_date: new Date().toISOString().split("T")[0],
                              return_date: "",
                              notes: "",
                            })
                          }
                          className="text-xs font-bold uppercase bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow-lg"
                        >
                          + Log File Send
                        </button>
                      </div>
                      <div className="space-y-4">
                        {(editForm.crx_batches || []).map((batch, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col lg:flex-row gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100"
                          >
                            <div className="flex-1 w-full space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                Batch Name
                              </label>
                              <input
                                value={batch.name}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                FH (Size)
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={batch.fh}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "fh",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="w-full lg:w-36 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                Date Sent
                              </label>
                              <input
                                type="date"
                                value={batch.sent_date}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "sent_date",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="w-full lg:w-36 space-y-1">
                              <label className="text-[9px] font-black uppercase text-indigo-400 ml-1">
                                Notes Rec'd
                              </label>
                              <input
                                type="date"
                                value={batch.return_date}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "return_date",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-bold focus:border-indigo-400"
                              />
                            </div>
                            <button
                              onClick={() =>
                                modifyArray("crx_batches", idx, null, null)
                              }
                              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* BIBLE */}
                {activeTab === "bible" && (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                      <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                        <BookOpen size={16} /> Character List
                      </h4>
                      <button
                        onClick={() =>
                          addArrayItem("characters", {
                            name: "",
                            voice: "",
                            page: "",
                            time: "",
                          })
                        }
                        className="text-[10px] font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-300 shadow-sm transition-all"
                      >
                        + Add Character
                      </button>
                    </div>
                    <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
                      {(editForm.characters || []).map((char, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 items-center group"
                        >
                          <div className="col-span-3">
                            <input
                              placeholder="Name"
                              value={char.name}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              placeholder="Voice Desc"
                              value={char.voice}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "voice",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              placeholder="Pg 12"
                              value={char.page}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "page",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              placeholder="00:00"
                              value={char.time}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "time",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              onClick={() =>
                                modifyArray("characters", idx, null, null)
                              }
                              className="text-slate-300 hover:text-red-500 p-2"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* TASKS */}
                {activeTab === "tasks" && (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                        <ListTodo size={16} /> Production Steps
                      </h4>
                      <button
                        onClick={() =>
                          addArrayItem("checklist", {
                            label: "New Task",
                            checked: false,
                          })
                        }
                        className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100"
                      >
                        + Add Task
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(editForm.checklist || []).map((task, idx) => (
                        <div
                          key={idx}
                          className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all bg-white shadow-sm"
                        >
                          <button
                            onClick={() =>
                              modifyArray(
                                "checklist",
                                idx,
                                "checked",
                                !task.checked
                              )
                            }
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${task.checked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-200"}`}
                          >
                            {task.checked && (
                              <Check size={16} strokeWidth={4} />
                            )}
                          </button>
                          <input
                            value={task.label}
                            onChange={(e) =>
                              modifyArray(
                                "checklist",
                                idx,
                                "label",
                                e.target.value
                              )
                            }
                            className={`flex-1 bg-transparent text-sm font-bold outline-none ${task.checked ? "text-slate-400 line-through decoration-2 decoration-emerald-200" : "text-slate-700"}`}
                          />
                          <button
                            onClick={() =>
                              modifyArray("checklist", idx, null, null)
                            }
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* NOTES */}
                {activeTab === "notes" && (
                  <div className="bg-yellow-50/50 p-8 rounded-[2rem] border border-yellow-100 shadow-sm h-[600px] flex flex-col relative animate-in fade-in">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <StickyNote size={100} className="text-yellow-600" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-yellow-600/50 mb-6 flex items-center gap-2 relative z-10">
                      <StickyNote size={16} /> Internal Notes
                    </h4>
                    <textarea
                      value={editForm.internal_notes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          internal_notes: e.target.value,
                        })
                      }
                      className="flex-1 w-full resize-none outline-none text-base font-medium text-slate-700 leading-relaxed bg-transparent relative z-10 placeholder-yellow-600/30"
                      placeholder="Type details here..."
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
