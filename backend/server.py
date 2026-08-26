"""Lewi House Kosan Management Backend Server."""

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import secrets
import random
import json
import asyncio
import bcrypt
import jwt
import urllib.parse
import hashlib
import hmac
import httpx
import base64
from pywebpush import webpush, WebPushException
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, WebSocket, WebSocketDisconnect, Query
from starlette.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId
from bson.errors import InvalidId
from firestore_sync import firestore_sync

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
VAPID_PUBLIC_KEY = os.environ["VAPID_PUBLIC_KEY"]
VAPID_PRIVATE_KEY_FILE = str(ROOT_DIR / os.environ["VAPID_PRIVATE_KEY_FILE"])
VAPID_SUBJECT = os.environ["VAPID_SUBJECT"]

MIDTRANS_SERVER_KEY = os.environ.get("MIDTRANS_SERVER_KEY", "")
MIDTRANS_CLIENT_KEY = os.environ.get("MIDTRANS_CLIENT_KEY", "")
MIDTRANS_IS_PRODUCTION = os.environ.get("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"
MIDTRANS_SNAP_URL = "https://app.midtrans.com/snap/v1/transactions" if MIDTRANS_IS_PRODUCTION else "https://app.sandbox.midtrans.com/snap/v1/transactions"

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


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") == "tenant":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


async def require_tenant(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "tenant" or not user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Tenant only")
    return user


api = APIRouter(prefix="/api", dependencies=[Depends(require_admin)])
portal = APIRouter(prefix="/api/portal")
common = APIRouter(prefix="/api", dependencies=[Depends(get_current_user)])
payment_router = APIRouter(prefix="/api/payments")


class LoginPayload(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


def norm_phone(p: str) -> str:
    return "".join(ch for ch in (p or "") if ch.isdigit())


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


@auth_router.post("/login")
async def login(payload: LoginPayload, request: Request, response: Response):
    ident = (payload.identifier or payload.email or "").strip().lower()
    if not ident:
        raise HTTPException(status_code=400, detail="Email / No. HP wajib diisi")
    identifier = ident
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_at = datetime.fromisoformat(attempt["last_at"])
        if datetime.now(timezone.utc) - locked_at < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi 15 menit.")
        await db.login_attempts.delete_one({"identifier": identifier})
    if "@" in ident:
        user = await db.users.find_one({"email": ident})
    else:
        user = await db.users.find_one({"phone": norm_phone(ident)})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_at": now_iso()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Email/No. HP atau password salah")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    role = user.get("role", "admin")
    access = create_access_token(uid, user.get("email") or user.get("phone", ""), role)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    await log_audit("system", "LOGIN", "user", uid, {"identifier": ident, "role": role})
    return {"user": {"id": uid, "email": user.get("email"), "phone": user.get("phone"),
                     "name": user.get("name"), "role": role, "tenant_id": user.get("tenant_id")},
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
        access = create_access_token(str(user["_id"]), user.get("email") or user.get("phone", ""), user.get("role", "admin"))
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
    portal_password: Optional[str] = None
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
    portal_pw = await create_portal_account(tid, doc)
    doc["portal_password"] = portal_pw
    await log_audit(user["email"], "CREATE", "tenant", tid, {"name": doc["name"], "app_password_generated": bool(portal_pw)})
    return doc_to(Tenant, {**doc, "_id": r.inserted_id, "portal_password": portal_pw})


@api.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    if not d.get("portal_password"):
        pw = await create_portal_account(tenant_id, d)
        d["portal_password"] = pw
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
    if not prev.get("portal_password") or prev.get("phone") != upd.get("phone") or prev.get("email") != upd.get("email"):
        portal_pw = await create_portal_account(tenant_id, {**prev, **upd})
        upd["portal_password"] = portal_pw
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
    portal_pw = await create_portal_account(tenant_id, d)
    await notify_tenant(tenant_id, "welcome", {"name": d["name"]},
                        "Selamat datang di Lewi House", "Akun portal Anda aktif. Cek tagihan & ajukan tiket di sini.")
    d["status"] = "active"
    d["portal_password"] = portal_pw
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
    await remove_portal_account(tenant_id)
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
    await remove_portal_account(tenant_id)
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


def format_whatsapp_reminder(bill: dict, tenant: dict, room: dict, stage: str = "due_soon") -> str:
    tname = tenant.get("name", "Penghuni") if tenant else "Penghuni"
    rname = room.get("name", "-") if room else "Kamar"
    inv = bill.get("invoice_number", "-")
    total = float(bill.get("total", 0))
    paid = float(bill.get("amount_paid", 0))
    remaining = max(0, total - paid)
    due_date = bill.get("due_date", "-")
    
    greeting = f"Halo Kak *{tname}*,"
    if stage == "due_soon":
        header = "🔔 *PENGINGAT JATUH TEMPO TAGIHAN KOSAN (H-3)*"
        intro = f"Berikut kami sampaikan rincian tagihan sewa kamar *{rname}* yang akan jatuh tempo pada *{due_date}*:"
    elif stage == "due_today":
        header = "⚠️ *PENGINGAT HARI JATUH TEMPO (H-0)*"
        intro = f"Hari ini adalah batas waktu pembayaran tagihan sewa kamar *{rname}* ({due_date}):"
    elif stage == "overdue_1":
        header = "❗ *PEMBERITAHUAN KETERLAMBATAN (H+1)*"
        intro = f"Tagihan sewa kamar *{rname}* telah melewati batas jatuh tempo ({due_date}). Mohon untuk segera melakukan pembayaran:"
    elif stage in ("overdue_2", "overdue_3"):
        header = "🚨 *SURAT PERINGATAN KETERLAMBATAN (FINAL NOTICE)*"
        intro = f"Tagihan sewa kamar *{rname}* berstatus BELUM LUNAS melewati jatuh tempo ({due_date}). Mohon segera diselesaikan:"
    else:
        header = "📄 *RINCIAN TAGIHAN LEWI HOUSE*"
        intro = f"Berikut adalah rincian tagihan sewa kamar *{rname}*:"

    rincian = []
    if bill.get("rent"): rincian.append(f"• Sewa Kamar: Rp {int(bill['rent']):,}".replace(",", "."))
    if bill.get("electricity"): rincian.append(f"• Listrik / PLN: Rp {int(bill['electricity']):,}".replace(",", "."))
    if bill.get("water"): rincian.append(f"• Air / PDAM: Rp {int(bill['water']):,}".replace(",", "."))
    if bill.get("other"): rincian.append(f"• {bill.get('other_label') or 'Biaya Lain'}: Rp {int(bill['other']):,}".replace(",", "."))
    if bill.get("late_fee"): rincian.append(f"• Denda Keterlambatan: Rp {int(bill['late_fee']):,}".replace(",", "."))
    rincian_str = "\n".join(rincian) if rincian else "• Sewa Kamar Standar"

    total_fmt = f"Rp {int(total):,}".replace(",", ".")
    paid_fmt = f"Rp {int(paid):,}".replace(",", ".")
    rem_fmt = f"Rp {int(remaining):,}".replace(",", ".")

    msg = f"""{header}
*LEWI HOUSE BOUTIQUE LIVING*

{greeting}
{intro}

📋 *No. Invoice:* {inv}
🏠 *Kamar:* {rname}
🗓️ *Periode:* {bill.get('period', '-')}
📅 *Jatuh Tempo:* {due_date}

*Rincian Biaya:*
{rincian_str}
-------------------------
💰 *Total Tagihan:* {total_fmt}
💳 *Sudah Dibayar:* {paid_fmt}
❗ *Sisa Pembayaran:* *{rem_fmt}*

*Metode Pembayaran Resmi:*
1. *Aplikasi Portal Penghuni* (QRIS Instant / Virtual Account)
2. *Transfer Bank BCA:*
   • No. Rekening: `8830912881`
   • Atas Nama: *Lewi House Management*
3. *Transfer Bank Mandiri:*
   • No. Rekening: `1320098765432`
   • Atas Nama: *Lewi House Management*

_Setelah transfer, mohon konfirmasi via aplikasi portal atau chat ini._
_Terima kasih atas kerjasamanya! 🙏_"""
    return msg.strip()


def to_wa_phone(raw: str) -> str:
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if digits.startswith("08"):
        return "628" + digits[2:]
    if digits.startswith("8"):
        return "62" + digits
    if digits.startswith("62"):
        return digits
    return digits


@api.get("/bills/{bill_id}/whatsapp-link")
async def get_bill_whatsapp_link(bill_id: str):
    bill = await db.bills.find_one({"_id": oid(bill_id)})
    if not bill:
        raise HTTPException(404, "Bill not found")
    tenant = await db.tenants.find_one({"_id": ObjectId(bill["tenant_id"])}) if bill.get("tenant_id") else None
    room = await db.rooms.find_one({"_id": ObjectId(bill["room_id"])}) if bill.get("room_id") else None
    stage = _bill_stage(bill) or "info"
    phone_clean = to_wa_phone(tenant.get("phone", "")) if tenant else ""
    msg = format_whatsapp_reminder(bill, tenant, room, stage)
    encoded = urllib.parse.quote(msg)
    wa_url = f"https://wa.me/{phone_clean}?text={encoded}" if phone_clean else ""
    return {
        "bill_id": bill_id,
        "phone": tenant.get("phone") if tenant else None,
        "wa_phone": phone_clean,
        "stage": stage,
        "message": msg,
        "whatsapp_url": wa_url,
    }


@api.post("/bills/{bill_id}/simulate-payment", response_model=Bill)
async def admin_simulate_payment(bill_id: str, user: dict = Depends(get_current_user)):
    bill = await db.bills.find_one({"_id": oid(bill_id)})
    if not bill:
        raise HTTPException(404, "Bill not found")
    remaining = max(0, bill.get("total", 0) - bill.get("amount_paid", 0))
    if remaining <= 0:
        return doc_to(Bill, derive_bill(bill))
    ref = f"SIM-ADMIN-{int(datetime.now().timestamp())}"
    payment = {"amount": remaining, "method": "qris", "reference": ref, "paid_at": now_iso()}
    upd = {
        "amount_paid": bill.get("total", 0),
        "status": "paid",
        "paid_at": now_iso(),
        "payment_method": "qris",
    }
    await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd, "$push": {"payments": payment}})
    await log_audit(user["email"], "PAYMENT_SIMULATION", "bill", bill_id, {"amount": remaining, "reference": ref})
    if bill.get("tenant_id"):
        await notify_tenant(bill["tenant_id"], "payment_success", {"invoice": bill.get("invoice_number"), "amount": remaining},
                            "Pembayaran Berhasil Dikonfirmasi", f"Tagihan {bill.get('invoice_number')} sebesar Rp {int(remaining):,} telah LUNAS.".replace(",", "."), "/portal/bills")
    updated = await db.bills.find_one({"_id": oid(bill_id)})
    return doc_to(Bill, derive_bill(updated))


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


# ============ PORTAL ACCOUNTS ============
async def create_portal_account(tenant_id: str, tenant: dict) -> str:
    phone = norm_phone(tenant.get("phone", ""))
    email = (tenant.get("email") or "").strip().lower()
    
    if tenant.get("portal_password"):
        pw = tenant["portal_password"]
    elif phone and len(phone) >= 4:
        pw = "lewi" + phone[-4:]
    else:
        pw = f"lewi{random.SystemRandom().randint(1000, 9999)}"
        
    pw_hash = hash_password(pw)
    
    query_cond = [{"tenant_id": tenant_id, "role": "tenant"}]
    if phone:
        query_cond.append({"phone": phone, "role": "tenant"})
    if email:
        query_cond.append({"email": email, "role": "tenant"})
    existing = await db.users.find_one({"$or": query_cond})
    
    if existing:
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "tenant_id": tenant_id,
                "name": tenant.get("name", "Penghuni"),
                "phone": phone or existing.get("phone"),
                "email": email or existing.get("email"),
                "password_hash": pw_hash,
                "role": "tenant",
                "is_active": True,
            }}
        )
    else:
        await db.users.insert_one({
            "phone": phone or None,
            "email": email or None,
            "name": tenant.get("name", "Penghuni"),
            "role": "tenant",
            "tenant_id": tenant_id,
            "password_hash": pw_hash,
            "is_active": True,
            "created_at": now_iso(),
        })
    await db.tenants.update_one({"_id": ObjectId(tenant_id)}, {"$set": {"portal_password": pw}})
    return pw


