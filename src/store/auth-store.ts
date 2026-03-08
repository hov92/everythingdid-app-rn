import { create } from 'zustand';

type AuthState = {
  token: string | null;
  username: string | null;
  setAuth: (token: string, username?: string | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  setAuth: (token, username = null) => set({ token, username }),
  clearAuth: () => set({ token: null, username: null }),
}));