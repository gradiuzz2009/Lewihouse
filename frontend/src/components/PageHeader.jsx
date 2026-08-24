import React from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export function PageHeader({ title, subtitle, onBack, action, testid = "page-header", showBell = true }) {
  const nav = useNavigate();
  return (
    <div className="px-6 pt-8 pb-4 flex items-start justify-between" data-testid={testid}>
      <div className="flex items-start gap-3">
        {onBack !== false && (
          <button
            onClick={() => (onBack ? onBack() : nav(-1))}
            className="w-9 h-9 rounded-full bg-surface border border-line grid place-items-center hover:bg-muted active:scale-95 mt-1"
            data-testid="back-btn"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-subtle">Lewi House</p>
          <h1 className="font-serif text-3xl text-primary leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-subtle mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showBell && <NotificationBell />}
        {action}
      </div>
    </div>
  );
}

export function AddButton({ onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="w-11 h-11 rounded-full bg-primary text-white grid place-items-center shadow-lifted active:scale-95 hover:bg-[#0f2a20] transition-colors"
    >
      <Plus size={18} />
    </button>
  );
}
