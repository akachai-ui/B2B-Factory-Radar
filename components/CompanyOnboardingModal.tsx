'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2, User, Phone, Check, Sparkles, X, ShieldCheck } from 'lucide-react';
import { PdpaTermsModal } from './PdpaTermsModal';

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
  const [pdpaConsent, setPdpaConsent] = useState<boolean>(true);
  const [isPdpaModalOpen, setIsPdpaModalOpen] = useState<boolean>(false);
  const [pdpaTab, setPdpaTab] = useState<'pdpa' | 'terms'>('pdpa');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.company_name && profile.company_name !== 'บริษัทของฉัน') {
        setCompanyName(profile.company_name);
      }
      setFullName(profile.full_name || '');
      setPhone(profile.company_phone || profile.phone || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg('กรุณาระบุชื่อบริษัท / องค์กรของคุณ');
      return;
    }

    if (!pdpaConsent) {
      setErrorMsg('กรุณายินยอมรับข้อกำหนดการให้บริการและนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    if (!user) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      let currentCompanyId = profile?.company_id;

      if (currentCompanyId) {
        // 1. Update existing Company
        const { error: compUpdateErr } = await supabase
          .from('companies')
          .update({
            name: companyName.trim(),
            phone: phone.trim(),
          })
          .eq('id', currentCompanyId);

        if (compUpdateErr) {
          console.warn('Company update warning:', compUpdateErr);
        }
      } else {
        // 2. Create new Company in `companies` table
        const { data: newCompany, error: compError } = await supabase
          .from('companies')
          .insert({
            name: companyName.trim(),
            phone: phone.trim(),
            address: 'สมุทรปราการ',
            subscription_tier: 'pro',
          })
          .select('id')
          .single();

        if (compError) {
          console.error('Company creation error:', compError);
          throw new Error(`ไม่สามารถบันทึกลงตาราง companies ได้: ${compError.message} (กรุณาตรวจสอบ RLS Policy)`);
        }

        if (newCompany && newCompany.id) {
          currentCompanyId = newCompany.id;
        }
      }

      // 3. Update profile with company_id & company_name for relation linking
      const updateProfilePayload = {
        id: user.id,
        email: user.email || '',
        full_name: fullName.trim() || user.email?.split('@')[0] || 'สมาชิกทีมขาย',
        phone: phone.trim(),
        role: profile?.role || 'owner',
        company_id: currentCompanyId || null,
        company_name: companyName.trim(),
        pdpa_consent: true,
        pdpa_consent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profError } = await supabase
        .from('profiles')
        .upsert(updateProfilePayload);

      if (profError) {
        throw new Error('เกิดข้อผิดพลาดในการบันทึกโปรไฟล์: ' + profError.message);
      }

      await refreshProfile();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isInitialOnboarding ? 'ตั้งค่าบัญชีองค์กรเริ่มต้น' : 'ข้อมูลองค์กร & ทีมขาย'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isInitialOnboarding ? 'ยินดีต้อนรับสู่ RouteHunter' : 'แก้ไขข้อมูลบริษัท / โปรไฟล์'}
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
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ชื่อบริษัท / องค์กรของคุณ <strong className="text-rose-400">*</strong></span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น บริษัท ฉี ไฉ่ อีเล็คทริค จำกัด"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 transition shadow-inner font-medium"
              />
            </div>

            {/* Field 2: Salesperson Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>ชื่อ-นามสกุล / ชื่อเล่นผู้ติดต่อ</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น คุณอัครชัย (ฝ่ายขาย)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 transition shadow-inner"
              />
            </div>

            {/* Field 3: Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>เบอร์โทรศัพท์ติดต่อ</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 transition shadow-inner"
              />
            </div>

            {/* PDPA & Terms Consent Checkbox */}
            <div className="pt-1.5 pb-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  required
                  checked={pdpaConsent}
                  onChange={(e) => setPdpaConsent(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
                />
                <span className="text-[11px] text-slate-300 leading-tight">
                  ฉันได้อ่านและยอมรับ{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setPdpaTab('terms');
                      setIsPdpaModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    ข้อกำหนดการใช้บริการ
                  </button>{' '}
                  และ{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setPdpaTab('pdpa');
                      setIsPdpaModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                  </button>
                </span>
              </label>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !pdpaConsent}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>กำลังบันทึกข้อมูล...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isInitialOnboarding ? 'บันทึกและเริ่มต้นใช้งาน' : 'บันทึกการเปลี่ยนแปลง'}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* PDPA & Terms Full Policy Modal */}
      <PdpaTermsModal
        isOpen={isPdpaModalOpen}
        onClose={() => setIsPdpaModalOpen(false)}
        defaultTab={pdpaTab}
      />
    </>
  );
};
