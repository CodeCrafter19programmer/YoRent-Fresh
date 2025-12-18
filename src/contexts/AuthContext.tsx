import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type Role = 'admin' | 'tenant';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  phone: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<{ error: Error | null; profile: Profile | null }>;
  signUp: (params: { email: string; password: string; fullName?: string }) => Promise<{ error: Error | null; profile: Profile | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const requireLoginAlways =
    typeof import.meta !== 'undefined' &&
    import.meta.env.VITE_REQUIRE_LOGIN_ALWAYS === 'true';

  const mapProfile = (data: any): Profile => ({
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role as Role,
    phone: data.phone,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (typeof window !== 'undefined') {
      console.info('[Auth DEBUG] Fetching profile for:', userId);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        if (typeof window !== 'undefined') {
          console.error('[Auth DEBUG] Error fetching profile', error);
        } else {
          console.error('Error fetching profile', error);
        }
        setProfile(null);
        return null;
      }
      if (data) {
        const mapped = mapProfile(data);
        setProfile(mapped);
        return mapped;
      }
      setProfile(null);
      return null;
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('[Auth DEBUG] Network or unexpected error fetching profile', err);
      } else {
        console.error('Network or unexpected error fetching profile', err);
      }
      setProfile(null);
      return null;
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (typeof window !== 'undefined') {
      console.info('[Auth DEBUG] Starting loadSession...');
    }

    setLoading(true);
    try {
      if (requireLoginAlways) {
        // Clear any existing local session for maximum security
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const {
        data: { session: activeSession },
        error,
      } = await supabase.auth.getSession();
      if (typeof window !== 'undefined') {
        console.info('[Auth DEBUG] supabase.auth.getSession() result:', { activeSession, error });
      }

      if (error) {
        console.error('Error loading session', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      if (activeSession?.user) {
        if (typeof window !== 'undefined') {
          console.info('[Auth DEBUG] Found activeSession.user:', activeSession.user);
        }
        await fetchProfile(activeSession.user.id);
      } else {
        if (typeof window !== 'undefined') {
          console.info('[Auth DEBUG] No active user in session.');
        }
        setProfile(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error during loadSession', err);
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return fetchProfile(user.id);
  }, [fetchProfile, user]);

  useEffect(() => {
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (typeof window !== 'undefined') {
        console.info('[Auth DEBUG] onAuthStateChange triggered', { _event, currentSession });
      }

      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error in onAuthStateChange', err);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile, loadSession]);

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        return { error: new Error(error.message), profile: null };
      }

      setUser(data.user ?? null);
      setSession(data.session ?? null);

      const nextProfile = data.user ? await fetchProfile(data.user.id) : null;
      setLoading(false);
      return { error: null, profile: nextProfile };
    },
    [fetchProfile]
  );

  const signUp = useCallback(
    async ({ email, password, fullName }: { email: string; password: string; fullName?: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName ?? null,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        return { error: new Error(error.message), profile: null };
      }

      // Sign up may or may not return a session depending on email confirmation settings
      if (data.user) {
        setUser(data.user);
        setSession(data.session ?? null);
        const nextProfile = await fetchProfile(data.user.id);
        return { error: null, profile: nextProfile };
      }

      return { error: null, profile: null };
    },
    [fetchProfile]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      return { error: new Error(error.message) };
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
    return { error: null };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [loading, profile, refreshProfile, session, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
