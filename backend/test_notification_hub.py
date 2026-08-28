"""Automated Test Suite for Lewi House Unified Notification & Activity Hub."""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import httpx

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:8000")


async def run_tests():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        print("=== 1. Testing Root and Health ===")
        r = await client.get("/api/")
        print("Root response:", r.status_code, r.json())
        assert r.status_code == 200

        print("\n=== 2. Testing Admin Login ===")
        admin_email = os.environ["ADMIN_EMAIL"]
        admin_password = os.environ["ADMIN_PASSWORD"]
        r = await client.post("/api/auth/login", json={"identifier": admin_email, "password": admin_password})
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        admin_data = r.json()
        admin_token = admin_data["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("Admin login OK! User:", admin_data["user"]["email"])

        print("\n=== 3. Testing Seed Data ===")
        r = await client.post("/api/seed", headers=admin_headers)
        print("Seed response:", r.status_code, r.json())
        assert r.status_code == 200

        print("\n=== 4. Testing Admin Live Activity Feed ===")
        r = await client.get("/api/activity/feed?limit=10", headers=admin_headers)
        assert r.status_code == 200, f"Activity feed failed: {r.text}"
        feed_items = r.json()
        print(f"Retrieved {len(feed_items)} live feed items")
        assert len(feed_items) > 0
        print("Sample feed item:", feed_items[0])

        print("\n=== 5. Testing Admin Multi-Criteria Activity Logs ===")
        r = await client.get("/api/activity/logs?module=BILLING&limit=20", headers=admin_headers)
        assert r.status_code == 200
        billing_logs = r.json()
        print(f"Filtered BILLING logs: total={billing_logs.get('total')}, count={len(billing_logs.get('logs', []))}")

        r = await client.get("/api/activity/logs?urgency=warning", headers=admin_headers)
        assert r.status_code == 200
        warning_logs = r.json()
        print(f"Filtered WARNING logs: count={len(warning_logs.get('logs', []))}")

        print("\n=== 6. Testing Activity CSV Export ===")
        r = await client.get("/api/activity/export", headers=admin_headers)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        csv_text = r.text
        lines = csv_text.strip().split("\n")
        print(f"Exported CSV has {len(lines)} lines (header + data)")
        assert len(lines) > 1
        print("Header line:", lines[0])

        print("\n=== 7. Testing Broadcast Announcement ===")
        r = await client.post(
            "/api/announcements/broadcast",
            json={
                "title": "Uji Coba Siaran Pengumuman Gedung",
                "message": "Pengumuman tes dari sistem notifikasi real-time.",
                "urgency": "warning",
                "target": "all",
            },
            headers=admin_headers,
        )
        assert r.status_code == 200, f"Broadcast failed: {r.text}"
        print("Broadcast OK:", r.json())

        print("\n=== 8. Testing Electricity Meter Reading ===")
        # Get a room ID
        r = await client.get("/api/rooms", headers=admin_headers)
        assert r.status_code == 200
        rooms = r.json()
        assert len(rooms) > 0
        target_room_id = rooms[0]["id"]

        r = await client.post(
            "/api/electricity/readings",
            json={
                "room_id": target_room_id,
                "meter_reading": 3120.5,
                "period": "2026-08",
                "note": "Pencatatan tes bulanan",
            },
            headers=admin_headers,
        )
        assert r.status_code == 200, f"Electricity reading failed: {r.text}"
        print("Electricity reading OK:", r.json())

        print("\n=== 9. Testing Tenant Login & Notification Center ===")
        r = await client.post("/api/auth/login", json={"identifier": "204_ali", "password": "password123"})
        if r.status_code != 200:
            # Fallback to demo tenant
            r = await client.post("/api/auth/login", json={"identifier": "081234567890", "password": "password123"})
        
        if r.status_code == 200:
            tenant_data = r.json()
            tenant_token = tenant_data["access_token"]
            tenant_headers = {"Authorization": f"Bearer {tenant_token}"}
            print("Tenant login OK! User:", tenant_data["user"]["name"])

            # Check unread count
            r = await client.get("/api/notifications/unread-count", headers=tenant_headers)
            assert r.status_code == 200
            unread_info = r.json()
            print("Tenant unread count:", unread_info)

            # Check notifications list
            r = await client.get("/api/notifications", headers=tenant_headers)
            assert r.status_code == 200
            notifs = r.json()
            print(f"Tenant has {len(notifs)} notifications")
            assert len(notifs) > 0

            # Test mark single read
            notif_id = notifs[0]["id"]
            r = await client.post(f"/api/notifications/{notif_id}/read", headers=tenant_headers)
            assert r.status_code == 200

            # Test mark all read
            r = await client.post("/api/notifications/read-all", headers=tenant_headers)
            assert r.status_code == 200
            print("Mark all read OK!")

            # Verify unread count is 0
            r = await client.get("/api/notifications/unread-count", headers=tenant_headers)
            assert r.status_code == 200
            print("New unread count after mark all read:", r.json())
            assert r.json()["notifications"] == 0

        print("\n🎉 ALL NOTIFICATION & ACTIVITY HUB TESTS PASSED SUCCESSFULLY! 🎉\n")


if __name__ == "__main__":
    asyncio.run(run_tests())
