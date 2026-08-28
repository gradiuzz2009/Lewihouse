import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Sparkles, X, ArrowRight, CheckCircle2 } from "lucide-react";

export default function TourOfferModal({
  open,
  onClose,
  onStartTour,
  role = "admin", // "admin" | "tenant"
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const isAdmin = role !== "tenant";

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        data-testid="tour-offer-overlay"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          data-testid="tour-offer-backdrop"
        />

        {/* Small Popup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-sm bg-surface rounded-3xl border border-line shadow-2xl p-6 overflow-hidden z-50 flex flex-col my-auto"
          data-testid="tour-offer-modal"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/60 text-subtle hover:text-ink hover:bg-muted grid place-items-center transition-colors active:scale-95"
            title="Tutup"
            data-testid="btn-close-tour-offer"
          >
            <X size={15} />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary border border-secondary/25 grid place-items-center shrink-0 shadow-soft">
              <Compass size={24} className="text-primary" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles size={11} />
                <span>Panduan Fitur</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-primary leading-tight">
                Selamat Datang! 👋
              </h3>
            </div>
          </div>

          {/* Content Description */}
          <div className="space-y-2 mb-5">
            <p className="text-xs font-semibold text-ink leading-snug">
              {isAdmin
                ? "Apakah Anda ingin melihat tur panduan pengenalan sistem Lewi House Medan?"
                : "Apakah Anda ingin melihat tur panduan fitur portal penghuni Lewi House?"}
            </p>
            <p className="text-[11px] text-subtle leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-line/50">
              {isAdmin
                ? "Pelajari fitur utama manajemen kamar, tagihan WhatsApp dunning, keluhan, dan live activity feed dalam 1 menit."
                : "Pelajari cara cek invoice sewa, bayar QRIS, lapor keluhan perbaikan, dan pantau meteran listrik dalam 1 menit."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onStartTour}
              data-testid="btn-start-walkthrough"
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-[#122820] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lifted"
            >
              <span>Mulai Tur Panduan</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={onClose}
              data-testid="btn-skip-walkthrough"
              className="w-full py-2 px-4 rounded-xl bg-surface hover:bg-muted text-subtle hover:text-ink text-xs font-semibold border border-line active:scale-95 transition-all"
            >
              Tutup / Nanti Saja
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
