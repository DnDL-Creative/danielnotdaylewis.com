"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import {
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Activity,
  Calendar,
  PieChart as PieIcon,
  Award,
} from "lucide-react";

export default function VoiceoverStats({ data }) {
  // --- 1. DATA PROCESSING ENGINE ---
  const stats = useMemo(() => {
    const total = data.length;
    const submitted = data.filter((i) =>
      ["submitted", "booked", "shortlist", "archived", "rejected"].includes(
        i.status
      )
    ).length;
    const booked = data.filter((i) => i.status === "booked").length;
    const shortlist = data.filter((i) => i.status === "shortlist").length;
    const skipped = data.filter((i) => i.status === "skipped").length;

    // Rates
    const bookingRate =
      submitted > 0 ? ((booked / submitted) * 100).toFixed(1) : 0;
    const shortlistRate =
      submitted > 0 ? ((shortlist / submitted) * 100).toFixed(1) : 0;
    const auditonToBookRatio = booked > 0 ? Math.round(submitted / booked) : 0;

    // Monthly Volume (Last 6 Months)
    const months = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short" });
      months[key] = { name: key, submissions: 0, bookings: 0 };
    }

    data.forEach((item) => {
      const d = item.submitted_at
        ? new Date(item.submitted_at)
        : new Date(item.created_at);
      const key = d.toLocaleString("default", { month: "short" });
      if (months[key]) {
        if (
          ["submitted", "shortlist", "booked", "archived"].includes(item.status)
        )
          months[key].submissions++;
        if (item.status === "booked") months[key].bookings++;
      }
    });
    const monthlyData = Object.values(months);

    // Client Split
    const clients = {};
    data.forEach((i) => {
      const c = i.client_name || "Unknown";
      clients[c] = (clients[c] || 0) + 1;
    });
    const clientData = Object.keys(clients)
      .map((k) => ({ name: k, value: clients[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4); // Top 4 only

    return {
      overview: { total, submitted, booked, shortlist, skipped },
      rates: { bookingRate, shortlistRate, auditonToBookRatio },
      monthlyData,
      clientData,
    };
  }, [data]);

  // --- 2. CUSTOM UI COMPONENTS ---
  const KpiCard = ({ title, value, sub, icon: Icon, color }) => (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 group hover:border-slate-700 transition-all duration-300">
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${color}`}
      />
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-4xl font-black text-white tracking-tight">
            {value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${color.replace("bg-", "text-")}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
        <TrendingUp size={12} /> {sub}
      </p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 pb-20">
      {/* ROW 1: THE BIG NUMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Booking Rate"
          value={`${stats.rates.bookingRate}%`}
          sub={`1 in ${stats.rates.auditonToBookRatio} Auditions`}
          icon={Trophy}
          color="bg-emerald-500"
        />
        <KpiCard
          title="Shortlist Rate"
          value={`${stats.rates.shortlistRate}%`}
          sub={`${stats.overview.shortlist} Total Shortlists`}
          icon={Target}
          color="bg-purple-500"
        />
        <KpiCard
          title="Total Submissions"
          value={stats.overview.submitted}
          sub="Career Volume"
          icon={Zap}
          color="bg-blue-500"
        />
        <KpiCard
          title="Pass Rate"
          value={`${((stats.overview.skipped / Math.max(stats.overview.total, 1)) * 100).toFixed(0)}%`}
          sub={`${stats.overview.skipped} Auditions Skipped`}
          icon={Activity}
          color="bg-red-500"
        />
      </div>

      {/* ROW 2: THE VELOCITY CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Activity className="text-blue-500" /> Booking Velocity
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Submissions vs Bookings (6 Months)
              </p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  fontSize={10}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSub)"
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBook)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2 RIGHT: CLIENT DONUT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-6 left-6">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <PieIcon size={16} className="text-purple-500" /> Client Mix
            </h3>
          </div>
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.clientData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.clientData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#3b82f6", "#a855f7", "#10b981", "#f59e0b"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
            {stats.clientData.map((client, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500"][i % 4]}`}
                />
                <span className="text-[10px] font-bold text-slate-400 truncate w-full">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: THE FUNNEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <Award className="text-orange-500" /> Pipeline Funnel
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "Auditions Received",
              val: stats.overview.total,
              max: stats.overview.total,
              col: "bg-slate-700",
            },
            {
              label: "Submitted",
              val: stats.overview.submitted,
              max: stats.overview.total,
              col: "bg-blue-600",
            },
            {
              label: "Shortlisted",
              val: stats.overview.shortlist,
              max: stats.overview.total,
              col: "bg-purple-500",
            },
            {
              label: "Booked",
              val: stats.overview.booked,
              max: stats.overview.total,
              col: "bg-green-500",
            },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-black uppercase text-slate-400 mb-2">
                <span>{item.label}</span>
                <span>{item.val}</span>
              </div>
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.max((item.val / Math.max(item.max, 1)) * 100, 2)}%`,
                  }}
                  className={`h-full ${item.col} rounded-full transition-all duration-1000 ease-out`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
