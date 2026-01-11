"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Loader2,
  Save,
  User,
  Clock,
  BookOpen,
  Search,
  RefreshCw,
  ArrowLeft,
  LayoutDashboard,
  Timer,
  CalendarDays,
  ListTodo,
  StickyNote,
} from "lucide-react";

// --- SHARED ---
import Toast from "../shared/Toast";
import Modal from "../shared/Modal";
import AllProductionFinances from "../finance/AllProductionFinances";

// --- TABS ---
import ProjectOverview from "./tabs/ProjectOverview";
import SessionTimer from "./tabs/SessionTimer";
import ProductionCRX from "./tabs/ProductionCRX";
import ProductionBible from "./tabs/ProductionBible";
import ProductionChecklist from "./tabs/ProductionChecklist";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONSTANTS ---
const STATUS_MAP = {
  pre_production: {
    label: "Text Prep",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  recording: {
    label: "Recording",
    color: "bg-red-50 text-red-600 border-red-200 animate-pulse",
  },
  editing: {
    label: "Editing",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  review: {
    label: "CRX Review",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  mastering: {
    label: "Mastering",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  done: {
    label: "Complete",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
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

export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ isOpen: false });
  const [financialTrigger, setFinancialTrigger] = useState(0);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
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
        crx_batches: i.crx_batches || [],
        characters: i.characters || [],
        checklist: i.checklist || [
          { id: 1, label: "Script Pre-read", checked: false },
        ],
        other_expenses: i.other_expenses || [],
        pfh_rate: i.pfh_rate || 250,
        pozotron_rate: i.pozotron_rate || 14,
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

  // Sync Form when Selection Changes
  useEffect(() => {
    if (selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (item) setEditForm(JSON.parse(JSON.stringify(item)));
    }
  }, [selectedId, items]);

  // --- ACTIONS ---
  const handleSave = async () => {
    const payload = {
      status: editForm.status,
      recording_due_date: editForm.recording_due_date,
      characters: editForm.characters,
      crx_batches: editForm.crx_batches,
      checklist: editForm.checklist,
      internal_notes: editForm.internal_notes,
    };
    await supabase.from("4_production").update(payload).eq("id", editForm.id);
    setItems((prev) =>
      prev.map((i) => (i.id === editForm.id ? { ...i, ...payload } : i))
    );
    showToast("Project Config Saved");
  };

  // Ejection Logic (Complete/Archive/Kickback)
  const executeEjection = async (target) => {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    if (target === "archived") {
      await supabase
        .from("6_archive")
        .insert([{ original_data: item, reason: "Booted from Prod" }]);
    }

    const updatePayload = { status: target };
    if (target === "completed")
      updatePayload.end_date = new Date().toISOString();

    await supabase
      .from("2_booking_requests")
      .update(updatePayload)
      .eq("id", item.request.id);
    await supabase.from("4_production").delete().eq("id", item.id);

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedId(null);
    setModal({ isOpen: false });
    showToast(`Project moved to ${target}`);
  };

  // Helper for Tabs to update local state without saving yet
  const handleFormUpdate = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  // Helper for SessionTimer to update Logs/Project state
  const handleLogUpdate = (type, payload) => {
    if (type === "add_log") setLogs((prev) => [payload, ...prev]);
    if (type === "delete_log")
      setLogs((prev) => prev.filter((l) => l.id !== payload));
    if (type === "update_log")
      setLogs((prev) => prev.map((l) => (l.id === payload.id ? payload : l)));
    if (type === "project_update") {
      setEditForm((prev) => ({ ...prev, ...payload }));
      setItems((prev) =>
        prev.map((i) => (i.id === editForm.id ? { ...i, ...payload } : i))
      );
    }
  };

  const processedItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      result = result.filter((i) =>
        i.request.book_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [items, searchQuery]);

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
      <Modal {...modal} onClose={() => setModal({ isOpen: false })} />

      {/* SIDEBAR LIST */}
      <div
        className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white border-r border-slate-200 flex-col z-20 shadow-xl h-full shrink-0`}
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
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${STATUS_MAP[item.status]?.color || "bg-slate-100"}`}
                >
                  {STATUS_MAP[item.status]?.label || item.status}
                </span>
              </div>
              <h3 className="text-sm font-bold truncate">
                {item.request.book_title}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN PANEL */}
      <div
        className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col h-full overflow-hidden relative bg-slate-50`}
      >
        <div className="p-8 pb-0">
          <AllProductionFinances key={financialTrigger} />
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
              <div className="flex gap-1 mb-8 border-b pb-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-6 py-3 text-xs font-bold uppercase border-b-2 transition-all flex gap-2 items-center whitespace-nowrap ${activeTab === t.id ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-slate-400"}`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="max-w-6xl mx-auto pb-24">
                {activeTab === "overview" && (
                  <ProjectOverview
                    project={editForm.request}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    setModal={setModal}
                    executeEjection={executeEjection}
                    onFinancialUpdate={() => setFinancialTrigger((p) => p + 1)}
                  />
                )}
                {activeTab === "work_log" && (
                  <SessionTimer
                    project={editForm}
                    logs={logs.filter(
                      (l) => l.project_id === editForm.request?.id
                    )}
                    onLogUpdate={handleLogUpdate}
                    showToast={showToast}
                  />
                )}
                {activeTab === "crx" && (
                  <ProductionCRX
                    batches={editForm.crx_batches}
                    onChange={handleFormUpdate}
                  />
                )}
                {activeTab === "bible" && (
                  <ProductionBible
                    characters={editForm.characters}
                    onChange={handleFormUpdate}
                  />
                )}
                {activeTab === "tasks" && (
                  <ProductionChecklist
                    checklist={editForm.checklist}
                    onChange={handleFormUpdate}
                  />
                )}
                {activeTab === "notes" && (
                  <div className="bg-yellow-50/50 p-8 rounded-[2rem] border border-yellow-100 shadow-sm h-[600px] flex flex-col relative animate-in fade-in">
                    <h4 className="text-sm font-black uppercase text-yellow-600/50 mb-6 flex items-center gap-2 relative z-10">
                      <StickyNote size={16} /> Internal Notes
                    </h4>
                    <textarea
                      value={editForm.internal_notes || ""}
                      onChange={(e) =>
                        handleFormUpdate("internal_notes", e.target.value)
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
