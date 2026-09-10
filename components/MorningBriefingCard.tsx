'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FactoryLead } from '@/lib/types';
import { fetchLiveWeather, WeatherData } from '@/lib/weather';
import {
  Sparkles,
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
  X,
  Building2,
  Phone,
  Zap,
  CloudSun,
  Umbrella,
  Wind,
  Droplets,
} from 'lucide-react';

interface MorningBriefingCardProps {
  userName?: string;
  userLocation: { lat: number; lng: number; label: string };
  leads: FactoryLead[];
  selectedDistrict: string;
  onSelectRadius: (radius: string) => void;
  onFocusLead?: (lead: FactoryLead) => void;
  onSelectDistrict?: (district: string) => void;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MorningBriefingCard({
  userName = 'ทีมงานขาย',
  userLocation,
  leads,
  selectedDistrict,
  onSelectRadius,
  onFocusLead,
  onSelectDistrict,
}: MorningBriefingCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showHourlyWeather, setShowHourlyWeather] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Fetch real-time weather for current coordinates (default Samut Prakan)
  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      setIsLoadingWeather(true);
      try {
        const data = await fetchLiveWeather(
          userLocation.lat || 13.6062,
          userLocation.lng || 100.6974
        );
        if (isMounted && data) {
          setWeather(data);
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [userLocation.lat, userLocation.lng]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'สวัสดีเช้าวันใหม่ ☀️';
    if (hour >= 12 && hour < 17) return 'สวัสดีช่วงบ่าย 🌤️';
    if (hour >= 17 && hour < 21) return 'สวัสดีช่วงเย็น 🌅';
    return 'ราตรีสวัสดิ์ 🌙';
  }, []);

  // Compute nearby factories around user
  const nearbyStats = useMemo(() => {
    if (!userLocation.lat || !userLocation.lng || leads.length === 0) {
      return { count5km: 0, count10km: 0, nearestLead: null, nearestDist: 0 };
    }

    let c5 = 0;
    let c10 = 0;
    let nearest: FactoryLead | null = null;
    let minDist = Infinity;

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return;
      const d = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
      if (d <= 5) c5++;
      if (d <= 10) c10++;
      if (d < minDist) {
        minDist = d;
        nearest = lead;
      }
    });

    return {
      count5km: c5,
      count10km: c10,
      nearestLead: nearest,
      nearestDist: minDist < Infinity ? minDist : 0,
    };
  }, [leads, userLocation]);

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setIsDismissed(false);
          setIsOpen(true);
        }}
        className="absolute bottom-4 right-4 z-[450] px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-amber-500/50 shadow-2xl text-amber-300 font-bold text-xs flex items-center gap-2 backdrop-blur-xl hover:scale-105 transition cursor-pointer active:scale-95 animate-in fade-in zoom-in duration-200"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>สรุปประจำวัน</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 inset-x-3 sm:inset-x-auto sm:left-4 sm:max-w-md z-[450] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-950/95 border border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/15 via-slate-900/60 to-transparent border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white truncate">
                {greeting}, คุณ {userName.split(' ')[0]}
              </h4>
              <span className="text-[10px] text-amber-300/80 font-medium truncate block">
                {userLocation.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
              title={isOpen ? 'ย่อการ์ด' : 'ขยายการ์ด'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
              title="ปิดการ์ด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-3.5 space-y-3">
            
            {/* Quick Insights Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-amber-300 font-black">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>เรดาร์โรงงานรอบตัวคุณ:</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedDistrict === 'ALL' ? 'ทุกอำเภอ' : selectedDistrict}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                พบเป้าหมายในรัศมี 5 กม. ทั้งหมด <b className="text-amber-400 font-bold">{nearbyStats.count5km} โรงงาน</b> (ใน 10 กม. มี {nearbyStats.count10km} แห่ง)
              </p>

              {/* Nearest Factory Spotlight */}
              {nearbyStats.nearestLead && (
                <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block truncate">📍 ใกล้คุณที่สุด ({nearbyStats.nearestDist.toFixed(1)} กม.):</span>
                    <span className="font-bold text-white truncate block mt-0.5">
                      {(nearbyStats.nearestLead as any).name || (nearbyStats.nearestLead as any).factory_name}
                    </span>
                  </div>
                  {onFocusLead && (
                    <button
                      onClick={() => onFocusLead(nearbyStats.nearestLead!)}
                      className="h-7 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-xl shrink-0 transition shadow-sm cursor-pointer active:scale-95"
                    >
                      ดูข้อมูล
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Live Weather Forecast & Field Sales Route Tip */}
            {weather && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border border-cyan-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{weather.weatherIcon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{weather.currentTemp}°C</span>
                        <span className="text-[11px] text-slate-300 font-medium">{weather.weatherDesc}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        ช่วง {weather.minTemp}° - {weather.maxTemp}°C • ชื้น {weather.humidity}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 border ${
                      weather.rainProbability >= 60
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : weather.rainProbability >= 30
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      <Umbrella className="w-3 h-3 shrink-0" />
                      <span>ฝน {weather.rainProbability}%</span>
                    </div>

                    {weather.hourlyForecast.length > 0 && (
                      <button
                        onClick={() => setShowHourlyWeather(!showHourlyWeather)}
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="ดูพยากรณ์รายชั่วโมง"
                      >
                        {showHourlyWeather ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Hourly Forecast Trend */}
                {showHourlyWeather && weather.hourlyForecast.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar animate-in fade-in duration-200">
                    {weather.hourlyForecast.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center px-2 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60 min-w-[50px]">
                        <span className="text-[10px] text-slate-400 font-mono">{item.hour}</span>
                        <span className="text-xs my-0.5">
                          {item.weatherCode >= 80 ? '🌧️' : item.weatherCode >= 50 ? '🌦️' : item.weatherCode === 0 ? '☀️' : '🌤️'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-200">{item.temp}°</span>
                        <span className={`text-[9px] font-bold ${item.rainProb >= 50 ? 'text-rose-400' : 'text-cyan-400'}`}>
                          {item.rainProb}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Smart Field Sales Recommendation */}
                <div className="pt-1.5 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-cyan-200/90 font-medium">
                  <span className="shrink-0">💡</span>
                  <span className="leading-snug">{weather.salesTip}</span>
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <button
                onClick={() => onSelectRadius('5')}
                className="h-11 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>สแกนรอบตัว 5 กม.</span>
              </button>

              <button
                onClick={() => {
                  if (nearbyStats.nearestLead && onFocusLead) {
                    onFocusLead(nearbyStats.nearestLead);
                  } else {
                    onSelectRadius('ALL');
                  }
                }}
                className="h-11 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{nearbyStats.nearestLead ? 'โรงงานใกล้สุด' : 'ดูทั้งหมด'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
