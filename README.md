# 🏭 Chicai Electric - ระบบค้นหา Lead โรงงานฉีดพลาสติก (Google Places API)

เครื่องมือค้นหารายชื่อและข้อมูลติดต่อโรงงานฉีดพลาสติกในประเทศไทย ผ่าน **Google Places API (New)** โดยกรองเฉพาะหมวดหมู่ธุรกิจ **`Category Type: manufacturer` (ผู้ผลิต / โรงงาน)** เพื่อนำไปใช้เป็น B2B Sales Lead Sheet สำหรับทีมขายเครื่องกรองน้ำมันไฮดรอลิกและฟื้นฟูน้ำยาหล่อเย็น

---

## 📋 ข้อมูลที่ได้ในรายงาน (Lead Report)

| คอลัมน์ | รายละเอียด |
| :--- | :--- |
| **ชื่อโรงงาน / บริษัท** | ชื่อทางการบน Google Maps |
| **เบอร์โทรศัพท์** | เบอร์โทรตรงสำหรับติดต่อฝ่ายจัดซื้อ / วิศวกรโรงงาน |
| **ที่อยู่ & จังหวัด/อำเภอ** | ที่ตั้งโรงงาน สำหรับจัด Route ออกตรวจหน้างาน |
| **เว็บไซต์ / แผนที่** | ลิงก์ Website และ ลิงก์ Google Maps นำทาง |
| **พิกัด GPS** | ละติจูด, ลองจิจูด |
| **คะแนนรีวิว / สถานะ** | Rating, จำนวนรีวิว และสถานะเปิดทำการ |
| **คอลัมน์ติดตามงานขาย** | สถานะการโทร, ผู้ติดต่อ, นัดหมาย On-site Demo, หมายเหตุ |

---

## 🚀 วิธีการใช้งาน

### 1. ใส่ Google Maps API Key
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
เปิดไฟล์ `.env` แล้วใส่ API Key ของคุณ:
```env
GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here...
```

### 2. รันสคริปต์ค้นหาข้อมูล
รันคำสั่งพื้นฐาน (ใช้ค่าเริ่มต้น: ค้นหาโรงงานฉีดพลาสติกใน 12 จังหวัดอุตสาหกรรมหลัก):
```bash
python3 fetch_factories.py
```

หรือสามารถระบุ API Key ผ่าน Parameter ได้โดยตรง:
```bash
python3 fetch_factories.py --api-key AIzaSy...your_key_here...
```

### 3. ตัวเลือกการปรับแต่งคำค้นหา (Optional Arguments)

* **กำหนดเฉพาะบางจังหวัด:**
  ```bash
  python3 fetch_factories.py --provinces สมุทรปราการ ชลบุรี ระยอง
  ```

* **กำหนดคำค้นหาเฉพาะ:**
  ```bash
  python3 fetch_factories.py --keywords "โรงงานฉีดพลาสติก" "รับฉีดพลาสติก"
  ```

* **กำหนดชื่อไฟล์ผลลัพธ์:**
  ```bash
  python3 fetch_factories.py --output leads_samutprakan
  ```

---

## 📊 ไฟล์ผลลัพธ์ (Output Files)
เมื่อรันเสร็จ โปรแกรมจะสร้างไฟล์ในโฟลเดอร์นี้:
* `plastic_factories_leads_YYYYMMDD_HHMM.csv` (รองรับเปิดใน Excel ภาษาไทยไม่เพี้ยน ด้วย UTF-8-BOM)
* `plastic_factories_leads_YYYYMMDD_HHMM.xlsx` (ไฟล์ Excel พร้อมตกแต่งและจัด Format สำหรับทีมขาย)
