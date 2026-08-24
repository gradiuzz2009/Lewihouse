# Lewi House — Manajemen Kostan (PWA)

## Problem Statement
Aplikasi mobile untuk mengelola kostan (boarding house). Dibangun sebagai PWA mobile-first (React + FastAPI + MongoDB) karena environment Kubernetes hanya mendukung web. Kode Android asli dicadangkan di `_android_backup/`.

User kemudian mengunggah dokumen requirement lengkap (Lewi_House_End_to_End_Business_Process_Flows_Requirements.md) dan meminta SEMUA fase diimplementasikan sekaligus, plus Speed Dial FAB, autentikasi JWT, dan reset data seed.

## Bahasa
Selalu respon dalam Bahasa Indonesia.

## Kredensial
Lihat `/app/memory/test_credentials.md` — admin@lewihouse.com / lewi2026 (role: owner).

## Yang Sudah Diimplementasikan
### Sesi 1 (MVP)
- Dashboard, Kamar, Penghuni, Tagihan, Keluhan (CRUD dasar), desain boutique premium (emerald/bone, Playfair Display + Manrope), bottom nav mobile.

### Sesi 2 (Juni 2026) — Semua Fase Requirement Doc
- **Auth JWT**: login/logout/me/refresh, bcrypt, httpOnly cookies + Bearer (localStorage `lh_token`), brute-force lockout (5x gagal per email → 429 15 menit), semua /api/* terproteksi kecuali /api/auth/*. Admin di-seed dari .env.
- **Room State Machine**: 5 status (available/reserved/occupied/cleaning/maintenance) dengan matriks transisi tervalidasi (`POST /api/rooms/{id}/status`), tipe kamar (standard/deluxe/vip/studio), wing, kapasitas, deposit. Quick-action di kartu kamar.
- **Tenant KYC + Lease**: NIK, pekerjaan, email, kontak darurat (nama/hubungan/HP), lease_start/end, deposit. Status: pending_assignment (Calon) → active → former. Move-in (kamar→occupied + PIN otomatis terbit), Move-out (potongan deposit + refund + kamar→cleaning + token dicabut).
- **Keuangan**: invoice_number (INV-YYYYMM-K101), generate tagihan bulanan otomatis (`POST /api/bills/generate`), pembayaran multi-channel (QRIS/transfer/tunai) dengan pembayaran parsial (`POST /api/bills/{id}/payments`), status unpaid/partially_paid/paid + is_overdue & dunning_stage (1-3) derived, denda keterlambatan, ledger deposit settlement di tenant.
- **Maintenance Work Orders**: kategori (plumbing/electrical/ac/furniture/structural/internet/other), prioritas (+urgent), petugas/vendor, jadwal, biaya material+jasa, transisi status pending→in_progress→resolved→closed tervalidasi.
- **Access Token/PIN**: PIN 6 digit acak, tipe permanent/guest/vendor, masa berlaku, revoke, auto-issue saat move-in, auto-revoke saat move-out. Halaman /access.
- **Audit Trail**: semua aksi penting dicatat (login, payment, move-in/out, token, status). Halaman /activity.
- **Speed Dial FAB** di dashboard: Catat Pembayaran, Tambah Penghuni, Tiket Baru, Terbitkan Token (auto-open sheet via query param).
- **Galeri foto asli properti** (4 foto user: eksterior, lobi, deluxe, superior single) sebagai hero dashboard + galeri + foto kamar seed.
- Reset & reseed data selalu tersedia di dashboard (reseed-btn).

## Testing
- iteration_1.json: MVP E2E (lulus).
- iteration_2.json: 31 backend pytest + frontend E2E lengkap semua fase — 100% lulus. Semua temuan minor telah diperbaiki dan diverifikasi ulang via curl:
  - Lockout keyed per email (bekerja lewat ingress) ✓
  - partially_paid tidak lagi tertimpa "overdue" (flag is_overdue terpisah, filter Sebagian & Terlambat bekerja) ✓
  - DELETE mengembalikan 404 bila tidak ada; kamar occupied tidak bisa dihapus ✓
  - oid() wrapper untuk semua ObjectId dari input ✓
  - CORS regex untuk credentials ✓
  - Kontras hero + wrapping metrik Belum Bayar diperbaiki ✓
- Regression suite: /app/backend/tests/backend_test.py (menjalankannya me-reseed DB).

## Arsitektur
- `/app/backend/server.py` — seluruh backend (auth, rooms, tenants, bills, complaints/tickets, access-tokens, audit, dashboard, seed). ~1000 baris, kandidat refactor ke routers.
- `/app/frontend/src/pages/` — Login, Dashboard, Rooms, Tenants, Bills, Complaints (maintenance), Access, Activity.
- `/app/frontend/src/context/AuthContext.jsx`, `components/SpeedDial.jsx`, `components/ui.jsx` (+MoneyInput dengan format titik ribuan), `lib/api.js` (Bearer interceptor).
- Backend .env: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD.

## Backlog (Prioritas)
- **P1**: Tenant Portal — penghuni login sendiri, lihat tagihan & buat tiket (role tenant sudah disiapkan di JWT).
- **P1**: Payment gateway (Midtrans/Xendit) agar penghuni bayar langsung, auto-update status. WAJIB pakai integration_expert.
- **P2**: Kwitansi/receipt PDF ber-branding untuk tagihan lunas.
- **P2**: Notifikasi WhatsApp reminder jatuh tempo (dunning otomatis H-3/H+1/H+7).
- **P3**: Refactor server.py ke modular routers; pagination list endpoints; Literal enums di Pydantic; hash PIN token di server.
