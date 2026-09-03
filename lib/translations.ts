export type Language = 'th' | 'en' | 'zh';

export const translations: Record<Language, Record<string, string>> = {
  th: {
    // Brand & App
    appName: 'B2B Factory Radar',
    appSubtitle: 'แพลตฟอร์มค้นหาพิกัดและ Lead โรงงานอุตสาหกรรม',
    proWorkspace: 'PRO WORKSPACE',
    testPro: 'TEST PRO',
    appBadge: 'APP',
    proMember: 'สมาชิก PRO',

    // Top Navbar
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    goToDashboard: '🚀 ไปยัง Dashboard',
    dashboardMy: 'เข้าสู่ Dashboard ของฉัน',

    // Hero Section
    heroBadge: 'ฐานข้อมูล Lead โรงงานอุตสาหกรรมอันดับ 1 สมุทรปราการ',
    heroTitlePrefix: 'ค้นพบโรงงานอุตสาหกรรมเป้าหมาย',
    heroTitleSuffix: '+ แห่งรอบตัวคุณ',
    heroTitleTime: 'ใน 1 วินาที',
    heroSubtitle: 'แพลตฟอร์มค้นหา Lead ฝ่ายขาย B2B พร้อมพิกัด GPS แม่นยำ, เบอร์โทรตรงฝ่ายจัดซื้อ, และระบบ Live GPS คำนวณระยะทางแบบ Real-time',
    heroExploreBtn: '🚀 ทดลองสำรวจแผนที่ฟรี',
    heroUnlockBtn: '🔓 สมัครสมาชิกเพื่อปลดล็อกเบอร์โทร',
    heroGoDashboardBtn: '🚀 เข้าสู่ Dashboard ของฉัน (PRO)',

    // Portfolio Feature
    allFactoriesTab: '🌐 โรงงานทั้งหมด',
    myPortfolioTab: '📁 พอร์ตลูกค้าของฉัน',
    addToPortfolio: '🛒 + เพิ่มเข้าพอร์ตของฉัน',
    inPortfolio: '⭐ อยู่ในพอร์ตแล้ว',
    removeFromPortfolio: 'นำออกจากพอร์ต',
    portfolioBadge: 'พอร์ตส่วนตัว',
    emptyPortfolioTitle: 'ยังไม่มีโรงงานในพอร์ตลูกค้าของคุณ',
    emptyPortfolioDesc: 'กดปุ่ม [ 🛒 + เพิ่มเข้าพอร์ต ] ที่โรงงานบนแผนที่ เพื่อเริ่มติดตามงานขายและบันทึกสถานะ',
    addedSuccess: 'เพิ่มเข้าพอร์ตลูกค้าสำเร็จ!',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 บริษัทใกล้ฉัน',
    nearMeAll: '🌐 ทุกระยะทาง',
    radius3km: '⚡ 3 กม. (~5 นาที)',
    radius5km: '🚗 5 กม. (~10 นาที)',
    radius10km: '🛣️ 10 กม. (~20 นาที)',
    radius20km: '📍 20 กม. (ทั้งโซน)',
    radiusLabel: 'รัศมี:',
    closestFirst: 'เรียงตามระยะทางใกล้สุด',

    // Lead Statuses
    statusAll: '📋 ทุกสถานะในพอร์ต',
    statusNew: '⚪ ยังไม่ได้ติดต่อ',
    statusContacted: '🟡 ติดต่อแล้ว / เสนอราคา',
    statusMeeting: '🟣 นัดเข้าพบ / ดูหน้างาน',
    statusWon: '🟢 ปิดการขายสำเร็จ (ลูกค้า)',
    statusLost: '🔴 ยังไม่สนใจ / ปฏิเสธ',
    statusLabel: 'สถานะการติดต่อ:',
    notePlaceholder: 'บันทึกความคืบหน้า (เช่น คุยกับจัดซื้อ, นัดส่งราคา)...',
    savedNoteLabel: 'โน้ตล่าสุด:',
    saveStatusBtn: 'บันทึกสถานะ',

    // Map Section
    mapCommandCenter: 'ศูนย์บัญชาการแผนที่พิกัดโรงงานสด',
    mapSubheading: 'แตะที่หมุดเพื่อดูข้อมูลติดต่อและระยะทางจริงจากจุดที่คุณอยู่',
    displaying: 'แสดงผล:',
    factoriesUnit: 'โรงงาน',
    pinsUnit: 'หมุด',
    liveGpsActive: '🟢 Live GPS: เปิดอยู่',
    liveGpsInactive: '⚪ เปิด Live GPS',
    liveGpsCar: '🟢 Live GPS เคลื่อนที่ตามรถ',
    yourGpsLocation: 'พิกัด GPS ของคุณ',
    allDistricts: '🏛️ ทุกอำเภอ (1,089 แห่ง)',
    allSubdistricts: '🏘️ ทุกตำบล',
    zoomLocation: 'ซูมพิกัด',
    centerMap: 'จัดกึ่งกลางแผนที่',

    // Districts
    districtBangPhli: 'อำเภอบางพลี (384)',
    districtMueang: 'เมือง/บางปู (328)',
    districtPhraSamut: 'พระสมุทรเจดีย์ (115)',
    districtPhraPradaeng: 'พระประแดง (114)',
    districtBangBo: 'อำเภอบางบ่อ (87)',
    districtBangSaoThong: 'อำเภอบางเสาธง (81)',
    districtOther: 'ปริมณฑล & ใกล้เคียง',

    // Guest Lock Banner
    guestBannerTitle: 'โหมดดูพิกัดหมุด (Guest Mode)',
    guestBannerDesc: 'สมัครสมาชิกฟรีเพื่อปลดล็อกรายชื่อ, เบอร์โทร, และที่อยู่โรงงาน 1,089 แห่ง',
    unlockFreeBtn: 'ปลดล็อกข้อมูลฟรี',
    lockedDataBadge: '🔒 ล็อกข้อมูล (ดูได้เฉพาะหมุด)',
    unlockedBadge: '✓ ปลดล็อกข้อมูลครบแล้ว',

    // Popup & Bottom Sheet
    guestLockedTitle: 'โรงงานอุตสาหกรรม',
    guestLockedDesc: 'ชื่อโรงงาน, เบอร์โทรตรงฝ่ายจัดซื้อ และที่อยู่ถูกล็อกไว้',
    unlockThisFactoryBtn: '🔓 ปลดล็อกดูข้อมูลโรงงานนี้ฟรี',
    distanceAway: 'ห่างจากคุณ ~',
    drivingTime: 'ขับรถ ~',
    minutesUnit: 'นาที',
    callNow: 'โทรออกทันที',
    navigateGoogle: 'นำทาง Google',
    visitWebsite: 'เปิดดูเว็บไซต์บริษัท',
    noPhone: 'ไม่มีเบอร์โทร',
    phoneLabel: 'เบอร์โทรศัพท์',
    emailLabel: 'อีเมล',
    addressLabel: 'ที่อยู่',
    actionsLabel: 'แอ็กชัน',
    districtCol: 'อำเภอ / ตำบล',

    // Dashboard
    searchPlaceholder: 'ค้นหาชื่อโรงงาน, เบอร์, ถนน...',
    mapView: 'แผนที่สด',
    tableView: 'ตาราง CRM',
    tableTitle: 'ตารางรายชื่อโรงงาน & สถานะติดตามงาน',
    tableSub: 'บันทึกสถานะการติดต่อ จัดกลุ่มลูกค้า และกดโทรออกได้ทันที',
    allUnlockedBadge: 'ปลดล็อกครบ 100%',
    accessDatabaseText: 'เข้าถึงฐานข้อมูลโรงงานฉีดพลาสติก & การผลิต สมุทรปราการ',

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
    footerCopy: '© 2026 B2B Industrial Intelligence Platform • All Rights Reserved.',
  },

  en: {
    // Brand & App
    appName: 'B2B Factory Radar',
    appSubtitle: 'Industrial Factory Leads & Territory Intelligence Platform',
    proWorkspace: 'PRO WORKSPACE',
    testPro: 'TEST PRO',
    appBadge: 'APP',
    proMember: 'PRO MEMBER',

    // Top Navbar
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    goToDashboard: '🚀 Go to Dashboard',
    dashboardMy: 'Enter My Dashboard',

    // Hero Section
    heroBadge: '#1 Industrial Factory Lead Database in Samut Prakan',
    heroTitlePrefix: 'Discover Target Industrial Factories',
    heroTitleSuffix: '+ Near You',
    heroTitleTime: 'in 1 Second',
    heroSubtitle: 'B2B sales lead platform with 100% accurate GPS, 92.3% verified direct phone numbers, emails, and real-time live GPS distance tracking.',
    heroExploreBtn: '🚀 Explore Map Free',
    heroUnlockBtn: '🔓 Sign Up to Unlock Contacts',
    heroGoDashboardBtn: '🚀 Enter My Dashboard (PRO)',

    // Portfolio Feature
    allFactoriesTab: '🌐 All Factories',
    myPortfolioTab: '📁 My Portfolio',
    addToPortfolio: '🛒 + Add to My Portfolio',
    inPortfolio: '⭐ In Portfolio',
    removeFromPortfolio: 'Remove from Portfolio',
    portfolioBadge: 'Personal Portfolio',
    emptyPortfolioTitle: 'No factories in your portfolio yet',
    emptyPortfolioDesc: 'Click [+ Add to Portfolio] on any factory to start tracking deals and sales stages.',
    addedSuccess: 'Added to your portfolio successfully!',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 Factories Near Me',
    nearMeAll: '🌐 All Distances',
    radius3km: '⚡ 3 km (~5 min)',
    radius5km: '🚗 5 km (~10 min)',
    radius10km: '🛣️ 10 km (~20 min)',
    radius20km: '📍 20 km (Zone)',
    radiusLabel: 'Radius:',
    closestFirst: 'Sort by Closest Distance',

    // Lead Statuses
    statusAll: '📋 All Portfolio Stages',
    statusNew: '⚪ Untouched (New)',
    statusContacted: '🟡 Contacted / Quoted',
    statusMeeting: '🟣 Meeting Scheduled',
    statusWon: '🟢 Won (Customer)',
    statusLost: '🔴 Not Interested',
    statusLabel: 'Sales Stage:',
    notePlaceholder: 'Add meeting or call notes here...',
    savedNoteLabel: 'Latest Note:',
    saveStatusBtn: 'Save Status',

    // Map Section
    mapCommandCenter: 'Live Factory Intelligence Radar',
    mapSubheading: 'Tap any factory pin to view verified contact details, direct phones, and real-time driving distance.',
    displaying: 'Showing:',
    factoriesUnit: 'Factories',
    pinsUnit: 'Pins',
    liveGpsActive: '🟢 Live GPS: ON',
    liveGpsInactive: '⚪ Enable Live GPS',
    liveGpsCar: '🟢 Live GPS Following Vehicle',
    yourGpsLocation: 'Your GPS Location',
    allDistricts: '🏛️ All Districts (1,089)',
    allSubdistricts: '🏘️ All Subdistricts',
    zoomLocation: 'Zoom Me',
    centerMap: 'Center Map',

    // Districts
    districtBangPhli: 'Bang Phli (384)',
    districtMueang: 'Mueang / Bangpoo (328)',
    districtPhraSamut: 'Phra Samut Chedi (115)',
    districtPhraPradaeng: 'Phra Pradaeng (114)',
    districtBangBo: 'Bang Bo (87)',
    districtBangSaoThong: 'Bang Sao Thong (81)',
    districtOther: 'Vicinity & Nearby',

    // Guest Lock Banner
    guestBannerTitle: 'Preview Mode (Guest)',
    guestBannerDesc: 'Sign up free to unlock factory names, direct phone numbers, and addresses for all 1,089 factories.',
    unlockFreeBtn: 'Unlock All Data Free',
    lockedDataBadge: '🔒 Data Locked (Pins Only)',
    unlockedBadge: '✓ 100% Data Unlocked',

    // Popup & Bottom Sheet
    guestLockedTitle: 'Manufacturing Factory',
    guestLockedDesc: 'Factory name, direct buyer phone number, and street address are locked.',
    unlockThisFactoryBtn: '🔓 Unlock This Factory Info Free',
    distanceAway: 'Distance from you ~',
    drivingTime: 'Drive ~',
    minutesUnit: 'min',
    callNow: 'Call Now',
    navigateGoogle: 'Navigate Google Maps',
    visitWebsite: 'Visit Website',
    noPhone: 'No Phone',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email',
    addressLabel: 'Address',
    actionsLabel: 'Actions',
    districtCol: 'District / Subdistrict',

    // Dashboard
    searchPlaceholder: 'Search factory name, phone, road...',
    mapView: 'Live Map',
    tableView: 'CRM Table',
    tableTitle: 'Factory Leads Directory & Pipeline',
    tableSub: 'Track contact stages, add call notes, and call procurement directly.',
    allUnlockedBadge: '100% Full Access',
    accessDatabaseText: 'Full access to plastic injection molding & machinery factory leads in Samut Prakan',

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
    footerCopy: '© 2026 B2B Industrial Intelligence Platform • All Rights Reserved.',
  },

  zh: {
    // Brand & App
    appName: 'B2B 工厂雷达',
    appSubtitle: '泰国工业制造与潜客工厂智能地图平台',
    proWorkspace: '专业工作台',
    testPro: '测试专业版',
    appBadge: '应用',
    proMember: '专业版会员',

    // Top Navbar
    signIn: '登录',
    signUp: '注册账号',
    signOut: '退出登录',
    goToDashboard: '🚀 进入工作台',
    dashboardMy: '进入我的控制台',

    // Hero Section
    heroBadge: '北榄府（Samut Prakan）排名第一的工业工厂数据库',
    heroTitlePrefix: '一秒定位您周边的',
    heroTitleSuffix: '+ 目标工业制造工厂',
    heroTitleTime: '即刻开拓',
    heroSubtitle: '专为B2B销售打造：精准GPS定位、92.3%采购直通电话、邮箱联系方式，配合实时动态GPS距离计算。',
    heroExploreBtn: '🚀 免费体验实时地图',
    heroUnlockBtn: '🔓 免费注册解锁全部电话',
    heroGoDashboardBtn: '🚀 进入专业控制台 (PRO)',

    // Portfolio Feature
    allFactoriesTab: '🌐 全部工厂',
    myPortfolioTab: '📁 我的客户库 (พอร์ต)',
    addToPortfolio: '🛒 + 加入我的客户库',
    inPortfolio: '⭐ 已在客户库',
    removeFromPortfolio: '移出客户库',
    portfolioBadge: '私有客户库',
    emptyPortfolioTitle: '客户库暂无工厂',
    emptyPortfolioDesc: '在地图或列表中点击 [+ 加入我的客户库] 即可开始跟进跟单与记录状态。',
    addedSuccess: '已成功加入您的客户库！',

    // Near Me & Radius Filter
    nearMeBtn: '🎯 我附近的工厂',
    nearMeAll: '🌐 全部距离',
    radius3km: '⚡ 3公里 (约5分钟)',
    radius5km: '🚗 5公里 (约10分钟)',
    radius10km: '🛣️ 10公里 (约20分钟)',
    radius20km: '📍 20公里 (全区域)',
    radiusLabel: '搜索半径:',
    closestFirst: '按距离最近排序',

    // Lead Statuses
    statusAll: '📋 客户库全部阶段',
    statusNew: '⚪ 待联系 (新线索)',
    statusContacted: '🟡 已联系 / 已报价',
    statusMeeting: '🟣 已预约面谈 / 拜访',
    statusWon: '🟢 已成交 (已转客户)',
    statusLost: '🔴 暂无意向 / 拒绝',
    statusLabel: '跟进阶段:',
    notePlaceholder: '添加跟进备注 (如：已联系采购王经理)...',
    savedNoteLabel: '最新备注:',
    saveStatusBtn: '保存状态',

    // Map Section
    mapCommandCenter: '工业工厂实时雷达控制中心',
    mapSubheading: '点击任何工厂图钉，即可查看直通电话、详细地址并计算实时行驶距离。',
    displaying: '正在显示:',
    factoriesUnit: '家工厂',
    pinsUnit: '个图钉',
    liveGpsActive: '🟢 动态GPS：已开启',
    liveGpsInactive: '⚪ 开启动态GPS',
    liveGpsCar: '🟢 动态GPS随车导航中',
    yourGpsLocation: '您的当前GPS位置',
    allDistricts: '🏛️ 所有行政区 (1,089 家)',
    allSubdistricts: '🏘️ 所有乡镇/街道',
    zoomLocation: '定位我',
    centerMap: '居中地图',

    // Districts
    districtBangPhli: '邦披区 Bang Phli (384)',
    districtMueang: '府治区/邦普工业区 (328)',
    districtPhraSamut: '帕沙木则滴区 (115)',
    districtPhraPradaeng: '帕巴登区 (114)',
    districtBangBo: '邦波区 (87)',
    districtBangSaoThong: '邦韶通区 (81)',
    districtOther: '周边及临近工业区',

    // Guest Lock Banner
    guestBannerTitle: '访客预览模式 (Guest Mode)',
    guestBannerDesc: '免费注册即可解锁北榄府全部 1,089 家工厂的真实名称、采购直通电话及详细地址。',
    unlockFreeBtn: '免费解锁全部数据',
    lockedDataBadge: '🔒 数据已锁定 (仅预览图钉)',
    unlockedBadge: '✓ 已解锁100%全部数据',

    // Popup & Bottom Sheet
    guestLockedTitle: '工业制造工厂',
    guestLockedDesc: '工厂全称、采购部直通电话及详细门牌已被隐藏。',
    unlockThisFactoryBtn: '🔓 免费解锁此工厂信息',
    distanceAway: '距您约 ~',
    drivingTime: '车程约 ~',
    minutesUnit: '分钟',
    callNow: '一键拨号',
    navigateGoogle: '谷歌导航',
    visitWebsite: '访问官网',
    noPhone: '暂无电话',
    phoneLabel: '电话号码',
    emailLabel: '电子邮箱',
    addressLabel: '工厂地址',
    actionsLabel: '快捷操作',
    districtCol: '行政区 / 街道',

    // Dashboard
    searchPlaceholder: '搜索工厂名称、电话、道路...',
    mapView: '实时地图',
    tableView: 'CRM 数据表',
    tableTitle: '客户通讯录与跟进漏斗',
    tableSub: '标记拜访阶段，记录沟通纪要，一键拨打采购电话。',
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
    footerCopy: '© 2026 B2B Industrial Intelligence Platform • 版权所有',
  },
};
