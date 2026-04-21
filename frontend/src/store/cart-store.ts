import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import { Cart } from "@/types";

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
  totalItems: () => number;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
      totalItems: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return cart.items.reduce((acc, item) => acc + item.quantity, 0);
      }
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : noopStorage))
    }
  )
);
