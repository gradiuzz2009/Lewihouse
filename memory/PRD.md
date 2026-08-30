# Lewi House Medan — Manajemen Kosan & Guesthouse Syariah (PWA)

## Problem Statement & Overview Properti
Aplikasi mobile & web untuk mengelola properti **Lewi House Medan** (terdaftar sebagai **Lewi House Syariah** / **Kost Lewi House**), sebuah akomodasi *hybrid* di Kota Medan yang menggabungkan:
1. **Kost Eksklusif (Campur)**: Sewa bulanan dan mingguan untuk mahasiswa, profesional pria/wanita, dan tamu long-stay (terdaftar di Mamikos & IdKos).
2. **Guesthouse / Budget Hotel Syariah**: Menginap harian jangka pendek sesuai kebijakan Syariah (terdaftar di Traveloka, Tiket.com, Agoda, KKday).

- **Lokasi**: Jl. Sei Bahkapuran No. 16A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119.
- **Kontak / Resepsionis 24 Jam**: +62 812-6296-0211.
- **Ukuran Properti**: 4 Lantai, total 17 Kamar, dilengkapi layanan on-site **LEWI Laundry**, area parkir mobil/motor, dan Rooftop Workout Area.

## Bahasa
Selalu respon dalam Bahasa Indonesia.

## Kredensial & Akun
- Owner/Admin: `fauziealiakhmad@gmail.com` / `admin@lewihouse.com` (role: owner).
- Penghuni Demo: `budi@lewihouse.com` (Unit 204), `andi@lewihouse.com` (Unit 101), `citra@lewihouse.com` (Unit 103), `farhan@lewihouse.com` (Unit 303).

## Spesifikasi Kamar & Fasilitas
- **3 Tingkatan / Kategori Kamar (Room Tiers)**:
  - **Tipe A / Exclusive / VIP**: ~20 m², Springbed Queen/Double, meja kerja, lemari cermin, kamar mandi dalam, Smart TV, WiFi.
  - **Tipe B / Superior**: ~18 m², Springbed Single/Double, meja, lemari pakaian, AC, kamar mandi dalam, WiFi.
  - **Tipe C / Single Standard**: ~16 m² (kasur 1.2 × 2 m), meja kompak, lemari pakaian, AC, kamar mandi dalam, WiFi.
- **Fasilitas Bersama**: Dapur/pantry bersama, communal lounge, rooftop terrace & open-air workout area, CCTV 24 jam, parkir mobil & motor, LEWI Laundry on-site.
- **Kebijakan Guesthouse Syariah**: Pasangan menginap wajib menunjukkan Buku Nikah yang sah saat check-in (14:00 WIB) / check-out (12:00 WIB). Dilarang merokok di kamar, bebas alkohol & no pets.

## Yang Sudah Diimplementasikan
- **Auth JWT & Role-Based Access**: Owner, Admin, Staff Lapangan, dan Tenant Portal.
- **Room Management (17 Kamar • 4 Lantai)**: Tipe A, Tipe B, Tipe C, floor filtering, status state-machine (available, occupied, cleaning, maintenance, reserved), transfer kamar & penyesuaian biaya sewa.
- **Property Info & Overview Modal**: Komponen interaktif `PropertyInfoModal.jsx` menampilkan seluruh panduan properti, alamat Jl. Sei Bahkapuran No. 16A Medan Petisah, kontak WhatsApp, kebijakan syariah, kuliner & RS sekitar, dan link platform booking.
- **Tenant Portal Mandiri**: Cek tagihan & bukti transfer, lapor perbaikan fasilitas, rotasi password mandiri, info tata tertib & fasilitas gedung.
- **Sistem Keuangan & Billing**: Otomasi invoice bulanan, pencatatan pembayaran multi-channel, denda keterlambatan, kwitansi digital.
- **Chat & Canned Responses**: Template cepat berisi alamat Medan, LEWI Laundry, kebijakan buku nikah, dan resepsionis 24 jam.
- **Cloud Firestore & Real-Time Sync**: Terkoneksi dengan project Firestore `lewihouse-7a0d7`.

---

