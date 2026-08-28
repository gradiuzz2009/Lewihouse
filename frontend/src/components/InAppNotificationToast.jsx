import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Wrench,
  Zap,
  Megaphone,
  KeyRound,
  Bell,
  X,
  ExternalLink,
} from "lucide-react";

const MODULE_META = {
  BILLING: {
    icon: CreditCard,
    bg: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    label: "Tagihan",
  },
  MAINTENANCE: {
    icon: Wrench,
    bg: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    label: "Komplain",
  },
  ELECTRICITY: {
    icon: Zap,
    bg: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    label: "Listrik",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    bg: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    label: "Pengumuman",
  },
  AUTH: {
    icon: KeyRound,
    bg: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    label: "Akun",
  },
  CHAT: {
    icon: Bell,
    bg: "bg-teal-500/15 text-teal-600 border-teal-500/30",
    label: "Pesan",
  },
};

export default function InAppNotificationToast({ notification, onOpen, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;
  if (typeof document === "undefined") return null;

  const modKey = (notification.module || "BILLING").toUpperCase();
  const meta = MODULE_META[modKey] || {
    icon: Bell,
    bg: "bg-primary/10 text-primary border-primary/20",
    label: "Notifikasi",
  };
  const Icon = meta.icon;

  return createPortal(
    <AnimatePresence>
      <div className="fixed top-3 inset-x-0 z-[110] flex justify-center px-4 pointer-events-none">
        <motion.div
          drag="y"
          dragConstraints={{ top: -50, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -20) onClose();
          }}
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="pointer-events-auto w-full max-w-md bg-surface/95 backdrop-blur-xl border border-line/90 rounded-2xl shadow-2xl p-3 sm:p-3.5 flex items-center gap-3"
          data-testid="in-app-toast-banner"
        >
          {/* Module Icon Avatar */}
          <div
            className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 border ${meta.bg}`}
          >
            <Icon size={18} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-subtle">
                {meta.label}
              </span>
              {notification.room_unit && (
                <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded">
                  {notification.room_unit}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-ink truncate leading-tight">
              {notification.title}
            </p>
            <p className="text-[11px] text-subtle truncate mt-0.5 leading-snug">
              {notification.message || notification.body}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onOpen) onOpen(notification);
                onClose();
              }}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs flex items-center gap-1"
              data-testid="btn-open-toast"
            >
              <span>Buka</span>
              <ExternalLink size={11} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full text-subtle hover:text-ink hover:bg-muted grid place-items-center"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
