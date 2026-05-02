from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock users database
MOCK_USERS = {
    "admin@example.com": {
        "_id": "admin123",
        "email": "admin@example.com",
        "password_hash": bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode(),
        "name": "Admin User",
        "role": "admin"
    },
    "ramavatar.sharma@kumarayurveda.com": {
        "_id": "doctor1",
        "email": "ramavatar.sharma@kumarayurveda.com",
        "password_hash": bcrypt.hashpw(b"RamavatarDoc@123", bcrypt.gensalt()).decode(),
        "name": "Vaidy Ramavatar Sharma",
        "role": "doctor"
    },
    "vijay.sharma@kumarayurveda.com": {
        "_id": "doctor2",
        "email": "vijay.sharma@kumarayurveda.com",
        "password_hash": bcrypt.hashpw(b"VijayDoc@123", bcrypt.gensalt()).decode(),
        "name": "Vaidy Vijay Sharma",
        "role": "doctor"
    },
    "jolly.sharma@kumarayurveda.com": {
        "_id": "doctor3",
        "email": "jolly.sharma@kumarayurveda.com",
        "password_hash": bcrypt.hashpw(b"JollyDoc@123", bcrypt.gensalt()).decode(),
        "name": "Vaidy Jolly Sharma",
        "role": "doctor"
    },
    "helpdesk1@kumarayurveda.com": {
        "_id": "helpdesk1",
        "email": "helpdesk1@kumarayurveda.com",
        "password_hash": bcrypt.hashpw(b"Helpdesk@123", bcrypt.gensalt()).decode(),
        "name": "Rajesh Kumar",
        "role": "helpdesk"
    },
    "helpdesk2@kumarayurveda.com": {
        "_id": "helpdesk2",
        "email": "helpdesk2@kumarayurveda.com",
        "password_hash": bcrypt.hashpw(b"Helpdesk@123", bcrypt.gensalt()).decode(),
        "name": "Priya Singh",
        "role": "helpdesk"
    },
}

JWT_SECRET = "your-secret-key-here-change-in-production"
JWT_ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

@app.post("/api/auth/login")
async def login(request: Request, response: Response):
    """Login endpoint"""
    try:
        data = await request.json()
        email = data.get("email", "").lower()
        password = data.get("password", "")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Find user in mock database
        if email not in MOCK_USERS:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = MOCK_USERS[email]
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create tokens
        access_token = create_access_token(user["_id"], user["email"])
        refresh_token = create_refresh_token(user["_id"])
        
        # Set cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return {
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "_id": user["_id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout(response: Response):
    """Logout endpoint"""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    """Get current user"""
    try:
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
        
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        for user in MOCK_USERS.values():
            if user["_id"] == payload.get("sub"):
                return {
                    "_id": user["_id"],
                    "email": user["email"],
                    "name": user["name"],
                    "role": user["role"]
                }
        
        raise HTTPException(status_code=401, detail="User not found")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "mock-backend"}

# Mock data for endpoints
MOCK_PATIENTS = [
    {"_id": "p1", "name": "Rajesh Kumar", "age": 45, "gender": "male", "phone": "9876543210", "address": "Jaipur", "blood_group": "O+"},
    {"_id": "p2", "name": "Priya Sharma", "age": 35, "gender": "female", "phone": "9876543211", "address": "Delhi", "blood_group": "AB-"},
]

MOCK_DOCTORS = [
    {
        "_id": "doctor1",
        "name": "Vaidy Ramavatar Sharma",
        "email": "ramavatar.sharma@kumarayurveda.com",
        "phone": "9876543220",
        "specialization": "General Ayurveda",
        "available": True
    },
    {
        "_id": "doctor2",
        "name": "Vaidy Vijay Sharma",
        "email": "vijay.sharma@kumarayurveda.com",
        "phone": "9876543221",
        "specialization": "General Ayurveda",
        "available": True
    },
    {
        "_id": "doctor3",
        "name": "Vaidy Jolly Sharma",
        "email": "jolly.sharma@kumarayurveda.com",
        "phone": "9876543222",
        "specialization": "Gynecologist - Female Health Specialist",
        "available": True
    },
]

MOCK_APPOINTMENTS = [
    {"_id": "a1", "patient_id": "p1", "doctor_id": "doctor1", "date": "2025-05-10", "time_slot": "10:00", "notes": "Regular checkup", "status": "scheduled"},
]

MOCK_PRESCRIPTIONS = [
    {"_id": "rx1", "patient_id": "p1", "doctor_id": "doctor1", "diagnosis": "Common Cold", "medicines": [{"name": "Tulsi Tea", "dosage": "1 cup", "duration": "7 days"}], "date": "2025-05-01"},
]

MOCK_INVENTORY = [
    {"_id": "inv1", "name": "Ashwagandha Powder", "category": "Powder", "quantity": 50, "unit_price": 250, "supplier": "Local Supplier"},
    {"_id": "inv2", "name": "Triphala Tablet", "category": "Tablet", "quantity": 100, "unit_price": 150, "supplier": "Supplier Two"},
]

MOCK_BILLS = [
    {"_id": "bill1", "patient_id": "p1", "amount": 5000, "date": "2025-05-01", "status": "paid", "items": [{"description": "Consultation", "amount": 500}, {"description": "Medicines", "amount": 4500}]},
]

