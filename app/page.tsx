'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FactoryLead } from '@/lib/types';
import { INITIAL_LEADS } from '@/lib/initialData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthModal } from '@/components/AuthModal';
import { UserMenu } from '@/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Sparkles,
  Layers,
  Radio,
  ArrowRight,
  AlertTriangle,
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
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[480px] sm:min-h-[640px] text-slate-400 space-y-3">
        <div className="h-9 w-9 sm:h-10 sm:w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs sm:text-sm font-bold text-slate-600">กำลังโหลดแผนที่พิกัดโรงงานอุตสาหกรรม...</p>
      </div>
    ),
  }
);

export default function HomePage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const [authError, setAuthError] = useState<string | null>(null);

  // Check URL errors and Session on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlObj = new URL(fullUrl);
      const urlError = urlObj.searchParams.get('error_description') || urlObj.searchParams.get('error');

      if (window.location.hash.includes('error=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashError = hashParams.get('error_description') || hashParams.get('error');
        if (hashError) {
          setAuthError(decodeURIComponent(hashError));
        }
      } else if (urlError) {
        setAuthError(decodeURIComponent(urlError));
      }

      // Check PKCE Code
      const code = urlObj.searchParams.get('code');
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (data.session?.user) {
            window.location.href = '/dashboard';
          }
        });
      }

      // Check session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          window.location.href = '/dashboard';
        }
      });
    }

    if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const [leads, setLeads] = useState<FactoryLead[]>(INITIAL_LEADS);
  const [selectedMobileLead, setSelectedMobileLead] = useState<FactoryLead | null>(null);
  
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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');

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

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const scrollToMap = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Filtered Leads by District, Subdistrict & Radius
  const filteredLeads = useMemo(() => {
    const results = leads.filter((l) => {
      // Radius Filter
      if (selectedRadius !== 'ALL' && l.lat && l.lng) {
        const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, l.lat, l.lng);
        if (distKm > parseFloat(selectedRadius)) return false;
      }

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

      if (selectedSubdistrict !== 'ALL') {
        if (l.subdistrict !== selectedSubdistrict && !l.address.includes(selectedSubdistrict)) {
          return false;
        }
      }

      return true;
    });

    return results.sort((a, b) => {
      if (!a.lat || !a.lng) return 1;
      if (!b.lat || !b.lng) return -1;
      const distA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [leads, selectedDistrict, selectedSubdistrict, selectedRadius, userLocation]);

  // Real logged in status
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white pb-16 sm:pb-0">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[5px] font-black">✓</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sm sm:text-base font-black tracking-tight text-white">
                {t('appName')}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                {t('appBadge')}
              </span>
            </div>
          </div>

          {/* Right Tools (Language Switcher & User Auth) */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />

            {isLoggedIn && (
              <button
                onClick={() => router.push('/dashboard')}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-600/30 active:scale-95 transition cursor-pointer items-center gap-1"
              >
                <span>{t('goToDashboard')}</span>
              </button>
            )}
            <UserMenu onOpenAuth={handleOpenAuth} />
          </div>

        </div>
      </header>

      {/* OAuth Error Alert Banner if any */}
      {authError && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-white">แจ้งเตือนข้อผิดพลาดจาก Google OAuth:</div>
                <div className="font-mono text-rose-300 mt-1 bg-rose-900/50 p-2 rounded-xl border border-rose-700/50 break-all">{authError}</div>
              </div>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="px-2 py-1 bg-rose-900/60 rounded-lg text-rose-300 font-bold hover:bg-rose-800 text-xs shrink-0 cursor-pointer"
            >
              ✕ ปิด
            </button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-8 sm:pt-14 sm:pb-14 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800/80">
        
        {/* Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] sm:text-xs font-bold shadow-inner">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
            <span>{t('heroBadge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t('heroTitlePrefix')} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              {leads.length.toLocaleString()}{t('heroTitleSuffix')}
            </span>{' '}
            {t('heroTitleTime')}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{t('heroGoDashboardBtn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={scrollToMap}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>{t('heroExploreBtn')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>{t('heroUnlockBtn')}</span>
                </button>
              </>
            )}
          </div>

        </div>
      </section>

      {/* 3. INTERACTIVE LIVE MAP SECTION */}
      <main ref={mapSectionRef} className="flex-1 py-6 sm:py-8 bg-slate-900/50 scroll-mt-12 sm:scroll-mt-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>Live GPS Map</span>
              </div>
              <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                {t('mapCommandCenter')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{t('displaying')}</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-black border border-blue-500/30">
                {filteredLeads.length.toLocaleString()} {t('factoriesUnit')}
              </span>
            </div>
          </div>

          {/* Factory Map */}
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
            isLoggedIn={isLoggedIn}
            onRequireAuth={() => handleOpenAuth('signup')}
            onSelectLead={(lead) => setSelectedMobileLead(lead)}
            selectedRadius={selectedRadius}
            onRadiusChange={(rad) => setSelectedRadius(rad)}
          />

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 sm:py-6 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-slate-400 font-medium">
            <span className="font-bold text-slate-200 text-xs">{t('appName')}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-[11px]">{t('appSubtitle')}</span>
          </div>
          <div className="text-[10px] text-slate-600">
            {t('footerCopy')}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        isLiveTracking={isLiveTracking}
        onToggleLiveTracking={toggleLiveTracking}
        onOpenAuth={() => handleOpenAuth(user ? 'signin' : 'signup')}
        onScrollToMap={scrollToMap}
      />

      {/* Mobile Swipeable Bottom Sheet Drawer */}
      <MobileBottomSheet
        lead={selectedMobileLead}
        onClose={() => setSelectedMobileLead(null)}
        isLoggedIn={isLoggedIn}
        onRequireAuth={() => {
          setSelectedMobileLead(null);
          handleOpenAuth('signup');
        }}
        userLocation={userLocation}
      />

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          if (user) router.push('/dashboard');
        }}
        initialMode={authModalMode}
      />

    </div>
  );
}
