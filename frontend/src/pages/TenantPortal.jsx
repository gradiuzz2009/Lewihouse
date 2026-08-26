import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, fmtIDR, fmtDate, fmtDateTime } from "../lib/api";
import { enablePush } from "../lib/push";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Sheet, Button, Input, Select, Textarea, FormSection, Badge } from "../components/ui";
import {
  Home, CreditCard, Wrench, MessageCircle, FileText,
  User, LogOut, Bell, Send, ArrowLeft, ChevronRight,
  Clock, CheckCircle, AlertCircle, Plus, X, KeyRound, Sparkles,
  QrCode, Building2, Copy, Check, ExternalLink, ShieldCheck, Download
} from "lucide-react";

const WS_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");

const STATUS_STYLE = {
  unpaid: "bg-danger/10 text-danger border-danger/20",
  partially_paid: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-danger/10 text-danger border-danger/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-subtle/10 text-subtle border-line",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
};

const STATUS_LABEL = {
  unpaid: "Belum Bayar",
  partially_paid: "Sebagian",
  paid: "Lunas",
  pending: "Menunggu",
  in_progress: "Diproses",
  resolved: "Selesai",
  closed: "Ditutup",
  approved: "Disetujui",
  rejected: "Ditolak",
};

// ─── HOME TAB ─────────────────────────────────
function HomeTab({ tenant, room, onRefresh }) {
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
      {room?.facilities?.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 border border-line shadow-soft">
          <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">Fasilitas Kamar Anda</p>
          <div className="flex flex-wrap gap-2">
            {room.facilities.map((f) => (
              <span key={f} className="px-3 py-1 bg-muted rounded-full text-xs font-semibold text-primary border border-line/60">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

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
            <p className="text-[11px] text-subtle mt-0.5">Terima update invoice & status tiket langsung di HP</p>
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
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [payTab, setPayTab] = useState("qris"); // "qris" | "va" | "manual"
  const [selectedBank, setSelectedBank] = useState("bca");
  const [loadingPay, setLoadingPay] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const load = () => {
    api.get("/portal/bills")
      .then(({ data }) => setBills(data))
      .catch(() => toast.error("Gagal memuat tagihan"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openPaymentModal = async (bill) => {
    setSelectedBill(bill);
    setLoadingPay(true);
    try {
      const { data } = await api.post(`/portal/bills/${bill.id}/pay`, { method: "qris" });
      setPaymentData(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyiapkan kanal pembayaran");
      setSelectedBill(null);
    } finally {
      setLoadingPay(false);
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} disalin`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  if (loading) return <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat data tagihan...</div>;
  if (bills.length === 0) {
    return (
      <div className="py-16 text-center text-subtle">
        <CreditCard size={40} className="mx-auto mb-3 text-line" />
        <p className="text-sm font-semibold">Tidak ada tagihan tertunda</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-4 space-y-3.5 fade-up">
      {bills.map((b) => {
        const remaining = Math.max(0, b.total - b.amount_paid);
        const isPaid = b.status === "paid";
        return (
          <div key={b.id} className="bg-surface rounded-2xl p-4 border border-line shadow-soft space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-secondary font-bold font-mono">{b.invoice_number}</p>
                <p className="font-serif text-2xl font-bold text-primary mt-0.5 tnum">{fmtIDR(b.total)}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLE[b.is_overdue ? "overdue" : b.status] || ""}`}>
                {b.is_overdue ? "Terlambat" : STATUS_LABEL[b.status]}
              </span>
            </div>

            {/* Breakdown summary */}
            <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1 border border-line/60">
              <div className="flex justify-between text-subtle">
                <span>Sewa Kamar ({b.period}):</span>
                <span className="font-semibold text-ink tnum">{fmtIDR(b.rent)}</span>
              </div>
              {b.electricity > 0 && (
                <div className="flex justify-between text-subtle">
                  <span>Listrik / PLN:</span>
                  <span className="font-semibold text-ink tnum">{fmtIDR(b.electricity)}</span>
                </div>
              )}
              {b.water > 0 && (
                <div className="flex justify-between text-subtle">
                  <span>Air / PDAM:</span>
                  <span className="font-semibold text-ink tnum">{fmtIDR(b.water)}</span>
                </div>
              )}
              {b.other > 0 && (
                <div className="flex justify-between text-subtle">
                  <span>{b.other_label || "Biaya Lain"}:</span>
                  <span className="font-semibold text-ink tnum">{fmtIDR(b.other)}</span>
                </div>
              )}
              {b.late_fee > 0 && (
                <div className="flex justify-between text-danger font-semibold">
                  <span>Denda Keterlambatan:</span>
                  <span className="tnum">{fmtIDR(b.late_fee)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                {b.due_date && (
                  <p className="text-[11px] text-subtle">Jatuh Tempo: <span className="font-semibold text-ink">{fmtDate(b.due_date)}</span></p>
                )}
                {!isPaid && remaining > 0 && (
                  <p className="text-xs text-danger font-bold mt-0.5">Sisa: {fmtIDR(remaining)}</p>
                )}
              </div>

              {!isPaid ? (
                <button
                  type="button"
                  onClick={() => openPaymentModal(b)}
                  className="px-4 py-2.5 bg-primary hover:bg-[#122820] text-white rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-soft transition-all min-h-[44px]"
                >
                  <CreditCard size={15} /> Bayar Sekarang
                </button>
              ) : (
                <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                  <CheckCircle size={14} /> Lunas Terverifikasi
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Dynamic Payment Sheet Modal */}
      <Sheet
        open={!!selectedBill}
        onClose={() => { setSelectedBill(null); setPaymentData(null); }}
        title={`Pembayaran: ${selectedBill?.invoice_number || ""}`}
        subtitle={`Total Tagihan: ${fmtIDR(paymentData?.amount || selectedBill?.total || 0)}`}
        maxWidth="sm:max-w-lg"
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
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white"
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
            {/* Payment Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPayTab("qris")}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payTab === "qris" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
                }`}
              >
                <QrCode size={14} /> QRIS
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
              <button
                type="button"
                onClick={() => setPayTab("manual")}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payTab === "manual" ? "bg-white text-primary shadow-xs" : "text-subtle hover:text-ink"
                }`}
              >
                <CreditCard size={14} /> Transfer Bank
              </button>
            </div>

            {/* TAB 1: QRIS */}
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
                  Nominal Pas: {fmtIDR(paymentData?.amount || 0)}
                </div>
                <p className="text-[10px] text-subtle font-mono">Batas waktu bayar: 24 jam</p>
              </div>
            )}

            {/* TAB 2: Virtual Account */}
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
                    <p className="text-[11px] text-subtle mt-1 leading-relaxed">
                      1. Buka m-Banking / ATM {paymentData.va_numbers[selectedBank].bank}.<br />
                      2. Pilih menu Transfer → Virtual Account.<br />
                      3. Masukkan nomor VA di atas dan pastikan nama penerima <strong>Lewi House</strong>.<br />
                      4. Status tagihan akan otomatis Lunas setelah pembayaran selesai.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Transfer Manual */}
            {payTab === "manual" && (
              <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-line text-xs">
                <p className="font-bold text-primary uppercase tracking-wider">Rekening Resmi Lewi House</p>
                <div className="bg-white p-3 rounded-xl border border-line space-y-1">
                  <p className="text-[10px] text-subtle uppercase tracking-wider font-bold">Bank Central Asia (BCA)</p>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold text-primary">8830912881</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("8830912881", "No. Rekening BCA")}
                      className="px-2.5 py-1 bg-muted rounded-lg text-[11px] font-bold text-primary flex items-center gap-1"
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
                      className="px-2.5 py-1 bg-muted rounded-lg text-[11px] font-bold text-primary flex items-center gap-1"
                    >
                      <Copy size={12} /> Salin
                    </button>
                  </div>
                  <p className="text-[11px] text-subtle">a.n. Lewi House Management</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
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
      .then(({ data }) => setTickets(data))
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
      toast.success("Tiket terkirim ke pengelola kosan");
      setShowNew(false);
      setForm({ title: "", description: "", category: "other", priority: "medium" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengirim tiket");
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
        <Plus size={18} /> Ajukan Tiket Perbaikan Baru
      </button>

      {/* Ticket list */}
      {loading ? (
        <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat tiket...</div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-subtle">
          <Wrench size={36} className="mx-auto mb-2 text-line" />
          <p className="text-sm font-semibold">Belum ada tiket keluhan</p>
        </div>
      ) : (
        tickets.map((t) => (
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
        title="Ajukan Tiket Perbaikan"
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
              Kirim Tiket
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

// ─── CHAT TAB ─────────────────────────────────
function ChatTab({ tenantId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    api.get("/portal/messages")
      .then(({ data }) => {
        if (!cancelled) {
          setMessages(data);
          setLoading(false);
          scrollDown();
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    const token = localStorage.getItem("lh_token");
    if (token && WS_BASE) {
      try {
        const ws = new WebSocket(`${WS_BASE}/ws/chat/${tenantId}?token=${token}`);
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollDown();
          } catch {}
        };
        wsRef.current = ws;
      } catch {}
    }

    return () => {
      cancelled = true;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [tenantId, scrollDown]);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: msg }));
    } else {
      try {
        const { data } = await api.post("/portal/messages", { text: msg });
        setMessages((prev) => [...prev, data]);
        scrollDown();
      } catch {
        toast.error("Gagal mengirim pesan");
      }
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 170px)" }}>
      <div className="px-4 py-2.5 border-b border-line bg-surface/90 backdrop-blur-md">
        <p className="text-xs font-bold text-primary flex items-center gap-1.5">
          <MessageCircle size={14} /> Percakapan dengan Pengelola Kosan
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
        {loading ? (
          <div className="text-center py-12 text-subtle text-sm animate-pulse">Memuat percakapan...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-subtle text-sm">
            <MessageCircle size={36} className="mx-auto mb-2 text-line" />
            Belum ada pesan. Ketik pesan untuk menghubungi pengelola.
          </div>
        ) : (
          messages.map((m) => {
            const isTenant = m.sender === "tenant";
            return (
              <div key={m.id || m.created_at} className={`flex ${isTenant ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                    isTenant
                      ? "bg-primary text-white rounded-br-xs"
                      : "bg-surface text-ink border border-line/60 rounded-bl-xs"
                  }`}
                >
                  {!isTenant && (
                    <p className="text-[10px] font-bold text-secondary mb-1">{m.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1.5 ${isTenant ? "text-white/70" : "text-subtle"} text-right`}>
                    {fmtDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-line bg-surface">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan ke pengelola..."
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 max-h-24 min-h-[44px]"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={send}
            disabled={!text.trim()}
            className="w-11 h-11 rounded-full bg-primary text-white grid place-items-center disabled:opacity-40 shrink-0 shadow-soft"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
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
      .then(({ data }) => setRequests(data))
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
      ) : requests.length === 0 ? (
        <div className="py-8 text-center text-subtle text-sm">Belum ada pengajuan aktif</div>
      ) : (
        requests.map((r) => (
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
  { key: "tickets", icon: Wrench, label: "Tiket" },
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "requests", icon: FileText, label: "Pengajuan" },
];

export default function TenantPortal() {
  const [tab, setTab] = useState("home");
  const [tenant, setTenant] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get("/portal/me")
      .then(({ data }) => {
        setTenant(data.tenant);
        setRoom(data.room);
      })
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

  const doLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg">
        <p className="font-serif text-primary text-xl animate-pulse font-bold">Lewi House</p>
      </div>
    );
  }

  return (
    <div className="max-w-md sm:max-w-xl mx-auto min-h-screen bg-bg relative pb-24 shadow-lifted overflow-x-hidden" data-testid="tenant-portal">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-surface/90 backdrop-blur-xl border-b border-line sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center text-primary font-serif font-bold text-base border border-primary/20">
            {tenant?.name?.[0]?.toUpperCase() || <User size={16} />}
          </div>
          <div>
            <p className="text-xs font-bold text-ink truncate">{tenant?.name}</p>
            <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">{room ? `Kamar ${room.name}` : "Portal Penghuni"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={doLogout}
          className="w-10 h-10 rounded-full hover:bg-muted/80 grid place-items-center text-subtle hover:text-danger active:scale-95 transition-colors"
          title="Keluar"
        >
          <LogOut size={18} />
        </button>
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
          {tab === "home" && <HomeTab tenant={tenant} room={room} />}
          {tab === "bills" && <BillsTab />}
          {tab === "tickets" && <TicketsTab />}
          {tab === "chat" && <ChatTab tenantId={tenant?.id} />}
          {tab === "requests" && <RequestsTab />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl bg-white/90 backdrop-blur-xl border-t border-line flex justify-around items-stretch pt-2 pb-safe z-40 rounded-t-3xl shadow-lifted">
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
    </div>
  );
}
