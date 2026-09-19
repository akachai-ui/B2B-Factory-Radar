'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface ActivityAuthor {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  email?: string;
}

export interface LeadActivity {
  id: string;
  company_id: string;
  company_lead_id: string;
  user_id?: string;
  activity_type?: string;
  content: string;
  status_change?: string | null;
  deal_value_change?: number | null;
  created_at: string;
  author?: ActivityAuthor;
}

interface LeadActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any; // CompanyLead
  companyId: string;
  currentUser: {
    id: string;
    full_name?: string;
    avatar_url?: string | null;
  } | null;
  onActivityAdded?: () => void;
}

export const LeadActivityModal: React.FC<LeadActivityModalProps> = ({
  isOpen,
  onClose,
  lead,
  companyId,
  currentUser,
  onActivityAdded
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State - Clean & Minimalist
  const [content, setContent] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch activities for current lead
  const fetchActivities = useCallback(async () => {
    if (!lead?.id || !companyId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/portfolio/activities?company_lead_id=${lead.id}&company_id=${companyId}`);
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (err: any) {
      console.error('Failed to load lead activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lead?.id, companyId]);

  useEffect(() => {
    if (isOpen && lead?.id) {
      fetchActivities();
      setContent('');
      setErrorMsg(null);
    }
  }, [isOpen, lead, fetchActivities]);

  if (!isOpen || !lead) return null;

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('กรุณากรอกข้อความก่อนกดบันทึก');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/portfolio/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          company_lead_id: lead.id,
          user_id: currentUser?.id,
          activity_type: 'NOTE',
          content: content.trim(),
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save note');
      }

      setContent('');
      await fetchActivities();
      if (onActivityAdded) {
        onActivityAdded();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* HEADER */}
        <div className="p-4 border-b border-slate-800 bg-slate-850 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {lead.status === 'WON' ? '🟢 ปิดการขาย' : lead.status === 'MEETING' ? '🟣 นัดหมาย' : lead.status === 'QUOTATION' || lead.status === 'QUOTED' ? '🟡 เสนอราคา' : lead.status === 'CONTACTED' ? '🔵 ติดต่อแล้ว' : '🟠 ลูกค้าใหม่'}
              </span>
              <span className="text-xs text-slate-400">
                {lead.district || lead.province || 'สมุทรปราการ'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 truncate">
              {lead.company_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {/* QUICK NOTE INPUT (FRICTIONLESS) */}
          <form onSubmit={handleSubmitNote} className="bg-slate-850 border border-slate-750 rounded-xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>📝 บันทึกโน้ตสำคัญ</span>
              </label>
              <span className="text-[11px] text-slate-500">บันทึกทุกรอบเพื่อดูย้อนหลังได้</span>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="พิมพ์บันทึก เช่น คุยกับฝ่ายจัดซื้อแล้ว สนใจสั่งซื้อสินค้า, นัดส่งราคาอาทิตย์หน้า..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
            />

            {errorMsg && (
              <p className="text-xs text-red-400 font-medium">⚠️ {errorMsg}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} className="w-5 h-5 rounded-full ring-1 ring-blue-500 object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white font-bold flex items-center justify-center">
                    {currentUser?.full_name?.charAt(0) || '👤'}
                  </span>
                )}
                <span className="text-[11px] text-slate-400">บันทึกโดย: <strong className="text-slate-300 font-medium">{currentUser?.full_name || 'คุณ'}</strong></span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกโน้ต'}
              </button>
            </div>
          </form>

          {/* NOTE HISTORY FEED */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>📜 ประวัติโน้ตย้อนหลัง</span>
              <span className="text-[11px] text-slate-500 font-normal">ทั้งหมด {activities.length} รายการ</span>
            </h3>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                กำลังโหลดประวัติ...
              </div>
            ) : activities.length === 0 ? (
              <div className="py-6 text-center bg-slate-850/40 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                ยังไม่มีโน้ตบันทึกสำหรับลูกค้ารายนี้<br/>
                <span className="text-slate-500 text-[11px]">พิมพ์ข้อความในกล่องด้านบนเพื่อเริ่มบันทึกครั้งแรก</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.map((act) => {
                  const isStatusChange = act.activity_type === 'STATUS_CHANGE';
                  return (
                    <div
                      key={act.id}
                      className={`rounded-xl p-3 transition-colors shadow-sm space-y-1.5 ${
                        isStatusChange
                          ? 'bg-slate-900/90 border border-blue-500/30 ring-1 ring-blue-500/10'
                          : 'bg-slate-850 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {act.author?.avatar_url ? (
                            <img
                              src={act.author.avatar_url}
                              alt={act.author.full_name}
                              className="w-5 h-5 rounded-full ring-1 ring-blue-500 object-cover"
                            />
                          ) : (
                            <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${isStatusChange ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
                              {isStatusChange ? '⚙️' : (act.author?.full_name?.charAt(0) || 'S')}
                            </div>
                          )}
                          <span className="font-semibold text-slate-200">
                            {act.author?.full_name || 'ทีมงานขาย'}
                          </span>
                          {isStatusChange && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              อัปเดตระบบ
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(act.created_at)}
                        </span>
                      </div>

                      <p className={`text-xs whitespace-pre-line leading-relaxed pl-7 ${isStatusChange ? 'text-blue-200 font-medium' : 'text-slate-300'}`}>
                        {act.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};

export default LeadActivityModal;
