"use client";
import {
  User,
  ExternalLink,
  Pencil,
  Hash,
  Calculator,
  Tag,
  Mic2,
  CalendarDays,
  FileText,
  Loader2,
  ArrowRight,
  Skull,
  PauseCircle,
  Clock,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Mic,
  UserPlus,
  PlayCircle,
  Rocket,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";

const formatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const calcPFH = (words) => (words ? (words / 9300).toFixed(1) : "0.0");
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function PendingProjectCard({
  item,
  activeTab,
  isUploading,
  handleImageUpload,
  startEditing,
  actions,
  processingId,
}) {
  const isRoster = item.client_type === "Roster";
  const destinationName = isRoster ? "First 15" : "Onboarding";
  const isProduction = activeTab === "production";

  return (
    <div
      className={`group bg-white p-6 lg:p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 ${isProduction ? "border-emerald-100 ring-1 ring-emerald-50" : "border-slate-100 hover:border-slate-200"}`}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* --- COVER IMAGE --- */}
        <div className="shrink-0 w-full lg:w-40 mx-auto lg:mx-0">
          <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 group/image">
            {item.cover_image_url ? (
              <img
                src={item.cover_image_url}
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-[9px] font-black uppercase opacity-50">
                  No Cover
                </span>
              </div>
            )}
            <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UploadCloud size={24} />
              )}
              <span className="text-[9px] font-bold uppercase mt-2 tracking-widest">
                {isUploading ? "Uploading..." : "Change Cover"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, item.id)}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* --- DETAILS --- */}
        <div className="flex-grow flex flex-col justify-between">
          <div className="animate-in fade-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isProduction ? (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 animate-pulse">
                      In Production
                    </span>
                  ) : activeTab === "greenlit" ? (
                    <button
                      onClick={() => actions.toggleClientType(item)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${isRoster ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                    >
                      {item.client_type || "Direct"} (Switch)
                    </button>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isRoster ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-600"}`}
                    >
                      {item.client_type || "Direct"}
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Ref: {item.ref_number || item.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-1">
                  {item.book_title || "Untitled Project"}
                </h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <User size={14} /> {item.client_name || "Unknown Client"}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {item.email_thread_link && (
                  <a
                    href={item.email_thread_link}
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink size={14} /> Open Thread
                  </a>
                )}
                {!activeTab.includes("cinesonic") && (
                  <button
                    onClick={() => startEditing(item)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Hash size={10} /> Word Count
                </div>
                <div className="text-xs font-black text-slate-700">
                  {formatNumberWithCommas(item.word_count)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calculator size={10} /> PFH Est.
                </div>
                <div className="text-xs font-black text-slate-700">
                  {calcPFH(item.word_count)} hrs
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag size={10} /> Genre
                </div>
                <div className="text-xs font-black text-slate-700 truncate">
                  {item.genre || "-"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mic2 size={10} /> Style
                </div>
                <div className="text-xs font-black text-slate-700 truncate">
                  {item.narration_style || "-"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CalendarDays size={10} /> Timeline
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-700">
                    {formatDate(item.start_date)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    to {formatDate(item.end_date)}
                  </span>
                </div>
              </div>
            </div>

            {item.notes && (
              <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                <FileText
                  size={14}
                  className="text-amber-400 mt-0.5 shrink-0"
                />
                <p className="text-xs font-medium text-amber-900/80 leading-relaxed italic">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="lg:w-56 shrink-0 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
          {activeTab === "production" && (
            <>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <Rocket size={24} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  Project is Active
                </p>
              </div>
              <button
                onClick={() =>
                  actions.navigateTab && actions.navigateTab("production")
                }
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Briefcase size={16} /> Go To Board
              </button>
              <button
                onClick={() => actions.updateStatus(item, "first_15")}
                className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <Undo2 size={14} /> Revert to First 15
              </button>
            </>
          )}

          {activeTab === "cinesonic" && (
            <div className="flex flex-col gap-2">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center mb-1">
                <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                  Manual Setup Req.
                </p>
              </div>
              <button
                onClick={() => actions.handleAddToLeads(item)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
                disabled={processingId === item.id}
              >
                {processingId === item.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}{" "}
                Add to Leads
              </button>
            </div>
          )}

          {activeTab === "pending" && (
            <>
              <button
                onClick={() => actions.openGreenlightModal(item)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 group/btn"
                disabled={processingId === item.id}
              >
                {processingId === item.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <PlayCircle size={16} />
                )}{" "}
                Greenlight
              </button>
              <button
                onClick={() => actions.handleAddToLeads(item)}
                className="w-full py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                disabled={processingId === item.id}
              >
                <UserPlus size={14} /> Add to Leads
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => actions.updateStatus(item, "on_hold")}
                  className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex flex-col items-center gap-1"
                >
                  <PauseCircle size={14} /> Hold
                </button>
                <button
                  onClick={() => actions.updateStatus(item, "postponed")}
                  className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex flex-col items-center gap-1"
                >
                  <Clock size={14} /> Later
                </button>
              </div>
              <button
                onClick={() => actions.openBootModal(item)}
                className="w-full py-2 text-slate-300 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Skull size={12} /> Boot (Archive)
              </button>
            </>
          )}

          {activeTab === "on_hold" && (
            <>
              <button
                onClick={() => actions.openGreenlightModal(item)}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <PlayCircle size={16} /> Activate
              </button>
              <button
                onClick={() => actions.updateStatus(item, "pending")}
                className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Undo2 size={14} /> Back to Pending
              </button>
            </>
          )}

          {activeTab === "postponed" && (
            <>
              <button
                onClick={() => actions.updateStatus(item, "pending")}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Undo2 size={16} /> Revive
              </button>
              <button
                onClick={() => actions.openBootModal(item)}
                className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Skull size={14} /> Boot (Archive)
              </button>
            </>
          )}

          {activeTab === "greenlit" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => actions.openGreenlightModal(item)}
                disabled={processingId === item.id}
                className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-md transition-all flex flex-col items-center justify-center gap-1 p-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />{" "}
                  <span>Not in {destinationName}</span>
                </div>
                <div className="flex items-center gap-1 opacity-80 text-[9px]">
                  <span>Click to Push</span> <ArrowRight size={10} />
                </div>
                {processingId === item.id && (
                  <Loader2 className="animate-spin mt-1" size={12} />
                )}
              </button>
              <button
                onClick={() => actions.updateStatus(item, "pending")}
                className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Undo2 size={14} /> Back to Pending
              </button>
              <button
                onClick={() => actions.openBootModal(item)}
                className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Skull size={14} /> Boot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
