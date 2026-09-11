'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DBDCompany, DBDFilterState } from '@/lib/types';
import * as XLSX from 'xlsx';
import {
  Building2,
  Search,
  Filter,
  Coins,
  MapPin,
  ExternalLink,
  PlusCircle,
  Check,
  Download,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  X,
  FileSpreadsheet,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

const CAPITAL_OPTIONS: { value: DBDFilterState['capitalRange']; label: string; min?: number; max?: number }[] = [
  { value: 'ALL', label: 'ทุนจดทะเบียนทั้งหมด' },
  { value: '<5M', label: '< 5 ล้านบาท', max: 5000000 },
  { value: '5M-20M', label: '5 - 20 ล้านบาท', min: 5000000, max: 20000000 },
  { value: '20M-50M', label: '20 - 50 ล้านบาท', min: 20000000, max: 50000000 },
  { value: '>50M', label: '> 50 ล้านบาท', min: 50000000 },
  { value: '>100M', label: '👑 > 100 ล้านบาท (Enterprise)', min: 100000000 },
];

const TSIC_CATEGORIES = [
  { prefix: 'ALL', label: 'ทุกหมวดธุรกิจ' },
  { prefix: '2', label: '🏭 ภาคการผลิต / โรงงาน (TSIC 20-33)' },
  { prefix: '46', label: '🏢 ค้าส่ง / ซัพพลายเออร์ (TSIC 46)' },
  { prefix: '47', label: '🛒 ค้าปลีก / พาณิชย์ (TSIC 47)' },
  { prefix: '49', label: '🚚 ขนส่งและโลจิสติกส์ (TSIC 49-53)' },
  { prefix: '41', label: '🏗️ รับเหมาก่อสร้าง (TSIC 41-43)' },
  { prefix: '62', label: '💻 ซอฟต์แวร์ & ไอที (TSIC 62-63)' },
  { prefix: '35', label: '⚡ พลังงานและไฟฟ้า (TSIC 35)' },
  { prefix: '68', label: '🏢 อสังหาริมทรัพย์ (TSIC 68)' },
];

const PROVINCE_OPTIONS = [
  'ทุกจังหวัด',
  'กรุงเทพมหานคร',
  'สมุทรปราการ',
  'ชลบุรี',
  'ระยอง',
  'นนทบุรี',
  'ปทุมธานี',
  'ฉะเชิงเทรา',
  'พระนครศรีอยุธยา',
  'สมุทรสาคร',
  'สระบุรี',
  'นครปฐม',
  'เชียงใหม่',
  'ภูเก็ต',
  'สุราษฎร์ธานี',
  'สงขลา',
  'ขอนแก่น',
  'นครราชสีมา'
];

interface DBDCompanyExplorerProps {
  onAddToLeads?: (company: DBDCompany) => Promise<void>;
  addedTaxIds?: Set<string>;
}

export function DBDCompanyExplorer({ onAddToLeads, addedTaxIds = new Set() }: DBDCompanyExplorerProps) {
  const [companies, setCompanies] = useState<DBDCompany[]>([]);
  const [totalInView, setTotalInView] = useState<number>(0);
  const [nationalStats, setNationalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompany, setSelectedCompany] = useState<DBDCompany | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(addedTaxIds);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ทุกจังหวัด');
  const [selectedCapital, setSelectedCapital] = useState<DBDFilterState['capitalRange']>('ALL');
  const [selectedTsic, setSelectedTsic] = useState('ALL');

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);

  // Load National Stats
  useEffect(() => {
    fetch('/api/dbd/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNationalStats(data);
        }
      })
      .catch((err) => console.error('Failed to load DBD stats:', err));
  }, []);

  // Fetch Companies based on BBOX and filters
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      let minLat = 5.5, maxLat = 20.5, minLng = 97.0, maxLng = 106.0;

      if (mapInstanceRef.current) {
        const bounds = mapInstanceRef.current.getBounds();
        minLat = bounds.getSouth();
        maxLat = bounds.getNorth();
        minLng = bounds.getWest();
        maxLng = bounds.getEast();
      }

      const params = new URLSearchParams();
      params.set('minLat', minLat.toFixed(6));
      params.set('maxLat', maxLat.toFixed(6));
      params.set('minLng', minLng.toFixed(6));
      params.set('maxLng', maxLng.toFixed(6));
      params.set('limit', '400');

      if (search.trim()) params.set('search', search.trim());
      if (selectedProvince !== 'ทุกจังหวัด') params.set('province', selectedProvince);

      const capOpt = CAPITAL_OPTIONS.find((c) => c.value === selectedCapital);
      if (capOpt?.min !== undefined) params.set('minCapital', capOpt.min.toString());
      if (capOpt?.max !== undefined) params.set('maxCapital', capOpt.max.toString());

      if (selectedTsic !== 'ALL') params.set('tsic', selectedTsic);

      const res = await fetch(`/api/dbd/bbox?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.companies || []);
        setTotalInView(data.totalInView || 0);
      }
    } catch (err) {
      console.error('Fetch DBD bbox error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedProvince, selectedCapital, selectedTsic]);

  // Debounced search / filter update
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.6062, 100.6974], // Default Bangkok / Samut Prakan
        zoom: 10,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Dark theme tiles
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri, OpenStreetMap', maxZoom: 16 }
      );
      const refLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      );
      L.layerGroup([baseLayer, refLayer]).addTo(map);

      // Listen to map moveend (panning / zooming)
      map.on('moveend', () => {
        fetchCompanies();
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when companies change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    if (clusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(clusterGroupRef.current);
    }

    const cluster = L.markerClusterGroup
      ? L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 45,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        })
      : L.layerGroup();

    companies.forEach((company) => {
      if (!company.lat || !company.lng) return;

      const isLarge = company.registered_capital >= 50000000;
      const isEnterprise = company.registered_capital >= 100000000;

      const markerColor = isEnterprise ? '#fbbf24' : isLarge ? '#a855f7' : '#38bdf8';
      const markerSize = isEnterprise ? 28 : isLarge ? 24 : 20;

      const customIcon = L.divIcon({
        className: 'custom-dbd-pin',
        html: `
          <div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            background: radial-gradient(circle, ${markerColor} 0%, rgba(15,23,42,0.9) 100%);
            border: 2px solid ${markerColor};
            border-radius: 50%;
            box-shadow: 0 0 12px ${markerColor}80;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const marker = L.marker([company.lat, company.lng], { icon: customIcon });

      const capitalFormatted = Number(company.registered_capital).toLocaleString();
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; color: #f8fafc; padding: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; margin-bottom: 2px;">
            ${company.tax_id}
          </div>
          <div style="font-size: 13px; font-weight: bold; line-height: 1.3; margin-bottom: 6px; color: #ffffff;">
            ${company.name}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
            💰 ทุนจดทะเบียน: <strong style="color: #34d399;">${capitalFormatted} บาท</strong>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            📍 ${company.district || ''} ${company.province || ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedCompany(company);
      });

      cluster.addLayer(marker);
    });

    cluster.addTo(mapInstanceRef.current);
    clusterGroupRef.current = cluster;
  }, [companies]);

  // Handle Province Zoom
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    if (mapInstanceRef.current) {
      if (province === 'กรุงเทพมหานคร') mapInstanceRef.current.setView([13.7563, 100.5018], 11);
      else if (province === 'สมุทรปราการ') mapInstanceRef.current.setView([13.5991, 100.5968], 11);
      else if (province === 'ชลบุรี') mapInstanceRef.current.setView([13.3611, 100.9847], 11);
      else if (province === 'ระยอง') mapInstanceRef.current.setView([12.6814, 101.2816], 11);
      else if (province === 'ปทุมธานี') mapInstanceRef.current.setView([14.0208, 100.5250], 11);
      else if (province === 'เชียงใหม่') mapInstanceRef.current.setView([18.7883, 98.9853], 11);
      else if (province === 'ภูเก็ต') mapInstanceRef.current.setView([7.8804, 98.3923], 11);
      else if (province === 'ทุกจังหวัด') mapInstanceRef.current.setView([13.6062, 100.6974], 7);
    }
  };

  // Add to Leads Handler
  const handleAddLead = async (company: DBDCompany) => {
    if (!onAddToLeads) return;
    setAddingId(company.tax_id);
    try {
      await onAddToLeads(company);
      setAddedIds((prev) => new Set([...prev, company.tax_id]));
    } catch (err) {
      console.error('Failed to add lead:', err);
    } finally {
      setAddingId(null);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (companies.length === 0) return;
    const exportData = companies.map((c, i) => ({
      ลำดับ: i + 1,
      เลขทะเบียนนิติบุคคล: c.tax_id,
      ชื่อนิติบุคคล: c.name,
      ทุนจดทะเบียน_บาท: c.registered_capital,
      รหัสTSIC: c.tsic_code || '-',
      วัตถุประสงค์: c.objective || '-',
      ที่ตั้งสำนักงานใหญ่: c.address || '-',
      ตำบล: c.subdistrict || '-',
      อำเภอ_เขต: c.district || '-',
      จังหวัด: c.province || '-',
      รหัสไปรษณีย์: c.postal_code || '-',
      วันที่จดทะเบียน: c.registration_date || '-',
      สถานะ: c.status || 'ACTIVE',
      ละติจูด: c.lat,
      ลองจิจูด: c.lng,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DBD_Companies');
    XLSX.writeFile(wb, `DBD_Export_${selectedProvince}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & National Big Data KPI Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ฐานข้อมูลกระทรวงพาณิชย์ (DBD DataWarehouse+)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>ฐานข้อมูลนิติบุคคลทั่วประเทศ 390,000+ รายการ</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              สืบค้นข้อมูลบริษัท ทุนจดทะเบียน วัตถุประสงค์ธุรกิจ และพิกัดทั่วทั้ง 77 จังหวัด ด้วยระบบ PostGIS Spatial Indexing พร้อมดึงเข้าสู่ Sales Pipeline ทันที
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-center">
              <span className="text-[11px] font-medium text-slate-400">นิติบุคคลทั้งหมด</span>
              <span className="text-lg sm:text-xl font-black text-white">
                {nationalStats?.stats?.total_companies ? Number(nationalStats.stats.total_companies).toLocaleString() : '390,924'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-center">
              <span className="text-[11px] font-medium text-emerald-300">สถานะดำเนินกิจการ</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">
                {nationalStats?.stats?.active_companies ? Number(nationalStats.stats.active_companies).toLocaleString() : '389,164'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-amber-300">มูลค่าทุนจดทะเบียนรวม</span>
              <span className="text-lg sm:text-xl font-black text-amber-400">
                1.67 ล้านล้าน฿
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Controls Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อบริษัท / เลข 13 หลัก / วัตถุประสงค์..."
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Province Selector */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {PROVINCE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Capital Range Selector */}
          <div className="relative">
            <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCapital}
              onChange={(e) => setSelectedCapital(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {CAPITAL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* TSIC Industry Category */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedTsic}
              onChange={(e) => setSelectedTsic(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {TSIC_CATEGORIES.map((t) => (
                <option key={t.prefix} value={t.prefix}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Capital Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 mr-1 font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              ทุนจดทะเบียน:
            </span>
            {CAPITAL_OPTIONS.map((cap) => (
              <button
                key={cap.value}
                onClick={() => setSelectedCapital(cap.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCapital === cap.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cap.label}
              </button>
            ))}
          </div>

          {/* Export Button & Total Count */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-slate-400 text-xs">
              พบบนหน้าจอ: <strong className="text-amber-400 font-bold">{totalInView.toLocaleString()}</strong> รายการ
            </span>
            <button
              onClick={handleExportExcel}
              disabled={companies.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel ({companies.length})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Map & Explorer Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Interactive PostGIS Leaflet Map */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 relative shadow-2xl h-[480px] sm:h-[600px] flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Map Floating Status Indicator */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <div className="text-xs">
              <span className="text-slate-400">หมุน/ซูมแผนที่เพื่อดึงข้อมูล: </span>
              <strong className="text-white font-bold">{totalInView.toLocaleString()} บริษัทในมุมมองนี้</strong>
            </div>
          </div>
        </div>

        {/* Right / Bottom: Companies List & Top Capital Cards */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3 h-[480px] sm:h-[600px]">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              รายชื่อบริษัท ({companies.length} รายการแรก)
            </h3>
            {isLoading && (
              <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> กำลังโหลด...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {companies.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2 rounded-2xl border border-dashed border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <p className="text-xs">ไม่พบนิติบุคคลในพื้นที่นี้ ลองขยายแผนที่หรือเปลี่ยนตัวกรอง</p>
              </div>
            )}

            {companies.map((company) => {
              const isSelected = selectedCompany?.id === company.id;
              const isAdded = addedIds.has(company.tax_id);
              const isAdding = addingId === company.tax_id;
              const capitalNum = Number(company.registered_capital);
              const capitalFormatted = capitalNum >= 1000000 
                ? `${(capitalNum / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M` 
                : `${capitalNum.toLocaleString()} ฿`;

              return (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {company.tax_id}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ทุน {capitalFormatted}
                        </span>
                        {company.tsic_code && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            TSIC {company.tsic_code}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-400">
                        {company.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        📍 {company.district ? `อ.${company.district}` : ''} {company.province || ''}
                      </p>
                    </div>

                    {/* Add to Pipeline Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLead(company);
                      }}
                      disabled={isAdded || isAdding}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 ${
                        isAdded
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-indigo-600/20 hover:bg-indigo-600 border-indigo-500/40 text-indigo-300 hover:text-white'
                      }`}
                      title={isAdded ? 'บันทึกเข้า Pipeline แล้ว' : 'บันทึกเป็น Lead ในระบบ'}
                    >
                      {isAdding ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isAdded ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    เลขทะเบียน {selectedCompany.tax_id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    สถานะ {selectedCompany.status || 'ACTIVE'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedCompany.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">💰 ทุนจดทะเบียน</span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {Number(selectedCompany.registered_capital).toLocaleString()} บาท
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">📅 วันที่จดทะเบียน</span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {selectedCompany.registration_date || '-'}
                </span>
              </div>
            </div>

            {/* Objective */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                วัตถุประสงค์ตามทะเบียน DBD (TSIC: {selectedCompany.tsic_code || '-'})
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedCompany.objective || 'ไม่มีข้อมูลระบุ'}
              </p>
            </div>

            {/* Address */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                ที่ตั้งสำนักงานใหญ่
              </span>
              <p className="text-xs sm:text-sm text-slate-200">
                {selectedCompany.address} {selectedCompany.subdistrict ? `ต.${selectedCompany.subdistrict}` : ''} {selectedCompany.district ? `อ.${selectedCompany.district}` : ''} {selectedCompany.province} {selectedCompany.postal_code}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <a
                  href={`https://datawarehouse.dbd.go.th/company/profile/${selectedCompany.tax_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  DBD DataWarehouse+
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCompany.name + ' ' + (selectedCompany.address || ''))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Google Maps
                </a>
              </div>

              <button
                onClick={() => handleAddLead(selectedCompany)}
                disabled={addedIds.has(selectedCompany.tax_id) || addingId === selectedCompany.tax_id}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all ${
                  addedIds.has(selectedCompany.tax_id)
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                }`}
              >
                {addingId === selectedCompany.tax_id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : addedIds.has(selectedCompany.tax_id) ? (
                  <>
                    <Check className="w-4 h-4" /> บันทึกใน Pipeline แล้ว
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> บันทึกเข้า Pipeline โรงงาน
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
