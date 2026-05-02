"""
Patient & Inventory Management System - Backend API Tests
Covers: auth, patients, doctors, appointments, prescriptions, inventory, billing,
dashboard stats, notifications.
"""
import os
import uuid
import requests
import pytest
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://health-inventory-hub-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="session")
def created_ids():
    return {}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success(self, admin_session):
        r = admin_session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        # httpOnly cookie
        assert "access_token" in admin_session.cookies.get_dict()

    def test_me_with_cookie(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_login_invalid(self):
        # Use unique IP-less session; BUT lockout uses ip:email, so use unique random email to avoid 429
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": f"nouser{uuid.uuid4().hex[:6]}@x.com", "password": "wrong"})
        assert r.status_code in (401, 429)


# ---------------- Patients ----------------
class TestPatients:
    def test_create_patient(self, admin_session, created_ids):
        payload = {"name": "TEST_John Doe", "age": 30, "gender": "M", "phone": "9999999999",
                   "address": "Addr", "blood_group": "O+"}
        r = admin_session.post(f"{API}/patients", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["id"].startswith("P-")
        created_ids["patient_id"] = data["id"]

    def test_list_patients(self, admin_session, created_ids):
        r = admin_session.get(f"{API}/patients")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert created_ids["patient_id"] in ids

    def test_search_patient(self, admin_session):
        r = admin_session.get(f"{API}/patients", params={"search": "TEST_John"})
        assert r.status_code == 200
        assert any("TEST_John" in p["name"] for p in r.json())

    def test_get_patient_detail(self, admin_session, created_ids):
        r = admin_session.get(f"{API}/patients/{created_ids['patient_id']}")
        assert r.status_code == 200
        data = r.json()
        assert "appointments" in data and "prescriptions" in data and "bills" in data


# ---------------- Doctors ----------------
class TestDoctors:
    def test_create_doctor(self, admin_session, created_ids):
        email = f"test_doc{uuid.uuid4().hex[:6]}@example.com"
        payload = {"name": "TEST_Dr Smith", "email": email, "password": "doctorpass",
                   "specialization": "Cardiology", "phone": "1112223333"}
        r = admin_session.post(f"{API}/doctors", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["email"] == email.lower()
        created_ids["doctor_id"] = d["id"]

    def test_list_doctors(self, admin_session, created_ids):
        r = admin_session.get(f"{API}/doctors")
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert created_ids["doctor_id"] in ids


# ---------------- Appointments ----------------
class TestAppointments:
    def test_get_slots(self, admin_session, created_ids):
        date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        r = admin_session.get(f"{API}/appointments/slots",
                              params={"doctor_id": created_ids["doctor_id"], "date": date})
        assert r.status_code == 200
        assert "slots" in r.json()
        created_ids["appt_date"] = date

    def test_create_appointment(self, admin_session, created_ids):
        payload = {
            "patient_id": created_ids["patient_id"],
            "doctor_id": created_ids["doctor_id"],
            "date": created_ids["appt_date"],
            "time_slot": "10:00",
            "notes": "TEST_appt"
        }
        r = admin_session.post(f"{API}/appointments", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "scheduled"
        assert data["patient_name"].startswith("TEST_John")
        created_ids["appt_id"] = data["id"]

    def test_double_booking_blocked(self, admin_session, created_ids):
        payload = {
            "patient_id": created_ids["patient_id"],
            "doctor_id": created_ids["doctor_id"],
            "date": created_ids["appt_date"],
            "time_slot": "10:00",
            "notes": "dup"
        }
        r = admin_session.post(f"{API}/appointments", json=payload)
        assert r.status_code == 400


# ---------------- Inventory ----------------
class TestInventory:
    def test_create_inventory(self, admin_session, created_ids):
        payload = {"medicine_name": f"TEST_Paracetamol_{uuid.uuid4().hex[:4]}",
                   "category": "Tablet", "quantity": 100, "unit_price": 5.0,
                   "threshold": 10, "supplier": "S1"}
        r = admin_session.post(f"{API}/inventory", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["quantity"] == 100
        created_ids["inv_id"] = d["id"]
        created_ids["med_name"] = d["medicine_name"]

    def test_stock_in(self, admin_session, created_ids):
        r = admin_session.post(f"{API}/inventory/{created_ids['inv_id']}/stock",
                               json={"change_type": "in", "quantity": 50, "reason": "restock"})
        assert r.status_code == 200
        assert r.json()["new_quantity"] == 150

    def test_stock_out(self, admin_session, created_ids):
        r = admin_session.post(f"{API}/inventory/{created_ids['inv_id']}/stock",
                               json={"change_type": "out", "quantity": 30, "reason": "sale"})
        assert r.status_code == 200
        assert r.json()["new_quantity"] == 120


# ---------------- Prescriptions ----------------
class TestPrescriptions:
    def test_create_prescription(self, admin_session, created_ids):
        payload = {
            "patient_id": created_ids["patient_id"],
            "doctor_id": created_ids["doctor_id"],
            "diagnosis": "TEST_Flu",
            "medicines": [{"name": created_ids["med_name"], "quantity": 5, "dosage": "1-0-1"}],
            "notes": "rest"
        }
        r = admin_session.post(f"{API}/prescriptions", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"].startswith("RX-")
        created_ids["presc_id"] = d["id"]

    def test_inventory_deducted(self, admin_session, created_ids):
        r = admin_session.get(f"{API}/inventory")
        items = {i["id"]: i for i in r.json()}
        assert items[created_ids["inv_id"]]["quantity"] == 115  # 120-5


# ---------------- Billing ----------------
class TestBilling:
    def test_create_bill(self, admin_session, created_ids):
        payload = {
            "patient_id": created_ids["patient_id"],
            "items": [{"description": "Consult", "amount": 500},
                      {"description": "Med", "amount": 250}],
            "notes": "TEST_bill"
        }
        r = admin_session.post(f"{API}/billing", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["total_amount"] == 750
        assert d["status"] == "pending"
        created_ids["bill_id"] = d["id"]

    def test_mark_bill_paid(self, admin_session, created_ids):
        r = admin_session.put(f"{API}/billing/{created_ids['bill_id']}/status",
                              json={"status": "paid"})
        assert r.status_code == 200
        # Verify
        r2 = admin_session.get(f"{API}/billing")
        bill = next(b for b in r2.json() if b["id"] == created_ids["bill_id"])
        assert bill["status"] == "paid"


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_stats(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/stats")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["total_patients", "total_doctors", "today_appointments",
                  "low_stock_items", "today_revenue", "recent_appointments",
                  "recent_patients", "revenue_chart", "appointment_breakdown"]:
            assert k in d


# ---------------- Notifications ----------------
class TestNotifications:
    def test_list(self, admin_session):
        r = admin_session.get(f"{API}/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_read_all(self, admin_session):
        r = admin_session.put(f"{API}/notifications/read-all")
        assert r.status_code == 200


# ---------------- Logout ----------------
class TestZLogout:
    def test_logout(self, admin_session):
        r = admin_session.post(f"{API}/auth/logout")
        assert r.status_code == 200
