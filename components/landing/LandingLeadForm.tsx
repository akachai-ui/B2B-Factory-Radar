'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Building2, Phone, Mail, User, Sparkles, Users, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LandingLeadForm() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salesTeamSize, setSalesTeamSize] = useState('3 - 5 คน');
  const [focusProducts, setFocusProducts] = useState('เม็ดพลาสติกทั่วไป (PP, PE, PS)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    setIsSubmitting(true);
    try {
      // Record distributor demo request into Supabase
      const { error } = await supabase.from('lead_activities').insert([
        {
          lead_id: 0,
          user_id: 'resin_distributor_lead',
          user_name: fullName,
          activity_type: 'DEMO_REQUEST',
          title: `ขอนัดชม Demo แพลตฟอร์ม: ${companyName || fullName}`,
          description: `ชื่อ: ${fullName} | บริษัทผู้ค้าเม็ด: ${companyName || '-'} | โทร: ${phone} | อีเมล: ${email || '-'} | จำนวนเซลส์: ${salesTeamSize} | สินค้าหลัก: ${focusProducts} | ข้อความ: ${notes || '-'}`,
        },
      ]);

      if (error) {
        console.warn('Could not save to Supabase directly, inquiry logged:', error);
      }
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-amber-500/30 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl shadow-amber-500/10 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-lg shadow-amber-500/30">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">เราได้รับคำขอนัดหมาย Demo เรียบร้อยแล้ว</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          ทีมผู้เชี่ยวชาญ RouteHunter จะติดต่อกลับไปยังเบอร์ <span className="text-amber-300 font-bold font-mono">{phone}</span> เพื่อจัดเตรียมตัวอย่างฐานข้อมูลโรงงานพลาสติกและนัดหมายการสาธิตระบบให้ทีมงานของคุณครับ
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
        >
          ส่งคำขอใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
          <Sparkles className="w-4 h-4" />
        </span>
        <h3 className="text-lg font-bold text-white">นัดหมายชมการสาธิตระบบ (Book a Live Demo)</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        สำหรับผู้บริหารและผู้จัดการฝ่ายขาย บริษัทตัวแทนจำหน่ายเม็ดพลาสติกและพอลิเมอร์
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" /> ชื่อ-นามสกุล / ตำแหน่ง <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="เช่น คุณธนกร (Managing Director / Sales Director)"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition"
          />
        </div>

        {/* Company Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" /> ชื่อบริษัทจัดจำหน่ายเม็ดพลาสติก <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="เช่น บจก. สยามโพลิเมอร์ ซัพพลาย"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-400" /> เบอร์โทรศัพท์ติดต่อ <span className="text-amber-400">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081-234-5678"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition font-mono"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-400" /> อีเมลติดต่อ
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="director@polymercompany.com"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Sales Team Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" /> ขนาดทีมฝ่ายขาย (Sales Reps)
          </label>
          <select
            value={salesTeamSize}
            onChange={(e) => setSalesTeamSize(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white outline-none transition cursor-pointer"
          >
            <option value="1 - 2 คน">1 - 2 คน (ทีมเริ่มต้น)</option>
            <option value="3 - 5 คน">3 - 5 คน (ทีมขนาดกลาง)</option>
            <option value="6 - 15 คน">6 - 15 คน (ทีมขนาดใหญ่)</option>
            <option value="มากกว่า 15 คน">มากกว่า 15 คน (Enterprise)</option>
          </select>
        </div>

        {/* Focus Products */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> กลุ่มเม็ดพลาสติกที่บริษัทจำหน่าย
          </label>
          <select
            value={focusProducts}
            onChange={(e) => setFocusProducts(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white outline-none transition cursor-pointer"
          >
            <option value="เม็ดพลาสติกทั่วไป (PP, PE, PS)">เม็ดทั่วไป (PP, PE, PS, PVC)</option>
            <option value="พลาสติกวิศวกรรม (Engineering Plastics)">พลาสติกวิศวกรรม (ABS, PC, POM, Nylon)</option>
            <option value="เม็ดรีไซเคิลและคอมปาวด์ (Recycled & Compound)">เม็ดรีไซเคิล PCR/PIR & Compound</option>
            <option value="แม่สีและสารเติมแต่ง (Masterbatch & Additives)">แม่สี Masterbatch & สารเติมแต่ง</option>
            <option value="ครบวงจรทุกเกรด">ครบวงจรทุกเกรด (Full Portfolio)</option>
          </select>
        </div>
      </div>

      {/* Additional Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">ความต้องการหรือเป้าหมายที่ต้องการให้ระบบช่วย (ไม่บังคับ)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น ต้องการให้ทีมเซลส์ 5 คนมีพิกัดโรงงานฉีดพลาสติกโซนชลบุรี-ระยอง และระบบติดตามส่งตัวอย่างทดลองฉีด"
          className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? (
          <span>กำลังประมวลผลคำขอ...</span>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>นัดหมายรับชม Live Demo & ทดลองใช้ฟรี</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center pt-1">
        🔒 ข้อมูลของท่านจะถูกเก็บเป็นความลับสูงสุด และใช้เพื่อการสาธิตระบบเท่านั้น
      </p>
    </form>
  );
}
