"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Loader2,
  Save,
  X,
  User,
  BookOpen,
  Calendar,
  Layers,
  Mic,
  AlertTriangle,
  PauseCircle,
  Clock,
  Skull,
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
  PieChart,
  ChevronRight,
  Plus,
  CreditCard,
  Receipt,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 1. CONFIGURATION ---

const WORDS_PER_FH = 9300;
const BIZ_DAYS_PER_FH_REVIEW = 2;
const DEFAULT_POZOTRON_RATE = 14;
const DEFAULT_PFH_RATE = 250;

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
  mastering: {
    label: "Mastering",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    icon: Layers,
  },
  review: {
    label: "CRX Review",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: Clock,
  },
  producer_delay: {
    label: "Producer Delay",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: AlertTriangle,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-slate-100 text-slate-500 border-slate-300",
    icon: PauseCircle,
  },
  done: {
    label: "Complete",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
};

const TABS = [
  { id: "overview", label: "Overview & Fin", icon: LayoutDashboard },
  { id: "crx", label: "CRX Matrix", icon: Clock },
  { id: "bible", label: "Bible", icon: BookOpen },
  { id: "tasks", label: "Checklists", icon: ListTodo },
  { id: "notes", label: "Notes", icon: StickyNote },
];

// --- 2. LOGIC UTILS ---

