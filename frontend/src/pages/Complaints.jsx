import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState } from "../components/ui";
import { Wrench, Trash2, Play, CheckCircle2, Archive } from "lucide-react";

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
  pending: { label: "Menunggu", tone: "warning" },
  in_progress: { label: "Dikerjakan", tone: "primary" },
  resolved: { label: "Selesai", tone: "success" },
  closed: { label: "Ditutup", tone: "muted" },
};
const priorityMap = {
  low: { label: "Rendah", tone: "muted" },
  medium: { label: "Sedang", tone: "warning" },
  high: { label: "Tinggi", tone: "danger" },
  urgent: { label: "Mendesak", tone: "danger" },
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

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [c, t, r] = await Promise.all([api.get("/complaints"), api.get("/tenants"), api.get("/rooms")]);
      setItems(c.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat tiket");
    }
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(empty);
      setOpenSheet(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.name || "-";
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(empty);
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
      priority: c.priority,
      status: c.status,
      assignee: c.assignee || "",
      scheduled_at: c.scheduled_at || "",
      cost_material: c.cost_material || 0,
      cost_labor: c.cost_labor || 0,
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({ ...form, tenant_id: tid, room_id: t?.room_id || "" });
  };

  const submit = async (e) => {
    e.preventDefault();
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
        toast.success("Tiket diperbarui");
      } else {
        await api.post("/complaints", payload);
        toast.success("Tiket dibuat");
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const transition = async (id, status, label) => {
    try {
      await api.post(`/complaints/${id}/status`, { status });
      toast.success(label);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Transisi gagal");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tiket ini?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      toast.success("Dihapus");
      load();
    } catch {
      toast.error("Gagal");
    }
  };

  const filtered = filter === "all" ? items : items.filter((c) => c.status === filter);

  return (
    <div className="fade-up" data-testid="complaints-page">
      <PageHeader
        title="Perbaikan"
        subtitle={`${items.filter((c) => ["pending", "in_progress"].includes(c.status)).length} tiket aktif`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-complaint-btn" />}
      />

      <div className="px-6 flex gap-2 overflow-x-auto pb-2" data-testid="ticket-filters">
        {[{ k: "all", l: "Semua" }, ...Object.entries(statusMap).map(([k, v]) => ({ k, l: v.label }))].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            data-testid={`ticket-filter-${f.k}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition-colors ${
              filter === f.k ? "bg-primary text-white" : "bg-surface border border-line text-subtle"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="px-6 mt-4 flex flex-col gap-3 pb-6">
        {filtered.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="Belum ada tiket"
            subtitle="Semua fasilitas berfungsi baik. Catat tiket perbaikan bila muncul masalah."
            action={<Button onClick={openNew} testid="empty-add-complaint">Buat Tiket</Button>}
            testid="complaints-empty"
          />
        )}
        {filtered.map((c, i) => {
          const s = statusMap[c.status] || statusMap.pending;
          const p = priorityMap[c.priority] || priorityMap.medium;
          const cost = (c.cost_material || 0) + (c.cost_labor || 0);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden"
              data-testid={`complaint-card-${c.id}`}
            >
              <div className="p-4 active:scale-[0.99] transition-transform" onClick={() => openEdit(c)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">{categoryMap[c.category] || "Lainnya"}</p>
                    <p className="font-serif text-base text-primary leading-tight mt-0.5">{c.title}</p>
                    <p className="text-[11px] text-subtle mt-1">
                      {[tenantName(c.tenant_id), roomName(c.room_id), fmtDate(c.created_at)]
                        .filter((x) => x && x !== "-")
                        .join(" · ")}
                    </p>
                    {c.assignee && <p className="text-[11px] text-primary mt-0.5">Petugas: {c.assignee}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={s.tone} testid={`complaint-status-${c.id}`}>{s.label}</Badge>
                    <Badge tone={p.tone}>{p.label}</Badge>
                  </div>
                </div>
                {c.description && <p className="text-xs text-subtle mt-2 leading-relaxed line-clamp-2">{c.description}</p>}
                {cost > 0 && (
                  <p className="text-[11px] text-subtle mt-2">
                    Biaya: <span className="font-semibold text-primary tnum">{fmtIDR(cost)}</span>
                  </p>
                )}
              </div>
              <div className="border-t border-line px-4 py-2.5 flex items-center gap-2" aria-live="polite">
                {c.status === "pending" && (
                  <button
                    onClick={() => transition(c.id, "in_progress", "Pekerjaan dimulai")}
                    className="rounded-full bg-primary/5 text-primary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                    data-testid={`ticket-start-${c.id}`}
                  >
                    <Play size={11} /> Mulai Kerjakan
                  </button>
                )}
                {c.status === "in_progress" && (
                  <button
                    onClick={() => transition(c.id, "resolved", "Tiket selesai dikerjakan")}
                    className="rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                    data-testid={`ticket-resolve-${c.id}`}
                  >
                    <CheckCircle2 size={11} /> Tandai Selesai
                  </button>
                )}
                {c.status === "resolved" && (
                  <button
                    onClick={() => transition(c.id, "closed", "Tiket diarsipkan")}
                    className="rounded-full bg-muted text-subtle px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                    data-testid={`ticket-close-${c.id}`}
                  >
                    <Archive size={11} /> Tutup & Arsip
                  </button>
                )}
                <span className="flex-1" />
                <button
                  onClick={() => remove(c.id)}
                  className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center"
                  data-testid={`delete-complaint-${c.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Tiket" : "Tiket Perbaikan Baru"}>
        <form onSubmit={submit}>
          <Input label="Judul" testid="input-complaint-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Deskripsi" testid="input-complaint-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kategori" testid="input-complaint-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(categoryMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select label="Prioritas" testid="input-complaint-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </Select>
          </div>
          <Select label="Penghuni" testid="input-complaint-tenant" value={form.tenant_id} onChange={(e) => onTenantChange(e.target.value)}>
            <option value="">-- Umum / Area Bersama --</option>
            {tenants.filter((t) => t.status !== "former").map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {roomName(t.room_id)}
              </option>
            ))}
          </Select>
          <Select label="Kamar" testid="input-complaint-room" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
            <option value="">-- Area Bersama --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Petugas / Vendor" testid="input-complaint-assignee" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Pak Joko" />
            <Input label="Jadwal" testid="input-complaint-schedule" type="date" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Biaya Material" testid="input-complaint-cost-material" value={form.cost_material} onChange={(v) => setForm({ ...form, cost_material: v })} />
            <MoneyInput label="Biaya Jasa" testid="input-complaint-cost-labor" value={form.cost_labor} onChange={(v) => setForm({ ...form, cost_labor: v })} />
          </div>
          {editing && (
            <Select label="Status" testid="input-complaint-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(statusMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
          )}
          <Button testid="submit-complaint" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Buat Tiket"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
