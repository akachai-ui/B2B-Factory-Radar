'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { FactoryLead } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import {
  Search,
  MapPin,
  Phone,
  Building2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
  User,
  SlidersHorizontal,
  Layers,
  ListFilter,
  Navigation,
  CheckCircle2,
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

// Dynamically import Leaflet Map (SSR Disabled)
const FactoryMap = dynamic(
  () => import('@/components/FactoryMap').then((mod) => mod.FactoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] sm:h-[620px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-300">กำลังโหลดแผนที่โรงงานสมุทรปราการ...</p>
      </div>
    ),
  }
);

export default function LeadsRadarPage() {
  const { user, profile } = useAuth();
  
  const [leads, setLeads] = useState<FactoryLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'map' | 'table'>('map');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Live GPS User Location State
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    speed?: number | null;
    accuracy?: number | null;
  }>({
    lat: 13.6062,
    lng: 100.6974,
    label: 'พิกัดเริ่มต้น: จ.สมุทรปราการ',
  });

  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Auto-detect GPS Location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (isLiveTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            label: '📍 พิกัดสดจาก GPS ของคุณ',
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Live GPS watch error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
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

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Fetch Live Leads from Supabase
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: true });

      if (data && !error) {
        setLeads(data as FactoryLead[]);
      }
    } catch (err) {
      console.warn('Fetch leads error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // District breakdown calculation
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const d = (lead.district || 'ไม่ระบุ').replace('อำเภอ', '').replace('อ.', '').trim();
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const districts = ['บางพลี', 'เมืองสมุทรปราการ', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางบ่อ', 'บางเสาธง'];

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const results = leads.filter((lead) => {
      if (!lead.lat || !lead.lng) return false;

      // 1. District filter
      if (selectedDistrict !== 'ALL') {
        const d = (lead.district || '').replace('อำเภอ', '').replace('อ.', '').trim();
        if (d !== selectedDistrict && !lead.district?.includes(selectedDistrict)) {
          return false;
        }
      }

      // 2. Radius filter (Distance from User GPS)
      if (selectedRadius !== 'ALL') {
        const radKm = parseFloat(selectedRadius);
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
        if (dist > radKm) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchRoad = lead.road?.toLowerCase().includes(q);
        const matchSub = lead.subdistrict?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        if (!matchName && !matchRoad && !matchSub && !matchPhone) {
          return false;
        }
      }

      return true;
    });

    // Sort by distance from user GPS
    return results.sort((a, b) => {
      const distA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [leads, selectedDistrict, selectedRadius, searchQuery, userLocation]);

  const isCompany = profile?.account_type === 'company';
  const displayCompanyName = profile?.company_name || 'บริษัทของฉัน';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้งาน';

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* 1. App Shell Navbar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* 2. Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        
        {/* User Status Welcome Banner (When Logged In) */}
        {user ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border ${
                isCompany
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              }`}>
                {isCompany ? '🏢' : '👤'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white">
                    ยินดีต้อนรับ, {displayName}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    isCompany
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {isCompany ? `🏢 ${displayCompanyName}` : '👤 บัญชีบุคคลธรรมดา'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{userLocation.label}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center text-xs text-slate-400 font-mono">
              <span className="hidden sm:inline">บัญชี:</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Samut Prakan Factory Radar</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white">
                เรดาร์ค้นหา 989 โรงงานอุตสาหกรรม จ.สมุทรปราการ
              </h2>
              <p className="text-xs text-slate-400">
                เข้าถึงพิกัด GPS โรงงาน, เบอร์โทร, เว็บไซต์ และเส้นทางนำทางครอบคลุม 6 อำเภอ
              </p>
            </div>

            <button
              onClick={() => handleOpenAuth('signin')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-center shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>เข้าสู่ระบบเพื่อใช้งานเต็มรูปแบบ</span>
            </button>
          </div>
        )}

        {/* 3. District Breakdown Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <button
            onClick={() => setSelectedDistrict('ALL')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              selectedDistrict === 'ALL'
                ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] font-medium text-slate-400">ทุกอำเภอ</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">{leads.length}</div>
          </button>

          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                selectedDistrict === d
                  ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-medium text-slate-400 truncate">อ.{d}</div>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">
                {districtCounts[d] || 0}
              </div>
            </button>
          ))}
        </div>

        {/* 4. Filter & View Switcher Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อโรงงาน, ถนน, ตำบล หรือเบอร์โทร..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Radius & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Radius Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium pr-1"
              >
                <option value="ALL">รัศมี: ทั้งหมด</option>
                <option value="5">รัศมี 5 กม.</option>
                <option value="10">รัศมี 10 กม.</option>
                <option value="15">รัศมี 15 กม.</option>
                <option value="25">รัศมี 25 กม.</option>
              </select>
            </div>

            {/* View Switcher Tabs (Map vs Table) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setActiveTab('map')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>แผนที่</span>
              </button>

              <button
                onClick={() => setActiveTab('table')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>ตาราง</span>
              </button>
            </div>

            {/* Results Count Badge */}
            <div className="hidden sm:inline-flex text-xs text-slate-400 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-medium">
              พบ <strong className="text-amber-400 font-bold ml-1 mr-1">{filteredLeads.length}</strong> แห่ง
            </div>

          </div>

        </div>

        {/* 5. Main Content: Map Radar View OR Table View */}
        {activeTab === 'map' ? (
          <div className="space-y-3">
            <FactoryMap
              leads={filteredLeads}
              userLocation={userLocation}
              isLiveTracking={isLiveTracking}
              onToggleLiveTracking={toggleLiveTracking}
              selectedDistrict={selectedDistrict}
              onDistrictSelect={(d) => setSelectedDistrict(d)}
              selectedRadius={selectedRadius}
            />
          </div>
        ) : (
          /* Table View */
          isLoading ? (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-300">กำลังดึงข้อมูลโรงงานจาก Supabase...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-500">
              <p className="text-sm font-bold text-slate-400">ไม่พบข้อมูลโรงงานที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">ชื่อโรงงาน / บริษัท</th>
                    <th className="py-3.5 px-4">ที่อยู่ / ถนน</th>
                    <th className="py-3.5 px-4">อำเภอ</th>
                    <th className="py-3.5 px-4">ระยะทางจาก GPS</th>
                    <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3.5 px-4">นำทาง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredLeads.slice(0, 50).map((lead, idx) => {
                    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
                    return (
                      <tr key={lead.place_id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{lead.name}</span>
                          </div>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span>{lead.website}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px] max-w-[240px] truncate">
                          {lead.road ? `ถ.${lead.road} ` : ''}
                          {lead.subdistrict ? `ต.${lead.subdistrict}` : lead.address || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                            {lead.district || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 text-[11px]">
                          ~{dist.toFixed(1)} กม.
                        </td>
                        <td className="py-3 px-4">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-emerald-400 font-mono hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition w-fit"
                          >
                            <Navigation className="w-3 h-3 text-amber-400" />
                            <span>นำทาง</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredLeads.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800 bg-slate-900/80">
                  แสดง 50 รายการแรก จากทั้งหมด {filteredLeads.length} โรงงาน
                </div>
              )}
            </div>
          )
        )}

      </main>

      {/* 6. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

    </div>
  );
}
