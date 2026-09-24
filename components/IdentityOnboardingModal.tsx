'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Check,
  Sparkles,
  ArrowRight,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react';

interface IdentityOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function IdentityOnboardingModal({ isOpen, onComplete }: IdentityOnboardingModalProps) {
  const { user, profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || `ทีมของ ${profile?.full_name || user?.email?.split('@')[0] || 'ฉัน'}`);
  const [taxId, setTaxId] = useState(profile?.tax_id || '');
  const [branch, setBranch] = useState(profile?.branch || 'สำนักงานใหญ่');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }

    setIsSubmitting(true);

    try {
      const linkedCompanyId = profile?.company_id || user.id;
      const finalCompName = companyName.trim() || `ทีมของ ${fullName.trim() || 'ฉัน'}`;

      // 1. Ensure company record exists in companies table
      try {
        await supabase.from('companies').upsert({
          id: linkedCompanyId,
          name: finalCompName,
          tax_id: taxId.trim() || null,
          branch: branch.trim() || 'สำนักงานใหญ่',
          phone: phone.trim() || null,
          owner_id: user.id,
        }, { onConflict: 'id' });
      } catch (cErr) {
        console.warn('Onboarding company upsert error:', cErr);
      }

      // 2. Update user profile in profiles table
      await updateProfile({
        account_type: 'company',
        full_name: fullName.trim() || user?.email?.split('@')[0] || 'ผู้ใช้งาน',
        company_name: finalCompName,
        tax_id: taxId.trim() || null,
        branch: branch.trim() || 'สำนักงานใหญ่',
        phone: phone.trim() || null,
        company_id: linkedCompanyId,
        role: profile?.role || 'owner',
        onboarded: true,
      });

      onComplete();
    } catch (err: any) {
      console.error('Onboarding update error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Modal Box */}
      <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ยินดีต้อนรับสู่ RouteHunter B2B Radar</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ตั้งค่า Workspace & โปรไฟล์ทีมขายของคุณ
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            ระบุชื่อและข้อมูลองค์กรเพื่อใช้แสดงบนหัวรายงานทริป และจัดเตรียมพื้นที่ทำงานสำหรับคุณและทีมงาน
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3.5">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">ชื่อ - นามสกุล หรือ ชื่อเซลส์ *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น สมศักดิ์ การขาย"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Company / Team Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>ชื่อบริษัท / องค์กร / ทีม (สำหรับแสดงบนหัวรายงาน) *</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น บจก. สยามอินดัสเตรียล ซัพพลาย หรือ ทีมของฉัน"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">สาขา</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="สำนักงานใหญ่"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* Tax ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                เลขประจำตัวผู้เสียภาษี 13 หลัก <span className="text-[10px] text-slate-500">(ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="010555xxxxxxx"
                maxLength={13}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
              />
            </div>

          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <>
                <span>เข้าสู่ระบบ RouteHunter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
