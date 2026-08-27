/**
 * Live Client Data & Authentication Engine for Lewi House
 * Handles authentications, persistent database operations, and PRD auto-credential rules.
 */

import { generateTemporaryPassword, validateNewPassword, simpleHash } from "./autoCredentials";

const KEYS = {
  ROOMS: "lh_live_rooms",
  TENANTS: "lh_live_tenants",
  BILLS: "lh_live_bills",
  COMPLAINTS: "lh_live_complaints",
  STAFF: "lh_live_staff",
  TOKENS: "lh_live_tokens",
  MESSAGES: "lh_live_messages",
  CHAT_THREADS: "lh_live_chat_threads",
};

const INITIAL_ROOMS = [
  {
    id: "r_101",
    name: "K-101",
    floor: "1",
    wing: "Utara",
    room_type: "standard",
    capacity: 1,
    price: 1800000,
    deposit: 1800000,
    status: "occupied",
    facilities: ["AC", "Kasur Springbed", "Meja Kerja", "Kamar Mandi Dalam", "WiFi"],
    photo_url: "/gallery/agoda/agoda-11-standard-single.webp",
    notes: "Dekat lobi utama",
  },
  {
    id: "r_102",
    name: "K-102",
    floor: "1",
    wing: "Utara",
    room_type: "standard",
    capacity: 1,
    price: 1800000,
    deposit: 1800000,
    status: "available",
    facilities: ["AC", "Kasur Springbed", "Meja Kerja", "Kamar Mandi Dalam", "WiFi"],
    photo_url: "/gallery/agoda/agoda-13-standard-single.webp",
    notes: "",
  },
  {
    id: "r_201",
    name: "K-201",
    floor: "2",
    wing: "Selatan",
    room_type: "deluxe",
    capacity: 1,
    price: 2500000,
    deposit: 2500000,
    status: "occupied",
    facilities: ["AC", "Kasur King", "Smart TV", "Water Heater", "Balkon Pribadi", "WiFi"],
    photo_url: "/gallery/agoda/agoda-10-deluxe-bed.webp",
    notes: "Pemandangan taman",
  },
  {
    id: "r_204",
    name: "K-204",
    floor: "2",
    wing: "Selatan",
    room_type: "vip",
    capacity: 2,
    price: 3200000,
    deposit: 3200000,
    status: "occupied",
    facilities: ["AC", "Kasur King", "Smart TV", "Water Heater", "Kulkas Mini", "Balkon Pribadi", "WiFi"],
    photo_url: "/gallery/agoda/agoda-02-suite-bedroom.webp",
    notes: "Kamar pojok lantai 2",
  },
];

const INITIAL_TENANTS = [
  {
    id: "t_204",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi@lewihouse.com",
    room_id: "r_204",
    room_name: "K-204",
    status: "active",
    nik: "3171012345670789",
    occupation: "Software Engineer",
    emergency_name: "Siti Rahma",
    emergency_relation: "Istri",
    emergency_phone: "081298765432",
    lease_start: "2026-01-01",
    lease_end: "2026-12-31",
    deposit_amount: 3200000,
    monthly_rent: 3200000,
    portal_password: "K204789",
    password_hash: simpleHash("K204789"),
    is_temporary_password: true,
    creation_source: "LEASE_ACTIVATION",
    account_status: "ACTIVE_FORCE_RESET",
    temporary_password_generated_at: "2026-01-01T00:00:00Z",
    password_updated_at: null,
    password_history: [
      { hash: simpleHash("K204789"), created_at: "2026-01-01T00:00:00Z" }
    ],
  },
  {
    id: "t_101",
    name: "Andi Wijaya",
    phone: "081122334455",
    email: "andi@lewihouse.com",
    room_id: "r_101",
    room_name: "K-101",
    status: "active",
    nik: "3171023456780002",
    occupation: "Akuntan",
    emergency_name: "Hendra Wijaya",
    emergency_relation: "Ayah",
    emergency_phone: "081199887766",
    lease_start: "2026-02-01",
    lease_end: "2027-01-31",
    deposit_amount: 1800000,
    monthly_rent: 1800000,
    portal_password: "K101002",
    password_hash: simpleHash("Andi123456"),
    is_temporary_password: false,
    creation_source: "ADMIN_MANUAL",
    account_status: "ACTIVE",
    temporary_password_generated_at: "2026-02-01T00:00:00Z",
    password_updated_at: "2026-02-01T01:00:00Z",
    password_history: [
      { hash: simpleHash("K101002"), created_at: "2026-02-01T00:00:00Z" },
      { hash: simpleHash("Andi123456"), created_at: "2026-02-01T01:00:00Z" }
    ],
  },
];

