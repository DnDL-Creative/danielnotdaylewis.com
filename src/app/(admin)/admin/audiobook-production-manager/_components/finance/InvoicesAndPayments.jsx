"use client";

import { useState, useEffect, useMemo } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/src/lib/supabase/client";
import {
  FileText,
  Save,
  Loader2,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
  Link2,
  TrainFront,
  Bomb,
  Search,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
} from "lucide-react";

import Toast from "../shared/Toast";
import ActionModal from "../shared/ActionModal";
import Modal from "../shared/Modal";

// --- IMPORTS ---
import InvoicePDF from "./InvoicePDF";
import DepositDashboard from "./DepositDashboard";

const PDFDownloadLink = nextDynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <span className="text-xs animate-pulse">PDF...</span>,
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// HELPER: Ensure dates are YYYY-MM-DD for Postgres Date columns
const toISODate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split("T")[0];
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount || 0
  );

export default function FinanceManager({ initialProject }) {
  // Renamed per convention
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [productionDataMap, setProductionDataMap] = useState({});

  const [activeTab, setActiveTab] = useState("open");
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Form State - ALL FIELDS MATCH DB SCHEMA 9_invoices
  const [formData, setFormData] = useState({
    pfh_count: 0,
    pfh_rate: 0,
    sag_ph_percent: 0,
    convenience_fee: 0,
    est_tax_rate: 25, // <--- ADDED to match DB default
    line_items: [],
    payment_link: "",
    contract_link: "",
    custom_note: "",
    invoiced_date: "",
    due_date: "",
    reminders_sent: 0,
    ledger_tab: "open",
    logo_url: "",
    deposit_amount: 0,
    deposit_status: "pending",
    deposit_date_paid: null,
  });

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const { data: iData } = await supabase.from("9_invoices").select("*");
    setInvoices(iData || []);

    const { data: prodData } = await supabase
      .from("4_production")
      .select("request_id, pfh_rate, pozotron_rate");

    // Get project IDs logic...
    const activeProductionIds = prodData?.map((p) => p.request_id) || [];
    const { data: completedData } = await supabase
      .from("2_booking_requests")
      .select("id")
      .eq("status", "completed");
    const completedIds = completedData?.map((c) => c.id) || [];
    const financialIds =
      iData
        ?.filter((i) => i.deposit_amount > 0 || i.deposit_status !== "pending")
        .map((i) => i.project_id) || [];
    const validIds = new Set([
      ...activeProductionIds,
      ...completedIds,
      ...financialIds,
    ]);

    if (validIds.size > 0) {
      const { data: bData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .in("id", Array.from(validIds))
        .neq("status", "deleted")
        .order("created_at", { ascending: false });
      setProjects(bData || []);
    }

    const prodMap = {};
    if (prodData) {
      prodData.forEach((item) => {
        prodMap[item.request_id] = { pfh_rate: item.pfh_rate };
      });
    }
    setProductionDataMap(prodMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedProject?.id) return;
      setLoading(true);

      const existingInvoice = invoices.find(
        (i) => i.project_id === selectedProject.id
      );
      const savedLogo =
        typeof window !== "undefined"
          ? localStorage.getItem("default_invoice_logo")
          : "";

      if (existingInvoice) {
        setFormData({
          ...existingInvoice,
          logo_url: existingInvoice.logo_url || savedLogo,
          line_items: Array.isArray(existingInvoice.line_items)
            ? existingInvoice.line_items
            : [],
        });
        setIsEditing(false);
      } else {
        const prodDefaults = productionDataMap[selectedProject.id];
        const calculatedPFH = selectedProject.word_count
          ? (selectedProject.word_count / 9300).toFixed(2)
          : 0;

        setFormData({
          pfh_count: calculatedPFH,
          pfh_rate: prodDefaults?.pfh_rate || 250,
          sag_ph_percent: 0,
          convenience_fee: 0,
          est_tax_rate: 25,
          line_items: [],
          payment_link: "",
          contract_link: "",
          custom_note: "",
          invoiced_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reminders_sent: 0,
          ledger_tab: "open",
          logo_url: savedLogo,
          deposit_amount: 0,
          deposit_status: "pending",
        });
        setIsEditing(true);
      }
      setLoading(false);
    };
    loadData();
  }, [selectedProject, invoices, productionDataMap]);

  // --- CALCULATIONS ---
  const calcs = useMemo(() => {
    const base = Number(formData.pfh_count) * Number(formData.pfh_rate);
    const sag = base * (Number(formData.sag_ph_percent) / 100);
    const customItemsTotal = (formData.line_items || []).reduce(
      (acc, item) => acc + Number(item.amount),
      0
    );
    const total =
      base + sag + Number(formData.convenience_fee) + customItemsTotal;
    const deposit = Number(formData.deposit_amount) || 0;
    const finalDue = total - (formData.deposit_status === "paid" ? deposit : 0);

    return { base, sag, total, deposit, finalDue };
  }, [formData]);

  const overdueDays = useMemo(() => {
    if (!formData.due_date || formData.ledger_tab === "paid") return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(formData.due_date); // Clean date handling
    return due ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
  }, [formData.due_date, formData.ledger_tab]);

  // --- UPDATES ---
  const handleSave = async (silent = false) => {
    if (!selectedProject) return;
    if (!silent) setLoading(true);

    const payload = {
      ...formData,
      project_id: selectedProject.id,
      final_amount: Number(calcs.finalDue),
      total_amount: Number(calcs.total),
      reference_number: selectedProject.ref_number,
      // Ensure these fields are explicitly Null or Valid Date Strings for DB
      invoiced_date: formData.invoiced_date || null,
      due_date: formData.due_date || null,
    };
    delete payload.id;
    delete payload.created_at;

    let result;
    const existingInvoice = invoices.find(
      (i) => i.project_id === selectedProject.id
    );

    // Sync PFH rate to production table (4_production)
    await supabase
      .from("4_production")
      .update({ pfh_rate: payload.pfh_rate })
      .eq("request_id", selectedProject.id);

    if (existingInvoice?.id) {
      result = await supabase
        .from("9_invoices")
        .update(payload)
        .eq("id", existingInvoice.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("9_invoices")
        .insert([payload])
        .select()
        .single();
    }

    if (!result.error) {
      updateLocalInvoice(result.data);
      setIsEditing(false);
      if (!silent) showToast("Saved");
    } else {
      console.error(result.error);
      if (!silent) showToast("Save Failed", "error");
    }
    if (!silent) setLoading(false);
  };

  const updateLocalInvoice = (updatedInvoice) => {
    setInvoices((prev) => {
      const exists = prev.find((i) => i.id === updatedInvoice.id);
      if (exists)
        return prev.map((i) =>
          i.id === updatedInvoice.id ? updatedInvoice : i
        );
      return [...prev, updatedInvoice];
    });
    setFormData((prev) => ({ ...prev, ...updatedInvoice }));
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const inv = invoices.find((i) => i.project_id === p.id);
        if (activeTab === "deposits") return true;
        return (inv?.ledger_tab || "open") === activeTab;
      })
      .filter((p) =>
        p.book_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [projects, invoices, activeTab, searchQuery]);

  // --- RENDER ---
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start pb-20">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* SIDEBAR */}
      <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-8 self-start shrink-0">
        <div className="bg-white rounded-[2rem] border flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
            />
          </div>
          <div className="p-2 flex border-b bg-slate-50 overflow-x-auto">
            {["open", "waiting", "paid", "deposits"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 p-3 text-[10px] font-black uppercase rounded-lg ${activeTab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left p-3 rounded-xl border ${selectedProject?.id === p.id ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50 border-transparent text-slate-500"}`}
              >
                <div className="text-[9px] font-black uppercase opacity-50 mb-1">
                  {p.ref_number}
                </div>
                <div className="text-xs font-bold truncate">{p.book_title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 w-full min-h-screen">
        {!selectedProject ? (
          <div className="text-center text-slate-300 font-black uppercase mt-20">
            Select Project
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "deposits" ? (
              <DepositDashboard
                project={selectedProject}
                invoiceData={invoices.find(
                  (i) => i.project_id === selectedProject.id
                )}
                onUpdate={updateLocalInvoice}
              />
            ) : (
              <div className="bg-white rounded-[3rem] border shadow-sm p-6 md:p-10 space-y-10">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase text-slate-900 leading-none">
                      Main Ledger
                    </h2>
                    <p className="text-xs font-bold uppercase text-slate-400 mt-1">
                      {selectedProject.book_title}
                    </p>
                  </div>
                  <button
                    onClick={
                      isEditing ? () => handleSave() : () => setIsEditing(true)
                    }
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2"
                  >
                    {isEditing ? <Save size={14} /> : <FileText size={14} />}{" "}
                    {isEditing ? "Save" : "Edit"}
                  </button>
                </div>

                {/* FORM INPUTS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">
                      PFH Count
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={formData.pfh_count}
                      onChange={(e) =>
                        setFormData({ ...formData, pfh_count: e.target.value })
                      }
                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">
                      Rate
                    </label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={formData.pfh_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, pfh_rate: e.target.value })
                      }
                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">
                      SAG %
                    </label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={formData.sag_ph_percent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sag_ph_percent: e.target.value,
                        })
                      }
                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">
                      Conv. Fee
                    </label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={formData.convenience_fee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          convenience_fee: e.target.value,
                        })
                      }
                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-lg font-bold"
                    />
                  </div>

                  {/* ADDED TAX RATE FIELD */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">
                      Est Tax %
                    </label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={formData.est_tax_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          est_tax_rate: e.target.value,
                        })
                      }
                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-lg font-bold"
                    />
                  </div>
                </div>

                {/* EXTRA ITEMS */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400">
                      Line Items
                    </h3>
                    {isEditing && (
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            line_items: [
                              ...p.line_items,
                              { description: "", amount: 0 },
                            ],
                          }))
                        }
                        className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-1"
                      >
                        <PlusCircle size={14} /> Add
                      </button>
                    )}
                  </div>
                  {formData.line_items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <input
                        disabled={!isEditing}
                        value={item.description}
                        onChange={(e) => {
                          const n = [...formData.line_items];
                          n[idx].description = e.target.value;
                          setFormData({ ...formData, line_items: n });
                        }}
                        className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold"
                        placeholder="Desc"
                      />
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={item.amount}
                        onChange={(e) => {
                          const n = [...formData.line_items];
                          n[idx].amount = e.target.value;
                          setFormData({ ...formData, line_items: n });
                        }}
                        className="w-24 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold"
                      />
                      {isEditing && (
                        <button
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              line_items: p.line_items.filter(
                                (_, i) => i !== idx
                              ),
                            }))
                          }
                          className="text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* TOTALS */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl">
                  <PDFDownloadLink
                    document={
                      <InvoicePDF
                        project={selectedProject}
                        data={formData}
                        calcs={calcs}
                      />
                    }
                    fileName={`INV_${selectedProject.ref_number}.pdf`}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-xl font-black uppercase text-xs"
                  >
                    {({ loading }) =>
                      loading ? "Loading..." : "Download Invoice"
                    }
                  </PDFDownloadLink>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">
                      Total Due
                    </div>
                    <div className="text-5xl font-black text-emerald-400 tracking-tighter">
                      {formatCurrency(calcs.finalDue)}
                    </div>
                    {formData.deposit_status === "paid" && (
                      <div className="text-[10px] font-bold text-slate-500 mt-2 flex justify-end items-center gap-2">
                        <CheckCircle2 size={12} /> Deposit Deducted
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS & ESCALATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 border rounded-3xl bg-slate-50">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-4">
                      Status
                    </h4>
                    <div className="flex gap-2">
                      {["open", "waiting", "paid"].map((s) => (
                        <button
                          key={s}
                          disabled={!isEditing}
                          onClick={() =>
                            setFormData({ ...formData, ledger_tab: s })
                          }
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${formData.ledger_tab === s ? "bg-slate-900 text-white" : "bg-white border text-slate-400"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`p-6 border rounded-3xl ${formData.reminders_sent >= 2 ? "bg-red-50 border-red-200" : "bg-slate-50"}`}
                  >
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                      <Bomb size={14} /> Escalation
                    </h4>
                    <div className="flex items-center gap-4">
                      <button
                        disabled={!isEditing}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: Math.max(0, p.reminders_sent - 1),
                          }))
                        }
                        className="w-10 h-10 bg-white rounded-xl shadow-sm font-black"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-black text-2xl text-slate-700">
                        {formData.reminders_sent}
                      </span>
                      <button
                        disabled={!isEditing}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: p.reminders_sent + 1,
                          }))
                        }
                        className="w-10 h-10 bg-white rounded-xl shadow-sm font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
