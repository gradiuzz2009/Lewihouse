import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Shield,
  Wrench,
  User,
  LogOut,
  ChevronDown,
  X,
  Sparkles,
  Check,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    fullLabel: "Pemilik (Owner)",
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    pillClass: "bg-amber-500 text-white",
    icon: ShieldCheck,
    description: "Akses penuh ke seluruh modul, keuangan & manajemen staff",
  },
  admin: {
    label: "Admin",
    fullLabel: "Pengelola (Admin)",
    badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    pillClass: "bg-emerald-600 text-white",
    icon: Shield,
    description: "Pengelolaan kamar, penghuni, tagihan, dan tiket perbaikan",
  },
  staff: {
    label: "Staff",
    fullLabel: "Petugas Lapangan (Staff)",
    badgeClass: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    pillClass: "bg-blue-600 text-white",
    icon: Wrench,
    description: "Akses operasional tiket perbaikan, pembersihan & token akses",
  },
  tenant: {
    label: "Penghuni",
    fullLabel: "Penghuni Kosan (Tenant)",
    badgeClass: "bg-teal-500/15 text-teal-700 border-teal-500/30",
    pillClass: "bg-teal-600 text-white",
    icon: User,
    description: "Akses mandiri portal sewa kamar, tagihan & lapor perbaikan",
  },
};

