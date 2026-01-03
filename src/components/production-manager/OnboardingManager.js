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
  ChevronUp,
  Clock,
  ArrowRight,
  Hash,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function OnboardingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // --- ROBUST FETCH (MANUAL JOIN) ---
  const fetchItems = async () => {
    setLoading(true);

    try {
      // 1. Fetch the Checklist Data
      const { data: onboardingData, error: obError } = await supabase
        .from("3_onboarding")
        .select("*")
        .order("id", { ascending: true }); // Using ID for stable sort

      if (obError) throw obError;

      // 2. Fetch the Project Details (if we have onboarding items)
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

        // 3. Merge them in JavaScript
        mergedData = onboardingData.map((item) => {
          const details =
            requestData.find((r) => r.id === item.request_id) || {};
          return {
            ...item,
            request: details, // Embed details securely
          };
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
    // Optimistic Update
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

    const { error } = await supabase
      .from("3_onboarding")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      console.error("Update failed:", error);
      fetchItems(); // Revert on fail
    }
  };

  const moveToF15 = async (item) => {
    const title = item.request?.book_title || "Project";
    if (!confirm(`Move "${title}" to First 15?`)) return;

    // 1. Create row in 4_first_15
    const { error } = await supabase.from("4_first_15").insert([
      {
        request_id: item.request_id,
        sent_date: null,
      },
    ]);

    if (!error) {
      // 2. Delete from Onboarding
      await supabase.from("3_onboarding").delete().eq("id", item.id);
      fetchItems();
    } else {
      alert("Failed to move project.");
      console.error(error);
    }
  };

  // --- HELPERS ---
  const Toggle = ({ label, checked, onClick, icon: Icon }) => (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
        ${
          checked
            ? "bg-slate-900 border-slate-900 text-white shadow-md"
            : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
        }
      `}
    >
      <div
        className={`p-1.5 rounded-full ${
          checked ? "bg-white/20" : "bg-slate-100 text-slate-400"
        }`}
      >
        {Icon ? <Icon size={14} /> : <CheckCircle2 size={14} />}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider flex-grow">
        {label}
      </span>
      {checked && <CheckCircle2 size={16} className="text-emerald-400" />}
    </div>
  );

  const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-3 text-indigo-900/50 pb-2 border-b border-indigo-50">
      <Icon size={14} />
      <h4 className="text-[10px] font-black uppercase tracking-widest">
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
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const req = item.request || {};

        // Calculate Progress
        const totalSteps = 8;
        const completed = [
          item.contract_sent,
          item.contract_signed,
          item.deposit_sent,
          item.deposit_paid,
          item.email_receipt_sent,
          item.manuscript_received,
          item.docs_customized,
          item.backend_folder,
        ].filter(Boolean).length;

        const isReady = completed >= 7;

        return (
          <div
            key={item.id}
            className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-sm transition-all duration-300 overflow-hidden ${
              isExpanded
                ? "ring-2 ring-indigo-500 shadow-2xl scale-[1.01]"
                : "hover:shadow-lg"
            }`}
          >
            {/* HEADER ROW */}
            <div
              className="p-8 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer relative"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              {/* PROGRESS CIRCLE */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg
                  className="w-full h-full rotate-[-90deg]"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className={isReady ? "text-emerald-500" : "text-indigo-500"}
                    strokeDasharray={`${(completed / totalSteps) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-700">
                  {Math.round((completed / totalSteps) * 100)}%
                </span>
              </div>

              {/* MAIN INFO */}
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">
                    {req.book_title || "Untitled Project"}
                  </h3>
                  {req.is_returning && (
                    <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-1 rounded-md font-bold uppercase">
                      Returning
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                    <Users size={14} /> {req.client_name || "Unknown Client"}
                  </span>
                  {!isExpanded && (
                    <span className="flex items-center gap-1.5">
                      <Hash size={14} /> {item.id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION PREVIEW */}
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

            {/* EXPANDED WORKSPACE */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                {/* COL 1: SETUP */}
                <div className="space-y-6">
                  <SectionHeader title="Admin Setup" icon={FolderCog} />
                  <div className="space-y-2">
                    <Toggle
                      label="Create Backend Folder"
                      checked={item.backend_folder}
                      onClick={() =>
                        updateField(
                          item.id,
                          "backend_folder",
                          !item.backend_folder
                        )
                      }
                    />
                    <Toggle
                      label="Customize Templates"
                      checked={item.docs_customized}
                      onClick={() =>
                        updateField(
                          item.id,
                          "docs_customized",
                          !item.docs_customized
                        )
                      }
                    />
                  </div>
                </div>

                {/* COL 2: ASSETS & CONTRACT */}
                <div className="space-y-6">
                  <SectionHeader
                    title="Contract & Assets"
                    icon={FileSignature}
                  />
                  <div className="space-y-2">
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
                      icon={Send}
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
                    />
                  </div>
                </div>

                {/* COL 3: MONEY & ACTIONS */}
                <div className="space-y-6">
                  <SectionHeader title="Financials" icon={CreditCard} />
                  <div className="space-y-2 mb-8">
                    <Toggle
                      label="Invoice Sent"
                      checked={item.deposit_sent}
                      onClick={() =>
                        updateField(item.id, "deposit_sent", !item.deposit_sent)
                      }
                      icon={Send}
                    />
                    <Toggle
                      label="Deposit Paid"
                      checked={item.deposit_paid}
                      onClick={() =>
                        updateField(item.id, "deposit_paid", !item.deposit_paid)
                      }
                    />
                    <Toggle
                      label="Receipt Sent"
                      checked={item.email_receipt_sent}
                      onClick={() =>
                        updateField(
                          item.id,
                          "email_receipt_sent",
                          !item.email_receipt_sent
                        )
                      }
                      icon={Send}
                    />
                  </div>

                  {/* FINAL ACTION BUTTON */}
                  <div className="pt-6 border-t border-slate-200">
                    <button
                      disabled={!isReady}
                      onClick={() => moveToF15(item)}
                      className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                        isReady
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Move to First 15 <ArrowRight size={16} />
                    </button>
                    {!isReady && (
                      <p className="text-center text-[10px] font-bold text-slate-400 mt-2 uppercase">
                        Complete steps to proceed
                      </p>
                    )}
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
