import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            data-testid="sheet-backdrop"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-0 z-50 w-full max-w-md bg-surface rounded-t-3xl shadow-lifted border-t border-line max-h-[92vh] flex flex-col"
            data-testid="sheet"
          >
            <div className="pt-3 pb-2 flex flex-col items-center border-b border-line">
              <div className="w-10 h-1 rounded-full bg-line mb-2" />
              <div className="w-full px-6 flex items-center justify-between">
                <h3 className="font-serif text-xl text-primary" data-testid="sheet-title">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted active:scale-95"
                  data-testid="sheet-close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Input({ label, testid, ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">{label}</span>}
      <input
        {...props}
        data-testid={testid}
        className="w-full bg-muted border border-transparent rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
      />
    </label>
  );
}

export function Select({ label, testid, children, ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">{label}</span>}
      <select
        {...props}
        data-testid={testid}
        className="w-full bg-muted border border-transparent rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, testid, ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">{label}</span>}
      <textarea
        {...props}
        data-testid={testid}
        rows={3}
        className="w-full bg-muted border border-transparent rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors resize-none"
      />
    </label>
  );
}

export function MoneyInput({ label, testid, value, onChange, ...props }) {
  const display = value ? String(Math.round(Number(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
  return (
    <label className="block mb-4">
      {label && <span className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 block">{label}</span>}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-subtle font-semibold">Rp</span>
        <input
          {...props}
          inputMode="numeric"
          data-testid={testid}
          value={display}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="w-full bg-muted border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-ink tnum focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
        />
      </div>
    </label>
  );
}

export function Button({ children, variant = "primary", testid, className = "", ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-[#0f2a20]",
    secondary: "bg-secondary text-primary hover:bg-[#b89665]",
    ghost: "bg-transparent text-primary hover:bg-muted",
    danger: "bg-danger text-white hover:bg-[#6f2020]",
    outline: "bg-transparent text-primary border border-line hover:bg-muted",
  };
  return (
    <button
      {...props}
      data-testid={testid}
      className={`rounded-full px-6 py-3 text-sm font-semibold tracking-wide active:scale-95 transition-[background-color,color,transform] duration-150 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "muted", testid }) {
  const tones = {
    muted: "bg-muted text-subtle",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-[#8a6a2f]",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary text-white",
  };
  return (
    <span
      data-testid={testid}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action, testid }) {
  return (
    <div className="text-center py-16" data-testid={testid}>
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted grid place-items-center">
          <Icon size={26} className="text-primary/60" />
        </div>
      )}
      <h3 className="font-serif text-lg text-ink mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-subtle mb-4 px-8">{subtitle}</p>}
      {action}
    </div>
  );
}
