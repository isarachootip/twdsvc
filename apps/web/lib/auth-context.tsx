'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MeResponse, Role, getHomeRouteForRole, MenuKey } from '@svcm/shared';
import { fetchApi } from './api';

interface AuthContextType {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasMenu: (menuKey: MenuKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchApi<MeResponse>('/me');
      setUser(me);
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('svcm_access_token');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string): Promise<MeResponse> => {
    setIsLoading(true);
    try {
      const res = await fetchApi<{
        user: any;
        accessToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('svcm_access_token', res.accessToken);
      }

      const me = await fetchApi<MeResponse>('/me');
      setUser(me);
      return me;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('svcm_access_token');
      }
      setUser(null);
      router.push('/login');
    }
  };

  const hasMenu = (menuKey: MenuKey): boolean => {
    if (!user) return false;
    return user.menus.includes(menuKey);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshUser,
        hasMenu,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
