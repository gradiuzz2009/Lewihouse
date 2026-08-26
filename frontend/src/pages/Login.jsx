import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Mail, Eye, EyeOff, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { validateEmail, validatePassword } from "../lib/validation";

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
  const [email, setEmail] = useState("admin@lewihouse.com");
  const [password, setPassword] = useState("lewi2026");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    const pwErr = validatePassword(password, 6);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    setBusy(true);
    try {
      await login(email.trim(), password);
      nav("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleQuickLogin = async (presetEmail, presetPassword) => {
    setEmail(presetEmail);
    setPassword(presetPassword);
    setError("");
    setBusy(true);
    try {
      await login(presetEmail, presetPassword);
      nav("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-end" data-testid="login-page">
      <div className="px-8 pt-16 pb-10 text-white">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 grid place-items-center mb-6">
            <KeyRound size={22} className="text-secondary" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">Manajemen Properti</p>
          <h1 className="font-serif text-4xl mt-2 leading-tight">Lewi House</h1>
          <p className="text-sm text-white/70 mt-2">Masuk untuk mengelola kamar, penghuni & keuangan.</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-bg rounded-t-[2rem] px-8 pt-8 pb-10 shadow-2xl"
      >
        <form onSubmit={submit}>
          <label className="block mb-4">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">Email / Akun</span>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lewihouse.com"
                data-testid="login-email-input"
                className="w-full bg-white border border-line rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </label>

          <label className="block mb-2">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password-input"
                className="w-full bg-white border border-line rounded-xl px-4 pr-11 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle p-1"
                data-testid="toggle-password-btn"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="text-xs text-danger mt-2 mb-1" data-testid="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            data-testid="login-submit-btn"
            className="w-full mt-5 rounded-full bg-primary text-white py-4 text-sm font-semibold tracking-wide active:scale-[0.98] transition-transform disabled:opacity-60 shadow-md hover:bg-primary/95"
          >
            {busy ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        <div className="mt-8 pt-6 border-t border-line/60">
          <p className="text-[11px] font-bold text-center text-subtle uppercase tracking-wider mb-3">
            ⚡ Quick Demo 1-Click Login
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@lewihouse.com", "lewi2026")}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-line rounded-xl text-xs font-semibold text-primary hover:bg-surface active:scale-95 transition-all shadow-sm"
            >
              <ShieldCheck size={14} className="text-secondary" />
              <span>Owner / Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("budi@lewihouse.com", "lewi2026")}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-line rounded-xl text-xs font-semibold text-primary hover:bg-surface active:scale-95 transition-all shadow-sm"
            >
              <UserCheck size={14} className="text-accent" />
              <span>Penghuni (204)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
