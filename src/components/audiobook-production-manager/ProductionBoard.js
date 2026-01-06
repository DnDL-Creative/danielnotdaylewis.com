"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  CheckCircle2,
  FileAudio,
  Mic2,
  Clock,
  Save,
  Pencil,
  X,
  ExternalLink,
  User,
  Book,
  Calculator,
  Lock,
  Zap,
  Coffee,
  Trash2,
  PauseCircle,
  Users,
  Plus,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const PROD_STATUSES = [
  "Text Prep",
  "Recording",
  "Editing",
  "Mastering",
  "Review",
  "Producer Delay",
  "Internal Delay",
  "Done",
];

const CRX_STATUSES = [
  "-",
  "Ready for Review",
  "Pickups Received",
  "CRX (In Progress)",
  "Pickups Sent",
  "Producer Delay",
  "Internal Delay",
  "Clear",
];

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // --- FETCH ---
  const fetchProductionItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("4_production")
      .select(
        `
        *,
        request:2_booking_requests!inner (
          id, book_title, client_name, client_type, cover_image_url, email_thread_link, word_count, status
        )
      `
      )
      .neq("request.status", "deleted") // STOP ZOMBIES
      .neq("request.status", "archived") // STOP ZOMBIES
      .order("recording_due_date", { ascending: true });

    if (!error) {
      // Deduplicate just in case
      const unique = [];
      const seen = new Set();
      (data || []).forEach((i) => {
        if (!seen.has(i.request.id)) {
          seen.add(i.request.id);
          unique.push(i);
        }
      });
      setItems(unique);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductionItems();
  }, []);

  // --- ACTIONS ---

  const handleSave = async (id) => {
    const { error } = await supabase
      .from("4_production")
      .update({
        status: editForm.status,
        files_sent_date: editForm.files_sent_date,
        crx_status: editForm.crx_status,
        crx_due_date: editForm.crx_due_date,
        characters: editForm.characters, // Save Character Bible
      })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...editForm } : i))
      );
      setEditingId(null);
    }
  };

  const handleUniversalDelete = async (item) => {
    if (
      !confirm(
        `PERMANENTLY DELETE "${item.request.book_title}"? This removes it from Pending, Invoices, and Logs.`
      )
    )
      return;

    // We delete the PARENT request. The SQL CASCADE handles the rest.
    await supabase
      .from("2_booking_requests")
      .delete()
      .eq("id", item.request.id);

    // Optimistic UI Update
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handlePostpone = async (item) => {
    if (!confirm(`Move "${item.request.book_title}" back to Postponed?`))
      return;

    await supabase
      .from("2_booking_requests")
      .update({ status: "postponed" })
      .eq("id", item.request.id);

    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  // --- CHARACTER BIBLE LOGIC ---
  const addCharacter = () => {
    setEditForm((prev) => ({
      ...prev,
      characters: [
        ...(prev.characters || []),
        { name: "", voice: "", ref: "" },
      ],
    }));
  };

  const updateCharacter = (index, field, value) => {
    const newChars = [...(editForm.characters || [])];
    newChars[index][field] = value;
    setEditForm((prev) => ({ ...prev, characters: newChars }));
  };

  const removeCharacter = (index) => {
    const newChars = [...(editForm.characters || [])];
    newChars.splice(index, 1);
    setEditForm((prev) => ({ ...prev, characters: newChars }));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({
      status: item.status || "Text Prep",
      files_sent_date: item.files_sent_date,
      crx_status: item.crx_status || "-",
      crx_due_date: item.crx_due_date,
      recording_start_date: item.recording_start_date,
      recording_due_date: item.recording_due_date,
      characters: item.characters || [], // Load existing characters
    });
  };

  // --- HELPERS ---
  const setCrxSpeed = (days) => {
    const today = new Date();
    today.setDate(today.getDate() + days);
    const dateStr = today.toISOString().split("T")[0];
    setEditForm((prev) => ({ ...prev, crx_due_date: dateStr }));
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const localDate = parseLocalDate(d);
    return localDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysDiff = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseLocalDate(targetDate);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcPFH = (words) => (words ? (words / 9300).toFixed(1) : "0.0");

  const getStatusBadge = (status) => {
    const styles = {
      "Text Prep": "bg-indigo-50 text-indigo-600 border-indigo-100",
      Recording: "bg-red-50 text-red-600 border-red-100 animate-pulse",
      Editing: "bg-orange-50 text-orange-600 border-orange-100",
      Mastering: "bg-blue-50 text-blue-600 border-blue-100",
      Review: "bg-purple-50 text-purple-600 border-purple-100",
      Done: "bg-emerald-50 text-emerald-600 border-emerald-100",
      "Producer Delay": "bg-amber-50 text-amber-600 border-amber-100",
      "Internal Delay": "bg-pink-50 text-pink-600 border-pink-100",
    };
    return styles[status] || "bg-slate-50 text-slate-500";
  };

  const getCountdownBadge = (dateStr, isDone) => {
    if (!dateStr || isDone) return null;
    const days = getDaysDiff(dateStr);
    if (days < 0)
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-500 text-white shadow-sm">
          Late {Math.abs(days)}d
        </span>
      );
    if (days === 0)
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-orange-500 text-white shadow-sm">
          Due Today
        </span>
      );
    if (days <= 3)
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">
          {days} Days Left
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
        In {days} Days
      </span>
    );
  };

  if (loading)
    return (
      <div className="text-center py-24 text-slate-300 font-bold uppercase tracking-widest flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" /> Syncing Board...
      </div>
    );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6 pl-8 w-1/4">Project Details</th>
              <th className="p-6 w-1/6">PFH & Prep</th>
              <th className="p-6 w-1/6">Timeline (Locked)</th>
              <th className="p-6 w-1/6">Status</th>
              <th className="p-6 w-1/6">CRX Pipeline</th>
              <th className="p-6 pr-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium">
            {items.map((item) => {
              const isEditing = editingId === item.id;
              const isRoster = item.request.client_type === "Roster";
              const isRecDone = !!item.files_sent_date;
              const pfh = calcPFH(item.request.word_count);

              return (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group"
                >
                  <td className="p-6 pl-8 align-top">
                    <div className="flex gap-5">
                      <div className="shrink-0 w-20 h-28 bg-slate-100 rounded-xl overflow-hidden relative shadow-md border border-slate-200">
                        {item.request.cover_image_url ? (
                          <img
                            src={item.request.cover_image_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                            <Book size={20} />
                            <span className="text-[9px] font-black uppercase">
                              No Cover
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="py-1 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                isRoster
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {isRoster ? "Roster" : "Direct"}
                            </span>
                          </div>
                          <div className="font-black text-slate-900 text-lg leading-tight mb-1">
                            {item.request.book_title}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            <User size={12} /> {item.request.client_name}
                          </div>
                        </div>
                        {item.request.email_thread_link && (
                          <a
                            href={item.request.email_thread_link}
                            target="_blank"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 hover:underline mt-2"
                          >
                            <ExternalLink size={10} /> Open Email
                          </a>
                        )}

                        {/* CHARACTER BIBLE PREVIEW (VIEW MODE) */}
                        {!isEditing &&
                          item.characters &&
                          item.characters.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                <Users size={10} /> Character Bible (
                                {item.characters.length})
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.characters
                                  .slice(0, 3)
                                  .map((char, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200"
                                      title={char.voice}
                                    >
                                      {char.name}
                                    </span>
                                  ))}
                                {item.characters.length > 3 && (
                                  <span className="text-[9px] text-slate-400">
                                    +{item.characters.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </td>

                  {/* CHARACTER BIBLE EDITING UI */}
                  {isEditing ? (
                    <td
                      colSpan={4}
                      className="p-6 align-top bg-slate-50/50 rounded-xl border border-slate-200 m-4"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2">
                            <Users size={14} /> Character Bible
                          </h4>
                          <button
                            onClick={addCharacter}
                            className="text-[10px] font-bold uppercase bg-slate-200 px-2 py-1 rounded hover:bg-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Plus size={10} /> Add Character
                          </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {(editForm.characters || []).map((char, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <input
                                placeholder="Name"
                                className="w-1/4 p-2 rounded border text-xs font-bold"
                                value={char.name}
                                onChange={(e) =>
                                  updateCharacter(idx, "name", e.target.value)
                                }
                              />
                              <input
                                placeholder="Voice / Specs / Accent"
                                className="w-1/2 p-2 rounded border text-xs"
                                value={char.voice}
                                onChange={(e) =>
                                  updateCharacter(idx, "voice", e.target.value)
                                }
                              />
                              <input
                                placeholder="Ref (00:00)"
                                className="w-1/6 p-2 rounded border text-xs font-mono"
                                value={char.ref}
                                onChange={(e) =>
                                  updateCharacter(idx, "ref", e.target.value)
                                }
                              />
                              <button
                                onClick={() => removeCharacter(idx)}
                                className="p-2 text-slate-300 hover:text-red-500"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          {(editForm.characters || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-4">
                              No characters added yet.
                            </p>
                          )}
                        </div>

                        <div className="border-t border-slate-200 my-4"></div>

                        {/* STATUS & CRX EDITING (Nested inside edit mode) */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">
                              Production Status
                            </label>
                            <select
                              value={editForm.status}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-lg text-xs font-bold"
                            >
                              {PROD_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">
                              CRX Pipeline
                            </label>
                            <select
                              value={editForm.crx_status}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  crx_status: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-lg text-xs font-bold"
                            >
                              {CRX_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-6 align-top">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                              <Calculator size={16} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">
                                Est. PFH
                              </span>
                              <span className="text-base font-black text-slate-700">
                                {pfh} hrs
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                              item.status === "Text Prep"
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-white border-slate-100 text-slate-400"
                            }`}
                          >
                            <Book size={14} />
                            <span className="text-[10px] font-bold uppercase">
                              {item.status === "Text Prep"
                                ? "Reading..."
                                : "Text Read"}
                            </span>
                            {item.status !== "Text Prep" &&
                              item.status !== "Scheduled" && (
                                <CheckCircle2
                                  size={14}
                                  className="ml-auto text-emerald-500"
                                />
                              )}
                          </div>
                        </div>
                      </td>

                      <td className="p-6 align-top">
                        <div className="space-y-3">
                          <div className="relative pl-3 border-l-2 border-slate-200">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                              Start
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              {formatDate(item.recording_start_date)}{" "}
                              <Lock size={10} className="text-slate-300" />
                            </div>
                          </div>
                          <div className="relative pl-3 border-l-2 border-slate-200">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                              Due
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              {formatDate(item.recording_due_date)}{" "}
                              <Lock size={10} className="text-slate-300" />
                            </div>
                          </div>
                          {!isRecDone &&
                            getCountdownBadge(item.recording_due_date, false)}
                        </div>
                      </td>

                      <td className="p-6 align-top">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status === "Recording" && (
                            <Mic2 size={12} className="animate-pulse" />
                          )}
                          {item.status}
                        </span>
                        {item.files_sent_date && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={12} /> Done:{" "}
                            {formatDate(item.files_sent_date)}
                          </div>
                        )}
                      </td>

                      <td className="p-6 align-top">
                        <div className="space-y-2">
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase w-fit border ${
                              item.crx_status === "Clear"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.crx_status?.includes("Delay")
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            <FileAudio size={12} /> {item.crx_status || "-"}
                          </div>
                          {item.crx_due_date &&
                            item.crx_status !== "Clear" &&
                            item.crx_status !== "-" && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit">
                                <Clock size={12} /> Due:{" "}
                                {formatDate(item.crx_due_date)}
                              </div>
                            )}
                        </div>
                      </td>
                    </>
                  )}

                  <td className="p-6 pr-8 align-top text-right">
                    <div className="flex flex-col gap-2 justify-end items-end">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(item.id)}
                            className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
                            title="Save Changes"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(item)}
                            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-slate-300 hover:text-blue-500 transition-all"
                            title="Edit Project & Bible"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* UNIVERSAL POSTPONE */}
                          <button
                            onClick={() => handlePostpone(item)}
                            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-amber-300 hover:text-amber-600 transition-all"
                            title="Postpone Project"
                          >
                            <PauseCircle size={16} />
                          </button>

                          {/* UNIVERSAL DELETE */}
                          <button
                            onClick={() => handleUniversalDelete(item)}
                            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-red-300 hover:text-red-600 transition-all"
                            title="Permanently Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
