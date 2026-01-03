"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { Ghost, Calendar, ShieldBan, Wand2, CheckCircle2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SchedulerControls() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("timeoff"); // 'timeoff' or 'ghost'

  // Time Off State
  const [timeOffStart, setTimeOffStart] = useState("");
  const [timeOffEnd, setTimeOffEnd] = useState("");
  const [reason, setReason] = useState("Vacation");

  // Ghost State
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // --- LOGIC: TIME OFF ---
  const handleTimeOff = async () => {
    if (!timeOffStart || !timeOffEnd) return alert("Select dates");
    setLoading(true);

    const { error } = await supabase.from("bookings").insert([
      {
        client_name: "TIME OFF",
        book_title: reason,
        start_date: new Date(timeOffStart).toISOString(),
        end_date: new Date(timeOffEnd).toISOString(),
        status: "booked", // 'booked' ensures public scheduler sees it as taken
        client_type: "Admin_Block",
      },
    ]);

    setLoading(false);
    if (!error) alert("Time off blocked successfully.");
  };

  // --- LOGIC: GHOST MODE ---
  const handleGhostMode = async () => {
    setLoading(true);
    // 1. Fetch current bookings to avoid collisions
    const { data: existing } = await supabase
      .from("bookings")
      .select("start_date, end_date");

    const newBookings = [];
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(today.getMonth() + parseInt(ghostMonths));

    let probability = 0.2; // Low
    if (ghostDensity === "medium") probability = 0.45;
    if (ghostDensity === "high") probability = 0.7;

    const WORDS_PER_DAY = 6975;
    let cursor = new Date(today);
    // Move cursor to next Monday
    cursor.setDate(cursor.getDate() + ((1 + 7 - cursor.getDay()) % 7));

    while (cursor < rangeEnd) {
      // Randomly decide to book this week based on density
      if (Math.random() < probability) {
        const duration = Math.floor(Math.random() * 5) + 3; // 3 to 8 days
        const start = new Date(cursor);
        const end = new Date(start);
        end.setDate(start.getDate() + duration);

        // Simple Collision Check
        const isBlocked = existing?.some((b) => {
          const bStart = new Date(b.start_date);
          const bEnd = new Date(b.end_date);
          return start <= bEnd && end >= bStart;
        });

        if (!isBlocked) {
          newBookings.push({
            client_name: "Private Booking",
            email: "ghost@mock.com",
            book_title: "NDA Project",
            word_count: duration * WORDS_PER_DAY,
            days_needed: duration,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            status: "booked", // Public scheduler sees 'booked'
            narration_style: "Solo",
            client_type: "Ghost",
            discount_applied: "Ghost Mode",
          });
        }
      }
      // Jump forward 1 week + random buffer
      cursor.setDate(cursor.getDate() + 7 + Math.floor(Math.random() * 5));
    }

    if (newBookings.length > 0) {
      const { error } = await supabase.from("bookings").insert(newBookings);
      if (!error)
        alert(
          `Ghost Mode Active: Generated ${newBookings.length} fake bookings.`
        );
    } else {
      alert("Schedule is too full to add ghosts!");
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* CARD 1: TIME OFF */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Calendar size={24} />
          </div>
          <h3 className="text-xl font-black uppercase text-slate-900">
            Block Time Off
          </h3>
        </div>

        <div className="space-y-4 flex-grow">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Reason
            </label>
            <select
              className="w-full bg-slate-50 p-3 rounded-xl font-bold text-slate-700 outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option>Vacation</option>
              <option>Personal</option>
              <option>Travel</option>
              <option>Sick Day</option>
              <option>Admin Work</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Start
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-slate-700 outline-none"
                value={timeOffStart}
                onChange={(e) => setTimeOffStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                End
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-slate-700 outline-none"
                value={timeOffEnd}
                onChange={(e) => setTimeOffEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleTimeOff}
          disabled={loading}
          className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <ShieldBan size={18} /> Block Dates
            </>
          )}
        </button>
      </div>

      {/* CARD 2: GHOST MODE */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20 text-white flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400">
            <Ghost size={24} />
          </div>
          <h3 className="text-xl font-black uppercase text-white">
            Ghost Mode
          </h3>
        </div>

        <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">
          Fill your public calendar with fake "NDA Projects" to appear busier
          and increase demand.
        </p>

        <div className="space-y-6 relative z-10 flex-grow">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Density
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {["low", "medium", "high"].map((d) => (
                <button
                  key={d}
                  onClick={() => setGhostDensity(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostDensity === d
                      ? "bg-teal-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Duration
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setGhostMonths(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostMonths === m
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGhostMode}
          disabled={loading}
          className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 relative z-10"
        >
          {loading ? (
            "Generating..."
          ) : (
            <>
              <Wand2 size={18} /> Populate Schedule
            </>
          )}
        </button>
      </div>
    </div>
  );
}
