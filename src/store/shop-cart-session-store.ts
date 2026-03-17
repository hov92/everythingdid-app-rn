import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ShopCartSessionState = {
  cartToken: string;
  ensureCartToken: () => string;
};

function makeCartToken() {
  return `edcart_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export const useShopCartSessionStore = create<ShopCartSessionState>()(
  persist(
    (set, get) => ({
      cartToken: makeCartToken(),
      ensureCartToken: () => {
        const current = get().cartToken;
        if (current) return current;

        const next = makeCartToken();
        set({ cartToken: next });
        return next;
      },
    }),
    {
      name: "shop-cart-session",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);