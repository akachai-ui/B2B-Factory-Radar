'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TeamInvitation } from '@/lib/types';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export function PendingInvitationModal() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [pendingInvite, setPendingInvite] = useState<TeamInvitation | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for pending invitations on load or login
  useEffect(() => {
    async function checkInvitations() {
      if (!user || !user.email) return;

      try {
        const cleanEmail = user.email.toLowerCase().trim();
        const { data, error } = await supabase
          .from('team_invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          // If user is not already in this company
          if (profile?.company_id !== data.company_id) {
            setPendingInvite(data as TeamInvitation);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn('Check invitations warning:', err);
      }
    }

    checkInvitations();
  }, [user, profile]);

  if (!isOpen || !pendingInvite) return null;

  // Handle Accept Invitation
  const handleAccept = async () => {
    if (!user || !pendingInvite) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      // 1. Fetch company details from companies table if available
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', pendingInvite.company_id)
        .maybeSingle();

      // 2. Update user profile in profiles table
      await updateProfile({
        company_id: pendingInvite.company_id,
        company_name: comp?.name || pendingInvite.company_name || 'บริษัทของฉัน',
        tax_id: comp?.tax_id || null,
        branch: comp?.branch || 'สำนักงานใหญ่',
        role: pendingInvite.role || 'sales',
        account_type: 'company',
        onboarded: true,
      });

      // 3. Mark invitation as accepted
      await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingInvite.id);

      setFeedback({ type: 'success', text: `เข้าร่วมทีม ${pendingInvite.company_name} เรียบร้อยแล้ว!` });
      await refreshProfile();

      setTimeout(() => {
        setIsOpen(false);
        if (typeof window !== 'undefined') window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการตอบรับคำเชิญ' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Decline Invitation
  const handleDecline = async () => {
    if (!pendingInvite) return;
    setIsProcessing(true);

    try {
      await supabase
        .from('team_invitations')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingInvite.id);

      setIsOpen(false);
    } catch (err) {
      console.error('Decline invite error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Modal Content */}
      <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Banner Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>คำเชิญเข้าร่วมทีม (Team Invitation)</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-white">
            คุณได้รับคำเชิญเข้าร่วมทีม!
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            องค์กรได้ส่งคำเชิญเพื่อดึงคุณเข้าสังกัดทีมขายและใช้งานระบบร่วมกัน
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bold text-center ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* Invitation Details Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">ชื่อบริษัท / องค์กร</div>
              <div className="text-base font-black text-white">{pendingInvite.company_name}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>ตำแหน่ง / สิทธิ์:</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {pendingInvite.role === 'manager' ? '👔 ผู้จัดการ (Manager)' : '💼 ทีมเซลส์ (Sales)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ส่งถึงอีเมล:</span>
            <span className="font-mono text-cyan-400 font-bold">{pendingInvite.email}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            ปฏิเสธคำเชิญ
          </button>

          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ยอมรับคำเชิญ</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
