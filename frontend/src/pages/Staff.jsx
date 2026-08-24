import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, fmtDateTime } from "../lib/api";
import { useLang } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
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
  CheckCircle2,
  XCircle,
  Database,
  ArrowLeft,
  Copy,
  Lock,
  Search,
} from "lucide-react";
import { toast } from "sonner";

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

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [pwModalStaff, setPwModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");

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
      setStaffList(staffRes.data || []);
      setSyncStatus(syncRes.data || null);
    } catch (e) {
      if (e.response?.status !== 401) toast.error(t("common.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Nama, Email, dan Password wajib diisi");
      return;
    }
    try {
      await api.post("/staff", formData);
      toast.success("Staff baru berhasil didaftarkan");
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "", role: "staff", password: "", notes: "" });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menambah staff");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
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
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await api.put(`/staff/${member.id}`, { is_active: !member.is_active });
      toast.success(`Akun ${member.name} ${!member.is_active ? "diaktifkan" : "dinonaktifkan"}`);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengubah status");
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
    try {
      await api.post(`/staff/${pwModalStaff.id}/reset-password`, { password: newPassword });
      toast.success(`Password untuk ${pwModalStaff.name} berhasil direset`);
      setPwModalStaff(null);
      setNewPassword("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal reset password");
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
    <div className="fade-up max-w-xl mx-auto pb-24" data-testid="staff-page">
      <PageHeader
        title={t("staff.title")}
        subtitle={t("staff.subtitle")}
        action={
          <button
            onClick={() => nav("/")}
            className="w-10 h-10 rounded-full bg-surface border border-line grid place-items-center active:scale-95 shadow-soft"
          >
            <ArrowLeft size={18} className="text-ink" />
          </button>
        }
      />

      <div className="px-5 space-y-5">
        {/* Firestore Sync Bridge Card */}
        <motion.div
          whileHover={{ y: -1 }}
          className="bg-gradient-to-br from-surface to-bg rounded-2xl p-4 border border-line shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm text-primary font-bold">{t("sync.title")}</h3>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {t("sync.connected")}
                  </span>
                </div>
                <p className="text-[11px] text-subtle mt-0.5">
                  {syncStatus?.last_sync_at
                    ? `${t("sync.lastSync")}: ${fmtDateTime(syncStatus.last_sync_at)}`
                    : t("sync.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft active:scale-95 disabled:opacity-50"
              data-testid="sync-btn"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              <span>{syncing ? t("sync.syncing") : t("sync.now")}</span>
            </button>
          </div>

          {syncStatus?.stats && (
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-line/60 text-center">
              <div className="bg-surface/80 rounded-lg p-1.5 border border-line/40">
                <p className="text-[9px] uppercase tracking-wider text-subtle">Kamar</p>
                <p className="font-bold text-xs text-primary">{syncStatus.stats.rooms || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-lg p-1.5 border border-line/40">
                <p className="text-[9px] uppercase tracking-wider text-subtle">Penghuni</p>
                <p className="font-bold text-xs text-primary">{syncStatus.stats.tenants || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-lg p-1.5 border border-line/40">
                <p className="text-[9px] uppercase tracking-wider text-subtle">Tagihan</p>
                <p className="font-bold text-xs text-primary">{syncStatus.stats.bills || 0}</p>
              </div>
              <div className="bg-surface/80 rounded-lg p-1.5 border border-line/40">
                <p className="text-[9px] uppercase tracking-wider text-subtle">Tiket</p>
                <p className="font-bold text-xs text-primary">{syncStatus.stats.complaints || 0}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Staff Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle">Total Staff</p>
            <p className="font-serif text-2xl text-primary font-bold mt-1">{staffList.length}</p>
          </div>
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle">Owner / Admin</p>
            <p className="font-serif text-2xl text-amber-600 font-bold mt-1">
              {staffList.filter((s) => s.role === "owner" || s.role === "admin").length}
            </p>
          </div>
          <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-subtle">Staff Lapangan</p>
            <p className="font-serif text-2xl text-blue-600 font-bold mt-1">
              {staffList.filter((s) => s.role === "staff").length}
            </p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl border border-line text-xs text-ink focus:outline-none focus:border-primary"
            />
          </div>
          <button
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft active:scale-95"
            data-testid="add-staff-btn"
          >
            <UserPlus size={14} />
            <span>{t("staff.addStaff")}</span>
          </button>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {["all", "owner", "admin", "staff"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition ${
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
          <div className="bg-surface rounded-2xl p-8 border border-line text-center">
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
                      : "border-line shadow-soft"
                  }`}
                  data-testid={`staff-card-${member.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center font-serif text-lg font-bold text-primary">
                        {member.name ? member.name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink">{member.name}</h4>
                          {isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.bg}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          {member.is_active === false ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-semibold">
                              {t("staff.suspended")}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                              {t("staff.active")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setPwModalStaff(member);
                          setNewPassword(generateRandomPassword());
                        }}
                        title={t("staff.resetPw")}
                        className="w-8 h-8 rounded-lg bg-bg border border-line grid place-items-center text-subtle hover:text-primary active:scale-95"
                        data-testid={`reset-pw-${member.id}`}
                      >
                        <KeyRound size={13} />
                      </button>
                      <button
                        onClick={() => setEditingStaff({ ...member })}
                        title={t("staff.editStaff")}
                        className="w-8 h-8 rounded-lg bg-bg border border-line grid place-items-center text-subtle hover:text-primary active:scale-95"
                        data-testid={`edit-staff-${member.id}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      {!isOwner && user?.role === "owner" && (
                        <button
                          onClick={() => handleDelete(member)}
                          title={t("staff.revoke")}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 grid place-items-center text-rose-600 active:scale-95"
                          data-testid={`delete-staff-${member.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info & Notes */}
                  <div className="mt-3 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between text-xs text-subtle gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-subtle" />
                        <span className="text-ink">{member.email}</span>
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-subtle" />
                          <span className="text-ink">{member.phone}</span>
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

      {/* MODAL: Add Staff Member */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 border border-line shadow-lifted space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-primary font-bold">{t("staff.addStaff")}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-bg grid place-items-center text-subtle"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.name")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.email")} *</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@lewihouse.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.phone")}</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.role")} *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="staff">{t("staff.roleStaff")}</option>
                    <option value="admin">{t("staff.roleAdmin")}</option>
                    <option value="owner">{t("staff.roleOwner")}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-ink">{t("staff.password")} *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                      className="text-[10px] text-primary font-semibold underline"
                    >
                      {t("staff.genPassword")}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line font-mono text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("common.notes")}</label>
                  <textarea
                    rows={2}
                    placeholder="Tugas / catatan penugasan staff..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-line text-subtle font-semibold"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-soft"
                  >
                    {t("staff.addStaff")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Edit Staff Member */}
      <AnimatePresence>
        {editingStaff && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 border border-line shadow-lifted space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-primary font-bold">{t("staff.editStaff")}</h3>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="w-8 h-8 rounded-full bg-bg grid place-items-center text-subtle"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.name")} *</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.email")} *</label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.phone")}</label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("staff.role")}</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="staff">{t("staff.roleStaff")}</option>
                    <option value="admin">{t("staff.roleAdmin")}</option>
                    <option value="owner">{t("staff.roleOwner")}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-line">
                  <span className="font-semibold text-ink">{t("staff.status")}</span>
                  <button
                    type="button"
                    onClick={() => setEditingStaff({ ...editingStaff, is_active: !editingStaff.is_active })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      editingStaff.is_active !== false
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {editingStaff.is_active !== false ? t("staff.active") : t("staff.suspended")}
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">{t("common.notes")}</label>
                  <textarea
                    rows={2}
                    value={editingStaff.notes || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, notes: e.target.value })}
                    className="w-full p-2.5 bg-bg rounded-xl border border-line text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="flex-1 py-2.5 rounded-xl border border-line text-subtle font-semibold"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-soft"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Reset Password */}
      <AnimatePresence>
        {pwModalStaff && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-surface rounded-3xl p-6 border border-line shadow-lifted space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 grid place-items-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-base text-primary font-bold">{t("staff.resetPw")}</h3>
                  <p className="text-xs text-subtle">{pwModalStaff.name}</p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-ink">Password Baru</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-[10px] text-primary font-semibold underline"
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
                      className="w-full p-2.5 bg-bg rounded-xl border border-line font-mono text-ink focus:outline-none focus:border-primary pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newPassword);
                        toast.success("Password disalin ke clipboard");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPwModalStaff(null)}
                    className="flex-1 py-2.5 rounded-xl border border-line text-subtle font-semibold"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-soft"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
