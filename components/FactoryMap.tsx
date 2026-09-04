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
    toggleRouteFromMap?: (placeId: string) => void;
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
  routeLeadIds?: string[];
  todayRoute?: FactoryLead[];
  onToggleRouteLead?: (lead: FactoryLead) => void;
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
  routeLeadIds = [],
  todayRoute = [],
  onToggleRouteLead,
}) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const searchRadiusCircleRef = useRef<any>(null);
  const routeLayerGroupRef = useRef<any>(null);

  const onToggleRouteLeadRef = useRef(onToggleRouteLead);
  onToggleRouteLeadRef.current = onToggleRouteLead;

  const leadsRef = useRef(leads);
  leadsRef.current = leads;

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

    window.toggleRouteFromMap = (placeId: string) => {
      const target = leadsRef.current.find((l) => l.place_id === placeId);
      if (target && onToggleRouteLeadRef.current) {
        onToggleRouteLeadRef.current(target);
      }
    };

    window.requireAuthFromMap = () => {
      if (onRequireAuth) {
        onRequireAuth();
      }
    };
  }, [onRequireAuth]);

  // Handle Leaflet Library Dynamic Loader
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function checkReady() {
      if (window.L && (window.L.markerClusterGroup || typeof window.L.markerClusterGroup === 'function')) {
        setIsLeafletReady(true);
        return true;
      }
      return false;
    }

    if (checkReady()) return;

    const checkInterval = setInterval(() => {
      if (checkReady()) {
        clearInterval(checkInterval);
      }
    }, 100);

    const loadMarkerCluster = () => {
      if (window.L?.markerClusterGroup) {
        setIsLeafletReady(true);
        return;
      }
      const s2 = document.createElement('script');
      s2.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      s2.async = true;
      s2.onload = () => {
        setIsLeafletReady(true);
      };
      document.head.appendChild(s2);
    };

    if (!window.L) {
      const s1 = document.createElement('script');
      s1.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s1.async = true;
      s1.onload = () => {
        loadMarkerCluster();
      };
      document.head.appendChild(s1);
    } else if (!window.L.markerClusterGroup) {
      loadMarkerCluster();
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

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

      // Dedicated layer group for Route Polyline and sequence badges
      const routeLayerGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = routeLayerGroup;

      mapInstanceRef.current = map;

      // Invalidate size to ensure zero grey/blank tiles
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
      setTimeout(() => map.invalidateSize(), 800);
    }
  }, [isLeafletReady]);

  // 1. FIX ISSUE 1: RESIZE OBSERVER ON MAP CONTAINER TO PREVENT GREY TILES
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLeafletReady]);

  // 2. FIX ISSUE 3: DRAW CONNECTED ROUTE POLYLINE & NUMBERED SEQUENCE BADGES
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletReady || !window.L || !routeLayerGroupRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    const routeLayerGroup = routeLayerGroupRef.current;

    // Clear previous route polylines and sequence markers
    routeLayerGroup.clearLayers();

    if (todayRoute && todayRoute.length > 0) {
      const latlngs = [
        [userLocation.lat, userLocation.lng],
        ...todayRoute.map((stop) => [stop.lat, stop.lng]),
      ];

      // Draw Glowing Polyline Path
      const polyline = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.9,
        dashArray: '10, 8',
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayerGroup.addLayer(polyline);

      // Draw Numbered Stop Badges along the route
      todayRoute.forEach((stop, index) => {
        const stopBadgeIcon = L.divIcon({
          className: 'custom-route-stop-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="h-8 w-8 rounded-full bg-amber-500 border-2 border-slate-950 text-slate-950 font-black text-xs flex items-center justify-center shadow-2xl ring-4 ring-amber-400/50 transform hover:scale-125 transition-transform cursor-pointer">
                <span>${index + 1}</span>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopBadgeIcon });
        stopMarker.bindPopup(`
          <div class="p-2 text-slate-800 space-y-1 text-xs">
            <span class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
              🚗 จุดแวะที่ ${index + 1}
            </span>
            <h4 class="font-black text-slate-900 leading-snug">${stop.name}</h4>
            <p class="text-slate-500 text-[10px]">${stop.subdistrict} • ${stop.district}</p>
          </div>
        `);
        routeLayerGroup.addLayer(stopMarker);
      });
    }
  }, [todayRoute, userLocation, isLeafletReady]);

  // Update Markers & Clusters when leads or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletReady || !window.L) return;

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

      // Update Factory Markers with Color-Coding
      const markersCluster = clusterGroupRef.current;
      if (markersCluster) {
        markersCluster.clearLayers();
        const bounds = [[userLocation.lat, userLocation.lng]];

        leads.forEach((lead) => {
          if (!lead.lat || !lead.lng) return;

          const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
          const estMinutes = Math.max(1, Math.round(distKm * 2.2));

          if (selectedRadius && selectedRadius !== 'ALL') {
            const maxKm = parseFloat(selectedRadius);
            if (distKm > maxKm) return;
          }

          const statusRecord = leadStatuses[lead.place_id];
          const status: LeadStatus = statusRecord ? statusRecord.status : 'NEW';

          if (selectedStatus && selectedStatus !== 'ALL') {
            if (selectedStatus === 'IN_ROUTE') {
              if (!routeLeadIds.includes(lead.place_id)) return;
            } else if (status !== selectedStatus) {
              return;
            }
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

          const dbdSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ทุนจดทะเบียน DBD')}`;
          const mapsNavUrl = lead.maps_url || `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;

          const isInRoute = routeLeadIds && routeLeadIds.includes(lead.place_id);
          const routeBtnText = isInRoute ? '✓ อยู่ในรูทวันนี้แล้ว (คลิกเพื่อยกเลิก)' : '🚗 + เพิ่มเข้ารูทวันนี้';
          const routeBtnClass = isInRoute
            ? 'bg-amber-500 text-slate-950 border border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
            : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-md shadow-amber-500/20';

          const routeButtonHtml = `
            <button onclick="window.toggleRouteFromMap('${lead.place_id}')" class="w-full py-2.5 px-3 rounded-xl ${routeBtnClass} text-xs transition cursor-pointer flex items-center justify-center gap-1.5 my-1 active:scale-95">
              <span>${routeBtnText}</span>
            </button>
          `;

          let popupHtml = '';

          if (!isLoggedIn) {
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

                <!-- 🚗 Today Route Planner Button -->
                ${routeButtonHtml}

                <!-- Status Tag Selector -->
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

                <!-- Company Quick Fact Button -->
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

          marker.on('click', () => {
            if (window.innerWidth < 640 && onSelectLead) {
              onSelectLead(lead);
            }
          });

          marker.bindPopup(popupHtml, { maxWidth: 320 });
          markersCluster.addLayer(marker);
        });

        // Auto zoom/fit bounds on district filter change
        if (selectedDistrict && selectedDistrict !== 'ALL' && bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    } catch (e) {
      console.warn('Map marker rendering error:', e);
    }
  }, [leads, selectedDistrict, selectedStatus, selectedRadius, userLocation, isLiveTracking, leadStatuses, routeLeadIds, todayRoute, isLeafletReady]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />

      {/* Copy Toast */}
      {copyToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};

export default FactoryMap;
