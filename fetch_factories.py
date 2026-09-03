#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
CHICAI ELECTRIC - B2B LEAD GENERATION TOOL
ค้นหารายชื่อโรงงานฉีดพลาสติกและอุตสาหกรรมพลาสติก (Deep Scan - Samut Prakan & Nationwide)
==============================================================================
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error
import csv
import re
from datetime import datetime

# ==========================================
# SAMUT PRAKAN DEEP SUB-ZONES & DISTRICTS
# ==========================================
SAMUT_PRAKAN_DEEP_ZONES = [
    # อำเภอบางพลี & โซนใกล้เคียง
    "บางพลี สมุทรปราการ",
    "กิ่งแก้ว สมุทรปราการ",
    "ราชาเทวะ บางพลี",
    "บางพลีใหญ่ สมุทรปราการ",
    "บางปลา บางพลี",
    "หนามแดง บางพลี",
    "เทพารักษ์ บางพลี",
    
    # อำเภอเมืองสมุทรปราการ & นิคมบางปู
    "นิคมอุตสาหกรรมบางปู สมุทรปราการ",
    "แพรกษา สมุทรปราการ",
    "แพรกษาใหม่ สมุทรปราการ",
    "ท้ายบ้าน เมืองสมุทรปราการ",
    "ตำบลบางปูใหม่ สมุทรปราการ",
    "เมืองสมุทรปราการ",
    
    # อำเภอบางเสาธง & นิคมบางพลี
    "นิคมอุตสาหกรรมบางพลี สมุทรปราการ",
    "เมืองใหม่บางพลี สมุทรปราการ",
    "บางเสาธง สมุทรปราการ",
    "ศีรษะจรเข้ บางเสาธง",
    
    # อำเภอบางบ่อ & นิคมเอเซีย
    "บางบ่อ สมุทรปราการ",
    "นิคมอุตสาหกรรมเอเซีย สุวรรณภูมิ",
    "คลองด่าน บางบ่อ",
    "บางเพรียง บางบ่อ",
    
    # อำเภอพระประแดง & พระสมุทรเจดีย์
    "พระประแดง สมุทรปราการ",
    "ปู่เจ้าสมิงพราย พระประแดง",
    "สำโรง สมุทรปราการ",
    "สำโรงใต้ พระประแดง",
    "สุขสวัสดิ์ สมุทรปราการ",
    "พระสมุทรเจดีย์ สมุทรปราการ",
    "แหลมฟ้าผ่า พระสมุทรเจดีย์",
    
    # เส้นทางสายหลัก
    "ถนนบางนา-ตราด สมุทรปราการ",
    "ถนนเทพารักษ์ สมุทรปราการ",
    "ถนนสุขุมวิท สมุทรปราการ"
]

DEEP_KEYWORDS = [
    "โรงงานฉีดพลาสติก",
    "รับฉีดพลาสติก",
    "ผลิตชิ้นส่วนพลาสติก",
    "โรงงานผลิตพลาสติก",
    "แม่พิมพ์ฉีดพลาสติก",
    "ขึ้นรูปพลาสติก",
    "plastic injection molding",
    "plastic injection mold",
    "plastic factory"
]

LEGACY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
LEGACY_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


def load_env_file(filepath=".env"):
    """โหลด Environment Variables จากไฟล์ .env"""
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and not os.getenv(key):
                    os.environ[key] = val


def extract_district(address):
    """สกัดอำเภอ/เขตจากที่อยู่"""
    match_district = re.search(r"(?:อ\.|อำเภอ|เขต)\s*([ก-๙a-zA-Z0-9_]+)", address)
    if match_district:
        return match_district.group(1).strip()
    
    # fallback ตรวจสอบชื่ออำเภอสำคัญ
    for d in ["บางพลี", "เมืองสมุทรปราการ", "บางเสาธง", "บางบ่อ", "พระประแดง", "พระสมุทรเจดีย์"]:
        if d in address:
            return d
    return ""


def http_get_json(url):
    """ส่ง HTTP GET request แบบ UTF-8 JSON"""
    try:
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "ChicaiElectricLeadBot/1.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"\n❌ [Network Error]: {e}")
        return None


