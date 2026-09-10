'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  User,
  ShieldCheck,
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

  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
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

    if (accountType === 'company' && !companyName.trim()) {
      setErrorMsg('กรุณาระบุชื่อบริษัท / องค์กรของคุณ');
      return;
    }

    setIsSubmitting(true);

    try {
      let linkedCompanyId = profile?.company_id || null;

      if (accountType === 'company') {
        // 1. Check if company record already exists for this owner
        if (linkedCompanyId) {
          await supabase
            .from('companies')
            .update({
              name: companyName.trim(),
              tax_id: taxId.trim() || null,
              branch: branch.trim() || 'สำนักงานใหญ่',
              phone: phone.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', linkedCompanyId);
        } else {
          // Check if company exists with owner_id
          const { data: existingComp } = await supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (existingComp) {
            linkedCompanyId = existingComp.id;
            await supabase
              .from('companies')
              .update({
                name: companyName.trim(),
                tax_id: taxId.trim() || null,
                branch: branch.trim() || 'สำนักงานใหญ่',
                phone: phone.trim() || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingComp.id);
          } else {
            // Create brand new company record
            const { data: newComp, error: compError } = await supabase
              .from('companies')
              .insert([
                {
                  name: companyName.trim(),
                  tax_id: taxId.trim() || null,
                  branch: branch.trim() || 'สำนักงานใหญ่',
                  phone: phone.trim() || null,
                  owner_id: user.id,
                },
              ])
              .select()
              .single();

            if (!compError && newComp) {
              linkedCompanyId = newComp.id;
            }
          }
        }
      }

      // 2. Update user profile in profiles table
      await updateProfile({
        account_type: accountType,
        full_name: fullName.trim() || user?.email?.split('@')[0] || 'ผู้ใช้งาน',
        company_name: accountType === 'company' ? (companyName.trim() || 'บริษัทของฉัน') : null,
        tax_id: accountType === 'company' ? (taxId.trim() || null) : null,
        branch: accountType === 'company' ? (branch.trim() || 'สำนักงานใหญ่') : 'สำนักงานใหญ่',
        phone: phone.trim() || null,
        company_id: linkedCompanyId,
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
      <div className="relative z-10 max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ยินดีต้อนรับสู่ RouteHunter B2B Radar</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ระบุตัวตนและรูปแบบการใช้งานของคุณ
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            เลือกรูปแบบบัญชีที่ตรงกับคุณ เพื่อให้ระบบจัดเตรียมหน้าจอและหัวเอกสารรายงานได้อย่างถูกต้อง
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 2 Big Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Choice 1: Individual */}
            <div
              onClick={() => setAccountType('individual')}
              className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                accountType === 'individual'
                  ? 'bg-gradient-to-br from-cyan-950/40 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                  accountType === 'individual' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                {accountType === 'individual' && (
                  <span className="h-6 w-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-black text-white">บุคคลธรรมดา / ผู้ใช้เดี่ยว</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  สำหรับเซลส์อิสระ, ฟรีแลนซ์, หรือใช้งานส่วนตัว วางแผนรูทและค้นหาพิกัดโรงงาน
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-bold text-cyan-300">
                ✨ โหมดใช้งานเดี่ยว (Solo Mode)
              </div>
            </div>

            {/* Choice 2: Company */}
            <div
              onClick={() => setAccountType('company')}
              className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                accountType === 'company'
                  ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-400 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                  accountType === 'company' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Building2 className="w-6 h-6" />
                </div>
                {accountType === 'company' && (
                  <span className="h-6 w-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-black text-white">นิติบุคคล / บริษัท</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  สำหรับทีมขาย, องค์กร, ออกรายงาน White-label ระบุชื่อบริษัทและเลขผู้เสียภาษี
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-bold text-amber-300">
                🏢 หัวรายงานชื่อบริษัท White-label
              </div>
            </div>

          </div>

          {/* Form Inputs based on Selection */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3.5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">ชื่อ - นามสกุล หรือ ชื่อเซลส์</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น สมศักดิ์ การขาย"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>

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
            </div>

            {/* Company Specific Inputs */}
            {accountType === 'company' && (
              <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>ชื่อบริษัท / นิติบุคคล (สำหรับแสดงบนหัวรายงาน) *</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="เช่น บจก. สยามอินดัสเตรียล ซัพพลาย"
                    required={accountType === 'company'}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tax ID */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="010555xxxxxxx"
                      maxLength={13}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
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
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

              </div>
            )}

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
                <span>ยืนยันตัวตน & เข้าสู่ระบบ RouteHunter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
