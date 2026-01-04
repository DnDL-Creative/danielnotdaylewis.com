// src/components/production-manager/HoursLog.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Clock,
  TrendingUp,
  Activity,
  MousePointer2,
  Trash2,
  PlusCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Timer,
  Coffee,
  Mic2,
  Scissors,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HoursLog({ initialProject }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    activity: "Recording",
    duration_hrs: "",
    notes: "",
  });

  const fetchData = async () => {
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: iData } = await supabase.from("9_invoices").select("*");
    const { data: sData } = await supabase
      .from("10_session_logs")
      .select("*")
      .order("date", { ascending: false });
    setProjects(bData || []);
    setInvoices(iData || []);
    setSessionLogs(sData || []);
    if (!selectedProject && bData?.length > 0) setSelectedProject(bData[0]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CALCULATIONS ---

  // Real ROI: (Total Invoiced $ / Total Actual Hours Logged)
  const stats = useMemo(() => {
    const totalEarnings = invoices.reduce(
      (acc, inv) => acc + Number(inv.total_amount || 0),
      0
    );
    const totalHours = sessionLogs.reduce(
      (acc, log) => acc + Number(log.duration_hrs || 0),
      0
    );
    const hourlyWage = totalHours > 0 ? totalEarnings / totalHours : 0;

    const currentProjectLogs = sessionLogs.filter(
      (l) => l.project_id === selectedProject?.id
    );
    const currentProjectHours = currentProjectLogs.reduce(
      (acc, log) => acc + Number(log.duration_hrs || 0),
      0
    );
    const currentInvoice = invoices.find(
      (inv) => inv.project_id === selectedProject?.id
    );
    const projectROI =
      currentProjectHours > 0
        ? (currentInvoice?.total_amount || 0) / currentProjectHours
        : 0;

    return { hourlyWage, totalHours, currentProjectHours, projectROI };
  }, [invoices, sessionLogs, selectedProject]);

  const activeLogs = useMemo(
    () => sessionLogs.filter((l) => l.project_id === selectedProject?.id),
    [sessionLogs, selectedProject]
  );

  const handleAddLog = async () => {
    if (!newLog.duration_hrs || !selectedProject) return;
    setLoading(true);
    const { error } = await supabase
      .from("10_session_logs")
      .insert([{ ...newLog, project_id: selectedProject.id }]);
    if (!error) {
      setNewLog({
        date: new Date().toISOString().split("T")[0],
        activity: "Recording",
        duration_hrs: "",
        notes: "",
      });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="flex gap-8 items-start pb-20">
      {/* SIDEBAR (Matches Invoice UI) */}
      <div className="w-80 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden sticky top-8 self-start shadow-sm">
        <div className="p-2 flex border-b bg-slate-50">
          {["open", "waiting", "paid"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${
                activeTab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {projects
            .filter(
              (p) =>
                (invoices.find((i) => i.project_id === p.id)?.ledger_tab ||
                  "open") === activeTab
            )
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  selectedProject?.id === p.id
                    ? "bg-slate-900 text-white shadow-xl"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <p className="text-[9px] font-black uppercase opacity-60 leading-none mb-1">
                  Ref # {p.ref_number}
                </p>
                <p className="font-bold text-sm truncate">{p.book_title}</p>
              </button>
            ))}
        </div>
      </div>

      {/* MAIN HOURS LOG STAGE */}
      <div className="flex-1 space-y-8">
        {/* GLOBAL ROI DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <BarChart3 size={12} /> Global Hourly ROI
            </p>
            <h3 className="text-4xl font-black text-emerald-400">
              ${stats.hourlyWage.toFixed(2)}
              <span className="text-sm opacity-40 ml-1">/hr</span>
            </h3>
            <p className="text-[10px] opacity-40 italic">
              Lifetime average across all logged hours
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Timer size={12} /> Lifetime Labor
            </p>
            <h3 className="text-4xl font-black text-slate-900">
              {stats.totalHours.toFixed(1)}
              <span className="text-sm opacity-40 ml-1">hrs</span>
            </h3>
          </div>
          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 flex items-center gap-2">
              <Activity size={12} /> Project ROI
            </p>
            <h3 className="text-4xl font-black">
              ${stats.projectROI.toFixed(2)}
              <span className="text-sm opacity-60 ml-1">/hr</span>
            </h3>
            <p className="text-[10px] text-blue-200 italic">
              Efficiency for {selectedProject?.book_title}
            </p>
          </div>
        </div>

        {/* LOGGING INTERFACE */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-10 border-b flex justify-between items-center">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Session Log: {selectedProject?.book_title}
            </h2>
            <div className="bg-slate-100 px-6 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">
                Unbilled:
              </span>
              <span className="font-black text-slate-900">
                {stats.currentProjectHours.toFixed(2)} Hrs
              </span>
            </div>
          </div>

          {/* QUICK ADD FORM */}
          <div className="p-10 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Date
              </label>
              <input
                type="date"
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm outline-none focus:border-blue-500"
                value={newLog.date}
                onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Activity
              </label>
              <select
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm outline-none focus:border-blue-500"
                value={newLog.activity}
                onChange={(e) =>
                  setNewLog({ ...newLog, activity: e.target.value })
                }
              >
                <option>Admin</option>
                <option>Prep</option>
                <option>Recording</option>
                <option>Proofing</option>
                <option>Editing</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Actual Hours
              </label>
              <input
                type="number"
                step="0.25"
                placeholder="0.00"
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm outline-none focus:border-blue-500"
                value={newLog.duration_hrs}
                onChange={(e) =>
                  setNewLog({ ...newLog, duration_hrs: e.target.value })
                }
              />
            </div>
            <button
              onClick={handleAddLog}
              disabled={loading}
              className="h-[54px] bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <PlusCircle size={16} />
              )}{" "}
              Log Session
            </button>
          </div>

          {/* TABLE */}
          <div className="p-0">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">
                    Date
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">
                    Activity
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">
                    Time
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">
                    Note
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-right">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 group transition-all"
                  >
                    <td className="px-10 py-6 font-bold text-sm">{log.date}</td>
                    <td className="px-10 py-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 w-fit ${
                          log.activity === "Recording"
                            ? "bg-emerald-100 text-emerald-700"
                            : log.activity === "Editing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {log.activity === "Recording" && <Mic2 size={10} />}
                        {log.activity === "Editing" && <Scissors size={10} />}
                        {log.activity === "Prep" && <Coffee size={10} />}
                        {log.activity}
                      </span>
                    </td>
                    <td className="px-10 py-6 font-black text-lg">
                      {Number(log.duration_hrs).toFixed(2)}h
                    </td>
                    <td className="px-10 py-6 text-slate-400 text-xs italic">
                      {log.notes || "—"}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em]"
                    >
                      No tracks logged for this project
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
