"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../utils/supabase/client";
import {
  Calendar,
  Clock,
  User,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  BookOpen,
  Mic2,
  MoreHorizontal,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function IncomingBookings() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    // Fetch only 'pending' status from the main bookings table
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching requests:", error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    if (action === "approve") {
      // Move to Onboarding
      await supabase
        .from("bookings")
        .update({ status: "onboarding" })
        .eq("id", id);
    } else if (action === "reject") {
      // Archive
      if (!confirm("Reject this booking request?")) return;
      await supabase
        .from("bookings")
        .update({ status: "archive" })
        .eq("id", id);
    }
    fetchRequests();
  };

  const copyDetails = (r) => {
    const text = `NEW BOOKING\nTitle: ${r.book_title}\nAuthor: ${
      r.client_name
    }\nEmail: ${r.email}\nWords: ${r.word_count}\nDates: ${new Date(
      r.start_date
    ).toLocaleDateString()} - ${new Date(
      r.end_date
    ).toLocaleDateString()}\nDiscount: ${r.discount_applied}\nNotes: ${
      r.notes
    }`;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h3 className="font-black uppercase text-slate-800 text-xl">
            Booking Requests
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {requests.length} Pending Approvals
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse font-bold uppercase tracking-widest">
          Checking Inbox...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">
            No new booking requests
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all relative group"
            >
              <div className="absolute top-8 right-8 flex gap-2">
                <button
                  onClick={() => copyDetails(r)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Date Badge */}
                <div className="shrink-0 flex md:flex-col items-center gap-2 md:gap-1 text-center bg-slate-50 p-4 rounded-2xl h-fit">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Start
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {new Date(r.start_date).getDate()}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {new Date(r.start_date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                </div>

                {/* Middle: Details */}
                <div className="space-y-4 flex-grow">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                        Pending Review
                      </span>
                      {r.is_returning && (
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                          Returning
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      {r.book_title}
                    </h3>
                    <p className="text-slate-500 font-bold text-sm">
                      {r.client_name}{" "}
                      <span className="text-slate-300 font-normal">•</span>{" "}
                      {r.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <BookOpen size={14} className="text-slate-400" />{" "}
                      {Number(r.word_count).toLocaleString()} Words
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Clock size={14} className="text-slate-400" />{" "}
                      {r.days_needed} Days
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Mic2 size={14} className="text-slate-400" />{" "}
                      {r.narration_style}
                    </span>
                    {r.discount_applied && r.discount_applied !== "None" && (
                      <span className="flex items-center gap-1 bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg">
                        <Zap size={14} /> {r.discount_applied} Discount
                      </span>
                    )}
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic">
                      "{r.notes}"
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col gap-3 justify-end md:justify-start min-w-[140px]">
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    className="flex-1 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
