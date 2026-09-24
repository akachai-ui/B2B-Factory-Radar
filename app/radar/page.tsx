'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FactoryLead, UserProfile, TeamInvitation, LeadStatus, DBDCompany, CompanyLead, VehicleTrip } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { IdentityOnboardingModal } from '@/components/IdentityOnboardingModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { PendingInvitationModal } from '@/components/PendingInvitationModal';
import { MobileBottomNav, MobileTab } from '@/components/MobileBottomNav';
import { MobileFactoryBottomSheet } from '@/components/MobileFactoryBottomSheet';
import { DBDCompanyExplorer } from '@/components/DBDCompanyExplorer';
import { LeadCRMModal } from '@/components/LeadCRMModal';
import { ReleaseLeadModal } from '@/components/ReleaseLeadModal';
import { VehicleTripModal } from '@/components/VehicleTripModal';
import { MileageFuelReportModal } from '@/components/MileageFuelReportModal';
import { AccessLockModal } from '@/components/AccessLockModal';
import { PlasticMarketIntelligence } from '@/components/PlasticMarketIntelligence';
import { calculateContactHealth, getLeadLastContactDate, maskCompanyName, maskAddress } from '@/lib/leadUtils';
import defaultLeadsData from '@/public/leads_data.json';
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
  Gauge,
  Fuel,
  Car,
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
  Plus,
  PlusCircle,
  History,
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
  ShoppingCart,
  UserCheck,
  Target,
  TrendingUp,
  DollarSign,
  Wallet,
  FolderKanban,
  ArrowLeft,
  Store,
  Inbox,
  UserX,
  UserMinus,
  Square,
  ArrowRightLeft,
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

import type { FactoryMapProps } from '@/components/FactoryMap';

