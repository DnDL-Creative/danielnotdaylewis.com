"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import VoiceoverProjectModal from "@/src/app/(admin)/admin/voiceover-tracker/_components/VoiceoverProjectModal";
import StickyNotes from "@/src/components/StickyNotes";

// --- IMPORT TAB COMPONENTS ---
import Auditions from "./_components/tabs/Auditions";
import Submitted from "./_components/tabs/Submitted";
import Shortlisted from "./_components/tabs/Shortlisted";
import Booked from "./_components/tabs/Booked";
import Archives from "./_components/tabs/Archives"; // Handles Archives & Skipped
import VoiceoverStats from "./_components/tabs/Stats";

import {
  Loader2,
  Search,
  ChevronDown,
  Check,
  Wand2,
  User,
  AlertCircle,
  Send,
  ArrowUpDown,
  Ban,
  ArrowLeft,
  Star,
  Trophy,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";

const supabase = createClient();

// --- HELPER COMPONENT: CUSTOM SELECT ---
const CustomSelect = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-20 w-full sm:w-auto" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl px-4 py-3 transition-all justify-between min-w-[140px]"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-slate-500 shrink-0" />}
          <span className="truncate">
            {options.find((o) => o.value === value)?.label || label}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-3 text-left text-xs font-bold uppercase text-slate-400 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ClientVoiceoverTracker({ initialItems }) {
  // Initialize state with props from Server Component
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("Auditions");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  // Keep fetchData for manual refreshes (e.g., after Edit Modal saves)
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("11_voiceover_tracker")
      .select("*")
      .order("due_date", { ascending: true });
    if (error) console.error("Fetch Error:", error);
    else setItems(data);
    setLoading(false);
  };

  // --- FILTER LOGIC ---
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeTab === "Auditions")
      result = result.filter((i) => i.status === "inbox");
    else if (activeTab === "Submitted")
      result = result.filter((i) => i.status === "submitted");
    else if (activeTab === "Shortlist")
      result = result.filter((i) => i.status === "shortlist");
    else if (activeTab === "Booked")
      result = result.filter((i) => i.status === "booked");
    else if (activeTab === "Archives")
      result = result.filter((i) =>
        ["archived", "rejected"].includes(i.status)
      );
    else if (activeTab === "Skipped")
      result = result.filter((i) => i.status === "skipped");

    if (clientFilter !== "all")
      result = result.filter((i) => i.client_name === clientFilter);
    if (searchQuery)
      result = result.filter(
        (i) =>
          i.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    result.sort((a, b) => {
      if (sortBy === "urgency") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });
    return result;
  }, [items, activeTab, focusFilter, clientFilter, searchQuery, sortBy]);

  // --- ACTIONS ---
  const updateStatus = async (id, newStatus, extraFields = {}) => {
    // Optimistic Update
    const updated = items.map((i) =>
      i.id === id ? { ...i, status: newStatus, ...extraFields } : i
    );
    setItems(updated);
    setConfirmConfig({ isOpen: false });

    const { error } = await supabase
      .from("11_voiceover_tracker")
      .update({ status: newStatus, ...extraFields })
      .eq("id", id);

    if (error) {
      console.error("Update Failed:", error);
      alert("Failed to save changes. Please check your connection.");
      fetchData(); // Revert on error
    }
  };

  const handleRequestAction = (id, actionType, e) => {
    e.stopPropagation();
    let config = {};
    const actions = {
      submit: {
        title: "Submit Audition?",
        msg: "Moving to 'Submitted' pipeline.",
        color: "blue",
        icon: Send,
        fn: () =>
          updateStatus(id, "submitted", {
            submitted_at: new Date().toISOString(),
            submitted_timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
      },
      revert: {
        title: "Revert to Audition?",
        msg: "Moving back to Inbox. This clears the submission time.",
        color: "slate",
        icon: ArrowLeft,
        fn: () => updateStatus(id, "inbox", { submitted_at: null }),
      },
      shortlist: {
        title: "Shortlist!",
        msg: "Congrats! Moving to 'Shortlist'.",
        color: "purple",
        icon: Star,
        fn: () => updateStatus(id, "shortlist"),
      },
      book: {
        title: "Project Booked!",
        msg: "Awesome! Moving to 'Booked'.",
        color: "green",
        icon: Trophy,
        fn: () => updateStatus(id, "booked"),
      },
      archive: {
        title: "Archive Project?",
        msg: "Moving to archives.",
        color: "slate",
        icon: Archive,
        fn: () => updateStatus(id, "archived"),
      },
      skip: {
        title: "Skip Audition?",
        msg: "Moving to 'Skipped'.",
        color: "red",
        icon: Ban,
        fn: () => updateStatus(id, "skipped"),
      },
      recover: {
        title: "Recover Project?",
        msg: "Moving back to Inbox.",
        color: "blue",
        icon: RotateCcw,
        fn: () => updateStatus(id, "inbox"),
      },
      delete: {
        title: "Permanently Delete?",
        msg: "This cannot be undone.",
        color: "red",
        icon: Trash2,
        fn: async () => {
          setItems((prev) => prev.filter((i) => i.id !== id));
          await supabase.from("11_voiceover_tracker").delete().eq("id", id);
          setConfirmConfig({ isOpen: false });
        },
      },
    };

    if (actionType === "demote")
      config = {
        title: "Move Back?",
        message: "Demoting to Submitted.",
        color: "slate",
        icon: ArrowLeft,
        action: () => updateStatus(id, "submitted"),
      };
    else if (actions[actionType])
      config = {
        title: actions[actionType].title,
        message: actions[actionType].msg,
        color: actions[actionType].color,
        icon: actions[actionType].icon,
        action: actions[actionType].fn,
      };

    setConfirmConfig({ isOpen: true, ...config });
  };

  const handleEditProject = (item) => {
    setEditingProject(item);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    fetchData(); // Refresh data from server after edit
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-40 font-sans relative">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* --- TABS --- */}
        <div className="mb-8 flex justify-start md:justify-center">
          <div className="pt-18 md:pt-2 flex gap-2 overflow-x-auto md:overflow-visible p-4 scrollbar-hide -mx-4 md:mx-0 md:p-0 md:flex-wrap">
            {[
              "Auditions",
              "Submitted",
              "Shortlist",
              "Booked",
              "Archives",
              "Skipped",
              "Stats",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Stats" ? (
          <VoiceoverStats data={items} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* --- SEARCH & FILTERS --- */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center">
              <div className="relative flex-grow lg:flex-grow-0 lg:w-96">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Projects..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:border-blue-500 outline-none uppercase placeholder:normal-case transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 flex-wrap flex-grow">
                {activeTab === "Auditions" && (
                  <CustomSelect
                    label="Urgency"
                    value={focusFilter}
                    icon={AlertCircle}
                    options={[
                      { label: "Show All", value: "all" },
                      { label: "🚨 Overdue", value: "overdue" },
                      { label: "📅 Upcoming", value: "upcoming" },
                    ]}
                    onChange={setFocusFilter}
                  />
                )}
                <CustomSelect
                  label="Client"
                  value={clientFilter}
                  icon={User}
                  options={[
                    { label: "All Clients", value: "all" },
                    { label: "ASP", value: "ASP" },
                    { label: "IDIOM", value: "IDIOM" },
                  ]}
                  onChange={setClientFilter}
                />
                <CustomSelect
                  label="Sort"
                  value={sortBy}
                  icon={ArrowUpDown}
                  options={[
                    { label: "Urgency", value: "urgency" },
                    { label: "Newest", value: "newest" },
                  ]}
                  onChange={setSortBy}
                />
              </div>

              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsModalOpen(true);
                }}
                className="w-full lg:w-auto bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95 whitespace-nowrap shrink-0"
              >
                <Wand2 size={16} /> New Audition
              </button>
            </div>

            {/* --- LOADING & EMPTY STATES --- */}
            {loading ? (
              <div className="flex justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold uppercase text-xs tracking-widest border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                {activeTab === "Auditions"
                  ? "Inbox Zero! 🎉"
                  : "No projects found"}
              </div>
            ) : (
              // --- RENDER MODULAR TAB COMPONENTS ---
              <>
                {activeTab === "Auditions" && (
                  <Auditions
                    items={filteredItems}
                    onAction={handleRequestAction}
                    onEdit={handleEditProject}
                  />
                )}
                {activeTab === "Submitted" && (
                  <Submitted
                    items={filteredItems}
                    onAction={handleRequestAction}
                    onEdit={handleEditProject}
                  />
                )}
                {activeTab === "Shortlist" && (
                  <Shortlisted
                    items={filteredItems}
                    onAction={handleRequestAction}
                    onEdit={handleEditProject}
                  />
                )}
                {activeTab === "Booked" && (
                  <Booked
                    items={filteredItems}
                    onAction={handleRequestAction}
                    onEdit={handleEditProject}
                  />
                )}
                {(activeTab === "Archives" || activeTab === "Skipped") && (
                  <Archives
                    items={filteredItems}
                    onAction={handleRequestAction}
                    onEdit={handleEditProject}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <VoiceoverProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={editingProject}
        onSave={handleModalSave}
      />

      {/* STICKY NOTES */}
      <StickyNotes />

      {/* CONFIRMATION DIALOG */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden group">
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${confirmConfig.color === "green" ? "bg-green-500" : confirmConfig.color === "red" ? "bg-red-500" : confirmConfig.color === "blue" ? "bg-blue-500" : confirmConfig.color === "purple" ? "bg-purple-500" : "bg-slate-500"}`}
            />
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 ${confirmConfig.color === "green" ? "bg-green-500/20 text-green-400" : confirmConfig.color === "red" ? "bg-red-500/20 text-red-400" : confirmConfig.color === "blue" ? "bg-blue-500/20 text-blue-400" : confirmConfig.color === "purple" ? "bg-purple-500/20 text-purple-400" : "bg-slate-800 text-slate-400"}`}
            >
              {confirmConfig.icon ? (
                <confirmConfig.icon size={32} />
              ) : (
                <AlertCircle size={32} />
              )}
            </div>
            <h3 className="text-xl font-black uppercase text-white mb-2 relative z-10">
              {confirmConfig.title}
            </h3>
            <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed relative z-10">
              {confirmConfig.message}
            </p>
            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setConfirmConfig({ isOpen: false })}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.action}
                className={`flex-1 py-3 rounded-xl font-bold uppercase text-white shadow-lg transition-colors ${confirmConfig.color === "green" ? "bg-green-600 hover:bg-green-500 shadow-green-900/20" : confirmConfig.color === "red" ? "bg-red-600 hover:bg-red-500 shadow-red-900/20" : confirmConfig.color === "purple" ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20" : confirmConfig.color === "blue" ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" : "bg-slate-600 hover:bg-slate-500"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
