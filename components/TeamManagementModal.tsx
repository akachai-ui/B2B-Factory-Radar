'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Users,
  ShieldCheck,
  Copy,
  Check,
  UserPlus,
  Crown,
  Briefcase,
  X,
  AlertCircle,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOwner = profile?.role === 'owner' || !profile?.company_id;
  const company = profile?.company;
  const inviteCode = company?.invite_code || 'RH-8899';

  // Load all team members in the same company
  const loadTeamMembers = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, created_at')
        .eq('company_id', profile.company_id);

      if (!error && data) {
        setTeamMembers(data);
      }
    } catch (err) {
      console.warn('Error loading team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profile?.company_id) {
      loadTeamMembers();
    }
  }, [isOpen, profile?.company_id]);

  if (!isOpen) return null;

  // Handle Copy Invite Code
  const handleCopyInvite = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Handle Join Existing Company via Invite Code
  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      // Find company by invite code
      const { data: targetComp, error: findError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (findError || !targetComp) {
        setStatusMsg({ type: 'error', text: 'ไม่พบรหัสเชิญบริษัทนี้ กรุณาตรวจสอบรหัสอีกครั้ง' });
        setLoading(false);
        return;
      }

      // Update current user profile to join company as sales rep
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_id: targetComp.id,
          company_name: targetComp.name,
          role: 'sales',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเข้าร่วมทีม: ' + updateError.message });
      } else {
        setStatusMsg({ type: 'success', text: `เข้าร่วมทีม "${targetComp.name}" สำเร็จ!` });
        await refreshProfile();
        setTimeout(() => {
          loadTeamMembers();
        }, 300);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + (err.message || err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-white space-y-4 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>จัดการทีม & การกำหนดสิทธิ์ (Team Roles)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {profile?.company_name || 'บริษัทของคุณ'}
          </h2>
          <p className="text-xs text-slate-400">
            ระบบบริหารสมาชิกและสิทธิ์การเข้าถึงข้อมูลโรงงานร่วมกันในองค์กร
          </p>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500 text-rose-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. OWNER VIEW: INVITE CODE BOX */}
        {isOwner && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>รหัสเชิญเซลส์เข้าร่วมทีม (Invite Code)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                โควต้า: {company?.max_seats || 5} ที่นั่ง
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-black text-sm tracking-wider text-center select-all">
                {inviteCode}
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกรหัส'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              💡 ส่งรหัสนี้ให้เซลส์ในทีม เพื่อให้เซลส์กรอกเข้าสังกัดบริษัทของคุณ และแชร์สถานะโรงงานร่วมกัน
            </p>
          </div>
        )}

        {/* 2. JOIN COMPANY BOX (IF NOT IN A TEAM YET OR SALES REP) */}
        {!profile?.company_id && (
          <form onSubmit={handleJoinCompany} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>เข้าร่วมทีมบริษัทที่มีอยู่แล้ว</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="กรอกรหัสเชิญ เช่น RH-8899"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none uppercase font-mono font-bold focus:border-blue-500 transition"
              />
              <button
                type="submit"
                disabled={loading || !joinCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                เข้าร่วมทีม
              </button>
            </div>
          </form>
        )}

        {/* 3. TEAM MEMBERS LIST */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>สมาชิกในทีม ({teamMembers.length || 1} คน):</span>
            <button
              onClick={loadTeamMembers}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {(member.full_name || member.email || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate flex items-center gap-1.5">
                        <span>{member.full_name || 'สมาชิกทีม'}</span>
                        {member.id === user?.id && (
                          <span className="text-[9px] text-amber-400 font-medium">(คุณ)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {member.role === 'owner' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Owner</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-blue-400" />
                        <span>Sales Rep</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
                ยังไม่มีสมาชิกอื่นในทีม (ส่งรหัสเชิญด้านบนให้เซลส์เพื่อเข้าร่วม)
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            🛡️ ข้อมูลสถานะและโน้ตของแต่ละโรงงานจะถูกแชร์ให้ทุกคนในบริษัทเห็นร่วมกันอัตโนมัติ
          </p>
        </div>

      </div>
    </div>
  );
};
