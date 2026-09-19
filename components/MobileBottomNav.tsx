'use client';

import React from 'react';
import { Target, ShoppingCart, TrendingUp, Car, Users } from 'lucide-react';

export type MobileTab = 'portfolio' | 'marketplace' | 'radar' | 'dbd' | 'factories' | 'market' | 'trips' | 'team' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  portfolioCount?: number;
  hasActiveTrip?: boolean;
  canViewTeam?: boolean;
  teamCount?: number;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  portfolioCount = 0,
  hasActiveTrip = false,
  canViewTeam = false,
  teamCount = 0,
}: MobileBottomNavProps) {
  const isPortfolio = activeTab === 'portfolio' || activeTab === 'radar';
  const isMarketplace = activeTab === 'marketplace' || activeTab === 'dbd' || activeTab === 'factories';

  const navItems = [
    {
      id: 'portfolio' as MobileTab,
      label: 'พอร์ตฉัน',
      icon: Target,
      badge: portfolioCount > 0 ? `${portfolioCount}` : null,
      isActive: isPortfolio,
    },
    {
      id: 'marketplace' as MobileTab,
      label: 'ช้อปเพิ่ม',
      icon: ShoppingCart,
      badge: '989',
      isActive: isMarketplace,
    },
    ...(canViewTeam
      ? [
          {
            id: 'team' as MobileTab,
            label: 'ทีมงาน',
            icon: Users,
            badge: teamCount > 0 ? `${teamCount}` : null,
            isActive: activeTab === 'team',
          },
        ]
      : []),
    {
      id: 'market' as MobileTab,
      label: 'วิเคราะห์',
      icon: TrendingUp,
      badge: null,
      isActive: activeTab === 'market',
    },
    {
      id: 'trips' as MobileTab,
      label: 'บันทึกไมล์',
      icon: Car,
      badge: hasActiveTrip ? 'วิ่งอยู่' : null,
      isActive: activeTab === 'trips',
    },
  ];

  const gridColsClass = navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-[#0b0f19]/95 backdrop-blur-2xl border-t border-slate-800/90 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className={`grid ${gridColsClass} h-16 max-w-lg mx-auto items-center px-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Top Glow Line */}
              {isActive && (
                <div className="absolute -top-1.5 w-8 h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-in fade-in zoom-in-75 duration-200" />
              )}

              {/* Icon with Glowing background when active */}
              <div
                className={`relative p-1.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />

                {/* Badge if available */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full border border-slate-900 shadow">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-amber-300' : 'font-medium text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
