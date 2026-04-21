"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { api } from "@/lib/api";

interface WishlistItem {
  id: number;
  added_at: string;
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    image: string | null;
  };
}

export default function AccountWishlistPage() {
  const queryClient = useQueryClient();

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await api.get("/wishlist/");
      return response.data as WishlistItem[];
    },
  });

  const removeItem = useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`/wishlist/remove/${productId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const items = wishlistQuery.data || [];

  return (
    <section className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <AccountSidebar activeTab="wishlist" />

        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface p-6">
            <h1 className="mb-6 font-display text-4xl uppercase">Wishlist</h1>

            {wishlistQuery.isLoading ? (
              <p className="text-white/60">Loading wishlist...</p>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 p-4">
                    <Link href={`/products/${item.product.slug}`} className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                        <Image
                          src={item.product.image || "https://images.pexels.com/photos/6311605/pexels-photo-6311605.jpeg?auto=compress&cs=tinysrgb&w=900"}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.product.name}</p>
                        <p className="text-sm text-white/60">${item.product.price}</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => removeItem.mutate(item.product.id)}
                      disabled={removeItem.isPending}
                      className="text-xs uppercase tracking-[0.2em] text-white/55 transition hover:text-white disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <>
                <p className="text-white/60">Your wishlist is empty.</p>
                <Link
                  href="/products"
                  className="mt-4 inline-block rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-red-500 hover:text-white"
                >
                  Browse Products
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
