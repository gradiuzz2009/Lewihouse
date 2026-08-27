"""Standalone unit test verification for Lewi House tenant credential algorithms."""
from typing import Optional, List

def generate_tenant_username(room_name: Optional[str], full_name: Optional[str], existing_usernames: List[str] = []) -> str:
    unit = "000"
    if room_name and isinstance(room_name, str) and room_name.strip():
        clean_room = "".join(ch for ch in room_name if ch.isalnum()).lower()
        if clean_room:
            unit = clean_room
    
    first_name = "penghuni"
    if full_name and isinstance(full_name, str) and full_name.strip():
        raw_first = full_name.strip().split()[0]
        clean_first = "".join(ch for ch in raw_first if ch.isalnum()).lower()
        if clean_first:
            first_name = clean_first
            
    base_username = f"{unit}_{first_name}"
    candidate = base_username
    counter = 2
    username_set = set((u or "").lower() for u in existing_usernames if u)
    while candidate in username_set:
        candidate = f"{base_username}_{counter}"
        counter += 1
    return candidate


def generate_temporary_password(room_name: Optional[str], nik: Optional[str]) -> str:
    clean_room = "000"
    if room_name and isinstance(room_name, str) and room_name.strip():
        alphanumeric = "".join(ch for ch in room_name if ch.isalnum()).upper()
        if alphanumeric:
            clean_room = alphanumeric
    suffix = "123"
    if nik:
        nik_digits = "".join(ch for ch in str(nik) if ch.isdigit())
        if len(nik_digits) >= 3:
            suffix = nik_digits[-3:]
    return f"{clean_room}{suffix}"


def test_suite():
    print("1. Testing generate_tenant_username...")
    # Standard format [Unit]_[FirstName]
    u1 = generate_tenant_username("204", "Ali Akhmad", [])
    assert u1 == "204_ali", f"Expected 204_ali, got {u1}"
    
    # Special room format (symbols cleaned, lowercase)
    u2 = generate_tenant_username("A-12", "Budi Santoso", [])
    assert u2 == "a12_budi", f"Expected a12_budi, got {u2}"
    
    # Collision handling (duplicate in same unit)
    u3 = generate_tenant_username("204", "Ali Pratama", ["204_ali"])
    assert u3 == "204_ali_2", f"Expected 204_ali_2, got {u3}"
    
    u4 = generate_tenant_username("204", "Ali Nugroho", ["204_ali", "204_ali_2"])
    assert u4 == "204_ali_3", f"Expected 204_ali_3, got {u4}"
    print("   [OK] generate_tenant_username PASSED")

    print("2. Testing generate_temporary_password...")
    # Standard 3 digit NIK suffix
    p1 = generate_temporary_password("204", "3201123456780789")
    assert p1 == "204789", f"Expected 204789, got {p1}"
    
    # Fallback to 123 if NIK empty or invalid
    p2 = generate_temporary_password("204", None)
    assert p2 == "204123", f"Expected 204123, got {p2}"
    
    p3 = generate_temporary_password("A-102", "12")
    assert p3 == "A102123", f"Expected A102123, got {p3}"
    
    p4 = generate_temporary_password("B/03", "3171000000000456")
    assert p4 == "B03456", f"Expected B03456, got {p4}"
    print("   [OK] generate_temporary_password PASSED")

    print("\nALL CREDENTIAL TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_suite()
