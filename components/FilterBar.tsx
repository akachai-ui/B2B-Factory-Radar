'use client';

import React from 'react';
import { Search, RotateCcw, Building, MapPin, CheckSquare } from 'lucide-react';
import { FilterState } from '@/lib/types';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onReset: () => void;
  subdistrictsList: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  onReset,
  subdistrictsList,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      
      {/* Search Input Bar & Quick Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {/* Instant Search Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="ค้นหาชื่อโรงงาน, เบอร์โทร, อีเมล, ถนน, นิคมอุตสาหกรรม, ตำบล..."
            className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-4 focus:ring-[#219990]/10 rounded-2xl outline-none text-slate-900 transition-all font-medium placeholder:text-slate-400 shadow-inner"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input
              type="checkbox"
              checked={filter.hasPhone}
              onChange={(e) => onFilterChange({ hasPhone: e.target.checked })}
              className="rounded-md h-4 w-4 text-[#219990] focus:ring-[#219990] border-slate-300"
            />
            <span>มีเบอร์โทร</span>
          </label>
          <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input
              type="checkbox"
              checked={filter.hasEmail}
              onChange={(e) => onFilterChange({ hasEmail: e.target.checked })}
              className="rounded-md h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300"
            />
            <span>มีอีเมล (317)</span>
          </label>
          <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition whitespace-nowrap select-none shadow-xs">
            <input
              type="checkbox"
              checked={filter.hasWeb}
              onChange={(e) => onFilterChange({ hasWeb: e.target.checked })}
              className="rounded-md h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>มีเว็บไซต์</span>
          </label>
        </div>

      </div>

      {/* District & Sub-district Cascading Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
        
        {/* District Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>เลือกระดับอำเภอ:</span>
          </label>
          <div className="relative">
            <select
              value={filter.district}
              onChange={(e) => onFilterChange({ district: e.target.value, subdistrict: 'ALL' })}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-3 focus:ring-[#219990]/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition cursor-pointer pr-10 shadow-xs"
            >
              <option value="ALL">-- แสดงทุกอำเภอ (1,089 แห่ง) --</option>
              <option value="อำเภอบางพลี">อำเภอบางพลี (384 แห่ง)</option>
              <option value="อำเภอเมืองสมุทรปราการ">อำเภอเมืองสมุทรปราการ / นิคมบางปู (328 แห่ง)</option>
              <option value="อำเภอพระสมุทรเจดีย์">อำเภอพระสมุทรเจดีย์ (115 แห่ง)</option>
              <option value="อำเภอพระประแดง">อำเภอพระประแดง (114 แห่ง)</option>
              <option value="อำเภอบางบ่อ">อำเภอบางบ่อ (87 แห่ง)</option>
              <option value="อำเภอบางเสาธง">อำเภอบางเสาธง (81 แห่ง)</option>
              <option value="OTHER">ปริมณฑล & พื้นที่ใกล้เคียง</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        {/* Sub-district Selection (Cascading) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>เลือกระดับตำบล / แขวง:</span>
          </label>
          <div className="relative">
            <select
              value={filter.subdistrict}
              onChange={(e) => onFilterChange({ subdistrict: e.target.value })}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-3 focus:ring-[#219990]/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition cursor-pointer pr-10 shadow-xs"
            >
              <option value="ALL">-- ทุกตำบล --</option>
              {subdistrictsList.map((sub) => (
                <option key={sub} value={sub}>
                  ตำบล{sub}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        {/* Sales Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>สถานะงานขาย (Pipeline):</span>
          </label>
          <div className="relative">
            <select
              value={filter.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#219990] focus:ring-3 focus:ring-[#219990]/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition cursor-pointer pr-10 shadow-xs"
            >
              <option value="ALL">-- ทุกสถานะ --</option>
              <option value="ยังไม่ได้ติดต่อ">ยังไม่ได้ติดต่อ</option>
              <option value="โทรติดต่อแล้ว">โทรติดต่อแล้ว</option>
              <option value="นัดหมาย On-site Demo">นัดหมาย On-site Demo</option>
              <option value="เสนอราคาแล้ว">เสนอราคาแล้ว</option>
              <option value="ปิดการขายสำเร็จ">ปิดการขายสำเร็จ</option>
              <option value="ไม่สนใจ / ปฏิเสธ">ไม่สนใจ / ปฏิเสธ</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>
        </div>

      </div>

    </div>
  );
};
