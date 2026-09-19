'use client';

import React, { useState } from 'react';
import {
  Database,
  Layers,
  Table,
  Key,
  Link2,
  ArrowRight,
  ShieldCheck,
  Users,
  Building2,
  MapPin,
  ShoppingCart,
  Car,
  Gauge,
  FileCode,
  CheckCircle2,
  Sparkles,
  Clock,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Info,
  Fuel,
  Workflow,
  Compass,
} from 'lucide-react';

interface ColumnDef {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignRef?: string;
  description: string;
  example?: string;
}

interface TableDef {
  id: string;
  name: string;
  thaiName: string;
  domain: 'auth' | 'leads' | 'crm' | 'trips';
  domainLabel: string;
  domainColor: string;
  rowCountEstimate: string;
  purpose: string;
  howItWorks: string;
  foreignKeys: string[];
  columns: ColumnDef[];
  sampleQuery: string;
}

const DATABASE_TABLES: TableDef[] = [
  // 1. PROFILES
  {
    id: 'profiles',
    name: 'public.profiles',
    thaiName: 'ข้อมูลบัญชีผู้ใช้งาน (User Profiles)',
    domain: 'auth',
    domainLabel: 'ระบบผู้ใช้ & องค์กร (Identity & Multi-Tenant)',
    domainColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    rowCountEstimate: '~3 บัญชี (เติบโตตามผู้ใช้)',
    purpose: 'เก็บข้อมูลส่วนตัว บทบาทหน้าที่ (Role) และสังกัดบริษัท (Company) ของผู้ใช้งานที่ล็อกอินผ่านระบบ',
    howItWorks: 'เชื่อมต่อแบบ 1:1 กับตาราง auth.users ของ Supabase ผ่านคอลัมน์ id (UUID) เมื่อผู้ใช้ล็อกอินครั้งแรก ระบบจะสร้างแถวใน profiles อัตโนมัติ หากเป็นเซลส์สังกัดทีมจะมี company_id ชี้ไปยังบริษัทนายจ้าง',
    foreignKeys: [
      'id ➔ auth.users.id (1:1)',
      'company_id ➔ public.companies.id (N:1)',
    ],
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isForeign: true, foreignRef: 'auth.users.id', description: 'User ID อ้างอิงตรงกับ Supabase Auth', example: 'c220bc9d-1603-4b2d-a5a4-21b5a1af96f6' },
      { name: 'email', type: 'text', description: 'อีเมลของผู้ใช้งานที่ใช้เข้าสู่ระบบ', example: 'sales01@company.com' },
      { name: 'full_name', type: 'text', description: 'ชื่อ-นามสกุล หรือชื่อเรียกของเซลส์', example: 'สมชาย มุ่งมั่นขาย' },
      { name: 'phone', type: 'text', description: 'เบอร์โทรศัพท์สำหรับติดต่อภายในทีม', example: '0812345678' },
      { name: 'account_type', type: 'text', description: 'ประเภทบัญชี: individual (บุคคลทั่วไป) หรือ company (นิติบุคคล)', example: 'company' },
      { name: 'company_id', type: 'uuid', isForeign: true, foreignRef: 'public.companies.id', description: 'รหัสบริษัทที่ผู้ใช้สังกัดอยู่ (Null หากเป็นฟรีแลนซ์)', example: 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' },
      { name: 'role', type: 'text', description: 'ระดับสิทธิ์: owner (เจ้าของ), manager (ผู้จัดการทีม), sales_rep (เซลส์)', example: 'sales_rep' },
      { name: 'avatar_url', type: 'text', description: 'รูปโปรไฟล์ผู้ใช้', example: 'https://lh3.googleusercontent.com/...' },
      { name: 'onboarded', type: 'boolean', description: 'สถานะผ่านการตั้งค่าเริ่มต้นแล้วหรือไม่', example: 'true' },
      { name: 'created_at', type: 'timestamptz', description: 'วันเวลาที่สร้างบัญชี', example: '2026-09-12 14:00:00+07' },
    ],
    sampleQuery: `SELECT p.id, p.full_name, p.role, c.name as company_name 
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.role = 'sales_rep';`,
  },

  // 2. COMPANIES
  {
    id: 'companies',
    name: 'public.companies',
    thaiName: 'ข้อมูลบริษัท / องค์กร (Organizations)',
    domain: 'auth',
    domainLabel: 'ระบบผู้ใช้ & องค์กร (Identity & Multi-Tenant)',
    domainColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    rowCountEstimate: '~1-2 บริษัท (Multi-Tenant)',
    purpose: 'เป็นตารางศูนย์กลางของแต่ละองค์กรที่สมัครใช้ระบบ ใช้แยกสิทธิ์ (Tenant Isolation) และรวมทีมเซลส์',
    howItWorks: 'เจ้าของบริษัท (Owner) เป็นผู้สร้างบริษัท ข้อมูลโรงงานในพอร์ต (company_leads) และคำเชิญทีมงาน (team_invitations) ทั้งหมดจะผูกกับ company_id ของตารางนี้',
    foreignKeys: [
      'owner_id ➔ public.profiles.id (N:1)',
    ],
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, description: 'รหัสประจำตัวบริษัท (UUID)', example: 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' },
      { name: 'name', type: 'text', description: 'ชื่อบริษัทหรือชื่อทีมการค้า', example: 'Innovatech Co., Ltd.' },
      { name: 'tax_id', type: 'text', description: 'เลขประจำตัวผู้เสียภาษี 13 หลัก', example: '1659900487250' },
      { name: 'owner_id', type: 'uuid', isForeign: true, foreignRef: 'public.profiles.id', description: 'User ID ของเจ้าของบริษัทผู้มีสิทธิ์สูงสุด', example: 'c220bc9d-1603-4b2d-a5a4-21b5a1af96f6' },
      { name: 'address', type: 'text', description: 'ที่อยู่สำนักงานใหญ่', example: 'สมุทรปราการ' },
      { name: 'phone', type: 'text', description: 'เบอร์โทรศัพท์สำนักงาน', example: '02-123-4567' },
      { name: 'logo_url', type: 'text', description: 'โลโก้บริษัทสำหรับออกเอกสาร White-label', example: '/images/logo.png' },
      { name: 'created_at', type: 'timestamptz', description: 'วันเวลาที่จดทะเบียนในระบบ', example: '2026-09-12 10:00:00+07' },
    ],
    sampleQuery: `SELECT c.name, count(p.id) as total_sales_members 
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
GROUP BY c.id, c.name;`,
  },

  // 3. TEAM INVITATIONS
  {
    id: 'team_invitations',
    name: 'public.team_invitations',
    thaiName: 'คำเชิญเข้าร่วมทีมฝ่ายขาย (Team Invitations)',
    domain: 'auth',
    domainLabel: 'ระบบผู้ใช้ & องค์กร (Identity & Multi-Tenant)',
    domainColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    rowCountEstimate: '~3-10 รายการ',
    purpose: 'จัดการคำเชิญเซลส์หรือผู้จัดการเข้าสู่บริษัท ทั้งแบบส่งอีเมลและส่งลิงก์ตรง (Direct Invite Link)',
    howItWorks: 'Owner/Manager กดเชิญด้วยอีเมล ➔ ระบบสร้าง token ➔ เซลล์กดลิงก์ /invite/accept ➔ ระบบอัปเดต company_id ใน profile ของเซลส์ และเปลี่ยนสถานะคำเชิญเป็น accepted',
    foreignKeys: [
      'company_id ➔ public.companies.id (N:1)',
      'invited_by ➔ public.profiles.id (N:1)',
    ],
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, description: 'รหัสคำเชิญ (UUID)', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
      { name: 'company_id', type: 'uuid', isForeign: true, foreignRef: 'public.companies.id', description: 'บริษัทที่ส่งคำเชิญ', example: 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' },
      { name: 'invited_email', type: 'text', description: 'อีเมลของสมาชิกที่ถูกเชิญ', example: 'sales_junior@gmail.com' },
      { name: 'role', type: 'text', description: 'บทบาทที่จะได้รับเมื่อตอบรับ: sales_rep หรือ manager', example: 'sales_rep' },
      { name: 'status', type: 'text', description: 'สถานะ: pending (รอยืนยัน), accepted (ตอบรับแล้ว), declined (ปฏิเสธ), canceled (ยกเลิก)', example: 'pending' },
      { name: 'token', type: 'text', description: 'โทเคนความปลอดภัยสำหรับ URL ลิงก์ตรง', example: 'inv_9f8e7d6c5b4a3...' },
      { name: 'created_at', type: 'timestamptz', description: 'วันเวลาที่ส่งคำเชิญ', example: '2026-09-13 11:00:00+07' },
    ],
    sampleQuery: `SELECT invited_email, role, status, created_at 
FROM public.team_invitations 
WHERE company_id = 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' AND status = 'pending';`,
  },

  // 4. LEADS
  {
    id: 'leads',
    name: 'public.leads',
    thaiName: 'คลังโรงงานแผนที่เรดาร์ (Factory Radar Master Leads)',
    domain: 'leads',
    domainLabel: 'คลังข้อมูลโรงงาน (Factory Master Catalog)',
    domainColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    rowCountEstimate: '989 โรงงาน (จ.สมุทรปราการ)',
    purpose: 'เป็นตาราง Master Catalog เก็บข้อมูลโรงงานจริงบนแผนที่ มีพิกัด lat/lng, อำเภอ, เบอร์โทร, และหมวดธุรกิจ',
    howItWorks: 'แสดงบนหน้า Radar Map & Marketplace เซลล์สามารถเปิดดูระยะห่างจากพิกัด GPS สด, กด 1-Tap Google Maps นำทาง, โทรออกทันที และกด "🛒 หยิบใส่พอร์ต" เพื่อดึงเข้าตาราง company_leads',
    foreignKeys: [
      'เป็น Master Table ให้ company_leads.lead_id อ้างอิง',
    ],
    columns: [
      { name: 'id', type: 'bigint / serial', isPrimary: true, description: 'รหัสประจำโรงงาน Master', example: '101' },
      { name: 'name', type: 'text', description: 'ชื่อโรงงานหรือชื่อสถานประกอบการ', example: 'บริษัท ไดน่าพลาสติค จำกัด' },
      { name: 'address', type: 'text', description: 'ที่อยู่ตั้งโรงงาน', example: '123 หมู่ 2 ถ.บางนา-ตราด ต.บางพลีใหญ่' },
      { name: 'district', type: 'text', description: 'อำเภอ (บางพลี, เมือง, พระประแดง, พระสมุทรเจดีย์, บางเสาธง, บางบ่อ)', example: 'บางพลี' },
      { name: 'province', type: 'text', description: 'จังหวัด', example: 'สมุทรปราการ' },
      { name: 'lat', type: 'double precision', description: 'พิกัด ละติจูด (Latitude) สำหรับวางหมุดแผนที่', example: '13.604512' },
      { name: 'lng', type: 'double precision', description: 'พิกัด ลองจิจูด (Longitude) สำหรับวางหมุดแผนที่', example: '100.702315' },
      { name: 'phone', type: 'text', description: 'เบอร์โทรศัพท์สำหรับติดต่อโรงงาน', example: '02-750-1234' },
      { name: 'business_type', type: 'text', description: 'หมวดหมู่ประเภทธุรกิจ', example: 'ผลิตบรรจุภัณฑ์พลาสติก' },
      { name: 'tsic_code', type: 'text', description: 'รหัสมาตรฐานอุตสาหกรรม (TSIC)', example: '22209' },
      { name: 'maps_url', type: 'text', description: 'ลิงก์ตรงเปิด Google Maps Navigator', example: 'https://maps.google.com/?q=...' },
    ],
    sampleQuery: `SELECT district, count(*) as factory_count 
FROM public.leads 
GROUP BY district 
ORDER BY factory_count DESC;`,
  },

  // 5. COMPANY_LEADS
  {
    id: 'company_leads',
    name: 'public.company_leads',
    thaiName: 'พอร์ตลูกค้า & สถานะงานขาย CRM (Sales Pipeline)',
    domain: 'crm',
    domainLabel: 'ระบบงานขาย & พอร์ต CRM (Sales & Portfolio)',
    domainColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    rowCountEstimate: 'ตามที่เซลส์หยิบเข้าพอร์ต',
    purpose: 'เก็บความสัมพันธ์ระหว่าง "บริษัทเรา" กับ "โรงงานที่กำลังดูแล" พร้อมสถานะ Pipeline, บันทึกโน้ต, และมูลค่าดีล',
    howItWorks: 'เมื่อเซลส์กด "🛒 หยิบใส่พอร์ต" ระบบจะ Clone ข้อมูลโรงงานมาสร้างแถวในตารางนี้ พร้อมผูก company_id และ assigned_to เป็นของเซลส์คนนั้น ป้องกันไม่ให้เซลส์คนอื่นแย่งลูกค้ากัน',
    foreignKeys: [
      'company_id ➔ public.companies.id (N:1)',
      'assigned_to ➔ public.profiles.id (N:1)',
      'lead_id ➔ public.leads.id (Optional N:1)',
    ],
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, description: 'รหัสประจำดีล/ลูกค้าในพอร์ต (UUID)', example: 'e7a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c' },
      { name: 'company_id', type: 'uuid', isForeign: true, foreignRef: 'public.companies.id', description: 'บริษัทที่เป็นเจ้าของพอร์ตลูกค้านี้', example: 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' },
      { name: 'assigned_to', type: 'uuid', isForeign: true, foreignRef: 'public.profiles.id', description: 'เซลส์ผู้รับผิดชอบดูแลลูกค้ารายนี้', example: 'c220bc9d-1603-4b2d-a5a4-21b5a1af96f6' },
      { name: 'lead_id', type: 'bigint', isForeign: true, foreignRef: 'public.leads.id', description: 'รหัสโรงงานเดิมที่หยิบมาจากคลัง leads', example: '101' },
      { name: 'company_name', type: 'text', description: 'ชื่อโรงงาน / ลูกค้า', example: 'บริษัท ไดน่าพลาสติค จำกัด' },
      { name: 'status', type: 'text', description: 'ขั้นตอนงานขาย: NEW, CONTACTED, MEETING, QUOTED, WON, LOST', example: 'MEETING' },
      { name: 'deal_value', type: 'numeric', description: 'มูลค่าการซื้อขายที่คาดหวัง (บาท)', example: '450000.00' },
      { name: 'priority', type: 'text', description: 'ระดับความสำคัญ: HIGH, MEDIUM, LOW', example: 'HIGH' },
      { name: 'notes', type: 'text', description: 'บันทึกโน้ตการโทร การเข้าพบ ข้อตกลง และสเปกสินค้า', example: 'ลูกค้าต้องการเม็ด PP สีขาว 5 ตัน/เดือน นัดทดสอบตัวอย่างวันที่ 20' },
      { name: 'last_contact_date', type: 'timestamptz', description: 'วันเวลาที่ติดต่อลูกค้าครั้งล่าสุด (ใช้คำนวณ Stale Leads เตือนเซลส์)', example: '2026-09-14 09:30:00+07' },
      { name: 'lat', type: 'double precision', description: 'พิกัด GPS สำหรับแสดงหมุดในพอร์ต', example: '13.604512' },
      { name: 'lng', type: 'double precision', description: 'พิกัด GPS สำหรับแสดงหมุดในพอร์ต', example: '100.702315' },
    ],
    sampleQuery: `SELECT status, count(*) as count, sum(deal_value) as total_pipeline_value 
FROM public.company_leads 
WHERE company_id = 'd94e0738-bcbe-45ff-82e2-21d96103c8b7'
GROUP BY status;`,
  },

  // 6. VEHICLE_TRIPS
  {
    id: 'vehicle_trips',
    name: 'public.vehicle_trips',
    thaiName: 'บันทึกการเดินทาง & ค่าน้ำมันเซลส์ (Vehicle Trips & Mileage)',
    domain: 'trips',
    domainLabel: 'ระบบเดินทาง & ค่าใช้จ่าย (Field Trip & Mileage)',
    domainColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    rowCountEstimate: 'ตามรอบการเดินทางของเซลส์',
    purpose: 'บันทึกประวัติการขับรถออกไปพบลูกค้า บันทึกเลขไมล์เริ่มต้น-สิ้นสุด และคำนวณเบิกค่าน้ำมัน',
    howItWorks: 'ก่อนออกเดินทาง เซลล์กด "เริ่มทริป" บันทึกเลขไมล์ ➔ เมื่อถึงโรงงานหรือจบทริป กด "สิ้นสุดทริป" พร้อมกรอกค่าน้ำมัน ➔ ผู้จัดการสามารถดูรายงานรวมและส่งออกเอกสารได้',
    foreignKeys: [
      'user_id ➔ public.profiles.id (N:1)',
      'company_id ➔ public.companies.id (N:1)',
    ],
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, description: 'รหัสประจำทริปเดินทาง (UUID)', example: 'f8e7d6c5-b4a3-2109-8765-43210fedcba9' },
      { name: 'user_id', type: 'uuid', isForeign: true, foreignRef: 'public.profiles.id', description: 'เซลส์ผู้ขับขี่เดินทาง', example: 'c220bc9d-1603-4b2d-a5a4-21b5a1af96f6' },
      { name: 'company_id', type: 'uuid', isForeign: true, foreignRef: 'public.companies.id', description: 'บริษัทต้นสังกัดสำหรับรวมยอดเบิกจ่าย', example: 'd94e0738-bcbe-45ff-82e2-21d96103c8b7' },
      { name: 'start_mileage', type: 'numeric', description: 'เลขไมล์เริ่มต้น (กม.)', example: '124500' },
      { name: 'end_mileage', type: 'numeric', description: 'เลขไมล์สิ้นสุด (กม.)', example: '124585' },
      { name: 'total_distance_km', type: 'numeric', description: 'ระยะทางรวมที่วิ่งจริง (กม.)', example: '85.0' },
      { name: 'fuel_cost', type: 'numeric', description: 'ค่าน้ำมันที่เติมระหว่างทริป (บาท)', example: '800.00' },
      { name: 'purpose', type: 'text', description: 'วัตถุประสงค์การเดินทาง / ชื่อลูกค้าที่ไปพบ', example: 'เข้าพบโรงงาน บจก. ไดน่าพลาสติค ส่งมอบตัวอย่างเม็ด' },
      { name: 'status', type: 'text', description: 'สถานะทริป: ACTIVE (กำลังเดินทาง), COMPLETED (จบทริปแล้ว)', example: 'COMPLETED' },
      { name: 'start_time', type: 'timestamptz', description: 'เวลาเริ่มออกเดินทาง', example: '2026-09-14 08:30:00+07' },
      { name: 'end_time', type: 'timestamptz', description: 'เวลาสิ้นสุดการเดินทาง', example: '2026-09-14 17:00:00+07' },
    ],
    sampleQuery: `SELECT p.full_name, sum(t.total_distance_km) as total_km, sum(t.fuel_cost) as total_fuel_reimburse
FROM public.vehicle_trips t
JOIN public.profiles p ON t.user_id = p.id
WHERE t.status = 'COMPLETED'
GROUP BY p.full_name;`,
  },

  // 7. DBD_COMPANIES
  {
    id: 'dbd_companies',
    name: 'public.dbd_companies',
    thaiName: 'ทะเบียนนิติบุคคล DBD ทั่วประเทศ (DBD Corporate Registry)',
    domain: 'leads',
    domainLabel: 'คลังข้อมูลโรงงาน & นิติบุคคล (Master Reference)',
    domainColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    rowCountEstimate: '371,350 บริษัท',
    purpose: 'คลังข้อมูลนิติบุคคลทางการจากกรมพัฒนาธุรกิจการค้า ใช้ตรวจสอบความมั่นคง ทุนจดทะเบียน และรหัส TSIC',
    howItWorks: 'เก็บข้อมูลบริษัทที่ยังดำเนินกิจการอยู่ (Active) มีเลขทะเบียน 13 หลัก, ทุนจดทะเบียน, วัตถุประสงค์ ใช้สำหรับตรวจสอบความน่าเชื่อถือก่อนดึงลูกค้าเข้าพอร์ต',
    foreignKeys: [
      'อ้างอิงผ่าน tax_id หรือ ค้นหาด้วยชื่อบริษัท',
    ],
    columns: [
      { name: 'id', type: 'bigint / serial', isPrimary: true, description: 'รหัสลำดับ', example: '20501' },
      { name: 'tax_id', type: 'varchar(20)', description: 'เลขทะเบียนนิติบุคคล 13 หลัก', example: '0115561008123' },
      { name: 'name', type: 'text', description: 'ชื่อนิติบุคคลตามหนังสือรับรอง', example: 'บริษัท ยูนิคพลาสติก อินดัสตรี จำกัด (มหาชน)' },
      { name: 'registered_capital', type: 'numeric', description: 'ทุนจดทะเบียน (บาท)', example: '330000000.00' },
      { name: 'tsic_code', type: 'varchar(10)', description: 'รหัสประเภทธุรกิจ TSIC 5 หลัก', example: '22209' },
      { name: 'objective', type: 'text', description: 'วัตถุประสงค์ตอนจดทะเบียนนิติบุคคล', example: 'ผลิตและจำหน่ายผลิตภัณฑ์พลาสติกทุกชนิด' },
      { name: 'province', type: 'text', description: 'จังหวัดที่ตั้งสำนักงานใหญ่', example: 'สมุทรปราการ' },
      { name: 'status', type: 'varchar(50)', description: 'สถานะกิจการ: ยังดำเนินกิจการอยู่', example: 'ACTIVE' },
    ],
    sampleQuery: `SELECT tax_id, name, registered_capital, tsic_code 
FROM public.dbd_companies 
WHERE name ILIKE '%พลาสติก%' AND province ILIKE '%สมุทรปราการ%' 
ORDER BY registered_capital DESC LIMIT 10;`,
  },

  // 8. TARGET_FACTORY_LEADS
  {
    id: 'target_factory_leads',
    name: 'public.target_factory_leads',
    thaiName: 'โรงงานเป้าหมายคัดกรองวัตถุดิบ (Curated Factory Buyer Leads)',
    domain: 'leads',
    domainLabel: 'คลังข้อมูลโรงงาน & นิติบุคคล (Master Reference)',
    domainColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    rowCountEstimate: '4,112 โรงงาน',
    purpose: 'คัดกรองโรงงานขนาดใหญ่พร้อมจัดกลุ่มวัตถุดิบที่โรงงานต้องใช้ (raw_materials_needed)',
    howItWorks: 'ดึงนิติบุคคลจาก DBD เฉพาะกลุ่มอุตสาหกรรมเป้าหมาย (ยานยนต์, เครื่องใช้ไฟฟ้า, บรรจุภัณฑ์) และระบุสเปกเม็ดพลาสติก/ยางที่ต้องใช้ ช่วยให้เซลส์วิเคราะห์ความต้องการลูกค้าได้ทันที',
    foreignKeys: [
      'tax_id สอดคล้องกับ dbd_companies',
    ],
    columns: [
      { name: 'id', type: 'bigserial', isPrimary: true, description: 'รหัสประจำโรงงาน', example: '1' },
      { name: 'tax_id', type: 'varchar(20)', description: 'เลขทะเบียนนิติบุคคล 13 หลัก', example: '0105565134101' },
      { name: 'company_name', type: 'text', description: 'ชื่อโรงงานเป้าหมาย', example: 'บริษัท บีวายดี ออโต้ (ประเทศไทย) จำกัด' },
      { name: 'industry_cluster', type: 'varchar(50)', description: 'กลุ่มอุตสาหกรรม (AUTOMOTIVE_PARTS, ELECTRICAL_APPLIANCES ฯลฯ)', example: 'AUTOMOTIVE_PARTS' },
      { name: 'raw_materials_needed', type: 'text', description: 'วัตถุดิบที่โรงงานต้องใช้ซื้อเข้าโรงงาน', example: 'Engineering Plastics (PA6, PA66, POM, ABS), ยาง EPDM' },
      { name: 'capital_tier', type: 'varchar(20)', description: 'ขนาดองค์กร: ENTERPRISE, LARGE, MID, SME', example: 'ENTERPRISE' },
      { name: 'province', type: 'text', description: 'จังหวัดที่ตั้งโรงงาน', example: 'ระยอง' },
    ],
    sampleQuery: `SELECT industry_cluster, count(*) as count 
FROM public.target_factory_leads 
GROUP BY industry_cluster;`,
  },
];

