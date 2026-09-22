'use client';

import React from 'react';
import { FactoryLead } from '@/lib/types';
import {
  X,
  Phone,
  Navigation,
  Building2,
  MapPin,
  ShoppingCart,
  Lock,
  UserCheck,
  Check,
  RefreshCw,
} from 'lucide-react';

interface MobileFactoryBottomSheetProps {
  factory: FactoryLead | null;
  onClose: () => void;
  userDistanceKm?: number | null;
  onClaim?: (factory: FactoryLead) => void;
  isClaimedByMe?: boolean;
  claimedByOtherName?: string | null;
  isClaiming?: boolean;
  isProUnlocked?: boolean;
  onRequirePro?: (featureName: string) => void;
}

function maskPhoneNumber(phone?: string | null): string {
  if (!phone || phone === '-') return '-';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(-4)}`;
  }
  return phone.slice(0, 3) + '***' + (phone.length > 5 ? phone.slice(-2) : '');
}

export function MobileFactoryBottomSheet({
  factory,
  onClose,
  userDistanceKm,
  onClaim,
  isClaimedByMe = false,
  claimedByOtherName = null,
  isClaiming = false,
  isProUnlocked = false,
  onRequirePro,
}: MobileFactoryBottomSheetProps) {
  if (!factory) return null;

  const factoryName = factory.name || factory.factory_name || 'โรงงานอุตสาหกรรม';
  const factoryAddress = factory.address || 'จ.สมุทรปราการ';
  const rawPhone = factory.phone || '';
  const factoryPhone = isProUnlocked ? rawPhone : maskPhoneNumber(rawPhone);
  const factoryDistrict = factory.district || 'สมุทรปราการ';

  const googleMapsUrl = factory.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${factory.lat},${factory.lng}`;
  const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9+]/g, '') : '';

  return (
    <div className="sm:hidden fixed inset-0 z-[1100] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Slide-Up Bottom Sheet Card (3D Glass Sheet) */}
      <div className="relative z-10 w-full max-h-[85vh] backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-slate-950 border-t border-white/20 rounded-t-[36px] p-5 sm:p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pb-safe">
        
        {/* Drag Handle Bar */}
        <div className="flex justify-center -mt-2 mb-3.5">
          <div className="w-14 h-1.5 rounded-full bg-white/20 shadow-sm" />
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



        {/* Claim / Ownership Status Banner */}
        <div className="mt-3">
          {isClaimedByMe ? (
            <div className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>อยู่ในพอร์ตงานขายของคุณแล้ว</span>
            </div>
          ) : claimedByOtherName ? (
            <div className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>ถูกดูแลโดย: <strong className="text-white">{claimedByOtherName}</strong></span>
            </div>
          ) : onClaim ? (
            <button
              onClick={() => onClaim(factory)}
              disabled={isClaiming}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
            >
              {isClaiming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังดึงเข้าพอร์ต...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>🛒 หยิบใส่พอร์ตของฉัน (Claim to Portfolio)</span>
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* Quick 1-Tap Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {/* Call Button */}
          {cleanPhone ? (
            isProUnlocked ? (
              <a
                href={`tel:${cleanPhone}`}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <Phone className="w-4 h-4" />
                <span>โทรออกทันที</span>
              </a>
            ) : (
              <button
                onClick={() => onRequirePro?.('ดูเบอร์โทรศัพท์และติดต่อโรงงาน')}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>ปลดล็อกเบอร์โทร</span>
              </button>
            )
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
