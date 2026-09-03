'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FactoryLead, LeadStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeadStatuses, saveLeadStatus } from '@/lib/leadStatusStorage';
import { RotateCcw, Compass, Radio, Sparkles, Phone, Navigation, Globe, Mail, Copy, Check } from 'lucide-react';

interface FactoryMapProps {
  leads: FactoryLead[];
  userLocation: { lat: number; lng: number; label: string; speed?: number | null; accuracy?: number | null };
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  selectedDistrict: string;
  selectedSubdistrict: string;
  onDistrictChange: (district: string) => void;
  onSubdistrictChange: (subdistrict: string) => void;
  subdistrictsList: string[];
  isLoggedIn: boolean;
  onRequireAuth: () => void;
  onSelectLead?: (lead: FactoryLead) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  selectedRadius?: string;
  onRadiusChange?: (radius: string) => void;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

export const FactoryMap: React.FC<FactoryMapProps> = ({
  leads,
  userLocation,
  isLiveTracking,
  onToggleLiveTracking,
  selectedDistrict,
  selectedSubdistrict,
  onDistrictChange,
  onSubdistrictChange,
  subdistrictsList,
  isLoggedIn,
  onRequireAuth,
  onSelectLead,
  selectedStatus = 'ALL',
  onStatusChange,
  selectedRadius = 'ALL',
  onRadiusChange,
}) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const searchRadiusCircleRef = useRef<any>(null);

  const [leadStatuses, setLeadStatuses] = useState<Record<string, { status: LeadStatus; note?: string }>>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Load Lead Statuses & listen to updates
  useEffect(() => {
    setLeadStatuses(getLeadStatuses());

    const handleUpdate = () => {
      setLeadStatuses(getLeadStatuses());
    };
    window.addEventListener('lead_status_updated', handleUpdate);
    return () => {
      window.removeEventListener('lead_status_updated', handleUpdate);
    };
  }, []);

