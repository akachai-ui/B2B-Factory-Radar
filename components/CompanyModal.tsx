'use client';

import React, { useState } from 'react';
import { Building2, X, MapPin, LocateFixed, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { CompanyProfile } from '@/lib/types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompany: CompanyProfile;
  onSaveCompany: (company: CompanyProfile) => void;
}

export const PRESET_HUBS: CompanyProfile[] = [
  {
    id: 'hub_bangna',
    name: 'สำนักงาน / ศูนย์กระจายสินค้า (โซนบางนา-บางพลี)',
    branch: 'โซนบางนา - บางพลี',
    address: 'ถนนบางนา-ตราด ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540',
    phone: '02-xxx-xxxx',
    contact_person: 'ทีมงานฝ่ายขาย',
    lat: 13.6304636,
    lng: 100.708154,
    radius_km: 10,
  },
  {
    id: 'hub_bangpoo',
    name: 'ศูนย์บริการ / คลังสินค้า (โซนนิคมบางปู)',
    branch: 'โซนนิคมบางปู - แพรกษา',
    address: 'นิคมอุตสาหกรรมบางปู ต.แพรกษา อ.เมืองสมุทรปราการ 10280',
    phone: '02-xxx-xxxx',
    contact_person: 'ทีมงานฝ่ายขาย',
    lat: 13.5414,
    lng: 100.6725,
    radius_km: 10,
  },
  {
    id: 'hub_suksawat',
    name: 'ศูนย์บริการ (โซนพระประแดง - สุขสวัสดิ์)',
    branch: 'โซนพระประแดง - สุขสวัสดิ์',
    address: 'ถนนสุขสวัสดิ์ อ.พระประแดง จ.สมุทรปราการ 10130',
    phone: '02-xxx-xxxx',
    contact_person: 'ทีมงานฝ่ายขาย',
    lat: 13.6558,
    lng: 100.5342,
    radius_km: 10,
  },
];

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  currentCompany,
  onSaveCompany,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(currentCompany);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: CompanyProfile) => {
    setFormData(preset);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          }));
          setIsLocating(false);
        },
        (err) => {
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + err.message);
          setIsLocating(false);
        }
      );
    } else {
      alert('บราวเซอร์ของคุณไม่รองรับการดึงตำแหน่ง Geolocation');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/20">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  ตั้งค่าที่ตั้งบริษัท / จุดเริ่มต้นของคุณ (My Company)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                  ศูนย์กลางแผนที่
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                หมุดเริ่มต้นและรัศมีการเดินทางจะคำนวณจากตำแหน่งบริษัทที่คุณกำหนด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            📍 เลือกโซนที่ตั้งเบื้องต้น:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_HUBS.map((preset) => {
              const isSelected = formData.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs leading-snug">{preset.branch}</div>
                  <div className="text-[10px] text-slate-500 mt-1">รัศมี {preset.radius_km} กม.</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100 text-xs font-bold">
          
          <div className="space-y-1.5">
            <label className="text-slate-700">ชื่อบริษัท / องค์กรของคุณ:</label>
            <input
              type="text"
              required
              placeholder="เช่น บริษัท สยาม อินดัสเทรียล จำกัด"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, id: 'custom' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700">ที่อยู่ / ตำบล / อำเภอ:</label>
            <input
              type="text"
              placeholder="ที่ตั้งบริษัท หรือจุดเริ่มต้นเดินทาง"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value, id: 'custom' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700">เบอร์โทรติดต่อทีมของคุณ:</label>
              <input
                type="text"
                placeholder="02-xxx-xxxx หรือ 08x-xxx-xxxx"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700">ชื่อทีมงาน / ผู้ใช้งาน:</label>
              <input
                type="text"
                placeholder="ชื่อผู้ดูแล หรือทีมฝ่ายขาย"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Coordinates & Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">ละติจูด (Lat):</label>
              <input
                type="number"
                step="any"
                required
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0, id: 'custom' })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">ลองจิจูด (Lng):</label>
              <input
                type="number"
                step="any"
                required
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0, id: 'custom' })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">รัศมีเป้าหมาย (กม.):</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.radius_km}
                onChange={(e) => setFormData({ ...formData, radius_km: parseInt(e.target.value) || 10 })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Use Current GPS Button */}
          <div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>{isLocating ? 'กำลังค้นหาตำแหน่ง GPS ของคุณ...' : '📍 ดึงพิกัดจาก GPS ตำแหน่งปัจจุบัน'}</span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกที่ตั้งบริษัท</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
