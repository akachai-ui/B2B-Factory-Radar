'use client';

import React from 'react';
import {
  X,
  Lock,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
} from 'lucide-react';

interface AccessLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function AccessLockModal({
  isOpen,
  onClose,
  featureName = 'ฟังก์ชันการทำงานนี้',
}: AccessLockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden text-slate-100 p-5 sm:p-7 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Subtle Ambient Gold Glow Background */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-20 border border-slate-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full border border-amber-500/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>สิทธิ์การใช้งานสำหรับสมาชิกองค์กร</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              สิทธิ์เข้าถึง <span className="text-amber-400 font-extrabold">"{featureName}"</span> ถูกจำกัด
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              บัญชีของคุณอยู่ใน <span className="text-amber-300 font-semibold">โหมดทดลองใช้งาน (Preview)</span> สามารถค้นหาและดูพิกัดโรงงานได้ แต่ยังไม่ได้รับสิทธิ์จัดการข้อมูลเชิงลึก
            </p>
          </div>
        </div>

        {/* Pro Value Checklist */}
        <div className="my-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
          <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5 text-amber-400/90 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>สิทธิประโยชน์เมื่อได้รับการอนุมัติสิทธิ์ (Pro Member):</span>
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ปลดล็อคเบอร์โทรศัพท์จริงและข้อมูลติดต่อผู้บริหารโรงงาน 989 แห่ง 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>หยิบโรงงานเข้าพอร์ตโฟลิโอส่วนตัว และติดตามสถานะ CRM Pipeline เต็มรูปแบบ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ระบบบันทึกทริปเดินทาง ถ่ายรูปไมล์รถ และคำนวณเบิกค่าน้ำมันอัตโนมัติ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ส่งออกข้อมูลลูกค้ารายงาน Excel ไม่จำกัดจำนวน</span>
          </div>
        </div>

        {/* Sales Manager Contact Callout */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">เอกชัย หาบ้านแท่น (Max)</p>
              <p className="text-[10px] text-amber-400/80">Sale Manager • ผู้ดูแลการอนุมัติสิทธิ์</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
            พร้อมช่วยเหลือ
          </span>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2.5">
          <a
            href="https://line.me/R/ti/p/@362mkitb?ts=02202032&oat_content=url"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#06C755]/25 active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>ติดต่อขออนุมัติสิทธิ์ด่วนทาง LINE Official</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:0924797666"
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>โทร 092-479-7666</span>
            </a>

            <a
              href="/"
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all active:scale-95"
            >
              <span>ดูแพ็กเกจราคา</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-[11px] text-slate-500 hover:text-slate-400 transition underline underline-offset-2 cursor-pointer"
          >
            ปิดหน้าต่างนี้และกลับไปดูแผนที่เรดาร์ต่อ
          </button>
        </div>

      </div>
    </div>
  );
}
