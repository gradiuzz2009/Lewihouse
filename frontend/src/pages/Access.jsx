import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtDate, formatTokenValidity } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, EmptyState, FormSection } from "../components/ui";
import { KeyRound, ShieldOff, Eye, EyeOff } from "lucide-react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

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
  const [submitting, setSubmitting] = useState(false);
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
  useAutoRefresh(load);

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
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
        subtitle={`${tokens.filter((t) => t.status === "active").length} token kunci digital aktif`}
        action={<AddButton onClick={() => { setForm(empty); setOpenSheet(true); }} testid="add-token-btn" label="Terbitkan Token" />}
      />

      <div className="px-5 sm:px-6 mt-2 flex flex-col gap-3.5 pb-6">
        {tokens.length === 0 && (
          <EmptyState
            icon={KeyRound}
            title="Belum ada token"
            subtitle="Terbitkan PIN akses pintu digital untuk penghuni, tamu kunjungan, atau vendor perbaikan."
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
              className="bg-surface rounded-2xl border border-line shadow-soft p-4 hover:border-primary/30 transition-all"
              data-testid={`token-card-${tk.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-base sm:text-lg text-primary leading-tight font-bold truncate">{tk.label}</p>
                  <p className="text-xs text-subtle mt-0.5">
                    {[tenantName(tk.tenant_id), roomName(tk.room_id) ? `Kamar ${roomName(tk.room_id)}` : null].filter(Boolean).join(" · ") || "Pintu Utama / Umum"}
                  </p>
                  <p className="text-[11px] text-subtle mt-1 font-mono">
                    {formatTokenValidity(tk.valid_from, tk.valid_until)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge tone={st.tone} testid={`token-status-${tk.id}`}>{st.label}</Badge>
                  <Badge tone={ty.tone}>{ty.label}</Badge>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setVisible({ ...visible, [tk.id]: !shown })}
                  className="flex items-center gap-2.5 bg-muted/80 hover:bg-muted rounded-xl px-4 py-2.5 active:scale-95 transition-colors border border-line/50 min-h-[44px]"
                  data-testid={`token-pin-toggle-${tk.id}`}
                  title="Lihat PIN"
                >
                  <span className="font-mono text-lg tracking-[0.25em] text-primary font-bold tnum">
                    {shown ? tk.pin : "••••••"}
                  </span>
                  {shown ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}
                </button>
                {tk.status === "active" && (
                  <button
                    type="button"
                    onClick={() => revoke(tk)}
                    className="rounded-full bg-danger/10 text-danger border border-danger/20 px-3.5 py-2 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 hover:bg-danger/20 transition-colors min-h-[40px]"
                    data-testid={`token-revoke-${tk.id}`}
                  >
                    <ShieldOff size={13} /> Cabut Akses
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Adaptive Issue Token Sheet */}
      <Sheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title="Terbitkan Token Akses Baru"
        subtitle="Buat PIN 6 digit acak untuk pintu kosan"
        maxWidth="sm:max-w-lg"
        footer={
          <>
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
              form="token-form"
              testid="submit-token"
              loading={submitting}
              className="flex-1"
            >
              Terbitkan PIN Akses
            </Button>
          </>
        }
      >
        <form id="token-form" onSubmit={submit} className="space-y-1">
          <FormSection title="Spesifikasi Akses">
            <Input
              label="Label Identifikasi"
              testid="input-token-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              placeholder="Contoh: Tamu Bpk. Andi / Teknisi AC Daikin"
            />
            <Select
              label="Tipe Akses"
              testid="input-token-type"
              value={form.token_type}
              onChange={(e) => setForm({ ...form, token_type: e.target.value })}
            >
              <option value="permanent">Permanen (Penghuni Tetap)</option>
              <option value="guest">Tamu (Sementara)</option>
              <option value="vendor">Vendor / Teknisi Kerja</option>
            </Select>
          </FormSection>

          <FormSection title="Kaitkan Penghuni / Kamar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Penghuni Terkait"
                testid="input-token-tenant"
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
              >
                <option value="">-- Umum / Tanpa Penghuni --</option>
                {tenants.filter((t) => t.status !== "former").map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              <Select
                label="Kamar / Pintu"
                testid="input-token-room"
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              >
                <option value="">-- Pintu Gerbang Utama --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.room_type})</option>
                ))}
              </Select>
            </div>
          </FormSection>

          <FormSection title="Masa Berlaku">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Berlaku Mulai Tanggal"
                testid="input-token-from"
                type="date"
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              />
              <Input
                label="Berlaku Sampai Tanggal"
                testid="input-token-until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>
            <p className="text-[11px] text-subtle mt-1 italic">
              * PIN 6 digit unik dibuat secara otomatis dan langsung aktif saat diterbitkan.
            </p>
          </FormSection>
        </form>
      </Sheet>
    </div>
  );
}
