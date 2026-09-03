import json
import os
import shutil

def build_dashboard():
    # Load JSON data with standardized district & subdistrict
    with open('leads_data.json', 'r', encoding='utf-8') as f:
        leads_data = json.load(f)

    json_leads_str = json.dumps(leads_data, ensure_ascii=False)

    html_content = f"""<!DOCTYPE html>
<html lang="th" class="h-full bg-slate-950">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chicai Electric | B2B Leads & Factory Intelligence Platform</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  
  <!-- Leaflet Map CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  
  <!-- Leaflet Marker Cluster -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

  <!-- Google Fonts: Prompt & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    body {{
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
    }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
    
    /* Custom Scrollbars */
    ::-webkit-scrollbar {{ width: 6px; height: 6px; }}
    ::-webkit-scrollbar-track {{ background: #f1f5f9; }}
    ::-webkit-scrollbar-thumb {{ background: #cbd5e1; border-radius: 9999px; }}
    ::-webkit-scrollbar-thumb:hover {{ background: #94a3b8; }}

    #map {{ height: 660px; width: 100%; border-radius: 1.5rem; z-index: 10; }}
    
    /* Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {{
      border-radius: 1.25rem !important;
      padding: 6px !important;
      box-shadow: 0 20px 35px -5px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05) !important;
      border: 1px solid rgba(226, 232, 240, 0.9) !important;
    }}
    .leaflet-popup-content {{ margin: 12px 14px !important; font-family: 'Prompt', sans-serif !important; }}
    .leaflet-container {{ font-family: 'Prompt', sans-serif !important; }}

    /* Custom HQ Pin Animation */
    .hq-pulse {{
      background: #10B981;
      border-radius: 50%;
      height: 20px;
      width: 20px;
      position: absolute;
      left: 50%;
      top: 50%;
      margin: -10px 0px 0px -10px;
      animation: pulsate 1.8s ease-out infinite;
      opacity: 0;
    }}
    @keyframes pulsate {{
      0% {{ transform: scale(0.2, 0.2); opacity: 0; }}
      50% {{ opacity: 0.9; }}
      100% {{ transform: scale(3.6, 3.6); opacity: 0; }}
    }}
    .hq-marker-icon {{
      background: linear-gradient(135deg, #0d3b37 0%, #145853 50%, #219990 100%);
      border: 3px solid #ffffff;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      box-shadow: 0 10px 25px rgba(20, 88, 83, 0.5), 0 0 0 2px rgba(20, 88, 83, 0.3);
      width: 46px !important;
      height: 46px !important;
      margin-left: -23px !important;
      margin-top: -23px !important;
      position: relative;
    }}
  </style>
</head>
<body class="min-h-full flex flex-col text-slate-900 antialiased selection:bg-[#219990] selection:text-white">

  <!-- TOP APP HEADER -->
  <header class="bg-gradient-to-r from-[#072422] via-[#0d3b37] to-[#145853] text-white shadow-xl sticky top-0 z-40 border-b border-emerald-500/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        
        <!-- Brand identity -->
        <div class="flex items-center gap-3.5">
          <div class="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-white to-slate-100 p-2 shadow-lg border border-white/20 shrink-0">
            <span class="text-2xl">🏭</span>
            <span class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#0d3b37] flex items-center justify-center text-[8px] font-black">✓</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-sm">บริษัท ฉี ไฉ่ อิเล็คทริค (ประเทศไทย) จำกัด</h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                B2B Factory Intelligence
              </span>
            </div>
            <p class="text-xs text-emerald-100/90 font-light mt-0.5">
              ฐานข้อมูลโรงงานฉีดพลาสติก สมุทรปราการ • ระบบค้นหา Lead ฝ่ายขายและวางแผนเส้นทาง
            </p>
          </div>
        </div>

        <!-- Header Actions & View Switcher -->
        <div class="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end w-full md:w-auto">
          
          <!-- View Switcher -->
          <div class="inline-flex items-center bg-slate-900/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-inner">
            <button onclick="switchView('table')" id="tab-table-btn" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-white text-[#0d3b37] shadow-md cursor-pointer">
              <span>📋</span>
              <span>ตารางข้อมูล</span>
            </button>
            <button onclick="switchView('map')" id="tab-map-btn" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer">
              <span>🗺️</span>
              <span>แผนที่พิกัด (Map)</span>
            </button>
          </div>

          <!-- Export CSV Button -->
          <button onclick="exportToCsv()" class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all duration-200 active:scale-95 cursor-pointer border border-emerald-300/30">
            <span>📥</span>
            <span>ส่งออก CSV</span>
          </button>

          <!-- Catalog Link -->
          <a href="https://catalog-chicai-lilac.vercel.app/" target="_blank" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white text-xs font-semibold rounded-2xl border border-white/15 transition-all backdrop-blur-xs">
            <span>🌐</span>
            <span class="hidden sm:inline">แคตตาล็อกสินค้า</span>
          </a>

        </div>

      </div>
    </div>
  </header>

  <!-- MAIN VIEWPORT CONTENT -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- EXECUTIVE KPI CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- KPI 1 -->
      <div class="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300/60 transition-all duration-300 group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-slate-500 tracking-wide">โรงงานเป้าหมายทั้งหมด</span>
          <div class="h-10 w-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            🏢
          </div>
        </div>
        <h3 id="stat-total" class="text-3xl font-black text-slate-900 tracking-tight">1,089</h3>
        <div class="mt-2 flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
          <span class="h-2 w-2 rounded-full bg-teal-500"></span>
          <span>ครอบคลุม 6 อำเภอในสมุทรปราการ</span>
        </div>
      </div>

      <!-- KPI 2 -->
      <div class="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300/60 transition-all duration-300 group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-slate-500 tracking-wide">มีเบอร์โทรศัพท์ติดต่อตรง</span>
          <div class="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            📞
          </div>
        </div>
        <h3 id="stat-phones" class="text-3xl font-black text-emerald-600 tracking-tight">1,005</h3>
        <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <span class="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">92.3%</span>
          <span>พร้อมโทรติดต่อฝ่ายจัดซื้อ</span>
        </div>
      </div>

      <!-- KPI 3 -->
      <div class="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-violet-300/60 transition-all duration-300 group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-slate-500 tracking-wide">มีอีเมลติดต่อ (Email)</span>
          <div class="h-10 w-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            ✉️
          </div>
        </div>
        <h3 id="stat-emails" class="text-3xl font-black text-violet-600 tracking-tight">317</h3>
        <div class="mt-2 flex items-center gap-1.5 text-xs text-violet-700 font-semibold">
          <span class="h-2 w-2 rounded-full bg-violet-500"></span>
          <span>สแกนจากเว็บไซต์โรงงาน</span>
        </div>
      </div>

      <!-- KPI 4 -->
      <div class="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-5 border border-amber-200/90 shadow-xs hover:shadow-md transition-all duration-300 group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-amber-900 tracking-wide">สำนักงานใหญ่ ฉี ไฉ่ (HQ)</span>
          <div class="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
            ⭐
          </div>
        </div>
        <h3 class="text-base font-black text-amber-950 leading-tight">ต.บางพลีใหญ่</h3>
        <div class="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
          <span>ศูนย์กลางบริการด่วน & รถ On-site</span>
        </div>
      </div>

    </div>

    <!-- ADVANCED FILTER & SEARCH CONTROL DECK -->
    <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      
      <!-- Search Input Bar & Quick Filters -->
      <div class="flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        <!-- Instant Search Box -->
        <div class="relative flex-1 w-full">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
          <input 
            type="text" 
            id="search-input" 
            placeholder="ค้นหาชื่อโรงงาน, เบอร์โทร, อีเมล, ถนน, นิคมอุตสาหกรรม, ตำบล..." 
            class="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-4 focus:ring-[#219990]/10 rounded-2xl outline-none text-slate-900 transition-all font-medium placeholder:text-slate-400 shadow-inner"
            oninput="applyFilters()"
          >
          <button id="clear-search-btn" onclick="clearSearch()" class="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center hidden cursor-pointer transition">✕</button>
        </div>

        <!-- Quick Filter Pills -->
        <div class="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <label class="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input type="checkbox" id="filter-has-phone" onchange="applyFilters()" class="rounded-md h-4 w-4 text-[#219990] focus:ring-[#219990] border-slate-300">
            <span>มีเบอร์โทร</span>
          </label>
          <label class="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input type="checkbox" id="filter-has-email" onchange="applyFilters()" class="rounded-md h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300">
            <span>มีอีเมล (317)</span>
          </label>
          <label class="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input type="checkbox" id="filter-has-web" onchange="applyFilters()" class="rounded-md h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300">
            <span>มีเว็บไซต์</span>
          </label>
        </div>

      </div>

      <!-- District & Sub-district Cascading Selectors -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
        
        <!-- District Selection -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏛️</span>
            <span>เลือกระดับอำเภอ:</span>
          </label>
          <div class="relative">
            <select id="district-select" onchange="onDistrictChange()" class="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-3 focus:ring-[#219990]/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition cursor-pointer pr-10 shadow-xs">
              <option value="ALL">-- แสดงทุกอำเภอ (1,089 แห่ง) --</option>
              <option value="อำเภอบางพลี">อำเภอบางพลี (384 แห่ง)</option>
              <option value="อำเภอเมืองสมุทรปราการ">อำเภอเมืองสมุทรปราการ / นิคมบางปู (328 แห่ง)</option>
              <option value="อำเภอพระสมุทรเจดีย์">อำเภอพระสมุทรเจดีย์ (115 แห่ง)</option>
              <option value="อำเภอพระประแดง">อำเภอพระประแดง (114 แห่ง)</option>
              <option value="อำเภอบางบ่อ">อำเภอบางบ่อ (87 แห่ง)</option>
              <option value="อำเภอบางเสาธง">อำเภอบางเสาธง (81 แห่ง)</option>
              <option value="OTHER">ปริมณฑล & พื้นที่ใกล้เคียง</option>
            </select>
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        <!-- Sub-district Selection (Cascading) -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏘️</span>
            <span>เลือกระดับตำบล / แขวง:</span>
          </label>
          <div class="relative">
            <select id="subdistrict-select" onchange="onSubdistrictChange()" class="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-3 focus:ring-[#219990]/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition cursor-pointer pr-10 shadow-xs">
              <option value="ALL">-- ทุกตำบล --</option>
            </select>
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="flex items-end">
          <button onclick="resetAllFilters()" class="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98">
            <span>🔄</span>
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>
        </div>

      </div>

    </div>

    <!-- RESULT SUMMARY BAR -->
    <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium px-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-slate-600 font-medium">พบโรงงานเป้าหมายทั้งหมด:</span>
        <strong id="result-count" class="text-sm font-black text-slate-900 px-2.5 py-0.5 rounded-xl bg-white border border-slate-200 shadow-2xs">1,089</strong>
        <span class="text-slate-600">แห่ง</span>
        <span id="district-badge" class="px-2.5 py-1 rounded-xl bg-emerald-100/80 text-[#0d3b37] font-bold text-[11px] border border-emerald-200">ทุกอำเภอ</span>
        <span id="subdistrict-badge" class="px-2.5 py-1 rounded-xl bg-blue-100/80 text-blue-900 font-bold text-[11px] border border-blue-200 hidden">ทุกตำบล</span>
      </div>
      
      <div id="table-page-size-ctrl" class="flex items-center gap-2">
        <span class="text-slate-500 font-medium">แสดงหน้าละ:</span>
        <select id="page-size" onchange="changePageSize()" class="bg-white border border-slate-200 font-bold text-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none shadow-2xs focus:border-[#219990]">
          <option value="25">25</option>
          <option value="50" selected>50</option>
          <option value="100">100</option>
          <option value="500">500</option>
        </select>
      </div>
    </div>

    <!-- VIEW 1: MAP VIEW CONTAINER -->
    <div id="view-map-container" class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4 hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div class="flex items-center gap-2.5">
          <div class="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-600/30">⭐</div>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900 leading-tight">แผนที่พิกัดโรงงานฉีดพลาสติก & ที่ตั้งสำนักงานใหญ่</h4>
            <p id="map-target-label" class="text-xs text-emerald-700 font-medium mt-0.5">แสดงผลหมุดตามอำเภอและตำบลที่เลือก</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="zoomToHQ()" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0d3b37] text-xs font-bold border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95">
            <span>⭐</span>
            <span>ซูมสำนักงานใหญ่ (HQ)</span>
          </button>
          <button onclick="resetMapView()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
            <span>🔄</span>
            <span>จัดกึ่งกลาง</span>
          </button>
        </div>
      </div>
      
      <!-- Leaflet Map Container -->
      <div id="map" class="shadow-inner border border-slate-200/80"></div>
    </div>

    <!-- VIEW 2: LEADS TABLE CONTAINER -->
    <div id="view-table-container" class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/90 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
              <th class="py-3.5 px-3.5 text-center w-14">ลำดับ</th>
              <th class="py-3.5 px-4 min-w-[240px]">ชื่อโรงงาน / บริษัท</th>
              <th class="py-3.5 px-4 min-w-[150px]">เบอร์โทรศัพท์ (กดโทรได้)</th>
              <th class="py-3.5 px-4 min-w-[180px]">อีเมลติดต่อ (Email)</th>
              <th class="py-3.5 px-3 min-w-[110px]">ตำบล</th>
              <th class="py-3.5 px-3 min-w-[130px]">อำเภอ</th>
              <th class="py-3.5 px-4 min-w-[210px]">ที่อยู่ตั้ง</th>
              <th class="py-3.5 px-3 text-center min-w-[110px]">เว็บ & แผนที่</th>
              <th class="py-3.5 px-4 min-w-[150px]">สถานะติดตามงานขาย</th>
            </tr>
          </thead>
          <tbody id="leads-tbody" class="divide-y divide-slate-100 text-xs">
            <!-- Dynamic Rows -->
          </tbody>
        </table>
      </div>

      <!-- TABLE PAGINATION FOOTER -->
      <div class="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div id="pagination-info" class="text-slate-500 font-medium">
          หน้า 1 จาก 22 (แสดงรายการที่ 1 - 50)
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="goToPage(1)" class="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer" id="btn-first">« แรกสุด</button>
          <button onclick="prevPage()" class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer" id="btn-prev">‹ ก่อนหน้า</button>
          <span id="page-current-display" class="px-4 py-2 font-black text-slate-900 bg-white rounded-xl border border-slate-200 shadow-2xs">1</span>
          <button onclick="nextPage()" class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer" id="btn-next">ถัดไป ›</button>
          <button onclick="goToPage(totalPages)" class="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer" id="btn-last">ท้ายสุด »</button>
        </div>
      </div>
    </div>

  </main>

  <!-- FOOTER -->
  <footer class="mt-auto border-t border-slate-200 bg-white py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-800">บริษัท ฉี ไฉ่ อิเล็คทริค (ประเทศไทย) จำกัด</span>
        <span>•</span>
        <span>ฝ่ายขาย: คุณเอกชัย หาบ้านแท่น (092-479-7666)</span>
      </div>
      <div class="text-slate-400">
        © 2026 CHICAI ELECTRIC (THAILAND) CO., LTD. • B2B Sales Intelligence Platform
      </div>
    </div>
  </footer>

  <!-- JAVASCRIPT DATA & LOGIC -->
  <script>
    const RAW_LEADS = {json_leads_str};
    let filteredLeads = [...RAW_LEADS];
    let selectedDistrict = 'ALL';
    let selectedSubdistrict = 'ALL';
    let currentView = 'table';
    let currentPage = 1;
    let pageSize = 50;
    let totalPages = 1;

    // Chicai Electric Headquarters Coordinates
    const CHICAI_HQ = {{
      lat: 13.6304636,
      lng: 100.708154,
      name: 'บริษัท ฉี ไฉ่ อิเล็คทริค (ประเทศไทย) จำกัด (สำนักงานใหญ่)',
      address: '75/2 ชั้นที่ 3 หมู่ที่ 12 ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540',
      phone: '092-479-7666, 02-1307590-91',
      contact: 'คุณเอกชัย หาบ้านแท่น (Max)',
      catalog: 'https://catalog-chicai-lilac.vercel.app/'
    }};

    // Leaflet map objects
    let map = null;
    let markersCluster = null;
    let hqMarker = null;
    let hqRadiusCircle = null;

    // Build Subdistrict mapping by district
    const subdistrictsMap = {{}};
    RAW_LEADS.forEach(lead => {{
      const d = lead['อำเภอ'] || 'อื่นๆ';
      const s = lead['ตำบล'] || '';
      if (!subdistrictsMap[d]) subdistrictsMap[d] = new Set();
      if (s && s !== 'ไม่ระบุตำบล') subdistrictsMap[d].add(s);
    }});

    // Load saved sales status from localStorage
    const savedStatus = JSON.parse(localStorage.getItem('chicai_lead_status') || '{{}}');

    function populateSubdistricts() {{
      const subSelect = document.getElementById('subdistrict-select');
      subSelect.innerHTML = '<option value="ALL">-- ทุกตำบล --</option>';

      let subList = new Set();
      if (selectedDistrict === 'ALL') {{
        Object.values(subdistrictsMap).forEach(set => set.forEach(item => subList.add(item)));
      }} else if (subdistrictsMap[selectedDistrict]) {{
        subList = subdistrictsMap[selectedDistrict];
      }}

      Array.from(subList).sort().forEach(sub => {{
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = 'ตำบล' + sub;
        subSelect.appendChild(opt);
      }});

      subSelect.value = selectedSubdistrict;
    }}

    function onDistrictChange() {{
      selectedDistrict = document.getElementById('district-select').value;
      selectedSubdistrict = 'ALL';
      populateSubdistricts();
      
      const badge = document.getElementById('district-badge');
      badge.textContent = selectedDistrict === 'ALL' ? 'ทุกอำเภอ' : selectedDistrict;

      const subBadge = document.getElementById('subdistrict-badge');
      subBadge.classList.add('hidden');

      applyFilters();
    }}

    function onSubdistrictChange() {{
      selectedSubdistrict = document.getElementById('subdistrict-select').value;
      const subBadge = document.getElementById('subdistrict-badge');
      if (selectedSubdistrict === 'ALL') {{
        subBadge.classList.add('hidden');
      }} else {{
        subBadge.textContent = 'ตำบล' + selectedSubdistrict;
        subBadge.classList.remove('hidden');
      }}
      applyFilters();
    }}

    function resetAllFilters() {{
      document.getElementById('search-input').value = '';
      document.getElementById('filter-has-phone').checked = false;
      document.getElementById('filter-has-email').checked = false;
      document.getElementById('filter-has-web').checked = false;
      document.getElementById('district-select').value = 'ALL';
      selectedDistrict = 'ALL';
      selectedSubdistrict = 'ALL';
      populateSubdistricts();

      document.getElementById('district-badge').textContent = 'ทุกอำเภอ';
      document.getElementById('subdistrict-badge').classList.add('hidden');
      applyFilters();
    }}

    function initMap() {{
      if (map) return;

      // Samut Prakan Center Coordinates
      map = L.map('map').setView([CHICAI_HQ.lat, CHICAI_HQ.lng], 11);

      L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors | Chicai Electric B2B Map'
      }}).addTo(map);

      markersCluster = L.markerClusterGroup({{
        chunkedLoading: true,
        maxClusterRadius: 40
      }});
      map.addLayer(markersCluster);

      // Add Company HQ Marker (Standout Pin with Pulsing Effect)
      addCompanyHQMarker();

      updateMapMarkers();
    }}

    function addCompanyHQMarker() {{
      if (!map) return;

      const hqIcon = L.divIcon({{
        className: 'hq-marker-container',
        html: `
          <div class="hq-pulse"></div>
          <div class="hq-marker-icon" title="สำนักงานใหญ่ ฉี ไฉ่ อิเล็คทริค">
            ⭐
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      }});

      const hqPopupContent = `
        <div class="p-1.5 space-y-2 text-slate-800">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#0d3b37] to-[#145853] text-white text-[10px] font-black shadow-xs">
            <span>⭐</span>
            <span>สำนักงานใหญ่ / ศูนย์บริการ On-site Service</span>
          </div>
          <h3 class="font-extrabold text-sm text-[#0d3b37] leading-tight">${{CHICAI_HQ.name}}</h3>
          <p class="text-xs text-slate-600 leading-snug">${{CHICAI_HQ.address}}</p>
          <div class="p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1">
            <div class="font-bold text-emerald-950">👤 ฝ่ายขาย: ${{CHICAI_HQ.contact}}</div>
            <div class="font-mono text-emerald-800 font-bold">📞 ${{CHICAI_HQ.phone}}</div>
          </div>
          <div class="pt-1 flex items-center gap-2">
            <a href="${{CHICAI_HQ.catalog}}" target="_blank" class="flex-1 text-center py-2 px-3 rounded-xl bg-gradient-to-r from-[#219990] to-[#145853] text-white font-bold text-xs shadow-md hover:brightness-110 transition">
              🌐 เปิดแคตตาล็อกสินค้า
            </a>
          </div>
        </div>
      `;

      hqMarker = L.marker([CHICAI_HQ.lat, CHICAI_HQ.lng], {{ icon: hqIcon, zIndexOffset: 1000 }}).addTo(map);
      hqMarker.bindPopup(hqPopupContent);

      // Add 5km Service Coverage Zone Circle around HQ
      hqRadiusCircle = L.circle([CHICAI_HQ.lat, CHICAI_HQ.lng], {{
        color: '#219990',
        fillColor: '#10B981',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6',
        radius: 5000 // 5 km
      }}).addTo(map);
    }}

    function zoomToHQ() {{
      if (map && hqMarker) {{
        map.setView([CHICAI_HQ.lat, CHICAI_HQ.lng], 14);
        hqMarker.openPopup();
      }}
    }}

    function updateMapMarkers() {{
      if (!map || !markersCluster) return;

      markersCluster.clearLayers();
      const bounds = [[CHICAI_HQ.lat, CHICAI_HQ.lng]];

      filteredLeads.forEach(lead => {{
        const lat = parseFloat(lead['ละติจูด (Lat)']);
        const lng = parseFloat(lead['ลองจิจูด (Lng)']);

        if (isNaN(lat) || isNaN(lng)) return;

        bounds.push([lat, lng]);

        const name = lead['ชื่อโรงงาน / บริษัท'] || 'โรงงาน';
        const phone = lead['เบอร์โทรศัพท์'] || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const email = lead['อีเมลติดต่อ (Email)'] || '';
        const addr = lead['ที่อยู่'] || '';
        const dist = lead['อำเภอ'] || '';
        const subdist = lead['ตำบล'] || '';
        const web = lead['เว็บไซต์ / ช่องทางติดต่อ'] || '';
        const mapsUrl = lead['Google Maps Link'] || `https://www.google.com/maps/search/?api=1&query=${{lat}},${{lng}}`;

        const phoneHtml = phone 
          ? `<div class="mt-2.5"><a href="tel:${{cleanPhone}}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200 transition">📞 ${{phone}}</a></div>` 
          : '';

        const emailHtml = email 
          ? `<div class="mt-1.5 text-xs text-violet-700 font-mono truncate">✉️ ${{email.split(',')[0]}}</div>` 
          : '';

        const webHtml = web 
          ? `<a href="${{web}}" target="_blank" class="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100 transition">🌐 เว็บไซต์</a>` 
          : '';

        const mapBtnHtml = `<a href="${{mapsUrl}}" target="_blank" class="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 hover:bg-amber-100 transition">📍 นำทาง</a>`;

        const locationTag = (subdist && subdist !== 'ไม่ระบุตำบล') ? `ตำบล${{subdist}} • ${{dist}}` : dist;

        const popupContent = `
          <div class="space-y-1.5 text-slate-800">
            <div class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-[#0d3b37] inline-block border border-slate-200">${{locationTag}}</div>
            <h4 class="font-black text-sm text-slate-900 leading-snug">${{name}}</h4>
            <p class="text-[11px] text-slate-500 leading-tight">${{addr}}</p>
            ${{phoneHtml}}
            ${{emailHtml}}
            <div class="pt-2 flex items-center gap-2 border-t border-slate-100 mt-2">
              ${{webHtml}}
              ${{mapBtnHtml}}
            </div>
          </div>
        `;

        const marker = L.marker([lat, lng]);
        marker.bindPopup(popupContent);
        markersCluster.addLayer(marker);
      }});

      if (bounds.length > 1) {{
        map.fitBounds(bounds, {{ padding: [30, 30] }});
      }}
    }}

    function resetMapView() {{
      if (map) {{
        map.setView([CHICAI_HQ.lat, CHICAI_HQ.lng], 11);
      }}
    }}

    function switchView(view) {{
      currentView = view;
      const tableContainer = document.getElementById('view-table-container');
      const mapContainer = document.getElementById('view-map-container');
      const tableBtn = document.getElementById('tab-table-btn');
      const mapBtn = document.getElementById('tab-map-btn');
      const pageSizeCtrl = document.getElementById('table-page-size-ctrl');

      if (view === 'map') {{
        tableContainer.classList.add('hidden');
        mapContainer.classList.remove('hidden');
        pageSizeCtrl.classList.add('hidden');

        mapBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-white text-[#0d3b37] shadow-md cursor-pointer';
        tableBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer';

        setTimeout(() => {{
          initMap();
          if (map) {{
            map.invalidateSize();
            updateMapMarkers();
          }}
        }}, 100);
      }} else {{
        mapContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        pageSizeCtrl.classList.remove('hidden');

        tableBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-white text-[#0d3b37] shadow-md cursor-pointer';
        mapBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer';
        
        renderTable();
      }}
    }}

    function applyFilters() {{
      const query = document.getElementById('search-input').value.toLowerCase().trim();
      const hasPhone = document.getElementById('filter-has-phone').checked;
      const hasEmail = document.getElementById('filter-has-email').checked;
      const hasWeb = document.getElementById('filter-has-web').checked;
      const clearBtn = document.getElementById('clear-search-btn');

      if (query) {{
        clearBtn.classList.remove('hidden');
      }} else {{
        clearBtn.classList.add('hidden');
      }}

      filteredLeads = RAW_LEADS.filter(lead => {{
        // District Filter
        if (selectedDistrict !== 'ALL') {{
          const leadDist = lead['อำเภอ'] || '';
          if (selectedDistrict === 'OTHER') {{
            if (leadDist.includes('สมุทรปราการ') || leadDist.includes('บางพลี') || leadDist.includes('บางเสาธง') || leadDist.includes('บางบ่อ') || leadDist.includes('พระประแดง') || leadDist.includes('พระสมุทรเจดีย์')) {{
              return false;
            }}
          }} else if (!leadDist.includes(selectedDistrict)) {{
            return false;
          }}
        }}

        // Subdistrict Filter
        if (selectedSubdistrict !== 'ALL') {{
          const leadSub = lead['ตำบล'] || '';
          if (leadSub !== selectedSubdistrict && !lead['ที่อยู่'].includes(selectedSubdistrict)) {{
            return false;
          }}
        }}

        // Phone Filter
        if (hasPhone && (!lead['เบอร์โทรศัพท์'] || lead['เบอร์โทรศัพท์'].trim() === '')) return false;

        // Email Filter
        if (hasEmail && (!lead['อีเมลติดต่อ (Email)'] || lead['อีเมลติดต่อ (Email)'].trim() === '')) return false;

        // Website Filter
        if (hasWeb && (!lead['เว็บไซต์ / ช่องทางติดต่อ'] || lead['เว็บไซต์ / ช่องทางติดต่อ'].trim() === '')) return false;

        // Search Query
        if (query) {{
          const name = (lead['ชื่อโรงงาน / บริษัท'] || '').toLowerCase();
          const addr = (lead['ที่อยู่'] || '').toLowerCase();
          const phone = (lead['เบอร์โทรศัพท์'] || '').toLowerCase();
          const email = (lead['อีเมลติดต่อ (Email)'] || '').toLowerCase();
          const dist = (lead['อำเภอ'] || '').toLowerCase();
          const sub = (lead['ตำบล'] || '').toLowerCase();

          if (!name.includes(query) && !addr.includes(query) && !phone.includes(query) && !email.includes(query) && !dist.includes(query) && !sub.includes(query)) {{
            return false;
          }}
        }}

        return true;
      }});

      currentPage = 1;
      renderTable();
      if (currentView === 'map') {{
        updateMapMarkers();
      }}
    }}

    function clearSearch() {{
      document.getElementById('search-input').value = '';
      applyFilters();
    }}

    function changePageSize() {{
      pageSize = parseInt(document.getElementById('page-size').value, 10);
      currentPage = 1;
      renderTable();
    }}

    function goToPage(page) {{
      if (page >= 1 && page <= totalPages) {{
        currentPage = page;
        renderTable();
      }}
    }}

    function prevPage() {{
      if (currentPage > 1) {{
        currentPage--;
        renderTable();
      }}
    }}

    function nextPage() {{
      if (currentPage < totalPages) {{
        currentPage++;
        renderTable();
      }}
    }}

    function setStatus(placeId, status) {{
      savedStatus[placeId] = status;
      localStorage.setItem('chicai_lead_status', JSON.stringify(savedStatus));
      applyFilters();
    }}

    function renderTable() {{
      const tbody = document.getElementById('leads-tbody');
      const resultCount = document.getElementById('result-count');
      resultCount.textContent = filteredLeads.length.toLocaleString();

      totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
      if (currentPage > totalPages) currentPage = totalPages;

      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, filteredLeads.length);
      const pageData = filteredLeads.slice(startIdx, endIdx);

      // Update Pagination Display
      document.getElementById('page-current-display').textContent = currentPage;
      document.getElementById('pagination-info').textContent = 
        `หน้า ${{currentPage}} จาก ${{totalPages}} (แสดงรายการที่ ${{(filteredLeads.length === 0 ? 0 : startIdx + 1).toLocaleString()}} - ${{endIdx.toLocaleString()}} จากทั้งหมด ${{filteredLeads.length.toLocaleString()}})`;

      document.getElementById('btn-first').disabled = currentPage <= 1;
      document.getElementById('btn-prev').disabled = currentPage <= 1;
      document.getElementById('btn-next').disabled = currentPage >= totalPages;
      document.getElementById('btn-last').disabled = currentPage >= totalPages;

      if (pageData.length === 0) {{
        tbody.innerHTML = `<tr><td colspan="9" class="py-16 text-center text-slate-400 font-medium">❌ ไม่พบโรงงานที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
        return;
      }}

      let html = '';
      pageData.forEach((lead, i) => {{
        const itemIdx = startIdx + i + 1;
        const name = lead['ชื่อโรงงาน / บริษัท'] || '-';
        const phone = lead['เบอร์โทรศัพท์'] || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const email = lead['อีเมลติดต่อ (Email)'] || '';
        const addr = lead['ที่อยู่'] || '-';
        const dist = lead['อำเภอ'] || '-';
        const subdist = lead['ตำบล'] || '-';
        const web = lead['เว็บไซต์ / ช่องทางติดต่อ'] || '';
        const mapsUrl = lead['Google Maps Link'] || '';
        const pid = lead['Place ID'] || lead['ลำดับ'];
        const currentStat = savedStatus[pid] || lead['สถานะการโทร (Sales Pipeline)'] || 'ยังไม่ได้ติดต่อ';

        const phoneCell = phone 
          ? `<a href="tel:${{cleanPhone}}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200/80 transition-all hover:scale-105 active:scale-95 shadow-2xs" title="โทรติดต่อทันที">
              <span>📞</span>
              <span>${{phone}}</span>
             </a>`
          : `<span class="text-slate-300 italic">ไม่มีเบอร์</span>`;

        const emailCell = email
          ? `<div class="flex flex-col gap-1 max-w-[170px]">
              ${{email.split(',').slice(0, 2).map(em => `<span class="inline-block px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/80 font-mono text-[10px] font-semibold truncate" title="${{em.trim()}}">✉️ ${{em.trim()}}</span>`).join('')}}
             </div>`
          : `<span class="text-slate-300 italic text-[11px]">-</span>`;

        const webBtn = web 
          ? `<a href="${{web}}" target="_blank" class="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 inline-flex items-center justify-center text-xs transition active:scale-95 shadow-2xs" title="เปิดเว็บไซต์">🌐</a>` 
          : '';

        const mapBtn = mapsUrl 
          ? `<a href="${{mapsUrl}}" target="_blank" class="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center justify-center text-xs transition active:scale-95 shadow-2xs" title="เปิด Google Maps">📍</a>` 
          : '';

        const statusOptions = ['ยังไม่ได้ติดต่อ', 'โทรติดต่อแล้ว', 'นัดหมาย On-site Demo', 'เสนอราคาแล้ว', 'ปิดการขายสำเร็จ', 'ไม่สนใจ / ปฏิเสธ'];
        const selectOptions = statusOptions.map(opt => `<option value="${{opt}}" ${{opt === currentStat ? 'selected' : ''}}>${{opt}}</option>`).join('');

        let statusBg = 'bg-slate-50 text-slate-700 border-slate-200';
        if (currentStat.includes('นัดหมาย')) statusBg = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
        else if (currentStat.includes('โทร')) statusBg = 'bg-blue-50 text-blue-900 border-blue-300 font-medium';
        else if (currentStat.includes('เสนอราคา')) statusBg = 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
        else if (currentStat.includes('สำเร็จ')) statusBg = 'bg-purple-50 text-purple-900 border-purple-300 font-bold';

        html += `
          <tr class="hover:bg-slate-50/90 transition-colors group">
            <td class="py-3.5 px-3.5 text-center text-slate-400 font-mono font-bold text-[11px]">${{itemIdx}}</td>
            <td class="py-3.5 px-4 font-extrabold text-slate-900 leading-snug">
              <div class="group-hover:text-[#145853] transition-colors">${{name}}</div>
              <div class="text-[10px] text-slate-400 font-normal font-mono mt-0.5">GPS: ${{lead['ละติจูด (Lat)'] ? lead['ละติจูด (Lat)'] + ', ' + lead['ลองจิจูด (Lng)'] : '-'}}</div>
            </td>
            <td class="py-3.5 px-4">${{phoneCell}}</td>
            <td class="py-3.5 px-4">${{emailCell}}</td>
            <td class="py-3.5 px-3">
              <span class="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold text-[11px] border border-blue-100">${{subdist}}</span>
            </td>
            <td class="py-3.5 px-3">
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/60">${{dist}}</span>
            </td>
            <td class="py-3.5 px-4 text-slate-600 text-[11px] leading-relaxed max-w-xs truncate" title="${{addr}}">${{addr}}</td>
            <td class="py-3.5 px-3 text-center space-x-1.5 whitespace-nowrap">
              ${{webBtn}}
              ${{mapBtn}}
            </td>
            <td class="py-3.5 px-4">
              <select onchange="setStatus('${{pid}}', this.value)" class="text-[11px] rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer transition shadow-2xs ${{statusBg}}">
                ${{selectOptions}}
              </select>
            </td>
          </tr>
        `;
      }});

      tbody.innerHTML = html;
    }}

    function exportToCsv() {{
      if (filteredLeads.length === 0) {{
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }}

      const headers = ['ลำดับ', 'ชื่อโรงงาน / บริษัท', 'เบอร์โทรศัพท์', 'อีเมลติดต่อ (Email)', 'ตำบล', 'อำเภอ', 'ที่อยู่', 'จังหวัด', 'เว็บไซต์ / ช่องทางติดต่อ', 'ละติจูด (Lat)', 'ลองจิจูด (Lng)', 'Google Maps Link', 'สถานะติดตาม'];
      let csvContent = '\\uFEFF' + headers.join(',') + '\\n';

      filteredLeads.forEach((lead, idx) => {{
        const pid = lead['Place ID'] || lead['ลำดับ'];
        const stat = savedStatus[pid] || lead['สถานะการโทร (Sales Pipeline)'] || 'ยังไม่ได้ติดต่อ';

        const row = [
          idx + 1,
          `"${{(lead['ชื่อโรงงาน / บริษัท'] || '').replace(/"/g, '""')}}"`,
          `"${{lead['เบอร์โทรศัพท์'] || ''}}"`,
          `"${{(lead['อีเมลติดต่อ (Email)'] || '').replace(/"/g, '""')}}"`,
          `"${{lead['ตำบล'] || ''}}"`,
          `"${{lead['อำเภอ'] || ''}}"`,
          `"${{(lead['ที่อยู่'] || '').replace(/"/g, '""')}}"`,
          `"${{lead['จังหวัด'] || ''}}"`,
          `"${{lead['เว็บไซต์ / ช่องทางติดต่อ'] || ''}}"`,
          `"${{lead['ละติจูด (Lat)'] || ''}}"`,
          `"${{lead['ลองจิจูด (Lng)'] || ''}}"`,
          `"${{lead['Google Maps Link'] || ''}}"`,
          `"${{stat}}"`
        ];
        csvContent += row.join(',') + '\\n';
      }});

      const blob = new Blob([csvContent], {{ type: 'text/csv;charset=utf-8;' }});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `chicai_leads_export_${{new Date().toISOString().slice(0,10)}}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }}

    // Initialize
    populateSubdistricts();
    renderTable();
  </script>
</body>
</html>
"""

    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    artifact_dir = '/Users/akachai.h/.gemini/antigravity/brain/95f7edd1-1e28-41bc-a149-61de5c85a915'
    if os.path.exists(artifact_dir):
        artifact_path = os.path.join(artifact_dir, 'dashboard.html')
        shutil.copyfile('dashboard.html', artifact_path)

    print("Successfully built beautiful, modern executive Dashboard!")

if __name__ == '__main__':
    build_dashboard()
