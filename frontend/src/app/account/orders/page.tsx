"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { api } from "@/lib/api";

interface AccountOrder {
  id: number;
  order_number: string;
  status: string;
  grand_total: string;
  created_at: string;
}

export default function AccountOrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders/");
      return (response.data.results ?? response.data) as AccountOrder[];
    },
  });

  const orders = ordersQuery.data || [];

  return (
    <section className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <AccountSidebar activeTab="orders" />

        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface p-6">
            <h1 className="mb-6 font-display text-4xl uppercase">Your Orders</h1>

            {ordersQuery.isLoading ? (
              <p className="text-white/60">Loading orders...</p>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition hover:border-red-500 hover:bg-red-500/10"
                  >
                    <div>
                      <p className="font-semibold text-white">{order.order_number}</p>
                      <p className="text-sm text-white/60">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">${order.grand_total}</p>
                      <p className="text-xs uppercase tracking-[0.1em] text-white/50">{order.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p className="text-white/60">You have not placed any orders yet.</p>
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
