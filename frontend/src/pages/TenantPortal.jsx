import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, fmtIDR, fmtDate, fmtDateTime } from "../lib/api";
import { enablePush } from "../lib/push";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Home, CreditCard, Wrench, MessageCircle, FileText,
  User, LogOut, Bell, Send, ArrowLeft, ChevronRight,
  Clock, CheckCircle, AlertCircle, Plus, X
} from "lucide-react";

const WS_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");

const STATUS_STYLE = {
  unpaid: "bg-danger/10 text-danger",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-subtle/10 text-subtle",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
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
    <div className="px-4 py-5 space-y-4 fade-up">
      {/* Welcome card */}
      <div className="bg-primary rounded-2xl p-5 text-white grain">
        <p className="text-white/70 text-xs">Selamat datang</p>
        <h2 className="font-serif text-xl mt-1">{tenant?.name || "Penghuni"}</h2>
        {room && (
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-white/60 text-[10px]">Kamar</p>
              <p className="font-semibold">{room.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px]">Tipe</p>
              <p className="font-semibold capitalize">{room.room_type}</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px]">Lantai</p>
              <p className="font-semibold">{room.floor}</p>
            </div>
          </div>
        )}
      </div>

      {/* Lease info */}
      {tenant?.lease_end && (
        <div className="bg-white rounded-xl p-4 border border-line flex items-center gap-3">
          <Clock size={18} className="text-secondary flex-shrink-0" />
          <div>
            <p className="text-xs text-subtle">Sewa sampai</p>
            <p className="text-sm font-semibold">{fmtDate(tenant.lease_end)}</p>
          </div>
        </div>
      )}

      {/* Facilities */}
      {room?.facilities?.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-line">
          <p className="text-xs font-semibold text-ink mb-2">Fasilitas Kamar</p>
          <div className="flex flex-wrap gap-2">
            {room.facilities.map((f) => (
              <span key={f} className="px-3 py-1 bg-muted rounded-full text-[11px] text-subtle">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Push notification CTA */}
      {!pushEnabled && (
        <button
          onClick={handlePush}
          className="w-full flex items-center gap-3 bg-secondary/10 rounded-xl p-4 border border-secondary/20 text-left"
        >
          <Bell size={20} className="text-secondary" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-ink">Aktifkan Notifikasi</p>
            <p className="text-[11px] text-subtle">Terima pengingat tagihan langsung di HP</p>
          </div>
          <ChevronRight size={16} className="text-subtle" />
        </button>
      )}
    </div>
  );
}

// ─── BILLS TAB ────────────────────────────────
function BillsTab() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/portal/bills")
      .then(({ data }) => setBills(data))
      .catch(() => toast.error("Gagal memuat tagihan"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat...</div>;
  if (bills.length === 0) {
    return (
      <div className="py-16 text-center text-subtle">
        <CreditCard size={36} className="mx-auto mb-3 text-line" />
        <p className="text-sm">Belum ada tagihan</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3 fade-up">
      {bills.map((b) => {
        const remaining = b.total - b.amount_paid;
        return (
          <div key={b.id} className="bg-white rounded-xl p-4 border border-line">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-subtle">{b.invoice_number}</p>
                <p className="font-semibold text-sm mt-0.5">{fmtIDR(b.total)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[b.is_overdue ? "overdue" : b.status] || ""}`}>
                {b.is_overdue ? "Terlambat" : STATUS_LABEL[b.status]}
              </span>
            </div>
            {b.status !== "paid" && remaining > 0 && (
              <p className="text-xs text-danger mt-2">Sisa: {fmtIDR(remaining)}</p>
            )}
            {b.due_date && (
              <p className="text-[11px] text-subtle mt-1">Jatuh tempo: {fmtDate(b.due_date)}</p>
            )}
          </div>
        );
      })}
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

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    setSubmitting(true);
    try {
      await api.post("/portal/tickets", form);
      toast.success("Tiket terkirim ke pengelola");
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
    { value: "plumbing", label: "Pipa/Air" }, { value: "electrical", label: "Listrik" },
    { value: "ac", label: "AC" }, { value: "furniture", label: "Furnitur" },
    { value: "internet", label: "Internet" }, { value: "other", label: "Lainnya" },
  ];

  return (
    <div className="px-4 py-4 space-y-3 fade-up">
      <button
        onClick={() => setShowNew(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        <Plus size={16} /> Ajukan Tiket Baru
      </button>

      {/* New ticket form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-4 border border-line overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-sm">Tiket Baru</p>
              <button onClick={() => setShowNew(false)}><X size={16} className="text-subtle" /></button>
            </div>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul masalah"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi detail (opsional)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm outline-none resize-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-muted text-sm outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-muted text-sm outline-none"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Darurat</option>
                </select>
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Tiket"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket list */}
      {loading ? (
        <div className="py-12 text-center text-subtle text-sm animate-pulse">Memuat...</div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-subtle">
          <Wrench size={32} className="mx-auto mb-2 text-line" />
          <p className="text-sm">Belum ada tiket</p>
        </div>
      ) : (
        tickets.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-4 border border-line">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-sm flex-1">{t.title}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2 ${STATUS_STYLE[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
            {t.description && <p className="text-xs text-subtle mt-1 line-clamp-2">{t.description}</p>}
            <p className="text-[10px] text-subtle mt-2">{fmtDateTime(t.created_at)}</p>
          </div>
        ))
      )}
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
    <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
      <div className="px-4 py-2 border-b border-line bg-white/80">
        <p className="text-xs font-semibold text-primary flex items-center gap-1">
          <MessageCircle size={12} /> Chat Pengelola
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
        {loading ? (
          <div className="text-center py-12 text-subtle text-sm animate-pulse">Memuat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-subtle text-sm">
            <MessageCircle size={32} className="mx-auto mb-2 text-line" />
            Belum ada pesan. Mulai chat dengan pengelola.
          </div>
        ) : (
          messages.map((m) => {
            const isTenant = m.sender === "tenant";
            return (
              <div key={m.id || m.created_at} className={`flex ${isTenant ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isTenant
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-white text-ink border border-line/60 rounded-bl-md"
                  }`}
                >
                  {!isTenant && (
                    <p className="text-[10px] font-semibold text-secondary mb-1">{m.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1.5 ${isTenant ? "text-white/60" : "text-subtle"} text-right`}>
                    {fmtDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-line bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 max-h-24"
            style={{ minHeight: "42px" }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white grid place-items-center disabled:opacity-40 flex-shrink-0"
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
  const [showForm, setShowForm] = useState(null); // "renewal" | "checkout" | null
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
    <div className="px-4 py-4 space-y-3 fade-up">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowForm("renewal")}
          className="bg-success/10 rounded-xl p-4 text-left border border-success/20 active:scale-[0.98]"
        >
          <CheckCircle size={20} className="text-success mb-2" />
          <p className="text-xs font-semibold text-success">Perpanjangan</p>
          <p className="text-[10px] text-subtle mt-0.5">Ajukan perpanjang sewa</p>
        </button>
        <button
          onClick={() => setShowForm("checkout")}
          className="bg-warning/10 rounded-xl p-4 text-left border border-warning/20 active:scale-[0.98]"
        >
          <AlertCircle size={20} className="text-warning mb-2" />
          <p className="text-xs font-semibold text-warning">Check-out</p>
          <p className="text-[10px] text-subtle mt-0.5">Ajukan keluar kos</p>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-4 border border-line overflow-hidden"
          >
            <p className="font-semibold text-sm mb-3">
              Pengajuan {showForm === "renewal" ? "Perpanjangan" : "Check-out"}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm outline-none resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowForm(null); setNote(""); }} className="flex-1 py-2 rounded-xl border border-line text-sm">
                Batal
              </button>
              <button
                onClick={() => submit(showForm)}
                disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-8 text-center text-subtle text-sm animate-pulse">Memuat...</div>
      ) : requests.length === 0 ? (
        <div className="py-8 text-center text-subtle text-sm">Belum ada pengajuan</div>
      ) : (
        requests.map((r) => (
          <div key={r.id} className="bg-white rounded-xl p-4 border border-line">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold capitalize">{r.request_type}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            {r.note && <p className="text-xs text-subtle mt-1">{r.note}</p>}
            <p className="text-[10px] text-subtle mt-2">{fmtDateTime(r.created_at)}</p>
          </div>
        ))
      )}
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
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-bg relative pb-24 shadow-lifted overflow-x-hidden" data-testid="tenant-portal">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-line sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center">
            <User size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">{tenant?.name}</p>
            <p className="text-[10px] text-subtle">{room?.name || "Portal Penghuni"}</p>
          </div>
        </div>
        <button onClick={doLogout} className="p-2 rounded-full hover:bg-muted">
          <LogOut size={18} className="text-subtle" />
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-line flex justify-around items-stretch pt-2 pb-safe z-40 rounded-t-3xl shadow-lifted">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[52px] active:scale-95 transition-transform"
            >
              {active && (
                <motion.div
                  layoutId="portal-pill"
                  className="absolute inset-x-2 -top-0.5 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon size={20} className={active ? "text-primary" : "text-subtle"} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-subtle"}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
