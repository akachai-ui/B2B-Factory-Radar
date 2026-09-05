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
} from 'lucide-react';

interface FactoryMapProps {
  leads: FactoryLead[];
  userLocation: { lat: number; lng: number; label: string };
  isLiveTracking?: boolean;
  onToggleLiveTracking?: () => void;
  selectedDistrict: string;
  onDistrictSelect?: (district: string) => void;
  selectedRadius: string;
  onLeadClick?: (lead: FactoryLead) => void;
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
  isLiveTracking = false,
  onToggleLiveTracking,
  selectedDistrict,
  onDistrictSelect,
  selectedRadius,
  onLeadClick,
}: FactoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersClusterGroupRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

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

      // Tile Layer (Dark Theme by default)
      const tileUrl =
        mapTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      tileLayerRef.current = tileLayer;
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

    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; CartoDB & OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
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

    const factoryIcon = L.divIcon({
      html: `<div class="h-7 w-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 border border-slate-900 hover:scale-125 transition-transform"><svg class="w-3.5 h-3.5 fill-slate-950" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
      className: 'custom-factory-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return;

      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
      const marker = L.marker([lead.lat, lead.lng], { icon: factoryIcon });

      marker.on('click', () => {
        setSelectedLead(lead);
        if (onLeadClick) onLeadClick(lead);
      });

      clusterGroup.addLayer(marker);
    });

    mapInstanceRef.current.addLayer(clusterGroup);
    markersClusterGroupRef.current = clusterGroup;

    // Auto-fit bounds when leads change and not empty
    if (leads.length > 0 && leads.length <= 100) {
      const validPoints = leads
        .filter((l) => l.lat && l.lng)
        .map((l) => [l.lat, l.lng] as [number, number]);
      if (validPoints.length > 0) {
        mapInstanceRef.current.fitBounds(validPoints, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [leads, userLocation, onLeadClick]);

  // 5. Render User Live GPS Pin & Radius Circle
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L || !userLocation.lat || !userLocation.lng) return;

    // User GPS Marker
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    const userGpsIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center h-8 w-8"><div class="absolute h-8 w-8 rounded-full bg-cyan-400/30 animate-ping"></div><div class="h-5 w-5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg shadow-cyan-400/50 flex items-center justify-center text-[8px] font-black text-slate-950">📍</div></div>`,
      className: 'custom-user-gps-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userGpsIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstanceRef.current);

    userMarker.bindTooltip('📍 ตำแหน่ง GPS ของคุณ', {
      permanent: false,
      direction: 'top',
      className: 'bg-slate-900 text-cyan-300 font-bold border border-slate-700 px-2 py-1 rounded-lg text-xs',
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
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
        
        {/* Recenter GPS */}
        <button
          onClick={handleRecenterUser}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer active:scale-95"
          title="ซูมไปยังตำแหน่ง GPS ของฉัน"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">ตำแหน่งฉัน</span>
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

        {/* Live Tracking Status */}
        {onToggleLiveTracking && (
          <button
            onClick={onToggleLiveTracking}
            className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer active:scale-95 ${
              isLiveTracking
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isLiveTracking ? 'GPS สดเปิดอยู่' : 'เปิด GPS สด'}</span>
          </button>
        )}

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
          <div className="flex items-center gap-2 pt-1">
            {selectedLead.phone && (
              <a
                href={`tel:${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>โทร {selectedLead.phone}</span>
              </a>
            )}

            {selectedLead.website && (
              <a
                href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition"
                title="เข้าชมเว็บไซต์"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLead.lat},${selectedLead.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 fill-slate-950" />
              <span>นำทาง Google Maps</span>
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
