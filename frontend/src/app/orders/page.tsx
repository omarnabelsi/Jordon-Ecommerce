"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export default function OrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders/");
      return response.data.results ?? response.data;
    }
  });

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Order History</h1>
      <div className="space-y-3">
        {(ordersQuery.data || []).map((order: any) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card-surface block p-5 hover:border-red-500/60">
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">{order.order_number}</p>
            <p className="mt-2 flex items-center justify-between">
              <span className="text-white/85">{order.status}</span>
              <span className="text-red-500 font-bold">${order.grand_total}</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
