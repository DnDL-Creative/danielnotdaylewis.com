// src/components/production-manager/HoursLog.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Clock,
  TrendingUp,
  Activity,
  Trash2,
  PlusCircle,
  Loader2,
  BarChart3,
  Timer,
  Coffee,
  Mic2,
  Scissors,
  Calculator,
  Receipt,
  Landmark,
  Download,
  ShieldCheck,
  Zap,
  LineChart,
  Sparkles,
  Coins,
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

  const [forecast, setForecast] = useState({
    pfh_rate: 250,
    pozotron_rate: 14,
    other_expenses: 0,
    tax_rate: 25,
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

  // --- FIX: Define activeLogs for the table mapping ---
  const activeLogs = useMemo(
    () => sessionLogs.filter((l) => l.project_id === selectedProject?.id),
    [sessionLogs, selectedProject]
  );

  // --- FINANCIAL CALCS FOR PROJECT & CUMULATIVE ---
  const money = useMemo(() => {
    if (!selectedProject) return null;

    const getProjectFinances = (proj, inv, config) => {
      const wc = Number(proj.word_count || 0);
      const estPFH = wc / 9300;
      const pfhCount = inv?.pfh_count || estPFH;
      const rate = inv?.pfh_rate || config.pfh_rate;
      const grossTotal = pfhCount * rate;
      const pozotronEst = pfhCount * Number(config.pozotron_rate);
      const netBeforeTax =
        grossTotal - pozotronEst - Number(config.other_expenses);
      const taxWithQbi = netBeforeTax * 0.8 * (config.tax_rate / 100);
      const takeHomeWithQbi = netBeforeTax - taxWithQbi;
      const taxNoQbi = netBeforeTax * (config.tax_rate / 100);
      const takeHomeNoQbi = netBeforeTax - taxNoQbi;

      return {
        grossTotal,
        netBeforeTax,
        takeHomeWithQbi,
        takeHomeNoQbi,
        taxNoQbi,
        taxWithQbi,
        pfhCount,
        pozotronEst,
      };
    };

    const currentInv = invoices.find(
      (inv) => inv.project_id === selectedProject.id
    );
    const current = getProjectFinances(selectedProject, currentInv, forecast);

    // Cumulative stats
    let cumGross = 0;
    let cumNet = 0;
    let cumTakeHome = 0;
    let cumHours = 0;
    projects.forEach((p) => {
      const inv = invoices.find((i) => i.project_id === p.id);
      const pLogs = sessionLogs.filter((l) => l.project_id === p.id);
      const pHours = pLogs.reduce(
        (acc, l) => acc + Number(l.duration_hrs || 0),
        0
      );
      if (pHours > 0) {
        const pFin = getProjectFinances(p, inv, forecast);
        cumGross += pFin.grossTotal;
        cumNet += pFin.netBeforeTax;
        cumTakeHome += pFin.takeHomeWithQbi;
        cumHours += pHours;
      }
    });

    const currentProjectHours = activeLogs.reduce(
      (acc, l) => acc + Number(l.duration_hrs || 0),
      0
    );

    return {
      ...current,
      currentProjectHours,
      cumGrossEPH: cumHours > 0 ? cumGross / cumHours : 0,
      cumNetEPH: cumHours > 0 ? cumNet / cumHours : 0,
      cumTakeHomeEPH: cumHours > 0 ? cumTakeHome / cumHours : 0,
      projGrossEPH:
        currentProjectHours > 0 ? current.grossTotal / currentProjectHours : 0,
      projNetEPH:
        currentProjectHours > 0
          ? current.netBeforeTax / currentProjectHours
          : 0,
      projTakeHomeEPH:
        currentProjectHours > 0
          ? current.takeHomeWithQbi / currentProjectHours
          : 0,
      effectiveTaxRate:
        current.netBeforeTax > 0
          ? ((current.netBeforeTax - current.takeHomeWithQbi) /
              current.netBeforeTax) *
            100
          : forecast.tax_rate,
      qbiSavings: current.takeHomeWithQbi - current.takeHomeNoQbi,
    };
  }, [selectedProject, invoices, sessionLogs, forecast, projects, activeLogs]);

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
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    fetchData();
  };

  const exportToTSV = () => {
    if (!selectedProject || !money) return;
    const headers = [
      "Date",
      "Activity",
      "Duration",
      "Project",
      "Gross Total",
      "Net Income",
      "Effective Tax Rate",
      "Take Home (QBI)",
    ];
    const rows = activeLogs.map((log) => [
      log.date,
      log.activity,
      log.duration_hrs,
      selectedProject.book_title,
      "",
      "",
      "",
      "",
    ]);
    rows.push([
      "SUMMARY",
      "",
      money.currentProjectHours.toFixed(2),
      selectedProject.book_title,
      money.grossTotal.toFixed(2),
      money.netBeforeTax.toFixed(2),
      money.effectiveTaxRate.toFixed(1) + "%",
      money.takeHomeWithQbi.toFixed(2),
    ]);
    const content = [headers, ...rows].map((e) => e.join("\t")).join("\n");
    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedProject.ref_number}_Financial_Report.tsv`;
    link.click();
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val || 0);

  return (
    <div className="flex gap-8 items-start pb-20 animate-in fade-in duration-500">
      {/* SIDEBAR */}
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

      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            ROI Engine: {selectedProject?.book_title}
          </h2>
          <button
            onClick={exportToTSV}
            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition-all"
          >
            <Download size={14} /> Export TSV
          </button>
        </div>

        {/* TOP LEVEL EPH DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-4">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 flex items-center gap-2">
              <TrendingUp size={14} /> Project EPH
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  Gross
                </p>
                <p className="text-lg font-black">
                  {formatCurrency(money?.projGrossEPH)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  Net
                </p>
                <p className="text-lg font-black">
                  {formatCurrency(money?.projNetEPH)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-500 uppercase">
                  Take Home
                </p>
                <p className="text-lg font-black text-emerald-600">
                  {formatCurrency(money?.projTakeHomeEPH)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl space-y-4 text-white">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 flex items-center gap-2">
              <LineChart size={14} /> 2026 Averages
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase">
                  Gross
                </p>
                <p className="text-lg font-black">
                  {formatCurrency(money?.cumGrossEPH)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase">
                  Net
                </p>
                <p className="text-lg font-black">
                  {formatCurrency(money?.cumNetEPH)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-400 uppercase">
                  Take Home
                </p>
                <p className="text-lg font-black text-emerald-400">
                  {formatCurrency(money?.cumTakeHomeEPH)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FINANCIAL DASHBOARD */}
        <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Gross Total
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black">
                  {formatCurrency(money?.grossTotal)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">Pre-Expense</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Pozotron Est.
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-red-400">
                  {formatCurrency(money?.pozotronEst)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  Net: {formatCurrency(money?.netBeforeTax)}
                </p>
              </div>
            </div>
            <div className="space-y-3 opacity-60">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Standard Home
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl font-black">
                  {formatCurrency(money?.takeHomeNoQbi)}
                </p>
                <p className="text-[9px] text-red-500 mt-1">
                  {forecast.tax_rate}% Tax
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                <ShieldCheck size={12} /> QBI Shield
              </p>
              <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                <p className="text-3xl font-black text-emerald-400">
                  {formatCurrency(money?.takeHomeWithQbi)}
                </p>
                <p className="text-[9px] text-emerald-500 mt-1">
                  Eff. Tax: {money?.effectiveTaxRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-white/10 grid grid-cols-4 gap-6">
            {[
              { l: "PFH Rate", v: "pfh_rate", i: Coins },
              { l: "Pozotron $/PFH", v: "pozotron_rate", i: Zap },
              { l: "Other Expenses", v: "other_expenses", i: Receipt },
              { l: "Tax Bracket %", v: "tax_rate", i: Landmark },
            ].map((field) => (
              <div key={field.l} className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                  {field.i && <field.i size={10} />} {field.l}
                </label>
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500"
                  value={forecast[field.v]}
                  onChange={(e) =>
                    setForecast({ ...forecast, [field.v]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* SESSION LOG TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Session Tracker: {selectedProject?.book_title}
            </h2>
            <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">
                Total Logged:
              </span>
              <span className="font-black text-slate-900">
                {money?.currentProjectHours.toFixed(2)}h
              </span>
            </div>
          </div>

          <div className="p-10 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-6 items-end border-b">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Date
              </label>
              <input
                type="date"
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm"
                value={newLog.date}
                onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Activity
              </label>
              <select
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm"
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
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                Duration (h)
              </label>
              <input
                type="number"
                step="0.25"
                className="w-full p-4 rounded-2xl border bg-white font-bold text-sm"
                value={newLog.duration_hrs}
                onChange={(e) =>
                  setNewLog({ ...newLog, duration_hrs: e.target.value })
                }
              />
            </div>
            <button
              onClick={handleAddLog}
              disabled={loading}
              className="h-[54px] bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <PlusCircle size={16} />
              )}{" "}
              Log Session
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b">
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
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-right">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all">
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
                    <td className="px-10 py-6 font-black text-lg text-slate-900">
                      {Number(log.duration_hrs).toFixed(2)}h
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-3 text-slate-200 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
