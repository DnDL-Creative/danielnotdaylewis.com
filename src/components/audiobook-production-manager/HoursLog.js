// src/components/production-manager/HoursLog.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Clock,
  TrendingUp,
  Trash2,
  PlusCircle,
  Loader2,
  Download,
  ShieldCheck,
  Zap,
  LineChart,
  Search,
  BookOpen,
  Mic2,
  Scissors,
  Coffee,
  Receipt,
  AlertTriangle,
  RefreshCw,
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
  const [searchQuery, setSearchQuery] = useState("");

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    activity: "Recording",
    duration_hrs: "",
    notes: "",
  });

  // --- FETCH DATA (Source of Truth) ---
  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch Projects
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .neq("status", "deleted")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    // 2. Fetch Financials & Logs
    const { data: iData } = await supabase.from("9_invoices").select("*");
    const { data: sData } = await supabase
      .from("10_session_logs")
      .select("*")
      .order("date", { ascending: false });

    setProjects(bData || []);
    setInvoices(iData || []);
    setSessionLogs(sData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- SYNC SELECTED PROJECT ---
  useEffect(() => {
    if (projects.length > 0) {
      if (
        selectedProject &&
        !projects.find((p) => p.id === selectedProject.id)
      ) {
        setSelectedProject(projects[0]);
      } else if (!selectedProject) {
        setSelectedProject(projects[0]);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projects]);

  const activeLogs = useMemo(
    () => sessionLogs.filter((l) => l.project_id === selectedProject?.id),
    [sessionLogs, selectedProject]
  );

  // --- FINANCIAL CALCS (Strictly from Invoice) ---
  const money = useMemo(() => {
    if (!selectedProject) return null;

    // Find the invoice for this project
    const inv = invoices.find((i) => i.project_id === selectedProject.id);

    if (!inv) {
      return { hasInvoice: false };
    }

    // --- 1. INCOME ---
    // If invoiced, use the invoiced total. If not, estimate based on rates in the invoice draft.
    const pfhRate = Number(inv.pfh_rate) || 0;
    const pfhCount =
      Number(inv.pfh_count) || Number(selectedProject.word_count) / 9300;
    const baseGross = pfhCount * pfhRate;

    // Add Fees/Line Items from Invoice
    const fees = Number(inv.convenience_fee) || 0;
    const lineItemsTotal = (inv.line_items || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const grossTotal = baseGross + fees + lineItemsTotal;

    // --- 2. EXPENSES ---
    const pozotronRate = Number(inv.pozotron_rate) || 14; // Default to 14 if not set
    const pozotronCost = pfhCount * pozotronRate;

    // Check for "Expense" type line items (negative amounts)
    // In your system, line_items usually add to the invoice total,
    // so strictly speaking, expenses might not be tracked in line_items unless they are billable expenses.
    // For P&L, we usually subtract external costs.
    // Assuming 'other_expenses' col is still relevant for P&L even if 0 in invoice.
    const otherExpenses = Number(inv.other_expenses) || 0;

    const totalExpenses = pozotronCost + otherExpenses;

    // --- 3. PROFIT ---
    const netBeforeTax = grossTotal - totalExpenses;

    // --- 4. TAX ---
    const taxRate = Number(inv.est_tax_rate) || 25;
    // QBI Deduction: Taxable income is 80% of Net
    const taxableIncome = netBeforeTax * 0.8;
    const taxBill = taxableIncome * (taxRate / 100);

    const takeHome = netBeforeTax - taxBill;
    const effectiveTaxRate =
      netBeforeTax > 0 ? (taxBill / netBeforeTax) * 100 : 0;

    // --- 5. HOURLY ---
    const hours = activeLogs.reduce(
      (acc, l) => acc + Number(l.duration_hrs || 0),
      0
    );
    const eph = hours > 0 ? takeHome / hours : 0;

    return {
      hasInvoice: true,
      grossTotal,
      pozotronCost,
      totalExpenses,
      netBeforeTax,
      taxBill,
      takeHome,
      effectiveTaxRate,
      currentProjectHours: hours,
      projTakeHomeEPH: eph,
    };
  }, [selectedProject, invoices, sessionLogs, activeLogs]);

  const handleAddLog = async () => {
    if (!newLog.duration_hrs || !selectedProject) return;
    setLoading(true);
    const { error } = await supabase.from("10_session_logs").insert([
      {
        ...newLog,
        project_id: selectedProject.id,
        duration_hrs: Number(newLog.duration_hrs),
      },
    ]);
    if (!error) {
      setNewLog({ ...newLog, duration_hrs: "", notes: "" });
      fetchData(); // Refresh to update EPH
    }
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    fetchData();
  };

  const exportToTSV = () => {
    if (!selectedProject) return;
    const headers = ["Date", "Activity", "Duration", "Project", "Notes"];
    const rows = activeLogs.map((log) => [
      log.date,
      log.activity,
      log.duration_hrs,
      selectedProject.book_title,
      log.notes,
    ]);
    const content = [headers, ...rows].map((e) => e.join("\t")).join("\n");
    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedProject.ref_number}_Report.tsv`;
    link.click();
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val || 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start pb-20 animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden lg:sticky lg:top-8 self-start shadow-sm shrink-0">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              placeholder="Search Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex border-b bg-slate-50">
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
        <div className="p-2 space-y-1 max-h-[30vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar">
          {projects
            .filter(
              (p) =>
                (invoices.find((i) => i.project_id === p.id)?.ledger_tab ||
                  "open") === activeTab
            )
            .filter((p) =>
              p.book_title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left p-3 rounded-xl transition-all border border-transparent ${
                  selectedProject?.id === p.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase opacity-60">
                    #{p.ref_number}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-60">
                    {p.client_name}
                  </span>
                </div>
                <p className="font-bold text-xs truncate">{p.book_title}</p>
              </button>
            ))}
          {projects.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
              No active projects
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-8">
        {!selectedProject ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Clock size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase text-sm">
              Select a Project to Log Hours
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-2">
                  <BookOpen size={12} /> Ref: {selectedProject.ref_number}
                </div>
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                  {selectedProject.book_title}
                </h2>
              </div>
              <button
                onClick={exportToTSV}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all"
              >
                <Download size={14} /> Export Report
              </button>
            </div>

            {/* FINANCIAL CALCULATOR */}
            {!money?.hasInvoice ? (
              <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 flex items-center justify-center gap-4">
                <AlertTriangle className="text-amber-500" size={24} />
                <div className="text-amber-700 font-bold text-sm">
                  Financial data unavailable. Please initialize the invoice in
                  the <span className="font-black">Invoices</span> tab.
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Real Hourly Rate
                    </p>
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <p className="text-3xl font-black text-emerald-400">
                        {formatCurrency(money?.projTakeHomeEPH)}
                        <span className="text-sm text-emerald-500/50">/hr</span>
                      </p>
                      <p className="text-[9px] text-emerald-500 mt-1">
                        Post-Tax Take Home
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Gross Total
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-2xl font-black">
                        {formatCurrency(money?.grossTotal)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">
                        Pre-Expense
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Expenses (Est.)
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-2xl font-black text-red-400">
                        {formatCurrency(money?.totalExpenses)}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-[9px] text-slate-500">
                          Pozotron: {formatCurrency(money?.pozotronCost)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} /> Tax Bill (Est.)
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xl font-black text-white">
                        {formatCurrency(money?.taxBill)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">
                        Eff. Tax: {money?.effectiveTaxRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOG TABLE */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Session Tracker
                </h2>
                <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-xs">
                  <span className="font-black text-slate-400 uppercase mr-2">
                    Total:
                  </span>
                  <span className="font-black text-slate-900">
                    {money?.currentProjectHours?.toFixed(2) || "0.00"}h
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.date}
                    onChange={(e) =>
                      setNewLog({ ...newLog, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Activity
                  </label>
                  <select
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.activity}
                    onChange={(e) =>
                      setNewLog({ ...newLog, activity: e.target.value })
                    }
                  >
                    <option>Prep</option>
                    <option>Recording</option>
                    <option>Editing</option>
                    <option>Proofing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Hrs
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.duration_hrs}
                    onChange={(e) =>
                      setNewLog({ ...newLog, duration_hrs: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={handleAddLog}
                  disabled={loading}
                  className="h-[42px] bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <PlusCircle size={14} />
                  )}{" "}
                  Log
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Date
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Activity
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Time
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {activeLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-all"
                      >
                        <td className="px-8 py-4 font-bold text-slate-600">
                          {log.date}
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase inline-flex items-center gap-2 ${
                              log.activity === "Recording"
                                ? "bg-emerald-100 text-emerald-700"
                                : log.activity === "Editing"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {log.activity === "Recording" && <Mic2 size={10} />}
                            {log.activity === "Editing" && (
                              <Scissors size={10} />
                            )}
                            {log.activity === "Prep" && <Coffee size={10} />}
                            {log.activity}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-black text-slate-900">
                          {Number(log.duration_hrs).toFixed(2)}h
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activeLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-300 text-xs italic"
                        >
                          No logs yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
