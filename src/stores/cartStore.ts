import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  shopId: string;
  shopName: string;
  quantity: number;
  preparationTime?: string;
  stockQty?: number;
}

interface CartStore {
  items: CartProduct[];
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find(
          (i) => i.productId === product.productId
        );
        const maxAllowed =
          Number.isFinite(product.stockQty) && (product.stockQty as number) >= 0
            ? (product.stockQty as number)
            : Number.POSITIVE_INFINITY;

        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === product.productId
                ? {
                    ...i,
                    stockQty:
                      Number.isFinite(product.stockQty) && (product.stockQty as number) >= 0
                        ? product.stockQty
                        : i.stockQty,
                    quantity: Math.min(i.quantity + 1, maxAllowed),
                  }
                : i
            ),
          }));
        } else {
          if (maxAllowed <= 0) return;
          set((state) => ({
            items: [
              ...state.items,
              { ...product, quantity: Math.min(Math.max(product.quantity || 1, 1), maxAllowed) },
            ],
          }));
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  quantity:
                    Number.isFinite(i.stockQty) && (i.stockQty as number) >= 0
                      ? Math.min(quantity, i.stockQty as number)
                      : quantity,
                }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "sovga-cart" }
  )
);
