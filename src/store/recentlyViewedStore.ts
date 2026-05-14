import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/products';

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  items: Product[];
  addItem: (product: Product) => void;
  clearAll: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const current = get().items.filter((p) => p.id !== product.id);
        set({ items: [product, ...current].slice(0, MAX_ITEMS) });
      },

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'darshan-recently-viewed',
    }
  )
);
