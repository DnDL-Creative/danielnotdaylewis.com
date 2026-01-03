"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- COMPONENTS ---
import ResponsiveLeads from "@/src/components/production-manager/ResponsiveLeads";
import IncomingBookings from "@/src/components/production-manager/IncomingBookings";
import SchedulerControls from "@/src/components/production-manager/SchedulerControls";
import OnboardingManager from "@/src/components/production-manager/OnboardingManager";
import FirstFifteenManager from "@/src/components/production-manager/FirstFifteenManager";
import Archives from "@/src/components/production-manager/Archives"; // Handles both Completed & Booted

import {
  Inbox,
  Kanban,
  Mic2,
  Briefcase,
  Archive,
  CheckCircle2,
  Trash2,
  Calendar as CalendarIcon,
  MessageCircle,
  CalendarRange,
  Headphones,
} from "lucide-react";

// --- INIT SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- TABS CONFIG ---
// This is just data. No components here.
const TABS = [
  { id: "responsive", label: "Responsive Leads", icon: MessageCircle },
  { id: "requests", label: "Booking Requests", icon: Inbox },
  { id: "calendar", label: "Calendar Ops", icon: CalendarRange },
  { id: "onboarding", label: "Onboarding", icon: Kanban },
  { id: "f15", label: "First 15", icon: Headphones },
  { id: "production", label: "Production", icon: Briefcase },
  { id: "auditions", label: "Auditions", icon: Mic2 },
  { id: "archive", label: "Archive", icon: Archive },
];

export default function ProductionManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("responsive");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
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
  const moveBooking = async (id, newStatus, extraUpdates = {}) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, ...extraUpdates })
      .eq("id", id);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: newStatus, ...extraUpdates } : b
        )
      );
    }
  };

  const routeAudition = async (id, type) => {
    if (!confirm(`Move to Active Production as ${type}?`)) return;
    await moveBooking(id, "production", { client_type: type });
  };

  // --- FILTER LOGIC ---
  const getFilteredData = () => {
    switch (activeTab) {
      // NOTE: Most tabs are handled by dedicated components.
      // These filters are only for the shared list view (Production & Auditions).
      case "production":
        return bookings.filter((b) =>
          ["production", "approved", "booked"].includes(b.status)
        );
      case "auditions":
        return bookings.filter(
          (b) =>
            b.client_type === "Audition" &&
            !["production", "archive", "booted"].includes(b.status)
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredData();

  return (
    <div className="min-h-screen bg-slate-50 px-6 pb-12 pt-48 md:pt-56">
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
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm flex gap-1 overflow-x-auto max-w-full scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Helper to count items for badges
              let count = 0;
              if (tab.id === "requests")
                count = bookings.filter((b) => b.status === "pending").length;
              if (tab.id === "onboarding")
                count = bookings.filter(
                  (b) => b.status === "onboarding"
                ).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
          {/* --- 1. DEDICATED DASHBOARD TABS --- */}
          {activeTab === "responsive" && <ResponsiveLeads />}
          {activeTab === "requests" && <IncomingBookings />}
          {activeTab === "calendar" && <SchedulerControls />}
          {activeTab === "onboarding" && <OnboardingManager />}
          {activeTab === "f15" && <FirstFifteenManager />}
          {activeTab === "archive" && <Archives />}

          {/* --- 2. SHARED LIST VIEW (Production & Auditions ONLY) --- */}
          {["production", "auditions"].includes(activeTab) &&
            (loading ? (
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
                // --- VIEW: PRODUCTION ---
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

                return null;
              })
            ))}
        </div>
      </div>
    </div>
  );
}
