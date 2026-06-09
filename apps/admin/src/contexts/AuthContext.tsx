'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAuth,
  fetchAdminMe,
  getStoredAdmin,
  getToken,
  setAuth,
} from '@/lib/api';
import type { AdminProfile } from '@/lib/types';

interface AuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminProfile) => void;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAdmin = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAdmin(null);
      return;
    }

    try {
      const res = await fetchAdminMe();
      setAdmin(res.data);
      setAuth(token, res.data);
    } catch {
      clearAuth();
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const stored = getStoredAdmin<AdminProfile>();
      if (stored) setAdmin(stored);

      await refreshAdmin();
      setIsLoading(false);
    };

    init();
  }, [refreshAdmin]);

  const login = useCallback((token: string, profile: AdminProfile) => {
    setAuth(token, profile);
    setAdmin(profile);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAdmin(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin && !!getToken(),
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
