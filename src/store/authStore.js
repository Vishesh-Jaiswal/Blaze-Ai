import { create } from 'zustand';
import * as authService from '@/services/authService';

/**
 * Global authentication store with persistent session.
 * Restores from localStorage on init so login survives refreshes.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  status: 'idle', // idle | loading | authenticated | error
  error: null,
  initialized: false,

  /** Restore session from storage on app boot. */
  init: () => {
    const session = authService.getSession();
    if (session?.user) {
      set({ user: session.user, token: session.token, status: 'authenticated', initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  login: async (credentials) => {
    set({ status: 'loading', error: null });
    try {
      const session = await authService.login(credentials);
      set({ user: session.user, token: session.token, status: 'authenticated' });
      return session.user;
    } catch (e) {
      set({ status: 'error', error: e.message });
      throw e;
    }
  },

  signup: async (data) => {
    set({ status: 'loading', error: null });
    try {
      const { user } = await authService.signup(data);
      set({ status: 'idle' });
      return user;
    } catch (e) {
      set({ status: 'error', error: e.message });
      throw e;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, status: 'idle', error: null });
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => !!get().user,
}));
