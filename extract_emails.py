#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
CHICAI ELECTRIC - B2B EMAIL EXTRACTOR
สแกนหาอีเมลจากเว็บไซต์โรงงาน 613 แห่ง พัฒนาต่อจากฐานข้อมูลเดิม 1,089 รายการ
==============================================================================
"""

import os
import sys
import json
import re
import csv
import time
import urllib.request
import urllib.parse
import urllib.error
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

# Ignore SSL certificate verification issues for legacy factory websites
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "th,en-US;q=0.9,en;q=0.8"
}

# Domains / keywords to ignore (spam/framework/template emails)
IGNORE_DOMAINS = [
    "sentry.io", "wix.com", "wixpress.com", "wordpress.com", "schema.org",
    "example.com", "domain.com", "yourdomain.com", "email.com", "godaddy.com",
    "cloudflare.com", "googleapis.com", "github.com", "facebook.com", "instagram.com"
]

IGNORE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js"]


def clean_email(email_str):
    """ทำความสะอาดและตรวจสอบความถูกต้องของอีเมล"""
    email = email_str.strip().lower()
    
    # Check invalid extensions
    for ext in IGNORE_EXTENSIONS:
        if email.endswith(ext):
            return None
            
    # Check ignored domains
    for ign in IGNORE_DOMAINS:
        if ign in email:
            return None
            
    # Check basic regex pattern
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email):
        return None
        
    return email


def extract_emails_from_html(html_text):
    """สกัดอีเมลทั้งหมดจากโค้ด HTML"""
    if not html_text:
        return set()
        
    # Match standard email addresses and mailto: links
    raw_emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", html_text)
    mailto_emails = re.findall(r"mailto:([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", html_text, re.IGNORECASE)
    
    all_candidates = set(raw_emails + mailto_emails)
    valid_emails = set()
    
    for em in all_candidates:
        cleaned = clean_email(em)
        if cleaned:
            valid_emails.add(cleaned)
            
    return valid_emails


def fetch_url_content(url, timeout=6):
    """ดาวน์โหลดเนื้อหาเว็บเพจแบบจำกัดเวลา"""
    if not url:
        return ""
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://" + url

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as res:
            content_type = res.headers.get("Content-Type", "")
            if "text/html" not in content_type and "text/plain" not in content_type and "charset" not in content_type:
                return ""
            return res.read().decode("utf-8", errors="ignore")
    except Exception:
        return ""


def find_factory_emails(website_url):
    """สแกนหน้าแรก และหน้าติดต่อเราของโรงงาน เพื่อหาอีเมล"""
    if not website_url or not website_url.strip():
        return ""

    website_url = website_url.strip()
    found_emails = set()

    # 1. สแกนหน้าแรก
    homepage_html = fetch_url_content(website_url)
    if homepage_html:
        found_emails.update(extract_emails_from_html(homepage_html))

    # ถ้าเจออีเมลจากหน้าแรกแล้วและมีหลายอัน สามารถสรุปได้เลย
    # หรือถ้ายังไม่เจอ ให้ลองหาในหน้า Contact Us
    if not found_emails or len(found_emails) < 2:
        parsed = urllib.parse.urlparse(website_url)
        base_url = f"{parsed.scheme or 'http'}://{parsed.netloc}"

        contact_paths = [
            "/contact",
            "/contact-us",
            "/contactus",
            "/th/contact",
            "/th/contact-us",
            "/about-us",
            "/contact.html",
            "/contact.php"
        ]

        for path in contact_paths[:3]:  # ตรวจสอบ 3 หน้าสำคัญ
            contact_url = urllib.parse.urljoin(base_url, path)
            contact_html = fetch_url_content(contact_url, timeout=4)
            if contact_html:
                found_emails.update(extract_emails_from_html(contact_html))
            if found_emails:
                break

    # จัดลำดับ: เอาอีเมลประเภท info@, sales@, contact@, purchasing@ ขึ้นก่อน
    def email_priority(em):
        for idx, prefix in enumerate(["info@", "sales@", "contact@", "purchas", "admin@"]):
            if em.startswith(prefix):
                return idx
        return 99

    sorted_emails = sorted(list(found_emails), key=email_priority)
    return ", ".join(sorted_emails)


def process_lead(lead):
    """ฟังก์ชันย่อยสำหรับแต่ละ Worker ใน ThreadPool"""
    web = lead.get("เว็บไซต์ / ช่องทางติดต่อ", "").strip()
    name = lead.get("ชื่อโรงงาน / บริษัท", "")
    
    if web:
        emails = find_factory_emails(web)
        lead["อีเมลติดต่อ (Email)"] = emails
    else:
        lead["อีเมลติดต่อ (Email)"] = ""
        
    return lead


def main():
    json_path = "leads_data.json"
    if not os.path.exists(json_path):
        print(f"❌ ไม่พบไฟล์ฐานข้อมูล {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        leads = json.load(f)

    total_leads = len(leads)
    with_website = [l for l in leads if l.get("เว็บไซต์ / ช่องทางติดต่อ", "").strip()]
    
    print("\n" + "=" * 75)
    print("📧 เริ่มกระบวนการค้นหาอีเมลโรงงาน (Email Extraction)")
    print(f"📌 จำนวนโรงงานในฐานข้อมูลเดิม: {total_leads} แห่ง")
    print(f"📌 โรงงานที่มีเว็บไซต์พร้อมสแกน: {len(with_website)} แห่ง")
    print("📌 กำลังสแกนหาอีเมลจากหน้าแรก & หน้า Contact Us อัตโนมัติ...")
    print("=" * 75 + "\n")

    updated_leads = []
    scanned_count = 0
    found_count = 0

    # ใช้ ThreadPoolExecutor 12 Threads เพื่อสแกนพร้อมกันอย่างรวดเร็ว
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = [executor.submit(process_lead, lead) for lead in leads]
        for future in as_completed(futures):
            res_lead = future.result()
            updated_leads.append(res_lead)
            
            scanned_count += 1
            emails = res_lead.get("อีเมลติดต่อ (Email)", "")
            if emails:
                found_count += 1
                
            if scanned_count % 50 == 0 or scanned_count == total_leads:
                print(f"  ⏳ สแกนแล้ว [{scanned_count:04d}/{total_leads:04d}] ราย | ค้นพบอีเมลสะสม: {found_count} โรงงาน")

    # เรียงลำดับตาม ลำดับ เดิม
    updated_leads.sort(key=lambda x: int(x.get("ลำดับ", 0)) if str(x.get("ลำดับ", "")).isdigit() else 99999)

    # 1. บันทึก JSON ฐานข้อมูลใหม่
    with open("leads_data.json", "w", encoding="utf-8") as f:
        json.dump(updated_leads, f, ensure_ascii=False, indent=2)

    # 2. บันทึก CSV
    csv_file = "leads_factories_samutprakan_with_emails.csv"
    if updated_leads:
        fieldnames = list(updated_leads[0].keys())
        with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(updated_leads)

    # 3. บันทึก Excel (.xlsx)
    xlsx_file = "leads_factories_samutprakan_with_emails.xlsx"
    try:
        import pandas as pd
        df = pd.DataFrame(updated_leads)
        df.to_excel(xlsx_file, index=False)
        print(f"✅ บันทึกไฟล์ Excel สำเร็จ: {xlsx_file}")
    except Exception:
        pass

    print("\n" + "=" * 75)
    print("🎉 สแกนหาอีเมลสำเร็จเรียบร้อยแล้ว!")
    print(f"📊 รวมโรงงานทั้งหมด: {total_leads} แห่ง")
    print(f"✉️ พบอีเมลโรงงาน: {found_count} แห่ง")
    print(f"📁 บันทึกข้อมูลลงใน: {csv_file}")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
