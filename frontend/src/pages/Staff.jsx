import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, fmtDateTime } from "../lib/api";
import { useLang } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Sheet, Button, Input, Select, Textarea, FormSection } from "../components/ui";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Wrench,
  KeyRound,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Database,
  ArrowLeft,
  Copy,
  Lock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export default function Staff() {
  const { t } = useLang();
  const { user } = useAuth();
  const nav = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Sheets
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [pwModalStaff, setPwModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
    password: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, syncRes] = await Promise.all([
        api.get("/staff"),
        api.get("/sync/status").catch(() => ({ data: { status: "connected", last_sync_at: null } })),
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      setSyncStatus(syncRes.data || null);
    } catch (e) {
      if (e.response?.status !== 401) toast.error(t("common.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(loadData);

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post("/sync/firestore-full");
      setSyncStatus({
        status: "connected",
        last_sync_at: res.data.last_sync_at,
        stats: res.data.stats,
      });
      toast.success(t("sync.success"));
    } catch (e) {
      toast.error("Gagal sinkronisasi dengan Cloud Firestore");
    } finally {
      setSyncing(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
    let pw = "";
    for (let i = 0; i < 10; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pw;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Nama, Email, dan Password wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/staff", formData);
      toast.success("Staff baru berhasil didaftarkan");
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "", role: "staff", password: "", notes: "" });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menambah staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSubmitting(true);
    try {
      await api.put(`/staff/${editingStaff.id}`, {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        is_active: editingStaff.is_active,
        notes: editingStaff.notes,
      });
      toast.success(t("common.updated"));
      setEditingStaff(null);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal update staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`${t("staff.revokeConfirm")} (${member.name})`)) return;
    try {
      await api.delete(`/staff/${member.id}`);
      toast.success(t("common.deleted"));
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mencabut akses staff");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!pwModalStaff || !newPassword) return;
    setSubmitting(true);
    try {
      await api.post(`/staff/${pwModalStaff.id}/reset-password`, { password: newPassword });
      toast.success(`Password untuk ${pwModalStaff.name} berhasil direset`);
      setPwModalStaff(null);
      setNewPassword("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search);
    const matchRole = filterRole === "all" || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return {
          label: t("staff.roleOwner"),
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          icon: <ShieldAlert size={12} className="text-amber-500" />,
        };
      case "admin":
        return {
          label: t("staff.roleAdmin"),
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          icon: <Shield size={12} className="text-emerald-500" />,
        };
      default:
        return {
          label: t("staff.roleStaff"),
          bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          icon: <Wrench size={12} className="text-blue-500" />,
        };
    }
  };

  return (
    <div className="fade-up pb-24" data-testid="staff-page">
      <PageHeader
        title={t("staff.title")}
        subtitle={t("staff.subtitle")}
        action={
          <button
            type="button"
            onClick={() => nav("/")}
            className="w-10 h-10 rounded-full bg-surface border border-line grid place-items-center active:scale-95 shadow-soft hover:bg-muted"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} className="text-ink" />
          </button>
        }
      />

      <div className="px-5 sm:px-6 space-y-4">
        {/* Firestore Sync Bridge Card */}
        <motion.div
          whileHover={{ y: -1 }}
          className="bg-gradient-to-br from-surface to-bg rounded-2xl p-4 sm:p-5 border border-line shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 grid place-items-center text-primary shrink-0">
                <Database size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm sm:text-base text-primary font-bold">{t("sync.title")}</h3>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {t("sync.connected")}
                  </span>
                </div>
                <p className="text-[11px] text-subtle mt-0.5 truncate">
                  {syncStatus?.last_sync_at
                    ? `${t("sync.lastSync")}: ${fmtDateTime(syncStatus.last_sync_at)}`
                    : t("sync.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={triggerSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-soft active:scale-95 disabled:opacity-50 hover:bg-[#122820] transition-colors shrink-0"
              data-testid="sync-btn"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              <span>{syncing ? t("sync.syncing") : t("sync.now")}</span>
            </button>
          </div>

          {syncStatus?.stats && (
            <div className="grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-line/60 text-center">
              <div className="bg-surface/80 rounded-xl p-2 border border-line/40 shadow-xs">
                <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold">Kamar</p>
                <p className="font-bold text-sm text-primary">{syncStatus.stats.rooms || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-xl p-2 border border-line/40 shadow-xs">
                <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold">Penghuni</p>
                <p className="font-bold text-sm text-primary">{syncStatus.stats.tenants || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-xl p-2 border border-line/40 shadow-xs">
                <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold">Tagihan</p>
                <p className="font-bold text-sm text-primary">{syncStatus.stats.bills || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-xl p-2 border border-line/40 shadow-xs">
                <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold">Tiket</p>
                <p className="font-bold text-sm text-primary">{syncStatus.stats.complaints || 0}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Staff Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle font-bold">Total Staff</p>
            <p className="font-serif text-2xl text-primary font-bold mt-1">{staffList.length}</p>
          </div>
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle font-bold">Owner / Admin</p>
            <p className="font-serif text-2xl text-amber-600 font-bold mt-1">
              {staffList.filter((s) => s.role === "owner" || s.role === "admin").length}
            </p>
          </div>
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle font-bold">Lapangan</p>
            <p className="font-serif text-2xl text-blue-600 font-bold mt-1">
              {staffList.filter((s) => s.role === "staff").length}
            </p>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari nama / email staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-surface rounded-xl border border-line text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                phone: "",
                role: "staff",
                password: generateRandomPassword(),
                notes: "",
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-soft active:scale-95 hover:bg-[#122820] transition-colors shrink-0"
            data-testid="add-staff-btn"
          >
            <UserPlus size={14} />
            <span>{t("staff.addStaff")}</span>
          </button>
        </div>

        {/* Role Filter Tabs */}
        <div className="chip-scroll-container pb-1 text-xs" data-testid="staff-role-filters">
          {["all", "owner", "admin", "staff"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-4 py-2 rounded-full capitalize font-bold transition min-h-[38px] active:scale-95 ${
                filterRole === r
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface text-subtle border border-line hover:text-ink"
              }`}
            >
              {r === "all" ? t("common.all") : r}
            </button>
          ))}
        </div>

        {/* Staff List Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface rounded-2xl p-4 border border-line animate-pulse h-28" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 border border-line text-center shadow-soft">
            <Users size={32} className="mx-auto text-subtle mb-2" />
            <p className="font-serif text-base text-primary font-bold">{t("staff.empty")}</p>
            <p className="text-xs text-subtle mt-1">Tambahkan akun staff untuk membantu pengelolaan Lewi House.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((member) => {
              const badge = getRoleBadge(member.role);
              const isCurrentUser = member.email === user?.email;
              const isOwner = member.role === "owner";

              return (
                <motion.div
                  key={member.id}
                  layout
                  className={`bg-surface rounded-2xl p-4 border transition ${
                    member.is_active === false
                      ? "border-dashed border-line opacity-60"
                      : "border-line shadow-soft hover:border-primary/30"
                  }`}
                  data-testid={`staff-card-${member.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center font-serif text-lg font-bold text-primary shrink-0 border border-primary/20">
                        {member.name ? member.name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                          {isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          {member.is_active === false ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                              {t("staff.suspended")}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                              {t("staff.active")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPwModalStaff(member);
                          setNewPassword(generateRandomPassword());
                        }}
                        title={t("staff.resetPw")}
                        className="w-8 h-8 rounded-full bg-muted/60 border border-line grid place-items-center text-subtle hover:text-primary hover:bg-primary/5 active:scale-95"
                        data-testid={`reset-pw-${member.id}`}
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStaff({ ...member })}
                        title={t("staff.editStaff")}
                        className="w-8 h-8 rounded-full bg-muted/60 border border-line grid place-items-center text-subtle hover:text-primary hover:bg-primary/5 active:scale-95"
                        data-testid={`edit-staff-${member.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      {!isOwner && user?.role === "owner" && (
                        <button
                          type="button"
                          onClick={() => handleDelete(member)}
                          title={t("staff.revoke")}
                          className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 grid place-items-center text-rose-600 active:scale-95"
                          data-testid={`delete-staff-${member.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info & Notes */}
                  <div className="mt-3 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between text-xs text-subtle gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-subtle" />
                        <span className="text-ink font-medium">{member.email}</span>
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-subtle" />
                          <span className="text-ink font-medium">{member.phone}</span>
                        </span>
                      )}
                    </div>
                    {member.notes && (
                      <p className="text-[11px] italic text-subtle truncate max-w-xs">{member.notes}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Adaptive Add Staff Sheet */}
      <Sheet
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("staff.addStaff")}
        subtitle="Daftarkan akun petugas operasional atau pengelola"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="add-staff-form"
              testid="submit-add-staff"
              loading={submitting}
              className="flex-1"
            >
              {t("staff.addStaff")}
            </Button>
          </>
        }
      >
        <form id="add-staff-form" onSubmit={handleCreate} className="space-y-1">
          <FormSection title="Profil Petugas">
            <Input
              label={`${t("staff.name")} *`}
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={`${t("staff.email")} *`}
                type="email"
                required
                placeholder="budi@lewihouse.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label={t("staff.phone")}
                type="tel"
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <Select
              label={`${t("staff.role")} *`}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="staff">{t("staff.roleStaff")} (Teknisi / Kebersihan)</option>
              <option value="admin">{t("staff.roleAdmin")} (Pengelola Kamar & Tagihan)</option>
              <option value="owner">{t("staff.roleOwner")} (Pemilik / Akses Penuh)</option>
            </Select>
          </FormSection>

          <FormSection title="Kredensial Masuk">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">{t("staff.password")} *</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                  className="text-[11px] text-primary font-bold underline"
                >
                  {t("staff.genPassword")}
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full min-h-[46px] bg-muted border border-transparent rounded-xl px-4 py-2.5 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
            </div>
            <Textarea
              label={t("common.notes")}
              rows={2}
              placeholder="Tugas atau catatan penugasan staff..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-3"
            />
          </FormSection>
        </form>
      </Sheet>

      {/* Dynamic Adaptive Edit Staff Sheet */}
      <Sheet
        open={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title={t("staff.editStaff")}
        subtitle={`Perbarui data akun ${editingStaff?.name || ""}`}
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingStaff(null)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="edit-staff-form"
              testid="submit-edit-staff"
              loading={submitting}
              className="flex-1"
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {editingStaff && (
          <form id="edit-staff-form" onSubmit={handleUpdate} className="space-y-1">
            <FormSection title="Data Akun">
              <Input
                label={`${t("staff.name")} *`}
                required
                value={editingStaff.name || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`${t("staff.email")} *`}
                  type="email"
                  required
                  value={editingStaff.email || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                />
                <Input
                  label={t("staff.phone")}
                  type="tel"
                  value={editingStaff.phone || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                />
              </div>
              <Select
                label={t("staff.role")}
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
              >
                <option value="staff">{t("staff.roleStaff")}</option>
                <option value="admin">{t("staff.roleAdmin")}</option>
                <option value="owner">{t("staff.roleOwner")}</option>
              </Select>
              <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl border border-line mt-2">
                <span className="font-bold text-xs text-ink">{t("staff.status")} Akun</span>
                <button
                  type="button"
                  onClick={() => setEditingStaff({ ...editingStaff, is_active: !editingStaff.is_active })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                    editingStaff.is_active !== false
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}
                >
                  {editingStaff.is_active !== false ? t("staff.active") : t("staff.suspended")}
                </button>
              </div>
              <Textarea
                label={t("common.notes")}
                rows={2}
                value={editingStaff.notes || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, notes: e.target.value })}
                className="mt-3"
              />
            </FormSection>
          </form>
        )}
      </Sheet>

      {/* Dynamic Adaptive Reset Password Sheet */}
      <Sheet
        open={!!pwModalStaff}
        onClose={() => setPwModalStaff(null)}
        title={t("staff.resetPw")}
        subtitle={`Reset kata sandi akun ${pwModalStaff?.name || ""}`}
        maxWidth="sm:max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPwModalStaff(null)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="reset-pw-form"
              testid="submit-reset-pw"
              loading={submitting}
              className="flex-1"
            >
              Reset Password
            </Button>
          </>
        }
      >
        {pwModalStaff && (
          <form id="reset-pw-form" onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 grid place-items-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-amber-800">{pwModalStaff.name}</p>
                <p className="text-[11px] text-amber-700">{pwModalStaff.email}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">Password Baru</span>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="text-[11px] text-primary font-bold underline"
                >
                  {t("staff.genPassword")}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-[46px] bg-muted border border-transparent rounded-xl px-4 pr-10 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    toast.success("Password disalin ke clipboard");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-primary p-1"
                  title="Salin password"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
