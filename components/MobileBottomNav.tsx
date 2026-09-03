'use client';

import React from 'react';
import { Map, Table, Target, Radio, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileBottomNavProps {
  viewMode?: 'map' | 'table';
  onViewModeChange?: (mode: 'map' | 'table') => void;
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  onQuickNearMe?: () => void;
  onOpenAuth: () => void;
  onScrollToMap?: () => void;
  selectedRadius?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode = 'map',
  onViewModeChange,
  isLiveTracking,
  onToggleLiveTracking,
  onQuickNearMe,
  onOpenAuth,
  onScrollToMap,
  selectedRadius = 'ALL',
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 sm:hidden shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Map View */}
        <button
          onClick={() => {
            if (onViewModeChange) onViewModeChange('map');
            if (onScrollToMap) onScrollToMap();
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            viewMode === 'map'
              ? 'text-blue-400 bg-blue-500/15 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Map className={`w-5 h-5 ${viewMode === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">{t('mapView')}</span>
        </button>

        {/* Tab 2: Table / CRM View */}
        <button
          onClick={() => {
            if (onViewModeChange) onViewModeChange('table');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            viewMode === 'table'
              ? 'text-blue-400 bg-blue-500/15 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Table className={`w-5 h-5 ${viewMode === 'table' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">{t('tableView')}</span>
        </button>

        {/* Tab 3: Quick Near Me (Center Hero Pill) */}
        {onQuickNearMe && (
          <button
            onClick={onQuickNearMe}
            className={`flex flex-col items-center justify-center -mt-4 p-2.5 rounded-full shadow-lg transition-all active:scale-90 cursor-pointer ${
              selectedRadius !== 'ALL'
                ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 ring-4 ring-slate-900 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-slate-900 shadow-blue-600/30'
            }`}
            title="ค้นหาบริษัทใกล้ฉัน"
          >
            <Target className="w-5 h-5" />
          </button>
        )}

        {/* Tab 4: Live GPS */}
        <button
          onClick={onToggleLiveTracking}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            isLiveTracking
              ? 'text-emerald-400 bg-emerald-500/15 font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Radio className={`w-5 h-5 ${isLiveTracking ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isLiveTracking && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isLiveTracking ? 'Live GPS' : 'เปิด GPS'}
          </span>
        </button>

        {/* Tab 5: User / Account */}
        <button
          onClick={onOpenAuth}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            user ? 'text-slate-300 font-bold' : 'text-amber-400 font-black'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5 stroke-2" />
            {user && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500"></span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {user ? 'โปรไฟล์' : t('signIn')}
          </span>
        </button>

      </div>
    </nav>
  );
};
