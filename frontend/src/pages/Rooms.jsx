import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, fmtIDR, fmtDate, fmtDateTime } from "../lib/api";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Badge, Button, Input, Select, Sheet, Textarea, MoneyInput, EmptyState, RoomStatusBadge, FormSection } from "../components/ui";
import {
  DoorOpen,
  Trash2,
  CheckCircle2,
  UserCheck,
  Wrench,
  Sparkles,
  ShieldAlert,
  Image as ImageIcon,
  ArrowLeftRight,
  Zap,
  Wifi,
  Bath,
  Key,
  Tv,
  Bed,
  Layers,
  Grid,
  List,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileText,
  Check,
  Edit2,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { GALLERY_IMAGES } from "../lib/galleryData";

const STANDARD_FACILITIES = [
  "AC",
  "Kamar Mandi Dalam",
  "Water Heater",
  "Smart Lock",
  "Lemari Pakaian",
  "WiFi Cepat",
  "Kasur Springbed",
  "Meja Kerja",
  "Smart TV",
];

const emptyRoom = {
  name: "",
  floor: "1",
  wing: "",
  room_type: "standard",
  capacity: 1,
  price: 1800000,
  deposit: 1800000,
  meter_id: "",
  status: "available",
  facilities: ["AC", "Kasur Springbed", "WiFi Cepat"],
  photo_url: "",
  notes: "",
};

export const roomStatusMap = {
  available: { label: "Tersedia", tone: "success", icon: CheckCircle2, bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  occupied: { label: "Terisi", tone: "primary", icon: UserCheck, bg: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  cleaning: { label: "Dibersihkan", tone: "muted", icon: Sparkles, bg: "bg-teal-500/10 text-teal-700 border-teal-500/20" },
  maintenance: { label: "Perbaikan", tone: "danger", icon: Wrench, bg: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  reserved: { label: "Dipesan", tone: "warning", icon: ShieldAlert, bg: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
};

const typeLabels = {
  standard: "Standard",
  deluxe: "Deluxe",
  vip: "VIP",
  suite: "Suite",
  studio: "Studio",
};

function cleanPhoneWa(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("08")) return "628" + digits.slice(2);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

function isAvailableStatus(status) {
  return status === "available" || !status;
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" (floor-by-floor) | "list"
  
  // Sheet & Modal states
  const [openAddEditSheet, setOpenAddEditSheet] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [customFacility, setCustomFacility] = useState("");
  
  // Detail Drawer state
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Room Transfer Modal state
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [transferTenantId, setTransferTenantId] = useState("");
  const [transferTargetRoomId, setTransferTargetRoomId] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [transferOldStatus, setTransferOldStatus] = useState("cleaning");
  const [transferOldMeterReading, setTransferOldMeterReading] = useState("");
  const [transferMeterRate, setTransferMeterRate] = useState(1500);
  const [transferElectricityCharge, setTransferElectricityCharge] = useState(0);
  const [transferManualElectricity, setTransferManualElectricity] = useState(false);
  const [transferCreateInvoice, setTransferCreateInvoice] = useState(true);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [roomsRes, tenantsRes, billsRes, complaintsRes] = await Promise.allSettled([
        api.get("/rooms"),
        api.get("/tenants"),
        api.get("/bills"),
        api.get("/complaints"),
      ]);
      if (roomsRes.status === "fulfilled" && Array.isArray(roomsRes.value?.data)) {
        setRooms(roomsRes.value.data);
      }
      if (tenantsRes.status === "fulfilled" && Array.isArray(tenantsRes.value?.data)) {
        setTenants(tenantsRes.value.data);
      }
      if (billsRes.status === "fulfilled" && Array.isArray(billsRes.value?.data)) {
        setBills(billsRes.value.data);
      }
      if (complaintsRes.status === "fulfilled" && Array.isArray(complaintsRes.value?.data)) {
        setComplaints(complaintsRes.value.data);
      }
    } catch {
      toast.error("Gagal menyinkronkan data kamar");
    }
  };

  useAutoRefresh(loadData);

  // Sync selectedRoom with updated data
  useEffect(() => {
    if (selectedRoom) {
      const current = rooms.find((r) => r.id === selectedRoom.id);
      if (current) setSelectedRoom(current);
    }
  }, [rooms]);

  // Tenant lookup map
  const tenantMap = useMemo(() => {
    const map = {};
    tenants.forEach((t) => {
      if (t.room_id) map[t.room_id] = t;
      map[t.id] = t;
    });
    return map;
  }, [tenants]);

  // Status Metrics Calculation
  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter((r) => r.status === "available").length;
    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const cleaning = rooms.filter((r) => r.status === "cleaning").length;
    const maintenance = rooms.filter((r) => r.status === "maintenance").length;
    const reserved = rooms.filter((r) => r.status === "reserved").length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, available, occupied, cleaning, maintenance, reserved, occupancyRate };
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchFilter = filter === "all" || r.status === filter;
      const tenant = tenantMap[r.id];
      const matchSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.floor).includes(searchQuery) ||
        (r.wing && r.wing.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.meter_id && r.meter_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tenant && tenant.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [rooms, filter, searchQuery, tenantMap]);

  // Group rooms by floor
  const floorGroups = useMemo(() => {
    const groups = {};
    filteredRooms.forEach((r) => {
      const fl = r.floor || "1";
      if (!groups[fl]) groups[fl] = [];
      groups[fl].push(r);
    });
    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map((fl) => ({
        floor: fl,
        rooms: groups[fl].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
      }));
  }, [filteredRooms]);

  // Add / Edit Modal handlers
  const openNew = () => {
    setEditingRoom(null);
    setRoomForm({
      ...emptyRoom,
      facilities: ["AC", "Kasur Springbed", "WiFi Cepat"],
    });
    setCustomFacility("");
    setOpenAddEditSheet(true);
  };

  const openEdit = (r) => {
    setEditingRoom(r);
    setRoomForm({
      name: r.name || "",
      floor: r.floor || "1",
      wing: r.wing || "",
      room_type: r.room_type || "standard",
      capacity: r.capacity || 1,
      price: r.price || 0,
      deposit: r.deposit || 0,
      meter_id: r.meter_id || "",
      status: r.status || "available",
      facilities: Array.isArray(r.facilities) ? [...r.facilities] : (r.facilities ? String(r.facilities).split(",").map((s) => s.trim()) : []),
      photo_url: r.photo_url || "",
      notes: r.notes || "",
    });
    setCustomFacility("");
    setOpenAddEditSheet(true);
  };

  const toggleFacility = (fac) => {
    setRoomForm((prev) => {
      const exists = prev.facilities.includes(fac);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((f) => f !== fac) : [...prev.facilities, fac],
      };
    });
  };

  const addCustomFacility = () => {
    const trimmed = customFacility.trim();
    if (!trimmed) return;
    if (!roomForm.facilities.includes(trimmed)) {
      setRoomForm((prev) => ({
        ...prev,
        facilities: [...prev.facilities, trimmed],
      }));
    }
    setCustomFacility("");
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const payload = {
      ...roomForm,
      price: Number(roomForm.price) || 0,
      deposit: Number(roomForm.deposit) || 0,
      capacity: Number(roomForm.capacity) || 1,
      facilities: roomForm.facilities.filter(Boolean),
    };
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, payload);
        toast.success(`Kamar ${payload.name} berhasil diperbarui`);
      } else {
        await api.post("/rooms", payload);
        toast.success(`Kamar ${payload.name} berhasil ditambahkan`);
      }
      setOpenAddEditSheet(false);
      loadData();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal menyimpan kamar");
    }
  };

  const handleTransitionStatus = async (roomId, targetStatus, message) => {
    try {
      await api.post(`/rooms/${roomId}/status`, { status: targetStatus });
      toast.success(message || `Status kamar diubah ke ${targetStatus}`);
      loadData();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal mengubah status kamar");
    }
  };

  const handleDeleteRoom = async (room) => {
    if (room.status === "occupied") {
      toast.error("Kamar sedang dihuni oleh penyewa. Lakukan checkout atau pindah kamar terlebih dahulu.");
      return;
    }
    if (!window.confirm(`Hapus kamar ${room.name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/rooms/${room.id}`);
      toast.success(`Kamar ${room.name} telah dihapus`);
      setSelectedRoom(null);
      loadData();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal menghapus kamar");
    }
  };

  // Open Room Transfer Modal
  const openTransfer = (initialRoom = null) => {
    if (initialRoom && initialRoom.status === "occupied") {
      const occupant = tenantMap[initialRoom.id] || tenants.find((t) => t.room_id === initialRoom.id);
      if (occupant) {
        setTransferTenantId(occupant.id);
      }
    } else {
      const activeOccupants = tenants.filter((t) => t.status === "active" && t.room_id);
      setTransferTenantId(activeOccupants[0]?.id || "");
    }
    setTransferTargetRoomId("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferOldStatus("cleaning");
    setTransferOldMeterReading("");
    setTransferElectricityCharge(0);
    setTransferManualElectricity(false);
    setTransferCreateInvoice(true);
    setTransferNotes("");
    setOpenTransferModal(true);
  };

  // Calculations for Transfer Prorata
  const transferDetails = useMemo(() => {
    if (!transferTenantId) return null;
    const tenant = tenants.find((t) => t.id === transferTenantId);
    if (!tenant) return null;
    const oldRoom = rooms.find((r) => r.id === tenant.room_id) || { name: tenant.room_name || "-", price: tenant.monthly_rent || 0 };
    const newRoom = rooms.find((r) => r.id === transferTargetRoomId);

    const d = transferDate ? new Date(transferDate) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfMonth = d.getDate();
    const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);

    const oldRent = oldRoom.price || tenant.monthly_rent || 0;
    const newRent = newRoom ? newRoom.price : 0;

    const prorataOldCredit = Math.round((oldRent / daysInMonth) * daysRemaining);
    const prorataNewCharge = newRoom ? Math.round((newRent / daysInMonth) * daysRemaining) : 0;
    const rentDifference = prorataNewCharge - prorataOldCredit;

    let elecCharge = transferElectricityCharge;
    if (!transferManualElectricity && transferOldMeterReading && transferMeterRate) {
      elecCharge = Math.round(Number(transferOldMeterReading) * Number(transferMeterRate));
    }

    const netAdjustment = rentDifference + (Number(elecCharge) || 0);

    return {
      tenant,
      oldRoom,
      newRoom,
      daysInMonth,
      dayOfMonth,
      daysRemaining,
      prorataOldCredit,
      prorataNewCharge,
      rentDifference,
      elecCharge,
      netAdjustment,
    };
  }, [transferTenantId, transferTargetRoomId, transferDate, transferElectricityCharge, transferManualElectricity, transferOldMeterReading, transferMeterRate, tenants, rooms]);

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferDetails || !transferDetails.newRoom) {
      toast.error("Pilih unit kamar tujuan yang tersedia");
      return;
    }
    setTransferSubmitting(true);
    try {
      const payload = {
        tenant_id: transferTenantId,
        from_room_id: transferDetails.tenant.room_id,
        to_room_id: transferTargetRoomId,
        transfer_date: transferDate,
        old_room_final_meter: Number(transferOldMeterReading) || 0,
        old_room_electricity_charge: Number(transferDetails.elecCharge) || 0,
        prorata_credit_old: transferDetails.prorataOldCredit,
        prorata_charge_new: transferDetails.prorataNewCharge,
        net_adjustment_amount: transferDetails.netAdjustment,
        old_room_status: transferOldStatus,
        create_adjustment_invoice: transferCreateInvoice,
        notes: transferNotes,
      };
      const { data } = await api.post("/rooms/transfer", payload);
      toast.success(data?.message || "Proses pindah kamar berhasil diselesaikan");
      if (data?.invoice_number) {
        toast.info(`Invoice penyesuaian ${data.invoice_number} diterbitkan`);
      }
      setOpenTransferModal(false);
      setSelectedRoom(null);
      loadData();
    } catch (err) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Gagal memproses pindah kamar");
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Room complaints & bills for Detail Drawer
  const selectedRoomDetails = useMemo(() => {
    if (!selectedRoom) return null;
    const occupant = tenantMap[selectedRoom.id] || tenants.find((t) => t.room_id === selectedRoom.id);
    const roomBills = bills.filter((b) => (occupant && b.tenant_id === occupant.id) || b.room_id === selectedRoom.id);
    const roomComplaints = complaints.filter((c) => (occupant && c.tenant_id === occupant.id) || c.room_id === selectedRoom.id);
    return { occupant, roomBills, roomComplaints };
  }, [selectedRoom, tenantMap, tenants, bills, complaints]);

  return (
    <div className="fade-up pb-12" data-testid="rooms-page">
      {/* Header */}
      <PageHeader
        title="Manajemen Kamar & Unit"
        subtitle={`${stats.total} total unit · ${stats.occupied} terisi (${stats.occupancyRate}%), ${stats.available} tersedia`}
        onBack={false}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => openTransfer(null)}
              testid="btn-open-transfer"
              className="!px-3.5 !py-2 text-xs flex items-center gap-1.5 border-line bg-surface hover:bg-muted text-ink shadow-none"
            >
              <ArrowLeftRight size={14} className="text-primary" />
              <span>Pindah Kamar</span>
            </Button>
            <AddButton onClick={openNew} testid="add-room-btn" />
          </div>
        }
      />

      {/* Metric Cards / Status Badges */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4" data-testid="room-metric-cards">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "all" ? "bg-primary text-white border-primary shadow-soft" : "bg-surface border-line hover:border-primary/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "all" ? "text-white/80" : "text-subtle"}`}>Total Unit</span>
            <DoorOpen size={16} className={filter === "all" ? "text-white" : "text-primary"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.total}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "all" ? "text-white/90" : "text-subtle"}`}>Kapasitas Properti</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("available")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "available" ? "bg-emerald-600 text-white border-emerald-600 shadow-soft" : "bg-surface border-line hover:border-emerald-500/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "available" ? "text-white/80" : "text-emerald-700"}`}>Tersedia</span>
            <CheckCircle2 size={16} className={filter === "available" ? "text-white" : "text-emerald-600"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.available}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "available" ? "text-white/90" : "text-subtle"}`}>Siap Disewa</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("occupied")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "occupied" ? "bg-blue-600 text-white border-blue-600 shadow-soft" : "bg-surface border-line hover:border-blue-500/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "occupied" ? "text-white/80" : "text-blue-700"}`}>Terisi</span>
            <UserCheck size={16} className={filter === "occupied" ? "text-white" : "text-blue-600"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.occupied}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "occupied" ? "text-white/90" : "text-subtle"}`}>{stats.occupancyRate}% Terisi</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("cleaning")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "cleaning" ? "bg-teal-600 text-white border-teal-600 shadow-soft" : "bg-surface border-line hover:border-teal-500/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "cleaning" ? "text-white/80" : "text-teal-700"}`}>Cleaning</span>
            <Sparkles size={16} className={filter === "cleaning" ? "text-white" : "text-teal-600"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.cleaning}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "cleaning" ? "text-white/90" : "text-subtle"}`}>Menunggu Bersih</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("maintenance")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "maintenance" ? "bg-rose-600 text-white border-rose-600 shadow-soft" : "bg-surface border-line hover:border-rose-500/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "maintenance" ? "text-white/80" : "text-rose-700"}`}>Perbaikan</span>
            <Wrench size={16} className={filter === "maintenance" ? "text-white" : "text-rose-600"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.maintenance}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "maintenance" ? "text-white/90" : "text-subtle"}`}>Sedang Renovasi</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("reserved")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filter === "reserved" ? "bg-amber-600 text-white border-amber-600 shadow-soft" : "bg-surface border-line hover:border-amber-500/40 text-ink"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${filter === "reserved" ? "text-white/80" : "text-amber-700"}`}>Dipesan</span>
            <ShieldAlert size={16} className={filter === "reserved" ? "text-white" : "text-amber-600"} />
          </div>
          <p className="text-2xl font-serif font-bold mt-1 leading-none">{stats.reserved}</p>
          <p className={`text-[11px] mt-1.5 ${filter === "reserved" ? "text-white/90" : "text-subtle"}`}>Deposit Masuk</p>
        </button>
      </div>

      {/* Filter & View Controls */}
      <div className="px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Status Filter Chips */}
        <div className="chip-scroll-container pb-1 flex-1" data-testid="room-filters">
          {[
            { k: "all", l: "Semua Unit" },
            { k: "available", l: "Tersedia" },
            { k: "occupied", l: "Terisi" },
            { k: "cleaning", l: "Dibersihkan" },
            { k: "maintenance", l: "Perbaikan" },
            { k: "reserved", l: "Dipesan" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              data-testid={`filter-${f.k}`}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                filter === f.k ? "bg-primary text-white shadow-soft" : "bg-surface border border-line text-subtle hover:text-ink hover:bg-muted"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari kamar, lantai, penyewa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-line rounded-full pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center bg-surface border border-line rounded-full p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Tampilan Grid per Lantai"
              className={`p-1.5 rounded-full transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-subtle hover:text-ink"}`}
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Tampilan Daftar Rinci"
              className={`p-1.5 rounded-full transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-subtle hover:text-ink"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Floor Grid or List */}
      <div className="px-6">
        {filteredRooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="Tidak ada kamar ditemukan"
            subtitle={searchQuery ? "Coba ubah kata kunci pencarian Anda." : "Belum ada unit dengan filter status ini."}
            action={<Button onClick={openNew} testid="empty-add-room">Tambah Unit Kamar</Button>}
            testid="rooms-empty"
          />
        ) : viewMode === "grid" ? (
          /* Floor-by-Floor Visual Grid View */
          <div className="space-y-6">
            {floorGroups.map((group) => {
              const floorOccupied = group.rooms.filter((r) => r.status === "occupied").length;
              const floorAvailable = group.rooms.filter((r) => r.status === "available").length;
              return (
                <section key={group.floor} className="space-y-3">
                  {/* Floor Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        L{group.floor}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-ink">
                        Lantai {group.floor}
                      </h3>
                    </div>
                    <span className="text-xs text-subtle">
                      {group.rooms.length} Unit · <strong className="text-ink">{floorOccupied}</strong> Terisi, <strong className="text-emerald-700">{floorAvailable}</strong> Kosong
                    </span>
                  </div>

                  {/* Floor Room Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {group.rooms.map((r, i) => {
                      const occupant = tenantMap[r.id];
                      const isOccupied = r.status === "occupied";
                      const isCleaning = r.status === "cleaning";
                      const isMaintenance = r.status === "maintenance";
                      const isReserved = r.status === "reserved";
                      
                      const borderAccent =
                        r.status === "available"
                          ? "border-emerald-500/30 hover:border-emerald-500 hover:shadow-emerald-500/10"
                          : r.status === "occupied"
                          ? "border-blue-500/30 hover:border-blue-500 hover:shadow-blue-500/10"
                          : r.status === "cleaning"
                          ? "border-teal-500/30 hover:border-teal-500 hover:shadow-teal-500/10"
                          : r.status === "maintenance"
                          ? "border-rose-500/30 hover:border-rose-500 hover:shadow-rose-500/10"
                          : "border-amber-500/30 hover:border-amber-500 hover:shadow-amber-500/10";

                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedRoom(r)}
                          className={`group cursor-pointer rounded-2xl bg-surface border shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted overflow-hidden flex flex-col justify-between ${borderAccent}`}
                          data-testid={`room-tile-${r.name}`}
                        >
                          {/* Card Header & Badges */}
                          <div className="p-4 pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-serif text-2xl font-bold text-primary tracking-tight leading-none group-hover:text-secondary transition-colors">
                                    {r.name}
                                  </h4>
                                  {r.wing && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-subtle">
                                      Blok {r.wing}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] uppercase tracking-wider font-semibold text-subtle mt-1">
                                  {typeLabels[r.room_type] || r.room_type} · {r.capacity || 1} Org
                                </p>
                              </div>
                              <RoomStatusBadge status={r.status} />
                            </div>

                            {/* Price & Meter ID */}
                            <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-line/60">
                              <div>
                                <span className="text-sm font-bold text-ink tnum">{fmtIDR(r.price)}</span>
                                <span className="text-[10px] text-subtle"> /bln</span>
                              </div>
                              {r.meter_id && (
                                <span className="text-[10px] font-mono text-subtle flex items-center gap-0.5 bg-muted/80 px-2 py-0.5 rounded-full" title={`Meteran Listrik: ${r.meter_id}`}>
                                  <Zap size={10} className="text-amber-500" /> {r.meter_id}
                                </span>
                              )}
                            </div>

                            {/* Facilities summary */}
                            {Array.isArray(r.facilities) && r.facilities.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2.5 overflow-hidden">
                                {r.facilities.slice(0, 3).map((fac, idx) => (
                                  <span key={idx} className="text-[10px] text-subtle bg-muted/60 px-2 py-0.5 rounded truncate max-w-[85px]">
                                    {fac}
                                  </span>
                                ))}
                                {r.facilities.length > 3 && (
                                  <span className="text-[10px] text-subtle font-medium">+{r.facilities.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Occupant / Status Info Bar at Bottom */}
                          <div className={`px-4 py-2.5 text-xs border-t ${
                            isOccupied
                              ? "bg-blue-500/5 border-blue-500/10 text-blue-900"
                              : isAvailableStatus(r.status)
                              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800"
                              : isCleaning
                              ? "bg-teal-500/5 border-teal-500/10 text-teal-800"
                              : isMaintenance
                              ? "bg-rose-500/5 border-rose-500/10 text-rose-800"
                              : "bg-amber-500/5 border-amber-500/10 text-amber-800"
                          }`}>
                            {isOccupied && occupant ? (
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {occupant.name.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-ink truncate text-xs">{occupant.name}</span>
                                </div>
                                <span className="text-[10px] text-subtle shrink-0">
                                  {occupant.lease_end ? fmtDate(occupant.lease_end) : "Aktif"}
                                </span>
                              </div>
                            ) : isCleaning ? (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-medium text-teal-700 text-[11px]">
                                  <Sparkles size={12} /> Menunggu Pembersihan
                                </span>
                                <span className="text-[10px] font-semibold underline text-teal-700">Detail</span>
                              </div>
                            ) : isMaintenance ? (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-medium text-rose-700 text-[11px]">
                                  <Wrench size={12} /> Sedang Perbaikan
                                </span>
                                <span className="text-[10px] font-semibold underline text-rose-700">Detail</span>
                              </div>
                            ) : isReserved ? (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-medium text-amber-700 text-[11px]">
                                  <ShieldAlert size={12} /> Dipesan (Reserved)
                                </span>
                                <span className="text-[10px] font-semibold underline text-amber-700">Detail</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-semibold text-emerald-700 text-[11px]">
                                  <CheckCircle2 size={12} /> Kamar Siap Disewa
                                </span>
                                <span className="text-[10px] text-emerald-700 group-hover:translate-x-0.5 transition-transform font-bold">Pilih →</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2.5">
            {filteredRooms.map((r, i) => {
              const occupant = tenantMap[r.id];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedRoom(r)}
                  className="bg-surface rounded-xl border border-line p-4 shadow-soft hover:border-primary/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  data-testid={`room-row-${r.name}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0 border border-line grid place-items-center">
                      {r.photo_url ? (
                        <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <DoorOpen size={22} className="text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-xl font-bold text-primary">{r.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-subtle font-medium">
                          Lantai {r.floor}{r.wing ? ` · Blok ${r.wing}` : ""}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-ink font-semibold">
                          {typeLabels[r.room_type] || r.room_type}
                        </span>
                      </div>
                      <p className="text-xs text-subtle mt-0.5 flex items-center gap-2">
                        {r.status === "occupied" && occupant ? (
                          <span className="text-blue-700 font-medium flex items-center gap-1">
                            <UserCheck size={12} /> Dihuni oleh {occupant.name}
                          </span>
                        ) : (
                          <span>Kapasitas {r.capacity || 1} orang</span>
                        )}
                        {r.meter_id && (
                          <span className="text-subtle">· Meter: {r.meter_id}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-ink tnum">{fmtIDR(r.price)}</p>
                      <p className="text-[10px] text-subtle">Deposit: {fmtIDR(r.deposit || 0)}</p>
                    </div>
                    <RoomStatusBadge status={r.status} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ROOM DETAIL DRAWER (PANEL SAMPING DETAIL KAMAR)                        */}
      {/* ========================================================================= */}
      <Sheet
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Unit ${selectedRoom.name}` : "Detail Kamar"}
        subtitle={selectedRoom ? `Lantai ${selectedRoom.floor}${selectedRoom.wing ? ` · Sayap ${selectedRoom.wing}` : ""} · ${typeLabels[selectedRoom.room_type] || selectedRoom.room_type}` : ""}
        maxWidth="sm:max-w-xl"
        footer={
          selectedRoom && (
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteRoom(selectedRoom)}
                className="!text-danger border-danger/30 hover:bg-danger/5 !px-3"
                title="Hapus Unit Kamar"
              >
                <Trash2 size={16} />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    openEdit(selectedRoom);
                    setSelectedRoom(null);
                  }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Edit2 size={14} /> Edit Spesifikasi
                </Button>
                {selectedRoom.status === "occupied" && (
                  <Button
                    type="button"
                    onClick={() => {
                      openTransfer(selectedRoom);
                      setSelectedRoom(null);
                    }}
                    className="flex items-center gap-1.5 text-xs bg-primary text-white"
                  >
                    <ArrowLeftRight size={14} /> Pindah Kamar
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedRoom && selectedRoomDetails && (
          <div className="space-y-5 pb-4">
            {/* Top Room Photo & Status Card */}
            <div className="relative rounded-2xl overflow-hidden border border-line bg-muted">
              {selectedRoom.photo_url ? (
                <div className="h-44 w-full relative">
                  <img src={selectedRoom.photo_url} alt={selectedRoom.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute top-3 right-3">
                    <RoomStatusBadge status={selectedRoom.status} className="shadow-lg" />
                  </div>
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="text-xs uppercase tracking-widest font-semibold text-white/80">Tarif Sewa</p>
                    <p className="text-2xl font-serif font-bold tnum">{fmtIDR(selectedRoom.price)} <span className="text-xs font-normal">/bulan</span></p>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-subtle uppercase tracking-wider font-semibold">Tarif Sewa Bulanan</p>
                    <p className="text-2xl font-serif font-bold text-primary tnum">{fmtIDR(selectedRoom.price)}</p>
                  </div>
                  <RoomStatusBadge status={selectedRoom.status} />
                </div>
              )}
            </div>

            {/* Quick Status Lifecycle Transition Actions */}
            <div className="bg-muted/40 p-3 rounded-2xl border border-line">
              <p className="text-[10px] uppercase tracking-wider font-bold text-subtle mb-2">Aksi Transisi Status Cepat:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRoom.status === "cleaning" && (
                  <Button
                    variant="outline"
                    onClick={() => handleTransitionStatus(selectedRoom.id, "available", "Kamar selesai dibersihkan dan siap huni")}
                    className="!py-1.5 !px-3 text-xs bg-emerald-500/10 text-emerald-800 border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    <Sparkles size={13} /> Selesai Pembersihan (Siap Huni)
                  </Button>
                )}
                {selectedRoom.status === "maintenance" && (
                  <Button
                    variant="outline"
                    onClick={() => handleTransitionStatus(selectedRoom.id, "cleaning", "Perbaikan selesai, lanjut ke tahap pembersihan")}
                    className="!py-1.5 !px-3 text-xs bg-teal-500/10 text-teal-800 border-teal-500/30 hover:bg-teal-500/20"
                  >
                    <Sparkles size={13} /> Selesai Perbaikan → Pembersihan
                  </Button>
                )}
                {selectedRoom.status === "available" && (
                  <Button
                    variant="outline"
                    onClick={() => handleTransitionStatus(selectedRoom.id, "maintenance", "Kamar ditandai dalam perbaikan")}
                    className="!py-1.5 !px-3 text-xs bg-rose-500/10 text-rose-800 border-rose-500/30 hover:bg-rose-500/20"
                  >
                    <Wrench size={13} /> Tandai Butuh Maintenance
                  </Button>
                )}
                {selectedRoom.status === "reserved" && (
                  <Button
                    variant="outline"
                    onClick={() => handleTransitionStatus(selectedRoom.id, "available", "Reservasi kamar dibatalkan")}
                    className="!py-1.5 !px-3 text-xs bg-amber-500/10 text-amber-800 border-amber-500/30"
                  >
                    Batalkan Reservasi
                  </Button>
                )}
                {selectedRoom.status === "occupied" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      openTransfer(selectedRoom);
                      setSelectedRoom(null);
                    }}
                    className="!py-1.5 !px-3 text-xs bg-blue-500/10 text-blue-800 border-blue-500/30"
                  >
                    <ArrowLeftRight size={13} /> Pindah Kamar (Room Transfer)
                  </Button>
                )}
              </div>
            </div>

            {/* Active Resident Details (If Occupied) */}
            {selectedRoom.status === "occupied" && selectedRoomDetails.occupant && (
              <FormSection title="Penyewa Aktif" subtitle="Informasi kontrak & kontak penyewa saat ini">
                <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-serif text-lg font-bold">
                        {selectedRoomDetails.occupant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-serif text-lg font-bold text-ink leading-tight">
                          {selectedRoomDetails.occupant.name}
                        </h4>
                        <p className="text-xs text-subtle">
                          {selectedRoomDetails.occupant.occupation || "Penyewa"} {selectedRoomDetails.occupant.nik ? `· NIK: ${selectedRoomDetails.occupant.nik}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-500/10">
                    <div>
                      <span className="text-subtle block text-[10px] uppercase">Masa Sewa:</span>
                      <span className="font-semibold text-ink">
                        {fmtDate(selectedRoomDetails.occupant.lease_start)} — {fmtDate(selectedRoomDetails.occupant.lease_end)}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle block text-[10px] uppercase">Deposit Terbayar:</span>
                      <span className="font-semibold text-ink">{fmtIDR(selectedRoomDetails.occupant.deposit || selectedRoom.deposit)}</span>
                    </div>
                  </div>

                  {/* Quick Contact Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={`https://wa.me/${cleanPhoneWa(selectedRoomDetails.occupant.phone)}?text=Halo%20${encodeURIComponent(selectedRoomDetails.occupant.name)},%20mengenai%20unit%20kamar%20${selectedRoom.name}%20di%20Lewi%20House...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare size={13} /> Chat WhatsApp
                    </a>
                    {selectedRoomDetails.occupant.phone && (
                      <a
                        href={`tel:${selectedRoomDetails.occupant.phone}`}
                        className="px-3 min-h-[36px] bg-surface border border-line text-ink rounded-xl text-xs font-semibold flex items-center justify-center gap-1 hover:bg-muted"
                      >
                        <Phone size={13} /> Hubungi
                      </a>
                    )}
                  </div>
                </div>
              </FormSection>
            )}

            {/* Room Specifications & Utilities */}
            <FormSection title="Spesifikasi & Utilitas" subtitle="Data teknis unit & meteran listrik">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Nomor Unit</span>
                  <span className="text-sm font-bold text-ink">{selectedRoom.name}</span>
                </div>
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Lantai & Sayap</span>
                  <span className="text-sm font-bold text-ink">Lt {selectedRoom.floor} {selectedRoom.wing ? `· Blok ${selectedRoom.wing}` : ""}</span>
                </div>
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Tipe Kamar</span>
                  <span className="text-sm font-bold text-ink">{typeLabels[selectedRoom.room_type] || selectedRoom.room_type}</span>
                </div>
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Kapasitas</span>
                  <span className="text-sm font-bold text-ink">{selectedRoom.capacity || 1} Orang</span>
                </div>
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">Deposit Wajib</span>
                  <span className="text-sm font-bold text-ink">{fmtIDR(selectedRoom.deposit || 0)}</span>
                </div>
                <div className="bg-surface border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-subtle block">ID Meteran Listrik</span>
                  <span className="text-sm font-bold font-mono text-ink flex items-center gap-1">
                    <Zap size={13} className="text-amber-500" /> {selectedRoom.meter_id || "-"}
                  </span>
                </div>
              </div>
            </FormSection>

            {/* Room Facilities */}
            <FormSection title="Fasilitas Kamar">
              {Array.isArray(selectedRoom.facilities) && selectedRoom.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.facilities.map((fac, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-muted text-ink border border-line">
                      <Check size={12} className="text-emerald-600" /> {fac}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-subtle italic">Belum ada data fasilitas unit ini.</p>
              )}
            </FormSection>

            {/* Related Active Complaints / Tickets */}
            {selectedRoomDetails.roomComplaints.length > 0 && (
              <FormSection title="Tiket Komplain & Perbaikan" subtitle="Laporan aktif untuk kamar ini">
                <div className="space-y-2">
                  {selectedRoomDetails.roomComplaints.slice(0, 3).map((comp) => (
                    <div key={comp.id} className="p-2.5 rounded-xl bg-surface border border-line text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-ink">{comp.title || comp.description}</p>
                        <p className="text-[10px] text-subtle">{fmtDate(comp.created_at)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.status === "resolved" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
                      }`}>
                        {comp.status || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </FormSection>
            )}

            {/* Notes */}
            {selectedRoom.notes && (
              <FormSection title="Catatan Internal">
                <p className="text-xs text-subtle bg-muted/60 p-3 rounded-xl whitespace-pre-wrap">{selectedRoom.notes}</p>
              </FormSection>
            )}
          </div>
        )}
      </Sheet>

      {/* ========================================================================= */}
      {/* 2. ROOM TRANSFER MODAL (LAYAR KALKULATOR & PINDAH KAMAR)                   */}
      {/* ========================================================================= */}
      <Sheet
        open={openTransferModal}
        onClose={() => setOpenTransferModal(false)}
        title="Pindah Kamar (Room Transfer)"
        subtitle="Alur mutasi penyewa & kalkulator penyesuaian prorata sewa"
        maxWidth="sm:max-w-xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenTransferModal(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="transfer-form"
              testid="submit-transfer"
              loading={transferSubmitting}
              disabled={!transferDetails?.newRoom}
              className="flex-1 bg-primary text-white"
            >
              Proses Pindah Unit & Terbitkan Invoice
            </Button>
          </>
        }
      >
        <form id="transfer-form" onSubmit={handleExecuteTransfer} className="space-y-4">
          {/* Section 1: Tenant & Target Unit Selection */}
          <FormSection title="1. Pilih Penyewa & Unit Tujuan">
            {/* Select Active Tenant */}
            <Select
              label="Penyewa yang Pindah"
              testid="select-transfer-tenant"
              value={transferTenantId}
              onChange={(e) => setTransferTenantId(e.target.value)}
              required
            >
              <option value="">-- Pilih Penyewa Aktif --</option>
              {tenants
                .filter((t) => t.status === "active" && t.room_id)
                .map((t) => {
                  const room = rooms.find((r) => r.id === t.room_id);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} (Unit: {room?.name || t.room_name || "-"})
                    </option>
                  );
                })}
            </Select>

            {/* Source Room Info Card */}
            {transferDetails && (
              <div className="bg-muted/50 p-3 rounded-xl border border-line mb-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-subtle uppercase block font-semibold">Unit Asal Saat Ini</span>
                  <span className="font-bold text-ink text-sm">{transferDetails.oldRoom.name}</span>
                  <span className="text-subtle ml-2">({typeLabels[transferDetails.oldRoom.room_type] || transferDetails.oldRoom.room_type})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-subtle uppercase block font-semibold">Sewa Bulanan</span>
                  <span className="font-bold text-ink">{fmtIDR(transferDetails.oldRoom.price || transferDetails.tenant.monthly_rent)}</span>
                </div>
              </div>
            )}

            {/* Target Room Dropdown (Available Only) */}
            <Select
              label="Unit Kamar Tujuan (Hanya Unit Tersedia)"
              testid="select-transfer-target-room"
              value={transferTargetRoomId}
              onChange={(e) => setTransferTargetRoomId(e.target.value)}
              required
            >
              <option value="">-- Pilih Unit Kamar Tujuan --</option>
              {rooms
                .filter((r) => r.status === "available" && r.id !== transferDetails?.tenant.room_id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — Lantai {r.floor} ({typeLabels[r.room_type] || r.room_type}) — {fmtIDR(r.price)}/bln
                  </option>
                ))}
            </Select>

            {/* Transfer Effective Date */}
            <Input
              label="Tanggal Efektif Pindah"
              type="date"
              testid="input-transfer-date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
          </FormSection>

          {/* Section 2: Prorata Calculation Box */}
          {transferDetails && (
            <FormSection title="2. Kalkulator Prorata Hari Berjalan" subtitle="Perhitungan selisih sewa & tagihan listrik unit lama">
              <div className="bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-soft">
                {/* Days remaining badge */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                  <span className="text-subtle flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Sisa Hari Bulan Ini:
                  </span>
                  <span className="font-bold text-ink">
                    {transferDetails.daysRemaining} hari <span className="text-subtle font-normal">/ {transferDetails.daysInMonth} hari</span>
                  </span>
                </div>

                {/* Calculation Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-subtle">
                    <span>Pengembalian Sewa Kamar Lama ({transferDetails.oldRoom.name}):</span>
                    <span className="text-emerald-700 font-semibold tnum">- {fmtIDR(transferDetails.prorataOldCredit)}</span>
                  </div>

                  <div className="flex items-center justify-between text-subtle">
                    <span>Tagihan Sewa Kamar Baru ({transferDetails.newRoom ? transferDetails.newRoom.name : "Belum Dipilih"}):</span>
                    <span className="text-ink font-semibold tnum">+ {fmtIDR(transferDetails.prorataNewCharge)}</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold pt-1 border-t border-line/60">
                    <span className="text-ink">Selisih Sewa Prorata:</span>
                    <span className={`tnum ${transferDetails.rentDifference >= 0 ? "text-primary" : "text-emerald-700"}`}>
                      {transferDetails.rentDifference >= 0 ? `+ ${fmtIDR(transferDetails.rentDifference)}` : `- ${fmtIDR(Math.abs(transferDetails.rentDifference))}`}
                    </span>
                  </div>
                </div>

                {/* Electricity adjustment for Old Room */}
                <div className="pt-3 border-t border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink flex items-center gap-1">
                      <Zap size={13} className="text-amber-500" /> Listrik Akhir Kamar Lama:
                    </span>
                    <span className="text-[10px] text-subtle font-mono">
                      Meter: {transferDetails.oldRoom.meter_id || "-"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Pemakaian Akhir (kWh)"
                      type="number"
                      placeholder="Contoh: 45"
                      value={transferOldMeterReading}
                      onChange={(e) => setTransferOldMeterReading(e.target.value)}
                      helper="Selisih kWh akhir"
                    />
                    <MoneyInput
                      label="Biaya Listrik Akhir (Rp)"
                      value={transferElectricityCharge || (Number(transferOldMeterReading || 0) * 1500)}
                      onChange={(v) => {
                        setTransferManualElectricity(true);
                        setTransferElectricityCharge(v);
                      }}
                    />
                  </div>
                </div>

                {/* NET ADJUSTMENT TOTAL BOX */}
                <div className={`p-3.5 rounded-xl border mt-3 flex items-center justify-between ${
                  transferDetails.netAdjustment > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
                    : transferDetails.netAdjustment < 0
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-900"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block">Total Penyesuaian Biaya</span>
                    <span className="text-xs font-medium">
                      {transferDetails.netAdjustment > 0
                        ? "Penyewa perlu membayar tambahan"
                        : transferDetails.netAdjustment < 0
                        ? "Pengembalian / Kredit untuk Penyewa"
                        : "Tidak ada selisih biaya sewa"}
                    </span>
                  </div>
                  <span className="font-serif text-xl font-bold tnum">
                    {fmtIDR(Math.abs(transferDetails.netAdjustment))}
                  </span>
                </div>
              </div>
            </FormSection>
          )}

          {/* Section 3: Old Room Status & Invoice Options */}
          <FormSection title="3. Status Unit Lama & Tagihan">
            <Select
              label="Status Unit Lama Setelah Pindah"
              value={transferOldStatus}
              onChange={(e) => setTransferOldStatus(e.target.value)}
            >
              <option value="cleaning">Dibersihkan (CLEANING) - Rekomendasi</option>
              <option value="available">Langsung Tersedia (AVAILABLE)</option>
            </Select>

            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={transferCreateInvoice}
                onChange={(e) => setTransferCreateInvoice(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span>Terbitkan Invoice Penyesuaian Otomatis di Menu Billing</span>
            </label>

            <Textarea
              label="Catatan Mutasi (Opsional)"
              placeholder="Contoh: Pindah ke tipe Deluxe lantai 2 karena butuh kamar lebih luas."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={2}
            />
          </FormSection>
        </form>
      </Sheet>

      {/* ========================================================================= */}
      {/* 3. ADD / EDIT ROOM MODAL (MODAL TAMBAH / EDIT UNIT KAMAR)                 */}
      {/* ========================================================================= */}
      <Sheet
        open={openAddEditSheet}
        onClose={() => setOpenAddEditSheet(false)}
        title={editingRoom ? "Edit Kamar & Unit" : "Tambah Unit Kamar Baru"}
        subtitle="Konfigurasi spesifikasi kamar, tarif, fasilitas & meteran listrik"
        maxWidth="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenAddEditSheet(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="room-form"
              testid="submit-room"
              className="flex-1"
            >
              {editingRoom ? "Simpan Perubahan" : "Simpan Data Kamar"}
            </Button>
          </>
        }
      >
        <form id="room-form" onSubmit={handleSaveRoom} className="space-y-4">
          {/* Section 1: Room Identity */}
          <FormSection title="Informasi Unit Kamar">
            <Input
              label="Nomor / Nama Unit Kamar"
              testid="input-room-name"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              required
              placeholder="Contoh: 101, 204, atau A-12"
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Lantai"
                testid="input-room-floor"
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                required
                placeholder="1"
              />
              <Input
                label="Sayap / Blok"
                testid="input-room-wing"
                value={roomForm.wing}
                onChange={(e) => setRoomForm({ ...roomForm, wing: e.target.value })}
                placeholder="A / Utara"
              />
              <Input
                label="Kapasitas"
                testid="input-room-capacity"
                type="number"
                min="1"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tipe Kamar"
                testid="input-room-type"
                value={roomForm.room_type}
                onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="vip">VIP</option>
                <option value="suite">Suite</option>
                <option value="studio">Studio</option>
              </Select>
              <Select
                label="Status Kamar"
                testid="input-room-status"
                value={roomForm.status}
                onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
              >
                {Object.entries(roomStatusMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
            </div>
          </FormSection>

          {/* Section 2: Pricing & Metering */}
          <FormSection title="Biaya Sewa & Meteran Listrik">
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput
                label="Harga Sewa Bulanan"
                testid="input-room-price"
                value={roomForm.price}
                onChange={(v) => setRoomForm({ ...roomForm, price: v })}
                required
              />
              <MoneyInput
                label="Deposit Wajib"
                testid="input-room-deposit"
                value={roomForm.deposit}
                onChange={(v) => setRoomForm({ ...roomForm, deposit: v })}
              />
            </div>
            <Input
              label="ID / Nomor Meteran Listrik Terhubung"
              testid="input-room-meter"
              value={roomForm.meter_id}
              onChange={(e) => setRoomForm({ ...roomForm, meter_id: e.target.value })}
              placeholder="Contoh: PLN-204-A"
              helper="Digunakan untuk perhitungan pencatatan utilitas bulanan"
            />
          </FormSection>

          {/* Section 3: Facilities Checkboxes */}
          <FormSection title="Fasilitas Kamar" subtitle="Pilih fasilitas bawaan yang tersedia di unit ini">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {STANDARD_FACILITIES.map((fac) => {
                const checked = roomForm.facilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => toggleFacility(fac)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-colors ${
                      checked
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface border-line text-subtle hover:border-primary/40 hover:text-ink"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${checked ? "bg-primary text-white" : "border border-line"}`}>
                      {checked && <Check size={11} />}
                    </div>
                    <span className="truncate">{fac}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Additional Facility */}
            <div className="flex items-center gap-2">
              <Input
                label="Tambah Fasilitas Lain"
                placeholder="Misal: Kulkas Mini, Balkon"
                value={customFacility}
                onChange={(e) => setCustomFacility(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomFacility();
                  }
                }}
                className="!mb-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomFacility}
                className="shrink-0 mt-6 !px-4"
              >
                Tambah
              </Button>
            </div>
          </FormSection>

          {/* Section 4: Photo Gallery & Notes */}
          <FormSection title="Foto & Catatan">
            <Input
              label="URL Foto Kamar"
              testid="input-room-photo"
              value={roomForm.photo_url || ""}
              onChange={(e) => setRoomForm({ ...roomForm, photo_url: e.target.value })}
              placeholder="/gallery/agoda/... atau https://..."
            />

            <div className="mt-2">
              <p className="text-xs font-medium text-subtle mb-1.5 flex items-center gap-1.5">
                <ImageIcon size={13} className="text-primary" /> Pilih dari Galeri Lewi House:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {GALLERY_IMAGES.slice(0, 10).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setRoomForm({ ...roomForm, photo_url: img.src })}
                    className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      roomForm.photo_url === img.src ? "border-primary ring-2 ring-primary/20 scale-105" : "border-line hover:border-primary/50 opacity-70 hover:opacity-100"
                    }`}
                    title={img.title}
                  >
                    <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {roomForm.photo_url && (
              <div className="mt-2 p-2 bg-muted/40 rounded-xl border border-line flex items-center gap-3">
                <img
                  src={roomForm.photo_url}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-line"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink truncate">{roomForm.photo_url}</p>
                  <p className="text-[10px] text-subtle">Foto terpilih untuk kamar ini</p>
                </div>
              </div>
            )}

            <Textarea
              label="Catatan Khusus Kamar"
              testid="input-room-notes"
              value={roomForm.notes || ""}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              rows={2}
              placeholder="Catatan inventaris, kondisi khusus unit, dll."
            />
          </FormSection>
        </form>
      </Sheet>
    </div>
  );
}
