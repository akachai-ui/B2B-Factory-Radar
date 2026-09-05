'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        if (typeof window === 'undefined') return;

        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get('code');
        const urlError = currentUrl.searchParams.get('error_description') || currentUrl.searchParams.get('error');

        // Check hash error (Implicit flow)
        if (window.location.hash.includes('error=')) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashError = hashParams.get('error_description') || hashParams.get('error');
          if (hashError) {
            setErrorMsg(decodeURIComponent(hashError));
            return;
          }
        }

        if (urlError) {
          setErrorMsg(decodeURIComponent(urlError));
          return;
        }

        // 1. PKCE Code Exchange Flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            setErrorMsg(error.message);
            return;
          }
        }

        // 2. Check if session is active
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Successfully verified -> redirect to home
          router.replace('/');
        } else {
          // Give a brief moment for implicit hash to be processed
          const timeout = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              router.replace('/');
            } else {
              router.replace('/');
            }
          }, 800);
          return () => clearTimeout(timeout);
        }
      } catch (err: any) {
        console.error('Auth callback exception:', err);
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
      }
    }

    handleAuthCallback();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-rose-800 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">เข้าสู่ระบบไม่สำเร็จ</h2>
          <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.replace('/')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            กลับสู่หน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 text-slate-100 space-y-3">
      <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
      <h2 className="text-sm font-bold text-white">กำลังยืนยันข้อมูลผู้ใช้งาน...</h2>
      <p className="text-xs text-slate-400">กรุณารอสักครู่ ระบบกำลังนำคุณเข้าสู่แพลตฟอร์ม</p>
    </div>
  );
}
