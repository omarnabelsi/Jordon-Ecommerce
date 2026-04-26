"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/hooks/use-cart";

function CartItemSkeleton() {
  return (
    <article className="card-surface flex items-center gap-5 p-5">
      <div className="skeleton-shimmer h-24 w-24 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-3">
        <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        <div className="skeleton-shimmer h-5 w-48 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
      </div>
      <div className="space-y-3 text-right">
        <div className="skeleton-shimmer ml-auto h-5 w-20 rounded-lg" />
        <div className="skeleton-shimmer ml-auto h-3 w-16 rounded-full" />
      </div>
    </article>
  );
}

function CartSummarySkeleton() {
  return (
    <aside className="card-surface h-fit space-y-4 p-6">
      <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
        </div>
        <div className="flex justify-between border-t border-white/15 pt-3">
          <div className="skeleton-shimmer h-5 w-16 rounded" />
          <div className="skeleton-shimmer h-5 w-24 rounded" />
        </div>
      </div>
      <div className="skeleton-shimmer h-12 w-full rounded-full" />
      <div className="skeleton-shimmer mx-auto h-4 w-32 rounded" />
    </aside>
  );
}

export default function CartPage() {
  const { data: cart, isLoading, updateCartItem, removeCartItem } = useCart();

  const subtotal = Number(cart?.subtotal || 0);
  const shipping = subtotal >= 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <section className="container-shell py-12">
        <div className="skeleton-shimmer mb-8 h-12 w-64 rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
          <CartSummarySkeleton />
        </div>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-shell py-16 text-center">
        <h1 className="font-display text-5xl uppercase">Your Cart Is Empty</h1>
        <p className="mt-2 text-white/60">Explore premium drops and add your next pair.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          {cart.items.map((item) => {
            const fallbackImage =
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80";

            return (
              <article key={item.id} className="card-surface flex flex-wrap items-center gap-5 p-5">
                <Link href={`/products/${item.product_slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={item.product_image || fallbackImage}
                    alt={item.product_name}
                    fill
                    sizes="96px"
                    className="object-cover transition duration-300 hover:scale-110"
                  />
                </Link>

                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">{item.color_name}</p>
                  <Link href={`/products/${item.product_slug}`}>
                    <h2 className="text-xl font-semibold text-white transition hover:text-red-400">{item.product_name}</h2>
                  </Link>
                  <p className="text-sm text-white/60">
                    Size {item.size} | ${item.unit_price}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCartItem.mutate({ item_id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    className="h-9 w-9 rounded-full border border-white/25 transition hover:border-white/50 hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartItem.mutate({ item_id: item.id, quantity: item.quantity + 1 })}
                    className="h-9 w-9 rounded-full border border-white/25 transition hover:border-white/50 hover:bg-white/10"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-red-500">${item.total_price}</p>
                  <button
                    onClick={() => removeCartItem.mutate(item.id)}
                    className="text-xs uppercase tracking-[0.2em] text-white/55 transition hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="card-surface h-fit space-y-4 p-6">
          <h3 className="font-display text-3xl uppercase">Summary</h3>
          <div className="space-y-2 text-sm text-white/75">
            <p className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-emerald-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </p>
            <p className="flex items-center justify-between border-t border-white/15 pt-2 text-base font-semibold text-white">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </p>
          </div>

          {shipping > 0 && (
            <p className="text-xs text-emerald-300/80">
              Add ${(200 - subtotal).toFixed(2)} more for free shipping!
            </p>
          )}

          <Link href="/checkout" className="block rounded-full bg-red-600 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-red-500">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="block text-center text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
