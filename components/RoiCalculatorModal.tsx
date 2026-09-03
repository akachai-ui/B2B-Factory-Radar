'use client';

import React, { useState } from 'react';
import { Calculator, X, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface RoiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoiCalculatorModal: React.FC<RoiCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [machinesCount, setMachinesCount] = useState<number>(10);
  const [oilPerChangeLiters, setOilPerChangeLiters] = useState<number>(300);
  const [oilPricePerLiter, setOilPricePerLiter] = useState<number>(120);
  const [changesPerYear, setChangesPerYear] = useState<number>(2);

  if (!isOpen) return null;

  // Calculations
  const currentAnnualSpend = machinesCount * oilPerChangeLiters * oilPricePerLiter * changesPerYear;
  const estimatedSavingsPercent = 70; // 70% savings with Chicai oil purifier
  const annualSavingsBath = (currentAnnualSpend * estimatedSavingsPercent) / 100;
  const monthlySavingsBath = annualSavingsBath / 12;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl shadow-inner">
              <Calculator className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">เครื่องคำนวณความคุ้มค่า (ROI Calculator)</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                  สำหรับฝ่ายขาย
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">คำนวณยอดเงินที่โรงงานจะประหยัดได้จากเครื่องกรองน้ำมัน ฉี ไฉ่</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          
          <div className="space-y-1.5">
            <label className="text-slate-700">จำนวนเครื่องฉีดพลาสติกในโรงงาน (เครื่อง):</label>
            <input
              type="number"
              min="1"
              value={machinesCount}
              onChange={(e) => setMachinesCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-[#219990] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700">ปริมาณน้ำมันไฮดรอลิกต่อเครื่อง (ลิตร):</label>
            <input
              type="number"
              min="10"
              value={oilPerChangeLiters}
              onChange={(e) => setOilPerChangeLiters(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-[#219990] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700">ราคาน้ำมันไฮดรอลิกเฉลี่ย (บาท/ลิตร):</label>
            <input
              type="number"
              min="10"
              value={oilPricePerLiter}
              onChange={(e) => setOilPricePerLiter(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-[#219990] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700">ความถี่ในการเปลี่ยนถ่ายน้ำมัน (ครั้ง/ปี):</label>
            <input
              type="number"
              min="1"
              value={changesPerYear}
              onChange={(e) => setChangesPerYear(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-[#219990] focus:bg-white"
            />
          </div>

        </div>

        {/* Results Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0d3b37] via-[#145853] to-[#219990] text-white p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              สรุปความคุ้มค่าและเงินที่ประหยัดได้ (Savings Summary)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white font-black text-xs">
              ลดต้นทุน ~70%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-[11px] text-emerald-100 font-medium">ค่าใช้จ่ายน้ำมันเดิมต่อปี:</p>
              <h4 className="text-lg font-bold text-slate-200 line-through">
                ฿{currentAnnualSpend.toLocaleString()}
              </h4>
            </div>
            <div>
              <p className="text-[11px] text-emerald-100 font-medium">ประหยัดเงินได้ต่อเดือน:</p>
              <h4 className="text-xl font-black text-emerald-300">
                ฿{Math.round(monthlySavingsBath).toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-emerald-100 font-medium">ยอดเงินที่โรงงานจะประหยัดได้สุทธิต่อปี:</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              ฿{Math.round(annualSavingsBath).toLocaleString()} <span className="text-sm font-normal text-emerald-200">บาท / ปี</span>
            </h2>
          </div>
        </div>

        {/* Pitch Advice */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#219990]" />
            <span>คำแนะนำสำหรับการสนทนากับฝ่ายจัดซื้อ:</span>
          </div>
          <p className="leading-relaxed">
            &ldquo;เครื่องกรองน้ำมันของ ฉี ไฉ่ สามารถฟื้นฟูน้ำมันเดิมกลับมาใช้ซ้ำได้ ช่วยให้โรงงานของพี่ลดค่าใช้จ่ายจัดซื้อน้ำมันใหม่ได้ถึง <strong>฿{Math.round(annualSavingsBath).toLocaleString()} บาทต่อปี</strong> และช่วยลดการสึกหรอของวาล์วไฮดรอลิกครับ&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-md cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
