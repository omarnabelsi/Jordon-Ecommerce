"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { Cart, Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  showQuickActions?: boolean;
}

function toAmount(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDiscountPercent(price: string, salePrice?: string | null) {
  if (!salePrice) return null;

  const original = toAmount(price);
  const discounted = toAmount(salePrice);

  if (!original || original <= discounted) return null;
  return Math.round(((original - discounted) / original) * 100);
}

export function ProductCard({ product, priority = false, showQuickActions = true }: ProductCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);
  const user = useAuthStore((state) => state.user);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const image =
    product.primary_image ||
    "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=900";

  const rating = useMemo(() => (4.4 + (product.id % 6) * 0.1).toFixed(1), [product.id]);
  const discountPercent = useMemo(() => getDiscountPercent(product.price, product.sale_price), [product.price, product.sale_price]);
  const trendLabel = product.sale_price ? "Best Seller" : product.id % 2 === 0 ? "Trending" : "Top Drop";

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const resolveVariantId = async () => {
    // Product lists may not include variants; fetch full detail before quick-carting.
    const inlineVariant = product.variants?.find((variant) => variant.is_in_stock) || product.variants?.[0];
    if (inlineVariant?.is_in_stock) {
      return inlineVariant.id;
    }

    const response = await api.get<Product>(`/products/${product.slug}/`);
    const variant = response.data.variants?.find((item) => item.is_in_stock) || response.data.variants?.[0];
    if (!variant?.is_in_stock) return null;
    return variant.id;
  };

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const variantId = await resolveVariantId();
      if (!variantId) {
        throw new Error("This product is out of stock.");
      }

      const response = await api.post<Cart>("/cart/add/", {
        product_variant_id: variantId,
        quantity: 1
      });
      return response.data;
    },
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(["cart"], cart);
      setFeedback({ type: "success", message: "Added to cart" });
    },
    onError: (error) => {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFeedback({ type: "error", message: detail || "Could not add this item." });
    }
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      await api.post("/wishlist/add/", { product_id: product.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      setFeedback({ type: "success", message: "Saved to wishlist" });
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
        return;
      }

      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFeedback({ type: "error", message: detail || "Could not save wishlist item." });
    }
  });

  const handleWishlist = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <article className="interactive-card card-surface group overflow-hidden border border-white/10 transition duration-300 hover:border-red-500/50 hover:shadow-glow">
      <div className="relative h-52 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-85" />
        </Link>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full border border-red-300/35 bg-red-600/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            {trendLabel}
          </span>
          {discountPercent ? (
            <span className="rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        {showQuickActions ? (
          <div className="absolute inset-x-3 bottom-3 z-20 flex translate-y-6 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-red-500 hover:text-white disabled:opacity-60"
            >
              <ShoppingBag size={14} />
              {addToCartMutation.isPending ? "Adding" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistMutation.isPending}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:border-red-400 hover:text-red-300 disabled:opacity-60"
              aria-label="Add to wishlist"
            >
              <Heart size={15} />
            </button>
          </div>
        ) : null}
      </div>

      <Link href={`/products/${product.slug}`} className="block space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">{product.brand.name}</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
            <Star size={12} className="fill-current" />
            {rating}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold text-white">{product.name}</h3>

        <div className="flex flex-wrap items-end gap-2">
          <span className="text-xl font-extrabold text-red-500">${toAmount(product.current_price).toFixed(2)}</span>
          {product.sale_price ? (
            <span className="text-sm text-white/40 line-through">${toAmount(product.price).toFixed(2)}</span>
          ) : null}
          {discountPercent ? (
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">Save {discountPercent}%</span>
          ) : null}
        </div>

        {feedback ? (
          <p className={`text-xs uppercase tracking-[0.14em] ${feedback.type === "success" ? "text-emerald-300" : "text-red-300"}`}>
            {feedback.message}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
