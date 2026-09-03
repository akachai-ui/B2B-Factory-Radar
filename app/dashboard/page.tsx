'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Layers,
  Map,
  Table as TableIcon,
  Search,
  Phone,
  Navigation,
  ExternalLink,
  PhoneCall,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Target,
  Filter,
  RotateCcw,
  Check,
  Copy,
  Car,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

// Dynamically import Map component (SSR disabled for Leaflet)
const FactoryMap = dynamic(
  () => import('@/components/FactoryMap').then((mod) => mod.FactoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[480px] sm:min-h-[550px] text-slate-400 space-y-3">
        <div className="h-9 w-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs sm:text-sm font-bold text-slate-600">กำลังโหลดศูนย์บัญชาการแผนที่โรงงาน...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Redirect to Landing ONLY if auth loading has completely finished and no user exists
  useEffect(() => {
    if (!loading && !user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) {
          router.push('/');
        }
      });
    }
  }, [user, loading, router]);

  const [leads, setLeads] = useState<FactoryLead[]>(INITIAL_LEADS);
  const [selectedMobileLead, setSelectedMobileLead] = useState<FactoryLead | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');

  // Copy Email Toast State
  const [copiedPlaceId, setCopiedPlaceId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  const [leadStatuses, setLeadStatuses] = useState<Record<string, { status: LeadStatus; note?: string }>>({});

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    speed?: number | null;
    accuracy?: number | null;
  }>({
    lat: 13.6304636,
    lng: 100.708154,
    label: 'ตำแหน่ง GPS ของคุณ (เริ่มต้น)',
    speed: 0,
    accuracy: null,
  });

  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Load Lead Statuses & listen to updates
  useEffect(() => {
    setLeadStatuses(getLeadStatuses());

    const handleUpdate = () => {
      setLeadStatuses(getLeadStatuses());
    };
    window.addEventListener('lead_status_updated', handleUpdate);
    return () => {
      window.removeEventListener('lead_status_updated', handleUpdate);
    };
  }, []);

  // Live GPS Tracking with watchPosition
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (isLiveTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            label: 'ตำแหน่ง Live GPS ของคุณ (กำลังเคลื่อนที่)',
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Live GPS watch error:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isLiveTracking]);

  const toggleLiveTracking = () => {
    setIsLiveTracking((prev) => !prev);
  };

  const handleQuickNearMe = () => {
    const nextRad = selectedRadius === '5' ? '10' : selectedRadius === '10' ? 'ALL' : '5';
    setSelectedRadius(nextRad);
  };

  // Fetch Live Data from Supabase with Automatic Pagination
  useEffect(() => {
    async function fetchAllFromSupabase() {
      try {
        let allLeads: FactoryLead[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .range(from, from + batchSize - 1);

          if (data && data.length > 0 && !error) {
            allLeads = [...allLeads, ...data];
            if (data.length < batchSize) {
              hasMore = false;
            } else {
              from += batchSize;
            }
          } else {
            hasMore = false;
          }
        }

        if (allLeads.length > 0) {
          setLeads(allLeads);
        }
      } catch (err) {
        console.warn('Supabase fetch error, using local dataset:', err);
      }
    }

    fetchAllFromSupabase();
  }, []);

  // Subdistricts list based on selected district
  const subdistrictsList = useMemo(() => {
    const list = new Set<string>();
    leads.forEach((l) => {
      if (selectedDistrict === 'ALL' || l.district.includes(selectedDistrict)) {
        if (l.subdistrict && l.subdistrict !== 'ไม่ระบุตำบล') {
          list.add(l.subdistrict);
        }
      }
    });
    return Array.from(list).sort();
  }, [leads, selectedDistrict]);

  // Pipeline Metrics Calculation across all leads
  const pipelineStats = useMemo(() => {
    let newCount = 0;
    let contactedCount = 0;
    let meetingCount = 0;
    let wonCount = 0;
    let lostCount = 0;

    leads.forEach((l) => {
      const s = leadStatuses[l.place_id]?.status || 'NEW';
      if (s === 'NEW') newCount++;
      else if (s === 'CONTACTED') contactedCount++;
      else if (s === 'MEETING') meetingCount++;
      else if (s === 'WON') wonCount++;
      else if (s === 'LOST') lostCount++;
    });

    return { newCount, contactedCount, meetingCount, wonCount, lostCount };
  }, [leads, leadStatuses]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDistrict, selectedSubdistrict, selectedStatus, selectedRadius, searchQuery]);

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    const results = leads.filter((l) => {
      // Radius Filter
      if (selectedRadius !== 'ALL' && l.lat && l.lng) {
        const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, l.lat, l.lng);
        if (distKm > parseFloat(selectedRadius)) return false;
      }

      // Status Filter
      const status = leadStatuses[l.place_id]?.status || 'NEW';
      if (selectedStatus !== 'ALL' && status !== selectedStatus) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = l.name.toLowerCase().includes(query);
        const matchPhone = l.phone && l.phone.includes(query);
        const matchAddress = l.address.toLowerCase().includes(query);
        const matchNote = leadStatuses[l.place_id]?.note?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchAddress && !matchNote) return false;
      }

      // District Filter
      if (selectedDistrict !== 'ALL') {
        if (selectedDistrict === 'OTHER') {
          if (
            l.district.includes('สมุทรปราการ') ||
            l.district.includes('บางพลี') ||
            l.district.includes('บางเสาธง') ||
            l.district.includes('บางบ่อ') ||
            l.district.includes('พระประแดง') ||
            l.district.includes('พระสมุทรเจดีย์')
          ) {
            return false;
          }
        } else if (!l.district.includes(selectedDistrict)) {
          return false;
        }
      }

      // Subdistrict Filter
      if (selectedSubdistrict !== 'ALL') {
        if (l.subdistrict !== selectedSubdistrict && !l.address.includes(selectedSubdistrict)) {
          return false;
        }
      }

      return true;
    });

    // Always sort by proximity to user
    return results.sort((a, b) => {
      if (!a.lat || !a.lng) return 1;
      if (!b.lat || !b.lng) return -1;
      const distA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [leads, selectedDistrict, selectedSubdistrict, selectedStatus, selectedRadius, searchQuery, leadStatuses, userLocation]);

  // Paginated Rows for Table & Mobile Cards
  const totalItems = filteredLeads.length;
  const effectivePageSize = pageSize === 'ALL' ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / (effectivePageSize || 1)));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedLeads = pageSize === 'ALL' ? filteredLeads : filteredLeads.slice(startIndex, startIndex + effectivePageSize);

  const handleTableStatusChange = (placeId: string, newStatus: LeadStatus) => {
    saveLeadStatus(placeId, newStatus);
  };

  const handleCopyEmail = (emailStr: string, placeId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailStr);
      setCopiedPlaceId(placeId);
      setTimeout(() => setCopiedPlaceId(null), 2000);
    }
  };

  const handleResetFilters = () => {
    setSelectedDistrict('ALL');
    setSelectedSubdistrict('ALL');
    setSelectedStatus('ALL');
    setSelectedRadius('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedDistrict !== 'ALL' ||
    selectedSubdistrict !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedRadius !== 'ALL' ||
    searchQuery.trim() !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400">กำลังเข้าสู่ Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white pb-20 sm:pb-8">
      
      {/* 1. NATIVE MOBILE-FIRST TOP APP BAR */}
      <header className="bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[5px] font-black">✓</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                {t('appName')}
              </span>
              <span className="px-1.5 py-0.2 rounded-md text-[8px] sm:text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                PRO
              </span>
            </div>
          </div>

          {/* Top Actions: Segmented Control on Desktop, Language & User on Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* View Mode Switcher (Desktop) */}
            <div className="hidden sm:flex p-1 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>{t('mapView')}</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{t('tableView')}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            <UserMenu onOpenAuth={() => {}} />

          </div>

        </div>

        {/* Mobile View Switcher (iOS Segmented Control Bar) */}
        <div className="sm:hidden px-3 pb-2 pt-0.5 flex items-center gap-1">
          <div className="grid grid-cols-2 w-full p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs font-bold">
            <button
              onClick={() => setViewMode('map')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{t('mapView')}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>รายการ CRM ({filteredLeads.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-3 sm:space-y-4">
        
        {/* Sales Pipeline Summary Metrics Bar (Horizontal Scroll on Mobile) */}
        <div className="flex sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
          
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'NEW' ? 'ALL' : 'NEW')}
            className={`min-w-[110px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer shrink-0 ${
              selectedStatus === 'NEW' ? 'bg-blue-900/50 border-blue-400 text-white shadow-sm ring-2 ring-blue-400/50' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
              <span>⚪</span>
              <span className="truncate">{t('statusNew')}</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-white mt-0.5">
              {pipelineStats.newCount.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'CONTACTED' ? 'ALL' : 'CONTACTED')}
            className={`min-w-[110px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer shrink-0 ${
              selectedStatus === 'CONTACTED' ? 'bg-amber-950/50 border-amber-400 text-white shadow-sm ring-2 ring-amber-400/50' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] text-amber-400 flex items-center gap-1 font-bold">
              <PhoneCall className="w-3 h-3" />
              <span className="truncate">{t('statusContacted')}</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-amber-300 mt-0.5">
              {pipelineStats.contactedCount.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'MEETING' ? 'ALL' : 'MEETING')}
            className={`min-w-[110px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer shrink-0 ${
              selectedStatus === 'MEETING' ? 'bg-purple-950/50 border-purple-400 text-white shadow-sm ring-2 ring-purple-400/50' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] text-purple-300 flex items-center gap-1 font-bold">
              <Calendar className="w-3 h-3" />
              <span className="truncate">{t('statusMeeting')}</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-purple-200 mt-0.5">
              {pipelineStats.meetingCount.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'WON' ? 'ALL' : 'WON')}
            className={`min-w-[110px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer shrink-0 ${
              selectedStatus === 'WON' ? 'bg-emerald-950/50 border-emerald-400 text-white shadow-sm ring-2 ring-emerald-400/50' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3" />
              <span className="truncate">{t('statusWon')}</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-emerald-300 mt-0.5">
              {pipelineStats.wonCount.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`min-w-[110px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer shrink-0 ${
              selectedStatus === 'ALL' ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] text-slate-200 flex items-center gap-1 font-bold">
              <span>📊</span>
              <span className="truncate">โรงงานทั้งหมด</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-white mt-0.5">
              {leads.length.toLocaleString()}
            </div>
          </button>

        </div>

        {/* MOBILE APP TOUCH FILTER TOOLBAR */}
        <div className="bg-slate-800/80 p-3 rounded-2xl sm:rounded-3xl border border-slate-700/80 space-y-2.5 shadow-md">
          
          {/* Top Row: Search Box with Clear */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bottom Row: Horizontal Scrollable Filter Chips (Mobile-First) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            
            {/* 🎯 Near Me Quick Chip */}
            <button
              onClick={handleQuickNearMe}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                selectedRadius !== 'ALL'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 ring-2 ring-blue-400/60'
                  : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Target className={`w-3.5 h-3.5 ${selectedRadius !== 'ALL' ? 'text-amber-300 animate-pulse' : 'text-blue-400'}`} />
              <span>{selectedRadius !== 'ALL' ? `🎯 < ${selectedRadius}km` : '🎯 ใกล้ฉัน'}</span>
            </button>

            {/* Radius Select Chip */}
            <select
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(e.target.value)}
              className={`bg-slate-900 border font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none transition cursor-pointer shrink-0 ${
                selectedRadius !== 'ALL' ? 'border-blue-500 text-blue-300' : 'border-slate-700 text-slate-300'
              }`}
            >
              <option value="ALL">🌐 ทุกระยะทาง</option>
              <option value="3">⚡ 3 กม.</option>
              <option value="5">🚗 5 กม.</option>
              <option value="10">🛣️ 10 กม.</option>
              <option value="20">📍 20 กม.</option>
            </select>

            {/* District Select Chip */}
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedSubdistrict('ALL');
              }}
              className={`bg-slate-900 border font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none transition cursor-pointer shrink-0 ${
                selectedDistrict !== 'ALL' ? 'border-blue-500 text-blue-300' : 'border-slate-700 text-slate-300'
              }`}
            >
              <option value="ALL">🏛️ ทุกอำเภอ</option>
              <option value="อำเภอบางพลี">บางพลี (384)</option>
              <option value="อำเภอเมืองสมุทรปราการ">เมือง/บางปู (328)</option>
              <option value="อำเภอพระสมุทรเจดีย์">พระสมุทรเจดีย์ (115)</option>
              <option value="อำเภอพระประแดง">พระประแดง (114)</option>
              <option value="อำเภอบางบ่อ">บางบ่อ (87)</option>
              <option value="อำเภอบางเสาธง">บางเสาธง (81)</option>
              <option value="OTHER">ปริมณฑล</option>
            </select>

            {/* Subdistrict Select Chip */}
            <select
              value={selectedSubdistrict}
              onChange={(e) => setSelectedSubdistrict(e.target.value)}
              className={`bg-slate-900 border font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none transition cursor-pointer shrink-0 ${
                selectedSubdistrict !== 'ALL' ? 'border-blue-500 text-blue-300' : 'border-slate-700 text-slate-300'
              }`}
            >
              <option value="ALL">🏘️ ทุกตำบล</option>
              {subdistrictsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* Status Select Chip */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`bg-slate-900 border font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none transition cursor-pointer shrink-0 ${
                selectedStatus !== 'ALL' ? 'border-blue-500 text-blue-300' : 'border-slate-700 text-slate-300'
              }`}
            >
              <option value="ALL">📋 ทุกสถานะ</option>
              <option value="NEW">⚪ ยังไม่ได้ติดต่อ</option>
              <option value="CONTACTED">🟡 ติดต่อแล้ว</option>
              <option value="MEETING">🟣 นัดเข้าพบ</option>
              <option value="WON">🟢 ปิดการขาย</option>
              <option value="LOST">🔴 ปฏิเสธ</option>
            </select>

            {/* Reset Filter Chip */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต</span>
              </button>
            )}

          </div>

          {/* Active Result Count Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
            <span className="font-bold text-slate-300">
              พบ <strong className="text-blue-400 font-extrabold">{filteredLeads.length.toLocaleString()}</strong> โรงงาน
            </span>
            <span className="text-[10px] text-slate-500">
              ⚡ เรียงตามระยะทางใกล้สุด
            </span>
          </div>

        </div>

        {/* VIEW 1: MAP VIEW */}
        {viewMode === 'map' && (
          <FactoryMap
            leads={filteredLeads}
            userLocation={userLocation}
            isLiveTracking={isLiveTracking}
            onToggleLiveTracking={toggleLiveTracking}
            selectedDistrict={selectedDistrict}
            selectedSubdistrict={selectedSubdistrict}
            onDistrictChange={(dist) => {
              setSelectedDistrict(dist);
              setSelectedSubdistrict('ALL');
            }}
            onSubdistrictChange={(sub) => setSelectedSubdistrict(sub)}
            subdistrictsList={subdistrictsList}
            isLoggedIn={true}
            onRequireAuth={() => {}}
            onSelectLead={(lead) => setSelectedMobileLead(lead)}
            selectedStatus={selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status)}
            selectedRadius={selectedRadius}
            onRadiusChange={(rad) => setSelectedRadius(rad)}
          />
        )}

        {/* VIEW 2: CRM LIST / TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="space-y-3">
            
            {/* MOBILE NATIVE CARDS FEED (sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {paginatedLeads.map((lead, idx) => {
                const rowNumber = startIndex + idx + 1;
                const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                const cleanEmail = lead.email ? lead.email.split(',')[0].trim() : '';
                const statusRecord = leadStatuses[lead.place_id] || { status: 'NEW' as LeadStatus };
                const status = statusRecord.status;
                const distKm = lead.lat && lead.lng ? calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng) : 0;
                const estMin = Math.max(1, Math.round(distKm * 2.2));
                const isCopied = copiedPlaceId === lead.place_id;

                return (
                  <div
                    key={lead.place_id || lead.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-md text-slate-900 space-y-3 active:border-blue-500 transition"
                  >
                    {/* Card Header: Name + Distance */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400">#{rowNumber}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {lead.district}
                          </span>
                          {lead.subdistrict && lead.subdistrict !== 'ไม่ระบุตำบล' && (
                            <span className="text-[10px] text-slate-500">
                              ต.{lead.subdistrict}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug mt-1">
                          {lead.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {lead.address}
                        </p>
                      </div>

                      {/* Distance Pill */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-black shrink-0">
                        <span>🚗</span>
                        <span>{distKm.toFixed(1)} km</span>
                      </span>
                    </div>

                    {/* Card Body: Interactive Status Selector */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">สถานะ:</span>
                      <select
                        value={status}
                        onChange={(e) => handleTableStatusChange(lead.place_id, e.target.value as LeadStatus)}
                        className={`w-full text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer transition ${
                          status === 'WON'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : status === 'CONTACTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : status === 'MEETING'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : status === 'LOST'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="NEW">⚪ {t('statusNew')}</option>
                        <option value="CONTACTED">🟡 {t('statusContacted')}</option>
                        <option value="MEETING">🟣 {t('statusMeeting')}</option>
                        <option value="WON">🟢 {t('statusWon')}</option>
                        <option value="LOST">🔴 {t('statusLost')}</option>
                      </select>
                    </div>

                    {/* Card Actions: Call, Navigate, Email Copy, Website */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {lead.phone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>โทร {lead.phone}</span>
                        </a>
                      ) : (
                        <div className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs text-center flex items-center justify-center">
                          ไม่มีเบอร์
                        </div>
                      )}

                      {lead.maps_url && (
                        <a
                          href={lead.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>นำทาง</span>
                        </a>
                      )}
                    </div>

                    {/* Email Copy Pill */}
                    {cleanEmail && (
                      <button
                        onClick={() => handleCopyEmail(cleanEmail, lead.place_id)}
                        className={`w-full text-xs font-mono py-1.5 px-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer active:scale-95 ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                            : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
                        }`}
                      >
                        <span className="truncate">{cleanEmail}</span>
                        <span className="text-[10px] font-bold shrink-0 flex items-center gap-1">
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-violet-500" />}
                          {isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกอีเมล'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden on mobile, visible on sm:block) */}
            <div className="hidden sm:block bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4 text-slate-900">
              
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <span>{t('tableTitle')} ({filteredLeads.length.toLocaleString()} {t('factoriesUnit')})</span>
                    <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border">
                      📍 {t('closestFirst')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">{t('tableSub')}</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>แสดงหน้าละ:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                      setPageSize(val);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-800 outline-none cursor-pointer focus:border-blue-600"
                  >
                    <option value={25}>25 โรงงาน</option>
                    <option value={50}>50 โรงงาน</option>
                    <option value={100}>100 โรงงาน</option>
                    <option value={250}>250 โรงงาน</option>
                    <option value="ALL">✨ แสดงทั้งหมด ({totalItems.toLocaleString()})</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">{t('guestLockedTitle')}</th>
                      <th className="p-3">ระยะทาง</th>
                      <th className="p-3">{t('statusLabel')}</th>
                      <th className="p-3">{t('districtCol')}</th>
                      <th className="p-3">{t('phoneLabel')}</th>
                      <th className="p-3">อีเมล (คลิกคัดลอก)</th>
                      <th className="p-3 text-center">{t('actionsLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedLeads.map((lead, idx) => {
                      const rowNumber = startIndex + idx + 1;
                      const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                      const cleanEmail = lead.email ? lead.email.split(',')[0].trim() : '';
                      const statusRecord = leadStatuses[lead.place_id] || { status: 'NEW' as LeadStatus };
                      const status = statusRecord.status;
                      const distKm = lead.lat && lead.lng ? calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng) : 0;
                      const estMin = Math.max(1, Math.round(distKm * 2.2));
                      const isCopied = copiedPlaceId === lead.place_id;

                      return (
                        <tr key={lead.place_id || lead.id} className="hover:bg-blue-50/50 transition">
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {rowNumber}
                          </td>

                          <td className="p-3 font-bold text-slate-900 max-w-[220px]">
                            <div>{lead.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">{lead.address}</div>
                            {statusRecord.note && (
                              <div className="text-[10px] text-blue-600 italic mt-0.5">
                                💬 {statusRecord.note}
                              </div>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-black">
                              <span>🚗</span>
                              <span>{distKm.toFixed(1)} km</span>
                              <span className="text-[10px] text-blue-600 font-normal">(~{estMin}m)</span>
                            </span>
                          </td>
                          
                          <td className="p-3 whitespace-nowrap">
                            <select
                              value={status}
                              onChange={(e) => handleTableStatusChange(lead.place_id, e.target.value as LeadStatus)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-xl border outline-none cursor-pointer transition ${
                                status === 'WON'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : status === 'CONTACTED'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : status === 'MEETING'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : status === 'LOST'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="NEW">⚪ {t('statusNew')}</option>
                              <option value="CONTACTED">🟡 {t('statusContacted')}</option>
                              <option value="MEETING">🟣 {t('statusMeeting')}</option>
                              <option value="WON">🟢 {t('statusWon')}</option>
                              <option value="LOST">🔴 {t('statusLost')}</option>
                            </select>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                                <span>🏛️</span>
                                <span>{lead.district}</span>
                              </span>
                              {lead.subdistrict && lead.subdistrict !== 'ไม่ระบุตำบล' && (
                                <span className="text-[10px] text-slate-500 font-medium pl-1">
                                  🏘️ ต.{lead.subdistrict}
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-3 whitespace-nowrap">
                            {lead.phone ? (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          
                          <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                            {cleanEmail ? (
                              <button
                                onClick={() => handleCopyEmail(cleanEmail, lead.place_id)}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer max-w-[180px] active:scale-95 group ${
                                  isCopied
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                                    : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
                                }`}
                                title="คลิกเพื่อคัดลอกอีเมล"
                              >
                                <span className="truncate">{cleanEmail}</span>
                                {isCopied ? (
                                  <span className="text-emerald-600 font-bold text-[10px] shrink-0 flex items-center gap-0.5 animate-in fade-in">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <Copy className="w-3 h-3 text-violet-400 group-hover:text-violet-700 shrink-0" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 pl-2">-</span>
                            )}
                          </td>
                          
                          <td className="p-3 text-center whitespace-nowrap space-x-1.5">
                            {lead.maps_url && (
                              <a
                                href={lead.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                                title={t('navigateGoogle')}
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                                title={t('visitWebsite')}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs font-bold text-slate-500">
                  แสดง {startIndex + 1} - {Math.min(startIndex + effectivePageSize, totalItems)} จากทั้งหมด {totalItems.toLocaleString()} โรงงาน
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าแรกสุด"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-extrabold text-xs">
                    หน้า {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าสุดท้าย"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 3. NATIVE MOBILE BOTTOM APP BAR */}
      <MobileBottomNav
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        isLiveTracking={isLiveTracking}
        onToggleLiveTracking={toggleLiveTracking}
        onQuickNearMe={handleQuickNearMe}
        onOpenAuth={() => {}}
        onScrollToMap={() => setViewMode('map')}
        selectedRadius={selectedRadius}
      />

      {/* 4. MOBILE BOTTOM SHEET DRAWER (FOR MAP PIN SELECTION) */}
      <MobileBottomSheet
        lead={selectedMobileLead}
        onClose={() => setSelectedMobileLead(null)}
        isLoggedIn={true}
        onRequireAuth={() => {}}
        userLocation={userLocation}
      />

    </div>
  );
}
