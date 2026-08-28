import React, { useState } from "react";
import { ChevronLeft, Plus, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import UserIndicator from "./UserIndicator";
import OnboardingTourModal from "./OnboardingTourModal";

export function PageHeader({
  title,
  subtitle,
  onBack,
  action,
  testid = "page-header",
  showBell = true,
  showUser = true,
  showTour = true,
}) {
  const [tourOpen, setTourOpen] = useState(false);
  const nav = useNavigate();

  return (
    <div
      className="px-5 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:pt-6 pb-3 space-y-3"
      data-testid={testid}
    >
      {/* Top Utility Bar: Back Button, Brand Tag, and System Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack !== false && (
            <button
              type="button"
              onClick={() => (onBack ? onBack() : nav(-1))}
              className="w-9 h-9 rounded-full bg-surface border border-line grid place-items-center hover:bg-muted active:scale-95 transition-all shrink-0 shadow-2xs"
              data-testid="back-btn"
              aria-label="Kembali"
            >
              <ChevronLeft size={18} className="text-ink" />
            </button>
          )}
          <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-bold font-sans px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 truncate">
            Lewi House Medan
          </span>
        </div>

        {/* Top Right System Icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showTour && (
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="w-8 h-8 sm:w-auto sm:h-8 sm:px-2.5 rounded-full bg-surface border border-line text-primary hover:bg-primary hover:text-white text-xs font-semibold active:scale-95 transition-all shadow-2xs grid place-items-center sm:flex sm:items-center sm:gap-1"
              title="Mulai Tur Panduan Aplikasi"
              data-testid="btn-admin-header-tour"
            >
              <Compass size={14} className="text-secondary shrink-0" />
              <span className="hidden sm:inline text-[11px]">Panduan</span>
            </button>
          )}
          {showBell && <NotificationBell />}
          {showUser && <UserIndicator avatarOnly />}
        </div>
      </div>

      {/* Main Title & Action Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl sm:text-3xl text-primary leading-tight font-bold tracking-tight break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-subtle mt-1 leading-normal break-words font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 flex-wrap">
            {action}
          </div>
        )}
      </div>

      {/* Admin Onboarding Tour Modal */}
      <OnboardingTourModal
        mode="admin"
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onComplete={() => {
          localStorage.setItem("lh_tour_admin_completed", "true");
        }}
      />
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
      className="min-w-[40px] h-10 px-3.5 rounded-full bg-primary text-white flex items-center justify-center gap-1.5 shadow-soft active:scale-95 hover:bg-[#122820] transition-all text-xs font-bold shrink-0"
    >
      <Plus size={16} />
      <span>{label}</span>
    </button>
  );
}
