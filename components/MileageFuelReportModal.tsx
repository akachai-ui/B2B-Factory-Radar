'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleTrip } from '@/lib/types';
import { FuelPolicySettingsModal } from '@/components/FuelPolicySettingsModal';
import {
  X,
  Gauge,
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  User,
  Fuel,
  Loader2,
  ExternalLink,
  Search,
  Check,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';


interface MileageFuelReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MileageFuelReportModal({ isOpen, onClose }: MileageFuelReportModalProps) {
  const { user, profile } = useAuth();

  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRep, setSelectedRep] = useState<string>('ALL');
  const [processingTripId, setProcessingTripId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);


  // Load Trips data
  const loadTrips = async () => {
    if (!profile?.company_id && !user?.id) return;
    setIsLoading(true);
    try {
      const companyId = profile?.company_id || user?.id;
      let url = `/api/trips?company_id=${companyId}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Error loading trips report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadTrips();

    const channel = supabase
      .channel('fuel_report_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_trips',
        },
        () => {
          loadTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, statusFilter]);

  // Handle Approve / Reject
  const handleAction = async (tripId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    setProcessingTripId(tripId);
    try {
      let rejectionReason: string | null = null;
      if (action === 'reject') {
        rejectionReason = prompt('ระบุเหตุผลในการไม่อนุมัติ (เช่น เลขไมล์ไม่ตรงกับรูปภาพ):') || 'ไม่ผ่านเกณฑ์การตรวจสอบ';
      }

      const res = await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tripId,
          action,
          approved_by: user.id,
          rejection_reason: rejectionReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, ...data.trip, approver_name: profile?.full_name } : t))
        );
      }
    } catch (err) {
      console.error('Error updating trip status:', err);
    } finally {
      setProcessingTripId(null);
    }
  };

  // Export to CSV for Accounting
  const exportToCSV = () => {
    if (trips.length === 0) return;

    const headers = [
      'วันที่',
      'พนักงานขาย',
      'อีเมล',
      'ทะเบียนรถ',
      'ประเภทยานพาหนะ',
      'ไมล์เช้า',
      'ไมล์เย็น',
      'ระยะทางจริง (กม.)',
      'ระยะทางรูท GPS (กม.)',
      'ส่วนต่าง (กม.)',
      'หักส่วนตัว (กม.)',
      'กม. ที่ขอเบิก',
      'เรทต่อ กม. (บาท)',
      'ยอดเบิกค่าน้ำมัน (บาท)',
      'สถานะ',
      'ผู้อนุมัติ',
    ];

    const rows = filteredTrips.map((t) => {
      const odoKm = Number(t.total_odometer_km) || 0;
      const rKm = Number(t.total_route_km) || 0;
      const diffKm = odoKm - rKm;
      return [
        `"${t.trip_date}"`,
        `"${t.user_name || 'ไม่ระบุ'}"`,
        `"${t.user_email || ''}"`,
        `"${t.license_plate || ''}"`,
        `"${t.vehicle_type || 'car'}"`,
        t.start_odometer,
        t.end_odometer || '',
        odoKm.toFixed(1),
        rKm.toFixed(1),
        diffKm.toFixed(1),
        t.personal_deduct_km || 0,
        t.net_claimable_km || '',
        t.fuel_rate_per_km,
        t.total_fuel_amount || 0,
        `"${t.status}"`,
        `"${t.approver_name || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fuel_reimbursement_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    if (selectedRep !== 'ALL' && t.user_id !== selectedRep) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = t.user_name?.toLowerCase().includes(q);
      const matchPlate = t.license_plate?.toLowerCase().includes(q);
      const matchDate = t.trip_date?.includes(q);
      if (!matchName && !matchPlate && !matchDate) return false;
    }
    return true;
  });

  // Calculate Aggregates
  const totalKmClaimed = filteredTrips.reduce((acc, t) => acc + (Number(t.net_claimable_km) || 0), 0);
  const totalFuelAmount = filteredTrips.reduce((acc, t) => acc + (Number(t.total_fuel_amount) || 0), 0);
  const pendingCount = filteredTrips.filter((t) => t.status === 'completed').length;
  const approvedCount = filteredTrips.filter((t) => t.status === 'approved').length;

  // Unique reps for filter
  const uniqueReps = Array.from(
    new Map(
      trips
        .filter((t) => t.user_id)
        .map((t) => [t.user_id, { id: t.user_id, name: t.user_name || t.user_email || 'พนักงาน' }])
    ).values()
  );

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Fuel className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  รายงานตรวจสอบไมล์ & อนุมัติเบิกจ่าย
                </h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                  ผู้บริหาร / บัญชี
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                ตรวจสอบไมล์จริง vs GPS พร้อมภาพถ่ายหน้าปัดไมล์
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end shrink-0">
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>⚙️ นโยบาย</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredTrips.length === 0}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-950/50 border-b border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">รวมระยะทางเบิกจ่าย</span>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {totalKmClaimed.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-slate-400">กม.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">ยอดเงินค่าน้ำมันรวม</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              ฿{totalFuelAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">รอการอนุมัติ</span>
            <div className="text-lg font-bold text-blue-400 font-mono mt-1 flex items-center gap-2">
              {pendingCount}{' '}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">อนุมัติแล้ว</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1 flex items-center gap-2">
              {approvedCount}{' '}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเซลล์, ทะเบียน, วันที่..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Rep filter */}
            {uniqueReps.length > 0 && (
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">👤 เซลล์ทุกคน ({uniqueReps.length})</option>
                {uniqueReps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {[
                { id: 'ALL', label: 'ทั้งหมด' },
                { id: 'completed', label: '⏳ รออนุมัติ' },
                { id: 'approved', label: '✅ อนุมัติแล้ว' },
                { id: 'in_progress', label: '🚗 กำลังวิ่ง' },
                { id: 'rejected', label: '❌ ไม่อนุมัติ' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === s.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadTrips}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            รีเฟรช
          </button>
        </div>

        {/* Trips Table / List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              กำลังโหลดข้อมูลการเดินทาง...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
              ไม่พบรายการเดินทางตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const odoKm = Number(trip.total_odometer_km) || 0;
              const routeKm = Number(trip.total_route_km) || 0;
              const diffKm = odoKm - routeKm;
              const variancePct = routeKm > 0 ? ((diffKm / routeKm) * 100) : 0;
              const isHighVariance = diffKm > 15 && variancePct > 25;
              const isPending = trip.status === 'completed';
              const isApproved = trip.status === 'approved';
              const isRejected = trip.status === 'rejected';

              return (
                <div
                  key={trip.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-slate-800/80 border-blue-500/40 shadow-md'
                      : isApproved
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      : isRejected
                      ? 'bg-slate-900/60 border-red-500/20'
                      : 'bg-slate-900/60 border-amber-500/20'
                  }`}
                >
                  {/* Top Bar: User info, Date, Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-amber-400 text-sm">
                        {trip.user_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={trip.user_avatar}
                            alt={trip.user_name || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (trip.user_name || 'U').charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {trip.user_name || trip.user_email}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                            {trip.license_plate || 'ทะเบียน -'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>วันที่ {trip.trip_date}</span>
                          <span>•</span>
                          <span>{trip.vehicle_type === 'motorcycle' ? '🛵 มอเตอร์ไซค์' : '🚗 รถยนต์'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Approver Badge */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full animate-pulse">
                          รออนุมัติเบิกจ่าย
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว ({trip.approver_name || 'ผู้จัดการ'})
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ: {trip.rejection_reason}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                          กำลังเดินทาง
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Grid: Metric Comparison & Photos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {/* Column 1 & 2: Route & Mileage Analytics */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400">ไมล์เริ่มต้น → สิ้นสุด</div>
                          <div className="font-bold text-white font-mono mt-0.5">
                            {Number(trip.start_odometer).toLocaleString()} →{' '}
                            {trip.end_odometer ? Number(trip.end_odometer).toLocaleString() : '—'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400">ไมล์วิ่งจริง</div>
                          <div className="font-bold text-white font-mono mt-0.5">
                            {odoKm.toFixed(1)} กม.
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400">รูทลูกค้า GPS</div>
                          <div className="font-bold text-amber-300 font-mono mt-0.5">
                            {routeKm.toFixed(1)} กม.
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400">ส่วนต่าง</div>
                          <div
                            className={`font-bold font-mono mt-0.5 ${
                              isHighVariance
                                ? 'text-red-400 font-black'
                                : diffKm > 10
                                ? 'text-yellow-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {diffKm >= 0 ? `+${diffKm.toFixed(1)}` : diffKm.toFixed(1)} กม.
                          </div>
                        </div>
                      </div>

                      {/* Variance Warning Note if any */}
                      {isHighVariance && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>
                            <strong>แจ้งเตือน:</strong> ระยะทางไมล์รถวิ่งมากกว่ารูทเช็คอินลูกค้าเกิน {variancePct.toFixed(0)}% (+{diffKm.toFixed(1)} กม.) กรุณาตรวจสอบรูปถ่ายหน้าปัดไมล์
                          </span>
                        </div>
                      )}

                      {/* Stops Trail */}
                      {trip.checkins && trip.checkins.length > 0 && (
                        <div className="text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                          <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            จุดเช็คอิน ({trip.checkins.length} แห่ง):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {trip.checkins.map((chk, idx) => (
                              <span
                                key={chk.id || idx}
                                className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700"
                              >
                                <span>{idx + 1}.</span> {chk.location_name}{' '}
                                <span className="text-amber-400 font-mono">
                                  (+{Number(chk.distance_from_prev_km).toFixed(1)}k)
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes if any */}
                      {trip.notes && (
                        <div className="text-xs text-slate-400 italic">
                          💬 บันทึกเซลล์: {trip.notes}
                        </div>
                      )}
                    </div>

                    {/* Column 3: Dashboard Photos & Actions */}
                    <div className="flex flex-col justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                          รูปถ่ายหน้าปัดไมล์
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {trip.start_photo_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(trip.start_photo_url!)}
                              className="relative h-20 rounded-lg overflow-hidden border border-slate-700 group hover:border-amber-500 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={trip.start_photo_url}
                                alt="Start Odo"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center">
                                ไมล์เช้า
                              </span>
                            </button>
                          ) : (
                            <div className="h-20 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                              ไม่มีรูปเช้า
                            </div>
                          )}

                          {trip.end_photo_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(trip.end_photo_url!)}
                              className="relative h-20 rounded-lg overflow-hidden border border-slate-700 group hover:border-emerald-500 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={trip.end_photo_url}
                                alt="End Odo"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center">
                                ไมล์เย็น
                              </span>
                            </button>
                          ) : (
                            <div className="h-20 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                              ไม่มีรูปเย็น
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Claim Total & Approval Buttons */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">ยอดเงินขอเบิก:</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            ฿{Number(trip.total_fuel_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {isPending && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleAction(trip.id, 'reject')}
                              disabled={processingTripId === trip.id}
                              className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs rounded-lg border border-red-500/30 flex items-center justify-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                            </button>
                            <button
                              onClick={() => handleAction(trip.id, 'approve')}
                              disabled={processingTripId === trip.id}
                              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติเบิกจ่าย
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fullscreen Photo Modal Zoom */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Zoomed Odometer"
              className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            />
          </div>
        )}

        {/* Company Fuel Policy Settings Modal */}
        <FuelPolicySettingsModal
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          onPolicySaved={() => {
            loadTrips();
          }}
        />
      </div>
    </div>
  );
}

