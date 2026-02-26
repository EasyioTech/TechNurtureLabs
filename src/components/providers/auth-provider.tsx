'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'school_admin' | 'super_admin' | 'admin';
  school_id: string | null;
  grade: number | null;
  total_xp: number;
  level: number;
  current_streak: number;
  avatar_style: string | null;
};

// We mock Supabase's user shape for legacy component compatibility
type MockUser = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: MockUser | null;
  profile: UserProfile | null;
  session: any | null; // Placeholder for legacy session checks
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setUser({ id: data.user.id, email: data.user.email });
        setSession({ user: { id: data.user.id } });
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.href = '/';
  }, []);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
