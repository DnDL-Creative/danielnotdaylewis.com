"use client";
import { ListTodo, Check, Trash2, Plus } from "lucide-react";

export default function ProductionChecklist({ checklist, onChange }) {
  const modifyArray = (idx, field, val) => {
    const arr = [...(checklist || [])];
    if (field === null) arr.splice(idx, 1);
    else arr[idx][field] = val;
    onChange("checklist", arr);
  };

  const addTask = () => {
    onChange("checklist", [
      ...(checklist || []),
      { label: "New Task", checked: false },
    ]);
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
          <ListTodo size={16} /> Production Steps
        </h4>
        <button
          onClick={addTask}
          className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 flex items-center gap-2"
        >
          <Plus size={12} /> Add Task
        </button>
      </div>
      <div className="space-y-3">
        {(checklist || []).map((task, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all bg-white shadow-sm"
          >
            <button
              onClick={() => modifyArray(idx, "checked", !task.checked)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                task.checked
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-slate-200 text-slate-200"
              }`}
            >
              {task.checked && <Check size={16} strokeWidth={4} />}
            </button>
            <input
              value={task.label}
              onChange={(e) => modifyArray(idx, "label", e.target.value)}
              className={`flex-1 bg-transparent text-sm font-bold outline-none ${
                task.checked
                  ? "text-slate-400 line-through decoration-2 decoration-emerald-200"
                  : "text-slate-700"
              }`}
            />
            <button
              onClick={() => modifyArray(idx, null, null)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {(!checklist || checklist.length === 0) && (
          <div className="text-center text-slate-400 text-xs italic py-4">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
