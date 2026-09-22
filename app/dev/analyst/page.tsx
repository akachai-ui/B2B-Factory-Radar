'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Factory,
  Truck,
  HardHat,
  Cpu,
  ShoppingBag,
  Briefcase,
  Layers,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Crown,
  MapPin,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Database,
  Terminal,
  Code2,
  CheckCircle2,
  Target,
  FileSpreadsheet,
  Handshake,
  ArrowRightLeft,
  Boxes,
  Compass,
  PhoneCall,
  Flame,
  Award,
  BookOpen,
  Send,
  Users,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SectorSummary {
  cluster_key: string;
  total: string;
  avg_capital: string;
  tier_enterprise: string;
  tier_large: string;
  tier_mid: string;
  tier_sme: string;
}

interface ProvinceSummary {
  province: string;
  count: string;
}

interface TSICSubcode {
  parent_2digit: string;
  tsic_code: string;
  objective: string;
  count: string;
}

const TSIC_DIVISIONS = [
  { code: 'ALL', label: 'ทุกรหัส TSIC (ทั้งหมด)', icon: '🌐' },
  { code: '10', label: '10: ผลิตภัณฑ์อาหาร', icon: '🍞' },
  { code: '11', label: '11: ผลิตภัณฑ์เครื่องดื่ม', icon: '🥤' },
  { code: '13', label: '13: การผลิตสิ่งทอ', icon: '🧵' },
  { code: '14', label: '14: การผลิตเครื่องแต่งกาย', icon: '👕' },
  { code: '16', label: '16: ไม้และผลิตภัณฑ์จากไม้', icon: '🪵' },
  { code: '17', label: '17: กระดาษและผลิตภัณฑ์กระดาษ', icon: '📦' },
  { code: '18', label: '18: การพิมพ์และทำซ้ำสิ่งบันทึก', icon: '🖨️' },
  { code: '20', label: '20: สารเคมีและเคมีภัณฑ์', icon: '🧪' },
  { code: '21', label: '21: ยาและเวชภัณฑ์', icon: '💊' },
  { code: '22', label: '22: ผลิตภัณฑ์ยางและพลาสติก', icon: '🧴' },
  { code: '23', label: '23: แก้ว ซีเมนต์ & แร่อโลหะ', icon: '🧱' },
  { code: '24', label: '24: โลหะขั้นมูลฐาน', icon: '🔩' },
  { code: '25', label: '25: ผลิตภัณฑ์โลหะประดิษฐ์', icon: '⚙️' },
  { code: '26', label: '26: อิเล็กทรอนิกส์ & คอมพิวเตอร์', icon: '💡' },
  { code: '27', label: '27: อุปกรณ์ไฟฟ้า', icon: '⚡' },
  { code: '28', label: '28: เครื่องจักรกลและเครื่องมือ', icon: '🏭' },
  { code: '29', label: '29: ยานยนต์ & ชิ้นส่วนรถยนต์', icon: '🚗' },
  { code: '30', label: '30: อุปกรณ์ขนส่งอื่นๆ', icon: '🚢' },
  { code: '31', label: '31: ผลิตเฟอร์นิเจอร์', icon: '🪑' },
  { code: '33', label: '33: ซ่อมบำรุง & ติดตั้งเครื่องจักร', icon: '🔧' },
  { code: '41', label: '41: การก่อสร้างอาคาร', icon: '🏗️' },
  { code: '42', label: '42: งานวิศวกรรมโยธา', icon: '🚧' },
  { code: '43', label: '43: งานติดตั้งระบบอาคาร', icon: '🔨' },
  { code: '46', label: '46: การขายส่ง (Wholesale/B2B)', icon: '🏬' },
  { code: '47', label: '47: การขายปลีก (Retail)', icon: '🛒' },
  { code: '49', label: '49: ขนส่งทางบกและท่อลำเลียง', icon: '🚚' },
  { code: '52', label: '52: คลังสินค้า & กิจกรรมสนับสนุนขนส่ง', icon: '📦' },
  { code: '55', label: '55: ที่พักแรม / โรงแรม', icon: '🏨' },
  { code: '56', label: '56: บริการอาหารและเครื่องดื่ม', icon: '🍽️' },
  { code: '62', label: '62: ซอฟต์แวร์ & วางระบบไอที', icon: '💻' },
  { code: '68', label: '68: อสังหาริมทรัพย์', icon: '🏢' },
];

