import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CreditCard,
  Wrench,
  Zap,
  Bell,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Building2,
  ShieldCheck,
  QrCode,
  Check,
  ArrowRight,
  Clock,
  Megaphone,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TENANT_SLIDES = [
  {
    id: "room_status",
    badge: "Langkah 1 dari 4",
    title: "Status Kamar & Hunian 🏠",
    subtitle: "Akses informasi hunian 24/7",
    description: "Pantau detail kamar, tipe fasilitas lengkap, dan masa aktif sewa Anda secara real-time.",
    graphicType: "room",
    icon: Home,
    accentColor: "#1E3A8A",
    secondaryColor: "#0D9488",
    features: [
      "Detail unit kamar aktif, nomor lantai, dan kapasitas",
      "Daftar inventaris & fasilitas kamar terdata rapi",
      "Masa sewa dan countdown jatuh tempo transparan",
    ],
  },
  {
    id: "billing_electricity",
    badge: "Langkah 2 dari 4",
    title: "Tagihan & Meteran Listrik ⚡",
    subtitle: "Invoice otomatis & struk lunas digital",
    description: "Pantau tagihan sewa dan pencatatan kWh meteran listrik, serta kirim bukti transfer instan.",
    graphicType: "billing",
    icon: CreditCard,
    accentColor: "#0D9488",
    secondaryColor: "#D97706",
    features: [
      "Rincian biaya sewa dan utilitas transparan",
      "Pembayaran instan via QRIS, BCA, dan Transfer Bank",
      "Pencatatan angka meteran kWh listrik bulanan otomatis",
    ],
  },
  {
    id: "complaints_maintenance",
    badge: "Langkah 3 dari 4",
    title: "Pusat Komplain & Perbaikan 🛠️",
    subtitle: "Respon cepat tim teknisi Lewi House",
    description: "Laporkan kendala fasilitas kamar dengan foto dan pantau progres kerja teknisi langsung.",
    graphicType: "complaints",
    icon: Wrench,
    accentColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    features: [
      "Form komplain praktis dengan kategori & foto kendala",
      "Status pelacakan real-time: Pending → Diproses → Selesai",
      "Histori servis tersimpan untuk jaminan kenyamanan",
    ],
  },
  {
    id: "notifications_broadcast",
    badge: "Langkah 4 dari 4",
    title: "Pusat Notifikasi & Pengumuman 🔔",
    subtitle: "Pusat informasi gedung terpadu",
    description: "Dapatkan info tagihan baru, status perbaikan kamar, dan siaran pengumuman penting gedung.",
    graphicType: "notifications",
    icon: Bell,
    accentColor: "#0D9488",
    secondaryColor: "#7C3AED",
    features: [
      "Lonceng aktivitas dengan pemisah kategori cerdas",
      "Pemberitahuan in-app toast & web push real-time",
      "Akses chat bantuan 1-on-1 dengan pengelola kosan",
    ],
  },
];