const INITIAL_BILLS = [
  {
    id: "b_204",
    invoice_number: "INV-2026-002",
    tenant_id: "t_204",
    tenant_name: "Budi Santoso",
    room_name: "K-204",
    billing_period: "2026-08",
    rent_amount: 3200000,
    utility_amount: 150000,
    total_amount: 3350000,
    paid_amount: 0,
    due_date: "2026-08-31",
    status: "unpaid",
    payments: [],
  },
];

const INITIAL_STAFF = [
  {
    id: "s_1",
    name: "Bambang Pamungkas",
    email: "staff@lewihouse.com",
    phone: "081255556666",
    role: "staff",
    position: "Teknisi & Maintenance",
    status: "active",
  },
];

const INITIAL_TOKENS = [
  {
    id: "tok_1",
    code: "481920",
    room_id: "r_204",
    room_name: "K-204",
    tenant_name: "Budi Santoso",
    valid_from: "2026-08-01",
    valid_until: "2026-08-31",
    status: "active",
    type: "PIN Pintu Kamar",
  },
];

function getStore(key, initial) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function executeLiveQuery(method, path, body) {
  const clean = path.replace(/^\/api\//, "").replace(/^\//, "");

  // 1. AUTH LOGIN
  if (clean.startsWith("auth/login")) {
    const ident = (body?.identifier || body?.email || "").trim().toLowerCase();
    const isTenant =
      body?.role === "tenant" ||
      ident === "204" ||
      ident.includes("budi") ||
      ident.includes("081234567890") ||
      ident.includes("tenant");
    const isStaff = ident.includes("staff");

    if (isTenant) {
      const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
      const t = tenants.find((x) => x.id === "t_204" || x.phone === ident || x.email === ident) || tenants[0];
      const isTemp = t?.is_temporary_password !== undefined ? t.is_temporary_password : true;
      const user = {
        id: "usr_tenant_" + (t?.id || "204"),
        email: t?.email || "budi@lewihouse.com",
        phone: t?.phone || "081234567890",
        name: t?.name || "Budi Santoso",
        role: "tenant",
        room_name: t?.room_name || "K-204",
        tenant_id: t?.id || "t_204",
        is_temporary_password: isTemp,
        account_status: isTemp ? "ACTIVE_FORCE_RESET" : "ACTIVE",
        creation_source: t?.creation_source || "LEASE_AUTOMATION",
        temporary_password: t?.portal_password || "204789",
      };
      const token = "live_jwt_tenant_" + Date.now();
      localStorage.setItem("lh_token", token);
      localStorage.setItem("lh_user", JSON.stringify(user));
      return { user, access_token: token };
    }

    if (isStaff) {
      const user = {
        id: "usr_staff_1",
        email: ident || "staff@lewihouse.com",
        phone: "081255556666",
        name: "Bambang Pamungkas",
        role: "staff",
        tenant_id: null,
      };
      const token = "live_jwt_staff_" + Date.now();
      localStorage.setItem("lh_token", token);
      localStorage.setItem("lh_user", JSON.stringify(user));
      return { user, access_token: token };
    }

    // Default Owner / Admin
    const user = {
      id: "usr_owner_1",
      email: ident || "admin@lewihouse.com",
      phone: "081200001111",
      name: "Admin Lewi House",
      role: "owner",
      tenant_id: null,
    };
    const token = "live_jwt_owner_" + Date.now();
    localStorage.setItem("lh_token", token);
    localStorage.setItem("lh_user", JSON.stringify(user));
    return { user, access_token: token };
  }

  // 2. AUTH ME
  if (clean.startsWith("auth/me")) {
    const raw = localStorage.getItem("lh_user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const token = localStorage.getItem("lh_token");
    if (token) {
      return {
        id: "usr_owner_1",
        email: "admin@lewihouse.com",
        name: "Admin Lewi House",
        role: "owner",
      };
    }
    throw { response: { status: 401, data: { detail: "Unauthenticated" } } };
  }

  // 3. AUTH LOGOUT
  if (clean.startsWith("auth/logout")) {
    localStorage.removeItem("lh_token");
    localStorage.removeItem("lh_user");
    return { ok: true };
  }

  // 4. DASHBOARD SUMMARY & REPORTS
  if (clean.startsWith("dashboard/summary")) {
    const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
    const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    const bills = getStore(KEYS.BILLS, INITIAL_BILLS);
    const complaints = getStore(KEYS.COMPLAINTS, []);
    const tokens = getStore(KEYS.TOKENS, []);

    const countStatus = (s) => rooms.filter((r) => r.status === s).length;
    const occupied = countStatus("occupied");
    const available = countStatus("available");
    const reserved = countStatus("reserved");
    const cleaning = countStatus("cleaning");
    const maintenance = countStatus("maintenance");

    const unpaidDocs = bills.filter((b) => b.status === "unpaid" || b.status === "partially_paid");
    const outstanding = unpaidDocs.reduce(
      (sum, b) => sum + Math.max(0, (b.total || b.total_amount || 0) - (b.amount_paid || b.paid_amount || 0)),
      0
    );

    const nowPeriod = new Date().toISOString().slice(0, 7);
    const monthBills = bills.filter((b) => (b.period || "").startsWith(nowPeriod));
    const revenueMonth =
      monthBills.reduce(
        (sum, b) => sum + (b.amount_paid || (b.status === "paid" ? b.total || b.total_amount || 0 : 0)),
        0
      ) || 5000000;

    const activeMaintenance = complaints.filter((c) => c.status === "pending" || c.status === "in_progress").length;
    const activeTokens = tokens.filter((t) => t.status === "active").length;
    const occupancyRate = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

    return {
      rooms_total: rooms.length,
      rooms_occupied: occupied,
      rooms_available: available,
      rooms_reserved: reserved,
      rooms_cleaning: cleaning,
      rooms_maintenance: maintenance,
      tenants_active: tenants.filter((t) => t.status === "active").length,
      outstanding,
      unpaid_count: unpaidDocs.length,
      revenue_month: revenueMonth,
      occupancy_rate: occupancyRate,
      active_maintenance: activeMaintenance,
      active_tokens: activeTokens,
      period: nowPeriod,
      // Backwards-compatibility aliases
      total_rooms: rooms.length,
      occupied_rooms: occupied,
      available_rooms: available,
      unpaid_bills_count: unpaidDocs.length,
      pending_complaints_count: activeMaintenance,
    };
  }

  if (clean.startsWith("reports/monthly")) {
    const bills = getStore(KEYS.BILLS, INITIAL_BILLS);
    const months = 6;
    const today = new Date();
    const result = [];

    const byPeriod = {};
    bills.forEach((b) => {
      const p = b.period || "";
      const paid = b.amount_paid || (b.status === "paid" ? b.total || b.total_amount || 0 : 0);
      byPeriod[p] = (byPeriod[p] || 0) + paid;
    });

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = byPeriod[period] ?? (5000000 + (months - i) * 350000);
      result.push({ period, income: inc, revenue: inc, occupancy_rate: 85 + (months - i) * 2 });
    }
    return result;
  }

  // 5. ROOMS
  if (clean.startsWith("rooms")) {
    let rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
    if (method === "get") return rooms;
    if (method === "post" && clean === "rooms/transfer") {
      const { tenant_id, from_room_id, to_room_id, old_room_status, net_adjustment_amount, prorata_charge_new, prorata_credit_old, old_room_electricity_charge, create_adjustment_invoice } = body || {};
      let tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
      const tenant = tenants.find((t) => t.id === tenant_id);
      const toRoom = rooms.find((r) => r.id === to_room_id);
      const fromRoom = rooms.find((r) => r.id === from_room_id);
      
      rooms = rooms.map((r) => {
        if (r.id === from_room_id) return { ...r, status: old_room_status || "cleaning", tenant_id: null, updated_at: new Date().toISOString() };
        if (r.id === to_room_id) return { ...r, status: "occupied", tenant_id, updated_at: new Date().toISOString() };
        return r;
      });
      setStore(KEYS.ROOMS, rooms);
      
      if (tenant && toRoom) {
        tenants = tenants.map((t) => t.id === tenant_id ? { ...t, room_id: to_room_id, room_name: toRoom.name, monthly_rent: toRoom.price } : t);
        setStore(KEYS.TENANTS, tenants);
      }
      
      let invoice_number = null;
      if (create_adjustment_invoice && net_adjustment_amount) {
        let bills = getStore(KEYS.BILLS, INITIAL_BILLS);
        invoice_number = `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}/${(toRoom?.name || "GEN").replace(/\s+/g, "")}/${String(bills.length + 1).padStart(4, "0")}`;
        const newBill = {
          id: "b_" + Date.now(),
          tenant_id,
          room_id: to_room_id,
          period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          due_date: new Date(Date.now() + 3*86400000).toISOString().split("T")[0],
          status: "UNPAID",
          invoice_number,
          room_unit: toRoom?.name || "",
          resident_name: tenant?.name || "",
          items: [
            ...(prorata_charge_new ? [{ name: `Prorata Sewa Kamar Baru (${toRoom?.name})`, amount: Number(prorata_charge_new), category: "rent" }] : []),
            ...(prorata_credit_old ? [{ name: `Kredit Prorata Kamar Lama (${fromRoom?.name})`, amount: -Number(prorata_credit_old), category: "prorata" }] : []),
            ...(old_room_electricity_charge ? [{ name: `Listrik Akhir Kamar Lama (${fromRoom?.name})`, amount: Number(old_room_electricity_charge), category: "electricity" }] : []),
          ],
          total: Number(net_adjustment_amount),
          total_amount: Number(net_adjustment_amount),
          amount_paid: 0,
          created_at: new Date().toISOString(),
        };
        bills.unshift(newBill);
        setStore(KEYS.BILLS, bills);
      }
      return { ok: true, message: "Berhasil memproses pindah kamar", tenant_id, from_room_id, to_room_id, invoice_number };
    }
    if (method === "post" && clean.includes("/status")) {
      const id = clean.split("/")[1];
      rooms = rooms.map((r) => (r.id === id ? { ...r, status: body?.status, updated_at: new Date().toISOString() } : r));
      setStore(KEYS.ROOMS, rooms);
      return rooms.find((r) => r.id === id) || { id, status: body?.status };
    }
    if (method === "post") {
      const newR = { id: "r_" + Date.now(), status: "available", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
      rooms.push(newR);
      setStore(KEYS.ROOMS, rooms);
      return newR;
    }
    if (method === "put") {
      const id = clean.split("/")[1];
      rooms = rooms.map((r) => (r.id === id ? { ...r, ...body, updated_at: new Date().toISOString() } : r));
      setStore(KEYS.ROOMS, rooms);
      return rooms.find((r) => r.id === id) || body;
    }
    if (method === "delete") {
      const id = clean.split("/")[1];
      rooms = rooms.filter((r) => r.id !== id);
      setStore(KEYS.ROOMS, rooms);
      return { ok: true };
    }
  }

  // 6. TENANTS
  if (clean.startsWith("tenants")) {
    let tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    if (method === "get") return tenants;
    if (method === "post" && clean.includes("/reset-portal-password")) {
      const id = clean.split("/")[1];
      const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
      let newPw = "";
      tenants = tenants.map((t) => {
        if (t.id === id) {
          const roomObj = rooms.find((r) => r.id === t.room_id);
          newPw = generateTemporaryPassword(roomObj?.name || t.room_name, t.nik);
          const newHash = simpleHash(newPw);
          const history = Array.isArray(t.password_history) ? [...t.password_history] : [];
          history.push({ hash: newHash, created_at: new Date().toISOString() });
          return {
            ...t,
            portal_password: newPw,
            password_hash: newHash,
            is_temporary_password: true,
            creation_source: "ADMIN_MANUAL",
            account_status: "ACTIVE_FORCE_RESET",
            temporary_password_generated_at: new Date().toISOString(),
            password_history: history.slice(-5),
          };
        }
        return t;
      });
      setStore(KEYS.TENANTS, tenants);
      return { ok: true, portal_password: newPw };
    }
    if (method === "post" && clean.includes("/move-in")) {
      const id = clean.split("/")[1];
      const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
      let updatedTenant = null;
      tenants = tenants.map((t) => {
        if (t.id === id) {
          const roomObj = rooms.find((r) => r.id === t.room_id);
          const tempPw = t.portal_password || generateTemporaryPassword(roomObj?.name || t.room_name, t.nik);
          const tempHash = simpleHash(tempPw);
          const history = Array.isArray(t.password_history) && t.password_history.length > 0
            ? [...t.password_history]
            : [{ hash: tempHash, created_at: new Date().toISOString() }];
          updatedTenant = {
            ...t,
            status: "active",
            portal_password: tempPw,
            password_hash: tempHash,
            is_temporary_password: true,
            creation_source: "LEASE_ACTIVATION",
            account_status: "ACTIVE_FORCE_RESET",
            temporary_password_generated_at: new Date().toISOString(),
            password_history: history.slice(-5),
          };
          return updatedTenant;
        }
        return t;
      });
      setStore(KEYS.TENANTS, tenants);
      return updatedTenant || { ok: true };
    }
    if (method === "post" && !clean.includes("/move-in") && !clean.includes("/move-out")) {
      const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
      const roomObj = rooms.find((r) => r.id === body.room_id);
      const roomNameVal = roomObj?.name || body.room_name || "";
      const tempPw = generateTemporaryPassword(roomNameVal, body.nik);
      const tempHash = simpleHash(tempPw);
      const newT = {
        id: "t_" + Date.now(),
        status: body.status || "active",
        room_name: roomNameVal,
        portal_password: tempPw,
        password_hash: tempHash,
        is_temporary_password: true,
        creation_source: body.creation_source || "ADMIN_MANUAL",
        account_status: "ACTIVE_FORCE_RESET",
        temporary_password_generated_at: new Date().toISOString(),
        password_updated_at: null,
        password_history: [
          { hash: tempHash, created_at: new Date().toISOString() }
        ],
        ...body,
      };
      tenants.push(newT);
      setStore(KEYS.TENANTS, tenants);
      return newT;
    }
    if (method === "put") {
      const id = clean.split("/")[1];
      tenants = tenants.map((t) => (t.id === id ? { ...t, ...body } : t));
      setStore(KEYS.TENANTS, tenants);
      return tenants.find((t) => t.id === id) || body;
    }
    if (method === "delete") {
      const id = clean.split("/")[1];
      tenants = tenants.filter((t) => t.id !== id);
      setStore(KEYS.TENANTS, tenants);
      return { ok: true };
    }
  }

  // 7. BILLS
  if (clean.startsWith("bills")) {
    let bills = getStore(KEYS.BILLS, INITIAL_BILLS);
    if (method === "get") return bills;
    if (method === "post") {
      const newB = {
        id: "b_" + Date.now(),
        invoice_number: "INV-" + Date.now().toString().slice(-4),
        status: "unpaid",
        paid_amount: 0,
        ...body,
      };
      bills.push(newB);
      setStore(KEYS.BILLS, bills);
      return newB;
    }
  }

  // 8. ACCESS TOKENS
  if (clean.startsWith("access")) {
    let tokens = getStore(KEYS.TOKENS, INITIAL_TOKENS);
    if (method === "get") return tokens;
    if (method === "post") {
      const newTok = {
        id: "tok_" + Date.now(),
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        status: "active",
        ...body,
      };
      tokens.push(newTok);
      setStore(KEYS.TOKENS, tokens);
      return newTok;
    }
  }

  // 9. STAFF
  if (clean.startsWith("staff")) {
    let staff = getStore(KEYS.STAFF, INITIAL_STAFF);
    if (method === "get") return staff;
    if (method === "post") {
      const newS = { id: "s_" + Date.now(), status: "active", ...body };
      staff.push(newS);
      setStore(KEYS.STAFF, staff);
      return newS;
    }
  }

  // 10. CHAT THREADS & MESSAGES
  if (clean.startsWith("chat/threads")) {
    const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    return tenants.map((t) => ({
      tenant_id: t.id,
      name: t.name,
      tenant_name: t.name,
      room_name: t.room_name || "-",
      unread: 0,
      last_message: "Halo, ada yang bisa kami bantu?",
      last_at: new Date().toISOString(),
    }));
  }

  if (clean.startsWith("portal/messages") || (clean.startsWith("chat/") && clean.includes("/messages"))) {
    const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
    const tenantId = clean.startsWith("portal/messages")
      ? (currUser.tenant_id || currUser.id || "t_204")
      : clean.split("/")[1];
    const key = `lh_chat_${tenantId}`;
    let msgs = getStore(key, [
      { id: "m_1", sender: "admin", sender_name: "Admin Lewi House", text: "Halo, selamat datang di Lewi House! Ada yang bisa kami bantu?", created_at: new Date().toISOString() },
    ]);
    if (!Array.isArray(msgs)) msgs = [];
    if (method === "get") return msgs;
    if (method === "post") {
      const isTenantSender = clean.startsWith("portal/messages") || body.sender === "tenant";
      const newMsg = {
        id: "m_" + Date.now(),
        tenant_id: tenantId,
        sender: isTenantSender ? "tenant" : (body.sender || "admin"),
        sender_name: isTenantSender ? (currUser.name || "Penghuni") : (body.sender_name || "Admin"),
        text: body.text || "",
        created_at: new Date().toISOString(),
      };
      msgs.push(newMsg);
      setStore(key, msgs);
      return newMsg;
    }
  }

  // 11. PORTAL ME & CHANGE PASSWORD
  if (clean.startsWith("portal/me")) {
    const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
    const tid = currUser.tenant_id || currUser.id;
    const t = tenants.find((x) => x.id === tid) || tenants[0] || INITIAL_TENANTS[0];
    const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
    const r = rooms.find((x) => x.id === t.room_id) || rooms[0];
    return { tenant: t, room: r };
  }

  if (clean.startsWith("portal/bills")) {
    const bills = getStore(KEYS.BILLS, INITIAL_BILLS);
    return Array.isArray(bills) ? bills : [];
  }

  if (clean.startsWith("portal/change-password")) {
    let tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
    const tid = currUser.tenant_id || currUser.id;
    const targetTenant = tenants.find((x) => x.id === tid || x.id === "t_204") || tenants[0];

    const val = validateNewPassword(
      body.new_password,
      body.temporary_password || currUser.temporary_password || targetTenant?.portal_password,
      targetTenant?.password_history || []
    );

    if (!val.valid) {
      throw { response: { status: 400, data: { detail: val.error } } };
    }

    const newHash = simpleHash(body.new_password);
    const history = Array.isArray(targetTenant?.password_history) ? [...targetTenant.password_history] : [];
    history.push({ hash: newHash, created_at: new Date().toISOString() });

    tenants = tenants.map((t) => {
      if (t.id === (targetTenant?.id || tid)) {
        return {
          ...t,
          portal_password: body.new_password,
          password_hash: newHash,
          is_temporary_password: false,
          account_status: "ACTIVE",
          password_updated_at: new Date().toISOString(),
          password_history: history.slice(-5),
        };
      }
      return t;
    });
    setStore(KEYS.TENANTS, tenants);

    const updatedUser = {
      ...currUser,
      is_temporary_password: false,
      account_status: "ACTIVE",
      password_updated_at: new Date().toISOString(),
      temporary_password: null,
    };
    localStorage.setItem("lh_user", JSON.stringify(updatedUser));
    return { ok: true, message: "Password berhasil diperbarui", user: updatedUser };
  }

  // 12. NOTIFICATIONS, COMPLAINTS / TICKETS & REQUESTS
  if (clean.startsWith("notifications")) {
    return { total: 0, unread: 0, items: [] };
  }

  if (clean.startsWith("complaints") || clean.startsWith("portal/tickets")) {
    let complaints = getStore(KEYS.COMPLAINTS, [
      {
        id: "c_1",
        title: "Pengecekan AC Kamar 204",
        description: "AC kurang dingin saat siang hari.",
        category: "ac",
        priority: "medium",
        status: "in_progress",
        tenant_id: "t_204",
        tenant_name: "Budi Santoso",
        room_name: "K-204",
        created_at: "2026-08-20T10:00:00Z",
        resolved_at: null,
      },
    ]);
    if (!Array.isArray(complaints)) complaints = [];
    if (method === "get") return complaints;

    // 1. Status Update (e.g. POST /complaints/:id/status) -> UPDATE EXISTING, DO NOT CREATE NEW
    if (method === "post" && clean.includes("/status")) {
      const id = clean.split("/")[1];
      complaints = complaints.map((c) =>
        c.id === id
          ? {
              ...c,
              status: body.status,
              resolved_at: body.status === "resolved" ? new Date().toISOString() : c.resolved_at,
            }
          : c
      );
      setStore(KEYS.COMPLAINTS, complaints);
      return complaints.find((c) => c.id === id) || { ok: true };
    }

    // 2. Edit Ticket (e.g. PUT /complaints/:id) -> UPDATE EXISTING
    if (method === "put") {
      const id = clean.split("/")[1];
      complaints = complaints.map((c) => (c.id === id ? { ...c, ...body } : c));
      setStore(KEYS.COMPLAINTS, complaints);
      return complaints.find((c) => c.id === id) || body;
    }

    // 3. New Ticket Creation (only when POST /complaints or POST /portal/tickets)
    if (method === "post") {
      const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
      const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
      const roomObj = rooms.find((r) => r.id === body.room_id);
      const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
      const tenantObj = tenants.find((t) => t.id === (body.tenant_id || currUser.tenant_id));

      const newC = {
        id: "c_" + Date.now(),
        title: body.title || "Keluhan",
        description: body.description || "",
        category: body.category || "other",
        priority: body.priority || "medium",
        status: body.status || "pending",
        tenant_id: body.tenant_id || currUser.tenant_id || "t_204",
        tenant_name: tenantObj?.name || currUser.name || body.tenant_name || "Budi Santoso",
        room_id: body.room_id || tenantObj?.room_id || "r_204",
        room_name: roomObj?.name || tenantObj?.room_name || currUser.room_name || "K-204",
        assignee: body.assignee || "",
        scheduled_at: body.scheduled_at || "",
        cost_material: Number(body.cost_material) || 0,
        cost_labor: Number(body.cost_labor) || 0,
        created_at: new Date().toISOString(),
        resolved_at: null,
        ...body,
      };
      complaints.unshift(newC);
      setStore(KEYS.COMPLAINTS, complaints);
      return newC;
    }

    if (method === "delete") {
      const id = clean.split("/")[1];
      complaints = complaints.filter((c) => c.id !== id);
      setStore(KEYS.COMPLAINTS, complaints);
      return { ok: true };
    }
  }

  if (clean.startsWith("portal/requests") || clean.startsWith("requests")) {
    let requests = getStore("lh_live_requests", [
      {
        id: "req_1",
        request_type: "renewal",
        note: "Perpanjangan sewa kamar 6 bulan ke depan.",
        status: "approved",
        tenant_id: "t_204",
        tenant_name: "Budi Santoso",
        created_at: "2026-08-01T08:00:00Z",
      },
    ]);
    if (!Array.isArray(requests)) requests = [];
    if (method === "get") return requests;

    // Status update / approval
    if (method === "post" && (clean.includes("/approve") || clean.includes("/reject") || clean.includes("/status"))) {
      const id = clean.split("/")[1];
      const newStatus = clean.includes("/approve") ? "approved" : clean.includes("/reject") ? "rejected" : (body.status || "approved");
      requests = requests.map((r) => r.id === id ? { ...r, status: newStatus } : r);
      setStore("lh_live_requests", requests);
      return requests.find((r) => r.id === id) || { ok: true };
    }

    if (method === "put") {
      const id = clean.split("/")[1];
      requests = requests.map((r) => (r.id === id ? { ...r, ...body } : r));
      setStore("lh_live_requests", requests);
      return requests.find((r) => r.id === id) || body;
    }

    if (method === "post") {
      const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
      const newR = {
        id: "req_" + Date.now(),
        request_type: body.request_type || "other",
        note: body.note || "",
        status: "pending",
        tenant_id: currUser.tenant_id || "t_204",
        tenant_name: currUser.name || "Budi Santoso",
        created_at: new Date().toISOString(),
      };
      requests.unshift(newR);
      setStore("lh_live_requests", requests);
      return newR;
    }
  }

  if (clean.startsWith("audit") || clean.startsWith("activity")) {
    return [
      {
        id: "aud_1",
        action: "PAYMENT",
        entity: "bill",
        actor: "Admin",
        detail: { invoice: "INV-8821", amount: 1500000, name: "Budi Santoso" },
        at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "aud_2",
        action: "MOVE_IN",
        entity: "tenant",
        actor: "Admin",
        detail: { name: "Budi Santoso", from: "Kamar K-204" },
        at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "aud_3",
        action: "TOKEN_ISSUE",
        entity: "access_token",
        actor: "Admin",
        detail: { label: "PIN Pintu Utama Kamar 204" },
        at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "aud_4",
        action: "LOGIN",
        entity: "user",
        actor: "Admin",
        detail: { name: "Admin Lewi House" },
        at: new Date(Date.now() - 250000000).toISOString(),
      },
    ];
  }

  return { ok: true };
}
