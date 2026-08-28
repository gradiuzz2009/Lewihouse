import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Building2,
  CreditCard,
  Wrench,
  TrendingUp,
  Megaphone,
  Check,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const ADMIN_TOUR_STEPS = [
  {
    step_id: "rooms_grid",
    badge: "LANGKAH 1 DARI 5",
    title: "Grid Kamar & Status Unit 🏢",
    subtitle: "Manajemen Unit Kamar Real-Time",
    description:
      "Pantau ketersediaan 17 unit kamar (Available, Occupied, Cleaning, Maintenance) dan lakukan aksi Room Transfer.",
    features: [
      "Visualisasi status okupansi 17 kamar realtime",
      "Pencatatan meteran listrik kWh tiap unit",
      "Fitur perpindahan kamar (Room Transfer)",
    ],
    target_component_id: "tour-target-room-grid",
    icon: Building2,
    accentColor: "#1E3A8A",
    preferredPlacement: "bottom",
  },
  {
    step_id: "payment_verification",
    badge: "LANGKAH 2 DARI 5",
    title: "Verifikasi Pembayaran Masuk 💰",
    subtitle: "Persetujuan Kas & Struk Digital",
    description:
      "Tinjau daftar bukti transfer sewa yang membutuhkan persetujuan, terbitkan struk lunas, dan kirim dunning WhatsApp.",
    features: [
      "Verifikasi bukti transfer QRIS & Rekening BCA",
      "Kirim invoice dan pengingat via WhatsApp",
      "Terbitkan struk pembayaran digital lunas",
    ],
    target_component_id: "tour-target-payment-verification",
    icon: CreditCard,
    accentColor: "#0D9488",
    preferredPlacement: "bottom",
  },
  {
    step_id: "complaints_management",
    badge: "LANGKAH 3 DARI 5",
    title: "Manajemen Komplain & Teknisi 🛠️",
    subtitle: "Pelaporan & Penugasan Servis",
    description:
      "Pantau tiket keluhan fasilitas kamar dari penyewa dan atur alur penugasan teknisi beserta pencatatan biaya.",
    features: [
      "Tiket keluhan terintegrasi foto dan kategori",
      "Penugasan teknisi & tracking status pengerjaan",
      "Pencatatan biaya jasa dan material perbaikan",
    ],
    target_component_id: "tour-target-complaints-management",
    icon: Wrench,
    accentColor: "#2563EB",
    preferredPlacement: "top",
  },
  {
    step_id: "financial_metrics",
    badge: "LANGKAH 4 DARI 5",
    title: "Metrik Keuangan & Okupansi 📊",
    subtitle: "Laporan Pendapatan & Tingkat Hunian",
    description:
      "Pantau ringkasan pendapatan sewa 6 bulan, total tunggakan aktif, dan persentase okupansi gedung secara real-time.",
    features: [
      "Grafik pendapatan sewa 6 bulan berjalan",
      "Statistik okupansi gedung kosan real-time",
      "Monitoring total piutang dan tagihan pending",
    ],
    target_component_id: "tour-target-financial-metrics",
    icon: TrendingUp,
    accentColor: "#7C3AED",
    preferredPlacement: "top",
  },
  {
    step_id: "activity_hub",
    badge: "LANGKAH 5 DARI 5",
    title: "Live Activity Hub & Siaran Pengumuman 📢",
    subtitle: "Jejak audit menyeluruh & ekspor CSV",
    description:
      "Pantau seluruh jejak aktivitas sistem secara real-time, ekspor riwayat audit ke format CSV, dan siarkan pengumuman resmi ke seluruh penyewa.",
    features: [
      "Filter multi-kriteria: Nomor Unit, Jenis Modul, dan Tingkat Urgensi",
      "Tombol Unduh Laporan Log (.CSV) untuk kebutuhan pembukuan",
      "Siaran pengumuman instan via notifikasi in-app dan web push",
    ],
    note: "Dashboard siap digunakan! Selamat mengelola Lewi House Medan.",
    target_component_id: "tour-target-activity-hub",
    icon: Megaphone,
    accentColor: "#9333EA",
    preferredPlacement: "top",
  },
];

