// src/lib/onboardingTips.js

export const ONBOARDING_CONFIG = {
  // Admin & Owner Screens
  ADMIN_DASHBOARD: {
    screenKey: "ADMIN_DASHBOARD",
    title: "Executive Dashboard",
    role: "admin",
    quickTips: [
      "Pantau tingkat okupansi dan ringkasan kamar secara real-time.",
      "Periksa verifikasi bukti transfer sewa yang berstatus pending.",
      "Akses cepat ke ringkasan arus kas dan tiket keluhan aktif."
    ],
    helpUrl: "https://lewihouse.com/guide/dashboard"
  },
  ADMIN_ROOMS: {
    screenKey: "ADMIN_ROOMS",
    title: "Manajemen Kamar",
    role: "admin",
    quickTips: [
      "Filter kamar berdasarkan status (Tersedia, Terisi, Perbaikan, Kotor).",
      "Pindahkan atau checkout penghuni langsung dari kartu kamar.",
      "Klik nomor kamar untuk melihat detail fasilitas, foto, dan riwayat."
    ],
    helpUrl: "https://lewihouse.com/guide/rooms"
  },
  ADMIN_TENANTS: {
    screenKey: "ADMIN_TENANTS",
    title: "Data Penghuni",
    role: "admin",
    quickTips: [
      "Kelola profil, kontak darurat, dan data identitas (KTP/Passport).",
      "Cek status sewa aktif, deposit, dan tanggal jatuh tempo kontrak.",
      "Kirim pesan WhatsApp langsung atau atur kredensial akun portal."
    ],
    helpUrl: "https://lewihouse.com/guide/tenants"
  },
  ADMIN_BILLS: {
    screenKey: "ADMIN_BILLS",
    title: "Tagihan & Pembayaran",
    role: "admin",
    quickTips: [
      "Verifikasi bukti transfer bank atau pembayaran QRIS seketika.",
      "Kirim invoice dan pengingat jatuh tempo via WhatsApp dunning.",
      "Generate tagihan sewa bulanan dan pantau tunggakan penghuni."
    ],
    helpUrl: "https://lewihouse.com/guide/bills"
  },
  ADMIN_COMPLAINTS: {
    screenKey: "ADMIN_COMPLAINTS",
    title: "Tiket Perbaikan & Keluhan",
    role: "admin",
    quickTips: [
      "Tinjau laporan kerusakan beserta foto bukti dari penghuni.",
      "Tugaskan teknisi atau staff operasional untuk penanganan cepat.",
      "Unggah foto hasil perbaikan untuk menyelesaikan status tiket."
    ],
    helpUrl: "https://lewihouse.com/guide/complaints"
  },
  ADMIN_ACCESS: {
    screenKey: "ADMIN_ACCESS",
    title: "Akses & Smart Lock",
    role: "admin",
    quickTips: [
      "Generate passcode/PIN smart lock sementara untuk tamu atau teknisi.",
      "Pantau log akses pintu kamar dan pintu gerbang utama.",
      "Atur masa berlaku token akses sesuai jadwal sewa penghuni."
    ],
    helpUrl: "https://lewihouse.com/guide/access"
  },
  ADMIN_ACTIVITY: {
    screenKey: "ADMIN_ACTIVITY",
    title: "Riwayat Aktivitas",
    role: "admin",
    quickTips: [
      "Audit jejak perubahan data sewa, status kamar, dan billing.",
      "Filter riwayat aktivitas berdasarkan staf atau rentang tanggal.",
      "Deteksi anomali operasional secara transparan dan akurat."
    ],
    helpUrl: "https://lewihouse.com/guide/activity"
  },
  ADMIN_CHAT: {
    screenKey: "ADMIN_CHAT",
    title: "Chat & Komunikasi",
    role: "admin",
    quickTips: [
      "Kirim pesan langsung ke penghuni tanpa keluar aplikasi.",
      "Gunakan template pesan pengingat atau pengumuman bersama.",
      "Riwayat pesan tersimpan aman di server Lewi House."
    ],
    helpUrl: "https://lewihouse.com/guide/chat"
  },
  ADMIN_STAFF: {
    screenKey: "ADMIN_STAFF",
    title: "Manajemen Staff",
    role: "admin",
    quickTips: [
      "Atur peran akses untuk Admin, Teknisi, dan Cleaning Service.",
      "Pantau performa penanganan tiket keluhan per staff.",
      "Kelola akun dan kredensial login staf operasional."
    ],
    helpUrl: "https://lewihouse.com/guide/staff"
  },

  // Tenant Portal Screens
  TENANT_HOME: {
    screenKey: "TENANT_HOME",
    title: "Portal Penghuni",
    role: "tenant",
    quickTips: [
      "Cek nomor kamar, sisa masa sewa, dan meteran listrik Anda.",
      "Lihat ringkasan tagihan bulanan dan status pembayaran.",
      "Gunakan tombol aksi cepat untuk lapor perbaikan atau chat pengelola."
    ],
    helpUrl: "https://lewihouse.com/guide/tenant-portal"
  },
  TENANT_PAYMENTS: {
    screenKey: "TENANT_PAYMENTS",
    title: "Tagihan & Pembayaran",
    role: "tenant",
    quickTips: [
      "Periksa rincian tagihan sewa dan riwayat pembayaran lampau.",
      "Bayar otomatis lewat QRIS atau transfer rekening resmi BCA.",
      "Unggah struk/bukti transfer agar langsung diverifikasi oleh admin."
    ],
    helpUrl: "https://lewihouse.com/guide/tenant-bills"
  },
  TENANT_COMPLAINTS: {
    screenKey: "TENANT_COMPLAINTS",
    title: "Layanan Perbaikan Kos",
    role: "tenant",
    quickTips: [
      "Laporkan kerusakan fasilitas kamar dengan melampirkan foto.",
      "Pantau perkembangan penugasan teknisi secara berkala.",
      "Beri konfirmasi dan ulasan setelah perbaikan selesai tuntas."
    ],
    helpUrl: "https://lewihouse.com/guide/tenant-complaints"
  }
};

export const ALL_SCREENS = Object.keys(ONBOARDING_CONFIG);

export function getScreenKeyFromPath(pathname, role = "admin") {
  if (pathname === "/login") return null;

  if (pathname.startsWith("/portal")) {
    if (pathname.includes("/bills") || pathname.includes("/payment")) {
      return "TENANT_PAYMENTS";
    }
    if (pathname.includes("/complaints") || pathname.includes("/maintenance")) {
      return "TENANT_COMPLAINTS";
    }
    return "TENANT_HOME";
  }

  // Admin routes
  if (pathname === "/" || pathname === "/dashboard") return "ADMIN_DASHBOARD";
  if (pathname === "/rooms") return "ADMIN_ROOMS";
  if (pathname === "/tenants") return "ADMIN_TENANTS";
  if (pathname === "/bills") return "ADMIN_BILLS";
  if (pathname === "/complaints") return "ADMIN_COMPLAINTS";
  if (pathname === "/access") return "ADMIN_ACCESS";
  if (pathname === "/activity") return "ADMIN_ACTIVITY";
  if (pathname === "/chat") return "ADMIN_CHAT";
  if (pathname === "/staff") return "ADMIN_STAFF";

  return role === "tenant" ? "TENANT_HOME" : "ADMIN_DASHBOARD";
}