async def remove_portal_account(tenant_id: str):
    users = await db.users.find({"tenant_id": tenant_id, "role": "tenant"}).to_list(10)
    for u in users:
        await db.push_subscriptions.delete_many({"user_id": str(u["_id"])})
    await db.users.delete_many({"tenant_id": tenant_id, "role": "tenant"})
    await db.tenants.update_one({"_id": ObjectId(tenant_id)}, {"$set": {"portal_password": None}})


@api.post("/tenants/{tenant_id}/reset-portal-password")
async def reset_portal_password(tenant_id: str, user: dict = Depends(get_current_user)):
    d = await db.tenants.find_one({"_id": oid(tenant_id)})
    if not d:
        raise HTTPException(404, "Tenant not found")
    phone = norm_phone(d.get("phone", ""))
    acct = await db.users.find_one({"tenant_id": tenant_id, "role": "tenant"})
    if not acct and d.get("status") != "active":
        raise HTTPException(400, "Penghuni belum aktif")
    pw = f"{random.SystemRandom().randint(0, 999999):06d}"
    if acct:
        await db.users.update_one({"_id": acct["_id"]}, {"$set": {"password_hash": hash_password(pw), "phone": phone}})
    else:
        await db.users.insert_one({"phone": phone, "email": d.get("email"), "name": d["name"], "role": "tenant",
                                   "tenant_id": tenant_id, "password_hash": hash_password(pw), "created_at": now_iso()})
    await db.tenants.update_one({"_id": oid(tenant_id)}, {"$set": {"portal_password": pw}})
    await log_audit(user["email"], "PORTAL_RESET", "tenant", tenant_id, {"name": d["name"]})
    return {"ok": True, "portal_password": pw, "phone": phone}


