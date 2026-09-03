'use client';

import React from 'react';
import { Factory, PhoneCall, Mail, Star, MapPin } from 'lucide-react';
import { FactoryLead } from '@/lib/types';

interface KpiCardsProps {
  leads: FactoryLead[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ leads }) => {
  const total = leads.length;
  const withPhone = leads.filter((l) => l.phone && l.phone.trim() !== '').length;
  const withEmail = leads.filter((l) => l.email && l.email.trim() !== '').length;
  const withScheduled = leads.filter((l) => l.status && l.status.includes('นัดหมาย')).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* KPI 1 */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300/60 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wide">โรงงานเป้าหมายทั้งหมด</span>
          <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            <Factory className="w-5 h-5 text-teal-700" />
          </div>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{total.toLocaleString()}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
          <span className="h-2 w-2 rounded-full bg-teal-500"></span>
          <span>ครอบคลุม 6 อำเภอในสมุทรปราการ</span>
        </div>
      </div>

      {/* KPI 2 */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300/60 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wide">มีเบอร์โทรศัพท์ติดต่อตรง</span>
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            <PhoneCall className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
        <h3 className="text-3xl font-black text-emerald-600 tracking-tight">{withPhone.toLocaleString()}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
            {total > 0 ? ((withPhone / total) * 100).toFixed(1) : 0}%
          </span>
          <span>พร้อมโทรติดต่อฝ่ายจัดซื้อ</span>
        </div>
      </div>

      {/* KPI 3 */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-violet-300/60 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wide">มีอีเมลติดต่อ (Email)</span>
          <div className="h-10 w-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5 text-violet-700" />
          </div>
        </div>
        <h3 className="text-3xl font-black text-violet-600 tracking-tight">{withEmail.toLocaleString()}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-700 font-semibold">
          <span className="h-2 w-2 rounded-full bg-violet-500"></span>
          <span>สแกนจากเว็บไซต์โรงงาน</span>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-5 border border-amber-200/90 shadow-xs hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-amber-900 tracking-wide">สำนักงานใหญ่ ฉี ไฉ่ (HQ)</span>
          <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5 fill-current text-white" />
          </div>
        </div>
        <h3 className="text-base font-black text-amber-950 leading-tight">ต.บางพลีใหญ่</h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>ศูนย์กลางบริการด่วน & รถ On-site</span>
        </div>
      </div>

    </div>
  );
};
