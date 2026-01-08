// src/components/production-manager/ProductionFinances.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  DollarSign,
  PieChart as PieIcon,
  Save,
  Loader2,
  CreditCard,
  PlusCircle,
  Trash2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const toUSD = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val || 0
  );

export default function ProductionFinances({ project, productionDefaults }) {
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [logs, setLogs] = useState([]);

  // Master Form State (Mirrors 9_invoices)
  const [form, setForm] = useState({
    pfh_rate: 0,
    pfh_count: 0,
    pozotron_rate: 14,
    est_tax_rate: 25,
    other_expenses: 0,
    line_items: [],
  });

  // 1. FETCH & SYNC
  useEffect(() => {
    const initFinance = async () => {
      if (!project?.id) return;
      setLoading(true);

      // A. Get Hourly Logs (for calculations)
      const { data: logData } = await supabase
        .from("10_session_logs")
        .select("duration_hrs")
        .eq("project_id", project.id);
      setLogs(logData || []);

      // B. Get Invoice Data (The Financial Source of Truth)
      const { data: invData } = await supabase
        .from("9_invoices")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();

      if (invData) {
        // Invoice exists - Load it
        setInvoiceId(invData.id);
        setForm({
          pfh_rate: Number(invData.pfh_rate) || 0,
          pfh_count: Number(invData.pfh_count) || 0,
          pozotron_rate: Number(invData.pozotron_rate) || 14,
          est_tax_rate: Number(invData.est_tax_rate) || 25,
          other_expenses: Number(invData.other_expenses) || 0,
          line_items: Array.isArray(invData.line_items)
            ? invData.line_items
            : [],
        });
      } else {
        // Invoice missing - Initialize based on Production Defaults
        const wc = project.word_count || 0;
        const estPFH = (wc / 9300).toFixed(2);
        const newForm = {
          pfh_rate: productionDefaults?.pfh_rate || 250,
          pfh_count: estPFH,
          pozotron_rate: productionDefaults?.pozotron_rate || 14,
          est_tax_rate: 25,
          other_expenses: 0,
          line_items: [],
        };
        setForm(newForm);

        // Auto-create the invoice row so it appears in the Invoices tab
        const { data: newInv } = await supabase
          .from("9_invoices")
          .insert([
            {
              project_id: project.id,
              reference_number: project.ref_number,
              client_name: project.client_name, // Helper for search
              ...newForm,
            },
          ])
          .select()
          .single();

        if (newInv) setInvoiceId(newInv.id);
      }
      setLoading(false);
    };

    initFinance();
  }, [project?.id]);

  // 2. LIVE CALCULATIONS
  const stats = useMemo(() => {
    const gross = Number(form.pfh_count) * Number(form.pfh_rate);
    const extraIncome = form.line_items.reduce(
      (acc, item) => acc + (Number(item.amount) || 0),
      0
    );
    const totalRevenue = gross + extraIncome;

    const pozotronCost = Number(form.pfh_count) * Number(form.pozotron_rate);
    const totalExpenses = pozotronCost + Number(form.other_expenses);

    const netProfit = totalRevenue - totalExpenses;
    const taxableIncome = netProfit * 0.8; // QBI
    const taxBill = taxableIncome * (form.est_tax_rate / 100);
    const takeHome = netProfit - taxBill;

    const totalHours = logs.reduce(
      (acc, l) => acc + (Number(l.duration_hrs) || 0),
      0
    );
    const realHourly = totalHours > 0 ? takeHome / totalHours : 0;

    return {
      totalRevenue,
      netProfit,
      takeHome,
      taxBill,
      pozotronCost,
      totalExpenses,
      totalHours,
      realHourly,
    };
  }, [form, logs]);

  // 3. SAVE HANDLER
  const handleSave = async () => {
    if (!invoiceId) return;
    setLoading(true);

    // Update Invoice Table
    await supabase
      .from("9_invoices")
      .update({
        pfh_rate: form.pfh_rate,
        pfh_count: form.pfh_count,
        pozotron_rate: form.pozotron_rate,
        est_tax_rate: form.est_tax_rate,
        other_expenses: form.other_expenses,
        line_items: form.line_items,
        total_amount: stats.totalRevenue, // Sync total
      })
      .eq("id", invoiceId);

    // Sync Key Rates back to Production Table (Optional, keeps them in sync)
    await supabase
      .from("4_production")
      .update({ pfh_rate: form.pfh_rate, pozotron_rate: form.pozotron_rate })
      .eq("request_id", project.id);

    setLoading(false);
  };

  // Line Item Handlers
  const addLineItem = () =>
    setForm((p) => ({
      ...p,
      line_items: [...p.line_items, { description: "", amount: 0 }],
    }));
  const updateLineItem = (idx, field, val) => {
    const items = [...form.line_items];
    items[idx][field] = val;
    setForm((p) => ({ ...p, line_items: items }));
  };
  const removeLineItem = (idx) => {
    const items = [...form.line_items];
    items.splice(idx, 1);
    setForm((p) => ({ ...p, line_items: items }));
  };

  // Charts
  const barData = [
    { name: "Gross", value: stats.totalRevenue, fill: "#3b82f6" },
    { name: "Net", value: stats.netProfit, fill: "#10b981" },
    { name: "Pocket", value: stats.takeHome, fill: "#059669" },
  ];
  const pieData = [
    { name: "Pocket", value: stats.takeHome, color: "#10b981" },
    { name: "Tax", value: stats.taxBill, color: "#ef4444" },
    { name: "Pozotron", value: stats.pozotronCost, color: "#f59e0b" },
    { name: "Misc", value: Number(form.other_expenses), color: "#6366f1" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign size={200} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-1">
                Projected Take Home
              </h3>
              <div className="text-5xl font-black tracking-tighter text-emerald-400">
                {toUSD(stats.takeHome)}
              </div>
              <div className="mt-4 flex gap-6">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Real Hourly
                  </span>
                  <span className="text-xl font-bold text-blue-400">
                    {toUSD(stats.realHourly)}/hr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Hours
                  </span>
                  <span className="text-xl font-bold text-white">
                    {stats.totalHours.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.1)" }}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
            <PieIcon size={14} /> Breakdown
          </h4>
          <div className="flex-1 min-h-[160px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Gross
                </span>
                <div className="text-sm font-black text-slate-900">
                  {toUSD(stats.totalRevenue)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEDGER EDITING */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-inner">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black uppercase text-slate-700 flex items-center gap-2">
            <CreditCard size={20} /> Financial Ledger
          </h3>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}{" "}
            Sync
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              PFH Rate ($)
            </label>
            <input
              type="number"
              value={form.pfh_rate}
              onChange={(e) => setForm({ ...form, pfh_rate: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              PFH Count
            </label>
            <input
              type="number"
              step="0.01"
              value={form.pfh_count}
              onChange={(e) => setForm({ ...form, pfh_count: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              Pozotron ($/hr)
            </label>
            <input
              type="number"
              value={form.pozotron_rate}
              onChange={(e) =>
                setForm({ ...form, pozotron_rate: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-orange-500 bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={form.est_tax_rate}
              onChange={(e) =>
                setForm({ ...form, est_tax_rate: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-red-500 bg-white"
            />
          </div>
        </div>

        {/* Dynamic Line Items */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Addt'l Line Items
            </span>
            <button
              onClick={addLineItem}
              className="text-[10px] font-bold uppercase text-indigo-600 flex items-center gap-1"
            >
              <PlusCircle size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {form.line_items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(idx, "description", e.target.value)
                  }
                  className="flex-1 p-2 rounded-lg border border-slate-200 text-xs font-bold"
                />
                <input
                  type="number"
                  placeholder="$"
                  value={item.amount}
                  onChange={(e) =>
                    updateLineItem(idx, "amount", e.target.value)
                  }
                  className="w-24 p-2 rounded-lg border border-slate-200 text-xs font-bold"
                />
                <button
                  onClick={() => removeLineItem(idx)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
