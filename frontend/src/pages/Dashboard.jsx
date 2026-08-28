import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { api, fmtIDR, fmtDateTime, monthLabel } from "../lib/api";
import { History, TrendingUp, AlertCircle, Sparkles, KeyRound, LogOut, Wrench, Users, CreditCard, Zap, Megaphone, ArrowRight, HelpCircle, Compass, Info, Building2, ChevronRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui";
import UserIndicator from "../components/UserIndicator";
import OnboardingTourModal from "../components/OnboardingTourModal";
import TourOfferModal from "../components/TourOfferModal";
import PropertyInfoModal from "../components/PropertyInfoModal";
import RevenueDetailsModal from "../components/RevenueDetailsModal";
import { useAuth } from "../context/AuthContext";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const HERO = "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/rbo24c8q_agoda-01-view.webp";

const GALLERY = [
  { src: HERO, label: "Tampak Depan" },
  { src: "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/nu2bu3d8_agoda-04-lobby.webp", label: "Lobi & Resepsionis" },
  { src: "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/biwap049_agoda-10-deluxe-bed.webp", label: "Kamar Deluxe" },
  { src: "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/styxa5t5_agoda-12-superior-single.webp", label: "Kamar Superior Single" },
];

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [chart, setChart] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [tourOpen, setTourOpen] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [propInfoOpen, setPropInfoOpen] = useState(false);
  const [revenueDetailsOpen, setRevenueDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { user, logout } = useAuth();

  // Auto Trigger Onboarding Spotlight Tour on first entry for Admin / Owner
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem("lh_tour_admin_completed") === "true" || user?.has_completed_onboarding;
    const hasShownSession = sessionStorage.getItem("lh_tour_shown_admin");
    if (user && !hasCompletedTour && !hasShownSession) {
      setTourOpen(true);
      sessionStorage.setItem("lh_tour_shown_admin", "true");
    }
  }, [user]);

  const handleStartTour = () => {
    setShowOffer(false);
    setTourOpen(true);
  };

  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/reports/monthly?months=6"),
        api.get("/activity/feed?limit=6"),
      ]);
      if (a?.data && typeof a.data === "object") {
        setS(a.data);
      }
      if (Array.isArray(b?.data)) {
        setChart(b.data.map((d) => ({ ...d, label: monthLabel(d?.period).split(" ")[0] })));
      } else {
        setChart([]);
      }
      if (Array.isArray(c?.data)) {
        setActivityFeed(c.data);
      } else {
        setActivityFeed([]);
      }
    } catch (e) {
      if (e.response?.status !== 401) toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(load);

  const seed = async () => {
    try {
      await api.post("/seed");
      toast.success("Data contoh berhasil dimuat");
      load();
    } catch {
      toast.error("Gagal seed");
    }
  };

  const doLogout = async () => {
    await logout();
    nav("/login");
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="fade-up" data-testid="dashboard-page">
      {/* Hero */}
      <div className="relative min-h-[350px] overflow-hidden">
        <img src={HERO} alt="Property" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a15] via-[#0e1a15]/75 to-[#0e1a15]/40" />
        <div className="relative z-10 h-full flex flex-col justify-between px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-12 text-white">
          {/* Top Bar: User Indicator & Action Icons */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <UserIndicator compact />
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Admin Top Bar Pill Button (hidden on mobile, available inside UserIndicator) */}
              <button
                onClick={() => setTourOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold active:scale-95 transition-all shadow-soft shrink-0"
                title="Mulai Tur Panduan Dashboard"
                data-testid="btn-dashboard-tour"
              >
                <Compass size={14} className="text-secondary" />
                <span>Panduan Fitur</span>
              </button>

              <button
                onClick={() => setPropInfoOpen(true)}
                className="w-9 h-9 rounded-full bg-secondary/25 backdrop-blur-md border border-secondary/40 grid place-items-center active:scale-95 hover:bg-secondary/40 transition-all shadow-soft text-secondary shrink-0"
                title="Panduan & Informasi Lewi House Medan"
                data-testid="btn-property-info"
              >
                <Building2 size={16} />
              </button>
              <button
                onClick={() => nav("/staff")}
                className="hidden sm:grid w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 place-items-center active:scale-95 hover:bg-white/20 transition-all shadow-soft text-white shrink-0"
                title="Manajemen Staff"
                data-testid="staff-btn"
              >
                <Users size={15} />
              </button>
              <button
                onClick={() => nav("/access")}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center active:scale-95 hover:bg-white/20 transition-all shadow-soft text-white shrink-0"
                data-testid="access-btn"
                title="Akses & Token"
              >
                <KeyRound size={15} />
              </button>
              <button
                onClick={() => nav("/activity")}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center active:scale-95 hover:bg-white/20 transition-all shadow-soft text-white shrink-0"
                data-testid="activity-btn"
                title="Riwayat Aktivitas"
              >
                <History size={15} />
              </button>
              <button
                onClick={doLogout}
                className="w-9 h-9 rounded-full bg-rose-500/30 hover:bg-rose-600 border border-rose-400/40 grid place-items-center active:scale-95 text-white transition-all shadow-soft shrink-0"
                data-testid="logout-btn"
                title="Keluar dari Akun"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Welcome Greeting */}
          <div className="my-2">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Selamat datang</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90 font-medium">Medan Petisah</span>
            </div>
            <h1 className="font-serif text-3xl leading-tight mt-0.5 font-bold">Lewi House Medan</h1>
            <p className="text-xs text-white/70 mt-0.5">Kost Eksklusif & Guesthouse Syariah (17 Kamar • 4 Lantai)</p>
          </div>

          {/* Revenue (Clickable to show details) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setRevenueDetailsOpen(true)}
              className="text-left group cursor-pointer active:scale-[0.99] transition-all block focus:outline-none"
              data-testid="revenue-month-card"
              title="Klik untuk melihat rincian pendapatan bulan ini"
            >
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-secondary/90 font-bold">Pendapatan Bulan Ini</p>
                <span className="inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 text-secondary bg-secondary/20 rounded-full font-bold border border-secondary/30 group-hover:bg-secondary group-hover:text-primary transition-all shadow-2xs">
                  <span>Lihat Rincian</span>
                  <ChevronRight size={11} />
                </span>
              </div>
              <p className="font-serif text-3xl mt-0.5 tnum font-bold text-white group-hover:text-secondary transition-colors" data-testid="revenue-month">
                {fmtIDR(s?.revenue_month || 0)}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 -mt-6 relative z-20">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Okupansi"
            value={`${s?.occupancy_rate ?? 0}%`}
            sub={`${s?.rooms_occupied ?? 0} dari ${s?.rooms_total ?? 0} kamar`}
            onClick={() => nav("/rooms")}
            clickable
            testid="metric-occupancy"
          />
          <div data-tour-target="tour-target-payment-verification" id="tour-target-payment-verification">
            <MetricCard
              title="Belum Bayar"
              value={fmtIDR(s?.outstanding || 0)}
              sub={`${s?.unpaid_count ?? 0} tagihan tertunda`}
              danger={(s?.unpaid_count ?? 0) > 0}
              compact
              onClick={() => nav("/bills")}
              clickable
              testid="metric-outstanding"
            />
          </div>
        </div>

        {/* Room state row (Spotlight Target: Grid Kamar & Status Unit) */}
        <div
          className="mt-3 grid grid-cols-3 gap-2 cursor-pointer"
          data-tour-target="tour-target-room-grid"
          id="tour-target-room-grid"
          onClick={() => nav("/rooms")}
          title="Buka Manajemen Kamar"
        >
          <MiniStat label="Terisi" value={s?.rooms_occupied ?? 0} dot="bg-blue-600" icon="■" />
          <MiniStat label="Tersedia" value={s?.rooms_available ?? 0} dot="bg-emerald-600" icon="●" />
          <MiniStat label="Dipesan" value={s?.rooms_reserved ?? 0} dot="bg-amber-600" icon="▲" />
          <MiniStat label="Dibersihkan" value={s?.rooms_cleaning ?? 0} dot="bg-teal-600" icon="◆" />
          <MiniStat label="Perbaikan" value={s?.rooms_maintenance ?? 0} dot="bg-rose-600" icon="✕" />
          <MiniStat label="Token Aktif" value={s?.active_tokens ?? 0} dot="bg-[#1A362B]" icon="★" />
        </div>

        {/* Revenue chart (Spotlight Target: Metrik Keuangan & Okupansi) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 bg-surface rounded-2xl p-5 border border-line shadow-soft cursor-pointer hover:border-primary/40 transition-all"
          data-testid="revenue-chart-card"
          data-tour-target="tour-target-financial-metrics"
          id="tour-target-financial-metrics"
          onClick={() => setRevenueDetailsOpen(true)}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Pendapatan 6 Bulan</p>
              <div className="flex items-center gap-1.5">
                <p className="font-serif text-lg text-primary">Ritme Kas</p>
                <span className="text-[10px] text-primary/70 font-semibold underline">Rincian</span>
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-primary/5 grid place-items-center">
              <TrendingUp size={14} className="text-primary" />
            </span>
          </div>
          <div className="h-32 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5C5C5C" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(26,54,43,0.06)" }}
                  contentStyle={{ background: "#1A362B", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
                  formatter={(v) => [fmtIDR(v), "Pendapatan"]}
                  labelStyle={{ color: "#C6A87C", fontSize: 10 }}
                />
                <Bar dataKey="income" radius={[8, 8, 2, 2]}>
                  {chart.map((_, i) => (
                    <Cell key={i} fill={i === chart.length - 1 ? "#1A362B" : "#C6A87C"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Alerts & Complaints (Spotlight Target: Manajemen Komplain) */}
        <div data-tour-target="tour-target-complaints-management" id="tour-target-complaints-management">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => nav("/complaints")}
            className="mt-4 rounded-2xl bg-primary text-white p-5 flex items-center gap-4 active:scale-[0.99] transition-transform cursor-pointer"
            data-testid="alert-maintenance"
          >
            <span className="w-10 h-10 rounded-full bg-secondary/20 grid place-items-center shrink-0">
              <Wrench size={18} className="text-secondary" />
            </span>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">Perlu perhatian</p>
              <p className="text-sm mt-0.5">{s?.active_maintenance || 0} keluhan perbaikan sedang berjalan</p>
            </div>
            <AlertCircle size={16} className="text-secondary" />
          </motion.div>
        </div>

        {/* Live Activity Feed Widget */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 bg-surface rounded-3xl p-5 border border-line shadow-soft"
          data-testid="live-activity-feed-widget"
        >
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-line/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="font-bold text-xs sm:text-sm text-ink leading-tight">Aktivitas Terkini</p>
                <p className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase">Live Real-time Sync</p>
              </div>
            </div>
            <button
              onClick={() => nav("/activity")}
              className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg transition-all"
              data-testid="view-all-activity-btn"
            >
              <span>Semua Log</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {activityFeed.length === 0 ? (
              <p className="text-xs text-subtle text-center py-4">Belum ada aktivitas baru hari ini.</p>
            ) : (
              activityFeed.map((item, idx) => {
                const mod = (item?.module || "SYSTEM").toUpperCase();
                const isBilling = mod === "BILLING";
                const isMaint = mod === "MAINTENANCE";
                const isElectricity = mod === "ELECTRICITY";
                const isAnnounce = mod === "ANNOUNCEMENT";

                const icon = isBilling ? <CreditCard size={14} className="text-amber-600" />
                  : isMaint ? <Wrench size={14} className="text-emerald-600" />
                  : isElectricity ? <Zap size={14} className="text-blue-600" />
                  : isAnnounce ? <Megaphone size={14} className="text-purple-600" />
                  : <History size={14} className="text-primary" />;

                const actionLabel = isBilling ? "Tinjau" : isMaint ? "Tugaskan" : "Buka";

                return (
                  <div
                    key={item?.id || idx}
                    className="p-3 bg-muted/30 hover:bg-muted/60 border border-line/60 rounded-2xl flex items-center justify-between gap-3 transition-all"
                    data-testid={`activity-feed-item-${item?.id || idx}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-surface border border-line grid place-items-center shrink-0 shadow-2xs">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate leading-tight">
                          <span className="font-mono text-primary mr-1">[{item?.room_unit || "Unit -"}]</span>
                          {item?.title || "Aktivitas"}
                        </p>
                        <p className="text-[10px] text-subtle truncate mt-0.5 font-medium">
                          {item?.message || item?.actor || "-"} &bull; {fmtDateTime(item?.created_at)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => nav(item?.action_url || "/activity")}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface border border-line text-primary hover:bg-primary hover:text-white transition-all shrink-0 shadow-2xs active:scale-95"
                    >
                      {actionLabel}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Quick links */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => nav("/rooms")}
            className="p-4 rounded-2xl bg-surface border border-line flex items-center gap-3 active:scale-[0.98] transition-transform text-left shadow-soft hover:border-primary/40"
            data-testid="quick-rooms"
          >
            <span className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold">17</span>
            <div>
              <p className="text-xs font-bold text-ink">Semua Kamar</p>
              <p className="text-[11px] text-subtle">Status & tarif</p>
            </div>
          </button>

          <button
            onClick={() => nav("/bills")}
            className="p-4 rounded-2xl bg-surface border border-line flex items-center gap-3 active:scale-[0.98] transition-transform text-left shadow-soft hover:border-primary/40"
            data-testid="quick-bills"
          >
            <span className="w-9 h-9 rounded-xl bg-secondary/30 grid place-items-center text-primary">
              <CreditCard size={16} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Penagihan</p>
              <p className="text-[11px] text-subtle">Buat & kelola</p>
            </div>
          </button>
        </div>

        {/* Property Gallery Preview */}
        <div className="mt-6 bg-surface rounded-2xl p-5 border border-line shadow-soft" data-testid="gallery-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Dokumentasi</p>
              <p className="font-serif text-lg text-primary">Galeri Properti</p>
            </div>
            <button
              onClick={() => setPropInfoOpen(true)}
              className="text-[11px] text-secondary font-bold flex items-center gap-1 hover:underline"
            >
              <span>Info Properti</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GALLERY.map((g, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                <img
                  src={g.src}
                  alt={g.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                  <p className="text-[11px] text-white font-medium drop-shadow">{g.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-line text-center text-xs text-subtle space-y-1">
          <p className="font-serif text-primary text-sm font-semibold">Lewi House Medan</p>
          <p>Jl. Sei Petani No. 12, Medan Petisah &bull; 0812-6296-0211</p>
          <p className="text-[10px] text-subtle/80">{today}</p>
        </div>

        {/* Quick action buttons (Logout & Seed) */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={seed}
            className="flex-1 h-10 rounded-xl bg-surface border border-line text-xs font-semibold text-subtle hover:text-ink active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            data-testid="seed-btn"
          >
            <Sparkles size={14} className="text-secondary" />
            <span>Muat Data Contoh</span>
          </button>
          <button
            onClick={doLogout}
            className="h-10 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>

        <div className="h-8" />
      </div>

      {/* Offer Walkthrough Popup on Login */}
      <TourOfferModal
        open={showOffer}
        onClose={() => setShowOffer(false)}
        onStartTour={handleStartTour}
        role={user?.role || "admin"}
      />

      {/* Property Information & Specifications Modal */}
      <PropertyInfoModal
        open={propInfoOpen}
        onClose={() => setPropInfoOpen(false)}
      />

      {/* Monthly Revenue Details Modal */}
      <RevenueDetailsModal
        open={revenueDetailsOpen}
        onClose={() => setRevenueDetailsOpen(false)}
        summary={s}
      />

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

function MetricCard({ title, value, sub, danger, compact, onClick, clickable, testid }) {
  return (
    <motion.div
      whileHover={clickable ? { y: -2 } : undefined}
      onClick={onClick}
      className={`rounded-2xl p-5 border shadow-soft transition-all ${
        clickable ? "cursor-pointer active:scale-[0.98]" : ""
      } ${
        danger
          ? "bg-primary text-white border-primary"
          : "bg-surface border-line hover:border-primary/40"
      }`}
      data-testid={testid}
    >
      <div className="flex items-center justify-between gap-1">
        <p className={`text-[10px] uppercase tracking-[0.2em] ${danger ? "text-secondary" : "text-subtle"}`}>{title}</p>
        {clickable && (
          <ChevronRight size={12} className={danger ? "text-secondary/70" : "text-subtle"} />
        )}
      </div>
      <p className={`font-serif mt-2 tnum whitespace-nowrap ${compact ? "text-lg" : "text-2xl"} ${danger ? "text-white" : "text-primary"}`}>{value}</p>
      <p className={`text-[11px] mt-1 ${danger ? "text-white/70" : "text-subtle"}`}>{sub}</p>
    </motion.div>
  );
}

function MiniStat({ label, value, dot, icon = "●" }) {
  return (
    <div
      role="status"
      aria-label={`${label}: ${value}`}
      className="bg-surface rounded-xl px-3 py-2.5 border border-line flex items-center gap-2"
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot} grid place-items-center text-[7px] text-white font-bold`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-subtle truncate font-semibold">{label}</p>
        <p className="text-sm font-bold text-ink tnum leading-tight">{value}</p>
      </div>
    </div>
  );
}
