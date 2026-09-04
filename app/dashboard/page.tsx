'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FactoryLead, LeadStatus } from '@/lib/types';
import { INITIAL_LEADS } from '@/lib/initialData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { CompanyOnboardingModal } from '@/components/CompanyOnboardingModal';
import {
  Car,
  Search,
  MapPin,
  SlidersHorizontal,
  Navigation,
  Phone,
  Share2,
  Trash2,
  Zap,
  ArrowUpRight,
  X,
  ChevronUp,
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
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-12 border border-slate-800 shadow-sm flex flex-col items-center justify-center h-full min-h-[420px] text-slate-400 space-y-3">
        <div className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs sm:text-sm font-bold text-slate-300">กำลังโหลดแผนที่โรงงานสมุทรปราการ...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Protect Dashboard: redirect if not logged in
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
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Today's Route State (List of selected factories in order)
  const [todayRoute, setTodayRoute] = useState<FactoryLead[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState<boolean>(false); // default closed on small screens for max map view
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Open route drawer by default only on larger screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsRouteDrawerOpen(true);
    }
  }, []);

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

  // 2. Load saved route from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  // Save route changes
  const saveCurrentRoute = (newRoute: FactoryLead[]) => {
    setTodayRoute(newRoute);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`routehunter_today_route_${user?.id || 'default'}`, JSON.stringify(newRoute));
    }
  };

  // Toggle factory in today route
  const handleToggleRouteLead = (lead: FactoryLead) => {
    setTodayRoute((prev) => {
      const exists = prev.some((l) => l.place_id === lead.place_id);
      let updated: FactoryLead[];
      if (exists) {
        updated = prev.filter((l) => l.place_id !== lead.place_id);
      } else {
        updated = [...prev, lead];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`routehunter_today_route_${user?.id || 'default'}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Remove single factory from today route
  const handleRemoveFromRoute = (placeId: string) => {
    const updated = todayRoute.filter((l) => l.place_id !== placeId);
    saveCurrentRoute(updated);
  };

  // Clear all routes
  const handleClearRoute = () => {
    if (confirm('คุณต้องการล้างรูทการเดินทางทั้งหมดของวันนี้ใช่หรือไม่?')) {
      saveCurrentRoute([]);
    }
  };

  // TSP Nearest-Neighbor Optimizer: Sort today route stops by shortest Euclidean travel distance from current GPS
  const handleOptimizeRoute = () => {
    if (todayRoute.length < 2) return;

    let unvisited = [...todayRoute];
    const optimized: FactoryLead[] = [];
    let currentLat = userLocation.lat;
    let currentLng = userLocation.lng;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = calculateDistanceKm(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited[nearestIdx];
      optimized.push(nextStop);
      currentLat = nextStop.lat;
      currentLng = nextStop.lng;
      unvisited.splice(nearestIdx, 1);
    }

    saveCurrentRoute(optimized);
    setCopyToast('✨ จัดลำดับเส้นทางที่ประหยัดเวลาที่สุดเรียบร้อยแล้ว!');
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Generate Google Maps Multi-Stop Navigation URL
  const googleMapsRouteUrl = useMemo(() => {
    if (todayRoute.length === 0) return '#';
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${todayRoute[todayRoute.length - 1].lat},${todayRoute[todayRoute.length - 1].lng}`;
    const waypoints = todayRoute
      .slice(0, todayRoute.length - 1)
      .map((l) => `${l.lat},${l.lng}`)
      .join('|');

    if (todayRoute.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }, [todayRoute, userLocation]);

  // Copy Route Summary for LINE / Report
  const handleCopyRouteSummary = () => {
    if (todayRoute.length === 0) return;
    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    let summary = `🚗 [แผนการออกวิ่งเซลส์ RouteHunter] - ${dateStr}\n`;
    summary += `👤 ผู้รับผิดชอบ: ${profile?.full_name || user?.email?.split('@')[0]}\n`;
    summary += `🏢 บริษัท: ${profile?.company_name || 'RouteHunter Sales Team'}\n`;
    summary += `📍 จุดเริ่มต้น: ${userLocation.label}\n`;
    summary += `🎯 เป้าหมายทั้งหมด: ${todayRoute.length} โรงงาน\n`;
    summary += `------------------------------------\n`;

    todayRoute.forEach((l, idx) => {
      summary += `${idx + 1}. ${l.name}\n`;
      summary += `   • อ.${l.district || '-'} | ถนน: ${l.road || '-'}\n`;
      if (l.phone) summary += `   • โทร: ${l.phone}\n`;
    });

    summary += `------------------------------------\n`;
    summary += `🗺️ นำทาง Google Maps: ${googleMapsRouteUrl}\n`;

    navigator.clipboard.writeText(summary);
    setCopyToast('📋 คัดลอกสรุปรูทแล้ว พร้อมส่งเข้ากลุ่มไลน์!');
    setTimeout(() => setCopyToast(null), 3500);
  };

  // Toggle Live Tracking
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
  const routeLeadIds = useMemo(() => todayRoute.map((l) => l.place_id), [todayRoute]);

  // Filter leads
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

      // 2. District filter
      if (selectedDistrict !== 'ALL') {
        const leadDist = (lead.district || '').replace('อำเภอ', '').replace('อ.', '').trim();
        const targetDist = selectedDistrict.replace('อำเภอ', '').replace('อ.', '').trim();
        if (leadDist !== targetDist && !lead.district?.includes(targetDist)) {
          return false;
        }
      }

      // 3. Radius filter
      if (selectedRadius !== 'ALL') {
        const radKm = parseFloat(selectedRadius);
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
        if (dist > radKm) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedDistrict, selectedRadius, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-300">กำลังเข้าสู่ระบบวางแผนรูทขาย RouteHunter...</p>
      </div>
    );
  }

  if (!user) return null;

  // Render Route Drawer Content (reused on Desktop sidebar and Mobile bottom sheet)
  const renderRouteContent = () => (
    <div className="flex flex-col h-full">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>แผนจัดรูทวิ่งวันนี้</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {todayRoute.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">เรียงตามลำดับโรงงานที่จะเข้าพบ</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {todayRoute.length > 0 && (
            <button
              onClick={handleClearRoute}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
              title="ล้างรูททั้งหมด"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsRouteDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="ปิดแถบรูท"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {copyToast && (
        <div className="my-2 p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-bold text-center animate-in fade-in duration-150 shrink-0">
          {copyToast}
        </div>
      )}

      {/* Route Stops List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 scrollbar-thin">
        {todayRoute.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 space-y-2">
            <Car className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
            <p className="text-xs font-bold text-slate-400">ยังไม่มีโรงงานในรูทวันนี้</p>
            <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
              แตะหมุดโรงงานบนแผนที่ แล้วกด <strong>"🚗 + เพิ่มเข้ารูทวันนี้"</strong> เพื่อจัดทริป
            </p>
          </div>
        ) : (
          todayRoute.map((stop, idx) => {
            const distFromUser = calculateDistanceKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);

            return (
              <div
                key={stop.place_id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2 relative group"
              >
                {/* Top Row: Index Badge & Title */}
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition">
                      {stop.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      📍 อ.{stop.district || '-'} • ห่าง {distFromUser.toFixed(1)} กม.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromRoute(stop.place_id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="ลบออกจากรูท"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Actions (Call & Navigate) */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-900">
                  {stop.phone && (
                    <a
                      href={`tel:${stop.phone.replace(/[^0-9]/g, '')}`}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold border border-cyan-800/50 flex items-center gap-1 transition"
                      title="โทรหาโรงงาน"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>โทร {stop.phone}</span>
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition"
                    title="นำทางเฉพาะจุดนี้"
                  >
                    <Navigation className="w-2.5 h-2.5 text-amber-400" />
                    <span>นำทาง</span>
                  </a>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions */}
      {todayRoute.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
          
          {/* Auto Optimize Button */}
          {todayRoute.length >= 2 && (
            <button
              onClick={handleOptimizeRoute}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚡ จัดเรียงลำดับเส้นทางประหยัดเวลาที่สุด (AI)</span>
            </button>
          )}

          {/* Google Maps Multi-Stop Navigation */}
          <a
            href={googleMapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Navigation className="w-3.5 h-3.5 fill-slate-950" />
            <span>เปิดนำทางครบทุกจุด ({todayRoute.length} จุด) บน Google Maps</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Copy Summary to Clipboard */}
          <button
            onClick={handleCopyRouteSummary}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>คัดลอกสรุปรูท (ส่งไลน์/รายงานหัวหน้า)</span>
          </button>

        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. MOBILE-FIRST TOP NAVBAR */}
      <header className="bg-[#0b0f19]/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-2 select-none cursor-pointer shrink-0" onClick={() => router.push('/')}>
            <div className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              <Car className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight text-white">RouteHunter</span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Sales Route Planner
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden lg:inline">
                📍 สมุทรปราการ • 989 โรงงานเป้าหมาย (พิกัดประตูทางเข้า 100%)
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => setIsRouteDrawerOpen(!isRouteDrawerOpen)}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                todayRoute.length > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>รูท</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-white text-[10px] font-bold">
                {todayRoute.length}
              </span>
            </button>

            <UserMenu
              onOpenAuth={() => {}}
              onOpenCompanyProfile={() => setIsCompanyModalOpen(true)}
            />
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE: MAP & ROUTE DRAWER */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 relative">
        
        {/* MAP & FILTER SECTION */}
        <div className={`flex flex-col gap-2.5 transition-all duration-300 h-[calc(100dvh-64px)] sm:h-auto ${isRouteDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* Filter Toolbar (Mobile App Optimized Bar) */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 sm:p-3 shadow-lg flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาโรงงาน, ถนน, เบอร์โทร..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* District Filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs text-slate-200 outline-none cursor-pointer font-medium pr-1 max-w-[110px] sm:max-w-none truncate"
              >
                <option value="ALL">ทุกอำเภอ ({leads.length})</option>
                {districts.filter((d) => d !== 'ALL').map((d) => (
                  <option key={d} value={d}>
                    อ.{d}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400 shrink-0" />
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs text-slate-200 outline-none cursor-pointer font-medium pr-1"
              >
                <option value="ALL">รัศมี: ทั้งหมด</option>
                <option value="5">รัศมี 5 กม.</option>
                <option value="10">รัศมี 10 กม.</option>
                <option value="15">รัศมี 15 กม.</option>
                <option value="25">รัศมี 25 กม.</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-950/50 rounded-xl border border-slate-800/50 shrink-0 ml-auto">
              พบ <strong className="text-amber-400 font-bold">{filteredLeads.length}</strong> แห่ง
            </div>

          </div>

          {/* Map Container */}
          <div className="flex-1 min-h-[380px] sm:min-h-[520px] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl relative">
            <FactoryMap
              leads={filteredLeads}
              userLocation={userLocation}
              isLiveTracking={isLiveTracking}
              onToggleLiveTracking={handleToggleLiveTracking}
              onUpdateUserLocation={(newLoc) => setUserLocation(newLoc)}
              selectedDistrict={selectedDistrict}
              selectedSubdistrict="ALL"
              onDistrictChange={(d) => setSelectedDistrict(d)}
              onSubdistrictChange={() => {}}
              subdistrictsList={[]}
              selectedRadius={selectedRadius}
              isLoggedIn={true}
              routeLeadIds={routeLeadIds}
              todayRoute={todayRoute}
              onToggleRouteLead={handleToggleRouteLead}
            />

            {/* Floating Mobile Bottom Pill (Quick-tap when drawer is closed on mobile) */}
            {todayRoute.length > 0 && !isRouteDrawerOpen && (
              <div className="lg:hidden absolute bottom-4 inset-x-4 z-[400] flex items-center justify-center animate-in slide-in-from-bottom duration-200">
                <button
                  onClick={() => setIsRouteDrawerOpen(true)}
                  className="w-full max-w-sm py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-2xl flex items-center justify-between gap-2 border border-amber-300"
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-950" />
                    <span>รูทวันนี้ ({todayRoute.length} โรงงาน)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] bg-slate-950 text-white px-2 py-0.5 rounded-lg">
                    <span>เปิดดูรูท</span>
                    <ChevronUp className="w-3 h-3" />
                  </div>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* DESKTOP ROUTE DRAWER (Col 4 - visible on lg screens) */}
        {isRouteDrawerOpen && (
          <div className="hidden lg:flex lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl flex-col max-h-[calc(100vh-120px)] sticky top-[68px]">
            {renderRouteContent()}
          </div>
        )}

      </div>

      {/* MOBILE BOTTOM SHEET DRAWER (visible on mobile / tablet when opened) */}
      {isRouteDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[1200] flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsRouteDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
          />

          {/* Bottom Sheet Modal */}
          <div className="relative z-10 w-full max-h-[82vh] bg-slate-900 border-t border-slate-700/90 rounded-t-3xl p-4 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-3 shrink-0" />
            
            {renderRouteContent()}
          </div>
        </div>
      )}

      {/* Company Profile Modal */}
      <CompanyOnboardingModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

    </div>
  );
}
