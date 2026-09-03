'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogIn, LogOut, ChevronDown, ShieldCheck, LayoutDashboard, Building2, User } from 'lucide-react';

interface UserMenuProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenCompanyProfile?: () => void;
  onOpenTeamManagement?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenAuth,
  onOpenCompanyProfile,
  onOpenTeamManagement,
}) => {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onOpenAuth('signin')}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] sm:text-xs font-bold transition border border-slate-700 cursor-pointer whitespace-nowrap flex items-center gap-1"
        >
          <LogIn className="w-3 h-3" />
          <span>{t('signIn')}</span>
        </button>

        <button
          onClick={() => onOpenAuth('signup')}
          className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-black transition shadow-md shadow-blue-600/30 cursor-pointer whitespace-nowrap active:scale-95"
        >
          <span>{t('signUp')}</span>
        </button>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || t('proMember');
  const companyName = profile?.company_name && profile?.company_name !== 'บริษัทของฉัน' ? profile.company_name : 'ตั้งค่าบริษัท';
  const tier = (profile?.subscription_tier || 'PRO').toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition cursor-pointer text-left shadow-xs"
      >
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white max-w-[130px] truncate">{displayName}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-400/30">
              {tier}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-[130px] flex items-center gap-1">
            <span>🏢</span>
            <span className="text-slate-300 font-medium">{companyName}</span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[10px] text-slate-500 font-semibold">บัญชีผู้ใช้:</p>
            <p className="font-bold text-xs text-slate-900 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
            
            <div className="mt-2 p-2 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-1">
              <div className="text-[10px] text-blue-900 font-bold truncate">
                🏢 {companyName}
              </div>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black shrink-0">
                PRO
              </span>
            </div>
          </div>

          <div className="p-1 space-y-1 text-xs font-semibold">
            {onOpenCompanyProfile && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenCompanyProfile();
                }}
                className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left font-bold"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>🏢 แก้ไขข้อมูลบริษัท / โปรไฟล์</span>
              </button>
            )}

            {onOpenTeamManagement && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenTeamManagement();
                }}
                className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left font-bold"
              >
                <span className="text-sm">👥</span>
                <span>จัดการทีม & สิทธิ์เซลส์</span>
              </button>
            )}

            <button
              onClick={() => {
                setDropdownOpen(false);
                router.push('/dashboard');
              }}
              className="w-full px-3 py-2 rounded-xl text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>{t('goToDashboard')}</span>
            </button>
          </div>

          <div className="p-1 border-t border-slate-100 text-xs font-semibold">
            <button
              onClick={() => {
                setDropdownOpen(false);
                handleSignOut();
              }}
              className="w-full px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>{t('signOut')}</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
