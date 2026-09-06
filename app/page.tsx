'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { IdentityOnboardingModal } from '@/components/IdentityOnboardingModal';
import {
  ShieldCheck,
  Building2,
  User,
  UserCheck,
  Sparkles,
  Zap,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  KeyRound,
  FileCode2,
} from 'lucide-react';

export default function AuthTestWorkbenchPage() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trigger Onboarding for First-Time Users
  useEffect(() => {
    if (user && profile && profile.onboarded !== true) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [user, profile]);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Quick switch between individual and company mode for testing
  const handleQuickToggleAccountType = async (targetType: 'individual' | 'company') => {
    if (!profile) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateProfile({
        account_type: targetType,
        company_name: targetType === 'company' ? (profile.company_name || 'บจก. เดโม่ อินดัสเตรียล') : profile.company_name,
        tax_id: targetType === 'company' ? (profile.tax_id || '0105566778899') : profile.tax_id,
        branch: targetType === 'company' ? (profile.branch || 'สำนักงานใหญ่') : profile.branch,
      });
      setMessage({ type: 'success', text: `สลับเป็นโหมด "${targetType === 'company' ? '🏢 นิติบุคคล / บริษัท' : '👤 บุคคลธรรมดา'}" สำเร็จ!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการอัปเดต' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick reset onboarding status for testing
  const handleToggleOnboardingFlag = async (flag: boolean) => {
    if (!profile) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateProfile({ onboarded: flag });
      setMessage({ type: 'success', text: `ปรับสถานะ onboarded = ${flag ? 'TRUE' : 'FALSE'} เรียบร้อย` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการอัปเดต' });
    } finally {
      setIsUpdating(false);
    }
  };

  const isCompany = profile?.account_type === 'company';
  const displayCompanyName = profile?.company_name || 'บริษัทของฉัน';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. Universal Top Navigation Bar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* 2. Main Test Workbench Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Status Notification Banner */}
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition animate-in fade-in duration-200 ${
            message.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5 text-xs font-bold">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Auth & Profile Multi-tenant Testing Workbench</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">สถานะ Auth:</span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">กำลังตรวจสอบ...</span>
              ) : user ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" /> Guest (ไม่ได้ล็อกอิน)
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ระบบทดสอบ Identity, Auth & Role Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            หน้านี้สำหรับทดสอบระบบ Authentication (Google OAuth / Email), การสลับประเภทบัญชี (บุคคลธรรมดา vs นิติบุคคล/บริษัท), 
            ตรวจสอบคอลัมน์ใน Supabase Database (<code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">public.profiles</code>) และทดสอบ Onboarding Modal แบบเรียลไทม์
          </p>
        </div>

        {/* Auth Actions Toolbar */}
        {!user ? (
          /* Guest Actions Card */
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">คุณยังไม่ได้เข้าสู่ระบบ</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                กดเข้าสู่ระบบด้วย Google หรือ Email เพื่อทดสอบการบันทึกโปรไฟล์และการเลือกสถานะ
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenAuth('signin')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>เข้าสู่ระบบ (Sign In)</span>
              </button>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 cursor-pointer"
              >
                <span>สมัครสมาชิกใหม่ (Sign Up)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated User Workspace */
          <div className="space-y-6">

            {/* Quick Testing Controller */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-white">แผงควบคุมการทดสอบ (Quick Test Controls)</h3>
                </div>
                <div className="text-[11px] text-slate-400">
                  คลิกเพื่อจำลองและสลับสถานะได้ทันที
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Switch to Individual */}
                <button
                  disabled={isUpdating}
                  onClick={() => handleQuickToggleAccountType('individual')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                    !isCompany 
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <User className="w-4 h-4 text-cyan-400" />
                    {!isCompany && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 font-bold">กำลังใช้งาน</span>}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">สลับเป็น: บุคคลธรรมดา</div>
                    <div className="text-[10px] text-slate-400">ซ่อนข้อมูลบริษัท / White-label</div>
                  </div>
                </button>

                {/* Switch to Company */}
                <button
                  disabled={isUpdating}
                  onClick={() => handleQuickToggleAccountType('company')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                    isCompany 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    {isCompany && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold">กำลังใช้งาน</span>}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">สลับเป็น: นิติบุคคล / บริษัท</div>
                    <div className="text-[10px] text-slate-400">แสดงชื่อบริษัท, Tax ID, สาขา</div>
                  </div>
                </button>

                {/* Test Onboarding Modal */}
                <button
                  disabled={isUpdating}
                  onClick={() => setIsOnboardingOpen(true)}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition cursor-pointer flex flex-col justify-between gap-2 text-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] text-slate-500 font-mono">Modal Trigger</span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">เปิด Onboarding Modal</div>
                    <div className="text-[10px] text-slate-400">หน้าต่างต้อนรับเลือกประเภท 2 การ์ด</div>
                  </div>
                </button>

                {/* Reset Onboarded Flag to False */}
                <button
                  disabled={isUpdating}
                  onClick={() => handleToggleOnboardingFlag(profile?.onboarded ? false : true)}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left transition cursor-pointer flex flex-col justify-between gap-2 text-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <RefreshCw className={`w-4 h-4 text-purple-400 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-mono text-purple-300">
                      {profile?.onboarded ? 'True' : 'False'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      {profile?.onboarded ? 'รีเซ็ต onboarded -> FALSE' : 'ตั้งค่า onboarded -> TRUE'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {profile?.onboarded ? 'เพื่อทดสอบ Login ใหม่แล้วเด้ง' : 'ข้ามหน้าต่าง Onboarding'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Database Columns Inspection Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              
              {/* User Identity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${
                    isCompany ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {isCompany ? <Building2 className="w-9 h-9" /> : <UserCheck className="w-9 h-9" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-white">
                        {profile?.full_name || 'ผู้ใช้งาน'}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        isCompany 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {isCompany ? `🏢 โหมดบริษัท: ${displayCompanyName}` : '👤 โหมดบุคคลธรรมดา (Solo / Sales)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>Auth User ID: {user.id}</span>
                      <span>•</span>
                      <span className="text-cyan-400">{user.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => await signOut()}
                    className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-bold transition border border-rose-800/50 cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>

              {/* Database Columns Breakdown Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>ตารางฐานข้อมูล Supabase: public.profiles</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">Row RLS: Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* account_type */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>account_type (คอลัมน์กำหนดโหมด)</span>
                      <span className="text-amber-400 font-bold">Key Selector</span>
                    </div>
                    <div className="text-sm font-black text-amber-300 font-mono">
                      {profile?.account_type ? `"${profile.account_type}"` : 'NULL / undefined'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      {isCompany ? (
                        <span className="text-amber-400">👉 แสดงผลในโหมด: 🏢 นิติบุคคล / บริษัท</span>
                      ) : (
                        <span className="text-cyan-400">👉 แสดงผลในโหมด: 👤 บุคคลธรรมดา</span>
                      )}
                    </div>
                  </div>

                  {/* full_name */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-500">full_name (ชื่อผู้ใช้งาน/เซลส์)</div>
                    <div className="text-sm font-bold text-white">
                      {profile?.full_name || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">แสดงในทุกโหมดและการติดต่อ</div>
                  </div>

                  {/* onboarded */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>onboarded (สถานะการเลือกครั้งแรก)</span>
                      <span className="text-[10px] font-mono">BOOLEAN</span>
                    </div>
                    <div className={`text-sm font-black font-mono flex items-center gap-1.5 ${profile?.onboarded ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {profile?.onboarded ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{profile?.onboarded ? 'TRUE (เลือกตัวตนแล้ว)' : 'FALSE (ยังไม่เลือก -> Onboarding)'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">ถ้า FALSE ระบบจะเด้ง Onboarding Modal ทันที</div>
                  </div>

                  {/* company_name */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>company_name (ชื่อบริษัท / องค์กร)</span>
                      <span className={isCompany ? 'text-amber-400' : 'text-slate-500'}>
                        {isCompany ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-amber-300">
                      {profile?.company_name || '(ไม่มีข้อมูล)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCompany ? '✅ กำลังแสดงผลในระบบและรายงาน' : '🔒 ซ่อนอยู่เบื้องหลัง (ข้อมูลไม่สูญหาย)'}
                    </div>
                  </div>

                  {/* tax_id */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>tax_id (เลขประจำตัวผู้เสียภาษี 13 หลัก)</span>
                      <span className={isCompany ? 'text-amber-400' : 'text-slate-500'}>
                        {isCompany ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-200">
                      {profile?.tax_id || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCompany ? '✅ กำลังแสดงผลในหัวบิล / รายงาน' : '🔒 ซ่อนอยู่เบื้องหลัง'}
                    </div>
                  </div>

                  {/* branch */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>branch (สาขา)</span>
                      <span className={isCompany ? 'text-amber-400' : 'text-slate-500'}>
                        {isCompany ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200">
                      {profile?.branch || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCompany ? '✅ กำลังแสดงผล' : '🔒 ซ่อนอยู่เบื้องหลัง'}
                    </div>
                  </div>

                  {/* phone */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>phone (เบอร์โทรศัพท์)</span>
                      <span className="text-slate-500">String</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-200">
                      {profile?.phone || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">บันทึกเบอร์โทรศัพท์ติดต่อ</div>
                  </div>

                  {/* email */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>email (อีเมลผู้ใช้งาน)</span>
                      <span className="text-cyan-400">Auth Sync</span>
                    </div>
                    <div className="text-sm font-mono text-cyan-300 truncate">
                      {profile?.email || user.email || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">ผูกกับ auth.users</div>
                  </div>

                  {/* role */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>role (สิทธิ์ในระบบ)</span>
                      <span className="text-purple-400 font-bold">RBAC</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-purple-400">
                      {profile?.role || 'owner'}
                    </div>
                    <div className="text-[10px] text-slate-400">owner / manager / sales</div>
                  </div>

                </div>
              </div>

              {/* Raw JSON Response */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span>Raw Supabase User & Profile Object (Live State)</span>
                </h4>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                  {JSON.stringify(
                    {
                      authSessionUser: {
                        id: user.id,
                        email: user.email,
                        user_metadata: user.user_metadata,
                        app_metadata: user.app_metadata,
                      },
                      databaseProfileRow: profile,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 3. Universal Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* 4. First-Time Identity Onboarding Modal */}
      <IdentityOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

    </div>
  );
}
