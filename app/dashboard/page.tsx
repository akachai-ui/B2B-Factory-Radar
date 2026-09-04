'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserMenu } from '@/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PdpaTermsModal } from '@/components/PdpaTermsModal';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Mail,
  LogOut,
  Clock,
  Compass,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [isPdpaModalOpen, setIsPdpaModalOpen] = useState<boolean>(false);

  // Protect Dashboard: if not authenticated, redirect to landing page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // Check PDPA Consent for Google Login & First-time Users
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const consent = localStorage.getItem('routehunter_pdpa_consent');
      if (consent !== 'accepted') {
        setIsPdpaModalOpen(true);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-300">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'สมาชิกทีมขาย';
  const companyName = profile?.company_name || `บริษัทของคุณ ${displayName}`;

  const handleAcceptPdpa = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('routehunter_pdpa_consent', 'accepted');
    }
    setIsPdpaModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-[#0b0f19]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-2">
          
          {/* Brand Logo */}
          <div
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="relative flex items-center justify-center h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-slate-950" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center text-[6px] font-black text-slate-950">
                ✓
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">RouteHunter</span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Workspace
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                ระบบจัดการข้อมูลและเรดาร์เป้าหมายโรงงาน
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher />
            <UserMenu
              onOpenAuth={() => {}}
            />
          </div>

        </div>
      </header>

      {/* 2. MAIN CONTENT: UNDER DEVELOPMENT NOTIFICATION */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center space-y-6">
        
        {/* Under Development Hero Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6 relative overflow-hidden">
          
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-black shadow-lg">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>ระบบแดชบอร์ดเต็มรูปแบบ อยู่ระหว่างพัฒนา (Under Development)</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              ยินดีต้อนรับสู่ <span className="bg-gradient-to-r from-amber-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">RouteHunter Workspace</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto">
              ระบบศูนย์บัญชาการติดตามงานขายระดับทีม (CRM & Pipeline Dashboard) กำลังอยู่ระหว่างขั้นตอนการพัฒนาขั้นสุดท้าย
            </p>
          </div>

          {/* User Profile Card */}
          <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ข้อมูลบัญชีผู้ใช้งานที่เข้าสู่ระบบ:</span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>ชื่อผู้ใช้งาน:</span>
                </span>
                <span className="font-bold text-white truncate">{displayName}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>อีเมล:</span>
                </span>
                <span className="font-mono text-slate-300 text-xs truncate">{user.email}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>บริษัท / ทีม:</span>
                </span>
                <span className="font-bold text-amber-300 truncate">{companyName}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Compass className="w-4 h-4 text-slate-950" />
              <span>ดูเรดาร์แผนที่โรงงาน 989 แห่ง (หน้าแรก)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>ออกจากระบบ</span>
            </button>
          </div>

        </div>

      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#04060c] py-6 text-slate-500 text-xs text-center">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="text-slate-400 font-bold">RouteHunter</p>
          <p className="text-[11px] text-slate-500">© 2026 RouteHunter • ระบบบริหารจัดการการขาย & เรดาร์เป้าหมายโรงงานอุตสาหกรรม</p>
        </div>
      </footer>

      {/* 4. MANDATORY PDPA MODAL FOR FIRST-TIME USERS */}
      <PdpaTermsModal
        isOpen={isPdpaModalOpen}
        onClose={handleAcceptPdpa}
        defaultTab="pdpa"
      />

    </div>
  );
}
