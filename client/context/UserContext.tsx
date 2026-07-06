import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { migrateAuthStorageIfNeeded } from '../lib/secureStorageAdapter';

export type Profile = {
  id: string;
  username: string | null;
};

type UpdateUsernameResult = { error: string | null };
type DeleteAccountResult = { error: string | null };

type UserContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<UpdateUsernameResult>;
  deleteAccount: () => Promise<DeleteAccountResult>;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
};

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateUsername: async () => ({ error: null }),
  deleteAccount: async () => ({ error: null }),
  sessionExpired: false,
  clearSessionExpired: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Distinguishes a user-initiated signOut() from an unexpected SIGNED_OUT
  // (refresh failure) emitted asynchronously by the auth-state listener.
  const isManualSignOutRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .maybeSingle();
      setProfile((data as Profile) ?? { id: userId, username: null });
    } catch {
      setProfile({ id: userId, username: null });
    }
  }, []);

  useEffect(() => {
    // 1. Migrate auth storage from AsyncStorage → SecureStore (one-time, non-fatal)
    // then get current session on mount
    migrateAuthStorageIfNeeded(process.env.EXPO_PUBLIC_SUPABASE_URL!).finally(() => {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        fetchProfile(session?.user?.id).finally(() => setLoading(false));
      });
    });

    // 2. Subscribe to auth state changes. A failed token refresh surfaces here as
    //    SIGNED_OUT with a null session, which clears state and drops the user back
    //    to the auth stack (AppNavigator switches on `session`) — no silent dead session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        if (isManualSignOutRef.current) {
          isManualSignOutRef.current = false;
          setSessionExpired(false);
        } else {
          setSessionExpired(true);
        }
      } else if (session) {
        setSessionExpired(false);
      }
      setSession(session);
      setUser(session?.user ?? null);
      fetchProfile(session?.user?.id);
    });

    // 3. Keep Supabase's token auto-refresh in sync with app foreground state.
    //    autoRefreshToken only ticks while startAutoRefresh() is active; without
    //    this, a backgrounded app's refresh timer stalls and long-lived sessions
    //    silently expire. Start now if we're already foregrounded, then follow
    //    AppState: refresh while active, pause while backgrounded/inactive.
    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(user?.id);
  }, [fetchProfile, user?.id]);

  const updateUsername = useCallback(
    async (username: string): Promise<UpdateUsernameResult> => {
      if (!user?.id) return { error: 'You must be signed in.' };
      const trimmed = username.trim();

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: trimmed, updated_at: new Date().toISOString() });

      if (error) {
        // 23505 = unique_violation → username already taken
        const code = (error as { code?: string }).code;
        if (code === '23505') return { error: 'That username is already taken.' };
        return { error: 'Could not update username. Please try again.' };
      }

      setProfile({ id: user.id, username: trimmed });
      return { error: null };
    },
    [user?.id]
  );

  const signOut = async () => {
    isManualSignOutRef.current = true;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // If sign-out rejects before the local SIGNED_OUT fires, the ref would
      // stay stuck true and mis-flag a later genuine refresh failure as manual.
      // Reset it so only a real manual sign-out is ever treated as one.
      isManualSignOutRef.current = false;
      throw e;
    }
  };

  const deleteAccount = useCallback(async (): Promise<DeleteAccountResult> => {
    if (!user?.id) return { error: 'You must be signed in.' };

    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return { error: 'Could not delete your account. Please try again.' };
    }

    // Clear the local session even though the auth row is gone server-side.
    isManualSignOutRef.current = true;
    try {
      await supabase.auth.signOut();
    } catch {
      // Account is already deleted server-side; if the local sign-out rejects,
      // just reset the ref so it can't mis-flag a future SIGNED_OUT as manual.
      isManualSignOutRef.current = false;
    }
    return { error: null };
  }, [user?.id]);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  return (
    <UserContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
        updateUsername,
        deleteAccount,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