def get_place_details(place_id, api_key, language="th"):
    """ดึงข้อมูลเบอร์โทรศัพท์ เว็บไซต์ และที่อยู่แบบละเอียดด้วย Place Details API"""
    fields = "name,formatted_address,formatted_phone_number,international_phone_number,website,url,geometry,rating,user_ratings_total,business_status,types"
    params = {
        "place_id": place_id,
        "fields": fields,
        "key": api_key,
        "language": language
    }
    url = f"{LEGACY_DETAILS_URL}?{urllib.parse.urlencode(params)}"
    data = http_get_json(url)
    if data and data.get("status") == "OK":
        return data.get("result", {})
    return {}


def is_relevant_factory(place_data):
    """กรองร้านอาหาร โรงแรม ร้านค้าปลีกที่ไม่ใช่โรงงานออก"""
    types = place_data.get("types", [])
    name = place_data.get("name", "").lower()
    
    excluded_types = [
        "restaurant", "food", "cafe", "lodging", "hotel", 
        "clothing_store", "shoe_store", "supermarket", "convenience_store",
        "spa", "beauty_salon", "hair_care", "pharmacy", "hospital",
        "gas_station", "car_dealer", "car_rental"
    ]
    for ex in excluded_types:
        if ex in types:
            return False
            
    return True


def fetch_deep_samutprakan(api_key, keywords=DEEP_KEYWORDS, zones=SAMUT_PRAKAN_DEEP_ZONES, delay_sec=1.0):
    """
    ค้นหาโรงงานฉีดพลาสติกในสมุทรปราการแบบเจาะลึกทุกโซน ทุกอำเภอ ทุกนิคมฯ
    """
    unique_places = {}  # {place_id: basic_data}
    total_searches = len(keywords) * len(zones)
    search_count = 0

    print("\n" + "=" * 75)
    print("🏭 เริ่มค้นหา Lead โรงงานฉีดพลาสติก - จังหวัดสมุทรปราการ (DEEP SCAN)")
    print(f"📌 คำค้นหาเป้าหมาย: {len(keywords)} คำ")
    print(f"📌 โซน/นิคมอุตสาหกรรม: {len(zones)} โซน")
    print(f"📌 รวมจำนวนรอบการค้นหา: {total_searches} ครั้ง")
    print("=" * 75 + "\n")

    for kw in keywords:
        print(f"\n🔹 กำลังค้นหากลุ่มคีย์เวิร์ด: [{kw}]")
        for zone in zones:
            search_count += 1
            query = f"{kw} {zone}"
            print(f"  [{search_count:03d}/{total_searches}] ค้นหา: \"{query}\" ...", end=" ", flush=True)

            next_page_token = None
            page_num = 1
            found_in_query = 0

            while True:
                params = {
                    "query": query,
                    "key": api_key,
                    "language": "th"
                }
                if next_page_token:
                    params["pagetoken"] = next_page_token

                url = f"{LEGACY_SEARCH_URL}?{urllib.parse.urlencode(params)}"
                res = http_get_json(url)

                if not res or res.get("status") not in ["OK", "ZERO_RESULTS"]:
                    break

                results = res.get("results", [])
                for p in results:
                    pid = p.get("place_id")
                    if not pid or pid in unique_places:
                        continue
                    
                    addr = p.get("formatted_address", "")
                    # ตรวจสอบว่าเป็นในสมุทรปราการหรือพื้นที่ใกล้เคียง
                    if is_relevant_factory(p):
                        unique_places[pid] = p
                        found_in_query += 1

                next_page_token = res.get("next_page_token")
                if not next_page_token or page_num >= 3:
                    break

                page_num += 1
                time.sleep(2.0)  # Google token readiness delay

            print(f"-> เพิ่มใหม่ {found_in_query} (สะสม: {len(unique_places)} โรงงาน)")
            time.sleep(delay_sec)

    print("\n" + "=" * 75)
    print(f"🎯 สแกนเสร็จสิ้น! พบโรงงานไม่ซ้ำกันทั้งหมด: {len(unique_places)} แห่ง")
    print("⏳ กำลังดึงข้อมูลติดต่อเชิงลึก (เบอร์โทรตรง, เว็บไซต์, ที่อยู่เต็ม)...")
    print("=" * 75 + "\n")

    detailed_leads = []
    total_unique = len(unique_places)
    
    for idx, (pid, basic_p) in enumerate(unique_places.items(), 1):
        if idx % 10 == 0 or idx == total_unique:
            print(f"  📞 ดึงข้อมูลติดต่อสำเร็จแล้ว [{idx:03d}/{total_unique:03d}] ราย...")

        details = get_place_details(pid, api_key)
        
        name = details.get("name") or basic_p.get("name", "")
        address = details.get("formatted_address") or basic_p.get("formatted_address", "")
        phone = details.get("formatted_phone_number") or details.get("international_phone_number", "")
        website = details.get("website", "")
        maps_url = details.get("url", f"https://www.google.com/maps/place/?q=place_id:{pid}")
        rating = details.get("rating", basic_p.get("rating", ""))
        reviews = details.get("user_ratings_total", basic_p.get("user_ratings_total", ""))
        status = details.get("business_status", basic_p.get("business_status", ""))
        types_list = details.get("types", basic_p.get("types", []))
        
        geom = details.get("geometry", {}).get("location") or basic_p.get("geometry", {}).get("location", {})
        lat = geom.get("lat", "")
        lng = geom.get("lng", "")

        dist = extract_district(address)

        detailed_leads.append({
            "ลำดับ": idx,
            "ชื่อโรงงาน / บริษัท": name,
            "เบอร์โทรศัพท์": phone,
            "ที่อยู่": address,
            "อำเภอ/โซน": dist,
            "จังหวัด": "สมุทรปราการ" if "สมุทรปราการ" in address else "พื้นที่ใกล้เคียง",
            "เว็บไซต์ / ช่องทางติดต่อ": website,
            "Google Maps Link": maps_url,
            "ละติจูด (Lat)": lat,
            "ลองจิจูด (Lng)": lng,
            "คะแนนรีวิว": rating,
            "จำนวนรีวิว": reviews,
            "ประเภทธุรกิจ": ", ".join(types_list),
            "สถานะเปิดทำการ": "เปิดดำเนินการ" if status == "OPERATIONAL" else status,
            "Place ID": pid,
            # B2B Sales Pipeline Columns
            "สถานะการโทร (Sales Pipeline)": "ยังไม่ได้ติดต่อ",
            "ผู้ติดต่อ / ฝ่ายจัดซื้อ-ซ่อมบำรุง": "",
            "สินค้าเป้าหมาย": "เครื่องกรองน้ำมันไฮดรอลิก / เครื่องฟื้นฟูน้ำยาหล่อเย็น",
            "ผลการติดต่อ / นัดหมาย Demo On-site": "",
            "หมายเหตุเพิ่มเติม": ""
        })
        time.sleep(0.1)

    return detailed_leads