export default function UserIndicator({ compact = false, showSwitch = true, avatarOnly = false }) {
  const { user, login, logout } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const nav = useNavigate();

  if (!user) return null;

  const roleKey = user.role || "owner";
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.owner;
  const RoleIcon = config.icon;

  const handleSwitchAccount = async (email, password, targetRole) => {
    setSwitching(true);
    try {
      await login(email, password);
      toast.success(`Beralih ke akun ${targetRole}`);
      setOpenModal(false);
      if (targetRole === "tenant") {
        nav("/portal");
      } else {
        nav("/");
      }
    } catch (e) {
      toast.error("Gagal beralih akun");
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    setOpenModal(false);
    await logout();
    nav("/login");
    toast.success("Berhasil keluar dari akun");
  };

  if (avatarOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          title={`${user.name || "Profil"} (${config.label})`}
          data-testid="current-user-avatar-btn"
          className="relative w-10 h-10 rounded-full bg-surface border border-line grid place-items-center hover:bg-muted active:scale-95 transition-all shrink-0 shadow-soft"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center text-primary font-serif font-bold text-xs border border-primary/20">
            {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
        </button>

        {/* Profile Modal */}
        <ProfileModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          user={user}
          config={config}
          roleKey={roleKey}
          showSwitch={showSwitch}
          switching={switching}
          onSwitch={handleSwitchAccount}
          onLogout={handleLogout}
        />
      </>
    );
  }

  return (
    <>
      {/* Indicator Trigger Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpenModal(true)}
        data-testid="current-user-indicator"
        aria-label={`Akun aktif: ${user.name || user.email}, peran: ${config.label}`}
        className={`flex items-center gap-1.5 rounded-full border border-line bg-surface/95 backdrop-blur-md shadow-soft hover:border-primary/40 active:scale-95 transition-all text-left shrink-0 ${
          compact ? "px-2 py-1 max-w-[160px] sm:max-w-xs" : "px-3 py-1.5"
        }`}
      >
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 grid place-items-center text-primary font-serif font-bold text-xs border border-primary/20">
            {user.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-surface" />
        </div>

        {/* User Info & Role Pill */}
        <div className="min-w-0 flex items-center gap-1 overflow-hidden">
          <span className="font-semibold text-xs text-ink truncate max-w-[70px] sm:max-w-[110px]">
            {user.name ? user.name.split(" ")[0] : user.email?.split("@")[0]}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border shrink-0 ${config.badgeClass}`}
          >
            <RoleIcon size={9} />
            <span>{config.label}</span>
          </span>
        </div>

        <ChevronDown size={12} className="text-subtle group-hover:text-ink transition-transform shrink-0 ml-0.5" />
      </motion.button>

      {/* Profile Modal */}
      <ProfileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        user={user}
        config={config}
        roleKey={roleKey}
        showSwitch={showSwitch}
        switching={switching}
        onSwitch={handleSwitchAccount}
        onLogout={handleLogout}
      />
    </>
  );
}

function ProfileModal({ open, onClose, user, config, roleKey, showSwitch, switching, onSwitch, onLogout }) {
  const RoleIcon = config.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            data-testid="user-modal-backdrop"
          />

          {/* Modal Body */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-profile-title"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="relative z-50 w-full max-w-sm bg-surface rounded-3xl p-6 shadow-lifted border border-line flex flex-col gap-4 overflow-hidden"
            data-testid="user-profile-modal"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-secondary font-bold">Akun Sedang Masuk</p>
                <h3 id="user-profile-title" className="font-serif text-xl text-primary font-bold mt-0.5">
                  Profil Pengguna
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted grid place-items-center text-subtle hover:text-ink"
                aria-label="Tutup profil"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current User Card */}
            <div className="bg-muted/60 rounded-2xl p-4 border border-line flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center font-serif text-xl font-bold border border-primary/20 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-ink truncate">{user.name || "Pengguna"}</h4>
                <p className="text-xs text-subtle truncate mt-0.5">{user.email || user.phone || "-"}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}
                  >
                    <RoleIcon size={11} />
                    <span>{config.fullLabel}</span>
                  </span>
                  {user.room_name && (
                    <span className="text-[10px] font-semibold text-subtle px-2 py-0.5 rounded-full bg-surface border border-line">
                      Kamar {user.room_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-subtle leading-relaxed italic bg-surface/50 p-2.5 rounded-xl border border-line/60">
              {config.description}
            </p>

            {/* Switch Role / Account Section */}
            {showSwitch && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-secondary font-bold flex items-center gap-1">
                    <Sparkles size={12} /> Beralih Peran (Quick Switch)
                  </p>
                </div>
                <div className="space-y-1.5">
                  {/* Owner Switch */}
                  <button
                    type="button"
                    disabled={switching || roleKey === "owner"}
                    onClick={() => onSwitch("admin@lewihouse.com", "lewi2026", "owner")}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      roleKey === "owner"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface text-ink border-line hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className={roleKey === "owner" ? "text-secondary" : "text-amber-600"} />
                      <span>Owner / Admin (Pemilik)</span>
                    </span>
                    {roleKey === "owner" && <Check size={14} className="text-secondary" />}
                  </button>

                  {/* Staff Switch */}
                  <button
                    type="button"
                    disabled={switching || roleKey === "staff"}
                    onClick={() => onSwitch("staff@lewihouse.com", "lewi2026", "staff")}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      roleKey === "staff"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface text-ink border-line hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Wrench size={14} className={roleKey === "staff" ? "text-secondary" : "text-blue-600"} />
                      <span>Staff Lapangan (Teknisi)</span>
                    </span>
                    {roleKey === "staff" && <Check size={14} className="text-secondary" />}
                  </button>

                  {/* Tenant Switch */}
                  <button
                    type="button"
                    disabled={switching || roleKey === "tenant"}
                    onClick={() => onSwitch("budi@lewihouse.com", "lewi2026", "tenant")}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      roleKey === "tenant"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface text-ink border-line hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <User size={14} className={roleKey === "tenant" ? "text-secondary" : "text-teal-600"} />
                      <span>Penghuni Budi (K-204)</span>
                    </span>
                    {roleKey === "tenant" && <Check size={14} className="text-secondary" />}
                  </button>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-2 border-t border-line/60 flex items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                data-testid="user-logout-btn"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-bold hover:bg-danger/20 active:scale-95 transition-all"
              >
                <LogOut size={14} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
