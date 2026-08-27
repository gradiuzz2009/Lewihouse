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
  TrendingUp, Clock, AlertCircle, ChevronDown, ChevronUp, Check, Copy,
  Eye, CheckCircle2, XCircle, FileText, Printer, ArrowLeftRight, Plus, Minus
} from "lucide-react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const emptyItem = { name: "Sewa Kamar Pokok", amount: 0, category: "rent" };

const emptyForm = {
  tenant_id: "",
  room_id: "",
  period: currentPeriod(),
  due_date: "",
  status: "UNPAID",
  notes: "",
  items: [{ ...emptyItem }],
  rent: 0,
  electricity: 0,
  water: 0,
  other: 0,
  other_label: "",
  late_fee: 0,
};

const methodLabels = {
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  cash: "Tunai",
  CASH: "Tunai",
  midtrans: "Midtrans Gateway"
};

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
  const [payForm, setPayForm] = useState({ bill_id: "", amount: 0, method: "BANK_TRANSFER", reference: "" });
  const [dunningSheet, setDunningSheet] = useState(false);
  const [dunningList, setDunningList] = useState([]);
  const [loadingDunning, setLoadingDunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaidSection, setShowPaidSection] = useState(false);
  const [params, setParams] = useSearchParams();

  // Verification & Receipt States
  const [verifyModalBill, setVerifyModalBill] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Prorata Modal State
  const [prorataOpen, setProrataOpen] = useState(false);
  const [prorataForm, setProrataForm] = useState({
    tenant_id: "",
    old_room_id: "",
    new_room_id: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    period: currentPeriod(),
    days_in_month: 30,
  });

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

  useAutoRefresh(load);

  useEffect(() => {
    if (params.get("pay") === "1") {
      setPayForm({ bill_id: "", amount: 0, method: "BANK_TRANSFER", reference: "" });
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
    let verifyingCount = 0;
    let partiallyPaidCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    let dueThisWeekCount = 0;

    bills.forEach((b) => {
      const remaining = Math.max(0, b.total - (b.amount_paid || 0));
      const statusUpper = (b.status || "").toUpperCase();

      if (statusUpper !== "CANCELLED") {
        totalBilled += b.total;
        totalCollected += b.amount_paid || (statusUpper === "PAID" ? b.total : 0);
      }

      if (statusUpper === "PAID") {
        paidCount++;
      } else if (statusUpper === "VERIFYING") {
        verifyingCount++;
        totalOutstanding += remaining;
      } else if (statusUpper !== "CANCELLED") {
        totalOutstanding += remaining;
        if (b.is_overdue || statusUpper === "OVERDUE") {
          totalOverdue += remaining;
          overdueCount++;
        } else if (statusUpper === "PARTIAL_PAID" || b.status === "partially_paid") {
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
      verifyingCount,
      partiallyPaidCount,
      unpaidCount,
      paidCount,
      allCount: bills.length,
      collectionRate,
      dueThisWeekCount,
    };
  }, [bills]);

  // ─── SMART SORTING ─────────────────────────────────────────────
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const getPriority = (item) => {
        const s = (item.status || "").toUpperCase();
        if (s === "VERIFYING") return 0; // Top priority: pending admin review
        if (item.is_overdue || s === "OVERDUE") return 1;
        if (s === "PARTIAL_PAID" || item.status === "partially_paid") return 2;
        if (s === "UNPAID" || item.status === "unpaid") return 3;
        if (s === "PAID" || item.status === "paid") return 4;
        return 5;
      };

      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;

      if ((a.is_overdue || a.status === "OVERDUE") && (b.is_overdue || b.status === "OVERDUE")) {
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
    if (filter === "verifying") return sortedBills.filter((b) => (b.status || "").toUpperCase() === "VERIFYING");
    if (filter === "overdue") return sortedBills.filter((b) => b.is_overdue || (b.status || "").toUpperCase() === "OVERDUE");
    if (filter === "partially_paid") return sortedBills.filter((b) => (b.status || "").toUpperCase() === "PARTIAL_PAID" || b.status === "partially_paid");
    if (filter === "unpaid") return sortedBills.filter((b) => (b.status || "").toUpperCase() === "UNPAID" && !b.is_overdue);
    if (filter === "paid") return sortedBills.filter((b) => (b.status || "").toUpperCase() === "PAID" || b.status === "paid");
    if (filter === "cancelled") return sortedBills.filter((b) => (b.status || "").toUpperCase() === "CANCELLED");
    return sortedBills;
  }, [sortedBills, filter]);

  const activeBills = useMemo(() => filteredBills.filter((b) => (b.status || "").toUpperCase() !== "PAID"), [filteredBills]);
  const paidBills = useMemo(() => filteredBills.filter((b) => (b.status || "").toUpperCase() === "PAID" || b.status === "paid"), [filteredBills]);

  // ─── ACTIONS ──────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      due_date: `${currentPeriod()}-05`,
      items: [{ name: "Sewa Kamar Pokok", amount: 0, category: "rent" }],
    });
    setOpenSheet(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    let items = b.items && b.items.length > 0 ? b.items : [];
    if (items.length === 0) {
      if (b.rent) items.push({ name: "Sewa Kamar Pokok", amount: b.rent, category: "rent" });
      if (b.electricity) items.push({ name: "Listrik / PLN", amount: b.electricity, category: "electricity" });
      if (b.water) items.push({ name: "Air / PDAM", amount: b.water, category: "water" });
      if (b.other) items.push({ name: b.other_label || "Biaya Tambahan", amount: b.other, category: "add_on" });
      if (b.late_fee) items.push({ name: "Denda Keterlambatan", amount: b.late_fee, category: "penalty" });
    }
    if (items.length === 0) items = [{ name: "Sewa Kamar Pokok", amount: b.total || 0, category: "rent" }];

    setForm({
      tenant_id: b.tenant_id,
      room_id: b.room_id || "",
      period: b.period,
      due_date: b.due_date || "",
      status: b.status || "UNPAID",
      notes: b.notes || "",
      items: items,
      rent: b.rent || 0,
      electricity: b.electricity || 0,
      water: b.water || 0,
      other: b.other || 0,
      other_label: b.other_label || "",
      late_fee: b.late_fee || 0,
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    const rentAmount = Number(t?.monthly_rent || 0);
    const updatedItems = form.items.map((item, idx) =>
      idx === 0 && item.category === "rent" ? { ...item, amount: rentAmount } : item
    );
    setForm({
      ...form,
      tenant_id: tid,
      room_id: t?.room_id || "",
      items: updatedItems,
      rent: rentAmount,
    });
  };

  const handleAddItem = (presetName = "Biaya Tambahan", category = "add_on", defaultAmount = 0) => {
    setForm({
      ...form,
      items: [...form.items, { name: presetName, amount: defaultAmount, category: category }],
    });
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) {
      toast.error("Minimal harus ada 1 item biaya");
      return;
    }
    const updated = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const totalCalculatedForm = useMemo(() => {
    return form.items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [form.items]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tenant_id) {
      toast.error("Pilih penghuni terlebih dahulu");
      return;
    }
    if (form.items.length === 0 || totalCalculatedForm <= 0) {
      toast.error("Rincian tagihan tidak boleh kosong / 0");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      room_id: form.room_id || null,
      items: form.items.map((it) => ({ ...it, amount: Number(it.amount || 0) })),
      rent: Number(form.items.find((i) => i.category === "rent")?.amount || form.rent || 0),
    };
    try {
      if (editing) {
        await api.put(`/bills/${editing.id}`, payload);
        toast.success("Tagihan diperbarui ✓");
      } else {
        const { data } = await api.post("/bills", payload);
        toast.success(`Invoice ${data.invoice_number} berhasil diterbitkan ✓`);
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const generateMonthly = async () => {
    if (!window.confirm(`Buat tagihan otomatis untuk semua penghuni aktif periode ${monthLabel(currentPeriod())}?`)) return;
    try {
      const { data } = await api.post("/bills/generate", { period: currentPeriod(), due_day: 5 });
      toast.success(data.created > 0 ? `${data.created} invoice resmi dibuat otomatis` : "Semua penghuni sudah memiliki tagihan periode ini");
      load();
    } catch {
      toast.error("Gagal generate tagihan");
    }
  };

  // ─── VERIFICATION & APPROVAL ──────────────────────────────────
  const openVerifyModal = (bill) => {
    setVerifyModalBill(bill);
    setRejectionReason("");
    setShowRejectBox(false);
  };

  const handleVerify = async (action) => {
    if (!verifyModalBill) return;
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Wajib mengisi alasan penolakan bukti transfer");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bills/${verifyModalBill.id}/verify-payment`, {
        action: action,
        rejection_reason: action === "reject" ? rejectionReason.trim() : null,
        method: verifyModalBill.payment_details?.method || "BANK_TRANSFER",
      });
      toast.success(action === "approve" ? "Pembayaran berhasil diverifikasi & Lunas ✓" : "Bukti pembayaran ditolak");
      setVerifyModalBill(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal memverifikasi bukti bayar");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DIGITAL RECEIPT ──────────────────────────────────────────
  const openReceipt = async (billId) => {
    setReceiptLoading(true);
    setReceiptModalOpen(true);
    try {
      const { data } = await api.get(`/bills/${billId}/receipt`);
      setReceiptData(data);
    } catch {
      toast.error("Gagal memuat kwitansi digital");
      setReceiptModalOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  // ─── PRORATA ROOM TRANSFER ────────────────────────────────────
  const submitProrata = async (e) => {
    e.preventDefault();
    if (!prorataForm.tenant_id || !prorataForm.old_room_id || !prorataForm.new_room_id) {
      toast.error("Lengkapi data penghuni, kamar lama, dan kamar baru");
      return;
    }
    if (prorataForm.old_room_id === prorataForm.new_room_id) {
      toast.error("Kamar baru harus berbeda dengan kamar lama");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/bills/prorata-transfer", prorataForm);
      toast.success(`Invoice prorata ${data.invoice_number} berhasil dibuat ✓`);
      setProrataOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membuat invoice prorata");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DIRECT PAYMENT & WA ──────────────────────────────────────
  const openPay = (b) => {
    setPayForm({
      bill_id: b.id,
      amount: Math.max(0, b.total - (b.amount_paid || 0)),
      method: "BANK_TRANSFER",
      reference: "",
    });
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
      toast.success((data.status || "").toUpperCase() === "PAID" ? "Pembayaran lunas ✓" : "Pembayaran sebagian tercatat");
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

  const cancelBillAction = async (id) => {
    if (!window.confirm("Batalkan invoice ini? Status akan berubah menjadi CANCELLED.")) return;
    try {
      await api.post(`/bills/${id}/cancel`);
      toast.success("Invoice dibatalkan");
      load();
    } catch {
      toast.error("Gagal membatalkan invoice");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus permanen data tagihan ini?")) return;
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
              Pusat Penagihan & Keuangan
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl text-primary font-bold mt-0.5">
              Tagihan & Invoice
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {metrics.verifyingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("verifying")}
                className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 active:scale-95 shadow-soft transition-all min-h-[44px] animate-bounce"
              >
                <Eye size={15} />
                <span>Verifikasi Bukti ({metrics.verifyingCount})</span>
              </button>
            )}
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
            <Button
              variant="outline"
              onClick={() => setProrataOpen(true)}
              className="text-xs"
            >
              <ArrowLeftRight size={14} className="mr-1 text-primary" /> Prorata Pindah
            </Button>
            <AddButton onClick={openNew} testid="add-bill-btn" label="Buat Tagihan" />
          </div>
        </div>

        {/* Bento KPI Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Outstanding */}
          <div className="bg-primary rounded-2xl p-4 text-white shadow-soft grain border border-white/10 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Total Tertunggak</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold mt-1 tnum text-white">
                {fmtIDR(metrics.totalOutstanding)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
              <span>{metrics.unpaidCount + metrics.partiallyPaidCount + metrics.overdueCount} tagihan aktif</span>
              <span className="font-semibold text-secondary">{metrics.dueThisWeekCount} jatuh tempo 7h</span>
            </div>
          </div>

          {/* Card 2: Verifying Workload Card */}
          <div
            onClick={() => setFilter("verifying")}
            className={`rounded-2xl p-4 border shadow-soft flex flex-col justify-between cursor-pointer transition-all ${
              metrics.verifyingCount > 0
                ? "bg-amber-500/10 border-amber-500/40 text-amber-950 hover:border-amber-600"
                : "bg-surface border-line text-ink"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-800">Menunggu Verifikasi</p>
                {metrics.verifyingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                    {metrics.verifyingCount} Baru
                  </span>
                )}
              </div>
              <p className="font-serif text-2xl font-bold mt-1 tnum text-amber-700">
                {metrics.verifyingCount} Invoice
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-800">Bukti Transfer Masuk</span>
              <span className="text-amber-700 text-[11px] flex items-center gap-1">
                Buka Panel <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 3: Overdue Risk */}
          <div className={`rounded-2xl p-4 border shadow-soft flex flex-col justify-between ${
            metrics.overdueCount > 0
              ? "bg-rose-50 border-rose-200 text-rose-950"
              : "bg-surface border-line text-ink"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-bold text-rose-700">Lewat Jatuh Tempo</p>
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
              <span className="text-rose-800">Prioritas Penagihan</span>
              <button
                type="button"
                onClick={openDunningDialog}
                className="text-rose-700 hover:underline flex items-center gap-1 text-[11px]"
              >
                WA Dunning <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Card 4: Collection Progress */}
          <div className="bg-surface rounded-2xl p-4 border border-line shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-bold text-subtle">Kolektibilitas / Lunas</p>
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
          <Zap size={14} className="mr-1 text-secondary" /> Auto-Generate Tagihan ({monthLabel(currentPeriod()).split(" ")[0]})
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPayForm({ bill_id: "", amount: 0, method: "BANK_TRANSFER", reference: "" });
            setPaySheet(true);
          }}
          testid="record-payment-btn"
          className="text-xs"
        >
          <Wallet size={14} className="mr-1" /> Catat Pembayaran Manual
        </Button>
      </div>

      {/* ─── 3. STATUS FILTER PILLS ───────────────────────────────────── */}
      <div className="px-5 sm:px-6 mt-4 chip-scroll-container pb-1">
        {[
          { key: "all", label: "Semua", count: metrics.allCount },
          { key: "verifying", label: "Menunggu Verifikasi", count: metrics.verifyingCount, alert: metrics.verifyingCount > 0, highlight: true },
          { key: "overdue", label: "Terlambat", count: metrics.overdueCount, alert: metrics.overdueCount > 0 },
          { key: "partially_paid", label: "Sebagian", count: metrics.partiallyPaidCount },
          { key: "unpaid", label: "Belum Bayar", count: metrics.unpaidCount },
          { key: "paid", label: "Lunas", count: metrics.paidCount },
          { key: "cancelled", label: "Dibatalkan", count: bills.filter((b) => (b.status || "").toUpperCase() === "CANCELLED").length },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 min-h-[40px] ${
              filter === f.key
                ? f.highlight
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-primary text-white border-primary shadow-xs"
                : f.alert && f.highlight
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500"
                : "bg-surface text-gray-700 hover:text-ink border-line hover:border-primary/30"
            }`}
          >
            {f.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
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

        {/* ACTIVE INVOICES */}
        {activeBills.map((b, i) => {
          const remaining = Math.max(0, b.total - (b.amount_paid || 0));
          const statusUpper = (b.status || "").toUpperCase();
          const isVerifying = statusUpper === "VERIFYING";
          const isOverdue = b.is_overdue || statusUpper === "OVERDUE";
          const isPartial = statusUpper === "PARTIAL_PAID" || b.status === "partially_paid";
          const isCancelled = statusUpper === "CANCELLED";
          const overdueDays = getOverdueDays(b.due_date);

          let cardStyle = "bg-surface border-line hover:border-primary/40 border-l-4 border-l-primary/70";
          if (isVerifying) {
            cardStyle = "bg-amber-50/50 border-amber-300 hover:border-amber-500 border-l-4 border-l-amber-500 shadow-sm";
          } else if (isOverdue) {
            cardStyle = "bg-rose-50/40 border-rose-200 hover:border-rose-400 border-l-4 border-l-rose-600 shadow-sm";
          } else if (isPartial) {
            cardStyle = "bg-blue-50/30 border-blue-200 hover:border-blue-400 border-l-4 border-l-blue-500 shadow-sm";
          } else if (isCancelled) {
            cardStyle = "bg-gray-50 border-gray-200 opacity-60 border-l-4 border-l-gray-400";
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
                    {isVerifying && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs animate-pulse">
                        <Eye size={12} /> Menunggu Verifikasi Bukti
                      </span>
                    )}
                    {isOverdue && !isVerifying && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                        <AlertCircle size={12} /> Terlambat {overdueDays > 0 ? `${overdueDays} Hari` : ""}
                      </span>
                    )}
                    {isPartial && !isVerifying && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                        Sebagian (Masuk: {fmtIDR(b.amount_paid)})
                      </span>
                    )}
                    {!isVerifying && !isOverdue && !isPartial && !isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
                        Belum Bayar
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold">
                        Dibatalkan
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-xl font-bold text-primary mt-1 truncate">
                    {b.resident_name || tenantName(b.tenant_id)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    Kamar <strong>{b.room_unit || roomName(b.room_id)}</strong> · Periode {monthLabel(b.period)}
                  </p>
                </div>

                {/* Remaining Balance */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-subtle">Sisa Tagihan</p>
                  <p className={`font-mono text-xl sm:text-2xl font-bold tnum ${
                    isVerifying ? "text-amber-700" : isOverdue ? "text-rose-700" : isPartial ? "text-blue-700" : "text-primary"
                  }`}>
                    {fmtIDR(remaining)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    Total: {fmtIDR(b.total)}
                  </p>
                </div>
              </div>

              {/* Line Items Preview */}
              {b.items && b.items.length > 0 && (
                <div className="mt-3 py-2 px-3 bg-muted/50 rounded-xl border border-line/60 text-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-subtle tracking-wider">Komponen Tagihan:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    {b.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-700">
                        <span className="truncate">• {it.name}</span>
                        <span className="font-mono font-medium ml-2">{fmtIDR(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Note Alert if previously rejected */}
              {b.payment_details?.rejection_reason && (
                <div className="mt-2.5 p-2.5 bg-rose-100/70 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Bukti Transfer Ditolak Sebelumnya:</span> {b.payment_details.rejection_reason}
                  </div>
                </div>
              )}

              {/* Due Date & Action Bar */}
              <div className="mt-3.5 pt-3 border-t border-line/70 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <Clock size={13} className="text-subtle" />
                  <span>Jatuh Tempo: <strong>{b.due_date ? fmtDate(b.due_date) : "-"}</strong></span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {isVerifying ? (
                    <button
                      type="button"
                      onClick={() => openVerifyModal(b)}
                      className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all min-h-[40px]"
                    >
                      <Eye size={14} /> Review Bukti Transfer
                    </button>
                  ) : (
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

                  {/* Simulation & Action Controls */}
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
                    onClick={() => openReceipt(b.id)}
                    className="p-2.5 rounded-full text-subtle hover:text-primary hover:bg-primary/5 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                    title="Lihat Kwitansi / Invoice"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="p-2.5 rounded-full text-subtle hover:text-primary hover:bg-primary/5 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                    title="Edit Data Tagihan"
                  >
                    <Edit2 size={14} />
                  </button>
                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => cancelBillAction(b.id)}
                      className="p-2.5 rounded-full text-subtle hover:text-amber-700 hover:bg-amber-50 grid place-items-center active:scale-95 transition-all min-h-[40px] min-w-[40px]"
                      title="Batalkan Tagihan"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
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

        {/* ─── 5. PAID INVOICES SECTION ───────────────────────────────── */}
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
                      className="bg-surface/80 rounded-2xl border border-line/80 p-3.5 flex items-center justify-between gap-3 opacity-90 hover:opacity-100 transition-opacity border-l-4 border-l-emerald-600"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-secondary">{b.invoice_number}</span>
                          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            Lunas ✓
                          </span>
                        </div>
                        <p className="font-serif text-base font-bold text-primary truncate mt-0.5">
                          {b.resident_name || tenantName(b.tenant_id)} (Kamar {b.room_unit || roomName(b.room_id)})
                        </p>
                        <p className="text-[11px] text-subtle">
                          Periode {monthLabel(b.period)} · Metode: {methodLabels[b.payment_method] || methodLabels[b.payment_details?.method] || "Transfer Bank"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-serif text-base font-bold text-primary tnum">{fmtIDR(b.total)}</p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => openReceipt(b.id)}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1"
                            title="Lihat Kwitansi Digital"
                          >
                            <FileText size={12} /> Kwitansi
                          </button>
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

        {/* If Filter is specifically "paid" */}
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
                <p className="font-serif text-lg font-bold text-primary mt-1">{b.resident_name || tenantName(b.tenant_id)}</p>
                <p className="text-xs text-gray-600">Kamar {b.room_unit || roomName(b.room_id)} · Periode {monthLabel(b.period)}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-xl font-bold text-primary tnum">{fmtIDR(b.total)}</p>
                <button
                  type="button"
                  onClick={() => openReceipt(b.id)}
                  className="mt-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold inline-flex items-center gap-1"
                >
                  <FileText size={13} /> Cetak Kwitansi
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── 6. PROOF OF PAYMENT VERIFICATION MODAL ───────────────────── */}
      {verifyModalBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl border border-line shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-muted/40">
              <div>
                <span className="text-xs font-bold text-secondary uppercase font-mono">
                  {verifyModalBill.invoice_number}
                </span>
                <h3 className="font-serif text-xl font-bold text-primary">Verifikasi Bukti Transfer</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalBill(null)}
                className="p-2 rounded-full hover:bg-muted text-subtle hover:text-primary"
              >
                ✕
              </button>
            </div>

            {/* Modal Content: Split Screen */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1">
              {/* Left Side: Proof Image Preview */}
              <div className="flex flex-col">
                <p className="text-xs uppercase font-bold text-subtle tracking-wider mb-2">Foto / Bukti Transfer:</p>
                <div className="bg-black/5 rounded-2xl border border-line/80 flex items-center justify-center overflow-hidden min-h-[260px] p-2 relative group">
                  {verifyModalBill.payment_details?.proof_image_url ? (
                    <img
                      src={verifyModalBill.payment_details.proof_image_url}
                      alt="Bukti Transfer"
                      className="max-h-[340px] w-auto object-contain rounded-xl shadow-xs"
                    />
                  ) : (
                    <div className="text-center p-6 text-subtle text-xs">
                      <AlertCircle size={32} className="mx-auto mb-2 text-amber-500" />
                      Gambar bukti transfer tidak ditemukan / belum diunggah.
                    </div>
                  )}
                </div>
                {verifyModalBill.payment_details?.proof_image_url && (
                  <a
                    href={verifyModalBill.payment_details.proof_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-2 mx-auto"
                  >
                    Buka Gambar Penuh <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Right Side: Invoice & Payment Details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-line/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-subtle">Penghuni & Kamar</span>
                    <p className="font-serif text-lg font-bold text-primary">
                      {verifyModalBill.resident_name || tenantName(verifyModalBill.tenant_id)}
                    </p>
                    <p className="text-xs text-gray-600">Unit: {verifyModalBill.room_unit || roomName(verifyModalBill.room_id)}</p>
                  </div>

                  <div className="pt-2 border-t border-line/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-subtle">Bank Pengirim:</span>
                      <p className="font-bold text-primary">{verifyModalBill.payment_details?.bank_name || "Transfer Bank"}</p>
                    </div>
                    <div>
                      <span className="text-subtle">Nama Pengirim:</span>
                      <p className="font-bold text-primary">{verifyModalBill.payment_details?.sender_name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-subtle">Waktu Transfer:</span>
                      <p className="font-medium text-gray-700">{verifyModalBill.payment_details?.paid_at ? fmtDate(verifyModalBill.payment_details.paid_at) : "-"}</p>
                    </div>
                    <div>
                      <span className="text-subtle">Metode:</span>
                      <p className="font-medium text-gray-700">{methodLabels[verifyModalBill.payment_details?.method] || "Bank Transfer"}</p>
                    </div>
                  </div>

                  {verifyModalBill.payment_details?.note && (
                    <div className="pt-2 border-t border-line/60 text-xs">
                      <span className="text-subtle">Catatan Penghuni:</span>
                      <p className="italic text-gray-800">"{verifyModalBill.payment_details.note}"</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-line flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-subtle">Total Tagihan:</span>
                    <span className="font-serif text-2xl font-bold text-primary tnum">
                      {fmtIDR(verifyModalBill.total)}
                    </span>
                  </div>
                </div>

                {/* Reject Input Field */}
                {showRejectBox ? (
                  <div className="space-y-2 p-3 bg-rose-50 rounded-2xl border border-rose-200">
                    <label className="text-xs font-bold text-rose-900 block">Alasan Penolakan Bukti *</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Contoh: Bukti buram / nominal transfer tidak sesuai..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectBox(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        loading={submitting}
                        onClick={() => handleVerify("reject")}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        Konfirmasi Tolak
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectBox(true)}
                      className="flex-1 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
                    >
                      <XCircle size={15} className="mr-1.5 text-rose-600" /> Tolak Bukti
                    </Button>
                    <Button
                      type="button"
                      loading={submitting}
                      onClick={() => handleVerify("approve")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <CheckCircle2 size={15} className="mr-1.5" /> Setujui & Lunaskan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── 7. DIGITAL RECEIPT MODAL ─────────────────────────────────── */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl border border-line shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Action Bar */}
            <div className="px-6 py-3 border-b border-line flex items-center justify-between bg-muted/40 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Kwitansi Pembayaran Resmi</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={printReceipt} className="text-xs">
                  <Printer size={13} className="mr-1" /> Cetak / PDF
                </Button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-subtle hover:text-primary"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-8 overflow-y-auto bg-white text-ink font-sans space-y-6" id="printable-receipt">
              {receiptLoading || !receiptData ? (
                <div className="py-16 text-center text-subtle animate-pulse text-sm">Menyiapkan Kwitansi...</div>
              ) : (
                <>
                  {/* Brand Header */}
                  <div className="flex items-start justify-between border-b-2 border-primary/20 pb-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-primary tracking-tight">LEWI HOUSE</h2>
                      <p className="text-[11px] uppercase tracking-widest text-secondary font-bold font-mono">Boutique Living & Boarding</p>
                      <p className="text-[11px] text-gray-500 mt-1">Bandung, Jawa Barat · support@lewihouse.com</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full font-mono">
                        LUNAS / PAID
                      </span>
                      <p className="text-xs font-mono font-bold text-primary mt-2">{receiptData.receipt_number}</p>
                      <p className="text-[11px] text-gray-500">Ref: {receiptData.invoice_number}</p>
                    </div>
                  </div>

                  {/* Customer & Bill Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 uppercase font-bold text-[10px]">Diterima Dari (Penyewa):</p>
                      <p className="font-serif text-base font-bold text-primary mt-0.5">{receiptData.tenant?.name}</p>
                      <p className="text-gray-600">{receiptData.tenant?.phone} · Kamar {receiptData.room?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 uppercase font-bold text-[10px]">Tanggal Pembayaran:</p>
                      <p className="font-bold text-primary mt-0.5">{fmtDate(receiptData.issued_at)}</p>
                      <p className="text-gray-600">Periode: {monthLabel(receiptData.period)}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-line rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-subtle font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Rincian Pembayaran</th>
                          <th className="p-2.5 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {receiptData.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-gray-800">{it.name}</td>
                            <td className="p-2.5 text-right font-mono font-bold">{fmtIDR(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-primary/5 font-bold">
                        <tr>
                          <td className="p-2.5 text-primary">TOTAL DITERIMA</td>
                          <td className="p-2.5 text-right font-mono text-base text-primary font-bold">
                            {fmtIDR(receiptData.total_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Verification Seal & Signature */}
                  <div className="pt-4 border-t border-dashed border-line flex items-center justify-between text-xs text-gray-600">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-subtle">Kanal Pembayaran:</p>
                      <p className="font-medium text-primary font-mono">{receiptData.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-subtle">Diverifikasi Oleh:</p>
                      <p className="font-serif font-bold text-primary">{receiptData.verified_by}</p>
                      <p className="text-[10px] text-emerald-700 font-bold">✓ Official Certified Digital Receipt</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── 8. PRORATA ROOM TRANSFER SHEET ──────────────────────────── */}
      <Sheet
        open={prorataOpen}
        onClose={() => setProrataOpen(false)}
        title="Kalkulator Prorata Pindah Kamar"
        subtitle="Hitung penyesuaian sewa otomatis saat penghuni berpindah unit di pertengahan bulan"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProrataOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="prorata-form"
              loading={submitting}
              className="flex-1"
            >
              Terbitkan Invoice Prorata
            </Button>
          </>
        }
      >
        <form id="prorata-form" onSubmit={submitProrata} className="space-y-3">
          <Select
            label="Pilih Penghuni *"
            value={prorataForm.tenant_id}
            onChange={(e) => {
              const tid = e.target.value;
              const t = tenants.find((x) => x.id === tid);
              setProrataForm({
                ...prorataForm,
                tenant_id: tid,
                old_room_id: t?.room_id || "",
              });
            }}
            required
          >
            <option value="">-- Pilih Penghuni Aktif --</option>
            {tenants.filter((t) => t.status === "active").map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Kamar Sekarang: {roomName(t.room_id)})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kamar Lama *"
              value={prorataForm.old_room_id}
              onChange={(e) => setProrataForm({ ...prorataForm, old_room_id: e.target.value })}
              required
            >
              <option value="">-- Kamar Lama --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({fmtIDR(r.price)})
                </option>
              ))}
            </Select>

            <Select
              label="Kamar Baru *"
              value={prorataForm.new_room_id}
              onChange={(e) => setProrataForm({ ...prorataForm, new_room_id: e.target.value })}
              required
            >
              <option value="">-- Kamar Baru --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({fmtIDR(r.price)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tanggal Pindah Kamar *"
              type="date"
              value={prorataForm.transfer_date}
              onChange={(e) => setProrataForm({ ...prorataForm, transfer_date: e.target.value })}
              required
            />
            <Input
              label="Periode (YYYY-MM) *"
              type="month"
              value={prorataForm.period}
              onChange={(e) => setProrataForm({ ...prorataForm, period: e.target.value })}
              required
            />
          </div>

          <div className="p-3.5 bg-muted rounded-2xl border border-line text-xs text-subtle space-y-1">
            <p className="font-bold text-primary">Formula Perhitungan Prorata:</p>
            <p>• Hari 1 s.d. Tanggal Pindah: Tarif kamar lama dihitung harian.</p>
            <p>• Sisa hari bulan berjalan: Tarif kamar baru dihitung harian.</p>
          </div>
        </form>
      </Sheet>

      {/* ─── 9. DYNAMIC DUNNING & WHATSAPP SHEET ─────────────────────── */}
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

      {/* ─── 10. DYNAMIC ADD/EDIT INVOICE SHEET ──────────────────────── */}
      <Sheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title={editing ? `Edit ${editing.invoice_number}` : "Terbitkan Tagihan / Custom Bill"}
        subtitle={editing ? "Perbarui komponen biaya invoice resmi" : "Pilih penyewa dan tambahkan rincian komponen tagihan sewa & utilitas"}
        maxWidth="sm:max-w-2xl"
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
              {editing ? "Simpan Perubahan" : "Terbitkan Invoice Resmi"}
            </Button>
          </>
        }
      >
        <form id="bill-form" onSubmit={submit} className="space-y-3">
          <FormSection title="Penyewa & Jadwal Jatuh Tempo">
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
                label="Batas Tanggal Jatuh Tempo *"
                testid="input-bill-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
          </FormSection>

          {/* Dynamic Bill Components */}
          <FormSection title="Komponen Rincian Biaya (Line Items)">
            <div className="space-y-2.5">
              {form.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/40 rounded-2xl border border-line/70 flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full text-xs font-bold p-2 bg-white border border-line rounded-xl"
                      placeholder="Nama Biaya (contoh: Sewa Pokok, Listrik kWh)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-36 sm:w-44">
                    <MoneyInput
                      value={item.amount}
                      onChange={(val) => handleItemChange(idx, "amount", val)}
                      placeholder="Nominal (Rp)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 rounded-xl text-subtle hover:text-danger hover:bg-danger/10 active:scale-95"
                    title="Hapus baris"
                  >
                    <Minus size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Preset Quick Add Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-subtle mr-1">+ Tambah Preset:</span>
              <button
                type="button"
                onClick={() => handleAddItem("Listrik (Selisih kWh)", "electricity", 150000)}
                className="px-2.5 py-1 bg-white hover:bg-muted border border-line rounded-lg text-[11px] font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus size={11} /> Listrik kWh
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("Air / PDAM", "water", 50000)}
                className="px-2.5 py-1 bg-white hover:bg-muted border border-line rounded-lg text-[11px] font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus size={11} /> Air PDAM
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("Layanan Kebersihan", "add_on", 100000)}
                className="px-2.5 py-1 bg-white hover:bg-muted border border-line rounded-lg text-[11px] font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus size={11} /> Kebersihan
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("Parkir Kendaraan", "add_on", 150000)}
                className="px-2.5 py-1 bg-white hover:bg-muted border border-line rounded-lg text-[11px] font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus size={11} /> Parkir
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("Denda Keterlambatan", "penalty", 50000)}
                className="px-2.5 py-1 bg-white hover:bg-muted border border-line rounded-lg text-[11px] font-medium text-rose-700 flex items-center gap-1"
              >
                <Plus size={11} /> Denda
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("Biaya Lainnya", "other", 0)}
                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[11px] font-bold flex items-center gap-1"
              >
                <Plus size={11} /> Kustom
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between mt-3">
              <span className="text-xs uppercase font-bold text-subtle tracking-wider">Total Tagihan:</span>
              <span className="font-serif text-2xl font-bold text-primary tnum">
                {fmtIDR(totalCalculatedForm)}
              </span>
            </div>
          </FormSection>

          <FormSection title="Catatan Invoice">
            <Textarea
              label="Catatan Tambahan (Opsional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan khusus invoice untuk dicetak di invoice..."
            />
          </FormSection>
        </form>
      </Sheet>

      {/* ─── 11. RECORD PAYMENT SHEET ─────────────────────────────────── */}
      <Sheet
        open={paySheet}
        onClose={() => setPaySheet(false)}
        title="Catat Pembayaran Masuk"
        subtitle="Simpan pembayaran transfer bank, QRIS, atau tunai manual"
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
        <form id="pay-form" onSubmit={submitPayment} className="space-y-3">
          <FormSection title="Rincian Tagihan & Nominal">
            <Select
              label="Pilih Invoice Tagihan *"
              testid="input-pay-bill"
              value={payForm.bill_id}
              onChange={(e) => onPayBillChange(e.target.value)}
              required
            >
              <option value="">-- Pilih Tagihan Tertunda --</option>
              {bills.filter((b) => (b.status || "").toUpperCase() !== "PAID").map((b) => (
                <option key={b.id} value={b.id}>
                  {b.invoice_number} — {b.resident_name || tenantName(b.tenant_id)} (Sisa: {fmtIDR(b.total - (b.amount_paid || 0))})
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
                <option value="BANK_TRANSFER">Transfer Bank (BCA / Mandiri)</option>
                <option value="QRIS">QRIS</option>
                <option value="CASH">Tunai (Cash)</option>
              </Select>
              <Input
                label="Nomor Referensi / Struk"
                testid="input-pay-ref"
                placeholder="Contoh: TRF98810"
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
