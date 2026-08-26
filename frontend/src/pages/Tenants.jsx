import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState, FormSection } from "../components/ui";
import { Users, Phone, LogIn, LogOut, Trash2, Edit2, KeyRound, Copy, Check, Eye, EyeOff, RotateCcw, Share2, Send } from "lucide-react";

const emptyForm = {
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
  active: { label: "Aktif", tone: "success" },
  pending_assignment: { label: "Menunggu Kamar / Check-in", tone: "warning" },
  former: { label: "Selesai Sewa", tone: "muted" },
};

function toWaClean(p) {
  const digits = (p || "").replace(/\D/g, "");
  if (digits.startsWith("08")) return "628" + digits.slice(2);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [moveOutTarget, setMoveOutTarget] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [t, r] = await Promise.all([api.get("/tenants"), api.get("/rooms")]);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat data penghuni");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(emptyForm);
      setOpenSheet(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenSheet(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      phone: t.phone,
      nik: t.nik || "",
      email: t.email || "",
      occupation: t.occupation || "",
      emergency_name: t.emergency_name || "",
      emergency_relation: t.emergency_relation || "",
      emergency_phone: t.emergency_phone || "",
      room_id: t.room_id || "",
      lease_start: t.lease_start || "",
      lease_end: t.lease_end || "",
      monthly_rent: t.monthly_rent || 0,
      deposit: t.deposit || 0,
      avatar_url: t.avatar_url || "",
      notes: t.notes || "",
    });
    setOpenSheet(true);
  };

  const onRoomChange = (rid) => {
    const r = rooms.find((x) => x.id === rid);
    setForm({
      ...form,
      room_id: rid,
      monthly_rent: r ? r.price : form.monthly_rent,
      deposit: r ? r.deposit : form.deposit,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      room_id: form.room_id || null,
      monthly_rent: Number(form.monthly_rent),
      deposit: Number(form.deposit),
    };
    try {
      if (editing) {
        await api.put(`/tenants/${editing.id}`, payload);
        toast.success("Data penghuni diperbarui");
      } else {
        const { data } = await api.post("/tenants", payload);
        toast.success(`Penghuni ${data.name} terdaftar ✓ Password portal: ${data.portal_password || "lewi" + (data.phone?.slice(-4) || "")}`);
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (tenant) => {
    if (!window.confirm(`Reset password portal aplikasi untuk ${tenant.name}?`)) return;
    try {
      const { data } = await api.post(`/tenants/${tenant.id}/reset-portal-password`);
      toast.success(`Password baru ${tenant.name}: ${data.portal_password}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mereset password");
    }
  };

  const copyCredentials = (tenant) => {
    const text = `Kredensial Portal Lewi House:\nNama: ${tenant.name}\nNo. HP / ID: ${tenant.phone || tenant.email}\nPassword: ${tenant.portal_password || "lewi" + (tenant.phone?.replace(/\D/g, "").slice(-4) || "")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(tenant.id);
    toast.success("Kredensial login disalin ke clipboard");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const shareViaWhatsApp = (tenant) => {
    const waPhone = toWaClean(tenant.phone);
    if (!waPhone) {
      toast.error("Nomor HP belum valid");
      return;
    }
    const pw = tenant.portal_password || "lewi" + (tenant.phone?.replace(/\D/g, "").slice(-4) || "");
    const rName = roomName(tenant.room_id);
    const msg = `*AKUN PORTAL PENGHUNI — LEWI HOUSE*

Halo Kak *${tenant.name}*,
Selamat bergabung di Lewi House! Berikut adalah akun aplikasi portal penghuni Anda untuk cek tagihan, bayar lewat QRIS, dan ajukan tiket perbaikan:

🏠 *Kamar:* ${rName}
📱 *Username / No. HP:* \`${tenant.phone}\`
🔑 *Password Aplikasi:* \`${pw}\`

Silakan login di portal web: ${window.location.origin}/login

Simpan pesan ini dengan baik. Jika ada kendala, hubungi pengelola. Terima kasih! 🙏`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const moveIn = async (t) => {
    try {
      const { data } = await api.post(`/tenants/${t.id}/move-in`);
      toast.success(`Check-in selesai — PIN Akses Kamar & Password Aplikasi Aktif`);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal move-in");
    }
  };

  const openMoveOut = (t) => {
    setMoveOutTarget(t);
    setDeductions([]);
  };

  const addDeduction = () => setDeductions([...deductions, { reason: "", amount: 0 }]);
  const updateDeduction = (i, field, val) => {
    const copy = [...deductions];
    copy[i][field] = val;
    setDeductions(copy);
  };
  const removeDeduction = (i) => setDeductions(deductions.filter((_, idx) => idx !== i));

  const submitMoveOut = async () => {
    setSubmitting(true);
    try {
      await api.post(`/tenants/${moveOutTarget.id}/move-out`, {
        deductions: deductions.map((d) => ({ reason: d.reason, amount: Number(d.amount) })),
      });
      toast.success("Check-out selesai");
      setMoveOutTarget(null);
      load();
    } catch {
      toast.error("Gagal move-out");
    } finally {
      setSubmitting(false);
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
        subtitle={`${tenants.filter((t) => t.status !== "former").length} penghuni terdaftar aktif`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-tenant-btn" label="Daftar KYC" />}
      />

      <div className="px-5 sm:px-6 mt-2 flex flex-col gap-3.5 pb-6">
        {tenants.length === 0 && (
          <EmptyState
            icon={Users}
            title="Belum ada penghuni"
            subtitle="Daftarkan penghuni pertama untuk mulai mengelola kontrak, tagihan, dan akses kunci."
            action={<Button onClick={openNew} testid="empty-add-tenant">Tambah Penghuni</Button>}
            testid="tenants-empty"
          />
        )}
        {tenants.map((t, i) => {
          const st = statusMap[t.status] || statusMap.active;
          const pw = t.portal_password || "lewi" + (t.phone?.replace(/\D/g, "").slice(-4) || "2026");
          const isPwShown = showPassword[t.id];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
              className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden transition-all hover:border-primary/30"
              data-testid={`tenant-card-${t.name}`}
            >
              <div className="p-4 flex gap-3.5 items-start">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 shrink-0 overflow-hidden grid place-items-center border border-primary/20">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="font-serif text-2xl text-primary font-bold">{t.name?.[0]?.toUpperCase() || "P"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg text-primary leading-tight truncate font-bold">{t.name}</p>
                    <Badge tone={st.tone} testid={`tenant-status-${t.name}`}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-subtle mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono"><Phone size={12} className="text-subtle" /> {t.phone}</span>
                    {t.occupation && <span className="truncate">· {t.occupation}</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                      Kamar {roomName(t.room_id)}
                    </span>
                    <span className="text-[10px] text-ink font-semibold tnum">{fmtIDR(t.monthly_rent)}/bln</span>
                    {t.lease_end && <span className="text-[10px] text-subtle">s/d {fmtDate(t.lease_end)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="w-9 h-9 rounded-full text-subtle hover:text-primary hover:bg-primary/5 grid place-items-center active:scale-95 transition-all"
                    title="Edit Profil"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="w-9 h-9 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center active:scale-95 transition-all"
                    data-testid={`delete-tenant-${t.name}`}
                    title="Hapus Data"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Password Portal & App Credentials Box */}
              {t.status !== "former" && (
                <div className="mx-4 mb-3 p-3 bg-muted/50 rounded-xl border border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-subtle">Password Portal Aplikasi</p>
                      <p className="font-mono text-xs font-bold text-primary mt-0.5 tracking-wider">
                        {isPwShown ? pw : "••••••••"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, [t.id]: !isPwShown })}
                      className="px-2.5 py-1.5 bg-white border border-line rounded-lg text-[11px] font-semibold text-ink flex items-center gap-1 hover:bg-muted active:scale-95 transition-all shadow-xs"
                      title={isPwShown ? "Sembunyikan" : "Tampilkan Password"}
                    >
                      {isPwShown ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{isPwShown ? "Tutup" : "Lihat"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyCredentials(t)}
                      className="px-2.5 py-1.5 bg-white border border-line rounded-lg text-[11px] font-semibold text-ink flex items-center gap-1 hover:bg-muted active:scale-95 transition-all shadow-xs"
                      title="Salin Kredensial"
                    >
                      {copiedId === t.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{copiedId === t.id ? "Tersalin" : "Salin"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetPassword(t)}
                      className="p-1.5 bg-white border border-line rounded-lg text-[11px] font-semibold text-ink hover:text-danger hover:bg-muted active:scale-95 transition-all shadow-xs"
                      title="Reset Password Acak"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shareViaWhatsApp(t)}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                      title="Kirim Info Akun via WhatsApp"
                    >
                      <Send size={12} />
                      <span>Kirim WA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status actions */}
              {t.status !== "former" && (
                <div className="border-t border-line px-4 py-2.5 flex items-center justify-between gap-2 bg-muted/20">
                  {t.status === "pending_assignment" && t.room_id && (
                    <button
                      type="button"
                      onClick={() => moveIn(t)}
                      className="rounded-full bg-success/10 hover:bg-success/20 text-success border border-success/20 px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 min-h-[36px]"
                      data-testid={`movein-${t.name}`}
                    >
                      <LogIn size={13} /> Check-in & Terbitkan PIN Akses
                    </button>
                  )}
                  {t.status === "active" && (
                    <button
                      type="button"
                      onClick={() => openMoveOut(t)}
                      className="rounded-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 min-h-[36px]"
                      data-testid={`moveout-${t.name}`}
                    >
                      <LogOut size={13} /> Check-out & Selesai Sewa
                    </button>
                  )}
                </div>
              )}
              {t.status === "former" && t.deposit_settlement && (
                <div className="border-t border-line px-4 py-2.5 text-[11px] text-subtle bg-muted/20">
                  Refund deposit: <span className="font-bold text-primary tnum">{fmtIDR(t.deposit_settlement.refund)}</span>
                  {t.deposit_settlement.total_deduction > 0 && ` (potongan ${fmtIDR(t.deposit_settlement.total_deduction)})`}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Adaptive Add/Edit KYC Sheet */}
      <Sheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title={editing ? `Edit Profil ${editing.name}` : "Pendaftaran Penghuni (KYC)"}
        subtitle={editing ? "Perbarui informasi penyewa dan status kontrak" : "Lengkapi profil calon penghuni (Password aplikasi otomatis dibuat)"}
        maxWidth="sm:max-w-xl"
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
              form="tenant-form"
              testid="submit-tenant"
              loading={submitting}
              className="flex-1"
            >
              {editing ? "Simpan Perubahan" : "Daftarkan Penghuni"}
            </Button>
          </>
        }
      >
        <form id="tenant-form" onSubmit={submit} className="space-y-1">
          <FormSection title="Data Pribadi Penghuni">
            <Input
              label="Nama Lengkap *"
              testid="input-tenant-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Contoh: Arya Wibowo"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor WhatsApp / HP *"
                testid="input-tenant-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="081234567890"
              />
              <Input
                label="Email (Opsional)"
                testid="input-tenant-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="arya@mail.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="NIK KTP (16 Digit)"
                testid="input-tenant-nik"
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                placeholder="3273010101900001"
              />
              <Input
                label="Pekerjaan / Instansi"
                testid="input-tenant-occ"
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                placeholder="Software Engineer / Mahasiswa"
              />
            </div>
            <p className="text-[11px] text-secondary font-semibold italic mt-1">
              ✨ Password portal penghuni akan otomatis dibuatkan dari nomor HP dan dapat dilihat langsung di profil.
            </p>
          </FormSection>

          <FormSection title="Kontak Darurat (Emergency Contact)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nama Kontak"
                value={form.emergency_name}
                onChange={(e) => setForm({ ...form, emergency_name: e.target.value })}
                placeholder="Dewi Wibowo"
              />
              <Input
                label="Hubungan"
                value={form.emergency_relation}
                onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })}
                placeholder="Ibu / Ayah / Saudara"
              />
              <Input
                label="No. HP Darurat"
                value={form.emergency_phone}
                onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                placeholder="081122334455"
              />
            </div>
          </FormSection>

          <FormSection title="Kontrak & Alokasi Kamar">
            <Select
              label="Pilih Kamar"
              testid="input-tenant-room"
              value={form.room_id}
              onChange={(e) => onRoomChange(e.target.value)}
            >
              <option value="">-- Belum ada kamar (Pending) --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.room_type} · {fmtIDR(r.price)}/bln (Lt. {r.floor})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Tanggal Mulai Sewa"
                testid="input-tenant-start"
                type="date"
                value={form.lease_start}
                onChange={(e) => setForm({ ...form, lease_start: e.target.value })}
              />
              <Input
                label="Tanggal Akhir Kontrak"
                testid="input-tenant-end"
                type="date"
                value={form.lease_end}
                onChange={(e) => setForm({ ...form, lease_end: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MoneyInput
                label="Harga Sewa Bulanan"
                testid="input-tenant-rent"
                value={form.monthly_rent}
                onChange={(val) => setForm({ ...form, monthly_rent: val })}
              />
              <MoneyInput
                label="Uang Jaminan (Deposit)"
                testid="input-tenant-deposit"
                value={form.deposit}
                onChange={(val) => setForm({ ...form, deposit: val })}
              />
            </div>

            <Textarea
              label="Catatan Khusus (Opsional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan kontrak..."
            />
          </FormSection>
        </form>
      </Sheet>

      {/* Dynamic Adaptive Move-out Sheet */}
      <Sheet
        open={!!moveOutTarget}
        onClose={() => setMoveOutTarget(null)}
        title={`Check-out: ${moveOutTarget?.name || ""}`}
        subtitle="Kalkulasi pengembalian uang jaminan (deposit)"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveOutTarget(null)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              loading={submitting}
              onClick={submitMoveOut}
              testid="submit-moveout"
              className="flex-1 bg-danger hover:bg-danger/90 text-white"
            >
              Konfirmasi Check-out
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-2xl border border-line">
            <div className="flex justify-between items-center text-xs">
              <span className="text-subtle font-medium">Uang Jaminan Tercatat:</span>
              <span className="font-bold text-primary tnum">{fmtIDR(moveOutTarget?.deposit || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-subtle font-medium">Total Potongan Biaya:</span>
              <span className="font-bold text-danger tnum">- {fmtIDR(totalDeduction)}</span>
            </div>
            <div className="border-t border-line/60 mt-3 pt-2.5 flex justify-between items-baseline">
              <span className="font-bold text-xs uppercase tracking-wider text-primary">Refund Bersih:</span>
              <span className="font-serif text-xl font-bold text-success tnum">{fmtIDR(refundPreview)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Potongan Kerusakan / Tagihan Tertunggak</p>
              <button
                type="button"
                onClick={addDeduction}
                className="text-xs font-bold text-secondary hover:underline"
              >
                + Tambah Potongan
              </button>
            </div>
            {deductions.length === 0 ? (
              <p className="text-xs text-subtle italic bg-muted/40 p-3 rounded-xl">
                Tidak ada potongan. Deposit dikembalikan 100%.
              </p>
            ) : (
              <div className="space-y-2">
                {deductions.map((d, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Alasan (contoh: Kunci hilang)"
                      value={d.reason}
                      onChange={(e) => updateDeduction(i, "reason", e.target.value)}
                      className="flex-1"
                    />
                    <MoneyInput
                      value={d.amount}
                      onChange={(val) => updateDeduction(i, "amount", val)}
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeDeduction(i)}
                      className="w-9 h-9 rounded-xl hover:bg-danger/10 text-danger grid place-items-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