const MATCHING_INDUSTRIES = [
  { key: 'FOOD', label: 'โรงงานอาหาร & เครื่องดื่ม', icon: '🍞', color: 'from-amber-500 to-orange-500' },
  { key: 'PACKAGING', label: 'โรงงานบรรจุภัณฑ์ & สิ่งพิมพ์', icon: '📦', color: 'from-blue-500 to-cyan-500' },
  { key: 'METALS', label: 'โรงงานโลหะ & แปรรูปโครงสร้าง', icon: '⚙️', color: 'from-slate-400 to-slate-600' },
  { key: 'PLASTICS', label: 'โรงงานพลาสติก & ยาง', icon: '🧴', color: 'from-emerald-500 to-teal-500' },
  { key: 'CONSTRUCTION', label: 'ผู้รับเหมาก่อสร้าง & งานระบบ', icon: '🏗️', color: 'from-yellow-500 to-amber-600' },
  { key: 'LOGISTICS', label: 'ผู้ให้บริการขนส่ง & คลังสินค้า', icon: '🚚', color: 'from-sky-500 to-blue-600' },
];

export default function DevAnalystPage() {
  const [activeTab, setActiveTab] = useState<'gtm_46693' | 'target_factory' | 'tsic' | 'matching'>('gtm_46693');

  // GTM TSIC 46693 Prospects States
  const [prospectsTier, setProspectsTier] = useState<string>('ALL');
  const [prospectsProvince, setProspectsProvince] = useState<string>('ALL');
  const [prospectsQuery, setProspectsQuery] = useState<string>('');
  const [prospectsList, setProspectsList] = useState<any[]>([]);
  const [prospectsStats, setProspectsStats] = useState<any>(null);
  const [prospectsTotal, setProspectsTotal] = useState<number>(0);
  const [prospectsPage, setProspectsPage] = useState<number>(1);
  const [isLoadingProspects, setIsLoadingProspects] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);

  // Target Factory Pool States (Dedicated Extracted Table)
  const [targetCluster, setTargetCluster] = useState<string>('ALL');
  const [targetTier, setTargetTier] = useState<string>('ALL');
  const [targetProvince, setTargetProvince] = useState<string>('ALL');
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');
  const [targetFactories, setTargetFactories] = useState<any[]>([]);
  const [targetClusterStats, setTargetClusterStats] = useState<any[]>([]);
  const [targetTotal, setTargetTotal] = useState<number>(0);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false);

  // TSIC Filter States
  const [directTsicInput, setDirectTsicInput] = useState<string>('');
  const [selectedTsic2Digit, setSelectedTsic2Digit] = useState<string>('ALL');
  const [selectedTsicCode, setSelectedTsicCode] = useState<string>('ALL');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Matchmaker States
  const [selectedIndustry, setSelectedIndustry] = useState<string>('FOOD');
  const [matchType, setMatchType] = useState<'BUYERS' | 'SUPPLIERS' | 'LOGISTICS'>('BUYERS');
  const [matchProvince, setMatchProvince] = useState<string>('ALL');
  const [matchingData, setMatchingData] = useState<any>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState<boolean>(false);

  // Data States
  const [subcodesList, setSubcodesList] = useState<TSICSubcode[]>([]);
  const [topProvinces, setTopProvinces] = useState<ProvinceSummary[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Fetch TSIC 46693 Client Prospects
  const fetchProspects46693 = async () => {
    setIsLoadingProspects(true);
    try {
      const params = new URLSearchParams({
        mode: 'prospects_46693',
        tier: prospectsTier,
        province: prospectsProvince,
        q: prospectsQuery,
        page: String(prospectsPage),
        limit: '25',
      });
      const res = await fetch(`/api/dev/analytics?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProspectsList(data.items || []);
        setProspectsTotal(data.total || 0);
        if (data.stats) {
          setProspectsStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Fetch prospects 46693 error:', e);
    } finally {
      setIsLoadingProspects(false);
    }
  };

  // Fetch Extracted Target Factory Leads
  const fetchTargetFactories = async () => {
    setIsLoadingTarget(true);
    try {
      const params = new URLSearchParams({
        mode: 'target_leads',
        cluster: targetCluster,
        tier: targetTier,
        province: targetProvince,
        q: targetSearchQuery,
        page: String(targetPage),
        limit: '25',
      });
      const res = await fetch(`/api/dev/analytics?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTargetFactories(data.items || []);
        setTargetTotal(data.total || 0);
        if (data.cluster_stats) {
          setTargetClusterStats(data.cluster_stats);
        }
      }
    } catch (e) {
      console.error('Fetch target factories error:', e);
    } finally {
      setIsLoadingTarget(false);
    }
  };

  // Fetch Partner Match Data
  const fetchMatching = async () => {
    setIsLoadingMatch(true);
    try {
      const params = new URLSearchParams({
        mode: 'matching',
        industry: selectedIndustry,
        match_type: matchType,
        province: matchProvince,
      });
      const res = await fetch(`/api/dev/analytics?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMatchingData(data);
      }
    } catch (e) {
      console.error('Fetch matching error:', e);
    } finally {
      setIsLoadingMatch(false);
    }
  };

  // Fetch TSIC Taxonomy & Subcodes Tree
  const fetchTree = async () => {
    try {
      const res = await fetch('/api/dev/analytics?mode=tsic_tree');
      const data = await res.json();
      if (data.success) {
        setSubcodesList(data.subcodes || []);
      }
    } catch (e) {
      console.error('Fetch tree error:', e);
    }
  };

  // Fetch Top Provinces
  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dev/analytics?mode=summary');
      const data = await res.json();
      if (data.success) {
        setTopProvinces(data.top_provinces || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Companies List based on TSIC filter
  const fetchCompanies = async () => {
    setIsLoadingList(true);
    try {
      const activeTsic = directTsicInput.trim() ? directTsicInput.trim() : selectedTsicCode;
      const params = new URLSearchParams({
        mode: 'list',
        tsic_2digit: directTsicInput.trim() ? 'ALL' : selectedTsic2Digit,
        tsic_code: activeTsic,
        province: selectedProvince,
        tier: selectedTier,
        q: searchQuery,
        page: String(page),
        limit: '25',
      });
      const res = await fetch(`/api/dev/analytics?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCompaniesList(data.items || []);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTree();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'gtm_46693') {
      fetchProspects46693();
    }
  }, [activeTab, prospectsTier, prospectsProvince, prospectsPage]);

  useEffect(() => {
    if (activeTab === 'target_factory') {
      fetchTargetFactories();
    }
  }, [activeTab, targetCluster, targetTier, targetProvince, targetPage]);

  useEffect(() => {
    if (activeTab === 'matching') {
      fetchMatching();
    }
  }, [activeTab, selectedIndustry, matchType, matchProvince]);

  useEffect(() => {
    if (activeTab === 'tsic') {
      fetchCompanies();
    }
  }, [activeTab, selectedTsic2Digit, selectedTsicCode, directTsicInput, selectedProvince, selectedTier, page]);

  // Export 46693 Prospects to Excel
  const handleExportProspectsExcel = () => {
    if (!prospectsList || prospectsList.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      prospectsList.map((c: any) => ({
        'ชื่อบริษัทผู้ค้าส่ง (ลูกค้าเป้าหมาย)': c.company_name,
        'เลขทะเบียนนิติบุคคล': c.tax_id,
        'รหัส TSIC': c.tsic_code,
        'ทุนจดทะเบียน (บาท)': c.registered_capital,
        'วัตถุประสงค์ธุรกิจ': c.objective,
        'ที่อยู่': c.address || '-',
        'ตำบล': c.subdistrict || '-',
        'อำเภอ': c.district || '-',
        'จังหวัด': c.province || '-',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospects_TSIC_46693');
    XLSX.writeFile(wb, `Target_Clients_TSIC_46693_${Date.now()}.xlsx`);
  };

  // Export Target Factories to Excel
  const handleExportTargetExcel = () => {
    if (!targetFactories || targetFactories.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      targetFactories.map((c: any) => ({
        'ชื่อโรงงาน / นิติบุคคล': c.company_name,
        'เลขทะเบียนนิติบุคคล': c.tax_id,
        'กลุ่มโรงงานเป้าหมาย': c.target_group_label,
        'วัตถุดิบที่ต้องการซื้อ': c.raw_materials_needed,
        'รหัส TSIC': c.tsic_code,
        'ทุนจดทะเบียน (บาท)': c.registered_capital,
        'ขนาดทุน': c.capital_tier,
        'วัตถุประสงค์ธุรกิจ': c.objective,
        'ตำบล': c.subdistrict || '-',
        'อำเภอ': c.district || '-',
        'จังหวัด': c.province || '-',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Target_Factory_Buyers');
    XLSX.writeFile(wb, `Target_Factory_Buyers_${targetCluster}_${Date.now()}.xlsx`);
  };

  // Filtered 5-digit subcodes for current 2-digit selection
  const available5DigitSubcodes = useMemo(() => {
    if (selectedTsic2Digit === 'ALL') {
      return subcodesList.slice(0, 50);
    }
    return subcodesList.filter((s) => s.parent_2digit === selectedTsic2Digit);
  }, [subcodesList, selectedTsic2Digit]);

  // Export Matched Companies to Excel
  const handleExportMatchedExcel = () => {
    if (!matchingData || !matchingData.matched_companies) return;
    const ws = XLSX.utils.json_to_sheet(
      matchingData.matched_companies.map((c: any) => ({
        'ชื่อบริษัทคู่ค้า': c.company_name,
        'เลขทะเบียนนิติบุคคล': c.tax_id,
        'รหัส TSIC': c.tsic_code,
        'ทุนจดทะเบียน (บาท)': c.registered_capital,
        'ประเภทธุรกิจ': c.objective,
        'ตำบล': c.subdistrict || '-',
        'อำเภอ': c.district || '-',
        'จังหวัด': c.province || '-',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'B2B_Partner_Match');
    XLSX.writeFile(wb, `B2B_Match_${selectedIndustry}_${matchType}_${Date.now()}.xlsx`);
  };

  // Export TSIC Companies to Excel
  const handleExportTSICExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      companiesList.map((c) => ({
        'ชื่อบริษัท / นิติบุคคล': c.company_name,
        'เลขทะเบียนนิติบุคคล': c.tax_id,
        'รหัส TSIC': c.tsic_code,
        'ทุนจดทะเบียน (บาท)': c.registered_capital,
        'วัตถุประสงค์ธุรกิจ': c.objective,
        'ตำบล': c.subdistrict || '-',
        'อำเภอ': c.district || '-',
        'จังหวัด': c.province || '-',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TSIC_Segment_Leads');
    XLSX.writeFile(wb, `TSIC_${selectedTsic2Digit}_${Date.now()}.xlsx`);
  };

  // Cold Call Pitch Script Text
  const pitchScriptText = `สวัสดีครับ/ค่ะ ขอสายฝ่ายขายหรือผู้บริหารฝ่ายจัดซื้อครับ
ทางเราโทรจากทีมพัฒนาระบบ 'B2B Factory Radar' ครับ

ทราบว่าทาง [ชื่อบริษัท] ดำเนินธุรกิจค้าส่งเม็ดพลาสติก/ยางพารา (TSIC 46693) ทางเราได้พัฒนาระบบคลังข้อมูล 'โรงงานผู้ซื้อเม็ดพลาสติกและยางพารา 4,088 แห่งทั่วไทย' ที่คัดกรองเฉพาะโรงงานที่เปิดดำเนินกิจการอยู่จริง 100%

ระบบของเราช่วยให้ทีมเซลส์ของคุณ:
1. รู้ทันทีว่าโรงงานไหนใช้เม็ด PP, PE, PET, ABS, POM, หรือยาง EPDM
2. มีพิกัดโรงงานและแผนที่เจาะลึก 10 คลัสเตอร์ (ยานยนต์, ฉีดพลาสติก, บรรจุภัณฑ์, เครื่องใช้ไฟฟ้า ฯลฯ)
3. ลดเวลาเซลส์วิ่งหาลูกค้ารายใหม่ลงกว่า 70% และเพิ่มยอดขายทันที

อยากขออนุญาตส่งตัวอย่างรายชื่อโรงงาน 50 รายการแรกในจังหวัดของคุณให้ทดลองใช้ฟรีทางอีเมลก่อนได้ไหมครับ?`;

  const copyPitchScript = () => {
    navigator.clipboard.writeText(pitchScriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Target className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>GTM Sales War Room & Strategic Target ICP Plan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🎯 แผนการขาย & บุกตลาดลูกค้ากลุ่ม 46693</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              TSIC 46693
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            วิเคราะห์ตลาดลูกค้าเป้าหมาย (ผู้ค้าส่งเม็ดพลาสติกและยางพารา 653 ราย) เพื่อนำเสนอขาย &quot;ระบบฐานข้อมูลโรงงานผู้ซื้อ 4,088 แห่ง&quot;
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span>กลับหน้าหลัก Factory Radar</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 gap-1.5">
        <button
          onClick={() => setActiveTab('gtm_46693')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'gtm_46693'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>1. 🎯 แผนการขาย & 653 ลูกค้าเป้าหมาย (TSIC 46693 GTM Plan)</span>
        </button>

        <button
          onClick={() => setActiveTab('target_factory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'target_factory'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Factory className="w-4 h-4 text-cyan-300" />
          <span>2. 🏭 คลังโรงงาน 4,088 แห่งที่เราจะนำไปขาย (Factory Buyers Asset)</span>
        </button>

        <button
          onClick={() => setActiveTab('tsic')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'tsic'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. 🔍 ค้นหาตามรหัส TSIC ทั่วประเทศ (TSIC Explorer)</span>
        </button>

        <button
          onClick={() => setActiveTab('matching')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'matching'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>4. 🤝 ระบบจับคู่ Supply Chain Matchmaker</span>
        </button>
      </div>

      {/* TAB 1: GTM Plan & 653 Prospects for TSIC 46693 */}
      {activeTab === 'gtm_46693' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Executive Strategy Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Who & What */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Crown className="w-24 h-24 text-amber-400" />
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>กลุ่มลูกค้าที่เราจะขาย (Target Client ICP)</span>
              </div>
              <h2 className="text-xl font-black text-white">
                🏢 รหัส TSIC 46693: ผู้ค้าส่งเม็ดพลาสติก & ยางพารา
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                บริษัทนำเข้าและค้าส่งเม็ดพลาสติก (PP, PE, PET, PVC, ABS, PS, PC) และยางพาราขั้นต้นที่มีเงินทุนสูงและมีทีมเซลส์วิ่งหาโรงงานผู้ซื้ออยู่ตลอดเวลา
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">ขนาดตลาดในไทย:</span>
                <span className="font-bold text-amber-400 text-sm">653 บริษัท (คัดกรองแล้ว)</span>
              </div>
            </div>

            {/* Card 2: The Value Proposition */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Flame className="w-24 h-24 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>สิ่งที่เรานำเสนอขาย (Core Value Proposition)</span>
              </div>
              <h2 className="text-xl font-black text-white">
                📦 ระบบ Factory Radar + 4,088 โรงงานผู้ซื้อ
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                คลังข้อมูลโรงงานผลิตที่เปิดดำเนินกิจการอยู่จริง 100% พร้อมระบุ <strong className="text-cyan-300">ชนิดเม็ดพลาสติกที่ต้องใช้</strong>, พิกัดโรงงาน, ทุนจดทะเบียน และข้อมูล DBD เจาะจง 10 อุตสาหกรรม
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">ฐานข้อมูลโรงงานพร้อมใช้:</span>
                <span className="font-bold text-cyan-400 text-sm">4,088 โรงงาน 10 คลัสเตอร์</span>
              </div>
            </div>

            {/* Card 3: Market Metrics */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>ความพร้อมในการซื้อ (Capital & Buying Power)</span>
              </div>
              <h2 className="text-xl font-black text-white">
                💰 ทุนเฉลี่ย {prospectsStats ? Math.round(prospectsStats.avg_capital / 1000000).toLocaleString() : '12'} ล้านบาท
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">🏢 Enterprise (&gt;50M)</div>
                  <div className="text-sm font-bold text-emerald-400">{prospectsStats?.enterprise_count || '52'} บริษัท</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">🏬 Large (20-50M)</div>
                  <div className="text-sm font-bold text-blue-400">{prospectsStats?.large_count || '78'} บริษัท</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">🏪 Mid (5-20M)</div>
                  <div className="text-sm font-bold text-amber-400">{prospectsStats?.mid_count || '164'} บริษัท</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">🏬 SME (&lt;5M)</div>
                  <div className="text-sm font-bold text-slate-300">{prospectsStats?.sme_count || '359'} บริษัท</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Pitch Script Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>สคริปต์การโทรเปิดการขาย (Cold Calling Script for Sales Reps)</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  📞 สคริปต์สำหรับโทรหาฝ่ายบริหาร / ผู้จัดการฝ่ายขายของกลุ่ม 46693
                </h3>
              </div>

              <button
                onClick={copyPitchScript}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-md"
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'คัดลอกสคริปต์แล้ว!' : 'คัดลอกสคริปต์นำเสนอ'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {pitchScriptText}
            </div>
          </div>

          {/* Prospect Search & Filter Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  <span>รายชื่อ 653 บริษัทลูกค้าเป้าหมาย (TSIC 46693 Prospects List)</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  📋 เลือกบริษัทที่ต้องการติดต่อเพื่อนำเสนอขายระบบ
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportProspectsExcel}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Export 653 ลูกค้า (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อบริษัท / จังหวัด / วัตถุประสงค์..."
                  value={prospectsQuery}
                  onChange={(e) => setProspectsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProspects46693()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Province Filter */}
              <div>
                <select
                  value={prospectsProvince}
                  onChange={(e) => {
                    setProspectsProvince(e.target.value);
                    setProspectsPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">📍 ทุกจังหวัด (ทั่วประเทศ)</option>
                  <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                  <option value="สมุทรปราการ">สมุทรปราการ</option>
                  <option value="ชลบุรี">ชลบุรี</option>
                  <option value="ระยอง">ระยอง</option>
                  <option value="ปทุมธานี">ปทุมธานี</option>
                  <option value="นนทบุรี">นนทบุรี</option>
                  <option value="สมุทรสาคร">สมุทรสาคร</option>
                  <option value="นครปฐม">นครปฐม</option>
                  <option value="ฉะเชิงเทรา">ฉะเชิงเทรา</option>
                  <option value="พระนครศรีอยุธยา">พระนครศรีอยุธยา</option>
                  <option value="สงขลา">สงขลา</option>
                </select>
              </div>

              {/* Capital Tier Filter */}
              <div>
                <select
                  value={prospectsTier}
                  onChange={(e) => {
                    setProspectsTier(e.target.value);
                    setProspectsPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">💰 ทุกขนาดทุนจดทะเบียน</option>
                  <option value="ENTERPRISE">🏢 Enterprise (&gt; 50 ล้านบาท)</option>
                  <option value="LARGE">🏬 Large (20 - 50 ล้านบาท)</option>
                  <option value="MID">🏪 Mid (5 - 20 ล้านบาท)</option>
                  <option value="SME">🏬 SME (&lt; 5 ล้านบาท)</option>
                </select>
              </div>
            </div>

            {/* Prospects Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ชื่อบริษัทลูกค้าเป้าหมาย (ผู้ค้าส่ง 46693)</th>
                    <th className="p-3.5">เลขทะเบียนนิติบุคคล</th>
                    <th className="p-3.5">ทุนจดทะเบียน</th>
                    <th className="p-3.5">ที่ตั้ง / จังหวัด</th>
                    <th className="p-3.5">วัตถุประสงค์ธุรกิจ</th>
                    <th className="p-3.5 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingProspects ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                        กำลังโหลดรายชื่อบริษัทลูกค้าเป้าหมาย...
                      </td>
                    </tr>
                  ) : prospectsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        ไม่พบข้อมูลบริษัทตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    prospectsList.map((p) => {
                      const capital = Number(p.registered_capital || 0);
                      let tierBadge = (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          SME
                        </span>
                      );
                      if (capital >= 50000000) {
                        tierBadge = (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                            Enterprise
                          </span>
                        );
                      } else if (capital >= 20000000) {
                        tierBadge = (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold">
                            Large
                          </span>
                        );
                      } else if (capital >= 5000000) {
                        tierBadge = (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Mid
                          </span>
                        );
                      }

                      return (
                        <tr key={p.id || p.tax_id} className="hover:bg-slate-900/50 transition">
                          <td className="p-3.5 font-bold text-white max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span className="truncate">{p.company_name}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">
                            {p.tax_id}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white font-bold">
                                ฿{(capital / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                              </span>
                              {tierBadge}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span>{p.district ? `${p.district}, ` : ''}{p.province || '-'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={p.objective}>
                            {p.objective || '-'}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                const customScript = `สวัสดีครับ ขอสายผู้บริหารของ ${p.company_name} ครับ\nทางเราติดต่อจาก B2B Factory Radar มีฐานข้อมูล 4,088 โรงงานผู้ซื้อเม็ดพลาสติกและยางพาราในพื้นที่ ${p.province || 'ทั่วไทย'} อยากขออนุญาตส่งรายชื่อโรงงานตัวอย่างให้ทดลองใช้งานครับ`;
                                navigator.clipboard.writeText(customScript);
                                alert(`คัดลอกสคริปต์สำหรับ ${p.company_name} เรียบร้อย!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-[11px] font-bold border border-amber-500/30 transition cursor-pointer"
                            >
                              📞 สคริปต์โทร
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <div>
                แสดงหน้า {prospectsPage} (ทั้งหมด {prospectsTotal.toLocaleString()} บริษัท)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={prospectsPage <= 1}
                  onClick={() => setProspectsPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ก่อนหน้า
                </button>
                <button
                  disabled={prospectsList.length < 25}
                  onClick={() => setProspectsPage((prev) => prev + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Dedicated Target Factory Leads Pool (4,088 Factories) */}
      {activeTab === 'target_factory' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Target Cluster Stat Chips */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>ฐานข้อมูลสินค้าที่จะนำเสนอขาย: กลุ่มโรงงานผู้ซื้อ 4,088 แห่ง</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  🏭 คลังโรงงานผู้ซื้อเม็ดพลาสติก & ยางพารา (Target Industry Factory Assets)
                </h2>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                รวมทั้งหมด <strong className="text-cyan-300 font-bold">{targetTotal.toLocaleString()}</strong> โรงงาน
              </div>
            </div>

            {/* Cluster Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  setTargetCluster('ALL');
                  setTargetPage(1);
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  targetCluster === 'ALL'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-2 ring-blue-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">🌐 ทุกกลุ่มโรงงาน (ทั้งหมด)</div>
                <div className="text-[11px] text-slate-400 mt-1">4,088 โรงงานในระบบ</div>
              </button>

              {[
                { key: 'FURNITURE', label: '🪑 เฟอร์นิเจอร์ & ของใช้ (943)', desc: 'ซื้อเม็ด PP Block, เม็ดรีไซเคิล' },
                { key: 'HOUSEWARE_TOYS', label: '🧸 ของใช้ในครัว & ของเล่น (814)', desc: 'ซื้อเม็ด PP, PS, PVC Food Grade' },
                { key: 'PLASTIC_PACKAGING', label: '📦 บรรจุภัณฑ์ & ฟิล์ม (540)', desc: 'ซื้อเม็ด LLDPE, HDPE, PP, EPS' },
                { key: 'AUTOMOTIVE_PARTS', label: '🚗 ชิ้นส่วนยานยนต์ (537)', desc: 'Engineering Plastics, ยาง EPDM' },
                { key: 'BOTTLES_CONTAINERS', label: '🧴 ขวด/ถัง/กระปุกพลาสติก (430)', desc: 'ซื้อเม็ด PET, HDPE, PP' },
                { key: 'ELECTRICAL_APPLIANCES', label: '⚡ เครื่องใช้ไฟฟ้า (410)', desc: 'ซื้อเม็ด HIPS, ABS, PP Flame' },
                { key: 'RUBBER_BELTS_SEALS', label: '🛞 สายพาน ซีล & ยางอุตสาหกรรม (164)', desc: 'น้ำยางข้น, ยาง NBR' },
                { key: 'PLASTIC_INJECTION', label: '⚙️ ฉีดพลาสติกขึ้นรูป (124)', desc: 'ซื้อเม็ด ABS, PP, PC, POM' },
                { key: 'FOOTWEAR_SOLES', label: '👟 รองเท้า & พื้นยาง (63)', desc: 'ซื้อเม็ด EVA, ยางคอมปาวด์' },
                { key: 'PIPES_CONSTRUCTION', label: '🧱 ท่อ & ข้อต่อพลาสติก (33)', desc: 'ซื้อเม็ด PVC Resin, HDPE' },
                { key: 'TYRES_RETREAD', label: '🚙 ยางยานยนต์ & ยางหล่อ (30)', desc: 'ยางแท่ง STR20, RSS' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setTargetCluster(c.key);
                    setTargetPage(1);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    targetCluster === c.key
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-2 ring-cyan-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{c.label}</div>
                  <div className="text-[10px] text-cyan-400/80 mt-1 truncate">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Factory className="w-4 h-4" />
                  <span>รายชื่อโรงงานผู้ซื้อ (4,088 Target Buyers Database)</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  🔍 ค้นหาและกรองโรงงานตามวัตถุดิบและพื้นที่
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTargetExcel}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Export รายชื่อโรงงาน (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อโรงงาน / วัตถุดิบ (เช่น PP, PET, ยาง)..."
                  value={targetSearchQuery}
                  onChange={(e) => setTargetSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTargetFactories()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <select
                  value={targetProvince}
                  onChange={(e) => {
                    setTargetProvince(e.target.value);
                    setTargetPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">📍 ทุกจังหวัด (ทั่วประเทศ)</option>
                  <option value="สมุทรปราการ">สมุทรปราการ</option>
                  <option value="ชลบุรี">ชลบุรี</option>
                  <option value="ระยอง">ระยอง</option>
                  <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                  <option value="ปทุมธานี">ปทุมธานี</option>
                  <option value="สมุทรสาคร">สมุทรสาคร</option>
                  <option value="ฉะเชิงเทรา">ฉะเชิงเทรา</option>
                  <option value="พระนครศรีอยุธยา">พระนครศรีอยุธยา</option>
                </select>
              </div>

              <div>
                <select
                  value={targetTier}
                  onChange={(e) => {
                    setTargetTier(e.target.value);
                    setTargetPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">💰 ทุกขนาดทุนจดทะเบียน</option>
                  <option value="ENTERPRISE">🏢 Enterprise (&gt; 50 ล้านบาท)</option>
                  <option value="LARGE">🏬 Large (20 - 50 ล้านบาท)</option>
                  <option value="MID">🏪 Mid (5 - 20 ล้านบาท)</option>
                  <option value="SME">🏬 SME (&lt; 5 ล้านบาท)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ชื่อโรงงาน / นิติบุคคล</th>
                    <th className="p-3.5">กลุ่มโรงงาน</th>
                    <th className="p-3.5">วัตถุดิบที่ต้องการซื้อ</th>
                    <th className="p-3.5">ทุนจดทะเบียน</th>
                    <th className="p-3.5">จังหวัด</th>
                    <th className="p-3.5">วัตถุประสงค์ธุรกิจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingTarget ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                        กำลังโหลดข้อมูลโรงงาน...
                      </td>
                    </tr>
                  ) : targetFactories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        ไม่พบโรงงานตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    targetFactories.map((f) => (
                      <tr key={f.id || f.tax_id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5 font-bold text-white max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <Factory className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{f.company_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            TSIC: {f.tsic_code} | Tax: {f.tax_id}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {f.target_group_label || f.industry_cluster}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <span className="text-[11px] text-amber-300 font-medium">
                            {f.raw_materials_needed}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-white font-bold">
                            ฿{(Number(f.registered_capital || 0) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px]">
                          {f.province || '-'}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={f.objective}>
                          {f.objective || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <div>
                แสดงหน้า {targetPage} (ทั้งหมด {targetTotal.toLocaleString()} โรงงาน)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={targetPage <= 1}
                  onClick={() => setTargetPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ก่อนหน้า
                </button>
                <button
                  disabled={targetFactories.length < 25}
                  onClick={() => setTargetPage((prev) => prev + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TSIC Explorer & Taxonomy */}
      {activeTab === 'tsic' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Code2 className="w-4 h-4" />
                  <span>TSIC Taxonomy & National Explorer</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  🔍 ค้นหาและสำรวจนิติบุคคลตามรหัส TSIC ทั่วประเทศ
                </h3>
              </div>

              <button
                onClick={handleExportTSICExcel}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20 self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export TSIC Segment (.xlsx)</span>
              </button>
            </div>

            {/* TSIC Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="พิมพ์รหัส TSIC (เช่น 46693, 22209)..."
                  value={directTsicInput}
                  onChange={(e) => setDirectTsicInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedTsic2Digit}
                  onChange={(e) => {
                    setSelectedTsic2Digit(e.target.value);
                    setSelectedTsicCode('ALL');
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {TSIC_DIVISIONS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.icon} {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">📍 ทุกจังหวัด</option>
                  {topProvinces.map((p) => (
                    <option key={p.province} value={p.province}>
                      {p.province} ({Number(p.count).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">💰 ทุกขนาดทุน</option>
                  <option value="ENTERPRISE">Enterprise (&gt;50M)</option>
                  <option value="LARGE">Large (20-50M)</option>
                  <option value="MID">Mid (5-20M)</option>
                  <option value="SME">SME (&lt;5M)</option>
                </select>
              </div>
            </div>

            {/* TSIC Results Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ชื่อบริษัท / นิติบุคคล</th>
                    <th className="p-3.5">รหัส TSIC</th>
                    <th className="p-3.5">ทุนจดทะเบียน</th>
                    <th className="p-3.5">จังหวัด</th>
                    <th className="p-3.5">วัตถุประสงค์ธุรกิจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingList ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        กำลังค้นหาข้อมูล DBD...
                      </td>
                    </tr>
                  ) : companiesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        ไม่พบนิติบุคคลตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    companiesList.map((c) => (
                      <tr key={c.id || c.tax_id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5 font-bold text-white max-w-xs truncate">
                          {c.company_name}
                        </td>
                        <td className="p-3.5 font-mono text-emerald-400 text-[11px]">
                          {c.tsic_code}
                        </td>
                        <td className="p-3.5 font-mono text-white font-bold">
                          ฿{(Number(c.registered_capital || 0) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px]">
                          {c.province || '-'}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={c.objective}>
                          {c.objective || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <div>
                แสดงหน้า {page} (ทั้งหมด {totalCount.toLocaleString()} รายการ)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ก่อนหน้า
                </button>
                <button
                  disabled={companiesList.length < 25}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white cursor-pointer"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: B2B Matchmaker Engine */}
      {activeTab === 'matching' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Handshake className="w-4 h-4" />
              <span>B2B Value Chain Partner Matchmaker</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              🤝 เลือกอุตสาหกรรมเพื่อจับคู่ Value Chain
            </h2>

            {/* Industry Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {MATCHING_INDUSTRIES.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => setSelectedIndustry(ind.key)}
                  className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedIndustry === ind.key
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-2 ring-purple-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{ind.icon}</span>
                  <span className="text-xs font-bold leading-tight">{ind.label}</span>
                </button>
              ))}
            </div>

            {/* Match Type Selector */}
            <div className="flex items-center gap-2 pt-2">
              {[
                { type: 'BUYERS', label: '🎯 ค้นหาผู้ซื้อ (Target Buyers)' },
                { type: 'SUPPLIERS', label: '📦 ค้นหาซัพพลายเออร์ (Raw Materials / Machines)' },
                { type: 'LOGISTICS', label: '🚚 ค้นหาผู้ให้บริการขนส่ง (Logistics)' },
              ].map((m) => (
                <button
                  key={m.type}
                  onClick={() => setMatchType(m.type as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    matchType === m.type
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Matched List */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ชื่อบริษัทคู่ค้า</th>
                    <th className="p-3.5">รหัส TSIC</th>
                    <th className="p-3.5">ทุนจดทะเบียน</th>
                    <th className="p-3.5">จังหวัด</th>
                    <th className="p-3.5">ประเภทธุรกิจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingMatch ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                        กำลังจับคู่ Supply Chain...
                      </td>
                    </tr>
                  ) : !matchingData?.matched_companies || matchingData.matched_companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        ไม่พบคู่ค้าในระบบ
                      </td>
                    </tr>
                  ) : (
                    matchingData.matched_companies.map((c: any) => (
                      <tr key={c.id || c.tax_id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5 font-bold text-white max-w-xs truncate">
                          {c.company_name}
                        </td>
                        <td className="p-3.5 font-mono text-purple-400 text-[11px]">
                          {c.tsic_code}
                        </td>
                        <td className="p-3.5 font-mono text-white font-bold">
                          ฿{(Number(c.registered_capital || 0) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px]">
                          {c.province || '-'}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={c.objective}>
                          {c.objective || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
