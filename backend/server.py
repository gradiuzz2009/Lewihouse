from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import secrets
import random
import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId
from bson.errors import InvalidId

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Lewi House API")


def oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid id")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def doc_to(model, doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return model(**doc)


# ============ AUTH ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


auth_router = APIRouter(prefix="/api/auth")
api = APIRouter(prefix="/api", dependencies=[Depends(get_current_user)])


class LoginPayload(BaseModel):
    email: str
    password: str


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


@auth_router.post("/login")
async def login(payload: LoginPayload, request: Request, response: Response):
    email = payload.email.strip().lower()
    identifier = email
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_at = datetime.fromisoformat(attempt["last_at"])
        if datetime.now(timezone.utc) - locked_at < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi 15 menit.")
        await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_at": now_iso()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Email atau password salah")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    access = create_access_token(uid, email, user.get("role", "admin"))
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    await log_audit("system", "LOGIN", "user", uid, {"email": email})
    return {"user": {"id": uid, "email": email, "name": user.get("name"), "role": user.get("role", "admin")},
            "access_token": access}


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@auth_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@auth_router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"], user.get("role", "admin"))
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ============ AUDIT ============
async def log_audit(actor: str, action: str, entity: str, entity_id: str, detail: dict = None):
    await db.audit_logs.insert_one({
        "at": now_iso(), "actor": actor, "action": action,
        "entity": entity, "entity_id": entity_id, "detail": detail or {},
    })


@api.get("/audit")
async def list_audit(limit: int = 60):
    docs = await db.audit_logs.find().sort("at", -1).to_list(min(limit, 200))
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


# ============ MODELS ============
ROOM_STATUSES = ["available", "reserved", "occupied", "cleaning", "maintenance"]
ROOM_TRANSITIONS = {
    "available": {"reserved", "occupied", "maintenance"},
    "reserved": {"occupied", "available"},
    "occupied": {"cleaning", "maintenance"},
    "cleaning": {"available", "maintenance"},
    "maintenance": {"cleaning", "available"},
}


class RoomBase(BaseModel):
    name: str
    floor: Optional[str] = "1"
    wing: Optional[str] = None
    room_type: str = "standard"  # standard | deluxe | vip | studio
    capacity: int = 1
    price: float
    deposit: float = 0
    status: str = "available"
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
    nik: Optional[str] = None
    email: Optional[str] = None
    occupation: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None
    room_id: Optional[str] = None
    lease_start: Optional[str] = None
    lease_end: Optional[str] = None
    monthly_rent: float = 0
    deposit: float = 0
    avatar_url: Optional[str] = None
    notes: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class Tenant(TenantBase):
    id: str
    status: str = "pending_assignment"  # pending_assignment | active | former
    deposit_settlement: Optional[dict] = None
    created_at: str


class Payment(BaseModel):
    amount: float
    method: str  # qris | bank_transfer | cash
    reference: Optional[str] = None
    paid_at: Optional[str] = None


class BillBase(BaseModel):
    tenant_id: str
    room_id: Optional[str] = None
    period: str
    rent: float = 0
    electricity: float = 0
    water: float = 0
    other: float = 0
    other_label: Optional[str] = None
    late_fee: float = 0
    due_date: Optional[str] = None
    status: str = "unpaid"  # unpaid | partially_paid | paid
    notes: Optional[str] = None


class BillCreate(BillBase):
    pass


class Bill(BillBase):
    id: str
    invoice_number: Optional[str] = None
    total: float
    amount_paid: float = 0
    payments: List[Payment] = []
    paid_at: Optional[str] = None
    payment_method: Optional[str] = None
    dunning_stage: int = 0
    is_overdue: bool = False
    created_at: str


TICKET_CATEGORIES = ["plumbing", "electrical", "ac", "furniture", "structural", "internet", "other"]


class TicketBase(BaseModel):
    tenant_id: Optional[str] = None
    room_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str = "other"
    priority: str = "medium"  # low | medium | high | urgent
    status: str = "pending"  # pending | in_progress | resolved | closed
    assignee: Optional[str] = None
    scheduled_at: Optional[str] = None
    cost_material: float = 0
    cost_labor: float = 0


class TicketCreate(TicketBase):
    pass


class Ticket(TicketBase):
    id: str
    created_at: str
    resolved_at: Optional[str] = None


class AccessTokenCreate(BaseModel):
    tenant_id: Optional[str] = None
    room_id: Optional[str] = None
    label: str
    token_type: str = "permanent"  # permanent | guest | vendor
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None


