"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useCartStore } from "@/store/cart-store";
import { Cart } from "@/types";

export function useCart() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await api.get<Cart>("/cart/");
      setCart(response.data);
      return response.data;
    }
  });

  const addToCart = useMutation({
    mutationFn: async (payload: { product_variant_id: number; quantity: number }) => {
      const response = await api.post<Cart>("/cart/add/", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setCart(data);
      queryClient.setQueryData(["cart"], data);
    }
  });

  const updateCartItem = useMutation({
    mutationFn: async (payload: { item_id: number; quantity: number }) => {
      const response = await api.put<Cart>(`/cart/update/${payload.item_id}/`, {
        quantity: payload.quantity
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCart(data);
      queryClient.setQueryData(["cart"], data);
    }
  });

  const removeCartItem = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await api.delete<Cart>(`/cart/remove/${itemId}/`);
      return response.data;
    },
    onSuccess: (data) => {
      setCart(data);
      queryClient.setQueryData(["cart"], data);
    }
  });

  return {
    ...cartQuery,
    addToCart,
    updateCartItem,
    removeCartItem
  };
}
