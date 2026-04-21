"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders/");
      return response.data.results ?? response.data;
    }
  });

  if (!user) return null;

  return (
    <section className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <aside className="card-surface h-fit space-y-4 p-6">
          <div className="text-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.email} className="mx-auto h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-red-800 to-red-500 text-3xl font-bold text-white">
                {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
            )}
            <h2 className="mt-4 font-display text-2xl uppercase">
              {user.first_name || ""} {user.last_name || ""}
            </h2>
            <p className="text-sm text-white/60">{user.email}</p>
          </div>

          <hr className="my-4 border-white/10" />

          <nav className="space-y-2">
            <Link href="/account" className="block rounded-lg bg-red-600/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600/30">
              Profile
            </Link>
            <Link href="/account/orders" className="block rounded-lg px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              Orders
            </Link>
            <Link href="/account/addresses" className="block rounded-lg px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              Addresses
            </Link>
            <Link href="/account/wishlist" className="block rounded-lg px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              Wishlist
            </Link>
            <Link href="/account/settings" className="block rounded-lg px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface p-6">
            <h1 className="mb-6 font-display text-4xl uppercase">Profile Information</h1>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-white/70">First Name</label>
                <p className="mt-2 text-lg text-white">{user.first_name || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70">Last Name</label>
                <p className="mt-2 text-lg text-white">{user.last_name || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70">Email</label>
                <p className="mt-2 text-lg text-white">{user.email}</p>
              </div>

              <Link
                href="/account/settings"
                className="inline-block rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-red-700"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="mb-6 font-display text-3xl uppercase">Recent Orders</h2>
            {ordersQuery.isLoading ? (
              <p className="text-white/60">Loading orders...</p>
            ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
              <div className="space-y-3">
                {ordersQuery.data.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition hover:border-red-500 hover:bg-red-500/10"
                  >
                    <div>
                      <p className="font-semibold text-white">Order #{order.id}</p>
                      <p className="text-sm text-white/60">${order.grand_total ?? order.total_amount ?? "0.00"}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.1em] text-white/50">{order.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p className="text-white/60">You haven&apos;t placed any orders yet.</p>
                <Link
                  href="/products"
                  className="mt-4 inline-block rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-red-500 hover:text-white"
                >
                  Start Shopping
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
