import React from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export function PageHeader({ title, subtitle, onBack, action, testid = "page-header", showBell = true }) {
  const nav = useNavigate();
  return (
    <div className="px-5 sm:px-6 pt-6 sm:pt-8 pb-4 flex items-start justify-between gap-4" data-testid={testid}>
      <div className="flex items-start gap-3 min-w-0">
        {onBack !== false && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : nav(-1))}
            className="w-10 h-10 rounded-full bg-surface border border-line grid place-items-center hover:bg-muted active:scale-95 transition-colors shrink-0 mt-0.5"
            data-testid="back-btn"
            aria-label="Kembali"
          >
            <ChevronLeft size={18} className="text-ink" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-secondary font-bold">Lewi House</p>
          <h1 className="font-serif text-2xl sm:text-3xl text-primary leading-tight font-bold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showBell && <NotificationBell />}
        {action}
      </div>
    </div>
  );
}

export function AddButton({ onClick, testid, label = "Tambah" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      aria-label={label}
      className="min-w-[44px] h-11 px-3.5 rounded-full bg-primary text-white flex items-center justify-center gap-1.5 shadow-lifted active:scale-95 hover:bg-[#122820] transition-colors"
    >
      <Plus size={18} />
      <span className="text-xs font-semibold hidden sm:inline">{label}</span>
    </button>
  );
}
