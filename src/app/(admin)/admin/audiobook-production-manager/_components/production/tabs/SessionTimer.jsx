"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Clock,
  Play,
  Pause,
  Square,
  Pencil,
  ListTodo,
  Check,
  X,
  Trash2,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helpers
const formatSeconds = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function SessionTimer({
  project,
  logs,
  onLogUpdate,
  showToast,
}) {
  const [timerNow, setTimerNow] = useState(Date.now());
  const tickerRef = useRef(null);

  // Timer Manual Edit State
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [manualTime, setManualTime] = useState({ h: "00", m: "00" });

  // Log CRUD State
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    duration_hrs: "",
    activity: "Recording",
    notes: "",
  });
  const [editingLogId, setEditingLogId] = useState(null);
  const [tempLogData, setTempLogData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tickerRef.current = setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);
    return () => clearInterval(tickerRef.current);
  }, []);

  const activeTimerDuration = useMemo(() => {
    if (!project) return 0;
    const baseSeconds = parseFloat(project.active_timer_elapsed || 0);
    if (project.active_timer_start) {
      const start = new Date(project.active_timer_start).getTime();
      const diffSeconds = Math.max(0, (timerNow - start) / 1000);
      return baseSeconds + diffSeconds;
    }
    return baseSeconds;
  }, [project, timerNow]);

  // --- ACTIONS ---
  const handleToggleTimer = async () => {
    const isRunning = !!project.active_timer_start;
    let payload = isRunning
      ? { active_timer_elapsed: activeTimerDuration, active_timer_start: null }
      : {
          active_timer_start: new Date().toISOString(),
          active_timer_activity: newLog.activity,
        };

    onLogUpdate("project_update", payload);
    await supabase.from("4_production").update(payload).eq("id", project.id);
  };

  const handleStopTimer = async () => {
    const finalSeconds = activeTimerDuration;
    if (finalSeconds < 10) {
      const payload = { active_timer_elapsed: 0, active_timer_start: null };
      onLogUpdate("project_update", payload);
      await supabase.from("4_production").update(payload).eq("id", project.id);
      showToast("Timer cleared (too short)");
      return;
    }
    const hrs = (finalSeconds / 3600).toFixed(2);
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("10_session_logs")
      .insert([
        {
          project_id: project.request.id,
          date: today,
          activity: project.active_timer_activity || "Recording",
          duration_hrs: parseFloat(hrs),
          notes: "Session Timer Auto-Log",
        },
      ])
      .select();

    if (data) onLogUpdate("add_log", data[0]);

    const payload = { active_timer_elapsed: 0, active_timer_start: null };
    onLogUpdate("project_update", payload);
    await supabase.from("4_production").update(payload).eq("id", project.id);
    showToast(`Saved ${hrs} hrs`);
  };

  const startTimerEdit = () => {
    const currentTotal = activeTimerDuration;
    const h = Math.floor(currentTotal / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((currentTotal % 3600) / 60)
      .toString()
      .padStart(2, "0");
    setManualTime({ h, m });
    setIsEditingTimer(true);
    if (project.active_timer_start) handleToggleTimer();
  };

  const saveManualTime = async () => {
    const newTotalSeconds =
      (parseInt(manualTime.h) || 0) * 3600 + (parseInt(manualTime.m) || 0) * 60;
    const payload = {
      active_timer_elapsed: newTotalSeconds,
      active_timer_start: null,
    };
    onLogUpdate("project_update", payload);
    await supabase.from("4_production").update(payload).eq("id", project.id);
    setIsEditingTimer(false);
  };

  const handleAddLog = async () => {
    if (!newLog.duration_hrs) return;
    setLoading(true);
    const { data } = await supabase
      .from("10_session_logs")
      .insert([{ project_id: project.request.id, ...newLog }])
      .select();
    if (data) {
      onLogUpdate("add_log", data[0]);
      showToast("Log Added");
      setNewLog({ ...newLog, duration_hrs: "", notes: "" });
    }
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    onLogUpdate("delete_log", id);
  };

  const handleUpdateLog = async () => {
    await supabase
      .from("10_session_logs")
      .update({ ...tempLogData })
      .eq("id", editingLogId);
    onLogUpdate("update_log", tempLogData);
    setEditingLogId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* CLOCK UI */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Clock size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Session Timer
              </h3>
              {!isEditingTimer ? (
                <button
                  onClick={startTimerEdit}
                  className="text-slate-500 hover:text-white"
                >
                  <Pencil size={14} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveManualTime}
                    className="text-emerald-400 text-[10px] uppercase font-bold border border-emerald-400 px-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingTimer(false)}
                    className="text-slate-400 text-[10px] uppercase font-bold border border-slate-400 px-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {!isEditingTimer ? (
              <div className="text-8xl font-black tabular-nums tracking-tighter leading-none">
                {formatSeconds(activeTimerDuration)}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-8xl font-black leading-none">
                <input
                  type="number"
                  value={manualTime.h}
                  onChange={(e) =>
                    setManualTime({ ...manualTime, h: e.target.value })
                  }
                  className="w-32 bg-transparent border-b-2 text-center outline-none"
                  placeholder="00"
                />
                <span className="text-4xl text-slate-600">:</span>
                <input
                  type="number"
                  value={manualTime.m}
                  onChange={(e) =>
                    setManualTime({ ...manualTime, m: e.target.value })
                  }
                  className="w-32 bg-transparent border-b-2 text-center outline-none"
                  placeholder="00"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 bg-white/10 p-2 rounded-xl">
              {["Prep", "Recording", "Editing", "Mastering"].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setNewLog((p) => ({ ...p, activity: a }));
                    if (project.active_timer_start) {
                      const payload = { active_timer_activity: a };
                      onLogUpdate("project_update", payload);
                      supabase
                        .from("4_production")
                        .update(payload)
                        .eq("id", project.id);
                    }
                  }}
                  className={`px-3 py-1 rounded text-[10px] uppercase font-bold ${
                    (project.active_timer_activity === a &&
                      project.active_timer_start) ||
                    (!project.active_timer_start && newLog.activity === a)
                      ? "bg-indigo-500 text-white"
                      : "text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              {!project.active_timer_start ? (
                <button
                  onClick={handleToggleTimer}
                  className="flex-1 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm shadow-lg hover:bg-emerald-400"
                >
                  <Play fill="currentColor" /> Start
                </button>
              ) : (
                <button
                  onClick={handleToggleTimer}
                  className="flex-1 h-16 bg-amber-500 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm shadow-lg animate-pulse"
                >
                  <Pause fill="currentColor" /> Pause
                </button>
              )}
              <button
                onClick={handleStopTimer}
                disabled={activeTimerDuration < 1}
                className="h-16 w-20 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                <Square fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LOG HISTORY */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
            <ListTodo size={16} /> History & Manual Entry
          </h4>
        </div>
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          {/* ... Manual Add Inputs (Simplified for brevity, logic identical to previous file) ... */}
          <div className="space-y-1 flex-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Notes
            </label>
            <input
              value={newLog.notes}
              onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              placeholder="Session notes..."
            />
          </div>
          <div className="space-y-1 w-24">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Hrs
            </label>
            <input
              type="number"
              step="0.25"
              value={newLog.duration_hrs}
              onChange={(e) =>
                setNewLog({ ...newLog, duration_hrs: e.target.value })
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <button
            onClick={handleAddLog}
            className="h-[38px] px-6 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <PlusCircle size={14} />
            )}{" "}
            Add
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4 w-full">Notes</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-bold">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-all">
                  {editingLogId === log.id ? (
                    // Edit Row
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={tempLogData.date}
                          onChange={(e) =>
                            setTempLogData({
                              ...tempLogData,
                              date: e.target.value,
                            })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={tempLogData.activity}
                          onChange={(e) =>
                            setTempLogData({
                              ...tempLogData,
                              activity: e.target.value,
                            })
                          }
                          className="w-full p-1 border rounded bg-white"
                        >
                          <option>Prep</option>
                          <option>Recording</option>
                          <option>Editing</option>
                          <option>Mastering</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={tempLogData.notes || ""}
                          onChange={(e) =>
                            setTempLogData({
                              ...tempLogData,
                              notes: e.target.value,
                            })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.25"
                          value={tempLogData.duration_hrs}
                          onChange={(e) =>
                            setTempLogData({
                              ...tempLogData,
                              duration_hrs: e.target.value,
                            })
                          }
                          className="w-20 p-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={handleUpdateLog}
                          className="text-emerald-500"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingLogId(null)}
                          className="text-slate-400"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    // View Row
                    <>
                      <td className="px-6 py-4">{formatDate(log.date)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] uppercase">
                          {log.activity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic font-medium">
                        {log.notes || "-"}
                      </td>
                      <td className="px-6 py-4">{log.duration_hrs} hrs</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setEditingLogId(log.id);
                            setTempLogData({ ...log });
                          }}
                          className="text-slate-300 hover:text-indigo-500"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 text-xs italic"
                  >
                    No logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
