import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addToServerCart,
  clearServerCart,
  fetchServerCart,
  removeFromServerCart,
  ServerCart,
  updateServerCartItem,
} from "../lib/api";
import { useShopCartSessionStore } from "./shop-cart-session-store";

export type CartItem = {
  productId: number;
  cartItemKey?: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  stockStatus?: string;
  lineSubtotal?: string;
};

type ShopCartState = {
  items: CartItem[];
  subtotal?: string;
  total?: string;
  currency?: string;
  count: number;
  syncing: boolean;
  lastError?: string;

  hydrateFromServer: () => Promise<void>;
  addItem: (
    item: Omit<CartItem, "quantity" | "cartItemKey" | "lineSubtotal">,
    quantity?: number,
  ) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  setQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  getItemQuantity: (productId: number) => number;
  itemCount: () => number;
};

function mapServerCart(cart: ServerCart): Pick<
  ShopCartState,
  "items" | "subtotal" | "total" | "currency" | "count"
> {
  return {
    items: (cart.items ?? []).map((item) => ({
      productId: Number(item.product_id),
      cartItemKey: item.cart_item_key,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: Number(item.quantity ?? 0),
      stockStatus: item.stock_status,
      lineSubtotal: item.line_subtotal,
    })),
    subtotal: cart.totals?.subtotal,
    total: cart.totals?.total,
    currency: cart.totals?.currency,
    count: Number(cart.count ?? 0),
  };
}

function getCartToken() {
  return useShopCartSessionStore.getState().ensureCartToken();
}

export const useShopCartStore = create<ShopCartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: undefined,
      total: undefined,
      currency: undefined,
      count: 0,
      syncing: false,
      lastError: undefined,

      hydrateFromServer: async () => {
        const cartToken = getCartToken();

        set({ syncing: true, lastError: undefined });

        try {
          const cart = await fetchServerCart(cartToken);
          set({
            ...mapServerCart(cart),
            syncing: false,
            lastError: undefined,
          });
        } catch (e: any) {
          set({
            syncing: false,
            lastError: e?.message || "Could not sync cart",
          });
          throw e;
        }
      },

      addItem: async (item, quantity = 1) => {
        const cartToken = getCartToken();

        set({ syncing: true, lastError: undefined });

        try {
          const cart = await addToServerCart({
            productId: item.productId,
            quantity,
            cartToken,
          });

          set({
            ...mapServerCart(cart),
            syncing: false,
            lastError: undefined,
          });
        } catch (e: any) {
          set({
            syncing: false,
            lastError: e?.message || "Could not add item",
          });
          throw e;
        }
      },

      removeItem: async (productId) => {
        const cartToken = getCartToken();
        const existing = get().items.find((x) => x.productId === productId);
        if (!existing?.cartItemKey) return;

        set({ syncing: true, lastError: undefined });

        try {
          const cart = await removeFromServerCart({
            cartItemKey: existing.cartItemKey,
            cartToken,
          });

          set({
            ...mapServerCart(cart),
            syncing: false,
            lastError: undefined,
          });
        } catch (e: any) {
          set({
            syncing: false,
            lastError: e?.message || "Could not remove item",
          });
          throw e;
        }
      },

      setQuantity: async (productId, quantity) => {
        const cartToken = getCartToken();
        const existing = get().items.find((x) => x.productId === productId);
        if (!existing?.cartItemKey) return;

        set({ syncing: true, lastError: undefined });

        try {
          const cart = await updateServerCartItem({
            cartItemKey: existing.cartItemKey,
            quantity,
            cartToken,
          });

          set({
            ...mapServerCart(cart),
            syncing: false,
            lastError: undefined,
          });
        } catch (e: any) {
          set({
            syncing: false,
            lastError: e?.message || "Could not update quantity",
          });
          throw e;
        }
      },

      clearCart: async () => {
        const cartToken = getCartToken();

        set({ syncing: true, lastError: undefined });

        try {
          const cart = await clearServerCart(cartToken);

          set({
            ...mapServerCart(cart),
            syncing: false,
            lastError: undefined,
          });
        } catch (e: any) {
          set({
            syncing: false,
            lastError: e?.message || "Could not clear cart",
          });
          throw e;
        }
      },

      getItemQuantity: (productId) => {
        const item = get().items.find((x) => x.productId === productId);
        return item?.quantity ?? 0;
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "shop-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        total: state.total,
        currency: state.currency,
        count: state.count,
      }),
    },
  ),
);