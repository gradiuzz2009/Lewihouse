from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId


def oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid id")
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Lewi House API")
api = APIRouter(prefix="/api")


def _oid(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(_oid)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============ MODELS ============
class RoomBase(BaseModel):
    name: str
    floor: Optional[str] = "1"
    price: float  # monthly rent IDR
    status: str = "vacant"  # vacant | occupied | maintenance
    facilities: List[str] = []
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class Room(RoomBase):
    id: str
    tenant_id: Optional[str] = None
    created_at: str


class TenantBase(BaseModel):
    name: str
    phone: str
    id_number: Optional[str] = None  # KTP
    email: Optional[str] = None
    room_id: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    monthly_rent: float = 0
    deposit: float = 0
    avatar_url: Optional[str] = None
    notes: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class Tenant(TenantBase):
    id: str
    status: str = "active"  # active | inactive
    created_at: str


class BillBase(BaseModel):
    tenant_id: str
    room_id: Optional[str] = None
    period: str  # YYYY-MM
    rent: float = 0
    electricity: float = 0
    water: float = 0
    other: float = 0
    other_label: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "unpaid"  # unpaid | paid | overdue
    paid_at: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class BillCreate(BillBase):
    pass


class Bill(BillBase):
    id: str
    total: float
    created_at: str


class ComplaintBase(BaseModel):
    tenant_id: Optional[str] = None
    room_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low | medium | high
    status: str = "open"  # open | in_progress | resolved


class ComplaintCreate(ComplaintBase):
    pass


class Complaint(ComplaintBase):
    id: str
    created_at: str
    resolved_at: Optional[str] = None


def doc_to(model, doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return model(**doc)


# ============ ROOMS ============
@api.get("/rooms", response_model=List[Room])
async def list_rooms():
    docs = await db.rooms.find().sort("name", 1).to_list(1000)
    return [doc_to(Room, d) for d in docs]


@api.post("/rooms", response_model=Room)
async def create_room(payload: RoomCreate):
    doc = payload.model_dump()
    doc["created_at"] = now_iso()
    doc["tenant_id"] = None
    r = await db.rooms.insert_one(doc)
    return doc_to(Room, {**doc, "_id": r.inserted_id})


@api.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str):
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    return doc_to(Room, d)


@api.put("/rooms/{room_id}", response_model=Room)
async def update_room(room_id: str, payload: RoomCreate):
    upd = payload.model_dump()
    await db.rooms.update_one({"_id": oid(room_id)}, {"$set": upd})
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    return doc_to(Room, d)


@api.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    await db.rooms.delete_one({"_id": oid(room_id)})
    return {"ok": True}


# ============ TENANTS ============
@api.get("/tenants", response_model=List[Tenant])
async def list_tenants():
    docs = await db.tenants.find().sort("created_at", -1).to_list(1000)
    return [doc_to(Tenant, d) for d in docs]


@api.post("/tenants", response_model=Tenant)
async def create_tenant(payload: TenantCreate):
    doc = payload.model_dump()
    doc["status"] = "active"
    doc["created_at"] = now_iso()
    r = await db.tenants.insert_one(doc)
    # Assign to room
    if doc.get("room_id"):
        await db.rooms.update_one(
            {"_id": ObjectId(doc["room_id"])},
            {"$set": {"status": "occupied", "tenant_id": str(r.inserted_id)}},
        )
    return doc_to(Tenant, {**doc, "_id": r.inserted_id})


@api.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    return doc_to(Tenant, d)


@api.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, payload: TenantCreate):
    prev = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not prev:
        raise HTTPException(404, "Tenant not found")
    upd = payload.model_dump()
    await db.tenants.update_one({"_id": oid(tenant_id)}, {"$set": upd})
    # Handle room reassignment
    prev_room = prev.get("room_id")
    new_room = upd.get("room_id")
    if prev_room != new_room:
        if prev_room:
            await db.rooms.update_one(
                {"_id": ObjectId(prev_room)},
                {"$set": {"status": "vacant", "tenant_id": None}},
            )
        if new_room:
            await db.rooms.update_one(
                {"_id": ObjectId(new_room)},
                {"$set": {"status": "occupied", "tenant_id": tenant_id}},
            )
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    return doc_to(Tenant, d)


