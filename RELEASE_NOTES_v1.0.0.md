# 🚀 RouteHunter B2B Factory Radar — Version 1.0.0 (Official Release)

**Release Date**: September 19, 2026  
**Status**: Production Ready (`https://b2bfactoryradar.vercel.app`)  
**Repository**: `akachai-ui/B2B-Factory-Radar`

---

## 🌟 Key Highlights & Core Features in Version 1.0.0

### 1. 🏭 989 Verified Factory Leads & Interactive Geospatial Radar
- Pre-seeded high-speed instant catalog containing **989 industrial factories in Samut Prakan**.
- Interactive district clustering and multi-radius radar search (3 km, 5 km, 10 km, 15 km, All).
- Real-time GPS distance calculation relative to the user's live position.

### 2. 📱 Modern Glassmorphic Smartphone & Desktop Responsive Architecture
- Native-app feel on mobile browsers with PWA support and high-resolution **Apple Touch Icon (180x180 px)** for Home Screen.
- 5-Tab Mobile Navigation: **พอร์ตฉัน**, **ช้อปเพิ่ม (989)**, **ทีมงาน**, **วิเคราะห์**, **บันทึกไมล์**.
- Zero text wrapping, balanced 4-column pipeline summary, and single-row Contact Health SLA monitoring.

### 3. 🚗 GPS Vehicle Mileage Tracking & Smart Fuel Reimbursement
- Morning Start Trip with odometer photo capture and automatic GPS pinning.
- Interim client stop check-in logging with timestamp and route distance calculation.
- Evening End Trip summary with standard reimbursement rate (5.00 ฿/km).
- Executive Audit Command Center for Managers and Owners (`MileageFuelReportModal`).

### 4. 💼 Unified CRM Sales Pipeline & Activity Timeline
- Multi-stage pipeline stepper: **ลูกค้าใหม่ ➔ โทรติดต่อ ➔ นัดหมายเข้าพบ ➔ เสนอราคา ➔ ปิดการขายสำเร็จ**.
- Multi-round activity timeline tracking notes, phone calls, meetings, quotations, and deal values.
- Contact Health SLA monitor (🟢 Active ≤6 days, 🟡 Stale >7 days, 🔴 Critical >30 days).

### 5. 👥 Multi-Tenant Organization & Team Management
- Role-based Access Control (Owner, Manager, Sales).
- Employee offboarding / resignation flow with Lead preservation.
- Central Company Pool (Unassigned Leads) and batch lead redistribution.
- Live email invitation system powered by Google Apps Script.

---

## 🛡️ Architecture & Deployment
- **Frontend & API**: Next.js 15 (App Router), React 19, Tailwind CSS, Leaflet.markercluster.
- **Backend & Auth**: Supabase PostgreSQL with Row Level Security (RLS) and Storage Buckets (`avatars`, `trip-photos`).
- **Production Hosting**: Vercel Serverless Auto-deploy (`b2bfactoryradar.vercel.app`).
