"use client";
import { Activity, X, Plus } from "lucide-react";

export default function ProductionCRX({ batches, onChange }) {
  // Helper to update specific item in the array
  const modifyArray = (idx, field, val) => {
    const arr = [...(batches || [])];
    if (field === null) {
      // Delete if field is null
      arr.splice(idx, 1);
    } else {
      // Update field
      arr[idx][field] = val;
    }
    // Update parent state key 'crx_batches'
    onChange("crx_batches", arr);
  };

  const addBatch = () => {
    const newBatch = {
      name: `Batch ${(batches || []).length + 1}`,
      sent_date: new Date().toISOString().split("T")[0],
      return_date: "",
      fh: "",
    };
    onChange("crx_batches", [...(batches || []), newBatch]);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
            <Activity size={16} /> File Flow Tracker
          </h4>
          <button
            onClick={addBatch}
            className="text-xs font-bold uppercase bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow-lg flex items-center gap-2"
          >
            <Plus size={12} /> Log File Send
          </button>
        </div>
        <div className="space-y-4">
          {(batches || []).map((batch, idx) => (
            <div
              key={idx}
              className="flex flex-col lg:flex-row gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100"
            >
              {/* Batch Name */}
              <div className="flex-1 w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                  Batch Name
                </label>
                <input
                  value={batch.name}
                  onChange={(e) => modifyArray(idx, "name", e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* FH Size */}
              <div className="w-24 space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                  FH (Size)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={batch.fh}
                  onChange={(e) => modifyArray(idx, "fh", e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Sent Date */}
              <div className="w-full lg:w-36 space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                  Date Sent
                </label>
                <input
                  type="date"
                  value={batch.sent_date}
                  onChange={(e) =>
                    modifyArray(idx, "sent_date", e.target.value)
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Return Date */}
              <div className="w-full lg:w-36 space-y-1">
                <label className="text-[9px] font-black uppercase text-indigo-400 ml-1">
                  Notes Rec'd
                </label>
                <input
                  type="date"
                  value={batch.return_date}
                  onChange={(e) =>
                    modifyArray(idx, "return_date", e.target.value)
                  }
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-bold focus:border-indigo-400"
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={() => modifyArray(idx, null, null)}
                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {(!batches || batches.length === 0) && (
            <div className="text-center text-slate-400 text-xs italic py-4">
              No batches tracked.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
