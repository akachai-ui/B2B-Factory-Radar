'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Layers,
  LogOut,
  Building2,
  Sparkles,
  ChevronDown,
  Edit3,
  Check,
  X,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyInput, setCompanyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const companyName = profile?.company_name || 'บริษัทของฉัน';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้งาน';

  const handleStartEditCompany = () => {
    setCompanyInput(companyName);
    setIsEditingCompany(true);
    setIsDropdownOpen(false);
  };

  const handleSaveCompany = async () => {
    if (!companyInput.trim()) return;
    setIsSaving(true);
    await updateProfile({ company_name: companyInput.trim() });
    setIsSaving(false);
    setIsEditingCompany(false);
  };

  return (
    <>
      <header className="bg-[#0b0f19]/95 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Company Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Layers className="w-5 h-5 text-slate-950" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  RouteHunter
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 uppercase">
                  B2B Radar
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium truncate hidden sm:inline">
                ฐานข้อมูล 989 โรงงาน & วางแผนรูทขาย จ.สมุทรปราการ
              </span>
            </div>
          </div>

          {/* Right Section: Auth State / User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="relative">
                {/* Logged-In User Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-sm"
                >
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-left hidden sm:flex flex-col min-w-0 max-w-[160px]">
                    <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-amber-400/90 truncate flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 shrink-0" />
                      <span>{companyName}</span>
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition shrink-0" />
                </button>

                {/* User Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      onClick={() => setIsDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                      
                      {/* User Info Header */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-1">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">บริษัท:</span>
                          <span className="font-bold text-amber-400 truncate max-w-[120px]">
                            {companyName}
                          </span>
                        </div>
                      </div>

                      {/* Edit Company Action */}
                      <button
                        onClick={handleStartEditCompany}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span>ตั้งชื่อบริษัท (White-label)</span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-slate-800 my-1" />

                      {/* Sign Out Action */}
                      <button
                        onClick={async () => {
                          setIsDropdownOpen(false);
                          await signOut();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 text-xs font-medium flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>ทดลองใช้ฟรี</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Edit Company Name Modal */}
      {isEditingCompany && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            onClick={() => setIsEditingCompany(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
          />
          <div className="relative z-10 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">ตั้งชื่อบริษัท / องค์กรของคุณ</h4>
              </div>
              <button
                onClick={() => setIsEditingCompany(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              ชื่อบริษัทจะถูกนำไปแสดงบนหัวรายงานรูทเซลส์ และเอกสารสรุปประจำวัน
            </p>

            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="เช่น บจก. สยามอินดัสเตรียล ซัพพลาย"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-medium"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingCompany(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveCompany}
                disabled={isSaving || !companyInput.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
