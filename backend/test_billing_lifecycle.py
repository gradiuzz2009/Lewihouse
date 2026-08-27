"""Standalone unit test verification for Lewi House Billing & Invoicing algorithms."""

from datetime import datetime, timezone, timedelta, date
from typing import List, Optional


def sync_bill_items(d: dict) -> List[dict]:
    items = d.get("items") or []
    if not items:
        new_items = []
        if float(d.get("rent", 0)) > 0:
            new_items.append({"name": "Sewa Kamar Pokok", "amount": float(d["rent"]), "category": "rent"})
        if float(d.get("electricity", 0)) > 0:
            new_items.append({"name": "Listrik / Utilitas", "amount": float(d["electricity"]), "category": "electricity"})
        if float(d.get("water", 0)) > 0:
            new_items.append({"name": "Air / PDAM", "amount": float(d["water"]), "category": "water"})
        if float(d.get("other", 0)) > 0:
            new_items.append({"name": d.get("other_label") or "Biaya Tambahan / Layanan", "amount": float(d["other"]), "category": "add_on"})
        if float(d.get("late_fee", 0)) > 0:
            new_items.append({"name": "Denda Keterlambatan", "amount": float(d["late_fee"]), "category": "penalty"})
        if not new_items and float(d.get("total", 0)) > 0:
            new_items.append({"name": "Tagihan Sewa Kamar", "amount": float(d["total"]), "category": "rent"})
        return new_items
    return items


def bill_total(d: dict) -> float:
    items = d.get("items")
    if items:
        tot = sum(float(item.get("amount", 0)) for item in items)
        if tot > 0:
            return tot
    return float(d.get("rent", 0)) + float(d.get("electricity", 0)) + float(d.get("water", 0)) + float(d.get("other", 0)) + float(d.get("late_fee", 0))


def derive_bill(d: dict) -> dict:
    d.setdefault("invoice_number", None)
    d.setdefault("amount_paid", 0)
    d.setdefault("payments", [])
    d.setdefault("late_fee", 0)
    d.setdefault("dunning_stage", 0)
    d.setdefault("payment_method", None)
    d.setdefault("payment_details", None)
    
    items = sync_bill_items(d)
    d["items"] = items
    calculated_total = bill_total(d)
    d["total"] = calculated_total
    d["total_amount"] = calculated_total
    
    raw_status = str(d.get("status") or "UNPAID").upper()
    if raw_status in ("PAID", "LUNAS"):
        d["status"] = "PAID"
        d["is_overdue"] = False
    elif raw_status in ("VERIFYING", "MENUNGGU_VERIFIKASI"):
        d["status"] = "VERIFYING"
        d["is_overdue"] = False
    elif raw_status in ("CANCELLED", "BATAL"):
        d["status"] = "CANCELLED"
        d["is_overdue"] = False
    else:
        d["is_overdue"] = False
        if d.get("due_date"):
            today = datetime.now(timezone.utc).date()
            try:
                due = date.fromisoformat(str(d["due_date"])[:10])
                days_late = (today - due).days
                if days_late > 0:
                    d["is_overdue"] = True
                    d["dunning_stage"] = 1 if days_late <= 3 else (2 if days_late <= 7 else 3)
                    d["status"] = "OVERDUE"
                else:
                    d["status"] = "PARTIAL_PAID" if (0 < float(d.get("amount_paid", 0)) < calculated_total) else "UNPAID"
            except ValueError:
                d["status"] = "UNPAID"
        else:
            d["status"] = "PARTIAL_PAID" if (0 < float(d.get("amount_paid", 0)) < calculated_total) else "UNPAID"
            
    return d


def invoice_number_for(period: str, room_name: Optional[str]) -> str:
    period_clean = period.replace("-", "").replace("/", "")[:6]
    unit_clean = (room_name or "GEN").replace(" ", "").replace("-", "").upper()
    return f"INV/{period_clean}/{unit_clean}/0001"


def test_sync_bill_items_fallback():
    d = {
        "rent": 1500000,
        "electricity": 200000,
        "water": 50000,
        "other": 100000,
        "other_label": "Parkir Mobil",
        "late_fee": 50000,
        "items": []
    }
    items = sync_bill_items(d)
    assert len(items) == 5
    assert items[0]["name"] == "Sewa Kamar Pokok"
    assert items[0]["amount"] == 1500000
    assert items[3]["name"] == "Parkir Mobil"
    assert bill_total({"items": items}) == 1900000
    print("   [OK] test_sync_bill_items_fallback PASSED")


def test_derive_bill_overdue_and_status():
    past_due = (datetime.now(timezone.utc).date() - timedelta(days=4)).isoformat()
    d = {
        "rent": 2000000,
        "due_date": past_due,
        "status": "UNPAID",
        "amount_paid": 0,
    }
    derived = derive_bill(d)
    assert derived["is_overdue"] is True
    assert derived["status"] == "OVERDUE"
    assert derived["dunning_stage"] == 2
    assert derived["total"] == 2000000
    assert derived["total_amount"] == 2000000

    d_paid = {
        "rent": 2000000,
        "due_date": past_due,
        "status": "PAID",
        "amount_paid": 2000000,
    }
    derived_paid = derive_bill(d_paid)
    assert derived_paid["status"] == "PAID"
    assert derived_paid["is_overdue"] is False

    d_verifying = {
        "rent": 2000000,
        "due_date": past_due,
        "status": "VERIFYING",
        "amount_paid": 0,
    }
    derived_verifying = derive_bill(d_verifying)
    assert derived_verifying["status"] == "VERIFYING"
    assert derived_verifying["is_overdue"] is False
    print("   [OK] test_derive_bill_overdue_and_status PASSED")


def test_invoice_number_format():
    inv = invoice_number_for("2026-09", "204")
    assert inv == "INV/202609/204/0001"
    print("   [OK] test_invoice_number_format PASSED")


if __name__ == "__main__":
    print("Starting Lewi House Billing & Invoicing Lifecycle Verification...")
    test_sync_bill_items_fallback()
    test_derive_bill_overdue_and_status()
    test_invoice_number_format()
    print("ALL BILLING UNIT TESTS PASSED SUCCESSFULLY!")
