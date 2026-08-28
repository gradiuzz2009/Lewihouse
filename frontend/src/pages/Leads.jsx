import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import {
  Users,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  Search,
  ChevronRight,
  DoorOpen,
  Copy,
  Check,
  Send,
  X,
  Building2,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  generateTenantUsername,
  generateTemporaryPassword,
  formatOnboardingWhatsAppMessage,
} from "../lib/autoCredentials";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export const PIPELINE_STAGES = [
  {
    id: "INQUIRY_BARU",
    title: "Inquiry Baru",
    subtitle: "Tanya-tanya listing",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    headerBg: "bg-blue-600 text-white",
    dotColor: "bg-blue-500",
  },
  {
    id: "JADWAL_SURVEI",
    title: "Jadwal Survei",
    subtitle: "Kunjungan unit",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    headerBg: "bg-amber-600 text-white",
    dotColor: "bg-amber-500",
  },
  {
    id: "BOOKING_DP",
    title: "Menunggu DP",
    subtitle: "Booking / Tanda jadi",
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
    headerBg: "bg-purple-600 text-white",
    dotColor: "bg-purple-500",
  },
  {
    id: "KONVERSI_PENYEWA",
    title: "Siap Konversi / Deal",
    subtitle: "Terkonversi jadi penyewa",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-600 text-white",
    dotColor: "bg-emerald-500",
  },
];

export const PLATFORMS = [
  { id: "ALL", label: "Semua", color: "bg-slate-100 text-slate-800" },
  { id: "Mamikos", label: "Mamikos", color: "bg-emerald-500/15 text-emerald-700 border-emerald-300" },
  { id: "Rukita", label: "Rukita", color: "bg-orange-500/15 text-orange-700 border-orange-300" },
  { id: "OLX", label: "OLX", color: "bg-indigo-500/15 text-indigo-700 border-indigo-300" },
  { id: "Instagram", label: "Instagram", color: "bg-pink-500/15 text-pink-700 border-pink-300" },
  { id: "WhatsApp Langsung", label: "WhatsApp Langsung", color: "bg-teal-500/15 text-teal-700 border-teal-300" },
  { id: "Teman/Rekomendasi", label: "Teman / Rekomendasi", color: "bg-sky-500/15 text-sky-700 border-sky-300" },
  { id: "Lainnya", label: "Lainnya", color: "bg-slate-100 text-slate-700 border-slate-300" },
];

