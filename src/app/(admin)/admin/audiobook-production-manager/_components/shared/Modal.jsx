"use client";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
  type = "neutral",
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-900"}`}
        >
          {type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertTriangle size={24} />
          )}
        </div>
        <h3 className="text-lg font-black uppercase text-slate-900 mb-2 text-center">
          {title}
        </h3>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed text-center">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase text-white shadow-lg ${type === "danger" ? "bg-red-600 hover:bg-red-700" : type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
