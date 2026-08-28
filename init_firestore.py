"""Initialize and Seed Cloud Firestore for Lewi House using Service Account Credentials."""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

# Locate serviceAccountKey.json or downloaded firebase-adminsdk json
KEY_PATHS = [
    Path("serviceAccountKey.json"),
    Path("backend/serviceAccountKey.json"),
    *list(Path(".").glob("*firebase-adminsdk*.json")),
    *list(Path("backend").glob("*firebase-adminsdk*.json")),
    *list((Path.home() / "Downloads").glob("*firebase-adminsdk*.json")),
]

service_key_path = None
for p in KEY_PATHS:
    if p.exists():
        service_key_path = p
        break

if not service_key_path:
    print("[!] No service account json found.")
    sys.exit(1)

with open(service_key_path, "r", encoding="utf-8") as f:
    sa_info = json.load(f)

PROJECT_ID = sa_info.get("project_id", "lewihouse-7a0d7")
print(f"[*] Target Firebase Project ID: {PROJECT_ID}")
print(f"[*] Using Service Account Key: {service_key_path.name}")

# Obtain OAuth2 Bearer Token using google-auth or pyjwt/cryptography
try:
    from google.oauth2 import service_account
    import google.auth.transport.requests

    SCOPES = ["https://www.googleapis.com/auth/datastore"]
    creds = service_account.Credentials.from_service_account_file(
        str(service_key_path), scopes=SCOPES
    )
    request = google.auth.transport.requests.Request()
    creds.refresh(request)
    ACCESS_TOKEN = creds.token
    print("  [✓] Successfully authenticated Service Account and generated access token.")
except Exception as e:
    print(f"[!] Failed to get token with google-auth: {e}")
    sys.exit(1)

FIRESTORE_BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
PROPERTY_SCOPE = "properties/lewi_house_main"
now = datetime.now(timezone.utc).isoformat()


def to_firestore_value(val):
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


def to_firestore_fields(data):
    fields = {}
    for k, v in data.items():
        if k == "_id":
            continue
        fields[k] = to_firestore_value(v)
    return fields


def write_doc(path: str, data: dict) -> bool:
    url = f"{FIRESTORE_BASE}/{path}"
    payload = {"fields": to_firestore_fields(data)}
    req = urllib.request.Request(url, method="PATCH")
    req.add_header("Authorization", f"Bearer {ACCESS_TOKEN}")
    req.add_header("Content-Type", "application/json")
    data_bytes = json.dumps(payload).encode("utf-8")
    try:
        with urllib.request.urlopen(req, data=data_bytes, timeout=15) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError as err:
        err_msg = err.read().decode("utf-8", errors="ignore")
        print(f"  [-] Failed writing {path}: HTTP {err.code} - {err_msg}")
        return False
    except Exception as ex:
        print(f"  [-] Error on {path}: {ex}")
        return False