def gen_pin() -> str:
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def bill_total(d: dict) -> float:
    return d.get("rent", 0) + d.get("electricity", 0) + d.get("water", 0) + d.get("other", 0) + d.get("late_fee", 0)


def derive_bill(d: dict) -> dict:
    d.setdefault("invoice_number", None)
    d.setdefault("amount_paid", 0)
    d.setdefault("payments", [])
    d.setdefault("late_fee", 0)
    d.setdefault("dunning_stage", 0)
    d.setdefault("payment_method", None)
    d["is_overdue"] = False
    if d.get("status") != "paid" and d.get("due_date"):
        today = datetime.now(timezone.utc).date()
        try:
            due = date.fromisoformat(d["due_date"])
            days_late = (today - due).days
            if days_late > 0:
                d["is_overdue"] = True
                d["dunning_stage"] = 1 if days_late <= 3 else (2 if days_late <= 7 else 3)
        except ValueError:
            pass
    return d


def invoice_number_for(period: str, room_name: Optional[str]) -> str:
    suffix = (room_name or "GEN").replace("-", "").replace(" ", "").upper()
    return f"INV-{period.replace('-', '')}-{suffix}"


# ============ ROOMS ============
@api.get("/rooms", response_model=List[Room])
async def list_rooms():
    docs = await db.rooms.find().sort("name", 1).to_list(1000)
    return [doc_to(Room, d) for d in docs]


@api.post("/rooms", response_model=Room)
async def create_room(payload: RoomCreate, user: dict = Depends(get_current_user)):
    if payload.status not in ROOM_STATUSES:
        raise HTTPException(400, "Status kamar tidak valid")
    exists = await db.rooms.find_one({"name": payload.name})
    if exists:
        raise HTTPException(400, "Nomor kamar sudah dipakai")
    doc = payload.model_dump()
    doc["created_at"] = now_iso()
    doc["tenant_id"] = None
    r = await db.rooms.insert_one(doc)
    await log_audit(user["email"], "CREATE", "room", str(r.inserted_id), {"name": doc["name"]})
    return doc_to(Room, {**doc, "_id": r.inserted_id})


@api.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str):
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    return doc_to(Room, d)


@api.put("/rooms/{room_id}", response_model=Room)
async def update_room(room_id: str, payload: RoomCreate, user: dict = Depends(get_current_user)):
    if payload.status not in ROOM_STATUSES:
        raise HTTPException(400, "Status kamar tidak valid")
    dup = await db.rooms.find_one({"name": payload.name, "_id": {"$ne": oid(room_id)}})
    if dup:
        raise HTTPException(400, "Nomor kamar sudah dipakai")
    await db.rooms.update_one({"_id": oid(room_id)}, {"$set": payload.model_dump()})
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    await log_audit(user["email"], "UPDATE", "room", room_id, {"name": payload.name})
    return doc_to(Room, d)


class StatusPayload(BaseModel):
    status: str


@api.post("/rooms/{room_id}/status", response_model=Room)
async def transition_room(room_id: str, payload: StatusPayload, user: dict = Depends(get_current_user)):
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    cur, new = d.get("status", "available"), payload.status
    if new not in ROOM_STATUSES:
        raise HTTPException(400, "Status tidak valid")
    if new != cur and new not in ROOM_TRANSITIONS.get(cur, set()):
        raise HTTPException(400, f"Transisi {cur} → {new} tidak diizinkan")
    await db.rooms.update_one({"_id": oid(room_id)}, {"$set": {"status": new}})
    await log_audit(user["email"], "ROOM_STATUS", "room", room_id, {"from": cur, "to": new, "name": d.get("name")})
    d["status"] = new
    return doc_to(Room, d)


@api.delete("/rooms/{room_id}")
async def delete_room(room_id: str, user: dict = Depends(get_current_user)):
    d = await db.rooms.find_one({"_id": oid(room_id)})
    if not d:
        raise HTTPException(404, "Room not found")
    if d.get("status") == "occupied":
        raise HTTPException(400, "Kamar sedang dihuni, tidak bisa dihapus")
    await db.tenants.update_many({"room_id": room_id}, {"$set": {"room_id": None}})
    await db.rooms.delete_one({"_id": oid(room_id)})
    await log_audit(user["email"], "DELETE", "room", room_id, {"name": d.get("name")})
    return {"ok": True}


# ============ TENANTS ============
@api.get("/tenants", response_model=List[Tenant])
async def list_tenants(status: Optional[str] = None):
    q = {"status": status} if status else {}
    docs = await db.tenants.find(q).sort("created_at", -1).to_list(1000)
    return [doc_to(Tenant, d) for d in docs]


