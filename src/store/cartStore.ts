import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, size, color) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({
            items: [...items, { product, quantity: 1, selectedSize: size, selectedColor: color }],
          });
        }
      },

      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (item) =>
              !(item.product.id === productId &&
                item.selectedSize === size &&
                item.selectedColor === color)
          ),
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }

        const items = get().items.map((item) =>
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity }
            : item
        );
        set({ items });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    }),
    {
      name: 'darshan-style-hub-cart',
    }
  )
);

