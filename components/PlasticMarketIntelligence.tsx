'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Building2,
  DollarSign,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Info,
  ExternalLink,
  Zap,
  Target,
  Users,
  Compass,
  ArrowRight,
  Package,
  Car,
  Cpu,
  Home,
  Wrench,
  Flame,
  Award,
  CircleDollarSign,
  Fuel,
  Coins,
  Gauge,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Check,
  Copy,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Radio,
  FileCheck,
  BookOpen,
} from 'lucide-react';

interface MacroApiResponse {
  timestamp: string;
  isLive: boolean;
  cached?: boolean;
  usdThb: {
    rate: number;
    change24h: number;
    changePct24h: number;
    lastUpdated: string;
    source: string;
  };
  brentOil: {
    priceUsd: number;
    change24h: number;
    changePct24h: number;
    unit: string;
    lastUpdated: string;
    source: string;
  };
  wtiOil: {
    priceUsd: number;
    change24h: number;
    changePct24h: number;
    unit: string;
    lastUpdated: string;
    source: string;
  };
  naphthaCfrJapan: {
    priceUsd: number;
    change24h: number;
    changePct24h: number;
    unit: string;
    source: string;
  };
  resinForecast: {
    trendDirection: 'bullish' | 'bearish' | 'neutral';
    trendLabelTh: string;
    expectedShiftThbPerTon: string;
    reasonTh: string;
  };
  domesticResinEstimates: {
    peFilmThbPerKg: number;
    peFilmThbPerTon: number;
    ppHomoThbPerKg: number;
    ppHomoThbPerTon: number;
    absInjectionThbPerKg: number;
    absInjectionThbPerTon: number;
    pvcPipeThbPerKg: number;
    pvcPipeThbPerTon: number;
  };
  sourcesAttribution: {
    category: string;
    provider: string;
    type: string;
    citation: string;
  }[];
}