MOCK_DASHBOARD_STATS = {
    "total_patients": 2,
    "total_doctors": 3,
    "total_appointments": 1,
    "total_revenue": 5000,
    "appointments_today": 0,
}

# Auth helper for protected routes
def verify_token(request: Request):
    """Verify JWT token from request"""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        for user in MOCK_USERS.values():
            if user["_id"] == payload.get("sub"):
                return user
        raise HTTPException(status_code=401, detail="User not found")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Patients endpoints
@app.get("/api/patients")
async def get_patients(request: Request, search: str = ""):
    """Get all patients"""
    verify_token(request)
    if search:
        return [p for p in MOCK_PATIENTS if search.lower() in p["name"].lower()]
    return MOCK_PATIENTS

@app.post("/api/patients")
async def create_patient(request: Request):
    """Create new patient"""
    verify_token(request)
    data = await request.json()
    new_patient = {
        "_id": f"p{len(MOCK_PATIENTS)+1}",
        "name": data.get("name"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "phone": data.get("phone"),
        "address": data.get("address"),
        "blood_group": data.get("blood_group"),
    }
    MOCK_PATIENTS.append(new_patient)
    return {"success": True, "patient": new_patient}

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str, request: Request):
    """Get patient details"""
    verify_token(request)
    for patient in MOCK_PATIENTS:
        if patient["_id"] == patient_id:
            return patient
    raise HTTPException(status_code=404, detail="Patient not found")

# Doctors/Vaidy endpoints
@app.get("/api/doctors")
async def get_doctors(request: Request):
    """Get all doctors/vaidy"""
    verify_token(request)
    return MOCK_DOCTORS

@app.post("/api/doctors")
async def create_doctor(request: Request):
    """Create new doctor"""
    user = verify_token(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add doctors")
    data = await request.json()
    new_doctor = {
        "_id": f"doctor{len(MOCK_DOCTORS)+1}",
        "name": data.get("name"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "specialization": data.get("specialization"),
        "available": True,
    }
    MOCK_DOCTORS.append(new_doctor)
    return {"success": True, "doctor": new_doctor}

# Appointments endpoints
@app.get("/api/appointments")
async def get_appointments(request: Request):
    """Get all appointments"""
    verify_token(request)
    return MOCK_APPOINTMENTS

@app.post("/api/appointments")
async def create_appointment(request: Request):
    """Create new appointment"""
    verify_token(request)
    data = await request.json()
    new_appointment = {
        "_id": f"a{len(MOCK_APPOINTMENTS)+1}",
        "patient_id": data.get("patient_id"),
        "doctor_id": data.get("doctor_id"),
        "date": data.get("date"),
        "time_slot": data.get("time_slot"),
        "notes": data.get("notes", ""),
        "status": "scheduled",
    }
    MOCK_APPOINTMENTS.append(new_appointment)
    return {"success": True, "appointment": new_appointment}

# Prescriptions endpoints
@app.get("/api/prescriptions")
async def get_prescriptions(request: Request):
    """Get all prescriptions"""
    verify_token(request)
    return MOCK_PRESCRIPTIONS

@app.post("/api/prescriptions")
async def create_prescription(request: Request):
    """Create new prescription"""
    verify_token(request)
    data = await request.json()
    new_prescription = {
        "_id": f"rx{len(MOCK_PRESCRIPTIONS)+1}",
        "patient_id": data.get("patient_id"),
        "doctor_id": data.get("doctor_id"),
        "diagnosis": data.get("diagnosis"),
        "medicines": data.get("medicines", []),
        "date": datetime.now(timezone.utc).isoformat(),
    }
    MOCK_PRESCRIPTIONS.append(new_prescription)
    return {"success": True, "prescription": new_prescription}

# Inventory endpoints
@app.get("/api/inventory")
async def get_inventory(request: Request):
    """Get all inventory items"""
    verify_token(request)
    return MOCK_INVENTORY

@app.post("/api/inventory")
async def create_inventory_item(request: Request):
    """Create new inventory item"""
    verify_token(request)
    data = await request.json()
    new_item = {
        "_id": f"inv{len(MOCK_INVENTORY)+1}",
        "name": data.get("name"),
        "category": data.get("category"),
        "quantity": data.get("quantity"),
        "unit_price": data.get("unit_price"),
        "supplier": data.get("supplier"),
    }
    MOCK_INVENTORY.append(new_item)
    return {"success": True, "item": new_item}

# Billing endpoints
@app.get("/api/billing")
async def get_bills(request: Request):
    """Get all bills"""
    verify_token(request)
    return MOCK_BILLS

@app.post("/api/billing")
async def create_bill(request: Request):
    """Create new bill"""
    verify_token(request)
    data = await request.json()
    new_bill = {
        "_id": f"bill{len(MOCK_BILLS)+1}",
        "patient_id": data.get("patient_id"),
        "amount": data.get("amount"),
        "date": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
        "items": data.get("items", []),
    }
    MOCK_BILLS.append(new_bill)
    return {"success": True, "bill": new_bill}

# Dashboard stats endpoint
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    verify_token(request)
    return MOCK_DASHBOARD_STATS

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Kumar Ayurveda Mock Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
