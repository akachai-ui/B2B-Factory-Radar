'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TeamInvitation } from '@/lib/types';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  Zap,
} from 'lucide-react';

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite_id');

  const { user, profile, signInWithGoogle, signInWithFacebook, signInWithPassword, signUpWithPassword, updateProfile, refreshProfile } = useAuth();

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auth Form State for non-logged in users
  const [authMode, setAuthMode] = useState<'social' | 'signin' | 'signup'>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Fetch invitation details
  useEffect(() => {
    async function loadInvite() {
      if (!inviteId) {
        setErrorMsg('ไม่พบรหัสคำเชิญ กรุณาตรวจสอบลิงก์ในอีเมลอีกครั้ง');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('id', inviteId)
          .maybeSingle();

        if (error || !data) {
          setErrorMsg('คำเชิญนี้หมดอายุ หรือไม่พบข้อมูลในระบบ');
        } else {
          setInvitation(data as TeamInvitation);
          if (data.email) {
            setEmail(data.email);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการโหลดคำเชิญ');
      } finally {
        setIsLoading(false);
      }
    }

    loadInvite();
  }, [inviteId]);

  // Handle Accept Invitation
  const handleAccept = async () => {
    if (!user || !invitation) return;
    if (invitation.status === 'accepted') {
      router.replace('/');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Company details
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invitation.company_id)
        .maybeSingle();

      // 2. Update Profile
      await updateProfile({
        company_id: invitation.company_id,
        company_name: comp?.name || invitation.company_name || 'บริษัทของฉัน',
        tax_id: comp?.tax_id || null,
        branch: comp?.branch || 'สำนักงานใหญ่',
        role: invitation.role || 'sales',
        account_type: 'company',
        onboarded: true,
      });

      // 3. Mark Invitation as Accepted in Database
      await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      // 4. Update local state immediately
      setInvitation((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      setSuccessMsg(`🎉 เข้าร่วมทีม ${invitation.company_name} สำเร็จแล้ว!`);
      await refreshProfile();

      setTimeout(() => {
        router.replace('/');
      }, 1200);
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการตอบรับคำเชิญ');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Decline Invitation
  const handleDecline = async () => {
    if (!invitation) return;
    if (invitation.status === 'accepted' || invitation.status === 'declined') {
      router.replace('/');
      return;
    }
    setIsProcessing(true);

    try {
      await supabase
        .from('team_invitations')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      setInvitation((prev) => (prev ? { ...prev, status: 'declined' } : null));
      setTimeout(() => {
        router.replace('/');
      }, 800);
    } catch (err) {
      console.error('Decline error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Sign In with Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setErrorMsg(null);
    const { error } = await signInWithPassword(email, password);
    setIsAuthLoading(false);
    if (error) setErrorMsg(error.message);
  };

  // Handle Sign Up with Password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setErrorMsg(null);
    const { error } = await signUpWithPassword(email, password, fullName || email.split('@')[0]);
    setIsAuthLoading(false);
    if (error) setErrorMsg(error.message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 space-y-3">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        <h2 className="text-sm font-bold text-white">กำลังตรวจสอบคำเชิญ...</h2>
      </div>
    );
  }

  if (errorMsg && !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">ไม่สามารถเปิดคำเชิญได้</h2>
            <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.replace('/')}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            กลับสู่หน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
        
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>คำเชิญเข้าร่วมทีมอย่างเป็นทางการ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {invitation?.company_name}
          </h1>
          <p className="text-xs text-slate-400">
            ขอเชิญคุณเข้าร่วมสังกัดทีมบนระบบ RouteHunter
          </p>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
            {successMsg}
          </div>
        )}

        {/* Invitation Info Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">🏢 บริษัท:</span>
            <span className="font-bold text-amber-300">{invitation?.company_name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">💼 ตำแหน่งที่ได้รับ:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {invitation?.role === 'manager' ? '👔 ผู้จัดการ (Manager)' : '💼 ทีมเซลส์ (Sales)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
            <span className="text-slate-400">📧 ส่งถึงอีเมล:</span>
            <span className="font-mono text-cyan-400 font-bold">{invitation?.email}</span>
          </div>
        </div>

        {/* State 1: Already Accepted */}
        {invitation?.status === 'accepted' && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-sm text-emerald-200">คำเชิญนี้ได้รับการตอบรับเรียบร้อยแล้ว</p>
              <p className="text-[11px] text-emerald-400/80">
                คุณได้เข้าร่วมเป็นสมาชิกในทีม <strong className="text-white">{invitation.company_name}</strong> แล้ว
              </p>
            </div>

            <button
              onClick={() => router.replace('/')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>👉 เข้าสู่หน้าหลัก Dashboard (RouteHunter)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 2: Declined */}
        {invitation?.status === 'declined' && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs space-y-2">
              <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="font-bold text-sm text-rose-200">คำเชิญนี้ถูกปฏิเสธไปแล้ว</p>
              <p className="text-[11px] text-rose-400/80">
                คุณสามารถติดต่อหัวหน้าทีมเพื่อขอรับคำเชิญใหม่อีกครั้ง
              </p>
            </div>

            <button
              onClick={() => router.replace('/')}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>กลับสู่หน้าหลัก</span>
            </button>
          </div>
        )}

        {/* State 3: User Logged In & Pending -> Direct Accept */}
        {invitation?.status !== 'accepted' && invitation?.status !== 'declined' && user && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs text-center space-y-1">
              <span className="text-slate-400">คุณกำลังเข้าสู่ระบบด้วยบัญชี:</span>
              <div className="font-mono text-white font-bold">{user.email}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                ปฏิเสธคำเชิญ
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยอมรับคำเชิญ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* State 4: User Not Logged In & Pending -> Social / Password Login */}
        {invitation?.status !== 'accepted' && invitation?.status !== 'declined' && !user && (
          <div className="space-y-4">
            <div className="text-center text-xs text-slate-400">
              กรุณาเข้าสู่ระบบเพื่อตอบรับคำเชิญและเข้าสู่ทีม
            </div>

            {/* Social 1-Click Buttons */}
            <div className="space-y-2">
              <button
                onClick={signInWithGoogle}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.3-4.3 1.3-3 0-5.5-2.4-6.4-5.2L1.9 16.6C3.7 20.3 7.5 23.5 12 23.5z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>

              <button
                onClick={signInWithFacebook}
                className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-black transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Facebook</span>
              </button>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] text-slate-500 font-bold uppercase">หรือใช้อีเมล / รหัสผ่าน</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Email / Password Toggle */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  authMode === 'signin' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  authMode === 'signup' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400'
                }`}
              >
                สมัครสมาชิกใหม่
              </button>
            </div>

            {authMode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลของคุณ"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {isAuthLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ & ตอบรับคำเชิญ'}
                </button>
              </form>
            ) : authMode === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ชื่อ - นามสกุล"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลของคุณ"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {isAuthLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก & เข้าร่วมทีม'}
                </button>
              </form>
            ) : null}

          </div>
        )}

      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 space-y-3">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <h2 className="text-sm font-bold text-white">กำลังเปิดหน้าตอบรับคำเชิญ...</h2>
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
