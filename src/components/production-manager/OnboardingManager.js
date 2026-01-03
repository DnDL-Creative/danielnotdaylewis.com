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
  Copy,
  ExternalLink,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function OnboardingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "onboarding")
      .order("created_at", { ascending: true }); // Oldest first (FIFO)

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---
  const updateField = async (id, field, value) => {
    // Optimistic Update
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    await supabase
      .from("bookings")
      .update({ [field]: value })
      .eq("id", id);
  };

  const handleNudge = async (id, currentCount) => {
    const newCount = (currentCount || 0) + 1;
    const now = new Date().toISOString();

    setItems(
      items.map((i) =>
        i.id === id ? { ...i, strike_count: newCount, last_nudge_date: now } : i
      )
    );

    await supabase
      .from("bookings")
      .update({
        strike_count: newCount,
        last_nudge_date: now,
      })
      .eq("id", id);

    // In a real app, this would also trigger the email API
    alert(`Nudge Recorded. Strike Count: ${newCount}`);
  };

  // In OnboardingManager.js
  const moveToProduction = async (id) => {
    if (!confirm("Move to F15?")) return;
    // CHANGE 'production' TO 'f15_production'
    await supabase
      .from("bookings")
      .update({ status: "f15_production" })
      .eq("id", id);
    fetchItems();
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
          checked ? "bg-white/20" : "bg-slate-100"
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
      <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Loading Pipeline...
      </div>
    );
  if (items.length === 0)
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 text-slate-400 font-bold uppercase tracking-widest">
        Onboarding Clear
      </div>
    );

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const strikeColor =
          item.strike_count >= 2
            ? "bg-red-100 text-red-600"
            : item.strike_count === 1
            ? "bg-orange-100 text-orange-600"
            : "bg-emerald-100 text-emerald-600";
        const isReady =
          item.checklist_deposit_paid &&
          item.checklist_contract_signed &&
          item.checklist_prod_folder;

        return (
          <div
            key={item.id}
            className={`bg-white border border-slate-200 rounded-[2rem] shadow-sm transition-all duration-300 ${
              isExpanded
                ? "ring-2 ring-indigo-500 shadow-2xl"
                : "hover:shadow-md"
            }`}
          >
            {/* HEADER ROW */}
            <div
              className="p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              {/* STRIKE BADGE */}
              <div
                className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${strikeColor}`}
              >
                {item.strike_count || 0}
              </div>

              {/* MAIN INFO */}
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-black text-slate-900">
                    {item.book_title}
                  </h3>
                  {item.is_returning && (
                    <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                      Returning
                    </span>
                  )}
                  {item.is_regular && (
                    <span className="bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                      Regular
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {item.client_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={12} /> {item.ref_number || "No Ref #"}
                  </span>
                  {item.last_nudge_date && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <Clock size={12} /> Nudged{" "}
                      {new Date(item.last_nudge_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION PREVIEW */}
              <div className="flex items-center gap-4">
                {isReady && (
                  <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <CheckCircle2 size={14} /> Ready for F15
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="text-slate-300" />
                ) : (
                  <ChevronDown className="text-slate-300" />
                )}
              </div>
            </div>

            {/* EXPANDED WORKSPACE */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-6 md:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                {/* COL 1: SETUP & ASSETS */}
                <div className="space-y-6">
                  <div>
                    <SectionHeader title="Admin Setup" icon={FolderCog} />
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          placeholder="Ref / Inv #"
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:border-indigo-500"
                          value={item.ref_number || ""}
                          onChange={(e) =>
                            updateField(item.id, "ref_number", e.target.value)
                          }
                        />
                      </div>
                      <Toggle
                        label="Add to Contacts"
                        checked={item.checklist_added_to_contacts}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_added_to_contacts",
                            !item.checklist_added_to_contacts
                          )
                        }
                      />
                      <Toggle
                        label="Backend Folder"
                        checked={item.checklist_backend_folder}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_backend_folder",
                            !item.checklist_backend_folder
                          )
                        }
                      />
                      <Toggle
                        label="Customize Docs"
                        checked={item.checklist_docs_customized}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_docs_customized",
                            !item.checklist_docs_customized
                          )
                        }
                      />
                      <Toggle
                        label="Client Folder"
                        checked={item.checklist_prod_folder}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_prod_folder",
                            !item.checklist_prod_folder
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <SectionHeader title="Assets" icon={FileText} />
                    <div className="grid grid-cols-1 gap-2">
                      <Toggle
                        label="Breakdown Received"
                        checked={!!item.breakdown_received_date}
                        onClick={() =>
                          updateField(
                            item.id,
                            "breakdown_received_date",
                            item.breakdown_received_date
                              ? null
                              : new Date().toISOString()
                          )
                        }
                      />
                      <Toggle
                        label="Manuscript Received"
                        checked={item.checklist_manuscript_received}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_manuscript_received",
                            !item.checklist_manuscript_received
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* COL 2: CONTRACT & MONEY */}
                <div className="space-y-6">
                  <div>
                    <SectionHeader title="Contract" icon={FileSignature} />
                    <div className="grid grid-cols-1 gap-2">
                      <Toggle
                        label="Email 1: Contract Sent"
                        checked={item.checklist_contract_sent}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_contract_sent",
                            !item.checklist_contract_sent
                          )
                        }
                        icon={Send}
                      />
                      <Toggle
                        label="E-Sig Requested"
                        checked={item.checklist_esig_sent}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_esig_sent",
                            !item.checklist_esig_sent
                          )
                        }
                      />
                      <Toggle
                        label="Contract Signed"
                        checked={item.checklist_contract_signed}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_contract_signed",
                            !item.checklist_contract_signed
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <SectionHeader title="Deposit" icon={CreditCard} />
                    <div className="grid grid-cols-1 gap-2">
                      <Toggle
                        label="Email 2: Invoice Sent"
                        checked={item.checklist_deposit_sent}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_deposit_sent",
                            !item.checklist_deposit_sent
                          )
                        }
                        icon={Send}
                      />
                      <Toggle
                        label="Deposit Paid"
                        checked={item.checklist_deposit_paid}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_deposit_paid",
                            !item.checklist_deposit_paid
                          )
                        }
                      />
                      <Toggle
                        label="Email 3: Receipt Sent"
                        checked={item.checklist_email_deposit_receipt}
                        onClick={() =>
                          updateField(
                            item.id,
                            "checklist_email_deposit_receipt",
                            !item.checklist_email_deposit_receipt
                          )
                        }
                        icon={Send}
                      />
                    </div>
                  </div>
                </div>

                {/* COL 3: ACTIONS */}
                <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 h-fit">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Project Actions
                  </h4>

                  <button
                    onClick={() => handleNudge(item.id, item.strike_count)}
                    className="w-full py-4 bg-orange-50 text-orange-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} /> Send Nudge ({item.strike_count})
                  </button>

                  <div className="h-px bg-slate-100 my-2" />

                  {isReady ? (
                    <button
                      onClick={() => moveToProduction(item.id)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
                    >
                      Move to F15 <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="text-center p-4 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Complete Checklist to Proceed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
