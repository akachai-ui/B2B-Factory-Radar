'use client';

import React from 'react';
import { FactoryLead } from '@/lib/types';
import {
  X,
  Phone,
  Navigation,
  Building2,
  MapPin,
} from 'lucide-react';

interface MobileFactoryBottomSheetProps {
  factory: FactoryLead | null;
  onClose: () => void;
  userDistanceKm?: number | null;
}

export function MobileFactoryBottomSheet({
  factory,
  onClose,
  userDistanceKm,
}: MobileFactoryBottomSheetProps) {
  if (!factory) return null;

  const factoryName = factory.name || factory.factory_name || 'โรงงานอุตสาหกรรม';
  const factoryAddress = factory.address || 'จ.สมุทรปราการ';
  const factoryPhone = factory.phone || '';
  const factoryDistrict = factory.district || 'สมุทรปราการ';

  const googleMapsUrl = factory.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${factory.lat},${factory.lng}`;
  const cleanPhone = factoryPhone ? factoryPhone.replace(/[^0-9+]/g, '') : '';

  return (
    <div className="sm:hidden fixed inset-0 z-[1100] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Slide-Up Bottom Sheet Card */}
      <div className="relative z-10 w-full max-h-[85vh] bg-[#0c1222] border-t border-slate-800 rounded-t-[32px] p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pb-safe">
        
        {/* Drag Handle Bar */}
        <div className="flex justify-center -mt-2 mb-3">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        {/* Header Title & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {factory.district || 'สมุทรปราการ'}
              </span>
              {userDistanceKm !== null && userDistanceKm !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  📍 {userDistanceKm < 1 ? `${Math.round(userDistanceKm * 1000)} ม.` : `${userDistanceKm.toFixed(1)} กม.`}
                </span>
              )}
            </div>

            <h3 className="text-base font-black text-white leading-tight">
              {factoryName}
            </h3>
            {(factory.factory_name_en || factory.company_name) && (
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {factory.factory_name_en || factory.company_name}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0 active:scale-90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick 1-Tap Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {/* Call Button */}
          {cleanPhone ? (
            <a
              href={`tel:${cleanPhone}`}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
              <span>โทรออกทันที</span>
            </a>
          ) : (
            <button
              disabled
              className="py-3 px-4 rounded-2xl bg-slate-900 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
              <span>ไม่มีเบอร์โทร</span>
            </button>
          )}

          {/* Navigate GPS Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Navigation className="w-4 h-4" />
            <span>เปิด GPS นำทาง</span>
          </a>
        </div>

        {/* Factory Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 text-xs mb-2">
          <div className="flex items-start gap-2 text-slate-300">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block">หมวดหมู่และประเภทธุรกิจ:</span>
              <span className="font-semibold text-slate-200">{factory.business_type || 'โรงงานอุตสาหกรรม'}</span>
              {factory.tsic_code && (
                <span className="text-[10px] font-mono text-amber-400/80 block mt-0.5">
                  TSIC Code: {factory.tsic_code}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-300 border-t border-slate-900 pt-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block">ที่ตั้งโรงงาน:</span>
              <span className="text-slate-300 leading-relaxed">{factory.address || 'จ.สมุทรปราการ'}</span>
            </div>
          </div>

          {factory.phone && (
            <div className="flex items-center gap-2 text-slate-300 border-t border-slate-900 pt-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-emerald-300 font-bold">{factory.phone}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
