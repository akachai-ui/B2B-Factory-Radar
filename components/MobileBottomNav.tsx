'use client';

import React from 'react';
import { Map, Radio, User, Lock, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileBottomNavProps {
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  onOpenAuth: () => void;
  onScrollToMap: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isLiveTracking,
  onToggleLiveTracking,
  onOpenAuth,
  onScrollToMap,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 py-2 px-4 sm:hidden flex items-center justify-around shadow-2xl">
      
      {/* Tab 1: Map */}
      <button
        onClick={onScrollToMap}
        className="flex flex-col items-center gap-1 text-slate-400 active:text-blue-400 transition cursor-pointer"
      >
        <Map className="w-5 h-5" />
        <span className="text-[10px] font-bold">{t('mapView')}</span>
      </button>

      {/* Tab 2: Live GPS */}
      <button
        onClick={onToggleLiveTracking}
        className={`flex flex-col items-center gap-1 transition cursor-pointer ${
          isLiveTracking ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        <div className="relative">
          <Radio className="w-5 h-5" />
          {isLiveTracking && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </div>
        <span className="text-[10px] font-bold">{isLiveTracking ? 'GPS' : 'GPS'}</span>
      </button>

      {/* Tab 3: Account / Login */}
      <button
        onClick={onOpenAuth}
        className={`flex flex-col items-center gap-1 transition cursor-pointer ${
          user ? 'text-blue-400' : 'text-amber-400'
        }`}
      >
        {user ? <User className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        <span className="text-[10px] font-bold">{user ? t('proMember') : t('signIn')}</span>
      </button>

    </div>
  );
};
