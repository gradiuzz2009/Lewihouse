"""Lewi House backend regression suite (pytest)."""
import os
import re
import uuid
from datetime import date, timedelta
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def creds():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing test_credentials.md")
    c = p.read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?Email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?Password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("no creds parsed")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="session")
def login_response(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    return r


@pytest.fixture(scope="session")
def client(login_response):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {login_response.json()['access_token']}"})
    return s


@pytest.fixture(scope="session", autouse=True)
def seeded(client):
    r = client.post(f"{API}/seed", timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- AUTH ----------
class TestAuth:
    def test_protected_route_requires_auth(self):
        assert requests.get(f"{API}/rooms", timeout=30).status_code == 401

    def test_login_payload_and_cookies(self, login_response, creds):
        d = login_response.json()
        assert d["user"]["email"] == creds["email"]
        assert d["user"]["role"] == "owner"
        assert isinstance(d["access_token"], str) and len(d["access_token"]) > 20
        assert "access_token" in login_response.cookies
        assert "refresh_token" in login_response.cookies

    def test_me_with_bearer(self, client, creds):
        r = client.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == creds["email"]
        assert "password_hash" not in d
        assert "_id" not in d

    def test_wrong_password_401_indonesian(self, creds):
        r = requests.post(f"{API}/auth/login",
                          json={"email": f"nouser-{uuid.uuid4().hex[:6]}@x.com", "password": "bad"}, timeout=30)
        assert r.status_code == 401
        assert "salah" in r.json()["detail"].lower()

    def test_invalid_token_401(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer bogus.token.x"}, timeout=30)
        assert r.status_code == 401

    def test_bruteforce_lockout_internal(self):
        """Lockout is keyed on request.client.host:email. Verified against the app
        directly; via the public ingress the source IP rotates between proxy pods so
        the counter is split and lockout may not trigger (reported as a finding)."""
        email = f"brute-{uuid.uuid4().hex[:8]}@x.com"
        codes = []
        for _ in range(6):
            codes.append(requests.post("http://localhost:8001/api/auth/login",
                                       json={"email": email, "password": "wrong"}, timeout=30).status_code)
        assert codes[-1] == 429, f"expected lockout, got {codes}"

    @pytest.mark.xfail(reason="Known: lockout counter keyed on proxy IP, diluted via public ingress")
    def test_bruteforce_lockout_public(self):
        email = f"brute-{uuid.uuid4().hex[:8]}@x.com"
        codes = [requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"},
                               timeout=30).status_code for _ in range(6)]
        assert codes[-1] == 429, f"expected lockout, got {codes}"

    def test_bcrypt_hash_format(self):
        import subprocess
        out = subprocess.run(
            ["mongosh", "--quiet", "lewi_house_db", "--eval",
             'db.users.findOne({role:"owner"}).password_hash'],
            capture_output=True, text=True)
        assert out.stdout.strip().startswith("$2b$"), out.stdout


# ---------- SEED ----------
class TestSeed:
    def test_seed_counts(self, seeded):
        assert seeded == {"ok": True, "rooms": 7, "tenants": 4, "bills": 9, "tickets": 3, "tokens": 3}

    def test_seed_rooms_statuses(self, client):
        rooms = client.get(f"{API}/rooms", timeout=30).json()
        assert len(rooms) == 7
        assert len({r["status"] for r in rooms}) == 5
        assert all("_id" not in r for r in rooms)

    def test_seed_tenants(self, client):
        t = client.get(f"{API}/tenants", timeout=30).json()
        assert len([x for x in t if x["status"] == "active"]) == 3
        assert len([x for x in t if x["status"] == "pending_assignment"]) == 1

    def test_seed_bills_and_tickets(self, client):
        bills = client.get(f"{API}/bills", timeout=30).json()
        assert len(bills) == 9
        # NOTE: seeded partially_paid bill has a past due_date so derive_bill() rewrites
        # its status to "overdue" -> no bill is reported as partially_paid (finding).
        assert any(b["amount_paid"] > 0 and b["amount_paid"] < b["total"] for b in bills), \
            "no partially-paid bill in seed"
        assert len(client.get(f"{API}/complaints", timeout=30).json()) == 3
        assert len(client.get(f"{API}/access-tokens", timeout=30).json()) == 3


# ---------- ROOMS ----------
class TestRooms:
    def test_transition_valid_cleaning_to_available(self, client):
        rooms = client.get(f"{API}/rooms").json()
        rid = next(r["id"] for r in rooms if r["status"] == "cleaning")
        r = client.post(f"{API}/rooms/{rid}/status", json={"status": "available"})
        assert r.status_code == 200
        assert r.json()["status"] == "available"
        assert client.get(f"{API}/rooms/{rid}").json()["status"] == "available"

    def test_transition_invalid_available_to_cleaning(self, client):
        rooms = client.get(f"{API}/rooms").json()
        rid = next(r["id"] for r in rooms if r["status"] == "available")
        r = client.post(f"{API}/rooms/{rid}/status", json={"status": "cleaning"})
        assert r.status_code == 400
        assert "tidak diizinkan" in r.json()["detail"]

    def test_transition_bad_status(self, client):
        rid = client.get(f"{API}/rooms").json()[0]["id"]
        assert client.post(f"{API}/rooms/{rid}/status", json={"status": "zzz"}).status_code == 400

    def test_room_crud_and_duplicate(self, client):
        payload = {"name": "TEST-R1", "floor": "3", "wing": "C", "room_type": "vip",
                   "capacity": 2, "price": 2000000, "deposit": 2000000, "status": "available",
                   "facilities": ["AC"], "notes": "TEST_"}
        r = client.post(f"{API}/rooms", json=payload)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        got = client.get(f"{API}/rooms/{rid}").json()
        assert got["name"] == "TEST-R1" and got["deposit"] == 2000000 and got["room_type"] == "vip"
        assert client.post(f"{API}/rooms", json=payload).status_code == 400
        upd = {**payload, "price": 2500000}
        assert client.put(f"{API}/rooms/{rid}", json=upd).json()["price"] == 2500000
        assert client.delete(f"{API}/rooms/{rid}").status_code == 200
        assert client.get(f"{API}/rooms/{rid}").status_code == 404

    def test_invalid_id_400(self, client):
        assert client.get(f"{API}/rooms/notanid").status_code == 400


# ---------- TENANT LIFECYCLE ----------
class TestTenantLifecycle:
    def test_create_movein_moveout(self, client):
        rooms = client.get(f"{API}/rooms").json()
        room = next(r for r in rooms if r["status"] == "available")
        payload = {"name": "TEST_Tenant", "phone": "0800-000-0000", "nik": "1234567890123456",
                   "occupation": "QA", "emergency_name": "EM", "emergency_relation": "Teman",
                   "emergency_phone": "0811", "room_id": room["id"],
                   "lease_start": "2026-07-01", "lease_end": "2027-07-01",
                   "monthly_rent": 1000000, "deposit": 1000000}
        r = client.post(f"{API}/tenants", json=payload)
        assert r.status_code == 200, r.text
        t = r.json()
        tid = t["id"]
        assert t["status"] == "pending_assignment"
        assert client.get(f"{API}/rooms/{room['id']}").json()["status"] == "reserved"

        # move-in
        mi = client.post(f"{API}/tenants/{tid}/move-in", json={})
        assert mi.status_code == 200, mi.text
        assert mi.json()["status"] == "active"
        assert client.get(f"{API}/rooms/{room['id']}").json()["status"] == "occupied"
        tokens = client.get(f"{API}/access-tokens").json()
        mine = [x for x in tokens if x.get("tenant_id") == tid]
        assert mine and mine[0]["status"] == "active" and re.fullmatch(r"\d{6}", mine[0]["pin"])

        # double move-in rejected
        assert client.post(f"{API}/tenants/{tid}/move-in", json={}).status_code == 400

        # move-out with deduction
        mo = client.post(f"{API}/tenants/{tid}/move-out",
                         json={"deductions": [{"label": "Kerusakan", "amount": 250000}]})
        assert mo.status_code == 200, mo.text
        d = mo.json()
        assert d["status"] == "former"
        assert d["deposit_settlement"]["total_deduction"] == 250000
        assert d["deposit_settlement"]["refund"] == 750000
        assert client.get(f"{API}/rooms/{room['id']}").json()["status"] == "cleaning"
        tokens = client.get(f"{API}/access-tokens").json()
        assert all(x["status"] != "active" for x in tokens if x.get("tenant_id") == tid)
        client.delete(f"{API}/tenants/{tid}")

    def test_movein_without_room_400(self, client):
        r = client.post(f"{API}/tenants", json={"name": "TEST_NoRoom", "phone": "0800"})
        tid = r.json()["id"]
        mi = client.post(f"{API}/tenants/{tid}/move-in", json={})
        assert mi.status_code == 400
        client.delete(f"{API}/tenants/{tid}")


# ---------- BILLS ----------
class TestBills:
    def test_overdue_and_dunning_derived(self, client):
        tenants = client.get(f"{API}/tenants?status=active").json()
        t = tenants[0]
        old_due = (date.today() - timedelta(days=10)).isoformat()
        r = client.post(f"{API}/bills", json={
            "tenant_id": t["id"], "room_id": t.get("room_id"), "period": "2026-01",
            "rent": 500000, "electricity": 0, "water": 0, "other": 0,
            "due_date": old_due, "status": "unpaid", "notes": "TEST_"})
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "overdue" and b["dunning_stage"] == 3
        client.delete(f"{API}/bills/{b['id']}")

    def test_invoice_number_format(self, client):
        tenants = client.get(f"{API}/tenants?status=active").json()
        t = tenants[0]
        room = client.get(f"{API}/rooms/{t['room_id']}").json()
        r = client.post(f"{API}/bills", json={
            "tenant_id": t["id"], "room_id": t["room_id"], "period": "2026-09",
            "rent": 1000000, "electricity": 100000, "water": 50000,
            "due_date": "2026-09-05", "notes": "TEST_"})
        b = r.json()
        expected = f"INV-202609-{room['name'].replace('-', '').upper()}"
        assert b["invoice_number"] == expected, b["invoice_number"]
        assert b["total"] == 1150000
        client.delete(f"{API}/bills/{b['id']}")

    def test_generate_idempotent(self, client):
        period = "2026-12"  # future period with no seeded bills
        first = client.post(f"{API}/bills/generate", json={"period": period})
        assert first.status_code == 200
        n = first.json()["created"]
        active = len(client.get(f"{API}/tenants?status=active").json())
        assert n == active, f"created {n} vs active {active}"
        second = client.post(f"{API}/bills/generate", json={"period": period})
        assert second.json()["created"] == 0
        for b in client.get(f"{API}/bills").json():
            if b["period"] == period:
                client.delete(f"{API}/bills/{b['id']}")

    def test_partial_then_full_payment(self, client):
        tenants = client.get(f"{API}/tenants?status=active").json()
        t = tenants[0]
        b = client.post(f"{API}/bills", json={
            "tenant_id": t["id"], "room_id": t.get("room_id"), "period": "2026-10",
            "rent": 1000000, "due_date": "2099-10-05", "notes": "TEST_"}).json()
        r1 = client.post(f"{API}/bills/{b['id']}/payments",
                         json={"amount": 400000, "method": "qris", "reference": "QR1"})
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["status"] == "partially_paid" and d1["amount_paid"] == 400000
        assert len(d1["payments"]) == 1 and d1["payments"][0]["method"] == "qris"
        r2 = client.post(f"{API}/bills/{b['id']}/payments",
                         json={"amount": 600000, "method": "cash"})
        d2 = r2.json()
        assert d2["status"] == "paid" and d2["amount_paid"] == 1000000 and d2["paid_at"]
        # persistence
        got = [x for x in client.get(f"{API}/bills").json() if x["id"] == b["id"]][0]
        assert got["status"] == "paid" and len(got["payments"]) == 2
        client.delete(f"{API}/bills/{b['id']}")

    def test_payment_zero_rejected(self, client):
        bills = client.get(f"{API}/bills").json()
        r = client.post(f"{API}/bills/{bills[0]['id']}/payments", json={"amount": 0, "method": "cash"})
        assert r.status_code == 400

    def test_bills_status_filter(self, client):
        for s in ["unpaid", "paid", "partially_paid", "overdue"]:
            r = client.get(f"{API}/bills?status={s}")
            assert r.status_code == 200
            assert all(b["status"] == s for b in r.json())


# ---------- MAINTENANCE ----------
class TestTickets:
    def test_ticket_transitions(self, client):
        r = client.post(f"{API}/complaints", json={
            "title": "TEST_Ticket", "description": "d", "category": "electrical",
            "priority": "urgent", "status": "pending"})
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["priority"] == "urgent" and t["category"] == "electrical"
        cid = t["id"]
        bad = client.post(f"{API}/complaints/{cid}/status", json={"status": "resolved"})
        assert bad.status_code == 400 and "tidak diizinkan" in bad.json()["detail"]
        assert client.post(f"{API}/complaints/{cid}/status", json={"status": "in_progress"}).json()["status"] == "in_progress"
        res = client.post(f"{API}/complaints/{cid}/status",
                          json={"status": "resolved", "cost_material": 100000, "cost_labor": 50000}).json()
        assert res["status"] == "resolved" and res["cost_material"] == 100000 and res["resolved_at"]
        assert client.post(f"{API}/complaints/{cid}/status", json={"status": "closed"}).json()["status"] == "closed"
        assert client.post(f"{API}/complaints/{cid}/status", json={"status": "in_progress"}).status_code == 400
        client.delete(f"{API}/complaints/{cid}")


# ---------- ACCESS TOKENS ----------
class TestAccessTokens:
    def test_issue_and_revoke(self, client):
        r = client.post(f"{API}/access-tokens", json={
            "label": "TEST_Vendor", "token_type": "vendor",
            "valid_from": "2026-07-01", "valid_until": "2026-12-31"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert re.fullmatch(r"\d{6}", d["pin"]) and d["status"] == "active"
        assert "_id" not in d
        tid = d["id"]
        assert client.post(f"{API}/access-tokens/{tid}/revoke").status_code == 200
        got = [x for x in client.get(f"{API}/access-tokens").json() if x["id"] == tid][0]
        assert got["status"] == "revoked" and got["revoked_at"]

    def test_revoke_missing_404(self, client):
        assert client.post(f"{API}/access-tokens/64b7f9c2e1a2b3c4d5e6f7a8/revoke").status_code == 404


# ---------- AUDIT / DASHBOARD ----------
class TestAuditDashboard:
    def test_audit_entries(self, client):
        r = client.get(f"{API}/audit")
        assert r.status_code == 200
        docs = r.json()
        assert docs and all("_id" not in d for d in docs)
        actions = {d["action"] for d in docs}
        assert "SEED" in actions

    def test_dashboard_summary(self, client):
        d = client.get(f"{API}/dashboard/summary").json()
        for k in ["rooms_total", "rooms_occupied", "rooms_available", "rooms_reserved",
                  "rooms_cleaning", "rooms_maintenance", "tenants_active", "outstanding",
                  "revenue_month", "occupancy_rate", "active_maintenance", "active_tokens", "period"]:
            assert k in d, k
        assert d["rooms_total"] >= 7

    def test_monthly_report(self, client):
        d = client.get(f"{API}/reports/monthly?months=6").json()
        assert len(d) == 6 and all("period" in x and "income" in x for x in d)
