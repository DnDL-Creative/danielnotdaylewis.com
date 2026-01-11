"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  BookOpen,
  Clock,
  PauseCircle,
  CheckCircle2,
  Briefcase,
  Clapperboard,
  Mic,
  ArrowRight,
  Loader2,
} from "lucide-react";

// ✅ SHARED
import Modal from "../shared/Modal";
import Toast from "../shared/Toast";

// ✅ SUB COMPONENTS
import PendingProjectCard from "./PendingProjectCard";
import PendingEditForm from "./PendingEditForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const TRACKER_TABLE = "3_onboarding_first_15";

const TABS = [
  { id: "cinesonic", label: "CineSonic", icon: Clapperboard },
  { id: "pending", label: "Pending", icon: BookOpen },
  { id: "postponed", label: "Postponed", icon: Clock },
  { id: "on_hold", label: "On Hold", icon: PauseCircle },
  { id: "greenlit", label: "Greenlit", icon: CheckCircle2 },
  { id: "production", label: "Production", icon: Briefcase },
];

export default function PendingProjects({ onUpdate, navigateTab }) {
  const [requests, setRequests] = useState([]);
  const [trackedIds, setTrackedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cinesonic");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Modal & Toast
  const [modal, setModal] = useState({ isOpen: false });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: requestData, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .neq("status", "deleted")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      showToast("Sync failed", "error");
    } else {
      const { data: trackerData } = await supabase
        .from(TRACKER_TABLE)
        .select("request_id");
      const confirmedIds = new Set(trackerData?.map((t) => t.request_id) || []);
      setRequests(requestData || []);
      setTrackedIds(confirmedIds);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleAddToLeads = async (item) => {
    setProcessingId(item.id);
    try {
      const { error } = await supabase.from("1_responsive_leads").insert([
        {
          full_name: item.client_name,
          email: item.email,
          lead_type: item.client_type || "Unknown",
          lead_source: "Booking Request",
          platform: "Website",
          last_reply: "Initial Inquiry",
          vibes: "New",
          next_action: "Email",
          status: "active",
        },
      ]);
      if (error) throw error;
      showToast("Added to Leads");
    } catch (e) {
      showToast("Failed to add", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const executeBoot = async (item) => {
    setProcessingId(item.id);
    setModal({ isOpen: false });
    try {
      await supabase
        .from("6_archive")
        .insert([
          { original_data: item, archived_at: new Date(), reason: "Booted" },
        ]);
      await supabase.from("2_booking_requests").delete().eq("id", item.id);
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
      showToast("Project Booted");
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast("Boot Failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const executeRouting = async (item, routeType) => {
    setProcessingId(item.id);
    setModal({ isOpen: false });
    const targetStatus = routeType === "Roster" ? "first_15" : "onboarding";
    try {
      if (!trackedIds.has(item.id)) {
        await supabase.from(TRACKER_TABLE).insert([{ request_id: item.id }]);
      }
      await supabase
        .from("2_booking_requests")
        .update({ status: targetStatus, client_type: routeType })
        .eq("id", item.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, status: targetStatus, client_type: routeType }
            : r
        )
      );
      setTrackedIds((prev) => new Set(prev).add(item.id));
      showToast(`Routed to ${routeType}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast("Routing Failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // --- EDIT LOGIC ---
  const startEditing = (item) => {
    const formatNumberWithCommas = (val) =>
      val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
    setEditingId(item.id);
    setEditForm({
      ...item,
      start_date: item.start_date ? item.start_date.split("T")[0] : "",
      end_date: item.end_date ? item.end_date.split("T")[0] : "",
      word_count_display: formatNumberWithCommas(item.word_count || 0),
      ref_number: item.ref_number || item.id.slice(0, 8),
    });
  };

  const saveEdits = async () => {
    try {
      const payload = {
        ...editForm,
        word_count:
          parseInt(String(editForm.word_count_display).replace(/,/g, ""), 10) ||
          0,
      };
      delete payload.word_count_display;
      await supabase
        .from("2_booking_requests")
        .update(payload)
        .eq("id", editingId);
      setRequests((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
      );
      setEditingId(null);
      showToast("Updated");
    } catch (error) {
      showToast("Update failed", "error");
    }
  };

  const updateStatus = async (item, newStatus) => {
    try {
      await supabase
        .from("2_booking_requests")
        .update({ status: newStatus })
        .eq("id", item.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r))
      );
      showToast("Status updated");
      if (onUpdate) onUpdate();
    } catch (e) {
      showToast("Update failed", "error");
    }
  };

  const toggleClientType = async (item) => {
    const newType = item.client_type === "Roster" ? "Direct" : "Roster";
    await supabase
      .from("2_booking_requests")
      .update({ client_type: newType })
      .eq("id", item.id);
    setRequests((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, client_type: newType } : r))
    );
    showToast(`Switched to ${newType}`);
  };

  const handleImageUpload = async (e, itemId, isEditingMode = false) => {
    try {
      setUploadingId(itemId);
      const file = e.target.files[0];
      if (!file) return;
      const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
      await supabase.storage.from("admin").upload(fileName, file);
      const { data } = supabase.storage.from("admin").getPublicUrl(fileName);

      if (isEditingMode) {
        setEditForm((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
      } else {
        await supabase
          .from("2_booking_requests")
          .update({ cover_image_url: data.publicUrl })
          .eq("id", itemId);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === itemId ? { ...r, cover_image_url: data.publicUrl } : r
          )
        );
        showToast("Cover updated");
      }
    } catch (error) {
      showToast("Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  // --- RENDER ---
  const getTabForStatus = (status) => {
    if (status === "pending") return "pending";
    if (status === "cinesonic") return "cinesonic";
    if (status === "postponed") return "postponed";
    if (status === "on_hold") return "on_hold";
    if (["approved", "onboarding", "first_15"].includes(status))
      return "greenlit";
    if (status === "production") return "production";
    return null;
  };

  const visibleItems = requests.filter(
    (r) => getTabForStatus(r.status) === activeTab
  );

  const actions = {
    handleAddToLeads,
    openBootModal: (item) =>
      setModal({
        isOpen: true,
        title: "Boot Project?",
        message: `Move "${item.book_title}" to Archives?`,
        confirmText: "Boot",
        type: "danger",
        onConfirm: () => executeBoot(item),
      }),
    openGreenlightModal: (item) =>
      setModal({
        isOpen: true,
        title: "Greenlight Project",
        message: "Select Pipeline Destination:",
        type: "neutral",
        confirmText: null, // Custom body logic for routing buttons handled in modal content if needed, but generic modal is simple.
        // Actually, for Greenlight we need TWO buttons (Direct vs Roster).
        // The shared modal supports custom body? No, it takes message string.
        // **Solution**: We must adapt the shared Modal to accept children OR use a specific confirm for each.
        // For simplicity in this refactor, we will stick to the previous pattern of putting the buttons IN the modal if the shared modal allows children,
        // BUT our shared modal is simple.
        // **Hack**: We will use the shared Modal for simple confirms, but for the "Greenlight" split decision, we can just use two distinct buttons on the card?
        // No, the card has one "Greenlight" button.
        // **Better**: Just trigger the specific routing directly from the card if we want to skip the modal, OR pass a custom component to the Modal if we update shared/Modal.
        // **Current shared/Modal** takes `message` string.
        // Let's modify the local logic to just set the modal state and render the custom body locally like we did in SchedulerDashboard.
      }),
    updateStatus,
    toggleClientType,
    navigateTab,
  };

  return (
    <div className="space-y-8 pb-24 md:px-12 relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* SHARED MODAL (For simple confirms) */}
      {modal.confirmText && (
        <Modal {...modal} onClose={() => setModal({ isOpen: false })} />
      )}

      {/* CUSTOM MODAL FOR ROUTING (If type is greenlight) */}
      {modal.isOpen && !modal.confirmText && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-900 mb-4 text-center">
              Select Pipeline
            </h3>
            <div className="grid gap-3">
              <button
                onClick={() => executeRouting(modal.item, "Direct")}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 font-bold uppercase hover:bg-blue-100 flex items-center gap-3"
              >
                <Briefcase size={20} /> Direct Client
              </button>
              <button
                onClick={() => executeRouting(modal.item, "Roster")}
                className="p-4 rounded-xl border border-purple-100 bg-purple-50 text-purple-700 font-bold uppercase hover:bg-purple-100 flex items-center gap-3"
              >
                <Mic size={20} /> Roster Talent
              </button>
            </div>
            <button
              onClick={() => setModal({ isOpen: false })}
              className="mt-4 w-full py-3 text-slate-400 font-bold uppercase text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-white p-1.5 rounded-full border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
            >
              <tab.icon size={14} /> {tab.label}{" "}
              {requests.filter((r) => getTabForStatus(r.status) === tab.id)
                .length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] bg-slate-200 text-slate-500">
                  {
                    requests.filter((r) => getTabForStatus(r.status) === tab.id)
                      .length
                  }
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32 text-slate-300 flex flex-col items-center gap-3 animate-pulse">
          <Loader2 size={32} /> Syncing Intake...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 mx-auto max-w-2xl">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {activeTab} Projects
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {visibleItems.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <PendingEditForm
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleSave={saveEdits}
                  handleImageUpload={(e) => handleImageUpload(e, item.id, true)}
                  uploadingId={uploadingId}
                  setEditingId={setEditingId}
                  loading={loading}
                />
              ) : (
                <PendingProjectCard
                  item={item}
                  activeTab={activeTab}
                  isUploading={uploadingId === item.id}
                  handleImageUpload={handleImageUpload}
                  startEditing={startEditing}
                  actions={{
                    ...actions,
                    // Wrap modal triggers to pass item context
                    openGreenlightModal: () =>
                      setModal({ isOpen: true, item: item }),
                    openBootModal: () => actions.openBootModal(item),
                  }}
                  processingId={processingId}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
