import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Building2,
  Wrench,
  Sparkles,
  Info,
  HelpCircle,
  PhoneCall,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function formatApiErrorDetail(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  // Mode: "admin" | "tenant"
  const [loginMode, setLoginMode] = useState("tenant");

  // Form states
  const [adminIdentifier, setAdminIdentifier] = useState("admin@lewihouse.com");
  const [adminPassword, setAdminPassword] = useState("lewi2026");

  const [tenantIdentifier, setTenantIdentifier] = useState("204_budi");
  const [tenantPassword, setTenantPassword] = useState("204789");

  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const isAdmin = loginMode === "admin";

  const handleModeChange = (mode) => {
    setLoginMode(mode);
    setError("");
    setShowPw(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = isAdmin ? adminIdentifier.trim() : tenantIdentifier.trim();
    const password = isAdmin ? adminPassword : tenantPassword;

    if (!identifier) {
      setError(isAdmin ? "Email pengelola wajib diisi" : "Username / Nomor Unit wajib diisi");
      return;
    }
    if (!password) {
      setError("Password wajib diisi");
      return;
    }

    setBusy(true);
    try {
      const loggedUser = await login(identifier, password);
      if (loggedUser?.role === "tenant") {
        nav("/portal");
      } else {
        nav("/");
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  const handleQuickLogin = async (ident, pwd, targetRole) => {
    if (targetRole === "tenant") {
      setTenantIdentifier(ident);
      setTenantPassword(pwd);
    } else {
      setAdminIdentifier(ident);
      setAdminPassword(pwd);
    }
    setError("");
    setBusy(true);
    try {
      const loggedUser = await login(ident, pwd);
      if (loggedUser?.role === "tenant" || targetRole === "tenant") {
        nav("/portal");
      } else {
        nav("/");
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-between overflow-x-hidden" data-testid="login-page">
      {/* Top Header Hero */}
      <div className="px-7 pt-10 pb-5 text-white">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 grid place-items-center border border-secondary/30 shadow-inner">
              <KeyRound size={22} className="text-secondary" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-secondary">
              Lewi House 2026
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight tracking-tight">Lewi House</h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
            {isAdmin
              ? "Sistem manajemen kosan untuk Pemilik, Pengelola & Staff Lapangan."
              : "Selamat Datang di Lewi House — Portal Mandiri Penghuni"}
          </p>
        </motion.div>

        {/* Segmented Mode Selector Tabs */}
        <div className="mt-5 p-1 bg-black/30 backdrop-blur-md rounded-2xl border border-white/15 flex gap-1">
          <button
            type="button"
            onClick={() => handleModeChange("tenant")}
            data-testid="tab-login-tenant"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isAdmin
                ? "bg-white text-primary shadow-lifted"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <User size={15} className={!isAdmin ? "text-primary" : "text-white/60"} />
            <span>Penyewa / Penghuni</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("admin")}
            data-testid="tab-login-admin"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isAdmin
                ? "bg-white text-primary shadow-lifted"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Building2 size={15} className={isAdmin ? "text-primary" : "text-white/60"} />
            <span>Pengelola / Admin</span>
          </button>
        </div>
      </div>

      {/* Main Login Form Container */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-bg rounded-t-[2.2rem] px-7 pt-6 pb-8 shadow-2xl flex-1 flex flex-col justify-between"
      >
        <div>
          {/* Mode Title Banner */}
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-line/60">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-secondary font-bold">
                {isAdmin ? "Akses Manajemen" : "Akses Mandiri Penghuni"}
              </p>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">
                {isAdmin ? "Masuk sebagai Pengelola" : "Selamat Datang di Lewi House"}
              </h2>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isAdmin
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/25"
                  : "bg-teal-500/10 text-teal-700 border-teal-500/25"
              }`}
            >
              {isAdmin ? "Admin / Staff" : "Penghuni Kamar"}
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Identifier Input */}
            {isAdmin ? (
              <label className="block">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 block">
                  Email Akun Pengelola
                </span>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="email"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="admin@lewihouse.com"
                    data-testid="login-email-input"
                    className="w-full bg-surface border border-line rounded-xl pl-11 pr-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary shadow-soft transition-all"
                  />
                </div>
              </label>
            ) : (
              <label className="block">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 block">
                  Username / Nomor Unit
                </span>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="text"
                    required
                    value={tenantIdentifier}
                    onChange={(e) => setTenantIdentifier(e.target.value)}
                    placeholder="204_ali"
                    data-testid="login-tenant-input"
                    className="w-full bg-surface border border-line rounded-xl pl-11 pr-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary shadow-soft transition-all"
                  />
                </div>
              </label>
            )}

            {/* Password Input */}
            <label className="block">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 block">
                Kata Sandi
              </span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={isAdmin ? adminPassword : tenantPassword}
                  onChange={(e) => (isAdmin ? setAdminPassword(e.target.value) : setTenantPassword(e.target.value))}
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  className="w-full bg-surface border border-line rounded-xl px-4 pr-11 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary shadow-soft transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1.5"
                  data-testid="toggle-password-btn"
                  aria-label={showPw ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {!isAdmin && (
              <div className="flex items-start gap-2 p-2.5 bg-secondary/10 rounded-xl border border-secondary/20 text-[11px] text-ink/80">
                <Info size={14} className="text-secondary shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong className="text-primary">Password default:</strong> Nomor unit + 3 digit terakhir KTP / 123 (Contoh: Unit 204 & KTP ...789 &rarr; <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">204789</code>).
                </span>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 font-medium"
                data-testid="login-error"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit-btn"
              className="w-full mt-2 rounded-xl bg-primary text-white py-3.5 text-sm font-bold tracking-wide active:scale-[0.98] transition-all disabled:opacity-60 shadow-lifted hover:bg-[#122820]"
            >
              {busy ? "Memproses..." : "Masuk"}
            </button>

            {!isAdmin && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle size={13} />
                  <span>Butuh bantuan login? Hubungi Pengelola</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Quick Demo 1-Click Login Section */}
        <div className="mt-5 pt-4 border-t border-line/60">
          <p className="text-[10px] font-bold text-center text-subtle uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-secondary" />
            <span>1-Click Demo Login</span>
          </p>

          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@lewihouse.com", "lewi2026", "owner")}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-line rounded-xl text-xs font-bold text-primary hover:bg-muted active:scale-95 transition-all shadow-soft"
              >
                <ShieldCheck size={14} className="text-amber-600" />
                <span>Owner / Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("staff@lewihouse.com", "lewi2026", "staff")}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-line rounded-xl text-xs font-bold text-primary hover:bg-muted active:scale-95 transition-all shadow-soft"
              >
                <Wrench size={14} className="text-blue-600" />
                <span>Staff Lapangan</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("204_budi", "204789", "tenant")}
                disabled={busy}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-surface border border-line rounded-xl text-xs font-bold text-primary hover:bg-muted active:scale-95 transition-all shadow-soft"
              >
                <UserCheck size={15} className="text-teal-600" />
                <span>Masuk sebagai Penyewa: 204_budi (Password Sementara: 204789)</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-line rounded-2xl p-6 max-w-sm w-full shadow-2xl text-ink space-y-4"
          >
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 grid place-items-center">
                <PhoneCall size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Bantuan Login Penghuni</h3>
                <p className="text-xs text-subtle">Kredensial & Reset Akses</p>
              </div>
            </div>

            <div className="text-xs text-subtle space-y-2 leading-relaxed bg-muted p-3.5 rounded-xl border border-line/60">
              <p>
                Kredensial login Anda telah dibuat secara otomatis saat masa sewa aktif atau check-in:
              </p>
              <ul className="list-disc list-inside space-y-1 text-ink font-medium">
                <li>Username: <code className="bg-white px-1 rounded">[Unit]_[Nama]</code> (contoh: <code className="bg-white px-1 rounded">204_ali</code>)</li>
                <li>Password Default: <code className="bg-white px-1 rounded">[Unit][3 Digit KTP]</code></li>
              </ul>
              <p>
                Jika Anda lupa password atau memerlukan reset kredensial, silakan hubungi admin pengelola via WhatsApp:
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Pengelola%20Lewi%20House%2C%20saya%20butuh%20bantuan%20reset%20password%20portal%20penghuni."
                target="_blank"
                rel="noreferrer"
                className="w-full text-center py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-soft"
              >
                Hubungi Pengelola via WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-xl bg-muted text-ink font-semibold text-xs hover:bg-line transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
