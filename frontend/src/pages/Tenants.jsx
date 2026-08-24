import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Button, Input, Select, Sheet, Textarea, EmptyState } from "../components/ui";
import { Users, Phone, Trash2 } from "lucide-react";

const empty = {
  name: "",
  phone: "",
  id_number: "",
  email: "",
  room_id: "",
  check_in: "",
  check_out: "",
  monthly_rent: 0,
  deposit: 0,
  avatar_url: "",
  notes: "",
};

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

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

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpenSheet(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      ...t,
      room_id: t.room_id || "",
      id_number: t.id_number || "",
      email: t.email || "",
      avatar_url: t.avatar_url || "",
      notes: t.notes || "",
      check_in: t.check_in || "",
      check_out: t.check_out || "",
    });
    setOpenSheet(true);
  };

  const onRoomChange = (rid) => {
    const room = rooms.find((r) => r.id === rid);
    setForm({ ...form, room_id: rid, monthly_rent: room ? room.price : form.monthly_rent });
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
        toast.success("Penghuni ditambahkan");
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
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
    (r) => r.status !== "maintenance" && (!r.tenant_id || r.id === form.room_id || r.tenant_id === editing?.id)
  );

  return (
    <div className="fade-up" data-testid="tenants-page">
      <PageHeader
        title="Penghuni"
        subtitle={`${tenants.length} penghuni terdaftar`}
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
        {tenants.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-surface rounded-2xl border border-line shadow-soft p-4 flex gap-4 items-center active:scale-[0.99] transition-transform"
            onClick={() => openEdit(t)}
            data-testid={`tenant-card-${t.name}`}
          >
            <div className="w-14 h-14 rounded-full bg-muted shrink-0 overflow-hidden grid place-items-center">
              {t.avatar_url ? (
                <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-xl text-primary">{t.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg text-primary leading-tight truncate">{t.name}</p>
              <p className="text-xs text-subtle mt-0.5 flex items-center gap-1.5">
                <Phone size={11} /> {t.phone}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary rounded-full px-2 py-0.5">
                  {roomName(t.room_id)}
                </span>
                <span className="text-[10px] text-subtle tnum">{fmtIDR(t.monthly_rent)}/bln</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(t.id);
              }}
              className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center"
              data-testid={`delete-tenant-${t.name}`}
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </div>

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Penghuni" : "Penghuni Baru"}>
        <form onSubmit={submit}>
          <Input
            label="Nama Lengkap"
            testid="input-tenant-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor HP"
              testid="input-tenant-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <Input
              label="No. KTP"
              testid="input-tenant-ktp"
              value={form.id_number}
              onChange={(e) => setForm({ ...form, id_number: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            testid="input-tenant-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select
            label="Kamar"
            testid="input-tenant-room"
            value={form.room_id}
            onChange={(e) => onRoomChange(e.target.value)}
          >
            <option value="">-- Belum ditentukan --</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {fmtIDR(r.price)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Check-in"
              testid="input-tenant-checkin"
              type="date"
              value={form.check_in}
              onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            />
            <Input
              label="Check-out"
              testid="input-tenant-checkout"
              type="date"
              value={form.check_out}
              onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sewa / Bulan"
              testid="input-tenant-rent"
              type="number"
              value={form.monthly_rent}
              onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
            />
            <Input
              label="Deposit"
              testid="input-tenant-deposit"
              type="number"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
            />
          </div>
          <Input
            label="URL Foto"
            testid="input-tenant-avatar"
            value={form.avatar_url}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
          />
          <Textarea
            label="Catatan"
            testid="input-tenant-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button testid="submit-tenant" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Tambah Penghuni"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
