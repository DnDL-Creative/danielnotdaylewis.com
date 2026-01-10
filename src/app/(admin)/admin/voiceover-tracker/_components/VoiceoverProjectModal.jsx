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
  ExternalLink,
  Calendar,
  FolderOpen,
  Mic2,
} from "lucide-react";

const supabase = createClient();

const US_TIMEZONES = [
  { label: "Pacific (PT)", value: "America/Los_Angeles", offset: "-08:00" },
  { label: "Mountain (MT)", value: "America/Denver", offset: "-07:00" },
  { label: "Central (CT)", value: "America/Chicago", offset: "-06:00" },
  { label: "Eastern (ET)", value: "America/New_York", offset: "-05:00" },
  { label: "Hawaii (HT)", value: "Pacific/Honolulu", offset: "-10:00" },
];

// --- HELPER COMPONENTS ---

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-indigo-400 border-b border-indigo-500/10 pb-2">
    <Icon size={16} />
    <span className="text-xs font-black uppercase tracking-[0.2em]">
      {title}
    </span>
  </div>
);

const LinkInput = ({ value, onChange, placeholder, icon: Icon, label }) => {
  const isValidUrl =
    value && (value.startsWith("http") || value.startsWith("www"));
  return (
    <div className="group relative">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          <Icon size={14} />
        </div>
        <input
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-9 pr-10 py-3 text-xs font-mono text-blue-300 placeholder:text-slate-600 focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {isValidUrl && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Link"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

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
      status: item.status || "inbox",
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

  // --- PARSERS ---
  const parseIDIOMBlob = () => {
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
        status: formData.status,
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#0b1121] border border-white/10 w-full max-w-6xl rounded-[2rem] shadow-2xl relative flex flex-col h-[90vh] overflow-hidden">
        {/* === HEADER === */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/5 bg-[#0b1121] z-20 shrink-0">
          <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wide flex items-center gap-4">
            {step === 1 ? (
              <Wand2 className="text-indigo-400" size={24} />
            ) : (
              <Mic2 className="text-indigo-500" size={24} />
            )}
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {step === 1
                ? "Magic Sorter"
                : project
                  ? "Edit Project"
                  : "New Audition"}
            </span>
          </h2>
          <div className="flex items-center gap-3">
            {step === 2 && !project && (
              <button
                onClick={() => setStep(1)}
                className="text-[10px] font-bold uppercase text-slate-400 hover:text-white px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* === STEP 1: MAGIC PARSER === */}
        {step === 1 && (
          <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#0b1121] to-[#0f172a]">
            <div className="w-24 h-24 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-8 animate-pulse border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Wand2 size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Paste & Parse.
            </h3>
            <p className="text-base md:text-lg font-medium text-slate-400 mb-8 max-w-lg leading-relaxed">
              Drop the entire email from <span className="text-white">ASP</span>{" "}
              or <span className="text-white">IDIOM</span> here. We'll handle
              the rest.
            </p>
            <div className="w-full max-w-3xl relative group">
              <textarea
                autoFocus
                className="w-full min-h-[200px] bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-6 text-sm font-mono text-slate-300 focus:border-indigo-500 focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-inner placeholder:text-slate-600 transition-all"
                placeholder="Paste email text..."
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
              />
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </div>
            <div className="flex gap-4 mt-8 w-full max-w-lg">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all"
              >
                Manual Entry
              </button>
              <button
                onClick={handleMagicParse}
                disabled={!magicText}
                className="flex-[1.5] py-4 rounded-xl font-black uppercase text-xs tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                <ClipboardPaste size={16} /> Parse Magic
              </button>
            </div>
          </div>
        )}

        {/* === STEP 2: DASHBOARD === */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b1121]">
            {/* UPDATED: Added massive bottom padding (pb-64) to ensure scrolling clears the footer */}
            <div className="p-6 md:p-10 pb-64 max-w-7xl mx-auto space-y-8">
              {/* --- TOP ROW: HEADER INPUTS --- */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* TITLE & CLIENT (Span 8) */}
                <div className="md:col-span-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Project Title
                    </label>
                    <input
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-5 text-xl md:text-2xl font-black text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500 transition-all shadow-xl"
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
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        Client
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white appearance-none cursor-pointer outline-none focus:border-indigo-500 hover:bg-slate-800 transition-all"
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
                        <User
                          size={14}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                        />
                      </div>
                    </div>
                    {/* ROLE INPUT */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        Role Name
                      </label>
                      <input
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 hover:bg-slate-800 transition-all"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        placeholder="Character Name..."
                      />
                    </div>
                  </div>
                </div>

                {/* DEADLINE WIDGET (Span 4) */}
                <div className="md:col-span-4 h-full">
                  <div className="bg-slate-900/40 border border-red-500/20 rounded-2xl p-6 h-full flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-6 text-red-400">
                      <Clock size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">
                        Deadlines
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Timezone
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-red-500"
                            value={formData.timezone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                timezone: e.target.value,
                              })
                            }
                          >
                            {US_TIMEZONES.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                          <Globe
                            size={12}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            // Force show picker on click
                            onClick={(e) =>
                              e.target.showPicker && e.target.showPicker()
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500 cursor-pointer [color-scheme:dark]"
                            value={formData.due_date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                due_date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            // Force show picker on click
                            onClick={(e) =>
                              e.target.showPicker && e.target.showPicker()
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500 cursor-pointer [color-scheme:dark]"
                            value={formData.due_time}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                due_time: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- GRID: DETAILS & SIDEBAR --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-white/5">
                {/* LEFT: MAIN CONTENT (Span 8) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* SPECS */}
                  <div>
                    <SectionHeader icon={FileText} title="Specs & Tone" />
                    <textarea
                      className="w-full min-h-[140px] bg-slate-900/30 border border-slate-700/50 rounded-2xl p-6 text-sm text-slate-300 leading-relaxed outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all placeholder:text-slate-700"
                      value={formData.specs}
                      onChange={(e) =>
                        setFormData({ ...formData, specs: e.target.value })
                      }
                      placeholder="e.g. Conversational, warm, not announcery..."
                    />
                  </div>

                  {/* DIRECTION */}
                  <div>
                    <SectionHeader
                      icon={Megaphone}
                      title="Script & Direction"
                    />
                    <textarea
                      className="w-full min-h-[300px] bg-[#0f1523] border border-slate-800 rounded-2xl p-6 text-sm font-mono text-slate-300 leading-relaxed outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
                      value={formData.direction}
                      onChange={(e) =>
                        setFormData({ ...formData, direction: e.target.value })
                      }
                      placeholder="Paste script here..."
                    />
                  </div>
                </div>

                {/* RIGHT: SIDEBAR (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* LINKS CARD */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <SectionHeader icon={LinkIcon} title="Links" />
                    <div className="space-y-4">
                      <LinkInput
                        label="Audition Link"
                        icon={LinkIcon}
                        placeholder="https://..."
                        value={formData.audition_link}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            audition_link: e.target.value,
                          })
                        }
                      />
                      <LinkInput
                        label="Files / Drive"
                        icon={FolderOpen}
                        placeholder="Dropbox..."
                        value={formData.file_link}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            file_link: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* FINANCE CARD */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                    <SectionHeader icon={DollarSign} title="Rates & Notes" />
                    <textarea
                      className="w-full min-h-[150px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-green-300 placeholder:text-slate-700 outline-none focus:border-green-500 transition-all"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Rate: $500&#10;Usage: 1 Year Paid Media..."
                    />
                  </div>
                </div>
              </div>

              {/* Extra Spacer to be absolutely sure */}
              <div className="h-12 w-full" />
            </div>
          </div>
        )}

        {/* --- FOOTER --- */}
        {step === 2 && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#0b1121]/95 backdrop-blur-md border-t border-white/5 z-30 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {project ? "Update Project" : "Save to Tracker"}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0b1121;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
