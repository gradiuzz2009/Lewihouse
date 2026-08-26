// Mock and Offline Storage Engine for Lewi House Web App

const STORAGE_KEYS = {
  ROOMS: "lh_rooms",
  TENANTS: "lh_tenants",
  BILLS: "lh_bills",
  COMPLAINTS: "lh_complaints",
  STAFF: "lh_staff",
  TOKENS: "lh_tokens",
  MESSAGES: "lh_messages",
  AUDIT: "lh_audit",
};

const DEFAULT_ROOMS = [
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
    photo_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop",
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
    photo_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop",
    notes: "",
  },
  {
    id: "r_201",
    name: "K-201",
    floor: "2",
    wing: "Selatan",
    room_type: "deluxe",
    capacity: 2,
    price: 2500000,
    deposit: 2500000,
    status: "occupied",
    facilities: ["AC Daikin", "Smart TV 32 inch", "Kulkas Mini", "Kasur Queen", "Water Heater", "Balkon"],
    photo_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop",
    notes: "Pemandangan taman",
  },
  {
    id: "r_202",
    name: "K-202",
    floor: "2",
    wing: "Selatan",
    room_type: "deluxe",
    capacity: 2,
    price: 2500000,
    deposit: 2500000,
    status: "cleaning",
    facilities: ["AC Daikin", "Smart TV 32 inch", "Kulkas Mini", "Kasur Queen", "Water Heater", "Balkon"],
    photo_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop",
    notes: "Pembersihan berkala",
  },
  {
    id: "r_203",
    name: "K-203",
    floor: "2",
    wing: "Selatan",
    room_type: "vip",
    capacity: 2,
    price: 3200000,
    deposit: 3200000,
    status: "maintenance",
    facilities: ["AC Daikin Inverter", "Smart TV 43 inch", "Kulkas 2 Pintu", "Sofa Bed", "Water Heater", "Kitchen Set"],
    photo_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop",
    notes: "Servis AC rutin",
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
    facilities: ["AC Daikin Inverter", "Smart TV 43 inch", "Kulkas 2 Pintu", "Sofa Bed", "Water Heater", "Kitchen Set"],
    photo_url: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&auto=format&fit=crop",
    notes: "Penghuni Budi Santoso",
  },
];

const DEFAULT_TENANTS = [
  {
    id: "t_204",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi@lewihouse.com",
    room_id: "r_204",
    room_name: "K-204",
    status: "active",
    nik: "3171012345670001",
    occupation: "Software Engineer",
    emergency_name: "Siti Rahma",
    emergency_relation: "Istri",
    emergency_phone: "081298765432",
    lease_start: "2026-01-01",
    lease_end: "2026-12-31",
    deposit_amount: 3200000,
    monthly_rent: 3200000,
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
  },
  {
    id: "t_201",
    name: "Citra Lestari",
    phone: "085678901234",
    email: "citra@lewihouse.com",
    room_id: "r_201",
    room_name: "K-201",
    status: "active",
    nik: "3171034567890003",
    occupation: "Graphic Designer",
    emergency_name: "Dewi Lestari",
    emergency_relation: "Kakak",
    emergency_phone: "085611223344",
    lease_start: "2026-03-01",
    lease_end: "2027-02-28",
    deposit_amount: 2500000,
    monthly_rent: 2500000,
  },
];

