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
import { PdpaTermsModal } from '@/components/PdpaTermsModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Sparkles,
  Layers,
  Radio,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Zap,
  Route,
  LayoutDashboard,
  Search,
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
      <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[480px] sm:min-h-[640px] text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs sm:text-sm font-bold text-amber-200">Loading Radar...</p>
      </div>
    ),
  }
);

export default function HomePage() {
  const { user } = useAuth();
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
        supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
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

  const [leads] = useState<FactoryLead[]>(INITIAL_LEADS);
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
  const [isPdpaModalOpen, setIsPdpaModalOpen] = useState<boolean>(false);
  const [pdpaTab, setPdpaTab] = useState<'pdpa' | 'terms'>('pdpa');

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

  const scrollToMap = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Subdistricts list based on district
  const subdistrictsList = useMemo(() => {
    if (selectedDistrict === 'ALL') {
      const allSubs = new Set<string>();
      leads.forEach((l) => {
        if (l.subdistrict && l.subdistrict !== 'ไม่ระบุตำบล') {
          allSubs.add(l.subdistrict);
        }
      });
      return Array.from(allSubs).sort();
    }
    const filteredSubs = new Set<string>();
    leads
      .filter((l) => {
        if (selectedDistrict === 'บางพลี') {
          return (
            l.district.includes('บางพลี') ||
            l.address.includes('บางพลี') ||
            l.address.includes('กิ่งแก้ว') ||
            l.address.includes('ราชาเทวะ')
          );
        }
        return l.district.includes(selectedDistrict);
      })
      .forEach((l) => {
        if (l.subdistrict && l.subdistrict !== 'ไม่ระบุตำบล') {
          filteredSubs.add(l.subdistrict);
        }
      });
    return Array.from(filteredSubs).sort();
  }, [leads, selectedDistrict]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const results = leads.filter((l) => {
      if (!l.lat || !l.lng) return false;

      if (selectedRadius !== 'ALL') {
        const radiusNum = parseFloat(selectedRadius);
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, l.lat, l.lng);
        if (dist > radiusNum) return false;
      }

      if (selectedDistrict !== 'ALL') {
        if (selectedDistrict === 'บางพลี') {
          const match =
            l.district.includes('บางพลี') ||
            l.address.includes('บางพลี') ||
            l.address.includes('กิ่งแก้ว') ||
            l.address.includes('ราชาเทวะ');
          if (!match) {
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

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-16 sm:pb-0 overflow-x-hidden">
      
      {/* 1. TOP HIGH-END NAVIGATION BAR */}
      <header className="bg-[#0b0f19]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          
          {/* Brand Logo & High-Value Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center text-[6px] font-black text-slate-950">✓</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight text-white">
                  {t('appName')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  {t('appBadge')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                {t('appSubtitle')}
              </span>
            </div>
          </div>

          {/* Right Tools & Premium Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />

            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{t('goToDashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>{t('freeTrialBtn')}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. HIGH-IMPACT HERO SECTION: COST SAVINGS & SALES EMPOWERMENT */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-20 sm:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-[#0b0f19] via-[#070b14] to-[#040711]">
        
        {/* Glowing Background Ambiance */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-7">
          
          {/* Executive Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-black shadow-2xl backdrop-blur-md">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{t('heroExecutiveTag')}</span>
          </div>

          {/* Main Strategic Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight max-w-4xl mx-auto">
            {t('heroHeadline1')} <br />
            <span className="bg-gradient-to-r from-amber-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              {t('heroHeadline2')}
            </span>{' '}
            <br className="hidden sm:inline" />
            {t('heroHeadline3')}
          </h1>

          {/* Subtitle & Value Proposition */}
          <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            {t('heroSub')}
          </p>

          {/* 4 Pillars of Sales Automation (Replacing Costly Headcount) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto pt-2 text-left">
            
            {/* Pillar 1: Automated Company Research */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-2 shadow-lg hover:border-amber-500/50 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-white font-black text-sm sm:text-base">
                {t('pillar1Title')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar1Desc')}
              </p>
            </div>

            {/* Pillar 2: AI Route & Travel Planning */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-2 shadow-lg hover:border-emerald-500/50 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Route className="w-5 h-5" />
              </div>
              <div className="text-white font-black text-sm sm:text-base">
                {t('pillar2Title')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar2Desc')}
              </p>
            </div>

            {/* Pillar 3: Centralized Lead Management */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-2 shadow-lg hover:border-cyan-500/50 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-white font-black text-sm sm:text-base">
                {t('pillar3Title')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar3Desc')}
              </p>
            </div>

            {/* Pillar 4: Sales Pipeline Dashboard */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-2 shadow-lg hover:border-purple-500/50 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="text-white font-black text-sm sm:text-base">
                {t('pillar4Title')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar4Desc')}
              </p>
            </div>

          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{t('enterCommandBtn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{t('unlockFreeTrialBtn')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={scrollToMap}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>{t('viewLiveRadarBtn')}</span>
                </button>
              </>
            )}
          </div>

        </div>
      </section>

      {/* 3. COST SAVINGS & BUSINESS ROI (HOW MUCH YOU SAVE ANNUALLY) */}
      <section className="py-12 sm:py-16 bg-[#090d18] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('roiTag')}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {t('roiTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              {t('roiSub')}
            </p>
          </div>

          {/* 3 ROI Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
                💰
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {t('roi1Val')} <span className="text-xs text-emerald-400 font-bold">{t('roi1Unit')}</span>
              </div>
              <div className="text-sm font-bold text-slate-200">{t('roi1Title')}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('roi1Desc')}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
                ⏱️
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {t('roi2Val')} <span className="text-xs text-amber-400 font-bold">{t('roi2Unit')}</span>
              </div>
              <div className="text-sm font-bold text-slate-200">{t('roi2Title')}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('roi2Desc')}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-lg">
                🎯
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {t('roi3Val')} <span className="text-xs text-cyan-400 font-bold">{t('roi3Unit')}</span>
              </div>
              <div className="text-sm font-bold text-slate-200">{t('roi3Title')}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('roi3Desc')}
              </p>
            </div>

          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
            
            {/* Old Way */}
            <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/40 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base">
                <div className="h-8 w-8 rounded-xl bg-rose-500/20 flex items-center justify-center">✕</div>
                <span>{t('compOldTitle')}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{t('compOld1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{t('compOld2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{t('compOld3')}</span>
                </li>
              </ul>
            </div>

            {/* Radar Way */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-amber-500/40 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-2 text-amber-300 font-black text-base">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">✓</div>
                <span>{t('compRadarTitle')}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('compRadar1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('compRadar2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('compRadar3')}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE LIVE MAP RADAR (EXPERIENCE THE ASSET) */}
      <main ref={mapSectionRef} className="flex-1 py-8 sm:py-12 bg-[#060911] scroll-mt-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Live GPS Factory Radar</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-300">
                {t('radarTitle')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{t('screeningLabel')}</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('gateVerifiedBadge')}</span>
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

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#04060c] py-6 sm:py-8 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-slate-300 font-bold">
            <span>{t('appName')}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400 font-normal">{t('footerCopy')}</span>
          </div>
          
          {/* PDPA & Terms Legal Links */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => {
                setPdpaTab('terms');
                setIsPdpaModalOpen(true);
              }}
              className="hover:text-amber-300 transition underline underline-offset-2 cursor-pointer"
            >
              ข้อกำหนดการให้บริการ (Terms)
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setPdpaTab('pdpa');
                setIsPdpaModalOpen(true);
              }}
              className="hover:text-amber-300 transition underline underline-offset-2 cursor-pointer"
            >
              นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </button>
          </div>

          <div className="text-[11px] text-slate-600">
            {t('appSubtitle')}
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

      {/* PDPA & Terms Modal */}
      <PdpaTermsModal
        isOpen={isPdpaModalOpen}
        onClose={() => setIsPdpaModalOpen(false)}
        defaultTab={pdpaTab}
      />

    </div>
  );
}
