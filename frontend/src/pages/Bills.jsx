import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, monthLabel } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, EmptyState } from "../components/ui";
import { Receipt, CheckCircle2, Trash2 } from "lucide-react";

const emptyForm = {
  tenant_id: "",
  room_id: "",
  period: new Date().toISOString().slice(0, 7),
  rent: 0,
  electricity: 0,
  water: 0,
  other: 0,
  other_label: "",
  due_date: "",
  status: "unpaid",
  notes: "",
};

const statusMap = {
  paid: { label: "Lunas", tone: "success" },
  unpaid: { label: "Belum Bayar", tone: "warning" },
  overdue: { label: "Terlambat", tone: "danger" },
};

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const [b, t, r] = await Promise.all([api.get("/bills"), api.get("/tenants"), api.get("/rooms")]);
      setBills(b.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat tagihan");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.name || "-";
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenSheet(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      tenant_id: b.tenant_id,
      room_id: b.room_id || "",
      period: b.period,
      rent: b.rent,
      electricity: b.electricity,
      water: b.water,
      other: b.other,
      other_label: b.other_label || "",
      due_date: b.due_date || "",
      status: b.status,
      notes: b.notes || "",
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({
      ...form,
      tenant_id: tid,
      room_id: t?.room_id || "",
      rent: t?.monthly_rent ?? form.rent,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tenant_id) {
      toast.error("Pilih penghuni dulu");
      return;
    }
    const payload = {
      ...form,
      room_id: form.room_id || null,
      rent: Number(form.rent),
      electricity: Number(form.electricity),
      water: Number(form.water),
      other: Number(form.other),
    };
    try {
      if (editing) {
        await api.put(`/bills/${editing.id}`, payload);
        toast.success("Tagihan diperbarui");
      } else {
        await api.post("/bills", payload);
        toast.success("Tagihan dibuat");
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const markPaid = async (id) => {
    try {
      await api.post(`/bills/${id}/pay?method=cash`);
      toast.success("Ditandai lunas");
      load();
    } catch {
      toast.error("Gagal update");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tagihan ini?")) return;
    try {
      await api.delete(`/bills/${id}`);
      toast.success("Tagihan dihapus");
      load();
    } catch {
      toast.error("Gagal");
    }
  };

  const filtered = useMemo(() => (filter === "all" ? bills : bills.filter((b) => b.status === filter)), [bills, filter]);
  const outstanding = bills.filter((b) => b.status !== "paid").reduce((a, b) => a + b.total, 0);
  const paidThis = bills.filter((b) => b.status === "paid" && b.period === new Date().toISOString().slice(0, 7)).reduce((a, b) => a + b.total, 0);

  const total = Number(form.rent || 0) + Number(form.electricity || 0) + Number(form.water || 0) + Number(form.other || 0);

  return (
    <div className="fade-up" data-testid="bills-page">
      <PageHeader
        title="Tagihan"
        subtitle={`${bills.length} tagihan tercatat`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-bill-btn" />}
      />

      {/* Stats */}
      <div className="px-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary text-white p-4">
          <p className="text-[10px] uppercase tracking-widest text-secondary">Belum dibayar</p>
          <p className="font-serif text-xl mt-1 tnum" data-testid="bills-outstanding">{fmtIDR(outstanding)}</p>
        </div>
        <div className="rounded-2xl bg-surface border border-line p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-subtle">Lunas bulan ini</p>
          <p className="font-serif text-xl mt-1 text-primary tnum" data-testid="bills-paid-month">{fmtIDR(paidThis)}</p>
        </div>
      </div>

      <div className="px-6 mt-4 flex gap-2 overflow-x-auto pb-2" data-testid="bill-filters">
        {[
          { k: "all", l: "Semua" },
          { k: "unpaid", l: "Belum Bayar" },
          { k: "paid", l: "Lunas" },
          { k: "overdue", l: "Terlambat" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            data-testid={`bill-filter-${f.k}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition-colors ${
              filter === f.k ? "bg-primary text-white" : "bg-surface border border-line text-subtle"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="px-6 mt-3 flex flex-col gap-3 pb-6">
        {filtered.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Belum ada tagihan"
            subtitle="Buat tagihan bulanan untuk penghuni Anda."
            action={<Button onClick={openNew} testid="empty-add-bill">Buat Tagihan</Button>}
            testid="bills-empty"
          />
        )}
        {filtered.map((b, i) => {
          const s = statusMap[b.status] || statusMap.unpaid;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface rounded-2xl border border-line shadow-soft p-4 active:scale-[0.99] transition-transform"
              onClick={() => openEdit(b)}
              data-testid={`bill-card-${b.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-subtle">{monthLabel(b.period)}</p>
                  <p className="font-serif text-lg text-primary leading-tight truncate">{tenantName(b.tenant_id)}</p>
                  <p className="text-xs text-subtle">{roomName(b.room_id)}</p>
                </div>
                <Badge tone={s.tone} testid={`bill-status-${b.id}`}>{s.label}</Badge>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-subtle uppercase tracking-widest">Total</p>
                  <p className="font-serif text-xl text-primary tnum">{fmtIDR(b.total)}</p>
                </div>
                <div className="flex gap-1.5">
                  {b.status !== "paid" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markPaid(b.id);
                      }}
                      className="rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`pay-bill-${b.id}`}
                    >
                      <CheckCircle2 size={12} /> Lunas
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(b.id);
                    }}
                    className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center"
                    data-testid={`delete-bill-${b.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Tagihan" : "Tagihan Baru"}>
        <form onSubmit={submit}>
          <Select
            label="Penghuni"
            testid="input-bill-tenant"
            value={form.tenant_id}
            onChange={(e) => onTenantChange(e.target.value)}
            required
          >
            <option value="">-- Pilih --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {roomName(t.room_id)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Periode (YYYY-MM)"
              testid="input-bill-period"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              required
              placeholder="2026-01"
            />
            <Input
              label="Jatuh Tempo"
              testid="input-bill-due"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <Input
            label="Sewa Kamar"
            testid="input-bill-rent"
            type="number"
            value={form.rent}
            onChange={(e) => setForm({ ...form, rent: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Listrik"
              testid="input-bill-electricity"
              type="number"
              value={form.electricity}
              onChange={(e) => setForm({ ...form, electricity: e.target.value })}
            />
            <Input
              label="Air"
              testid="input-bill-water"
              type="number"
              value={form.water}
              onChange={(e) => setForm({ ...form, water: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lain-lain"
              testid="input-bill-other"
              type="number"
              value={form.other}
              onChange={(e) => setForm({ ...form, other: e.target.value })}
            />
            <Input
              label="Label Lain-lain"
              testid="input-bill-other-label"
              value={form.other_label}
              onChange={(e) => setForm({ ...form, other_label: e.target.value })}
              placeholder="Denda / Parkir"
            />
          </div>
          <Select
            label="Status"
            testid="input-bill-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="unpaid">Belum Bayar</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Terlambat</option>
          </Select>
          <Textarea
            label="Catatan"
            testid="input-bill-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="rounded-2xl bg-primary text-white p-4 mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-secondary">Total</span>
            <span className="font-serif text-xl tnum" data-testid="bill-total-preview">{fmtIDR(total)}</span>
          </div>
          <Button testid="submit-bill" className="w-full" type="submit">
            {editing ? "Simpan Perubahan" : "Buat Tagihan"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
