import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

export const STATUS_CONFIG = {
  available: { label: "Tersedia", badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: "●", aria: "Kamar Tersedia" },
  reserved: { label: "Dipesan", badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: "▲", aria: "Kamar Dipesan" },
  occupied: { label: "Terisi", badgeClass: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: "■", aria: "Kamar Terisi" },
  cleaning: { label: "Dibersihkan", badgeClass: "bg-teal-500/10 text-teal-700 border-teal-500/20", icon: "◆", aria: "Kamar Dibersihkan" },
  maintenance: { label: "Perbaikan", badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/20", icon: "✕", aria: "Kamar Perbaikan" },
};

export function RoomStatusBadge({ status, className = "" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <span
      role="status"
      aria-label={config.aria}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      <span aria-hidden="true" className="text-[10px]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function Sheet({ open, onClose, title, subtitle, children, footer, maxWidth = "sm:max-w-xl" }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            data-testid="sheet-backdrop"
          />

          {/* Dynamic Adaptive Dialog / Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`relative z-[101] w-full ${maxWidth} bg-surface rounded-t-[28px] sm:rounded-3xl shadow-lifted border-t sm:border border-line max-h-[85dvh] sm:max-h-[85vh] flex flex-col overflow-hidden`}
            data-testid="sheet"
          >
            {/* Header with Drag Indicator */}
            <div className="pt-3 pb-3 flex flex-col border-b border-line bg-surface/95 backdrop-blur-md shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-line mx-auto mb-2 sm:hidden" />
              <div className="w-full px-6 flex items-center justify-between">
                <div>
                  <h3 id="sheet-title" className="font-serif text-xl sm:text-2xl text-primary leading-tight font-bold" data-testid="sheet-title">
                    {title}
                  </h3>
                  {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 -mr-2 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition-colors text-subtle hover:text-ink"
                  data-testid="sheet-close"
                  aria-label="Tutup dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto px-6 py-5 flex-1 overscroll-contain">
              {children}
            </div>

            {/* Pinned Sticky Action Footer */}
            {footer && (
              <div className="border-t border-line bg-surface/95 backdrop-blur-md px-6 py-3.5 sticky bottom-0 z-20 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SheetFooter({ children, className = "" }) {
  return (
    <div className={`border-t border-line bg-surface/95 backdrop-blur-md px-6 py-3.5 sticky bottom-0 z-20 flex items-center justify-end gap-3 mt-auto shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function FormSection({ title, subtitle, children, className = "" }) {
  return (
    <div className={`mb-5 ${className}`}>
      {title && (
        <div className="mb-2.5 pb-1 border-b border-line/60">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">{title}</p>
          {subtitle && <p className="text-[11px] text-subtle mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Input({ label, testid, error, required, helper, className = "", ...props }) {
  return (
    <label className={`block mb-3.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      <input
        {...props}
        required={required}
        data-testid={testid}
        className={`w-full min-h-[46px] bg-muted border rounded-xl px-4 py-2.5 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white ${
          error ? "border-danger focus:ring-danger" : "border-transparent hover:border-line"
        }`}
      />
      {helper && !error && <p className="text-[11px] text-subtle mt-1">{helper}</p>}
      {error && <p className="text-[11px] text-danger mt-1 font-medium">{error}</p>}
    </label>
  );
}

export function Select({ label, testid, children, error, required, helper, className = "", ...props }) {
  return (
    <label className={`block mb-3.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      <select
        {...props}
        required={required}
        data-testid={testid}
        className={`w-full min-h-[46px] bg-muted border rounded-xl px-4 py-2.5 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white ${
          error ? "border-danger focus:ring-danger" : "border-transparent hover:border-line"
        }`}
      >
        {children}
      </select>
      {helper && !error && <p className="text-[11px] text-subtle mt-1">{helper}</p>}
      {error && <p className="text-[11px] text-danger mt-1 font-medium">{error}</p>}
    </label>
  );
}

export function Textarea({ label, testid, error, required, helper, className = "", ...props }) {
  return (
    <label className={`block mb-3.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      <textarea
        {...props}
        required={required}
        data-testid={testid}
        rows={props.rows || 3}
        className={`w-full bg-muted border rounded-xl px-4 py-2.5 text-sm text-ink resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white ${
          error ? "border-danger focus:ring-danger" : "border-transparent hover:border-line"
        }`}
      />
      {helper && !error && <p className="text-[11px] text-subtle mt-1">{helper}</p>}
      {error && <p className="text-[11px] text-danger mt-1 font-medium">{error}</p>}
    </label>
  );
}

export function MoneyInput({ label, testid, value, onChange, error, required, helper, className = "", ...props }) {
  const display = value ? String(Math.round(Number(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
  return (
    <label className={`block mb-3.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-subtle font-semibold">Rp</span>
        <input
          {...props}
          inputMode="numeric"
          data-testid={testid}
          value={display}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className={`w-full min-h-[46px] bg-muted border rounded-xl pl-11 pr-4 py-2.5 text-sm text-ink tnum transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white ${
            error ? "border-danger focus:ring-danger" : "border-transparent hover:border-line"
          }`}
        />
      </div>
      {helper && !error && <p className="text-[11px] text-subtle mt-1">{helper}</p>}
      {error && <p className="text-[11px] text-danger mt-1 font-medium">{error}</p>}
    </label>
  );
}

export function Button({ children, variant = "primary", testid, loading = false, disabled = false, className = "", ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-[#122820] shadow-soft",
    secondary: "bg-secondary/20 text-primary hover:bg-secondary/30",
    ghost: "bg-transparent text-primary hover:bg-muted",
    danger: "bg-danger text-white hover:bg-[#6f2020] shadow-soft",
    outline: "bg-transparent text-primary border border-line hover:bg-muted",
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      data-testid={testid}
      className={`min-h-[44px] rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-[background-color,color,transform] duration-150 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Badge({ children, tone = "muted", testid, className = "" }) {
  const tones = {
    muted: "bg-muted text-subtle border-line",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/15 text-[#8a6a2f] border-warning/30",
    danger: "bg-danger/10 text-danger border-danger/20",
    primary: "bg-primary text-white border-primary",
  };
  return (
    <span
      data-testid={testid}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action, testid }) {
  return (
    <div className="text-center py-12 px-4 bg-surface rounded-2xl border border-line shadow-soft" data-testid={testid}>
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-primary/10 grid place-items-center text-primary">
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-serif text-lg text-primary font-bold mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-subtle mb-4 max-w-xs mx-auto leading-relaxed">{subtitle}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
