"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await api.get("/wishlist/");
      return response.data.results ?? response.data;
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/wishlist/remove/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    }
  });

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Wishlist</h1>
      <div className="space-y-3">
        {(wishlistQuery.data || []).map((item: any) => (
          <article key={item.id} className="card-surface flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-lg font-semibold">{item.product.name}</p>
              <p className="text-sm text-white/60">${item.product.price}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/products/${item.product.slug}`} className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                View
              </Link>
              <button
                onClick={() => removeMutation.mutate(item.product.id)}
                className="rounded-full bg-red-600 px-4 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