def seed_all():
    print("\n[*] Populating Firestore database collections...")

    # 1. Main Property Doc
    property_info = {
        "id": "lewi_house_main",
        "name": "Lewi House Medan",
        "legalName": "Lewi House Syariah / Kost Lewi House",
        "address": "Jl. Sei Bahkapuran No. 16A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119",
        "totalFloors": 4,
        "totalRooms": 17,
        "buildingType": "Kost Campur Eksklusif & Guesthouse Syariah",
        "contactPhone": "+62 812-6296-0211",
        "contactEmail": "fauziealiakhmad@gmail.com",
        "wifiSsid": "LewiHouse_Guest",
        "onSiteServices": ["LEWI Laundry", "Area Parkir Mobil & Motor", "Rooftop Terrace & Workout Area"],
        "checkInTime": "14:00",
        "checkOutTime": "12:00",
        "updatedAt": now,
    }
    if write_doc("properties/lewi_house_main", property_info):
        print("  [✓] Property document 'lewi_house_main' created (Lewi House Medan).")

    # 2. Rooms (17 Kamar across 4 Lantai)
    rooms = [
        # Lantai 1 (4 Kamar)
        {"id": "room_101", "roomNumber": "101", "floor": "1", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "OCCUPIED", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_102", "roomNumber": "102", "floor": "1", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_103", "roomNumber": "103", "floor": "1", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "OCCUPIED", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_104", "roomNumber": "104", "floor": "1", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 2 (5 Kamar)
        {"id": "room_201", "roomNumber": "201", "floor": "2", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "OCCUPIED", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_202", "roomNumber": "202", "floor": "2", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_203", "roomNumber": "203", "floor": "2", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_204", "roomNumber": "204", "floor": "2", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "OCCUPIED", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja", "Lemari", "TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_205", "roomNumber": "205", "floor": "2", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "CLEANING", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 3 (4 Kamar)
        {"id": "room_301", "roomNumber": "301", "floor": "3", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_302", "roomNumber": "302", "floor": "3", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_303", "roomNumber": "303", "floor": "3", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "OCCUPIED", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_304", "roomNumber": "304", "floor": "3", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 4 (4 Kamar)
        {"id": "room_401", "roomNumber": "401", "floor": "4", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2600000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat", "Akses Rooftop"], "updatedAt": now},
        {"id": "room_402", "roomNumber": "402", "floor": "4", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2100000.0, "deposit": 1000000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat", "Akses Rooftop"], "updatedAt": now},
        {"id": "room_403", "roomNumber": "403", "floor": "4", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2100000.0, "deposit": 1000000.0, "status": "MAINTENANCE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_404", "roomNumber": "404", "floor": "4", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1700000.0, "deposit": 500000.0, "status": "AVAILABLE", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},
    ]
    for r in rooms:
        write_doc(f"{PROPERTY_SCOPE}/rooms/{r['id']}", r)
    print(f"  [✓] {len(rooms)} Rooms seeded into properties/lewi_house_main/rooms.")

    # 3. Demo Resident
    resident = {
        "id": "resident_101",
        "fullName": "Budi Santoso",
        "email": "budi.santoso@example.com",
        "phone": "+6281298765432",
        "roomNumber": "101",
        "moveInDate": "2026-01-01",
        "leaseEndDate": "2026-12-31",
        "monthlyRent": 1500000.0,
        "depositAmount": 500000.0,
        "status": "ACTIVE",
        "emergencyContact": "Orang Tua",
        "emergencyPhone": "+628111222333",
        "ktpNumber": "3201234567890001",
        "updatedAt": now,
    }
    write_doc(f"{PROPERTY_SCOPE}/residents/{resident['id']}", resident)
    print("  [✓] Demo resident seeded into properties/lewi_house_main/residents.")

    # 4. Admin user profile in root users
    admin_user = {
        "id": "usr_owner_1",
        "email": "fauziealiakhmad@gmail.com",
        "name": "Fauzie Ali Akhmad",
        "role": "owner",
        "createdAt": now,
    }
    write_doc("users/usr_owner_1", admin_user)
    print("  [✓] Admin user profile registered in users collection.")

    # 5. Electricity meters
    for r in rooms:
        meter = {
            "id": f"meter_{r['roomNumber']}",
            "roomNumber": r["roomNumber"],
            "meterNumber": f"54129800{r['roomNumber']}",
            "currentKwh": 45.8,
            "lastUpdated": now,
        }
        write_doc(f"{PROPERTY_SCOPE}/electricity_meters/{meter['id']}", meter)
    print(f"  [✓] Electricity meters seeded.")

    # 6. Welcome announcement
    notif = {
        "id": "notif_welcome",
        "title": "Selamat Datang di Lewi House",
        "body": "Aplikasi manajemen kosan Lewi House kini aktif. Data dan tagihan tersinkronisasi.",
        "category": "ANNOUNCEMENT",
        "recipientResidentId": None,
        "createdAt": now,
        "isRead": False,
    }
    write_doc(f"{PROPERTY_SCOPE}/notifications/{notif['id']}", notif)
    print("  [✓] Welcome notification seeded.")

    print("\n" + "="*45)
    print("🎉 FIRESTORE DATABASE INITIALIZED & SEEDED!")
    print("="*45)


if __name__ == "__main__":
    seed_all()
