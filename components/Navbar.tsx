'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Layers,
  LogOut,
  Building2,
  Sparkles,
  ChevronDown,
  Edit3,
  Check,
  X,
  User,
  ShieldCheck,
  FileText,
  Phone,
  Terminal,
  ExternalLink,
  Camera,
  Upload,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Form State for Profile & Company Editing
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [taxId, setTaxId] = useState(profile?.tax_id || '');
  const [branch, setBranch] = useState(profile?.branch || 'สำนักงานใหญ่');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyPhone, setCompanyPhone] = useState(profile?.company_phone || '');
  const [address, setAddress] = useState(profile?.company_address || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isInvitedMember = Boolean(profile?.company_id && (profile?.role === 'sales' || profile?.role === 'manager'));
  const displayCompanyName = profile?.company_name || 'บริษัทของฉัน';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้งาน';
  const googleAvatar = user?.user_metadata?.avatar_url 
    || user?.user_metadata?.picture 
    || (user?.identities?.[0]?.identity_data as any)?.avatar_url 
    || (user?.identities?.[0]?.identity_data as any)?.picture
    || null;
  const currentAvatar = (profile?.avatar_url && profile.avatar_url.trim() !== '') ? profile.avatar_url : (googleAvatar || null);

  const handleOpenProfileModal = async () => {
    setFullName(profile?.full_name || '');
    setCompanyName(profile?.company_name || `ทีมของ ${displayName}`);
    setTaxId(profile?.tax_id || '');
    setBranch(profile?.branch || 'สำนักงานใหญ่');
    setPhone(profile?.phone || '');
    setCompanyPhone(profile?.company_phone || '');
    setAddress(profile?.company_address || '');
    setAvatarUrl(profile?.avatar_url || currentAvatar || '');
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
    setSaveSuccess(false);

    const targetCompId = profile?.company_id || user?.id;
    if (targetCompId) {
      try {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', targetCompId)
          .maybeSingle();

        if (comp) {
          if (comp.name) setCompanyName(comp.name);
          if (comp.tax_id) setTaxId(comp.tax_id);
          if (comp.branch) setBranch(comp.branch);
          if (comp.phone) setCompanyPhone(comp.phone);
          if (comp.address) setAddress(comp.address);
        }
      } catch (cErr) {
        console.warn('Load company details error:', cErr);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.warn('Storage upload error, using local fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    const handleOpen = () => handleOpenProfileModal();
    window.addEventListener('open-profile-modal', handleOpen);
    return () => window.removeEventListener('open-profile-modal', handleOpen);
  }, [profile, user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const targetCompId = profile?.company_id || user?.id;
    const finalCompName = companyName.trim() || `ทีมของ ${fullName.trim() || displayName}`;

    if (!isInvitedMember && user && targetCompId) {
      try {
        await supabase.from('companies').upsert({
          id: targetCompId,
          name: finalCompName,
          tax_id: taxId.trim() || null,
          branch: branch.trim() || 'สำนักงานใหญ่',
          phone: companyPhone.trim() || null,
          address: address.trim() || null,
          owner_id: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (cErr) {
        console.warn('Upsert company on save error:', cErr);
      }
    }

    if (isInvitedMember) {
      // Invited members can only update their personal name, phone and avatar
      await updateProfile({
        full_name: fullName.trim() || displayName,
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
    } else {
      // Owners can update company details, tax id, branch, name, phone, address, and avatar
      await updateProfile({
        account_type: 'company',
        full_name: fullName.trim() || displayName,
        avatar_url: avatarUrl.trim() || null,
        company_id: targetCompId,
        company_name: finalCompName,
        tax_id: taxId.trim() || null,
        branch: branch.trim() || 'สำนักงานใหญ่',
        phone: phone.trim(),
        company_phone: companyPhone.trim() || null,
        company_address: address.trim() || null,
      });
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setIsProfileModalOpen(false);
      setSaveSuccess(false);
    }, 800);
  };

  return (
    <>
      <header className="backdrop-blur-2xl bg-gradient-to-b from-white/[0.08] via-slate-950/80 to-slate-950/95 sticky top-0 z-50 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 min-w-0 group cursor-pointer">
            <div className="relative h-10 w-10 shrink-0 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-md group-hover:blur-lg transition" />
              <img
                src="/images/logo.png"
                alt="RouteHunter Logo"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white truncate group-hover:text-amber-300 transition">
                  RouteHunter
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 uppercase shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  B2B Radar
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium truncate hidden sm:inline">
                ฐานข้อมูล 989 โรงงาน & วางแผนรูทขาย จ.สมุทรปราการ
              </span>
            </div>
          </Link>

          {/* Right Section: Auth State / User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="relative">
                {/* Logged-In User Button (3D Glass Pill) */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl backdrop-blur-xl bg-white/[0.05] border border-white/15 hover:border-amber-400/40 hover:bg-white/[0.08] transition-all duration-300 cursor-pointer group shadow-lg shadow-black/30 active:scale-95"
                >
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-amber-500/30 border border-amber-300/40">
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '🏢'
                    )}
                  </div>

                  <div className="text-left hidden sm:flex flex-col min-w-0 max-w-[170px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                        {displayName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase backdrop-blur-md border bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {profile?.role === 'owner' ? 'Owner' : profile?.role === 'manager' ? 'Manager' : 'Sales'}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 truncate flex items-center gap-1">
                      <span>{displayCompanyName}</span>
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition shrink-0" />
                </button>

                {/* User Dropdown Menu (3D Frosted Glass) */}
                {isDropdownOpen && (
                  <>
                    <div
                      onClick={() => setIsDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-[2rem] backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/98 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.7)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                      
                      {/* User Info Header */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/60 space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-amber-500/20">
                            {currentAvatar ? (
                              <img
                                src={currentAvatar}
                                alt={displayName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              '🏢'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">{displayName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {profile?.role === 'owner' ? 'Owner' : profile?.role === 'manager' ? 'Manager' : 'Sales'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        <div className="pt-2 text-[11px] text-amber-300/90 font-medium truncate flex items-center gap-1.5 border-t border-slate-900">
                          <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{displayCompanyName}</span>
                        </div>
                      </div>

                      {/* Edit Profile Action */}
                      <button
                        onClick={handleOpenProfileModal}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span>ตั้งค่าโปรไฟล์ & ข้อมูลบริษัท</span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-slate-800 my-1" />

                      {/* Sign Out Action */}
                      <button
                        onClick={async () => {
                          setIsDropdownOpen(false);
                          await signOut();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 text-xs font-medium flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>ทดลองใช้ฟรี</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Profile & Company Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            onClick={() => setIsProfileModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-black text-white">ตั้งค่าโปรไฟล์ & ข้อมูลบริษัท/ทีม</h4>
                <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลองค์กร ข้อมูลติดต่อ และรูปภาพของคุณ</p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Synced Avatar Section */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border-2 border-amber-500/40 p-0.5 overflow-hidden flex items-center justify-center shadow-lg shadow-amber-500/10 bg-slate-900">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-amber-300 bg-slate-900 rounded-[14px]">
                      {fullName ? fullName.charAt(0).toUpperCase() : '🏢'}
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Avatar Upload Actions & Info */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>รูปภาพโปรไฟล์</span>
                    {googleAvatar && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Google Synced
                      </span>
                    )}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    อัปโหลดรูปจากเครื่อง หรือซิงค์รูปภาพจากบัญชี
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700 shadow-sm"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>เปลี่ยนรูปภาพ</span>
                  </button>

                  {googleAvatar && (
                    <a
                      href="https://myaccount.google.com/personal-info"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-300 transition"
                    >
                      <span>Google Account</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Invited Member Banner (if invited) */}
            {isInvitedMember && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-300">สังกัดองค์กร: {profile?.company_name || 'บริษัท'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {profile?.role === 'manager' ? 'ผู้จัดการ (Manager)' : 'ทีมขาย (Sales)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    บัญชีของคุณได้รับการเชิญเข้าสู่ทีม ข้อมูลองค์กรและสิทธิ์การใช้งานได้รับการดูแลโดย Owner
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 pt-1">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">ชื่อ - นามสกุล หรือ ชื่อเซลส์</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น สมศักดิ์ สายตรวจ"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Company Specific Fields (Only for Workspace Owner) */}
              {!isInvitedMember && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-in fade-in">
                  
                  {/* Company / Workspace Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-300">ชื่อบริษัท / องค์กร / ทีม (White-label)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="เช่น บจก. สยามอินดัสเตรียล ซัพพลาย หรือ ทีมของฉัน"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Tax ID */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">เลขผู้เสียภาษี 13 หลัก <span className="text-[10px] text-slate-500">(ไม่บังคับ)</span></label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="010555xxxxxxx"
                        maxLength={13}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
                      />
                    </div>

                    {/* Branch */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">สาขา</label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="สำนักงานใหญ่"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  {/* Company Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">เบอร์โทรศัพท์บริษัท / สำนักงาน <span className="text-[10px] text-slate-500">(ไม่บังคับ)</span></label>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="เช่น 02-123-4567"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
                    />
                  </div>

                  {/* Company Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">ที่อยู่สำนักงาน / บริษัท <span className="text-[10px] text-slate-500">(ไม่บังคับ)</span></label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="เช่น 123/45 ถ.บางนา-ตราด ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540"
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition resize-none leading-relaxed"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกเรียบร้อย!</span>
                  </>
                ) : isSaving ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