function toWaLink(phone, name, roomName) {
  const digits = (phone || "").replace(/\D/g, "");
  let cleanPhone = digits;
  if (cleanPhone.startsWith("08")) cleanPhone = "628" + cleanPhone.slice(2);
  else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;
  const msg = encodeURIComponent(
    `Halo Kak ${name || "Calon Penyewa"}, terima kasih telah menghubungi Lewi House Kosan Medan mengenai unit ${roomName || "kamar"}. Apakah ada hal yang bisa kami bantu?`
  );
  return `https://wa.me/${cleanPhone}?text=${msg}`;
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table"
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [statusModalLead, setStatusModalLead] = useState(null);
  const [convertModalLead, setConvertModalLead] = useState(null);
  const [conversionSuccessModal, setConversionSuccessModal] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    source: "Mamikos",
    room_id: "",
    expected_move_in: "",
    duration_months: 3,
    status: "INQUIRY_BARU",
    notes: "",
    dp_amount: 0,
    survey_date: "",
  });

  // Conversion Form State
  const [convertForm, setConvertForm] = useState({
    room_id: "",
    nik: "",
    email: "",
    lease_start: "",
    lease_end: "",
    send_wa: true,
  });

  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [lRes, rRes, tRes] = await Promise.all([
        api.get("/leads"),
        api.get("/rooms"),
        api.get("/tenants"),
      ]);
      setLeads(Array.isArray(lRes.data) ? lRes.data : []);
      setRooms(Array.isArray(rRes.data) ? rRes.data : []);
      setTenants(Array.isArray(tRes.data) ? tRes.data : []);
    } catch {
      toast.error("Gagal memuat data calon penyewa");
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(load);

  useEffect(() => {
    if (params.get("new") === "1") {
      openAddModal();
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchPlatform =
        selectedPlatform === "ALL" || l.source === selectedPlatform;
      const matchSearch =
        !searchQuery ||
        (l.name && l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.phone && l.phone.includes(searchQuery)) ||
        (l.room_name && l.room_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlatform && matchSearch;
    });
  }, [leads, selectedPlatform, searchQuery]);

  const openAddModal = () => {
    const defaultRoom = rooms.find((r) => r.status === "available") || rooms[0];
    setEditLead(null);
    setFormData({
      name: "",
      phone: "",
      source: "Mamikos",
      room_id: defaultRoom ? defaultRoom.id : "",
      expected_move_in: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
      duration_months: 3,
      status: "INQUIRY_BARU",
      notes: "",
      dp_amount: 0,
      survey_date: "",
    });
    setAddModalOpen(true);
  };

  const openEditModal = (lead) => {
    setEditLead(lead);
    setFormData({
      name: lead.name || "",
      phone: lead.phone || "",
      source: lead.source || "Mamikos",
      room_id: lead.room_id || "",
      expected_move_in: lead.expected_move_in || "",
      duration_months: lead.duration_months || 3,
      status: lead.status || "INQUIRY_BARU",
      notes: lead.notes || "",
      dp_amount: lead.dp_amount || 0,
      survey_date: lead.survey_date || "",
    });
    setAddModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Nama lengkap dan nomor WhatsApp wajib diisi");
      return;
    }

    try {
      if (editLead) {
        await api.put(`/leads/${editLead.id}`, formData);
        toast.success(`Data prospek ${formData.name} berhasil diperbarui`);
      } else {
        await api.post("/leads", formData);
        toast.success(`Calon penyewa ${formData.name} berhasil dicatat`);
      }
      setAddModalOpen(false);
      load();
    } catch (err) {
      toast.error("Gagal menyimpan data calon penyewa");
    }
  };

  const handleSyncMamikos = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/leads/sync-external");
      toast.success(res.data?.message || "Sinkronisasi webhook listing selesai!");
      load();
    } catch {
      toast.error("Gagal sinkronisasi listing");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteLead = async (id, name) => {
    if (!window.confirm(`Hapus data calon penyewa ${name}?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success(`Prospek ${name} dihapus`);
      load();
    } catch {
      toast.error("Gagal menghapus prospek");
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      toast.success(`Status prospek diubah ke ${newStatus}`);
      setStatusModalLead(null);
      load();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  // One-Click Conversion Trigger
  const openConvertModal = (lead) => {
    const targetRoom = rooms.find((r) => r.id === lead.room_id) || rooms.find((r) => r.status === "available") || rooms[0];
    const leaseStart = lead.expected_move_in || new Date().toISOString().slice(0, 10);
    
    // Compute lease end based on duration
    const d = new Date(leaseStart);
    d.setMonth(d.getMonth() + (Number(lead.duration_months) || 3));
    const leaseEnd = d.toISOString().slice(0, 10);

    setConvertModalLead(lead);
    setConvertForm({
      room_id: targetRoom ? targetRoom.id : "",
      nik: "",
      email: "",
      lease_start: leaseStart,
      lease_end: leaseEnd,
      send_wa: true,
    });
  };

  const handleExecuteConversion = async (e) => {
    e.preventDefault();
    if (!convertModalLead) return;

    try {
      const selectedRoom = rooms.find((r) => r.id === convertForm.room_id);
      const roomName = selectedRoom ? selectedRoom.name : "K-102";
      const existingUsernames = tenants.map((t) => t.username).filter(Boolean);
      const username = generateTenantUsername(roomName, convertModalLead.name, existingUsernames);
      const tempPw = generateTemporaryPassword(roomName, convertForm.nik || "123");

      const res = await api.post(`/leads/${convertModalLead.id}/convert`, {
        ...convertForm,
        username,
        temporary_password: tempPw,
      });

      const newTenant = res.data?.tenant;
      toast.success(`🎉 ${convertModalLead.name} resmi menjadi penyewa kamar ${roomName}!`);
      setConvertModalLead(null);
      
      // Open success credential dispatch modal
      setConversionSuccessModal({
        tenant: newTenant,
        lead: convertModalLead,
        roomName,
        username,
        temporaryPassword: tempPw,
        sendWa: convertForm.send_wa,
      });

      load();
    } catch (err) {
      toast.error("Gagal mengonversi calon penyewa");
    }
  };

  const copyCredentials = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Kredensial disalin ke clipboard");
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fade-up pb-28 pt-4 px-4 sm:px-6" data-testid="leads-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold">
              📥
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Pipeline Calon Penyewa
            </h1>
          </div>
          <p className="text-xs text-subtle mt-0.5 ml-10">
            Pencatatan calon penyewa manual & integrasi prospek listing kosan
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleSyncMamikos}
            disabled={syncing}
            data-testid="btn-sync-mamikos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-line hover:bg-muted/60 text-ink text-xs font-bold shadow-soft active:scale-95 transition-all disabled:opacity-50"
            title="Sinkronkan inquiry baru dari portal listing eksternal"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin text-primary" : "text-subtle"} />
            <span className="hidden sm:inline">Sinkronkan Mamikos</span>
            <span className="sm:hidden">Sinkron</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            data-testid="btn-add-lead-top"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#122820] text-white text-xs font-bold shadow-lifted active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>+ Catat Calon Penyewa</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Platform Filter Chips & View Mode Switcher */}
      <div className="bg-surface rounded-2xl border border-line p-3 mb-5 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari nama, no. WhatsApp, atau kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/60 border border-line rounded-xl text-xs text-ink placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
            />
          </div>

          {/* View Switcher Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-primary shadow-xs"
                  : "text-subtle hover:text-ink"
              }`}
              data-testid="view-switch-kanban"
            >
              <LayoutGrid size={13} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-xs"
                  : "text-subtle hover:text-ink"
              }`}
              data-testid="view-switch-table"
            >
              <List size={13} />
              <span>Tabel</span>
            </button>
          </div>
        </div>

        {/* Platform Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-subtle uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={11} />
            Sumber:
          </span>
          {PLATFORMS.map((p) => {
            const active = selectedPlatform === p.id;
            const count =
              p.id === "ALL"
                ? leads.length
                : leads.filter((l) => l.source === p.id).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlatform(p.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all border ${
                  active
                    ? "bg-primary text-white border-primary shadow-xs scale-100"
                    : "bg-surface hover:bg-muted text-ink border-line"
                }`}
              >
                {p.label} <span className="opacity-75 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View: Kanban Board vs Table */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="leads-kanban-board">
          {PIPELINE_STAGES.map((col) => {
            const columnLeads = filteredLeads.filter((l) => l.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col bg-muted/40 rounded-2xl border border-line p-3 min-h-[420px]"
                data-testid={`kanban-col-${col.id}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="font-bold text-xs text-ink">{col.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-line text-[10px] font-bold text-subtle shadow-xs">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Lead Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-10 px-2 text-subtle text-xs border border-dashed border-line rounded-xl bg-white/40">
                      <p>Belum ada prospek di tahap ini</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onEdit={() => openEditModal(lead)}
                        onDelete={() => handleDeleteLead(lead.id, lead.name)}
                        onChangeStatus={() => setStatusModalLead(lead)}
                        onConvert={() => openConvertModal(lead)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="leads-table">
              <thead className="bg-muted/60 text-subtle font-bold uppercase tracking-wider text-[10px] border-b border-line">
                <tr>
                  <th className="py-3 px-4">Calon Penyewa</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4">Unit Minat</th>
                  <th className="py-3 px-4">Target Masuk & Durasi</th>
                  <th className="py-3 px-4">Status Pipeline</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-subtle text-xs">
                      Tidak ada calon penyewa yang cocok dengan filter
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const stage = PIPELINE_STAGES.find((s) => s.id === lead.status) || PIPELINE_STAGES[0];
                    return (
                      <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ink text-sm">{lead.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-subtle text-[11px]">
                            <span>{lead.phone}</span>
                            <a
                              href={toWaLink(lead.phone, lead.name, lead.room_name)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              <MessageCircle size={12} /> Chat WA
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium border border-line">
                            {lead.source || "Manual"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ink">{lead.room_name || "Unit Bebas"}</div>
                          <div className="text-[11px] text-subtle">{fmtIDR(lead.room_price || 2000000)} / bln</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-ink">{fmtDate(lead.expected_move_in)}</div>
                          <div className="text-[11px] text-subtle">{lead.duration_months} Bulan</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${stage.color}`}>
                            {stage.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.status !== "KONVERSI_PENYEWA" && (
                              <button
                                type="button"
                                onClick={() => openConvertModal(lead)}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-[#122820] active:scale-95 transition-all shadow-xs"
                                title="Konversi prospek ke penyewa aktif"
                              >
                                🚀 Konversi
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 rounded-lg bg-muted hover:bg-line text-ink transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id, lead.name)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Hapus Prospek"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT LEAD MANUAL FORM */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-50 bg-white rounded-3xl border border-line shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
              data-testid="modal-add-lead"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-surface">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold">
                    ➕
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-ink">
                    {editLead ? "Edit Calon Penyewa" : "Catat Calon Penyewa Baru"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-line text-subtle hover:text-ink grid place-items-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveLead} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Sumber Platform */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Sumber Info / Platform <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                  >
                    <option value="Mamikos">Mamikos</option>
                    <option value="Rukita">Rukita</option>
                    <option value="OLX">OLX</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp Langsung">WhatsApp Langsung</option>
                    <option value="Teman/Rekomendasi">Teman / Rekomendasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Nama & Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Rian Pratama"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                      data-testid="input-lead-name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      No. WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Misal: 081234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                      data-testid="input-lead-phone"
                    />
                  </div>
                </div>

                {/* Unit Diminati & Rencana Durasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Unit Diminati
                    </label>
                    <select
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    >
                      <option value="">Pilih Kamar / Bebas</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.room_type?.toUpperCase() || "Standard"} — {fmtIDR(r.price)}) [{r.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Durasi Sewa
                    </label>
                    <select
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan</option>
                      <option value={6}>6 Bulan</option>
                      <option value={12}>1 Tahun (12 Bulan)</option>
                    </select>
                  </div>
                </div>

                {/* Tanggal Rencana Masuk & Status Awal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Rencana Tanggal Masuk
                    </label>
                    <input
                      type="date"
                      value={formData.expected_move_in}
                      onChange={(e) => setFormData({ ...formData, expected_move_in: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Status Pipeline
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    >
                      <option value="INQUIRY_BARU">Inquiry Baru / Tanya-Tanya</option>
                      <option value="JADWAL_SURVEI">Jadwal Survei</option>
                      <option value="BOOKING_DP">Booking DP / Menunggu DP</option>
                      <option value="KONVERSI_PENYEWA">Siap Konversi / Deal</option>
                    </select>
                  </div>
                </div>

                {/* Catatan / Kebutuhan Khusus */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Catatan / Kebutuhan Khusus
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Misal: Tanya parkir mobil, bawa hewan, minta kasur tambahan..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-none"
                  />
                </div>

                {/* Admin Note Notice Box */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 leading-snug">
                    <p className="font-bold">💡 Catatan Admin:</p>
                    <p className="mt-0.5">
                      Data ini tersimpan di pipeline. Kredensial akun resmi akan dibuat secara otomatis saat status diubah ke 'Konversi'.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-line text-ink text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    data-testid="btn-save-lead-submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-[#122820] text-white text-xs font-bold shadow-soft transition-all"
                  >
                    💾 {editLead ? "Simpan Perubahan" : "Simpan Calon"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ONE-CLICK CONVERSION MODAL */}
      <AnimatePresence>
        {convertModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConvertModalLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-50 bg-white rounded-3xl border border-line shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
              data-testid="modal-convert-lead"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-emerald-700 text-white">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-white/20 grid place-items-center text-lg">
                    🚀
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-bold">
                      Konversi Jadi Penyewa Resmi
                    </h3>
                    <p className="text-[11px] text-white/80">
                      {convertModalLead.name} ({convertModalLead.source || "Mamikos"})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleExecuteConversion} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Live Credential Preview Card */}
                {(() => {
                  const targetRoom = rooms.find((r) => r.id === convertForm.room_id);
                  const roomName = targetRoom ? targetRoom.name : convertModalLead.room_name || "K-102";
                  const existingUsernames = tenants.map((t) => t.username).filter(Boolean);
                  const previewUser = generateTenantUsername(roomName, convertModalLead.name, existingUsernames);
                  const previewPw = generateTemporaryPassword(roomName, convertForm.nik || "123");

                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                        <span className="font-bold flex items-center gap-1.5 text-secondary">
                          <ShieldCheck size={14} /> Live Credential Preview
                        </span>
                        <span>Auto-Generated (PRD)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400">Username Portal:</p>
                          <p className="font-mono font-bold text-white text-sm mt-0.5">{previewUser}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Password Sementara:</p>
                          <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">{previewPw}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Kamar & Tanggal Sewa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Kunci Unit Kamar <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={convertForm.room_id}
                      onChange={(e) => setConvertForm({ ...convertForm, room_id: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.room_type?.toUpperCase() || "Standard"} — {fmtIDR(r.price)}) — [{r.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Mulai Sewa
                    </label>
                    <input
                      type="date"
                      required
                      value={convertForm.lease_start}
                      onChange={(e) => setConvertForm({ ...convertForm, lease_start: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    />
                  </div>
                </div>

                {/* NIK (Optional) & Tanggal Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      NIK / KTP (Opsional)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="16 Digit NIK"
                      value={convertForm.nik}
                      onChange={(e) => setConvertForm({ ...convertForm, nik: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Selesai Sewa
                    </label>
                    <input
                      type="date"
                      value={convertForm.lease_end}
                      onChange={(e) => setConvertForm({ ...convertForm, lease_end: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    />
                  </div>
                </div>

                {/* Checkbox Kirim Kredensial via WA */}
                <label className="flex items-start gap-2.5 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertForm.send_wa}
                    onChange={(e) => setConvertForm({ ...convertForm, send_wa: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-line"
                  />
                  <div className="text-[11px] text-emerald-950 leading-tight">
                    <span className="font-bold">Kirim kredensial & panduan login via WhatsApp</span>
                    <p className="text-emerald-800/80 mt-0.5">
                      Sistem akan menyiapkan pesan format resmi siap kirim ke <b>{convertModalLead.phone}</b>.
                    </p>
                  </div>
                </label>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setConvertModalLead(null)}
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-line text-ink text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    data-testid="btn-confirm-convert"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-lifted transition-all flex items-center gap-1.5"
                  >
                    <span>🚀 Aktifkan Penyewa & Sewa</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CONVERSION SUCCESS CREDENTIAL MODAL */}
      <AnimatePresence>
        {conversionSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConversionSuccessModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-white rounded-3xl border border-line shadow-2xl w-full max-w-md p-5 text-center space-y-4"
              data-testid="modal-conversion-success"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto text-2xl">
                🎉
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-ink">
                  Akun Penghuni Berhasil Dibuat!
                </h3>
                <p className="text-xs text-subtle mt-1">
                  <b>{conversionSuccessModal.lead.name}</b> resmi aktif di Kamar <b>{conversionSuccessModal.roomName}</b>
                </p>
              </div>

              {/* Credential summary box */}
              <div className="bg-muted/60 p-4 rounded-2xl border border-line text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-subtle font-sans text-[11px]">Username:</span>
                  <span className="font-bold text-ink">{conversionSuccessModal.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-subtle font-sans text-[11px]">Password:</span>
                  <span className="font-bold text-primary">{conversionSuccessModal.temporaryPassword}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-subtle font-sans text-[11px]">Unit:</span>
                  <span className="font-bold text-ink">{conversionSuccessModal.roomName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {(() => {
                  const waMsg = formatOnboardingWhatsAppMessage({
                    tenantName: conversionSuccessModal.lead.name,
                    username: conversionSuccessModal.username,
                    phone: conversionSuccessModal.lead.phone,
                    roomName: conversionSuccessModal.roomName,
                    temporaryPassword: conversionSuccessModal.temporaryPassword,
                  });
                  const digits = (conversionSuccessModal.lead.phone || "").replace(/\D/g, "");
                  let cleanPhone = digits;
                  if (cleanPhone.startsWith("08")) cleanPhone = "628" + cleanPhone.slice(2);
                  else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;
                  const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

                  return (
                    <div className="flex flex-col gap-2">
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all"
                      >
                        <MessageCircle size={16} />
                        <span>Kirim Kredensial via WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyCredentials(waMsg)}
                        className="w-full py-2 rounded-xl bg-muted hover:bg-line text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedText ? "Tersalin!" : "Salin Pesan Kredensial"}</span>
                      </button>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setConversionSuccessModal(null)}
                  className="w-full py-2 text-xs font-bold text-subtle hover:text-ink transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: QUICK UPDATE STAGE */}
      <AnimatePresence>
        {statusModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusModalLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-white rounded-3xl border border-line shadow-2xl w-full max-w-sm p-5 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <h3 className="font-serif font-bold text-base text-ink">
                  Atur Status Prospek
                </h3>
                <button
                  type="button"
                  onClick={() => setStatusModalLead(null)}
                  className="p-1 rounded-full text-subtle hover:text-ink"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-subtle">
                Pindahkan tahap pipeline untuk <b>{statusModalLead.name}</b>:
              </p>

              <div className="space-y-1.5 pt-1">
                {PIPELINE_STAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleUpdateStatus(statusModalLead.id, s.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all ${
                      statusModalLead.status === s.id
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface hover:bg-muted text-ink border-line"
                    }`}
                  >
                    <span>{s.title}</span>
                    <ChevronRight size={14} className="opacity-70" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component: Lead Card in Kanban View
function LeadCard({ lead, onEdit, onDelete, onChangeStatus, onConvert }) {
  const isConverted = lead.status === "KONVERSI_PENYEWA";
  const platform = PLATFORMS.find((p) => p.id === lead.source) || PLATFORMS[PLATFORMS.length - 1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-line shadow-soft p-3.5 flex flex-col gap-2.5 hover:border-primary/40 transition-all group"
      data-testid={`lead-card-${lead.id}`}
    >
      {/* Top Badge: Platform & Arrival Date */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${platform.color}`}>
          {lead.source || "Mamikos"} 🟢
        </span>
        <span className="text-[10px] text-subtle font-medium">
          {fmtDate(lead.created_at || new Date())}
        </span>
      </div>

      {/* Main Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-ink group-hover:text-primary transition-colors">
            👤 {lead.name}
          </h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded text-subtle hover:text-ink"
              title="Edit Data"
            >
              <Edit2 size={12} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded text-rose-500 hover:text-rose-700"
              title="Hapus"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Contact & WA Direct Link */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-subtle font-medium">📞 {lead.phone}</span>
          <a
            href={toWaLink(lead.phone, lead.name, lead.room_name)}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold text-[10px] flex items-center gap-1 transition-colors"
          >
            <MessageCircle size={11} />
            <span>Chat WA</span>
          </a>
        </div>
      </div>

      {/* Room Interest & Duration */}
      <div className="bg-muted/40 p-2.5 rounded-xl border border-line/60 space-y-1 text-[11px]">
        <div className="flex items-center justify-between text-ink font-medium">
          <span>🛏️ Minat: <b>{lead.room_name || "Unit Bebas"}</b></span>
          <span className="text-[10px] text-subtle font-normal">{fmtIDR(lead.room_price || 2000000)}/bln</span>
        </div>
        <div className="text-subtle">
          📅 Target Masuk: <b>{fmtDate(lead.expected_move_in)}</b> ({lead.duration_months} Bulan)
        </div>
        {lead.notes && (
          <div className="text-[10px] text-subtle line-clamp-2 pt-0.5 border-t border-line/40">
            📝 {lead.notes}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button
          type="button"
          onClick={onChangeStatus}
          className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-line text-ink text-[11px] font-bold transition-all text-center"
        >
          📅 Atur Status
        </button>

        {isConverted ? (
          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 text-[10px] font-bold text-center border border-emerald-300">
            ✅ Terkonversi
          </div>
        ) : (
          <button
            type="button"
            onClick={onConvert}
            className="px-2.5 py-1.5 rounded-xl bg-primary hover:bg-[#122820] text-white text-[11px] font-bold transition-all shadow-xs text-center"
            data-testid={`btn-convert-${lead.id}`}
          >
            🚀 Konversi
          </button>
        )}
      </div>
    </motion.div>
  );
}
