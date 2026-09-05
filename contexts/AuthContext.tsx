'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live profile from public.profiles in Supabase
  const fetchLiveProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else if (!data) {
        // If profile row doesn't exist yet, insert a clean default
        const newProfile: Partial<UserProfile> = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          account_type: 'individual',
          company_name: null,
          role: 'owner',
        };
        const { data: inserted } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();
        if (inserted) {
          setProfile(inserted as UserProfile);
        }
      }
    } catch (e) {
      console.warn('Profile sync warning:', e);
    }
  }, []);

  // Stale-While-Revalidate: Server Validation on App Load
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Instant Cache Render (0s)
        const { data: { session: cachedSession } } = await supabase.auth.getSession();
        if (mounted && cachedSession?.user) {
          setSession(cachedSession);
          setUser(cachedSession.user);
        }

        // 2. Background Revalidate against Server
        const { data: { user: serverUser }, error: serverError } = await supabase.auth.getUser();

        if (!mounted) return;

        if (serverError || !serverUser) {
          // If User was deleted on the server or token is invalid -> Force Logout
          if (cachedSession) {
            console.warn('User invalidated on server -> Logging out');
            await supabase.auth.signOut();
          }
          setUser(null);
          setSession(null);
          setProfile(null);
        } else {
          // User is valid on server -> sync profile live from DB
          setUser(serverUser);
          await fetchLiveProfile(serverUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // 3. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !currentSession?.user) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await fetchLiveProfile(currentSession.user);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchLiveProfile]);

  // 1-Click Google Login with Dynamic Origin
  const signInWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { error };
  };

  // Sign In with Email / Password
  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.user) {
      setUser(data.user);
      await fetchLiveProfile(data.user);
    }
    return { error };
  };

  // Sign Up with Email / Password
  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });
    if (data?.user) {
      setUser(data.user);
      await fetchLiveProfile(data.user);
    }
    return { error };
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No authenticated user' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      }
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchLiveProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
