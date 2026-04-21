"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { PaginatedResponse, Product } from "@/types";

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  size?: string;
  color?: string;
  available?: boolean;
  sort?: string;
  page?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Product>>("/products/", {
        params: filters
      });
      return response.data;
    }
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Product>>("/products/featured/");
      return response.data.results;
    }
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${slug}/`);
      return response.data;
    },
    enabled: Boolean(slug)
  });
}