@api.post("/tenants", response_model=Tenant)
async def create_tenant(payload: TenantCreate, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["status"] = "pending_assignment"
    doc["deposit_settlement"] = None
    doc["created_at"] = now_iso()
    r = await db.tenants.insert_one(doc)
    tid = str(r.inserted_id)
    if doc.get("room_id"):
        await db.rooms.update_one(
            {"_id": oid(doc["room_id"])},
            {"$set": {"status": "reserved", "tenant_id": tid}},
        )
    await log_audit(user["email"], "CREATE", "tenant", tid, {"name": doc["name"]})
    return doc_to(Tenant, {**doc, "_id": r.inserted_id})


@api.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    return doc_to(Tenant, d)


@api.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, payload: TenantCreate, user: dict = Depends(get_current_user)):
    prev = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not prev:
        raise HTTPException(404, "Tenant not found")
    upd = payload.model_dump()
    await db.tenants.update_one({"_id": oid(tenant_id)}, {"$set": upd})
    prev_room, new_room = prev.get("room_id"), upd.get("room_id")
    if prev_room != new_room:
        if prev_room:
            await db.rooms.update_one({"_id": oid(prev_room)}, {"$set": {"status": "available", "tenant_id": None}})
        if new_room:
            new_status = "occupied" if prev.get("status") == "active" else "reserved"
            await db.rooms.update_one({"_id": oid(new_room)}, {"$set": {"status": new_status, "tenant_id": tenant_id}})
    await log_audit(user["email"], "UPDATE", "tenant", tenant_id, {"name": upd["name"]})
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    return doc_to(Tenant, d)


@api.post("/tenants/{tenant_id}/move-in", response_model=Tenant)
async def move_in(tenant_id: str, user: dict = Depends(get_current_user)):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    if not d.get("room_id"):
        raise HTTPException(400, "Penghuni belum memiliki kamar")
    if d.get("status") == "active":
        raise HTTPException(400, "Penghuni sudah aktif")
    await db.tenants.update_one({"_id": oid(tenant_id)}, {"$set": {"status": "active"}})
    await db.rooms.update_one({"_id": ObjectId(d["room_id"])}, {"$set": {"status": "occupied", "tenant_id": tenant_id}})
    room = await db.rooms.find_one({"_id": ObjectId(d["room_id"])})
    pin = gen_pin()
    await db.access_tokens.insert_one({
        "tenant_id": tenant_id, "room_id": d["room_id"],
        "label": f"PIN {d['name']} — {room.get('name') if room else ''}",
        "token_type": "permanent", "pin": pin,
        "valid_from": d.get("lease_start"), "valid_until": d.get("lease_end"),
        "status": "active", "created_at": now_iso(), "revoked_at": None,
    })
    await log_audit(user["email"], "MOVE_IN", "tenant", tenant_id, {"name": d["name"], "pin_issued": True})
    d["status"] = "active"
    return doc_to(Tenant, d)


class MoveOutPayload(BaseModel):
    deductions: List[dict] = []


@api.post("/tenants/{tenant_id}/move-out", response_model=Tenant)
async def move_out(tenant_id: str, payload: MoveOutPayload, user: dict = Depends(get_current_user)):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    total_deduction = sum(float(x.get("amount", 0)) for x in payload.deductions)
    refund = max(0, d.get("deposit", 0) - total_deduction)
    settlement = {
        "deductions": payload.deductions,
        "total_deduction": total_deduction,
        "refund": refund,
        "settled_at": now_iso(),
    }
    await db.tenants.update_one(
        {"_id": oid(tenant_id)},
        {"$set": {"status": "former", "deposit_settlement": settlement, "room_id": None}},
    )
    if d.get("room_id"):
        await db.rooms.update_one({"_id": ObjectId(d["room_id"])}, {"$set": {"status": "cleaning", "tenant_id": None}})
    await db.access_tokens.update_many(
        {"tenant_id": tenant_id, "status": "active"},
        {"$set": {"status": "revoked", "revoked_at": now_iso()}},
    )
    await log_audit(user["email"], "MOVE_OUT", "tenant", tenant_id,
                    {"name": d["name"], "refund": refund, "deductions": total_deduction})
    d.update({"status": "former", "deposit_settlement": settlement, "room_id": None})
    return doc_to(Tenant, d)