const addBusinessDays = (startDate, daysToAdd) => {
  if (!startDate) return new Date();
  let currentDate = new Date(startDate);
  currentDate = new Date(
    currentDate.valueOf() + currentDate.getTimezoneOffset() * 60000
  );
  let added = 0;
  while (added < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return currentDate;
};

const calculateCRXDeadline = (sentDateStr, fh) => {
  if (!sentDateStr || !fh || parseFloat(fh) === 0) return null;
  const daysNeeded = Math.ceil(parseFloat(fh) * BIZ_DAYS_PER_FH_REVIEW);
  const deadline = addBusinessDays(sentDateStr, daysNeeded);
  return deadline.toISOString().split("T")[0];
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const fixedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return fixedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val || 0
  );

// --- 3. SUB-COMPONENTS ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-[250] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 border ${type === "error" ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-900 border-slate-800 text-white"}`}
    >
      {type === "error" ? (
        <XCircle size={20} />
      ) : (
        <CheckCircle2 size={20} className="text-emerald-400" />
      )}
      <span className="font-bold text-sm">{message}</span>
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

  const [globalTaxRate] = useState(25); // 25%

  // --- ACTIONS ---
  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const fetchItems = async () => {
    setLoading(true);
    const { data: prodData, error } = await supabase
      .from("4_production")
      .select(
        `*, request:2_booking_requests!inner (id, book_title, client_name, client_type, cover_image_url, word_count, status, email, ref_number)`
      )
      .neq("request.status", "deleted")
      .neq("request.status", "archived")
      .order("recording_due_date", { ascending: true });

    if (error) {
      showToast("Sync Error", "error");
    } else {
      const { data: logData } = await supabase
        .from("10_session_logs")
        .select("*");
      setLogs(logData || []);

      const unique = (prodData || []).map((i) => ({
        ...i,
        // Ensure defaults for JSON columns
        crx_batches: Array.isArray(i.crx_batches) ? i.crx_batches : [],
        characters: Array.isArray(i.characters) ? i.characters : [],
        checklist:
          Array.isArray(i.checklist) && i.checklist.length > 0
            ? i.checklist
            : [{ id: 1, label: "Script Pre-read", checked: false }],
        other_expenses: Array.isArray(i.other_expenses) ? i.other_expenses : [], // NEW: Ledger
        pfh_rate: i.pfh_rate || DEFAULT_PFH_RATE, // NEW: Editable Rate
        pozotron_rate: i.pozotron_rate || DEFAULT_POZOTRON_RATE, // NEW: Editable Fee
        internal_notes: i.internal_notes || "",
        strikes: i.strikes || 0,
      }));
      setItems(unique);
      if (unique.length > 0 && !selectedId) setSelectedId(unique[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- SYNC EDIT FORM ON SELECTION ---
  useEffect(() => {
    if (selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (item) {
        // Deep copy to prevent mutation issues
        setEditForm({
          ...item,
          characters: JSON.parse(JSON.stringify(item.characters || [])),
          crx_batches: JSON.parse(JSON.stringify(item.crx_batches || [])),
          checklist: JSON.parse(JSON.stringify(item.checklist || [])),
          other_expenses: JSON.parse(JSON.stringify(item.other_expenses || [])),
          pfh_rate: item.pfh_rate || DEFAULT_PFH_RATE,
          pozotron_rate: item.pozotron_rate || DEFAULT_POZOTRON_RATE,
        });
      }
    }
  }, [selectedId, items]);

  // --- LIVE FINANCIAL CALCULATOR ---
  const financials = useMemo(() => {
    if (!editForm.id) return null;

    // 1. Core Params
    const wc = editForm.request?.word_count || 0;
    const estFH = wc / WORDS_PER_FH;
    const pfhRate = parseFloat(editForm.pfh_rate) || 0;
    const pozRate = parseFloat(editForm.pozotron_rate) || 0;

    // 2. Revenue
    const gross = estFH * pfhRate;

    // 3. Expenses
    const pozotronCost = estFH * pozRate;
    const otherExpensesTotal = (editForm.other_expenses || []).reduce(
      (acc, curr) => acc + (parseFloat(curr.amount) || 0),
      0
    );
    const totalExpenses = pozotronCost + otherExpensesTotal;

    // 4. Net & Tax
    const net = gross - totalExpenses;
    const taxableIncome = net * 0.8; // 20% QBI Deduction
    const taxBill = taxableIncome * (globalTaxRate / 100);
    const takeHome = net - taxBill;

    // 5. Real Hours (from logs)
    const projectLogs = logs.filter(
      (l) => l.project_id === editForm.request?.id
    );
    const totalHoursWorked = projectLogs.reduce(
      (acc, l) => acc + (parseFloat(l.duration_hrs) || 0),
      0
    );

    // 6. EPH
    const actualEPH = totalHoursWorked > 0 ? takeHome / totalHoursWorked : 0;
    const effectiveTaxRate = net > 0 ? (taxBill / net) * 100 : 0;

    return {
      wc,
      estFH,
      gross,
      pozotronCost,
      otherExpensesTotal,
      net,
      taxBill,
      takeHome,
      totalHoursWorked,
      actualEPH,
      effectiveTaxRate,
    };
  }, [editForm, logs, globalTaxRate]);

  // --- ACTIONS ---
  const handleSave = async () => {
    const batches = editForm.crx_batches || [];
    let calculatedCRXDate = null;

    if (batches.length > 0) {
      const dates = batches
        .map((b) => calculateCRXDeadline(b.submitted_date, b.fh))
        .filter(Boolean);
      if (dates.length > 0) {
        dates.sort().reverse();
        calculatedCRXDate = dates[0];
      }
    }

    const payload = {
      status: editForm.status,
      recording_due_date: editForm.recording_due_date,
      crx_due_date: calculatedCRXDate,
      characters: editForm.characters,
      crx_batches: editForm.crx_batches,
      checklist: editForm.checklist,
      other_expenses: editForm.other_expenses, // Saved to DB
      pfh_rate: editForm.pfh_rate, // Saved to DB
      pozotron_rate: editForm.pozotron_rate, // Saved to DB
      internal_notes: editForm.internal_notes,
      strikes: editForm.strikes,
    };

    const { error } = await supabase
      .from("4_production")
      .update(payload)
      .eq("id", editForm.id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === editForm.id ? { ...i, ...payload } : i))
      );
      showToast("Project Saved");
    } else {
      showToast("Save Failed", "error");
    }
  };

  const modifyArray = (key, idx, field, val) => {
    const arr = [...(editForm[key] || [])];
    if (field === null) arr.splice(idx, 1);
    else arr[idx][field] = val;
    setEditForm((prev) => ({ ...prev, [key]: arr }));
  };

  const addArrayItem = (key, template) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), template],
    }));
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="h-screen w-screen flex bg-slate-50 overflow-hidden font-sans">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* --- SIDEBAR --- */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xl">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-2">
            <span>Workspace</span>
            <ChevronRight size={10} />
            <span>Projects</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Production OS
          </h2>

          <div className="mt-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              placeholder="Find project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-50 bg-slate-50/50 hide-scrollbar">
          {["All", "Recording", "Review"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase whitespace-nowrap transition-colors ${statusFilter === st ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-200"}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items
            .filter((i) =>
              statusFilter === "All"
                ? true
                : STATUS_MAP[i.status]?.label === statusFilter
            )
            .filter((i) =>
              i.request.book_title
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
            .map((item) => {
              const isActive = selectedId === item.id;
              const statusConf =
                STATUS_MAP[item.status] || STATUS_MAP.pre_production;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? "bg-slate-900 border-slate-900 shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {statusConf.label}
                    </span>
                    {item.strikes > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">
                        {item.strikes}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-sm font-bold truncate leading-tight mb-1 ${isActive ? "text-white" : "text-slate-800"}`}
                  >
                    {item.request.book_title}
                  </h3>
                  <div
                    className={`text-[10px] font-medium truncate ${isActive ? "text-slate-400" : "text-slate-400"}`}
                  >
                    {item.request.client_name}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={fetchItems}
            className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <LayoutDashboard size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-bold uppercase tracking-widest">
              Select a project
            </p>
          </div>
        ) : (
          <>
            {/* Main Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-6">
                {/* Cover Thumb */}
                <div className="w-12 h-16 bg-slate-100 rounded-lg shadow-inner overflow-hidden border border-slate-200">
                  {editForm.request?.cover_image_url ? (
                    <img
                      src={editForm.request.cover_image_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <BookOpen size={16} />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {editForm.request?.book_title}
                  </h1>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {editForm.request?.client_name}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Due:{" "}
                      {formatDate(editForm.recording_due_date)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold uppercase rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Tab Navigation */}
              <div className="flex gap-1 mb-8 border-b border-slate-200">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-t-lg"}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* === OVERVIEW & FINANCIALS === */}
                {activeTab === "overview" && financials && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Status Card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                          <Activity size={14} /> Project Config
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              Current Phase
                            </label>
                            <div className="relative">
                              <select
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    status: e.target.value,
                                  })
                                }
                                className="w-full appearance-none p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
                              >
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={14} className="rotate-90" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
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
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                Strikes
                              </label>
                              <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                  <button
                                    key={i}
                                    onClick={() =>
                                      setEditForm({
                                        ...editForm,
                                        strikes:
                                          editForm.strikes === i ? i - 1 : i,
                                      })
                                    }
                                    className={`flex-1 h-[42px] rounded-xl flex items-center justify-center transition-all ${editForm.strikes >= i ? "bg-red-500 text-white shadow-md shadow-red-200" : "bg-slate-50 border border-slate-100 text-slate-300"}`}
                                  >
                                    <Skull size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Inputs Card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                          <CreditCard size={14} /> Rates & Fees
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              PFH Rate ($)
                            </label>
                            <div className="relative">
                              <DollarSign
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={12}
                              />
                              <input
                                type="number"
                                value={editForm.pfh_rate}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    pfh_rate: e.target.value,
                                  })
                                }
                                className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              Pozotron Fee ($)
                            </label>
                            <div className="relative">
                              <DollarSign
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={12}
                              />
                              <input
                                type="number"
                                value={editForm.pozotron_rate}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    pozotron_rate: e.target.value,
                                  })
                                }
                                className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Expenses Ledger */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                            <Receipt size={14} /> Other Expenses
                          </h4>
                          <button
                            onClick={() =>
                              addArrayItem("other_expenses", {
                                desc: "",
                                amount: "",
                              })
                            }
                            className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(editForm.other_expenses || []).map((exp, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                placeholder="Description (e.g. Design)"
                                value={exp.desc}
                                onChange={(e) =>
                                  modifyArray(
                                    "other_expenses",
                                    idx,
                                    "desc",
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-indigo-300"
                              />
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                                  $
                                </span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={exp.amount}
                                  onChange={(e) =>
                                    modifyArray(
                                      "other_expenses",
                                      idx,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-indigo-300"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  modifyArray("other_expenses", idx, null, null)
                                }
                                className="p-2 text-slate-300 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(editForm.other_expenses || []).length === 0 && (
                            <div className="text-center py-4 text-[10px] text-slate-300 font-bold uppercase border border-dashed border-slate-100 rounded-xl">
                              No extra expenses logged
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            Total Deductions
                          </span>
                          <span className="text-sm font-black text-slate-700">
                            {formatCurrency(financials.otherExpensesTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Math */}
                    <div className="lg:col-span-7">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden sticky top-24">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                          <DollarSign size={200} />
                        </div>
                        <div className="absolute bottom-0 left-0 p-10 opacity-10">
                          <PieChart size={200} />
                        </div>

                        <h3 className="relative z-10 text-2xl font-black italic uppercase mb-10 flex items-center gap-3">
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] tracking-widest not-italic shadow-lg shadow-emerald-900/50">
                            LIVE P&L
                          </span>
                          Project Economics
                        </h3>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-10 relative z-10">
                          {/* Gross */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              Gross Revenue
                            </p>
                            <div className="text-4xl font-black tracking-tight">
                              {formatCurrency(financials.gross)}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {financials.estFH.toFixed(1)} FH @{" "}
                              {formatCurrency(editForm.pfh_rate)}
                            </div>
                          </div>

                          {/* Net */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              Net Profit (Pre-Tax)
                            </p>
                            <div className="text-4xl font-black tracking-tight text-white">
                              {formatCurrency(financials.net)}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-[10px] text-orange-400 font-medium flex justify-between max-w-[140px]">
                                <span>- Pozotron:</span>{" "}
                                <span>
                                  {formatCurrency(financials.pozotronCost)}
                                </span>
                              </div>
                              <div className="text-[10px] text-red-400 font-medium flex justify-between max-w-[140px]">
                                <span>- Expenses:</span>{" "}
                                <span>
                                  {formatCurrency(
                                    financials.otherExpensesTotal
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Take Home */}
                          <div className="col-span-2 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> QBI Adjusted Take Home
                              </p>
                              <div className="text-5xl font-black tracking-tight text-emerald-400">
                                {formatCurrency(financials.takeHome)}
                              </div>
                              <div className="text-xs text-emerald-500/60 font-medium">
                                Est. Tax Bill:{" "}
                                {formatCurrency(financials.taxBill)} (
                                {financials.effectiveTaxRate.toFixed(1)}% Eff.
                                Rate)
                              </div>
                            </div>
                            <div className="h-16 w-px bg-white/10 hidden md:block"></div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">
                                Real Hourly Rate
                              </p>
                              <div className="text-3xl font-black text-blue-400">
                                {formatCurrency(financials.actualEPH)}
                                <span className="text-sm text-blue-500/50">
                                  /hr
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {financials.totalHoursWorked.toFixed(1)} hrs
                                logged
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* === CRX MATRIX === */}
                {activeTab === "crx" && (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                          <PieChart size={16} /> Batch Timeline
                        </h4>
                        <button
                          onClick={() =>
                            addArrayItem("crx_batches", {
                              name: `Batch ${(editForm.crx_batches || []).length + 1}`,
                              fh: "0",
                              status: "Review",
                              submitted_date: new Date()
                                .toISOString()
                                .split("T")[0],
                            })
                          }
                          className="text-xs font-bold uppercase bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow-lg"
                        >
                          + Add Batch
                        </button>
                      </div>

                      {/* RECHARTS VISUALIZATION */}
                      {(editForm.crx_batches || []).length > 0 ? (
                        <div className="h-72 w-full mb-10">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={editForm.crx_batches}
                              layout="vertical"
                              margin={{
                                top: 5,
                                right: 30,
                                left: 40,
                                bottom: 5,
                              }}
                            >
                              <XAxis type="number" hide />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{
                                  fontSize: 11,
                                  fill: "#64748b",
                                  fontWeight: "bold",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                cursor={{ fill: "transparent" }}
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                                }}
                              />
                              <Bar
                                dataKey="fh"
                                name="Hours (FH)"
                                radius={[0, 6, 6, 0]}
                                barSize={24}
                              >
                                {(editForm.crx_batches || []).map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.status === "Approved"
                                          ? "#10b981"
                                          : entry.status === "Changes"
                                            ? "#f59e0b"
                                            : "#6366f1"
                                      }
                                    />
                                  )
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col gap-2 items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl mb-6 text-slate-300">
                          <Clock size={32} className="opacity-50" />
                          <span className="text-xs font-bold uppercase">
                            No Batches in Pipeline
                          </span>
                        </div>
                      )}

                      {/* BATCH INPUTS */}
                      <div className="space-y-4">
                        {(editForm.crx_batches || []).map((batch, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col lg:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors group"
                          >
                            <div className="flex-1 space-y-1 w-full">
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
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-400 outline-none"
                              />
                            </div>
                            <div className="w-full lg:w-32 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                FH
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={batch.fh}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "fh",
                                    e.target.value
                                  )
                                }
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-400 outline-none"
                              />
                            </div>
                            <div className="w-full lg:w-40 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                Sent Date
                              </label>
                              <input
                                type="date"
                                value={batch.submitted_date}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "submitted_date",
                                    e.target.value
                                  )
                                }
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-400 outline-none"
                              />
                            </div>
                            <div className="w-full lg:w-40 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                Status
                              </label>
                              <select
                                value={batch.status}
                                onChange={(e) =>
                                  modifyArray(
                                    "crx_batches",
                                    idx,
                                    "status",
                                    e.target.value
                                  )
                                }
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-indigo-400 outline-none"
                              >
                                <option>Review</option>
                                <option>Changes</option>
                                <option>Approved</option>
                              </select>
                            </div>
                            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 h-[42px] flex items-center justify-center min-w-[120px] shadow-sm">
                              <span className="text-[10px] font-black text-slate-500">
                                Due:{" "}
                                {formatDate(
                                  calculateCRXDeadline(
                                    batch.submitted_date,
                                    batch.fh
                                  )
                                )}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                modifyArray("crx_batches", idx, null, null)
                              }
                              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* === BIBLE === */}
                {activeTab === "bible" && (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
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
                      <div className="grid grid-cols-12 gap-4 mb-4 px-2">
                        <div className="col-span-3 text-[9px] font-black uppercase text-slate-400">
                          Name
                        </div>
                        <div className="col-span-4 text-[9px] font-black uppercase text-slate-400">
                          Voice/Notes
                        </div>
                        <div className="col-span-2 text-[9px] font-black uppercase text-slate-400">
                          Page/Par
                        </div>
                        <div className="col-span-2 text-[9px] font-black uppercase text-slate-400">
                          Audio Time
                        </div>
                        <div className="col-span-1"></div>
                      </div>
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
                      {(editForm.characters || []).length === 0 && (
                        <div className="text-center py-10 text-slate-300 text-xs italic">
                          No characters added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === TASKS === */}
                {activeTab === "tasks" && (
                  <div className="space-y-4">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
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
                  </div>
                )}

                {/* === NOTES === */}
                {activeTab === "notes" && (
                  <div className="bg-yellow-50/50 p-8 rounded-[2rem] border border-yellow-100 shadow-sm h-[600px] flex flex-col relative">
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
