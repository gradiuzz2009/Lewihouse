import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  Check,
  ChevronRight
} from "lucide-react";
import { Sheet, SheetFooter } from "./ui";
import { api, fmtIDR, fmtDate, monthLabel } from "../lib/api";

const methodLabels = {
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  cash: "Tunai",
  CASH: "Tunai",
  midtrans: "Midtrans Gateway",
};

export default function RevenueDetailsModal({ open, onClose, summary }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // all, paid, unpaid
  const [searchTerm, setSearchTerm] = useState("");
  const nav = useNavigate();

  const currentPeriod = useMemo(() => {
    return summary?.period || new Date().toISOString().slice(0, 7);
  }, [summary]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await api.get("/bills");
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : [];
          setBills(list);
        }
      } catch (err) {
        console.error("Gagal memuat rincian tagihan:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBills();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Filter bills strictly for the current month
  const currentMonthBills = useMemo(() => {
    return bills.filter((b) => (b.period || "").startsWith(currentPeriod));
  }, [bills, currentPeriod]);

  // Compute detailed financial aggregates
  const stats = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    let totalBilled = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    currentMonthBills.forEach((b) => {
      const tot = Number(b.total || b.total_amount || 0);
      const paid = Number(b.amount_paid || (b.status?.toLowerCase() === "paid" ? tot : 0));
      const unpaid = Math.max(0, tot - paid);

      collected += paid;
      outstanding += unpaid;
      totalBilled += tot;

      const st = (b.status || "").toLowerCase();
      if (st === "paid") paidCount++;
      else if (st === "partially_paid") partialCount++;
      else unpaidCount++;
    });

    const displayRevenue = summary?.revenue_month ?? collected;
    const collectionRate = totalBilled > 0 ? Math.round((displayRevenue / totalBilled) * 100) : 100;

    return {
      revenue: displayRevenue,
      outstanding: summary?.outstanding ?? outstanding,
      totalBilled: Math.max(totalBilled, displayRevenue + (summary?.outstanding ?? outstanding)),
      collectionRate,
      paidCount,
      unpaidCount,
      partialCount,
      totalBills: currentMonthBills.length,
    };
  }, [currentMonthBills, summary]);

  // Filtered bills for list display
  const displayedBills = useMemo(() => {
    return currentMonthBills.filter((b) => {
      const st = (b.status || "").toLowerCase();
      if (activeFilter === "paid" && st !== "paid") return false;
      if (activeFilter === "unpaid" && st !== "unpaid" && st !== "partially_paid") return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const tenantName = (b.tenant_name || b.tenant?.name || "").toLowerCase();
        const roomName = (b.room_unit || b.room_name || b.room?.name || "").toLowerCase();
        const inv = (b.invoice_number || "").toLowerCase();
        return tenantName.includes(term) || roomName.includes(term) || inv.includes(term);
      }
      return true;
    });
  }, [currentMonthBills, activeFilter, searchTerm]);

  const handleNavigateToBills = () => {
    onClose?.();
    nav("/bills");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Rincian Pendapatan Bulan Ini"
      subtitle={`Periode: ${monthLabel(currentPeriod)}`}
      maxWidth="sm:max-w-2xl"
    >
      <div className="space-y-5" data-testid="revenue-details-modal">
        {/* Top Summary Card (Emerald Gradient) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1A362B] to-[#12241d] text-white p-6 shadow-soft relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold flex items-center gap-1.5">
              <Wallet size={14} /> Total Kas Masuk (Terkumpul)
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-semibold border border-white/10">
              Efisiensi: {stats.collectionRate}%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mt-1">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white tnum">
              {fmtIDR(stats.revenue)}
            </h2>
            <p className="text-xs text-white/70">
              dari total tagihan {fmtIDR(stats.totalBilled)}
            </p>
          </div>

          {/* Mini Stats Grid Inside Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/15">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Lunas</p>
              <p className="text-lg font-bold text-white tnum mt-0.5">{stats.paidCount} Unit</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-[10px] text-amber-300/90 font-semibold uppercase tracking-wider">Belum Bayar</p>
              <p className="text-lg font-bold text-amber-300 tnum mt-0.5">{fmtIDR(stats.outstanding)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Tagihan Tertunda</p>
              <p className="text-lg font-bold text-white tnum mt-0.5">{stats.unpaidCount + stats.partialCount} Tagihan</p>
            </div>
          </div>
        </div>

        {/* Calculation Info Note */}
        <div className="bg-muted/40 border border-line rounded-2xl p-3.5 flex items-start gap-3 text-xs text-subtle">
          <TrendingUp size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-ink font-semibold">Bagaimana pendapatan dihitung?</strong> Pendapatan bulan ini mengakumulasi semua pembayaran yang telah terverifikasi/lunas pada periode <span className="font-semibold text-primary">{monthLabel(currentPeriod)}</span>. Tagihan yang belum dibayar dicatat terpisah sebagai piutang.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-line">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-surface text-primary shadow-2xs"
                  : "text-subtle hover:text-ink"
              }`}
            >
              Semua ({currentMonthBills.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === "paid"
                  ? "bg-surface text-emerald-700 shadow-2xs"
                  : "text-subtle hover:text-ink"
              }`}
            >
              Lunas ({stats.paidCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("unpaid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === "unpaid"
                  ? "bg-surface text-amber-700 shadow-2xs"
                  : "text-subtle hover:text-ink"
              }`}
            >
              Belum Lunas ({stats.unpaidCount + stats.partialCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari kamar / nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-surface border border-line focus:outline-none focus:border-primary transition-all text-ink placeholder:text-subtle/70"
            />
          </div>
        </div>

        {/* Breakdown Bills List */}
        <div className="space-y-2.5">
          <p className="text-[11px] uppercase tracking-wider text-subtle font-bold">
            Rincian Tagihan & Penerimaan Unit
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-subtle flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Memuat rincian tagihan...</span>
            </div>
          ) : displayedBills.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-muted/20 border border-line">
              <Receipt size={24} className="mx-auto text-subtle/60 mb-2" />
              <p className="text-xs font-bold text-ink">Tidak ada data tagihan yang sesuai</p>
              <p className="text-[11px] text-subtle mt-0.5">
                {currentMonthBills.length === 0
                  ? "Belum ada invoice yang dibuat untuk periode ini."
                  : "Coba ubah filter atau kata kunci pencarian."}
              </p>
            </div>
          ) : (
            displayedBills.map((b, idx) => {
              const status = (b.status || "").toLowerCase();
              const isPaid = status === "paid";
              const isPartial = status === "partially_paid";
              const tot = Number(b.total || b.total_amount || 0);
              const paid = Number(b.amount_paid || (isPaid ? tot : 0));
              const roomLabel = b.room_unit || b.room_name || b.room?.name || `Kamar ${b.room_id || "-"}`;
              const tenantName = b.tenant_name || b.tenant?.name || "Penghuni";
              const method = b.payment_method || (b.payments?.[0]?.method) || null;
              const dateStr = b.paid_at || b.updated_at || b.due_date;

              return (
                <div
                  key={b.id || idx}
                  className="p-3.5 bg-surface rounded-2xl border border-line hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : isPartial
                          ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                      }`}
                    >
                      {isPaid ? <CheckCircle2 size={18} /> : isPartial ? <Clock size={18} /> : <AlertCircle size={18} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10">
                          {roomLabel}
                        </span>
                        <p className="text-xs font-bold text-ink truncate">{tenantName}</p>
                      </div>
                      <p className="text-[10px] text-subtle mt-0.5 flex items-center gap-1 flex-wrap font-medium">
                        <span>{b.invoice_number || `INV-${b.period || currentPeriod}`}</span>
                        {method && (
                          <>
                            <span>&bull;</span>
                            <span className="text-ink/80 font-semibold">{methodLabels[method] || method}</span>
                          </>
                        )}
                        {dateStr && (
                          <>
                            <span>&bull;</span>
                            <span>{fmtDate(dateStr)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-ink tnum">
                      {fmtIDR(paid > 0 ? paid : tot)}
                    </p>
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-0.5 border ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : isPartial
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-700 border-rose-500/20"
                      }`}
                    >
                      {isPaid ? "Lunas" : isPartial ? "Sebagian" : "Belum Bayar"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <SheetFooter className="mt-4">
        <button
          type="button"
          onClick={handleNavigateToBills}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#12241d] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-soft"
          data-testid="btn-open-full-bills"
        >
          <Receipt size={16} />
          <span>Buka Manajemen Tagihan Lengkap</span>
          <ArrowRight size={14} />
        </button>
      </SheetFooter>
    </Sheet>
  );
}
