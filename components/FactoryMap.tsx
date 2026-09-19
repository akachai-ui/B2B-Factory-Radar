'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FactoryLead } from '@/lib/types';
import districtsGeoJson from '@/lib/geojson/samutprakan_districts.json';
import {
  MapPin,
  Navigation,
  Phone,
  ExternalLink,
  Layers,
  Crosshair,
  Maximize2,
  Building2,
  Radio,
  ChevronDown,
} from 'lucide-react';

export interface FactoryMapProps {
  leads: FactoryLead[];
  userLocation: { lat: number; lng: number; label: string };
  selectedDistrict: string;
  onDistrictSelect?: (district: string) => void;
  selectedRadius: string;
  onSelectRadius?: (radius: string) => void;
  onLeadClick?: (lead: FactoryLead) => void;
  districts?: string[];
  districtCounts?: Record<string, number>;
  totalLeadCount?: number;
  userName?: string;
  userAvatar?: string | null;
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

export function FactoryMap({
  leads,
  userLocation,
  selectedDistrict,
  onDistrictSelect,
  selectedRadius,
  onSelectRadius,
  onLeadClick,
  districts,
  districtCounts,
  totalLeadCount,
  userName,
  userAvatar,
}: FactoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersClusterGroupRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);

  const defaultDistricts = ['บางพลี', 'เมืองสมุทรปราการ', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางบ่อ', 'บางเสาธง'];
  const districtList = districts || defaultDistricts;

  const [mapTheme, setMapTheme] = useState<'dark' | 'streets'>('dark');
  const tileLayerRef = useRef<any>(null);
  const [selectedLead, setSelectedLead] = useState<FactoryLead | null>(null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Create map instance centered on Samut Prakan
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat || 13.6062, userLocation.lng || 100.6974],
        zoom: 11,
        zoomControl: false,
      });

      // Add Zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tile Layer (Clean Dark Theme by default - No Watermarks)
      let tileGroup: any;
      if (mapTheme === 'dark') {
        const baseLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
            maxZoom: 16,
          }
        );
        const refLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 16,
          }
        );
        tileGroup = L.layerGroup([baseLayer, refLayer]).addTo(map);
      } else {
        tileGroup = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: 'abc',
        }).addTo(map);
      }

      tileLayerRef.current = tileGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch Tile Layer Theme
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let tileGroup: any;
    if (mapTheme === 'dark') {
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
          maxZoom: 16,
        }
      );
      const refLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
        }
      );
      tileGroup = L.layerGroup([baseLayer, refLayer]).addTo(mapInstanceRef.current);
    } else {
      tileGroup = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(mapInstanceRef.current);
    }

    tileLayerRef.current = tileGroup;
  }, [mapTheme]);

  // 3. Render Samut Prakan GeoJSON District Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(districtsGeoJson as any, {
      style: (feature: any) => {
        const districtName = feature?.properties?.amp_th || '';
        const isSelected =
          selectedDistrict !== 'ALL' &&
          (districtName.includes(selectedDistrict) || selectedDistrict.includes(districtName));

        return {
          fillColor: isSelected ? '#f59e0b' : '#38bdf8',
          weight: isSelected ? 3 : 1.5,
          opacity: 0.9,
          color: isSelected ? '#fbbf24' : '#0ea5e9',
          dashArray: isSelected ? '' : '3, 4',
          fillOpacity: isSelected ? 0.25 : 0.06,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const dName = feature?.properties?.amp_th || '';
        layer.bindTooltip(`📍 อ.${dName}`, {
          permanent: false,
          direction: 'center',
          className: 'geojson-tooltip bg-slate-900 text-amber-300 font-bold border border-slate-700 px-2 py-1 rounded-lg text-xs shadow-lg',
        });

        layer.on({
          mouseover: (e: any) => {
            const l = e.target;
            l.setStyle({
              fillOpacity: 0.35,
              weight: 2.5,
            });
          },
          mouseout: (e: any) => {
            geoLayer.resetStyle(e.target);
          },
          click: () => {
            if (onDistrictSelect) {
              onDistrictSelect(dName);
            }
          },
        });
      },
    }).addTo(mapInstanceRef.current);

    geoJsonLayerRef.current = geoLayer;

    // Smoothly zoom & pan to selected district polygon or province overview
    if (selectedDistrict !== 'ALL') {
      let matchedLayer: any = null;
      geoLayer.eachLayer((layer: any) => {
        const dName = layer.feature?.properties?.amp_th || '';
        if (dName.includes(selectedDistrict) || selectedDistrict.includes(dName)) {
          matchedLayer = layer;
        }
      });
      if (matchedLayer && matchedLayer.getBounds) {
        mapInstanceRef.current.fitBounds(matchedLayer.getBounds(), {
          padding: [30, 30],
          maxZoom: 13,
          animate: true,
        });
      }
    } else {
      mapInstanceRef.current.setView([13.6062, 100.6974], 11, { animate: true });
    }
  }, [selectedDistrict, onDistrictSelect]);

  // 4. Render Factory Markers & Clusters
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    if (markersClusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(markersClusterGroupRef.current);
    }

    let clusterGroup: any;
    if (L.markerClusterGroup) {
      clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-slate-950">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: [36, 36],
          });
        },
      });
    } else {
      clusterGroup = L.layerGroup();
    }

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return;

      const currentStatus = lead.status;
      let statusBorderColor = '#f59e0b';
      let statusBadgeColor = 'bg-amber-500 text-slate-950';
      let statusLabel = 'ใหม่';
      let statusRing = 'border-amber-400 ring-amber-400/50';
      let statusBg = 'from-amber-500 to-yellow-400';
      let badgeIcon = '•';

      if (currentStatus === 'WON') {
        statusBorderColor = '#10b981';
        statusBadgeColor = 'bg-emerald-500 text-slate-950';
        statusLabel = 'Won สำเร็จ';
        statusRing = 'border-emerald-400 ring-emerald-400/50';
        statusBg = 'from-emerald-500 to-teal-400';
        badgeIcon = '✓';
      } else if (currentStatus === 'MEETING') {
        statusBorderColor = '#a855f7';
        statusBadgeColor = 'bg-purple-500 text-white';
        statusLabel = 'นัดหมายพบ';
        statusRing = 'border-purple-400 ring-purple-400/50';
        statusBg = 'from-purple-500 to-indigo-500';
        badgeIcon = '📅';
      } else if (currentStatus === 'QUOTED') {
        statusBorderColor = '#eab308';
        statusBadgeColor = 'bg-yellow-400 text-slate-950';
        statusLabel = 'เสนอราคา';
        statusRing = 'border-yellow-400 ring-yellow-400/50';
        statusBg = 'from-yellow-400 to-amber-500';
        badgeIcon = '฿';
      } else if (currentStatus === 'CONTACTED') {
        statusBorderColor = '#3b82f6';
        statusBadgeColor = 'bg-blue-500 text-white';
        statusLabel = 'ติดต่อแล้ว';
        statusRing = 'border-blue-400 ring-blue-400/50';
        statusBg = 'from-blue-500 to-cyan-400';
        badgeIcon = '📞';
      } else if (currentStatus === 'LOST') {
        statusBorderColor = '#64748b';
        statusBadgeColor = 'bg-slate-700 text-slate-300';
        statusLabel = 'ปิดโอกาส';
        statusRing = 'border-slate-500 ring-slate-500/50';
        statusBg = 'from-slate-700 to-slate-600';
        badgeIcon = '✕';
      }

      const hasSalesRep = Boolean(lead.sales_rep || lead.sales_rep_avatar);
      const repInitial = lead.sales_rep ? lead.sales_rep.trim().charAt(0).toUpperCase() : '👤';

      let markerHtml = '';

      if (hasSalesRep) {
        // Customer pin showing Account Manager / Sales Rep Avatar
        const repAvatarImg = lead.sales_rep_avatar
          ? `<img src="${lead.sales_rep_avatar}" class="w-full h-full object-cover" alt="${lead.sales_rep || 'Sales'}" />`
          : `<span class="text-[11px] font-black text-slate-900">${repInitial}</span>`;

        markerHtml = `
          <div class="relative flex items-center justify-center -top-6 -left-6 w-12 h-12 pointer-events-auto hover:scale-125 transition-transform group cursor-pointer">
            <!-- Pin Body -->
            <div class="relative flex flex-col items-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
              <!-- Avatar Circle with Status Color Frame -->
              <div class="h-9 w-9 rounded-full overflow-hidden border-2 ${statusRing} bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-xl flex items-center justify-center ring-2 ring-slate-950">
                ${repAvatarImg}
              </div>
              
              <!-- Pointer Tail -->
              <div class="w-2.5 h-2.5 rotate-45 -mt-1 shadow-md border-r border-b" style="background-color: ${statusBorderColor}; border-color: ${statusBorderColor};"></div>

              <!-- Corner CRM Status Badge -->
              <div class="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${statusBadgeColor} border-2 border-slate-950 flex items-center justify-center text-[8px] font-black shadow-lg" title="${statusLabel}">
                ${badgeIcon}
              </div>
            </div>
          </div>
        `;
      } else {
        // Raw Factory Pin
        markerHtml = `
          <div class="relative flex items-center justify-center -top-4 -left-4 w-8 h-8 pointer-events-auto hover:scale-125 transition-transform cursor-pointer">
            <div class="h-7 w-7 rounded-xl bg-gradient-to-tr ${statusBg} text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 border border-slate-900">
              <svg class="w-3.5 h-3.5 fill-slate-950" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
          </div>
        `;
      }

      const factoryIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-account-manager-pin',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lead.lat, lead.lng], { icon: factoryIcon });

      // Enhanced Tooltip with Sales Rep & Deal Info
      const repBadge = lead.sales_rep ? `<div class="text-[11px] text-cyan-300 font-bold flex items-center gap-1">👤 ดูแลโดย: <span>${lead.sales_rep}</span></div>` : '';
      const dealBadge = lead.deal_value ? `<div class="text-[11px] text-amber-300 font-mono font-bold">💰 มูลค่าดีล: ฿${Number(lead.deal_value).toLocaleString()}</div>` : '';

      marker.bindTooltip(`
        <div class="p-1 space-y-1 font-sans">
          <div class="font-black text-white text-xs">${lead.name || lead.company_name}</div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${statusBadgeColor}">${statusLabel}</span>
            <span class="text-[10px] text-slate-400">${lead.district || 'สมุทรปราการ'}</span>
          </div>
          ${repBadge}
          ${dealBadge}
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-950/95 text-slate-200 border border-slate-700 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-md',
      });

      marker.on('click', () => {
        setSelectedLead(lead);
        if (onLeadClick) onLeadClick(lead);
      });

      clusterGroup.addLayer(marker);
    });

    mapInstanceRef.current.addLayer(clusterGroup);
    markersClusterGroupRef.current = clusterGroup;

    // Auto-fit bounds if radius filter is active or specific search query is filtered (when district is ALL)
    if (selectedRadius !== 'ALL' && leads.length > 0) {
      const validPoints = leads
        .filter((l) => l.lat && l.lng)
        .map((l) => [l.lat, l.lng] as [number, number]);
      if (validPoints.length > 0) {
        mapInstanceRef.current.fitBounds(validPoints, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [leads, userLocation, onLeadClick, selectedRadius]);

  // 5. Render User Live GPS Pin & Radius Circle
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L || !userLocation.lat || !userLocation.lng) return;

    // User GPS Marker with Custom Avatar
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    const initial = userName ? userName.trim().charAt(0).toUpperCase() : '👤';
    const avatarContent = userAvatar
      ? `<img src="${userAvatar}" class="w-full h-full object-cover" alt="${userName || 'User'}" />`
      : `<span class="text-xs font-black text-slate-950">${initial}</span>`;

    const userGpsIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center -top-7 -left-7 w-14 h-14 pointer-events-none">
          <!-- Dynamic Animated Radar Rings -->
          <div class="absolute inset-0 rounded-full bg-cyan-400/35 animate-ping"></div>
          <div class="absolute -inset-1 rounded-full bg-cyan-500/25 animate-pulse"></div>

          <!-- Avatar Pin Container -->
          <div class="relative flex flex-col items-center pointer-events-auto filter drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] cursor-pointer hover:scale-110 transition-transform">
            <div class="h-10 w-10 rounded-full overflow-hidden border-2 border-cyan-300 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-2xl flex items-center justify-center ring-2 ring-cyan-500/50">
              ${avatarContent}
            </div>
            <!-- Marker Pointer Arrow -->
            <div class="w-2.5 h-2.5 bg-cyan-300 rotate-45 -mt-1 shadow-md border-r border-b border-cyan-600"></div>
            <!-- Live GPS Pulse Indicator Badge -->
            <div class="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow" title="GPS Live">
              <div class="h-1.5 w-1.5 rounded-full bg-white animate-ping"></div>
            </div>
          </div>
        </div>
      `,
      className: 'custom-user-gps-avatar-icon',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userGpsIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstanceRef.current);

    userMarker.bindTooltip(`📍 ${userName || 'คุณ'} (ตำแหน่งสด GPS)`, {
      permanent: false,
      direction: 'top',
      className: 'bg-slate-900 text-cyan-300 font-bold border border-slate-700 px-2.5 py-1 rounded-xl text-xs shadow-xl',
    });

    userMarkerRef.current = userMarker;

    // Radius Circle
    if (radiusCircleRef.current) {
      mapInstanceRef.current.removeLayer(radiusCircleRef.current);
    }

    if (selectedRadius !== 'ALL') {
      const radiusKm = parseFloat(selectedRadius);
      const radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000,
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#06b6d4',
        fillOpacity: 0.08,
      }).addTo(mapInstanceRef.current);

      radiusCircleRef.current = radiusCircle;
    }
  }, [userLocation, selectedRadius]);

  // 6. Highlight Selected Pin on Map with Glowing Pulse & Distinct Marker
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    if (selectedMarkerRef.current) {
      mapInstanceRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (!selectedLead || !selectedLead.lat || !selectedLead.lng) return;

    const activeSelectedIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center -top-6 -left-6 w-12 h-12 pointer-events-none">
          <!-- Dynamic Pulsing Radar Ripple -->
          <div class="absolute inset-0 rounded-full bg-amber-400/40 animate-ping"></div>
          <div class="absolute -inset-1 rounded-full bg-amber-500/30 animate-pulse"></div>
          
          <!-- Distinct Elevated Active Pin -->
          <div class="relative flex flex-col items-center pointer-events-auto filter drop-shadow-[0_0_16px_rgba(245,158,11,0.9)]">
            <div class="h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-2xl border-2 border-white scale-110">
              <svg class="w-4 h-4 fill-slate-950" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div class="w-2.5 h-2.5 bg-yellow-300 rotate-45 -mt-1 shadow-md border-r border-b border-amber-500"></div>
          </div>
        </div>
      `,
      className: 'custom-selected-pin-icon',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const activeMarker = L.marker([selectedLead.lat, selectedLead.lng], {
      icon: activeSelectedIcon,
      zIndexOffset: 9999,
    }).addTo(mapInstanceRef.current);

    selectedMarkerRef.current = activeMarker;

    // Smoothly pan to the selected factory pin
    mapInstanceRef.current.panTo([selectedLead.lat, selectedLead.lng], {
      animate: true,
      duration: 0.8,
    });
  }, [selectedLead]);

  const handleRecenterUser = () => {
    if (mapInstanceRef.current && userLocation.lat && userLocation.lng) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    }
  };

  const handleRecenterSamutPrakan = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([13.6062, 100.6974], 11, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls (Top-Left) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)]">
        
        {/* District Selector Dropdown inside Map */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-850 text-slate-100 border border-amber-500/50 shadow-xl shadow-amber-500/10 backdrop-blur-md text-xs font-bold transition">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictSelect && onDistrictSelect(e.target.value)}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-4 appearance-none hover:text-amber-300 transition"
              aria-label="เลือกพื้นที่อำเภอ"
            >
              <option value="ALL" className="bg-slate-900 text-white py-1.5">
                🗺️ ทุกอำเภอ {totalLeadCount ? `(${totalLeadCount} โรงงาน)` : ''}
              </option>
              {districtList.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white py-1.5">
                  📍 อ.{d} {districtCounts?.[d] ? `(${districtCounts[d]} โรงงาน)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0 pointer-events-none -ml-3" />
          </div>
        </div>

        {/* Standard My Location Recenter Button */}
        <button
          onClick={handleRecenterUser}
          className="p-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer active:scale-95"
          title="ซูมไปยังตำแหน่งของฉัน"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">ตำแหน่งของฉัน</span>
        </button>

        {/* Recenter Overview */}
        <button
          onClick={handleRecenterSamutPrakan}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer active:scale-95"
          title="ภาพรวมสมุทรปราการ 6 อำเภอ"
        >
          <Maximize2 className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">ภาพรวมทั้งจังหวัด</span>
        </button>

        {/* Theme Toggle (Dark / Street) */}
        <button
          onClick={() => setMapTheme(mapTheme === 'dark' ? 'streets' : 'dark')}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer active:scale-95"
          title="สลับโหมดแผนที่"
        >
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">{mapTheme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}</span>
        </button>

      </div>

      {/* Floating Lead Detail Card (Bottom-Left / Popup) */}
      {selectedLead && (
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:left-4 sm:max-w-md z-[500] bg-slate-900/95 border border-slate-700/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200 space-y-3.5">
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-white truncate leading-tight">
                  {selectedLead.name}
                </h4>
                <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                  📍 อ.{selectedLead.district || '-'} {selectedLead.subdistrict ? `• ต.${selectedLead.subdistrict}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5 border-t border-slate-800/80 pt-2.5 font-medium">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 shrink-0">ที่อยู่:</span>
              <span className="text-slate-200 line-clamp-2">
                {selectedLead.road ? `ถ.${selectedLead.road} ` : ''}
                {selectedLead.address || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">ระยะทางจากคุณ:</span>
              <span className="font-bold text-amber-400 font-mono">
                ~{calculateDistanceKm(userLocation.lat, userLocation.lng, selectedLead.lat, selectedLead.lng).toFixed(1)} กม.
              </span>
            </div>
          </div>

          {/* Quick Contact & Navigation Actions */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {selectedLead.phone ? (
                <a
                  href={`tel:${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                  className="h-11 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">โทรออก</span>
                </a>
              ) : (
                <button
                  disabled
                  className="h-11 px-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>ไม่มีเบอร์โทร</span>
                </button>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLead.lat},${selectedLead.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-slate-950 shrink-0" />
                <span className="truncate">นำทาง GPS</span>
              </a>
            </div>

            {selectedLead.website && (
              <a
                href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition text-center active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>เยี่ยมชมเว็บไซต์โรงงาน</span>
              </a>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
