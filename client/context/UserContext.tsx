import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
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
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchProfile(session?.user?.id);
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
  };

  const deleteAccount = useCallback(async (): Promise<DeleteAccountResult> => {
    if (!user?.id) return { error: 'You must be signed in.' };

    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return { error: 'Could not delete your account. Please try again.' };
    }

    // Clear the local session even though the auth row is gone server-side.
    await supabase.auth.signOut();
    return { error: null };
  }, [user?.id]);

  return (
    <UserContext.Provider
      value={{ session, user, profile, loading, signOut, refreshProfile, updateUsername, deleteAccount }}
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
