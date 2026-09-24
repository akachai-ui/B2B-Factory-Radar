# B2B Factory Radar (RouteHunter) — Project Status & Knowledge Base

## 1. ข้อมูลเวอร์ชันและการพัฒนา (Version & Status)
- **Active Version**: `v3.0.0` (Major Architecture & Realtime Release)
- **Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Leaflet (SSR Disabled), Supabase (Auth & PostgreSQL).
- **เป้าหมายหลัก**: แพลตฟอร์ม B2B Radar ค้นหาและปักหมุดโรงงาน 989 แห่ง (ขยายจากฐานข้อมูล 390,000+ แห่ง) พร้อมระบบวางแผนเส้นทางเซลส์, บันทึก CRM, และจัดการทีม

---

## 2. ฟีเจอร์หลักใน Version 3.0.0 (Release Notes)
1. **Company-First Architecture (Single Workspace Model)**:
   - ปรับทุกบัญชีผู้ใช้เป็นระบบบริษัท/ทีมอัตโนมัติ เพื่อความเรียบง่ายและเป็นมืออาชีพ ป้องกันปัญหา Foreign Key
2. **ระบบสิทธิ์ `system_admins` ผ่านฐานข้อมูล (Database-Driven)**:
   - ยกเลิกการ Hardcode อีเมลใน Source Code 100%
   - ตรวจสอบสิทธิ์ Super Admin และสถานะ `PRO_UNLOCKED` จากตาราง `public.system_admins`
3. **ระบบซิงค์ข้อมูลสด Real-time (Supabase Realtime)**:
   - ตาราง `vehicle_trips` และ `trip_checkins` ซิงค์สถานะการอนุมัติ/แก้ไขแบบสดข้ามหน้าจอทันที
4. **ปรับปรุง UX ทริปเดินทางและการขอเบิกค่าน้ำมัน**:
   - แก้ไขปัญหา Pop-up ค้างซ้อน พร้อมระบบ Auto-close และ Auto-reset ฟอร์มอย่างลื่นไหล
5. **แก้ปัญหา Auth Loop & Invitation Constraints**:
   - ล็อกอินแล้วเข้าสู่ `/radar` ทันที และรองรับคำเชิญเข้าร่วมทีมอย่างสมบูรณ์

---

## 4. ระบบจัดการสิทธิ์ผู้ใช้งาน (Role & Access Control System)

### กฎการอนุมัติสิทธิ์ (Access Status Rules):
1. **Super Admin (ตรวจสอบจากตาราง `system_admins`)**:
   - ได้รับสิทธิ์ **`PRO_UNLOCKED`** เสมอแบบ Unconditional bypass
2. **Owner ของบริษัท**:
   - เมื่อสมัครใหม่ สถานะจะเป็น **`PENDING_APPROVAL`** (Preview Mode)
   - เมื่อ Admin อนุมัติใน Supabase / Dev Hub จะเปลี่ยนเป็น **`PRO_UNLOCKED`**
3. **สมาชิกในทีม (Team Members - Sales / Manager)**:
   - **สืบทอดสิทธิ์ Pro จาก Owner เสมอ** (`isCompanyOwnerUnlocked = true` ➔ ได้รับสิทธิ์ `PRO_UNLOCKED` อัตโนมัติทันที ไม่ต้องรออนุมัติแยกคน)

```ts
const companyOwnerMember = teamMembers.find((m) => m.role === 'owner' || (currentCompany?.owner_id && m.id === currentCompany.owner_id));
const isCompanyOwnerUnlocked = companyOwnerMember?.access_status === 'PRO_UNLOCKED';
const isProUnlocked = isSuperAdmin || profile?.access_status === 'PRO_UNLOCKED' || !!isCompanyOwnerUnlocked;
const isPreviewMode = !isProUnlocked;
```

---

## 3. มาตรการป้องกันข้อมูลสำหรับ `PENDING_APPROVAL` (Preview Mode)

1. **พื้นที่แผนที่เรดาร์ (`FactoryMap`)**:
   - **เปิดให้มองเห็นภาพรวมแผนที่และหมุดพิกัดตามปกติ** ซูมเข้า-ออกได้ เพื่อให้ผู้ใช้สัมผัสประสบการณ์เรดาร์
2. **การเซนเซอร์ชื่อบริษัท (Company Name Masking)**:
   - เซนเซอร์ชื่อเฉพาะ เช่น `บริษัท แหลมฟ้าผ่า โลจิสติก จำกัด` ➔ `บริษัท แหลมฟ้า*** (Pro Feature)`
3. **การเซนเซอร์ที่อยู่ (Detailed Address Obfuscation)**:
   - ซ่อนเลขที่/ซอย/ถนน แสดงเฉพาะระดับ `อำเภอ & จังหวัด` เช่น `อำเภอเมืองสมุทรปราการ สมุทรปราการ (ที่อยู่ละเอียดสงวนสิทธิ์ Pro)`
4. **การล็อกฟังก์ชันนำทาง & ติดต่อ**:
   - ปุ่ม **"นำทาง GPS"** (Google Maps) ➔ แสดงไอคอนแม่กุญแจทอง และเรียก `AccessLockModal`
   - ปุ่ม **"โทรออก / ดูเบอร์โทร"** ➔ ซ่อนเบอร์ และเรียก `AccessLockModal`
   - ปุ่ม **"🛒 หยิบใส่พอร์ต (Claim)"** ➔ เรียก `AccessLockModal`

---

## 4. Helper Functions ที่สำคัญ (`lib/leadUtils.ts`)
- `maskCompanyName(name, isPro)`: เซนเซอร์ชื่อบริษัท
- `maskAddress(address, district, province, isPro)`: ซ่อนบ้านเลขที่และที่อยู่ย่อย
- `calculateContactHealth(dateStr)`: คำนวณสุขภาพการติดต่อลูกค้าในพอร์ต (Active ≤6ว., Stale >7ว., Critical >30ว.)

---

## 5. วิธีรัน Dev Server & การใช้งาน
- **Start Dev Server**: `npm run dev` (พอร์ต `http://localhost:3000`)
- **Local Supabase**: `http://127.0.0.1:54321` (Studio: `http://localhost:54323`)
- **หน้าเรดาร์หลัก**: `/radar`
- **หน้า Developer/Admin Control Panel**: `/dev`
