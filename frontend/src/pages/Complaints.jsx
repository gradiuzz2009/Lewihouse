import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, EmptyState } from "../components/ui";
import { MessageSquare, Trash2 } from "lucide-react";

const empty = {
  tenant_id: "",
  room_id: "",
  title: "",
  description: "",
  priority: "medium",
  status: "open",
};

const statusMap = {
  open: { label: "Baru", tone: "danger" },
  in_progress: { label: "Diproses", tone: "warning" },
  resolved: { label: "Selesai", tone: "success" },
};
const priorityMap = {
  low: { label: "Rendah", tone: "muted" },
  medium: { label: "Sedang", tone: "warning" },
  high: { label: "Tinggi", tone: "danger" },
};

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      const [c, t, r] = await Promise.all([api.get("/complaints"), api.get("/tenants"), api.get("/rooms")]);
      setItems(c.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat keluhan");
    }
  };
  useEffect(() => {
    load();
  }, []);

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
      priority: c.priority,
      status: c.status,
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({ ...form, tenant_id: tid, room_id: t?.room_id || "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, tenant_id: form.tenant_id || null, room_id: form.room_id || null };
    try {
      if (editing) {
        await api.put(`/complaints/${editing.id}`, payload);
        toast.success("Keluhan diperbarui");
      } else {
        await api.post("/complaints", payload);
        toast.success("Keluhan ditambahkan");
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus keluhan ini?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      toast.success("Dihapus");
      load();
    } catch {
      toast.error("Gagal");
    }
  };

  return (
    <div className="fade-up" data-testid="complaints-page">
      <PageHeader
        title="Keluhan"
        subtitle={`${items.length} laporan tercatat`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-complaint-btn" />}
      />

      <div className="px-6 mt-4 flex flex-col gap-3 pb-6">
        {items.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Belum ada keluhan"
            subtitle="Semua penghuni tampak nyaman. Catat laporan bila muncul."
            action={<Button onClick={openNew} testid="empty-add-complaint">Tambah Keluhan</Button>}
            testid="complaints-empty"
          />
        )}
        {items.map((c, i) => {
          const s = statusMap[c.status];
          const p = priorityMap[c.priority];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft p-4 active:scale-[0.99] transition-transform"
              onClick={() => openEdit(c)}
              data-testid={`complaint-card-${c.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-base text-primary leading-tight">{c.title}</p>
                  <p className="text-[11px] text-subtle mt-1">
                    {[tenantName(c.tenant_id), roomName(c.room_id), fmtDate(c.created_at)]
                      .filter((x) => x && x !== "-")
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={s.tone} testid={`complaint-status-${c.id}`}>{s.label}</Badge>
                  <Badge tone={p.tone}>{p.label}</Badge>
                </div>
              </div>
              {c.description && <p className="text-xs text-subtle mt-3 leading-relaxed line-clamp-2">{c.description}</p>}
              <div className="flex justify-end mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id);
                  }}
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

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Keluhan" : "Keluhan Baru"}>
        <form onSubmit={submit}>
          <Input
            label="Judul"
            testid="input-complaint-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Deskripsi"
            testid="input-complaint-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Penghuni"
            testid="input-complaint-tenant"
            value={form.tenant_id}
            onChange={(e) => onTenantChange(e.target.value)}
          >
            <option value="">-- Umum --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {roomName(t.room_id)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Prioritas"
              testid="input-complaint-priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
            </Select>
            <Select
              label="Status"
              testid="input-complaint-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="open">Baru</option>
              <option value="in_progress">Diproses</option>
              <option value="resolved">Selesai</option>
            </Select>
          </div>
          <Button testid="submit-complaint" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Tambah Keluhan"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
