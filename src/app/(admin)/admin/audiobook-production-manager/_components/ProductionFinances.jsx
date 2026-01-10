// src/components/production-manager/ProductionFinances.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  Save,
  Loader2,
  CreditCard,
  PlusCircle,
  Trash2,
  Wallet,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const toUSD = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val || 0
  );

// ACCEPT onUpdate PROP HERE
export default function ProductionFinances({
  project,
  productionDefaults,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [logs, setLogs] = useState([]);

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

      const { data: logData } = await supabase
        .from("10_session_logs")
        .select("duration_hrs")
        .eq("project_id", project.id);
      setLogs(logData || []);

      const { data: invData } = await supabase
        .from("9_invoices")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();

      if (invData) {
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

        const { data: newInv } = await supabase
          .from("9_invoices")
          .upsert(
            [
              {
                project_id: project.id,
                reference_number: project.ref_number,
                client_name: project.client_name,
                ...newForm,
              },
            ],
            { onConflict: "project_id" }
          )
          .select()
          .single();

        if (newInv) {
          setInvoiceId(newInv.id);
          if (onUpdate) onUpdate(); // Trigger global refresh on create
        }
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

    // QBI Logic
    const taxableIncome = netProfit * 0.8;
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

    await supabase
      .from("9_invoices")
      .update({
        pfh_rate: form.pfh_rate,
        pfh_count: form.pfh_count,
        pozotron_rate: form.pozotron_rate,
        est_tax_rate: form.est_tax_rate,
        other_expenses: form.other_expenses,
        line_items: form.line_items,
        total_amount: stats.totalRevenue,
      })
      .eq("id", invoiceId);

    await supabase
      .from("4_production")
      .update({
        pfh_rate: form.pfh_rate,
        pozotron_rate: form.pozotron_rate,
      })
      .eq("request_id", project.id);

    // TRIGGER GLOBAL UPDATE
    if (onUpdate) onUpdate();

    setLoading(false);
  };

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

  const barData = [
    { name: "Gross", amount: stats.totalRevenue, fill: "#f8fafc" },
    { name: "Net", amount: stats.netProfit, fill: "#60a5fa" },
    { name: "Pocket", amount: stats.takeHome, fill: "#34d399" },
  ];

  const pieData = [
    { name: "Pocket", value: stats.takeHome, color: "#10b981" },
    { name: "Tax (QBI)", value: stats.taxBill, color: "#f43f5e" },
    { name: "Expenses", value: stats.totalExpenses, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <DollarSign size={240} />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-2 flex items-center gap-2">
                <Wallet size={14} /> Estimated Pocket
              </h3>
              <div className="text-5xl md:text-6xl font-black tracking-tighter text-emerald-400">
                {toUSD(stats.takeHome)}
              </div>

              <div className="mt-6 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Taxable Income (80% of Net)</span>
                  <span className="text-slate-300">
                    {toUSD(stats.netProfit * 0.8)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Est. Tax Bill ({form.est_tax_rate}%)</span>
                  <span className="text-red-400">-{toUSD(stats.taxBill)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-3">
              {barData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>{item.name}</span>
                    <span className="text-white">{toUSD(item.amount)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(item.amount / (stats.totalRevenue || 1)) * 100}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-6">
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">
                Real Hourly Rate
              </span>
              <span className="text-2xl font-black text-blue-400 flex items-baseline gap-1">
                {toUSD(stats.realHourly)}
                <span className="text-xs text-slate-600 font-bold">/hr</span>
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">
                Total Hours
              </span>
              <span className="text-2xl font-black text-white">
                {stats.totalHours.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
            <PieIcon size={14} /> Split Breakdown
          </h4>

          <div className="relative h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => toUSD(value)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Gross
              </span>
              <div className="text-sm font-black text-slate-900">
                {toUSD(stats.totalRevenue)}
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-2">
            {pieData.map((d) => (
              <div
                key={d.name}
                className="flex justify-between items-center text-xs"
              >
                <span className="flex items-center gap-2 font-bold text-slate-600">
                  <span
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{ backgroundColor: d.color }}
                  ></span>
                  {d.name}
                </span>
                <span className="font-black text-slate-700">
                  {toUSD(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEDGER EDITING */}
      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 shadow-inner transition-all hover:bg-white hover:shadow-lg group">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase text-slate-700 flex items-center gap-2 tracking-wider">
            <TrendingUp size={16} /> Financial Inputs
          </h3>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 group-hover:bg-indigo-600"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            Sync & Save
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              PFH Rate ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                $
              </span>
              <input
                type="number"
                value={form.pfh_rate}
                onChange={(e) => setForm({ ...form, pfh_rate: e.target.value })}
                className="w-full pl-7 p-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              PFH Count
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={form.pfh_count}
                onChange={(e) =>
                  setForm({ ...form, pfh_count: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold uppercase">
                hrs
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Pozotron ($/hr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                $
              </span>
              <input
                type="number"
                value={form.pozotron_rate}
                onChange={(e) =>
                  setForm({ ...form, pozotron_rate: e.target.value })
                }
                className="w-full pl-7 p-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-orange-500 bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Tax Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.est_tax_rate}
                onChange={(e) =>
                  setForm({ ...form, est_tax_rate: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-red-500 bg-white shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold">
                %
              </span>
            </div>
          </div>
        </div>

        {form.line_items.length > 0 && (
          <div className="border-t border-slate-200 pt-4 mb-4">
            <div className="space-y-2">
              {form.line_items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-center animate-in slide-in-from-left-2"
                >
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(idx, "description", e.target.value)
                    }
                    className="flex-1 p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="$"
                    value={item.amount}
                    onChange={(e) =>
                      updateLineItem(idx, "amount", e.target.value)
                    }
                    className="w-24 p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="text-slate-400 hover:text-red-500 p-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={addLineItem}
          className="text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <PlusCircle size={14} /> Add Custom Line Item (Bonus/Fee)
        </button>
      </div>
    </div>
  );
}
