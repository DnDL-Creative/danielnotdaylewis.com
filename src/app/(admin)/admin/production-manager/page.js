"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../utils/supabase/client"; // Adjust path based on your folder structure
import { useRouter } from "next/navigation";
import {
  Inbox,
  Kanban,
  Mic2,
  Briefcase,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Calendar as CalendarIcon,
  User,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

// --- INIT SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const TABS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "onboarding", label: "Onboarding", icon: Kanban },
  { id: "production", label: "Production", icon: Briefcase },
  { id: "auditions", label: "Auditions", icon: Mic2 },
  { id: "archive", label: "Archive", icon: Archive },
];

export default function ProductionManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inbox");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); // For Onboarding Accordion

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    // Fetch everything. We filter in memory for speed since dataset is < 1000 active rows
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) console.error("Error fetching:", error);
    else setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- ACTIONS ---

  // 1. Move Status (The core flow logic)
  const moveBooking = async (id, newStatus, extraUpdates = {}) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, ...extraUpdates })
      .eq("id", id);

    if (!error) {
      // Optimistic Update
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: newStatus, ...extraUpdates } : b
        )
      );
      if (newStatus === "archive") setExpandedRow(null);
    }
  };

  // 2. Toggle Checklist (Onboarding Phase)
  const toggleChecklist = async (id, field, currentValue) => {
    const { error } = await supabase
      .from("bookings")
      .update({ [field]: !currentValue })
      .eq("id", id);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: !currentValue } : b))
      );
    }
  };

  // 3. Add Strike (The Bouncer)
  const addStrike = async (id, currentCount) => {
    const newCount = (currentCount || 0) + 1;
    await supabase
      .from("bookings")
      .update({ strike_count: newCount })
      .eq("id", id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, strike_count: newCount } : b))
    );
  };

  // 4. Audition Router (Direct vs Roster)
  const routeAudition = async (id, type) => {
    if (!confirm(`Move to Active Production as ${type}?`)) return;
    await moveBooking(id, "production", { client_type: type });
  };

  // --- FILTER LOGIC ---
  const getFilteredData = () => {
    switch (activeTab) {
      case "inbox":
        // Pending requests
        return bookings.filter((b) => b.status === "pending");
      case "onboarding":
        // Approved but not yet in production
        return bookings.filter((b) => b.status === "onboarding");
      case "production":
        // The Master Sheet (Direct + Roster + Approved)
        return bookings.filter(
          (b) => b.status === "production" || b.status === "approved"
        );
      case "auditions":
        // Explicit Auditions OR Pending items tagged as Audition
        return bookings.filter(
          (b) =>
            b.client_type === "Audition" &&
            b.status !== "production" &&
            b.status !== "archive" &&
            b.status !== "booted"
        );
      case "archive":
        return bookings.filter((b) =>
          ["archive", "booted", "time_off"].includes(b.status)
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredData();

  // --- COMPONENTS ---

  const CheckToggle = ({ label, checked, onClick, highlight }) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
        checked
          ? highlight
            ? "bg-teal-500 border-teal-500 text-white"
            : "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-200 text-slate-400 hover:border-teal-500 hover:text-teal-500"
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
      {checked && <CheckCircle2 size={16} />}
    </div>
  );

  return (
    // FIX: Changed pt-24 to pt-[150px] to clear the Navbar
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-[150px]">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase text-slate-900 tracking-tighter mb-2">
              Mission Control
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              System Operational
            </p>
          </div>

          {/* TABS */}
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm flex gap-1 overflow-x-auto max-w-full">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // Count badges
              let count = 0;
              if (tab.id === "inbox")
                count = bookings.filter((b) => b.status === "pending").length;
              if (tab.id === "onboarding")
                count = bookings.filter(
                  (b) => b.status === "onboarding"
                ).length;
              if (tab.id === "auditions")
                count = bookings.filter(
                  (b) =>
                    b.client_type === "Audition" &&
                    b.status !== "production" &&
                    b.status !== "archive"
                ).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${
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

        {/* CONTENT AREA */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-24 text-slate-400 animate-pulse flex flex-col items-center gap-4">
              <Clock size={40} className="animate-spin text-teal-500" />
              <span className="uppercase tracking-widest font-bold text-sm">
                Syncing Database...
              </span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-slate-400 font-bold uppercase tracking-widest">
                No projects in {activeTab}
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              // --- VIEW: INBOX ---
              if (activeTab === "inbox") {
                const copyCheatSheet = () => {
                  const text = `NEW BOOKING DETAILS\n=================\nClient: ${
                    b.client_name
                  }\nEmail: ${b.email}\nProject: ${b.book_title}\nWord Count: ${
                    b.word_count
                  }\nDiscount: ${b.discount_applied}\nStart Date: ${new Date(
                    b.start_date
                  ).toLocaleDateString()}\nNotes: ${b.notes || "N/A"}`;
                  navigator.clipboard.writeText(text);
                  alert("Details copied!");
                };
                return (
                  <div
                    key={b.id}
                    className="bg-white border-l-4 border-blue-500 p-8 rounded-r-[2rem] shadow-sm hover:shadow-lg transition-all flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                          New Lead
                        </span>
                        <span className="text-slate-400 text-xs font-bold">
                          {new Date(b.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">
                        {b.book_title}
                      </h3>
                      <p className="text-slate-500 font-medium mb-1">
                        {b.client_name} • {b.email}
                      </p>
                      <div className="flex gap-4 text-xs font-bold text-slate-400 mt-3">
                        <span className="flex items-center gap-1">
                          <User size={14} /> {b.client_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={14} />{" "}
                          {new Date(b.start_date).toLocaleDateString()}
                        </span>
                        {b.discount_applied &&
                          b.discount_applied !== "None" && (
                            <span className="text-teal-500">
                              Discount: {b.discount_applied}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={copyCheatSheet}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <Copy size={16} /> Copy Data
                      </button>
                      <button
                        onClick={() => moveBooking(b.id, "onboarding")}
                        className="px-6 py-3 bg-teal-500 text-white rounded-xl text-xs font-bold uppercase hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button
                        onClick={() => moveBooking(b.id, "archive")}
                        className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl text-xs font-bold uppercase hover:border-red-100 hover:text-red-500 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Reject
                      </button>
                    </div>
                  </div>
                );
              }

              // --- VIEW: ONBOARDING ---
              if (activeTab === "onboarding") {
                const isExpanded = expandedRow === b.id;
                const strikeColor =
                  b.strike_count === 0
                    ? "bg-emerald-100 text-emerald-600"
                    : b.strike_count === 1
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-red-100 text-red-600";
                const readyForProd =
                  b.checklist_deposit_paid && b.checklist_f15_approved;

                return (
                  <div
                    key={b.id}
                    className={`bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300 ${
                      isExpanded
                        ? "ring-2 ring-slate-900 shadow-xl scale-[1.01]"
                        : "hover:shadow-md"
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      className="p-6 md:p-8 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${strikeColor}`}
                          title="Strikes"
                        >
                          {b.strike_count || 0}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 leading-none mb-2">
                            {b.book_title}
                          </h3>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            {b.client_name}
                            {b.checklist_contract_signed && (
                              <span className="text-emerald-500">
                                • Contract Signed
                              </span>
                            )}
                            {b.checklist_deposit_paid && (
                              <span className="text-emerald-500">• Paid</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {readyForProd && (
                          <div className="hidden md:flex items-center gap-2 bg-teal-50 text-teal-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                            Ready <ArrowRight size={14} />
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="text-slate-300" />
                        ) : (
                          <ChevronDown className="text-slate-300" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-200 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
                        {/* Column 1: Checklist */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                              Phase 1: Admin & Money
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              <CheckToggle
                                label="Contract Sent"
                                checked={b.checklist_contract_sent}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_contract_sent",
                                    b.checklist_contract_sent
                                  )
                                }
                              />
                              <CheckToggle
                                label="Contract Signed"
                                checked={b.checklist_contract_signed}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_contract_signed",
                                    b.checklist_contract_signed
                                  )
                                }
                              />
                              <CheckToggle
                                label="Deposit Sent"
                                checked={b.checklist_deposit_sent}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_deposit_sent",
                                    b.checklist_deposit_sent
                                  )
                                }
                              />
                              <CheckToggle
                                label="Deposit Paid"
                                checked={b.checklist_deposit_paid}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_deposit_paid",
                                    b.checklist_deposit_paid
                                  )
                                }
                                highlight
                              />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                              Phase 2: Quality Check
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              <CheckToggle
                                label="F15 Sent"
                                checked={b.checklist_f15_sent}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_f15_sent",
                                    b.checklist_f15_sent
                                  )
                                }
                              />
                              <CheckToggle
                                label="F15 Approved"
                                checked={b.checklist_f15_approved}
                                onClick={() =>
                                  toggleChecklist(
                                    b.id,
                                    "checklist_f15_approved",
                                    b.checklist_f15_approved
                                  )
                                }
                                highlight
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Actions */}
                        <div className="flex flex-col justify-between">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                              The Bouncer
                            </h4>
                            <div className="flex gap-3">
                              <button
                                onClick={() => addStrike(b.id, b.strike_count)}
                                className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold uppercase hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <AlertTriangle size={16} /> Add Strike
                              </button>
                              <button
                                onClick={() => moveBooking(b.id, "booted")}
                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <ShieldAlert size={16} /> Boot Client
                              </button>
                            </div>
                          </div>

                          <div className="mt-6 md:mt-0">
                            {readyForProd ? (
                              <button
                                onClick={() => moveBooking(b.id, "production")}
                                className="w-full py-5 bg-teal-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-teal-600 hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3"
                              >
                                <Briefcase size={20} /> Move to Production
                              </button>
                            ) : (
                              <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest p-4 border-2 border-dashed border-slate-200 rounded-2xl">
                                Complete Checklist to Advance
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // --- VIEW: PRODUCTION (Master Sheet) ---
              if (activeTab === "production") {
                const daysLeft = Math.ceil(
                  (new Date(b.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={b.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div
                        className={`w-2 h-16 rounded-full hidden md:block ${
                          b.client_type === "Roster"
                            ? "bg-purple-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest ${
                              b.client_type === "Roster"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {b.client_type || "Direct"}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">
                          {b.book_title}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium">
                          {b.client_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                          Words
                        </p>
                        <p className="font-bold text-slate-700">
                          {b.word_count?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                          Due Date
                        </p>
                        <p
                          className={`font-bold ${
                            daysLeft < 7 ? "text-red-500" : "text-slate-700"
                          }`}
                        >
                          {new Date(b.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => moveBooking(b.id, "archive")}
                        className="p-3 text-slate-300 hover:text-slate-500 transition-colors"
                        title="Archive"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              }

              // --- VIEW: AUDITIONS ---
              if (activeTab === "auditions") {
                return (
                  <div
                    key={b.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {b.book_title}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {b.client_name}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => routeAudition(b.id, "Direct")}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                      >
                        To Direct
                      </button>
                      <button
                        onClick={() => routeAudition(b.id, "Roster")}
                        className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-colors"
                      >
                        To Roster
                      </button>
                      <button
                        onClick={() => moveBooking(b.id, "archive")}
                        className="p-2 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              }

              // --- VIEW: ARCHIVE ---
              if (activeTab === "archive") {
                return (
                  <div
                    key={b.id}
                    className="opacity-60 hover:opacity-100 transition-opacity bg-slate-100 p-4 rounded-xl flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-500">
                      {b.book_title}
                    </span>
                    <span className="text-xs uppercase font-bold text-slate-400">
                      {b.status}
                    </span>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>
      </div>
      <style jsx global>{`
        /* Reuse your custom scrollbar styles here */
      `}</style>
    </div>
  );
}