  // Setup Global listener for popup actions
  useEffect(() => {
    (window as any).triggerRequireAuth = () => {
      onRequireAuth();
    };

    (window as any).updateLeadStatusFromMap = (placeId: string, status: LeadStatus) => {
      saveLeadStatus(placeId, status);
    };

    (window as any).copyEmailToClipboard = (email: string, event?: any) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email);
        setCopyToast(`คัดลอกอีเมล ${email} เรียบร้อยแล้ว!`);
        setTimeout(() => setCopyToast(null), 2500);
      }
    };

    return () => {
      delete (window as any).triggerRequireAuth;
      delete (window as any).updateLeadStatusFromMap;
      delete (window as any).copyEmailToClipboard;
    };
  }, [onRequireAuth]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initLeafletMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet.markercluster');

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([userLocation.lat, userLocation.lng], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors | B2B Factory Radar',
        }).addTo(map);

        const markersCluster = (L as any).markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 45,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        });
        map.addLayer(markersCluster);

        mapInstanceRef.current = map;
        clusterGroupRef.current = markersCluster;
      }

      const map = mapInstanceRef.current;

      // Update / Redraw User Live GPS Marker
      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      if (userAccuracyCircleRef.current) map.removeLayer(userAccuracyCircleRef.current);
      if (searchRadiusCircleRef.current) map.removeLayer(searchRadiusCircleRef.current);

      const userIcon = L.divIcon({
        className: 'hq-marker-container',
        html: `
          <div class="hq-pulse ${isLiveTracking ? 'bg-emerald-500' : 'bg-blue-600'}"></div>
          <div class="hq-marker-icon ${isLiveTracking ? 'border-emerald-400 shadow-emerald-500/50' : ''}" title="Your GPS Location">
            ${isLiveTracking ? '🚗' : '📍'}
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });

      const userPopupContent = `
        <div class="p-1.5 space-y-2 text-slate-800">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
            isLiveTracking ? 'bg-emerald-600 text-white' : 'bg-blue-700 text-white'
          } text-[10px] font-black shadow-xs">
            <span>${isLiveTracking ? '🛰️' : '📍'}</span>
            <span>${isLiveTracking ? t('liveGpsCar') : t('yourGpsLocation')}</span>
          </div>
          <h3 class="font-extrabold text-sm text-slate-900 leading-tight">${userLocation.label}</h3>
          <div class="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
            <div class="font-mono text-blue-950 font-bold">GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}</div>
          </div>
        </div>
      `;

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      userMarker.bindPopup(userPopupContent);

      userMarkerRef.current = userMarker;

      // Accuracy circle
      if (userLocation.accuracy && userLocation.accuracy < 1000) {
        const accCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: isLiveTracking ? '#10b981' : '#3b82f6',
          fillColor: isLiveTracking ? '#10b981' : '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
        userAccuracyCircleRef.current = accCircle;
      }

      // Draw Radius Circle if Radius is selected
      if (selectedRadius && selectedRadius !== 'ALL') {
        const radMeters = parseFloat(selectedRadius) * 1000;
        const radCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radMeters,
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6, 8',
        }).addTo(map);
        searchRadiusCircleRef.current = radCircle;
      }

      // Update Factory Markers with Color-Coding
      const markersCluster = clusterGroupRef.current;
      if (markersCluster) {
        markersCluster.clearLayers();
        const bounds = [[userLocation.lat, userLocation.lng]];

        leads.forEach((lead) => {
          if (!lead.lat || !lead.lng) return;

          // Calculate distance from user's live position
          const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
          const estMinutes = Math.max(1, Math.round(distKm * 2.2));

          // Radius filter check
          if (selectedRadius && selectedRadius !== 'ALL') {
            const maxKm = parseFloat(selectedRadius);
            if (distKm > maxKm) return;
          }

          const statusRecord = leadStatuses[lead.place_id] || { status: 'NEW' as LeadStatus };
          const status = statusRecord.status;

          // Status Filter check
          if (selectedStatus && selectedStatus !== 'ALL' && status !== selectedStatus) {
            return;
          }

          bounds.push([lead.lat, lead.lng]);

          const locationTag =
            lead.subdistrict && lead.subdistrict !== 'ไม่ระบุตำบล'
              ? `${lead.subdistrict} • ${lead.district}`
              : lead.district;

          const distanceBadge = `
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold my-1">
              <span>🚗</span>
              <span>${t('distanceAway')} <strong>${distKm.toFixed(1)} km</strong> (~${estMinutes} ${t('minutesUnit')})</span>
            </div>
          `;

          // Color Pin Icon based on Contact / Visit Status
          let pinColorBg = 'bg-blue-600';
          let pinBorder = 'border-blue-400';
          let pinEmoji = '🏢';
          let statusBadgeText = t('statusNew');
          let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

          if (status === 'CONTACTED') {
            pinColorBg = 'bg-amber-500';
            pinBorder = 'border-amber-300 ring-2 ring-amber-400/50';
            pinEmoji = '📞';
            statusBadgeText = t('statusContacted');
            statusBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
          } else if (status === 'MEETING') {
            pinColorBg = 'bg-purple-600';
            pinBorder = 'border-purple-300 ring-2 ring-purple-400/50';
            pinEmoji = '📅';
            statusBadgeText = t('statusMeeting');
            statusBadgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
          } else if (status === 'WON') {
            pinColorBg = 'bg-emerald-600';
            pinBorder = 'border-emerald-300 ring-2 ring-emerald-400/50';
            pinEmoji = '🏆';
            statusBadgeText = t('statusWon');
            statusBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
          } else if (status === 'LOST') {
            pinColorBg = 'bg-slate-600';
            pinBorder = 'border-slate-400';
            pinEmoji = '🚫';
            statusBadgeText = t('statusLost');
            statusBadgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
          }

          const customIcon = L.divIcon({
            className: 'custom-pin-marker',
            html: `
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${pinColorBg} text-white shadow-lg border-2 ${pinBorder} cursor-pointer hover:scale-110 transition-transform">
                <span class="text-xs font-bold leading-none">${pinEmoji}</span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
          const cleanEmail = lead.email ? lead.email.split(',')[0].trim() : '';

          let popupHtml = '';

          if (isLoggedIn) {
            popupHtml = `
              <div class="p-1 space-y-2 text-slate-800 min-w-[250px]">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black">
                    📍 ${locationTag}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black border ${statusBadgeClass}">
                    ${statusBadgeText}
                  </span>
                </div>
                
                <h3 class="font-black text-sm text-slate-900 leading-snug">${lead.name}</h3>
                <p class="text-xs text-slate-600 leading-tight">${lead.address}</p>
                
                ${distanceBadge}

                <!-- Direct Status Selector -->
                <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div class="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                    <span>📋 ${t('statusLabel')}</span>
                    ${status !== 'NEW' ? '<span class="text-emerald-600 font-bold">✓ บันทึกแล้ว</span>' : ''}
                  </div>
                  <select onchange="window.updateLeadStatusFromMap('${lead.place_id}', this.value)" class="w-full text-xs font-bold p-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none cursor-pointer">
                    <option value="NEW" ${status === 'NEW' ? 'selected' : ''}>⚪ ${t('statusNew')}</option>
                    <option value="CONTACTED" ${status === 'CONTACTED' ? 'selected' : ''}>🟡 ${t('statusContacted')}</option>
                    <option value="MEETING" ${status === 'MEETING' ? 'selected' : ''}>🟣 ${t('statusMeeting')}</option>
                    <option value="WON" ${status === 'WON' ? 'selected' : ''}>🟢 ${t('statusWon')}</option>
                    <option value="LOST" ${status === 'LOST' ? 'selected' : ''}>🔴 ${t('statusLost')}</option>
                  </select>
                </div>

                <!-- 1-Click Copy Email Button -->
                ${
                  cleanEmail
                    ? `<button onclick="window.copyEmailToClipboard('${cleanEmail}')" class="w-full text-xs text-violet-800 font-mono flex items-center justify-between bg-violet-50 hover:bg-violet-100 p-2 rounded-xl border border-violet-200 transition cursor-pointer active:scale-95 group" title="คลิกเพื่อคัดลอกอีเมล">
                        <span class="truncate flex items-center gap-1.5">
                          <span>✉️</span>
                          <span class="font-bold">${cleanEmail}</span>
                        </span>
                        <span class="text-[10px] text-violet-600 font-bold px-1.5 py-0.5 rounded bg-white border border-violet-200 shrink-0 group-hover:bg-violet-600 group-hover:text-white transition">
                          📋 คัดลอก
                        </span>
                       </button>`
                    : ''
                }

                <div class="grid grid-cols-2 gap-1.5 pt-1">
                  ${
                    lead.phone
                      ? `<a href="tel:${cleanPhone}" class="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition cursor-pointer">
                          <span>📞 ${t('callNow')}</span>
                         </a>`
                      : `<div class="py-2 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs text-center">${t('noPhone')}</div>`
                  }
                  
                  ${
                    lead.maps_url
                      ? `<a href="${lead.maps_url}" target="_blank" rel="noopener noreferrer" class="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition">
                          <span>📍 ${t('navigateGoogle')}</span>
                         </a>`
                      : ''
                  }
                </div>

                ${
                  lead.website
                    ? `<a href="${lead.website}" target="_blank" rel="noopener noreferrer" class="block w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-[11px] text-center border border-slate-200 transition">
                        🌐 ${t('visitWebsite')}
                       </a>`
                    : ''
                }
              </div>
            `;
          } else {
            popupHtml = `
              <div class="p-1 space-y-2 text-slate-800 min-w-[220px]">
                <span class="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black">
                  📍 ${locationTag}
                </span>
                <h3 class="font-black text-sm text-slate-900 leading-snug">🔒 ${t('guestLockedTitle')}</h3>
                <p class="text-xs text-slate-500 leading-tight">${t('guestLockedDesc')}</p>
                ${distanceBadge}
                <div class="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-2 pt-2">
                  <div class="text-[11px] text-amber-900 font-bold">${t('lockedDataBadge')}</div>
                  <button onclick="window.triggerRequireAuth()" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer">
                    ${t('unlockThisFactoryBtn')}
                  </button>
                </div>
              </div>
            `;
          }

          const marker = L.marker([lead.lat, lead.lng], { icon: customIcon });
          marker.bindPopup(popupHtml, { maxWidth: 280 });

          marker.on('click', () => {
            if (onSelectLead && window.innerWidth < 640) {
              onSelectLead(lead);
            }
          });

          markersCluster.addLayer(marker);
        });

        // Fit bounds if Radius is active
        if (selectedRadius && selectedRadius !== 'ALL' && searchRadiusCircleRef.current) {
          map.fitBounds(searchRadiusCircleRef.current.getBounds(), { padding: [20, 20] });
        }
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
    };
  }, [leads, userLocation, isLiveTracking, selectedDistrict, selectedSubdistrict, selectedStatus, selectedRadius, leadStatuses, isLoggedIn, t, onSelectLead]);

  // Center on user GPS position
  const zoomToUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 1.2,
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  // Reset to full map overview
  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 11);
      if (onRadiusChange) onRadiusChange('ALL');
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-xl space-y-3">
      
      {/* Toast Notification when Email is Copied */}
      {copyToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md text-emerald-400 border border-emerald-500/50 shadow-2xl text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Non-logged-in Guest Warning Banner */}
      {!isLoggedIn && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs">
              🔒
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs text-amber-950">
                <span>{t('guestBannerTitle')}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-900/80 font-normal">
                {t('guestBannerDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('unlockFreeBtn')}</span>
          </button>
        </div>
      )}

      {/* SLEEK MAP TOP BAR */}
      <div className="flex items-center justify-between gap-3 px-1">
        
        {/* Left: Brand & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-9 w-9 rounded-2xl ${isLiveTracking ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} text-white flex items-center justify-center text-base shadow-sm shrink-0 transition-colors`}>
            {isLiveTracking ? '🚗' : '🗺️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                ศูนย์บัญชาการแผนที่สด
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200 shrink-0">
                {leads.length.toLocaleString()} หมุด
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
              {isLiveTracking ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live GPS กำลังติดตามรถ
                </span>
              ) : (
                <span>พิกัด GPS อ้างอิง</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Live GPS Button */}
          <button
            onClick={onToggleLiveTracking}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              isLiveTracking
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="เปิด/ปิด Live GPS ติดตามรถ"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-emerald-200' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isLiveTracking ? 'Live GPS: เปิด' : 'เปิด Live GPS'}</span>
          </button>

          {/* Zoom to GPS */}
          <button
            onClick={zoomToUser}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="ซูมไปยังพิกัดของคุณ"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">ซูมฉัน</span>
          </button>

          {/* Reset Map */}
          <button
            onClick={resetMapView}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            title="จัดกึ่งกลางแผนที่"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        id="map"
        className="shadow-inner border border-slate-200/80 h-[480px] sm:h-[620px] rounded-2xl overflow-hidden"
      />

    </div>
  );
};
