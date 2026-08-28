"""Seed and initialize Cloud Firestore database for Lewi House kosan management."""

import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "lewihouse")
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"
PROPERTY_SCOPE = "properties/lewi_house_main"


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


def put_firestore_doc(path: str, doc_data: dict) -> bool:
    url = f"{FIRESTORE_BASE_URL}/{path}"
    payload = {"fields": to_firestore_fields(doc_data)}
    try:
        req = urllib.request.Request(url, method="PATCH")
        req.add_header("Content-Type", "application/json")
        data_bytes = json.dumps(payload).encode("utf-8")
        with urllib.request.urlopen(req, data=data_bytes, timeout=10) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        print(f"[-] HTTP {e.code} for {path}: {e.read().decode('utf-8', errors='ignore')}")
        return False
    except Exception as e:
        print(f"[-] Error writing {path}: {e}")
        return False


def seed_database():
    print(f"[*] Starting Firestore seeding for project: {FIREBASE_PROJECT_ID}...")
    now = datetime.now(timezone.utc).isoformat()

    # 1. Main Property Info
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
    put_firestore_doc("properties/lewi_house_main", property_info)
    print("  [✓] Seeded property info (Lewi House Medan)")

    # 2. Rooms (17 Kamar across 4 Lantai)
    rooms = [
        # Lantai 1 (4 Kamar)
        {"id": "room_101", "roomNumber": "101", "floor": "1", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "OCCUPIED", "photoUrl": "/gallery/agoda/agoda-10-deluxe-bed.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_102", "roomNumber": "102", "floor": "1", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-15-superior-double.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_103", "roomNumber": "103", "floor": "1", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "OCCUPIED", "photoUrl": "/gallery/agoda/agoda-11-standard-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_104", "roomNumber": "104", "floor": "1", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-13-standard-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 2 (5 Kamar)
        {"id": "room_201", "roomNumber": "201", "floor": "2", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "OCCUPIED", "photoUrl": "/gallery/agoda/agoda-02-suite-bedroom.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_202", "roomNumber": "202", "floor": "2", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-09-suite-bedroom.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_203", "roomNumber": "203", "floor": "2", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-12-superior-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_204", "roomNumber": "204", "floor": "2", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "OCCUPIED", "photoUrl": "/gallery/agoda/agoda-15-superior-double.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja", "Lemari", "TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_205", "roomNumber": "205", "floor": "2", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "CLEANING", "photoUrl": "/gallery/agoda/agoda-11-standard-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 3 (4 Kamar)
        {"id": "room_301", "roomNumber": "301", "floor": "3", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2500000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-10-deluxe-bed.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_302", "roomNumber": "302", "floor": "3", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-14-deluxe-bedroom.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_303", "roomNumber": "303", "floor": "3", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2000000.0, "deposit": 1000000.0, "status": "OCCUPIED", "photoUrl": "/gallery/agoda/agoda-15-superior-double.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Double", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_304", "roomNumber": "304", "floor": "3", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1600000.0, "deposit": 500000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-13-standard-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},

        # Lantai 4 (4 Kamar)
        {"id": "room_401", "roomNumber": "401", "floor": "4", "roomType": "tipe_a", "capacity": 2, "monthlyPrice": 2600000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-02-suite-bedroom.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Queen", "Meja Kerja", "Lemari Cermin", "Smart TV", "WiFi Cepat", "Akses Rooftop"], "updatedAt": now},
        {"id": "room_402", "roomNumber": "402", "floor": "4", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2100000.0, "deposit": 1000000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-12-superior-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat", "Akses Rooftop"], "updatedAt": now},
        {"id": "room_403", "roomNumber": "403", "floor": "4", "roomType": "tipe_b", "capacity": 1, "monthlyPrice": 2100000.0, "deposit": 1000000.0, "status": "MAINTENANCE", "photoUrl": "/gallery/agoda/agoda-14-deluxe-bedroom.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur Springbed Single", "Meja", "Lemari", "WiFi Cepat"], "updatedAt": now},
        {"id": "room_404", "roomNumber": "404", "floor": "4", "roomType": "tipe_c", "capacity": 1, "monthlyPrice": 1700000.0, "deposit": 500000.0, "status": "AVAILABLE", "photoUrl": "/gallery/agoda/agoda-11-standard-single.webp", "facilities": ["AC", "Kamar Mandi Dalam (Shower & Kloset Duduk)", "Kasur 1.2x2m", "Meja Kompak", "Lemari", "WiFi Cepat"], "updatedAt": now},
    ]
    for r in rooms:
        put_firestore_doc(f"{PROPERTY_SCOPE}/rooms/{r['id']}", r)
    print(f"  [✓] Seeded {len(rooms)} rooms")

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
    put_firestore_doc(f"{PROPERTY_SCOPE}/residents/{resident['id']}", resident)
    print("  [✓] Seeded demo resident")

    # 4. Electricity Meters
    for r in rooms:
        meter = {
            "id": f"meter_{r['roomNumber']}",
            "roomNumber": r["roomNumber"],
            "meterNumber": f"54129800{r['roomNumber']}",
            "currentKwh": 45.8,
            "lastUpdated": now,
        }
        put_firestore_doc(f"{PROPERTY_SCOPE}/electricity_meters/{meter['id']}", meter)
    print("  [✓] Seeded electricity meters")

    # 5. Announcements / Notifications
    notif = {
        "id": "notif_welcome",
        "title": "Selamat Datang di Lewi House",
        "body": "Aplikasi manajemen hunian kosan Lewi House kini aktif. Silakan laporkan keluhan dan cek tagihan via aplikasi.",
        "category": "ANNOUNCEMENT",
        "recipientResidentId": None,
        "createdAt": now,
        "isRead": False,
    }
    put_firestore_doc(f"{PROPERTY_SCOPE}/notifications/{notif['id']}", notif)
    print("  [✓] Seeded welcome notification")

    print("\n[✓] Firestore initialization structure ready!")


if __name__ == "__main__":
    seed_database()
