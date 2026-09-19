'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyFuelPolicy, FuelCalculationMode } from '@/lib/types';
import {
  X,
  Settings,
  ShieldCheck,
  Fuel,
  Car,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Camera,
  MapPin,
  TrendingUp,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface FuelPolicySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicySaved?: () => void;
}

export function FuelPolicySettingsModal({
  isOpen,
  onClose,
  onPolicySaved,
}: FuelPolicySettingsModalProps) {
  const { user, profile } = useAuth();
  const companyId = profile?.company_id || user?.id;

  const [carRate, setCarRate] = useState<number>(5.0);
  const [motorcycleRate, setMotorcycleRate] = useState<number>(2.5);
  const [vanRate, setVanRate] = useState<number>(6.0);
  const [calculationMode, setCalculationMode] = useState<FuelCalculationMode>('odometer');
  const [varianceTolerance, setVarianceTolerance] = useState<number>(15.0);
  const [requirePhoto, setRequirePhoto] = useState<boolean>(true);
  const [requireCheckin, setRequireCheckin] = useState<boolean>(true);
  const [allowSalesOverride, setAllowSalesOverride] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && companyId) {
      loadPolicy();
    }
  }, [isOpen, companyId]);

  const loadPolicy = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trips/policy?company_id=${companyId}`);
      const data = await res.json();
      if (data.success && data.policy) {
        const p = data.policy;
        setCarRate(Number(p.car_rate_per_km) || 5.0);
        setMotorcycleRate(Number(p.motorcycle_rate_per_km) || 2.5);
        setVanRate(Number(p.van_rate_per_km) || 6.0);
        setCalculationMode(p.calculation_mode || 'odometer');
        setVarianceTolerance(Number(p.variance_tolerance_pct) || 15.0);
        setRequirePhoto(p.require_photo_odometer !== false);
        setRequireCheckin(p.require_client_checkin !== false);
        setAllowSalesOverride(Boolean(p.allow_sales_override_rate));
      }
    } catch (err) {
      console.error('Error loading fuel policy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/trips/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          car_rate_per_km: carRate,
          motorcycle_rate_per_km: motorcycleRate,
          van_rate_per_km: vanRate,
          calculation_mode: calculationMode,
          variance_tolerance_pct: varianceTolerance,
          require_photo_odometer: requirePhoto,
          require_client_checkin: requireCheckin,
          allow_sales_override_rate: allowSalesOverride,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save policy');

      setFeedback({ type: 'success', text: 'บันทึกนโยบายค่าน้ำมันของบริษัทเรียบร้อยแล้ว!' });
      if (onPolicySaved) onPolicySaved();

      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                นโยบายค่าน้ำมันประจำบริษัท
                <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                  Owner / Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">กำหนดเรทและสูตรการคำนวณเงินเบิกจ่ายให้ฝ่ายขาย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSavePolicy} className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-200">
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              กำลังโหลดการตั้งค่า...
            </div>
          ) : (
            <>
              {/* SECTION 1: Standard Rates */}
              <div className="space-y-3">
                <label className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  1. อัตราค่าน้ำมันมาตรฐาน (บาท/กิโลเมตร)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">🚗 รถยนต์</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="50"
                        required
                        value={carRate}
                        onChange={(e) => setCarRate(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold font-mono text-sm focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">🛵 มอเตอร์ไซค์</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="50"
                        required
                        value={motorcycleRate}
                        onChange={(e) => setMotorcycleRate(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold font-mono text-sm focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">🚐 รถตู้/กระบะ</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="50"
                        required
                        value={vanRate}
                        onChange={(e) => setVanRate(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold font-mono text-sm focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">฿</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Calculation Model */}
              <div className="space-y-3 pt-1">
                <label className="font-bold text-white text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  2. วิธีการคำนวณระยะทางขอเบิก (Calculation Model)
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'odometer' as FuelCalculationMode,
                      title: '📊 ไมล์รถจริง (Odometer Based)',
                      desc: 'คำนวณจาก ไมล์เย็น - ไมล์เช้า (เหมาะกับบริษัทที่เน้นความคล่องตัว)',
                    },
                    {
                      id: 'gps_route' as FuelCalculationMode,
                      title: '📍 ระยะทางรูทลูกค้า GPS (GPS Strictly)',
                      desc: 'คำนวณจากระยะทางที่เช็คอินโรงงานลูกค้าเท่านั้น (ป้องกันวิ่งนอกลู่นอกทาง)',
                    },
                    {
                      id: 'min_rule' as FuelCalculationMode,
                      title: '⚖️ ยึดค่าน้อยกว่า (Conservative Rule)',
                      desc: 'จ่ายตามค่าที่น้อยกว่าระหว่าง (ไมล์รถจริง vs รูท GPS) — ประหยัดงบสุด',
                    },
                  ].map((m) => (
                    <label
                      key={m.id}
                      onClick={() => setCalculationMode(m.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        calculationMode === m.id
                          ? 'bg-blue-500/10 border-blue-500/60 text-white shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="calc_mode"
                        checked={calculationMode === m.id}
                        onChange={() => setCalculationMode(m.id)}
                        className="mt-0.5 accent-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-white">{m.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Variance Tolerance % */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    3. ส่วนต่างที่ยอมรับได้ (Variance Tolerance)
                  </label>
                  <span className="font-mono text-emerald-400 font-bold">{varianceTolerance}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ค่าเผื่อการกลับรถ / หาที่จอด / แวะเติมน้ำมัน หากไมล์รถจริงเกินกว่ารูท GPS มากกว่าเกณฑ์นี้ ระบบจะขึ้นแถบเตือนสีแดง
                </p>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={varianceTolerance}
                  onChange={(e) => setVarianceTolerance(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* SECTION 4: Security & Rules */}
              <div className="space-y-2.5 pt-1">
                <label className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  4. กฎข้อบังคับการเบิกจ่าย
                </label>
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">📷 บังคับถ่ายรูปหน้าปัดไมล์เช้า-เย็น</span>
                    <input
                      type="checkbox"
                      checked={requirePhoto}
                      onChange={(e) => setRequirePhoto(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer pt-1.5 border-t border-slate-900">
                    <span className="text-slate-300">📍 ต้องมีเช็คอินลูกค้าอย่างน้อย 1 จุด</span>
                    <input
                      type="checkbox"
                      checked={requireCheckin}
                      onChange={(e) => setRequireCheckin(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer pt-1.5 border-t border-slate-900">
                    <span className="text-slate-300">🔒 ล็อกไม่ให้เซลส์แก้เรทบาท/กม. เอง</span>
                    <input
                      type="checkbox"
                      checked={!allowSalesOverride}
                      onChange={(e) => setAllowSalesOverride(!e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึกนโยบาย...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      บันทึกนโยบายค่าน้ำมันบริษัท
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
