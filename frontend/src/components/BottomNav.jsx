import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, DoorOpen, MessageCircle, Receipt, Wrench } from "lucide-react";
import { api } from "../lib/api";
import NotificationBell from "./NotificationBell";

const items = [
  { to: "/", label: "Beranda", icon: Home, testid: "nav-home" },
  { to: "/rooms", label: "Kamar", icon: DoorOpen, testid: "nav-rooms" },
  { to: "/chat", label: "Chat", icon: MessageCircle, testid: "nav-chat", badge: true },
  { to: "/bills", label: "Tagihan", icon: Receipt, testid: "nav-bills" },
  { to: "/complaints", label: "Perbaikan", icon: Wrench, testid: "nav-complaints" },
];

export default function BottomNav() {
  const loc = useLocation();
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/chat/unread-count");
        setChatUnread(data.unread || 0);
      } catch {}
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-line flex justify-around items-stretch pt-2 pb-safe z-40 rounded-t-3xl shadow-lifted"
      data-testid="bottom-nav"
    >
      {items.map((it) => {
        const active = loc.pathname === it.to || (it.to !== "/" && loc.pathname.startsWith(it.to));
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            data-testid={it.testid}
            className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[52px] active:scale-95 transition-transform"
          >
            {active && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-x-2 -top-0.5 h-0.5 bg-primary rounded-full"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            <div className="relative">
              <Icon size={20} className={active ? "text-primary" : "text-subtle"} strokeWidth={active ? 2.4 : 1.8} />
              {it.badge && chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-danger text-white text-[8px] font-bold grid place-items-center">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-subtle"}`}>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