@api.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, user: dict = Depends(get_current_user)):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    if d.get("room_id"):
        await db.rooms.update_one({"_id": ObjectId(d["room_id"])}, {"$set": {"status": "available", "tenant_id": None}})
    await db.access_tokens.update_many({"tenant_id": tenant_id, "status": "active"},
                                       {"$set": {"status": "revoked", "revoked_at": now_iso()}})
    await db.tenants.delete_one({"_id": oid(tenant_id)})
    await log_audit(user["email"], "DELETE", "tenant", tenant_id)
    return {"ok": True}


# ============ BILLS ============
@api.get("/bills", response_model=List[Bill])
async def list_bills(status: Optional[str] = None, tenant_id: Optional[str] = None):
    q = {}
    if tenant_id:
        q["tenant_id"] = tenant_id
    docs = await db.bills.find(q).sort("created_at", -1).to_list(2000)
    docs = [derive_bill(d) for d in docs]
    if status == "overdue":
        docs = [d for d in docs if d.get("is_overdue")]
    elif status:
        docs = [d for d in docs if d.get("status") == status]
    return [doc_to(Bill, d) for d in docs]


@api.post("/bills", response_model=Bill)
async def create_bill(payload: BillCreate, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["total"] = bill_total(doc)
    room = await db.rooms.find_one({"_id": oid(doc["room_id"])}) if doc.get("room_id") else None
    doc["invoice_number"] = invoice_number_for(doc["period"], room.get("name") if room else None)
    doc["amount_paid"] = 0
    doc["payments"] = []
    doc["paid_at"] = None
    doc["payment_method"] = None
    doc["created_at"] = now_iso()
    r = await db.bills.insert_one(doc)
    await log_audit(user["email"], "CREATE", "bill", str(r.inserted_id), {"invoice": doc["invoice_number"]})
    return doc_to(Bill, derive_bill({**doc, "_id": r.inserted_id}))


class GeneratePayload(BaseModel):
    period: str  # YYYY-MM
    due_day: int = 5


@api.post("/bills/generate")
async def generate_bills(payload: GeneratePayload, user: dict = Depends(get_current_user)):
    tenants = await db.tenants.find({"status": "active"}).to_list(1000)
    created = 0
    for t in tenants:
        tid = str(t["_id"])
        existing = await db.bills.find_one({"tenant_id": tid, "period": payload.period})
        if existing:
            continue
        room = await db.rooms.find_one({"_id": ObjectId(t["room_id"])}) if t.get("room_id") else None
        doc = {
            "tenant_id": tid, "room_id": t.get("room_id"), "period": payload.period,
            "rent": t.get("monthly_rent", 0), "electricity": 0, "water": 0, "other": 0,
            "other_label": None, "late_fee": 0,
            "due_date": f"{payload.period}-{payload.due_day:02d}",
            "status": "unpaid", "notes": None,
            "invoice_number": invoice_number_for(payload.period, room.get("name") if room else None),
            "amount_paid": 0, "payments": [], "paid_at": None, "payment_method": None,
            "created_at": now_iso(),
        }
        doc["total"] = bill_total(doc)
        await db.bills.insert_one(doc)
        created += 1
    await log_audit(user["email"], "BILL_RUN", "bill", payload.period, {"created": created})
    return {"ok": True, "created": created, "period": payload.period}


@api.put("/bills/{bill_id}", response_model=Bill)
async def update_bill(bill_id: str, payload: BillCreate, user: dict = Depends(get_current_user)):
    upd = payload.model_dump()
    upd["total"] = bill_total(upd)
    await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd})
    d = await db.bills.find_one({"_id": oid(bill_id)})
    if not d:
        raise HTTPException(404, "Bill not found")
    if d.get("amount_paid", 0) >= d["total"] and d["total"] > 0:
        await db.bills.update_one({"_id": oid(bill_id)}, {"$set": {"status": "paid"}})
        d["status"] = "paid"
    await log_audit(user["email"], "UPDATE", "bill", bill_id, {"invoice": d.get("invoice_number")})
    return doc_to(Bill, derive_bill(d))


class PaymentPayload(BaseModel):
    amount: float
    method: str  # qris | bank_transfer | cash
    reference: Optional[str] = None


