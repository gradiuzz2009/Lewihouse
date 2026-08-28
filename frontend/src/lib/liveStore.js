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
  LEADS: "lh_live_leads",
};

const INITIAL_ROOMS = [
  // Lantai 1 (4 Kamar)
  {
    id: "r_101",
    name: "K-101",
    floor: "1",
    wing: "Utara",
    room_type: "tipe_a",
    capacity: 2,
    price: 2500000,
    deposit: 1000000,
    status: "occupied",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja & Kursi", "Lemari Pakaian Cermin", "Smart TV", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-10-deluxe-bed.webp",
    notes: "Tipe A (Exclusive / VIP) Lantai 1",
  },
  {
    id: "r_102",
    name: "K-102",
    floor: "1",
    wing: "Utara",
    room_type: "tipe_b",
    capacity: 1,
    price: 2000000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-15-superior-double.webp",
    notes: "Tipe B (Superior) Lantai 1",
  },
  {
    id: "r_103",
    name: "K-103",
    floor: "1",
    wing: "Selatan",
    room_type: "tipe_c",
    capacity: 1,
    price: 1600000,
    deposit: 500000,
    status: "occupied",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kerja Kompak", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-11-standard-single.webp",
    notes: "Tipe C (Single Standard) Lantai 1",
  },
  {
    id: "r_104",
    name: "K-104",
    floor: "1",
    wing: "Selatan",
    room_type: "tipe_c",
    capacity: 1,
    price: 1600000,
    deposit: 500000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kerja Kompak", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-13-standard-single.webp",
    notes: "Tipe C (Single Standard) Lantai 1",
  },

  // Lantai 2 (5 Kamar)
  {
    id: "r_201",
    name: "K-201",
    floor: "2",
    wing: "Utara",
    room_type: "tipe_a",
    capacity: 2,
    price: 2500000,
    deposit: 1000000,
    status: "occupied",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja & Kursi", "Lemari Pakaian Cermin", "Smart TV", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-02-suite-bedroom.webp",
    notes: "Tipe A (Exclusive / VIP) Lantai 2",
  },
  {
    id: "r_202",
    name: "K-202",
    floor: "2",
    wing: "Utara",
    room_type: "tipe_a",
    capacity: 2,
    price: 2500000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja & Kursi", "Lemari Pakaian Cermin", "Smart TV", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-09-suite-bedroom.webp",
    notes: "Tipe A (Exclusive / VIP) Lantai 2",
  },
  {
    id: "r_203",
    name: "K-203",
    floor: "2",
    wing: "Selatan",
    room_type: "tipe_b",
    capacity: 1,
    price: 2000000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-12-superior-single.webp",
    notes: "Tipe B (Superior) Lantai 2",
  },
  {
    id: "r_204",
    name: "K-204",
    floor: "2",
    wing: "Selatan",
    room_type: "tipe_b",
    capacity: 1,
    price: 2000000,
    deposit: 1000000,
    status: "occupied",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja & Kursi", "Lemari Pakaian", "TV", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-15-superior-double.webp",
    notes: "Tipe B (Superior) Lantai 2",
  },
  {
    id: "r_205",
    name: "K-205",
    floor: "2",
    wing: "Selatan",
    room_type: "tipe_c",
    capacity: 1,
    price: 1600000,
    deposit: 500000,
    status: "cleaning",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kerja Kompak", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-11-standard-single.webp",
    notes: "Tipe C (Single Standard) Lantai 2",
  },

  // Lantai 3 (4 Kamar)
  {
    id: "r_301",
    name: "K-301",
    floor: "3",
    wing: "Utara",
    room_type: "tipe_a",
    capacity: 2,
    price: 2500000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja & Kursi", "Lemari Pakaian Cermin", "Smart TV", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-10-deluxe-bed.webp",
    notes: "Tipe A (Exclusive / VIP) Lantai 3",
  },
  {
    id: "r_302",
    name: "K-302",
    floor: "3",
    wing: "Utara",
    room_type: "tipe_b",
    capacity: 1,
    price: 2000000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-14-deluxe-bedroom.webp",
    notes: "Tipe B (Superior) Lantai 3",
  },
  {
    id: "r_303",
    name: "K-303",
    floor: "3",
    wing: "Selatan",
    room_type: "tipe_b",
    capacity: 1,
    price: 2000000,
    deposit: 1000000,
    status: "occupied",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-15-superior-double.webp",
    notes: "Tipe B (Superior) Lantai 3",
  },
  {
    id: "r_304",
    name: "K-304",
    floor: "3",
    wing: "Selatan",
    room_type: "tipe_c",
    capacity: 1,
    price: 1600000,
    deposit: 500000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kerja Kompak", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-13-standard-single.webp",
    notes: "Tipe C (Single Standard) Lantai 3",
  },

  // Lantai 4 (4 Kamar)
  {
    id: "r_401",
    name: "K-401",
    floor: "4",
    wing: "Utara",
    room_type: "tipe_a",
    capacity: 2,
    price: 2600000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja & Kursi", "Lemari Pakaian Cermin", "Smart TV", "WiFi Cepat", "Akses Rooftop"],
    photo_url: "/gallery/agoda/agoda-02-suite-bedroom.webp",
    notes: "Tipe A (Exclusive / VIP) Lantai 4 — View Rooftop Terrace",
  },
  {
    id: "r_402",
    name: "K-402",
    floor: "4",
    wing: "Utara",
    room_type: "tipe_b",
    capacity: 1,
    price: 2100000,
    deposit: 1000000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat", "Akses Rooftop"],
    photo_url: "/gallery/agoda/agoda-12-superior-single.webp",
    notes: "Tipe B (Superior) Lantai 4 — Dekat Rooftop Workout Area",
  },
  {
    id: "r_403",
    name: "K-403",
    floor: "4",
    wing: "Selatan",
    room_type: "tipe_b",
    capacity: 1,
    price: 2100000,
    deposit: 1000000,
    status: "maintenance",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja & Kursi", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-14-deluxe-bedroom.webp",
    notes: "Tipe B (Superior) Lantai 4 — Pemeliharaan Rutin",
  },
  {
    id: "r_404",
    name: "K-404",
    floor: "4",
    wing: "Selatan",
    room_type: "tipe_c",
    capacity: 1,
    price: 1700000,
    deposit: 500000,
    status: "available",
    facilities: ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kerja Kompak", "Lemari Pakaian", "WiFi Cepat"],
    photo_url: "/gallery/agoda/agoda-11-standard-single.webp",
    notes: "Tipe C (Single Standard) Lantai 4",
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
    nik: "1271012345670789",
    occupation: "Software Engineer",
    emergency_name: "Siti Rahma",
    emergency_relation: "Istri",
    emergency_phone: "081298765432",
    lease_start: "2026-01-01",
    lease_end: "2026-12-31",
    deposit_amount: 1000000,
    monthly_rent: 2000000,
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
    nik: "1271023456780002",
    occupation: "Dokter Muda",
    emergency_name: "Hendra Wijaya",
    emergency_relation: "Ayah",
    emergency_phone: "081199887766",
    lease_start: "2026-02-01",
    lease_end: "2027-01-31",
    deposit_amount: 1000000,
    monthly_rent: 2500000,
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
  {
    id: "t_103",
    name: "Citra Dewi",
    phone: "081299887711",
    email: "citra@lewihouse.com",
    room_id: "r_103",
    room_name: "K-103",
    status: "active",
    nik: "1271034567890003",
    occupation: "Mahasiswi LP3I",
    emergency_name: "Dewi Sartika",
    emergency_relation: "Ibu",
    emergency_phone: "081299887700",
    lease_start: "2026-03-01",
    lease_end: "2027-02-28",
    deposit_amount: 500000,
    monthly_rent: 1600000,
    portal_password: "K103003",
    password_hash: simpleHash("Citra123456"),
    is_temporary_password: false,
    creation_source: "ADMIN_MANUAL",
    account_status: "ACTIVE",
    temporary_password_generated_at: "2026-03-01T00:00:00Z",
    password_updated_at: "2026-03-01T01:00:00Z",
    password_history: [],
  },
  {
    id: "t_303",
    name: "Farhan Pratama",
    phone: "081377889922",
    email: "farhan@lewihouse.com",
    room_id: "r_303",
    room_name: "K-303",
    status: "active",
    nik: "1271045678900004",
    occupation: "Banker",
    emergency_name: "Pratama Senior",
    emergency_relation: "Ayah",
    emergency_phone: "081377889900",
    lease_start: "2026-04-01",
    lease_end: "2027-03-31",
    deposit_amount: 1000000,
    monthly_rent: 2000000,
    portal_password: "K303004",
    password_hash: simpleHash("Farhan123456"),
    is_temporary_password: false,
    creation_source: "ADMIN_MANUAL",
    account_status: "ACTIVE",
    temporary_password_generated_at: "2026-04-01T00:00:00Z",
    password_updated_at: "2026-04-01T01:00:00Z",
    password_history: [],
  },
];

const INITIAL_LEADS = [
  {
    id: "lead_1",
    name: "Rian Pratama",
    phone: "081234567890",
    source: "Mamikos",
    room_id: "r_102",
    room_name: "K-102",
    room_type: "tipe_b",
    room_price: 2000000,
    expected_move_in: "2026-09-01",
    duration_months: 3,
    status: "INQUIRY_BARU", // INQUIRY_BARU, JADWAL_SURVEI, BOOKING_DP, KONVERSI_PENYEWA, BATAL
    notes: "Tanya ketersediaan parkir mobil & bawa hewan",
    created_at: "2026-08-28T07:30:00.000Z",
    survey_date: null,
    dp_amount: 0,
  },
  {
    id: "lead_2",
    name: "Siti Nurhaliza",
    phone: "081398765432",
    source: "Rukita",
    room_id: "r_104",
    room_name: "K-104",
    room_type: "tipe_c",
    room_price: 1600000,
    expected_move_in: "2026-09-05",
    duration_months: 6,
    status: "JADWAL_SURVEI",
    notes: "Survei unit lantai 1 pada hari Sabtu pukul 14:00 WIB",
    created_at: "2026-08-27T10:15:00.000Z",
    survey_date: "2026-08-30T14:00:00.000Z",
    dp_amount: 0,
  },
  {
    id: "lead_3",
    name: "Dimas Aditya",
    phone: "082155667788",
    source: "WhatsApp Langsung",
    room_id: "r_402",
    room_name: "K-402",
    room_type: "tipe_b",
    room_price: 2100000,
    expected_move_in: "2026-09-10",
    duration_months: 12,
    status: "BOOKING_DP",
    notes: "Sudah transfer tanda jadi DP Rp 500.000 via BCA",
    created_at: "2026-08-26T15:20:00.000Z",
    survey_date: "2026-08-27T11:00:00.000Z",
    dp_amount: 500000,
  },
  {
    id: "lead_4",
    name: "Nadia Putri",
    phone: "085211223344",
    source: "Instagram",
    room_id: "r_401",
    room_name: "K-401",
    room_type: "tipe_a",
    room_price: 2600000,
    expected_move_in: "2026-09-01",
    duration_months: 1,
    status: "INQUIRY_BARU",
    notes: "Tanya akses rooftop dan fasilitas Smart TV",
    created_at: "2026-08-28T06:00:00.000Z",
    survey_date: null,
    dp_amount: 0,
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
    id: "s_owner",
    name: "Ibu Amirta",
    email: "amirta@lewihouse.com",
    phone: "081262960211",
    role: "owner",
    position: "Pemilik Properti (Owner)",
    status: "active",
  },
  {
    id: "s_admin",
    name: "Mbak Rosmah",
    email: "admin@lewihouse.com",
    phone: "082168819722",
    role: "admin",
    position: "Admin Operasional & Front Desk",
    status: "active",
  },
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

  // 0. RESET / SEED
  if (clean === "seed" || clean.startsWith("seed")) {
    localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
    localStorage.setItem(KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
    localStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    localStorage.setItem(KEYS.TOKENS, JSON.stringify(INITIAL_TOKENS));
    return { ok: true, message: "Berhasil memuat data contoh Lewi House Medan (17 kamar)" };
  }

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
        has_completed_onboarding: Boolean(t?.has_completed_onboarding),
        last_tour_opened_at: t?.last_tour_opened_at || null,
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
        has_completed_onboarding: true,
      };
      const token = "live_jwt_staff_" + Date.now();
      localStorage.setItem("lh_token", token);
      localStorage.setItem("lh_user", JSON.stringify(user));
      return { user, access_token: token };
    }

    // Default Owner / Admin (Ibu Amirta / Mbak Rosmah)
    const isAdminRosmah = ident.includes("rosmah") || ident.includes("082168819722");
    const adminOnboardingDone = localStorage.getItem("lh_tour_admin_completed") === "true";
    const user = {
      id: isAdminRosmah ? "usr_admin_rosmah" : "usr_owner_amirta",
      email: ident || (isAdminRosmah ? "admin@lewihouse.com" : "amirta@lewihouse.com"),
      phone: isAdminRosmah ? "082168819722" : "081262960211",
      name: isAdminRosmah ? "Mbak Rosmah" : "Ibu Amirta",
      role: isAdminRosmah ? "admin" : "owner",
      tenant_id: null,
      has_completed_onboarding: adminOnboardingDone,
      last_tour_opened_at: null,
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
        const u = JSON.parse(raw);
        if (u.role === "admin" || u.role === "owner") {
          u.has_completed_onboarding = localStorage.getItem("lh_tour_admin_completed") === "true" || Boolean(u.has_completed_onboarding);
        }
        return u;
      } catch {}
    }
    const token = localStorage.getItem("lh_token");
    if (token) {
      return {
        id: "usr_owner_1",
        email: "admin@lewihouse.com",
        name: "Admin Lewi House",
        role: "owner",
        has_completed_onboarding: localStorage.getItem("lh_tour_admin_completed") === "true",
      };
    }
    throw { response: { status: 401, data: { detail: "Unauthenticated" } } };
  }

  // 2.1 COMPLETE ONBOARDING
  if (clean.startsWith("auth/complete-onboarding") || clean.startsWith("users/onboarding-status")) {
    const now = new Date().toISOString();
    const raw = localStorage.getItem("lh_user");
    let u = {};
    if (raw) {
      try {
        u = JSON.parse(raw);
      } catch {}
    }
    u.has_completed_onboarding = true;
    u.last_tour_opened_at = now;
    localStorage.setItem("lh_user", JSON.stringify(u));
    if (u.role === "tenant") {
      localStorage.setItem("lh_tour_tenant_completed", "true");
    } else {
      localStorage.setItem("lh_tour_admin_completed", "true");
    }
    return { ok: true, has_completed_onboarding: true, last_tour_opened_at: now };
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
    if (method === "post" && clean.includes("/clear-resident")) {
      const id = clean.split("/")[1];
      rooms = rooms.map((r) => (r.id === id ? { ...r, status: "cleaning", tenant_id: null, updated_at: new Date().toISOString() } : r));
      setStore(KEYS.ROOMS, rooms);
      let tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
      tenants = tenants.map((t) => (t.room_id === id ? { ...t, room_id: null, room_name: null, status: "former", updated_at: new Date().toISOString() } : t));
      setStore(KEYS.TENANTS, tenants);
      return { ok: true, message: "Kamar berhasil dikosongkan dan dialihkan ke tahap pembersihan (CLEANING)" };
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

  // 6.1 LEADS & POTENTIAL TENANTS (MANUAL & EXTERNAL 3RD-PARTY INTAKE)
  if (clean.startsWith("leads")) {
    let leads = getStore(KEYS.LEADS, INITIAL_LEADS);
    if (!Array.isArray(leads)) leads = INITIAL_LEADS;
    let rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
    if (!Array.isArray(rooms)) rooms = INITIAL_ROOMS;
    let tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
    if (!Array.isArray(tenants)) tenants = INITIAL_TENANTS;

    // Convert Lead to Active Tenant (One-Click Conversion)
    if (clean.includes("/convert") && method === "post") {
      const leadId = clean.split("/")[1];
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) {
        throw { response: { status: 404, data: { detail: "Calon penyewa tidak ditemukan" } } };
      }

      const targetRoomId = body.room_id || lead.room_id;
      const targetRoom = rooms.find((r) => r.id === targetRoomId);
      const roomNameVal = targetRoom ? targetRoom.name : lead.room_name || "K-102";

      // Generate Auto-Credentials
      const existingUsernames = tenants.map((t) => t.username).filter(Boolean);
      const autoUsername = body.username || generateTenantUsername(roomNameVal, lead.name, existingUsernames);
      const autoTempPw = body.temporary_password || generateTemporaryPassword(roomNameVal, body.nik || "123");
      const tempHash = simpleHash(autoTempPw);

      const newTenant = {
        id: "t_" + Date.now(),
        name: lead.name,
        phone: lead.phone,
        nik: body.nik || "",
        email: body.email || "",
        username: autoUsername,
        room_id: targetRoomId || null,
        room_name: roomNameVal,
        status: "active",
        occupation: body.occupation || "Penyewa",
        emergency_name: body.emergency_name || "",
        emergency_relation: body.emergency_relation || "",
        emergency_phone: body.emergency_phone || "",
        lease_start: body.lease_start || lead.expected_move_in || new Date().toISOString().slice(0, 10),
        lease_end: body.lease_end || "",
        monthly_rent: targetRoom ? targetRoom.price : (lead.room_price || 2000000),
        deposit: targetRoom ? targetRoom.deposit : 1000000,
        deposit_amount: targetRoom ? targetRoom.deposit : 1000000,
        portal_password: autoTempPw,
        password_hash: tempHash,
        is_temporary_password: true,
        creation_source: `LEAD_CONVERSION_${(lead.source || "MANUAL").toUpperCase().replace(/\s+/g, "_")}`,
        account_status: "ACTIVE_FORCE_RESET",
        temporary_password_generated_at: new Date().toISOString(),
        password_updated_at: null,
        password_history: [{ hash: tempHash, created_at: new Date().toISOString() }],
        notes: `Dikonversi dari prospek ${lead.source || "Manual"}. Catatan awal: ${lead.notes || "-"}`,
      };

      tenants.push(newTenant);
      setStore(KEYS.TENANTS, tenants);

      // Update room to OCCUPIED
      if (targetRoomId) {
        rooms = rooms.map((r) => (r.id === targetRoomId ? { ...r, status: "occupied" } : r));
        setStore(KEYS.ROOMS, rooms);
      }

      // Update lead status to KONVERSI_PENYEWA
      leads = leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: "KONVERSI_PENYEWA",
              converted_to_tenant_id: newTenant.id,
              converted_at: new Date().toISOString(),
            }
          : l
      );
      setStore(KEYS.LEADS, leads);

      return {
        ok: true,
        message: `Calon penyewa ${lead.name} berhasil dikonversi menjadi penyewa resmi kamar ${roomNameVal}`,
        tenant: newTenant,
        lead: leads.find((l) => l.id === leadId),
      };
    }

    // Sync external listing simulation (Mamikos/Rukita)
    if (clean.includes("/sync-external") && method === "post") {
      const sampleNames = ["Aris Setiawan", "Clara Veronica", "Rizky Ramadhan", "Mega Lestari"];
      const sampleSources = ["Mamikos", "Rukita", "OLX"];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomSource = sampleSources[Math.floor(Math.random() * sampleSources.length)];
      const randomRoom = rooms.find((r) => r.status === "available") || rooms[0];

      const newSimulatedLead = {
        id: "lead_" + Date.now(),
        name: randomName,
        phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: randomSource,
        room_id: randomRoom ? randomRoom.id : "r_102",
        room_name: randomRoom ? randomRoom.name : "K-102",
        room_type: randomRoom ? randomRoom.room_type : "tipe_b",
        room_price: randomRoom ? randomRoom.price : 2000000,
        expected_move_in: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
        duration_months: 3,
        status: "INQUIRY_BARU",
        notes: `Inquiry otomatis masuk dari listing terintegrasi ${randomSource}.`,
        created_at: new Date().toISOString(),
        survey_date: null,
        dp_amount: 0,
      };

      leads.unshift(newSimulatedLead);
      setStore(KEYS.LEADS, leads);
      return { ok: true, message: `Sinkronisasi selesai! 1 inquiry baru dari ${randomSource} ditambahkan.`, lead: newSimulatedLead };
    }

    if (method === "get") {
      const id = clean.split("/")[1];
      if (id && id !== "leads") {
        const found = leads.find((l) => l.id === id);
        if (!found) throw { response: { status: 404, data: { detail: "Lead tidak ditemukan" } } };
        return found;
      }
      return leads;
    }

    if (method === "post") {
      if (!body.name || !body.phone) {
        throw { response: { status: 400, data: { detail: "Nama lengkap dan nomor WhatsApp wajib diisi" } } };
      }
      const targetRoom = rooms.find((r) => r.id === body.room_id);
      const newLead = {
        id: "lead_" + Date.now(),
        name: body.name,
        phone: body.phone,
        source: body.source || "Mamikos",
        room_id: body.room_id || null,
        room_name: targetRoom ? targetRoom.name : body.room_name || "-",
        room_type: targetRoom ? targetRoom.room_type : body.room_type || "tipe_b",
        room_price: targetRoom ? targetRoom.price : body.room_price || 2000000,
        expected_move_in: body.expected_move_in || "",
        duration_months: Number(body.duration_months) || 1,
        status: body.status || "INQUIRY_BARU",
        notes: body.notes || "",
        created_at: new Date().toISOString(),
        survey_date: body.survey_date || null,
        dp_amount: Number(body.dp_amount) || 0,
        ...body,
      };
      leads.unshift(newLead);
      setStore(KEYS.LEADS, leads);
      return newLead;
    }

    if (method === "put") {
      const id = clean.split("/")[1];
      let targetRoom = null;
      if (body.room_id) {
        targetRoom = rooms.find((r) => r.id === body.room_id);
      }
      leads = leads.map((l) => {
        if (l.id === id) {
          return {
            ...l,
            ...body,
            room_name: targetRoom ? targetRoom.name : body.room_name || l.room_name,
            room_price: targetRoom ? targetRoom.price : body.room_price || l.room_price,
            updated_at: new Date().toISOString(),
          };
        }
        return l;
      });
      setStore(KEYS.LEADS, leads);
      return leads.find((l) => l.id === id) || body;
    }

    if (method === "delete") {
      const id = clean.split("/")[1];
      leads = leads.filter((l) => l.id !== id);
      setStore(KEYS.LEADS, leads);
      return { ok: true };
    }
  }

  // 7. BILLS & REMINDERS
  if (clean.startsWith("bills") || clean.startsWith("portal/bills") || clean.startsWith("reminders")) {
    let bills = getStore(KEYS.BILLS, INITIAL_BILLS);
    if (!Array.isArray(bills)) bills = INITIAL_BILLS;

    if (clean.includes("/receipt")) {
      const bid = clean.split("/")[1] || clean.split("/")[2];
      const b = bills.find((x) => x.id === bid) || bills[0] || INITIAL_BILLS[0];
      return {
        id: b.id,
        invoice_number: b.invoice_number || "INV-202608-K204-001",
        period: b.period || "2026-08",
        due_date: b.due_date || "2026-08-31",
        status: b.status || "unpaid",
        room_unit: b.room_unit || "K-204",
        resident_name: b.resident_name || "Budi Santoso",
        total: b.total || b.total_amount || 2000000,
        amount_paid: b.amount_paid || b.paid_amount || 0,
        paid_amount: b.paid_amount || b.amount_paid || 0,
        items: b.items || [
          { name: `Sewa Kamar (${b.room_unit || "K-204"})`, amount: b.total || b.total_amount || 2000000, category: "rent" },
        ],
        payments: b.payments || [],
        created_at: b.created_at || new Date().toISOString(),
      };
    }

    if (clean.includes("/whatsapp-link")) {
      const bid = clean.split("/")[1];
      const b = bills.find((x) => x.id === bid) || bills[0];
      const amountFmt = (b?.total || 2000000).toLocaleString("id-ID");
      const url = `https://wa.me/6281262960211?text=Halo%20${encodeURIComponent(b?.resident_name || "Penghuni")},%20tagihan%20sewa%20kamar%20${encodeURIComponent(b?.room_unit || "Lewi House")}%20sebesar%20Rp%20${encodeURIComponent(amountFmt)}%20sudah%20diterbitkan.`;
      return { whatsapp_url: url };
    }

    if (clean.includes("/payments") && method === "post") {
      const bid = clean.split("/")[1];
      const amt = Number(body.amount) || 0;
      let updatedBill = null;
      bills = bills.map((b) => {
        if (b.id === bid) {
          const newPaid = (b.amount_paid || b.paid_amount || 0) + amt;
          const tot = b.total || b.total_amount || 0;
          const newStatus = newPaid >= tot ? "PAID" : "PARTIALLY_PAID";
          const pymts = Array.isArray(b.payments) ? [...b.payments] : [];
          pymts.push({
            id: "pay_" + Date.now(),
            amount: amt,
            method: body.method || "BANK_TRANSFER",
            reference: body.reference || null,
            created_at: new Date().toISOString(),
          });
          updatedBill = {
            ...b,
            amount_paid: newPaid,
            paid_amount: newPaid,
            status: newStatus,
            payments: pymts,
            updated_at: new Date().toISOString(),
          };
          return updatedBill;
        }
        return b;
      });
      setStore(KEYS.BILLS, bills);
      return updatedBill || { ok: true };
    }

    if (clean.includes("/simulate-payment") || (clean.startsWith("portal/bills") && clean.includes("/pay"))) {
      const bid = clean.split("/")[1] || clean.split("/")[2];
      let updatedBill = null;
      bills = bills.map((b) => {
        if (b.id === bid || !bid) {
          const tot = b.total || b.total_amount || 2000000;
          updatedBill = {
            ...b,
            amount_paid: tot,
            paid_amount: tot,
            status: "PAID",
            updated_at: new Date().toISOString(),
          };
          return updatedBill;
        }
        return b;
      });
      setStore(KEYS.BILLS, bills);
      return updatedBill || bills[0];
    }

    if (clean.startsWith("bills/prorata-transfer")) {
      const invNum = `INV-PRORATA-${Date.now().toString().slice(-4)}`;
      return { ok: true, invoice_number: invNum };
    }

    if (clean.startsWith("bills/generate")) {
      return { ok: true, count: 4, generated: [] };
    }

    if (clean.startsWith("reminders/dunning-list")) {
      return [];
    }

    if (clean.startsWith("reminders/send-whatsapp-batch")) {
      return { ok: true, count: 0 };
    }

    if (clean.startsWith("bills/export")) {
      return "Invoice,Periode,Kamar,Penghuni,Total,Status\nINV-01,2026-08,K-204,Budi Santoso,2000000,UNPAID\n";
    }

    if (clean.includes("/cancel") && method === "post") {
      const bid = clean.split("/")[1];
      let updatedBill = null;
      bills = bills.map((b) => {
        if (b.id === bid) {
          updatedBill = {
            ...b,
            status: "CANCELLED",
            cancellation_reason: body?.reason || body?.cancellation_reason || "Dibatalkan oleh Admin",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return updatedBill;
        }
        return b;
      });
      setStore(KEYS.BILLS, bills);
      return updatedBill || { ok: true, status: "CANCELLED" };
    }

    if (method === "put") {
      const bid = clean.split("/")[1];
      let updatedBill = null;
      bills = bills.map((b) => {
        if (b.id === bid) {
          const tot = Array.isArray(body.items)
            ? body.items.reduce((sum, it) => sum + Number(it.amount || 0), 0)
            : Number(body.total || b.total || 0);
          updatedBill = {
            ...b,
            ...body,
            total: tot,
            total_amount: tot,
            updated_at: new Date().toISOString(),
          };
          return updatedBill;
        }
        return b;
      });
      setStore(KEYS.BILLS, bills);
      return updatedBill || body;
    }

    if (method === "delete") {
      const bid = clean.split("/")[1];
      bills = bills.filter((b) => b.id !== bid);
      setStore(KEYS.BILLS, bills);
      return { ok: true };
    }

    if (method === "get") return bills;

    if (method === "post") {
      const rooms = getStore(KEYS.ROOMS, INITIAL_ROOMS);
      const tenants = getStore(KEYS.TENANTS, INITIAL_TENANTS);
      const tenantObj = tenants.find((t) => t.id === body.tenant_id);
      const roomObj = rooms.find((r) => r.id === (body.room_id || tenantObj?.room_id));
      const roomNameVal = roomObj?.name || tenantObj?.room_name || "GEN";
      const p = body.period || new Date().toISOString().slice(0, 7);
      const [year, month] = p.split("-");
      const invSeq = String(bills.length + 1).padStart(4, "0");
      const invoiceNumber = `INV/${year}${month}/${roomNameVal.replace(/\s+/g, "")}/${invSeq}`;
      const tot = Array.isArray(body.items)
        ? body.items.reduce((sum, it) => sum + Number(it.amount || 0), 0)
        : Number(body.total || 0);

      const newB = {
        id: "b_" + Date.now(),
        invoice_number: invoiceNumber,
        room_unit: roomNameVal,
        resident_name: tenantObj?.name || "Penghuni",
        status: body.status || "UNPAID",
        total: tot,
        total_amount: tot,
        paid_amount: 0,
        amount_paid: 0,
        created_at: new Date().toISOString(),
        ...body,
      };
      bills.unshift(newB);
      setStore(KEYS.BILLS, bills);
      return newB;
    }
  }

  // 8. ACCESS TOKENS
  if (clean.startsWith("access-tokens") || clean.startsWith("access")) {
    let tokens = getStore(KEYS.TOKENS, INITIAL_TOKENS);
    if (!Array.isArray(tokens)) tokens = INITIAL_TOKENS;

    if (method === "get") return tokens;

    if (method === "post" && clean.includes("/revoke")) {
      const id = clean.split("/")[1];
      tokens = tokens.map((t) => (t.id === id ? { ...t, status: "revoked" } : t));
      setStore(KEYS.TOKENS, tokens);
      return { ok: true, status: "revoked" };
    }

    if (method === "post") {
      const newTok = {
        id: "tok_" + Date.now(),
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        status: "active",
        created_at: new Date().toISOString(),
        ...body,
      };
      tokens.unshift(newTok);
      setStore(KEYS.TOKENS, tokens);
      return newTok;
    }

    if (method === "delete") {
      const id = clean.split("/")[1];
      tokens = tokens.filter((t) => t.id !== id);
      setStore(KEYS.TOKENS, tokens);
      return { ok: true };
    }
  }

  // 9. STAFF & SYNC
  if (clean.startsWith("sync/status")) {
    return {
      status: "connected",
      last_sync_at: new Date().toISOString(),
      stats: { total_rooms: 17, tenants: 4, bills: 4 },
    };
  }

  if (clean.startsWith("sync/firestore-full")) {
    return {
      ok: true,
      last_sync_at: new Date().toISOString(),
      stats: { rooms: 17, tenants: 4, bills: 4, staff: 3 },
    };
  }

  if (clean.startsWith("push/vapid-key")) {
    return { vapid_public_key: "BK_LEWI_HOUSE_MOCK_VAPID_KEY_2026_MEDAN_PETISAH" };
  }

  if (clean.startsWith("push/subscribe")) {
    return { ok: true };
  }

  if (clean.startsWith("staff")) {
    let staff = getStore(KEYS.STAFF, INITIAL_STAFF);
    if (!Array.isArray(staff)) staff = INITIAL_STAFF;

    if (clean.includes("/reset-password") && method === "post") {
      return { ok: true, password: "LewiPass2026!#" };
    }

    if (method === "get") return staff;

    if (method === "post") {
      const newS = { id: "s_" + Date.now(), status: "active", created_at: new Date().toISOString(), ...body };
      staff.push(newS);
      setStore(KEYS.STAFF, staff);
      return newS;
    }

    if (method === "put") {
      const id = clean.split("/")[1];
      staff = staff.map((s) => (s.id === id ? { ...s, ...body } : s));
      setStore(KEYS.STAFF, staff);
      return staff.find((s) => s.id === id) || body;
    }

    if (method === "delete") {
      const id = clean.split("/")[1];
      staff = staff.filter((s) => s.id !== id);
      setStore(KEYS.STAFF, staff);
      return { ok: true };
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

  // Auth Onboarding
  if (clean.startsWith("auth/complete-onboarding")) {
    const currUser = JSON.parse(localStorage.getItem("lh_user") || "{}");
    currUser.has_completed_onboarding = true;
    localStorage.setItem("lh_user", JSON.stringify(currUser));
    return { ok: true, has_completed_onboarding: true };
  }

  // Notifications
  if (clean.startsWith("notifications/unread-count")) {
    let notifs = getStore("lh_live_notifications", null);
    if (!notifs) notifs = [];
    const count = notifs.filter((n) => !n.read && !n.is_read).length;
    return { notifications: count, chat: 0, total: count };
  }

  if (clean.startsWith("notifications/read-all")) {
    let notifs = getStore("lh_live_notifications", []);
    notifs = notifs.map((n) => ({ ...n, read: true, is_read: true }));
    setStore("lh_live_notifications", notifs);
    return { ok: true };
  }

  if (clean.includes("notifications/") && clean.endsWith("/read")) {
    const id = clean.split("/")[1];
    let notifs = getStore("lh_live_notifications", []);
    notifs = notifs.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n));
    setStore("lh_live_notifications", notifs);
    return { ok: true };
  }

  if (clean.startsWith("notifications")) {
    let notifs = getStore("lh_live_notifications", [
      {
        id: "notif_1",
        module: "BILLING",
        event_type: "INVOICE_GENERATED",
        title: "Invoice Sewa Agustus 2026 Terbit 💳",
        message: "Tagihan sewa kamar K-204 sebesar Rp 2.450.000 telah diterbitkan. Jatuh tempo: 5 September 2026.",
        body: "Tagihan sewa kamar K-204 sebesar Rp 2.450.000 telah diterbitkan.",
        action_url: "/portal/bills",
        room_unit: "K-204",
        urgency: "info",
        read: false,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "notif_2",
        module: "MAINTENANCE",
        event_type: "TICKET_RESOLVED",
        title: "Tiket #102: Selesai Diperbaiki 🛠️",
        message: "Laporan keluhan wastafel bocor telah diselesaikan oleh teknisi.",
        body: "Laporan keluhan wastafel bocor telah diselesaikan.",
        action_url: "/portal/tickets",
        room_unit: "K-204",
        urgency: "info",
        read: false,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "notif_3",
        module: "ELECTRICITY",
        event_type: "ELECTRICITY_RECORDED",
        title: "⚡ Pencatatan Meteran Listrik",
        message: "Pencatatan meteran listrik bulan ini telah selesai (132.5 kWh).",
        body: "Pencatatan meteran listrik bulan ini telah selesai (132.5 kWh).",
        action_url: "/portal/bills",
        room_unit: "K-204",
        urgency: "info",
        read: true,
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "notif_4",
        module: "ANNOUNCEMENT",
        event_type: "ANNOUNCEMENT_BROADCAST",
        title: "📢 Maintenance Pompa Air Besok Pukul 09:00",
        message: "Pembersihan tangki dan pemeliharaan pompa air utama pada hari Sabtu pukul 09:00 - 11:00 WIB.",
        body: "Pembersihan tangki dan pemeliharaan pompa air utama pada hari Sabtu.",
        action_url: "/portal",
        room_unit: "Semua",
        urgency: "warning",
        read: true,
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    ]);
    if (!Array.isArray(notifs)) notifs = [];
    setStore("lh_live_notifications", notifs);
    return notifs;
  }

  // Activity Feed for Dashboard
  if (clean.startsWith("activity/feed")) {
    return [
      {
        id: "feed_1",
        module: "BILLING",
        event_type: "PAYMENT_SUBMITTED",
        room_unit: "Unit 204",
        title: "Pembayaran Masuk Rp 2.450.000",
        message: "Penghuni Unit 204 mengunggah bukti bayar transfer BCA.",
        action_url: "/bills",
        urgency: "warning",
        actor: "Ali (Penghuni)",
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: "feed_2",
        module: "MAINTENANCE",
        event_type: "TICKET_CREATED",
        room_unit: "Unit 108",
        title: "Laporan Baru: AC Tidak Dingin",
        message: "Penghuni Unit 108 melaporkan AC tidak dingin dan perlu cuci freon.",
        action_url: "/complaints",
        urgency: "urgent",
        actor: "Arya Wibowo",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "feed_3",
        module: "AUTH",
        event_type: "PASSWORD_CHANGED",
        room_unit: "Unit 301",
        title: "Force Reset Password Selesai",
        message: "Penghuni Unit 301 memperbarui password mandiri.",
        action_url: "/tenants",
        urgency: "info",
        actor: "System Security",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "feed_4",
        module: "ROOM",
        event_type: "ROOM_STATUS",
        room_unit: "Unit 102",
        title: "Status Kamar Diperbarui",
        message: "Status Kamar K-102 diubah menjadi CLEANING.",
        action_url: "/rooms",
        urgency: "info",
        actor: "Admin Lewi House",
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ];
  }

  // Activity Logs & Audit Hub
  if (clean.startsWith("activity/logs") || clean.startsWith("activity") || clean.startsWith("audit")) {
    const rawLogs = [
      {
        id: "log_1",
        module: "BILLING",
        event_type: "PAYMENT_SUBMITTED",
        room_unit: "204",
        actor: "Ali (Penghuni)",
        title: "Unggah Bukti Bayar",
        message: "Pembayaran invoice INV-8821 sebesar Rp 2.450.000 via Transfer Bank BCA.",
        urgency: "warning",
        action_url: "/bills",
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: "log_2",
        module: "MAINTENANCE",
        event_type: "TICKET_CREATED",
        room_unit: "108",
        actor: "Arya Wibowo",
        title: "Tiket Baru Diajukan",
        message: "Keluhan AC tidak dingin dan mengeluarkan bunyi bising.",
        urgency: "urgent",
        action_url: "/complaints",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "log_3",
        module: "AUTH",
        event_type: "IN_APP_CHANGE_PASSWORD",
        room_unit: "301",
        actor: "Sinta Dewi",
        title: "Ganti Password Mandiri",
        message: "Password akun berhasil dirotasi sesuai standar keamanan.",
        urgency: "info",
        action_url: "/tenants",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "log_4",
        module: "ROOM",
        event_type: "ROOM_TRANSFER",
        room_unit: "204",
        actor: "Admin Lewi House",
        title: "Pindah Unit Kamar",
        message: "Transfer penghuni dari K-101 ke K-204 berhasil diproses.",
        urgency: "info",
        action_url: "/rooms",
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: "log_5",
        module: "ELECTRICITY",
        event_type: "METER_RECORDED",
        room_unit: "204",
        actor: "Admin Lewi House",
        title: "Pencatatan Meteran",
        message: "Meteran listrik K-204 dicatat 2890.0 kWh (Pemakaian 250 kWh).",
        urgency: "warning",
        action_url: "/bills",
        created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
      {
        id: "log_6",
        module: "ANNOUNCEMENT",
        event_type: "ANNOUNCEMENT_BROADCAST",
        room_unit: "Semua",
        actor: "Admin Lewi House",
        title: "Broadcast Pengumuman",
        message: "Maintenance pompa air utama disiarkan ke seluruh tenant.",
        urgency: "info",
        action_url: "/activity",
        created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
        at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      },
    ];

    if (clean.startsWith("activity/logs")) {
      return { total: rawLogs.length, logs: rawLogs };
    }
    return rawLogs;
  }

  if (clean.startsWith("announcements/broadcast") && method === "post") {
    const notifs = getStore("lh_live_notifications", []);
    const newNotif = {
      id: "ann_" + Date.now(),
      module: "ANNOUNCEMENT",
      event_type: "ANNOUNCEMENT_BROADCAST",
      title: `📢 ${body.title || "Pengumuman Baru"}`,
      message: body.message || "",
      body: body.message || "",
      action_url: "/portal",
      room_unit: "Semua",
      urgency: body.urgency || "info",
      read: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    setStore("lh_live_notifications", notifs);
    return { ok: true, id: newNotif.id, message: "Pengumuman berhasil disiarkan" };
  }

  if (clean.startsWith("electricity/readings")) {
    if (method === "post") {
      return { ok: true, id: "elec_" + Date.now(), usage_kwh: 120.0 };
    }
    return [
      {
        id: "el_1",
        room_id: "r_204",
        room_name: "K-204",
        meter_reading: 2890.0,
        previous_reading: 2640.0,
        usage_kwh: 250.0,
        period: "2026-08",
        recorded_by: "Admin",
        created_at: new Date().toISOString(),
      },
    ];
  }

  return { ok: true };
}
