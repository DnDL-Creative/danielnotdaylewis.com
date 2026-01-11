"use client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function SchedulerCalendar({
  currentDate,
  setCurrentDate,
  items,
  openAddModal,
  handleItemClick,
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();

  return (
    <div className="animate-fade-in relative">
      <div className="w-full flex flex-col items-center md:flex-row md:justify-between mb-8 gap-6">
        {/* Legend Section */}
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-emerald-50 pl-2 pr-3 py-1.5 rounded-full border border-emerald-100 text-emerald-700 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            Booked
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-amber-50 pl-2 pr-3 py-1.5 rounded-full border border-amber-100 text-amber-700 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
            Pending
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-purple-50 pl-2 pr-3 py-1.5 rounded-full border border-purple-100 text-purple-700 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm" />
            Ghost
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-50 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 text-slate-500 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-slate-400 shadow-sm" />
            Time Off
          </div>
        </div>

        {/* Date Navigation Section */}
        <div className="flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentDate(d);
            }}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors duration-200"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="w-36 text-center text-xs font-black uppercase text-slate-700 tracking-wide select-none">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentDate(d);
            }}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors duration-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] grid grid-cols-7 gap-1 select-none">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black text-slate-400 py-2 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}

          {blanks.map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-24 md:h-32 bg-slate-50/30 rounded-xl border border-transparent"
            />
          ))}
          {days.map((day, i) => {
            const date = new Date(year, month, day);
            const dateMid = new Date(date).setHours(0, 0, 0, 0);
            const isToday = date.toDateString() === today.toDateString();

            const dayItems = items.filter((item) => {
              if (!item.start || !item.end) return false;
              const s = new Date(item.start).setHours(0, 0, 0, 0);
              const e = new Date(item.end).setHours(0, 0, 0, 0);
              return dateMid >= s && dateMid <= e;
            });

            return (
              <div
                key={i}
                onClick={() => openAddModal(date)}
                className={`h-24 md:h-32 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${
                  isToday
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-slate-100"
                }`}
              >
                <span
                  className={`text-[9px] md:text-[10px] font-bold absolute top-1 right-1 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${
                    isToday ? "bg-blue-500 text-white" : "text-slate-400"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-5 md:mt-6 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] scrollbar-hide">
                  {dayItems.map((item, idx) => {
                    let color =
                      "bg-emerald-100 text-emerald-800 border-emerald-200";
                    if (item.status === "pending")
                      color = "bg-amber-100 text-amber-800 border-amber-200";
                    if (item.status === "postponed")
                      color = "bg-orange-100 text-orange-800 border-orange-200";
                    if (item.type === "ghost")
                      color = "bg-purple-100 text-purple-800 border-purple-200";
                    if (item.type === "personal")
                      color = "bg-slate-100 text-slate-700 border-slate-200";
                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={(e) => handleItemClick(e, item)}
                        className={`w-full text-left text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:brightness-95`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute top-1 left-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus
                    className="text-blue-500 bg-white rounded-full shadow-md p-0.5"
                    size={16}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