@api.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if d and d.get("room_id"):
        await db.rooms.update_one(
            {"_id": ObjectId(d["room_id"])},
            {"$set": {"status": "vacant", "tenant_id": None}},
        )
    await db.tenants.delete_one({"_id": oid(tenant_id)})
    return {"ok": True}


# ============ BILLS ============
@api.get("/bills", response_model=List[Bill])
async def list_bills(status: Optional[str] = None, tenant_id: Optional[str] = None):
    q = {}
    if tenant_id:
        q["tenant_id"] = tenant_id
    docs = await db.bills.find(q).sort("created_at", -1).to_list(2000)
    today_iso = datetime.now(timezone.utc).date().isoformat()
    for d in docs:
        if d.get("status") == "unpaid" and d.get("due_date") and d["due_date"] < today_iso:
            d["status"] = "overdue"
    if status:
        docs = [d for d in docs if d.get("status") == status]
    return [doc_to(Bill, d) for d in docs]


@api.post("/bills", response_model=Bill)
async def create_bill(payload: BillCreate):
    doc = payload.model_dump()
    doc["total"] = doc["rent"] + doc["electricity"] + doc["water"] + doc["other"]
    doc["created_at"] = now_iso()
    r = await db.bills.insert_one(doc)
    return doc_to(Bill, {**doc, "_id": r.inserted_id})


@api.put("/bills/{bill_id}", response_model=Bill)
async def update_bill(bill_id: str, payload: BillCreate):
    upd = payload.model_dump()
    upd["total"] = upd["rent"] + upd["electricity"] + upd["water"] + upd["other"]
    await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd})
    d = await db.bills.find_one({"_id": oid(bill_id)})
    if not d:
        raise HTTPException(404, "Bill not found")
    return doc_to(Bill, d)


@api.post("/bills/{bill_id}/pay", response_model=Bill)
async def mark_paid(bill_id: str, method: str = "cash"):
    await db.bills.update_one(
        {"_id": oid(bill_id)},
        {"$set": {"status": "paid", "paid_at": now_iso(), "payment_method": method}},
    )
    d = await db.bills.find_one({"_id": oid(bill_id)})
    if not d:
        raise HTTPException(404, "Bill not found")
    return doc_to(Bill, d)


@api.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str):
    await db.bills.delete_one({"_id": oid(bill_id)})
    return {"ok": True}


# ============ COMPLAINTS ============
@api.get("/complaints", response_model=List[Complaint])
async def list_complaints():
    docs = await db.complaints.find().sort("created_at", -1).to_list(1000)
    return [doc_to(Complaint, d) for d in docs]


@api.post("/complaints", response_model=Complaint)
async def create_complaint(payload: ComplaintCreate):
    doc = payload.model_dump()
    doc["created_at"] = now_iso()
    doc["resolved_at"] = None
    r = await db.complaints.insert_one(doc)
    return doc_to(Complaint, {**doc, "_id": r.inserted_id})


@api.put("/complaints/{cid}", response_model=Complaint)
async def update_complaint(cid: str, payload: ComplaintCreate):
    upd = payload.model_dump()
    if upd["status"] == "resolved":
        upd["resolved_at"] = now_iso()
    await db.complaints.update_one({"_id": oid(cid)}, {"$set": upd})
    d = await db.complaints.find_one({"_id": oid(cid)})
    if not d:
        raise HTTPException(404, "Complaint not found")
    return doc_to(Complaint, d)


@api.delete("/complaints/{cid}")
async def delete_complaint(cid: str):
    await db.complaints.delete_one({"_id": oid(cid)})
    return {"ok": True}


