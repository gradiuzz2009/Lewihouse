import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, EmptyState } from "../components/ui";
import { DoorOpen, Trash2 } from "lucide-react";

const empty = {
  name: "",
  floor: "1",
  price: 1500000,
  status: "vacant",
  facilities: "",
  photo_url: "",
  notes: "",
};

const statusMap = {
  occupied: { label: "Terisi", tone: "success" },
  vacant: { label: "Kosong", tone: "warning" },
  maintenance: { label: "Perbaikan", tone: "danger" },
};

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
    setForm({ ...r, facilities: (r.facilities || []).join(", ") });
    setOpenSheet(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      facilities: form.facilities
        ? form.facilities.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
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
    } catch {
      toast.error("Gagal menyimpan");
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

      {/* Filter chips */}
      <div className="px-6 flex gap-2 overflow-x-auto pb-2" data-testid="room-filters">
        {[
          { k: "all", l: "Semua" },
          { k: "occupied", l: "Terisi" },
          { k: "vacant", l: "Kosong" },
          { k: "maintenance", l: "Perbaikan" },
        ].map((f) => (
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
          const s = statusMap[r.status] || statusMap.vacant;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden flex active:scale-[0.99] transition-transform"
              onClick={() => openEdit(r)}
              data-testid={`room-card-${r.name}`}
            >
              <div className="w-24 h-24 shrink-0 bg-muted">
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
                    <p className="text-[10px] uppercase tracking-widest text-subtle mt-1">Lantai {r.floor}</p>
                  </div>
                  <Badge tone={s.tone} testid={`badge-${r.name}`}>{s.label}</Badge>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <p className="text-sm font-semibold text-ink tnum">{fmtIDR(r.price)}<span className="text-[10px] text-subtle font-normal">/bulan</span></p>
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lantai"
              testid="input-room-floor"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
            <Input
              label="Harga / Bulan"
              testid="input-room-price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <Select
            label="Status"
            testid="input-room-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="vacant">Kosong</option>
            <option value="occupied">Terisi</option>
            <option value="maintenance">Perbaikan</option>
          </Select>
          <Input
            label="Fasilitas (pisahkan dengan koma)"
            testid="input-room-facilities"
            value={form.facilities}
            onChange={(e) => setForm({ ...form, facilities: e.target.value })}
            placeholder="AC, WiFi, Kamar Mandi Dalam"
          />
          <Input
            label="URL Foto"
            testid="input-room-photo"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            placeholder="https://..."
          />
          <Textarea
            label="Catatan"
            testid="input-room-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button testid="submit-room" className="w-full mt-2" type="submit">
            {editing ? "Simpan Perubahan" : "Tambah Kamar"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
