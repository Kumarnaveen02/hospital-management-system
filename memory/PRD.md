# Patient & Inventory Management System - PRD

## Original Problem Statement
Build a comprehensive healthcare management system with Patient Management, Appointment Scheduling, Doctor Panel, Inventory/Pharmacy, Billing, Prescriptions, Dashboard, and Notification modules.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based with httpOnly cookies, role-based access (admin, doctor, staff)
- **Database**: MongoDB (collections: users, patients, appointments, prescriptions, inventory, stock_logs, bills, visits, notifications, login_attempts)

## User Personas
- **Admin**: Full access - manage doctors, patients, inventory, billing, view dashboard
- **Doctor**: View appointments, create prescriptions, add diagnosis notes
- **Staff**: Manage patients, book appointments, handle billing

## Core Requirements
- JWT authentication with role-based access control
- Patient CRUD with unique IDs, search/filter
- Appointment booking with time-slot management
- Prescription creation with auto inventory deduction
- Inventory management with low stock alerts
- Billing with revenue tracking
- Analytics dashboard with charts
- In-app notification system

## What's Been Implemented (April 27, 2026)
### Backend (server.py - 764 lines)
- Auth: register, login (with brute force protection), logout, me
- Patient CRUD with search
- Doctor management (admin-only creation)
- Appointments: CRUD, time slots, conflict prevention, status updates
- Prescriptions: CRUD with auto inventory deduction + low stock alerts
- Inventory: CRUD, stock in/out tracking, threshold alerts
- Billing: CRUD, status management (pending/paid/cancelled), revenue API
- Dashboard: aggregate stats, charts data, recent activity
- Notifications: list, mark read, mark all read
- Admin seeding on startup

### Frontend (14 files)
- Login page with hospital branding
- Dashboard with 5 stat cards, revenue bar chart, appointment pie chart, recent activity
- Patients page with table, search, add dialog, detail view with tabs
- Appointments page with booking dialog (calendar + time slots), status filters
- Doctors page with card grid, add dialog (admin only)
- Prescriptions page with medicines management, auto-inventory deduction
- Inventory page with stock management, low stock badges
- Billing page with line items, revenue chart, pay/cancel actions
- Sidebar navigation, notification bell with dropdown
- Responsive layout

### Testing
- 23/23 backend API tests passing
- Frontend flows verified: login, dashboard, navigation, add patient, notifications, logout

## Prioritized Backlog
### P0 (Critical)
- (Done) All core modules implemented and tested

### P1 (High)
- Doctor leave management / availability toggle
- Patient visit history enhancement
- PDF invoice generation
- QR code prescription download

### P2 (Medium)
- Pagination on list endpoints
- WhatsApp/Email notification integration
- Real-time queue system
- AI-based medicine suggestion
- Online consultation feature

### P3 (Low)
- Split server.py into routers
- Role-specific dashboard views
- Audit logging
- Data export (CSV/Excel)

## Next Tasks
1. Doctor availability/leave management
2. PDF generation for invoices and prescriptions
3. Pagination on all list endpoints
4. Enhanced patient search with date filters
