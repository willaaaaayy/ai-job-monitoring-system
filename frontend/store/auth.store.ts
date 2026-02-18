import { create } from 'zustand';
import { User } from '@/types/auth';
import { authUtils } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token: string, user: User) => {
    authUtils.setAuth(token, user);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    authUtils.clearAuth();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  checkAuth: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const user = authUtils.getUser();
    const isAuthenticated = authUtils.isAuthenticated();

    set({
      user,
      isAuthenticated,
      isLoading: false,
    });
  },
}));
