import { create } from 'zustand';
import { Product } from '@/lib/products';

const MAX_COMPARE = 3;

interface CompareState {
  items: Product[];
  isOpen: boolean;
  toggleItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
  isFull: () => boolean;
  openPanel: () => void;
  closePanel: () => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  items: [],
  isOpen: false,

  toggleItem: (product) => {
    const current = get().items;
    const exists = current.some((p) => p.id === product.id);
    if (exists) {
      set({ items: current.filter((p) => p.id !== product.id) });
    } else if (current.length < MAX_COMPARE) {
      set({ items: [...current, product], isOpen: true });
    }
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((p) => p.id !== id) }));
  },

  clearAll: () => set({ items: [], isOpen: false }),

  isInCompare: (id) => get().items.some((p) => p.id === id),

  isFull: () => get().items.length >= MAX_COMPARE,

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
}));
