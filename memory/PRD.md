# Lewi House - Manajemen Kostan (PRD)

## Original Problem Statement
"Build a mobile app: to manage kostan" (kostan = Indonesian boarding house). Delivered as a mobile-first PWA.

## Architecture
- Frontend: React 18 + React Router + Tailwind + Framer Motion + Recharts + sonner
- Backend: FastAPI + Motor (async MongoDB)
- Storage: MongoDB (collections: rooms, tenants, bills, complaints)
- Fonts: Playfair Display (headings, boutique feel) + Manrope (body)
- All labels in Bahasa Indonesia; currency in IDR (Rp)

## User Personas
- Pemilik/pengelola kostan (property owner) — manages rooms, tenants, bills, complaints

## Core Requirements
- Manajemen kamar (create/list/edit/delete with status: vacant/occupied/maintenance)
- Manajemen penghuni (KTP, HP, kontrak, deposit; assigning a tenant to a room auto-marks the room as occupied)
- Tagihan bulanan (rent + listrik + air + lain-lain; auto-total; mark paid; auto-overdue based on due_date)
- Dashboard: okupansi %, pendapatan bulan ini, outstanding, chart pendapatan 6 bulan, alert keluhan
- Keluhan (pengaduan/perbaikan) dengan prioritas & status

## What's Been Implemented (2026-01)
- [DONE] Base React + FastAPI + MongoDB scaffold (moved existing Android project to /app/_android_backup)
- [DONE] All API endpoints: rooms, tenants, bills, complaints, dashboard/summary, reports/monthly, seed
- [DONE] Auto room-tenant sync on create/update/delete of tenant
- [DONE] Auto-total bill calculation on server; mark paid endpoint with method
- [DONE] Auto-overdue derivation on list bills (unpaid + due_date < today → overdue)
- [DONE] Invalid ObjectId returns 400 (helper `oid()`)
- [DONE] Mobile-first PWA UI (max-w-md shell, fixed bottom nav, bottom sheet drawer for forms)
- [DONE] Framer Motion staggered lists, layoutId pill for active tab
- [DONE] Recharts revenue bar chart on dashboard
- [DONE] Design system (Playfair + Manrope, emerald primary #1A362B + warm bone #FDFBF7 + gold #C6A87C)
- [DONE] Seed endpoint with 6 rooms, 3 tenants, 9 bills, 2 complaints
- [DONE] Testing agent verified: backend 16/17 tests, frontend 100% flows

## Prioritized Backlog
### P1
- Notifikasi/reminder jatuh tempo (WhatsApp/email/push)
- Kwitansi PDF / cetak tagihan
- Multi-properti (jika pemilik punya beberapa kostan)
- Auth (JWT / social login) — currently open (single-owner assumption)

### P2
- Portal penghuni (self-service: lihat tagihan, bayar, lapor keluhan)
- Payment gateway (Midtrans / Xendit)
- Ekspor laporan Excel/PDF
- Meter reading (input KWH listrik & air per bulan)
- Kontrak digital (upload PDF / tanda tangan)

### P3
- Foto galeri kamar (multi-upload ke storage)
- Chat internal owner ↔ penghuni
- Analytics per kamar (revenue/tenant churn)
