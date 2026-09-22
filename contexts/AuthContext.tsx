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
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
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

  // Fetch live profile from public.profiles in Supabase with auto-merge for invited users
  const fetchLiveProfile = useCallback(async (currentUser: User) => {
    try {
      const cleanEmail = currentUser.email?.toLowerCase().trim() || '';
      
      // 1. First check profile by ID
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      // 2. If profile not found by ID, look up by Email (e.g., user was pre-added to team by Owner)
      if (!data && cleanEmail) {
        const { data: emailProfile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (emailProfile) {
          // Merge: Update the invited profile's id to match currentUser.id
          await supabase
            .from('profiles')
            .update({
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || emailProfile.full_name || cleanEmail.split('@')[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', emailProfile.id);

          const { data: mergedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          data = mergedProfile || emailProfile;
        }
      }

      // 3. If profile exists by ID, but has no company_id, check if an invite existed for this email
      if (data && !data.company_id && cleanEmail) {
        const { data: inviteRow } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .not('company_id', 'is', null)
          .maybeSingle();

        if (inviteRow && inviteRow.id !== currentUser.id) {
          // Adopt the team & company from the invite
          await supabase
            .from('profiles')
            .update({
              company_id: inviteRow.company_id,
              company_name: inviteRow.company_name,
              role: inviteRow.role || 'sales',
              tax_id: inviteRow.tax_id,
              branch: inviteRow.branch,
              account_type: inviteRow.account_type || 'company',
              onboarded: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentUser.id);

          // Remove the duplicate placeholder invite
          await supabase.from('profiles').delete().eq('id', inviteRow.id);

          const { data: updatedWithTeam } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (updatedWithTeam) data = updatedWithTeam;
        }
      }

      if (data && !error) {
        const googleAvatar = currentUser.user_metadata?.avatar_url 
          || currentUser.user_metadata?.picture 
          || (currentUser.identities?.[0]?.identity_data as any)?.avatar_url 
          || (currentUser.identities?.[0]?.identity_data as any)?.picture 
          || null;
        const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`rh_avatar_${currentUser.id}`) : null;
        const resolvedAvatar = (data.avatar_url && data.avatar_url.trim() !== '') 
          ? data.avatar_url 
          : (googleAvatar || cachedAvatar || null);

        const isOwnerAccount = data.role === 'owner' || cleanEmail === 'akachaiha@gmail.com';
        const resolvedAccessStatus = data.access_status || (isOwnerAccount ? 'PRO_UNLOCKED' : 'PENDING_APPROVAL');

        setProfile({
          ...(data as UserProfile),
          role: (data.role || (isOwnerAccount ? 'owner' : 'sales')) as any,
          access_status: resolvedAccessStatus as any,
          avatar_url: resolvedAvatar,
        });
      } else if (!data) {
        // If profile row doesn't exist yet, insert a clean default
        const isMaster = cleanEmail === 'akachaiha@gmail.com';
        const initialAvatar = currentUser.user_metadata?.avatar_url 
          || currentUser.user_metadata?.picture 
          || (currentUser.identities?.[0]?.identity_data as any)?.avatar_url 
          || (currentUser.identities?.[0]?.identity_data as any)?.picture 
          || null;
        const newProfile: Partial<UserProfile> = {
          id: currentUser.id,
          email: cleanEmail,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || cleanEmail.split('@')[0] || 'ผู้ใช้งาน',
          avatar_url: initialAvatar,
          account_type: isMaster ? 'company' : 'individual',
          company_name: isMaster ? 'RouteHunter HQ' : null,
          onboarded: isMaster,
          role: isMaster ? 'owner' : 'sales',
          access_status: isMaster ? 'PRO_UNLOCKED' : 'PENDING_APPROVAL',
        };
        const { data: inserted } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();
        if (inserted) {
          setProfile(inserted as UserProfile);
        } else {
          setProfile(newProfile as UserProfile);
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
        // 1. Instant Cache Check (0ms)
        const { data: { session: cachedSession } } = await supabase.auth.getSession();
        
        if (!cachedSession?.user) {
          // Not logged in -> Immediately show Landing Page without network blocking
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(cachedSession);
          setUser(cachedSession.user);
        }

        // 2. Background Revalidate against Server with safety timeout
        const serverUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: new Error('Auth timeout') }), 4000)
        );

        const { data: { user: serverUser }, error: serverError } = (await Promise.race([
          serverUserPromise,
          timeoutPromise,
        ])) as any;

        if (!mounted) return;

        if (serverError || !serverUser) {
          if (serverError?.message !== 'Auth timeout') {
            console.warn('User invalidated on server -> Logging out');
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        } else {
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

    const failsafeTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 800);

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
      clearTimeout(failsafeTimer);
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

  // 1-Click Facebook Login with Dynamic Origin
  const signInWithFacebook = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: redirectUrl,
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
      if (typeof window !== 'undefined' && updates.avatar_url !== undefined) {
        if (updates.avatar_url) {
          localStorage.setItem(`rh_avatar_${user.id}`, updates.avatar_url);
        } else {
          localStorage.removeItem(`rh_avatar_${user.id}`);
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (data && !error) {
        setProfile((prev) => ({
          ...(data as UserProfile),
          avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : (data.avatar_url || prev?.avatar_url || null),
        }));
      } else {
        // Optimistic local state update in case of column schema difference
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return { error };
    } catch (err) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
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
        signInWithFacebook,
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
