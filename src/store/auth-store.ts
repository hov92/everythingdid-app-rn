import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'everythingdid-auth';

type AuthState = {
  token: string | null;
  username: string | null;
  hydrated: boolean;
  setAuth: (token: string, username?: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrateAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  hydrated: false,

  setAuth: async (token, username = null) => {
    const payload = { token, username };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    set(payload);
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ token: null, username: null });
  },

  hydrateAuth: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw);
      set({
        token: parsed?.token ?? null,
        username: parsed?.username ?? null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
}));