const DEFAULT_BILLS = [
  {
    id: "b_101",
    invoice_number: "INV-202608-K101",
    tenant_id: "t_101",
    tenant_name: "Andi Wijaya",
    room_id: "r_101",
    room_name: "K-101",
    period: "2026-08",
    due_date: "2026-08-10",
    rent_amount: 1800000,
    utility_amount: 150000,
    penalty_amount: 0,
    total_amount: 1950000,
    paid_amount: 1950000,
    status: "paid",
    payments: [
      { id: "p_1", amount: 1950000, method: "qris", paid_at: "2026-08-05T10:30:00Z", reference: "QRIS-882910" },
    ],
  },
  {
    id: "b_201",
    invoice_number: "INV-202608-K201",
    tenant_id: "t_201",
    tenant_name: "Citra Lestari",
    room_id: "r_201",
    room_name: "K-201",
    period: "2026-08",
    due_date: "2026-08-10",
    rent_amount: 2500000,
    utility_amount: 200000,
    penalty_amount: 0,
    total_amount: 2700000,
    paid_amount: 1000000,
    status: "partially_paid",
    payments: [
      { id: "p_2", amount: 1000000, method: "transfer", paid_at: "2026-08-08T14:00:00Z", reference: "BCA-102938" },
    ],
  },
  {
    id: "b_204",
    invoice_number: "INV-202608-K204",
    tenant_id: "t_204",
    tenant_name: "Budi Santoso",
    room_id: "r_204",
    room_name: "K-204",
    period: "2026-08",
    due_date: "2026-08-10",
    rent_amount: 3200000,
    utility_amount: 250000,
    penalty_amount: 50000,
    total_amount: 3500000,
    paid_amount: 0,
    status: "unpaid",
    is_overdue: true,
    dunning_stage: 2,
    payments: [],
  },
];

const DEFAULT_STAFF = [
  {
    id: "st_1",
    name: "Admin Lewi House",
    email: "fauziealiakhmad@gmail.com",
    phone: "081200001111",
    role: "owner",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "st_2",
    name: "Slamet Riyadi",
    email: "slamet@lewihouse.com",
    phone: "081288889999",
    role: "staff",
    is_active: true,
    created_at: "2026-02-15T00:00:00Z",
  },
];

const DEFAULT_COMPLAINTS = [
  {
    id: "c_1",
    ticket_number: "TKT-202608-001",
    tenant_id: "t_204",
    tenant_name: "Budi Santoso",
    room_name: "K-204",
    category: "ac",
    priority: "high",
    title: "AC Kurang Dingin",
    description: "AC kamar 204 hembusan angin normal tapi suhu tidak turun dingin.",
    status: "in_progress",
    assigned_to: "Slamet Riyadi",
    created_at: "2026-08-20T08:00:00Z",
  },
  {
    id: "c_2",
    ticket_number: "TKT-202608-002",
    tenant_id: "t_101",
    tenant_name: "Andi Wijaya",
    room_name: "K-101",
    category: "plumbing",
    priority: "medium",
    title: "Keran Wastafel Menetes",
    description: "Keran air wastafel tidak bisa ditutup rapat.",
    status: "resolved",
    assigned_to: "Slamet Riyadi",
    created_at: "2026-08-18T09:00:00Z",
  },
];

const DEFAULT_TOKENS = [
  {
    id: "tk_1",
    pin: "849201",
    token_type: "permanent",
    tenant_id: "t_204",
    tenant_name: "Budi Santoso",
    room_name: "K-204",
    status: "active",
    valid_until: "2026-12-31T23:59:59Z",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "tk_2",
    pin: "591024",
    token_type: "guest",
    tenant_id: "t_201",
    tenant_name: "Citra Lestari",
    room_name: "K-201",
    status: "active",
    valid_until: "2026-08-30T23:59:59Z",
    created_at: "2026-08-24T10:00:00Z",
  },
];

const DEFAULT_AUDIT = [
  { id: "a_1", actor: "fauziealiakhmad@gmail.com", action: "LOGIN", entity: "user", entity_id: "usr_owner_1", at: new Date().toISOString(), detail: { name: "Admin Lewi House" } },
  { id: "a_2", actor: "fauziealiakhmad@gmail.com", action: "PAYMENT", entity: "bill", entity_id: "b_101", at: "2026-08-05T10:30:00Z", detail: { invoice: "INV-202608-K101", amount: 1950000 } },
  { id: "a_3", actor: "fauziealiakhmad@gmail.com", action: "MOVE_IN", entity: "tenant", entity_id: "t_204", at: "2026-01-01T00:00:00Z", detail: { name: "Budi Santoso", label: "K-204" } },
];