export function DatabaseSchemaDoc() {
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDomain, setFilterDomain] = useState<string>('ALL');
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  const activeTable = DATABASE_TABLES.find((t) => t.id === selectedTable) || DATABASE_TABLES[0];

  const filteredTables = DATABASE_TABLES.filter((t) => {
    const matchesDomain = filterDomain === 'ALL' || t.domain === filterDomain;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.thaiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const handleCopyQuery = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Architecture Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                <span>Database Schema & Data Dictionary</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                พจนานุกรมฐานข้อมูล & แผนภาพความเชื่อมโยง (ER Diagram)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono font-bold">
              PostgreSQL 15+ (Local Port 54322)
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          เอกสารสรุปโครงสร้างตารางทั้งหมดในระบบ เพื่อให้ผู้พัฒนาและทีมงานสามารถเข้าใจความสัมพันธ์ของข้อมูล (Data Model), 
          สิทธิ์การเข้าถึง (Multi-Tenant Isolation), ฟิลด์สำคัญ และการไหลของข้อมูลตั้งแต่การล็อกอินไปจนถึงการปิดการขายและบันทึกการเดินทาง
        </p>
      </div>

      {/* 2. Visual ER Diagram & Connection Map Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-black text-white">
                🗺️ แผนภาพแสดงความสัมพันธ์ของฐานข้อมูล (Visual Entity-Relationship Map)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                คลิกที่กล่องเพื่อดูรายละเอียดโครงสร้างของตารางนั้นๆ
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:block">
            Multi-Tenant 1:N Structure
          </span>
        </div>

        {/* Diagram Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Group 1: Identity & Organizations */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>1. ผู้ใช้และองค์กร (Tenant)</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">AUTH</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedTable('profiles')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'profiles'
                    ? 'bg-purple-500/20 border-purple-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-purple-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.profiles</div>
                  <div className="text-[10px] text-slate-400">บัญชีผู้ใช้ / เซลล์ / ผู้จัดการ</div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={() => setSelectedTable('companies')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'companies'
                    ? 'bg-purple-500/20 border-purple-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-purple-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.companies</div>
                  <div className="text-[10px] text-slate-400">บริษัท / องค์กรส่วนกลาง</div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={() => setSelectedTable('team_invitations')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'team_invitations'
                    ? 'bg-purple-500/20 border-purple-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-purple-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.team_invitations</div>
                  <div className="text-[10px] text-slate-400">คำเชิญลูกทีมเข้าสังกัด</div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>

          {/* Group 2: Factory Catalog & Reference */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>2. คลังโรงงาน & นิติบุคคล</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">CATALOG</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedTable('leads')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'leads'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.leads (989)</div>
                  <div className="text-[10px] text-slate-400">แผนที่โรงงานหลัก จ.สมุทรปราการ</div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => setSelectedTable('dbd_companies')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'dbd_companies'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.dbd_companies (371k)</div>
                  <div className="text-[10px] text-slate-400">ทะเบียนนิติบุคคล DBD ทั่วไทย</div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => setSelectedTable('target_factory_leads')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'target_factory_leads'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.target_factory_leads (4.1k)</div>
                  <div className="text-[10px] text-slate-400">โรงงานผู้ซื้อระบุสเปกวัตถุดิบ</div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Group 3: Sales Operations & CRM */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>3. พอร์ต CRM & การเดินทาง</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">OPERATIONS</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedTable('company_leads')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'company_leads'
                    ? 'bg-amber-500/20 border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.company_leads</div>
                  <div className="text-[10px] text-slate-400">พอร์ตลูกค้าที่เซลส์ดึงไปดูแล</div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => setSelectedTable('vehicle_trips')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedTable === 'vehicle_trips'
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">public.vehicle_trips</div>
                  <div className="text-[10px] text-slate-400">บันทึกไมล์รถ & เบิกค่าน้ำมัน</div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

        </div>

        {/* Data Flow Lifecycle Highlights */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>🔄 การไหลของข้อมูลในระบบ (Data Flow Lifecycle):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-slate-300 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-purple-400 font-bold block">STEP 1</span>
              <span className="font-bold text-white block">สมัครสมาชิก & สร้างบริษัท</span>
              <span className="text-slate-400 text-[10px] block">สร้างแถวใน profiles และ companies</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-purple-400 font-bold block">STEP 2</span>
              <span className="font-bold text-white block">เชิญทีมฝ่ายขาย</span>
              <span className="text-slate-400 text-[10px] block">สร้าง team_invitations ➔ สมาชิกตอบรับ</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 font-bold block">STEP 3</span>
              <span className="font-bold text-white block">สแกนหาโรงงานบนแผนที่</span>
              <span className="text-slate-400 text-[10px] block">ค้นหา 989 โรงงานจาก leads ตามพิกัด GPS</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-amber-400 font-bold block">STEP 4</span>
              <span className="font-bold text-white block">🛒 หยิบเข้าพอร์ตงานขาย</span>
              <span className="text-slate-400 text-[10px] block">สร้าง company_leads ผูกกับเซลส์ผู้ดูแล</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-emerald-400 font-bold block">STEP 5</span>
              <span className="font-bold text-white block">ออกพบลูกค้า & บันทึกไมล์</span>
              <span className="text-slate-400 text-[10px] block">บันทึกเลขไมล์ลง vehicle_trips</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Detailed Data Dictionary for Selected Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        
        {/* Table Selector & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400">เลือกดูตาราง:</span>
            {DATABASE_TABLES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  selectedTable === t.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t.name.replace('public.', '')}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            แสดง {activeTable.columns.length} คอลัมน์
          </div>
        </div>

        {/* Selected Table Overview Header */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${activeTable.domainColor}`}>
                {activeTable.domainLabel}
              </span>
              <h3 className="text-lg font-black text-white font-mono">
                {activeTable.name}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
              จำนวนข้อมูล: <strong className="text-amber-300">{activeTable.rowCountEstimate}</strong>
            </span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-400">หน้าที่การทำงาน:</strong> {activeTable.purpose}
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">หลักการทำงาน & การเชื่อมโยง:</strong> {activeTable.howItWorks}
          </div>

          {activeTable.foreignKeys.length > 0 && (
            <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> ความสัมพันธ์ (Foreign Keys):
              </span>
              {activeTable.foreignKeys.map((fk, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px]">
                  {fk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Column Definitions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-4">ชื่อคอลัมน์ (Column Name)</th>
                <th className="p-3.5">ชนิดข้อมูล (Type)</th>
                <th className="p-3.5">คีย์ (Keys)</th>
                <th className="p-3.5">คำอธิบาย & หน้าที่การใช้งาน</th>
                <th className="p-3.5 pr-4">ตัวอย่างข้อมูล (Sample)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {activeTable.columns.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  {/* Column Name */}
                  <td className="p-3.5 pl-4 font-mono font-bold text-white text-xs whitespace-nowrap">
                    {col.name}
                  </td>

                  {/* Type */}
                  <td className="p-3.5 font-mono text-cyan-400 text-[11px] whitespace-nowrap">
                    {col.type}
                  </td>

                  {/* Keys */}
                  <td className="p-3.5 whitespace-nowrap">
                    {col.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold mr-1">
                        PRIMARY KEY
                      </span>
                    )}
                    {col.isForeign && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono font-bold" title={`➔ ${col.foreignRef}`}>
                        FK
                      </span>
                    )}
                    {!col.isPrimary && !col.isForeign && (
                      <span className="text-slate-600 font-mono text-[10px]">-</span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="p-3.5 max-w-md leading-relaxed text-slate-200">
                    {col.description}
                  </td>

                  {/* Example */}
                  <td className="p-3.5 pr-4 font-mono text-[11px] text-slate-400 max-w-[200px] truncate">
                    {col.example || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sample SQL Query for this table */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>ตัวอย่างคำสั่ง SQL ใช้งานบ่อย (Sample Query):</span>
            </div>
            <button
              onClick={() => handleCopyQuery(activeTable.sampleQuery, activeTable.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-800 flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              {copiedQueryId === activeTable.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>คัดลอก SQL</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
            {activeTable.sampleQuery}
          </pre>
        </div>

      </div>

    </div>
  );
}
