import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, monthLabel, fmtDate } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState, FormSection } from "../components/ui";
import {
  Receipt, Wallet, Trash2, Zap, Edit2, ArrowRight, MessageSquare,
  Send, CheckCircle, AlertTriangle, Sparkles, ExternalLink,
  TrendingUp, Clock, AlertCircle, ChevronDown, ChevronUp, Check, Copy
} from "lucide-react";

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const emptyForm = {
  tenant_id: "",
  room_id: "",
  period: currentPeriod(),
  rent: 0,
  electricity: 0,
  water: 0,
  other: 0,
  other_label: "",
  late_fee: 0,
  due_date: "",
  status: "unpaid",
  notes: "",
};

const methodLabels = { qris: "QRIS", bank_transfer: "Transfer Bank", cash: "Tunai", midtrans: "Midtrans Gateway" };

// Helper to compute overdue days
function getOverdueDays(dueDateStr) {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = now - due;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

// Helper to check if due within next 7 days
function isDueWithin7Days(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [paySheet, setPaySheet] = useState(false);
  const [payForm, setPayForm] = useState({ bill_id: "", amount: 0, method: "qris", reference: "" });
  const [dunningSheet, setDunningSheet] = useState(false);
  const [dunningList, setDunningList] = useState([]);
  const [loadingDunning, setLoadingDunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaidSection, setShowPaidSection] = useState(false);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const [b, t, r] = await Promise.all([api.get("/bills"), api.get("/tenants"), api.get("/rooms")]);
      setBills(b.data);
      setTenants(t.data);
      setRooms(r.data);
    } catch {
      toast.error("Gagal memuat tagihan");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("pay") === "1") {
      setPayForm({ bill_id: "", amount: 0, method: "qris", reference: "" });
      setPaySheet(true);
      setParams({}, { replace: true });
    }
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(emptyForm);
      setOpenSheet(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.name || "-";
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || "-";

  // ─── FINANCIAL KPI COMPUTATIONS ────────────────────────────────
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let partiallyPaidCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    let dueThisWeekCount = 0;

    bills.forEach((b) => {
      const remaining = Math.max(0, b.total - (b.amount_paid || 0));
      totalBilled += b.total;
      totalCollected += b.amount_paid || (b.status === "paid" ? b.total : 0);

      if (b.status === "paid") {
        paidCount++;
      } else {
        totalOutstanding += remaining;
        if (b.is_overdue) {
          totalOverdue += remaining;
          overdueCount++;
        } else if (b.status === "partially_paid") {
          partiallyPaidCount++;
        } else {
          unpaidCount++;
        }

        if (isDueWithin7Days(b.due_date)) {
          dueThisWeekCount++;
        }
      }
    });

    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      partiallyPaidCount,
      unpaidCount,
      paidCount,
      allCount: bills.length,
      collectionRate,
      dueThisWeekCount,
    };
  }, [bills]);

  // ─── SMART RISK-PRIORITIZED SORTING ────────────────────────────
  const sortedBills = useMemo(() => {
    // Priority order: 1. Overdue, 2. Partially Paid, 3. Unpaid, 4. Paid
    return [...bills].sort((a, b) => {
      const getPriority = (item) => {
        if (item.is_overdue) return 1;
        if (item.status === "partially_paid") return 2;
        if (item.status === "unpaid") return 3;
        return 4; // paid
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pA - pB;

      // Secondary sort: Overdue sorted by overdue days desc, Unpaid by due_date asc
      if (a.is_overdue && b.is_overdue) {
        return getOverdueDays(b.due_date) - getOverdueDays(a.due_date);
      }
      if (a.due_date && b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      return 0;
    });
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (filter === "all") return sortedBills;
    if (filter === "overdue") return sortedBills.filter((b) => b.is_overdue);
    return sortedBills.filter((b) => b.status === filter);
  }, [sortedBills, filter]);

  const activeBills = useMemo(() => filteredBills.filter((b) => b.status !== "paid"), [filteredBills]);
  const paidBills = useMemo(() => filteredBills.filter((b) => b.status === "paid"), [filteredBills]);

  // ─── ACTIONS ──────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenSheet(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      tenant_id: b.tenant_id,
      room_id: b.room_id || "",
      period: b.period,
      rent: b.rent,
      electricity: b.electricity,
      water: b.water,
      other: b.other,
      other_label: b.other_label || "",
      late_fee: b.late_fee || 0,
      due_date: b.due_date || "",
      status: b.status,
      notes: b.notes || "",
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({ ...form, tenant_id: tid, room_id: t?.room_id || "", rent: t?.monthly_rent ?? form.rent });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tenant_id) {
      toast.error("Pilih penghuni dulu");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      room_id: form.room_id || null,
      rent: Number(form.rent),
      electricity: Number(form.electricity),
      water: Number(form.water),
      other: Number(form.other),
      late_fee: Number(form.late_fee),
    };
    try {
      if (editing) {
        await api.put(`/bills/${editing.id}`, payload);
        toast.success("Tagihan diperbarui");
      } else {
        const { data } = await api.post("/bills", payload);
        toast.success(`Invoice ${data.invoice_number} dibuat`);
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const generateMonthly = async () => {
    if (!window.confirm(`Buat tagihan otomatis untuk semua penghuni aktif periode ${monthLabel(currentPeriod())}?`)) return;
    try {
      const { data } = await api.post("/bills/generate", { period: currentPeriod() });
      toast.success(data.created > 0 ? `${data.created} invoice dibuat otomatis` : "Semua penghuni sudah punya tagihan bulan ini");
      load();
    } catch {
      toast.error("Gagal generate tagihan");
    }
  };

  const openPay = (b) => {
    setPayForm({ bill_id: b.id, amount: Math.max(0, b.total - (b.amount_paid || 0)), method: "qris", reference: "" });
    setPaySheet(true);
  };

  const onPayBillChange = (bid) => {
    const b = bills.find((x) => x.id === bid);
    setPayForm({ ...payForm, bill_id: bid, amount: b ? Math.max(0, b.total - (b.amount_paid || 0)) : 0 });
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payForm.bill_id) {
      toast.error("Pilih invoice dulu");
      return;
    }
    if (!payForm.amount || payForm.amount <= 0) {
      toast.error("Isi nominal pembayaran");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bills/${payForm.bill_id}/payments`, {
        amount: payForm.amount,
        method: payForm.method,
        reference: payForm.reference || null,
      });
      toast.success(data.status === "paid" ? "Pembayaran lunas ✓" : "Pembayaran sebagian tercatat");
      setPaySheet(false);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal mencatat pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  const simulateDirectPay = async (billId) => {
    try {
      const { data } = await api.post(`/bills/${billId}/simulate-payment`);
      toast.success(`Invoice ${data.invoice_number} berhasil dilunasi (Simulasi) ✓`);
      load();
    } catch {
      toast.error("Gagal simulasi pembayaran");
    }
  };

  const sendWhatsAppReminder = async (billId) => {
    try {
      const { data } = await api.get(`/bills/${billId}/whatsapp-link`);
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, "_blank");
      } else {
        toast.error("Nomor WhatsApp penghuni belum tersedia");
      }
    } catch {
      toast.error("Gagal membuat link WhatsApp");
    }
  };

  const openDunningDialog = async () => {
    setLoadingDunning(true);
    setDunningSheet(true);
    try {
      const { data } = await api.get("/reminders/dunning-list");
      setDunningList(data);
    } catch {
      toast.error("Gagal memuat daftar dunning");
    } finally {
      setLoadingDunning(false);
    }
  };

  const sendBatchDunning = async () => {
    try {
      const { data } = await api.post("/reminders/send-whatsapp-batch");
      toast.success(`${data.count} pengingat dunning berhasil dicatat & dikirimkan ke aplikasi`);
      setDunningSheet(false);
      load();
    } catch {
      toast.error("Gagal mengirim batch pengingat");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tagihan ini?")) return;
    try {
      await api.delete(`/bills/${id}`);
      toast.success("Tagihan dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus tagihan");
    }
  };

  return (
    <div className="fade-up" data-testid="bills-page">
      {/* ─── 1. COLLECTIONS COMMAND KPI HEADER ──────────────────────────── */}
      <div className="px-5 sm:px-6 pt-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-secondary">
              Pusat Penagihan & Arus Kas
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl text-primary font-bold mt-0.5">
              Tagihan & Invoice
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {metrics.overdueCount > 0 && (
              <button
                type="button"
                onClick={openDunningDialog}
                className="px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 active:scale-95 shadow-soft transition-all min-h-[44px]"
              >
                <AlertTriangle size={15} />
                <span>Tindak Lanjut ({metrics.overdueCount})</span>
              </button>
            )}
            <AddButton onClick={openNew} testid="add-bill-btn" label="Buat Tagihan" />
          </div>
        </div>

        {/* Bento KPI Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total Outstanding */}
          <div className="bg-primary rounded-2xl p-4 text-white shadow-soft grain border border-white/10 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Total Piutang Tertunda</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold mt-1 tnum text-white">
                {fmtIDR(metrics.totalOutstanding)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
              <span>{metrics.unpaidCount + metrics.partiallyPaidCount + metrics.overdueCount} tagihan aktif</span>
              <span className="font-semibold text-secondary">{metrics.dueThisWeekCount} jatuh tempo 7 hari</span>
            </div>
          </div>

          {/* Card 2: Overdue Risk */}
          <div className={`rounded-2xl p-4 border shadow-soft flex flex-col justify-between ${
            metrics.overdueCount > 0
              ? "bg-rose-50 border-rose-200 text-rose-950"
              : "bg-surface border-line text-ink"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-bold text-rose-700">Total Menunggak (Overdue)</p>
                {metrics.overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                    {metrics.overdueCount} Overdue
                  </span>
                )}
              </div>
              <p className="font-serif text-2xl font-bold mt-1 tnum text-rose-700">
                {fmtIDR(metrics.totalOverdue)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-rose-800">Prioritas Penagihan H+</span>
              <button
                type="button"
                onClick={openDunningDialog}
                className="text-rose-700 hover:underline flex items-center gap-1 text-[11px]"
              >
                Kirim WA Dunning <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Card 3: Collection Progress */}
          <div className="bg-surface rounded-2xl p-4 border border-line shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-bold text-subtle">Kolektibilitas Bulan Ini</p>
                <span className="font-serif font-bold text-sm text-primary">{metrics.collectionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-xs text-subtle font-medium">
              <span>Masuk: <strong className="text-primary font-bold tnum">{fmtIDR(metrics.totalCollected)}</strong></span>
              <span>Lunas: <strong>{metrics.paidCount} inv</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. REVENUE ACTION STRIP ──────────────────────────────────── */}
      <div className="px-5 sm:px-6 mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={generateMonthly} testid="generate-bills-btn" className="text-xs">
          <Zap size={14} className="mr-1 text-secondary" /> Tagihan Bulanan Otomatis ({monthLabel(currentPeriod()).split(" ")[0]})
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPayForm({ bill_id: "", amount: 0, method: "qris", reference: "" });
            setPaySheet(true);
          }}
          testid="record-payment-btn"
          className="text-xs"
        >
          <Wallet size={14} className="mr-1" /> Catat Pembayaran Masuk
        </Button>
      </div>

      {/* ─── 3. STATUS FILTER PILLS WITH LIVE WORKLOAD COUNTS ─────────── */}
      <div className="px-5 sm:px-6 mt-4 chip-scroll-container pb-1">
        {[
          { key: "all", label: "Semua", count: metrics.allCount },
          { key: "overdue", label: "Terlambat", count: metrics.overdueCount, alert: metrics.overdueCount > 0 },
          { key: "partially_paid", label: "Sebagian", count: metrics.partiallyPaidCount },
          { key: "unpaid", label: "Belum Bayar", count: metrics.unpaidCount },
          { key: "paid", label: "Lunas", count: metrics.paidCount },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 min-h-[40px] ${
              filter === f.key
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-surface text-gray-700 hover:text-ink border-line hover:border-primary/30"
            }`}
          >
            {f.alert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filter === f.key ? "bg-white/20 text-white" : "bg-muted text-subtle"
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── 4. PRIORITIZED INVOICE LIST ─────────────────────────────── */}
      <div className="px-5 sm:px-6 mt-3.5 flex flex-col gap-3.5 pb-8">
        {filteredBills.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Tidak ada tagihan"
            subtitle="Buat tagihan sewa kamar atau jalankan generator tagihan otomatis bulanan."
            action={<Button onClick={openNew}>Buat Tagihan Baru</Button>}
          />
        )}

        {/* ACTIVE INVOICES (Overdue, Partially Paid, Unpaid) */}
        {activeBills.map((b, i) => {
          const remaining = Math.max(0, b.total - (b.amount_paid || 0));
          const isOverdue = b.is_overdue;
          const isPartial = b.status === "partially_paid";
          const overdueDays = getOverdueDays(b.due_date);

          // Card Border & Background styling based on status risk
          let cardStyle = "bg-surface border-line hover:border-primary/40 border-l-4 border-l-primary/70";
          if (isOverdue) {
            cardStyle = "bg-rose-50/40 border-rose-200 hover:border-rose-400 border-l-4 border-l-rose-600 shadow-sm";
          } else if (isPartial) {
            cardStyle = "bg-amber-50/30 border-amber-200 hover:border-amber-400 border-l-4 border-l-amber-500 shadow-sm";
          }

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`rounded-2xl border p-4 shadow-soft transition-all ${cardStyle}`}
              data-testid={`bill-card-${b.invoice_number}`}
            >
              {/* Top Row: Invoice code & Risk Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-secondary">
                      {b.invoice_number}
                    </span>
                    {isOverdue && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                        <AlertCircle size={12} /> Terlambat {overdueDays > 0 ? `${overdueDays} Hari` : ""}
                      </span>
                    )}
                    {isPartial && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-xs">
                        Sebagian (Tercatat: {fmtIDR(b.amount_paid)})
                      </span>
                    )}
                    {!isOverdue && !isPartial && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
                        Belum Bayar
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-xl font-bold text-primary mt-1 truncate">
                    {tenantName(b.tenant_id)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    Kamar <strong>{roomName(b.room_id)}</strong> · Periode {monthLabel(b.period)}
                  </p>
                </div>

                {/* Dominant Financial Highlight: Remaining Balance */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-subtle">Sisa Pembayaran</p>
                  <p className={`font-mono text-xl sm:text-2xl font-bold tnum ${isOverdue ? "text-rose-700" : isPartial ? "text-amber-700" : "text-primary"}`}>
                    {fmtIDR(remaining)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    Total: {fmtIDR(b.total)}
                  </p>
                </div>
              </div>

              {/* Due Date & Action Bar */}
              <div className="mt-3.5 pt-3 border-t border-line/70 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <Clock size={13} className="text-subtle" />
                  <span>Jatuh Tempo: <strong>{b.due_date ? fmtDate(b.due_date) : "-"}</strong></span>
                </div>

                {/* Clear Action Hierarchy */}
                <div className="flex items-center gap-2 ml-auto">
                  {isOverdue ? (
                    // Overdue Dominant Action: Send WA Reminder
                    <>
                      <button
                        type="button"
                        onClick={() => sendWhatsAppReminder(b.id)}
                        className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all min-h-[40px]"
                        title="Kirim Pesan Tagihan ke WhatsApp"
                      >
                        <Send size={13} /> Kirim WA
                      </button>
                      <button
                        type="button"
                        onClick={() => openPay(b)}
                        className="px-3 py-2 rounded-full bg-white hover:bg-muted text-primary border border-line text-xs font-bold flex items-center gap-1 active:scale-95 transition-all min-h-[40px]"
                        title="Catat Pembayaran Masuk"
                      >
                        <Wallet size={13} /> Catat Bayar
                      </button>
                    </>
                  ) : (
                    // Unpaid / Partial Dominant Action: Record Payment
                    <>
                      <button
                        type="button"
                        onClick={() => openPay(b)}
                        className="px-3.5 py-2 rounded-full bg-primary hover:bg-[#122820] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all min-h-[40px]"
                        title="Catat Pembayaran Masuk"
                      >
                        <Wallet size={13} /> Catat Bayar
                      </button>
                      <button
                        type="button"
                        onClick={() => sendWhatsAppReminder(b.id)}
                        className="p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                        title="Kirim Rincian Tagihan via WhatsApp"
                      >
                        <Send size={14} />
                      </button>
                    </>
                  )}

                  {/* Secondary Simulation & Edit Controls */}
                  <button
                    type="button"
                    onClick={() => simulateDirectPay(b.id)}
                    className="p-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                    title="Simulasi Lunas Cepat"
                  >
                    <Sparkles size={14} className="text-amber-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="p-2.5 rounded-full text-subtle hover:text-primary hover:bg-primary/5 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                    title="Edit Data Tagihan"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="p-2.5 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                    title="Hapus Tagihan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ─── 5. COLLAPSED / MINIMIZED PAID INVOICES SECTION ─────────── */}
        {paidBills.length > 0 && filter === "all" && (
          <div className="mt-4 pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setShowPaidSection(!showPaidSection)}
              className="w-full flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-line text-xs font-bold text-gray-700 hover:text-primary active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span>Tagihan Sudah Lunas ({paidBills.length} Invoice)</span>
              </div>
              {showPaidSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {showPaidSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 mt-3 overflow-hidden"
                >
                  {paidBills.map((b) => (
                    <div
                      key={b.id}
                      className="bg-surface/80 rounded-2xl border border-line/80 p-3.5 flex items-center justify-between gap-3 opacity-85 hover:opacity-100 transition-opacity border-l-4 border-l-emerald-600/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-secondary">{b.invoice_number}</span>
                          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            Lunas ✓
                          </span>
                        </div>
                        <p className="font-serif text-base font-bold text-primary truncate mt-0.5">
                          {tenantName(b.tenant_id)} (Kamar {roomName(b.room_id)})
                        </p>
                        <p className="text-[11px] text-subtle">
                          Periode {monthLabel(b.period)} · Metode: {methodLabels[b.payment_method] || "Terkonfirmasi"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-serif text-base font-bold text-primary tnum">{fmtIDR(b.total)}</p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="p-1.5 rounded-lg text-subtle hover:text-primary"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(b.id)}
                            className="p-1.5 rounded-lg text-subtle hover:text-danger"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* If Filter is specifically "paid", show full paid cards */}
        {filter === "paid" && (
          paidBills.map((b) => (
            <div
              key={b.id}
              className="bg-surface rounded-2xl border border-line p-4 flex items-center justify-between gap-3 border-l-4 border-l-emerald-600 shadow-soft"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-secondary">{b.invoice_number}</span>
                  <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
                    Lunas Terkonfirmasi ✓
                  </span>
                </div>
                <p className="font-serif text-lg font-bold text-primary mt-1">{tenantName(b.tenant_id)}</p>
                <p className="text-xs text-gray-600">Kamar {roomName(b.room_id)} · Periode {monthLabel(b.period)}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-xl font-bold text-primary tnum">{fmtIDR(b.total)}</p>
                <p className="text-xs text-subtle mt-0.5">{methodLabels[b.payment_method] || "Lunas"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── 6. DYNAMIC DUNNING & WHATSAPP SHEET ─────────────────────── */}
      <Sheet
        open={dunningSheet}
        onClose={() => setDunningSheet(false)}
        title="Dunning & Pengingat WhatsApp"
        subtitle="Kelola dan kirim pengingat tagihan multi-tahap (H-3, H-0, H+1, H+7)"
        maxWidth="sm:max-w-2xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDunningSheet(false)}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={sendBatchDunning}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Catat Semua Pengingat Dikirim
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          {loadingDunning ? (
            <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat data dunning...</div>
          ) : dunningList.length === 0 ? (
            <div className="py-12 text-center text-subtle text-sm">
              <CheckCircle size={36} className="mx-auto mb-2 text-success" />
              <p className="font-bold text-primary text-base">Semua tagihan up-to-date!</p>
              <p className="text-xs text-subtle mt-0.5">Tidak ada tagihan yang mendekati jatuh tempo atau terlambat saat ini.</p>
            </div>
          ) : (
            dunningList.map((item) => (
              <div key={item.bill_id} className="p-4 rounded-2xl bg-muted/40 border border-line shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-primary text-base">{item.tenant_name}</span>
                      <span className="text-xs font-bold text-secondary font-mono">({item.room_name})</span>
                      <Badge tone={item.stage.startsWith("overdue") ? "danger" : "warning"}>
                        {item.stage_label}
                      </Badge>
                    </div>
                    <p className="text-xs text-subtle mt-0.5 font-mono">
                      Invoice: {item.invoice_number} · Jatuh Tempo: {fmtDate(item.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-serif font-bold text-danger tnum">{fmtIDR(item.amount)}</p>
                  </div>
                </div>

                {/* Preview text */}
                <div className="p-3 bg-white rounded-xl border border-line/60 text-xs text-ink font-mono whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                  {item.message_preview}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-subtle">
                    {item.already_sent ? "✓ Pengingat tahap ini pernah dikirim" : "Belum dikirim"}
                  </span>
                  {item.whatsapp_url && (
                    <a
                      href={item.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs transition-all min-h-[38px]"
                    >
                      <Send size={13} /> Buka Chat WA
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Sheet>

      {/* ─── 7. DYNAMIC ADD/EDIT INVOICE SHEET ───────────────────────── */}
      <Sheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title={editing ? `Edit ${editing.invoice_number}` : "Buat Tagihan Baru"}
        subtitle={editing ? "Perbarui rincian komponen biaya invoice" : "Terbitkan invoice sewa bulanan, utilitas & biaya lainnya"}
        maxWidth="sm:max-w-xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenSheet(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="bill-form"
              testid="submit-bill"
              loading={submitting}
              className="flex-1"
            >
              {editing ? "Simpan Perubahan" : "Terbitkan Tagihan"}
            </Button>
          </>
        }
      >
        <form id="bill-form" onSubmit={submit} className="space-y-1">
          <FormSection title="Penyewa & Kamar">
            <Select
              label="Pilih Penghuni *"
              testid="input-bill-tenant"
              value={form.tenant_id}
              onChange={(e) => onTenantChange(e.target.value)}
              required
            >
              <option value="">-- Pilih Penghuni --</option>
              {tenants.filter((t) => t.status !== "former").map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Kamar {roomName(t.room_id)})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Periode Tagihan (YYYY-MM) *"
                testid="input-bill-period"
                type="month"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                required
              />
              <Input
                label="Tanggal Batas Jatuh Tempo *"
                testid="input-bill-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
          </FormSection>

          <FormSection title="Rincian Komponen Biaya">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MoneyInput
                label="Harga Sewa Kamar"
                testid="input-bill-rent"
                value={form.rent}
                onChange={(val) => setForm({ ...form, rent: val })}
              />
              <MoneyInput
                label="Biaya Listrik / PLN"
                testid="input-bill-electricity"
                value={form.electricity}
                onChange={(val) => setForm({ ...form, electricity: val })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MoneyInput
                label="Biaya Air / PDAM"
                testid="input-bill-water"
                value={form.water}
                onChange={(val) => setForm({ ...form, water: val })}
              />
              <MoneyInput
                label="Denda Keterlambatan"
                testid="input-bill-late"
                value={form.late_fee}
                onChange={(val) => setForm({ ...form, late_fee: val })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Keterangan Biaya Lain (Opsional)"
                placeholder="Misal: Laundry / Parkir Mobil"
                value={form.other_label}
                onChange={(e) => setForm({ ...form, other_label: e.target.value })}
              />
              <MoneyInput
                label="Nominal Biaya Lain"
                testid="input-bill-other"
                value={form.other}
                onChange={(val) => setForm({ ...form, other: val })}
              />
            </div>

            <div className="p-4 bg-muted rounded-2xl border border-line flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-subtle tracking-wider">Total Kalkulasi Invoice:</span>
              <span className="font-serif text-2xl font-bold text-primary tnum">
                {fmtIDR(Number(form.rent) + Number(form.electricity) + Number(form.water) + Number(form.other) + Number(form.late_fee))}
              </span>
            </div>
          </FormSection>

          <FormSection title="Catatan Invoice">
            <Textarea
              label="Catatan Tambahan (Opsional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan khusus invoice untuk penghuni..."
            />
          </FormSection>
        </form>
      </Sheet>

      {/* ─── 8. DYNAMIC RECORD PAYMENT SHEET ─────────────────────────── */}
      <Sheet
        open={paySheet}
        onClose={() => setPaySheet(false)}
        title="Catat Pembayaran Masuk"
        subtitle="Simpan transaksi transfer bank, QRIS, atau tunai"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaySheet(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="pay-form"
              testid="submit-payment"
              loading={submitting}
              className="flex-1"
            >
              Simpan Pembayaran
            </Button>
          </>
        }
      >
        <form id="pay-form" onSubmit={submitPayment} className="space-y-1">
          <FormSection title="Rincian Tagihan & Nominal">
            <Select
              label="Pilih Invoice Tagihan *"
              testid="input-pay-bill"
              value={payForm.bill_id}
              onChange={(e) => onPayBillChange(e.target.value)}
              required
            >
              <option value="">-- Pilih Tagihan Tertunda --</option>
              {bills.filter((b) => b.status !== "paid").map((b) => (
                <option key={b.id} value={b.id}>
                  {b.invoice_number} — {tenantName(b.tenant_id)} (Sisa: {fmtIDR(b.total - (b.amount_paid || 0))})
                </option>
              ))}
            </Select>

            <MoneyInput
              label="Nominal Pembayaran *"
              testid="input-pay-amount"
              value={payForm.amount}
              onChange={(val) => setPayForm({ ...payForm, amount: val })}
              required
            />
          </FormSection>

          <FormSection title="Metode & Referensi">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Kanal Pembayaran *"
                testid="input-pay-method"
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
              >
                <option value="qris">QRIS (Scan Realtime)</option>
                <option value="bank_transfer">Transfer Bank (BCA / Mandiri)</option>
                <option value="cash">Tunai (Cash ke Staff)</option>
              </Select>
              <Input
                label="Nomor Referensi / Ref ID"
                testid="input-pay-ref"
                placeholder="Contoh: TRF98810 / QR882"
                value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
              />
            </div>
          </FormSection>
        </form>
      </Sheet>
    </div>
  );
}
