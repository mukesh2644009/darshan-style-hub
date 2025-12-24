import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        set({
          user: data.user,
          isAuthenticated: true,
          isAdmin: data.user.role === 'ADMIN',
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to login' };
    }
  },

  register: async (name, email, phone, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (data.success) {
        set({
          user: data.user,
          isAuthenticated: true,
          isAdmin: data.user.role === 'ADMIN',
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to register' };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.clear();
        // Force clear the state
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success && data.user) {
        set({
          user: data.user,
          isAuthenticated: true,
          isAdmin: data.user.role === 'ADMIN',
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));