# ============ DASHBOARD & REPORTS ============
@api.get("/dashboard/summary")
async def dashboard_summary():
    rooms_total = await db.rooms.count_documents({})
    rooms_occupied = await db.rooms.count_documents({"status": "occupied"})
    rooms_vacant = await db.rooms.count_documents({"status": "vacant"})
    rooms_maintenance = await db.rooms.count_documents({"status": "maintenance"})
    tenants_active = await db.tenants.count_documents({"status": "active"})

    # Outstanding = sum of unpaid totals
    unpaid_docs = await db.bills.find({"status": {"$in": ["unpaid", "overdue"]}}).to_list(5000)
    outstanding = sum(b.get("total", 0) for b in unpaid_docs)

    # This month revenue = sum paid bills with period == YYYY-MM
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    paid_docs = await db.bills.find({"status": "paid", "period": period}).to_list(5000)
    revenue_month = sum(b.get("total", 0) for b in paid_docs)

    open_complaints = await db.complaints.count_documents({"status": {"$in": ["open", "in_progress"]}})

    occupancy_rate = round((rooms_occupied / rooms_total) * 100) if rooms_total else 0

    return {
        "rooms_total": rooms_total,
        "rooms_occupied": rooms_occupied,
        "rooms_vacant": rooms_vacant,
        "rooms_maintenance": rooms_maintenance,
        "tenants_active": tenants_active,
        "outstanding": outstanding,
        "unpaid_count": len(unpaid_docs),
        "revenue_month": revenue_month,
        "occupancy_rate": occupancy_rate,
        "open_complaints": open_complaints,
        "period": period,
    }


@api.get("/reports/monthly")
async def monthly_report(months: int = 6):
    """Return last N months of income (paid bills) grouped by period."""
    docs = await db.bills.find({"status": "paid"}).to_list(10000)
    by_period = {}
    for b in docs:
        p = b.get("period", "")
        by_period[p] = by_period.get(p, 0) + b.get("total", 0)

    # Build last N periods
    from datetime import date
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        y = today.year
        m = today.month - i
        while m <= 0:
            m += 12
            y -= 1
        period = f"{y:04d}-{m:02d}"
        result.append({"period": period, "income": by_period.get(period, 0)})
    return result


