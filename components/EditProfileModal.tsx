'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  User,
  Phone,
  Building2,
  Camera,
  Check,
  Loader2,
  Sparkles,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, profile, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [branch, setBranch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
      setPhone(profile?.phone || '');
      setCompanyName(profile?.company_name || '');
      setBranch(profile?.branch || 'สำนักงานใหญ่');
      setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '');
    }
  }, [profile, user, isOpen]);

  if (!isOpen) return null;

  // Upload Image directly to Supabase Storage 'avatars' Bucket (Industry Standard)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ขนาดรูปภาพต้องไม่เกิน 5MB');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file directly to Supabase Storage 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get permanent Public CDN URL
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        company_name: companyName.trim() || null,
        branch: branch.trim() || 'สำนักงานใหญ่',
        avatar_url: avatarUrl.trim() || null,
      });

      if (error) throw error;

      setSuccessMsg('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">ตั้งค่าโปรไฟล์ & รูปภาพ</h3>
              <p className="text-[11px] text-slate-400">สำหรับผู้ใช้ระบบ RouteHunter B2B</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="relative group">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 overflow-hidden border-2 border-slate-800 group-hover:border-amber-400 transition">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{fullName.charAt(0) || '👤'}</span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition cursor-pointer"
                title="เปลี่ยนรูปภาพ"
              >
                <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
                <span>เปลี่ยนรูป</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Quick Upload or Remove */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปจากเครื่อง'}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                >
                  ลบรูป
                </button>
              )}
            </div>

            {/* Preset Avatars */}
            <div className="w-full pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-2 text-center">หรือเลือกรูปโปรไฟล์สำเร็จรูป:</span>
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`h-9 w-9 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 hover:scale-110 ${
                      avatarUrl === url ? 'border-amber-400 shadow-md shadow-amber-500/30 ring-1 ring-amber-400' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>ชื่อ - นามสกุล *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>เบอร์โทรศัพท์ติดต่อ</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ชื่อบริษัท / ทีม</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="เช่น บจก. อินโนวาเทค"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">สาขา</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="สำนักงานใหญ่"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
