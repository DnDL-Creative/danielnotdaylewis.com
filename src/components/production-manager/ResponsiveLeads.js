"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  MessageCircle,
  Clock,
  Building,
  Mail,
  MoreHorizontal,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResponsiveLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    email: "",
    vibes: "",
    next_action: "Follow Up",
    platform: "Email",
  });

  // --- FETCH LEADS ---
  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("responsive_leads")
      .select("*")
      .order("days_dormant", { ascending: false }); // Show most dormant first?

    if (error) console.error("Error fetching leads:", error);
    else setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // --- ACTIONS ---
  const handleSubmit = async () => {
    const { error } = await supabase
      .from("responsive_leads")
      .insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      fetchLeads();
      setFormData({
        full_name: "",
        company_name: "",
        email: "",
        vibes: "",
        next_action: "Follow Up",
        platform: "Email",
      });
    }
  };

  const updateStatus = async (id, newStatus) => {
    await supabase
      .from("responsive_leads")
      .update({ status: newStatus })
      .eq("id", id);
    fetchLeads();
  };

  const deleteLead = async (id) => {
    if (!confirm("Remove this lead?")) return;
    await supabase.from("responsive_leads").delete().eq("id", id);
    fetchLeads();
  };

  // --- HELPERS ---
  const getDormantColor = (days) => {
    if (days > 14) return "bg-red-100 text-red-600";
    if (days > 7) return "bg-orange-100 text-orange-600";
    return "bg-emerald-100 text-emerald-600";
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTION */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h3 className="font-black uppercase text-slate-800">Warm Leads</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {leads.length} Active Conversations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
        >
          <UserPlus size={16} /> Add Lead
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse font-bold uppercase tracking-widest">
          Loading Leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">
            No active leads found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative"
            >
              {/* STATUS BADGE */}
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${getDormantColor(
                    lead.days_dormant
                  )}`}
                >
                  <Clock size={12} /> {lead.days_dormant || 0} Days Quiet
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateStatus(lead.id, "converted")}
                    className="p-2 bg-slate-50 rounded-full text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                    title="Converted"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-2 bg-slate-50 rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Archive"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>

              {/* INFO */}
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                {lead.full_name}
              </h3>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                <Building size={12} /> {lead.company_name || "Indie"}
                <span className="text-slate-300">•</span>
                <span className="text-indigo-500">{lead.platform}</span>
              </div>

              {/* VIBES & ACTION */}
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Current Vibe
                  </p>
                  <p className="text-sm font-medium text-slate-700 italic">
                    "{lead.vibes || "No notes"}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Next Action
                    </p>
                    <p className="text-xs font-bold text-slate-900">
                      {lead.next_action}
                    </p>
                  </div>
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Reply <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black uppercase text-slate-900 mb-6">
              Add Lead
            </h2>
            <div className="space-y-4">
              <input
                placeholder="Full Name"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
              <input
                placeholder="Company / Title"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />
              <input
                placeholder="Email"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <textarea
                placeholder="Current Vibes / Situation"
                className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500 h-24 resize-none"
                value={formData.vibes}
                onChange={(e) =>
                  setFormData({ ...formData, vibes: e.target.value })
                }
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs"
                >
                  Save Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