// Dynamically import Leaflet Map (SSR Disabled)
const FactoryMap = dynamic<FactoryMapProps>(
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
    isSuperAdmin,
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

  // Main Navigation Modes
  const [mainTab, setMainTab] = useState<'portfolio' | 'market' | 'marketplace' | 'team' | 'mileage'>('portfolio');
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<'factories' | 'market'>('factories');
  const [portfolioViewMode, setPortfolioViewMode] = useState<'map' | 'table'>('map');
  const [portfolioScope, setPortfolioScope] = useState<'my' | 'all'>('my');
  const [portfolioStatusFilter, setPortfolioStatusFilter] = useState<string>('ALL');
  const [portfolioStaleFilter, setPortfolioStaleFilter] = useState<'ALL' | 'ACTIVE' | 'STALE' | 'CRITICAL'>('ALL');
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');

  // Mobile App Shell States (When on smartphone)
  const [mobileTab, setMobileTab] = useState<MobileTab>('portfolio');
  const [mobileSelectedLead, setMobileSelectedLead] = useState<FactoryLead | null>(null);
  const [mobileMarketplaceViewMode, setMobileMarketplaceViewMode] = useState<'map' | 'list'>('map');

  // Raw Global Master Catalog Leads & Filters (for Marketplace Factory Radar)
  const [leads, setLeads] = useState<FactoryLead[]>((defaultLeadsData as unknown as FactoryLead[]) || []);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSalesRepFilter, setSelectedSalesRepFilter] = useState<string>('ALL');

  // Selected Factory Lead Modal (for Raw Marketplace Lead)
  const [activeLeadModal, setActiveLeadModal] = useState<FactoryLead | null>(null);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);

  // Current Company & Feedback
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Effective Company ID & Role flags
  const effectiveCompanyId = profile?.company_id || currentCompany?.id || profile?.id || user?.id;
  const isCompany = true;
  const isOwner = profile?.role === 'owner' || (user?.id && currentCompany?.owner_id && user.id === currentCompany.owner_id) || !profile?.role;
  const isManager = profile?.role === 'manager';
  const canViewAllTeamLeads = isOwner || isManager;
  const displayTeamName = currentCompany?.name || profile?.company_name || `ทีมของ ${profile?.full_name || 'ฉัน'}`;
  const currentUserAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  // Team Data States
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  // Pro / Freemium Access Control & Preview Mode Gate (Inherits from Super Admin or Company Owner if approved)
  const companyOwnerMember = teamMembers.find((m) => m.role === 'owner' || (currentCompany?.owner_id && m.id === currentCompany.owner_id));
  const isCompanyOwnerUnlocked = companyOwnerMember?.access_status === 'PRO_UNLOCKED';
  const isProUnlocked = isSuperAdmin || profile?.access_status === 'PRO_UNLOCKED' || !!isCompanyOwnerUnlocked;
  const isPreviewMode = !isProUnlocked;
  const [isAccessLockModalOpen, setIsAccessLockModalOpen] = useState(false);
  const [accessLockFeatureName, setAccessLockFeatureName] = useState('ฟังก์ชันพิเศษ Pro');

  const requireProAccess = (featureName: string): boolean => {
    if (isProUnlocked) return true;
    setAccessLockFeatureName(featureName);
    setIsAccessLockModalOpen(true);
    return false;
  };

  const maskPhoneNumber = (phone?: string | null): string => {
    if (!phone || phone === '-') return '-';
    if (isProUnlocked) return phone;
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 9) {
      return `${cleaned.slice(0, 3)}-***-${cleaned.slice(-4)}`;
    }
    return phone.slice(0, 3) + '***' + (phone.length > 5 ? phone.slice(-2) : '');
  };

  const maskEmail = (email?: string | null): string => {
    if (!email || email === '-') return '-';
    if (isProUnlocked) return email;
    const parts = email.split('@');
    if (parts.length === 2) {
      return `***@${parts[1]}`;
    }
    return '***@***.com';
  };

  // Portfolio Leads (Active Pipeline claimed by sales rep/tenant)
  const [portfolioLeads, setPortfolioLeads] = useState<CompanyLead[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [selectedPortfolioLead, setSelectedPortfolioLead] = useState<CompanyLead | null>(null);
  const [portfolioNotesInput, setPortfolioNotesInput] = useState<string>('');
  const [portfolioDealValueInput, setPortfolioDealValueInput] = useState<string>('');
  const [portfolioStatusInput, setPortfolioStatusInput] = useState<LeadStatus>('NEW');
  const [portfolioPriorityInput, setPortfolioPriorityInput] = useState<string>('MEDIUM');
  const [isSavingPortfolioLead, setIsSavingPortfolioLead] = useState<boolean>(false);
  const [activityTimelineLead, setActivityTimelineLead] = useState<CompanyLead | null>(null);

  // Claimed leads map for company portfolio
  const [claimedFactoryMap, setClaimedFactoryMap] = useState<Record<string, { user_id: string; claimed_by_name: string; avatar_url?: string | null; status?: string }>>({});
  const [isClaimingLead, setIsClaimingLead] = useState<boolean>(false);

  // Vehicle Trip & Mileage States
  const [activeTrip, setActiveTrip] = useState<VehicleTrip | null>(null);
  const [userTrips, setUserTrips] = useState<VehicleTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(false);
  const [isVehicleTripModalOpen, setIsVehicleTripModalOpen] = useState(false);
  const [isFuelReportModalOpen, setIsFuelReportModalOpen] = useState(false);
  const [tripModalMode, setTripModalMode] = useState<'start' | 'end' | 'history' | 'active'>('active');

  const openTripModal = (mode: 'start' | 'end' | 'history' | 'active' = 'active') => {
    if (!requireProAccess('บันทึกทริปและไมล์รถ (Vehicle Logbook)')) return;
    setTripModalMode(mode);
    setIsVehicleTripModalOpen(true);
  };

  const openFuelReportModal = () => {
    if (!requireProAccess('สรุปรายงานค่าน้ำมันและภาษี (Fuel Expense Report)')) return;
    setIsFuelReportModalOpen(true);
  };

  const fetchActiveTrip = useCallback(async () => {
    if (!user?.id) {
      setActiveTrip(null);
      setUserTrips([]);
      return;
    }
    setIsLoadingTrips(true);
    try {
      const res = await fetch(`/api/trips?user_id=${user.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.trips)) {
        setUserTrips(data.trips);
        const active = data.trips.find((t: VehicleTrip) => t.status === 'in_progress') || null;
        setActiveTrip(active);
      } else {
        setUserTrips([]);
        setActiveTrip(null);
      }
    } catch (err) {
      console.warn('Failed to load active trip and user trips:', err);
    } finally {
      setIsLoadingTrips(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    fetchActiveTrip();

    // Setup Supabase Realtime Subscription for instant status updates (Approvals, Stops, Trips)
    const tripChannel = supabase
      .channel('radar_trips_realtime_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_trips',
        },
        () => {
          fetchActiveTrip();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_checkins',
        },
        () => {
          fetchActiveTrip();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripChannel);
    };
  }, [user, fetchActiveTrip]);

  // Monthly Trip & Mileage Stats calculation
  const monthlyTripStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthTrips = userTrips.filter((t) => {
      const tripDate = t.trip_date ? new Date(t.trip_date) : (t.created_at ? new Date(t.created_at) : new Date());
      return tripDate.getFullYear() === currentYear && tripDate.getMonth() === currentMonth;
    });

    const totalKm = thisMonthTrips.reduce((acc, t) => acc + (Number(t.total_route_km) || 0), 0);
    const totalClaim = thisMonthTrips.reduce((acc, t) => {
      const km = Number(t.total_route_km) || 0;
      const rate = Number(t.fuel_rate_per_km) || 5.0;
      const claim = (t.total_fuel_amount !== undefined && t.total_fuel_amount !== null) ? Number(t.total_fuel_amount) : km * rate;
      return acc + claim;
    }, 0);
    const approvedCount = thisMonthTrips.filter((t) => t.status === 'approved').length;
    const pendingCount = thisMonthTrips.filter((t) => t.status === 'completed').length;
    const checkinCount = thisMonthTrips.reduce((acc, t) => acc + (t.checkins?.length || 0), 0);

    return {
      tripsCount: thisMonthTrips.length,
      totalKm,
      totalClaim,
      approvedCount,
      pendingCount,
      checkinCount,
    };
  }, [userTrips]);


  // Fetch Portfolio Leads from PostgreSQL
  const fetchPortfolio = useCallback(async () => {
    if (!effectiveCompanyId) return;
    setIsLoadingPortfolio(true);
    try {
      const isSalesOnly = profile?.role === 'sales' && !isOwner;
      const effectiveScope = isSalesOnly ? 'my' : portfolioScope;
      const userParam = (effectiveScope === 'my' && user?.id) ? `&user_id=${user.id}` : '';
      const res = await fetch(`/api/portfolio?company_id=${effectiveCompanyId}${userParam}`);
      const data = await res.json();
      if (data.success && data.leads) {
        setPortfolioLeads(data.leads as CompanyLead[]);
      }
    } catch (err) {
      console.warn('Fetch portfolio error:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [effectiveCompanyId, portfolioScope, user?.id, profile?.role, isOwner]);

  useEffect(() => {
    if (user && effectiveCompanyId) {
      fetchPortfolio();
    }
  }, [user, effectiveCompanyId, fetchPortfolio]);

  // Load claimed IDs for current company
  const loadClaimedFactoryIds = useCallback(async () => {
    if (!effectiveCompanyId) return;
    try {
      const res = await fetch(`/api/portfolio/claimed-ids?company_id=${effectiveCompanyId}`);
      const data = await res.json();
      if (data.success && data.claimed_map) {
        setClaimedFactoryMap(data.claimed_map);
      }
    } catch (err) {
      console.warn('Failed to load claimed IDs:', err);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    loadClaimedFactoryIds();
  }, [loadClaimedFactoryIds]);

  // Handle claiming Factory Lead (Maps 989) into company_leads
  const handleClaimFactoryLead = async (lead: FactoryLead) => {
    if (!requireProAccess('หยิบลูกค้าเข้าพอร์ตและระบบ CRM')) {
      return;
    }
    if (!effectiveCompanyId || !user?.id) {
      setFeedback({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนหยิบลูกค้าเข้าพอร์ต' });
      return;
    }
    setIsClaimingLead(true);
    try {
      const res = await fetch('/api/portfolio/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: effectiveCompanyId,
          user_id: user.id,
          source_type: 'factory_radar',
          lead_id: lead.id,
          place_id: lead.place_id,
          company_name: lead.name || lead.company_name,
          address: lead.address,
          district: lead.district,
          subdistrict: lead.subdistrict,
          province: lead.province || 'สมุทรปราการ',
          postal_code: lead.postal_code,
          lat: lead.lat,
          lng: lead.lng,
          phone: lead.phone,
          website: lead.website,
          notes: lead.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClaimedFactoryMap((prev) => ({
          ...prev,
          [`lead_${lead.id}`]: { user_id: user.id, claimed_by_name: profile?.full_name || 'ตัวคุณ' },
        }));
        setFeedback({ type: 'success', text: `🎉 หยิบ "${lead.name}" เข้าพอร์ตของคุณเรียบร้อยแล้ว!` });
        loadClaimedFactoryIds();
        fetchPortfolio();
      } else if (data.already_claimed) {
        setFeedback({ type: 'error', text: data.message });
      } else {
        setFeedback({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการนำเข้าพอร์ต' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsClaimingLead(false);
    }
  };

  // Update Portfolio Lead CRM status/notes/deal value
  const handleUpdatePortfolioLead = async (leadId: string, updates: Partial<CompanyLead>) => {
    if (!requireProAccess('อัปเดตสถานะและข้อมูลในพอร์ต CRM')) {
      return;
    }
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          company_id: effectiveCompanyId,
          ...updates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPortfolioLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, ...updates, updated_at: new Date().toISOString() } : l))
        );
        if (selectedPortfolioLead && selectedPortfolioLead.id === leadId) {
          setSelectedPortfolioLead((prev) => (prev ? { ...prev, ...updates } : null));
        }
        setFeedback({ type: 'success', text: 'อัปเดตสถานะงานขายเรียบร้อย' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการอัปเดต' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // Release Lead State & Handlers (Model 1: Release with mandatory reason to Company Unassigned Pool)
  const [releaseModalLead, setReleaseModalLead] = useState<CompanyLead | null>(null);

  const handleReleasePortfolioLead = (leadId: string, companyName?: string) => {
    const targetLead =
      portfolioLeads.find((l) => l.id === leadId) ||
      unassignedLeads.find((l) => l.id === leadId) ||
      (selectedPortfolioLead?.id === leadId ? selectedPortfolioLead : null);

    if (targetLead) {
      setReleaseModalLead(targetLead);
    } else {
      setReleaseModalLead({
        id: leadId,
        company_id: effectiveCompanyId || '',
        company_name: companyName || 'ลูกค้ารายนี้',
        status: 'NEW',
      } as CompanyLead);
    }
  };

  const handleConfirmReleaseLead = async ({
    reasonKey,
    reasonLabel,
    note,
  }: {
    reasonKey: string;
    reasonLabel: string;
    note: string;
  }) => {
    if (!releaseModalLead || !effectiveCompanyId) return;
    const leadId = releaseModalLead.id;
    const companyName = releaseModalLead.company_name;

    const res = await fetch(
      `/api/portfolio?id=${leadId}&company_id=${effectiveCompanyId}&user_id=${user?.id || ''}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason_key: reasonKey,
          reason_label: reasonLabel,
          note: note,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งคืนคลังกลาง');
    }

    setPortfolioLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedPortfolioLead(null);
    setReleaseModalLead(null);
    fetchUnassignedLeads();
    fetchPortfolio();
    loadClaimedFactoryIds();
    setFeedback({
      type: 'success',
      text: `ย้าย "${companyName}" เข้าสู่คลังลูกค้ารอจัดสรรเรียบร้อยแล้ว (เหตุผล: ${reasonLabel})`,
    });
  };

  // Permanent Remove from Company (returns factory to open DBD market) - Owner/Manager only
  const handlePermanentRemoveLead = async (leadId: string, companyName: string) => {
    if (!isOwner && profile?.role !== 'manager') {
      setFeedback({ type: 'error', text: 'เฉพาะเจ้าของทีมหรือผู้จัดการเท่านั้นที่มีสิทธิ์ถอนการจอง' });
      return;
    }
    if (!confirm(`คุณต้องการถอนการจอง "${companyName}" ใช่หรือไม่?\n\n⚠️ คำเตือน: ข้อมูลลูกค้าและประวัติการดูแลจะถูกลบออกจากบริษัท และโรงงานนี้จะกลับไปว่างในหน้าค้นหาตลาดกลาง`)) {
      return;
    }
    try {
      const res = await fetch(`/api/portfolio?id=${leadId}&company_id=${effectiveCompanyId}&mode=permanent`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUnassignedIds((prev) => prev.filter((id) => id !== leadId));
        fetchUnassignedLeads();
        fetchPortfolio();
        loadClaimedFactoryIds();
        setFeedback({ type: 'success', text: `ถอนการจอง "${companyName}" คืนสู่ศูนย์รวมข้อมูลเรียบร้อยแล้ว` });
      } else {
        setFeedback({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // Open Portfolio Detail Modal
  const handleOpenPortfolioDetail = (lead: CompanyLead) => {
    setSelectedPortfolioLead(lead);
    setPortfolioNotesInput(lead.notes || '');
    setPortfolioDealValueInput(lead.deal_value ? String(lead.deal_value) : '');
    setPortfolioStatusInput((lead.status as LeadStatus) || 'NEW');
    setPortfolioPriorityInput(lead.priority || 'MEDIUM');
  };

  // Save changes from Portfolio Detail Modal
  const handleSavePortfolioModal = async () => {
    if (!selectedPortfolioLead) return;
    setIsSavingPortfolioLead(true);
    try {
      await handleUpdatePortfolioLead(selectedPortfolioLead.id, {
        deal_value: portfolioDealValueInput ? Number(portfolioDealValueInput) : 0,
        status: portfolioStatusInput,
        priority: portfolioPriorityInput,
      });
      setSelectedPortfolioLead(null);
    } finally {
      setIsSavingPortfolioLead(false);
    }
  };

  // Auth & Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Team Data States
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [teamTab, setTeamTab] = useState<'members' | 'unassigned' | 'pending'>('members');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [unassignedLeads, setUnassignedLeads] = useState<CompanyLead[]>([]);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState<boolean>(false);
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([]);
  const [targetAssigneeId, setTargetAssigneeId] = useState<string>('');
  const [isBatchAssigning, setIsBatchAssigning] = useState<boolean>(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const activeMembers = useMemo(() => teamMembers.filter((m) => m.status !== 'inactive'), [teamMembers]);
  const inactiveMembers = useMemo(() => teamMembers.filter((m) => m.status === 'inactive'), [teamMembers]);

  // Add Member Form
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'sales' | 'manager'>('sales');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Trigger Onboarding for First-Time Users
  useEffect(() => {
    if (user && profile && profile.onboarded !== true) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [user, profile]);

  // Handle URL OAuth Errors gracefully
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (errorParam) {
      console.warn('OAuth redirect notice:', errorParam);
      setAuthError('เซสชันการเข้าสู่ระบบหมดอายุ หรือถูกยกเลิก กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง');
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


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

  // Auto-detect User Location for Distance Calculations (Client-side)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          label: '📍 ตำแหน่งของฉัน',
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.warn('Geolocation detection error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // 1. Fetch Target Factory Leads (Multi-Tier Bulletproof Fallback)
  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      // Tier 1: Try Backend API
      const res = await fetch('/api/leads?limit=5000').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads as FactoryLead[]);
          return;
        }
      }

      // Tier 2: Try Direct Supabase SDK
      const { data: sbLeads, error } = await supabase.from('leads').select('*').limit(2000);
      if (!error && sbLeads && sbLeads.length > 0) {
        setLeads(sbLeads as FactoryLead[]);
        return;
      }

      // Tier 3: Static Bundle Fallback (100% Reliable Offline & Fast)
      const fallbackRes = await fetch('/leads_data.json').catch(() => null);
      if (fallbackRes && fallbackRes.ok) {
        const json = await fallbackRes.json();
        if (Array.isArray(json) && json.length > 0) {
          setLeads(json as FactoryLead[]);
          return;
        }
      }
    } catch (err) {
      console.warn('Fetch target leads error, using static bundle:', err);
      try {
        const fallbackRes = await fetch('/leads_data.json');
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (Array.isArray(json) && json.length > 0) {
            setLeads(json as FactoryLead[]);
          }
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
      try {
        const teamRes = await fetch(`/api/team?companyId=${searchId}`);
        const teamJson = await teamRes.json();
        if (teamJson.success && teamJson.members) {
          setTeamMembers(teamJson.members as UserProfile[]);
        } else {
          const { data: membersData } = await supabase
            .from('profiles')
            .select('*')
            .or(`company_id.eq.${searchId},id.eq.${searchId}`)
            .order('created_at', { ascending: true });
          if (membersData) setTeamMembers(membersData as UserProfile[]);
        }
      } catch (e) {
        const { data: membersData } = await supabase
          .from('profiles')
          .select('*')
          .or(`company_id.eq.${searchId},id.eq.${searchId}`)
          .order('created_at', { ascending: true });
        if (membersData) setTeamMembers(membersData as UserProfile[]);
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

  // 3. Fetch Unassigned Leads Pool (Leads without assigned sales rep)
  const fetchUnassignedLeads = useCallback(async () => {
    if (!effectiveCompanyId) return;
    setIsLoadingUnassigned(true);
    try {
      const res = await fetch(`/api/portfolio?company_id=${effectiveCompanyId}&user_id=UNASSIGNED`);
      const data = await res.json();
      if (data.success && data.leads) {
        setUnassignedLeads(data.leads as CompanyLead[]);
      }
    } catch (err) {
      console.warn('Fetch unassigned leads warning:', err);
    } finally {
      setIsLoadingUnassigned(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    fetchLeads();
  }, []);

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

  useEffect(() => {
    if (user && effectiveCompanyId) {
      fetchUnassignedLeads();
    }
  }, [user, effectiveCompanyId, fetchUnassignedLeads]);

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

  // Filtered Portfolio Leads
  const filteredPortfolioLeads = useMemo(() => {
    return portfolioLeads.filter((lead) => {
      if (portfolioStatusFilter !== 'ALL') {
        if ((portfolioStatusFilter as string) === 'IN_PROGRESS') {
          if (!['CONTACTED', 'MEETING', 'QUOTED'].includes(lead.status)) return false;
        } else if (lead.status !== portfolioStatusFilter) {
          return false;
        }
      }
      
      // Inactive / Stale Days Filter
      if (portfolioStaleFilter !== 'ALL') {
        const lastContactDate = getLeadLastContactDate(lead);
        const health = calculateContactHealth(lastContactDate);
        if (portfolioStaleFilter === 'ACTIVE' && health.isStale) return false;
        if (portfolioStaleFilter === 'STALE' && (!health.isStale || health.isCritical)) return false;
        if (portfolioStaleFilter === 'CRITICAL' && !health.isCritical) return false;
      }

      if (portfolioSearch.trim()) {
        const q = portfolioSearch.toLowerCase();
        const matchName = lead.company_name?.toLowerCase().includes(q);
        const matchAddress = lead.address?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.includes(q);
        const matchNotes = lead.notes?.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchPhone && !matchNotes) return false;
      }
      return true;
    });
  }, [portfolioLeads, portfolioStatusFilter, portfolioStaleFilter, portfolioSearch]);

  // Pipeline CRM Stats
  const pipelineStats = useMemo(() => {
    const total = portfolioLeads.length;
    const newCount = portfolioLeads.filter((l) => l.status === 'NEW').length;
    const contactedCount = portfolioLeads.filter((l) => l.status === 'CONTACTED').length;
    const meetingCount = portfolioLeads.filter((l) => l.status === 'MEETING').length;
    const quotedCount = portfolioLeads.filter((l) => l.status === 'QUOTED').length;
    const wonCount = portfolioLeads.filter((l) => l.status === 'WON').length;
    const lostCount = portfolioLeads.filter((l) => l.status === 'LOST').length;
    const totalDealValue = portfolioLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
    return { total, newCount, contactedCount, meetingCount, quotedCount, wonCount, lostCount, totalDealValue };
  }, [portfolioLeads]);

  // Mapped Portfolio Leads for Radar Map
  const mappedPortfolioForMap: FactoryLead[] = useMemo(() => {
    return filteredPortfolioLeads.map((cl) => ({
      id: cl.id,
      place_id: cl.place_id || `cl_${cl.id}`,
      name: cl.company_name,
      company_name: cl.company_name,
      address: cl.address || `${cl.subdistrict || ''} ${cl.district || ''} ${cl.province || ''}`.trim(),
      district: cl.district || 'สมุทรปราการ',
      subdistrict: cl.subdistrict || '',
      province: cl.province || 'สมุทรปราการ',
      postal_code: cl.postal_code || '',
      lat: Number(cl.lat) || 13.6062,
      lng: Number(cl.lng) || 100.6974,
      phone: cl.phone || '',
      website: cl.website || '',
      status: cl.status as LeadStatus,
      sales_rep: cl.sales_rep_name || (cl.user_id === user?.id ? (profile?.full_name || 'คุณ') : 'เซลส์ในทีม'),
      sales_rep_avatar: cl.sales_rep_avatar || (cl.user_id === user?.id ? currentUserAvatar : null),
      notes: cl.notes || '',
      deal_value: cl.deal_value || 0,
      priority: cl.priority || 'MEDIUM',
      source_type: cl.source_type,
      tax_id: cl.tax_id,
      registered_capital: cl.registered_capital,
    }));
  }, [filteredPortfolioLeads, user?.id, profile?.full_name, currentUserAvatar]);

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
        const matchName = lead.name?.toLowerCase().includes(q) || lead.company_name?.toLowerCase().includes(q);
        const matchAddr = lead.address?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        const matchSub = lead.subdistrict?.toLowerCase().includes(q) || lead.district?.toLowerCase().includes(q) || lead.province?.toLowerCase().includes(q);
        const matchMaterials = (lead as any).raw_materials_needed?.toLowerCase().includes(q);
        const matchCategory = (lead as any).target_group_label?.toLowerCase().includes(q) || (lead as any).category?.toLowerCase().includes(q);
        const matchTsic = (lead as any).tsic_code?.toLowerCase().includes(q);
        const matchObj = (lead as any).objective?.toLowerCase().includes(q);
        const matchNotes = lead.notes?.toLowerCase().includes(q);
        const matchSales = lead.sales_rep?.toLowerCase().includes(q);
        if (!matchName && !matchAddr && !matchPhone && !matchSub && !matchMaterials && !matchCategory && !matchTsic && !matchObj && !matchNotes && !matchSales) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedDistrict, selectedRadius, selectedStatusFilter, selectedSalesRepFilter, searchQuery, userLocation]);

  // Enriched Filtered Leads with Account Manager / Sales Rep Avatar from claimedFactoryMap
  const enrichedFilteredLeads: FactoryLead[] = useMemo(() => {
    return filteredLeads.map((lead) => {
      const claimInfo = claimedFactoryMap[`lead_${lead.id}`];
      if (claimInfo) {
        return {
          ...lead,
          sales_rep: claimInfo.user_id === user?.id ? (profile?.full_name || 'คุณ') : claimInfo.claimed_by_name,
          sales_rep_avatar: claimInfo.user_id === user?.id ? (currentUserAvatar || claimInfo.avatar_url) : claimInfo.avatar_url,
          status: (claimInfo.status as LeadStatus) || lead.status || 'NEW',
          is_claimed: true,
          claimed_by_user_id: claimInfo.user_id,
        };
      }
      return lead;
    });
  }, [filteredLeads, claimedFactoryMap, user?.id, profile?.full_name, currentUserAvatar]);

  // Update Lead Status or Sales Rep
  const handleUpdateLead = async (leadId: string | number, updates: Partial<FactoryLead>) => {
    if (!requireProAccess('อัปเดตสถานะและข้อมูลลูกค้า')) {
      return;
    }
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
    if (!requireProAccess('ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx)')) {
      return;
    }
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

      // 1. Ensure company row exists in public.companies to satisfy foreign key constraint
      try {
        await supabase.from('companies').upsert({
          id: effectiveCompanyId,
          name: currentCompany?.name || profile?.company_name || displayTeamName || 'บริษัทของฉัน',
          tax_id: profile?.tax_id || null,
          branch: profile?.branch || 'สำนักงานใหญ่',
          owner_id: user?.id,
        }, { onConflict: 'id' });
      } catch (compErr) {
        console.warn('Upsert company error:', compErr);
      }

      // 2. Create Invite and Dispatch Email via Server API Route
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
          inviterUserId: user?.id,
        }),
      });

      const mailJson = await mailRes.json();
      if (!mailRes.ok || !mailJson.success) {
        throw new Error(mailJson.error || 'เกิดข้อผิดพลาดในการสร้างคำเชิญ');
      }

      const isEmailDispatched = Boolean(mailJson?.emailSent);

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
      const defaultNewTeamName = `ทีมของ ${memberName || 'ฉัน'}`;
      try {
        await supabase.from('companies').upsert({
          id: memberId,
          name: defaultNewTeamName,
          branch: 'สำนักงานใหญ่',
          owner_id: memberId,
        }, { onConflict: 'id' });
      } catch (cErr) {}

      await supabase
        .from('profiles')
        .update({
          company_id: memberId,
          company_name: defaultNewTeamName,
          role: 'owner',
          account_type: 'company',
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);
      setFeedback({ type: 'success', text: `นำ ${memberName} ออกจากทีมเรียบร้อย` });
      await fetchTeam();
      await fetchUnassignedLeads();
      await fetchPortfolio();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // Toggle Member Status (Active vs Inactive / ลาออก)
  const handleToggleMemberStatus = async (member: UserProfile, newStatus: 'active' | 'inactive') => {
    if (!isOwner) {
      setFeedback({ type: 'error', text: 'คุณไม่มีสิทธิ์เปลี่ยนสถานะสมาชิก (เฉพาะเจ้าของทีม / Owner เท่านั้น)' });
      return;
    }
    const confirmMsg =
      newStatus === 'inactive'
        ? `คุณต้องการปรับสถานะเป็น "Inactive (ลาออก/ปิดใช้งาน)" สำหรับ "${member.full_name || member.email}" ใช่หรือไม่?\n\n• ข้อมูลประวัติการโทร & ทริปเลขไมล์ยังคงถูกเก็บรักษา 100%\n• รายชื่อลูกค้าในพอร์ตของเซลส์ท่านนี้จะถูกส่งคืนเข้าสู่ "📥 คลังลูกค้ารอจัดสรร" อัตโนมัติ เพื่อให้หัวหน้าทีมมอบหมายต่อ`
        : `คุณต้องการเปิดใช้งาน (Active) บัญชีของคุณ "${member.full_name || member.email}" อีกครั้งใช่หรือไม่?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          companyId: effectiveCompanyId,
          status: newStatus,
          action: 'toggle_status',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการปรับสถานะ');
      }
      setFeedback({ type: 'success', text: data.message || `ปรับสถานะสำเร็จ` });
      await fetchTeam();
      await fetchUnassignedLeads();
      await fetchPortfolio();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' });
    }
  };

  // Batch Assign Leads from Pool to Sales Rep
  const handleBatchAssignLeads = async (customLeadIds?: string[], customTargetId?: string) => {
    if (!effectiveCompanyId) return;
    const leadsToAssign = customLeadIds || selectedUnassignedIds;
    const assignee = customTargetId || targetAssigneeId;

    if (leadsToAssign.length === 0) {
      setFeedback({ type: 'error', text: 'กรุณาเลือกรายชื่อโรงงานอย่างน้อย 1 รายการ' });
      return;
    }
    if (!assignee) {
      setFeedback({ type: 'error', text: 'กรุณาเลือกเซลส์ที่ต้องการส่งมอบงาน' });
      return;
    }

    setIsBatchAssigning(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_assign',
          company_id: effectiveCompanyId,
          lead_ids: leadsToAssign,
          target_user_id: assignee,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'มอบหมายงานไม่สำเร็จ');
      }
      setFeedback({ type: 'success', text: data.message || `มอบหมายลูกค้าเรียบร้อยแล้ว` });
      setSelectedUnassignedIds([]);
      await fetchUnassignedLeads();
      await fetchPortfolio();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการมอบหมายงาน' });
    } finally {
      setIsBatchAssigning(false);
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
  // 2.5 DEACTIVATED / INACTIVE EMPLOYEE SCREEN
  // ----------------------------------------------------
  if (profile?.status === 'inactive' && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full backdrop-blur-2xl bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <UserX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase inline-block">
              สถานะ: บัญชีถูกปิดใช้งาน (Inactive)
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              บัญชีของคุณถูกระงับการใช้งานชั่วคราว
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              สิทธิ์การเข้าถึงข้อมูลและการดูแลลูกค้าในสังกัด <strong className="text-slate-200">{profile.company_name || 'บริษัท'}</strong> ถูกส่งคืนเข้าสู่คลังกลางเรียบร้อยแล้ว
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>ชื่อผู้ใช้:</span>
              <strong className="text-white">{profile.full_name || profile.email}</strong>
            </div>
            <div className="flex justify-between">
              <span>อีเมล:</span>
              <span className="font-mono text-slate-300">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span>สังกัด:</span>
              <span className="text-amber-300">{profile.company_name || '-'}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            หากมีข้อสงสัยหรือต้องการเปิดใช้งานบัญชีอีกครั้ง กรุณาติดต่อหัวหน้าทีมหรือผู้ดูแลระบบ (Owner)
          </p>

          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ (Sign Out)</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. MAIN APPLICATION WORKSPACE (WHEN LOGGED IN)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans relative">
      
      {/* 🔮 3D Ambient Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ==================================================== */}
      {/* 1. DESKTOP WORKSPACE VIEW (HIDDEN ON MOBILE SCREENS) */}
      {/* ==================================================== */}
      <div className="hidden sm:flex flex-col flex-1">
        {/* App Navigation Bar */}
        <Navbar onOpenAuth={(mode: 'signin' | 'signup' = 'signin') => { setAuthModalMode(mode); setIsAuthModalOpen(true); }} />

        {/* Top Banner / System Status Header (3D Glass Panel) */}
        <div className="backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] via-slate-950/80 to-slate-950/95 border-b border-white/10 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              
              {/* Title & Info */}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight flex items-center gap-2">
                    {mainTab === 'portfolio' && (
                      <>
                        <Target className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                        <span>พอร์ตงานขายของฉัน</span>
                      </>
                    )}
                    {mainTab === 'market' && (
                      <>
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                        <span>วิเคราะห์ตลาดเม็ดพลาสติก</span>
                      </>
                    )}
                    {mainTab === 'marketplace' && (
                      <>
                        <Store className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                        <span>ตลาดช้อปปิ้งหาลูกค้า</span>
                      </>
                    )}
                    {mainTab === 'team' && (
                      <>
                        <Users className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                        <span>จัดการทีมงานขาย</span>
                      </>
                    )}
                    {mainTab === 'mileage' && (
                      <>
                        <Car className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                        <span>บันทึกไมล์ & เบิกค่าน้ำมัน</span>
                      </>
                    )}
                  </h1>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-md bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold font-mono shadow-sm truncate max-w-[200px]">
                    {displayTeamName}
                  </span>

                  {isPreviewMode ? (
                    <button
                      onClick={() => {
                        setAccessLockFeatureName('ปลดล็อกสิทธิ์สมาชิก Pro Full Access');
                        setIsAccessLockModalOpen(true);
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer animate-pulse"
                      title="บัญชีของคุณอยู่ในสถานะทดลองใช้งาน (Preview Mode) คลิกเพื่อติดต่อผู้ดูแลปลดล็อก Pro"
                    >
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Preview Mode (รออนุมัติ Pro)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>PRO UNLOCKED</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {mainTab === 'portfolio' && 'แดชบอร์ดติดตามลูกค้าในความดูแล วางแผนเส้นทางพบลูกค้า และอัปเดตสถานะ'}
                  {mainTab === 'market' && 'วิเคราะห์ขนาดตลาด ความต้องการเม็ดพลาสติก และทิศทางราคา Real-time'}
                  {mainTab === 'marketplace' && 'คลังข้อมูลโรงงานเป้าหมาย 989 แห่ง สำหรับหยิบเข้าพอร์ตงานขาย'}
                  {mainTab === 'team' && 'บริหารจัดการสมาชิกในทีมฝ่ายขายและกำหนดสิทธิ์'}
                  {mainTab === 'mileage' && 'ศูนย์บันทึกการเดินทางดิจิทัล ตรวจสอบเลขไมล์ GPS เช็คอิน และระบบอนุมัติเบิกจ่ายค่าน้ำมัน'}
                </p>
              </div>

              {/* Navigation Tabs Switcher (3D Glass Pill Container - No Scroll, Fits Cleanly) */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl backdrop-blur-xl bg-slate-950/80 border border-white/10 shadow-inner shrink-0">
                
                {/* 1. My Portfolio Tab */}
                <button
                  onClick={() => setMainTab('portfolio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    mainTab === 'portfolio'
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>พอร์ตของฉัน</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    mainTab === 'portfolio' ? 'bg-slate-950/80 text-amber-300 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {portfolioLeads.length}
                  </span>
                </button>

                {/* 2. Plastic Market Intelligence Tab */}
                <button
                  onClick={() => setMainTab('market')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    mainTab === 'market'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-300/40'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-500/20 backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>วิเคราะห์ตลาด</span>
                </button>

                {/* 3. Lead Marketplace Tab */}
                <button
                  onClick={() => setMainTab('marketplace')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    mainTab === 'marketplace'
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-black shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-300/40'
                      : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20 backdrop-blur-md bg-cyan-500/10 border border-cyan-500/30'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-cyan-300" />
                  <span>ช้อปหาลูกค้า</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-400 text-slate-950 font-black">
                    989
                  </span>
                </button>

                {/* 4. Mileage & Fuel Hub Tab */}
                <button
                  onClick={() => setMainTab('mileage')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    mainTab === 'mileage'
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300/40'
                      : activeTrip
                      ? 'text-emerald-300 hover:text-white hover:bg-emerald-500/20 backdrop-blur-md bg-emerald-500/15 border border-emerald-400/40 animate-pulse'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Car className={`w-3.5 h-3.5 ${activeTrip ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>บันทึกไมล์</span>
                  {activeTrip ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-amber-300 font-mono">
                      5฿/กม.
                    </span>
                  )}
                </button>

                {/* 5. Team Hub Tab */}
                <button
                  onClick={() => setMainTab('team')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    mainTab === 'team'
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-300/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>ทีมงาน</span>
                  {teamMembers.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-purple-300 font-mono">
                      {teamMembers.length}
                    </span>
                  )}
                </button>

                {/* 6. Quick Action: Fuel Audit Modal for Owner / Manager */}
                {canViewAllTeamLeads && (
                  <button
                    onClick={openFuelReportModal}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:text-white"
                    title="เปิดรายงานตรวจสอบค่าน้ำมัน (สำหรับฝ่ายบริหาร/บัญชี)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                    <span>รายงานเบิกจ่าย</span>
                  </button>
                )}

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
        {/* TAB 1: MY SALES PORTFOLIO CRM (DEFAULT MAIN VIEW)    */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Pipeline KPI Cards Row (3D Glass Tiles) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              {/* Total In Portfolio */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                  <span className="truncate pr-1">ลูกค้าในพอร์ต</span>
                  <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
                  {pipelineStats.total} <span className="text-xs font-normal text-slate-400">ราย</span>
                </div>
                <div className="text-[11px] text-amber-300 font-medium truncate">
                  {portfolioScope === 'my' ? 'พอร์ตส่วนตัวของคุณ' : 'รวมทั้งบริษัท'}
                </div>
              </div>

              {/* New Leads */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                  <span className="truncate pr-1">ลูกค้าใหม่ (ยังไม่ติดต่อ)</span>
                  <div className="h-6 w-6 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  {pipelineStats.newCount} <span className="text-xs font-normal text-slate-400">ราย</span>
                </div>
                <div className="text-[11px] text-cyan-300/90 truncate">พร้อมเริ่มติดต่อ</div>
              </div>

              {/* In Progress Pipeline */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:border-blue-400/40 transition-all duration-300 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                  <span className="truncate pr-1">กำลังติดตาม / เสนอราคา</span>
                  <div className="p-1.5 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)] shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                  {pipelineStats.contactedCount + pipelineStats.meetingCount + pipelineStats.quotedCount} <span className="text-xs font-normal text-slate-400">ราย</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  นัดพบ {pipelineStats.meetingCount} • ใบเสนอราคา {pipelineStats.quotedCount}
                </div>
              </div>

              {/* Closed Won */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.08] via-slate-900/60 to-slate-950/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:border-emerald-400/40 transition-all duration-300 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                  <span className="truncate pr-1">ปิดการขายสำเร็จ (Won)</span>
                  <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                  {pipelineStats.wonCount} <span className="text-xs font-normal text-slate-400">ราย</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium truncate">สำเร็จเรียบร้อย</div>
              </div>

              {/* Pipeline Deal Value */}
              <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-amber-500/15 via-slate-900/60 to-slate-950/80 border border-amber-400/30 shadow-[0_10px_30px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                  <span className="truncate pr-1">มูลค่าดีลรวมในพอร์ต</span>
                  <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 truncate font-mono">
                  ฿{pipelineStats.totalDealValue.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-300/90 truncate">Estimated Pipeline</div>
              </div>

            </div>

            {/* Portfolio Controls Bar (3D Glass Console) */}
            <div className="p-5 rounded-[2rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-3.5">
              
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Search in Portfolio */}
                <div className="flex-1 min-w-[240px] relative">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    placeholder="ค้นหาชื่อลูกค้า, ที่อยู่, เบอร์โทร หรือโน้ตในพอร์ต..."
                    className="w-full pl-10 pr-8 py-2.5 backdrop-blur-xl bg-slate-950/70 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition"
                  />
                  {portfolioSearch && (
                    <button onClick={() => setPortfolioSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
                  )}
                </div>

                {/* Scope Filter for Manager/Owner */}
                {canViewAllTeamLeads && (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => setPortfolioScope('my')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        portfolioScope === 'my'
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>พอร์ตของฉัน</span>
                    </button>
                    <button
                      onClick={() => setPortfolioScope('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        portfolioScope === 'all'
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>ลูกค้าทั้งบริษัท</span>
                    </button>
                  </div>
                )}

                {/* View Switcher: Map vs Table */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => setPortfolioViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      portfolioViewMode === 'map'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>แผนที่พอร์ต</span>
                  </button>
                  <button
                    onClick={() => setPortfolioViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      portfolioViewMode === 'table'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>ตาราง CRM ({filteredPortfolioLeads.length})</span>
                  </button>
                </div>

                {/* Direct CTA: Go to Lead Marketplace */}
                <button
                  onClick={() => setMainTab('marketplace')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ ช้อปปิ้งหาลูกค้าเพิ่ม</span>
                </button>

              </div>

              {/* Status & Inactive Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 px-1">สถานะ:</span>
                  <button
                    onClick={() => setPortfolioStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer ${
                      portfolioStatusFilter === 'ALL'
                        ? 'bg-slate-100 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ทั้งหมด ({portfolioLeads.length})
                  </button>
                  {STATUS_OPTIONS.map((st) => {
                    const count = portfolioLeads.filter((l) => l.status === st.value).length;
                    const isSelected = portfolioStatusFilter === st.value;
                    return (
                      <button
                        key={st.value}
                        onClick={() => setPortfolioStatusFilter(st.value)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? `${st.bg} ${st.color} font-black border`
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{st.label}</span>
                        <span className="px-1 rounded-full text-[9px] bg-slate-900 font-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Stale / Inactive Days Filter */}
                <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">⏳ ติดต่อ:</span>
                  <button
                    onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      portfolioStaleFilter === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    🟢 สม่ำเสมอ (&le;6 วัน)
                  </button>
                  <button
                    onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'STALE' ? 'ALL' : 'STALE')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      portfolioStaleFilter === 'STALE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    🟡 ขาดติดต่อ (&gt;7 วัน)
                  </button>
                  <button
                    onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      portfolioStaleFilter === 'CRITICAL'
                        ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/40 font-black animate-pulse'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    🔴 เสี่ยงหลุด (&gt;30 วัน)
                  </button>
                </div>
              </div>

            </div>

            {/* Empty State when Portfolio is Empty */}
            {portfolioLeads.length === 0 && !isLoadingPortfolio && (
              <div className="p-12 text-center rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4 max-w-2xl mx-auto my-6 animate-in zoom-in-95 duration-200">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">คุณยังไม่มีลูกค้าในพอร์ตงานขาย</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    ระบบเปิดให้คุณค้นหาโรงงานและบริษัททั่วประเทศกว่า 390,000+ แห่ง เข้าไปเลือกช้อปปิ้งลูกค้าที่ต้องการดูแล แล้วกดปุ่ม <strong>"🛒 หยิบใส่พอร์ต"</strong> ได้ทันที
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setMainTab('marketplace')}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>🛒 ไปช้อปปิ้งหาลูกค้าตอนนี้</span>
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio Map View */}
            {portfolioLeads.length > 0 && portfolioViewMode === 'map' && (
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                <FactoryMap
                  leads={mappedPortfolioForMap}
                  userLocation={userLocation}
                  selectedDistrict={selectedDistrict}
                  onDistrictSelect={(d: string) => setSelectedDistrict(d)}
                  selectedRadius={selectedRadius}
                  onSelectRadius={(r: string) => setSelectedRadius(r)}
                  onLeadClick={(lead: FactoryLead) => {
                    const originalPortfolioLead = portfolioLeads.find((l) => l.id === lead.id);
                    if (originalPortfolioLead) {
                      handleOpenPortfolioDetail(originalPortfolioLead);
                    }
                  }}
                  districts={districts}
                  totalLeadCount={filteredPortfolioLeads.length}
                  userName={profile?.full_name || user?.user_metadata?.full_name || user?.email || 'ทีมงานขาย'}
                  userAvatar={currentUserAvatar}
                  isProUnlocked={isProUnlocked}
                  onRequirePro={requireProAccess}
                />
              </div>
            )}

            {/* Portfolio Table View */}
            {portfolioLeads.length > 0 && portfolioViewMode === 'table' && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                        <th className="p-3.5 pl-5">#</th>
                        <th className="p-3.5">ลูกค้า / บริษัทในพอร์ต</th>
                        <th className="p-3.5">พื้นที่ & ที่ตั้ง</th>
                        <th className="p-3.5">ติดต่อ</th>
                        <th className="p-3.5">สถานะงานขาย (CRM)</th>
                        <th className="p-3.5">มูลค่าดีล (฿)</th>
                        <th className="p-3.5">โน้ตล่าสุด</th>
                        {portfolioScope === 'all' && <th className="p-3.5">เซลส์ดูแล</th>}
                        <th className="p-3.5 pr-5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPortfolioLeads.length === 0 ? (
                        <tr>
                          <td colSpan={portfolioScope === 'all' ? 9 : 8} className="text-center py-12 text-slate-500">
                            ไม่พบลูกค้าในพอร์ตที่ตรงกับตัวกรองที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredPortfolioLeads.map((lead, idx) => {
                          const dist = lead.lat && lead.lng ? calculateDistanceKm(userLocation.lat, userLocation.lng, Number(lead.lat), Number(lead.lng)).toFixed(1) : null;
                          const currentStatus = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
                          const lastContactDate = getLeadLastContactDate(lead);
                          const contactHealth = calculateContactHealth(lastContactDate);

                          return (
                            <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5 pl-5 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                              
                              {/* Company Name */}
                              <td className="p-3.5 max-w-[240px]">
                                <div className="font-bold text-white text-xs truncate" title={lead.company_name}>
                                  {lead.company_name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  🏭 Factory Radar {lead.tax_id && `• Tax: ${lead.tax_id}`}
                                </div>
                              </td>

                              {/* District & Distance */}
                              <td className="p-3.5 whitespace-nowrap">
                                <div className="font-medium text-slate-200 text-xs">
                                  {lead.district || lead.province || 'สมุทรปราการ'}
                                </div>
                                {dist && (
                                  <div className="text-[10px] text-amber-400 font-medium mt-0.5 flex items-center gap-1 font-mono">
                                    <Zap className="w-3 h-3" />
                                    <span>{dist} กม.</span>
                                  </div>
                                )}
                              </td>

                              {/* Contact */}
                              <td className="p-3.5 whitespace-nowrap">
                                {lead.phone ? (
                                  isProUnlocked ? (
                                    <a
                                      href={`tel:${lead.phone}`}
                                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono font-bold text-xs"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{lead.phone}</span>
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => requireProAccess('ดูเบอร์โทรศัพท์และติดต่อลูกค้า')}
                                      className="text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 font-mono text-xs cursor-pointer"
                                      title="แตะเพื่อปลดล็อกเบอร์โทรศัพท์"
                                    >
                                      <Lock className="w-3 h-3 text-amber-400" />
                                      <span>{maskPhoneNumber(lead.phone)}</span>
                                    </button>
                                  )
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>

                              {/* CRM Status Selector & Inactive Health Badge */}
                              <td className="p-3.5 whitespace-nowrap space-y-1">
                                <select
                                  value={lead.status || 'NEW'}
                                  onChange={(e) => handleUpdatePortfolioLead(lead.id, { status: e.target.value as LeadStatus })}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer block ${currentStatus.bg} ${currentStatus.color}`}
                                >
                                  {STATUS_OPTIONS.map((st) => (
                                    <option key={st.value} value={st.value} className="bg-slate-900 text-white">
                                      {st.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${contactHealth.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${contactHealth.dotColor}`} />
                                    <span>{contactHealth.label}</span>
                                  </span>
                                </div>
                              </td>

                              {/* Deal Value */}
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-amber-300">
                                  {lead.deal_value ? `฿${Number(lead.deal_value).toLocaleString()}` : '-'}
                                </span>
                              </td>

                              {/* Notes & Activity History */}
                              <td className="p-3.5 max-w-[220px]">
                                <div 
                                  onClick={() => setSelectedPortfolioLead(lead)}
                                  className="group flex items-center justify-between gap-1.5 p-1.5 -m-1 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                                  title="คลิกเพื่อจัดการ CRM, บันทึกโน้ต & ดูประวัติ"
                                >
                                  <div className="text-xs text-slate-300 truncate">
                                    {lead.notes ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-blue-400">📝</span>
                                        <span className="truncate">{lead.notes}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 italic">+ บันทึกโน้ต</span>
                                    )}
                                  </div>
                                  <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded shrink-0 transition-opacity">
                                    CRM
                                  </span>
                                </div>
                              </td>

                              {/* Sales Rep Name (If All Team Scope) */}
                              {portfolioScope === 'all' && (
                                <td className="p-3.5 whitespace-nowrap">
                                  <span className="text-xs text-slate-300 font-medium">
                                    {lead.sales_rep_name || 'ไม่ระบุ'}
                                  </span>
                                </td>
                              )}

                              {/* Actions */}
                              <td className="p-3.5 pr-5 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => setSelectedPortfolioLead(lead)}
                                  className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 transition cursor-pointer"
                                  title="จัดการสถานะ CRM, บันทึกโน้ต & ประวัติไทม์ไลน์"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {lead.lat && lead.lng && (
                                  isProUnlocked ? (
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition inline-flex items-center cursor-pointer"
                                      title="นำทาง Google Maps"
                                    >
                                      <Navigation className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => requireProAccess('เปิดแผนที่ GPS นำทางโรงงาน')}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400/70 hover:text-amber-300 border border-slate-700 transition inline-flex items-center cursor-pointer"
                                      title="ปลดล็อกแผนที่นำทาง Google Maps"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}

                                <button
                                  onClick={() => handleReleasePortfolioLead(lead.id, lead.company_name)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition cursor-pointer"
                                  title="ส่งคืนเข้าคลังลูกค้ารอจัดสรร (พร้อมระบุเหตุผล)"
                                >
                                  <Inbox className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: PLASTIC RESIN MARKET INTELLIGENCE & SIZING     */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'market' && <PlasticMarketIntelligence />}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: LEAD MARKETPLACE (SHOPPING MALL CATALOG)       */}
        {/* ---------------------------------------------------- */}
        {mainTab === 'marketplace' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Marketplace Navigation Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    🛒 LEAD MARKETPLACE
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">ตลาดค้นหาและช้อปปิ้งลูกค้า</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  เลือกดูโรงงานอุตสาหกรรมเป้าหมาย แล้วกดปุ่ม <strong>"🛒 หยิบใส่พอร์ตของฉัน"</strong> ลูกค้าจะถูกดึงเข้าสู่หน้าพอร์ตหลักของคุณทันที
                </p>
              </div>

              <button
                onClick={() => setMainTab('portfolio')}
                className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-black text-xs flex items-center justify-center gap-2 border border-amber-500/40 shadow-lg cursor-pointer transition active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับไปที่พอร์ตของฉัน ({portfolioLeads.length})</span>
              </button>
            </div>

            {/* Main Target Factory Radar Header (3D Glass) */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl backdrop-blur-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>🏭 คลังโรงงานผู้ซื้อเป้าหมาย (Target Factory Leads)</span>
                    <span className="px-2.5 py-0.5 rounded-full backdrop-blur-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30 shadow-sm">
                      {leads.length.toLocaleString()} โรงงาน
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ฐานข้อมูลโรงงานผู้ซื้อเม็ดพลาสติกและยางพารา คัดกรองพร้อมใช้งานสำหรับทีมขาย
                  </p>
                </div>
              </div>
            </div>

            {/* Target Factory Radar Catalog */}
            <div className="space-y-6">
                {/* Search & Radius (3D Glass Console) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 p-5 rounded-[2rem] backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] via-slate-900/70 to-slate-950/90 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex-1 min-w-[280px] relative">
                    <Search className="w-4 h-4 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อโรงงาน, ถนน, หรือเบอร์โทรศัพท์..."
                      className="w-full pl-11 pr-9 py-2.5 backdrop-blur-xl bg-slate-950/70 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shrink-0 px-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>รัศมีเรดาร์:</span>
                    </span>
                    <div className="flex items-center gap-1 backdrop-blur-xl bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                      {['3', '5', '10', '15', 'ALL'].map((rad) => (
                        <button
                          key={rad}
                          onClick={() => setSelectedRadius(rad)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 cursor-pointer active:scale-95 ${
                            selectedRadius === rad
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300/40'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          {rad === 'ALL' ? 'ทั้งหมด' : `${rad} กม.`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Factory Map (3D Glass Framed) */}
                <div className="relative rounded-[2.5rem] overflow-hidden border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] bg-slate-950">
                  <FactoryMap
                    leads={enrichedFilteredLeads}
                    userLocation={userLocation}
                    selectedDistrict={selectedDistrict}
                    onDistrictSelect={(d: string) => setSelectedDistrict(d)}
                    selectedRadius={selectedRadius}
                    onSelectRadius={(r: string) => setSelectedRadius(r)}
                    onLeadClick={(lead: FactoryLead) => handleOpenLeadModal(lead)}
                    districts={districts}
                    districtCounts={districtCounts}
                    totalLeadCount={leads.length}
                    userName={profile?.full_name || user?.user_metadata?.full_name || user?.email || 'ทีมงานขาย'}
                    userAvatar={currentUserAvatar}
                    isProUnlocked={isProUnlocked}
                    onRequirePro={requireProAccess}
                  />
                </div>

                {/* Table (3D Glass Table Panel) */}
                <div className="rounded-[2.5rem] border border-white/15 backdrop-blur-2xl bg-gradient-to-b from-white/[0.05] via-slate-900/80 to-slate-950/95 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px] font-bold backdrop-blur-md">
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
                              <div className="font-bold text-white text-xs truncate flex items-center gap-1.5" title={isProUnlocked ? lead.name : undefined}>
                                <span className={!isProUnlocked ? "text-amber-300/90 font-black" : ""}>
                                  {isProUnlocked ? lead.name : maskCompanyName(lead.name, false)}
                                </span>
                                {!isProUnlocked && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Pro
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5" title={isProUnlocked ? lead.address : undefined}>
                                {isProUnlocked ? lead.address : maskAddress(lead.address, lead.district, lead.province, false)}
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
                                isProUnlocked ? (
                                  <a
                                    href={`tel:${lead.phone}`}
                                    className="text-cyan-400 hover:underline flex items-center gap-1 font-mono font-bold text-xs"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{lead.phone}</span>
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => requireProAccess('ดูเบอร์โทรศัพท์และติดต่อโรงงาน')}
                                    className="text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 font-mono text-xs cursor-pointer"
                                    title="แตะเพื่อปลดล็อกเบอร์โทรศัพท์"
                                  >
                                    <Lock className="w-3 h-3 text-amber-400" />
                                    <span>{maskPhoneNumber(lead.phone)}</span>
                                  </button>
                                )
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                              {lead.email && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5 font-mono">
                                  {maskEmail(lead.email)}
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
                              {(() => {
                                const isClaimedByMe = claimedFactoryMap[`lead_${lead.id}`]?.user_id === user?.id;
                                const claimedByOther = !isClaimedByMe && claimedFactoryMap[`lead_${lead.id}`] ? claimedFactoryMap[`lead_${lead.id}`]?.claimed_by_name || 'สมาชิกในทีม' : null;

                                if (isClaimedByMe) {
                                  return (
                                    <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                                      <UserCheck className="w-3 h-3 text-emerald-400" />
                                      <span>ในพอร์ต</span>
                                    </span>
                                  );
                                }
                                if (claimedByOther) {
                                  return (
                                    <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-medium text-[11px] inline-flex items-center gap-1" title={`ถูกดูแลโดยคุณ ${claimedByOther}`}>
                                      <Lock className="w-3 h-3 text-amber-400" />
                                      <span className="max-w-[70px] truncate">{claimedByOther}</span>
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => {
                                      if (!isProUnlocked) {
                                        requireProAccess('หยิบโรงงานเข้าพอร์ตลูกค้า');
                                        return;
                                      }
                                      handleClaimFactoryLead(lead);
                                    }}
                                    disabled={isClaimingLead}
                                    className="p-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/30 text-cyan-300 hover:text-white transition inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer active:scale-95"
                                    title="หยิบใส่พอร์ตของฉัน"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>หยิบ</span>
                                  </button>
                                );
                              })()}

                              <button
                                onClick={() => handleOpenLeadModal(lead)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="ดูรายละเอียด & บันทึกโน้ต"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {isProUnlocked ? (
                                <a
                                  href={lead.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition inline-flex items-center cursor-pointer"
                                  title="นำทาง Google Maps"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => requireProAccess('เปิดแผนที่ GPS นำทางโรงงาน')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400/70 hover:text-amber-300 border border-slate-700 transition inline-flex items-center cursor-pointer"
                                  title="ปลดล็อกแผนที่นำทาง Google Maps"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}
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
                  แสดง 100 รายการแรก เพื่อความรวดเร็ว (สามารถใช้ปุ่ม &quot;ส่งออก Excel&quot; เพื่อดูข้อมูลทั้งหมด {filteredLeads.length} รายการ)
                </div>
              )}
            </div>
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

              {/* Sub-tabs: Members vs Unassigned Pool vs Pending Invitations */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setTeamTab('members')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    teamTab === 'members'
                      ? 'bg-slate-100 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>สมาชิกในทีม ({activeMembers.length} Active {inactiveMembers.length > 0 ? `/ ${inactiveMembers.length} Inactive` : ''})</span>
                </button>

                <button
                  onClick={() => {
                    setTeamTab('unassigned');
                    fetchUnassignedLeads();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    teamTab === 'unassigned'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                      : 'text-cyan-400 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/30'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>📥 คลังลูกค้ารอจัดสรร ({unassignedLeads.length})</span>
                  {unassignedLeads.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  )}
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

            {/* Sub-Tab 1: Team Members (Active & Inactive) */}
            {teamTab === 'members' && (
              <div className="space-y-4">
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">กรองสถานะ:</span>
                  <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <button
                      onClick={() => setMemberStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        memberStatusFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ทั้งหมด ({teamMembers.length})
                    </button>
                    <button
                      onClick={() => setMemberStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        memberStatusFilter === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      กำลังทำงาน ({activeMembers.length})
                    </button>
                    <button
                      onClick={() => setMemberStatusFilter('inactive')}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        memberStatusFilter === 'inactive'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      ลาออก / Inactive ({inactiveMembers.length})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers
                    .filter((member) => {
                      if (memberStatusFilter === 'active') return member.status !== 'inactive';
                      if (memberStatusFilter === 'inactive') return member.status === 'inactive';
                      return true;
                    })
                    .map((member) => {
                      const isThisOwner = member.role === 'owner' || (!member.role && member.id === currentCompany?.owner_id);
                      const isManager = member.role === 'manager';
                      const isInactive = member.status === 'inactive';

                      return (
                        <div
                          key={member.id}
                          className={`p-5 rounded-3xl border transition shadow-xl space-y-3 relative group ${
                            isInactive
                              ? 'bg-slate-900/50 border-rose-900/40 opacity-80'
                              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {/* Avatar with Role Badge */}
                              <div className="relative shrink-0">
                                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-md flex items-center justify-center">
                                  {member.avatar_url ? (
                                    <img
                                      src={member.avatar_url}
                                      alt={member.full_name || 'Member Avatar'}
                                      referrerPolicy="no-referrer"
                                      className={`w-full h-full object-cover ${isInactive ? 'grayscale' : ''}`}
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center font-black text-sm ${
                                      isThisOwner
                                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950'
                                        : isManager
                                        ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                                        : 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950'
                                    }`}>
                                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : '👤'}
                                    </div>
                                  )}
                                </div>
                                {isThisOwner && (
                                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900" title="เจ้าของทีม (Owner)">
                                    <Crown className="w-2.5 h-2.5 fill-slate-950" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-xs truncate max-w-[140px] ${isInactive ? 'text-slate-400 line-through' : 'text-white'}`}>
                                    {member.full_name || member.email?.split('@')[0]}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[150px] font-mono">
                                  {member.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                isThisOwner
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : isManager
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}>
                                {isThisOwner ? 'Owner' : isManager ? 'Manager' : 'Sales'}
                              </span>

                              {/* Status Badge */}
                              {isInactive ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Inactive (ลาออก)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Active (ทำงาน)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                            <span>เบอร์โทร: {member.phone || '-'}</span>
                            
                            {isOwner && !isThisOwner && (
                              <div className="flex items-center gap-2">
                                {isInactive ? (
                                  <button
                                    onClick={() => handleToggleMemberStatus(member, 'active')}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition active:scale-95"
                                    title="คืนสิทธิ์การใช้งานบัญชี"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>คืนสิทธิ์ Active</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleMemberStatus(member, 'inactive')}
                                    className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/20 flex items-center gap-1 cursor-pointer transition active:scale-95"
                                    title="ปิดการใช้งานบัญชีและส่งลูกค้ารอจัดสรร"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                    <span>ปรับเป็น Inactive (ลาออก)</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                                  className="text-slate-500 hover:text-rose-400 text-[10px] p-1 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                                  title="ลบออกจากสังกัดบริษัท"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Unassigned Leads Pool (คลังลูกค้ารอจัดสรร) */}
            {teamTab === 'unassigned' && (
              <div className="space-y-4">
                {/* Unassigned Pool Header Info & Batch Assign Toolbar */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base flex items-center gap-2">
                          <span>คลังลูกค้ารอจัดสรร (Unassigned Lead Pool)</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500 text-slate-950">
                            {unassignedLeads.length} แห่ง
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                          รวบรวมรายชื่อลูกค้าที่ยังไม่มีผู้รับผิดชอบ หรือถูกดึงกลับมาจากเซลส์ที่ลาออก (Inactive) หัวหน้าทีมสามารถเลือกรายชื่อและมอบหมายต่อให้เซลส์ในทีมได้ทันที โดยประวัติการคุยและการดูแลจะคงอยู่ครบถ้วน
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={fetchUnassignedLeads}
                      disabled={isLoadingUnassigned}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition self-start md:self-auto cursor-pointer border border-slate-700"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUnassigned ? 'animate-spin' : ''}`} />
                      <span>รีเฟรชข้อมูล</span>
                    </button>
                  </div>

                  {/* Batch Assign Toolbar */}
                  {unassignedLeads.length > 0 && isOwner && (
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (selectedUnassignedIds.length === unassignedLeads.length) {
                              setSelectedUnassignedIds([]);
                            } else {
                              setSelectedUnassignedIds(unassignedLeads.map((l) => l.id));
                            }
                          }}
                          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                        >
                          {selectedUnassignedIds.length === unassignedLeads.length ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                          <span>
                            {selectedUnassignedIds.length === unassignedLeads.length
                              ? 'ยกเลิกการเลือกทั้งหมด'
                              : `เลือกทั้งหมด (${unassignedLeads.length})`}
                          </span>
                        </button>

                        {selectedUnassignedIds.length > 0 && (
                          <span className="text-xs text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                            เลือกแล้ว {selectedUnassignedIds.length} แห่ง
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={targetAssigneeId}
                          onChange={(e) => setTargetAssigneeId(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value="">-- เลือกเซลส์ที่จะมอบหมาย --</option>
                          {activeMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email} ({m.role.toUpperCase()})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleBatchAssignLeads()}
                          disabled={isBatchAssigning || selectedUnassignedIds.length === 0 || !targetAssigneeId}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer transition active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isBatchAssigning ? 'กำลังมอบหมาย...' : `จ่ายงานให้เซลส์ (${selectedUnassignedIds.length})`}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pool Leads Grid */}
                {unassignedLeads.length === 0 ? (
                  <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-200">ไม่มีลูกค้ารอจัดสรรในคลังกลาง</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        ลูกค้าทุกรายในระบบของบริษัทมีเซลส์ประจำตัวดูแลเรียบร้อยแล้ว หรือเมื่อมีการปิดใช้งานบัญชีเซลส์ที่ลาออก รายชื่อลูกค้าจะปรากฏที่นี่โดยอัตโนมัติ
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unassignedLeads.map((lead) => {
                      const isSelected = selectedUnassignedIds.includes(lead.id);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUnassignedIds(selectedUnassignedIds.filter((id) => id !== lead.id));
                            } else {
                              setSelectedUnassignedIds([...selectedUnassignedIds, lead.id]);
                            }
                          }}
                          className={`p-4 rounded-3xl border transition cursor-pointer space-y-3 relative group ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-xs line-clamp-1 group-hover:text-cyan-300 transition">
                                  {lead.company_name}
                                </h4>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{lead.district || lead.address || 'สมุทรปราการ'}</span>
                                </p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              lead.status === 'WON'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : lead.status === 'QUOTED'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : lead.status === 'MEETING'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {lead.status || 'NEW'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>มูลค่าดีล:</span>
                              <strong className="text-amber-400 font-mono">
                                ฿{Number(lead.deal_value || 0).toLocaleString()}
                              </strong>
                            </div>
                            {lead.notes && (
                              <div className="text-slate-400 line-clamp-1 italic text-[10px]">
                                "{lead.notes}"
                              </div>
                            )}
                          </div>

                          {/* Actions: Quick Assign Dropdown & Permanent Delete */}
                          {isOwner && (
                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] text-slate-500 shrink-0">มอบหมาย:</span>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBatchAssignLeads([lead.id], e.target.value);
                                    }
                                  }}
                                  defaultValue=""
                                  className="w-full px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-200 border border-slate-700 focus:outline-none focus:border-cyan-400 truncate"
                                >
                                  <option value="" disabled>เลือกผู้รับผิดชอบ</option>
                                  {activeMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.full_name || m.email}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={() => handlePermanentRemoveLead(lead.id, lead.company_name)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                                title="ถอนการจอง (คืนสู่ตลาดกลาง DBD)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Pending Invitations */}
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

        {/* ---------------------------------------------------- */}
        {/* TAB 5: VEHICLE MILEAGE & FUEL REIMBURSEMENT WORKSPACE*/}
        {/* ---------------------------------------------------- */}
        {mainTab === 'mileage' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Command Banner */}
            <div className="p-6 rounded-3xl backdrop-blur-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-2xl shrink-0">
                    <Car className="w-7 h-7 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-black text-white">ศูนย์บันทึกการเดินทาง & เบิกจ่ายค่าน้ำมัน</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        GPS Driver Hub
                      </span>
                      {activeTrip ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-slate-950" />
                          กำลังวิ่งทริปประจำวัน
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          ⚪ สแตนด์บาย
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ระบบบันทึกไมล์ดิจิทัล ตรวจสอบระยะทางจริง vs รูทเช็คอินลูกค้า พร้อมภาพถ่ายหน้าปัดไมล์ยืนยัน 100%
                    </p>
                  </div>
                </div>

                {/* Primary Top Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {activeTrip ? (
                    <button
                      onClick={() => openTripModal('active')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                    >
                      <Gauge className="w-4 h-4" />
                      <span>จัดการทริปที่กำลังวิ่ง ({Number(activeTrip.total_route_km || 0).toFixed(1)} กม.)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openTripModal('start')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>เริ่มบันทึกทริปใหม่ (Start Trip)</span>
                    </button>
                  )}

                  <button
                    onClick={() => openTripModal('history')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>ประวัติเดินทาง</span>
                  </button>

                  {canViewAllTeamLeads && (
                    <button
                      onClick={openFuelReportModal}
                      className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                      <span>ตรวจสอบ & อนุมัติเบิก</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* 4-Stat Monthly Aggregate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/20 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Gauge className="w-4 h-4 text-cyan-400" /> ระยะทางสะสมเดือนนี้
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">ก.ย. 69</span>
                </div>
                <div className="text-2xl font-black font-mono text-cyan-300">
                  {monthlyTripStats.totalKm.toFixed(1)} <span className="text-xs font-normal text-slate-400">กม.</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  รวม {monthlyTripStats.tripsCount} รอบการเดินทาง
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> ยอดเบิกค่าน้ำมัน
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">บาท</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-300">
                  ฿{monthlyTripStats.totalClaim.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-500">
                  เรทมาตรฐาน 5.00 ฿/กิโลเมตร
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/20 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400" /> รอการตรวจสอบ
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">Pending</span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-300">
                  {monthlyTripStats.pendingCount} <span className="text-xs font-normal text-slate-400">ทริป</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  รอฝ่ายบัญชี/ผู้บริหารอนุมัติ
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-500/20 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" /> อนุมัติเบิกจ่ายแล้ว
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">Approved</span>
                </div>
                <div className="text-2xl font-black font-mono text-purple-300">
                  {monthlyTripStats.approvedCount}/{monthlyTripStats.tripsCount} <span className="text-xs font-normal text-slate-400">ทริป</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  เช็คอินรวม {monthlyTripStats.checkinCount} จุด
                </div>
              </div>
            </div>

            {/* 2-Column Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Active Driver Cockpit & Policy Widget */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Active Trip Cockpit OR Quick Start Card */}
                {activeTrip ? (
                  <div className="p-5 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-400/40 text-amber-300 font-mono font-black text-xs">
                          🚗 {activeTrip.license_plate || 'ไม่ระบุทะเบียน'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {activeTrip.created_at ? new Date(activeTrip.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 animate-pulse">
                        กำลังเดินทาง
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/30">
                        <div className="text-[10px] text-slate-400">ระยะทางสะสม</div>
                        <div className="text-lg font-black font-mono text-cyan-300">
                          {Number(activeTrip.total_route_km || 0).toFixed(1)} <span className="text-xs font-normal">กม.</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30">
                        <div className="text-[10px] text-slate-400">ยอดเบิกสะสม</div>
                        <div className="text-lg font-black font-mono text-emerald-300">
                          ฿{(Number(activeTrip.total_route_km || 0) * Number(activeTrip.fuel_rate_per_km || 5)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    {/* Timeline of Checkins */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2">
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>จุดแวะวันนี้ ({activeTrip.checkins?.length || 0})</span>
                        </span>
                      </div>
                      {activeTrip.checkins && activeTrip.checkins.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {activeTrip.checkins.map((chk, idx) => (
                            <div key={chk.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                              <div className="truncate min-w-0">
                                <p className="font-semibold text-white truncate text-xs">{chk.location_name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {chk.checkin_time ? new Date(chk.checkin_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 font-mono">
                                +{Number(chk.distance_from_prev_km || 0).toFixed(1)} กม.
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-3 text-center text-[11px] text-slate-500 italic">
                          ยังไม่มีการเช็คอินจุดจอด
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => openTripModal('active')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-slate-950" />
                        <span>📸 เช็คอินจุดจอด / พบลูกค้า (GPS Check-in)</span>
                      </button>

                      <button
                        onClick={() => openTripModal('end')}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        <span>🏁 สิ้นสุดการเดินทาง & ถ่ายรูปไมล์สรุป</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="p-6 text-center rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                      <Gauge className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white">พร้อมเริ่มบันทึกทริป</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        ถ่ายรูปหน้าปัดไมล์ก่อนออกเดินทาง ระบบจะปักหมุด GPS และคำนวณเบิกค่าน้ำมันอัตโนมัติ
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                        <Camera className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-slate-300 block">ภาพไมล์จริง</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                        <MapPin className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-slate-300 block">พิกัด GPS</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                        <Fuel className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-slate-300 block">เบิก 5฿/กม.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openTripModal('start')}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>🚗 เริ่มต้นบันทึกทริปใหม่ (Start Trip)</span>
                    </button>
                  </div>
                )}

                {/* Company Fuel Policy Widget */}
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      <span>นโยบายค่าน้ำมันมาตรฐาน</span>
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">🚗 รถยนต์ (Car)</span>
                      <span className="font-mono font-bold text-amber-300">5.00 บาท/กม.</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">🛵 มอเตอร์ไซค์ (Motorcycle)</span>
                      <span className="font-mono font-bold text-amber-300">2.50 บาท/กม.</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">🚐 รถตู้/ขนส่ง (Van)</span>
                      <span className="font-mono font-bold text-amber-300">6.00 บาท/กม.</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Recent Trips & Audit Table */}
              <div className="lg:col-span-8 space-y-4">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base">ประวัติการเดินทาง & ขอเบิกค่าน้ำมัน</h3>
                        <p className="text-xs text-slate-400">รายการทริปทั้งหมดและสถานะการตรวจสอบ</p>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchActiveTrip()}
                      disabled={isLoadingTrips}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer border border-slate-700"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTrips ? 'animate-spin text-amber-400' : ''}`} />
                      <span>รีเฟรชข้อมูล</span>
                    </button>
                  </div>

                  {/* Table Feed */}
                  {isLoadingTrips ? (
                    <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                      <p>กำลังโหลดรายการเดินทาง...</p>
                    </div>
                  ) : userTrips.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-500 space-y-1 border border-dashed border-slate-800 rounded-2xl">
                      <Car className="w-8 h-8 mx-auto text-slate-600 opacity-60 mb-2" />
                      <p className="font-bold text-slate-400">ยังไม่มีบันทึกการเดินทาง</p>
                      <p className="text-[11px] text-slate-600">กดเริ่มทริปใหม่เพื่อบันทึกการออกพบลูกค้า</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-3">วันที่ / ทะเบียน</th>
                            <th className="py-3 px-3">เส้นทาง</th>
                            <th className="py-3 px-3 text-right">ระยะทาง</th>
                            <th className="py-3 px-3 text-right">ยอดเบิก</th>
                            <th className="py-3 px-3 text-center">สถานะ</th>
                            <th className="py-3 px-3 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {userTrips.map((trip) => {
                            const tripKm = Number(trip.total_route_km) || 0;
                            const tripClaim = (trip.total_fuel_amount !== undefined && trip.total_fuel_amount !== null)
                              ? Number(trip.total_fuel_amount)
                              : tripKm * Number(trip.fuel_rate_per_km || 5);
                            const isApproved = trip.status === 'approved';
                            const isPending = trip.status === 'completed';
                            const isInProgress = trip.status === 'in_progress';

                            return (
                              <tr key={trip.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-3">
                                  <div className="font-mono font-bold text-white text-xs">
                                    {trip.trip_date ? new Date(trip.trip_date).toLocaleDateString('th-TH') : '-'}
                                  </div>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                                    {trip.license_plate || 'รถยนต์'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 max-w-xs">
                                  <div className="truncate text-slate-200">
                                    📍 {trip.start_location_name || 'จุดเริ่มต้น'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    ➡️ {trip.end_location_name || (isInProgress ? 'กำลังเดินทาง' : 'จุดสิ้นสุด')}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-cyan-300">
                                  {tripKm.toFixed(1)} กม.
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                                  ฿{tripClaim.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {isInProgress ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                                      กำลังวิ่ง
                                    </span>
                                  ) : isApproved ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ✓ อนุมัติแล้ว
                                    </span>
                                  ) : isPending ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      ⏳ รอตรวจสอบ
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                      แบบร่าง
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => openTripModal('history')}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    ดูหลักฐาน
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

      </main>
      </div>

      {/* ==================================================== */}
      {/* 2. SMARTPHONE NATIVE APP SHELL (MOBILE VIEW ONLY)    */}
      {/* ==================================================== */}
      <div className="sm:hidden flex flex-col flex-1 min-h-screen pb-20 bg-[#080c14]">
        
        {/* Mobile Top App Bar */}
        <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-3 pt-safe shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-9 w-9 shrink-0 flex items-center justify-center p-0.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/10 border border-amber-500/30">
              <img
                src="/images/logo.png"
                alt="RouteHunter"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white leading-none tracking-tight">RouteHunter</span>
                <span className="px-1.5 py-0.2 rounded-md text-[8px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 uppercase shadow-sm">
                  B2B
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-amber-300/90 font-bold truncate max-w-[110px]">{displayTeamName}</span>
                {isPreviewMode ? (
                  <button
                    onClick={() => {
                      setAccessLockFeatureName('ปลดล็อกสิทธิ์สมาชิก Pro Full Access');
                      setIsAccessLockModalOpen(true);
                    }}
                    className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-0.5 animate-pulse"
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>Preview</span>
                  </button>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Owner Team Management Header Button */}
            {canViewAllTeamLeads && (
              <button
                onClick={() => setMobileTab('team')}
                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-[11px] font-bold transition border cursor-pointer active:scale-95 ${
                  mobileTab === 'team'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/25'
                    : 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:border-amber-400/50'
                }`}
                title="จัดการทีมงาน & คลังกลาง"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>ทีมงาน ({teamMembers.length})</span>
              </button>
            )}

            {/* User Profile Avatar Button */}
            <button
              onClick={() => setMobileTab('profile')}
              className={`h-9 w-9 rounded-2xl flex items-center justify-center font-black text-xs transition border cursor-pointer overflow-hidden active:scale-95 ${
                mobileTab === 'profile'
                  ? 'border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title="โปรไฟล์ของคุณ"
            >
              {profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.full_name?.charAt(0)?.toUpperCase() || '🏢'}</span>
              )}
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
        {/* MOBILE TAB 1: PERSONAL PORTFOLIO (DEFAULT)           */}
        {/* ---------------------------------------------------- */}
        {(mobileTab === 'portfolio' || mobileTab === 'radar') && (
          <div className="flex-1 flex flex-col relative animate-in fade-in duration-150">
            {/* Top Toolbar & Filter (3D Glass Clean Panel - Fully Responsive & Optimized for Mobile) */}
            <div className="p-3 bg-gradient-to-b from-white/[0.08] via-slate-950/90 to-slate-950/98 backdrop-blur-2xl border-b border-white/10 space-y-2.5 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {/* Row 1: View Switcher (Map vs List) & Action */}
              <div className="flex items-center justify-between gap-1.5">
                {/* Segmented View Mode */}
                <div className="flex items-center p-0.5 rounded-2xl backdrop-blur-xl bg-slate-950/80 border border-white/10 shadow-inner">
                  <button
                    onClick={() => setPortfolioViewMode('map')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      portfolioViewMode === 'map'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>แผนที่</span>
                  </button>
                  <button
                    onClick={() => setPortfolioViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      portfolioViewMode === 'table'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>รายชื่อ ({filteredPortfolioLeads.length})</span>
                  </button>
                </div>

                {/* Right Actions: Owner Scope Toggle & Shopping CTA */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {canViewAllTeamLeads && (
                    <button
                      onClick={() => setPortfolioScope(portfolioScope === 'my' ? 'all' : 'my')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        portfolioScope === 'all'
                          ? 'bg-purple-500/25 text-purple-200 border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.3)] font-black'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                      }`}
                      title="สลับดูข้อมูลทั้งทีม / เฉพาะของฉัน"
                    >
                      <span>{portfolioScope === 'all' ? '🏢 ทั้งทีม' : '👤 ของฉัน'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setMobileTab('marketplace')}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-[11px] flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ ช้อปเพิ่ม</span>
                  </button>
                </div>
              </div>

              {/* Row 2: 4-Column Pipeline Grid (Fits 100% Mobile Screen Width - Zero Scrolling) */}
              <div className="grid grid-cols-4 gap-1.5">
                {/* 1. ทั้งหมด */}
                <button
                  onClick={() => {
                    setPortfolioStatusFilter('ALL');
                    setPortfolioStaleFilter('ALL');
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    portfolioStatusFilter === 'ALL' && portfolioStaleFilter === 'ALL'
                      ? 'bg-gradient-to-b from-white to-slate-200 text-slate-950 font-black border-white shadow-md'
                      : 'backdrop-blur-md bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="text-[10px] leading-tight">ทั้งหมด</span>
                  <span className="font-mono text-xs font-black">{portfolioLeads.length}</span>
                </button>

                {/* 2. ใหม่ */}
                <button
                  onClick={() => {
                    setPortfolioStatusFilter(portfolioStatusFilter === 'NEW' ? 'ALL' : 'NEW');
                    setPortfolioStaleFilter('ALL');
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    portfolioStatusFilter === 'NEW'
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-black'
                      : 'backdrop-blur-md bg-white/[0.04] border-white/10 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <span className="text-[10px] leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>ใหม่</span>
                  </span>
                  <span className="font-mono text-xs font-black">{pipelineStats.newCount}</span>
                </button>

                {/* 3. กำลังคุย / ติดตาม */}
                <button
                  onClick={() => {
                    setPortfolioStatusFilter((portfolioStatusFilter as string) === 'IN_PROGRESS' ? 'ALL' : ('IN_PROGRESS' as any));
                    setPortfolioStaleFilter('ALL');
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    (portfolioStatusFilter as string) === 'IN_PROGRESS'
                      ? 'bg-blue-500/25 text-blue-200 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] font-black'
                      : 'backdrop-blur-md bg-white/[0.04] border-white/10 text-slate-400 hover:text-blue-300'
                  }`}
                >
                  <span className="text-[10px] leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>ติดตาม</span>
                  </span>
                  <span className="font-mono text-xs font-black">
                    {pipelineStats.contactedCount + pipelineStats.meetingCount + pipelineStats.quotedCount}
                  </span>
                </button>

                {/* 4. ปิดสำเร็จ (Won) */}
                <button
                  onClick={() => {
                    setPortfolioStatusFilter(portfolioStatusFilter === 'WON' ? 'ALL' : 'WON');
                    setPortfolioStaleFilter('ALL');
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    portfolioStatusFilter === 'WON'
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-black'
                      : 'backdrop-blur-md bg-white/[0.04] border-white/10 text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <span className="text-[10px] leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>สำเร็จ</span>
                  </span>
                  <span className="font-mono text-xs font-black">{pipelineStats.wonCount}</span>
                </button>
              </div>

              {/* Row 3: Compact Search & Detailed Stage Dropdown (No Scroll, Single Row) */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 relative">
                  <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    placeholder="ค้นหาลูกค้า, เบอร์โทร..."
                    className="w-full pl-8 pr-7 py-1.5 backdrop-blur-xl bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
                  />
                  {portfolioSearch && (
                    <button onClick={() => setPortfolioSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
                  )}
                </div>

                {/* Specific Stage Dropdown */}
                <select
                  value={portfolioStatusFilter}
                  onChange={(e) => {
                    setPortfolioStatusFilter(e.target.value as any);
                    setPortfolioStaleFilter('ALL');
                  }}
                  className="px-2 py-1.5 backdrop-blur-xl bg-slate-900 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 focus:outline-none focus:border-amber-400 shrink-0 max-w-[115px] truncate"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value="NEW">🔵 ใหม่</option>
                  <option value="CONTACTED">📞 ติดต่อแล้ว</option>
                  <option value="MEETING">🤝 นัดพบ</option>
                  <option value="QUOTED">📄 เสนอราคา</option>
                  <option value="WON">👑 สำเร็จ</option>
                  <option value="LOST">❌ ปิดโอกาส</option>
                </select>
              </div>

              {/* Row 4: Contact Health Monitor Strip (3D Glass 3-Pill Filter - Zero Scroll) */}
              <div className="flex items-center gap-1.5 pt-0.5 border-t border-white/5">
                <span className="text-[10px] text-slate-400 font-bold shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="hidden xs:inline">สุขภาพ:</span>
                </span>
                
                {/* 1. สม่ำเสมอ */}
                <button
                  onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer whitespace-nowrap ${
                    portfolioStaleFilter === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400/30 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">สม่ำเสมอ ≤6ว.</span>
                </button>

                {/* 2. ขาดติดต่อ */}
                <button
                  onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'STALE' ? 'ALL' : 'STALE')}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer whitespace-nowrap ${
                    portfolioStaleFilter === 'STALE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-amber-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">ขาดติดต่อ &gt;7ว.</span>
                </button>

                {/* 3. เสี่ยงหลุด */}
                <button
                  onClick={() => setPortfolioStaleFilter(portfolioStaleFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer whitespace-nowrap ${
                    portfolioStaleFilter === 'CRITICAL'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/40 font-black'
                      : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-rose-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">เสี่ยงหลุด &gt;30ว.</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {portfolioLeads.length === 0 && !isLoadingPortfolio && (
              <div className="p-8 text-center rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 m-4 animate-in zoom-in-95 duration-150">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">ยังไม่มีลูกค้าในพอร์ตของคุณ</h3>
                  <p className="text-[11px] text-slate-400">ค้นหาและกดปุ่ม "🛒 หยิบใส่พอร์ต" จากฐานข้อมูล 390,000+ แห่ง</p>
                </div>
                <button
                  onClick={() => setMobileTab('marketplace')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>🛒 ไปช้อปปิ้งหาลูกค้า</span>
                </button>
              </div>
            )}

            {/* Mobile Portfolio Map View */}
            {portfolioLeads.length > 0 && portfolioViewMode === 'map' && (
              <div className="flex-1 w-full h-[calc(100dvh-200px)] min-h-[420px] relative">
                <FactoryMap
                  leads={mappedPortfolioForMap}
                  userLocation={userLocation}
                  selectedDistrict={selectedDistrict}
                  onDistrictSelect={(d: string) => setSelectedDistrict(d)}
                  selectedRadius={selectedRadius}
                  onSelectRadius={(r: string) => setSelectedRadius(r)}
                  onLeadClick={(lead: FactoryLead) => {
                    const originalLead = portfolioLeads.find((l) => l.id === lead.id);
                    if (originalLead) handleOpenPortfolioDetail(originalLead);
                  }}
                  districts={districts}
                  totalLeadCount={filteredPortfolioLeads.length}
                  userName={profile?.full_name || user?.user_metadata?.full_name || user?.email || 'ทีมงานขาย'}
                  userAvatar={currentUserAvatar}
                  isProUnlocked={isProUnlocked}
                  onRequirePro={requireProAccess}
                />
              </div>
            )}

            {/* Mobile Portfolio List View */}
            {portfolioLeads.length > 0 && portfolioViewMode === 'table' && (
              <div className="p-3.5 space-y-2.5 overflow-y-auto">
                {filteredPortfolioLeads.map((lead) => {
                  const dist = lead.lat && lead.lng ? calculateDistanceKm(userLocation.lat, userLocation.lng, Number(lead.lat), Number(lead.lng)).toFixed(1) : null;
                  const currentStatus = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
                  const lastContactDate = getLeadLastContactDate(lead);
                  const contactHealth = calculateContactHealth(lastContactDate);

                  return (
                    <div key={lead.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {lead.district || lead.province || 'สมุทรปราการ'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${currentStatus.bg} ${currentStatus.color}`}>
                              {currentStatus.label.split(' ')[0]}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${contactHealth.badgeClass}`}>
                              <span className={`w-1 h-1 rounded-full ${contactHealth.dotColor}`} />
                              <span>{contactHealth.label}</span>
                            </span>
                            {dist && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                                📍 {dist} กม.
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-xs mt-1 truncate">{lead.company_name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{lead.address || '-'}</p>
                        </div>

                        {lead.deal_value ? (
                          <div className="px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shrink-0">
                            ฿{Number(lead.deal_value).toLocaleString()}
                          </div>
                        ) : null}
                      </div>

                      {/* Latest Note preview & Quick Modal Click */}
                      <div 
                        onClick={() => setSelectedPortfolioLead(lead)}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 text-[11px] text-slate-300 flex items-center justify-between gap-2 cursor-pointer active:scale-98 transition"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-blue-400">📝</span>
                          <span className="truncate">{lead.notes || <span className="text-slate-500 italic">ยังไม่มีโน้ต (แตะเพื่อจัดการ CRM)</span>}</span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-bold shrink-0 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          จัดการ
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800">
                        {lead.phone ? (
                          isProUnlocked ? (
                            <a
                              href={`tel:${lead.phone.replace(/[^0-9]/g, "")}`}
                              className="py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>โทร</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => requireProAccess('ดูเบอร์โทรศัพท์และติดต่อลูกค้า')}
                              className="py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>โทร</span>
                            </button>
                          )
                        ) : (
                          <button disabled className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-bold flex items-center justify-center gap-1">
                            <span>-</span>
                          </button>
                        )}

                        {lead.lat && lead.lng ? (
                          isProUnlocked ? (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>นำทาง</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => requireProAccess('เปิดแผนที่ GPS นำทางโรงงาน')}
                              className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400/80 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                              title="ปลดล็อกแผนที่นำทาง GPS"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>นำทาง</span>
                            </button>
                          )
                        ) : (
                          <button disabled className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-bold flex items-center justify-center gap-1">
                            <span>-</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedPortfolioLead(lead)}
                          className="py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                          title="จัดการ CRM, บันทึกโน้ต & ดูประวัติ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>CRM / โน้ต</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 2: LEAD MARKETPLACE (DBD & FACTORIES)     */}
        {/* ---------------------------------------------------- */}
        {(mobileTab === 'marketplace' || mobileTab === 'dbd' || mobileTab === 'factories') && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-150">
            {/* Top Toolbar: View Switcher (Map vs List) & Count */}
            <div className="p-3 pb-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                {/* Title & Count Badge */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-black text-white whitespace-nowrap flex items-center gap-1">
                    <span>🏭</span>
                    <span>ช้อปหาลูกค้า</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/25 whitespace-nowrap">
                    {leads.length.toLocaleString()} แห่ง
                  </span>
                </div>

                {/* Sleek Segmented Switch (Map vs List) */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner shrink-0">
                  <button
                    onClick={() => setMobileMarketplaceViewMode('map')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer text-[11px] whitespace-nowrap ${
                      mobileMarketplaceViewMode === 'map'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🗺️ แผนที่</span>
                  </button>
                  <button
                    onClick={() => setMobileMarketplaceViewMode('list')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer text-[11px] whitespace-nowrap ${
                      mobileMarketplaceViewMode === 'list'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📋 รายชื่อ ({filteredLeads.length})</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`ค้นหาชื่อโรงงาน, วัตถุดิบ, จังหวัด (${leads.length} แห่ง)...`}
                  className="w-full pl-8 pr-7 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
                )}
              </div>

              {/* Quick Radius Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                <span className="text-slate-400 font-medium whitespace-nowrap text-[10px]">📍 รัศมี:</span>
                {[
                  { label: 'ทั้งหมด', value: 'ALL' },
                  { label: '3 กม.', value: '3' },
                  { label: '5 กม.', value: '5' },
                  { label: '10 กม.', value: '10' },
                  { label: '15 กม.', value: '15' },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedRadius(r.value)}
                    className={`px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer text-[10px] ${
                      selectedRadius === r.value
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile View Content: Map View or List View */}
            {mobileMarketplaceViewMode === 'map' ? (
              <div className="flex-1 w-full h-[calc(100dvh-220px)] min-h-[440px] relative">
                <FactoryMap
                  leads={enrichedFilteredLeads}
                  userLocation={userLocation}
                  selectedDistrict={selectedDistrict}
                  onDistrictSelect={(d: string) => setSelectedDistrict(d)}
                  selectedRadius={selectedRadius}
                  onSelectRadius={(r: string) => setSelectedRadius(r)}
                  onLeadClick={(lead: FactoryLead) => setMobileSelectedLead(lead)}
                  districts={districts}
                  districtCounts={districtCounts}
                  totalLeadCount={leads.length}
                  userName={profile?.full_name || user?.user_metadata?.full_name || user?.email || 'ทีมงานขาย'}
                  userAvatar={currentUserAvatar}
                  isProUnlocked={isProUnlocked}
                  onRequirePro={requireProAccess}
                />
              </div>
            ) : (
              /* Mobile List View */
              <div className="flex-1 p-3.5 pt-0 space-y-2.5 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
                    ไม่พบโรงงานที่ตรงกับเงื่อนไขการค้นหา
                  </div>
                ) : (
                  filteredLeads.slice(0, 50).map((lead) => {
                    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lead.lat, lead.lng);
                    const isClaimedByMe = claimedFactoryMap[`lead_${lead.id}`]?.user_id === user?.id;
                    const claimedByOther = !isClaimedByMe && claimedFactoryMap[`lead_${lead.id}`] ? claimedFactoryMap[`lead_${lead.id}`]?.claimed_by_name || 'สมาชิกในทีม' : null;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => setMobileSelectedLead(lead)}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-2.5 cursor-pointer active:border-cyan-500/50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {lead.district || lead.province || 'โรงงานอุตสาหกรรม'}
                              </span>
                              {(lead as any).raw_materials_needed && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  📦 {(lead as any).raw_materials_needed}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                                📍 {dist < 1 ? `${Math.round(dist * 1000)} ม.` : `${dist.toFixed(1)} กม.`}
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-xs mt-1.5 flex items-center gap-1.5">
                              <span className={!isProUnlocked ? "text-amber-300 font-black" : ""}>
                                {isProUnlocked ? (lead.name || lead.company_name) : maskCompanyName(lead.name || lead.company_name, false)}
                              </span>
                              {!isProUnlocked && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Pro
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {isProUnlocked ? lead.address : maskAddress(lead.address, lead.district, lead.province, false)}
                            </p>
                          </div>
                        </div>

                        {/* Claim Button */}
                        <div onClick={(e) => e.stopPropagation()}>
                          {isClaimedByMe ? (
                            <div className="w-full py-1.5 px-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              <span>อยู่ในพอร์ตของคุณแล้ว</span>
                            </div>
                          ) : claimedByOther ? (
                            <div className="w-full py-1.5 px-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[11px] flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>{claimedByOther} ดูแล</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isProUnlocked) {
                                  requireProAccess('หยิบโรงงานเข้าพอร์ตลูกค้า');
                                  return;
                                }
                                handleClaimFactoryLead(lead);
                              }}
                              disabled={isClaimingLead}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>🛒 หยิบใส่พอร์ตของฉัน</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setTeamTab('members')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center truncate ${
                    teamTab === 'members' ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  สมาชิก ({activeMembers.length})
                </button>
                <button
                  onClick={() => {
                    setTeamTab('unassigned');
                    fetchUnassignedLeads();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center truncate ${
                    teamTab === 'unassigned' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-cyan-400 hover:text-white'
                  }`}
                >
                  📥 คลังกลาง ({unassignedLeads.length})
                </button>
                <button
                  onClick={() => setTeamTab('pending')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center truncate ${
                    teamTab === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  คำเชิญ ({pendingInvitations.length})
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Roster Cards */}
            {teamTab === 'members' && (
              <div className="space-y-2">
                {teamMembers.map((m) => {
                  const isThisOwner = m.role === 'owner' || (!m.role && m.id === currentCompany?.owner_id);
                  const isManager = m.role === 'manager';
                  const isInactive = m.status === 'inactive';

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 shadow-sm ${
                        isInactive ? 'bg-slate-900/50 border-rose-900/30 opacity-80' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Mobile Avatar with Role Badge */}
                          <div className="relative shrink-0">
                            <div className="h-10 w-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                              {m.avatar_url ? (
                                <img
                                  src={m.avatar_url}
                                  alt={m.full_name || 'Member'}
                                  referrerPolicy="no-referrer"
                                  className={`w-full h-full object-cover ${isInactive ? 'grayscale' : ''}`}
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center font-black text-xs ${
                                  isThisOwner
                                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950'
                                    : isManager
                                    ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                                    : 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950'
                                }`}>
                                  {m.full_name ? m.full_name.charAt(0).toUpperCase() : '👤'}
                                </div>
                              )}
                            </div>
                            {isThisOwner && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900">
                                <Crown className="w-2 h-2 fill-slate-950" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold text-xs truncate ${isInactive ? 'text-slate-400 line-through' : 'text-white'}`}>
                              {m.full_name || m.email?.split('@')[0]}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{m.email}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            isThisOwner ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isManager ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {isThisOwner ? 'Owner' : isManager ? 'Manager' : 'Sales'}
                          </span>
                          {isInactive && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Inactive (ลาออก)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      {isOwner && !isThisOwner && (
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">{m.phone || 'ไม่มีเบอร์'}</span>
                          <div className="flex items-center gap-1.5">
                            {isInactive ? (
                              <button
                                onClick={() => handleToggleMemberStatus(m, 'active')}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>คืนสิทธิ์</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleMemberStatus(m, 'inactive')}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20 flex items-center gap-1"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>ลาออก</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveMember(m.id, m.full_name || m.email)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                              title="ลบออกจากทีม"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-tab 2: Unassigned Leads Pool */}
            {teamTab === 'unassigned' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-cyan-400" />
                      <span>คลังลูกค้ารอจัดสรร</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950">
                      {unassignedLeads.length} แห่ง
                    </span>
                  </div>

                  {unassignedLeads.length > 0 && isOwner && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <select
                        value={targetAssigneeId}
                        onChange={(e) => setTargetAssigneeId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                      >
                        <option value="">-- เลือกเซลส์ที่จะมอบหมาย --</option>
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name || m.email} ({m.role.toUpperCase()})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            if (selectedUnassignedIds.length === unassignedLeads.length) {
                              setSelectedUnassignedIds([]);
                            } else {
                              setSelectedUnassignedIds(unassignedLeads.map((l) => l.id));
                            }
                          }}
                          className="text-[11px] font-bold text-slate-300 flex items-center gap-1"
                        >
                          {selectedUnassignedIds.length === unassignedLeads.length ? (
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>เลือกทั้งหมด</span>
                        </button>

                        <button
                          onClick={() => handleBatchAssignLeads()}
                          disabled={isBatchAssigning || selectedUnassignedIds.length === 0 || !targetAssigneeId}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>จ่ายงาน ({selectedUnassignedIds.length})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {unassignedLeads.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                    <p className="font-bold text-slate-300">ไม่มีลูกค้ารอจัดสรร</p>
                    <p className="text-[10px] text-slate-500">ลูกค้าทุกรายมีผู้รับผิดชอบเรียบร้อย</p>
                  </div>
                ) : (
                  unassignedLeads.map((lead) => {
                    const isSelected = selectedUnassignedIds.includes(lead.id);
                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUnassignedIds(selectedUnassignedIds.filter((id) => id !== lead.id));
                          } else {
                            setSelectedUnassignedIds([...selectedUnassignedIds, lead.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/30' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-white text-xs truncate">{lead.company_name}</h4>
                            <span className="text-[9px] font-black text-amber-400 font-mono shrink-0">
                              ฿{Number(lead.deal_value || 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{lead.district || lead.address}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sub-tab 3: Invitations */}
            {teamTab === 'pending' && (
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
        {/* MOBILE TAB 3: PLASTIC MARKET INTELLIGENCE            */}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'market' && (
          <div className="flex-1 p-3.5 pb-8 space-y-4 animate-in fade-in duration-150">
            <PlasticMarketIntelligence />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 4: VEHICLE TRIP & MILEAGE LOG             */}
        {/* ---------------------------------------------------- */}
        {mobileTab === 'trips' && (
          <div className="flex-1 p-3.5 sm:p-4 pb-24 space-y-4 animate-in fade-in duration-200">
            
            {/* Top Glass Header Card */}
            <div className="p-3.5 sm:p-4 rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.08] via-slate-900/85 to-slate-950/95 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-2.5">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-yellow-400/15 text-amber-400 border border-amber-400/35 flex items-center justify-center shrink-0 shadow-inner">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-white tracking-tight truncate">
                      บันทึกไมล์ & เบิกค่าน้ำมัน
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      GPS เช็คอิน & คำนวณเบิกจ่ายอัตโนมัติ
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchActiveTrip()}
                  disabled={isLoadingTrips}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition active:scale-95 disabled:opacity-50 shrink-0"
                  title="รีเฟรชข้อมูลทริป"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTrips ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/25">
                  <Fuel className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>เบิกจ่าย 5.00 ฿/กม.</span>
                </span>
                {activeTrip ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                    <span>กำลังวิ่งทริป</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    <span>⚪ สแตนด์บาย</span>
                  </span>
                )}
              </div>
            </div>

            {/* ACTIVE TRIP COCKPIT or STANDBY HERO */}
            {activeTrip ? (
              <div className="p-4 sm:p-5 rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] shadow-[inset_0_1px_1px_rgba(52,211,153,0.3)] space-y-4">
                
                {/* Active Trip Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-400/50 text-amber-300 font-mono font-black text-xs shadow-inner">
                      🚗 {activeTrip.license_plate || 'ไม่ระบุทะเบียน'}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {activeTrip.created_at ? new Date(activeTrip.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                    ACTIVE
                  </span>
                </div>

                {/* 4-Stat Live Gauges */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-cyan-400" /> ระยะทางสะสม</span>
                    </div>
                    <div className="text-xl font-black font-mono text-cyan-300">
                      {Number(activeTrip.total_route_km || 0).toFixed(1)} <span className="text-xs font-normal text-cyan-400/80">กม.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /> ยอดเบิกสะสม</span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-300">
                      ฿{(Number(activeTrip.total_route_km || 0) * Number(activeTrip.fuel_rate_per_km || 5)).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 mb-0.5">เลขไมล์เริ่มต้น</div>
                    <div className="text-xs font-mono font-bold text-white">
                      {activeTrip.start_odometer?.toLocaleString() || '-'} <span className="text-[10px] text-slate-500 font-normal">กม.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 mb-0.5">จุดแวะเช็คอิน</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {activeTrip.checkins?.length || 0} <span className="text-[10px] text-slate-500 font-normal">จุด</span>
                    </div>
                  </div>
                </div>

                {/* Checkpoints Timeline (if any) */}
                {activeTrip.checkins && activeTrip.checkins.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>ประวัติจุดแวะวันนี้ ({activeTrip.checkins.length})</span>
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {activeTrip.checkins.map((chk, idx) => (
                        <div key={chk.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-semibold text-white truncate text-[11px]">{chk.location_name || 'จุดตรวจเช็ค'}</p>
                              <p className="text-[9px] text-slate-400">
                                {chk.checkin_time ? new Date(chk.checkin_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                            {chk.checkin_type === 'CLIENT_VISIT' ? 'เยี่ยมลูกค้า' : chk.checkin_type === 'GAS_STATION' ? 'เติมน้ำมัน' : 'พักรถ'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button Cluster */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    onClick={() => openTripModal('active')}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>📸 เช็คอินจุดจอด / พบลูกค้า (GPS Check-in)</span>
                  </button>

                  <button
                    onClick={() => openTripModal('end')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    <span>🏁 สิ้นสุดการเดินทาง & ถ่ายรูปไมล์สรุป</span>
                  </button>
                </div>

              </div>
            ) : (
              /* Standby Hero Console */
              <div className="p-5 text-center rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] via-slate-900/80 to-slate-950/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3.5">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Gauge className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">พร้อมออกเดินทางพบลูกค้า</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    ถ่ายรูปเลขไมล์เช้าเพื่อปักหมุด GPS และคำนวณเบิกค่าน้ำมันอัตโนมัติ
                  </p>
                </div>

                {/* 3-Pill Feature Highlights */}
                <div className="grid grid-cols-3 gap-1.5 py-0.5">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
                    <Camera className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">ภาพไมล์จริง</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">พิกัด GPS</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
                    <Fuel className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 block">เบิก 5฿/กม.</span>
                  </div>
                </div>

                <button
                  onClick={() => openTripModal('start')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>🚗 เริ่มบันทึกทริปใหม่ (Start Trip)</span>
                </button>
              </div>
            )}

            {/* MONTHLY SUMMARY KPI CARD */}
            <div className="p-4 sm:p-5 rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/[0.05] via-slate-900/70 to-slate-950/80 border border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    ยอดสะสมเดือนนี้ ({new Date().toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">
                  {monthlyTripStats.tripsCount} ทริป
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">ระยะทางรวม</div>
                  <div className="text-sm font-black font-mono text-cyan-300">
                    {monthlyTripStats.totalKm.toFixed(1)}
                  </div>
                  <div className="text-[9px] text-slate-500">กิโลเมตร</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">เบิกค่าน้ำมัน</div>
                  <div className="text-sm font-black font-mono text-emerald-300">
                    ฿{monthlyTripStats.totalClaim.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[9px] text-slate-500">บาท</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">อนุมัติแล้ว</div>
                  <div className="text-sm font-black font-mono text-amber-300">
                    {monthlyTripStats.approvedCount}/{monthlyTripStats.tripsCount}
                  </div>
                  <div className="text-[9px] text-slate-500">ทริป</div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS & MANAGEMENT TOOLS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openTripModal('history')}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition active:scale-95 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-amber-400">
                  <History className="w-4 h-4" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">ประวัติทริปทั้งหมด</h5>
                  <p className="text-[10px] text-slate-400">ตรวจดูรูท & ภาพถ่ายไมล์</p>
                </div>
              </button>

              <button
                onClick={openFuelReportModal}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition active:scale-95 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">รายงานเบิกจ่าย</h5>
                  <p className="text-[10px] text-slate-400">สรุปยอด & อนุมัติเบิก</p>
                </div>
              </button>
            </div>

            {/* RECENT TRIPS FEED */}
            <div className="p-4 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>การเดินทางล่าสุด</span>
                </h4>
                {userTrips.length > 0 && (
                  <button
                    onClick={() => openTripModal('history')}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ดูทั้งหมด ({userTrips.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isLoadingTrips ? (
                <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                  <p>กำลังโหลดรายการทริป...</p>
                </div>
              ) : userTrips.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                  <Car className="w-6 h-6 mx-auto text-slate-600 opacity-60 mb-1" />
                  <p>ยังไม่มีบันทึกการเดินทาง</p>
                  <p className="text-[10px] text-slate-600">กดเริ่มทริปใหม่เพื่อบันทึกการออกพบลูกค้า</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userTrips.slice(0, 3).map((trip) => {
                    const tripKm = Number(trip.total_route_km) || 0;
                    const tripClaim = (trip.total_fuel_amount !== undefined && trip.total_fuel_amount !== null)
                      ? Number(trip.total_fuel_amount)
                      : tripKm * Number(trip.fuel_rate_per_km || 5);
                    const isApproved = trip.status === 'approved';
                    const isPending = trip.status === 'completed';
                    const isInProgress = trip.status === 'in_progress';

                    return (
                      <div
                        key={trip.id}
                        onClick={() => openTripModal('history')}
                        className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/5 hover:border-amber-500/30 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              {trip.trip_date ? new Date(trip.trip_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {trip.license_plate || 'รถยนต์'}
                            </span>
                          </div>

                          {isInProgress ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                              กำลังวิ่ง
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ✓ อนุมัติแล้ว
                            </span>
                          ) : isPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              ⏳ รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400">
                              แบบร่าง
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                          <div className="text-slate-400 truncate max-w-[180px]">
                            📍 {trip.start_location_name || 'จุดเริ่มต้น'}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-cyan-300">{tripKm.toFixed(1)} กม.</span>
                            <span className="text-slate-500 mx-1">•</span>
                            <span className="font-mono font-bold text-emerald-400">฿{tripClaim.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MOBILE TAB 5: PROFILE & SETTINGS                     */}
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
                    profile?.full_name?.charAt(0)?.toUpperCase() || '🏢'
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
                onClick={() => setIsEditProfileOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between transition shadow-sm cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>ตั้งค่าข้อมูลโปรไฟล์ & รูปภาพ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400/60" />
              </button>

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
          onSelectTab={(t: MobileTab) => {
            setMobileTab(t);
            if (t === 'trips' && !activeTrip) {
              openTripModal('start');
            }
          }}
          portfolioCount={portfolioLeads.length}
          hasActiveTrip={!!activeTrip}
          canViewTeam={canViewAllTeamLeads}
          teamCount={teamMembers.length}
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
          onClaim={handleClaimFactoryLead}
          isClaimedByMe={mobileSelectedLead ? claimedFactoryMap[`lead_${mobileSelectedLead.id}`]?.user_id === user?.id : false}
          claimedByOtherName={
            mobileSelectedLead && claimedFactoryMap[`lead_${mobileSelectedLead.id}`] && claimedFactoryMap[`lead_${mobileSelectedLead.id}`]?.user_id !== user?.id
              ? (claimedFactoryMap[`lead_${mobileSelectedLead.id}`]?.claimed_by_name || 'สมาชิกในทีม')
              : null
          }
          isClaiming={isClaimingLead}
          isProUnlocked={isProUnlocked}
          onRequirePro={requireProAccess}
        />

      </div>

      {/* 3.9 Unified Portfolio Customer Detail & CRM Modal */}
      {selectedPortfolioLead && (
        <LeadCRMModal
          isOpen={!!selectedPortfolioLead}
          onClose={() => setSelectedPortfolioLead(null)}
          lead={selectedPortfolioLead}
          companyId={effectiveCompanyId || ''}
          currentUser={user ? {
            id: user.id,
            full_name: profile?.full_name || user.email || 'Sales Rep',
            avatar_url: profile?.avatar_url
          } : null}
          onLeadUpdated={() => {
            fetchPortfolio();
            loadClaimedFactoryIds();
          }}
          onReleaseLead={handleReleasePortfolioLead}
          isProUnlocked={isProUnlocked}
          onRequirePro={requireProAccess}
        />
      )}

      {/* 4. Lead Detail & Notes Modal */}
      {activeLeadModal && (() => {
        const isClaimedByMe = claimedFactoryMap[`lead_${activeLeadModal.id}`]?.user_id === user?.id;
        const claimedByOther = !isClaimedByMe && claimedFactoryMap[`lead_${activeLeadModal.id}`] ? claimedFactoryMap[`lead_${activeLeadModal.id}`]?.claimed_by_name || 'สมาชิกในทีม' : null;

        return (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <div
              onClick={() => setActiveLeadModal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
            />
            <div className="relative z-10 max-w-lg w-full backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/98 border border-white/15 rounded-[2rem] p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 animate-in zoom-in-95 duration-150">
              
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-sm">
                    {activeLeadModal.district}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                    {isProUnlocked ? (
                      <span>{activeLeadModal.name}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-amber-300 font-black">{maskCompanyName(activeLeadModal.name, false)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Pro Feature</span>
                      </span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveLeadModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl backdrop-blur-xl bg-slate-950/80 border border-white/10 text-xs space-y-2 text-slate-300 shadow-inner">
                <p>
                  <strong className="text-slate-400">ที่อยู่:</strong>{' '}
                  {isProUnlocked ? (
                    <span>{activeLeadModal.address}</span>
                  ) : (
                    <span className="text-slate-300 italic">
                      {maskAddress(activeLeadModal.address, activeLeadModal.district, activeLeadModal.province, false)}
                    </span>
                  )}
                </p>
                {activeLeadModal.phone && (
                  <p>
                    <strong className="text-slate-400">เบอร์โทร:</strong>{' '}
                    {isProUnlocked ? (
                      <a href={`tel:${activeLeadModal.phone}`} className="text-cyan-400 font-mono">
                        {activeLeadModal.phone}
                      </a>
                    ) : (
                      <button
                        onClick={() => requireProAccess('ดูเบอร์โทรศัพท์และติดต่อโรงงาน')}
                        className="text-cyan-400/80 hover:text-cyan-300 font-mono inline-flex items-center gap-1 cursor-pointer"
                        title="แตะเพื่อปลดล็อกเบอร์โทรศัพท์"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>{maskPhoneNumber(activeLeadModal.phone)}</span>
                      </button>
                    )}
                  </p>
                )}
                {activeLeadModal.email && (
                  <p>
                    <strong className="text-slate-400">อีเมล:</strong>{' '}
                    <span className="text-slate-200 font-mono">{maskEmail(activeLeadModal.email)}</span>
                  </p>
                )}
              </div>


              {/* Portfolio Claim Status / Action */}
              <div className="pt-1">
                {isClaimedByMe ? (
                  <div className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>อยู่ในพอร์ตงานขายของคุณแล้ว</span>
                  </div>
                ) : claimedByOther ? (
                  <div className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>ถูกดูแลโดยคุณ <strong className="text-white">{claimedByOther}</strong></span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!isProUnlocked) {
                        requireProAccess('หยิบโรงงานเข้าพอร์ตลูกค้า');
                        return;
                      }
                      handleClaimFactoryLead(activeLeadModal);
                    }}
                    disabled={isClaimingLead}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                  >
                    {isClaimingLead ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังดึงเข้าพอร์ต...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>🛒 หยิบใส่พอร์ตของฉัน (Claim to Portfolio)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                {activeLeadModal.phone ? (
                  isProUnlocked ? (
                    <a
                      href={`tel:${activeLeadModal.phone.replace(/[^0-9]/g, '')}`}
                      className="h-11 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>โทร {activeLeadModal.phone}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => requireProAccess('ดูเบอร์โทรศัพท์และติดต่อโรงงาน')}
                      className="h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-sm"
                    >
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>ปลดล็อกเบอร์โทร</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setActiveLeadModal(null)}
                    className="h-11 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                )}

                {isProUnlocked ? (
                  <a
                    href={activeLeadModal.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${activeLeadModal.lat},${activeLeadModal.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 fill-slate-950 shrink-0" />
                    <span>เปิด GPS นำทาง</span>
                  </a>
                ) : (
                  <button
                    onClick={() => requireProAccess('เปิดแผนที่ GPS นำทางโรงงาน')}
                    className="h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>ปลดล็อก GPS นำทาง</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

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
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
      <PendingInvitationModal />

      {/* 7. Vehicle Mileage & Trip Modal */}
      <VehicleTripModal
        isOpen={isVehicleTripModalOpen}
        onClose={() => setIsVehicleTripModalOpen(false)}
        activeTrip={activeTrip}
        initialMode={tripModalMode}
        onTripUpdated={() => {
          fetchActiveTrip();
        }}
      />

      {/* 8. Fuel & Mileage Reimbursement Audit Modal (Management) */}
      <MileageFuelReportModal
        isOpen={isFuelReportModalOpen}
        onClose={() => setIsFuelReportModalOpen(false)}
      />

      {/* 9. Release Lead to Unassigned Pool Modal (Model 1) */}
      <ReleaseLeadModal
        isOpen={!!releaseModalLead}
        lead={releaseModalLead}
        onClose={() => setReleaseModalLead(null)}
        onConfirmRelease={handleConfirmReleaseLead}
      />

      {/* 10. Access Lock & Freemium Preview Gate Modal */}
      <AccessLockModal
        isOpen={isAccessLockModalOpen}
        onClose={() => setIsAccessLockModalOpen(false)}
        featureName={accessLockFeatureName}
      />

    </div>
  );
}

