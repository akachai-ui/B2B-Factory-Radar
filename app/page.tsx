'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { IdentityOnboardingModal } from '@/components/IdentityOnboardingModal';
import { UserProfile } from '@/lib/types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  User,
  UserCheck,
  Mail,
  Phone,
  Hash,
  Sparkles,
  Zap,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Crown,
  Briefcase,
  Layers,
  ArrowRight,
  Send,
  PlusCircle,
  Clock,
  Shield,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';

export default function TeamManagementPage() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Team Data States
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Add Member Form
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'sales' | 'manager'>('sales');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trigger Onboarding for First-Time Users
  useEffect(() => {
    if (user && profile && profile.onboarded !== true) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [user, profile]);

  // Current Company / Team ID (If user is owner, use their own id or existing company_id)
  const effectiveCompanyId = profile?.company_id || profile?.id || user?.id;
  const isCompany = profile?.account_type === 'company';
  const isOwner = !profile?.role || profile?.role === 'owner';
  const displayTeamName = isCompany ? (profile?.company_name || 'บริษัทของฉัน') : `ทีมของ ${profile?.full_name || 'ฉัน'}`;

  // Fetch Team Members directly from Supabase
  const fetchTeam = async () => {
    if (!effectiveCompanyId) return;
    setIsLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`company_id.eq.${effectiveCompanyId},id.eq.${effectiveCompanyId}`)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setTeamMembers(data as UserProfile[]);
      }
    } catch (err: any) {
      console.warn('Fetch team error:', err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchTeam();
    }
  }, [user, profile, effectiveCompanyId]);

  // Handle Add Member to Team directly with Supabase
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setFeedback({ type: 'error', text: 'กรุณากรอกอีเมลของสมาชิก' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const cleanEmail = newEmail.toLowerCase().trim();

    try {
      // 1. Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        // Update existing member
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            company_id: effectiveCompanyId,
            role: newRole,
            company_name: profile?.company_name || displayTeamName,
            tax_id: profile?.tax_id || null,
            branch: profile?.branch || 'สำนักงานใหญ่',
            account_type: 'company',
            onboarded: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;

        setFeedback({
          type: 'success',
          text: `เพิ่มคุณ ${existingProfile.full_name || cleanEmail} เข้าสู่ทีมเรียบร้อยแล้ว!`,
        });
      } else {
        // Insert new invited member
        const tempId = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: tempId,
              email: cleanEmail,
              full_name: newFullName.trim() || cleanEmail.split('@')[0],
              phone: newPhone.trim() || null,
              role: newRole,
              company_id: effectiveCompanyId,
              company_name: profile?.company_name || displayTeamName,
              tax_id: profile?.tax_id || null,
              branch: profile?.branch || 'สำนักงานใหญ่',
              account_type: 'company',
              onboarded: true,
            },
          ]);

        if (insertError) throw insertError;

        setFeedback({
          type: 'success',
          text: `เชิญ ${cleanEmail} เข้าสู่ทีมเรียบร้อย!`,
        });
      }

      setNewEmail('');
      setNewFullName('');
      setNewPhone('');
      setIsAddModalOpen(false);
      await fetchTeam();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Remove Member from Team
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`คุณต้องการนำ "${memberName}" ออกจากทีมใช่หรือไม่?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_id: null,
          role: 'owner',
          account_type: 'individual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (error) throw error;

      setFeedback({ type: 'success', text: `นำ ${memberName} ออกจากทีมเรียบร้อย` });
      await fetchTeam();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการลบสมาชิก' });
    }
  };

  // Copy Invite Link
  const handleCopyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/auth/callback?team_id=${effectiveCompanyId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* 1. App Top Navigation */}
      <Navbar onOpenAuth={(mode = 'signin') => { setAuthModalMode(mode); setIsAuthModalOpen(true); }} />

      {/* 2. Main Team Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition animate-in fade-in duration-200 ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5 text-xs font-bold">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* User Not Logged In */}
        {!user ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">เข้าสู่ระบบเพื่อจัดการทีมและเพิ่มสมาชิก</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                รองรับการเพิ่มทีมงานขาย (Sales Reps), มอบหมายงาน, และแชร์ข้อมูลโรงงานร่วมกัน
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { setAuthModalMode('signin'); setIsAuthModalOpen(true); }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>เข้าสู่ระบบตอนนี้</span>
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Team Console */
          <div className="space-y-6">
            
            {/* Team Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${
                    isCompany ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {isCompany ? <Building2 className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black text-white">
                        {displayTeamName}
                      </h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        isCompany ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {isCompany ? '🏢 นิติบุคคล / บริษัท' : '👤 บุคคลธรรมดา / Solo Team'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>หัวหน้าทีม: <strong>{profile?.full_name || user.email}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">สมาชิกในทีม: {teamMembers.length} คน</span>
                    </p>
                  </div>
                </div>

                {/* Team Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์เชิญทีม'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ เพิ่มสมาชิกใหม่</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  <span>จำนวนสมาชิกทั้งหมด</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">{teamMembers.length} คน</div>
                <div className="text-[10px] text-slate-500">รวมหัวหน้าทีมและลูกทีม</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  <span>ผู้บริหาร / หัวหน้าทีม (Owner)</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {teamMembers.filter((m) => !m.role || m.role === 'owner').length} คน
                </div>
                <div className="text-[10px] text-slate-500">สิทธิ์ดูแลระบบและดูรายงาน</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  <span>ทีมเซลส์ / พนักงานขาย (Sales)</span>
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {teamMembers.filter((m) => m.role === 'sales').length} คน
                </div>
                <div className="text-[10px] text-slate-500">สิทธิ์เข้าพบลูกค้าและวางรูท</div>
              </div>
            </div>

            {/* Team Members List Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">รายชื่อสมาชิกและสิทธิ์ในทีม (Team Members & Roles)</h3>
                </div>
                <button
                  onClick={fetchTeam}
                  disabled={isLoadingTeam}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingTeam ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">ชื่อสมาชิก</th>
                      <th className="py-3.5 px-4">อีเมล (Login Account)</th>
                      <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                      <th className="py-3.5 px-4">บทบาท / สิทธิ์ (Role)</th>
                      <th className="py-3.5 px-4">สถานะ</th>
                      <th className="py-3.5 px-4 text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          {isLoadingTeam ? 'กำลังโหลดข้อมูลสมาชิก...' : 'ยังไม่มีสมาชิกในทีม (กด "+ เพิ่มสมาชิกใหม่" เพื่อเพิ่มลูกทีม)'}
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member, idx) => {
                        const isThisUser = member.id === user.id || member.email === user.email;
                        const isMemberOwner = !member.role || member.role === 'owner';

                        return (
                          <tr key={member.id || idx} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                                  {isMemberOwner ? '👑' : '💼'}
                                </div>
                                <div>
                                  <span>{member.full_name || 'สมาชิกในทีม'}</span>
                                  {isThisUser && (
                                    <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                      (ตัวคุณ)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-cyan-400">
                              {member.email}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 font-mono">
                              {member.phone || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 w-fit ${
                                isMemberOwner
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {isMemberOwner ? <Crown className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                                <span>{isMemberOwner ? 'Owner (หัวหน้าทีม)' : 'Sales (ทีมเซลส์)'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>พร้อมใช้งาน</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {!isThisUser && !isMemberOwner ? (
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                                  title="นำออกจากทีม"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 3. Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          />
          <div className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">เพิ่มสมาชิกเข้าสู่ทีม</h3>
                  <p className="text-xs text-slate-400">ระบุอีเมลของลูกทีมเพื่อดึงเข้าสังกัด</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">อีเมลสมาชิก (Login Email) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="เช่น sales1@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">ชื่อ - นามสกุล หรือ ชื่อเซลส์</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="เช่น สมศักดิ์ การขาย"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">สิทธิ์การใช้งาน (Role)</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-400 transition font-medium"
                >
                  <option value="sales">💼 Sales (ทีมเซลส์ - วางรูทวิ่งและส่งรายงาน)</option>
                  <option value="manager">👔 Manager (ผู้จัดการ - ดูแลทีมและมอบหมายงาน)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มเข้าสู่ทีม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Universal Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* 5. First-Time Identity Onboarding Modal */}
      <IdentityOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

    </div>
  );
}
