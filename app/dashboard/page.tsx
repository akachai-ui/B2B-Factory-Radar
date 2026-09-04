'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FactoryLead, LeadStatus } from '@/lib/types';
import { INITIAL_LEADS } from '@/lib/initialData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeadStatuses, saveLeadStatus } from '@/lib/leadStatusStorage';
import { UserMenu } from '@/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CompanyOnboardingModal } from '@/components/CompanyOnboardingModal';
import { TeamManagementModal } from '@/components/TeamManagementModal';
import {
  Layers,
  MapPin,
  Search,
  Phone,
  Navigation,
  ExternalLink,
  PhoneCall,
  Calendar,
  Sparkles,
  Check,
  Copy,
  Car,
  Globe,
  Building2,
  FileText,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Zap,
  ArrowUpRight,
  Share2,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  X,
} from 'lucide-react';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Dynamically import Map component with SSR disabled
const FactoryMap = dynamic(
  () => import('@/components/FactoryMap').then((mod) => mod.FactoryMap || mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[500px] text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs sm:text-sm font-bold text-slate-300">กำลังโหลดศูนย์บัญชาการแผนที่โรงงาน...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Protect Dashboard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // Leads state from Supabase
  const [leads, setLeads] = useState<FactoryLead[]>(INITIAL_LEADS);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);

  // User Location with Live GPS auto-detection
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    speed?: number | null;
    accuracy?: number | null;
  }>({
    lat: 13.6062,
    lng: 100.6974,
    label: 'ตำแหน่งเริ่มต้น: อ.บางพลี จ.สมุทรปราการ',
  });

  // Auto-detect Live GPS immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const savedGps = localStorage.getItem('routehunter_last_gps');
      if (savedGps) {
        try {
          const parsed = JSON.parse(savedGps);
          if (parsed.lat && parsed.lng) {
            setUserLocation(parsed);
          }
        } catch (e) {}
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: '📍 พิกัดสดจาก GPS ของคุณ',
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          };
          setUserLocation(liveLoc);
          localStorage.setItem('routehunter_last_gps', JSON.stringify(liveLoc));
        },
        (err) => {
          console.warn('Auto GPS detection error:', err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Today's Route State (List of selected factories in order)
  const [todayRoute, setTodayRoute] = useState<FactoryLead[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState<boolean>(true);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [leadStatuses, setLeadStatuses] = useState<Record<string, { status: LeadStatus; note?: string }>>({});

  // 1. Fetch leads from Supabase on mount
  useEffect(() => {
    async function fetchDatabaseLeads() {
      try {
        const { data, error } = await supabase.from('leads').select('*');
        if (data && data.length > 0) {
          setLeads(data as FactoryLead[]);
        }
      } catch (err) {
        console.warn('Using initial leads cache:', err);
      } finally {
        setIsLoadingLeads(false);
      }
    }
    fetchDatabaseLeads();
  }, []);

  // 2. Load statuses and saved route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLeadStatuses(getLeadStatuses(user?.id || 'default'));
      try {
        const savedRoute = localStorage.getItem(`routehunter_today_route_${user?.id || 'default'}`);
        if (savedRoute) {
          const parsed = JSON.parse(savedRoute);
          if (Array.isArray(parsed)) {
            setTodayRoute(parsed);
          }
        }
      } catch (e) {
        console.warn('Error reading saved route:', e);
      }
    }
  }, [user]);

  // 3. Save route to local storage on change
  const saveRoute = (newRoute: FactoryLead[]) => {
    setTodayRoute(newRoute);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`routehunter_today_route_${user?.id || 'default'}`, JSON.stringify(newRoute));
      } catch (e) {
        console.warn('Error saving route:', e);
      }
    }
  };

  // Toggle Lead in Today's Route
  const handleToggleRouteLead = (lead: FactoryLead) => {
    const exists = todayRoute.some((item) => item.place_id === lead.place_id);
    if (exists) {
      const updated = todayRoute.filter((item) => item.place_id !== lead.place_id);
      saveRoute(updated);
    } else {
      const updated = [...todayRoute, lead];
      saveRoute(updated);
      setIsRouteDrawerOpen(true);
    }
  };

  const handleRemoveFromRoute = (placeId: string) => {
    const updated = todayRoute.filter((item) => item.place_id !== placeId);
    saveRoute(updated);
  };

  const handleClearRoute = () => {
    saveRoute([]);
  };

  // Smart Route Optimizer: Nearest-Neighbor Algorithm
  const handleOptimizeRoute = () => {
    if (todayRoute.length <= 1) return;

    const unvisited = [...todayRoute];
    const optimized: FactoryLead[] = [];
    let currentLat = userLocation.lat;
    let currentLng = userLocation.lng;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistanceKm(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const [nextStop] = unvisited.splice(nearestIdx, 1);
      optimized.push(nextStop);
      currentLat = nextStop.lat;
      currentLng = nextStop.lng;
    }

    saveRoute(optimized);
    setCopyToast('⚡ จัดลำดับเส้นทางที่สั้นและประหยัดน้ำมันที่สุดเรียบร้อยแล้ว!');
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Generate Multi-Stop Google Maps Navigation URL
  const googleMapsRouteUrl = useMemo(() => {
    if (todayRoute.length === 0) return '';
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${todayRoute[todayRoute.length - 1].lat},${todayRoute[todayRoute.length - 1].lng}`;
    
    if (todayRoute.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }

    const waypoints = todayRoute
      .slice(0, todayRoute.length - 1)
      .map((lead) => `${lead.lat},${lead.lng}`)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
  }, [todayRoute, userLocation]);

  // Calculate Total Estimated Distance for Route
  const totalRouteDistanceKm = useMemo(() => {
    if (todayRoute.length === 0) return 0;
    let total = 0;
    let prevLat = userLocation.lat;
    let prevLng = userLocation.lng;

    todayRoute.forEach((stop) => {
      total += calculateDistanceKm(prevLat, prevLng, stop.lat, stop.lng);
      prevLat = stop.lat;
      prevLng = stop.lng;
    });

    return total;
  }, [todayRoute, userLocation]);

  // Copy Route Summary to Clipboard (for LINE / Manager Reporting)
  const handleCopyRouteSummary = () => {
    if (todayRoute.length === 0) return;
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    let text = `🚗 แผนการออกพบลูกค้าวันนี้ (${dateStr})
🏢 ผู้รับผิดชอบ: ${profile?.full_name || user?.email}
`;
    text += `📍 จำนวนเป้าหมาย: ${todayRoute.length} โรงงาน | ระยะทางรวม ~ ${totalRouteDistanceKm.toFixed(1)} กม.

`;

    todayRoute.forEach((stop, index) => {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
      text += `จุดที่ ${index + 1}: ${stop.name}
`;
      text += `   📌 พิกัด: ${stop.subdistrict} • ${stop.district}
`;
      text += `   📞 เบอร์โทร: ${stop.phone || '-'}
`;
      text += `   🚗 ห่างจากจุดเริ่ม: ~${dist.toFixed(1)} km

`;
    });

    text += `🗺️ ลิงก์นำทาง Google Maps:\n${googleMapsRouteUrl}`;

    navigator.clipboard.writeText(text);
    setCopyToast('📋 คัดลอกสรุปรูทวันนี้ลงคลิปบอร์ดแล้ว (พร้อมส่งต่อใน LINE)!');
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Live GPS Tracking Toggle
  const handleToggleLiveTracking = () => {
    if (!isLiveTracking) {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: '📍 พิกัดสดจาก GPS ของคุณ',
              speed: pos.coords.speed,
              accuracy: pos.coords.accuracy,
            });
            setIsLiveTracking(true);
          },
          (err) => {
            alert('ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิดสิทธิ์ Location ในเบราว์เซอร์');
          },
          { enableHighAccuracy: true }
        );
      }
    } else {
      setIsLiveTracking(false);
    }
  };

  // District list
  const districts = ['ALL', 'บางพลี', 'เมืองสมุทรปราการ', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางบ่อ', 'บางเสาธง'];

  // Status counts for Pipeline Badges
  const routeLeadIds = useMemo(() => todayRoute.map((l) => l.place_id), [todayRoute]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = lead.name?.toLowerCase().includes(query);
        const matchRoad = lead.road?.toLowerCase().includes(query);
        const matchPhone = lead.phone?.toLowerCase().includes(query);
        const matchDist = lead.district?.toLowerCase().includes(query);
        if (!matchName && !matchRoad && !matchPhone && !matchDist) return false;
      }

      // 2. District filter (Matches both "บางพลี" and "อำเภอบางพลี")
      if (selectedDistrict !== 'ALL') {
        const leadDist = (lead.district || '').replace('อำเภอ', '').replace('อ.', '').trim();
        const targetDist = selectedDistrict.replace('อำเภอ', '').replace('อ.', '').trim();
        if (leadDist !== targetDist && !lead.district?.includes(targetDist)) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatus === 'IN_ROUTE') {
        if (!routeLeadIds.includes(lead.place_id)) return false;
      } else if (selectedStatus !== 'ALL') {
        const leadSt = leadStatuses[lead.place_id]?.status || 'NEW';
        if (leadSt !== selectedStatus) return false;
      }

      // 4. Radius filter
      if (selectedRadius !== 'ALL') {
        const radKm = parseFloat(selectedRadius);
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
        if (dist > radKm) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedDistrict, selectedStatus, selectedRadius, userLocation, routeLeadIds, leadStatuses]);

  // Pipeline count summary
  const pipelineCounts = useMemo(() => {
    const counts = { ALL: leads.length, NEW: 0, CONTACTED: 0, MEETING: 0, QUOTED: 0, WON: 0, IN_ROUTE: todayRoute.length };
    leads.forEach((l) => {
      const st = leadStatuses[l.place_id]?.status || 'NEW';
      if (st === 'NEW') counts.NEW++;
      else if (st === 'CONTACTED') counts.CONTACTED++;
      else if (st === 'MEETING') counts.MEETING++;
      else if (st === 'QUOTED') counts.QUOTED++;
      else if (st === 'WON') counts.WON++;
    });
    return counts;
  }, [leads, leadStatuses, todayRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-300">กำลังเข้าสู่ Sales Route Command Center...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-[#0b0f19]/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => router.push('/')}>
            <div className="relative flex items-center justify-center h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Car className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">RouteHunter</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Route Command Center
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                📍 สมุทรปราการ 6 อำเภอ • 989 โรงงานเป้าหมาย (พิกัดประตูทางเข้า 100%)
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition cursor-pointer group"
              title="คลิกเพื่อตั้งชื่อหรือแก้ไขข้อมูลบริษัทของคุณ"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[130px] font-bold text-white">
                {profile?.company_name || '🏢 ตั้งชื่อบริษัทของคุณ'}
              </span>
              <span className="text-[10px] text-amber-400 font-bold group-hover:underline">✎ แก้ไข</span>
            </button>

            <button
              onClick={() => setIsRouteDrawerOpen(!isRouteDrawerOpen)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                todayRoute.length > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>รูทวันนี้</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-white text-[10px] font-bold">
                {todayRoute.length}
              </span>
            </button>

            <LanguageSwitcher />

            <UserMenu
              onOpenAuth={() => {}}
              onOpenCompanyProfile={() => setIsCompanyModalOpen(true)}
              onOpenTeamManagement={() => setIsTeamModalOpen(true)}
            />
          </div>

        </div>
      </header>

      {/* 2. PIPELINE & STATUS BAR */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🏢 ทั้งหมด</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.ALL}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('IN_ROUTE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'IN_ROUTE'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'bg-slate-900 text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <span>🚗 รูทที่เลือกวันนี้</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.IN_ROUTE}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('NEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'NEW'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚪ โรงงานใหม่</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.NEW}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('CONTACTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'CONTACTED'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🟡 โทรแล้ว</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.CONTACTED}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('MEETING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'MEETING'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🟣 นัดเข้าพบ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.MEETING}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('QUOTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'QUOTED'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🔵 เสนอราคา</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.QUOTED}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('WON')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'WON'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🏆 ลูกค้าประจำ (Won)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {pipelineCounts.WON}
            </span>
          </button>

        </div>
      </div>

      {/* 3. SEARCH & SMART FILTER BAR */}
      <div className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-2.5 justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อโรงงาน, เบอร์โทร, ถนน, นิคมฯ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* District & Radius Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            
            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-slate-600 transition"
            >
              <option value="ALL">🌐 ทุกอำเภอ (6 อำเภอ)</option>
              <option value="บางพลี">📍 บางพลี (326 โรงงาน)</option>
              <option value="เมืองสมุทรปราการ">📍 เมืองสมุทรปราการ (276 โรงงาน)</option>
              <option value="พระประแดง">📍 พระประแดง (112 โรงงาน)</option>
              <option value="พระสมุทรเจดีย์">📍 พระสมุทรเจดีย์ (111 โรงงาน)</option>
              <option value="บางบ่อ">📍 บางบ่อ (83 โรงงาน)</option>
              <option value="บางเสาธง">📍 บางเสาธง (81 โรงงาน)</option>
            </select>

            {/* Radius Filter */}
            <select
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-slate-600 transition"
            >
              <option value="ALL">🚗 ทุกระยะทาง</option>
              <option value="3">⚡ รัศมี 3 กม.</option>
              <option value="5">⚡ รัศมี 5 กม.</option>
              <option value="10">⚡ รัศมี 10 กม.</option>
              <option value="20">⚡ รัศมี 20 กม.</option>
            </select>

            {/* Live GPS Toggle Button */}
            <button
              onClick={handleToggleLiveTracking}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isLiveTracking
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isLiveTracking ? 'GPS สดเปิดอยู่' : 'เปิด GPS นำทาง'}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Copy Toast Alert */}
      {copyToast && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-center text-xs font-black shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-top duration-150 sticky top-14 z-30">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* 4. MAIN SPLIT WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: INTERACTIVE RADAR MAP */}
        <div className={`transition-all ${isRouteDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[620px] sm:h-[720px] relative">
            
            {/* Map Header Status */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>แสดงเป้าหมาย: <strong className="text-white">{filteredLeads.length}</strong> จาก 989 โรงงาน</span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                ⚡ คลิกที่หมุดเพื่อดูข้อมูลและกด <strong className="text-amber-400">[+ เพิ่มเข้ารูทวันนี้]</strong>
              </div>
            </div>

            {/* Leaflet Map Component */}
            <div className="flex-1 relative">
              <FactoryMap
                leads={filteredLeads}
                userLocation={userLocation}
                isLiveTracking={isLiveTracking}
                onToggleLiveTracking={handleToggleLiveTracking}
                selectedDistrict={selectedDistrict}
                selectedSubdistrict={selectedSubdistrict}
                onDistrictChange={setSelectedDistrict}
                onSubdistrictChange={setSelectedSubdistrict}
                subdistrictsList={[]}
                isLoggedIn={true}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedRadius={selectedRadius}
                onRadiusChange={setSelectedRadius}
                routeLeadIds={routeLeadIds}
                todayRoute={todayRoute}
                onToggleRouteLead={handleToggleRouteLead}
                onUpdateUserLocation={setUserLocation}
              />
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: TODAY'S SALES ROUTE PLANNER DRAWER */}
        {isRouteDrawerOpen && (
          <div className="lg:col-span-4 flex flex-col h-[620px] sm:h-[720px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Route Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>แผนเส้นทางขายวันนี้</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                      {todayRoute.length} จุด
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ระยะทางรวมโดยประมาณ: <strong className="text-amber-300">~{totalRouteDistanceKm.toFixed(1)} km</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRouteDrawerOpen(false)}
                className="h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-xs transition cursor-pointer lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route Action Controls */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
              <button
                onClick={handleOptimizeRoute}
                disabled={todayRoute.length <= 1}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="เรียงลำดับจุดแวะจากใกล้ไปไกลที่สุดอัตโนมัติ"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>จัดเส้นทางอัตโนมัติ</span>
              </button>

              <button
                onClick={handleClearRoute}
                disabled={todayRoute.length === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer disabled:opacity-40"
                title="ล้างรายการรูททั้งหมด"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* List of Ordered Route Stops */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
              
              {/* Start Location */}
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                  📍
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-[11px]">จุดเริ่มต้นการเดินทาง</div>
                  <div className="text-[10px] text-slate-400 truncate">{userLocation.label}</div>
                </div>
              </div>

              {todayRoute.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <div className="h-12 w-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">ยังไม่มีโรงงานในรูทวันนี้</p>
                  <p className="text-[11px] text-slate-500">
                    คลิกที่หมุดบนแผนที่ หรือค้นหาโรงงาน แล้วกดปุ่ม <strong>[+ เพิ่มเข้ารูทวันนี้]</strong>
                  </p>
                </div>
              ) : (
                todayRoute.map((stop, index) => {
                  const distFromPrev = calculateDistanceKm(
                    index === 0 ? userLocation.lat : todayRoute[index - 1].lat,
                    index === 0 ? userLocation.lng : todayRoute[index - 1].lng,
                    stop.lat,
                    stop.lng
                  );

                  return (
                    <div
                      key={stop.place_id || index}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-black text-white text-xs leading-snug line-clamp-1">{stop.name}</h4>
                            <p className="text-[10px] text-slate-400">{stop.subdistrict} • {stop.district}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFromRoute(stop.place_id)}
                          className="h-6 w-6 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                          title="ลบออกจากรูท"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Distance & Phone Quick Call */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                        <span className="text-amber-300 font-bold">🚗 ห่าง ~{distFromPrev.toFixed(1)} km</span>
                        {stop.phone && (
                          <a
                            href={`tel:${stop.phone}`}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{stop.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* Route Drawer Bottom Actions */}
            {todayRoute.length > 0 && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                
                {/* Google Maps Multi-Stop Navigation Link */}
                <a
                  href={googleMapsRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-slate-950" />
                  <span>เปิด Google Maps วิ่งนำทาง ({todayRoute.length} จุด)</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-950" />
                </a>

                {/* Copy Summary to Clipboard */}
                <button
                  onClick={handleCopyRouteSummary}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>คัดลอกสรุปรูท (ส่งไลน์/รายงานหัวหน้า)</span>
                </button>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Company Profile Modal */}
      <CompanyOnboardingModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

      {/* Team Management Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

    </div>
  );
}
