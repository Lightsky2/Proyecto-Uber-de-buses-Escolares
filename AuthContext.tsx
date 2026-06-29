import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Profile } from './types';
import { supabase } from './supabaseClient';
import { MOCK_PROFILES, MOCK_CREDENTIALS } from './mockData';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './authStorage';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  useMock: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        const saved = loadAuthSession();
        if (saved?.profile) {
          setUseMock(saved.useMock);
          setProfile(saved.profile);
        }
        setLoading(false);
      }
    }).catch(() => {
      const saved = loadAuthSession();
      if (saved?.profile) {
        setUseMock(saved.useMock);
        setProfile(saved.profile);
      } else {
        setUseMock(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else if (!useMock) {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      setUseMock(true);
      setLoading(false);
      return;
    }
    setProfile(data as Profile);
    setLoading(false);
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    // Try Supabase first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        await fetchProfile(data.user.id);
        return { error: null };
      }
    } catch {
      // fall through to mock
    }

    // Fall back to mock
    const creds = MOCK_CREDENTIALS[email.toLowerCase()];
    if (creds && creds.password === password) {
      const mockProfile = MOCK_PROFILES.find(p => p.id === creds.profileId);
      if (mockProfile) {
        setUseMock(true);
        setProfile(mockProfile);
        saveAuthSession(mockProfile, true);
        return { error: null };
      }
    }
    return { error: 'Correo o contraseña incorrectos.' };
  }

  async function signOut() {
    clearAuthSession();
    setProfile(null);
    if (!useMock) {
      await supabase.auth.signOut();
    }
    setUseMock(false);
  }

  return (
    <AuthContext.Provider value={{ profile, loading, useMock, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
