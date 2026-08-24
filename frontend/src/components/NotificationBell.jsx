import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, MessageCircle, CreditCard, Wrench, AlertCircle } from "lucide-react";
import { api, fmtDateTime } from "../lib/api";
import { enablePush } from "../lib/push";

const ICON_MAP = {
  chat: MessageCircle,
  bill_reminder: CreditCard,
  ticket_new: Wrench,
  request_new: AlertCircle,
  request_update: AlertCircle,
  welcome: Bell,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const ref = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnread(data.total || 0);
      } catch {}
    };
    fetchCount();
    const iv = setInterval(fetchCount, 20000);
    return () => clearInterval(iv);
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data);
      } catch {}
    };
    fetch();
  }, [open]);

  // Check push permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
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

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        data-testid="notification-bell"
      >
        <Bell size={20} className="text-primary" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center"
          >
            {unread > 99 ? "99" : unread}
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
            className="absolute right-0 top-12 w-[340px] max-h-[480px] bg-white rounded-2xl shadow-lifted border border-line overflow-hidden z-50"
            data-testid="notification-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="font-semibold text-sm text-ink">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <Check size={12} /> Baca semua
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1">
                  <X size={14} className="text-subtle" />
                </button>
              </div>
            </div>

            {/* Push CTA */}
            {!pushEnabled && (
              <button
                onClick={handleEnablePush}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-line text-left hover:bg-primary/10 transition-colors"
              >
                <Bell size={16} className="text-primary" />
                <div>
                  <p className="text-xs font-semibold text-primary">Aktifkan Notifikasi</p>
                  <p className="text-[11px] text-subtle">Dapatkan pemberitahuan langsung di HP Anda</p>
                </div>
              </button>
            )}

            {/* List */}
            <div className="overflow-y-auto max-h-[360px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-subtle text-sm">
                  <Bell size={28} className="mx-auto mb-2 text-line" />
                  Belum ada notifikasi
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type] || Bell;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-line/40 transition-colors ${
                        n.read ? "bg-white" : "bg-secondary/5"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full grid place-items-center flex-shrink-0 ${
                          n.read ? "bg-muted" : "bg-primary/10"
                        }`}
                      >
                        <Icon size={14} className={n.read ? "text-subtle" : "text-primary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${n.read ? "text-subtle" : "text-ink"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-subtle mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-subtle/60 mt-1">{fmtDateTime(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      )}
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
