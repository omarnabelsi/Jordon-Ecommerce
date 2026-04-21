"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderQuery = useQuery({
    queryKey: ["order", params.id],
    queryFn: async () => {
      const response = await api.get(`/orders/${params.id}/`);
      return response.data;
    }
  });

  const order = orderQuery.data;

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Order Detail</h1>
      {!order ? <p className="text-white/60">Loading order...</p> : null}

      {order ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="card-surface space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">{order.order_number}</p>
              <p className="mt-1 text-sm text-white/75">Status: {order.status}</p>
            </div>

            <div className="space-y-2">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b border-white/10 pb-2 text-sm">
                  <span>
                    {item.product_name} x {item.quantity}
                  </span>
                  <span>${item.total_price}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="card-surface space-y-2 p-6 text-sm text-white/80">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>${order.total_amount}</span>
            </p>
            <p className="flex justify-between">
              <span>Shipping</span>
              <span>${order.shipping_amount}</span>
            </p>
            <p className="flex justify-between">
              <span>Tax</span>
              <span>${order.tax_amount}</span>
            </p>
            <p className="flex justify-between border-t border-white/20 pt-2 text-base font-bold text-white">
              <span>Total</span>
              <span>${order.grand_total}</span>
            </p>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
