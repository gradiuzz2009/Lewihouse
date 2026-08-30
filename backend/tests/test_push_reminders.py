"""Tests for FCM push registration and dunning-reminder endpoints (iter 4)."""
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def creds():
    c = Path("/app/memory/test_credentials.md").read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?Email(?:\*\*)?\s*:\s*`?([^`\s]+)', c).group(1)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?Password(?:\*\*)?\s*:\s*`?([^`\s]+)', c).group(1)
    return {"email": e, "password": pw}


@pytest.fixture(scope="session")
def token(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session", autouse=True)
def seeded(client):
    r = client.post(f"{API}/seed", timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Push / FCM device token endpoints ----------
class TestPushDevice:
    def test_register_requires_auth(self):
        r = requests.post(f"{API}/push/register-device",
                          json={"token": "x" * 40, "platform": "android"}, timeout=30)
        assert r.status_code == 401

    def test_register_rejects_short_token(self, client):
        r = client.post(f"{API}/push/register-device",
                        json={"token": "short", "platform": "android"})
        assert r.status_code == 400
        assert "Invalid device token" in r.json().get("detail", "")

    def test_register_and_unregister_success(self, client):
        tok = "TEST_" + uuid.uuid4().hex + uuid.uuid4().hex  # 68 chars
        r = client.post(f"{API}/push/register-device",
                        json={"token": tok, "platform": "android"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("fcm_enabled") is True, f"FCM should be enabled, got: {d}"

        # idempotent upsert
        r2 = client.post(f"{API}/push/register-device",
                         json={"token": tok, "platform": "android"})
        assert r2.status_code == 200

        # unregister
        u = client.post(f"{API}/push/unregister-device",
                        json={"token": tok, "platform": "android"})
        assert u.status_code == 200
        assert u.json().get("ok") is True

    def test_register_ios_platform(self, client):
        tok = "IOS_" + uuid.uuid4().hex + uuid.uuid4().hex
        r = client.post(f"{API}/push/register-device",
                        json={"token": tok, "platform": "ios"})
        assert r.status_code == 200
        client.post(f"{API}/push/unregister-device", json={"token": tok, "platform": "ios"})


# ---------- Reminders (dunning) ----------
class TestReminders:
    def test_preview_non_empty(self, client):
        """UPPERCASE-status fix: seeded overdue bills should now surface here."""
        r = client.get(f"{API}/reminders/preview")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Expected at least one due/overdue bill from seed data"
        for item in data:
            for k in ("bill_id", "invoice_number", "tenant_name", "stage", "already_sent"):
                assert k in item, f"missing {k} in {item}"
            assert item["stage"] in {"due_soon", "due_today", "overdue_1", "overdue_2", "overdue_3"}

    def test_dunning_list_ok(self, client):
        r = client.get(f"{API}/reminders/dunning-list")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # Not asserting non-empty (same underlying pool), but if present must have stage_label
        for item in data:
            assert "stage_label" in item and item["stage_label"]
            assert item["stage"] in {"due_soon", "due_today", "overdue_1", "overdue_2", "overdue_3"}

    def test_send_reminders_ok(self, client):
        r = client.post(f"{API}/reminders/send")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert "sent" in d and isinstance(d["sent"], int) and d["sent"] >= 0

    def test_send_reminders_dedup_second_call(self, client):
        # After first send, reminder_log dedup should return sent=0 for the same stages
        r = client.post(f"{API}/reminders/send")
        assert r.status_code == 200
        assert r.json().get("sent") == 0

    def test_preview_marks_already_sent(self, client):
        r = client.get(f"{API}/reminders/preview")
        assert r.status_code == 200
        data = r.json()
        # After a send sweep all currently-stageable items should be marked already_sent
        if data:
            assert any(x["already_sent"] for x in data), \
                "expected at least one item marked already_sent after a send sweep"


# ---------- Regression: auth-protected core endpoints ----------
class TestRegression:
    def test_rooms_requires_auth(self):
        assert requests.get(f"{API}/rooms", timeout=30).status_code == 401

    def test_tenants_requires_auth(self):
        assert requests.get(f"{API}/tenants", timeout=30).status_code == 401

    def test_bills_requires_auth(self):
        assert requests.get(f"{API}/bills", timeout=30).status_code == 401

    def test_rooms_ok(self, client):
        r = client.get(f"{API}/rooms")
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_tenants_ok(self, client):
        r = client.get(f"{API}/tenants")
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_bills_ok(self, client):
        r = client.get(f"{API}/bills")
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_dashboard_summary(self, client):
        r = client.get(f"{API}/dashboard/summary")
        assert r.status_code == 200
        d = r.json()
        for k in ("rooms_total", "tenants_active", "outstanding", "revenue_month"):
            assert k in d
