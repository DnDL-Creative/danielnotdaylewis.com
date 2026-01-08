// src/components/production-manager/AllProductionFinances.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const toUSD = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function AllProductionFinances() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get IDs of active production projects
      const { data: prodData } = await supabase
        .from("4_production")
        .select("request_id");
      const ids = new Set(prodData?.map((p) => p.request_id) || []);

      // 2. Get All Invoices that match those IDs
      if (ids.size > 0) {
        const { data: invData } = await supabase
          .from("9_invoices")
          .select("*")
          .in("project_id", Array.from(ids));
        setInvoices(invData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const aggregate = useMemo(() => {
    let gross = 0;
    let net = 0;
    let takeHome = 0;
    let pipelineCount = invoices.length;

    invoices.forEach((inv) => {
      const g = Number(inv.total_amount) || 0;
      // Simple Estimation
      const pozRate = Number(inv.pozotron_rate) || 14;
      const pfh = Number(inv.pfh_count) || 0;
      const exp = pfh * pozRate + (Number(inv.other_expenses) || 0);

      const n = g - exp;
      const taxRate = Number(inv.est_tax_rate) || 25;
      const tax = n * 0.8 * (taxRate / 100); // QBI Logic applied globally

      gross += g;
      net += n;
      takeHome += n - tax;
    });

    return { gross, net, takeHome, pipelineCount };
  }, [invoices]);

  const barData = [
    { name: "Pipeline Gross", value: aggregate.gross, fill: "#3b82f6" },
    { name: "Pipeline Net", value: aggregate.net, fill: "#8b5cf6" },
    { name: "Total Pocket", value: aggregate.takeHome, fill: "#10b981" },
  ];

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-slate-300" />
      </div>
    );
  if (aggregate.pipelineCount === 0) return null; // Hide if no active production

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        {/* Background Decoration */}
        <div className="absolute -top-20 -right-20 opacity-10 blur-3xl w-96 h-96 bg-emerald-500 rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Text Stats */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.25em] mb-2 flex items-center justify-center md:justify-start gap-2">
                <TrendingUp size={14} className="text-emerald-400" /> Total
                Production Pipeline
              </h2>
              <div className="text-6xl md:text-7xl font-black tracking-tighter text-white">
                {toUSD(aggregate.takeHome)}
              </div>
              <p className="text-sm font-bold text-slate-500 mt-2">
                Estimated Total Pocket Income ({aggregate.pipelineCount} Active
                Projects)
              </p>
            </div>
          </div>

          {/* Visuals */}
          <div className="w-full md:w-1/2 h-32 md:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 0, right: 30 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{
                    fontSize: 10,
                    fill: "#94a3b8",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                  {barData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
