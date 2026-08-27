import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDateTime, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState, FormSection } from "../components/ui";
import {
  Wrench, CheckCircle2, Clock, AlertTriangle, AlertCircle,
  UserCheck, Trash2, Edit2, ShieldAlert, ArrowRight, Check, Calendar
} from "lucide-react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const empty = {
  tenant_id: "",
  room_id: "",
  title: "",
  description: "",
  category: "other",
  priority: "medium",
  status: "pending",
  assignee: "",
  scheduled_at: "",
  cost_material: 0,
  cost_labor: 0,
};

const statusMap = {
  pending: { label: "Menunggu Penugasan", tone: "warning" },
  in_progress: { label: "Sedang Dikerjakan", tone: "primary" },
  resolved: { label: "Selesai Dikerjakan", tone: "success" },
  closed: { label: "Ditutup", tone: "muted" },
};

const priorityStyles = {
  urgent: {
    label: "🔴 Mendesak / Darurat",
    cardBg: "bg-rose-50/50 border-rose-200 border-l-4 border-l-rose-600",
    badgeBg: "bg-rose-600 text-white",
    slaHours: 12,
  },
  high: {
    label: "🟠 Prioritas Tinggi",
    cardBg: "bg-orange-50/40 border-orange-200 border-l-4 border-l-orange-500",
    badgeBg: "bg-orange-600 text-white",
    slaHours: 24,
  },
  medium: {
    label: "🟡 Prioritas Sedang",
    cardBg: "bg-amber-50/30 border-amber-200 border-l-4 border-l-amber-500",
    badgeBg: "bg-amber-500 text-white",
    slaHours: 48,
  },
  low: {
    label: "🟢 Prioritas Rendah",
    cardBg: "bg-surface border-line border-l-4 border-l-slate-400",
    badgeBg: "bg-slate-200 text-slate-800",
    slaHours: 72,
  },
};

const categoryMap = {
  plumbing: "Pipa & Air",
  electrical: "Listrik",
  ac: "AC / HVAC",
  furniture: "Furnitur",
  structural: "Bangunan",
  internet: "Internet / Wi-Fi",
  other: "Lainnya",
};

