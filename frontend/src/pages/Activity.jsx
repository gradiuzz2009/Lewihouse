import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  History,
  Download,
  Megaphone,
  CreditCard,
  Wrench,
  Zap,
  KeyRound,
  Building2,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
  Send,
  X,
  Sparkles,
} from "lucide-react";
import { api, fmtDateTime, fmtIDR } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, Sheet, Button, Input, Select, Textarea } from "../components/ui";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const MODULE_CONFIG = {
  ALL: { label: "Semua Modul", icon: History, color: "bg-muted text-subtle border-line" },
  BILLING: { label: "Tagihan & Sewa", icon: CreditCard, color: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  MAINTENANCE: { label: "Komplain & Isu", icon: Wrench, color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  ELECTRICITY: { label: "Listrik & Utilitas", icon: Zap, color: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  ROOM: { label: "Kamar & Unit", icon: Building2, color: "bg-teal-500/15 text-teal-700 border-teal-500/30" },
  AUTH: { label: "Kredensial & Akun", icon: KeyRound, color: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30" },
  ANNOUNCEMENT: { label: "Pengumuman", icon: Megaphone, color: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
};

const URGENCY_STYLES = {
  info: { label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Info },
  warning: { label: "Warning", color: "bg-amber-50 text-amber-800 border-amber-300", icon: AlertTriangle },
  urgent: { label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-300 font-bold", icon: AlertTriangle },
};

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);

  // Broadcast announcement form state
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annUrgency, setAnnUrgency] = useState("info");
  const [annTarget, setAnnTarget] = useState("all");

  const nav = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/activity/logs?limit=200");
      const list = Array.isArray(data) ? data : data?.logs || [];
      setLogs(list);
    } catch {
      toast.error("Gagal memuat log aktivitas");
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(load);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const mod = (log.module || log.entity || "").toUpperCase();
      const urg = (log.urgency || (log.detail && log.detail.urgency) || "info").toLowerCase();
      const unit = (log.room_unit || (log.detail && (log.detail.room || log.detail.room_name)) || "").toLowerCase();
      const text = `${log.title || ""} ${log.message || ""} ${log.actor || ""} ${log.event_type || log.action || ""}`.toLowerCase();

      if (selectedModule !== "ALL" && mod !== selectedModule) return false;
      if (selectedUrgency !== "ALL" && urg !== selectedUrgency.toLowerCase()) return false;
      if (selectedUnit !== "ALL" && !unit.includes(selectedUnit.toLowerCase())) return false;
      if (search.trim() && !text.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [logs, selectedModule, selectedUrgency, selectedUnit, search]);

  // Unique units from logs for dropdown filter
  const unitOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => {
      const u = l.room_unit || (l.detail && (l.detail.room || l.detail.room_name));
      if (u && u !== "-") set.add(u);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Download CSV export
  const handleExportCSV = async () => {
    try {
      toast.info("Menyiapkan berkas CSV...");
      const res = await api.get("/activity/export");
      const blob = new Blob([res.data || ""], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `lewi_house_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Log audit berhasil diunduh (.CSV)");
    } catch {
      toast.error("Gagal mengunduh CSV");
    }
  };

  // Submit Broadcast Announcement
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      toast.error("Judul dan pesan pengumuman wajib diisi");
      return;
    }

    setBroadcastSubmitting(true);
    try {
      await api.post("/announcements/broadcast", {
        title: annTitle.trim(),
        message: annMessage.trim(),
        urgency: annUrgency,
        target: annTarget,
      });

      toast.success("Pengumuman resmi berhasil disiarkan ke seluruh penghuni! 📢");
      setBroadcastOpen(false);
      setAnnTitle("");
      setAnnMessage("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyiarkan pengumuman");
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  return (
    <div className="fade-up pb-12" data-testid="activity-page">
      <PageHeader
        title="Riwayat & Audit Log"
        subtitle="Pusat aktivitas terintegrasi, jejak audit operasional & siaran pengumuman"
      />

      <div className="px-4 sm:px-6 space-y-4">
        {/* Top Control Bar: Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-ink">
              {filteredLogs.length} Total Aktivitas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBroadcastOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-lifted hover:bg-[#122820]"
              data-testid="btn-open-broadcast"
            >
              <Megaphone size={14} className="text-secondary" />
              <span>Siarkan Pengumuman</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-surface border border-line text-ink hover:bg-muted text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
              data-testid="btn-export-csv"
              title="Unduh data dalam format CSV"
            >
              <Download size={14} className="text-primary" />
              <span className="hidden sm:inline">Unduh</span> (.CSV)
            </button>
          </div>
        </div>

        {/* Multi-Criteria Filter Panel */}
        <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-soft space-y-3.5" data-testid="filter-panel">
          <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider mb-1">
            <Filter size={14} className="text-primary" />
            <span>Filter Kriteria Log</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aktivitas, judul, nama penghuni, nomor invoice..."
              className="w-full bg-muted/40 border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-subtle/70 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:bg-white transition-all"
              data-testid="input-search-log"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* 1. Modul */}
            <div>
              <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">
                Jenis Modul
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-muted/40 border border-line rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-primary transition-all"
                data-testid="select-filter-module"
              >
                <option value="ALL">Semua Modul</option>
                <option value="BILLING">Tagihan & Sewa (BILLING)</option>
                <option value="MAINTENANCE">Komplain & Isu (MAINTENANCE)</option>
                <option value="ELECTRICITY">Listrik & Utilitas (ELECTRICITY)</option>
                <option value="ROOM">Kamar & Transfer (ROOM)</option>
                <option value="AUTH">Kredensial & Akun (AUTH)</option>
                <option value="ANNOUNCEMENT">Pengumuman (ANNOUNCEMENT)</option>
              </select>
            </div>

            {/* 2. Nomor Unit */}
            <div>
              <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">
                Nomor Unit Kamar
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-muted/40 border border-line rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-primary transition-all"
                data-testid="select-filter-unit"
              >
                <option value="ALL">Semua Unit Kamar</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Tingkat Urgensi */}
            <div>
              <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">
                Tingkat Urgensi
              </label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="w-full bg-muted/40 border border-line rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-primary transition-all"
                data-testid="select-filter-urgency"
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="info">Info (Biasa)</option>
                <option value="warning">Warning (Peringatan)</option>
                <option value="urgent">Urgent (Kritis)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs List Section */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="Tidak ada log aktivitas yang cocok"
              subtitle="Coba ubah kriteria pencarian atau pilih 'Semua Modul'."
              testid="activity-empty"
            />
          ) : (
            filteredLogs.map((log, i) => {
              const mod = (log.module || log.entity || "SYSTEM").toUpperCase();
              const config = MODULE_CONFIG[mod] || MODULE_CONFIG.ALL;
              const Icon = config.icon;
              const urgKey = (log.urgency || (log.detail && log.detail.urgency) || "info").toLowerCase();
              const urgencyMeta = URGENCY_STYLES[urgKey] || URGENCY_STYLES.info;
              const UrgIcon = urgencyMeta.icon;
              const unit = log.room_unit || (log.detail && (log.detail.room || log.detail.room_name)) || "-";

              return (
                <motion.div
                  key={log.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="bg-surface rounded-2xl border border-line shadow-soft p-4 hover:border-primary/40 transition-all space-y-2.5"
                  data-testid={`activity-card-${log.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Avatar & Meta */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 border ${config.color}`}>
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {unit && unit !== "-" && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                              Unit {unit}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.color}`}>
                            {config.label}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${urgencyMeta.color}`}>
                            <UrgIcon size={10} />
                            <span>{urgencyMeta.label}</span>
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-ink leading-snug">
                          {log.title || `${log.event_type || log.action} ${mod}`}
                        </h4>
                      </div>
                    </div>

                    {/* Right: Quick Action Button */}
                    {log.action_url && (
                      <button
                        onClick={() => nav(log.action_url)}
                        className="px-3 py-1.5 bg-muted/60 hover:bg-primary hover:text-white border border-line text-ink rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
                      >
                        <span>Buka</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>

                  {/* Message / Description */}
                  <p className="text-xs text-subtle leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-line/40">
                    {log.message || (log.detail && (log.detail.title || log.detail.name || log.detail.invoice)) || "Aktivitas tercatat dalam sistem."}
                  </p>

                  {/* Footer Actor & Timestamp */}
                  <div className="flex items-center justify-between text-[10px] text-subtle/80 pt-0.5 font-medium">
                    <span className="truncate">
                      Pelaku: <strong className="text-ink font-semibold">{log.actor || "System"}</strong>
                    </span>
                    <span className="font-mono shrink-0">
                      {fmtDateTime(log.created_at || log.at)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Broadcast Announcement Modal Sheet */}
      <Sheet
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Siarkan Pengumuman Resmi Gedung"
      >
        <form onSubmit={handleBroadcast} className="space-y-4 pt-1" data-testid="broadcast-announcement-modal">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-start gap-3 text-purple-900">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 grid place-items-center shrink-0 text-purple-700">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-950">Siaran Langsung ke Semua Penghuni</p>
              <p className="text-[11px] text-purple-900/80 leading-snug">
                Pesan pengumuman akan dikirim sebagai notifikasi in-app dan web push kepada penghuni yang dituju.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
              Judul Pengumuman *
            </label>
            <Input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Contoh: Pemeliharaan Tangki Air Besok Pukul 09:00"
              required
              data-testid="input-broadcast-title"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
              Isi Pesan Pengumuman *
            </label>
            <Textarea
              rows={4}
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="Tuliskan rincian informasi atau instruksi untuk seluruh penyewa..."
              required
              data-testid="input-broadcast-message"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                Tingkat Urgensi
              </label>
              <Select
                value={annUrgency}
                onChange={(e) => setAnnUrgency(e.target.value)}
                data-testid="select-broadcast-urgency"
              >
                <option value="info">Info (Biasa)</option>
                <option value="warning">Warning (Penting)</option>
                <option value="urgent">Urgent (Darurat)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                Target Penerima
              </label>
              <Select
                value={annTarget}
                onChange={(e) => setAnnTarget(e.target.value)}
                data-testid="select-broadcast-target"
              >
                <option value="all">Semua Penghuni & Staff</option>
                <option value="tenant">Hanya Penghuni</option>
                <option value="staff">Hanya Staff / Pengelola</option>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={broadcastSubmitting || !annTitle.trim() || !annMessage.trim()}
              className="w-full py-3.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold tracking-wide shadow-lifted active:scale-98 hover:bg-[#122820] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              data-testid="btn-submit-broadcast"
            >
              <Send size={15} />
              <span>{broadcastSubmitting ? "Menyiarkan..." : "Kirim Siaran Sekarang"}</span>
            </button>
            <button
              type="button"
              onClick={() => setBroadcastOpen(false)}
              className="w-full py-2 text-xs font-semibold text-subtle hover:text-ink text-center transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
