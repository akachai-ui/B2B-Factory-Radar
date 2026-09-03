'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { CompanyProfile, Company } from '@/lib/types';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role?: string | null;
  company_id?: string | null;
  company?: Company | null;
  company_name?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  company_lat?: number | null;
  company_lng?: number | null;
  company_radius_km?: number | null;
  subscription_tier?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, fullName: string, companyName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateCompanyProfile: (data: Partial<CompanyProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, userEmail: string, userMetadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else {
        const userName = userMetadata?.full_name || userMetadata?.name || userEmail.split('@')[0] || 'สมาชิกทีมขาย';
        const defaultCompanyName = userMetadata?.company_name || `บริษัทของคุณ ${userName}`;

        const defaultProf: UserProfile = {
          id: userId,
          email: userEmail,
          full_name: userName,
          company_name: defaultCompanyName,
          phone: '',
          role: 'owner',
          subscription_tier: 'pro',
        };
        setProfile(defaultProf);

        supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          full_name: defaultProf.full_name,
          company_name: defaultProf.company_name,
          role: 'owner',
          updated_at: new Date().toISOString(),
        }).then(() => {});
      }
    } catch (err) {
      console.warn('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Handle OAuth PKCE exchange code in URL (?code=...) & hash fragment (#access_token=...)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
          if (session?.user && isMounted) {
            setUser(session.user);
            fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata);
            setLoading(false);
            window.location.href = '/dashboard';
          }
        });
      }

      if (window.location.hash.includes('access_token=')) {
        setTimeout(() => {
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 300);
      }
    }

    // 2. Get initial Supabase session & verify user is still active in database
    supabase.auth.getUser().then(({ data: { user: activeUser }, error }) => {
      if (!isMounted) return;
      if (error || !activeUser) {
        // User was deleted from Supabase backend
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        setUser(activeUser);
        fetchProfile(activeUser.id, activeUser.email || '', activeUser.user_metadata);
        setLoading(false);
      }
    });

    // 3. Listen to auth changes (e.g. SIGNED_IN, SIGNED_OUT from OAuth)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
      } else {
        const currentUser = session.user;
        setUser(currentUser);
        fetchProfile(currentUser.id, currentUser.email || '', currentUser.user_metadata);
        if (event === 'SIGNED_IN' && typeof window !== 'undefined' && window.location.pathname === '/') {
          window.location.href = '/dashboard';
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectOrigin}/dashboard`,
      },
    });

    // Explicitly navigate to Google OAuth URL
    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }

    return { error };
  };

  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user.email || '', data.user.user_metadata);
    }
    return { error };
  };

  const signUp = async (email: string, pass: string, fullName: string, companyName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (data.user && !error) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          company_name: companyName,
          company_lat: 13.6304636,
          company_lng: 100.708154,
          company_radius_km: 15,
          subscription_tier: 'pro',
        });
      } catch (e) {
        console.warn('Upsert profile error:', e);
      }

      await fetchProfile(data.user.id, data.user.email || '', data.user.user_metadata);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateCompanyProfile = async (data: Partial<CompanyProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.company_name = data.name;
    if (data.address !== undefined) updatePayload.company_address = data.address;
    if (data.phone !== undefined) updatePayload.company_phone = data.phone;
    if (data.contact_person !== undefined) updatePayload.full_name = data.contact_person;
    if (data.lat !== undefined) updatePayload.company_lat = data.lat;
    if (data.lng !== undefined) updatePayload.company_lng = data.lng;
    if (data.radius_km !== undefined) updatePayload.company_radius_km = data.radius_km;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile(user.id, user.email || '');
    }

    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateCompanyProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
