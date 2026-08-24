import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, monthLabel } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState } from "../components/ui";
import { Receipt, Wallet, Trash2, Zap } from "lucide-react";

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const emptyForm = {
  tenant_id: "",
  room_id: "",
  period: currentPeriod(),
  rent: 0,
  electricity: 0,
  water: 0,
  other: 0,
  other_label: "",
  late_fee: 0,
  due_date: "",
  status: "unpaid",
  notes: "",
};

const statusMap = {
  paid: { label: "Lunas", tone: "success" },
  unpaid: { label: "Belum Bayar", tone: "warning" },
  partially_paid: { label: "Sebagian", tone: "warning" },
  overdue: { label: "Terlambat", tone: "danger" },
};

const methodLabels = { qris: "QRIS", bank_transfer: "Transfer Bank", cash: "Tunai" };

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [paySheet, setPaySheet] = useState(false);
  const [payForm, setPayForm] = useState({ bill_id: "", amount: 0, method: "qris", reference: "" });
  const [params, setParams] = useSearchParams();

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
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("pay") === "1") {
      setPayForm({ bill_id: "", amount: 0, method: "qris", reference: "" });
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

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenSheet(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      tenant_id: b.tenant_id,
      room_id: b.room_id || "",
      period: b.period,
      rent: b.rent,
      electricity: b.electricity,
      water: b.water,
      other: b.other,
      other_label: b.other_label || "",
      late_fee: b.late_fee || 0,
      due_date: b.due_date || "",
      status: b.status,
      notes: b.notes || "",
    });
    setOpenSheet(true);
  };

  const onTenantChange = (tid) => {
    const t = tenants.find((x) => x.id === tid);
    setForm({ ...form, tenant_id: tid, room_id: t?.room_id || "", rent: t?.monthly_rent ?? form.rent });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tenant_id) {
      toast.error("Pilih penghuni dulu");
      return;
    }
    const payload = {
      ...form,
      room_id: form.room_id || null,
      rent: Number(form.rent),
      electricity: Number(form.electricity),
      water: Number(form.water),
      other: Number(form.other),
      late_fee: Number(form.late_fee),
    };
    try {
      if (editing) {
        await api.put(`/bills/${editing.id}`, payload);
        toast.success("Tagihan diperbarui");
      } else {
        const { data } = await api.post("/bills", payload);
        toast.success(`Invoice ${data.invoice_number} dibuat`);
      }
      setOpenSheet(false);
      load();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const generateMonthly = async () => {
    if (!window.confirm(`Buat tagihan otomatis untuk semua penghuni aktif periode ${monthLabel(currentPeriod())}?`)) return;
    try {
      const { data } = await api.post("/bills/generate", { period: currentPeriod() });
      toast.success(data.created > 0 ? `${data.created} invoice dibuat otomatis` : "Semua penghuni sudah punya tagihan bulan ini");
      load();
    } catch {
      toast.error("Gagal generate tagihan");
    }
  };

  const openPay = (b) => {
    setPayForm({ bill_id: b.id, amount: Math.max(0, b.total - (b.amount_paid || 0)), method: "qris", reference: "" });
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
    try {
      const { data } = await api.post(`/bills/${payForm.bill_id}/payments`, {
        amount: payForm.amount,
        method: payForm.method,
        reference: payForm.reference || null,
      });
      toast.success(data.status === "paid" ? "Pembayaran lunas ✓" : "Pembayaran sebagian tercatat");
      setPaySheet(false);
      load();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal mencatat pembayaran");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tagihan ini?")) return;
    try {
      await api.delete(`/bills/${id}`);
      toast.success("Tagihan dihapus");
      load();
    } catch {
      toast.error("Gagal");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return bills;
    if (filter === "overdue") return bills.filter((b) => b.is_overdue);
    return bills.filter((b) => b.status === filter);
  }, [bills, filter]);
  const outstanding = bills.filter((b) => b.status !== "paid").reduce((a, b) => a + b.total - (b.amount_paid || 0), 0);
  const paidThis = bills
    .filter((b) => b.period === currentPeriod())
    .reduce((a, b) => a + (b.amount_paid || (b.status === "paid" ? b.total : 0)), 0);

  const total = Number(form.rent || 0) + Number(form.electricity || 0) + Number(form.water || 0) + Number(form.other || 0) + Number(form.late_fee || 0);
  const unpaidBills = bills.filter((b) => b.status !== "paid");

  return (
    <div className="fade-up" data-testid="bills-page">
      <PageHeader
        title="Tagihan"
        subtitle={`${bills.length} invoice tercatat`}
        onBack={false}
        action={<AddButton onClick={openNew} testid="add-bill-btn" />}
      />

      <div className="px-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary text-white p-4">
          <p className="text-[10px] uppercase tracking-widest text-secondary">Belum dibayar</p>
          <p className="font-serif text-xl mt-1 tnum" data-testid="bills-outstanding">{fmtIDR(outstanding)}</p>
        </div>
        <div className="rounded-2xl bg-surface border border-line p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-subtle">Diterima bulan ini</p>
          <p className="font-serif text-xl mt-1 text-primary tnum" data-testid="bills-paid-month">{fmtIDR(paidThis)}</p>
        </div>
      </div>

      <div className="px-6 mt-3 flex gap-2">
        <button
          onClick={generateMonthly}
          data-testid="generate-bills-btn"
          className="flex-1 rounded-full bg-secondary/20 text-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Zap size={13} /> Generate Tagihan {monthLabel(currentPeriod())}
        </button>
        <button
          onClick={() => {
            setPayForm({ bill_id: "", amount: 0, method: "qris", reference: "" });
            setPaySheet(true);
          }}
          data-testid="open-pay-btn"
          className="flex-1 rounded-full bg-primary text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Wallet size={13} /> Catat Pembayaran
        </button>
      </div>

      <div className="px-6 mt-4 flex gap-2 overflow-x-auto pb-2" data-testid="bill-filters">
        {[
          { k: "all", l: "Semua" },
          { k: "unpaid", l: "Belum Bayar" },
          { k: "partially_paid", l: "Sebagian" },
          { k: "paid", l: "Lunas" },
          { k: "overdue", l: "Terlambat" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            data-testid={`bill-filter-${f.k}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition-colors ${
              filter === f.k ? "bg-primary text-white" : "bg-surface border border-line text-subtle"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="px-6 mt-3 flex flex-col gap-3 pb-6">
        {filtered.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Belum ada tagihan"
            subtitle="Buat tagihan manual atau generate otomatis untuk semua penghuni aktif."
            action={<Button onClick={openNew} testid="empty-add-bill">Buat Tagihan</Button>}
            testid="bills-empty"
          />
        )}
        {filtered.map((b, i) => {
          const s = b.is_overdue ? statusMap.overdue : statusMap[b.status] || statusMap.unpaid;
          const remaining = b.total - (b.amount_paid || 0);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface rounded-2xl border border-line shadow-soft p-4 active:scale-[0.99] transition-transform"
              onClick={() => openEdit(b)}
              data-testid={`bill-card-${b.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">{b.invoice_number || monthLabel(b.period)}</p>
                  <p className="font-serif text-lg text-primary leading-tight truncate">{tenantName(b.tenant_id)}</p>
                  <p className="text-xs text-subtle">
                    {roomName(b.room_id)} · {monthLabel(b.period)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={s.tone} testid={`bill-status-${b.id}`}>{s.label}</Badge>
                  {b.is_overdue && b.status === "partially_paid" && <Badge tone="warning">Sebagian</Badge>}
                  {b.is_overdue && b.dunning_stage > 0 && (
                    <span className="text-[9px] font-bold text-danger uppercase tracking-widest">Tahap {b.dunning_stage}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-subtle uppercase tracking-widest">Total</p>
                  <p className="font-serif text-xl text-primary tnum">{fmtIDR(b.total)}</p>
                  {(b.amount_paid || 0) > 0 && b.status !== "paid" && (
                    <p className="text-[10px] text-subtle tnum">Terbayar {fmtIDR(b.amount_paid)} · sisa {fmtIDR(remaining)}</p>
                  )}
                  {b.status === "paid" && b.payment_method && (
                    <p className="text-[10px] text-success">{methodLabels[b.payment_method] || b.payment_method}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {b.status !== "paid" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPay(b);
                      }}
                      className="rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      data-testid={`pay-bill-${b.id}`}
                    >
                      <Wallet size={12} /> Bayar
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(b.id);
                    }}
                    className="w-8 h-8 rounded-full text-subtle hover:text-danger hover:bg-danger/5 grid place-items-center"
                    data-testid={`delete-bill-${b.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit bill */}
      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title={editing ? `Edit ${editing.invoice_number || "Tagihan"}` : "Tagihan Baru"}>
        <form onSubmit={submit}>
          <Select label="Penghuni" testid="input-bill-tenant" value={form.tenant_id} onChange={(e) => onTenantChange(e.target.value)} required>
            <option value="">-- Pilih --</option>
            {tenants.filter((t) => t.status !== "former").map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {roomName(t.room_id)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Periode (YYYY-MM)" testid="input-bill-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required placeholder="2026-06" />
            <Input label="Jatuh Tempo" testid="input-bill-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <MoneyInput label="Sewa Kamar" testid="input-bill-rent" value={form.rent} onChange={(v) => setForm({ ...form, rent: v })} />
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Listrik" testid="input-bill-electricity" value={form.electricity} onChange={(v) => setForm({ ...form, electricity: v })} />
            <MoneyInput label="Air" testid="input-bill-water" value={form.water} onChange={(v) => setForm({ ...form, water: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Lain-lain" testid="input-bill-other" value={form.other} onChange={(v) => setForm({ ...form, other: v })} />
            <Input label="Label Lain-lain" testid="input-bill-other-label" value={form.other_label} onChange={(e) => setForm({ ...form, other_label: e.target.value })} placeholder="Parkir / Laundry" />
          </div>
          <MoneyInput label="Denda Keterlambatan" testid="input-bill-latefee" value={form.late_fee} onChange={(v) => setForm({ ...form, late_fee: v })} />
          <Textarea label="Catatan" testid="input-bill-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="rounded-2xl bg-primary text-white p-4 mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-secondary">Total</span>
            <span className="font-serif text-xl tnum" data-testid="bill-total-preview">{fmtIDR(total)}</span>
          </div>
          <Button testid="submit-bill" className="w-full" type="submit">
            {editing ? "Simpan Perubahan" : "Buat Invoice"}
          </Button>
        </form>
      </Sheet>

      {/* Record payment */}
      <Sheet open={paySheet} onClose={() => setPaySheet(false)} title="Catat Pembayaran">
        <form onSubmit={submitPayment}>
          <Select label="Invoice" testid="input-pay-bill" value={payForm.bill_id} onChange={(e) => onPayBillChange(e.target.value)} required>
            <option value="">-- Pilih invoice --</option>
            {unpaidBills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.invoice_number || monthLabel(b.period)} — {tenantName(b.tenant_id)} (sisa {fmtIDR(b.total - (b.amount_paid || 0))})
              </option>
            ))}
          </Select>
          <MoneyInput label="Nominal Pembayaran" testid="input-pay-amount" value={payForm.amount} onChange={(v) => setPayForm({ ...payForm, amount: v })} />
          <Select label="Metode Pembayaran" testid="input-pay-method" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
            <option value="qris">QRIS</option>
            <option value="bank_transfer">Transfer Bank (BCA/Mandiri/BRI)</option>
            <option value="cash">Tunai</option>
          </Select>
          <Input label="Referensi / Bukti Transaksi" testid="input-pay-reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="No. referensi transfer / QRIS" />
          <Button testid="submit-payment" className="w-full mt-2" type="submit">
            Simpan Pembayaran
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