function getStored(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return def;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function handleMockApi(method, url, data) {
  const cleanUrl = url.replace(/^\/api/, "").replace(/^\//, "");

  // AUTH
  if (cleanUrl.startsWith("auth/login")) {
    const ident = (data?.identifier || data?.email || "").trim().toLowerCase();

    // Check tenant (e.g. 204 or budi)
    if (ident === "204" || ident.includes("budi") || ident.includes("tenant")) {
      const user = {
        id: "usr_tenant_204",
        email: "budi@lewihouse.com",
        phone: "081234567890",
        name: "Budi Santoso",
        role: "tenant",
        tenant_id: "t_204",
      };
      const token = "mock_jwt_tenant_" + Date.now();
      localStorage.setItem("lh_token", token);
      localStorage.setItem("lh_user", JSON.stringify(user));
      localStorage.setItem("lh_current_user", JSON.stringify(user));
      return { user, access_token: token };
    }

    // Default admin / owner
    const user = {
      id: "usr_owner_1",
      email: ident || "fauziealiakhmad@gmail.com",
      phone: "081200001111",
      name: "Admin Lewi House",
      role: "owner",
      tenant_id: null,
    };
    const token = "mock_jwt_owner_" + Date.now();
    localStorage.setItem("lh_token", token);
    localStorage.setItem("lh_user", JSON.stringify(user));
    localStorage.setItem("lh_current_user", JSON.stringify(user));
    return { user, access_token: token };
  }

  if (cleanUrl.startsWith("auth/me")) {
    const u = localStorage.getItem("lh_user") || localStorage.getItem("lh_current_user");
    if (u) {
      try {
        return JSON.parse(u);
      } catch {}
    }
    return {
      id: "usr_owner_1",
      email: "fauziealiakhmad@gmail.com",
      name: "Admin Lewi House",
      role: "owner",
    };
  }

  if (cleanUrl.startsWith("auth/logout")) {
    localStorage.removeItem("lh_user");
    localStorage.removeItem("lh_current_user");
    localStorage.removeItem("lh_token");
    return { ok: true };
  }

  // AUDIT LOGS
  if (cleanUrl.startsWith("audit")) {
    return getStored(STORAGE_KEYS.AUDIT, DEFAULT_AUDIT);
  }

  // DASHBOARD SUMMARY
  if (cleanUrl.startsWith("dashboard/summary")) {
    const rooms = getStored(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
    const tenants = getStored(STORAGE_KEYS.TENANTS, DEFAULT_TENANTS);
    const bills = getStored(STORAGE_KEYS.BILLS, DEFAULT_BILLS);
    const complaints = getStored(STORAGE_KEYS.COMPLAINTS, DEFAULT_COMPLAINTS);

    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const revenue = bills
      .filter((b) => b.status === "paid" || b.status === "partially_paid")
      .reduce((acc, b) => acc + (b.paid_amount || 0), 0);
    const unpaid = bills
      .filter((b) => b.status === "unpaid" || b.status === "partially_paid")
      .reduce((acc, b) => acc + ((b.total_amount || 0) - (b.paid_amount || 0)), 0);

    return {
      rooms_total: rooms.length,
      rooms_occupied: occupied,
      occupancy_rate: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0,
      tenants_active: tenants.filter((t) => t.status === "active").length,
      revenue_month: revenue,
      unpaid_amount: unpaid,
      pending_tickets: complaints.filter((c) => c.status === "in_progress" || c.status === "pending").length,
      rooms_by_status: {
        occupied: rooms.filter((r) => r.status === "occupied").length,
        available: rooms.filter((r) => r.status === "available").length,
        cleaning: rooms.filter((r) => r.status === "cleaning").length,
        maintenance: rooms.filter((r) => r.status === "maintenance").length,
        reserved: rooms.filter((r) => r.status === "reserved").length,
      },
    };
  }

  if (cleanUrl.startsWith("reports/monthly")) {
    return [
      { period: "2026-03", revenue: 6800000, occupancy_avg: 75 },
      { period: "2026-04", revenue: 7500000, occupancy_avg: 80 },
      { period: "2026-05", revenue: 8200000, occupancy_avg: 85 },
      { period: "2026-06", revenue: 7900000, occupancy_avg: 80 },
      { period: "2026-07", revenue: 8500000, occupancy_avg: 90 },
      { period: "2026-08", revenue: 7650000, occupancy_avg: 83 },
    ];
  }

  // ROOMS
  if (cleanUrl.startsWith("rooms")) {
    let rooms = getStored(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
    if (method === "get") return rooms;
    if (method === "post" && !cleanUrl.includes("/status")) {
      const newRoom = { id: "r_" + Date.now(), status: "available", ...data };
      rooms.push(newRoom);
      setStored(STORAGE_KEYS.ROOMS, rooms);
      return newRoom;
    }
    if (method === "put") {
      const id = cleanUrl.split("/")[1];
      rooms = rooms.map((r) => (r.id === id ? { ...r, ...data } : r));
      setStored(STORAGE_KEYS.ROOMS, rooms);
      return rooms.find((r) => r.id === id) || data;
    }
    if (method === "post" && cleanUrl.includes("/status")) {
      const id = cleanUrl.split("/")[1];
      rooms = rooms.map((r) => (r.id === id ? { ...r, status: data.status } : r));
      setStored(STORAGE_KEYS.ROOMS, rooms);
      return { ok: true, status: data.status };
    }
    if (method === "delete") {
      const id = cleanUrl.split("/")[1];
      rooms = rooms.filter((r) => r.id !== id);
      setStored(STORAGE_KEYS.ROOMS, rooms);
      return { ok: true };
    }
  }

  // TENANTS
  if (cleanUrl.startsWith("tenants")) {
    let tenants = getStored(STORAGE_KEYS.TENANTS, DEFAULT_TENANTS);
    if (method === "get") return tenants;
    if (method === "post" && !cleanUrl.includes("/move-in") && !cleanUrl.includes("/move-out")) {
      const newT = { id: "t_" + Date.now(), status: "active", ...data };
      tenants.push(newT);
      setStored(STORAGE_KEYS.TENANTS, tenants);
      return newT;
    }
    if (method === "put") {
      const id = cleanUrl.split("/")[1];
      tenants = tenants.map((t) => (t.id === id ? { ...t, ...data } : t));
      setStored(STORAGE_KEYS.TENANTS, tenants);
      return tenants.find((t) => t.id === id) || data;
    }
    if (method === "post" && cleanUrl.includes("/move-in")) {
      const id = cleanUrl.split("/")[1];
      tenants = tenants.map((t) => (t.id === id ? { ...t, status: "active" } : t));
      setStored(STORAGE_KEYS.TENANTS, tenants);
      return { ok: true };
    }
    if (method === "post" && cleanUrl.includes("/move-out")) {
      const id = cleanUrl.split("/")[1];
      tenants = tenants.map((t) => (t.id === id ? { ...t, status: "former" } : t));
      setStored(STORAGE_KEYS.TENANTS, tenants);
      return { ok: true, refund_amount: 1500000 };
    }
    if (method === "delete") {
      const id = cleanUrl.split("/")[1];
      tenants = tenants.filter((t) => t.id !== id);
      setStored(STORAGE_KEYS.TENANTS, tenants);
      return { ok: true };
    }
  }

  // BILLS
  if (cleanUrl.startsWith("bills")) {
    let bills = getStored(STORAGE_KEYS.BILLS, DEFAULT_BILLS);
    if (method === "get") return bills;
    if (method === "post" && cleanUrl.includes("/payments")) {
      const id = cleanUrl.split("/")[1];
      bills = bills.map((b) => {
        if (b.id === id) {
          const newPaid = (b.paid_amount || 0) + Number(data.amount || 0);
          const newStatus = newPaid >= (b.total_amount || 0) ? "paid" : "partially_paid";
          const newPayments = [
            ...(b.payments || []),
            { id: "p_" + Date.now(), amount: data.amount, method: data.method, paid_at: new Date().toISOString() },
          ];
          return { ...b, paid_amount: newPaid, status: newStatus, payments: newPayments };
        }
        return b;
      });
      setStored(STORAGE_KEYS.BILLS, bills);
      return { ok: true };
    }
    if (method === "post" && cleanUrl.includes("/generate")) {
      return { ok: true, count: 3 };
    }
    if (method === "post") {
      const newB = { id: "b_" + Date.now(), invoice_number: "INV-" + Date.now(), ...data };
      bills.push(newB);
      setStored(STORAGE_KEYS.BILLS, bills);
      return newB;
    }
    if (method === "put") {
      const id = cleanUrl.split("/")[1];
      bills = bills.map((b) => (b.id === id ? { ...b, ...data } : b));
      setStored(STORAGE_KEYS.BILLS, bills);
      return bills.find((b) => b.id === id) || data;
    }
    if (method === "delete") {
      const id = cleanUrl.split("/")[1];
      bills = bills.filter((b) => b.id !== id);
      setStored(STORAGE_KEYS.BILLS, bills);
      return { ok: true };
    }
  }

  // COMPLAINTS
  if (cleanUrl.startsWith("complaints")) {
    let complaints = getStored(STORAGE_KEYS.COMPLAINTS, DEFAULT_COMPLAINTS);
    if (method === "get") return complaints;
    if (method === "post" && cleanUrl.includes("/status")) {
      const id = cleanUrl.split("/")[1];
      complaints = complaints.map((c) => (c.id === id ? { ...c, status: data.status } : c));
      setStored(STORAGE_KEYS.COMPLAINTS, complaints);
      return { ok: true };
    }
    if (method === "post") {
      const newC = { id: "c_" + Date.now(), ticket_number: "TKT-" + Date.now().toString().slice(-4), ...data };
      complaints.push(newC);
      setStored(STORAGE_KEYS.COMPLAINTS, complaints);
      return newC;
    }
    if (method === "put") {
      const id = cleanUrl.split("/")[1];
      complaints = complaints.map((c) => (c.id === id ? { ...c, ...data } : c));
      setStored(STORAGE_KEYS.COMPLAINTS, complaints);
      return complaints.find((c) => c.id === id) || data;
    }
    if (method === "delete") {
      const id = cleanUrl.split("/")[1];
      complaints = complaints.filter((c) => c.id !== id);
      setStored(STORAGE_KEYS.COMPLAINTS, complaints);
      return { ok: true };
    }
  }

  // STAFF
  if (cleanUrl.startsWith("staff")) {
    let staff = getStored(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
    if (method === "get") return staff;
    if (method === "post" && !cleanUrl.includes("/reset-password")) {
      const newS = { id: "st_" + Date.now(), is_active: true, created_at: new Date().toISOString(), ...data };
      staff.push(newS);
      setStored(STORAGE_KEYS.STAFF, staff);
      return newS;
    }
    if (method === "put") {
      const id = cleanUrl.split("/")[1];
      staff = staff.map((s) => (s.id === id ? { ...s, ...data } : s));
      setStored(STORAGE_KEYS.STAFF, staff);
      return staff.find((s) => s.id === id) || data;
    }
    if (method === "delete") {
      const id = cleanUrl.split("/")[1];
      staff = staff.filter((s) => s.id !== id);
      setStored(STORAGE_KEYS.STAFF, staff);
      return { ok: true };
    }
    if (method === "post" && cleanUrl.includes("/reset-password")) {
      return { ok: true };
    }
  }

  // ACCESS TOKENS
  if (cleanUrl.startsWith("access-tokens")) {
    let tokens = getStored(STORAGE_KEYS.TOKENS, DEFAULT_TOKENS);
    if (method === "get") return tokens;
    if (method === "post" && cleanUrl.includes("/revoke")) {
      const id = cleanUrl.split("/")[1];
      tokens = tokens.map((tk) => (tk.id === id ? { ...tk, status: "revoked" } : tk));
      setStored(STORAGE_KEYS.TOKENS, tokens);
      return { ok: true };
    }
    if (method === "post") {
      const newTk = {
        id: "tk_" + Date.now(),
        pin: String(Math.floor(100000 + Math.random() * 900000)),
        status: "active",
        created_at: new Date().toISOString(),
        ...data,
      };
      tokens.push(newTk);
      setStored(STORAGE_KEYS.TOKENS, tokens);
      return newTk;
    }
  }

  // PORTAL ENDPOINTS
  if (cleanUrl.startsWith("portal/me")) {
    return {
      id: "t_204",
      name: "Budi Santoso",
      email: "budi@lewihouse.com",
      phone: "081234567890",
      room_name: "K-204",
      room_type: "vip",
      monthly_rent: 3200000,
      lease_start: "2026-01-01",
      lease_end: "2026-12-31",
      deposit_amount: 3200000,
    };
  }

  if (cleanUrl.startsWith("portal/bills")) {
    const bills = getStored(STORAGE_KEYS.BILLS, DEFAULT_BILLS);
    return bills.filter((b) => b.tenant_id === "t_204");
  }

  if (cleanUrl.startsWith("portal/tickets")) {
    const complaints = getStored(STORAGE_KEYS.COMPLAINTS, DEFAULT_COMPLAINTS);
    if (method === "get") return complaints.filter((c) => c.tenant_id === "t_204");
    if (method === "post") {
      const newC = {
        id: "c_" + Date.now(),
        ticket_number: "TKT-" + Date.now().toString().slice(-4),
        tenant_id: "t_204",
        tenant_name: "Budi Santoso",
        room_name: "K-204",
        status: "pending",
        created_at: new Date().toISOString(),
        ...data,
      };
      complaints.push(newC);
      setStored(STORAGE_KEYS.COMPLAINTS, complaints);
      return newC;
    }
  }

  if (cleanUrl.startsWith("portal/messages")) {
    if (method === "get") {
      return [
        { id: "m_1", sender_role: "tenant", text: "Halo admin, token listrik sudah terbit?", created_at: "2026-08-24T09:00:00Z" },
        { id: "m_2", sender_role: "admin", text: "Halo pak Budi, sudah otomatis terbit ya.", created_at: "2026-08-24T09:05:00Z" },
      ];
    }
    return { id: "m_" + Date.now(), sender_role: "tenant", text: data?.text, created_at: new Date().toISOString() };
  }

  if (cleanUrl.startsWith("portal/requests")) {
    return [];
  }

  // SYNC & SEED
  if (cleanUrl.startsWith("sync/status")) {
    return { status: "connected", project_id: "lewihouse", last_sync_at: new Date().toISOString() };
  }
  if (cleanUrl.startsWith("sync/firestore-full") || cleanUrl.startsWith("seed")) {
    setStored(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
    setStored(STORAGE_KEYS.TENANTS, DEFAULT_TENANTS);
    setStored(STORAGE_KEYS.BILLS, DEFAULT_BILLS);
    setStored(STORAGE_KEYS.COMPLAINTS, DEFAULT_COMPLAINTS);
    setStored(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
    setStored(STORAGE_KEYS.TOKENS, DEFAULT_TOKENS);
    return { ok: true, last_sync_at: new Date().toISOString() };
  }

  // CHAT
  if (cleanUrl.startsWith("chat/threads")) {
    return [
      { tenant_id: "t_204", tenant_name: "Budi Santoso", room_name: "K-204", unread: 1, last_message: "Terima kasih pak" },
    ];
  }
  if (cleanUrl.startsWith("chat/") && cleanUrl.includes("/messages")) {
    if (method === "get") {
      return [
        { id: "m_1", sender_role: "tenant", text: "Halo admin, token listrik sudah terbit?", created_at: "2026-08-24T09:00:00Z" },
        { id: "m_2", sender_role: "admin", text: "Halo pak Budi, sudah otomatis terbit di menu Akses ya.", created_at: "2026-08-24T09:05:00Z" },
      ];
    }
    return { id: "m_" + Date.now(), sender_role: "admin", text: data?.text, created_at: new Date().toISOString() };
  }


  if (cleanUrl.startsWith("push/vapid-key")) {
    return { public_key: "BMockPublicKeyForLewiHousePushNotifications2026" };
  }
  if (cleanUrl.startsWith("push/subscribe")) {
    return { ok: true };
  }

  return { ok: true };
}