// Helper for SLA calculation
function getSlaStatus(createdAtStr, priority) {
  if (!createdAtStr) return { label: "Normal", overdue: false };
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
  const maxHours = priorityStyles[priority]?.slaHours || 48;
  const overdue = diffHours > maxHours;

  return {
    hoursOpen: diffHours,
    overdue,
    label: overdue ? `Melewati SLA (${diffHours}j)` : `SLA Aman (${diffHours}/${maxHours}j)`,
  };
}

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Info Keluhan, 2: Penugasan Staff & Jadwal
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [c, t, r] = await Promise.all([api.get("/complaints"), api.get("/tenants"), api.get("/rooms")]);
      setItems(c.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat tiket perbaikan");
    }
  };

  useAutoRefresh(load);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(empty);
      setActiveStep(1);
      setOpenSheet(true);
      setParams({}, { replace: true });
    }
    if (params.get("filter")) {
      setFilter(params.get("filter"));
    }
  }, [params, setParams]);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.name || "-";
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setActiveStep(1);
    setOpenSheet(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      tenant_id: c.tenant_id || "",
      room_id: c.room_id || "",
      title: c.title,
      description: c.description || "",
      category: c.category || "other",
      priority: c.priority || "medium",
      status: c.status || "pending",
      assignee: c.assignee || "",
      scheduled_at: c.scheduled_at || "",
      cost_material: c.cost_material || 0,
      cost_labor: c.cost_labor || 0,
    });
    setActiveStep(1);
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({ ...form, tenant_id: tid, room_id: t?.room_id || "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tenant_id: form.tenant_id || null,
      room_id: form.room_id || null,
      assignee: form.assignee || null,
      scheduled_at: form.scheduled_at || null,
      cost_material: Number(form.cost_material),
      cost_labor: Number(form.cost_labor),
    };
    try {
      if (editing) {
        await api.put(`/complaints/${editing.id}`, payload);
        toast.success("Tiket perbaikan diperbarui");
      } else {
        await api.post("/complaints", payload);
        toast.success("Tiket keluhan berhasil dibuat");
      }
      setOpenSheet(false);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status, msg) => {
    try {
      await api.post(`/complaints/${id}/status`, { status });
      toast.success(msg);
      load();
    } catch {
      toast.error("Gagal update status");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tiket ini?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      toast.success("Tiket dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const sortedItems = useMemo(() => {
    // Sort urgent/high priority pending items first
    return [...items].sort((a, b) => {
      const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
      const statusOrder = { pending: 1, in_progress: 2, resolved: 3, closed: 4 };

      const sA = statusOrder[a.status] || 5;
      const sB = statusOrder[b.status] || 5;

      if (sA !== sB) return sA - sB;

      const pA = priorityOrder[a.priority] || 5;
      const pB = priorityOrder[b.priority] || 5;
      return pA - pB;
    });
  }, [items]);

  const filtered = filter === "all" ? sortedItems : sortedItems.filter((c) => c.status === filter);

  return (
    <div className="fade-up" data-testid="complaints-page">
      <PageHeader
        title="Tiket & Perbaikan"
        subtitle={`${items.filter((c) => c.status !== "resolved" && c.status !== "closed").length} tiket aktif menunggu penanganan`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-complaint-btn" label="Lapor Perbaikan" />}
      />

      {/* Filter Tabs with Quantities */}
      <div className="px-5 sm:px-6 mt-2 chip-scroll-container pb-1">
        {[
          { key: "all", label: "Semua", count: items.length },
          { key: "pending", label: "Menunggu", count: items.filter((c) => c.status === "pending").length, alert: items.filter((c) => c.status === "pending").length > 0 },
          { key: "in_progress", label: "Dikerjakan", count: items.filter((c) => c.status === "in_progress").length },
          { key: "resolved", label: "Selesai", count: items.filter((c) => c.status === "resolved").length },
          { key: "closed", label: "Ditutup", count: items.filter((c) => c.status === "closed").length },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 min-h-[40px] ${
              filter === f.key
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-surface text-gray-700 hover:text-ink border-line hover:border-primary/30"
            }`}
          >
            {f.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filter === f.key ? "bg-white/20 text-white" : "bg-muted text-subtle"
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Complaint Tickets List */}
      <div className="px-5 sm:px-6 mt-4 flex flex-col gap-3.5 pb-8">
        {filtered.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="Tidak ada tiket perbaikan"
            subtitle="Semua fasilitas kamar dan area bersama kosan dalam kondisi prima."
            action={<Button onClick={openNew}>Buat Tiket Perbaikan</Button>}
          />
        )}

        {filtered.map((c, i) => {
          const pStyle = priorityStyles[c.priority] || priorityStyles.medium;
          const st = statusMap[c.status] || statusMap.pending;
          const sla = getSlaStatus(c.created_at, c.priority);
          const isPending = c.status === "pending";
          const isInProgress = c.status === "in_progress";
          const isResolved = c.status === "resolved";

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className={`rounded-2xl border p-4 shadow-soft transition-all ${pStyle.cardBg}`}
              data-testid={`complaint-card-${c.title}`}
            >
              {/* Header Row: Title, Category & Priority */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-secondary uppercase tracking-wider">
                      {categoryMap[c.category] || c.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${pStyle.badgeBg}`}>
                      {pStyle.label}
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="font-serif text-lg font-bold text-primary mt-1 truncate">
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-700 font-semibold mt-0.5">
                    Kamar <strong>{roomName(c.room_id)}</strong> · Pelapor: {tenantName(c.tenant_id)}
                  </p>
                </div>

                {/* SLA / Aging Badge */}
                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                    sla.overdue
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-white text-gray-700 border-line"
                  }`}>
                    {sla.label}
                  </span>
                </div>
              </div>

              {/* Description body */}
              {c.description && (
                <p className="text-xs text-gray-700 mt-2.5 p-3 rounded-xl bg-white/70 border border-line/60 leading-relaxed">
                  {c.description}
                </p>
              )}

              {/* Assignee & Cost info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-line/60 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <span>Teknisi: <strong className="text-primary font-bold">{c.assignee || "Belum ditugaskan"}</strong></span>
                  {c.scheduled_at && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(c.scheduled_at)}</span>
                  )}
                </div>
                {(c.cost_material > 0 || c.cost_labor > 0) && (
                  <span className="font-bold text-primary font-mono tnum">
                    Biaya: {fmtIDR((c.cost_material || 0) + (c.cost_labor || 0))}
                  </span>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="mt-3.5 pt-3 border-t border-line/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => updateStatus(c.id, "in_progress", "Status: Sedang dikerjakan teknisi")}
                      className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-[#122820] text-white text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs transition-all min-h-[36px]"
                    >
                      <Wrench size={13} /> Tugaskan / Kerjakan
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => updateStatus(c.id, "resolved", "Status: Perbaikan selesai ✓")}
                      className="px-3.5 py-1.5 rounded-full bg-success hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs transition-all min-h-[36px]"
                    >
                      <Check size={13} /> Tandai Selesai
                    </button>
                  )}
                  {isResolved && (
                    <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full border border-success/20">
                      <CheckCircle2 size={14} /> Selesai Diperbaiki
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-full text-subtle hover:text-primary hover:bg-primary/5 grid place-items-center active:scale-95 transition-all"
                    title="Edit Detail Tiket"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="p-2 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center active:scale-95 transition-all"
                    title="Hapus Tiket"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2-Step Progressive Ticket Sheet */}
      <Sheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title={editing ? `Edit Tiket #${editing.title}` : "Lapor Kendala / Tiket Baru"}
        subtitle="Formulir 2-tahap pelaporan dan penugasan perbaikan fasilitas"
        maxWidth="sm:max-w-xl"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenSheet(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="complaint-form"
              testid="submit-complaint"
              loading={submitting}
              className="flex-1"
            >
              {editing ? "Simpan Perubahan" : "Terbitkan Tiket"}
            </Button>
          </div>
        }
      >
        {/* Step Indicator */}
        <div className="flex gap-1 bg-muted p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeStep === 1 ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            1. Rincian Keluhan
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeStep === 2 ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            2. Penugasan & Biaya
          </button>
        </div>

        <form id="complaint-form" onSubmit={submit} className="space-y-4">
          {/* STEP 1: Rincian Keluhan */}
          {activeStep === 1 && (
            <div className="space-y-3 fade-up">
              <Input
                label="Judul Kendala / Keluhan *"
                testid="input-complaint-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Contoh: Kran Kamar Mandi Bocor / AC Tidak Dingin"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Penghuni Pelapor"
                  value={form.tenant_id}
                  onChange={(e) => onTenantChange(e.target.value)}
                >
                  <option value="">-- Pilih Penghuni --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (Kamar {roomName(t.room_id)})</option>
                  ))}
                </Select>
                <Select
                  label="Lokasi Kamar *"
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                >
                  <option value="">-- Pilih Kamar --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} · Lt. {r.floor}</option>
                  ))}
                </Select>
              </div>
              <Select
                label="Kategori Kerusakan *"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(categoryMap).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
              <Textarea
                label="Deskripsi Detail Kendala"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Jelaskan kondisi kerusakan secara detail..."
              />
            </div>
          )}

          {/* STEP 2: Penugasan Staff & Biaya */}
          {activeStep === 2 && (
            <div className="space-y-3 fade-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Tingkat Urgensi / Prioritas *"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">🟢 Rendah (SLA 72 Jam)</option>
                  <option value="medium">🟡 Sedang (SLA 48 Jam)</option>
                  <option value="high">🟠 Tinggi (SLA 24 Jam)</option>
                  <option value="urgent">🔴 Mendesak / Darurat (SLA 12 Jam)</option>
                </Select>
                <Input
                  label="Teknisi / Staff Penanggung Jawab"
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  placeholder="Contoh: Pak Joko (Teknisi AC)"
                />
              </div>

              <Input
                label="Rencana Jadwal Pengerjaan"
                type="date"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MoneyInput
                  label="Estimasi Biaya Material"
                  value={form.cost_material}
                  onChange={(val) => setForm({ ...form, cost_material: val })}
                />
                <MoneyInput
                  label="Estimasi Biaya Jasa / Tukang"
                  value={form.cost_labor}
                  onChange={(val) => setForm({ ...form, cost_labor: val })}
                />
              </div>
            </div>
          )}
        </form>
      </Sheet>
    </div>
  );
}
