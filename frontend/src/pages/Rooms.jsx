import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState } from "../components/ui";
import { DoorOpen, Trash2, CheckCircle2, UserCheck, Wrench, Sparkles, ShieldAlert } from "lucide-react";

const empty = {
  name: "",
  floor: "1",
  wing: "",
  room_type: "standard",
  capacity: 1,
  price: 1500000,
  deposit: 0,
  status: "available",
  facilities: "",
  photo_url: "",
  notes: "",
};

export const roomStatusMap = {
  available: { label: "Tersedia", tone: "success", icon: CheckCircle2 },
  reserved: { label: "Dipesan", tone: "warning", icon: ShieldAlert },
  occupied: { label: "Terisi", tone: "primary", icon: UserCheck },
  cleaning: { label: "Dibersihkan", tone: "muted", icon: Sparkles },
  maintenance: { label: "Perbaikan", tone: "danger", icon: Wrench },
};

const typeLabels = { standard: "Standard", deluxe: "Deluxe", vip: "VIP", studio: "Studio" };

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      const { data } = await api.get("/rooms");
      setRooms(data);
    } catch {
      toast.error("Gagal memuat kamar");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpenSheet(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ ...r, wing: r.wing || "", facilities: (r.facilities || []).join(", ") });
    setOpenSheet(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      deposit: Number(form.deposit),
      capacity: Number(form.capacity) || 1,
      facilities: form.facilities ? form.facilities.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing) {
        await api.put(`/rooms/${editing.id}`, payload);
        toast.success("Kamar diperbarui");
      } else {
        await api.post("/rooms", payload);
        toast.success("Kamar ditambahkan");
      }
      setOpenSheet(false);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal menyimpan");
    }
  };

  const transition = async (id, status, label) => {
    try {
      await api.post(`/rooms/${id}/status`, { status });
      toast.success(label);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Transisi gagal");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus kamar ini?")) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success("Kamar dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const filtered = filter === "all" ? rooms : rooms.filter((r) => r.status === filter);

  return (
    <div className="fade-up" data-testid="rooms-page">
      <PageHeader
        title="Kamar"
        subtitle={`${rooms.length} kamar terdaftar`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-room-btn" />}
      />

      <div className="px-6 flex gap-2 overflow-x-auto pb-2" data-testid="room-filters">
        {[{ k: "all", l: "Semua" }, ...Object.entries(roomStatusMap).map(([k, v]) => ({ k, l: v.label }))].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            data-testid={`filter-${f.k}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors active:scale-95 ${
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
            icon={DoorOpen}
            title="Belum ada kamar"
            subtitle="Tambahkan kamar pertama untuk mulai mengelola properti Anda."
            action={<Button onClick={openNew} testid="empty-add-room">Tambah Kamar</Button>}
            testid="rooms-empty"
          />
        )}
        {filtered.map((r, i) => {
          const s = roomStatusMap[r.status] || roomStatusMap.available;
          const SIcon = s.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden active:scale-[0.99] transition-transform"
              onClick={() => openEdit(r)}
              data-testid={`room-card-${r.name}`}
            >
              <div className="flex">
                <div className="w-24 shrink-0 bg-muted">
                  {r.photo_url ? (
                    <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <DoorOpen size={24} className="text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-xl text-primary leading-none">{r.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-subtle mt-1">
                        Lantai {r.floor}{r.wing ? ` · Sayap ${r.wing}` : ""} · {typeLabels[r.room_type] || r.room_type}
                      </p>
                    </div>
                    <span className="flex items-center gap-1">
                      <SIcon size={13} className={s.tone === "danger" ? "text-danger" : s.tone === "success" ? "text-success" : "text-primary"} />
                      <Badge tone={s.tone} testid={`badge-${r.name}`}>{s.label}</Badge>
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <p className="text-sm font-semibold text-ink tnum">
                      {fmtIDR(r.price)}<span className="text-[10px] text-subtle font-normal">/bulan</span>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(r.id);
                      }}
                      className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center"
                      data-testid={`delete-room-${r.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {(r.status === "cleaning" || r.status === "maintenance" || r.status === "reserved") && (
                <div className="border-t border-line px-4 py-2.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {r.status === "cleaning" && (
                    <button
                      onClick={() => transition(r.id, "available", "Kamar siap dihuni")}
                      className="rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`room-ready-${r.name}`}
                    >
                      <CheckCircle2 size={12} /> Selesai Bersih
                    </button>
                  )}
                  {r.status === "maintenance" && (
                    <button
                      onClick={() => transition(r.id, "cleaning", "Perbaikan selesai, lanjut pembersihan")}
                      className="rounded-full bg-primary/5 text-primary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`room-fixed-${r.name}`}
                    >
                      <Sparkles size={12} /> Selesai Perbaikan
                    </button>
                  )}
                  {r.status === "reserved" && (
                    <button
                      onClick={() => transition(r.id, "available", "Reservasi dibatalkan")}
                      className="rounded-full bg-muted text-subtle px-3 py-1.5 text-[11px] font-semibold active:scale-95"
                      data-testid={`room-cancel-${r.name}`}
                    >
                      Batalkan Reservasi
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? "Edit Kamar" : "Kamar Baru"}>
        <form onSubmit={submit}>
          <Input
            label="Nama / Nomor Kamar"
            testid="input-room-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="K-101"
          />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Lantai" testid="input-room-floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            <Input label="Sayap" testid="input-room-wing" value={form.wing} onChange={(e) => setForm({ ...form, wing: e.target.value })} placeholder="A" />
            <Input label="Kapasitas" testid="input-room-capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipe" testid="input-room-type" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="vip">VIP</option>
              <option value="studio">Studio</option>
            </Select>
            <Select label="Status" testid="input-room-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(roomStatusMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
          </div>
          <MoneyInput label="Harga / Bulan" testid="input-room-price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
          <MoneyInput label="Deposit" testid="input-room-deposit" value={form.deposit} onChange={(v) => setForm({ ...form, deposit: v })} />
          <Input
            label="Fasilitas (pisahkan dengan koma)"
            testid="input-room-facilities"
            value={form.facilities}
            onChange={(e) => setForm({ ...form, facilities: e.target.value })}
            placeholder="AC, WiFi, Kamar Mandi Dalam"
          />
          <Input label="URL Foto" testid="input-room-photo" value={form.photo_url || ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
          <Textarea label="Catatan" testid="input-room-notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button testid="submit-room" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Tambah Kamar"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
