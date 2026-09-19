'use client';

import React, { useState } from 'react';
import {
  X,
  Inbox,
  AlertCircle,
  PhoneOff,
  Ban,
  Building2,
  Users2,
  Swords,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { CompanyLead } from '@/lib/types';

export interface ReleaseReasonOption {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeColor: string;
}

export const RELEASE_REASONS: ReleaseReasonOption[] = [
  {
    key: 'UNREACHABLE',
    label: 'ติดต่อไม่ได้ / ไม่รับสายเกิน 3 ครั้ง',
    icon: PhoneOff,
    description: 'โทรติดต่อหลายรอบแล้วไม่มีคนรับสาย หรือเบอร์ติดต่อไม่ได้',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    key: 'NO_NEED',
    label: 'ยังไม่มีความต้องการ / ไม่มีงบประมาณ',
    icon: Ban,
    description: 'ติดต่อแล้ว ลูกค้ายังไม่มีแผนจัดซื้อหรือยังไม่มีงบประมาณในช่วงนี้',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  {
    key: 'WRONG_TARGET',
    label: 'ไม่ตรงกลุ่มเป้าหมาย / ไม่ได้ใช้สินค้าเรา',
    icon: Building2,
    description: 'โรงงานไม่ได้ใช้สินค้าหรือบริการประเภทที่เราจำหน่าย',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    key: 'REASSIGN',
    label: 'ส่งต่อให้เพื่อนร่วมทีม / ผู้เชี่ยวชาญ',
    icon: Users2,
    description: 'ต้องการให้เซลส์ท่านอื่นในทีมที่มีความเชี่ยวชาญเฉพาะทางดูแลแทน',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    key: 'COMPETITOR',
    label: 'ใช้คู่แข่งอยู่ / เพิ่งต่อสัญญากับเจ้าอื่น',
    icon: Swords,
    description: 'ลูกค้ามีสัญญาผูกมัดกับเจ้าอื่นอยู่แล้วในปัจจุบัน',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    key: 'OTHER',
    label: 'สาเหตุอื่นๆ (ระบุในหมายเหตุ)',
    icon: FileText,
    description: 'มีเหตุผลเฉพาะอื่นๆ เพิ่มเติม',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
];

interface ReleaseLeadModalProps {
  isOpen: boolean;
  lead: CompanyLead | null;
  onClose: () => void;
  onConfirmRelease: (payload: {
    reasonKey: string;
    reasonLabel: string;
    note: string;
  }) => Promise<void>;
}

export function ReleaseLeadModal({
  isOpen,
  lead,
  onClose,
  onConfirmRelease,
}: ReleaseLeadModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('UNREACHABLE');
  const [releaseNote, setReleaseNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMsg('กรุณาเลือกสาเหตุการปล่อยพอร์ต');
      return;
    }

    const currentOption = RELEASE_REASONS.find((r) => r.key === selectedReason);
    const reasonLabel = currentOption ? currentOption.label : selectedReason;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmRelease({
        reasonKey: selectedReason,
        reasonLabel,
        note: releaseNote.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งคืนคลังกลาง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                ส่งคืนลูกค้าเข้า "คลังลูกค้ารอจัดสรร"
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                {lead.company_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            ข้อมูลการโทร, เบอร์ติดต่อ, และประวัติที่เคยบันทึกไว้จะไม่สูญหาย และจะถูกส่งไปที่
            <strong className="text-cyan-300"> คลังกลางของบริษัท</strong> เพื่อให้หัวหน้าทีมพิจารณาส่งต่อให้เพื่อนร่วมทีมดูแลต่อไป
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>เลือกสาเหตุที่ต้องการส่งคืนพอร์ต:</span>
              <span className="text-rose-400">*</span>
            </label>

            <div className="space-y-2">
              {RELEASE_REASONS.map((opt) => {
                const isSelected = selectedReason === opt.key;
                const IconComponent = opt.icon;

                return (
                  <div
                    key={opt.key}
                    onClick={() => setSelectedReason(opt.key)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              รายละเอียดเพิ่มเติมสำหรับหัวหน้าทีม / เซลส์คนถัดไป (ถ้ามี):
            </label>
            <textarea
              rows={3}
              value={releaseNote}
              onChange={(e) => setReleaseNote(e.target.value)}
              placeholder="เช่น ลูกค้าแจ้งให้โทรตามอีกทีเดือนหน้า, หรือแจ้งว่าติดต่อคุณสมชาย ฝ่ายจัดซื้อ..."
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Inbox className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังส่งคืน...' : 'ยืนยันส่งคืนคลังกลาง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