export function PlasticMarketIntelligence() {
  const [selectedResinTab, setSelectedResinTab] = useState<'all' | 'commodity' | 'engineering' | 'recycled'>('all');
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [mobileSection, setMobileSection] = useState<'all' | 'macro' | 'simulator' | 'segments' | 'resins' | 'districts' | 'roi'>('all');

  // Live Macro API State
  const [macroData, setMacroData] = useState<MacroApiResponse | null>(null);
  const [isLoadingMacro, setIsLoadingMacro] = useState<boolean>(false);
  const [macroError, setMacroError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Macro Interactive Simulator State
  const [simUsdRate, setSimUsdRate] = useState<number>(34.85);
  const [simOilPrice, setSimOilPrice] = useState<number>(78.50);

  // Fetch Macro Data from Live API
  const fetchMacroData = useCallback(async (forceRefresh = false) => {
    setIsLoadingMacro(true);
    setMacroError(null);
    try {
      const url = forceRefresh ? '/api/market/macro?refresh=true' : '/api/market/macro';
      const res = await fetch(url);
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลดัชนีราคาได้');
      const data: MacroApiResponse = await res.json();
      setMacroData(data);
      setLastRefreshedAt(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
      
      if (data.usdThb?.rate) setSimUsdRate(data.usdThb.rate);
      if (data.brentOil?.priceUsd) setSimOilPrice(data.brentOil.priceUsd);
    } catch (err: any) {
      setMacroError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล Real-time');
    } finally {
      setIsLoadingMacro(false);
    }
  }, []);

  useEffect(() => {
    fetchMacroData(false);
  }, [fetchMacroData]);

  // Calculate simulated resin price based on Oil and FX Rate
  const baseResinUsd = 1000 + (simOilPrice - 70) * 8.5;
  const simResinThbPerKg = (baseResinUsd * simUsdRate / 1000) + 5.5;
  const simPePricePerTon = simResinThbPerKg * 1000;
  const simPpPricePerTon = (simResinThbPerKg - 1.2) * 1000;
  const simAbsPricePerTon = (simResinThbPerKg * 1.45) * 1000;

  const handleResetSimulatorToLive = () => {
    if (macroData) {
      setSimUsdRate(macroData.usdThb.rate);
      setSimOilPrice(macroData.brentOil.priceUsd);
    }
  };

  // Industry End-use Segments
  const END_USE_SEGMENTS = [
    {
      id: 1,
      title: 'บรรจุภัณฑ์พลาสติก (Packaging)',
      share: 42,
      shareLabel: '42% (กลุ่มใหญ่สุดในไทย)',
      glowColor: 'from-cyan-500/20 to-blue-600/20',
      tagColor: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
      iconGlow: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
      icon: Package,
      targetProducts: 'ถุงพลาสติก, ฟิล์มยืด (Stretch Film), ฟิล์มหด, ขวดเครื่องดื่ม, ฝาขวด, แกลลอน, ถังบรรจุภัณฑ์เคมี',
      keyResins: ['HDPE', 'LLDPE', 'LDPE', 'PP (Homo/Block)', 'PET'],
      monthlyDemandEst: '~7,500 ตัน/เดือน',
      factoryCount: '415 โรงงาน',
      pitchAngle: 'ต้องการเม็ดเกรดเป่าฟิล์ม (Film Grade) และเม็ดฉีดขวด/ฝา (Injection/Blow Molding) ที่ราคาแข่งขันได้และส่งของสม่ำเสมอ',
    },
    {
      id: 2,
      title: 'เครื่องใช้ไฟฟ้า & อิเล็กทรอนิกส์ (E&E)',
      share: 16,
      shareLabel: '16%',
      glowColor: 'from-amber-500/20 to-orange-600/20',
      tagColor: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
      iconGlow: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
      icon: Cpu,
      targetProducts: 'ตัวถังตู้เย็น, ฝาเครื่องซักผ้า, กรอบทีวี, สวิตช์ไฟ, ชิ้นส่วนแอร์, ฉนวนไฟฟ้า',
      keyResins: ['ABS (High Impact/Heat)', 'HIPS', 'PP Compound (Flame Retardant)', 'PC', 'POM'],
      monthlyDemandEst: '~2,800 ตัน/เดือน',
      factoryCount: '158 โรงงาน',
      pitchAngle: 'เน้นเม็ดพลาสติกทนความร้อนสูง (Heat Resistance), ไม่ลามไฟ (UL94 V-0/V-2) และมีใบ Certificate รับรองมาตรฐานสากล',
    },
    {
      id: 3,
      title: 'ชิ้นส่วนยานยนต์ & ขนส่ง (Automotive)',
      share: 14,
      shareLabel: '14% (Margin สูงสุด)',
      glowColor: 'from-purple-500/20 to-indigo-600/20',
      tagColor: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
      iconGlow: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
      icon: Car,
      targetProducts: 'กันชนรถยนต์, แผงคอนโซลหน้ารถ, กรอบไฟหน้า, ท่อไอดี, มือจับประตู, ซีลยาง EPDM',
      keyResins: ['PA6 / PA66 (Nylon)', 'POM (Acetal)', 'PBT', 'ABS/PC Blend', 'PP+Talc 20-30%'],
      monthlyDemandEst: '~2,500 ตัน/เดือน',
      factoryCount: '142 โรงงาน',
      pitchAngle: 'ต้องการ Engineering Plastics คุณภาพสูง ทนแรงกระแทก แรงดึง และทนต่อสารเคมี/น้ำมัน',
    },
    {
      id: 4,
      title: 'งานก่อสร้าง ท่อ & สุขภัณฑ์ (Construction)',
      share: 12,
      shareLabel: '12%',
      glowColor: 'from-emerald-500/20 to-teal-600/20',
      tagColor: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
      iconGlow: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
      icon: Home,
      targetProducts: 'ท่อส่งน้ำประปา, ท่อร้อยสายไฟ, ข้อต่อท่อ (Fittings), แผ่นหลังคาโปร่งแสง, สุขภัณฑ์พลาสติก',
      keyResins: ['PVC (Rigid / Flexible)', 'HDPE (Pipe Grade PE100/PE80)', 'PP-R'],
      monthlyDemandEst: '~2,100 ตัน/เดือน',
      factoryCount: '118 โรงงาน',
      pitchAngle: 'เน้นเม็ดเกรดท่อที่มีความเหนียว ทนแรงดันน้ำสูง ทนแสงแดด UV และมีอายุการใช้งาน 50 ปีขึ้นไป',
    },
    {
      id: 5,
      title: 'ของใช้ในครัวเรือน & เบ็ดเตล็ด (Houseware)',
      share: 16,
      shareLabel: '16%',
      glowColor: 'from-pink-500/20 to-rose-600/20',
      tagColor: 'bg-pink-500/20 border-pink-400/40 text-pink-300',
      iconGlow: 'bg-pink-500/20 text-pink-400 border-pink-400/30',
      icon: Wrench,
      targetProducts: 'เก้าอี้พลาสติก, ถังขยะ, กะละมัง, กล่องเก็บของ, ตะกร้าผ้า, ไม้แขวนเสื้อ, ของเล่นเด็ก',
      keyResins: ['PP (Homo / Block)', 'PS (GPPS / HIPS)', 'PCR / PIR Recycled Resin'],
      monthlyDemandEst: '~3,100 ตัน/เดือน',
      factoryCount: '156 โรงงาน',
      pitchAngle: 'โรงงานกลุ่มนี้เน้นราคาต้นทุนต่อกิโลกรัมเป็นหลัก สามารถเสนอเม็ดหมุนเวียน (Recycled Compound) เพื่อลดต้นทุนได้ดี',
    },
  ];

  // Resin Market Share Breakdown
  const RESIN_BREAKDOWN = [
    { name: 'Polyethylene (PE)', sub: 'HDPE, LLDPE, LDPE', share: 35, category: 'commodity', tone: 'bg-gradient-to-r from-cyan-500 to-blue-500', note: 'ความต้องการสูงสุดในตลาดบรรจุภัณฑ์ ถุง ฟิล์ม และถัง' },
    { name: 'Polypropylene (PP)', sub: 'Homo, Block, Random Copolymer', share: 28, category: 'commodity', tone: 'bg-gradient-to-r from-blue-500 to-indigo-500', note: 'ฉีดชิ้นส่วนยานยนต์ กล่องอาหาร ชิ้นส่วนเครื่องใช้ไฟฟ้า' },
    { name: 'PET (Polyester)', sub: 'Bottle & Sheet Grade', share: 12, category: 'commodity', tone: 'bg-gradient-to-r from-amber-500 to-orange-500', note: 'เป่าขวดน้ำดื่ม น้ำอัดลม และแผ่นฟิล์มเทอร์โมฟอร์มมิ่ง' },
    { name: 'PVC (Polyvinyl Chloride)', sub: 'Suspension & Emulsion', share: 10, category: 'commodity', tone: 'bg-gradient-to-r from-emerald-500 to-teal-500', note: 'งานรีดท่อ ฉนวนสายไฟ หนังเทียม และแผ่นโปร่งแสง' },
    { name: 'Engineering Plastics', sub: 'ABS, PC, PA6/66, POM, PBT', share: 10, category: 'engineering', tone: 'bg-gradient-to-r from-purple-500 to-fuchsia-500', note: 'เม็ดเกรดวิศวกรรมเฉพาะทาง อัตรากำไรสูง (High Margin)' },
    { name: 'Polystyrene (PS)', sub: 'GPPS, HIPS, EPS', share: 5, category: 'commodity', tone: 'bg-gradient-to-r from-rose-500 to-pink-500', note: 'กล่องโฟม ชิ้นส่วนอิเล็กทรอนิกส์ ตลับเครื่องสำอาง' },
  ];

  // District Concentration in Samut Prakan
  const DISTRICT_METRICS = [
    { district: 'บางพลี', count: 387, share: '39.1%', monthlyEst: '~7,200 ตัน', highlight: 'ศูนย์กลางโรงงานบรรจุภัณฑ์และชิ้นส่วนยานยนต์หนาแน่นที่สุด' },
    { district: 'เมืองสมุทรปราการ', count: 291, share: '29.4%', monthlyEst: '~5,400 ตัน', highlight: 'เขตอุตสาหกรรมเก่าแก่ โรงงานฉีดพลาสติกและของใช้ในบ้าน' },
    { district: 'พระประแดง', count: 142, share: '14.4%', monthlyEst: '~2,600 ตัน', highlight: 'โรงงานฟิล์ม เป่าถุง และแปรรูปพลาสติกใกล้กรุงเทพฯ ชั้นใน' },
    { district: 'พระสมุทรเจดีย์', count: 74, share: '7.5%', monthlyEst: '~1,350 ตัน', highlight: 'โรงงานหลอมเม็ดรีไซเคิล และผลิตบรรจุภัณฑ์ริมฝั่งแม่น้ำ' },
    { district: 'บางเสาธง', count: 53, share: '5.4%', monthlyEst: '~1,000 ตัน', highlight: 'นิคมอุตสาหกรรมบางพลี โรงงานอิเล็กทรอนิกส์และยานยนต์ Tier 1-2' },
    { district: 'บางบ่อ', count: 42, share: '4.2%', monthlyEst: '~750 ตัน', highlight: 'โซนโรงงานขยายตัวใหม่ เชื่อมต่อฉะเชิงเทราและระยอง' },
  ];

  const currentBrent = macroData?.brentOil?.priceUsd ?? 78.50;
  const currentBrentChange = macroData?.brentOil?.change24h ?? 1.25;
  const currentBrentChangePct = macroData?.brentOil?.changePct24h ?? 1.62;

  const currentWti = macroData?.wtiOil?.priceUsd ?? 74.20;
  const currentUsdRate = macroData?.usdThb?.rate ?? 34.85;
  const currentUsdChange = macroData?.usdThb?.change24h ?? 0.12;

  const currentNaphtha = macroData?.naphthaCfrJapan?.priceUsd ?? 685.00;
  const currentNaphthaChange = macroData?.naphthaCfrJapan?.change24h ?? 10.88;

  const trendDirection = macroData?.resinForecast?.trendDirection ?? 'bullish';
  const trendLabel = macroData?.resinForecast?.trendLabelTh ?? 'แนวโน้มปรับขึ้น (Bullish Bias)';
  const expectedShift = macroData?.resinForecast?.expectedShiftThbPerTon ?? '+800 ถึง +1,500 บ./ตัน';
  const trendReason = macroData?.resinForecast?.reasonTh ?? 'ราคาน้ำมันดิบขยับขึ้นและค่าเงินบาทอ่อน ดันต้นทุนเม็ดนำเข้าและผู้ผลิตในประเทศ';

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-300 relative pb-10">
      
      {/* 🔮 3D Ambient Background Glow Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-80 right-10 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-40 left-1/3 w-[26rem] h-[26rem] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* 📱 Mobile Quick Category Switcher (Sticky Horizontal Scroll Pills) */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 backdrop-blur-2xl bg-slate-950/90 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'all', label: '📊 ทั้งหมด', badge: '' },
          { id: 'macro', label: '🛢️ ดัชนีโลก & FX', badge: 'Live' },
          { id: 'simulator', label: '🎛️ จำลองราคา', badge: 'Sim' },
          { id: 'segments', label: '🏭 5 คลัสเตอร์', badge: '5 กลุ่ม' },
          { id: 'resins', label: '🧪 ชนิดเม็ด', badge: '6 ชนิด' },
          { id: 'districts', label: '📍 6 อำเภอ', badge: '989 แห่ง' },
          { id: 'roi', label: '💡 คุ้มค่า ROI', badge: 'Case' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mobileSection === tab.id
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                mobileSection === tab.id ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-cyan-500/15 text-cyan-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. Header & Value Proposition Banner (Glassmorphic Hero) */}
      {(mobileSection === 'all' || mobileSection === 'macro') && (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/60 to-slate-950/80 border border-white/15 p-4 sm:p-6 lg:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Specular Edge Highlights */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/0 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Sparkles className="w-3 h-3 animate-pulse text-cyan-300" />
                <span>Executive Plastic Market Intelligence & TAM Sizing</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                ภาพรวมและมูลค่าตลาดเม็ดพลาสติก (Market Sizing)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-normal">
                วิเคราะห์ความต้องการบริโภคเม็ดพลาสติกในกลุ่มโรงงาน <strong>สมุทรปราการ 989 แห่ง</strong> และ <strong>ทั่วประเทศ</strong> เพื่อเป็นข้อมูลเชิงกลยุทธ์สำหรับผู้ค้าเม็ดพลาสติก (Resin Traders)
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap md:flex-col items-center md:items-end gap-1.5 backdrop-blur-xl bg-slate-950/70 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>แหล่งสถิติตรวจสอบ:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold">PITH</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">F.T.I.</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">DIW</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-bold">DBD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top 4 Executive KPI Cards (2x2 Grid on Mobile, 4-col on Desktop) */}
      {(mobileSection === 'all' || mobileSection === 'macro') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* KPI 1: TAM Market Value */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 space-y-1.5 sm:space-y-2.5 relative overflow-hidden shadow-lg hover:border-cyan-400/40 transition">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold">
              <span className="truncate">มูลค่าตลาดในโซนนี้</span>
              <div className="p-1 rounded-lg bg-cyan-500/15 text-cyan-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 font-mono tracking-tight">
              ~8,500 <span className="text-xs sm:text-sm text-slate-300 font-sans font-normal">ลบ./ปี</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
              ใช้เม็ดพลาสติกรวม <strong>~18,300 ตัน/ด.</strong>
            </p>
          </div>

          {/* KPI 2: Market Coverage % */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 space-y-1.5 sm:space-y-2.5 relative overflow-hidden shadow-lg hover:border-amber-400/40 transition">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold">
              <span className="truncate">ครอบคลุมตลาด (Coverage)</span>
              <div className="p-1 rounded-lg bg-amber-500/15 text-amber-400">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 font-mono tracking-tight">
              89.9% <span className="text-xs sm:text-sm text-slate-300 font-sans font-normal">พื้นที่</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
              พิกัด GPS & เบอร์โทร <strong>989 โรงงาน</strong>
            </p>
          </div>

          {/* KPI 3: Enterprise & Large Factories */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 space-y-1.5 sm:space-y-2.5 relative overflow-hidden shadow-lg hover:border-purple-400/40 transition">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold">
              <span className="truncate">เกรด Enterprise (ทุน ≥20M)</span>
              <div className="p-1 rounded-lg bg-purple-500/15 text-purple-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400 font-mono tracking-tight">
              475 <span className="text-xs sm:text-sm text-slate-300 font-sans font-normal">โรงงาน</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
              กำลังซื้อสูง เครดิตการเงินมั่นคง
            </p>
          </div>

          {/* KPI 4: National Plastic Resin Demand */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 space-y-1.5 sm:space-y-2.5 relative overflow-hidden shadow-lg hover:border-emerald-400/40 transition">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold">
              <span className="truncate">บริโภคทั่วประเทศ</span>
              <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400 font-mono tracking-tight">
              ~4.8 <span className="text-xs sm:text-sm text-slate-300 font-sans font-normal">ล้านตัน/ปี</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
              มูลค่าตลาดรวม <strong>~850,000 ลบ.</strong>
            </p>
          </div>

        </div>
      )}

      {/* 3. Global Macro Drivers: 3D Glass Command Console */}
      {(mobileSection === 'all' || mobileSection === 'macro') && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 sm:space-y-6 relative overflow-hidden">
          
          {/* Specular Top Glow */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          
          {/* Section Header with Live Status & Refresh Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-5 border-b border-white/10">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-md bg-amber-500/15 border border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Fuel className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-1.5">
                  <span>ดัชนีราคาน้ำมันโลก, ค่าเงิน USD & ทิศทางราคาเม็ด</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  ปัจจัยภายนอกกำหนดต้นทุนการผลิตและราคาเสนอขายเม็ดพลาสติกรายสัปดาห์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-xl bg-slate-950/80 border border-white/10 text-[10px] sm:text-[11px] font-mono shadow-inner">
                <span className={`w-2 h-2 rounded-full ${macroData?.isLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                <span className="text-slate-200 font-sans font-medium">
                  {macroData?.isLive ? '🟢 Live Market' : '🟡 ดัชนีล่าสุด'}
                </span>
                {lastRefreshedAt && (
                  <span className="text-slate-400 border-l border-white/10 pl-1.5 hidden xs:inline">
                    {lastRefreshedAt}
                  </span>
                )}
              </div>

              <button
                onClick={() => fetchMacroData(true)}
                disabled={isLoadingMacro}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl backdrop-blur-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] sm:text-xs font-sans font-bold border border-cyan-400/30 flex items-center gap-1 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer active:scale-95"
                title="ดึงราคาตลาดล่าสุด"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingMacro ? 'animate-spin text-cyan-300' : ''}`} />
                <span>{isLoadingMacro ? 'กำลังตรวจ...' : 'อัปเดตราคา'}</span>
              </button>
            </div>
          </div>

          {/* 4 Macro Index Cards Grid (2x2 on Mobile, 4-col on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* Card 1: Brent Crude Oil */}
            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-amber-400/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-400" />
                  <span className="truncate">Brent Oil</span>
                </span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-0.5 border ${
                  currentBrentChange >= 0 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {currentBrentChange >= 0 ? '+' : ''}{currentBrentChange.toFixed(1)}
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
                ${currentBrent.toFixed(2)} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">/bbl</span>
              </div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                <span>WTI: ${currentWti.toFixed(1)}</span>
                <span className="text-cyan-400 font-mono">ICE Futures</span>
              </div>
            </div>

            {/* Card 2: Naphtha Feedstock */}
            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-cyan-400/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  <span className="truncate">Naphtha CFR</span>
                </span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-0.5 border ${
                  currentNaphthaChange >= 0 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {currentNaphthaChange >= 0 ? '+' : ''}{currentNaphthaChange.toFixed(1)}
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-cyan-300 font-mono tracking-tight">
                ${currentNaphtha.toFixed(0)} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">/ton</span>
              </div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                <span>Platts CFR Japan</span>
                <span className="text-cyan-400 font-mono">Feedstock</span>
              </div>
            </div>

            {/* Card 3: USD/THB Exchange Rate */}
            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-emerald-400/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">USD/THB</span>
                </span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                  currentUsdChange >= 0 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {currentUsdChange >= 0 ? 'บาทอ่อน' : 'บาทแข็ง'}
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {currentUsdRate.toFixed(2)} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">บาท</span>
              </div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                <span>Interbank FX Spot</span>
                <span className="text-emerald-400 font-mono">BOT Feed</span>
              </div>
            </div>

            {/* Card 4: Price Trend Forecast Signal */}
            <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-xl border space-y-1.5 relative overflow-hidden shadow-lg ${
              trendDirection === 'bullish'
                ? 'bg-gradient-to-br from-rose-500/20 via-slate-900/60 to-slate-950/90 border-rose-500/40'
                : trendDirection === 'bearish'
                ? 'bg-gradient-to-br from-emerald-500/20 via-slate-900/60 to-slate-950/90 border-emerald-500/40'
                : 'bg-white/[0.04] border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="truncate">แนวโน้มราคาเม็ด</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${trendDirection === 'bullish' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
              </div>
              <div className={`text-sm sm:text-base font-black font-mono truncate ${trendDirection === 'bullish' ? 'text-rose-300' : 'text-emerald-300'}`}>
                {trendDirection === 'bullish' ? '🔺 ขึ้น' : '🔻 ลง'} ({expectedShift})
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-300 leading-tight border-t border-white/5 pt-1.5 line-clamp-1">
                {trendReason}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 🎛️ Interactive Price Simulator */}
      {(mobileSection === 'all' || mobileSection === 'simulator') && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] to-slate-950/80 border border-cyan-400/30 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                เครื่องจำลองผลกระทบราคาเม็ดพลาสติก (Resin Price & FX Simulator)
              </h4>
            </div>
            <button
              onClick={handleResetSimulatorToLive}
              className="text-[11px] text-cyan-300 hover:text-cyan-200 font-medium px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-400/20 self-start sm:self-auto cursor-pointer active:scale-95"
            >
              🔄 รีเซ็ตเป็นราคาตลาดปัจจุบัน
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Sliders Box */}
            <div className="space-y-3.5 backdrop-blur-xl bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 shadow-inner">
              {/* Oil Price Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">🛢️ ราคาน้ำมันดิบ (Brent):</span>
                  <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">${simOilPrice.toFixed(1)} / bbl</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="0.5"
                  value={simOilPrice}
                  onChange={(e) => setSimOilPrice(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>$60</span>
                  <span>$80 (เฉลี่ย)</span>
                  <span>$100</span>
                </div>
              </div>

              {/* FX Rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">💵 ค่าเงิน USD/THB:</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">{simUsdRate.toFixed(2)} บาท/USD</span>
                </div>
                <input
                  type="range"
                  min="32.00"
                  max="38.00"
                  step="0.05"
                  value={simUsdRate}
                  onChange={(e) => setSimUsdRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>32.00 (แข็ง)</span>
                  <span>35.00 (ปกติ)</span>
                  <span>38.00 (อ่อน)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* PE Price */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-cyan-500/10 to-slate-950/80 border border-cyan-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] sm:text-[11px] text-cyan-300 font-bold font-mono">PE (Film)</span>
                <div className="text-base sm:text-xl font-black text-white font-mono">{simResinThbPerKg.toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บาท / กก.</span>
                <span className="text-[8px] text-cyan-400/80 font-mono">~{Math.round(simPePricePerTon).toLocaleString()} บ./ตัน</span>
              </div>

              {/* PP Price */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-blue-500/10 to-slate-950/80 border border-blue-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] sm:text-[11px] text-blue-300 font-bold font-mono">PP (Homo)</span>
                <div className="text-base sm:text-xl font-black text-white font-mono">{(simResinThbPerKg - 1.2).toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บาท / กก.</span>
                <span className="text-[8px] text-blue-400/80 font-mono">~{Math.round(simPpPricePerTon).toLocaleString()} บ./ตัน</span>
              </div>

              {/* ABS Price */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-purple-500/10 to-slate-950/80 border border-purple-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] sm:text-[11px] text-purple-300 font-bold font-mono">ABS Eng.</span>
                <div className="text-base sm:text-xl font-black text-purple-200 font-mono">{(simResinThbPerKg * 1.45).toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บาท / กก.</span>
                <span className="text-[8px] text-purple-400/80 font-mono">~{Math.round(simAbsPricePerTon).toLocaleString()} บ./ตัน</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Section 1: End-Use Industry Segmentation */}
      {(mobileSection === 'all' || mobileSection === 'segments') && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-xl space-y-4 sm:space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span>5 คลัสเตอร์อุตสาหกรรมแปรรูปพลาสติก (End-Use Application Share)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                วิเคราะห์ประเภทสินค้าที่โรงงานผลิตและสเปกความต้องการเม็ดพลาสติก
              </p>
            </div>
            <span className="text-[11px] text-slate-300 font-mono bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 self-start sm:self-auto">
              5 คลัสเตอร์หลัก
            </span>
          </div>

          {/* Visual Progress Bar Share & Responsive Legend */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold gap-2">
              <span className="text-slate-200 whitespace-nowrap">สัดส่วนตามกลุ่มอุตสาหกรรม:</span>
              <span className="text-cyan-400 font-mono text-[11px] whitespace-nowrap">รวม 100% ตลาดไทย</span>
            </div>

            {/* Sleek Segmented Glow Color Bar */}
            <div className="h-3 sm:h-3.5 w-full rounded-full bg-slate-950/80 p-0.5 flex items-center gap-1 border border-white/10 overflow-hidden shadow-inner">
              <div style={{ width: '42%' }} className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" title="บรรจุภัณฑ์ 42%" />
              <div style={{ width: '16%' }} className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" title="เครื่องใช้ไฟฟ้า 16%" />
              <div style={{ width: '14%' }} className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" title="ยานยนต์ 14%" />
              <div style={{ width: '12%' }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="ก่อสร้าง/ท่อ 12%" />
              <div style={{ width: '16%' }} className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]" title="ของใช้ 16%" />
            </div>

            {/* Responsive Legend Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] sm:text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>บรรจุภัณฑ์ 42%</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>เครื่องใช้ไฟฟ้า 16%</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>ยานยนต์ 14%</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>ก่อสร้าง/ท่อ 12%</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-pink-500/15 border border-pink-400/30 text-pink-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>ของใช้ 16%</span>
              </span>
            </div>
          </div>

          {/* 5 End-Use Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {END_USE_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isActive = activeSegment === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => setActiveSegment(isActive ? null : seg.id)}
                  className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-b from-white/[0.12] to-slate-950/90 border-cyan-400 shadow-cyan-500/20'
                      : 'bg-gradient-to-b from-white/[0.04] to-slate-950/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl backdrop-blur-md border ${seg.iconGlow} shadow-md`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition">{seg.title}</h4>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${seg.tagColor}`}>{seg.shareLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-slate-400 text-[11px] font-medium">สินค้าหลัก:</div>
                      <p className="text-slate-200 text-[10px] sm:text-[11px] leading-relaxed backdrop-blur-md bg-slate-950/60 p-2 rounded-xl border border-white/5">
                        {seg.targetProducts}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] font-medium">เม็ดพลาสติกที่ใช้หลัก:</span>
                      <div className="flex flex-wrap gap-1">
                        {seg.keyResins.map((resin, rIdx) => (
                          <span key={rIdx} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 text-[9px] font-mono">
                            {resin}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Demand ในสมุทรปราการ:</span>
                      <span className="font-mono font-bold text-amber-300">{seg.monthlyDemandEst}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">จำนวนโรงงานเป้าหมาย:</span>
                      <span className="font-mono font-bold text-white">{seg.factoryCount}</span>
                    </div>
                    
                    <div className="mt-1.5 p-2.5 rounded-xl backdrop-blur-md bg-cyan-950/50 border border-cyan-500/30 text-[10px] text-cyan-200 leading-snug">
                      <span className="font-bold text-cyan-400">💡 จุดขายที่ควรเสนอ: </span>
                      {seg.pitchAngle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Section 2: Resin Demand Share Breakdown */}
      {(mobileSection === 'all' || mobileSection === 'resins') && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-xl space-y-4 sm:space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span>สัดส่วนความต้องการเม็ดพลาสติกแต่ละชนิด (Polymer Breakdown)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                ความต้องการบริโภคเม็ดพลาสติกในประเทศไทยตามประเภท Polymer
              </p>
            </div>

            <div className="flex items-center gap-1 backdrop-blur-xl bg-slate-950/80 p-1 rounded-xl border border-white/10 self-start sm:self-auto text-[11px] font-mono shadow-inner">
              <button
                onClick={() => setSelectedResinTab('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${selectedResinTab === 'all' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                ทั้งหมด (100%)
              </button>
              <button
                onClick={() => setSelectedResinTab('commodity')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${selectedResinTab === 'commodity' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Commodity (90%)
              </button>
              <button
                onClick={() => setSelectedResinTab('engineering')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${selectedResinTab === 'engineering' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Engineering (10%)
              </button>
            </div>
          </div>

          {/* Breakdown List & Progress Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {RESIN_BREAKDOWN
              .filter((r) => selectedResinTab === 'all' || r.category === selectedResinTab)
              .map((resin, idx) => (
                <div key={idx} className="p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-slate-950/70 border border-white/10 space-y-2.5 hover:border-white/25 transition shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">{resin.name}</h4>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">{resin.sub}</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 font-mono">{resin.share}%</span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className={`h-full ${resin.tone} rounded-full`} style={{ width: `${resin.share * 2.5}%` }} />
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                    {resin.note}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 6. Section 3: Geographical Factory Distribution in Samut Prakan */}
      {(mobileSection === 'all' || mobileSection === 'districts') && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-xl space-y-4 sm:space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>การกระจายตัวของโรงงาน 989 แห่งใน 6 อำเภอ (Samut Prakan Hub)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                สมุทรปราการเป็นพื้นที่ที่มีโรงงานแปรรูปพลาสติกหนาแน่นที่สุดแห่งหนึ่งของประเทศไทย
              </p>
            </div>
            <span className="text-[11px] text-amber-300 font-mono bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-400/30 self-start sm:self-auto">
              6 อำเภอเป้าหมาย
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISTRICT_METRICS.map((dist, idx) => (
              <div key={idx} className="p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-slate-950/70 border border-white/10 space-y-2 hover:border-cyan-400/30 transition shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">อ.{dist.district}</span>
                  <span className="text-xs font-mono font-black text-cyan-300">{dist.count} โรงงาน ({dist.share})</span>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                  <span>ปริมาณการใช้เม็ดประเมิน:</span>
                  <span className="font-mono text-amber-300 font-bold">{dist.monthlyEst}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug border-t border-white/5 pt-1.5">
                  {dist.highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Section 4: Business Case & ROI Pitch Calculator */}
      {(mobileSection === 'all' || mobileSection === 'roi') && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-slate-950/90 border border-amber-400/30 shadow-xl space-y-4 sm:space-y-6 relative overflow-hidden">
          
          <div className="flex items-center gap-2.5 sm:gap-3.5 pb-3 border-b border-white/10">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <CircleDollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white">
                💡 ตัวเลขความคุ้มค่าในการลงทุนระบบ (Business Case & ROI)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300/90 mt-0.5">
                แบบจำลองผลตอบแทนจากการส่งเซลส์เข้าเจาะตลาด 989 โรงงานในระบบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-cyan-300 font-bold block">1. ฐานลูกค้าพร้อมเข้าพบ</span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">989 โรงงาน</div>
              <p className="text-slate-300 text-[10px] sm:text-[11px] leading-relaxed">
                เซลส์ไม่ต้องเสียเวลาค้นหาเอง มีพิกัดโรงงาน เบอร์โทร และระยะทาง GPS พร้อมวางแผนแวะพบวันละ 4-6 โรงงาน
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-amber-300 font-bold block">2. ปิดลูกค้าใหม่เพียง 1% - 2%</span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">10 - 20 โรงงานใหม่</div>
              <p className="text-slate-300 text-[10px] sm:text-[11px] leading-relaxed">
                หากปิดลูกค้าโรงงานแปรรูปพลาสติกได้เพียง 10-20 ราย ยอดซื้อเฉลี่ย 15-30 ตัน/โรงงาน/เดือน
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-emerald-300 font-bold block">3. ยอดขายใหม่ที่สร้างได้ (Revenue)</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">5 - 20 ล้านบาท/ด.</div>
              <p className="text-slate-300 text-[10px] sm:text-[11px] leading-relaxed">
                คิดเป็นยอดขายใหม่ <strong>60 - 240 ล้านบาทต่อปี</strong> คืนทุนค่าระบบซอฟต์แวร์ทันทีตั้งแต่เดือนแรก
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