# ============ PUSH NOTIFICATIONS ============
async def send_push_to_user(user_id: str, title: str, body: str, url: str = "/"):
    subs = await db.push_subscriptions.find({"user_id": user_id}).to_list(20)
    payload = json.dumps({"title": title, "body": body, "url": url})
    for s in subs:
        try:
            webpush(
                subscription_info=s["subscription"],
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY_FILE,
                vapid_claims={"sub": VAPID_SUBJECT},
            )
        except WebPushException:
            await db.push_subscriptions.delete_one({"_id": s["_id"]})
        except Exception:
            pass


async def notify_tenant(tenant_id: str, ntype: str, data: dict, title: str, body: str, url: str = "/"):
    acct = await db.users.find_one({"tenant_id": tenant_id, "role": "tenant"})
    if not acct:
        return
    uid = str(acct["_id"])
    await db.notifications.insert_one({
        "user_id": uid, "tenant_id": tenant_id, "type": ntype, "data": data,
        "title": title, "body": body, "url": url, "read": False, "created_at": now_iso(),
    })
    await send_push_to_user(uid, title, body, url)


async def notify_admins(ntype: str, data: dict, title: str, body: str, url: str = "/"):
    admins = await db.users.find({"role": {"$in": ["owner", "admin", "staff"]}}).to_list(20)
    for a in admins:
        uid = str(a["_id"])
        await db.notifications.insert_one({
            "user_id": uid, "tenant_id": None, "type": ntype, "data": data,
            "title": title, "body": body, "url": url, "read": False, "created_at": now_iso(),
        })
        await send_push_to_user(uid, title, body, url)


@common.get("/push/vapid-key")
async def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}


class SubscribePayload(BaseModel):
    subscription: dict


