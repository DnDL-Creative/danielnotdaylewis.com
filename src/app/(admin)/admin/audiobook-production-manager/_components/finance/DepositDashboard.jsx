"use client";

import { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/src/lib/supabase/client";
import {
  Wallet,
  RefreshCcw,
  CheckCircle2,
  Save,
  Download,
  Ban,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

import DepositInvoicePDF from "./DepositInvoicePDF";
import Toast from "../shared/Toast";

// Dynamic PDF Import
const PDFDownloadLink = nextDynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <span className="text-[10px] animate-pulse">Wait...</span>,
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DepositDashboard({ project, invoiceData, onUpdate }) {
  const [amount, setAmount] = useState(invoiceData?.deposit_amount || 0);
  const [status, setStatus] = useState(
    invoiceData?.deposit_status || "pending"
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync if parent changes prop
  useEffect(() => {
    if (invoiceData) {
      setAmount(invoiceData.deposit_amount);
      setStatus(invoiceData.deposit_status);
    }
  }, [invoiceData]);

  const handleSave = async (newStatus = status) => {
    setLoading(true);

    // Optimistic Update
    setStatus(newStatus);

    const payload = {
      deposit_amount: Number(amount),
      deposit_status: newStatus,
      // If setting to paid, mark the date
      deposit_date_paid:
        newStatus === "paid"
          ? new Date().toISOString()
          : invoiceData.deposit_date_paid,
    };

    const { data, error } = await supabase
      .from("9_invoices")
      .update(payload)
      .eq("id", invoiceData.id)
      .select()
      .single();

    if (error) {
      setToast({ message: "Update Failed", type: "error" });
    } else {
      setToast({ message: "Deposit Updated", type: "success" });
      if (onUpdate) onUpdate(data);
    }
    setLoading(false);
  };

  const isRefunded = status === "refunded";
  const isPaid = status === "paid";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div
        className={`rounded-[2.5rem] p-8 md:p-12 border relative overflow-hidden transition-all ${
          isRefunded
            ? "bg-red-50 border-red-100"
            : isPaid
              ? "bg-emerald-50 border-emerald-100"
              : "bg-blue-50 border-blue-100"
        }`}
      >
        {/* Background Icon */}
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          {isRefunded ? <Ban size={180} /> : <Wallet size={180} />}
        </div>

        <div className="relative z-10">
          {/* HEADER */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                isRefunded
                  ? "bg-red-100 text-red-600"
                  : "bg-white text-blue-600"
              }`}
            >
              {isRefunded ? <RefreshCcw size={24} /> : <Wallet size={24} />}
            </div>
            <div>
              <h2
                className={`text-2xl font-black uppercase tracking-tighter leading-none ${
                  isRefunded ? "text-red-900" : "text-slate-900"
                }`}
              >
                {isRefunded ? "Refund Processing" : "Deposit Controller"}
              </h2>
              <p className="text-xs font-bold uppercase opacity-50 mt-1">
                Project: {project.book_title}
              </p>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* LEFT: Amount & Status */}
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">
                  Deposit Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold opacity-40">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isRefunded}
                    className="w-full pl-8 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm text-3xl font-black outline-none focus:ring-2 ring-blue-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">
                  Current Status
                </label>
                <div className="flex gap-2 bg-white/50 p-1 rounded-2xl">
                  {["pending", "paid", "refunded"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSave(s)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        status === s
                          ? s === "refunded"
                            ? "bg-red-500 text-white shadow-md"
                            : s === "paid"
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-slate-900 text-white shadow-md"
                          : "hover:bg-white text-slate-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex flex-col justify-end space-y-4">
              {/* PDF GENERATOR */}
              <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase text-slate-400">
                  Documents
                </h3>
                <PDFDownloadLink
                  document={
                    <DepositInvoicePDF
                      project={project}
                      data={{
                        ...invoiceData,
                        deposit_amount: amount,
                        deposit_status: status,
                      }}
                    />
                  }
                  fileName={`DEPOSIT_${project.ref_number}.pdf`}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors"
                >
                  {({ loading: pdfLoading }) => (
                    <>
                      {pdfLoading ? (
                        <RefreshCcw className="animate-spin" size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      {status === "refunded"
                        ? "Download Refund Receipt"
                        : "Download Deposit Invoice"}
                    </>
                  )}
                </PDFDownloadLink>
              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={() => handleSave(status)}
                disabled={loading}
                className="w-full py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                {loading ? (
                  <RefreshCcw className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {/* REFUND WARNING AREA */}
          {status === "paid" && (
            <div className="mt-8 pt-6 border-t border-emerald-200/50 flex justify-between items-center">
              <div className="text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Deposit Paid in Full
              </div>
              <button
                onClick={() => handleSave("refunded")}
                className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase flex items-center gap-2"
              >
                Process Refund <ArrowRight size={12} />
              </button>
            </div>
          )}

          {status === "refunded" && (
            <div className="mt-8 pt-6 border-t border-red-200/50 flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={20} />
              <p className="text-red-800 text-xs font-bold">
                This deposit has been refunded. No further charges will apply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