export default function TenantOnboardingCarousel({
  open,
  onClose,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateUser } = useAuth();

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  if (!open) return null;

  const activeSlide = TENANT_SLIDES[currentStep] || TENANT_SLIDES[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TENANT_SLIDES.length - 1;

  const markCompleted = async () => {
    try {
      await api.post("/auth/complete-onboarding");
    } catch {}
    localStorage.setItem("lh_tour_tenant_completed", "true");
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

  const handleSkip = () => {
    markCompleted();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        data-testid="tenant-onboarding-overlay"
      >
        {/* Backdrop 75% dark overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-sm"
          data-testid="tenant-onboarding-backdrop"
        />

        {/* Full-screen / Adaptive Mobile Carousel Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]"
          data-testid="tenant-onboarding-modal"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar Action */}
          <div className="px-5 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {/* Logo Lewi House */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 grid place-items-center text-[#1E3A8A] border border-[#1E3A8A]/20">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest leading-none">
                  Lewi House Medan
                </p>
                <p className="text-xs font-bold text-[#0F172A] mt-0.5 leading-tight">
                  {activeSlide.badge}
                </p>
              </div>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/70 active:scale-95 transition-all border border-slate-200"
              data-testid="btn-skip-tenant-tour"
            >
              <span>✕ Lewati</span>
            </button>
          </div>

          {/* Carousel Slide Body */}
          <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* 1. Hero Graphic Area (45% Height Proportional Preview) */}
                <div className="relative w-full h-44 sm:h-48 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] overflow-hidden p-3.5 flex flex-col justify-center items-center shadow-inner">
                  {/* Visual Background Accents */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#1E3A8A]/5 blur-xl pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#0D9488]/10 blur-xl pointer-events-none" />

                  {activeSlide.graphicType === "room" && (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-[#E2E8F0] shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-[#1E3A8A]/10 text-[#1E3A8A] text-[10px] font-bold">
                          Unit K-204 • Lantai 2
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif Ditempati
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-[#0D9488]/15 text-[#0D9488] grid place-items-center shrink-0">
                          <Home size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0F172A]">Tipe A (Exclusive Queen)</p>
                          <p className="text-[10px] text-[#64748B]">AC • Kamar Mandi Dalam • Smart TV • WiFi</p>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#64748B]">
                        <span>Jatuh Tempo: 5 Tiap Bulan</span>
                        <span className="font-bold text-[#1E3A8A]">Sewa Mandiri ✓</span>
                      </div>
                    </div>
                  )}

                  {activeSlide.graphicType === "billing" && (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-[#E2E8F0] shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#64748B]">INV-2026/08/K204</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-bold">
                          Belum Bayar
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[#64748B]">Total Tagihan Sewa + Listrik</p>
                          <p className="text-sm font-bold text-[#0F172A]">Rp 2.450.000</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-[#0D9488]/15 text-[#0D9488] text-[10px] font-bold flex items-center gap-1">
                          <Zap size={11} />
                          <span>132.5 kWh</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0F172A] text-[9px] font-bold flex items-center gap-1">
                          <QrCode size={10} /> QRIS
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0F172A] text-[9px] font-bold">
                          BCA Transfer
                        </span>
                        <span className="ml-auto text-[9px] text-[#0D9488] font-bold">Unggah Bukti ➔</span>
                      </div>
                    </div>
                  )}

                  {activeSlide.graphicType === "complaints" && (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-[#E2E8F0] shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 text-[10px] font-bold">
                          Tiket #108: Cuci Filter AC
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                          <Clock size={10} /> Diproses
                        </span>
                      </div>
                      {/* Step Progress Bar */}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" />
                        <div className="h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <div className="h-1.5 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                        <span>Teknisi: Pak Bambang</span>
                        <span className="text-emerald-700 font-bold">Respon &lt; 30 mnt</span>
                      </div>
                    </div>
                  )}

                  {activeSlide.graphicType === "notifications" && (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-[#E2E8F0] shadow-md space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-700 grid place-items-center shrink-0">
                          <Megaphone size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[#0F172A] truncate">Info Pengumuman Gedung</p>
                          <p className="text-[9px] text-[#64748B]">Maintenance Pompa Air Utama Besok</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0D9488]/10 border border-[#0D9488]/20 flex items-center justify-between text-[10px]">
                        <span className="text-[#0F172A] font-medium">Notifikasi In-App & Push</span>
                        <span className="text-[#0D9488] font-bold">Real-time ✓</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Headline & Subtitle */}
                <div className="space-y-1 text-center">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0F172A] leading-tight">
                    {activeSlide.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#0D9488]">
                    {activeSlide.subtitle}
                  </p>
                </div>

                {/* 3. Description (Max 2 Lines per PRD) */}
                <p className="text-xs sm:text-sm text-[#0F172A]/90 text-center leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {activeSlide.description}
                </p>

                {/* 4. Features Highlights */}
                <div className="space-y-2 pt-1">
                  {activeSlide.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A]/80">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-700 grid place-items-center shrink-0 mt-0.5">
                        <Check size={11} />
                      </div>
                      <span className="leading-snug font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Footer & Navigation */}
          <div className="px-5 sm:px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3.5">
            {/* Page Dot Indicator */}
            <div className="flex items-center justify-center gap-1.5" data-testid="carousel-dot-indicator">
              {TENANT_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentStep === i
                      ? "w-6 bg-[#1E3A8A]"
                      : "w-2 bg-[#CBD5E1] hover:bg-slate-400"
                  }`}
                  aria-label={`Buka slide ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA Controls */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="h-12 px-4 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-100 text-xs font-bold text-[#0F172A] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                  data-testid="btn-prev-tenant-tour"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Kembali</span>
                </button>
              )}

              {/* Full-width Primary CTA */}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl bg-[#1E3A8A] hover:bg-[#162E6E] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md"
                data-testid="btn-next-tenant-tour"
              >
                <span>{isLast ? "Mulai Jelajahi Aplikasi" : "Lanjut"}</span>
                {isLast ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
