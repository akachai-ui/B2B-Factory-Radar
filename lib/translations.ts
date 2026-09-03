export type Language = 'th' | 'en' | 'zh';

export const translations: Record<Language, Record<string, string>> = {
  th: {
    // Brand & App
    appName: 'B2B Factory Radar',
    appSubtitle: 'เสาหลักที่ 1: Verified Lead Intelligence (คลังเป้าหมายโรงงานพร้อมเจาะ)',
    proWorkspace: 'VERIFIED LEADS',
    appBadge: 'Pillar 1',
    proMember: 'Verified Sales Rep',

    // Top Navbar
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    goToDashboard: '🚀 ไปยังศูนย์บัญชาการเป้าหมาย',
    dashboardMy: 'เข้าสู่ Dashboard เป้าหมาย',

    // Hero Section
    heroBadge: 'เสาหลักที่ 1: Verified Lead Intelligence (คลังเป้าหมายโรงงานพร้อมเจาะ)',
    heroTitlePrefix: 'คลังเป้าหมายโรงงานฉีดพลาสติก & การผลิต',
    heroTitleSuffix: '+ แห่ง พร้อมเจาะทันที',
    heroTitleTime: 'เปิดจอแล้ววิ่งได้เลย',
    heroSubtitle: 'ฐานข้อมูลโรงงานฉีดพลาสติก 1,000+ แห่ง พร้อมพิกัด GPS แม่นยำตรงประตูทางเข้า, เบอร์ตรงต่อสายฝ่ายจัดซื้อ/วิศวกรรม, ระบบคัดกรองโซน และ Company Quick Fact เช็กทุนจดทะเบียนประเมินไซส์โรงงาน',
    heroExploreBtn: '🚀 สำรวจเป้าหมายโรงงานสด',
    heroUnlockBtn: '🔓 เปิดใช้งานระบบเต็มรูปแบบ',
    heroGoDashboardBtn: '🚀 เข้าสู่ศูนย์บัญชาการเป้าหมาย (Dashboard)',

    // Zones & Territories
    zoneAll: '🌐 ทุกโซน / ทุกพื้นที่ (1,000+ แห่ง)',
    zoneBangPhli: '📍 โซนบางพลี - กิ่งแก้ว (384 แห่ง)',
    zoneBangpoo: '📍 โซนนิคมฯ บางปู - แพรกษา (328 แห่ง)',
    zoneAsiaSuvarnabhumi: '📍 โซนนิคมฯ เอเชียสุวรรณภูมิ',
    zoneBangSaoThong: '📍 โซนบางเสาธง (81 แห่ง)',
    zonePhraPradaeng: '📍 โซนพระประแดง - สุขสวัสดิ์ (114 แห่ง)',
    zonePhraSamut: '📍 โซนพระสมุทรเจดีย์ (115 แห่ง)',
    zoneBangBo: '📍 โซนบางบ่อ (87 แห่ง)',
    zoneMueang: '📍 โซนเมืองสมุทรปราการ',
    allDistricts: '🏛️ ทุกอำเภอ (1,000+ แห่ง)',
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
    notePlaceholder: 'บันทึกข้อมูลช่วยเปิดบทสนทนา (เช่น คุยกับจัดซื้อคุณสมศักดิ์, โรงงานมี 12 เครื่องฉีด)...',
    savedNoteLabel: 'โน้ตล่าสุด:',
    saveStatusBtn: 'บันทึกสถานะ',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact (ข้อมูลเสริมช่วยเปิดบทสนทนา)',
    checkDbdBtn: '🔍 ตรวจสอบทุนจดทะเบียน & นิติบุคคล (DBD Dataforthai)',
    checkCredenBtn: '📊 วิเคราะห์งบการเงิน & ไซส์บริษัท (Creden Data)',
    directLine: 'ต่อสายตรงฝ่ายจัดซื้อ / วิศวกรรม',

    // Map Section
    mapCommandCenter: 'ศูนย์บัญชาการพิกัดโรงงานพร้อมเจาะ',
    mapSubheading: 'พิกัด GPS แม่นยำตรงประตูทางเข้า แตะที่หมุดเพื่อดูเบอร์จัดซื้อและ Quick Fact',
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
    callNow: 'โทรต่อสายฝ่ายจัดซื้อ',
    navigateGoogle: 'นำทาง Google Maps',
    visitWebsite: 'เปิดดูเว็บไซต์บริษัท',
    noPhone: 'ไม่มีเบอร์โทร',
    phoneLabel: 'เบอร์โทรศัพท์ (เบอร์ต่อจัดซื้อ/วิศวกรรม)',
    emailLabel: 'อีเมล',
    addressLabel: 'ที่อยู่ละเอียด',
    actionsLabel: 'แอ็กชัน',
    districtCol: 'พื้นที่ / โซนอุตสาหกรรม',

    // Dashboard
    searchPlaceholder: 'ค้นหาชื่อโรงงาน, เบอร์, ถนน, โซนนิคมฯ...',
    mapView: 'แผนที่สด',
    tableView: 'ตารางรายชื่อ',
    tableTitle: 'คลังเป้าหมายโรงงานพร้อมเจาะ (Verified Leads Directory)',
    tableSub: 'รายชื่อโรงงาน 1,089 แห่ง พร้อมสถานะติดตามงาน เบอร์ต่อสายจัดซื้อ และปุ่มเช็กข้อมูลนิติบุคคล',
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
    footerCopy: '© 2026 B2B Factory Radar • เสาหลักที่ 1: Verified Lead Intelligence Platform',
  },

  en: {
    // Brand & App
    appName: 'B2B Factory Radar',
    appSubtitle: 'Pillar 1: Verified Lead Intelligence (Target Industrial Factory Catalog)',
    proWorkspace: 'VERIFIED LEADS',
    appBadge: 'Pillar 1',
    proMember: 'Verified Sales Rep',

    // Top Navbar
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    goToDashboard: '🚀 Go to Radar Dashboard',
    dashboardMy: 'Enter My Target Radar',

    // Hero Section
    heroBadge: 'Pillar 1: Verified Lead Intelligence',
    heroTitlePrefix: 'Target Plastic Injection & Manufacturing Factories',
    heroTitleSuffix: '+ Ready to Pitch',
    heroTitleTime: 'Zero Guesswork',
    heroSubtitle: 'Comprehensive database of 1,089+ plastic injection factories with entrance GPS coords, direct procurement/engineering phone numbers, smart zone filters, and Company Quick Facts for instant corporate size assessment.',
    heroExploreBtn: '🚀 Explore Live Factory Radar',
    heroUnlockBtn: '🔓 Access Full Intelligence',
    heroGoDashboardBtn: '🚀 Enter Radar Dashboard',

    // Zones & Territories
    zoneAll: '🌐 All Industrial Zones (1,089)',
    zoneBangPhli: '📍 Bang Phli Zone (384)',
    zoneKingKaew: '📍 King Kaew - Racha Thewa Zone',
    zoneBangpoo: '📍 Bangpoo Industrial Estate Zone (328)',
    zoneAsiaSuvarnabhumi: '📍 Asia Suvarnabhumi Estate Zone',
    zoneBangSaoThong: '📍 Bang Sao Thong Zone (81)',
    zonePhraPradaeng: '📍 Phra Pradaeng Zone (114)',
    zoneSuksawat: '📍 Suksawat Road Zone',
    zonePhraSamut: '📍 Phra Samut Chedi Zone (115)',
    zoneBangBo: '📍 Bang Bo Zone (87)',
    zoneMueang: '📍 Mueang Samut Prakan Zone',
    allDistricts: '🏛️ All Districts (1,089)',
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
    notePlaceholder: 'Add conversational intelligence notes (e.g. procurement contact name, 12 injection machines)...',
    savedNoteLabel: 'Latest Note:',
    saveStatusBtn: 'Save Status',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact & Intelligence',
    checkDbdBtn: '🔍 Check Registered Capital & DBD Info (Dataforthai)',
    checkCredenBtn: '📊 Company Size & Financials (Creden Data)',
    directLine: 'Direct line to Procurement / Engineering',

    // Map Section
    mapCommandCenter: 'Target Factory Radar Command Center',
    mapSubheading: 'Accurate entrance GPS pins. Tap any pin for direct phone numbers and Company Quick Facts.',
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
    guestLockedDesc: 'Accurate entrance GPS coords with direct phone numbers and company facts.',
    unlockThisFactoryBtn: '🔓 View Target Details',
    distanceAway: 'Distance from you ~',
    drivingTime: 'Drive ~',
    minutesUnit: 'min',
    callNow: 'Call Procurement Line',
    navigateGoogle: 'Navigate Google Maps',
    visitWebsite: 'Visit Website',
    noPhone: 'No Phone',
    phoneLabel: 'Phone Number (Procurement / Engineering)',
    emailLabel: 'Email',
    addressLabel: 'Detailed Address',
    actionsLabel: 'Actions',
    districtCol: 'District / Zone',

    // Dashboard
    searchPlaceholder: 'Search factory name, phone, road, industrial estate...',
    mapView: 'Live Radar',
    tableView: 'CRM Table',
    tableTitle: 'Verified Target Factory Directory (Pillar 1)',
    tableSub: '1,089 target factories with live contact stages, direct phone lines, and DBD corporate size check buttons.',
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
    footerCopy: '© 2026 B2B Factory Radar • Pillar 1: Verified Lead Intelligence Platform',
  },

  zh: {
    // Brand & App
    appName: 'B2B 工厂雷达',
    appSubtitle: '第一支柱：Verified Lead Intelligence (精准注塑目标工厂库)',
    proWorkspace: '精准目标工厂库',
    appBadge: '第一支柱',
    proMember: '认证销售代表',

    // Top Navbar
    signIn: '登录',
    signUp: '注册账号',
    signOut: '退出登录',
    goToDashboard: '🚀 进入雷达控制台',
    dashboardMy: '进入我的目标雷达',

    // Hero Section
    heroBadge: '第一支柱：Verified Lead Intelligence (精准目标工厂库)',
    heroTitlePrefix: '北榄府 1,089+ 家注塑与制造目标工厂',
    heroTitleSuffix: '一键触达',
    heroTitleTime: '开屏即跑',
    heroSubtitle: '精准大门GPS定位、直通采购/工程部电话、智能园区筛选及企业工商注册资本一键核验。',
    heroExploreBtn: '🚀 立即探索实时雷达',
    heroUnlockBtn: '🔓 开启全量数据',
    heroGoDashboardBtn: '🚀 进入雷达控制台 (Dashboard)',

    // Zones & Territories
    zoneAll: '🌐 全部工业区域 (1,089 家)',
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
    allDistricts: '🏛️ 所有行政区 (1,089 家)',
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
    notePlaceholder: '记录破冰跟进情报 (如：采购负责人张经理，工厂配有12台注塑机)...',
    savedNoteLabel: '最新情报:',
    saveStatusBtn: '保存状态',

    // Company Quick Fact
    quickFactTitle: '🏢 Company Quick Fact (企业工商速览)',
    checkDbdBtn: '🔍 查询注册资本与法定代表人 (DBD Dataforthai)',
    checkCredenBtn: '📊 评估企业规模与财务 (Creden Data)',
    directLine: '直通采购部 / 工程技术部',

    // Map Section
    mapCommandCenter: '工业目标工厂精准雷达控制中心',
    mapSubheading: '大门级别GPS精准定位，点击图钉即可拨打采购电话与核验工商。',
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
    guestLockedDesc: '大门精准GPS定位、采购直通电话与工商企业数据。',
    unlockThisFactoryBtn: '🔓 查看该工厂详情',
    distanceAway: '距您约 ~',
    drivingTime: '车程约 ~',
    minutesUnit: '分钟',
    callNow: '拨打采购部电话',
    navigateGoogle: '谷歌大门导航',
    visitWebsite: '访问官网',
    noPhone: '暂无电话',
    phoneLabel: '电话号码 (采购部 / 工程部)',
    emailLabel: '电子邮箱',
    addressLabel: '详细地址',
    actionsLabel: '快捷操作',
    districtCol: '行政区 / 工业带',

    // Dashboard
    searchPlaceholder: '搜索工厂名称、电话、道路、工业园区...',
    mapView: '实时雷达',
    tableView: '客户线索表',
    tableTitle: '第一支柱：精准目标工厂库 (Verified Target Catalog)',
    tableSub: '1,089 家注塑工厂库，集成跟进状态、直通采购电话与工商注册资本核查。',
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
    footerCopy: '© 2026 B2B Factory Radar • 第一支柱：Verified Lead Intelligence Platform',
  },
};
