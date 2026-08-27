import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { api, fmtIDR, monthLabel } from "../lib/api";
import { History, TrendingUp, AlertCircle, Sparkles, KeyRound, LogOut, Wrench, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui";
import SpeedDial from "../components/SpeedDial";
import { useAuth } from "../context/AuthContext";

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
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { logout } = useAuth();

  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.get("/dashboard/summary"), api.get("/reports/monthly?months=6")]);
      setS(a.data);
      setChart(b.data.map((d) => ({ ...d, label: monthLabel(d.period).split(" ")[0] })));
    } catch (e) {
      if (e.response?.status !== 401) toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      <div className="relative h-80 overflow-hidden">
        <img src={HERO} alt="Property" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a15] via-[#0e1a15]/70 to-[#0e1a15]/35" />
        <div className="relative z-10 h-full flex flex-col justify-between px-6 pt-6 pb-16 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Selamat datang</p>
              <h1 className="font-serif text-3xl leading-tight mt-1">Lewi House</h1>
              <p className="text-xs text-white/60 mt-1 capitalize">{today}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => nav("/staff")}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 grid place-items-center active:scale-95"
                title="Manajemen Staff"
                data-testid="staff-btn"
              >
                <Users size={16} />
              </button>
              <button
                onClick={() => nav("/access")}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 grid place-items-center active:scale-95"
                data-testid="access-btn"
              >
                <KeyRound size={16} />
              </button>
              <button
                onClick={() => nav("/activity")}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 grid place-items-center active:scale-95"
                data-testid="activity-btn"
              >
                <History size={16} />
              </button>
              <button
                onClick={doLogout}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 grid place-items-center active:scale-95"
                data-testid="logout-btn"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-secondary/90">Pendapatan Bulan Ini</p>
            <p className="font-serif text-3xl mt-1 tnum" data-testid="revenue-month">
              {fmtIDR(s?.revenue_month || 0)}
            </p>
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
            testid="metric-occupancy"
          />
          <MetricCard
            title="Belum Bayar"
            value={fmtIDR(s?.outstanding || 0)}
            sub={`${s?.unpaid_count ?? 0} tagihan tertunda`}
            danger={(s?.unpaid_count ?? 0) > 0}
            compact
            testid="metric-outstanding"
          />
        </div>

        {/* Room state row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniStat label="Terisi" value={s?.rooms_occupied ?? 0} dot="bg-blue-600" icon="■" />
          <MiniStat label="Tersedia" value={s?.rooms_available ?? 0} dot="bg-emerald-600" icon="●" />
          <MiniStat label="Dipesan" value={s?.rooms_reserved ?? 0} dot="bg-amber-600" icon="▲" />
          <MiniStat label="Dibersihkan" value={s?.rooms_cleaning ?? 0} dot="bg-teal-600" icon="◆" />
          <MiniStat label="Perbaikan" value={s?.rooms_maintenance ?? 0} dot="bg-rose-600" icon="✕" />
          <MiniStat label="Token Aktif" value={s?.active_tokens ?? 0} dot="bg-[#1A362B]" icon="★" />
        </div>

        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 bg-surface rounded-2xl p-5 border border-line shadow-soft"
          data-testid="revenue-chart-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Pendapatan 6 Bulan</p>
              <p className="font-serif text-lg text-primary">Ritme Kas</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-primary/5 grid place-items-center">
              <TrendingUp size={14} className="text-primary" />
            </span>
          </div>
          <div className="h-32 -mx-2">
            <ResponsiveContainer>
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

        {/* Alerts */}
        {(s?.active_maintenance ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => nav("/complaints")}
            className="mt-4 rounded-2xl bg-primary text-white p-5 flex items-center gap-4 active:scale-[0.99] transition-transform"
            data-testid="alert-maintenance"
          >
            <span className="w-10 h-10 rounded-full bg-secondary/20 grid place-items-center shrink-0">
              <Wrench size={18} className="text-secondary" />
            </span>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">Perlu perhatian</p>
              <p className="text-sm mt-0.5">{s.active_maintenance} tiket perbaikan sedang berjalan</p>
            </div>
            <AlertCircle size={16} className="text-secondary" />
          </motion.div>
        )}

        {/* Gallery */}
        <div className="mt-6" data-testid="property-gallery">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Galeri Properti</p>
              <p className="font-serif text-lg text-primary">Lewi House</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
            {GALLERY.map((g) => (
              <div
                key={g.label}
                className="shrink-0 w-56 snap-start rounded-2xl overflow-hidden border border-line shadow-soft bg-surface"
                data-testid={`gallery-item-${g.label}`}
              >
                <img src={g.src} alt={g.label} className="w-full h-36 object-cover" loading="lazy" />
                <p className="px-3 py-2.5 text-[11px] font-semibold text-primary">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seed */}
        {loading === false && s?.rooms_total === 0 && (
          <div className="mt-6 border border-dashed border-line rounded-2xl p-6 text-center">
            <Sparkles size={22} className="mx-auto text-secondary mb-2" />
            <p className="font-serif text-lg text-primary mb-1">Mulai dengan data contoh</p>
            <p className="text-xs text-subtle mb-4">Isi kamar, penghuni & tagihan demo untuk eksplorasi cepat.</p>
            <Button onClick={seed} testid="seed-btn">
              Muat Data Contoh
            </Button>
          </div>
        )}
        {loading === false && (s?.rooms_total ?? 0) > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Reset semua data dan muat ulang data contoh? Data saat ini akan dihapus.")) seed();
            }}
            className="mt-6 mx-auto block text-[11px] text-subtle underline underline-offset-4 active:scale-95"
            data-testid="reseed-btn"
          >
            Reset & muat ulang data contoh
          </button>
        )}

        <div className="h-8" />
      </div>
      <SpeedDial />
    </div>
  );
}

function MetricCard({ title, value, sub, danger, compact, testid }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-5 border shadow-soft ${danger ? "bg-primary text-white border-primary" : "bg-surface border-line"}`}
      data-testid={testid}
    >
      <p className={`text-[10px] uppercase tracking-[0.2em] ${danger ? "text-secondary" : "text-subtle"}`}>{title}</p>
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