# ============ SEED (dev helper) ============
@api.post("/seed")
async def seed_data():
    # Clear existing
    await db.rooms.delete_many({})
    await db.tenants.delete_many({})
    await db.bills.delete_many({})
    await db.complaints.delete_many({})

    rooms_seed = [
        {"name": "K-101", "floor": "1", "price": 1500000, "status": "occupied", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam"], "photo_url": "https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=400", "notes": ""},
        {"name": "K-102", "floor": "1", "price": 1500000, "status": "occupied", "facilities": ["AC", "WiFi"], "photo_url": "https://images.unsplash.com/photo-1642541070065-3912f347e7c6?w=400", "notes": ""},
        {"name": "K-103", "floor": "1", "price": 1200000, "status": "vacant", "facilities": ["Kipas Angin", "WiFi"], "photo_url": "https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=400", "notes": ""},
        {"name": "K-201", "floor": "2", "price": 1800000, "status": "occupied", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam", "Kulkas"], "photo_url": "https://images.unsplash.com/photo-1642541070065-3912f347e7c6?w=400", "notes": ""},
        {"name": "K-202", "floor": "2", "price": 1800000, "status": "vacant", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam"], "photo_url": "https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=400", "notes": ""},
        {"name": "K-203", "floor": "2", "price": 1600000, "status": "maintenance", "facilities": ["AC", "WiFi"], "photo_url": "https://images.unsplash.com/photo-1642541070065-3912f347e7c6?w=400", "notes": "Cat ulang & perbaikan AC"},
    ]
    room_ids = []
    for r in rooms_seed:
        r["created_at"] = now_iso()
        r["tenant_id"] = None
        ins = await db.rooms.insert_one(r)
        room_ids.append(str(ins.inserted_id))

    tenants_seed = [
        {"name": "Arya Wibowo", "phone": "0812-3456-7890", "id_number": "3273010101900001", "email": "arya@mail.com", "room_id": room_ids[0], "check_in": "2025-06-01", "check_out": "2026-06-01", "monthly_rent": 1500000, "deposit": 1500000, "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", "notes": ""},
        {"name": "Sinta Dewi", "phone": "0813-9876-5432", "id_number": "3273010202950002", "email": "sinta@mail.com", "room_id": room_ids[1], "check_in": "2025-08-15", "check_out": "2026-08-15", "monthly_rent": 1500000, "deposit": 1500000, "avatar_url": "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?w=200", "notes": ""},
        {"name": "Budi Santoso", "phone": "0821-1122-3344", "id_number": "3273010303880003", "email": "budi@mail.com", "room_id": room_ids[3], "check_in": "2025-01-10", "check_out": "2026-01-10", "monthly_rent": 1800000, "deposit": 1800000, "avatar_url": "https://images.unsplash.com/photo-1607503873903-c5e95f80d7b9?w=200", "notes": ""},
    ]
    tenant_ids = []
    for t in tenants_seed:
        t["status"] = "active"
        t["created_at"] = now_iso()
        ins = await db.tenants.insert_one(t)
        tid = str(ins.inserted_id)
        tenant_ids.append(tid)
        await db.rooms.update_one({"_id": ObjectId(t["room_id"])}, {"$set": {"tenant_id": tid}})

    # Bills - current month unpaid, last 2 months paid
    from datetime import date
    today = date.today()
    def period_ago(n):
        y = today.year
        m = today.month - n
        while m <= 0:
            m += 12
            y -= 1
        return f"{y:04d}-{m:02d}"

    bills = []
    for i, tid in enumerate(tenant_ids):
        rent = tenants_seed[i]["monthly_rent"]
        rid = tenants_seed[i]["room_id"]
        # Past 2 months paid
        for n in [2, 1]:
            bills.append({
                "tenant_id": tid, "room_id": rid, "period": period_ago(n),
                "rent": rent, "electricity": 150000, "water": 50000, "other": 0,
                "other_label": None, "due_date": f"{period_ago(n)}-05",
                "status": "paid", "paid_at": now_iso(), "payment_method": "transfer",
                "notes": "",
            })
        # Current month unpaid
        bills.append({
            "tenant_id": tid, "room_id": rid, "period": period_ago(0),
            "rent": rent, "electricity": 175000, "water": 60000, "other": 0,
            "other_label": None, "due_date": f"{period_ago(0)}-05",
            "status": "unpaid", "paid_at": None, "payment_method": None, "notes": "",
        })

    for b in bills:
        b["total"] = b["rent"] + b["electricity"] + b["water"] + b["other"]
        b["created_at"] = now_iso()
        await db.bills.insert_one(b)

    # Complaints
    complaints = [
        {"tenant_id": tenant_ids[0], "room_id": room_ids[0], "title": "Kran wastafel bocor", "description": "Air menetes terus dari kran wastafel kamar mandi.", "priority": "medium", "status": "open"},
        {"tenant_id": tenant_ids[2], "room_id": room_ids[3], "title": "Wi-Fi lambat malam hari", "description": "Koneksi internet turun drastis setelah jam 8 malam.", "priority": "low", "status": "in_progress"},
    ]
    for c in complaints:
        c["created_at"] = now_iso()
        c["resolved_at"] = None
        await db.complaints.insert_one(c)

    return {"ok": True, "rooms": len(rooms_seed), "tenants": len(tenants_seed), "bills": len(bills), "complaints": len(complaints)}


@api.get("/")
async def root():
    return {"service": "Lewi House API", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
