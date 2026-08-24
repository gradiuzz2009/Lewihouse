"""Firestore Synchronization Manager for Lewi House.

Bridges MongoDB (Web backend) and Cloud Firestore (Android Native App).
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import urllib.request
import urllib.error

logger = logging.getLogger("firestore_sync")

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "lewihouse")
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"
PROPERTY_SCOPE = "properties/lewi_house_main"


def to_firestore_value(val: Any) -> Dict[str, Any]:
    """Convert a Python native value to Firestore REST API field value."""
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": float(val)}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(v) for v in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}


def to_firestore_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a dictionary to Firestore fields format."""
    fields = {}
    for k, v in data.items():
        if k == "_id":
            continue
        fields[k] = to_firestore_value(v)
    return fields


def from_firestore_value(val: Dict[str, Any]) -> Any:
    """Convert a Firestore REST API field value to Python native value."""
    if not isinstance(val, dict):
        return val
    if "stringValue" in val:
        return val["stringValue"]
    if "integerValue" in val:
        return int(val["integerValue"])
    if "doubleValue" in val:
        return float(val["doubleValue"])
    if "booleanValue" in val:
        return val["booleanValue"]
    if "nullValue" in val:
        return None
    if "arrayValue" in val:
        return [from_firestore_value(v) for v in val.get("arrayValue", {}).get("values", [])]
    if "mapValue" in val:
        return {k: from_firestore_value(v) for k, v in val.get("mapValue", {}).get("fields", {}).items()}
    if "timestampValue" in val:
        return val["timestampValue"]
    return None