export default function AdminSpotlightTour({
  open,
  onClose,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrow: "top", isCentered: true });
  const { updateUser } = useAuth();
  const step = ADMIN_TOUR_STEPS[currentStep] || ADMIN_TOUR_STEPS[0];

  const updateTargetPosition = useCallback(() => {
    if (!open) return;
    const targetEl =
      document.querySelector(`[data-tour-target="${step.target_component_id}"]`) ||
      document.getElementById(step.target_component_id);

    const tooltipWidth = Math.min(420, window.innerWidth - 32);
    const tooltipHeight = 320; // Estimated height

    if (targetEl) {
      // Scroll into view if needed
      const r = targetEl.getBoundingClientRect();
      const isVisible =
        r.top >= 0 &&
        r.bottom <= (window.innerHeight || document.documentElement.clientHeight);

      if (!isVisible) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Re-read rect
      const updatedRect = targetEl.getBoundingClientRect();
      setTargetRect({
        top: updatedRect.top - 8,
        left: updatedRect.left - 8,
        width: updatedRect.width + 16,
        height: updatedRect.height + 16,
      });

      let posTop = updatedRect.bottom + 16;
      let posLeft = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
      let arrowPlacement = "top";

      // If overflowing below viewport, place above
      if (posTop + tooltipHeight > window.innerHeight - 20) {
        posTop = Math.max(16, updatedRect.top - tooltipHeight - 16);
        arrowPlacement = "bottom";
      }

      // Constrain horizontal
      if (posLeft < 16) posLeft = 16;
      if (posLeft + tooltipWidth > window.innerWidth - 16) {
        posLeft = window.innerWidth - tooltipWidth - 16;
      }

      setTooltipPos({
        top: posTop,
        left: posLeft,
        arrow: arrowPlacement,
        width: tooltipWidth,
        isCentered: false,
      });
    } else {
      // Fallback center modal if element not in DOM
      setTargetRect(null);
      setTooltipPos({
        top: Math.max(24, Math.floor((window.innerHeight - tooltipHeight) / 2)),
        left: Math.max(16, Math.floor((window.innerWidth - tooltipWidth) / 2)),
        arrow: "none",
        width: tooltipWidth,
        isCentered: true,
      });
    }
  }, [open, step]);

  useEffect(() => {
    if (open) {
      updateTargetPosition();
      const timer = setTimeout(updateTargetPosition, 250);
      window.addEventListener("resize", updateTargetPosition);
      window.addEventListener("scroll", updateTargetPosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateTargetPosition);
        window.removeEventListener("scroll", updateTargetPosition, true);
      };
    }
  }, [open, currentStep, updateTargetPosition]);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === ADMIN_TOUR_STEPS.length - 1;
  const StepIcon = step.icon;

  const markCompleted = async () => {
    try {
      await api.post("/auth/complete-onboarding");
    } catch {}
    localStorage.setItem("lh_tour_admin_completed", "true");
    if (updateUser) {
      updateUser({ has_completed_onboarding: true, last_tour_opened_at: new Date().toISOString() });
    }
    if (onComplete) onComplete();
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      markCompleted();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    markCompleted();
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center p-4"
        data-testid="admin-spotlight-tour-overlay"
      >
        {/* Dimmed Backdrop 75% Dark Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-[2px] z-[100] transition-opacity"
          onClick={handleClose}
          data-testid="spotlight-backdrop"
        />

        {/* Dynamic Cutout Mask with Glowing Pulse Border */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed pointer-events-none z-[101] rounded-2xl border-2 border-[#1E3A8A] shadow-[0_0_0_9999px_rgba(15,23,42,0.75),0_0_24px_rgba(30,58,138,0.5)] transition-all duration-300"
            data-testid="spotlight-cutout-box"
          >
            {/* Pulsing Glow Corner Accents */}
            <span className="absolute -inset-1 rounded-2xl border border-[#0D9488]/60 animate-ping pointer-events-none opacity-40" />
          </motion.div>
        )}

        {/* Floating / Centered Tooltip Card */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            ...(tooltipPos.isCentered
              ? {}
              : {
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  position: "fixed",
                }),
          }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          style={tooltipPos.isCentered ? { width: `${tooltipPos.width}px` } : { width: `${tooltipPos.width}px`, position: "fixed" }}
          className="relative z-[102] bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-4 sm:p-5 flex flex-col gap-3 text-[#0F172A] max-h-[88vh] overflow-hidden my-auto"
          data-testid="spotlight-tooltip-card"
          role="dialog"
          aria-modal="true"
        >
          {/* Dynamic Pointer Arrow (only if not centered) */}
          {!tooltipPos.isCentered && tooltipPos.arrow === "top" && (
            <div className="absolute -top-2.5 left-8 w-5 h-5 bg-white border-t border-l border-[#E2E8F0] rotate-45" />
          )}
          {!tooltipPos.isCentered && tooltipPos.arrow === "bottom" && (
            <div className="absolute -bottom-2.5 left-8 w-5 h-5 bg-white border-b border-r border-[#E2E8F0] rotate-45" />
          )}

          {/* Header & Step Badge */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] grid place-items-center">
                <Compass size={16} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] text-[10px] font-bold tracking-wider uppercase">
                {step.badge || `LANGKAH ${currentStep + 1} DARI ${ADMIN_TOUR_STEPS.length}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0F172A] grid place-items-center active:scale-95 transition-colors"
              title="Lewati Tur"
              data-testid="btn-close-spotlight"
            >
              <X size={14} />
            </button>
          </div>

          {/* Tooltip Content Body (Scrollable if tall) */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 border"
                style={{ backgroundColor: `${step.accentColor}15`, borderColor: `${step.accentColor}30`, color: step.accentColor }}
              >
                <StepIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#0F172A] leading-tight">
                  {step.title}
                </h4>
                {step.subtitle && (
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-[#0F172A]/85 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
              {step.description}
            </p>

            {/* Features Bullet Points */}
            {step.features && step.features.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Keunggulan & Fungsi:
                </p>
                {step.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#0F172A]">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-700 grid place-items-center shrink-0 mt-0.5">
                      <Check size={11} />
                    </div>
                    <span className="leading-snug text-[11px] font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Note banner if available */}
            {step.note && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] font-semibold text-amber-900">
                <Sparkles size={14} className="text-amber-600 shrink-0" />
                <span>{step.note}</span>
              </div>
            )}
          </div>

          {/* Paging Dots & Navigation Controls (Pinned Footer) */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0] gap-2 shrink-0">
            {/* Step Dots */}
            <div className="flex items-center gap-1">
              {ADMIN_TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === i
                      ? "w-4 bg-[#1E3A8A]"
                      : "w-1.5 bg-[#CBD5E1] hover:bg-slate-400"
                  }`}
                  aria-label={`Ke langkah ${i + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-100 text-xs font-bold text-[#0F172A] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                  data-testid="btn-prev-spotlight"
                >
                  <ChevronLeft size={14} />
                  <span>Sebelumnya</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#162E6E] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                data-testid="btn-next-spotlight"
              >
                <span>{isLast ? "Selesai & Mulai" : "Lanjut"}</span>
                {isLast ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