@common.post("/push/subscribe")
async def push_subscribe(payload: SubscribePayload, user: dict = Depends(get_current_user)):
    endpoint = payload.subscription.get("endpoint")
    if not endpoint:
        raise HTTPException(400, "Invalid subscription")
    await db.push_subscriptions.update_one(
        {"user_id": user["id"], "subscription.endpoint": endpoint},
        {"$set": {"user_id": user["id"], "subscription": payload.subscription, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@common.get("/notifications")
async def my_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@common.post("/notifications/read-all")
async def read_all_notifications(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ============ CHAT ============
class MessagePayload(BaseModel):
    text: str


async def _get_messages(tenant_id: str):
    docs = await db.messages.find({"tenant_id": tenant_id}).sort("created_at", 1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@api.get("/chat/threads")
async def chat_threads():
    tenants = await db.tenants.find({"status": "active"}).to_list(500)
    threads = []
    for t in tenants:
        tid = str(t["_id"])
        last = await db.messages.find({"tenant_id": tid}).sort("created_at", -1).to_list(1)
        unread = await db.messages.count_documents({"tenant_id": tid, "sender": "tenant", "read_by_admin": False})
        threads.append({
            "tenant_id": tid, "name": t["name"], "avatar_url": t.get("avatar_url"),
            "room_id": t.get("room_id"),
            "last_message": last[0]["text"] if last else None,
            "last_at": last[0]["created_at"] if last else None,
            "unread": unread,
        })
    threads.sort(key=lambda x: x["last_at"] or "", reverse=True)
    return threads


@api.get("/chat/unread-count")
async def chat_unread_count():
    n = await db.messages.count_documents({"sender": "tenant", "read_by_admin": False})
    return {"unread": n}


@api.get("/chat/{tenant_id}/messages")
async def admin_get_messages(tenant_id: str):
    await db.messages.update_many({"tenant_id": tenant_id, "sender": "tenant"}, {"$set": {"read_by_admin": True}})
    return await _get_messages(tenant_id)


@api.post("/chat/{tenant_id}/messages")
async def admin_send_message(tenant_id: str, payload: MessagePayload, user: dict = Depends(get_current_user)):
    if not payload.text.strip():
        raise HTTPException(400, "Pesan kosong")
    doc = {"tenant_id": tenant_id, "sender": "admin", "sender_name": user.get("name") or "Admin",
           "text": payload.text.strip(), "created_at": now_iso(),
           "read_by_admin": True, "read_by_tenant": False}
    r = await db.messages.insert_one(doc)
    doc["id"] = str(r.inserted_id)
    doc.pop("_id", None)
    await notify_tenant(tenant_id, "chat", {"from": "admin"}, "Pesan dari Pengelola", payload.text.strip()[:100], "/portal/chat")
    return doc


# ============ TENANT REQUESTS ============
REQUEST_TYPES = ["renewal", "checkout", "other"]


class RequestPayload(BaseModel):
    request_type: str
    note: Optional[str] = None


@api.get("/requests")
async def list_requests(status: Optional[str] = None):
    q = {"status": status} if status else {}
    docs = await db.requests.find(q).sort("created_at", -1).to_list(200)
    out = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        t = None
        if d.get("tenant_id"):
            t = await db.tenants.find_one({"_id": ObjectId(d["tenant_id"])})
        d["tenant_name"] = t["name"] if t else "-"
        out.append(d)
    return out


class RequestStatusPayload(BaseModel):
    status: str  # approved | rejected


@api.post("/requests/{req_id}/status")
async def update_request(req_id: str, payload: RequestStatusPayload, user: dict = Depends(get_current_user)):
    if payload.status not in ("approved", "rejected"):
        raise HTTPException(400, "Status tidak valid")
    d = await db.requests.find_one({"_id": oid(req_id)})
    if not d:
        raise HTTPException(404, "Request not found")
    await db.requests.update_one({"_id": oid(req_id)},
                                 {"$set": {"status": payload.status, "resolved_at": now_iso()}})
    await log_audit(user["email"], "REQUEST_" + payload.status.upper(), "request", req_id,
                    {"type": d.get("request_type")})
    label = "disetujui" if payload.status == "approved" else "ditolak"
    await notify_tenant(d["tenant_id"], "request_update",
                        {"request_type": d.get("request_type"), "status": payload.status},
                        "Update Pengajuan", f"Pengajuan {d.get('request_type')} Anda {label}.", "/portal")
    return {"ok": True, "status": payload.status}


# ============ TENANT PORTAL ============
@portal.get("/me")
async def portal_me(user: dict = Depends(require_tenant)):
    t = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    if not t:
        raise HTTPException(404, "Tenant not found")
    room = await db.rooms.find_one({"_id": ObjectId(t["room_id"])}) if t.get("room_id") else None
    t["id"] = str(t.pop("_id"))
    t.pop("portal_password", None)
    if room:
        room["id"] = str(room.pop("_id"))
    return {"tenant": t, "room": room}


@portal.get("/bills")
async def portal_bills(user: dict = Depends(require_tenant)):
    docs = await db.bills.find({"tenant_id": user["tenant_id"]}).sort("created_at", -1).to_list(200)
    return [doc_to(Bill, derive_bill(d)) for d in docs]


@portal.get("/tickets")
async def portal_tickets(user: dict = Depends(require_tenant)):
    docs = await db.complaints.find({"tenant_id": user["tenant_id"]}).sort("created_at", -1).to_list(200)
    return [doc_to(Ticket, d) for d in docs]


class PortalTicketPayload(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "other"
    priority: str = "medium"


@portal.post("/tickets")
async def portal_create_ticket(payload: PortalTicketPayload, user: dict = Depends(require_tenant)):
    t = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    doc = {
        "tenant_id": user["tenant_id"], "room_id": t.get("room_id") if t else None,
        "title": payload.title, "description": payload.description,
        "category": payload.category, "priority": payload.priority,
        "status": "pending", "assignee": None, "scheduled_at": None,
        "cost_material": 0, "cost_labor": 0, "created_at": now_iso(), "resolved_at": None,
    }
    r = await db.complaints.insert_one(doc)
    await log_audit(user.get("phone") or user.get("name", "tenant"), "CREATE", "ticket", str(r.inserted_id),
                    {"title": payload.title, "by": "tenant"})
    await notify_admins("ticket_new", {"title": payload.title, "tenant": t["name"] if t else ""},
                        "Tiket Baru dari Penghuni", f"{t['name'] if t else 'Penghuni'}: {payload.title}", "/complaints")
    return doc_to(Ticket, {**doc, "_id": r.inserted_id})


@portal.get("/messages")
async def portal_messages(user: dict = Depends(require_tenant)):
    await db.messages.update_many({"tenant_id": user["tenant_id"], "sender": "admin"},
                                  {"$set": {"read_by_tenant": True}})
    return await _get_messages(user["tenant_id"])


@portal.post("/messages")
async def portal_send_message(payload: MessagePayload, user: dict = Depends(require_tenant)):
    if not payload.text.strip():
        raise HTTPException(400, "Pesan kosong")
    doc = {"tenant_id": user["tenant_id"], "sender": "tenant", "sender_name": user.get("name") or "Penghuni",
           "text": payload.text.strip(), "created_at": now_iso(),
           "read_by_admin": False, "read_by_tenant": True}
    r = await db.messages.insert_one(doc)
    doc["id"] = str(r.inserted_id)
    doc.pop("_id", None)
    await notify_admins("chat", {"tenant_id": user["tenant_id"]},
                        f"Pesan dari {user.get('name', 'Penghuni')}", payload.text.strip()[:100], "/chat")
    return doc


@portal.get("/requests")
async def portal_requests(user: dict = Depends(require_tenant)):
    docs = await db.requests.find({"tenant_id": user["tenant_id"]}).sort("created_at", -1).to_list(50)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@portal.post("/requests")
async def portal_create_request(payload: RequestPayload, user: dict = Depends(require_tenant)):
    if payload.request_type not in REQUEST_TYPES:
        raise HTTPException(400, "Tipe pengajuan tidak valid")
    pending = await db.requests.find_one({"tenant_id": user["tenant_id"], "request_type": payload.request_type,
                                          "status": "pending"})
    if pending:
        raise HTTPException(400, "Pengajuan serupa masih menunggu persetujuan")
    doc = {"tenant_id": user["tenant_id"], "request_type": payload.request_type,
           "note": payload.note, "status": "pending", "created_at": now_iso(), "resolved_at": None}
    r = await db.requests.insert_one(doc)
    doc["id"] = str(r.inserted_id)
    doc.pop("_id", None)
    t = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    await log_audit(user.get("phone", "tenant"), "REQUEST_NEW", "request", doc["id"],
                    {"type": payload.request_type, "name": t["name"] if t else ""})
    await notify_admins("request_new", {"request_type": payload.request_type},
                        "Pengajuan Baru", f"{t['name'] if t else 'Penghuni'} mengajukan {payload.request_type}.", "/")
    return doc


class PayRequest(BaseModel):
    method: str = "qris"  # qris | bca_va | mandiri_va | bri_va | bni_va | manual


@portal.post("/bills/{bill_id}/pay")
async def portal_initiate_payment(bill_id: str, payload: PayRequest, user: dict = Depends(require_tenant)):
    bill = await db.bills.find_one({"_id": oid(bill_id), "tenant_id": user["tenant_id"]})
    if not bill:
        raise HTTPException(404, "Tagihan tidak ditemukan")
    
    total = bill.get("total", bill_total(bill))
    amount_paid = bill.get("amount_paid", 0)
    remaining = max(0, total - amount_paid)
    
    if remaining <= 0 or bill.get("status") == "paid":
        raise HTTPException(400, "Tagihan sudah lunas")
    
    tenant = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    room = await db.rooms.find_one({"_id": ObjectId(bill["room_id"])}) if bill.get("room_id") else None
    
    inv_clean = bill.get("invoice_number", "INV").replace("/", "-").replace(" ", "")
    order_id = f"LH-{inv_clean}-{int(datetime.now().timestamp())}"
    expiry_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    clean_digits = norm_phone(tenant.get("phone", ""))[-6:] or "123456"
    va_numbers = {
        "bca": {"bank": "BCA", "va_number": f"88309{clean_digits}", "name": "Lewi House - BCA VA"},
        "mandiri": {"bank": "Mandiri", "va_number": f"89998{clean_digits}", "name": "Lewi House - Mandiri VA"},
        "bri": {"bank": "BRI", "va_number": f"12800{clean_digits}", "name": "Lewi House - BRI VA"},
        "bni": {"bank": "BNI", "va_number": f"98800{clean_digits}", "name": "Lewi House - BNI VA"},
    }
    
    qris_string = f"00020101021226580016ID.CO.LEWIHOUSE.WWW011893600912{clean_digits}520458125303360540{int(remaining)}5802ID5910LEWI HOUSE6007BANDUNG62070703A016304ABCD"
    qris_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={urllib.parse.quote(qris_string)}"
    
    snap_token = None
    snap_redirect_url = None
    
    if MIDTRANS_SERVER_KEY:
        try:
            auth_str = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()
            headers = {"Authorization": f"Basic {auth_str}", "Content-Type": "application/json", "Accept": "application/json"}
            snap_payload = {
                "transaction_details": {"order_id": order_id, "gross_amount": int(remaining)},
                "customer_details": {
                    "first_name": tenant.get("name", "Penghuni"),
                    "email": tenant.get("email") or "tenant@lewihouse.com",
                    "phone": tenant.get("phone") or "081234567890",
                },
                "item_details": [{
                    "id": bill.get("invoice_number", "INV"),
                    "price": int(remaining),
                    "quantity": 1,
                    "name": f"Sewa Kamar {room.get('name', '')} {bill.get('period', '')}".strip()[:50],
                }],
                "expiry": {"duration": 24, "unit": "hours"}
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(MIDTRANS_SNAP_URL, json=snap_payload, headers=headers)
                if resp.status_code in (200, 201):
                    snap_data = resp.json()
                    snap_token = snap_data.get("token")
                    snap_redirect_url = snap_data.get("redirect_url")
        except Exception:
            pass

    order_doc = {
        "order_id": order_id,
        "bill_id": str(bill["_id"]),
        "tenant_id": user["tenant_id"],
        "amount": remaining,
        "method": payload.method,
        "status": "pending",
        "snap_token": snap_token,
        "snap_redirect_url": snap_redirect_url,
        "qris_string": qris_string,
        "qris_url": qris_url,
        "va_numbers": va_numbers,
        "expiry_time": expiry_time,
        "created_at": now_iso(),
    }
    await db.payment_orders.insert_one(order_doc)

    return {
        "order_id": order_id,
        "bill_id": str(bill["_id"]),
        "invoice_number": bill.get("invoice_number"),
        "total": total,
        "amount": remaining,
        "snap_token": snap_token,
        "snap_redirect_url": snap_redirect_url,
        "qris_url": qris_url,
        "qris_string": qris_string,
        "va_numbers": va_numbers,
        "bank_transfer": {
            "bca": {"bank": "BCA", "account_number": "8830912881", "account_name": "Lewi House Management"},
            "mandiri": {"bank": "Bank Mandiri", "account_number": "1320098765432", "account_name": "Lewi House Management"},
        },
        "expiry_time": expiry_time,
        "is_sandbox": not bool(MIDTRANS_SERVER_KEY),
    }


@portal.post("/bills/{bill_id}/simulate-payment")
async def portal_simulate_payment(bill_id: str, user: dict = Depends(require_tenant)):
    bill = await db.bills.find_one({"_id": oid(bill_id), "tenant_id": user["tenant_id"]})
    if not bill:
        raise HTTPException(404, "Tagihan tidak ditemukan")
    remaining = max(0, bill.get("total", 0) - bill.get("amount_paid", 0))
    if remaining <= 0:
        return {"ok": True, "status": "paid", "message": "Tagihan sudah lunas"}
    
    ref = f"QRIS-SIM-{int(datetime.now().timestamp())}"
    payment = {"amount": remaining, "method": "qris", "reference": ref, "paid_at": now_iso()}
    upd = {
        "amount_paid": bill.get("total", 0),
        "status": "paid",
        "paid_at": now_iso(),
        "payment_method": "qris",
    }
    await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd, "$push": {"payments": payment}})
    await db.payment_orders.update_many({"bill_id": bill_id, "status": "pending"}, {"$set": {"status": "settlement", "settled_at": now_iso()}})
    
    await log_audit(user.get("name", "Penghuni"), "PAYMENT", "bill", bill_id, {"invoice": bill.get("invoice_number"), "amount": remaining, "method": "qris"})
    await notify_admins("payment_received", {"invoice": bill.get("invoice_number"), "amount": remaining, "tenant": user.get("name")},
                        "Pembayaran Diterima", f"{user.get('name', 'Penghuni')} telah melunasi invoice {bill.get('invoice_number')} (Rp {int(remaining):,}).".replace(",", "."), "/bills")
    
    return {"ok": True, "status": "paid", "reference": ref, "amount": remaining}


@portal.get("/bills/{bill_id}/payment-status")
async def portal_check_payment_status(bill_id: str, user: dict = Depends(require_tenant)):
    bill = await db.bills.find_one({"_id": oid(bill_id), "tenant_id": user["tenant_id"]})
    if not bill:
        raise HTTPException(404, "Tagihan tidak ditemukan")
    return {
        "bill_id": bill_id,
        "status": bill.get("status", "unpaid"),
        "amount_paid": bill.get("amount_paid", 0),
        "total": bill.get("total", 0),
        "is_paid": bill.get("status") == "paid",
    }


# ============ MIDTRANS WEBHOOK ============
@payment_router.post("/midtrans-webhook")
async def midtrans_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON payload")

    order_id = body.get("order_id")
    status_code = body.get("status_code")
    gross_amount = body.get("gross_amount")
    signature_key = body.get("signature_key")
    transaction_status = body.get("transaction_status")
    fraud_status = body.get("fraud_status")

    if not order_id:
        raise HTTPException(400, "Missing order_id")

    if MIDTRANS_SERVER_KEY and signature_key:
        expected_sig = hashlib.sha512(f"{order_id}{status_code}{gross_amount}{MIDTRANS_SERVER_KEY}".encode()).hexdigest()
        if expected_sig != signature_key:
            raise HTTPException(403, "Invalid signature key")

    order = await db.payment_orders.find_one({"order_id": order_id})
    bill_id = order.get("bill_id") if order else None
    
    if not bill_id:
        parts = order_id.split("-")
        if len(parts) >= 2:
            inv = parts[1]
            b = await db.bills.find_one({"invoice_number": {"$regex": inv}})
            if b:
                bill_id = str(b["_id"])

    if not bill_id:
        return {"status": "ok", "message": "Order not matched"}

    bill = await db.bills.find_one({"_id": oid(bill_id)})
    if not bill:
        return {"status": "ok", "message": "Bill not found"}

    if transaction_status in ("capture", "settlement") and fraud_status in (None, "accept"):
        paid_amount = float(gross_amount or order.get("amount", bill.get("total", 0)))
        total_paid = bill.get("amount_paid", 0) + paid_amount
        is_full = total_paid >= bill.get("total", 0)
        
        payment_record = {
            "amount": paid_amount,
            "method": body.get("payment_type") or "midtrans",
            "reference": order_id,
            "paid_at": now_iso(),
        }
        
        upd = {
            "amount_paid": total_paid,
            "status": "paid" if is_full else "partially_paid",
            "payment_method": body.get("payment_type") or "midtrans",
        }
        if is_full:
            upd["paid_at"] = now_iso()

        await db.bills.update_one({"_id": oid(bill_id)}, {"$set": upd, "$push": {"payments": payment_record}})
        await db.payment_orders.update_one({"order_id": order_id}, {"$set": {"status": "settlement", "settled_at": now_iso()}})
        
        await log_audit("system", "PAYMENT_WEBHOOK", "bill", bill_id, {"order_id": order_id, "amount": paid_amount, "method": body.get("payment_type")})
        
        if bill.get("tenant_id"):
            await notify_tenant(bill["tenant_id"], "payment_success", {"invoice": bill.get("invoice_number"), "amount": paid_amount},
                                "Pembayaran Berhasil Dikonfirmasi", f"Pembayaran untuk tagihan {bill.get('invoice_number')} sebesar Rp {int(paid_amount):,} telah diterima.".replace(",", "."), "/portal/bills")
        await notify_admins("payment_received", {"invoice": bill.get("invoice_number"), "amount": paid_amount},
                            "Pembayaran Diterima (Midtrans)", f"Invoice {bill.get('invoice_number')} (Rp {int(paid_amount):,}) telah lunas via Midtrans.".replace(",", "."), "/bills")

    elif transaction_status in ("cancel", "deny", "expire"):
        await db.payment_orders.update_one({"order_id": order_id}, {"$set": {"status": transaction_status}})

    return {"status": "ok"}


# ============ WEBSOCKET CHAT ============
class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, tenant_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(tenant_id, []).append(ws)

    def disconnect(self, tenant_id: str, ws: WebSocket):
        if tenant_id in self.active:
            self.active[tenant_id] = [w for w in self.active[tenant_id] if w is not ws]
            if not self.active[tenant_id]:
                del self.active[tenant_id]

    async def broadcast(self, tenant_id: str, message: dict):
        for ws in self.active.get(tenant_id, []):
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
            except Exception:
                pass


ws_manager = ConnectionManager()


async def ws_auth(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            return None
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except Exception:
        return None


@app.websocket("/ws/chat/{tenant_id}")
async def websocket_chat(ws: WebSocket, tenant_id: str, token: str = Query(...)):
    user = await ws_auth(token)
    if not user:
        await ws.close(code=4001, reason="Unauthorized")
        return
    is_admin = user.get("role") in ("owner", "admin", "staff")
    is_own_tenant = user.get("role") == "tenant" and user.get("tenant_id") == tenant_id
    if not is_admin and not is_own_tenant:
        await ws.close(code=4003, reason="Forbidden")
        return
    await ws_manager.connect(tenant_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            text = (data.get("text") or "").strip()
            if not text:
                continue
            sender = "admin" if is_admin else "tenant"
            sender_name = user.get("name") or ("Admin" if is_admin else "Penghuni")
            doc = {
                "tenant_id": tenant_id, "sender": sender, "sender_name": sender_name,
                "text": text, "created_at": now_iso(),
                "read_by_admin": is_admin, "read_by_tenant": not is_admin,
            }
            r = await db.messages.insert_one(doc)
            doc["id"] = str(r.inserted_id)
            doc.pop("_id", None)
            await ws_manager.broadcast(tenant_id, doc)
            if sender == "tenant":
                await notify_admins("chat", {"tenant_id": tenant_id},
                                    f"Pesan dari {sender_name}", text[:100], "/chat")
            else:
                await notify_tenant(tenant_id, "chat", {"from": "admin"},
                                    "Pesan dari Pengelola", text[:100], "/portal/chat")
    except WebSocketDisconnect:
        ws_manager.disconnect(tenant_id, ws)
    except Exception:
        ws_manager.disconnect(tenant_id, ws)


# ============ FCM DEVICE TOKENS ============
class FCMTokenPayload(BaseModel):
    token: str
    device_type: str = "android"


@common.post("/push/register-fcm")
async def register_fcm_token(payload: FCMTokenPayload, user: dict = Depends(get_current_user)):
    await db.fcm_tokens.update_one(
        {"user_id": user["id"], "token": payload.token},
        {"$set": {"user_id": user["id"], "token": payload.token,
                  "device_type": payload.device_type, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@common.get("/notifications/unread-count")
async def unread_notification_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    chat_unread = 0
    if user.get("role") in ("owner", "admin", "staff"):
        chat_unread = await db.messages.count_documents({"sender": "tenant", "read_by_admin": False})
    elif user.get("role") == "tenant" and user.get("tenant_id"):
        chat_unread = await db.messages.count_documents(
            {"tenant_id": user["tenant_id"], "sender": "admin", "read_by_tenant": False})
    return {"notifications": count, "chat": chat_unread, "total": count + chat_unread}


# ============ REMINDERS ============
def _bill_stage(d: dict):
    if d.get("status") == "paid" or not d.get("due_date"):
        return None
    try:
        due = date.fromisoformat(d["due_date"])
    except ValueError:
        return None
    days = (due - datetime.now(timezone.utc).date()).days
    if days > 3:
        return None
    if 1 <= days <= 3:
        return "due_soon"
    if days == 0:
        return "due_today"
    late = -days
    if 1 <= late <= 3:
        return "overdue_1"
    if 4 <= late <= 7:
        return "overdue_2"
    return "overdue_3"


STAGE_LABELS = {
    "due_soon": "H-3 (Segera Jatuh Tempo)",
    "due_today": "H-0 (Jatuh Tempo Hari Ini)",
    "overdue_1": "H+1 (Terlambat Tahap 1)",
    "overdue_2": "H+4 (Terlambat Tahap 2)",
    "overdue_3": "H+7 (Peringatan Dunning Final)",
}


@api.get("/reminders/dunning-list")
async def reminders_dunning_list():
    bills = await db.bills.find({"status": {"$in": ["unpaid", "partially_paid"]}}).sort("due_date", 1).to_list(2000)
    out = []
    for b in bills:
        stage = _bill_stage(b)
        if not stage:
            continue
        bid = str(b["_id"])
        tenant = await db.tenants.find_one({"_id": ObjectId(b["tenant_id"])}) if b.get("tenant_id") else None
        room = await db.rooms.find_one({"_id": ObjectId(b["room_id"])}) if b.get("room_id") else None
        phone_clean = to_wa_phone(tenant.get("phone", "")) if tenant else ""
        msg = format_whatsapp_reminder(b, tenant, room, stage)
        wa_url = f"https://wa.me/{phone_clean}?text={urllib.parse.quote(msg)}" if phone_clean else ""
        already = await db.reminder_log.find_one({"bill_id": bid, "stage": stage})
        
        out.append({
            "bill_id": bid,
            "invoice_number": b.get("invoice_number"),
            "tenant_id": b.get("tenant_id"),
            "tenant_name": tenant.get("name") if tenant else "-",
            "room_name": room.get("name") if room else "-",
            "phone": tenant.get("phone") if tenant else None,
            "wa_phone": phone_clean,
            "amount": max(0, b.get("total", 0) - b.get("amount_paid", 0)),
            "total": b.get("total", 0),
            "due_date": b.get("due_date"),
            "stage": stage,
            "stage_label": STAGE_LABELS.get(stage, stage),
            "already_sent": bool(already),
            "whatsapp_url": wa_url,
            "message_preview": msg,
        })
    return out


@api.post("/reminders/send-whatsapp-batch")
async def send_whatsapp_batch(user: dict = Depends(get_current_user)):
    bills = await db.bills.find({"status": {"$in": ["unpaid", "partially_paid"]}}).to_list(2000)
    sent_count = 0
    for b in bills:
        stage = _bill_stage(b)
        if not stage:
            continue
        bid = str(b["_id"])
        already = await db.reminder_log.find_one({"bill_id": bid, "stage": stage})
        if not already:
            await db.reminder_log.insert_one({"bill_id": bid, "stage": stage, "sent_at": now_iso(), "actor": user["email"], "channel": "whatsapp"})
            sent_count += 1
            if b.get("tenant_id"):
                remaining = max(0, b.get("total", 0) - b.get("amount_paid", 0))
                await notify_tenant(b["tenant_id"], "bill_reminder", {"stage": stage, "invoice": b.get("invoice_number"), "amount": remaining},
                                    "Pengingat Tagihan WhatsApp", f"Tagihan {b.get('invoice_number')} (Rp {int(remaining):,}) perlu diselesaikan.".replace(",", "."), "/portal/bills")
    await log_audit(user["email"], "REMINDER_BATCH_WA", "bill", "sweep", {"count": sent_count})
    return {"ok": True, "count": sent_count}


async def run_reminder_sweep(actor: str) -> int:
    bills = await db.bills.find({"status": {"$in": ["unpaid", "partially_paid"]}}).to_list(2000)
    sent = 0
    for b in bills:
        stage = _bill_stage(b)
        if not stage:
            continue
        bid = str(b["_id"])
        already = await db.reminder_log.find_one({"bill_id": bid, "stage": stage})
        if already:
            continue
        acct = await db.users.find_one({"tenant_id": b["tenant_id"], "role": "tenant"})
        if not acct:
            continue
        remaining = b.get("total", 0) - b.get("amount_paid", 0)
        inv = b.get("invoice_number", "")
        if stage == "due_soon":
            title = "Tagihan Segera Jatuh Tempo"
            body = f"{inv}: Rp {remaining:,.0f} jatuh tempo {b.get('due_date')}. Mohon segera dibayar."
        else:
            title = "Tagihan Terlambat"
            body = f"{inv}: Rp {remaining:,.0f} telah melewati jatuh tempo {b.get('due_date')}."
        await notify_tenant(b["tenant_id"], "bill_reminder",
                            {"stage": stage, "invoice": inv, "amount": remaining, "due_date": b.get("due_date")},
                            title, body.replace(",", "."), "/portal/bills")
        await db.reminder_log.insert_one({"bill_id": bid, "stage": stage, "sent_at": now_iso(), "actor": actor})
        sent += 1
    if sent:
        await log_audit(actor, "REMINDER_RUN", "bill", "sweep", {"sent": sent})
    return sent


@api.get("/reminders/preview")
async def reminders_preview():
    bills = await db.bills.find({"status": {"$in": ["unpaid", "partially_paid"]}}).to_list(2000)
    out = []
    for b in bills:
        stage = _bill_stage(b)
        if not stage:
            continue
        bid = str(b["_id"])
        t = await db.tenants.find_one({"_id": ObjectId(b["tenant_id"])}) if b.get("tenant_id") else None
        already = await db.reminder_log.find_one({"bill_id": bid, "stage": stage})
        out.append({
            "bill_id": bid, "invoice_number": b.get("invoice_number"),
            "tenant_id": b.get("tenant_id"), "tenant_name": t["name"] if t else "-",
            "phone": t.get("phone") if t else None,
            "amount": b.get("total", 0) - b.get("amount_paid", 0),
            "due_date": b.get("due_date"), "stage": stage, "already_sent": bool(already),
        })
    return out


@api.post("/reminders/send")
async def reminders_send(user: dict = Depends(get_current_user)):
    sent = await run_reminder_sweep(user["email"])
    return {"ok": True, "sent": sent}


async def reminder_loop():
    while True:
        try:
            await run_reminder_sweep("system")
        except Exception:
            pass
        await asyncio.sleep(21600)


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
    for col in ["rooms", "tenants", "bills", "complaints", "access_tokens", "audit_logs",
                "messages", "requests", "notifications", "reminder_log"]:
        await db[col].delete_many({})
    await db.users.delete_many({"role": "tenant"})

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

    for i in [0, 1, 2]:
        t = await db.tenants.find_one({"_id": ObjectId(tenant_ids[i])})
        await create_portal_account(tenant_ids[i], t)

    await db.messages.insert_many([
        {"tenant_id": tenant_ids[0], "sender": "tenant", "sender_name": "Arya Wibowo",
         "text": "Selamat pagi Pak, kran wastafel kamar saya masih menetes. Kapan bisa diperbaiki?",
         "created_at": now_iso(), "read_by_admin": False, "read_by_tenant": True},
        {"tenant_id": tenant_ids[1], "sender": "admin", "sender_name": "Admin Lewi House",
         "text": "Halo Sinta, tagihan bulan ini sudah terbit ya. Terima kasih!",
         "created_at": now_iso(), "read_by_admin": True, "read_by_tenant": False},
    ])
    await db.requests.insert_one({
        "tenant_id": tenant_ids[2], "request_type": "renewal",
        "note": "Saya ingin perpanjang sewa 1 tahun lagi.", "status": "pending",
        "created_at": now_iso(), "resolved_at": None,
    })

    await log_audit(user["email"], "SEED", "system", "seed", {"rooms": len(rooms_seed), "tenants": len(tenants_seed)})
    return {"ok": True, "rooms": len(rooms_seed), "tenants": len(tenants_seed), "bills": len(bills), "tickets": len(tickets), "tokens": len(tokens)}


# ============ STAFF MANAGEMENT ============
class StaffCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "staff"  # owner | admin | staff
    password: str
    notes: Optional[str] = None


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ResetPasswordPayload(BaseModel):
    password: str


@api.get("/staff")
async def list_staff(user: dict = Depends(get_current_user)):
    docs = await db.users.find({"role": {"$in": ["owner", "admin", "staff"]}}).sort("created_at", -1).to_list(100)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("password_hash", None)
        if "is_active" not in d:
            d["is_active"] = True
    return docs


@api.post("/staff")
async def create_staff(payload: StaffCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Hanya Owner / Admin yang dapat menambah staff")
    email = payload.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    if payload.role not in ["owner", "admin", "staff"]:
        raise HTTPException(status_code=400, detail="Role tidak valid")
    doc = {
        "email": email,
        "phone": norm_phone(payload.phone) if payload.phone else None,
        "name": payload.name.strip(),
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "is_active": True,
        "notes": payload.notes or "",
        "created_at": now_iso(),
        "created_by": user.get("email"),
    }
    ins = await db.users.insert_one(doc)
    uid = str(ins.inserted_id)
    doc["id"] = uid
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    await log_audit(user.get("email"), "CREATE", "staff", uid, {"email": email, "role": payload.role, "name": payload.name})
    return doc


@api.put("/staff/{id}")
async def update_staff(id: str, payload: StaffUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Hanya Owner / Admin yang dapat mengubah data staff")
    target = await db.users.find_one({"_id": oid(id)})
    if not target or target.get("role") == "tenant":
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.email is not None:
        email = payload.email.strip().lower()
        if email != target.get("email"):
            existing = await db.users.find_one({"email": email})
            if existing:
                raise HTTPException(status_code=400, detail="Email sudah digunakan akun lain")
            update_data["email"] = email
    if payload.phone is not None:
        update_data["phone"] = norm_phone(payload.phone)
    if payload.role is not None:
        if payload.role not in ["owner", "admin", "staff"]:
            raise HTTPException(status_code=400, detail="Role tidak valid")
        if target.get("role") == "owner" and payload.role != "owner":
            owner_count = await db.users.count_documents({"role": "owner"})
            if owner_count <= 1:
                raise HTTPException(status_code=400, detail="Tidak dapat mengubah role satu-satunya Owner")
        update_data["role"] = payload.role
    if payload.is_active is not None:
        if target.get("role") == "owner" and not payload.is_active:
            raise HTTPException(status_code=400, detail="Tidak dapat menonaktifkan akun Owner")
        update_data["is_active"] = payload.is_active
    if payload.notes is not None:
        update_data["notes"] = payload.notes

    if update_data:
        update_data["updated_at"] = now_iso()
        await db.users.update_one({"_id": oid(id)}, {"$set": update_data})
        await log_audit(user.get("email"), "UPDATE", "staff", id, update_data)

    res = await db.users.find_one({"_id": oid(id)})
    res["id"] = str(res.pop("_id"))
    res.pop("password_hash", None)
    return res


@api.delete("/staff/{id}")
async def delete_staff(id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Hanya Owner yang dapat mencabut/menghapus akun staff")
    target = await db.users.find_one({"_id": oid(id)})
    if not target or target.get("role") == "tenant":
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")
    if target.get("role") == "owner":
        owner_count = await db.users.count_documents({"role": "owner"})
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Tidak dapat menghapus satu-satunya Owner")
    await db.users.delete_one({"_id": oid(id)})
    await log_audit(user.get("email"), "DELETE", "staff", id, {"email": target.get("email"), "name": target.get("name")})
    return {"ok": True}


@api.post("/staff/{id}/reset-password")
async def reset_staff_password(id: str, payload: ResetPasswordPayload, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Hanya Owner / Admin yang dapat mereset password")
    target = await db.users.find_one({"_id": oid(id)})
    if not target or target.get("role") == "tenant":
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")
    await db.users.update_one({"_id": oid(id)}, {"$set": {"password_hash": hash_password(payload.password), "updated_at": now_iso()}})
    await log_audit(user.get("email"), "RESET_PASSWORD", "staff", id, {"email": target.get("email")})
    return {"ok": True}


# ============ FIRESTORE SYNC ============
@api.post("/sync/firestore-full")
async def trigger_firestore_sync(user: dict = Depends(get_current_user)):
    """Perform full one-time synchronization from MongoDB to Cloud Firestore."""
    rooms = await db.rooms.find().to_list(1000)
    tenants = await db.tenants.find().to_list(1000)
    bills = await db.bills.find().to_list(10000)
    complaints = await db.complaints.find().to_list(10000)
    messages = await db.messages.find().to_list(10000)

    room_map = {str(r["_id"]): r.get("name", "") for r in rooms}

    synced_rooms = 0
    for r in rooms:
        await firestore_sync.sync_room(r)
        synced_rooms += 1

    synced_tenants = 0
    for t in tenants:
        r_name = room_map.get(str(t.get("room_id")), "")
        await firestore_sync.sync_tenant(t, r_name)
        synced_tenants += 1

    synced_bills = 0
    for b in bills:
        await firestore_sync.sync_bill(b)
        synced_bills += 1

    synced_tickets = 0
    for c in complaints:
        await firestore_sync.sync_complaint(c)
        synced_tickets += 1

    synced_messages = 0
    for m in messages:
        await firestore_sync.sync_message(m)
        synced_messages += 1

    firestore_sync.last_sync_at = now_iso()
    firestore_sync.sync_stats = {
        "rooms": synced_rooms,
        "tenants": synced_tenants,
        "bills": synced_bills,
        "complaints": synced_tickets,
        "messages": synced_messages,
    }

    await log_audit(user.get("email"), "SYNC_FIRESTORE", "system", "all", firestore_sync.sync_stats)
    return {
        "ok": True,
        "last_sync_at": firestore_sync.last_sync_at,
        "stats": firestore_sync.sync_stats,
    }


@api.get("/sync/status")
async def get_sync_status(user: dict = Depends(get_current_user)):
    return {
        "status": "connected",
        "project_id": firestore_sync.project_id,
        "last_sync_at": firestore_sync.last_sync_at,
        "stats": firestore_sync.sync_stats,
    }


@app.get("/api/")
async def root():
    return {"service": "Lewi House API", "status": "ok"}


app.include_router(auth_router)
app.include_router(api)
app.include_router(common)
app.include_router(portal)
app.include_router(payment_router)

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
    try:
        await db.users.drop_index("email_1")
    except Exception:
        pass
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index("phone", sparse=True)
    await db.login_attempts.create_index("identifier")
    await db.rooms.create_index("name")
    await db.messages.create_index([("tenant_id", 1), ("created_at", 1)])
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.reminder_log.create_index([("bill_id", 1), ("stage", 1)])
    asyncio.create_task(reminder_loop())
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
