import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, UserPlus, Wrench, KeyRound, X } from "lucide-react";

const actions = [
  { label: "Catat Pembayaran", icon: Wallet, to: "/bills?pay=1", testid: "fab-record-payment" },
  { label: "Tambah Penghuni", icon: UserPlus, to: "/tenants?new=1", testid: "fab-add-tenant" },
  { label: "Tiket Baru", icon: Wrench, to: "/complaints?new=1", testid: "fab-new-ticket" },
  { label: "Terbitkan Token", icon: KeyRound, to: "/access?new=1", testid: "fab-issue-token" },
];

export default function SpeedDial() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            data-testid="speed-dial-backdrop"
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-24 right-1/2 translate-x-[calc(min(28rem,100vw)/2-1.5rem)] z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open &&
            actions.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.to}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.9 }}
                  transition={{ delay: (actions.length - 1 - i) * 0.04 }}
                  onClick={() => {
                    setOpen(false);
                    nav(a.to);
                  }}
                  data-testid={a.testid}
                  className="flex items-center gap-3 bg-white rounded-full pl-5 pr-2 py-2 shadow-lifted border border-line active:scale-95"
                >
                  <span className="text-xs font-semibold text-primary">{a.label}</span>
                  <span className="w-9 h-9 rounded-full bg-secondary/20 grid place-items-center">
                    <Icon size={15} className="text-primary" />
                  </span>
                </motion.button>
              );
            })}
        </AnimatePresence>
        <button
          onClick={() => setOpen(!open)}
          data-testid="speed-dial-fab"
          className="w-14 h-14 rounded-full bg-primary text-white grid place-items-center shadow-lifted active:scale-95 transition-transform"
        >
          <motion.span animate={{ rotate: open ? 45 : 0 }} className="grid place-items-center">
            {open ? <X size={22} /> : <Plus size={22} />}
          </motion.span>
        </button>
      </div>
    </>
  );
}
