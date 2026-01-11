"use client";
import React from "react";
import ProductionFinances from "../../finance/ProductionFinances";

export default function ProjectOverview({
  project,
  editForm,
  setEditForm,
  setModal,
  executeEjection,
  onFinancialUpdate,
}) {
  const ACTIVE_PRODUCTION_STATUSES = [
    "pre_production",
    "recording",
    "editing",
    "review",
    "mastering",
    "done",
  ];

  const STATUS_MAP = {
    pre_production: "Text Prep",
    recording: "Recording",
    editing: "Editing",
    review: "CRX Review",
    mastering: "Mastering",
    done: "Complete",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
      <div className="lg:col-span-12 space-y-6">
        {/* FINANCIAL WIDGET */}
        <ProductionFinances
          project={project}
          productionDefaults={{
            pfh_rate: editForm.pfh_rate,
            pozotron_rate: editForm.pozotron_rate,
          }}
          onUpdate={onFinancialUpdate}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CONFIG PANEL */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-4">
              Project Config
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400">
                  Phase
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {ACTIVE_PRODUCTION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_MAP[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400">
                  Recording Due
                </label>
                <input
                  type="date"
                  value={editForm.recording_due_date || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      recording_due_date: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
            <h4 className="text-xs font-black uppercase text-red-400 mb-4">
              Danger Zone
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setModal({
                    isOpen: true,
                    title: "Complete?",
                    message: "Mark paid and archive?",
                    onConfirm: () => executeEjection("completed"),
                    confirmText: "Complete",
                    type: "success",
                  })
                }
                className="col-span-2 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-600 transition-colors"
              >
                Mark Paid & Complete
              </button>
              <button
                onClick={() =>
                  setModal({
                    isOpen: true,
                    title: "Kick Back?",
                    message: "Return to First 15?",
                    onConfirm: () => executeEjection("first_15"),
                    confirmText: "Kick Back",
                  })
                }
                className="py-3 bg-white border text-slate-500 rounded-xl text-xs font-bold uppercase hover:bg-slate-50"
              >
                Kick Back
              </button>
              <button
                onClick={() =>
                  setModal({
                    isOpen: true,
                    title: "Archive?",
                    message: "Boot to Archive?",
                    onConfirm: () => executeEjection("archived"),
                    confirmText: "Archive",
                    type: "danger",
                  })
                }
                className="py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase hover:bg-red-100"
              >
                Boot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
