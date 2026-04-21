"use client";

import Link from "next/link";

import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { data: cart, isLoading, updateCartItem, removeCartItem } = useCart();

  const subtotal = Number(cart?.subtotal || 0);
  const shipping = subtotal >= 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return <div className="container-shell py-12 text-white/60">Loading cart...</div>;
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
          {cart.items.map((item) => (
            <article key={item.id} className="card-surface flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">{item.color_name}</p>
                <h2 className="text-xl font-semibold text-white">{item.product_name}</h2>
                <p className="text-sm text-white/60">
                  Size {item.size} | ${item.unit_price}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateCartItem.mutate({ item_id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                  className="h-9 w-9 rounded-full border border-white/25"
                >
                  -
                </button>
                <span className="min-w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartItem.mutate({ item_id: item.id, quantity: item.quantity + 1 })}
                  className="h-9 w-9 rounded-full border border-white/25"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-red-500">${item.total_price}</p>
                <button
                  onClick={() => removeCartItem.mutate(item.id)}
                  className="text-xs uppercase tracking-[0.2em] text-white/55 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
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
              <span>${shipping.toFixed(2)}</span>
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

          <Link href="/checkout" className="block rounded-full bg-red-600 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-white">
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
