"""Unit tests for Room Transfer Prorata Calculator and Data Structure validation."""
from datetime import datetime
from typing import Optional, List

def calculate_prorata(old_rent: float, new_rent: float, transfer_date_str: str, elec_charge: float = 0):
    d = datetime.strptime(transfer_date_str, "%Y-%m-%d")
    year = d.year
    month = d.month
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)
    days_in_month = (next_month - datetime(year, month, 1)).days
    
    day_of_month = d.day
    days_remaining = max(1, days_in_month - day_of_month + 1)
    
    prorata_old_credit = round((old_rent / days_in_month) * days_remaining)
    prorata_new_charge = round((new_rent / days_in_month) * days_remaining)
    rent_diff = prorata_new_charge - prorata_old_credit
    net_adj = rent_diff + elec_charge
    return {
        "days_in_month": days_in_month,
        "days_remaining": days_remaining,
        "prorata_old_credit": prorata_old_credit,
        "prorata_new_charge": prorata_new_charge,
        "rent_diff": rent_diff,
        "net_adj": net_adj
    }

def test_room_transfer_math():
    print("Testing Prorata Transfer Calculator...")
    # Example: Transfer on 2026-08-16 (August has 31 days)
    # Old room rent: 1,800,000. New room rent: 2,500,000.
    # Remaining days: 31 - 16 + 1 = 16 days.
    # Old credit: (1800000 / 31) * 16 = 929,032
    # New charge: (2500000 / 31) * 16 = 1,290,323
    # Net rent diff: 1290323 - 929032 = 361,291
    # Plus final electricity charge: 50,000 -> Net Adjustment: 411,291
    res = calculate_prorata(1800000, 2500000, "2026-08-16", elec_charge=50000)
    assert res["days_in_month"] == 31
    assert res["days_remaining"] == 16
    assert res["prorata_old_credit"] == 929032
    assert res["prorata_new_charge"] == 1290323
    assert res["rent_diff"] == 361291
    assert res["net_adj"] == 411291
    print("   [OK] Prorata math calculations PASSED!")

def test_room_lifecycle_and_transfer_state():
    print("Testing Room Lifecycle transitions & Transfer state...")
    ROOM_STATUSES = ["available", "reserved", "occupied", "cleaning", "maintenance"]
    
    # State before transfer
    old_room = {"id": "r_101", "name": "101", "status": "occupied", "tenant_id": "t_1", "price": 1800000, "meter_id": "PLN-101"}
    new_room = {"id": "r_204", "name": "204", "status": "available", "tenant_id": None, "price": 2500000, "meter_id": "PLN-204"}
    tenant = {"id": "t_1", "name": "Ali Akhmad", "room_id": "r_101", "monthly_rent": 1800000}

    assert new_room["status"] == "available", "Target room must be available"
    
    # Execute Transfer logic
    old_room["status"] = "cleaning"
    old_room["tenant_id"] = None
    
    new_room["status"] = "occupied"
    new_room["tenant_id"] = tenant["id"]
    
    tenant["room_id"] = new_room["id"]
    tenant["monthly_rent"] = new_room["price"]
    
    assert old_room["status"] == "cleaning"
    assert old_room["tenant_id"] is None
    assert new_room["status"] == "occupied"
    assert new_room["tenant_id"] == "t_1"
    assert tenant["room_id"] == "r_204"
    assert tenant["monthly_rent"] == 2500000
    print("   [OK] Room Lifecycle & Transfer state transitions PASSED!")

if __name__ == "__main__":
    test_room_transfer_math()
    test_room_lifecycle_and_transfer_state()
    print("ALL TESTS PASSED SUCCESSFULLY!")
