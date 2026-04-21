"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";

import { api } from "@/lib/api";
import {
  AdminLookupData,
  AdminOrderDetail,
  AdminPaginatedOrders
} from "@/types/admin";

const statusTone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-200",
  paid: "bg-red-500/15 text-red-200",
  processing: "bg-red-700/20 text-red-200",
  shipped: "bg-rose-500/15 text-rose-200",
  delivered: "bg-emerald-500/15 text-emerald-200",
  cancelled: "bg-rose-500/15 text-rose-200"
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [statusValue, setStatusValue] = useState("pending");
  const [paymentValue, setPaymentValue] = useState("pending");
  const [trackingValue, setTrackingValue] = useState("");
  const [notesValue, setNotesValue] = useState("");

  const lookupsQuery = useQuery({
    queryKey: ["admin-lookups"],
    queryFn: async () => {
      const response = await api.get<AdminLookupData>("/admin/lookups/");
      return response.data;
    }
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", page, search, statusFilter, paymentFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (paymentFilter !== "all") {
        params.payment_status = paymentFilter;
      }
      const response = await api.get<AdminPaginatedOrders>("/admin/orders/", { params });
      return response.data;
    }
  });

  const selectedOrderQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: async () => {
      const response = await api.get<AdminOrderDetail>(`/admin/orders/${selectedOrderId}/`);
      return response.data;
    },
    enabled: selectedOrderId !== null
  });

  useEffect(() => {
    if (!selectedOrderQuery.data) {
      return;
    }

    setStatusValue(selectedOrderQuery.data.status);
    setPaymentValue(selectedOrderQuery.data.payment_status);
    setTrackingValue(selectedOrderQuery.data.tracking_number || "");
    setNotesValue(selectedOrderQuery.data.notes || "");
  }, [selectedOrderQuery.data]);

  const updateOrderMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      if (!selectedOrderId) {
        return;
      }
      await api.patch(`/admin/orders/${selectedOrderId}/status/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const pageCount = useMemo(() => {
    if (!ordersQuery.data) {
      return 1;
    }
    return Math.max(1, Math.ceil(ordersQuery.data.count / 12));
  }, [ordersQuery.data]);

  const exportUrl = useMemo(() => {
    const base = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/orders/export/`;
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (paymentFilter !== "all") {
      params.set("payment_status", paymentFilter);
    }

    const queryString = params.toString();
    return queryString ? `${base}?${queryString}` : base;
  }, [paymentFilter, search, statusFilter]);

  const selectedOrder = selectedOrderQuery.data;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateOrderMutation.mutate({
      status: statusValue,
      payment_status: paymentValue,
      tracking_number: trackingValue,
      notes: notesValue
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <section className="admin-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-200/70">Fulfillment Desk</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Orders</h1>
          </div>

          <a
            href={exportUrl}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by order # or customer email"
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-white"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
          >
            <option value="all">All statuses</option>
            {lookupsQuery.data?.order_statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
          >
            <option value="all">All payments</option>
            {lookupsQuery.data?.payment_statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.data?.results.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`cursor-pointer rounded-xl ${
                    selectedOrderId === order.id
                      ? "bg-red-500/10 ring-1 ring-red-400/40"
                      : "bg-slate-900/65 hover:bg-slate-900"
                  }`}
                >
                  <td className="px-3 py-3 font-semibold text-white">{order.order_number}</td>
                  <td className="px-3 py-3 text-slate-300">{order.customer_email}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone[order.status] || "bg-slate-600/25 text-slate-200"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 capitalize text-slate-300">{order.payment_status}</td>
                  <td className="px-3 py-3 text-slate-300">{order.item_count}</td>
                  <td className="px-3 py-3 text-right font-semibold text-white">${Number(order.grand_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {ordersQuery.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="animate-spin" size={16} /> Loading orders...
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">{ordersQuery.data?.count || 0} orders</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-400">Page {page} of {pageCount}</span>
            <button
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <aside className="admin-card p-5">
        {!selectedOrder ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
            Select an order to inspect items, shipping details, and update fulfillment status.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-200/75">Order Detail</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{selectedOrder.order_number}</h2>
              <p className="mt-1 text-sm text-slate-300">{selectedOrder.customer_email}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Status
                <select
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                >
                  {lookupsQuery.data?.order_statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Payment
                <select
                  value={paymentValue}
                  onChange={(event) => setPaymentValue(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                >
                  {lookupsQuery.data?.payment_statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              Tracking number
              <input
                value={trackingValue}
                onChange={(event) => setTrackingValue(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                placeholder="Carrier tracking ID"
              />
            </label>

            <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              Notes
              <textarea
                value={notesValue}
                onChange={(event) => setNotesValue(event.target.value)}
                className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
              />
            </label>

            <button
              type="submit"
              disabled={updateOrderMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              <Save size={14} /> Save status updates
            </button>

            <div className="rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Order totals</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300">
                <span>Subtotal</span><strong className="text-right text-white">${Number(selectedOrder.total_amount).toFixed(2)}</strong>
                <span>Shipping</span><strong className="text-right text-white">${Number(selectedOrder.shipping_amount).toFixed(2)}</strong>
                <span>Tax</span><strong className="text-right text-white">${Number(selectedOrder.tax_amount).toFixed(2)}</strong>
                <span>Total</span><strong className="text-right text-red-200">${Number(selectedOrder.grand_total).toFixed(2)}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Items</p>
              <ul className="mt-2 space-y-2">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-700 bg-slate-900/65 p-2 text-sm text-slate-200">
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-slate-400">{item.variant_sku}</p>
                    <p className="mt-1 text-xs">Qty {item.quantity} x ${Number(item.unit_price).toFixed(2)} = ${Number(item.total_price).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
