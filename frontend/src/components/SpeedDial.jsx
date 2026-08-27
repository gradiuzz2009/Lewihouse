import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, UserPlus, Wrench, KeyRound, MessageCircle, Zap, X } from "lucide-react";
import OverlayQuickAction from "./OverlayQuickAction";

const actions = [
  { label: "Catat Pembayaran", icon: Wallet, to: "/bills?pay=1", testid: "fab-record-payment" },
  { label: "Tambah Penghuni", icon: UserPlus, to: "/tenants?new=1", testid: "fab-add-tenant" },
  { label: "Lapor Keluhan", icon: Wrench, to: "/complaints?new=1", testid: "fab-new-ticket" },
  { label: "Terbitkan Token", icon: KeyRound, to: "/access?new=1", testid: "fab-issue-token" },
  { label: "Chat Baru", icon: MessageCircle, to: "/chat?new=1", testid: "fab-new-chat" },
];

export default function SpeedDial() {
  const [open, setOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Global shortcut Ctrl+K or Cmd+K to open overlay quick action
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  return (
    <>
      {/* Quick Action Overlay */}
      <OverlayQuickAction isOpen={overlayOpen} onClose={() => setOverlayOpen(false)} />

      {/* Speed Dial Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            data-testid="speed-dial-backdrop"
          />
        )}
      </AnimatePresence>

      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-[max(1.25rem,calc((100vw-56rem)/2+1.5rem))] z-40 flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
          <AnimatePresence>
            {open && (
              <>
                {/* Full Overlay Action Button */}
                <motion.button
                  initial={{ opacity: 0, y: 14, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.85 }}
                  transition={{ delay: 0.15, type: "spring", damping: 20 }}
                  onClick={() => {
                    setOpen(false);
                    setOverlayOpen(true);
                  }}
                  data-testid="fab-full-overlay"
                  className="flex items-center gap-2.5 bg-primary text-white hover:bg-[#122820] rounded-full pl-4 pr-2 py-2 shadow-lifted active:scale-95 transition-transform"
                >
                  <span className="text-xs font-bold text-white">Semua Pintasan (Overlay)</span>
                  <span className="w-8 h-8 rounded-full bg-secondary/30 grid place-items-center text-secondary">
                    <Zap size={15} />
                  </span>
                </motion.button>

                {/* Sub Action Items */}
                {actions.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.to}
                      initial={{ opacity: 0, y: 14, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 14, scale: 0.85 }}
                      transition={{ delay: (actions.length - 1 - i) * 0.03, type: "spring", damping: 20 }}
                      onClick={() => {
                        setOpen(false);
                        nav(a.to);
                      }}
                      data-testid={a.testid}
                      className="flex items-center gap-3 bg-white hover:bg-muted/60 rounded-full pl-5 pr-2 py-2 shadow-lifted border border-line active:scale-95 transition-transform group"
                    >
                      <span className="text-xs font-bold text-primary group-hover:text-ink transition-colors">{a.label}</span>
                      <span className="w-9 h-9 rounded-full bg-secondary/20 grid place-items-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon size={15} />
                      </span>
                    </motion.button>
                  );
                })}
              </>
            )}
          </AnimatePresence>

          <button
            onClick={() => setOpen(!open)}
            data-testid="speed-dial-fab"
            aria-label={open ? "Tutup menu aksi cepat" : "Buka menu aksi cepat"}
            className="w-14 h-14 rounded-full bg-primary text-white grid place-items-center shadow-lifted active:scale-95 hover:bg-[#122820] transition-[background-color,transform] focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="grid place-items-center">
              {open ? <X size={24} /> : <Plus size={24} />}
            </motion.span>
          </button>
        </div>
      </div>
    </>
  );
}
