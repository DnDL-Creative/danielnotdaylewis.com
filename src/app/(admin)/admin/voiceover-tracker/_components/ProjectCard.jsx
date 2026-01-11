"use client";

import {
  User,
  CalendarDays,
  Clock,
  ExternalLink,
  FolderOpen,
  Trophy,
  Star,
  Ban,
  Pencil,
} from "lucide-react";
import Countdown from "@/src/app/(admin)/admin/voiceover-tracker/_components/Countdown";

// --- HELPER: DATE FORMATTER ---
const formatDueDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return {
      datePart: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      timePart: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      tzPart: d
        .toLocaleTimeString("en-US", { timeZoneName: "short" })
        .split(" ")
        .pop(),
    };
  } catch (e) {
    return null;
  }
};

// --- HELPER: STATUS BADGE ---
const StatusBadge = ({ item }) => {
  const formatSubmission = (iso, tz) => {
    if (!iso) return { date: "UNK", time: "--" };
    try {
      const d = new Date(iso);
      const targetZone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        date: d.toLocaleDateString("en-US", {
          timeZone: targetZone,
          month: "short",
          day: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          timeZone: targetZone,
          hour: "numeric",
          minute: "2-digit",
        }),
      };
    } catch (e) {
      return { date: "ERR", time: "--" };
    }
  };

  if (item.status === "submitted") {
    const { date, time } = formatSubmission(
      item.submitted_at,
      item.submitted_timezone
    );
    return (
      <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-md">
        <span className="text-[8px] font-black uppercase tracking-tight leading-none mb-0.5">
          {date}
        </span>
        <span className="text-[7px] font-bold opacity-80 leading-none">
          {time}
        </span>
      </div>
    );
  }
  if (item.status === "booked") {
    return (
      <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-green-500/30 bg-green-500/10 text-green-400 shadow-md shadow-green-900/20">
        <Trophy size={14} className="mb-0.5" />
        <span className="text-[7px] font-black uppercase tracking-wider">
          WON
        </span>
      </div>
    );
  }
  if (item.status === "shortlist") {
    return (
      <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-md">
        <Star size={14} className="mb-0.5" />
        <span className="text-[7px] font-black uppercase tracking-wider">
          SHORT
        </span>
      </div>
    );
  }
  if (item.status === "skipped") {
    return (
      <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-slate-700 bg-slate-800 text-slate-500">
        <Ban size={14} className="mb-0.5" />
        <span className="text-[7px] font-black uppercase tracking-wider">
          SKIP
        </span>
      </div>
    );
  }
  return null;
};

export default function ProjectCard({ item, onEdit, children }) {
  const dateInfo = formatDueDate(item.due_date);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onEdit(item);
      }}
      className="group bg-slate-800/40 border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 rounded-2xl p-4 md:p-5 transition-all flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          item.client_name === "ASP"
            ? "bg-blue-500"
            : item.client_name === "IDIOM"
              ? "bg-purple-500"
              : "bg-slate-500"
        }`}
      />

      {/* CLIENT & ROLE & DATE */}
      <div className="flex flex-col md:flex-col items-start gap-3 md:gap-2 w-full md:w-40 lg:w-48 shrink-0">
        <div className="flex items-center gap-3 w-full">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded w-fit border ${
              item.client_name === "ASP"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : item.client_name === "IDIOM"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-slate-700 text-slate-400 border-slate-600"
            }`}
          >
            {item.client_name || "UNK"}
          </span>
          {item.role && (
            <div className="text-xs font-bold text-slate-400 truncate flex items-center gap-1 min-w-0">
              <User size={10} className="shrink-0" />{" "}
              <span className="truncate">{item.role}</span>
            </div>
          )}
        </div>

        {item.due_date && dateInfo && (
          <div className="mt-1 md:pt-2 md:border-t border-slate-700/50 w-full flex md:flex-col items-center md:items-start gap-2 md:gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
              <CalendarDays size={10} className="text-slate-600 shrink-0" />
              <span className="whitespace-nowrap">
                {dateInfo.dayName}, {dateInfo.datePart}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-600 md:pl-4 border-l md:border-l-0 border-slate-700 pl-2 md:ml-0">
              <Clock size={8} className="md:hidden" />
              {dateInfo.timePart} {dateInfo.tzPart}
            </div>
          </div>
        )}
      </div>

      {/* MAIN INFO & LINKS */}
      <div className="flex-grow min-w-0 md:flex-1 border-t md:border-t-0 border-slate-700/50 pt-3 md:pt-0 mt-1 md:mt-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-base font-bold text-white truncate group-hover:text-blue-200 transition-colors">
            {item.project_title}
          </h3>
          <div onClick={(e) => e.stopPropagation()}>
            {item.status === "inbox" ? (
              <Countdown date={item.due_date} />
            ) : (
              <StatusBadge item={item} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 text-xs text-slate-400 font-medium">
          {item.audition_link && (
            <a
              href={item.audition_link}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700"
            >
              <ExternalLink size={10} /> Audition
            </a>
          )}
          {item.file_link && (
            <a
              href={item.file_link}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700"
            >
              <FolderOpen size={10} /> Files
            </a>
          )}
        </div>
      </div>

      {/* NOTES/RATE */}
      <div className="md:w-48 lg:w-64 border-l border-slate-700/50 pl-0 md:pl-6 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
        <div className="flex flex-row md:flex-col gap-2 md:gap-0 justify-between md:justify-start items-center md:items-start">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 hidden md:block">
            Rate / Notes
          </p>
          <div className="text-xs text-slate-300 font-mono line-clamp-2 md:line-clamp-3 leading-relaxed opacity-70 w-full">
            {item.rate || item.specs || (
              <span className="italic opacity-50">No details provided</span>
            )}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (INJECTED) */}
      <div className="flex items-center gap-2 md:ml-auto pt-4 md:pt-0 border-t md:border-0 border-slate-700/50 mt-2 md:mt-0 overflow-x-auto pb-2 md:pb-0 px-1 no-scrollbar shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
        >
          <Pencil size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