@api.post("/bills/{bill_id}/payments", response_model=Bill)
async def record_payment(bill_id: str, payload: PaymentPayload, user: dict = Depends(get_current_user)):
    d = await db.bills.find_one({"_id": oid(bill_id)})
    if not d:
        raise HTTPException(404, "Bill not found")
    if payload.amount <= 0:
        raise HTTPException(400, "Nominal harus lebih dari 0")
    payment = {"amount": payload.amount, "method": payload.method,
               "reference": payload.reference, "paid_at": now_iso()}
    amount_paid = d.get("amount_paid", 0) + payload.amount
    total = d.get("total", bill_total(d))
    new_status = "paid" if amount_paid >= total else "partially_paid"
    upd = {"amount_paid": amount_paid, "status": new_status, "payment_method": payload.method}
    if new_status == "paid":
        upd["paid_at"] = now_iso()
    await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd, "$push": {"payments": payment}})
    await log_audit(user["email"], "PAYMENT", "bill", bill_id,
                    {"invoice": d.get("invoice_number"), "amount": payload.amount, "method": payload.method})
    d = await db.bills.find_one({"_id": oid(bill_id)})
    return doc_to(Bill, derive_bill(d))


@api.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, user: dict = Depends(get_current_user)):
    r = await db.bills.delete_one({"_id": oid(bill_id)})
    if r.deleted_count == 0:
        raise HTTPException(404, "Bill not found")
    await log_audit(user["email"], "DELETE", "bill", bill_id)
    return {"ok": True}


# ============ MAINTENANCE TICKETS ============
TICKET_TRANSITIONS = {
    "pending": {"in_progress", "closed"},
    "in_progress": {"resolved", "pending"},
    "resolved": {"closed", "in_progress"},
    "closed": set(),
}


@api.get("/complaints", response_model=List[Ticket])
async def list_tickets():
    docs = await db.complaints.find().sort("created_at", -1).to_list(1000)
    return [doc_to(Ticket, d) for d in docs]


