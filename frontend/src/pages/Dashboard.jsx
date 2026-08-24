import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { api, fmtIDR, monthLabel } from "../lib/api";
import { Bell, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui";

const HERO = "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwYnVpbGRpbmclMjBleHRlcmlvcnxlbnwwfHx8fDE3ODc1NDM3NTV8MA&ixlib=rb-4.1.0&q=85";

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.get("/dashboard/summary"), api.get("/reports/monthly?months=6")]);
      setS(a.data);
      setChart(b.data.map((d) => ({ ...d, label: monthLabel(d.period).split(" ")[0] })));
    } catch (e) {
      toast.error("Gagal memuat data");
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

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="fade-up" data-testid="dashboard-page">
      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        <img src={HERO} alt="Property" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a15]/95 via-[#0e1a15]/60 to-[#0e1a15]/25" />
        <div className="relative z-10 h-full flex flex-col justify-between px-6 pt-6 pb-16 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Selamat datang</p>
              <h1 className="font-serif text-3xl leading-tight mt-1">Lewi House</h1>
              <p className="text-xs text-white/60 mt-1 capitalize">{today}</p>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 grid place-items-center active:scale-95"
              data-testid="notif-btn"
            >
              <Bell size={16} />
            </button>
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
            testid="metric-outstanding"
          />
        </div>

        {/* Quick stats row */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <MiniStat label="Terisi" value={s?.rooms_occupied ?? 0} dot="bg-success" />
          <MiniStat label="Kosong" value={s?.rooms_vacant ?? 0} dot="bg-secondary" />
          <MiniStat label="Perbaikan" value={s?.rooms_maintenance ?? 0} dot="bg-danger" />
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
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#5C5C5C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(26,54,43,0.06)" }}
                  contentStyle={{
                    background: "#1A362B",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
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
        {(s?.open_complaints ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-4 rounded-2xl bg-primary text-white p-5 flex items-center gap-4"
            data-testid="alert-complaints"
          >
            <span className="w-10 h-10 rounded-full bg-secondary/20 grid place-items-center shrink-0">
              <AlertCircle size={18} className="text-secondary" />
            </span>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">Perlu perhatian</p>
              <p className="text-sm mt-0.5">{s.open_complaints} keluhan menunggu penanganan</p>
            </div>
          </motion.div>
        )}

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

        <div className="h-8" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, danger, testid }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-5 border shadow-soft ${danger ? "bg-primary text-white border-primary" : "bg-surface border-line"}`}
      data-testid={testid}
    >
      <p className={`text-[10px] uppercase tracking-[0.2em] ${danger ? "text-secondary" : "text-subtle"}`}>{title}</p>
      <p className={`font-serif text-2xl mt-2 tnum ${danger ? "text-white" : "text-primary"}`}>{value}</p>
      <p className={`text-[11px] mt-1 ${danger ? "text-white/70" : "text-subtle"}`}>{sub}</p>
    </motion.div>
  );
}

function MiniStat({ label, value, dot }) {
  return (
    <div className="bg-surface rounded-xl px-3 py-2.5 border border-line flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-subtle">{label}</p>
        <p className="text-sm font-semibold text-ink tnum leading-tight">{value}</p>
      </div>
    </div>
  );
}
