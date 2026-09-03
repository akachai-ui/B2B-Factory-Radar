'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FactoryLead, LeadStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeadStatuses, saveLeadStatus } from '@/lib/leadStatusStorage';
import {
  Compass,
  RotateCcw,
  Radio,
  Sparkles,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  Phone,
  Navigation,
} from 'lucide-react';

declare global {
  interface Window {
    updateLeadStatusFromMap: (placeId: string, status: LeadStatus) => void;
    copyEmailToClipboard: (email: string) => void;
    requireAuthFromMap?: () => void;
    L: any;
  }
}

interface FactoryMapProps {
  leads: FactoryLead[];
  userLocation: {
    lat: number;
    lng: number;
    label: string;
    speed?: number | null;
    accuracy?: number | null;
  };
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  selectedDistrict: string;
  selectedSubdistrict: string;
  onDistrictChange: (district: string) => void;
  onSubdistrictChange: (subdistrict: string) => void;
  subdistrictsList: string[];
  isLoggedIn?: boolean;
  onRequireAuth?: () => void;
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
  isLoggedIn = true,
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

  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);
  const [leadStatuses, setLeadStatuses] = useState<Record<string, { status: LeadStatus; note?: string }>>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Load Lead Statuses & listen for updates
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

  // Global window functions for Leaflet popup callbacks
  useEffect(() => {
    window.updateLeadStatusFromMap = (placeId: string, status: LeadStatus) => {
      saveLeadStatus(placeId, status);
      setLeadStatuses(getLeadStatuses());
    };

    window.copyEmailToClipboard = (email: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email);
        setCopyToast(`✓ คัดลอกอีเมล ${email} เรียบร้อยแล้ว!`);
        setTimeout(() => setCopyToast(null), 2500);
      }
    };

    window.requireAuthFromMap = () => {
      if (onRequireAuth) {
        onRequireAuth();
      }
    };

    return () => {
      delete (window as any).updateLeadStatusFromMap;
      delete (window as any).copyEmailToClipboard;
      delete (window as any).requireAuthFromMap;
    };
  }, []);

  // Ensure Leaflet JS & MarkerCluster scripts are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L && window.L.markerClusterGroup) {
      setIsLeafletReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.L && window.L.markerClusterGroup) {
        setIsLeafletReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // Fallback dynamic script loader if not already present
    if (!window.L) {
      const script1 = document.createElement('script');
      script1.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script1.async = true;
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
        script2.async = true;
        script2.onload = () => {
          setIsLeafletReady(true);
        };
        document.body.appendChild(script2);
      };
      document.body.appendChild(script1);
    }

    return () => clearInterval(checkInterval);
  }, []);

  // Initialize Map when Leaflet is ready
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current || typeof window === 'undefined' || !window.L) return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 12,
        zoomControl: true,
      });

      // Official Clean OpenStreetMap Tiles (No watermark / No API Key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Initialize Marker Cluster Group
      if (L.markerClusterGroup) {
        const markersCluster = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 45,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let c = 'marker-cluster-';
            let size = 38;
            if (count < 10) {
              c += 'small';
              size = 36;
            } else if (count < 50) {
              c += 'medium';
              size = 42;
            } else {
              c += 'large';
              size = 48;
            }
            return L.divIcon({
              html: `<div class="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold shadow-lg border-2 border-white text-xs"><span>${count}</span></div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(size, size),
            });
          },
        });

        map.addLayer(markersCluster);
        clusterGroupRef.current = markersCluster;
      }

      mapInstanceRef.current = map;

      // Invalidate size to ensure zero grey/blank tiles
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
      setTimeout(() => map.invalidateSize(), 800);
    }
  }, [isLeafletReady]);

  // Update Markers, Live GPS Location, and Radius Circle
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !isLeafletReady) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    try {
      // Clear previous GPS elements
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      if (searchRadiusCircleRef.current) {
        map.removeLayer(searchRadiusCircleRef.current);
        searchRadiusCircleRef.current = null;
      }

      // Add Live GPS User Marker
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="${isLiveTracking ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full h-6 w-6 absolute animate-ping opacity-75"></div>
            <div class="${isLiveTracking ? 'bg-emerald-500' : 'bg-blue-600'} h-5 w-5 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[9px] font-black z-10">
              ${isLiveTracking ? '🚗' : '📍'}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-center text-slate-800">
            <p class="font-extrabold text-xs text-blue-900">${isLiveTracking ? '🟢 ' + t('liveGpsCar') : '📍 ' + t('yourGpsLocation')}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</p>
          </div>
        `);
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

      // Update Factory Markers with Color-Coding for Pillar 1
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

          // Color Pin Icon based on Pillar 1 Stages
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
          } else if (status === 'QUOTED') {
            pinColorBg = 'bg-cyan-600';
            pinBorder = 'border-cyan-300 ring-2 ring-cyan-400/50';
            pinEmoji = '📄';
            statusBadgeText = t('statusQuoted');
            statusBadgeClass = 'bg-cyan-100 text-cyan-900 border-cyan-300';
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
          const maskedPhone = cleanPhone ? cleanPhone.slice(0, 5) + '-XXXX' : '02-740-XXXX';
          const cleanEmail = lead.email ? lead.email.split(',')[0].trim() : '';

          // Corporate Intelligence Search URLs for Company Quick Fact
          const dbdSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ทุนจดทะเบียน DBD')}`;
          const mapsNavUrl = lead.maps_url || `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;

          let popupHtml = '';

          if (!isLoggedIn) {
            // STRATEGY 1: HIGH-VALUE MASKED TEASER FOR ALL FACTORIES
            popupHtml = `
              <div class="p-2 space-y-2 text-slate-800 min-w-[260px] max-w-[310px]">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black">
                    📍 ${locationTag}
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                    ✓ ประตูทางเข้า 100%
                  </span>
                </div>

                <h3 class="font-black text-sm text-slate-900 leading-snug">${lead.name}</h3>
                <p class="text-[11px] text-slate-500 leading-tight">${lead.address ? lead.address.slice(0, 35) + '...' : 'พิกัดประตูทางเข้าโรงงาน'}</p>
                
                ${distanceBadge}

                <!-- Masked Company Intel Box -->
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500 font-bold text-[11px]">📞 เบอร์โทรตรงโรงงาน:</span>
                    <span class="font-mono font-black text-slate-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 tracking-wider">${maskedPhone}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500 font-bold text-[11px]">💰 ทุนจดทะเบียน DBD:</span>
                    <span class="font-black text-emerald-700">พร้อมตรวจสอบ (นิติบุคคล)</span>
                  </div>
                </div>

                <button onclick="window.requireAuthFromMap()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5">
                  <span>👑 ปลดล็อกเบอร์เต็ม & พิกัดนำทาง</span>
                </button>
              </div>
            `;
          } else {
            // FULL LOGGED IN DASHBOARD POPUP
            popupHtml = `
              <div class="p-1 space-y-2 text-slate-800 min-w-[260px] max-w-[320px]">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black">
                    📍 ${locationTag}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black border ${statusBadgeClass}">
                    ${statusBadgeText}
                  </span>
                </div>
                
                <h3 class="font-black text-sm text-slate-900 leading-snug">${lead.name}</h3>
                <p class="text-[11px] text-slate-600 leading-tight">${lead.address}</p>
                
                ${distanceBadge}

                <!-- Status Tag Selector (Pillar 1) -->
                <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div class="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                    <span>📋 ${t('statusLabel')}</span>
                    ${status !== 'NEW' ? '<span class="text-emerald-600 font-bold">✓ บันทึกแล้ว</span>' : ''}
                  </div>
                  <select onchange="window.updateLeadStatusFromMap('${lead.place_id}', this.value)" class="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 outline-none cursor-pointer">
                    <option value="NEW" ${status === 'NEW' ? 'selected' : ''}>⚪ ${t('statusNew')}</option>
                    <option value="CONTACTED" ${status === 'CONTACTED' ? 'selected' : ''}>🟡 ${t('statusContacted')}</option>
                    <option value="MEETING" ${status === 'MEETING' ? 'selected' : ''}>🟣 ${t('statusMeeting')}</option>
                    <option value="QUOTED" ${status === 'QUOTED' ? 'selected' : ''}>🔵 ${t('statusQuoted')}</option>
                    <option value="WON" ${status === 'WON' ? 'selected' : ''}>🏆 ${t('statusWon')}</option>
                    <option value="LOST" ${status === 'LOST' ? 'selected' : ''}>🔴 ${t('statusLost')}</option>
                  </select>
                </div>

                <!-- Company Quick Fact Button (Pillar 1) -->
                <a href="${dbdSearchUrl}" target="_blank" rel="noopener noreferrer" class="block w-full p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold text-center transition shadow-xs" title="เช็กทุนจดทะเบียนและนิติบุคคล">
                  <span>🔍 ตรวจสอบทุนจดทะเบียน DBD</span>
                </a>

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

                <!-- Direct Call & Google Gate Navigation -->
                <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                  ${
                    lead.phone
                      ? `<a href="tel:${cleanPhone}" class="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition cursor-pointer">
                          <span>📞 ${t('callNow')}</span>
                         </a>`
                      : `<div class="py-2 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs text-center">${t('noPhone')}</div>`
                  }
                  
                  <a href="${mapsNavUrl}" target="_blank" rel="noopener noreferrer" class="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition">
                    <span>📍 ${t('navigateGoogle')}</span>
                  </a>
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
          }

          const marker = L.marker([lead.lat, lead.lng], { icon: customIcon });

          // Mobile bottom sheet trigger or desktop popup
          marker.on('click', () => {
            if (window.innerWidth < 640 && onSelectLead) {
              onSelectLead(lead);
            }
          });

          marker.bindPopup(popupHtml, { maxWidth: 320 });
          markersCluster.addLayer(marker);
        });

        // Fit map bounds if filter is applied
        if ((selectedDistrict !== 'ALL' || selectedRadius !== 'ALL') && bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    } catch (err) {
      console.warn('Map update error:', err);
    }
  }, [leads, userLocation, isLiveTracking, selectedDistrict, selectedSubdistrict, selectedStatus, selectedRadius, leadStatuses, isLeafletReady, t]);

  // Zoom to user's live position
  const zoomToUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, {
        animate: true,
      });
      mapInstanceRef.current.invalidateSize();
    }
  };

  // Reset to full map overview
  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 11);
      mapInstanceRef.current.invalidateSize();
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

      {/* SLEEK MAP TOP BAR (OPTIMIZED FOR IPHONE & MOBILE) */}
      <div className="flex items-center justify-between gap-1.5 px-0.5 sm:px-1">
        
        {/* Left: Live GPS Status & Target Count */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className={`h-7 w-7 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl ${isLiveTracking ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} text-white flex items-center justify-center text-xs sm:text-base shadow-xs shrink-0 transition-colors`}>
            {isLiveTracking ? '🚗' : '🗺️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
                {t('mapCommandCenter')}
              </h3>
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-blue-50 text-blue-800 text-[9px] sm:text-[10px] font-extrabold border border-blue-200 shrink-0">
                {leads.length.toLocaleString()} เป้าหมาย
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
              {isLiveTracking ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t('liveGpsCar')}
                </span>
              ) : (
                <span>{t('yourGpsLocation')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Live GPS Toggle */}
          <button
            onClick={onToggleLiveTracking}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              isLiveTracking
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="เปิด/ปิด Live GPS ติดตามรถ"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-emerald-200' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isLiveTracking ? t('liveGpsActive') : t('liveGpsInactive')}</span>
          </button>

          {/* Zoom to GPS */}
          <button
            onClick={zoomToUser}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            title="ซูมไปยังพิกัดของคุณ"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">{t('zoomLocation')}</span>
          </button>

          {/* Reset Map */}
          <button
            onClick={resetMapView}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            title={t('centerMap')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Map Canvas with Responsive Height */}
      <div
        ref={mapContainerRef}
        id="map"
        className="shadow-inner border border-slate-200/80 h-[380px] sm:h-[620px] rounded-2xl overflow-hidden relative bg-slate-100"
      >
        {!isLeafletReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 space-y-2 z-10">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold">กำลังเชื่อมต่อดาวเทียมแผนที่...</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FactoryMap;
