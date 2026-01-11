"use client";
import {
  Pencil,
  BookOpen,
  User,
  AtSign,
  Hash,
  Calculator,
  Tag,
  Mic2,
  CalendarDays,
  Link as LinkIcon,
  Mail,
  FileText,
  Save,
  Trash2,
  ImageIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";

export default function PendingEditForm({
  editForm,
  setEditForm,
  handleSave,
  handleStatusChange,
  handleImageUpload,
  uploadingId,
  setEditingId,
  loading,
}) {
  const formatNumberWithCommas = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleWordCountChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const numVal = parseInt(rawVal, 10) || 0;
    // Update local form state for display
    setEditForm((prev) => ({
      ...prev,
      word_count: numVal,
      word_count_display: formatNumberWithCommas(rawVal),
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner mb-4">
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
            <Pencil size={14} /> Editing Project
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CORE DETAILS */}
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                Book Title
              </label>
              <div className="relative mt-1">
                <BookOpen
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  value={editForm.book_title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, book_title: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                Client Name
              </label>
              <div className="relative mt-1">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  value={editForm.client_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, client_name: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                Email
              </label>
              <div className="relative mt-1">
                <AtSign
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                Ref Number
              </label>
              <div className="relative mt-1">
                <Hash
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  value={editForm.ref_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ref_number: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SPECS */}
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                Word Count
              </label>
              <div className="relative mt-1">
                <Calculator
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  value={editForm.word_count_display}
                  onChange={handleWordCountChange}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                  Genre
                </label>
                <div className="relative mt-1">
                  <Tag
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <input
                    value={editForm.genre}
                    onChange={(e) =>
                      setEditForm({ ...editForm, genre: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                  Style
                </label>
                <div className="relative mt-1">
                  <Mic2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <input
                    value={editForm.narration_style}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        narration_style: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                  Start
                </label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start_date: e.target.value })
                  }
                  className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                  End
                </label>
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end_date: e.target.value })
                  }
                  className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* ADMIN & NOTES */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-2 block">
                Routing & Status
              </label>
              <div className="flex gap-4 mb-4">
                {["Direct", "Roster"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
                  >
                    <input
                      type="radio"
                      name="client_type"
                      value={type}
                      checked={editForm.client_type === type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          client_type: e.target.value,
                        })
                      }
                      className="accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
              <div className="relative">
                <LinkIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={14}
                />
                <input
                  placeholder="Email Thread Link"
                  value={editForm.email_thread_link}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email_thread_link: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 h-24 resize-none outline-none"
                placeholder="Internal notes..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 mt-4 border-t border-slate-200">
          <button
            onClick={() => setEditingId(null)}
            className="px-6 py-2.5 text-xs font-bold uppercase text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 text-xs font-bold uppercase text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}{" "}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
