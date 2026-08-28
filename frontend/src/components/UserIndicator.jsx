import React, { useState } from "react";
import { createPortal } from "react-dom";
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
  ChevronRight,
  X,
  Sparkles,
  Check,
  KeyRound,
  ExternalLink,
  Compass,
  Bookmark,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import OnboardingTourModal from "./OnboardingTourModal";
import { ONBOARDING_STORAGE_KEYS } from "./FloatingOnboardingWidget";

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
    description: "Pengelolaan kamar, penghuni, tagihan, dan keluhan perbaikan",
  },
  staff: {
    label: "Staff",
    fullLabel: "Petugas Lapangan (Staff)",
    badgeClass: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    pillClass: "bg-blue-600 text-white",
    icon: Wrench,
    description: "Akses operasional keluhan perbaikan, pembersihan & token akses",
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
  const [tourOpen, setTourOpen] = useState(false);
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
  const [tourOpen, setTourOpen] = useState(false);
  const [savedGuides, setSavedGuides] = useState([]);
  const [isAutoDisabled, setIsAutoDisabled] = useState(false);
  const RoleIcon = config.icon;

  React.useEffect(() => {
    if (open) {
      try {
        const saved = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEYS.SAVED_GUIDES) || "[]");
        setSavedGuides(saved);
      } catch {
        setSavedGuides([]);
      }
      setIsAutoDisabled(localStorage.getItem(ONBOARDING_STORAGE_KEYS.DISABLED) === "true");
    }
  }, [open]);

  const handleRemoveSavedGuide = (screenKey, e) => {
    e.stopPropagation();
    const updated = savedGuides.filter((g) => g.screenKey !== screenKey);
    setSavedGuides(updated);
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.SAVED_GUIDES, JSON.stringify(updated));
    toast.success("Panduan dihapus dari daftar simpan");
  };

  const handleResetAutoOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEYS.DISABLED);
    setIsAutoDisabled(false);
    toast.success("Widget panduan otomatis diaktifkan kembali");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
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
            className="relative z-50 w-full max-w-sm bg-surface rounded-3xl p-5 sm:p-6 shadow-lifted border border-line flex flex-col max-h-[88vh] overflow-hidden my-auto"
            data-testid="user-profile-modal"
          >
            {/* Header with Close & Quick Logout */}
            <div className="flex items-start justify-between pb-3 border-b border-line/60 shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-secondary font-bold">Akun Sedang Masuk</p>
                <h3 id="user-profile-title" className="font-serif text-xl text-primary font-bold mt-0.5">
                  Profil Pengguna
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-8 h-8 rounded-full bg-danger/10 text-danger hover:bg-danger hover:text-white grid place-items-center transition-colors active:scale-95"
                  title="Keluar dari Akun"
                  data-testid="user-quick-logout-header"
                >
                  <LogOut size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted grid place-items-center text-subtle hover:text-ink transition-colors active:scale-95"
                  aria-label="Tutup profil"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Middle Content */}
            <div className="overflow-y-auto space-y-3.5 pr-1 flex-1 py-1">
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

              {/* Saved Guides Section */}
              {savedGuides.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] uppercase tracking-wider text-secondary font-bold flex items-center gap-1">
                    <Bookmark size={12} className="fill-secondary" /> Panduan Tersimpan ({savedGuides.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {savedGuides.map((guide, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface border border-line hover:border-primary/30 transition-all text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <Compass size={13} className="text-secondary shrink-0" />
                          <span className="font-semibold text-ink truncate text-[11px]">
                            {guide.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedGuide(guide.screenKey, e)}
                          className="w-6 h-6 rounded-md text-subtle hover:text-danger hover:bg-danger/10 grid place-items-center transition-colors"
                          title="Hapus simpanan"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Auto-Onboarding if disabled */}
              {isAutoDisabled && (
                <button
                  type="button"
                  onClick={handleResetAutoOnboarding}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] font-semibold hover:bg-amber-500/20 active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <RotateCcw size={13} />
                    <span>Aktifkan Kembali Widget Panduan Otomatis</span>
                  </span>
                </button>
              )}

              {/* Manual Tour Trigger Card */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTourOpen(true);
                }}
                data-testid="user-restart-walkthrough-btn"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface border border-line hover:border-primary/40 hover:bg-muted/40 active:scale-98 transition-all text-left shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-700 border border-teal-500/30 grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Compass size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-ink group-hover:text-primary transition-colors truncate">
                      Panduan Fitur Aplikasi
                    </p>
                    <p className="text-[10px] text-subtle truncate">
                      {user?.role === "tenant"
                        ? "Pelajari alur sewa, tagihan & perbaikan"
                        : "Pelajari navigasi dashboard & manajemen"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-subtle group-hover:text-ink transition-transform shrink-0" />
              </button>
            </div>

            {/* Pinned Sticky Actions Footer - Always Visible */}
            <div className="pt-3 border-t border-line/60 shrink-0">
              <button
                type="button"
                onClick={onLogout}
                data-testid="user-logout-btn"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-danger hover:bg-danger/90 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-md"
              >
                <LogOut size={16} />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Onboarding Tour Modal */}
      <OnboardingTourModal
        mode={user?.role === "tenant" ? "tenant" : "admin"}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onComplete={() => {
          localStorage.setItem("lh_tour_completed", "true");
        }}
      />
    </AnimatePresence>,
    document.body
  );
}
