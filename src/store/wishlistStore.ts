import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/products';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        const exists = items.some((item) => item.id === product.id);
        
        if (!exists) {
          set({ items: [...items, product] });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      toggleItem: (product) => {
        const items = get().items;
        const exists = items.some((item) => item.id === product.id);
        
        if (exists) {
          set({ items: items.filter((item) => item.id !== product.id) });
        } else {
          set({ items: [...items, product] });
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: () => set({ items: [] }),

      getTotalItems: () => get().items.length,
    }),
    {
      name: 'darshan-style-hub-wishlist',
    }
  )
);