@api.post("/complaints", response_model=Ticket)
async def create_ticket(payload: TicketCreate, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["created_at"] = now_iso()
    doc["resolved_at"] = None
    r = await db.complaints.insert_one(doc)
    await log_audit(user["email"], "CREATE", "ticket", str(r.inserted_id), {"title": doc["title"]})
    return doc_to(Ticket, {**doc, "_id": r.inserted_id})


@api.put("/complaints/{cid}", response_model=Ticket)
async def update_ticket(cid: str, payload: TicketCreate, user: dict = Depends(get_current_user)):
    upd = payload.model_dump()
    if upd["status"] in ("resolved", "closed"):
        upd["resolved_at"] = now_iso()
    await db.complaints.update_one({"_id": oid(cid)}, {"$set": upd})
    d = await db.complaints.find_one({"_id": oid(cid)})
    if not d:
        raise HTTPException(404, "Ticket not found")
    await log_audit(user["email"], "UPDATE", "ticket", cid, {"title": upd["title"]})
    return doc_to(Ticket, d)


class TicketStatusPayload(BaseModel):
    status: str
    cost_material: Optional[float] = None
    cost_labor: Optional[float] = None


@api.post("/complaints/{cid}/status", response_model=Ticket)
async def transition_ticket(cid: str, payload: TicketStatusPayload, user: dict = Depends(get_current_user)):
    d = await db.complaints.find_one({"_id": oid(cid)})
    if not d:
        raise HTTPException(404, "Ticket not found")
    cur, new = d.get("status", "pending"), payload.status
    if new != cur and new not in TICKET_TRANSITIONS.get(cur, set()):
        raise HTTPException(400, f"Transisi {cur} → {new} tidak diizinkan")
    upd = {"status": new}
    if payload.cost_material is not None:
        upd["cost_material"] = payload.cost_material
    if payload.cost_labor is not None:
        upd["cost_labor"] = payload.cost_labor
    if new in ("resolved", "closed"):
        upd["resolved_at"] = now_iso()
    await db.complaints.update_one({"_id": oid(cid)}, {"$set": upd})
    await log_audit(user["email"], "TICKET_STATUS", "ticket", cid, {"from": cur, "to": new, "title": d.get("title")})
    d.update(upd)
    return doc_to(Ticket, d)


@api.delete("/complaints/{cid}")
async def delete_ticket(cid: str, user: dict = Depends(get_current_user)):
    r = await db.complaints.delete_one({"_id": oid(cid)})
    if r.deleted_count == 0:
        raise HTTPException(404, "Ticket not found")
    await log_audit(user["email"], "DELETE", "ticket", cid)
    return {"ok": True}


# ============ ACCESS TOKENS ============
@api.get("/access-tokens")
async def list_access_tokens():
    docs = await db.access_tokens.find().sort("created_at", -1).to_list(500)
    now = now_iso()
    out = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        if d.get("status") == "active" and d.get("valid_until") and d["valid_until"] < now[:len(d["valid_until"])]:
            d["status"] = "expired"
        out.append(d)
    return out


@api.post("/access-tokens")
async def create_access_token_ep(payload: AccessTokenCreate, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["pin"] = gen_pin()
    doc["status"] = "active"
    doc["created_at"] = now_iso()
    doc["revoked_at"] = None
    r = await db.access_tokens.insert_one(doc)
    doc["id"] = str(r.inserted_id)
    doc.pop("_id", None)
    await log_audit(user["email"], "TOKEN_ISSUE", "access_token", doc["id"],
                    {"label": doc["label"], "type": doc["token_type"]})
    return doc


@api.post("/access-tokens/{token_id}/revoke")
async def revoke_access_token(token_id: str, user: dict = Depends(get_current_user)):
    d = await db.access_tokens.find_one({"_id": oid(token_id)})
    if not d:
        raise HTTPException(404, "Token not found")
    await db.access_tokens.update_one({"_id": oid(token_id)},
                                      {"$set": {"status": "revoked", "revoked_at": now_iso()}})
    await log_audit(user["email"], "TOKEN_REVOKE", "access_token", token_id, {"label": d.get("label")})
    return {"ok": True}


# ============ DASHBOARD & REPORTS ============
@api.get("/dashboard/summary")
async def dashboard_summary():
    rooms_total = await db.rooms.count_documents({})
    counts = {}
    for s in ROOM_STATUSES:
        counts[s] = await db.rooms.count_documents({"status": s})
    tenants_active = await db.tenants.count_documents({"status": "active"})

    unpaid_docs = await db.bills.find({"status": {"$in": ["unpaid", "partially_paid"]}}).to_list(5000)
    outstanding = sum(b.get("total", 0) - b.get("amount_paid", 0) for b in unpaid_docs)

    period = datetime.now(timezone.utc).strftime("%Y-%m")
    month_bills = await db.bills.find({"period": period}).to_list(5000)
    revenue_month = sum(b.get("amount_paid", 0) if b.get("payments") else (b.get("total", 0) if b.get("status") == "paid" else 0) for b in month_bills)

    active_maintenance = await db.complaints.count_documents({"status": {"$in": ["pending", "in_progress"]}})
    active_tokens = await db.access_tokens.count_documents({"status": "active"})
    occupancy_rate = round((counts["occupied"] / rooms_total) * 100) if rooms_total else 0

    return {
        "rooms_total": rooms_total,
        "rooms_occupied": counts["occupied"],
        "rooms_available": counts["available"],
        "rooms_reserved": counts["reserved"],
        "rooms_cleaning": counts["cleaning"],
        "rooms_maintenance": counts["maintenance"],
        "tenants_active": tenants_active,
        "outstanding": outstanding,
        "unpaid_count": len(unpaid_docs),
        "revenue_month": revenue_month,
        "occupancy_rate": occupancy_rate,
        "active_maintenance": active_maintenance,
        "active_tokens": active_tokens,
        "period": period,
    }


@api.get("/reports/monthly")
async def monthly_report(months: int = 6):
    docs = await db.bills.find().to_list(10000)
    by_period = {}
    for b in docs:
        p = b.get("period", "")
        paid = b.get("amount_paid", 0) if b.get("payments") else (b.get("total", 0) if b.get("status") == "paid" else 0)
        by_period[p] = by_period.get(p, 0) + paid
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        y, m = today.year, today.month - i
        while m <= 0:
            m += 12
            y -= 1
        period = f"{y:04d}-{m:02d}"
        result.append({"period": period, "income": by_period.get(period, 0)})
    return result


# ============ SEED ============
@api.post("/seed")
async def seed_data(user: dict = Depends(get_current_user)):
    for col in ["rooms", "tenants", "bills", "complaints", "access_tokens", "audit_logs"]:
        await db[col].delete_many({})

    rooms_seed = [
        {"name": "K-101", "floor": "1", "wing": "A", "room_type": "standard", "capacity": 1, "price": 1500000, "deposit": 1500000, "status": "occupied", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/styxa5t5_agoda-12-superior-single.webp", "notes": ""},
        {"name": "K-102", "floor": "1", "wing": "A", "room_type": "standard", "capacity": 1, "price": 1500000, "deposit": 1500000, "status": "occupied", "facilities": ["AC", "WiFi"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/biwap049_agoda-10-deluxe-bed.webp", "notes": ""},
        {"name": "K-103", "floor": "1", "wing": "A", "room_type": "studio", "capacity": 2, "price": 1200000, "deposit": 1200000, "status": "available", "facilities": ["Kipas Angin", "WiFi"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/styxa5t5_agoda-12-superior-single.webp", "notes": ""},
        {"name": "K-201", "floor": "2", "wing": "B", "room_type": "deluxe", "capacity": 1, "price": 1800000, "deposit": 1800000, "status": "occupied", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam", "Kulkas"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/biwap049_agoda-10-deluxe-bed.webp", "notes": ""},
        {"name": "K-202", "floor": "2", "wing": "B", "room_type": "deluxe", "capacity": 1, "price": 1800000, "deposit": 1800000, "status": "cleaning", "facilities": ["AC", "WiFi", "Kamar Mandi Dalam"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/styxa5t5_agoda-12-superior-single.webp", "notes": "Turnover setelah check-out"},
        {"name": "K-203", "floor": "2", "wing": "B", "room_type": "vip", "capacity": 2, "price": 2200000, "deposit": 2200000, "status": "maintenance", "facilities": ["AC", "WiFi", "Water Heater"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/biwap049_agoda-10-deluxe-bed.webp", "notes": "Cat ulang & perbaikan AC"},
        {"name": "K-204", "floor": "2", "wing": "B", "room_type": "standard", "capacity": 1, "price": 1500000, "deposit": 1500000, "status": "reserved", "facilities": ["AC", "WiFi"], "photo_url": "https://customer-assets-0z36b82j.emergentagent.net/job_dorm-hub-31/artifacts/styxa5t5_agoda-12-superior-single.webp", "notes": ""},
    ]
    room_ids = []
    for r in rooms_seed:
        r["created_at"] = now_iso()
        r["tenant_id"] = None
        ins = await db.rooms.insert_one(r)
        room_ids.append(str(ins.inserted_id))

    tenants_seed = [
        {"name": "Arya Wibowo", "phone": "0812-3456-7890", "nik": "3273010101900001", "email": "arya@mail.com", "occupation": "Software Engineer", "emergency_name": "Dewi Wibowo", "emergency_relation": "Ibu", "emergency_phone": "0811-2233-4455", "room_id": room_ids[0], "lease_start": "2025-06-01", "lease_end": "2026-06-01", "monthly_rent": 1500000, "deposit": 1500000, "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", "notes": "", "status": "active"},
        {"name": "Sinta Dewi", "phone": "0813-9876-5432", "nik": "3273010202950002", "email": "sinta@mail.com", "occupation": "Desainer Grafis", "emergency_name": "Rudi Hartono", "emergency_relation": "Ayah", "emergency_phone": "0812-9988-7766", "room_id": room_ids[1], "lease_start": "2025-08-15", "lease_end": "2026-08-15", "monthly_rent": 1500000, "deposit": 1500000, "avatar_url": "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?w=200", "notes": "", "status": "active"},
        {"name": "Budi Santoso", "phone": "0821-1122-3344", "nik": "3273010303880003", "email": "budi@mail.com", "occupation": "Akuntan", "emergency_name": "Rina Santoso", "emergency_relation": "Istri", "emergency_phone": "0813-5566-7788", "room_id": room_ids[3], "lease_start": "2025-01-10", "lease_end": "2026-07-10", "monthly_rent": 1800000, "deposit": 1800000, "avatar_url": "https://images.unsplash.com/photo-1607503873903-c5e95f80d7b9?w=200", "notes": "", "status": "active"},
        {"name": "Maya Putri", "phone": "0856-4433-2211", "nik": "3273010404980004", "email": "maya@mail.com", "occupation": "Mahasiswa", "emergency_name": "Sari Putri", "emergency_relation": "Ibu", "emergency_phone": "0817-6655-4433", "room_id": room_ids[6], "lease_start": "2026-07-01", "lease_end": "2027-07-01", "monthly_rent": 1500000, "deposit": 1500000, "avatar_url": None, "notes": "Calon penghuni, sudah bayar DP", "status": "pending_assignment"},
    ]
    tenant_ids = []
    for t in tenants_seed:
        t["deposit_settlement"] = None
        t["created_at"] = now_iso()
        ins = await db.tenants.insert_one(t)
        tid = str(ins.inserted_id)
        tenant_ids.append(tid)
        if t.get("room_id"):
            await db.rooms.update_one({"_id": ObjectId(t["room_id"])}, {"$set": {"tenant_id": tid}})

    today = date.today()

    def period_ago(n):
        y, m = today.year, today.month - n
        while m <= 0:
            m += 12
            y -= 1
        return f"{y:04d}-{m:02d}"

    bills = []
    room_names = {room_ids[i]: rooms_seed[i]["name"] for i in range(len(room_ids))}
    for i in [0, 1, 2]:
        tid = tenant_ids[i]
        rent = tenants_seed[i]["monthly_rent"]
        rid = tenants_seed[i]["room_id"]
        for n in [2, 1]:
            p = period_ago(n)
            total = rent + 150000 + 50000
            bills.append({
                "tenant_id": tid, "room_id": rid, "period": p,
                "invoice_number": invoice_number_for(p, room_names.get(rid)),
                "rent": rent, "electricity": 150000, "water": 50000, "other": 0,
                "other_label": None, "late_fee": 0, "due_date": f"{p}-05",
                "status": "paid", "total": total, "amount_paid": total,
                "payments": [{"amount": total, "method": "bank_transfer", "reference": f"TRF{p.replace('-', '')}{i}", "paid_at": now_iso()}],
                "paid_at": now_iso(), "payment_method": "bank_transfer", "notes": "",
            })
        p = period_ago(0)
        total = rent + 175000 + 60000
        bills.append({
            "tenant_id": tid, "room_id": rid, "period": p,
            "invoice_number": invoice_number_for(p, room_names.get(rid)),
            "rent": rent, "electricity": 175000, "water": 60000, "other": 0,
            "other_label": None, "late_fee": 0, "due_date": f"{p}-05",
            "status": "unpaid", "total": total, "amount_paid": 0,
            "payments": [], "paid_at": None, "payment_method": None, "notes": "",
        })
    bills[-1]["amount_paid"] = 800000
    bills[-1]["status"] = "partially_paid"
    bills[-1]["payments"] = [{"amount": 800000, "method": "qris", "reference": "QR889123", "paid_at": now_iso()}]

    for b in bills:
        b["created_at"] = now_iso()
        await db.bills.insert_one(b)

    tickets = [
        {"tenant_id": tenant_ids[0], "room_id": room_ids[0], "title": "Kran wastafel bocor", "description": "Air menetes terus dari kran wastafel kamar mandi.", "category": "plumbing", "priority": "medium", "status": "pending", "assignee": None, "scheduled_at": None, "cost_material": 0, "cost_labor": 0},
        {"tenant_id": tenant_ids[2], "room_id": room_ids[3], "title": "Wi-Fi lambat malam hari", "description": "Koneksi internet turun drastis setelah jam 8 malam.", "category": "internet", "priority": "low", "status": "in_progress", "assignee": "Pak Joko", "scheduled_at": None, "cost_material": 0, "cost_labor": 0},
        {"tenant_id": None, "room_id": room_ids[5], "title": "AC tidak dingin", "description": "AC K-203 perlu isi freon dan service besar.", "category": "ac", "priority": "high", "status": "in_progress", "assignee": "CV Teknik Dingin", "scheduled_at": None, "cost_material": 350000, "cost_labor": 150000},
    ]
    for c in tickets:
        c["created_at"] = now_iso()
        c["resolved_at"] = None
        await db.complaints.insert_one(c)

    tokens = [
        {"tenant_id": tenant_ids[0], "room_id": room_ids[0], "label": "PIN Arya Wibowo — K-101", "token_type": "permanent", "pin": gen_pin(), "valid_from": "2025-06-01", "valid_until": "2026-06-01", "status": "active", "revoked_at": None},
        {"tenant_id": tenant_ids[1], "room_id": room_ids[1], "label": "PIN Sinta Dewi — K-102", "token_type": "permanent", "pin": gen_pin(), "valid_from": "2025-08-15", "valid_until": "2026-08-15", "status": "active", "revoked_at": None},
        {"tenant_id": None, "room_id": room_ids[5], "label": "Vendor CV Teknik Dingin", "token_type": "vendor", "pin": gen_pin(), "valid_from": today.isoformat(), "valid_until": today.isoformat(), "status": "active", "revoked_at": None},
    ]
    for tk in tokens:
        tk["created_at"] = now_iso()
        await db.access_tokens.insert_one(tk)

    await log_audit(user["email"], "SEED", "system", "seed", {"rooms": len(rooms_seed), "tenants": len(tenants_seed)})
    return {"ok": True, "rooms": len(rooms_seed), "tenants": len(tenants_seed), "bills": len(bills), "tickets": len(tickets), "tokens": len(tokens)}


@app.get("/api/")
async def root():
    return {"service": "Lewi House API", "status": "ok"}


app.include_router(auth_router)
app.include_router(api)

_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]
if "*" in _origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.rooms.create_index("name")
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin Lewi House", "role": "owner", "created_at": now_iso(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


@app.on_event("shutdown")
async def shutdown():
    client.close()
