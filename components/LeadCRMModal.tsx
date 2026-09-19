'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, 
  Navigation, 
  Trash2, 
  Check, 
  RefreshCw, 
  X, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Building2,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  MapPin,
  Car,
  Inbox
} from 'lucide-react';

import { calculateContactHealth, getLeadLastContactDate } from '@/lib/leadUtils';

export interface ActivityAuthor {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  email?: string;
}

export interface LeadActivity {
  id: string;
  company_id: string;
  company_lead_id: string;
  user_id?: string;
  activity_type?: string;
  content: string;
  status_change?: string | null;
  deal_value_change?: number | null;
  created_at: string;
  author?: ActivityAuthor;
}

interface LeadCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any; // CompanyLead
  companyId: string;
  currentUser: {
    id: string;
    full_name?: string;
    avatar_url?: string | null;
  } | null;
  onLeadUpdated?: () => void;
  onReleaseLead?: (id: string, name: string) => void;
}

const STATUS_LIST = [
  { 
    value: 'NEW', 
    label: 'ลูกค้าใหม่', 
    emoji: '🟠', 
    step: 1,
    color: 'text-amber-400',
    activeBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/80',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  { 
    value: 'CONTACTED', 
    label: 'โทรติดต่อแล้ว', 
    emoji: '🔵', 
    step: 2,
    color: 'text-blue-400',
    activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/80',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  },
  { 
    value: 'QUOTED', 
    label: 'เสนอราคาแล้ว', 
    emoji: '🟡', 
    step: 3,
    color: 'text-yellow-400',
    activeBg: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black shadow-lg shadow-yellow-500/25 ring-2 ring-yellow-300/90',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
  },
  { 
    value: 'MEETING', 
    label: 'นัดพบลูกค้า', 
    emoji: '🟣', 
    step: 4,
    color: 'text-purple-400',
    activeBg: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/80',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  },
  { 
    value: 'WON', 
    label: 'ปิดการขาย', 
    emoji: '🟢', 
    step: 5,
    color: 'text-emerald-400',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/90',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
];

const PRIORITY_LIST = [
  { value: 'LOW', label: 'ต่ำ', icon: '🟢', activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400/30' },
  { value: 'MEDIUM', label: 'ปานกลาง', icon: '🔵', activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40 ring-1 ring-blue-400/30' },
  { value: 'HIGH', label: 'สำคัญมาก', icon: '🟡', activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30 font-bold' },
  { value: 'URGENT', label: 'ด่วนพิเศษ', icon: '🔴', activeBg: 'bg-rose-500/25 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/40 font-black animate-pulse' },
];

export const LeadCRMModal: React.FC<LeadCRMModalProps> = ({
  isOpen,
  onClose,
  lead,
  companyId,
  currentUser,
  onLeadUpdated,
  onReleaseLead,
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states
  const [currentStatus, setCurrentStatus] = useState<string>('NEW');
  const [dealValue, setDealValue] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [newNote, setNewNote] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

  // Location edit states
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [locationInput, setLocationInput] = useState<string>('');
  const [isSavingLocation, setIsSavingLocation] = useState<boolean>(false);

  const handleUpdateLocation = async () => {
    if (!locationInput.trim()) return;
    setIsSavingLocation(true);
    try {
      const res = await fetch('/api/leads/resolve-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: locationInput.trim(),
          lead_id: lead.id,
          tax_id: lead.tax_id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'ไม่สามารถอัปเดตพิกัดได้');

      lead.lat = data.lat;
      lead.lng = data.lng;
      setIsEditingLocation(false);
      setLocationInput('');
      setFeedbackMsg({
        type: 'success',
        text: `📍 อัปเดตพิกัดโรงงานเรียบร้อยแล้ว (${data.lat}, ${data.lng})`,
      });
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'บันทึกพิกัดไม่สำเร็จ' });
    } finally {
      setIsSavingLocation(false);
    }
  };

  // 1-Tap Check-in to active vehicle trip
  const handleTripCheckin = async () => {
    if (!currentUser) return;
    setIsCheckingIn(true);
    try {
      // 1. Find active trip
      const tripRes = await fetch(`/api/trips?user_id=${currentUser.id}&active_only=true`);
      const tripData = await tripRes.json();

      if (!tripData.success || !tripData.activeTrip) {
        setFeedbackMsg({
          type: 'error',
          text: 'ยังไม่ได้เริ่มทริปประจำวัน กรุณากด "🚗 บันทึกเลขไมล์" ที่แถบเมนูเพื่อเริ่มทริปก่อน',
        });
        return;
      }

      const activeTrip = tripData.activeTrip;

      // 2. Post Checkin
      const checkinRes = await fetch('/api/trips/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip.id,
          company_id: companyId,
          user_id: currentUser.id,
          company_lead_id: lead.id,
          checkin_type: 'CLIENT_VISIT',
          location_name: lead.company_name || lead.name || 'โรงงานลูกค้า',
          lat: lead.lat || activeTrip.start_lat || 13.7563,
          lng: lead.lng || activeTrip.start_lng || 100.5018,
          notes: `เช็คอินเข้าพบลูกค้า: ${lead.company_name}`,
        }),
      });

      const cData = await checkinRes.json();
      if (!cData.success) throw new Error(cData.error || 'เช็คอินไม่สำเร็จ');

      setFeedbackMsg({
        type: 'success',
        text: `📍 เช็คอินสำเร็จ (+${cData.distance_from_prev_km} กม. รวมรูทสะสม ${cData.total_route_km} กม.)`,
      });

      // Also auto-log activity
      await fetch('/api/portfolio/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          company_lead_id: lead.id,
          user_id: currentUser.id,
          activity_type: 'MEETING',
          content: `🎯 เช็คอินทริปเดินทางเข้าพบลูกค้าที่โรงงาน (สะสมระยะทาง +${cData.distance_from_prev_km} กม.)`,
        }),
      });

      await fetchActivities();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'เช็คอินทริปไม่สำเร็จ' });
    } finally {
      setIsCheckingIn(false);
    }
  };


  // Fetch activities timeline
  const fetchActivities = useCallback(async () => {
    if (!lead?.id || !companyId) return;
    setIsLoadingActivities(true);
    try {
      const res = await fetch(`/api/portfolio/activities?company_lead_id=${lead.id}&company_id=${companyId}`);
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch lead activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [lead?.id, companyId]);

  useEffect(() => {
    if (isOpen && lead) {
      setCurrentStatus(lead.status || 'NEW');
      setDealValue(lead.deal_value ? String(lead.deal_value) : '');
      setPriority(lead.priority || 'MEDIUM');
      setNewNote('');
      setFeedbackMsg(null);
      fetchActivities();
    }
  }, [isOpen, lead, fetchActivities]);

  if (!isOpen || !lead) return null;

  // Find active status item
  const currentStatusObj = STATUS_LIST.find(s => s.value === currentStatus) || STATUS_LIST[0];

  // Single Save Action
  const handleSaveCRM = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const numDealValue = dealValue ? Number(dealValue) : 0;
    const statusChanged = currentStatus !== (lead.status || 'NEW');
    const dealValueChanged = numDealValue !== Number(lead.deal_value || 0);
    const priorityChanged = priority !== (lead.priority || 'MEDIUM');
    const hasNewNote = !!newNote.trim();

    if (!statusChanged && !dealValueChanged && !priorityChanged && !hasNewNote) {
      setFeedbackMsg({ type: 'success', text: 'ข้อมูลเป็นปัจจุบันแล้ว ไม่มีการเปลี่ยนแปลง' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      if (statusChanged || dealValueChanged || priorityChanged) {
        const patchRes = await fetch('/api/portfolio', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: lead.id,
            company_id: companyId,
            status: currentStatus,
            deal_value: numDealValue,
            priority: priority,
            user_id: currentUser?.id,
          }),
        });

        if (!patchRes.ok) {
          const pData = await patchRes.json();
          throw new Error(pData.error || 'บันทึกข้อมูลไม่สำเร็จ');
        }
      }

      if (hasNewNote) {
        await fetch('/api/portfolio/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            company_lead_id: lead.id,
            user_id: currentUser?.id,
            activity_type: 'NOTE',
            content: newNote.trim(),
            status_change: statusChanged ? currentStatus : undefined,
            deal_value_change: dealValueChanged ? numDealValue : undefined,
          }),
        });
      }

      lead.status = currentStatus;
      lead.deal_value = numDealValue;
      lead.priority = priority;
      if (hasNewNote) {
        lead.notes = newNote.trim();
      }

      setFeedbackMsg({ type: 'success', text: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
      setNewNote('');
      await fetchActivities();

      if (onLeadUpdated) {
        onLeadUpdated();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const latestContactTimestamp = activities.length > 0 ? activities[0].created_at : getLeadLastContactDate(lead);
  const contactHealth = calculateContactHealth(latestContactTimestamp);

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop with smooth blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Main Bottom Sheet (Mobile) / Centered Modal (Desktop) */}
      <div className="relative z-10 w-full sm:max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">

        {/* Pull Handle Indicator (Mobile only) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full" />
        </div>

        {/* 1. HEADER */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Tag Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                📍 {lead.district || lead.province || 'สมุทรปราการ'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {lead.source_type === 'dbd' ? '🏢 DBD 390k+' : '🏭 โรงงาน 989'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{lead.sales_rep_name || currentUser?.full_name || 'คุณ'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${contactHealth.badgeClass}`}>
                <Clock className="w-3 h-3" />
                <span>{contactHealth.label}</span>
              </span>
            </div>

            {/* Company Name */}
            <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
              {lead.company_name}
            </h2>

            {/* Address */}
            <p className="text-xs text-slate-400 truncate flex items-center gap-1">
              <span className="text-slate-500 shrink-0">ที่อยู่:</span>
              <span className="truncate">{lead.address || '-'}</span>
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 scrollbar-thin">

          {/* Quick Contact & Trip Checkin Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">โทร {lead.phone}</span>
              </a>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-500 font-medium text-xs flex items-center justify-center">
                ไม่มีเบอร์โทร
              </div>
            )}

            {lead.lat && lead.lng ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>เปิด Google Maps</span>
              </a>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-500 font-medium text-xs flex items-center justify-center">
                ไม่มีพิกัด GPS
              </div>
            )}

            {/* 1-Tap Trip Checkin Button */}
            <button
              type="button"
              onClick={handleTripCheckin}
              disabled={isCheckingIn}
              className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
            >
              {isCheckingIn ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Car className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>เช็คอินทริปวันนี้</span>
            </button>
          </div>

          {/* Quick Pin Adjustment Tool */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>พิกัดโรงงาน: <strong className="text-white font-mono">{lead.lat ? `${Number(lead.lat).toFixed(5)}, ${Number(lead.lng).toFixed(5)}` : 'ยังไม่มีพิกัด'}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingLocation(!isEditingLocation)}
                className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] underline cursor-pointer"
              >
                {isEditingLocation ? '✕ ปิด' : '📍 แก้ไขพิกัด / วางลิงก์'}
              </button>
            </div>

            {isEditingLocation && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateLocation()}
                    placeholder="วางลิงก์ Google Maps (เช่น https://maps.app.goo.gl/...) หรือ 13.4095, 101.0035"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateLocation}
                    disabled={isSavingLocation || !locationInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition cursor-pointer shadow-md"
                  >
                    {isSavingLocation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>บันทึก</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-500">
                  💡 วางลิงก์ที่แชร์จาก Google Maps หรือพิมพ์พิกัดละติจูด, ลองจิจูด ระบบจะอัปเดตตำแหน่งโรงงานนี้ทันที
                </div>
              </div>
            )}
          </div>


          {/* CARD: CRM PIPELINE & DEAL DETAILS */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            
            {/* Pipeline Stage Tracker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>ขั้นตอนการขาย (Pipeline Stage)</span>
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentStatusObj.badgeBg}`}>
                  {currentStatusObj.emoji} {currentStatusObj.label}
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                {STATUS_LIST.map((st) => (
                  <div
                    key={st.value}
                    className={`flex-1 transition-all duration-300 ${
                      st.step <= currentStatusObj.step ? 'bg-blue-500' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Segmented Button Options */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {STATUS_LIST.map((st) => {
                  const isSelected = currentStatus === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setCurrentStatus(st.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? st.activeBg
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{st.emoji}</span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deal Value & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              
              {/* Deal Value Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <span>💰 มูลค่าดีลคาดการณ์</span>
                  <span className="text-[10px] text-slate-500 font-normal">(บาท)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">฿</span>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="เช่น 50000"
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <span>⚡ ระดับความสำคัญ</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Priority)</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {PRIORITY_LIST.map((p) => {
                    const isSelected = priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`py-2 rounded-xl text-[11px] transition text-center cursor-pointer border ${
                          isSelected
                            ? p.activeBg
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                        }`}
                      >
                        <span className="block text-[10px] leading-none mb-0.5">{p.icon}</span>
                        <span className="truncate block font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Note Textarea */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>บันทึกโน้ต / สรุปผลการคุยล่าสุด</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">เก็บบันทึกอัตโนมัติ</span>
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="เช่น คุยกับฝ่ายจัดซื้อแล้ว สนใจสั่งซื้อพาเลท 200 ชิ้น นัดส่งใบเสนอราคาพรุ่งนี้..."
                className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Feedback Alert */}
            {feedbackMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
              }`}>
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}
          </div>

          {/* SECTION: ACTIVITY TIMELINE FEED */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>ประวัติไทม์ไลน์ย้อนหลัง</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                {activities.length} รายการ
              </span>
            </div>

            {isLoadingActivities ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>กำลังโหลดประวัติ...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">ยังไม่มีประวัติการบันทึก</p>
                <p className="text-[11px] text-slate-500">พิมพ์โน้ตหรือเปลี่ยนสถานะด้านบน แล้วกดบันทึกเพื่อเริ่มสร้างประวัติ</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {activities.map((act) => {
                  const isStatusChange = act.activity_type === 'STATUS_CHANGE';
                  return (
                    <div
                      key={act.id}
                      className="relative group"
                    >
                      {/* Timeline Dot Indicator */}
                      <div className={`absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        isStatusChange ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-slate-600'
                      }`} />

                      <div className={`rounded-xl p-3 text-xs transition border ${
                        isStatusChange
                          ? 'bg-blue-950/20 border-blue-500/20 text-blue-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            {act.author?.avatar_url ? (
                              <img
                                src={act.author.avatar_url}
                                alt={act.author.full_name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-slate-700 text-[8px] font-bold text-white flex items-center justify-center">
                                {act.author?.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <span className="font-semibold text-slate-200 text-[11px]">
                              {act.author?.full_name || 'ทีมงานขาย'}
                            </span>
                            {isStatusChange && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                สถานะ
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(act.created_at)}
                          </span>
                        </div>

                        <p className="whitespace-pre-line leading-relaxed text-xs">
                          {act.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 3. STICKY BOTTOM ACTION BAR */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800/90 flex items-center gap-2.5 shrink-0 pb-safe">
          {/* Release Lead Button */}
          {onReleaseLead && (
            <button
              type="button"
              onClick={() => {
                onReleaseLead(lead.id, lead.company_name);
                onClose();
              }}
              className="p-2.5 sm:px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="ส่งคืนคลังกลาง (เลือกเหตุผล)"
            >
              <Inbox className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">ส่งคืนคลังกลาง</span>
            </button>
          )}

          {/* Primary Save Button (Prominent Full Width CTA) */}
          <button
            type="button"
            onClick={() => handleSaveCRM()}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>บันทึกข้อมูล CRM</span>
              </>
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white font-semibold transition cursor-pointer shrink-0"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};

export default LeadCRMModal;
