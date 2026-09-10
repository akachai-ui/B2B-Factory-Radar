'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FactoryLead, UserProfile, TeamInvitation, LeadStatus } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { IdentityOnboardingModal } from '@/components/IdentityOnboardingModal';
import { PendingInvitationModal } from '@/components/PendingInvitationModal';
import { MobileBottomNav, MobileTab } from '@/components/MobileBottomNav';
import { MobileFactoryBottomSheet } from '@/components/MobileFactoryBottomSheet';
import * as XLSX from 'xlsx';
import {
  Search,
  MapPin,
  Phone,
  Building2,
  ExternalLink,
  Sparkles,
  Zap,
  User,
  SlidersHorizontal,
  Layers,
  ListFilter,
  Navigation,
  Globe,
  CheckCircle2,
  Users,
  UserPlus,
  ShieldCheck,
  Briefcase,
  Crown,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  PlusCircle,
  Clock,
  Send,
  MessageSquare,
  ChevronRight,
  Filter,
  Calendar,
  X,
  Edit3,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  KeyRound,
  CheckSquare,
  Terminal,
  Activity,
  Compass,
  Radio,
  LogOut,
  Camera,
} from 'lucide-react';

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

// Dynamically import Leaflet Map (SSR Disabled)
const FactoryMap = dynamic(
  () => import('@/components/FactoryMap').then((mod) => mod.FactoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] sm:h-[640px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-300">กำลังโหลดแผนที่เรดาร์โรงงานสมุทรปราการ...</p>
      </div>
    ),
  }
);

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; bg: string }[] = [
  { value: 'NEW', label: 'ใหม่ (ยังไม่ติดต่อ)', color: 'text-cyan-300', bg: 'bg-cyan-500/20 border-cyan-500/30' },
  { value: 'CONTACTED', label: 'โทรติดต่อแล้ว', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-500/30' },
  { value: 'MEETING', label: 'นัดหมายเข้าพบ', color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  { value: 'QUOTED', label: 'เสนอราคาแล้ว', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  { value: 'WON', label: 'ปิดการขายสำเร็จ (Won)', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  { value: 'LOST', label: 'ไม่สนใจ / ปิดโอกาส', color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-600/30' },
];

export default function LeadsRadarMainPage() {
  const {
    user,
    profile,
    loading: authLoading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    updateProfile,
  } = useAuth();
  
  // Landing Login Form States (When !user)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginFullName, setLoginFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Main Dashboard States (When user is logged in)
  const [mainTab, setMainTab] = useState<'map' | 'table' | 'team'>('map');

  // Mobile App Shell States (When on smartphone)
  const [mobileTab, setMobileTab] = useState<MobileTab>('radar');
  const [mobileSelectedLead, setMobileSelectedLead] = useState<FactoryLead | null>(null);

  // Leads & Filters
  const [leads, setLeads] = useState<FactoryLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSalesRepFilter, setSelectedSalesRepFilter] = useState<string>('ALL');

  // Selected Lead for Detail/Notes Modal
  const [activeLeadModal, setActiveLeadModal] = useState<FactoryLead | null>(null);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);

  // Auth & Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Team Data States
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [teamTab, setTeamTab] = useState<'members' | 'pending'>('members');
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Add Member Form
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'sales' | 'manager'>('sales');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current Company
  const [currentCompany, setCurrentCompany] = useState<any>(null);

  // Effective Company ID
  const effectiveCompanyId = profile?.company_id || currentCompany?.id || profile?.id || user?.id;
  const isCompany = profile?.account_type === 'company';
  const isOwner = profile?.role === 'owner' || (user?.id && currentCompany?.owner_id && user.id === currentCompany.owner_id) || (!profile?.role && profile?.account_type !== 'company');
  const displayTeamName = currentCompany?.name || profile?.company_name || (isCompany ? 'บริษัทของฉัน' : `ทีมของ ${profile?.full_name || 'ฉัน'}`);

  // Trigger Onboarding for First-Time Users
  useEffect(() => {
    if (user && profile && profile.onboarded !== true) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [user, profile]);

  // Live GPS User Location State (Default: Samut Prakan Center)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    speed?: number | null;
    accuracy?: number | null;
  }>({
    lat: 13.6062,
    lng: 100.6974,
    label: 'พิกัดเริ่มต้น: จ.สมุทรปราการ',
  });

  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Auto-detect GPS Location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (isLiveTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            label: '📍 พิกัดสดจาก GPS ของคุณ',
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Live GPS watch error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isLiveTracking]);

  // 1. Fetch Leads
  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: true });

      if (data && data.length > 0 && !error) {
        setLeads(data as FactoryLead[]);
      } else {
        // Fallback to local leads_data.json
        const fallbackRes = await fetch('/leads_data.json').catch(() => null);
        if (fallbackRes && fallbackRes.ok) {
          const json = await fallbackRes.json();
          setLeads(json as FactoryLead[]);
        }
      }
    } catch (err) {
      console.warn('Fetch leads error, using local fallback:', err);
      try {
        const fallbackRes = await fetch('/leads_data.json');
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          setLeads(json as FactoryLead[]);
        }
      } catch (e) {}
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // 2. Fetch Team & Company
  const fetchTeam = async () => {
    if (!user) return;
    setIsLoadingTeam(true);
    try {
      let activeCompId = profile?.company_id;
      if (!activeCompId) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (comp) {
          setCurrentCompany(comp);
          activeCompId = comp.id;
          if (!profile?.company_id) {
            await updateProfile({ company_id: comp.id, company_name: comp.name, tax_id: comp.tax_id, branch: comp.branch });
          }
        }
      } else {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', activeCompId)
          .maybeSingle();
        if (comp) setCurrentCompany(comp);
      }

      const searchId = activeCompId || profile?.id || user.id;

      // Active Team Members
      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .or(`company_id.eq.${searchId},id.eq.${searchId}`)
        .order('created_at', { ascending: true });

      if (membersData) {
        setTeamMembers(membersData as UserProfile[]);
      }

      // Pending Invitations
      const { data: invitesData } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('company_id', searchId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesData) {
        setPendingInvitations(invitesData as TeamInvitation[]);
      }
    } catch (err: any) {
      console.warn('Fetch team warning:', err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchTeam();
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      fetchTeam();
    }
  }, [user, profile]);

  // District breakdown calculation
  const districts = ['บางพลี', 'เมืองสมุทรปราการ', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางบ่อ', 'บางเสาธง'];

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const d = (lead.district || 'ไม่ระบุ').replace('อำเภอ', '').replace('อ.', '').trim();
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!lead.lat || !lead.lng) return false;

      // District filter
      if (selectedDistrict !== 'ALL') {
        const d = (lead.district || '').replace('อำเภอ', '').replace('อ.', '').trim();
        if (d !== selectedDistrict && !lead.district?.includes(selectedDistrict)) {
          return false;
        }
      }

      // Radius filter
      if (selectedRadius !== 'ALL') {
        const radKm = parseFloat(selectedRadius);
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
        if (dist > radKm) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        const st = lead.status || 'NEW';
        if (st !== selectedStatusFilter) return false;
      }

      // Sales Rep filter
      if (selectedSalesRepFilter !== 'ALL') {
        if (selectedSalesRepFilter === 'UNASSIGNED') {
          if (lead.sales_rep) return false;
        } else {
          if (lead.sales_rep !== selectedSalesRepFilter) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchAddr = lead.address?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        const matchSub = lead.subdistrict?.toLowerCase().includes(q);
        const matchNotes = lead.notes?.toLowerCase().includes(q);
        const matchSales = lead.sales_rep?.toLowerCase().includes(q);
        if (!matchName && !matchAddr && !matchPhone && !matchSub && !matchNotes && !matchSales) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedDistrict, selectedRadius, selectedStatusFilter, selectedSalesRepFilter, searchQuery, userLocation]);

  // Update Lead Status or Sales Rep
  const handleUpdateLead = async (leadId: string | number, updates: Partial<FactoryLead>) => {
    try {
      // 1. Optimistic local update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId || l.place_id === leadId ? { ...l, ...updates, updated_at: new Date().toISOString() } : l))
      );

      if (activeLeadModal && (activeLeadModal.id === leadId || activeLeadModal.place_id === leadId)) {
        setActiveLeadModal((prev) => (prev ? { ...prev, ...updates } : null));
      }

      // 2. Persist to Supabase if available
      await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    } catch (err) {
      console.warn('Update lead error:', err);
    }
  };

  // Open Notes / Details Modal
  const handleOpenLeadModal = (lead: FactoryLead) => {
    setActiveLeadModal(lead);
    setModalNotes(lead.notes || '');
  };

  // Save Modal Notes
  const handleSaveModalNotes = async () => {
    if (!activeLeadModal) return;
    setIsSavingLead(true);
    await handleUpdateLead(activeLeadModal.id || activeLeadModal.place_id, {
      notes: modalNotes,
    });
    setIsSavingLead(false);
    setActiveLeadModal(null);
  };

  // Export to Excel (.xlsx) with White-label Branding
  const handleExportExcel = () => {
    const compName = currentCompany?.name || profile?.company_name || 'Innovatech.Co.,Ltd';
    const taxId = currentCompany?.tax_id || profile?.tax_id || '1659900487250';
    const branch = currentCompany?.branch || profile?.branch || 'สำนักงานใหญ่';

    const exportRows = filteredLeads.map((item, index) => {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng).toFixed(1);
      return {
        'ลำดับ': index + 1,
        'ชื่อโรงงาน / บริษัท': item.name,
        'สถานะการติดต่อ': item.status || 'NEW',
        'เซลส์ผู้รับผิดชอบ': item.sales_rep || 'ยังไม่ระบุ',
        'เบอร์โทรศัพท์': item.phone || '-',
        'อีเมล': item.email || '-',
        'ตำบล': item.subdistrict || '-',
        'อำเภอ': item.district || '-',
        'จังหวัด': item.province || 'สมุทรปราการ',
        'ที่อยู่เต็ม': item.address || '-',
        'ระยะทางจากคุณ (กม.)': `${dist} กม.`,
        'เว็บไซต์': item.website || '-',
        'ลิงก์ Google Maps': item.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`,
        'บันทึกโน้ต': item.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Factory_Radar_Leads');

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Factory_Radar_${compName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Handle Landing Email/Password Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthSubmitting(true);

    try {
      if (authTab === 'signin') {
        const { error } = await signInWithPassword(loginEmail, loginPassword);
        if (error) throw error;
      } else {
        const { error } = await signUpWithPassword(loginEmail, loginPassword, loginFullName);
        if (error) throw error;
        setAuthSuccessMsg('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
      }
    } catch (err: any) {
      setAuthError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Team Invite Action
  const handleSendTeamInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setFeedback({ type: 'error', text: 'คุณไม่มีสิทธิ์เชิญสมาชิก (เฉพาะเจ้าของทีม / Owner เท่านั้น)' });
      return;
    }
    if (!newEmail.trim()) {
      setFeedback({ type: 'error', text: 'กรุณากรอกอีเมลของสมาชิก' });
      return;
    }

    setIsSubmittingInvite(true);
    setFeedback(null);
    const cleanEmail = newEmail.toLowerCase().trim();

    try {
      const existingMember = teamMembers.find((m) => m.email?.toLowerCase().trim() === cleanEmail);
      if (existingMember) {
        setFeedback({ type: 'error', text: `อีเมล ${cleanEmail} เป็นสมาชิกในทีมนี้อยู่แล้ว` });
        setIsSubmittingInvite(false);
        return;
      }

      // 1. Insert Invitation into team_invitations
      const { data: newInvite, error: insertError } = await supabase
        .from('team_invitations')
        .insert([
          {
            company_id: effectiveCompanyId,
            company_name: currentCompany?.name || profile?.company_name || displayTeamName,
            email: cleanEmail,
            role: newRole,
            invited_by: user?.id,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Dispatch Email via Server API Route (Single Dispatch)
      let isEmailDispatched = false;
      try {
        const mailRes = await fetch('/api/team/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            role: newRole,
            companyId: effectiveCompanyId,
            companyName: currentCompany?.name || profile?.company_name || displayTeamName,
            inviterName: profile?.full_name || user?.email,
            inviterEmail: user?.email,
            inviteId: newInvite.id,
          }),
        });
        const mailJson = await mailRes.json();
        if (mailJson?.emailSent) {
          isEmailDispatched = true;
        }
      } catch (e) {
        console.warn('Dispatch email warning:', e);
      }

      setFeedback({
        type: 'success',
        text: isEmailDispatched
          ? `✉️ ส่งอีเมลคำเชิญไปยัง ${cleanEmail} เรียบร้อยแล้ว! (และสามารถกดคัดลอกลิงก์ส่งทาง LINE ได้เช่นกัน)`
          : `สร้างคำเชิญสำหรับ ${cleanEmail} สำเร็จแล้ว! (สามารถกดคัดลอกลิงก์ส่งทาง LINE หรือให้ลูกทีมล็อกอินตอบรับ)`,
      });

      setNewEmail('');
      setNewFullName('');
      setIsAddMemberModalOpen(false);
      await fetchTeam();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการส่งคำเชิญ' });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Copy Specific Invite Link
  const handleCopySpecificInvite = (invId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/invite/accept?invite_id=${invId}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteId(invId);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  // Cancel Pending Invite
  const handleCancelInvitation = async (inviteId: string, email: string) => {
    if (!isOwner) {
      setFeedback({ type: 'error', text: 'คุณไม่มีสิทธิ์ยกเลิกคำเชิญ (เฉพาะเจ้าของทีม / Owner เท่านั้น)' });
      return;
    }
    if (!confirm(`คุณต้องการยกเลิกคำเชิญของ "${email}" ใช่หรือไม่?`)) return;
    try {
      await supabase
        .from('team_invitations')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', inviteId);
      setFeedback({ type: 'success', text: `ยกเลิกคำเชิญของ ${email} เรียบร้อยแล้ว` });
      await fetchTeam();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // Remove Member from Team
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isOwner) {
      setFeedback({ type: 'error', text: 'คุณไม่มีสิทธิ์นำสมาชิกออก (เฉพาะเจ้าของทีม / Owner เท่านั้น)' });
      return;
    }
    if (!confirm(`คุณต้องการนำ "${memberName}" ออกจากสังกัดบริษัทใช่หรือไม่?`)) return;
    try {
      await supabase
        .from('profiles')
        .update({
          company_id: null,
          role: 'owner',
          account_type: 'individual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);
      setFeedback({ type: 'success', text: `นำ ${memberName} ออกจากทีมเรียบร้อย` });
      await fetchTeam();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // ----------------------------------------------------
  // 1. LOADING SCREEN (Initial Session Check)
  // ----------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
          <Layers className="w-6 h-6 text-slate-950 animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-400">กำลังเชื่อมต่อระบบ RouteHunter...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. STANDALONE LOGIN / BRAND SHOWCASE (WHEN !USER)
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden font-sans">
        
        {/* Ambient Glowing Orbs Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Minimal Top Bar with Dev link */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-end">
          <Link
            href="/dev"
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-slate-800 transition flex items-center gap-1.5 backdrop-blur-md"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Dev Monitor</span>
          </Link>
        </header>

        {/* Centered Ultra-Clean Brand & Login Container */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 my-auto w-full max-w-md mx-auto space-y-6">
          
          {/* Brand Logo & Title Showcase */}
          <div className="text-center space-y-3 flex flex-col items-center">
            
            {/* 100% Seamless Transparent 3D Emblem Logo (No border, No box) */}
            <div className="relative group cursor-default flex items-center justify-center">
              {/* Soft Golden Ambient Glow */}
              <div className="absolute w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="RouteHunter Emblem"
                  className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            {/* Brand Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                RouteHunter
              </h1>
            </div>

          </div>

          {/* Clean Glassmorphic Login Card */}
          <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
            
            {/* Tabs: Sign In / Sign Up */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthTab('signin'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authTab === 'signin'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authTab === 'signup'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            {/* Alerts */}
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* 1-Click Universal OAuth Logins */}
            <div className="space-y-2.5">
              
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-3 transition shadow-sm cursor-pointer active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>

              {/* Facebook OAuth Button */}
              <button
                type="button"
                onClick={signInWithFacebook}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#4599FF] hover:text-white text-xs font-bold flex items-center justify-center gap-3 transition shadow-sm cursor-pointer active:scale-98"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Facebook</span>
              </button>

            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-slate-600 text-[10px]">
              <div className="h-px bg-slate-800 flex-1" />
              <span>หรือใช้อีเมล</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              
              {authTab === 'signup' && (
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginFullName}
                    onChange={(e) => setLoginFullName(e.target.value)}
                    placeholder="ชื่อ - นามสกุล"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="อีเมล (name@company.com)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {isAuthSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>{authTab === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

          </div>

        </main>

        {/* Ultra-Clean Footer */}
        <footer className="relative z-10 text-center py-4 text-slate-600 text-[10px]">
          RouteHunter © 2026 • B2B Factory Radar
        </footer>

      </div>
    );
  }

  // ----------------------------------------------------
  // 3. MAIN APPLICATION WORKSPACE (WHEN LOGGED IN)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* ==================================================== */}
      {/* 1. DESKTOP WORKSPACE VIEW (HIDDEN ON MOBILE SCREENS) */}
      {/* ==================================================== */}
      <div className="hidden sm:flex flex-col flex-1">
        {/* App Navigation Bar */}
        <Navbar onOpenAuth={(mode = 'signin') => { setAuthModalMode(mode); setIsAuthModalOpen(true); }} />

        {/* Top Banner / System Status Header */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Title & Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Factory Radar 989</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    สมุทรปราการ
                  </span>
                </h1>
                <span className="text-xs text-slate-400 font-medium">
                  {leads.length > 0 ? `พบ ${leads.length.toLocaleString()} โรงงาน` : 'กำลังเชื่อมต่อฐานข้อมูล...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบเรดาร์สแกนโรงงานอุตสาหกรรม วางแผนรูทเซลส์ และจัดการทีมขาย B2B แบบเรียลไทม์
              </p>
            </div>

            {/* Navigation Tabs Switcher */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner self-start md:self-auto overflow-x-auto max-w-full">
              
              <button
                onClick={() => setMainTab('map')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  mainTab === 'map'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>🗺️ เรดาร์แผนที่</span>
              </button>

              <button
                onClick={() => setMainTab('table')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  mainTab === 'table'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>📋 ตารางโรงงาน & งานขาย</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/80 text-amber-300 font-mono">
                  {filteredLeads.length}
                </span>
              </button>

              <button
                onClick={() => setMainTab('team')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  mainTab === 'team'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>👥 จัดการทีมขาย</span>
                {teamMembers.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {teamMembers.length}
                  </span>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* 3. Main Body */}
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

        {/* ---------------------------------------------------- */}
        {/* TAB 1: RADAR MAP VIEW                                 */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Search & Quick Controls Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              
              {/* Search input */}
              <div className="flex-1 min-w-[260px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อโรงงาน, ถนน, เบอร์โทร..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
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

              {/* Radius Filter */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 px-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>รัศมีเรดาร์:</span>
                </span>
                <div className="flex items-center gap-1">
                  {['3', '5', '10', '15', 'ALL'].map((rad) => (
                    <button
                      key={rad}
                      onClick={() => setSelectedRadius(rad)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedRadius === rad
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {rad === 'ALL' ? 'ทั้งหมด' : `${rad} กม.`}
                    </button>
                  ))}
                </div>
              </div>

              {/* GPS Live Tracking Info & Status */}
              <div className="flex items-center justify-between lg:justify-end gap-2 text-xs shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 truncate max-w-[220px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate text-[11px] font-medium">{userLocation.label}</span>
                </div>

                <button
                  onClick={() => setIsLiveTracking(!isLiveTracking)}
                  className={`p-1.5 px-3 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isLiveTracking
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title={isLiveTracking ? 'เปิด GPS ติดตามสด' : 'ปิด GPS'}
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLiveTracking ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{isLiveTracking ? 'GPS สด' : 'GPS หยุด'}</span>
                </button>
              </div>

            </div>

            {/* District Filter Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>เลือกพื้นที่อำเภอ (จ.สมุทรปราการ 6 อำเภอ):</span>
                </span>
                <span>แสดง {filteredLeads.length} จาก {leads.length} โรงงาน</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setSelectedDistrict('ALL')}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedDistrict === 'ALL'
                      ? 'bg-slate-100 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>ทุกอำเภอ</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {leads.length}
                  </span>
                </button>

                {districts.map((d) => {
                  const count = districtCounts[d] || 0;
                  const isSelected = selectedDistrict === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDistrict(d)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{d}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radar Map Component */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              <FactoryMap
                leads={filteredLeads}
                userLocation={userLocation}
                isLiveTracking={isLiveTracking}
                onToggleLiveTracking={() => setIsLiveTracking(!isLiveTracking)}
                selectedDistrict={selectedDistrict}
                onDistrictSelect={(d) => setSelectedDistrict(d)}
                selectedRadius={selectedRadius}
                onLeadClick={(lead) => handleOpenLeadModal(lead)}
              />
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: FACTORY LIST & PIPELINE DEALS TABLE           */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'table' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Filter & Export Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, ที่อยู่, เซลส์..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
                  />
                </div>

                {/* District Dropdown */}
                <div>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="ALL">📍 อำเภอทั้งหมด (6 อำเภอ)</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d} ({districtCounts[d] || 0} โรงงาน)</option>
                    ))}
                  </select>
                </div>

                {/* Status Dropdown Filter */}
                <div>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="ALL">🏷️ สถานะทั้งหมด (Pipeline)</option>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sales Rep Filter */}
                <div>
                  <select
                    value={selectedSalesRepFilter}
                    onChange={(e) => setSelectedSalesRepFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="ALL">👤 เซลส์ผู้รับผิดชอบทั้งหมด</option>
                    <option value="UNASSIGNED">❌ ยังไม่ระบุเซลส์</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.full_name || m.email}>
                        {m.full_name || m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  แสดงผล <span className="font-bold text-amber-400">{filteredLeads.length}</span> จากทั้งหมด {leads.length} รายการ
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ส่งออก Excel (.xlsx) มีหัวบริษัท</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                      <th className="p-3.5 pl-5">#</th>
                      <th className="p-3.5">โรงงาน / บริษัท</th>
                      <th className="p-3.5">พื้นที่ & พิกัด</th>
                      <th className="p-3.5">ติดต่อ</th>
                      <th className="p-3.5">สถานะงานขาย</th>
                      <th className="p-3.5">เซลส์ดูแล</th>
                      <th className="p-3.5 pr-5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          ไม่พบข้อมูลโรงงานที่ตรงกับเงื่อนไขการค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.slice(0, 100).map((lead, idx) => {
                        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng).toFixed(1);
                        const currentStatus = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

                        return (
                          <tr key={lead.id || lead.place_id || idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 pl-5 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                            
                            {/* Name & Address */}
                            <td className="p-3.5 max-w-[260px]">
                              <div className="font-bold text-white text-xs truncate" title={lead.name}>
                                {lead.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5" title={lead.address}>
                                {lead.address}
                              </div>
                            </td>

                            {/* District & Distance */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-medium text-slate-200 text-xs">
                                อ.{lead.district?.replace('อำเภอ', '').replace('อ.', '')}
                              </div>
                              <div className="text-[11px] text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                <span>{dist} กม. จากคุณ</span>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="p-3.5 whitespace-nowrap">
                              {lead.phone ? (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono font-bold text-xs"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                              {lead.email && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                                  {lead.email}
                                </div>
                              )}
                            </td>

                            {/* Status Selector */}
                            <td className="p-3.5 whitespace-nowrap">
                              <select
                                value={lead.status || 'NEW'}
                                onChange={(e) => handleUpdateLead(lead.id || lead.place_id, { status: e.target.value as LeadStatus })}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer ${currentStatus.bg} ${currentStatus.color}`}
                              >
                                {STATUS_OPTIONS.map((st) => (
                                  <option key={st.value} value={st.value} className="bg-slate-900 text-white">
                                    {st.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Assigned Sales Rep */}
                            <td className="p-3.5 whitespace-nowrap">
                              <select
                                value={lead.sales_rep || ''}
                                onChange={(e) => handleUpdateLead(lead.id || lead.place_id, { sales_rep: e.target.value || null })}
                                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-amber-400 cursor-pointer"
                              >
                                <option value="">-- ยังไม่มอบหมาย --</option>
                                {teamMembers.map((m) => (
                                  <option key={m.id} value={m.full_name || m.email}>
                                    {m.full_name || m.email}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 pr-5 text-right whitespace-nowrap space-x-1.5">
                              <button
                                onClick={() => handleOpenLeadModal(lead)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="ดูรายละเอียด & บันทึกโน้ต"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={lead.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition inline-flex items-center cursor-pointer"
                                title="นำทาง Google Maps"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredLeads.length > 100 && (
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center text-xs text-slate-400">
                  แสดง 100 รายการแรก เพื่อความรวดเร็ว (สามารถใช้ปุ่ม "ส่งออก Excel" เพื่อดูข้อมูลทั้งหมด {filteredLeads.length} รายการ)
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: TEAM MANAGEMENT WORKSPACE                     */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'team' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header / Company Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-2xl shrink-0">
                    🏢
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white">{displayTeamName}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentCompany?.branch || profile?.branch || 'สำนักงานใหญ่'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      เลขผู้เสียภาษี: <span className="font-mono text-slate-300">{currentCompany?.tax_id || profile?.tax_id || '1659900487250'}</span> • สมาชิกทั้งหมด {teamMembers.length} คน
                    </p>
                  </div>
                </div>

                {/* Invite Button or Non-Owner Status Notice */}
                {isOwner ? (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-2 self-start sm:self-auto shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>เชิญสมาชิกใหม่</span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ตำแหน่งของคุณ: <strong className="text-white capitalize">{profile?.role === 'manager' ? 'ผู้จัดการ (Manager)' : 'ทีมเซลส์ (Sales)'}</strong> (สิทธิ์จัดการทีมเฉพาะ Owner)</span>
                  </div>
                )}

              </div>

              {/* Sub-tabs: Members vs Pending Invitations */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setTeamTab('members')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    teamTab === 'members'
                      ? 'bg-slate-100 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>สมาชิกในทีม ({teamMembers.length})</span>
                </button>

                <button
                  onClick={() => setTeamTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    teamTab === 'pending'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>คำเชิญที่รอยืนยัน ({pendingInvitations.length})</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab 1: Active Team Members */}
            {teamTab === 'members' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => {
                  const isThisOwner = member.role === 'owner' || (!member.role && member.id === currentCompany?.owner_id);
                  const isManager = member.role === 'manager';

                  return (
                    <div
                      key={member.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition shadow-xl space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            isThisOwner
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isManager
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {isThisOwner ? <Crown className="w-5 h-5 text-amber-400" /> : member.full_name?.charAt(0) || '👤'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[150px]">
                              {member.full_name || member.email?.split('@')[0]}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px] font-mono">
                              {member.email}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          isThisOwner
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : isManager
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {isThisOwner ? 'Owner' : isManager ? 'Manager' : 'Sales'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>เบอร์โทร: {member.phone || '-'}</span>
                        {isOwner && !isThisOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                            className="text-rose-400 hover:text-rose-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>นำออก</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-Tab 2: Pending Invitations */}
            {teamTab === 'pending' && (
              <div className="space-y-3">
                {pendingInvitations.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-bold text-slate-300">ไม่มีคำเชิญที่รอยืนยันในขณะนี้</p>
                    <p className="text-[11px] text-slate-500">
                      {isOwner ? 'สามารถกดปุ่ม "เชิญสมาชิกใหม่" ด้านบนเพื่อส่งคำเชิญ' : 'รายการคำเชิญจะได้รับการดูแลโดย Owner ของทีม'}
                    </p>
                  </div>
                ) : (
                  pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{inv.email}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>ตำแหน่ง: <strong className="text-amber-300 uppercase">{inv.role}</strong></span>
                            <span>•</span>
                            <span>ส่งเมื่อ: {new Date(inv.created_at || '').toLocaleDateString('th-TH')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleCopySpecificInvite(inv.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedInviteId === inv.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">คัดลอกแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-400" />
                              <span>คัดลอกลิงก์</span>
                            </>
                          )}
                        </button>

                        {isOwner && (
                          <button
                            onClick={() => handleCancelInvitation(inv.id, inv.email)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="ยกเลิกคำเชิญ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}

      </main>
      </div>

      {/* ==================================================== */}
      {/* 2. SMARTPHONE NATIVE APP SHELL (MOBILE VIEW ONLY)    */}
      {/* ==================================================== */}
      <div className="sm:hidden flex flex-col flex-1 min-h-screen pb-20">
        
        {/* Mobile Top App Bar */}
        <header className="sticky top-0 z-40 bg-[#0b0f19]/95 backdrop-blur-xl border-b border-slate-800/90 px-4 py-2.5 flex items-center justify-between gap-2 pt-safe">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
              <img
                src="/images/logo.png"
                alt="RouteHunter"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white leading-none tracking-tight">RouteHunter</span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  B2B
                </span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-bold truncate mt-0.5">{displayTeamName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live GPS Toggle */}
            <button
              onClick={() => {
                setIsLiveTracking(!isLiveTracking);
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setUserLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      label: '📍 พิกัดปัจจุบันของคุณ',
                    });
                  });
                }
              }}
              className={`p-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                isLiveTracking
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="GPS Live Tracking"
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
              <span>{isLiveTracking ? 'GPS เปิด' : 'GPS'}</span>
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setMobileTab('profile')}
              className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs transition border cursor-pointer ${
                mobileTab === 'profile'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {profile?.account_type === 'company' ? '🏢' : profile?.full_name?.charAt(0) || '👤'}
            </button>
          </div>
        </header>

        {/* Feedback Alert on Mobile */}
        {feedback && (
          <div className="mx-3 mt-2">
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}>
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 1: RADAR (FULLSCREEN MAP & FLOATING CHIPS)*/}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'radar' && (
          <div className="flex-1 flex flex-col relative animate-in fade-in duration-150">
            
            {/* Horizontal District Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-3 bg-slate-950/95 border-b border-slate-800/80 sticky top-12 z-30">
              <button
                onClick={() => setSelectedDistrict('ALL')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition shrink-0 cursor-pointer ${
                  selectedDistrict === 'ALL'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🗺️ ทุกอำเภอ ({leads.length})</span>
              </button>

              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition shrink-0 cursor-pointer border ${
                    selectedDistrict === d
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  <span>{d}</span>
                  <span className="ml-1 text-[9px] opacity-80">({districtCounts[d] || 0})</span>
                </button>
              ))}
            </div>

            {/* Horizontal Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-3 bg-slate-950/80 border-b border-slate-800/60 z-20">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st.value}
                  onClick={() => setSelectedStatusFilter(selectedStatusFilter === st.value ? 'ALL' : st.value)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition shrink-0 cursor-pointer border ${
                    selectedStatusFilter === st.value
                      ? `${st.bg} ${st.color} border-current font-black ring-1 ring-amber-400 shadow`
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Floating Search Pill */}
            <div className="p-2.5 bg-slate-950/70 border-b border-slate-800/40 z-20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อโรงงาน, ถนน, หรือเบอร์โทร..."
                  className="w-full pl-8 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Fullscreen Map Container */}
            <div className="flex-1 w-full h-[calc(100dvh-200px)] min-h-[420px] relative">
              <FactoryMap
                leads={filteredLeads}
                userLocation={userLocation}
                isLiveTracking={isLiveTracking}
                onToggleLiveTracking={() => setIsLiveTracking(!isLiveTracking)}
                selectedDistrict={selectedDistrict}
                onDistrictSelect={(d) => setSelectedDistrict(d)}
                selectedRadius={selectedRadius}
                onLeadClick={(lead) => setMobileSelectedLead(lead)}
              />
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 2: FACTORY DIRECTORY (FEED CARDS)         */}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'factories' && (
          <div className="flex-1 p-3.5 space-y-3 animate-in fade-in duration-150">
            {/* Search and Counts Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>รายชื่อโรงงาน ({filteredLeads.length})</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedDistrict === 'ALL' ? 'ทุกอำเภอ' : selectedDistrict}
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาโรงงาน..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Factory Feed List */}
            <div className="space-y-2.5">
              {filteredLeads.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">ไม่พบโรงงานที่ตรงกับเงื่อนไข</p>
                  <p className="text-[11px] text-slate-500">ลองเปลี่ยนคำค้นหาหรือเลือกอำเภออื่น</p>
                </div>
              ) : (
                filteredLeads.slice(0, 80).map((lead) => {
                  const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
                  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, '') : '';
                  const statusCfg = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

                  return (
                    <div
                      key={lead.id || lead.place_id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {lead.district || 'สมุทรปราการ'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label.split(' ')[0]}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                            📍 {dist < 1 ? `${Math.round(dist * 1000)} ม.` : `${dist.toFixed(1)} กม.`}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm leading-snug">{lead.name || lead.factory_name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{lead.address}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                        {cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>โทร</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="py-2 px-2 rounded-xl bg-slate-950 border border-slate-800/60 text-slate-600 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>ไม่มีเบอร์</span>
                          </button>
                        )}

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>นำทาง</span>
                        </a>

                        <button
                          onClick={() => setMobileSelectedLead(lead)}
                          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>บันทึก</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 3: TEAM HUB                               */}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'team' && (
          <div className="flex-1 p-3.5 space-y-4 animate-in fade-in duration-150">
            {/* Team Summary Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-black text-white text-base">{displayTeamName}</h3>
                  <p className="text-[11px] text-slate-400">
                    สาขา: {currentCompany?.branch || profile?.branch || 'สำนักงานใหญ่'} • สมาชิก {teamMembers.length} คน
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>เชิญสมาชิก</span>
                  </button>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setTeamTab('members')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    teamTab === 'members' ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  สมาชิก ({teamMembers.length})
                </button>
                <button
                  onClick={() => setTeamTab('pending')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    teamTab === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  คำเชิญรอ ({pendingInvitations.length})
                </button>
              </div>
            </div>

            {/* Roster Cards */}
            {teamTab === 'members' ? (
              <div className="space-y-2">
                {teamMembers.map((m) => {
                  const isThisOwner = m.role === 'owner' || (!m.role && m.id === currentCompany?.owner_id);
                  const isManager = m.role === 'manager';
                  return (
                    <div key={m.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={m.full_name || 'Member'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : isThisOwner ? (
                            <Crown className="w-4 h-4 text-amber-400" />
                          ) : (
                            m.full_name?.charAt(0) || '👤'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">{m.full_name || m.email?.split('@')[0]}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          isThisOwner ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isManager ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {isThisOwner ? 'Owner' : isManager ? 'Manager' : 'Sales'}
                        </span>
                        {isOwner && !isThisOwner && (
                          <button
                            onClick={() => handleRemoveMember(m.id, m.full_name || m.email)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingInvitations.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                    ไม่มีคำเชิญที่รอยืนยัน
                  </div>
                ) : (
                  pendingInvitations.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-white font-mono truncate">{inv.email}</div>
                        <div className="text-[10px] text-slate-400">ตำแหน่ง: <span className="text-amber-300 font-bold uppercase">{inv.role}</span></div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopySpecificInvite(inv.id)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-700"
                        >
                          {copiedInviteId === inv.id ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleCancelInvitation(inv.id, inv.email)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 4: PROFILE & SETTINGS                     */}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'profile' && (
          <div className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            {/* User Card */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden shrink-0 border border-amber-500/30">
                  {profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                    <img
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                      alt={profile?.full_name || 'Avatar'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.account_type === 'company' ? '🏢' : profile?.full_name?.charAt(0) || '👤'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{profile?.full_name || user?.email?.split('@')[0]}</h3>
                  <p className="text-xs text-slate-400 font-mono truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    profile?.role === 'owner' || !profile?.role ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {profile?.role === 'owner' || !profile?.role ? '👑 Owner' : profile?.role === 'manager' ? '👔 Manager' : '💼 Sales'}
                  </span>
                </div>
              </div>

              {/* Company Details */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>🏢 สังกัดบริษัท:</span>
                  <span className="font-bold text-amber-300">{displayTeamName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>สาขา:</span>
                  <span className="text-slate-300">{profile?.branch || 'สำนักงานใหญ่'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>เลขผู้เสียภาษี:</span>
                  <span className="font-mono text-slate-300">{profile?.tax_id || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>เบอร์โทร:</span>
                  <span className="font-mono text-slate-300">{profile?.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-profile-modal'));
                }}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between transition shadow-sm cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>ตั้งค่าข้อมูลโปรไฟล์ & สังกัด</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400/60" />
              </button>

              <Link
                href="/dev"
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-300 text-xs font-bold flex items-center justify-between transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>หน้า Dev QA Monitor & ภาพรวม</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <button
                onClick={async () => { await signOut(); }}
                className="w-full py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ (Sign Out)</span>
              </button>
            </div>
          </div>
        )}

        {/* Fixed Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={mobileTab}
          onSelectTab={(t) => setMobileTab(t)}
          factoryCount={filteredLeads.length}
        />

        {/* Mobile Slide-up Factory Bottom Sheet */}
        <MobileFactoryBottomSheet
          factory={mobileSelectedLead}
          onClose={() => setMobileSelectedLead(null)}
          userDistanceKm={
            mobileSelectedLead
              ? calculateDistanceKm(userLocation.lat, userLocation.lng, mobileSelectedLead.lat, mobileSelectedLead.lng)
              : null
          }
        />

      </div>

      {/* 4. Lead Detail & Notes Modal */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div
            onClick={() => setActiveLeadModal(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeLeadModal.district}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {activeLeadModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveLeadModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300">
              <p><strong className="text-slate-400">ที่อยู่:</strong> {activeLeadModal.address}</p>
              {activeLeadModal.phone && (
                <p><strong className="text-slate-400">เบอร์โทร:</strong> <a href={`tel:${activeLeadModal.phone}`} className="text-cyan-400 font-mono">{activeLeadModal.phone}</a></p>
              )}
              {activeLeadModal.email && (
                <p><strong className="text-slate-400">อีเมล:</strong> <span className="text-slate-200">{activeLeadModal.email}</span></p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <a
                href={activeLeadModal.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${activeLeadModal.lat},${activeLeadModal.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>นำทาง Google Maps</span>
              </a>

              <button
                onClick={() => setActiveLeadModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Add Team Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div
            onClick={() => setIsAddMemberModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">เชิญสมาชิกเข้าร่วมทีม</h3>
                <p className="text-xs text-slate-400">ส่งคำเชิญเพื่อดึงลูกทีมเข้าสังกัดบริษัท</p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTeamInvite} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">อีเมลของสมาชิก *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">ตำแหน่ง / สิทธิ์ (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('sales')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRole === 'sales'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>ทีมเซลส์ (Sales)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('manager')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRole === 'manager'
                        ? 'bg-purple-500 text-white shadow-md font-black'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>ผู้จัดการ (Manager)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingInvite ? 'กำลังส่งคำเชิญ...' : 'ส่งคำเชิญ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Universal Auth & Onboarding Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
      <IdentityOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />
      <PendingInvitationModal />

    </div>
  );
}