## Clone & Run Setup (2026-06 — E1 session)
- Cloned from https://github.com/aliakhmadfauzie/Lewihouse.git into /app (React + FastAPI + MongoDB, mobile-first PWA + Capacitor iOS/Android wrapper).
- Created gitignored env files:
  - backend/.env: MONGO_URL, DB_NAME=lewi_house_db, JWT_SECRET, VAPID_PUBLIC_KEY (derived from vapid_private.pem), VAPID_PRIVATE_KEY_FILE, VAPID_SUBJECT, ADMIN_EMAIL=admin@lewihouse.com, ADMIN_PASSWORD=lewi2026, CORS_ORIGINS=*
  - frontend/.env: REACT_APP_BACKEND_URL (preview URL), WDS_SOCKET_PORT=443
- Installed pywebpush/py-vapid/http_ece (pip skipped full requirements.txt due to emergentintegrations vs litellm pin conflict — not needed to run).
- Frontend deps installed via `yarn install --ignore-engines` (@capacitor/cli wants node>=22; native-build only, irrelevant to web app).
- Seeded demo data via POST /api/seed → rooms:7, tenants:4, bills:9, tickets:3, tokens:3.
- Verified: admin login + dashboard + 5 tabs load with data. Testing agent: backend 30 passed, frontend smoke 100%. Running as-is.

---

## Native Build + Push Reminders (2026-06 — E1 session 2)
### Native Android build
- Toolchain: JDK 21 (/opt/jdk-21.0.5+11), Node 22 (/opt/node-v22.14.0-linux-arm64) for Capacitor CLI, Android SDK (/opt/android-sdk: platform-34, build-tools 34.0.0, platform-tools).
- aarch64 workaround: Google ships x86_64 aapt2 only. Used qemu-x86_64-static + Debian amd64 multiarch libs; Gradle run with -Pandroid.aapt2FromMavenOverride=/opt/aapt2wrap/aapt2 (qemu wrapper).
- `npx cap sync android` copied web build + wired 6 Capacitor plugins (incl. push-notifications).
- Built: android/app/build/outputs/apk/debug/app-debug.apk (19MB). Copied to /app/artifacts/LewiHouse-debug.apk.
- iOS: Xcode project present (frontend/ios) but cannot be compiled on Linux (needs macOS/Xcode).
- Rebuild cmd: cd /app/frontend/android && ANDROID_HOME=/opt/android-sdk JAVA_HOME=/opt/jdk-21.0.5+11 PATH=$JAVA_HOME/bin:$PATH ./gradlew assembleDebug --no-daemon -Pandroid.aapt2FromMavenOverride=/opt/aapt2wrap/aapt2

### Push reminders (FCM)
- Backend: new endpoints POST /api/push/register-device, /api/push/unregister-device; send_fcm_to_user + _get_fcm_access_token (FCM HTTP v1 with service account); send_push_to_user now sends web-push AND FCM.
- Fixed reminder bug: bill-status queries were lowercase (never matched UPPERCASE schema) -> reminders never fired. Fixed _bill_stage + all sweep/preview/dunning queries. Verified reminders now fire (46/47 backend tests pass).
- Reminder timing: due_soon (H-3..H-1), due_today (H-0), overdue_1/2/3; dedup via reminder_log per (bill_id, stage); loop every 6h.
- FCM config in backend/.env: FCM_PROJECT_ID=lewihouse-7a0d7, FCM_SERVICE_ACCOUNT_FILE=fcm-service-account.json (gitignored). FCM_ENABLED=True, OAuth token acquisition + send path verified against live FCM.
- Frontend: src/lib/nativePush.js registers FCM token via @capacitor/push-notifications after login (native only; no-op on web). Wired into AuthContext.

### OPEN ITEM (blocks real device delivery)
- Firebase project MISMATCH: the APK's android/app/google-services.json is project 'lewihouse' (sender 291852041359), but the backend service account is project 'lewihouse-7a0d7'. FCM tokens from one project cannot be targeted by another. Need google-services.json for project lewihouse-7a0d7 (Android app com.lewihouse.app), then rebuild APK. Until then: app runs fine, backend push works, but delivery to THIS APK won't land.
