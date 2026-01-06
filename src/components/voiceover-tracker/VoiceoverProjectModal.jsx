"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  X,
  Wand2,
  ClipboardPaste,
  Save,
  FileText,
  Megaphone,
  Link as LinkIcon,
  User,
  DollarSign,
  Loader2,
  ArrowLeft,
  Plus,
  Clock,
  Globe,
} from "lucide-react";

const supabase = createClient();

const US_TIMEZONES = [
  { label: "Pacific (PT)", value: "America/Los_Angeles", offset: "-08:00" },
  { label: "Mountain (MT)", value: "America/Denver", offset: "-07:00" },
  { label: "Central (CT)", value: "America/Chicago", offset: "-06:00" },
  { label: "Eastern (ET)", value: "America/New_York", offset: "-05:00" },
  { label: "Hawaii (HT)", value: "Pacific/Honolulu", offset: "-10:00" },
];

export default function VoiceoverProjectModal({
  isOpen,
  onClose,
  project = null,
  onSave,
}) {
  const [step, setStep] = useState(1);
  const [magicText, setMagicText] = useState("");
  const [formData, setFormData] = useState(initialFormState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setStep(2);
        setFormData(mapProjectToForm(project));
      } else {
        setStep(1);
        setFormData(initialFormState());
        setMagicText("");
      }
    }
  }, [isOpen, project]);

  function initialFormState() {
    return {
      client_name: "",
      project_title: "",
      role: "",
      audition_link: "",
      file_link: "",
      due_date: "",
      due_time: "17:00",
      timezone: "America/Los_Angeles",
      notes: "",
      specs: "",
      direction: "",
      status: "inbox",
      rate: "",
    };
  }

  function mapProjectToForm(item) {
    let dDate = "",
      dTime = "17:00";
    if (item.due_date) {
      try {
        const d = new Date(item.due_date);
        const targetZone = item.timezone || "America/Los_Angeles";

        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: targetZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const parts = formatter.formatToParts(d);
        const getPart = (type) => parts.find((p) => p.type === type)?.value;
        dDate = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
        dTime = `${getPart("hour")}:${getPart("minute")}`;
      } catch (e) {
        const d = new Date(item.due_date);
        dDate = d.toISOString().split("T")[0];
      }
    }
    return {
      client_name: item.client_name || "",
      project_title: item.project_title || "",
      role: item.role || "",
      audition_link: item.audition_link || "",
      file_link: item.file_link || "",
      due_date: dDate,
      due_time: dTime,
      timezone: item.timezone || "America/Los_Angeles",
      notes: item.notes || "",
      specs: item.specs || "",
      direction: item.direction || "",
      status: item.status || "inbox", // CRITICAL: Preserves existing status
      rate: item.rate || "",
    };
  }

  const handleMagicParse = () => {
    if (!magicText) return;
    if (
      magicText.includes("Audition Deadline") ||
      magicText.includes("Talent Role Information") ||
      magicText.includes("Dashboard")
    ) {
      parseASPBlob();
    } else {
      parseIDIOMBlob();
    }
    setStep(2);
  };

  const parseIDIOMBlob = () => {
    // ... same parse logic ...
    const extract = (l, e) => {
      try {
        return magicText
          .match(new RegExp(`${l}[\\s\\S]*?(${e}|$)`, "i"))[0]
          .replace(new RegExp(l, "i"), "")
          .replace(new RegExp(e, "i"), "")
          .trim();
      } catch (e) {
        return "";
      }
    };
    const dateMatch = magicText.match(/Audition Due Date:\s*\n\s*(.*?)\s*\n/i);
    let d = "",
      t = "17:00";
    if (dateMatch && dateMatch[1]) {
      let clean = dateMatch[1]
        .replace(/\(.*\)/, "")
        .trim()
        .replace(/(\d+)(st|nd|rd|th)/, "$1");
      const obj = new Date(clean);
      if (!isNaN(obj)) d = obj.toLocaleDateString("en-CA");
    }
    setFormData((prev) => ({
      ...prev,
      client_name: "IDIOM",
      timezone: "America/Los_Angeles",
      project_title:
        (magicText.match(/Project Name:\s*\n\s*(.*?)\s*\n/i) ||
          [])[1]?.trim() || "",
      rate:
        (magicText.match(/Intended Rate:\s*\n\s*(.*?)\s*\n/i) ||
          [])[1]?.trim() || "",
      due_date: d,
      due_time: t,
      specs: extract("Talent Specs/Directions:", "Audio/Video Samples"),
      direction: `LABEL: ${extract("Label File:", "Name Slate:")}`,
      notes: `SESSION: ${extract("Session/Shoot Info:", "Conflicts:")}`,
    }));
  };

  const parseASPBlob = () => {
    // ... same parse logic ...
    const extract = (startStr, endStr) => {
      try {
        const regex = new RegExp(`${startStr}[\\s\\S]*?(${endStr}|$)`, "i");
        const match = magicText.match(regex);
        if (!match) return "";
        return match[0]
          .replace(new RegExp(startStr, "i"), "")
          .replace(new RegExp(endStr, "i"), "")
          .trim();
      } catch (e) {
        return "";
      }
    };
    let title = (magicText.match(/Project Name\s*\n\s*(.*?)\s*\n/i) ||
      [])[1]?.trim();
    const roleMatch = magicText.match(/Role\s*\n(?:Role\s*\n)?\s*(.*?)\s*\n/i);
    const role = roleMatch ? roleMatch[1].trim() : "";
    const dateMatch = magicText.match(/Audition Deadline\s*\n\s*(.*?)\s*\n/i);
    let d = "";
    if (dateMatch) {
      const obj = new Date(dateMatch[1].trim());
      if (!isNaN(obj)) d = obj.toLocaleDateString("en-CA");
    }
    const timeMatch = magicText.match(
      /Audition Due Time \(Pacific\)\s*\n\s*(.*?)\s*\n/i
    );
    let t = "17:00";
    if (timeMatch) {
      const rawTime = timeMatch[1].trim();
      const [timePart, modifier] = rawTime.split(" ");
      let [h, m] = timePart.split(":");
      if (h === "12") h = "00";
      if (modifier === "PM" && h !== "12") h = parseInt(h, 10) + 12;
      else if (modifier === "PM" && h === "12") h = 12;
      else if (modifier === "AM" && h === "12") h = 0;
      t = `${String(h).padStart(2, "0")}:${m}`;
    }
    const fileMatch = magicText.match(
      /renamed to the label below\.\s*\n\s*(.*?\.mp3)/i
    );
    const filename = fileMatch ? fileMatch[1].trim() : "";
    const directionRaw = extract("Direction", "Audition Slate");
    const slateRaw = extract("Audition Slate", "Additional Notes");
    let fullDirection = "";
    if (filename)
      fullDirection += `⬇️ FILENAME (COPY THIS) ⬇️\n${filename}\n\n-------------------\n\n`;
    if (directionRaw)
      fullDirection += `DIRECTION:\n${directionRaw.replace(/^Direction\s*/i, "").trim()}\n\n`;
    if (slateRaw) fullDirection += `SLATE:\n${slateRaw}`;
    const rateRaw = extract("Rate Breakdown", "Media Use");
    const mediaUse = extract("Media Use", "Terms of Use");
    const termUse = extract("Terms of Use", "Exclusivity");
    const fullNotes = [
      rateRaw ? `RATE:\n${rateRaw}` : null,
      mediaUse ? `MEDIA:\n${mediaUse}` : null,
      termUse ? `TERMS:\n${termUse}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    setFormData((prev) => ({
      ...prev,
      client_name: "ASP",
      timezone: "America/Los_Angeles",
      project_title: title || "ASP Project",
      role: role || "",
      rate: rateRaw.split("\n")[0] || "",
      due_date: d,
      due_time: t,
      specs: extract("Specs", "Details"),
      direction: fullDirection,
      notes: fullNotes,
    }));
  };

  const handleSave = async () => {
    if (!formData.project_title) {
      alert("Project Title is required.");
      return;
    }
    setLoading(true);
    try {
      let finalTimestamp = null;
      if (formData.due_date) {
        const dateStr = formData.due_date;
        const timeStr = formData.due_time || "17:00";
        const selectedZone = US_TIMEZONES.find(
          (z) => z.value === formData.timezone
        );
        const offset = selectedZone ? selectedZone.offset : "-08:00";
        const isoStringWithOffset = `${dateStr}T${timeStr}:00${offset}`;
        const dateObj = new Date(isoStringWithOffset);
        if (isNaN(dateObj.getTime())) {
          finalTimestamp = new Date(`${dateStr}T${timeStr}`).toISOString();
        } else {
          finalTimestamp = dateObj.toISOString();
        }
      }
      const payload = {
        ...formData,
        due_date: finalTimestamp,
        due_time: undefined,
        timezone: formData.timezone,
        status: formData.status, // CRITICAL: Explicitly saves the current status
      };
      delete payload.due_time;

      let error;
      if (project?.id) {
        const res = await supabase
          .from("11_voiceover_tracker")
          .update(payload)
          .eq("id", project.id);
        error = res.error;
      } else {
        const res = await supabase
          .from("11_voiceover_tracker")
          .insert([payload]);
        error = res.error;
      }
      if (error) throw error;
      onSave();
      onClose();
    } catch (err) {
      console.error("Save Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a] z-20 shrink-0">
          <h2 className="text-2xl font-black uppercase text-white tracking-wide flex items-center gap-3">
            {step === 1 ? (
              <Wand2 className="text-indigo-400" size={24} />
            ) : project ? (
              <FileText className="text-blue-400" size={24} />
            ) : (
              <Plus className="text-green-400" size={24} />
            )}
            {step === 1
              ? "Magic Sorter"
              : project
                ? "Edit Project"
                : "New Audition"}
          </h2>
          <div className="flex items-center gap-3">
            {step === 2 && !project && (
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold uppercase text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-all hover:rotate-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STEP 1: MAGIC */}
        {step === 1 && (
          <div className="p-12 text-center flex flex-col h-full bg-[#0f172a]">
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-indigo-500/20">
              <Wand2 size={40} />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              Let's Get Sorted.
            </h3>
            <p className="text-base font-medium text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
              Paste the text from{" "}
              <span className="text-indigo-400 font-bold">ASP</span> or{" "}
              <span className="text-purple-400 font-bold">IDIOM</span>.
            </p>
            <textarea
              autoFocus
              className="w-full flex-grow min-h-[250px] bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-xs md:text-sm font-mono text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none mb-8 shadow-inner placeholder:text-slate-600 transition-all"
              placeholder="Paste email text..."
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
            />
            <div className="flex gap-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-5 rounded-2xl font-bold uppercase text-sm tracking-widest text-slate-400 hover:text-white border-2 border-slate-800 hover:bg-slate-800 transition-all"
              >
                Skip / Manual Entry
              </button>
              <button
                onClick={handleMagicParse}
                disabled={!magicText}
                className="flex-[2] py-5 rounded-2xl font-black uppercase text-sm tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <ClipboardPaste size={18} /> Parse & Create
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <div className="overflow-y-auto custom-scrollbar p-8 space-y-12 bg-[#0f172a] pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Project Title</label>
                  <input
                    className="input text-lg font-black tracking-wide"
                    value={formData.project_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project_title: e.target.value,
                      })
                    }
                    placeholder="e.g. Nike Fall Campaign"
                  />
                </div>
                <div>
                  <label className="label">Client</label>
                  <div className="relative">
                    <select
                      className="input appearance-none cursor-pointer"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          client_name: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      <option value="ASP">ASP</option>
                      <option value="IDIOM">IDIOM</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Role Name</label>
                  <input
                    className="input"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="Character Name..."
                  />
                </div>
                <div>
                  <label className="label">Audition Link</label>
                  <input
                    className="input font-mono text-xs text-blue-300"
                    value={formData.audition_link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audition_link: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="label">Files Link</label>
                  <input
                    className="input font-mono text-xs text-blue-300"
                    value={formData.file_link}
                    onChange={(e) =>
                      setFormData({ ...formData, file_link: e.target.value })
                    }
                    placeholder="Dropbox/Drive..."
                  />
                </div>
              </div>

              {/* TIME CARD */}
              <div className="lg:col-span-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <Clock size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Deadline
                  </span>
                </div>
                <div>
                  <label className="label text-slate-400 flex items-center gap-2">
                    <Globe size={10} /> Timezone
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 font-bold text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all appearance-none"
                      value={formData.timezone}
                      onChange={(e) =>
                        setFormData({ ...formData, timezone: e.target.value })
                      }
                    >
                      {US_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label text-slate-400">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label text-slate-400">Time</label>
                  <input
                    type="time"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                    value={formData.due_time}
                    onChange={(e) =>
                      setFormData({ ...formData, due_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-800/50" />

            {/* SPECS & DIRECTION */}
            <div className="space-y-8">
              <div>
                <label className="label mb-2 flex items-center gap-2">
                  <FileText size={12} /> Specs
                </label>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-base text-slate-200 leading-relaxed min-h-[160px] focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                  value={formData.specs}
                  onChange={(e) =>
                    setFormData({ ...formData, specs: e.target.value })
                  }
                  placeholder="Specs..."
                />
              </div>
              <div>
                <label className="label mb-2 flex items-center gap-2">
                  <Megaphone size={12} /> Direction
                </label>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-base text-slate-200 leading-relaxed min-h-[160px] focus:border-purple-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                  value={formData.direction}
                  onChange={(e) =>
                    setFormData({ ...formData, direction: e.target.value })
                  }
                  placeholder="Direction..."
                />
              </div>
              <div>
                <label className="label mb-2 flex items-center gap-2">
                  <DollarSign size={12} /> Notes & Finance
                </label>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-sm font-mono text-green-100/90 leading-relaxed min-h-[120px] focus:border-green-500 outline-none transition-all placeholder:text-slate-600"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Rates & Notes..."
                />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {step === 2 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#0f172a] border-t border-slate-800 z-30 flex gap-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-xl font-bold uppercase text-sm tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-white text-black font-black uppercase text-sm tracking-widest rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}{" "}
              {project ? "Update Project" : "Save to Tracker"}
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .label {
          @apply block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2 ml-1;
        }
        .input {
          @apply w-full bg-slate-950 border-2 border-slate-800/80 rounded-xl px-5 py-4 text-white font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-700;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
          border: 2px solid #0f172a;
        }
      `}</style>
    </div>
  );
}
