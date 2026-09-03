'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2, User, Phone, Check, Sparkles, X } from 'lucide-react';

interface CompanyOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialOnboarding?: boolean;
}

export const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  isOpen,
  onClose,
  isInitialOnboarding = false,
}) => {
  const { user, profile, refreshProfile } = useAuth();

  const [companyName, setCompanyName] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.company_name && profile.company_name !== 'บริษัทของฉัน') {
        setCompanyName(profile.company_name);
      }
      setFullName(profile.full_name || '');
      setPhone(profile.company_phone || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg('กรุณาระบุชื่อบริษัท / องค์กรของคุณ');
      return;
    }

    if (!user) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const updatePayload = {
        id: user.id,
        email: user.email || '',
        full_name: fullName.trim() || user.email?.split('@')[0] || 'สมาชิกทีมขาย',
        company_name: companyName.trim(),
        company_phone: phone.trim(),
        company_address: 'สมุทรปราการ',
        subscription_tier: profile?.subscription_tier || 'pro',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updatePayload);

      if (error) {
        setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
      } else {
        await refreshProfile();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาด: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-4 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button (if not forced initial onboarding) */}
        {!isInitialOnboarding && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isInitialOnboarding ? 'ตั้งค่าบัญชีองค์กรเริ่มต้น' : 'ข้อมูลองค์กร & ทีมขาย'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isInitialOnboarding ? 'ยินดีต้อนรับสู่ B2B Radar' : 'แก้ไขข้อมูลบริษัท / โปรไฟล์'}
          </h2>
          <p className="text-xs text-slate-400">
            {isInitialOnboarding
              ? 'กรุณาระบุชื่อบริษัทและข้อมูลติดต่อของคุณ เพื่อเริ่มต้นเจาะฐานข้อมูลโรงงาน'
              : 'อัปเดตข้อมูลสังกัดองค์กรของท่าน'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          
          {/* Field 1: Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>ชื่อบริษัท / องค์กรของคุณ <strong className="text-rose-400">*</strong></span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="เช่น บริษัท ฉี ไฉ่ อีเล็คทริค จำกัด"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>

          {/* Field 2: Salesperson Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>ชื่อ-นามสกุล / ชื่อเล่นเซลส์ผู้ดูแล</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น คุณอัครชัย (ฝ่ายขาย)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>

          {/* Field 3: Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>เบอร์โทรศัพท์ติดต่อของเซลส์</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 081-234-5678"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isInitialOnboarding ? 'บันทึกและเริ่มต้นเจาะเป้าหมาย' : 'บันทึกการเปลี่ยนแปลง'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
