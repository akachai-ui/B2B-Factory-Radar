'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, X, Check, Lock, Building2 } from 'lucide-react';

interface PdpaTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pdpa' | 'terms';
}

export const PdpaTermsModal: React.FC<PdpaTermsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'pdpa',
}) => {
  const [activeTab, setActiveTab] = useState<'pdpa' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ข้อกำหนดทางกฎหมาย & การคุ้มครองข้อมูล
              </h2>
              <p className="text-[11px] text-slate-400">
                RouteHunter • B2B Sales Intelligence Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 sm:px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('pdpa')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pdpa'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms)</span>
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
          
          {activeTab === 'pdpa' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                🛡️ <strong>คำชี้แจงตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA):</strong> RouteHunter ให้ความสำคัญสูงสุดกับความปลอดภัยและความเป็นส่วนตัวของข้อมูลองค์กรและผู้ใช้งาน
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">1. ข้อมูลที่เราเก็บรวบรวม</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs sm:text-sm">
                  <li><strong>ข้อมูลบัญชีผู้ใช้:</strong> ชื่อ-นามสกุล, อีเมล, หมายเลขโทรศัพท์ และรูปภาพโปรไฟล์ (จากระบบ Google OAuth หรืออีเมล)</li>
                  <li><strong>ข้อมูลองค์กร / นิติบุคคล:</strong> ชื่อบริษัท, ที่อยู่สถานประกอบการ, และเบอร์โทรศัพท์ติดต่อขององค์กร</li>
                  <li><strong>ข้อมูลตำแหน่งพิกัดทางภูมิศาสตร์ (GPS Location):</strong> ใช้เฉพาะขณะที่ท่านเปิดฟังก์ชัน Live GPS เพื่อคำนวณระยะทางและนำทางไปยังโรงงานเป้าหมาย โดยระบบจะไม่จัดเก็บประวัติการเดินทางย้อนหลังอย่างถาวร</li>
                  <li><strong>ข้อมูลบันทึกการติดตามงานขาย (CRM Notes):</strong> สถานะการติดต่อและบันทึกช่วยจำที่ท่านหรือทีมงานของท่านกรอกในระบบ</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">2. วัตถุประสงค์ในการเก็บรวบรวมและประมวลผล</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs sm:text-sm">
                  <li>เพื่อยืนยันตัวตนและการเข้าถึงศูนย์บัญชาการเป้าหมาย RouteHunter</li>
                  <li>เพื่อคำนวณระยะห่างระหว่างรถของท่านกับประตูทางเข้าโรงงานอุตสาหกรรมเป้าหมาย</li>
                  <li>เพื่อให้บริการและจัดเก็บข้อมูลการทำงานร่วมกันระหว่างสมาชิกในทีมของบริษัทท่าน</li>
                  <li>เพื่อการปรับปรุงประสิทธิภาพและระบบรักษาความปลอดภัยของแพลตฟอร์ม</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">3. การรักษาความปลอดภัยของข้อมูล</h3>
                <p className="text-xs sm:text-sm">
                  ข้อมูลของท่านจะถูกจัดเก็บบนโครงสร้างคลาวด์มาตรฐานความปลอดภัยสากล (Supabase / AWS Architecture) พร้อมระบบการเข้ารหัส (Data Encryption at Rest and in Transit) และการแบ่งสิทธิ์เข้าถึง (Row Level Security - RLS) เพื่อป้องกันการเข้าถึงจากบุคคลภายนอกโดยไม่ได้รับอนุญาต
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">4. สิทธิของเจ้าของข้อมูลส่วนบุคคล</h3>
                <p className="text-xs sm:text-sm">
                  ท่านมีสิทธิ์ในการเข้าถึง ขอแก้ไข ขอระงับการใช้ หรือขอลบข้อมูลส่วนบุคคลของท่านออกจากระบบได้ตลอดเวลา โดยสามารถแจ้งความประสงค์ผ่านผู้ดูแลระบบ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs">
                📜 <strong>ข้อกำหนดและเงื่อนไขการใช้บริการแพลตฟอร์ม RouteHunter (Terms of Service)</strong>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">1. การใช้งานแพลตฟอร์ม</h3>
                <p className="text-xs sm:text-sm">
                  RouteHunter เป็นเครื่องมืออำนวยความสะดวกสำหรับฝ่ายขายภาคสนาม (B2B Field Sales) และผู้บริหาร ในการค้นหาพิกัดประตูทางเข้าโรงงาน วางแผนเส้นทาง และบริหารข้อมูลการติดต่อโรงงานอย่างมีประสิทธิภาพ
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">2. ความถูกต้องและการใช้งานข้อมูล</h3>
                <p className="text-xs sm:text-sm">
                  ข้อมูลโรงงาน พิกัดทางภูมิศาสตร์ และเบอร์โทรศัพท์ตรงของบริษัท ถูกรวบรวมและตรวจสอบจากแหล่งข้อมูลสาธารณะและนิติบุคคล (DBD) เพื่อใช้ในการติดต่อประสานงานทางธุรกิจ B2B ผู้ใช้ตกลงที่จะนำข้อมูลดังกล่าวไปใช้ในทางที่ชอบด้วยกฎหมาย และไม่นำไปใช้ในลักษณะการก่อกวน (Spam)
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">3. บัญชีผู้ใช้และความรับผิดชอบ</h3>
                <p className="text-xs sm:text-sm">
                  ผู้ใช้งานมีหน้าที่รักษาความปลอดภัยของบัญชีผู้ใช้ และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีหรือรหัสผ่านขององค์กรท่าน
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm sm:text-base">4. การปรับปรุงและการรับประกันการให้บริการ</h3>
                <p className="text-xs sm:text-sm">
                  ทีมงานมุ่งมั่นที่จะพัฒนาและปรับปรุงระบบให้มีความแม่นยำและพร้อมใช้งานสูงสุดอย่างต่อเนื่องเพื่อประโยชน์สูงสุดขององค์กรท่าน
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            ปรับปรุงล่าสุด: กันยายน 2026
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Check className="w-4 h-4" />
            <span>รับทราบและเข้าใจแล้ว</span>
          </button>
        </div>

      </div>
    </div>
  );
};