def from_firestore_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Extract Python dictionary from Firestore REST document."""
    res = {}
    name = doc.get("name", "")
    doc_id = name.split("/")[-1] if name else ""
    res["id"] = doc_id
    fields = doc.get("fields", {})
    for k, v in fields.items():
        res[k] = from_firestore_value(v)
    return res


class FirestoreSyncManager:
    """Manages bidirectional syncing between MongoDB and Firestore."""

    def __init__(self, project_id: str = FIREBASE_PROJECT_ID):
        self.project_id = project_id
        self.last_sync_at: Optional[str] = None
        self.sync_stats: Dict[str, int] = {
            "rooms": 0,
            "tenants": 0,
            "bills": 0,
            "complaints": 0,
            "messages": 0,
            "errors": 0,
        }

    def _sync_http_request(self, method: str, path: str, payload: Optional[dict] = None) -> Optional[dict]:
        """Perform a synchronous HTTP request to Firestore REST API."""
        url = f"{FIRESTORE_BASE_URL}/{path}"
        try:
            req = urllib.request.Request(url, method=method)
            req.add_header("Content-Type", "application/json")
            data_bytes = json.dumps(payload).encode("utf-8") if payload else None
            with urllib.request.urlopen(req, data=data_bytes, timeout=10) as resp:
                resp_bytes = resp.read()
                return json.loads(resp_bytes.decode("utf-8")) if resp_bytes else {}
        except urllib.error.HTTPError as e:
            # 404 or permission warning logged without crashing
            logger.warning(f"Firestore HTTP {e.code} on {method} {url}: {e.read().decode('utf-8', errors='ignore')}")
            return None
        except Exception as ex:
            logger.error(f"Firestore Sync error on {method} {url}: {ex}")
            return None

    async def put_document(self, collection_path: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Write/update a document in Firestore asynchronously."""
        path = f"{PROPERTY_SCOPE}/{collection_path}/{doc_id}"
        fields = to_firestore_fields(data)
        payload = {"fields": fields}
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, lambda: self._sync_http_request("PATCH", path, payload))
        return res is not None

    async def delete_document(self, collection_path: str, doc_id: str) -> bool:
        """Delete a document from Firestore asynchronously."""
        path = f"{PROPERTY_SCOPE}/{collection_path}/{doc_id}"
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, lambda: self._sync_http_request("DELETE", path))
        return res is not None

    # Specific Collection Sync Helpers
    async def sync_room(self, room: Dict[str, Any]):
        """Map and sync room document to Firestore."""
        doc_id = str(room.get("_id") or room.get("id"))
        payload = {
            "id": doc_id,
            "roomNumber": room.get("name", ""),
            "floor": room.get("floor", "1"),
            "roomType": room.get("room_type", "standard"),
            "capacity": int(room.get("capacity", 1)),
            "monthlyPrice": float(room.get("price", 0)),
            "deposit": float(room.get("deposit", 0)),
            "status": room.get("status", "available").upper(),
            "facilities": room.get("facilities", []),
            "photoUrl": room.get("photo_url") or "",
            "notes": room.get("notes") or "",
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await self.put_document("rooms", doc_id, payload)

    async def sync_tenant(self, tenant: Dict[str, Any], room_name: str = ""):
        """Map and sync tenant/resident document to Firestore."""
        doc_id = str(tenant.get("_id") or tenant.get("id"))
        status_map = {
            "active": "ACTIVE",
            "applicant": "MOVING_OUT",
            "former": "ARCHIVED",
        }
        payload = {
            "id": doc_id,
            "fullName": tenant.get("name", ""),
            "email": tenant.get("email") or "",
            "phone": tenant.get("phone", ""),
            "roomNumber": room_name or tenant.get("room_id", ""),
            "moveInDate": tenant.get("lease_start") or "",
            "leaseEndDate": tenant.get("lease_end") or "",
            "monthlyRent": float(tenant.get("rent_amount", 0)),
            "depositAmount": float(tenant.get("deposit_amount", 0)),
            "status": status_map.get(tenant.get("status", "active"), "ACTIVE"),
            "emergencyContact": tenant.get("emergency_relation", "Family"),
            "emergencyPhone": tenant.get("emergency_phone", ""),
            "ktpNumber": tenant.get("nik", ""),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await self.put_document("residents", doc_id, payload)

    async def sync_bill(self, bill: Dict[str, Any]):
        """Map and sync bill/payment document to Firestore."""
        doc_id = str(bill.get("_id") or bill.get("id"))
        status_map = {
            "paid": "PAID",
            "unpaid": "UNPAID",
            "partially_paid": "PARTIALLY_PAID",
            "overdue": "OVERDUE",
        }
        payload = {
            "id": doc_id,
            "invoiceNumber": bill.get("invoice_number", ""),
            "tenantId": str(bill.get("tenant_id", "")),
            "period": bill.get("period", ""),
            "totalAmount": float(bill.get("total", 0)),
            "paidAmount": float(bill.get("amount_paid", 0)),
            "status": status_map.get(bill.get("status", "unpaid"), "UNPAID"),
            "dueDate": bill.get("due_date", ""),
            "createdAt": bill.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await self.put_document("payments", doc_id, payload)

    async def sync_complaint(self, complaint: Dict[str, Any]):
        """Map and sync maintenance ticket to Firestore."""
        doc_id = str(complaint.get("_id") or complaint.get("id"))
        status_map = {
            "pending": "SUBMITTED",
            "in_progress": "IN_PROGRESS",
            "resolved": "RESOLVED",
        }
        payload = {
            "id": doc_id,
            "title": complaint.get("title", ""),
            "description": complaint.get("description", ""),
            "tenantId": str(complaint.get("tenant_id") or ""),
            "category": complaint.get("category", "general").upper(),
            "priority": complaint.get("priority", "medium").upper(),
            "status": status_map.get(complaint.get("status", "pending"), "SUBMITTED"),
            "createdAt": complaint.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await self.put_document("maintenance_tickets", doc_id, payload)

    async def sync_message(self, message: Dict[str, Any]):
        """Map and sync chat message to Firestore thread & messages."""
        msg_id = str(message.get("_id") or message.get("id"))
        tenant_id = str(message.get("tenant_id", ""))
        if not tenant_id:
            return
        sender_role = "ADMIN" if message.get("sender") == "admin" else "TENANT"
        msg_payload = {
            "id": msg_id,
            "tenantId": tenant_id,
            "senderId": "admin_main" if sender_role == "ADMIN" else tenant_id,
            "senderName": message.get("sender_name") or ("Admin Lewi House" if sender_role == "ADMIN" else "Penghuni"),
            "senderRole": sender_role,
            "text": message.get("text", ""),
            "timestamp": message.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "read": bool(message.get("read_by_admin") if sender_role == "TENANT" else message.get("read_by_tenant")),
        }
        # Put into chats subcollection
        await self.put_document(f"chats/{tenant_id}/messages", msg_id, msg_payload)

        # Also update chat_threads summary
        thread_payload = {
            "tenantId": tenant_id,
            "tenantName": msg_payload["senderName"],
            "lastMessage": message.get("text", ""),
            "lastTimestamp": msg_payload["timestamp"],
            "lastSenderRole": sender_role,
            "unreadCount": 0 if sender_role == "ADMIN" else 1,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await self.put_document("chat_threads", tenant_id, thread_payload)


# Global singleton instance
firestore_sync = FirestoreSyncManager()
