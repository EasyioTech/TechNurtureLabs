'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { getResponseErrorMessage } from '@/lib/error-utils';

type UserProfile = {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role: 'student' | 'school_admin' | 'super_admin' | 'admin';
  school_id?: string | null;
  grade?: number | null;
  total_xp?: number;
  level?: number;
  current_streak?: number;
  avatar_style?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
};

// We mock Supabase's user shape for legacy component compatibility
type MockUser = {
  id: string;
  email: string | null;
};

type AuthContextType = {
  user: MockUser | null;
  profile: UserProfile | null;
  session: any | null; // Placeholder for legacy session checks
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string; two_factor_required?: boolean; userId?: string }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => { },
  signIn: async () => ({ success: false }),
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
        setUser({ id: data.user.id, email: data.user.email || data.user.phone || '' });
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

  const signIn = useCallback(async (email: string, password: string, role: string) => {
    try {
      let endpoint = '/api/auth/login';
      if (role === 'student') {
        endpoint = '/api/auth/student/login';
      } else if (role === 'school_admin') {
        endpoint = '/api/auth/school/login';
      } else if (role === 'super_admin' || role === 'admin') {
        endpoint = '/api/admin/login';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        // Safely extract error message from response object with role-specific fallback
        const defaultError = role === 'student'
          ? 'Invalid PIN. Please check your email/phone and 6-digit PIN.'
          : 'Invalid credentials';
        const errorMessage = getResponseErrorMessage(data, defaultError);
        return { success: false, error: errorMessage };
      }

      if (data.two_factor_required) {
        return {
          success: true,
          two_factor_required: true,
          userId: data.userId
        };
      }

      await fetchProfile();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Connection failed' };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const toastId = toast.loading('Terminating secure session...');

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfile(null);
      setSession(null);

      toast.success('Session cleared successfully', { id: toastId });
      router.push('/');
    } catch (error) {
      toast.error('Log out failed. Force redirecting...', { id: toastId });
      window.location.href = '/';
    } finally {
      // Clean up
    }
  }, [router]);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));

    // Refresh profile on window focus to handle session rotation/expiration
    const handleFocus = () => {
      if (!document.hidden) {
        fetchProfile();
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signIn, signOut, refreshProfile: fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
