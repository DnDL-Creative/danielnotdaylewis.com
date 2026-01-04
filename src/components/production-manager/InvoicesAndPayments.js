// src/components/production-manager/InvoicesAndPayments.js
"use client";

import { useState, useEffect, useMemo } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/src/utils/supabase/client";
import {
  FileText,
  ExternalLink,
  Save,
  Loader2,
  Calculator,
  TrendingUp,
  Layers,
  Calendar,
  CheckCircle,
  RotateCcw,
  Percent,
  PlusCircle,
  Receipt,
  FileCheck,
  ShieldAlert,
  Link2,
  TrainFront,
  Bomb,
  Flame,
  Zap,
  Mail,
  Briefcase,
} from "lucide-react";
import InvoicePDF from "./InvoicePDF";

const PDFDownloadLink = nextDynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="opacity-50">...</span> }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount || 0
  );

export default function InvoicesAndPayments({ initialProject }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mailFeedback, setMailFeedback] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const [formData, setFormData] = useState({
    pfh_count: 0,
    pfh_rate: 0,
    sag_ph_percent: 0,
    convenience_fee: 0,
    payment_link: "",
    contract_link: "",
    custom_note: "",
    invoiced_date: "",
    due_date: "",
    reminders_sent: 0,
    ledger_tab: "open",
  });

  const fetchData = async () => {
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: iData } = await supabase.from("9_invoices").select("*");
    setProjects(bData || []);
    setInvoices(iData || []);
    if (!selectedProject && bData?.length > 0) setSelectedProject(bData[0]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!selectedProject?.id) return;
      setLoading(true);
      setShowPDF(false);
      const { data } = await supabase
        .from("9_invoices")
        .select("*")
        .eq("project_id", selectedProject.id)
        .single();
      if (data) {
        setFormData({ ...data });
        setIsEditing(false);
      } else {
        setFormData({
          pfh_count: selectedProject.word_count
            ? (selectedProject.word_count / 9300).toFixed(2)
            : 0,
          pfh_rate: 0,
          sag_ph_percent: 0,
          convenience_fee: 0,
          payment_link: "",
          contract_link: "",
          custom_note: "",
          invoiced_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reminders_sent: 0,
          ledger_tab: "open",
        });
        setIsEditing(true);
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [selectedProject]);

  const calcs = useMemo(() => {
    const base = Number(formData.pfh_count) * Number(formData.pfh_rate);
    const sag = base * (Number(formData.sag_ph_percent) / 100);
    const total = base + sag + Number(formData.convenience_fee);
    return { base, sag, total };
  }, [
    formData.pfh_count,
    formData.pfh_rate,
    formData.sag_ph_percent,
    formData.convenience_fee,
  ]);

  useEffect(() => {
    if (formData.invoiced_date && isEditing) {
      let date = new Date(formData.invoiced_date);
      date.setDate(date.getDate() + 15);
      setFormData((p) => ({
        ...p,
        due_date: date.toISOString().split("T")[0],
      }));
    }
  }, [formData.invoiced_date, isEditing]);

  const overdueDays = useMemo(() => {
    if (!formData.due_date || formData.ledger_tab === "paid") return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(formData.due_date);
    return due ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
  }, [formData.due_date, formData.ledger_tab]);

  const handleSave = async () => {
    if (!selectedProject) return;
    setLoading(true);
    const payload = {
      ...formData,
      total_amount: calcs.total,
      project_id: selectedProject.id,
    };
    const inv = invoices.find((i) => i.project_id === selectedProject.id);
    let result = inv?.id
      ? await supabase
          .from("9_invoices")
          .update(payload)
          .eq("id", inv.id)
          .select()
          .single()
      : await supabase.from("9_invoices").insert([payload]).select().single();
    if (!result.error) {
      fetchData();
      setIsEditing(false);
    }
    setLoading(false);
  };

  const copyEmailDraft = () => {
    const total = formatCurrency(calcs.total);
    let subject = `Invoice ${selectedProject.ref_number}: ${selectedProject.book_title}`;
    let body = `Hi,\n\nPlease find the invoice for "${selectedProject.book_title}" attached. Total due is ${total}.\n\nPayment Link: ${formData.payment_link}\nDue: ${formData.due_date} (NET 15)\n\nThanks!`;
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setMailFeedback(true);
    setTimeout(() => setMailFeedback(false), 2000);
  };

  const status = useMemo(() => {
    switch (formData.reminders_sent) {
      case 1:
        return {
          label: "TRAIN LEAVING STATION",
          color: "text-orange-500",
          icon: <ShieldAlert size={18} />,
        };
      case 2:
        return {
          label: "ENGINE IS STEAMING",
          color: "text-red-500",
          icon: <Bomb size={18} />,
        };
      case 3:
        return {
          label: "CHOO CHOO A COMIN' FUCKER",
          color: "text-red-700 animate-pulse",
          icon: <TrainFront size={18} />,
        };
      default:
        return {
          label: "TRACKS CLEAR",
          color: "text-slate-400",
          icon: <CheckCircle size={18} />,
        };
    }
  }, [formData.reminders_sent]);

  return (
    <div className="flex gap-8 items-start pb-20">
      {/* SIDEBAR */}
      <div className="w-80 space-y-6 sticky top-8 self-start">
        <div className="bg-white rounded-[2rem] border p-6 shadow-sm flex flex-col items-center gap-4">
          <img
            src="/images/dndl-logo.png"
            className="w-32 h-32 object-contain"
            alt="Logo"
          />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            DnDL Creative LLC
          </p>
        </div>
        <div className="bg-white rounded-[2rem] border flex flex-col overflow-hidden shadow-sm">
          <div className="p-2 flex border-b bg-slate-50">
            {["open", "waiting", "paid"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${
                  activeTab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {projects
              .filter(
                (p) =>
                  (invoices.find((i) => i.project_id === p.id)?.ledger_tab ||
                    "open") === activeTab
              )
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${
                    selectedProject?.id === p.id
                      ? "bg-slate-900 text-white shadow-xl"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <p className="text-[9px] font-black uppercase opacity-60 leading-none mb-1">
                    Inv # {p.ref_number}
                  </p>
                  <p className="font-bold text-sm truncate">{p.book_title}</p>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] border shadow-sm flex flex-col p-10 min-h-screen">
        {!selectedProject ? (
          <div className="m-auto text-slate-300 font-black uppercase text-xs tracking-widest text-center">
            Select Target Project
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex justify-between items-center bg-white sticky top-0 z-20 pb-6 border-b">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                Collection: {selectedProject.ref_number}
              </h2>
              <div className="flex gap-3">
                {!isEditing && (
                  <>
                    {!showPDF ? (
                      <button
                        onClick={() => setShowPDF(true)}
                        className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-blue-200 transition-all shadow-sm"
                      >
                        <FileText size={14} /> Prepare PDF
                      </button>
                    ) : (
                      <PDFDownloadLink
                        key={`${selectedProject.id}-${calcs.total}`}
                        document={
                          <InvoicePDF
                            project={selectedProject}
                            data={formData}
                            calcs={calcs}
                          />
                        }
                        fileName={`INV_${selectedProject.ref_number}.pdf`}
                        className={`px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl ${
                          overdueDays > 0
                            ? "bg-red-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {({ loading }) =>
                          loading ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />{" "}
                              Warming...
                            </>
                          ) : (
                            <>
                              <FileCheck size={14} /> Download PDF
                            </>
                          )
                        }
                      </PDFDownloadLink>
                    )}
                  </>
                )}
                <button
                  onClick={copyEmailDraft}
                  className={`px-5 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-all shadow-xl ${
                    mailFeedback
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mailFeedback ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Mail size={14} />
                  )}{" "}
                  {mailFeedback ? "Copied" : "Draft Email"}
                </button>
                <button
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isEditing ? (
                    <Save size={16} />
                  ) : (
                    <Receipt size={16} />
                  )}{" "}
                  {isEditing ? "Lock In" : "Edit Debt"}
                </button>
              </div>
            </div>

            {/* LEDGER MATH */}
            <div
              className={`rounded-[3rem] p-12 text-white shadow-2xl space-y-12 transition-all duration-500 ${
                formData.reminders_sent === 3
                  ? "bg-red-950 ring-8 ring-red-600 animate-[pulse_2s_infinite]"
                  : "bg-slate-950"
              }`}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { l: "PFH Count", v: "pfh_count", i: Calculator },
                  { l: "PFH Rate", v: "pfh_rate", i: TrendingUp },
                  { l: "SAG %", v: "sag_ph_percent", i: Percent },
                  { l: "Fee", v: "convenience_fee", i: PlusCircle },
                ].map((f) => (
                  <div key={f.l} className="space-y-3">
                    <label className="text-slate-500 text-[10px] font-black uppercase flex items-center gap-2 tracking-[0.2em]">
                      <f.i size={12} /> {f.l}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      className="bg-slate-900 text-white text-2xl font-black p-4 rounded-2xl w-full border border-slate-800 outline-none focus:border-emerald-500"
                      value={formData[f.v]}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.v]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="pt-10 border-t border-slate-800 flex justify-between items-end">
                <div>
                  <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest block">
                    Amount Due
                  </span>
                  <span
                    className={`text-7xl font-black tracking-tighter text-emerald-400`}
                  >
                    {formatCurrency(calcs.total)}
                  </span>
                </div>
                {isEditing && (
                  <div className="flex gap-2 bg-slate-900 p-2.5 rounded-[1.5rem] border border-slate-800">
                    {["open", "waiting", "paid"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setFormData({ ...formData, ledger_tab: t })
                        }
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                          formData.ledger_tab === t
                            ? "bg-white text-slate-900 shadow-2xl scale-105"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STATUS & ASSET LINKS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* PAYMENT LINK */}
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border shadow-sm space-y-4">
                <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <Link2 size={16} /> Payment Link
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border text-xs font-bold outline-none focus:border-blue-500"
                    value={formData.payment_link || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_link: e.target.value })
                    }
                  />
                ) : (
                  <a
                    href={formData.payment_link}
                    target="_blank"
                    className="text-xs font-black text-blue-600 underline uppercase truncate block"
                  >
                    {formData.payment_link || "None"}
                  </a>
                )}
              </div>

              {/* CONTRACT LINK (NEW) */}
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border shadow-sm space-y-4">
                <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2 text-purple-600">
                  <Briefcase size={16} /> Contract / Agreement
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border text-xs font-bold outline-none focus:border-purple-500"
                    value={formData.contract_link || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_link: e.target.value,
                      })
                    }
                  />
                ) : (
                  <a
                    href={formData.contract_link}
                    target="_blank"
                    className="text-xs font-black text-purple-600 underline uppercase truncate block"
                  >
                    {formData.contract_link || "None"}
                  </a>
                )}
              </div>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-slate-50 border shadow-sm space-y-4">
              <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                <FileText size={16} /> Notes
              </h3>
              {isEditing ? (
                <textarea
                  className="w-full h-24 p-4 rounded-xl border text-xs font-bold resize-none"
                  value={formData.custom_note || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, custom_note: e.target.value })
                  }
                />
              ) : (
                <p className="text-xs font-bold italic">
                  {formData.custom_note || "No notes."}
                </p>
              )}
            </div>

            {/* STRIKE SYSTEM & DATES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div
                className={`p-10 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col justify-center gap-6 ${
                  formData.reminders_sent === 3
                    ? "bg-red-50 border-red-600"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-black uppercase text-sm flex items-center gap-3 tracking-widest ${status.color}`}
                  >
                    {status.icon} {status.label}
                  </h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: Math.min(p.reminders_sent + 1, 3),
                          }))
                        }
                        className="p-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200"
                      >
                        <Zap size={20} />
                      </button>
                      <button
                        onClick={() =>
                          setFormData((p) => ({ ...p, reminders_sent: 0 }))
                        }
                        className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"
                      >
                        <RotateCcw size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-20 rounded-[1.5rem] flex items-center justify-center border-2 ${
                        formData.reminders_sent >= s
                          ? s === 3
                            ? "bg-red-700 border-red-900 text-white shadow-2xl"
                            : s === 2
                            ? "bg-red-500 border-red-600 text-white shadow-lg"
                            : "bg-orange-500 border-orange-600 text-white shadow-md"
                          : "bg-white border-slate-100 opacity-40"
                      }`}
                    >
                      {s === 1 && (
                        <ShieldAlert
                          size={28}
                          className={
                            formData.reminders_sent >= s ? "animate-pulse" : ""
                          }
                        />
                      )}
                      {s === 2 && (
                        <Flame
                          size={28}
                          className={
                            formData.reminders_sent >= s ? "animate-bounce" : ""
                          }
                        />
                      )}
                      {s === 3 && (
                        <TrainFront
                          size={34}
                          className={
                            formData.reminders_sent >= s
                              ? "animate-[bounce_2s_infinite]"
                              : ""
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center text-slate-900">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-[0.2em]">
                    Invoiced Date
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-bold bg-transparent outline-none"
                    value={formData.invoiced_date || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiced_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-[0.2em]">
                    NET 15 Due
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    className={`w-full p-4 rounded-2xl border text-sm font-bold bg-transparent outline-none ${
                      overdueDays > 0
                        ? "text-red-600 border-red-200 shadow-xl"
                        : "border-slate-200"
                    }`}
                    value={formData.due_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
