'use client';

import React, { useState, useEffect } from 'react';
import { FactoryLead, LeadStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeadStatuses, saveLeadStatus } from '@/lib/leadStatusStorage';
import { Phone, Navigation, Globe, Mail, Lock, Sparkles, Car, Check, Copy, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';

interface MobileBottomSheetProps {
  lead: FactoryLead | null;
  onClose: () => void;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
  userLocation: { lat: number; lng: number };
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  lead,
  onClose,
  isLoggedIn,
  onRequireAuth,
  userLocation,
}) => {
  const { t } = useLanguage();
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>('NEW');
  const [note, setNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      const records = getLeadStatuses();
      const record = records[lead.place_id];
      if (record) {
        setCurrentStatus(record.status);
        setNote(record.note || '');
      } else {
        setCurrentStatus('NEW');
        setNote('');
      }
      setCopiedEmail(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleStatusChange = (newStatus: LeadStatus) => {
    setCurrentStatus(newStatus);
    saveLeadStatus(lead.place_id, newStatus, note);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleNoteSave = () => {
    saveLeadStatus(lead.place_id, currentStatus, note);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleCopyEmail = (emailStr: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailStr);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const distKm = lead.lat && lead.lng ? calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng) : 0;
  const estMinutes = Math.max(1, Math.round(distKm * 2.2));
  const locationTag = lead.subdistrict && lead.subdistrict !== 'ไม่ระบุตำบล' ? `${lead.subdistrict} • ${lead.district}` : lead.district;

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
  const cleanEmail = lead.email ? lead.email.split(',')[0].trim() : '';

  // Company Name Cleaned for Corporate Search
  const cleanCompanyName = lead.name.replace(/บริษัท|จำกัด|\(มหาชน\)|สาขา.*/gi, '').trim() || lead.name;
  const dbdSearchUrl = `https://www.dataforthai.com/company/search?q=${encodeURIComponent(cleanCompanyName)}`;
  const credenSearchUrl = `https://data.creden.co/search?q=${encodeURIComponent(cleanCompanyName)}`;
  const mapsNavUrl = lead.maps_url || `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:hidden animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-3xl p-5 shadow-2xl text-white space-y-3.5 max-h-[85vh] overflow-y-auto">
        
        {/* Swipe Handle Indicator */}
        <div className="flex justify-center -mt-2">
          <div className="w-12 h-1.5 rounded-full bg-slate-700"></div>
        </div>

        {/* Header & Close */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-black border border-blue-500/30">
              <span>📍</span>
              <span>{locationTag}</span>
            </div>
            <h3 className="font-black text-base text-white mt-1.5 leading-snug">
              {lead.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm shrink-0 active:scale-90 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Gate GPS & Detailed Address */}
        <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>พิกัด GPS แม่นยำตรงประตูทางเข้าโรงงาน</span>
          </div>
          <p className="text-xs text-slate-300 leading-tight">
            {lead.address}
          </p>
        </div>

        {/* Distance Badge */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{t('distanceAway')} <strong>{distKm.toFixed(1)} km</strong></span>
          </div>
          <span className="text-amber-300 font-extrabold">({t('drivingTime')} {estMinutes} {t('minutesUnit')})</span>
        </div>

        {/* Pillar 1: Verified Lead Intelligence Details */}
        <div className="space-y-3 pt-1">
          
          {/* Status & Notes Tracking Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300 font-black">📋 {t('statusLabel')}</span>
              {savedSuccess && (
                <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3" /> บันทึกแล้ว!
                </span>
              )}
            </div>
            
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none cursor-pointer"
            >
              <option value="NEW">⚪ {t('statusNew')}</option>
              <option value="CONTACTED">🟡 {t('statusContacted')}</option>
              <option value="MEETING">🟣 {t('statusMeeting')}</option>
              <option value="QUOTED">🔵 {t('statusQuoted')}</option>
              <option value="WON">🏆 {t('statusWon')}</option>
              <option value="LOST">🔴 {t('statusLost')}</option>
            </select>

            {/* Note input for conversation opening info */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder={t('notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteSave}
                className="flex-1 text-[11px] p-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 outline-none"
              />
              <button
                onClick={handleNoteSave}
                className="px-3 py-2 rounded-xl bg-blue-600 active:bg-blue-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>

          {/* Company Quick Fact Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-300">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{t('quickFactTitle')}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <a
                href={dbdSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 text-[10px] font-bold flex items-center justify-center gap-1 text-center transition"
                title="เช็กทุนจดทะเบียนและสถานะนิติบุคคล"
              >
                <span>🔍 ทุนจดทะเบียน DBD</span>
                <ExternalLink className="w-3 h-3 text-indigo-400 shrink-0" />
              </a>

              <a
                href={credenSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 text-center transition"
                title="ประเมินไซส์โรงงานและงบการเงิน"
              >
                <span>📊 ประเมินไซส์โรงงาน</span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </a>
            </div>
          </div>

          {/* Email Card with 1-Click Copy */}
          {cleanEmail && (
            <button
              onClick={() => handleCopyEmail(cleanEmail)}
              className="w-full text-xs text-violet-300 font-mono flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 active:scale-95 transition cursor-pointer"
              title="แตะเพื่อคัดลอกอีเมล"
            >
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">{cleanEmail}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold shrink-0">
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอก</span>
                  </>
                )}
              </div>
            </button>
          )}

          {/* Action Buttons: Call Procurement & Door Navigation */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {lead.phone ? (
              <a
                href={`tel:${cleanPhone}`}
                className="py-3 px-4 rounded-2xl bg-emerald-600 active:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
              >
                <Phone className="w-4 h-4" />
                <span>{t('callNow')}</span>
              </a>
            ) : (
              <div className="py-3 px-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-xs text-center flex items-center justify-center">
                {t('noPhone')}
              </div>
            )}

            <a
              href={mapsNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('navigateGoogle')}</span>
            </a>
          </div>

          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t('visitWebsite')}</span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
};
