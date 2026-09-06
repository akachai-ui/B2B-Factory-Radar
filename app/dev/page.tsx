'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { IdentityOnboardingModal } from '@/components/IdentityOnboardingModal';
import { UserProfile, FactoryLead } from '@/lib/types';
import {
  Activity,
  Database,
  Users,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  FileText,
  KeyRound,
  Layers,
  ArrowRight,
  Search,
  ExternalLink,
  Phone,
  Hash,
  Clock,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';

export default function DevOverviewPage() {
  const { user, profile, loading: authLoading, updateProfile, refreshProfile } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Live Data States
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [districtBreakdown, setDistrictBreakdown] = useState<Record<string, number>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [searchProfileQuery, setSearchProfileQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profiles' | 'overview' | 'database' | 'raw'>('profiles');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch Database Overview
  const fetchOverviewData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch All Profiles from API (Bypassing client RLS)
      try {
        const res = await fetch('/api/dev/profiles', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.profiles) {
          setAllProfiles(json.profiles as UserProfile[]);
        } else {
          // Fallback direct supabase query
          const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          if (pData) setAllProfiles(pData as UserProfile[]);
        }
      } catch (e) {
        const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (pData) setAllProfiles(pData as UserProfile[]);
      }

      // 2. Fetch Leads Count & District Breakdown
      const { data: leadsData, count } = await supabase
        .from('leads')
        .select('district', { count: 'exact' });

      if (count !== null) {
        setLeadsCount(count);
      }

      if (leadsData) {
        const counts: Record<string, number> = {};
        leadsData.forEach((item: any) => {
          const d = (item.district || 'ไม่ระบุ').replace('อำเภอ', '').replace('อ.', '').trim();
          counts[d] = (counts[d] || 0) + 1;
        });
        setDistrictBreakdown(counts);
      }
    } catch (err: any) {
      console.error('Dev Overview fetch error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Quick Switch Current User's Account Type
  const handleSwitchAccountType = async (type: 'individual' | 'company') => {
    if (!profile) return;
    try {
      await updateProfile({
        account_type: type,
        company_name: type === 'company' ? (profile.company_name || 'บจก. เดโม่ อินดัสเตรียล') : profile.company_name,
        tax_id: type === 'company' ? (profile.tax_id || '0105566778899') : profile.tax_id,
        branch: type === 'company' ? (profile.branch || 'สำนักงานใหญ่') : profile.branch,
      });
      await fetchOverviewData();
      setActionFeedback(`เปลี่ยนเป็นโหมด ${type === 'company' ? '🏢 บริษัท' : '👤 บุคคลธรรมดา'} สำเร็จ!`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // Quick Toggle Onboarding Status
  const handleToggleOnboarding = async (flag: boolean) => {
    if (!profile) return;
    try {
      await updateProfile({ onboarded: flag });
      await fetchOverviewData();
      setActionFeedback(`อัปเดต onboarded = ${flag ? 'TRUE' : 'FALSE'} เรียบร้อย!`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // Profile Statistics
  const stats = useMemo(() => {
    const totalUsers = allProfiles.length;
    const individualCount = allProfiles.filter((p) => p.account_type === 'individual' || !p.account_type).length;
    const companyCount = allProfiles.filter((p) => p.account_type === 'company').length;
    const onboardedCount = allProfiles.filter((p) => p.onboarded === true).length;
    const pendingOnboardCount = allProfiles.filter((p) => p.onboarded !== true).length;

    return {
      totalUsers,
      individualCount,
      companyCount,
      onboardedCount,
      pendingOnboardCount,
    };
  }, [allProfiles]);

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    if (!searchProfileQuery.trim()) return allProfiles;
    const q = searchProfileQuery.toLowerCase().trim();
    return allProfiles.filter(
      (p) =>
        p.email?.toLowerCase().includes(q) ||
        p.full_name?.toLowerCase().includes(q) ||
        p.company_name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.tax_id?.includes(q)
    );
  }, [allProfiles, searchProfileQuery]);

  const isCompany = profile?.account_type === 'company';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* 1. App Top Navigation */}
      <Navbar onOpenAuth={(mode) => { setAuthModalMode(mode); setIsAuthModalOpen(true); }} />

      {/* 2. Dev Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{actionFeedback}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Dev Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                  <span>Developer & System Monitor</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  ภาพรวมระบบและข้อมูล (System Overview & Dev Console)
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>กลับหน้าหลัก (App)</span>
              </Link>
              <button
                onClick={fetchOverviewData}
                disabled={isLoadingData}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>รีเฟรชข้อมูล</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            ศูนย์กลางสำหรับดูภาพรวมระบบ ตรวจสอบจำนวนผู้ใช้งานทั้งหมดในตาราง <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">public.profiles</code>, 
            สถิติโรงงาน 989 แห่งใน <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">public.leads</code>, และเครื่องมือสลับสถานะ / ทดสอบโปรไฟล์
          </p>
        </div>

        {/* 3. Top KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Total Registered Users */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>ผู้ใช้งานทั้งหมด</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
            <div className="text-[10px] text-slate-500 font-mono">ใน public.profiles</div>
          </div>

          {/* Individual Users */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>บุคคลธรรมดา</span>
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300">{stats.individualCount}</div>
            <div className="text-[10px] text-slate-500">account_type = individual</div>
          </div>

          {/* Company Users */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>นิติบุคคล / บริษัท</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{stats.companyCount}</div>
            <div className="text-[10px] text-slate-500">account_type = company</div>
          </div>

          {/* Onboarded Status */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>ผ่าน Onboarding แล้ว</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{stats.onboardedCount}</div>
            <div className="text-[10px] text-rose-400">ค้าง {stats.pendingOnboardCount} บัญชี</div>
          </div>

          {/* Factory Leads Count */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>ฐานข้อมูลโรงงาน</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">{leadsCount}</div>
            <div className="text-[10px] text-slate-500 font-mono">จ.สมุทรปราการ (6 อำเภอ)</div>
          </div>

        </div>

        {/* 4. Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>สถานะบัญชีของคุณ (My Session)</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profiles'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ตาราง Profiles ทั้งหมด ({allProfiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'database'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>สถิติฐานข้อมูลโรงงาน (Leads)</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Raw JSON State</span>
          </button>
        </div>

        {/* 5. Tab Content */}

        {/* Tab 1: My Current Session & Quick Testing */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Testing Controller */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-white">แผงควบคุมสลับโหมดทันที (Quick Switcher)</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {user ? `User: ${user.email}` : 'ไม่ได้ล็อกอิน'}
                </span>
              </div>

              {user ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleSwitchAccountType('individual')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      !isCompany 
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <User className="w-5 h-5 text-cyan-400" />
                      {!isCompany && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 font-bold">โหมดปัจจุบัน</span>}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">สลับเป็น บุคคลธรรมดา</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ซ่อนข้อมูลชื่อบริษัท / White-label</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchAccountType('company')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isCompany 
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      {isCompany && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold">โหมดปัจจุบัน</span>}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">สลับเป็น นิติบุคคล / บริษัท</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">แสดงชื่อบริษัท, Tax ID, สาขา</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition cursor-pointer flex flex-col justify-between gap-2 text-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="text-[10px] text-slate-500 font-mono">Modal Trigger</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">เปิด Onboarding Modal</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ทดสอบการ์ดเลือกสถานะครั้งแรก</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleToggleOnboarding(profile?.onboarded ? false : true)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left transition cursor-pointer flex flex-col justify-between gap-2 text-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <RefreshCw className="w-5 h-5 text-purple-400" />
                      <span className="text-[10px] font-mono text-purple-300">
                        {profile?.onboarded ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">
                        {profile?.onboarded ? 'ตั้งค่า onboarded -> FALSE' : 'ตั้งค่า onboarded -> TRUE'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {profile?.onboarded ? 'จำลองผู้ใช้ใหม่เพิ่งล็อกอิน' : 'ข้ามขั้นตอน Onboarding'}
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <p className="text-xs">ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนเพื่อทดสอบสลับโหมด</p>
                  <button
                    onClick={() => { setAuthModalMode('signin'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
              )}
            </div>

            {/* Current User Columns Table */}
            {profile && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>ข้อมูลคอลัมน์ในตาราง profiles ของบัญชีคุณ (Current Profile Record)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">account_type</span>
                    <div className="text-xs font-mono font-bold text-amber-300">{profile.account_type || 'NULL'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">full_name</span>
                    <div className="text-xs font-bold text-white">{profile.full_name || '-'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">onboarded</span>
                    <div className={`text-xs font-mono font-bold ${profile.onboarded ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {profile.onboarded ? 'TRUE (ผ่านแล้ว)' : 'FALSE (ยังไม่ผ่าน)'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">company_name</span>
                    <div className="text-xs font-bold text-amber-300">{profile.company_name || '(ซ่อนในโหมดบุคคล)'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">tax_id</span>
                    <div className="text-xs font-mono text-slate-200">{profile.tax_id || '-'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">branch</span>
                    <div className="text-xs text-slate-200">{profile.branch || '-'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">phone</span>
                    <div className="text-xs font-mono text-slate-200">{profile.phone || '-'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">email</span>
                    <div className="text-xs font-mono text-cyan-300 truncate">{profile.email}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">role</span>
                    <div className="text-xs font-mono text-purple-300">{profile.role || 'owner'}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: All Profiles Table */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            
            {/* Search Input */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchProfileQuery}
                  onChange={(e) => setSearchProfileQuery(e.target.value)}
                  placeholder="ค้นหาตาม อีเมล, ชื่อ, บริษัท, เบอร์โทร..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                พบ <strong className="text-amber-400 font-bold">{filteredProfiles.length}</strong> รายการ
              </div>
            </div>

            {/* Profiles Data Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">อีเมล / ชื่อผู้ใช้</th>
                    <th className="py-3.5 px-4">account_type</th>
                    <th className="py-3.5 px-4">ข้อมูลบริษัท (Company Data)</th>
                    <th className="py-3.5 px-4">เบอร์โทร</th>
                    <th className="py-3.5 px-4">onboarded</th>
                    <th className="py-3.5 px-4">User ID (UUID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {isLoadingData ? 'กำลังโหลดข้อมูลโปรไฟล์...' : 'ไม่พบข้อมูลโปรไฟล์'}
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          <div>{p.full_name || '-'}</div>
                          <div className="text-[11px] font-mono text-cyan-400 font-normal">{p.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.account_type === 'company'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {p.account_type === 'company' ? '🏢 company' : '👤 individual'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {p.company_name ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-amber-300 text-xs">{p.company_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Tax: {p.tax_id || '-'} • {p.branch || 'สำนักงานใหญ่'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.phone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold ${p.onboarded ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.onboarded ? '✓ TRUE' : '✕ FALSE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[10px] text-slate-500 truncate max-w-[120px]">
                          {p.id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Database & Leads Breakdown */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    <span>ฐานข้อมูลโรงงานสมุทรปราการ (public.leads)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    จำนวนโรงงานทั้งหมด <strong>{leadsCount}</strong> แห่ง ครอบคลุม 6 อำเภอ
                  </p>
                </div>
              </div>

              {/* 6 Districts Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(districtBreakdown).map(([district, count]) => (
                  <div key={district} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-slate-400">อ.{district}</span>
                    <div className="text-xl font-black text-amber-400">{count}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {((count / (leadsCount || 1)) * 100).toFixed(1)}% ของทั้งหมด
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Raw JSON Inspector */}
        {activeTab === 'raw' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Raw Supabase User & Profiles State</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Live Sync</span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[500px]">
              {JSON.stringify(
                {
                  currentUser: user ? { id: user.id, email: user.email, app_metadata: user.app_metadata } : null,
                  myProfile: profile,
                  allProfilesCount: allProfiles.length,
                  allProfilesSample: allProfiles,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

      </main>

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <IdentityOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

    </div>
  );
}
