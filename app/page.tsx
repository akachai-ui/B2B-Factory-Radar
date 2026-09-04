'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FactoryLead } from '@/lib/types';
import { Database, Search, MapPin, Phone, Building2, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LeadsDatabasePage() {
  const [leads, setLeads] = useState<FactoryLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  const fetchLeads = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setLeads(data as FactoryLead[]);
      }
    } catch (err: any) {
      console.error('Fetch leads error:', err);
      setErrorMsg(err.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // District breakdown calculation
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const d = (lead.district || 'ไม่ระบุ').replace('อำเภอ', '').replace('อ.', '').trim();
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const districts = useMemo(() => {
    return Object.keys(districtCounts).sort();
  }, [districtCounts]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedDistrict !== 'ALL') {
        const d = (lead.district || '').replace('อำเภอ', '').replace('อ.', '').trim();
        if (d !== selectedDistrict && !lead.district?.includes(selectedDistrict)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchRoad = lead.road?.toLowerCase().includes(q);
        const matchSub = lead.subdistrict?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        if (!matchName && !matchRoad && !matchSub && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedDistrict, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Database className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>ฐานข้อมูลโรงงาน (Leads Table)</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                เชื่อมต่อ Supabase Database • จ.สมุทรปราการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>
        </header>

        {/* Database Status Alert */}
        {errorMsg ? (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:</p>
              <p className="text-slate-300 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                สถานะ: <strong className="font-black text-white">เชื่อมต่อ Supabase สำเร็จ</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-emerald-200">
              <span>พบข้อมูลทั้งหมด:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-sm">
                {leads.length} รายการ
              </span>
            </div>
          </div>
        )}

        {/* District Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setSelectedDistrict('ALL')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedDistrict === 'ALL'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-medium">ทุกอำเภอ</div>
            <div className="text-lg font-black text-white mt-1">{leads.length}</div>
          </button>

          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                selectedDistrict === d
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-medium truncate">อ.{d}</div>
              <div className="text-lg font-black text-white mt-1">{districtCounts[d]}</div>
            </button>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อโรงงาน, ถนน, ตำบล หรือเบอร์โทร..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
            แสดงผล <strong className="text-amber-400 font-bold">{filteredLeads.length}</strong> จาก {leads.length} รายการ
          </div>
        </div>

        {/* Leads Table / Grid */}
        {isLoading ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-300">กำลังโหลดข้อมูลจากฐานข้อมูล leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">ชื่อโรงงาน / บริษัท</th>
                  <th className="py-3 px-4">ที่อยู่ / ถนน</th>
                  <th className="py-3 px-4">อำเภอ</th>
                  <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-4">พิกัด GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLeads.slice(0, 50).map((lead, idx) => (
                  <tr key={lead.place_id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{lead.name}</span>
                      </div>
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          <span>{lead.website}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-[260px] truncate">
                      {lead.road ? `ถ.${lead.road} ` : ''}
                      {lead.subdistrict ? `ต.${lead.subdistrict}` : lead.address || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                        {lead.district || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-emerald-400 font-mono hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {lead.lat && lead.lng ? (
                        <a
                          href={`https://www.google.com/maps?q=${lead.lat},${lead.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber-400 flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{lead.lat.toFixed(4)}, {lead.lng.toFixed(4)}</span>
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length > 50 && (
              <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800 bg-slate-900/80">
                แสดง 50 รายการแรก จากทั้งหมด {filteredLeads.length} รายการ
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

