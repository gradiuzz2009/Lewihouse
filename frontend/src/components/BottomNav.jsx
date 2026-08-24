import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, DoorOpen, Users, Receipt, Wrench } from "lucide-react";

const items = [
  { to: "/", label: "Beranda", icon: Home, testid: "nav-home" },
  { to: "/rooms", label: "Kamar", icon: DoorOpen, testid: "nav-rooms" },
  { to: "/tenants", label: "Penghuni", icon: Users, testid: "nav-tenants" },
  { to: "/bills", label: "Tagihan", icon: Receipt, testid: "nav-bills" },
  { to: "/complaints", label: "Perbaikan", icon: Wrench, testid: "nav-complaints" },
];

export default function BottomNav() {
  const loc = useLocation();
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
            <Icon size={20} className={active ? "text-primary" : "text-subtle"} strokeWidth={active ? 2.4 : 1.8} />
            <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-subtle"}`}>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
