'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'school_admin' | 'super_admin' | 'admin';
  school_id?: string | null;
  grade?: number | null;
  total_xp?: number;
  level?: number;
  current_streak?: number;
  avatar_style: string | null;
  bio?: string | null;
  phone?: string | null;
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
  isTransitioning: boolean;
  setTransition: (val: boolean) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string; two_factor_required?: boolean; userId?: string }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isTransitioning: false,
  setTransition: () => { },
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setTransition = useCallback((val: boolean) => {
    setIsTransitioning(val);
  }, []);

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

  const signIn = useCallback(async (email: string, password: string, role: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Invalid credentials' };

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
    setIsTransitioning(true);
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
      // Transition state stays true until the global layout/next page mounts
    }
  }, [router]);

  const pathname = usePathname();

  useEffect(() => {
    setIsTransitioning(false);
  }, [pathname]);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, isTransitioning, setTransition,
      signIn, signOut, refreshProfile: fetchProfile
    }}>
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md transition-opacity duration-500">
          <div className="relative w-24 h-24">
            <img src="/assets/loading.svg" alt="Loading" className="w-full h-full object-contain mix-blend-multiply opacity-70" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin opacity-20" />
          </div>
          <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
            Finalizing Secure Channel
          </p>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
