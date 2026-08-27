import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, fmtIDR, fmtDate, fmtDateTime, monthLabel } from "../lib/api";
import { enablePush } from "../lib/push";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Sheet, Button, Input, Select, Textarea, FormSection, Badge } from "../components/ui";
import UserIndicator from "../components/UserIndicator";
import { validateNewPassword, evaluatePasswordStrength } from "../lib/autoCredentials";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import TenantChatWidget from "../components/TenantChatWidget";
import {
  Home, CreditCard, Wrench, MessageCircle, FileText,
  User, LogOut, Bell, Send, ArrowLeft, ChevronRight,
  Clock, CheckCircle, AlertCircle, Plus, X, KeyRound, Sparkles,
  QrCode, Building2, Copy, Check, ExternalLink, ShieldCheck, Download, Eye, EyeOff, Lock, Shield, ShieldAlert,
  UploadCloud, Image, Printer, CheckCircle2, AlertTriangle, Receipt
} from "lucide-react";

const WS_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");

const methodLabels = {
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  cash: "Tunai",
  CASH: "Tunai",
  midtrans: "Midtrans Gateway"
};

function getOverdueDays(dueDateStr) {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = now - due;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

const STATUS_STYLE = {
  unpaid: "bg-danger/10 text-danger border-danger/20",
  UNPAID: "bg-danger/10 text-danger border-danger/20",
  verifying: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  VERIFYING: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  partially_paid: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  PARTIAL_PAID: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  paid: "bg-success/10 text-success border-success/20",
  PAID: "bg-success/10 text-success border-success/20",
  overdue: "bg-danger/10 text-danger border-danger/20",
  OVERDUE: "bg-danger/10 text-danger border-danger/20",
  cancelled: "bg-gray-200 text-gray-700 border-gray-300",
  CANCELLED: "bg-gray-200 text-gray-700 border-gray-300",
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-subtle/10 text-subtle border-line",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
};

const STATUS_LABEL = {
  unpaid: "Belum Bayar",
  UNPAID: "Belum Bayar",
  verifying: "Sedang Diverifikasi",
  VERIFYING: "Sedang Diverifikasi",
  partially_paid: "Sebagian",
  PARTIAL_PAID: "Sebagian",
  paid: "Lunas",
  PAID: "Lunas",
  overdue: "Terlambat",
  OVERDUE: "Terlambat",
  cancelled: "Dibatalkan",
  CANCELLED: "Dibatalkan",
  pending: "Menunggu",
  in_progress: "Diproses",
  resolved: "Selesai",
  closed: "Ditutup",
  approved: "Disetujui",
  rejected: "Ditolak",
};

// ─── HOME TAB ─────────────────────────────────
function HomeTab({ tenant, room, onNavigate, onOpenSecurity }) {
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setPushEnabled(true);
  }, []);

  const handlePush = async () => {
    try {
      await enablePush();
      setPushEnabled(true);
      toast.success("Notifikasi aktif ✓");
    } catch (e) {
      toast.error(e.message === "denied" ? "Notifikasi diblokir browser" : "Gagal mengaktifkan");
    }
  };

  return (
    <div className="px-4 sm:px-5 py-5 space-y-4 fade-up">
      {/* Welcome card */}
      <div className="bg-primary rounded-3xl p-5 text-white grain shadow-lifted">
        <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Selamat Datang di Lewi House</p>
        <h2 className="font-serif text-2xl mt-1 font-bold">{tenant?.name || "Penghuni"}</h2>
        {room && (
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Kamar</p>
              <p className="font-serif text-lg font-bold mt-0.5">{room.name}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Tipe</p>
              <p className="text-xs font-bold capitalize mt-1 truncate">{room.room_type}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Lantai</p>
              <p className="text-sm font-bold mt-0.5">Lt. {room.floor}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate("bills")}
          className="bg-surface rounded-2xl p-4 border border-line flex items-center gap-3 shadow-soft hover:bg-muted/50 active:scale-98 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink group-hover:text-primary transition-colors truncate">Tagihan Sewa</p>
            <p className="text-[10px] text-subtle truncate">Cek & Bayar</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("tickets")}
          className="bg-surface rounded-2xl p-4 border border-line flex items-center gap-3 shadow-soft hover:bg-muted/50 active:scale-98 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <Wrench size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink group-hover:text-primary transition-colors truncate">Lapor Kendala</p>
            <p className="text-[10px] text-subtle truncate">Laporan Keluhan</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("chat")}
          className="bg-surface rounded-2xl p-4 border border-line flex items-center gap-3 shadow-soft hover:bg-muted/50 active:scale-98 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <MessageCircle size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink group-hover:text-primary transition-colors truncate">Chat Pengelola</p>
            <p className="text-[10px] text-subtle truncate">Layanan Bantuan</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("requests")}
          className="bg-surface rounded-2xl p-4 border border-line flex items-center gap-3 shadow-soft hover:bg-muted/50 active:scale-98 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink group-hover:text-primary transition-colors truncate">Pengajuan Izin</p>
            <p className="text-[10px] text-subtle truncate">Tamu & Akses</p>
          </div>
        </button>
      </div>

      {/* Account Security & Password Quick Card (Specification #3) */}
      <div className="bg-surface rounded-2xl p-4 border border-line flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 text-primary grid place-items-center shrink-0">
            <ShieldCheck size={20} className="text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink truncate">Keamanan & Password Akun</p>
            <p className="text-[10px] text-subtle truncate">
              Username: <span className="font-mono text-primary font-bold">{tenant?.username || "204_ali"}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSecurity}
          data-testid="btn-open-security-settings"
          className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-[#122820] active:scale-95 transition-all shrink-0 shadow-xs"
        >
          Ubah Sandi
        </button>
      </div>

      {/* Lease info */}
      {tenant?.lease_end && (
        <div className="bg-surface rounded-2xl p-4 border border-line flex items-center gap-3.5 shadow-soft">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 grid place-items-center text-primary shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-subtle font-medium">Masa Sewa Berakhir</p>
            <p className="text-sm font-bold text-primary mt-0.5">{fmtDate(tenant.lease_end)}</p>
          </div>
        </div>
      )}

      {/* Facilities */}
      {(() => {
        const facilityList = Array.isArray(room?.facilities)
          ? room.facilities
          : typeof room?.facilities === "string"
          ? room.facilities.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (facilityList.length === 0) return null;
        return (
          <div className="bg-surface rounded-2xl p-4 border border-line shadow-soft">
            <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">Fasilitas Kamar Anda</p>
            <div className="flex flex-wrap gap-2">
              {facilityList.map((f) => (
                <span key={f} className="px-3 py-1 bg-muted rounded-full text-xs font-semibold text-primary border border-line/60">
                  {f}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Push notification CTA */}
      {!pushEnabled && (
        <button
          type="button"
          onClick={handlePush}
          className="w-full flex items-center gap-3 bg-secondary/15 rounded-2xl p-4 border border-secondary/30 text-left active:scale-[0.98] transition-all shadow-soft"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/30 grid place-items-center text-primary shrink-0">
            <Bell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary">Aktifkan Notifikasi Pengingat</p>
            <p className="text-[11px] text-subtle mt-0.5">Terima update invoice & status keluhan langsung di HP</p>
          </div>
          <ChevronRight size={18} className="text-subtle shrink-0" />
        </button>
      )}
    </div>
  );
}

// ─── BILLS TAB ────────────────────────────────
function BillsTab() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("active"); // "active" | "history"
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [payTab, setPayTab] = useState("manual"); // "manual" | "qris" | "va"
  const [selectedBank, setSelectedBank] = useState("bca");
  const [loadingPay, setLoadingPay] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  // Proof Upload Form State
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("BCA");
  const [proofNote, setProofNote] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  const load = () => {
    api.get("/portal/bills")
      .then(({ data }) => setBills(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Gagal memuat tagihan"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openPaymentModal = async (bill) => {
    setSelectedBill(bill);
    setLoadingPay(true);
    setProofImage(null);
    setProofPreview(bill.payment_details?.proof_image_url || null);
    setSenderName(bill.payment_details?.sender_name || "");
    setSenderBank(bill.payment_details?.bank_name || "BCA");
    setProofNote(bill.payment_details?.note || "");
    setPayTab("manual");
    try {
      const { data } = await api.post(`/portal/bills/${bill.id}/pay`, { method: "qris" });
      setPaymentData(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyiapkan kanal pembayaran");
    } finally {
      setLoadingPay(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result);
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProofSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    if (!proofImage && !proofPreview) {
      toast.error("Pilih foto atau file bukti transfer terlebih dahulu");
      return;
    }
    setUploadingProof(true);
    try {
      const payload = {
        proof_image: proofImage || proofPreview,
        method: "BANK_TRANSFER",
        sender_name: senderName || undefined,
        bank_name: senderBank || undefined,
        note: proofNote || undefined,
      };
      await api.post(`/portal/bills/${selectedBill.id}/upload-proof`, payload);
      toast.success("Bukti transfer berhasil dikirim! Menunggu verifikasi admin ✓");
      setSelectedBill(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengunggah bukti pembayaran");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!selectedBill) return;
    setSimulating(true);
    try {
      const { data } = await api.post(`/portal/bills/${selectedBill.id}/simulate-payment`);
      toast.success("Pembayaran Berhasil Dikonfirmasi! Invoice LUNAS ✓");
      setSelectedBill(null);
      setPaymentData(null);
      load();
    } catch {
      toast.error("Gagal simulasi pembayaran");
    } finally {
      setSimulating(false);
    }
  };

  const openReceiptModal = async (billId) => {
    setReceiptLoading(true);
    setReceiptModalOpen(true);
    try {
      const { data } = await api.get(`/portal/bills/${billId}/receipt`);
      setReceiptData(data);
    } catch {
      toast.error("Gagal memuat kwitansi digital");
      setReceiptModalOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} disalin`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const activeBills = useMemo(() => {
    return bills.filter((b) => (b.status || "").toUpperCase() !== "PAID");
  }, [bills]);

  const historyBills = useMemo(() => {
    return bills.filter((b) => (b.status || "").toUpperCase() === "PAID");
  }, [bills]);

  if (loading) return <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat data tagihan...</div>;

  return (
    <div className="px-4 sm:px-5 py-4 space-y-4 fade-up">
      {/* Sub Tabs: Tagihan Aktif vs Riwayat Pembayaran */}
      <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab("active")}
          className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === "active" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
          }`}
        >
          <CreditCard size={14} />
          <span>Tagihan Aktif</span>
          {activeBills.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-mono">
              {activeBills.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("history")}
          className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === "history" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
          }`}
        >
          <Receipt size={14} />
          <span>Riwayat Lunas</span>
          {historyBills.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-mono">
              {historyBills.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: ACTIVE BILLS ────────────────────────────────────── */}
      {activeSubTab === "active" && (
        <div className="space-y-3.5">
          {activeBills.length === 0 ? (
            <div className="py-16 text-center text-subtle bg-surface rounded-2xl border border-line p-6 shadow-soft">
              <CheckCircle size={44} className="mx-auto mb-3 text-emerald-600" />
              <p className="text-base font-bold text-primary">Semua Tagihan Sudah Lunas!</p>
              <p className="text-xs text-subtle mt-1">Tidak ada tagihan tertunda saat ini. Terima kasih atas ketepatan waktu Anda.</p>
            </div>
          ) : (
            activeBills.map((b) => {
              const remaining = Math.max(0, b.total - (b.amount_paid || 0));
              const statusUpper = (b.status || "").toUpperCase();
              const isVerifying = statusUpper === "VERIFYING";
              const isOverdue = b.is_overdue || statusUpper === "OVERDUE";
              const isPartial = statusUpper === "PARTIAL_PAID" || b.status === "partially_paid";
              const overdueDays = getOverdueDays(b.due_date);

              return (
                <div
                  key={b.id}
                  className={`bg-surface rounded-3xl p-5 border shadow-soft space-y-3.5 transition-all ${
                    isVerifying
                      ? "border-amber-300 bg-amber-50/20"
                      : isOverdue
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-line"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold font-mono">
                        {b.invoice_number}
                      </span>
                      <p className="font-serif text-2xl font-bold text-primary mt-0.5 tnum">
                        {fmtIDR(b.total)}
                      </p>
                      <p className="text-xs text-subtle mt-0.5 font-medium">Periode {monthLabel(b.period)}</p>
                    </div>

                    <div className="text-right">
                      {isVerifying && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                          <Eye size={12} /> Menunggu Verifikasi
                        </span>
                      )}
                      {isOverdue && !isVerifying && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                          <AlertTriangle size={12} /> Terlambat {overdueDays > 0 ? `${overdueDays}h` : ""}
                        </span>
                      )}
                      {isPartial && !isVerifying && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                          Sebagian ({fmtIDR(b.amount_paid)})
                        </span>
                      )}
                      {!isVerifying && !isOverdue && !isPartial && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                          Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Informational Banners */}
                  {isVerifying && (
                    <div className="p-3 bg-amber-100/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Bukti Pembayaran Sedang Diverifikasi</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Admin Lewi House sedang mengecek bukti transfer Anda. Kami akan segera memperbarui status ke Lunas.
                        </p>
                      </div>
                    </div>
                  )}

                  {b.payment_details?.rejection_reason && !isVerifying && (
                    <div className="p-3 bg-rose-100 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Bukti Transfer Sebelumnya Ditolak Admin</p>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Alasan: "{b.payment_details.rejection_reason}". Mohon unggah ulang foto bukti transfer yang jelas.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Line Items Breakdown Table */}
                  <div className="p-3.5 bg-muted/40 rounded-2xl text-xs space-y-1.5 border border-line/70">
                    <p className="text-[10px] uppercase font-bold text-subtle tracking-wider">Rincian Komponen Tagihan:</p>
                    {b.items && b.items.length > 0 ? (
                      b.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-800">
                          <span>• {it.name}</span>
                          <span className="font-mono font-semibold">{fmtIDR(it.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center text-gray-800">
                        <span>• Sewa Kamar Standar</span>
                        <span className="font-mono font-semibold">{fmtIDR(b.total)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Due Date & Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-line/70 flex-wrap gap-2">
                    <div>
                      {b.due_date && (
                        <p className="text-[11px] text-subtle">
                          Jatuh Tempo: <span className="font-bold text-ink">{fmtDate(b.due_date)}</span>
                        </p>
                      )}
                      {remaining > 0 && (
                        <p className={`text-xs font-bold mt-0.5 ${isOverdue ? "text-rose-700" : "text-primary"}`}>
                          Sisa: {fmtIDR(remaining)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openPaymentModal(b)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-soft transition-all min-h-[44px] ${
                        isVerifying
                          ? "bg-muted text-primary border border-line hover:bg-muted/80"
                          : "bg-primary hover:bg-[#122820] text-white"
                      }`}
                    >
                      <CreditCard size={15} />
                      <span>{isVerifying ? "Lihat / Ubah Bukti" : "Bayar Sekarang"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 2: PAYMENT HISTORY ─────────────────────────────────── */}
      {activeSubTab === "history" && (
        <div className="space-y-3.5">
          {historyBills.length === 0 ? (
            <div className="py-16 text-center text-subtle bg-surface rounded-2xl border border-line p-6">
              <Receipt size={40} className="mx-auto mb-2 text-line" />
              <p className="text-sm font-semibold">Belum ada riwayat pembayaran lunas</p>
            </div>
          ) : (
            historyBills.map((b) => (
              <div
                key={b.id}
                className="bg-surface rounded-2xl p-4 border border-line shadow-soft space-y-3 border-l-4 border-l-emerald-600"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-secondary">{b.invoice_number}</span>
                    <p className="font-serif text-xl font-bold text-primary mt-0.5 tnum">{fmtIDR(b.total)}</p>
                    <p className="text-xs text-subtle">Periode {monthLabel(b.period)}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Lunas ✓
                  </span>
                </div>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-subtle">
                  <span>Metode: <strong className="text-gray-800">{methodLabels[b.payment_method] || methodLabels[b.payment_details?.method] || "Transfer Bank"}</strong></span>
                  <button
                    type="button"
                    onClick={() => openReceiptModal(b.id)}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <FileText size={13} /> Cetak Kwitansi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── PAYMENT & PROOF UPLOAD SHEET ───────────────────────────── */}
      <Sheet
        open={!!selectedBill}
        onClose={() => { setSelectedBill(null); setPaymentData(null); }}
        title={`Pembayaran: ${selectedBill?.invoice_number || ""}`}
        subtitle={`Total Tagihan: ${fmtIDR(paymentData?.amount || selectedBill?.total || 0)}`}
        maxWidth="sm:max-w-xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setSelectedBill(null); setPaymentData(null); }}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleSimulateSuccess}
              loading={simulating}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
            >
              <Sparkles size={14} className="mr-1" /> Simulasi Bayar Lunas
            </Button>
          </>
        }
      >
        {loadingPay ? (
          <div className="py-16 text-center text-subtle text-sm animate-pulse">Menyiapkan kanal pembayaran...</div>
        ) : (
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPayTab("manual")}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payTab === "manual" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
                }`}
              >
                <CreditCard size={14} /> Transfer & Bukti
              </button>
              <button
                type="button"
                onClick={() => setPayTab("qris")}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payTab === "qris" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
                }`}
              >
                <QrCode size={14} /> Scan QRIS
              </button>
              <button
                type="button"
                onClick={() => setPayTab("va")}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payTab === "va" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
                }`}
              >
                <Building2 size={14} /> Virtual Account
              </button>
            </div>

            {/* TAB 1: TRANSFER BANK & UNGGAH BUKTI (PRD FLOW) */}
            {payTab === "manual" && (
              <form onSubmit={handleUploadProofSubmit} className="space-y-4">
                {/* Bank Account Cards */}
                <div className="space-y-2 bg-muted/40 p-3.5 rounded-2xl border border-line">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Rekening Tujuan Lewi House</p>
                  
                  <div className="bg-white p-3 rounded-xl border border-line space-y-1">
                    <p className="text-[10px] text-subtle uppercase tracking-wider font-bold">BCA (Bank Central Asia)</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-primary">8830912881</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("8830912881", "No. Rekening BCA")}
                        className="px-2.5 py-1 bg-muted rounded-lg text-[11px] font-bold text-primary flex items-center gap-1 active:scale-95"
                      >
                        <Copy size={12} /> Salin
                      </button>
                    </div>
                    <p className="text-[11px] text-subtle">a.n. Lewi House Management</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line space-y-1">
                    <p className="text-[10px] text-subtle uppercase tracking-wider font-bold">Bank Mandiri</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-primary">1320098765432</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("1320098765432", "No. Rekening Mandiri")}
                        className="px-2.5 py-1 bg-muted rounded-lg text-[11px] font-bold text-primary flex items-center gap-1 active:scale-95"
                      >
                        <Copy size={12} /> Salin
                      </button>
                    </div>
                    <p className="text-[11px] text-subtle">a.n. Lewi House Management</p>
                  </div>
                </div>

                {/* Upload Proof Area */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Unggah Bukti Pembayaran</p>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 hover:border-primary rounded-2xl p-4 text-center cursor-pointer bg-surface hover:bg-muted/30 transition-all flex flex-col items-center justify-center min-h-[140px]"
                  >
                    {proofPreview ? (
                      <div className="space-y-2">
                        <img
                          src={proofPreview}
                          alt="Preview Bukti"
                          className="max-h-36 max-w-full object-contain mx-auto rounded-xl shadow-xs"
                        />
                        <p className="text-xs text-primary font-bold">Klik untuk ganti foto bukti</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={32} className="text-primary/70 mb-2" />
                        <p className="text-xs font-bold text-primary">Pilih Foto / Struk Bukti Transfer</p>
                        <p className="text-[11px] text-subtle mt-0.5">Format JPG, PNG (Maks. 5MB)</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Nama Pemilik Rekening"
                      placeholder="Nama di rekening Anda"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                    <Input
                      label="Bank Pengirim"
                      placeholder="Contoh: BCA, Mandiri, BRI"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                    />
                  </div>

                  <Textarea
                    label="Catatan Tambahan (Opsional)"
                    placeholder="Tuliskan catatan transfer jika ada..."
                    rows={2}
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                  />

                  <Button
                    type="submit"
                    loading={uploadingProof}
                    className="w-full bg-primary hover:bg-[#122820] text-white font-bold"
                  >
                    <UploadCloud size={16} className="mr-1.5" /> Kirim Bukti Transfer ke Admin
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: QRIS */}
            {payTab === "qris" && (
              <div className="text-center space-y-3 bg-muted/30 p-4 rounded-2xl border border-line">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Scan QRIS Lewi House</p>
                <p className="text-[11px] text-subtle">Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Livin Mandiri & Semua Bank</p>
                
                <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border-2 border-primary/20 shadow-soft grid place-items-center">
                  <img
                    src={paymentData?.qris_url || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LEWIHOUSE-DEMO"}
                    alt="QRIS Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold">
                  Nominal Pas: {fmtIDR(paymentData?.amount || selectedBill?.total || 0)}
                </div>
                <p className="text-[10px] text-subtle font-mono">Batas waktu bayar: 24 jam</p>
              </div>
            )}

            {/* TAB 3: VIRTUAL ACCOUNT */}
            {payTab === "va" && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {["bca", "mandiri", "bri", "bni"].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                        selectedBank === bank
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-surface border-line text-subtle hover:border-primary/30"
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>

                {paymentData?.va_numbers?.[selectedBank] && (
                  <div className="p-4 bg-muted/40 rounded-2xl border border-line space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">
                      Nomor Virtual Account {paymentData.va_numbers[selectedBank].bank}
                    </p>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-line">
                      <span className="font-mono text-base font-bold text-primary tracking-wider">
                        {paymentData.va_numbers[selectedBank].va_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentData.va_numbers[selectedBank].va_number, "No. VA")}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        {copiedText === paymentData.va_numbers[selectedBank].va_number ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        <span>{copiedText === paymentData.va_numbers[selectedBank].va_number ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* ─── DIGITAL RECEIPT MODAL ───────────────────────────────────── */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl border border-line shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Actions */}
            <div className="px-6 py-3 border-b border-line flex items-center justify-between bg-muted/40 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Kwitansi Pembayaran Digital</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => window.print()} className="text-xs">
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

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 uppercase font-bold text-[10px]">Diterima Dari (Penyewa):</p>
                      <p className="font-serif text-base font-bold text-primary mt-0.5">{receiptData.tenant?.name}</p>
                      <p className="text-gray-600">{receiptData.tenant?.phone} · Kamar {receiptData.room?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 uppercase font-bold text-[10px]">Tanggal Lunas:</p>
                      <p className="font-bold text-primary mt-0.5">{fmtDate(receiptData.issued_at)}</p>
                      <p className="text-gray-600">Periode: {monthLabel(receiptData.period)}</p>
                    </div>
                  </div>

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
    </div>
  );
}

// ─── TICKETS TAB ──────────────────────────────
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "other", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get("/portal/tickets")
      .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    setSubmitting(true);
    try {
      await api.post("/portal/tickets", form);
      toast.success("Laporan keluhan terkirim ke pengelola kosan");
      setShowNew(false);
      setForm({ title: "", description: "", category: "other", priority: "medium" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengirim laporan keluhan");
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    { value: "plumbing", label: "Pipa / Air" },
    { value: "electrical", label: "Listrik" },
    { value: "ac", label: "AC / Pendingin" },
    { value: "furniture", label: "Furnitur" },
    { value: "internet", label: "Internet / Wi-Fi" },
    { value: "other", label: "Lainnya" },
  ];

  return (
    <div className="px-4 sm:px-5 py-4 space-y-3.5 fade-up">
      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#122820] text-white rounded-full py-3 text-sm font-bold active:scale-[0.98] transition-all shadow-soft min-h-[48px]"
      >
        <Plus size={18} /> Ajukan Keluhan / Perbaikan Baru
      </button>

      {/* Ticket list */}
      {loading ? (
        <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat laporan keluhan...</div>
      ) : (Array.isArray(tickets) ? tickets : []).length === 0 ? (
        <div className="py-12 text-center text-subtle">
          <Wrench size={36} className="mx-auto mb-2 text-line" />
          <p className="text-sm font-semibold">Belum ada laporan keluhan</p>
        </div>
      ) : (
        (Array.isArray(tickets) ? tickets : []).map((t) => (
          <div key={t.id} className="bg-surface rounded-2xl p-4 border border-line shadow-soft">
            <div className="flex justify-between items-start gap-2">
              <p className="font-serif text-base font-bold text-primary flex-1">{t.title}</p>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${STATUS_STYLE[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
            {t.description && <p className="text-xs text-subtle mt-2 leading-relaxed bg-muted/40 p-2.5 rounded-xl">{t.description}</p>}
            <p className="text-[10px] text-subtle mt-2">{fmtDateTime(t.created_at)}</p>
          </div>
        ))
      )}

      {/* Dynamic Adaptive New Ticket Sheet */}
      <Sheet
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Ajukan Keluhan Perbaikan"
        subtitle="Laporkan kendala fasilitas kamar atau area bersama"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNew(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="tenant-ticket-form"
              loading={submitting}
              className="flex-1"
            >
              Kirim Keluhan
            </Button>
          </>
        }
      >
        <form id="tenant-ticket-form" onSubmit={submit} className="space-y-1">
          <FormSection title="Rincian Keluhan">
            <Input
              label="Judul Kendala *"
              required
              placeholder="Contoh: AC Kamar Bocor / Lampu Redup"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              label="Deskripsi Detail (Opsional)"
              rows={3}
              placeholder="Jelaskan kendala secara spesifik..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Kategori Fasilitas"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
              <Select
                label="Tingkat Urgensi"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Rendah (Bisa ditunda)</option>
                <option value="medium">Sedang (Dalam 1-2 hari)</option>
                <option value="high">Tinggi (Hari ini)</option>
                <option value="urgent">Darurat (Segera)</option>
              </Select>
            </div>
          </FormSection>
        </form>
      </Sheet>
    </div>
  );
}

function ChatTab({ tenant, room, onBack }) {
  return (
    <div className="flex flex-col h-[calc(100vh-165px)]">
      <TenantChatWidget tenant={tenant} room={room} isFloating={false} defaultOpen={true} />
    </div>
  );
}

// ─── REQUESTS TAB ─────────────────────────────
function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get("/portal/requests")
      .then(({ data }) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (type) => {
    setSubmitting(true);
    try {
      await api.post("/portal/requests", { request_type: type, note: note || null });
      toast.success("Pengajuan terkirim");
      setShowForm(null);
      setNote("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengirim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-5 py-4 space-y-4 fade-up">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowForm("renewal")}
          className="bg-success/10 rounded-2xl p-4 text-left border border-success/20 active:scale-[0.98] transition-all shadow-soft"
        >
          <div className="w-10 h-10 rounded-xl bg-success/20 grid place-items-center text-success mb-2">
            <CheckCircle size={20} />
          </div>
          <p className="text-xs font-bold text-success">Perpanjangan Sewa</p>
          <p className="text-[10px] text-subtle mt-0.5">Ajukan perpanjang kontrak sewa kamar</p>
        </button>
        <button
          type="button"
          onClick={() => setShowForm("checkout")}
          className="bg-warning/10 rounded-2xl p-4 text-left border border-warning/20 active:scale-[0.98] transition-all shadow-soft"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/20 grid place-items-center text-warning mb-2">
            <AlertCircle size={20} />
          </div>
          <p className="text-xs font-bold text-warning">Check-out Kamar</p>
          <p className="text-[10px] text-subtle mt-0.5">Ajukan keluar sewa & refund deposit</p>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-subtle text-sm animate-pulse">Memuat riwayat pengajuan...</div>
      ) : (Array.isArray(requests) ? requests : []).length === 0 ? (
        <div className="py-8 text-center text-subtle text-sm">Belum ada pengajuan aktif</div>
      ) : (
        (Array.isArray(requests) ? requests : []).map((r) => (
          <div key={r.id} className="bg-surface rounded-2xl p-4 border border-line shadow-soft">
            <div className="flex justify-between items-center">
              <p className="text-sm font-serif font-bold text-primary capitalize">
                Pengajuan {r.request_type === "renewal" ? "Perpanjangan" : "Check-out"}
              </p>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLE[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            {r.note && <p className="text-xs text-subtle mt-1.5 leading-relaxed bg-muted/40 p-2.5 rounded-xl">{r.note}</p>}
            <p className="text-[10px] text-subtle mt-2">{fmtDateTime(r.created_at)}</p>
          </div>
        ))
      )}

      {/* Dynamic Adaptive Request Sheet */}
      <Sheet
        open={!!showForm}
        onClose={() => { setShowForm(null); setNote(""); }}
        title={`Pengajuan ${showForm === "renewal" ? "Perpanjangan Sewa" : "Check-out Kamar"}`}
        subtitle="Kirim permohonan resmi ke pihak pengelola"
        maxWidth="sm:max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowForm(null); setNote(""); }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              loading={submitting}
              onClick={() => submit(showForm)}
              className="flex-1"
            >
              Kirim Pengajuan
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="Catatan atau Alasan (Opsional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tambahkan informasi durasi perpanjangan atau rencana tanggal check-out..."
          />
        </div>
      </Sheet>
    </div>
  );
}

// ─── MAIN PORTAL ──────────────────────────────
const TABS = [
  { key: "home", icon: Home, label: "Beranda" },
  { key: "bills", icon: CreditCard, label: "Tagihan" },
  { key: "tickets", icon: Wrench, label: "Keluhan" },
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "requests", icon: FileText, label: "Pengajuan" },
];

export default function TenantPortal() {
  const [tab, setTab] = useState("home");
  const [tenant, setTenant] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout, updateUser } = useAuth();

  // Force Password Reset state (Specification #2)
  const [forceResetOpen, setForceResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // In-App Security / Change Password state (Specification #3)
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [inAppCurrentPw, setInAppCurrentPw] = useState("");
  const [inAppNewPw, setInAppNewPw] = useState("");
  const [inAppConfirmPw, setInAppConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showInAppNewPw, setShowInAppNewPw] = useState(false);
  const [showInAppConfirmPw, setShowInAppConfirmPw] = useState(false);
  const [inAppError, setInAppError] = useState("");
  const [inAppSubmitting, setInAppSubmitting] = useState(false);

  const inAppStrength = evaluatePasswordStrength(inAppNewPw);

  const loadProfile = () => {
    api.get("/portal/me")
      .then(({ data }) => {
        setTenant(data.tenant);
        setRoom(data.room);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useAutoRefresh(loadProfile);

  useEffect(() => {
    loadProfile();
  }, [tab]);

  // Check if tenant has temporary password and must rotate it
  useEffect(() => {
    if (user?.is_temporary_password || user?.account_status === "ACTIVE_FORCE_RESET") {
      setForceResetOpen(true);
    }
  }, [user]);

  // Force Reset Password Submit
  const handleForceResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    const tempPw = user?.temporary_password || user?.portal_password || tenant?.portal_password;
    const historyList = tenant?.password_history || user?.password_history || [];
    const val = validateNewPassword(newPassword, tempPw, historyList);
    if (!val.valid) {
      setResetError(val.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Konfirmasi password baru tidak cocok");
      return;
    }

    setResetSubmitting(true);
    try {
      await api.post("/portal/change-password", {
        new_password: newPassword,
        temporary_password: tempPw,
      });

      // Update local storage user session
      const updatedUser = {
        ...user,
        is_temporary_password: false,
        account_status: "ACTIVE",
        password_updated_at: new Date().toISOString(),
        temporary_password: null,
      };
      if (updateUser) updateUser(updatedUser);

      setForceResetOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password baru berhasil disimpan! Selamat datang di Dashboard Lewi House 🎉");
      loadProfile();
    } catch (err) {
      setResetError(err.response?.data?.detail || err.message || "Gagal mengubah password");
    } finally {
      setResetSubmitting(false);
    }
  };

  // In-App Change Password Submit (Specification #3)
  const handleInAppChangePassword = async (e) => {
    e.preventDefault();
    setInAppError("");

    if (!inAppCurrentPw) {
      setInAppError("Password saat ini wajib diisi");
      return;
    }
    if (inAppNewPw.length < 8) {
      setInAppError("Password baru minimal 8 karakter");
      return;
    }
    if (!/\d/.test(inAppNewPw)) {
      setInAppError("Password baru wajib mengandung minimal 1 angka (0-9)");
      return;
    }
    if (inAppNewPw !== inAppConfirmPw) {
      setInAppError("Konfirmasi password baru tidak cocok");
      return;
    }

    setInAppSubmitting(true);
    try {
      await api.post("/portal/in-app-change-password", {
        current_password: inAppCurrentPw,
        new_password: inAppNewPw,
        confirm_password: inAppConfirmPw,
      });

      toast.success("Password akun berhasil diperbarui!");
      setSecurityModalOpen(false);
      setInAppCurrentPw("");
      setInAppNewPw("");
      setInAppConfirmPw("");
      loadProfile();
    } catch (err) {
      setInAppError(err.response?.data?.detail || err.message || "Gagal memperbarui password");
    } finally {
      setInAppSubmitting(false);
    }
  };

  const doLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Real-time validation criteria for Force Reset (Specification #2)
  const tempPwVal = user?.temporary_password || user?.portal_password || tenant?.portal_password || "204789";
  const isLenValid = newPassword.length >= 8;
  const isNumValid = /\d/.test(newPassword);
  const isDiffTemp = Boolean(newPassword && newPassword !== tempPwVal);
  const isMatchConfirm = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const canSubmitForceReset = isLenValid && isNumValid && isDiffTemp && isMatchConfirm && !resetSubmitting;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg">
        <p className="font-serif text-primary text-xl animate-pulse font-bold">Lewi House</p>
      </div>
    );
  }

  const activeUsername = user?.username || tenant?.username || "204_ali";

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto min-h-screen bg-bg relative pb-24 shadow-lifted overflow-x-hidden" data-testid="tenant-portal">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-surface/90 backdrop-blur-xl border-b border-line sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center text-primary font-serif font-bold text-base border border-primary/20 shrink-0">
            {tenant?.name?.[0]?.toUpperCase() || <User size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate">{tenant?.name || "Penghuni"}</p>
            <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold truncate">
              {room ? `Kamar ${room.name}` : "Portal Penghuni"} &bull; <span className="font-mono text-primary font-bold">{activeUsername}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSecurityModalOpen(true)}
            className="w-9 h-9 rounded-full bg-surface border border-line hover:bg-muted grid place-items-center text-secondary active:scale-95 transition-colors shadow-xs"
            title="Pengaturan Keamanan & Password"
            data-testid="btn-topbar-security"
          >
            <KeyRound size={16} />
          </button>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 border border-teal-500/25">
            Penghuni
          </span>
          <button
            type="button"
            onClick={doLogout}
            className="w-9 h-9 rounded-full bg-surface border border-line hover:bg-danger/10 grid place-items-center text-subtle hover:text-danger active:scale-95 transition-colors shadow-xs"
            title="Keluar dari Akun"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "home" && <HomeTab tenant={tenant} room={room} onNavigate={setTab} onOpenSecurity={() => setSecurityModalOpen(true)} />}
          {tab === "bills" && <BillsTab />}
          {tab === "tickets" && <TicketsTab />}
          {tab === "chat" && <ChatTab tenant={tenant} room={room} onBack={() => setTab("home")} />}
          {tab === "requests" && <RequestsTab />}
        </motion.div>
      </AnimatePresence>

      {/* Floating Chat Widget across all other tabs */}
      {tab !== "chat" && <TenantChatWidget tenant={tenant} room={room} isFloating={true} />}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white/90 backdrop-blur-xl border-t border-line flex justify-around items-stretch pt-2 pb-safe z-40 rounded-t-3xl shadow-lifted">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-w-[56px] min-h-[48px] active:scale-95 transition-transform"
            >
              {active && (
                <motion.div
                  layoutId="portal-pill"
                  className="absolute inset-x-2 -top-0.5 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon size={20} className={active ? "text-primary" : "text-subtle"} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`text-[10px] font-semibold ${active ? "text-primary font-bold" : "text-subtle"}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. FORCE RESET PASSWORD SCREEN (Specification #2 - Strictly Locked) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {forceResetOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/95 backdrop-blur-md" data-testid="force-reset-password-screen">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-surface rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-line z-[101]"
              >
                {/* Banner Peringatan Keamanan di bagian atas */}
                <div className="flex items-start gap-3.5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl mb-4 text-amber-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 grid place-items-center shrink-0 text-amber-700">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-amber-900 leading-tight">Peringatan Keamanan Akun</h3>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                      Demi keamanan akun Anda, silakan buat password baru sebelum melanjutkan ke dashboard.
                    </p>
                  </div>
                </div>

                {/* Info Akun Aktif */}
                <div className="p-3 bg-muted/60 rounded-xl border border-line/60 flex items-center justify-between text-xs mb-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-secondary" />
                    <span className="text-subtle font-medium">Username Aktif:</span>
                  </div>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                    {activeUsername} {room ? `(Unit ${room.name})` : ""}
                  </span>
                </div>

                <form onSubmit={handleForceResetPassword} className="space-y-3.5">
                  {/* Input 1: Password Baru */}
                  <label className="block">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                      Password Baru
                    </span>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter & 1 angka"
                        data-testid="input-new-password"
                        className="w-full bg-muted/40 border border-line rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  {/* Input 2: Konfirmasi Password Baru */}
                  <label className="block">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                      Konfirmasi Password Baru
                    </span>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        data-testid="input-confirm-password"
                        className="w-full bg-muted/40 border border-line rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  {/* Indikator Validasi Real-Time (Checklist Interaktif) */}
                  <div className="p-3 bg-muted/50 rounded-xl space-y-2 text-[11px] border border-line/60">
                    <p className="font-bold text-[10px] text-ink uppercase tracking-wider mb-1">Kriteria Keamanan:</p>
                    <div className={`flex items-center gap-2 ${isLenValid ? "text-emerald-700 font-semibold" : "text-subtle"}`}>
                      <Check size={14} className={isLenValid ? "text-emerald-600 font-bold" : "text-line"} />
                      <span>Minimal 8 karakter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isNumValid ? "text-emerald-700 font-semibold" : "text-subtle"}`}>
                      <Check size={14} className={isNumValid ? "text-emerald-600 font-bold" : "text-line"} />
                      <span>Mengandung minimal 1 angka (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isDiffTemp ? "text-emerald-700 font-semibold" : "text-subtle"}`}>
                      <Check size={14} className={isDiffTemp ? "text-emerald-600 font-bold" : "text-line"} />
                      <span>Tidak sama dengan password sementara</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isMatchConfirm ? "text-emerald-700 font-semibold" : "text-subtle"}`}>
                      <Check size={14} className={isMatchConfirm ? "text-emerald-600 font-bold" : "text-line"} />
                      <span>Konfirmasi password cocok</span>
                    </div>
                  </div>

                  {/* Pesan Error State (Banner Merah) */}
                  {resetError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2" data-testid="force-reset-error">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    {/* Tombol Aksi: Simpan & Masuk ke Dashboard (Disabled sampai kriteria terpenuhi) */}
                    <button
                      type="submit"
                      disabled={!canSubmitForceReset}
                      data-testid="submit-force-reset-btn"
                      className="w-full py-3.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold tracking-wide shadow-lifted active:scale-98 hover:bg-[#122820] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resetSubmitting ? "Menyimpan Kata Sandi..." : "Simpan & Masuk ke Dashboard"}
                    </button>
                    <button
                      type="button"
                      onClick={doLogout}
                      className="w-full py-2 text-xs font-semibold text-subtle hover:text-danger text-center transition-colors"
                    >
                      Batal & Keluar dari Akun
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 3. IN-APP PROFILE / SECURITY SETTINGS MODAL (Specification #3) */}
      <Sheet
        open={securityModalOpen}
        onClose={() => {
          setSecurityModalOpen(false);
          setInAppError("");
        }}
        title="Pengaturan Keamanan & Password"
      >
        <div className="space-y-4 pt-1" data-testid="in-app-security-modal">
          <div className="p-3.5 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 grid place-items-center text-primary shrink-0">
              <KeyRound size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary">Ganti Kata Sandi Mandiri</p>
              <p className="text-[11px] text-ink/70">Perbarui kata sandi akun Lewi House secara berkala.</p>
            </div>
          </div>

          <form onSubmit={handleInAppChangePassword} className="space-y-3.5">
            {/* Input 1: Password Saat Ini */}
            <label className="block">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                Password Saat Ini
              </span>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  required
                  value={inAppCurrentPw}
                  onChange={(e) => setInAppCurrentPw(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  data-testid="input-current-password"
                  className="w-full bg-muted/40 border border-line rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Input 2: Password Baru */}
            <label className="block">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                Password Baru
              </span>
              <div className="relative">
                <input
                  type={showInAppNewPw ? "text" : "password"}
                  required
                  value={inAppNewPw}
                  onChange={(e) => setInAppNewPw(e.target.value)}
                  placeholder="Minimal 8 karakter & 1 angka"
                  data-testid="input-inapp-new-password"
                  className="w-full bg-muted/40 border border-line rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowInAppNewPw(!showInAppNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                >
                  {showInAppNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Indikator Kekuatan Password (Password Strength Bar) */}
            {inAppNewPw && (
              <div className="space-y-1.5 p-2.5 bg-muted/40 rounded-xl border border-line/60">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-subtle uppercase tracking-wider">Kekuatan Password:</span>
                  <span className={inAppStrength.color.split(" ")[1]}>{inAppStrength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${inAppStrength.color.split(" ")[0]}`}
                    style={{ width: `${inAppStrength.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Input 3: Konfirmasi Password Baru */}
            <label className="block">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider mb-1 block">
                Konfirmasi Password Baru
              </span>
              <div className="relative">
                <input
                  type={showInAppConfirmPw ? "text" : "password"}
                  required
                  value={inAppConfirmPw}
                  onChange={(e) => setInAppConfirmPw(e.target.value)}
                  placeholder="Ulangi password baru"
                  data-testid="input-inapp-confirm-password"
                  className="w-full bg-muted/40 border border-line rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowInAppConfirmPw(!showInAppConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
                >
                  {showInAppConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {inAppError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{inAppError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={inAppSubmitting || !inAppCurrentPw || inAppNewPw.length < 8}
                data-testid="btn-submit-inapp-password"
                className="w-full py-3.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold tracking-wide shadow-lifted active:scale-98 hover:bg-[#122820] transition-all disabled:opacity-40"
              >
                {inAppSubmitting ? "Menyimpan..." : "Perbarui Password"}
              </button>
            </div>
          </form>
        </div>
      </Sheet>
    </div>
  );
}
