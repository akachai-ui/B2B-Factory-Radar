'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Lock,
  Mail,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { PdpaTermsModal } from './PdpaTermsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isPdpaModalOpen, setIsPdpaModalOpen] = useState<boolean>(false);
  const [pdpaTab, setPdpaTab] = useState<'pdpa' | 'terms'>('pdpa');
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(`Google Auth Error: ${error.message || JSON.stringify(error)}`);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else {
          setSuccessMessage('เข้าสู่ระบบสำเร็จ! กำลังไปที่ Dashboard...');
          setTimeout(() => {
            onClose();
            window.location.href = '/dashboard';
          }, 600);
        }
      } else {
        const { error } = await signUp(email, password, fullName, companyName);
        if (error) {
          setErrorMessage(error.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง');
        } else {
          setSuccessMessage('สมัครสมาชิกสำเร็จ! กำลังไปที่ Dashboard...');
          setTimeout(() => {
            onClose();
            window.location.href = '/dashboard';
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const googleBtnText =
    language === 'zh'
      ? '使用 Google 账号直接登录'
      : language === 'en'
      ? 'Continue with Google'
      : 'เข้าสู่ระบบด้วย Google (Google Sign-In)';

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20">
                <Lock className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {mode === 'signin' ? t('authSignInTitle') : t('authSignUpTitle')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('appName')} Platform
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            
            {/* 1. OFFICIAL GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 font-black text-xs transition shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'กำลังเชื่อมต่อ Google...' : googleBtnText}</span>
            </button>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="break-all">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-semibold">{t('orUseEmail')}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('signUp')}
              </button>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold">
              
              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700">{t('fullNameLabel')}</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={t('fullNamePlaceholder')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">{t('companyNameLabel')}</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={t('companyNamePlaceholder')}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-slate-700">{t('emailInputLabel')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700">{t('passwordInputLabel')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? t('signIn') : t('createAccountBtn')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Subtle Terms & Privacy Footer */}
            <p className="text-[11px] text-center text-slate-400 pt-1 leading-snug">
              การเข้าสู่ระบบถือว่าท่านยอมรับ{' '}
              <button
                type="button"
                onClick={() => {
                  setPdpaTab('terms');
                  setIsPdpaModalOpen(true);
                }}
                className="text-amber-700 font-bold underline hover:text-amber-800 cursor-pointer"
              >
                ข้อกำหนดการให้บริการ
              </button>{' '}
              และ{' '}
              <button
                type="button"
                onClick={() => {
                  setPdpaTab('pdpa');
                  setIsPdpaModalOpen(true);
                }}
                className="text-amber-700 font-bold underline hover:text-amber-800 cursor-pointer"
              >
                นโยบาย PDPA
              </button>
            </p>

          </div>

        </div>

      </div>

      <PdpaTermsModal
        isOpen={isPdpaModalOpen}
        onClose={() => setIsPdpaModalOpen(false)}
        defaultTab={pdpaTab}
      />
    </>
  );
};
