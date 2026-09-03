'use client';

import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit3 } from 'lucide-react';
import { FactoryLead } from '@/lib/types';

interface LeadsTableProps {
  leads: FactoryLead[];
  onSelectLead: (lead: FactoryLead) => void;
  onStatusChange: (placeId: string, status: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onSelectLead,
  onStatusChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const totalPages = Math.ceil(leads.length / pageSize) || 1;
  const currentSafePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = (currentSafePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, leads.length);
  const pageData = leads.slice(startIdx, endIdx);

  const statusOptions: string[] = [
    'ยังไม่ได้ติดต่อ',
    'โทรติดต่อแล้ว',
    'นัดหมาย On-site Demo',
    'เสนอราคาแล้ว',
    'ปิดการขายสำเร็จ',
    'ไม่สนใจ / ปฏิเสธ',
  ];

  const getStatusBadgeStyle = (status: string) => {
    if (status.includes('นัดหมาย')) return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
    if (status.includes('โทร')) return 'bg-blue-50 text-blue-900 border-blue-300 font-medium';
    if (status.includes('เสนอราคา')) return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    if (status.includes('สำเร็จ')) return 'bg-purple-50 text-purple-900 border-purple-300 font-bold';
    if (status.includes('ปฏิเสธ')) return 'bg-rose-50 text-rose-900 border-rose-300';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-3.5 px-3.5 text-center w-14">ลำดับ</th>
              <th className="py-3.5 px-4 min-w-[240px]">ชื่อโรงงาน / บริษัท</th>
              <th className="py-3.5 px-4 min-w-[150px]">เบอร์โทรศัพท์ (กดโทรได้)</th>
              <th className="py-3.5 px-4 min-w-[180px]">อีเมลติดต่อ (Email)</th>
              <th className="py-3.5 px-3 min-w-[110px]">ตำบล</th>
              <th className="py-3.5 px-3 min-w-[130px]">อำเภอ</th>
              <th className="py-3.5 px-4 min-w-[210px]">ที่อยู่ตั้ง</th>
              <th className="py-3.5 px-3 text-center min-w-[100px]">เว็บ & แผนที่</th>
              <th className="py-3.5 px-4 min-w-[150px]">สถานะติดตามงานขาย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400 font-medium">
                  ❌ ไม่พบโรงงานที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              pageData.map((lead, idx) => {
                const itemIdx = startIdx + idx + 1;
                const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                const emails = lead.email ? lead.email.split(',').slice(0, 2) : [];

                return (
                  <tr key={lead.place_id || idx} className="hover:bg-slate-50/90 transition-colors group">
                    
                    {/* Index */}
                    <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono font-bold text-[11px]">
                      {itemIdx}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 leading-snug">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="text-left hover:text-[#145853] transition-colors flex items-center gap-1.5 group/btn cursor-pointer"
                      >
                        <span>{lead.name}</span>
                        <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                      <div className="text-[10px] text-slate-400 font-normal font-mono mt-0.5">
                        GPS: {lead.lat ? `${lead.lat.toFixed(4)}, ${lead.lng?.toFixed(4)}` : '-'}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      {lead.phone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200/80 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                          title="โทรติดต่อทันที"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 italic">ไม่มีเบอร์</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      {emails.length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-[170px]">
                          {emails.map((em, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/80 font-mono text-[10px] font-semibold truncate"
                              title={em.trim()}
                            >
                              ✉️ {em.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Sub-district */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold text-[11px] border border-blue-100">
                        {lead.subdistrict || '-'}
                      </span>
                    </td>

                    {/* District */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/60">
                        {lead.district || '-'}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-relaxed max-w-xs truncate" title={lead.address}>
                      {lead.address}
                    </td>

                    {/* Links */}
                    <td className="py-3.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 inline-flex items-center justify-center text-xs transition active:scale-95 shadow-2xs"
                          title="เปิดเว็บไซต์"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.maps_url && (
                        <a
                          href={lead.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center justify-center text-xs transition active:scale-95 shadow-2xs"
                          title="เปิด Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>

                    {/* Sales Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status || 'ยังไม่ได้ติดต่อ'}
                        onChange={(e) => onStatusChange(lead.place_id, e.target.value)}
                        className={`text-[11px] rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer transition shadow-2xs ${getStatusBadgeStyle(
                          lead.status || 'ยังไม่ได้ติดต่อ'
                        )}`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="text-slate-500 font-medium">
          หน้า {currentSafePage} จาก {totalPages} (แสดงรายการที่{' '}
          {leads.length === 0 ? 0 : (startIdx + 1).toLocaleString()} - {endIdx.toLocaleString()} จากทั้งหมด{' '}
          {leads.length.toLocaleString()} แห่ง)
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentSafePage <= 1}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentSafePage <= 1}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-4 py-2 font-black text-slate-900 bg-white rounded-xl border border-slate-200 shadow-2xs">
            {currentSafePage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentSafePage >= totalPages}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentSafePage >= totalPages}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
