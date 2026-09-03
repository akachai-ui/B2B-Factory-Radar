'use client';

import React from 'react';
import { Table, Map, Download, ExternalLink, Calculator, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: 'table' | 'map';
  onViewChange: (view: 'table' | 'map') => void;
  onExportCsv: () => void;
  onOpenRoi: () => void;
  totalLeads: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onExportCsv,
  onOpenRoi,
  totalLeads,
}) => {
  return (
    <header className="bg-gradient-to-r from-[#072422] via-[#0d3b37] to-[#145853] text-white shadow-xl sticky top-0 z-40 border-b border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Brand identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-white to-slate-100 p-2 shadow-lg border border-white/20 shrink-0">
              <span className="text-2xl">🏭</span>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#0d3b37] flex items-center justify-center text-[8px] font-black">✓</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-sm">
                  บริษัท ฉี ไฉ่ อิเล็คทริค (ประเทศไทย) จำกัด
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
                  <Sparkles className="w-3 h-3 text-emerald-300 animate-pulse" />
                  B2B Intelligence
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-light mt-0.5">
                แพลตฟอร์มค้นหา Lead โรงงานฉีดพลาสติก สมุทรปราการ ({totalLeads.toLocaleString()} แห่ง) • วางแผนเส้นทาง & CRM
              </p>
            </div>
          </div>

          {/* Action Tools & Switchers */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end w-full lg:w-auto">
            
            {/* View Switcher Tabs */}
            <div className="inline-flex items-center bg-slate-900/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-inner">
              <button
                onClick={() => onViewChange('table')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'table'
                    ? 'bg-white text-[#0d3b37] shadow-md'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>ตารางข้อมูล</span>
              </button>
              <button
                onClick={() => onViewChange('map')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'map'
                    ? 'bg-white text-[#0d3b37] shadow-md'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>แผนที่พิกัด</span>
              </button>
            </div>

            {/* ROI Calculator Button */}
            <button
              onClick={onOpenRoi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95 cursor-pointer border border-amber-300/40"
              title="คำนวณการประหยัดค่าน้ำมันให้ลูกค้าหน้างาน"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>คำนวณ ROI</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all duration-200 active:scale-95 cursor-pointer border border-emerald-300/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>

            {/* Catalog Link */}
            <a
              href="https://catalog-chicai-lilac.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white text-xs font-semibold rounded-2xl border border-white/15 transition-all backdrop-blur-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แคตตาล็อก</span>
            </a>

          </div>

        </div>
      </div>
    </header>
  );
};
