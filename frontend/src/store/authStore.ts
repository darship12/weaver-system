import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, setAccessToken } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      init: async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const { data: refreshData } = await authAPI.refresh(refresh);
          setAccessToken(refreshData.access);
          if (refreshData.refresh) localStorage.setItem('refresh_token', refreshData.refresh);
          const { data: meData } = await authAPI.me();
          set({ user: meData, isAuthenticated: true });
        } catch {
          setAccessToken(null);
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('weaver-auth');
          set({ user: null, isAuthenticated: false });
        }
      },
      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(username, password);
          setAccessToken(data.access);
          localStorage.setItem('refresh_token', data.refresh);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (e) { set({ isLoading: false }); throw e; }
      },
      logout: async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) { try { await authAPI.logout(refresh); } catch {} }
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('weaver-auth');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'weaver-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
