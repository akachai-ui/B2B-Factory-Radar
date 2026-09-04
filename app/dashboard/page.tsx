'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserMenu } from '@/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CompanyOnboardingModal } from '@/components/CompanyOnboardingModal';
import {
  Radar,
  Building2,
  Sparkles,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);

  // Protect Dashboard: redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-300">กำลังเข้าสู่ระบบ RouteHunter...</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'ผู้ใช้งาน';
  const companyName = profile?.company_name || 'ยังไม่ได้ตั้งชื่อบริษัท';

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. TOP NAVBAR (Clean & Minimal) */}
      <header className="bg-[#0b0f19]/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => router.push('/')}>
            <div className="relative flex items-center justify-center h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Radar className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">RouteHunter</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  B2B Platform
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <UserMenu
              onOpenAuth={() => {}}
              onOpenCompanyProfile={() => setIsCompanyModalOpen(true)}
            />
          </div>

        </div>
      </header>

      {/* 2. CLEAN CANVAS (Ready for Step-by-Step Feature Planning) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-center text-center">
        
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl max-w-2xl w-full shadow-2xl space-y-6">
          
          {/* Welcome Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>พร้อมสำหรับการวางแผนสร้างฟังก์ชันใหม่ทีละขั้นตอน</span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ยินดีต้อนรับ, <span className="text-amber-400">{displayName}</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              หน้า Dashboard ได้ถูกเคลียร์ให้คลีนและว่างเปล่าเรียบร้อยแล้วครับ เพื่อให้เราเริ่มวางแผนและสร้างฟังก์ชันที่สำคัญที่สุดร่วมกันทีละสเต็ป
            </p>
          </div>

          {/* Company Status Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-semibold">บริษัท / องค์กรที่เชื่อมโยงในระบบ:</p>
                <p className="text-sm font-bold text-white truncate">{companyName}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0"
            >
              แก้ไขข้อมูล
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-white">Database เชื่อมโยงพร้อม</p>
                <p className="text-[11px] text-slate-400 mt-0.5">ตาราง companies & profiles พร้อมใช้งาน</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-start gap-2.5">
              <LayoutGrid className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-white">Clean Canvas Mode</p>
                <p className="text-[11px] text-slate-400 mt-0.5">รอรับฟังก์ชันหลักจากที่คุณต้องการสร้าง</p>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Company Profile Modal */}
      <CompanyOnboardingModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

    </div>
  );
}
