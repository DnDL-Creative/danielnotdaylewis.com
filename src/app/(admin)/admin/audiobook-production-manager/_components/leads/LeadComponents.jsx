"use client";

import React from "react";
import {
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  Monitor,
  Briefcase,
  Globe,
  XCircle,
  AlertCircle,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

// --- CONSTANTS NEEDED FOR BADGES ---
const DNC_SEVERITY = {
  "Active client": "orange",
  "Contact later": "orange",
  Reconnecting: "orange",
  "Dormant client": "orange",
  Unsubbed: "red",
  Ghosted: "red",
  "Not good fit": "red",
  "Firm disinterest": "red",
  Rude: "crimson",
  "Failed onboarding": "crimson",
  "Failed F15": "crimson",
  "Rejected F15": "crimson",
  "Conflict of interest": "crimson",
};

export const PlatformIcon = ({ platform }) => {
  const size = 14;
  const normalized = (platform || "").toLowerCase();

  switch (normalized) {
    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className="text-pink-500"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case "linkedin":
      return <Linkedin size={size} className="text-blue-700" />;
    case "instagram":
      return <Instagram size={size} className="text-pink-600" />;
    case "facebook":
      return <Facebook size={size} className="text-blue-600" />;
    case "email":
      return <Mail size={size} className="text-slate-500" />;
    case "website":
      return <Monitor size={size} className="text-emerald-500" />;
    case "upwork":
      return <Briefcase size={size} className="text-green-600" />;
    default:
      return <Globe size={size} className="text-slate-400" />;
  }
};

export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const getDaysIdle = (dateString) => {
  if (!dateString) return 0;
  const last = parseLocalDate(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (!last) return 0;
  const diffTime = Math.abs(now - last);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 md:flex-none flex items-center justify-center gap-2 
      py-3 md:py-4 md:px-8 border-b-2 transition-all duration-200 
      outline-none focus:outline-none focus:ring-0
      ${
        active
          ? "border-slate-900 text-slate-900 bg-slate-50 font-black tracking-tight"
          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-medium"
      }
    `}
  >
    <Icon size={18} className={active ? "text-slate-900" : "text-slate-400"} />
    <span className="text-xs md:text-sm whitespace-nowrap">{label}</span>
    {count !== undefined && (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
          active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

export const StatusBadge = ({ status, type = "prospect" }) => {
  if (type === "dnc") {
    const severity = DNC_SEVERITY[status] || "orange";
    let style = "";
    let Icon = XCircle;

    if (severity === "orange") {
      style = "bg-orange-50 text-orange-700 border border-orange-200";
      Icon = AlertCircle;
    } else if (severity === "red") {
      style = "bg-red-50 text-red-600 border border-red-200";
      Icon = Ban;
    } else if (severity === "crimson") {
      style = "bg-red-100 text-red-900 border border-red-300 shadow-sm";
      Icon = AlertTriangle;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${style}`}
      >
        <Icon size={12} strokeWidth={2.5} />
        {status}
      </span>
    );
  }

  const config = {
    active: {
      style: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: CheckCircle2,
      label: "Active",
    },
    contract_sent: {
      style: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      icon: Mail,
      label: "Contract Sent",
    },
    closed_won: {
      style:
        "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm",
      icon: Trophy,
      label: "Closed Won",
    },
    closed_lost: {
      style: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: XCircle,
      label: "Closed Lost",
    },
  };

  const {
    style,
    icon: IconComp,
    label,
  } = config[status] || {
    style: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: null,
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${style}`}
    >
      {IconComp && <IconComp size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
};

export const DaysTicker = ({ date }) => {
  const days = getDaysIdle(date);
  if (!date) return <span className="text-slate-300 text-xs italic">-</span>;
  let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
  if (days > 60) colorClass = "bg-red-100 text-red-700 border-red-200";
  else if (days > 30)
    colorClass = "bg-orange-50 text-orange-600 border-orange-200";
  else if (days > 14)
    colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${colorClass}`}
    >
      <Briefcase size={10} />
      {days}d
    </span>
  );
};

export const SortableHeader = ({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "left",
}) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className={`px-4 md:px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align} outline-none whitespace-nowrap`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        {label}
        <span
          className={`text-slate-400 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
        >
          {isActive && currentSort.direction === "asc" && <ArrowUp size={12} />}
          {isActive && currentSort.direction === "desc" && (
            <ArrowDown size={12} />
          )}
          {!isActive && <ArrowUpDown size={12} />}
        </span>
      </div>
    </th>
  );
};
