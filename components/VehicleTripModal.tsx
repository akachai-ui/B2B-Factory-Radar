'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleTrip, TripCheckin, TripCheckinType } from '@/lib/types';
import {
  X,
  Car,
  Gauge,
  Camera,
  MapPin,
  Clock,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Plus,
  History,
  Calendar,
  DollarSign,
  Loader2,
  ChevronRight,
  Sparkles,
  Coffee,
  Store,
  Upload,
  ArrowRight,
  Info,
} from 'lucide-react';

interface VehicleTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: VehicleTrip | null;
  onTripUpdated: () => void;
  initialMode?: 'start' | 'end' | 'history' | 'active';
}

export function VehicleTripModal({
  isOpen,
  onClose,
  activeTrip,
  onTripUpdated,
  initialMode = 'active',
}: VehicleTripModalProps) {
  const { user, profile } = useAuth();

  const [currentTab, setCurrentTab] = useState<'current' | 'history'>(
    initialMode === 'history' ? 'history' : 'current'
  );

  // Form State: Start Trip
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | 'van'>('car');
  const [licensePlate, setLicensePlate] = useState('');
  const [startOdometer, setStartOdometer] = useState<string>('');
  const [startPhotoUrl, setStartPhotoUrl] = useState<string>('');
  const [startLocationName, setStartLocationName] = useState('ตำแหน่งปัจจุบัน (GPS)');
  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLng, setStartLng] = useState<number | null>(null);
  const [fuelRate, setFuelRate] = useState<number>(5.0);

  // Form State: End Trip
  const [endOdometer, setEndOdometer] = useState<string>('');
  const [endPhotoUrl, setEndPhotoUrl] = useState<string>('');
  const [personalDeductKm, setPersonalDeductKm] = useState<string>('0');
  const [tripNotes, setTripNotes] = useState<string>('');
  const [endLocationName, setEndLocationName] = useState('จุดสิ้นสุดเดินทาง');
  const [endLat, setEndLat] = useState<number | null>(null);
  const [endLng, setEndLng] = useState<number | null>(null);

  // Form State: Add Stop / Checkin
  const [showAddStop, setShowAddStop] = useState(false);
  const [stopType, setStopType] = useState<TripCheckinType>('CLIENT_VISIT');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [stopLocationName, setStopLocationName] = useState('');
  const [stopNotes, setStopNotes] = useState('');
  const [portfolioLeads, setPortfolioLeads] = useState<any[]>([]);


  // UI state
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // History State
  const [tripsHistory, setTripsHistory] = useState<VehicleTrip[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const startFileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);

  // Company Policy State
  const [companyPolicy, setCompanyPolicy] = useState<any>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setCurrentTab(initialMode === 'history' ? 'history' : 'current');
      captureCurrentLocation('start');
      loadCompanyPolicy();
      loadPortfolioLeads();

      if (activeTrip) {
        setVehicleType((activeTrip.vehicle_type as any) || 'car');
        setLicensePlate(activeTrip.license_plate || '');
        setFuelRate(Number(activeTrip.fuel_rate_per_km) || 5.0);
      } else {
        // Load default license plate from localStorage if available
        const savedPlate = localStorage.getItem('last_license_plate');
        if (savedPlate) setLicensePlate(savedPlate);
        setStartOdometer('');
        setStartPhotoUrl('');
      }

      loadHistory();
    }
  }, [isOpen, activeTrip, initialMode, currentTab]);

  // Realtime subscription for VehicleTripModal
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const channel = supabase
      .channel('vehicle_modal_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_trips',
        },
        () => {
          loadHistory();
          onTripUpdated();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user?.id, onTripUpdated]);

  const loadPortfolioLeads = async () => {
    const compId = profile?.company_id || user?.id;
    if (!compId || !user?.id) return;
    try {
      const res = await fetch(`/api/portfolio?company_id=${compId}&user_id=${user.id}`);
      const data = await res.json();
      if (data.success && data.leads) {
        setPortfolioLeads(data.leads);
        if (data.leads.length > 0) {
          setSelectedLeadId(data.leads[0].id);
          setStopLocationName(data.leads[0].company_name || data.leads[0].name || '');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch portfolio leads:', err);
    }
  };

  const loadCompanyPolicy = async () => {

    const compId = profile?.company_id || user?.id;
    if (!compId) return;
    try {
      const res = await fetch(`/api/trips/policy?company_id=${compId}`);
      const data = await res.json();
      if (data.success && data.policy) {
        setCompanyPolicy(data.policy);
        if (!activeTrip) {
          const p = data.policy;
          if (vehicleType === 'car') setFuelRate(Number(p.car_rate_per_km) || 5.0);
          else if (vehicleType === 'motorcycle') setFuelRate(Number(p.motorcycle_rate_per_km) || 2.5);
          else if (vehicleType === 'van') setFuelRate(Number(p.van_rate_per_km) || 6.0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch policy:', err);
    }
  };

  const handleSelectVehicle = (vType: 'car' | 'motorcycle' | 'van') => {
    setVehicleType(vType);
    if (companyPolicy) {
      if (vType === 'car') setFuelRate(Number(companyPolicy.car_rate_per_km) || 5.0);
      else if (vType === 'motorcycle') setFuelRate(Number(companyPolicy.motorcycle_rate_per_km) || 2.5);
      else if (vType === 'van') setFuelRate(Number(companyPolicy.van_rate_per_km) || 6.0);
    } else {
      if (vType === 'car') setFuelRate(5.0);
      else if (vType === 'motorcycle') setFuelRate(2.5);
      else if (vType === 'van') setFuelRate(6.0);
    }
  };


  // Capture GPS Location
  const captureCurrentLocation = (target: 'start' | 'end') => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    setIsCapturingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (target === 'start') {
          setStartLat(lat);
          setStartLng(lng);
          setStartLocationName(`พิกัด ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setEndLat(lat);
          setEndLng(lng);
          setEndLocationName(`พิกัด ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setIsCapturingGPS(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Upload Photo to Supabase Storage 'trip-photos'
  const handleUploadPhoto = async (file: File, target: 'start' | 'end') => {
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${target}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        // If storage bucket has permission issue, convert to Data URL for instant fallback preview
        console.warn('Upload fallback to Data URL:', uploadError.message);
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (target === 'start') setStartPhotoUrl(result);
          else setEndPhotoUrl(result);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('trip-photos')
          .getPublicUrl(fileName);

        if (target === 'start') setStartPhotoUrl(publicUrl);
        else setEndPhotoUrl(publicUrl);
      }
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setErrorMsg('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Start Trip Submission
  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startOdometer || isNaN(Number(startOdometer))) {
      setErrorMsg('กรุณากรอกเลขไมล์เริ่มต้นให้ถูกต้อง');
      return;
    }
    if (!licensePlate.trim()) {
      setErrorMsg('กรุณาระบุทะเบียนรถ');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      localStorage.setItem('last_license_plate', licensePlate.trim());

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: profile?.company_id || user?.id,
          user_id: user?.id,
          vehicle_type: vehicleType,
          license_plate: licensePlate.trim(),
          start_odometer: Number(startOdometer),
          start_photo_url: startPhotoUrl || null,
          start_lat: startLat,
          start_lng: startLng,
          start_location_name: startLocationName,
          fuel_rate_per_km: fuelRate,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to start trip');

      setStartOdometer('');
      setStartPhotoUrl('');
      setSuccessMsg('🚀 เริ่มบันทึกรอบการเดินทางประจำวันเรียบร้อยแล้ว!');
      onTripUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเริ่มทริป');
    } finally {
      setIsSubmitting(false);
    }
  };

  // End Trip Submission
  const handleEndTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    if (!endOdometer || isNaN(Number(endOdometer))) {
      setErrorMsg('กรุณากรอกเลขไมล์สิ้นสุดให้ถูกต้อง');
      return;
    }

    const endOdo = Number(endOdometer);
    const startOdo = Number(activeTrip.start_odometer);

    if (endOdo < startOdo) {
      setErrorMsg(`เลขไมล์สิ้นสุด (${endOdo}) ต้องมากกว่าหรือเท่ากับเลขไมล์เช้า (${startOdo})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/trips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTrip.id,
          action: 'end',
          end_odometer: endOdo,
          end_photo_url: endPhotoUrl || null,
          end_lat: endLat,
          end_lng: endLng,
          end_location_name: endLocationName,
          personal_deduct_km: Number(personalDeductKm) || 0,
          notes: tripNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to end trip');

      setEndOdometer('');
      setEndPhotoUrl('');
      setPersonalDeductKm('0');
      setTripNotes('');
      setSuccessMsg('🎉 ปิดรอบการเดินทางและส่งคำขอเบิกค่าน้ำมันสำเร็จแล้ว!');
      onTripUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการปิดทริป');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Manual Stop / Checkin during Trip
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    let targetName = stopLocationName.trim();
    let targetLeadId: string | null = null;
    let curLat = startLat || 13.7563;
    let curLng = startLng || 100.5018;

    if (stopType === 'CLIENT_VISIT' && selectedLeadId) {
      const matchedLead = portfolioLeads.find((l) => l.id === selectedLeadId);
      if (matchedLead) {
        targetName = matchedLead.company_name || matchedLead.name || targetName;
        targetLeadId = matchedLead.id;
        if (matchedLead.lat && matchedLead.lng) {
          curLat = Number(matchedLead.lat);
          curLng = Number(matchedLead.lng);
        }
      }
    }

    if (!targetName) {
      setErrorMsg('กรุณาระบุชื่อสถานที่หรือเลือกโรงงาน');
      return;
    }

    setIsSubmitting(true);
    try {
      if (stopType !== 'CLIENT_VISIT' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          curLat = pos.coords.latitude;
          curLng = pos.coords.longitude;
        } catch {
          // use fallback
        }
      }

      const res = await fetch('/api/trips/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip.id,
          company_id: activeTrip.company_id,
          user_id: user?.id,
          company_lead_id: targetLeadId,
          checkin_type: stopType,
          location_name: targetName,
          lat: curLat,
          lng: curLng,
          notes: stopNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add stop');

      setSuccessMsg(`บันทึกจุดแวะ "${targetName}" เรียบร้อย (+${data.distance_from_prev_km || 0} กม.)`);
      setShowAddStop(false);
      setStopLocationName('');
      setStopNotes('');
      onTripUpdated();
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกจุดแวะพักไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Load My History
  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/trips?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setTripsHistory(data.trips || []);
      }
    } catch (err) {
      console.error('Error loading trips history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // Realtime calculations for End Trip preview
  const calcEndOdo = Number(endOdometer) || (activeTrip ? Number(activeTrip.start_odometer) : 0);
  const calcStartOdo = activeTrip ? Number(activeTrip.start_odometer) : 0;
  const calcTotalOdoKm = Math.max(0, calcEndOdo - calcStartOdo);
  const calcDeductKm = Number(personalDeductKm) || 0;
  const calcNetClaimKm = Math.max(0, calcTotalOdoKm - calcDeductKm);
  const calcRate = activeTrip ? Number(activeTrip.fuel_rate_per_km || 5.0) : fuelRate;
  const calcClaimAmount = Math.round(calcNetClaimKm * calcRate * 100) / 100;
  const routeKm = activeTrip ? Number(activeTrip.total_route_km || 0) : 0;
  const kmDifference = calcTotalOdoKm - routeKm;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  บันทึกไมล์ & ค่าน้ำมัน
                </h2>
                {activeTrip && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    กำลังเดินทาง
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">ระบบบันทึกไมล์ & คำนวณเบิกจ่ายอัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/50 px-2 pt-1.5">
          <button
            onClick={() => setCurrentTab('current')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              currentTab === 'current'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{activeTrip ? 'ทริปปัจจุบัน (Active)' : 'เริ่มเดินทาง (Start)'}</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('history');
              loadHistory();
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              currentTab === 'history'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ประวัติการเบิกค่าน้ำมัน</span>
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-200">
          {currentTab === 'history' ? (
            /* ============================================================ */
            /* TAB: TRIPS HISTORY                                            */
            /* ============================================================ */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  รายการเดินทางและประวัติการเบิกจ่ายทั้งหมด ({tripsHistory.length} รายการ)
                </span>
                <button
                  onClick={loadHistory}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" /> รีเฟรช
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  กำลังโหลดประวัติการเดินทาง...
                </div>
              ) : tripsHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  ยังไม่มีประวัติการบันทึกเลขไมล์
                </div>
              ) : (
                <div className="space-y-3">
                  {tripsHistory.map((trip) => {
                    const odoKm = Number(trip.total_odometer_km) || 0;
                    const rKm = Number(trip.total_route_km) || 0;
                    const claimAmount = Number(trip.total_fuel_amount) || 0;
                    const isApproved = trip.status === 'approved';
                    const isRejected = trip.status === 'rejected';
                    const isInProgress = trip.status === 'in_progress';

                    return (
                      <div
                        key={trip.id}
                        className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {trip.trip_date}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({trip.license_plate || 'ไม่ระบุทะเบียน'})
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              ไมล์: {Number(trip.start_odometer).toLocaleString()} →{' '}
                              {trip.end_odometer ? Number(trip.end_odometer).toLocaleString() : '—'}
                            </span>
                          </div>

                          <div className="text-right">
                            {isInProgress ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                กำลังเดินทาง
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                                ไม่อนุมัติ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                รอตรวจสอบ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/40 p-2.5 rounded-lg text-xs">
                          <div>
                            <div className="text-slate-400 text-[10px]">ระยะทางไมล์</div>
                            <div className="font-bold text-white">{odoKm.toFixed(1)} กม.</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px]">รูทเช็คอิน GPS</div>
                            <div className="font-bold text-amber-300">{rKm.toFixed(1)} กม.</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px]">ยอดเบิกค่าน้ำมัน</div>
                            <div className="font-bold text-emerald-400">
                              ฿{claimAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Photos if any */}
                        {(trip.start_photo_url || trip.end_photo_url) && (
                          <div className="flex gap-2 pt-1">
                            {trip.start_photo_url && (
                              <a
                                href={trip.start_photo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                              >
                                📷 รูปไมล์เช้า
                              </a>
                            )}
                            {trip.end_photo_url && (
                              <a
                                href={trip.end_photo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                              >
                                📷 รูปไมล์เย็น
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : !activeTrip ? (
            /* ============================================================ */
            /* TAB: START TRIP (เริ่มออกเดินทางเช้า)                          */
            /* ============================================================ */
            <form onSubmit={handleStartTrip} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-300">ขั้นตอนง่ายๆ (1 นาที):</span> ถ่ายรูปหน้าปัดไมล์ + ระบุเลขไมล์ ระบบจะจับพิกัด GPS และคำนวณเบิกจ่ายให้อัตโนมัติเมื่อเช็คอินโรงงาน
                </div>
              </div>

              {/* Vehicle Type & Plate */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ประเภทยานพาหนะ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'car', icon: '🚗', name: 'รถยนต์', rate: companyPolicy ? Number(companyPolicy.car_rate_per_km) || 5.0 : 5.0 },
                        { id: 'motorcycle', icon: '🛵', name: 'มอไซค์', rate: companyPolicy ? Number(companyPolicy.motorcycle_rate_per_km) || 2.5 : 2.5 },
                        { id: 'van', icon: '🚐', name: 'รถตู้', rate: companyPolicy ? Number(companyPolicy.van_rate_per_km) || 6.0 : 6.0 },
                      ] as const
                    ).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVehicle(v.id as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                          vehicleType === v.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold whitespace-nowrap">{v.icon} {v.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">฿{v.rate}/กม.</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ทะเบียนรถ (เช่น 1กข-9999) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="ระบุเลขทะเบียน"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Starting Odometer & Photo */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>เลขไมล์เริ่มต้น (Start KM)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700 shrink-0">
                    <span className="text-[10px] text-slate-400">อัตราเบิก:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      disabled={Boolean(companyPolicy && !companyPolicy.allow_sales_override_rate && profile?.role === 'sales')}
                      value={fuelRate}
                      onChange={(e) => setFuelRate(Number(e.target.value) || 0)}
                      className="w-8 bg-transparent text-amber-400 font-bold text-xs text-right focus:outline-none disabled:opacity-75"
                    />
                    <span className="text-[10px] text-amber-400 font-medium">฿/กม.</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value)}
                    placeholder="เช่น 124500"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-semibold">
                    KM
                  </span>
                </div>

                {/* Upload Photo of Odometer */}
                <div>
                  <input
                    type="file"
                    ref={startFileInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPhoto(file, 'start');
                    }}
                  />

                  {startPhotoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 h-32 flex items-center justify-center group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={startPhotoUrl}
                        alt="Start Odometer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> ถ่ายใหม่
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => startFileInputRef.current?.click()}
                      className="w-full py-3 px-3 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-all text-xs text-slate-300 flex items-center justify-center gap-2"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                          <span>กำลังอัปโหลดรูปภาพ...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>ถ่ายรูปหน้าปัดไมล์ตอนเช้า (แนะนำ)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Start Location (GPS) */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{startLocationName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => captureCurrentLocation('start')}
                  className="text-amber-400 hover:text-amber-300 shrink-0 font-medium ml-2"
                >
                  {isCapturingGPS ? 'กำลังจับพิกัด...' : 'รีเฟรช GPS'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !startOdometer}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังบันทึกทริป...
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4" />
                    ยืนยันเริ่มออกเดินทางประจำวัน
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ============================================================ */
            /* TAB: ACTIVE TRIP DASHBOARD & END TRIP                          */
            /* ============================================================ */
            <div className="space-y-5">
              {/* Active Trip Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-amber-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      ทริปประจำวันที่ {typeof activeTrip.trip_date === 'string' ? activeTrip.trip_date.split('T')[0] : activeTrip.trip_date}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {activeTrip.license_plate}
                    </span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">
                    อัตราเบิก ฿{activeTrip.fuel_rate_per_km}/กม.
                  </span>
                </div>


                {/* Dashboard Metrics */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">ไมล์เริ่มต้น</div>
                    <div className="font-bold text-white font-mono text-sm sm:text-base">
                      {Number(activeTrip.start_odometer).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">จุดเช็คอิน</div>
                    <div className="font-bold text-amber-400 text-sm sm:text-base">
                      {activeTrip.checkins?.length || 0} จุด
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">ระยะทางรูท GPS</div>
                    <div className="font-bold text-emerald-400 font-mono text-sm sm:text-base">
                      {Number(activeTrip.total_route_km || 0).toFixed(1)} กม.
                    </div>
                  </div>
                </div>

                {/* Check-ins Trail List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-amber-400" />
                      เส้นทางและจุดแวะวันนี้ ({activeTrip.checkins?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddStop(!showAddStop)}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> เช็คอินโรงงาน / แวะพัก
                    </button>
                  </div>

                  {/* Add Extra Stop Box */}
                  {showAddStop && (
                    <form
                      onSubmit={handleAddStop}
                      className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-700/80 space-y-2.5 animate-in fade-in"
                    >
                      <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> บันทึกจุดเช็คอิน / แวะพักระหว่างวัน
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">ประเภทจุดแวะ</label>
                          <select
                            value={stopType}
                            onChange={(e) => {
                              const newType = e.target.value as any;
                              setStopType(newType);
                              if (newType === 'CLIENT_VISIT' && portfolioLeads.length > 0) {
                                setSelectedLeadId(portfolioLeads[0].id);
                                setStopLocationName(portfolioLeads[0].company_name || '');
                              } else {
                                setStopLocationName('');
                              }
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="CLIENT_VISIT">🏭 เช็คอินโรงงานลูกค้า (จากพอร์ตของฉัน)</option>
                            <option value="LUNCH_BREAK">🍱 พักเที่ยง / ทานข้าว</option>
                            <option value="GAS_STATION">⛽ แวะปั๊มน้ำมัน</option>
                            <option value="OTHER">☕ ธุระอื่นๆ / เดินทางทั่วไป</option>
                          </select>
                        </div>

                        {stopType === 'CLIENT_VISIT' ? (
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              เลือกโรงงานลูกค้าในความดูแล ({portfolioLeads.length} แห่ง)
                            </label>
                            {portfolioLeads.length > 0 ? (
                              <select
                                value={selectedLeadId}
                                onChange={(e) => {
                                  setSelectedLeadId(e.target.value);
                                  const lead = portfolioLeads.find((l) => l.id === e.target.value);
                                  if (lead) setStopLocationName(lead.company_name || '');
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                              >
                                {portfolioLeads.map((lead) => (
                                  <option key={lead.id} value={lead.id}>
                                    🏭 {lead.company_name} ({lead.district || 'สมุทรปราการ'})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                required
                                value={stopLocationName}
                                onChange={(e) => setStopLocationName(e.target.value)}
                                placeholder="พิมพ์ชื่อโรงงานลูกค้า"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">ชื่อสถานที่ / ร้าน / ปั๊ม</label>
                            <input
                              type="text"
                              required
                              value={stopLocationName}
                              onChange={(e) => setStopLocationName(e.target.value)}
                              placeholder="เช่น ปั๊ม ปตท. เทพารักษ์ / ร้านข้าวมันไก่"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddStop(false)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          บันทึกจุดนี้
                        </button>
                      </div>
                    </form>
                  )}


                  {/* Stops Timeline */}
                  {activeTrip.checkins && activeTrip.checkins.length > 0 ? (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {activeTrip.checkins.map((chk, idx) => (
                        <div
                          key={chk.id || idx}
                          className="flex items-center justify-between text-xs bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="truncate text-slate-200">{chk.location_name}</span>
                          </div>
                          <span className="text-[11px] text-amber-400 font-mono shrink-0 ml-2">
                            +{Number(chk.distance_from_prev_km || 0).toFixed(1)} กม.
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic py-2 text-center bg-slate-950/30 rounded-lg border border-slate-800/60">
                      ยังไม่มีการเช็คอินโรงงาน ระบบจะคำนวณระยะทางทันทีเมื่อคุณกดเช็คอินในระบบ CRM!
                    </div>
                  )}
                </div>
              </div>

              {/* End Trip Form */}
              <form onSubmit={handleEndTrip} className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    ปิดทริปเย็น & คำนวณเบิกจ่ายค่าน้ำมัน
                  </h3>
                  <span className="text-xs text-slate-400">สิ้นสุดวันทำงาน</span>
                </div>

                {/* End Odometer Input */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      เลขไมล์สิ้นสุด (End Odometer) <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      ไมล์เช้า: {Number(activeTrip.start_odometer).toLocaleString()} KM
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(e.target.value)}
                      placeholder={`ต้องมากกว่า ${Number(activeTrip.start_odometer)}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-semibold">
                      KM
                    </span>
                  </div>

                  {/* Photo Upload End Odometer */}
                  <div>
                    <input
                      type="file"
                      ref={endFileInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhoto(file, 'end');
                      }}
                    />

                    {endPhotoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 h-28 flex items-center justify-center group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={endPhotoUrl}
                          alt="End Odometer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => endFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" /> ถ่ายใหม่
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => endFileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 border border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-all text-xs text-slate-300 flex items-center justify-center gap-2"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            กำลังอัปโหลดรูปภาพ...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 text-emerald-400" />
                            ถ่ายรูปหน้าปัดไมล์รถตอนเย็น (ยืนยันระยะทางจริง)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Personal Deduct & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      หักระยะทางธุระส่วนตัว (กม.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={personalDeductKm}
                      onChange={(e) => setPersonalDeductKm(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      หมายเหตุการเดินทาง
                    </label>
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={(e) => setTripNotes(e.target.value)}
                      placeholder="เช่น มีแวะส่งเอกสารเพิ่ม"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Live Comparison Box */}
                {endOdometer && calcTotalOdoKm > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>📊 สรุปเปรียบเทียบระยะทาง & ยอดขอเบิก</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        เรท {calcRate} ฿/กม.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">ไมล์วิ่งจริง</div>
                        <div className="font-bold text-white font-mono">
                          {calcTotalOdoKm.toFixed(1)} กม.
                        </div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">รูทลูกค้า GPS</div>
                        <div className="font-bold text-amber-300 font-mono">
                          {routeKm.toFixed(1)} กม.
                        </div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">ส่วนต่าง</div>
                        <div
                          className={`font-bold font-mono ${
                            kmDifference > 20
                              ? 'text-red-400'
                              : kmDifference > 10
                              ? 'text-yellow-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {kmDifference >= 0 ? `+${kmDifference.toFixed(1)}` : kmDifference.toFixed(1)}{' '}
                          กม.
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">ยอดเงินค่าน้ำมันสุทธิ:</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        ฿{calcClaimAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit End Trip */}
                <button
                  type="submit"
                  disabled={isSubmitting || !endOdometer}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังส่งข้อมูลปิดทริป...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ปิดทริป & ส่งขออนุมัติเบิกค่าน้ำมัน</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
