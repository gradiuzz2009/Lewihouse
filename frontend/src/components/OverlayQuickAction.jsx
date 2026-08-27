import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  X,
  DoorOpen,
  UserPlus,
  Receipt,
  Wrench,
  KeyRound,
  MessageCircle,
  Users,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export const QUICK_ACTIONS = [
  {
    id: "add-room",
    title: "Tambah Kamar Baru",
    desc: "Unit baru, tarif & spesifikasi fasilitas",
    category: "Properti",
    icon: DoorOpen,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    to: "/rooms?new=1",
    badge: "Unit",
  },
  {
    id: "add-tenant",
    title: "Daftarkan Penghuni (KYC)",
    desc: "Registrasi kontrak, KTP & kontak darurat",
    category: "Penghuni",
    icon: UserPlus,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    to: "/tenants?new=1",
    badge: "KYC",
  },
  {
    id: "record-bill",
    title: "Catat Pembayaran Masuk",
    desc: "Input pelunasan sewa, listrik & deposit",
    category: "Keuangan",
    icon: Receipt,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    to: "/bills?pay=1",
    badge: "Kas",
  },
  {
    id: "issue-token",
    title: "Terbitkan Token PIN",
    desc: "PIN digital pintu untuk tamu atau vendor",
    category: "Keamanan",
    icon: KeyRound,
    color: "bg-primary/10 text-primary border-primary/20",
    to: "/access?new=1",
    badge: "Akses",
  },
  {
    id: "new-ticket",
    title: "Lapor Tiket Perbaikan",
    desc: "Catat keluhan kerusakan fasilitas kosan",
    category: "Operasional",
    icon: Wrench,
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    to: "/complaints?new=1",
    badge: "Tiket",
  },
  {
    id: "new-chat",
    title: "Mulai Chat Penghuni",
    desc: "Kirim pesan langsung ke penghuni kosan",
    category: "Komunikasi",
    icon: MessageCircle,
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    to: "/chat?new=1",
    badge: "Pesan",
  },
  {
    id: "manage-staff",
    title: "Manajemen Staff & Akun",
    desc: "Kelola hak akses admin & teknisi lapangan",
    category: "Sistem",
    icon: Users,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    to: "/staff",
    badge: "Admin",
  },
];

export default function OverlayQuickAction({ isOpen, onClose }) {
  const nav = useNavigate();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleAction = (to) => {
    onClose?.();
    nav(to);
  };

  const handleSyncFirestore = async () => {
    setSyncing(true);
    try {
      await api.post("/sync/firestore-full");
      toast.success("Data berhasil disinkronkan ke Cloud Firestore!");
    } catch {
      toast.error("Gagal sinkronisasi Firestore");
    } finally {
      setSyncing(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            data-testid="overlay-quick-action-backdrop"
          />

          {/* Overlay Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-action-title"
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-[101] w-full sm:max-w-lg bg-surface rounded-t-[28px] sm:rounded-3xl shadow-lifted border-t sm:border border-line max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden"
            data-testid="overlay-quick-action-modal"
          >
            {/* Header */}
            <div className="pt-4 pb-3 px-6 border-b border-line bg-surface/95 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-secondary/20 grid place-items-center text-primary shrink-0">
                  <Zap size={20} className="text-secondary" />
                </div>
                <div>
                  <h3 id="quick-action-title" className="font-serif text-xl sm:text-2xl text-primary font-bold leading-tight">
                    Aksi Cepat (Quick Actions)
                  </h3>
                  <p className="text-[11px] text-subtle mt-0.5">Pintasan operasional instan untuk pengelola Lewi House</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-muted grid place-items-center text-subtle hover:text-ink active:scale-95 transition-colors"
                aria-label="Tutup menu aksi cepat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Action Grid */}
            <div className="overflow-y-auto px-5 sm:px-6 py-4 flex-1 overscroll-contain space-y-4">
              {/* Primary Shortcuts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {QUICK_ACTIONS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(a.to)}
                      data-testid={`quick-action-${a.id}`}
                      className="flex items-start gap-3 p-3.5 bg-surface hover:bg-muted/50 rounded-2xl border border-line hover:border-primary/40 shadow-soft text-left transition-all group"
                    >
                      <div className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 border ${a.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors leading-tight">
                            {a.title}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-bold text-subtle">
                            {a.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-subtle leading-tight mt-1 line-clamp-1">{a.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Cloud Firestore Quick Sync Card */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-4 border border-line flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
                    <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-primary">Sinkronisasi Cloud Firestore</h5>
                    <p className="text-[10px] text-subtle mt-0.5">Perbarui cache data dengan backend Android</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSyncFirestore}
                  disabled={syncing}
                  className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-soft hover:bg-[#122820] active:scale-95 transition-all shrink-0 disabled:opacity-50"
                >
                  {syncing ? "Sinkron..." : "Sinkron"}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-line bg-surface/95 backdrop-blur-md px-6 py-3 shrink-0 flex items-center justify-between text-xs text-subtle">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles size={13} className="text-secondary" />
                <span>Tekan <b>Esc</b> untuk menutup</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full bg-muted hover:bg-line text-ink font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
