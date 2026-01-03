"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  FolderCog,
  FileSignature,
  CreditCard,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ArrowRight,
  Hash,
  Users,
  Loader2,
  Mail,
  Gavel,
  Skull,
  Ban,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function OnboardingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // --- MODAL STATE ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data: onboardingData, error: obError } = await supabase
        .from("3_onboarding")
        .select("*")
        .order("strike_count", { ascending: false })
        .order("id", { ascending: true });

      if (obError) throw obError;

      let mergedData = [];
      if (onboardingData && onboardingData.length > 0) {
        const requestIds = onboardingData.map((i) => i.request_id);
        const { data: requestData, error: reqError } = await supabase
          .from("2_booking_requests")
          .select(
            "id, client_name, book_title, email, is_returning, client_type"
          )
          .in("id", requestIds);

        if (reqError) throw reqError;

        mergedData = onboardingData.map((item) => {
          const details =
            requestData.find((r) => r.id === item.request_id) || {};
          return { ...item, request: details };
        });
      }
      setItems(mergedData);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const updateField = async (id, field, value) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    await supabase
      .from("3_onboarding")
      .update({ [field]: value })
      .eq("id", id);
  };

  const addStrike = async (item) => {
    const newCount = (item.strike_count || 0) + 1;
    setItems(
      items.map((i) =>
        i.id === item.id ? { ...i, strike_count: newCount } : i
      )
    );
    await supabase
      .from("3_onboarding")
      .update({ strike_count: newCount })
      .eq("id", item.id);
  };

  const bootClient = (item) => {
    const title = item.request?.book_title || "Project";
    showAlert(
      "BOOT CLIENT?",
      `They have ${item.strike_count} strikes.\n\nThis will archive the project and mark them as booted.`,
      "confirm",
      async () => {
        // Move to Archive
        const { error } = await supabase.from("7_archive").insert([
          {
            original_data: item,
            reason: `Booted: ${item.strike_count} strikes`,
          },
        ]);

        if (!error) {
          // Update Request to Archived
          await supabase
            .from("2_booking_requests")
            .update({ status: "archived" })
            .eq("id", item.request_id);
          // Delete from Onboarding
          await supabase.from("3_onboarding").delete().eq("id", item.id);
          fetchItems();
          closeModal();
        } else {
          showAlert("Error", "Database failed to boot.", "error");
        }
      }
    );
  };

  const moveToF15 = (item) => {
    const title = item.request?.book_title || "Project";
    if (!item.deposit_paid)
      return showAlert(
        "STOP",
        "Deposit must be paid before moving to production.",
        "error"
      );

    showAlert(
      "Move to First 15?",
      `Advance "${title}" to the next stage?`,
      "confirm",
      async () => {
        const { error } = await supabase
          .from("4_first_15")
          .insert([{ request_id: item.request_id, sent_date: null }]);
        if (!error) {
          await supabase.from("3_onboarding").delete().eq("id", item.id);
          fetchItems();
          closeModal();
        }
      }
    );
  };

  // --- HELPERS ---
  const Toggle = ({ label, checked, onClick, icon: Icon, alert }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none relative overflow-hidden group ${
        checked
          ? "bg-slate-900 border-slate-900 text-white shadow-md"
          : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
      } ${alert && !checked ? "border-amber-300 bg-amber-50" : ""}`}
    >
      <div
        className={`p-1.5 rounded-full ${
          checked
            ? "bg-white/20"
            : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
        }`}
      >
        {Icon ? <Icon size={14} /> : <CheckCircle2 size={14} />}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider flex-grow">
        {label}
      </span>
      {checked && <CheckCircle2 size={16} className="text-emerald-400" />}
      {alert && !checked && (
        <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
      )}
    </div>
  );

  const SectionHeader = ({ title, step }) => (
    <div className="flex items-center justify-between mb-3 text-indigo-900/50 pb-2 border-b border-indigo-50">
      <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
        <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[9px]">
          STEP {step}
        </span>{" "}
        {title}
      </h4>
    </div>
  );

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse flex flex-col items-center gap-4">
        <Loader2 className="animate-spin" size={32} />
        Loading Pipeline...
      </div>
    );
  if (items.length === 0)
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Onboarding Queue Empty
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* --- CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up border border-slate-100 ring-1 ring-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  modal.type === "error"
                    ? "bg-red-50 text-red-500"
                    : "bg-indigo-50 text-indigo-500"
                }`}
              >
                {modal.type === "error" ? <AlertTriangle /> : <CheckCircle2 />}
              </div>
              <h3 className="text-lg font-black uppercase text-slate-900">
                {modal.title}
              </h3>
            </div>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed whitespace-pre-wrap">
              {modal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-slate-50 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              {modal.type === "confirm" && (
                <button
                  onClick={modal.onConfirm}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs hover:bg-indigo-600"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const req = item.request || {};
        const strikes = item.strike_count || 0;

        // STRIKE LOGIC
        let cardStyle = "bg-white border-slate-200";
        let strikeBadge = null;

        if (strikes === 1) {
          strikeBadge = (
            <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
              <AlertTriangle size={12} /> Strike 1
            </div>
          );
          cardStyle = "bg-white border-yellow-200 shadow-yellow-100";
        } else if (strikes === 2) {
          strikeBadge = (
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
              <AlertTriangle size={12} /> Strike 2
            </div>
          );
          cardStyle = "bg-white border-orange-200 shadow-orange-100";
        } else if (strikes >= 3) {
          strikeBadge = (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Skull size={12} /> BOOTABLE
            </div>
          );
          cardStyle = "bg-red-50 border-red-200 shadow-red-100";
        }

        const step1Complete = item.contract_sent && item.contract_signed;
        const step2Complete = item.deposit_sent && item.deposit_paid;
        const step3Complete =
          item.email_receipt_sent &&
          item.backend_folder &&
          item.manuscript_received;
        const isReady = step1Complete && step2Complete && step3Complete;

        return (
          <div
            key={item.id}
            className={`${cardStyle} border rounded-[2.5rem] shadow-sm transition-all duration-300 overflow-hidden ${
              isExpanded
                ? "ring-2 ring-indigo-500 shadow-2xl scale-[1.01]"
                : "hover:shadow-lg"
            }`}
          >
            {/* HEADER */}
            <div
              className="p-8 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer relative"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <div
                className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner transition-colors ${
                  isReady
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-indigo-50 text-indigo-400"
                }`}
              >
                {isReady ? <CheckCircle2 /> : <Clock />}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">
                    {req.book_title || "Untitled"}
                  </h3>
                  {strikeBadge}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> {req.client_name}
                  </span>
                  {item.contract_sent && !item.contract_signed && (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock size={12} /> Waiting for Sig
                    </span>
                  )}
                  {step1Complete && !item.deposit_paid && (
                    <span className="text-indigo-500 flex items-center gap-1">
                      <CreditCard size={12} /> Waiting for 15%
                    </span>
                  )}
                  {step2Complete && !item.manuscript_received && (
                    <span className="text-pink-500 flex items-center gap-1">
                      <FileText size={12} /> Waiting for Ms
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                {isReady && (
                  <div className="hidden md:flex bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest items-center gap-2 animate-pulse">
                    <CheckCircle2 size={14} /> Ready for F15
                  </div>
                )}
                <div
                  className={`p-3 rounded-full transition-all ${
                    isExpanded
                      ? "bg-indigo-50 text-indigo-500 rotate-180"
                      : "bg-white text-slate-300"
                  }`}
                >
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {/* EXPANDED */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                {/* COL 1: EMAIL 1 */}
                <div className="space-y-6">
                  <SectionHeader title="Contract Phase" step="1" />
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Email 1: The Kickoff
                    </p>
                    <Toggle
                      label="Contract Sent"
                      checked={item.contract_sent}
                      onClick={() =>
                        updateField(
                          item.id,
                          "contract_sent",
                          !item.contract_sent
                        )
                      }
                      icon={Mail}
                    />
                    <Toggle
                      label="Contract Signed"
                      checked={item.contract_signed}
                      onClick={() =>
                        updateField(
                          item.id,
                          "contract_signed",
                          !item.contract_signed
                        )
                      }
                      icon={FileSignature}
                    />
                  </div>
                  {item.contract_signed && !item.deposit_sent && (
                    <div className="bg-amber-50 text-amber-600 text-[10px] font-bold uppercase p-3 rounded-xl flex items-center gap-2 animate-pulse">
                      <AlertTriangle size={14} /> Send Deposit Invoice!
                    </div>
                  )}
                </div>

                {/* COL 2: EMAIL 2 */}
                <div className="space-y-6">
                  <SectionHeader title="Deposit Phase" step="2" />
                  <div
                    className={`bg-white p-4 rounded-2xl border shadow-sm space-y-2 ${
                      !step1Complete ? "opacity-50" : "border-slate-100"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Email 2: The Deposit
                    </p>
                    <Toggle
                      label="Invoice Sent"
                      checked={item.deposit_sent}
                      onClick={() =>
                        updateField(item.id, "deposit_sent", !item.deposit_sent)
                      }
                      icon={Mail}
                    />
                    <Toggle
                      label="Deposit Paid (15%)"
                      checked={item.deposit_paid}
                      onClick={() =>
                        updateField(item.id, "deposit_paid", !item.deposit_paid)
                      }
                      icon={CreditCard}
                      alert={item.deposit_sent && !item.deposit_paid}
                    />
                  </div>
                  {item.deposit_paid && !item.email_receipt_sent && (
                    <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase p-3 rounded-xl flex items-center gap-2 animate-pulse">
                      <CheckCircle2 size={14} /> Send Email 3 (Files)!
                    </div>
                  )}
                </div>

                {/* COL 3: ACTIONS */}
                <div className="space-y-6">
                  <SectionHeader title="Access & Actions" step="3" />
                  <div
                    className={`bg-white p-4 rounded-2xl border shadow-sm space-y-2 ${
                      !step2Complete ? "opacity-50" : "border-slate-100"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Email 3: Files & Access
                    </p>
                    <Toggle
                      label="Email 3 Sent"
                      checked={item.email_receipt_sent}
                      onClick={() =>
                        updateField(
                          item.id,
                          "email_receipt_sent",
                          !item.email_receipt_sent
                        )
                      }
                      icon={Mail}
                    />
                    <Toggle
                      label="Shared Folder Created"
                      checked={item.backend_folder}
                      onClick={() =>
                        updateField(
                          item.id,
                          "backend_folder",
                          !item.backend_folder
                        )
                      }
                      icon={FolderCog}
                    />
                    <Toggle
                      label="Manuscript Received"
                      checked={item.manuscript_received}
                      onClick={() =>
                        updateField(
                          item.id,
                          "manuscript_received",
                          !item.manuscript_received
                        )
                      }
                      icon={FileText}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    {strikes < 3 ? (
                      <button
                        onClick={() => addStrike(item)}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:border-orange-200 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Gavel size={14} /> Send Nudge ({strikes}/3)
                      </button>
                    ) : (
                      <button
                        onClick={() => bootClient(item)}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                      >
                        <Ban size={16} /> BOOT CLIENT
                      </button>
                    )}
                    <button
                      disabled={!isReady}
                      onClick={() => moveToF15(item)}
                      className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                        isReady
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      Move to First 15 <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
