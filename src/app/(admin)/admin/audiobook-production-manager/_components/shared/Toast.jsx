"use client";
import { useEffect } from "react";
import { CheckCircle2, XCircle, Trophy, AlertCircle } from "lucide-react";

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: "bg-red-50/95 border-red-200 text-red-600",
    celebrate: "bg-emerald-900/95 border-emerald-700 text-white",
    success: "bg-slate-900/95 border-slate-800 text-white",
    info: "bg-blue-50/95 border-blue-200 text-blue-700",
  };

  const icons = {
    error: <XCircle size={18} />,
    celebrate: <Trophy size={18} className="text-yellow-400" />,
    success: <CheckCircle2 size={18} />,
    info: <AlertCircle size={18} />,
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-5">
      <div
        className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${styles[type] || styles.success}`}
      >
        {icons[type] || icons.success}
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
}
