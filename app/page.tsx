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
  ShieldCheck,
  Building2,
  Phone,
  Compass,
  CheckCircle2,
  TrendingUp,
  Lock,
  Coins,
  MapPin,
  Flame,
  Award,
  BarChart3,
  Check,
  ChevronRight,
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
        <p className="text-xs sm:text-sm font-bold text-amber-200">กำลังเชื่อมต่อศูนย์บัญชาการเรดาร์เป้าหมายโรงงาน...</p>
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
                  B2B FACTORY RADAR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Enterprise Vault
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                คลังข่าวกรองโรงงานอุตสาหกรรมมูลค่าสูง (Verified Intelligence)
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
                <span>เข้าสู่ศูนย์บัญชาการ</span>
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
                  <span>ปลดล็อกคลังข้อมูล</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. HIGH-VALUE ASSET HERO SECTION (ENTERPRISE VALUE PROPOSITION) */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-20 sm:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-[#0b0f19] via-[#070b14] to-[#040711]">
        
        {/* Glowing Background Ambiance */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-7">
          
          {/* High-Value Asset Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-black shadow-2xl backdrop-blur-md">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>คลังข้อมูลข่าวกรองอุตสาหกรรมมูลค่าสูง (High-Value Asset Vault)</span>
          </div>

          {/* Main Explosive Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight max-w-4xl mx-auto">
            ครอบครองคลังเป้าหมายโรงงาน{' '}
            <span className="bg-gradient-to-r from-amber-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              1,089 แห่ง
            </span>{' '}
            <br className="hidden sm:inline" />
            พร้อมเจาะฝ่ายจัดซื้อทันที ไม่ต้องงมหาเอง
          </h1>

          {/* Subtitle & Value Proposition */}
          <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            ประหยัดต้นทุนสำรวจภาคสนามและการวิจัยข้อมูลมูลค่ากว่า <strong className="text-amber-300 font-bold">฿500,000+</strong> ด้วยพิกัดประตูทางเข้าแม่นยำ 100% เบอร์ต่อสายตรงจัดซื้อ และสแกนทุนจดทะเบียน DBD ในคลิกเดียว
          </p>

          {/* 4 Pillars of Intelligence Assets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto pt-2 text-left">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-1 shadow-lg">
              <div className="text-amber-400 font-black text-sm sm:text-base flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>1,089 โรงงาน</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">ฉีดพลาสติกที่เปิดดำเนินกิจการจริง 100%</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-1 shadow-lg">
              <div className="text-emerald-400 font-black text-sm sm:text-base flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>ประตูทางเข้า</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">พิกัดปักหมุดหน้าประตู ไม่หลงทาง ไม่ติด รปภ.</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-1 shadow-lg">
              <div className="text-cyan-400 font-black text-sm sm:text-base flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>เบอร์ตรงจัดซื้อ</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">ต่อสายตรงฝ่ายจัดซื้อและวิศวกรรมได้ทันที</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-1 shadow-lg">
              <div className="text-purple-400 font-black text-sm sm:text-base flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>ทุน DBD</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">สแกนทุนจดทะเบียน/งบการเงิน ประเมินไซส์ก่อนเข้าพบ</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>เข้าสู่ศูนย์บัญชาการเป้าหมาย</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>ปลดล็อกคลังข้อมูล (ทดลองฟรี 30 วัน)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={scrollToMap}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>สำรวจเรดาร์แผนที่สด</span>
                </button>
              </>
            )}
          </div>

        </div>
      </section>

      {/* 3. ASSET VALUE COMPARISON MATRIX (BLIND SALES VS RADAR ADVANTAGE) */}
      <section className="py-12 sm:py-16 bg-[#090d18] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              ทำไมทีมขายชั้นนำถึงต้องถือครอง <span className="text-amber-400">B2B Radar</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              เปรียบเทียบความแตกต่างระหว่างการงมหาลูกค้าเองแบบดั้งเดิม กับการถือครองคลังข่าวกรองเป้าหมาย
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Card 1: The Old Way (Loss & Frustration) */}
            <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/40 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base">
                <div className="h-8 w-8 rounded-xl bg-rose-500/20 flex items-center justify-center">✕</div>
                <span>วิธีเดิมของเซลส์ทั่วไป (เสียเวลา & เสียต้นทุน)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>ขับรถวนหาสุ่มสี่สุ่มห้า:</strong> เสียค่าน้ำมัน ฿15,000+/คน/เดือน โดยไม่รู้ว่าในซอยมีโรงงานอะไรบ้าง</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>ติดปัญหากับ รปภ. / เข้าผิดประตู:</strong> ไปถึงทางเข้าขนถ่ายสินค้า ถูกปฏิเสธไม่ให้เข้าพบ</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>ไม่รู้ขนาดโรงงาน:</strong> เข้าไปเสนอราคาผิดสเกล คุยกับบริษัทที่ใกล้ปิดกิจการโดยไม่รู้ตัว</span>
                </li>
              </ul>
            </div>

            {/* Card 2: The Radar Advantage (High ROI & Pure Power) */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-amber-500/40 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-2 text-amber-300 font-black text-base">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">✓</div>
                <span>ผู้ถือครอง B2B Factory Radar (พร้อมเจาะทันที)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>เปิดจอแล้ววิ่งได้ทันที:</strong> คำนวณระยะทางจากรถคุณไปยังโรงงานที่ใกล้ที่สุดใน 1 วินาที</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>นำทางตรงถึงประตูทางเข้า:</strong> พิกัด GPS แม่นยำตรงประตูผู้ติดต่อ ไม่หลงทาง</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>เช็กทุนจดทะเบียน DBD ได้ทันที:</strong> ทราบขนาดธุรกิจและกรรมการบริษัท เพื่อวางกลยุทธ์ปิดการขายก่อนก้าวลงจากรถ</span>
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
                ศูนย์บัญชาการพิกัดโรงงาน 1,089 แห่ง
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">สถานะคลังข้อมูล:</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>ตรวจสอบพิกัดแล้ว 100%</span>
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
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-slate-300 font-bold">
            <span>B2B FACTORY RADAR</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400 font-normal">ระบบคลังข่าวกรองโรงงานอุตสาหกรรมส่วนตัวสำหรับทีมขาย B2B</span>
          </div>
          <div className="text-[11px] text-slate-600">
            ฐานข้อมูลโรงงานฉีดพลาสติก 1,089 แห่ง • พิกัดประตูทางเข้าแม่นยำ • ข้อมูลนิติบุคคล DBD Dataforthai
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
