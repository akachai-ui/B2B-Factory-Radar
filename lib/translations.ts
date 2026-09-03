export type Language = 'th' | 'en' | 'zh';

export const translations: Record<Language, Record<string, string>> = {
  th: {
    // Brand & App
    appName: 'RouteHunter',
    appSubtitle: 'ระบบจัดการข้อมูลและเรดาร์เป้าหมายโรงงาน (ประหยัดเวลา & ลดต้นทุนองค์กร)',
    proWorkspace: 'VERIFIED LEADS',
    appBadge: 'Sales Automation',
    proMember: 'Verified Sales Rep',

    // Top Navbar
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    goToDashboard: 'เข้าสู่ศูนย์บัญชาการ',
    dashboardMy: 'เข้าสู่ Dashboard เป้าหมาย',
    freeTrialBtn: 'ทดลองใช้งานฟรี',

    // Hero Section
    heroExecutiveTag: 'ลดต้นทุนการจ้างงานพนักงานได้หลายตำแหน่ง • ยกระดับทีมขายสู่ระบบอัตโนมัติ',
    heroHeadline1: 'ประหยัดค่าจ้างพนักงานได้หลายส่วน',
    heroHeadline2: 'ฝ่ายขายไม่ต้องเสียเวลากับการวางแผน',
    heroHeadline3: 'มีหน้าที่ออกไปขายและปิดดีลอย่างเดียว',
    heroSub: 'รวบรวม 4 ระบบอัจฉริยะไว้ในที่เดียว: สืบค้นข้อมูลบริษัท + วางแผนการเดินทางด้วย Live GPS + บริหารจัดการข้อมูลโรงงานครอบคลุม 6 อำเภอ 990+ แห่ง + แดชบอร์ดติดตามงานขาย จบปัญหาเซลส์เสียเวลานั่งงมหาทาง หรือจ้างคนมาทำเอกสาร',
    
    pillar1Title: '1. ค้นหาข้อมูลบริษัท & DBD',
    pillar1Desc: 'เช็กทุนจดทะเบียน สถานะนิติบุคคล และเบอร์โทรศัพท์ตรงของบริษัทในคลิกเดียว ไม่ต้องจ้างคนนั่งค้นหาข้อมูล',
    pillar2Title: '2. วางแผนการเดินทางอัจฉริยะ',
    pillar2Desc: 'Live GPS คำนวณระยะทางจากรถ นำทางตรงถึงประตูทางเข้าโรงงาน 100% ประหยัดเวลาหลงทาง 3 ชม./วัน',
    pillar3Title: '3. บริหารจัดการข้อมูลโรงงาน (ครอบคลุม 6 อำเภอ)',
    pillar3Desc: 'คลังเป้าหมาย 990+ แห่ง ครอบคลุม 6 อำเภออุตสาหกรรมในสมุทรปราการ (บางพลี, บางปู, พระประแดง ฯลฯ) เปิดจอแล้วเลือกเจาะได้ทันที',
    pillar4Title: '4. แดชบอร์ดติดตามงานขาย',
    pillar4Desc: 'บันทึกสถานะและโน้ตการโทรผ่านมือถือ ไม่ต้องจ้างแอดมินคอยกรอก Excel หรือตามงาน',

    unlockFreeTrialBtn: 'ทดลองใช้งานฟรี (ปลดล็อก 6 อำเภอ 990+ โรงงาน)',
    viewLiveRadarBtn: 'ดูเรดาร์แผนที่สด',
    enterCommandBtn: 'เข้าสู่ศูนย์บัญชาการเป้าหมาย',

    // ROI Section
    roiTag: 'ผลตอบแทนจากการลงทุน (Business ROI)',
    roiTitle: 'ประหยัดต้นทุนองค์กรหลักแสน • เพิ่มยอดขายให้ทีมงานแบบก้าวกระโดด',
    roiSub: 'เมื่อเปลี่ยนกระบวนการขายแบบเดิม ๆ ให้กลายเป็นระบบอัตโนมัติ องค์กรของคุณจะได้ผลลัพธ์ที่จับต้องได้ทันที',
    
    roi1Val: '฿360,000+',
    roi1Unit: '/ ปี',
    roi1Title: 'ประหยัดค่าจ้างพนักงาน Data & Admin',
    roi1Desc: 'ไม่ต้องจ้างพนักงานคอยหาข้อมูลรายชื่อโรงงาน หรือจ้างแอดมินคอยทำรายงานสรุปสถานะการเข้าพบ',

    roi2Val: '66 ชั่วโมง',
    roi2Unit: '/ คน / เดือน',
    roi2Title: 'คืนเวลาที่มีค่าให้เซลส์โฟกัสการขาย',
    roi2Desc: 'ประหยัดเวลาการนั่งวางแผนเส้นทางวันละ 3 ชั่วโมง ให้เซลส์เอาเวลาไปโทรคุยและเข้าพบบริษัทเป้าหมายได้มากขึ้น 3 เท่า',

    roi3Val: '100% แม่นยำ',
    roi3Unit: 'ตรงประตูทางเข้า',
    roi3Title: 'ลดค่าน้ำมันขับหลงทาง & ไม่ติด รปภ.',
    roi3Desc: 'พิกัดประตูทางเข้าถูกต้อง พร้อมลิงก์เช็กขนาดธุรกิจ DBD ทราบขนาดโรงงานล่วงหน้าก่อนก้าวลงจากรถ',

    compOldTitle: 'กระบวนการขายแบบดั้งเดิม (สิ้นเปลืองต้นทุน)',
    compOld1: 'ต้องจ้างพนักงานหลายตำแหน่ง: ทั้งคนหาข้อมูล, คนโทรเช็กเบอร์, และแอดมินตามงาน',
    compOld2: 'เซลส์เสียเวลาวางแผนครึ่งวัน: นั่งเปิด Google Maps หาซอย เสียค่าน้ำมันขับวนหาโรงงาน',
    compOld3: 'ข้อมูลกระจัดกระจาย: บันทึกงานบนกระดาษหรือไลน์ ไม่รู้ว่าโรงงานไหนโทรแล้วหรือเสนอราคาไปแล้ว',

    compRadarTitle: 'ใช้ RouteHunter (เซลส์มีหน้าที่ขายอย่างเดียว)',
    compRadar1: 'ระบบค้นหาและเตรียมข้อมูลให้เสร็จสรรพ: เบอร์โทรศัพท์ตรงของโรงงาน/บริษัท + ทุนจดทะเบียน DBD พร้อมใช้งาน',
    compRadar2: 'Live GPS คำนวณเส้นทางและนำทางอัตโนมัติ: บอกโรงงานที่ใกล้ตัวที่สุด ขับตรงถึงประตูผู้ติดต่อ',
    compRadar3: 'แดชบอร์ดอัปเดตสถานะทันทีบนมือถือ: ปรับสถานะ โทรแล้ว, นัดเข้าพบ, เสนอราคา ใน 1 วินาที',

    radarTitle: 'ศูนย์บัญชาการพิกัดโรงงาน 6 อำเภอ 990+ แห่ง (เปิดจอแล้ววิ่งได้ทันที)',
    screeningLabel: 'ระบบคัดกรอง:',
    gateVerifiedBadge: 'พิกัดประตูทางเข้า 100%',

    // Zones & Territories
    zoneAll: '🌐 ทุกโซน / ครอบคลุม 6 อำเภอ (990+ แห่ง)',
    zoneBangPhli: '📍 โซนบางพลี - กิ่งแก้ว (384 แห่ง)',
    zoneBangpoo: '📍 โซนนิคมฯ บางปู - แพรกษา (328 แห่ง)',
    zoneAsiaSuvarnabhumi: '📍 โซนนิคมฯ เอเชียสุวรรณภูมิ',
    zoneBangSaoThong: '📍 โซนบางเสาธง (81 แห่ง)',
    zonePhraPradaeng: '📍 โซนพระประแดง - สุขสวัสดิ์ (114 แห่ง)',
    zonePhraSamut: '📍 โซนพระสมุทรเจดีย์ (115 แห่ง)',
    zoneBangBo: '📍 โซนบางบ่อ (87 แห่ง)',
    zoneMueang: '📍 โซนเมืองสมุทรปราการ',
    allDistricts: '🏛️ ทุกอำเภอในสมุทรปราการ (990+ แห่ง)',
    allSubdistricts: '🏘️ ทุกตำบล',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 โรงงานใกล้ฉัน',
    nearMeAll: '🌐 ทุกระยะทาง',
    radius3km: '⚡ 3 กม. (~5 นาที)',
    radius5km: '🚗 5 กม. (~10 นาที)',
    radius10km: '🛣️ 10 กม. (~20 นาที)',
    radius20km: '📍 20 กม. (ทั้งโซน)',
    radiusLabel: 'รัศมี:',
    closestFirst: 'เรียงตามระยะทางใกล้สุด',

    // Lead Status Tags (Pillar 1)
    statusAll: '📋 ทุกสถานะเป้าหมาย',
    statusNew: '⚪ โรงงานใหม่ (New Lead)',
    statusContacted: '🟡 โทรติดต่อแล้ว (Contacted)',
    statusMeeting: '🟣 นัดเข้าพบได้ (Meeting Scheduled)',
    statusQuoted: '🔵 เสนอราคาแล้ว (Quoted)',
    statusWon: '🏆 ลูกค้าประจำ / ปิดการขาย (Customer / Won)',
    statusLost: '🔴 ปฏิเสธ / ยังไม่สนใจ',
    statusLabel: 'ป้ายกำกับสถานะ (Status Tag):',
    notePlaceholder: 'บันทึกข้อมูลช่วยเปิดบทสนทนา (เช่น คุยกับคุณสมศักดิ์, โรงงานมี 12 เครื่องฉีด)...',
    savedNoteLabel: 'โน้ตล่าสุด:',
    saveStatusBtn: 'บันทึกสถานะ',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact (ข้อมูลเสริมช่วยเปิดบทสนทนา)',
    checkDbdBtn: '🔍 ตรวจสอบทุนจดทะเบียน & นิติบุคคล (DBD Dataforthai)',
    directLine: 'เบอร์โทรศัพท์ตรงของบริษัท',

    // Map Section
    mapCommandCenter: 'ศูนย์บัญชาการพิกัดโรงงานพร้อมเจาะ',
    mapSubheading: 'พิกัด GPS แม่นยำตรงประตูทางเข้า แตะที่หมุดเพื่อดูเบอร์ตรงโรงงานและ Quick Fact',
    displaying: 'แสดงผลเป้าหมาย:',
    factoriesUnit: 'โรงงาน',
    pinsUnit: 'หมุด',
    liveGpsActive: '🟢 Live GPS: เปิดอยู่',
    liveGpsInactive: '⚪ เปิด Live GPS',
    liveGpsCar: '🟢 Live GPS เคลื่อนที่ตามรถ',
    yourGpsLocation: 'พิกัด GPS ของคุณ',
    zoomLocation: 'ซูมพิกัด',
    centerMap: 'จัดกึ่งกลางแผนที่',

    // Popup & Bottom Sheet
    guestLockedTitle: 'โรงงานฉีดพลาสติก & การผลิต',
    guestLockedDesc: 'พิกัดปักหมุดตรงประตูทางเข้า พร้อมเบอร์โทรและข้อมูลนิติบุคคล',
    unlockThisFactoryBtn: '🔓 เปิดดูข้อมูลเป้าหมายนี้',
    distanceAway: 'ห่างจากคุณ ~',
    drivingTime: 'ขับรถ ~',
    minutesUnit: 'นาที',
    callNow: 'โทรตรงโรงงาน / บริษัท',
    navigateGoogle: 'นำทาง Google Maps',
    visitWebsite: 'เปิดดูเว็บไซต์บริษัท',
    noPhone: 'ไม่มีเบอร์โทร',
    phoneLabel: 'เบอร์โทรศัพท์ตรงของบริษัท',
    emailLabel: 'อีเมล',
    addressLabel: 'ที่อยู่ละเอียด',
    actionsLabel: 'แอ็กชัน',
    districtCol: 'พื้นที่ / โซนอุตสาหกรรม',

    // Dashboard
    searchPlaceholder: 'ค้นหาชื่อโรงงาน, เบอร์, ถนน, โซนนิคมฯ...',
    mapView: 'แผนที่สด',
    tableView: 'ตารางรายชื่อ',
    tableTitle: 'คลังเป้าหมายโรงงานพร้อมเจาะ (Verified Leads Directory)',
    tableSub: 'รายชื่อโรงงานครอบคลุม 6 อำเภอ 990+ แห่ง พร้อมสถานะติดตามงาน เบอร์โทรศัพท์ตรงของบริษัท และปุ่มเช็กข้อมูลนิติบุคคล',
    allUnlockedBadge: 'Verified 100%',
    accessDatabaseText: 'ฐานข้อมูลโรงงานฉีดพลาสติก & แม่พิมพ์ สมุทรปราการ',

    // Auth Modal
    authSignInTitle: 'เข้าสู่ระบบ (Sign In)',
    authSignUpTitle: 'สมัครสมาชิกใหม่ (Sign Up)',
    orUseEmail: 'หรือใช้อีเมลของคุณ',
    fullNameLabel: 'ชื่อ-นามสกุล / ผู้ติดต่อ:',
    fullNamePlaceholder: 'เช่น คุณสมชาย สุขสมบัติ',
    companyNameLabel: 'ชื่อบริษัท / องค์กรของคุณ:',
    companyNamePlaceholder: 'เช่น บริษัท สยาม ซัพพลาย จำกัด',
    emailInputLabel: 'อีเมล (Email):',
    passwordInputLabel: 'รหัสผ่าน (Password):',
    passwordPlaceholder: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร',
    createAccountBtn: 'สร้างบัญชีผู้ใช้ใหม่',

    // Footer
    footerCopy: '© 2026 RouteHunter • ระบบบริหารจัดการการขาย & เรดาร์เป้าหมายโรงงานอุตสาหกรรม',
  },

  en: {
    // Brand & App
    appName: 'RouteHunter',
    appSubtitle: 'Sales Intelligence & Factory Radar (Save Time & Cut Overhead Costs)',
    proWorkspace: 'VERIFIED LEADS',
    appBadge: 'Sales Automation',
    proMember: 'Verified Sales Rep',

    // Top Navbar
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    goToDashboard: 'Enter Command Center',
    dashboardMy: 'Enter My Target Radar',
    freeTrialBtn: 'Start Free Trial',

    // Hero Section
    heroExecutiveTag: 'Reduce Headcount & Overhead Costs • Elevate Sales to Full Automation',
    heroHeadline1: 'Save Multiple Employee Salaries',
    heroHeadline2: 'Sales Reps Waste Zero Time Planning',
    heroHeadline3: 'Focus 100% on Pitching and Closing Deals',
    heroSub: 'All-in-one smart platform: Instant Company & DBD Research + Live GPS Route Planning + 990+ Factory Lead Engine Across 6 Districts + Sales Pipeline CRM. Eliminate manual route planning and admin paperwork.',
    
    pillar1Title: '1. Instant Company & DBD Research',
    pillar1Desc: 'Instant registered capital, legal status, and direct company phone lines in 1 click. Zero need for data research headcount.',
    pillar2Title: '2. Smart Travel & Route Planning',
    pillar2Desc: 'Live GPS calculates distances from your car and routes 100% to the entrance gate. Saves 3 hours of lost travel time daily.',
    pillar3Title: '3. 990+ Factory Leads (6 Districts)',
    pillar3Desc: 'Comprehensive catalog of 990+ target factories across 6 industrial districts in Samut Prakan (Bang Phli, Bangpoo, Suksawat, etc.). Ready to pitch instantly.',
    pillar4Title: '4. Mobile Sales Pipeline Dashboard',
    pillar4Desc: 'Log call stages and notes instantly on mobile. Eliminates the need for sales admins to manage messy Excel sheets.',

    unlockFreeTrialBtn: 'Start Free Trial (Unlock 990+ Factories across 6 Districts)',
    viewLiveRadarBtn: 'Explore Live Map Radar',
    enterCommandBtn: 'Enter Radar Command Center',

    // ROI Section
    roiTag: 'Business ROI & Cost Savings',
    roiTitle: 'Save Hundreds of Thousands in Overhead • Exponentially Boost Sales Revenue',
    roiSub: 'Transforming legacy sales operations into an automated system delivers immediate, measurable bottom-line returns.',
    
    roi1Val: '฿360,000+',
    roi1Unit: '/ year',
    roi1Title: 'Save on Data & Sales Admin Salaries',
    roi1Desc: 'No need to hire dedicated researchers to find factory phone numbers or admins to compile manual visit reports.',

    roi2Val: '66 Hours',
    roi2Unit: '/ rep / month',
    roi2Title: 'Reclaim High-Value Selling Time',
    roi2Desc: 'Save 3 hours of daily route mapping, empowering reps to call and meet 3x more target factories each month.',

    roi3Val: '100% Accurate',
    roi3Unit: 'at Entrance Gate',
    roi3Title: 'Reduce Fuel Waste & Avoid Security Rejections',
    roi3Desc: 'Accurate entrance coordinates with direct DBD company facts to know business scale before stepping out of the car.',

    compOldTitle: 'Legacy Sales Method (High Cost & Inefficiency)',
    compOld1: 'Requires Multiple Headcounts: Data searchers, telesales checkers, and admin report compilers.',
    compOld2: 'Half-Day Lost Planning: Reps spend hours on Google Maps and waste fuel driving in random circles.',
    compOld3: 'Scattered Data: Notes on paper or chat apps, with zero visibility on who was called or quoted.',

    compRadarTitle: 'With RouteHunter (Reps Purely Pitch & Close)',
    compRadar1: 'Pre-Engineered Intelligence: Direct company phone numbers + DBD registered capital ready to use.',
    compRadar2: 'Live GPS Routing: Auto-detects closest factories and navigates directly to the contact entrance gate.',
    compRadar3: 'Real-Time Mobile Dashboard: Update stages (Contacted, Meeting, Quoted) in 1 second.',

    radarTitle: '990+ Factory Radar Command Center across 6 Districts (Open & Drive Instantly)',
    screeningLabel: 'Lead Verification:',
    gateVerifiedBadge: '100% Gate Verified',

    // Zones & Territories
    zoneAll: '🌐 All 6 Industrial Districts (990+)',
    zoneBangPhli: '📍 Bang Phli - King Kaew Zone (384)',
    zoneBangpoo: '📍 Bangpoo Industrial Estate Zone (328)',
    zoneAsiaSuvarnabhumi: '📍 Asia Suvarnabhumi Estate Zone',
    zoneBangSaoThong: '📍 Bang Sao Thong Zone (81)',
    zonePhraPradaeng: '📍 Phra Pradaeng - Suksawat Zone (114)',
    zonePhraSamut: '📍 Phra Samut Chedi Zone (115)',
    zoneBangBo: '📍 Bang Bo Zone (87)',
    zoneMueang: '📍 Mueang Samut Prakan Zone',
    allDistricts: '🏛️ All Districts in Samut Prakan (990+)',
    allSubdistricts: '🏘️ All Subdistricts',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 Factories Near Me',
    nearMeAll: '🌐 All Distances',
    radius3km: '⚡ 3 km (~5 min)',
    radius5km: '🚗 5 km (~10 min)',
    radius10km: '🛣️ 10 km (~20 min)',
    radius20km: '📍 20 km (Zone)',
    radiusLabel: 'Radius:',
    closestFirst: 'Sort by Closest Distance',

    // Lead Status Tags (Pillar 1)
    statusAll: '📋 All Lead Stages',
    statusNew: '⚪ New Lead',
    statusContacted: '🟡 Contacted',
    statusMeeting: '🟣 Meeting Scheduled',
    statusQuoted: '🔵 Quoted',
    statusWon: '🏆 Customer / Closed Won',
    statusLost: '🔴 Not Interested / Lost',
    statusLabel: 'Status Tag:',
    notePlaceholder: 'Add conversational intelligence notes (e.g. contact name, 12 injection machines)...',
    savedNoteLabel: 'Latest Note:',
    saveStatusBtn: 'Save Status',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact & Intelligence',
    checkDbdBtn: '🔍 Check Registered Capital & DBD Info (Dataforthai)',
    directLine: 'Direct Company Phone Line',

    // Map Section
    mapCommandCenter: 'Target Factory Radar Command Center',
    mapSubheading: 'Accurate entrance GPS pins. Tap any pin for direct company phone numbers and Company Quick Facts.',
    displaying: 'Showing Targets:',
    factoriesUnit: 'Factories',
    pinsUnit: 'Pins',
    liveGpsActive: '🟢 Live GPS: ON',
    liveGpsInactive: '⚪ Enable Live GPS',
    liveGpsCar: '🟢 Live GPS Tracking Vehicle',
    yourGpsLocation: 'Your GPS Location',
    zoomLocation: 'Zoom Me',
    centerMap: 'Center Map',

    // Popup & Bottom Sheet
    guestLockedTitle: 'Plastic Injection Factory',
    guestLockedDesc: 'Accurate entrance GPS coords with direct company phone numbers and company facts.',
    unlockThisFactoryBtn: '🔓 View Target Details',
    distanceAway: 'Distance from you ~',
    drivingTime: 'Drive ~',
    minutesUnit: 'min',
    callNow: 'Call Factory / Company Direct',
    navigateGoogle: 'Navigate Google Maps',
    visitWebsite: 'Visit Website',
    noPhone: 'No Phone',
    phoneLabel: 'Direct Company Phone',
    emailLabel: 'Email',
    addressLabel: 'Detailed Address',
    actionsLabel: 'Actions',
    districtCol: 'District / Zone',

    // Dashboard
    searchPlaceholder: 'Search factory name, phone, road, industrial estate...',
    mapView: 'Live Radar',
    tableView: 'CRM Table',
    tableTitle: 'Verified Target Factory Directory (Pillar 1)',
    tableSub: '990+ target factories across 6 districts with live contact stages, direct company phone lines, and DBD corporate size check buttons.',
    allUnlockedBadge: 'Verified 100%',
    accessDatabaseText: 'Plastic injection molding & tooling factories in Samut Prakan',

    // Auth Modal
    authSignInTitle: 'Sign In to Account',
    authSignUpTitle: 'Create New Account',
    orUseEmail: 'or use your business email',
    fullNameLabel: 'Full Name / Contact:',
    fullNamePlaceholder: 'e.g. John Doe',
    companyNameLabel: 'Company / Organization:',
    companyNamePlaceholder: 'e.g. Acme Industrial Supply Co., Ltd.',
    emailInputLabel: 'Email Address:',
    passwordInputLabel: 'Password:',
    passwordPlaceholder: 'Minimum 6 characters',
    createAccountBtn: 'Create Account',

    // Footer
    footerCopy: '© 2026 RouteHunter • Sales Automation & Industrial Target Radar Platform',
  },

  zh: {
    // Brand & App
    appName: 'RouteHunter 猎途',
    appSubtitle: '企业销售智能与工厂雷达控制台 (降本增效・一键出海)',
    proWorkspace: '精准目标工厂库',
    appBadge: '全自动销售引擎',
    proMember: '认证销售代表',

    // Top Navbar
    signIn: '登录',
    signUp: '注册账号',
    signOut: '退出登录',
    goToDashboard: '进入控制台',
    dashboardMy: '进入我的目标雷达',
    freeTrialBtn: '免费试用',

    // Hero Section
    heroExecutiveTag: '降低多岗位用人成本 • 升级全自动化销售引擎',
    heroHeadline1: '节省多岗位员工薪资支出',
    heroHeadline2: '销售团队无需耗时制定路线',
    heroHeadline3: '专注于客户拜访与一键关单',
    heroSub: '四大智能系统合一：企业工商即时核验 + 随车动态GPS路线规划 + 覆盖6大行政区990+ 精准工厂线索库 + 移动端销售漏斗看板。告别传统繁琐规划与手工报表。',
    
    pillar1Title: '1. 企业工商与注册资本即时查询',
    pillar1Desc: '一键核验注册资本、法人及企业直通电话，无需雇佣数据专员搜索。',
    pillar2Title: '2. 智能随车导航与行程规划',
    pillar2Desc: '动态GPS自动测距，100%精准定位至工厂大门，每天节省3小时迷路时间。',
    pillar3Title: '3. 覆盖6大行政区 990+ 注塑工厂线索库',
    pillar3Desc: '全量覆盖北榄府6大工业行政区（Bang Phli、Bangpoo、Phra Pradaeng 等）990+ 目标企业，即开即拓。',
    pillar4Title: '4. 移动端销售跟进看板 (CRM)',
    pillar4Desc: '手机端一键切换跟进状态并记录破冰笔记，无需助理统计Excel表格。',

    unlockFreeTrialBtn: '免费试用 (解锁6大区域 990+ 工厂)',
    viewLiveRadarBtn: '查看实时雷达地图',
    enterCommandBtn: '进入目标控制中心',

    // ROI Section
    roiTag: '企业投资回报率 (Business ROI)',
    roiTitle: '年省数十万企业运营成本 • 销售业绩爆发式倍增',
    roiSub: '将传统盲目外勤销售升级为数字化智能雷达，即刻享受可见的降本增效收益。',
    
    roi1Val: '฿360,000+',
    roi1Unit: '/ 年',
    roi1Title: '节省数据专员与跟单助理薪资',
    roi1Desc: '无需聘请专人寻找工厂名单与电话，亦无需助理汇总整理拜访报表。',

    roi2Val: '66 小时',
    roi2Unit: '/ 人 / 月',
    roi2Title: '把黄金时间还给销售一线',
    roi2Desc: '每日节省3小时路线规划时间，每月可多触达拜访3倍以上精准目标企业。',

    roi3Val: '100% 精准',
    roi3Unit: '直达大门口',
    roi3Title: '降低燃油损耗与保安拒访率',
    roi3Desc: '大门级别GPS精准定位，下车前即已知晓企业规模与注册资本，成竹在胸。',

    compOldTitle: '传统拓客模式 (成本高昂且效率低下)',
    compOld1: '需设置多名岗位：搜集线索人员、电话核实人员与Excel统计助理。',
    compOld2: '每天耗费半天规划：在地图上来回盲测，不仅耗油更极易在园区迷路。',
    compOld3: '数据分散混乱：使用便签或微信群跟进，无法直观掌控客户所处阶段。',

    compRadarTitle: '使用 RouteHunter 猎途 (销售人员专注于出单)',
    compRadar1: '数据就绪：企业直通电话 + DBD注册资本全量准备就绪。',
    compRadar2: '随车GPS智能测距：自动筛选附近最近工厂并直导正门。',
    compRadar3: '移动端实时更新看板：已电联、已约见、已报价1秒完成标注。',

    radarTitle: '覆盖6大行政区 990+ 家工厂雷达控制中心 (即开即走)',
    screeningLabel: '数据核验：',
    gateVerifiedBadge: '大门核验 100%',

    // Zones & Territories
    zoneAll: '🌐 覆盖全府6大工业区 (990+ 家)',
    zoneBangPhli: '📍 邦披区 Bang Phli (384)',
    zoneKingKaew: '📍 金乔路-拉差贴瓦工业带 King Kaew',
    zoneBangpoo: '📍 邦普工业区-帕萨 Bangpoo (328)',
    zoneAsiaSuvarnabhumi: '📍 亚洲素万那普工业区',
    zoneBangSaoThong: '📍 邦韶通区 Bang Sao Thong (81)',
    zonePhraPradaeng: '📍 帕巴登区 Phra Pradaeng (114)',
    zoneSuksawat: '📍 苏克萨瓦工业带 Suksawat',
    zonePhraSamut: '📍 帕沙木则滴区 Phra Samut (115)',
    zoneBangBo: '📍 邦波区 Bang Bo (87)',
    zoneMueang: '📍 府治区 Mueang',
    allDistricts: '🏛️ 北榄府全部6大行政区 (990+ 家)',
    allSubdistricts: '🏘️ 所有乡镇/街道',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 我附近的工厂',
    nearMeAll: '🌐 全部距离',
    radius3km: '⚡ 3公里 (约5分钟)',
    radius5km: '🚗 5公里 (约10分钟)',
    radius10km: '🛣️ 10公里 (约20分钟)',
    radius20km: '📍 20公里 (全区域)',
    radiusLabel: '搜索半径:',
    closestFirst: '按距离最近排序',

    // Lead Status Tags (Pillar 1)
    statusAll: '📋 全部目标阶段',
    statusNew: '⚪ 新工厂 (New Lead)',
    statusContacted: '🟡 已电话联系 (Contacted)',
    statusMeeting: '🟣 已约面谈拜访 (Meeting Scheduled)',
    statusQuoted: '🔵 已出具报价 (Quoted)',
    statusWon: '🏆 正式客户 / 成交 (Customer / Won)',
    statusLost: '🔴 暂无意向 / 拒绝',
    statusLabel: '状态标签 (Status Tag):',
    notePlaceholder: '记录破冰跟进情报 (如：负责人张经理，工厂配有12台注塑机)...',
    savedNoteLabel: '最新情报:',
    saveStatusBtn: '保存状态',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact (企业工商速览)',
    checkDbdBtn: '🔍 查询注册资本与法定代表人 (DBD Dataforthai)',
    directLine: '企业直通电话',

    // Map Section
    mapCommandCenter: '工业目标工厂精准雷达控制中心',
    mapSubheading: '大门级别GPS精准定位，点击图钉即可拨打企业直通电话与核验工商。',
    displaying: '显示目标:',
    factoriesUnit: '家工厂',
    pinsUnit: '个图钉',
    liveGpsActive: '🟢 动态GPS：已开启',
    liveGpsInactive: '⚪ 开启动态GPS',
    liveGpsCar: '🟢 动态GPS随车导航中',
    yourGpsLocation: '您的当前GPS位置',
    zoomLocation: '定位我',
    centerMap: '居中地图',

    // Popup & Bottom Sheet
    guestLockedTitle: '注塑与模具制造工厂',
    guestLockedDesc: '大门精准GPS定位、企业直通电话与工商企业数据。',
    unlockThisFactoryBtn: '🔓 查看该工厂详情',
    distanceAway: '距您约 ~',
    drivingTime: '车程约 ~',
    minutesUnit: '分钟',
    callNow: '拨打企业直通电话',
    navigateGoogle: '谷歌大门导航',
    visitWebsite: '访问官网',
    noPhone: '暂无电话',
    phoneLabel: '企业直通电话',
    emailLabel: '电子邮箱',
    addressLabel: '详细地址',
    actionsLabel: '快捷操作',
    districtCol: '行政区 / 工业带',

    // Dashboard
    searchPlaceholder: '搜索工厂名称、电话、道路、工业园区...',
    mapView: '实时雷达',
    tableView: '客户线索表',
    tableTitle: '第一支柱：精准目标工厂库 (Verified Target Catalog)',
    tableSub: '覆盖6大行政区 990+ 家注塑工厂库，集成跟进状态、企业直通电话与工商注册资本核查。',
    allUnlockedBadge: '100% 完整权限',
    accessDatabaseText: '已授权访问北榄府注塑与机械制造工厂全量数据',

    // Auth Modal
    authSignInTitle: '登录账号 (Sign In)',
    authSignUpTitle: '注册新账号 (Sign Up)',
    orUseEmail: '或使用您的企业邮箱',
    fullNameLabel: '联系人姓名:',
    fullNamePlaceholder: '例如：张伟 / Alex',
    companyNameLabel: '您的公司 / 企业全称:',
    companyNamePlaceholder: '例如：暹罗工业设备有限公司',
    emailInputLabel: '电子邮箱:',
    passwordInputLabel: '设置密码:',
    passwordPlaceholder: '至少 6 位字符',
    createAccountBtn: '创建新账户',

    // Footer
    footerCopy: '© 2026 RouteHunter 猎途 • 全自动销售引擎与工业目标雷达控制中心',
  },
};
