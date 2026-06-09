import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAccessToken, getRefreshToken, saveRefreshToken, deleteTokens, subscribeAuthChange } from './api';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userProfile: any | null;
  loginWithOtp: (email: string, otp: string) => Promise<{ isNewUser: boolean }>;
  logoutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    // Listen to token changes from API client
    subscribeAuthChange((logged) => {
      setIsLoggedIn(logged);
      if (!logged) {
        setUserProfile(null);
      }
    });

    // Check auth on boot
    async function initAuth() {
      try {
        const refresh = await getRefreshToken();
        if (refresh) {
          // Attempt refresh
          const res = await apiRequest('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: refresh }),
          });
          if (res.success && res.data) {
            setAccessToken(res.data.accessToken);
            if (res.data.refreshToken) {
              await saveRefreshToken(res.data.refreshToken);
            }
            setIsLoggedIn(true);
            
            // Fetch profile
            try {
              const prof = await apiRequest('/profile/me');
              if (prof.success && prof.data) {
                setUserProfile(prof.data);
              }
            } catch {}
          }
        }
      } catch (err) {
        await deleteTokens();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const loginWithOtp = async (email: string, otp: string) => {
    const res = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Verification failed');
    }

    const { accessToken, refreshToken, isNewUser } = res.data;
    setAccessToken(accessToken);
    await saveRefreshToken(refreshToken);
    setIsLoggedIn(true);

    if (!isNewUser) {
      await refreshProfile();
    }

    return { isNewUser };
  };

  const logoutUser = async () => {
    try {
      const refresh = await getRefreshToken();
      if (refresh) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh }),
        });
      }
    } catch {}
    await deleteTokens();
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const prof = await apiRequest('/profile/me');
      if (prof.success && prof.data) {
        setUserProfile(prof.data);
      } else {
        setUserProfile(null);
      }
    } catch {
      setUserProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        userProfile,
        loginWithOtp,
        logoutUser,
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