def export_to_csv(data, filename):
    """Export เป็น CSV UTF-8-BOM รองรับ Microsoft Excel ภาษาไทย 100%"""
    if not data:
        print("⚠️ ไม่มีข้อมูลสำหรับบันทึก CSV")
        return False
        
    fieldnames = list(data[0].keys())
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
        
    print(f"\n✅ บันทึกไฟล์ CSV สำเร็จ: {filename} ({len(data)} รายชื่อ)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Chicai Electric - Samut Prakan Deep Scan")
    parser.add_argument("--api-key", help="Google Maps Places API Key")
    parser.add_argument("--output", default="leads_factories_samutprakan_all", help="Output filename")
    
    args = parser.parse_args()

    load_env_file()
    api_key = args.api_key or os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key or api_key == "your_google_maps_api_key_here":
        print("\n❌ ไม่พบ Google Maps API Key ใน .env")
        sys.exit(1)

    # รัน Deep Scan
    leads = fetch_deep_samutprakan(api_key=api_key)

    if not leads:
        print("⚠️ ไม่พบข้อมูล")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    csv_file = f"{args.output}_{timestamp}.csv"
    export_to_csv(leads, csv_file)

    print("\n" + "=" * 75)
    print(f"🎉 สำเร็จ! รวบรวมรายชื่อโรงงานฉีดพลาสติกสมุทรปราการได้ทั้งหมด: {len(leads)} แห่ง")
    print(f"📁 ไฟล์ผลลัพธ์: {csv_file}")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
