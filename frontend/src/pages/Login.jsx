import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  Building2,
  HelpCircle,
  X,
  Phone,
  Sparkles,
  ShieldCheck,
  Wifi,
  Wind,
  Star,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PROPERTY_INFO } from "../lib/propertyData";

function formatApiErrorDetail(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

const HERO_IMAGES = [
  {
    src: "/gallery/agoda/agoda-03-property.webp",
    title: "Gedung Lewi House",
    subtitle: "Kost Eksklusif & Guesthouse Syariah",
  },
  {
    src: "/gallery/agoda/agoda-02-suite-bedroom.webp",
    title: "Kenyamanan Kamar Modern",
    subtitle: "Fasilitas Lengkap AC, Smart Lock & Water Heater",
  },
  {
    src: "/gallery/agoda/agoda-04-lobby.webp",
    title: "Area Lobby & Resepsionis",
    subtitle: "Pelayanan Ramah & Keamanan 24 Jam",
  },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  // Mode: "tenant" | "admin"
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
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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
      setError("Kata sandi wajib diisi");
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

  const fillDemo = (mode, ident, pwd) => {
    setLoginMode(mode);
    if (mode === "tenant") {
      setTenantIdentifier(ident);
      setTenantPassword(pwd);
    } else {
      setAdminIdentifier(ident);
      setAdminPassword(pwd);
    }
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-ink" data-testid="login-page">
      {/* ========================================================================= */}
      {/* LEFT HERO IMAGE SECTION (DESKTOP SPLIT / MOBILE HERO HEADER)              */}
      {/* ========================================================================= */}
      <div className="relative lg:w-1/2 min-h-[260px] sm:min-h-[320px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 overflow-hidden bg-slate-900">
        {/* Background Property Image with Smooth Transition */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGES[activeImageIdx]?.src || "/gallery/agoda/agoda-03-property.webp"}
            alt="Lewi House Property"
            className="w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ease-out"
          />
          {/* Multi-layered Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40 lg:block hidden" />
        </div>

        {/* Top Branding Pill & Location */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-white shadow-lifted">
            <div className="w-6 h-6 rounded-full bg-secondary/90 flex items-center justify-center text-slate-950 font-bold text-xs shadow-xs">
              LH
            </div>
            <span className="text-xs font-serif font-bold tracking-wide">LEWI HOUSE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/90 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
            <MapPin size={12} className="text-secondary" />
            <span>Medan, Sumatera Utara</span>
          </div>
        </div>

        {/* Center / Bottom Hero Information */}
        <div className="relative z-10 my-auto pt-6 lg:pt-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-[11px] font-bold mb-3 backdrop-blur-md">
            <Sparkles size={12} />
            <span>Kost Eksklusif & Guesthouse Syariah</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
            Kenyamanan & Kemewahan Tinggal di Pusat Kota Medan
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 mt-2.5 leading-relaxed drop-shadow-xs hidden sm:block">
            Sistem manajemen terintegrasi untuk kenyamanan penghuni, pemantauan tagihan otomatis, serta kontrol akses unit kamar real-time.
          </p>

          {/* Feature Highlights Badges */}
          <div className="hidden lg:flex items-center gap-2 mt-5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
              <ShieldCheck size={13} className="text-emerald-400" /> Smart Lock
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
              <Wind size={13} className="text-blue-400" /> AC Dingin
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
              <Wifi size={13} className="text-amber-400" /> WiFi Cepat
            </span>
          </div>
        </div>

        {/* Bottom Thumbnail Selector & Rating */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            {HERO_IMAGES.map((img, idx) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                title={img.title}
                className={`relative w-12 h-9 sm:w-14 sm:h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImageIdx === idx
                    ? "border-secondary ring-2 ring-secondary/40 scale-105 opacity-100"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 text-xs font-semibold">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span>4.9 / 5.0</span>
            <span className="text-[10px] text-white/70 hidden sm:inline">(Agoda & Google)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT LOGIN FORM SECTION                                                  */}
      {/* ========================================================================= */}
      <div className="lg:w-1/2 flex-1 bg-surface flex flex-col justify-between p-6 sm:p-12 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-primary/10 text-primary items-center justify-center mb-3">
              <KeyRound size={24} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Selamat Datang Kembali
            </h2>
            <p className="text-xs sm:text-sm text-subtle mt-1">
              Silakan pilih profil akun Anda untuk masuk ke sistem Lewi House.
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="p-1.5 bg-muted rounded-2xl flex gap-1.5 mb-6 border border-line/60">
            <button
              type="button"
              onClick={() => handleModeChange("tenant")}
              data-testid="tab-login-tenant"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                !isAdmin
                  ? "bg-surface text-primary shadow-soft border border-line/80 scale-[1.01]"
                  : "text-subtle hover:text-ink"
              }`}
            >
              <User size={15} />
              <span>Portal Penghuni</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("admin")}
              data-testid="tab-login-admin"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                isAdmin
                  ? "bg-surface text-primary shadow-soft border border-line/80 scale-[1.01]"
                  : "text-subtle hover:text-ink"
              }`}
            >
              <Building2 size={15} />
              <span>Pengelola / Staff</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={submit} className="space-y-4">
            {isAdmin ? (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Email Pengelola</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="email"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="admin@lewihouse.com"
                    data-testid="login-email-input"
                    className="w-full bg-surface border border-line rounded-xl pl-10 pr-3.5 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Username / Nomor Unit</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="text"
                    required
                    value={tenantIdentifier}
                    onChange={(e) => setTenantIdentifier(e.target.value)}
                    placeholder="204_budi"
                    data-testid="login-tenant-input"
                    className="w-full bg-surface border border-line rounded-xl pl-10 pr-3.5 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={isAdmin ? adminPassword : tenantPassword}
                  onChange={(e) => (isAdmin ? setAdminPassword(e.target.value) : setTenantPassword(e.target.value))}
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  className="w-full bg-surface border border-line rounded-xl pl-3.5 pr-10 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                  data-testid="toggle-password-btn"
                  aria-label={showPw ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium"
                data-testid="login-error"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit-btn"
              className="w-full mt-2 rounded-xl bg-primary hover:bg-[#122820] text-white py-3.5 text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-60 shadow-lifted"
            >
              {busy ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-line/60">
            <p className="text-[10px] text-center lg:text-left text-subtle font-bold uppercase tracking-wider mb-2.5">
              🚀 Akses Cepat Akun Demo:
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fillDemo("tenant", "204_budi", "204789")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  !isAdmin && tenantIdentifier === "204_budi"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-ink border-line hover:border-primary/50"
                }`}
              >
                Penghuni (Unit 204)
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin", "admin@lewihouse.com", "lewi2026")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAdmin && adminIdentifier === "admin@lewihouse.com"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-ink border-line hover:border-primary/50"
                }`}
              >
                Admin / Owner
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin", "staff@lewihouse.com", "lewi2026")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAdmin && adminIdentifier === "staff@lewihouse.com"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-ink border-line hover:border-primary/50"
                }`}
              >
                Staff Operasional
              </button>
            </div>
          </div>
        </div>

        {/* Footer Support Link */}
        <div className="text-center pt-4 border-t border-line/40">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-xs text-subtle hover:text-primary font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle size={14} />
            <span>Butuh bantuan akses akun? Hubungi Pengelola</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HELP & SUPPORT MODAL                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full shadow-2xl text-ink space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full text-subtle hover:text-ink hover:bg-muted grid place-items-center"
              >
                <X size={15} />
              </button>

              <div>
                <h3 className="font-serif text-lg font-bold text-primary">Bantuan Masuk</h3>
                <p className="text-xs text-subtle mt-0.5">Kontak Pengelola Lewi House Medan</p>
              </div>

              <div className="text-xs text-ink/80 space-y-2 bg-muted/40 p-3.5 rounded-2xl border border-line">
                <p className="font-medium">
                  <strong>Penghuni:</strong> Gunakan Username unit Anda (contoh: <code className="bg-surface px-1 py-0.5 rounded border border-line font-mono text-[10px]">204_budi</code>) dan 6 digit password sewa.
                </p>
                <p className="font-medium text-subtle">
                  Jika lupa sandi atau membutuhkan aktivasi akun baru, silakan hubungi kontak admin di bawah:
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href={`https://wa.me/${PROPERTY_INFO.admin.phoneClean}?text=Halo%20Mbak%20Rosmah%20Lewi%20House,%20saya%20memerlukan%20bantuan%20login%20portal.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-soft"
                >
                  <Phone size={14} />
                  <span>WhatsApp Mbak Rosmah ({PROPERTY_INFO.admin.phone})</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-2 rounded-xl bg-muted text-subtle hover:text-ink font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
