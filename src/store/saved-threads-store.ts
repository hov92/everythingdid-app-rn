import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'everythingdid-saved-threads';

type SavedThreadsState = {
  savedIds: number[];
  hydrated: boolean;
  hydrateSaved: () => Promise<void>;
  isSaved: (id: number) => boolean;
  toggleSaved: (id: number) => Promise<void>;
};

export const useSavedThreadsStore = create<SavedThreadsState>((set, get) => ({
  savedIds: [],
  hydrated: false,

  hydrateSaved: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      set({
        savedIds: Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [],
        hydrated: true,
      });
    } catch {
      set({ savedIds: [], hydrated: true });
    }
  },

  isSaved: (id: number) => get().savedIds.includes(Number(id)),

  toggleSaved: async (id: number) => {
    const current = get().savedIds;
    const numId = Number(id);
    const next = current.includes(numId)
      ? current.filter((x) => x !== numId)
      : [...current, numId];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ savedIds: next });
  },
}));