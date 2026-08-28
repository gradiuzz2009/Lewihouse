// src/components/FloatingOnboardingWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  X, 
  Rocket, 
  Bookmark, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Ban,
  Sparkles,
  BookOpen
} from "lucide-react";
import { ONBOARDING_CONFIG, ALL_SCREENS } from "../lib/onboardingTips";

export const ONBOARDING_STORAGE_KEYS = {
  DISABLED: "lh_disable_auto_onboarding",
  SAVED_GUIDES: "lh_saved_guides",
  COMPLETED_SCREENS: "lh_completed_screens",
  DISMISS_COUNT: "lh_onboarding_dismiss_count",
  VISIT_COUNT_PREFIX: "lh_screen_visit_count_"
};

export default function FloatingOnboardingWidget({
  screenKey = "ADMIN_DASHBOARD",
  role = "admin", // "admin" | "tenant" | "owner"
  onStartTour
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showQuickTips, setShowQuickTips] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);
  const [completedScreens, setCompletedScreens] = useState([]);
  const quickTipsTimerRef = useRef(null);

  const config = ONBOARDING_CONFIG[screenKey] || {
    screenKey,
    title: "Panduan Layar",
    quickTips: ["Pelajari fungsi dan alur kerja layar ini."],
    helpUrl: "https://lewihouse.com/guide"
  };

  useEffect(() => {
    // 1. Cek apakah dinonaktifkan secara permanen
    const permanentlyDisabled = localStorage.getItem(ONBOARDING_STORAGE_KEYS.DISABLED) === "true";
    if (permanentlyDisabled) {
      setIsVisible(false);
      return;
    }

    // 2. Cek apakah sudah ditutup pada sesi saat ini untuk layar ini
    const dismissedThisSession = sessionStorage.getItem(`lh_dismiss_${screenKey}`) === "true";
    if (dismissedThisSession) {
      setIsVisible(false);
      return;
    }

    // 3. Track visit count per screen
    const visitKey = `${ONBOARDING_STORAGE_KEYS.VISIT_COUNT_PREFIX}${screenKey}`;
    const visits = parseInt(localStorage.getItem(visitKey) || "0", 10) + 1;
    localStorage.setItem(visitKey, visits.toString());

    // 4. Status saved guides & completed screens
    try {
      const saved = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEYS.SAVED_GUIDES) || "[]");
      setIsSaved(saved.some((item) => item.screenKey === screenKey));
    } catch {
      setIsSaved(false);
    }

    try {
      const completed = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED_SCREENS) || "[]");
      setCompletedScreens(completed);
    } catch {
      setCompletedScreens([]);
    }

    const dCount = parseInt(localStorage.getItem(ONBOARDING_STORAGE_KEYS.DISMISS_COUNT) || "0", 10);
    setDismissCount(dCount);

    // 5. Smart Timing: Muncul setelah delay 3 detik
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [screenKey]);

  // Clean up auto-dismiss timer for quick tips
  useEffect(() => {
    if (showQuickTips) {
      quickTipsTimerRef.current = setTimeout(() => {
        setShowQuickTips(false);
      }, 10000); // 10 seconds auto-dismiss
    } else if (quickTipsTimerRef.current) {
      clearTimeout(quickTipsTimerRef.current);
    }

    return () => {
      if (quickTipsTimerRef.current) clearTimeout(quickTipsTimerRef.current);
    };
  }, [showQuickTips]);

  // Option 1: Start Tour (Primary Action)
  const handleStartTour = () => {
    setIsVisible(false);

    // Update completed screens state & storage
    try {
      const completed = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED_SCREENS) || "[]");
      if (!completed.includes(screenKey)) {
        completed.push(screenKey);
        localStorage.setItem(ONBOARDING_STORAGE_KEYS.COMPLETED_SCREENS, JSON.stringify(completed));
        setCompletedScreens(completed);
      }
    } catch (e) {
      console.warn("Failed to update completed screens", e);
    }

    if (onStartTour) {
      onStartTour(screenKey);
    }
  };

  // Option 2: Close (Dismiss Once for session)
  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem(`lh_dismiss_${screenKey}`, "true");

    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.DISMISS_COUNT, newCount.toString());
  };

  // Option 3: Never Show (Permanently Dismiss)
  const handleNeverShow = () => {
    setIsVisible(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.DISABLED, "true");
  };

  // Option 4: Save Guide (Bookmark for Later)
  const handleSaveGuide = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEYS.SAVED_GUIDES) || "[]");
      let updated;
      if (isSaved) {
        updated = saved.filter((item) => item.screenKey !== screenKey);
        setIsSaved(false);
      } else {
        updated = [...saved, { 
          screenKey, 
          title: config.title, 
          role,
          savedAt: new Date().toISOString() 
        }];
        setIsSaved(true);
      }
      localStorage.setItem(ONBOARDING_STORAGE_KEYS.SAVED_GUIDES, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save guide", e);
    }
  };

  // Option 5: Quick Help (Contextual Tooltip Toggle)
  const handleToggleQuickTips = () => {
    setShowQuickTips((prev) => !prev);
  };

  if (!isVisible) return null;

  const completedCount = completedScreens.length;
  const totalScreens = ALL_SCREENS.length;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-[999] w-[calc(100vw-1.5rem)] max-w-[340px] bg-[#11241C] text-white rounded-2xl border-2 border-secondary/40 shadow-[0_16px_50px_rgba(0,0,0,0.4)] overflow-hidden font-sans backdrop-blur-md"
        aria-label="Panduan Layar Terapung"
        data-testid="floating-onboarding-widget"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0C1B14] border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-secondary/20 text-secondary border border-secondary/30 grid place-items-center shrink-0">
              <Compass size={14} className="text-secondary" />
            </div>
            <span className="text-xs font-bold text-white font-serif tracking-wide truncate">
              {config.title}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-6 h-6 rounded-md hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition-colors shrink-0"
            title="Tutup sesi ini"
            data-testid="btn-floating-close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-3">
          {/* Gentle Reminder or Default Intro */}
          {dismissCount >= 3 ? (
            <p className="text-[11px] text-amber-200 leading-relaxed bg-secondary/20 p-2.5 rounded-xl border border-secondary/40 font-medium">
              💡 Butuh bantuan? Anda dapat memulai tur panduan fitur kapan saja.
            </p>
          ) : (
            <p className="text-[11px] text-white/85 leading-relaxed font-normal">
              Pelajari fitur utama pada halaman ini untuk mempercepat alur kerja kosan Anda.
            </p>
          )}

          {/* Quick Help Tips Box (Option 5) */}
          <AnimatePresence>
            {showQuickTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-[#0A1711] rounded-xl p-3 border border-secondary/30 space-y-2"
                data-testid="floating-quick-tips"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-secondary flex items-center gap-1">
                    <Sparkles size={11} /> 3 Tips Cepat
                  </span>
                  <span className="text-[9px] text-white/50">10s auto-hide</span>
                </div>
                <ul className="text-[11px] text-white/90 space-y-1.5 pl-0.5">
                  {config.quickTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-secondary font-bold shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Action: Start Tour */}
          <button
            type="button"
            onClick={handleStartTour}
            data-testid="btn-floating-start-tour"
            className="w-full py-2.5 px-3 rounded-xl bg-secondary text-[#11241C] hover:bg-[#D4B98E] text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Rocket size={14} className="text-[#11241C]" />
            <span>🚀 1. Mulai Tur Panduan</span>
          </button>

          {/* Secondary Actions: Close & Never Show */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleClose}
              data-testid="btn-floating-dismiss"
              className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-[11px] font-semibold border border-white/15 transition-all text-center active:scale-95"
            >
              ✕ 2. Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleNeverShow}
              data-testid="btn-floating-never-show"
              className="py-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white text-[11px] font-semibold border border-red-500/30 transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <Ban size={11} />
              <span>🚫 3. Jangan Tampil</span>
            </button>
          </div>

          {/* Lite Additions: Option 4 (Save Guide) & Option 5 (Quick Help) */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSaveGuide}
              data-testid="btn-floating-save-guide"
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                isSaved ? "text-secondary font-bold" : "text-white/70 hover:text-white"
              }`}
            >
              <Bookmark size={13} className={isSaved ? "fill-secondary text-secondary" : ""} />
              <span>{isSaved ? "📌 Tersimpan" : "📌 Simpan Panduan"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleQuickTips}
              data-testid="btn-floating-toggle-tips"
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors"
            >
              <HelpCircle size={13} />
              <span>{showQuickTips ? "💬 Tutup Tips" : "💬 Quick Help"}</span>
              {showQuickTips ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Footer: Simple Progress Tracking & Help Center Link */}
        <div className="px-3.5 py-1.5 bg-[#0C1B14] border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
          <span className="font-medium">
            📊 {completedCount} dari {totalScreens} layar selesai
          </span>
          <a
            href={config.helpUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-secondary hover:text-amber-200 transition-colors font-medium"
            data-testid="link-floating-help-center"
          >
            <BookOpen size={10} />
            <span>Semua Panduan</span>
            <ExternalLink size={9} />
          </a>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
