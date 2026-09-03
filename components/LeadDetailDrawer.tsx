'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, Globe, MapPin, Calendar, Save, CheckCircle2 } from 'lucide-react';
import { FactoryLead, SalesStatus } from '@/lib/types';

interface LeadDetailDrawerProps {
  lead: FactoryLead | null;
  onClose: () => void;
  onUpdateLead: (updated: FactoryLead) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onUpdateLead,
}) => {
  const [status, setStatus] = useState<string>('ยังไม่ได้ติดต่อ');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status || 'ยังไม่ได้ติดต่อ');
      setContactPerson(lead.contact_person || '');
      setNotes(lead.notes || '');
      setSavedSuccess(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    const updatedLead: FactoryLead = {
      ...lead,
      status,
      contact_person: contactPerson,
      notes,
    };
    onUpdateLead(updatedLead);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const statusOptions: SalesStatus[] = [
    'ยังไม่ได้ติดต่อ',
    'โทรติดต่อแล้ว',
    'นัดหมาย On-site Demo',
    'เสนอราคาแล้ว',
    'ปิดการขายสำเร็จ',
    'ไม่สนใจ / ปฏิเสธ',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#145853] text-white flex items-center justify-center font-bold text-base">
              🏭
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm leading-snug truncate max-w-[280px]">
                {lead.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ตำบล{lead.subdistrict} • {lead.district}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold border border-slate-200 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* Quick Contact Info */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">ข้อมูลติดต่อโรงงาน:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                {lead.district}
              </span>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2 text-slate-700 font-mono font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <a href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`} className="hover:underline text-emerald-700">
                  {lead.phone}
                </a>
              </div>
            )}

            {lead.email && (
              <div className="flex items-start gap-2 text-slate-700 font-mono">
                <Mail className="w-3.5 h-3.5 text-violet-600 mt-0.5" />
                <span className="text-violet-800 break-all">{lead.email}</span>
              </div>
            )}

            {lead.website && (
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  {lead.website}
                </a>
              </div>
            )}

            {lead.address && (
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{lead.address}</span>
              </div>
            )}
          </div>

          {/* Sales Status Form */}
          <div className="space-y-4 pt-2">
            
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">สถานะงานขาย (Sales Stage):</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 outline-none focus:border-[#219990] focus:bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">ชื่อผู้ติดต่อ / ตำแหน่ง:</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="เช่น คุณสมชาย (ผู้จัดการซ่อมบำรุง) / ฝ่ายจัดซื้อ"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 outline-none focus:border-[#219990] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">บันทึกผลการโทร & นัดหมาย (Call Notes):</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="บันทึกรายละเอียดการพูดคุย เช่น สนใจเครื่องกรองน้ำมันไฮดรอลิก 2 เครื่อง ขอนัดหมายเข้าดูหน้างานวันศุกร์นี้..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 outline-none focus:border-[#219990] focus:bg-white leading-relaxed"
              />
            </div>

          </div>

          {/* Direct Map Link */}
          {lead.maps_url && (
            <div className="pt-2">
              <a
                href={lead.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>เปิดแผนที่นำทางใน Google Maps</span>
              </a>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                บันทึกสำเร็จเรียบร้อย!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
            >
              ปิด
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#145853] hover:bg-[#0d3b37] text-white font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
