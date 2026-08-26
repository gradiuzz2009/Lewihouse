import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtDateTime, fmtIDR } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/ui";
import { History } from "lucide-react";

const actionMap = {
  LOGIN: { label: "Masuk", color: "bg-muted text-subtle border-line" },
  CREATE: { label: "Buat", color: "bg-success/10 text-success border-success/20" },
  UPDATE: { label: "Ubah", color: "bg-secondary/20 text-primary border-secondary/30" },
  DELETE: { label: "Hapus", color: "bg-danger/10 text-danger border-danger/20" },
  MOVE_IN: { label: "Check-in", color: "bg-success/10 text-success border-success/20" },
  MOVE_OUT: { label: "Check-out", color: "bg-danger/10 text-danger border-danger/20" },
  PAYMENT: { label: "Pembayaran", color: "bg-primary text-white border-primary" },
  BILL_RUN: { label: "Bill Run", color: "bg-primary text-white border-primary" },
  ROOM_STATUS: { label: "Status Kamar", color: "bg-secondary/20 text-primary border-secondary/30" },
  TICKET_STATUS: { label: "Status Tiket", color: "bg-secondary/20 text-primary border-secondary/30" },
  TOKEN_ISSUE: { label: "Terbit Token", color: "bg-success/10 text-success border-success/20" },
  TOKEN_REVOKE: { label: "Cabut Token", color: "bg-danger/10 text-danger border-danger/20" },
  SEED: { label: "Seed Data", color: "bg-muted text-subtle border-line" },
};

const entityLabels = {
  room: "Kamar",
  tenant: "Penghuni",
  bill: "Tagihan",
  ticket: "Tiket",
  access_token: "Token",
  user: "Pengguna",
  system: "Sistem",
};

function detailText(log) {
  const d = log.detail || {};
  const parts = [];
  if (d.name) parts.push(d.name);
  if (d.title) parts.push(d.title);
  if (d.invoice) parts.push(d.invoice);
  if (d.label) parts.push(d.label);
  if (d.amount) parts.push(fmtIDR(d.amount));
  if (d.from && d.to) parts.push(`${d.from} → ${d.to}`);
  if (d.refund !== undefined) parts.push(`refund ${fmtIDR(d.refund)}`);
  if (d.created !== undefined) parts.push(`${d.created} invoice dibuat`);
  return parts.join(" · ");
}

export default function Activity() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api
      .get("/audit?limit=80")
      .then((r) => setLogs(r.data))
      .catch(() => toast.error("Gagal memuat riwayat"));
  }, []);

  return (
    <div className="fade-up" data-testid="activity-page">
      <PageHeader title="Riwayat Aktivitas" subtitle="Jejak audit sistem dan log operasional" />
      <div className="px-5 sm:px-6 mt-2 flex flex-col gap-2.5 pb-6">
        {logs.length === 0 && (
          <EmptyState icon={History} title="Belum ada aktivitas" subtitle="Semua aksi dan perubahan data penting akan tercatat di sini." testid="activity-empty" />
        )}
        {logs.map((log, i) => {
          const a = actionMap[log.action] || { label: log.action, color: "bg-muted text-subtle border-line" };
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              className="bg-surface rounded-2xl border border-line shadow-soft px-4 py-3 flex items-center gap-3.5 hover:border-primary/30 transition-all"
              data-testid={`audit-log-${log.id}`}
            >
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${a.color}`}>
                {a.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink truncate font-medium">
                  <span className="font-bold text-primary">{entityLabels[log.entity] || log.entity}</span>
                  {detailText(log) ? ` — ${detailText(log)}` : ""}
                </p>
                <p className="text-[10px] text-subtle mt-0.5 font-mono">
                  {log.actor} · {fmtDateTime(log.at)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
