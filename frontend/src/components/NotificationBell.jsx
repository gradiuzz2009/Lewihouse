import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  MessageCircle,
  CreditCard,
  Wrench,
  Zap,
  Megaphone,
  KeyRound,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { api, fmtDateTime } from "../lib/api";
import { enablePush } from "../lib/push";

const MODULE_META = {
  BILLING: {
    icon: CreditCard,
    bg: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    label: "Tagihan",
  },
  MAINTENANCE: {
    icon: Wrench,
    bg: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    label: "Komplain",
  },
  ELECTRICITY: {
    icon: Zap,
    bg: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    label: "Listrik",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    bg: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    label: "Pengumuman",
  },
  AUTH: {
    icon: KeyRound,
    bg: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    label: "Akun",
  },
  CHAT: {
    icon: MessageCircle,
    bg: "bg-teal-500/15 text-teal-600 border-teal-500/30",
    label: "Pesan",
  },
};

const FILTER_TABS = [
  { key: "ALL", label: "Semua" },
  { key: "BILLING", label: "Tagihan" },
  { key: "MAINTENANCE", label: "Komplain" },
  { key: "ELECTRICITY", label: "Listrik" },
  { key: "ANNOUNCEMENT", label: "Pengumuman" },
];

export default function NotificationBell({ onNavigateCustom }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [pushEnabled, setPushEnabled] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnread(Number(data?.total || data?.unread || data?.notifications || 0));
      } catch {
        setUnread(0);
      }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 15000);
    return () => clearInterval(iv);
  }, []);

  // Fetch notifications when opened or tab changes
  useEffect(() => {
    if (!open) return;
    const fetchNotifs = async () => {
      try {
        const url = selectedTab === "ALL" ? "/notifications" : `/notifications?module=${selectedTab}`;
        const { data } = await api.get(url);
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifs();
  }, [open, selectedTab]);

  // Check push permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const handleItemClick = async (n) => {
    if (!n.read && !n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true, is_read: true } : item))
        );
        setUnread((prev) => Math.max(0, prev - 1));
      } catch {}
    }

    setOpen(false);
    if (onNavigateCustom) {
      onNavigateCustom(n);
    } else if (n.action_url) {
      nav(n.action_url);
    }
  };

  const handleEnablePush = async () => {
    try {
      await enablePush();
      setPushEnabled(true);
    } catch (e) {
      if (e.message === "denied") {
        alert("Notifikasi diblokir oleh browser. Aktifkan di pengaturan browser Anda.");
      }
    }
  };

  const filteredNotifs =
    selectedTab === "ALL"
      ? notifications
      : notifications.filter((n) => (n.module || "").toUpperCase() === selectedTab);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors text-ink"
        data-testid="notification-bell"
        title="Pusat Notifikasi"
      >
        <Bell size={20} className="text-primary" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center shadow-xs"
          >
            {unread > 99 ? "99+" : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[350px] sm:w-[380px] max-h-[520px] bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden z-50 flex flex-col"
            data-testid="notification-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-line bg-surface/90 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 grid place-items-center text-primary">
                  <Bell size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-ink leading-tight">Aktivitas & Notifikasi</h3>
                  <p className="text-[10px] text-subtle">{unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all bg-primary/10 px-2 py-1 rounded-lg"
                    title="Tandai semua sudah dibaca"
                  >
                    <CheckCheck size={13} />
                    <span>Baca semua</span>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full text-subtle hover:text-ink hover:bg-muted grid place-items-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Filter Tabs Chips */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line/60 overflow-x-auto no-scrollbar bg-muted/20">
              {FILTER_TABS.map((tab) => {
                const active = selectedTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider shrink-0 transition-all ${
                      active
                        ? "bg-primary text-white shadow-xs"
                        : "bg-surface text-subtle hover:text-ink border border-line"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Push Permission Prompt */}
            {!pushEnabled && (
              <button
                onClick={handleEnablePush}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-line text-left hover:bg-primary/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/15 grid place-items-center text-primary shrink-0">
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-primary leading-tight">Aktifkan Notifikasi Web</p>
                  <p className="text-[10px] text-subtle truncate">Dapatkan pemberitahuan realtime di perangkat Anda</p>
                </div>
                <ChevronRight size={14} className="text-primary/60 shrink-0" />
              </button>
            )}

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 max-h-[360px] divide-y divide-line/40">
              {filteredNotifs.length === 0 ? (
                <div className="py-14 text-center text-subtle text-xs px-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 grid place-items-center mx-auto mb-2.5 text-line">
                    <Bell size={24} />
                  </div>
                  <p className="font-semibold text-ink/70">Belum ada notifikasi</p>
                  <p className="text-[11px] text-subtle mt-0.5">Semua pembaruan operasional akan muncul di sini.</p>
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const isUnread = !n.read && !n.is_read;
                  const modKey = (n.module || "BILLING").toUpperCase();
                  const meta = MODULE_META[modKey] || {
                    icon: Bell,
                    bg: "bg-primary/10 text-primary border-primary/20",
                    label: "Notifikasi",
                  };
                  const Icon = meta.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-muted/40 ${
                        isUnread ? "bg-primary/5 hover:bg-primary/10" : "bg-surface"
                      }`}
                      data-testid={`notif-item-${n.id}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 border ${meta.bg}`}
                      >
                        <Icon size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-subtle">
                            {meta.label} {n.room_unit ? `• Unit ${n.room_unit}` : ""}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                        <p
                          className={`text-xs leading-snug truncate ${
                            isUnread ? "font-bold text-ink" : "font-medium text-ink/80"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-[11px] text-subtle truncate mt-0.5 leading-tight">
                          {n.message || n.body}
                        </p>
                        <p className="text-[9px] text-subtle/70 mt-1 font-mono">
                          {fmtDateTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

