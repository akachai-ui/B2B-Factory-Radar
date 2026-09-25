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
  isSuperAdmin: boolean;
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
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Fetch live profile from public.profiles in Supabase with auto-merge for invited users
  const fetchLiveProfile = useCallback(async (currentUser: User) => {
    try {
      const cleanEmail = currentUser.email?.toLowerCase().trim() || '';
      
      // 0. Check if this email has a team invitation (either pending or accepted)
      let matchedInvite: any = null;
      if (cleanEmail) {
        try {
          const { data: invData } = await supabase
            .from('team_invitations')
            .select('*')
            .ilike('email', cleanEmail)
            .in('status', ['pending', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (invData) {
            matchedInvite = invData;
          }
        } catch (invErr) {
          console.warn('Team invitation lookup warning:', invErr);
        }
      }

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

      // 3. If there is a team invitation AND (user has no profile OR user is stuck with a fallback personal company id OR invite is pending)
      const isStuckInPersonalCompany = !data || !data.company_id || data.company_id === currentUser.id || data.company_name === 'บริษัทของฉัน';
      if (matchedInvite && (isStuckInPersonalCompany || matchedInvite.status === 'pending')) {
        let targetComp: any = null;
        try {
          const { data: cData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', matchedInvite.company_id)
            .maybeSingle();
          targetComp = cData;
        } catch (cErr) {
          console.warn('Fetch target invite company error:', cErr);
        }

        const compName = targetComp?.name || matchedInvite.company_name || 'บริษัทของฉัน';
        const branch = targetComp?.branch || 'สำนักงานใหญ่';
        const taxId = targetComp?.tax_id || null;
        const phone = targetComp?.phone || null;
        const role = matchedInvite.role || 'sales';

        // Clean up any fallback dummy company created previously for this user
        if (data?.company_id === currentUser.id || isStuckInPersonalCompany) {
          try {
            await supabase.from('companies').delete().eq('id', currentUser.id);
          } catch (delErr) {
            console.warn('Clean up dummy company error:', delErr);
          }
        }

        if (data) {
          await supabase
            .from('profiles')
            .update({
              company_id: matchedInvite.company_id,
              company_name: compName,
              branch: branch,
              tax_id: taxId,
              phone: phone || data.phone || null,
              role: role,
              account_type: 'company',
              status: 'active',
              onboarded: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentUser.id);

          if (matchedInvite.status !== 'accepted') {
            await supabase
              .from('team_invitations')
              .update({ status: 'accepted', updated_at: new Date().toISOString() })
              .eq('id', matchedInvite.id);
          }

          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (updatedProfile) data = updatedProfile;
        } else {
          const initialAvatar = currentUser.user_metadata?.avatar_url 
            || currentUser.user_metadata?.picture 
            || (currentUser.identities?.[0]?.identity_data as any)?.avatar_url 
            || (currentUser.identities?.[0]?.identity_data as any)?.picture 
            || null;
          const userName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || cleanEmail.split('@')[0] || 'ผู้ใช้งาน';

          const newProfilePayload: any = {
            id: currentUser.id,
            email: cleanEmail,
            full_name: userName,
            avatar_url: initialAvatar,
            account_type: 'company',
            company_id: matchedInvite.company_id,
            company_name: compName,
            branch: branch,
            tax_id: taxId,
            phone: phone,
            role: role,
            status: 'active',
            onboarded: true,
          };

          const { data: inserted } = await supabase
            .from('profiles')
            .insert([newProfilePayload])
            .select()
            .maybeSingle();

          if (matchedInvite.status !== 'accepted') {
            await supabase
              .from('team_invitations')
              .update({ status: 'accepted', updated_at: new Date().toISOString() })
              .eq('id', matchedInvite.id);
          }

          data = inserted || (newProfilePayload as any);
        }
      }

      // 4. If profile exists by ID, but has no company_id, check if legacy invite existed in profiles
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
              status: 'active',
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

        // 1. Query system_admins table in Supabase
        let adminGranted = false;
        try {
          const { data: adminRow } = await supabase
            .from('system_admins')
            .select('*')
            .or(`email.ilike.${cleanEmail},user_id.eq.${currentUser.id}`)
            .maybeSingle();

          if (adminRow) {
            adminGranted = true;
          }
        } catch (adminErr) {
          console.warn('System admin lookup warning:', adminErr);
        }

        const effectiveSuperAdmin = adminGranted;
        setIsSuperAdmin(effectiveSuperAdmin);

        // 2. Check if Company / Workspace Owner is PRO_UNLOCKED or Super Admin
        let isCompanyUnlocked = false;
        const compIdToCheck = data.company_id;
        if (compIdToCheck) {
          try {
            // Find the workspace owner
            const { data: ownerProf } = await supabase
              .from('profiles')
              .select('id, email, access_status, role')
              .eq('company_id', compIdToCheck)
              .eq('role', 'owner')
              .maybeSingle();

            if (ownerProf) {
              if (ownerProf.access_status === 'PRO_UNLOCKED') {
                isCompanyUnlocked = true;
              } else if (ownerProf.email) {
                const { data: ownerAdmin } = await supabase
                  .from('system_admins')
                  .select('id')
                  .ilike('email', ownerProf.email.toLowerCase().trim())
                  .maybeSingle();
                if (ownerAdmin) {
                  isCompanyUnlocked = true;
                }
              }
            } else {
              // Also check company table directly
              const { data: compRow } = await supabase
                .from('companies')
                .select('owner_id')
                .eq('id', compIdToCheck)
                .maybeSingle();
              if (compRow?.owner_id) {
                const { data: directOwner } = await supabase
                  .from('profiles')
                  .select('access_status, email')
                  .eq('id', compRow.owner_id)
                  .maybeSingle();
                if (directOwner?.access_status === 'PRO_UNLOCKED') {
                  isCompanyUnlocked = true;
                } else if (directOwner?.email) {
                  const { data: directAdmin } = await supabase
                    .from('system_admins')
                    .select('id')
                    .ilike('email', directOwner.email.toLowerCase().trim())
                    .maybeSingle();
                  if (directAdmin) isCompanyUnlocked = true;
                }
              }
            }
          } catch (cLockErr) {
            console.warn('Check company owner lock status error:', cLockErr);
          }
        }

        const resolvedAccessStatus = (effectiveSuperAdmin || data.access_status === 'PRO_UNLOCKED' || isCompanyUnlocked) 
          ? 'PRO_UNLOCKED' 
          : (data.access_status || 'PENDING_APPROVAL');

        // If the status is resolved to PRO_UNLOCKED, sync status to active in profile row
        if (resolvedAccessStatus === 'PRO_UNLOCKED' && data.status !== 'active') {
          try {
            await supabase.from('profiles').update({
              status: 'active',
              updated_at: new Date().toISOString(),
            }).eq('id', currentUser.id);
            data.status = 'active';
          } catch (syncErr) {
            console.warn('Auto sync status to DB warning:', syncErr);
          }
        }

        const isUserOwner = data.role === 'owner' || !data.company_id || data.company_id === currentUser.id;
        const effectiveCompId = data.company_id || currentUser.id;
        const defaultCompName = data.company_name || `ทีมของ ${data.full_name || cleanEmail.split('@')[0]}`;

        // Ensure company record exists in public.companies table ONLY for owner
        if (isUserOwner) {
          try {
            const compPayload: any = {
              id: effectiveCompId,
              name: defaultCompName,
              branch: data.branch || 'สำนักงานใหญ่',
              tax_id: data.tax_id || null,
              phone: data.phone || null,
              owner_id: currentUser.id,
            };
            await supabase.from('companies').upsert(compPayload, { onConflict: 'id' });
          } catch (compErr) {
            console.warn('Auto ensure company error:', compErr);
          }
        }

        // If profile was missing company_id or marked as individual, update profile to Company-First
        if (!data.company_id || data.account_type !== 'company') {
          try {
            await supabase.from('profiles').update({
              company_id: effectiveCompId,
              company_name: defaultCompName,
              account_type: 'company',
              role: data.role || (isUserOwner ? 'owner' : 'sales'),
              updated_at: new Date().toISOString(),
            }).eq('id', currentUser.id);
            data.company_id = effectiveCompId;
            data.company_name = defaultCompName;
            data.account_type = 'company';
            data.role = data.role || (isUserOwner ? 'owner' : 'sales');
          } catch (upErr) {
            console.warn('Update profile company-first error:', upErr);
          }
        }

        const finalProfileData: UserProfile = {
          ...(data as UserProfile),
          company_id: effectiveCompId,
          company_name: defaultCompName,
          account_type: 'company',
          role: (data.role || (isUserOwner ? 'owner' : 'sales')) as any,
          access_status: resolvedAccessStatus as any,
          avatar_url: resolvedAvatar,
        };

        if (typeof window !== 'undefined' && currentUser.id) {
          try {
            localStorage.setItem(`rh_cached_profile_${currentUser.id}`, JSON.stringify(finalProfileData));
          } catch (e) {}
        }

        setProfile(finalProfileData);
      } else if (!data) {
        // If profile row doesn't exist yet and no pending invite was found, insert a clean default with Company-First
        let adminGranted = false;
        try {
          const { data: adminRow } = await supabase
            .from('system_admins')
            .select('*')
            .or(`email.ilike.${cleanEmail},user_id.eq.${currentUser.id}`)
            .maybeSingle();

          if (adminRow) {
            adminGranted = true;
          }
        } catch (adminErr) {
          console.warn('System admin lookup on signup warning:', adminErr);
        }

        const effectiveSuperAdmin = adminGranted;
        setIsSuperAdmin(effectiveSuperAdmin);

        const initialAvatar = currentUser.user_metadata?.avatar_url 
          || currentUser.user_metadata?.picture 
          || (currentUser.identities?.[0]?.identity_data as any)?.avatar_url 
          || (currentUser.identities?.[0]?.identity_data as any)?.picture 
          || null;
        const userName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || cleanEmail.split('@')[0] || 'ผู้ใช้งาน';
        const companyName = effectiveSuperAdmin ? 'RouteHunter HQ' : `ทีมของ ${userName}`;

        // Create company record for standalone owner
        try {
          await supabase.from('companies').upsert({
            id: currentUser.id,
            name: companyName,
            branch: 'สำนักงานใหญ่',
            owner_id: currentUser.id,
          }, { onConflict: 'id' });
        } catch (cErr) {
          console.warn('Create initial company error:', cErr);
        }

        const newProfile: Partial<UserProfile> = {
          id: currentUser.id,
          email: cleanEmail,
          full_name: userName,
          avatar_url: initialAvatar,
          account_type: 'company',
          company_id: currentUser.id,
          company_name: companyName,
          branch: 'สำนักงานใหญ่',
          onboarded: true,
          role: 'owner',
          access_status: effectiveSuperAdmin ? 'PRO_UNLOCKED' : 'PENDING_APPROVAL',
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

          // Instant profile cache restoration (0ms)
          if (typeof window !== 'undefined') {
            const cachedProfJson = localStorage.getItem(`rh_cached_profile_${cachedSession.user.id}`);
            if (cachedProfJson) {
              try {
                const parsedProf = JSON.parse(cachedProfJson);
                if (parsedProf && parsedProf.company_id) {
                  setProfile(parsedProf);
                }
              } catch (parseErr) {}
            }
          }
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

    // 4. Realtime subscription for Profile and Access Status changes
    const realtimeChannel = supabase
      .channel('realtime-auth-profile-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async (payload: any) => {
          const { data: { user: liveUser } } = await supabase.auth.getUser();
          if (liveUser && payload.new && payload.new.id === liveUser.id) {
            await fetchLiveProfile(liveUser);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_admins' },
        async () => {
          const { data: { user: liveUser } } = await supabase.auth.getUser();
          if (liveUser) {
            await fetchLiveProfile(liveUser);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchLiveProfile, user?.id]);

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

      // Strip non-DB / client-only fields before sending to Supabase profiles table
      const { access_status, ...dbUpdates } = updates as any;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (data && !error) {
        setProfile((prev) => ({
          ...(data as UserProfile),
          access_status: updates.access_status || prev?.access_status || 'PRO_UNLOCKED',
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
        isSuperAdmin,
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
