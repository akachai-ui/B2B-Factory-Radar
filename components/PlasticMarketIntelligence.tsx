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
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Radio,
  FileCheck,
  BookOpen,
  Copy,
  Check,
  HelpCircle,
  Lightbulb,
  ChevronRight,
  Send,
  MessageSquare,
  Search,
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

export interface PlasticMarketIntelligenceProps {
  onNavigateToMarketplace?: (keyword?: string) => void;
}

export function PlasticMarketIntelligence({ onNavigateToMarketplace }: PlasticMarketIntelligenceProps) {
  const [selectedResinTab, setSelectedResinTab] = useState<'all' | 'commodity' | 'engineering' | 'recycled'>('all');
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [activeObjection, setActiveObjection] = useState<number | null>(0);
  const [mobileSection, setMobileSection] = useState<'all' | 'strategy' | 'macro' | 'simulator' | 'segments' | 'resins' | 'districts' | 'playbook'>('all');
  const [copiedPrice, setCopiedPrice] = useState<boolean>(false);

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
  const simPvcPricePerTon = (simResinThbPerKg * 0.88) * 1000;

  const handleResetSimulatorToLive = () => {
    if (macroData) {
      setSimUsdRate(macroData.usdThb.rate);
      setSimOilPrice(macroData.brentOil.priceUsd);
    }
  };

  const handleCopyQuotationPitch = () => {
    const text = `📊 [RouteHunter] สรุปดัชนีราคาประมาณการเม็ดพลาสติก (อ้างอิง FX ${simUsdRate.toFixed(2)} บ. | Brent $${simOilPrice.toFixed(1)}/bbl)
• PE (Film Grade): ~${simResinThbPerKg.toFixed(2)} บ./กก. (~${Math.round(simPePricePerTon).toLocaleString()} บ./ตัน)
• PP (Homo/Block): ~${(simResinThbPerKg - 1.2).toFixed(2)} บ./กก. (~${Math.round(simPpPricePerTon).toLocaleString()} บ./ตัน)
• ABS (Injection): ~${(simResinThbPerKg * 1.45).toFixed(2)} บ./กก. (~${Math.round(simAbsPricePerTon).toLocaleString()} บ./ตัน)
• PVC (Pipe/Rigid): ~${(simResinThbPerKg * 0.88).toFixed(2)} บ./กก. (~${Math.round(simPvcPricePerTon).toLocaleString()} บ./ตัน)
* ราคาอ้างอิงเพื่อการวางแผนสต็อกและการจัดซื้อ`;

    navigator.clipboard.writeText(text);
    setCopiedPrice(true);
    setTimeout(() => setCopiedPrice(false), 2500);
  };

  // Industry End-use Segments with Direct Filter Keywords
  const END_USE_SEGMENTS = [
    {
      id: 1,
      title: 'บรรจุภัณฑ์พลาสติก (Packaging)',
      searchKeyword: 'บรรจุภัณฑ์',
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
      actionPrompt: 'ค้นหา 415 โรงงานบรรจุภัณฑ์',
    },
    {
      id: 2,
      title: 'เครื่องใช้ไฟฟ้า & อิเล็กทรอนิกส์ (E&E)',
      searchKeyword: 'อิเล็กทรอนิกส์',
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
      actionPrompt: 'ค้นหา 158 โรงงานเครื่องใช้ไฟฟ้า',
    },
    {
      id: 3,
      title: 'ชิ้นส่วนยานยนต์ & ขนส่ง (Automotive)',
      searchKeyword: 'ยานยนต์',
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
      actionPrompt: 'ค้นหา 142 โรงงานชิ้นส่วนยานยนต์',
    },
    {
      id: 4,
      title: 'งานก่อสร้าง ท่อ & สุขภัณฑ์ (Construction)',
      searchKeyword: 'ท่อ',
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
      actionPrompt: 'ค้นหา 118 โรงงานท่อ & ก่อสร้าง',
    },
    {
      id: 5,
      title: 'ของใช้ในครัวเรือน & เบ็ดเตล็ด (Houseware)',
      searchKeyword: 'ของใช้',
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
      actionPrompt: 'ค้นหา 156 โรงงานของใช้ในบ้าน',
    },
  ];

  // Sales Objection Handling Playbook
  const SALES_OBJECTIONS = [
    {
      id: 1,
      question: '“โรงงานเรามีซัพพลายเออร์เจ้าประจำอยู่แล้ว ไม่คิดจะเปลี่ยนเจ้าใหม่”',
      tag: 'การเปิดใจครั้งแรก',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      responseTitle: 'กลยุทธ์ “ซัพพลายเออร์สำรอง (Secondary Supplier)”',
      script: '“เข้าใจเลยครับพี่ ทางเราไม่ได้มาขอให้เปลี่ยนเจ้าหลักครับ แต่ช่วงนี้วัตถุดิบและค่าขนส่งผันผวนบ่อย โรงงานส่วนใหญ่ในสมุทรปราการมักเปิดรับซัพพลายเออร์สำรองไว้ 1-2 เจ้า เพื่อป้องกันปัญหาของขาดสต็อก หรือได้ราคาเปรียบเทียบในรอบบิลถัดไป ขออนุญาตส่งแคตตาล็อกและสเปกราคาเกรดที่พี่ใช้อยู่ไว้ให้พิจารณาเปรียบเทียบดูนะครับ”',
    },
    {
      id: 2,
      question: '“ช่วงนี้ออเดอร์โรงงานน้อย ขอยังไม่สั่งสต็อกเม็ดพลาสติกเพิ่ม”',
      tag: 'สภาวะตลาดชะลอ',
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      responseTitle: 'กลยุทธ์ “จังหวะล็อคราคาด้วยดัชนีตลาด Real-time”',
      script: '“ช่วงที่ตลาดนิ่งคือช่วงที่ดีที่สุดในการวางแผนต้นทุนครับพี่ เพราะตอนนี้ดัชนีแนฟทาและน้ำมันดิบอยู่ในช่วงปรับฐาน หากวางแผนสั่งซื้อล็อตย่อยล่วงหน้าตอนนี้ จะได้ราคาเฉลี่ยที่ต่ำกว่าช่วงพีคตอนออเดอร์เข้ามาพร้อมๆ กันแน่นอนครับ”',
    },
    {
      id: 3,
      question: '“ขอเครดิตเทอมยาว 60-90 วันได้ไหม เจ้าอื่นเขาให้ได้”',
      tag: 'เงื่อนไขการชำระเงิน',
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
      responseTitle: 'กลยุทธ์ “แลกส่วนลดเงินสด (Cash Discount) ลดต้นทุนต่อ กก.”',
      script: '“สำหรับเครดิต 60-90 วัน ทางเราสามารถให้ฝ่ายสินเชื่อพิจารณาได้ครับพี่ แต่ถ้าพี่สามารถชำระแบบ 15 วัน หรือโอนสด ทางเรามีส่วนลด Cash Discount พิเศษทันที 1.5 - 2.5 บาท/กก. ซึ่งจะช่วยลดต้นทุนการผลิตของพี่ได้โดยตรงในสภาวะการแข่งขันปัจจุบันครับ”',
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
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 backdrop-blur-2xl bg-slate-950/90 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'all', label: '📊 ทั้งหมด', badge: '' },
          { id: 'strategy', label: '🎯 สรุปกลยุทธ์ 3 วิ', badge: 'Action' },
          { id: 'macro', label: '🛢️ ดัชนีโลก & FX', badge: 'Live' },
          { id: 'simulator', label: '🎛️ จำลองราคา', badge: 'Sim' },
          { id: 'segments', label: '🏭 5 คลัสเตอร์', badge: '5 กลุ่ม' },
          { id: 'playbook', label: '💬 สคริปต์ปิดการขาย', badge: 'Tips' },
          { id: 'districts', label: '📍 6 อำเภอ', badge: '989 แห่ง' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
              mobileSection === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
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

      {/* 🌟 1. EXECUTIVE ACTION BANNER (3-SECOND STRATEGY HERO) */}
      {(mobileSection === 'all' || mobileSection === 'strategy' || mobileSection === 'macro') && (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-cyan-950/40 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 p-4 sm:p-6 lg:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/0 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Executive Actionable Intelligence • คำแนะนำเชิงรุกประจำสัปดาห์</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>สรุปทิศทางตลาด & ยุทธศาสตร์ทีมขาย</span>
              </h2>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
                <span className="text-amber-400 font-bold">🎯 จังหวะการขาย: </span>
                {trendDirection === 'bullish' ? (
                  <span>
                    ต้นทุนน้ำมันดิบและ Naphtha เริ่มขยับขึ้น <strong>แนะนำให้เซลส์รีบติดต่อโรงงานกลุ่ม Packaging และ Automotive ทันที</strong> เพื่อเสนอโปรโมชัน <span className="text-cyan-300 font-bold">"ล็อคราคาเดิมก่อนปรับขึ้นในรอบสัปดาห์ถัดไป"</span> ช่วยกระตุ้นให้จัดซื้อปิดสัญญาซื้อขายเร็วขึ้น 2-3 สัปดาห์
                  </span>
                ) : (
                  <span>
                    ราคาน้ำมันและอัตราแลกเปลี่ยนเริ่มชะลอตัว เป็นโอกาสทองในการเปิดตลาด <strong>โรงงานใหม่ที่ต้องการลดต้นทุนวัตถุดิบ</strong> เสนอราคาที่แข่งขันได้และดึงโรงงานเข้ามาเป็นลูกค้าระยะยาว
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Button to Marketplace */}
            {onNavigateToMarketplace && (
              <button
                onClick={() => onNavigateToMarketplace()}
                className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95 border border-amber-300/60"
              >
                <Search className="w-4 h-4" />
                <span>เปิดคลัง 989 โรงงานทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top 4 Executive KPI Cards */}
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
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 sm:space-y-5 relative overflow-hidden">
          
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          
          {/* Section Header with Live Status & Refresh Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md bg-amber-500/15 border border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Fuel className="w-4 h-4 sm:w-5 sm:h-5" />
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
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl backdrop-blur-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] sm:text-xs font-sans font-bold border border-cyan-400/30 flex items-center gap-1 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer active:scale-95"
                title="ดึงราคาตลาดล่าสุด"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingMacro ? 'animate-spin text-cyan-300' : ''}`} />
                <span>{isLoadingMacro ? 'กำลังตรวจ...' : 'อัปเดตราคา'}</span>
              </button>
            </div>
          </div>

          {/* 4 Macro Index Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* Card 1: Brent Crude Oil */}
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-amber-400/40 transition">
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
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-cyan-400/40 transition">
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
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 relative overflow-hidden shadow-lg hover:border-emerald-400/40 transition">
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
            <div className={`p-3 sm:p-4 rounded-2xl backdrop-blur-xl border space-y-1.5 relative overflow-hidden shadow-lg ${
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

      {/* 🎛️ 4. INTERACTIVE PRICE SIMULATOR WITH 1-CLICK QUOTATION COPY */}
      {(mobileSection === 'all' || mobileSection === 'simulator') && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] to-slate-950/80 border border-cyan-400/30 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                เครื่องจำลองราคาเม็ดพลาสติก & คำนวณใบเสนอราคา (Resin Price Simulator)
              </h4>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyQuotationPitch}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md ${
                  copiedPrice
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                }`}
              >
                {copiedPrice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrice ? '✓ คัดลอกสรุปราคาแล้ว!' : '📋 คัดลอกราคาไปคุยใน LINE'}</span>
              </button>

              <button
                onClick={handleResetSimulatorToLive}
                className="text-[11px] text-slate-300 hover:text-white font-medium px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer active:scale-95"
              >
                🔄 คืนค่า Live
              </button>
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2 text-center">
              {/* PE Price */}
              <div className="p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-cyan-500/10 to-slate-950/80 border border-cyan-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] text-cyan-300 font-bold font-mono">PE (Film)</span>
                <div className="text-base sm:text-lg font-black text-white font-mono">{simResinThbPerKg.toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บ./กก.</span>
                <span className="text-[8px] text-cyan-400 font-mono">~{Math.round(simPePricePerTon).toLocaleString()} บ./ตัน</span>
              </div>

              {/* PP Price */}
              <div className="p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-blue-500/10 to-slate-950/80 border border-blue-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] text-blue-300 font-bold font-mono">PP (Homo)</span>
                <div className="text-base sm:text-lg font-black text-white font-mono">{(simResinThbPerKg - 1.2).toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บ./กก.</span>
                <span className="text-[8px] text-blue-400 font-mono">~{Math.round(simPpPricePerTon).toLocaleString()} บ./ตัน</span>
              </div>

              {/* ABS Price */}
              <div className="p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-purple-500/10 to-slate-950/80 border border-purple-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] text-purple-300 font-bold font-mono">ABS (Eng)</span>
                <div className="text-base sm:text-lg font-black text-purple-200 font-mono">{(simResinThbPerKg * 1.45).toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บ./กก.</span>
                <span className="text-[8px] text-purple-400 font-mono">~{Math.round(simAbsPricePerTon).toLocaleString()} บ./ตัน</span>
              </div>

              {/* PVC Price */}
              <div className="p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-emerald-500/10 to-slate-950/80 border border-emerald-400/30 flex flex-col justify-center space-y-0.5 shadow-lg">
                <span className="text-[10px] text-emerald-300 font-bold font-mono">PVC (Pipe)</span>
                <div className="text-base sm:text-lg font-black text-emerald-200 font-mono">{(simResinThbPerKg * 0.88).toFixed(2)}</div>
                <span className="text-[9px] text-slate-400 font-mono">บ./กก.</span>
                <span className="text-[8px] text-emerald-400 font-mono">~{Math.round(simPvcPricePerTon).toLocaleString()} บ./ตัน</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 5 END-USE CLUSTERS WITH 1-CLICK ACTION TO FACTORIES */}
      {(mobileSection === 'all' || mobileSection === 'segments') && (
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-xl space-y-4 sm:space-y-5 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span>5 คลัสเตอร์อุตสาหกรรมแปรรูปพลาสติก (Industrial Application Clusters)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                เลือกกลุ่มอุตสาหกรรมเพื่อดูพฤติกรรมการซื้อ และกดเปิดดูรายชื่อโรงงานในระบบได้ทันที
              </p>
            </div>
            <span className="text-[11px] text-slate-300 font-mono bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 self-start sm:self-auto">
              5 คลัสเตอร์หลัก
            </span>
          </div>

          {/* Visual Progress Bar Share */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-950/80 p-0.5 flex items-center gap-1 border border-white/10 overflow-hidden shadow-inner">
              <div style={{ width: '42%' }} className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" title="บรรจุภัณฑ์ 42%" />
              <div style={{ width: '16%' }} className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" title="เครื่องใช้ไฟฟ้า 16%" />
              <div style={{ width: '14%' }} className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full" title="ยานยนต์ 14%" />
              <div style={{ width: '12%' }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" title="ก่อสร้าง/ท่อ 12%" />
              <div style={{ width: '16%' }} className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full" title="ของใช้ 16%" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">📦 บรรจุภัณฑ์ 42%</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold">⚡ เครื่องใช้ไฟฟ้า 16%</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 font-bold">🚗 ยานยนต์ 14%</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">🏗️ ก่อสร้าง/ท่อ 12%</span>
              <span className="px-2 py-0.5 rounded-lg bg-pink-500/15 border border-pink-400/30 text-pink-300 font-bold">🧴 ของใช้ 16%</span>
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
                  className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-lg ${
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

                  <div className="pt-2.5 border-t border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Demand ในสมุทรปราการ:</span>
                      <span className="font-mono font-bold text-amber-300">{seg.monthlyDemandEst}</span>
                    </div>
                    
                    <div className="p-2 rounded-xl backdrop-blur-md bg-cyan-950/40 border border-cyan-500/25 text-[10px] text-cyan-200 leading-snug">
                      <span className="font-bold text-cyan-400">💡 จุดขายที่ควรเสนอ: </span>
                      {seg.pitchAngle}
                    </div>

                    {/* Direct Action Button to Filter Marketplace */}
                    {onNavigateToMarketplace && (
                      <button
                        onClick={() => onNavigateToMarketplace(seg.searchKeyword)}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm mt-1"
                      >
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{seg.actionPrompt} ➔</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 💬 6. SALES OBJECTION HANDLING PLAYBOOK */}
      {(mobileSection === 'all' || mobileSection === 'playbook') && (
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950/90 border border-indigo-500/30 shadow-xl space-y-4 relative overflow-hidden">
          
          <div className="flex items-center gap-2.5 sm:gap-3.5 pb-3 border-b border-white/10">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white">
                💬 Sales Objection Handling Playbook (สคริปต์พิชิตใจฝ่ายจัดซื้อ)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300/90 mt-0.5">
                เทคนิคการตอบคำถามและแก้ข้อโต้แย้งยอดฮิตเมื่อเข้าพบโรงงานลูกค้า
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SALES_OBJECTIONS.map((obj, idx) => (
              <div
                key={obj.id}
                onClick={() => setActiveObjection(activeObjection === idx ? null : idx)}
                className={`p-4 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer space-y-2.5 shadow-lg ${
                  activeObjection === idx
                    ? 'bg-slate-900/90 border-indigo-400/60 shadow-indigo-500/20'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${obj.color}`}>
                    {obj.tag}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ข้อที่ {obj.id}</span>
                </div>

                <h4 className="text-xs font-bold text-white leading-snug">
                  {obj.question}
                </h4>

                <div className="pt-2 border-t border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 block">💡 {obj.responseTitle}:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    {obj.script}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Geographical Factory Distribution in Samut Prakan */}
      {(mobileSection === 'all' || mobileSection === 'districts') && (
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-xl space-y-4 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>การกระจายตัวของโรงงาน 989 แห่งใน 6 อำเภอ (Samut Prakan Hub)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                เลือกอำเภอเพื่อเข้าดูพิกัดโรงงานและวางแผนเส้นทางพบลูกค้าในวันเดียว
              </p>
            </div>
            <span className="text-[11px] text-amber-300 font-mono bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-400/30 self-start sm:self-auto">
              6 อำเภอเป้าหมาย
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISTRICT_METRICS.map((dist, idx) => (
              <div key={idx} className="p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-slate-950/70 border border-white/10 space-y-2 hover:border-cyan-400/30 transition shadow-lg flex flex-col justify-between">
                <div className="space-y-1.5">
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

                {onNavigateToMarketplace && (
                  <button
                    onClick={() => onNavigateToMarketplace(dist.district)}
                    className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer mt-2"
                  >
                    <span>ดู {dist.count} โรงงาน อ.{dist.district} ➔</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Business Case & ROI Pitch */}
      {(mobileSection === 'all' || mobileSection === 'strategy') && (
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-slate-950/90 border border-amber-400/30 shadow-xl space-y-4 relative overflow-hidden">
          
          <div className="flex items-center gap-2.5 sm:gap-3.5 pb-3 border-b border-white/10">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white">
                💡 ตัวเลขความคุ้มค่าในการเจาะตลาด (Business Case & ROI)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300/90 mt-0.5">
                แบบจำลองผลตอบแทนจากการส่งทีมขายเข้าเจาะตลาด 989 โรงงานในระบบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-cyan-300 font-bold block">1. ฐานลูกค้าพร้อมเข้าพบ</span>
              <div className="text-xl font-black text-white font-mono">989 โรงงาน</div>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                เซลส์ไม่ต้องเสียเวลาค้นหาเอง มีพิกัดโรงงาน เบอร์โทร และระยะทาง GPS พร้อมวางแผนแวะพบวันละ 4-6 โรงงาน
              </p>
            </div>

            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-amber-300 font-bold block">2. ปิดลูกค้าใหม่เพียง 1% - 2%</span>
              <div className="text-xl font-black text-amber-300 font-mono">10 - 20 โรงงานใหม่</div>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                หากปิดลูกค้าโรงงานแปรรูปพลาสติกได้เพียง 10-20 ราย ยอดซื้อเฉลี่ย 15-30 ตัน/โรงงาน/เดือน
              </p>
            </div>

            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-emerald-300 font-bold block">3. ยอดขายใหม่ที่สร้างได้ (Revenue)</span>
              <div className="text-xl font-black text-emerald-300 font-mono">5 - 20 ล้านบาท/ด.</div>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                คิดเป็นยอดขายใหม่ <strong>60 - 240 ล้านบาทต่อปี</strong> คืนทุนค่าระบบซอฟต์แวร์ทันทีตั้งแต่เดือนแรก
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
