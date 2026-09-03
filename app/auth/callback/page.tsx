'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Listen for auth state change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        window.location.href = '/dashboard';
      }
    });

    // 2. Check existing session from hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/dashboard';
      } else {
        // Fallback after 2 seconds
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            if (retrySession?.user) {
              window.location.href = '/dashboard';
            } else {
              router.push('/');
            }
          });
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
      <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-center space-y-1">
        <h2 className="text-base font-black text-white">กำลังเข้าสู่ระบบผ่าน Google...</h2>
        <p className="text-xs text-slate-400">ระบบกำลังตรวจสอบสิทธิ์และพาคุณเข้าสู่ Dashboard</p>
      </div>
    </div>
  );
}
