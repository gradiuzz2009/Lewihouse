import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, EmptyState } from "../components/ui";
import { KeyRound, ShieldOff, Eye, EyeOff } from "lucide-react";

const empty = {
  label: "",
  token_type: "permanent",
  tenant_id: "",
  room_id: "",
  valid_from: "",
  valid_until: "",
};

const typeMap = {
  permanent: { label: "Permanen", tone: "primary" },
  guest: { label: "Tamu", tone: "warning" },
  vendor: { label: "Vendor", tone: "muted" },
};
const statusMap = {
  active: { label: "Aktif", tone: "success" },
  revoked: { label: "Dicabut", tone: "danger" },
  expired: { label: "Kedaluwarsa", tone: "muted" },
};

export default function Access() {
  const [tokens, setTokens] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [form, setForm] = useState(empty);
  const [visible, setVisible] = useState({});
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [tk, t, r] = await Promise.all([api.get("/access-tokens"), api.get("/tenants"), api.get("/rooms")]);
      setTokens(tk.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat token akses");
    }
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") {
      setForm(empty);
      setOpenSheet(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || null;
  const tenantName = (id) => tenants.find((t) => t.id === id)?.name || null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/access-tokens", {
        ...form,
        tenant_id: form.tenant_id || null,
        room_id: form.room_id || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      });
      toast.success(`Token diterbitkan — PIN ${data.pin}`);
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menerbitkan token");
    }
  };

  const revoke = async (tk) => {
    if (!window.confirm(`Cabut akses "${tk.label}"? Pintu tidak bisa dibuka lagi dengan PIN ini.`)) return;
    try {
      await api.post(`/access-tokens/${tk.id}/revoke`);
      toast.success("Token dicabut");
      load();
    } catch {
      toast.error("Gagal mencabut token");
    }
  };

  return (
    <div className="fade-up" data-testid="access-page">
      <PageHeader
        title="Akses & PIN"
        subtitle={`${tokens.filter((t) => t.status === "active").length} token aktif`}
        action={<AddButton onClick={() => { setForm(empty); setOpenSheet(true); }} testid="add-token-btn" />}
      />

      <div className="px-6 mt-2 flex flex-col gap-3 pb-6">
        {tokens.length === 0 && (
          <EmptyState
            icon={KeyRound}
            title="Belum ada token"
            subtitle="Terbitkan PIN pintu untuk penghuni, tamu, atau vendor."
            action={<Button onClick={() => setOpenSheet(true)} testid="empty-add-token">Terbitkan Token</Button>}
            testid="tokens-empty"
          />
        )}
        {tokens.map((tk, i) => {
          const ty = typeMap[tk.token_type] || typeMap.permanent;
          const st = statusMap[tk.status] || statusMap.active;
          const shown = visible[tk.id];
          return (
            <motion.div
              key={tk.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-line shadow-soft p-4"
              data-testid={`token-card-${tk.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-base text-primary leading-tight truncate">{tk.label}</p>
                  <p className="text-[11px] text-subtle mt-0.5">
                    {[tenantName(tk.tenant_id), roomName(tk.room_id)].filter(Boolean).join(" · ") || "Umum"}
                  </p>
                  {(tk.valid_from || tk.valid_until) && (
                    <p className="text-[10px] text-subtle mt-0.5">
                      {fmtDate(tk.valid_from)} — {fmtDate(tk.valid_until)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={st.tone} testid={`token-status-${tk.id}`}>{st.label}</Badge>
                  <Badge tone={ty.tone}>{ty.label}</Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setVisible({ ...visible, [tk.id]: !shown })}
                  className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2 active:scale-95"
                  data-testid={`token-pin-toggle-${tk.id}`}
                >
                  <span className="font-mono text-lg tracking-[0.3em] text-primary tnum">
                    {shown ? tk.pin : "••••••"}
                  </span>
                  {shown ? <EyeOff size={14} className="text-subtle" /> : <Eye size={14} className="text-subtle" />}
                </button>
                {tk.status === "active" && (
                  <button
                    onClick={() => revoke(tk)}
                    className="rounded-full bg-danger/10 text-danger px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                    data-testid={`token-revoke-${tk.id}`}
                  >
                    <ShieldOff size={12} /> Cabut
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title="Terbitkan Token Akses">
        <form onSubmit={submit}>
          <Input label="Label" testid="input-token-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required placeholder="Tamu Bpk. Andi / Vendor AC" />
          <Select label="Tipe" testid="input-token-type" value={form.token_type} onChange={(e) => setForm({ ...form, token_type: e.target.value })}>
            <option value="permanent">Permanen (Penghuni)</option>
            <option value="guest">Tamu</option>
            <option value="vendor">Vendor</option>
          </Select>
          <Select label="Penghuni (opsional)" testid="input-token-tenant" value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
            <option value="">-- Tidak terkait --</option>
            {tenants.filter((t) => t.status !== "former").map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Select label="Kamar (opsional)" testid="input-token-room" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
            <option value="">-- Pintu utama --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berlaku Dari" testid="input-token-from" type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
            <Input label="Sampai" testid="input-token-until" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
          </div>
          <p className="text-[11px] text-subtle mb-4">PIN 6 digit acak akan dibuat otomatis oleh sistem.</p>
          <Button testid="submit-token" className="w-full" type="submit">
            Terbitkan PIN
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
