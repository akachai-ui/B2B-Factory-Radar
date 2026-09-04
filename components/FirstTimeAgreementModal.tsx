'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck,
  FileText,
  Lock,
  Building2,
  Check,
  ArrowRight,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface FirstTimeAgreementModalProps {
  isOpen: boolean;
  onAccepted: () => void;
  onDeclined: () => void;
}

export const FirstTimeAgreementModal: React.FC<FirstTimeAgreementModalProps> = ({
  isOpen,
  onAccepted,
  onDeclined,
}) => {
  const { user, profile, acceptPdpaConsent } = useAuth();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 40) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!isChecked) {
      setErrorMsg('กรุณาติ๊กยอมรับเงื่อนไขและข้อตกลงก่อนดำเนินการเข้าใช้งาน');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await acceptPdpaConsent();
      onAccepted();
    } catch (err) {
      console.warn('Error recording PDPA consent:', err);
      onAccepted();
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้งาน';
  const email = user?.email || '-';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* 1. MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  เอกสารข้อตกลงการเข้าใช้งาน & นโยบาย PDPA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v1.0-2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                RouteHunter Platform • กรุณาอ่านและกดยินยอมเพื่อเริ่มเข้าใช้งานระบบ
              </p>
            </div>
          </div>
        </div>

        {/* 2. USER RECOGNITION CALLOUT */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div>
            <span>ผู้ลงนามความยินยอม: </span>
            <strong className="text-white">{displayName}</strong>
            <span className="text-slate-500"> ({email})</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>มีผลบังคับใช้ทันทีเมื่อกดยินยอม</span>
          </div>
        </div>

        {/* 3. SCROLLABLE CONTRACT BODY */}
        <div
          onScroll={handleScroll}
          className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300 divide-y divide-slate-800"
        >
          {/* Summary Box */}
          <div className="pb-3 space-y-2">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              📜 <strong>คำชี้แจงสำหรับผู้เข้าใช้งานครั้งแรก:</strong> RouteHunter ให้ความสำคัญสูงสุดต่อการรักษาความปลอดภัยของข้อมูลส่วนบุคคลตาม <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</strong> และการรักษาความลับทางการค้าขององค์กรท่าน โปรดตรวจสอบสาระสำคัญด้านล่างนี้
            </div>
          </div>

          {/* Section 1 */}
          <div className="pt-3 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span className="text-amber-400">1.</span> การเก็บรวบรวมและใช้ข้อมูลส่วนบุคคล (PDPA)
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              ระบบจัดเก็บเฉพาะข้อมูลที่จำเป็นต่อการยืนยันตัวตนและการทำงานของฝ่ายขาย เช่น ชื่อผู้ใช้งาน, อีเมล, หมายเลขโทรศัพท์ติดต่อ และข้อมูลชื่อองค์กรต้นสังกัด เพื่อใช้ในการอำนวยความสะดวกในการเข้าถึงศูนย์บัญชาการเป้าหมายและการประสานงานภายในทีมของท่าน
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-3 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span className="text-amber-400">2.</span> การใช้งานตำแหน่งพิกัดทางภูมิศาสตร์ (Live GPS)
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              ตำแหน่ง GPS ของท่านจะถูกนำมาใช้ประมวลผลขณะเปิดใช้งานหน้าจอแผนที่ เพื่อคำนวณระยะห่างระหว่างรถของท่านกับประตูทางเข้าโรงงานอุตสาหกรรมเป้าหมายแบบเรียลไทม์ <strong>โดยระบบจะไม่มีการบันทึกประวัติเส้นทางการเดินทางย้อนหลังของท่านเพื่อการติดตามส่วนบุคคล</strong>
            </p>
          </div>

          {/* Section 3 */}
          <div className="pt-3 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span className="text-amber-400">3.</span> การรักษาความลับทางการค้าและข้อมูลบันทึกการขาย (CRM Notes)
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              สถานะการติดตามลูกค้า (เช่น โทรแล้ว, นัดเข้าพบ, เสนอราคา) และบันทึกช่วยจำที่ท่านหรือสมาชิกในทีมของท่านจัดทำขึ้น จะถูกแยกความปลอดภัยเป็นทรัพย์สินส่วนบุคคลขององค์กรท่านแต่เพียงผู้เดียว โดยไม่มีการเผยแพร่หรือส่งต่อให้แก่บุคคลภายนอกโดยเด็ดขาด
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-3 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span className="text-amber-400">4.</span> ขอบเขตการให้บริการและการคุ้มครองทางกฎหมาย
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              RouteHunter ทำหน้าที่เป็นแพลตฟอร์มอำนวยความสะดวกในการบริหารจัดการและค้นหาพิกัดโรงงานจากแหล่งข้อมูลสาธารณะ (DBD) เพื่อสนับสนุนการเดินทางพบลูกค้าอย่างมีประสิทธิภาพ ท่านตกลงที่จะนำข้อมูลไปใช้ในการดำเนินธุรกิจโดยสุจริตและสอดคล้องกับระเบียบกฎหมายที่เกี่ยวข้อง
            </p>
          </div>
        </div>

        {/* 4. FOOTER CONSENT & ACTIONS */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/90 space-y-3">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mandatory Checkbox */}
          <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 cursor-pointer select-none transition">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                if (e.target.checked) setErrorMsg('');
              }}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
            />
            <span className="text-xs text-slate-200 leading-snug font-medium">
              ข้าพเจ้าในนามผู้ใช้งาน ได้อ่าน เข้าใจ และ <strong className="text-amber-300 font-bold">ยินยอมรับข้อกำหนดการให้บริการและนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong> ของ RouteHunter ทุกประการ
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              disabled={!isChecked || loading}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>ยินยอมรับเงื่อนไขและเริ่มเข้าใช้งาน (Accept & Enter)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onDeclined}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ปฏิเสธและออกจากระบบ</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
