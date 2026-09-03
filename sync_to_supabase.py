#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
CHICAI ELECTRIC - SUPABASE DATA SYNC TOOL
อัปโหลดรายชื่อโรงงาน 1,089 แห่งขึ้น Cloud Database (Supabase)
==============================================================================
"""

import os
import sys
import json
import urllib.request
import urllib.error
import urllib.parse
import time

SUPABASE_URL = "https://dvgogwewphbdmakykscr.supabase.co"
SUPABASE_KEY = "sb_publishable_owCQnL6jZS2zCAJRd6SgaQ_PYk1KNv9"
REST_ENDPOINT = f"{SUPABASE_URL}/rest/v1/leads"


def upload_batch(batch_data):
    """ส่งข้อมูลแบบ Batch ขึ้น Supabase REST API (Upsert by place_id)"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    req_data = json.dumps(batch_data).encode("utf-8")
    req = urllib.request.Request(REST_ENDPOINT, data=req_data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status in [200, 201, 204]
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"\n❌ [HTTP {e.code}]: {err_msg}")
        return False
    except Exception as e:
        print(f"\n❌ [Error]: {e}")
        return False


def main():
    json_file = "leads_data.json"
    if not os.path.exists(json_file):
        print(f"❌ ไม่พบไฟล์ {json_file}")
        return

    with open(json_file, "r", encoding="utf-8") as f:
        raw_leads = json.load(f)

    print("\n" + "=" * 75)
    print("🚀 เริ่มอัปโหลดฐานข้อมูลโรงงานขึ้น Supabase Cloud Database")
    print(f"📌 จำนวนโรงงานทั้งหมด: {len(raw_leads)} แห่ง")
    print(f"📌 ปลายทาง: {SUPABASE_URL}")
    print("=" * 75 + "\n")

    # แปลงโครงสร้างให้ตรงกับ Supabase Table Schema
    formatted_records = []
    for lead in raw_leads:
        lat = None
        lng = None
        try:
            if lead.get("ละติจูด (Lat)"):
                lat = float(lead["ละติจูด (Lat)"])
            if lead.get("ลองจิจูด (Lng)"):
                lng = float(lead["ลองจิจูด (Lng)"])
        except ValueError:
            pass

        record = {
            "place_id": lead.get("Place ID") or f"LEAD_{lead.get('ลำดับ', 0)}",
            "name": lead.get("ชื่อโรงงาน / บริษัท", ""),
            "phone": lead.get("เบอร์โทรศัพท์", ""),
            "email": lead.get("อีเมลติดต่อ (Email)", ""),
            "subdistrict": lead.get("ตำบล", ""),
            "district": lead.get("อำเภอ", ""),
            "province": lead.get("จังหวัด", "สมุทรปราการ"),
            "address": lead.get("ที่อยู่", ""),
            "website": lead.get("เว็บไซต์ / ช่องทางติดต่อ", ""),
            "lat": lat,
            "lng": lng,
            "maps_url": lead.get("Google Maps Link", ""),
            "status": lead.get("สถานะการโทร (Sales Pipeline)", "ยังไม่ได้ติดต่อ"),
            "contact_person": lead.get("ผู้ติดต่อ / ฝ่ายจัดซื้อ-ซ่อมบำรุง", ""),
            "notes": lead.get("หมายเหตุเพิ่มเติม", "")
        }
        formatted_records.append(record)

    # ส่งแบบ Batch ละ 50 รายการ
    batch_size = 50
    total = len(formatted_records)
    success_count = 0

    for i in range(0, total, batch_size):
        batch = formatted_records[i:i + batch_size]
        print(f"  ⏳ กำลังอัปโหลดรายการที่ [{i+1:04d} - {min(i+batch_size, total):04d}] จาก {total}...", end=" ", flush=True)
        
        ok = upload_batch(batch)
        if ok:
            success_count += len(batch)
            print("✅ สำเร็จ")
        else:
            print("⚠️ ล้มเหลว (กรุณาตรวจสอบว่าสร้างตาราง leads ใน Supabase แล้วหรือยัง)")
            print("\n💡 หากยังไม่ได้สร้างตาราง ให้เปิด Supabase -> SQL Editor แล้วนำโค้ดในไฟล์ schema.sql ไปรันก่อนครับ")
            sys.exit(1)
            
        time.sleep(0.3)

    print("\n" + "=" * 75)
    print(f"🎉 สำเร็จ! อัปโหลดข้อมูลโรงงานขึ้น Supabase เรียบร้อยแล้ว: {success_count} แห่ง")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
