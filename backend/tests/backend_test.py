import os
from datetime import date

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


def period_ago(n):
    today = date.today()
    y, m = today.year, today.month - n
    while m <= 0:
        m += 12
        y -= 1
    return f"{y:04d}-{m:02d}"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def seeded(client):
    """Seed once for the whole session (seed is destructive/idempotent)."""
    r = client.post(f"{API}/seed", timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert (data["rooms"], data["tenants"], data["bills"], data["complaints"]) == (6, 3, 9, 2)
    return data


# ---------- health ----------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        assert r.json() == {"service": "Lewi House API", "status": "ok"}


# ---------- rooms ----------
class TestRooms:
    def test_list_rooms_after_seed(self, client):
        r = client.get(f"{API}/rooms", timeout=30)
        assert r.status_code == 200
        rooms = r.json()
        assert len(rooms) == 6
        statuses = [x["status"] for x in rooms]
        assert statuses.count("occupied") == 3
        assert statuses.count("vacant") == 2
        assert statuses.count("maintenance") == 1
        # no mongo _id leak
        assert all("_id" not in x for x in rooms)
        assert [x["name"] for x in rooms] == sorted(x["name"] for x in rooms)

    def test_room_crud(self, client):
        payload = {"name": "TEST_K-999", "floor": "3", "price": 999000, "status": "vacant",
                   "facilities": ["AC"], "photo_url": None, "notes": "qa"}
        c = client.post(f"{API}/rooms", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        room = c.json()
        rid = room["id"]
        assert room["name"] == "TEST_K-999" and room["price"] == 999000
        assert room["tenant_id"] is None and room["created_at"]

        g = client.get(f"{API}/rooms/{rid}", timeout=30)
        assert g.status_code == 200 and g.json()["name"] == "TEST_K-999"

        payload["price"] = 1250000
        payload["status"] = "maintenance"
        u = client.put(f"{API}/rooms/{rid}", json=payload, timeout=30)
        assert u.status_code == 200
        assert u.json()["price"] == 1250000 and u.json()["status"] == "maintenance"
        assert client.get(f"{API}/rooms/{rid}", timeout=30).json()["price"] == 1250000

        d = client.delete(f"{API}/rooms/{rid}", timeout=30)
        assert d.status_code == 200 and d.json()["ok"] is True
        assert client.get(f"{API}/rooms/{rid}", timeout=30).status_code == 404

    def test_get_room_invalid_id(self, client):
        r = client.get(f"{API}/rooms/not-an-objectid", timeout=30)
        assert r.status_code in (400, 404, 422), f"got {r.status_code}: {r.text[:200]}"

    def test_create_room_validation(self, client):
        r = client.post(f"{API}/rooms", json={"floor": "1"}, timeout=30)
        assert r.status_code == 422


# ---------- tenants ----------
class TestTenants:
    def test_list_tenants_after_seed(self, client):
        r = client.get(f"{API}/tenants", timeout=30)
        assert r.status_code == 200
        t = r.json()
        assert len(t) == 3
        names = {x["name"] for x in t}
        assert names == {"Arya Wibowo", "Sinta Dewi", "Budi Santoso"}
        assert all(x["status"] == "active" for x in t)

    def test_tenant_create_assigns_room(self, client):
        rooms = client.get(f"{API}/rooms", timeout=30).json()
        vacant = [x for x in rooms if x["status"] == "vacant"]
        assert len(vacant) >= 2
        room = vacant[0]
        payload = {"name": "TEST_Tenant", "phone": "0800-000-0000", "room_id": room["id"],
                   "monthly_rent": room["price"], "deposit": 0}
        c = client.post(f"{API}/tenants", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        tenant = c.json()
        tid = tenant["id"]
        assert tenant["room_id"] == room["id"] and tenant["status"] == "active"

        r1 = client.get(f"{API}/rooms/{room['id']}", timeout=30).json()
        assert r1["status"] == "occupied" and r1["tenant_id"] == tid

        # reassign to second vacant room
        room2 = vacant[1]
        payload2 = dict(payload, room_id=room2["id"], name="TEST_Tenant Updated")
        u = client.put(f"{API}/tenants/{tid}", json=payload2, timeout=30)
        assert u.status_code == 200
        assert u.json()["room_id"] == room2["id"] and u.json()["name"] == "TEST_Tenant Updated"

        old = client.get(f"{API}/rooms/{room['id']}", timeout=30).json()
        new = client.get(f"{API}/rooms/{room2['id']}", timeout=30).json()
        assert old["status"] == "vacant" and old["tenant_id"] is None
        assert new["status"] == "occupied" and new["tenant_id"] == tid

        # delete frees room
        d = client.delete(f"{API}/tenants/{tid}", timeout=30)
        assert d.status_code == 200
        freed = client.get(f"{API}/rooms/{room2['id']}", timeout=30).json()
        assert freed["status"] == "vacant" and freed["tenant_id"] is None
        assert client.get(f"{API}/tenants/{tid}", timeout=30).status_code == 404

    def test_update_missing_tenant(self, client):
        r = client.put(f"{API}/tenants/507f1f77bcf86cd799439011",
                       json={"name": "x", "phone": "y"}, timeout=30)
        assert r.status_code == 404


# ---------- bills ----------
class TestBills:
    def test_list_and_filter(self, client):
        allb = client.get(f"{API}/bills", timeout=30).json()
        assert len(allb) == 9
        paid = client.get(f"{API}/bills", params={"status": "paid"}, timeout=30).json()
        unpaid = client.get(f"{API}/bills", params={"status": "unpaid"}, timeout=30).json()
        assert len(paid) == 6 and len(unpaid) == 3
        assert all(b["status"] == "paid" for b in paid)
        assert all(b["period"] == period_ago(0) for b in unpaid)
        for b in allb:
            assert b["total"] == b["rent"] + b["electricity"] + b["water"] + b["other"]

    def test_filter_by_tenant(self, client):
        tenants = client.get(f"{API}/tenants", timeout=30).json()
        tid = tenants[0]["id"]
        bills = client.get(f"{API}/bills", params={"tenant_id": tid}, timeout=30).json()
        assert len(bills) == 3 and all(b["tenant_id"] == tid for b in bills)

    def test_bill_crud_and_pay(self, client):
        tenants = client.get(f"{API}/tenants", timeout=30).json()
        tid = tenants[0]["id"]
        payload = {"tenant_id": tid, "room_id": None, "period": "2026-01", "rent": 1000000,
                   "electricity": 100000, "water": 50000, "other": 25000,
                   "other_label": "TEST_parkir", "status": "unpaid"}
        c = client.post(f"{API}/bills", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        bill = c.json()
        bid = bill["id"]
        assert bill["total"] == 1175000 and bill["status"] == "unpaid"

        # update recomputes total
        payload["electricity"] = 200000
        u = client.put(f"{API}/bills/{bid}", json=payload, timeout=30)
        assert u.status_code == 200 and u.json()["total"] == 1275000

        p = client.post(f"{API}/bills/{bid}/pay", params={"method": "cash"}, timeout=30)
        assert p.status_code == 200, p.text
        pb = p.json()
        assert pb["status"] == "paid" and pb["payment_method"] == "cash" and pb["paid_at"]

        # verify persisted
        got = [b for b in client.get(f"{API}/bills", timeout=30).json() if b["id"] == bid]
        assert got and got[0]["status"] == "paid"

        assert client.delete(f"{API}/bills/{bid}", timeout=30).status_code == 200
        assert not [b for b in client.get(f"{API}/bills", timeout=30).json() if b["id"] == bid]

    def test_pay_missing_bill(self, client):
        r = client.post(f"{API}/bills/507f1f77bcf86cd799439011/pay", timeout=30)
        assert r.status_code == 404


# ---------- complaints ----------
class TestComplaints:
    def test_list_after_seed(self, client):
        c = client.get(f"{API}/complaints", timeout=30).json()
        assert len(c) == 2
        assert {x["status"] for x in c} == {"open", "in_progress"}

    def test_complaint_crud(self, client):
        payload = {"title": "TEST_Lampu mati", "description": "d", "priority": "high", "status": "open"}
        c = client.post(f"{API}/complaints", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        obj = c.json()
        cid = obj["id"]
        assert obj["title"] == "TEST_Lampu mati" and obj["resolved_at"] is None

        payload["status"] = "resolved"
        u = client.put(f"{API}/complaints/{cid}", json=payload, timeout=30)
        assert u.status_code == 200
        assert u.json()["status"] == "resolved" and u.json()["resolved_at"]

        assert client.delete(f"{API}/complaints/{cid}", timeout=30).status_code == 200
        assert not [x for x in client.get(f"{API}/complaints", timeout=30).json() if x["id"] == cid]


# ---------- dashboard & reports ----------
class TestDashboard:
    def test_summary(self, client):
        s = client.get(f"{API}/dashboard/summary", timeout=30).json()
        unpaid = client.get(f"{API}/bills", params={"status": "unpaid"}, timeout=30).json()
        assert s["rooms_total"] == 6
        assert s["rooms_occupied"] == 3 and s["rooms_vacant"] == 2 and s["rooms_maintenance"] == 1
        assert s["occupancy_rate"] == 50
        assert s["tenants_active"] == 3
        assert s["unpaid_count"] == 3
        assert s["outstanding"] == sum(b["total"] for b in unpaid)
        assert s["open_complaints"] == 2
        assert s["period"] == period_ago(0)
        assert s["revenue_month"] == 0

    def test_monthly_report(self, client):
        r = client.get(f"{API}/reports/monthly", params={"months": 6}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6
        periods = [d["period"] for d in data]
        assert periods == [period_ago(i) for i in range(5, -1, -1)]
        paid = client.get(f"{API}/bills", params={"status": "paid"}, timeout=30).json()
        expected = {}
        for b in paid:
            expected[b["period"]] = expected.get(b["period"], 0) + b["total"]
        for d in data:
            assert d["income"] == expected.get(d["period"], 0)
        assert data[-2]["income"] > 0 and data[-3]["income"] > 0

    def test_monthly_report_custom_months(self, client):
        assert len(client.get(f"{API}/reports/monthly", params={"months": 3}, timeout=30).json()) == 3
