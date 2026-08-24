import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState } from "../components/ui";
import { Users, Phone, Trash2, LogIn, LogOut, Plus, X } from "lucide-react";

const empty = {
  name: "",
  phone: "",
  nik: "",
  email: "",
  occupation: "",
  emergency_name: "",
  emergency_relation: "",
  emergency_phone: "",
  room_id: "",
  lease_start: "",
  lease_end: "",
  monthly_rent: 0,
  deposit: 0,
  avatar_url: "",
  notes: "",
};

const statusMap = {
  pending_assignment: { label: "Calon", tone: "warning" },
  active: { label: "Aktif", tone: "success" },
  former: { label: "Keluar", tone: "muted" },
};

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [moveOutTarget, setMoveOutTarget] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [t, r] = await Promise.all([api.get("/tenants"), api.get("/rooms")]);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat penghuni");
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

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpenSheet(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    const f = { ...empty };
    Object.keys(empty).forEach((k) => (f[k] = t[k] ?? ""));
    f.monthly_rent = t.monthly_rent || 0;
    f.deposit = t.deposit || 0;
    setForm(f);
    setOpenSheet(true);
  };

  const onRoomChange = (rid) => {
    const room = rooms.find((r) => r.id === rid);
    setForm({
      ...form,
      room_id: rid,
      monthly_rent: room ? room.price : form.monthly_rent,
      deposit: room && room.deposit ? room.deposit : form.deposit,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      room_id: form.room_id || null,
      monthly_rent: Number(form.monthly_rent),
      deposit: Number(form.deposit),
    };
    try {
      if (editing) {
        await api.put(`/tenants/${editing.id}`, payload);
        toast.success("Penghuni diperbarui");
      } else {
        await api.post("/tenants", payload);
        toast.success("Penghuni terdaftar (status: Calon)");
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const moveIn = async (t) => {
    try {
      await api.post(`/tenants/${t.id}/move-in`);
      toast.success(`${t.name} check-in — PIN akses diterbitkan`);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal check-in");
    }
  };

  const openMoveOut = (t) => {
    setMoveOutTarget(t);
    setDeductions([]);
  };

  const confirmMoveOut = async () => {
    try {
      const { data } = await api.post(`/tenants/${moveOutTarget.id}/move-out`, { deductions });
      toast.success(`Check-out selesai. Refund deposit ${fmtIDR(data.deposit_settlement?.refund || 0)}`);
      setMoveOutTarget(null);
      load();
    } catch {
      toast.error("Gagal check-out");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus penghuni ini?")) return;
    try {
      await api.delete(`/tenants/${id}`);
      toast.success("Penghuni dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const availableRooms = rooms.filter(
    (r) =>
      ["available", "reserved"].includes(r.status) &&
      (!r.tenant_id || r.id === form.room_id || r.tenant_id === editing?.id)
  );
  if (editing?.room_id && !availableRooms.find((r) => r.id === editing.room_id)) {
    const cur = rooms.find((r) => r.id === editing.room_id);
    if (cur) availableRooms.unshift(cur);
  }

  const totalDeduction = deductions.reduce((a, d) => a + Number(d.amount || 0), 0);
  const refundPreview = moveOutTarget ? Math.max(0, (moveOutTarget.deposit || 0) - totalDeduction) : 0;

  return (
    <div className="fade-up" data-testid="tenants-page">
      <PageHeader
        title="Penghuni"
        subtitle={`${tenants.filter((t) => t.status !== "former").length} penghuni terdaftar`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-tenant-btn" />}
      />

      <div className="px-6 mt-4 flex flex-col gap-3 pb-6">
        {tenants.length === 0 && (
          <EmptyState
            icon={Users}
            title="Belum ada penghuni"
            subtitle="Daftarkan penghuni pertama untuk mulai mengelola kontrak & tagihan."
            action={<Button onClick={openNew} testid="empty-add-tenant">Tambah Penghuni</Button>}
            testid="tenants-empty"
          />
        )}
        {tenants.map((t, i) => {
          const st = statusMap[t.status] || statusMap.active;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden"
              data-testid={`tenant-card-${t.name}`}
            >
              <div className="p-4 flex gap-4 items-center active:scale-[0.99] transition-transform" onClick={() => openEdit(t)}>
                <div className="w-14 h-14 rounded-full bg-muted shrink-0 overflow-hidden grid place-items-center">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-xl text-primary">{t.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg text-primary leading-tight truncate">{t.name}</p>
                    <Badge tone={st.tone} testid={`tenant-status-${t.name}`}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-subtle mt-0.5 flex items-center gap-1.5">
                    <Phone size={11} /> {t.phone}
                    {t.occupation ? ` · ${t.occupation}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary rounded-full px-2 py-0.5">
                      {roomName(t.room_id)}
                    </span>
                    <span className="text-[10px] text-subtle tnum">{fmtIDR(t.monthly_rent)}/bln</span>
                    {t.lease_end && <span className="text-[10px] text-subtle">s/d {fmtDate(t.lease_end)}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                  }}
                  className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center shrink-0"
                  data-testid={`delete-tenant-${t.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {t.status !== "former" && (
                <div className="border-t border-line px-4 py-2.5 flex gap-2">
                  {t.status === "pending_assignment" && t.room_id && (
                    <button
                      onClick={() => moveIn(t)}
                      className="rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`movein-${t.name}`}
                    >
                      <LogIn size={12} /> Check-in & Terbitkan PIN
                    </button>
                  )}
                  {t.status === "active" && (
                    <button
                      onClick={() => openMoveOut(t)}
                      className="rounded-full bg-danger/10 text-danger px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`moveout-${t.name}`}
                    >
                      <LogOut size={12} /> Check-out
                    </button>
                  )}
                </div>
              )}
              {t.status === "former" && t.deposit_settlement && (
                <div className="border-t border-line px-4 py-2.5 text-[11px] text-subtle">
                  Refund deposit: <span className="font-semibold text-primary tnum">{fmtIDR(t.deposit_settlement.refund)}</span>
                  {t.deposit_settlement.total_deduction > 0 && ` (potongan ${fmtIDR(t.deposit_settlement.total_deduction)})`}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit sheet */}
      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Penghuni" : "Penghuni Baru (KYC)"}>
        <form onSubmit={submit}>
          <Input label="Nama Lengkap" testid="input-tenant-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nomor HP (WhatsApp)" testid="input-tenant-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input label="NIK / Paspor" testid="input-tenant-nik" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" testid="input-tenant-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Pekerjaan" testid="input-tenant-occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-2 mt-1">Kontak Darurat</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nama" testid="input-emergency-name" value={form.emergency_name} onChange={(e) => setForm({ ...form, emergency_name: e.target.value })} />
            <Input label="Hubungan" testid="input-emergency-relation" value={form.emergency_relation} onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })} placeholder="Ibu / Ayah" />
          </div>
          <Input label="No. HP Darurat" testid="input-emergency-phone" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-2 mt-1">Kontrak Sewa</p>
          <Select label="Kamar" testid="input-tenant-room" value={form.room_id} onChange={(e) => onRoomChange(e.target.value)}>
            <option value="">-- Belum ditentukan --</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {fmtIDR(r.price)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mulai Sewa" testid="input-tenant-lease-start" type="date" value={form.lease_start} onChange={(e) => setForm({ ...form, lease_start: e.target.value })} />
            <Input label="Akhir Sewa" testid="input-tenant-lease-end" type="date" value={form.lease_end} onChange={(e) => setForm({ ...form, lease_end: e.target.value })} />
          </div>
          <MoneyInput label="Sewa / Bulan" testid="input-tenant-rent" value={form.monthly_rent} onChange={(v) => setForm({ ...form, monthly_rent: v })} />
          <MoneyInput label="Deposit" testid="input-tenant-deposit" value={form.deposit} onChange={(v) => setForm({ ...form, deposit: v })} />
          <Input label="URL Foto" testid="input-tenant-avatar" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          <Textarea label="Catatan" testid="input-tenant-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button testid="submit-tenant" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Daftarkan Penghuni"}
          </Button>
        </form>
      </Sheet>

      {/* Move-out sheet */}
      <Sheet open={!!moveOutTarget} onClose={() => setMoveOutTarget(null)} title={`Check-out ${moveOutTarget?.name || ""}`}>
        <p className="text-xs text-subtle mb-4">
          Kamar akan berstatus <b>Dibersihkan</b>, PIN akses dicabut, dan deposit diselesaikan.
        </p>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">Potongan Deposit</p>
          <button
            onClick={() => setDeductions([...deductions, { label: "", amount: 0 }])}
            className="rounded-full bg-primary/5 text-primary px-3 py-1 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
            data-testid="add-deduction-btn"
          >
            <Plus size={11} /> Tambah
          </button>
        </div>
        {deductions.map((d, i) => (
          <div key={i} className="flex gap-2 items-start mb-1">
            <div className="flex-1">
              <Input
                testid={`deduction-label-${i}`}
                placeholder="Kerusakan / Tunggakan"
                value={d.label}
                onChange={(e) => setDeductions(deductions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
            </div>
            <div className="w-36">
              <MoneyInput
                testid={`deduction-amount-${i}`}
                value={d.amount}
                onChange={(v) => setDeductions(deductions.map((x, j) => (j === i ? { ...x, amount: v } : x)))}
              />
            </div>
            <button
              onClick={() => setDeductions(deductions.filter((_, j) => j !== i))}
              className="w-8 h-8 mt-2 rounded-full text-subtle hover:text-danger grid place-items-center"
              data-testid={`remove-deduction-${i}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <div className="rounded-2xl bg-primary text-white p-4 mb-4 mt-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>Deposit</span>
            <span className="tnum">{fmtIDR(moveOutTarget?.deposit || 0)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>Total Potongan</span>
            <span className="tnum">- {fmtIDR(totalDeduction)}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-white/20">
            <span className="text-[10px] uppercase tracking-widest text-secondary">Refund</span>
            <span className="font-serif text-xl tnum" data-testid="refund-preview">{fmtIDR(refundPreview)}</span>
          </div>
        </div>
        <Button testid="confirm-moveout-btn" variant="danger" className="w-full" onClick={confirmMoveOut}>
          Konfirmasi Check-out
        </Button>
      </Sheet>
    </div>
  );
}
