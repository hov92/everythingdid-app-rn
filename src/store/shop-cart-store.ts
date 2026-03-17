import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  productId: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  stockStatus?: string;
};

type ShopCartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
  itemCount: () => number;
};

export const useShopCartStore = create<ShopCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (x) => x.productId === item.productId
          );

          if (existing) {
            return {
              items: state.items.map((x) =>
                x.productId === item.productId
                  ? { ...x, quantity: x.quantity + quantity }
                  : x
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((x) => x.productId !== productId),
        }));
      },

      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((x) => x.productId !== productId),
          }));
          return;
        }

        set((state) => ({
          items: state.items.map((x) =>
            x.productId === productId ? { ...x, quantity } : x
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (productId) => {
        const item = get().items.find((x) => x.productId === productId);
        return item?.quantity ?? 0;
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'shop-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);